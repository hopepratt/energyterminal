(function () {
  const SESSION_KEY = 'et_admin_session';
  const CONFIG_KEY = 'et_github_config';

  let session;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return; }
  if (!session || !session.loggedIn) return;

  let editMode = false;

  // ── Toolbar ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #et-admin-bar {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: #0a0a0a; color: #f5f4f0;
      border: 1px solid #333; border-radius: 6px;
      padding: 10px 14px; display: flex; align-items: center; gap: 10px;
      font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); user-select: none;
    }
    #et-admin-bar .et-label { color: #f58438; font-weight: 700; letter-spacing: 0.06em; }
    #et-admin-bar button {
      border: none; cursor: pointer; border-radius: 3px;
      font-family: inherit; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.05em; padding: 6px 14px; transition: background 0.2s;
    }
    #et-btn-edit  { background: #f58438; color: #fff; }
    #et-btn-edit:hover  { background: #d96e20; }
    #et-btn-edit.active { background: #555; color: #fff; }
    #et-btn-save  { background: #1a1a2e; color: #fff; display: none; }
    #et-btn-save:hover  { background: #2d2d50; }
    #et-btn-logout { background: transparent; color: rgba(255,255,255,0.4); padding: 6px 8px; }
    #et-btn-logout:hover { color: #fff; }
    #et-status { font-size: 0.72rem; color: rgba(255,255,255,0.5); min-width: 60px; }
    [data-et-editable] { outline: 2px dashed rgba(245,132,56,0.45) !important; outline-offset: 2px; cursor: text; }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'et-admin-bar';
  bar.innerHTML = `
    <span class="et-label">⚡ Admin</span>
    <button id="et-btn-edit">Edit Page</button>
    <button id="et-btn-save">Save to GitHub</button>
    <span id="et-status"></span>
    <button id="et-btn-logout">Logout</button>
  `;
  document.body.appendChild(bar);

  const btnEdit   = document.getElementById('et-btn-edit');
  const btnSave   = document.getElementById('et-btn-save');
  const statusEl  = document.getElementById('et-status');

  // Elements made editable (excluding nav, footer, admin bar)
  const EDITABLE = [
    'h1','h2','h3','h4','h5','h6','p','li','td','th',
    '.hero-stat','.hero-stat-label','.hero-stat2','.hero-stat2-label',
    '.testimonial-quote','.testimonial-author','.testimonial-role',
    '.hero-eyebrow','.hero-subtitle','.section-title','.section-desc',
    '.section-eyebrow','.pillar-label','.footer-tagline','.footer-brand-name'
  ];

  function enableEdit() {
    EDITABLE.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.closest('nav') || el.closest('footer') || el.closest('#et-admin-bar')) return;
        el.contentEditable = 'true';
        el.setAttribute('data-et-editable', '1');
      });
    });
  }

  function disableEdit() {
    document.querySelectorAll('[data-et-editable]').forEach(el => {
      el.contentEditable = 'false';
      el.removeAttribute('data-et-editable');
    });
  }

  btnEdit.addEventListener('click', function () {
    editMode = !editMode;
    if (editMode) {
      btnEdit.textContent = 'Stop Editing';
      btnEdit.classList.add('active');
      btnSave.style.display = 'block';
      enableEdit();
    } else {
      btnEdit.textContent = 'Edit Page';
      btnEdit.classList.remove('active');
      btnSave.style.display = 'none';
      disableEdit();
    }
  });

  // ── Save to GitHub ────────────────────────────────────────────────────────
  btnSave.addEventListener('click', async function () {
    let cfg;
    try { cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch (e) { cfg = {}; }

    if (!cfg.token || !cfg.owner || !cfg.repo) {
      alert('GitHub not configured. Open admin.html → Settings to set your repo and token.');
      return;
    }

    setStatus('Saving…');

    // Snapshot edits, then clean DOM for serialisation
    disableEdit();
    bar.style.display = 'none';

    const pagePath = (window.location.pathname.split('/').pop() || 'index.html');
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    bar.style.display = 'flex';
    if (editMode) enableEdit();

    const branch = cfg.branch || 'main';
    const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${pagePath}`;
    const headers = {
      'Authorization': `token ${cfg.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    try {
      // Get current SHA
      const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
      if (!getRes.ok) throw new Error(`Could not fetch file: ${getRes.status}`);
      const fileData = await getRes.json();

      // Base64-encode (handles Unicode)
      const encoded = btoa(unescape(encodeURIComponent(html)));

      const putRes = await fetch(apiBase, {
        method: 'PUT', headers,
        body: JSON.stringify({
          message: `Update ${pagePath} via ET admin`,
          content: encoded,
          sha: fileData.sha,
          branch
        })
      });

      if (putRes.ok) {
        setStatus('Saved ✓', 4000);
      } else {
        const err = await putRes.json();
        setStatus('Error: ' + (err.message || putRes.status), 6000);
      }
    } catch (e) {
      setStatus('Error: ' + e.message, 6000);
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  document.getElementById('et-btn-logout').addEventListener('click', function () {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  function setStatus(msg, clearAfter) {
    statusEl.textContent = msg;
    if (clearAfter) setTimeout(() => { statusEl.textContent = ''; }, clearAfter);
  }
})();
