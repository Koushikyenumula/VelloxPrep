package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.McqSession;
import com.koushik.aiinterview.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface McqSessionRepository extends JpaRepository<McqSession, Long> {

    List<McqSession> findByUserEmail(String email);

    List<McqSession> findTop10ByUserEmailOrderByCreatedAtDesc(String email);
    
    @Query("SELECT COUNT(s) FROM McqSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    long countCompletedByUserEmail(@Param("email") String email);

    @Query("SELECT AVG(s.score) FROM McqSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    Double findAverageScoreByUserEmail(@Param("email") String email);

    @Query("SELECT MAX(s.score) FROM McqSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    Double findBestScoreByUserEmail(@Param("email") String email);

    @Query("SELECT COUNT(s) FROM McqSession s WHERE s.user.email = :email AND s.status = 'COMPLETED' AND s.score >= :threshold")
    long countAccurateByUserEmail(@Param("email") String email, @Param("threshold") Double threshold);
}
