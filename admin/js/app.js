// Toast notification utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'triangle-exclamation'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Media Picker Modal Utility
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
  grid.innerHTML = '<div style="padding:20px; color:var(--text-muted);">Loading media library from MongoDB GridFS...</div>';

  try {
    const res = await API.get(`/media?limit=100&search=${encodeURIComponent(search)}&category=${category}`);
    if (!res.media || res.media.length === 0) {
      grid.innerHTML = '<div style="padding:20px; color:var(--text-muted);">No media files found. Upload a file above.</div>';
      return;
    }

    grid.innerHTML = '';
    res.media.forEach(m => {
      const item = document.createElement('div');
      item.className = 'media-item';
      const isVideo = m.mimeType.startsWith('video');
      item.innerHTML = `
        ${isVideo 
          ? `<video src="${m.url}" preload="metadata"></video>` 
          : `<img src="${m.url}" alt="${m.altText || m.filename}">`
        }
        <div class="media-item-info">${m.filename}</div>
      `;
      item.addEventListener('click', () => {
        if (activeMediaCallback) {
          activeMediaCallback(m.filename, m.url);
        }
        closeMediaPicker();
      });
      grid.appendChild(item);
    });
  } catch (err) {
    grid.innerHTML = `<div style="padding:20px; color:var(--danger);">Failed to load media: ${err.message}</div>`;
  }
}

