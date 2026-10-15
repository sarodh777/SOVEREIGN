package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.InternationalTransfer;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InternationalTransferRepository extends JpaRepository<InternationalTransfer, Long> {

    Optional<InternationalTransfer> findByTransactionId(String transactionId);

    Optional<InternationalTransfer> findByIdempotencyKey(String idempotencyKey);

    List<InternationalTransfer> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT it FROM InternationalTransfer it WHERE it.user = :user " +
           "AND (:status IS NULL OR it.status = :status) " +
           "AND (:targetCurrency IS NULL OR it.targetCurrency = :targetCurrency) " +
           "AND (:recipientCountry IS NULL OR LOWER(it.recipientCountry) LIKE LOWER(CONCAT('%', :recipientCountry, '%'))) " +
           "AND (:startDate IS NULL OR it.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR it.createdAt <= :endDate) " +
           "ORDER BY it.createdAt DESC")
    List<InternationalTransfer> findWithFilters(
            @Param("user") User user,
            @Param("status") String status,
            @Param("targetCurrency") String targetCurrency,
            @Param("recipientCountry") String recipientCountry,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
