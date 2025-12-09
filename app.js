// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker enregistré:', reg))
            .catch(err => console.error('Erreur Service Worker:', err));
    });
}

// Variables globales
let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
let currentRecordingId = null; // ID de l'enregistrement en cours d'édition
let currentEditingId = null; // ID pour le modal de validation

// Liste des occasions
const occasions = [
    'Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Fête familiale',
    'Réunion', 'Conférence', 'Interview', 'Témoignage', 'Formation', 'Autre'
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

// ========== GESTION DES ENREGISTREMENTS ==========

function createNewRecording() {
    const recording = {
        id: Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        status: 'pending',
        metadata: {
            nom: '',
            prenom: '',
            dateEvenement: '',
            lieuEvenement: '',
            occasion: ''
        },
        medias: {
            audios: [],
            videos: [],
            images: [],
            texts: []
        }
    };

    recordings.unshift(recording);
    saveRecordings();
    currentRecordingId = recording.id;

    // Ouvrir immédiatement le formulaire d'édition
    openRecordingForm(recording.id);
}

function saveRecordings() {
    localStorage.setItem('recordings', JSON.stringify(recordings));
    displayRecordings();
}

function getRecording(id) {
    return recordings.find(r => r.id === id);
}

function deleteRecording(id) {
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement complet ?')) {
        const recording = getRecording(id);
        if (recording) {
            // Supprimer tous les blobs de IndexedDB
            recording.medias.audios.forEach(a => deleteFromIndexedDB(a.id));
            recording.medias.videos.forEach(v => deleteFromIndexedDB(v.id));
            recording.medias.images.forEach(i => deleteFromIndexedDB(i.id));
        }

        recordings = recordings.filter(r => r.id !== id);
        saveRecordings();
        closeRecordingForm();
    }
}

// ========== CAPTURE DES MÉDIAS ==========

// Variables pour les enregistreurs
let audioRecorder = null;
let audioChunks = [];
let videoRecorder = null;
let videoChunks = [];

const audioBtn = document.getElementById('audioBtn');
const audioStatus = document.getElementById('audioStatus');

