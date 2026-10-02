/**
 * Rathore Heritage Developers — Public Website Dynamic CMS Synchronizer
 * Connects the public website to Express API & MongoDB.
 * Seamlessly updates UI when CMS data is loaded, with safe offline fallback.
 */

(function () {
  const API_HOST = window.API_BASE_URL || localStorage.getItem('rhd_api_url') || (
    window.location.hostname.endsWith('github.io')
      ? 'https://rathore-heritage.onrender.com'
      : window.location.origin
  );
  const API_URL = API_HOST.replace(/\/$/, '') + '/api/content';

  async function syncWithCMS() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const { settings, sections, leaders, craftsmanship, materials, projects, rawMaterials, darbarSlides, services } = json.data;

      // ─────────────────────────────────────────────────────────────
      // 1. BRAND & SETTINGS
      // ─────────────────────────────────────────────────────────────
      if (settings) {
        if (settings.logo) {
          document.querySelectorAll('.brand-symbol img, .preloader-logo, .footer-logo').forEach(img => {
            img.src = settings.logo;
          });
        }
        if (settings.companyName) {
          const brandText = document.querySelector('.brand-text strong');
          if (brandText) brandText.textContent = settings.companyName;
          const footerTitle = document.querySelector('.footer-brand h2');
          if (footerTitle) footerTitle.textContent = settings.companyName;
        }
        if (settings.footerDescription) {
          const footerP = document.querySelector('.footer-brand p');
          if (footerP) footerP.textContent = settings.footerDescription;
        }
        if (settings.primaryPhone) {
          const callBtn = document.querySelector('.floating-actions a[aria-label="Call"]');
          if (callBtn) callBtn.href = `tel:${settings.primaryPhone.replace(/\s+/g, '')}`;
        }
        if (settings.whatsappNumber) {
          const waBtn = document.querySelector('.floating-actions a[aria-label="WhatsApp"]');
          if (waBtn) waBtn.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
        }
        if (settings.copyrightCredit) {
          const creditSpan = document.querySelector('.footer-bottom span:last-child');
          if (creditSpan) creditSpan.textContent = settings.copyrightCredit;
        }

        // Update contact details in Sampark section
        const contactDetails = document.querySelector('.contact-details');
        if (contactDetails && (settings.primaryPhone || settings.secondaryPhone || settings.email)) {
          contactDetails.innerHTML = `
            ${settings.primaryPhone ? `
              <a class="contact-item" href="tel:${settings.primaryPhone.replace(/\s+/g, '')}">
                <div class="contact-icon"><i class="fa-solid fa-phone"></i></div>
                <div><strong>${settings.primaryPhone}</strong></div>
              </a>
            ` : ''}
            ${settings.secondaryPhone ? `
              <a class="contact-item" href="tel:${settings.secondaryPhone.replace(/\s+/g, '')}">
                <div class="contact-icon"><i class="fa-solid fa-phone"></i></div>
                <div><strong>${settings.secondaryPhone}</strong></div>
              </a>
            ` : ''}
            ${settings.email ? `
              <a class="contact-item" href="mailto:${settings.email}">
                <div class="contact-icon"><i class="fa-solid fa-envelope"></i></div>
                <div><strong>${settings.email}</strong></div>
              </a>
            ` : ''}
          `;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. SECTIONS & NARRATIVES
      // ─────────────────────────────────────────────────────────────
      if (sections) {
        // Hero
        if (sections.hero) {
          const h = sections.hero;
          const kicker = document.querySelector('.hero-kicker');
          if (kicker && h.kicker) kicker.textContent = h.kicker;
          const heading = document.querySelector('.hero h1');
          if (heading && h.heading) heading.textContent = h.heading;
          const desc = document.querySelector('.hero-description');
          if (desc && h.description) desc.textContent = h.description;
          const cta = document.querySelector('.hero-bottom a.luxury-btn');
          if (cta) {
            if (h.ctaText) cta.innerHTML = `${h.ctaText} <i class="fa-solid fa-arrow-right"></i>`;
            if (h.ctaLink) cta.href = h.ctaLink;
          }
          if (h.videoSrc) {
            const vid = document.querySelector('.hero-video source');
            if (vid && vid.src !== h.videoSrc) {
              vid.src = h.videoSrc;
              vid.parentElement.load();
            }
          }
        }

        // Legacy / About
        if (sections.legacy) {
          const l = sections.legacy;
          const eyebrow = document.querySelector('#legacy .eyebrow');
          if (eyebrow && l.eyebrow) eyebrow.textContent = l.eyebrow;
          const heading = document.querySelector('#legacy .section-title');
          if (heading && l.heading) heading.textContent = l.heading;
          const img = document.querySelector('#legacy .legacy-image');
          if (img && l.image) img.src = l.image;
          if (l.paragraphs && l.paragraphs.length > 0) {
            const copyDiv = document.querySelector('#legacy .legacy-copy');
            if (copyDiv) {
              copyDiv.innerHTML = `
                <div class="eyebrow">${l.eyebrow || 'Raj Virasat'}</div>
                <h2 class="section-title">${l.heading || 'A Legacy Rooted in Royal Craftsmanship.'}</h2>
                <div class="gold-line"></div>
                ${l.paragraphs.map(p => `<p>${p}</p>`).join('')}
                <div class="signature">${l.signature || 'Royal spaces. Timeless legacy.'}</div>
              `;
            }
          }
        }

        // Leadership Header
        if (sections.leadershipHeader) {
          const lh = sections.leadershipHeader;
          const eye = document.querySelector('#leadership .eyebrow');
          if (eye && lh.eyebrow) eye.textContent = lh.eyebrow;
          const heading = document.querySelector('#leadership .section-title');
          if (heading && lh.heading) heading.textContent = lh.heading;
          const intro = document.querySelector('#leadership .section-intro');
          if (intro && lh.intro) intro.textContent = lh.intro;
        }

        // Craftsmanship Header
        if (sections.craftsmanshipHeader) {
          const ch = sections.craftsmanshipHeader;
          const eye = document.querySelector('#craftsmanship .eyebrow');
          if (eye && ch.eyebrow) eye.textContent = ch.eyebrow;
          const heading = document.querySelector('#craftsmanship .section-title');
          if (heading && ch.heading) heading.textContent = ch.heading;
          const intro = document.querySelector('#craftsmanship .section-intro');
          if (intro && ch.intro) intro.textContent = ch.intro;
        }

        // Material Palette Header
        if (sections.materialsHeader) {
          const mh = sections.materialsHeader;
          const eye = document.querySelector('#materialboard .eyebrow');
          if (eye && mh.eyebrow) eye.textContent = mh.eyebrow;
          const heading = document.querySelector('#materialboard .section-title');
          if (heading && mh.heading) heading.textContent = mh.heading;
          const intro = document.querySelector('#materialboard .section-intro');
          if (intro && mh.intro) intro.textContent = mh.intro;
        }

        // Projects Header
        if (sections.projectsHeader) {
          const ph = sections.projectsHeader;
          const eye = document.querySelector('#projects .eyebrow');
          if (eye && ph.eyebrow) eye.textContent = ph.eyebrow;
          const heading = document.querySelector('#projects .section-title');
          if (heading && ph.heading) heading.textContent = ph.heading;
          const intro = document.querySelector('#projects .section-intro');
          if (intro && ph.intro) intro.textContent = ph.intro;
        }

        // Consultancy
        if (sections.consultancy) {
          const c = sections.consultancy;
          const eye = document.querySelector('#consultancy .eyebrow');
          if (eye && c.eyebrow) eye.textContent = c.eyebrow;
          const heading = document.querySelector('#consultancy .section-title');
          if (heading && c.heading) heading.textContent = c.heading;
          if (c.paragraphs && c.paragraphs.length > 0) {
            const container = document.querySelector('#consultancy .consultancy-grid > div:first-child');
            if (container) {
              container.innerHTML = `
                <div class="eyebrow">${c.eyebrow || 'Our Expertise'}</div>
                <h2 class="section-title">${c.heading || 'Crafting Heritage with Precision & Tradition'}</h2>
                <div class="gold-line"></div>
                ${c.paragraphs.map((p, idx) => `<p class="section-intro" ${idx > 0 ? 'style="margin-top: 15px;"' : ''}>${p}</p>`).join('')}
                <a href="${c.ctaLink || '#contact'}" class="luxury-btn">
                  ${c.ctaText || 'Sampark'} <i class="fa-solid fa-arrow-right"></i>
                </a>
              `;
            }
          }
        }

        // Raw Materials Header
        if (sections.rawMaterialsHeader) {
          const rm = sections.rawMaterialsHeader;
          const eye = document.querySelector('#rawmaterials .raw-material-copy .eyebrow');
          if (eye && (rm.subEyebrow || rm.eyebrow)) eye.textContent = rm.subEyebrow || rm.eyebrow;
          const h2 = document.querySelector('#rawmaterials .raw-material-copy h2');
          if (h2 && rm.heading) h2.textContent = rm.heading;
          const tag = document.querySelector('#rawmaterials .raw-material-main-tagline');
          if (tag && rm.mainTagline) tag.textContent = rm.mainTagline;
          const desc = document.querySelector('#rawmaterials .raw-material-copy p');
          if (desc && rm.description) desc.textContent = rm.description;
        }

        // Darbar Gallery Header
        if (sections.darbarGalleryHeader) {
          const dg = sections.darbarGalleryHeader;
          const eye = document.querySelector('#heritageproj .eyebrow');
          if (eye && dg.eyebrow) eye.textContent = dg.eyebrow;
          const heading = document.querySelector('#heritageproj .section-title');
          if (heading && dg.heading) heading.textContent = dg.heading;
          const intro = document.querySelector('#heritageproj .section-intro');
          if (intro && dg.intro) intro.textContent = dg.intro;
        }

        // Approach & Principles
        if (sections.approach) {
          const a = sections.approach;
          const eye = document.querySelector('#approach .eyebrow');
          if (eye && a.eyebrow) eye.textContent = a.eyebrow;
          const quote = document.querySelector('#approach .approach-quote');
          if (quote && a.quote) quote.innerHTML = a.quote.replace(/to Art/i, 'to <em>Art.</em>');
          const intro = document.querySelector('#approach .section-intro');
          if (intro && a.intro) intro.textContent = a.intro;
          if (a.principles && Array.isArray(a.principles) && a.principles.length > 0) {
            const princContainer = document.querySelector('#approach .principles');
            if (princContainer) {
              princContainer.innerHTML = a.principles.map(p => `
                <div class="principle">
                  <div class="principle-number">${p.number}</div>
                  <h4>${p.title}</h4>
                </div>
              `).join('');
            }
          }
        }

        // What We Offer Header
        if (sections.servicesHeader) {
          const sh = sections.servicesHeader;
          const eye = document.querySelector('#offer .eyebrow');
          if (eye && sh.eyebrow) eye.textContent = sh.eyebrow;
          const heading = document.querySelector('#offer .section-title');
          if (heading && sh.heading) heading.textContent = sh.heading;
        }

        // Contact Header
        if (sections.contactHeader) {
          const ch = sections.contactHeader;
          const eye = document.querySelector('#contact .eyebrow');
          if (eye && ch.eyebrow) eye.textContent = ch.eyebrow;
          const heading = document.querySelector('#contact .section-title');
          if (heading && ch.heading) heading.textContent = ch.heading;
          const intro = document.querySelector('#contact .section-intro');
          if (intro && ch.intro) intro.textContent = ch.intro;
          const formH3 = document.querySelector('#enquiryForm h3');
          if (formH3 && ch.formTitle) formH3.textContent = ch.formTitle;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. REPEATED ENTITIES: LEADERSHIP TEAM
      // ─────────────────────────────────────────────────────────────
      if (leaders && leaders.length > 0) {
        const leadGrid = document.querySelector('.leadership-grid');
        if (leadGrid) {
          leadGrid.innerHTML = leaders.map(leader => `
            <div class="leader-card">
              <div class="leader-header">
                <div class="leader-avatar">
                  <img src="${leader.avatar}" alt="${leader.name}">
                </div>
                <div class="leader-titles">
                  <h3>${leader.name}</h3>
                  <span>${leader.designation}</span>
                </div>
              </div>
              <div class="leader-body">
                ${(leader.bio || []).map((p, idx) => `<p ${idx > 0 ? 'style="margin-top: 12px;"' : ''}>${p}</p>`).join('')}
              </div>
              <div class="leader-footer">
                ${leader.company || 'Rathore Heritage Developers'}
              </div>
            </div>
          `).join('');
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. REPEATED ENTITIES: CRAFTSMANSHIP CARDS (10 CARDS)
      // ─────────────────────────────────────────────────────────────
      if (craftsmanship && craftsmanship.length > 0 && typeof craftCardsData !== 'undefined') {
        // Update global craftCardsData in place
        craftCardsData.length = 0;
        craftsmanship.forEach(c => craftCardsData.push(c));

        const craftGrid = document.getElementById('craftCardsGrid');
        if (craftGrid) {
          craftGrid.innerHTML = '';
          craftCardsData.forEach((card, index) => {
            const shapeClass = (index % 2 === 0) ? "shape-square" : "shape-dome";
            const div = document.createElement("div");
            div.className = `craft-card-item ${shapeClass}`;
            div.innerHTML = `
              <div class="beige-card-wrap" style="height:100%; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;">
                <div>
                  <div class="craft-card-img-wrap">
                    <img src="${card.image}" alt="${card.title}" loading="lazy">
                  </div>
                  <div class="craft-card-info">
                    <h3>${card.title}</h3>
                    <p>${card.tagline}</p>
                  </div>
                </div>
                <button class="luxury-btn" style="border-color:var(--gold-dark); color:var(--ink); margin-top:10px; width:100%; justify-content:center;">
                  View More <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            `;
            div.addEventListener("click", () => {
              if (typeof renderCraftsmanshipDetail === 'function') {
                renderCraftsmanshipDetail(card);
              }
            });
            craftGrid.appendChild(div);
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. REPEATED ENTITIES: MATERIAL PALETTE (M1 - M8)
      // ─────────────────────────────────────────────────────────────
      if (materials && materials.length > 0) {
        const matGrid = document.getElementById('materialGrid');
        if (matGrid) {
          matGrid.innerHTML = '';
          materials.forEach((mat, idx) => {
            const shapeClass = (idx % 2 === 0) ? "shape-square" : "shape-dome";
            const div = document.createElement("div");
            div.className = `material-item ${shapeClass}`;
            div.innerHTML = `
              <div class="beige-card-wrap">
                <div class="material-img-wrap">
                  <img src="${mat.image}" alt="${mat.title}" loading="lazy">
                </div>
                <h4>${mat.title}</h4>
              </div>
            `;
            matGrid.appendChild(div);
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 6. REPEATED ENTITIES: SIGNATURE PROJECTS
      // ─────────────────────────────────────────────────────────────
      if (projects && projects.length > 0 && typeof window.projects !== 'undefined') {
        // Sync global window.projects dictionary for sub-page rendering
        projects.forEach(p => {
          window.projects[p.slug] = p;
        });

        // Re-render project cards
        const featured = projects.find(p => p.isFeatured) || projects[0];
        const others = projects.filter(p => p !== featured);

        const sigLayout = document.querySelector('.signature-layout');
        if (sigLayout && featured) {
          sigLayout.innerHTML = `
            <!-- Top Full Width Featured Project Card -->
            <div class="project-featured-card oladar-featured-card" onclick="openProject('${featured.slug}')">
              <div class="project-featured-image">
                <img src="${featured.hero}" alt="${featured.title}">
              </div>
              <div class="project-featured-content">
                <div class="eyebrow">${featured.location} · ${featured.type}</div>
                <h3>${featured.title}</h3>
                <p>${featured.summary || (featured.description ? featured.description[0] : '')}</p>
                <span class="luxury-btn" style="width:fit-content; border-color:var(--gold-dark); color:var(--ink);">
                  View Project <i class="fa-solid fa-arrow-right"></i>
                </span>
              </div>
            </div>

            <!-- Bottom Project Row Grid -->
            <div class="project-row-grid">
              ${others.map((proj, idx) => `
                <div class="project-card-box" onclick="openProject('${proj.slug}')">
                  <div class="beige-card-wrap">
                    <div class="project-card-img ${idx % 2 === 0 ? 'shape-dome' : ''}">
                      <img src="${proj.hero}" alt="${proj.title}">
                    </div>
                    <div class="project-card-info">
                      <div class="eyebrow">${proj.location} · ${proj.type}</div>
                      <h3>${proj.title}</h3>
                      <p>${proj.summary || (proj.description ? proj.description[0] : '')}</p>
                      <span class="luxury-btn" style="border-color:var(--gold-dark); color:var(--ink);">
                        View Project <i class="fa-solid fa-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 7. REPEATED ENTITIES: RAW MATERIALS (FOUNDATION OF HERITAGE)
      // ─────────────────────────────────────────────────────────────
      if (rawMaterials && rawMaterials.length > 0 && typeof rawMaterialSlides !== 'undefined') {
        rawMaterialSlides.length = 0;
        rawMaterials.forEach(rm => rawMaterialSlides.push(rm));
        if (typeof showRawMaterial === 'function') {
          showRawMaterial(0);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 8. REPEATED ENTITIES: DARBAR GALLERY SLIDES
      // ─────────────────────────────────────────────────────────────
      if (darbarSlides && darbarSlides.length > 0 && typeof heritageSlides !== 'undefined') {
        heritageSlides.length = 0;
        darbarSlides.forEach(ds => heritageSlides.push(ds));

        const dotsContainer = document.getElementById("heritageSliderDots");
        if (dotsContainer) {
          dotsContainer.innerHTML = '';
          heritageSlides.forEach((slide, index) => {
            const dot = document.createElement("button");
            dot.className = "heritage-slider-dot" + (index === 0 ? " active" : "");
            dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
            dot.addEventListener("click", () => {
              heritageCurrent = index;
              if (typeof renderHeritageSlide === 'function') renderHeritageSlide();
              if (typeof restartHeritageTimer === 'function') restartHeritageTimer();
            });
            dotsContainer.appendChild(dot);
          });
        }
        if (typeof renderHeritageSlide === 'function') {
          renderHeritageSlide();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 9. REPEATED ENTITIES: WHAT WE OFFER (SERVICES)
      // ─────────────────────────────────────────────────────────────
      if (services && services.length > 0) {
        const offerGrid = document.querySelector('.offer-grid');
        if (offerGrid) {
          offerGrid.innerHTML = services.map(srv => `
            <article class="offer-card">
              <div class="offer-number">${srv.number}</div>
              <h3>${srv.title}</h3>
              <p>${srv.description}</p>
            </article>
          `).join('');
        }
      }

    } catch (err) {
      console.warn('[CMS Sync Notice] Live backend API not reached, using native offline fallback:', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 10. ENQUIRY FORM SUBMISSION TO MONGODB API + WHATSAPP
  // ─────────────────────────────────────────────────────────────
  function setupEnquiryForm() {
    const form = document.getElementById('enquiryForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      const payload = {
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        projectType: fd.get('projectType'),
        message: fd.get('message'),
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending Enquiry... <i class="fa-solid fa-spinner fa-spin"></i>';
      }

      // 1. Post to MongoDB API
      try {
        await fetch(`${API_HOST.replace(/\/$/, '')}/api/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('[Enquiry API Notice] Could not save to DB directly:', err.message);
      }

      // 2. Open WhatsApp for instant client engagement
      const txt = `Hello Rathore Heritage Developers,\n\nI would like to discuss a heritage project.\n\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nType: ${payload.projectType}\nVision: ${payload.message}`;
      window.open("https://wa.me/919414228829?text=" + encodeURIComponent(txt), "_blank");

      // 3. Reset form and show success
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enquiry Sent! <i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
        }, 4000);
      }
    });
  }

  // Execute on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncWithCMS();
      setupEnquiryForm();
    });
  } else {
    syncWithCMS();
    setupEnquiryForm();
  }
})();
