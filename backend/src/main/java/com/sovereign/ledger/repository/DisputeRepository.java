package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.Dispute;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);
    List<Dispute> findByRaisedByOrderByCreatedAtDesc(User user);
    List<Dispute> findByStatus(String status);
}
