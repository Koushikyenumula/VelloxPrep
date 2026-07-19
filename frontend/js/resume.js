/**
 * ═══════════════════════════════════════════════════════════════════════
 *  RESUME MANAGEMENT — controller logic
 *  VelloxPrep Platform
 *  ═══════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ── DOM Element Bindings ──────────────────────────────────────────
    let fileInput, browseBtn, uploadDropzone;
    let analysisResultPanel, closeResultBtn;
    let resultAtsScore, resultScoreBorder, resultFileName, resultFileSize, resultSkillsContainer;
    let resumesTableBody, resumeCountBadge, emptyState;
    let deleteResumeModal, confirmDeleteBtn;

    let deleteTargetId = null;
    let bsDeleteModal = null;

    /**
     * Initialize page variables and bindings
     */
    function init() {
        // Authenticated Guard Check
        if (!Auth.getToken()) {
            window.location.href = 'login.html';
            return;
        }

        // Initialize Sidebar navigation
        Sidebar.init();

        // Topbar date display
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        // DOM query selectors
        fileInput = document.getElementById('fileInput');
        browseBtn = document.getElementById('browseBtn');
        uploadDropzone = document.getElementById('uploadDropzone');

        analysisResultPanel = document.getElementById('analysisResultPanel');
        closeResultBtn = document.getElementById('closeResultBtn');
        resultAtsScore = document.getElementById('resultAtsScore');
        resultScoreBorder = document.getElementById('resultScoreBorder');
        resultFileName = document.getElementById('resultFileName');
        resultFileSize = document.getElementById('resultFileSize');
        resultSkillsContainer = document.getElementById('resultSkillsContainer');

        resumesTableBody = document.getElementById('resumesTableBody');
        resumeCountBadge = document.getElementById('resumeCountBadge');
        emptyState = document.getElementById('emptyState');

        deleteResumeModal = document.getElementById('deleteResumeModal');
        confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (deleteResumeModal) {
            bsDeleteModal = new bootstrap.Modal(deleteResumeModal);
        }

        bindEvents();
        loadResumes();
    }

    /**
     * Attach event handlers to dynamic UI components
     */
    function bindEvents() {
        // File browse trigger
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    uploadFile(e.target.files[0]);
                }
            });
        }

        // Drag & Drop listeners
        if (uploadDropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadDropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    uploadDropzone.style.background = 'rgba(255, 255, 255, 0.05)';
                    uploadDropzone.style.borderColor = 'var(--primary) !important';
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadDropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    uploadDropzone.style.background = 'transparent';
                    uploadDropzone.style.borderColor = 'var(--border-color) !important';
                }, false);
            });

            uploadDropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0) {
                    uploadFile(files[0]);
                }
            });
        }

        // Close Result Panel
        if (closeResultBtn && analysisResultPanel) {
            closeResultBtn.addEventListener('click', () => {
                analysisResultPanel.classList.add('d-none');
            });
        }

        // Confirm Delete Button Click
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (deleteTargetId !== null) {
                    deleteResume(deleteTargetId);
                }
            });
        }
    }

    /**
     * Load uploaded resumes directory from backend API
     */
    async function loadResumes() {
        try {
            const resumes = await API.getResumes() || [];
            
            // Set directory count badge
            if (resumeCountBadge) {
                resumeCountBadge.textContent = `${resumes.length} Total`;
            }

            renderResumesList(resumes);
        } catch (error) {
            console.error('Failed to load resumes:', error);
            Toast.show(error.message || 'Failed to retrieve resumes list.', 'danger');
        }
    }

    /**
     * Render resumes list in HTML table
     */
    function renderResumesList(resumes) {
        if (!resumesTableBody) return;

        resumesTableBody.innerHTML = '';

        if (resumes.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }

        if (emptyState) emptyState.classList.add('d-none');

        resumes.forEach(resume => {
            const score = resume.atsScore !== null ? Math.round(resume.atsScore) : 0;
            const badgeClass = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning text-dark' : 'bg-danger';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                        <span class="fw-medium text-light text-truncate" style="max-width: 250px;" title="${escapeHtml(resume.fileName)}">${escapeHtml(resume.fileName)}</span>
                    </div>
                </td>
                <td class="py-3 text-center">
                    <span class="badge ${badgeClass} px-2 py-1 fs-7" style="font-weight: 600;">${score}%</span>
                </td>
                <td class="py-3 text-end">
                    <button class="btn btn-sm btn-outline-danger px-2 border-0 delete-resume-btn" data-id="${resume.id}" title="Delete Resume">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            `;

            // Attach Delete Button event
            row.querySelector('.delete-resume-btn').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openDeleteConfirmation(id);
            });

            resumesTableBody.appendChild(row);
        });
    }

    /**
     * Open confirmation modal to delete a resume
     */
    function openDeleteConfirmation(id) {
        deleteTargetId = id;
        if (bsDeleteModal) {
            bsDeleteModal.show();
        }
    }

    /**
     * Delete resume via API call
     */
    async function deleteResume(id) {
        try {
            await API.deleteResume(id);
            Toast.show('Resume deleted successfully.', 'success');
            
            if (bsDeleteModal) {
                bsDeleteModal.hide();
            }

            // If the deleted resume matches the currently displayed analysis panel, hide it
            if (analysisResultPanel && !analysisResultPanel.classList.contains('d-none')) {
                // simple reference check can be added if needed, or we can just hide it
                analysisResultPanel.classList.add('d-none');
            }

            loadResumes();
        } catch (error) {
            console.error('Delete resume failed:', error);
            Toast.show(error.message || 'Could not delete resume.', 'danger');
        } finally {
            deleteTargetId = null;
        }
    }

    /**
     * Upload resume file via API call
     */
    async function uploadFile(file) {
        // Validation check
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            Toast.show('Only PDF files are supported.', 'warning');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.show('Max file size supported is 10MB.', 'warning');
            return;
        }

        setUploadingState(true);

        try {
            const data = await API.uploadResume(file);

            Toast.show('Resume uploaded and analyzed successfully!', 'success');
            displayAnalysisResults(data);
            loadResumes();
        } catch (error) {
            console.error('Upload resume failed:', error);
            Toast.show(error.message || 'Error occurred while parsing the resume.', 'danger');
        } finally {
            setUploadingState(false);
            if (fileInput) fileInput.value = ''; // Reset file input selection
        }
    }

    /**
     * Toggle uploading loader interface on Dropzone
     */
    function setUploadingState(isUploading) {
        if (!uploadDropzone) return;

        if (isUploading) {
            uploadDropzone.style.pointerEvents = 'none';
            uploadDropzone.innerHTML = `
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h3 class="h6 mb-2">Analyzing Resume...</h3>
                <p class="text-muted small mb-0">Our AI is parsing your skills and evaluating compatibility score.</p>
            `;
        } else {
            uploadDropzone.style.pointerEvents = 'auto';
            uploadDropzone.innerHTML = `
                <input type="file" id="fileInput" accept=".pdf" class="d-none">
                <i class="bi bi-file-earmark-pdf-fill text-secondary mb-3" style="font-size: 3.5rem; opacity: 0.7;"></i>
                <h3 class="h6 mb-2">Drag & Drop your Resume</h3>
                <p class="text-muted small mb-3">Only PDF files are supported (Max 10MB)</p>
                <button type="button" class="btn btn-outline-primary btn-sm px-4" id="browseBtn">
                    Browse File
                </button>
            `;
            // Re-bind file inputs after DOM structural changes
            fileInput = document.getElementById('fileInput');
            browseBtn = document.getElementById('browseBtn');
            if (browseBtn && fileInput) {
                browseBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        uploadFile(e.target.files[0]);
                    }
                });
            }
        }
    }

    /**
     * Populate newly uploaded resume analysis results in panel
     */
    function displayAnalysisResults(resume) {
        if (!analysisResultPanel) return;

        analysisResultPanel.classList.remove('d-none');

        const score = resume.atsScore !== null ? Math.round(resume.atsScore) : 0;
        const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

        if (resultAtsScore) resultAtsScore.textContent = `${score}%`;
        if (resultScoreBorder) resultScoreBorder.style.setProperty('border-color', `${color}`, 'important');

        if (resultFileName) resultFileName.textContent = resume.fileName || '-';
        if (resultFileSize) {
            const kbSize = resume.fileSize !== null ? (resume.fileSize / 1024).toFixed(1) : '0';
            resultFileSize.textContent = `${kbSize} KB`;
        }

        if (resultSkillsContainer) {
            resultSkillsContainer.innerHTML = '';
            const skills = resume.extractedSkills || [];

            if (skills.length === 0) {
                resultSkillsContainer.innerHTML = '<span class="text-muted small">No technical skills detected.</span>';
            } else {
                skills.forEach(skill => {
                    const tag = document.createElement('span');
                    tag.className = 'badge bg-primary text-light px-2 py-1 fs-8';
                    tag.style.fontWeight = '500';
                    tag.textContent = skill;
                    resultSkillsContainer.appendChild(tag);
                });
            }
        }
    }

    /**
     * Escape HTML content helper
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Load implementation
    document.addEventListener('DOMContentLoaded', init);

})();
