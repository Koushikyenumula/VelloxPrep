package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.request.SubmitAnswerRequest;
import com.koushik.aiinterview.dto.response.AnswerEvaluationResponse;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.service.AnswerEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for candidate answer submission.
 * Base path: /api/interview (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/interview")
@RequiredArgsConstructor
public class InterviewAnswerController {

    private final AnswerEvaluationService answerEvaluationService;

    /**
     * POST /api/interview/answer
     * Submit an answer to an interview question and get evaluation feedback.
     */
    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<AnswerEvaluationResponse>> submitAnswer(
            @Valid @RequestBody SubmitAnswerRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<AnswerEvaluationResponse> response = answerEvaluationService.submitAnswer(request, email);
        return ResponseEntity.ok(response);
    }
}
