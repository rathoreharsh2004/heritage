/**
 * Rathore Heritage Developers — Universal Database Service
 * Zero-server BaaS layer powered by Firebase Firestore & Storage.
 * Seamlessly functions on GitHub Pages, custom domains, or offline local preview.
 */

const Database = (() => {
  let isFirebaseReady = false;
  let db = null;
  let auth = null;
  let storage = null;

  // Local fallback storage key (v11 ensures clean sync for Darbar section)
  const LOCAL_STORAGE_KEY = 'rhd_cms_data_v11';

  // Initialize Local Fallback Cache from DEFAULT_DATA
  function getLocalData() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    const initial = typeof DEFAULT_DATA !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_DATA)) : {
      settings: {},
      sections: {},
      leaders: [],
      craftsmanship: [],
      materials: [],
      projects: [],
      rawMaterials: [],
      darbarSlides: [],
      services: [],
      reviews: [],
      enquiries: [],
      media: [],
      auditLogs: [],
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  }

  function saveLocalData(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Initialize Firebase Connection
  function init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Database] Firebase SDK not loaded in DOM, using local fallback.');
      return false;
    }

    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId || cfg.apiKey.includes('REPLACE_WITH_YOUR_FIREBASE_API_KEY')) {
      console.warn('[Database] Firebase Config not yet configured. Operating with local store.');
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      db = firebase.firestore();
      auth = firebase.auth();
      // Storage removed — ImageKit handles all media storage and CDN delivery
      if (typeof firebase.analytics === 'function' && cfg.measurementId) {
        try { firebase.analytics(); } catch (e) {}
      }
      isFirebaseReady = true;
      console.log(`[Database] Cloud Firestore initialized for project: ${cfg.projectId}`);
      return true;
    } catch (err) {
      console.error('[Database Init Error]', err);
      return false;
    }
  }

  // Try initializing on script load
  init();

  // ─────────────────────────────────────────────────────────────
  // 1. BRAND & WEBSITE SETTINGS
  // ─────────────────────────────────────────────────────────────
  async function getSettings() {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection('settings').doc('general').get();
        if (snap.exists) return snap.data();
      } catch (err) {
        console.warn('[Database] Firestore settings read failed, using local fallback:', err.message);
      }
    }
    const local = getLocalData();
    return local.settings || {};
  }

  async function saveSettings(data) {
    if (isFirebaseReady && db) {
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('settings').doc('general').set(data, { merge: true });
      await addAuditLog('Update', 'WebsiteSettings', 'Updated global brand settings');
    }
    const local = getLocalData();
    local.settings = { ...(local.settings || {}), ...data };
    saveLocalData(local);
    return local.settings;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PAGE SECTIONS & EDITABLE COPY
  // ─────────────────────────────────────────────────────────────
  async function getSections() {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection('sections').get();
        if (!snap.empty) {
          const sections = {};
          snap.forEach(doc => {
            sections[doc.id] = doc.data();
          });
          return sections;
        }
      } catch (err) {
        console.warn('[Database] Firestore sections read failed, using local fallback:', err.message);
      }
    }
    const local = getLocalData();
    return local.sections || {};
  }

  async function getSection(sectionKey) {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection('sections').doc(sectionKey).get();
        if (snap.exists) return snap.data();
      } catch (err) {}
    }
    const local = getLocalData();
    return (local.sections && local.sections[sectionKey]) || null;
  }

  async function saveSection(sectionKey, data) {
    if (isFirebaseReady && db) {
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('sections').doc(sectionKey).set(data, { merge: true });
      await addAuditLog('Update', 'PageSection', `Updated section [${sectionKey}]`);
    }
    const local = getLocalData();
    if (!local.sections) local.sections = {};
    local.sections[sectionKey] = { ...(local.sections[sectionKey] || {}), ...data };
    saveLocalData(local);
    return local.sections[sectionKey];
  }

  // ─────────────────────────────────────────────────────────────
  // 3. GENERIC COLLECTION CRUD (Projects, Crafts, Materials, etc.)
  // ─────────────────────────────────────────────────────────────
  async function getCollection(colName) {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection(colName).orderBy('order', 'asc').get();
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        // Fallback without orderBy if index not yet generated
        try {
          const snap = await db.collection(colName).get();
          if (!snap.empty) {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            return list.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
        } catch (e) {
          console.warn(`[Database] Firestore collection [${colName}] read failed:`, e.message);
        }
      }
    }
    const local = getLocalData();
    const list = local[colName] || [];
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async function getDoc(colName, id) {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection(colName).doc(id).get();
        if (snap.exists) return { id: snap.id, ...snap.data() };
      } catch (err) {}
    }
    const local = getLocalData();
    const list = local[colName] || [];
    return list.find(item => item.id === id || item._id === id) || null;
  }

  async function createDoc(colName, data) {
    const id = data.id || `${colName.slice(0, 4)}-${Date.now()}`;
    data.id = id;

    if (isFirebaseReady && db) {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(colName).doc(id).set(data);
      await addAuditLog('Create', colName, `Created item [${data.title || data.name || id}]`);
      return { id, ...data };
    }

    const local = getLocalData();
    if (!local[colName]) local[colName] = [];
    local[colName].push(data);
    saveLocalData(local);
    return data;
  }

  async function updateDoc(colName, id, data) {
    if (isFirebaseReady && db) {
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(colName).doc(id).set(data, { merge: true });
      await addAuditLog('Update', colName, `Updated item [${data.title || data.name || id}]`);
      return { id, ...data };
    }

    const local = getLocalData();
    if (!local[colName]) local[colName] = [];
    const idx = local[colName].findIndex(item => item.id === id || item._id === id);
    if (idx !== -1) {
      local[colName][idx] = { ...local[colName][idx], ...data };
    } else {
      local[colName].push({ id, ...data });
    }
    saveLocalData(local);
    return { id, ...data };
  }

  async function deleteDoc(colName, id) {
    if (isFirebaseReady && db) {
      await db.collection(colName).doc(id).delete();
      await addAuditLog('Delete', colName, `Deleted record [${id}]`);
      return true;
    }

    const local = getLocalData();
    if (local[colName]) {
      local[colName] = local[colName].filter(item => item.id !== id && item._id !== id);
      saveLocalData(local);
    }
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CLIENT ENQUIRIES
  // ─────────────────────────────────────────────────────────────
  async function getEnquiries(statusFilter = 'all') {
    if (isFirebaseReady && db) {
      try {
        let query = db.collection('enquiries');
        if (statusFilter && statusFilter !== 'all') {
          query = query.where('status', '==', statusFilter);
        }
        const snap = await query.get();
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt ? (d.data().createdAt.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt) : new Date().toISOString(),
        }));
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (err) {
        console.warn('[Database] Firestore enquiries read failed:', err.message);
      }
    }
    const local = getLocalData();
    let list = local.enquiries || [];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(e => e.status === statusFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function createEnquiry(payload) {
    const data = {
      ...payload,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseReady && db) {
      try {
        const ref = await db.collection('enquiries').add({
          ...payload,
          status: 'new',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return { id: ref.id, ...data };
      } catch (err) {
        console.warn('[Database] Could not save enquiry to Firestore:', err.message);
      }
    }

    const local = getLocalData();
    if (!local.enquiries) local.enquiries = [];
    const id = `enq-${Date.now()}`;
    const doc = { id, ...data };
    local.enquiries.unshift(doc);
    saveLocalData(local);
    return doc;
  }

  async function updateEnquiryStatus(id, status) {
    if (isFirebaseReady && db) {
      await db.collection('enquiries').doc(id).update({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await addAuditLog('Update', 'Enquiry', `Updated enquiry [${id}] status to [${status}]`);
      return true;
    }

    const local = getLocalData();
    if (local.enquiries) {
      const item = local.enquiries.find(e => e.id === id);
      if (item) item.status = status;
      saveLocalData(local);
    }
    return true;
  }

  async function deleteEnquiry(id) {
    if (isFirebaseReady && db) {
      await db.collection('enquiries').doc(id).delete();
      await addAuditLog('Delete', 'Enquiry', `Deleted enquiry [${id}]`);
      return true;
    }

    const local = getLocalData();
    if (local.enquiries) {
      local.enquiries = local.enquiries.filter(e => e.id !== id);
      saveLocalData(local);
    }
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. MEDIA LIBRARY & CLOUD STORAGE
  // ─────────────────────────────────────────────────────────────
  async function getMedia(search = '', category = 'all') {
    if (isFirebaseReady && db) {
      try {
        let query = db.collection('media');
        if (category && category !== 'all') {
          query = query.where('category', '==', category);
        }
        const snap = await query.get();
        let list = snap.docs.map(d => ({
          id: d.id,
          _id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt ? (d.data().createdAt.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt) : new Date().toISOString(),
        }));
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(m => (m.filename && m.filename.toLowerCase().includes(s)) || (m.altText && m.altText.toLowerCase().includes(s)));
        }
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (err) {
        console.warn('[Database] Firestore media read failed:', err.message);
      }
    }

    const local = getLocalData();
    let list = local.media || [];
    if (category && category !== 'all') {
      list = list.filter(m => m.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => (m.filename && m.filename.toLowerCase().includes(s)) || (m.altText && m.altText.toLowerCase().includes(s)));
    }
    return list;
  }

  async function uploadMedia(file, category = 'general', altText = '') {
    const filename = file.name;
    const cleanAlt = altText || filename.split('.')[0];
    const timestamp = Date.now();

    // 1. If ImageKit service is present, upload directly to ImageKit
    if (typeof ImageKitService !== 'undefined' && ImageKitService.getPublicKey()) {
      const ikResult = await ImageKitService.uploadFile(file, {
        fileName: filename,
        folder: '/heritage',
      });

      const mediaDoc = {
        filename: ikResult.name || filename,
        originalName: filename,
        url: ikResult.url,
        thumbnailUrl: ikResult.thumbnailUrl || ikResult.url,
        fileId: ikResult.fileId,
        size: ikResult.size || file.size,
        mimeType: file.type || 'image/jpeg',
        altText: cleanAlt,
        category,
        provider: 'imagekit',
        createdAt: isFirebaseReady && db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      };

      if (isFirebaseReady && db) {
        const docRef = await db.collection('media').add(mediaDoc);
        await addAuditLog('Upload', 'Media', `Uploaded image [${filename}] to ImageKit CDN`);
        return { id: docRef.id, _id: docRef.id, ...mediaDoc };
      }

      const local = getLocalData();
      if (!local.media) local.media = [];
      const item = { id: `media-${timestamp}`, _id: `media-${timestamp}`, ...mediaDoc };
      local.media.unshift(item);
      saveLocalData(local);
      return item;
    }

    // Local / Offline fallback: Convert file to local object URL or Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const id = `media-${timestamp}`;
        const item = {
          id,
          _id: id,
          filename,
          originalName: filename,
          url: e.target.result,
          mimeType: file.type,
          size: file.size,
          altText: cleanAlt,
          category,
          provider: 'local',
          createdAt: new Date().toISOString(),
        };
        const local = getLocalData();
        if (!local.media) local.media = [];
        local.media.unshift(item);
        saveLocalData(local);
        resolve(item);
      };
      reader.readAsDataURL(file);
    });
  }

  async function deleteMedia(id) {
    if (isFirebaseReady && db) {
      const doc = await db.collection('media').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.fileId && typeof ImageKitService !== 'undefined') {
          await ImageKitService.deleteFile(data.fileId);
        }
        await db.collection('media').doc(id).delete();
        await addAuditLog('Delete', 'Media', `Deleted media file [${data.filename || id}]`);
      }
      return true;
    }

    const local = getLocalData();
    if (local.media) {
      local.media = local.media.filter(m => m.id !== id && m._id !== id);
      saveLocalData(local);
    }
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. AUDIT LOGS
  // ─────────────────────────────────────────────────────────────
  async function addAuditLog(action, entity, details) {
    const logItem = {
      action,
      entity,
      details,
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseReady && db) {
      try {
        const user = auth ? auth.currentUser : null;
        await db.collection('auditLogs').add({
          action,
          entity,
          details,
          adminEmail: user ? user.email : 'admin',
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {}
    }

    const local = getLocalData();
    if (!local.auditLogs) local.auditLogs = [];
    local.auditLogs.unshift(logItem);
    if (local.auditLogs.length > 100) local.auditLogs.pop();
    saveLocalData(local);
  }

  async function getAuditLogs() {
    if (isFirebaseReady && db) {
      try {
        const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(50).get();
        if (!snap.empty) {
          return snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp ? (d.data().timestamp.toDate ? d.data().timestamp.toDate().toISOString() : d.data().timestamp) : new Date().toISOString(),
          }));
        }
      } catch (err) {
        try {
          const snap = await db.collection('auditLogs').limit(50).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}
      }
    }
    const local = getLocalData();
    return local.auditLogs || [];
  }

  // ─────────────────────────────────────────────────────────────
  // 7. DASHBOARD METRICS
  // ─────────────────────────────────────────────────────────────
  async function getDashboardStats() {
    const [projects, craftsmanship, materials, enquiries, media, logs] = await Promise.all([
      getCollection('projects'),
      getCollection('craftsmanship'),
      getCollection('materials'),
      getEnquiries(),
      getMedia(),
      getAuditLogs(),
    ]);

    return {
      stats: {
        projects: projects.length,
        craftsmanship: craftsmanship.length,
        materials: materials.length,
        enquiries: enquiries.length,
        newEnquiries: enquiries.filter(e => e.status === 'new').length,
        mediaFiles: media.length,
      },
      recentEnquiries: enquiries.slice(0, 5),
      recentLogs: logs.slice(0, 8),
      recentMedia: media.slice(0, 6),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 8. 1-CLICK SEEDING: POPULATE FIRESTORE WITH HERITAGE CONTENT
  // ─────────────────────────────────────────────────────────────
  async function seedInitialData(force = false) {
    if (!isFirebaseReady || !db) {
      console.warn('[Database Seed] Firebase is not connected. Populating local fallback store.');
      saveLocalData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
      return { success: true, count: 50, local: true };
    }

    try {
      // Check if already seeded
      const checkSnap = await db.collection('projects').limit(1).get();
      if (!checkSnap.empty && !force) {
        return { success: true, message: 'Database already initialized' };
      }

      console.log('[Database Seed] Starting cloud Firestore seed of authentic Rathore Heritage data...');
      const batch = db.batch();

      // 1. Settings
      const settingsRef = db.collection('settings').doc('general');
      batch.set(settingsRef, DEFAULT_DATA.settings);

      // 2. Sections
      for (const [key, sectionData] of Object.entries(DEFAULT_DATA.sections)) {
        const secRef = db.collection('sections').doc(key);
        batch.set(secRef, sectionData);
      }

      // 3. Projects
      for (const proj of DEFAULT_DATA.projects) {
        const projRef = db.collection('projects').doc(proj.slug);
        batch.set(projRef, proj);
      }

      // 4. Craftsmanship
      for (const craft of DEFAULT_DATA.craftsmanship) {
        const craftRef = db.collection('craftsmanship').doc(craft.id);
        batch.set(craftRef, craft);
      }

      // 5. Materials
      for (const mat of DEFAULT_DATA.materials) {
        const matRef = db.collection('materials').doc(mat.id);
        batch.set(matRef, mat);
      }

      // 6. Leaders
      for (const leader of DEFAULT_DATA.leaders) {
        const leaderRef = db.collection('leaders').doc(leader.id);
        batch.set(leaderRef, leader);
      }

      // 7. Raw Materials
      for (const raw of DEFAULT_DATA.rawMaterials) {
        const rawRef = db.collection('rawMaterials').doc(raw.id);
        batch.set(rawRef, raw);
      }

      // 8. Darbar Slides
      for (const slide of DEFAULT_DATA.darbarSlides) {
        const slideRef = db.collection('darbarSlides').doc(slide.id);
        batch.set(slideRef, slide);
      }

      // 9. Services
      for (const srv of DEFAULT_DATA.services) {
        const srvRef = db.collection('services').doc(srv.id);
        batch.set(srvRef, srv);
      }

      await batch.commit();
      await addAuditLog('Seed', 'Database', 'Initialized Firestore with complete authentic Rathore Heritage content');
      console.log('✅ [Database Seed] Successfully populated Cloud Firestore!');
      return { success: true, message: 'All website content successfully seeded to Cloud Firestore' };
    } catch (err) {
      console.error('[Database Seed Error]', err);
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────
  return {
    init,
    isConfigured: () => isFirebaseReady,
    getSettings,
    saveSettings,
    getSections,
    getSection,
    saveSection,
    getCollection,
    getDoc,
    createDoc,
    updateDoc,
    deleteDoc,
    getEnquiries,
    createEnquiry,
    updateEnquiryStatus,
    deleteEnquiry,
    getMedia,
    uploadMedia,
    deleteMedia,
    getAuditLogs,
    addAuditLog,
    getDashboardStats,
    seedInitialData,
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.Database = Database;
}
