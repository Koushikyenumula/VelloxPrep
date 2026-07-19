package com.koushik.aiinterview.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores the evaluation result for a user's answer to an interview question.
 * Contains the user's response, AI-generated feedback, and a numeric score.
 */
@Entity
@Table(name = "answer_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String userAnswer;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    private Double score;

    // ── Relationships ──────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_answer_evaluations_session"))
    private InterviewSession interviewSession;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_answer_evaluations_question"))
    private InterviewQuestion interviewQuestion;
}
