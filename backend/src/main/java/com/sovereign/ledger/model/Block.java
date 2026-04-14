package com.sovereign.ledger.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blocks")
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String previousHash;

    @Column(nullable = false, unique = true)
    private String hash;

    private LocalDateTime timestamp = LocalDateTime.now();

    @OneToMany(mappedBy = "block", cascade = CascadeType.ALL)
    private List<Transaction> transactions = new ArrayList<>();

    public Block() {}

    public Block(String previousHash, String hash) {
        this.previousHash = previousHash;
        this.hash = hash;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public List<Transaction> getTransactions() { return transactions; }
    public void setTransactions(List<Transaction> transactions) { this.transactions = transactions; }

    public void addTransaction(Transaction transaction) {
        transactions.add(transaction);
        transaction.setBlock(this);
    }
}
