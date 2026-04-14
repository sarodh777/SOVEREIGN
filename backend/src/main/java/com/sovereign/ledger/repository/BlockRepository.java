package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {
    Optional<Block> findFirstByOrderByIdDesc();
}
