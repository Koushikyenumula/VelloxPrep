/**
 * ═══════════════════════════════════════════════════════════════════════
 *  RESUME MANAGEMENT — Controller & Animation Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM Element References ──────────────────────────────────────────
    const DOM = {
        canvas:               document.getElementById('aiNetworkCanvas'),
        cursorGlow:           document.getElementById('cursorGlow'),
        themeToggleBtn:       document.getElementById('themeToggleBtn'),
        themeToggleIcon:      document.getElementById('themeToggleIcon'),
        currentDateEl:        document.getElementById('currentDate'),

        // Upload & Analysis elements
        uploadPanelTitle:     document.getElementById('uploadPanelTitle'),
        uploadPanelBadge:     document.getElementById('uploadPanelBadge'),
        reUploadBtn:          document.getElementById('reUploadBtn'),
        fileInput:            document.getElementById('fileInput'),
        browseBtn:            document.getElementById('browseBtn'),
        uploadDropzone:       document.getElementById('uploadDropzone'),
        analysisResultPanel:  document.getElementById('analysisResultPanel'),
        resultAtsScore:       document.getElementById('resultAtsScore'),
        resultScoreBorder:    document.getElementById('resultScoreBorder'),
        resultFileName:       document.getElementById('resultFileName'),
        resultFileSize:       document.getElementById('resultFileSize'),
        resultSkillsContainer:document.getElementById('resultSkillsContainer'),

        // Directory Table elements
        resumesTableContainer:document.getElementById('resumesTableContainer'),
        resumesTable:         document.getElementById('resumesTable'),
        resumesTableBody:     document.getElementById('resumesTableBody'),
        resumeCountBadge:     document.getElementById('resumeCountBadge'),
        emptyState:           document.getElementById('emptyState'),

        // Delete Modal
        deleteResumeModal:    document.getElementById('deleteResumeModal'),
        confirmDeleteBtn:     document.getElementById('confirmDeleteBtn')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark',
        deleteTargetId: null,
        bsDeleteModal: null
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

        // 4. Set Current Live Date
        setCurrentDate();

        // 5. Initialize Delete Modal
        if (DOM.deleteResumeModal && typeof bootstrap !== 'undefined') {
            State.bsDeleteModal = new bootstrap.Modal(DOM.deleteResumeModal);
        }

        // 6. Bind Interactive Events
        bindEvents();

        // 7. Load Resumes
        loadResumes();
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

        const cards = document.querySelectorAll('.glass-panel, .dashboard-hero-banner, .quick-action-card');
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
        const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-from-left, .reveal-from-right, .reveal-from-bottom');
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
            threshold: 0.10
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
    // 3. EVENT BINDINGS & DRAG-AND-DROP
    // ═══════════════════════════════════════════════════════════════════
    function bindEvents() {
        bindBrowseEvents();

        // Re-upload Button Trigger
        if (DOM.reUploadBtn) {
            DOM.reUploadBtn.addEventListener('click', () => {
                showUploadDropzone();
            });
        }

        // Drag & Drop listeners
        if (DOM.uploadDropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                DOM.uploadDropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    DOM.uploadDropzone.classList.add('drag-active');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                DOM.uploadDropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    DOM.uploadDropzone.classList.remove('drag-active');
                }, false);
            });

            DOM.uploadDropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    uploadFile(dt.files[0]);
                }
            });
        }

        // Confirm Delete Button Click
        if (DOM.confirmDeleteBtn) {
            DOM.confirmDeleteBtn.addEventListener('click', () => {
                if (State.deleteTargetId !== null) {
                    deleteResume(State.deleteTargetId);
                }
            });
        }
    }

    function bindBrowseEvents() {
        const browseBtn = document.getElementById('browseBtn');
        const fileInput = document.getElementById('fileInput');
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    uploadFile(e.target.files[0]);
                }
            });
        }
    }

    function showUploadDropzone() {
        if (DOM.analysisResultPanel) DOM.analysisResultPanel.classList.add('d-none');
        if (DOM.uploadDropzone) DOM.uploadDropzone.classList.remove('d-none');
        if (DOM.reUploadBtn) DOM.reUploadBtn.classList.add('d-none');
        if (DOM.uploadPanelTitle) {
            DOM.uploadPanelTitle.innerHTML = '<i class="bi bi-cloud-arrow-up-fill me-2"></i>Upload Resume';
        }
        if (DOM.uploadPanelBadge) {
            DOM.uploadPanelBadge.textContent = 'PDF Scanner';
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. API CALLS & RESUME LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════
    async function loadResumes() {
        try {
            const resumes = await API.getResumes() || [];
            
            if (DOM.resumeCountBadge) {
                DOM.resumeCountBadge.textContent = `${resumes.length} Total`;
            }

            renderResumesList(resumes);
        } catch (error) {
            console.error('Failed to load resumes:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || 'Failed to retrieve resumes list.', 'danger');
            }
        }
    }

    function renderResumesList(resumes) {
        if (!DOM.resumesTableBody) return;

        DOM.resumesTableBody.innerHTML = '';

        if (resumes.length === 0) {
            if (DOM.resumesTableContainer) DOM.resumesTableContainer.classList.add('d-none');
            if (DOM.emptyState) DOM.emptyState.classList.remove('d-none');
            return;
        }

        if (DOM.resumesTableContainer) DOM.resumesTableContainer.classList.remove('d-none');
        if (DOM.emptyState) DOM.emptyState.classList.add('d-none');

        resumes.forEach(resume => {
            const score = resume.atsScore !== null ? Math.round(Number(resume.atsScore)) : 0;
            const scoreColor = score >= 70 ? 'text-success' : (score >= 45 ? 'text-warning' : 'text-danger');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2.5">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                        <span class="activity-title-text text-truncate" style="max-width: 220px;" title="${escapeHtml(resume.fileName)}">${escapeHtml(resume.fileName)}</span>
                    </div>
                </td>
                <td class="py-2.5 text-center">
                    <span class="activity-score-val ${scoreColor} fw-bold">${score}%</span>
                </td>
                <td class="py-2.5 text-end">
                    <div class="d-inline-flex align-items-center gap-1">
                        <a href="resume-interview.html?resumeId=${encodeURIComponent(resume.id)}" class="btn-table-action action-practice" title="Practice AI Interview from Resume">
                            <i class="bi bi-play-circle-fill"></i>
                        </a>
                        <button type="button" class="btn-table-action action-delete delete-resume-btn" data-id="${escapeHtml(resume.id)}" title="Delete Resume">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            row.querySelector('.delete-resume-btn').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openDeleteConfirmation(id);
            });

            DOM.resumesTableBody.appendChild(row);
        });
    }

    function openDeleteConfirmation(id) {
        State.deleteTargetId = id;
        if (State.bsDeleteModal) {
            State.bsDeleteModal.show();
        }
    }

    async function deleteResume(id) {
        try {
            await API.deleteResume(id);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Resume deleted successfully.', 'success');
            }
            
            if (State.bsDeleteModal) {
                State.bsDeleteModal.hide();
            }

            showUploadDropzone();
            loadResumes();
        } catch (error) {
            console.error('Delete resume failed:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || 'Could not delete resume.', 'danger');
            }
        } finally {
            State.deleteTargetId = null;
        }
    }

    async function uploadFile(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Only PDF files are supported.', 'warning');
            }
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Max file size supported is 10MB.', 'warning');
            }
            return;
        }

        setUploadingState(true);

        try {
            const data = await API.uploadResume(file);

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Resume uploaded and analyzed successfully!', 'success');
            }
            displayAnalysisResults(data);
            loadResumes();
        } catch (error) {
            console.error('Upload resume failed:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || 'Error occurred while parsing the resume.', 'danger');
            }
        } finally {
            setUploadingState(false);
        }
    }

    function setUploadingState(isUploading) {
        if (!DOM.uploadDropzone) return;

        if (isUploading) {
            DOM.uploadDropzone.style.pointerEvents = 'none';
            DOM.uploadDropzone.innerHTML = `
                <div class="upload-analyzing-spinner"></div>
                <h3 class="upload-title">Analyzing Resume with AI...</h3>
                <p class="upload-subtitle mb-0">Extracting technical competencies & evaluating ATS keyword compatibility.</p>
            `;
        } else {
            DOM.uploadDropzone.style.pointerEvents = 'auto';
            DOM.uploadDropzone.innerHTML = `
                <input type="file" id="fileInput" accept=".pdf" class="d-none">
                <div class="upload-icon-wrapper">
                    <i class="bi bi-file-earmark-pdf-fill"></i>
                </div>
                <h3 class="upload-title">Drag & Drop your Resume</h3>
                <p class="upload-subtitle">Only PDF files are supported (Max 10MB)</p>
                <button type="button" class="btn btn-browse" id="browseBtn">
                    <i class="bi bi-folder2-open me-1"></i> Browse File
                </button>
            `;
            bindBrowseEvents();
        }
    }

    function displayAnalysisResults(resume) {
        if (!DOM.analysisResultPanel) return;

        // Switch card view from Dropzone -> Analysis Results
        if (DOM.uploadDropzone) DOM.uploadDropzone.classList.add('d-none');
        DOM.analysisResultPanel.classList.remove('d-none');
        if (DOM.reUploadBtn) DOM.reUploadBtn.classList.remove('d-none');
        if (DOM.uploadPanelTitle) {
            DOM.uploadPanelTitle.innerHTML = '<i class="bi bi-clipboard-data-fill me-2"></i>Analysis Results';
        }
        if (DOM.uploadPanelBadge) {
            DOM.uploadPanelBadge.textContent = 'Live Score';
        }

        const score = resume.atsScore !== null ? Math.round(Number(resume.atsScore)) : 0;
        const color = score >= 70 ? 'var(--success)' : (score >= 45 ? 'var(--warning)' : 'var(--danger)');

        if (DOM.resultScoreBorder) {
            DOM.resultScoreBorder.style.borderColor = color;
            DOM.resultScoreBorder.style.boxShadow = `0 0 20px ${color}`;
        }

        if (DOM.resultAtsScore) {
            animateCounter(DOM.resultAtsScore, score, 1000);
        }

        if (DOM.resultFileName) DOM.resultFileName.textContent = resume.fileName || '-';
        if (DOM.resultFileSize) {
            const kbSize = resume.fileSize !== null ? (resume.fileSize / 1024).toFixed(1) : '0';
            DOM.resultFileSize.textContent = `${kbSize} KB`;
        }

        if (DOM.resultSkillsContainer) {
            DOM.resultSkillsContainer.innerHTML = '';
            const skills = resume.extractedSkills || [];

            if (skills.length === 0) {
                DOM.resultSkillsContainer.innerHTML = '<span class="text-muted small">No technical skills detected.</span>';
            } else {
                skills.forEach((skill, index) => {
                    const tag = document.createElement('span');
                    tag.className = 'skill-tag';
                    tag.innerHTML = `<i class="bi bi-check2-circle me-1"></i>${escapeHtml(skill)}`;
                    DOM.resultSkillsContainer.appendChild(tag);
                });
            }
        }
    }

    function animateCounter(element, target, duration = 900) {
        if (!element) return;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(ease * target);
            element.textContent = `${current}%`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
