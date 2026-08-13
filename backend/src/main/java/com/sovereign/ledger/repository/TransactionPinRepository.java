package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.TransactionPin;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransactionPinRepository extends JpaRepository<TransactionPin, Long> {
    Optional<TransactionPin> findByUser(User user);
    boolean existsByUser(User user);
}
