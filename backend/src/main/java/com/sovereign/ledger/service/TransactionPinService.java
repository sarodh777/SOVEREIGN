package com.sovereign.ledger.service;

import com.sovereign.ledger.model.TransactionPin;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.TransactionPinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class TransactionPinService {

    @Autowired private TransactionPinRepository transactionPinRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    /** Returns true if the user already has a PIN set */
    public boolean hasPinSet(User user) {
        return transactionPinRepository.existsByUser(user);
    }

    /** Set or update the transaction PIN (validates digits only, 4-15 chars) */
    public void setPin(User user, String rawPin) {
        if (!rawPin.matches("\\d{4,15}"))
            throw new IllegalArgumentException("PIN must be 4–15 digits (numbers only)");

        String hashed = passwordEncoder.encode(rawPin);
        TransactionPin pin = transactionPinRepository.findByUser(user)
            .orElse(new TransactionPin(user, hashed));
        pin.setPinHash(hashed);
        transactionPinRepository.save(pin);
    }

    /** Verify a raw PIN against the stored hash */
    public boolean verifyPin(User user, String rawPin) {
        return transactionPinRepository.findByUser(user)
            .map(pin -> passwordEncoder.matches(rawPin, pin.getPinHash()))
            .orElse(false);
    }
}
