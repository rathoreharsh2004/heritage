const Auth = (() => {
  function getUser() {
    try {
      const u = localStorage.getItem('rhd_admin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem('rhd_admin_user', JSON.stringify(user));
  }

  function isAuthenticated() {
    return !!API.getToken();
  }

  async function login(emailOrUsername, password) {
    const res = await API.post('/auth/login', { emailOrUsername, password });
    if (res.success && res.token) {
      API.setToken(res.token);
      setUser(res.admin);
      return res.admin;
    }
    throw new Error(res.message || 'Login failed');
  }

  function logout() {
    API.clearToken();
    window.location.hash = '#login';
    window.dispatchEvent(new Event('hashchange'));
  }

  async function checkSession() {
    if (!isAuthenticated()) return false;
    try {
      const res = await API.get('/auth/me');
      if (res.success && res.admin) {
        setUser(res.admin);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  return {
    getUser,
    setUser,
    isAuthenticated,
    login,
    logout,
    checkSession,
  };
})();
