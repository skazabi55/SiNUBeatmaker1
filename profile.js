/**
 * BEATFORGE - Profile Page Logic
 */

const user = getCurrentUser();
if (!user) {
    window.location.href = 'index.html';
}

// Load profile data
function loadProfile() {
    const db = getDB();
    const dbUser = db.users.find(u => u.username === user.username);
    if (!dbUser) return;

    // Avatar - show photo or first letter
    const nickname = dbUser.nickname || dbUser.username;
    const avatar = document.getElementById('profileAvatar');
    const removeBtn = document.getElementById('avatarRemoveBtn');
    
    if (dbUser.avatarURL) {
        avatar.innerHTML = `<img src="${dbUser.avatarURL}" alt="Profil Fotoğrafı">`;
        if (removeBtn) removeBtn.style.display = 'flex';
    } else {
        avatar.innerHTML = '';
        avatar.textContent = nickname.charAt(0).toUpperCase();
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // Info
    document.getElementById('profileNickname').textContent = nickname;
    document.getElementById('profileUsername').textContent = '@' + dbUser.username;
    document.getElementById('profileEmail').textContent = dbUser.email || 'E-posta belirtilmemiş';

    // Edit form
    document.getElementById('editNickname').value = nickname;
    document.getElementById('editUsername').value = dbUser.username;
    document.getElementById('editEmail').value = dbUser.email || '';
    document.getElementById('editRole').value = dbUser.role === 'admin' ? 'Yönetici' : 'Kullanıcı';

    // Stats
    const myBeats = db.beats.filter(b => b.username === user.username);
    document.getElementById('statBeats').textContent = myBeats.length;

    let totalNotes = 0;
    let totalBpm = 0;
    myBeats.forEach(beat => {
        totalBpm += beat.bpm || 120;
        if (beat.data) {
            beat.data.forEach(track => {
                totalNotes += (track.activeSteps || []).length;
            });
        }
    });

    document.getElementById('statTotalSteps').textContent = totalNotes;
    document.getElementById('statAvgBpm').textContent = myBeats.length > 0 ? Math.round(totalBpm / myBeats.length) : 0;

    // Load beats grid
    loadBeatsGrid(myBeats);
}

// Load beats into the grid
function loadBeatsGrid(beats) {
    const grid = document.getElementById('beatsGrid');
    grid.innerHTML = '';

    if (beats.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🎵</div>
                <p>Henüz kaydettiğin bir beat yok.<br>Stüdyoya git ve ilk ritimlerini oluştur!</p>
                <a href="beatmaker.html">Stüdyoya Git →</a>
            </div>
        `;
        return;
    }

    beats.sort((a, b) => new Date(b.date) - new Date(a.date));

    beats.forEach(beat => {
        const card = document.createElement('div');
        card.className = 'beat-card';

        // Generate mini visualizer bars from beat data
        const vizBars = generateVizBars(beat);

        const dateStr = new Date(beat.date).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const instrumentCount = beat.data ? beat.data.filter(t => t.activeSteps && t.activeSteps.length > 0).length : 0;
        const noteCount = beat.data ? beat.data.reduce((sum, t) => sum + (t.activeSteps || []).length, 0) : 0;

        card.innerHTML = `
            <div class="beat-card-header">
                <span class="beat-card-title">${escapeHtml(beat.name)}</span>
                <span class="beat-card-bpm">${beat.bpm || 120} BPM</span>
            </div>
            <div class="beat-card-date">📅 ${dateStr} · 🎹 ${instrumentCount} enstrüman · 🎵 ${noteCount} nota</div>
            <div class="beat-visualizer">${vizBars}</div>
            <div class="beat-card-actions">
                <button class="btn-studio-beat" onclick="goToStudio('${beat.id}')">🎛️ Stüdyoda Aç</button>
                <button class="btn-delete-beat" onclick="deleteBeat('${beat.id}')">🗑️</button>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Generate visualization bars from beat data
function generateVizBars(beat) {
    const steps = 16;
    let bars = '';

    for (let i = 0; i < steps; i++) {
        let activeCount = 0;
        if (beat.data) {
            beat.data.forEach(track => {
                if (track.activeSteps && track.activeSteps.includes(i)) {
                    activeCount++;
                }
            });
        }
        const height = Math.max(4, activeCount * 8);
        const opacity = activeCount > 0 ? 0.4 + (activeCount * 0.15) : 0.15;
        bars += `<div class="viz-bar" style="height:${height}px; opacity:${opacity}"></div>`;
    }

    return bars;
}

// Go to studio and load beat
function goToStudio(beatId) {
    sessionStorage.setItem('loadBeatId', beatId);
    window.location.href = 'beatmaker.html';
}

// Delete beat
function deleteBeat(id) {
    if (!confirm('Bu beat\'i silmek istediğine emin misin?')) return;

    const db = getDB();
    db.beats = db.beats.filter(b => b.id !== id);
    saveDB(db);

    // Reload
    loadProfile();
}

// Save profile changes
function saveProfileChanges() {
    const newNickname = document.getElementById('editNickname').value.trim();
    if (!newNickname) {
        alert('Görünen ad boş olamaz!');
        return;
    }

    const db = getDB();
    const dbUser = db.users.find(u => u.username === user.username);
    if (dbUser) {
        dbUser.nickname = newNickname;
        saveDB(db);

        user.nickname = newNickname;
        setCurrentUser(user);

        loadProfile();
        alert('Profil güncellendi!');
    }
}

// Handle avatar upload
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Lütfen geçerli bir resim dosyası seçin!');
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Dosya boyutu 2MB\'den küçük olmalıdır!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // Resize image to reduce localStorage usage
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
            } else {
                if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataURL = canvas.toDataURL('image/jpeg', 0.85);

            // Save to DB
            const db = getDB();
            const dbUser = db.users.find(u => u.username === user.username);
            if (dbUser) {
                dbUser.avatarURL = dataURL;
                saveDB(db);
                loadProfile();
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
}

// Remove avatar
function removeAvatar() {
    if (!confirm('Profil fotoğrafını kaldırmak istediğine emin misin?')) return;

    const db = getDB();
    const dbUser = db.users.find(u => u.username === user.username);
    if (dbUser) {
        delete dbUser.avatarURL;
        saveDB(db);
        loadProfile();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Init
loadProfile();
