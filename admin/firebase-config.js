/**
 * Rathore Heritage Developers — Firebase Web App Configuration
 * Project: heritage-20bb8
 * 
 * ℹ️ SECURITY NOTE:
 * These values are public client identifiers designed by Google for browser-side
 * usage on GitHub Pages. Database permissions are secured by Firebase Security Rules.
 */

const firebaseConfig = {
  apiKey: "AIzaSyAcFhTxCk99es7fMGnNpXK_ydGYcnaYbuY",
  authDomain: "heritage-20bb8.firebaseapp.com",
  projectId: "heritage-20bb8",
  storageBucket: "heritage-20bb8.firebasestorage.app",
  messagingSenderId: "530942849404",
  appId: "1:530942849404:web:ac90779f0d6082c30cb4f9",
  measurementId: "G-17SPJCBTMT"
};

const FIREBASE_CONFIG = firebaseConfig;

if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  window.FIREBASE_CONFIG = firebaseConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}