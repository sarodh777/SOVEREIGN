package com.sovereign.ledger.service;

import com.sovereign.ledger.model.AuditLog;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log user action for compliance and security
     */
    public void logAction(User user, String action, String entityType, String entityId, String status) {
        try {
            AuditLog log = new AuditLog(user, action, entityType, status);
            log.setEntityId(entityId);
            log.setIpAddress(getClientIp());
            log.setUserAgent(System.getProperty("user.agent"));
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Log error but don't fail the main transaction
            System.err.println("Audit logging failed: " + e.getMessage());
        }
    }

    /**
     * Log action with failure reason
     */
    public void logFailure(User user, String action, String entityType, String reason) {
        try {
            AuditLog log = new AuditLog(user, action, entityType, "FAILURE");
            log.setFailureReason(reason);
            log.setIpAddress(getClientIp());
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Audit logging failed: " + e.getMessage());
        }
    }

    private String getClientIp() {
        // In production, extract from HTTP request headers
        return "127.0.0.1";
    }
}
