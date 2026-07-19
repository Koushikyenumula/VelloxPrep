package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access layer for {@link InterviewSession} entities.
 */
@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    /**
     * Find all interview sessions for a specific user.
     */
    List<InterviewSession> findByUserId(Long userId);

    /**
     * Find all interview sessions for a user identified by email.
     */
    List<InterviewSession> findByUserEmail(String email);

    /**
     * Find all interview sessions for a user by email and status.
     */
    List<InterviewSession> findByUserEmailAndStatus(String email, SessionStatus status);

    // ── Optimized aggregate queries for Dashboard ───────────────────────

    /**
     * Count completed interview sessions for a user (single DB query).
     */
    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    long countCompletedByUserEmail(@Param("email") String email);

    /**
     * Average score of completed sessions (computed in DB, not in Java).
     */
    @Query("SELECT COALESCE(AVG(s.score), 0.0) FROM InterviewSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    Double findAverageScoreByUserEmail(@Param("email") String email);

    /**
     * Best (maximum) score across all completed sessions.
     */
    @Query("SELECT COALESCE(MAX(s.score), 0.0) FROM InterviewSession s WHERE s.user.email = :email AND s.status = 'COMPLETED'")
    Double findBestScoreByUserEmail(@Param("email") String email);

    /**
     * Count completed sessions scoring at or above the given threshold (for accuracy calculation).
     */
    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.user.email = :email AND s.status = 'COMPLETED' AND s.score >= :threshold")
    long countAccurateByUserEmail(@Param("email") String email, @Param("threshold") double threshold);

    // ── Recent activity queries ─────────────────────────────────────────

    /**
     * Fetch the 10 most recent sessions for a user (for recent activities).
     */
    List<InterviewSession> findTop10ByUserEmailOrderByCreatedAtDesc(String email);

    // ── Platform-wide aggregate queries (Admin) ─────────────────────────

    /**
     * Count all sessions with a given status (platform-wide, no user filter).
     */
    long countByStatus(SessionStatus status);

    /**
     * Average score of all completed sessions across the platform.
     */
    @Query("SELECT COALESCE(AVG(s.score), 0.0) FROM InterviewSession s WHERE s.status = 'COMPLETED'")
    Double findGlobalAverageScore();

    /**
     * Best (maximum) score across all completed sessions on the platform.
     */
    @Query("SELECT COALESCE(MAX(s.score), 0.0) FROM InterviewSession s WHERE s.status = 'COMPLETED'")
    Double findGlobalBestScore();
}
