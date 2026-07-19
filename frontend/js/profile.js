/**
 * ═══════════════════════════════════════════════════════════════════
 * PROFILE DASHBOARD — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const profileName       = document.getElementById('profileName');
const profileEmail      = document.getElementById('profileEmail');
const profileRole       = document.getElementById('profileRole');
const profileInitials   = document.getElementById('profileInitials');
const profileJoinedDate = document.getElementById('profileJoinedDate');
const currentDateEl     = document.getElementById('currentDate');

const statsSkeleton     = document.getElementById('statsSkeleton');
const statsContent      = document.getElementById('statsContent');

const statInterviews    = document.getElementById('statInterviews');
const statAverage       = document.getElementById('statAverage');
const statBest          = document.getElementById('statBest');
const statResumes       = document.getElementById('statResumes');

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize Components
    Sidebar.init();
    setCurrentDate();

    // 3. Load Static Profile Data
    populateProfileData();

    // 4. Fetch Dynamic Performance Data
    loadPerformanceStats();

    // 5. Bind Forms
    const pwdForm = document.getElementById('changePasswordForm');
    if (pwdForm) {
        pwdForm.addEventListener('submit', handleChangePassword);
    }
    
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditProfile);
    }
});

// ── Edit Profile Logic ──────────────────────────────────────────────
async function handleEditProfile(event) {
    event.preventDefault();

    const nameInput = document.getElementById('editProfileName').value;
    const fileInput = document.getElementById('editProfileImage');
    const file = fileInput.files[0];
    const btn = document.getElementById('saveProfileBtn');

    if (!nameInput && !file) {
        Toast.show('Please provide a name or select an image to update.', 'warning');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const result = await API.updateProfile(nameInput, file);

        // Update local storage
        if (result.name) {
            localStorage.setItem('name', result.name);
        }
        if (result.profileImageUrl) {
            localStorage.setItem('profileImageUrl', 'http://localhost:8080' + result.profileImageUrl);
        }

        // Hide modal
        const modalEl = document.getElementById('editProfileModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        Toast.show('Profile updated successfully!', 'success');
        document.getElementById('editProfileForm').reset();
        
        // Refresh UI
        populateProfileData();
        
        // Update sidebar DOM directly
        const sidebarNameEl = document.querySelector('.sidebar-user-name');
        if (sidebarNameEl) {
            const rawName = localStorage.getItem('name') || '';
            sidebarNameEl.textContent = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        }
        
        // Also update sidebar avatar
        const sidebarAvatarEl = document.querySelector('.sidebar-user-avatar');
        const profileImgUrl = localStorage.getItem('profileImageUrl');
        if (sidebarAvatarEl && profileImgUrl && profileImgUrl !== 'null' && profileImgUrl !== 'undefined') {
            sidebarAvatarEl.innerHTML = `<img src="${profileImgUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }

    } catch (error) {
        console.error('Profile update failed:', error);
        Toast.show(error.message || 'Failed to update profile.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
    }
}

// ── Password Logic ──────────────────────────────────────────────────
async function handleChangePassword(event) {
    event.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    const btn = document.getElementById('savePasswordBtn');
    
    // Validate match
    if (newPassword !== confirmPassword) {
        confirmInput.classList.add('is-invalid');
        return;
    } else {
        confirmInput.classList.remove('is-invalid');
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        await API.changePassword(oldPassword, newPassword);
        
        // Hide modal
        const modalEl = document.getElementById('changePasswordModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        Toast.show('Password updated successfully!', 'success');
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        console.error('Password change failed:', error);
        Toast.show(error.message || 'Failed to update password.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Update Password';
    }
}

// ── Data Population ─────────────────────────────────────────────────
function populateProfileData() {
    const email = localStorage.getItem('email') || 'user@example.com';
    const fallbackName = email.split('@')[0];
    
    // Read the new 'name' field, or fallback
    const rawName = localStorage.getItem('name') || fallbackName;
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    // Clean up ROLE_ prefix if it exists
    let role = localStorage.getItem('role') || 'Candidate';
    if (role.startsWith('ROLE_')) {
        role = role.replace('ROLE_', '');
    }

    profileName.textContent = name;
    profileEmail.textContent = email;
    profileRole.textContent = role;
    
    const profileImgUrl = localStorage.getItem('profileImageUrl');
    const profileImageEl = document.getElementById('profileImage');
    
    if (profileImgUrl && profileImgUrl !== 'null' && profileImgUrl !== 'undefined') {
        profileInitials.classList.add('d-none');
        profileImageEl.classList.remove('d-none');
        profileImageEl.src = profileImgUrl;
    } else {
        // Extract Initials (up to 2 chars)
        const initials = name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
        profileInitials.textContent = initials || 'U';
        profileInitials.classList.remove('d-none');
        profileImageEl.classList.add('d-none');
    }

    // Format joined date if available
    const rawDate = localStorage.getItem('createdAt');
    if (rawDate && rawDate !== 'undefined') {
        const date = new Date(rawDate);
        profileJoinedDate.textContent = date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } else {
        profileJoinedDate.textContent = 'Data not available (Please re-login)';
    }
}

async function loadPerformanceStats() {
    try {
        const dashboardData = await API.getDashboard();
        
        // Hide Skeleton, Show Content
        statsSkeleton.classList.add('d-none');
        statsContent.classList.remove('d-none');

        // Animate numbers
        animateCounter(statInterviews, dashboardData.totalInterviews || 0);
        animateCounter(statResumes, dashboardData.totalResumes || 0);
        animateCounter(statAverage, Math.round(dashboardData.averageScore || 0));
        animateCounter(statBest, Math.round(dashboardData.bestScore || 0));

    } catch (error) {
        console.error('Failed to load profile stats:', error);
        Toast.show('Failed to load performance overview.', 'danger');
        
        // Still show the UI but with 0s if it fails
        statsSkeleton.classList.add('d-none');
        statsContent.classList.remove('d-none');
    }
}

// ── Utilities ───────────────────────────────────────────────────────
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
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
        
        element.textContent = currentVal;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
