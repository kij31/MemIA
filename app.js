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
let currentRecording = null; // Enregistrement en cours de création
let tempMedias = { audios: [], videos: [], images: [], texts: [] }; // Médias temporaires

// Variables pour les enregistreurs
let audioRecorder = null;
let audioChunks = [];
let videoRecorder = null;
let videoChunks = [];

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

// ========== GESTION DES ONGLETS ==========

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Désactiver tous les onglets
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ========== CAPTURE DES MÉDIAS ==========

const audioBtn = document.getElementById('audioBtn');
const audioStatus = document.getElementById('audioStatus');

audioBtn.addEventListener('click', async () => {
    if (!audioRecorder || audioRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioRecorder = new MediaRecorder(stream);
            audioChunks = [];

            audioRecorder.ondataavailable = (e) => audioChunks.push(e.data);

            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await addMediaToTemp('audio', audioBlob);
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
    if (!videoRecorder || videoRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRecorder = new MediaRecorder(stream);
            videoChunks = [];

            videoRecorder.ondataavailable = (e) => videoChunks.push(e.data);

            videoRecorder.onstop = async () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                await addMediaToTemp('video', videoBlob);
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

imageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await addMediaToTemp('image', file);
        showStatus(imageStatus, 'Image ajoutée !', 'success');
    }
});

const textBtn = document.getElementById('textBtn');
const textInput = document.getElementById('textInput');
const textStatus = document.getElementById('textStatus');

textBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        addMediaToTemp('text', text);
        showStatus(textStatus, 'Texte ajouté !', 'success');
        textInput.value = '';
    } else {
        showStatus(textStatus, 'Veuillez entrer du texte', 'error');
    }
});

// ========== GESTION DES MÉDIAS TEMPORAIRES ==========

async function addMediaToTemp(type, data) {
    const media = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleString('fr-FR'),
        data: type === 'text' ? data : null
    };

    // Sauvegarder les blobs dans IndexedDB
    if (type !== 'text') {
        await saveToIndexedDB(media.id, data);
    }

    // Ajouter au bon tableau temporaire
    if (type === 'audio') tempMedias.audios.push(media);
    else if (type === 'video') tempMedias.videos.push(media);
    else if (type === 'image') tempMedias.images.push(media);
    else if (type === 'text') tempMedias.texts.push(media);

    updatePreview();
}

function updatePreview() {
    const totalMedias =
        tempMedias.audios.length +
        tempMedias.videos.length +
        tempMedias.images.length +
        tempMedias.texts.length;

    const saveBtn = document.getElementById('saveRecordingBtn');
    const previewSection = document.getElementById('previewSection');
    const mediaPreview = document.getElementById('mediaPreview');

    if (totalMedias > 0) {
        saveBtn.style.display = 'block';
        previewSection.style.display = 'block';

        let html = '<div class="preview-summary">';
        html += `<p><strong>${totalMedias} média(s) ajouté(s)</strong></p>`;
        html += '<ul class="preview-list">';

        if (tempMedias.audios.length > 0) html += `<li>🎤 Audio: ${tempMedias.audios.length}</li>`;
        if (tempMedias.videos.length > 0) html += `<li>🎥 Vidéo: ${tempMedias.videos.length}</li>`;
        if (tempMedias.images.length > 0) html += `<li>📷 Image: ${tempMedias.images.length}</li>`;
        if (tempMedias.texts.length > 0) html += `<li>📝 Texte: ${tempMedias.texts.length}</li>`;

        html += '</ul></div>';
        mediaPreview.innerHTML = html;
    } else {
        saveBtn.style.display = 'none';
        previewSection.style.display = 'none';
    }
}

// ========== BOUTON ENREGISTRER ==========

document.getElementById('saveRecordingBtn').addEventListener('click', () => {
    const totalMedias =
        tempMedias.audios.length +
        tempMedias.videos.length +
        tempMedias.images.length +
        tempMedias.texts.length;

    if (totalMedias === 0) {
        alert('Veuillez ajouter au moins un média avant d\'enregistrer');
        return;
    }

    // Ouvrir le popup de métadonnées
    openValidationModal();
});

// ========== POPUP DE VALIDATION ==========

const modal = document.getElementById('validationModal');
const modalClose = document.getElementById('modalClose');
const validationForm = document.getElementById('validationForm');

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

validationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveRecording();
});

function openValidationModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    validationForm.reset();
}

// ========== MODAL DE REMERCIEMENT ==========

function showThankYouModal() {
    const thankYouModal = document.getElementById('thankYouModal');
    thankYouModal.style.display = 'flex';
}

function closeThankYouModal() {
    const thankYouModal = document.getElementById('thankYouModal');
    thankYouModal.style.display = 'none';
}

// Event listener pour fermer le modal de remerciement
document.getElementById('thankYouClose').addEventListener('click', () => {
    closeThankYouModal();
    switchTab('donnees');
});

// Fermer aussi en cliquant sur le fond
document.getElementById('thankYouModal').addEventListener('click', (e) => {
    if (e.target.id === 'thankYouModal') {
        closeThankYouModal();
        switchTab('donnees');
    }
});