// Global Application Controller
const App = (() => {
  const routes = {};

  function registerRoute(hash, handler) {
    routes[hash] = handler;
  }

  async function handleRouting() {
    const hash = window.location.hash.slice(1) || 'dashboard';

    // Route guard
    if (!Auth.isAuthenticated()) {
      renderLogin();
      return;
    }

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
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
    authScreen.innerHTML = `
      <div class="auth-box">
        <img class="auth-logo" src="logo.PNG" alt="Rathore Heritage Logo">
        <h1>Rathore Heritage</h1>
        <p>CMS & Administrative Control Portal</p>
        <form id="loginForm">
          <div class="form-group" style="text-align:left;">
            <label class="form-label">Username or Email</label>
            <input type="text" class="form-control" name="emailOrUsername" required value="admin@rathoreheritage.com" placeholder="admin@rathoreheritage.com">
          </div>
          <div class="form-group" style="text-align:left;">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" name="password" required value="Admin@123456" placeholder="Enter password">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px; padding:12px;">
            Secure Login <i class="fa-solid fa-shield-halved"></i>
          </button>
        </form>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        await Auth.login(fd.get('emailOrUsername'), fd.get('password'));
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

  // ─────────────────────────────────────────────────────────────
  // 2. DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  async function renderDashboard(container) {
    const res = await API.get('/dashboard');
    const { stats, recentEnquiries, recentLogs, recentMedia } = res;

    container.innerHTML = `
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
            <h3>${stats.media || 0}</h3>
            <p>GridFS Media Items</p>
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
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentEnquiries.map(enq => `
                    <tr>
                      <td>
                        <strong>${enq.name}</strong><br>
                        <small style="color:var(--text-muted);">${enq.phone}</small>
                      </td>
                      <td>${enq.projectType || 'General'}</td>
                      <td><span class="badge badge-${enq.status === 'New' ? 'warning' : 'success'}">${enq.status}</span></td>
                      <td>
                        <a href="https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + enq.name + ', regarding your enquiry for ' + enq.projectType)}" target="_blank" class="btn btn-secondary btn-sm" title="Chat on WhatsApp">
                          <i class="fa-brands fa-whatsapp"></i>
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color:var(--text-muted);">No enquiries received yet.</p>'}
        </div>

        <!-- Recent Audit Logs -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Activity Audit</h3>
            <a href="#audit" class="btn btn-secondary btn-sm">All Logs</a>
          </div>
          ${recentLogs && recentLogs.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${recentLogs.map(log => `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:13px; border-bottom:1px solid rgba(197,161,91,0.1); padding-bottom:8px;">
                  <div>
                    <span class="badge badge-info" style="font-size:10px;">${log.action}</span>
                    <strong style="margin-left:6px;">${log.entityType}</strong>
                    <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">${log.description}</div>
                  </div>
                  <small style="color:var(--text-muted); font-size:11px;">${new Date(log.createdAt || log.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</small>
                </div>
              `).join('')}
            </div>
          ` : '<p style="color:var(--text-muted);">No logs recorded yet.</p>'}
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. WEBSITE SETTINGS VIEW
  // ─────────────────────────────────────────────────────────────
  async function renderSettings(container) {
    const res = await API.get('/settings');
    const s = res.settings || {};

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
                <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaPicker((fn, url) => { document.getElementById('logoInput').value = fn; document.getElementById('logoPreview').src = url; })">Browse</button>
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
        await API.put('/settings', data);
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
    const res = await API.get('/sections');
    const sections = res.sections || [];

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

    // Handle common fields
    if (d.kicker !== undefined) {
      html += `<div class="form-group full-width"><label class="form-label">Hero Kicker</label><input type="text" class="form-control" data-key="kicker" value="${d.kicker || ''}"></div>`;
    }
    if (d.eyebrow !== undefined) {
      html += `<div class="form-group"><label class="form-label">Eyebrow</label><input type="text" class="form-control" data-key="eyebrow" value="${d.eyebrow || ''}"></div>`;
    }
    if (d.heading !== undefined) {
      html += `<div class="form-group"><label class="form-label">Heading</label><input type="text" class="form-control" data-key="heading" value="${d.heading || ''}"></div>`;
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
            <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaPicker((fn, url) => { document.getElementById('input_${sec.sectionKey}').value = fn; document.getElementById('thumb_${sec.sectionKey}').src = url; })">Browse</button>
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

    // Paragraphs array
    if (Array.isArray(d.paragraphs)) {
      html += `
        <div class="form-group full-width">
          <label class="form-label">Story Paragraphs (Separated by newlines)</label>
          <textarea class="form-control" style="min-height:140px;" data-key="paragraphs_lines">${d.paragraphs.join('\n\n')}</textarea>
        </div>
      `;
    }

    return html || '<p style="color:var(--text-muted);">No simple fields for this section.</p>';
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

    try {
      await API.put(`/sections/${sectionKey}`, { data });
      showToast(`Section "${sectionKey}" saved successfully`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. GENERIC CRUD VIEW BUILDER
  // ─────────────────────────────────────────────────────────────
  function createCrudView({ title, endpoint, columns, fields, defaultData = {} }) {
    return async function (container) {
      const res = await API.get(`/${endpoint}`);
      const items = res.items || [];

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
                ${items.map(item => `
                  <tr>
                    ${columns.map(c => `<td>${c.render ? c.render(item) : (item[c.key] || '')}</td>`).join('')}
                    <td style="text-align:right;">
                      <button class="btn btn-secondary btn-sm" onclick="App.openEditModal('${endpoint}', '${item._id}')" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="App.deleteCrudItem('${endpoint}', '${item._id}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
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

  // Modal helpers for CRUD
  function openCreateModal(title, endpoint, fields, defaultData) {
    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Add New ${title.replace(/\s*\(\d+\)/, '')}`;

    const form = document.getElementById('crudForm');
    form.innerHTML = fields.map(f => renderFormField(f, defaultData[f.name] || '')).join('');

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.onclick = async () => {
      const data = extractFormData(form, fields);
      try {
        await API.post(`/${endpoint}`, data);
        showToast('Created successfully', 'success');
        modalBackdrop.classList.remove('active');
        handleRouting();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function openEditModal(endpoint, id) {
    const res = await API.get(`/${endpoint}/${id}`);
    const item = res.item;
    if (!item) return;

    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Edit Record`;

    // Find registered fields for this endpoint
    const fieldDef = crudRegistry[endpoint];
    if (!fieldDef) return;

    const form = document.getElementById('crudForm');
    form.innerHTML = fieldDef.map(f => renderFormField(f, item[f.name])).join('');

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.onclick = async () => {
      const data = extractFormData(form, fieldDef);
      try {
        await API.put(`/${endpoint}/${id}`, data);
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
    try {
      await API.del(`/${endpoint}/${id}`);
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
      return `<div class="form-group full-width"><label class="form-label">${field.label} (Paragraphs separated by blank line)</label><textarea class="form-control" name="${field.name}" style="min-height:120px;">${text}</textarea></div>`;
    }
    if (field.type === 'array-csv') {
      const text = Array.isArray(value) ? value.join(', ') : value;
      return `<div class="form-group full-width"><label class="form-label">${field.label} (Comma-separated files)</label><textarea class="form-control" name="${field.name}">${text}</textarea></div>`;
    }
    if (field.type === 'image') {
      const uid = 'img_' + Math.random().toString(36).slice(2);
      return `
        <div class="form-group">
          <label class="form-label">${field.label}</label>
          <div class="image-picker-field">
            <img src="${value || 'logo.PNG'}" class="image-preview-thumb" id="${uid}_thumb">
            <input type="text" class="form-control" name="${field.name}" id="${uid}_input" value="${value}">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaPicker((fn, url) => { document.getElementById('${uid}_input').value = fn; document.getElementById('${uid}_thumb').src = url; })">Browse</button>
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

  // Leaders (Balveer Singh Rathore & Yashvardhan Singh Rathore)
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

  // Materials (The Royal Material Palette M1 - M8)
  const materialFields = [
    { name: 'code', label: 'Element Code (e.g. M1)', type: 'text' },
    { name: 'title', label: 'Title (e.g. MATERIAL ELEMENT M1)', type: 'text' },
    { name: 'image', label: 'Material Photo', type: 'image' },
    { name: 'order', label: 'Order (1 to 8)', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  crudRegistry['materials'] = materialFields;
  registerRoute('materials', createCrudView({
    title: 'Royal Material Palette (M1 - M8)',
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
    const res = await API.get('/enquiries');
    const enquiries = res.enquiries || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Client Project Enquiries (${enquiries.length})</h3>
          <div style="display:flex; gap:10px;">
            <select class="form-control" style="width:140px; padding:6px;" id="enquiryStatusFilter">
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Closed">Closed</option>
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
              ${enquiries.map(enq => `
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
                    <select class="form-control" style="padding:4px 8px; font-size:12px; width:110px;" onchange="App.updateEnquiryStatus('${enq._id}', this.value)">
                      ${['New', 'Contacted', 'In-Progress', 'Closed'].map(st => `<option value="${st}" ${enq.status === st ? 'selected' : ''}>${st}</option>`).join('')}
                    </select>
                  </td>
                  <td style="text-align:right;">
                    <a href="https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + enq.name + ', Rathore Heritage Developers received your enquiry for ' + enq.projectType + '.')}" target="_blank" class="btn btn-secondary btn-sm" title="Contact on WhatsApp">
                      <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <button class="btn btn-danger btn-sm" onclick="App.deleteEnquiry('${enq._id}')" title="Delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('enquiryStatusFilter').addEventListener('change', async (e) => {
      const status = e.target.value;
      const res = await API.get(`/enquiries?status=${status}`);
      // re-render rows
      renderEnquiries(container);
    });
  }

  async function updateEnquiryStatus(id, status) {
    try {
      await API.put(`/enquiries/${id}`, { status });
      showToast(`Status updated to ${status}`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await API.del(`/enquiries/${id}`);
      showToast('Enquiry deleted', 'success');
      handleRouting();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. MEDIA LIBRARY (MongoDB GridFS)
  // ─────────────────────────────────────────────────────────────
  async function renderMediaLibrary(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">MongoDB GridFS Media Storage</h3>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Files are stored as chunks in MongoDB GridFS with usage verification</p>
          </div>
          <div style="display:flex; gap:10px;">
            <input type="file" id="mediaUploadInput" style="display:none;" onchange="App.handleMediaUpload(this)">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('mediaUploadInput').click()">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload to GridFS
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
          <div style="color:var(--text-muted);">Loading media from GridFS...</div>
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
      const res = await API.get(`/media?limit=100&search=${encodeURIComponent(search)}&category=${category}`);
      if (!res.media || res.media.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; padding:20px 0;">No media items found in GridFS.</p>';
        return;
      }

      grid.innerHTML = '';
      res.media.forEach(m => {
        const item = document.createElement('div');
        item.className = 'media-item';
        const isVideo = m.mimeType.startsWith('video');

        item.innerHTML = `
          ${isVideo 
            ? `<video src="${m.url}" preload="metadata"></video>` 
            : `<img src="${m.url}" alt="${m.altText || m.filename}">`
          }
          <div class="media-item-info">
            <strong>${m.filename}</strong><br>
            <small>${(m.size / 1024).toFixed(0)} KB</small>
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

    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'general');
    fd.append('altText', file.name.split('.')[0]);

    showToast(`Uploading ${file.name} to MongoDB GridFS...`, 'info');
    try {
      await API.upload('/media/upload', fd);
      showToast('Media uploaded to GridFS successfully!', 'success');
      loadMediaLibraryItems();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      input.value = '';
    }
  }

  async function showMediaDetailModal(m) {
    // Check live usage across all database sections (Requirement 16)
    let usageInfo = { usageCount: 0, usedIn: [] };
    try {
      const uRes = await API.get(`/media/${m._id}/usage`);
      usageInfo = uRes;
    } catch {}

    const isVideo = m.mimeType.startsWith('video');
    const modalBackdrop = document.getElementById('crudModal');
    modalBackdrop.classList.add('active');
    document.getElementById('crudModalTitle').textContent = `Media Details: ${m.filename}`;

    const form = document.getElementById('crudForm');
    form.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        ${isVideo 
          ? `<video src="${m.url}" controls style="max-height:220px; border-radius:var(--radius-sm); max-width:100%;"></video>` 
          : `<img src="${m.url}" style="max-height:220px; border-radius:var(--radius-sm); border:1px solid var(--border-color); max-width:100%;">`
        }
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Filename</label>
          <input type="text" class="form-control" value="${m.filename}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">GridFS ID</label>
          <input type="text" class="form-control" value="${m.fileId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">GridFS Streaming URL</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-control" id="mediaUrlVal" value="${m.url}" readonly>
            <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('mediaUrlVal').value); showToast('URL copied to clipboard!', 'success');">Copy</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Alt Text</label>
          <input type="text" class="form-control" id="mediaAltText" value="${m.altText || ''}">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Website Usage Information</label>
          ${usageInfo.usageCount > 0 ? `
            <div style="background:rgba(197,161,91,0.1); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-sm);">
              <strong style="color:var(--primary-light);">Currently active in ${usageInfo.usageCount} location(s):</strong>
              <ul style="margin-left:20px; margin-top:6px; font-size:13px; color:var(--text-main);">
                ${usageInfo.usedIn.map(u => `<li>${u}</li>`).join('')}
              </ul>
            </div>
          ` : '<p style="color:var(--text-muted); font-size:13px;">Not directly referenced in any known database section.</p>'}
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" class="btn btn-danger btn-sm" onclick="App.deleteMediaFile('${m._id}', ${usageInfo.usageCount})">
          <i class="fa-solid fa-trash"></i> Delete from GridFS
        </button>
      </div>
    `;

    const saveBtn = document.getElementById('crudSaveBtn');
    saveBtn.textContent = 'Save Metadata';
    saveBtn.onclick = async () => {
      const altText = document.getElementById('mediaAltText').value;
      try {
        await API.put(`/media/${m._id}`, { altText });
        showToast('Media metadata updated', 'success');
        modalBackdrop.classList.remove('active');
        loadMediaLibraryItems();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function deleteMediaFile(id, usageCount) {
    if (usageCount > 0) {
      if (!confirm(`Warning: This media is actively used in ${usageCount} section(s). Deleting it will cause broken image links on the live site. Delete anyway?`)) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to delete this media item from GridFS?')) return;
    }

    try {
      await API.del(`/media/${id}?force=true`);
      showToast('Media deleted from GridFS and Library', 'success');
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
    const res = await API.get('/audit-logs');
    const logs = res.logs || [];

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
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No audit events recorded yet.</td></tr>' : ''}
              ${logs.map(log => `
                <tr>
                  <td><small style="color:var(--text-muted);">${new Date(log.createdAt || log.timestamp).toLocaleString()}</small></td>
                  <td><strong>${log.adminUsername || log.adminEmail}</strong></td>
                  <td><span class="badge badge-${log.action === 'CREATE' ? 'success' : log.action === 'DELETE' ? 'danger' : 'info'}">${log.action}</span></td>
                  <td><code>${log.entityType}</code></td>
                  <td>${log.description}</td>
                  <td>
                    ${log.changes && log.changes.updated ? `
                      <button class="btn btn-secondary btn-sm" onclick="alert(JSON.stringify(${JSON.stringify(log.changes)}, null, 2))" title="View Diffs">
                        <i class="fa-solid fa-code-compare"></i> Diff
                      </button>
                    ` : '—'}
                  </td>
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

    // Initial session verification
    const isValid = await Auth.checkSession();
    if (!isValid) {
      renderLogin();
    } else {
      handleRouting();
    }
  }

  return {
    init,
    saveSection,
    openEditModal,
    openCreateModal,
    deleteCrudItem,
    updateEnquiryStatus,
    deleteEnquiry,
    handleMediaUpload,
    showMediaDetailModal,
    deleteMediaFile,
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
