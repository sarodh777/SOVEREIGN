package com.sovereign.ledger.controller;

import com.sovereign.ledger.service.EmailService;
import com.sovereign.ledger.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        // Generate OTP
        String otp = otpService.generateOtp(email);

        // Send OTP via Email using JavaMailSender
        boolean emailSent = emailService.sendOtpEmail(email, otp);

        Map<String, String> response = new HashMap<>();
        if (emailSent) {
            response.put("message", "OTP sent successfully");
            response.put("email", email);
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Failed to send OTP. Check email configuration.");
            response.put("email", email);
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        boolean isValid = otpService.verifyOtp(email, otp);

        if (isValid) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Authentication successful");
            response.put("token", "simulated-jwt-token-alpha-v1"); // In production, generate a real JWT
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
        }
    }

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail() {
        String testEmail = "sarodhuilgol@gmail.com";
        boolean sent = emailService.sendOtpEmail(testEmail, "123456");
        
        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("recipient", testEmail);
        response.put("status", sent ? "Email sent successfully - check SMTP config" : "Failed to send email - check logs");
        return ResponseEntity.ok(response);
    }
}