// ========== GESTION ADMINISTRATEUR ==========

let isAdminLoggedIn = false;
let currentEditingRecordingId = null;

// Identifiants admin (à modifier selon vos besoins)
const ADMIN_CREDENTIALS = {
    nom: 'admin',
    password: 'admin123'
};

// Mettre à jour l'affichage de la section admin
function updateAdminSection() {
    const adminSection = document.getElementById('adminSection');

    if (isAdminLoggedIn) {
        adminSection.innerHTML = `
            <span class="admin-badge">🔐 Admin</span>
            <button class="btn-logout-admin" onclick="logoutAdmin()">Déconnexion</button>
        `;
    } else {
        adminSection.innerHTML = `
            <button class="btn-edit-recording" onclick="openAdminLoginModal()">🔐 Connexion Admin</button>
        `;
    }
}

function openAdminLoginModal(recordingId = null) {
    currentEditingRecordingId = recordingId;
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminLoginError = document.getElementById('adminLoginError');
    adminLoginError.style.display = 'none';
    document.getElementById('adminLoginForm').reset();
    adminLoginModal.style.display = 'flex';
}

function closeAdminLoginModal() {
    const adminLoginModal = document.getElementById('adminLoginModal');
    adminLoginModal.style.display = 'none';
    currentEditingRecordingId = null;
}

// Event listener pour le formulaire de login admin
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const nom = document.getElementById('adminName').value.trim();
    const password = document.getElementById('adminPassword').value;
    const adminLoginError = document.getElementById('adminLoginError');

    if (nom === ADMIN_CREDENTIALS.nom && password === ADMIN_CREDENTIALS.password) {
        isAdminLoggedIn = true;
        closeAdminLoginModal();

        // Mettre à jour la section admin
        updateAdminSection();

        // Si on essayait d'éditer un enregistrement, l'ouvrir maintenant
        if (currentEditingRecordingId !== null) {
            openEditRecordingModal(currentEditingRecordingId);
            currentEditingRecordingId = null;
        }

        // Rafraîchir l'affichage pour montrer les boutons d'édition
        displayRecordings();

        alert('✅ Connecté en tant qu\'administrateur');
    } else {
        adminLoginError.style.display = 'block';
        document.getElementById('adminPassword').value = '';
    }
});

// Fermer le modal de login admin
document.getElementById('adminLoginClose').addEventListener('click', closeAdminLoginModal);

// Déconnexion admin
function logoutAdmin() {
    if (confirm('Voulez-vous vous déconnecter ?')) {
        isAdminLoggedIn = false;
        updateAdminSection();
        displayRecordings();
        alert('Déconnecté');
    }
}

// ========== ÉDITION D'ENREGISTREMENT ==========

function openEditRecordingModal(recordingId) {
    // Vérifier si l'admin est connecté
    if (!isAdminLoggedIn) {
        openAdminLoginModal(recordingId);
        return;
    }

    // Trouver l'enregistrement
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    // Remplir le formulaire
    document.getElementById('editRecordingId').value = recording.id;
    document.getElementById('editNom').value = recording.metadata.nom || '';
    document.getElementById('editPrenom').value = recording.metadata.prenom || '';
    document.getElementById('editOccasion').value = recording.metadata.occasion || '';
    document.getElementById('editDate').value = recording.metadata.dateEvenement || '';
    document.getElementById('editLieu').value = recording.metadata.lieuEvenement || '';

    // Ouvrir le modal
    const editModal = document.getElementById('editRecordingModal');
    editModal.style.display = 'flex';
}

function closeEditModal() {
    const editModal = document.getElementById('editRecordingModal');
    editModal.style.display = 'none';
    document.getElementById('editRecordingForm').reset();
}

// Event listener pour fermer le modal d'édition
document.getElementById('editModalClose').addEventListener('click', closeEditModal);

// Event listener pour sauvegarder les modifications
document.getElementById('editRecordingForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const recordingId = parseInt(document.getElementById('editRecordingId').value);
    const recording = recordings.find(r => r.id === recordingId);

    if (!recording) return;

    // Mettre à jour les métadonnées
    recording.metadata.nom = document.getElementById('editNom').value.trim();
    recording.metadata.prenom = document.getElementById('editPrenom').value.trim();
    recording.metadata.occasion = document.getElementById('editOccasion').value;
    recording.metadata.dateEvenement = document.getElementById('editDate').value;
    recording.metadata.lieuEvenement = document.getElementById('editLieu').value.trim();

    // Sauvegarder dans localStorage
    localStorage.setItem('recordings', JSON.stringify(recordings));

    // Fermer le modal et rafraîchir
    closeEditModal();
    displayRecordings();

    alert('✅ Enregistrement modifié avec succès !');
});

// ========== SAUVEGARDE DE L'ENREGISTREMENT ==========

