package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.SmartTransferRule;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SmartTransferRuleRepository extends JpaRepository<SmartTransferRule, Long> {
    List<SmartTransferRule> findByUserOrderByCreatedAtDesc(User user);
    List<SmartTransferRule> findByStatusAndNextExecutionBefore(String status, LocalDateTime now);
    List<SmartTransferRule> findByUser(User user);
}
