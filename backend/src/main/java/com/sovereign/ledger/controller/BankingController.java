package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import com.sovereign.ledger.service.BankingService;
import com.sovereign.ledger.service.JwtUtil;
import com.sovereign.ledger.service.KYCService;
import com.sovereign.ledger.service.EmailService;
import com.sovereign.ledger.service.FinancialScoreService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/banking")
@CrossOrigin(origins = "*")
public class BankingController {

    @Autowired private BankingService bankingService;
    @Autowired private BankAccountRepository bankAccountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private KYCService kycService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private BlockRepository blockRepository;
    @Autowired private TransactionLogRepository transactionLogRepository;
    @Autowired private EmailService emailService;
    @Autowired private FinancialScoreService financialScoreService;

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    private User getUserFromRequest(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        if (!jwtUtil.validateToken(token)) return null;
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    // ─── CREATE BANK ACCOUNT ─────────────────────────────────────────────────────
    @PostMapping("/account/create")
    public ResponseEntity<?> createBankAccount(@RequestBody Map<String, String> payload,
                                                HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            String accountType = payload.getOrDefault("accountType", "SAVINGS");
            BankAccount account = bankingService.createBankAccount(user, accountType);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Bank account created successfully",
                "accountId", account.getId(),
                "accountNumber", account.getAccountNumber(),
                "accountType", account.getAccountType(),
                "iban", account.getIban()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── GET USER ACCOUNTS ───────────────────────────────────────────────────────
    @GetMapping("/accounts")
    public ResponseEntity<?> getMyAccounts(HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            List<BankAccount> accounts = bankAccountRepository.findByUser(user);

            List<Map<String, Object>> result = accounts.stream().map(acc -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", acc.getId());
                m.put("accountNumber", acc.getAccountNumber());
                m.put("accountType", acc.getAccountType());
                m.put("balance", acc.getBalance());
                m.put("currency", acc.getCurrency());
                m.put("status", acc.getStatus());
                m.put("iban", acc.getIban());
                m.put("overdraftLimit", acc.getOverdraftLimit());
                m.put("createdAt", acc.getCreatedAt());
                m.put("lastTransactionAt", acc.getLastTransactionAt());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("success", true, "accounts", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── GET ACCOUNTS BY EMAIL (legacy support) ─────────────────────────────────
    @GetMapping("/accounts/{email}")
    public ResponseEntity<?> getUserAccounts(@PathVariable String email) {
        try {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            List<BankAccount> accounts = bankAccountRepository.findByUser(user);
            return ResponseEntity.ok(Map.of("success", true, "accounts", accounts));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── RECIPIENT LOOKUP BY EMAIL ────────────────────────────────────────────────
    @GetMapping("/lookup/recipient")
    public ResponseEntity<?> lookupRecipient(@RequestParam String email,
                                              HttpServletRequest req) {
        try {
            User caller = getUserFromRequest(req);
            if (caller == null)
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

            User recipient = userRepository.findByEmail(email.trim()).orElse(null);
            if (recipient == null)
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "No account found with that email"));

            if (recipient.getId().equals(caller.getId()))
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "You cannot transfer to yourself"));

            List<BankAccount> accounts = bankAccountRepository.findByUser(recipient);
            if (accounts.isEmpty())
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Recipient has no bank account"));

            BankAccount acc = accounts.get(0);
            if (!"ACTIVE".equals(acc.getStatus()))
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient account is not active"));

            String raw = acc.getAccountNumber();
            String masked = raw.length() > 7
                ? raw.substring(0, 4) + "-****-" + raw.substring(raw.length() - 3)
                : raw;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("recipientName", recipient.getName());
            result.put("accountId", acc.getId());
            result.put("accountNumberMasked", masked);
            result.put("accountType", acc.getAccountType());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }


    @GetMapping("/balance/{accountId}")
    public ResponseEntity<?> getBalance(@PathVariable Long accountId) {
        return ResponseEntity.ok(bankingService.getBalance(accountId));
    }

    // ─── TRANSFER ────────────────────────────────────────────────────────────────
    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, String> payload,
                                       HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long fromAccountId = Long.parseLong(payload.get("fromAccountId"));
            Long toAccountId   = Long.parseLong(payload.get("toAccountId"));
            BigDecimal amount  = new BigDecimal(payload.get("amount"));
            String reference   = payload.getOrDefault("reference", "Transfer");

            BankAccount fromAccount = bankAccountRepository.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!fromAccount.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            Map<String, Object> response = bankingService.transferMoney(fromAccountId, toAccountId, amount, reference);

            // ── Post-transfer: emails + score ────────────────────────────────
            if (Boolean.TRUE.equals(response.get("success"))) {
                String txId  = String.valueOf(response.get("transactionId"));
                String date  = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

                // Look up to-account for receiver info
                BankAccount toAccount = bankAccountRepository.findById(toAccountId).orElse(null);
                String receiverName  = toAccount != null && toAccount.getUser() != null ? toAccount.getUser().getName() : "Unknown";
                String receiverEmail = toAccount != null && toAccount.getUser() != null ? toAccount.getUser().getEmail() : null;

                BigDecimal remainingBalance = fromAccount.getBalance();
                try { remainingBalance = bankAccountRepository.findById(fromAccountId).map(BankAccount::getBalance).orElse(amount); } catch (Exception ignored){}

                // Get blockchain hash from last saved tx
                String blockHash = null;
                try {
                    var optTx = transactionLogRepository.findByTransactionId(txId);
                    if (optTx.isPresent()) blockHash = optTx.get().getBlockchainHash();
                } catch (Exception ignored){}

                // Sender email
                try {
                    emailService.sendTransactionConfirmationSender(
                        user.getEmail(), user.getName(), receiverName,
                        amount, txId, date, remainingBalance, blockHash
                    );
                } catch (Exception ignored) {}

                // Receiver email
                if (receiverEmail != null) {
                    try {
                        emailService.sendTransactionConfirmationReceiver(
                            receiverEmail, receiverName, user.getName(),
                            amount, txId, date, blockHash
                        );
                    } catch (Exception ignored) {}
                }

                // Update financial score
                try {
                    financialScoreService.recordEvent(
                        user,
                        FinancialScoreService.DELTA_TRANSFER_SUCCESS,
                        "Successful transfer: " + reference,
                        "TRANSFER_SUCCESS"
                    );
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── DEPOSIT ─────────────────────────────────────────────────────────────────
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, String> payload,
                                      HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long accountId    = Long.parseLong(payload.get("accountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference  = payload.getOrDefault("reference", "Deposit");

            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!account.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            return ResponseEntity.ok(bankingService.deposit(accountId, amount, reference));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── WITHDRAW ────────────────────────────────────────────────────────────────
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody Map<String, String> payload,
                                       HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            Long accountId    = Long.parseLong(payload.get("accountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference  = payload.getOrDefault("reference", "Withdrawal");

            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!account.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            return ResponseEntity.ok(bankingService.withdraw(accountId, amount, reference));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── TRANSACTIONS ────────────────────────────────────────────────────────────
    @GetMapping("/transactions/{accountId}")
    public ResponseEntity<?> getTransactionHistory(@PathVariable Long accountId,
                                                    HttpServletRequest req) {
        try {
            User user = getUserFromRequest(req);
            if (user == null)
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));

            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            if (!account.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied"));

            List<Map<String, Object>> transactions = bankingService.getTransactionHistory(accountId);
            return ResponseEntity.ok(Map.of("success", true, "transactions", transactions));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── BLOCKCHAIN EXPLORER ─────────────────────────────────────────────────────
    @GetMapping("/blockchain/blocks")
    public ResponseEntity<?> getBlocks(HttpServletRequest req) {
        try {
            List<Map<String, Object>> blocks = blockRepository.findAll().stream().map(block -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", block.getId());
                m.put("hash", block.getHash());
                m.put("previousHash", block.getPreviousHash());
                m.put("timestamp", block.getTimestamp());
                m.put("transactionCount", block.getTransactions().size());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("success", true, "blocks", blocks, "chainLength", blocks.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ─── KYC ─────────────────────────────────────────────────────────────────────
    @PostMapping("/kyc/verify")
    public ResponseEntity<?> verifyKYC(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String fullName = payload.get("fullName");
            String documentId = payload.get("documentId");
            Map<String, Object> response = kycService.verifyKYC(email, fullName, documentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/aml/check")
    public ResponseEntity<?> checkAML(@RequestBody Map<String, String> payload) {
        try {
            String amount = payload.get("amount");
            String destinationCountry = payload.get("destinationCountry");
            Map<String, Object> response = kycService.checkAML(amount, destinationCountry);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
