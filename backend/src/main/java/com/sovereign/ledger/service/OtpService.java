package com.sovereign.ledger.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // Simple in-memory store for OTPs mapped to email addresses
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp(String email) {
        // Generate a 6-digit secure random string
        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);
        otpStorage.put(email, otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null) return false;
        String storedOtp = otpStorage.get(email);
        if (otp.equals(storedOtp)) {
            // Invalidate OTP after successful verification
            otpStorage.remove(email);
            return true;
        }
        return false;
    }
}
