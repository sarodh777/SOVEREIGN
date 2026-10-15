package com.sovereign.ledger.service;

import com.sovereign.ledger.model.TransactionSignatureAudit;
import com.sovereign.ledger.repository.TransactionSignatureAuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class DigitalSignatureService {

    @Autowired
    private TransactionSignatureAuditRepository auditRepository;

    public static class VerificationResult {
        private final boolean valid;
        private final String status; // VERIFIED, TAMPERED, INVALID_SIGNATURE, EXPIRED_NONCE, REPLAY_ATTACK
        private final String computedHash;
        private final String message;
        private final String canonicalPayload;

        public VerificationResult(boolean valid, String status, String computedHash, String message, String canonicalPayload) {
            this.valid = valid;
            this.status = status;
            this.computedHash = computedHash;
            this.message = message;
            this.canonicalPayload = canonicalPayload;
        }

        public boolean isValid() { return valid; }
        public String getStatus() { return status; }
        public String getComputedHash() { return computedHash; }
        public String getMessage() { return message; }
        public String getCanonicalPayload() { return canonicalPayload; }
    }

    /**
     * Canonical deterministic string representation of transaction data
     */
    public String createCanonicalRepresentation(String transactionId, String fromAccount, String toAccount,
                                                BigDecimal amount, long timestamp, String nonce) {
        String cleanTxId = transactionId != null ? transactionId.trim() : "";
        String cleanFrom = fromAccount != null ? fromAccount.trim() : "";
        String cleanTo = toAccount != null ? toAccount.trim() : "";
        String cleanAmount = amount != null ? amount.stripTrailingZeros().toPlainString() : "0";
        String cleanNonce = nonce != null ? nonce.trim() : "";

        return "transactionId:" + cleanTxId +
               "|fromAccount:" + cleanFrom +
               "|toAccount:" + cleanTo +
               "|amount:" + cleanAmount +
               "|timestamp:" + timestamp +
               "|nonce:" + cleanNonce;
    }

    /**
     * SHA-256 hash in lowercase hex
     */
    public String computeSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Complete cryptographic verification of digital signature and transaction integrity
     */
    public VerificationResult verifyTransaction(String transactionId, String fromAccount, String toAccount,
                                                BigDecimal amount, long timestamp, String nonce,
                                                String providedHash, String signatureHex, String publicKeyHex) {
        String canonical = createCanonicalRepresentation(transactionId, fromAccount, toAccount, amount, timestamp, nonce);
        String computedHash = computeSha256(canonical);

        // 1. Check data integrity: verify computed hash matches provided hash
        if (providedHash == null || !providedHash.equalsIgnoreCase(computedHash)) {
            return new VerificationResult(
                false,
                "TAMPERED",
                computedHash,
                "Transaction details have been modified after signing. Expected hash: " + computedHash + ", provided hash: " + providedHash,
                canonical
            );
        }

        // 2. Prevent replay attacks: check timestamp drift (max 30 minutes)
        long currentSec = Instant.now().getEpochSecond();
        long diffSec = Math.abs(currentSec - timestamp);
        if (diffSec > 1800) {
            return new VerificationResult(
                false,
                "EXPIRED_TIMESTAMP",
                computedHash,
                "Transaction timestamp is outside the allowed tolerance window (difference: " + diffSec + "s)",
                canonical
            );
        }

        // 3. Prevent replay attacks: check if nonce was already used in a previously VERIFIED transaction
        if (nonce != null && !nonce.isEmpty() && auditRepository.existsByNonceAndVerificationStatus(nonce, "VERIFIED")) {
            return new VerificationResult(
                false,
                "REPLAY_ATTACK",
                computedHash,
                "Nonce has already been used in a previously verified transaction",
                canonical
            );
        }

        // 4. Verify cryptographic signature
        if (publicKeyHex == null || publicKeyHex.trim().isEmpty()) {
            return new VerificationResult(false, "INVALID_SIGNATURE", computedHash, "Public key is missing", canonical);
        }
        if (signatureHex == null || signatureHex.trim().isEmpty()) {
            return new VerificationResult(false, "INVALID_SIGNATURE", computedHash, "Digital signature is missing", canonical);
        }

        try {
            byte[] pubKeyBytes = decodeKeyOrSignature(publicKeyHex.trim());
            byte[] sigBytes = decodeKeyOrSignature(signatureHex.trim());

            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(pubKeyBytes);
            KeyFactory kf = KeyFactory.getInstance("EC");
            PublicKey publicKey = kf.generatePublic(keySpec);

            byte[] dataToVerify = canonical.getBytes(StandardCharsets.UTF_8);

            boolean isSignatureValid = false;

            // Try IEEE P1363 format (native WebCrypto raw 64-byte signature)
            try {
                Signature sig = Signature.getInstance("SHA256withECDSAinP1363Format");
                sig.initVerify(publicKey);
                sig.update(dataToVerify);
                isSignatureValid = sig.verify(sigBytes);
            } catch (Exception ignored) {}

            // Fallback to standard ASN.1 DER format if needed
            if (!isSignatureValid) {
                try {
                    Signature sigDer = Signature.getInstance("SHA256withECDSA");
                    sigDer.initVerify(publicKey);
                    sigDer.update(dataToVerify);
                    isSignatureValid = sigDer.verify(sigBytes);
                } catch (Exception ignored) {}
            }

            if (!isSignatureValid) {
                return new VerificationResult(
                    false,
                    "INVALID_SIGNATURE",
                    computedHash,
                    "Digital signature verification failed. The signature does not correspond to the public key and payload.",
                    canonical
                );
            }

            return new VerificationResult(
                true,
                "VERIFIED",
                computedHash,
                "Digital signature and payload integrity cryptographically verified successfully via ECDSA-P256-SHA256.",
                canonical
            );

        } catch (Exception e) {
            return new VerificationResult(
                false,
                "INVALID_SIGNATURE",
                computedHash,
                "Cryptographic verification error: " + e.getMessage(),
                canonical
            );
        }
    }

    /**
     * Record verification audit log
     */
    public TransactionSignatureAudit recordAudit(String transactionId, String senderEmail, String fromAccount,
                                                 String toAccount, BigDecimal amount, String nonce,
                                                 Long timestamp, String canonicalPayload, String transactionHash,
                                                 String signature, String publicKey, String verificationStatus,
                                                 String verificationDetails, String verifiedBy) {
        TransactionSignatureAudit audit = new TransactionSignatureAudit();
        audit.setTransactionId(transactionId);
        audit.setSenderEmail(senderEmail);
        audit.setSenderAccount(fromAccount);
        audit.setRecipientAccount(toAccount);
        audit.setAmount(amount);
        audit.setNonce(nonce);
        audit.setTimestamp(timestamp);
        audit.setCanonicalPayload(canonicalPayload);
        audit.setTransactionHash(transactionHash);
        audit.setDigitalSignature(signature);
        audit.setPublicKey(publicKey);
        audit.setVerificationStatus(verificationStatus);
        audit.setVerificationDetails(verificationDetails);
        audit.setVerifiedBy(verifiedBy);
        audit.setCreatedAt(LocalDateTime.now());
        return auditRepository.save(audit);
    }

    private byte[] decodeKeyOrSignature(String input) {
        String clean = input.replaceAll("\\s+", "");
        // Check if Hex
        if (clean.matches("^[0-9a-fA-F]+$")) {
            return HexFormat.of().parseHex(clean);
        }
        // Try Base64
        return Base64.getDecoder().decode(clean);
    }
}
