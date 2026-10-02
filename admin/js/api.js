const API = (() => {
  // Support local development, full-stack cloud hosting, and GitHub Pages
  const API_HOST = window.API_BASE_URL || localStorage.getItem('rhd_api_url') || (
    window.location.hostname.endsWith('github.io')
      ? 'https://rathore-heritage.onrender.com'
      : window.location.origin
  );
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
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    clearToken,
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
