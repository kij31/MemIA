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
let currentEditingId = null;

// Liste des occasions (pour la liste déroulante)
const occasions = [
    'Mariage',
    'Anniversaire',
    'Baptême',
    'Communion',
    'Fête familiale',
    'Réunion',
    'Conférence',
    'Interview',
    'Témoignage',
    'Formation',
    'Autre'
];

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

// ========== MODAL DE VALIDATION ==========
const modal = document.getElementById('validationModal');
const modalClose = document.getElementById('modalClose');
const validationForm = document.getElementById('validationForm');

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

validationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveValidation();
});

// Autocomplétion pour le champ Nom
const nomInput = document.getElementById('nomContributeur');
const nomDatalist = document.getElementById('nomSuggestions');

nomInput.addEventListener('input', () => {
    updateNomSuggestions();
});

function updateNomSuggestions() {
    const noms = new Set();
    recordings.forEach(rec => {
        if (rec.metadata && rec.metadata.nom) {
            noms.add(rec.metadata.nom);
        }
    });

    nomDatalist.innerHTML = '';
    noms.forEach(nom => {
        const option = document.createElement('option');
        option.value = nom;
        nomDatalist.appendChild(option);
    });
}

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
        status: 'pending', // pending, validated, error
        data: type === 'text' ? data : null,
        metadata: {
            nom: '',
            prenom: '',
            dateEvenement: '',
            lieuEvenement: '',
            occasion: ''
        }
    };

    // Pour les fichiers blob, on les stocke dans IndexedDB
    if (type !== 'text') {
        await saveToIndexedDB(recording.id, data);
    }

    recordings.unshift(recording);
    localStorage.setItem('recordings', JSON.stringify(recordings));
    displayRecordings();
}

function openValidationModal(id) {
    currentEditingId = id;
    const recording = recordings.find(r => r.id === id);

    if (recording) {
        // Pré-remplir le formulaire
        document.getElementById('nomContributeur').value = recording.metadata.nom || '';
        document.getElementById('prenomContributeur').value = recording.metadata.prenom || '';
        document.getElementById('dateEvenement').value = recording.metadata.dateEvenement || '';
        document.getElementById('lieuEvenement').value = recording.metadata.lieuEvenement || '';
        document.getElementById('occasionEvenement').value = recording.metadata.occasion || '';

        modal.style.display = 'flex';
        updateNomSuggestions();
    }
}

function closeModal() {
    modal.style.display = 'none';
    validationForm.reset();
    currentEditingId = null;
}

function saveValidation() {
    if (!currentEditingId) return;

    const recording = recordings.find(r => r.id === currentEditingId);
    if (recording) {
        recording.metadata = {
            nom: document.getElementById('nomContributeur').value.trim(),
            prenom: document.getElementById('prenomContributeur').value.trim(),
            dateEvenement: document.getElementById('dateEvenement').value,
            lieuEvenement: document.getElementById('lieuEvenement').value.trim(),
            occasion: document.getElementById('occasionEvenement').value
        };

        // Passer en statut validé
        recording.status = 'validated';

        localStorage.setItem('recordings', JSON.stringify(recordings));
        displayRecordings();
        closeModal();
    }
}

function changeStatus(id, newStatus) {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
        recording.status = newStatus;
        localStorage.setItem('recordings', JSON.stringify(recordings));
        displayRecordings();
    }
}

async function playRecording(id) {
    const recording = recordings.find(r => r.id === id);
    if (!recording) return;

    if (recording.type === 'text') {
        alert(recording.data);
    } else {
        // Récupérer le blob depuis IndexedDB
        const blob = await getFromIndexedDB(id);
        if (blob) {
            const url = URL.createObjectURL(blob);

            // Créer un élément de lecture temporaire
            let player;
            if (recording.type === 'audio') {
                player = document.createElement('audio');
            } else if (recording.type === 'video') {
                player = document.createElement('video');
            } else if (recording.type === 'image') {
                window.open(url, '_blank');
                return;
            }

            if (player) {
                player.controls = true;
                player.src = url;
                player.style.maxWidth = '100%';

                const playerContainer = document.getElementById('playerContainer');
                playerContainer.innerHTML = '';
                playerContainer.appendChild(player);
                playerContainer.style.display = 'block';
                player.play();
            }
        }
    }
}

