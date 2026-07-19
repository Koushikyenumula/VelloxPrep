package com.koushik.aiinterview.service;

import java.util.List;

/**
 * Contract for extracting skills from resume content.
 */
public interface SkillExtractionService {

    /**
     * Extract skills from a resume PDF file.
     *
     * @param resumeId the ID of the uploaded resume
     * @return list of detected skills
     */
    List<String> extractSkills(Long resumeId);
}
