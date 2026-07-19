package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.request.GenerateMcqRequest;
import com.koushik.aiinterview.dto.request.SubmitMcqAnswerRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.McqSessionDetailResponse;
import com.koushik.aiinterview.dto.response.McqSessionResponse;
import com.koushik.aiinterview.dto.response.SubmitMcqAnswerResponse;

import java.util.List;

public interface McqService {

    ApiResponse<McqSessionDetailResponse> generateMcqSession(GenerateMcqRequest request, String email);

    ApiResponse<List<McqSessionResponse>> getUserSessions(String email);

    ApiResponse<McqSessionDetailResponse> getSessionDetails(Long id, String email);

    ApiResponse<SubmitMcqAnswerResponse> submitAnswer(SubmitMcqAnswerRequest request, String email);
}
