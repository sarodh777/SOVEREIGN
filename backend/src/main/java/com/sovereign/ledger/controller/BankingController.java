package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import com.sovereign.ledger.service.BankingService;
import com.sovereign.ledger.service.JwtUtil;
import com.sovereign.ledger.service.KYCService;
import com.sovereign.ledger.service.EmailService;
import com.sovereign.ledger.service.FinancialScoreService;
import com.sovereign.ledger.service.DigitalSignatureService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/banking")
@CrossOrigin(origins = "*")
public class BankingController {

    @Autowired private BankingService bankingService;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private KYCService kycService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private BlockRepository blockRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private EmailService emailService;
    @Autowired private FinancialScoreService financialScoreService;
    @Autowired private com.sovereign.ledger.service.FraudDetectionService fraudDetectionService;
    @Autowired private FraudAlertRepository fraudAlertRepository;
    @Autowired private com.sovereign.ledger.service.DigitalSignatureService digitalSignatureService;

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    private User getUserFromRequest(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    // ─── CREATE BANK ACCOUNT ─────────────────────────────────────────────────────
    @PostMapping("/account/create")
    public ResponseEntity<?> createBankAccount(@RequestBody Map<String, String> payload,
                                                HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            String accountType = payload.getOrDefault("accountType", "SAVINGS");
            BankAccount account = bankingService.createBankAccount(user, accountType);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Bank account created successfully",
                "accountId", account.getId(),
                "accountNumber", account.getAccountNumber(),
                "accountType", account.getAccountType(),
                "iban", account.getIban()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── GET USER ACCOUNTS ───────────────────────────────────────────────────────
    @GetMapping("/accounts")
    public ResponseEntity<?> getMyAccounts(HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            List<BankAccount> accounts = bankAccountRepository.findByUser(user);

            List<Map<String, Object>> result = accounts.stream().map(acc -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", acc.getId());
                m.put("accountNumber", acc.getAccountNumber());
                m.put("accountType", acc.getAccountType());
                m.put("balance", acc.getBalance());
                m.put("currency", acc.getCurrency());
                m.put("status", acc.getStatus());
                m.put("iban", acc.getIban());
                m.put("overdraftLimit", acc.getOverdraftLimit());
                m.put("createdAt", acc.getCreatedAt());
                m.put("lastTransactionAt", acc.getLastTransactionAt());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("success", true, "accounts", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── GET ACCOUNTS BY EMAIL (legacy support) ─────────────────────────────────
    @GetMapping("/accounts/{email}")
    public ResponseEntity<?> getUserAccounts(@PathVariable String email) {
        try {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            List<BankAccount> accounts = bankAccountRepository.findByUser(user);
            return ResponseEntity.ok(Map.of("success", true, "accounts", accounts));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── RECIPIENT LOOKUP BY EMAIL ────────────────────────────────────────────────
    @GetMapping("/lookup/recipient")
    public ResponseEntity<?> lookupRecipient(@RequestParam String email,
                                              HttpServletRequest req) {
        try {
            User caller = getUserFromRequest(req);
            if (caller == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

            User recipient = userRepository.findByEmail(email.trim()).orElse(null);
            if (recipient == null)
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "No account found with that email"));

            if (recipient.getId().equals(caller.getId()))
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "You cannot transfer to yourself"));

            List<BankAccount> accounts = bankAccountRepository.findByUser(recipient);
            if (accounts.isEmpty())
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Recipient has no bank account"));

            BankAccount acc = accounts.get(0);
            if (!"ACTIVE".equals(acc.getStatus()))
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient account is not active"));

            String raw = acc.getAccountNumber();
            String masked = raw.length() > 7
                ? raw.substring(0, 4) + "-****-" + raw.substring(raw.length() - 3)
                : raw;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("recipientName", recipient.getName());
            result.put("accountId", acc.getId());
            result.put("accountNumber", raw);
            result.put("accountNumberMasked", masked);
            result.put("accountType", acc.getAccountType());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }


    @GetMapping("/balance/{accountId}")
    public ResponseEntity<?> getBalance(@PathVariable Long accountId) {
        return ResponseEntity.ok(bankingService.getBalance(accountId));
    }

    // ─── FRAUD PRE-CHECK ────────────────────────────────────────────────────────
    @PostMapping("/transfer/pre-check")
    public ResponseEntity<?> preCheckTransfer(@RequestBody Map<String, String> payload,
                                               HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long fromAccountId = Long.parseLong(payload.get("fromAccountId"));
            Long toAccountId   = Long.parseLong(payload.get("toAccountId"));
            BigDecimal amount  = new BigDecimal(payload.get("amount"));

            BankAccount fromAccount = bankAccountRepository.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!fromAccount.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            BankAccount toAccount = bankAccountRepository.findById(toAccountId).orElse(null);

            com.sovereign.ledger.service.FraudDetectionService.FraudEvaluation eval =
                fraudDetectionService.evaluateTransaction(fromAccount, toAccount, amount, "TRANSFER", user);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("riskScore", eval.getRiskScore());
            result.put("riskLevel", eval.getRiskLevel());
            result.put("recommendedAction", eval.getRecommendedAction());
            result.put("reasons", eval.getReasons());
            result.put("requiresVerification", eval.isMediumRisk());
            result.put("willHold", eval.isHighRisk());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── TRANSFER ────────────────────────────────────────────────────────────────
    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, String> payload,
                                       HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long fromAccountId = Long.parseLong(payload.get("fromAccountId"));
            Long toAccountId   = Long.parseLong(payload.get("toAccountId"));
            BigDecimal amount  = new BigDecimal(payload.get("amount"));
            String reference   = payload.getOrDefault("reference", "Transfer");

            BankAccount fromAccount = bankAccountRepository.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!fromAccount.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            BankAccount toAccount = bankAccountRepository.findById(toAccountId).orElse(null);

            // ─── DIGITAL SIGNATURE VERIFICATION ───────────────────────────────────────
            String digitalSignature = payload.get("digitalSignature");
            String publicKey        = payload.get("publicKey");
            String transactionHash  = payload.get("transactionHash");
            String clientTxId       = payload.get("transactionId");
            String nonce            = payload.get("nonce");
            String timestampStr     = payload.get("timestamp");

            long signatureTimestamp = 0;
            if (timestampStr != null && !timestampStr.isEmpty()) {
                try { signatureTimestamp = Long.parseLong(timestampStr); } catch (Exception ignored) {}
            }

            boolean hasDigitalSignature = (digitalSignature != null && !digitalSignature.trim().isEmpty());
            DigitalSignatureService.VerificationResult sigResult = null;

            if (hasDigitalSignature) {
                String fromAccNum = fromAccount.getAccountNumber();
                String toAccNum   = toAccount != null ? toAccount.getAccountNumber() : "UNKNOWN";

                sigResult = digitalSignatureService.verifyTransaction(
                    clientTxId != null ? clientTxId : "",
                    fromAccNum,
                    toAccNum,
                    amount,
                    signatureTimestamp,
                    nonce != null ? nonce : "",
                    transactionHash,
                    digitalSignature,
                    publicKey
                );

                // Record audit for this attempt
                digitalSignatureService.recordAudit(
                    clientTxId != null && !clientTxId.isEmpty() ? clientTxId : "TXN-SIGN-" + UUID.randomUUID().toString().substring(0, 8),
                    user.getEmail(),
                    fromAccNum,
                    toAccNum,
                    amount,
                    nonce,
                    signatureTimestamp,
                    sigResult.getCanonicalPayload(),
                    transactionHash,
                    digitalSignature,
                    publicKey,
                    sigResult.getStatus(),
                    sigResult.getMessage(),
                    "SYSTEM_EXECUTION"
                );

                // If invalid or tampered, REJECT IMMEDIATELY!
                if (!sigResult.isValid()) {
                    return ResponseEntity.status(400).body(Map.of(
                        "success", false,
                        "verificationFailed", true,
                        "verificationStatus", sigResult.getStatus(),
                        "message", "Digital signature verification failed: " + sigResult.getMessage(),
                        "reason", sigResult.getMessage(),
                        "computedHash", sigResult.getComputedHash(),
                        "providedHash", transactionHash != null ? transactionHash : ""
                    ));
                }
            }

            // ─── AI FRAUD DETECTION EVALUATION ───────────────────────────────────────
            com.sovereign.ledger.service.FraudDetectionService.FraudEvaluation eval =
                fraudDetectionService.evaluateTransaction(fromAccount, toAccount, amount, "TRANSFER", user);

            // 1. HIGH RISK: TEMPORARILY HOLD TRANSACTION FOR ADMIN VERIFICATION
            if (eval.isHighRisk()) {
                String txId = "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

                TransactionLog heldTx = new TransactionLog();
                heldTx.setTransactionId(txId);
                heldTx.setFromAccount(fromAccount);
                heldTx.setToAccount(toAccount);
                heldTx.setAmount(amount);
                heldTx.setType("TRANSFER");
                heldTx.setStatus("HELD");
                heldTx.setReference(reference);
                heldTx.setDescription("Temporarily held by AI Fraud Detection Engine for review. Reasons: " + String.join(", ", eval.getReasons()));
                heldTx.setFee(BigDecimal.ZERO);
                heldTx.setTransactionDate(LocalDateTime.now());
                transactionLogRepository.save(heldTx);

                fraudDetectionService.recordFraudAlert(txId, user, fromAccount, toAccount, amount, "TRANSFER", eval, reference);

                try {
                    emailService.sendSecurityAlert(
                        user.getEmail(),
                        user.getName(),
                        "Transfer Held for Review (" + txId + ")",
                        "Your transfer of ₹" + amount + " has been temporarily held by our AI Fraud Surveillance System for security review. Reasons: " + String.join("; ", eval.getReasons())
                    );
                } catch (Exception ignored) {}

                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "held", true,
                    "transactionId", txId,
                    "riskScore", eval.getRiskScore(),
                    "riskLevel", eval.getRiskLevel(),
                    "message", "Transaction temporarily held by AI Fraud Detection System for verification. Our security team will review it.",
                    "reasons", eval.getReasons()
                ));
            }

            // 2. MEDIUM RISK: REQUIRE ADDITIONAL USER AUTHENTICATION
            boolean verificationConfirmed = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("verificationConfirmed", "false")));
            if (eval.isMediumRisk() && !verificationConfirmed) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "requiresVerification", true,
                    "riskScore", eval.getRiskScore(),
                    "riskLevel", eval.getRiskLevel(),
                    "message", "Additional security authentication required before this transaction can proceed.",
                    "reasons", eval.getReasons()
                ));
            }

            // 3. LOW RISK OR VERIFIED: EXECUTE TRANSFER
            Map<String, Object> response = bankingService.transferMoney(fromAccountId, toAccountId, amount, reference);

            // ── Post-transfer: record alert, audit, emails + score ───────────
            if (Boolean.TRUE.equals(response.get("success"))) {
                String txId  = String.valueOf(response.get("transactionId"));
                String date  = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

                // Record fraud surveillance alert
                FraudAlert alert = fraudDetectionService.recordFraudAlert(
                    txId, user, fromAccount, toAccount, amount, "TRANSFER", eval, reference
                );
                if (verificationConfirmed) {
                    alert.setStatus("VERIFIED_BY_USER");
                    alert.setActionTaken("VERIFIED_BY_USER");
                }

                // Look up to-account for receiver info
                String receiverName  = toAccount != null && toAccount.getUser() != null ? toAccount.getUser().getName() : "Unknown";
                String receiverEmail = toAccount != null && toAccount.getUser() != null ? toAccount.getUser().getEmail() : null;

                BigDecimal remainingBalance = fromAccount.getBalance();
                try { remainingBalance = bankAccountRepository.findById(fromAccountId).map(BankAccount::getBalance).orElse(amount); } catch (Exception ignored){}

                // Get blockchain hash and attach digital signature from last saved tx
                String blockHash = null;
                try {
                    var optTx = transactionLogRepository.findByTransactionId(txId);
                    if (optTx.isPresent()) {
                        TransactionLog tx = optTx.get();
                        blockHash = tx.getBlockchainHash();
                        if (alert != null) {
                            alert.setBlockchainHash(blockHash);
                        }
                        if (hasDigitalSignature) {
                            tx.setDigitalSignature(digitalSignature);
                            tx.setPublicKey(publicKey);
                            tx.setTransactionHash(transactionHash != null ? transactionHash : (sigResult != null ? sigResult.getComputedHash() : null));
                            tx.setNonce(nonce);
                            tx.setSignatureVerified(true);
                            tx.setVerificationTimestamp(LocalDateTime.now());
                            transactionLogRepository.save(tx);

                            response.put("signatureVerified", true);
                            response.put("transactionHash", tx.getTransactionHash());
                        }
                    }
                } catch (Exception ignored){}

                if (alert != null) {
                    fraudAlertRepository.save(alert);
                }

                // Sender email
                try {
                    emailService.sendTransactionConfirmationSender(
                        user.getEmail(), user.getName(), receiverName,
                        amount, txId, date, remainingBalance, blockHash
                    );
                } catch (Exception ignored) {}

                // Receiver email
                if (receiverEmail != null) {
                    try {
                        emailService.sendTransactionConfirmationReceiver(
                            receiverEmail, receiverName, user.getName(),
                            amount, txId, date, blockHash
                        );
                    } catch (Exception ignored) {}
                }

                // Update financial score
                try {
                    financialScoreService.recordEvent(
                        user,
                        FinancialScoreService.DELTA_TRANSFER_SUCCESS,
                        "Successful transfer: " + reference,
                        "TRANSFER_SUCCESS"
                    );
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── DEPOSIT ─────────────────────────────────────────────────────────────────
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, String> payload,
                                      HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long accountId    = Long.parseLong(payload.get("accountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference  = payload.getOrDefault("reference", "Deposit");

            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!account.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            return ResponseEntity.ok(bankingService.deposit(accountId, amount, reference));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── TRANSACTIONS ────────────────────────────────────────────────────────────
    @GetMapping("/transactions/{accountId}")
    public ResponseEntity<?> getTransactionHistory(@PathVariable Long accountId,
                                                    HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!account.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            List<Map<String, Object>> transactions = bankingService.getTransactionHistory(accountId);
            return ResponseEntity.ok(Map.of("success", true, "transactions", transactions));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── BLOCKCHAIN EXPLORER ─────────────────────────────────────────────────────
    @GetMapping("/blockchain/blocks")
    public ResponseEntity<?> getBlocks(HttpServletRequest req) {
        try {
            syncBlocksIfEmpty();

            List<Block> allDbBlocks = blockRepository.findAll();
            List<Map<String, Object>> blocks = allDbBlocks.stream().map(block -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", block.getId());
                m.put("hash", block.getHash());
                m.put("previousHash", block.getPreviousHash());
                m.put("timestamp", block.getTimestamp());
                m.put("transactionCount", block.getId() == 1 ? 0 : 1);
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("success", true, "blocks", blocks, "chainLength", blocks.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private synchronized void syncBlocksIfEmpty() {
        if (blockRepository.count() > 0) return;

        Block genesis = new Block("0x0000000000000000000000000000000000000000000000000000000000000000",
                                  "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
        genesis.setTimestamp(LocalDateTime.now().minusHours(24));
        blockRepository.save(genesis);

        String previousHash = genesis.getHash();

        List<TransactionLog> logs = transactionLogRepository.findAll().stream()
            .sorted(Comparator.comparing(TransactionLog::getId))
            .collect(Collectors.toList());

        for (TransactionLog log : logs) {
            String hash = log.getBlockchainHash();
            if (hash == null || hash.isEmpty() || !hash.startsWith("0x")) {
                try {
                    String raw = previousHash + ":" + log.getTransactionId() + ":" + log.getAmount() + ":" + log.getCompletedDate();
                    java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
                    byte[] d = md.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder("0x");
                    for (byte b : d) sb.append(String.format("%02x", b));
                    hash = sb.toString();
                    log.setBlockchainHash(hash);
                    transactionLogRepository.save(log);
                } catch (Exception ignored) {
                    hash = "0x" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
                }
            }

            Block block = new Block(previousHash, hash);
            block.setTimestamp(log.getCompletedDate() != null ? log.getCompletedDate() : LocalDateTime.now());
            blockRepository.save(block);
            previousHash = hash;
        }
    }

    // ─── KYC ─────────────────────────────────────────────────────────────────────
    @PostMapping("/kyc/verify")
    public ResponseEntity<?> verifyKYC(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String fullName = payload.get("fullName");
            String documentId = payload.get("documentId");
            Map<String, Object> response = kycService.verifyKYC(email, fullName, documentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/aml/check")
    public ResponseEntity<?> checkAML(@RequestBody Map<String, String> payload) {
        try {
            String amount = payload.get("amount");
            String destinationCountry = payload.get("destinationCountry");
            Map<String, Object> response = kycService.checkAML(amount, destinationCountry);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── USER FRAUD ALERTS NOTICES ───────────────────────────────────────────────
    @GetMapping("/fraud/alerts")
    public ResponseEntity<?> getMyFraudAlerts(HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            List<FraudAlert> alerts = fraudAlertRepository.findByUserOrderByCreatedAtDesc(user);
            List<Map<String, Object>> result = alerts.stream().map(a -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", a.getId());
                m.put("transactionId", a.getTransactionId());
                m.put("amount", a.getAmount());
                m.put("riskLevel", a.getRiskLevel());
                m.put("riskScore", a.getRiskScore());
                m.put("status", a.getStatus());
                m.put("actionTaken", a.getActionTaken());
                m.put("createdAt", a.getCreatedAt());
                m.put("reference", a.getReference());
                m.put("reasons", a.getReasons());
                m.put("adminDecision", a.getAdminDecision());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("success", true, "alerts", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
