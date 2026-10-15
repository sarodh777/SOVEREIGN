package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "international_transfers")
public class InternationalTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_account_id", nullable = false)
    private BankAccount fromAccount;

    @Column(unique = true, nullable = false, length = 64)
    private String transactionId;

    @Column(length = 128)
    private String idempotencyKey;

    @Column(nullable = false, length = 150)
    private String recipientName;

    @Column(nullable = false, length = 80)
    private String recipientCountry;

    @Column(nullable = false, length = 150)
    private String recipientBankName;

    @Column(nullable = false, length = 60)
    private String recipientAccountNumber; // Full IBAN or account number

    @Column(nullable = false, length = 60)
    private String recipientAccountNumberMasked;

    @Column(length = 20)
    private String swiftBic;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal sendAmount;

    @Column(nullable = false, length = 10)
    private String sendCurrency = "INR";

    @Column(nullable = false, length = 10)
    private String targetCurrency;

    @Column(precision = 19, scale = 6, nullable = false)
    private BigDecimal exchangeRate;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal recipientAmount;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal fee;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal totalPayable;

    @Column(length = 100)
    private String transferPurpose;

    @Column(length = 255)
    private String paymentReference;

    private LocalDateTime rateTimestamp;

    @Column(length = 100)
    private String rateSource = "VAULTCHAIN FX Demo Engine (Simulated Rates)";

    @Column(nullable = false, length = 40)
    private String status = "PENDING"; // DRAFT, AWAITING_AUTHORIZATION, PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

    @Column(length = 100)
    private String estimatedDelivery = "1-2 Business Days (Simulated SWIFT Settlement)";

    @Column(length = 1000)
    private String digitalSignature;

    @Column(length = 1000)
    private String publicKey;

    @Column(length = 128)
    private String transactionHash;

    private Boolean signatureVerified = false;

    @Column(length = 128)
    private String blockchainHash;

    @Column(length = 500)
    private String failureReason;

    private Boolean isSimulated = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime completedAt;

    public InternationalTransfer() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BankAccount getFromAccount() { return fromAccount; }
    public void setFromAccount(BankAccount fromAccount) { this.fromAccount = fromAccount; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientCountry() { return recipientCountry; }
    public void setRecipientCountry(String recipientCountry) { this.recipientCountry = recipientCountry; }

    public String getRecipientBankName() { return recipientBankName; }
    public void setRecipientBankName(String recipientBankName) { this.recipientBankName = recipientBankName; }

    public String getRecipientAccountNumber() { return recipientAccountNumber; }
    public void setRecipientAccountNumber(String recipientAccountNumber) { this.recipientAccountNumber = recipientAccountNumber; }

    public String getRecipientAccountNumberMasked() { return recipientAccountNumberMasked; }
    public void setRecipientAccountNumberMasked(String recipientAccountNumberMasked) { this.recipientAccountNumberMasked = recipientAccountNumberMasked; }

    public String getSwiftBic() { return swiftBic; }
    public void setSwiftBic(String swiftBic) { this.swiftBic = swiftBic; }

    public BigDecimal getSendAmount() { return sendAmount; }
    public void setSendAmount(BigDecimal sendAmount) { this.sendAmount = sendAmount; }

    public String getSendCurrency() { return sendCurrency; }
    public void setSendCurrency(String sendCurrency) { this.sendCurrency = sendCurrency; }

    public String getTargetCurrency() { return targetCurrency; }
    public void setTargetCurrency(String targetCurrency) { this.targetCurrency = targetCurrency; }

    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }

    public BigDecimal getRecipientAmount() { return recipientAmount; }
    public void setRecipientAmount(BigDecimal recipientAmount) { this.recipientAmount = recipientAmount; }

    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }

    public BigDecimal getTotalPayable() { return totalPayable; }
    public void setTotalPayable(BigDecimal totalPayable) { this.totalPayable = totalPayable; }

    public String getTransferPurpose() { return transferPurpose; }
    public void setTransferPurpose(String transferPurpose) { this.transferPurpose = transferPurpose; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public LocalDateTime getRateTimestamp() { return rateTimestamp; }
    public void setRateTimestamp(LocalDateTime rateTimestamp) { this.rateTimestamp = rateTimestamp; }

    public String getRateSource() { return rateSource; }
    public void setRateSource(String rateSource) { this.rateSource = rateSource; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }

    public String getDigitalSignature() { return digitalSignature; }
    public void setDigitalSignature(String digitalSignature) { this.digitalSignature = digitalSignature; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }

    public Boolean getSignatureVerified() { return signatureVerified; }
    public void setSignatureVerified(Boolean signatureVerified) { this.signatureVerified = signatureVerified; }

    public String getBlockchainHash() { return blockchainHash; }
    public void setBlockchainHash(String blockchainHash) { this.blockchainHash = blockchainHash; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public Boolean getIsSimulated() { return isSimulated; }
    public void setIsSimulated(Boolean simulated) { isSimulated = simulated; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
