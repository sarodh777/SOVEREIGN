package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/security")
@CrossOrigin(origins = "*")
public class TransactionSecurityController {

    @Autowired private TransactionPinService pinService;
    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User getUser(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        return userRepository.findByEmail(jwtUtil.getEmailFromToken(token)).orElse(null);
    }

    // ── PIN Status ────────────────────────────────────────────────────────────
    @GetMapping("/pin/status")
    public ResponseEntity<?> pinStatus(HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        return ResponseEntity.ok(Map.of(
            "success", true,
            "hasPinSet", pinService.hasPinSet(user)
        ));
    }

    // ── Setup / Change PIN ────────────────────────────────────────────────────
    @PostMapping("/pin/setup")
    public ResponseEntity<?> setupPin(@RequestBody Map<String, String> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            String pin = body.get("pin");
            if (pin == null || !pin.matches("\\d{4,15}"))
                return ResponseEntity.badRequest().body(Map.of("success",false,"message","PIN must be 4–15 digits only"));
            pinService.setPin(user, pin);
            return ResponseEntity.ok(Map.of("success",true,"message","Transaction PIN set successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    @PostMapping("/pin/change")
    public ResponseEntity<?> changePin(@RequestBody Map<String, String> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            String currentPin = body.get("currentPin");
            String newPin     = body.get("newPin");

            if (!pinService.hasPinSet(user))
                return ResponseEntity.badRequest().body(Map.of("success",false,"message","No PIN set. Please set a PIN first."));
            if (!pinService.verifyPin(user, currentPin))
                return ResponseEntity.status(403).body(Map.of("success",false,"message","Current PIN is incorrect"));
            if (newPin == null || !newPin.matches("\\d{4,15}"))
                return ResponseEntity.badRequest().body(Map.of("success",false,"message","New PIN must be 4–15 digits only"));

            pinService.setPin(user, newPin);
            return ResponseEntity.ok(Map.of("success",true,"message","Transaction PIN changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success",false,"message",e.getMessage()));
        }
    }

    // ── Verify PIN → send Transfer OTP ────────────────────────────────────────
    @PostMapping("/pin/verify")
    public ResponseEntity<?> verifyPin(@RequestBody Map<String, String> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));

        String rawPin = body.get("pin");
        if (rawPin == null || rawPin.isBlank())
            return ResponseEntity.badRequest().body(Map.of("success",false,"message","PIN is required"));

        if (!pinService.hasPinSet(user))
            return ResponseEntity.status(400).body(Map.of("success",false,"message","Please set a transaction PIN first in Security Settings"));

        if (!pinService.verifyPin(user, rawPin))
            return ResponseEntity.status(403).body(Map.of("success",false,"message","Incorrect transaction PIN"));

        return ResponseEntity.ok(Map.of("success",true,"message","PIN verified"));
    }

    // ── Send Transfer OTP ─────────────────────────────────────────────────────
    @PostMapping("/transfer-otp/send")
    public ResponseEntity<?> sendTransferOtp(HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        try {
            String otp = otpService.generateOtp(user.getEmail(), "TRANSFER");
            emailService.sendOtpEmail(user.getEmail(), otp, "PAYMENT", user.getName());
            return ResponseEntity.ok(Map.of("success",true,"message","OTP sent to your registered email"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success",false,"message","Failed to send OTP: " + e.getMessage()));
        }
    }

    // ── Verify Transfer OTP ───────────────────────────────────────────────────
    @PostMapping("/transfer-otp/verify")
    public ResponseEntity<?> verifyTransferOtp(@RequestBody Map<String, String> body, HttpServletRequest req) {
        User user = getUser(req);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));

        String otp = body.get("otp");
        if (otp == null || otp.isBlank())
            return ResponseEntity.badRequest().body(Map.of("success",false,"message","OTP is required"));

        if (!otpService.verifyOtp(user.getEmail(), otp, "TRANSFER"))
            return ResponseEntity.status(403).body(Map.of("success",false,"message","Invalid or expired OTP"));

        return ResponseEntity.ok(Map.of("success",true,"message","OTP verified — transfer authorized"));
    }
}
