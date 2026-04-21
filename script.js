/**
 * SiNUbeatmaker - Script.js (Studio Logic)
 */

const user = getCurrentUser();
if (user) {
    document.getElementById('welcomeUser').textContent = `Hoş geldin, ${user.nickname || user.username}`;
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const dest = audioCtx.createMediaStreamDestination(); // For recording the mix

// Re-route SoundEngine to connect to both destination (speakers) and dest (recorder)
const connectToMix = (source) => {
    source.connect(audioCtx.destination);
    source.connect(dest);
}

const SoundEngine = {
    playKick: (time) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        connectToMix(gain);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time); osc.stop(time + 0.5);
    },
    playSnare: (time) => {
        const noiseOsc = audioCtx.createBufferSource();
        const bufferSize = audioCtx.sampleRate * 0.2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noiseOsc.buffer = buffer;
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1000;
        noiseOsc.connect(noiseFilter);
        const noiseEnvelope = audioCtx.createGain();
        noiseFilter.connect(noiseEnvelope);
        connectToMix(noiseEnvelope);
        noiseEnvelope.gain.setValueAtTime(1, time); noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noiseOsc.start(time);
        
        const osc = audioCtx.createOscillator(); const oscEnvelope = audioCtx.createGain();
        osc.type = 'triangle'; osc.connect(oscEnvelope); connectToMix(oscEnvelope);
        osc.frequency.setValueAtTime(250, time); oscEnvelope.gain.setValueAtTime(0.7, time);
        oscEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.start(time); osc.stop(time + 0.2);
    },
    playHihat: (time) => {
        const fundamental = 40; const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
        const bandpass = audioCtx.createBiquadFilter(); bandpass.type = "bandpass"; bandpass.frequency.value = 10000;
        const highpass = audioCtx.createBiquadFilter(); highpass.type = "highpass"; highpass.frequency.value = 7000;
        const gainNode = audioCtx.createGain();
        ratios.forEach((ratio) => {
            const osc = audioCtx.createOscillator(); osc.type = "square"; osc.frequency.value = fundamental * ratio;
            osc.connect(bandpass); bandpass.connect(highpass); highpass.connect(gainNode);
            osc.start(time); osc.stop(time + 0.05);
        });
        connectToMix(gainNode);
        gainNode.gain.setValueAtTime(0.3, time); gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    },
    playTom: (time) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); connectToMix(gain);
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, time); osc.frequency.exponentialRampToValueAtTime(50, time + 0.3);
        gain.gain.setValueAtTime(0.8, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time); osc.stop(time + 0.3);
    },
    playClap: (time) => {
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0, time);
        gain.gain.setValueAtTime(1, time); gain.gain.setTargetAtTime(0, time + 0.01, 0.01);
        gain.gain.setValueAtTime(1, time + 0.02); gain.gain.setTargetAtTime(0, time + 0.03, 0.01);
        gain.gain.setValueAtTime(1, time + 0.04); gain.gain.setTargetAtTime(0, time + 0.15, 0.03);
        noise.connect(filter); filter.connect(gain); connectToMix(gain);
        noise.start(time);
    },
    playOpenhat: (time) => {
        const fundamental = 40; const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
        const bandpass = audioCtx.createBiquadFilter(); bandpass.type = "bandpass"; bandpass.frequency.value = 8000;
        const highpass = audioCtx.createBiquadFilter(); highpass.type = "highpass"; highpass.frequency.value = 5000;
        const gainNode = audioCtx.createGain();
        ratios.forEach((ratio) => {
            const osc = audioCtx.createOscillator(); osc.type = "square"; osc.frequency.value = fundamental * ratio;
            osc.connect(bandpass); bandpass.connect(highpass); highpass.connect(gainNode);
            osc.start(time); osc.stop(time + 0.3);
        });
        connectToMix(gainNode);
        gainNode.gain.setValueAtTime(0.3, time); gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    },
    playPerc: (time) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); connectToMix(gain);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, time); osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
        gain.gain.setValueAtTime(0.5, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.start(time); osc.stop(time + 0.1);
    },
    playBass: (time) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); connectToMix(gain);
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(55, time);
        
        const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
        osc.disconnect(); osc.connect(filter); filter.connect(gain);
        
        gain.gain.setValueAtTime(0.8, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time); osc.stop(time + 0.3);
    }
};

