/**
 * ═══════════════════════════════════════════════════════════════════
 * RESULTS PAGE — JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Auth guard (redirect to login if no token)
 *  - State detection (List Mode vs Detail Mode based on URL query parameter)
 *  - GET /api/interviews/results/{sessionId} API call for Detail Mode
 *  - GET /api/interview-sessions API call for List Mode
 *  - Live filtering of past sessions by skill
 *  - Populate statistics cards with animated counters
 *  - Render detailed evaluation questions, answers, AI feedback, and score badges
 *  - Sidebar toggle & Logout
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const loadingSkeleton      = document.getElementById('loadingSkeleton');
const resultsContent       = document.getElementById('resultsContent');
const errorState           = document.getElementById('errorState');
const errorMessageEl       = document.getElementById('errorMessage');
const retryBtn             = document.getElementById('retryBtn');
const currentDateEl        = document.getElementById('currentDate');
const userNameEl           = document.getElementById('userName');
const userEmailEl          = document.getElementById('userEmail');
const pageTitle            = document.getElementById('pageTitle');
const pageSubtitle         = document.getElementById('pageSubtitle');

// ── State Containers ────────────────────────────────────────────────
const listModeContainer    = document.getElementById('listModeContainer');
const detailModeContainer  = document.getElementById('detailModeContainer');

// ── List Mode Elements ──────────────────────────────────────────────
const sessionsListBody     = document.getElementById('sessionsListBody');
const emptySessions        = document.getElementById('emptySessions');
const sessionSearch        = document.getElementById('sessionSearch');

// ── Detail Mode Elements ────────────────────────────────────────────
const sessionMetaBadge     = document.getElementById('sessionMetaBadge');
const totalQuestionsEl     = document.getElementById('totalQuestions');
const averageScoreEl       = document.getElementById('averageScore');
const bestScoreEl          = document.getElementById('bestScore');
const accuracyEl           = document.getElementById('accuracy');
const detailedEvaluationsBody = document.getElementById('detailedEvaluationsBody');
const emptyEvaluations     = document.getElementById('emptyEvaluations');

// ── Global Variables ────────────────────────────────────────────────
let allSessions = [];
let activeSessionId = null;

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize reusable sidebar
    Sidebar.init();

    // Set current date
    setCurrentDate();

    // Live search filtering for List Mode
    if (sessionSearch) {
        sessionSearch.addEventListener('input', handleSessionSearch);
    }

    // Retry action
    retryBtn.addEventListener('click', initializePage);

    // Parse URL and determine mode
    initializePage();
});

function initializePage() {
    const params = new URLSearchParams(window.location.search);
    activeSessionId = params.get('id');

    if (activeSessionId) {
        loadDetailedResults(activeSessionId);
    } else {
        loadSessionsList();
    }
}

// ── State 1: Load Sessions List (List Mode) ─────────────────────────
async function loadSessionsList() {
    showLoading();
    
    // Set Header
    pageTitle.textContent = 'All Results';
    pageSubtitle.textContent = 'Explore performance breakdowns and AI feedback for your past practice sessions.';

    try {
        const [interviewSessions, mcqSessions] = await Promise.all([
            API.getInterviewSessions(),
            API.getMcqSession ? API.getMcqSessions() : Promise.resolve([]) // we need to add getMcqSessions to API
        ]);
        
        // Tag them
        const iSessions = (interviewSessions || []).map(s => ({ ...s, testType: 'SUBJECTIVE' }));
        const mSessions = (mcqSessions || []).map(s => ({ ...s, testType: 'MCQ' }));
        
        allSessions = [...iSessions, ...mSessions];
        
        // Sort by createdAt descending
        allSessions.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        renderSessionsList(allSessions);
        showContent(true); // show list mode

    } catch (error) {
        console.error('Error fetching sessions:', error);
        showError('Could not retrieve interview sessions. Please verify your connection.');
    }
}

function renderSessionsList(sessions) {
    if (!sessionsListBody) return;
    sessionsListBody.innerHTML = '';

    if (sessions.length === 0) {
        emptySessions.classList.remove('d-none');
        return;
    }

    emptySessions.classList.add('d-none');

    sessions.forEach(session => {
        const tr = document.createElement('tr');
        
        // Skill name capitalized
        const skillName = escapeHtml(session.skill);
        
        // Difficulty badge style
        const difficulty = session.difficulty ? session.difficulty.toUpperCase() : 'MEDIUM';
        const diffClass = difficulty.toLowerCase();

        // Score format
        const scoreVal = session.score != null ? Math.round(session.score) : null;
        const scoreText = scoreVal !== null ? `${scoreVal}%` : '—';
        
        // Date formatting
        let dateStr = '—';
        if (session.createdAt) {
            const dateObj = new Date(session.createdAt);
            dateStr = dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        // Status styling
        const status = session.status || 'COMPLETED';
        let statusBadgeClass = 'badge bg-secondary';
        let actionBtn = '';
        
        const isMcq = session.testType === 'MCQ';
        const typeBadge = isMcq ? '<span class="badge bg-info text-dark ms-2">MCQ</span>' : '<span class="badge bg-primary text-white ms-2">Subjective</span>';

        if (status === 'COMPLETED') {
            statusBadgeClass = 'badge bg-success-subtle text-success border border-success-subtle';
            
            const url = isMcq ? `mcq-session.html?id=${session.id}` : `results.html?id=${session.id}`;
            actionBtn = `
                <a href="${url}" class="btn btn-sm btn-outline-primary px-3">
                    View Results <i class="bi bi-arrow-right ms-1"></i>
                </a>
            `;
        } else {
            statusBadgeClass = 'badge bg-warning-subtle text-warning border border-warning-subtle';
            
            const url = isMcq ? `mcq-session.html?id=${session.id}` : `interview-session.html?id=${session.id}`;
            actionBtn = `
                <a href="${url}" class="btn btn-sm btn-primary px-3">
                    Resume <i class="bi bi-play-fill ms-1"></i>
                </a>
            `;
        }

        tr.innerHTML = `
            <td>
                <span class="activity-name">${skillName}</span>${typeBadge}
            </td>
            <td>
                <span class="difficulty-badge ${diffClass}">${difficulty}</span>
            </td>
            <td>
                <span class="fw-semibold text-light">${scoreText}</span>
            </td>
            <td>
                <span class="text-secondary">${dateStr}</span>
            </td>
            <td>
                <span class="${statusBadgeClass}">${status.replace('_', ' ')}</span>
            </td>
            <td class="text-end">
                ${actionBtn}
            </td>
        `;
        sessionsListBody.appendChild(tr);
    });
}

function handleSessionSearch() {
    const query = sessionSearch.value.trim().toLowerCase();
    if (!query) {
        renderSessionsList(allSessions);
        return;
    }

    const filtered = allSessions.filter(s => 
        (s.skill && s.skill.toLowerCase().includes(query)) ||
        (s.difficulty && s.difficulty.toLowerCase().includes(query))
    );
    renderSessionsList(filtered);
}

// ── State 2: Load Detailed Results (Detail Mode) ────────────────────
async function loadDetailedResults(sessionId) {
    showLoading();

    try {
        const data = await API.getInterviewResults(sessionId);

        // Populate Detail view
        renderDetailedResults(data);
        showContent(false); // show detail mode

    } catch (error) {
        console.error('Error fetching detailed results:', error);
        showError(error.message || 'Could not retrieve evaluation results. Please try again.');
    }
}

function renderDetailedResults(data) {
    // 1. Dynamic Header meta
    pageTitle.textContent = 'Results Breakdown';
    pageSubtitle.textContent = `Detailed evaluation score and feedback for your ${escapeHtml(data.skill)} interview.`;

    const difficulty = data.difficulty ? data.difficulty.toUpperCase() : 'MEDIUM';
    const diffClass = difficulty.toLowerCase();

    sessionMetaBadge.innerHTML = `
        <span class="meta-label">Skill:</span>
        <span class="meta-value me-3">${escapeHtml(data.skill)}</span>
        <span class="text-muted opacity-50 me-3">|</span>
        <span class="meta-label">Difficulty:</span>
        <span class="difficulty-badge ${diffClass} ms-1">${difficulty}</span>
    `;

    // 2. Extract calculations
    const questions = data.questions || [];
    const evaluations = data.evaluations || [];

    const totalQuestions = questions.length;

    // Filter out invalid/empty evaluations just in case
    const validEvaluations = evaluations.filter(e => e.score != null);
    
    // Average score
    let averageScore = 0;
    if (data.score != null) {
        averageScore = Math.round(data.score);
    } else if (validEvaluations.length > 0) {
        const sum = validEvaluations.reduce((acc, e) => acc + e.score, 0);
        averageScore = Math.round(sum / validEvaluations.length);
    }

    // Best answer score
    let bestScore = 0;
    if (validEvaluations.length > 0) {
        bestScore = Math.round(Math.max(...validEvaluations.map(e => e.score)));
    }

    // Accuracy (percentage of evaluations >= 60.0)
    let accuracy = 0;
    if (validEvaluations.length > 0) {
        const accurateCount = validEvaluations.filter(e => e.score >= 60.0).length;
        accuracy = Math.round((accurateCount / validEvaluations.length) * 100);
    }

    // 3. Populate cards (with animations)
    animateCounter(totalQuestionsEl, totalQuestions);
    animateCounter(averageScoreEl, averageScore);
    animateCounter(bestScoreEl, bestScore);
    animateCounter(accuracyEl, accuracy);

    // 4. Populate evaluations table
    if (!detailedEvaluationsBody) return;
    detailedEvaluationsBody.innerHTML = '';

    if (totalQuestions === 0) {
        emptyEvaluations.classList.remove('d-none');
        return;
    }

    emptyEvaluations.classList.add('d-none');

    // Display each question and its answer/evaluation
    questions.forEach((q, index) => {
        const tr = document.createElement('tr');
        
        // Find corresponding evaluation by matching questionId
        const evalObj = evaluations.find(e => e.questionId === q.id);

        const questionText = escapeHtml(q.question);
        
        let answerText = '<span class="text-muted italic">No answer submitted.</span>';
        let feedbackText = '<span class="text-muted italic">No feedback available. Session completed early or skipped.</span>';
        let scoreBadge = '<span class="text-secondary">—</span>';

        if (evalObj) {
            if (evalObj.userAnswer && evalObj.userAnswer.trim()) {
                answerText = escapeHtml(evalObj.userAnswer);
            }
            if (evalObj.aiFeedback && evalObj.aiFeedback.trim()) {
                // Formatting bullet points if feedback contains them
                feedbackText = formatFeedback(evalObj.aiFeedback);
            }

            const score = evalObj.score != null ? Math.round(evalObj.score) : 0;
            let badgeClass = 'danger';
            if (score >= 80) badgeClass = 'success';
            else if (score >= 60) badgeClass = 'warning';

            scoreBadge = `
                <span class="badge-score ${badgeClass}">
                    ${score}%
                </span>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="fw-semibold text-light mb-1">Question ${index + 1}</div>
                <div class="text-secondary" style="font-size: 0.82rem;">${questionText}</div>
            </td>
            <td>
                <div class="text-block text-secondary">${answerText}</div>
            </td>
            <td>
                <div class="text-block text-secondary">${feedbackText}</div>
            </td>
            <td class="text-end">
                ${scoreBadge}
            </td>
        `;

        detailedEvaluationsBody.appendChild(tr);
    });
}

/**
 * Format AI feedback lines nicely with spacing or bullets
 */
