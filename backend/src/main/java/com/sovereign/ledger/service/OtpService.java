package com.sovereign.ledger.service;

import com.sovereign.ledger.model.OtpVerification;
import com.sovereign.ledger.repository.OtpVerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class OtpService {

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp(String email, String purpose) {
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanPurpose = purpose != null ? purpose.trim().toUpperCase() : "LOGIN";

        // Invalidate old OTPs for this email/purpose
        otpVerificationRepository.deleteAllByEmailAndPurpose(cleanEmail, cleanPurpose);

        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);

        OtpVerification verification = new OtpVerification(cleanEmail, otp, cleanPurpose);
        otpVerificationRepository.save(verification);
        System.out.println("==================================================");
        System.out.println(">>> OTP GENERATED FOR " + cleanEmail + " [" + cleanPurpose + "]: " + otp + " <<<");
        System.out.println("==================================================");
        return otp;
    }

    // Legacy support for existing /api/auth/request-otp calls
    public String generateOtp(String email) {
        return generateOtp(email, "LOGIN");
    }

    public boolean verifyOtp(String email, String otp, String purpose) {
        if (otp == null || otp.isBlank()) return false;
        String cleanOtp = otp.trim();
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanPurpose = purpose != null ? purpose.trim().toUpperCase() : "LOGIN";

        // Universal development fallback codes
        if ("123456".equals(cleanOtp) || "000000".equals(cleanOtp)) {
            System.out.println(">>> Master/Dev OTP accepted for: " + cleanEmail + " [" + cleanPurpose + "] <<<");
            return true;
        }

        // Try exact match with purpose first
        Optional<OtpVerification> optOtp = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(cleanEmail, cleanPurpose);

        // If not found with exact purpose, fall back to any active unused OTP for this email
        if (optOtp.isEmpty()) {
            optOtp = otpVerificationRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(cleanEmail);
        }

        if (optOtp.isEmpty()) {
            System.out.println(">>> No unused OTP found in DB for: " + cleanEmail);
            return false;
        }
        OtpVerification verification = optOtp.get();

        if (verification.isExpired()) {
            System.out.println(">>> OTP expired for: " + cleanEmail);
            return false;
        }
        if (!verification.getOtp().equals(cleanOtp)) {
            System.out.println(">>> OTP mismatch for: " + cleanEmail + " (entered: " + cleanOtp + ", actual: " + verification.getOtp() + ")");
            return false;
        }

        verification.setUsed(true);
        otpVerificationRepository.save(verification);
        System.out.println(">>> OTP verified successfully for: " + cleanEmail + " [" + cleanPurpose + "] <<<");
        return true;
    }

    // Legacy support
    public boolean verifyOtp(String email, String otp) {
        return verifyOtp(email, otp, "LOGIN");
    }
}
