import { useState, useEffect } from 'react';
import {
  Camera,
  Video,
  Mic,
  FileText,
  Upload,
  Home,
  List,
  Heart,
  Wifi,
  WifiOff,
  Lock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  LogOut
} from 'lucide-react';
import { initDB, saveSubmission, getAllSubmissions, deleteSubmission, updateSubmission, saveAuthor, getAllAuthors, getStats } from '../services/storage.js';
import { compressMedia, blobToBase64, getMediaInfo, validateMediaSize } from '../services/compression.js';
import { syncAllPendingSubmissions, setupAutoSync, isOnline } from '../services/sync.js';
import { initAuth, isAuthenticated, logout, getAuthInfo } from '../utils/auth.js';
import { generateId, formatDate, formatFileSize, debounce, showNotification } from '../utils/helpers.js';

// Login component
function LoginScreen({ onLogin }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(key);
    if (!success) {
      setError('Clé incorrecte');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Soussou Souvenirs</h1>
          <p className="text-gray-600">Accès protégé</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Clé d'accès</label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Entrez la clé familiale"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}

// Main App component
export default function App() {
  const [screen, setScreen] = useState('home'); // home, select-type, capture, form, list, detail
  const [mediaType, setMediaType] = useState(null);
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [formData, setFormData] = useState({
    author: '',
    relationship: '',
    dateRange: '',
    location: '',
    emotion: '',
    people: '',
    description: '',
    category: ''
  });
  const [submissions, setSubmissions] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      // Check authentication
      const authResult = initAuth();
      const authInfo = getAuthInfo();

      if (authInfo.mode === 'open' || authResult) {
        setAuthenticated(true);
        await initDB();
        await loadSubmissions();
        await loadAuthors();
        await loadStats();
        setupAutoSync();
      } else {
        setAuthenticated(false);
      }
    };

    init();

    // Listen for online/offline
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = (key) => {
    const { authenticate } = require('../utils/auth.js');
    const success = authenticate(key);
    if (success) {
      setAuthenticated(true);
      initDB();
      loadSubmissions();
      loadAuthors();
      loadStats();
      setupAutoSync();
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setScreen('home');
  };

  const loadSubmissions = async () => {
    const data = await getAllSubmissions();
    setSubmissions(data);
  };

  const loadAuthors = async () => {
    const data = await getAllAuthors();
    setAuthors(data);
  };

  const loadStats = async () => {
    const data = await getStats();
    setStats(data);
  };

  const handleMediaTypeSelect = (type) => {
    setMediaType(type);
    setScreen('capture');
  };

  const handleMediaCaptured = async (media) => {
    try {
      // Validate size
      if (!validateMediaSize(media)) {
        alert('Fichier trop volumineux (max 50MB)');
        return;
      }

      // Compress media
      const compressed = await compressMedia(media, mediaType);
      setCapturedMedia(compressed);
      setScreen('form');
    } catch (error) {
      console.error('Error handling media:', error);
      alert('Erreur lors du traitement du média');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (status = 'draft') => {
    try {
      // Convert media to base64
      const mediaBase64 = await blobToBase64(capturedMedia);

      // Create submission
      const submission = {
        id: generateId(),
        mediaType,
        media: mediaBase64,
        ...formData,
        timestamp: Date.now(),
        status,
        syncStatus: status === 'validated' ? 'pending' : 'draft'
      };

      // Save to IndexedDB
      await saveSubmission(submission);

      // Save author if new
      if (formData.author && !authors.includes(formData.author)) {
        await saveAuthor(formData.author);
        await loadAuthors();
      }

      // Reload data
      await loadSubmissions();
      await loadStats();

      // Show notification
      showNotification('Souvenir enregistré', {
        body: status === 'validated' ? 'Le souvenir sera synchronisé' : 'Brouillon sauvegardé',
        icon: '/icons/icon-192x192.png'
      });

      // Reset and go home
      resetForm();
      setScreen('home');

      // Try to sync if validated and online
      if (status === 'validated' && isOnline()) {
        syncAllPendingSubmissions();
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const resetForm = () => {
    setMediaType(null);
    setCapturedMedia(null);
    setFormData({
      author: '',
      relationship: '',
      dateRange: '',
      location: '',
      emotion: '',
      people: '',
      description: '',
      category: ''
    });
  };

  const handleValidate = async (id) => {
    try {
      await updateSubmission(id, { status: 'validated', syncStatus: 'pending' });
      await loadSubmissions();
      await loadStats();
      showNotification('Souvenir validé', {
        body: 'Le souvenir sera synchronisé',
        icon: '/icons/icon-192x192.png'
      });

      if (isOnline()) {
        syncAllPendingSubmissions();
      }
    } catch (error) {
      console.error('Error validating:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubmission(id);
      await loadSubmissions();
      await loadStats();
      setShowDeleteModal(null);
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
        setScreen('list');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncAllPendingSubmissions();
      await loadSubmissions();
      await loadStats();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  // If not authenticated, show login
  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Home screen
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Soussou Souvenirs
              </h1>
              <p className="text-gray-600 mt-2">Partagez vos précieux souvenirs</p>
            </div>
            <div className="flex items-center gap-2">
              {online ? (
                <Wifi className="w-6 h-6 text-green-500" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
              {getAuthInfo().mode === 'protected' && (
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</div>
                <div className="text-sm text-gray-600">Souvenirs</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-green-600">{stats.syncedSubmissions}</div>
                <div className="text-sm text-gray-600">Synchronisés</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingSync + stats.failedSync}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Actions */}
        <div className="max-w-2xl mx-auto space-y-4">
          <button
            onClick={() => setScreen('select-type')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8 shadow-2xl hover:scale-105 transition-transform"
          >
            <Heart className="w-16 h-16 mx-auto mb-4" />
            <div className="text-2xl font-bold">Ajouter un souvenir</div>
            <div className="text-purple-100 mt-2">Photo, vidéo, audio ou texte</div>
          </button>

          <button
            onClick={() => {
              loadSubmissions();
              setScreen('list');
            }}
            className="w-full bg-white rounded-3xl p-6 shadow-xl hover:scale-105 transition-transform relative"
          >
            <List className="w-12 h-12 mx-auto mb-2 text-purple-600" />
            <div className="text-xl font-bold text-gray-800">Mes envois</div>
            <div className="text-gray-600 text-sm mt-1">{submissions.length} souvenirs</div>
            {stats && stats.pendingSync + stats.failedSync > 0 && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {stats.pendingSync + stats.failedSync}
              </div>
            )}
          </button>

          {online && stats && (stats.pendingSync > 0 || stats.failedSync > 0) && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full bg-blue-500 text-white rounded-3xl p-6 shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
            >
              <RefreshCw className={`w-12 h-12 mx-auto mb-2 ${syncing ? 'animate-spin' : ''}`} />
              <div className="text-xl font-bold">
                {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Select media type screen
  if (screen === 'select-type') {
    const types = [
      { id: 'photo', icon: Camera, label: 'Photo', color: 'from-purple-500 to-purple-600' },
      { id: 'video', icon: Video, label: 'Vidéo', color: 'from-pink-500 to-pink-600' },
      { id: 'audio', icon: Mic, label: 'Audio', color: 'from-blue-500 to-blue-600' },
      { id: 'text', icon: FileText, label: 'Texte', color: 'from-green-500 to-green-600' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button
            onClick={() => setScreen('home')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Home className="w-5 h-5" />
            Retour
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-8">Type de souvenir</h2>

          <div className="grid grid-cols-2 gap-4">
            {types.map(({ id, icon: Icon, label, color }) => (
              <button
                key={id}
                onClick={() => handleMediaTypeSelect(id)}
                className={`bg-gradient-to-br ${color} text-white rounded-3xl p-8 shadow-xl hover:scale-105 transition-transform`}
              >
                <Icon className="w-16 h-16 mx-auto mb-4" />
                <div className="text-xl font-bold">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Capture screen
  if (screen === 'capture') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button
            onClick={() => setScreen('select-type')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Home className="w-5 h-5" />
            Retour
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Capturer {mediaType === 'photo' ? 'une photo' : mediaType === 'video' ? 'une vidéo' : mediaType === 'audio' ? 'un audio' : 'du texte'}
          </h2>

          {mediaType === 'text' ? (
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Écrivez votre souvenir..."
                onChange={(e) => {
                  const blob = new Blob([e.target.value], { type: 'text/plain' });
                  handleMediaCaptured(blob);
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <input
                type="file"
                accept={
                  mediaType === 'photo' ? 'image/*' :
                  mediaType === 'video' ? 'video/*' :
                  'audio/*'
                }
                capture={mediaType !== 'audio'}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleMediaCaptured(e.target.files[0]);
                  }
                }}
                className="w-full"
              />
              <div className="mt-4 text-center text-gray-600">
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>ou glissez-déposez un fichier</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form screen
  if (screen === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 pb-24">
          <button
            onClick={() => setScreen('capture')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Home className="w-5 h-5" />
            Retour
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-8">Informations</h2>

          <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
            {/* Author */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Votre nom</label>
              <input
                type="text"
                list="authors"
                value={formData.author}
                onChange={(e) => handleFormChange('author', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Marie"
              />
              <datalist id="authors">
                {authors.map(author => <option key={author} value={author} />)}
              </datalist>
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Lien avec la personne</label>
              <select
                value={formData.relationship}
                onChange={(e) => handleFormChange('relationship', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner...</option>
                <option value="enfant">Enfant</option>
                <option value="ami">Ami(e)</option>
                <option value="frere">Frère/Sœur</option>
                <option value="voisin">Voisin(e)</option>
                <option value="soignant">Soignant(e)</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Date approximative</label>
              <input
                type="text"
                value={formData.dateRange}
                onChange={(e) => handleFormChange('dateRange', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Été 1985, Années 90..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Lieu</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Maison de campagne, Paris..."
              />
            </div>

            {/* Emotion */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Émotion</label>
              <select
                value={formData.emotion}
                onChange={(e) => handleFormChange('emotion', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner...</option>
                <option value="joyeux">Joyeux</option>
                <option value="nostalgie">Nostalgie</option>
                <option value="important">Important</option>
                <option value="surprise">Surprise</option>
                <option value="tendre">Tendre</option>
              </select>
            </div>

            {/* People */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Personnes présentes</label>
              <input
                type="text"
                value={formData.people}
                onChange={(e) => handleFormChange('people', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Maman, Papa, Grand-mère..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner...</option>
                <option value="vacances">Vacances</option>
                <option value="anniversaire">Anniversaire</option>
                <option value="famille">Famille</option>
                <option value="enfance">Enfance</option>
                <option value="fetes">Fêtes</option>
                <option value="quotidien">Quotidien</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                placeholder="Racontez ce souvenir..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleSubmit('draft')}
                className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Sauvegarder brouillon
              </button>
              <button
                onClick={() => handleSubmit('validated')}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Valider et envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List screen
  if (screen === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 pb-24">
          <button
            onClick={() => setScreen('home')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Home className="w-5 h-5" />
            Retour
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-8">Mes souvenirs ({submissions.length})</h2>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Aucun souvenir pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(submission => (
                <div
                  key={submission.id}
                  className="bg-white rounded-3xl p-6 shadow-xl hover:scale-102 transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          submission.mediaType === 'photo' ? 'bg-purple-500' :
                          submission.mediaType === 'video' ? 'bg-pink-500' :
                          submission.mediaType === 'audio' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}>
                          {submission.mediaType === 'photo' && <Camera className="w-6 h-6 text-white" />}
                          {submission.mediaType === 'video' && <Video className="w-6 h-6 text-white" />}
                          {submission.mediaType === 'audio' && <Mic className="w-6 h-6 text-white" />}
                          {submission.mediaType === 'text' && <FileText className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{submission.author || 'Anonyme'}</div>
                          <div className="text-sm text-gray-600">{formatDate(submission.timestamp)}</div>
                        </div>
                      </div>

                      <div className="text-gray-700 mb-2">
                        {submission.description?.substring(0, 100)}
                        {submission.description?.length > 100 && '...'}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          submission.status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status === 'validated' ? 'Validé' : 'Brouillon'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          submission.syncStatus === 'synced' ? 'bg-blue-100 text-blue-800' :
                          submission.syncStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                          submission.syncStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.syncStatus === 'synced' ? 'Synchronisé' :
                           submission.syncStatus === 'pending' ? 'En attente' :
                           submission.syncStatus === 'failed' ? 'Échec' :
                           'Non synchronisé'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setScreen('detail');
                          }}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                        {submission.status === 'draft' && (
                          <button
                            onClick={() => handleValidate(submission.id)}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Valider
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteModal(submission.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
                <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce souvenir ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail screen
  if (screen === 'detail' && selectedSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 pb-24">
          <button
            onClick={() => {
              setSelectedSubmission(null);
              setScreen('list');
            }}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Home className="w-5 h-5" />
            Retour
          </button>

          <div className="bg-white rounded-3xl p-6 shadow-xl">
            {/* Media preview */}
            {selectedSubmission.media && (
              <div className="mb-6 rounded-2xl overflow-hidden bg-gray-100">
                {selectedSubmission.mediaType === 'photo' && (
                  <img src={selectedSubmission.media} alt="Souvenir" className="w-full" />
                )}
                {selectedSubmission.mediaType === 'video' && (
                  <video src={selectedSubmission.media} controls className="w-full" />
                )}
                {selectedSubmission.mediaType === 'audio' && (
                  <audio src={selectedSubmission.media} controls className="w-full p-4" />
                )}
                {selectedSubmission.mediaType === 'text' && (
                  <div className="p-6 whitespace-pre-wrap">{selectedSubmission.media}</div>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Auteur</div>
                <div className="font-semibold text-gray-800">{selectedSubmission.author || 'Anonyme'}</div>
              </div>

              {selectedSubmission.relationship && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lien</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.relationship}</div>
                </div>
              )}

              {selectedSubmission.dateRange && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Date</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.dateRange}</div>
                </div>
              )}

              {selectedSubmission.location && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lieu</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.location}</div>
                </div>
              )}

              {selectedSubmission.emotion && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Émotion</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.emotion}</div>
                </div>
              )}

              {selectedSubmission.people && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Personnes</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.people}</div>
                </div>
              )}

              {selectedSubmission.category && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Catégorie</div>
                  <div className="font-semibold text-gray-800">{selectedSubmission.category}</div>
                </div>
              )}

              {selectedSubmission.description && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Description</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{selectedSubmission.description}</div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">Créé le {formatDate(selectedSubmission.timestamp)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {selectedSubmission.status === 'draft' && (
                <button
                  onClick={() => {
                    handleValidate(selectedSubmission.id);
                    setSelectedSubmission(null);
                    setScreen('list');
                  }}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(selectedSubmission.id)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Supprimer
              </button>
            </div>
          </div>

          {/* Delete modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
                <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce souvenir ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
