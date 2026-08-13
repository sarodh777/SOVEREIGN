package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.FinancialScore;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FinancialScoreRepository extends JpaRepository<FinancialScore, Long> {
    Optional<FinancialScore> findByUser(User user);
}
