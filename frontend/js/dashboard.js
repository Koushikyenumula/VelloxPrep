/**
 * ═══════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE — JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Auth guard (redirect to login if no token)
 *  - GET /api/dashboard API call
 *  - Populate statistics cards with animated counters
 *  - Render recent activities table
 *  - Render performance overview (ring + metric bars)
 *  - Sidebar toggle (mobile)
 *  - Logout
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const loadingSkeleton      = document.getElementById('loadingSkeleton');
const dashboardContent     = document.getElementById('dashboardContent');
const errorState           = document.getElementById('errorState');
const retryBtn             = document.getElementById('retryBtn');
const currentDateEl        = document.getElementById('currentDate');

// ── Stat card value elements ────────────────────────────────────────
const statElements = {
    totalInterviews: document.getElementById('totalInterviews'),
    averageScore:    document.getElementById('averageScore'),
    bestScore:       document.getElementById('bestScore'),
    accuracy:        document.getElementById('accuracy'),
    totalResumes:    document.getElementById('totalResumes'),
    latestAtsScore:  document.getElementById('latestAtsScore')
};

// ── Performance elements ────────────────────────────────────────────
const ringProgress   = document.getElementById('ringProgress');
const ringNumber     = document.getElementById('ringNumber');
const barAvgScore    = document.getElementById('barAvgScore');
const barBestScore   = document.getElementById('barBestScore');
const barAccuracy    = document.getElementById('barAccuracy');
const barAtsScore    = document.getElementById('barAtsScore');
const perfAvgScore   = document.getElementById('perfAvgScore');
const perfBestScore  = document.getElementById('perfBestScore');
const perfAccuracy   = document.getElementById('perfAccuracy');
const perfAtsScore   = document.getElementById('perfAtsScore');

// ── Activities table ────────────────────────────────────────────────
const activitiesBody   = document.getElementById('activitiesBody');
const emptyActivities  = document.getElementById('emptyActivities');

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

    // Inject SVG gradient for ring (needs to be in the DOM)
    injectRingGradient();

    // Retry
    retryBtn.addEventListener('click', fetchDashboardData);

    // Fetch dashboard data
    fetchDashboardData();
});

// ── Fetch Dashboard Data ────────────────────────────────────────────
async function fetchDashboardData() {
    showLoading();

    try {
        const data = await API.getDashboard();

        // Render the dashboard
        renderStatistics(data);
        renderRecentActivities(data);
        renderPerformance(data);

        showContent();

    } catch (error) {
        console.warn('Dashboard API response fallback:', error);
        // Graceful fallback for new or social users
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
    animateCounter(statElements.totalInterviews, data.totalInterviews || 0);
    animateCounter(statElements.averageScore,    data.averageScore    || 0);
    animateCounter(statElements.bestScore,       data.bestScore       || 0);
    animateCounter(statElements.accuracy,        data.accuracy        || 0);
    animateCounter(statElements.totalResumes,    data.totalResumes    || 0);
    animateCounter(statElements.latestAtsScore,  data.latestAtsScore  || 0);
}

/**
 * Animate a number counter from 0 → target
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
    const activities = data.recentActivities || [];

    if (activities.length === 0) {
        activitiesBody.innerHTML = '';
        emptyActivities.classList.remove('d-none');
        return;
    }

    emptyActivities.classList.add('d-none');

    activitiesBody.innerHTML = activities.map(activity => `
        <tr>
            <td><span class="activity-name">${escapeHtml(activity.title)}</span></td>
            <td><span class="activity-type-badge ${activity.type === 'INTERVIEW' ? 'badge-interview' : 'badge-resume'}">${activity.type === 'INTERVIEW' ? 'Interview' : 'Resume'}</span></td>
            <td><span class="activity-score ${getScoreClass(activity.score || 0)}">${activity.score != null ? Math.round(activity.score) + '%' : 'N/A'}</span></td>
            <td><span class="activity-date">${formatDate(activity.timestamp)}</span></td>
            <td><span class="status-badge ${activity.status === 'COMPLETED' ? 'status-completed' : 'status-in-progress'}">${activity.status === 'COMPLETED' ? 'Completed' : 'In Progress'}</span></td>
        </tr>
    `).join('');
}

function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-low';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const today = new Date();
    
    // If it's today, show "Today"
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    
    // If it's yesterday, show "Yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Render Performance Overview ─────────────────────────────────────
function renderPerformance(data) {
    const avg     = data.averageScore   || 0;
    const best    = data.bestScore      || 0;
    const acc     = data.accuracy       || 0;
    const ats     = data.latestAtsScore || 0;

    // Overall score = weighted average
    const overall = Math.round((avg * 0.35) + (best * 0.25) + (acc * 0.25) + (ats * 0.15));

    // Animate ring
    const circumference = 2 * Math.PI * 52; // r = 52
    const offset = circumference - (overall / 100) * circumference;

    // Delay to let the card animate in first
    setTimeout(() => {
        ringProgress.style.strokeDashoffset = offset;
        animateCounter(ringNumber, overall, 1400);
    }, 500);

    // Animate metric bars
    setTimeout(() => {
        barAvgScore.style.width  = `${avg}%`;
        barBestScore.style.width = `${best}%`;
        barAccuracy.style.width  = `${acc}%`;
        barAtsScore.style.width  = `${ats}%`;

        perfAvgScore.textContent  = `${avg}%`;
        perfBestScore.textContent = `${best}%`;
        perfAccuracy.textContent  = `${acc}%`;
        perfAtsScore.textContent  = `${ats}%`;
    }, 600);
}

// ── SVG Gradient for Ring ───────────────────────────────────────────
function injectRingGradient() {
    const svg = document.querySelector('.ring-svg');
    if (!svg) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'ringGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', 'hsl(230, 80%, 60%)');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', 'hsl(260, 85%, 65%)');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
}

// ── View State Management ───────────────────────────────────────────
function showLoading() {
    loadingSkeleton.classList.remove('d-none');
    dashboardContent.classList.add('d-none');
    errorState.classList.add('d-none');
}

function showContent() {
    loadingSkeleton.classList.add('d-none');
    dashboardContent.classList.remove('d-none');
    errorState.classList.add('d-none');
}

function showError() {
    loadingSkeleton.classList.add('d-none');
    dashboardContent.classList.add('d-none');
    errorState.classList.remove('d-none');
}



// ── Current Date ────────────────────────────────────────────────────
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ── Utility ─────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
