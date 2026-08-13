package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "smart_transfer_rules")
public class SmartTransferRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "from_account_id", nullable = false)
    private BankAccount fromAccount;

    @ManyToOne
    @JoinColumn(name = "to_account_id", nullable = false)
    private BankAccount toAccount;

    @Column(nullable = false)
    private String ruleName;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    /**
     * SCHEDULED, CONDITIONAL, SCHEDULED_CONDITIONAL
     */
    @Column(nullable = false)
    private String transferType = "SCHEDULED";

    /**
     * NONE, BALANCE_ABOVE, BALANCE_BELOW, INCOMING_ABOVE
     */
    private String conditionType = "NONE";

    @Column(precision = 19, scale = 4)
    private BigDecimal conditionValue;

    /**
     * ONCE, DAILY, WEEKLY, MONTHLY
     */
    private String frequency = "MONTHLY";

    /**
     * 1–28 for MONTHLY (day of month), 1–7 for WEEKLY (day of week)
     */
    private Integer scheduleDay;

    private LocalDate startDate;

    private LocalDateTime nextExecution;

    /**
     * ACTIVE, PAUSED, COMPLETED, CANCELLED
     */
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(length = 500)
    private String description;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public SmartTransferRule() {}

    // Getters and Setters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BankAccount getFromAccount() { return fromAccount; }
    public void setFromAccount(BankAccount fromAccount) { this.fromAccount = fromAccount; }
    public BankAccount getToAccount() { return toAccount; }
    public void setToAccount(BankAccount toAccount) { this.toAccount = toAccount; }
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }
    public String getConditionType() { return conditionType; }
    public void setConditionType(String conditionType) { this.conditionType = conditionType; }
    public BigDecimal getConditionValue() { return conditionValue; }
    public void setConditionValue(BigDecimal conditionValue) { this.conditionValue = conditionValue; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public Integer getScheduleDay() { return scheduleDay; }
    public void setScheduleDay(Integer scheduleDay) { this.scheduleDay = scheduleDay; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDateTime getNextExecution() { return nextExecution; }
    public void setNextExecution(LocalDateTime nextExecution) { this.nextExecution = nextExecution; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; this.updatedAt = LocalDateTime.now(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
