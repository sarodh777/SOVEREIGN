package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_signature_audits")
public class TransactionSignatureAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String transactionId;

    @Column(length = 255)
    private String senderEmail;

    @Column(length = 64)
    private String senderAccount;

    @Column(length = 64)
    private String recipientAccount;

    @Column(precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(length = 64)
    private String nonce;

    private Long timestamp;

    @Column(columnDefinition = "TEXT")
    private String canonicalPayload;

    @Column(length = 128)
    private String transactionHash;

    @Column(columnDefinition = "TEXT")
    private String digitalSignature;

    @Column(columnDefinition = "TEXT")
    private String publicKey;

    @Column(length = 64, nullable = false)
    private String verificationStatus; // VERIFIED, FAILED, TAMPERED, INVALID_SIGNATURE

    @Column(columnDefinition = "TEXT")
    private String verificationDetails;

    @Column(length = 64)
    private String verifiedBy; // SYSTEM_PRE_CHECK, SYSTEM_EXECUTION, USER_VERIFICATION, ADMIN_VERIFICATION

    private LocalDateTime createdAt = LocalDateTime.now();

    public TransactionSignatureAudit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getSenderAccount() { return senderAccount; }
    public void setSenderAccount(String senderAccount) { this.senderAccount = senderAccount; }

    public String getRecipientAccount() { return recipientAccount; }
    public void setRecipientAccount(String recipientAccount) { this.recipientAccount = recipientAccount; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public String getCanonicalPayload() { return canonicalPayload; }
    public void setCanonicalPayload(String canonicalPayload) { this.canonicalPayload = canonicalPayload; }

    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }

    public String getDigitalSignature() { return digitalSignature; }
    public void setDigitalSignature(String digitalSignature) { this.digitalSignature = digitalSignature; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerificationDetails() { return verificationDetails; }
    public void setVerificationDetails(String verificationDetails) { this.verificationDetails = verificationDetails; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
