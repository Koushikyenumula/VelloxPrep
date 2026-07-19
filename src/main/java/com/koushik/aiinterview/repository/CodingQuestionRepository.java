package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.CodingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodingQuestionRepository extends JpaRepository<CodingQuestion, Long> {
}
