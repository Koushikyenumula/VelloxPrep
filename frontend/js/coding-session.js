/**
 * ═══════════════════════════════════════════════════════════════════
 *  MOCK CODING TEST SESSION - Controller & Monaco IDE Integration
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

// ── Variables & State ─────────────────────────────────────────────
let sessionId = new URLSearchParams(window.location.search).get('id');
let sessionData = null;
let currentQuestionIndex = 0;
let editor = null;
let warningCount = 0;
const MAX_WARNINGS = 3;
let timerInterval = null;
let isSubmitting = false;

// We'll store user's code keyed by question ID
let userCodeMap = {};

// ── DOM Elements ──────────────────────────────────────────────────
const startScreen = document.getElementById('startScreen');
const startTestBtn = document.getElementById('startTestBtn');
const warningModal = new bootstrap.Modal(document.getElementById('warningModal'));
const modalWarningCount = document.getElementById('modalWarningCount');
const returnFullScreenBtn = document.getElementById('returnFullScreenBtn');

const questionLoading = document.getElementById('questionLoading');
const questionContent = document.getElementById('questionContent');

const questionTitle = document.getElementById('questionTitle');
const questionDifficulty = document.getElementById('questionDifficulty');
const questionDescription = document.getElementById('questionDescription');
const questionCounter = document.getElementById('questionCounter');

const languageSelect = document.getElementById('languageSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitTestBtn = document.getElementById('submitTestBtn');

const timerText = document.getElementById('timerText');
const timerBox = document.getElementById('timerBox');
const warningBadge = document.getElementById('warningBadge');
const warningCountText = document.getElementById('warningCountText');
const sessionDomain = document.getElementById('sessionDomain');

// Console Elements
const tabTestCases = document.getElementById('tabTestCases');
const tabOutput = document.getElementById('tabOutput');
const viewTestCases = document.getElementById('viewTestCases');
const viewOutput = document.getElementById('viewOutput');
const runBtn = document.getElementById('runBtn');
const submitQuestionBtn = document.getElementById('submitQuestionBtn');

// ── Initialization ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }
    if (!sessionId) {
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Invalid session ID', 'danger');
        }
        window.location.href = 'dashboard.html';
        return;
    }

    startTestBtn.addEventListener('click', startTest);
    returnFullScreenBtn.addEventListener('click', enterFullScreen);
    
    prevBtn.addEventListener('click', () => navigateToQuestion(currentQuestionIndex - 1));
    nextBtn.addEventListener('click', () => navigateToQuestion(currentQuestionIndex + 1));
    submitTestBtn.addEventListener('click', confirmSubmit);

    languageSelect.addEventListener('change', () => {
        if (editor) {
            monaco.editor.setModelLanguage(editor.getModel(), languageSelect.value);
        }
    });

    // Handle full screen exit
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    // Console Tabs
    tabTestCases.addEventListener('click', () => {
        tabTestCases.classList.add('active');
        tabOutput.classList.remove('active');
        viewTestCases.classList.remove('d-none');
        viewOutput.classList.add('d-none');
    });
    tabOutput.addEventListener('click', () => {
        tabOutput.classList.add('active');
        tabTestCases.classList.remove('active');
        viewOutput.classList.remove('d-none');
        viewTestCases.classList.add('d-none');
    });

    runBtn.addEventListener('click', handleRunCode);
    submitQuestionBtn.addEventListener('click', handleSubmitQuestion);

    // Fetch Session Data
    await loadSession();

    // Initialize Monaco Editor
    initMonaco();
});

// ── Full Screen Anti-Cheat ─────────────────────────────────────────
function startTest() {
    enterFullScreen();
    startScreen.classList.add('d-none');
    startTimer(3 * 60 * 60); // 3 hours
}

function enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
    warningModal.hide();
}

function handleFullScreenChange() {
    const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    
    // If we're not in full screen, and test is currently running
    if (!isFS && !startScreen.classList.contains('d-none') === false && !isSubmitting) {
        triggerAntiCheatWarning();
    }
}

function triggerAntiCheatWarning() {
    warningCount++;
    warningBadge.classList.remove('d-none');
    warningCountText.textContent = warningCount;

    if (warningCount >= MAX_WARNINGS) {
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Max anti-cheat warnings exceeded! Auto-submitting test…', 'danger');
        }
        submitTest();
    } else {
        modalWarningCount.textContent = warningCount;
        warningModal.show();
    }
}

// ── Monaco Initialization ─────────────────────────────────────────
function initMonaco() {
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: '// Loading template code...',
            language: languageSelect.value,
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            roundedSelection: true,
            padding: { top: 12 }
        });

        // Save code changes in state map
        editor.onDidChangeModelContent(() => {
            if (sessionData && sessionData.codingQuestions && sessionData.codingQuestions[currentQuestionIndex]) {
                const qId = sessionData.codingQuestions[currentQuestionIndex].id;
                userCodeMap[qId] = editor.getValue();
            }
        });

        if (sessionData && sessionData.codingQuestions && sessionData.codingQuestions.length > 0) {
            renderCurrentQuestion();
        }
    });
}

// ── Load Session Details ──────────────────────────────────────────
async function loadSession() {
    try {
        sessionData = await API.getCodingSessionDetails(sessionId);
        const rawDomain = sessionData.domain || 'Coding Assessment';
        sessionDomain.textContent = rawDomain.includes('(') ? rawDomain.split('(')[0].trim() : rawDomain;

        if (!sessionData.codingQuestions || sessionData.codingQuestions.length === 0) {
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('No questions found for this session.', 'danger');
            }
            return;
        }

        // Initialize code map with templates or blank
        sessionData.codingQuestions.forEach(q => {
            userCodeMap[q.id] = q.starterCode || `// Write your ${languageSelect.value} solution for "${q.title}" below\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`;
        });

        questionLoading.classList.add('d-none');
        questionContent.classList.remove('d-none');

        if (editor) {
            editor.setValue(userCodeMap[sessionData.codingQuestions[0].id]);
            renderCurrentQuestion();
        }

    } catch (err) {
        console.error('Failed to load session:', err);
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Failed to fetch coding session. Please try again.', 'danger');
        }
    }
}

// ── Render Question ───────────────────────────────────────────────
function renderCurrentQuestion() {
    if (!sessionData || !sessionData.codingQuestions) return;
    
    const q = sessionData.codingQuestions[currentQuestionIndex];
    questionTitle.textContent = q.title;
    questionDifficulty.textContent = q.difficulty;
    
    questionDifficulty.className = 'session-badge';
    if (q.difficulty === 'EASY') questionDifficulty.classList.add('badge-difficulty-easy');
    else if (q.difficulty === 'MEDIUM') questionDifficulty.classList.add('badge-difficulty-medium');
    else questionDifficulty.classList.add('badge-difficulty-hard');

    questionDescription.innerHTML = q.description;
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${sessionData.codingQuestions.length}`;

    // Render test cases tab
    renderTestCases(q);

    // Update buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === sessionData.codingQuestions.length - 1;

    // Load saved code for this question
    if (editor) {
        editor.setValue(userCodeMap[q.id]);
    }
}

function renderTestCases(q) {
    const container = document.getElementById('builtInTestCases');
    container.innerHTML = '';
    
    if (q.testCases && q.testCases.length > 0) {
        q.testCases.forEach((tc, idx) => {
            if (tc.isHidden) return; // don't show hidden test cases
            container.innerHTML += `
                <div class="test-case-item">
                    <div class="d-flex justify-content-between text-secondary small mb-1">
                        <span>Case ${idx + 1}</span>
                    </div>
                    <div class="small"><strong>Input:</strong> <code>${escapeHtml(tc.input)}</code></div>
                    <div class="small"><strong>Expected:</strong> <code>${escapeHtml(tc.expectedOutput)}</code></div>
                </div>
            `;
        });
    } else {
        container.innerHTML = '<p class="text-secondary small">No sample test cases provided. Use custom stdin below.</p>';
    }
}

function navigateToQuestion(index) {
    if (index < 0 || index >= sessionData.codingQuestions.length) return;
    
    currentQuestionIndex = index;
    renderCurrentQuestion();
}

// ── Run & Submit Single Question ──────────────────────────────────
async function handleRunCode() {
    const qId = sessionData.codingQuestions[currentQuestionIndex].id;
    const code = editor.getValue();
    const input = document.getElementById('customInput').value;
    
    tabOutput.click();
    document.getElementById('runStatus').innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Compiling & Executing…';
    document.getElementById('runOutput').textContent = '';
    runBtn.disabled = true;

    try {
        const result = await API.runCode(sessionId, qId, code, languageSelect.value, input);
        if (result.error) {
            document.getElementById('runStatus').innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Execution Error</span>';
            document.getElementById('runOutput').className = 'console-output text-danger';
            document.getElementById('runOutput').textContent = result.error;
        } else {
            document.getElementById('runStatus').innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Execution Successful</span>';
            document.getElementById('runOutput').className = 'console-output text-success';
            document.getElementById('runOutput').textContent = result.output || 'Process returned 0 with no stdout.';
        }
    } catch (e) {
        document.getElementById('runStatus').innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Simulation Failed</span>';
        document.getElementById('runOutput').textContent = e.message;
    } finally {
        runBtn.disabled = false;
    }
}

async function handleSubmitQuestion() {
    const qId = sessionData.codingQuestions[currentQuestionIndex].id;
    const code = editor.getValue();
    
    submitQuestionBtn.disabled = true;
    submitQuestionBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Evaluating…';
    
    try {
        await API.submitCodingAnswer(sessionId, qId, code, languageSelect.value);
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Question solution submitted!', 'success');
        }
        
        sessionData.codingQuestions[currentQuestionIndex].isSubmitted = true;
        
        submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Submitted';
        setTimeout(() => {
            submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Submit Question';
            submitQuestionBtn.disabled = false;
        }, 2000);
    } catch (e) {
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Failed to submit question. Please retry.', 'danger');
        }
        submitQuestionBtn.disabled = false;
        submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Submit Question';
    }
}

// ── Timer ─────────────────────────────────────────────────────────
function startTimer(durationInSeconds) {
    let timer = durationInSeconds;
    
    timerInterval = setInterval(() => {
        const h = Math.floor(timer / 3600);
        const m = Math.floor((timer % 3600) / 60);
        const s = timer % 60;

        timerText.textContent = 
            String(h).padStart(2, '0') + ':' + 
            String(m).padStart(2, '0') + ':' + 
            String(s).padStart(2, '0');

        if (timer <= 300) {
            timerBox.classList.add('warning');
        }

        if (--timer < 0) {
            clearInterval(timerInterval);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Time is up! Submitting test…', 'warning');
            }
            submitTest();
        }
    }, 1000);
}

// ── Submission ────────────────────────────────────────────────────
function confirmSubmit() {
    if (confirm('Are you sure you want to end your coding test early? Your solutions will be finalized by AI.')) {
        submitTest();
    }
}

async function submitTest() {
    if (isSubmitting) return;
    isSubmitting = true;
    clearInterval(timerInterval);
    
    submitTestBtn.disabled = true;
    submitTestBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Finalizing…';

    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen().catch(e => console.log('Exit FS ignored', e));
        }
        
        for (const q of sessionData.codingQuestions) {
            if (!q.isSubmitted) {
                const code = userCodeMap[q.id];
                await API.submitCodingAnswer(sessionId, q.id, code, languageSelect.value);
            }
        }

        await API.finishCodingSession(sessionId, warningCount);
        window.location.href = `coding-results.html?id=${sessionId}`;
    } catch (err) {
        console.error('Submission failed:', err);
        if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
            Toast.show('Submission failed. Please check your network connection.', 'danger');
        }
        submitTestBtn.disabled = false;
        submitTestBtn.innerHTML = 'End Test';
        isSubmitting = false;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
