package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_score_history")
public class FinancialScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private int scoreBefore;
    private int scoreAfter;
    private int delta;         // positive = increase, negative = decrease

    @Column(nullable = false)
    private String reason;     // e.g. "Successful transfer", "Failed smart transfer"

    @Column(nullable = false)
    private String eventType;  // TRANSFER, SMART_TRANSFER, DEPOSIT, FAILED_TX etc.

    private LocalDateTime createdAt = LocalDateTime.now();

    public FinancialScoreHistory() {}

    public FinancialScoreHistory(User user, int scoreBefore, int delta, String reason, String eventType) {
        this.user = user;
        this.scoreBefore = scoreBefore;
        this.delta = delta;
        this.scoreAfter = Math.min(900, Math.max(300, scoreBefore + delta));
        this.reason = reason;
        this.eventType = eventType;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getScoreBefore() { return scoreBefore; }
    public void setScoreBefore(int v) { this.scoreBefore = v; }
    public int getScoreAfter() { return scoreAfter; }
    public void setScoreAfter(int v) { this.scoreAfter = v; }
    public int getDelta() { return delta; }
    public void setDelta(int v) { this.delta = v; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getEventType() { return eventType; }
    public void setEventType(String v) { this.eventType = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
