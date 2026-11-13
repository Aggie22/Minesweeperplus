/* Minesweeper+ UI: modes, input, timers, texture picker. */
(() => {
  'use strict';

  const { Game, HIDDEN, OPEN, FLAG, DETONATED } = window.MS;
  const { THEMES, byId, applyVars, customVars } = window.MSThemes;
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('msp:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('msp:' + k, JSON.stringify(v)); return true; }
      catch { return false; }
    },
  };

  const DIFFS = {
    beginner: { w: 9, h: 9, m: 10 },
    intermediate: { w: 16, h: 16, m: 40 },
    expert: { w: 30, h: 16, m: 99 },
  };

  const MODE_INFO = {
    normal: 'Normal — clear every safe tile as fast as you can. One mine ends the game.',
    zen: 'Zen — no clock and no game over. A mine is just a slip; keep going at your own pace.',
    trial: 'Time Trial — beat the countdown. Each board you clear banks your leftover time plus a bonus for the next one.',
  };

  const settings = Object.assign(
    { mode: 'normal', diff: 'beginner', custom: { w: 12, h: 12, m: 24 }, theme: 'classic' },
    store.get('settings', {})
  );
  if (!MODE_INFO[settings.mode]) settings.mode = 'normal';
  if (settings.diff !== 'custom' && !DIFFS[settings.diff]) settings.diff = 'beginner';
  const custom = Object.assign({ base: 'classic', images: {} }, store.get('customTheme', {}));
  const records = store.get('records', {});
  const saveSettings = () => store.set('settings', settings);

  const boardEl = $('#board'), statusEl = $('#status'), nextBtn = $('#nextBtn');
  const faceEl = $('#face'), clockEl = $('#clock'), minesEl = $('#minesLeft');

  let game, cells = [];
  let over = false;        // board finished (won or lost)
  let pendingNext = false; // time trial: board cleared, run continues
  let slips = 0;           // zen
  let flagMode = false;
  const clock = { running: false, t0: 0, acc: 0 };
  const trial = { bank: 0, streak: 0 };

  /* ---------- clock ---------- */

  const elapsed = () => clock.acc + (clock.running ? (performance.now() - clock.t0) / 1000 : 0);
  const startClock = () => { if (!clock.running) { clock.running = true; clock.t0 = performance.now(); } };
  const stopClock = () => { clock.acc = elapsed(); clock.running = false; };
  const timeLeft = () => trial.bank - elapsed();

  const mmss = (t) => {
    const s = Math.max(0, Math.ceil(t));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  function paintClock() {
    if (settings.mode === 'zen') { clockEl.textContent = '∞'; clockEl.classList.remove('low'); return; }
    if (settings.mode === 'trial') {
      const t = timeLeft();
      clockEl.textContent = mmss(t);
      clockEl.classList.toggle('low', clock.running && t <= 10);
      if (t <= 0 && !over) lose('time');
      return;
    }
    clockEl.classList.remove('low');
    clockEl.textContent = String(Math.min(999, Math.floor(elapsed()))).padStart(3, '0');
  }
  setInterval(() => { if (clock.running) paintClock(); }, 100);

  /* ---------- board setup ---------- */

  const dims = () => (settings.diff === 'custom' ? settings.custom : DIFFS[settings.diff]);
  const recordKey = () => { const d = dims(); return `${settings.mode}:${d.w}x${d.h}:${d.m}`; };
  const trialLimit = () => Math.max(20, game.mines * 6);
  const trialBonus = () => Math.max(10, game.mines * 3);

  function newGame(keepRun) {
    const d = dims();
    game = new Game(d.w, d.h, d.m);
    over = false;
    pendingNext = false;
    slips = 0;
    clock.running = false;
    clock.acc = 0;
    if (settings.mode === 'trial' && !keepRun) { trial.bank = trialLimit(); trial.streak = 0; }

    boardEl.style.gridTemplateColumns = `repeat(${d.w}, var(--cell))`;
    const frag = document.createDocumentFragment();
    cells = [];
    for (let i = 0; i < game.size; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.i = i;
      b.tabIndex = i === 0 ? 0 : -1;
      cells.push(b);
      frag.appendChild(b);
      paintCell(i);
    }
    boardEl.replaceChildren(frag);

    nextBtn.hidden = true;
    setFace();
    paintHud();
    paintClock();
    idleStatus();
    fit();
  }

  function fit() {
    if (!game) return;
    const cs = getComputedStyle(root);
    const gap = parseFloat(cs.getPropertyValue('--gap')) || 0;
    const pad = parseFloat(cs.getPropertyValue('--board-pad')) || 0;
    const avail = Math.min(window.innerWidth, 1400) - 32 - 24 - pad * 2;
    const c = Math.floor((avail - gap * (game.w - 1)) / game.w);
    root.style.setProperty('--cell', Math.max(24, Math.min(40, c)) + 'px');
  }
  window.addEventListener('resize', fit);

  /* ---------- painting ---------- */

  function paintCell(i, end) {
    const el = cells[i], s = game.state[i];
    const x = i % game.w, y = (i - x) / game.w;
    let cls = 'cell' + ((x + y) % 2 ? ' alt' : ''), text = '', label = 'Hidden';
    if (s === OPEN) {
      cls += ' open';
      label = 'Empty';
      if (game.adj[i]) { cls += ' n' + game.adj[i]; text = game.adj[i]; label = String(game.adj[i]); }
    } else if (s === DETONATED) {
      cls += ' open mine boom'; label = 'Mine, exploded';
    } else if (s === FLAG) {
      cls += ' flag'; label = 'Flagged';
      if (end === 'lost' && !game.mine[i]) { cls += ' wrong'; label = 'Wrong flag'; }
    } else if (end === 'lost' && game.mine[i]) {
      cls += ' open mine'; label = 'Mine';
    } else if (end === 'won' && game.mine[i]) {
      cls += ' flag'; label = 'Flagged';
    }
    el.className = cls;
    el.textContent = text;
    el.setAttribute('aria-label', label);
  }

  function paintAll(end) { for (let i = 0; i < game.size; i++) paintCell(i, end); }

  function paintHud(forceZero) {
    const n = forceZero ? 0 : game.minesLeft;
    minesEl.textContent = n < 0 ? '-' + String(-n).padStart(2, '0') : String(n).padStart(3, '0');
  }

  function setFace(f) {
    faceEl.textContent = f || (settings.mode === 'zen' ? '😌' : '🙂');
  }

  function idleStatus() {
    const best = records[recordKey()];
    if (settings.mode === 'normal') {
      statusEl.textContent = best ? `Best time on this board: ${best.toFixed(1)}s` : '';
    } else if (settings.mode === 'trial') {
      statusEl.textContent = `Streak: ${trial.streak}` + (best ? ` · Best streak: ${best}` : '');
    } else {
      statusEl.textContent = slips ? `Slips so far: ${slips}` : '';
    }
  }

  /* ---------- outcomes ---------- */

  function finish(label) {
    over = true;
    stopClock();
    nextBtn.textContent = label;
    nextBtn.hidden = false;
  }

  function lose(why) {
    const wasStreak = trial.streak;
    finish('Play again');
    paintAll('lost');
    setFace('😵');
    paintClock();
    if (settings.mode === 'trial') {
      statusEl.textContent =
        (why === 'time' ? 'Time’s up!' : 'Boom!') +
        ` Run over with ${wasStreak} board${wasStreak === 1 ? '' : 's'} cleared.`;
    } else {
      statusEl.textContent = 'Boom! That was a mine.';
    }
  }

  function win() {
    const key = recordKey();
    paintAll('won');
    paintHud(true);
    if (settings.mode === 'normal') {
      finish('Play again');
      const t = elapsed();
      const isBest = !records[key] || t < records[key];
      if (isBest) { records[key] = Math.round(t * 10) / 10; store.set('records', records); }
      setFace('😎');
      statusEl.textContent = `Cleared in ${t.toFixed(1)}s` + (isBest ? ' — new best!' : ` · Best: ${records[key].toFixed(1)}s`);
    } else if (settings.mode === 'zen') {
      finish('New board');
      setFace('🧘');
      statusEl.textContent = slips
        ? `Board cleared, with ${slips} slip${slips === 1 ? '' : 's'}. No harm done.`
        : 'Board cleared without a single slip. Lovely.';
    } else {
      const left = timeLeft(), bonus = trialBonus();
      finish('Next board');
      pendingNext = true;
      trial.streak++;
      trial.bank = left + bonus;
      clock.acc = 0; // banked time now shows as the full clock for the next board
      if (!records[key] || trial.streak > records[key]) { records[key] = trial.streak; store.set('records', records); }
      setFace('😎');
      paintClock();
      statusEl.textContent = `Cleared with ${mmss(left)} to spare, +${bonus}s bonus. Streak: ${trial.streak} · Best: ${records[key]}`;
    }
  }

  /* ---------- moves ---------- */

  function settle(res) {
    if (!res.changed.length) return;
    if (settings.mode !== 'zen') startClock();
    for (const i of res.changed) paintCell(i);
    paintHud();
    if (res.booms.length) {
      if (settings.mode !== 'zen') return lose('mine');
      slips += res.booms.length;
      setFace('😬');
      setTimeout(() => { if (!over) setFace(); }, 600);
      idleStatus();
    }
    if (game.won) win();
  }

  function dig(i) {
    if (over) return;
    if (game.state[i] === OPEN) settle(game.chord(i));
    else if (game.state[i] === HIDDEN) settle(game.reveal(i));
  }

  function flag(i) {
    if (over) return;
    if (game.state[i] === OPEN) return settle(game.chord(i));
    if (game.toggleFlag(i)) { paintCell(i); paintHud(); }
  }

  const primary = (i) => (flagMode ? flag(i) : dig(i));

  /* ---------- input ---------- */

  const indexOf = (t) => {
    const el = t.closest && t.closest('#board .cell');
    return el ? +el.dataset.i : -1;
  };

  let suppressClick = false, pressTimer = 0, pressAt = null, lastTouch = -Infinity;

  boardEl.addEventListener('click', (e) => {
    const i = indexOf(e.target);
    if (i < 0) return;
    if (suppressClick) { suppressClick = false; return; }
    primary(i);
  });

  boardEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (performance.now() - lastTouch < 1000) return; // long-press already handled it
    const i = indexOf(e.target);
    if (i >= 0) (flagMode ? dig : flag)(i);
  });

  boardEl.addEventListener('auxclick', (e) => {
    const i = indexOf(e.target);
    if (e.button === 1 && i >= 0 && !over) { e.preventDefault(); settle(game.chord(i)); }
  });

  // Long-press on touch screens does the secondary action.
  boardEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    lastTouch = performance.now();
    suppressClick = false;
    const i = indexOf(e.target);
    if (i < 0) return;
    pressAt = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      suppressClick = true;
      lastTouch = performance.now();
      if (navigator.vibrate) navigator.vibrate(15);
      (flagMode ? dig : flag)(i);
    }, 380);
  });
  const cancelPress = () => clearTimeout(pressTimer);
  boardEl.addEventListener('pointerup', cancelPress);
  boardEl.addEventListener('pointercancel', cancelPress);
  boardEl.addEventListener('pointerleave', cancelPress);
  boardEl.addEventListener('pointermove', (e) => {
    if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 10) cancelPress();
  });

  // Keyboard: arrows move, Space/Enter dig (native button click), F flags.
  boardEl.addEventListener('keydown', (e) => {
    const i = indexOf(e.target);
    if (i < 0) return;
    const x = i % game.w, y = (i - x) / game.w;
    let to = -1;
    if (e.key === 'ArrowLeft' && x > 0) to = i - 1;
    else if (e.key === 'ArrowRight' && x < game.w - 1) to = i + 1;
    else if (e.key === 'ArrowUp' && y > 0) to = i - game.w;
    else if (e.key === 'ArrowDown' && y < game.h - 1) to = i + game.w;
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); flag(i); return; }
    if (e.key.startsWith('Arrow')) e.preventDefault();
    if (to >= 0) {
      cells[i].tabIndex = -1;
      cells[to].tabIndex = 0;
      cells[to].focus();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select') || $('#themeDlg').open) return;
    if (e.key === 'n' || e.key === 'N' || e.key === 'F2') { e.preventDefault(); newGame(pendingNext); }
  });

  faceEl.addEventListener('click', () => newGame(pendingNext));
  nextBtn.addEventListener('click', () => newGame(pendingNext));

  /* ---------- mode & size controls ---------- */

  function paintControls() {
    for (const b of document.querySelectorAll('#modes button')) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
    }
    $('#modeInfo').textContent = MODE_INFO[settings.mode];
    $('#diff').value = settings.diff;
    $('#customForm').hidden = settings.diff !== 'custom';
    $('#cw').value = settings.custom.w;
    $('#ch').value = settings.custom.h;
    $('#cm').value = settings.custom.m;
  }

  $('#modes').addEventListener('click', (e) => {
    const mode = e.target.dataset && e.target.dataset.mode;
    if (!mode || mode === settings.mode) return;
    settings.mode = mode;
    saveSettings();
    paintControls();
    newGame();
  });

  $('#diff').addEventListener('change', (e) => {
    settings.diff = e.target.value;
    saveSettings();
    paintControls();
    newGame();
  });

  $('#customForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v) || lo));
    const w = clamp($('#cw').value, 5, 40), h = clamp($('#ch').value, 5, 30);
    settings.custom = { w, h, m: clamp($('#cm').value, 1, w * h - 9) };
    saveSettings();
    paintControls();
    newGame();
  });

  $('#flagMode').addEventListener('click', (e) => {
    flagMode = !flagMode;
    e.currentTarget.setAttribute('aria-pressed', String(flagMode));
  });

  /* ---------- textures ---------- */

  const SLOTS = [
    { key: 'tile', name: 'Covered tile', kind: 'tile' },
    { key: 'open', name: 'Uncovered tile', kind: 'tile' },
    { key: 'mine', name: 'Mine', kind: 'icon' },
    { key: 'flag', name: 'Flag', kind: 'icon' },
    { key: 'bg', name: 'Page background', kind: 'bg' },
  ];

  const themeVars = (id) => (id === 'custom' ? customVars(custom) : byId(id).vars);

  function applyTheme() {
    if (settings.theme !== 'custom' && byId(settings.theme).id !== settings.theme) settings.theme = 'classic';
    applyVars(root, themeVars(settings.theme));
    root.dataset.theme = settings.theme;
    fit();
  }

  // A tiny fake board showing off a pack: covered tiles, numbers, a flag and a mine.
  const SAMPLE = ['', '', 'flag', '', '', 'open n1', 'open n2', 'open', 'open n3', 'open mine boom', 'open', 'open n4'];

  function themeCard(id, name, blurb) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card';
    card.dataset.theme = id;
    card.setAttribute('aria-pressed', String(settings.theme === id));
    applyVars(card, themeVars(id));
    const mini = document.createElement('div');
    mini.className = 'board';
    mini.style.gridTemplateColumns = 'repeat(4, var(--cell))';
    SAMPLE.forEach((cls, i) => {
      const c = document.createElement('span');
      c.className = 'cell ' + cls + ((i % 4 + Math.floor(i / 4)) % 2 ? ' alt' : '');
      const n = /n(\d)/.exec(cls);
      if (n) c.textContent = n[1];
      mini.appendChild(c);
    });
    const label = document.createElement('span');
    label.className = 'label';
    label.innerHTML = '<strong></strong><small></small>';
    label.firstChild.textContent = name;
    label.lastChild.textContent = blurb;
    card.append(mini, label);
    return card;
  }

  function paintThemeGrid() {
    const grid = $('#themeGrid');
    grid.replaceChildren(
      ...THEMES.map((t) => themeCard(t.id, t.name, t.blurb)),
      themeCard('custom', 'Custom', 'Your own uploads')
    );
  }

  function paintSlots() {
    $('#slots').replaceChildren(...SLOTS.map((slot) => {
      const row = document.createElement('div');
      row.className = 'slot';
      const has = !!custom.images[slot.key];
      row.innerHTML =
        `<div class="thumb">${has ? '<img alt="">' : 'base'}</div>` +
        `<div class="name"></div>` +
        `<div class="actions">` +
        `<label class="btn">Upload<input type="file" accept="image/*" class="visually-hidden" data-slot="${slot.key}"></label>` +
        (has ? `<button type="button" class="btn" data-clear="${slot.key}">Remove</button>` : '') +
        `</div>`;
      row.querySelector('.name').textContent = slot.name;
      if (has) row.querySelector('img').src = custom.images[slot.key];
      return row;
    }));
  }

  /* Shrink uploads so they fit in localStorage: tiles are cropped square,
     icons are fitted with transparency kept, backgrounds are capped at 1600px. */
  function shrink(file, kind) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
      img.onload = () => {
        const cv = document.createElement('canvas');
        const cx = cv.getContext('2d');
        const iw = img.naturalWidth, ih = img.naturalHeight;
        if (kind === 'bg') {
          const k = Math.min(1, 1600 / Math.max(iw, ih));
          cv.width = Math.round(iw * k); cv.height = Math.round(ih * k);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
        } else {
          const S = 128;
          cv.width = cv.height = S;
          const k = (kind === 'tile' ? Math.max : Math.min)(S / iw, S / ih);
          cx.drawImage(img, (S - iw * k) / 2, (S - ih * k) / 2, iw * k, ih * k);
        }
        URL.revokeObjectURL(url);
        resolve(kind === 'bg' ? cv.toDataURL('image/jpeg', 0.82) : cv.toDataURL('image/png'));
      };
      img.src = url;
    });
  }

  function customChanged(msg) {
    const saved = store.set('customTheme', custom);
    $('#customMsg').textContent = saved
      ? msg
      : msg + ' It is applied for now, but the browser had no room to save it for next time.';
    settings.theme = 'custom';
    saveSettings();
    applyTheme();
    paintThemeGrid();
    paintSlots();
  }

  $('#slots').addEventListener('change', async (e) => {
    const key = e.target.dataset.slot, file = e.target.files && e.target.files[0];
    if (!key || !file) return;
    const slot = SLOTS.find((s) => s.key === key);
    try {
      custom.images[key] = await shrink(file, slot.kind);
      customChanged(`${slot.name} updated.`);
    } catch (err) {
      $('#customMsg').textContent = err.message;
    }
  });

  $('#slots').addEventListener('click', (e) => {
    const key = e.target.dataset.clear;
    if (!key) return;
    delete custom.images[key];
    customChanged('Image removed.');
  });

  $('#customBase').append(...THEMES.map((t) => new Option(t.name, t.id)));
  $('#customBase').value = byId(custom.base).id;
  $('#customBase').addEventListener('change', (e) => {
    custom.base = e.target.value;
    customChanged(`Custom pack now builds on ${byId(custom.base).name}.`);
  });

  $('#themeGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;
    settings.theme = card.dataset.theme;
    saveSettings();
    applyTheme();
    for (const c of document.querySelectorAll('.theme-card')) {
      c.setAttribute('aria-pressed', String(c === card));
    }
  });

  $('#themeBtn').addEventListener('click', () => {
    $('#customMsg').textContent = '';
    paintThemeGrid();
    paintSlots();
    $('#themeDlg').showModal();
  });
  $('#themeClose').addEventListener('click', () => $('#themeDlg').close());
  $('#themeDlg').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  /* ---------- go ---------- */

  applyTheme();
  paintControls();
  newGame();
})();
