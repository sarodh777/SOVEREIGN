package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.JwtUtil;
import com.sovereign.ledger.service.SmartTransferService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/smart-transfers")
@CrossOrigin(origins = "*")
public class SmartTransferController {

    @Autowired private SmartTransferService smartTransferService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User getUser(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        return userRepository.findByEmail(jwtUtil.getEmailFromToken(token)).orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> createRule(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            var rule = smartTransferService.createRule(user, body);
            return ResponseEntity.ok(Map.of("success",true,"message","Smart transfer rule created","rule",smartTransferService.mapRule(rule)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getRules(HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        return ResponseEntity.ok(Map.of("success",true,"rules",smartTransferService.getRulesForUser(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRule(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            var rule = smartTransferService.updateRule(id, user, body);
            return ResponseEntity.ok(Map.of("success",true,"message","Rule updated","rule",smartTransferService.mapRule(rule)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRule(@PathVariable Long id, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            smartTransferService.deleteRule(id, user);
            return ResponseEntity.ok(Map.of("success",true,"message","Rule deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<?> pauseRule(@PathVariable Long id, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            smartTransferService.pauseRule(id, user);
            return ResponseEntity.ok(Map.of("success",true,"message","Rule paused"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @PatchMapping("/{id}/resume")
    public ResponseEntity<?> resumeRule(@PathVariable Long id, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            smartTransferService.resumeRule(id, user);
            return ResponseEntity.ok(Map.of("success",true,"message","Rule resumed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @GetMapping("/{id}/executions")
    public ResponseEntity<?> getExecutions(@PathVariable Long id, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            return ResponseEntity.ok(Map.of("success",true,"executions",smartTransferService.getExecutionHistory(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }
}
