package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByAccountNumber(String accountNumber);
    List<BankAccount> findByUser(User user);
    Optional<BankAccount> findByUserAndAccountType(User user, String accountType);
    List<BankAccount> findByStatus(String status);
}
