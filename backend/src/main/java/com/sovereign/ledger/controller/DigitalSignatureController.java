package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.TransactionLog;
import com.sovereign.ledger.model.TransactionSignatureAudit;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.BankAccountRepository;
import com.sovereign.ledger.repository.TransactionLogRepository;
import com.sovereign.ledger.repository.TransactionSignatureAuditRepository;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.DigitalSignatureService;
import com.sovereign.ledger.service.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/security/signature")
public class DigitalSignatureController {

    @Autowired private DigitalSignatureService digitalSignatureService;
    @Autowired private TransactionSignatureAuditRepository auditRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User getUserFromRequest(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Standalone Verification Endpoint
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifySignature(@RequestBody Map<String, Object> payload, HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            String userEmail = user != null ? user.getEmail() : "anonymous";

            String transactionId = String.valueOf(payload.getOrDefault("transactionId", ""));
            String fromAccount = String.valueOf(payload.getOrDefault("fromAccount", ""));
            String toAccount = String.valueOf(payload.getOrDefault("toAccount", ""));
            BigDecimal amount = new BigDecimal(String.valueOf(payload.getOrDefault("amount", "0")));
            long timestamp = Long.parseLong(String.valueOf(payload.getOrDefault("timestamp", "0")));
            String nonce = String.valueOf(payload.getOrDefault("nonce", ""));
            String transactionHash = String.valueOf(payload.getOrDefault("transactionHash", ""));
            String digitalSignature = String.valueOf(payload.getOrDefault("digitalSignature", ""));
            String publicKey = String.valueOf(payload.getOrDefault("publicKey", ""));

            DigitalSignatureService.VerificationResult result = digitalSignatureService.verifyTransaction(
                transactionId, fromAccount, toAccount, amount, timestamp, nonce,
                transactionHash, digitalSignature, publicKey
            );

            // Record verification audit
            TransactionSignatureAudit audit = digitalSignatureService.recordAudit(
                transactionId, userEmail, fromAccount, toAccount, amount, nonce, timestamp,
                result.getCanonicalPayload(), transactionHash, digitalSignature, publicKey,
                result.getStatus(), result.getMessage(), "USER_VERIFICATION"
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("verified", result.isValid());
            response.put("status", result.getStatus());
            response.put("message", result.getMessage());
            response.put("computedHash", result.getComputedHash());
            response.put("providedHash", transactionHash);
            response.put("canonicalPayload", result.getCanonicalPayload());
            response.put("auditId", audit.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "verified", false,
                "status", "FAILED",
                "message", "Verification failed: " + e.getMessage()
            ));
        }
    }

