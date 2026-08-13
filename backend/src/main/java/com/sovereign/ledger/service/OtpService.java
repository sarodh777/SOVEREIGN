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
        // Invalidate old OTPs for this email/purpose
        otpVerificationRepository.deleteAllByEmailAndPurpose(email, purpose);

        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);

        OtpVerification verification = new OtpVerification(email, otp, purpose);
        otpVerificationRepository.save(verification);
        return otp;
    }

    // Legacy support for existing /api/auth/request-otp calls
    public String generateOtp(String email) {
        return generateOtp(email, "LOGIN");
    }

    public boolean verifyOtp(String email, String otp, String purpose) {
        Optional<OtpVerification> optOtp = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose);

        if (optOtp.isEmpty()) return false;
        OtpVerification verification = optOtp.get();

        if (verification.isExpired()) return false;
        if (!verification.getOtp().equals(otp)) return false;

        verification.setUsed(true);
        otpVerificationRepository.save(verification);
        return true;
    }

    // Legacy support
    public boolean verifyOtp(String email, String otp) {
        return verifyOtp(email, otp, "LOGIN");
    }
}
