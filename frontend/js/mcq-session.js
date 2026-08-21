/**
 * ═══════════════════════════════════════════════════════════════════
 *  MCQ SESSION — Controller & Interactive Evaluation Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM References ──────────────────────────────────────────────────
    const DOM = {
        canvas:            document.getElementById('aiNetworkCanvas'),
        cursorGlow:        document.getElementById('cursorGlow'),
        themeToggleBtn:    document.getElementById('themeToggleBtn'),
        themeToggleIcon:   document.getElementById('themeToggleIcon'),
        timerDisplay:      document.getElementById('timerDisplay'),
        timerValue:        document.getElementById('timerValue'),

        topbarSubtitle:    document.getElementById('topbarSubtitle'),
        sessionMeta:       document.getElementById('sessionMeta'),
        questionDots:      document.getElementById('questionDots'),
        progressCount:     document.getElementById('progressCount'),
        progressFill:      document.getElementById('progressFill'),

        questionCard:      document.getElementById('questionCard'),
        questionBadge:     document.getElementById('questionBadge'),
        questionCurrent:   document.getElementById('questionCurrent'),
        questionTotal:     document.getElementById('questionTotal'),
        questionText:      document.getElementById('questionText'),

        optionAText:       document.getElementById('optionAText'),
        optionBText:       document.getElementById('optionBText'),
        optionCText:       document.getElementById('optionCText'),
        optionDText:       document.getElementById('optionDText'),

        optionABox:        document.getElementById('optionABox'),
        optionBBox:        document.getElementById('optionBBox'),
        optionCBox:        document.getElementById('optionCBox'),
        optionDBox:        document.getElementById('optionDBox'),

        mcqOptions:        document.querySelectorAll('input[name="mcqOption"]'),

        prevBtn:           document.getElementById('prevBtn'),
        nextBtn:           document.getElementById('nextBtn'),
        submitAnswerBtn:   document.getElementById('submitAnswerBtn'),
        submitBtnText:     document.getElementById('submitBtnText'),
        submitBtnLoader:   document.getElementById('submitBtnLoader'),

        evaluationPanel:   document.getElementById('evaluationPanel'),
        evalScoreBadge:    document.getElementById('evalScoreBadge'),
        evalFeedback:      document.getElementById('evalFeedback'),

        loadingSkeleton:   document.getElementById('loadingSkeleton'),
        sessionContent:    document.getElementById('sessionContent'),
        sessionComplete:   document.getElementById('sessionComplete'),
        errorState:        document.getElementById('errorState'),
        completeSubtitle:  document.getElementById('completeSubtitle'),
        viewResultsBtn:    document.getElementById('viewResultsBtn')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark',
        currentSessionId: null,
        currentSession: null,
        questions: [],
        currentQuestionIndex: 0,
        timerSecondsRemaining: 30 * 60,
        timerInterval: null
    };

    // ── Initialization ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Auth Guard
        const token = (typeof Auth !== 'undefined' && typeof Auth.getToken === 'function') 
            ? Auth.getToken() 
            : localStorage.getItem('token');

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // 2. Common Sidebar
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

        // 4. Parse Session ID
        const urlParams = new URLSearchParams(window.location.search);
        State.currentSessionId = urlParams.get('id');

        if (!State.currentSessionId) {
            showErrorState();
            return;
        }

        // 5. Bind Interactive Events
        bindEvents();

        // 6. Load Session
        loadSession();
    });

    // ═══════════════════════════════════════════════════════════════════
    // 1. THEME ENGINE & SYNCHRONIZATION
    // ═══════════════════════════════════════════════════════════════════
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);

        if (DOM.themeToggleBtn) {
            DOM.themeToggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                applyTheme(next);
            });
        }
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-sun-fill';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-moon-stars';
        }
        localStorage.setItem('theme', theme);
        State.currentTheme = theme;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. ATMOSPHERIC NEURAL NETWORK CANVAS
    // ═══════════════════════════════════════════════════════════════════
    function initCanvasNetwork() {
        const canvas = DOM.canvas;
        if (!canvas || State.isReducedMotion) return;

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

            // Synaptic Pulses
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
        const glow = DOM.cursorGlow;
        if (!glow || State.isReducedMotion || window.innerWidth < 1024) return;

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
                glow.style.opacity = '1';
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            isVisible = false;
            glow.style.opacity = '0';
        });

        function updateGlow() {
            glowX += (targetX - glowX) * 0.12;
            glowY += (targetY - glowY) * 0.12;
            glow.style.left = `${glowX}px`;
            glow.style.top  = `${glowY}px`;
            requestAnimationFrame(updateGlow);
        }
        requestAnimationFrame(updateGlow);
    }

    // ── Interactive Card Mouse Follower Spotlight ───────────────────────
    function initCardSpotlights() {
        if (State.isReducedMotion || window.innerWidth < 992) return;

        const cards = document.querySelectorAll('.question-card, .glass-panel, .mcq-option-box');
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

    // ── Session Countdown Timer ─────────────────────────────────────────
    function startTimer(durationMinutes = 20) {
        if (State.timerInterval) clearInterval(State.timerInterval);
        State.timerSecondsRemaining = durationMinutes * 60;

        updateTimerDisplay();

        State.timerInterval = setInterval(() => {
            State.timerSecondsRemaining--;

            if (State.timerSecondsRemaining <= 0) {
                clearInterval(State.timerInterval);
                State.timerSecondsRemaining = 0;
                updateTimerDisplay();
                if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                    Toast.show('Time expired! Auto-evaluating session…', 'warning');
                }
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        if (!DOM.timerValue || !DOM.timerDisplay) return;

        const minutes = Math.floor(State.timerSecondsRemaining / 60);
        const seconds = State.timerSecondsRemaining % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        DOM.timerValue.textContent = formatted;

        if (State.timerSecondsRemaining <= 180) {
            DOM.timerDisplay.className = 'timer-display danger';
        } else if (State.timerSecondsRemaining <= 300) {
            DOM.timerDisplay.className = 'timer-display warning';
        } else {
            DOM.timerDisplay.className = 'timer-display';
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════════
    function bindEvents() {
        if (DOM.prevBtn) DOM.prevBtn.addEventListener('click', goPrev);
        if (DOM.nextBtn) DOM.nextBtn.addEventListener('click', goNext);
        if (DOM.submitAnswerBtn) DOM.submitAnswerBtn.addEventListener('click', submitAnswer);

        if (DOM.viewResultsBtn) {
            DOM.viewResultsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                State.currentQuestionIndex = 0;
                showSessionContent();
                renderCurrentQuestion();
            });
        }

        DOM.mcqOptions.forEach(radio => {
            radio.addEventListener('change', () => {
                const q = State.questions[State.currentQuestionIndex];
                if (q && !q.userSelectedOption && DOM.submitAnswerBtn) {
                    DOM.submitAnswerBtn.disabled = false;
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. LOAD & RENDER SESSION
    // ═══════════════════════════════════════════════════════════════════
    async function loadSession() {
        showLoading();

        try {
            State.currentSession = await API.getMcqSession(State.currentSessionId);
            State.questions = State.currentSession.questions || [];

            if (State.questions.length === 0) {
                throw new Error("No questions found in this session.");
            }

            renderSessionMeta();
            renderQuestionDots();
            updateProgress();

            if (State.currentSession.status === 'COMPLETED') {
                showSessionComplete();
            } else {
                startTimer(State.questions.length * 3); // 3 mins per question
                
                // Find first unanswered question
                let firstUnanswered = State.questions.findIndex(q => !q.userSelectedOption);
                State.currentQuestionIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
                
                showSessionContent();
                renderCurrentQuestion();
            }

        } catch (error) {
            console.error('Load session error:', error);
            showErrorState();
        }
    }

    function renderSessionMeta() {
        if (DOM.topbarSubtitle) {
            DOM.topbarSubtitle.textContent = `${State.currentSession.skill} • ${State.currentSession.difficulty} Track`;
        }

        if (DOM.sessionMeta) {
            DOM.sessionMeta.innerHTML = `
                <span class="session-badge badge-skill">
                    <i class="bi bi-code-slash"></i> ${escapeHtml(State.currentSession.skill)}
                </span>
                <span class="session-badge badge-difficulty-${State.currentSession.difficulty.toLowerCase()}">
                    <i class="bi bi-bar-chart-line-fill"></i> ${escapeHtml(State.currentSession.difficulty)}
                </span>
            `;
        }
    }

    function renderQuestionDots() {
        if (!DOM.questionDots) return;
        DOM.questionDots.innerHTML = '';

        State.questions.forEach((q, index) => {
            const dot = document.createElement('button');
            dot.className = 'q-dot';
            dot.textContent = index + 1;
            
            if (q.userSelectedOption) dot.classList.add('answered');
            if (index === State.currentQuestionIndex) dot.classList.add('active');

            dot.addEventListener('click', () => {
                State.currentQuestionIndex = index;
                renderCurrentQuestion();
                updateDots();
            });
            
            DOM.questionDots.appendChild(dot);
        });
    }

    function updateDots() {
        if (!DOM.questionDots) return;
        const dots = DOM.questionDots.querySelectorAll('.q-dot');
        dots.forEach((dot, idx) => {
            dot.classList.remove('active');
            if (idx === State.currentQuestionIndex) dot.classList.add('active');
            
            if (State.questions[idx].userSelectedOption) {
                dot.classList.add('answered');
            } else {
                dot.classList.remove('answered');
            }
        });
    }

    function updateProgress() {
        const answeredCount = State.questions.filter(q => q.userSelectedOption).length;
        const total = State.questions.length;
        const percentage = total > 0 ? (answeredCount / total) * 100 : 0;

        if (DOM.progressCount) DOM.progressCount.textContent = `${answeredCount} / ${total} answered`;
        if (DOM.progressFill) DOM.progressFill.style.width = `${percentage}%`;
    }

    // ── Navigation ──────────────────────────────────────────────────────
    function goPrev() {
        if (State.currentQuestionIndex > 0) {
            State.currentQuestionIndex--;
            renderCurrentQuestion();
            updateDots();
        }
    }

    function goNext() {
        if (State.currentQuestionIndex < State.questions.length - 1) {
            State.currentQuestionIndex++;
            renderCurrentQuestion();
            updateDots();
        } else {
            const allAnswered = State.questions.every(q => q.userSelectedOption);
            if (allAnswered) {
                window.location.reload();
            }
        }
    }

    // ── Render Question ─────────────────────────────────────────────────
    function renderCurrentQuestion() {
        const q = State.questions[State.currentQuestionIndex];
        if (!q) return;

        if (DOM.questionBadge)   DOM.questionBadge.textContent = State.currentQuestionIndex + 1;
        if (DOM.questionCurrent) DOM.questionCurrent.textContent = State.currentQuestionIndex + 1;
        if (DOM.questionTotal)   DOM.questionTotal.textContent = State.questions.length;
        
        if (DOM.questionText)    DOM.questionText.textContent = q.question;

        if (DOM.optionAText) DOM.optionAText.textContent = q.optionA;
        if (DOM.optionBText) DOM.optionBText.textContent = q.optionB;
        if (DOM.optionCText) DOM.optionCText.textContent = q.optionC;
        if (DOM.optionDText) DOM.optionDText.textContent = q.optionD;

        // Reset Options state
        DOM.mcqOptions.forEach(radio => {
            radio.checked = false;
            radio.disabled = false;
        });

        [DOM.optionABox, DOM.optionBBox, DOM.optionCBox, DOM.optionDBox].forEach(box => {
            if (box) {
                box.classList.remove('option-correct', 'option-incorrect');
            }
        });
        
        if (DOM.evaluationPanel) DOM.evaluationPanel.classList.add('d-none');
        
        // If already answered
        if (q.userSelectedOption) {
            const selectedRadio = document.querySelector(`input[name="mcqOption"][value="${q.userSelectedOption}"]`);
            if (selectedRadio) selectedRadio.checked = true;

            DOM.mcqOptions.forEach(radio => { radio.disabled = true; });

            highlightOptions(q.userSelectedOption, q.correctOption);
            showEvaluation(q.correctOption === q.userSelectedOption, q.explanation);

            if (DOM.submitAnswerBtn) DOM.submitAnswerBtn.style.display = 'none';
        } else {
            if (DOM.submitAnswerBtn) {
                DOM.submitAnswerBtn.style.display = 'inline-flex';
                DOM.submitAnswerBtn.disabled = true;
            }
        }

        // Nav buttons state
        if (DOM.prevBtn) DOM.prevBtn.disabled = State.currentQuestionIndex === 0;
        
        if (DOM.nextBtn) {
            if (State.currentQuestionIndex === State.questions.length - 1) {
                DOM.nextBtn.innerHTML = 'Finish <i class="bi bi-check2-all ms-1"></i>';
                DOM.nextBtn.classList.add('btn-finish');
            } else {
                DOM.nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right ms-1"></i>';
                DOM.nextBtn.classList.remove('btn-finish');
            }
            DOM.nextBtn.disabled = false;
        }

        initCardSpotlights();
    }

    function highlightOptions(userSelected, correct) {
        DOM.mcqOptions.forEach(radio => {
            const box = radio.nextElementSibling;
            if (!box) return;

            if (radio.value === correct) {
                box.classList.add('option-correct');
            } else if (radio.value === userSelected && userSelected !== correct) {
                box.classList.add('option-incorrect');
            }
        });
    }

    function showEvaluation(isCorrect, explanation) {
        if (!DOM.evaluationPanel) return;
        DOM.evaluationPanel.classList.remove('d-none');
        
        if (DOM.evalScoreBadge) {
            if (isCorrect) {
                DOM.evalScoreBadge.textContent = 'Correct';
                DOM.evalScoreBadge.className = 'eval-score-badge score-correct';
            } else {
                DOM.evalScoreBadge.textContent = 'Incorrect';
                DOM.evalScoreBadge.className = 'eval-score-badge score-incorrect';
            }
        }

        if (DOM.evalFeedback) {
            DOM.evalFeedback.innerHTML = `<strong>Explanation:</strong> ${escapeHtml(explanation || 'AI evaluated your answer.')}`;
        }
    }

    // ── Submit Answer ───────────────────────────────────────────────────
    async function submitAnswer() {
        const q = State.questions[State.currentQuestionIndex];
        const selectedOption = document.querySelector('input[name="mcqOption"]:checked');

        if (!selectedOption || !q) return;

        setSubmitting(true);

        try {
            const response = await API.submitMcqAnswer(
                State.currentSessionId, 
                q.id, 
                selectedOption.value
            );

            q.userSelectedOption = response.userSelectedOption;
            q.correctOption = response.correctOption;
            q.explanation = response.explanation;

            updateProgress();
            updateDots();
            renderCurrentQuestion();

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Answer recorded and evaluated!', 'success');
            }

            if (State.questions.every(question => question.userSelectedOption)) {
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            }

        } catch (error) {
            console.error('Submit error:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || 'Failed to submit answer.', 'danger');
            }
        } finally {
            setSubmitting(false);
        }
    }

    function setSubmitting(isSubmitting) {
        if (!DOM.submitAnswerBtn) return;
        DOM.submitAnswerBtn.disabled = isSubmitting;
        
        if (DOM.submitBtnText) DOM.submitBtnText.classList.toggle('d-none', isSubmitting);
        if (DOM.submitBtnLoader) DOM.submitBtnLoader.classList.toggle('d-none', !isSubmitting);
    }

    // ── View States ─────────────────────────────────────────────────────
    function showLoading() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.remove('d-none');
        if (DOM.sessionContent)  DOM.sessionContent.classList.add('d-none');
        if (DOM.errorState)      DOM.errorState.classList.add('d-none');
        if (DOM.sessionComplete) DOM.sessionComplete.classList.add('d-none');
    }

    function showSessionContent() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
        if (DOM.sessionContent)  DOM.sessionContent.classList.remove('d-none');
        if (DOM.errorState)      DOM.errorState.classList.add('d-none');
        if (DOM.sessionComplete) DOM.sessionComplete.classList.add('d-none');
    }

    function showErrorState() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
        if (DOM.sessionContent)  DOM.sessionContent.classList.add('d-none');
        if (DOM.errorState)      DOM.errorState.classList.remove('d-none');
        if (DOM.sessionComplete) DOM.sessionComplete.classList.add('d-none');
    }

    function showSessionComplete() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
        if (DOM.sessionContent)  DOM.sessionContent.classList.add('d-none');
        if (DOM.errorState)      DOM.errorState.classList.add('d-none');
        if (DOM.sessionComplete) DOM.sessionComplete.classList.remove('d-none');

        const score = Math.round(State.currentSession.score || 0);
        if (DOM.completeSubtitle) {
            DOM.completeSubtitle.innerHTML = `You completed the MCQ quiz with an overall accuracy of <strong class="text-success">${score}%</strong>!`;
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
