package com.sovereign.ledger.scheduler;

import com.sovereign.ledger.service.SmartTransferService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SmartTransferScheduler {

    private static final Logger log = LoggerFactory.getLogger(SmartTransferScheduler.class);

    @Autowired private SmartTransferService smartTransferService;

    /**
     * Runs every minute to execute eligible smart transfer rules.
     * fixedDelay prevents overlapping executions.
     */
    @Scheduled(fixedDelay = 60_000)
    public void executeSmartTransfers() {
        try {
            log.debug("SmartTransferScheduler: checking eligible rules...");
            smartTransferService.executeEligibleRules();
        } catch (Exception e) {
            log.error("SmartTransferScheduler error: {}", e.getMessage());
        }
    }
}
