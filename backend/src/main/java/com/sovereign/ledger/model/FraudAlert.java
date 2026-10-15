package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_alerts")
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String transactionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "from_account_id")
    private BankAccount fromAccount;

    @ManyToOne
    @JoinColumn(name = "to_account_id")
    private BankAccount toAccount;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String transactionType = "TRANSFER";

    @Column(nullable = false)
    private int riskScore; // 0 - 100

    @Column(nullable = false, length = 20)
    private String riskLevel; // LOW, MEDIUM, HIGH

    @Column(length = 2000)
    private String reasons; // Human-readable explanations

    @Column(length = 1000)
    private String rulesTriggered; // Comma-separated rule codes

    @Column(nullable = false, length = 40)
    private String status = "PENDING_REVIEW"; // HELD, PENDING_REVIEW, VERIFIED_BY_USER, APPROVED, REJECTED, CLEARED

    @Column(nullable = false, length = 40)
    private String actionTaken; // ALLOWED, VERIFICATION_REQUIRED, HELD_FOR_REVIEW

    @Column(length = 30)
    private String adminDecision; // LEGITIMATE, CONFIRMED_FRAUD

    @Column(length = 1000)
    private String adminNotes;

    private String reviewedBy; // Admin email

    private LocalDateTime reviewedAt;

    @Column(length = 128)
    private String blockchainHash;

    @Column(length = 500)
    private String reference;

    private LocalDateTime createdAt = LocalDateTime.now();

    public FraudAlert() {}

    public FraudAlert(String transactionId, User user, BankAccount fromAccount, BankAccount toAccount,
                      BigDecimal amount, String transactionType, int riskScore, String riskLevel,
                      String reasons, String rulesTriggered, String actionTaken, String status) {
        this.transactionId = transactionId;
        this.user = user;
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.transactionType = transactionType;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.reasons = reasons;
        this.rulesTriggered = rulesTriggered;
        this.actionTaken = actionTaken;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BankAccount getFromAccount() { return fromAccount; }
    public void setFromAccount(BankAccount fromAccount) { this.fromAccount = fromAccount; }

    public BankAccount getToAccount() { return toAccount; }
    public void setToAccount(BankAccount toAccount) { this.toAccount = toAccount; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getReasons() { return reasons; }
    public void setReasons(String reasons) { this.reasons = reasons; }

    public String getRulesTriggered() { return rulesTriggered; }
    public void setRulesTriggered(String rulesTriggered) { this.rulesTriggered = rulesTriggered; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }

    public String getAdminDecision() { return adminDecision; }
    public void setAdminDecision(String adminDecision) { this.adminDecision = adminDecision; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getBlockchainHash() { return blockchainHash; }
    public void setBlockchainHash(String blockchainHash) { this.blockchainHash = blockchainHash; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
