/**
 * ═══════════════════════════════════════════════════════════════════
 * MCQ SESSION PAGE — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const topbarSubtitle    = document.getElementById('topbarSubtitle');
const sessionMeta       = document.getElementById('sessionMeta');
const questionDots      = document.getElementById('questionDots');
const progressCount     = document.getElementById('progressCount');
const progressFill      = document.getElementById('progressFill');

const questionBadge     = document.getElementById('questionBadge');
const questionCurrent   = document.getElementById('questionCurrent');
const questionTotal     = document.getElementById('questionTotal');
const questionText      = document.getElementById('questionText');

const optionAText       = document.getElementById('optionAText');
const optionBText       = document.getElementById('optionBText');
const optionCText       = document.getElementById('optionCText');
const optionDText       = document.getElementById('optionDText');

const mcqOptions        = document.querySelectorAll('input[name="mcqOption"]');

const prevBtn           = document.getElementById('prevBtn');
const nextBtn           = document.getElementById('nextBtn');
const submitAnswerBtn   = document.getElementById('submitAnswerBtn');
const submitBtnText     = document.getElementById('submitBtnText');
const submitBtnLoader   = document.getElementById('submitBtnLoader');

const evaluationPanel   = document.getElementById('evaluationPanel');
const evalScoreBadge    = document.getElementById('evalScoreBadge');
const evalFeedback      = document.getElementById('evalFeedback');

const loadingSkeleton   = document.getElementById('loadingSkeleton');
const sessionContent    = document.getElementById('sessionContent');
const sessionComplete   = document.getElementById('sessionComplete');
const errorState        = document.getElementById('errorState');
const completeSubtitle  = document.getElementById('completeSubtitle');
const viewResultsBtn    = document.getElementById('viewResultsBtn');

// ── State Variables ─────────────────────────────────────────────────
let currentSessionId = null;
let currentSession = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {}; // questionId -> selectedOption

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    Sidebar.init();

    const urlParams = new URLSearchParams(window.location.search);
    currentSessionId = urlParams.get('id');

    if (!currentSessionId) {
        showErrorState();
        return;
    }

    // Event Listeners
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    submitAnswerBtn.addEventListener('click', submitAnswer);
    
    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show the first question in review mode
            currentQuestionIndex = 0;
            showSessionContent();
            renderCurrentQuestion();
        });
    }

    mcqOptions.forEach(radio => {
        radio.addEventListener('change', () => {
            // Re-enable submit button if they haven't submitted yet
            const q = questions[currentQuestionIndex];
            if (!q.userSelectedOption) {
                submitAnswerBtn.disabled = false;
            }
        });
    });

    loadSession();
});

// ── Load Session ────────────────────────────────────────────────────
async function loadSession() {
    showLoading();

    try {
        currentSession = await API.getMcqSession(currentSessionId);
        questions = currentSession.questions || [];

        if (questions.length === 0) {
            throw new Error("No questions found in this session.");
        }

        renderSessionMeta();
        renderQuestionDots();
        updateProgress();

        if (currentSession.status === 'COMPLETED') {
            showSessionComplete();
        } else {
            // Find first unanswered question
            let firstUnanswered = questions.findIndex(q => !q.userSelectedOption);
            currentQuestionIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
            
            showSessionContent();
            renderCurrentQuestion();
        }

    } catch (error) {
        console.error('Load session error:', error);
        showErrorState();
    }
}

// ── Render Helpers ──────────────────────────────────────────────────
function renderSessionMeta() {
    topbarSubtitle.textContent = `${currentSession.skill} • ${currentSession.difficulty}`;

    sessionMeta.innerHTML = `
        <span class="session-badge badge-skill">
            <i class="bi bi-code-slash me-1"></i>${currentSession.skill}
        </span>
        <span class="session-badge badge-difficulty-${currentSession.difficulty.toLowerCase()}">
            <i class="bi bi-bar-chart-line-fill me-1"></i>${currentSession.difficulty}
        </span>
    `;
}

function renderQuestionDots() {
    questionDots.innerHTML = '';
    questions.forEach((q, index) => {
        const dot = document.createElement('button');
        dot.className = 'q-dot';
        dot.textContent = index + 1;
        
        if (q.userSelectedOption) dot.classList.add('answered');
        if (index === currentQuestionIndex) dot.classList.add('active');

        dot.addEventListener('click', () => {
            currentQuestionIndex = index;
            renderCurrentQuestion();
            updateDots();
        });
        
        questionDots.appendChild(dot);
    });
}

function updateDots() {
    const dots = questionDots.querySelectorAll('.q-dot');
    dots.forEach((dot, idx) => {
        dot.classList.remove('active');
        if (idx === currentQuestionIndex) dot.classList.add('active');
        
        if (questions[idx].userSelectedOption) {
            dot.classList.add('answered');
        } else {
            dot.classList.remove('answered');
        }
    });
}

function updateProgress() {
    const answeredCount = questions.filter(q => q.userSelectedOption).length;
    const total = questions.length;
    const percentage = (answeredCount / total) * 100;

    progressCount.textContent = `${answeredCount} / ${total} answered`;
    progressFill.style.width = `${percentage}%`;
}

// ── Navigation ──────────────────────────────────────────────────────
function goPrev() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
        updateDots();
    }
}

function goNext() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
        updateDots();
    } else {
        // Check if all answered
        const allAnswered = questions.every(q => q.userSelectedOption);
        if (allAnswered) {
            window.location.reload(); // Reload to fetch complete status
        }
    }
}

// ── Render Question ─────────────────────────────────────────────────
function renderCurrentQuestion() {
    const q = questions[currentQuestionIndex];

    questionBadge.textContent = currentQuestionIndex + 1;
    questionCurrent.textContent = currentQuestionIndex + 1;
    questionTotal.textContent = questions.length;
    
    questionText.textContent = q.question;

    optionAText.textContent = q.optionA;
    optionBText.textContent = q.optionB;
    optionCText.textContent = q.optionC;
    optionDText.textContent = q.optionD;

    // Reset UI
    mcqOptions.forEach(radio => {
        radio.checked = false;
        radio.disabled = false;
        const box = radio.nextElementSibling;
        box.style.borderColor = '';
        box.style.background = '';
    });
    
    evaluationPanel.classList.add('d-none');
    
    // If already answered
    if (q.userSelectedOption) {
        // Check the radio button
        const selectedRadio = document.querySelector(`input[name="mcqOption"][value="${q.userSelectedOption}"]`);
        if (selectedRadio) selectedRadio.checked = true;

        // Disable all
        mcqOptions.forEach(radio => { radio.disabled = true; });

        // Highlight correct/incorrect
        highlightOptions(q.userSelectedOption, q.correctOption);

        // Show feedback
        showEvaluation(q.correctOption === q.userSelectedOption, q.explanation);

        submitAnswerBtn.style.display = 'none';
    } else {
        submitAnswerBtn.style.display = 'inline-flex';
        submitAnswerBtn.disabled = true; // wait for selection
    }

    // Nav buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.innerHTML = 'Finish <i class="bi bi-check2-all"></i>';
        nextBtn.classList.add('btn-finish');
    } else {
        nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right"></i>';
        nextBtn.classList.remove('btn-finish');
    }
}

function highlightOptions(userSelected, correct) {
    mcqOptions.forEach(radio => {
        const box = radio.nextElementSibling;
        if (radio.value === correct) {
            // Correct option is always green
            box.style.borderColor = 'var(--success)';
            box.style.background = 'hsla(145, 65%, 45%, 0.15)';
        } else if (radio.value === userSelected && userSelected !== correct) {
            // User selected wrong option (red)
            box.style.borderColor = 'var(--danger)';
            box.style.background = 'hsla(0, 75%, 60%, 0.15)';
        }
    });
}

function showEvaluation(isCorrect, explanation) {
    evaluationPanel.classList.remove('d-none');
    
    if (isCorrect) {
        evalScoreBadge.textContent = 'Correct';
        evalScoreBadge.className = 'eval-score-badge score-high';
    } else {
        evalScoreBadge.textContent = 'Incorrect';
        evalScoreBadge.className = 'eval-score-badge score-low';
    }

    evalFeedback.innerHTML = `<strong>Explanation:</strong> ${explanation}`;
}

// ── Submit Answer ───────────────────────────────────────────────────
async function submitAnswer() {
    const q = questions[currentQuestionIndex];
    const selectedOption = document.querySelector('input[name="mcqOption"]:checked');

    if (!selectedOption) return;

    setSubmitting(true);

    try {
        const response = await API.submitMcqAnswer(
            currentSessionId, 
            q.id, 
            selectedOption.value
        );

        // Update local state with truth
        q.userSelectedOption = response.userSelectedOption;
        q.correctOption = response.correctOption;
        q.explanation = response.explanation;

        updateProgress();
        updateDots();
        renderCurrentQuestion();

        Toast.show('Answer submitted', 'success');

        // If all answered, reload
        if (questions.every(question => question.userSelectedOption)) {
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }

    } catch (error) {
        console.error('Submit error:', error);
        Toast.show(error.message || 'Failed to submit answer.', 'danger');
    } finally {
        setSubmitting(false);
    }
}

function setSubmitting(isSubmitting) {
    submitAnswerBtn.disabled = isSubmitting;
    
    if (isSubmitting) {
        submitBtnText.classList.add('d-none');
        submitBtnLoader.classList.remove('d-none');
    } else {
        submitBtnText.classList.remove('d-none');
        submitBtnLoader.classList.add('d-none');
    }
}

// ── View States ─────────────────────────────────────────────────────
function showLoading() {
    loadingSkeleton.classList.remove('d-none');
    sessionContent.classList.add('d-none');
    errorState.classList.add('d-none');
    sessionComplete.classList.add('d-none');
}

function showSessionContent() {
    loadingSkeleton.classList.add('d-none');
    sessionContent.classList.remove('d-none');
    errorState.classList.add('d-none');
    sessionComplete.classList.add('d-none');
}

function showErrorState() {
    loadingSkeleton.classList.add('d-none');
    sessionContent.classList.add('d-none');
    errorState.classList.remove('d-none');
    sessionComplete.classList.add('d-none');
}

function showSessionComplete() {
    loadingSkeleton.classList.add('d-none');
    sessionContent.classList.add('d-none');
    errorState.classList.add('d-none');
    sessionComplete.classList.remove('d-none');

    const score = Math.round(currentSession.score || 0);
    completeSubtitle.innerHTML = `You completed the MCQ quiz with a score of <strong>${score}%</strong>!`;
}
