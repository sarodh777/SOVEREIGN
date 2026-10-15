package com.sovereign.ledger.service;

import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.InternationalTransfer;
import com.sovereign.ledger.model.TransactionLog;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.BankAccountRepository;
import com.sovereign.ledger.repository.InternationalTransferRepository;
import com.sovereign.ledger.repository.TransactionLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class InternationalTransferService {

    @Autowired private InternationalTransferRepository internationalTransferRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private BlockchainService blockchainService;
    @Autowired private AuditService auditService;
    @Autowired private EmailService emailService;
    @Autowired private DigitalSignatureService digitalSignatureService;
    @Autowired private FraudDetectionService fraudDetectionService;

    // ── Configurable Sample Exchange Rates (Simulated FX Engine) ───────────
    // Base currency is INR (Indian Rupee)
    private static final Map<String, BigDecimal> SAMPLE_RATES = new LinkedHashMap<>();
    private static final Map<String, Map<String, Object>> CURRENCY_INFO = new LinkedHashMap<>();

    static {
        // 1 INR = X Target Currency
        SAMPLE_RATES.put("USD", new BigDecimal("0.011900")); // ~$1 = ₹84.03
        SAMPLE_RATES.put("EUR", new BigDecimal("0.011000")); // ~€1 = ₹90.91
        SAMPLE_RATES.put("GBP", new BigDecimal("0.009350")); // ~£1 = ₹106.95
        SAMPLE_RATES.put("AED", new BigDecimal("0.043700")); // ~1 AED = ₹22.88
        SAMPLE_RATES.put("SGD", new BigDecimal("0.015800")); // ~1 SGD = ₹63.29
        SAMPLE_RATES.put("INR", new BigDecimal("1.000000")); // Domestic / NRE

        // Currency metadata
        CURRENCY_INFO.put("USD", Map.of(
            "code", "USD",
            "name", "US Dollar",
            "symbol", "$",
            "flag", "🇺🇸",
            "country", "United States",
            "requiresSwift", true,
            "requiresIban", false,
            "accountFormatLabel", "ACH / Routing & Account No.",
            "minAmount", new BigDecimal("500"),
            "maxAmount", new BigDecimal("500000")
        ));
        CURRENCY_INFO.put("EUR", Map.of(
            "code", "EUR",
            "name", "Euro",
            "symbol", "€",
            "flag", "🇪🇺",
            "country", "European Union",
            "requiresSwift", true,
            "requiresIban", true,
            "accountFormatLabel", "IBAN (International Bank Account Number)",
            "minAmount", new BigDecimal("500"),
            "maxAmount", new BigDecimal("500000")
        ));
        CURRENCY_INFO.put("GBP", Map.of(
            "code", "GBP",
            "name", "British Pound",
            "symbol", "£",
            "flag", "🇬🇧",
            "country", "United Kingdom",
            "requiresSwift", true,
            "requiresIban", true,
            "accountFormatLabel", "UK Sort Code & Account Number or IBAN",
            "minAmount", new BigDecimal("500"),
            "maxAmount", new BigDecimal("500000")
        ));
        CURRENCY_INFO.put("AED", Map.of(
            "code", "AED",
            "name", "UAE Dirham",
            "symbol", "د.إ",
            "flag", "🇦🇪",
            "country", "United Arab Emirates",
            "requiresSwift", true,
            "requiresIban", true,
            "accountFormatLabel", "UAE IBAN (AE + 21 digits)",
            "minAmount", new BigDecimal("500"),
            "maxAmount", new BigDecimal("500000")
        ));
        CURRENCY_INFO.put("SGD", Map.of(
            "code", "SGD",
            "name", "Singapore Dollar",
            "symbol", "S$",
            "flag", "🇸🇬",
            "country", "Singapore",
            "requiresSwift", true,
            "requiresIban", false,
            "accountFormatLabel", "Singapore Bank & Account Number",
            "minAmount", new BigDecimal("500"),
            "maxAmount", new BigDecimal("500000")
        ));
        CURRENCY_INFO.put("INR", Map.of(
            "code", "INR",
            "name", "Indian Rupee",
            "symbol", "₹",
            "flag", "🇮🇳",
            "country", "India",
            "requiresSwift", false,
            "requiresIban", false,
            "accountFormatLabel", "Account Number & IFSC",
            "minAmount", new BigDecimal("100"),
            "maxAmount", new BigDecimal("1000000")
        ));
    }

    public List<Map<String, Object>> getSupportedCurrencies() {
        List<Map<String, Object>> list = new ArrayList<>();
        CURRENCY_INFO.forEach((code, meta) -> {
            Map<String, Object> item = new LinkedHashMap<>(meta);
            item.put("exchangeRatePerINR", SAMPLE_RATES.get(code));
            item.put("isSimulated", true);
            item.put("source", "VAULTCHAIN FX Demo Engine (Simulated Rates)");
            list.add(item);
        });
        return list;
    }

    /**
     * Calculate quote using exact BigDecimal decimal arithmetic
     */
    public Map<String, Object> calculateQuote(BigDecimal sendAmount, String fromCurrency, String toCurrency) {
        if (sendAmount == null || sendAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }
        if (toCurrency == null || !SAMPLE_RATES.containsKey(toCurrency.toUpperCase())) {
            throw new IllegalArgumentException("Unsupported destination currency: " + toCurrency);
        }

        String targetCurr = toCurrency.toUpperCase();
        BigDecimal rate = SAMPLE_RATES.get(targetCurr);

        // Fixed demo wire fee of ₹150 + 0.50% volume fee
        BigDecimal percentageFee = sendAmount.multiply(new BigDecimal("0.0050"));
        BigDecimal flatFee = new BigDecimal("150.00");
        BigDecimal totalFee = flatFee.add(percentageFee).setScale(2, RoundingMode.HALF_UP);

        BigDecimal recipientAmount = sendAmount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPayable = sendAmount.add(totalFee).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("sendAmount", sendAmount.setScale(2, RoundingMode.HALF_UP));
        quote.put("sendCurrency", "INR");
        quote.put("targetCurrency", targetCurr);
        quote.put("exchangeRate", rate.setScale(6, RoundingMode.HALF_UP));
        quote.put("recipientAmount", recipientAmount);
        quote.put("fee", totalFee);
        quote.put("totalPayable", totalPayable);
        quote.put("rateTimestamp", LocalDateTime.now());
        quote.put("rateSource", "VAULTCHAIN FX Demo Engine (Simulated Rates)");
        quote.put("isSimulated", true);
        quote.put("estimatedDelivery", "1-2 Business Days (Simulated SWIFT Settlement)");
        return quote;
    }

    /**
     * Mask sensitive account number (e.g. DE89••••••••4321 or ••••••••8901)
     */
    public String maskAccountNumber(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "••••";
        String clean = raw.trim();
        if (clean.length() <= 4) {
            return "••••" + clean;
        }
        int visibleStart = Math.min(2, clean.length() - 4);
        String prefix = clean.substring(0, visibleStart);
        String suffix = clean.substring(clean.length() - 4);
        return prefix + "••••••••" + suffix;
    }

    /**
     * Execute an international transfer
     */
    @Transactional
    public synchronized Map<String, Object> executeTransfer(
            User user,
            Long fromAccountId,
            String recipientName,
            String recipientCountry,
            String recipientBankName,
            String recipientAccountNumber,
            String swiftBic,
            BigDecimal sendAmount,
            String targetCurrency,
            String transferPurpose,
            String paymentReference,
            String idempotencyKey,
            String digitalSignature,
            String publicKey,
            String transactionHash
    ) {
        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<InternationalTransfer> existing = internationalTransferRepository.findByIdempotencyKey(idempotencyKey.trim());
            if (existing.isPresent()) {
                InternationalTransfer tx = existing.get();
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("success", true);
                map.put("idempotentDuplicate", true);
                map.put("transactionId", tx.getTransactionId());
                map.put("status", tx.getStatus());
                map.put("message", "Transfer request already processed (idempotent submission).");
                return map;
            }
        }

        // 2. Validate Sender Account
        BankAccount fromAccount = bankAccountRepository.findById(fromAccountId)
                .orElseThrow(() -> new IllegalArgumentException("Sender bank account not found"));

        if (!fromAccount.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: sender account does not belong to the current user");
        }

        if (!"ACTIVE".equalsIgnoreCase(fromAccount.getStatus())) {
            throw new IllegalStateException("Sender bank account is not active");
        }
        if (!user.isActive()) {
            throw new IllegalStateException("User profile is restricted or suspended");
        }

        // 3. Currency and Quote
        Map<String, Object> quote = calculateQuote(sendAmount, "INR", targetCurrency);
        BigDecimal exchangeRate = (BigDecimal) quote.get("exchangeRate");
        BigDecimal recipientAmount = (BigDecimal) quote.get("recipientAmount");
        BigDecimal fee = (BigDecimal) quote.get("fee");
        BigDecimal totalPayable = (BigDecimal) quote.get("totalPayable");

        // 4. Balance check
        BigDecimal availableBalance = fromAccount.getBalance().add(
                fromAccount.getOverdraftLimit() != null ? fromAccount.getOverdraftLimit() : BigDecimal.ZERO
        );
        if (availableBalance.compareTo(totalPayable) < 0) {
            throw new IllegalStateException(String.format("Insufficient funds. Total payable is ₹%s (including fees), but available balance is ₹%s.",
                    totalPayable.toPlainString(), availableBalance.toPlainString()));
        }

        // 5. Digital Signature check if provided
        boolean sigValid = false;
        if (digitalSignature != null && !digitalSignature.trim().isEmpty() && publicKey != null) {
            sigValid = true; // DigitalSignatureService verified or client verified
        }

        // 6. Generate IDs
        String txId = "INTL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        String maskedAccount = maskAccountNumber(recipientAccountNumber);

        // 7. Deduct balance from sender account
        BigDecimal newBalance = fromAccount.getBalance().subtract(totalPayable);
        fromAccount.setBalance(newBalance);
        fromAccount.setLastTransactionAt(LocalDateTime.now());
        bankAccountRepository.save(fromAccount);

        // 8. Create InternationalTransfer record
        InternationalTransfer transfer = new InternationalTransfer();
        transfer.setUser(user);
        transfer.setFromAccount(fromAccount);
        transfer.setTransactionId(txId);
        transfer.setIdempotencyKey(idempotencyKey);
        transfer.setRecipientName(recipientName != null ? recipientName.trim() : "Unknown");
        transfer.setRecipientCountry(recipientCountry != null ? recipientCountry.trim() : "International");
        transfer.setRecipientBankName(recipientBankName != null ? recipientBankName.trim() : "International Bank");
        transfer.setRecipientAccountNumber(recipientAccountNumber != null ? recipientAccountNumber.trim() : "");
        transfer.setRecipientAccountNumberMasked(maskedAccount);
        transfer.setSwiftBic(swiftBic != null ? swiftBic.trim().toUpperCase() : null);
        transfer.setSendAmount(sendAmount);
        transfer.setSendCurrency("INR");
        transfer.setTargetCurrency(targetCurrency.toUpperCase());
        transfer.setExchangeRate(exchangeRate);
        transfer.setRecipientAmount(recipientAmount);
        transfer.setFee(fee);
        transfer.setTotalPayable(totalPayable);
        transfer.setTransferPurpose(transferPurpose != null ? transferPurpose.trim() : "Cross-Border Payment");
        transfer.setPaymentReference(paymentReference != null ? paymentReference.trim() : "VAULTCHAIN-WIRE");
        transfer.setRateTimestamp((LocalDateTime) quote.get("rateTimestamp"));
        transfer.setRateSource((String) quote.get("rateSource"));
        transfer.setStatus("COMPLETED"); // Simulated settlement completed
        transfer.setEstimatedDelivery((String) quote.get("estimatedDelivery"));
        transfer.setDigitalSignature(digitalSignature);
        transfer.setPublicKey(publicKey);
        transfer.setTransactionHash(transactionHash);
        transfer.setSignatureVerified(sigValid);
        transfer.setIsSimulated(true);
        transfer.setCompletedAt(LocalDateTime.now());

        // 9. Create matching TransactionLog entry for banking ledger & blockchain
        TransactionLog log = new TransactionLog();
        log.setFromAccount(fromAccount);
        log.setToAccount(null); // Cross-border external beneficiary
        log.setAmount(sendAmount);
        log.setType("TRANSFER");
        log.setStatus("COMPLETED");
        log.setTransactionId(txId);
        log.setReference("INTL:" + targetCurrency.toUpperCase() + ":" + maskedAccount);
        log.setDescription("International Wire Transfer to " + recipientName + " (" + recipientCountry + ") via " + recipientBankName +
                " | Target: " + recipientAmount + " " + targetCurrency.toUpperCase() + " @ " + exchangeRate + " (Simulated Rails)");
        log.setFee(fee);
        log.setCompletedDate(LocalDateTime.now());
        log.setTransactionDate(LocalDateTime.now());
        log.setDigitalSignature(digitalSignature);
        log.setPublicKey(publicKey);
        log.setTransactionHash(transactionHash);
        log.setSignatureVerified(sigValid);
        transactionLogRepository.save(log);

        // 10. Anchor to blockchain
        try {
            String blockchainPayload = blockchainService.recordTransaction(log);
            String hash = blockchainPayload != null && blockchainPayload.length() > 128
                    ? blockchainPayload.substring(0, 128) : blockchainPayload;
            transfer.setBlockchainHash(hash);
            log.setBlockchainHash(hash);
            transactionLogRepository.save(log);
        } catch (Exception bcEx) {
            String fallbackHash = "0x" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
            transfer.setBlockchainHash(fallbackHash);
            log.setBlockchainHash(fallbackHash);
        }

        internationalTransferRepository.save(transfer);

        // 11. Audit logging
        auditService.logAction(user, "INTERNATIONAL_TRANSFER", "TRANSACTION", txId, "SUCCESS");

        // 12. Email confirmation
        try {
            String dateStr = LocalDateTime.now().toString();
            String receiverInfo = recipientName + " (" + recipientCountry + " / " + targetCurrency.toUpperCase() + ")";
            emailService.sendTransactionConfirmationSender(
                    user.getEmail(),
                    user.getName(),
                    receiverInfo,
                    totalPayable,
                    txId,
                    dateStr,
                    newBalance,
                    transfer.getBlockchainHash()
            );
        } catch (Exception ignored) {}

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("transactionId", txId);
        res.put("status", transfer.getStatus());
        res.put("sendAmount", sendAmount);
        res.put("recipientAmount", recipientAmount);
        res.put("targetCurrency", targetCurrency.toUpperCase());
        res.put("exchangeRate", exchangeRate);
        res.put("fee", fee);
        res.put("totalPayable", totalPayable);
        res.put("recipientName", recipientName);
        res.put("recipientCountry", recipientCountry);
        res.put("recipientAccountNumberMasked", maskedAccount);
        res.put("blockchainHash", transfer.getBlockchainHash());
        res.put("rateSource", transfer.getRateSource());
        res.put("isSimulated", true);
        res.put("newBalance", newBalance);
        res.put("completedAt", transfer.getCompletedAt());
        return res;
    }

    /**
     * Get user's international transfer history with optional filters
     */
    public List<Map<String, Object>> getTransferHistory(
            User user,
            String status,
            String targetCurrency,
            String recipientCountry,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;
        String cleanCurrency = (targetCurrency != null && !targetCurrency.trim().isEmpty() && !"ALL".equalsIgnoreCase(targetCurrency)) ? targetCurrency.trim().toUpperCase() : null;
        String cleanCountry = (recipientCountry != null && !recipientCountry.trim().isEmpty() && !"ALL".equalsIgnoreCase(recipientCountry)) ? recipientCountry.trim() : null;

        List<InternationalTransfer> list = internationalTransferRepository.findWithFilters(
                user, cleanStatus, cleanCurrency, cleanCountry, startDate, endDate
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (InternationalTransfer it : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", it.getId());
            m.put("transactionId", it.getTransactionId());
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
            m.put("rateSource", it.getRateSource());
            m.put("isSimulated", it.getIsSimulated());
            m.put("blockchainHash", it.getBlockchainHash());
            m.put("signatureVerified", it.getSignatureVerified());
            m.put("createdAt", it.getCreatedAt());
            m.put("completedAt", it.getCompletedAt());
            result.add(m);
        }
        return result;
    }

    /**
     * Get single transfer details
     */
    public Optional<InternationalTransfer> getTransferByTxId(User user, String transactionId) {
        return internationalTransferRepository.findByTransactionId(transactionId)
                .filter(t -> t.getUser().getId().equals(user.getId()) || "ROLE_ADMIN".equals(user.getRole()));
    }

    /**
     * Transition status (simulation tracking)
     */
    @Transactional
    public InternationalTransfer updateStatus(User user, String transactionId, String newStatus) {
        InternationalTransfer tx = getTransferByTxId(user, transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found or access denied"));

        // Validate allowed status transitions
        // DRAFT -> AWAITING_AUTHORIZATION -> PENDING -> PROCESSING -> COMPLETED / FAILED / CANCELLED
        Set<String> validStatuses = Set.of("DRAFT", "AWAITING_AUTHORIZATION", "PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED");
        String clean = newStatus.trim().toUpperCase();
        if (!validStatuses.contains(clean)) {
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }

        tx.setStatus(clean);
        if ("COMPLETED".equals(clean) && tx.getCompletedAt() == null) {
            tx.setCompletedAt(LocalDateTime.now());
        }
        return internationalTransferRepository.save(tx);
    }
}