    /**
     * Verify an existing recorded transaction by transaction ID
     */
    @GetMapping("/verify-tx/{transactionId}")
    public ResponseEntity<?> verifyRecordedTransaction(@PathVariable String transactionId) {
        try {
            TransactionLog tx = transactionLogRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

            String fromAccountNum = tx.getFromAccount() != null ? tx.getFromAccount().getAccountNumber() : "SYSTEM";
            String toAccountNum = tx.getToAccount() != null ? tx.getToAccount().getAccountNumber() : "SYSTEM";

            // If signature is missing
            if (tx.getDigitalSignature() == null || tx.getPublicKey() == null) {
                return ResponseEntity.ok(Map.of(
                    "transactionId", tx.getTransactionId(),
                    "verified", false,
                    "status", "NOT_SIGNED",
                    "message", "This transaction was processed without a client digital signature."
                ));
            }

            long timestamp = tx.getTransactionDate() != null
                ? tx.getTransactionDate().atZone(java.time.ZoneId.systemDefault()).toInstant().getEpochSecond()
                : 0L;

            DigitalSignatureService.VerificationResult result = digitalSignatureService.verifyTransaction(
                tx.getTransactionId(),
                fromAccountNum,
                toAccountNum,
                tx.getAmount(),
                timestamp,
                tx.getNonce() != null ? tx.getNonce() : "",
                tx.getTransactionHash(),
                tx.getDigitalSignature(),
                tx.getPublicKey()
            );

            // Update verification status in transaction if needed
            tx.setSignatureVerified(result.isValid());
            tx.setVerificationTimestamp(java.time.LocalDateTime.now());
            transactionLogRepository.save(tx);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("transactionId", tx.getTransactionId());
            response.put("verified", result.isValid());
            response.put("status", result.getStatus());
            response.put("message", result.getMessage());
            response.put("transactionHash", tx.getTransactionHash());
            response.put("computedHash", result.getComputedHash());
            response.put("publicKey", tx.getPublicKey());
            response.put("blockchainHash", tx.getBlockchainHash());
            response.put("amount", tx.getAmount());
            response.put("type", tx.getType());
            response.put("txStatus", tx.getStatus());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Get user's signed transactions and verification history
     */
    @GetMapping("/my-signatures")
    public ResponseEntity<?> getMySignatures(HttpServletRequest req) {
        User user = getUserFromRequest(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        List<BankAccount> accounts = bankAccountRepository.findByUser(user);
        List<TransactionLog> allLogs = new ArrayList<>();
        for (BankAccount acc : accounts) {
            allLogs.addAll(transactionLogRepository.findByFromAccountOrToAccountOrderByTransactionDateDesc(acc, acc));
        }

        // Filter and map transactions with digital signatures
        List<Map<String, Object>> list = new ArrayList<>();
        for (TransactionLog tx : allLogs) {
            if (tx.getDigitalSignature() != null || tx.getTransactionHash() != null) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("transactionId", tx.getTransactionId());
                item.put("type", tx.getType());
                item.put("amount", tx.getAmount());
                item.put("status", tx.getStatus());
                item.put("transactionDate", tx.getTransactionDate());
                item.put("transactionHash", tx.getTransactionHash());
                item.put("signatureVerified", Boolean.TRUE.equals(tx.getSignatureVerified()));
                item.put("digitalSignature", tx.getDigitalSignature());
                item.put("publicKey", tx.getPublicKey());
                item.put("blockchainHash", tx.getBlockchainHash());
                list.add(item);
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "signatures", list));
    }

    /**
     * Simulation tool for testing tampered transactions
     */
    @PostMapping("/test-tamper")
    public ResponseEntity<?> testTamperedTransaction(@RequestBody Map<String, Object> payload) {
        try {
            String transactionId = String.valueOf(payload.getOrDefault("transactionId", "TXN-TEST-100"));
            String fromAccount = String.valueOf(payload.getOrDefault("fromAccount", "1001-0000-001"));
            String toAccount = String.valueOf(payload.getOrDefault("toAccount", "1002-0000-002"));
            BigDecimal originalAmount = new BigDecimal(String.valueOf(payload.getOrDefault("originalAmount", "1000.00")));
            BigDecimal tamperedAmount = new BigDecimal(String.valueOf(payload.getOrDefault("tamperedAmount", "99999.00")));
            long timestamp = Long.parseLong(String.valueOf(payload.getOrDefault("timestamp", String.valueOf(System.currentTimeMillis() / 1000))));
            String nonce = String.valueOf(payload.getOrDefault("nonce", "nonce-" + UUID.randomUUID().toString().substring(0, 8)));
            String digitalSignature = String.valueOf(payload.getOrDefault("digitalSignature", ""));
            String publicKey = String.valueOf(payload.getOrDefault("publicKey", ""));

            // Calculate original valid hash
            String origCanonical = digitalSignatureService.createCanonicalRepresentation(
                transactionId, fromAccount, toAccount, originalAmount, timestamp, nonce
            );
            String originalHash = digitalSignatureService.computeSha256(origCanonical);

            // Now test verification with the TAMPERED amount
            DigitalSignatureService.VerificationResult tamperedResult = digitalSignatureService.verifyTransaction(
                transactionId, fromAccount, toAccount, tamperedAmount, timestamp, nonce,
                originalHash, digitalSignature, publicKey
            );

            digitalSignatureService.recordAudit(
                transactionId, "tamper_test@vaultchain.bank", fromAccount, toAccount, tamperedAmount,
                nonce, timestamp, tamperedResult.getCanonicalPayload(), originalHash, digitalSignature,
                publicKey, tamperedResult.getStatus(), tamperedResult.getMessage(), "SYSTEM_TAMPER_TEST"
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("tamperDetected", !tamperedResult.isValid());
            response.put("status", tamperedResult.getStatus());
            response.put("reason", tamperedResult.getMessage());
            response.put("originalAmount", originalAmount);
            response.put("tamperedAmount", tamperedAmount);
            response.put("originalHash", originalHash);
            response.put("tamperedComputedHash", tamperedResult.getComputedHash());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
