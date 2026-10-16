;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 480;
  const CV_H = 240;
  const GROUND_H = 32;
  const GROUND_Y = CV_H - GROUND_H;
  const GRAVITY = 0.0031;
  const JUMP_VEL = -0.64;
  const DOUBLE_VEL = -0.52;
  const PLAYER_X = 70;
  const PLAYER_W = 26;
  const PLAYER_H = 30;
  const TAU = Math.PI * 2;
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const MONO = '"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace';
  const F_HUD = `800 15px ${MONO}`;
  const F_HUD_S = `800 11px ${MONO}`;
  const F_TAG = `900 8.5px ${FONT}`;
  const F_COIN = `900 9px ${FONT}`;
  const F_POP = `900 15px ${FONT}`;
  const HDR_H = 41;
  const HILL_TW = 640;
  const TREE_TW = 560;
  const FENCE_TW = 400;
  const CLOUD_TW = 720;
  const GTILE = 64;
  const COLORS = ['#4ade80', '#a3e635', '#f97316', '#f87171', '#a78bfa'];

  const LS_BEST = 'gf-runner-best';

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }
  function SaveBest(v) { if (v > LoadBest()) StorageSet(LS_BEST, v); }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis','Engels','Sport','Latijn','Economie'];
    return Array.from({ length: 24 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }
  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }
  function PickGrade() {
    const g = _grades.length ? _grades : FallbackGrades();
    return g[0 | Math.random() * g.length];
  }
  function PickGood() {
    const g = (_grades.length ? _grades : FallbackGrades()).filter(x => (x.Pct ?? 60) >= 50);
    return g.length ? g[0 | Math.random() * g.length] : PickGrade();
  }
  function PickBad() {
    const g = (_grades.length ? _grades : FallbackGrades()).filter(x => (x.Pct ?? 60) < 50);
    return g.length ? g[0 | Math.random() * g.length] : PickGrade();
  }

  let GS = null, _grades = [], _raf = null, _kh = null, _tobs = null, _last = 0, _best = 0;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _dark = false, _S = null, _ox = 0, _oy = 0;
  const _hud = { best: -1, sc: -1, scStr: '00000', hiStr: 'HI 00000', grade: null, gradeStr: '' };

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
  function Rng(s) {
    return () => {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g, w, h, k, ax: w / 2, ay: h / 2 };
  }
  function SprA(w, h, ax, ay, fn) {
    const s = Cv(w, h, _k);
    s.ax = ax; s.ay = ay;
    s.g.translate(ax, ay);
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
  function Night(s, a = 0.2) { return _dark ? Shade(s, `rgba(16,24,64,${a})`) : s; }
  function Blit(s, x, y) { _ctx.drawImage(s.c, Math.round((x - s.ax) * _k) / _k, Math.round((y - s.ay) * _k) / _k, s.w, s.h); }
  function BlitT(s, x, y, a, sx, sy) {
    const c = _ctx, co = a ? Math.cos(a) * _k : _k, si = a ? Math.sin(a) * _k : 0;
    c.setTransform(co * sx, si * sx, -si * sy, co * sy, (x + _ox) * _k, (y + _oy) * _k);
    c.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
    Base();
  }
  function Base() { _ctx.setTransform(_k, 0, 0, _k, _ox * _k, _oy * _k); }

  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Ell(g, x, y, rx, ry, a = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function Fl(g, c, lw = 1.5) { g.fillStyle = c; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); } }
  function Ln(g, x1, y1, x2, y2, c, lw) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = c; g.lineWidth = lw; g.stroke(); }
  function Glow(g, x, y, r, c, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, Rgba(c, a)); gr.addColorStop(0.45, Rgba(c, a * 0.45)); gr.addColorStop(1, Rgba(c, 0));
    g.fillStyle = gr; Circ(g, x, y, r); g.fill();
  }
  function Star(g, x, y, r1, r2, n = 5) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, r = i % 2 ? r2 : r1; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath();
  }
  function Shadow(g, x, y, rx, ry, a = 0.22) { g.fillStyle = `rgba(20,16,34,${a})`; Ell(g, x, y, rx, ry); g.fill(); }
  function BlobRow(g, pts, outline, fills) {
    g.fillStyle = outline;
    for (const [x, y, r] of pts) { Circ(g, x, y, r + 1.5); g.fill(); }
    for (const [c, dx, dy, sc] of fills) {
      g.fillStyle = c;
      for (const [x, y, r] of pts) { Circ(g, x + dx * r, y + dy * r, r * sc); g.fill(); }
    }
  }

  function Leg(g, x, y, a, len, c) {
    g.save(); g.translate(x, y); g.rotate(a);
    RR(g, -2.6, -1, 5.2, len, 2.4); Fl(g, c, 1.4);
    Ell(g, 1.6, len - 0.6, 3.8, 2.2); Fl(g, Dk(c, 0.1), 1.3);
    g.restore();
  }
  function Eye(g, x, y, mode) {
    if (mode === 2) { Ln(g, x - 2.4, y - 2.4, x + 2.4, y + 2.4, OUT, 1.6); Ln(g, x + 2.4, y - 2.4, x - 2.4, y + 2.4, OUT, 1.6); return; }
    if (mode === 1) { Ln(g, x - 2.6, y + 0.4, x + 2.6, y + 0.4, OUT, 1.5); return; }
    Circ(g, x, y, 3.4); Fl(g, '#ffffff', 1.2);
    Circ(g, x + 1, y + 0.2, 1.7); g.fillStyle = OUT; g.fill();
    Circ(g, x + 1.6, y - 0.6, 0.6); g.fillStyle = '#fff'; g.fill();
  }
  function Pack(g, x, y, w, h) {
    RR(g, x, y, w, h, 3); Fl(g, '#6366f1', 1.4);
    RR(g, x + 1.5, y + h * 0.5, w - 3, h * 0.38, 1.6); Fl(g, '#818cf8', 1);
    Ln(g, x + 2, y + 1.6, x + w - 2, y + 1.6, 'rgba(255,255,255,0.4)', 1);
  }

  function DinoArt(g, c, f) {
    const run = [0.55, 0.05, -0.5, 0.05], duck = f === 5 || f === 6, dead = f === 7, blink = f === 8;
    const back = Dk(c, 0.18);
    if (duck) {
      const a = f === 5 ? 0.45 : -0.45;
      Leg(g, -6, -6, a, 5.5, back);
      Poly(g, [-12, -9, -24, -6, -12, -3]); Fl(g, Dk(c, 0.08), 1.4);
      Ell(g, -1, -8.5, 14, 7.5); Fl(g, c, 1.6);
      g.save(); Ell(g, -1, -8.5, 14, 7.5); g.clip();
      Ell(g, 0, -1, 16, 4.5); g.fillStyle = Dk(c, 0.16); g.fill();
      Ell(g, 2, -5.5, 9, 3.4); g.fillStyle = Lt(c, 0.5); g.fill();
      g.restore();
      Pack(g, -11, -17, 12, 7);
      Leg(g, 4, -6, -a, 5.5, c);
      RR(g, 8, -18, 18, 13, 5.5); Fl(g, c, 1.6);
      Ln(g, 11, -16.4, 21, -16.4, 'rgba(255,255,255,0.45)', 1.2);
      Eye(g, 18.5, -13.2, 0);
      Ln(g, 18, -8.2, 24.5, -8.2, OUT, 1.2);
      return;
    }
    const air = f === 4 || dead;
    const la = air ? -0.55 : run[f] || 0, ra = air ? 0.35 : -(run[f] || 0);
    const lift = !air && f === 0 ? -1.2 : 0, lift2 = !air && f === 2 ? -1.2 : 0;
    Leg(g, -5, -10 + lift2, air ? 0.5 : -la, 9, back);
    Poly(g, [-11, -16, -23, -12, -21, -9, -11, -9]); Fl(g, Dk(c, 0.08), 1.5);
    Ell(g, -2, -15, 11, 9); Fl(g, c, 1.7);
    g.save(); Ell(g, -2, -15, 11, 9); g.clip();
    Ell(g, -1, -6, 13, 4.5); g.fillStyle = Dk(c, 0.16); g.fill();
    Ell(g, 2, -12, 6.5, 5); g.fillStyle = Lt(c, 0.5); g.fill();
    g.restore();
    Pack(g, -14, -26, 9, 13);
    Leg(g, 3, -10 + lift, air ? -0.3 : ra, 9, c);
    RR(g, 0, -33, 17, 15, 6); Fl(g, c, 1.7);
    g.save(); RR(g, 0, -33, 17, 15, 6); g.clip();
    g.fillStyle = Dk(c, 0.12); g.fillRect(0, -21.5, 17, 4);
    g.restore();
    RR(g, 0, -33, 17, 15, 6); g.lineWidth = 1.7; g.strokeStyle = OUT; g.stroke();
    Ln(g, 3, -31, 12, -31, 'rgba(255,255,255,0.45)', 1.3);
    Eye(g, 10, -27, dead ? 2 : blink ? 1 : 0);
    if (dead) { Circ(g, 13.2, -21.3, 2); Fl(g, '#7f1d1d', 1.1); }
    else { g.beginPath(); g.arc(12.5, -23.6, 3, 0.25, 1.4); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke(); }
    Ell(g, 6.5, -22.6, 2, 1.2); g.fillStyle = 'rgba(244,114,182,0.55)'; g.fill();
    Ln(g, 5, -14, 9, -11 + (air ? -3 : 0), Dk(c, 0.1), 2.6);
    Ln(g, -11, -22, 2, -12.5, '#4338ca', 1.6);
  }

  function BooksArt(g, c) {
    Shadow(g, 0, 0.5, 15, 2.6);
    const cols = [Dk(c, 0.08), c, Lt(c, 0.18)];
    const L = [[-12, -9, 24, 9, -0.03], [-11, -17.5, 22, 8.5, 0.05], [-12, -26, 23, 8.5, -0.04]];
    for (let i = 0; i < 3; i++) {
      const [x, y, w, h, r] = L[i];
      g.save(); g.rotate(r);
      RR(g, x, y, w, h, 2); Fl(g, cols[i], 1.5);
      g.fillStyle = '#fbf7ea'; g.fillRect(x + w - 4, y + 1.6, 2.4, h - 3.2);
      Ln(g, x + 3, y + 2.2, x + w - 7, y + 2.2, 'rgba(255,255,255,0.45)', 1);
      Ln(g, x + 5, y + h / 2 + 0.5, x + 11, y + h / 2 + 0.5, Dk(cols[i], 0.3), 1.2);
      g.restore();
    }
    Circ(g, 6, -22, 3.6); g.lineWidth = 1.3; g.strokeStyle = '#ef4444'; g.stroke();
  }
  function PencilArt(g, c) {
    Shadow(g, 0, 0.5, 11, 2.4);
    RR(g, -8, -9, 16, 9, 2); Fl(g, '#f9a8d4', 1.5);
    g.fillStyle = '#cbd5e1'; g.fillRect(-8, -12.5, 16, 4); g.lineWidth = 1.3; g.strokeStyle = OUT; g.strokeRect(-8, -12.5, 16, 4);
    RR(g, -8, -36, 16, 24, 1); Fl(g, c, 1.5);
    g.fillStyle = Lt(c, 0.4); g.fillRect(-5.5, -35, 3, 22);
    g.fillStyle = Dk(c, 0.2); g.fillRect(3, -35, 4, 22);
    RR(g, -8, -36, 16, 24, 1); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke();
    Poly(g, [-8, -36, 0, -47, 8, -36]); Fl(g, '#f1c891', 1.5);
    Poly(g, [-2.6, -43.4, 0, -47.5, 2.6, -43.4]); Fl(g, '#374151', 1.1);
    Ell(g, -3, -27, 2.4, 2.7); Fl(g, '#fff', 1); Ell(g, 3, -27, 2.4, 2.7); Fl(g, '#fff', 1);
    Circ(g, -2.4, -26.4, 1.1); g.fillStyle = OUT; g.fill(); Circ(g, 3.6, -26.4, 1.1); g.fill();
    Ln(g, -5.5, -31, -1, -29.4, OUT, 1.4); Ln(g, 5.5, -31, 1, -29.4, OUT, 1.4);
    Ln(g, -2.5, -21.5, 2.5, -21.5, OUT, 1.3);
  }
  function PaperArt(g, c, f) {
    const flap = f ? -1 : 1;
    Poly(g, [-4, -2, -15, -9 * flap - 2, -10, 1]); Fl(g, '#e5e7eb', 1.3);
    Poly(g, [-11, -9, 9, -9, 12, -6, 12, 9, -11, 9]); Fl(g, '#fbfaf5', 1.5);
    Poly(g, [9, -9, 12, -6, 9, -6]); Fl(g, '#e2e0d6', 1);
    for (const y of [1.5, 5]) Ln(g, -8, y, 4, y, '#9ec5f8', 0.9);
    Ln(g, -8.5, -8, -8.5, 8, '#f6a3a3', 0.8);
    Ell(g, -3, -3.5, 2.4, 2.4); Fl(g, '#fff', 1); Ell(g, 3.4, -3.5, 2.4, 2.4); Fl(g, '#fff', 1);
    Circ(g, -2.4, -3, 1.1); g.fillStyle = OUT; g.fill(); Circ(g, 4, -3, 1.1); g.fill();
    Ln(g, -5.5, -7, -1.2, -5.4, OUT, 1.3); Ln(g, 6, -7, 1.6, -5.4, OUT, 1.3);
    Circ(g, 7.5, 4.5, 3.4); g.lineWidth = 1.3; g.strokeStyle = c; g.stroke();
    Poly(g, [4, -2, 15, -9 * flap - 2, 10, 1]); Fl(g, '#f3f4f6', 1.3);
  }
  function CoinArt(g, c, great) {
    if (great) { Glow(g, 0, 0, 20, '#fde047', 0.55); }
    Circ(g, 0, 0, 11.5); Fl(g, great ? '#f59e0b' : Dk(c, 0.15), 1.7);
    Circ(g, 0, 0, 8.8); Fl(g, great ? '#fde047' : c, 1.2);
    g.beginPath(); g.arc(0, 0, 7.2, Math.PI * 1.05, Math.PI * 1.6); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.6; g.stroke();
    if (great) for (let i = 0; i < 6; i++) { const a = i * TAU / 6; Circ(g, Math.cos(a) * 10.2, Math.sin(a) * 10.2, 0.8); g.fillStyle = '#fef3c7'; g.fill(); }
  }

  function BuildSky() {
    const s = Cv(CV_W, GROUND_Y, _k), g = s.g;
    const gr = g.createLinearGradient(0, 0, 0, GROUND_Y);
    if (_dark) { gr.addColorStop(0, '#0a0f2c'); gr.addColorStop(0.7, '#20255a'); gr.addColorStop(1, '#3b3470'); }
    else { gr.addColorStop(0, '#5fbfeb'); gr.addColorStop(0.7, '#a9e2f7'); gr.addColorStop(1, '#e8f8ff'); }
    g.fillStyle = gr; g.fillRect(0, 0, CV_W, GROUND_Y);
    const R = Rng(9);
    if (_dark) {
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + R() * 0.6})`; Circ(g, R() * CV_W, R() * GROUND_Y * 0.65, 0.4 + R()); g.fill(); }
      for (let i = 0; i < 5; i++) { const x = R() * CV_W, y = R() * 80; Glow(g, x, y, 5, '#fff7d6', 0.6); Star(g, x, y, 2.6, 0.7, 4); g.fillStyle = '#fffbe8'; g.fill(); }
      Glow(g, 395, 46, 50, '#c7d2fe', 0.3);
      Circ(g, 395, 46, 15); Fl(g, '#f8f3d4', 1.6);
      for (const [x, y, r] of [[390, 42, 3], [399, 52, 2.2], [401, 40, 1.4]]) { Circ(g, x, y, r); g.fillStyle = '#e4dcb6'; g.fill(); }
    } else {
      Glow(g, 400, 46, 70, '#fff3b0', 0.65);
      Circ(g, 400, 46, 15); g.fillStyle = '#fffbe6'; g.fill();
    }
    return s;
  }
  function BuildClouds() {
    const H = 90, s = Cv(CLOUD_TW, H, _k), g = s.g, R = Rng(31);
    const list = [];
    for (let i = 0; i < 6; i++) {
      const cx = i * CLOUD_TW / 6 + R() * 50, cy = 25 + R() * 45, sc = 0.5 + R() * 0.5, pts = [];
      for (let j = 0; j < 4; j++) pts.push([cx + (j - 1.5) * 12 * sc, cy - Math.sin(j / 3 * Math.PI) * 8 * sc, (9 + R() * 7) * sc]);
      list.push(pts);
    }
    const C = _dark ? ['rgba(8,10,34,0.5)', '#262c5e', '#2f3770', '#3a4380'] : ['rgba(43,34,54,0.14)', '#d6eef8', '#ffffff', '#ffffff'];
    for (const off of [-CLOUD_TW, 0, CLOUD_TW]) for (const pts of list) BlobRow(g, pts.map(([x, y, r]) => [x + off, y, r]), C[0], [[C[1], 0, 0, 1], [C[2], -0.08, -0.16, 0.9], [C[3], -0.22, -0.3, 0.45]]);
    return s;
  }
  function BuildHills() {
    const H = 110, s = Cv(HILL_TW, H, _k), g = s.g;
    const layers = _dark ? [['#2a3266', 0.55, 11], ['#232a58', 0.85, 23]] : [['#b9e3dc', 0.55, 11], ['#9fd4c8', 0.85, 23]];
    for (const [c, hf, seed] of layers) {
      const R = Rng(seed), n = 5, pk = [];
      for (let i = 0; i < n; i++) pk.push([i * HILL_TW / n + R() * 50, H - (30 + R() * 50) * hf - 10]);
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= HILL_TW; x += 4) {
        let y = H;
        for (const [px, py] of pk) for (const o of [-HILL_TW, 0, HILL_TW]) { const d = (x - px - o) / 70; y = Math.min(y, py + d * d * 26); }
        g.lineTo(x, y);
      }
      g.lineTo(HILL_TW, H); g.closePath();
      g.fillStyle = c; g.fill();
      g.lineWidth = 1.4; g.strokeStyle = Mix(c, OUT, 0.3); g.stroke();
    }
    return s;
  }
  function Tree(g, x, base, h, C) {
    g.fillStyle = C.trunk; g.fillRect(x - 2.5, base - h * 0.45, 5, h * 0.45);
    g.lineWidth = 1.2; g.strokeStyle = C.out; g.strokeRect(x - 2.5, base - h * 0.45, 5, h * 0.45);
    const r = h * 0.32;
    BlobRow(g, [[x, base - h * 0.62, r], [x - r * 0.7, base - h * 0.48, r * 0.75], [x + r * 0.7, base - h * 0.5, r * 0.78]], C.out, [[C.leaf[0], 0, 0, 1], [C.leaf[1], -0.12, -0.15, 0.8], [C.leaf[2], -0.3, -0.38, 0.38]]);
  }
  function BuildTrees() {
    const H = 120, s = Cv(TREE_TW, H, _k), g = s.g, R = Rng(55);
    const C = _dark
      ? { trunk: '#3b2f3f', out: '#141433', leaf: ['#1e4a46', '#26605a', '#2f756c'], wall: '#353a6c', roof: '#5b3550', win: '#fcd34d', win2: '#3f4580' }
      : { trunk: '#9b6b43', out: Mix('#5fae6a', OUT, 0.45), leaf: ['#5fae6a', '#74c47b', '#9ad89a'], wall: '#f3e6cc', roof: '#de7a5f', win: '#a6dcef', win2: '#a6dcef' };
    const items = [];
    for (let x = 20; x < TREE_TW; x += 40 + R() * 40) items.push([x, 34 + R() * 26]);
    for (const off of [-TREE_TW, 0, TREE_TW]) {
      const bx = 250 + off, bw = 120, bh = 58, by = H - bh;
      g.fillStyle = C.wall; g.fillRect(bx, by, bw, bh);
      g.lineWidth = 1.4; g.strokeStyle = Mix(C.wall, OUT, 0.45); g.strokeRect(bx + 0.7, by + 0.7, bw - 1.4, bh);
      Poly(g, [bx - 5, by, bx + 14, by - 14, bx + bw - 14, by - 14, bx + bw + 5, by]); g.fillStyle = C.roof; g.fill(); g.stroke();
      g.fillStyle = Mix(C.wall, OUT, 0.08); g.fillRect(bx + 46, by - 30, 28, 30); g.strokeRect(bx + 46.7, by - 30, 26.6, 30);
      Poly(g, [bx + 42, by - 30, bx + 60, by - 42, bx + 78, by - 30]); g.fillStyle = C.roof; g.fill(); g.stroke();
      Circ(g, bx + 60, by - 20, 6); g.fillStyle = '#fff'; g.fill(); g.stroke();
      Ln(g, bx + 60, by - 20, bx + 60, by - 24, OUT, 1); Ln(g, bx + 60, by - 20, bx + 63, by - 19, OUT, 1);
      Ln(g, bx + 60, by - 42, bx + 60, by - 56, Mix(C.wall, OUT, 0.5), 1.2);
      Poly(g, [bx + 60, by - 56, bx + 72, by - 53, bx + 60, by - 50]); g.fillStyle = '#4ade80'; g.fill();
      const r2 = Rng(91);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
        if (i === 2 || i === 3) continue;
        g.fillStyle = _dark && r2() < 0.55 ? C.win : C.win2;
        g.fillRect(bx + 8 + i * 18, by + 10 + j * 22, 11, 12);
        g.lineWidth = 1; g.strokeStyle = Mix(C.wall, OUT, 0.4); g.strokeRect(bx + 8 + i * 18, by + 10 + j * 22, 11, 12);
      }
      RR(g, bx + 52, H - 22, 16, 22, [7, 7, 0, 0]); g.fillStyle = _dark ? '#5a3b2d' : '#8b5a3c'; g.fill(); g.stroke();
      for (const [x, h] of items) if (x + off < bx - 12 || x + off > bx + bw + 12) Tree(g, x + off, H, h + 14, C);
    }
    return s;
  }
  function BuildFence() {
    const H = 26, s = Cv(FENCE_TW, H, _k), g = s.g;
    const c = _dark ? '#4a4270' : '#f4ead7', o = _dark ? '#191634' : Mix('#f4ead7', OUT, 0.55);
    const R = Rng(13);
    for (let x = 0; x < FENCE_TW; x += 80) {
      if (R() < 0.3) continue;
      for (let i = 0; i < 6; i++) { const px = x + i * 9 + 4; Poly(g, [px, H, px, 7, px + 3, 3.5, px + 6, 7, px + 6, H]); g.fillStyle = c; g.fill(); g.lineWidth = 1.2; g.strokeStyle = o; g.stroke(); }
      g.fillStyle = c; g.fillRect(x + 2, 11, 56, 3.5); g.fillRect(x + 2, 19, 56, 3.5);
      g.lineWidth = 1; g.strokeStyle = o; g.strokeRect(x + 2, 11, 56, 3.5); g.strokeRect(x + 2, 19, 56, 3.5);
    }
    return s;
  }
  function BuildGround() {
    const w = CV_W + GTILE * 2, s = Cv(w, GROUND_H + 8, _k), g = s.g;
    const dirt = _dark ? ['#4c4363', '#2f2943', '#5a5175'] : ['#e8d39c', '#cfb575', '#f3e3b7'];
    const gr = g.createLinearGradient(0, 0, 0, GROUND_H + 8);
    gr.addColorStop(0, dirt[0]); gr.addColorStop(1, dirt[1]);
    g.fillStyle = gr; g.fillRect(0, 0, w, GROUND_H + 8);
    const grass = _dark ? '#2f6b4d' : '#7cc95a';
    g.fillStyle = grass; g.fillRect(0, 0, w, 6);
    for (let x = 0; x < w; x += 8) { Poly(g, [x, 6, x + 4, 9.5, x + 8, 6]); g.fill(); }
    g.fillStyle = Lt(grass, 0.25); g.fillRect(0, 1.6, w, 1.4);
    g.fillStyle = OUT; g.fillRect(0, 0, w, 1.6);
    const R = Rng(17), pebs = [];
    for (let i = 0; i < 7; i++) pebs.push([R() * GTILE, 14 + R() * 18, 1 + R() * 2.2]);
    for (let x = 0; x < w; x += GTILE) {
      for (const [px, py, r] of pebs) { Ell(g, x + px, py, r * 1.5, r); g.fillStyle = dirt[2]; g.fill(); g.lineWidth = 0.8; g.strokeStyle = Dk(dirt[1], 0.2); g.stroke(); }
      Ln(g, x + 10, 22, x + 26, 22, Dk(dirt[0], 0.12), 1.2);
      Ln(g, x + 38, 15, x + 50, 15, Dk(dirt[0], 0.12), 1.2);
    }
    return s;
  }

  function BuildSprites() {
    const S = { dino: {}, books: {}, pencil: {}, paper: {}, coin: {}, coinG: {} };
    for (const c of COLORS) {
      S.dino[c] = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(f => Night(SprA(60, 52, 26, 46, g => DinoArt(g, c, f)), 0.1));
      S.books[c] = Night(SprA(34, 36, 17, 32, g => BooksArt(g, c)));
      S.pencil[c] = Night(SprA(26, 56, 13, 52, g => PencilArt(g, c)));
      S.paper[c] = [0, 1].map(f => Night(SprA(36, 30, 18, 15, g => PaperArt(g, c, f))));
      S.coin[c] = Night(SprA(30, 30, 15, 15, g => CoinArt(g, c, false)), 0.1);
      S.coinG[c] = Night(SprA(44, 44, 22, 22, g => CoinArt(g, c, true)), 0.1);
    }
    S.dust = SprA(14, 14, 7, 7, g => { Circ(g, 0, 0, 5.5); g.fillStyle = _dark ? '#8f86b3' : '#f3e6c4'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = 'rgba(43,34,54,0.3)'; g.stroke(); });
    S.spark = SprA(18, 18, 9, 9, g => { Glow(g, 0, 0, 9, '#fde047', 0.7); Star(g, 0, 0, 7, 2, 4); Fl(g, '#fef08a', 1); });
    S.chip = {};
    for (const c of COLORS) S.chip[c] = SprA(8, 8, 4, 4, g => { RR(g, -2.6, -2.6, 5.2, 5.2, 1); Fl(g, c, 1); });
    S.shadow = SprA(40, 10, 20, 5, g => Shadow(g, 0, 0, 16, 3.6, 0.25));
    S.sky = BuildSky();
    S.clouds = BuildClouds();
    S.hills = BuildHills();
    S.trees = Shade(BuildTrees(), _dark ? 'rgba(20,24,60,0.22)' : 'rgba(205,238,250,0.2)');
    S.fence = BuildFence();
    S.ground = BuildGround();
    S.vign = Cv(CV_W, CV_H, _k);
    const vg = S.vign.g.createRadialGradient(CV_W / 2, CV_H * 0.5, CV_H * 0.4, CV_W / 2, CV_H * 0.5, CV_W * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, _dark ? 'rgba(4,6,22,0.4)' : 'rgba(20,40,80,0.1)');
    S.vign.g.fillStyle = vg; S.vign.g.fillRect(0, 0, CV_W, CV_H);
    S.panel = _dark ? 'rgba(10,12,30,0.55)' : 'rgba(255,255,255,0.7)';
    S.txt = _dark ? '#e2e8f0' : '#2b2236';
    S.txt2 = _dark ? 'rgba(226,232,240,0.6)' : 'rgba(43,34,54,0.55)';
    S.dirt = _dark ? '#2f2943' : '#cfb575';
    _S = S;
  }

  const PN = 140;
  const _P = Array.from({ length: PN }, () => ({ on: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, T: 1, s: 1, ds: 0, r: 0, vr: 0, c: '', c2: '' }));
  let _pi = 0;
  function Part(k, x, y, vx, vy, T, s, c, g = 0, ds = 0, vr = 0) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.T = T; p.t = 0; p.s = s; p.ds = ds; p.c = c; p.c2 = ''; p.g = g; p.r = Math.random() * TAU; p.vr = vr;
    return p;
  }
  function ClearParts() { for (const p of _P) p.on = 0; }
  const _plus = {};
  function PlusStr(n) { return _plus[n] || (_plus[n] = `+${n}`); }

  function NewGameState() {
    const grade = PickGood();
    return {
      status: 'start',
      playerY: CV_H - GROUND_H - PLAYER_H,
      playerVel: 0,
      onGround: true,
      jumpsRemaining: 2,
      sliding: false,
      slideTimer: 0,
      obstacles: [],
      pickups: [],
      score: 0,
      distance: 0,
      speed: 0.32,
      speedRamp: 0.000004,
      spawnTimer: 600,
      pickupTimer: 1200,
      shakeT: 0,
      flashT: 0,
      t: 0,
      runT: 0,
      dustT: 0,
      squash: 0,
      flip: 0,
      milestone: 0,
      grade,
      gradeColor: GradeColor(grade.Pct),
      gradeStr: grade.Pct != null ? `${Math.round(grade.Pct)}%` : '?',
    };
  }

  function Jump() {
    if (!GS) return;
    if (GS.status === 'start') DoStart();
    if (GS.status !== 'playing') return;

    if (GS.onGround || GS.jumpsRemaining > 0) {
      const dbl = !GS.onGround;
      GS.playerVel = GS.onGround ? JUMP_VEL : DOUBLE_VEL;
      GS.onGround = false;
      GS.sliding = false;
      GS.jumpsRemaining--;
      GS.squash = -1;
      if (dbl) GS.flip = 1;
      const fx = PLAYER_X + PLAYER_W / 2, fy = GS.playerY + PLAYER_H;
      for (let i = 0; i < (dbl ? 6 : 5); i++) {
        const a = Math.PI * (0.15 + Math.random() * 0.7);
        Part(dbl ? 1 : 0, fx + (Math.random() - 0.5) * 12, fy - (dbl ? 4 : 1), Math.cos(a) * 0.06 * (Math.random() < 0.5 ? -1 : 1), dbl ? Math.sin(a) * 0.05 : -0.02 - Math.random() * 0.03, 380 + Math.random() * 200, dbl ? 0.55 : 0.5 + Math.random() * 0.3, '', 0, dbl ? -0.001 : 0.0012);
      }
    }
  }

  function Slide() {
    if (!GS || GS.status !== 'playing') return;
    if (GS.onGround && !GS.sliding) {
      GS.sliding = true;
      GS.slideTimer = 600;
      for (let i = 0; i < 4; i++) Part(0, PLAYER_X + 4 + Math.random() * 8, GROUND_Y - 2, -0.06 - Math.random() * 0.06, -0.02, 360, 0.5, '', 0, 0.0012);
    }
  }

  function SpawnObstacle() {
    const types = ['low', 'low', 'high', 'tall'];
    const type = types[0 | Math.random() * types.length];
    const grade = PickBad();
    const o = {
      type, grade, color: GradeColor(grade.Pct),
      x: CV_W + 10, w: 24, lbl: `${Math.round(grade.Pct ?? 30)}`,
    };
    if (type === 'low')  { o.h = 26; o.y = CV_H - GROUND_H - o.h; }
    if (type === 'high') { o.h = 18; o.y = CV_H - GROUND_H - o.h - 22; }
    if (type === 'tall') { o.h = 44; o.y = CV_H - GROUND_H - o.h; o.w = 18; }
    GS.obstacles.push(o);
  }

  function SpawnPickup() {
    const grade = PickGood();
    const goodTier = (grade.Pct ?? 60) >= 75;
    GS.pickups.push({
      grade, color: GradeColor(grade.Pct), tier: goodTier ? 'great' : 'ok',
      x: CV_W + 10, y: CV_H - GROUND_H - 50 - Math.random() * 60,
      r: 11, picked: false, born: GS.t, lbl: `${Math.round(grade.Pct ?? 60)}`,
    });
  }

  function Update(dt) {
    GS.distance += GS.speed * dt;
    GS.speed = Math.min(0.95, GS.speed + GS.speedRamp * dt);
    GS.runT += dt * (0.6 + GS.speed * 1.5);

    if (!GS.onGround) {
      GS.playerVel += GRAVITY * dt;
      GS.playerY += GS.playerVel * dt;
      const floor = CV_H - GROUND_H - PLAYER_H;
      if (GS.playerY >= floor) {
        GS.playerY = floor;
        GS.playerVel = 0;
        GS.onGround = true;
        GS.jumpsRemaining = 2;
        GS.squash = 1;
        GS.flip = 0;
        for (let i = 0; i < 5; i++) Part(0, PLAYER_X + PLAYER_W / 2 + (Math.random() - 0.5) * 18, GROUND_Y - 1, (Math.random() - 0.5) * 0.1, -0.015 - Math.random() * 0.02, 380, 0.45 + Math.random() * 0.3, '', 0, 0.0012);
      }
    }
    if (GS.sliding) {
      GS.slideTimer -= dt;
      if (GS.slideTimer <= 0) GS.sliding = false;
    }
    if (GS.squash > 0) GS.squash = Math.max(0, GS.squash - dt * 0.007);
    else if (GS.squash < 0) GS.squash = Math.min(0, GS.squash + dt * 0.006);
    if (GS.flip > 0) GS.flip = Math.max(0, GS.flip - dt * 0.0026);

    if (GS.onGround) {
      GS.dustT -= dt;
      if (GS.dustT <= 0) {
        GS.dustT = GS.sliding ? 45 : 110 - GS.speed * 50;
        Part(0, PLAYER_X + (GS.sliding ? 6 : 4), GROUND_Y - 1.5, -GS.speed * 0.5 - 0.02, -0.01 - Math.random() * 0.02, 320, GS.sliding ? 0.5 : 0.32, '', 0, 0.0012);
      }
    }

    GS.spawnTimer -= dt;
    if (GS.spawnTimer <= 0) {
      SpawnObstacle();
      const minGap = Math.max(550, 1100 - GS.speed * 800);
      GS.spawnTimer = minGap + Math.random() * 400;
    }
    GS.pickupTimer -= dt;
    if (GS.pickupTimer <= 0) {
      SpawnPickup();
      GS.pickupTimer = 800 + Math.random() * 1600;
    }

    for (const o of GS.obstacles) o.x -= GS.speed * dt;
    if (GS.obstacles.length && GS.obstacles[0].x + GS.obstacles[0].w <= -10) GS.obstacles = GS.obstacles.filter(o => o.x + o.w > -10);

    for (const p of GS.pickups) p.x -= GS.speed * dt;
    if (GS.pickups.some(p => p.picked || p.x + p.r <= -10)) GS.pickups = GS.pickups.filter(p => p.x + p.r > -10 && !p.picked);

    const ph = GS.sliding ? PLAYER_H * 0.55 : PLAYER_H;
    const py = GS.sliding ? GS.playerY + (PLAYER_H - ph) : GS.playerY;
    const px = PLAYER_X;
    const pw = PLAYER_W;

    for (const p of GS.pickups) {
      if (p.picked) continue;
      const cx = Math.max(px, Math.min(p.x, px + pw));
      const cy = Math.max(py, Math.min(p.y, py + ph));
      const dx = cx - p.x, dy = cy - p.y;
      if (dx * dx + dy * dy <= p.r * p.r) {
        p.picked = true;
        const pts = p.tier === 'great' ? 25 : 12;
        GS.score += pts;
        GS.flashT = 250;
        GS.grade = p.grade;
        GS.gradeColor = p.color;
        GS.gradeStr = `${p.lbl}%`;
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * TAU, v = 0.04 + Math.random() * 0.1;
          Part(1, p.x, p.y, Math.cos(a) * v, Math.sin(a) * v, 420 + Math.random() * 200, 0.5 + Math.random() * 0.5, '', 0, -0.0008);
        }
        Part(2, p.x, p.y - 12, 0, -0.05, 700, 1, PlusStr(pts)).c2 = p.tier === 'great' ? '#fde047' : p.color;
      }
    }

    for (const o of GS.obstacles) {
      if (o.x + o.w < px || o.x > px + pw) continue;
      if (o.y + o.h < py || o.y > py + ph) continue;
      Die();
      return;
    }

    GS.score = Math.max(GS.score, Math.floor(GS.distance / 10));
    const ms = Math.floor(GS.score / 100);
    if (ms > GS.milestone) { GS.milestone = ms; GS.msT = 900; }

    if (GS.flashT > 0) GS.flashT = Math.max(0, GS.flashT - dt);
  }

  function Die() {
    GS.status = 'gameover';
    GS.shakeT = 350;
    GS.flashT = 0;
    GS.hitT = 220;
    SaveBest(GS.score);
    const cx = PLAYER_X + PLAYER_W / 2, cy = GS.playerY + PLAYER_H / 2;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * TAU, v = 0.05 + Math.random() * 0.15;
      Part(3, cx, cy, Math.cos(a) * v, Math.sin(a) * v - 0.08, 700 + Math.random() * 300, 1, i % 2 ? GS.gradeColor : '#f87171', 0.0006, 0, (Math.random() - 0.5) * 0.03);
    }
    for (let i = 0; i < 6; i++) Part(0, cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, 420, 0.6, '', 0, 0.0018);
    ShowGameOver();
  }

  function Step(dt) {
    GS.t += dt;
    if (GS.status === 'playing') Update(dt);
    for (let i = 0; i < PN; i++) {
      const p = _P[i];
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.T) { p.on = 0; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.r += p.vr * dt; p.s += p.ds * dt;
      if (p.k === 3 && p.y > GROUND_Y - 2) { p.y = GROUND_Y - 2; p.vy *= -0.35; p.vx *= 0.7; }
    }
    if (GS.shakeT > 0) GS.shakeT = Math.max(0, GS.shakeT - dt);
    if (GS.hitT > 0) GS.hitT = Math.max(0, GS.hitT - dt);
    if (GS.msT > 0) GS.msT = Math.max(0, GS.msT - dt);
  }

  function Tile(s, off, y) {
    const w = s.w;
    let x = -(off % w);
    if (x > -8) x -= w;
    x = Math.round(x * _k) / _k;
    while (x < CV_W + 8) { _ctx.drawImage(s.c, x, y, w, s.h); x += w; }
  }
  function Outlined(txt, x, y, font, col, lw) {
    const c = _ctx;
    c.font = font; c.lineWidth = lw; c.strokeStyle = OUT; c.lineJoin = 'round';
    c.strokeText(txt, x, y);
    c.fillStyle = col; c.fillText(txt, x, y);
  }

  function DinoFrame() {
    if (GS.status === 'gameover') return 7;
    if (GS.status === 'start') return (GS.t % 3200) > 3050 ? 8 : 1;
    if (GS.sliding) return 5 + ((GS.runT / 70 | 0) % 2);
    if (!GS.onGround) return 4;
    return (GS.runT / 55 | 0) % 4;
  }

  function Draw() {
    if (!_ctx || !GS || !_S) return;
    const c = _ctx, S = _S;
    const sh = GS.shakeT > 0 ? 5 * (GS.shakeT / 350) : 0;
    _ox = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    _oy = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    Base();

    c.fillStyle = S.dirt; c.fillRect(-8, GROUND_Y, CV_W + 16, GROUND_H + 8);
    c.drawImage(S.sky.c, -6, -6, CV_W + 12, GROUND_Y + 6);
    const d = GS.distance;
    Tile(S.clouds, d * 0.05 + GS.t * 0.004, 4);
    Tile(S.hills, d * 0.12, GROUND_Y - S.hills.h + 4);
    Tile(S.trees, d * 0.3, GROUND_Y - S.trees.h + 2);
    Tile(S.fence, d * 0.6, GROUND_Y - S.fence.h + 2);
    Tile(S.ground, d % GTILE, GROUND_Y);

    for (const p of GS.pickups) {
      if (p.picked) continue;
      const bob = Math.sin((GS.t - p.born) / 200) * 2.2;
      const spin = 0.55 + 0.45 * Math.abs(Math.cos((GS.t - p.born) / 260));
      const sp = p.tier === 'great' ? S.coinG[p.color] : S.coin[p.color];
      BlitT(sp, p.x, p.y + bob, 0, spin, 1);
      c.font = F_COIN; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(43,34,54,0.85)';
      c.setTransform(spin * _k, 0, 0, _k, (p.x + _ox) * _k, (p.y + bob + 0.5 + _oy) * _k); c.fillText(p.lbl, 0, 0); Base();
    }

    for (const o of GS.obstacles) {
      if (o.x > CV_W + 30 || o.x + o.w < -30) continue;
      const cx = o.x + o.w / 2;
      if (o.type === 'high') {
        const f = (GS.t / 120 | 0) % 2;
        Blit(S.shadow, cx, GROUND_Y + 1);
        Blit(S.paper[o.color][f], cx, o.y + o.h / 2 + Math.sin(GS.t / 160 + o.x * 0.05) * 1.2);
      } else {
        Blit(o.type === 'tall' ? S.pencil[o.color] : S.books[o.color], cx, GROUND_Y);
      }
      const ty = o.type === 'high' ? o.y - 7 : o.y - (o.type === 'tall' ? 9 : 6);
      c.font = F_TAG; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#ef4444';
      c.beginPath(); c.roundRect(cx - 9, ty - 5.5, 18, 11, 5.5); c.fill();
      c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
      c.fillStyle = '#fff'; c.fillText(o.lbl, cx, ty + 0.5);
    }

    const fr = DinoFrame();
    const spr = (S.dino[GS.gradeColor] || S.dino[COLORS[0]])[fr];
    const footY = GS.playerY + PLAYER_H;
    const air = Math.max(0, GROUND_Y - footY);
    c.globalAlpha = Math.max(0.25, 1 - air / 90);
    BlitT(S.shadow, PLAYER_X + PLAYER_W / 2, GROUND_Y + 1, 0, Math.max(0.45, 1 - air / 110), 1);
    c.globalAlpha = 1;
    let sx = 1, sy = 1, rot = 0;
    if (GS.squash > 0) { sx = 1 + GS.squash * 0.16; sy = 1 - GS.squash * 0.14; }
    else if (GS.squash < 0) { sx = 1 + GS.squash * 0.1; sy = 1 - GS.squash * 0.12; }
    if (GS.flip > 0) rot = -(1 - GS.flip) * TAU;
    if (GS.status === 'start') { const b = Math.sin(GS.t * 0.004); sy = 1 + b * 0.025; sx = 1 - b * 0.015; }
    if (rot) BlitT(spr, PLAYER_X + PLAYER_W / 2, footY - 15, rot, 1, 1);
    else {
      c.setTransform(sx * _k, 0, 0, sy * _k, (PLAYER_X + PLAYER_W / 2 + _ox) * _k, (footY + _oy) * _k);
      c.drawImage(spr.c, -spr.ax, -spr.ay, spr.w, spr.h); Base();
    }
    if (GS.hitT > 0) { c.globalAlpha = GS.hitT / 220 * 0.6; c.globalCompositeOperation = 'lighter'; Blit(spr, PLAYER_X + PLAYER_W / 2, footY); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }

    for (let i = 0; i < PN; i++) {
      const p = _P[i];
      if (!p.on) continue;
      const a = 1 - p.t / p.T;
      if (p.k === 0) { c.globalAlpha = a * 0.85; BlitT(S.dust, p.x, p.y, 0, Math.max(0.05, p.s), Math.max(0.05, p.s)); }
      else if (p.k === 1) { c.globalAlpha = a; BlitT(S.spark, p.x, p.y, p.r, Math.max(0.05, p.s), Math.max(0.05, p.s)); }
      else if (p.k === 3) { c.globalAlpha = Math.min(1, a * 2); BlitT(S.chip[p.c] || S.chip[COLORS[3]], p.x, p.y, p.r, 1, 1); }
      else {
        c.globalAlpha = Math.min(1, a * 2.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const z = (1 + (1 - Math.min(1, p.t / 120)) * 0.35) * _k;
        c.setTransform(z, 0, 0, z, (p.x + _ox) * _k, (p.y + _oy) * _k);
        Outlined(p.c, 0, 0, F_POP, p.c2 || '#fff', 4);
        Base();
      }
    }
    c.globalAlpha = 1;

    c.drawImage(S.vign.c, -6, -6, CV_W + 12, CV_H + 12);

    if (GS.flashT > 0) {
      c.globalAlpha = (GS.flashT / 250) * 0.16;
      c.fillStyle = GS.gradeColor;
      c.fillRect(-8, -8, CV_W + 16, CV_H + 16);
      c.globalAlpha = 1;
    }

    if (GS.status !== 'start') DrawHud();
    UpdateHud();
  }

  function DrawHud() {
    const c = _ctx, S = _S;
    if (_hud.sc !== GS.score) { _hud.sc = GS.score; _hud.scStr = String(GS.score).padStart(5, '0'); }
    if (_hud.best !== _best) { _hud.best = _best; _hud.hiStr = `HI ${String(_best).padStart(5, '0')}`; }
    c.fillStyle = S.panel;
    c.beginPath(); c.roundRect(CV_W - 176, 8, 168, 26, 9); c.fill();
    c.textBaseline = 'middle'; c.textAlign = 'right';
    c.font = F_HUD_S; c.fillStyle = S.txt2;
    c.fillText(_hud.hiStr, CV_W - 82, 21.5);
    const blink = GS.msT > 0 && ((GS.msT / 150 | 0) % 2 === 0);
    if (!blink) { c.font = F_HUD; c.fillStyle = S.txt; c.fillText(_hud.scStr, CV_W - 16, 21.5); }
    c.fillStyle = S.panel;
    c.beginPath(); c.roundRect(8, 8, 62, 26, 9); c.fill();
    c.beginPath(); c.arc(22, 21, 6, 0, TAU); c.fillStyle = GS.gradeColor; c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    c.textAlign = 'left'; c.font = F_HUD_S; c.fillStyle = S.txt;
    c.fillText(GS.gradeStr, 32, 21.5);
  }

  function UpdateHud() {
    if (_hud.hdrBest !== _best) { _hud.hdrBest = _best; SetText('gf-rn-best', _best); }
  }

  function Frame(ts) {
    _raf = null;
    if (!GS) return;
    const dt = Math.min(ts - (_last || ts), 50);
    _last = ts;
    Step(dt);
    Draw();
    if (GS.status === 'playing' || GS.status === 'start' || AnyFx()) _raf = requestAnimationFrame(Frame);
  }
  function AnyFx() { if (GS.shakeT > 0 || GS.hitT > 0) return true; for (let i = 0; i < PN; i++) if (_P[i].on) return true; return false; }
  function StartLoop() { StopLoop(); _last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-rn-start', 'gf-rn-pause', 'gf-rn-gameover'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    StopLoop();
    ClearParts();
    GS = NewGameState();
    _best = LoadBest();
    ShowScreen('gf-rn-start');
    Draw();
    StartLoop();
  }

  function ShowGameOver() {
    const prev = _best;
    _best = Math.max(LoadBest(), GS.score);
    SetText('gf-rn-go-score', GS.score);
    SetText('gf-rn-go-best', _best);
    const isNew = GS.score > prev && GS.score > 0;
    const newEl = document.getElementById('gf-rn-go-new');
    if (newEl) newEl.style.display = isNew ? 'block' : 'none';
    ShowScreen('gf-rn-gameover');
  }

  function DoStart() {
    StopLoop();
    ClearParts();
    GS = NewGameState();
    _best = LoadBest();
    GS.status = 'playing';
    ShowScreen(null);
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); ShowScreen('gf-rn-pause'); Draw(); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-rn') || _root.style.display === 'none') return;
    if (e.type !== 'keydown') return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeRunner();
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      if (GS.status === 'playing' || GS.status === 'paused') { e.preventDefault(); DoPause(); }
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (GS.status !== 'start') { e.preventDefault(); DoStart(); }
      return;
    }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'gameover') { if (GS.shakeT <= 0) DoStart(); }
      else if (GS.status === 'paused') DoPause();
      else Jump();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault(); e.stopPropagation();
      Slide();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (GS.status === 'gameover' || GS.status === 'start') DoStart();
      else if (GS.status === 'paused') DoPause();
    }
  }

  function OnTap(e) {
    if (!GS) return;
    e.preventDefault();
    if (GS.status === 'gameover') { DoStart(); return; }
    Jump();
  }

  function AttachKeys()  { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); document.addEventListener('keyup', _kh, true); }
  function DetachKeys()  { if (_kh) { document.removeEventListener('keydown', _kh, true); document.removeEventListener('keyup', _kh, true); _kh = null; } }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-rn');
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
    if (d !== _dark || !_S) { _dark = d; if (_S) BuildSprites(); Draw(); }
  }

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.5, Math.min(1.5, (innerWidth - 34) / CV_W, (innerHeight - 34 - HDR_H) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(CV_W * s), h = Math.round(CV_H * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (_cv.width !== bw || _cv.height !== bh || !_S) {
      _cv.width = bw; _cv.height = bh;
      _k = bw / CV_W;
      BuildSprites();
    }
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-rn')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-rn';
    root.innerHTML = `
