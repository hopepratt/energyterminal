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
      outline: 1px dashed rgba(245,132,56,0.4) !important;
      outline-offset: 1px !important;
      cursor: pointer !important;
    }
    .et-selected {
      outline: 2px solid #f58438 !important;
      outline-offset: 1px !important;
    }
    [data-et-textedit] {
      outline: 2px solid #4caf50 !important;
      outline-offset: 1px !important;
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
  `;
  document.head.appendChild(adminStyle);

  // ── Admin bar ─────────────────────────────────────────────────────────────
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
      <hr class="et-divider"/>
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
      <hr class="et-divider"/>
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
      <hr class="et-divider"/>
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
      <hr class="et-divider"/>
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

    <!-- Actions -->
    <div class="et-tab-content" id="et-tab-actions">
      <button class="et-action-btn primary" id="et-act-text">
        <span class="et-act-icon">✏️</span> Edit Text Content
      </button>
      <hr class="et-divider"/>
      <button class="et-action-btn" id="et-act-up">
        <span class="et-act-icon">↑</span> Move Up
      </button>
      <button class="et-action-btn" id="et-act-down">
        <span class="et-act-icon">↓</span> Move Down
      </button>
      <button class="et-action-btn" id="et-act-dupe">
        <span class="et-act-icon">⧉</span> Duplicate
      </button>
      <hr class="et-divider"/>
      <button class="et-action-btn danger" id="et-act-del">
        <span class="et-act-icon">🗑</span> Delete Element
      </button>
      <p class="et-help">Tip: Press <strong>Delete</strong> key to remove selected element. Press <strong>Esc</strong> to deselect.</p>
    </div>
  `;
  document.body.appendChild(panel);

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
      document.addEventListener('keydown', onKeydown);
    } else {
      this.textContent = 'Edit Page';
      this.classList.remove('active');
      btnSave.style.display = 'none';
      stopTextEdit();
      deselect();
      document.body.removeEventListener('mouseover', onHover);
      document.body.removeEventListener('mouseout', onHoverOut);
      document.body.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeydown);
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

    if (textEditEl && !textEditEl.contains(e.target)) stopTextEdit();

    if (!e.target || e.target === document.body || e.target === document.documentElement) {
      deselect(); return;
    }
    select(e.target);
  }

  function isAdminEl(el) {
    return el.closest('#et-panel') || el.closest('#et-admin-bar');
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function select(el) {
    if (el === selectedEl) return;
    deselect();
    selectedEl = el;
    el.classList.remove('et-hover');
    el.classList.add('et-selected');

    const tag = el.tagName.toLowerCase();
    const cls = el.className
      .replace(/et-[\w-]+\s?/g, '').trim().split(/\s+/).slice(0, 2)
      .filter(Boolean).map(c => '.' + c).join('');
    document.getElementById('et-panel-el-tag').textContent = tag + cls;

    panel.style.display = 'flex';
    populatePanel(el);
    document.getElementById('et-act-text').textContent = '✏️ Edit Text Content';
  }

  function deselect() {
    if (selectedEl) {
      selectedEl.classList.remove('et-selected');
      selectedEl = null;
    }
    panel.style.display = 'none';
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
    bar.remove();
    panel.remove();
    adminStyle.remove();

    const pagePath = window.location.pathname.split('/').pop() || 'index.html';
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    // Re-inject admin elements
    document.head.appendChild(adminStyle);
    document.body.appendChild(bar);
    document.body.appendChild(panel);

    const branch  = cfg.branch || 'main';
    const apiBase = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${pagePath}`;
    const headers = {
      'Authorization': `token ${cfg.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    try {
      const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
      if (!getRes.ok) throw new Error(`Could not fetch file: ${getRes.status}`);
      const fileData = await getRes.json();
      const encoded  = btoa(unescape(encodeURIComponent(html)));
      const putRes   = await fetch(apiBase, {
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
