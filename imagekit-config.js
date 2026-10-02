/**
 * Rathore Heritage Developers — ImageKit Configuration
 * 
 * ℹ️ SECURITY NOTICE:
 * Only public client identifiers (publicKey and urlEndpoint) are stored here.
 * These are completely safe to commit to GitHub and run on GitHub Pages.
 * 
 * Your Private API Key must NEVER be placed in this file or committed to GitHub.
 * The Admin Panel will securely request your Private Key in the browser and store it
 * strictly in your local browser's private localStorage for signing uploads.
 */

const IMAGEKIT_CONFIG = (typeof window !== 'undefined' && window.__IMAGEKIT_CONFIG__) || (() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('rhd_imagekit_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.publicKey && !parsed.publicKey.includes('REPLACE_WITH_YOUR')) return parsed;
      }
    } catch (e) {}
  }

  // Your ImageKit credentials from:
  // ImageKit Dashboard (https://imagekit.io/dashboard/developer/api-keys)
  return {
    publicKey: "public_+xZdFV8dpo9prFNP0WYVXB7alEo=",
    urlEndpoint: "https://ik.imagekit.io/kfzv6ulve",
  };
})();

if (typeof window !== 'undefined') {
  window.IMAGEKIT_CONFIG = IMAGEKIT_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = IMAGEKIT_CONFIG;
}
