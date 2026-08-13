package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_scores")
public class FinancialScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private int score = 500; // starts at 500, range 300-900

    /**
     * EXCELLENT (800+), GOOD (700-799), FAIR (600-699), NEEDS_IMPROVEMENT (<600)
     */
    private String category = "FAIR";

    private int successfulTransactions = 0;
    private int failedTransactions = 0;
    private int smartTransferSuccesses = 0;
    private int smartTransferFailures = 0;
    private int depositCount = 0;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public FinancialScore() {}

    public FinancialScore(User user) {
        this.user = user;
    }

    public String calculateCategory() {
        if (score >= 800) return "EXCELLENT";
        if (score >= 700) return "GOOD";
        if (score >= 600) return "FAIR";
        return "NEEDS_IMPROVEMENT";
    }

    public void adjustScore(int delta) {
        this.score = Math.min(900, Math.max(300, this.score + delta));
        this.category = calculateCategory();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = Math.min(900, Math.max(300, score)); this.category = calculateCategory(); }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public int getSuccessfulTransactions() { return successfulTransactions; }
    public void setSuccessfulTransactions(int v) { this.successfulTransactions = v; }
    public int getFailedTransactions() { return failedTransactions; }
    public void setFailedTransactions(int v) { this.failedTransactions = v; }
    public int getSmartTransferSuccesses() { return smartTransferSuccesses; }
    public void setSmartTransferSuccesses(int v) { this.smartTransferSuccesses = v; }
    public int getSmartTransferFailures() { return smartTransferFailures; }
    public void setSmartTransferFailures(int v) { this.smartTransferFailures = v; }
    public int getDepositCount() { return depositCount; }
    public void setDepositCount(int v) { this.depositCount = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }
}
