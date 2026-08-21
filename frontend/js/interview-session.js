/**
 * ═══════════════════════════════════════════════════════════════════
 *  SUBJECTIVE AI INTERVIEW SESSION — Controller & Physics Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

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
let isReducedMotion   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── DOM Elements ────────────────────────────────────────────────────
const canvas             = document.getElementById('aiNetworkCanvas');
const cursorGlow         = document.getElementById('cursorGlow');
const themeToggleBtn     = document.getElementById('themeToggleBtn');
const themeToggleIcon    = document.getElementById('themeToggleIcon');

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
    // 1. Auth Guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize Common Sidebar
    if (typeof Sidebar !== 'undefined' && typeof Sidebar.init === 'function') {
        Sidebar.init();
    }

    // 3. Visual Engine (Mobile & Desktop Accelerated)
    if (typeof VisualEngine !== 'undefined') {
        VisualEngine.initAll();
    } else {
        initTheme();
        initCanvasNetwork();
        initCursorGlow();
        initCardSpotlights();
    }

    // 4. Navigation & Input bindings
    if (prevBtn) prevBtn.addEventListener('click', goToPrevious);
    if (nextBtn) nextBtn.addEventListener('click', goToNext);
    if (submitAnswerBtn && typeof AnswerSubmission !== 'undefined') {
        submitAnswerBtn.addEventListener('click', () => AnswerSubmission.submit());
    }

    if (answerTextarea) {
        answerTextarea.addEventListener('input', updateCharCount);
    }

    // 5. Initialize AnswerSubmission module
    if (typeof AnswerSubmission !== 'undefined') {
        AnswerSubmission.init({
            getSessionId:       () => getSessionIdFromUrl(),
            getCurrentQuestion: () => questions[currentIndex] || null,
            getAnswerText:      () => answerTextarea.value,
            submitBtn:          submitAnswerBtn,
            submitBtnText:      submitBtnText,
            submitBtnLoader:    submitBtnLoader,
            answerTextarea:     answerTextarea,

            onEvaluationReceived: (questionId, evaluation) => {
                evaluations[questionId] = evaluation;
                answers[questionId] = answerTextarea.value;
                displayEvaluation(evaluation);
                updateProgress();
                updateQuestionDots();
                checkAllAnswered();
            },

            onError: (message) => {
                showAlert(message, 'danger');
            }
        });
    }

    // 6. Load Session
    loadSession();
});

// ═══════════════════════════════════════════════════════════════════
// 1. THEME ENGINE & SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════════
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const next = current === 'light' ? 'dark' : 'light';
            applyTheme(next);
        });
    }
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggleIcon) themeToggleIcon.className = 'bi bi-sun-fill';
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggleIcon) themeToggleIcon.className = 'bi bi-moon-stars';
    }
    localStorage.setItem('theme', theme);
}

// ═══════════════════════════════════════════════════════════════════
// 2. ATMOSPHERIC NEURAL NETWORK CANVAS
// ═══════════════════════════════════════════════════════════════════
function initCanvasNetwork() {
    if (!canvas || isReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes = [];
    let pulses = [];
    const MAX_NODES = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 85);
    const CONNECT_DIST = 140;

    const mouse = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2
    };

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        initNodes();
    }

    function initNodes() {
        nodes = [];
        for (let i = 0; i < MAX_NODES; i++) {
            const depth = 0.4 + Math.random() * 0.6;
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22 * depth,
                vy: (Math.random() - 0.5) * 0.22 * depth,
                radius: (1.2 + Math.random() * 1.5) * depth,
                depth: depth,
                alpha: 0.15 + depth * 0.45
            });
        }
    }

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    }, { passive: true });

    function spawnPulse(nodeA, nodeB) {
        if (pulses.length > 8) return;
        pulses.push({
            startX: nodeA.x,
            startY: nodeA.y,
            endX: nodeB.x,
            endY: nodeB.y,
            progress: 0,
            speed: 0.015 + Math.random() * 0.015
        });
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;

        const offsetX = (mouse.x - width / 2) / (width / 2);
        const offsetY = (mouse.y - height / 2) / (height / 2);

        ctx.clearRect(0, 0, width, height);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nodeColor = isLight ? 'rgba(70, 85, 125,' : 'rgba(180, 195, 235,';
        const lineColor = isLight ? 'rgba(100, 120, 170,' : 'rgba(140, 160, 215,';

        // Lines
        for (let i = 0; i < nodes.length; i++) {
            const na = nodes[i];
            const posX = na.x + offsetX * 15 * na.depth;
            const posY = na.y + offsetY * 15 * na.depth;

            for (let j = i + 1; j < nodes.length; j++) {
                const nb = nodes[j];
                const pbx = nb.x + offsetX * 15 * nb.depth;
                const pby = nb.y + offsetY * 15 * nb.depth;

                const dx = posX - pbx;
                const dy = posY - pby;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DIST) {
                    const alpha = (1 - dist / CONNECT_DIST) * 0.18 * na.depth * nb.depth;
                    ctx.beginPath();
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(pbx, pby);
                    ctx.strokeStyle = `${lineColor} ${alpha})`;
                    ctx.lineWidth = 0.75;
                    ctx.stroke();

                    if (Math.random() < 0.0003) {
                        spawnPulse(na, nb);
                    }
                }
            }
        }

        // Pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.progress += p.speed;

            if (p.progress >= 1) {
                pulses.splice(i, 1);
                continue;
            }

            const curX = p.startX + (p.endX - p.startX) * p.progress;
            const curY = p.startY + (p.endY - p.startY) * p.progress;

            ctx.beginPath();
            ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(99, 102, 241, 0.9)' : 'rgba(167, 139, 250, 0.95)';
            ctx.shadowColor = isLight ? '#6366f1' : '#a78bfa';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0) n.x = width;
            else if (n.x > width) n.x = 0;
            if (n.y < 0) n.y = height;
            else if (n.y > height) n.y = 0;

            const posX = n.x + offsetX * 15 * n.depth;
            const posY = n.y + offsetY * 15 * n.depth;

            ctx.beginPath();
            ctx.arc(posX, posY, n.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${nodeColor} ${n.alpha})`;
            ctx.fill();
        }
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);
}

// ── Desktop Cursor Ambient Glow ─────────────────────────────────────
function initCursorGlow() {
    if (!cursorGlow || isReducedMotion || window.innerWidth < 1024) return;

    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!isVisible) {
            isVisible = true;
            cursorGlow.style.opacity = '1';
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        cursorGlow.style.opacity = '0';
    });

    function updateGlow() {
        glowX += (targetX - glowX) * 0.12;
        glowY += (targetY - glowY) * 0.12;
        cursorGlow.style.left = `${glowX}px`;
        cursorGlow.style.top  = `${glowY}px`;
        requestAnimationFrame(updateGlow);
    }
    requestAnimationFrame(updateGlow);
}

// ── Interactive Card Mouse Follower Spotlight ───────────────────────
function initCardSpotlights() {
    if (isReducedMotion || window.innerWidth < 992) return;

    const cards = document.querySelectorAll('.question-card, .glass-panel, .evaluation-panel');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }, { passive: true });
    });
}

// ═══════════════════════════════════════════════════════════════════
// 3. LOAD SESSION DATA
// ═══════════════════════════════════════════════════════════════════
async function loadSession() {
    const sessionId = getSessionIdFromUrl();

    if (!sessionId) {
        showView('error');
        return;
    }

    showView('loading');

    try {
        const data = await API.getInterviewSession(sessionId);
        sessionData = data;
        questions = data.questions || [];

        if (questions.length === 0) {
            showAlert('No questions found for this session.', 'warning');
            showView('error');
            return;
        }

        renderSessionMeta(data);
        renderQuestionDots();
        updateProgress();
        startTimer();

        // Restore any existing answers/evaluations
        questions.forEach((q, idx) => {
            if (q.userAnswer) {
                answers[q.id] = q.userAnswer;
            }
            if (q.score !== null && q.score !== undefined) {
                evaluations[q.id] = {
                    score: q.score,
                    aiFeedback: q.aiFeedback || ''
                };
            }
        });

        // Jump to first unanswered question
        const firstUnanswered = questions.findIndex(q => !evaluations[q.id]);
        currentIndex = firstUnanswered !== -1 ? firstUnanswered : 0;

        displayQuestion(currentIndex);
        showView('session');

        // If all were already answered
        checkAllAnswered();

    } catch (error) {
        console.error('Failed to load session:', error);
        showView('error');
    }
}

// ── Render Session Meta ─────────────────────────────────────────────
function renderSessionMeta(data) {
    const skill = data.skill || 'General';
    const difficulty = data.difficulty || 'Medium';

    topbarSubtitle.textContent = `${skill} • ${difficulty} Track`;

    const diffClass = `badge-difficulty-${difficulty.toLowerCase()}`;
    sessionMeta.innerHTML = `
        <span class="session-badge badge-skill">
            <i class="bi bi-code-slash"></i> ${escapeHtml(skill)}
        </span>
        <span class="session-badge ${diffClass}">
            <i class="bi bi-bar-chart-line-fill"></i> ${escapeHtml(difficulty)}
        </span>
    `;
}

// ── Render Question Dots ────────────────────────────────────────────
function renderQuestionDots() {
    questionDots.innerHTML = '';

    questions.forEach((q, idx) => {
        const dot = document.createElement('button');
        dot.className = 'q-dot';
        dot.textContent = idx + 1;
        dot.setAttribute('aria-label', `Go to question ${idx + 1}`);

        if (idx === currentIndex) dot.classList.add('active');
        if (evaluations[q.id]) dot.classList.add('answered');

        dot.addEventListener('click', () => {
            saveCurrentAnswer();
            displayQuestion(idx);
        });

        questionDots.appendChild(dot);
    });
}

function updateQuestionDots() {
    const dots = questionDots.querySelectorAll('.q-dot');
    dots.forEach((dot, idx) => {
        const q = questions[idx];
        dot.classList.remove('active', 'answered');

        if (idx === currentIndex) dot.classList.add('active');
        if (q && evaluations[q.id]) dot.classList.add('answered');
    });
}

// ── Display Question ────────────────────────────────────────────────
function displayQuestion(index) {
    if (index < 0 || index >= questions.length) return;

    currentIndex = index;
    const q = questions[index];

    questionBadge.textContent = index + 1;
    questionCurrent.textContent = index + 1;
    questionTotal.textContent = questions.length;
    questionText.textContent = q.questionText || q.question || '';

    // Restore answer
    answerTextarea.value = answers[q.id] || '';
    updateCharCount();

    // Evaluation feedback state
    const evalData = evaluations[q.id];
    if (evalData) {
        displayEvaluation(evalData);
        answerTextarea.disabled = true;
        submitAnswerBtn.disabled = true;
        submitAnswerBtn.classList.add('d-none');
    } else {
        hideEvaluation();
        answerTextarea.disabled = false;
        submitAnswerBtn.disabled = false;
        submitAnswerBtn.classList.remove('d-none');
    }

    // Update Navigation Buttons
    prevBtn.disabled = (currentIndex === 0);
    
    if (currentIndex === questions.length - 1) {
        nextBtn.innerHTML = 'Finish <i class="bi bi-check2-all ms-1"></i>';
    } else {
        nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right ms-1"></i>';
    }

    updateQuestionDots();
    initCardSpotlights();
}

// ── Evaluation Display ──────────────────────────────────────────────
function displayEvaluation(evaluation) {
    const score = evaluation.score || 0;
    const feedback = evaluation.aiFeedback || evaluation.feedback || 'No feedback provided.';

    evalScoreBadge.textContent = `${score}%`;
    evalScoreBadge.className = 'eval-score-badge';

    if (score >= 70) {
        evalScoreBadge.classList.add('score-high');
    } else if (score >= 45) {
        evalScoreBadge.classList.add('score-mid');
    } else {
        evalScoreBadge.classList.add('score-low');
    }

    evalFeedback.textContent = feedback;
    evaluationPanel.classList.remove('d-none');
}

function hideEvaluation() {
    evaluationPanel.classList.add('d-none');
    evalScoreBadge.textContent = '0%';
    evalFeedback.textContent = '';
}

// ── Save Answer in Memory ───────────────────────────────────────────
function saveCurrentAnswer() {
    const q = questions[currentIndex];
    if (q) {
        answers[q.id] = answerTextarea.value;
    }
}

// ── Check All Questions Answered ────────────────────────────────────
function checkAllAnswered() {
    const allAnswered = questions.every(q => evaluations[q.id]);
    if (allAnswered && questions.length > 0) {
        setTimeout(() => {
            finishSession();
        }, 1200);
    }
}

// ── Navigation ──────────────────────────────────────────────────────
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
    } else {
        checkAllAnswered();
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

    timerDisplay.classList.remove('warning', 'danger');
    if (remainingSeconds <= 120) {
        timerDisplay.classList.add('danger');
    } else if (remainingSeconds <= 300) {
        timerDisplay.classList.add('warning');
    }
}

function handleTimeUp() {
    showAlert('⏱ Time is up! Your interview simulation has completed.', 'warning');

    answerTextarea.disabled = true;
    submitAnswerBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    setTimeout(() => {
        finishSession();
    }, 2000);
}

// ── Finish Session ──────────────────────────────────────────────────
function finishSession() {
    clearInterval(timerInterval);

    const answered = questions.filter(q => evaluations[q.id]).length;
    const total = questions.length;

    let avgScore = 0;
    const scores = Object.values(evaluations).map(e => e.score || 0);
    if (scores.length > 0) {
        avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    completeSubtitle.textContent = `You answered ${answered} of ${total} questions with an overall score of ${avgScore}%.`;

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

// ── Character Counter ───────────────────────────────────────────────
function updateCharCount() {
    charCount.textContent = answerTextarea.value.length;
}

// ── Alert Display ───────────────────────────────────────────────────
function showAlert(message, type = 'danger') {
    if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
        Toast.show(message, type);
    }
}

// ── Utility ─────────────────────────────────────────────────────────
function getSessionIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
