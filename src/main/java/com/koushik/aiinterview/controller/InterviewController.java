package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.request.GenerateQuestionsRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.GenerateQuestionsResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionDetailResponse;
import com.koushik.aiinterview.service.InterviewQuestionService;
import com.koushik.aiinterview.service.InterviewSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for AI-powered interview question generation.
 * Base path: /api/interviews (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewQuestionService interviewQuestionService;
    private final InterviewSessionService sessionService;

    /**
     * POST /api/interviews/generate
     * Generate interview questions using Gemini AI.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GenerateQuestionsResponse>> generateQuestions(
            @Valid @RequestBody GenerateQuestionsRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<GenerateQuestionsResponse> response =
                interviewQuestionService.generateQuestions(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/interviews/results/{sessionId}
     * Retrieve interview results by session ID.
     */
    @GetMapping("/results/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewSessionDetailResponse>> getInterviewResults(
            @PathVariable Long sessionId,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<InterviewSessionDetailResponse> response = sessionService.getSessionDetails(sessionId, email);
        return ResponseEntity.ok(response);
    }
}
