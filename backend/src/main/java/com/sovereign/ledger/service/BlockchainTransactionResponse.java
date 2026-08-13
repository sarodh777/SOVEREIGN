package com.sovereign.ledger.service;

public class BlockchainTransactionResponse {
    private String hash;
    private Long blockNumber;
    private String contractAddress;

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }

    public String getContractAddress() { return contractAddress; }
    public void setContractAddress(String contractAddress) { this.contractAddress = contractAddress; }
}