audioBtn.addEventListener('click', async () => {
    if (!currentRecordingId) {
        showStatus(audioStatus, 'Veuillez d\'abord créer un enregistrement', 'error');
        return;
    }

    if (!audioRecorder || audioRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioRecorder = new MediaRecorder(stream);
            audioChunks = [];

            audioRecorder.ondataavailable = (e) => audioChunks.push(e.data);

            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await addMediaToRecording('audio', audioBlob);
                stream.getTracks().forEach(track => track.stop());
                showStatus(audioStatus, 'Audio ajouté !', 'success');
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

const videoBtn = document.getElementById('videoBtn');
const videoStatus = document.getElementById('videoStatus');

videoBtn.addEventListener('click', async () => {
    if (!currentRecordingId) {
        showStatus(videoStatus, 'Veuillez d\'abord créer un enregistrement', 'error');
        return;
    }

    if (!videoRecorder || videoRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRecorder = new MediaRecorder(stream);
            videoChunks = [];

            videoRecorder.ondataavailable = (e) => videoChunks.push(e.data);

            videoRecorder.onstop = async () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                await addMediaToRecording('video', videoBlob);
                stream.getTracks().forEach(track => track.stop());
                showStatus(videoStatus, 'Vidéo ajoutée !', 'success');
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

const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const imageStatus = document.getElementById('imageStatus');

imageBtn.addEventListener('click', () => {
    if (!currentRecordingId) {
        showStatus(imageStatus, 'Veuillez d\'abord créer un enregistrement', 'error');
        return;
    }
    imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await addMediaToRecording('image', file);
        showStatus(imageStatus, 'Image ajoutée !', 'success');
    }
});

const textBtn = document.getElementById('textBtn');
const textInput = document.getElementById('textInput');
const textStatus = document.getElementById('textStatus');

textBtn.addEventListener('click', () => {
    if (!currentRecordingId) {
        showStatus(textStatus, 'Veuillez d\'abord créer un enregistrement', 'error');
        return;
    }

    const text = textInput.value.trim();
    if (text) {
        addMediaToRecording('text', text);
        showStatus(textStatus, 'Texte ajouté !', 'success');
        textInput.value = '';
    } else {
        showStatus(textStatus, 'Veuillez entrer du texte', 'error');
    }
});

async function addMediaToRecording(type, data) {
    const recording = getRecording(currentRecordingId);
    if (!recording) return;

    const media = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleString('fr-FR'),
        data: type === 'text' ? data : null
    };

    // Sauvegarder les blobs dans IndexedDB
    if (type !== 'text') {
        await saveToIndexedDB(media.id, data);
    }

    // Ajouter au bon tableau
    if (type === 'audio') recording.medias.audios.push(media);
    else if (type === 'video') recording.medias.videos.push(media);
    else if (type === 'image') recording.medias.images.push(media);
    else if (type === 'text') recording.medias.texts.push(media);

    saveRecordings();

    // Rafraîchir le formulaire si ouvert
    if (document.getElementById('recordingFormModal').style.display === 'flex') {
        displayRecordingInForm(currentRecordingId);
    }
}

// ========== FORMULAIRE D'ÉDITION ==========

function openRecordingForm(recordingId) {
    currentRecordingId = recordingId;
    const modal = document.getElementById('recordingFormModal');
    modal.style.display = 'flex';
    displayRecordingInForm(recordingId);
}

function closeRecordingForm() {
    const modal = document.getElementById('recordingFormModal');
    modal.style.display = 'none';
    currentRecordingId = null;
}

function displayRecordingInForm(recordingId) {
    const recording = getRecording(recordingId);
    if (!recording) return;

    const container = document.getElementById('formMediasContainer');

    let html = '<div class="form-medias">';

    // Audios
    html += '<div class="media-group"><h3>🎤 Audios (' + recording.medias.audios.length + ')</h3>';
    recording.medias.audios.forEach(audio => {
        html += createMediaItem('audio', audio, recordingId);
    });
    html += '</div>';

    // Vidéos
    html += '<div class="media-group"><h3>🎥 Vidéos (' + recording.medias.videos.length + ')</h3>';
    recording.medias.videos.forEach(video => {
        html += createMediaItem('video', video, recordingId);
    });
    html += '</div>';

    // Images
    html += '<div class="media-group"><h3>📷 Images (' + recording.medias.images.length + ')</h3>';
    recording.medias.images.forEach(image => {
        html += createMediaItem('image', image, recordingId);
    });
    html += '</div>';

    // Textes
    html += '<div class="media-group"><h3>📝 Textes (' + recording.medias.texts.length + ')</h3>';
    recording.medias.texts.forEach(text => {
        html += createMediaItem('text', text, recordingId);
    });
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;

    // Pré-remplir les métadonnées
    document.getElementById('formNom').value = recording.metadata.nom || '';
    document.getElementById('formPrenom').value = recording.metadata.prenom || '';
    document.getElementById('formOccasion').value = recording.metadata.occasion || '';
    document.getElementById('formDateEvenement').value = recording.metadata.dateEvenement || '';
    document.getElementById('formLieuEvenement').value = recording.metadata.lieuEvenement || '';
}

function createMediaItem(type, media, recordingId) {
    const preview = type === 'text'
        ? `<div class="text-content">${media.data.substring(0, 100)}...</div>`
        : `<div class="media-date">${media.date}</div>`;

    return `
        <div class="media-item">
            ${preview}
            <div class="media-actions">
                <button onclick="playMedia('${type}', ${media.id})" class="btn-play-media">▶️ Lire</button>
                <button onclick="deleteMedia('${type}', ${media.id}, ${recordingId})" class="btn-delete-media">🗑️ Supprimer</button>
            </div>
        </div>
    `;
}

async function playMedia(type, mediaId) {
    // Trouver le média
    const recording = getRecording(currentRecordingId);
    if (!recording) return;

    let media;
    if (type === 'audio') media = recording.medias.audios.find(m => m.id === mediaId);
    else if (type === 'video') media = recording.medias.videos.find(m => m.id === mediaId);
    else if (type === 'image') media = recording.medias.images.find(m => m.id === mediaId);
    else if (type === 'text') media = recording.medias.texts.find(m => m.id === mediaId);

    if (!media) return;

    if (type === 'text') {
        alert(media.data);
    } else {
        const blob = await getFromIndexedDB(mediaId);
        if (blob) {
            const url = URL.createObjectURL(blob);
            if (type === 'image') {
                window.open(url, '_blank');
            } else {
                const player = document.createElement(type);
                player.controls = true;
                player.src = url;
                player.style.maxWidth = '100%';

                const playerContainer = document.getElementById('formPlayerContainer');
                playerContainer.innerHTML = '';
                playerContainer.appendChild(player);
                playerContainer.style.display = 'block';
                player.play();
            }
        }
    }
}

async function deleteMedia(type, mediaId, recordingId) {
    if (!confirm('Supprimer ce média ?')) return;

    const recording = getRecording(recordingId);
    if (!recording) return;

    // Supprimer de IndexedDB si nécessaire
    if (type !== 'text') {
        await deleteFromIndexedDB(mediaId);
    }

    // Supprimer du tableau
    if (type === 'audio') recording.medias.audios = recording.medias.audios.filter(m => m.id !== mediaId);
    else if (type === 'video') recording.medias.videos = recording.medias.videos.filter(m => m.id !== mediaId);
    else if (type === 'image') recording.medias.images = recording.medias.images.filter(m => m.id !== mediaId);
    else if (type === 'text') recording.medias.texts = recording.medias.texts.filter(m => m.id !== mediaId);

    saveRecordings();
    displayRecordingInForm(recordingId);
}

function saveRecordingMetadata() {
    const recording = getRecording(currentRecordingId);
    if (!recording) return;

    recording.metadata = {
        nom: document.getElementById('formNom').value.trim(),
        prenom: document.getElementById('formPrenom').value.trim(),
        occasion: document.getElementById('formOccasion').value,
        dateEvenement: document.getElementById('formDateEvenement').value,
        lieuEvenement: document.getElementById('formLieuEvenement').value.trim()
    };

    recording.status = 'validated';
    saveRecordings();
    closeRecordingForm();
    alert('Enregistrement validé !');
}

// ========== AFFICHAGE DES ENREGISTREMENTS ==========

function displayRecordings() {
    const list = document.getElementById('recordingsList');
    const groupBySelect = document.getElementById('groupBySelect');

    if (recordings.length === 0) {
        list.innerHTML = '<p style="color:#999;">Aucun enregistrement. Créez-en un avec le bouton ci-dessus !</p>';
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
        if (!grouped[contributeur]) grouped[contributeur] = [];
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
        validated: { label: 'Validés', items: [] }
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
    const totalMedias =
        rec.medias.audios.length +
        rec.medias.videos.length +
        rec.medias.images.length +
        rec.medias.texts.length;

    const mediaSummary = [
        rec.medias.audios.length > 0 ? `🎤 ${rec.medias.audios.length}` : '',
        rec.medias.videos.length > 0 ? `🎥 ${rec.medias.videos.length}` : '',
        rec.medias.images.length > 0 ? `📷 ${rec.medias.images.length}` : '',
        rec.medias.texts.length > 0 ? `📝 ${rec.medias.texts.length}` : ''
    ].filter(s => s).join(' | ');

    const contributeurInfo = rec.metadata.nom
        ? `<div class="metadata-preview">
              <strong>👤 ${rec.metadata.nom} ${rec.metadata.prenom}</strong>
              ${rec.metadata.occasion ? `<br><small>📌 ${rec.metadata.occasion}</small>` : ''}
           </div>`
        : '';

    return `
        <div class="recording-item ${rec.status}" onclick="openRecordingForm(${rec.id})" style="cursor:pointer;">
            <div class="recording-header">
                ${getStatusIcon(rec.status)}
                <span class="recording-type">📦 Enregistrement complet</span>
                <small class="recording-date">${rec.date}</small>
            </div>
            ${contributeurInfo}
            <div class="media-summary">
                <strong>${totalMedias} média(s)</strong>: ${mediaSummary || 'Aucun média'}
            </div>
        </div>
    `;
}

function getStatusIcon(status) {
    const icons = {
        pending: '<span class="status-icon pending" title="En cours">ℹ️</span>',
        validated: '<span class="status-icon validated" title="Validé">✅</span>'
    };
    return icons[status] || icons.pending;
}

// ========== UTILITAIRES ==========

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => element.style.display = 'none', 3000);
    }
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

// ========== INITIALISATION ==========

document.getElementById('groupBySelect').addEventListener('change', displayRecordings);
document.getElementById('newRecordingBtn').addEventListener('click', createNewRecording);
document.getElementById('formClose').addEventListener('click', closeRecordingForm);
document.getElementById('formSave').addEventListener('click', saveRecordingMetadata);
document.getElementById('formDelete').addEventListener('click', () => deleteRecording(currentRecordingId));

// Fermer le formulaire en cliquant en dehors
document.getElementById('recordingFormModal').addEventListener('click', (e) => {
    if (e.target.id === 'recordingFormModal') {
        closeRecordingForm();
    }
});

displayRecordings();