const instrumentsMap = {
    'kick': SoundEngine.playKick,
    'snare': SoundEngine.playSnare,
    'hihat': SoundEngine.playHihat,
    'tom': SoundEngine.playTom,
    'clap': SoundEngine.playClap,
    'openhat': SoundEngine.playOpenhat,
    'perc': SoundEngine.playPerc,
    'bass': SoundEngine.playBass
};

// Custom Sounds from DB
async function loadCustomSoundsToGrid() {
    const db = getDB();
    const sequencer = document.getElementById('sequencer');
    
    for (const sound of db.customSounds) {
        if(document.querySelector(`.track[data-instrument="${sound.id}"]`)) continue;
        
        let audioBuffer = null;
        if (sound.type === 'file' && sound.dataURL) {
            try {
                const response = await fetch(sound.dataURL);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.error("Ses dosyası çözümlenemedi: ", sound.name, e);
            }
        }
        
        instrumentsMap[sound.id] = (time) => {
            if (audioBuffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                const gain = audioCtx.createGain();
                source.connect(gain);
                connectToMix(gain);
                gain.gain.setValueAtTime(0.8, time);
                source.start(time);
            } else {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.connect(gain);
                connectToMix(gain);
                osc.frequency.setValueAtTime(400, time);
                osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                osc.start(time); osc.stop(time + 0.2);
            }
        };
        
        const track = document.createElement('div');
        track.className = 'track custom-track';
        track.dataset.instrument = sound.id;
        track.innerHTML = `<div class="track-label">${sound.name}</div><div class="pads-container"></div>`;
        sequencer.appendChild(track);
        
        const container = track.querySelector('.pads-container');
        for (let i = 0; i < STEPS; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.step = i;
            pad.addEventListener('click', () => {
                pad.classList.toggle('active');
                if(pad.classList.contains('active')) {
                     if (audioCtx.state === 'suspended') audioCtx.resume();
                     instrumentsMap[sound.id](audioCtx.currentTime);
                     pad.classList.add('playing');
                     setTimeout(() => pad.classList.remove('playing'), 100);
                }
            });
            container.appendChild(pad);
        }
    }
}

// Sequencer
let STEPS = 16;
let isPlaying = false; let currentStep = 0; let bpm = 120; let nextNoteTime = 0.0; let timerID;

function renderGrid() {
    const stepIndicator = document.getElementById('stepIndicator');
    stepIndicator.innerHTML = '';
    for (let i = 0; i < STEPS; i++) {
        const dot = document.createElement('div'); dot.className = 'step-dot'; stepIndicator.appendChild(dot);
    }
    
    const stepNumbersContainer = document.getElementById('stepNumbersContainer');
    if (stepNumbersContainer) stepNumbersContainer.innerHTML = '';

    const tracks = document.querySelectorAll('.track');
    tracks.forEach(track => {
        // Skip the step indicator track
        if (track.classList.contains('step-indicator-track')) return;
        
        if (track.classList.contains('step-numbers-track')) {
            for (let i = 0; i < STEPS; i++) {
                const numPad = document.createElement('div');
                numPad.className = 'pad';
                numPad.style.background = 'transparent';
                numPad.style.border = 'none';
                numPad.style.color = 'var(--text-secondary)';
                numPad.style.fontSize = '0.8rem';
                numPad.style.display = 'flex';
                numPad.style.alignItems = 'center';
                numPad.style.justifyContent = 'center';
                numPad.style.cursor = 'default';
                numPad.innerText = (i + 1).toString();
                if (stepNumbersContainer) stepNumbersContainer.appendChild(numPad);
            }
            return;
        }
        
        const container = track.querySelector('.pads-container');
        if (!container) return;
        container.innerHTML = '';
        const instrument = track.dataset.instrument;
        for (let i = 0; i < STEPS; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad'; pad.dataset.step = i;
            if (instrument === 'kick' && (i % 16 === 0 || i % 16 === 4 || i % 16 === 8 || i % 16 === 12)) pad.classList.add('active');
            if (instrument === 'hihat' && (i % 2 === 0)) pad.classList.add('active');
            if (instrument === 'snare' && (i % 16 === 4 || i % 16 === 12)) pad.classList.add('active');
            
            pad.addEventListener('click', () => {
                pad.classList.toggle('active');
                if(pad.classList.contains('active')) {
                     if (audioCtx.state === 'suspended') audioCtx.resume();
                     if (instrumentsMap[instrument]) instrumentsMap[instrument](audioCtx.currentTime);
                     pad.classList.add('playing');
                     setTimeout(() => pad.classList.remove('playing'), 100);
                }
            });
            container.appendChild(pad);
        }
    });
}
renderGrid();
loadCustomSoundsToGrid();

