package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access layer for {@link Resume} entities.
 */
@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    /**
     * Find all resumes belonging to a specific user.
     */
    List<Resume> findByUserId(Long userId);

    /**
     * Find all resumes belonging to a user, identified by email.
     */
    List<Resume> findByUserEmail(String email);

    /**
     * Check if a resume with the same file name already exists for a user.
     */
    boolean existsByUserIdAndFileName(Long userId, String fileName);

    // ── Optimized queries for Dashboard ─────────────────────────────────

    /**
     * Count total resumes for a user (single DB query — no entity loading).
     */
    long countByUserEmail(String email);

    /**
     * Fetch the 10 most recent resume uploads for a user.
     */
    List<Resume> findTop10ByUserEmailOrderByUploadedAtDesc(String email);
}
