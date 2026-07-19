package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.McqQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface McqQuestionRepository extends JpaRepository<McqQuestion, Long> {
}
