package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import com.sovereign.ledger.service.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private KycDocumentRepository kycDocumentRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private JwtUtil jwtUtil;

    private boolean isAdmin(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return false;
        String token = header.substring(7);
        return jwtUtil.validateToken(token) && "ROLE_ADMIN".equals(jwtUtil.getRoleFromToken(token));
    }

    private String getAdminEmail(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtUtil.getEmailFromToken(header.substring(7));
    }

    // ─── USERS ──────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> users = userRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("name", u.getName());
                m.put("email", u.getEmail());
                m.put("phone", u.getPhone());
                m.put("role", u.getRole());
                m.put("emailVerified", u.isEmailVerified());
                m.put("isActive", u.isActive());
                m.put("balance", u.getBalance());
                m.put("createdAt", u.getCreatedAt());
                m.put("lastLoginAt", u.getLastLoginAt());
                m.put("isAccountLocked", u.isAccountLocked());
                m.put("failedLoginAttempts", u.getFailedLoginAttempts());

                // KYC status
                kycDocumentRepository.findByUser(u).ifPresentOrElse(
                    kyc -> m.put("kycStatus", kyc.getStatus()),
                    () -> m.put("kycStatus", "NOT_SUBMITTED")
                );

                // Account info
                List<BankAccount> accounts = bankAccountRepository.findByUser(u);
                if (!accounts.isEmpty()) {
                    BankAccount acc = accounts.get(0);
                    m.put("accountNumber", acc.getAccountNumber());
                    m.put("accountBalance", acc.getBalance());
                    m.put("accountStatus", acc.getStatus());
                    m.put("accountId", acc.getId());
                }

                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "users", users, "total", users.size()));
    }

    // ─── USER DETAIL (accounts + recent tx) ─────────────────────────────────────
    @GetMapping("/users/{id}/details")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        return userRepository.findById(id).map(user -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", user.getId());
            result.put("name", user.getName());
            result.put("email", user.getEmail());
            result.put("phone", user.getPhone());
            result.put("role", user.getRole());
            result.put("emailVerified", user.isEmailVerified());
            result.put("isActive", user.isActive());
            result.put("isAccountLocked", user.isAccountLocked());
            result.put("failedLoginAttempts", user.getFailedLoginAttempts());
            result.put("lastLoginAt", user.getLastLoginAt());
            result.put("createdAt", user.getCreatedAt());

            kycDocumentRepository.findByUser(user).ifPresentOrElse(
                kyc -> result.put("kycStatus", kyc.getStatus()),
                () -> result.put("kycStatus", "NOT_SUBMITTED")
            );

            List<Map<String, Object>> accounts = bankAccountRepository.findByUser(user).stream().map(acc -> {
                Map<String, Object> am = new LinkedHashMap<>();
                am.put("id", acc.getId());
                am.put("accountNumber", acc.getAccountNumber());
                am.put("accountType", acc.getAccountType());
                am.put("balance", acc.getBalance());
                am.put("currency", acc.getCurrency());
                am.put("status", acc.getStatus());
                am.put("iban", acc.getIban());
                am.put("createdAt", acc.getCreatedAt());

                // Last 10 transactions for this account
                List<TransactionLog> txList = transactionLogRepository
                    .findByFromAccountOrToAccountOrderByTransactionDateDesc(acc, acc);
                List<Map<String, Object>> txMapped = txList.stream().limit(10).map(tx -> mapTx(tx, acc)).collect(Collectors.toList());
                am.put("recentTransactions", txMapped);
                return am;
            }).collect(Collectors.toList());

            result.put("accounts", accounts);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // ─── FREEZE / UNFREEZE ───────────────────────────────────────────────────────
    @PostMapping("/users/{id}/freeze")
    public ResponseEntity<?> freezeUser(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        return userRepository.findById(id).map(user -> {
            user.setActive(false);
            userRepository.save(user);
            bankAccountRepository.findByUser(user).forEach(acc -> {
                acc.setStatus("FROZEN");
                bankAccountRepository.save(acc);
            });
            return ResponseEntity.ok(Map.of("success", true, "message", "User account frozen"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PostMapping("/users/{id}/unfreeze")
    public ResponseEntity<?> unfreezeUser(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        return userRepository.findById(id).map(user -> {
            user.setActive(true);
            userRepository.save(user);
            bankAccountRepository.findByUser(user).forEach(acc -> {
                acc.setStatus("ACTIVE");
                bankAccountRepository.save(acc);
            });
            return ResponseEntity.ok(Map.of("success", true, "message", "User account unfrozen"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // ─── UNLOCK ACCOUNT (reset failed logins) ────────────────────────────────────
    @PostMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        return userRepository.findById(id).map(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Account unlocked successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // ─── ADMIN BALANCE ADJUSTMENT ─────────────────────────────────────────────────
    @PostMapping("/users/{id}/adjust-balance")
    public ResponseEntity<?> adjustBalance(@PathVariable Long id,
                                            @RequestBody Map<String, Object> payload,
                                            HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        String type   = String.valueOf(payload.getOrDefault("type", "CREDIT")); // CREDIT or DEBIT
        String reason = String.valueOf(payload.getOrDefault("reason", "Admin adjustment"));
        BigDecimal amount;
        try {
            amount = new BigDecimal(String.valueOf(payload.get("amount")));
            if (amount.compareTo(BigDecimal.ZERO) <= 0)
                return ResponseEntity.badRequest().body(Map.of("message", "Amount must be positive"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid amount"));
        }

        return userRepository.findById(id).map(user -> {
            List<BankAccount> accounts = bankAccountRepository.findByUser(user);
            if (accounts.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "User has no bank account"));

            BankAccount acc = accounts.get(0);

            if ("DEBIT".equals(type)) {
                if (acc.getBalance().compareTo(amount) < 0)
                    return ResponseEntity.badRequest().body(Map.of("message", "Insufficient balance for debit"));
                acc.setBalance(acc.getBalance().subtract(amount));
            } else {
                acc.setBalance(acc.getBalance().add(amount));
            }

            acc.setLastTransactionAt(LocalDateTime.now());
            bankAccountRepository.save(acc);

            // Log the admin transaction
            TransactionLog log = new TransactionLog();
            log.setFromAccount("CREDIT".equals(type) ? null : acc);
            log.setToAccount("CREDIT".equals(type) ? acc : null);
            log.setAmount(amount);
            log.setType("ADMIN_ADJUSTMENT");
            log.setStatus("COMPLETED");
            log.setTransactionId("ADJ-" + System.currentTimeMillis());
            log.setReference("Admin " + type + ": " + reason);
            log.setDescription(reason);
            log.setTransactionDate(LocalDateTime.now());
            log.setCompletedDate(LocalDateTime.now());
            transactionLogRepository.save(log);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", type + " of ₹" + amount + " applied successfully",
                "newBalance", acc.getBalance()
            ));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // ─── KYC MANAGEMENT ──────────────────────────────────────────────────────────
    @GetMapping("/kyc/pending")
    public ResponseEntity<?> getPendingKyc(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        List<Map<String, Object>> pending = kycDocumentRepository.findByStatus("PENDING")
            .stream().map(kyc -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", kyc.getId());
                m.put("userId", kyc.getUser().getId());
                m.put("userName", kyc.getUser().getName());
                m.put("userEmail", kyc.getUser().getEmail());
                m.put("fullName", kyc.getFullName());
                m.put("dateOfBirth", kyc.getDateOfBirth());
                m.put("address", kyc.getAddress());
                m.put("aadhaarNumber", kyc.getAadhaarNumber());
                m.put("panNumber", kyc.getPanNumber());
                m.put("status", kyc.getStatus());
                m.put("submittedAt", kyc.getSubmittedAt());
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "kyc", pending));
    }

    @PostMapping("/kyc/{id}/approve")
    public ResponseEntity<?> approveKyc(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        String adminEmail = getAdminEmail(req);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;

        return kycDocumentRepository.findById(id).map(kyc -> {
            kyc.setStatus("VERIFIED");
            kyc.setReviewedAt(LocalDateTime.now());
            kyc.setReviewedBy(admin);
            kycDocumentRepository.save(kyc);
            return ResponseEntity.ok(Map.of("success", true, "message", "KYC approved"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "KYC not found")));
    }

    @PostMapping("/kyc/{id}/reject")
    public ResponseEntity<?> rejectKyc(@PathVariable Long id,
                                         @RequestBody Map<String, String> payload,
                                         HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        String reason = payload.getOrDefault("reason", "Does not meet requirements");
        String adminEmail = getAdminEmail(req);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;

        return kycDocumentRepository.findById(id).map(kyc -> {
            kyc.setStatus("REJECTED");
            kyc.setRejectionReason(reason);
            kyc.setReviewedAt(LocalDateTime.now());
            kyc.setReviewedBy(admin);
            kycDocumentRepository.save(kyc);
            return ResponseEntity.ok(Map.of("success", true, "message", "KYC rejected"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "KYC not found")));
    }

    // ─── ANALYTICS ───────────────────────────────────────────────────────────────
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<User> allUsers = userRepository.findAll();
        long totalUsers    = allUsers.size();
        long activeUsers   = allUsers.stream().filter(User::isActive).count();
        long frozenUsers   = totalUsers - activeUsers;
        long lockedUsers   = allUsers.stream().filter(User::isAccountLocked).count();
        long totalTx       = transactionLogRepository.count();
        long pendingKyc    = kycDocumentRepository.findByStatus("PENDING").size();

        // Total balance across all bank accounts
        BigDecimal totalBalance = bankAccountRepository.findAll().stream()
            .map(BankAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total transaction volume (completed)
        BigDecimal txVolume = transactionLogRepository.findByStatus("COMPLETED").stream()
            .map(TransactionLog::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Daily transaction counts for last 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<TransactionLog> recentTx = transactionLogRepository
            .findByTransactionDateBetween(sevenDaysAgo, LocalDateTime.now());

        Map<String, Long> dailyCounts = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i);
            String key = day.toLocalDate().toString();
            long count = recentTx.stream()
                .filter(t -> t.getTransactionDate().toLocalDate().equals(day.toLocalDate()))
                .count();
            dailyCounts.put(key, count);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("activeUsers", activeUsers);
        result.put("frozenUsers", frozenUsers);
        result.put("lockedUsers", lockedUsers);
        result.put("totalTransactions", totalTx);
        result.put("pendingKyc", pendingKyc);
        result.put("totalBalance", totalBalance);
        result.put("txVolume", txVolume);
        result.put("dailyTxCounts", dailyCounts);

        return ResponseEntity.ok(result);
    }

    // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> logs = auditLogRepository.findAll().stream()
            .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
            .limit(200)
            .map(log -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", log.getId());
                m.put("userEmail", log.getUser() != null ? log.getUser().getEmail() : "system");
                m.put("userName", log.getUser() != null ? log.getUser().getName() : "System");
                m.put("action", log.getAction());
                m.put("entityType", log.getEntityType());
                m.put("entityId", log.getEntityId());
                m.put("details", log.getDetails());
                m.put("ipAddress", log.getIpAddress());
                m.put("status", log.getStatus());
                m.put("failureReason", log.getFailureReason());
                m.put("createdAt", log.getCreatedAt());
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "logs", logs, "total", logs.size()));
    }

    // ─── ALL TRANSACTIONS ────────────────────────────────────────────────────────
    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> transactions = transactionLogRepository.findAll().stream()
            .sorted(Comparator.comparing(TransactionLog::getTransactionDate).reversed())
            .limit(200)
            .map(tx -> mapTx(tx, null))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "transactions", transactions));
    }

    // ─── HELPER: Map TransactionLog to safe JSON ─────────────────────────────────
    private Map<String, Object> mapTx(TransactionLog tx, BankAccount viewingAccount) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", tx.getId());
        m.put("transactionId", tx.getTransactionId());
        m.put("amount", tx.getAmount());
        m.put("type", tx.getType());
        m.put("status", tx.getStatus());
        m.put("reference", tx.getReference());
        m.put("description", tx.getDescription());
        m.put("blockchainHash", tx.getBlockchainHash());
        m.put("date", tx.getTransactionDate());
        m.put("completedDate", tx.getCompletedDate());
        m.put("fee", tx.getFee());

        // From account info
        if (tx.getFromAccount() != null) {
            m.put("fromAccountId", tx.getFromAccount().getId());
            m.put("fromAccountNumber", tx.getFromAccount().getAccountNumber());
            m.put("fromUserEmail", tx.getFromAccount().getUser() != null
                ? tx.getFromAccount().getUser().getEmail() : null);
            m.put("fromUserName", tx.getFromAccount().getUser() != null
                ? tx.getFromAccount().getUser().getName() : null);
        }

        // To account info
        if (tx.getToAccount() != null) {
            m.put("toAccountId", tx.getToAccount().getId());
            m.put("toAccountNumber", tx.getToAccount().getAccountNumber());
            m.put("toUserEmail", tx.getToAccount().getUser() != null
                ? tx.getToAccount().getUser().getEmail() : null);
            m.put("toUserName", tx.getToAccount().getUser() != null
                ? tx.getToAccount().getUser().getName() : null);
        }

        // Determine direction from perspective of viewingAccount
        if (viewingAccount != null) {
            boolean isCredit = tx.getToAccount() != null &&
                tx.getToAccount().getId().equals(viewingAccount.getId());
            m.put("direction", isCredit ? "IN" : "OUT");
        }

        return m;
    }
}
