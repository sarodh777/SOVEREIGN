package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.InternationalTransfer;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.InternationalTransferService;
import com.sovereign.ledger.service.JwtUtil;
import com.sovereign.ledger.service.TransactionPinService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/international")
@CrossOrigin(origins = "*")
public class InternationalTransferController {

    @Autowired private InternationalTransferService internationalTransferService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private TransactionPinService pinService;

    private User getUser(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    // ─── GET SUPPORTED CURRENCIES ─────────────────────────────────────────────
    @GetMapping("/currencies")
    public ResponseEntity<?> getCurrencies() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "baseCurrency", "INR",
            "isSimulated", true,
            "source", "VAULTCHAIN FX Demo Engine (Simulated Rates)",
            "currencies", internationalTransferService.getSupportedCurrencies()
        ));
    }

    // ─── CALCULATE FX QUOTE ──────────────────────────────────────────────────
    @PostMapping("/quote")
    public ResponseEntity<?> getQuote(@RequestBody Map<String, String> payload) {
        try {
            BigDecimal amount = new BigDecimal(payload.get("sendAmount"));
            String targetCurrency = payload.get("targetCurrency");
            Map<String, Object> quote = internationalTransferService.calculateQuote(amount, "INR", targetCurrency);
            quote.put("success", true);
            return ResponseEntity.ok(quote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid quote calculation: " + e.getMessage()));
        }
    }

    // ─── EXECUTE INTERNATIONAL TRANSFER ───────────────────────────────────────
    @PostMapping("/transfer")
    public ResponseEntity<?> submitTransfer(@RequestBody Map<String, String> payload, HttpServletRequest req) {
        try {
            User user = getUser(req);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            // Optional PIN verification check if user provided a PIN
            String rawPin = payload.get("pin");
            if (rawPin != null && !rawPin.isBlank()) {
                if (!pinService.verifyPin(user, rawPin)) {
                    return ResponseEntity.status(403).body(Map.of("success", false, "message", "Incorrect transaction PIN"));
                }
            }

            Long fromAccountId = Long.parseLong(payload.get("fromAccountId"));
            String recipientName = payload.get("recipientName");
            String recipientCountry = payload.get("recipientCountry");
            String recipientBankName = payload.get("recipientBankName");
            String recipientAccountNumber = payload.get("recipientAccountNumber");
            String swiftBic = payload.get("swiftBic");
            BigDecimal sendAmount = new BigDecimal(payload.get("sendAmount"));
            String targetCurrency = payload.get("targetCurrency");
            String transferPurpose = payload.get("transferPurpose");
            String paymentReference = payload.get("paymentReference");
            String idempotencyKey = payload.get("idempotencyKey");

            // Digital signature fields
            String digitalSignature = payload.get("digitalSignature");
            String publicKey = payload.get("publicKey");
            String transactionHash = payload.get("transactionHash");

            if (recipientName == null || recipientName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient name is required"));
            }
            if (recipientCountry == null || recipientCountry.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Destination country is required"));
            }
            if (recipientBankName == null || recipientBankName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient bank name is required"));
            }
            if (recipientAccountNumber == null || recipientAccountNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient account or IBAN is required"));
            }

            Map<String, Object> result = internationalTransferService.executeTransfer(
                user,
                fromAccountId,
                recipientName,
                recipientCountry,
                recipientBankName,
                recipientAccountNumber,
                swiftBic,
                sendAmount,
                targetCurrency,
                transferPurpose,
                paymentReference,
                idempotencyKey,
                digitalSignature,
                publicKey,
                transactionHash
            );

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Transfer failed: " + e.getMessage()));
        }
    }

    // ─── GET TRANSFER HISTORY WITH FILTERS ────────────────────────────────────
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            HttpServletRequest req
    ) {
        User user = getUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        List<Map<String, Object>> transfers = internationalTransferService.getTransferHistory(
                user, status, currency, country, startDate, endDate
        );
        return ResponseEntity.ok(Map.of("success", true, "transfers", transfers));
    }

    // ─── GET SINGLE TRANSFER DETAILS ──────────────────────────────────────────
    @GetMapping("/{txId}")
    public ResponseEntity<?> getTransferDetails(@PathVariable String txId, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        Optional<InternationalTransfer> opt = internationalTransferService.getTransferByTxId(user, txId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "International transfer not found"));
        }

        InternationalTransfer it = opt.get();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("id", it.getId());
        m.put("transactionId", it.getTransactionId());
        m.put("senderName", it.getUser().getName());
        m.put("senderEmail", it.getUser().getEmail());
        m.put("fromAccountNumber", it.getFromAccount().getAccountNumber());
        m.put("recipientName", it.getRecipientName());
        m.put("recipientCountry", it.getRecipientCountry());
        m.put("recipientBankName", it.getRecipientBankName());
        m.put("recipientAccountNumberMasked", it.getRecipientAccountNumberMasked());
        m.put("swiftBic", it.getSwiftBic());
        m.put("sendAmount", it.getSendAmount());
        m.put("sendCurrency", it.getSendCurrency());
        m.put("targetCurrency", it.getTargetCurrency());
        m.put("exchangeRate", it.getExchangeRate());
        m.put("recipientAmount", it.getRecipientAmount());
        m.put("fee", it.getFee());
        m.put("totalPayable", it.getTotalPayable());
        m.put("transferPurpose", it.getTransferPurpose());
        m.put("paymentReference", it.getPaymentReference());
        m.put("status", it.getStatus());
        m.put("estimatedDelivery", it.getEstimatedDelivery());
        m.put("rateSource", it.getRateSource());
        m.put("isSimulated", it.getIsSimulated());
        m.put("blockchainHash", it.getBlockchainHash());
        m.put("signatureVerified", it.getSignatureVerified());
        m.put("digitalSignature", it.getDigitalSignature());
        m.put("transactionHash", it.getTransactionHash());
        m.put("createdAt", it.getCreatedAt());
        m.put("completedAt", it.getCompletedAt());

        return ResponseEntity.ok(m);
    }

    // ─── SIMULATE STATUS TRANSITION / TRACKING ────────────────────────────────
    @PostMapping("/{txId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String txId,
                                          @RequestBody Map<String, String> body,
                                          HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "New status is required"));
        }

        try {
            InternationalTransfer updated = internationalTransferService.updateStatus(user, txId, newStatus);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "transactionId", updated.getTransactionId(),
                "status", updated.getStatus(),
                "message", "Transfer status updated to " + updated.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
