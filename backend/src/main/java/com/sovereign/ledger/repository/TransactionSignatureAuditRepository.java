package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.TransactionSignatureAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionSignatureAuditRepository extends JpaRepository<TransactionSignatureAudit, Long> {

    List<TransactionSignatureAudit> findBySenderEmailOrderByCreatedAtDesc(String senderEmail);

    List<TransactionSignatureAudit> findByTransactionIdOrderByCreatedAtDesc(String transactionId);

    Optional<TransactionSignatureAudit> findTopByTransactionIdOrderByCreatedAtDesc(String transactionId);

    List<TransactionSignatureAudit> findAllByOrderByCreatedAtDesc();

    long countByVerificationStatus(String verificationStatus);

    boolean existsByNonceAndVerificationStatus(String nonce, String verificationStatus);
}