function saveRecording() {
    const recording = {
        id: Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        status: 'validated',
        metadata: {
            nom: document.getElementById('nomContributeur').value.trim(),
            prenom: document.getElementById('prenomContributeur').value.trim(),
            occasion: document.getElementById('occasionEvenement').value,
            dateEvenement: document.getElementById('dateEvenement').value,
            lieuEvenement: document.getElementById('lieuEvenement').value.trim()
        },
        medias: {
            audios: [...tempMedias.audios],
            videos: [...tempMedias.videos],
            images: [...tempMedias.images],
            texts: [...tempMedias.texts]
        }
    };

    recordings.unshift(recording);
    localStorage.setItem('recordings', JSON.stringify(recordings));

    // Réinitialiser
    tempMedias = { audios: [], videos: [], images: [], texts: [] };
    updatePreview();
    closeModal();
    displayRecordings();

    // Afficher le message de remerciement
    showThankYouModal();
}

// ========== AFFICHAGE DES ENREGISTREMENTS ==========

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
        pending: { label: 'En cours', items: [] },
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

    // Bouton d'édition pour l'admin
    const editButton = isAdminLoggedIn
        ? `<button class="btn-edit-recording" onclick="event.stopPropagation(); openEditRecordingModal(${rec.id})">✏️ Modifier</button>`
        : '';

    return `
        <div class="recording-item ${rec.status}" onclick="openRecordingView(${rec.id})" style="cursor:pointer;">
            <div class="recording-header">
                ${getStatusIcon(rec.status)}
                <span class="recording-type">📦 Enregistrement complet</span>
                <small class="recording-date">${rec.date}</small>
                ${editButton}
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

// ========== VISUALISATION D'UN ENREGISTREMENT ==========

function openRecordingView(recordingId) {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    const modal = document.getElementById('recordingFormModal');
    const container = document.getElementById('formMediasContainer');
    const metadataDisplay = document.getElementById('metadataDisplay');

    // Afficher les médias
    let html = '<div class="form-medias">';

    // Audios
    html += '<div class="media-group"><h3>🎤 Audios (' + recording.medias.audios.length + ')</h3>';
    recording.medias.audios.forEach(audio => {
        html += createMediaViewItem('audio', audio, recordingId);
    });
    html += '</div>';

    // Vidéos
    html += '<div class="media-group"><h3>🎥 Vidéos (' + recording.medias.videos.length + ')</h3>';
    recording.medias.videos.forEach(video => {
        html += createMediaViewItem('video', video, recordingId);
    });
    html += '</div>';

    // Images
    html += '<div class="media-group"><h3>📷 Images (' + recording.medias.images.length + ')</h3>';
    recording.medias.images.forEach(image => {
        html += createMediaViewItem('image', image, recordingId);
    });
    html += '</div>';

    // Textes
    html += '<div class="media-group"><h3>📝 Textes (' + recording.medias.texts.length + ')</h3>';
    recording.medias.texts.forEach(text => {
        html += createMediaViewItem('text', text, recordingId);
    });
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    // Afficher les métadonnées
    metadataDisplay.innerHTML = `
        <p><strong>Nom:</strong> ${recording.metadata.nom} ${recording.metadata.prenom}</p>
        <p><strong>Occasion:</strong> ${recording.metadata.occasion}</p>
        ${recording.metadata.dateEvenement ? `<p><strong>Date:</strong> ${recording.metadata.dateEvenement}</p>` : ''}
        ${recording.metadata.lieuEvenement ? `<p><strong>Lieu:</strong> ${recording.metadata.lieuEvenement}</p>` : ''}
    `;

    // Gérer le bouton supprimer
    document.getElementById('formDelete').onclick = () => deleteRecording(recordingId);

    modal.style.display = 'flex';
}

document.getElementById('formClose').addEventListener('click', () => {
    document.getElementById('recordingFormModal').style.display = 'none';
});

function createMediaViewItem(type, media, recordingId) {
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
    // Trouver le média dans tous les enregistrements
    let media = null;
    let recording = null;

    for (const rec of recordings) {
        if (type === 'audio') media = rec.medias.audios.find(m => m.id === mediaId);
        else if (type === 'video') media = rec.medias.videos.find(m => m.id === mediaId);
        else if (type === 'image') media = rec.medias.images.find(m => m.id === mediaId);
        else if (type === 'text') media = rec.medias.texts.find(m => m.id === mediaId);

        if (media) {
            recording = rec;
            break;
        }
    }

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

    const recording = recordings.find(r => r.id === recordingId);
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

    localStorage.setItem('recordings', JSON.stringify(recordings));
    displayRecordings();
    openRecordingView(recordingId);
}

function deleteRecording(id) {
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement complet ?')) {
        const recording = recordings.find(r => r.id === id);
        if (recording) {
            // Supprimer tous les blobs de IndexedDB
            recording.medias.audios.forEach(a => deleteFromIndexedDB(a.id));
            recording.medias.videos.forEach(v => deleteFromIndexedDB(v.id));
            recording.medias.images.forEach(i => deleteFromIndexedDB(i.id));
        }

        recordings = recordings.filter(r => r.id !== id);
        localStorage.setItem('recordings', JSON.stringify(recordings));
        displayRecordings();
        document.getElementById('recordingFormModal').style.display = 'none';
    }
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
updateAdminSection();
displayRecordings();
updatePreview();
