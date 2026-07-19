/**
 * ═══════════════════════════════════════════════════════════════════
 * CODING SESSION PAGE — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

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
        alert('Invalid session ID');
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

    // Anti-cheat: Disable Copy/Paste globally
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        alert("Copying is disabled during the mock test.");
    });
    document.addEventListener('paste', (e) => {
        e.preventDefault();
        alert("Pasting is disabled during the mock test.");
    });
    document.addEventListener('cut', (e) => {
        e.preventDefault();
    });

    // Initialize Monaco
    initMonaco();
});

function initMonaco() {
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: "// Loading...",
            language: 'java',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            padding: { top: 16 }
        });
        
        // Save code on change
        editor.onDidChangeModelContent(() => {
            if (sessionData && sessionData.codingQuestions && sessionData.codingQuestions[currentQuestionIndex]) {
                const qId = sessionData.codingQuestions[currentQuestionIndex].id;
                userCodeMap[qId] = editor.getValue();
            }
        });
    });
}

async function startTest() {
    try {
        await enterFullScreen();
        startScreen.classList.add('d-none');
        
        // Fetch session details
        sessionData = await API.getCodingSessionDetails(sessionId);
        sessionDomain.textContent = sessionData.domain;
        
        if (!sessionData.codingQuestions || sessionData.codingQuestions.length === 0) {
            alert('Failed to load questions.');
            return;
        }

        // Initialize user code map
        sessionData.codingQuestions.forEach(q => {
            userCodeMap[q.id] = q.baseCode || `// Write your ${languageSelect.value} code here\n`;
        });

        // Initialize Monaco if needed or update language
        if (editor) {
            editor.setValue(userCodeMap[sessionData.codingQuestions[0].id]);
        }

        questionLoading.classList.add('d-none');
        questionContent.classList.remove('d-none');
        questionContent.classList.add('d-flex');

        startTimer(3 * 60 * 60); // 3 hours
        navigateToQuestion(0);

    } catch (err) {
        console.error(err);
        alert('Could not start test. Please try again.');
    }
}

// ── Anti-Cheat (Full Screen) ──────────────────────────────────────
async function enterFullScreen() {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
        await docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
        await docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
        await docElm.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        await docElm.msRequestFullscreen();
    }
}

function handleFullScreenChange() {
    if (startScreen.classList.contains('d-none') && !isSubmitting) {
        const isFullScreen = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;

        if (!isFullScreen) {
            // User exited full screen
            warningCount++;
            warningBadge.classList.remove('d-none');
            warningCountText.textContent = warningCount;
            
            if (warningCount >= MAX_WARNINGS) {
                alert(`You have exceeded the maximum number of warnings (${MAX_WARNINGS}). The test will now submit automatically.`);
                submitTest();
            } else {
                modalWarningCount.textContent = warningCount;
                warningModal.show();
            }
        } else {
            // User entered full screen again
            warningModal.hide();
        }
    }
}

// ── Navigation ────────────────────────────────────────────────────
function navigateToQuestion(index) {
    if (index < 0 || index >= sessionData.codingQuestions.length) return;
    
    currentQuestionIndex = index;
    const q = sessionData.codingQuestions[currentQuestionIndex];
    
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${sessionData.codingQuestions.length}`;
    questionTitle.textContent = q.title;
    questionDescription.innerText = q.description; // Using innerText to preserve line breaks
    
    // Update difficulty pill
    questionDifficulty.textContent = q.difficulty;
    questionDifficulty.className = 'question-difficulty';
    if (q.difficulty === 'EASY') questionDifficulty.classList.add('difficulty-easy');
    else if (q.difficulty === 'MEDIUM') questionDifficulty.classList.add('difficulty-medium');
    else if (q.difficulty === 'HARD') questionDifficulty.classList.add('difficulty-hard');

    // Load code
    if (editor) {
        editor.setValue(userCodeMap[q.id]);
    }

    // Buttons
    prevBtn.disabled = (currentQuestionIndex === 0);
    if (currentQuestionIndex === sessionData.codingQuestions.length - 1) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
    
    // Reset console & Render built-in test cases
    document.getElementById('customInput').value = '';
    renderTestCases(q);
    tabTestCases.click();
}

function renderTestCases(q) {
    const container = document.getElementById('builtInTestCases');
    container.innerHTML = '';
    
    if (q.testCasesJson && q.testCasesJson !== '[]') {
        try {
            const tcs = JSON.parse(q.testCasesJson);
            
            const btnGroup = document.createElement('div');
            btnGroup.className = 'd-flex flex-wrap gap-2 mb-3';
            
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'p-3 rounded border border-secondary d-none';
            detailsContainer.style.backgroundColor = 'rgba(0,0,0,0.2)';
            
            tcs.forEach((tc, idx) => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-outline-primary';
                btn.textContent = `Test Case ${idx + 1}`;
                btn.onclick = () => {
                    Array.from(btnGroup.children).forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    
                    detailsContainer.classList.remove('d-none');
                    detailsContainer.innerHTML = `
                        <div class="mb-2"><span class="text-secondary small fw-bold">INPUT:</span><br><code class="text-light">${tc.input}</code></div>
                        <div><span class="text-secondary small fw-bold">EXPECTED OUTPUT:</span><br><code class="text-success">${tc.expectedOutput}</code></div>
                    `;
                    
                    document.getElementById('customInput').value = tc.input;
                };
                btnGroup.appendChild(btn);
            });
            
            container.appendChild(btnGroup);
            container.appendChild(detailsContainer);
        } catch (e) {
            console.error('Failed to parse test cases', e);
        }
    }
}

// ── Run & Submit Single Question ──────────────────────────────────
async function handleRunCode() {
    const qId = sessionData.codingQuestions[currentQuestionIndex].id;
    const code = editor.getValue();
    const input = document.getElementById('customInput').value;
    
    tabOutput.click();
    document.getElementById('runStatus').innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Running Code Simulation...';
    document.getElementById('runOutput').textContent = '';
    runBtn.disabled = true;

    try {
        const result = await API.runCode(sessionId, qId, code, languageSelect.value, input);
        if (result.error) {
            document.getElementById('runStatus').innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Execution Error</span>';
            document.getElementById('runOutput').className = 'console-output console-error';
            document.getElementById('runOutput').textContent = result.error;
        } else {
            document.getElementById('runStatus').innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Execution Successful</span>';
            document.getElementById('runOutput').className = 'console-output';
            document.getElementById('runOutput').textContent = result.output || 'No output.';
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
    submitQuestionBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
    
    try {
        await API.submitCodingAnswer(sessionId, qId, code, languageSelect.value);
        submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Submitted Successfully';
        submitQuestionBtn.classList.replace('btn-success', 'btn-secondary');
        
        sessionData.codingQuestions[currentQuestionIndex].isSubmitted = true;
        
        setTimeout(() => {
            submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Submit Question';
            submitQuestionBtn.classList.replace('btn-secondary', 'btn-success');
            submitQuestionBtn.disabled = false;
        }, 3000);
    } catch (e) {
        alert('Failed to submit question. Please try again.');
        submitQuestionBtn.disabled = false;
        submitQuestionBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Submit Question';
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

        if (timer <= 300) { // last 5 minutes
            timerBox.classList.add('warning');
        }

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting test...');
            submitTest();
        }
    }, 1000);
}

// ── Submission ────────────────────────────────────────────────────
function confirmSubmit() {
    if (confirm('Are you sure you want to submit your test early? You cannot undo this action.')) {
        submitTest();
    }
}

async function submitTest() {
    if (isSubmitting) return;
    isSubmitting = true;
    clearInterval(timerInterval);
    
    submitTestBtn.disabled = true;
    submitTestBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

    try {
        // Exit full screen gracefully before redirect
        if (document.exitFullscreen) {
            await document.exitFullscreen().catch(e => console.log('Exit FS ignored', e));
        }
        
        // 1. Submit any questions that haven't been submitted yet
        for (const q of sessionData.codingQuestions) {
            if (!q.isSubmitted) {
                const code = userCodeMap[q.id];
                await API.submitCodingAnswer(sessionId, q.id, code, languageSelect.value);
            }
        }

        // 2. Finish session
        await API.finishCodingSession(sessionId, warningCount);

        // 3. Redirect to results
        window.location.href = `coding-results.html?id=${sessionId}`;
    } catch (err) {
        console.error('Submission failed:', err);
        alert('Failed to submit test properly. Please contact support.');
        submitTestBtn.disabled = false;
        submitTestBtn.innerHTML = 'Submit Test';
        isSubmitting = false;
    }
}
