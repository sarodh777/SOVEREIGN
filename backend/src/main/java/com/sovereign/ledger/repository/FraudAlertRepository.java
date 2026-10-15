package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.FraudAlert;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {

    Optional<FraudAlert> findByTransactionId(String transactionId);

    List<FraudAlert> findAllByOrderByCreatedAtDesc();

    List<FraudAlert> findByRiskLevelOrderByCreatedAtDesc(String riskLevel);

    List<FraudAlert> findByStatusOrderByCreatedAtDesc(String status);

    List<FraudAlert> findByUserOrderByCreatedAtDesc(User user);

    long countByRiskLevel(String riskLevel);

    long countByStatus(String status);

    long countByAdminDecision(String adminDecision);
}
