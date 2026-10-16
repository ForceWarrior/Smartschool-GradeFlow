;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const DIFFICULTIES = [
    { id: 'beginner',     label: () => _GameText('game_beginner'),     cols: 9,  rows: 9,  mines: 10, cell: 36 },
    { id: 'intermediate', label: () => _GameText('game_intermediate'), cols: 12, rows: 10, mines: 20, cell: 32 },
    { id: 'expert',       label: () => _GameText('game_expert'),       cols: 16, rows: 10, mines: 35, cell: 28 },
  ];
  const FAIL_LABELS = ['2/20','3/20','4/20','5/20','6/20','7/20','8/20','9/20'];
  const LS_BEST = 'gf-sweep-best';
  const TAU = Math.PI * 2;
  const PAD = 8;
  const ACCENT = '#60a5fa';
  const REVEAL_MS = 220;
  const STEP_MS = 26;
  const FLAG_MS = 280;
  const PN = 380;

  const PAL = {
    light: {
      dark: false, hid: ['#79aef4', '#6ca3ee'], lip: '#3b6fc4', out: '#1e3a6e', rev: ['#f6f1e7', '#ede6d8'],
      revLine: 'rgba(120,96,60,0.13)', frame: '#dce6f6', frameOut: '#a9bddc', well: '#b9c9e2',
      num: ['', '#2563eb', '#15803d', '#dc2626', '#6d28d9', '#b45309', '#0e7490', '#be185d', '#475569'],
      numOut: 'rgba(255,255,255,0.9)', shadow: 'rgba(28,48,92,0.34)', mineBg: 'rgba(239,68,68,0.16)',
    },
    dark: {
      dark: true, hid: ['#3f63a8', '#395b9c'], lip: '#1c3264', out: '#060b18', rev: ['#1a2030', '#1d2435'],
      revLine: 'rgba(255,255,255,0.045)', frame: '#151b29', frameOut: '#2c3852', well: '#0b0f19',
      num: ['', '#6ba6ff', '#4ade80', '#f87171', '#c084fc', '#fb923c', '#22d3ee', '#f472b6', '#cbd5e1'],
      numOut: 'rgba(6,9,18,0.85)', shadow: 'rgba(0,0,0,0.55)', mineBg: 'rgba(239,68,68,0.2)',
    },
  };

  function LoadBests() { try { return JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch(_){ return {}; } }
  function SaveBestScore(id, secs) {
    const b = LoadBests();
    if (!b[id] || secs < b[id]) { b[id] = secs; try { localStorage.setItem(LS_BEST, JSON.stringify(b)); } catch(_){} return true; }
    return false;
  }
  function GetBestScore(id) { return LoadBests()[id] || null; }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function Mix(a, b, t) {
    const x = Hex(a), y = Hex(b);
    let s = '#';
    for (let i = 0; i < 3; i++) s += Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    return s;
  }
  function Lt(c, t) { return Mix(c, '#ffffff', t); }
  function Dk(c, t) { return Mix(c, '#000000', t); }
  function Rgba(c, a) { const x = Hex(c); return `rgba(${x[0]},${x[1]},${x[2]},${a})`; }
  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g, w, h };
  }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function EaseBack(t) { const c = 1.8, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; }
  function EaseOut(t) { return 1 - (1 - t) * (1 - t); }

  function DrawFlag(g, S) {
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath(); g.ellipse(S * 0.47, S * 0.8, S * 0.22, S * 0.06, 0, 0, TAU); g.fill();
    RR(g, S * 0.3, S * 0.72, S * 0.34, S * 0.1, S * 0.04);
    g.fillStyle = '#475569'; g.fill(); g.lineWidth = Math.max(1, S * 0.03); g.strokeStyle = '#0f172a'; g.stroke();
    g.beginPath(); g.moveTo(S * 0.42, S * 0.74); g.lineTo(S * 0.42, S * 0.18);
    g.strokeStyle = '#0f172a'; g.lineWidth = Math.max(2, S * 0.085); g.stroke();
    g.strokeStyle = '#cbd5e1'; g.lineWidth = Math.max(1, S * 0.04); g.stroke();
    Poly(g, [S * 0.44, S * 0.17, S * 0.8, S * 0.31, S * 0.44, S * 0.47]);
    const gr = g.createLinearGradient(0, S * 0.17, 0, S * 0.47);
    gr.addColorStop(0, '#f87171'); gr.addColorStop(1, '#dc2626');
    g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1, S * 0.04); g.strokeStyle = '#7f1d1d'; g.stroke();
    Poly(g, [S * 0.47, S * 0.22, S * 0.66, S * 0.29, S * 0.47, S * 0.3]);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    Circ(g, S * 0.42, S * 0.17, S * 0.045); g.fillStyle = '#facc15'; g.fill();
  }

  function DrawMine(g, S) {
    const cx = S / 2, cy = S / 2 + S * 0.02, r = S * 0.21;
    g.strokeStyle = '#0b0f17'; g.lineWidth = Math.max(2, S * 0.1);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6); g.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * 1.6); g.stroke();
    }
    g.strokeStyle = '#4b5563'; g.lineWidth = Math.max(1, S * 0.045);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); g.lineTo(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 1.5); g.stroke();
    }
    const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.1);
    gr.addColorStop(0, '#6b7280'); gr.addColorStop(0.5, '#1f2937'); gr.addColorStop(1, '#030712');
    Circ(g, cx, cy, r); g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1, S * 0.04); g.strokeStyle = '#030712'; g.stroke();
    g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.38, r * 0.3, r * 0.2, -0.6, 0, TAU);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill();
    Circ(g, cx + r * 0.25, cy + r * 0.25, r * 0.16); g.fillStyle = '#ef4444'; g.fill();
  }

  function Tile(S, k, P, par, mode) {
    const s = Cv(S, S, k), g = s.g;
    const m = Math.max(1, S * 0.05), r = S * 0.2, lip = Math.max(2, Math.round(S * 0.1));
    const w = S - 2 * m, h = S - 2 * m, base = P.hid[par];
    const lw = Math.max(1, S * 0.04);
    if (mode === 2) {
      RR(g, m, m + lip * 0.7, w, h - lip * 0.7, r);
      g.fillStyle = Dk(base, 0.12); g.fill();
      g.lineWidth = lw; g.strokeStyle = Rgba(P.out, 0.5); g.stroke();
      return s;
    }
    const top = mode === 1 ? Lt(base, 0.22) : base;
    RR(g, m, m, w, h, r); g.fillStyle = P.lip; g.fill();
    const gr = g.createLinearGradient(0, m, 0, m + h - lip);
    gr.addColorStop(0, Lt(top, 0.18)); gr.addColorStop(1, Dk(top, 0.03));
    RR(g, m, m, w, h - lip, r); g.fillStyle = gr; g.fill();
    RR(g, m + r * 0.75, m + S * 0.07, w - r * 1.5, Math.max(1.2, S * 0.07), S * 0.035);
    g.fillStyle = P.dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)'; g.fill();
    Circ(g, m + r * 0.7, m + r * 0.75, Math.max(0.8, S * 0.035));
    g.fillStyle = P.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.45)'; g.fill();
    RR(g, m, m, w, h, r); g.lineWidth = lw; g.strokeStyle = Rgba(P.out, P.dark ? 0.75 : 0.45); g.stroke();
    return s;
  }

  function TileShadow(S, k, P) {
    const e = Math.ceil(S * 0.25), s = Cv(S + e * 2, S + e * 2, k), g = s.g;
    g.filter = `blur(${(S * 0.07 * k).toFixed(1)}px)`;
    RR(g, e + S * 0.06, e + S * 0.12, S * 0.92, S * 0.92, S * 0.22); g.fillStyle = P.shadow; g.fill();
    s.e = e;
    return s;
  }

  function NumSprite(S, k, P, n) {
    const s = Cv(S, S, k), g = s.g, col = P.num[n];
    g.font = `900 ${Math.round(S * 0.6)}px "Segoe UI", system-ui, -apple-system, Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const y = S * 0.53;
    g.lineWidth = Math.max(2, S * 0.14); g.strokeStyle = P.numOut; g.strokeText(n, S / 2, y);
    g.fillStyle = Dk(col, 0.4); g.fillText(n, S / 2, y + Math.max(1, S * 0.035));
    const gr = g.createLinearGradient(0, S * 0.25, 0, S * 0.8);
    gr.addColorStop(0, Lt(col, 0.22)); gr.addColorStop(1, col);
    g.fillStyle = gr; g.fillText(n, S / 2, y);
    return s;
  }

  function Base(d, k, P) {
    const S = d.cell, bw = d.cols * S + PAD * 2, bh = d.rows * S + PAD * 2;
    const s = Cv(bw, bh, k), g = s.g;
    RR(g, 0.5, 0.5, bw - 1, bh - 1, 12);
    const fg = g.createLinearGradient(0, 0, 0, bh);
    fg.addColorStop(0, Lt(P.frame, P.dark ? 0.04 : 0.3)); fg.addColorStop(1, P.frame);
    g.fillStyle = fg; g.fill(); g.lineWidth = 1; g.strokeStyle = P.frameOut; g.stroke();
    RR(g, PAD - 3, PAD - 3, d.cols * S + 6, d.rows * S + 6, 9); g.fillStyle = P.well; g.fill();
    g.save();
    RR(g, PAD, PAD, d.cols * S, d.rows * S, 7); g.clip();
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
      g.fillStyle = P.rev[(r + c) & 1]; g.fillRect(PAD + c * S, PAD + r * S, S, S);
    }
    g.strokeStyle = P.revLine; g.lineWidth = 1;
    g.beginPath();
    for (let c = 1; c < d.cols; c++) { g.moveTo(PAD + c * S, PAD); g.lineTo(PAD + c * S, PAD + d.rows * S); }
    for (let r = 1; r < d.rows; r++) { g.moveTo(PAD, PAD + r * S); g.lineTo(PAD + d.cols * S, PAD + r * S); }
    g.stroke();
    const ig = g.createLinearGradient(0, PAD, 0, PAD + 10);
    ig.addColorStop(0, P.dark ? 'rgba(0,0,0,0.5)' : 'rgba(40,50,80,0.16)'); ig.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ig; g.fillRect(PAD, PAD, d.cols * S, 10);
    g.restore();
    return s;
  }

  function BuildSprites() {
    const d = G.diff, S = d.cell, k = _k, P = _dark ? PAL.dark : PAL.light;
    const sp = { S, P, hid: [], hov: [], prs: [], num: [null] };
    for (let p = 0; p < 2; p++) { sp.hid[p] = Tile(S, k, P, p, 0); sp.hov[p] = Tile(S, k, P, p, 1); sp.prs[p] = Tile(S, k, P, p, 2); }
    for (let n = 1; n <= 8; n++) sp.num[n] = NumSprite(S, k, P, n);
    sp.sh = TileShadow(S, k, P);
    sp.base = Base(d, k, P);
    sp.flag = Cv(S, S, k); DrawFlag(sp.flag.g, S);
    sp.mine = Cv(S, S, k); DrawMine(sp.mine.g, S);
    sp.mbg = Cv(S, S, k); RR(sp.mbg.g, 1, 1, S - 2, S - 2, S * 0.16); sp.mbg.g.fillStyle = P.mineBg; sp.mbg.g.fill();
    sp.boom = Cv(S, S, k);
    {
      const g = sp.boom.g, gr = g.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S * 0.7);
      gr.addColorStop(0, '#fca5a5'); gr.addColorStop(0.45, '#ef4444'); gr.addColorStop(1, '#991b1b');
      RR(g, 1, 1, S - 2, S - 2, S * 0.16); g.fillStyle = gr; g.fill();
      g.lineWidth = Math.max(1, S * 0.04); g.strokeStyle = '#7f1d1d'; g.stroke();
    }
    sp.bad = Cv(S, S, k);
    {
      const g = sp.bad.g;
      g.globalAlpha = 0.55; DrawFlag(g, S); g.globalAlpha = 1;
      g.strokeStyle = '#7f1d1d'; g.lineWidth = Math.max(3, S * 0.14);
      g.beginPath(); g.moveTo(S * 0.24, S * 0.24); g.lineTo(S * 0.76, S * 0.76); g.moveTo(S * 0.76, S * 0.24); g.lineTo(S * 0.24, S * 0.76); g.stroke();
      g.strokeStyle = '#ef4444'; g.lineWidth = Math.max(1.6, S * 0.075); g.stroke();
    }
    _S = sp;
  }

  function BuildIcons() {
    const U = s => s.c.toDataURL();
    const I = {};
    I.flag = U((() => { const s = Cv(32, 32, 2); DrawFlag(s.g, 32); return s; })());
    I.mine = U((() => { const s = Cv(32, 32, 2); DrawMine(s.g, 32); return s; })());
    I.clock = U((() => {
      const s = Cv(32, 32, 2), g = s.g;
      RR(g, 13, 2, 6, 5, 1.5); g.fillStyle = '#94a3b8'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#0f172a'; g.stroke();
      Circ(g, 16, 18, 11.5); g.fillStyle = '#f8fafc'; g.fill(); g.lineWidth = 2.6; g.strokeStyle = '#0f172a'; g.stroke();
      Circ(g, 16, 18, 8.8); g.lineWidth = 1.6; g.strokeStyle = ACCENT; g.stroke();
      g.beginPath(); g.moveTo(16, 18); g.lineTo(16, 11.5); g.moveTo(16, 18); g.lineTo(20.5, 20.5); g.lineWidth = 2.2; g.strokeStyle = '#0f172a'; g.stroke();
      Circ(g, 16, 18, 1.6); g.fillStyle = '#ef4444'; g.fill();
      return s;
    })());
    I.cap = U((() => {
      const s = Cv(64, 64, 2), g = s.g;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(32, 56, 20, 4, 0, 0, TAU); g.fill();
      RR(g, 18, 26, 28, 20, 6); g.fillStyle = '#1e293b'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#020617'; g.stroke();
      Poly(g, [32, 10, 60, 24, 32, 36, 4, 24]); g.fillStyle = '#334155'; g.fill(); g.stroke();
      Poly(g, [32, 13, 52, 23, 32, 27, 12, 23]); g.fillStyle = '#475569'; g.fill();
      g.beginPath(); g.moveTo(32, 24); g.lineTo(50, 30); g.lineTo(50, 44); g.lineWidth = 2.2; g.strokeStyle = '#facc15'; g.stroke();
      Circ(g, 50, 46, 3.6); g.fillStyle = '#facc15'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#a16207'; g.stroke();
      Circ(g, 32, 24, 2.6); g.fillStyle = '#facc15'; g.fill();
      return s;
    })());
    I.boom = U((() => {
      const s = Cv(64, 64, 2), g = s.g;
      g.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16, r = i % 2 ? 17 : 29; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      g.closePath(); g.fillStyle = '#f97316'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#7c2d12'; g.stroke();
      g.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + 0.2, r = i % 2 ? 11 : 19; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      g.closePath(); g.fillStyle = '#fde047'; g.fill();
      g.save(); g.translate(16, 16); DrawMine(g, 32); g.restore();
      return s;
    })());
    return I;
  }

  let G = null;
  let _diffId = 'beginner';
  let _timerInterval = null;
  let _timerStart    = null;
  let _timerElapsed  = 0;
  let _I = null, _S = null;
  let _cv = null, _ctx = null, _view = null;
  let _dark = false, _k = 1;
  let _raf = 0, _last = 0, _dirty = true, _animUntil = 0;
  let _hover = -1, _press = -1, _cursor = -1, _kbd = false;
  let _nudgeI = -1, _nudgeT = 0;
  let _shakeT = 0, _flashT = 0, _flashC = '#ffffff';
  let _screen = 'none';
  let _scrT = 0;
  let _longT = 0, _longFired = false;

  const _P = Array.from({ length: PN }, () => ({ on: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, life: 1, s: 1, rot: 0, vr: 0, col: '#fff', kind: 0 }));
  let _pi = 0, _alive = 0;
  const _rings = Array.from({ length: 10 }, () => ({ on: 0, x: 0, y: 0, t: 0, life: 1, r: 1, col: '#fff' }));
  let _ri = 0;

  function Emit(kind, x, y, vx, vy, life, s, col, g) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.t = 0; p.s = s; p.col = col; p.g = g;
    p.rot = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 14;
  }
  function Ring(x, y, r, life, col) {
    const q = _rings[_ri]; _ri = (_ri + 1) % _rings.length;
    q.on = 1; q.x = x; q.y = y; q.r = r; q.life = life; q.t = 0; q.col = col;
  }

  function GetDifficulty() { return DIFFICULTIES.find(d => d.id === _diffId) || DIFFICULTIES[0]; }
  function BoardW() { return G.diff.cols * G.diff.cell + PAD * 2; }
  function BoardH() { return G.diff.rows * G.diff.cell + PAD * 2; }
  function Interactive() { return G && (G.status === 'idle' || G.status === 'playing') && _screen === 'none'; }
  function Bump(t) { if (t > _animUntil) _animUntil = t; _dirty = true; }

  function NewGame() {
    StopTimer();
    clearTimeout(_scrT);
    const d = GetDifficulty();
    const n = d.cols * d.rows;
    const cells = [];
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
      cells.push({ r, c, isMine: false, revealed: false, flagged: false, adjCount: 0, at: 0, ft: 0, sp: 0, hit: false, bad: 0,
        failLabel: FAIL_LABELS[Math.floor(Math.random() * FAIL_LABELS.length)] });
    }
    const nb = cells.map(cl => {
      const a = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = cl.r + dr, nc = cl.c + dc;
        if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols) a.push(nr * d.cols + nc);
      }
      return a;
    });
    const sizeChanged = !G || G.diff !== d;
    G = { diff: d, cells, nb, seen: new Uint8Array(n), pr: new Uint8Array(n), status: 'idle', firstClick: true, flagsLeft: d.mines, elapsed: 0, left: n - d.mines, hitLabel: '' };
    _timerElapsed = 0;
    _hover = -1; _press = -1; _shakeT = 0; _flashT = 0;
    if (_cursor < 0 || _cursor >= n) _cursor = Math.floor(d.rows / 2) * d.cols + Math.floor(d.cols / 2);
    for (const p of _P) p.on = 0;
    for (const q of _rings) q.on = 0;
    HideScreen();
    if (sizeChanged || !_S) Fit(); else _dirty = true;
    const now = performance.now();
    G.born = now;
    G.introMs = (d.rows + d.cols) * 22 + 280;
    Bump(now + G.introMs);
    UpdateHUD();
  }

  function PlaceMines(i0) {
    const d = G.diff, cells = G.cells;
    const safe = new Set([i0, ...G.nb[i0]]);
    const pool = [];
    for (let i = 0; i < cells.length; i++) if (!safe.has(i)) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < d.mines; i++) cells[pool[i]].isMine = true;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].isMine) continue;
      let count = 0;
      for (const j of G.nb[i]) if (cells[j].isMine) count++;
      cells[i].adjCount = count;
    }
  }

  function Flood(i0, t0) {
    const cells = G.cells, seen = G.seen;
    seen.fill(0);
    const q = [i0], dep = [0];
    seen[i0] = 1;
    let end = t0;
    for (let h = 0; h < q.length; h++) {
      const c = cells[q[h]];
      if (c.revealed || c.flagged || c.isMine) continue;
      c.revealed = true; c.sp = 0;
      c.at = t0 + Math.min(dep[h], 36) * STEP_MS;
      if (c.at > end) end = c.at;
      G.left--;
      if (c.adjCount === 0) for (const j of G.nb[q[h]]) if (!seen[j]) { seen[j] = 1; q.push(j); dep.push(dep[h] + 1); }
    }
    return end;
  }

  function Reveal(i) {
    if (!Interactive()) return;
    const c = G.cells[i];
    if (c.revealed || c.flagged) return;
    if (G.firstClick) {
      G.firstClick = false;
      G.status = 'playing';
      PlaceMines(i);
      StartTimer();
    }
    const now = performance.now();
    if (c.isMine) { Lose(i, now); return; }
    const end = Flood(i, now);
    Bump(end + REVEAL_MS);
    CheckWin(end);
  }

  function Chord(i) {
    if (!Interactive()) return;
    const c = G.cells[i];
    if (!c.revealed || !c.adjCount) return;
    let flags = 0, hidden = 0;
    for (const j of G.nb[i]) { const n = G.cells[j]; if (n.flagged) flags++; else if (!n.revealed) hidden++; }
    const now = performance.now();
    if (!hidden) return;
    if (flags !== c.adjCount) { _nudgeI = i; _nudgeT = now + 160; Bump(_nudgeT); return; }
    for (const j of G.nb[i]) {
      const n = G.cells[j];
      if (!n.flagged && !n.revealed && n.isMine) { Lose(j, now); return; }
    }
    let end = now;
    for (const j of G.nb[i]) {
      const n = G.cells[j];
      if (!n.flagged && !n.revealed) end = Math.max(end, Flood(j, now));
    }
    Bump(end + REVEAL_MS);
    CheckWin(end);
  }

  function Act(i) {
    if (i < 0) return;
    if (G.cells[i].revealed) Chord(i); else Reveal(i);
  }

  function CheckWin(end) {
    if (G.left > 0) return;
    G.status = 'won';
    StopTimer();
    const cells = G.cells, d = G.diff;
    let rank = 0;
    for (const c of cells) {
      if (c.isMine && !c.flagged) { c.flagged = true; c.ft = end + 120 + rank * 40; rank++; }
    }
    G.flagsLeft = 0;
    const secs = Math.max(1, Math.round(_timerElapsed / 1000));
    G.newBest = SaveBestScore(_diffId, secs);
    UpdateHUD();
    const t = end + 160 + rank * 40;
    Bump(t + FLAG_MS + 400);
    _scrT = setTimeout(() => {
      const bw = BoardW();
      const cols = ['#60a5fa', '#f472b6', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
      for (let i = 0; i < 70; i++) Emit(3, Math.random() * bw, -6 - Math.random() * 30, (Math.random() - 0.5) * 60, 40 + Math.random() * 90, 1.8 + Math.random() * 1.2, 4 + Math.random() * 3, cols[i % 6], 120);
      Bump(performance.now() + 400);
      _scrT = setTimeout(() => ShowScreen('win'), 650);
    }, Math.max(0, t - performance.now()));
  }

  function CellCenter(i) { const c = G.cells[i], S = G.diff.cell; return [PAD + c.c * S + S / 2, PAD + c.r * S + S / 2]; }

  function Explode(x, y, big) {
    const n = big ? 26 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (big ? 70 : 40) + Math.random() * (big ? 180 : 70);
      Emit(1, x, y, Math.cos(a) * v, Math.sin(a) * v - 20, 0.45 + Math.random() * 0.4, 2 + Math.random() * (big ? 3 : 2), i % 3 ? '#fb923c' : '#fde047', 140);
    }
    if (big) {
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * TAU, v = 60 + Math.random() * 120;
        Emit(0, x, y, Math.cos(a) * v, Math.sin(a) * v - 60, 0.9 + Math.random() * 0.4, 3 + Math.random() * 3, i % 2 ? '#1f2937' : '#475569', 520);
      }
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU;
        Emit(2, x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * 20, Math.sin(a) * 20 - 18, 0.9 + Math.random() * 0.5, 8 + Math.random() * 6, _dark ? '#64748b' : '#9ca3af', -10);
      }
      Ring(x, y, G.diff.cell * 2.6, 0.5, '#fb923c');
      Ring(x, y, G.diff.cell * 1.5, 0.32, '#fde047');
    } else {
      Ring(x, y, G.diff.cell * 0.9, 0.3, '#f87171');
    }
  }

  function Lose(i, now) {
    G.status = 'lost';
    StopTimer();
    const cells = G.cells, hit = cells[i];
    hit.revealed = true; hit.hit = true; hit.at = now; hit.sp = 0;
    G.hitLabel = hit.failLabel;
    const [hx, hy] = CellCenter(i);
    Explode(hx, hy, true);
    _shakeT = now + 380; _flashT = now + 260; _flashC = '#fed7aa';
    let end = now;
    cells.forEach((c, j) => {
      if (j === i) return;
      const dist = Math.hypot(c.r - hit.r, c.c - hit.c);
      const t = now + 300 + Math.min(1100, dist * 70);
      if (c.isMine && !c.flagged) { c.revealed = true; c.at = t; c.sp = 0; end = Math.max(end, t); }
      if (c.flagged && !c.isMine) { c.bad = t; end = Math.max(end, t); }
    });
    Bump(end + 700);
    _scrT = setTimeout(() => ShowScreen('lose'), end - now + 650);
  }

  function ToggleFlag(i) {
    if (!Interactive() || i < 0) return;
    const c = G.cells[i];
    if (c.revealed) return;
    c.flagged = !c.flagged;
    G.flagsLeft += c.flagged ? -1 : 1;
    const now = performance.now();
    c.ft = now;
    if (c.flagged) {
      const [x, y] = CellCenter(i), S = G.diff.cell;
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + (k - 1.5) * 0.7;
        Emit(1, x, y + S * 0.3, Math.cos(a) * 50, Math.sin(a) * 40, 0.35, 1.6, k % 2 ? '#fca5a5' : '#ffffff', 90);
      }
    }
    Bump(now + FLAG_MS);
    UpdateHUD();
  }

  function StartTimer() {
    _timerStart = Date.now();
    _timerInterval = setInterval(() => {
      const total = _timerElapsed + (Date.now() - _timerStart);
      G.elapsed   = Math.min(999, Math.floor(total / 1000));
      SetText('gf-sw-timer', String(G.elapsed).padStart(3, '0'));
    }, 200);
  }
  function StopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    if (_timerStart)    { _timerElapsed += Date.now() - _timerStart; _timerStart = null; }
  }
  function ResumeTimer() {
    if (G?.status === 'playing' && !_timerInterval && _screen === 'none') StartTimer();
  }

  function TogglePause() {
    if (!G || G.status !== 'playing') return;
    if (_screen === 'paused') { HideScreen(); ResumeTimer(); _dirty = true; }
    else if (_screen === 'none') { StopTimer(); ShowScreen('paused'); }
  }

  function Ic(src, cls) { return `<i class="gf-sw-i ${cls}" style="background-image:url(${src})"></i>`; }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!G) return;
    SetText('gf-sw-flags', String(Math.max(0, G.flagsLeft)).padStart(3, '0'));
    SetText('gf-sw-timer', String(G.elapsed || 0).padStart(3, '0'));
    const best = GetBestScore(_diffId);
    SetText('gf-sw-best', best ? `${_GameText('game_best')}: ${best}s` : '');
    document.querySelectorAll('.gf-sw-diff-btn').forEach(btn => {
      btn.classList.toggle('gf-sw-diff-active', btn.dataset.diff === _diffId);
    });
    const pb = document.getElementById('gf-sw-pause');
    if (pb) pb.disabled = G.status !== 'playing';
  }

  function HideScreen() {
    _screen = 'none';
    const el = document.getElementById('gf-sw-scr'); if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    const b = document.getElementById('gf-sw-body'); if (b) b.classList.remove('gf-sw-blur');
  }

  function MiniGrid(d) {
    const c = Math.ceil(d.cols / 2), r = Math.ceil(d.rows / 2);
    let h = '';
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
      const v = (x * 7 + y * 13 + d.mines) % 9;
      h += v < 3 ? '<i class="o"></i>' : v === 4 && (x + y) % 3 === 0 ? '<i class="m"></i>' : '<i></i>';
    }
    return h;
  }

  function LevelCards() {
    const bests = LoadBests();
    return DIFFICULTIES.map(d => `
      <button class="gf-sw-lv${d.id === _diffId ? ' gf-sw-lv-on' : ''}" data-lv="${d.id}">
        <span class="gf-sw-lv-mini" style="grid-template-columns:repeat(${Math.ceil(d.cols / 2)},6px)">${MiniGrid(d)}</span>
        <b>${d.label()}</b>
        <span class="gf-sw-lv-meta">${d.cols}&times;${d.rows} &middot; ${Ic(_I.mine, '')}${d.mines}</span>
        <em>${bests[d.id] ? `${_GameText('game_best')}: ${bests[d.id]}s` : '&ndash;'}</em>
      </button>`).join('');
  }

  function ShowScreen(kind) {
    const el = document.getElementById('gf-sw-scr'); if (!el) return;
    _screen = kind;
    _press = -1;
    const secs = Math.round(_timerElapsed / 1000);
    const best = GetBestScore(_diffId);
    let html = '';
    if (kind === 'start') {
      html = `
        <div class="gf-sw-card gf-sw-card-wide">
          ${Ic(_I.mine, 'gf-sw-scr-ic')}
          <div class="gf-sw-scr-title">GradeSweeper</div>
          <div class="gf-sw-scr-sub">${_GameText('game_sweep_choose')}</div>
          <div class="gf-sw-lvs">${LevelCards()}</div>
          <div class="gf-sw-ctl">
            <span><kbd>${_GameText('game_sweep_ctl_click')}</kbd> ${_GameText('game_sweep_ctl_reveal')}</span>
            <span><kbd>${_GameText('game_sweep_ctl_right')}</kbd> ${_GameText('game_sweep_ctl_flag')}</span>
            <span><kbd>${_GameText('game_sweep_ctl_number')}</kbd> ${_GameText('game_sweep_ctl_chord')}</span>
          </div>
          <div class="gf-sw-tip">${Ic(_I.flag, '')}${_GameText('game_sweep_first_safe')}</div>
        </div>`;
    } else if (kind === 'paused') {
      html = `
        <div class="gf-sw-card">
          ${Ic(_I.clock, 'gf-sw-scr-ic')}
          <div class="gf-sw-scr-title">${_GameText('game_paused')}</div>
          <div class="gf-sw-stats">
            <div><span>${_GameText('game_time')}</span><strong>${secs}s</strong></div>
            <div><span>${_GameText('game_sweep_flags')}</span><strong>${Math.max(0, G.flagsLeft)}</strong></div>
          </div>
          <div class="gf-sw-btns">
            <button class="gf-sw-btn" data-act="resume">${_GameText('game_resume')}</button>
            <button class="gf-sw-btn gf-sw-btn2" data-act="new">${_GameText('game_new_game')}</button>
          </div>
        </div>`;
    } else if (kind === 'win') {
      html = `
        <div class="gf-sw-card">
          ${Ic(_I.cap, 'gf-sw-scr-ic gf-sw-bounce')}
          <div class="gf-sw-scr-title gf-sw-good">${_GameText('game_sweep_cleared')}</div>
          ${G.newBest ? `<div class="gf-sw-badge">${_GameText('game_new_best')}</div>` : ''}
          <div class="gf-sw-stats">
            <div><span>${_GameText('game_time')}</span><strong>${Math.max(1, secs)}s</strong></div>
            <div><span>${_GameText('game_best')}</span><strong>${best ? best + 's' : '-'}</strong></div>
            <div><span>${G.diff.label()}</span><strong>${G.diff.cols}&times;${G.diff.rows}</strong></div>
          </div>
          <div class="gf-sw-btns">
            <button class="gf-sw-btn" data-act="new">${_GameText('game_play_again')}</button>
            <button class="gf-sw-btn gf-sw-btn2" data-act="levels">${_GameText('game_levels')}</button>
          </div>
        </div>`;
    } else if (kind === 'lose') {
      const total = G.cells.length - G.diff.mines;
      const pct = Math.floor((total - G.left) / total * 100);
      html = `
        <div class="gf-sw-card">
          ${Ic(_I.boom, 'gf-sw-scr-ic gf-sw-shake')}
          <div class="gf-sw-scr-title gf-sw-bad">${_GameText('game_sweep_fail')}</div>
          <div class="gf-sw-scr-sub">${_GameText('game_sweep_fail_desc')}</div>
          <div class="gf-sw-stats">
            <div><span>${_GameText('game_sweep_hit')}</span><strong class="gf-sw-bad">${G.hitLabel}</strong></div>
            <div><span>${_GameText('game_time')}</span><strong>${secs}s</strong></div>
            <div><span>${_GameText('game_sweep_progress')}</span><strong>${pct}%</strong></div>
          </div>
          <div class="gf-sw-btns">
            <button class="gf-sw-btn" data-act="new">${_GameText('game_try_again')}</button>
            <button class="gf-sw-btn gf-sw-btn2" data-act="levels">${_GameText('game_levels')}</button>
          </div>
        </div>`;
    }
    el.innerHTML = html;
    el.style.display = 'flex';
    el.dataset.kind = kind;
    const b = document.getElementById('gf-sw-body'); if (b) b.classList.toggle('gf-sw-blur', kind === 'paused');
    UpdateHUD();
  }

  function OnScreenClick(e) {
    const lv = e.target.closest('[data-lv]');
    if (lv) { _diffId = lv.dataset.lv; NewGame(); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'resume') TogglePause();
    else if (act === 'new') NewGame();
    else if (act === 'levels') ShowScreen('start');
  }

  function Draw(now, dt) {
    const sp = _S, S = sp.S, k = _k, ctx = _ctx, cells = G.cells, d = G.diff, n = cells.length;
    let ox = 0, oy = 0;
    if (now < _shakeT) { const a = (_shakeT - now) / 380 * 5; ox = (Math.random() * 2 - 1) * a; oy = (Math.random() * 2 - 1) * a; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, _cv.width, _cv.height);
    ctx.setTransform(k, 0, 0, k, ox * k, oy * k);
    ctx.globalAlpha = 1;
    Img(sp.base, 0, 0);

    const pr = G.pr;
    pr.fill(0);
    const live = Interactive();
    if (live && _press >= 0) {
      if (cells[_press].revealed) { for (const j of G.nb[_press]) pr[j] = 1; }
      else pr[_press] = 1;
    }
    if (_nudgeI >= 0 && now < _nudgeT) for (const j of G.nb[_nudgeI]) pr[j] = 1;

    const e = sp.sh.e;
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      if (c.revealed && now >= c.at) continue;
      if (pr[i] && !c.flagged) continue;
      Img(sp.sh, PAD + c.c * S - e, PAD + c.r * S - e);
    }

    let anim = false;
    const intro = now - G.born, introOn = intro < G.introMs;
    for (let i = 0; i < n; i++) {
      const c = cells[i], x = PAD + c.c * S, y = PAD + c.r * S, par = (c.r + c.c) & 1;
      if (c.revealed && now >= c.at) {
        const t = Math.min(1, (now - c.at) / REVEAL_MS);
        if (!c.sp) { c.sp = 1; Spawn(c, i, x, y, par); }
        if (t < 1) anim = true;
        DrawContent(c, x, y, t, now);
        continue;
      }
      const hv = live && (i === _hover || (_kbd && i === _cursor)) && !c.flagged;
      let spr = pr[i] && !c.flagged ? sp.prs[par] : hv ? sp.hov[par] : sp.hid[par];
      if (introOn) {
        const t = Math.max(0, Math.min(1, (intro - (c.r + c.c) * 22) / 260));
        if (t < 1) {
          const s = 0.6 + 0.4 * EaseBack(t);
          ctx.globalAlpha = t;
          ImgS(spr, x + S / 2, y + S / 2, s);
          ctx.globalAlpha = 1;
          continue;
        }
      }
      Img(spr, x, y);
      if (c.bad && now >= c.bad) {
        const t = Math.min(1, (now - c.bad) / 240);
        if (t < 1) anim = true;
        ImgS(sp.bad, x + S / 2, y + S / 2, 0.4 + 0.6 * EaseBack(t));
      } else if (c.flagged || (c.ft && now - c.ft < FLAG_MS)) DrawFlagAt(c, x, y, now);
    }

    if (anim) {
      for (let i = 0; i < n; i++) {
        const c = cells[i];
        if (!c.revealed || now < c.at || now - c.at >= REVEAL_MS || c.hit) continue;
        const t = (now - c.at) / REVEAL_MS, par = (c.r + c.c) & 1;
        ctx.globalAlpha = 1 - t;
        ImgS(sp.hid[par], PAD + c.c * S + S / 2, PAD + c.r * S + S / 2 - S * 0.22 * EaseOut(t), 1 + 0.28 * t);
      }
      ctx.globalAlpha = 1;
    }

    if (live && _kbd && _cursor >= 0) {
      const c = cells[_cursor], a = 0.65 + 0.35 * Math.sin(now / 160);
      ctx.globalAlpha = a;
      RR(ctx, PAD + c.c * S + 1.5, PAD + c.r * S + 1.5, S - 3, S - 3, S * 0.22);
      ctx.lineWidth = 2.5; ctx.strokeStyle = _dark ? '#fde047' : '#f59e0b'; ctx.stroke();
      ctx.globalAlpha = 1;
      anim = true;
    }

    DrawFx(now, dt / 1000);

    if (now < _flashT) {
      ctx.globalAlpha = (_flashT - now) / 260 * 0.45;
      ctx.fillStyle = _flashC; ctx.fillRect(0, 0, BoardW(), BoardH());
      ctx.globalAlpha = 1;
    }
    return anim;
  }

  function Img(s, x, y) { _ctx.drawImage(s.c, x, y, s.c.width / _k, s.c.height / _k); }
  function ImgS(s, cx, cy, sc) {
    const w = s.c.width / _k * sc, h = s.c.height / _k * sc;
    _ctx.drawImage(s.c, cx - w / 2, cy - h / 2, w, h);
  }

  function DrawFlagAt(c, x, y, now) {
    const S = _S.S, t = c.ft ? (now - c.ft) / FLAG_MS : 1;
    if (t < 0) return;
    if (c.flagged) {
      if (t >= 1) { Img(_S.flag, x, y); return; }
      const s = Math.max(0.01, EaseBack(t));
      ImgS(_S.flag, x + S / 2, y + S / 2 - S * 0.35 * (1 - EaseOut(t)), s);
    } else if (t < 1) {
      _ctx.globalAlpha = 1 - t;
      ImgS(_S.flag, x + S / 2, y + S / 2 - S * 0.2 * t, 1 - t * 0.6);
      _ctx.globalAlpha = 1;
    }
  }

  function DrawContent(c, x, y, t, now) {
    const sp = _S, S = sp.S;
    if (c.isMine) {
      Img(c.hit ? sp.boom : sp.mbg, x, y);
      ImgS(sp.mine, x + S / 2, y + S / 2, 0.3 + 0.7 * EaseBack(t));
      return;
    }
    if (!c.adjCount) return;
    if (t >= 1) { Img(sp.num[c.adjCount], x, y); return; }
    const u = Math.max(0, (t - 0.25) / 0.75);
    if (u <= 0) return;
    _ctx.globalAlpha = Math.min(1, u * 1.6);
    ImgS(sp.num[c.adjCount], x + S / 2, y + S / 2, 0.4 + 0.6 * EaseBack(u));
    _ctx.globalAlpha = 1;
  }

  function Spawn(c, i, x, y, par) {
    const S = _S.S, P = _S.P;
    if (c.isMine) {
      if (!c.hit) Explode(x + S / 2, y + S / 2, false);
      return;
    }
    if (Math.random() < 0.55) {
      const a = Math.random() * TAU, v = 30 + Math.random() * 50;
      Emit(0, x + S / 2, y + S / 2, Math.cos(a) * v, -40 - Math.random() * 60, 0.5 + Math.random() * 0.3, S * (0.12 + Math.random() * 0.1), par ? P.hid[1] : Lt(P.hid[0], 0.1), 420);
    }
  }

  function DrawFx(now, dt) {
    const ctx = _ctx, k = _k;
    let alive = 0;
    for (const q of _rings) {
      if (!q.on) continue;
      q.t += dt;
      if (q.t >= q.life) { q.on = 0; continue; }
      alive++;
      const u = q.t / q.life;
      ctx.globalAlpha = (1 - u) * 0.9;
      Circ(ctx, q.x, q.y, q.r * EaseOut(u));
      ctx.lineWidth = 3 * (1 - u) + 0.5; ctx.strokeStyle = q.col; ctx.stroke();
    }
    for (const p of _P) {
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = 0; continue; }
      alive++;
      p.vy += p.g * dt;
      if (p.kind === 3) { p.vx *= 0.985; p.x += Math.sin(p.t * 6 + p.rot) * 0.6; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const u = p.t / p.life, a = u > 0.7 ? (1 - u) / 0.3 : 1;
      if (p.kind === 1) {
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        Circ(ctx, p.x, p.y, p.s * (1 - u * 0.5)); ctx.fill();
      } else if (p.kind === 2) {
        ctx.globalAlpha = a * 0.35; ctx.fillStyle = p.col;
        Circ(ctx, p.x, p.y, p.s * (0.6 + u)); ctx.fill();
      } else {
        const co = Math.cos(p.rot), si = Math.sin(p.rot), w = p.s, h = p.kind === 3 ? p.s * 0.55 : p.s;
        ctx.globalAlpha = a;
        ctx.setTransform(co * k, si * k, -si * k, co * k, p.x * k, p.y * k);
        ctx.fillStyle = p.col; ctx.fillRect(-w / 2, -h / 2, w, h);
        if (p.kind === 0) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.3); }
        ctx.setTransform(k, 0, 0, k, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
    _alive = alive;
  }

  function Loop(now) {
    _raf = requestAnimationFrame(Loop);
    const dt = Math.min(50, now - (_last || now)); _last = now;
    if (!G || !_S || !_ctx) return;
    if (!_dirty && now > _animUntil && !_alive && !(_kbd && Interactive())) return;
    _dirty = false;
    if (Draw(now, dt)) _dirty = true;
  }
  function StartLoop() { if (!_raf) { _last = 0; _raf = requestAnimationFrame(Loop); } }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = 0; } }

  function Fit() {
    if (!G || !_cv) return;
    const bw = BoardW(), bh = BoardH();
    const s = Math.max(0.5, Math.min(1.15, (innerWidth - 64) / bw, (innerHeight - 200) / bh));
    const dpr = Math.min(3, W.devicePixelRatio || 1);
    const cw = Math.round(bw * s), ch = Math.round(bh * s);
    _cv.style.width = `${cw}px`; _cv.style.height = `${ch}px`;
    _cv.width = Math.round(cw * dpr); _cv.height = Math.round(ch * dpr);
    _k = _cv.width / bw;
    _ctx = _cv.getContext('2d');
    BuildSprites();
    _dirty = true;
  }

  function CellAt(e) {
    if (!G || !_cv) return -1;
    const r = _cv.getBoundingClientRect(), d = G.diff, S = d.cell;
    const x = (e.clientX - r.left) / r.width * BoardW() - PAD, y = (e.clientY - r.top) / r.height * BoardH() - PAD;
    const c = Math.floor(x / S), rr = Math.floor(y / S);
    return c >= 0 && c < d.cols && rr >= 0 && rr < d.rows ? rr * d.cols + c : -1;
  }

  function OnPointerMove(e) {
    const i = CellAt(e);
    if (e.pointerType === 'touch') {
      if (_longT && i !== _press) { clearTimeout(_longT); _longT = 0; _press = -1; _dirty = true; }
      return;
    }
    if (i !== _hover) { _hover = i; _dirty = true; }
    if (_kbd) { _kbd = false; _dirty = true; }
    if (_press >= 0 && i !== _press) { _press = i; _dirty = true; }
  }
  function OnPointerLeave() { _hover = -1; _press = -1; _dirty = true; }
  function OnPointerDown(e) {
    if (!Interactive()) return;
    const i = CellAt(e); if (i < 0) return;
    _hover = i;
    if (e.pointerType === 'touch') {
      _longFired = false; _press = i;
      clearTimeout(_longT);
      _longT = setTimeout(() => { _longT = 0; _longFired = true; _press = -1; ToggleFlag(i); }, 420);
      _dirty = true;
      return;
    }
    if (e.button === 2) { ToggleFlag(i); return; }
    if (e.button === 1) e.preventDefault();
    _press = i; _dirty = true;
  }
  function OnPointerUp(e) {
    const i = CellAt(e);
    if (e.pointerType === 'touch') {
      if (_longT) { clearTimeout(_longT); _longT = 0; _press = -1; if (!_longFired) Act(i); }
      _dirty = true;
      return;
    }
    if (e.button === 2) return;
    const p = _press; _press = -1; _dirty = true;
    if (p >= 0 && p === i) { if (e.button === 1) Chord(i); else Act(i); }
  }

  let _kh = null;
  function OnKey(e) {
    const root = document.getElementById('gf-sweep');
    if (!root || root.style.display === 'none') return;
    const k = e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) {
      e.preventDefault(); e.stopPropagation();
      if (!Interactive()) return;
      const d = G.diff;
      let r = Math.floor(_cursor / d.cols), c = _cursor % d.cols;
      if (_kbd) {
        if (k === 'ArrowLeft') c = (c + d.cols - 1) % d.cols;
        if (k === 'ArrowRight') c = (c + 1) % d.cols;
        if (k === 'ArrowUp') r = (r + d.rows - 1) % d.rows;
        if (k === 'ArrowDown') r = (r + 1) % d.rows;
      }
      _cursor = r * d.cols + c; _kbd = true; _dirty = true;
      return;
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGradeSweeper(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); NewGame(); return; }
    if (k === 'p' || k === 'P') { e.preventDefault(); TogglePause(); return; }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (_screen === 'paused') { TogglePause(); return; }
      if (_screen === 'start' || _screen === 'win' || _screen === 'lose') { NewGame(); return; }
      if (Interactive() && _cursor >= 0) { _kbd = true; Act(_cursor); }
      return;
    }
    if ((k === 'f' || k === 'F') && Interactive() && _cursor >= 0) { e.preventDefault(); _kbd = true; ToggleFlag(_cursor); }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  function OnVisibility() { if (document.hidden && G?.status === 'playing' && _screen === 'none') TogglePause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-sweep'); if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter  = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    if (_cv && _view) {
      let n = 0;
      for (let e = _cv; e; e = e.parentElement) if (e !== _view && getComputedStyle(e).filter.includes('invert')) n++;
      _view.style.filter = n % 2 ? 'invert(1) hue-rotate(180deg)' : '';
    }
    const d = el.dataset.theme === 'dark';
    if (d !== _dark) { _dark = d; if (G && _cv) { BuildSprites(); _dirty = true; } }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  function BuildOverlay() {
    if (document.getElementById('gf-sweep')) return;
    InjectCSS();
    if (!_I) _I = BuildIcons();
    const root = document.createElement('div');
    root.id = 'gf-sweep';

    const diffBtns = DIFFICULTIES.map(d =>
      `<button class="gf-sw-diff-btn${d.id === _diffId ? ' gf-sw-diff-active' : ''}" data-diff="${d.id}">${d.label()}</button>`
    ).join('');

    root.innerHTML = `
<div id="gf-sw-modal">
  <div id="gf-sw-hdr">
    <div class="gf-sw-hl">
      <div id="gf-sw-logo">${Ic(_I.mine, '')}</div>
      <div>
        <div id="gf-sw-title">GradeSweeper</div>
        <div id="gf-sw-sub">${_GameText('game_sweep_subtitle')}</div>
      </div>
    </div>
    <div class="gf-sw-hr">
      <div class="gf-sw-lcd" title="${_GameText('game_sweep_flags')}">${Ic(_I.flag, '')}<span id="gf-sw-flags">010</span></div>
      <div class="gf-sw-lcd" title="${_GameText('game_sweep_elapsed')}">${Ic(_I.clock, '')}<span id="gf-sw-timer">000</span></div>
      <button id="gf-sw-pause" class="gf-sw-ib" title="${_GameText('game_pause_p')}"><svg viewBox="0 0 12 12" width="11" height="11"><rect x="2" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/></svg></button>
      <button id="gf-sw-new" class="gf-sw-ib" title="${_GameText('game_new_game_r')}">&#8634;</button>
      <button id="gf-sw-close" class="gf-sw-ib" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-sw-wrap">
    <div id="gf-sw-body">
      <div id="gf-sw-diff"><div class="gf-sw-seg">${diffBtns}</div><span id="gf-sw-best"></span></div>
      <div id="gf-sw-board-wrap"><div id="gf-sw-view"><canvas id="gf-sw-cv"></canvas></div></div>
    </div>
    <div id="gf-sw-scr" style="display:none"></div>
  </div>
  <div id="gf-sw-hint">${_GameText('game_sweep_hint2')}</div>
</div>`;

    document.body.appendChild(root);
    _cv = document.getElementById('gf-sw-cv');
    _cv.style.setProperty('filter', 'none', 'important');
    _view = document.getElementById('gf-sw-view');
    _ctx = _cv.getContext('2d');

    _cv.addEventListener('pointermove',  OnPointerMove);
    _cv.addEventListener('pointerleave', OnPointerLeave);
    _cv.addEventListener('pointerdown',  OnPointerDown);
    _cv.addEventListener('pointerup',    OnPointerUp);
    _cv.addEventListener('contextmenu',  e => e.preventDefault());
    _cv.addEventListener('auxclick',     e => e.preventDefault());

    document.getElementById('gf-sw-diff').addEventListener('click', e => {
      const btn = e.target.closest('[data-diff]'); if (!btn) return;
      _diffId = btn.dataset.diff;
      NewGame();
    });
    document.getElementById('gf-sw-scr').addEventListener('click', OnScreenClick);
    document.getElementById('gf-sw-pause')?.addEventListener('click', TogglePause);
    document.getElementById('gf-sw-new')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-sw-close')?.addEventListener('click', CloseGradeSweeper);
    document.getElementById('gf-sweep')?.addEventListener('click', e => { if (e.target.id === 'gf-sweep') BossKeySweeper(); });
  }

  function OnResize() { if (G) Fit(); }

  function OpenGradeSweeper() {
    if (!document.getElementById('gf-sweep')) BuildOverlay();
    const el = document.getElementById('gf-sweep');
    el.style.display = 'flex';
    delete el.dataset.bossHidden;
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    W.addEventListener('resize', OnResize);
    document.addEventListener('visibilitychange', OnVisibility);
    if (!G) { NewGame(); ShowScreen('start'); }
    else { Fit(); if (G.status === 'playing' && _screen === 'none') ShowScreen('paused'); }
    StartLoop();
  }

  function CloseGradeSweeper() {
    const el = document.getElementById('gf-sweep');
    if (el) el.style.display = 'none';
    StopTimer();
    StopLoop();
    DetachKeys();
    _tobs.disconnect();
    W.removeEventListener('resize', OnResize);
    document.removeEventListener('visibilitychange', OnVisibility);
  }

  function BossKeySweeper() {
    const el = document.getElementById('gf-sweep'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      ResumeTimer();
      StartLoop();
      _dirty = true;
      return true;
    }
    if (el.style.display !== 'none') {
      StopTimer();
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeSweeper  = OpenGradeSweeper;
  W.CloseGradeSweeper = CloseGradeSweeper;
  W.BossKeySweeper    = BossKeySweeper;

  function InjectCSS() {
    if (document.getElementById('gf-sweep-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-sweep-css';
    s.textContent = `
#gf-sweep {
  --sw-modal:#ffffff;--sw-hdr:#f5f8fd;--sw-body:#edf2fa;--sw-brd:rgba(96,165,250,.28);--sw-brd2:#dfe5ef;
  --sw-txt:#0f172a;--sw-txt2:#475569;--sw-txt3:#94a3b8;--sw-lcd-bg:#0f172a;
  --sw-sh:0 10px 44px rgba(15,23,42,.16),0 1px 4px rgba(15,23,42,.08);
  --sw-ovr:rgba(244,247,252,.86);--sw-btn-brd:#cfd7e3;--sw-card:#ffffff;--sw-kbd:#eef2f8;
}
#gf-sweep[data-theme="dark"] {
  --sw-modal:rgba(13,15,22,.97);--sw-hdr:rgba(9,11,17,.96);--sw-body:#0b0e16;--sw-brd:rgba(96,165,250,.2);
  --sw-brd2:#222a3a;--sw-txt:#f1f5f9;--sw-txt2:#b6c2d4;--sw-txt3:#6b7a92;--sw-lcd-bg:#05070c;
  --sw-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --sw-ovr:rgba(8,10,16,.84);--sw-btn-brd:#2e374a;--sw-card:#121725;--sw-kbd:#1b2232;
}
#gf-sweep{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-sweep *{box-sizing:border-box;}
#gf-sweep .gf-sw-i{display:inline-block;flex-shrink:0;background:center/contain no-repeat;user-select:none;}
#gf-sw-modal{display:flex;flex-direction:column;min-width:min(470px,calc(100vw - 24px));background:var(--sw-modal);border:1px solid var(--sw-brd);border-radius:14px;box-shadow:var(--sw-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
#gf-sw-hdr{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--sw-hdr);border-bottom:1px solid var(--sw-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-sw-hl{display:flex;align-items:center;gap:9px;min-width:0;} .gf-sw-hr{display:flex;align-items:center;gap:6px;}
#gf-sw-logo{width:30px;height:30px;background:linear-gradient(160deg,#93c5fd,#3b82f6);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18),0 2px 6px rgba(59,130,246,.35);}
#gf-sw-logo .gf-sw-i{width:22px;height:22px;}
#gf-sw-title{font-size:14px;font-weight:800;color:var(--sw-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-sw-sub{font-size:9px;color:var(--sw-txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-sw-lcd{display:flex;align-items:center;gap:5px;height:28px;padding:0 9px 0 6px;background:var(--sw-lcd-bg);border:1px solid rgba(148,163,184,.25);border-radius:8px;box-shadow:inset 0 2px 4px rgba(0,0,0,.45);}
.gf-sw-lcd .gf-sw-i{width:16px;height:16px;}
.gf-sw-lcd span{font-size:15px;font-weight:800;color:#f87171;letter-spacing:1.5px;font-variant-numeric:tabular-nums;text-shadow:0 0 6px rgba(248,113,113,.55);}
.gf-sw-ib{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--sw-btn-brd);border-radius:8px;background:transparent;color:var(--sw-txt2);cursor:pointer;font-size:13px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s,transform .12s;}
.gf-sw-ib:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};background:rgba(96,165,250,.1);}
.gf-sw-ib:active:not(:disabled){transform:scale(.92);}
.gf-sw-ib:disabled{opacity:.35;cursor:default;}
#gf-sw-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-sw-wrap{position:relative;display:flex;flex-direction:column;background:var(--sw-body);min-height:0;}
#gf-sw-body{display:flex;flex-direction:column;align-items:center;transition:filter .2s;}
#gf-sw-body.gf-sw-blur{filter:blur(7px) saturate(.7);}
#gf-sw-diff{display:flex;align-items:center;justify-content:space-between;gap:10px;align-self:stretch;padding:9px 12px 0;flex-shrink:0;}
.gf-sw-seg{display:flex;gap:2px;padding:3px;border-radius:10px;background:rgba(100,116,139,.12);}
.gf-sw-diff-btn{padding:5px 12px;border:none;border-radius:7px;background:transparent;color:var(--sw-txt2);font-family:inherit;font-size:10px;font-weight:700;cursor:pointer;transition:color .12s,background .12s,box-shadow .12s;}
.gf-sw-diff-btn:hover{color:${ACCENT};}
.gf-sw-diff-active{background:var(--sw-card)!important;color:${ACCENT}!important;box-shadow:0 1px 3px rgba(15,23,42,.18);}
#gf-sw-best{font-size:10px;font-weight:700;color:var(--sw-txt3);white-space:nowrap;}
#gf-sw-board-wrap{position:relative;margin:10px 14px 14px;flex-shrink:0;line-height:0;}
#gf-sw-view{display:inline-block;line-height:0;filter:drop-shadow(0 6px 14px rgba(15,23,42,.18));}
#gf-sw-cv{display:block;touch-action:none;cursor:pointer;user-select:none;-webkit-user-select:none;}
#gf-sw-scr{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:14px;background:var(--sw-ovr);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:gf-sw-fade .22s ease-out;}
#gf-sw-scr[data-kind="paused"],#gf-sw-scr[data-kind="win"],#gf-sw-scr[data-kind="lose"]{backdrop-filter:none;-webkit-backdrop-filter:none;}
#gf-sw-scr[data-kind="win"],#gf-sw-scr[data-kind="lose"]{background:transparent;align-items:flex-end;padding-bottom:22px;}
#gf-sw-scr[data-kind="win"]::before,#gf-sw-scr[data-kind="lose"]::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,var(--sw-ovr));pointer-events:none;}
@keyframes gf-sw-fade{from{opacity:0}to{opacity:1}}
.gf-sw-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%;padding:18px 22px;background:var(--sw-card);border:1px solid var(--sw-brd);border-radius:16px;box-shadow:0 14px 40px rgba(15,23,42,.22);text-align:center;animation:gf-sw-pop .32s cubic-bezier(.2,1.4,.4,1);}
.gf-sw-card-wide{padding:16px 18px;}
@keyframes gf-sw-pop{from{transform:scale(.85) translateY(10px);opacity:0}to{transform:none;opacity:1}}
.gf-sw-scr-ic{width:52px;height:52px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.2));}
#gf-sweep[data-theme="dark"] .gf-sw-i{filter:drop-shadow(0 0 1.2px rgba(203,213,225,.7));}
#gf-sweep[data-theme="dark"] .gf-sw-scr-ic{filter:drop-shadow(0 0 2px rgba(203,213,225,.55)) drop-shadow(0 4px 8px rgba(0,0,0,.5));}
.gf-sw-bounce{animation:gf-sw-bnc 1.4s ease-in-out infinite;}
@keyframes gf-sw-bnc{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}
.gf-sw-shake{animation:gf-sw-shk .5s ease-out;}
@keyframes gf-sw-shk{0%{transform:scale(.4)}40%{transform:scale(1.2) rotate(8deg)}70%{transform:scale(.95) rotate(-4deg)}100%{transform:none}}
.gf-sw-scr-title{font-size:21px;font-weight:800;letter-spacing:-.5px;color:var(--sw-txt);line-height:1.1;}
.gf-sw-good{color:#22c55e!important;} .gf-sw-bad{color:#ef4444!important;}
.gf-sw-scr-sub{font-size:10px;color:var(--sw-txt2);max-width:300px;line-height:1.5;}
.gf-sw-badge{padding:3px 10px;border-radius:999px;background:linear-gradient(90deg,#fde047,#f59e0b);color:#422006;font-size:10px;font-weight:800;box-shadow:0 2px 8px rgba(245,158,11,.4);}
.gf-sw-stats{display:flex;gap:6px;margin:2px 0;}
.gf-sw-stats>div{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:72px;padding:6px 10px;border-radius:10px;background:var(--sw-kbd);}
.gf-sw-stats span{font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--sw-txt3);white-space:nowrap;}
.gf-sw-stats strong{font-size:16px;font-weight:800;color:var(--sw-txt);font-variant-numeric:tabular-nums;}
.gf-sw-btns{display:flex;gap:8px;margin-top:4px;}
.gf-sw-btn{padding:9px 20px;border:none;border-radius:10px;background:linear-gradient(180deg,#7db4f8,#3b82f6);color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.2px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2),0 4px 14px rgba(59,130,246,.35);transition:transform .12s,box-shadow .12s,filter .12s;}
.gf-sw-btn:hover{transform:translateY(-1px);filter:brightness(1.06);box-shadow:inset 0 -3px 0 rgba(0,0,0,.2),0 6px 18px rgba(59,130,246,.45);}
.gf-sw-btn:active{transform:translateY(1px);box-shadow:inset 0 -1px 0 rgba(0,0,0,.2),0 2px 8px rgba(59,130,246,.3);}
.gf-sw-btn2{background:var(--sw-kbd);color:var(--sw-txt2);box-shadow:inset 0 -3px 0 rgba(0,0,0,.08);border:1px solid var(--sw-brd2);}
.gf-sw-btn2:hover{color:${ACCENT};box-shadow:inset 0 -3px 0 rgba(0,0,0,.08);}
.gf-sw-lvs{display:flex;gap:8px;margin:4px 0 2px;}
.gf-sw-lv{display:flex;flex-direction:column;align-items:center;gap:4px;width:116px;padding:10px 8px 9px;border:1.5px solid var(--sw-brd2);border-radius:12px;background:var(--sw-kbd);color:var(--sw-txt);font-family:inherit;cursor:pointer;transition:transform .14s,border-color .14s,box-shadow .14s;}
.gf-sw-lv:hover{transform:translateY(-3px);border-color:${ACCENT};box-shadow:0 8px 20px rgba(59,130,246,.22);}
.gf-sw-lv-on{border-color:${ACCENT};}
.gf-sw-lv b{font-size:12px;font-weight:800;}
.gf-sw-lv-meta{display:flex;align-items:center;gap:3px;font-size:10px;color:var(--sw-txt2);}
.gf-sw-lv-meta .gf-sw-i{width:13px;height:13px;margin-left:2px;}
.gf-sw-lv em{font-style:normal;font-size:9px;font-weight:700;color:var(--sw-txt3);}
.gf-sw-lv-mini{display:grid;gap:1.5px;height:38px;align-content:center;padding:3px;border-radius:6px;background:rgba(100,116,139,.18);}
.gf-sw-lv-mini i{width:6px;height:6px;border-radius:1.5px;background:linear-gradient(180deg,#93c5fd,#4f8fe8);box-shadow:inset 0 -1px 0 rgba(0,0,0,.25);}
.gf-sw-lv-mini i.o{background:#efe7d6;box-shadow:none;}
.gf-sw-lv-mini i.m{background:linear-gradient(180deg,#fca5a5,#ef4444);}
.gf-sw-ctl{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:9.5px;color:var(--sw-txt2);margin-top:2px;}
.gf-sw-ctl kbd{display:inline-block;padding:1px 6px;margin-right:3px;border:1px solid var(--sw-brd2);border-bottom-width:2px;border-radius:5px;background:var(--sw-kbd);font-family:inherit;font-size:9px;font-weight:700;color:var(--sw-txt);}
.gf-sw-tip{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;color:#16a34a;}
.gf-sw-tip .gf-sw-i{width:14px;height:14px;}
#gf-sw-hint{font-size:9px;color:var(--sw-txt3);text-align:center;padding:7px 14px 9px;flex-shrink:0;background:var(--sw-hdr);border-top:1px solid var(--sw-brd);}
@media (max-width:520px){.gf-sw-lvs{flex-direction:column}.gf-sw-lv{width:200px}#gf-sw-sub{display:none}}
`;
    document.head.appendChild(s);
  }

})(window);