const stepSelect = document.getElementById('stepSelect');
if (stepSelect) {
    stepSelect.addEventListener('change', (e) => {
        STEPS = parseInt(e.target.value);
        currentStep = 0;
        renderGrid();
        loadCustomSoundsToGrid();
    });
}

function nextNote() {
    const secondsPerBeat = 60.0 / bpm; nextNoteTime += 0.25 * secondsPerBeat;
    currentStep++; if (currentStep >= STEPS) currentStep = 0;
}

function scheduleNote(stepNumber, time) {
    requestAnimationFrame(() => {
        document.querySelectorAll('.step-dot').forEach((dot, idx) => {
            if (idx === stepNumber) dot.classList.add('active'); else dot.classList.remove('active');
        });
    });

    document.querySelectorAll('.track').forEach(track => {
        if (track.classList.contains('step-numbers-track')) return;
        const instrument = track.dataset.instrument;
        if (!instrument) return;
        const pads = track.querySelectorAll('.pad');
        const pad = pads[stepNumber];
        if (pad && pad.classList.contains('active')) {
            if (instrumentsMap[instrument]) instrumentsMap[instrument](time);
            requestAnimationFrame(() => {
                pad.classList.add('playing');
                setTimeout(() => pad.classList.remove('playing'), 100);
            });
        }
    });
}

function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleNote(currentStep, nextNoteTime); nextNote();
    }
    timerID = window.setTimeout(scheduler, 25.0);
}

// UI
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const bpmSlider = document.getElementById('bpmSlider');
const bpmValue = document.getElementById('bpmValue');

playBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isPlaying) return;
    isPlaying = true; currentStep = 0; nextNoteTime = audioCtx.currentTime + 0.05;
    scheduler();
    playBtn.innerText = '⏸';
    const vocalAudio = document.getElementById('vocalAudio');
    if (vocalAudio && vocalAudio.src) vocalAudio.play();
});

stopBtn.addEventListener('click', () => {
    isPlaying = false; window.clearTimeout(timerID); currentStep = 0;
    document.querySelectorAll('.step-dot').forEach(dot => dot.classList.remove('active'));
    playBtn.innerText = '▶';
    const vocalAudio = document.getElementById('vocalAudio');
    if (vocalAudio && vocalAudio.src) {
        vocalAudio.pause();
        vocalAudio.currentTime = 0;
    }
});

clearBtn.addEventListener('click', () => {
    document.querySelectorAll('.pad').forEach(pad => pad.classList.remove('active'));
});

bpmSlider.addEventListener('input', (e) => { bpm = parseInt(e.target.value); bpmValue.textContent = bpm; });

// --- Save & Load Beats ---
document.getElementById('saveBeatBtn').addEventListener('click', () => {
    const name = prompt('Ritmin için bir isim belirle:');
    if (!name) return;
    
    const beatData = [];
    document.querySelectorAll('.track').forEach(track => {
        const instrument = track.dataset.instrument;
        const activeSteps = [];
        track.querySelectorAll('.pad').forEach((pad, idx) => {
            if (pad.classList.contains('active')) activeSteps.push(idx);
        });
        beatData.push({ instrument, activeSteps });
    });
    
    const db = getDB();
    db.beats.push({
        id: 'beat_' + Date.now(),
        username: user.username,
        name: name,
        data: beatData,
        bpm: bpm,
        date: new Date().toISOString()
    });
    saveDB(db);
    alert('Ritim başarıyla kaydedildi!');
});

