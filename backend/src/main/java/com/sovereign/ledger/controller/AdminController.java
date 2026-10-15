package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.model.TransactionLog;
import com.sovereign.ledger.model.FraudAlert;
import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.*;
import com.sovereign.ledger.service.JwtUtil;
import com.sovereign.ledger.service.DigitalSignatureService;
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
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private KycDocumentRepository kycDocumentRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private com.sovereign.ledger.service.AuditService auditService;
    @Autowired private FraudAlertRepository fraudAlertRepository;
    @Autowired private com.sovereign.ledger.service.FraudDetectionService fraudDetectionService;
    @Autowired private com.sovereign.ledger.repository.TransactionSignatureAuditRepository transactionSignatureAuditRepository;
    @Autowired private com.sovereign.ledger.service.DigitalSignatureService digitalSignatureService;

    // â”€â”€â”€ ADMIN STATUS CHECK / ROLE PERMISSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private boolean isAdmin(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return false;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return false;
        String role = jwtUtil.getRoleFromToken(token);
        return "ROLE_ADMIN".equals(role) || "ROLE_SUPER_ADMIN".equals(role);
    }

    private boolean isSuperAdmin(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return false;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return false;
        return "ROLE_SUPER_ADMIN".equals(jwtUtil.getRoleFromToken(token));
    }

    private String getAdminEmail(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtUtil.getEmailFromToken(header.substring(7));
    }

    private String getClientIp(HttpServletRequest req) {
        String remoteAddr = req.getHeader("X-Forwarded-For");
        if (remoteAddr == null || remoteAddr.isEmpty() || "unknown".equalsIgnoreCase(remoteAddr)) {
            remoteAddr = req.getRemoteAddr();
        }
        return remoteAddr != null ? remoteAddr : "127.0.0.1";
    }

    // â”€â”€â”€ DASHBOARD STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(User::isActive).count();
        long blockedUsers = allUsers.stream().filter(u -> !u.isActive()).count();
        long lockedUsers = allUsers.stream().filter(User::isAccountLocked).count();
        long verifiedUsers = allUsers.stream().filter(User::isEmailVerified).count();

        long pendingKyc = kycDocumentRepository.findByStatus("PENDING").size();
        long underReviewKyc = kycDocumentRepository.findByStatus("UNDER_REVIEW").size();
        long verifiedKyc = kycDocumentRepository.findByStatus("VERIFIED").size();
        long rejectedKyc = kycDocumentRepository.findByStatus("REJECTED").size();

        long totalTx = transactionLogRepository.count();
        long failedTx = transactionLogRepository.findAll().stream()
            .filter(t -> "FAILED".equalsIgnoreCase(t.getStatus())).count();

        // Total system balance
        BigDecimal totalBalance = bankAccountRepository.findAll().stream()
            .map(BankAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Transaction volume
        BigDecimal txVolume = transactionLogRepository.findByStatus("COMPLETED").stream()
            .map(TransactionLog::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Daily transaction counts & volume for last 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<TransactionLog> recentTx = transactionLogRepository
            .findByTransactionDateBetween(sevenDaysAgo, LocalDateTime.now());

        Map<String, Long> dailyTxCounts = new LinkedHashMap<>();
        Map<String, BigDecimal> dailyTxVolume = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i);
            String key = day.toLocalDate().toString();
            List<TransactionLog> dayList = recentTx.stream()
                .filter(t -> t.getTransactionDate() != null && t.getTransactionDate().toLocalDate().equals(day.toLocalDate()))
                .collect(Collectors.toList());
            dailyTxCounts.put(key, (long) dayList.size());
            BigDecimal sum = dayList.stream()
                .map(TransactionLog::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            dailyTxVolume.put(key, sum);
        }

        // Recent login attempts from audit logs
        List<AuditLog> recentLoginLogs = auditLogRepository.findAll().stream()
            .filter(l -> "LOGIN".equalsIgnoreCase(l.getAction()) || "LOGIN_FAILED".equalsIgnoreCase(l.getAction()))
            .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
            .limit(10)
            .collect(Collectors.toList());

        List<Map<String, Object>> recentLogins = recentLoginLogs.stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", l.getId());
            m.put("email", l.getUser() != null ? l.getUser().getEmail() : "Unknown");
            m.put("status", l.getStatus());
            m.put("reason", l.getFailureReason());
            m.put("ipAddress", l.getIpAddress());
            m.put("timestamp", l.getCreatedAt());
            return m;
        }).collect(Collectors.toList());

        // Suspicious accounts count (failed logins >= 3 or blocked)
        long suspiciousAccounts = allUsers.stream()
            .filter(u -> u.getFailedLoginAttempts() >= 3 || u.isAccountLocked() || !u.isActive())
            .count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalUsers", totalUsers);
        res.put("activeUsers", activeUsers);
        res.put("blockedUsers", blockedUsers);
        res.put("lockedUsers", lockedUsers);
        res.put("verifiedUsers", verifiedUsers);
        res.put("pendingKyc", pendingKyc);
        res.put("underReviewKyc", underReviewKyc);
        res.put("verifiedKyc", verifiedKyc);
        res.put("rejectedKyc", rejectedKyc);
        res.put("totalTransactions", totalTx);
        res.put("failedTransactions", failedTx);
        res.put("suspiciousAccounts", suspiciousAccounts);
        res.put("totalBalance", totalBalance);
        res.put("txVolume", txVolume);
        res.put("dailyTxCounts", dailyTxCounts);
        res.put("dailyTxVolume", dailyTxVolume);
        res.put("recentLogins", recentLogins);

        return ResponseEntity.ok(res);
    }

    // â”€â”€â”€ USER MANAGEMENT: SEARCH & LIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                m.put("lastLoginIp", u.getLastLoginIp());
                m.put("isAccountLocked", u.isAccountLocked());
                m.put("failedLoginAttempts", u.getFailedLoginAttempts());

                // Risk status computation
                String riskStatus = "LOW";
                if (!u.isActive()) riskStatus = "BLOCKED";
                else if (u.isAccountLocked()) riskStatus = "LOCKED";
                else if (u.getFailedLoginAttempts() >= 3) riskStatus = "HIGH";
                else if (u.getFailedLoginAttempts() > 0) riskStatus = "MEDIUM";
                m.put("riskStatus", riskStatus);

                // KYC status
                kycDocumentRepository.findByUser(u).ifPresentOrElse(
                    kyc -> m.put("kycStatus", kyc.getStatus()),
                    () -> m.put("kycStatus", "NOT_SUBMITTED")
                );

                // Bank Account info
                List<BankAccount> accounts = bankAccountRepository.findByUser(u);
                if (!accounts.isEmpty()) {
                    BankAccount acc = accounts.get(0);
                    m.put("accountNumber", acc.getAccountNumber());
                    m.put("accountBalance", acc.getBalance());
                    m.put("accountStatus", acc.getStatus());
                    m.put("accountType", acc.getAccountType());
                    m.put("accountId", acc.getId());
                } else {
                    m.put("accountNumber", "N/A");
                    m.put("accountBalance", BigDecimal.ZERO);
                    m.put("accountStatus", "NO_ACCOUNT");
                    m.put("accountType", "SAVINGS");
                }

                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "users", users, "total", users.size()));
    }

    // â”€â”€â”€ USER DETAILS: TABBED FULL PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/users/{id}/details")
    public ResponseEntity<?> getUserFullDetails(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        return userRepository.findById(id).map(user -> {
            Map<String, Object> result = new LinkedHashMap<>();

            // 1. Personal Info
            Map<String, Object> personalInfo = new LinkedHashMap<>();
            personalInfo.put("id", user.getId());
            personalInfo.put("name", user.getName());
            personalInfo.put("email", user.getEmail());
            personalInfo.put("phone", user.getPhone());
            personalInfo.put("role", user.getRole());
            personalInfo.put("emailVerified", user.isEmailVerified());
            personalInfo.put("createdAt", user.getCreatedAt());

            // 2. Account Info
            List<BankAccount> accounts = bankAccountRepository.findByUser(user);
            List<Map<String, Object>> accountsList = accounts.stream().map(acc -> {
                Map<String, Object> am = new LinkedHashMap<>();
                am.put("id", acc.getId());
                am.put("accountNumber", acc.getAccountNumber());
                am.put("accountType", acc.getAccountType());
                am.put("balance", acc.getBalance());
                am.put("currency", acc.getCurrency());
                am.put("status", acc.getStatus());
                am.put("iban", acc.getIban());
                am.put("createdAt", acc.getCreatedAt());
                am.put("lastTransactionAt", acc.getLastTransactionAt());
                return am;
            }).collect(Collectors.toList());

            Map<String, Object> accountInfo = new LinkedHashMap<>();
            accountInfo.put("isActive", user.isActive());
            accountInfo.put("isAccountLocked", user.isAccountLocked());
            accountInfo.put("failedLoginAttempts", user.getFailedLoginAttempts());
            accountInfo.put("lockedUntil", user.getLockedUntil());
            accountInfo.put("lastLoginAt", user.getLastLoginAt());
            accountInfo.put("lastLoginIp", user.getLastLoginIp());
            accountInfo.put("accounts", accountsList);

            // 3. KYC Information
            Map<String, Object> kycInfo = new LinkedHashMap<>();
            Optional<KycDocument> kycOpt = kycDocumentRepository.findByUser(user);
            if (kycOpt.isPresent()) {
                KycDocument kyc = kycOpt.get();
                kycInfo.put("hasKyc", true);
                kycInfo.put("id", kyc.getId());
                kycInfo.put("status", kyc.getStatus());
                kycInfo.put("fullName", kyc.getFullName());
                kycInfo.put("dateOfBirth", kyc.getDateOfBirth());
                kycInfo.put("address", kyc.getAddress());
                kycInfo.put("aadhaarNumber", kyc.getAadhaarNumber());
                kycInfo.put("panNumber", kyc.getPanNumber());
                kycInfo.put("aadhaarImagePath", kyc.getAadhaarImagePath());
                kycInfo.put("photoPath", kyc.getPhotoPath());
                kycInfo.put("submittedAt", kyc.getSubmittedAt());
                kycInfo.put("reviewedAt", kyc.getReviewedAt());
                kycInfo.put("rejectionReason", kyc.getRejectionReason());
                kycInfo.put("reviewedBy", kyc.getReviewedBy() != null ? kyc.getReviewedBy().getEmail() : null);
            } else {
                kycInfo.put("hasKyc", false);
                kycInfo.put("status", "NOT_SUBMITTED");
            }

            // 4. Transaction History
            List<Map<String, Object>> txHistory = new ArrayList<>();
            for (BankAccount acc : accounts) {
                List<TransactionLog> txList = transactionLogRepository
                    .findByFromAccountOrToAccountOrderByTransactionDateDesc(acc, acc);
                txList.stream().limit(50).forEach(tx -> txHistory.add(mapTx(tx, acc)));
            }

            // 5. Security Activity (Audit logs relating to this user)
            List<AuditLog> userAuditLogs = auditLogRepository.findByUserOrderByCreatedAtDesc(user);
            List<Map<String, Object>> securityLogs = userAuditLogs.stream().limit(30).map(l -> {
                Map<String, Object> lm = new LinkedHashMap<>();
                lm.put("id", l.getId());
                lm.put("action", l.getAction());
                lm.put("entityType", l.getEntityType());
                lm.put("details", l.getDetails());
                lm.put("status", l.getStatus());
                lm.put("failureReason", l.getFailureReason());
                lm.put("ipAddress", l.getIpAddress());
                lm.put("timestamp", l.getCreatedAt());
                return lm;
            }).collect(Collectors.toList());

            // 6. Blockchain Activity (transactions with blockchain hashes)
            List<Map<String, Object>> blockchainTx = txHistory.stream()
                .filter(t -> t.get("blockchainHash") != null && !t.get("blockchainHash").toString().isEmpty())
                .collect(Collectors.toList());

            result.put("personalInfo", personalInfo);
            result.put("accountInfo", accountInfo);
            result.put("kycInfo", kycInfo);
            result.put("transactions", txHistory);
            result.put("securityLogs", securityLogs);
            result.put("blockchainActivity", blockchainTx);

            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // â”€â”€â”€ BLOCK / UNBLOCK / SUSPEND USER (With mandatory reason + Audit Log) â”€â”€â”€â”€â”€â”€
    @PostMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id,
                                              @RequestBody Map<String, String> payload,
                                              HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        String action = payload.getOrDefault("action", "BLOCK").toUpperCase(); // BLOCK, UNBLOCK, SUSPEND
        String reason = payload.getOrDefault("reason", "").trim();

        if (reason.isEmpty() && ("BLOCK".equals(action) || "SUSPEND".equals(action))) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid reason is required for blocking/suspending an account."));
        }

        String adminEmail = getAdminEmail(req);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        String ipAddress = getClientIp(req);

        return userRepository.findById(id).map(user -> {
            boolean setActive = "UNBLOCK".equals(action);
            user.setActive(setActive);
            userRepository.save(user);

            // Update bank account statuses
            String accStatus = setActive ? "ACTIVE" : ("SUSPEND".equals(action) ? "SUSPENDED" : "FROZEN");
            bankAccountRepository.findByUser(user).forEach(acc -> {
                acc.setStatus(accStatus);
                bankAccountRepository.save(acc);
            });

            // Write to Audit Log
            String logAction = "ACCOUNT_" + action;
            String details = "Admin [" + adminEmail + "] performed " + action + " on user [" + user.getEmail() + "]. Reason: " + reason;
            auditService.logAction(admin != null ? admin : user, logAction, "USER", String.valueOf(user.getId()), "SUCCESS", details, null, ipAddress);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Account successfully " + action.toLowerCase() + "ed.",
                "status", accStatus
            ));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // Legacy Freeze / Unfreeze mappings for backwards compatibility
    @PostMapping("/users/{id}/freeze")
    public ResponseEntity<?> freezeUser(@PathVariable Long id, HttpServletRequest req) {
        Map<String, String> payload = new HashMap<>();
        payload.put("action", "BLOCK");
        payload.put("reason", "Admin direct block");
        return updateUserStatus(id, payload, req);
    }

    @PostMapping("/users/{id}/unfreeze")
    public ResponseEntity<?> unfreezeUser(@PathVariable Long id, HttpServletRequest req) {
        Map<String, String> payload = new HashMap<>();
        payload.put("action", "UNBLOCK");
        payload.put("reason", "Admin unblock");
        return updateUserStatus(id, payload, req);
    }

    // â”€â”€â”€ UNLOCK ACCOUNT (Reset failed logins) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @PostMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        String adminEmail = getAdminEmail(req);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;

        return userRepository.findById(id).map(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);

            String details = "Admin [" + adminEmail + "] unlocked user account [" + user.getEmail() + "]";
            auditService.logAction(admin != null ? admin : user, "ACCOUNT_UNLOCKED", "USER", String.valueOf(user.getId()), "SUCCESS", details, null, getClientIp(req));

            return ResponseEntity.ok(Map.of("success", true, "message", "Account unlocked successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // â”€â”€â”€ KYC MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/kyc/list")
    public ResponseEntity<?> getKycList(@RequestParam(required = false) String status, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<KycDocument> list;
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = kycDocumentRepository.findByStatus(status.toUpperCase());
        } else {
            list = kycDocumentRepository.findAll();
        }

        List<Map<String, Object>> mapped = list.stream().map(kyc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", kyc.getId());
            m.put("userId", kyc.getUser() != null ? kyc.getUser().getId() : null);
            m.put("userName", kyc.getUser() != null ? kyc.getUser().getName() : "N/A");
            m.put("userEmail", kyc.getUser() != null ? kyc.getUser().getEmail() : "N/A");
            m.put("fullName", kyc.getFullName());
            m.put("dateOfBirth", kyc.getDateOfBirth());
            m.put("address", kyc.getAddress());
            m.put("aadhaarNumber", kyc.getAadhaarNumber());
            m.put("panNumber", kyc.getPanNumber());
            m.put("aadhaarImagePath", kyc.getAadhaarImagePath());
            m.put("photoPath", kyc.getPhotoPath());
            m.put("status", kyc.getStatus());
            m.put("rejectionReason", kyc.getRejectionReason());
            m.put("submittedAt", kyc.getSubmittedAt());
            m.put("reviewedAt", kyc.getReviewedAt());
            m.put("reviewedBy", kyc.getReviewedBy() != null ? kyc.getReviewedBy().getEmail() : null);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "kyc", mapped));
    }

    @GetMapping("/kyc/pending")
    public ResponseEntity<?> getPendingKyc(HttpServletRequest req) {
        return getKycList("PENDING", req);
    }

    @PostMapping("/kyc/{id}/approve")
    public ResponseEntity<?> approveKyc(@PathVariable Long id, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        String adminEmail = getAdminEmail(req);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        String ip = getClientIp(req);

        return kycDocumentRepository.findById(id).map(kyc -> {
            kyc.setStatus("VERIFIED");
            kyc.setReviewedAt(LocalDateTime.now());
            kyc.setReviewedBy(admin);
            kycDocumentRepository.save(kyc);

            String details = "Admin [" + adminEmail + "] approved KYC for user [" + (kyc.getUser() != null ? kyc.getUser().getEmail() : "ID:" + kyc.getId()) + "]";
            auditService.logAction(admin, "KYC_APPROVED", "KYC", String.valueOf(kyc.getId()), "SUCCESS", details, null, ip);

            return ResponseEntity.ok(Map.of("success", true, "message", "KYC approved successfully"));
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
        String ip = getClientIp(req);

        return kycDocumentRepository.findById(id).map(kyc -> {
            kyc.setStatus("REJECTED");
            kyc.setRejectionReason(reason);
            kyc.setReviewedAt(LocalDateTime.now());
            kyc.setReviewedBy(admin);
            kycDocumentRepository.save(kyc);

            String details = "Admin [" + adminEmail + "] rejected KYC for user [" + (kyc.getUser() != null ? kyc.getUser().getEmail() : "ID:" + kyc.getId()) + "]. Reason: " + reason;
            auditService.logAction(admin, "KYC_REJECTED", "KYC", String.valueOf(kyc.getId()), "SUCCESS", details, reason, ip);

            return ResponseEntity.ok(Map.of("success", true, "message", "KYC rejected successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "KYC not found")));
    }

    // â”€â”€â”€ TRANSACTION MONITORING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> transactions = transactionLogRepository.findAll().stream()
            .sorted(Comparator.comparing(TransactionLog::getTransactionDate, Comparator.nullsLast(Comparator.reverseOrder())))
            .filter(tx -> {
                if (userId != null) {
                    boolean fromMatches = tx.getFromAccount() != null && tx.getFromAccount().getUser() != null && tx.getFromAccount().getUser().getId().equals(userId);
                    boolean toMatches = tx.getToAccount() != null && tx.getToAccount().getUser() != null && tx.getToAccount().getUser().getId().equals(userId);
                    if (!fromMatches && !toMatches) return false;
                }
                if (status != null && !status.equalsIgnoreCase("ALL") && !status.isEmpty()) {
                    if (tx.getStatus() == null || !tx.getStatus().equalsIgnoreCase(status)) return false;
                }
                if (startDate != null && !startDate.isEmpty()) {
                    try {
                        LocalDateTime start = LocalDateTime.parse(startDate.length() == 10 ? startDate + "T00:00:00" : startDate);
                        if (tx.getTransactionDate() != null && tx.getTransactionDate().isBefore(start)) return false;
                    } catch (Exception ignored) {}
                }
                if (endDate != null && !endDate.isEmpty()) {
                    try {
                        LocalDateTime end = LocalDateTime.parse(endDate.length() == 10 ? endDate + "T23:59:59" : endDate);
                        if (tx.getTransactionDate() != null && tx.getTransactionDate().isAfter(end)) return false;
                    } catch (Exception ignored) {}
                }
                return true;
            })
            .limit(1000)
            .map(tx -> mapTx(tx, null))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "transactions", transactions, "total", transactions.size()));
    }

    // â”€â”€â”€ SECURITY MONITORING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/security/events")
    public ResponseEntity<?> getSecurityEvents(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<AuditLog> allLogs = auditLogRepository.findAll();
        List<Map<String, Object>> events = allLogs.stream()
            .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
            .limit(300)
            .map(l -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", l.getId());
                m.put("userEmail", l.getUser() != null ? l.getUser().getEmail() : "System");
                m.put("userName", l.getUser() != null ? l.getUser().getName() : "System");
                m.put("action", l.getAction());
                m.put("entityType", l.getEntityType());
                m.put("entityId", l.getEntityId());
                m.put("details", l.getDetails());
                m.put("status", l.getStatus());
                m.put("failureReason", l.getFailureReason());
                m.put("ipAddress", l.getIpAddress());
                m.put("timestamp", l.getCreatedAt());

                // Anomaly flag
                boolean isSuspicious = "FAILURE".equalsIgnoreCase(l.getStatus()) ||
                    "ACCOUNT_LOCKED".equalsIgnoreCase(l.getAction()) ||
                    "LOGIN_FAILED".equalsIgnoreCase(l.getAction()) ||
                    "ACCOUNT_BLOCK".equalsIgnoreCase(l.getAction());
                m.put("isSuspicious", isSuspicious);
                return m;
            }).collect(Collectors.toList());

        // Summaries
        long failedLogins = allLogs.stream().filter(l -> "LOGIN_FAILED".equalsIgnoreCase(l.getAction()) || ("LOGIN".equalsIgnoreCase(l.getAction()) && "FAILURE".equalsIgnoreCase(l.getStatus()))).count();
        long successfulLogins = allLogs.stream().filter(l -> "LOGIN".equalsIgnoreCase(l.getAction()) && "SUCCESS".equalsIgnoreCase(l.getStatus())).count();
        long otpFailures = allLogs.stream().filter(l -> "OTP_VERIFY_FAILED".equalsIgnoreCase(l.getAction())).count();
        long lockouts = allLogs.stream().filter(l -> "ACCOUNT_LOCKED".equalsIgnoreCase(l.getAction())).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("failedLogins", failedLogins);
        summary.put("successfulLogins", successfulLogins);
        summary.put("otpFailures", otpFailures);
        summary.put("lockouts", lockouts);

        return ResponseEntity.ok(Map.of("success", true, "events", events, "summary", summary));
    }

    // â”€â”€â”€ SUSPICIOUS ACTIVITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/suspicious-activity")
    public ResponseEntity<?> getSuspiciousActivity(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> alerts = new ArrayList<>();

        // 1. Users with failed login attempts
        userRepository.findAll().forEach(u -> {
            if (u.getFailedLoginAttempts() >= 3 || u.isAccountLocked() || !u.isActive()) {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("id", "USER-" + u.getId());
                alert.put("userId", u.getId());
                alert.put("userEmail", u.getEmail());
                alert.put("userName", u.getName());
                alert.put("type", !u.isActive() ? "ACCOUNT_FROZEN" : (u.isAccountLocked() ? "ACCOUNT_LOCKED" : "EXCESSIVE_FAILED_LOGINS"));
                alert.put("severity", !u.isActive() ? "CRITICAL" : (u.isAccountLocked() ? "HIGH" : "MEDIUM"));
                alert.put("description", "User has " + u.getFailedLoginAttempts() + " failed login attempts. Locked: " + u.isAccountLocked() + ", Active: " + u.isActive());
                alert.put("timestamp", u.getLastLoginAt() != null ? u.getLastLoginAt() : u.getCreatedAt());
                alerts.add(alert);
            }
        });

        // 2. Unusually large transactions (> 50,000) or failed transactions
        transactionLogRepository.findAll().forEach(tx -> {
            if (tx.getAmount() != null && tx.getAmount().compareTo(new BigDecimal("50000")) > 0) {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("id", "TX-HIGH-" + tx.getId());
                alert.put("transactionId", tx.getTransactionId());
                alert.put("type", "HIGH_VALUE_TRANSACTION");
                alert.put("severity", "MEDIUM");
                alert.put("description", "High value transfer of â‚¹" + tx.getAmount() + " detected (Ref: " + tx.getReference() + ")");
                alert.put("timestamp", tx.getTransactionDate());
                if (tx.getFromAccount() != null && tx.getFromAccount().getUser() != null) {
                    alert.put("userId", tx.getFromAccount().getUser().getId());
                    alert.put("userEmail", tx.getFromAccount().getUser().getEmail());
                    alert.put("userName", tx.getFromAccount().getUser().getName());
                }
                alerts.add(alert);
            } else if ("FAILED".equalsIgnoreCase(tx.getStatus())) {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("id", "TX-FAIL-" + tx.getId());
                alert.put("transactionId", tx.getTransactionId());
                alert.put("type", "FAILED_TRANSACTION");
                alert.put("severity", "LOW");
                alert.put("description", "Transaction of â‚¹" + tx.getAmount() + " marked as FAILED.");
                alert.put("timestamp", tx.getTransactionDate());
                alerts.add(alert);
            }
        });

        return ResponseEntity.ok(Map.of("success", true, "alerts", alerts, "total", alerts.size()));
    }

    // â”€â”€â”€ BLOCKCHAIN RECORDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/blockchain/records")
    public ResponseEntity<?> getBlockchainRecords(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> records = transactionLogRepository.findAll().stream()
            .filter(tx -> tx.getBlockchainHash() != null && !tx.getBlockchainHash().isEmpty())
            .sorted(Comparator.comparing(TransactionLog::getTransactionDate, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(tx -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", tx.getId());
                m.put("transactionId", tx.getTransactionId());
                m.put("blockchainHash", tx.getBlockchainHash());
                m.put("amount", tx.getAmount());
                m.put("type", tx.getType());
                m.put("status", tx.getStatus());
                m.put("timestamp", tx.getTransactionDate());
                m.put("fromAccountNumber", tx.getFromAccount() != null ? tx.getFromAccount().getAccountNumber() : "External");
                m.put("toAccountNumber", tx.getToAccount() != null ? tx.getToAccount().getAccountNumber() : "External");
                m.put("senderEmail", tx.getFromAccount() != null && tx.getFromAccount().getUser() != null ? tx.getFromAccount().getUser().getEmail() : null);
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "records", records, "total", records.size()));
    }

    // â”€â”€â”€ AUDIT LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> logs = auditLogRepository.findAll().stream()
            .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
            .limit(500)
            .map(log -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", log.getId());
                m.put("userEmail", log.getUser() != null ? log.getUser().getEmail() : "System");
                m.put("userName", log.getUser() != null ? log.getUser().getName() : "System");
                m.put("userId", log.getUser() != null ? log.getUser().getId() : null);
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

    // â”€â”€â”€ ADMIN MANAGEMENT (SUPER_ADMIN ONLY) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @GetMapping("/admins")
    public ResponseEntity<?> getAdminsList(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<Map<String, Object>> admins = userRepository.findAll().stream()
            .filter(u -> "ROLE_ADMIN".equals(u.getRole()) || "ROLE_SUPER_ADMIN".equals(u.getRole()))
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("name", u.getName());
                m.put("email", u.getEmail());
                m.put("phone", u.getPhone());
                m.put("role", u.getRole());
                m.put("isActive", u.isActive());
                m.put("lastLoginAt", u.getLastLoginAt());
                m.put("createdAt", u.getCreatedAt());
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "admins", admins));
    }

    @PostMapping("/admins/update-role")
    public ResponseEntity<?> updateAdminRole(@RequestBody Map<String, String> payload, HttpServletRequest req) {
        if (!isSuperAdmin(req)) {
            // Also allow the initial primary admin for ease of setup
            String adminEmail = getAdminEmail(req);
            if (adminEmail == null || !adminEmail.equalsIgnoreCase("sarod.h.777@gmail.com")) {
                return ResponseEntity.status(403).body(Map.of("message", "Only Super Admins can modify administrator privileges"));
            }
        }

        String targetEmail = payload.getOrDefault("email", "").trim();
        String newRole = payload.getOrDefault("role", "ROLE_ADMIN").toUpperCase();

        if (targetEmail.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));

        return userRepository.findByEmail(targetEmail).map(u -> {
            u.setRole(newRole);
            userRepository.save(u);

            String adminEmail = getAdminEmail(req);
            auditService.logAction(null, "ADMIN_ROLE_CHANGE", "USER", String.valueOf(u.getId()), "SUCCESS",
                "Admin [" + adminEmail + "] changed role of [" + targetEmail + "] to " + newRole, null, getClientIp(req));

            return ResponseEntity.ok(Map.of("success", true, "message", "User role updated to " + newRole));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    // ─── FRAUD DETECTION & SURVEILLANCE ──────────────────────────────────────────
    @GetMapping("/fraud/stats")
    public ResponseEntity<?> getFraudStats(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        long totalAlerts = fraudAlertRepository.count();
        long highRiskCount = fraudAlertRepository.countByRiskLevel("HIGH");
        long mediumRiskCount = fraudAlertRepository.countByRiskLevel("MEDIUM");
        long lowRiskCount = fraudAlertRepository.countByRiskLevel("LOW");
        long pendingReviewCount = fraudAlertRepository.countByStatus("HELD") + fraudAlertRepository.countByStatus("PENDING_REVIEW");
        long approvedCases = fraudAlertRepository.countByStatus("APPROVED");
        long rejectedCases = fraudAlertRepository.countByStatus("REJECTED");
        long reviewedCases = approvedCases + rejectedCases;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAlerts", totalAlerts);
        stats.put("highRisk", highRiskCount);
        stats.put("mediumRisk", mediumRiskCount);
        stats.put("lowRisk", lowRiskCount);
        stats.put("pendingReview", pendingReviewCount);
        stats.put("approvedCases", approvedCases);
        stats.put("rejectedCases", rejectedCases);
        stats.put("reviewedCases", reviewedCases);

        return ResponseEntity.ok(Map.of("success", true, "stats", stats));
    }

    @GetMapping("/fraud/alerts")
    public ResponseEntity<?> getFraudAlerts(
        @RequestParam(required = false) String riskLevel,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate,
        @RequestParam(required = false) String search,
        HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<FraudAlert> alerts = fraudAlertRepository.findAllByOrderByCreatedAtDesc();

        LocalDateTime startDt = null;
        LocalDateTime endDt = null;
        try {
            if (startDate != null && !startDate.trim().isEmpty()) {
                startDt = java.time.LocalDate.parse(startDate.trim()).atStartOfDay();
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                endDt = java.time.LocalDate.parse(endDate.trim()).atTime(23, 59, 59);
            }
        } catch (Exception ignored) {}

        final LocalDateTime finalStart = startDt;
        final LocalDateTime finalEnd = endDt;

        List<Map<String, Object>> list = alerts.stream()
            .filter(a -> riskLevel == null || riskLevel.isEmpty() || "ALL".equalsIgnoreCase(riskLevel) || a.getRiskLevel().equalsIgnoreCase(riskLevel))
            .filter(a -> status == null || status.isEmpty() || "ALL".equalsIgnoreCase(status) || a.getStatus().equalsIgnoreCase(status))
            .filter(a -> {
                if (finalStart != null && a.getCreatedAt() != null && a.getCreatedAt().isBefore(finalStart)) return false;
                if (finalEnd != null && a.getCreatedAt() != null && a.getCreatedAt().isAfter(finalEnd)) return false;
                return true;
            })
            .filter(a -> {
                if (search == null || search.trim().isEmpty()) return true;
                String q = search.trim().toLowerCase();
                return (a.getTransactionId() != null && a.getTransactionId().toLowerCase().contains(q)) ||
                       (a.getUser() != null && a.getUser().getEmail().toLowerCase().contains(q)) ||
                       (a.getUser() != null && a.getUser().getName().toLowerCase().contains(q)) ||
                       (a.getReasons() != null && a.getReasons().toLowerCase().contains(q));
            })
            .map(a -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", a.getId());
                m.put("transactionId", a.getTransactionId());
                m.put("userId", a.getUser() != null ? a.getUser().getId() : null);
                m.put("userName", a.getUser() != null ? a.getUser().getName() : "Unknown");
                m.put("userEmail", a.getUser() != null ? a.getUser().getEmail() : "Unknown");
                m.put("senderAccount", a.getFromAccount() != null ? a.getFromAccount().getAccountNumber() : "N/A");
                m.put("receiverAccount", a.getToAccount() != null ? a.getToAccount().getAccountNumber() : "N/A");
                m.put("receiverName", a.getToAccount() != null && a.getToAccount().getUser() != null ? a.getToAccount().getUser().getName() : "N/A");
                m.put("amount", a.getAmount());
                m.put("transactionType", a.getTransactionType());
                m.put("riskScore", a.getRiskScore());
                m.put("riskLevel", a.getRiskLevel());
                m.put("reasons", a.getReasons());
                m.put("rulesTriggered", a.getRulesTriggered());
                m.put("status", a.getStatus());
                m.put("actionTaken", a.getActionTaken());
                m.put("adminDecision", a.getAdminDecision());
                m.put("adminNotes", a.getAdminNotes());
                m.put("reviewedBy", a.getReviewedBy());
                m.put("reviewedAt", a.getReviewedAt());
                m.put("blockchainHash", a.getBlockchainHash());
                m.put("reference", a.getReference());
                m.put("createdAt", a.getCreatedAt());
                return m;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "alerts", list, "total", list.size()));
    }

    @PostMapping("/fraud/review/{id}")
    public ResponseEntity<?> reviewFraudAlert(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload,
        HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        String decision = payload.get("decision"); // LEGITIMATE or CONFIRMED_FRAUD
        String notes = payload.get("notes");
        String adminEmail = getAdminEmail(req);

        if ("LEGITIMATE".equalsIgnoreCase(decision)) {
            Map<String, Object> res = fraudDetectionService.approveHeldAlert(id, adminEmail, notes);
            return ResponseEntity.ok(res);
        } else if ("CONFIRMED_FRAUD".equalsIgnoreCase(decision)) {
            Map<String, Object> res = fraudDetectionService.rejectHeldAlert(id, adminEmail, notes);
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid decision. Must be LEGITIMATE or CONFIRMED_FRAUD"));
        }
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

        Long resolvedUserId = null;
        if (tx.getFromAccount() != null) {
            m.put("fromAccountId", tx.getFromAccount().getId());
            m.put("fromAccountNumber", tx.getFromAccount().getAccountNumber());
            if (tx.getFromAccount().getUser() != null) {
                m.put("fromUserEmail", tx.getFromAccount().getUser().getEmail());
                m.put("fromUserName", tx.getFromAccount().getUser().getName());
                m.put("fromUserId", tx.getFromAccount().getUser().getId());
                resolvedUserId = tx.getFromAccount().getUser().getId();
                m.put("sender", tx.getFromAccount().getUser().getName() + " (" + tx.getFromAccount().getAccountNumber() + ")");
            } else {
                m.put("sender", tx.getFromAccount().getAccountNumber());
            }
        } else {
            m.put("sender", "System / External");
        }

        if (tx.getToAccount() != null) {
            m.put("toAccountId", tx.getToAccount().getId());
            m.put("toAccountNumber", tx.getToAccount().getAccountNumber());
            if (tx.getToAccount().getUser() != null) {
                m.put("toUserEmail", tx.getToAccount().getUser().getEmail());
                m.put("toUserName", tx.getToAccount().getUser().getName());
                m.put("toUserId", tx.getToAccount().getUser().getId());
                if (resolvedUserId == null) {
                    resolvedUserId = tx.getToAccount().getUser().getId();
                }
                m.put("receiver", tx.getToAccount().getUser().getName() + " (" + tx.getToAccount().getAccountNumber() + ")");
            } else {
                m.put("receiver", tx.getToAccount().getAccountNumber());
            }
        } else {
            m.put("receiver", "System / External");
        }

        m.put("userId", resolvedUserId != null ? String.valueOf(resolvedUserId) : "N/A");

        if (viewingAccount != null) {
            boolean isCredit = tx.getToAccount() != null && tx.getToAccount().getId().equals(viewingAccount.getId());
            m.put("direction", isCredit ? "IN" : "OUT");
        }

        return m;
    }

    // ─── DIGITAL SIGNATURE VERIFICATIONS AUDIT ─────────────────────────────────
    @GetMapping("/signature-verifications")
    public ResponseEntity<?> getSignatureVerifications(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        List<com.sovereign.ledger.model.TransactionSignatureAudit> audits =
            transactionSignatureAuditRepository.findAllByOrderByCreatedAtDesc();

        long totalAudits = audits.size();
        long totalVerified = audits.stream().filter(a -> "VERIFIED".equalsIgnoreCase(a.getVerificationStatus())).count();
        long totalTampered = audits.stream().filter(a -> "TAMPERED".equalsIgnoreCase(a.getVerificationStatus())).count();
        long totalInvalidSig = audits.stream().filter(a -> "INVALID_SIGNATURE".equalsIgnoreCase(a.getVerificationStatus())).count();
        long totalFailed = totalTampered + totalInvalidSig +
            audits.stream().filter(a -> "FAILED".equalsIgnoreCase(a.getVerificationStatus()) || "REPLAY_ATTACK".equalsIgnoreCase(a.getVerificationStatus())).count();

        double successRate = totalAudits > 0 ? (double) totalVerified / totalAudits * 100.0 : 100.0;

        // Also query transactions that have digital signatures
        List<TransactionLog> signedTxs = transactionLogRepository.findAll().stream()
            .filter(t -> t.getDigitalSignature() != null || t.getTransactionHash() != null)
            .collect(Collectors.toList());

        Map<String, Object> telemetry = new LinkedHashMap<>();
        telemetry.put("totalSignedTransactions", signedTxs.size());
        telemetry.put("totalVerificationAttempts", totalAudits);
        telemetry.put("totalVerified", totalVerified);
        telemetry.put("totalTampered", totalTampered);
        telemetry.put("totalInvalidSignatures", totalInvalidSig);
        telemetry.put("totalFailed", totalFailed);
        telemetry.put("successRate", Math.round(successRate * 10.0) / 10.0);

        List<Map<String, Object>> auditList = audits.stream().limit(100).map(a -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", a.getId());
            item.put("transactionId", a.getTransactionId());
            item.put("senderEmail", a.getSenderEmail());
            item.put("senderAccount", a.getSenderAccount());
            item.put("recipientAccount", a.getRecipientAccount());
            item.put("amount", a.getAmount());
            item.put("transactionHash", a.getTransactionHash());
            item.put("publicKey", a.getPublicKey());
            item.put("verificationStatus", a.getVerificationStatus());
            item.put("verificationDetails", a.getVerificationDetails());
            item.put("verifiedBy", a.getVerifiedBy());
            item.put("createdAt", a.getCreatedAt());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "success", true,
            "telemetry", telemetry,
            "audits", auditList
        ));
    }

    @PostMapping("/signature-verifications/re-verify/{transactionId}")
    public ResponseEntity<?> adminReVerifyTransaction(@PathVariable String transactionId, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));

        TransactionLog tx = transactionLogRepository.findByTransactionId(transactionId).orElse(null);
        if (tx == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Transaction not found"));
        }

        if (tx.getDigitalSignature() == null || tx.getPublicKey() == null) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", false,
                "status", "NOT_SIGNED",
                "message", "Transaction was executed without a digital signature."
            ));
        }

        String fromAccountNum = tx.getFromAccount() != null ? tx.getFromAccount().getAccountNumber() : "SYSTEM";
        String toAccountNum = tx.getToAccount() != null ? tx.getToAccount().getAccountNumber() : "SYSTEM";
        long timestamp = tx.getTransactionDate() != null
            ? tx.getTransactionDate().atZone(java.time.ZoneId.systemDefault()).toInstant().getEpochSecond()
            : 0L;

        DigitalSignatureService.VerificationResult result = digitalSignatureService.verifyTransaction(
            tx.getTransactionId(),
            fromAccountNum,
            toAccountNum,
            tx.getAmount(),
            timestamp,
            tx.getNonce() != null ? tx.getNonce() : "",
            tx.getTransactionHash(),
            tx.getDigitalSignature(),
            tx.getPublicKey()
        );

        String adminEmail = getAdminEmail(req);
        digitalSignatureService.recordAudit(
            tx.getTransactionId(),
            adminEmail != null ? adminEmail : "admin@vaultchain.bank",
            fromAccountNum,
            toAccountNum,
            tx.getAmount(),
            tx.getNonce(),
            timestamp,
            result.getCanonicalPayload(),
            tx.getTransactionHash(),
            tx.getDigitalSignature(),
            tx.getPublicKey(),
            result.getStatus(),
            "Admin Manual Verification: " + result.getMessage(),
            "ADMIN_VERIFICATION"
        );

        return ResponseEntity.ok(Map.of(
            "success", true,
            "verified", result.isValid(),
            "status", result.getStatus(),
            "message", result.getMessage(),
            "computedHash", result.getComputedHash(),
            "storedHash", tx.getTransactionHash(),
            "canonicalPayload", result.getCanonicalPayload(),
            "algorithm", tx.getSignatureAlgorithm() != null ? tx.getSignatureAlgorithm() : "ECDSA-P256-SHA256"
        ));
    }
}
