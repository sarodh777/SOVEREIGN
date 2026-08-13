package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.FinancialScore;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.FinancialScoreHistoryRepository;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.FinancialScoreService;
import com.sovereign.ledger.service.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/financial-score")
@CrossOrigin(origins = "*")
public class FinancialScoreController {

    @Autowired private FinancialScoreService scoreService;
    @Autowired private FinancialScoreHistoryRepository historyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User getUser(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        return userRepository.findByEmail(jwtUtil.getEmailFromToken(token)).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getScore(HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));

        FinancialScore fs = scoreService.getOrCreate(user);

        // Build factors list
        List<Map<String, Object>> factors = new ArrayList<>();
        if (fs.getSuccessfulTransactions() > 0)
            factors.add(factor("✓", "Successful transactions: " + fs.getSuccessfulTransactions(), "positive"));
        if (fs.getSmartTransferSuccesses() > 0)
            factors.add(factor("✓", "Smart transfers completed: " + fs.getSmartTransferSuccesses(), "positive"));
        if (fs.getDepositCount() > 0)
            factors.add(factor("✓", "Regular deposits: " + fs.getDepositCount(), "positive"));
        if (fs.getFailedTransactions() > 0)
            factors.add(factor("⚠", "Failed transactions: " + fs.getFailedTransactions(), "negative"));
        if (fs.getSmartTransferFailures() > 0)
            factors.add(factor("⚠", "Failed smart transfers: " + fs.getSmartTransferFailures(), "negative"));
        if (factors.isEmpty())
            factors.add(factor("ℹ", "Start transacting to build your score", "neutral"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("score", fs.getScore());
        result.put("category", fs.getCategory());
        result.put("maxScore", 900);
        result.put("factors", factors);
        result.put("stats", Map.of(
            "successfulTransactions", fs.getSuccessfulTransactions(),
            "failedTransactions", fs.getFailedTransactions(),
            "smartTransferSuccesses", fs.getSmartTransferSuccesses(),
            "smartTransferFailures", fs.getSmartTransferFailures(),
            "depositCount", fs.getDepositCount()
        ));
        result.put("updatedAt", fs.getUpdatedAt());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));

        var history = historyRepository.findTop20ByUserOrderByCreatedAtDesc(user)
            .stream().map(h -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", h.getId());
                m.put("scoreBefore", h.getScoreBefore());
                m.put("scoreAfter", h.getScoreAfter());
                m.put("delta", h.getDelta());
                m.put("reason", h.getReason());
                m.put("eventType", h.getEventType());
                m.put("createdAt", h.getCreatedAt());
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success",true,"history",history));
    }

    private Map<String, Object> factor(String icon, String label, String type) {
        return Map.of("icon", icon, "label", label, "type", type);
    }
}
