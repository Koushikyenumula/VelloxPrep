/**
 * ═══════════════════════════════════════════════════════════════════
 * ADMIN DASHBOARD — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const loadingSkeleton  = document.getElementById('loadingSkeleton');
const errorState       = document.getElementById('errorState');
const adminContent     = document.getElementById('adminContent');
const currentDateEl    = document.getElementById('currentDate');

const totalUsersEl     = document.getElementById('totalUsers');
const totalResumesEl   = document.getElementById('totalResumes');
const totalSessionsEl  = document.getElementById('totalSessions');
const averageScoreEl   = document.getElementById('averageScore');

const usersListBody    = document.getElementById('usersListBody');
const emptyUsers       = document.getElementById('emptyUsers');

const deleteUserName   = document.getElementById('deleteUserName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// ── State Variables ─────────────────────────────────────────────────
let userToDeleteId = null;
let deleteModalInstance = null;

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth & Role Guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }
    if (localStorage.getItem('role') !== 'ADMIN') {
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. Initialize Components
    Sidebar.init();
    setCurrentDate();

    // 3. Initialize Modal
    const deleteModalEl = document.getElementById('deleteUserModal');
    if (deleteModalEl) {
        deleteModalInstance = new bootstrap.Modal(deleteModalEl);
    }

    // 4. Bind Events
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteUser);
    }

    // 5. Load Data
    loadAdminData();
});

// ── Main Data Loading ───────────────────────────────────────────────
async function loadAdminData() {
    showLoading();

    try {
        const [stats, users] = await Promise.all([
            API.getAdminStatistics(),
            API.getAdminUsers()
        ]);

        renderStatistics(stats);
        renderUsers(users);

        showContent();
    } catch (error) {
        console.error('Failed to load admin data:', error);
        showError();
    }
}

// ── Render Helpers ──────────────────────────────────────────────────
function renderStatistics(stats) {
    if (!stats) return;
    animateCounter(totalUsersEl, stats.totalUsers || 0);
    animateCounter(totalResumesEl, stats.totalResumes || 0);
    animateCounter(totalSessionsEl, stats.totalSessions || 0);
    animateCounter(averageScoreEl, Math.round(stats.averageScore || 0));
}

function renderUsers(users) {
    usersListBody.innerHTML = '';

    if (!users || users.length === 0) {
        emptyUsers.classList.remove('d-none');
        return;
    }

    emptyUsers.classList.add('d-none');

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // Format Date
        let dateStr = '—';
        if (user.createdAt) {
            dateStr = new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }

        // Role Badge
        const role = user.role || 'USER';
        const badgeClass = role === 'ADMIN' ? 'role-admin' : 'role-user';
        
        // Role Actions
        const isSelf = user.email === localStorage.getItem('email');
        let actionHtml = '';
        
        if (isSelf) {
            actionHtml = `<button class="btn btn-sm btn-outline-secondary" disabled title="Cannot modify yourself">Current User</button>`;
        } else {
            const roleBtn = role === 'ADMIN'
                ? `<button class="btn btn-sm btn-outline-warning me-2" onclick="handleRoleChange(${user.id}, 'USER')">Make User</button>`
                : `<button class="btn btn-sm btn-outline-success me-2" onclick="handleRoleChange(${user.id}, 'ADMIN')">Make Admin</button>`;
            
            const delBtn = `<button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(${user.id}, '${escapeHtml(user.name)}')">Delete</button>`;
            actionHtml = roleBtn + delBtn;
        }

        tr.innerHTML = `
            <td class="fw-medium">${escapeHtml(user.name)}</td>
            <td class="text-secondary">${escapeHtml(user.email)}</td>
            <td><span class="badge-role ${badgeClass}">${role}</span></td>
            <td class="text-secondary">${dateStr}</td>
            <td class="text-center">${user.resumeCount || 0}</td>
            <td class="text-center">${user.sessionCount || 0}</td>
            <td class="text-end">${actionHtml}</td>
        `;

        usersListBody.appendChild(tr);
    });
}

// ── Update Role Logic ───────────────────────────────────────────────
window.handleRoleChange = async function(userId, newRole) {
    try {
        await API.updateUserRole(userId, newRole);
        Toast.show(`User role updated to ${newRole}`, 'success');
        await loadAdminData();
    } catch (error) {
        console.error('Failed to update role:', error);
        Toast.show(error.message || 'Failed to update user role', 'danger');
    }
};

// ── Delete User Logic ───────────────────────────────────────────────
function openDeleteModal(userId, userName) {
    userToDeleteId = userId;
    deleteUserName.textContent = userName;
    if (deleteModalInstance) {
        deleteModalInstance.show();
    }
}

async function handleDeleteUser() {
    if (!userToDeleteId) return;

    // Show loading state on button
    const originalText = confirmDeleteBtn.innerHTML;
    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Deleting...';
    confirmDeleteBtn.disabled = true;

    try {
        await API.deleteUser(userToDeleteId);
        Toast.show('User successfully deleted', 'success');
        
        // Hide modal and refresh data
        if (deleteModalInstance) {
            deleteModalInstance.hide();
        }
        await loadAdminData();

    } catch (error) {
        console.error('Delete failed:', error);
        Toast.show(error.message || 'Failed to delete user', 'danger');
    } finally {
        // Restore button state
        confirmDeleteBtn.innerHTML = originalText;
        confirmDeleteBtn.disabled = false;
        userToDeleteId = null;
    }
}

// ── View State Handlers ─────────────────────────────────────────────
function showLoading() {
    loadingSkeleton.classList.remove('d-none');
    adminContent.classList.add('d-none');
    errorState.classList.add('d-none');
}

function showContent() {
    loadingSkeleton.classList.add('d-none');
    adminContent.classList.remove('d-none');
    errorState.classList.add('d-none');
}

function showError() {
    loadingSkeleton.classList.add('d-none');
    adminContent.classList.add('d-none');
    errorState.classList.remove('d-none');
}

// ── Utilities ───────────────────────────────────────────────────────
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function animateCounter(element, target, duration = 1500) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // ease-out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.round(start + ease * (target - start));
        
        // Preserve unit span if present (like the % in Average Score)
        const unitMatch = element.innerHTML.match(/(<span.*?<\/span>)/i);
        if (unitMatch) {
            element.innerHTML = `${currentVal}${unitMatch[1]}`;
        } else {
            element.textContent = currentVal;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
