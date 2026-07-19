package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.request.GenerateQuestionsRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.GenerateQuestionsResponse;

/**
 * Contract for AI-powered interview question generation.
 */
public interface InterviewQuestionService {

    /**
     * Generate interview questions using Gemini AI based on skill and difficulty.
     *
     * @param request the generation request containing skill and difficulty
     * @param email   the authenticated user's email
     * @return response containing the session ID and generated questions
     */
    ApiResponse<GenerateQuestionsResponse> generateQuestions(GenerateQuestionsRequest request, String email);
}
