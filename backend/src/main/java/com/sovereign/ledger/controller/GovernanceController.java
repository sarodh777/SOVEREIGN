package com.sovereign.ledger.controller;

import com.sovereign.ledger.service.GovernanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/governance")
public class GovernanceController {

    @Autowired
    private GovernanceService governanceService;

    @PostMapping("/vote")
    public ResponseEntity<?> submitVote(@RequestBody Map<String, String> payload) {
        String proposalId = payload.get("proposalId");
        String voteDirection = payload.get("voteDirection");
        String hsmKey = payload.get("hsmKey");

        Map<String, Object> result = governanceService.executeVote(proposalId, voteDirection, hsmKey);

        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(403).body(result);
        }
    }
}
