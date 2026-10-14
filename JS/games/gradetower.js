;(function (W) {
  'use strict';
  if (W.OpenGradeTower) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 720;
  const CV_H = 480;
  const CELL = 40;
  const COLS = CV_W / CELL;
  const ROWS = CV_H / CELL;
  const STEP = 1 / 60;
  const WAVES = 30;
  const START_LIVES = 20;
  const TAU = Math.PI * 2;
  const OUT = '#2b2236';
  const ACCENT = '#22d3ee';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const F_BAN = `900 30px ${FONT}`;
  const F_SUB = `800 13px ${FONT}`;
  const F_BADGE = `900 10px ${FONT}`;
  const SIDE_W = 216;
  const HUD_H = 50;
  const HDR_H = 41;

  const LS_STARS = 'gf-tw-stars';
  const LS_WAVES = 'gf-tw-waves';
  const LS_SPEED = 'gf-tw-speed';

  const MAPS = [
    { id: 'yard', key: 'td_map_yard', pal: 0, money: 250, hp: 0.9, seed: 11,
      paths: [[[-1,2],[5,2],[5,9],[10,9],[10,3],[15,3],[15,9],[18,9]]],
      props: [['tree',1,0],['tree',8,0],['tree',17,1],['tree',0,6],['tree',1,11],['tree',12,11],['tree',17,5],['bush',3,0],['bush',16,11],['bush',7,11],
              ['rock',2,7],['rock',13,0],['bench',7,1],['lamp',6,1],['lamp',11,10],['lamp',16,2],['lamp',4,10],['bin',9,10],['bike',2,10],['slide',1,4],['board',13,10]],
      decals: [['hop',2,8]] },
    { id: 'field', key: 'td_map_field', pal: 1, money: 280, hp: 1.35, seed: 23,
      paths: [[[-1,2],[6,2],[6,6],[11,6],[11,2],[15,2],[15,10],[18,10]], [[-1,10],[6,10],[6,6],[11,6],[11,2],[15,2],[15,10],[18,10]]],
      props: [['tree',0,0],['tree',3,0],['tree',9,0],['tree',17,0],['tree',0,11],['tree',13,11],['tree',17,4],['bush',4,11],['bush',17,7],
              ['goal',7,9],['goal',14,9],['cone',1,6],['cone',2,6],['bench',13,0],['lamp',5,1],['lamp',16,8],['lamp',10,11],['bin',12,1],['bag',1,8],['rock',4,4]],
      decals: [['pitch',10,9]] },
    { id: 'winter', key: 'td_map_winter', pal: 2, money: 310, hp: 1.65, seed: 37,
      paths: [[[-1,5],[3,5],[3,1],[9,1],[9,5],[13,5],[13,9],[18,9]], [[-1,5],[3,5],[3,10],[9,10],[9,5],[13,5],[13,9],[18,9]]],
      props: [['pine',0,0],['pine',1,2],['pine',6,0],['pine',12,0],['pine',17,1],['pine',0,8],['pine',1,11],['pine',16,4],['pine',11,11],
              ['snowman',15,1],['snowman',11,8],['rock',16,11],['rock',7,11],['lamp',4,0],['lamp',10,4],['lamp',2,4],['bench',14,11],['board',15,6]],
      decals: [['ice',6,6],['ice',15,10]] },
  ];

  const PALS = [
    { grass: '#7ec85c', g2: '#6bb84b', g3: '#98d873', blade: '#4f9a37', path: '#dcc99c', path2: '#c9b386', edge: '#9d8657', kind: 0, canopy: ['#4fa83d', '#62bf4b', '#3d8f31'] },
    { grass: '#9ccb5e', g2: '#89bb4c', g3: '#b1d977', blade: '#6a9a35', path: '#d7674c', path2: '#c2553c', edge: '#efe7da', kind: 1, canopy: ['#e5932f', '#f2b13f', '#c96f21'] },
    { grass: '#eaf2f9', g2: '#d9e5f0', g3: '#ffffff', blade: '#b9cadb', path: '#aebdd0', path2: '#9aabc0', edge: '#ffffff', kind: 2, canopy: ['#2f6b4f', '#3f8462', '#24553f'] },
  ];

  const EN = {
    S: { key: 'td_en_sheet', tr: 'td_tr_basic', hp: 42, sp: 40, gold: 5, leak: 1, r: 11, gap: 0.85 },
    F: { key: 'td_en_note', tr: 'td_tr_fast', hp: 26, sp: 74, gold: 4, leak: 1, r: 9, gap: 0.5 },
    A: { key: 'td_en_binder', tr: 'td_tr_armor', hp: 120, sp: 30, gold: 11, leak: 2, r: 13, gap: 1.5, armor: 0.55 },
    P: { key: 'td_en_plane', tr: 'td_tr_fly', hp: 46, sp: 54, gold: 8, leak: 1, r: 11, gap: 1, fly: 1 },
    H: { key: 'td_en_tape', tr: 'td_tr_heal', hp: 85, sp: 36, gold: 12, leak: 1, r: 11, gap: 2.2, heal: 1 },
    X: { key: 'td_en_stack', tr: 'td_tr_split', hp: 95, sp: 32, gold: 9, leak: 2, r: 13, gap: 1.8, split: 3 },
    T: { key: 'td_en_test', tr: 'td_tr_shield', hp: 64, sp: 38, gold: 12, leak: 1, r: 11, gap: 1.25, shield: 1.2 },
    m: { key: 'td_en_sheet', tr: 'td_tr_basic', hp: 20, sp: 46, gold: 2, leak: 1, r: 8, gap: 0.5 },
    B1: { key: 'td_boss_1', tr: 'td_tr_boss1', hp: 900, sp: 22, gold: 200, leak: 5, r: 22, gap: 0, armor: 0.3, boss: 1 },
    B2: { key: 'td_boss_2', tr: 'td_tr_boss2', hp: 1000, sp: 20, gold: 400, leak: 8, r: 26, gap: 0, armor: 0.4, boss: 2 },
    B3: { key: 'td_boss_3', tr: 'td_tr_boss3', hp: 1700, sp: 19, gold: 0, leak: 12, r: 30, gap: 0, armor: 0.4, boss: 3 },
  };
  const EN_CODES = Object.keys(EN);
  for (const c of EN_CODES) EN[c].c = c;

  const PLANS = [
    ['S8', 'S12', 'S10 F6', 'S14 F8', 'A3 S10', 'P5 S12', 'F14 A3', 'H2 S16 A2', 'S18 P6 F10', 'S10 B F8',
     'X4 S14', 'A6 H2 F12', 'T5 S16', 'P12 F14', 'X6 A5 H3', 'S26 T6', 'F26 P8', 'A10 H4 S12', 'X8 T8 P8', 'A6 S16 B',
     'F30 S22', 'P18 T8', 'A14 H5 X6', 'T14 F22', 'X12 P14 H4', 'A18 T10 S22', 'P24 F32', 'X16 A14 H6', 'T18 A16 P16 F24', 'X10 A12 B T10'],
    ['S12', 'S12 F8', 'A4 S12', 'P6 S14', 'F18 A4', 'H3 S18', 'X5 S14', 'T6 F14', 'P12 A6', 'S16 B F12',
     'X8 H3 S12', 'A10 F16', 'T10 P10', 'X10 A8', 'S30 H4 T6', 'P20 F20', 'A14 X8 H4', 'T14 S24', 'P16 A12 F20', 'A10 T8 B',
     'X14 F30', 'A20 H6', 'T18 P18', 'X16 A16 H6', 'F40 P20', 'T20 A20', 'X20 H8 P16', 'A26 T16 F30', 'P30 X18 T16', 'A16 X12 B T14 P12'],
    ['S14 F6', 'A4 S14', 'P8 F10', 'H3 A5 S12', 'X6 F14', 'T8 S16', 'A10 P8', 'X8 H4 F16', 'T10 A8 P8', 'A8 B F16',
     'X12 T8', 'P20 A10', 'H6 X10 F20', 'T16 A12', 'P24 F26', 'X16 H6 A10', 'T20 P16', 'A22 X12', 'F44 T14 H6', 'X10 A12 B T12',
     'P30 A16', 'X22 H8 T14', 'A28 F36', 'T26 P24', 'X26 A20 H8', 'P34 T22 F30', 'A32 X20 H10', 'T30 P30 A20', 'X28 A28 T24 F40', 'A20 T16 B X16 P20 H8'],
  ];

  const TOWERS = [
    { id: 'pencil', col: '#facc15', col2: '#22c55e', air: 1, kind: 'dart', lv: [
      { cost: 70, dmg: 10, rate: 0.5, range: 115 },
      { cost: 65, dmg: 15, rate: 0.42, range: 125 },
      { cost: 110, dmg: 22, rate: 0.36, range: 135 },
      { cost: 240, dmg: 40, rate: 0.36, range: 150, pierce: 4, br: 'pen' },
      { cost: 240, dmg: 22, rate: 0.27, range: 140, multi: 3, br: 'colors' },
    ] },
    { id: 'calc', col: '#38bdf8', col2: '#f97316', air: 1, kind: 'beam', lv: [
      { cost: 110, dmg: 48, rate: 1.6, range: 200 },
      { cost: 100, dmg: 80, rate: 1.45, range: 220 },
      { cost: 160, dmg: 130, rate: 1.3, range: 240 },
      { cost: 320, dmg: 340, rate: 1.5, range: 270, pierceArmor: 1, bossX: 2, br: 'graph' },
      { cost: 320, dmg: 120, rate: 0.5, range: 240, br: 'turbo' },
    ] },
    { id: 'book', col: '#f97316', col2: '#a855f7', air: 0, kind: 'shell', lv: [
      { cost: 120, dmg: 30, rate: 1.7, range: 130, splash: 44 },
      { cost: 110, dmg: 48, rate: 1.6, range: 138, splash: 48 },
      { cost: 170, dmg: 75, rate: 1.5, range: 146, splash: 54 },
      { cost: 330, dmg: 170, rate: 1.7, range: 155, splash: 64, stun: 0.6, br: 'dict' },
      { cost: 330, dmg: 85, rate: 1.4, range: 150, splash: 52, cluster: 4, br: 'cluster' },
    ] },
    { id: 'airco', col: '#7dd3fc', col2: '#2563eb', air: 1, kind: 'pulse', lv: [
      { cost: 90, dmg: 4, rate: 1.2, range: 92, slow: 0.35 },
      { cost: 85, dmg: 7, rate: 1.15, range: 100, slow: 0.42 },
      { cost: 130, dmg: 12, rate: 1.1, range: 108, slow: 0.5 },
      { cost: 270, dmg: 32, rate: 1, range: 118, slow: 0.55, br: 'blizzard' },
      { cost: 270, dmg: 16, rate: 1.1, range: 112, slow: 0.5, freeze: 1.1, br: 'freezer' },
    ] },
    { id: 'chem', col: '#4ade80', col2: '#c084fc', air: 0, kind: 'flask', lv: [
      { cost: 130, dmg: 14, rate: 2.2, range: 125, pool: 34, dps: 22, dur: 3 },
      { cost: 115, dmg: 20, rate: 2.1, range: 132, pool: 38, dps: 34, dur: 3 },
      { cost: 165, dmg: 30, rate: 2, range: 140, pool: 42, dps: 50, dur: 3.2 },
      { cost: 310, dmg: 45, rate: 1.9, range: 148, pool: 52, dps: 95, dur: 4, br: 'acid' },
      { cost: 310, dmg: 35, rate: 2, range: 148, pool: 56, dps: 60, dur: 3.6, cloud: 1, br: 'cloud' },
    ] },
    { id: 'plasma', col: '#a78bfa', col2: '#f43f5e', air: 1, kind: 'bolt', lv: [
      { cost: 150, dmg: 32, rate: 1.3, range: 112, chain: 3 },
      { cost: 130, dmg: 48, rate: 1.25, range: 118, chain: 4 },
      { cost: 190, dmg: 70, rate: 1.15, range: 125, chain: 5 },
      { cost: 340, dmg: 95, rate: 1.05, range: 132, chain: 8, br: 'storm' },
      { cost: 340, dmg: 160, rate: 1.2, range: 128, chain: 3, stun: 0.35, br: 'overload' },
    ] },
  ];
  const TG_KEYS = ['td_tg_first', 'td_tg_last', 'td_tg_strong', 'td_tg_close'];

  const _mem = {};
  function StorageGet(k, d) { try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (_) {} return k in _mem ? _mem[k] : d; }
  function StorageSet(k, v) { _mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function Stars() { return StorageGet(LS_STARS, {}) || {}; }
  function BestWaves() { return StorageGet(LS_WAVES, {}) || {}; }
  function Unlocked(i) { return i === 0 || (Stars()[MAPS[i - 1].id] || 0) > 0; }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis','Engels','Sport','Latijn','Economie','Chemie'];
    return Array.from({ length: 28 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }
  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75) return '#4ade80';
    if (Pct >= 50) return '#a3e635';
    if (Pct >= 25) return '#f97316';
    return '#f87171';
  }
  function BestGrade() {
    let b = null;
    for (const g of _grades) if (g.Pct != null && (!b || g.Pct > b.Pct)) b = g;
    return b || { subject: '', Pct: 90, label: '18/20' };
  }
  function WorstGrade() {
    let b = null;
    for (const g of _grades) if (g.Pct != null && (!b || g.Pct < b.Pct)) b = g;
    return b || { subject: '', Pct: 20, label: '4/20' };
  }

  let GS = null, _grades = [], _raf = null, _kh = null, _tobs = null, _last = 0;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _dark = false, _mapSel = 0;
  let _bg = null, _grid = null, _S = null, _ico = null, _eid = 0;

  function Rng(s) {
    return () => {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function BuildPath(wp) {
    const raw = wp.map(([x, y]) => [x * CELL + CELL / 2, y * CELL + CELL / 2]);
    const pts = [raw[0]], r = CELL / 2;
    for (let i = 1; i < raw.length - 1; i++) {
      const [ax, ay] = raw[i - 1], [bx, by] = raw[i], [cx, cy] = raw[i + 1];
      const p0x = bx - Math.sign(bx - ax) * r, p0y = by - Math.sign(by - ay) * r;
      const p2x = bx + Math.sign(cx - bx) * r, p2y = by + Math.sign(cy - by) * r;
      for (let s = 0; s <= 6; s++) {
        const t = s / 6, u = 1 - t;
        pts.push([u * u * p0x + 2 * u * t * bx + t * t * p2x, u * u * p0y + 2 * u * t * by + t * t * p2y]);
      }
    }
    pts.push(raw[raw.length - 1]);
    const n = pts.length;
    const P = { n, xs: new Float32Array(n), ys: new Float32Array(n), cum: new Float32Array(n), ux: new Float32Array(n), uy: new Float32Array(n), len: 0, wp };
    for (let i = 0; i < n; i++) { P.xs[i] = pts[i][0]; P.ys[i] = pts[i][1]; }
    for (let i = 0; i < n - 1; i++) {
      const dx = P.xs[i + 1] - P.xs[i], dy = P.ys[i + 1] - P.ys[i], l = Math.hypot(dx, dy) || 1;
      P.ux[i] = dx / l; P.uy[i] = dy / l;
      P.cum[i + 1] = P.cum[i] + l;
    }
    P.ux[n - 1] = P.ux[n - 2]; P.uy[n - 1] = P.uy[n - 2];
    P.len = P.cum[n - 1];
    return P;
  }

  let _px = 0, _py = 0;
  function PathAt(P, d, seg) {
    let i = seg;
    while (i < P.n - 2 && d > P.cum[i + 1]) i++;
    const t = Math.min(1, Math.max(0, (d - P.cum[i]) / (P.cum[i + 1] - P.cum[i])));
    _px = P.xs[i] + (P.xs[i + 1] - P.xs[i]) * t;
    _py = P.ys[i] + (P.ys[i + 1] - P.ys[i]) * t;
    return i;
  }

  function BuildGrid(M) {
    const g = new Uint8Array(COLS * ROWS);
    for (const wp of M.paths) {
      for (let i = 0; i < wp.length - 1; i++) {
        let [x, y] = wp[i];
        const [bx, by] = wp[i + 1], dx = Math.sign(bx - x), dy = Math.sign(by - y);
        for (;;) {
          if (x >= 0 && x < COLS && y >= 0 && y < ROWS) g[y * COLS + x] = 1;
          if (x === bx && y === by) break;
          x += dx; y += dy;
        }
      }
    }
    for (const [, x, y] of M.props) g[y * COLS + x] = 2;
    const [ex, ey] = M.paths[0][M.paths[0].length - 1];
    if (ex >= COLS) { if (ey > 0) g[(ey - 1) * COLS + COLS - 1] = 2; if (ey < ROWS - 1) g[(ey + 1) * COLS + COLS - 1] = 2; }
    return g;
  }

  function HpScale(w) { const x = w - 1; return 1 + 0.1 * x + 0.006 * x * x + 0.00042 * x * x * x; }

  function BuildWaves(mi) {
    return PLANS[mi].map((s, wi) => s.split(' ').map((tok, k) => {
      const c = tok[0] === 'B' ? `B${(wi + 1) / 10 | 0}` : tok[0];
      const n = c[0] === 'B' ? 1 : +tok.slice(1);
      return { c, n, gap: EN[c].gap * Math.max(0.55, 1 - wi * 0.015), at: k * 3.5 };
    }));
  }

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
    return { c, g, w, h, k, ax: w / 2, ay: h / 2 };
  }
  function Spr(w, h, fn, ay = h / 2, k = _k) {
    const s = Cv(w, h, k);
    s.ay = ay;
    s.g.translate(w / 2, ay);
    fn(s.g);
    return s;
  }
  function Shade(s, fill) {
    const g = s.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = fill;
    g.fillRect(0, 0, s.c.width, s.c.height);
    g.globalCompositeOperation = 'source-over';
    return s;
  }
  function Night(s) { return _dark ? Shade(s, 'rgba(16,24,64,0.26)') : s; }
  function Blit(s, x, y) { _ctx.drawImage(s.c, Math.round((x - s.ax) * _k) / _k, Math.round((y - s.ay) * _k) / _k, s.c.width / _k, s.c.height / _k); }

  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function Fl(g, c, lw = 1.5) { g.fillStyle = c; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); } }
  function Ln(g, x1, y1, x2, y2, c, lw) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = c; g.lineWidth = lw; g.stroke(); }
  function Glow(g, x, y, r, c, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, Rgba(c, a)); gr.addColorStop(0.45, Rgba(c, a * 0.45)); gr.addColorStop(1, Rgba(c, 0));
    g.fillStyle = gr; Circ(g, x, y, r); g.fill();
  }
  function Shadow(g, x, y, rx, ry, a = 0.24) { g.fillStyle = `rgba(20,16,34,${a})`; Ell(g, x, y, rx, ry); g.fill(); }

  function DrawBase(g, tier, col) {
    Shadow(g, 1, 14, 19, 6.5, 0.28);
    if (tier === 0) {
      RR(g, -16, -2, 32, 15, 6); Fl(g, '#8a5a32');
      for (const x of [-8, 0, 8]) Ln(g, x, 10.6, x, 12.4, '#6b4426', 1);
      RR(g, -16, -10, 32, 20, 6); Fl(g, '#c99358');
      for (const x of [-8, 0, 8]) Ln(g, x, -8.4, x, 8.4, '#a8733f', 1.1);
      Ln(g, -11, -7.6, 11, -7.6, 'rgba(255,255,255,0.35)', 1.3);
      g.fillStyle = '#6b4423';
      for (const [x, y] of [[-12, -6], [12, -6], [-12, 6], [12, 6]]) { Circ(g, x, y, 1); g.fill(); }
      return;
    }
    const top = tier === 3 ? '#d3d8df' : tier === 2 ? '#c2c8d1' : '#b2bac5';
    const side = tier === 3 ? '#434b5a' : tier === 2 ? '#626b79' : '#6f7785';
    RR(g, -17, -2, 34, 16, 6); Fl(g, side);
    for (const x of [-9, 0, 9]) Ln(g, x, 10.8, x, 13, Dk(side, 0.2), 1.1);
    if (tier >= 2) { g.fillStyle = tier === 3 ? '#f2c94c' : col; g.fillRect(-15.5, 10.4, 31, 2.3); }
    RR(g, -17, -11, 34, 21, 7); Fl(g, top);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      RR(g, -14.2 + c * 9.7 + (r ? 1.6 : 0) - (r && c === 2 ? 1.6 : 0), -8.4 + r * 8.6, r && c === 2 ? 8 : 8.4, 7.2, 2.4);
      g.fillStyle = (r + c) % 2 ? Lt(top, 0.16) : Dk(top, 0.05); g.fill();
      g.lineWidth = 0.8; g.strokeStyle = Dk(top, 0.2); g.stroke();
    }
    Ln(g, -12, -9.6, 12, -9.6, 'rgba(255,255,255,0.55)', 1.2);
    if (tier === 2) {
      for (const [x, y] of [[-14, -8], [14, -8], [-14, 7], [14, 7]]) { RR(g, x - 3, y - 3, 6, 6, 2); Fl(g, '#e0a93b', 1); }
    }
    if (tier === 3) {
      RR(g, -14.5, -8.6, 29, 16, 5); g.strokeStyle = '#f2c94c'; g.lineWidth = 1.4; g.stroke();
      for (const x of [-15, 15]) {
        Ln(g, x, -9, x, -25, '#5b4636', 1.4);
        Poly(g, [x, -25, x + (x < 0 ? -9 : 9), -22, x, -19]); Fl(g, col, 1);
      }
      Poly(g, [0, 8.8, 3.6, 12, 0, 15.2, -3.6, 12]); Fl(g, col, 1.1);
      Ln(g, -1, 10.6, 0.6, 11.8, 'rgba(255,255,255,0.8)', 0.9);
    }
  }

  function Mount(g, r, c, ring) {
    Shadow(g, 1, 2.2, r, r * 0.8, 0.3);
    Circ(g, 0, 0, r); Fl(g, c);
    g.beginPath(); g.arc(0, 0, r - 2, Math.PI * 1.1, Math.PI * 1.6); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.3; g.stroke();
    if (ring) { Circ(g, 0, 0, r - 2.6); g.strokeStyle = ring; g.lineWidth = 1.5; g.stroke(); }
  }

  function PencilPath(g, x0, x1, y, h, tip) {
    g.beginPath(); g.moveTo(x0 + 1.5, y - h); g.lineTo(x1 - tip, y - h); g.lineTo(x1, y); g.lineTo(x1 - tip, y + h); g.lineTo(x0 + 1.5, y + h);
    g.quadraticCurveTo(x0 - 1, y, x0 + 1.5, y - h); g.closePath();
  }
  function Pencil(g, x, y, L, w, body, lw = 1.3) {
    const h = w / 2, x0 = x - L / 2, x1 = x + L / 2, tip = Math.min(8, L * 0.32);
    PencilPath(g, x0, x1, y, h, tip);
    g.save(); g.clip();
    g.fillStyle = body; g.fillRect(x0 - 2, y - h, L + 4, w);
    g.fillStyle = Lt(body, 0.38); g.fillRect(x0, y - h, L, w * 0.32);
    g.fillStyle = Dk(body, 0.2); g.fillRect(x0, y + h - w * 0.3, L, w * 0.3);
    g.fillStyle = '#f9a8d4'; g.fillRect(x0 - 2, y - h, Math.max(2.5, L * 0.16), w);
    g.fillStyle = '#d1d5db'; g.fillRect(x0 - 2 + Math.max(2.5, L * 0.16), y - h, Math.max(1.6, L * 0.12), w);
    Poly(g, [x1 - tip, y - h - 1, x1 + 1, y, x1 - tip, y + h + 1]); g.fillStyle = '#f2d3a6'; g.fill();
    Poly(g, [x1 - tip * 0.4, y - h * 0.42, x1 + 1, y, x1 - tip * 0.4, y + h * 0.42]); g.fillStyle = '#3f3f46'; g.fill();
    g.restore();
    PencilPath(g, x0, x1, y, h, tip); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke();
  }

  function FountainPen(g) {
    RR(g, -10, -4.6, 22, 9.2, 4.6); Fl(g, '#1e3a8a');
    RR(g, -8, -3.4, 18, 2.2, 1); g.fillStyle = '#3b5fc4'; g.fill();
    g.fillStyle = '#f2c94c'; g.fillRect(9.4, -4.5, 2.4, 9);
    RR(g, -6, -6.4, 11, 2.4, 1.2); Fl(g, '#f2c94c', 1);
    Poly(g, [11.6, -4, 21.5, 0, 11.6, 4]); Fl(g, '#f2c94c', 1.2);
    Ln(g, 14.5, 0, 20.5, 0, '#7c5a10', 0.8);
    Circ(g, 15, 0, 0.9); g.fillStyle = '#7c5a10'; g.fill();
  }

  function TurretPencil(g, lv) {
    if (lv === 0) { Mount(g, 7.5, '#a8733f'); Pencil(g, 5, 0, 24, 7, '#facc15'); }
    else if (lv === 1) { Mount(g, 8.5, '#94a3b8'); Pencil(g, 5, -4, 24, 6.2, '#facc15'); Pencil(g, 5, 4, 24, 6.2, '#facc15'); }
    else if (lv === 2) { Mount(g, 9, '#cbd5e1', '#e0a93b'); Pencil(g, 4, -6, 21, 5.4, '#fbbf24'); Pencil(g, 4, 6, 21, 5.4, '#fbbf24'); Pencil(g, 7, 0, 26, 6.4, '#facc15'); }
    else if (lv === 3) { Mount(g, 9.5, '#1e293b', '#f2c94c'); FountainPen(g); }
    else {
      Mount(g, 9.5, '#475569', '#f2c94c');
      g.save(); g.rotate(-0.36); Pencil(g, 7, 0, 22, 5.4, '#ef4444'); g.restore();
      g.save(); g.rotate(0.36); Pencil(g, 7, 0, 22, 5.4, '#3b82f6'); g.restore();
      Pencil(g, 8, 0, 25, 6.2, '#22c55e');
    }
  }

  function TurretCalc(g, lv) {
    const body = ['#9aa7b8', '#6b7a90', '#4b5668', '#1f2937', '#ea7a25'][lv];
    const lens = lv === 3 ? '#c084fc' : lv === 4 ? '#facc15' : '#f43f5e';
    const L = lv >= 2 ? 24 : 21, H = lv >= 2 ? 18 : 16, ext = lv === 3 ? 6 : 0;
    Mount(g, 8, '#64748b');
    for (const y of lv === 2 || lv === 4 ? [-4.6, 4.6] : [0]) {
      RR(g, L / 2 - 3, y - 2.7, 9 + ext, 5.4, 2); Fl(g, '#334155', 1.2);
      Circ(g, L / 2 + 6 + ext, y, 2.8); Fl(g, lens, 1.1);
      Circ(g, L / 2 + 5.4 + ext, y - 0.9, 0.9); g.fillStyle = '#fff'; g.fill();
    }
    RR(g, -L / 2, -H / 2, L, H, 3.5); Fl(g, body);
    Ln(g, -L / 2 + 2.5, -H / 2 + 1.2, L / 2 - 2.5, -H / 2 + 1.2, Lt(body, 0.35), 1);
    RR(g, L / 2 - 9.5, -H / 2 + 2.4, 6.5, H - 4.8, 1.5); Fl(g, lv === 3 ? '#0f172a' : '#b6f0c8', 1);
    if (lv === 3) {
      g.beginPath();
      for (let i = 0; i <= 8; i++) { const yy = -H / 2 + 3.4 + i * (H - 6.8) / 8, xx = L / 2 - 6.25 + Math.sin(i * 0.9) * 2.2; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.strokeStyle = '#4ade80'; g.lineWidth = 0.9; g.stroke();
    } else {
      g.fillStyle = '#1f3b2c';
      g.fillRect(L / 2 - 7.6, -3.5, 1.1, 3); g.fillRect(L / 2 - 7.6, 0.8, 1.1, 3); g.fillRect(L / 2 - 5.6, -3.5, 1.1, 7.3);
    }
    const bw = (L - 13) / 3, bh = (H - 5) / 4;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      RR(g, -L / 2 + 2.2 + i * bw, -H / 2 + 2.5 + j * bh, bw - 1, bh - 1, 0.7);
      g.fillStyle = i === 0 && j === 3 ? '#fb923c' : Lt(body, lv === 3 ? 0.25 : 0.42); g.fill();
    }
    if (lv >= 1) { Ln(g, -L / 2 + 2, -H / 2 + 1, -L / 2 - 4, -H / 2 - 5, '#334155', 1.3); Circ(g, -L / 2 - 4, -H / 2 - 5, 1.6); Fl(g, lens, 0.9); }
    if (lv === 4) for (let i = 0; i < 3; i++) Ln(g, -L / 2 - 1.5, -4 + i * 4, -L / 2 + 0.5, -4 + i * 4, '#7c2d12', 1.2);
  }

  function Book(g, x, y, w, h, c, rot = 0, th = 3) {
    g.save(); g.translate(x, y); g.rotate(rot);
    RR(g, -w / 2, -h / 2, w, h + th, 1.6); Fl(g, Dk(c, 0.25), 1.2);
    g.fillStyle = '#f6f0e1'; g.fillRect(-w / 2 + 2, h / 2 - 0.2, w - 4, th - 0.6);
    Ln(g, -w / 2 + 3, h / 2 + th * 0.45, w / 2 - 3, h / 2 + th * 0.45, '#d8cfb8', 0.6);
    RR(g, -w / 2, -h / 2 - 0.5, w, h, 1.6); Fl(g, c, 1.2);
    g.fillStyle = Lt(c, 0.3); g.fillRect(-w / 2 + 2.5, -h / 2 + 1, 2, h - 2.5);
    g.restore();
  }
  function Books(g, lv) {
    if (lv === 3) { Book(g, 0, 1, 27, 11, '#7f1d1d', 0, 6); g.fillStyle = '#f2c94c'; g.fillRect(-6, -2.5, 12, 1.4); g.fillRect(-4, 0, 8, 1); return; }
    const cols = [['#dc2626'], ['#2563eb', '#dc2626'], ['#16a34a', '#2563eb', '#dc2626'], [], ['#16a34a', '#2563eb', '#dc2626']][lv];
    cols.forEach((c, i) => Book(g, (i % 2 ? 1 : -1), 3 - i * 4.2, 27 - i * 2.5, 7, c, i % 2 ? 0.05 : -0.05));
  }
  function Barrel(g, x, y, s, c, band) {
    RR(g, x - 6 * s, y - 6 * s, 18 * s, 12 * s, 5 * s); Fl(g, c, 1.4);
    RR(g, x - 4 * s, y - 4.6 * s, 14 * s, 2.8 * s, 1.4 * s); g.fillStyle = Lt(c, 0.3); g.fill();
    if (band) { g.fillStyle = band; g.fillRect(x + 1 * s, y - 6 * s + 0.7, 2.2 * s, 12 * s - 1.4); g.fillRect(x + 7 * s, y - 6 * s + 0.7, 2.2 * s, 12 * s - 1.4); }
    Ell(g, x + 12 * s, y, 3 * s, 6.2 * s); Fl(g, Dk(c, 0.25), 1.3);
    Ell(g, x + 12.6 * s, y, 1.8 * s, 4.2 * s); g.fillStyle = '#0b0b10'; g.fill();
  }
  function TurretBook(g, lv) {
    Mount(g, 7, '#52525b');
    if (lv === 4) { Barrel(g, 0, -5.5, 0.72, '#4b5563', '#d9a441'); Barrel(g, 0, 5.5, 0.72, '#4b5563', '#d9a441'); Barrel(g, 3, 0, 0.8, '#374151', '#f2c94c'); }
    else if (lv === 3) Barrel(g, 0, 0, 1.25, '#1f2937', '#f2c94c');
    else Barrel(g, 0, 0, lv === 2 ? 1.1 : 1, '#4b5563', lv ? '#d9a441' : null);
  }

  function Airco(g, lv) {
    const W = [24, 27, 30, 30, 30][lv];
    const body = lv === 3 ? '#9cc8fb' : '#eef2f7', lid = lv === 4 ? '#3b82f6' : Lt(body, 0.4);
    RR(g, -W / 2, -12, W, 20, 3); Fl(g, Dk(body, 0.13));
    for (let i = 0; i < 3; i++) Ln(g, -W / 2 + 3, 1.6 + i * 2, W / 2 - 3, 1.6 + i * 2, Dk(body, 0.32), 0.9);
    RR(g, -W / 2, -16, W, 13, 3); Fl(g, lid);
    if (lv >= 1 && lv < 3) { g.fillStyle = '#38bdf8'; g.fillRect(-W / 2 + 1, -2.6, W - 2, 1.8); }
    Circ(g, -W / 4 + 1, -9.5, 5.4); Fl(g, '#475569', 1.2);
    Circ(g, -W / 4 + 1, -9.5, 4.3); g.fillStyle = '#1e293b'; g.fill();
    for (let i = 0; i < 4; i++) Ln(g, W / 4 - 4 + i * 2.4, -13.5, W / 4 - 4 + i * 2.4, -5.5, Dk(lid, 0.25), 0.9);
    Circ(g, W / 2 - 3.5, 5.4, 1.1); g.fillStyle = '#22d3ee'; g.fill();
    if (lv >= 2) for (let i = 0; i < 5; i++) { const x = -W / 2 + 3 + i * (W - 6) / 4; Poly(g, [x - 1.6, 8, x + 1.6, 8, x, 11.5 + (i % 2) * 1.6]); Fl(g, '#e0f2fe', 0.8); }
    if (lv === 3) for (const [x, h] of [[W / 4 - 3, 8], [W / 4 + 2, 6], [W / 4 + 6, 7]]) { Poly(g, [x - 2, -12, x, -12 - h, x + 2, -12]); Fl(g, '#dbeafe', 0.9); }
    if (lv === 4) { for (const [x, h] of [[-W / 2 + 2, 6], [W / 2 - 2, 7]]) { Poly(g, [x - 2, -15, x, -15 - h, x + 2, -15]); Fl(g, '#bfdbfe', 0.9); } }
  }
  function Fan(g, lv) {
    const c = lv === 3 ? '#e0f2fe' : lv === 4 ? '#bfdbfe' : '#cbd5e1';
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * TAU / 4); Ell(g, 2.2, 0, 2.4, 1.2); g.fillStyle = c; g.fill(); g.restore(); }
    Circ(g, 0, 0, 1.1); g.fillStyle = '#94a3b8'; g.fill();
  }

  function Flask(g, x, y, r, liquid) {
    RR(g, x - 2.6, y - r - 7, 5.2, 8, 1.5); g.fillStyle = 'rgba(224,242,254,0.7)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
    RR(g, x - 3.3, y - r - 10, 6.6, 3.6, 1.2); Fl(g, '#b07a45', 1.1);
    Circ(g, x, y, r); g.fillStyle = 'rgba(224,242,254,0.6)'; g.fill();
    g.save(); Circ(g, x, y, r); g.clip();
    g.fillStyle = liquid; g.fillRect(x - r, y - r * 0.15, r * 2, r * 1.2);
    g.fillStyle = Lt(liquid, 0.4); g.fillRect(x - r, y - r * 0.15, r * 2, 1.2);
    g.fillStyle = Dk(liquid, 0.15); g.fillRect(x - r, y + r * 0.55, r * 2, r);
    g.restore();
    Circ(g, x, y, r); g.lineWidth = 1.3; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); g.arc(x, y, r - 2.2, Math.PI * 1.05, Math.PI * 1.45); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.4; g.stroke();
  }
  function Chem(g, lv) {
    const liquid = lv === 3 ? '#facc15' : lv === 4 ? '#a855f7' : '#4ade80';
    Ln(g, -6, 6, -8, 10, '#475569', 1.6); Ln(g, 6, 6, 8, 10, '#475569', 1.6); Ln(g, 0, 6, 0, 10, '#475569', 1.6);
    RR(g, -8, 3, 16, 3.2, 1.5); Fl(g, '#64748b', 1.1);
    if (lv >= 1) {
      RR(g, 8, -6, 8, 10, 1.5); Fl(g, '#a8733f', 1);
      for (const [x, c] of [[10.2, '#f472b6'], [13.6, '#38bdf8']]) { RR(g, x - 1.3, -11, 2.6, 11, 1.3); g.fillStyle = 'rgba(224,242,254,0.75)'; g.fill(); g.fillStyle = c; g.fillRect(x - 1.3, -6, 2.6, 4.6); g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke(); }
    }
    if (lv >= 2 && lv !== 3) { Flask(g, -10, -3, 4.6, lv === 4 ? '#e879f9' : '#22d3ee'); }
    if (lv === 3) {
      RR(g, -9, -16, 18, 19, 3); g.fillStyle = 'rgba(224,242,254,0.6)'; g.fill();
      g.save(); RR(g, -9, -16, 18, 19, 3); g.clip(); g.fillStyle = liquid; g.fillRect(-9, -9, 18, 12); g.fillStyle = Lt(liquid, 0.45); g.fillRect(-9, -9, 18, 1.4); g.restore();
      RR(g, -9, -16, 18, 19, 3); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke();
      Ln(g, -6, -13, -6, 0, 'rgba(255,255,255,0.8)', 1.4);
      for (let i = 0; i < 3; i++) Ln(g, 5, -12 + i * 4, 8, -12 + i * 4, 'rgba(43,34,54,0.5)', 0.8);
      return;
    }
    Flask(g, 0, -4, lv >= 2 ? 8.5 : 7.5, liquid);
    if (lv === 4) { Glow(g, 0, -20, 7, '#c084fc', 0.5); }
  }

  function Plasma(g, lv) {
    const r = [8.5, 9.5, 10.5, 11, 11][lv], cy = -10;
    const tint = lv === 3 ? '#60a5fa' : lv === 4 ? '#f43f5e' : '#8b5cf6';
    RR(g, -7, -3, 14, 11, 3); Fl(g, '#475569');
    Ell(g, 0, -3, 7, 2.6); Fl(g, '#64748b', 1.1);
    if (lv >= 1) for (let i = 0; i < 3; i++) { Ell(g, 0, 1 + i * 2.3, 7.4, 1.6); g.strokeStyle = '#d97706'; g.lineWidth = 1.2; g.stroke(); }
    Glow(g, 0, cy, r + 7, tint, 0.35);
    const gr = g.createRadialGradient(0, cy, 1, 0, cy, r);
    gr.addColorStop(0, '#f5f3ff'); gr.addColorStop(0.35, Lt(tint, 0.2)); gr.addColorStop(1, Dk(tint, 0.55));
    Circ(g, 0, cy, r); g.fillStyle = gr; g.fill(); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); g.arc(0, cy, r - 2.4, Math.PI * 1.08, Math.PI * 1.5); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.5; g.stroke();
    if (lv >= 2) { g.beginPath(); g.ellipse(0, cy + 1, r + 3.5, 3.4, 0, 0, Math.PI); g.strokeStyle = '#f2c94c'; g.lineWidth = 1.6; g.stroke(); }
    if (lv === 4) for (const a of [-0.6, 0, 0.6]) { const x = Math.sin(a) * r, y = cy - Math.cos(a) * r; Ln(g, x, y, x * 1.45, cy + (y - cy) * 1.45, '#334155', 1.4); Circ(g, x * 1.45, cy + (y - cy) * 1.45, 1.4); Fl(g, '#fda4af', 0.8); }
  }

  function BuildTowerSprites() {
    const out = {};
    for (const D of TOWERS) {
      out[D.id] = D.lv.map((L, lv) => {
        const tier = lv < 3 ? lv : 3, col = lv === 4 ? D.col2 : D.col;
        const base = Spr(46, 58, g => {
          DrawBase(g, tier, col);
          if (D.id === 'book') Books(g, lv);
          if (D.id === 'airco') { g.translate(0, 2); Airco(g, lv); }
          if (D.id === 'chem') { g.translate(0, -2); Chem(g, lv); }
          if (D.id === 'plasma') { g.translate(0, -1); Plasma(g, lv); }
        }, 34);
        let top = null;
        if (D.id === 'pencil') top = Spr(56, 40, g => TurretPencil(g, lv));
        if (D.id === 'calc') top = Spr(56, 40, g => TurretCalc(g, lv));
        if (D.id === 'book') top = Spr(56, 40, g => TurretBook(g, lv));
        const fan = D.id === 'airco' ? Spr(14, 14, g => Fan(g, lv)) : null;
        return { base: Night(base), top: top && Night(top), fan };
      });
    }
    return out;
  }

  function Eyes(g, x, y, s, mood, iris = OUT) {
    for (const dx of [-3.1 * s, 3.1 * s]) {
      Ell(g, x + dx, y, 2.4 * s, 2.8 * s); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke();
      Circ(g, x + dx + 0.9 * s, y + 0.4 * s, 1.25 * s); g.fillStyle = iris; g.fill();
    }
    if (mood === 1) { Ln(g, x - 5.6 * s, y - 3.8 * s, x - 1.2 * s, y - 2.3 * s, OUT, 1.2 * s); Ln(g, x + 1.2 * s, y - 2.3 * s, x + 5.6 * s, y - 3.8 * s, OUT, 1.2 * s); }
    if (mood === 2) { Ln(g, x - 5.6 * s, y - 1.2 * s, x - 0.8 * s, y - 1.2 * s, OUT, 1.6 * s); Ln(g, x + 0.8 * s, y - 1.2 * s, x + 5.6 * s, y - 1.2 * s, OUT, 1.6 * s); }
  }
  function Legs(g, x, y, sw, len, lw = 1.7, gap = 3) {
    Ln(g, x - gap, y, x - gap + sw, y + len, OUT, lw); Ln(g, x + gap, y, x + gap - sw, y + len, OUT, lw);
    Ell(g, x - gap + sw + 1, y + len, 2.2 * lw / 1.7, 1.3 * lw / 1.7); g.fillStyle = OUT; g.fill();
    Ell(g, x + gap - sw + 1, y + len, 2.2 * lw / 1.7, 1.3 * lw / 1.7); g.fill();
  }
  function Paper(g, w, h, c = '#fbfaf5') {
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2 - 4, -h / 2); g.lineTo(w / 2, -h / 2 + 4); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath();
    Fl(g, c, 1.3);
    Poly(g, [w / 2 - 4, -h / 2, w / 2 - 4, -h / 2 + 4, w / 2, -h / 2 + 4]); Fl(g, Dk(c, 0.1), 1);
  }
  function RedX(g, x, y, s) { Ln(g, x - s, y - s, x + s, y + s, '#ef4444', 1.5); Ln(g, x + s, y - s, x - s, y + s, '#ef4444', 1.5); }

  function DrawEnemy(g, c, f) {
    const ph = f / 4 * TAU, sw = Math.sin(ph), bob = -Math.abs(Math.cos(ph)) * 1.2;
    if (c === 'S' || c === 'm' || c === 'T') {
      const s = c === 'm' ? 0.74 : 1;
      Shadow(g, 0, 12 * s, 8 * s, 2.6 * s);
      g.scale(s, s);
      Legs(g, 0, 7, sw * 2.6, 5);
      g.translate(0, bob); g.rotate(sw * 0.04);
      Paper(g, 16, 20);
      if (c === 'T') {
        g.fillStyle = '#334155'; g.fillRect(-5.5, -7.5, 8, 1.6);
        for (const y of [1, 4.5]) Ln(g, -5.5, y, 0, y, '#9ec5f8', 0.9);
        Circ(g, 3.6, 3.6, 3.6); g.strokeStyle = '#ef4444'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#ef4444'; g.font = `900 6px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2', 3.6, 3.9);
        Eyes(g, 0.5, -3.2, 0.78, 1);
      } else {
        for (const y of [-1.5, 2, 5.5]) Ln(g, -5, y, 6, y, '#9ec5f8', 0.9);
        Ln(g, -5.4, -9.4, -5.4, 9.4, '#f6a3a3', 0.8);
        Eyes(g, 0.5, -4.6, 0.85, 1);
        RedX(g, 3.4, 4.4, 2.1);
      }
    } else if (c === 'F') {
      Shadow(g, 0, 10, 7, 2.2);
      Legs(g, 0, 5, sw * 3.6, 4.2, 1.5, 2.6);
      Ln(g, -11, -2 + sw, -14, -2 + sw, 'rgba(43,34,54,0.4)', 1); Ln(g, -11, 2, -15, 2, 'rgba(43,34,54,0.4)', 1);
      g.translate(0, bob * 1.4); g.rotate(-0.08 + sw * 0.05);
      RR(g, -7, -8, 14, 13.5, 1.5); Fl(g, '#fde047', 1.3);
      Poly(g, [2.5, 5.5, 7, 1, 7, 5.5]); Fl(g, '#eab308', 1);
      Ln(g, -4.5, 0.5, 3, 0.5, '#a16207', 0.8); Ln(g, -4.5, 3, 0.5, 3, '#a16207', 0.8);
      Eyes(g, 0.3, -3.6, 0.72, 2);
    } else if (c === 'A') {
      Shadow(g, 0, 13, 10, 3);
      Legs(g, 0, 8, sw * 2, 4.6, 2.4, 4);
      g.translate(0, bob * 0.8);
      RR(g, -11, -12, 22, 21, 2.6); Fl(g, '#2563eb', 1.4);
      Ln(g, -3, -10.6, 8.5, -10.6, '#60a5fa', 1.2);
      RR(g, -11, -12, 6, 21, 2); Fl(g, '#1d4ed8', 1.2);
      RR(g, -10.2, -7.5, 4.4, 7, 0.8); g.fillStyle = '#f8fafc'; g.fill();
      for (const y of [-8.5, -2, 4.5]) { Ell(g, -5, y, 2.2, 1.6); g.strokeStyle = '#e2e8f0'; g.lineWidth = 1.4; g.stroke(); }
      Poly(g, [11, -12, 11, -6, 5, -12]); Fl(g, '#cbd5e1', 1); Poly(g, [11, 9, 11, 3, 5, 9]); Fl(g, '#cbd5e1', 1);
      Eyes(g, 3, -3.5, 0.95, 1);
      Ln(g, 0.5, 3.6, 5.5, 3.6, OUT, 1.3);
    } else if (c === 'P') {
      const fl = 1 + sw * 0.07;
      Poly(g, [13, 0, -10, -10 * fl, -5, 0]); Fl(g, '#ffffff', 1.3);
      Poly(g, [13, 0, -5, 0, -10, 10 * fl]); Fl(g, '#dfe6ef', 1.3);
      Poly(g, [13, 0, -8, 0, -9, 2.6]); Fl(g, '#c3cdd9', 1);
      Ln(g, 12, -0.4, -7, -5.6 * fl, '#cbd5e1', 0.8);
      g.fillStyle = '#ef4444'; Poly(g, [-10, -10 * fl, -8.4, -8.2 * fl, -7.4, -9 * fl]); g.fill(); Poly(g, [-10, 10 * fl, -8.4, 8.2 * fl, -7.4, 9 * fl]); g.fill();
      for (const y of [-2.7, 2.7]) { Ell(g, 4.5, y, 2.2, 2); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke(); Circ(g, 5.4, y, 1.1); g.fillStyle = OUT; g.fill(); }
      Ln(g, 2.2, -5.2, 6.4, -4.4, OUT, 1.1); Ln(g, 2.2, 5.2, 6.4, 4.4, OUT, 1.1);
    } else if (c === 'H') {
      Shadow(g, 0, 11, 9.5, 2.8);
      g.translate(0, -Math.abs(sw) * 1.4);
      RR(g, -14, 4.5, 12, 3.4, 1.2); Fl(g, '#e9d8b0', 1);
      Circ(g, 0, -1, 10); Fl(g, '#e9d8b0', 1.4);
      Circ(g, 0, -1, 7.6); g.strokeStyle = '#d6c293'; g.lineWidth = 1; g.stroke();
      const a = f * TAU / 4;
      g.beginPath(); g.arc(0, -1, 8.6, a, a + 1.3); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.6; g.stroke();
      Circ(g, 0, -1, 4.6); Fl(g, '#c9a46a', 1.2);
      Circ(g, 0, -1, 2.5); g.fillStyle = '#5b4a35'; g.fill();
      Eyes(g, 0, -6.4, 0.7, 1);
      Circ(g, 7.5, -8.5, 4.2); Fl(g, '#22c55e', 1.2);
      Ln(g, 7.5, -10.6, 7.5, -6.4, '#fff', 1.6); Ln(g, 5.4, -8.5, 9.6, -8.5, '#fff', 1.6);
    } else if (c === 'X') {
      Shadow(g, 0, 13, 10, 3);
      Legs(g, 0, 8, sw * 2.2, 4.6, 2, 3.6);
      g.translate(0, bob);
      g.save(); g.rotate(-0.1); g.translate(-2, -1.5); Paper(g, 18, 21, '#e4e0d4'); g.restore();
      g.save(); g.rotate(0.07); g.translate(1.5, -0.5); Paper(g, 18, 21, '#efece4'); g.restore();
      Paper(g, 18, 21);
      for (const y of [0, 3.5]) Ln(g, -5.5, y, 6.5, y, '#9ec5f8', 0.9);
      RR(g, -4.5, -13, 9, 4.2, 1); Fl(g, '#1f2937', 1);
      g.beginPath(); g.arc(-2.2, -13.4, 2.4, Math.PI, TAU); g.moveTo(4.6, -13.4); g.arc(2.2, -13.4, 2.4, 0, Math.PI, true); g.strokeStyle = '#cbd5e1'; g.lineWidth = 1.1; g.stroke();
      Eyes(g, 0.5, -4.8, 0.85, 1);
      RedX(g, 4, 6, 1.8);
    } else if (c === 'B1') {
      Shadow(g, 0, 27, 20, 5);
      Legs(g, 0, 15, sw * 4, 9, 3.4, 8);
      g.translate(0, bob * 1.5);
      RR(g, -15, -21, 34, 38, 3); Fl(g, '#d9d2bf', 1.4);
      RR(g, -17, -23, 34, 38, 3); Fl(g, '#f4efe0', 1.6);
      for (const y of [-14, 6]) { g.fillStyle = '#cbd5e1'; g.fillRect(-15.5, y, 2.4, 6); g.lineWidth = 0.8; g.strokeStyle = OUT; g.strokeRect(-15.5, y, 2.4, 6); }
      RR(g, -10, -19, 20, 7, 1.5); Fl(g, '#ffffff', 1.1);
      Ln(g, -7, -15.5, 7, -15.5, '#94a3b8', 1);
      Circ(g, 12, -18, 5.2); Fl(g, '#ef4444', 1.3);
      Ln(g, 12, -20.6, 12, -17.4, '#fff', 1.8); Circ(g, 12, -15.4, 0.9); g.fillStyle = '#fff'; g.fill();
      Eyes(g, 0, -4, 1.6, 1);
      Poly(g, [-9, 5, 9, 5, 7, 11, -7, 11]); Fl(g, '#7f1d1d', 1.3);
      g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { Poly(g, [-8 + i * 3.4, 5, -6.3 + i * 3.4, 8, -4.6 + i * 3.4, 5]); g.fill(); }
    } else if (c === 'B2') {
      Shadow(g, 0, 29, 22, 5.5);
      Legs(g, 0, 17, sw * 4, 9, 3.6, 9);
      g.translate(0, bob * 1.5);
      RR(g, -20, -22, 40, 42, 4); Fl(g, '#1e3a8a', 1.6);
      RR(g, -17, -19, 34, 36, 3); g.strokeStyle = '#f2c94c'; g.lineWidth = 1.4; g.stroke();
      Ln(g, -14, -21, 14, -21, '#3b5fc4', 1.4);
      for (const x of [-7, 7]) { Circ(g, x, -31, 3.4); Fl(g, '#f59e0b', 1.2); }
      Circ(g, 0, -27, 8); Fl(g, '#dc2626', 1.5);
      Circ(g, 0, -27, 5.8); Fl(g, '#fff', 1);
      Ln(g, 0, -27, 0, -31, OUT, 1.2); Ln(g, 0, -27, 3, -26, OUT, 1.2);
      for (const dx of [-6, 6]) { Glow(g, dx, -4, 7, '#fde047', 0.55); Ell(g, dx, -4, 3.6, 3); Fl(g, '#fde047', 1.1); Circ(g, dx + 1, -3.6, 1.3); g.fillStyle = OUT; g.fill(); }
      Ln(g, -10.5, -9.5, -2.5, -6.5, OUT, 2); Ln(g, 2.5, -6.5, 10.5, -9.5, OUT, 2);
      g.beginPath(); g.arc(0, 11, 7, Math.PI * 1.15, Math.PI * 1.85); g.strokeStyle = OUT; g.lineWidth = 2.2; g.stroke();
    } else {
      Shadow(g, 0, 31, 26, 6);
      Legs(g, 0, 19, sw * 4.5, 9, 4, 10);
      g.translate(0, bob * 1.6);
      Glow(g, 0, -4, 34, '#a855f7', 0.25);
      RR(g, -23, -24, 46, 46, 5); Fl(g, '#991b1b', 1.8);
      g.fillStyle = '#7f1d1d'; g.fillRect(-23, -24 + 2, 7, 42);
      RR(g, -23, -24, 7, 46, 3); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke();
      for (const [x, y, dx, dy] of [[23, -24, -1, 1], [23, 22, -1, -1], [-16, -24, 1, 1], [-16, 22, 1, -1]]) { Poly(g, [x, y, x + dx * 9, y, x, y + dy * 9]); Fl(g, '#f2c94c', 1.1); }
      Poly(g, [-14, -24, -14, -34, -8, -28, 0, -36, 8, -28, 14, -34, 14, -24]); Fl(g, '#f2c94c', 1.5);
      for (const x of [-14, 0, 14]) { Circ(g, x, x ? -34 : -36, 2); Fl(g, '#ef4444', 1); }
      for (const dx of [-7, 8]) { Glow(g, dx, -6, 9, '#d946ef', 0.6); Ell(g, dx, -6, 4.2, 3.4); Fl(g, '#f0abfc', 1.2); Circ(g, dx + 1, -5.6, 1.5); g.fillStyle = OUT; g.fill(); }
      Ln(g, -13, -12.5, -3, -8.5, OUT, 2.4); Ln(g, 3, -8.5, 14, -12.5, OUT, 2.4);
      Poly(g, [-11, 5, 12, 5, 9, 13, -8, 13]); Fl(g, '#450a0a', 1.5);
      g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { Poly(g, [-10 + i * 3.7, 5, -8.2 + i * 3.7, 8.6, -6.4 + i * 3.7, 5]); g.fill(); Poly(g, [-8 + i * 3.4, 13, -6.3 + i * 3.4, 10, -4.6 + i * 3.4, 13]); g.fill(); }
    }
  }
  const EN_BOX = { S: [34, 38, 22], m: [28, 30, 18], T: [34, 38, 22], F: [36, 32, 19], A: [36, 40, 23], P: [32, 28, 14], H: [36, 36, 21], X: [36, 42, 25], B1: [64, 80, 46], B2: [70, 90, 52], B3: [86, 96, 58] };

  function Copy(s, flip, fill) {
    const f = Cv(s.w, s.h, s.k);
    f.ay = s.ay;
    f.g.setTransform(flip ? -1 : 1, 0, 0, 1, flip ? s.c.width : 0, 0);
    f.g.drawImage(s.c, 0, 0);
    return fill ? Shade(f, fill) : f;
  }
  function BuildEnemySprites() {
    const out = {};
    for (const c of EN_CODES) {
      const [w, h, ay] = EN_BOX[c], R = [[], [], []], L = [[], [], []];
      for (let i = 0; i < 4; i++) {
        const s = Night(Spr(w, h, g => DrawEnemy(g, c, i), ay));
        R[0].push(s); R[1].push(Copy(s, 0, 'rgba(255,255,255,0.86)')); R[2].push(Copy(s, 0, 'rgba(96,190,250,0.42)'));
        for (let j = 0; j < 3; j++) L[j].push(Copy(R[j][i], 1));
      }
      out[c] = [R, L];
    }
    return out;
  }

  function BuildFxSprites() {
    const S = {};
    S.glow = {};
    for (const [n, c] of Object.entries({ y: '#fde68a', r: '#fb7185', c: '#67e8f9', o: '#fdba74', g: '#86efac', v: '#c4b5fd', w: '#ffffff', b: '#93c5fd', p: '#e879f9' })) S.glow[n] = Spr(32, 32, g => Glow(g, 0, 0, 16, c, 1));
    S.ring = {};
    for (const [n, c] of Object.entries({ c: '#a5f3fc', g: '#86efac', b: '#7dd3fc', w: '#ffffff', o: '#fed7aa', v: '#ddd6fe' })) {
      S.ring[n] = Spr(64, 64, g => {
        const gr = g.createRadialGradient(0, 0, 18, 0, 0, 31);
        gr.addColorStop(0, Rgba(c, 0)); gr.addColorStop(0.72, Rgba(c, 0.9)); gr.addColorStop(0.86, Rgba('#ffffff', 0.95)); gr.addColorStop(1, Rgba(c, 0));
        g.fillStyle = gr; Circ(g, 0, 0, 31); g.fill();
      });
    }
    S.smoke = {};
    for (const [n, c] of Object.entries({ w: '#f8fafc', d: '#64748b', g: '#86efac', v: '#d8b4fe', b: '#dbeafe', y: '#fde68a' })) {
      S.smoke[n] = Spr(24, 24, g => { const gr = g.createRadialGradient(-2, -2, 1, 0, 0, 12); gr.addColorStop(0, Rgba(Lt(c, 0.3), 0.95)); gr.addColorStop(0.6, Rgba(c, 0.7)); gr.addColorStop(1, Rgba(c, 0)); g.fillStyle = gr; Circ(g, 0, 0, 12); g.fill(); });
    }
    S.dart = {};
    for (const [n, c] of Object.entries({ y: '#facc15', r: '#ef4444', b: '#3b82f6', g: '#22c55e' })) S.dart[n] = Spr(18, 8, g => Pencil(g, 0, 0, 14, 3.6, c, 1));
    S.ink = Spr(16, 10, g => { Ell(g, 0, 0, 6.5, 3.4); Fl(g, '#1e40af', 1.1); Ell(g, -1.5, -1, 2.6, 1); g.fillStyle = '#93c5fd'; g.fill(); });
    S.book = ['#dc2626', '#2563eb', '#16a34a', '#7f1d1d'].map(c => Spr(18, 16, g => Book(g, 0, -1, 12, 8, c, 0, 2.6)));
    S.flask = ['#4ade80', '#facc15', '#a855f7'].map(c => Spr(14, 20, g => Flask(g, 0, 5, 4.4, c)));
    S.puddle = [['#5fd07f', '#1f7a3d'], ['#e8c54d', '#94700f'], ['#b685e3', '#5b2391']].map(([c, d]) => Night(Spr(80, 60, g => {
      const R = Rng(c.length * 31 + c.charCodeAt(1));
      g.fillStyle = Rgba(d, 0.5);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = 21 + R() * 7; Ell(g, Math.cos(a) * 14, Math.sin(a) * 9, rr * 0.7, rr * 0.5); g.fill(); }
      g.fillStyle = Rgba(c, 0.5);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, rr = 17 + R() * 6; Ell(g, Math.cos(a) * 12, Math.sin(a) * 7.5, rr * 0.7, rr * 0.5); g.fill(); }
      g.fillStyle = Rgba(Lt(c, 0.55), 0.55);
      for (let i = 0; i < 6; i++) { Circ(g, (R() - 0.5) * 36, (R() - 0.5) * 22, 1.5 + R() * 2.5); g.fill(); }
    })));
    S.bubble = Spr(48, 48, g => {
      const gr = g.createRadialGradient(-6, -8, 2, 0, 0, 23);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.55, 'rgba(125,211,252,0.16)'); gr.addColorStop(0.9, 'rgba(56,189,248,0.42)'); gr.addColorStop(1, 'rgba(56,189,248,0)');
      g.fillStyle = gr; Circ(g, 0, 0, 23); g.fill();
      g.beginPath(); g.arc(0, 0, 20, Math.PI * 1.1, Math.PI * 1.45); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.stroke();
    });
    S.ice = Spr(36, 36, g => {
      RR(g, -13, -15, 26, 28, 5); g.fillStyle = 'rgba(191,219,254,0.55)'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(30,64,175,0.55)'; g.stroke();
      Ln(g, -8, -10, -2, -12, 'rgba(255,255,255,0.9)', 2); Ln(g, -9, -6, -9, 4, 'rgba(255,255,255,0.7)', 1.5);
      Ln(g, 4, 2, 9, 8, 'rgba(255,255,255,0.5)', 1);
    });
    S.snow = Spr(10, 10, g => { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI / 3); Ln(g, -3.6, 0, 3.6, 0, '#ffffff', 1.1); g.restore(); } Circ(g, 0, 0, 1); g.fillStyle = '#e0f2fe'; g.fill(); });
    S.star = Spr(10, 10, g => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 1.8 : 4.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); Fl(g, '#fde047', 0.9); });
    S.plus = Spr(10, 10, g => { RR(g, -1.5, -4, 3, 8, 1); Fl(g, '#4ade80', 0.8); RR(g, -4, -1.5, 8, 3, 1); Fl(g, '#4ade80', 0.8); RR(g, -1, -3.4, 2, 6.8, 0.8); g.fillStyle = '#4ade80'; g.fill(); });
    S.scrap = ['#fbfaf5', '#dbeafe', '#fde047', '#fecaca'].map(c => Spr(8, 7, g => { RR(g, -3, -2.4, 6, 4.8, 0.6); Fl(g, c, 0.8); Ln(g, -2, -0.4, 2, -0.4, '#93c5fd', 0.6); }));
    S.spark = Spr(10, 4, g => { Ell(g, 0, 0, 4.6, 1.2); g.fillStyle = '#fff7cc'; g.fill(); });
    S.planeShadow = Spr(32, 28, g => { Poly(g, [13, 0, -10, -10, -5, 0, -10, 10]); g.fillStyle = 'rgba(20,16,34,0.22)'; g.fill(); });
    return S;
  }

  function HeartIcon(g) { g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-9, 0, -7, -8, 0, -4); g.bezierCurveTo(7, -8, 9, 0, 0, 6); g.closePath(); Fl(g, '#ef4444', 1.4); Ell(g, -3.4, -3, 1.6, 1.1); g.fillStyle = '#fecaca'; g.fill(); }
  function CoinIcon(g) { Circ(g, 0, 0, 6.5); Fl(g, '#f59e0b', 1.4); Circ(g, 0, 0, 4.4); g.strokeStyle = '#fde68a'; g.lineWidth = 1.1; g.stroke(); Ln(g, 0, -2.4, 0, 2.4, '#b45309', 1.6); }
  function FlagIcon(g) { Ln(g, -4, -7, -4, 7, OUT, 1.6); Poly(g, [-4, -7, 6, -4, -4, -0.5]); Fl(g, '#22d3ee', 1.2); }
  function StarIcon(g, on) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 2.9 : 6.6; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); Fl(g, on ? '#facc15' : 'rgba(148,163,184,0.45)', 1.3); if (on) { Ell(g, -1.5, -1.8, 1.4, 0.9); g.fillStyle = '#fef9c3'; g.fill(); } }
  function LockIcon(g) { g.beginPath(); g.arc(0, -2, 4, Math.PI, TAU); g.strokeStyle = OUT; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = '#94a3b8'; g.lineWidth = 1.8; g.stroke(); RR(g, -6, -2, 12, 9, 2); Fl(g, '#f59e0b', 1.3); Circ(g, 0, 2, 1.4); g.fillStyle = OUT; g.fill(); }

  function BuildIcons() {
    const k = Math.max(2, Math.min(3, (W.devicePixelRatio || 1) * 1.5));
    const U = s => s.c.toDataURL();
    const I = {
      heart: U(Spr(16, 16, HeartIcon, 8, k)), coin: U(Spr(16, 16, CoinIcon, 8, k)), wave: U(Spr(16, 16, FlagIcon, 8, k)),
      star: U(Spr(16, 16, g => StarIcon(g, 1), 8, k)), star0: U(Spr(16, 16, g => StarIcon(g, 0), 8, k)), lock: U(Spr(16, 16, LockIcon, 8, k)),
      tw: {}, en: {},
    };
    for (const D of TOWERS) {
      I.tw[D.id] = D.lv.map((L, lv) => U(Spr(46, 46, g => {
        g.translate(0, 4);
        DrawBase(g, lv < 3 ? lv : 3, lv === 4 ? D.col2 : D.col);
        if (D.id === 'book') Books(g, lv);
        if (D.id === 'airco') { g.translate(0, 2); Airco(g, lv); g.translate(-6, -9.5); Fan(g, lv); }
        if (D.id === 'chem') { g.translate(0, -2); Chem(g, lv); }
        if (D.id === 'plasma') { g.translate(0, -1); Plasma(g, lv); }
        g.translate(0, -4); g.rotate(-0.55);
        if (D.id === 'pencil') TurretPencil(g, lv);
        if (D.id === 'calc') TurretCalc(g, lv);
        if (D.id === 'book') TurretBook(g, lv);
      }, 26, k)));
    }
    for (const c of EN_CODES) {
      const [w, h, ay] = EN_BOX[c];
      I.en[c] = U(Spr(w, h, g => DrawEnemy(g, c, 1), ay, k));
    }
    return I;
  }

  for (const M of MAPS) {
    M.P = M.paths.map(BuildPath);
    M.grid = BuildGrid(M);
    M.starts = M.P.filter((P, i) => M.P.findIndex(Q => Q.xs[0] === P.xs[0] && Q.ys[0] === P.ys[0]) === i);
    M.exit = M.paths[0][M.paths[0].length - 1];
  }

  function Canopy(g, x, y, blobs, C, s) {
    g.fillStyle = OUT;
    for (const [dx, dy, r] of blobs) { Circ(g, x + dx * s, y + dy * s, r * s + 1.6); g.fill(); }
    g.save();
    g.beginPath();
    for (const [dx, dy, r] of blobs) { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }
    g.fillStyle = C[0]; g.fill(); g.clip();
    g.fillStyle = C[2];
    for (const [dx, dy, r] of blobs) { Circ(g, x + dx * s + 2, y + dy * s + 3.4, r * s * 0.86); g.fill(); }
    g.fillStyle = C[0];
    for (const [dx, dy, r] of blobs) { Circ(g, x + dx * s - 0.6, y + dy * s - 0.8, r * s * 0.84); g.fill(); }
    g.fillStyle = C[1];
    for (const [dx, dy, r] of blobs) { Circ(g, x + dx * s - 2.6, y + dy * s - 3, r * s * 0.5); g.fill(); }
    g.restore();
  }

  function Prop(g, t, x, y, pal, R) {
    if (t === 'tree') {
      const s = 0.92 + R() * 0.16;
      Shadow(g, x + 5, y + 13, 17 * s, 6.5 * s, 0.26);
      RR(g, x - 2.8, y, 5.6, 14, 2); Fl(g, '#7a4a28', 1.3);
      Ln(g, x - 0.8, y + 2, x - 0.8, y + 12, '#9a6338', 1);
      Canopy(g, x, y - 6, [[-7.5, 1, 9], [7.5, 1, 9], [0, -6, 10.5], [0, 4, 10]], pal.canopy, s);
      if (pal.kind === 0) for (let i = 0; i < 4; i++) { Circ(g, x + (R() - 0.5) * 22, y - 8 + (R() - 0.5) * 16, 1.6); Fl(g, '#f9a8d4', 0.8); }
    } else if (t === 'pine') {
      Shadow(g, x + 5, y + 14, 14, 5.5, 0.22);
      RR(g, x - 2.4, y + 5, 4.8, 10, 1.5); Fl(g, '#6b4226', 1.2);
      for (const [dy, w] of [[2, 13], [-7, 10.5], [-15, 7.5]]) {
        const ty = y + dy;
        Poly(g, [x, ty - 11, x + w, ty + 6, x - w, ty + 6]); Fl(g, pal.canopy[0], 1.4);
        Poly(g, [x, ty - 11, x + w, ty + 6, x + w * 0.2, ty + 6]); g.fillStyle = pal.canopy[2]; g.fill();
        Poly(g, [x, ty - 11, x + w * 0.5, ty - 2, x + w * 0.15, ty - 0.5, x - w * 0.2, ty - 2.5, x - w * 0.55, ty - 1.2]); Fl(g, '#ffffff', 1);
        Ell(g, x - w * 0.5, ty + 5.2, 3, 1.6); g.fillStyle = '#ffffff'; g.fill(); Ell(g, x + w * 0.45, ty + 5.4, 2.6, 1.4); g.fill();
      }
    } else if (t === 'bush') {
      Shadow(g, x + 3, y + 9, 14, 5);
      Canopy(g, x, y + 2, [[-6, 1, 7], [6, 1, 7], [0, -3, 8]], pal.canopy, 1);
      const dot = pal.kind === 2 ? '#ffffff' : pal.kind === 1 ? '#f97316' : '#f472b6';
      for (let i = 0; i < 5; i++) { Circ(g, x + (R() - 0.5) * 18, y + (R() - 0.6) * 10, 1.5); Fl(g, dot, 0.7); }
    } else if (t === 'rock') {
      Shadow(g, x + 3, y + 8, 14, 5);
      Poly(g, [x - 12, y + 7, x - 10, y - 3, x - 3, y - 9, x + 7, y - 7, x + 12, y + 1, x + 10, y + 8]); Fl(g, '#9aa3ae', 1.5);
      Poly(g, [x - 3, y - 9, x + 7, y - 7, x + 12, y + 1, x + 2, y - 1]); g.fillStyle = '#b8c0ca'; g.fill();
      Poly(g, [x - 12, y + 7, x - 6, y + 2, x + 10, y + 8]); g.fillStyle = '#7d8693'; g.fill();
      if (pal.kind === 2) { Poly(g, [x - 10, y - 3, x - 3, y - 9, x + 7, y - 7, x + 4, y - 3, x - 4, y - 4]); Fl(g, '#ffffff', 1); }
      else { Ell(g, x - 6, y - 1, 3.5, 2); g.fillStyle = 'rgba(101,163,13,0.6)'; g.fill(); }
    } else if (t === 'bench') {
      Shadow(g, x + 2, y + 10, 17, 4.5);
      for (const dx of [-12, 12]) { Ln(g, x + dx, y + 1, x + dx, y + 9, OUT, 2.4); Ln(g, x + dx, y + 1, x + dx, y + 9, '#475569', 1.2); }
      RR(g, x - 16, y - 10, 32, 5, 1.5); Fl(g, '#b7773f', 1.3);
      RR(g, x - 16, y - 3, 32, 4.5, 1.5); Fl(g, '#c98a4d', 1.3);
      RR(g, x - 16, y + 1.5, 32, 4, 1.5); Fl(g, '#a8673a', 1.3);
      if (pal.kind === 2) { RR(g, x - 15, y - 4.2, 30, 2.6, 1.3); g.fillStyle = '#fff'; g.fill(); }
    } else if (t === 'lamp') {
      Shadow(g, x + 2, y + 12, 7, 2.6);
      RR(g, x - 4, y + 8, 8, 4, 1.5); Fl(g, '#334155', 1.2);
      Ln(g, x, y + 9, x, y - 14, OUT, 3.6); Ln(g, x, y + 9, x, y - 14, '#475569', 1.8);
      RR(g, x - 5, y - 22, 10, 9, 2); Fl(g, '#334155', 1.3);
      RR(g, x - 3.4, y - 20.4, 6.8, 5.8, 1.2); g.fillStyle = '#fde68a'; g.fill();
      Poly(g, [x - 6, y - 22, x, y - 26, x + 6, y - 22]); Fl(g, '#1f2937', 1.2);
    } else if (t === 'bin') {
      Shadow(g, x + 2, y + 10, 9, 3);
      RR(g, x - 7, y - 6, 14, 16, 2.5); Fl(g, '#16a34a', 1.4);
      for (const dx of [-3, 0, 3]) Ln(g, x + dx, y - 3, x + dx, y + 7, '#15803d', 1);
      Ell(g, x, y - 6.5, 8, 3); Fl(g, '#22c55e', 1.3);
      Circ(g, x, y - 9, 1.6); Fl(g, '#15803d', 1);
      RR(g, x - 3, y - 2, 6, 5, 1); g.fillStyle = '#f8fafc'; g.fill();
    } else if (t === 'bike') {
      Shadow(g, x + 2, y + 10, 17, 4);
      for (const dx of [-9, 9]) { Circ(g, x + dx, y + 3, 6.6); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.3; g.strokeStyle = '#94a3b8'; g.stroke(); }
      g.beginPath(); g.moveTo(x - 9, y + 3); g.lineTo(x - 2, y - 4); g.lineTo(x + 6, y - 4); g.lineTo(x + 9, y + 3); g.moveTo(x - 2, y - 4); g.lineTo(x + 1, y + 3); g.lineTo(x + 6, y - 4);
      g.strokeStyle = OUT; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#ef4444'; g.lineWidth = 1.6; g.stroke();
      Ln(g, x - 4, -7 + y, x, -7 + y, OUT, 2.2); Ln(g, x + 6, y - 4, x + 7, y - 9, OUT, 1.6);
    } else if (t === 'slide') {
      Shadow(g, x + 2, y + 12, 17, 5);
      Poly(g, [x - 2, y - 12, x + 4, y - 12, x + 16, y + 10, x + 10, y + 10]); Fl(g, '#38bdf8', 1.4);
      Ln(g, x, y - 11, x + 12, y + 9, '#7dd3fc', 1.2);
      for (const dx of [-12, -5]) Ln(g, x + dx, y + 11, x + dx + 2, y - 13, OUT, 2.2);
      for (let i = 0; i < 4; i++) Ln(g, x - 11.6 + i * 0.5, y + 6 - i * 5.4, x - 4.6 + i * 0.5, y + 6 - i * 5.4, '#ef4444', 1.6);
      RR(g, x - 12, y - 15, 15, 4, 1.4); Fl(g, '#facc15', 1.2);
    } else if (t === 'board') {
      Shadow(g, x + 2, y + 12, 13, 4);
      Ln(g, x - 10, y + 12, x - 6, y - 12, '#8a5a32', 2.6); Ln(g, x + 10, y + 12, x + 6, y - 12, '#8a5a32', 2.6);
      RR(g, x - 12, y - 13, 24, 18, 2); Fl(g, '#a8733f', 1.4);
      RR(g, x - 10, y - 11, 20, 14, 1); g.fillStyle = '#1f4d3a'; g.fill();
      g.font = `700 6px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillText('a+b=?', x, y - 6.5); Ln(g, x - 7, y - 1, x + 5, y - 1, 'rgba(255,255,255,0.6)', 0.8);
      if (pal.kind === 2) { RR(g, x - 12.5, y - 14.5, 25, 3, 1.4); g.fillStyle = '#fff'; g.fill(); }
    } else if (t === 'goal') {
      Shadow(g, x + 2, y + 13, 16, 4);
      g.save(); RR(g, x - 13, y - 12, 26, 22, 1); g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.7;
      for (let i = -14; i <= 14; i += 3.5) { Ln(g, x + i, y - 12, x + i + 6, y + 10, 'rgba(255,255,255,0.55)', 0.7); Ln(g, x + i, y - 12, x + i - 6, y + 10, 'rgba(255,255,255,0.55)', 0.7); }
      g.restore();
      g.beginPath(); g.moveTo(x - 14, y + 11); g.lineTo(x - 14, y - 12); g.lineTo(x + 14, y - 12); g.lineTo(x + 14, y + 11);
      g.strokeStyle = OUT; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#f8fafc'; g.lineWidth = 2.4; g.stroke();
    } else if (t === 'cone') {
      Shadow(g, x + 2, y + 9, 9, 3);
      RR(g, x - 8, y + 5, 16, 4, 1.2); Fl(g, '#ea580c', 1.2);
      Poly(g, [x - 6, y + 6, x - 1.4, y - 11, x + 1.4, y - 11, x + 6, y + 6]); Fl(g, '#f97316', 1.3);
      Poly(g, [x - 4.2, y - 0.5, x - 2.6, y - 5.5, x + 2.6, y - 5.5, x + 4.2, y - 0.5]); g.fillStyle = '#fff'; g.fill();
    } else if (t === 'bag') {
      Shadow(g, x + 2, y + 10, 12, 4);
      RR(g, x - 10, y - 9, 20, 18, 5); Fl(g, '#3b82f6', 1.4);
      RR(g, x - 7, y, 14, 7, 2.5); Fl(g, '#2563eb', 1.1);
      g.beginPath(); g.arc(x, y - 9, 5, Math.PI, TAU); g.strokeStyle = OUT; g.lineWidth = 2.4; g.stroke();
      Ln(g, x - 7, y - 4, x + 7, y - 4, '#1d4ed8', 1); Circ(g, x, y + 3.4, 1); g.fillStyle = '#fde047'; g.fill();
    } else if (t === 'snowman') {
      Shadow(g, x + 3, y + 13, 12, 4);
      Circ(g, x, y + 5, 9); Fl(g, '#ffffff', 1.4); Circ(g, x, y - 6, 6.5); Fl(g, '#ffffff', 1.4);
      Ell(g, x + 3, y + 8, 5, 3); g.fillStyle = 'rgba(148,170,196,0.35)'; g.fill();
      RR(g, x - 6, y - 2.6, 12, 3, 1.4); Fl(g, '#ef4444', 1); RR(g, x + 2, y - 1.4, 3, 7, 1); Fl(g, '#ef4444', 1);
      Poly(g, [x + 1, y - 6.6, x + 7, y - 5.6, x + 1, y - 4.8]); Fl(g, '#f97316', 0.8);
      g.fillStyle = OUT; Circ(g, x - 2.2, y - 8, 0.9); g.fill(); Circ(g, x + 2, y - 8.4, 0.9); g.fill();
      Circ(g, x, y + 2, 0.9); g.fill(); Circ(g, x, y + 5.5, 0.9); g.fill();
      RR(g, x - 5, y - 13.5, 10, 2.4, 1); Fl(g, '#1f2937', 1); RR(g, x - 3.4, y - 19, 6.8, 6, 1); Fl(g, '#1f2937', 1);
    } else if (t === 'gate') {
      Shadow(g, x + 3, y + 14, 14, 5);
      RR(g, x - 9, y - 18, 18, 32, 2); Fl(g, '#b45347', 1.5);
      g.strokeStyle = '#8f3b32'; g.lineWidth = 0.9;
      for (let r = 0; r < 6; r++) { Ln(g, x - 8.5, y - 13 + r * 5, x + 8.5, y - 13 + r * 5, '#8f3b32', 0.9); for (let c = 0; c < 2; c++) { const bx = x - 4 + c * 9 - (r % 2) * 4.5; Ln(g, bx, y - 18 + r * 5, bx, y - 13 + r * 5, '#8f3b32', 0.9); } }
      RR(g, x - 11, y - 22, 22, 6, 2); Fl(g, '#e5e7eb', 1.4);
      if (pal.kind === 2) { RR(g, x - 11, y - 25, 22, 4, 2); Fl(g, '#ffffff', 1); }
    }
  }

  function Decal(g, t, x, y, pal) {
    if (t === 'hop') {
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.6;
      g.font = `800 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,0.9)';
      const box = (bx, by, n) => { g.strokeRect(bx - 7, by - 7, 14, 14); g.fillText(n, bx, by + 0.5); };
      box(x - 14, y, '1'); box(x, y - 7, '2'); box(x, y + 7, '3'); box(x + 14, y, '4'); box(x + 28, y - 7, '5'); box(x + 28, y + 7, '6');
    } else if (t === 'pitch') {
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2;
      g.strokeRect(x - 128, y - 56, 256, 112);
      Ln(g, x, y - 56, x, y + 56, 'rgba(255,255,255,0.75)', 2);
      Circ(g, x, y, 22); g.stroke();
      g.strokeRect(x - 128, y - 26, 26, 52); g.strokeRect(x + 102, y - 26, 26, 52);
      Circ(g, x, y, 2.4); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
    } else if (t === 'ice') {
      Ell(g, x, y, 17, 10); g.fillStyle = 'rgba(165,205,240,0.55)'; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(120,160,205,0.6)'; g.stroke();
      Ln(g, x - 9, y - 3, x - 3, y - 6, 'rgba(255,255,255,0.9)', 1.6); Ln(g, x + 2, y + 4, x + 8, y + 1, 'rgba(255,255,255,0.7)', 1.2);
    }
  }

  function StrokeAll(g, Ps, w, c, dy = 0) {
    g.lineWidth = w; g.strokeStyle = c;
    for (const P of Ps) { g.beginPath(); g.moveTo(P.xs[0], P.ys[0] + dy); for (let i = 1; i < P.n; i++) g.lineTo(P.xs[i], P.ys[i] + dy); g.stroke(); }
  }

  function DrawPaths(g, M, pal, R, k) {
    const Ps = M.P;
    StrokeAll(g, Ps, 41, 'rgba(20,16,34,0.16)', 3);
    StrokeAll(g, Ps, 37, pal.kind === 0 ? pal.edge : pal.kind === 1 ? '#f4efe6' : '#dfe8f2');
    const t = Cv(CV_W, CV_H, k), h = t.g;
    StrokeAll(h, Ps, 32, pal.path);
    h.globalCompositeOperation = 'source-atop';
    if (pal.kind === 0) {
      for (let y = 0, r = 0; y < CV_H; y += 9, r++) for (let x = -(r % 2) * 7; x < CV_W; x += 14) {
        RR(h, x + 0.8, y + 0.8, 12.4, 7.4, 2); h.fillStyle = R() < 0.5 ? pal.path : R() < 0.6 ? pal.path2 : Lt(pal.path, 0.12); h.fill();
        h.lineWidth = 0.7; h.strokeStyle = Dk(pal.path, 0.16); h.stroke();
      }
    } else if (pal.kind === 1) {
      for (let i = 0; i < 2600; i++) { h.fillStyle = R() < 0.5 ? pal.path2 : Lt(pal.path, 0.12); h.fillRect(R() * CV_W, R() * CV_H, 1.2, 1.2); }
      StrokeAll(h, Ps, 22.5, 'rgba(255,255,255,0.9)');
      StrokeAll(h, Ps, 20.5, pal.path);
      h.setLineDash([8, 9]); StrokeAll(h, Ps, 1.6, 'rgba(255,255,255,0.75)'); h.setLineDash([]);
    } else {
      for (let i = 0; i < 1800; i++) { h.fillStyle = R() < 0.6 ? '#ffffff' : pal.path2; h.globalAlpha = 0.35 + R() * 0.5; h.fillRect(R() * CV_W, R() * CV_H, 1.4, 1.4); }
      h.globalAlpha = 1;
      for (const P of Ps) for (let d = 30; d < P.len; d += 26) {
        const i = PathAt(P, d, 0), nx = -P.uy[i], ny = P.ux[i], a = Math.atan2(P.uy[i], P.ux[i]);
        for (const sd of [-1, 1]) {
          h.save(); h.translate(_px + nx * sd * 4 + P.ux[i] * (sd > 0 ? 6 : 0), _py + ny * sd * 4 + P.uy[i] * (sd > 0 ? 6 : 0)); h.rotate(a);
          Ell(h, 0, 0, 2.6, 1.4); h.fillStyle = 'rgba(100,120,150,0.35)'; h.fill(); h.restore();
        }
      }
    }
    h.globalCompositeOperation = 'source-over';
    StrokeAll(h, Ps, 32, 'rgba(20,16,34,0.08)', 2);
    g.drawImage(t.c, 0, 0, CV_W, CV_H);
    for (const P of Ps) for (let d = 6; d < P.len; d += pal.kind === 2 ? 5 : 10) {
      const i = PathAt(P, d, 0), nx = -P.uy[i], ny = P.ux[i];
      for (const sd of [-1, 1]) {
        const x = _px + nx * sd * (18 + R() * 1.5), y = _py + ny * sd * (18 + R() * 1.5);
        const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && M.grid[cy * COLS + cx] === 1 && R() < 0.85) continue;
        if (pal.kind === 0 && R() < 0.75) { const c = R() < 0.5 ? pal.blade : pal.grass; Ln(g, x, y + 1, x - 1.6, y - 3, c, 1.2); Ln(g, x + 1, y + 1, x + 1.4, y - 3.6, c, 1.2); Ln(g, x + 2, y + 1, x + 3.6, y - 2.4, c, 1.2); }
        if (pal.kind === 2) { const r = 2.2 + R() * 2.2; Circ(g, x + 0.6, y + 1.4, r); g.fillStyle = 'rgba(150,172,198,0.45)'; g.fill(); Circ(g, x, y, r); g.fillStyle = R() < 0.25 ? '#eef3f9' : '#ffffff'; g.fill(); }
      }
    }
    for (const P of M.starts) for (const d of [24, 46]) {
      const i = PathAt(P, d, 0), a = Math.atan2(P.uy[i], P.ux[i]);
      g.save(); g.translate(_px, _py); g.rotate(a);
      g.beginPath(); g.moveTo(-5, -8); g.lineTo(3, 0); g.lineTo(-5, 8);
      g.strokeStyle = pal.kind === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.65)'; g.lineWidth = 3.4; g.stroke();
      g.restore();
    }
  }

  function ExitSign(g, M) {
    const [, ey] = M.exit, x = CV_W - 20, y = ey * CELL + CELL / 2 - CELL - 4, b = BestGrade();
    Shadow(g, x + 3, y + 18, 13, 3.6);
    Ln(g, x - 6, y + 6, x - 6, y + 17, '#475569', 2.4); Ln(g, x + 6, y + 6, x + 6, y + 17, '#475569', 2.4);
    g.save(); g.translate(x, y - 2); g.rotate(-0.05);
    RR(g, -15, -16, 30, 30, 3); Fl(g, '#fbfaf5', 1.6);
    g.save(); RR(g, -15, -16, 30, 30, 3); g.clip(); g.fillStyle = '#1e3a8a'; g.fillRect(-15, -16, 30, 7); g.restore();
    RR(g, -15, -16, 30, 30, 3); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
    for (const yy of [-5, -1.5]) Ln(g, -10, yy, 10, yy, '#cbd5e1', 1);
    const lbl = String(b.label);
    g.font = `900 ${lbl.length > 5 ? 7 : 9}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = Dk(GradeColor(b.Pct), 0.15);
    g.fillText(lbl.length > 7 ? lbl.slice(0, 7) : lbl, 0, 7);
    g.restore();
  }

  function NightPass(g, M) {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#56649c'; g.fillRect(0, 0, CV_W, CV_H);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(6,10,32,0.2)'; g.fillRect(0, 0, CV_W, CV_H);
    g.globalCompositeOperation = 'lighter';
    for (const [t, x, y] of M.props) if (t === 'lamp') {
      const cx = x * CELL + CELL / 2, cy = y * CELL + CELL / 2;
      Glow(g, cx, cy + 8, 82, '#ffc66b', 0.3);
      Glow(g, cx, cy - 17, 18, '#fff1c1', 0.85);
    }
    const [, ey] = M.exit;
    Glow(g, CV_W - 18, ey * CELL - 26, 40, '#bae6fd', 0.22);
    g.globalCompositeOperation = 'source-over';
    for (const [t, x, y] of M.props) if (t === 'lamp') { RR(g, x * CELL + CELL / 2 - 3.4, y * CELL + CELL / 2 - 20.4, 6.8, 5.8, 1.2); g.fillStyle = '#fff6d5'; g.fill(); }
  }

  function BuildBg(mi, dark, k) {
    const M = MAPS[mi], pal = PALS[M.pal], R = Rng(M.seed * 7919 + 17), s = Cv(CV_W, CV_H, k), g = s.g;
    g.fillStyle = pal.grass; g.fillRect(0, 0, CV_W, CV_H);
    if (pal.kind === 1) { g.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < CV_W; x += 80) g.fillRect(x, 0, 40, CV_H); }
    for (let i = 0; i < 120; i++) { g.fillStyle = Rgba(i % 2 ? pal.g2 : pal.g3, 0.3 + R() * 0.3); Ell(g, R() * CV_W, R() * CV_H, 14 + R() * 40, 8 + R() * 22); g.fill(); }
    if (pal.kind < 2) {
      for (let i = 0; i < 1300; i++) {
        const x = R() * CV_W, y = R() * CV_H, c = Rgba(R() < 0.7 ? pal.blade : pal.g3, 0.4 + R() * 0.5);
        Ln(g, x, y, x - 1.2, y - 2.8 - R() * 1.5, c, 1); Ln(g, x + 1, y, x + 2, y - 2.4 - R() * 1.5, c, 1);
      }
    } else {
      for (let i = 0; i < 30; i++) {
        const x = R() * CV_W, y = R() * CV_H, w = 15 + R() * 14;
        g.fillStyle = 'rgba(148,170,196,0.28)'; Ell(g, x + 2, y + 3, w + 2, 5 + R() * 3); g.fill();
        g.fillStyle = '#ffffff'; Ell(g, x, y, w, 5 + R() * 3); g.fill();
      }
      for (let i = 0; i < 600; i++) { g.fillStyle = Rgba(R() < 0.5 ? '#ffffff' : '#c3d3e6', 0.5 + R() * 0.5); Circ(g, R() * CV_W, R() * CV_H, 0.5 + R() * 1.1); g.fill(); }
      for (let i = 0; i < 120; i++) { const x = R() * CV_W, y = R() * CV_H; Ln(g, x, y, x - 1, y - 4, '#7c8b6a', 0.9); Ln(g, x + 1.4, y, x + 2.4, y - 3, '#7c8b6a', 0.9); }
    }
    if (pal.kind === 0) for (let i = 0; i < 46; i++) {
      const x = R() * CV_W, y = R() * CV_H, c = ['#ffffff', '#fde047', '#f9a8d4', '#c4b5fd'][i % 4];
      for (let j = 0; j < 4; j++) { const fx = x + (R() - 0.5) * 12, fy = y + (R() - 0.5) * 8; Circ(g, fx, fy, 1.7); g.fillStyle = c; g.fill(); Circ(g, fx, fy, 0.6); g.fillStyle = '#f59e0b'; g.fill(); }
    }
    if (pal.kind === 1) for (let i = 0; i < 80; i++) {
      g.save(); g.translate(R() * CV_W, R() * CV_H); g.rotate(R() * TAU);
      Ell(g, 0, 0, 3, 1.6); g.fillStyle = ['#ea8a2b', '#f2b13f', '#c2571f'][i % 3]; g.fill(); g.restore();
    }
    for (const [t, x, y] of M.decals) Decal(g, t, x * CELL + CELL / 2, y * CELL + CELL / 2, pal);
    DrawPaths(g, M, pal, R, k);
    const [ex, ey] = M.exit;
    const props = M.props.slice();
    if (ex >= COLS) props.push(['gate', COLS - 1, ey - 1], ['gate', COLS - 1, ey + 1]);
    props.sort((a, b) => a[2] - b[2]);
    for (const [t, x, y] of props) Prop(g, t, x * CELL + CELL / 2, y * CELL + CELL / 2, pal, R);
    ExitSign(g, M);
    if (dark) NightPass(g, M);
    return s;
  }

  function BuildGridOverlay(M, k) {
    const s = Cv(CV_W, CV_H, k), g = s.g;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!M.grid[y * COLS + x]) {
      RR(g, x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6, 7);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill();
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.stroke();
    }
    return s;
  }

  function MakePool(n, make) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = make(); return { a, n: 0 }; }
  function Take(p) { return p.n < p.a.length ? p.a[p.n++] : null; }
  function Drop(p, i) { const o = p.a[i]; p.a[i] = p.a[--p.n]; p.a[p.n] = o; }

  const EP = MakePool(420, () => ({ T: null, id: 0, hp: 0, max: 0, sh: 0, shMax: 0, x: 0, y: 0, d: 0, seg: 0, P: null, off: 0, sp: 0, slow: 0, slowT: 0, stop: 0, frz: 0, shred: 0, flash: 0, an: 0, dir: 1, dead: 0, abT: 0, gold: 0, rage: 0, k: 0, leak: 0, ux: 1, uy: 0 }));
  const PP = MakePool(320, () => ({ k: 0, x: 0, y: 0, sx: 0, sy: 0, tx: 0, ty: 0, vx: 0, vy: 0, t: 0, T: 0, H: 0, e: null, eid: 0, tw: null, L: null, dmg: 0, n: 0, h0: null, h1: null, h2: null, h3: null, rot: 0, img: null }));
  const XP = MakePool(900, () => ({ img: null, x: 0, y: 0, vx: 0, vy: 0, t: 0, T: 1, s: 1, ds: 0, rot: 0, vr: 0, g: 0, add: 0 }));
  const TP = MakePool(64, () => ({ x: 0, y: 0, t: 0, T: 1, s: '', c: '', z: 12 }));
  const BP = MakePool(48, () => ({ t: 0, T: 0, n: 0, glow: '', core: '', w: 0, xs: new Float32Array(96), ys: new Float32Array(96) }));
  const RP = MakePool(64, () => ({ x: 0, y: 0, r0: 0, r1: 0, t: 0, T: 1, img: null }));
  const DP = MakePool(48, () => ({ x: 0, y: 0, r: 0, t: 0, T: 1, dps: 0, tick: 0, i: 0, air: 0, tw: null }));
  const K_DART = 0, K_INK = 1, K_SHELL = 2, K_BOMB = 3, K_FLASK = 4;
  const BEAM_COL = [['rgba(244,63,94,0.55)', '#ffe4e6'], ['rgba(192,132,252,0.6)', '#faf5ff'], ['rgba(250,204,21,0.55)', '#fefce8'], ['rgba(167,139,250,0.5)', '#f5f3ff'], ['rgba(96,165,250,0.55)', '#eff6ff'], ['rgba(251,113,133,0.55)', '#fff1f2']];
  const _plus = [];
  function PlusStr(n) { return _plus[n] || (_plus[n] = `+${n}`); }

  function NewGame(mi) {
    const M = MAPS[mi];
    EP.n = PP.n = XP.n = TP.n = BP.n = RP.n = DP.n = 0;
    return {
      status: 'playing', mi, M, money: M.money, lives: START_LIVES, wave: 0, score: 0, kills: 0,
      plan: BuildWaves(mi), groups: [], cd: -1, cdMax: 1, towers: [], grid: Uint8Array.from(M.grid),
      sel: null, place: -1, hx: -1, hy: -1, mx: -99, my: -99, hov: null, upPrev: -1,
      speed: StorageGet(LS_SPEED, 1) === 2 ? 2 : 1, acc: 0, time: 0, shake: 0,
      banT: 0, banA: '', banB: '', banBoss: 0, seen: {}, intro: '', linger: 0,
      hpk: 1, goldk: 1, boss: null, bossId: 0, bossName: '', stars: 0, payS: '', payT: 0, newUnlock: false,
    };
  }

  function WaveBonus() { return 20 + GS.wave * 3; }
  function Interest() { return Math.min(Math.floor(GS.money * 0.05), 15 + GS.wave * 2); }
  function EarlyBonus() { return GS.cd > 0 ? Math.round(GS.cd / GS.cdMax * (8 + GS.wave * 1.6)) : 0; }
  function CanCall() { return !!GS && GS.status === 'playing' && GS.wave < WAVES && !GS.groups.length; }

  function CallWave() {
    if (!CanCall()) return;
    const early = EarlyBonus();
    if (early) {
      GS.money += early; GS.score += early * 5;
      const P = GS.M.starts[0];
      Txt(30, P.ys[0] - 22, PlusStr(early), '#fbbf24', 14);
    }
    if (GS.wave > 0) {
      const b = WaveBonus(), it = Interest();
      GS.money += b + it; GS.payT = 2.6;
      GS.payS = `+${b} ${_GameText('td_wave_bonus')}  ·  +${it} ${_GameText('td_interest')}`;
    }
    GS.wave++;
    const w = GS.wave, np = GS.M.P.length;
    GS.hpk = HpScale(w) * (1 + (GS.M.hp - 1) * Math.min(1, w / 12));
    GS.goldk = 1 + (w - 1) * 0.035;
    GS.groups = GS.plan[w - 1].map((G, k) => ({ c: G.c, n: G.n, gap: G.gap, t: G.at, i: 0, p: (k + w) % np, alt: np > 1 && G.n >= 12 }));
    GS.cd = 0;
    const boss = GS.groups.find(G => G.c[0] === 'B');
    GS.banT = 2.4; GS.banBoss = boss ? 1 : 0;
    GS.banA = `${_GameText('td_wave').toUpperCase()} ${w}`;
    GS.banB = boss ? `${_GameText('td_boss')}: ${_GameText(EN[boss.c].key)}` : w === WAVES ? _GameText('td_last_wave') : '';
  }

  function PlaceE(e) {
    const P = e.P;
    e.seg = PathAt(P, e.d, e.seg);
    const i = e.seg;
    e.ux = P.ux[i]; e.uy = P.uy[i];
    e.x = _px - e.uy * e.off; e.y = _py + e.ux * e.off;
    if (e.ux > 0.3) e.dir = 1; else if (e.ux < -0.3) e.dir = -1;
  }

  function Spawn(c, P, d, seg, off) {
    const e = Take(EP);
    if (!e) return null;
    const T = EN[c];
    e.T = T; e.id = ++_eid; e.P = P; e.d = d;
    while (seg > 0 && d < P.cum[seg]) seg--;
    e.seg = seg;
    e.max = e.hp = Math.round(T.hp * GS.hpk);
    e.shMax = e.sh = T.shield ? Math.round(e.max * T.shield) : 0;
    e.sp = T.sp * (0.96 + (e.id * 7919 % 9) / 100);
    e.off = off ?? ((e.id * 131) % 13 - 6) * (T.boss ? 0.3 : 1);
    e.slow = e.slowT = e.stop = e.frz = e.shred = e.flash = e.rage = e.k = e.dead = 0;
    e.an = (e.id * 0.37) % 1; e.dir = 1;
    e.abT = T.boss ? 3.5 : T.heal ? 1.2 : 0;
    e.gold = Math.round(T.gold * GS.goldk);
    e.leak = T.leak;
    PlaceE(e);
    if (T.boss) { GS.boss = e; GS.bossId = e.id; GS.bossName = `${_GameText(T.key)} · ${WorstGrade().subject}`.toUpperCase(); }
    if (!GS.seen[c] && c !== 'm') { GS.seen[c] = 1; if (c !== 'S') GS.intro = c; }
    return e;
  }

  function Hurt(e, dmg, kind, tw) {
    if (e.dead) return;
    if (kind === 0 && e.T.armor) dmg *= 1 - e.T.armor * (e.shred > 0 ? 0.4 : 1);
    if (e.sh > 0) {
      const m = kind === 2 ? 2 : 1, a = Math.min(e.sh, dmg * m);
      e.sh -= a; dmg -= a / m;
      if (e.sh <= 0.5) { e.sh = 0; ShieldPop(e); }
    }
    e.hp -= dmg;
    e.flash = 0.07;
    if (e.T.boss === 3 && !e.rage && e.hp < e.max * 0.5 && e.hp > 0) {
      e.rage = 1; GS.shake = Math.max(GS.shake, 0.35);
      Ring(e.x, e.y, 10, 90, 0.6, 'o');
    }
    if (e.hp <= 0) Die(e, tw);
  }

  function Die(e, tw) {
    e.dead = 1;
    GS.money += e.gold; GS.score += e.gold * 10 + 5; GS.kills++;
    if (tw) tw.kills++;
    if (e.gold) Txt(e.x, e.y - 16, PlusStr(e.gold), '#fbbf24', e.T.boss ? 16 : 11);
    DeathFx(e);
    if (e.T.split) for (let k = 0; k < e.T.split; k++) Spawn('m', e.P, Math.max(0, e.d - k * 8), e.seg, e.off + (k - 1) * 6);
    if (e.T.boss) GS.shake = Math.max(GS.shake, 0.7);
  }

  function Leak(e) {
    e.dead = 1;
    GS.lives = Math.max(0, GS.lives - e.leak);
    GS.shake = Math.max(GS.shake, e.T.boss ? 0.8 : 0.3);
    Txt(CV_W - 34, e.y - 18, `-${e.leak}`, '#f87171', 15);
    for (let i = 0; i < 6; i++) Part(_S.fx.glow.r, CV_W - 8, e.y, -40 - Math.random() * 80, (Math.random() - 0.5) * 90, 0.5, 8, -6, 0, 1);
    if (GS.lives <= 0) Lose();
  }

  function Ability(e, dt) {
    e.abT -= dt;
    if (e.abT > 0) return;
    const T = e.T;
    if (T.heal) {
      e.abT = 2.5;
      let n = 0;
      for (let j = 0; j < EP.n; j++) {
        const o = EP.a[j];
        if (o.dead || o.hp >= o.max) continue;
        const dx = o.x - e.x, dy = o.y - e.y;
        if (dx * dx + dy * dy > 5625) continue;
        o.hp = Math.min(o.max, o.hp + o.max * (o.T.boss ? 0.02 : 0.14)); n++;
        Part(_S.fx.plus, o.x, o.y - 12, 0, -26, 0.8, 8, 2);
      }
      if (n) Ring(e.x, e.y, 6, 75, 0.5, 'g');
    } else if (T.boss === 1) {
      e.abT = 5;
      for (let k = 0; k < 3; k++) Spawn('F', e.P, Math.max(0, e.d - 6 - k * 9), e.seg, (k - 1) * 8);
      Ring(e.x, e.y, 10, 54, 0.45, 'w');
    } else if (T.boss === 2) {
      e.abT = 7;
      for (let j = 0; j < EP.n; j++) {
        const o = EP.a[j];
        if (o.dead) continue;
        const dx = o.x - e.x, dy = o.y - e.y;
        if (dx * dx + dy * dy > 16900) continue;
        o.sh = Math.max(o.sh, Math.round(o.max * (o === e ? 0.12 : 0.5)));
        o.shMax = Math.max(o.shMax, o.sh);
      }
      Ring(e.x, e.y, 10, 130, 0.7, 'b');
    } else {
      e.abT = 6;
      if (e.k++ % 2 === 0) {
        for (let k = 0; k < 2; k++) Spawn('A', e.P, Math.max(0, e.d - 10 - k * 14), e.seg, (k ? 7 : -7));
        for (let k = 0; k < 4; k++) Spawn('m', e.P, Math.max(0, e.d - 6 - k * 6), e.seg, (k - 1.5) * 6);
        Ring(e.x, e.y, 10, 60, 0.5, 'o');
      } else {
        for (let j = 0; j < EP.n; j++) {
          const o = EP.a[j];
          if (o.dead) continue;
          const dx = o.x - e.x, dy = o.y - e.y;
          if (dx * dx + dy * dy > 22500) continue;
          o.hp = Math.min(o.max, o.hp + o.max * (o === e ? 0.025 : 0.06));
        }
        Ring(e.x, e.y, 10, 150, 0.7, 'g');
      }
    }
  }

  function UpdateEnemies(dt) {
    for (let i = 0; i < EP.n; i++) {
      const e = EP.a[i];
      if (e.dead) continue;
      if (e.flash > 0) e.flash -= dt;
      if (e.shred > 0) e.shred -= dt;
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
      let v = e.sp * (1 - e.slow) * (e.rage ? 1.35 : 1);
      if (e.stop > 0) { e.stop -= dt; v = 0; if (e.stop <= 0) e.frz = 0; }
      e.d += v * dt;
      if (v) e.an += dt * (0.5 + v / 26);
      if (e.T.heal || e.T.boss) Ability(e, dt);
      if (e.d >= e.P.len) { Leak(e); if (GS.status !== 'playing') return; continue; }
      PlaceE(e);
    }
  }

  function Acquire(t, r, air, x1, x2) {
    let best = null, bv = -Infinity;
    const r2 = r * r, m = t.mode;
    for (let i = 0; i < EP.n; i++) {
      const e = EP.a[i];
      if (e.dead || e === x1 || e === x2 || (e.T.fly && !air) || e.x < -6 || e.x > CV_W + 6 || e.y < -6 || e.y > CV_H + 6) continue;
      const dx = e.x - t.x, dy = e.y - t.y, d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const v = m === 0 ? e.d - e.P.len : m === 1 ? e.P.len - e.d : m === 2 ? e.hp + e.sh : -d2;
      if (v > bv) { bv = v; best = e; }
    }
    return best;
  }

  function Predict(e, T) {
    const v = e.stop > 0 ? 0 : e.sp * (1 - e.slow) * (e.rage ? 1.35 : 1);
    PathAt(e.P, Math.min(e.P.len, e.d + v * T), e.seg);
    _px -= e.uy * e.off; _py += e.ux * e.off;
  }

  function AngDiff(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }

  function Shot(k, t, x, y, e, dmg) {
    const p = Take(PP);
    if (!p) return null;
    p.k = k; p.tw = t; p.L = t.L; p.x = p.sx = x; p.y = p.sy = y; p.t = 0; p.e = e; p.eid = e ? e.id : 0; p.dmg = dmg;
    p.h0 = p.h1 = p.h2 = p.h3 = null; p.n = 0; p.rot = 0;
    return p;
  }

  function Lob(k, t, x, y, tx, ty, T, dmg, img) {
    const p = Shot(k, t, x, y, null, dmg);
    if (!p) return;
    p.tx = tx; p.ty = ty; p.T = T; p.img = img;
    p.H = 22 + Math.hypot(tx - x, ty - y) * 0.22;
  }

  function Fire(t) {
    const L = t.L, D = t.D, k = D.kind;
    if (k === 'pulse') {
      const r2 = L.range * L.range;
      let hit = 0;
      for (let i = 0; i < EP.n; i++) {
        const e = EP.a[i];
        if (e.dead) continue;
        const dx = e.x - t.x, dy = e.y - t.y;
        if (dx * dx + dy * dy <= r2) { hit = 1; break; }
      }
      if (!hit) return false;
      t.k++;
      const fr = L.freeze && t.k % 3 === 0;
      for (let i = 0, n = EP.n; i < n; i++) {
        const e = EP.a[i];
        if (e.dead) continue;
        const dx = e.x - t.x, dy = e.y - t.y;
        if (dx * dx + dy * dy > r2) continue;
        const s = e.T.boss ? L.slow * 0.5 : L.slow;
        if (s >= e.slow) { e.slow = s; e.slowT = 1.6; } else e.slowT = Math.max(e.slowT, 1.6);
        if (fr && !e.T.boss) { e.stop = Math.max(e.stop, L.freeze); e.frz = 1; }
        Hurt(e, L.dmg, 1, t);
      }
      t.rc = 1;
      PulseFx(t, fr);
      return true;
    }
    const e = Acquire(t, L.range, D.air || L.cloud);
    if (!e) return false;
    const ey = e.T.fly ? e.y - 12 : e.y;
    t.aim = Math.atan2(ey - (t.y - 4), e.x - t.x);
    t.rc = 1;
    const ca = Math.cos(t.aim), sa = Math.sin(t.aim), mx = t.x + ca * 17, my = t.y - 4 + sa * 17;
    if (k === 'dart') {
      if (L.pierce) {
        const p = Shot(K_INK, t, mx, my, null, L.dmg);
        if (p) { const dx = e.x - mx, dy = ey - my, d = Math.hypot(dx, dy) || 1; p.vx = dx / d * 620; p.vy = dy / d * 620; p.T = L.range * 1.2 / 620; p.n = L.pierce; p.rot = Math.atan2(dy, dx); }
        Muzzle(mx, my, 'b');
      } else if (L.multi) {
        const e2 = Acquire(t, L.range, 1, e), e3 = e2 ? Acquire(t, L.range, 1, e, e2) : null;
        for (let i = 0; i < 3; i++) {
          const x = i === 0 ? e : i === 1 ? e2 : e3;
          if (!x) break;
          const p = Shot(K_DART, t, mx, my, x, L.dmg);
          if (p) { p.img = _S.fx.dart[MULTI_COL[i]]; p.tx = x.x; p.ty = x.y; }
        }
        Muzzle(mx, my, 'y');
      } else {
        const p = Shot(K_DART, t, mx, my, e, L.dmg);
        if (p) { p.img = _S.fx.dart.y; p.tx = e.x; p.ty = ey; }
        Muzzle(mx, my, 'y');
      }
    } else if (k === 'beam') {
      const dmg = L.dmg * (L.bossX && e.T.boss ? L.bossX : 1);
      const ox = t.x + ca * 22, oy = t.y - 4 + sa * 22;
      Beam(ox, oy, e.x, ey, t.lv === 3 ? 1 : t.lv === 4 ? 2 : 0, t.lv >= 2 ? 3.4 : 2.6);
      if (t.lv === 2 || t.lv === 4) Beam(ox - sa * 4, oy + ca * 4, e.x, ey, t.lv === 4 ? 2 : 0, 2);
      Hurt(e, dmg, L.pierceArmor ? 1 : 0, t);
      Muzzle(ox, oy, t.lv === 3 ? 'v' : t.lv === 4 ? 'y' : 'r');
      HitFx(e.x, ey, t.lv === 3 ? 'v' : 'r', 4);
    } else if (k === 'shell' || k === 'flask') {
      const T = 0.55 + Math.hypot(e.x - t.x, e.y - t.y) / 520;
      Predict(e, T);
      if (k === 'shell') { Lob(K_SHELL, t, mx, my, _px, _py, T, L.dmg, _S.fx.book[t.lv === 3 ? 3 : t.lv % 3]); Smoke(mx, my, 'd', 3); }
      else Lob(K_FLASK, t, t.x, t.y - 18, _px, e.T.fly ? _py - 12 : _py, T * 0.9, L.dmg, _S.fx.flask[t.lv === 3 ? 1 : t.lv === 4 ? 2 : 0]);
    } else if (k === 'bolt') {
      const b = Take(BP);
      let x = t.x, y = t.y - 11, dmg = L.dmg, cur = e, n = 0;
      const hit = _chain;
      hit.length = 0;
      if (b) { b.t = 0; b.T = 0.2; b.n = 0; b.w = t.lv >= 3 ? 3.4 : 2.6; const c = BEAM_COL[t.lv === 4 ? 5 : t.lv === 3 ? 4 : 3]; b.glow = c[0]; b.core = c[1]; b.xs[0] = x; b.ys[0] = y; b.n = 1; }
      while (cur && n < L.chain) {
        const cy = cur.T.fly ? cur.y - 12 : cur.y;
        if (b) Jag(b, x, y, cur.x, cy);
        Hurt(cur, dmg, 2, t);
        if (L.stun && !cur.T.boss && !cur.dead) cur.stop = Math.max(cur.stop, L.stun);
        Part(_S.fx.glow.v, cur.x, cy, 0, 0, 0.16, 14, 30, 0, 1);
        hit.push(cur); n++; x = cur.x; y = cy; dmg *= 0.82;
        let nb = null, nd = 7225;
        for (let i = 0; i < EP.n; i++) {
          const o = EP.a[i];
          if (o.dead || hit.includes(o)) continue;
          const dx = o.x - cur.x, dy = o.y - cur.y, d2 = dx * dx + dy * dy;
          if (d2 < nd) { nd = d2; nb = o; }
        }
        cur = nb;
      }
      Part(_S.fx.glow.v, t.x, t.y - 11, 0, 0, 0.2, 18, 30, 0, 1);
    }
    return true;
  }
  const _chain = [], MULTI_COL = ['g', 'r', 'b'];

  function UpdateTowers(dt) {
    for (const t of GS.towers) {
      t.an += dt;
      if (t.rc > 0) t.rc = Math.max(0, t.rc - dt * 6);
      t.ang += AngDiff(t.ang, t.aim) * Math.min(1, dt * 14);
      t.cd -= dt;
      if (t.cd > 0) continue;
      t.cd = Fire(t) ? t.L.rate : 0.08;
    }
  }

  function Impact(p) {
    const L = p.L, x = p.tx, y = p.ty;
    if (p.k === K_FLASK) {
      for (let i = 0, n = EP.n; i < n; i++) {
        const e = EP.a[i];
        if (e.dead || (e.T.fly && !L.cloud)) continue;
        const dx = e.x - x, dy = e.y - y;
        if (dx * dx + dy * dy <= 484) Hurt(e, p.dmg, 1, p.tw);
      }
      Puddle(x, y, L.pool, L.dur, L.dps, L.cloud ? 1 : 0, p.tw, p.tw.lv === 3 ? 1 : p.tw.lv === 4 ? 2 : 0);
      SplashFx(x, y, p.tw.lv === 3 ? 'y' : p.tw.lv === 4 ? 'v' : 'g');
      return;
    }
    const R = p.k === K_BOMB ? 30 : L.splash, dmg = p.dmg;
    for (let i = 0, n = EP.n; i < n; i++) {
      const e = EP.a[i];
      if (e.dead || e.T.fly) continue;
      const dx = e.x - x, dy = e.y - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + e.T.r * 0.4) continue;
      Hurt(e, dmg * (d < R * 0.5 ? 1 : 0.6), 0, p.tw);
      if (L.stun && p.k === K_SHELL && !e.T.boss && !e.dead) e.stop = Math.max(e.stop, L.stun);
    }
    if (p.k === K_SHELL && L.cluster) for (let c = 0; c < L.cluster; c++) {
      const a = c / L.cluster * TAU + 0.4, r = 26 + (c % 2) * 10;
      Lob(K_BOMB, p.tw, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 0.32, L.dmg * 0.45, _S.fx.book[c % 3]);
    }
    BoomFx(x, y, R, p.k === K_BOMB);
    if (L.stun && p.k === K_SHELL) GS.shake = Math.max(GS.shake, 0.12);
  }

  function UpdateProjectiles(dt) {
    for (let i = PP.n - 1; i >= 0; i--) {
      const p = PP.a[i];
      if (p.k === K_DART) {
        const e = p.e, ok = e.id === p.eid && !e.dead;
        if (ok) { p.tx = e.x; p.ty = e.T.fly ? e.y - 12 : e.y; }
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy), mv = 660 * dt;
        p.rot = Math.atan2(dy, dx);
        if (d <= mv + 5) {
          if (ok) { Hurt(e, p.dmg, 0, p.tw); HitFx(p.tx, p.ty, 'y', 2); }
          Drop(PP, i);
          continue;
        }
        p.x += dx / d * mv; p.y += dy / d * mv;
      } else if (p.k === K_INK) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        for (let j = 0, n = EP.n; j < n && p.n > 0; j++) {
          const e = EP.a[j];
          if (e.dead || e === p.h0 || e === p.h1 || e === p.h2 || e === p.h3) continue;
          const dx = e.x - p.x, dy = (e.T.fly ? e.y - 12 : e.y) - p.y, r = e.T.r + 5;
          if (dx * dx + dy * dy > r * r) continue;
          Hurt(e, p.dmg, 0, p.tw);
          HitFx(p.x, p.y, 'b', 2);
          if (!p.h0) p.h0 = e; else if (!p.h1) p.h1 = e; else if (!p.h2) p.h2 = e; else p.h3 = e;
          p.n--;
        }
        if (p.n <= 0 || p.t > p.T) Drop(PP, i);
      } else {
        p.t += dt;
        if (p.t >= p.T) { Impact(p); Drop(PP, i); continue; }
        const u = p.t / p.T;
        p.x = p.sx + (p.tx - p.sx) * u; p.y = p.sy + (p.ty - p.sy) * u;
        p.rot += dt * (p.k === K_FLASK ? 11 : 7);
      }
    }
  }

  function Puddle(x, y, r, T, dps, air, tw, i) {
    const d = Take(DP);
    if (!d) return;
    d.x = x; d.y = y; d.r = r; d.t = 0; d.T = T; d.dps = dps; d.tick = 0.1; d.air = air; d.tw = tw; d.i = i;
  }

  function UpdatePuddles(dt) {
    for (let i = DP.n - 1; i >= 0; i--) {
      const d = DP.a[i];
      d.t += dt; d.tick -= dt;
      if (d.tick <= 0) {
        d.tick += 0.25;
        for (let j = 0, n = EP.n; j < n; j++) {
          const e = EP.a[j];
          if (e.dead || (e.T.fly && !d.air)) continue;
          const dx = e.x - d.x, dy = (e.y - d.y) * 1.3, r = d.r + e.T.r * 0.5;
          if (dx * dx + dy * dy > r * r) continue;
          e.shred = 1.2;
          Hurt(e, d.dps * 0.25, 1, d.tw);
        }
      }
      if (Math.random() < dt * 9) Part(_S.fx.smoke[d.i === 1 ? 'y' : d.i === 2 ? 'v' : 'g'], d.x + (Math.random() - 0.5) * d.r * 1.4, d.y + (Math.random() - 0.5) * d.r * 0.8, 0, d.air ? -22 : -10, 0.6, 3, 6);
      if (d.t >= d.T) Drop(DP, i);
    }
  }

  function Step(dt) {
    GS.time += dt;
    if (GS.groups.length) {
      let left = 0;
      for (const G of GS.groups) {
        if (G.i >= G.n) continue;
        left++;
        G.t -= dt;
        while (G.t <= 0 && G.i < G.n) {
          const np = GS.M.P.length;
          Spawn(G.c, GS.M.P[G.alt ? (G.p + G.i) % np : G.p], 0, 0);
          G.i++; G.t += G.gap;
        }
      }
      if (!left) { GS.groups = []; if (GS.wave < WAVES) GS.cdMax = GS.cd = GS.wave % 10 === 9 ? 24 : 16; }
    } else if (GS.cd > 0) {
      GS.cd -= dt;
      if (GS.cd <= 0) { GS.cd = 0; CallWave(); }
    }
    UpdateEnemies(dt);
    if (GS.status !== 'playing') return;
    UpdateTowers(dt);
    UpdateProjectiles(dt);
    UpdatePuddles(dt);
    UpdateFx(dt);
    for (let i = EP.n - 1; i >= 0; i--) if (EP.a[i].dead) Drop(EP, i);
    if (GS.boss && (GS.boss.dead || GS.boss.id !== GS.bossId)) GS.boss = null;
    if (GS.banT > 0) GS.banT -= dt;
    if (GS.payT > 0) GS.payT -= dt;
    if (GS.wave >= WAVES && !GS.groups.length && !EP.n) Win();
  }

  function CanPlace(cx, cy, ti) {
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS || GS.grid[cy * COLS + cx]) return 0;
    return GS.money >= TOWERS[ti].lv[0].cost ? 1 : 2;
  }

  function PlaceTower(cx, cy, ti) {
    if (CanPlace(cx, cy, ti) !== 1) return null;
    const D = TOWERS[ti], L = D.lv[0];
    const t = { D, L, lv: 0, cx, cy, x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2, cd: 0.25, ang: -0.6, aim: -0.6, rc: 0, an: 0, k: 0, mode: 0, spent: L.cost, kills: 0 };
    GS.money -= L.cost;
    GS.grid[cy * COLS + cx] = 3;
    GS.towers.push(t);
    GS.towers.sort((a, b) => a.y - b.y || a.x - b.x);
    BuildFx(t);
    return t;
  }

  function NextLevels(t) { return t.lv < 2 ? [t.lv + 1] : t.lv === 2 ? [3, 4] : []; }

  function Upgrade(t, nl) {
    if (!NextLevels(t).includes(nl)) return false;
    const L = t.D.lv[nl];
    if (GS.money < L.cost) return false;
    GS.money -= L.cost; t.spent += L.cost; t.lv = nl; t.L = L;
    BuildFx(t);
    return true;
  }

  function SellValue(t) { return Math.floor(t.spent * 0.7); }

  function Sell(t) {
    const i = GS.towers.indexOf(t);
    if (i < 0) return;
    GS.money += SellValue(t);
    GS.towers.splice(i, 1);
    GS.grid[t.cy * COLS + t.cx] = 0;
    Txt(t.x, t.y - 20, PlusStr(SellValue(t)), '#fbbf24', 13);
    for (let j = 0; j < 10; j++) Part(_S.fx.smoke.w, t.x + (Math.random() - 0.5) * 26, t.y + (Math.random() - 0.3) * 14, (Math.random() - 0.5) * 30, -10 - Math.random() * 20, 0.6, 8, 14);
    if (GS.sel === t) GS.sel = null;
  }

  function Part(img, x, y, vx, vy, T, s, ds, g = 0, add = 0, rot = 0, vr = 0) {
    const p = Take(XP);
    if (!p) return;
    p.img = img; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.T = T; p.s = s; p.ds = ds; p.g = g; p.add = add; p.rot = rot; p.vr = vr;
  }
  function Txt(x, y, s, c, z) {
    const p = Take(TP);
    if (!p) return;
    p.x = x; p.y = y; p.s = s; p.c = c; p.z = z; p.t = 0; p.T = 0.95;
  }
  function Ring(x, y, r0, r1, T, c) {
    const p = Take(RP);
    if (!p) return;
    p.x = x; p.y = y; p.r0 = r0; p.r1 = r1; p.t = 0; p.T = T; p.img = _S.fx.ring[c];
  }
  function Beam(x1, y1, x2, y2, ci, w) {
    const b = Take(BP);
    if (!b) return;
    b.t = 0; b.T = 0.14; b.n = 2; b.w = w; b.glow = BEAM_COL[ci][0]; b.core = BEAM_COL[ci][1];
    b.xs[0] = x1; b.ys[0] = y1; b.xs[1] = x2; b.ys[1] = y2;
  }
  function Jag(b, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l, J = Math.min(14, l * 0.25);
    for (let i = 1; i <= 6 && b.n < 96; i++) {
      const u = i / 6, j = i < 6 ? (Math.random() - 0.5) * J : 0;
      b.xs[b.n] = x1 + dx * u + nx * j; b.ys[b.n] = y1 + dy * u + ny * j; b.n++;
    }
  }
  function Muzzle(x, y, c) { Part(_S.fx.glow[c], x, y, 0, 0, 0.09, 14, 50, 0, 1); }
  function HitFx(x, y, c, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 50 + Math.random() * 80; Part(_S.fx.spark, x, y, Math.cos(a) * v, Math.sin(a) * v, 0.2, 8, -10, 0, 1, a); }
    Part(_S.fx.glow[c], x, y, 0, 0, 0.1, 12, 40, 0, 1);
  }
  function Smoke(x, y, c, n) {
    for (let i = 0; i < n; i++) Part(_S.fx.smoke[c], x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 30, -12 - Math.random() * 18, 0.45 + Math.random() * 0.35, 7 + Math.random() * 4, 18);
  }
  function ShieldPop(e) {
    Ring(e.x, e.y - 4, e.T.r, e.T.r * 2.6, 0.35, 'b');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; Part(_S.fx.glow.b, e.x + Math.cos(a) * e.T.r, e.y - 4 + Math.sin(a) * e.T.r, Math.cos(a) * 70, Math.sin(a) * 70, 0.3, 7, -10, 0, 1); }
  }
  function DeathFx(e) {
    const T = e.T, y = T.fly ? e.y - 12 : e.y - 4, sc = _S.fx.scrap, n = T.boss ? 30 : 9;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = 30 + Math.random() * (T.boss ? 140 : 60);
      Part(sc[T.c === 'F' ? 2 : T.c === 'A' ? 1 : i % 3 ? 0 : 3], e.x, y, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 90 - Math.random() * 50, 0.55 + Math.random() * 0.35, 7, 0, 330, 0, a, (Math.random() - 0.5) * 16);
    }
    Smoke(e.x, y, 'w', T.boss ? 10 : 3);
    Part(_S.fx.glow.w, e.x, y, 0, 0, 0.14, T.r * 1.6, T.r * 6, 0, 1);
    if (T.boss) {
      Ring(e.x, y, 10, 120, 0.7, 'o');
      for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, v = 120 + Math.random() * 160; Part(_S.fx.spark, e.x, y, Math.cos(a) * v, Math.sin(a) * v, 0.45, 12, -10, 0, 1, a); }
      Part(_S.fx.glow.o, e.x, y, 0, 0, 0.4, 40, 160, 0, 1);
    }
  }
  function PulseFx(t, fr) {
    Ring(t.x, t.y - 4, 10, t.L.range, 0.5, fr ? 'w' : 'c');
    for (let i = 0; i < (fr ? 10 : 6); i++) { const a = Math.random() * TAU, v = 50 + Math.random() * 60; Part(_S.fx.snow, t.x, t.y - 8, Math.cos(a) * v, Math.sin(a) * v, 0.8, 7, -4, 0, 0, a, 3); }
    Part(_S.fx.glow.c, t.x - 6, t.y - 8, 0, 0, 0.2, 16, 40, 0, 1);
  }
  function SplashFx(x, y, c) {
    Ring(x, y, 4, 34, 0.3, c === 'g' ? 'g' : c === 'y' ? 'o' : 'v');
    for (let i = 0; i < 7; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 50; Part(_S.fx.smoke[c], x, y, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 60, 0.45, 5, -3, 220); }
  }
  function BoomFx(x, y, R, small) {
    Part(_S.fx.glow.o, x, y, 0, 0, small ? 0.1 : 0.16, R * 0.6, R * 3, 0, 1);
    Ring(x, y, 6, R, small ? 0.25 : 0.35, 'o');
    const sc = _S.fx.scrap;
    for (let i = 0; i < (small ? 3 : 7); i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 70; Part(sc[i % 2 ? 0 : 3], x, y, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 80 - Math.random() * 40, 0.6, 7, 0, 320, 0, a, (Math.random() - 0.5) * 14); }
    Smoke(x, y, 'd', small ? 1 : 3);
    Smoke(x, y, 'w', small ? 1 : 2);
  }
  function BuildFx(t) {
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; Part(_S.fx.smoke.w, t.x + Math.cos(a) * 16, t.y + 6 + Math.sin(a) * 7, Math.cos(a) * 30, Math.sin(a) * 12 - 6, 0.5, 8, 12); }
    if (t.lv) for (let i = 0; i < 6; i++) Part(_S.fx.star, t.x + (Math.random() - 0.5) * 30, t.y - Math.random() * 16, 0, -40 - Math.random() * 30, 0.8, 8, -3, 0, 1, 0, 3);
    Ring(t.x, t.y, 8, 30, 0.35, 'w');
  }

  function UpdateFx(dt) {
    for (let i = XP.n - 1; i >= 0; i--) {
      const p = XP.a[i];
      p.t += dt;
      if (p.t >= p.T) { Drop(XP, i); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.s += p.ds * dt; p.rot += p.vr * dt;
      if (p.g) p.vx *= 0.98;
    }
    for (let i = TP.n - 1; i >= 0; i--) { const p = TP.a[i]; p.t += dt; if (p.t >= p.T) Drop(TP, i); else p.y -= dt * 24; }
    for (let i = BP.n - 1; i >= 0; i--) { const b = BP.a[i]; b.t += dt; if (b.t >= b.T) Drop(BP, i); }
    for (let i = RP.n - 1; i >= 0; i--) { const r = RP.a[i]; r.t += dt; if (r.t >= r.T) Drop(RP, i); }
  }

  let _ox = 0, _oy = 0, _now = 0;
  const _ord = new Int16Array(420), _fly = new Int16Array(420), _fonts = {};
  function Font(z) { return _fonts[z] || (_fonts[z] = `900 ${z}px ${FONT}`); }
  function Reset() { _ctx.setTransform(_k, 0, 0, _k, _ox * _k, _oy * _k); }
  function Rot(img, x, y, a, q = 1) {
    const c = Math.cos(a) * _k * q, s = Math.sin(a) * _k * q;
    _ctx.setTransform(c, s, -s, c, (x + _ox) * _k, (y + _oy) * _k);
    _ctx.drawImage(img.c, -img.ax, -img.ay, img.w, img.h);
  }

  function DrawTower(t) {
    const ctx = _ctx, sp = _S.tw[t.D.id][t.lv], id = t.D.id;
    if (GS.sel === t) {
      ctx.beginPath(); ctx.ellipse(t.x, t.y + 9, 21, 9, 0, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.65 + Math.sin(_now * 6) * 0.3; ctx.stroke(); ctx.globalAlpha = 1;
    }
    Blit(sp.base, t.x, t.y);
    if (sp.top) {
      const r = t.rc * 2.4, c = Math.cos(t.ang), s = Math.sin(t.ang);
      Rot(sp.top, t.x - c * r, t.y - 4 - s * r, t.ang);
      Reset();
    } else if (id === 'airco') {
      const W = [24, 27, 30, 30, 30][t.lv];
      Rot(sp.fan, t.x - W / 4 + 1, t.y - 7.5, t.an * 16);
      Reset();
    } else if (id === 'chem') {
      const big = t.lv === 3, r = t.lv >= 2 ? 8.5 : 7.5, by = big ? t.y - 10 : t.y - 6 - r * 0.15;
      ctx.fillStyle = t.lv === 3 ? 'rgba(254,249,195,0.9)' : t.lv === 4 ? 'rgba(243,232,255,0.9)' : 'rgba(220,252,231,0.9)';
      for (let i = 0; i < 3; i++) {
        const ph = (t.an * 0.9 + i / 3) % 1;
        ctx.globalAlpha = 1 - ph;
        ctx.beginPath(); ctx.arc(t.x + Math.sin(i * 2.1 + t.an * 3) * (big ? 5 : 3), by + 3 - ph * (big ? 9 : r * 0.9), 0.8 + ph * 1.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (id === 'plasma') {
      const r = [8.5, 9.5, 10.5, 11, 11][t.lv], cx = t.x, cy = t.y - 11, sd = (t.an * 11) | 0;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = t.lv === 4 ? 'rgba(254,205,211,0.9)' : t.lv === 3 ? 'rgba(191,219,254,0.9)' : 'rgba(233,213,255,0.9)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const a = Math.sin((sd + j * 17) * 12.9898) * 43758.5453 % 1 * TAU;
        ctx.moveTo(cx, cy);
        for (let q = 1; q <= 3; q++) {
          const rr = r * q / 3 * 0.92, w = q < 3 ? Math.sin((sd + j * 7 + q) * 78.233) * 0.5 : 0;
          ctx.lineTo(cx + Math.cos(a + w) * rr, cy + Math.sin(a + w) * rr);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(_now * 9);
      ctx.drawImage(_S.fx.glow[t.lv === 4 ? 'r' : t.lv === 3 ? 'b' : 'v'].c, cx - 7, cy - 7, 14, 14);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function DrawEn(e) {
    const ctx = _ctx, k = _k, f = (e.an * 4 | 0) & 3, img = _S.en[e.T.c][e.dir < 0 && !e.T.fly ? 1 : 0][e.flash > 0 ? 1 : e.slowT > 0 && !e.frz ? 2 : 0][f];
    let y = e.y;
    if (e.T.fly) {
      const c = e.ux * k, s = e.uy * k, sh = _S.fx.planeShadow;
      y = e.y - 12 + Math.sin(e.an * 3) * 1.6;
      ctx.setTransform(c, s, -s, c, (e.x + 5 + _ox) * k, (e.y + 9 + _oy) * k);
      ctx.drawImage(sh.c, -sh.ax, -sh.ay, sh.w, sh.h);
      ctx.setTransform(c, s, -s, c, (e.x + _ox) * k, (y + _oy) * k);
      ctx.drawImage(img.c, -img.ax, -img.ay, img.w, img.h);
    } else {
      if (e.rage) { ctx.globalAlpha = 0.5 + Math.sin(_now * 10) * 0.2; ctx.drawImage(_S.fx.glow.r.c, e.x - 44, e.y - 54, 88, 88); ctx.globalAlpha = 1; }
      Blit(img, e.x, e.y);
      y = e.y - e.T.r * 0.35;
    }
    if (e.T.fly) Reset();
    const r = e.T.r;
    if (e.frz) { ctx.globalAlpha = 0.92; ctx.drawImage(_S.fx.ice.c, e.x - r * 1.3, y - r * 1.4, r * 2.6, r * 2.7); ctx.globalAlpha = 1; }
    if (e.stop > 0 && !e.frz) for (let i = 0; i < 3; i++) { const a = _now * 6 + i * 2.09; ctx.drawImage(_S.fx.star.c, e.x + Math.cos(a) * r * 0.8 - 3, y - r * 1.2 + Math.sin(a) * 2.5 - 3, 6, 6); }
    if (e.sh > 0) { const q = r * 1.7; ctx.globalAlpha = 0.45 + 0.55 * Math.min(1, e.sh / e.shMax); ctx.drawImage(_S.fx.bubble.c, e.x - q, y - q, q * 2, q * 2); ctx.globalAlpha = 1; }
    if (e.shred > 0 && (e.id + (_now * 8 | 0)) % 9 === 0) Part(_S.fx.smoke.g, e.x + (Math.random() - 0.5) * r, y, 0, 18, 0.4, 3, 2);
  }

  function Bar(e) {
    if (!e.T.boss && e.hp >= e.max && !e.sh) return;
    const ctx = _ctx, w = e.T.boss ? 40 : Math.max(16, e.T.r * 1.8), x = e.x - w / 2;
    const y = (e.T.fly ? e.y - 12 : e.y) - EN_BOX[e.T.c][2] + (e.T.boss ? 8 : 3);
    const f = Math.max(0, e.hp / e.max);
    ctx.fillStyle = 'rgba(20,16,34,0.78)'; ctx.fillRect(x - 1, y - 1, w + 2, 5);
    ctx.fillStyle = f > 0.55 ? '#4ade80' : f > 0.28 ? '#facc15' : '#f87171'; ctx.fillRect(x, y, w * f, 3);
    if (e.sh > 0) { ctx.fillStyle = 'rgba(20,16,34,0.78)'; ctx.fillRect(x - 1, y - 4, w + 2, 3); ctx.fillStyle = '#7dd3fc'; ctx.fillRect(x, y - 3.5, w * Math.min(1, e.sh / e.shMax), 2); }
    if (e.T.armor) { ctx.fillStyle = '#cbd5e1'; ctx.fillRect(x - 4, y - 1, 3, 5); }
  }

  function DrawWorld() {
    let n = 0, nf = 0;
    for (let i = 0; i < EP.n; i++) { const e = EP.a[i]; if (e.dead) continue; if (e.T.fly) _fly[nf++] = i; else _ord[n++] = i; }
    for (let i = 1; i < n; i++) {
      const v = _ord[i], y = EP.a[v].y;
      let j = i - 1;
      while (j >= 0 && EP.a[_ord[j]].y > y) { _ord[j + 1] = _ord[j]; j--; }
      _ord[j + 1] = v;
    }
    const T = GS.towers;
    let a = 0, b = 0;
    while (a < T.length || b < n) {
      if (b >= n || (a < T.length && T[a].y + 8 <= EP.a[_ord[b]].y)) DrawTower(T[a++]);
      else DrawEn(EP.a[_ord[b++]]);
    }
    for (let i = 0; i < nf; i++) DrawEn(EP.a[_fly[i]]);
    for (let i = 0; i < n; i++) Bar(EP.a[_ord[i]]);
    for (let i = 0; i < nf; i++) Bar(EP.a[_fly[i]]);
  }

  function DrawPuddles() {
    const ctx = _ctx;
    for (let i = 0; i < DP.n; i++) {
      const d = DP.a[i], u = d.t / d.T, img = _S.fx.puddle[d.i], r = d.r * Math.min(1, 0.5 + d.t * 4);
      ctx.globalAlpha = (u > 0.75 ? (1 - u) / 0.25 : 1) * (d.air ? 0.7 : 0.78);
      ctx.drawImage(img.c, d.x - r * 1.25, d.y - r * 0.9 - (d.air ? 6 : 0), r * 2.5, r * 1.8);
    }
    ctx.globalAlpha = 1;
  }

  function DrawShots() {
    const ctx = _ctx;
    for (let i = 0; i < PP.n; i++) {
      const p = PP.a[i];
      if (p.k === K_DART || p.k === K_INK) { Rot(p.k === K_INK ? _S.fx.ink : p.img, p.x, p.y, p.rot); Reset(); continue; }
      const u = p.t / p.T, h = Math.sin(u * Math.PI) * p.H;
      ctx.fillStyle = 'rgba(20,16,34,0.22)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 6 - h * 0.06, 3 - h * 0.03, 0, 0, TAU); ctx.fill();
      Rot(p.img, p.x, p.y - h, p.rot, p.k === K_BOMB ? 0.7 : 1); Reset();
    }
  }

  function DrawBeams() {
    if (!BP.n) return;
    const ctx = _ctx;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < BP.n; i++) {
      const b = BP.a[i];
      ctx.globalAlpha = 1 - b.t / b.T;
      ctx.beginPath(); ctx.moveTo(b.xs[0], b.ys[0]);
      for (let j = 1; j < b.n; j++) ctx.lineTo(b.xs[j], b.ys[j]);
      ctx.strokeStyle = b.glow; ctx.lineWidth = b.w * 2.6; ctx.stroke();
      ctx.strokeStyle = b.core; ctx.lineWidth = b.w * 0.7; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function DrawRings() {
    const ctx = _ctx;
    for (let i = 0; i < RP.n; i++) {
      const p = RP.a[i], u = p.t / p.T, r = p.r0 + (p.r1 - p.r0) * (1 - (1 - u) * (1 - u));
      ctx.globalAlpha = (1 - u) * 0.9;
      ctx.drawImage(p.img.c, p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function DrawParts() {
    const ctx = _ctx;
    for (let pass = 0; pass < 2; pass++) {
      if (pass) ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < XP.n; i++) {
        const p = XP.a[i];
        if (p.add !== pass) continue;
        const img = p.img, s = p.s > 0 ? p.s : 0;
        ctx.globalAlpha = 1 - p.t / p.T;
        if (p.rot || p.vr) { Rot(img, p.x, p.y, p.rot, s / img.w); Reset(); }
        else { const h = s * img.h / img.w; ctx.drawImage(img.c, p.x - s / 2, p.y - h / 2, s, h); }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function Outlined(s, x, y, font, col, lw = 3) {
    const ctx = _ctx;
    ctx.font = font; ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(20,16,34,0.85)';
    ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
  }

  function DrawTexts() {
    if (!TP.n) return;
    const ctx = _ctx;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let i = 0; i < TP.n; i++) {
      const p = TP.a[i], u = p.t / p.T;
      ctx.globalAlpha = u < 0.65 ? 1 : (1 - u) / 0.35;
      Outlined(p.s, p.x, p.y, Font(p.z), p.c);
    }
    ctx.globalAlpha = 1;
  }

  function RangeRing(x, y, r, ok) {
    const ctx = _ctx;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = ok ? 'rgba(255,255,255,0.13)' : 'rgba(248,113,113,0.16)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,16,34,0.22)'; ctx.stroke();
    ctx.setLineDash([7, 6]); ctx.lineDashOffset = -_now * 14;
    ctx.lineWidth = 1.6; ctx.strokeStyle = ok ? 'rgba(255,255,255,0.92)' : 'rgba(254,202,202,0.95)'; ctx.stroke();
    ctx.setLineDash([]);
  }

  function DrawRanges() {
    const t = GS.sel || GS.hov;
    if (!t || GS.status !== 'playing' && GS.status !== 'paused') return;
    if (t === GS.sel && GS.upPrev >= 0) { RangeRing(t.x, t.y, t.D.lv[GS.upPrev].range, 1); _ctx.globalAlpha = 0.5; RangeRing(t.x, t.y, t.L.range, 1); _ctx.globalAlpha = 1; }
    else RangeRing(t.x, t.y, t.L.range, 1);
  }

  function DrawPlacement() {
    if (GS.place < 0 || GS.hx < 0 || GS.status !== 'playing') return;
    const ctx = _ctx, st = CanPlace(GS.hx, GS.hy, GS.place), x = GS.hx * CELL + CELL / 2, y = GS.hy * CELL + CELL / 2, D = TOWERS[GS.place], sp = _S.tw[D.id][0];
    ctx.beginPath(); ctx.roundRect(x - 18, y - 18, 36, 36, 7);
    ctx.fillStyle = st === 1 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.35)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = st === 1 ? '#4ade80' : '#f87171'; ctx.stroke();
    if (st) RangeRing(x, y, D.lv[0].range, st === 1);
    ctx.globalAlpha = st === 1 ? 0.88 : 0.5;
    Blit(sp.base, x, y);
    if (sp.top) { Rot(sp.top, x, y - 4, -0.6); Reset(); }
    ctx.globalAlpha = 1;
  }

  function BadgeX(P) { return Math.max(17, Math.min(CV_W - 17, P.xs[0])); }
  function BadgeY(P) { return Math.max(17, Math.min(CV_H - 17, P.ys[0])); }

  function DrawBadges() {
    if (!CanCall() || (GS.wave > 0 && GS.cd <= 0)) return;
    const ctx = _ctx;
    for (const P of GS.M.starts) {
      const x = BadgeX(P), y = BadgeY(P), hov = (GS.mx - x) ** 2 + (GS.my - y) ** 2 < 300, r = 13 * (1 + Math.sin(_now * 6) * 0.06) * (hov ? 1.12 : 1);
      ctx.globalAlpha = 0.5; ctx.drawImage(_S.fx.glow.y.c, x - 26, y - 26, 52, 52); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fef3c7'; ctx.stroke();
      if (GS.cd > 0) { ctx.beginPath(); ctx.arc(x, y, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * GS.cd / GS.cdMax); ctx.lineWidth = 3; ctx.strokeStyle = '#fbbf24'; ctx.stroke(); }
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 1, y); ctx.lineTo(x - 6, y + 5);
      ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5);
      ctx.lineWidth = 2.4; ctx.strokeStyle = '#fde68a'; ctx.stroke();
      const b = EarlyBonus();
      if (hov && b) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; Outlined(PlusStr(b), x + r + 6, y, Font(13), '#fbbf24'); }
    }
  }

  function DrawBossBar() {
    const e = GS.boss;
    if (!e || e.dead) return;
    const ctx = _ctx, w = 250, x = CV_W / 2 - w / 2, y = 10, f = Math.max(0, e.hp / e.max);
    ctx.beginPath(); ctx.roundRect(x - 8, y - 4, w + 16, 30, 8); ctx.fillStyle = 'rgba(20,16,34,0.72)'; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = F_BADGE; ctx.fillStyle = '#fecaca';
    ctx.fillText(GS.bossName, CV_W / 2, y + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, y + 13, w, 7);
    ctx.fillStyle = e.rage ? '#f97316' : '#ef4444'; ctx.fillRect(x, y + 13, w * f, 7);
    if (e.sh > 0) { ctx.fillStyle = '#7dd3fc'; ctx.fillRect(x, y + 13, w * Math.min(1, e.sh / e.max), 2.5); }
  }

  function DrawBanner() {
    const ctx = _ctx;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (GS.banT > 0) {
      const t = 2.4 - GS.banT, a = Math.min(1, t * 5, GS.banT * 2.5), y = 84 - (1 - Math.min(1, t * 5)) * 14;
      ctx.globalAlpha = a;
      Outlined(GS.banA, CV_W / 2, y, F_BAN, GS.banBoss ? '#fca5a5' : '#ffffff', 5);
      if (GS.banB) Outlined(GS.banB, CV_W / 2, y + 26, F_SUB, GS.banBoss ? '#fecaca' : '#fde68a', 4);
      ctx.globalAlpha = 1;
    }
    if (GS.payT > 0) {
      ctx.globalAlpha = Math.min(1, GS.payT * 2);
      ctx.textAlign = 'left';
      Outlined(GS.payS, 10, CV_H - 14 - (2.6 - GS.payT) * 6, Font(12), '#fde68a');
      ctx.globalAlpha = 1;
    }
  }

  function Ambient(dt) {
    const pal = PALS[GS.M.pal].kind;
    if (pal === 2) { if (Math.random() < dt * 14) Part(_S.fx.snow, Math.random() * (CV_W + 120) - 60, -6, 10 + Math.random() * 14, 26 + Math.random() * 22, 9, 5 + Math.random() * 4, 0, 0, 0, 0.1, 1.2); }
    else if (_dark) { if (Math.random() < dt * 2.2) Part(_S.fx.glow.y, Math.random() * CV_W, Math.random() * CV_H, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 2.6, 6, 0, 0, 1); }
    else if (pal === 1 && Math.random() < dt * 1.2) Part(_S.fx.scrap[2], -6, Math.random() * CV_H, 40 + Math.random() * 30, 8 + Math.random() * 10, 14, 5, 0, 0, 0, 0.5, 2);
  }

  function Draw() {
    if (!_ctx || !GS || !_bg) return;
    const ctx = _ctx, k = _k;
    _ox = _oy = 0;
    if (GS.shake > 0 && GS.status === 'playing') { const m = Math.min(1, GS.shake) * 5; _ox = Math.round((Math.random() - 0.5) * m * k) / k; _oy = Math.round((Math.random() - 0.5) * m * k) / k; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (_ox || _oy) { ctx.fillStyle = PALS[GS.M.pal].grass; ctx.fillRect(0, 0, _cv.width, _cv.height); }
    ctx.drawImage(_bg.c, _ox * k, _oy * k);
    Reset();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (GS.place >= 0 && GS.status === 'playing') { ctx.globalAlpha = 0.62; ctx.drawImage(_grid.c, 0, 0, CV_W, CV_H); ctx.globalAlpha = 1; }
    DrawPuddles();
    DrawRanges();
    DrawWorld();
    DrawShots();
    DrawBeams();
    DrawRings();
    DrawParts();
    DrawTexts();
    DrawPlacement();
    DrawBadges();
    DrawBossBar();
    DrawBanner();
  }

  function Win() {
    GS.status = 'win';
    GS.stars = GS.lives >= 18 ? 3 : GS.lives >= 10 ? 2 : 1;
    GS.newUnlock = GS.mi < MAPS.length - 1 && !Unlocked(GS.mi + 1);
    const all = Stars(), id = GS.M.id;
    if (GS.stars > (all[id] || 0)) { all[id] = GS.stars; StorageSet(LS_STARS, all); }
    SaveWave(WAVES);
    GS.linger = 1.6;
    ShowEnd(true);
  }
  function Lose() {
    GS.status = 'gameover';
    SaveWave(GS.wave - 1);
    GS.linger = 1.2;
    ShowEnd(false);
  }
  function SaveWave(w) {
    const all = BestWaves(), id = GS.M.id;
    if (w > (all[id] || 0)) { all[id] = w; StorageSet(LS_WAVES, all); }
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
  function SetHTML(id, v) { const e = document.getElementById(id); if (e) e.innerHTML = v; }
  const SCREENS = ['gf-tw-start', 'gf-tw-pause', 'gf-tw-go', 'gf-tw-win'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
    HideTip();
    if (id) { _introT = 0; const el = document.getElementById('gf-tw-intro'); if (el) el.style.display = 'none'; }
    const st = Stars();
    SetText('gf-tw-startotal', `${MAPS.reduce((n, M) => n + (st[M.id] || 0), 0)}/${MAPS.length * 3}`);
  }

  function TName(D, lv) { return lv >= 3 ? _GameText(`td_u_${D.lv[lv].br}`) : _GameText(`td_t_${D.id}`); }
  function TCol(D, lv) { return lv === 4 ? D.col2 : D.col; }
  function StatRows(D, L) {
    const T = _GameText, rows = [];
    if (D.kind === 'flask') rows.push([T('td_st_acid'), `${L.dps}/s`]);
    else rows.push([T('td_st_damage'), D.kind === 'bolt' ? `${L.dmg} ×${L.chain}` : `${L.dmg}`]);
    if (L.slow) rows.push([T('td_st_slow'), `${Math.round(L.slow * 100)}%`]);
    if (L.splash) rows.push([T('td_st_splash'), (L.splash / CELL).toFixed(1)]);
    if (L.pool) rows.push([T('td_st_pool'), (L.pool / CELL).toFixed(1)]);
    rows.push([T('td_st_rate'), `${(1 / L.rate).toFixed(1)}/s`]);
    rows.push([T('td_st_range'), (L.range / CELL).toFixed(1)]);
    return rows;
  }
  function Tags(D, L) {
    const T = _GameText, out = [D.air || L.cloud ? T('td_tag_air') : T('td_tag_ground')];
    if (L.pierce) out.push(T('td_tag_pierce').replace('{n}', L.pierce));
    if (L.multi) out.push(T('td_tag_multi').replace('{n}', L.multi));
    if (L.pierceArmor) out.push(T('td_tag_armor'));
    if (L.bossX) out.push(T('td_tag_boss'));
    if (L.stun) out.push(T('td_tag_stun'));
    if (L.cluster) out.push(T('td_tag_cluster'));
    if (L.freeze) out.push(T('td_tag_freeze'));
    if (D.kind === 'flask') out.push(T('td_tag_shred'));
    if (D.kind === 'bolt') out.push(T('td_tag_shield'));
    if (D.kind === 'pulse') out.push(T('td_tag_slow'));
    return `<div class="gf-tw-tags">${out.map(s => `<span class="gf-tw-tag">${s}</span>`).join('')}</div>`;
  }
  function Rows(rows, old) {
    return `<div class="gf-tw-rows">${rows.map(([a, b], i) => `<span>${a}</span><b>${old && old[i] && old[i][1] !== b ? `<s>${old[i][1]}</s> ${b}` : b}</b>`).join('')}</div>`;
  }
  function CoinTxt(n) { return `<span class="gf-tw-coin"><img src="${_ico.coin}" alt="">${n}</span>`; }

  function TipHtml(spec) {
    const T = _GameText, [kind, v] = spec.split(':');
    if (kind === 't') {
      const D = TOWERS[+v], L = D.lv[0];
      return `<h4 style="color:${D.col}">${T(`td_t_${D.id}`)}</h4><p>${T(`td_t_${D.id}_d`)}</p>${Rows(StatRows(D, L))}${Tags(D, L)}<div class="gf-tw-tip-cost">${CoinTxt(L.cost)}</div>`;
    }
    if (kind === 'u' && GS && GS.sel) {
      const t = GS.sel, nl = +v, D = t.D, L = D.lv[nl];
      const name = nl >= 3 ? T(`td_u_${L.br}`) : `${T(`td_t_${D.id}`)} · ${T('td_level')} ${nl + 1}`;
      return `<h4 style="color:${TCol(D, nl)}">${name}</h4>${nl >= 3 ? `<p>${T(`td_u_${L.br}_d`)}</p>` : ''}${Rows(StatRows(D, L), StatRows(D, t.L))}${Tags(D, L)}<div class="gf-tw-tip-cost">${CoinTxt(L.cost)}</div>`;
    }
    if (kind === 'e') {
      const E = EN[v];
      return `<h4>${T(E.key)}</h4><p>${T(E.tr)}</p>`;
    }
    if (kind === 'g') return `<h4>${T('td_money')}</h4><p>${T('td_tip_money')}</p>`;
    return '';
  }

  let _tipEl = null;
  function ShowTip(el) {
    const tip = document.getElementById('gf-tw-tip'), modal = document.getElementById('gf-tw-modal');
    const html = TipHtml(el.dataset.tip);
    if (!tip || !html) { HideTip(); return; }
    tip.innerHTML = html;
    tip.style.display = 'block';
    const m = modal.getBoundingClientRect(), r = el.getBoundingClientRect(), side = el.closest('#gf-tw-toolbar');
    let x, y;
    if (side) { x = side.getBoundingClientRect().left - m.left - tip.offsetWidth - 8; y = r.top - m.top; }
    else { x = r.left - m.left + r.width / 2 - tip.offsetWidth / 2; y = r.bottom - m.top + 8; }
    tip.style.left = `${Math.max(8, Math.min(m.width - tip.offsetWidth - 8, x))}px`;
    tip.style.top = `${Math.max(8, Math.min(m.height - tip.offsetHeight - 8, y))}px`;
    if (GS && el.dataset.tip[0] === 'u') { GS.upPrev = +el.dataset.tip.slice(2); if (GS.status !== 'playing') Draw(); }
  }
  function HideTip() {
    _tipEl = null;
    const tip = document.getElementById('gf-tw-tip');
    if (tip) tip.style.display = 'none';
    if (GS) GS.upPrev = -1;
  }
  function OnTipOver(e) {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el === _tipEl) return;
    HideTip();
    _tipEl = el;
    if (el) ShowTip(el);
  }

  let _panelFor = null, _panelLv = -1;
  function UpBtn(t, lv) {
    const L = t.D.lv[lv], br = lv >= 3;
    return `<button class="gf-tw-up${br ? ' gf-tw-up-br' : ''}" data-up="${lv}" data-tip="u:${lv}" data-cost="${L.cost}">
      <img class="gf-tw-up-ico" src="${_ico.tw[t.D.id][lv]}" alt=""><span><b>${br ? _GameText(`td_u_${L.br}`) : `${_GameText('td_upgrade')} ▲ ${lv + 1}`}</b>${CoinTxt(L.cost)}</span></button>`;
  }
  function RenderPanel() {
    const el = document.getElementById('gf-tw-panel');
    if (!el || !GS) return;
    const T = _GameText, t = GS.sel;
    _panelFor = t; _panelLv = t ? t.lv : -1;
    if (!t) {
      el.innerHTML = `<div class="gf-tw-help">${T('td_help2')}</div>
        <div class="gf-tw-keys"><span><kbd>1-6</kbd>${T('td_towers').toLowerCase()}</span><span><kbd>${T('td_key_space')}</kbd>${T('td_next_wave').toLowerCase()}</span><span><kbd>F</kbd>${T('td_speed').toLowerCase()}</span><span><kbd>Del</kbd>${T('td_sell').toLowerCase()}</span><span><kbd>P</kbd>${T('game_pause').toLowerCase()}</span><span><kbd>R</kbd>${T('td_restart').toLowerCase()}</span></div>`;
      return;
    }
    const D = t.D, nl = NextLevels(t), pips = [0, 1, 2, 3].map(i => `<i class="${i <= Math.min(3, t.lv) ? 'on' : ''}"></i>`).join('');
    el.innerHTML = `
      <div class="gf-tw-sel-hd"><img src="${_ico.tw[D.id][t.lv]}" alt=""><div><b style="color:${TCol(D, t.lv)}">${TName(D, t.lv)}</b><small><span class="gf-tw-pips">${pips}</span>${t.kills} ${T('td_kills').toLowerCase()}</small></div></div>
      ${Rows(StatRows(D, t.L))}
      ${D.kind === 'pulse' ? '' : `<div class="gf-tw-tg-lbl">${T('td_target')}</div><div class="gf-tw-tg">${TG_KEYS.map((k, i) => `<button data-tg="${i}" class="${t.mode === i ? 'on' : ''}">${T(k)}</button>`).join('')}</div>`}
      <div class="gf-tw-ups">${nl.length ? nl.map(lv => UpBtn(t, lv)).join('') : `<div class="gf-tw-max">${T('td_max')}</div>`}</div>
      <button class="gf-tw-sell" data-act="sell">${T('td_sell')} ${CoinTxt(`+${SellValue(t)}`)}</button>`;
    RefreshAfford();
  }
  function RefreshAfford() {
    if (!_root || !GS) return;
    _root.querySelectorAll('.gf-tw-tool').forEach(b => b.classList.toggle('gf-tw-off', GS.money < TOWERS[+b.dataset.tower].lv[0].cost));
    _root.querySelectorAll('.gf-tw-up').forEach(b => b.classList.toggle('gf-tw-off', GS.money < +b.dataset.cost));
  }
  function SyncShop() {
    if (!_root || !GS) return;
    _root.querySelectorAll('.gf-tw-tool').forEach(b => b.classList.toggle('gf-tw-tool-on', +b.dataset.tower === GS.place));
  }

  function RenderPreview() {
    const el = document.getElementById('gf-tw-prev');
    if (!el || !GS) return;
    if (GS.wave >= WAVES) { el.innerHTML = ''; return; }
    const cnt = {}, order = [];
    for (const G of GS.plan[GS.wave]) { if (!(G.c in cnt)) { cnt[G.c] = 0; order.push(G.c); } cnt[G.c] += G.n; }
    el.innerHTML = `<span class="gf-tw-pv-lbl">${_GameText('game_next')}</span>` + order.map(c => `<span class="gf-tw-pv${c[0] === 'B' ? ' gf-tw-pv-boss' : ''}" data-tip="e:${c}"><img src="${_ico.en[c]}" alt="">${c[0] === 'B' ? _GameText('td_boss') : `×${cnt[c]}`}</span>`).join('');
  }

  const _h = { money: -1, lives: -1, wave: -1, call: -1, bonus: -1, bar: -1, speed: 0, intro: '' };
  let _introT = 0, _toastT = 0, _rTap = 0;
  function ResetHud() { for (const k in _h) _h[k] = typeof _h[k] === 'string' ? '' : -1; }
  function UpdateUI() {
    if (!GS || !_root) return;
    const T = _GameText;
    if (GS.money !== _h.money) { _h.money = GS.money; SetText('gf-tw-money', GS.money); RefreshAfford(); }
    if (GS.lives !== _h.lives) {
      const hit = GS.lives < _h.lives;
      _h.lives = GS.lives; SetText('gf-tw-lives', GS.lives);
      if (hit) { const c = document.getElementById('gf-tw-lives').parentNode; c.classList.remove('gf-tw-hit'); void c.offsetWidth; c.classList.add('gf-tw-hit'); }
    }
    const call = CanCall() ? 1 : 0, bonus = call ? EarlyBonus() : 0, bar = call && GS.cd > 0 ? Math.round(GS.cd / GS.cdMax * 100) : 0;
    if (GS.wave !== _h.wave) { _h.wave = GS.wave; SetText('gf-tw-wave', `${GS.wave}/${WAVES}`); RenderPreview(); _h.call = -1; }
    if (call !== _h.call || bonus !== _h.bonus) {
      _h.call = call; _h.bonus = bonus;
      const b = document.getElementById('gf-tw-startwave');
      b.disabled = !call;
      SetText('gf-tw-sw-lbl', GS.wave >= WAVES ? T('td_last_wave') : `▶ ${GS.wave ? T('td_next_wave') : T('td_start_wave')}`);
      SetText('gf-tw-sw-bonus', bonus ? PlusStr(bonus) : '');
      b.classList.toggle('gf-tw-pulse', call && !GS.wave);
    }
    if (bar !== _h.bar) { _h.bar = bar; document.getElementById('gf-tw-sw-bar').style.width = `${bar}%`; }
    if (GS.speed !== _h.speed) { _h.speed = GS.speed; const s = document.getElementById('gf-tw-speed'); s.textContent = `${GS.speed}x`; s.classList.toggle('on', GS.speed === 2); }
    if (GS.sel !== _panelFor || (GS.sel && GS.sel.lv !== _panelLv)) RenderPanel();
    if (GS.intro && GS.intro !== _h.intro) {
      _h.intro = GS.intro;
      const E = EN[GS.intro], el = document.getElementById('gf-tw-intro');
      el.innerHTML = `<img src="${_ico.en[GS.intro]}" alt=""><div><small>${T('td_new_enemy')}</small><b>${T(E.key)}</b><span>${T(E.tr)}</span></div>`;
      el.style.display = 'flex';
      _introT = performance.now() + 6500;
    }
    const now = performance.now();
    if (_introT && now > _introT) { _introT = 0; document.getElementById('gf-tw-intro').style.display = 'none'; }
    if (_toastT && now > _toastT) { _toastT = 0; document.getElementById('gf-tw-toast').classList.remove('on'); }
  }
  function Toast(msg) {
    const el = document.getElementById('gf-tw-toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('on');
    _toastT = performance.now() + 1700;
    if (!_raf) setTimeout(UpdateUI, 1750);
  }

  function ThumbFor(i) {
    const key = `${i}${_dark ? 'd' : 'l'}`;
    if (!_thumbs[key]) _thumbs[key] = BuildBg(i, _dark, 184 * Math.min(2, W.devicePixelRatio || 1) / CV_W);
    return _thumbs[key];
  }
  let _thumbs = {};
  function RenderMaps() {
    const el = document.getElementById('gf-tw-maps');
    if (!el) return;
    const T = _GameText, st = Stars(), bw = BestWaves();
    el.innerHTML = MAPS.map((M, i) => {
      const s = st[M.id] || 0, lock = !Unlocked(i);
      const stars = [1, 2, 3].map(n => `<img src="${n <= s ? _ico.star : _ico.star0}" alt="">`).join('');
      const meta = lock ? `<img src="${_ico.lock}" alt="">${T('td_locked')}` : s ? T('td_cleared') : bw[M.id] ? `${T('game_best')}: ${T('td_wave').toLowerCase()} ${bw[M.id]}/${WAVES}` : `${WAVES} ${T('td_waves_short')} · ${M.P.length > 1 ? T('td_two_paths') : T('td_one_path')}`;
      return `<button class="gf-tw-map${i === _mapSel ? ' gf-tw-map-sel' : ''}${lock ? ' gf-tw-map-lock' : ''}" data-map="${i}">
        <canvas width="184" height="123"></canvas>
        ${lock ? `<span class="gf-tw-map-lockico"><img src="${_ico.lock}" alt=""></span>` : ''}
        <span class="gf-tw-map-row"><b>${i + 1}. ${T(M.key)}</b><span class="gf-tw-map-stars">${stars}</span></span>
        <span class="gf-tw-map-meta">${meta}</span>
      </button>`;
    }).join('');
    el.querySelectorAll('canvas').forEach((c, i) => {
      const th = ThumbFor(i), d = Math.min(2, W.devicePixelRatio || 1);
      c.width = 184 * d; c.height = 123 * d;
      c.getContext('2d').drawImage(th.c, 0, 0, c.width, c.height);
    });
    const play = document.getElementById('gf-tw-play');
    if (play) play.disabled = !Unlocked(_mapSel);
  }

  function ShowEnd(win) {
    const T = _GameText;
    if (win) {
      SetHTML('gf-tw-win-stars', [1, 2, 3].map(i => `<img class="${i <= GS.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.2}s" src="${i <= GS.stars ? _ico.star : _ico.star0}" alt="">`).join(''));
      SetText('gf-tw-win-map', `${T(GS.M.key)} · ${T('td_cleared').toLowerCase()}`);
      SetHTML('gf-tw-win-stat', `${T('td_report')}: <b style="color:${GradeColor(GS.lives / START_LIVES * 100)}">${GS.lives}/${START_LIVES}</b><br>${T('game_score')}: ${GS.score} · ${T('td_kills')}: ${GS.kills}`);
      SetText('gf-tw-win-new', GS.newUnlock ? T('td_unlocked') : GS.mi === MAPS.length - 1 ? T('td_all_clear') : GS.stars < 3 ? T('td_star_hint') : '');
      document.getElementById('gf-tw-next').style.display = GS.mi < MAPS.length - 1 ? '' : 'none';
      ShowScreen('gf-tw-win');
    } else {
      SetHTML('gf-tw-go-stat', `${T('td_wave')} ${GS.wave}/${WAVES} · ${T('game_score')}: ${GS.score}`);
      ShowScreen('gf-tw-go');
    }
  }

  function SetMap(mi) {
    if (!GS || GS.mi !== mi) GS = NewGame(mi);
    if (_bgMap !== mi || !_bg) RebuildMap();
    SetText('gf-tw-mapname', _GameText(MAPS[mi].key));
  }
  let _bgMap = -1;
  function RebuildMap() {
    if (!GS) return;
    _bg = BuildBg(GS.mi, _dark, _k);
    _grid = BuildGridOverlay(GS.M, _k);
    _bgMap = GS.mi;
  }
  function Rebuild() {
    _S = { tw: BuildTowerSprites(), en: BuildEnemySprites(), fx: BuildFxSprites() };
    RebuildMap();
  }

  function ShowStart() {
    StopLoop();
    GS = null;
    SetMap(_mapSel);
    GS.status = 'start';
    ResetHud();
    UpdateUI();
    RenderPanel();
    RenderMaps();
    Draw();
    ShowScreen('gf-tw-start');
  }

  function DoStart(mi) {
    if (!Unlocked(mi)) return;
    StopLoop();
    _mapSel = mi;
    GS = null;
    SetMap(mi);
    ResetHud();
    _introT = 0;
    document.getElementById('gf-tw-intro').style.display = 'none';
    ShowScreen(null);
    SyncShop();
    UpdateUI();
    StartLoop();
  }
  function Restart() { if (GS && GS.status !== 'start') DoStart(GS.mi); }
  function NextOrReplay() { if (GS.mi < MAPS.length - 1 && Unlocked(GS.mi + 1)) DoStart(GS.mi + 1); else DoStart(GS.mi); }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); Draw(); ShowScreen('gf-tw-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }
  function ToggleSpeed() {
    if (!GS) return;
    GS.speed = GS.speed === 2 ? 1 : 2;
    StorageSet(LS_SPEED, GS.speed);
    UpdateUI();
  }
  function PickTower(i) {
    if (!GS || GS.status !== 'playing' || !TOWERS[i]) return;
    GS.place = GS.place === i ? -1 : i;
    GS.sel = null;
    SyncShop();
  }

  function StartLoop() { StopLoop(); _last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }
  function Frame(ts) {
    _raf = null;
    if (!GS) return;
    const dt = Math.min(0.05, Math.max(0, (ts - _last) / 1000));
    _last = ts; _now = ts / 1000;
    if (GS.status === 'playing') {
      GS.acc += dt * GS.speed;
      let n = 0;
      while (GS.acc >= STEP && n < 8 && GS.status === 'playing') { Step(STEP); GS.acc -= STEP; n++; }
      if (n === 8) GS.acc = 0;
      if (GS.status === 'playing') Ambient(dt);
      if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - dt);
    } else if (GS.linger > 0) { GS.linger -= dt; UpdateFx(dt); }
    Draw();
    UpdateUI();
    if (GS.status === 'playing' || GS.linger > 0) _raf = requestAnimationFrame(Frame);
  }

  function CanvasPos(e) {
    const r = _cv.getBoundingClientRect();
    return [(e.clientX - r.left) * CV_W / r.width, (e.clientY - r.top) * CV_H / r.height];
  }
  function TowerAt(cx, cy) { for (const t of GS.towers) if (t.cx === cx && t.cy === cy) return t; return null; }
  function OverBadge(x, y) {
    if (!CanCall() || (GS.wave > 0 && GS.cd <= 0)) return false;
    for (const P of GS.M.starts) if ((x - BadgeX(P)) ** 2 + (y - BadgeY(P)) ** 2 < 300) return true;
    return false;
  }
  function OnMove(e) {
    if (!GS || GS.status !== 'playing') return;
    const [x, y] = CanvasPos(e);
    GS.mx = x; GS.my = y;
    GS.hx = Math.floor(x / CELL); GS.hy = Math.floor(y / CELL);
    if (GS.hx < 0 || GS.hy < 0 || GS.hx >= COLS || GS.hy >= ROWS) GS.hx = GS.hy = -1;
    GS.hov = GS.place < 0 && GS.hx >= 0 ? TowerAt(GS.hx, GS.hy) : null;
    const cur = GS.hov || OverBadge(x, y) ? 'pointer' : GS.place >= 0 ? 'crosshair' : 'default';
    if (_cv.style.cursor !== cur) _cv.style.cursor = cur;
  }
  function OnLeave() { if (GS) { GS.hx = GS.hy = -1; GS.hov = null; GS.mx = GS.my = -99; } }
  function OnClick(e) {
    if (!GS || GS.status !== 'playing') return;
    const [x, y] = CanvasPos(e), cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    if (OverBadge(x, y)) { CallWave(); return; }
    if (GS.place >= 0) {
      const st = CanPlace(cx, cy, GS.place), tw = TowerAt(cx, cy);
      if (st === 1) { const t = PlaceTower(cx, cy, GS.place); if (!e.shiftKey || GS.money < TOWERS[GS.place].lv[0].cost) { GS.place = -1; GS.sel = t; } SyncShop(); }
      else if (st === 2) Toast(_GameText('td_no_money'));
      else if (tw) { GS.place = -1; GS.sel = tw; SyncShop(); }
      return;
    }
    GS.sel = TowerAt(cx, cy);
  }
  function OnContext(e) {
    if (!GS || GS.status !== 'playing') return;
    e.preventDefault();
    GS.place = -1; GS.sel = null;
    SyncShop();
  }
  function OnPanel(e) {
    if (!GS || GS.status !== 'playing' || !GS.sel) return;
    const b = e.target.closest('button');
    if (!b) return;
    const t = GS.sel;
    if (b.dataset.tg) { t.mode = +b.dataset.tg; RenderPanel(); }
    else if (b.dataset.up) { if (Upgrade(t, +b.dataset.up)) { HideTip(); RenderPanel(); } else Toast(_GameText('td_no_money')); }
    else if (b.dataset.act === 'sell') { HideTip(); Sell(t); RenderPanel(); }
  }

  function OnKey(e) {
    if (!GS || !_root || _root.style.display === 'none' || e.type !== 'keydown') return;
    const k = e.key, st = GS.status;
    const Eat = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === 'Escape') {
      Eat();
      if (st === 'playing' && GS.place >= 0) { GS.place = -1; SyncShop(); }
      else if (st === 'playing' && GS.sel) GS.sel = null;
      else if (st === 'playing' || st === 'paused') DoPause();
      else CloseGradeTower();
      return;
    }
    if (k === 'p' || k === 'P') { Eat(); if (st === 'playing' || st === 'paused') DoPause(); return; }
    if (k === 'r' || k === 'R') {
      Eat();
      if (st === 'playing' && performance.now() > _rTap) { _rTap = performance.now() + 2200; Toast(_GameText('td_restart_confirm')); }
      else if (st !== 'start') { _rTap = 0; Restart(); }
      return;
    }
    if (k === ' ' || k === 'Enter') {
      Eat();
      if (st === 'playing') CallWave();
      else if (st === 'start') DoStart(_mapSel);
      else if (st === 'gameover') Restart();
      else if (st === 'win') NextOrReplay();
      else if (st === 'paused') DoPause();
      return;
    }
    if (st !== 'playing') return;
    if (k >= '1' && k <= '6') { Eat(); PickTower(+k - 1); return; }
    if (k === 'f' || k === 'F') { Eat(); ToggleSpeed(); return; }
    if ((k === 'Delete' || k === 'Backspace') && GS.sel) { Eat(); Sell(GS.sel); return; }
    if ((k === 'u' || k === 'U') && GS.sel) {
      const nl = NextLevels(GS.sel);
      if (nl.length === 1) { Eat(); if (!Upgrade(GS.sel, nl[0])) Toast(_GameText('td_no_money')); }
    }
  }

  function AttachKeys() {
    if (_kh) return;
    _kh = OnKey;
    document.addEventListener('keydown', _kh, true);
    W.addEventListener('resize', Fit);
  }
  function DetachKeys() {
    if (!_kh) return;
    document.removeEventListener('keydown', _kh, true);
    W.removeEventListener('resize', Fit);
    _kh = null;
  }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-tw');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    let n = 0;
    for (let e = _cv; e; e = e.parentElement) if (e !== _view && getComputedStyle(e).filter.includes('invert')) n++;
    _view.style.filter = n % 2 ? 'invert(1) hue-rotate(180deg)' : '';
    const d = el.dataset.theme === 'dark';
    if (d !== _dark || !_S) {
      _dark = d; _thumbs = {};
      if (_S) Rebuild();
      if (GS) { Draw(); if (GS.status === 'start') RenderMaps(); }
    }
  }

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.42, Math.min(1.25, (innerWidth - 34 - SIDE_W) / CV_W, (innerHeight - 34 - HDR_H - HUD_H) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(CV_W * s), h = Math.round(CV_H * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    _root.style.setProperty('--tw-side-h', `${h + HUD_H}px`);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    clearTimeout(_fitT);
    if (!_S) Resize(bw, bh);
    else if (_cv.width !== bw || _cv.height !== bh) _fitT = setTimeout(() => Resize(bw, bh), 160);
    Draw();
  }
  let _fitT = 0;
  function Resize(bw, bh) {
    _cv.width = bw; _cv.height = bh;
    _k = bw / CV_W;
    Rebuild();
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-tw')) return;
    InjectCSS();
    _ico = BuildIcons();
    const T = _GameText, I = _ico;
    const root = document.createElement('div');
    root.id = 'gf-tw';
    const shop = TOWERS.map((D, i) => `
      <button class="gf-tw-tool" data-tower="${i}" data-tip="t:${i}">
        <span class="gf-tw-tool-key">${i + 1}</span>
        <img class="gf-tw-tool-icon" src="${I.tw[D.id][0]}" alt="">
        <span class="gf-tw-tool-name">${T(`td_t_${D.id}`)}</span>
        ${CoinTxt(D.lv[0].cost)}
      </button>`).join('');
    root.innerHTML = `
<div id="gf-tw-modal">
  <div id="gf-tw-hdr">
    <div class="gf-tw-hl">
      <div id="gf-tw-logo">GT</div>
      <span id="gf-tw-title">${T('tw_title')}</span>
      <span id="gf-tw-mapname"></span>
    </div>
    <div class="gf-tw-hr">
      <span id="gf-tw-starhdr"><img src="${I.star}" alt=""><span id="gf-tw-startotal">0/9</span></span>
      <button id="gf-tw-pause-btn" title="${T('game_pause_p')}">⏸</button>
      <button id="gf-tw-close" title="${T('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-tw-body">
    <div id="gf-tw-stage">
      <div id="gf-tw-hud">
        <div class="gf-twh-cell" title="${T('td_lives')}"><img src="${I.heart}" alt=""><span class="gf-twh-val" id="gf-tw-lives">${START_LIVES}</span></div>
        <div class="gf-twh-cell" data-tip="g"><img src="${I.coin}" alt=""><span class="gf-twh-val" id="gf-tw-money">0</span></div>
        <div class="gf-twh-cell" title="${T('td_wave')}"><img src="${I.wave}" alt=""><span class="gf-twh-val" id="gf-tw-wave">0/${WAVES}</span></div>
        <div id="gf-tw-prev"></div>
        <button id="gf-tw-startwave"><span id="gf-tw-sw-lbl"></span><b id="gf-tw-sw-bonus"></b><i id="gf-tw-sw-bar"></i></button>
        <button id="gf-tw-speed" title="${T('td_speed')} (F)">1x</button>
      </div>
      <div id="gf-tw-view"><canvas id="gf-tw-canvas" width="${CV_W}" height="${CV_H}"></canvas></div>
      <div id="gf-tw-intro"></div>
      <div id="gf-tw-toast"></div>
    </div>
    <div id="gf-tw-toolbar">
      <div class="gf-tw-tool-hdr">${T('td_towers')}</div>
      <div id="gf-tw-shop">${shop}</div>
      <div id="gf-tw-panel"></div>
    </div>

    <div id="gf-tw-start" class="gf-tw-scr">
      <div class="gf-tw-scr-logo">${T('tw_title')}</div>
      <div class="gf-tw-scr-sub">${T('tw_subtitle')}</div>
      <div id="gf-tw-maps" class="gf-tw-maps"></div>
      <button id="gf-tw-play" class="gf-tw-btn">▶&nbsp; ${T('game_play')}</button>
      <div class="gf-tw-scr-footer">${T('td_hint2')}</div>
    </div>

    <div id="gf-tw-pause" class="gf-tw-scr" style="display:none">
      <div class="gf-tw-scr-h">${T('game_paused')}</div>
      <button class="gf-tw-btn" id="gf-tw-resume">▶&nbsp; ${T('game_resume')}</button>
      <div class="gf-tw-row">
        <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-restart">↺&nbsp; ${T('td_restart')}</button>
        <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-back-pause">${T('td_maps')}</button>
      </div>
    </div>

    <div id="gf-tw-go" class="gf-tw-scr" style="display:none">
      <div class="gf-tw-card">
        <div class="gf-tw-scr-go">${T('game_gameover')}</div>
        <div id="gf-tw-go-stat" class="gf-tw-scr-stat"></div>
        <div class="gf-tw-scr-sub">${T('td_lose_hint')}</div>
        <div class="gf-tw-row">
          <button class="gf-tw-btn" id="gf-tw-retry">↺&nbsp; ${T('game_try_again')}</button>
          <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-back-go">${T('td_maps')}</button>
        </div>
      </div>
    </div>

    <div id="gf-tw-win" class="gf-tw-scr" style="display:none">
      <div class="gf-tw-card">
        <div class="gf-tw-scr-win">${T('td_victory')}</div>
        <div id="gf-tw-win-map" class="gf-tw-scr-sub"></div>
        <div id="gf-tw-win-stars" class="gf-tw-bigstars"></div>
        <div id="gf-tw-win-stat" class="gf-tw-scr-stat"></div>
        <div id="gf-tw-win-new" class="gf-tw-new"></div>
        <div class="gf-tw-row">
          <button class="gf-tw-btn" id="gf-tw-next">▶&nbsp; ${T('td_next_map')}</button>
          <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-replay">↺&nbsp; ${T('game_play_again')}</button>
          <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-back-win">${T('td_maps')}</button>
        </div>
      </div>
    </div>
  </div>
  <div id="gf-tw-tip"></div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _view = document.getElementById('gf-tw-view');
    _cv = document.getElementById('gf-tw-canvas');
    _ctx = _cv.getContext('2d');
    BindButtons();
  }

  function BindButtons() {
    const On = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    On('gf-tw-close', CloseGradeTower);
    On('gf-tw-pause-btn', DoPause);
    On('gf-tw-resume', DoPause);
    On('gf-tw-restart', Restart);
    On('gf-tw-play', () => DoStart(_mapSel));
    On('gf-tw-retry', Restart);
    On('gf-tw-replay', () => DoStart(GS.mi));
    On('gf-tw-next', NextOrReplay);
    On('gf-tw-back-go', ShowStart);
    On('gf-tw-back-win', ShowStart);
    On('gf-tw-back-pause', ShowStart);
    On('gf-tw-startwave', CallWave);
    On('gf-tw-speed', ToggleSpeed);
    On('gf-tw-panel', OnPanel);
    On('gf-tw-intro', () => { _introT = 1; });
    On('gf-tw-shop', e => { const b = e.target.closest('.gf-tw-tool'); if (b) PickTower(+b.dataset.tower); });
    On('gf-tw-maps', e => {
      const b = e.target.closest('[data-map]');
      if (!b) return;
      const i = +b.dataset.map;
      if (i === _mapSel && Unlocked(i) && e.detail > 1) { DoStart(i); return; }
      _mapSel = i;
      SetMap(i);
      GS.status = 'start';
      RenderMaps();
      Draw();
    });
    const m = document.getElementById('gf-tw-modal');
    m.addEventListener('mouseover', OnTipOver);
    m.addEventListener('mouseleave', HideTip);
    _cv.addEventListener('mousemove', OnMove);
    _cv.addEventListener('mouseleave', OnLeave);
    _cv.addEventListener('click', OnClick);
    _cv.addEventListener('contextmenu', OnContext);
  }

  function OpenGradeTower(grades) {
    if (grades?.length) { _grades = NormalizeGrades(grades); _bgMap = -1; _thumbs = {}; }
    if (!_grades.length) _grades = FallbackGrades();
    if (!document.getElementById('gf-tw')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    Fit();
    if (GS && GS.status === 'paused') { RenderMaps(); Draw(); ShowScreen('gf-tw-pause'); }
    else ShowStart();
  }
  function CloseGradeTower() {
    const el = document.getElementById('gf-tw');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    HideTip();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }
  function ToggleGradeTower(grades) {
    const el = document.getElementById('gf-tw');
    if (el && el.style.display !== 'none') CloseGradeTower(); else OpenGradeTower(grades);
  }
  function BossKeyTower() {
    const el = document.getElementById('gf-tw');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') DoPause();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeTower   = OpenGradeTower;
  W.CloseGradeTower  = CloseGradeTower;
  W.ToggleGradeTower = ToggleGradeTower;
  W.BossKeyTower     = BossKeyTower;

  function InjectCSS() {
    if (document.getElementById('gf-tw-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-tw-css';
    s.textContent = `
#gf-tw {
  --tw-modal:#fff;--tw-hdr:#f5f7f5;--tw-bar:#fafbfa;--tw-scr:rgba(248,250,248,0.95);
  --tw-brd:rgba(34,211,238,0.24);--tw-brd2:#e2e6e3;--tw-btn-brd:#d0d5d2;
  --tw-txt:#111;--tw-txt2:#555;--tw-txt3:#8f968f;
  --tw-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-tw[data-theme="dark"] {
  --tw-modal:rgba(13,14,18,0.97);--tw-hdr:rgba(8,9,12,0.95);--tw-bar:rgba(10,11,15,0.98);
  --tw-scr:rgba(8,10,20,0.92);--tw-brd:rgba(34,211,238,0.2);--tw-brd2:#1e2128;
  --tw-btn-brd:#343842;--tw-txt:#f5f5f5;--tw-txt2:#cbd5e1;--tw-txt3:#8a94a6;
  --tw-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-tw{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-tw *{box-sizing:border-box;}
#gf-tw img{-webkit-user-drag:none;user-select:none;}
#gf-tw-modal{position:relative;display:flex;flex-direction:column;background:var(--tw-modal);border:1px solid var(--tw-brd);border-radius:12px;box-shadow:var(--tw-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-tw-hdr{display:flex;align-items:center;justify-content:space-between;height:${HDR_H}px;padding:0 12px;background:var(--tw-hdr);border-bottom:1px solid var(--tw-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-tw-hl,.gf-tw-hr{display:flex;align-items:center;gap:8px;}
#gf-tw-logo{width:24px;height:24px;background:${ACCENT};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;}
#gf-tw-title{font-size:13px;font-weight:700;color:var(--tw-txt);letter-spacing:-0.3px;}
#gf-tw-mapname{font-size:10px;font-weight:700;color:var(--tw-txt2);padding:2px 8px;border:1px solid var(--tw-brd2);border-radius:999px;}
#gf-tw-mapname:empty{display:none;}
#gf-tw-starhdr{display:flex;align-items:center;gap:5px;height:24px;padding:0 8px;border:1px solid var(--tw-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:11px;font-weight:800;color:var(--tw-txt);}
#gf-tw-starhdr img{width:13px;height:13px;}
#gf-tw-pause-btn,#gf-tw-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--tw-btn-brd);border-radius:6px;background:transparent;color:var(--tw-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-tw-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-tw-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}

#gf-tw-body{position:relative;display:flex;flex-direction:row;flex-shrink:0;min-height:0;}
#gf-tw-stage{position:relative;display:flex;flex-direction:column;line-height:0;}
#gf-tw-hud{display:flex;align-items:center;gap:6px;height:${HUD_H}px;padding:0 8px;background:var(--tw-bar);border-bottom:1px solid var(--tw-brd);user-select:none;line-height:1.1;overflow:hidden;}
.gf-twh-cell{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 8px;border:1px solid var(--tw-brd2);border-radius:9px;background:rgba(128,128,128,0.08);flex-shrink:0;}
.gf-twh-cell img{width:16px;height:16px;}
.gf-twh-val{font-size:15px;font-weight:800;color:var(--tw-txt);min-width:22px;font-variant-numeric:tabular-nums;}
.gf-tw-hit{animation:gf-tw-hit .45s ease-out;}
@keyframes gf-tw-hit{0%{background:rgba(239,68,68,.45);transform:scale(1.08)}100%{background:rgba(128,128,128,0.08);transform:scale(1)}}
#gf-tw-prev{display:flex;align-items:center;gap:4px;margin-left:auto;min-width:0;overflow:hidden;}
.gf-tw-pv-lbl{font-size:9px;font-weight:800;letter-spacing:.8px;color:var(--tw-txt3);text-transform:uppercase;margin-right:2px;white-space:nowrap;}
.gf-tw-pv{display:flex;align-items:center;gap:1px;height:30px;padding:0 6px 0 1px;border-radius:8px;background:rgba(128,128,128,0.1);font-size:11px;font-weight:800;color:var(--tw-txt);white-space:nowrap;flex-shrink:0;}
.gf-tw-pv img{width:26px;height:26px;object-fit:contain;}
.gf-tw-pv-boss{background:rgba(239,68,68,0.16);color:#ef4444;}
#gf-tw-startwave{position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:none;border-radius:9px;background:#4ade80;color:#052e16;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 3px 12px rgba(74,222,128,.35);flex-shrink:0;transition:transform .12s,box-shadow .12s;}
#gf-tw-startwave:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(74,222,128,.5);}
#gf-tw-startwave:disabled{background:rgba(128,128,128,0.16);color:var(--tw-txt3);box-shadow:none;cursor:default;}
#gf-tw-sw-bonus{font-size:10px;padding:2px 6px;border-radius:999px;background:#052e16;color:#fde68a;}
#gf-tw-sw-bonus:empty{display:none;}
#gf-tw-sw-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:rgba(5,46,22,0.5);}
.gf-tw-pulse{animation:gf-tw-glow 1.1s ease-in-out infinite alternate;}
@keyframes gf-tw-glow{from{box-shadow:0 2px 8px rgba(74,222,128,.3)}to{box-shadow:0 0 0 4px rgba(74,222,128,.25),0 6px 22px rgba(74,222,128,.6)}}
#gf-tw-speed{height:32px;min-width:42px;border:1px solid var(--tw-btn-brd);border-radius:9px;background:transparent;color:var(--tw-txt2);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0;}
#gf-tw-speed:hover{border-color:#f59e0b;color:#f59e0b;}
#gf-tw-speed.on{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,0.14);}
#gf-tw-view{line-height:0;}
#gf-tw-canvas{display:block;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
#gf-tw-intro{position:absolute;left:10px;top:${HUD_H + 10}px;z-index:5;display:none;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:12px;background:var(--tw-modal);border:1px solid var(--tw-brd);box-shadow:0 8px 24px rgba(0,0,0,.18);line-height:1.25;cursor:pointer;max-width:270px;animation:gf-tw-in .35s ease-out;}
#gf-tw-intro img{width:40px;height:40px;object-fit:contain;flex-shrink:0;}
#gf-tw-intro div{display:flex;flex-direction:column;gap:2px;}
#gf-tw-intro small{font-size:9px;font-weight:800;letter-spacing:1px;color:#f59e0b;text-transform:uppercase;}
#gf-tw-intro b{font-size:13px;color:var(--tw-txt);}
#gf-tw-intro span{font-size:10px;color:var(--tw-txt2);}
@keyframes gf-tw-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
#gf-tw-toast{position:absolute;left:50%;bottom:16px;z-index:6;transform:translate(-50%,10px);padding:7px 14px;border-radius:9px;background:rgba(20,16,34,0.88);color:#fff;font-size:11px;font-weight:800;line-height:1.3;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;white-space:nowrap;}
#gf-tw-toast.on{opacity:1;transform:translate(-50%,0);}

#gf-tw-toolbar{display:flex;flex-direction:column;width:${SIDE_W}px;height:var(--tw-side-h,auto);background:var(--tw-bar);border-left:1px solid var(--tw-brd);padding:10px;gap:8px;line-height:1.25;overflow-y:auto;}
.gf-tw-tool-hdr{font-size:10px;font-weight:800;letter-spacing:1.2px;color:var(--tw-txt2);text-transform:uppercase;}
#gf-tw-shop{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.gf-tw-tool{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:3px 4px 5px;border:1px solid var(--tw-brd2);border-radius:10px;background:rgba(128,128,128,0.06);cursor:pointer;font-family:inherit;color:var(--tw-txt);transition:border-color .12s,background .12s,transform .12s;min-width:0;}
.gf-tw-tool:hover{border-color:rgba(34,211,238,0.55);background:rgba(34,211,238,0.07);transform:translateY(-1px);}
.gf-tw-tool-on{border-color:${ACCENT};background:rgba(34,211,238,0.16);box-shadow:inset 0 0 0 1px ${ACCENT};}
.gf-tw-tool-icon{width:38px;height:38px;}
.gf-tw-tool-name{font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.gf-tw-tool-key{position:absolute;left:6px;top:5px;font-size:9px;font-weight:800;color:var(--tw-txt3);}
.gf-tw-coin{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:800;color:#d97706;white-space:nowrap;}
.gf-tw-coin img{width:11px;height:11px;}
.gf-tw-off .gf-tw-coin{color:#ef4444;}
.gf-tw-tool.gf-tw-off .gf-tw-tool-icon{opacity:0.55;}
#gf-tw-panel{display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px solid var(--tw-brd2);flex:1;}
.gf-tw-help{font-size:10px;color:var(--tw-txt2);line-height:1.5;}
.gf-tw-keys{display:flex;flex-wrap:wrap;gap:5px 8px;font-size:9.5px;color:var(--tw-txt2);margin-top:auto;}
.gf-tw-keys span{display:flex;align-items:center;gap:4px;}
.gf-tw-keys kbd{font-family:inherit;font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;border:1px solid var(--tw-btn-brd);color:var(--tw-txt);background:rgba(128,128,128,0.08);}
.gf-tw-sel-hd{display:flex;align-items:center;gap:8px;}
.gf-tw-sel-hd img{width:36px;height:36px;flex-shrink:0;}
.gf-tw-sel-hd div{display:flex;flex-direction:column;gap:3px;min-width:0;}
.gf-tw-sel-hd b{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-tw-sel-hd small{display:flex;align-items:center;gap:6px;font-size:9.5px;color:var(--tw-txt3);}
.gf-tw-pips{display:inline-flex;gap:2px;}
.gf-tw-pips i{width:7px;height:7px;border-radius:2px;background:rgba(128,128,128,0.25);}
.gf-tw-pips i.on{background:#f59e0b;}
.gf-tw-rows{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:10.5px;}
.gf-tw-rows span{color:var(--tw-txt3);}
.gf-tw-rows b{color:var(--tw-txt);text-align:right;font-weight:800;}
.gf-tw-rows s{color:var(--tw-txt3);font-weight:600;margin-right:2px;}
#gf-tw-tip .gf-tw-rows b{color:var(--tw-txt);}
.gf-tw-tg-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--tw-txt3);text-transform:uppercase;margin-bottom:-3px;}
.gf-tw-tg{display:grid;grid-template-columns:1fr 1fr;gap:4px;}
.gf-tw-tg button{height:24px;border:1px solid var(--tw-brd2);border-radius:6px;background:transparent;color:var(--tw-txt2);font-family:inherit;font-size:9.5px;font-weight:800;cursor:pointer;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-tw-tg button:hover{border-color:rgba(34,211,238,.5);color:var(--tw-txt);}
.gf-tw-tg button.on{border-color:${ACCENT};background:rgba(34,211,238,0.15);color:var(--tw-txt);}
.gf-tw-ups{display:flex;flex-direction:column;gap:5px;}
.gf-tw-up{display:flex;align-items:center;gap:7px;padding:3px 8px 3px 4px;border:1px solid rgba(74,222,128,0.45);border-radius:9px;background:rgba(74,222,128,0.1);color:var(--tw-txt);font-family:inherit;cursor:pointer;text-align:left;line-height:1.2;transition:transform .12s,background .12s;}
.gf-tw-up:hover{background:rgba(74,222,128,0.2);transform:translateY(-1px);}
.gf-tw-up-br{border-color:rgba(167,139,250,0.5);background:rgba(167,139,250,0.1);}
.gf-tw-up-br:hover{background:rgba(167,139,250,0.2);}
.gf-tw-up.gf-tw-off{opacity:0.6;}
.gf-tw-up-ico{width:28px;height:28px;flex-shrink:0;}
.gf-tw-up>span{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;}
.gf-tw-up b{font-size:10.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-tw-max{font-size:10px;font-weight:800;color:#f59e0b;text-align:center;padding:6px;border:1px dashed rgba(245,158,11,.5);border-radius:8px;}
.gf-tw-sell{display:flex;align-items:center;justify-content:space-between;gap:6px;height:28px;padding:0 9px;border:1px solid rgba(248,113,113,0.38);border-radius:8px;background:rgba(248,113,113,0.08);color:#ef4444;font-family:inherit;font-size:10.5px;font-weight:800;cursor:pointer;margin-top:auto;}
.gf-tw-sell:hover{background:rgba(248,113,113,0.16);}

#gf-tw-tip{position:absolute;z-index:30;display:none;width:226px;padding:10px 12px;border-radius:10px;background:var(--tw-modal);border:1px solid var(--tw-brd);box-shadow:0 10px 30px rgba(0,0,0,.22);font-size:10.5px;color:var(--tw-txt2);line-height:1.45;pointer-events:none;}
#gf-tw-tip h4{margin:0 0 4px;font-size:13px;font-weight:800;color:var(--tw-txt);}
#gf-tw-tip p{margin:0 0 7px;}
.gf-tw-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px;}
.gf-tw-tag{font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;background:rgba(128,128,128,0.13);color:var(--tw-txt2);}
.gf-tw-tip-cost{margin-top:7px;}

.gf-tw-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--tw-scr);padding:22px;overflow-y:auto;line-height:1.4;text-align:center;}
#gf-tw-start{background:color-mix(in srgb,var(--tw-scr) 84%,transparent);}
#gf-tw-win,#gf-tw-go{background:color-mix(in srgb,var(--tw-scr) 55%,transparent);}
#gf-tw-pause{background:color-mix(in srgb,var(--tw-scr) 78%,transparent);}
.gf-tw-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 30px;border-radius:16px;background:var(--tw-scr);border:1px solid var(--tw-brd);box-shadow:0 14px 44px rgba(0,0,0,.2);max-width:560px;}
.gf-tw-scr-logo{font-size:34px;font-weight:800;color:${ACCENT};letter-spacing:-0.5px;text-shadow:0 0 40px rgba(34,211,238,0.45);line-height:1.05;}
.gf-tw-scr-h{font-size:22px;font-weight:800;color:var(--tw-txt);letter-spacing:4px;}
.gf-tw-scr-sub{font-size:12.5px;color:var(--tw-txt2);line-height:1.45;max-width:440px;}
.gf-tw-scr-go{font-size:30px;font-weight:800;color:#f87171;letter-spacing:5px;text-shadow:0 0 30px rgba(248,113,113,0.5);}
.gf-tw-scr-win{font-size:30px;font-weight:800;color:#4ade80;letter-spacing:3px;text-shadow:0 0 30px rgba(74,222,128,0.5);}
.gf-tw-scr-stat{font-size:13px;color:var(--tw-txt2);font-weight:700;line-height:1.6;}
.gf-tw-scr-footer{font-size:10.5px;color:var(--tw-txt3);line-height:1.5;max-width:560px;}
.gf-tw-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}
.gf-tw-maps{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}
.gf-tw-map{position:relative;display:flex;flex-direction:column;gap:6px;width:202px;padding:8px 8px 9px;border:1px solid var(--tw-brd2);border-radius:14px;background:var(--tw-modal);cursor:pointer;font-family:inherit;color:var(--tw-txt);text-align:left;line-height:1.2;transition:transform .14s,border-color .14s,box-shadow .14s;}
.gf-tw-map:hover{transform:translateY(-2px);border-color:rgba(34,211,238,.5);}
.gf-tw-map canvas{width:184px;height:123px;border-radius:9px;display:block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);}
.gf-tw-map-sel{border-color:${ACCENT};box-shadow:0 0 0 2px rgba(34,211,238,.35),0 12px 30px rgba(0,0,0,.16);}
.gf-tw-map-lock canvas{opacity:0.4;}
.gf-tw-map-lock{cursor:default;}
.gf-tw-map-lockico{position:absolute;left:50%;top:70px;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:rgba(20,16,34,0.7);display:flex;align-items:center;justify-content:center;}
.gf-tw-map-lockico img{width:24px;height:24px;}
.gf-tw-map-row{display:flex;align-items:center;justify-content:space-between;gap:6px;}
.gf-tw-map-row b{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-tw-map-stars{display:flex;gap:1px;flex-shrink:0;}
.gf-tw-map-stars img{width:14px;height:14px;}
.gf-tw-map-meta{display:flex;align-items:center;gap:4px;font-size:9.5px;color:var(--tw-txt3);font-weight:700;}
.gf-tw-map-meta img{width:11px;height:11px;}
.gf-tw-bigstars{display:flex;gap:8px;}
.gf-tw-bigstars img{width:46px;height:46px;opacity:0;animation:gf-tw-star .5s cubic-bezier(.2,1.6,.4,1) forwards;}
.gf-tw-bigstars img:not(.on){animation-name:gf-tw-star0;}
@keyframes gf-tw-star{from{opacity:0;transform:scale(0.2) rotate(-40deg)}to{opacity:1;transform:none}}
@keyframes gf-tw-star0{from{opacity:0}to{opacity:0.5}}
.gf-tw-new{font-size:11px;font-weight:800;color:#f59e0b;letter-spacing:1px;}
.gf-tw-new:empty{display:none;}

.gf-tw-btn{padding:9px 22px;border:1px solid ${ACCENT};border-radius:8px;background:rgba(34,211,238,0.10);color:#0891b2;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.3px;}
#gf-tw[data-theme="dark"] .gf-tw-btn{color:${ACCENT};}
.gf-tw-btn:hover:not(:disabled){background:rgba(34,211,238,0.22);box-shadow:0 4px 18px rgba(34,211,238,0.28);transform:translateY(-1px);}
.gf-tw-btn:disabled{opacity:0.45;cursor:default;}
#gf-tw[data-theme="dark"] .gf-tw-btn-sec,.gf-tw-btn-sec{border-color:var(--tw-btn-brd);color:var(--tw-txt2);background:transparent;}
.gf-tw-btn-sec:hover:not(:disabled){border-color:var(--tw-txt2);color:var(--tw-txt);background:rgba(128,128,128,0.06);box-shadow:none;}
`;
    document.head.appendChild(s);
  }

})(window);
