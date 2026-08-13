package com.sovereign.ledger.service;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartTransferService {

    @Autowired private SmartTransferRuleRepository ruleRepository;
    @Autowired private SmartTransferExecutionRepository executionRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private BankingService bankingService;
    @Autowired private FinancialScoreService scoreService;
    @Autowired private EmailService emailService;

    // ─── CREATE RULE ──────────────────────────────────────────────────────────
    @Transactional
    public SmartTransferRule createRule(User user, Map<String, Object> payload) {
        Long fromAccountId = Long.parseLong(String.valueOf(payload.get("fromAccountId")));
        Long toAccountId   = Long.parseLong(String.valueOf(payload.get("toAccountId")));

        BankAccount from = bankAccountRepository.findById(fromAccountId)
            .orElseThrow(() -> new RuntimeException("Source account not found"));
        BankAccount to = bankAccountRepository.findById(toAccountId)
            .orElseThrow(() -> new RuntimeException("Destination account not found"));

        if (!from.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Source account does not belong to you");

        SmartTransferRule rule = new SmartTransferRule();
        rule.setUser(user);
        rule.setFromAccount(from);
        rule.setToAccount(to);
        rule.setRuleName(String.valueOf(payload.get("ruleName")));
        rule.setAmount(new BigDecimal(String.valueOf(payload.get("amount"))));
        rule.setTransferType(String.valueOf(payload.getOrDefault("transferType", "SCHEDULED")));
        rule.setConditionType(String.valueOf(payload.getOrDefault("conditionType", "NONE")));
        rule.setFrequency(String.valueOf(payload.getOrDefault("frequency", "MONTHLY")));
        rule.setDescription(String.valueOf(payload.getOrDefault("description", "")));

        if (payload.containsKey("conditionValue") && payload.get("conditionValue") != null)
            rule.setConditionValue(new BigDecimal(String.valueOf(payload.get("conditionValue"))));

        if (payload.containsKey("scheduleDay") && payload.get("scheduleDay") != null)
            rule.setScheduleDay(Integer.parseInt(String.valueOf(payload.get("scheduleDay"))));

        if (payload.containsKey("startDate") && payload.get("startDate") != null)
            rule.setStartDate(LocalDate.parse(String.valueOf(payload.get("startDate"))));

        rule.setStatus("ACTIVE");
        rule.setNextExecution(computeNextExecution(rule));

        return ruleRepository.save(rule);
    }

    // ─── UPDATE RULE ──────────────────────────────────────────────────────────
    @Transactional
    public SmartTransferRule updateRule(Long ruleId, User user, Map<String, Object> payload) {
        SmartTransferRule rule = ruleRepository.findById(ruleId)
            .orElseThrow(() -> new RuntimeException("Rule not found"));
        if (!rule.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Access denied");

        if (payload.containsKey("ruleName")) rule.setRuleName(String.valueOf(payload.get("ruleName")));
        if (payload.containsKey("amount"))   rule.setAmount(new BigDecimal(String.valueOf(payload.get("amount"))));
        if (payload.containsKey("conditionType")) rule.setConditionType(String.valueOf(payload.get("conditionType")));
        if (payload.containsKey("conditionValue") && payload.get("conditionValue") != null)
            rule.setConditionValue(new BigDecimal(String.valueOf(payload.get("conditionValue"))));
        if (payload.containsKey("frequency")) rule.setFrequency(String.valueOf(payload.get("frequency")));
        if (payload.containsKey("scheduleDay") && payload.get("scheduleDay") != null)
            rule.setScheduleDay(Integer.parseInt(String.valueOf(payload.get("scheduleDay"))));
        if (payload.containsKey("description")) rule.setDescription(String.valueOf(payload.get("description")));

        rule.setNextExecution(computeNextExecution(rule));
        rule.setUpdatedAt(LocalDateTime.now());
        return ruleRepository.save(rule);
    }

    // ─── PAUSE / RESUME / DELETE ──────────────────────────────────────────────
    @Transactional
    public void pauseRule(Long ruleId, User user) {
        SmartTransferRule rule = getOwnedRule(ruleId, user);
        rule.setStatus("PAUSED");
        ruleRepository.save(rule);
    }

    @Transactional
    public void resumeRule(Long ruleId, User user) {
        SmartTransferRule rule = getOwnedRule(ruleId, user);
        rule.setStatus("ACTIVE");
        rule.setNextExecution(computeNextExecution(rule));
        ruleRepository.save(rule);
    }

    @Transactional
    public void deleteRule(Long ruleId, User user) {
        SmartTransferRule rule = getOwnedRule(ruleId, user);
        ruleRepository.delete(rule);
    }

    // ─── GET ALL RULES FOR USER ───────────────────────────────────────────────
    public List<Map<String, Object>> getRulesForUser(User user) {
        return ruleRepository.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::mapRule)
            .collect(Collectors.toList());
    }

    // ─── EXECUTION HISTORY ────────────────────────────────────────────────────
    public List<Map<String, Object>> getExecutionHistory(Long ruleId, User user) {
        SmartTransferRule rule = getOwnedRule(ruleId, user);
        return executionRepository.findByRuleOrderByExecutedAtDesc(rule)
            .stream().map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", e.getId());
                m.put("status", e.getStatus());
                m.put("amount", e.getAmount());
                m.put("conditionMet", e.isConditionMet());
                m.put("failureReason", e.getFailureReason());
                m.put("executedAt", e.getExecutedAt());
                m.put("transactionLogId", e.getTransactionLogId());
                return m;
            }).collect(Collectors.toList());
    }

    // ─── SCHEDULER EXECUTION (called by SmartTransferScheduler) ──────────────
    @Transactional
    public void executeEligibleRules() {
        List<SmartTransferRule> dueRules =
            ruleRepository.findByStatusAndNextExecutionBefore("ACTIVE", LocalDateTime.now());

        for (SmartTransferRule rule : dueRules) {
            SmartTransferExecution exec = new SmartTransferExecution(rule, "PENDING");
            exec.setAmount(rule.getAmount());

            try {
                // 1. Check condition
                boolean conditionMet = evaluateCondition(rule);
                exec.setConditionMet(conditionMet);

                if (!conditionMet) {
                    exec.setStatus("SKIPPED");
                    exec.setFailureReason("Condition not met");
                } else {
                    // 2. Execute transfer
                    Map<String, Object> result = bankingService.transferMoney(
                        rule.getFromAccount().getId(),
                        rule.getToAccount().getId(),
                        rule.getAmount(),
                        "Smart Transfer: " + rule.getRuleName()
                    );

                    if (Boolean.TRUE.equals(result.get("success"))) {
                        exec.setStatus("SUCCESS");
                        exec.setTransactionLogId(String.valueOf(result.get("transactionId")));
                        // Update score
                        scoreService.recordEvent(
                            rule.getUser(), FinancialScoreService.DELTA_SMART_SUCCESS,
                            "Successful smart transfer: " + rule.getRuleName(), "SMART_SUCCESS"
                        );
                        // Notify sender
                        try {
                            emailService.sendSmartTransferNotification(
                                rule.getUser().getEmail(), rule.getUser().getName(),
                                rule.getRuleName(), rule.getAmount(), "SUCCESS",
                                String.valueOf(result.get("transactionId"))
                            );
                        } catch (Exception ignored) {}
                    } else {
                        exec.setStatus("FAILED");
                        exec.setFailureReason(String.valueOf(result.get("message")));
                        scoreService.recordEvent(
                            rule.getUser(), FinancialScoreService.DELTA_SMART_FAILED,
                            "Failed smart transfer: " + rule.getRuleName(), "SMART_FAILED"
                        );
                        try {
                            emailService.sendSmartTransferNotification(
                                rule.getUser().getEmail(), rule.getUser().getName(),
                                rule.getRuleName(), rule.getAmount(), "FAILED",
                                exec.getFailureReason()
                            );
                        } catch (Exception ignored) {}
                    }
                }
            } catch (Exception e) {
                exec.setStatus("FAILED");
                exec.setFailureReason("System error: " + e.getMessage());
            } finally {
                executionRepository.save(exec);
                // Advance or deactivate
                advanceNextExecution(rule);
            }
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    private boolean evaluateCondition(SmartTransferRule rule) {
        String type = rule.getConditionType();
        if ("NONE".equals(type)) return true;

        BigDecimal balance = rule.getFromAccount().getBalance();
        BigDecimal threshold = rule.getConditionValue() != null ? rule.getConditionValue() : BigDecimal.ZERO;

        return switch (type) {
            case "BALANCE_ABOVE" -> balance.compareTo(threshold) > 0;
            case "BALANCE_BELOW" -> balance.compareTo(threshold) < 0;
            default -> true;
        };
    }

    private LocalDateTime computeNextExecution(SmartTransferRule rule) {
        LocalDateTime now = LocalDateTime.now();
        return switch (rule.getFrequency()) {
            case "ONCE"    -> (rule.getStartDate() != null)
                              ? rule.getStartDate().atStartOfDay()
                              : now.plusMinutes(1);
            case "DAILY"   -> now.plusDays(1).withHour(9).withMinute(0).withSecond(0);
            case "WEEKLY"  -> now.plusWeeks(1).withHour(9).withMinute(0).withSecond(0);
            case "MONTHLY" -> {
                int day = rule.getScheduleDay() != null ? rule.getScheduleDay() : 1;
                LocalDateTime next = now.withDayOfMonth(1).plusMonths(1).withHour(9).withMinute(0).withSecond(0);
                int maxDay = next.toLocalDate().lengthOfMonth();
                yield next.withDayOfMonth(Math.min(day, maxDay));
            }
            default -> now.plusDays(1);
        };
    }

    private void advanceNextExecution(SmartTransferRule rule) {
        if ("ONCE".equals(rule.getFrequency())) {
            rule.setStatus("COMPLETED");
        } else {
            rule.setNextExecution(computeNextExecution(rule));
        }
        ruleRepository.save(rule);
    }

    private SmartTransferRule getOwnedRule(Long ruleId, User user) {
        SmartTransferRule rule = ruleRepository.findById(ruleId)
            .orElseThrow(() -> new RuntimeException("Rule not found"));
        if (!rule.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Access denied");
        return rule;
    }

    public Map<String, Object> mapRule(SmartTransferRule rule) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rule.getId());
        m.put("ruleName", rule.getRuleName());
        m.put("amount", rule.getAmount());
        m.put("transferType", rule.getTransferType());
        m.put("conditionType", rule.getConditionType());
        m.put("conditionValue", rule.getConditionValue());
        m.put("frequency", rule.getFrequency());
        m.put("scheduleDay", rule.getScheduleDay());
        m.put("status", rule.getStatus());
        m.put("nextExecution", rule.getNextExecution());
        m.put("description", rule.getDescription());
        m.put("createdAt", rule.getCreatedAt());
        m.put("fromAccountNumber", rule.getFromAccount().getAccountNumber());
        m.put("fromAccountId", rule.getFromAccount().getId());
        m.put("toAccountNumber", rule.getToAccount().getAccountNumber());
        m.put("toAccountId", rule.getToAccount().getId());
        m.put("toUserName", rule.getToAccount().getUser() != null ? rule.getToAccount().getUser().getName() : null);
        m.put("startDate", rule.getStartDate());
        return m;
    }
}
