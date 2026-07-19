package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionDetailResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionResponse;

import java.util.List;

/**
 * Contract for managing interview sessions.
 */
public interface InterviewSessionService {

    /**
     * Retrieve all interview sessions for the authenticated user.
     *
     * @param email the user's email
     * @return response containing the list of interview sessions
     */
    ApiResponse<List<InterviewSessionResponse>> getUserSessions(String email);

    /**
     * Retrieve detailed information for a single interview session by ID.
     * Checks user ownership before returning session details.
     *
     * @param id    the session ID
     * @param email the user's email
     * @return response containing the session details, questions, and evaluations
     */
    ApiResponse<InterviewSessionDetailResponse> getSessionDetails(Long id, String email);
}
