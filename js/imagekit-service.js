/**
 * Rathore Heritage Developers — ImageKit Client Service
 * Handles secure client-side uploads, signature generation, and asset management
 * directly from the browser on GitHub Pages with zero custom backend servers.
 */

const ImageKitService = (() => {
  const UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
  const API_ENDPOINT = 'https://api.imagekit.io/v1/files';

  // Private key is stored ONLY in the administrator's local browser storage.
  // It is NEVER pushed to GitHub, exposed to public visitors, or written into source code.
  const STORAGE_KEY_PRIVATE = 'rhd_ik_private_key';

  function getPublicKey() {
    const cfg = window.IMAGEKIT_CONFIG;
    return (cfg && cfg.publicKey && !cfg.publicKey.includes('REPLACE_WITH_YOUR')) ? cfg.publicKey : '';
  }

  function getUrlEndpoint() {
    const cfg = window.IMAGEKIT_CONFIG;
    return (cfg && cfg.urlEndpoint) ? cfg.urlEndpoint.replace(/\/$/, '') : 'https://ik.imagekit.io';
  }

  function getPrivateKey() {
    return localStorage.getItem(STORAGE_KEY_PRIVATE) || '';
  }

  function setPrivateKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY_PRIVATE, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_PRIVATE);
    }
  }

  function isConfigured() {
    return !!(getPublicKey() && getPrivateKey());
  }

  /**
   * Generates ImageKit HMAC-SHA1 signature using standard Web Crypto API (SubtleCrypto)
   * Formula: signature = HMAC-SHA1(token + expire, privateKey)
   */
  async function generateSignature(token, expire, privateKey) {
    const enc = new TextEncoder();
    const keyData = enc.encode(privateKey);
    const messageData = enc.encode(token + expire);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }

  /**
   * Uploads a file directly to ImageKit
   * Returns ImageKit asset details including permanent CDN URL
   */
  async function uploadFile(file, options = {}) {
    const publicKey = getPublicKey();
    let privateKey = getPrivateKey();

    if (!publicKey) {
      throw new Error('ImageKit Public Key is missing. Please set your publicKey in imagekit-config.js');
    }

    if (!privateKey) {
      privateKey = prompt('Please enter your ImageKit Private Key (starts with "private_").\nThis key is stored strictly on your local browser machine and NEVER sent to GitHub:');
      if (privateKey && privateKey.trim()) {
        setPrivateKey(privateKey.trim());
      } else {
        throw new Error('Upload cancelled: ImageKit Private Key is required to sign uploads.');
      }
    }

    const token = window.crypto.randomUUID ? window.crypto.randomUUID() : `ik_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiration
    const signature = await generateSignature(token, expire, privateKey);

    const folder = options.folder || '/heritage';
    const cleanFileName = (options.fileName || file.name).replace(/\s+/g, '_');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', cleanFileName);
    formData.append('publicKey', publicKey);
    formData.append('signature', signature);
    formData.append('expire', expire.toString());
    formData.append('token', token);
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'true');

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', Array.isArray(options.tags) ? options.tags.join(',') : options.tags);
    }

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errReason = data.message || data.help || `HTTP ${response.status}`;
      if (errReason.toLowerCase().includes('signature') || errReason.toLowerCase().includes('key')) {
        setPrivateKey(''); // Reset bad key
        throw new Error(`ImageKit authorization error: ${errReason}. Please verify your Private Key.`);
      }
      throw new Error(`ImageKit Upload Failed: ${errReason}`);
    }

    return {
      fileId: data.fileId,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || data.url,
      size: data.size,
      filePath: data.filePath,
      height: data.height,
      width: data.width,
    };
  }

  /**
   * Deletes a file from ImageKit using HTTP Basic Auth
   */
  async function deleteFile(fileId) {
    const privateKey = getPrivateKey();
    if (!privateKey || !fileId) return false;

    try {
      const res = await fetch(`${API_ENDPOINT}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(privateKey + ':'),
        },
      });
      return res.status === 204 || res.ok;
    } catch (err) {
      console.warn('[ImageKit Delete Warning]', err.message);
      return false;
    }
  }

  return {
    getPublicKey,
    getUrlEndpoint,
    getPrivateKey,
    setPrivateKey,
    isConfigured,
    uploadFile,
    deleteFile,
  };
})();

if (typeof window !== 'undefined') {
  window.ImageKitService = ImageKitService;
}
