// Helper utilities

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if device has camera
 * @returns {boolean}
 */
export function hasCamera() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check if device has microphone
 * @returns {boolean}
 */
export function hasMicrophone() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get device info
 * @returns {Object}
 */
export function getDeviceInfo() {
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    hasCamera: hasCamera(),
    hasMicrophone: hasMicrophone()
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Download a file
 * @param {Blob|string} data - File data (blob or base64)
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(data, filename, mimeType) {
  let blob;

  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    // Convert base64 to blob
    const parts = data.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    blob = new Blob([uInt8Array], { type: contentType || mimeType });
  } else {
    blob = new Blob([data], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string}
 */
export function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get color for emotion
 * @param {string} emotion - Emotion name
 * @returns {string} - Tailwind color class
 */
export function getEmotionColor(emotion) {
  const colors = {
    joyeux: 'bg-yellow-100 text-yellow-800',
    nostalgie: 'bg-purple-100 text-purple-800',
    important: 'bg-red-100 text-red-800',
    surprise: 'bg-pink-100 text-pink-800',
    tendre: 'bg-blue-100 text-blue-800'
  };
  return colors[emotion] || 'bg-gray-100 text-gray-800';
}

/**
 * Get icon for media type
 * @param {string} mediaType - Media type
 * @returns {string} - Icon name
 */
export function getMediaTypeIcon(mediaType) {
  const icons = {
    photo: 'Camera',
    video: 'Video',
    audio: 'Mic',
    text: 'FileText'
  };
  return icons[mediaType] || 'File';
}

/**
 * Get color for media type
 * @param {string} mediaType - Media type
 * @returns {string} - Tailwind color class
 */
export function getMediaTypeColor(mediaType) {
  const colors = {
    photo: 'bg-purple-500',
    video: 'bg-pink-500',
    audio: 'bg-blue-500',
    text: 'bg-green-500'
  };
  return colors[mediaType] || 'bg-gray-500';
}

/**
 * Show notification (if supported)
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, options);
    }
  }
}

/**
 * Request notification permission
 * @returns {Promise<string>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}
