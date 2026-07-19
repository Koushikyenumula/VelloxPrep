package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.request.SubmitAnswerRequest;
import com.koushik.aiinterview.dto.response.AnswerEvaluationResponse;
import com.koushik.aiinterview.dto.response.ApiResponse;

/**
 * Service contract for evaluating user answers.
 */
public interface AnswerEvaluationService {

    /**
     * Submit an answer to an interview question, evaluate it via Gemini AI,
     * save/update the evaluation record, and check for session completion.
     *
     * @param request the answer submission request containing question ID and answer
     * @param email   the authenticated user's email
     * @return response containing the evaluation result
     */
    ApiResponse<AnswerEvaluationResponse> submitAnswer(SubmitAnswerRequest request, String email);
}