<div id="gf-rn-modal">
  <div id="gf-rn-hdr">
    <div class="gf-rn-hl">
      <div id="gf-rn-logo">GR</div>
      <span id="gf-rn-title">${_GameText('rn_title')}</span>
    </div>
    <div class="gf-rn-hr">
      <span id="gf-rn-best-hdr"><span class="gf-rn-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-rn-best">0</span></span>
      <button id="gf-rn-pause-btn" title="${_GameText('game_pause_p')}">&#9208;</button>
      <button id="gf-rn-close" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-rn-body">
    <div id="gf-rn-view"><canvas id="gf-rn-canvas" width="${CV_W}" height="${CV_H}"></canvas></div>

    <div id="gf-rn-start" class="gf-rn-scr">
      <div class="gf-rn-card gf-rn-start-card">
        <div class="gf-rn-scr-logo">${_GameText('rn_title')}</div>
        <div class="gf-rn-scr-sub">${_GameText('rn_subtitle')}</div>
        <div class="gf-rn-scr-rules">
          <span><i class="gf-rn-ico-coin"></i>${_GameText('rn_rule_pickup')}</span>
          <span><i class="gf-rn-ico-bad"></i>${_GameText('rn_rule_avoid')}</span>
        </div>
        <div class="gf-rn-keys"><kbd>&#9251;</kbd><kbd>&#8593;</kbd>${_GameText('rn_jump2')}<kbd>&#8595;</kbd>${_GameText('rn_slide')}</div>
        <div class="gf-rn-scr-footer"><span class="gf-rn-tap"></span>${_GameText('rn_start_hint')}</div>
      </div>
    </div>

    <div id="gf-rn-pause" class="gf-rn-scr gf-rn-dim" style="display:none">
      <div class="gf-rn-card">
        <div class="gf-rn-scr-h">${_GameText('game_paused')}</div>
        <button class="gf-rn-btn" id="gf-rn-resume">&#9654;&nbsp; ${_GameText('game_resume')}</button>
        <div class="gf-rn-scr-footer">${_GameText('rn_pause_hint')}</div>
      </div>
    </div>

    <div id="gf-rn-gameover" class="gf-rn-scr gf-rn-dim gf-rn-scr-gameover" style="display:none">
      <div class="gf-rn-scr-go">${_GameText('game_gameover')}</div>
      <div class="gf-rn-go-stats">
        <div class="gf-rn-go-stat">
          <div class="gf-rn-go-lbl">${_GameText('game_score').toUpperCase()}</div>
          <div class="gf-rn-go-val" id="gf-rn-go-score">0</div>
        </div>
        <div class="gf-rn-go-stat">
          <div class="gf-rn-go-lbl">${_GameText('game_best').toUpperCase()}</div>
          <div class="gf-rn-go-val" id="gf-rn-go-best">0</div>
        </div>
      </div>
      <div id="gf-rn-go-new" class="gf-rn-scr-new" style="display:none">${_GameText('rn_new_best')}</div>
      <button class="gf-rn-btn" id="gf-rn-retry">&#8634;&nbsp; ${_GameText('game_try_again')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _view = document.getElementById('gf-rn-view');
    _cv = document.getElementById('gf-rn-canvas');
    _ctx = _cv.getContext('2d');
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-rn-close')?.addEventListener('click', CloseGradeRunner);
    document.getElementById('gf-rn-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-rn-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-rn-retry')?.addEventListener('click', DoStart);
    _cv.addEventListener('mousedown', OnTap);
    _cv.addEventListener('touchstart', OnTap, { passive: false });
    const startScr = document.getElementById('gf-rn-start');
    if (startScr) {
      startScr.addEventListener('mousedown', e => { e.stopPropagation(); if (GS?.status === 'start') DoStart(); });
      startScr.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); if (GS?.status === 'start') DoStart(); }, { passive: false });
    }
  }

  function OpenGradeRunner(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-rn')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    Fit();
    ShowStart();
  }

  function CloseGradeRunner() {
    const el = document.getElementById('gf-rn');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function ToggleGradeRunner(grades) {
    const el = document.getElementById('gf-rn');
    if (el && el.style.display !== 'none') CloseGradeRunner(); else OpenGradeRunner(grades);
  }

  function BossKeyRunner() {
    const el = document.getElementById('gf-rn');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS?.status === 'start') StartLoop();
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') { GS.status = 'paused'; ShowScreen('gf-rn-pause'); }
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeRunner   = OpenGradeRunner;
  W.CloseGradeRunner  = CloseGradeRunner;
  W.ToggleGradeRunner = ToggleGradeRunner;
  W.BossKeyRunner     = BossKeyRunner;

  function InjectCSS() {
    if (document.getElementById('gf-rn-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-rn-css';
    const ol = OUT;
    s.textContent = `
#gf-rn {
  --rn-modal:#fff;--rn-hdr:#f5f7f8;--rn-scr:rgba(250,251,252,0.94);
  --rn-brd:rgba(74,222,128,0.26);--rn-brd2:#e2e6ea;--rn-btn-brd:#d0d5da;
  --rn-txt:#111;--rn-txt2:#4b5563;--rn-txt3:#8b939c;
  --rn-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-rn[data-theme="dark"] {
  --rn-modal:rgba(13,14,18,0.97);--rn-hdr:rgba(8,9,12,0.95);
  --rn-scr:rgba(10,12,26,0.92);--rn-brd:rgba(74,222,128,0.2);--rn-brd2:#1e2128;
  --rn-btn-brd:#343842;--rn-txt:#f5f5f5;--rn-txt2:#cbd5e1;--rn-txt3:#8a94a6;
  --rn-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-rn{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-rn *{box-sizing:border-box;}
#gf-rn-modal{position:relative;display:flex;flex-direction:column;background:var(--rn-modal);border:1px solid var(--rn-brd);border-radius:12px;box-shadow:var(--rn-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-rn-hdr{display:flex;align-items:center;justify-content:space-between;height:${HDR_H}px;padding:0 12px;background:var(--rn-hdr);border-bottom:1px solid var(--rn-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-rn-hl{display:flex;align-items:center;gap:8px;} .gf-rn-hr{display:flex;align-items:center;gap:8px;}
#gf-rn-logo{width:24px;height:24px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-rn-title{font-size:13px;font-weight:700;color:var(--rn-txt);letter-spacing:-0.3px;}
#gf-rn-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--rn-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--rn-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-rn-best-lbl{font-size:8px;font-weight:700;color:var(--rn-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-rn-pause-btn,#gf-rn-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--rn-btn-brd);border-radius:6px;background:transparent;color:var(--rn-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-rn-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-rn-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-rn-body{position:relative;line-height:0;flex-shrink:0;}
#gf-rn-view{line-height:0;}
#gf-rn-canvas{display:block;touch-action:manipulation;user-select:none;-webkit-user-select:none;cursor:pointer;}
.gf-rn-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;overflow-y:auto;line-height:1.35;text-align:center;}
.gf-rn-dim{background:rgba(10,14,30,0.3);backdrop-filter:blur(1.5px);}
#gf-rn-start{cursor:pointer;align-items:flex-end;padding:18px 22px;}
.gf-rn-card{display:flex;flex-direction:column;align-items:center;gap:11px;padding:16px 22px;border-radius:16px;background:var(--rn-scr);border:1px solid var(--rn-brd);box-shadow:0 14px 40px rgba(0,0,0,.22);max-width:400px;}
.gf-rn-start-card{width:min(360px,62%);gap:9px;padding:14px 18px;}
.gf-rn-scr-logo{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:32px;font-weight:900;color:#4ade80;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};}
.gf-rn-scr-sub{font-size:12px;font-weight:700;color:var(--rn-txt2);line-height:1.4;}
.gf-rn-scr-h{font-size:21px;font-weight:800;color:var(--rn-txt);letter-spacing:4px;}
.gf-rn-scr-rules{display:flex;flex-direction:column;gap:5px;font-size:10.5px;font-weight:700;color:var(--rn-txt2);width:100%;}
.gf-rn-scr-rules span{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:8px;background:rgba(128,128,128,0.08);text-align:left;}
.gf-rn-scr-rules i{width:13px;height:13px;flex-shrink:0;border:2px solid ${ol};}
.gf-rn-ico-coin{border-radius:50%;background:#fde047;}
.gf-rn-ico-bad{border-radius:3px;background:#f87171;}
.gf-rn-keys{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px;font-size:10px;font-weight:700;color:var(--rn-txt2);}
.gf-rn-keys kbd{font-family:inherit;font-size:10px;font-weight:800;min-width:20px;padding:1px 5px;border-radius:5px;border:1px solid var(--rn-btn-brd);border-bottom-width:2px;color:var(--rn-txt);background:rgba(128,128,128,0.08);}
.gf-rn-keys kbd + kbd{margin-left:-2px;}
.gf-rn-scr-footer{display:flex;align-items:center;justify-content:center;gap:7px;font-size:10px;color:var(--rn-txt3);line-height:1.4;}
.gf-rn-tap{width:13px;height:13px;border-radius:50%;border:2px solid #4ade80;animation:gf-rn-tap 1s ease-out infinite;flex-shrink:0;}
@keyframes gf-rn-tap{0%{transform:scale(0.6);opacity:1}100%{transform:scale(1.4);opacity:0}}
.gf-rn-scr-gameover{gap:12px;}
.gf-rn-scr-go{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:34px;font-weight:900;color:#f87171;letter-spacing:1px;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};animation:gf-rn-drop .45s cubic-bezier(.2,1.5,.4,1);}
@keyframes gf-rn-drop{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:none}}
.gf-rn-scr-new{font-size:10.5px;font-weight:800;color:#fff;background:#ef4444;border:2px solid ${ol};border-radius:999px;padding:3px 10px;letter-spacing:1.5px;animation:gf-rn-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-rn-pulse{from{transform:scale(0.95)}to{transform:scale(1.06)}}
.gf-rn-go-stats{display:grid;grid-template-columns:repeat(2,minmax(104px,1fr));gap:10px;justify-content:center;width:min(260px,100%);animation:gf-rn-rise .4s .06s cubic-bezier(.2,1.3,.4,1) both;}
@keyframes gf-rn-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.gf-rn-go-stat{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 12px;border:1px solid var(--rn-brd);border-radius:12px;background:var(--rn-scr);box-shadow:0 10px 28px rgba(0,0,0,0.18);}
.gf-rn-go-lbl{font-size:8.5px;font-weight:800;letter-spacing:1.4px;color:var(--rn-txt3);line-height:1;text-transform:uppercase;}
.gf-rn-go-val{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:28px;font-weight:900;color:var(--rn-txt);line-height:1;font-variant-numeric:tabular-nums;}
.gf-rn-btn{padding:9px 22px;border:2px solid ${ol};border-radius:10px;background:#4ade80;color:#052e16;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.2px;line-height:1.2;min-width:146px;box-shadow:0 4px 0 ${ol};transition:transform .12s,box-shadow .12s,background .12s;}
.gf-rn-btn:hover{background:#6ee7a0;transform:translateY(-1px);box-shadow:0 5px 0 ${ol};}
.gf-rn-btn:active{transform:translateY(3px);box-shadow:0 1px 0 ${ol};}
`;
    document.head.appendChild(s);
  }

})(window);
