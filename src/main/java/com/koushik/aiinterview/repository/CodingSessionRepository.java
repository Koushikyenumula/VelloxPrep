package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.CodingSession;
import com.koushik.aiinterview.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodingSessionRepository extends JpaRepository<CodingSession, Long> {
    List<CodingSession> findByUserOrderByCreatedAtDesc(User user);
}
