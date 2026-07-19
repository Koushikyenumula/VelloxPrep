package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.AnswerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Data access layer for {@link AnswerEvaluation} entities.
 */
@Repository
public interface AnswerEvaluationRepository extends JpaRepository<AnswerEvaluation, Long> {

    /**
     * Find the evaluation for a specific interview question.
     */
    Optional<AnswerEvaluation> findByInterviewQuestionId(Long questionId);
}
