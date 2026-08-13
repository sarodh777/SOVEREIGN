// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BankLedger {
    struct TransactionRecord {
        string transactionId;
        string fromAccount;
        string toAccount;
        uint256 amount;
        string transactionType;
        uint256 timestamp;
    }

    uint256 public transactionCount;
    mapping(uint256 => TransactionRecord) public transactions;

    event TransactionRecorded(
        uint256 indexed id,
        string transactionId,
        string fromAccount,
        string toAccount,
        uint256 amount,
        string transactionType,
        uint256 timestamp
    );

    function recordTransaction(
        string memory transactionId,
        string memory fromAccount,
        string memory toAccount,
        uint256 amount,
        string memory transactionType,
        uint256 timestamp
    ) public returns (bytes32) {
        transactionCount += 1;
        uint256 id = transactionCount;

        transactions[id] = TransactionRecord({
            transactionId: transactionId,
            fromAccount: fromAccount,
            toAccount: toAccount,
            amount: amount,
            transactionType: transactionType,
            timestamp: timestamp
        });

        emit TransactionRecorded(id, transactionId, fromAccount, toAccount, amount, transactionType, timestamp);

        return keccak256(abi.encodePacked(transactionId, fromAccount, toAccount, amount, transactionType, timestamp));
    }
}
