package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.TransactionLog;
import com.sovereign.ledger.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionLogRepository extends JpaRepository<TransactionLog, Long> {
    Optional<TransactionLog> findByTransactionId(String transactionId);
    List<TransactionLog> findByFromAccountOrToAccountOrderByTransactionDateDesc(BankAccount from, BankAccount to);
    List<TransactionLog> findByFromAccountOrderByTransactionDateDesc(BankAccount account);
    List<TransactionLog> findByToAccountOrderByTransactionDateDesc(BankAccount account);
    List<TransactionLog> findByTypeAndStatusOrderByTransactionDateDesc(String type, String status);
    List<TransactionLog> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);
    List<TransactionLog> findByStatus(String status);
}
