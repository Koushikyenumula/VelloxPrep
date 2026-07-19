package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access layer for {@link InterviewQuestion} entities.
 */
@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    /**
     * Find all questions belonging to a specific interview session.
     */
    List<InterviewQuestion> findByInterviewSessionId(Long sessionId);
}
