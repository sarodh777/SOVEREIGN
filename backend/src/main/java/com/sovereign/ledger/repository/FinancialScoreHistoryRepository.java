package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.FinancialScoreHistory;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FinancialScoreHistoryRepository extends JpaRepository<FinancialScoreHistory, Long> {
    List<FinancialScoreHistory> findByUserOrderByCreatedAtDesc(User user);
    List<FinancialScoreHistory> findTop20ByUserOrderByCreatedAtDesc(User user);
}
