const DB_KEY = 'sinubeatmaker_db_v2';

function getDB() {
    let db = localStorage.getItem(DB_KEY);
    if (!db) {
        // admin pass is "admin", sha256: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
        db = {
            users: [], // { username, passwordHash, role }
            beats: [], // { id, username, name, data, date }
            customSounds: [] // { id, name, type, addedBy }
        };
        db.users.push({
            username: 'admin',
            nickname: 'Sistem Yöneticisi',
            passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
            role: 'admin'
        });
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } else {
        db = JSON.parse(db);
    }
    return db;
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function logoutUser() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Ensure user is logged in for protected pages
function checkAuth(requireAdmin = false) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    if (requireAdmin && user.role !== 'admin') {
        window.location.href = 'beatmaker.html';
    }
}

// --- Theme Handling ---
function applySavedTheme() {
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('site_theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('site_theme', 'light');
    }
}

// Apply theme immediately on load
applySavedTheme();
