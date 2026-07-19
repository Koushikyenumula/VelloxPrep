package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access layer for {@link Progress} entities.
 */
@Repository
public interface ProgressRepository extends JpaRepository<Progress, Long> {

    /**
     * Find all progress records for a user identified by email.
     */
    List<Progress> findByUserEmail(String email);
}