function showMyBeats() {
    const db = getDB();
    const myBeats = db.beats.filter(b => b.username === user.username);
    const list = document.getElementById('beatsList');
    list.innerHTML = '';
    
    if(myBeats.length === 0) {
        list.innerHTML = '<li>Henüz kaydedilmiş bir ritmin yok.</li>';
    } else {
        myBeats.forEach(beat => {
            const li = document.createElement('li');
            li.style.flexDirection = 'column';
            li.style.alignItems = 'flex-start';
            li.innerHTML = `
                <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <strong>${beat.name} (${beat.bpm} BPM)</strong>
                    <span style="font-size:0.8rem; color:#aaa;">${new Date(beat.date).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
                    <button class="btn-primary btn-sm" onclick="loadBeat('${beat.id}')">Stüdyoya Yükle</button>
                    <button class="btn-secondary btn-sm" onclick="autoRecordBeat('${beat.id}')" style="background:rgba(59, 130, 246, 0.2); border-color:#3b82f6; color:#3b82f6;">Sesi İndir (MP3)</button>
                    <button class="btn-danger btn-sm" onclick="deleteBeat('${beat.id}')" style="margin-left:auto;">Sil</button>
                </div>
            `;
            list.appendChild(li);
        });
    }
    document.getElementById('myBeatsModal').style.display = 'flex';
}

function downloadBeatData(id) {
    const db = getDB();
    const beat = db.beats.find(b => b.id === id);
    if (!beat) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(beat, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `SiNUbeatmaker_proje_${beat.name.replace(/\s+/g, '_')}.json`;
    a.click();
}

function autoRecordBeat(id) {
    closeModal();
    loadBeat(id);
    
    setTimeout(() => {
        const btn = document.getElementById('recordBeatOnlyBtn');
        if (!mediaRecorder || mediaRecorder.state !== 'recording') {
            btn.click();
        }
        
        setTimeout(() => {
            const playBtn = document.getElementById('playBtn');
            if (!isPlaying) playBtn.click();
            
            const bpm = parseInt(document.getElementById('bpmSlider').value);
            const loopTime = (60 / bpm) * 4 * 1000;
            const recordingDuration = loopTime * 2 + 500; // 2 loops
            
            alert(`Sistem otomatik olarak ritminizi kaydediyor... Lütfen bekleyin (${Math.round(recordingDuration/1000)} saniye). Sesiniz indirme bölgesine düşecektir.`);
            
            setTimeout(() => {
                if (isPlaying) document.getElementById('stopBtn').click();
                if (mediaRecorder && mediaRecorder.state === 'recording') btn.click();
            }, recordingDuration);
        }, 500);
    }, 500);
}

function closeModal() { document.getElementById('myBeatsModal').style.display = 'none'; }

function loadBeat(id) {
    const db = getDB();
    const beat = db.beats.find(b => b.id === id);
    if (!beat) return;
    
    // Clear current
    document.querySelectorAll('.pad').forEach(pad => pad.classList.remove('active'));
    
    // Set BPM
    bpm = beat.bpm || 120;
    bpmSlider.value = bpm;
    bpmValue.textContent = bpm;
    
    // Load pads
    beat.data.forEach(trackData => {
        const track = document.querySelector(`.track[data-instrument="${trackData.instrument}"]`);
        if (track) {
            const pads = track.querySelectorAll('.pad');
            trackData.activeSteps.forEach(step => {
                if(pads[step]) pads[step].classList.add('active');
            });
        }
    });
    
    closeModal();
}

function deleteBeat(id) {
    if(confirm('Ritmi silmek istediğine emin misin?')) {
        const db = getDB();
        db.beats = db.beats.filter(b => b.id !== id);
        saveDB(db);
        showMyBeats();
    }
}

// --- Audio Recording & External Vocal ---
const vocalUpload = document.getElementById('vocalUpload');
const vocalAudio = document.getElementById('vocalAudio');
let vocalSourceNode = null;

vocalUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        vocalAudio.src = url;
        vocalAudio.style.display = 'block';
        
        if (!vocalSourceNode) {
            vocalSourceNode = audioCtx.createMediaElementSource(vocalAudio);
            vocalSourceNode.connect(audioCtx.destination);
            vocalSourceNode.connect(dest);
        }
    }
});

