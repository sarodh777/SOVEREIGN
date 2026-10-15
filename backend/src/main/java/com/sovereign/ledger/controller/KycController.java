package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.KycDocument;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.KycDocumentRepository;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = "http://localhost:5173")
public class KycController {

    @Autowired private KycDocumentRepository kycDocumentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    private User getUserFromRequest(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitKyc(@RequestBody Map<String, String> payload,
                                        HttpServletRequest req) {
        User user = getUserFromRequest(req);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Optional<KycDocument> existingOpt = kycDocumentRepository.findByUser(user);

        KycDocument kyc = existingOpt.orElse(new KycDocument(user));
        if ("VERIFIED".equals(kyc.getStatus()))
            return ResponseEntity.badRequest().body(Map.of("message", "KYC already verified"));

        String dobStr = payload.getOrDefault("dateOfBirth", "").trim();
        if (dobStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Date of birth is required"));
        }

        LocalDate dob;
        try {
            dob = LocalDate.parse(dobStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid date of birth format. Expected YYYY-MM-DD."));
        }

        LocalDate today = LocalDate.now();
        if (dob.isAfter(today)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Date of birth cannot be in the future"));
        }

        Period age = Period.between(dob, today);
        if (age.getYears() < 14) {
            return ResponseEntity.badRequest().body(Map.of("message", "You must be at least 14 years old to complete KYC."));
        }

        kyc.setFullName(payload.getOrDefault("fullName", ""));
        kyc.setDateOfBirth(dobStr);
        kyc.setAddress(payload.getOrDefault("address", ""));
        kyc.setAadhaarNumber(payload.getOrDefault("aadhaarNumber", ""));
        kyc.setPanNumber(payload.getOrDefault("panNumber", ""));
        kyc.setStatus("PENDING");
        kyc.setSubmittedAt(LocalDateTime.now());
        kyc.setRejectionReason(null);

        kycDocumentRepository.save(kyc);

        return ResponseEntity.ok(Map.of(
            "message", "KYC submitted successfully. Review pending.",
            "status", "PENDING"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getKycStatus(HttpServletRequest req) {
        User user = getUserFromRequest(req);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Optional<KycDocument> kycOpt = kycDocumentRepository.findByUser(user);
        if (kycOpt.isEmpty())
            return ResponseEntity.ok(Map.of("status", "NOT_SUBMITTED", "message", "No KYC submitted yet"));

        KycDocument kyc = kycOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("status", kyc.getStatus());
        response.put("fullName", kyc.getFullName());
        response.put("dateOfBirth", kyc.getDateOfBirth());
        response.put("address", kyc.getAddress());
        response.put("aadhaarNumber", kyc.getAadhaarNumber() != null ? "****" + kyc.getAadhaarNumber().substring(Math.max(0, kyc.getAadhaarNumber().length() - 4)) : null);
        response.put("panNumber", kyc.getPanNumber());
        response.put("submittedAt", kyc.getSubmittedAt());
        response.put("reviewedAt", kyc.getReviewedAt());
        response.put("rejectionReason", kyc.getRejectionReason());
        return ResponseEntity.ok(response);
    }
}
