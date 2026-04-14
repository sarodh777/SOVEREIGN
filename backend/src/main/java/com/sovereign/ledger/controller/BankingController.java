package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.BankAccount;
import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.BankAccountRepository;
import com.sovereign.ledger.repository.UserRepository;
import com.sovereign.ledger.service.BankingService;
import com.sovereign.ledger.service.KYCService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/banking")
@CrossOrigin(origins = "http://localhost:5173")
public class BankingController {

    @Autowired
    private BankingService bankingService;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KYCService kycService;

    /**
     * Create a new bank account
     */
    @PostMapping("/account/create")
    public ResponseEntity<?> createBankAccount(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String accountType = payload.get("accountType"); // CHECKING, SAVINGS, BUSINESS

            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            BankAccount account = bankingService.createBankAccount(user, accountType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bank account created successfully");
            response.put("accountId", account.getId());
            response.put("accountNumber", account.getAccountNumber());
            response.put("accountType", account.getAccountType());
            response.put("iban", account.getIban());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Get all accounts for a user
     */
    @GetMapping("/accounts/{email}")
    public ResponseEntity<?> getUserAccounts(@PathVariable String email) {
        try {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            List<BankAccount> accounts = bankAccountRepository.findByUser(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("accounts", accounts);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Get account balance
     */
    @GetMapping("/balance/{accountId}")
    public ResponseEntity<?> getBalance(@PathVariable Long accountId) {
        Map<String, Object> response = bankingService.getBalance(accountId);
        return ResponseEntity.ok(response);
    }

    /**
     * Transfer money between accounts
     */
    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, String> payload) {
        try {
            Long fromAccountId = Long.parseLong(payload.get("fromAccountId"));
            Long toAccountId = Long.parseLong(payload.get("toAccountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference = payload.get("reference");

            Map<String, Object> response = bankingService.transferMoney(fromAccountId, toAccountId, amount, reference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Deposit money
     */
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, String> payload) {
        try {
            Long accountId = Long.parseLong(payload.get("accountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference = payload.getOrDefault("reference", "Deposit");

            Map<String, Object> response = bankingService.deposit(accountId, amount, reference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Withdraw money
     */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody Map<String, String> payload) {
        try {
            Long accountId = Long.parseLong(payload.get("accountId"));
            BigDecimal amount = new BigDecimal(payload.get("amount"));
            String reference = payload.getOrDefault("reference", "Withdrawal");

            Map<String, Object> response = bankingService.withdraw(accountId, amount, reference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Get transaction history
     */
    @GetMapping("/transactions/{accountId}")
    public ResponseEntity<?> getTransactionHistory(@PathVariable Long accountId) {
        try {
            List<Map<String, Object>> transactions = bankingService.getTransactionHistory(accountId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactions", transactions);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Verify KYC
     */
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

    /**
     * Check AML compliance
     */
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
