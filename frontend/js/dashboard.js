/**
 * ═══════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE - High-Craft Animation Engine & Telemetry
 * VelloxPrep Platform
 *
 * Handles:
 *  - Atmospheric Neural Network Canvas (Particle physics & synaptic pulses)
 *  - Desktop Ambient Cursor Parallax & Glow
 *  - Theme Synchronization (Obsidian Dark / Crisp Light)
 *  - Dynamic Personalized Greetings & Live Date
 *  - Animated Telemetry Counters & Metric Progression Bars
 *  - SVG Composite Score Progress Ring
 *  - Recent Activities Table with Live Badges
 *  - Resilient API Integration & Skeletons
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

// ── DOM Element References ──────────────────────────────────────────
const DOM = {
    canvas:             document.getElementById('aiNetworkCanvas'),
    cursorGlow:         document.getElementById('cursorGlow'),
    themeToggleBtn:     document.getElementById('themeToggleBtn'),
    themeToggleIcon:    document.getElementById('themeToggleIcon'),
    loadingSkeleton:    document.getElementById('loadingSkeleton'),
    dashboardContent:   document.getElementById('dashboardContent'),
    errorState:         document.getElementById('errorState'),
    retryBtn:           document.getElementById('retryBtn'),
    currentDateEl:      document.getElementById('currentDate'),
    welcomeUserHeading: document.getElementById('welcomeUserHeading'),
    userNameHighlight:  document.getElementById('userNameHighlight'),
    topbarSubtitle:     document.querySelector('.topbar-subtitle'),

    // Stat card values
    totalInterviews:    document.getElementById('totalInterviews'),
    averageScore:       document.getElementById('averageScore'),
    bestScore:          document.getElementById('bestScore'),
    accuracy:           document.getElementById('accuracy'),
    totalResumes:       document.getElementById('totalResumes'),
    latestAtsScore:     document.getElementById('latestAtsScore'),

    // Performance overview elements
    ringProgress:       document.getElementById('ringProgress'),
    ringNumber:         document.getElementById('ringNumber'),
    barAvgScore:        document.getElementById('barAvgScore'),
    barBestScore:       document.getElementById('barBestScore'),
    barAccuracy:        document.getElementById('barAccuracy'),
    barAtsScore:        document.getElementById('barAtsScore'),
    perfAvgScore:       document.getElementById('perfAvgScore'),
    perfBestScore:      document.getElementById('perfBestScore'),
    perfAccuracy:       document.getElementById('perfAccuracy'),
    perfAtsScore:       document.getElementById('perfAtsScore'),

    // Table elements
    activitiesTableContainer: document.getElementById('activitiesTableContainer'),
    activitiesTable:          document.getElementById('activitiesTable'),
    activitiesBody:           document.getElementById('activitiesBody'),
    emptyActivities:          document.getElementById('emptyActivities')
};

// ── State Management ────────────────────────────────────────────────
const DashboardState = {
    isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    currentTheme: localStorage.getItem('theme') || 'dark'
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

    // 2. Initialize Common Sidebar
    if (typeof Sidebar !== 'undefined' && typeof Sidebar.init === 'function') {
        Sidebar.init();
    }

    // 3. Initialize Visual Engine (Mobile & Desktop Accelerated)
    if (typeof VisualEngine !== 'undefined') {
        VisualEngine.initAll();
    } else {
        initTheme();
        initCanvasNetwork();
        initCursorGlow();
        initCardSpotlights();
        initScrollReveal();
    }

    // 4. Set Dynamic User Information & Live Date
    setupUserIdentity();
    setCurrentDate();

    // 5. Inject SVG Ring Gradient
    injectRingGradient();

    // 6. Bind Retry Event
    if (DOM.retryBtn) {
        DOM.retryBtn.addEventListener('click', fetchDashboardData);
    }

    // 7. Fetch & Render Telemetry
    fetchDashboardData();
});

// ═══════════════════════════════════════════════════════════════════
// 1. THEME ENGINE & SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════════
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme, false);

    if (DOM.themeToggleBtn) {
        DOM.themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme, true);
        });
    }
}

function applyTheme(theme, animate = false) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (DOM.themeToggleIcon) {
            DOM.themeToggleIcon.className = 'bi bi-sun-fill';
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (DOM.themeToggleIcon) {
            DOM.themeToggleIcon.className = 'bi bi-moon-stars';
        }
    }
    localStorage.setItem('theme', theme);
    DashboardState.currentTheme = theme;
}

// ═══════════════════════════════════════════════════════════════════
// 2. ATMOSPHERIC NEURAL NETWORK CANVAS (IDENTICAL TO LOGIN ENGINE)
// ═══════════════════════════════════════════════════════════════════
function initCanvasNetwork() {
    const canvas = DOM.canvas;
    if (!canvas || DashboardState.isReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes = [];
    let pulses = [];
    const MAX_NODES = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 13000), 100);
    const CONNECT_DIST = 145;

    // Mouse parallax tracking
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
            const depth = 0.4 + Math.random() * 0.6; // 0.4 to 1.0
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22 * depth,
                vy: (Math.random() - 0.5) * 0.22 * depth,
                radius: (1.2 + Math.random() * 1.5) * depth,
                depth: depth,
                alpha: 0.15 + depth * 0.45,
                pulseTimer: Math.random() * 100
            });
        }
    }

    // Track mouse coordinates for gentle parallax
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    }, { passive: true });

    // Spawn synaptic electrical pulse
    function spawnPulse(nodeA, nodeB) {
        if (pulses.length > 10) return;
        pulses.push({
            startX: nodeA.x,
            startY: nodeA.y,
            endX: nodeB.x,
            endY: nodeB.y,
            progress: 0,
            speed: 0.014 + Math.random() * 0.015
        });
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        // Smooth damping (lerp)
        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;

        const offsetX = (mouse.x - width / 2) / (width / 2);
        const offsetY = (mouse.y - height / 2) / (height / 2);

        ctx.clearRect(0, 0, width, height);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nodeColor = isLight ? 'rgba(70, 85, 125,' : 'rgba(180, 195, 235,';
        const lineColor = isLight ? 'rgba(100, 120, 170,' : 'rgba(140, 160, 215,';

        // 1. Draw connecting synaptic lines
        for (let i = 0; i < nodes.length; i++) {
            const na = nodes[i];
            const posX = na.x + offsetX * 16 * na.depth;
            const posY = na.y + offsetY * 16 * na.depth;

            for (let j = i + 1; j < nodes.length; j++) {
                const nb = nodes[j];
                const pbx = nb.x + offsetX * 16 * nb.depth;
                const pby = nb.y + offsetY * 16 * nb.depth;

                const dx = posX - pbx;
                const dy = posY - pby;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DIST) {
                    const lineAlpha = (1 - dist / CONNECT_DIST) * 0.16 * ((na.depth + nb.depth) / 2);
                    ctx.beginPath();
                    ctx.strokeStyle = `${lineColor} ${lineAlpha})`;
                    ctx.lineWidth = 0.75;
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(pbx, pby);
                    ctx.stroke();

                    // Random synaptic burst
                    if (Math.random() < 0.0003 && dist < 120) {
                        spawnPulse(na, nb);
                    }
                }
            }
        }

        // 2. Draw synaptic pulses
        for (let p = pulses.length - 1; p >= 0; p--) {
            const pulse = pulses[p];
            pulse.progress += pulse.speed;

            if (pulse.progress >= 1) {
                pulses.splice(p, 1);
                continue;
            }

            const currentX = pulse.startX + (pulse.endX - pulse.startX) * pulse.progress + offsetX * 14;
            const currentY = pulse.startY + (pulse.endY - pulse.startY) * pulse.progress + offsetY * 14;

            ctx.beginPath();
            ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(109, 74, 255, 0.75)' : 'rgba(140, 120, 255, 0.9)';
            ctx.fill();
        }

        // 3. Draw nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx + 0.05 * n.depth;
            n.y += n.vy;

            // Wrap boundaries seamlessly
            if (n.x < -20) n.x = width + 20;
            if (n.x > width + 20) n.x = -20;
            if (n.y < -20) n.y = height + 20;
            if (n.y > height + 20) n.y = -20;

            const px = n.x + offsetX * 16 * n.depth;
            const py = n.y + offsetY * 16 * n.depth;

            ctx.beginPath();
            ctx.arc(px, py, n.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${nodeColor} ${n.alpha})`;
            ctx.fill();
        }
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);
}

// ═══════════════════════════════════════════════════════════════════
// 3. DESKTOP CURSOR AMBIENT GLOW
// ═══════════════════════════════════════════════════════════════════
function initCursorGlow() {
    const glow = DOM.cursorGlow;
    if (!glow || DashboardState.isReducedMotion || window.innerWidth < 1024) return;

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
    if (DashboardState.isReducedMotion || window.innerWidth < 992) return;

    const cards = document.querySelectorAll('.stat-card, .quick-action-card, .dashboard-hero-banner, .glass-panel');
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

// ── Viewport Scroll Reveal & Edge Fade Engine ────────────────────────
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-from-left, .reveal-from-right, .reveal-from-bottom');
    if (!revealElements.length) return;

    if (DashboardState.isReducedMotion || !('IntersectionObserver' in window)) {
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
        threshold: 0.10
    });

    revealElements.forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════════
// 4. USER IDENTITY & GREETING
// ═══════════════════════════════════════════════════════════════════
function setupUserIdentity() {
    const email = localStorage.getItem('email') || '';
    const rawName = (typeof Auth !== 'undefined' && typeof Auth.getItem === 'function' ? Auth.getItem('name') : localStorage.getItem('name')) || (email ? email.split('@')[0] : 'Engineer');
    const firstName = rawName.split(' ')[0].charAt(0).toUpperCase() + rawName.split(' ')[0].slice(1);

    if (DOM.userNameHighlight) {
        DOM.userNameHighlight.textContent = firstName;
    }
    if (DOM.topbarSubtitle) {
        DOM.topbarSubtitle.textContent = `Welcome back, ${firstName}! Here's your technical overview.`;
    }
}

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    if (DOM.currentDateEl) {
        DOM.currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 5. FETCH & RENDER DASHBOARD DATA
// ═══════════════════════════════════════════════════════════════════
async function fetchDashboardData() {
    showLoading();

    try {
        const data = await API.getDashboard();

        renderStatistics(data);
        renderRecentActivities(data);
        renderPerformance(data);

        showContent();

    } catch (error) {
        console.warn('Dashboard API response fallback:', error);
        // Resilient fallback for new or unpopulated users
        const fallbackData = {
            totalInterviews: 0,
            averageScore: 0,
            bestScore: 0,
            accuracy: 0,
            totalResumes: 0,
            latestAtsScore: 0,
            recentActivities: []
        };
        renderStatistics(fallbackData);
        renderRecentActivities(fallbackData);
        renderPerformance(fallbackData);
        showContent();
    }
}

// ── Render Statistics Cards ─────────────────────────────────────────
function renderStatistics(data) {
    if (!data) return;
    animateCounter(DOM.totalInterviews, data.totalInterviews || 0);
    animateCounter(DOM.averageScore,    data.averageScore    || 0);
    animateCounter(DOM.bestScore,       data.bestScore       || 0);
    animateCounter(DOM.accuracy,        data.accuracy        || 0);
    animateCounter(DOM.totalResumes,    data.totalResumes    || 0);
    animateCounter(DOM.latestAtsScore,  data.latestAtsScore  || 0);
}

/**
 * Animate a number counter from 0 → target with smooth cubic ease-out
 */
