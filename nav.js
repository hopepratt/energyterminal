(function () {

  // ── Override nav CSS ─────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    /* Use visibility so opacity/transform transitions actually fire */
    .dropdown-menu {
      display: block !important;
      visibility: hidden;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0s linear 0.22s;
      pointer-events: none;
    }
    /* Kill the old CSS-hover trigger */
    .dropdown:hover .dropdown-menu {
      visibility: hidden; opacity: 0; transform: translateY(8px); pointer-events: none;
    }
    /* JS-driven open state */
    .dropdown.open > .dropdown-menu {
      visibility: visible;
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0s;
    }
    .dropdown:hover > a .chevron { transform: none; }
    .dropdown.open > a { color: var(--orange, #f58438); }
    .dropdown.open > a .chevron { transform: rotate(180deg) !important; }

    /* ── Mobile menu ── */
    .hamburger span { transition: transform 0.22s ease, opacity 0.22s ease; }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mob-overlay {
      display: none; position: fixed; inset: 0; z-index: 197;
      background: rgba(10,10,10,0.45); backdrop-filter: blur(2px);
    }
    .mob-overlay.open { display: block; }

    .mob-nav {
      position: fixed; top: 68px; left: 0; right: 0; bottom: 0; z-index: 198;
      background: var(--white, #f5f4f0);
      overflow-y: auto; overscroll-behavior: contain;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .mob-nav.open { transform: translateX(0); }

    .mob-item { border-bottom: 1px solid var(--border, #d8d3c8); }

    .mob-trigger {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 18px 24px; background: none; border: none;
      font-family: inherit; font-size: 0.82rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--black, #0a0a0a); cursor: pointer; text-align: left;
      text-decoration: none;
    }
    .mob-trigger:hover { color: var(--orange, #f58438); }
    .mob-trigger.active { color: var(--orange, #f58438); }
    .mob-trigger .mob-chevron { font-size: 0.6rem; transition: transform 0.22s; }
    .mob-trigger.active .mob-chevron { transform: rotate(180deg); }

    .mob-sub {
      display: grid; grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
      background: var(--cream, #ede9df);
    }
    .mob-sub.open { grid-template-rows: 1fr; }
    .mob-sub-inner { overflow: hidden; }

    .mob-sub a {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 24px 13px 32px;
      color: var(--black, #0a0a0a); text-decoration: none;
      font-size: 0.88rem; border-left: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s;
    }
    .mob-sub a:hover { color: var(--orange, #f58438); border-left-color: var(--orange, #f58438); }
    .mob-sub a .d-icon { font-size: 1rem; width: 22px; flex-shrink: 0; }
    .mob-sub a .d-desc { font-size: 0.72rem; color: var(--gray, #6b6b6b); display: block; margin-top: 1px; }
    .mob-sub a:hover .d-desc { color: var(--orange-dark, #d96e20); }

    .mob-cta-wrap { padding: 20px 24px 24px; }
    .mob-cta-wrap a {
      display: block; text-align: center;
      background: var(--orange, #f58438); color: #fff;
      padding: 14px 24px; font-size: 0.82rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
      transition: background 0.2s;
    }
    .mob-cta-wrap a:hover { background: var(--orange-dark, #d96e20); }
  `;
  document.head.appendChild(css);

  // ── Desktop: click-to-open dropdowns ────────────────────────────────────
  function closeAll() {
    document.querySelectorAll('.dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
  }

  document.querySelectorAll('.dropdown').forEach(function (dropdown) {
    var trigger = dropdown.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var wasOpen = dropdown.classList.contains('open');
      closeAll();
      if (!wasOpen) dropdown.classList.add('open');
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown') && !e.target.closest('.mob-nav')) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  // ── Build mobile nav ─────────────────────────────────────────────────────
  var hamburger = document.querySelector('.hamburger');
  if (!hamburger) return;

  var overlay = document.createElement('div');
  overlay.className = 'mob-overlay';

  var mobNav = document.createElement('nav');
  mobNav.className = 'mob-nav';
  mobNav.setAttribute('aria-label', 'Mobile navigation');

  document.querySelectorAll('.nav-links > li').forEach(function (li) {
    var anchor = li.querySelector(':scope > a');
    var dropMenu = li.querySelector('.dropdown-menu');

    var item = document.createElement('div');
    item.className = 'mob-item';

    if (anchor && anchor.classList.contains('nav-cta')) {
      // CTA button
      var ctaWrap = document.createElement('div');
      ctaWrap.className = 'mob-cta-wrap';
      var ctaA = document.createElement('a');
      ctaA.href = anchor.href;
      ctaA.textContent = anchor.textContent.trim().replace('▾', '').trim();
      ctaWrap.appendChild(ctaA);
      item.appendChild(ctaWrap);

    } else if (dropMenu) {
      // Accordion dropdown
      var btn = document.createElement('button');
      btn.className = 'mob-trigger';
      var labelText = anchor ? anchor.childNodes[0].textContent.trim() : '';
      btn.innerHTML = labelText + ' <span class="mob-chevron">▾</span>';

      var sub = document.createElement('div');
      sub.className = 'mob-sub';

      var inner = document.createElement('div');
      inner.className = 'mob-sub-inner';

      // Clone dropdown links (skip section labels)
      dropMenu.querySelectorAll('a').forEach(function (a) {
        var clone = a.cloneNode(true);
        clone.addEventListener('click', closeMobileMenu);
        inner.appendChild(clone);
      });

      sub.appendChild(inner);

      btn.addEventListener('click', function () {
        var isOpen = sub.classList.contains('open');
        // Close siblings
        mobNav.querySelectorAll('.mob-sub.open').forEach(function (s) { s.classList.remove('open'); });
        mobNav.querySelectorAll('.mob-trigger.active').forEach(function (b) { b.classList.remove('active'); });
        if (!isOpen) { sub.classList.add('open'); btn.classList.add('active'); }
      });

      item.appendChild(btn);
      item.appendChild(sub);

    } else if (anchor) {
      // Plain link
      var a = document.createElement('a');
      a.className = 'mob-trigger';
      a.href = anchor.href;
      a.textContent = anchor.textContent.trim().replace('▾', '').trim();
      a.addEventListener('click', closeMobileMenu);
      item.appendChild(a);
    }

    mobNav.appendChild(item);
  });

  document.body.appendChild(overlay);
  document.body.appendChild(mobNav);

  function openMobileMenu() {
    hamburger.classList.add('open');
    mobNav.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    hamburger.classList.remove('open');
    mobNav.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    mobNav.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  });

  overlay.addEventListener('click', closeMobileMenu);

})();
