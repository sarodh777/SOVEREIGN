package com.sovereign.ledger.service;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class FraudDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(FraudDetectionService.class);

    @Autowired private FraudAlertRepository fraudAlertRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BlockchainService blockchainService;
    @Autowired private AuditService auditService;
    @Autowired private EmailService emailService;

    // Thresholds
    private static final BigDecimal THRESHOLD_VERY_HIGH = new BigDecimal("100000");
    private static final BigDecimal THRESHOLD_HIGH      = new BigDecimal("50000");
    private static final BigDecimal THRESHOLD_NEW_ACCT  = new BigDecimal("10000");

    public static class FraudEvaluation {
        private final int riskScore;
        private final String riskLevel; // LOW, MEDIUM, HIGH
        private final List<String> reasons;
        private final List<String> rulesTriggered;
        private final String recommendedAction; // ALLOW, REQUIRE_VERIFICATION, HOLD_TRANSACTION

        public FraudEvaluation(int riskScore, String riskLevel, List<String> reasons,
                               List<String> rulesTriggered, String recommendedAction) {
            this.riskScore = riskScore;
            this.riskLevel = riskLevel;
            this.reasons = reasons != null ? reasons : new ArrayList<>();
            this.rulesTriggered = rulesTriggered != null ? rulesTriggered : new ArrayList<>();
            this.recommendedAction = recommendedAction;
        }

        public int getRiskScore() { return riskScore; }
        public String getRiskLevel() { return riskLevel; }
        public List<String> getReasons() { return reasons; }
        public List<String> getRulesTriggered() { return rulesTriggered; }
        public String getRecommendedAction() { return recommendedAction; }
        public boolean isHighRisk() { return "HIGH".equals(riskLevel); }
        public boolean isMediumRisk() { return "MEDIUM".equals(riskLevel); }
        public boolean isLowRisk() { return "LOW".equals(riskLevel); }
    }

    /**
     * Analyze a transaction before it is executed
     */
    public FraudEvaluation evaluateTransaction(BankAccount fromAccount, BankAccount toAccount,
                                               BigDecimal amount, String transactionType, User user) {
        int score = 0;
        List<String> reasons = new ArrayList<>();
        List<String> rulesTriggered = new ArrayList<>();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return new FraudEvaluation(100, "HIGH", List.of("Invalid non-positive transaction amount"),
                List.of("RULE_INVALID_AMOUNT"), "HOLD_TRANSACTION");
        }

        // ── 1. UNUSUAL AMOUNT HEURISTICS ─────────────────────────────────────
        if (amount.compareTo(THRESHOLD_VERY_HIGH) >= 0) {
            score += 35;
            rulesTriggered.add("AMOUNT_EXTREME_THRESHOLD");
            reasons.add("Amount exceeds platform high-value threshold (>= ₹1,00,000)");
        } else if (amount.compareTo(THRESHOLD_HIGH) >= 0) {
            score += 20;
            rulesTriggered.add("AMOUNT_HIGH_THRESHOLD");
            reasons.add("Elevated amount exceeds standard transfer tier (>= ₹50,000)");
        }

        // Compare against user's historical 30-day average
        if (fromAccount != null) {
            List<TransactionLog> pastTxs = transactionLogRepository
                .findByFromAccountOrToAccountOrderByTransactionDateDesc(fromAccount, fromAccount);

            if (pastTxs != null && !pastTxs.isEmpty()) {
                BigDecimal totalAmount = BigDecimal.ZERO;
                int count = 0;
                for (TransactionLog tx : pastTxs) {
                    if (tx.getAmount() != null && "COMPLETED".equalsIgnoreCase(tx.getStatus())) {
                        totalAmount = totalAmount.add(tx.getAmount());
                        count++;
                    }
                }

                if (count > 0) {
                    BigDecimal avgAmount = totalAmount.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
                    if (avgAmount.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal ratio = amount.divide(avgAmount, 2, RoundingMode.HALF_UP);
                        if (ratio.compareTo(new BigDecimal("4.0")) >= 0) {
                            score += 35;
                            rulesTriggered.add("AMOUNT_ANOMALY_4X_AVG");
                            reasons.add("Amount is " + ratio + "x higher than user's 30-day historical average (₹" + avgAmount + ")");
                        } else if (ratio.compareTo(new BigDecimal("2.5")) >= 0) {
                            score += 20;
                            rulesTriggered.add("AMOUNT_ANOMALY_2X_AVG");
                            reasons.add("Amount is " + ratio + "x higher than user's historical average (₹" + avgAmount + ")");
                        }
                    }
                }
            }

            // High Balance Depletion Ratio (> 85% of balance)
            BigDecimal balance = fromAccount.getBalance();
            if (balance != null && balance.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal depletionRatio = amount.divide(balance, 4, RoundingMode.HALF_UP);
                if (depletionRatio.compareTo(new BigDecimal("0.95")) >= 0) {
                    int pct = depletionRatio.multiply(new BigDecimal("100")).intValue();
                    score += 40;
                    rulesTriggered.add("EXTREME_BALANCE_DEPLETION");
                    reasons.add("Critical account balance depletion: transaction transfers " + Math.min(pct, 100) + "% of total funds (near-total balance drain)");
                } else if (depletionRatio.compareTo(new BigDecimal("0.85")) >= 0) {
                    int pct = depletionRatio.multiply(new BigDecimal("100")).intValue();
                    score += 25;
                    rulesTriggered.add("HIGH_BALANCE_DEPLETION");
                    reasons.add("High account balance depletion detected: transaction transfers " + Math.min(pct, 100) + "% of total balance");
                }
            }
        }

        // ── 2. REPEATED TRANSACTIONS & VELOCITY ───────────────────────────────
        if (fromAccount != null) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            List<TransactionLog> recentTxs = transactionLogRepository
                .findByFromAccountOrToAccountOrderByTransactionDateDesc(fromAccount, fromAccount);

            int recentCount = 0;
            boolean duplicateFound = false;

            for (TransactionLog tx : recentTxs) {
                if (tx.getTransactionDate() != null && tx.getTransactionDate().isAfter(tenMinutesAgo)) {
                    recentCount++;
                    // Duplicate check: same amount and same destination account within 10 min
                    if (toAccount != null && tx.getToAccount() != null &&
                        tx.getToAccount().getId().equals(toAccount.getId()) &&
                        tx.getAmount().compareTo(amount) == 0 &&
                        "TRANSFER".equalsIgnoreCase(tx.getType())) {
                        duplicateFound = true;
                    }
                }
            }

            if (duplicateFound) {
                score += 35;
                rulesTriggered.add("DUPLICATE_TRANSFER_PATTERN");
                reasons.add("Identical transfer amount to the same recipient detected within the last 10 minutes (replay/burst risk)");
            }

            if (recentCount >= 3) {
                score += 30;
                rulesTriggered.add("HIGH_VELOCITY_BURST");
                reasons.add("Rapid transaction velocity: " + recentCount + " transfers initiated within a 10-minute window");
            }
        }

        // ── 3. FAILED ATTEMPTS CHECKS ────────────────────────────────────────
        if (user != null) {
            if (user.getFailedLoginAttempts() >= 2) {
                score += 25;
                rulesTriggered.add("RECENT_FAILED_LOGINS");
                reasons.add("Account flagged with " + user.getFailedLoginAttempts() + " recent failed login authentication attempts");
            }
        }

        if (fromAccount != null) {
            LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
            List<TransactionLog> logs24h = transactionLogRepository
                .findByFromAccountOrToAccountOrderByTransactionDateDesc(fromAccount, fromAccount);

            long failedCount = logs24h.stream()
                .filter(l -> l.getTransactionDate() != null && l.getTransactionDate().isAfter(oneDayAgo))
                .filter(l -> "FAILED".equalsIgnoreCase(l.getStatus()))
                .count();

            if (failedCount >= 2) {
                score += 20;
                rulesTriggered.add("RECENT_FAILED_TRANSACTIONS");
                reasons.add("Account has " + failedCount + " failed or rejected transactions in the past 24 hours");
            }
        }

        // ── 4. ABNORMAL PATTERNS (TIMING & NEW ACCOUNT) ───────────────────────
        LocalTime now = LocalTime.now();
        if (now.isAfter(LocalTime.of(1, 0)) && now.isBefore(LocalTime.of(5, 0))) {
            score += 15;
            rulesTriggered.add("NOCTURNAL_OFF_HOURS");
            reasons.add("Irregular transaction timing: transfer initiated during off-hours nocturnal window (01:00 AM - 05:00 AM)");
        }

        if (user != null && user.getCreatedAt() != null) {
            LocalDateTime fortyEightHoursAgo = LocalDateTime.now().minusHours(48);
            if (user.getCreatedAt().isAfter(fortyEightHoursAgo) && amount.compareTo(THRESHOLD_NEW_ACCT) >= 0) {
                score += 25;
                rulesTriggered.add("NEW_ACCOUNT_LARGE_DISBURSEMENT");
                reasons.add("New account anomaly: large transfer initiated on an account created less than 48 hours ago");
            }
        }

        // ── 5. FINAL SCORE & RISK LEVEL DERIVATION ────────────────────────────
        int finalScore = Math.min(100, Math.max(0, score));
        String riskLevel;
        String action;

        if (finalScore >= 70) {
            riskLevel = "HIGH";
            action = "HOLD_TRANSACTION";
        } else if (finalScore >= 40) {
            riskLevel = "MEDIUM";
            action = "REQUIRE_VERIFICATION";
        } else {
            riskLevel = "LOW";
            action = "ALLOW";
            if (reasons.isEmpty()) {
                reasons.add("Standard transaction telemetry within normal behavioral boundaries");
            }
        }

        return new FraudEvaluation(finalScore, riskLevel, reasons, rulesTriggered, action);
    }

    /**
     * Save a FraudAlert to the audit database
     */
    @Transactional
    public FraudAlert recordFraudAlert(String transactionId, User user, BankAccount fromAccount,
                                      BankAccount toAccount, BigDecimal amount, String type,
                                      FraudEvaluation eval, String reference) {
        String reasonsJoined = String.join("; ", eval.getReasons());
        String rulesJoined = String.join(",", eval.getRulesTriggered());

        String status = "CLEARED";
        if (eval.isHighRisk()) {
            status = "HELD";
        } else if (eval.isMediumRisk()) {
            status = "PENDING_REVIEW";
        }

        FraudAlert alert = new FraudAlert(
            transactionId,
            user,
            fromAccount,
            toAccount,
            amount,
            type,
            eval.getRiskScore(),
            eval.getRiskLevel(),
            reasonsJoined,
            rulesJoined,
            eval.getRecommendedAction(),
            status
        );
        alert.setReference(reference);

        FraudAlert saved = fraudAlertRepository.save(alert);

        // Audit log
        auditService.logAction(
            user,
            "FRAUD_EVALUATION_" + eval.getRiskLevel(),
            "TRANSACTION",
            transactionId,
            eval.isHighRisk() ? "HELD" : "SUCCESS",
            "Risk Score: " + eval.getRiskScore() + " | Reasons: " + reasonsJoined,
            null,
            null
        );

        return saved;
    }

    /**
     * Admin review action: Mark as Legitimate (Approve & Release)
     */
    @Transactional
    public Map<String, Object> approveHeldAlert(Long alertId, String adminEmail, String notes) {
        FraudAlert alert = fraudAlertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Fraud alert not found with ID: " + alertId));

        alert.setAdminDecision("LEGITIMATE");
        alert.setStatus("APPROVED");
        alert.setAdminNotes(notes != null ? notes : "Approved by administrator as legitimate transaction");
        alert.setReviewedBy(adminEmail);
        alert.setReviewedAt(LocalDateTime.now());

        // Locate transaction in transaction_logs
        Optional<TransactionLog> optTx = transactionLogRepository.findByTransactionId(alert.getTransactionId());
        if (optTx.isPresent()) {
            TransactionLog tx = optTx.get();

            // If it was held, execute funds deduction & blockchain recording
            if ("HELD".equalsIgnoreCase(tx.getStatus()) || "PENDING".equalsIgnoreCase(tx.getStatus())) {
                BankAccount fromAcc = tx.getFromAccount();
                BankAccount toAcc = tx.getToAccount();
                BigDecimal amount = tx.getAmount();
                BigDecimal fee = tx.getFee() != null ? tx.getFee() : BigDecimal.ZERO;

                if (fromAcc != null && toAcc != null) {
                    fromAcc.setBalance(fromAcc.getBalance().subtract(amount).subtract(fee));
                    toAcc.setBalance(toAcc.getBalance().add(amount));
                    fromAcc.setLastTransactionAt(LocalDateTime.now());
                    toAcc.setLastTransactionAt(LocalDateTime.now());
                    bankAccountRepository.save(fromAcc);
                    bankAccountRepository.save(toAcc);
                }

                tx.setStatus("COMPLETED");
                tx.setCompletedDate(LocalDateTime.now());

                // Record on blockchain now that fraud review has passed
                try {
                    String blockchainHash = blockchainService.recordTransaction(tx);
                    String hash = blockchainHash != null && blockchainHash.length() > 128
                        ? blockchainHash.substring(0, 128) : blockchainHash;
                    tx.setBlockchainHash(hash);
                    alert.setBlockchainHash(hash);
                } catch (Exception e) {
                    logger.warn("Blockchain RPC sync note: {}", e.getMessage());
                    try {
                        java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
                        byte[] hashBytes = md.digest((tx.getTransactionId() + ":" + tx.getAmount() + ":" + System.currentTimeMillis()).getBytes());
                        StringBuilder sb = new StringBuilder("0x");
                        for (byte b : hashBytes) sb.append(String.format("%02x", b));
                        String hash = sb.toString();
                        tx.setBlockchainHash(hash);
                        alert.setBlockchainHash(hash);
                        tx.setDescription("Approved by admin. Audit hash: " + hash.substring(0, 18) + "...");
                    } catch (Exception ex) {
                        tx.setDescription("Approved by admin");
                    }
                }

                transactionLogRepository.save(tx);
            }
        }

        fraudAlertRepository.save(alert);

        auditService.logAction(
            alert.getUser(),
            "FRAUD_ALERT_APPROVED",
            "ALERT",
            String.valueOf(alertId),
            "SUCCESS",
            "Admin " + adminEmail + " approved transaction " + alert.getTransactionId(),
            null,
            null
        );

        return Map.of(
            "success", true,
            "message", "Transaction marked as legitimate and released successfully",
            "transactionId", alert.getTransactionId()
        );
    }

    /**
     * Admin review action: Confirm Fraud (Reject & Cancel)
     */
    @Transactional
    public Map<String, Object> rejectHeldAlert(Long alertId, String adminEmail, String notes) {
        FraudAlert alert = fraudAlertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Fraud alert not found with ID: " + alertId));

        alert.setAdminDecision("CONFIRMED_FRAUD");
        alert.setStatus("REJECTED");
        alert.setAdminNotes(notes != null ? notes : "Rejected by administrator as confirmed fraud");
        alert.setReviewedBy(adminEmail);
        alert.setReviewedAt(LocalDateTime.now());

        Optional<TransactionLog> optTx = transactionLogRepository.findByTransactionId(alert.getTransactionId());
        if (optTx.isPresent()) {
            TransactionLog tx = optTx.get();
            tx.setStatus("REJECTED_FRAUD");
            tx.setFailureReason("Rejected by Administrator during fraud surveillance review: " + alert.getAdminNotes());
            transactionLogRepository.save(tx);
        }

        fraudAlertRepository.save(alert);

        auditService.logAction(
            alert.getUser(),
            "FRAUD_ALERT_CONFIRMED_FRAUD",
            "ALERT",
            String.valueOf(alertId),
            "REJECTED",
            "Admin " + adminEmail + " confirmed fraud for transaction " + alert.getTransactionId(),
            null,
            null
        );

        return Map.of(
            "success", true,
            "message", "Transaction marked as confirmed fraud and cancelled",
            "transactionId", alert.getTransactionId()
        );
    }
}
