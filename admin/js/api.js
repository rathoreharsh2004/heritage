const API = (() => {
  // Resilient API host detection for localhost, file://, custom ports, and cloud
  function resolveApiHost() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const stored = localStorage.getItem('rhd_api_url');
    if (stored) return stored;

    // GitHub Pages hosting
    if (window.location.hostname.endsWith('github.io')) {
      return 'https://rathore-heritage.onrender.com';
    }

    // Direct local file opening or non-5000 dev server (e.g., Live Server 5500)
    if (!window.location.origin ||
        window.location.origin === 'null' ||
        window.location.protocol === 'file:' ||
        (window.location.port && window.location.port !== '5000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
      return 'http://localhost:5000';
    }

    return window.location.origin;
  }

  const API_HOST = resolveApiHost();
  const BASE_URL = API_HOST.replace(/\/$/, '') + '/api';

  function getToken() {
    return localStorage.getItem('rhd_admin_token');
  }

  function setToken(token) {
    localStorage.setItem('rhd_admin_token', token);
  }

  function clearToken() {
    localStorage.removeItem('rhd_admin_token');
    localStorage.removeItem('rhd_admin_user');
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        clearToken();
        if (window.location.pathname.startsWith('/admin')) {
          window.location.hash = '#login';
          window.dispatchEvent(new Event('hashchange'));
        }
        throw new Error(data.message || 'Session expired. Please log in again.');
      }

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error('[API Error]', endpoint, err.message);
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        throw new Error(`Cannot reach backend server at ${BASE_URL}. Ensure Node.js server is running ("npm start") and access via http://localhost:5000/admin/`);
      }
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    clearToken,
    getBaseUrl: () => BASE_URL,
    getApiHost: () => API_HOST,
    setApiHost: (url) => {
      if (url) localStorage.setItem('rhd_api_url', url);
      else localStorage.removeItem('rhd_api_url');
      window.location.reload();
    },
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    put: (endpoint, body) => request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    del: (endpoint) => request(endpoint, { method: 'DELETE' }),
    upload: (endpoint, formData) => request(endpoint, {
      method: 'POST',
      body: formData,
    }),
  };
})();
