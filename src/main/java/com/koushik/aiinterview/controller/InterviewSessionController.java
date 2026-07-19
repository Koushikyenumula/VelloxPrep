package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionDetailResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionResponse;
import com.koushik.aiinterview.service.InterviewSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for interview session history operations.
 * Base path: /api/interview-sessions (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/interview-sessions")
@RequiredArgsConstructor
public class InterviewSessionController {

    private final InterviewSessionService sessionService;

    /**
     * GET /api/interview-sessions
     * Retrieve all interview sessions for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<InterviewSessionResponse>>> getUserSessions(
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<List<InterviewSessionResponse>> response = sessionService.getUserSessions(email);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/interview-sessions/{id}
     * Retrieve a specific interview session's details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewSessionDetailResponse>> getSessionDetails(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<InterviewSessionDetailResponse> response = sessionService.getSessionDetails(id, email);
        return ResponseEntity.ok(response);
    }
}