function formatFeedback(text) {
    if (!text) return '';
    // Escape HTML first
    let escaped = escapeHtml(text);
    
    // Replace markdown bold (**text**) with standard HTML bold
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split by lines and convert bullet marks to paragraph list
    const lines = escaped.split('\n');
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            return `<li class="ms-3 mb-1" style="list-style-type: disc;">${trimmed.substring(1).trim()}</li>`;
        } else if (trimmed) {
            return `<p class="mb-2">${trimmed}</p>`;
        }
        return '';
    });

    return formattedLines.join('');
}

// ── Page View State Controls ────────────────────────────────────────
function showLoading() {
    loadingSkeleton.classList.remove('d-none');
    resultsContent.classList.add('d-none');
    errorState.classList.add('d-none');
}

function showContent(isListMode) {
    loadingSkeleton.classList.add('d-none');
    resultsContent.classList.remove('d-none');
    errorState.classList.add('d-none');

    if (isListMode) {
        listModeContainer.classList.remove('d-none');
        detailModeContainer.classList.add('d-none');
    } else {
        listModeContainer.classList.add('d-none');
        detailModeContainer.classList.remove('d-none');
    }
}

function showError(msg) {
    loadingSkeleton.classList.add('d-none');
    resultsContent.classList.add('d-none');
    errorState.classList.remove('d-none');
    if (errorMessageEl) {
        errorMessageEl.textContent = msg || 'Could not load the requested results page.';
    }
}



// ── Date Info ───────────────────────────────────────────────────────
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ── Animated Counter Helper ─────────────────────────────────────────
function animateCounter(element, target, duration = 1000) {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const ease = progress * (2 - progress);
        const currentVal = Math.round(start + ease * (target - start));
        
        element.textContent = currentVal;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

// ── Helper: Escape HTML strings ─────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
