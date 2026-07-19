package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.request.GenerateMcqRequest;
import com.koushik.aiinterview.dto.request.SubmitMcqAnswerRequest;
import com.koushik.aiinterview.dto.response.*;
import com.koushik.aiinterview.entity.*;
import com.koushik.aiinterview.exception.GeminiApiException;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.McqQuestionRepository;
import com.koushik.aiinterview.repository.McqSessionRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.GeminiService;
import com.koushik.aiinterview.service.McqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class McqServiceImpl implements McqService {

    private final McqSessionRepository sessionRepository;
    private final McqQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_INSTRUCTION = """
            You are a technical MCQ quiz generator.
            You must respond ONLY with a valid JSON array.
            Each element in the array must be a JSON object with exactly the following fields:
            - "question": the quiz question text
            - "optionA": the first option
            - "optionB": the second option
            - "optionC": the third option
            - "optionD": the fourth option
            - "correctOption": the correct option letter (exactly "A", "B", "C", or "D")
            - "explanation": a short explanation of why the correct option is right
            """;

    @Override
    @Transactional
    public ApiResponse<McqSessionDetailResponse> generateMcqSession(GenerateMcqRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String prompt = String.format("Generate %d multiple choice questions about %s at %s difficulty level.",
                request.getQuestionCount(), request.getSkill(), request.getDifficulty());

        String geminiResponse = geminiService.generateContent(SYSTEM_INSTRUCTION, prompt);

        // Robustly extract the JSON array
        String jsonString = geminiResponse;
        int startIndex = jsonString.indexOf('[');
        int endIndex = jsonString.lastIndexOf(']');

        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
        } else {
            throw new GeminiApiException("Invalid JSON array format returned by AI.");
        }

        McqSession session = McqSession.builder()
                .skill(request.getSkill())
                .difficulty(Difficulty.valueOf(request.getDifficulty().toUpperCase()))
                .status(SessionStatus.IN_PROGRESS)
                .user(user)
                .build();

        try {
            JsonNode rootNode = objectMapper.readTree(jsonString);
            for (JsonNode node : rootNode) {
                McqQuestion question = McqQuestion.builder()
                        .question(node.get("question").asText())
                        .optionA(node.get("optionA").asText())
                        .optionB(node.get("optionB").asText())
                        .optionC(node.get("optionC").asText())
                        .optionD(node.get("optionD").asText())
                        .correctOption(node.get("correctOption").asText().toUpperCase().trim())
                        .explanation(node.has("explanation") ? node.get("explanation").asText() : "")
                        .build();
                session.addQuestion(question);
            }
        } catch (Exception ex) {
            throw new GeminiApiException("Failed to parse Gemini generated MCQs.", ex);
        }

        McqSession savedSession = sessionRepository.save(session);
        return getSessionDetails(savedSession.getId(), email);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<McqSessionResponse>> getUserSessions(String email) {
        List<McqSession> sessions = sessionRepository.findByUserEmail(email);
        List<McqSessionResponse> sessionResponses = sessions.stream()
                .map(s -> McqSessionResponse.builder()
                        .id(s.getId())
                        .skill(s.getSkill())
                        .difficulty(s.getDifficulty().name())
                        .score(s.getScore())
                        .status(s.getStatus().name())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();
        return ApiResponse.success("MCQ sessions retrieved", sessionResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<McqSessionDetailResponse> getSessionDetails(Long id, String email) {
        McqSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("McqSession", "id", id));

        if (!session.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("McqSession", "id", id);
        }

        boolean isCompleted = session.getStatus() == SessionStatus.COMPLETED;

        List<McqQuestionResponse> questionResponses = session.getMcqQuestions().stream()
                .map(q -> {
                    boolean isAnswered = q.getUserSelectedOption() != null;
                    return McqQuestionResponse.builder()
                            .id(q.getId())
                            .question(q.getQuestion())
                            .optionA(q.getOptionA())
                            .optionB(q.getOptionB())
                            .optionC(q.getOptionC())
                            .optionD(q.getOptionD())
                            .userSelectedOption(q.getUserSelectedOption())
                            // Only expose correct answers if user answered this question or session is done
                            .correctOption(isAnswered || isCompleted ? q.getCorrectOption() : null)
                            .explanation(isAnswered || isCompleted ? q.getExplanation() : null)
                            .build();
                })
                .toList();

        McqSessionDetailResponse detailResponse = McqSessionDetailResponse.builder()
                .id(session.getId())
                .skill(session.getSkill())
                .difficulty(session.getDifficulty().name())
                .score(session.getScore())
                .status(session.getStatus().name())
                .createdAt(session.getCreatedAt())
                .questions(questionResponses)
                .build();

        return ApiResponse.success("MCQ session details retrieved", detailResponse);
    }

    @Override
    @Transactional
    public ApiResponse<SubmitMcqAnswerResponse> submitAnswer(SubmitMcqAnswerRequest request, String email) {
        McqQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("McqQuestion", "id", request.getQuestionId()));

        McqSession session = question.getMcqSession();
        if (!session.getId().equals(request.getSessionId()) || !session.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("McqQuestion", "id", request.getQuestionId());
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress.");
        }

        question.setUserSelectedOption(request.getSelectedOption().toUpperCase());
        boolean isCorrect = question.getCorrectOption().equals(question.getUserSelectedOption());
        
        questionRepository.save(question);

        // Check if all answered
        long answeredCount = session.getMcqQuestions().stream()
                .filter(q -> q.getUserSelectedOption() != null)
                .count();

        if (answeredCount == session.getMcqQuestions().size()) {
            long correctCount = session.getMcqQuestions().stream()
                    .filter(q -> q.getCorrectOption().equals(q.getUserSelectedOption()))
                    .count();
            
            double score = ((double) correctCount / session.getMcqQuestions().size()) * 100.0;
            session.setScore(score);
            session.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(session);
        }

        SubmitMcqAnswerResponse response = SubmitMcqAnswerResponse.builder()
                .questionId(question.getId())
                .userSelectedOption(question.getUserSelectedOption())
                .correctOption(question.getCorrectOption())
                .explanation(question.getExplanation())
                .isCorrect(isCorrect)
                .build();

        return ApiResponse.success("Answer submitted", response);
    }
}
