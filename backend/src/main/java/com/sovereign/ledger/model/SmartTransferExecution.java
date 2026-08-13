package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "smart_transfer_executions")
public class SmartTransferExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rule_id", nullable = false)
    private SmartTransferRule rule;

    private String transactionLogId; // TXN-xxx reference

    @Column(precision = 19, scale = 4)
    private BigDecimal amount;

    /**
     * SUCCESS, FAILED, SKIPPED (condition not met)
     */
    @Column(nullable = false)
    private String status;

    private boolean conditionMet = true;

    @Column(length = 500)
    private String failureReason;

    private LocalDateTime executedAt = LocalDateTime.now();

    public SmartTransferExecution() {}

    public SmartTransferExecution(SmartTransferRule rule, String status) {
        this.rule = rule;
        this.status = status;
    }

    public Long getId() { return id; }
    public SmartTransferRule getRule() { return rule; }
    public void setRule(SmartTransferRule rule) { this.rule = rule; }
    public String getTransactionLogId() { return transactionLogId; }
    public void setTransactionLogId(String transactionLogId) { this.transactionLogId = transactionLogId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isConditionMet() { return conditionMet; }
    public void setConditionMet(boolean conditionMet) { this.conditionMet = conditionMet; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public LocalDateTime getExecutedAt() { return executedAt; }
    public void setExecutedAt(LocalDateTime executedAt) { this.executedAt = executedAt; }
}
