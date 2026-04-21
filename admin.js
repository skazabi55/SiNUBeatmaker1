document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadCustomSounds();

    const addSoundForm = document.getElementById('addSoundForm');
    if (addSoundForm) {
        addSoundForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('soundName').value.trim();
            const fileInput = document.getElementById('soundFile');
            
            if (fileInput.files.length === 0) return;
            const file = fileInput.files[0];
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Dosya çok büyük! Lütfen 2MB altı bir dosya yükleyin.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataURL = evt.target.result;
                const db = getDB();
                db.customSounds.push({
                    id: 'sound_' + Date.now(),
                    name: name,
                    type: 'file',
                    dataURL: dataURL,
                    addedBy: getCurrentUser().username
                });
                try {
                    saveDB(db);
                    document.getElementById('soundName').value = '';
                    fileInput.value = '';
                    loadCustomSounds();
                    alert('Yeni ses dosyası başarıyla eklendi!');
                } catch (err) {
                    alert('Hata! Depolama alanı dolmuş olabilir (LocalStorage limiti). Daha küçük bir dosya deneyin.');
                }
            };
            reader.readAsDataURL(file);
        });
    }
});

function loadUsers() {
    const db = getDB();
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '';
    
    db.users.forEach(user => {
        const userBeatsCount = db.beats.filter(b => b.username === user.username).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td><span class="badge ${user.role}">${user.role}</span></td>
            <td>${userBeatsCount}</td>
            <td>
                ${user.role !== 'admin' ? `<button class="btn-danger btn-sm" onclick="deleteUser('${user.username}')">Sil</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteUser(username) {
    if (confirm(`${username} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
        const db = getDB();
        db.users = db.users.filter(u => u.username !== username);
        db.beats = db.beats.filter(b => b.username !== username);
        saveDB(db);
        loadUsers();
    }
}

function loadCustomSounds() {
    const db = getDB();
    const list = document.getElementById('customSoundsList');
    list.innerHTML = '';
    
    db.customSounds.forEach(sound => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${sound.name} (${sound.type})</span>
            <button class="btn-danger btn-sm" onclick="deleteSound('${sound.id}')">Sil</button>
        `;
        list.appendChild(li);
    });
}

function deleteSound(id) {
    if (confirm(`Bu sesi silmek istediğinize emin misiniz?`)) {
        const db = getDB();
        db.customSounds = db.customSounds.filter(s => s.id !== id);
        saveDB(db);
        loadCustomSounds();
    }
}
