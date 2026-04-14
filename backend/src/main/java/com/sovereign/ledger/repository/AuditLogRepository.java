package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.AuditLog;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);
    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);
    List<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<AuditLog> findByStatus(String status);
    List<AuditLog> findByUserAndActionOrderByCreatedAtDesc(User user, String action);
}
