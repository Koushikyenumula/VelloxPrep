package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ProgressResponse;

/**
 * Contract for user progress tracking and performance analytics.
 */
public interface ProgressService {

    /**
     * Compute and return the authenticated user's aggregated progress metrics.
     * <p>
     * Calculates: total interviews, average score, accuracy, improvement percentage,
     * best score, strong skills, and weak skills from all completed interview sessions.
     *
     * @param email the authenticated user's email
     * @return response containing the computed progress metrics
     */
    ApiResponse<ProgressResponse> getProgress(String email);
}
