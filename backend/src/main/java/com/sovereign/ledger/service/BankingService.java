package com.sovereign.ledger.service;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BankingService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private TransactionLogRepository transactionLogRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private BlockRepository blockRepository;

    public synchronized void recordBlockForTransaction(String hash, LocalDateTime txTime) {
        if (hash == null || hash.isEmpty()) return;
        try {
            if (blockRepository.count() == 0) {
                Block genesis = new Block("0x0000000000000000000000000000000000000000000000000000000000000000",
                                          "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
                genesis.setTimestamp(txTime != null ? txTime.minusMinutes(1) : LocalDateTime.now().minusMinutes(1));
                blockRepository.save(genesis);
            }

            List<Block> allBlocks = blockRepository.findAll();
            Block previousBlock = allBlocks.get(allBlocks.size() - 1);

            Block newBlock = new Block(previousBlock.getHash(), hash);
            newBlock.setTimestamp(txTime != null ? txTime : LocalDateTime.now());
            blockRepository.save(newBlock);
        } catch (Exception ignored) {}
    }

    /**
     * Transfer money between accounts
     */
    @Transactional
    public Map<String, Object> transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount, String reference) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate accounts
            BankAccount fromAccount = bankAccountRepository.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("From account not found"));
            BankAccount toAccount = bankAccountRepository.findById(toAccountId)
                .orElseThrow(() -> new RuntimeException("To account not found"));

            // Validate amount
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                response.put("success", false);
                response.put("message", "Amount must be greater than zero");
                return response;
            }

            // Check balance with overdraft
            BigDecimal availableBalance = fromAccount.getBalance().add(fromAccount.getOverdraftLimit());
            if (availableBalance.compareTo(amount) < 0) {
                response.put("success", false);
                response.put("message", "Insufficient funds");
                return response;
            }

            // Check account status and user status
            if (!fromAccount.getStatus().equals("ACTIVE") || !toAccount.getStatus().equals("ACTIVE")) {
                response.put("success", false);
                response.put("message", "One or both accounts are not active or frozen");
                return response;
            }
            if ((fromAccount.getUser() != null && !fromAccount.getUser().isActive()) ||
                (toAccount.getUser() != null && !toAccount.getUser().isActive())) {
                response.put("success", false);
                response.put("message", "Account holder is blocked or suspended by administrator");
                return response;
            }

            // Create transaction log
            TransactionLog transaction = new TransactionLog(fromAccount, toAccount, amount, "TRANSFER");
            transaction.setTransactionId("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            transaction.setReference(reference);
            transaction.setStatus("COMPLETED");
            transaction.setCompletedDate(LocalDateTime.now());

            // Calculate fee (0.5% for transfers)
            BigDecimal fee = amount.multiply(new BigDecimal("0.005"));
            transaction.setFee(fee);

            // Update balances
            fromAccount.setBalance(fromAccount.getBalance().subtract(amount).subtract(fee));
            toAccount.setBalance(toAccount.getBalance().add(amount));

            // Update last transaction time
            fromAccount.setLastTransactionAt(LocalDateTime.now());
            toAccount.setLastTransactionAt(LocalDateTime.now());

            // Save all
            transactionLogRepository.save(transaction);
            bankAccountRepository.save(fromAccount);
            bankAccountRepository.save(toAccount);

            try {
                String blockchainPayload = blockchainService.recordTransaction(transaction);
                // Truncate hash to 128 chars max
                String hash = blockchainPayload != null && blockchainPayload.length() > 128
                        ? blockchainPayload.substring(0, 128) : blockchainPayload;
                transaction.setBlockchainHash(hash);
                transactionLogRepository.save(transaction);
                recordBlockForTransaction(hash, transaction.getCompletedDate());
            } catch (Exception blockchainException) {
                String errMsg = blockchainException.getMessage() != null ? blockchainException.getMessage() : "Unknown error";
                transaction.setDescription("Blockchain sync failed: " + errMsg.substring(0, Math.min(errMsg.length(), 400)));
                transactionLogRepository.save(transaction);
            }

            // Log audit
            auditService.logAction(fromAccount.getUser(), "TRANSFER", "TRANSACTION", transaction.getId().toString(), "SUCCESS");

            response.put("success", true);
            response.put("message", "Transfer completed successfully");
            response.put("transactionId", transaction.getTransactionId());
            response.put("fromBalance", fromAccount.getBalance());
            response.put("toBalance", toAccount.getBalance());
            response.put("fee", fee);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Transfer failed: " + e.getMessage());
        }

        return response;
    }

    /**
     * Deposit money into account
     */
    @Transactional
    public Map<String, Object> deposit(Long accountId, BigDecimal amount, String reference) {
        Map<String, Object> response = new HashMap<>();

        try {
            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                response.put("success", false);
                response.put("message", "Amount must be greater than zero");
                return response;
            }

            if (!account.getStatus().equals("ACTIVE") || (account.getUser() != null && !account.getUser().isActive())) {
                response.put("success", false);
                response.put("message", "Account is not active or user is blocked by administrator");
                return response;
            }

            // Create transaction
            TransactionLog transaction = new TransactionLog();
            transaction.setToAccount(account);
            transaction.setAmount(amount);
            transaction.setType("DEPOSIT");
            transaction.setStatus("COMPLETED");
            transaction.setTransactionId("DEP-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            transaction.setReference(reference);
            transaction.setCompletedDate(LocalDateTime.now());

            // Update balance
            account.setBalance(account.getBalance().add(amount));
            account.setLastTransactionAt(LocalDateTime.now());

            // Save
            transactionLogRepository.save(transaction);
            bankAccountRepository.save(account);

            try {
                String blockchainPayload = blockchainService.recordTransaction(transaction);
                String hash = blockchainPayload != null && blockchainPayload.length() > 128
                        ? blockchainPayload.substring(0, 128) : blockchainPayload;
                transaction.setBlockchainHash(hash);
                transactionLogRepository.save(transaction);
                recordBlockForTransaction(hash, transaction.getCompletedDate());
            } catch (Exception blockchainException) {
                String errMsg = blockchainException.getMessage() != null ? blockchainException.getMessage() : "Unknown error";
                transaction.setDescription("Blockchain sync failed: " + errMsg.substring(0, Math.min(errMsg.length(), 400)));
                transactionLogRepository.save(transaction);
            }

            // Audit
            auditService.logAction(account.getUser(), "DEPOSIT", "TRANSACTION", transaction.getId().toString(), "SUCCESS");

            response.put("success", true);
            response.put("message", "Deposit completed");
            response.put("transactionId", transaction.getTransactionId());
            response.put("newBalance", account.getBalance());

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Deposit failed: " + e.getMessage());
        }

        return response;
    }

    /**
     * Get account balance
     */
    public Map<String, Object> getBalance(Long accountId) {
        Map<String, Object> response = new HashMap<>();

        try {
            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            response.put("success", true);
            response.put("accountNumber", account.getAccountNumber());
            response.put("balance", account.getBalance());
            response.put("currency", account.getCurrency());
            response.put("accountType", account.getAccountType());
            response.put("status", account.getStatus());
            response.put("overdraftLimit", account.getOverdraftLimit());

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    /**
     * Get transaction history for account
     */
    public List<Map<String, Object>> getTransactionHistory(Long accountId) {
        List<Map<String, Object>> transactions = new ArrayList<>();

        try {
            BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

            List<TransactionLog> logs = transactionLogRepository
                .findByFromAccountOrToAccountOrderByTransactionDateDesc(account, account);

            for (TransactionLog log : logs) {
                Map<String, Object> tx = new HashMap<>();
                tx.put("id", log.getId());
                tx.put("transactionId", log.getTransactionId());
                tx.put("type", log.getType());
                tx.put("amount", log.getAmount());
                tx.put("fee", log.getFee());
                tx.put("status", log.getStatus());
                tx.put("date", log.getTransactionDate());
                tx.put("reference", log.getReference());
                tx.put("description", log.getDescription());
                tx.put("blockchainHash", log.getBlockchainHash());
                tx.put("digitalSignature", log.getDigitalSignature());
                tx.put("publicKey", log.getPublicKey());
                tx.put("transactionHash", log.getTransactionHash());
                tx.put("signatureVerified", log.getSignatureVerified());
                tx.put("signatureAlgorithm", log.getSignatureAlgorithm());

                String senderStr = log.getFromAccount() != null
                    ? (log.getFromAccount().getUser() != null ? log.getFromAccount().getUser().getName() : log.getFromAccount().getAccountNumber())
                    : "Deposit / External";
                String receiverStr = log.getToAccount() != null
                    ? (log.getToAccount().getUser() != null ? log.getToAccount().getUser().getName() : log.getToAccount().getAccountNumber())
                    : "Withdrawal / External";

                tx.put("sender", senderStr);
                tx.put("receiver", receiverStr);
                tx.put("fromAccountNumber", log.getFromAccount() != null ? log.getFromAccount().getAccountNumber() : "N/A");
                tx.put("toAccountNumber", log.getToAccount() != null ? log.getToAccount().getAccountNumber() : "N/A");

                if (log.getFromAccount() != null && log.getFromAccount().getId().equals(accountId)) {
                    tx.put("direction", "OUT");
                    tx.put("counterparty", log.getToAccount() != null ? log.getToAccount().getAccountNumber() : "Unknown");
                } else {
                    tx.put("direction", "IN");
                    tx.put("counterparty", log.getFromAccount() != null ? log.getFromAccount().getAccountNumber() : "Unknown");
                }

                transactions.add(tx);
            }

        } catch (Exception e) {
            // Return empty list on error
        }

        return transactions;
    }

    /**
     * Create new bank account
     */
    @Transactional
    public BankAccount createBankAccount(User user, String accountType) {
        String accountNumber = generateAccountNumber();
        BankAccount account = new BankAccount(user, accountNumber, accountType);
        account.setIban(generateIBAN(accountNumber));
        return bankAccountRepository.save(account);
    }

    private String generateAccountNumber() {
        return "ACC-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String generateIBAN(String accountNumber) {
        return "US" + System.nanoTime() % 100000000 + accountNumber.substring(4);
    }
}
