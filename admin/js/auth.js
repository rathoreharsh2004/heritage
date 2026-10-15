/**
 * Rathore Heritage Developers — Secure Firebase Authentication Service
 * Zero-server BaaS authentication backed by Google Firebase Auth.
 * Enforces real cryptographic sessions & Firebase Security Rules on Firestore.
 */

const Auth = (() => {
  let currentUser = null;

  function getUser() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const fbUser = firebase.auth().currentUser;
      if (fbUser) {
        return {
          uid: fbUser.uid,
          email: fbUser.email,
          username: fbUser.email ? fbUser.email.split('@')[0] : 'admin',
          role: 'admin',
        };
      }
    }
    try {
      const u = localStorage.getItem('rhd_admin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    if (user) {
      // Security: Store strictly public profile metadata, never passwords
      const safeProfile = {
        uid: user.uid,
        email: user.email,
        username: user.username || (user.email ? user.email.split('@')[0] : 'admin'),
        role: user.role || 'admin',
        lastLogin: user.lastLogin || new Date().toISOString(),
      };
      localStorage.setItem('rhd_admin_user', JSON.stringify(safeProfile));
    } else {
      localStorage.removeItem('rhd_admin_user');
    }
  }

  function isAuthenticated() {
    if (typeof firebase !== 'undefined' && firebase.auth && Database.isConfigured()) {
      return !!firebase.auth().currentUser;
    }
    return false;
  }

  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    // Authenticate via Firebase Authentication
    if (typeof firebase !== 'undefined' && firebase.auth && Database.isConfigured()) {
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const fbUser = userCredential.user;
        const profile = {
          uid: fbUser.uid,
          email: fbUser.email,
          username: fbUser.email ? fbUser.email.split('@')[0] : 'admin',
          role: 'admin',
          lastLogin: new Date().toISOString(),
        };
        setUser(profile);
        currentUser = profile;
        return profile;
      } catch (err) {
        console.error('[Firebase Auth Login Error]', err);
        let msg = err.message;
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. Please verify your admin credentials in Firebase Console.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Access temporarily disabled due to many failed attempts. Try again later or reset password.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'The email address format is invalid.';
        }
        throw new Error(msg);
      }
    }

    throw new Error('Firebase Authentication is not configured or ready. Please verify your Firebase connection.');
  }

  async function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        await firebase.auth().signOut();
      } catch (e) {}
    }
    setUser(null);
    currentUser = null;
    window.location.hash = '#login';
    window.dispatchEvent(new Event('hashchange'));
  }

  async function checkSession() {
    if (typeof firebase !== 'undefined' && firebase.auth && Database.isConfigured()) {
      return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((fbUser) => {
          unsubscribe();
          if (fbUser) {
            const profile = {
              uid: fbUser.uid,
              email: fbUser.email,
              username: fbUser.email ? fbUser.email.split('@')[0] : 'admin',
              role: 'admin',
            };
            setUser(profile);
            currentUser = profile;
            resolve(true);
          } else {
            setUser(null);
            currentUser = null;
            resolve(false);
          }
        });
      });
    }

    return isAuthenticated();
  }

  async function changePassword(newPassword) {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      await firebase.auth().currentUser.updatePassword(newPassword);
      return true;
    }
    throw new Error('To change passwords in cloud production, connect Firebase Authentication.');
  }

  async function sendPasswordReset(email) {
    if (typeof firebase !== 'undefined' && firebase.auth && Database.isConfigured()) {
      await firebase.auth().sendPasswordResetEmail(email);
      return true;
    }
    throw new Error('Password reset requires active Firebase Authentication setup.');
  }

  return {
    getUser,
    setUser,
    isAuthenticated,
    login,
    logout,
    checkSession,
    changePassword,
    sendPasswordReset,
  };
})();
