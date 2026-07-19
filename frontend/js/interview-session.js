/**
 * ═══════════════════════════════════════════════════════════════════
 * INTERVIEW SESSION PAGE — JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Auth guard
 *  - GET /api/interview-sessions/{id} to load questions
 *  - One-at-a-time question display with navigation
 *  - POST /api/interview/answer to submit each answer
 *  - 30-minute countdown timer
 *  - Progress tracking and question dot navigation
 *  - Session complete state
 *  - Sidebar toggle and logout
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Configuration ───────────────────────────────────────────────────
const SESSION_MINUTES = 30;

// ── State ───────────────────────────────────────────────────────────
let sessionData       = null;
let questions         = [];
let currentIndex      = 0;
let answers           = {};       // { questionId: userAnswer }
let evaluations       = {};       // { questionId: { score, aiFeedback } }
let timerInterval     = null;
let remainingSeconds  = SESSION_MINUTES * 60;

// ── DOM Elements ────────────────────────────────────────────────────
const loadingSkeleton    = document.getElementById('loadingSkeleton');
const sessionContent     = document.getElementById('sessionContent');
const sessionComplete    = document.getElementById('sessionComplete');
const errorState         = document.getElementById('errorState');
const alertContainer     = document.getElementById('alertContainer');

const topbarSubtitle     = document.getElementById('topbarSubtitle');
const sessionMeta        = document.getElementById('sessionMeta');
const questionDots       = document.getElementById('questionDots');
const progressCount      = document.getElementById('progressCount');
const progressFill       = document.getElementById('progressFill');

const questionCard       = document.getElementById('questionCard');
const questionBadge      = document.getElementById('questionBadge');
const questionCurrent    = document.getElementById('questionCurrent');
const questionTotal      = document.getElementById('questionTotal');
const questionText       = document.getElementById('questionText');

const evaluationPanel    = document.getElementById('evaluationPanel');
const evalScoreBadge     = document.getElementById('evalScoreBadge');
const evalFeedback       = document.getElementById('evalFeedback');

const answerSection      = document.getElementById('answerSection');
const answerTextarea     = document.getElementById('answerTextarea');
const charCount          = document.getElementById('charCount');

const prevBtn            = document.getElementById('prevBtn');
const nextBtn            = document.getElementById('nextBtn');
const submitAnswerBtn    = document.getElementById('submitAnswerBtn');
const submitBtnText      = document.getElementById('submitBtnText');
const submitBtnLoader    = document.getElementById('submitBtnLoader');

const timerDisplay       = document.getElementById('timerDisplay');
const timerValue         = document.getElementById('timerValue');

const completeSubtitle   = document.getElementById('completeSubtitle');



// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize reusable sidebar
    Sidebar.init();

    // Navigation buttons
    prevBtn.addEventListener('click', goToPrevious);
    nextBtn.addEventListener('click', goToNext);
    submitAnswerBtn.addEventListener('click', () => AnswerSubmission.submit());

    // Character counter
    answerTextarea.addEventListener('input', updateCharCount);

    // Initialise the AnswerSubmission module
    AnswerSubmission.init({
        getSessionId:       () => getSessionIdFromUrl(),
        getCurrentQuestion: () => questions[currentIndex] || null,
        getAnswerText:      () => answerTextarea.value,
        submitBtn:          submitAnswerBtn,
        submitBtnText:      submitBtnText,
        submitBtnLoader:    submitBtnLoader,
        answerTextarea:     answerTextarea,

        onEvaluationReceived: (questionId, evaluation) => {
            // Store evaluation
            answers[questionId] = evaluation.userAnswer || answerTextarea.value;
            evaluations[questionId] = {
                score:      evaluation.score,
                aiFeedback: evaluation.aiFeedback
            };

            // Show inline feedback
            showEvaluation(evaluations[questionId]);

            // Update progress & dots
            updateProgress();
            updateDotStates();

            // Check if all answered
            const allAnswered = questions.every(q => evaluations[q.id]);
            if (allAnswered && currentIndex === questions.length - 1) {
                nextBtn.innerHTML = '<i class="bi bi-check2-all"></i> Finish';
                nextBtn.classList.add('btn-submit-answer', 'btn-finish');
                nextBtn.classList.remove('btn-nav');
                nextBtn.disabled = false;
                nextBtn.onclick = finishSession;
            } else if (currentIndex < questions.length - 1) {
                nextBtn.disabled = false;
            }

            clearAlert();
        },

        onAdvanceNext: () => {
            // Auto-move to next question
            if (currentIndex < questions.length - 1) {
                goToNext();
            } else {
                // Last question — check if all done
                const allAnswered = questions.every(q => evaluations[q.id]);
                if (allAnswered) {
                    finishSession();
                }
            }
        },

        onAllAnswered: () => {
            finishSession();
        }
    });

    // Load session
    loadSession();
});

// ── Load Session Data ───────────────────────────────────────────────
async function loadSession() {
    const sessionId = getSessionIdFromUrl();
    if (!sessionId) {
        showAlert('No session ID provided. Redirecting…', 'warning');
        setTimeout(() => { window.location.href = 'interview-generate.html'; }, 1500);
        return;
    }

    showView('loading');

    try {
        sessionData = await API.getInterviewSession(sessionId);
        questions = sessionData.questions || [];

        if (questions.length === 0) {
            showAlert('This session has no questions.', 'warning');
            showView('error');
            return;
        }

        // Pre-populate answers from existing evaluations
        if (sessionData.evaluations && sessionData.evaluations.length > 0) {
            sessionData.evaluations.forEach(ev => {
                if (ev.questionId) {
                    answers[ev.questionId] = ev.userAnswer || '';
                    evaluations[ev.questionId] = {
                        score: ev.score,
                        aiFeedback: ev.aiFeedback
                    };
                }
            });
        }

        // Render session
        renderSessionMeta();
        renderQuestionDots();
        displayQuestion(0);
        updateProgress();
        startTimer();

        topbarSubtitle.textContent = `${sessionData.skill} · ${sessionData.difficulty} · ${questions.length} Questions`;

        showView('session');

    } catch (error) {
        console.error('Load session error:', error);
        showView('error');
    }
}

// ── Render Session Meta Badges ──────────────────────────────────────
function renderSessionMeta() {
    const diffClass = getDifficultyBadgeClass(sessionData.difficulty);
    sessionMeta.innerHTML = `
        <span class="session-badge badge-skill">
            <i class="bi bi-code-slash me-1"></i>${escapeHtml(sessionData.skill)}
        </span>
        <span class="session-badge ${diffClass}">
            <i class="bi bi-sliders me-1"></i>${escapeHtml(sessionData.difficulty)}
        </span>
        <span class="session-badge badge-skill">
            <i class="bi bi-list-ol me-1"></i>${questions.length} Questions
        </span>
    `;
}

function getDifficultyBadgeClass(difficulty) {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy')   return 'badge-difficulty-easy';
    if (d === 'medium') return 'badge-difficulty-medium';
    if (d === 'hard')   return 'badge-difficulty-hard';
    return 'badge-skill';
}

// ── Render Question Dots ────────────────────────────────────────────
function renderQuestionDots() {
    questionDots.innerHTML = questions.map((q, i) => {
        const answeredClass = evaluations[q.id] ? 'answered' : '';
        return `<button class="q-dot ${answeredClass}" data-index="${i}" title="Question ${i + 1}">${i + 1}</button>`;
    }).join('');

    // Attach click listeners
    questionDots.querySelectorAll('.q-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            saveCurrentAnswer();
            displayQuestion(index);
        });
    });
}

function updateDotStates() {
    const dots = questionDots.querySelectorAll('.q-dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'answered');
        if (i === currentIndex) dot.classList.add('active');
        if (evaluations[questions[i].id]) dot.classList.add('answered');
    });
}

// ── Display Question ────────────────────────────────────────────────
function displayQuestion(index) {
    currentIndex = index;
    const q = questions[index];

    // Animate card
    questionCard.style.animation = 'none';
    questionCard.offsetHeight; // trigger reflow
    questionCard.style.animation = 'cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both';

    // Update question content
    questionBadge.textContent = index + 1;
    questionCurrent.textContent = index + 1;
    questionTotal.textContent = questions.length;
    questionText.textContent = q.question;

    // Restore saved answer
    answerTextarea.value = answers[q.id] || '';
    updateCharCount();

    // Show/hide evaluation if already answered
    const ev = evaluations[q.id];
    if (ev) {
        showEvaluation(ev);
        answerTextarea.disabled = true;
        submitAnswerBtn.disabled = true;
        submitBtnText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Answered';
    } else {
        hideEvaluation();
        answerTextarea.disabled = false;
        submitAnswerBtn.disabled = false;
        submitBtnText.innerHTML = '<i class="bi bi-send-fill"></i> Submit Answer';
    }

    // Update navigation buttons
    prevBtn.disabled = index === 0;

    // If last question and all answered, show "Finish" style
    if (index === questions.length - 1) {
        const allAnswered = questions.every(q => evaluations[q.id]);
        if (allAnswered) {
            nextBtn.innerHTML = '<i class="bi bi-check2-all"></i> Finish';
            nextBtn.classList.add('btn-submit-answer', 'btn-finish');
            nextBtn.classList.remove('btn-nav');
            nextBtn.onclick = finishSession;
        } else {
            nextBtn.disabled = true;
            nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right"></i>';
        }
    } else {
        nextBtn.disabled = false;
        nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right"></i>';
        nextBtn.classList.add('btn-nav');
        nextBtn.classList.remove('btn-submit-answer', 'btn-finish');
        nextBtn.onclick = goToNext;
    }

    // Update dots
    updateDotStates();
}

// ── Submit Answer (delegated to AnswerSubmission module) ────────────
// The submit logic lives in answer-submission.js.
// Callbacks wired via AnswerSubmission.init() handle evaluation,
// progress updates, and auto-advance to the next question.

// ── Evaluation Display ──────────────────────────────────────────────
function showEvaluation(ev) {
    evaluationPanel.classList.remove('d-none');
    const score = ev.score != null ? Math.round(ev.score) : 0;
    evalScoreBadge.textContent = `${score}%`;
    evalScoreBadge.className = `eval-score-badge ${getScoreClass(score)}`;
    evalFeedback.textContent = ev.aiFeedback || 'No feedback available.';
}

function hideEvaluation() {
    evaluationPanel.classList.add('d-none');
}

function getScoreClass(score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-mid';
    return 'score-low';
}

// ── Navigation ──────────────────────────────────────────────────────
function saveCurrentAnswer() {
    const q = questions[currentIndex];
    if (q && !evaluations[q.id]) {
        answers[q.id] = answerTextarea.value;
    }
}

function goToPrevious() {
    if (currentIndex > 0) {
        saveCurrentAnswer();
        displayQuestion(currentIndex - 1);
    }
}

function goToNext() {
    if (currentIndex < questions.length - 1) {
        saveCurrentAnswer();
        displayQuestion(currentIndex + 1);
    }
}

// ── Progress ────────────────────────────────────────────────────────
function updateProgress() {
    const answered = questions.filter(q => evaluations[q.id]).length;
    const total = questions.length;
    const pct = total > 0 ? (answered / total) * 100 : 0;

    progressCount.textContent = `${answered} / ${total} answered`;
    progressFill.style.width = `${pct}%`;
}

// ── Timer ───────────────────────────────────────────────────────────
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            clearInterval(timerInterval);
            handleTimeUp();
        }

        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timerValue.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Color states
    timerDisplay.classList.remove('warning', 'danger');
    if (remainingSeconds <= 120) {
        timerDisplay.classList.add('danger');
    } else if (remainingSeconds <= 300) {
        timerDisplay.classList.add('warning');
    }
}

function handleTimeUp() {
    showAlert('⏱ Time is up! Your session has ended.', 'warning');

    // Disable interactions
    answerTextarea.disabled = true;
    submitAnswerBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    // Show finish after a moment
    setTimeout(() => {
        finishSession();
    }, 2500);
}

// ── Finish Session ──────────────────────────────────────────────────
function finishSession() {
    clearInterval(timerInterval);

    const answered = questions.filter(q => evaluations[q.id]).length;
    const total = questions.length;

    // Calculate average score
    let avgScore = 0;
    const scores = Object.values(evaluations).map(e => e.score || 0);
    if (scores.length > 0) {
        avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    completeSubtitle.textContent = `You answered ${answered} of ${total} questions with an average score of ${avgScore}%.`;

    const viewResultsBtn = document.getElementById('viewResultsBtn');
    const sessionId = getSessionIdFromUrl();
    if (viewResultsBtn && sessionId) {
        viewResultsBtn.href = `results.html?id=${sessionId}`;
    }

    showView('complete');
}

// ── View Management ─────────────────────────────────────────────────
function showView(view) {
    loadingSkeleton.classList.add('d-none');
    sessionContent.classList.add('d-none');
    sessionComplete.classList.add('d-none');
    errorState.classList.add('d-none');

    switch (view) {
        case 'loading':  loadingSkeleton.classList.remove('d-none'); break;
        case 'session':  sessionContent.classList.remove('d-none'); break;
        case 'complete': sessionComplete.classList.remove('d-none'); break;
        case 'error':    errorState.classList.remove('d-none'); break;
    }
}

// ── Loading State ───────────────────────────────────────────────────
// Submit loading state is now managed by the AnswerSubmission module.

// ── Character Counter ───────────────────────────────────────────────
function updateCharCount() {
    charCount.textContent = answerTextarea.value.length;
}

// ── Alert Display ───────────────────────────────────────────────────
function showAlert(message, type = 'danger') {
    Toast.show(message, type);
}

function clearAlert() {
    // No-op with stackable toasts
}

// ── Utility ─────────────────────────────────────────────────────────
function getSessionIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