function deleteRecording(id) {
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement ?')) {
        recordings = recordings.filter(rec => rec.id !== id);
        localStorage.setItem('recordings', JSON.stringify(recordings));
        deleteFromIndexedDB(id);
        displayRecordings();
    }
}

function getStatusIcon(status) {
    const icons = {
        pending: '<span class="status-icon pending" title="En cours de validation">ℹ️</span>',
        validated: '<span class="status-icon validated" title="Validé">✅</span>',
        error: '<span class="status-icon error" title="Erreur">⚠️</span>'
    };
    return icons[status] || icons.pending;
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

function displayRecordings() {
    const list = document.getElementById('recordingsList');
    const groupBySelect = document.getElementById('groupBySelect');

    if (recordings.length === 0) {
        list.innerHTML = '<p style="color:#999;">Aucun enregistrement pour le moment.</p>';
        return;
    }

    const groupBy = groupBySelect.value;

    if (groupBy === 'contributeur') {
        displayByContributor();
    } else if (groupBy === 'status') {
        displayByStatus();
    } else {
        displayAll();
    }
}

function displayAll() {
    const list = document.getElementById('recordingsList');
    list.innerHTML = recordings.map(rec => createRecordingCard(rec)).join('');
}

function displayByContributor() {
    const list = document.getElementById('recordingsList');
    const grouped = {};

    recordings.forEach(rec => {
        const contributeur = rec.metadata.nom || 'Sans contributeur';
        if (!grouped[contributeur]) {
            grouped[contributeur] = [];
        }
        grouped[contributeur].push(rec);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(contributeur => {
        html += `
            <div class="contributor-group">
                <h3 class="contributor-name">👤 ${contributeur} (${grouped[contributeur].length})</h3>
                <div class="recordings-group">
                    ${grouped[contributeur].map(rec => createRecordingCard(rec)).join('')}
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}

function displayByStatus() {
    const list = document.getElementById('recordingsList');
    const statuses = {
        pending: { label: 'En cours de validation', items: [] },
        validated: { label: 'Validés', items: [] },
        error: { label: 'Erreurs', items: [] }
    };

    recordings.forEach(rec => {
        statuses[rec.status].items.push(rec);
    });

    let html = '';
    Object.keys(statuses).forEach(status => {
        if (statuses[status].items.length > 0) {
            html += `
                <div class="status-group">
                    <h3 class="status-group-title">${getStatusIcon(status)} ${statuses[status].label} (${statuses[status].items.length})</h3>
                    <div class="recordings-group">
                        ${statuses[status].items.map(rec => createRecordingCard(rec)).join('')}
                    </div>
                </div>
            `;
        }
    });

    list.innerHTML = html || '<p style="color:#999;">Aucun enregistrement.</p>';
}

function createRecordingCard(rec) {
    const contributeurInfo = rec.metadata.nom
        ? `<div class="metadata-preview">
              <strong>👤 ${rec.metadata.nom} ${rec.metadata.prenom}</strong>
              ${rec.metadata.occasion ? `<br><small>📌 ${rec.metadata.occasion}</small>` : ''}
              ${rec.metadata.lieuEvenement ? `<br><small>📍 ${rec.metadata.lieuEvenement}</small>` : ''}
           </div>`
        : '';

    return `
        <div class="recording-item ${rec.status}">
            <div class="recording-header">
                ${getStatusIcon(rec.status)}
                <span class="recording-type">${getTypeIcon(rec.type)} ${rec.type.toUpperCase()}</span>
                <small class="recording-date">${rec.date}</small>
            </div>
            ${contributeurInfo}
            ${rec.type === 'text' && rec.data ? `<div class="text-preview">"${rec.data.substring(0, 80)}..."</div>` : ''}
            <div class="recording-actions">
                <button onclick="playRecording(${rec.id})" class="btn-play" title="Lire">▶️ Lire</button>
                <button onclick="openValidationModal(${rec.id})" class="btn-validate" title="Valider">✓ Valider</button>
                <button onclick="changeStatus(${rec.id}, 'error')" class="btn-error" title="Marquer comme erreur">⚠️</button>
                <button onclick="deleteRecording(${rec.id})" class="btn-delete" title="Supprimer">🗑️</button>
            </div>
        </div>
    `;
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

async function getFromIndexedDB(id) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.blob : null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Erreur IndexedDB:', err);
        return null;
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
document.getElementById('groupBySelect').addEventListener('change', displayRecordings);
displayRecordings();
