/**
 * Rathore Heritage Developers — Public Website Dynamic CMS Synchronizer
 * Zero-server BaaS synchronization powered by Firebase Cloud Firestore & local fallback.
 * Includes Firestore onSnapshot() realtime listeners for live instantaneous updates
 * without requiring manual page reload or code redeployment.
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 1. BRAND & WEBSITE SETTINGS RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderSettings(settings) {
    if (!settings) return;

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
      const footerCallBtn = document.querySelector('.footer-col a[href^="tel:"]');
      if (footerCallBtn) footerCallBtn.href = `tel:${settings.primaryPhone.replace(/\s+/g, '')}`;
    }

    if (settings.whatsappNumber) {
      const waBtn = document.querySelector('.floating-actions a[aria-label="WhatsApp"]');
      if (waBtn) waBtn.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
      const footerWaBtn = document.querySelector('.footer-col a[href*="wa.me"]');
      if (footerWaBtn) footerWaBtn.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
    }

    const extraCredit = document.querySelector('.footer-bottom span:nth-child(2)');
    if (extraCredit) extraCredit.remove();

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Clean address format
    let cleanAddress = settings.address || '';
    if (cleanAddress && /Ground Floor & First Floor,\s*/i.test(cleanAddress)) {
      cleanAddress = cleanAddress.replace(/Ground Floor & First Floor,\s*/gi, '');
    }

    // Update contact details in Sampark section
    const contactDetails = document.querySelector('.contact-details');
    if (contactDetails && (settings.primaryPhone || settings.secondaryPhone || settings.email || cleanAddress)) {
      contactDetails.innerHTML = `
        ${settings.primaryPhone ? `
          <a class="contact-item" href="tel:${settings.primaryPhone.replace(/\s+/g, '')}">
            <div class="contact-icon"><i class="fa-solid fa-phone"></i></div>
            <div><strong>${settings.primaryPhone}</strong></div>
          </a>
        ` : ''}
        ${settings.secondaryPhone && settings.secondaryPhone.trim() && settings.secondaryPhone.replace(/\s+/g, '') !== (settings.primaryPhone || '').replace(/\s+/g, '') ? `
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
        <a class="contact-item contact-address" href="https://maps.google.com/?q=Oladar+Haveli,+Lake+Palace+Road,+Kalaji+Goraji,+Udaipur,+Rajasthan+313001" target="_blank" rel="noopener" aria-label="Location">
          <div class="contact-icon" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></div>
          <div class="contact-address-text">
            <span class="addr-desktop">Building No. 14/21,<br>Oladar Haveli, Lake Palace Road,<br>Kalaji Goraji, Udaipur, Rajasthan - 313001, India</span>
            <span class="addr-mobile">Building No. 14/21, Oladar Haveli,<br>Lake Palace Road, Kalaji Goraji,<br>Udaipur, Rajasthan - 313001, India</span>
          </div>
        </a>
      `;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PAGE SECTIONS & EDITABLE COPY RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderSections(sections) {
    if (!sections) return;

    // Hero
    if (sections.hero) {
      const h = sections.hero;
      const kicker = document.querySelector('.hero-kicker');
      if (kicker && h.kicker) kicker.textContent = h.kicker;
      const heading = document.querySelector('.hero h1');
      if (heading && h.heading) {
        let normalized = h.heading
          .replace(/INDIAN<\/span>\s*<br\s*\/?>\s*<span class="gold-italic">HERITAGE/i, 'INDIAN HERITAGE')
          .replace(/INDIAN<\/em>\s*<br\s*\/?>\s*<em>HERITAGE/i, 'INDIAN HERITAGE')
          .replace(/LEGACY/gi, 'LIVING');

        if (/where timeless.*living/i.test(normalized.replace(/<[^>]+>/g, ' '))) {
          heading.innerHTML = `WHERE TIMELESS <span class="gold-italic">INDIAN HERITAGE</span><br>MEETS ROYAL <span class="gold-italic">LIVING.</span>`;
        } else if (normalized.includes('<span') || normalized.includes('<br>') || normalized.includes('<em>')) {
          heading.innerHTML = normalized;
        } else {
          heading.textContent = normalized;
        }
      }
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
      if (eye) eye.textContent = c.eyebrow || 'Heritage Consultancy';
      const heading = document.querySelector('#consultancy .section-title');
      if (heading) heading.textContent = c.heading || 'Authentic guidance in heritage architecture, traditional craftsmanship, and timeless design.';
      if (c.paragraphs && c.paragraphs.length > 0) {
        const container = document.querySelector('#consultancy .consultancy-grid > div:first-child');
        if (container) {
          container.innerHTML = `
            <div class="eyebrow">${c.eyebrow || 'Heritage Consultancy'}</div>
            <h2 class="section-title">${c.heading || 'Authentic guidance in heritage architecture, traditional craftsmanship, and timeless design.'}</h2>
            <div class="gold-line"></div>
            ${c.paragraphs.map((p, idx) => `<p class="section-intro" ${idx > 0 ? 'style="margin-top: 15px;"' : ''}>${p}</p>`).join('')}
            <a href="${c.ctaLink || '#consultancyModal'}" class="luxury-btn consultancy-open-btn">
              ${c.ctaText || 'Book Consultancy'} <i class="fa-solid fa-arrow-right"></i>
            </a>
          `;
        }
      }
      if (c.steps && Array.isArray(c.steps) && c.steps.length > 0) {
        const track = document.querySelector('.consultancy-process-track');
        if (track) {
          track.innerHTML = c.steps.map((s, idx) => `
            <div class="consultancy-step-box">
              <span class="consultancy-step-num">${s.step || String(idx + 1).padStart(2, '0')}</span>
              <span class="consultancy-step-title">${s.title || ''}</span>
            </div>
            ${idx < c.steps.length - 1 ? `
              <div class="consultancy-step-arrow" aria-hidden="true">
                <svg viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5H15M15 5L11 1M15 5L11 9" stroke="var(--gold)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            ` : ''}
          `).join('');
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

    // Why RHD Section (Below Darbar Gallery)
    if (sections.whyRhd) {
      const w = sections.whyRhd;
      const eyebrow = document.querySelector('.why-rhd-eyebrow span:nth-child(2)');
      if (eyebrow && w.eyebrow) eyebrow.textContent = w.eyebrow;
      const title = document.querySelector('.why-rhd-title');
      if (title && w.heading) title.textContent = w.heading;
      const intro = document.querySelector('.why-rhd-intro');
      if (intro && w.intro) intro.textContent = w.intro;
      if (w.cards && Array.isArray(w.cards) && w.cards.length > 0) {
        const grid = document.querySelector('.why-rhd-grid');
        if (grid) {
          grid.innerHTML = w.cards.map((c, idx) => `
            <div class="why-rhd-card">
              <div class="why-card-number">${c.num || String(idx + 1).padStart(2, '0')}</div>
              <h3 class="why-card-title">${(c.title || '').replace(/\n/g, '<br>')}</h3>
              <p class="why-card-text">${c.text || ''}</p>
            </div>
          `).join('');
        }
      }
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

    // Reviews Header
    if (sections.reviewsHeader) {
      const rh = sections.reviewsHeader;
      const eye = document.querySelector('#reviews .eyebrow');
      if (eye && rh.eyebrow) eye.textContent = rh.eyebrow;
      const heading = document.querySelector('#reviews .section-title');
      if (heading && rh.heading) heading.textContent = rh.heading;
      const intro = document.querySelector('#reviews .section-intro');
      if (intro && rh.intro) intro.textContent = rh.intro;
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
  // 3. REPEATED ENTITIES: LEADERSHIP TEAM RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderLeaders(leaders) {
    if (!leaders || leaders.length === 0) return;
    const leadGrid = document.querySelector('.leadership-grid');
    if (leadGrid) {
      leadGrid.innerHTML = leaders.map(leader => `
        <div class="leader-card">
          <div class="leader-header">
            <div class="leader-avatar">
              <img src="${leader.avatar}" alt="${leader.name}" ${/md\.jpeg/i.test(leader.avatar) ? 'style="object-position: top center;"' : ''}>
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
  // 4. REPEATED ENTITIES: CRAFTSMANSHIP CARDS (10 CARDS) RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderCraftsmanship(craftsmanship) {
    if (!craftsmanship || craftsmanship.length === 0) return;

    if (typeof craftCardsData !== 'undefined') {
      craftCardsData.length = 0;
      craftsmanship.forEach(c => craftCardsData.push(c));
    }

    const craftGrid = document.getElementById('craftCardsGrid');
    if (craftGrid) {
      craftGrid.innerHTML = '';
      craftsmanship.forEach((card, index) => {
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
  // 5. REPEATED ENTITIES: THE ROYAL MATERIAL PALETTE RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderMaterials(materials) {
    if (!materials || materials.length === 0) return;
    if (typeof window.initMaterialCarousel === 'function') {
      window.initMaterialCarousel(materials);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. REPEATED ENTITIES: SIGNATURE PROJECTS RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderProjects(projects) {
    if (!projects || projects.length === 0) return;

    if (typeof window.projects !== 'undefined') {
      projects.forEach(p => {
        if (Array.isArray(p.images)) {
          p.images = p.images.filter(img => typeof img === 'string' && !img.includes('oladar6'));
        }
        window.projects[p.slug] = p;
      });
    }

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
  function renderRawMaterials(rawMaterials) {
    if (!rawMaterials || rawMaterials.length === 0) return;
    if (typeof rawMaterialSlides !== 'undefined') {
      rawMaterialSlides.length = 0;
      rawMaterials.forEach(rm => {
        if (rm && rm.src && /raw\s*11\.(jpg|jpeg)/i.test(rm.src)) {
          rm.src = 'Raw 11.jpg';
        }
        rawMaterialSlides.push(rm);
      });
      if (typeof showRawMaterial === 'function') {
        showRawMaterial(0);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. REPEATED ENTITIES: DARBAR GALLERY SLIDES RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderDarbarSlides(darbarSlides) {
    if (!darbarSlides || darbarSlides.length === 0) return;
    if (typeof heritageSlides !== 'undefined') {
      heritageSlides.length = 0;
      darbarSlides.forEach((ds, idx) => {
        heritageSlides.push(ds);
      });

      const dotsContainer = document.getElementById("heritageSliderDots");
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        heritageSlides.forEach((slide, index) => {
          const dot = document.createElement("button");
          dot.className = "heritage-slider-dot" + (index === 0 ? " active" : "");
          dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
          dot.addEventListener("click", () => {
            if (typeof heritageCurrent !== 'undefined') {
              window.heritageCurrent = index;
            }
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
  }

  // ─────────────────────────────────────────────────────────────
  // 9. REPEATED ENTITIES: WHAT WE OFFER (SERVICES) RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderServices(services) {
    if (!services || services.length === 0) return;
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

  // ─────────────────────────────────────────────────────────────
  // 10. REPEATED ENTITIES: ROYAL PATRON REVIEWS RENDERER
  // ─────────────────────────────────────────────────────────────
  function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) return;
    const track = document.getElementById('reviewsSliderTrack');
    if (track) {
      track.innerHTML = reviews.map(rev => {
        const rating = rev.rating || 5;
        const stars = Array(rating).fill('<i class="fa-solid fa-star"></i>').join('');
        const initials = rev.avatar || (rev.name ? rev.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'RP');
        return `
          <div class="review-card">
            <div class="review-card-top">
              <i class="fa-solid fa-quote-left review-quote-icon"></i>
              <div class="review-stars">
                ${stars}
              </div>
            </div>
            <p class="review-text">"${rev.text || ''}"</p>
            <div class="review-author-wrap">
              <div class="review-avatar-seal">${initials}</div>
              <div class="review-author-info">
                <h4>${rev.name || ''}</h4>
                <div class="review-author-role">${rev.role || ''}</div>
                <div class="review-project-badge"><i class="fa-solid fa-circle-check"></i> ${rev.project || 'Verified Heritage Project'}</div>
                <div class="review-location"><i class="fa-solid fa-location-dot"></i> ${rev.city || 'Rajasthan'}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (typeof window.refreshReviewsCarousel === 'function') {
        window.refreshReviewsCarousel();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 11. INITIAL SYNCHRONIZATION AND REALTIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────
  async function syncWithCMS() {
    try {
      if (typeof Database === 'undefined') {
        console.warn('[CMS Sync] Database service not loaded.');
        return;
      }

      // Initial Fetch & Render
      const [
        settings,
        sections,
        leaders,
        craftsmanship,
        materials,
        projects,
        rawMaterials,
        darbarSlides,
        services,
        reviews
      ] = await Promise.all([
        Database.getSettings(),
        Database.getSections(),
        Database.getCollection('leaders'),
        Database.getCollection('craftsmanship'),
        Database.getCollection('materials'),
        Database.getCollection('projects'),
        Database.getCollection('rawMaterials'),
        Database.getCollection('darbarSlides'),
        Database.getCollection('services'),
        Database.getCollection('reviews'),
      ]);

      renderSettings(settings);
      renderSections(sections);
      renderLeaders(leaders);
      renderCraftsmanship(craftsmanship);
      renderMaterials(materials);
      renderProjects(projects);
      renderRawMaterials(rawMaterials);
      renderDarbarSlides(darbarSlides);
      renderServices(services);
      renderReviews(reviews);

      // Attach Firestore Realtime Listeners for instant Live Website Sync
      Database.onSettingsChange(updatedSettings => {
        console.log('[CMS Live Sync] Brand settings updated from Cloud Firestore');
        renderSettings(updatedSettings);
      });

      Database.onSectionsChange(updatedSections => {
        console.log('[CMS Live Sync] Page sections updated from Cloud Firestore');
        renderSections(updatedSections);
      });

      Database.onCollectionChange('leaders', updatedLeaders => {
        console.log('[CMS Live Sync] Leadership team updated from Cloud Firestore');
        renderLeaders(updatedLeaders);
      });

      Database.onCollectionChange('craftsmanship', updatedCraft => {
        console.log('[CMS Live Sync] Craftsmanship cards updated from Cloud Firestore');
        renderCraftsmanship(updatedCraft);
      });

      Database.onCollectionChange('materials', updatedMaterials => {
        console.log('[CMS Live Sync] Materials palette updated from Cloud Firestore');
        renderMaterials(updatedMaterials);
      });

      Database.onCollectionChange('projects', updatedProjects => {
        console.log('[CMS Live Sync] Signature projects updated from Cloud Firestore');
        renderProjects(updatedProjects);
      });

      Database.onCollectionChange('rawMaterials', updatedRaw => {
        console.log('[CMS Live Sync] Raw materials updated from Cloud Firestore');
        renderRawMaterials(updatedRaw);
      });

      Database.onCollectionChange('darbarSlides', updatedDarbar => {
        console.log('[CMS Live Sync] Darbar gallery updated from Cloud Firestore');
        renderDarbarSlides(updatedDarbar);
      });

      Database.onCollectionChange('services', updatedServices => {
        console.log('[CMS Live Sync] Offer services updated from Cloud Firestore');
        renderServices(updatedServices);
      });

      Database.onCollectionChange('reviews', updatedReviews => {
        console.log('[CMS Live Sync] Reviews updated from Cloud Firestore');
        renderReviews(updatedReviews);
      });

    } catch (err) {
      console.warn('[CMS Sync Notice]', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 12. ENQUIRY & CONSULTANCY FORM SUBMISSION
  // ─────────────────────────────────────────────────────────────
  function setupForms() {
    const enquiryForm = document.getElementById('enquiryForm');
    const consultancyForm = document.getElementById('consultancyForm');

    // 1. Sync Project Type options from #enquiryForm to #consultancyForm
    function syncProjectTypeOptions() {
      const source = document.querySelector('#enquiryForm select[name="projectType"]');
      const target = document.querySelector('#consultancyForm select[name="projectType"]');
      if (source && target && source.innerHTML.trim()) {
        target.innerHTML = source.innerHTML;
      }
    }
    syncProjectTypeOptions();

    const sourceSelect = document.querySelector('#enquiryForm select[name="projectType"]');
    if (sourceSelect && window.MutationObserver) {
      const obs = new MutationObserver(syncProjectTypeOptions);
      obs.observe(sourceSelect, { childList: true, subtree: true, characterData: true });
    }

    // 2. Modal controls for Consultancy Form
    const modal = document.getElementById('consultancyModal');
    function openModal() {
      if (typeof window.openConsultancyModal === 'function') {
        window.openConsultancyModal();
      } else if (modal) {
        syncProjectTypeOptions();
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }
    function closeModal() {
      if (typeof window.closeConsultancyModal === 'function') {
        window.closeConsultancyModal();
      } else if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    document.addEventListener('click', function (e) {
      const openBtn = e.target.closest('#consultancy .luxury-btn, .consultancy-open-btn, a[href="#consultancyModal"]');
      if (openBtn) {
        e.preventDefault();
        openModal();
        return;
      }

      const closeBtn = e.target.closest('#closeConsultancyModal, .consultancy-modal-close');
      if (closeBtn) {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // 3. Attach submit handler for each form
    function bindSubmit(form, isConsultancy) {
      if (!form) return;
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(this);
        const payload = {
          name: fd.get('name') || '',
          phone: fd.get('phone') || '',
          email: fd.get('email') || '',
          projectType: fd.get('projectType') || '',
          message: fd.get('message') || '',
          source: isConsultancy ? 'Consultancy Form' : 'Enquiry Form',
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Sending Enquiry... <i class="fa-solid fa-spinner fa-spin"></i>';
        }

        // 1. Save Enquiry directly via Database Service (Firestore)
        try {
          if (typeof Database !== 'undefined') {
            await Database.createEnquiry(payload);
          }
        } catch (err) {
          console.warn('[Enquiry Notice] Failed to save enquiry:', err.message);
        }

        // 2. Open WhatsApp for instant royal client engagement
        const greeting = isConsultancy
          ? 'Hello Rathore Heritage Developers,\n\nI would like to book a consultancy for a heritage project.'
          : 'Hello Rathore Heritage Developers,\n\nI would like to discuss a heritage project.';
        const txt = `${greeting}\n\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nType: ${payload.projectType}\nVision: ${payload.message}`;
        const waNum = (window.CMS_DATA?.settings?.whatsappNumber || '917850015839').replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${waNum}?text=` + encodeURIComponent(txt), "_blank");

        // 3. Reset form and show success
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Enquiry Sent! <i class="fa-solid fa-check"></i>';
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
          }, 4000);
        }

        if (isConsultancy) {
          setTimeout(() => {
            closeModal();
          }, 1500);
        }
      });
    }

    bindSubmit(enquiryForm, false);
    bindSubmit(consultancyForm, true);
  }

  // Execute on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncWithCMS();
      setupForms();
    });
  } else {
    syncWithCMS();
    setupForms();
  }
})();
