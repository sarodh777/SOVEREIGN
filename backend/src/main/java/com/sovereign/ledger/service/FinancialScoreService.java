package com.sovereign.ledger.service;

import com.sovereign.ledger.model.*;
import com.sovereign.ledger.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialScoreService {

    @Autowired private FinancialScoreRepository scoreRepository;
    @Autowired private FinancialScoreHistoryRepository historyRepository;

    // ── Score deltas ──────────────────────────────────────────────────────────
    public static final int DELTA_TRANSFER_SUCCESS   = +5;
    public static final int DELTA_TRANSFER_FAILED    = -15;
    public static final int DELTA_SMART_SUCCESS      = +10;
    public static final int DELTA_SMART_FAILED       = -20;
    public static final int DELTA_DEPOSIT            = +3;
    public static final int DELTA_WITHDRAWAL         = +2;
    public static final int DELTA_KYC_VERIFIED       = +30;

    /** Get or initialise a score record for a user */
    @Transactional
    public FinancialScore getOrCreate(User user) {
        return scoreRepository.findByUser(user).orElseGet(() -> {
            FinancialScore fs = new FinancialScore(user);
            return scoreRepository.save(fs);
        });
    }

    /** Applies a delta and logs the reason */
    @Transactional
    public void recordEvent(User user, int delta, String reason, String eventType) {
        FinancialScore fs = getOrCreate(user);

        int before = fs.getScore();
        fs.adjustScore(delta);

        // Update counters
        switch (eventType) {
            case "TRANSFER_SUCCESS"   -> fs.setSuccessfulTransactions(fs.getSuccessfulTransactions() + 1);
            case "TRANSFER_FAILED"    -> fs.setFailedTransactions(fs.getFailedTransactions() + 1);
            case "SMART_SUCCESS"      -> fs.setSmartTransferSuccesses(fs.getSmartTransferSuccesses() + 1);
            case "SMART_FAILED"       -> fs.setSmartTransferFailures(fs.getSmartTransferFailures() + 1);
            case "DEPOSIT"            -> fs.setDepositCount(fs.getDepositCount() + 1);
        }

        scoreRepository.save(fs);

        // History entry
        FinancialScoreHistory h = new FinancialScoreHistory(user, before, delta, reason, eventType);
        historyRepository.save(h);
    }
}
