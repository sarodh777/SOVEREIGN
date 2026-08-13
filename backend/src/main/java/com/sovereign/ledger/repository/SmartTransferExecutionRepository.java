package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.SmartTransferExecution;
import com.sovereign.ledger.model.SmartTransferRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SmartTransferExecutionRepository extends JpaRepository<SmartTransferExecution, Long> {
    List<SmartTransferExecution> findByRuleOrderByExecutedAtDesc(SmartTransferRule rule);
    List<SmartTransferExecution> findByRule_UserOrderByExecutedAtDesc(com.sovereign.ledger.model.User user);
}
