package com.sovereign.ledger.repository;

import com.sovereign.ledger.model.KycDocument;
import com.sovereign.ledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    Optional<KycDocument> findByUser(User user);
    List<KycDocument> findByStatus(String status);
}
