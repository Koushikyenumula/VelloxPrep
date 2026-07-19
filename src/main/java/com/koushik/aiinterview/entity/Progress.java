package com.koushik.aiinterview.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Tracks a user's aggregate interview performance metrics.
 * Updated after each completed interview session.
 */
@Entity
@Table(name = "progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Progress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(nullable = false)
    private Integer totalInterviews = 0;

    @Builder.Default
    @Column(nullable = false)
    private Double averageScore = 0.0;

    @Builder.Default
    @Column(nullable = false)
    private Double accuracy = 0.0;

    @Builder.Default
    @Column(nullable = false)
    private Double improvementPercentage = 0.0;

    @Builder.Default
    @Column(nullable = false)
    private Double bestScore = 0.0;

    // ── Relationships ──────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_progress_user"))
    private User user;
}
