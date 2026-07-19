package com.koushik.aiinterview.service;

/**
 * Contract for ATS (Applicant Tracking System) score analysis.
 */
public interface AtsScoreService {

    /**
     * Analyze a resume and generate an ATS compatibility score.
     *
     * @param resumeId the ID of the uploaded resume
     * @return the computed ATS score
     */
    Double analyzeResume(Long resumeId);
}
