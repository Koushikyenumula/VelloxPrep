package com.koushik.aiinterview.repository;

import com.koushik.aiinterview.entity.CodingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, Long> {
}
