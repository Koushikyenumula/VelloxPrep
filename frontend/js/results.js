/**
 * ═══════════════════════════════════════════════════════════════════
 *  INTERVIEW HISTORY & RESULTS - Controller & Physics Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM References ──────────────────────────────────────────────────
    const DOM = {
        canvas:                 document.getElementById('aiNetworkCanvas'),
        cursorGlow:             document.getElementById('cursorGlow'),
        themeToggleBtn:         document.getElementById('themeToggleBtn'),
        themeToggleIcon:        document.getElementById('themeToggleIcon'),
        currentDateEl:          document.getElementById('currentDate'),
        pageTitle:              document.getElementById('pageTitle'),
        pageSubtitle:           document.getElementById('pageSubtitle'),

        loadingSkeleton:        document.getElementById('loadingSkeleton'),
        resultsContent:         document.getElementById('resultsContent'),
        errorState:             document.getElementById('errorState'),
        errorMessageEl:         document.getElementById('errorMessage'),
        retryBtn:               document.getElementById('retryBtn'),

        listModeContainer:      document.getElementById('listModeContainer'),
        detailModeContainer:    document.getElementById('detailModeContainer'),

        sessionsListBody:       document.getElementById('sessionsListBody'),
        emptySessions:          document.getElementById('emptySessions'),
        sessionSearch:          document.getElementById('sessionSearch'),

        sessionMetaBadge:       document.getElementById('sessionMetaBadge'),
        totalQuestionsEl:       document.getElementById('totalQuestions'),
        averageScoreEl:         document.getElementById('averageScore'),
        bestScoreEl:            document.getElementById('bestScore'),
        accuracyEl:             document.getElementById('accuracy'),
        detailedEvaluationsBody: document.getElementById('detailedEvaluationsBody'),
        emptyEvaluations:       document.getElementById('emptyEvaluations')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark',
        allSessions: [],
        activeSessionId: null
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

        // 2. Initialize Reusable Sidebar
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
            initScrollReveal();
        }

        // 4. Live Date
        setCurrentDate();

        // 5. Search Filtering
        if (DOM.sessionSearch) {
            DOM.sessionSearch.addEventListener('input', handleSessionSearch);
        }

        // 6. Retry Button
        if (DOM.retryBtn) {
            DOM.retryBtn.addEventListener('click', initializePage);
        }

        // 7. Parse URL and load appropriate view
        initializePage();
    });

    function initializePage() {
        const params = new URLSearchParams(window.location.search);
        State.activeSessionId = params.get('id');

        if (State.activeSessionId) {
            loadDetailedResults(State.activeSessionId);
        } else {
            loadSessionsList();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. THEME ENGINE
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

        const cards = document.querySelectorAll('.stat-card, .glass-panel, .eval-card, .dashboard-hero-banner');
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

    // ── Viewport Scroll Reveal Engine ───────────────────────────────────
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-from-left, .reveal-from-right, .reveal-from-bottom, .reveal-from-top');
        if (!revealElements.length) return;

        if (State.isReducedMotion || !('IntersectionObserver' in window)) {
            revealElements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.08
        });

        revealElements.forEach(el => observer.observe(el));
    }

    function setCurrentDate() {
        if (DOM.currentDateEl) {
            DOM.currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. STATE 1: LOAD SESSIONS ARCHIVE (LIST MODE)
    // ═══════════════════════════════════════════════════════════════════
    async function loadSessionsList() {
        showLoading();
        
        if (DOM.pageTitle) DOM.pageTitle.textContent = 'Interview History';
        if (DOM.pageSubtitle) DOM.pageSubtitle.textContent = 'Explore performance breakdowns and AI evaluation feedback for all past practice sessions.';

        try {
            const [interviewSessions, mcqSessions] = await Promise.all([
                API.getInterviewSessions().catch(() => []),
                (typeof API.getMcqSessions === 'function' ? API.getMcqSessions() : Promise.resolve([])).catch(() => [])
            ]);
            
            const iSessions = (interviewSessions || []).map(s => ({ ...s, testType: 'SUBJECTIVE' }));
            const mSessions = (mcqSessions || []).map(s => ({ ...s, testType: 'MCQ' }));
            
            State.allSessions = [...iSessions, ...mSessions];
            
            State.allSessions.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            renderSessionsList(State.allSessions);
            showContent(true);

        } catch (error) {
            console.error('Error fetching sessions:', error);
            showError('Could not retrieve interview sessions. Please verify your connection.');
        }
    }

    function renderSessionsList(sessions) {
        if (!DOM.sessionsListBody) return;
        DOM.sessionsListBody.innerHTML = '';

        if (!sessions || sessions.length === 0) {
            if (DOM.emptySessions) DOM.emptySessions.classList.remove('d-none');
            return;
        }

        if (DOM.emptySessions) DOM.emptySessions.classList.add('d-none');

        sessions.forEach(session => {
            const tr = document.createElement('tr');
            
            const skillName = escapeHtml(session.skill || session.domain || 'General');
            const difficulty = session.difficulty ? session.difficulty.toUpperCase() : 'MEDIUM';
            const diffClass = difficulty.toLowerCase();

            const scoreVal = session.score != null ? Math.round(session.score) : null;
            let scoreBadge = '<span class="text-secondary">-</span>';
            if (scoreVal !== null) {
                let badgeClass = 'score-low';
                if (scoreVal >= 75) badgeClass = 'score-high';
                else if (scoreVal >= 50) badgeClass = 'score-mid';
                scoreBadge = `<span class="badge-score ${badgeClass}">${scoreVal}%</span>`;
            }
            
            let dateStr = '-';
            if (session.createdAt) {
                const dateObj = new Date(session.createdAt);
                dateStr = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
            }

            const status = session.status || 'COMPLETED';
            let statusBadge = '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3);">Completed</span>';
            let actionBtn = '';
            
            const isMcq = session.testType === 'MCQ';
            const typeBadge = isMcq 
                ? '<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.72rem;">MCQ Test</span>' 
                : '<span class="badge" style="background: rgba(167, 139, 250, 0.15); color: #A78BFA; border: 1px solid rgba(167, 139, 250, 0.3); font-size: 0.72rem;">Subjective AI</span>';

            if (status === 'COMPLETED') {
                const url = isMcq ? `mcq-session.html?id=${session.id}` : `results.html?id=${session.id}`;
                actionBtn = `
                    <a href="${url}" class="btn btn-session-nav btn-sm px-3">
                        View Dossier <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                `;
            } else {
                statusBadge = '<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3);">In Progress</span>';
                const url = isMcq ? `mcq-session.html?id=${session.id}` : `interview-session.html?id=${session.id}`;
                actionBtn = `
                    <a href="${url}" class="btn btn-session-submit btn-sm px-3">
                        Resume <i class="bi bi-play-fill ms-1"></i>
                    </a>
                `;
            }

            tr.innerHTML = `
                <td>
                    ${typeBadge}
                </td>
                <td>
                    <span class="fw-semibold">${skillName}</span>
                </td>
                <td>
                    <span class="session-badge badge-difficulty-${diffClass}">${difficulty}</span>
                </td>
                <td>
                    ${scoreBadge}
                </td>
                <td>
                    <span class="text-secondary small">${dateStr}</span>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-end">
                    ${actionBtn}
                </td>
            `;
            DOM.sessionsListBody.appendChild(tr);
        });
    }

    function handleSessionSearch() {
        if (!DOM.sessionSearch) return;
        const query = DOM.sessionSearch.value.trim().toLowerCase();
        if (!query) {
            renderSessionsList(State.allSessions);
            return;
        }

        const filtered = State.allSessions.filter(s => 
            (s.skill && s.skill.toLowerCase().includes(query)) ||
            (s.domain && s.domain.toLowerCase().includes(query)) ||
            (s.difficulty && s.difficulty.toLowerCase().includes(query))
        );
        renderSessionsList(filtered);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. STATE 2: LOAD DETAILED RESULTS (DETAIL MODE)
    // ═══════════════════════════════════════════════════════════════════
    async function loadDetailedResults(sessionId) {
        showLoading();

        try {
            const data = await API.getInterviewResults(sessionId);
            renderDetailedResults(data);
            showContent(false);

        } catch (error) {
            console.error('Error fetching detailed results:', error);
            showError(error.message || 'Could not retrieve evaluation results. Please try again.');
        }
    }

    function renderDetailedResults(data) {
        if (DOM.pageTitle) DOM.pageTitle.textContent = 'Session Evaluation Dossier';
        if (DOM.pageSubtitle) DOM.pageSubtitle.textContent = `In-depth AI feedback analysis for ${escapeHtml(data.skill || 'Interview Session')}.`;

        const difficulty = data.difficulty ? data.difficulty.toUpperCase() : 'MEDIUM';
        const diffClass = difficulty.toLowerCase();

        if (DOM.sessionMetaBadge) {
            DOM.sessionMetaBadge.innerHTML = `
                <span class="meta-label">Topic:</span>
                <span class="meta-value me-3 text-accent">${escapeHtml(data.skill || 'General')}</span>
                <span class="text-secondary opacity-50 me-3">|</span>
                <span class="meta-label">Difficulty:</span>
                <span class="session-badge badge-difficulty-${diffClass} ms-1">${difficulty}</span>
            `;
        }

        const questions = data.questions || [];
        const evaluations = data.evaluations || [];
        const totalQuestions = questions.length;
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

        // Accuracy (evaluations >= 60%)
        let accuracy = 0;
        if (validEvaluations.length > 0) {
            const accurateCount = validEvaluations.filter(e => e.score >= 60.0).length;
            accuracy = Math.round((accurateCount / validEvaluations.length) * 100);
        }

        // Animated Counters
        animateCounter(DOM.totalQuestionsEl, totalQuestions);
        animateCounter(DOM.averageScoreEl, averageScore);
        animateCounter(DOM.bestScoreEl, bestScore);
        animateCounter(DOM.accuracyEl, accuracy);

        // Populate question evaluation cards
        if (!DOM.detailedEvaluationsBody) return;
        DOM.detailedEvaluationsBody.innerHTML = '';

        if (totalQuestions === 0) {
            if (DOM.emptyEvaluations) DOM.emptyEvaluations.classList.remove('d-none');
            return;
        }

        if (DOM.emptyEvaluations) DOM.emptyEvaluations.classList.add('d-none');

        questions.forEach((q, index) => {
            const evalObj = evaluations.find(e => e.questionId === q.id);
            const questionText = escapeHtml(q.question);
            
            let answerText = '<span class="text-secondary italic">No candidate answer submitted.</span>';
            let feedbackText = '<span class="text-secondary italic">No feedback available.</span>';
            let scoreBadge = '<span class="text-secondary">-</span>';

            if (evalObj) {
                if (evalObj.userAnswer && evalObj.userAnswer.trim()) {
                    answerText = escapeHtml(evalObj.userAnswer);
                }
                if (evalObj.aiFeedback && evalObj.aiFeedback.trim()) {
                    feedbackText = formatFeedback(evalObj.aiFeedback);
                }

                const score = evalObj.score != null ? Math.round(evalObj.score) : 0;
                let badgeClass = 'score-low';
                if (score >= 75) badgeClass = 'score-high';
                else if (score >= 50) badgeClass = 'score-mid';

                scoreBadge = `<span class="badge-score ${badgeClass}">${score}% Score</span>`;
            }

            const card = document.createElement('div');
            card.className = 'eval-card';
            card.innerHTML = `
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge" style="background: var(--accent-subtle); color: #A78BFA; border: 1px solid var(--accent-border); font-size: 0.78rem;">Question ${index + 1}</span>
                    </div>
                    ${scoreBadge}
                </div>
                
                <h4 class="eval-q-title mb-3">${questionText}</h4>

                <div class="eval-box eval-user-ans">
                    <div class="eval-box-label text-accent">
                        <i class="bi bi-person-fill"></i> Candidate Answer:
                    </div>
                    <div>${answerText}</div>
                </div>

                <div class="eval-box eval-ai-feedback">
                    <div class="eval-box-label text-success">
                        <i class="bi bi-stars"></i> AI Architectural Evaluation:
                    </div>
                    <div>${feedbackText}</div>
                </div>
            `;
            DOM.detailedEvaluationsBody.appendChild(card);
        });

        initCardSpotlights();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. HELPERS & ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════
    function showLoading() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.remove('d-none');
        if (DOM.resultsContent) DOM.resultsContent.classList.add('d-none');
        if (DOM.errorState) DOM.errorState.classList.add('d-none');
    }

    function showContent(isListMode) {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
        if (DOM.errorState) DOM.errorState.classList.add('d-none');
        if (DOM.resultsContent) DOM.resultsContent.classList.remove('d-none');

        if (isListMode) {
            if (DOM.listModeContainer) DOM.listModeContainer.classList.remove('d-none');
            if (DOM.detailModeContainer) DOM.detailModeContainer.classList.add('d-none');
        } else {
            if (DOM.listModeContainer) DOM.listModeContainer.classList.add('d-none');
            if (DOM.detailModeContainer) DOM.detailModeContainer.classList.remove('d-none');
        }

        initScrollReveal();
    }

    function showError(message) {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
        if (DOM.resultsContent) DOM.resultsContent.classList.add('d-none');
        if (DOM.errorState) DOM.errorState.classList.remove('d-none');
        if (DOM.errorMessageEl) DOM.errorMessageEl.textContent = message;
    }

    function animateCounter(element, targetValue, duration = 800) {
        if (!element) return;
        const target = Number(targetValue) || 0;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * easeOut);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    function formatFeedback(feedback) {
        if (!feedback) return '';
        const lines = feedback.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) return escapeHtml(feedback);
        return lines.map(line => `<div class="mb-1">${escapeHtml(line)}</div>`).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
