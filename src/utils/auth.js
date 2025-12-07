// Simple authentication utility using secret key

const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;
const SESSION_KEY = 'soussou_auth_key';

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  // If no secret key is configured, allow access (open mode)
  if (!SECRET_KEY || SECRET_KEY === '') {
    console.log('No secret key configured - open access mode');
    return true;
  }

  // Check sessionStorage for key
  const storedKey = sessionStorage.getItem(SESSION_KEY);
  return storedKey === SECRET_KEY;
}

/**
 * Authenticate with a key
 * @param {string} key - The authentication key
 * @returns {boolean} - True if authenticated
 */
export function authenticate(key) {
  if (!SECRET_KEY || SECRET_KEY === '') {
    // No key configured, always authenticate
    return true;
  }

  if (key === SECRET_KEY) {
    sessionStorage.setItem(SESSION_KEY, key);
    return true;
  }

  return false;
}

/**
 * Logout
 */
export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check for key in URL parameters and authenticate
 * Example: https://app.com/?key=FAMILLE2024SECRET
 * @returns {boolean} - True if authenticated via URL
 */
export function checkUrlAuth() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');

    if (keyParam) {
      const success = authenticate(keyParam);

      if (success) {
        // Remove key from URL for security
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        console.log('Authenticated via URL parameter');
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking URL auth:', error);
  }

  return false;
}

/**
 * Initialize authentication on app start
 * @returns {boolean} - True if authenticated
 */
export function initAuth() {
  // First check URL for key
  checkUrlAuth();

  // Then check if already authenticated
  return isAuthenticated();
}

/**
 * Get authentication status and info
 * @returns {Object}
 */
export function getAuthInfo() {
  return {
    isAuthenticated: isAuthenticated(),
    hasSecretKey: !!(SECRET_KEY && SECRET_KEY !== ''),
    mode: (!SECRET_KEY || SECRET_KEY === '') ? 'open' : 'protected'
  };
}
