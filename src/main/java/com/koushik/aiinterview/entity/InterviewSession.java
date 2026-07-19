package com.koushik.aiinterview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Represents a single interview practice session.
 * Owns the questions asked and the evaluations of the user's answers.
 */
@Entity
@Table(name = "interview_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.NOT_STARTED;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_interview_sessions_user"))
    private User user;

    @OneToMany(mappedBy = "interviewSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    @Builder.Default
    private List<InterviewQuestion> interviewQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "interviewSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    @Builder.Default
    private List<AnswerEvaluation> answerEvaluations = new ArrayList<>();

    // ── Convenience helpers ────────────────────────────────────────────

    public void addQuestion(InterviewQuestion question) {
        interviewQuestions.add(question);
        question.setInterviewSession(this);
    }

    public void addEvaluation(AnswerEvaluation evaluation) {
        answerEvaluations.add(evaluation);
        evaluation.setInterviewSession(this);
    }
}
