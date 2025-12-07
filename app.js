// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker enregistré:', reg))
            .catch(err => console.error('Erreur Service Worker:', err));
    });
}

// Variables globales
let audioRecorder = null;
let audioChunks = [];
let videoRecorder = null;
let videoChunks = [];
let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');

// Installation du PWA
let deferredPrompt;
const installMessage = document.getElementById('installMessage');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installMessage.style.display = 'block';

    installMessage.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Installation: ${outcome}`);
            deferredPrompt = null;
            installMessage.style.display = 'none';
        }
    });
});

// ========== AUDIO ==========
const audioBtn = document.getElementById('audioBtn');
const audioStatus = document.getElementById('audioStatus');
const audioPlayback = document.getElementById('audioPlayback');

audioBtn.addEventListener('click', async () => {
    if (!audioRecorder || audioRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioRecorder = new MediaRecorder(stream);
            audioChunks = [];

            audioRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            audioRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioUrl;
                audioPlayback.style.display = 'block';

                saveRecording('audio', audioBlob);
                showStatus(audioStatus, 'Enregistrement audio sauvegardé !', 'success');

                stream.getTracks().forEach(track => track.stop());
            };

            audioRecorder.start();
            audioBtn.textContent = 'Arrêter l\'enregistrement';
            audioBtn.classList.add('recording');
            showStatus(audioStatus, 'Enregistrement en cours...', 'info');
        } catch (err) {
            showStatus(audioStatus, 'Erreur: ' + err.message, 'error');
        }
    } else {
        audioRecorder.stop();
        audioBtn.textContent = 'Enregistrer Audio';
        audioBtn.classList.remove('recording');
    }
});

// ========== VIDÉO ==========
const videoBtn = document.getElementById('videoBtn');
const videoStatus = document.getElementById('videoStatus');
const videoPreview = document.getElementById('videoPreview');

videoBtn.addEventListener('click', async () => {
    if (!videoRecorder || videoRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            videoRecorder = new MediaRecorder(stream);
            videoChunks = [];

            videoRecorder.ondataavailable = (e) => {
                videoChunks.push(e.data);
            };

            videoRecorder.onstop = () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(videoBlob);
                videoPreview.src = videoUrl;
                videoPreview.style.display = 'block';

                saveRecording('video', videoBlob);
                showStatus(videoStatus, 'Enregistrement vidéo sauvegardé !', 'success');

                stream.getTracks().forEach(track => track.stop());
            };

            videoRecorder.start();
            videoBtn.textContent = 'Arrêter l\'enregistrement';
            videoBtn.classList.add('recording');
            showStatus(videoStatus, 'Enregistrement en cours...', 'info');
        } catch (err) {
            showStatus(videoStatus, 'Erreur: ' + err.message, 'error');
        }
    } else {
        videoRecorder.stop();
        videoBtn.textContent = 'Enregistrer Vidéo';
        videoBtn.classList.remove('recording');
    }
});

// ========== IMAGE ==========
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const imageStatus = document.getElementById('imageStatus');
const imagePreview = document.getElementById('imagePreview');

imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';

            saveRecording('image', file);
            showStatus(imageStatus, 'Image sauvegardée !', 'success');
        };
        reader.readAsDataURL(file);
    }
});

// ========== TEXTE ==========
const textBtn = document.getElementById('textBtn');
const textInput = document.getElementById('textInput');
const textStatus = document.getElementById('textStatus');

textBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        saveRecording('text', text);
        showStatus(textStatus, 'Texte sauvegardé !', 'success');
        textInput.value = '';
    } else {
        showStatus(textStatus, 'Veuillez entrer du texte', 'error');
    }
});

// ========== FONCTIONS UTILITAIRES ==========
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

async function saveRecording(type, data) {
    const recording = {
        id: Date.now(),
        type: type,
        date: new Date().toLocaleString('fr-FR'),
        data: type === 'text' ? data : null
    };

    // Pour les fichiers blob, on les stocke dans IndexedDB
    if (type !== 'text') {
        await saveToIndexedDB(recording.id, data);
    }

    recordings.unshift(recording);
    localStorage.setItem('recordings', JSON.stringify(recordings));
    displayRecordings();
}

function displayRecordings() {
    const list = document.getElementById('recordingsList');
    if (recordings.length === 0) {
        list.innerHTML = '<p style="color:#999;">Aucun enregistrement pour le moment.</p>';
        return;
    }

    list.innerHTML = recordings.map(rec => `
        <div class="recording-item">
            <div>
                <strong>${getTypeIcon(rec.type)} ${rec.type.toUpperCase()}</strong>
                <br>
                <small>${rec.date}</small>
                ${rec.type === 'text' ? `<br><small>${rec.data.substring(0, 50)}...</small>` : ''}
            </div>
            <button onclick="deleteRecording(${rec.id})">Supprimer</button>
        </div>
    `).join('');
}

function getTypeIcon(type) {
    const icons = {
        audio: '🎤',
        video: '🎥',
        image: '📷',
        text: '📝'
    };
    return icons[type] || '📄';
}

function deleteRecording(id) {
    recordings = recordings.filter(rec => rec.id !== id);
    localStorage.setItem('recordings', JSON.stringify(recordings));
    deleteFromIndexedDB(id);
    displayRecordings();
}

// ========== INDEXEDDB ==========
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemiaDB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('recordings')) {
                db.createObjectStore('recordings', { keyPath: 'id' });
            }
        };
    });
}

async function saveToIndexedDB(id, blob) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        await store.put({ id, blob });
    } catch (err) {
        console.error('Erreur IndexedDB:', err);
    }
}

async function deleteFromIndexedDB(id) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        await store.delete(id);
    } catch (err) {
        console.error('Erreur IndexedDB:', err);
    }
}

// Initialisation
displayRecordings();
