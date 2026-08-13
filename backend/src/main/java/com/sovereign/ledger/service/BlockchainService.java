package com.sovereign.ledger.service;

import com.sovereign.ledger.model.TransactionLog;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneId;

@Service
public class BlockchainService {

    @Value("${blockchain.rpc-url:${BLOCKCHAIN_RPC_URL:http://127.0.0.1:8545}}")
    private String rpcUrl;

    @Value("${blockchain.contract-address:${BLOCKCHAIN_CONTRACT_ADDRESS:0x5FbDB2315678afecb367f032d93F642f64180aa3}}")
    private String contractAddress;

    @Value("${blockchain.private-key:${BLOCKCHAIN_PRIVATE_KEY:}}")
    private String privateKey;

    public String recordTransaction(TransactionLog transaction) throws IOException, InterruptedException {
        String fromAccount = transaction.getFromAccount() != null ? transaction.getFromAccount().getAccountNumber() : "SYSTEM";
        String toAccount = transaction.getToAccount() != null ? transaction.getToAccount().getAccountNumber() : "SYSTEM";
        String amountMinor = transaction.getAmount().movePointRight(2).setScale(0).toPlainString();
        long timestamp = transaction.getCompletedDate() != null
            ? transaction.getCompletedDate().atZone(ZoneId.systemDefault()).toInstant().getEpochSecond()
            : Instant.now().getEpochSecond();

        Path blockchainDir = resolveBlockchainDirectory();
        ProcessBuilder processBuilder = new ProcessBuilder(
            "node",
            "scripts/recordTransaction.js",
            "--rpcUrl", rpcUrl,
            "--contractAddress", contractAddress,
            "--privateKey", privateKey,
            "--transactionId", transaction.getTransactionId(),
            "--fromAccount", fromAccount,
            "--toAccount", toAccount,
            "--amount", amountMinor,
            "--transactionType", transaction.getType(),
            "--timestamp", String.valueOf(timestamp)
        );
        processBuilder.directory(blockchainDir.toFile());
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("Blockchain recording failed: " + output);
        }

        String response = output.toString().trim();
        if (response.startsWith("{")) {
            int hashStart = response.indexOf("\"hash\":\"");
            if (hashStart >= 0) {
                int valueStart = hashStart + 8;
                int valueEnd = response.indexOf('"', valueStart);
                if (valueEnd > valueStart) {
                    return response.substring(valueStart, valueEnd);
                }
            }
        }
        return response;
    }

    private Path resolveBlockchainDirectory() {
        Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path direct = cwd.resolve("blockchain");
        if (Files.exists(direct)) {
            return direct;
        }
        return cwd.resolve("../blockchain").normalize();
    }
}