let mediaRecorder;
let recordedChunks = [];
const recordBtn = document.getElementById('recordBtn');
const recordBeatOnlyBtn = document.getElementById('recordBeatOnlyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const audioPlayback = document.getElementById('audioPlayback');
const playbackContainer = document.getElementById('playbackContainer');

let recordingTimerInterval;
let recordingSeconds = 0;

function formatTimer(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function startRecordingTimer() {
    recordingSeconds = 0;
    const timerDisplay = document.getElementById('recordTimer');
    if (timerDisplay) {
        timerDisplay.style.display = 'block';
        timerDisplay.innerText = `Kayıt: ${formatTimer(recordingSeconds)}`;
        recordingTimerInterval = setInterval(() => {
            recordingSeconds++;
            timerDisplay.innerText = `Kayıt: ${formatTimer(recordingSeconds)}`;
        }, 1000);
    }
}

function stopRecordingTimer() {
    clearInterval(recordingTimerInterval);
    const timerDisplay = document.getElementById('recordTimer');
    if (timerDisplay) timerDisplay.style.display = 'none';
}

function setupMediaRecorder(micStream) {
    mediaRecorder = new MediaRecorder(dest.stream);
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        audioPlayback.src = url;
        playbackContainer.style.display = 'block';
        
        downloadBtn.style.display = 'flex';
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = `SiNUbeatmaker_mix_${Date.now()}.mp3`;
            a.click();
        };
        
        if (micStream) micStream.getTracks().forEach(track => track.stop());
        stopRecordingTimer();
    };
    
    mediaRecorder.start();
    startRecordingTimer();
}

function startRecording(withMic, btn) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playbackContainer.style.display = 'none';
    downloadBtn.style.display = 'none';
    
    if (withMic) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(micStream => {
            const micSource = audioCtx.createMediaStreamSource(micStream);
            micSource.connect(audioCtx.destination);
            micSource.connect(dest);
            setupMediaRecorder(micStream);
            btn.innerHTML = 'Kaydı Durdur';
            btn.style.color = '#10b981';
        }).catch(err => alert('Mikrofon erişimi reddedildi.'));
    } else {
        setupMediaRecorder(null);
        btn.innerHTML = 'Kaydı Durdur';
        btn.style.color = '#10b981';
    }
}

recordBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordBtn.innerHTML = '<span class="record-dot"></span> Canlı Kayıt (Mikrofon ile Oku)';
        recordBtn.style.color = '#ef4444';
    } else {
        startRecording(true, recordBtn);
    }
});

recordBeatOnlyBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordBeatOnlyBtn.innerHTML = '<span class="record-dot" style="background:#3b82f6; box-shadow: 0 0 8px #3b82f6;"></span> Sadece Sistem Sesini Kaydet';
        recordBeatOnlyBtn.style.color = '#3b82f6';
    } else {
        startRecording(false, recordBeatOnlyBtn);
    }
});

// --- Settings & Nickname ---
function showSettings() {
    document.getElementById('nicknameInput').value = user.nickname || user.username;
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveNickname() {
    const newNickname = document.getElementById('nicknameInput').value.trim();
    if (!newNickname) return;
    
    // Update DB
    const db = getDB();
    const dbUser = db.users.find(u => u.username === user.username);
    if (dbUser) {
        dbUser.nickname = newNickname;
        saveDB(db);
        
        // Update current session
        user.nickname = newNickname;
        setCurrentUser(user);
        
        // Update UI
        document.getElementById('welcomeUser').textContent = `Hoş geldin, ${user.nickname}`;
        closeSettingsModal();
        alert('Görünen adın güncellendi!');
    }
}

function deleteCurrentRecording() {
    if(confirm('Yeni oluşturduğun bu ses kaydını tamamen silmek istediğine emin misin?')) {
        document.getElementById('playbackContainer').style.display = 'none';
        document.getElementById('audioPlayback').src = '';
        document.getElementById('downloadBtn').style.display = 'none';
        recordedChunks = [];
    }
}
