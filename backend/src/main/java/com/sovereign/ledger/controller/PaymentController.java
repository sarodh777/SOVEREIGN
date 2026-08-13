package com.sovereign.ledger.controller;

import com.sovereign.ledger.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private EmailService emailService;

    /**
     * Step 1: Initiate payment — validate card details (simulated) and send OTP for verification.
     */
    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        // Simulate card validation (always passes in demo)
        String otp = String.format("%06d", (int)(Math.random() * 999999));

        // Send OTP email for payment verification
        boolean sent = emailService.sendPaymentOtpEmail(email, otp);
        if (!sent) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send verification code"));
        }

        // In real app, store OTP in Redis/session. Here we return it (demo only).
        // NEVER do this in production!
        return ResponseEntity.ok(Map.of(
            "message", "Verification code sent to " + email,
            "demoOtp", otp  // Remove in production
        ));
    }

    /**
     * Step 2: Confirm payment with OTP and send order confirmation email.
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String enteredOtp = (String) payload.get("otp");
        String expectedOtp = (String) payload.get("expectedOtp"); // Demo only
        Double total = Double.valueOf(payload.get("total").toString());

        if (!enteredOtp.equals(expectedOtp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
        }

        String orderId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        boolean sent = emailService.sendOrderConfirmationEmail(email, orderId, total);

        if (sent) {
            return ResponseEntity.ok(Map.of(
                "message", "Payment successful! Confirmation sent to " + email,
                "orderId", orderId
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                "message", "Payment successful! (Email delivery failed)",
                "orderId", orderId
            ));
        }
    }
}
