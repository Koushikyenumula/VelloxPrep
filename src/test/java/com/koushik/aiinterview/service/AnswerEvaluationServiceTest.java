package com.koushik.aiinterview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.request.SubmitAnswerRequest;
import com.koushik.aiinterview.dto.response.AnswerEvaluationResponse;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.entity.AnswerEvaluation;
import com.koushik.aiinterview.entity.Difficulty;
import com.koushik.aiinterview.entity.InterviewQuestion;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.Progress;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.AnswerEvaluationRepository;
import com.koushik.aiinterview.repository.InterviewQuestionRepository;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.ProgressRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.impl.AnswerEvaluationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnswerEvaluationServiceTest {

    @Mock
    private AnswerEvaluationRepository answerEvaluationRepository;

    @Mock
    private InterviewQuestionRepository questionRepository;

    @Mock
    private InterviewSessionRepository sessionRepository;

    @Mock
    private ProgressRepository progressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GeminiService geminiService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private AnswerEvaluationServiceImpl answerEvaluationService;

    private User mockUser;
    private InterviewSession mockSession;
    private InterviewQuestion mockQuestion;
    private SubmitAnswerRequest mockRequest;

    @BeforeEach
    void setUp() {
        answerEvaluationService = new AnswerEvaluationServiceImpl(
                answerEvaluationRepository,
                questionRepository,
                sessionRepository,
                progressRepository,
                userRepository,
                geminiService,
                objectMapper
        );

        mockUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .name("Test User")
                .build();

        mockSession = InterviewSession.builder()
                .id(10L)
                .user(mockUser)
                .skill("Java")
                .difficulty(Difficulty.MEDIUM)
                .status(SessionStatus.IN_PROGRESS)
                .interviewQuestions(new ArrayList<>())
                .answerEvaluations(new ArrayList<>())
                .build();

        mockQuestion = InterviewQuestion.builder()
                .id(100L)
                .question("What is Java?")
                .expectedAnswer("Java is a programming language.")
                .difficulty(Difficulty.MEDIUM)
                .skill("Java")
                .interviewSession(mockSession)
                .build();

        mockSession.getInterviewQuestions().add(mockQuestion);

        mockRequest = SubmitAnswerRequest.builder()
                .questionId(100L)
                .answer("Java is an object-oriented language.")
                .build();
    }

    @Test
    void submitAnswer_success_newEvaluation() {
        // Arrange
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(100L)).thenReturn(Optional.of(mockQuestion));
        when(geminiService.generateContent(anyString(), anyString()))
                .thenReturn("{\"score\":85.0,\"aiFeedback\":\"Good answer, could mention platform independence.\"}");
        when(answerEvaluationRepository.findByInterviewQuestionId(100L)).thenReturn(Optional.empty());
        when(answerEvaluationRepository.save(any(AnswerEvaluation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ApiResponse<AnswerEvaluationResponse> apiResponse = answerEvaluationService.submitAnswer(mockRequest, "user@example.com");

        // Assert
        assertNotNull(apiResponse);
        assertEquals(200, apiResponse.getStatus());
        AnswerEvaluationResponse response = apiResponse.getData();
        assertNotNull(response);
        assertEquals(85.0, response.getScore());
        assertEquals("Good answer, could mention platform independence.", response.getAiFeedback());
        assertEquals("Java is an object-oriented language.", response.getUserAnswer());
        assertEquals(100L, response.getQuestionId());

        verify(answerEvaluationRepository, times(1)).save(any(AnswerEvaluation.class));
    }

    @Test
    void submitAnswer_success_existingEvaluation() {
        // Arrange
        AnswerEvaluation existingEvaluation = AnswerEvaluation.builder()
                .id(200L)
                .userAnswer("Old answer")
                .aiFeedback("Old feedback")
                .score(50.0)
                .interviewQuestion(mockQuestion)
                .interviewSession(mockSession)
                .build();
        mockSession.getAnswerEvaluations().add(existingEvaluation);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(100L)).thenReturn(Optional.of(mockQuestion));
        when(geminiService.generateContent(anyString(), anyString()))
                .thenReturn("{\"score\":90.0,\"aiFeedback\":\"Much better answer.\"}");
        when(answerEvaluationRepository.findByInterviewQuestionId(100L)).thenReturn(Optional.of(existingEvaluation));
        when(answerEvaluationRepository.save(any(AnswerEvaluation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ApiResponse<AnswerEvaluationResponse> apiResponse = answerEvaluationService.submitAnswer(mockRequest, "user@example.com");

        // Assert
        assertNotNull(apiResponse);
        AnswerEvaluationResponse response = apiResponse.getData();
        assertEquals(90.0, response.getScore());
        assertEquals("Much better answer.", response.getAiFeedback());
        assertEquals("Java is an object-oriented language.", response.getUserAnswer());

        verify(answerEvaluationRepository, times(1)).save(existingEvaluation);
    }

    @Test
    void submitAnswer_throwsResourceNotFound_whenUserNotFound() {
        // Arrange
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                answerEvaluationService.submitAnswer(mockRequest, "user@example.com"));
    }

    @Test
    void submitAnswer_throwsResourceNotFound_whenQuestionNotFound() {
        // Arrange
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(100L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                answerEvaluationService.submitAnswer(mockRequest, "user@example.com"));
    }

    @Test
    void submitAnswer_throwsResourceNotFound_whenUserDoesNotOwnSession() {
        // Arrange
        User anotherUser = User.builder().id(2L).email("other@example.com").build();
        mockSession.setUser(anotherUser);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(100L)).thenReturn(Optional.of(mockQuestion));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                answerEvaluationService.submitAnswer(mockRequest, "user@example.com"));
    }

    @Test
    void submitAnswer_throwsIllegalStateException_whenSessionNotInProgress() {
        // Arrange
        mockSession.setStatus(SessionStatus.COMPLETED);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(100L)).thenReturn(Optional.of(mockQuestion));

        // Act & Assert
        assertThrows(IllegalStateException.class, () ->
                answerEvaluationService.submitAnswer(mockRequest, "user@example.com"));
    }

    @Test
    void submitAnswer_completesSession_whenAllQuestionsEvaluated() {
        // Arrange
        InterviewQuestion mockQuestion2 = InterviewQuestion.builder()
                .id(101L)
                .question("What is JVM?")
                .expectedAnswer("Java Virtual Machine.")
                .difficulty(Difficulty.MEDIUM)
                .skill("Java")
                .interviewSession(mockSession)
                .build();
        mockSession.getInterviewQuestions().add(mockQuestion2);

        // First question was already evaluated
        AnswerEvaluation evaluation1 = AnswerEvaluation.builder()
                .id(200L)
                .score(80.0)
                .userAnswer("JVM runs bytecode.")
                .interviewQuestion(mockQuestion)
                .interviewSession(mockSession)
                .build();
        mockSession.getAnswerEvaluations().add(evaluation1);

        // We are submitting for the second question
        SubmitAnswerRequest request2 = SubmitAnswerRequest.builder()
                .questionId(101L)
                .answer("JVM compiles bytecode to machine code.")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(questionRepository.findById(101L)).thenReturn(Optional.of(mockQuestion2));
        when(geminiService.generateContent(anyString(), anyString()))
                .thenReturn("{\"score\":90.0,\"aiFeedback\":\"Correct.\"}");
        when(answerEvaluationRepository.findByInterviewQuestionId(101L)).thenReturn(Optional.empty());
        when(answerEvaluationRepository.save(any(AnswerEvaluation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(sessionRepository.countCompletedByUserEmail("user@example.com")).thenReturn(1L);
        when(sessionRepository.findAverageScoreByUserEmail("user@example.com")).thenReturn(85.0);
        when(sessionRepository.findBestScoreByUserEmail("user@example.com")).thenReturn(85.0);

        // Act
        ApiResponse<AnswerEvaluationResponse> apiResponse = answerEvaluationService.submitAnswer(request2, "user@example.com");

        // Assert
        assertNotNull(apiResponse);
        assertEquals(SessionStatus.COMPLETED, mockSession.getStatus());
        assertEquals(85.0, mockSession.getScore()); // Average of 80 and 90

        verify(sessionRepository, times(1)).save(mockSession);
        verify(progressRepository, times(1)).save(any(Progress.class));
    }
}
