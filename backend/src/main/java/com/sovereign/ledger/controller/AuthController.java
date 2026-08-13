package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private BankingService bankingService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10}$");
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    // ─── REGISTER ──────────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String name  = payload.getOrDefault("name", "").trim();
        String email = payload.getOrDefault("email", "").trim().toLowerCase();
        String phone = payload.getOrDefault("phone", "").trim().replaceAll("[^0-9]", "");
        String password = payload.getOrDefault("password", "");
        String confirmPassword = payload.getOrDefault("confirmPassword", "");

        // Validations
        if (name.isEmpty())
            return bad("Full name is required");
        if (!EMAIL_PATTERN.matcher(email).matches())
            return bad("Invalid email address");
        if (!PHONE_PATTERN.matcher(phone).matches())
            return bad("Phone must be 10 digits");
        if (password.length() < 8)
            return bad("Password must be at least 8 characters");
        if (!password.matches(".*[A-Z].*"))
            return bad("Password must contain at least one uppercase letter");
        if (!password.matches(".*[0-9].*"))
            return bad("Password must contain at least one number");
        if (!password.equals(confirmPassword))
            return bad("Passwords do not match");
        if (userRepository.existsByEmail(email))
            return bad("An account with this email already exists");
        if (userRepository.existsByPhone(phone))
            return bad("An account with this phone number already exists");

        // Create user (emailVerified = false until OTP verified)
        User user = new User(email, passwordEncoder.encode(password), name);
        user.setPhone(phone);
        user.setEmailVerified(false);
        userRepository.save(user);

        // Send registration OTP
        String otp = otpService.generateOtp(email, "REGISTER");
        boolean sent = emailService.sendOtpEmail(email, otp, "REGISTER", name);

        if (!sent) {
            userRepository.delete(user);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send verification email. Please try again."));
        }

        return ResponseEntity.ok(Map.of(
            "message", "Verification code sent to " + email,
            "email", email
        ));
    }

    // ─── SEND OTP (login / request) ────────────────────────────────────────────
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "").trim().toLowerCase();
        if (email.isEmpty()) return bad("Email is required");

        String otp = otpService.generateOtp(email, "LOGIN");
        boolean sent = emailService.sendOtpEmail(email, otp, "LOGIN", null);

        Map<String, String> response = new HashMap<>();
        if (sent) {
            response.put("message", "OTP sent successfully");
            response.put("email", email);
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Failed to send OTP. Check email configuration.");
            return ResponseEntity.status(500).body(response);
        }
    }

    // ─── VERIFY OTP ─────────────────────────────────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email   = payload.getOrDefault("email", "").trim().toLowerCase();
        String otp     = payload.getOrDefault("otp", "").trim();
        String purpose = payload.getOrDefault("purpose", "LOGIN");

        if (email.isEmpty() || otp.isEmpty())
            return bad("Email and OTP are required");

        boolean isValid = otpService.verifyOtp(email, otp, purpose);
        if (!isValid)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));

        // For REGISTER purpose: mark email as verified, create bank account
        if ("REGISTER".equals(purpose)) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                user.setEmailVerified(true);
                userRepository.save(user);
                // Auto-create bank account
                try { bankingService.createBankAccount(user, "SAVINGS"); } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(Map.of(
                "message", "Email verified successfully. You can now login.",
                "verified", true
            ));
        }

        // For LOGIN purpose: check user exists and is verified
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        if (!user.isEmailVerified())
            return ResponseEntity.status(403).body(Map.of("message", "Email not verified"));
        if (!user.isActive())
            return ResponseEntity.status(403).body(Map.of("message", "Account is frozen. Contact support."));

        // Generate real JWT
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(Map.of(
            "message", "Authentication successful",
            "token", token,
            "email", user.getEmail(),
            "name", user.getName() != null ? user.getName() : "",
            "role", user.getRole(),
            "userId", user.getId()
        ));
    }

    // ─── PASSWORD LOGIN ──────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String email    = payload.getOrDefault("email", "").trim().toLowerCase();
        String password = payload.getOrDefault("password", "");

        if (email.isEmpty() || password.isEmpty())
            return bad("Email and password are required");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));

        if (user.isAccountLocked())
            return ResponseEntity.status(423).body(Map.of("message",
                "Account locked due to multiple failed attempts. Try again in " + LOCK_DURATION_MINUTES + " minutes."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                userRepository.save(user);
                return ResponseEntity.status(423).body(Map.of("message",
                    "Account locked after " + MAX_FAILED_ATTEMPTS + " failed attempts. Try again in " + LOCK_DURATION_MINUTES + " minutes."));
            }
            userRepository.save(user);
            return ResponseEntity.status(401).body(Map.of("message",
                "Invalid email or password. " + (MAX_FAILED_ATTEMPTS - attempts) + " attempts remaining."));
        }

        if (!user.isEmailVerified())
            return ResponseEntity.status(403).body(Map.of("message", "Please verify your email before logging in"));

        if (!user.isActive())
            return ResponseEntity.status(403).body(Map.of("message", "Account is frozen. Contact support."));

        // Reset failed attempts and update login info
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(request.getRemoteAddr());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(Map.of(
            "message", "Login successful",
            "token", token,
            "email", user.getEmail(),
            "name", user.getName() != null ? user.getName() : "",
            "role", user.getRole(),
            "userId", user.getId()
        ));
    }

    // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "").trim().toLowerCase();
        if (email.isEmpty()) return bad("Email is required");

        // Always return success to prevent email enumeration
        if (userRepository.existsByEmail(email)) {
            String otp = otpService.generateOtp(email, "RESET_PASSWORD");
            emailService.sendOtpEmail(email, otp, "RESET_PASSWORD", null);
        }

        return ResponseEntity.ok(Map.of("message",
            "If an account with this email exists, a reset code has been sent."));
    }

    // ─── RESET PASSWORD ──────────────────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email    = payload.getOrDefault("email", "").trim().toLowerCase();
        String otp      = payload.getOrDefault("otp", "").trim();
        String password = payload.getOrDefault("password", "");
        String confirm  = payload.getOrDefault("confirmPassword", "");

        if (email.isEmpty() || otp.isEmpty() || password.isEmpty())
            return bad("All fields are required");
        if (password.length() < 8)
            return bad("Password must be at least 8 characters");
        if (!password.matches(".*[A-Z].*"))
            return bad("Password must contain at least one uppercase letter");
        if (!password.matches(".*[0-9].*"))
            return bad("Password must contain at least one number");
        if (!password.equals(confirm))
            return bad("Passwords do not match");

        boolean valid = otpService.verifyOtp(email, otp, "RESET_PASSWORD");
        if (!valid)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired reset code"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(password));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login."));
    }

    // ─── CURRENT USER (me) ───────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestAttribute(required = false) String userEmail,
                                             jakarta.servlet.http.HttpServletRequest req) {
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token))
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));

        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole());
        response.put("emailVerified", user.isEmailVerified());
        response.put("isActive", user.isActive());
        response.put("lastLoginAt", user.getLastLoginAt());
        response.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail() {
        boolean sent = emailService.sendOtpEmail("sarodhuilgol@gmail.com", "123456", "LOGIN", "Test User");
        return ResponseEntity.ok(Map.of("sent", sent));
    }

    private ResponseEntity<Map<String, String>> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