function animateCounter(element, target, duration = 1200) {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ── Render Recent Activities ────────────────────────────────────────
function renderRecentActivities(data) {
    const activities = (data && Array.isArray(data.recentActivities)) ? data.recentActivities : [];

    if (!DOM.activitiesBody) return;

    if (activities.length === 0) {
        DOM.activitiesBody.innerHTML = '';
        if (DOM.activitiesTableContainer) DOM.activitiesTableContainer.classList.add('d-none');
        if (DOM.emptyActivities) DOM.emptyActivities.classList.remove('d-none');
        return;
    }

    if (DOM.activitiesTableContainer) DOM.activitiesTableContainer.classList.remove('d-none');
    if (DOM.emptyActivities) DOM.emptyActivities.classList.add('d-none');

    DOM.activitiesBody.innerHTML = activities.map(activity => {
        const typeInfo = getActivityTypeInfo(activity.type);
        const statusInfo = getStatusInfo(activity.status);
        const scoreInfo = getScoreDisplay(activity.score);

        return `
            <tr>
                <td class="activity-cell-title text-truncate" style="max-width: 240px;" title="${escapeHtml(activity.title || 'Technical Assessment')}">
                    <span class="activity-title-text">${escapeHtml(activity.title || 'Technical Assessment')}</span>
                </td>
                <td>
                    <span class="badge-type ${typeInfo.className}">
                        <i class="bi ${typeInfo.icon} me-1"></i>${typeInfo.label}
                    </span>
                </td>
                <td>
                    <span class="activity-score-val ${scoreInfo.className}">${scoreInfo.label}</span>
                </td>
                <td>
                    <span class="activity-date-text text-muted">${formatDate(activity.timestamp)}</span>
                </td>
                <td>
                    <span class="badge-status ${statusInfo.className}">
                        ${statusInfo.label}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function getActivityTypeInfo(type) {
    const normalized = (type || '').toUpperCase();
    if (normalized.includes('RESUME')) {
        return { label: 'Resume', icon: 'bi-file-earmark-text-fill', className: 'badge-type-resume' };
    } else if (normalized.includes('CODING')) {
        return { label: 'Coding', icon: 'bi-code-square', className: 'badge-type-coding' };
    } else if (normalized.includes('MCQ')) {
        return { label: 'MCQ', icon: 'bi-card-checklist', className: 'badge-type-mcq' };
    } else {
        return { label: 'Interview', icon: 'bi-mic-fill', className: 'badge-type-interview' };
    }
}

function getStatusInfo(status) {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'COMPLETED' || normalized === 'PASSED' || normalized === 'DONE') {
        return { label: 'Completed', className: 'badge-status-completed' };
    } else if (normalized === 'FAILED' || normalized === 'ABANDONED' || normalized === 'REJECTED') {
        return { label: 'Failed', className: 'badge-status-failed' };
    } else {
        return { label: 'In Progress', className: 'badge-status-progress' };
    }
}

function getScoreDisplay(score) {
    if (score == null || isNaN(score)) {
        return { label: 'N/A', className: 'score-na' };
    }
    const val = Math.round(Number(score));
    if (val >= 70) {
        return { label: `${val}%`, className: 'text-success fw-bold' };
    } else if (val >= 45) {
        return { label: `${val}%`, className: 'text-warning fw-bold' };
    } else {
        return { label: `${val}%`, className: 'text-danger fw-bold' };
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'Recently';

    let date;
    // Support Jackson LocalDateTime array [year, month, day, hour, min, sec]
    if (Array.isArray(timestamp)) {
        const year = timestamp[0];
        const month = (timestamp[1] || 1) - 1; // Month is 0-indexed in JS
        const day = timestamp[2] || 1;
        const hours = timestamp[3] || 0;
        const mins = timestamp[4] || 0;
        date = new Date(year, month, day, hours, mins);
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
        return 'Recently';
    }

    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Today, ${timeStr}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Render Performance Overview (Ring + Metric Bars) ────────────────
function renderPerformance(data) {
    const avg     = data.averageScore   || 0;
    const best    = data.bestScore      || 0;
    const acc     = data.accuracy       || 0;
    const ats     = data.latestAtsScore || 0;

    // Overall score = composite weighted average
    const overall = Math.round((avg * 0.35) + (best * 0.25) + (acc * 0.25) + (ats * 0.15));

    // Animate SVG Ring
    const circumference = 2 * Math.PI * 52; // r = 52
    const offset = circumference - (overall / 100) * circumference;

    setTimeout(() => {
        if (DOM.ringProgress) DOM.ringProgress.style.strokeDashoffset = offset;
        animateCounter(DOM.ringNumber, overall, 1400);
    }, 400);

    // Animate Metric Bars
    setTimeout(() => {
        if (DOM.barAvgScore)    DOM.barAvgScore.style.width    = `${avg}%`;
        if (DOM.barBestScore)   DOM.barBestScore.style.width   = `${best}%`;
        if (DOM.barAccuracy)    DOM.barAccuracy.style.width    = `${acc}%`;
        if (DOM.barAtsScore)    DOM.barAtsScore.style.width    = `${ats}%`;

        if (DOM.perfAvgScore)   DOM.perfAvgScore.textContent   = `${avg}%`;
        if (DOM.perfBestScore)  DOM.perfBestScore.textContent  = `${best}%`;
        if (DOM.perfAccuracy)   DOM.perfAccuracy.textContent   = `${acc}%`;
        if (DOM.perfAtsScore)   DOM.perfAtsScore.textContent   = `${ats}%`;
    }, 500);
}

// ── SVG Gradient for Circular Ring ──────────────────────────────────
function injectRingGradient() {
    const svg = document.querySelector('.ring-svg');
    if (!svg) return;

    if (svg.querySelector('#ringGradient')) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'ringGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#7C5CFF');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#38BDF8');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
}

// ── View States ─────────────────────────────────────────────────────
function showLoading() {
    if (DOM.loadingSkeleton)  DOM.loadingSkeleton.classList.remove('d-none');
    if (DOM.dashboardContent) DOM.dashboardContent.classList.add('d-none');
    if (DOM.errorState)        DOM.errorState.classList.add('d-none');
}

function showContent() {
    if (DOM.loadingSkeleton)  DOM.loadingSkeleton.classList.add('d-none');
    if (DOM.dashboardContent) DOM.dashboardContent.classList.remove('d-none');
    if (DOM.errorState)        DOM.errorState.classList.add('d-none');
    setTimeout(initCardSpotlights, 120);
    setTimeout(initScrollReveal, 150);
}

function showError() {
    if (DOM.loadingSkeleton)  DOM.loadingSkeleton.classList.add('d-none');
    if (DOM.dashboardContent) DOM.dashboardContent.classList.add('d-none');
    if (DOM.errorState)        DOM.errorState.classList.remove('d-none');
}

// ── Utility ─────────────────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
