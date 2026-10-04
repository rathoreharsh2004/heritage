/**
 * Rathore Heritage Developers — Admin Portal Controller (Zero-Server Architecture)
 * Fully compatible with GitHub Pages, powered by Firebase BaaS & Local Data Store.
 */

const App = (() => {
  // Toast Notification System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'circle-check' : type === 'danger' ? 'triangle-exclamation' : 'circle-info';
    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ─────────────────────────────────────────────────────────────
  // MEDIA PICKER MODAL
  // ─────────────────────────────────────────────────────────────
  let activeMediaCallback = null;

  function openMediaPicker(onSelect) {
    activeMediaCallback = onSelect;
    const modal = document.getElementById('mediaPickerModal');
    modal.classList.add('active');
    loadMediaPickerItems();
  }

  function closeMediaPicker() {
    const modal = document.getElementById('mediaPickerModal');
    modal.classList.remove('active');
    activeMediaCallback = null;
  }

  async function loadMediaPickerItems(search = '', category = 'all') {
    const grid = document.getElementById('mediaPickerGrid');
    grid.innerHTML = '<div style="padding:20px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading media files...</div>';

    try {
      const media = await Database.getMedia(search, category);
      if (!media || media.length === 0) {
        grid.innerHTML = '<div style="padding:20px; color:var(--text-muted);">No media files found. Upload a new file above.</div>';
        return;
      }

      grid.innerHTML = '';
      media.forEach(m => {
        const item = document.createElement('div');
        item.className = 'media-item';
        const isVideo = (m.mimeType && m.mimeType.startsWith('video')) || (m.filename && m.filename.endsWith('.mp4'));
        const displaySrc = m.url || m.filename;
        item.innerHTML = `
          ${isVideo 
            ? `<video src="${displaySrc}" preload="metadata"></video>` 
            : `<img src="${displaySrc}" alt="${m.altText || m.filename}">`
          }
          <div class="media-item-info">${m.filename}</div>
        `;
        item.addEventListener('click', () => {
          if (activeMediaCallback) {
            activeMediaCallback(m.filename, displaySrc);
          }
          closeMediaPicker();
        });
        grid.appendChild(item);
      });
    } catch (err) {
      grid.innerHTML = `<div style="padding:20px; color:var(--danger);">Failed to load media: ${err.message}</div>`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ROUTING & NAVIGATION
  // ─────────────────────────────────────────────────────────────
  const routes = {};

  function registerRoute(hash, renderFunc) {
    routes[hash] = renderFunc;
  }

  async function handleRouting() {
    if (!Auth.isAuthenticated()) {
      renderLogin();
      return;
    }

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    const hash = (window.location.hash || '#dashboard').replace('#', '');

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === `#${hash}`);
    });

    // Update topbar title
    const activeNav = document.querySelector(`.nav-item[href="#${hash}"]`);
    const topTitle = document.getElementById('pageTitle');
    if (topTitle && activeNav) {
      topTitle.textContent = activeNav.textContent.trim();
    }

    // Call handler
    const handler = routes[hash] || renderDashboard;
    const body = document.getElementById('pageBody');
    body.innerHTML = '<div style="padding:30px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:10px;">Loading section data...</p></div>';

    try {
      await handler(body);
    } catch (err) {
      body.innerHTML = `
        <div class="card" style="border-color:var(--danger);">
          <h3 style="color:var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Error loading view</h3>
          <p style="margin-top:8px; color:var(--text-muted);">${err.message}</p>
          <button class="btn btn-primary btn-sm" style="margin-top:16px;" onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. LOGIN VIEW
  // ─────────────────────────────────────────────────────────────
  function renderLogin() {
    document.getElementById('appContainer').style.display = 'none';
    const authScreen = document.getElementById('authScreen');
    authScreen.style.display = 'flex';

    const isConnected = Database.isConfigured();
    const projectId = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId) || 'None';

    authScreen.innerHTML = `
      <div class="auth-box">
        <img class="auth-logo" src="logo.PNG" onerror="this.onerror=null; this.src='../logo.PNG';" alt="Rathore Heritage Logo">
        <h1>Rathore Heritage</h1>
        <p>CMS & Administrative Control Portal</p>
        <form id="loginForm">
          <div class="form-group" style="text-align:left;">
            <label class="form-label">Admin Email</label>
            <input type="email" class="form-control" name="email" required value="admin@rathoreheritage.com" placeholder="admin@rathoreheritage.com">
          </div>
          <div class="form-group" style="text-align:left;">
            <label class="form-label">Admin Password</label>
            <input type="password" class="form-control" name="password" required value="Admin@123456" placeholder="Enter password">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px; padding:12px;">
            Secure Login <i class="fa-solid fa-shield-halved"></i>
          </button>
        </form>
        <div style="margin-top:24px; padding-top:14px; border-top:1px solid var(--border-color); font-size:12px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
          <span>
            ${isConnected 
              ? `<span style="color:#22c55e;"><i class="fa-solid fa-cloud-bolt"></i> Firebase: ${projectId}</span>` 
              : `<span style="color:var(--primary);"><i class="fa-solid fa-hard-drive"></i> Local / Demo Mode</span>`
            }
          </span>
          <button type="button" id="btnConfigFirebase" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; text-decoration:underline;">Firebase Setup</button>
        </div>
      </div>
    `;

    const btnConfig = document.getElementById('btnConfigFirebase');
    if (btnConfig) {
      btnConfig.addEventListener('click', () => {
        openFirebaseConfigModal();
      });
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        await Auth.login(fd.get('email'), fd.get('password'));
        showToast('Logged in successfully', 'success');
        window.location.hash = '#dashboard';
        handleRouting();
      } catch (err) {
        showToast(err.message, 'danger');
        btn.disabled = false;
        btn.innerHTML = 'Secure Login <i class="fa-solid fa-shield-halved"></i>';
      }
    });
  }

  function openFirebaseConfigModal() {
    const current = JSON.stringify(window.FIREBASE_CONFIG, null, 2);
    const jsonStr = prompt('Paste your Firebase Project Configuration JSON below (or edit firebase-config.js directly):', current);
    if (jsonStr !== null && jsonStr.trim()) {
      try {
        const parsed = JSON.parse(jsonStr.trim());
        localStorage.setItem('rhd_firebase_config', JSON.stringify(parsed));
        showToast('Firebase configuration saved! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        alert('Invalid JSON format. Please ensure valid JSON with apiKey and projectId.');
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  async function renderDashboard(container) {
    const res = await Database.getDashboardStats();
    const { stats, recentEnquiries, recentLogs, recentMedia } = res;
    const isCloud = Database.isConfigured();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div style="font-size:13px; color:var(--text-muted);">
          Architecture: <strong style="color:var(--primary-light);">Zero-Server GitHub Pages</strong> &bull; 
          Storage: <strong>${isCloud ? 'Cloud Firestore & ImageKit CDN' : 'Local / Offline Store'}</strong>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-secondary btn-sm" onclick="App.seedCloudData()">
            <i class="fa-solid fa-cloud-arrow-up"></i> Seed / Reset Cloud Content
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-archway"></i></div>
          <div class="stat-info">
            <h3>${stats.projects || 0}</h3>
            <p>Signature Projects</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-gem"></i></div>
          <div class="stat-info">
            <h3>${stats.craftsmanship || 0}</h3>
            <p>Craftsmanship Cards</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-info">
            <h3>${stats.materials || 0}</h3>
            <p>Material Elements</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-images"></i></div>
          <div class="stat-info">
            <h3>${stats.mediaFiles || 0}</h3>
            <p>Cloud Media Files</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-envelope-open-text"></i></div>
          <div class="stat-info">
            <h3>${stats.enquiries || 0}</h3>
            <p>Total Enquiries (${stats.newEnquiries || 0} New)</p>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap:24px;">
        <!-- Recent Enquiries -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Client Enquiries</h3>
            <a href="#enquiries" class="btn btn-secondary btn-sm">View All</a>
          </div>
          ${recentEnquiries && recentEnquiries.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentEnquiries.map(e => `
                    <tr>
                      <td><strong>${e.name}</strong><br><small style="color:var(--text-muted);">${e.phone}</small></td>
                      <td><span class="badge badge-info">${e.projectType || 'General'}</span></td>
                      <td><small style="color:var(--text-muted);">${new Date(e.createdAt).toLocaleDateString()}</small></td>
                      <td><span class="badge badge-${e.status === 'new' ? 'warning' : 'success'}">${e.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color:var(--text-muted); padding:20px 0;">No client enquiries submitted yet.</p>'}
        </div>

        <!-- Recent Audit Events -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Activity Logs</h3>
            <a href="#audit" class="btn btn-secondary btn-sm">View All</a>
          </div>
          ${recentLogs && recentLogs.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentLogs.map(l => `
                    <tr>
                      <td><span class="badge badge-${l.action === 'Create' ? 'success' : l.action === 'Delete' ? 'danger' : 'info'}">${l.action}</span></td>
                      <td><strong>${l.entity || ''}</strong><br><small style="color:var(--text-muted);">${l.details || ''}</small></td>
                      <td><small style="color:var(--text-muted);">${new Date(l.timestamp).toLocaleTimeString()}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color:var(--text-muted); padding:20px 0;">No activity logged yet.</p>'}
        </div>
      </div>
    `;
  }

  async function seedCloudData() {
    if (!confirm('This will seed the complete authentic Rathore Heritage dataset (all 12 sections, projects, crafts, materials, etc.) into Cloud Firestore. Proceed?')) {
      return;
    }
    showToast('Seeding website content to Firestore...', 'info');
    try {
      await Database.seedInitialData(true);
      showToast('Website content successfully seeded to Firestore!', 'success');
      handleRouting();
    } catch (err) {
      showToast('Seed failed: ' + err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. WEBSITE SETTINGS VIEW
  // ─────────────────────────────────────────────────────────────
  async function renderSettings(container) {
    const s = (await Database.getSettings()) || {};

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">General Brand & Contact Settings</h3>
          <button class="btn btn-primary" id="saveSettingsBtn">Save Settings <i class="fa-solid fa-floppy-disk"></i></button>
        </div>
        <form id="settingsForm">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" class="form-control" name="companyName" value="${s.companyName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Brand Tagline</label>
              <input type="text" class="form-control" name="tagline" value="${s.tagline || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Brand Logo</label>
              <div class="image-picker-field">
                <img src="${s.logo || 'logo.PNG'}" class="image-preview-thumb" id="logoPreview">
                <input type="text" class="form-control" name="logo" id="logoInput" value="${s.logo || ''}">
                <button type="button" class="btn btn-secondary btn-sm" onclick="App.openMediaPicker((fn, url) => { document.getElementById('logoInput').value = fn; document.getElementById('logoPreview').src = url; })">Browse</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Primary Phone (Call & Floating)</label>
              <input type="text" class="form-control" name="primaryPhone" value="${s.primaryPhone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Secondary Phone</label>
              <input type="text" class="form-control" name="secondaryPhone" value="${s.secondaryPhone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">WhatsApp Number (Digits only, with country code)</label>
              <input type="text" class="form-control" name="whatsappNumber" value="${s.whatsappNumber || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Official Email</label>
              <input type="email" class="form-control" name="email" value="${s.email || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Instagram Profile URL</label>
              <input type="url" class="form-control" name="instagramUrl" value="${s.instagramUrl || ''}">
            </div>
            <div class="form-group full-width">
              <label class="form-label">Office Address</label>
              <textarea class="form-control" name="address" rows="2">${s.address || 'Ground Floor & First Floor, Building No. 14/21, Oladar Haveli, Lake Palace Road, Kalaji Goraji, Udaipur, Rajasthan - 313001, India'}</textarea>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Footer Brand Narrative</label>
              <textarea class="form-control" name="footerDescription">${s.footerDescription || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Copyright Credit</label>
              <input type="text" class="form-control" name="copyrightCredit" value="${s.copyrightCredit || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Preloader Title</label>
              <input type="text" class="form-control" name="preloaderTitle" value="${s.preloaderTitle || ''}">
            </div>
          </div>
        </form>
      </div>
    `;

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
      const form = document.getElementById('settingsForm');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        await Database.saveSettings(data);
        showToast('Settings saved successfully', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SECTIONS CONTENT MANAGER (Hero, Legacy, Consultancy, etc.)
  // ─────────────────────────────────────────────────────────────
  async function renderSections(container) {
    const secObj = (await Database.getSections()) || {};
    const friendlyTitles = {
      hero: 'Hero Section (Main Banner)',
      legacy: 'Raj Virasat (About / Legacy)',
      leadershipHeader: 'Leadership & Vision Header',
      craftsmanshipHeader: 'Shilp Kala (Craftsmanship Header)',
      materialsHeader: 'Material Palette Header',
      projectsHeader: 'Signature Projects Header',
      consultancy: 'Heritage Consultancy & 6 Process Steps',
      rawMaterialsHeader: 'Raw Materials Header',
      darbarGalleryHeader: 'Darbar Gallery Header',
      whyRhd: 'Why Choose RHD (Below Darbar Gallery)',
      approach: 'Approach & Principles',
      servicesHeader: 'What We Offer (Services Header)'
    };
    const sections = Object.entries(secObj).map(([sectionKey, data]) => ({
      sectionKey,
      title: friendlyTitles[sectionKey] || data.title || sectionKey,
      data,
    }));

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        ${sections.map(sec => `
          <div class="card" id="secCard_${sec.sectionKey}">
            <div class="card-header">
              <div>
                <h3 class="card-title">${sec.title || sec.sectionKey}</h3>
                <small style="color:var(--text-muted); font-size:11px;">Section Key: <code>${sec.sectionKey}</code></small>
              </div>
              <button class="btn btn-primary btn-sm" onclick="App.saveSection('${sec.sectionKey}')">
                Save Changes <i class="fa-solid fa-floppy-disk"></i>
              </button>
            </div>
            <div class="form-grid">
              ${renderSectionFormFields(sec)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSectionFormFields(sec) {
    const d = sec.data || {};
    let html = '';

    if (d.kicker !== undefined) {
      html += `<div class="form-group full-width"><label class="form-label">Hero Kicker</label><input type="text" class="form-control" data-key="kicker" value="${d.kicker || ''}"></div>`;
    }
    if (d.eyebrow !== undefined) {
      html += `<div class="form-group"><label class="form-label">Eyebrow</label><input type="text" class="form-control" data-key="eyebrow" value="${d.eyebrow || ''}"></div>`;
    }
    if (d.heading !== undefined) {
      const headingVal = (d.heading || '').replace(/"/g, '&quot;');
      html += `<div class="form-group"><label class="form-label">Heading</label><input type="text" class="form-control" data-key="heading" value="${headingVal}"></div>`;
    }
    if (d.quote !== undefined) {
      html += `<div class="form-group"><label class="form-label">Quote</label><input type="text" class="form-control" data-key="quote" value="${d.quote || ''}"></div>`;
    }
    if (d.intro !== undefined) {
      html += `<div class="form-group full-width"><label class="form-label">Intro Description</label><textarea class="form-control" data-key="intro">${d.intro || ''}</textarea></div>`;
    }
    if (d.description !== undefined && typeof d.description === 'string') {
      html += `<div class="form-group full-width"><label class="form-label">Description</label><textarea class="form-control" data-key="description">${d.description || ''}</textarea></div>`;
    }
    if (d.signature !== undefined) {
      html += `<div class="form-group"><label class="form-label">Signature / Tagline</label><input type="text" class="form-control" data-key="signature" value="${d.signature || ''}"></div>`;
    }
    if (d.image !== undefined) {
      html += `
        <div class="form-group">
          <label class="form-label">Featured Image</label>
          <div class="image-picker-field">
            <img src="${d.image}" class="image-preview-thumb" id="thumb_${sec.sectionKey}">
            <input type="text" class="form-control" data-key="image" id="input_${sec.sectionKey}" value="${d.image}">
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.openMediaPicker((fn, url) => { document.getElementById('input_${sec.sectionKey}').value = fn; document.getElementById('thumb_${sec.sectionKey}').src = url; })">Browse</button>
          </div>
        </div>
      `;
    }
    if (d.videoSrc !== undefined) {
      html += `<div class="form-group"><label class="form-label">Video Background File</label><input type="text" class="form-control" data-key="videoSrc" value="${d.videoSrc || ''}"></div>`;
    }
    if (d.ctaText !== undefined) {
      html += `<div class="form-group"><label class="form-label">CTA Button Text</label><input type="text" class="form-control" data-key="ctaText" value="${d.ctaText || ''}"></div>`;
    }
    if (d.ctaLink !== undefined) {
      html += `<div class="form-group"><label class="form-label">CTA Button Link</label><input type="text" class="form-control" data-key="ctaLink" value="${d.ctaLink || ''}"></div>`;
    }

    if (Array.isArray(d.paragraphs)) {
      html += `
        <div class="form-group full-width">
          <label class="form-label">Story Paragraphs (Separated by newlines)</label>
          <textarea class="form-control" style="min-height:140px;" data-key="paragraphs_lines">${d.paragraphs.join('\n\n')}</textarea>
        </div>
      `;
    }

    if (Array.isArray(d.steps) && d.steps.length > 0) {
      html += `
        <div class="form-group full-width">
          <label class="form-label">Consultancy Process Steps (Numbered Track)</label>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-top:6px;">
            ${d.steps.map((s, idx) => `
              <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:10px 12px; border-radius:6px;">
                <label style="font-size:11px; font-weight:600; color:var(--primary); display:block; margin-bottom:4px;">Step ${s.step || String(idx + 1).padStart(2, '0')}</label>
                <input type="text" class="form-control step-title-input" data-step-idx="${idx}" data-step-num="${s.step || String(idx + 1).padStart(2, '0')}" value="${(s.title || '').replace(/"/g, '&quot;')}" style="font-size:12px;">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (Array.isArray(d.cards) && d.cards.length > 0) {
      html += `
        <div class="form-group full-width">
          <label class="form-label">Feature Cards</label>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-top:6px;">
            ${d.cards.map((c, idx) => `
              <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:6px;">
                <div style="font-weight:600; font-size:12px; color:var(--primary); margin-bottom:6px;">Card ${c.num || String(idx + 1).padStart(2, '0')}</div>
                <input type="text" class="form-control card-title-input" data-card-idx="${idx}" data-card-num="${c.num || String(idx + 1).padStart(2, '0')}" placeholder="Card Title" value="${(c.title || '').replace(/"/g, '&quot;')}" style="margin-bottom:8px; font-size:12px; font-weight:600;">
                <textarea class="form-control card-text-input" data-card-idx="${idx}" placeholder="Card Description" style="min-height:70px; font-size:12px;">${c.text || ''}</textarea>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (Array.isArray(d.principles) && d.principles.length > 0) {
      html += `
        <div class="form-group full-width">
          <label class="form-label">Guiding Principles</label>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; margin-top:6px;">
            ${d.principles.map((p, idx) => `
              <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:10px 12px; border-radius:6px;">
                <label style="font-size:11px; font-weight:600; color:var(--primary); display:block; margin-bottom:4px;">Principle ${p.number || String(idx + 1).padStart(2, '0')}</label>
                <input type="text" class="form-control principle-title-input" data-principle-idx="${idx}" data-principle-num="${p.number || String(idx + 1).padStart(2, '0')}" value="${(p.title || '').replace(/"/g, '&quot;')}" style="font-size:12px;">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return html || '<p style="color:var(--text-muted);">No editable fields configured for this section.</p>';
  }

  async function saveSection(sectionKey) {
    const card = document.getElementById(`secCard_${sectionKey}`);
    const inputs = card.querySelectorAll('[data-key]');
    const data = {};

    inputs.forEach(input => {
      const key = input.getAttribute('data-key');
      if (key === 'paragraphs_lines') {
        data['paragraphs'] = input.value.split('\n\n').map(p => p.trim()).filter(Boolean);
      } else {
        data[key] = input.value;
      }
    });

    // Check for process steps
    const stepInputs = card.querySelectorAll('.step-title-input');
    if (stepInputs.length > 0) {
      data.steps = Array.from(stepInputs).map(inp => ({
        step: inp.getAttribute('data-step-num') || '',
        title: inp.value.trim()
      }));
    }

    // Check for feature cards (e.g. whyRhd)
    const cardTitleInputs = card.querySelectorAll('.card-title-input');
    if (cardTitleInputs.length > 0) {
      data.cards = Array.from(cardTitleInputs).map(inp => {
        const idx = inp.getAttribute('data-card-idx');
        const textInp = card.querySelector(`.card-text-input[data-card-idx="${idx}"]`);
        return {
          num: inp.getAttribute('data-card-num') || '',
          title: inp.value.trim(),
          text: textInp ? textInp.value.trim() : ''
        };
      });
    }

    // Check for principles
    const principleInputs = card.querySelectorAll('.principle-title-input');
    if (principleInputs.length > 0) {
      data.principles = Array.from(principleInputs).map(inp => ({
        number: inp.getAttribute('data-principle-num') || '',
        title: inp.value.trim()
      }));
    }

    try {
      await Database.saveSection(sectionKey, data);
      showToast(`Section "${sectionKey}" saved successfully`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. GENERIC CRUD CONTROLLER FOR WEBSITE ENTITIES
  // ─────────────────────────────────────────────────────────────
  const entityMap = {
    'projects': 'projects',
    'craftsmanship': 'craftsmanship',
    'leaders': 'leaders',
    'materials': 'materials',
    'rawmaterials': 'rawMaterials',
    'darbar': 'darbarSlides',
    'services': 'services',
  };

  function createCrudView({ title, endpoint, columns, fields, defaultData }) {
    return async function (container) {
      const colName = entityMap[endpoint] || endpoint;
      const items = (await Database.getCollection(colName)) || [];

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${title} (${items.length})</h3>
            <button class="btn btn-primary btn-sm" id="addNewBtn">
              <i class="fa-solid fa-plus"></i> Add New
            </button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  ${columns.map(c => `<th>${c.label}</th>`).join('')}
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? `<tr><td colspan="${columns.length + 1}" style="text-align:center; color:var(--text-muted);">No records found.</td></tr>` : ''}
                ${items.map(item => {
                  const itemId = item.id || item._id;
                  return `
                    <tr>
                      ${columns.map(c => `<td>${c.render ? c.render(item) : (item[c.key] || '')}</td>`).join('')}
                      <td style="text-align:right;">
                        <button class="btn btn-secondary btn-sm" onclick="App.openEditModal('${endpoint}', '${itemId}')" title="Edit">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteCrudItem('${endpoint}', '${itemId}')" title="Delete">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('addNewBtn').addEventListener('click', () => {
        App.openCreateModal(title, endpoint, fields, defaultData);
      });
    };
  }

  function openCreateModal(title, endpoint, fields, defaultData) {
    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Add New ${title.replace(/\s*\(\d+\)/, '')}`;

    const form = document.getElementById('crudForm');
    form.innerHTML = fields.map(f => renderFormField(f, defaultData[f.name] || '')).join('');

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.onclick = async () => {
      const data = extractFormData(form, fields);
      const colName = entityMap[endpoint] || endpoint;
      try {
        await Database.createDoc(colName, data);
        showToast('Created successfully', 'success');
        modalBackdrop.classList.remove('active');
        handleRouting();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function openEditModal(endpoint, id) {
    const colName = entityMap[endpoint] || endpoint;
    const item = await Database.getDoc(colName, id);
    if (!item) return;

    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Edit Record`;

    const fieldDef = crudRegistry[endpoint];
    if (!fieldDef) return;

    const form = document.getElementById('crudForm');
    form.innerHTML = fieldDef.map(f => renderFormField(f, item[f.name])).join('');

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.onclick = async () => {
      const data = extractFormData(form, fieldDef);
      try {
        await Database.updateDoc(colName, id, data);
        showToast('Updated successfully', 'success');
        modalBackdrop.classList.remove('active');
        handleRouting();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function deleteCrudItem(endpoint, id) {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    const colName = entityMap[endpoint] || endpoint;
    try {
      await Database.deleteDoc(colName, id);
      showToast('Deleted successfully', 'success');
      handleRouting();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  function renderFormField(field, val) {
    const value = val !== undefined && val !== null ? val : '';
    if (field.type === 'textarea') {
      return `<div class="form-group full-width"><label class="form-label">${field.label}</label><textarea class="form-control" name="${field.name}">${value}</textarea></div>`;
    }
    if (field.type === 'array-lines') {
      const text = Array.isArray(value) ? value.join('\n\n') : value;
      return `<div class="form-group full-width"><label class="form-label">${field.label} (Paragraphs separated by blank line)</label><textarea class="form-control" style="min-height:120px;" name="${field.name}">${text}</textarea></div>`;
    }
    if (field.type === 'array-csv') {
      const text = Array.isArray(value) ? value.join(', ') : value;
      return `<div class="form-group full-width"><label class="form-label">${field.label} (Comma-separated filenames)</label><textarea class="form-control" name="${field.name}">${text}</textarea></div>`;
    }
    if (field.type === 'image') {
      const uid = 'img_' + Math.random().toString(36).slice(2);
      return `
        <div class="form-group">
          <label class="form-label">${field.label}</label>
          <div class="image-picker-field">
            <img src="${value || 'logo.PNG'}" class="image-preview-thumb" id="${uid}_thumb">
            <input type="text" class="form-control" name="${field.name}" id="${uid}_input" value="${value}">
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.openMediaPicker((fn, url) => { document.getElementById('${uid}_input').value = fn; document.getElementById('${uid}_thumb').src = url; })">Browse</button>
          </div>
        </div>
      `;
    }
    if (field.type === 'checkbox') {
      return `<div class="form-group" style="display:flex; align-items:center; gap:8px; margin-top:24px;"><input type="checkbox" name="${field.name}" ${value ? 'checked' : ''} style="width:18px; height:18px;"><label class="form-label" style="margin-bottom:0;">${field.label}</label></div>`;
    }
    if (field.type === 'select') {
      return `
        <div class="form-group">
          <label class="form-label">${field.label}</label>
          <select class="form-control" name="${field.name}">
            ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>
      `;
    }
    return `<div class="form-group"><label class="form-label">${field.label}</label><input type="${field.type || 'text'}" class="form-control" name="${field.name}" value="${value}"></div>`;
  }

  function extractFormData(form, fieldDef) {
    const data = {};
    fieldDef.forEach(f => {
      const el = form.elements[f.name];
      if (!el) return;
      if (f.type === 'checkbox') {
        data[f.name] = el.checked;
      } else if (f.type === 'array-lines') {
        data[f.name] = el.value.split('\n\n').map(s => s.trim()).filter(Boolean);
      } else if (f.type === 'array-csv') {
        data[f.name] = el.value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (f.type === 'number') {
        data[f.name] = Number(el.value) || 0;
      } else {
        data[f.name] = el.value;
      }
    });
    return data;
  }

  // Registry for edit modal field generation
  const crudRegistry = {};

  // ─────────────────────────────────────────────────────────────
  // 6. ENTITY CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────

  // Projects (Signature Projects & Sub-pages)
  const projectFields = [
    { name: 'slug', label: 'Slug / URL ID (e.g. oladar, roopmahal)', type: 'text' },
    { name: 'title', label: 'Project Title', type: 'text' },
    { name: 'location', label: 'Location (e.g. Udaipur)', type: 'text' },
    { name: 'type', label: 'Project Type (e.g. Heritage Haveli Construction)', type: 'text' },
    { name: 'hero', label: 'Hero Image', type: 'image' },
    { name: 'summary', label: 'Card Summary Text', type: 'textarea' },
    { name: 'description', label: 'Sub-page Narrative Paragraphs', type: 'array-lines' },
    { name: 'images', label: 'Gallery Images List', type: 'array-csv' },
    { name: 'isFeatured', label: 'Top Full-Width Featured Project?', type: 'checkbox' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active / Published', type: 'checkbox' },
  ];
  crudRegistry['projects'] = projectFields;
  registerRoute('projects', createCrudView({
    title: 'Signature Projects (Raj Nirmaan)',
    endpoint: 'projects',
    columns: [
      { label: 'Cover', render: (i) => `<img src="${i.hero}" class="table-thumb">` },
      { label: 'Title', render: (i) => `<strong>${i.title}</strong><br><small style="color:var(--text-muted);">${i.location} · ${i.type}</small>` },
      { label: 'Gallery Size', render: (i) => `${(i.images || []).length} photos` },
      { label: 'Featured', render: (i) => i.isFeatured ? '<span class="badge badge-warning">Featured</span>' : '<span class="badge badge-info">Standard</span>' },
      { label: 'Order', key: 'order' },
    ],
    fields: projectFields,
    defaultData: { location: 'Udaipur', order: 1, isActive: true, isFeatured: false },
  }));

  // Craftsmanship (Shilp Kala 10 Cards)
  const craftFields = [
    { name: 'title', label: 'Craft Title', type: 'text' },
    { name: 'tagline', label: 'Tagline', type: 'text' },
    { name: 'image', label: 'Main Card Image', type: 'image' },
    { name: 'description', label: 'Craft Philosophy Narrative', type: 'textarea' },
    { name: 'subImages', label: 'Palace-Style Gallery Sub-Images', type: 'array-csv' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['craftsmanship'] = craftFields;
  registerRoute('craftsmanship', createCrudView({
    title: 'Heritage Craftsmanship (Shilp Kala)',
    endpoint: 'craftsmanship',
    columns: [
      { label: 'Cover', render: (i) => `<img src="${i.image}" class="table-thumb">` },
      { label: 'Title', render: (i) => `<strong>${i.title}</strong><br><small style="color:var(--text-muted);">${i.tagline ? i.tagline.slice(0, 45) + '...' : ''}</small>` },
      { label: 'Details', render: (i) => `${(i.subImages || []).length} Sub-images` },
      { label: 'Order', key: 'order' },
    ],
    fields: craftFields,
    defaultData: { order: 1, isActive: true },
  }));

  // Leaders (Balveer Rathore & Yashvardhan Singh Rathore)
  const leaderFields = [
    { name: 'name', label: 'Leader Full Name', type: 'text' },
    { name: 'designation', label: 'Designation / Role', type: 'text' },
    { name: 'avatar', label: 'Profile Portrait', type: 'image' },
    { name: 'company', label: 'Company / Organization', type: 'text' },
    { name: 'bio', label: 'Biography Paragraphs', type: 'array-lines' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['leaders'] = leaderFields;
  registerRoute('leaders', createCrudView({
    title: 'Leadership & Vision Team',
    endpoint: 'leaders',
    columns: [
      { label: 'Avatar', render: (i) => `<img src="${i.avatar}" class="table-thumb" style="border-radius:50%;">` },
      { label: 'Name', render: (i) => `<strong>${i.name}</strong><br><small style="color:var(--text-muted);">${i.designation}</small>` },
      { label: 'Company', key: 'company' },
      { label: 'Order', key: 'order' },
    ],
    fields: leaderFields,
    defaultData: { company: 'Rathore Heritage Developers', order: 1, isActive: true },
  }));

  // Materials (The Royal Material Palette: Stone, Marble, Finish, Glass, Wood)
  const materialFields = [
    { name: 'code', label: 'Element Code (e.g. M1)', type: 'text' },
    { name: 'title', label: 'Title (e.g. Stone, Marble, Finish, Glass, Wood)', type: 'text' },
    { name: 'image', label: 'Material Photo', type: 'image' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['materials'] = materialFields;
  registerRoute('materials', createCrudView({
    title: 'The Royal Material Palette',
    endpoint: 'materials',
    columns: [
      { label: 'Image', render: (i) => `<img src="${i.image}" class="table-thumb">` },
      { label: 'Code', key: 'code' },
      { label: 'Title', key: 'title' },
      { label: 'Order', key: 'order' },
    ],
    fields: materialFields,
    defaultData: { order: 1, isActive: true },
  }));

  // Foundation of Heritage (Raw Materials 11 Slides)
  const rawFields = [
    { name: 'type', label: 'Media Type', type: 'select', options: ['image', 'video'] },
    { name: 'src', label: 'File Source (e.g. raw10.jpeg or raw7.mp4)', type: 'text' },
    { name: 'tagline', label: 'Slide Headline Tagline', type: 'text' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['rawmaterials'] = rawFields;
  registerRoute('rawmaterials', createCrudView({
    title: 'Foundation of Heritage (Raw Materials)',
    endpoint: 'rawmaterials',
    columns: [
      { label: 'Type', render: (i) => `<span class="badge badge-${i.type === 'video' ? 'warning' : 'info'}">${i.type}</span>` },
      { label: 'Source File', key: 'src' },
      { label: 'Tagline', key: 'tagline' },
      { label: 'Order', key: 'order' },
    ],
    fields: rawFields,
    defaultData: { type: 'image', order: 1, isActive: true },
  }));

  // Darbar Gallery (10 Slides)
  const darbarFields = [
    { name: 'image', label: 'Slide Image (e.g. oladar1.jpeg)', type: 'image' },
    { name: 'tagline', label: 'Headline Tagline', type: 'text' },
    { name: 'subline', label: 'Subline Narrative', type: 'textarea' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['darbar'] = darbarFields;
  registerRoute('darbar', createCrudView({
    title: 'Darbar Gallery Slider',
    endpoint: 'darbar',
    columns: [
      { label: 'Slide Image', render: (i) => `<img src="${i.image}" class="table-thumb">` },
      { label: 'Tagline', key: 'tagline' },
      { label: 'Subline', render: (i) => `<small style="color:var(--text-muted);">${(i.subline || '').slice(0, 50)}...</small>` },
      { label: 'Order', key: 'order' },
    ],
    fields: darbarFields,
    defaultData: { order: 1, isActive: true },
  }));

  // What We Offer (5 Service Cards)
  const serviceFields = [
    { name: 'number', label: 'Number Identifier (e.g. 01, 02)', type: 'text' },
    { name: 'title', label: 'Service Offering Title', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'order', label: 'Display Order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['services'] = serviceFields;
  registerRoute('services', createCrudView({
    title: 'What We Offer (Services)',
    endpoint: 'services',
    columns: [
      { label: 'No.', render: (i) => `<strong>${i.number}</strong>` },
      { label: 'Title', key: 'title' },
      { label: 'Description', render: (i) => `<small style="color:var(--text-muted);">${(i.description || '').slice(0, 60)}...</small>` },
      { label: 'Order', key: 'order' },
    ],
    fields: serviceFields,
    defaultData: { number: '01', order: 1, isActive: true },
  }));

  // ─────────────────────────────────────────────────────────────
  // 7. CLIENT ENQUIRIES MANAGER
  // ─────────────────────────────────────────────────────────────
  async function renderEnquiries(container) {
    const enquiries = (await Database.getEnquiries('all')) || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Client Project Enquiries (${enquiries.length})</h3>
          <div style="display:flex; gap:10px;">
            <select class="form-control" style="width:140px; padding:6px;" id="enquiryStatusFilter">
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in-progress">In-Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Contact</th>
                <th>Project Type</th>
                <th>Vision</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${enquiries.length === 0 ? '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No enquiries found.</td></tr>' : ''}
              ${enquiries.map(enq => {
                const id = enq.id || enq._id;
                const status = (enq.status || 'new').toLowerCase();
                return `
                  <tr>
                    <td><small style="color:var(--text-muted);">${new Date(enq.createdAt).toLocaleDateString()}</small></td>
                    <td><strong>${enq.name}</strong></td>
                    <td>
                      <div><a href="tel:${enq.phone}" style="color:var(--primary); text-decoration:none;">${enq.phone}</a></div>
                      <small style="color:var(--text-muted);">${enq.email || 'No email'}</small>
                    </td>
                    <td><span class="badge badge-info">${enq.projectType || 'General'}</span></td>
                    <td><small style="display:block; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${enq.message}">${enq.message || '—'}</small></td>
                    <td>
                      <select class="form-control" style="padding:4px 8px; font-size:12px; width:110px;" onchange="App.updateEnquiryStatus('${id}', this.value)">
                        ${['new', 'contacted', 'in-progress', 'closed'].map(st => `<option value="${st}" ${status === st ? 'selected' : ''}>${st.toUpperCase()}</option>`).join('')}
                      </select>
                    </td>
                    <td style="text-align:right;">
                      <a href="https://wa.me/${(enq.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + enq.name + ', Rathore Heritage Developers received your enquiry for ' + enq.projectType + '.')}" target="_blank" class="btn btn-secondary btn-sm" title="Contact on WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                      </a>
                      <button class="btn btn-danger btn-sm" onclick="App.deleteEnquiry('${id}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('enquiryStatusFilter').addEventListener('change', async (e) => {
      const status = e.target.value;
      const filtered = await Database.getEnquiries(status);
      const tbody = document.querySelector('.data-table tbody');
      if (tbody) {
        tbody.innerHTML = filtered.length === 0 
          ? '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No enquiries found matching filter.</td></tr>'
          : filtered.map(enq => {
            const id = enq.id || enq._id;
            const st = (enq.status || 'new').toLowerCase();
            return `
              <tr>
                <td><small style="color:var(--text-muted);">${new Date(enq.createdAt).toLocaleDateString()}</small></td>
                <td><strong>${enq.name}</strong></td>
                <td>
                  <div><a href="tel:${enq.phone}" style="color:var(--primary); text-decoration:none;">${enq.phone}</a></div>
                  <small style="color:var(--text-muted);">${enq.email || 'No email'}</small>
                </td>
                <td><span class="badge badge-info">${enq.projectType || 'General'}</span></td>
                <td><small style="display:block; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${enq.message || '—'}</small></td>
                <td>
                  <select class="form-control" style="padding:4px 8px; font-size:12px; width:110px;" onchange="App.updateEnquiryStatus('${id}', this.value)">
                    ${['new', 'contacted', 'in-progress', 'closed'].map(s => `<option value="${s}" ${st === s ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
                  </select>
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-danger btn-sm" onclick="App.deleteEnquiry('${id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          }).join('');
      }
    });
  }

  async function updateEnquiryStatus(id, status) {
    try {
      await Database.updateEnquiryStatus(id, status);
      showToast(`Status updated to ${status}`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await Database.deleteEnquiry(id);
      showToast('Enquiry deleted', 'success');
      handleRouting();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. CLOUD MEDIA LIBRARY (ImageKit CDN)
  // ─────────────────────────────────────────────────────────────
  async function renderMediaLibrary(container) {
    const isIkConfigured = typeof ImageKitService !== 'undefined' && ImageKitService.isConfigured();

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">ImageKit Cloud Media Library</h3>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
              Global image delivery & transformations powered by ImageKit CDN &bull; 
              ${isIkConfigured 
                ? '<span style="color:#22c55e;"><i class="fa-solid fa-circle-check"></i> ImageKit Connected</span>' 
                : '<span style="color:var(--warning);"><i class="fa-solid fa-circle-exclamation"></i> ImageKit Setup Pending</span>'
              }
            </p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="App.openImageKitSettingsModal()">
              <i class="fa-solid fa-gear"></i> ImageKit Setup
            </button>
            <input type="file" id="mediaUploadInput" style="display:none;" onchange="App.handleMediaUpload(this)">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('mediaUploadInput').click()">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload Media
            </button>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:16px;">
          <input type="text" id="mediaSearchInput" class="form-control" placeholder="Search by filename or alt text..." style="max-width:320px;">
          <select id="mediaCategoryFilter" class="form-control" style="max-width:180px;">
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="hero">Hero</option>
            <option value="craftsmanship">Craftsmanship</option>
            <option value="projects">Projects</option>
            <option value="materials">Materials</option>
            <option value="gallery">Gallery</option>
          </select>
        </div>

        <div id="mediaLibraryGrid" class="media-grid">
          <div style="color:var(--text-muted);">Loading media items...</div>
        </div>
      </div>
    `;

    loadMediaLibraryItems();

    document.getElementById('mediaSearchInput').addEventListener('input', debounce((e) => {
      loadMediaLibraryItems(e.target.value, document.getElementById('mediaCategoryFilter').value);
    }, 300));

    document.getElementById('mediaCategoryFilter').addEventListener('change', (e) => {
      loadMediaLibraryItems(document.getElementById('mediaSearchInput').value, e.target.value);
    });
  }

  async function loadMediaLibraryItems(search = '', category = 'all') {
    const grid = document.getElementById('mediaLibraryGrid');
    if (!grid) return;

    try {
      const media = (await Database.getMedia(search, category)) || [];
      if (media.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; padding:20px 0;">No media items found. Upload images to build your library.</p>';
        return;
      }

      grid.innerHTML = '';
      media.forEach(m => {
        const item = document.createElement('div');
        item.className = 'media-item';
        const isVideo = (m.mimeType && m.mimeType.startsWith('video')) || (m.filename && m.filename.endsWith('.mp4'));
        const displaySrc = m.url || m.filename;

        item.innerHTML = `
          ${isVideo 
            ? `<video src="${displaySrc}" preload="metadata"></video>` 
            : `<img src="${displaySrc}" alt="${m.altText || m.filename}">`
          }
          <div class="media-item-info">
            <strong>${m.filename}</strong><br>
            <small>${m.size ? (m.size / 1024).toFixed(0) + ' KB' : 'Static Asset'}</small>
          </div>
        `;

        item.addEventListener('click', () => App.showMediaDetailModal(m));
        grid.appendChild(item);
      });
    } catch (err) {
      grid.innerHTML = `<p style="color:var(--danger); grid-column:1/-1;">Error loading media: ${err.message}</p>`;
    }
  }

  async function handleMediaUpload(input) {
    const file = input.files[0];
    if (!file) return;

    showToast(`Uploading ${file.name}...`, 'info');
    try {
      await Database.uploadMedia(file, 'general', file.name.split('.')[0]);
      showToast('Media uploaded successfully!', 'success');
      loadMediaLibraryItems();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      input.value = '';
    }
  }

  async function showMediaDetailModal(m) {
    const isVideo = (m.mimeType && m.mimeType.startsWith('video')) || (m.filename && m.filename.endsWith('.mp4'));
    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Media Details: ${m.filename}`;

    const displayUrl = m.url || m.filename;
    const mediaId = m.id || m._id;

    const form = document.getElementById('crudForm');
    form.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        ${isVideo 
          ? `<video src="${displayUrl}" controls style="max-height:220px; border-radius:var(--radius-sm); max-width:100%;"></video>` 
          : `<img src="${displayUrl}" style="max-height:220px; border-radius:var(--radius-sm); border:1px solid var(--border-color); max-width:100%;">`
        }
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Filename</label>
          <input type="text" class="form-control" value="${m.filename}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Media URL</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-control" id="mediaUrlVal" value="${displayUrl}" readonly>
            <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('mediaUrlVal').value); showToast('URL copied to clipboard!', 'success');">Copy</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Alt Text</label>
          <input type="text" class="form-control" id="mediaAltText" value="${m.altText || ''}">
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" class="btn btn-danger btn-sm" onclick="App.deleteMediaFile('${mediaId}')">
          <i class="fa-solid fa-trash"></i> Delete Media
        </button>
      </div>
    `;

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.textContent = 'Save Metadata';
    saveBtn.onclick = async () => {
      const altText = document.getElementById('mediaAltText').value;
      try {
        await Database.updateDoc('media', mediaId, { altText });
        showToast('Media metadata updated', 'success');
        modalBackdrop.classList.remove('active');
        loadMediaLibraryItems();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function deleteMediaFile(id) {
    if (!confirm('Are you sure you want to delete this media item?')) return;
    try {
      await Database.deleteMedia(id);
      showToast('Media deleted successfully', 'success');
      document.getElementById('crudModal').classList.remove('active');
      loadMediaLibraryItems();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. AUDIT LOGS VIEW
  // ─────────────────────────────────────────────────────────────
  async function renderAuditLogs(container) {
    const logs = (await Database.getAuditLogs()) || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">System Audit Log History (${logs.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No audit events recorded yet.</td></tr>' : ''}
              ${logs.map(log => `
                <tr>
                  <td><small style="color:var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</small></td>
                  <td><strong>${log.adminEmail || 'admin'}</strong></td>
                  <td><span class="badge badge-${log.action === 'Create' ? 'success' : log.action === 'Delete' ? 'danger' : 'info'}">${log.action}</span></td>
                  <td><code>${log.entity || ''}</code></td>
                  <td>${log.details || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Utility Debounce
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  async function init() {
    registerRoute('dashboard', renderDashboard);
    registerRoute('settings', renderSettings);
    registerRoute('sections', renderSections);
    registerRoute('enquiries', renderEnquiries);
    registerRoute('media', renderMediaLibrary);
    registerRoute('audit', renderAuditLogs);

    window.addEventListener('hashchange', handleRouting);

    const isValid = await Auth.checkSession();
    if (!isValid) {
      renderLogin();
    } else {
      handleRouting();
    }
  }

  function openImageKitSettingsModal() {
    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = 'ImageKit CDN Configuration';

    const currentPub = (window.IMAGEKIT_CONFIG && window.IMAGEKIT_CONFIG.publicKey && !window.IMAGEKIT_CONFIG.publicKey.includes('REPLACE_WITH_YOUR')) ? window.IMAGEKIT_CONFIG.publicKey : '';
    const currentEndpoint = (window.IMAGEKIT_CONFIG && window.IMAGEKIT_CONFIG.urlEndpoint) ? window.IMAGEKIT_CONFIG.urlEndpoint : 'https://ik.imagekit.io/';
    const currentPriv = (typeof ImageKitService !== 'undefined' ? ImageKitService.getPrivateKey() : '') || '';

    const form = document.getElementById('crudForm');
    form.innerHTML = `
      <div style="grid-column:1/-1; background:rgba(197,161,91,0.08); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:12px; margin-bottom:12px; font-size:13px; color:var(--text-muted);">
        <strong style="color:var(--primary-light);"><i class="fa-solid fa-shield-halved"></i> Zero-Server ImageKit Architecture:</strong><br>
        Your <code>publicKey</code> and <code>urlEndpoint</code> are public identifiers. Your <code>privateKey</code> is stored strictly in your browser's local storage (<code>localStorage</code>) to sign uploads locally without needing any backend server. It is NEVER pushed to GitHub.
      </div>
      <div class="form-group full-width">
        <label class="form-label">ImageKit Public Key (e.g. public_xxxx...)</label>
        <input type="text" class="form-control" id="ikPubKeyInput" value="${currentPub}" placeholder="public_...">
      </div>
      <div class="form-group full-width">
        <label class="form-label">ImageKit URL Endpoint (e.g. https://ik.imagekit.io/your_id/)</label>
        <input type="text" class="form-control" id="ikEndpointInput" value="${currentEndpoint}" placeholder="https://ik.imagekit.io/your_id/">
      </div>
      <div class="form-group full-width">
        <label class="form-label">ImageKit Private Key (starts with private_...)</label>
        <input type="password" class="form-control" id="ikPrivKeyInput" value="${currentPriv}" placeholder="private_...">
        <small style="color:var(--text-muted);">Stored only on this device/browser for HMAC-SHA1 upload signing.</small>
      </div>
    `;

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.textContent = 'Save ImageKit Config';
    saveBtn.onclick = () => {
      const pub = document.getElementById('ikPubKeyInput').value.trim();
      const endpoint = document.getElementById('ikEndpointInput').value.trim();
      const priv = document.getElementById('ikPrivKeyInput').value.trim();

      if (pub && endpoint) {
        const cfg = { publicKey: pub, urlEndpoint: endpoint };
        localStorage.setItem('rhd_imagekit_config', JSON.stringify(cfg));
        window.IMAGEKIT_CONFIG = cfg;
      }
      if (priv && typeof ImageKitService !== 'undefined') {
        ImageKitService.setPrivateKey(priv);
      }
      showToast('ImageKit settings saved successfully!', 'success');
      modalBackdrop.classList.remove('active');
      handleRouting();
    };
  }

  return {
    init,
    openMediaPicker,
    saveSection,
    openEditModal,
    openCreateModal,
    deleteCrudItem,
    updateEnquiryStatus,
    deleteEnquiry,
    handleMediaUpload,
    showMediaDetailModal,
    deleteMediaFile,
    seedCloudData,
    openImageKitSettingsModal,
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
