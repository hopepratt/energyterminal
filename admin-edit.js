(function () {
  const SESSION_KEY = 'et_admin_session';
  const CONFIG_KEY  = 'et_github_config';

  let session;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return; }
  if (!session || !session.loggedIn) return;

  let editMode  = false;
  let selectedEl = null;
  let textEditEl = null;

  // ── Inject admin styles ───────────────────────────────────────────────────
  const adminStyle = document.createElement('style');
  adminStyle.id = 'et-admin-style';
  adminStyle.textContent = `
    #et-admin-bar {
      position: fixed; bottom: 24px; left: 24px; z-index: 99999;
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

    .et-hover:not(.et-selected) {
      outline: 2px dashed rgba(0,168,255,0.5) !important;
      outline-offset: 2px !important;
      cursor: pointer !important;
    }
    .et-selected {
      outline: 2px solid #00a8ff !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(0,168,255,0.15) !important;
    }
    [data-et-textedit] {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(34,197,94,0.15) !important;
      cursor: text !important;
    }

    #et-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 272px; background: #111; color: #f5f4f0;
      border-left: 1px solid #2a2a2a; z-index: 99998;
      font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
      display: none; flex-direction: column; overflow: hidden;
    }
    #et-panel-header {
      padding: 12px 14px 10px; border-bottom: 1px solid #222;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0; background: #0a0a0a;
    }
    #et-panel-el-tag {
      color: #f58438; font-weight: 700; font-size: 0.72rem;
      font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    #et-panel-close {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; font-size: 1.2rem; padding: 0 2px; line-height: 1;
      flex-shrink: 0; margin-left: 8px;
    }
    #et-panel-close:hover { color: #fff; }

    .et-tabs {
      display: flex; border-bottom: 1px solid #222; flex-shrink: 0;
      background: #0d0d0d;
    }
    .et-tab {
      flex: 1; padding: 9px 2px; text-align: center;
      font-size: 0.63rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: rgba(255,255,255,0.35);
      cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s;
    }
    .et-tab:hover { color: rgba(255,255,255,0.65); }
    .et-tab.active { color: #f58438; border-bottom-color: #f58438; }

    .et-tab-content { display: none; padding: 14px; overflow-y: auto; flex: 1; }
    .et-tab-content.active { display: block; }

    .et-ctrl { margin-bottom: 13px; }
    .et-ctrl-label {
      display: block; font-size: 0.63rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(255,255,255,0.38); margin-bottom: 5px;
    }
    .et-ctrl input[type=color] {
      width: 100%; height: 32px; border: 1px solid #2a2a2a;
      background: #1a1a1a; cursor: pointer; padding: 2px 3px;
      border-radius: 3px; display: block;
    }
    .et-ctrl input[type=range] { width: 100%; accent-color: #f58438; vertical-align: middle; }
    .et-ctrl input[type=number],
    .et-ctrl input[type=text],
    .et-ctrl select {
      width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
      color: #f5f4f0; padding: 6px 9px; font-family: inherit;
      font-size: 0.78rem; border-radius: 3px; outline: none;
    }
    .et-ctrl input:focus, .et-ctrl select:focus { border-color: #f58438; }
    .et-range-row { display: flex; align-items: center; gap: 7px; }
    .et-range-row input[type=range] { flex: 1; }
    .et-range-row input[type=number] { width: 54px; flex-shrink: 0; }
    .et-row { display: flex; gap: 8px; }
    .et-row .et-ctrl { flex: 1; margin-bottom: 0; }
    .et-align-btns { display: flex; gap: 4px; }
    .et-align-btns button {
      flex: 1; background: #1a1a1a; border: 1px solid #2a2a2a;
      color: rgba(255,255,255,0.45); padding: 6px 4px; cursor: pointer;
      border-radius: 3px; font-size: 0.78rem; transition: all 0.15s;
      font-family: inherit;
    }
    .et-align-btns button:hover { color: #fff; border-color: #555; }
    .et-align-btns button.active { background: #f58438; border-color: #f58438; color: #fff; }
    .et-divider { border: none; border-top: 1px solid #222; margin: 12px 0; }
    .et-section-label {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em;
      text-transform: uppercase; color: rgba(255,255,255,0.25);
      margin: 0 0 8px 0;
    }

    .et-action-btn {
      width: 100%; padding: 8px 12px; margin-bottom: 7px;
      background: #1a1a1a; border: 1px solid #2a2a2a; color: #f5f4f0;
      font-family: inherit; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.04em; cursor: pointer; border-radius: 3px;
      text-align: left; transition: all 0.15s;
      display: flex; align-items: center; gap: 8px;
    }
    .et-action-btn:hover { background: #252525; border-color: #444; }
    .et-action-btn.primary { border-color: #f58438; color: #f58438; }
    .et-action-btn.primary:hover { background: #f58438; color: #fff; }
    .et-action-btn.danger:hover { background: #2d0a0a; border-color: #8b0000; color: #ff6b6b; }
    .et-act-icon { width: 16px; text-align: center; flex-shrink: 0; }
    .et-help { font-size: 0.68rem; color: rgba(255,255,255,0.3); line-height: 1.5; margin-top: 10px; }

    .et-img-placeholder {
      border: 2px dashed #00a8ff; background: rgba(0,168,255,0.06);
      padding: 32px 20px; text-align: center; color: #00a8ff;
      font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600;
      animation: et-ph-pulse 1.5s ease-in-out infinite;
    }
    @keyframes et-ph-pulse {
      0%, 100% { border-color: rgba(0,168,255,0.5); }
      50% { border-color: #00a8ff; }
    }

    /* ── Insert points ("+" between sections) ── */
    .et-insert-point {
      display: flex; align-items: center; justify-content: center;
      padding: 4px 0; cursor: pointer; position: relative;
    }
    .et-insert-point::before {
      content: ''; position: absolute; left: 15%; right: 15%;
      height: 2px; background: rgba(0,168,255,0.2); top: 50%;
    }
    .et-insert-plus {
      width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(0,168,255,0.35);
      background: rgba(10,10,10,0.7); color: #00a8ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; line-height: 1;
      position: relative; z-index: 1; transition: all 0.2s;
      opacity: 0.5;
    }
    .et-insert-point:hover .et-insert-plus {
      opacity: 1; transform: scale(1.15); border-color: #00a8ff;
      background: #00a8ff; color: #fff;
      box-shadow: 0 2px 12px rgba(0,168,255,0.4);
    }

    /* ── Floating toolbar ── */
    #et-float-bar {
      position: absolute; z-index: 99997;
      background: #0a0a0a; border: 1px solid #333; border-radius: 8px;
      padding: 3px 4px; display: none; align-items: center; gap: 1px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.45);
      font-family: 'DM Sans', sans-serif;
    }
    #et-float-bar button {
      background: none; border: none; color: rgba(255,255,255,0.55);
      cursor: pointer; padding: 6px 9px; border-radius: 5px;
      font-size: 14px; transition: all 0.12s; line-height: 1;
    }
    #et-float-bar button:hover {
      background: rgba(255,255,255,0.1); color: #fff;
    }
    #et-float-bar button.et-fb-active {
      background: rgba(245,132,56,0.15); color: #f58438;
    }
    #et-float-bar .et-fb-sep {
      width: 1px; height: 18px; background: #333; margin: 0 2px; flex-shrink: 0;
    }

    #et-link-popover {
      position: absolute; z-index: 100002;
      background: #0a0a0a; border: 1px solid #333; border-radius: 8px;
      padding: 10px 12px; display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      font-family: 'DM Sans', sans-serif;
    }
    #et-link-popover .et-lp-row {
      display: flex; align-items: center; gap: 6px;
    }
    #et-link-popover input {
      background: #1a1a1a; border: 1px solid #2a2a2a; color: #f5f4f0;
      padding: 7px 10px; font-family: inherit; font-size: 0.8rem;
      border-radius: 4px; outline: none; width: 240px;
    }
    #et-link-popover input:focus { border-color: #f58438; }
    #et-link-popover button {
      border: none; cursor: pointer; border-radius: 4px;
      font-family: inherit; font-size: 0.72rem; font-weight: 700;
      letter-spacing: 0.05em; padding: 7px 12px; transition: background 0.15s;
    }
    #et-lp-apply { background: #f58438; color: #fff; }
    #et-lp-apply:hover { background: #d96e20; }
    #et-lp-remove { background: #1a1a1a; color: #ff6b6b; border: 1px solid #2a2a2a !important; }
    #et-lp-remove:hover { background: #2d0a0a; }
    #et-lp-cancel { background: #1a1a1a; color: rgba(255,255,255,0.5); }
    #et-lp-cancel:hover { color: #fff; }

    /* ── Add menu ── */
    #et-add-menu {
      position: absolute; z-index: 100000;
      background: #0a0a0a; border: 1px solid #333; border-radius: 8px;
      padding: 6px; display: none; flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      min-width: 170px; font-family: 'DM Sans', sans-serif;
    }
    #et-add-menu .et-am-label {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: rgba(255,255,255,0.3);
      padding: 6px 12px 4px;
    }
    #et-add-menu button {
      background: none; border: none; color: #f5f4f0;
      padding: 9px 12px; text-align: left; cursor: pointer;
      font-family: inherit; font-size: 0.82rem; font-weight: 500;
      border-radius: 5px; transition: background 0.12s;
      display: flex; align-items: center; gap: 10px;
    }
    #et-add-menu button:hover {
      background: rgba(245,132,56,0.12); color: #f58438;
    }
    #et-add-menu button .et-am-icon { width: 18px; text-align: center; font-size: 14px; }

    #et-btn-nav { background: #1a1a2e; color: #fff; }
    #et-btn-nav:hover { background: #2d2d50; }

    #et-nav-modal {
      display:none; position:fixed; inset:0; z-index:100001;
      background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);
      font-family:'DM Sans',sans-serif;
      align-items:flex-start; justify-content:center; padding-top:40px;
    }
    #et-nav-modal.open { display:flex; }
    .et-nm-inner {
      background:#111; border:1px solid #2a2a2a; border-radius:8px;
      width:540px; max-height:calc(100vh - 80px); overflow-y:auto;
      color:#f5f4f0; box-shadow:0 16px 64px rgba(0,0,0,0.6);
    }
    .et-nm-head {
      padding:16px 20px; border-bottom:1px solid #222;
      display:flex; align-items:center; justify-content:space-between;
      position:sticky; top:0; background:#0a0a0a; z-index:1; border-radius:8px 8px 0 0;
    }
    .et-nm-head h2 { font-size:0.88rem; font-weight:700; color:#f58438; margin:0; }
    .et-nm-close {
      background:none; border:none; color:rgba(255,255,255,0.4);
      cursor:pointer; font-size:1.4rem; padding:0; line-height:1;
    }
    .et-nm-close:hover { color:#fff; }
    .et-nm-body { padding:16px 20px; }
    .et-nm-cat {
      border:1px solid #2a2a2a; border-radius:6px; margin-bottom:14px;
      background:#0d0d0d; overflow:hidden;
    }
    .et-nm-cat-head {
      padding:10px 12px; background:#0a0a0a; border-bottom:1px solid #222;
      display:flex; gap:8px; align-items:center;
    }
    .et-nm-cat-head input {
      background:#1a1a1a; border:1px solid #2a2a2a; color:#f5f4f0;
      padding:5px 8px; font-family:inherit; font-size:0.78rem;
      border-radius:3px; outline:none;
    }
    .et-nm-cat-head input:focus { border-color:#f58438; }
    .et-nm-lbl {
      font-size:0.58rem; font-weight:700; letter-spacing:0.1em;
      text-transform:uppercase; color:rgba(255,255,255,0.3); flex-shrink:0;
    }
    .et-nm-cat-del {
      background:none; border:none; color:rgba(255,255,255,0.2);
      cursor:pointer; font-size:0.9rem; margin-left:auto; padding:2px 6px;
    }
    .et-nm-cat-del:hover { color:#ff6b6b; }
    .et-nm-items { padding:6px 8px; }
    .et-nm-item { padding:8px 6px; border-bottom:1px solid #1a1a1a; }
    .et-nm-item:last-child { border-bottom:none; }
    .et-nm-item-row { display:flex; gap:6px; align-items:center; margin-bottom:4px; }
    .et-nm-item input, .et-nm-item select {
      background:#1a1a1a; border:1px solid #2a2a2a; color:#f5f4f0;
      padding:4px 7px; font-family:inherit; font-size:0.72rem;
      border-radius:3px; outline:none;
    }
    .et-nm-item input:focus, .et-nm-item select:focus { border-color:#f58438; }
    .et-nm-item-btns { display:flex; gap:1px; flex-shrink:0; }
    .et-nm-item-btns button {
      background:none; border:none; color:rgba(255,255,255,0.25);
      cursor:pointer; padding:3px 5px; font-size:0.7rem; border-radius:3px;
    }
    .et-nm-item-btns button:hover { color:#fff; background:rgba(255,255,255,0.08); }
    .et-nm-item-btns .et-nib-del:hover { color:#ff6b6b; }
    .et-nm-add-item { padding:4px 8px 8px; }
    .et-nm-add-item button, .et-nm-add-cat button {
      background:none; border:1px dashed #333; color:rgba(255,255,255,0.3);
      cursor:pointer; padding:6px 12px; border-radius:4px;
      font-family:inherit; font-size:0.72rem; font-weight:600; width:100%;
      transition:all 0.15s;
    }
    .et-nm-add-item button:hover, .et-nm-add-cat button:hover {
      border-color:#f58438; color:#f58438;
    }
    .et-nm-add-cat { margin-bottom:14px; }
    .et-nm-cta {
      border:1px solid #2a2a2a; border-radius:6px; padding:12px;
      margin-bottom:14px; background:#0d0d0d;
    }
    .et-nm-cta-row { display:flex; gap:8px; margin-top:6px; }
    .et-nm-cta-row input {
      background:#1a1a1a; border:1px solid #2a2a2a; color:#f5f4f0;
      padding:5px 8px; font-family:inherit; font-size:0.78rem;
      border-radius:3px; outline:none; flex:1;
    }
    .et-nm-cta-row input:focus { border-color:#f58438; }
    #et-nav-save {
      width:100%; padding:12px; background:#f58438; border:none; color:#fff;
      font-family:inherit; font-size:0.82rem; font-weight:700;
      letter-spacing:0.06em; cursor:pointer; border-radius:4px;
      transition:background 0.2s;
    }
    #et-nav-save:hover { background:#d96e20; }
    #et-nav-save:disabled { background:#555; cursor:not-allowed; }
    #et-nav-status {
      font-size:0.72rem; color:rgba(255,255,255,0.5);
      text-align:center; min-height:16px; margin-top:8px;
    }
  `;
  document.head.appendChild(adminStyle);

  // ── Admin bar ─────────────────────────────────────────────────────────────
  const bar = document.createElement('div');
  bar.id = 'et-admin-bar';
  bar.innerHTML = `
    <span class="et-label">⚡ Admin</span>
    <button id="et-btn-edit">Edit Page</button>
    <button id="et-btn-save">Save to GitHub</button>
    <button id="et-btn-nav">Edit Nav</button>
    <span id="et-status"></span>
    <button id="et-btn-logout">Logout</button>
  `;
  document.body.appendChild(bar);

  const btnEdit  = document.getElementById('et-btn-edit');
  const btnSave  = document.getElementById('et-btn-save');
  const statusEl = document.getElementById('et-status');

  // ── Inspector panel ───────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'et-panel';
  panel.innerHTML = `
    <div id="et-panel-header">
      <span id="et-panel-el-tag">—</span>
      <button id="et-panel-close" title="Close (Esc)">×</button>
    </div>
    <div class="et-tabs">
      <div class="et-tab active" data-tab="style">Style</div>
      <div class="et-tab" data-tab="spacing">Space</div>
      <div class="et-tab" data-tab="layout">Layout</div>
      <div class="et-tab" data-tab="actions">Actions</div>
    </div>

    <!-- Style -->
    <div class="et-tab-content active" id="et-tab-style">
      <div class="et-ctrl">
        <label class="et-ctrl-label">Text Color</label>
        <input type="color" id="et-color-text"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Background Color</label>
        <input type="color" id="et-color-bg"/>
        <button id="et-clear-bg" style="margin-top:5px;width:100%;background:#1a1a1a;border:1px solid #2a2a2a;color:rgba(255,255,255,0.45);padding:5px;border-radius:3px;cursor:pointer;font-family:inherit;font-size:0.7rem;">Clear Background</button>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Font Size (px)</label>
        <div class="et-range-row">
          <input type="range" id="et-font-size-r" min="8" max="140" step="1"/>
          <input type="number" id="et-font-size-n" min="8" max="140"/>
        </div>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Font Weight</label>
        <select id="et-font-weight">
          <option value="">Default</option>
          <option value="300">Light (300)</option>
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">SemiBold (600)</option>
          <option value="700">Bold (700)</option>
          <option value="900">Black (900)</option>
        </select>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Text Align</label>
        <div class="et-align-btns">
          <button data-align="left">Left</button>
          <button data-align="center">Center</button>
          <button data-align="right">Right</button>
        </div>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Line Height</label>
        <div class="et-range-row">
          <input type="range" id="et-line-height-r" min="0.8" max="3" step="0.05"/>
          <input type="number" id="et-line-height-n" min="0.8" max="3" step="0.05"/>
        </div>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Letter Spacing (em)</label>
        <div class="et-range-row">
          <input type="range" id="et-letter-spacing-r" min="-0.1" max="0.5" step="0.01"/>
          <input type="number" id="et-letter-spacing-n" min="-0.1" max="0.5" step="0.01"/>
        </div>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Border Radius (px)</label>
        <div class="et-range-row">
          <input type="range" id="et-border-radius-r" min="0" max="120" step="1"/>
          <input type="number" id="et-border-radius-n" min="0" max="120"/>
        </div>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Opacity</label>
        <div class="et-range-row">
          <input type="range" id="et-opacity-r" min="0" max="1" step="0.05"/>
          <input type="number" id="et-opacity-n" min="0" max="1" step="0.05"/>
        </div>
      </div>
    </div>

    <!-- Spacing -->
    <div class="et-tab-content" id="et-tab-spacing">
      <div class="et-ctrl">
        <label class="et-ctrl-label">Padding (px)</label>
        <div class="et-row" style="margin-bottom:7px;">
          <div class="et-ctrl"><label class="et-ctrl-label">Top</label><input type="number" id="et-pt" min="0"/></div>
          <div class="et-ctrl"><label class="et-ctrl-label">Right</label><input type="number" id="et-pr" min="0"/></div>
        </div>
        <div class="et-row">
          <div class="et-ctrl"><label class="et-ctrl-label">Bottom</label><input type="number" id="et-pb" min="0"/></div>
          <div class="et-ctrl"><label class="et-ctrl-label">Left</label><input type="number" id="et-pl" min="0"/></div>
        </div>
      </div>
      <div style="margin-top:14px;">
      <div class="et-ctrl">
        <label class="et-ctrl-label">Margin (px)</label>
        <div class="et-row" style="margin-bottom:7px;">
          <div class="et-ctrl"><label class="et-ctrl-label">Top</label><input type="number" id="et-mt"/></div>
          <div class="et-ctrl"><label class="et-ctrl-label">Right</label><input type="number" id="et-mr"/></div>
        </div>
        <div class="et-row">
          <div class="et-ctrl"><label class="et-ctrl-label">Bottom</label><input type="number" id="et-mb"/></div>
          <div class="et-ctrl"><label class="et-ctrl-label">Left</label><input type="number" id="et-ml"/></div>
        </div>
      </div>
      </div>
      <div style="margin-top:14px;">
      <p class="et-section-label">Size</p>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Width</label>
        <input type="text" id="et-width" placeholder="e.g. 100%, 480px, auto"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Max Width</label>
        <input type="text" id="et-max-width" placeholder="e.g. 640px, none"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Height</label>
        <input type="text" id="et-height" placeholder="e.g. auto, 300px"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Min Height</label>
        <input type="text" id="et-min-height" placeholder="e.g. 100vh, 200px"/>
      </div>
      </div>
    </div>

    <!-- Layout -->
    <div class="et-tab-content" id="et-tab-layout">
      <div class="et-ctrl">
        <label class="et-ctrl-label">Display</label>
        <select id="et-display">
          <option value="">Default</option>
          <option value="block">Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
          <option value="inline">Inline</option>
          <option value="inline-block">Inline Block</option>
          <option value="none">None (Hidden)</option>
        </select>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Gap (px)</label>
        <div class="et-range-row">
          <input type="range" id="et-gap-r" min="0" max="120" step="2"/>
          <input type="number" id="et-gap-n" min="0" max="300"/>
        </div>
      </div>
      <div style="margin-top:14px;">
      <p class="et-section-label">Flex</p>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Flex Direction</label>
        <select id="et-flex-dir">
          <option value="">Default</option>
          <option value="row">Row</option>
          <option value="column">Column</option>
          <option value="row-reverse">Row Reverse</option>
          <option value="column-reverse">Column Reverse</option>
        </select>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Justify Content</label>
        <select id="et-justify">
          <option value="">Default</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
          <option value="space-around">Space Around</option>
          <option value="space-evenly">Space Evenly</option>
        </select>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Align Items</label>
        <select id="et-align-items">
          <option value="">Default</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
          <option value="baseline">Baseline</option>
        </select>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Flex Wrap</label>
        <select id="et-flex-wrap">
          <option value="">Default</option>
          <option value="wrap">Wrap</option>
          <option value="nowrap">No Wrap</option>
          <option value="wrap-reverse">Wrap Reverse</option>
        </select>
      </div>
      </div>
      <div style="margin-top:14px;">
      <p class="et-section-label">Grid</p>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Grid Template Columns</label>
        <input type="text" id="et-grid-cols" placeholder="e.g. 1fr 1fr, repeat(3,1fr)"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Grid Template Rows</label>
        <input type="text" id="et-grid-rows" placeholder="e.g. auto 1fr auto"/>
      </div>
      <div class="et-ctrl">
        <label class="et-ctrl-label">Grid Column (self)</label>
        <input type="text" id="et-grid-col-self" placeholder="e.g. span 2, 1 / 3"/>
      </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="et-tab-content" id="et-tab-actions">
      <button class="et-action-btn primary" id="et-act-text">
        <span class="et-act-icon">✏️</span> Edit Text Content
      </button>

      <!-- Link editing (shown when selected element is/contains <a>) -->
      <div id="et-link-section" style="display:none;margin-top:14px;">
        <p class="et-section-label">Link</p>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Link URL</label>
          <input type="text" id="et-link-href" placeholder="e.g. join.html or https://…"/>
        </div>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Quick Link to Page</label>
          <select id="et-link-page">
            <option value="">— Custom URL —</option>
            <option value="index.html">Home</option>
            <option value="our-mission.html">Our Mission</option>
            <option value="our-team.html">Our Team</option>
            <option value="join.html">Join</option>
            <option value="emerging-leaders.html">Emerging Leaders</option>
            <option value="virtual-visits.html">Virtual Visits</option>
            <option value="podcast.html">Podcast</option>
            <option value="resource-hub.html">Resource Hub</option>
            <option value="career-pathways.html">Career Pathways</option>
            <option value="general-resources.html">General Resources</option>
            <option value="recruitment-prep.html">Recruitment Prep</option>
            <option value="energy-verticals.html">Energy Verticals</option>
            <option value="energy-terminal.html">Energy Terminal</option>
          </select>
        </div>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Open In</label>
          <div class="et-align-btns">
            <button data-tgt="" id="et-tgt-self">Same Tab</button>
            <button data-tgt="_blank" id="et-tgt-blank">New Tab</button>
          </div>
        </div>
      </div>

      <!-- Image editing (shown when <img> is selected) -->
      <div id="et-img-section" style="display:none;margin-top:14px;">
        <p class="et-section-label">Image</p>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Image Source</label>
          <input type="text" id="et-img-src" style="opacity:0.65;" readonly/>
        </div>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Alt Text</label>
          <input type="text" id="et-img-alt" placeholder="Describe the image"/>
        </div>
        <div class="et-ctrl">
          <label class="et-ctrl-label">Width</label>
          <input type="text" id="et-img-width" placeholder="e.g. 100%, 400px, auto"/>
        </div>
        <button class="et-action-btn" id="et-img-replace-btn">
          <span class="et-act-icon">🔄</span> Replace Image
        </button>
        <input type="file" id="et-img-replace-file" accept="image/*" style="display:none;"/>
        <p id="et-img-replace-status" style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:5px;"></p>
      </div>

      <div style="margin-top:16px;">
        <p class="et-section-label">Arrange</p>
        <button class="et-action-btn" id="et-act-up">
          <span class="et-act-icon">↑</span> Move Up
        </button>
        <button class="et-action-btn" id="et-act-down">
          <span class="et-act-icon">↓</span> Move Down
        </button>
        <button class="et-action-btn" id="et-act-dupe">
          <span class="et-act-icon">⧉</span> Duplicate
        </button>
      </div>

      <div style="margin-top:16px;">
        <p class="et-section-label">Add</p>
        <button class="et-action-btn" id="et-act-add-img">
          <span class="et-act-icon">🖼</span> Add Image
        </button>
        <input type="file" id="et-panel-img-file" accept="image/*" style="display:none;"/>
        <p id="et-panel-img-status" style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:5px;"></p>

        <button class="et-action-btn" id="et-act-add-btn">
          <span class="et-act-icon">➕</span> Add Button
        </button>
        <div id="et-add-btn-form" style="display:none;margin-top:7px;">
          <div class="et-ctrl">
            <label class="et-ctrl-label">Button Text</label>
            <input type="text" id="et-new-btn-text" placeholder="e.g. Learn More" value="New Button"/>
          </div>
          <div class="et-ctrl">
            <label class="et-ctrl-label">Link To</label>
            <select id="et-new-btn-page">
              <option value="#">— Select page —</option>
              <option value="index.html">Home</option>
              <option value="our-mission.html">Our Mission</option>
              <option value="our-team.html">Our Team</option>
              <option value="join.html">Join</option>
              <option value="emerging-leaders.html">Emerging Leaders</option>
              <option value="virtual-visits.html">Virtual Visits</option>
              <option value="podcast.html">Podcast</option>
              <option value="resource-hub.html">Resource Hub</option>
              <option value="career-pathways.html">Career Pathways</option>
              <option value="general-resources.html">General Resources</option>
              <option value="recruitment-prep.html">Recruitment Prep</option>
              <option value="energy-verticals.html">Energy Verticals</option>
              <option value="energy-terminal.html">Energy Terminal</option>
            </select>
          </div>
          <div class="et-ctrl">
            <label class="et-ctrl-label">Style</label>
            <select id="et-new-btn-style">
              <option value="btn-primary">Primary (Orange Filled)</option>
              <option value="btn-outline">Outline (Black Border)</option>
              <option value="link-chip">Chip (Orange Border)</option>
            </select>
          </div>
          <button class="et-action-btn primary" id="et-new-btn-insert">
            <span class="et-act-icon">✓</span> Insert Button
          </button>
        </div>
      </div>

      <div style="margin-top:16px;">
        <button class="et-action-btn danger" id="et-act-del">
          <span class="et-act-icon">🗑</span> Delete Element
      </button>
      <p class="et-help">Tip: Press <strong>Delete</strong> key to remove selected element. Press <strong>Esc</strong> to deselect.</p>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Floating toolbar (appears above selected element) ─────────────────────
  const floatBar = document.createElement('div');
  floatBar.id = 'et-float-bar';
  floatBar.innerHTML = `
    <button id="et-fb-text" title="Edit text (or double-click)">✏️</button>
    <button id="et-fb-link" title="Add/edit hyperlink (select text first)">🔗</button>
    <button id="et-fb-add" title="Add element here">➕</button>
    <span class="et-fb-sep"></span>
    <button id="et-fb-dupe" title="Duplicate">⧉</button>
    <button id="et-fb-del" title="Delete">🗑</button>
    <span class="et-fb-sep"></span>
    <button id="et-fb-panel" title="Toggle style panel">⚙️</button>
  `;
  document.body.appendChild(floatBar);

  // ── Link popover (for hyperlinking selected text) ─────────────────────────
  const linkPopover = document.createElement('div');
  linkPopover.id = 'et-link-popover';
  linkPopover.innerHTML = `
    <div class="et-lp-row">
      <input type="text" id="et-lp-url" placeholder="https://… or page.html"/>
      <button id="et-lp-apply">Apply</button>
      <button id="et-lp-remove" style="display:none;">Unlink</button>
      <button id="et-lp-cancel">✕</button>
    </div>
  `;
  document.body.appendChild(linkPopover);

  let savedRange = null;

  // ── Add menu (shared by "+" points and floating toolbar) ──────────────────
  const addMenu = document.createElement('div');
  addMenu.id = 'et-add-menu';
  addMenu.innerHTML = `
    <div class="et-am-label">Add element</div>
    <button data-add="h2"><span class="et-am-icon">H</span> Heading</button>
    <button data-add="p"><span class="et-am-icon">¶</span> Text</button>
    <button data-add="button"><span class="et-am-icon">▢</span> Button</button>
    <button data-add="image"><span class="et-am-icon">🖼</span> Image</button>
    <button data-add="hr"><span class="et-am-icon">—</span> Divider</button>
  `;
  document.body.appendChild(addMenu);

  // Hidden file input for add-menu image flow
  const addMenuFileInput = document.createElement('input');
  addMenuFileInput.type = 'file';
  addMenuFileInput.accept = 'image/*';
  addMenuFileInput.style.display = 'none';
  addMenuFileInput.id = 'et-am-file';
  document.body.appendChild(addMenuFileInput);

  let addMenuInsertRef = null; // insert before this element (null = append)
  let addMenuParent    = null; // parent to insert into
  let panelVisible     = false;

  // ── Tab switching ─────────────────────────────────────────────────────────
  panel.querySelectorAll('.et-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      panel.querySelectorAll('.et-tab').forEach(t => t.classList.remove('active'));
      panel.querySelectorAll('.et-tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('et-tab-' + this.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('et-panel-close').addEventListener('click', deselect);

  // ── Toggle edit mode ──────────────────────────────────────────────────────
  btnEdit.addEventListener('click', function () {
    editMode = !editMode;
    if (editMode) {
      this.textContent = 'Stop Editing';
      this.classList.add('active');
      btnSave.style.display = 'block';
      document.body.addEventListener('mouseover', onHover);
      document.body.addEventListener('mouseout', onHoverOut);
      document.body.addEventListener('click', onClick, true);
      document.body.addEventListener('dblclick', onDblClick, true);
      document.addEventListener('keydown', onKeydown);
      window.addEventListener('scroll', onScrollThrottled);
      createInsertPoints();
    } else {
      this.textContent = 'Edit Page';
      this.classList.remove('active');
      btnSave.style.display = 'none';
      stopTextEdit();
      deselect();
      hideAddMenu();
      hideLinkPopover();
      removeInsertPoints();
      floatBar.style.display = 'none';
      document.body.removeEventListener('mouseover', onHover);
      document.body.removeEventListener('mouseout', onHoverOut);
      document.body.removeEventListener('click', onClick, true);
      document.body.removeEventListener('dblclick', onDblClick, true);
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onScrollThrottled);
    }
  });

  // ── Hover highlight ───────────────────────────────────────────────────────
  function onHover(e) {
    const t = e.target;
    if (isAdminEl(t) || t === selectedEl) return;
    t.classList.add('et-hover');
  }
  function onHoverOut(e) {
    e.target.classList.remove('et-hover');
  }

  // ── Click to select ───────────────────────────────────────────────────────
  function onClick(e) {
    if (isAdminEl(e.target)) return;
    if (textEditEl && textEditEl.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    hideAddMenu();
    if (textEditEl && !textEditEl.contains(e.target)) stopTextEdit();

    if (!e.target || e.target === document.body || e.target === document.documentElement) {
      deselect(); return;
    }
    select(e.target);
  }

  // ── Double-click to edit text ─────────────────────────────────────────────
  function onDblClick(e) {
    if (isAdminEl(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    if (!el || el === document.body) return;
    select(el);
    stopTextEdit();
    textEditEl = selectedEl;
    selectedEl.contentEditable = 'true';
    selectedEl.setAttribute('data-et-textedit', '1');
    selectedEl.focus();
  }

  function isAdminEl(el) {
    return el.closest('#et-panel') || el.closest('#et-admin-bar') ||
           el.closest('#et-float-bar') || el.closest('#et-add-menu') ||
           el.closest('.et-insert-point') || el.closest('.et-img-placeholder') ||
           el.closest('#et-nav-modal') || el.closest('#et-link-popover');
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function select(el) {
    if (el === selectedEl) return;
    deselect();
    selectedEl = el;
    el.classList.remove('et-hover');
    el.classList.add('et-selected');

    const tag = el.tagName.toLowerCase();
    const clsStr = typeof el.className === 'string' ? el.className : (el.className.baseVal || '');
    const cls = clsStr
      .replace(/et-[\w-]+\s?/g, '').trim().split(/\s+/).slice(0, 2)
      .filter(Boolean).map(c => '.' + c).join('');
    document.getElementById('et-panel-el-tag').textContent = tag + cls;

    if (panelVisible) {
      panel.style.display = 'flex';
      populatePanel(el);
    }
    document.getElementById('et-act-text').textContent = '✏️ Edit Text Content';
    positionFloatBar();
  }

  function deselect() {
    if (selectedEl) {
      selectedEl.classList.remove('et-selected');
      selectedEl = null;
    }
    panel.style.display = 'none';
    floatBar.style.display = 'none';
    hideLinkPopover();
    hideAddMenu();
  }

  // ── Floating toolbar positioning ──────────────────────────────────────────
  function positionFloatBar() {
    if (!selectedEl || !editMode) { floatBar.style.display = 'none'; return; }
    var rect = selectedEl.getBoundingClientRect();
    floatBar.style.display = 'flex';
    var barH = floatBar.offsetHeight || 36;
    var top = rect.top + window.scrollY - barH - 8;
    if (top < window.scrollY + 72) top = rect.bottom + window.scrollY + 8;
    var left = rect.left + window.scrollX;
    var maxLeft = window.innerWidth - floatBar.offsetWidth - 10;
    if (left > maxLeft) left = maxLeft;
    if (left < 4) left = 4;
    floatBar.style.top = top + 'px';
    floatBar.style.left = left + 'px';
  }

  var scrollTimer = null;
  function onScrollThrottled() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () { scrollTimer = null; positionFloatBar(); }, 30);
  }

  function stopTextEdit() {
    if (textEditEl) {
      textEditEl.contentEditable = 'false';
      textEditEl.removeAttribute('data-et-textedit');
      textEditEl = null;
    }
    const btn = document.getElementById('et-act-text');
    if (btn) btn.textContent = '✏️ Edit Text Content';
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (textEditEl) stopTextEdit();
      else deselect();
    }
    if (e.key === 'Delete' && selectedEl && !textEditEl && document.activeElement === document.body) {
      document.getElementById('et-act-del').click();
    }
  }

  // ── Populate panel from selected element ──────────────────────────────────
  function populatePanel(el) {
    const s  = el.style;
    const cs = window.getComputedStyle(el);

    // Style tab
    setColorInput('et-color-text', s.color || cs.color);
    setColorInput('et-color-bg',   s.backgroundColor ||
      (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : null));

    setRangePair('et-font-size',     parseFloat(s.fontSize  || cs.fontSize)  || '');
    setRangePair('et-line-height',   parseFloat(s.lineHeight || cs.lineHeight) || '');
    setRangePair('et-letter-spacing',parseFloat(s.letterSpacing) || 0);
    setRangePair('et-border-radius', parseFloat(s.borderRadius)  || 0);
    setRangePair('et-opacity',
      s.opacity !== '' ? parseFloat(s.opacity) : parseFloat(cs.opacity) || 1);

    v('et-font-weight').value = s.fontWeight || '';

    const ta = s.textAlign || cs.textAlign || '';
    panel.querySelectorAll('.et-align-btns button').forEach(b =>
      b.classList.toggle('active', b.dataset.align === ta)
    );

    // Spacing tab
    const paddingSides = ['paddingTop','paddingRight','paddingBottom','paddingLeft'];
    ['pt','pr','pb','pl'].forEach((id, i) =>
      v('et-' + id).value = parseFloat(s[paddingSides[i]] || cs[paddingSides[i]]) || ''
    );
    const marginSides = ['marginTop','marginRight','marginBottom','marginLeft'];
    ['mt','mr','mb','ml'].forEach((id, i) => {
      const val = parseFloat(s[marginSides[i]] || cs[marginSides[i]]);
      v('et-' + id).value = isNaN(val) ? '' : val;
    });
    v('et-width').value     = s.width     || '';
    v('et-max-width').value = s.maxWidth  || '';
    v('et-height').value    = s.height    || '';
    v('et-min-height').value= s.minHeight || '';

    // Layout tab
    v('et-display').value   = s.display       || '';
    setRangePair('et-gap',    parseFloat(s.gap || s.columnGap || cs.gap || cs.columnGap) || 0);
    v('et-flex-dir').value  = s.flexDirection  || '';
    v('et-justify').value   = s.justifyContent || '';
    v('et-align-items').value = s.alignItems   || '';
    v('et-flex-wrap').value = s.flexWrap       || '';
    v('et-grid-cols').value = s.gridTemplateColumns || '';
    v('et-grid-rows').value = s.gridTemplateRows    || '';
    v('et-grid-col-self').value = s.gridColumn      || '';

    // Link section (Actions tab)
    const anchor = getAnchor(el);
    const linkSection = v('et-link-section');
    if (anchor) {
      linkSection.style.display = 'block';
      v('et-link-href').value = anchor.getAttribute('href') || '';
      const pageSelect = v('et-link-page');
      const hrefVal = anchor.getAttribute('href') || '';
      const matchOpt = Array.from(pageSelect.options).find(o => o.value && o.value === hrefVal);
      pageSelect.value = matchOpt ? hrefVal : '';
      const tgt = anchor.getAttribute('target') || '';
      v('et-tgt-self').classList.toggle('active', tgt !== '_blank');
      v('et-tgt-blank').classList.toggle('active', tgt === '_blank');
    } else {
      linkSection.style.display = 'none';
    }

    // Image section (Actions tab)
    const img = getImage(el);
    const imgSection = v('et-img-section');
    if (img) {
      imgSection.style.display = 'block';
      v('et-img-src').value   = img.getAttribute('src') || '';
      v('et-img-alt').value   = img.getAttribute('alt') || '';
      v('et-img-width').value = img.style.width || img.getAttribute('width') || '';
      v('et-img-replace-status').textContent = '';
    } else {
      imgSection.style.display = 'none';
    }

    // Reset forms
    v('et-add-btn-form').style.display = 'none';
    if (typeof removeImgPlaceholder === 'function') removeImgPlaceholder();
  }

  function v(id) { return document.getElementById(id); }

  function setColorInput(id, val) {
    const el = v(id);
    if (!el) return;
    if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent') {
      el.value = '#000000'; return;
    }
    try { el.value = rgbToHex(val); } catch (e) { el.value = '#000000'; }
  }

  function setRangePair(prefix, val) {
    const r = v(prefix + '-r'), n = v(prefix + '-n');
    if (r) r.value = val;
    if (n) n.value = val;
  }

  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (/^#/.test(rgb)) {
      return rgb.length === 4
        ? '#' + rgb[1] + rgb[1] + rgb[2] + rgb[2] + rgb[3] + rgb[3]
        : rgb;
    }
    const m = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  // ── Apply style helper ────────────────────────────────────────────────────
  function apply(prop, val) {
    if (selectedEl) selectedEl.style[prop] = val;
  }

  // ── Wire up range pairs ───────────────────────────────────────────────────
  function wireRange(prefix, fn) {
    const r = v(prefix + '-r'), n = v(prefix + '-n');
    if (!r || !n) return;
    r.addEventListener('input', function () { n.value = this.value; const fv = parseFloat(this.value); if (!isNaN(fv)) fn(fv); });
    n.addEventListener('input', function () { r.value = this.value; const fv = parseFloat(this.value); if (!isNaN(fv)) fn(fv); });
  }

  // ── Style tab wiring ──────────────────────────────────────────────────────
  v('et-color-text').addEventListener('input', e => apply('color',           e.target.value));
  v('et-color-bg').addEventListener(  'input', e => apply('backgroundColor', e.target.value));
  v('et-clear-bg').addEventListener(  'click', ()  => apply('backgroundColor', ''));
  wireRange('et-font-size',      val => apply('fontSize',      val + 'px'));
  wireRange('et-line-height',    val => apply('lineHeight',    val));
  wireRange('et-letter-spacing', val => apply('letterSpacing', val + 'em'));
  wireRange('et-border-radius',  val => apply('borderRadius',  val + 'px'));
  wireRange('et-opacity',        val => apply('opacity',       val));
  v('et-font-weight').addEventListener('change', e => apply('fontWeight', e.target.value));
  panel.querySelectorAll('.et-align-btns button').forEach(b => {
    b.addEventListener('click', function () {
      panel.querySelectorAll('.et-align-btns button').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      apply('textAlign', this.dataset.align);
    });
  });

  // ── Spacing tab wiring ────────────────────────────────────────────────────
  const paddingMap = { 'et-pt': 'paddingTop', 'et-pr': 'paddingRight', 'et-pb': 'paddingBottom', 'et-pl': 'paddingLeft' };
  const marginMap  = { 'et-mt': 'marginTop',  'et-mr': 'marginRight',  'et-mb': 'marginBottom',  'et-ml': 'marginLeft'  };
  Object.entries({ ...paddingMap, ...marginMap }).forEach(([id, prop]) => {
    v(id).addEventListener('input', e => apply(prop, e.target.value !== '' ? e.target.value + 'px' : ''));
  });
  v('et-width').addEventListener(     'input', e => apply('width',     e.target.value));
  v('et-max-width').addEventListener( 'input', e => apply('maxWidth',  e.target.value));
  v('et-height').addEventListener(    'input', e => apply('height',    e.target.value));
  v('et-min-height').addEventListener('input', e => apply('minHeight', e.target.value));

  // ── Layout tab wiring ─────────────────────────────────────────────────────
  v('et-display').addEventListener(    'change', e => apply('display',            e.target.value));
  v('et-flex-dir').addEventListener(   'change', e => apply('flexDirection',      e.target.value));
  v('et-justify').addEventListener(    'change', e => apply('justifyContent',     e.target.value));
  v('et-align-items').addEventListener('change', e => apply('alignItems',         e.target.value));
  v('et-flex-wrap').addEventListener(  'change', e => apply('flexWrap',           e.target.value));
  v('et-grid-cols').addEventListener(  'input',  e => apply('gridTemplateColumns',e.target.value));
  v('et-grid-rows').addEventListener(  'input',  e => apply('gridTemplateRows',   e.target.value));
  v('et-grid-col-self').addEventListener('input',e => apply('gridColumn',         e.target.value));
  wireRange('et-gap', val => apply('gap', val + 'px'));

  // ── Actions tab wiring ────────────────────────────────────────────────────
  v('et-act-text').addEventListener('click', function () {
    if (!selectedEl) return;
    if (textEditEl === selectedEl) {
      stopTextEdit();
    } else {
      stopTextEdit();
      textEditEl = selectedEl;
      selectedEl.contentEditable = 'true';
      selectedEl.setAttribute('data-et-textedit', '1');
      selectedEl.focus();
      this.textContent = '⏹ Stop Editing Text';
    }
  });

  v('et-act-up').addEventListener('click', function () {
    if (!selectedEl) return;
    const prev = selectedEl.previousElementSibling;
    if (prev && !isAdminEl(prev)) selectedEl.parentNode.insertBefore(selectedEl, prev);
  });

  v('et-act-down').addEventListener('click', function () {
    if (!selectedEl) return;
    const next = selectedEl.nextElementSibling;
    if (next && !isAdminEl(next)) selectedEl.parentNode.insertBefore(next, selectedEl);
  });

  v('et-act-dupe').addEventListener('click', function () {
    if (!selectedEl) return;
    const clone = selectedEl.cloneNode(true);
    clone.classList.remove('et-selected', 'et-hover');
    clone.removeAttribute('data-et-textedit');
    clone.contentEditable = 'false';
    selectedEl.parentNode.insertBefore(clone, selectedEl.nextSibling);
  });

  v('et-act-del').addEventListener('click', function () {
    if (!selectedEl) return;
    if (!confirm('Delete this element? You can reload the page to undo.')) return;
    const toRemove = selectedEl;
    deselect();
    toRemove.remove();
  });

  // ── Link editing wiring ─────────────────────────────────────────────────
  function getAnchor(el) {
    if (!el) return null;
    if (el.tagName === 'A') return el;
    const parent = el.closest('a');
    if (parent) return parent;
    return el.querySelector('a');
  }

  v('et-link-href').addEventListener('input', function () {
    const anchor = selectedEl ? getAnchor(selectedEl) : null;
    if (anchor) {
      anchor.setAttribute('href', this.value);
      v('et-link-page').value = '';
    }
  });

  v('et-link-page').addEventListener('change', function () {
    if (!this.value) return;
    const anchor = selectedEl ? getAnchor(selectedEl) : null;
    if (anchor) {
      anchor.setAttribute('href', this.value);
      v('et-link-href').value = this.value;
    }
  });

  v('et-tgt-self').addEventListener('click', function () {
    const anchor = selectedEl ? getAnchor(selectedEl) : null;
    if (anchor) {
      anchor.removeAttribute('target');
      this.classList.add('active');
      v('et-tgt-blank').classList.remove('active');
    }
  });

  v('et-tgt-blank').addEventListener('click', function () {
    const anchor = selectedEl ? getAnchor(selectedEl) : null;
    if (anchor) {
      anchor.setAttribute('target', '_blank');
      this.classList.add('active');
      v('et-tgt-self').classList.remove('active');
    }
  });

  // ── Add button wiring ─────────────────────────────────────────────────────
  v('et-act-add-btn').addEventListener('click', function () {
    const form = v('et-add-btn-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  v('et-new-btn-insert').addEventListener('click', function () {
    if (!selectedEl) return;
    const text  = v('et-new-btn-text').value.trim() || 'New Button';
    const href  = v('et-new-btn-page').value || '#';
    const style = v('et-new-btn-style').value || 'btn-primary';

    const btn = document.createElement('a');
    btn.href = href;
    btn.className = style;
    btn.textContent = text;

    selectedEl.parentNode.insertBefore(btn, selectedEl.nextSibling);

    v('et-add-btn-form').style.display = 'none';
    v('et-new-btn-text').value = 'New Button';
    v('et-new-btn-page').value = '#';

    select(btn);
  });

  // ── "+" insert points between sections ──────────────────────────────────
  function createInsertPoints() {
    removeInsertPoints();
    var children = Array.from(document.body.children).filter(function (el) {
      var tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return false;
      if (el.id === 'et-admin-bar' || el.id === 'et-panel' || el.id === 'et-float-bar' ||
          el.id === 'et-add-menu' || el.id === 'et-am-file') return false;
      if (el.classList.contains('et-insert-point')) return false;
      return true;
    });
    for (var i = 1; i < children.length; i++) {
      var next = children[i];
      var point = document.createElement('div');
      point.className = 'et-insert-point';
      point.innerHTML = '<span class="et-insert-plus">+</span>';
      (function (ref, par) {
        point.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          openAddMenu(this, ref, par);
        });
      })(next, next.parentNode);
      document.body.insertBefore(point, next);
    }
  }

  function removeInsertPoints() {
    document.querySelectorAll('.et-insert-point').forEach(function (el) { el.remove(); });
  }

  // ── Add menu ──────────────────────────────────────────────────────────────
  function openAddMenu(triggerEl, insertBeforeEl, parentEl) {
    addMenuInsertRef = insertBeforeEl;
    addMenuParent = parentEl;
    var rect = triggerEl.getBoundingClientRect();
    var top = rect.bottom + window.scrollY + 4;
    var left = rect.left + window.scrollX + rect.width / 2 - 85;
    if (left < 8) left = 8;
    if (left + 170 > window.innerWidth) left = window.innerWidth - 178;
    addMenu.style.top = top + 'px';
    addMenu.style.left = left + 'px';
    addMenu.style.display = 'flex';
  }

  function hideAddMenu() {
    addMenu.style.display = 'none';
    addMenuInsertRef = null;
    addMenuParent = null;
  }

  addMenu.querySelectorAll('button[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var type = this.dataset.add;
      var parent = addMenuParent || (selectedEl ? selectedEl.parentNode : document.body);
      var ref = addMenuInsertRef || (selectedEl ? selectedEl.nextSibling : null);
      hideAddMenu();

      if (type === 'image') {
        addMenuInsertRef = ref;
        addMenuParent = parent;
        addMenuFileInput.click();
        return;
      }

      var newEl = createAddedElement(type);
      parent.insertBefore(newEl, ref);
      removeInsertPoints();
      createInsertPoints();
      select(newEl);

      if (type === 'h2' || type === 'p') {
        stopTextEdit();
        textEditEl = newEl;
        newEl.contentEditable = 'true';
        newEl.setAttribute('data-et-textedit', '1');
        newEl.focus();
      }
      if (type === 'button') {
        panelVisible = true;
        panel.style.display = 'flex';
        populatePanel(newEl);
        panel.querySelector('.et-tab[data-tab="actions"]').click();
      }
    });
  });

  function createAddedElement(type) {
    var el;
    if (type === 'h2') {
      el = document.createElement('h2');
      el.textContent = 'New Heading';
      el.style.fontFamily = "'Playfair Display', serif";
      el.style.fontSize = '2rem';
      el.style.fontWeight = '700';
      el.style.padding = '20px 80px';
    } else if (type === 'p') {
      el = document.createElement('p');
      el.textContent = 'New paragraph — double-click to edit.';
      el.style.fontSize = '1rem';
      el.style.lineHeight = '1.7';
      el.style.padding = '10px 80px';
    } else if (type === 'button') {
      el = document.createElement('a');
      el.href = '#';
      el.className = 'btn-primary';
      el.textContent = 'New Button';
      el.style.display = 'inline-block';
      el.style.margin = '10px 80px';
    } else if (type === 'hr') {
      el = document.createElement('hr');
      el.style.border = 'none';
      el.style.borderTop = '1px solid #d8d3c8';
      el.style.margin = '40px 80px';
    }
    return el;
  }

  // Handle image insertion from add menu
  addMenuFileInput.addEventListener('change', async function () {
    if (!this.files.length) return;
    var parent = addMenuParent || document.body;
    var ref = addMenuInsertRef;
    addMenuInsertRef = null;
    addMenuParent = null;
    setStatus('Uploading image…');
    try {
      var filePath = await uploadImageToGitHub(this.files[0]);
      var img = document.createElement('img');
      img.src = filePath;
      img.alt = '';
      img.style.width = '100%';
      img.style.maxWidth = '600px';
      img.style.display = 'block';
      img.style.margin = '20px auto';
      parent.insertBefore(img, ref);
      removeInsertPoints();
      createInsertPoints();
      select(img);
      setStatus('Image added ✓', 3000);
    } catch (e) {
      setStatus('Error: ' + e.message, 5000);
    }
    this.value = '';
  });

  // ── Floating toolbar wiring ───────────────────────────────────────────────
  v('et-fb-text').addEventListener('click', function () {
    if (!selectedEl) return;
    if (textEditEl === selectedEl) {
      stopTextEdit();
      this.classList.remove('et-fb-active');
    } else {
      stopTextEdit();
      textEditEl = selectedEl;
      selectedEl.contentEditable = 'true';
      selectedEl.setAttribute('data-et-textedit', '1');
      selectedEl.focus();
      this.classList.add('et-fb-active');
    }
  });

  v('et-fb-add').addEventListener('click', function () {
    if (!selectedEl) return;
    addMenuInsertRef = selectedEl.nextSibling;
    addMenuParent = selectedEl.parentNode;
    openAddMenu(this, addMenuInsertRef, addMenuParent);
  });

  v('et-fb-dupe').addEventListener('click', function () {
    if (!selectedEl) return;
    var clone = selectedEl.cloneNode(true);
    clone.classList.remove('et-selected', 'et-hover');
    clone.removeAttribute('data-et-textedit');
    clone.contentEditable = 'false';
    selectedEl.parentNode.insertBefore(clone, selectedEl.nextSibling);
    removeInsertPoints();
    createInsertPoints();
  });

  v('et-fb-del').addEventListener('click', function () {
    if (!selectedEl) return;
    if (!confirm('Delete this element?')) return;
    var toRemove = selectedEl;
    deselect();
    toRemove.remove();
    removeInsertPoints();
    createInsertPoints();
  });

  v('et-fb-panel').addEventListener('click', function () {
    panelVisible = !panelVisible;
    if (panelVisible && selectedEl) {
      panel.style.display = 'flex';
      populatePanel(selectedEl);
      this.classList.add('et-fb-active');
    } else {
      panel.style.display = 'none';
      this.classList.remove('et-fb-active');
    }
  });

  // ── Hyperlink popover wiring ──────────────────────────────────────────────
  function getSelectionRange() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) return sel.getRangeAt(0);
    return null;
  }

  function restoreSavedRange() {
    if (!savedRange) return;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function getExistingLinkFromSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    var node = sel.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.tagName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }

  function hideLinkPopover() {
    linkPopover.style.display = 'none';
    savedRange = null;
  }

  v('et-fb-link').addEventListener('click', function () {
    if (!selectedEl || !textEditEl) {
      if (!selectedEl) return;
      stopTextEdit();
      textEditEl = selectedEl;
      selectedEl.contentEditable = 'true';
      selectedEl.setAttribute('data-et-textedit', '1');
      selectedEl.focus();
    }

    var range = getSelectionRange();
    var existingLink = getExistingLinkFromSelection();

    if (range) savedRange = range.cloneRange();

    var urlInput = v('et-lp-url');
    var removeBtn = v('et-lp-remove');

    if (existingLink) {
      urlInput.value = existingLink.getAttribute('href') || '';
      removeBtn.style.display = 'inline-block';
    } else {
      urlInput.value = '';
      removeBtn.style.display = 'none';
    }

    var rect = floatBar.getBoundingClientRect();
    linkPopover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    linkPopover.style.left = (rect.left + window.scrollX) + 'px';
    var maxLeft = window.innerWidth - 340;
    if (parseInt(linkPopover.style.left) > maxLeft) linkPopover.style.left = maxLeft + 'px';
    if (parseInt(linkPopover.style.left) < 4) linkPopover.style.left = '4px';
    linkPopover.style.display = 'block';

    setTimeout(function () { urlInput.focus(); }, 50);
  });

  v('et-lp-apply').addEventListener('click', function () {
    var url = v('et-lp-url').value.trim();
    if (!url) { hideLinkPopover(); return; }

    restoreSavedRange();
    var sel = window.getSelection();

    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      var range = sel.getRangeAt(0);
      var existingLink = getExistingLinkFromSelection();

      if (existingLink) {
        existingLink.setAttribute('href', url);
      } else {
        var a = document.createElement('a');
        a.href = url;
        a.style.color = '';
        a.target = '_blank';
        range.surroundContents(a);
      }
    } else {
      var existingLink = getExistingLinkFromSelection();
      if (existingLink) {
        existingLink.setAttribute('href', url);
      }
    }

    hideLinkPopover();
  });

  v('et-lp-remove').addEventListener('click', function () {
    restoreSavedRange();
    var link = getExistingLinkFromSelection();
    if (link) {
      var parent = link.parentNode;
      while (link.firstChild) parent.insertBefore(link.firstChild, link);
      parent.removeChild(link);
    }
    hideLinkPopover();
  });

  v('et-lp-cancel').addEventListener('click', function () {
    hideLinkPopover();
  });

  v('et-lp-url').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); v('et-lp-apply').click(); }
    if (e.key === 'Escape') { e.preventDefault(); hideLinkPopover(); }
  });

  // ── Image helpers ──────────────────────────────────────────────────────────
  function getImage(el) {
    if (!el) return null;
    if (el.tagName === 'IMG') return el;
    return el.querySelector('img');
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result.split(',')[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getGhConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch (e) { return {}; }
  }

  async function uploadImageToGitHub(file) {
    var cfg = getGhConfig();
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      throw new Error('GitHub not configured. Open admin.html → Settings.');
    }
    var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    var filePath = 'images/' + Date.now() + '-' + safeName;
    var base64   = await fileToBase64(file);
    var branch   = cfg.branch || 'main';
    var apiUrl   = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + filePath;
    var headers  = {
      'Authorization': 'token ' + cfg.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    var res = await fetch(apiUrl, {
      method: 'PUT', headers: headers,
      body: JSON.stringify({
        message: 'Upload image ' + safeName + ' via ET admin',
        content: base64,
        branch: branch
      })
    });
    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.message || res.status);
    }
    return filePath;
  }

  // ── Existing image editing wiring ─────────────────────────────────────────
  v('et-img-alt').addEventListener('input', function () {
    var img = selectedEl ? getImage(selectedEl) : null;
    if (img) img.setAttribute('alt', this.value);
  });

  v('et-img-width').addEventListener('input', function () {
    var img = selectedEl ? getImage(selectedEl) : null;
    if (img) img.style.width = this.value;
  });

  v('et-img-replace-btn').addEventListener('click', function () {
    v('et-img-replace-file').click();
  });

  v('et-img-replace-file').addEventListener('change', async function () {
    if (!this.files.length) return;
    var img = selectedEl ? getImage(selectedEl) : null;
    if (!img) return;
    var statusEl = v('et-img-replace-status');
    statusEl.textContent = 'Uploading…';
    try {
      var filePath = await uploadImageToGitHub(this.files[0]);
      img.src = filePath;
      v('et-img-src').value = filePath;
      statusEl.textContent = 'Replaced ✓';
      setTimeout(function () { statusEl.textContent = ''; }, 3000);
    } catch (e) {
      statusEl.textContent = 'Error: ' + e.message;
    }
    this.value = '';
  });

  // ── Add image wiring ──────────────────────────────────────────────────────
  var imgPlaceholder = null;

  function removeImgPlaceholder() {
    if (imgPlaceholder && imgPlaceholder.parentNode) {
      imgPlaceholder.parentNode.removeChild(imgPlaceholder);
    }
    imgPlaceholder = null;
  }

  v('et-act-add-img').addEventListener('click', function () {
    v('et-panel-img-file').click();
  });

  v('et-panel-img-file').addEventListener('change', async function () {
    if (!this.files.length) return;
    var statusMsg = v('et-panel-img-status');
    var insertAfter = selectedEl;

    removeImgPlaceholder();
    imgPlaceholder = document.createElement('div');
    imgPlaceholder.className = 'et-img-placeholder';
    imgPlaceholder.textContent = '⬆ Uploading image…';
    if (insertAfter) {
      insertAfter.parentNode.insertBefore(imgPlaceholder, insertAfter.nextSibling);
    } else {
      (document.querySelector('.page-content') || document.querySelector('main') || document.body).appendChild(imgPlaceholder);
    }
    imgPlaceholder.scrollIntoView({ behavior: 'smooth', block: 'center' });

    statusMsg.textContent = 'Uploading…';
    try {
      var filePath = await uploadImageToGitHub(this.files[0]);
      var img = document.createElement('img');
      img.src = filePath;
      img.alt = '';
      img.style.width = '100%';
      img.style.maxWidth = '600px';
      img.style.display = 'block';
      img.style.margin = '20px auto';

      if (imgPlaceholder && imgPlaceholder.parentNode) {
        imgPlaceholder.parentNode.replaceChild(img, imgPlaceholder);
        imgPlaceholder = null;
      }

      statusMsg.textContent = 'Added ✓  Use Move Up/Down to reposition';
      setTimeout(function () { statusMsg.textContent = ''; }, 4000);
      select(img);
    } catch (e) {
      statusMsg.textContent = 'Error: ' + e.message;
      removeImgPlaceholder();
    }
    this.value = '';
  });

  // ── Save to GitHub ────────────────────────────────────────────────────────
  btnSave.addEventListener('click', async function () {
    let cfg;
    try { cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch (e) { cfg = {}; }
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      alert('GitHub not configured. Open admin.html → Settings.');
      return;
    }

    setStatus('Saving…');

    // Clean transient state before snapshot
    stopTextEdit();
    deselect();
    document.querySelectorAll('.et-hover, .et-selected').forEach(el => {
      el.classList.remove('et-hover', 'et-selected');
    });
    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
    });
    document.querySelectorAll('[data-et-textedit]').forEach(el => {
      el.removeAttribute('data-et-textedit');
    });

    // Remove admin elements so they don't appear in saved HTML
    removeInsertPoints();
    hideLinkPopover();
    document.querySelectorAll('.et-img-placeholder').forEach(el => el.remove());
    imgPlaceholder = null;
    bar.remove();
    panel.remove();
    floatBar.remove();
    linkPopover.remove();
    addMenu.remove();
    addMenuFileInput.remove();
    adminStyle.remove();

    const pagePath = window.location.pathname.split('/').pop() || 'index.html';
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    // Re-inject admin elements
    document.head.appendChild(adminStyle);
    document.body.appendChild(bar);
    document.body.appendChild(panel);
    document.body.appendChild(floatBar);
    document.body.appendChild(linkPopover);
    document.body.appendChild(addMenu);
    document.body.appendChild(addMenuFileInput);
    if (editMode) createInsertPoints();

    const branch  = cfg.branch || 'main';
    const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${pagePath}`;
    const headers = {
      'Authorization': `token ${cfg.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    const encoded = btoa(unescape(encodeURIComponent(html)));

    async function attemptSave(retries) {
      const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers, cache: 'no-store' });
      if (!getRes.ok) throw new Error(`Could not fetch file: ${getRes.status}`);
      const fileData = await getRes.json();
      const putRes = await fetch(apiBase, {
        method: 'PUT', headers,
        body: JSON.stringify({
          message: `Update ${pagePath} via ET admin`,
          content: encoded,
          sha: fileData.sha,
          branch
        })
      });
      if (putRes.ok) return true;
      if (putRes.status === 409 && retries > 0) {
        setStatus('Conflict — retrying…');
        await new Promise(r => setTimeout(r, 1500));
        return attemptSave(retries - 1);
      }
      const err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }

    try {
      await attemptSave(3);
      setStatus('Saved ✓', 4000);
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

  // ── Nav Editor ──────────────────────────────────────────────────────────────
  var SITE_PAGES = [
    { value: 'index.html', label: 'Home' },
    { value: 'our-mission.html', label: 'Our Mission' },
    { value: 'our-team.html', label: 'Our Team' },
    { value: 'join.html', label: 'Join' },
    { value: 'emerging-leaders.html', label: 'Emerging Leaders' },
    { value: 'virtual-visits.html', label: 'Virtual Visits' },
    { value: 'podcast.html', label: 'Podcast' },
    { value: 'resource-hub.html', label: 'Resource Hub' },
    { value: 'career-pathways.html', label: 'Career Pathways' },
    { value: 'general-resources.html', label: 'General Resources' },
    { value: 'recruitment-prep.html', label: 'Recruitment Prep' },
    { value: 'energy-verticals.html', label: 'Energy Verticals' },
    { value: 'energy-terminal.html', label: 'Energy Terminal' }
  ];

  var NAV_SYNC_PAGES = [
    'index.html', 'our-mission.html', 'our-team.html', 'join.html',
    'emerging-leaders.html', 'virtual-visits.html', 'podcast.html',
    'resource-hub.html', 'career-pathways.html', 'general-resources.html',
    'recruitment-prep.html', 'energy-verticals.html', 'energy-terminal.html'
  ];

  var navModal = document.createElement('div');
  navModal.id = 'et-nav-modal';
  navModal.innerHTML = '<div class="et-nm-inner">' +
    '<div class="et-nm-head"><h2>Navigation Editor</h2>' +
    '<button class="et-nm-close" title="Close">×</button></div>' +
    '<div class="et-nm-body"></div></div>';
  document.body.appendChild(navModal);

  navModal.addEventListener('click', function (e) {
    if (e.target === navModal) navModal.classList.remove('open');
  });
  navModal.querySelector('.et-nm-close').addEventListener('click', function () {
    navModal.classList.remove('open');
  });

  document.getElementById('et-btn-nav').addEventListener('click', function () {
    var data = parseNavData();
    navModal.querySelector('.et-nm-body').innerHTML = renderNavEditor(data);
    navModal.classList.add('open');
    wireNavEditorEvents();
  });

  function escNav(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escNavAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseNavData() {
    var data = { categories: [], cta: { label: 'Join ET', href: 'join.html' } };
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return data;

    navLinks.querySelectorAll(':scope > li').forEach(function (li) {
      var anchor = li.querySelector(':scope > a');
      if (!anchor) return;

      if (anchor.classList.contains('nav-cta')) {
        data.cta = { label: anchor.textContent.trim(), href: anchor.getAttribute('href') || 'join.html' };
        return;
      }

      var dropMenu = li.querySelector('.dropdown-menu');
      if (!dropMenu) return;

      var catName = '';
      for (var i = 0; i < anchor.childNodes.length; i++) {
        if (anchor.childNodes[i].nodeType === 3) catName += anchor.childNodes[i].textContent;
      }
      catName = catName.trim();

      var sectionLabel = '';
      var sl = dropMenu.querySelector('.dropdown-section-label');
      if (sl) sectionLabel = sl.textContent.trim();

      var items = [];
      dropMenu.querySelectorAll('a').forEach(function (a) {
        var iconEl = a.querySelector('.d-icon');
        var strongEl = a.querySelector('strong');
        var descEl = a.querySelector('.d-desc');
        items.push({
          icon: iconEl ? iconEl.textContent.trim() : '',
          label: strongEl ? strongEl.textContent.trim() : a.textContent.trim(),
          desc: descEl ? descEl.textContent.trim() : '',
          href: a.getAttribute('href') || '#'
        });
      });

      data.categories.push({ name: catName, sectionLabel: sectionLabel, items: items });
    });

    return data;
  }

  function buildPageOptions(selected) {
    var html = '<option value=""' + (!selected ? ' selected' : '') + '>Custom URL</option>';
    SITE_PAGES.forEach(function (p) {
      html += '<option value="' + escNavAttr(p.value) + '"' +
        (selected === p.value ? ' selected' : '') + '>' + escNav(p.label) + '</option>';
    });
    return html;
  }

  function renderNavItemHTML(item) {
    var isKnown = SITE_PAGES.some(function (p) { return p.value === item.href; });
    var h = '<div class="et-nm-item">';
    h += '<div class="et-nm-item-row">';
    h += '<input type="text" class="et-nm-icon-in" value="' + escNavAttr(item.icon) + '" placeholder="🎯" style="width:36px;text-align:center;"/>';
    h += '<input type="text" class="et-nm-label-in" value="' + escNavAttr(item.label) + '" placeholder="Link name" style="flex:1;"/>';
    h += '<div class="et-nm-item-btns">';
    h += '<button class="et-nib-up" title="Move up">↑</button>';
    h += '<button class="et-nib-down" title="Move down">↓</button>';
    h += '<button class="et-nib-del" title="Remove">✕</button>';
    h += '</div></div>';
    h += '<div class="et-nm-item-row">';
    h += '<input type="text" class="et-nm-desc-in" value="' + escNavAttr(item.desc) + '" placeholder="Short description" style="flex:1;"/>';
    h += '</div>';
    h += '<div class="et-nm-item-row">';
    h += '<select class="et-nm-link-sel" style="flex:1;">' + buildPageOptions(isKnown ? item.href : '') + '</select>';
    h += '<input type="text" class="et-nm-link-custom" value="' + escNavAttr(item.href) + '" placeholder="https://..." style="flex:1;' + (isKnown ? 'display:none;' : '') + '"/>';
    h += '</div></div>';
    return h;
  }

  function renderNavEditor(data) {
    var html = '';

    data.categories.forEach(function (cat) {
      html += '<div class="et-nm-cat">';
      html += '<div class="et-nm-cat-head">';
      html += '<span class="et-nm-lbl">Menu</span>';
      html += '<input type="text" class="et-nm-cat-name" value="' + escNavAttr(cat.name) + '" style="flex:1;"/>';
      html += '<span class="et-nm-lbl">Label</span>';
      html += '<input type="text" class="et-nm-sec-label" value="' + escNavAttr(cat.sectionLabel) + '" style="width:100px;"/>';
      html += '<button class="et-nm-cat-del" title="Remove menu">✕</button>';
      html += '</div>';
      html += '<div class="et-nm-items">';
      cat.items.forEach(function (item) { html += renderNavItemHTML(item); });
      html += '</div>';
      html += '<div class="et-nm-add-item"><button class="et-nm-add-link">+ Add Link</button></div>';
      html += '</div>';
    });

    html += '<div class="et-nm-add-cat"><button class="et-nm-add-menu">+ Add Menu</button></div>';

    html += '<div class="et-nm-cta">';
    html += '<span class="et-nm-lbl">CTA Button</span>';
    html += '<div class="et-nm-cta-row">';
    html += '<input type="text" class="et-nm-cta-text" value="' + escNavAttr(data.cta.label) + '" placeholder="Button text"/>';
    html += '<input type="text" class="et-nm-cta-href" value="' + escNavAttr(data.cta.href) + '" placeholder="Link"/>';
    html += '</div></div>';

    html += '<button id="et-nav-save">Save Nav to All Pages</button>';
    html += '<div id="et-nav-status"></div>';

    return html;
  }

  function wireNavEditorEvents() {
    var body = navModal.querySelector('.et-nm-body');

    body.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;

      if (btn.id === 'et-nav-save') { saveNavToAllPages(); return; }

      if (btn.classList.contains('et-nm-cat-del')) {
        var cat = btn.closest('.et-nm-cat');
        if (cat && confirm('Remove this menu?')) cat.remove();
      }
      else if (btn.classList.contains('et-nib-del')) {
        var item = btn.closest('.et-nm-item');
        if (item) item.remove();
      }
      else if (btn.classList.contains('et-nib-up')) {
        var item = btn.closest('.et-nm-item');
        var prev = item ? item.previousElementSibling : null;
        if (prev && prev.classList.contains('et-nm-item'))
          item.parentNode.insertBefore(item, prev);
      }
      else if (btn.classList.contains('et-nib-down')) {
        var item = btn.closest('.et-nm-item');
        var next = item ? item.nextElementSibling : null;
        if (next && next.classList.contains('et-nm-item'))
          item.parentNode.insertBefore(next, item);
      }
      else if (btn.classList.contains('et-nm-add-link')) {
        var items = btn.closest('.et-nm-cat').querySelector('.et-nm-items');
        var tmp = document.createElement('div');
        tmp.innerHTML = renderNavItemHTML({ icon: '', label: '', desc: '', href: '' });
        items.appendChild(tmp.firstChild);
      }
      else if (btn.classList.contains('et-nm-add-menu')) {
        var addBtn = btn.closest('.et-nm-add-cat');
        var catHTML = '<div class="et-nm-cat">';
        catHTML += '<div class="et-nm-cat-head">';
        catHTML += '<span class="et-nm-lbl">Menu</span>';
        catHTML += '<input type="text" class="et-nm-cat-name" value="" placeholder="Menu name" style="flex:1;"/>';
        catHTML += '<span class="et-nm-lbl">Label</span>';
        catHTML += '<input type="text" class="et-nm-sec-label" value="" placeholder="Section label" style="width:100px;"/>';
        catHTML += '<button class="et-nm-cat-del" title="Remove menu">✕</button>';
        catHTML += '</div>';
        catHTML += '<div class="et-nm-items">';
        catHTML += renderNavItemHTML({ icon: '', label: '', desc: '', href: '' });
        catHTML += '</div>';
        catHTML += '<div class="et-nm-add-item"><button class="et-nm-add-link">+ Add Link</button></div>';
        catHTML += '</div>';
        var tmp = document.createElement('div');
        tmp.innerHTML = catHTML;
        addBtn.parentNode.insertBefore(tmp.firstChild, addBtn);
      }
    });

    body.addEventListener('change', function (e) {
      if (e.target.classList.contains('et-nm-link-sel')) {
        var row = e.target.closest('.et-nm-item-row');
        var custom = row.querySelector('.et-nm-link-custom');
        if (e.target.value) {
          custom.style.display = 'none';
          custom.value = e.target.value;
        } else {
          custom.style.display = '';
          custom.value = '';
          custom.focus();
        }
      }
    });
  }

  function collectNavData() {
    var body = navModal.querySelector('.et-nm-body');
    var data = { categories: [], cta: { label: 'Join ET', href: 'join.html' } };

    body.querySelectorAll('.et-nm-cat').forEach(function (catEl) {
      var name = catEl.querySelector('.et-nm-cat-name').value.trim();
      var sectionLabel = catEl.querySelector('.et-nm-sec-label').value.trim();
      var items = [];

      catEl.querySelectorAll('.et-nm-item').forEach(function (itemEl) {
        var icon = itemEl.querySelector('.et-nm-icon-in').value.trim();
        var label = itemEl.querySelector('.et-nm-label-in').value.trim();
        var desc = itemEl.querySelector('.et-nm-desc-in').value.trim();
        var sel = itemEl.querySelector('.et-nm-link-sel');
        var custom = itemEl.querySelector('.et-nm-link-custom');
        var href = sel.value || custom.value.trim() || '#';
        if (label) items.push({ icon: icon, label: label, desc: desc, href: href });
      });

      if (name && items.length) data.categories.push({ name: name, sectionLabel: sectionLabel, items: items });
    });

    var ctaText = body.querySelector('.et-nm-cta-text');
    var ctaHref = body.querySelector('.et-nm-cta-href');
    if (ctaText) data.cta.label = ctaText.value.trim() || 'Join ET';
    if (ctaHref) data.cta.href = ctaHref.value.trim() || 'join.html';

    return data;
  }

  function buildNavHTML(data) {
    var h = '<nav>\n';
    h += '  <a href="index.html" class="nav-logo-text">Energy Terminal</a>\n';
    h += '  <ul class="nav-links">\n';

    data.categories.forEach(function (cat) {
      h += '    <li class="dropdown">\n';
      h += '      <a href="#">' + escNav(cat.name) + ' <span class="chevron">▾</span></a>\n';
      h += '      <div class="dropdown-menu">\n';
      h += '        <div class="dropdown-section-label">' + escNav(cat.sectionLabel) + '</div>\n';
      cat.items.forEach(function (item) {
        h += '        <a href="' + escNavAttr(item.href) + '"><span class="d-icon">' + item.icon + '</span><span><strong>' + escNav(item.label) + '</strong><span class="d-desc">' + escNav(item.desc) + '</span></span></a>\n';
      });
      h += '      </div>\n';
      h += '    </li>\n';
    });

    h += '    <li><a href="' + escNavAttr(data.cta.href) + '" class="nav-cta">' + escNav(data.cta.label) + '</a></li>\n';
    h += '  </ul>\n';
    h += '  <div class="hamburger"><span></span><span></span><span></span></div>\n';
    h += '</nav>';

    return h;
  }

  async function saveNavToAllPages() {
    var cfg = getGhConfig();
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      alert('GitHub not configured. Open admin.html → Settings.');
      return;
    }

    var saveBtn = document.getElementById('et-nav-save');
    var navStatus = document.getElementById('et-nav-status');
    saveBtn.disabled = true;

    var data = collectNavData();
    var newNavHTML = buildNavHTML(data);
    var branch = cfg.branch || 'main';
    var headers = {
      'Authorization': 'token ' + cfg.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    var total = NAV_SYNC_PAGES.length;
    var done = 0;
    var errors = [];

    for (var i = 0; i < NAV_SYNC_PAGES.length; i++) {
      var page = NAV_SYNC_PAGES[i];
      navStatus.textContent = 'Updating ' + page + ' (' + (i + 1) + '/' + total + ')...';

      try {
        var apiUrl = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + page;
        var getRes = await fetch(apiUrl + '?ref=' + branch, { headers: headers, cache: 'no-store' });
        if (!getRes.ok) { errors.push(page + ': fetch failed'); continue; }
        var fileData = await getRes.json();

        var raw = fileData.content.replace(/\n/g, '');
        var content = decodeURIComponent(escape(atob(raw)));

        // Replace first <nav>...</nav>
        var replaced = false;
        content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/, function () {
          if (replaced) return arguments[0];
          replaced = true;
          return newNavHTML;
        });

        // Strip serialized mobile nav artifacts from admin saves
        content = content.replace(/<div class="mob-overlay"[^>]*><\/div>/g, '');
        content = content.replace(/<nav class="mob-nav"[\s\S]*?<\/nav>/g, '');

        var encoded = btoa(unescape(encodeURIComponent(content)));

        var putRes = await fetch(apiUrl, {
          method: 'PUT', headers: headers,
          body: JSON.stringify({
            message: 'Update nav in ' + page + ' via ET admin',
            content: encoded,
            sha: fileData.sha,
            branch: branch
          })
        });

        if (!putRes.ok) {
          var err = await putRes.json();
          errors.push(page + ': ' + (err.message || putRes.status));
        } else {
          done++;
        }

        if (i < NAV_SYNC_PAGES.length - 1) {
          await new Promise(function (r) { setTimeout(r, 350); });
        }
      } catch (e) {
        errors.push(page + ': ' + e.message);
      }
    }

    saveBtn.disabled = false;

    if (errors.length === 0) {
      navStatus.textContent = 'Nav updated on all ' + done + ' pages! Reloading...';
      setTimeout(function () { location.reload(); }, 1500);
    } else {
      navStatus.textContent = done + '/' + total + ' updated. Errors: ' + errors.join('; ');
    }
  }
})();
