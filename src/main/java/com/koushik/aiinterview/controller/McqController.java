package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.request.GenerateMcqRequest;
import com.koushik.aiinterview.dto.request.SubmitMcqAnswerRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.McqSessionDetailResponse;
import com.koushik.aiinterview.dto.response.McqSessionResponse;
import com.koushik.aiinterview.dto.response.SubmitMcqAnswerResponse;
import com.koushik.aiinterview.service.McqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mcq")
@RequiredArgsConstructor
public class McqController {

    private final McqService mcqService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<McqSessionDetailResponse>> generateMcqSession(
            @Valid @RequestBody GenerateMcqRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        ApiResponse<McqSessionDetailResponse> response = mcqService.generateMcqSession(request, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<McqSessionResponse>>> getUserSessions(
            Authentication authentication) {
        String email = authentication.getName();
        ApiResponse<List<McqSessionResponse>> response = mcqService.getUserSessions(email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<McqSessionDetailResponse>> getSessionDetails(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication.getName();
        ApiResponse<McqSessionDetailResponse> response = mcqService.getSessionDetails(id, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<SubmitMcqAnswerResponse>> submitAnswer(
            @Valid @RequestBody SubmitMcqAnswerRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        ApiResponse<SubmitMcqAnswerResponse> response = mcqService.submitAnswer(request, email);
        return ResponseEntity.ok(response);
    }
}
