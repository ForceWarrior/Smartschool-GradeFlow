;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 320;
  const CV_H = 320;
  const TAU = Math.PI * 2;
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const F_BRICK = `800 8px ${FONT}`;
  const F_POP = `900 12px ${FONT}`;
  const F_HINT = `800 9px ${FONT}`;
  const HDR_H = 47;
  const SIDE_W = 156;
  const COLORS = ['#4ade80', '#a3e635', '#f97316', '#f87171', '#a78bfa'];
  const BG_TH = 320;

  const LEVELS = [
    { id: 1, rows: 3, cols: 8, ballSpeed: 2.2, target: 800   },
    { id: 2, rows: 4, cols: 8, ballSpeed: 2.6, target: 2000  },
    { id: 3, rows: 5, cols: 8, ballSpeed: 3.0, target: 4000  },
    { id: 4, rows: 5, cols: 9, ballSpeed: 3.4, target: 7000  },
    { id: 5, rows: 6, cols: 9, ballSpeed: 3.8, target: 11000 },
    { id: 6, rows: 5, cols: 8, ballSpeed: 3.0, target: Infinity, freePlay: true },
  ];

  const LS_UNLOCK = 'gf-breakout-unlock';
  const LS_SCORES = 'gf-breakout-scores';

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function LoadUnlock()    { return StorageGet(LS_UNLOCK, 0); }
  function SaveUnlock(n)   { if (n > LoadUnlock()) StorageSet(LS_UNLOCK, n); }
  function LoadScores()    { return StorageGet(LS_SCORES, {}); }
  function SaveScore(l, s) { const sc = LoadScores(); if (s > (sc[l] || 0)) { sc[l] = s; StorageSet(LS_SCORES, sc); } }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }

  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis',
               'Engels','Informatica','Muziek','Sport','Latijn','Economie','Chemie'];
    return Array.from({ length: 28 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }

  function GradeEffect(Pct) {
    if (Pct == null) return 0.5;
    if (Pct >= 75)  return  1.0;
    if (Pct >= 50)  return  0.5;
    if (Pct >= 25)  return -0.5;
    return -1.0;
  }

  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }

  function IsPositive(g) { return g.Pct == null || g.Pct >= 50; }

  const PU_TYPES = [
    { type: 'wide',  symbol: 'W', color: '#22d3ee', desc: 'Wide Paddle'   },
    { type: 'multi', symbol: 'M', color: '#c084fc', desc: 'Multi Ball'    },
    { type: 'slow',  symbol: 'S', color: '#fbbf24', desc: 'Slow Ball'     },
  ];
  const PU_DROP_CHANCE = 0.18;
  const PU_SPEED = 1.2;
  const PU_DURATION = 8000;
  const TRAIL_N = 10;

  let GS = null, _grades = [], _lvlId = 1, _raf = null, _last = 0;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _dark = false, _S = null, _icons = null;
  let _bricks = new Map(), _ox = 0, _oy = 0;
  const _hud = { score: -1, lvl: '', lives: -1 };

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
  function Spr(w, h, fn, k = _k) {
    const s = Cv(w, h, k);
    s.g.translate(w / 2, h / 2);
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
  function Night(s, a = 0.16) { return _dark ? Shade(s, `rgba(16,24,64,${a})`) : s; }
  function Blit(s, x, y) { _ctx.drawImage(s.c, Math.round((x - s.ax) * _k) / _k, Math.round((y - s.ay) * _k) / _k, s.w, s.h); }
  function BlitT(s, x, y, a, sx, sy) {
    const c = _ctx, co = a ? Math.cos(a) * _k : _k, si = a ? Math.sin(a) * _k : 0;
    c.setTransform(co * sx, si * sx, -si * sy, co * sy, (x + _ox) * _k, (y + _oy) * _k);
    c.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
    Base();
  }
  function Base() { _ctx.setTransform(_k, 0, 0, _k, _ox * _k, _oy * _k); }

  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function Fl(g, c, lw = 1.4) { g.fillStyle = c; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); } }
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

  function PuIcon(g, type, s = 1) {
    g.save(); g.scale(s, s);
    if (type === 'wide') {
      Poly(g, [-7, 0, -3, -3.6, -3, -1.4, 3, -1.4, 3, -3.6, 7, 0, 3, 3.6, 3, 1.4, -3, 1.4, -3, 3.6]); Fl(g, '#ffffff', 1.1);
    } else if (type === 'multi') {
      for (const [x, y] of [[-4, 1.6], [4, 1.6], [0, -2.4]]) { Circ(g, x, y, 2.6); Fl(g, '#ffffff', 1.1); }
    } else {
      Circ(g, 0, 0, 4.4); Fl(g, '#ffffff', 1.1);
      Ln(g, 0, 0, 0, -2.8, OUT, 1.2); Ln(g, 0, 0, 2.2, 0.8, OUT, 1.2);
    }
    g.restore();
  }
  function CapsuleArt(g, c, type) {
    RR(g, -12, -5.5, 24, 11, 5.5); Fl(g, c, 1.6);
    g.save(); RR(g, -12, -5.5, 24, 11, 5.5); g.clip();
    g.fillStyle = Dk(c, 0.22); g.fillRect(-12, 1.5, 24, 5);
    g.fillStyle = Lt(c, 0.45); g.fillRect(-12, -5.5, 24, 3);
    g.fillStyle = Dk(c, 0.15); g.fillRect(-12, -5.5, 5, 11); g.fillRect(7, -5.5, 5, 11);
    g.restore();
    RR(g, -12, -5.5, 24, 11, 5.5); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
    Ln(g, -7, -5, -7, 5, OUT, 1); Ln(g, 7, -5, 7, 5, OUT, 1);
    PuIcon(g, type, 0.72);
  }

  function BrickSprite(b) {
    const key = b.color + b.lbl + b.w;
    let s = _bricks.get(key);
    if (s) return s;
    const c = b.color, w = b.w, h = b.h, bad = !IsPositive(b.grade);
    s = Night(Spr(w + 3, h + 3, g => {
      g.translate(-w / 2, -h / 2);
      g.fillStyle = 'rgba(20,16,34,0.28)'; RR(g, 1.5, 2, w, h, 3); g.fill();
      RR(g, 0, 0, w, h, 3); g.fillStyle = c; g.fill();
      g.save(); RR(g, 0, 0, w, h, 3); g.clip();
      g.fillStyle = Lt(c, 0.42); g.fillRect(0, 0, w, h * 0.38);
      g.fillStyle = Dk(c, 0.2); g.fillRect(0, h * 0.72, w, h);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(3, 1.6, Math.min(8, w * 0.22), 1.6);
      if (bad) { g.strokeStyle = Dk(c, 0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.7, 0); g.lineTo(w * 0.62, h * 0.45); g.lineTo(w * 0.74, h * 0.6); g.lineTo(w * 0.68, h); g.stroke(); }
      g.restore();
      RR(g, 0, 0, w, h, 3); g.lineWidth = 1.3; g.strokeStyle = OUT; g.stroke();
      if (w > 20) {
        g.font = F_BRICK; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = 'rgba(43,34,54,0.85)'; g.fillText(b.lbl, w / 2, h / 2 + 0.6);
      }
    }), 0.1);
    s.ax = 0; s.ay = 0;
    _bricks.set(key, s);
    return s;
  }

  function PaddleCap(c, flip) {
    return Night(Spr(12, 12, g => {
      if (flip) g.scale(-1, 1);
      g.translate(-6, -6);
      RR(g, 1, 1.5, 14, 9, [4.5, 0, 0, 4.5]); g.fillStyle = c; g.fill();
      g.save(); RR(g, 1, 1.5, 14, 9, [4.5, 0, 0, 4.5]); g.clip();
      g.fillStyle = Lt(c, 0.5); g.fillRect(0, 1.5, 14, 2.5);
      g.fillStyle = Dk(c, 0.25); g.fillRect(0, 7.5, 14, 3);
      g.restore();
      g.beginPath(); g.moveTo(12, 1.5); g.lineTo(5.5, 1.5); g.arcTo(1, 1.5, 1, 6, 4.5); g.arcTo(1, 10.5, 5.5, 10.5, 4.5); g.lineTo(12, 10.5);
      g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke();
      Circ(g, 6, 6, 1.4); g.fillStyle = '#fff'; g.fill();
    }), 0.08);
  }

  function BuildBg() {
    const s = Cv(CV_W, BG_TH, _k), g = s.g;
    const gr = g.createLinearGradient(0, 0, 0, BG_TH);
    if (_dark) { gr.addColorStop(0, '#0b1026'); gr.addColorStop(1, '#1a1f45'); }
    else { gr.addColorStop(0, '#eef4ff'); gr.addColorStop(1, '#fbfcff'); }
    g.fillStyle = gr; g.fillRect(0, 0, CV_W, BG_TH);
    g.strokeStyle = _dark ? 'rgba(56,189,248,0.07)' : 'rgba(59,130,246,0.09)'; g.lineWidth = 1;
    for (let x = 0.5; x < CV_W; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, BG_TH); g.stroke(); }
    for (let y = 0.5; y < BG_TH; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(CV_W, y); g.stroke(); }
    g.strokeStyle = _dark ? 'rgba(56,189,248,0.12)' : 'rgba(59,130,246,0.15)';
    for (let x = 0.5; x < CV_W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, BG_TH); g.stroke(); }
    for (let y = 0.5; y < BG_TH; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(CV_W, y); g.stroke(); }
    return s;
  }
  function BuildSymbols(seed, n, z, a) {
    const s = Cv(CV_W, BG_TH, _k), g = s.g, R = Rng(seed);
    const glyphs = ['+', '×', '÷', '%', 'π', '√', '=', '∑', 'A+', '10', '½', '∞'];
    const col = _dark ? `rgba(165,180,252,${a})` : `rgba(99,102,241,${a})`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = R() * CV_W, y = R() * BG_TH, sz = (9 + R() * 10) * z, rot = (R() - 0.5) * 0.8, gl = glyphs[R() * glyphs.length | 0];
      for (const dy of [-BG_TH, 0, BG_TH]) {
        g.save(); g.translate(x, y + dy); g.rotate(rot);
        g.font = `900 ${sz}px ${FONT}`; g.fillStyle = col; g.fillText(gl, 0, 0);
        g.restore();
      }
    }
    if (_dark) for (let i = 0; i < n * 2; i++) { g.fillStyle = `rgba(255,255,240,${0.2 + R() * a * 2})`; const x = R() * CV_W, y = R() * BG_TH; for (const dy of [-BG_TH, 0, BG_TH]) { Circ(g, x, y + dy, 0.5 + R() * z); g.fill(); } }
    return s;
  }

  function BuildSprites() {
    _bricks = new Map();
    const S = { cap: {}, capsule: {}, chip: {} };
    for (const [n, c] of [['n', '#3b82f6'], ['w', '#22d3ee'], ['s', '#ef4444']]) S.cap[n] = [PaddleCap(c, false), PaddleCap(c, true)];
    S.mid = Night(Spr(8, 12, g => {
      g.translate(-4, -6);
      const gr = g.createLinearGradient(0, 1.5, 0, 10.5);
      gr.addColorStop(0, '#f8fafc'); gr.addColorStop(0.35, '#cbd5e1'); gr.addColorStop(0.7, '#94a3b8'); gr.addColorStop(1, '#64748b');
      g.fillStyle = gr; g.fillRect(0, 1.5, 8, 9);
      g.fillStyle = OUT; g.fillRect(0, 0.75, 8, 1.5); g.fillRect(0, 9.75, 8, 1.5);
    }), 0.08);
    S.ball = Night(Spr(12, 12, g => {
      Circ(g, 0, 0, 4.3); Fl(g, '#e0e7ff', 1.3);
      g.save(); Circ(g, 0, 0, 4.3); g.clip(); Circ(g, 1.4, 1.8, 4); g.fillStyle = '#a5b4fc'; g.fill(); g.restore();
      Circ(g, 0, 0, 4.3); g.lineWidth = 1.3; g.strokeStyle = OUT; g.stroke();
      Circ(g, -1.4, -1.5, 1.4); g.fillStyle = '#fff'; g.fill();
    }), 0.05);
    S.glow = Spr(36, 36, g => Glow(g, 0, 0, 18, '#60a5fa', _dark ? 0.55 : 0.35));
    S.glowS = Spr(36, 36, g => Glow(g, 0, 0, 18, '#fbbf24', _dark ? 0.6 : 0.45));
    S.trail = Spr(10, 10, g => { Circ(g, 0, 0, 4); g.fillStyle = _dark ? '#93c5fd' : '#60a5fa'; g.fill(); });
    S.trailS = Spr(10, 10, g => { Circ(g, 0, 0, 4); g.fillStyle = '#fbbf24'; g.fill(); });
    for (const p of PU_TYPES) S.capsule[p.type] = Night(Spr(28, 15, g => CapsuleArt(g, p.color, p.type)), 0.08);
    S.puGlow = {};
    for (const p of PU_TYPES) S.puGlow[p.type] = Spr(44, 44, g => Glow(g, 0, 0, 22, p.color, 0.45));
    for (const c of [...COLORS, '#22d3ee', '#c084fc', '#fbbf24']) S.chip[c] = Spr(8, 8, g => { RR(g, -2.6, -2, 5.2, 4, 1); Fl(g, c, 1); });
    S.puff = Spr(16, 16, g => { Circ(g, 0, 0, 6); g.fillStyle = _dark ? 'rgba(200,210,255,0.8)' : '#ffffff'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = 'rgba(43,34,54,0.22)'; g.stroke(); });
    S.spark = Spr(18, 18, g => { Glow(g, 0, 0, 9, '#fde047', 0.7); Star(g, 0, 0, 7, 2, 4); Fl(g, '#fef08a', 1); });
    S.heart = Night(Spr(16, 15, g => { g.translate(0, 0.5); g.beginPath(); g.moveTo(0, 5.5); g.bezierCurveTo(-8.5, 0, -6.5, -7.5, 0, -3.6); g.bezierCurveTo(6.5, -7.5, 8.5, 0, 0, 5.5); g.closePath(); Fl(g, '#ef4444', 1.3); Ell(g, -3.2, -2.6, 1.5, 1); g.fillStyle = '#fecaca'; g.fill(); }), 0.05);
    S.ico = {};
    for (const p of PU_TYPES) S.ico[p.type] = Spr(18, 18, g => { Circ(g, 0, 0, 7.5); Fl(g, p.color, 1.4); PuIcon(g, p.type, 0.6); });
    S.bg = BuildBg();
    S.sym1 = BuildSymbols(5, 16, 0.8, _dark ? 0.1 : 0.07);
    S.sym2 = BuildSymbols(9, 9, 1.4, _dark ? 0.16 : 0.1);
    S.rail = Night(Spr(4, CV_H, g => {
      g.translate(-2, -CV_H / 2);
      const gr = g.createLinearGradient(0, 0, 4, 0);
      gr.addColorStop(0, '#94a3b8'); gr.addColorStop(0.5, '#e2e8f0'); gr.addColorStop(1, '#64748b');
      g.fillStyle = gr; g.fillRect(0, 0, 4, CV_H);
      for (let y = 20; y < CV_H; y += 40) { g.fillStyle = '#3b82f6'; g.fillRect(0, y, 4, 8); g.fillStyle = OUT; g.fillRect(0, y, 4, 1); g.fillRect(0, y + 7, 4, 1); }
    }), 0.2);
    S.vign = Cv(CV_W, CV_H, _k);
    const vg = S.vign.g.createRadialGradient(CV_W / 2, CV_H / 2, CV_H * 0.35, CV_W / 2, CV_H / 2, CV_H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, _dark ? 'rgba(2,4,18,0.5)' : 'rgba(30,50,110,0.1)');
    S.vign.g.fillStyle = vg; S.vign.g.fillRect(0, 0, CV_W, CV_H);
    S.hurt = Cv(CV_W, CV_H, _k);
    const hg = S.hurt.g.createRadialGradient(CV_W / 2, CV_H / 2, CV_H * 0.3, CV_W / 2, CV_H / 2, CV_H * 0.75);
    hg.addColorStop(0, 'rgba(239,68,68,0)'); hg.addColorStop(1, 'rgba(239,68,68,0.55)');
    S.hurt.g.fillStyle = hg; S.hurt.g.fillRect(0, 0, CV_W, CV_H);
    S.hintBg = _dark ? 'rgba(10,12,30,0.7)' : 'rgba(255,255,255,0.85)';
    S.hintTx = _dark ? '#e2e8f0' : '#2b2236';
    _S = S;
  }

  function BuildIcons() {
    const o = {};
    for (const p of PU_TYPES) o[p.type] = Spr(28, 15, g => CapsuleArt(g, p.color, p.type), 2).c.toDataURL();
    return o;
  }

  const PN = 160;
  const _P = Array.from({ length: PN }, () => ({ on: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, T: 1, s: 1, ds: 0, r: 0, vr: 0, c: '', c2: '' }));
  let _pi = 0;
  function Part(k, x, y, vx, vy, T, s, c, g = 0, ds = 0, vr = 0) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.T = T; p.t = 0; p.s = s; p.ds = ds; p.c = c; p.c2 = ''; p.g = g; p.r = Math.random() * TAU; p.vr = vr;
    return p;
  }
  function ClearParts() { for (const p of _P) p.on = 0; }
  const _txt = {};
  function NumStr(n, neg) { const k = neg ? -n : n; return _txt[k] || (_txt[k] = neg ? `−${n}` : `+${n}`); }

  function MakeBall(x, y, vx, vy, r, attached) {
    return { x, y, vx, vy, r, attached, tr: new Float32Array(TRAIL_N * 2), tn: 0, ti: 0 };
  }

  function MakeBricks(lvl) {
    const pool = _grades.length ? _grades : FallbackGrades();
    const bricks = [];
    const bw = CV_W / lvl.cols;
    const bh = 14;
    const topOffset = 28;
    for (let r = 0; r < lvl.rows; r++) {
      for (let c = 0; c < lvl.cols; c++) {
        const g = pool[(r * lvl.cols + c) % pool.length];
        bricks.push({
          x: c * bw, y: topOffset + r * (bh + 2),
          w: bw - 2, h: bh,
          grade: g,
          color: GradeColor(g.Pct),
          alive: true,
          hitAnim: 0,
          lbl: g.Pct != null ? `${Math.round(g.Pct)}%` : '?',
          delay: (r * lvl.cols + c) * 18 + r * 40,
        });
      }
    }
    return bricks;
  }

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    const paddleW = 52;
    const paddleH = 8;
    const paddleY = CV_H - 20;
    const ballR = 4;
    const bricks = MakeBricks(lvl);
    return {
      lvl,
      status: 'start',
      score: 0,
      lives: 3,
      combo: 0,

      paddle: { x: CV_W / 2 - paddleW / 2, y: paddleY, w: paddleW, h: paddleH, baseW: paddleW, vw: paddleW, px: CV_W / 2 - paddleW / 2, gh: new Float32Array(4), bump: 0 },
      balls: [MakeBall(CV_W / 2, paddleY - ballR - 1, 0, 0, ballR, true)],
      bricks,
      powerUps: [],
      activePU: {},

      t: 0,
      bt: 0,
      shake: 0,
      hurt: 0,
    };
  }

  function LaunchBall(ball, gs) {
    if (!ball.attached) return;
    ball.attached = false;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const spd = gs.lvl.ballSpeed;
    ball.vx = Math.cos(angle) * spd;
    ball.vy = Math.sin(angle) * spd;
    for (let i = 0; i < 4; i++) Part(0, ball.x + (Math.random() - 0.5) * 8, ball.y + 3, (Math.random() - 0.5) * 0.04, 0.01, 300, 0.4, '', 0, 0.0014);
  }

  function ClampPaddle(gs) {
    gs.paddle.x = Math.max(0, Math.min(CV_W - gs.paddle.w, gs.paddle.x));
  }

  function ResetBall(gs) {
    gs.balls = [MakeBall(gs.paddle.x + gs.paddle.w / 2, gs.paddle.y - 5, 0, 0, 4, true)];
  }

  function BreakFx(brick, eff, pts) {
    const cx = brick.x + 1 + brick.w / 2, cy = brick.y + brick.h / 2;
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * TAU, v = 0.03 + Math.random() * 0.09;
      Part(1, cx + (Math.random() - 0.5) * brick.w * 0.7, cy + (Math.random() - 0.5) * brick.h * 0.6, Math.cos(a) * v, Math.sin(a) * v - 0.04, 600 + Math.random() * 400, 0.8 + Math.random() * 0.6, brick.color, 0.00028, 0, (Math.random() - 0.5) * 0.03);
    }
    for (let i = 0; i < 2; i++) Part(0, cx + (Math.random() - 0.5) * 12, cy, (Math.random() - 0.5) * 0.03, -0.01, 360, 0.55, '', 0, 0.0016);
    if (eff > 0) Part(2, cx + (Math.random() - 0.5) * 10, cy, 0, 0, 420, 0.7, '', 0, -0.0012);
    const p = Part(3, cx, cy - 4, 0, -0.035, 700, 1, NumStr(pts, eff <= 0));
    p.c2 = eff > 0 ? (GS.combo > 1 ? '#fde047' : '#ffffff') : '#f87171';
    GS.shake = Math.max(GS.shake, eff > 0 ? 1.2 + Math.min(GS.combo, 5) * 0.25 : 2.2);
  }

  function UpdateBalls(gs, dt) {
    const speedMult = gs.activePU.slow ? 0.55 : 1;
    const dtF = dt * 0.06;

    for (let bi = gs.balls.length - 1; bi >= 0; bi--) {
      const ball = gs.balls[bi];

      if (ball.attached) {
        ball.x = gs.paddle.x + gs.paddle.w / 2;
        ball.y = gs.paddle.y - ball.r - 1;
        continue;
      }

      ball.x += ball.vx * dtF * speedMult;
      ball.y += ball.vy * dtF * speedMult;

      if (ball.x - ball.r <= 0)  { ball.x = ball.r; ball.vx = Math.abs(ball.vx); Part(0, 2, ball.y, 0.02, 0, 240, 0.35, '', 0, 0.0014); }
      if (ball.x + ball.r >= CV_W) { ball.x = CV_W - ball.r; ball.vx = -Math.abs(ball.vx); Part(0, CV_W - 2, ball.y, -0.02, 0, 240, 0.35, '', 0, 0.0014); }
      if (ball.y - ball.r <= 0)  { ball.y = ball.r; ball.vy = Math.abs(ball.vy); Part(0, ball.x, 2, 0, 0.02, 240, 0.35, '', 0, 0.0014); }

      const p = gs.paddle;
      if (ball.vy > 0 &&
          ball.y + ball.r >= p.y && ball.y + ball.r <= p.y + p.h + 4 &&
          ball.x >= p.x - 2 && ball.x <= p.x + p.w + 2) {
        ball.y = p.y - ball.r;
        const hitPos = (ball.x - p.x) / p.w;
        const angle = -Math.PI * 0.15 - hitPos * Math.PI * 0.7;
        const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = Math.cos(angle) * spd;
        ball.vy = Math.sin(angle) * spd;
        if (ball.vy > -0.5) ball.vy = -Math.abs(ball.vy) - 0.5;
        gs.combo = 0;
        p.bump = 1;
        for (let i = 0; i < 3; i++) Part(2, ball.x + (Math.random() - 0.5) * 8, p.y - 1, (Math.random() - 0.5) * 0.08, -0.03 - Math.random() * 0.04, 260, 0.4, '', 0, -0.0012);
      }

      for (const brick of gs.bricks) {
        if (!brick.alive) continue;
        const bx = brick.x + 1, by = brick.y, bw = brick.w, bh = brick.h;
        const closestX = Math.max(bx, Math.min(ball.x, bx + bw));
        const closestY = Math.max(by, Math.min(ball.y, by + bh));
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        if (dx * dx + dy * dy <= ball.r * ball.r) {
          brick.alive = false;
          brick.hitAnim = 1;

          gs.combo++;
          const comboMult = Math.min(gs.combo, 5);
          const eff = GradeEffect(brick.grade.Pct);
          const basePts = Math.round((brick.grade.Pct ?? 50) * 2);
          let shown;
          if (eff > 0) {
            shown = basePts * comboMult;
            gs.score += shown;
          } else {
            shown = Math.round(basePts * 0.5);
            gs.score = Math.max(0, gs.score - Math.round(basePts * 0.5));
            if (!gs.activePU.wide) {
              gs.paddle.w = Math.max(28, gs.paddle.baseW * 0.65);
              clearTimeout(gs._shrinkTimer);
              gs._shrinkTimer = setTimeout(() => {
                if (GS && !GS.activePU.wide) GS.paddle.w = GS.paddle.baseW;
              }, 2500);
            }
          }
          BreakFx(brick, eff, shown);

          if (Math.random() < PU_DROP_CHANCE && IsPositive(brick.grade)) {
            const puType = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
            gs.powerUps.push({
              x: bx + bw / 2, y: by + bh / 2,
              ...puType,
              vy: PU_SPEED,
              t0: gs.t,
            });
          }

          if (Math.abs(dx) > Math.abs(dy)) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;

          break;
        }
      }

      if (ball.y - ball.r > CV_H + 10) {
        gs.balls.splice(bi, 1);
      }
    }

    if (gs.balls.length === 0) {
      gs.lives--;
      gs.shake = 6;
      gs.hurt = 1;
      if (gs.lives <= 0) {
        gs.status = 'gameover';
      } else {
        ResetBall(gs);
      }
    }

    if (gs.bricks.every(b => !b.alive)) {
      if (gs.lvl.freePlay) {
        gs.bricks = MakeBricks(gs.lvl);
        gs.bt = 0;
      } else {
        gs.status = 'win';
      }
    }
  }

  function UpdatePowerUps(gs, dt) {
    const dtF = dt * 0.06;
    for (let i = gs.powerUps.length - 1; i >= 0; i--) {
      const pu = gs.powerUps[i];
      pu.y += pu.vy * dtF;

      const p = gs.paddle;
      if (pu.y >= p.y && pu.y <= p.y + p.h + 6 &&
          pu.x >= p.x - 4 && pu.x <= p.x + p.w + 4) {
        ActivatePowerUp(gs, pu);
        for (let j = 0; j < 8; j++) { const a = Math.random() * TAU; Part(2, pu.x, pu.y, Math.cos(a) * 0.07, Math.sin(a) * 0.07 - 0.03, 420, 0.6, '', 0, -0.0012); }
        gs.powerUps.splice(i, 1);
        continue;
      }

      if (pu.y > CV_H + 20) {
        gs.powerUps.splice(i, 1);
      }
    }
  }

  function ActivatePowerUp(gs, pu) {
    clearTimeout(gs.activePU[pu.type + '_t']);
    gs.activePU[pu.type + '_end'] = gs.t + PU_DURATION;

    if (pu.type === 'wide') {
      gs.activePU.wide = true;
      gs.paddle.w = gs.paddle.baseW * 1.6;
      ClampPaddle(gs);
      gs.activePU.wide_t = setTimeout(() => {
        if (GS) { GS.activePU.wide = false; GS.paddle.w = GS.paddle.baseW; ClampPaddle(GS); }
      }, PU_DURATION);
    } else if (pu.type === 'multi') {
      gs.activePU.multi = true;
      const src = gs.balls.find(b => !b.attached) || gs.balls[0];
      if (src) {
        for (let n = 0; n < 2; n++) {
          const angle = Math.atan2(src.vy, src.vx) + (n === 0 ? 0.4 : -0.4);
          const spd = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || gs.lvl.ballSpeed;
          gs.balls.push(MakeBall(src.x, src.y, Math.cos(angle) * spd, Math.sin(angle) * spd, src.r, false));
        }
      }
      gs.activePU.multi_t = setTimeout(() => { if (GS) GS.activePU.multi = false; }, PU_DURATION);
    } else if (pu.type === 'slow') {
      gs.activePU.slow = true;
      gs.activePU.slow_t = setTimeout(() => { if (GS) GS.activePU.slow = false; }, PU_DURATION);
    }
  }

  function Step(dt) {
    GS.t += dt;
    GS.bt += dt;
    const p = GS.paddle;
    if (GS.status === 'playing') {
      for (let i = 3; i > 0; i--) p.gh[i] = p.gh[i - 1];
      p.gh[0] = p.px;
      p.px = p.x;
      UpdatePaddle(GS, dt);
      UpdateBalls(GS, dt);
      UpdatePowerUps(GS, dt);
      for (const b of GS.balls) {
        if (b.attached) { b.tn = 0; continue; }
        b.tr[b.ti * 2] = b.x; b.tr[b.ti * 2 + 1] = b.y;
        b.ti = (b.ti + 1) % TRAIL_N;
        if (b.tn < TRAIL_N) b.tn++;
      }
    } else {
      for (let i = 0; i < 4; i++) p.gh[i] = p.x;
      p.px = p.x;
    }
    p.vw += (p.w - p.vw) * Math.min(1, dt * 0.018);
    if (p.bump > 0) p.bump = Math.max(0, p.bump - dt * 0.008);
    for (const b of GS.bricks) if (b.hitAnim > 0) b.hitAnim = Math.max(0, b.hitAnim - dt * 0.006);
    for (let i = 0; i < PN; i++) {
      const q = _P[i];
      if (!q.on) continue;
      q.t += dt;
      if (q.t >= q.T) { q.on = 0; continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.r += q.vr * dt; q.s += q.ds * dt;
    }
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - dt * 0.02);
    if (GS.hurt > 0) GS.hurt = Math.max(0, GS.hurt - dt * 0.0022);
  }

  function DrawTileV(s, off, dx) {
    let y = off % s.h;
    if (y > 0) y -= s.h;
    y = Math.round(y * _k) / _k;
    while (y < CV_H + 8) { _ctx.drawImage(s.c, dx - 8, y, s.w + 16, s.h); y += s.h; }
  }

  function Outlined(txt, x, y, font, col, lw) {
    const c = _ctx;
    c.font = font; c.lineWidth = lw; c.strokeStyle = OUT; c.lineJoin = 'round';
    c.strokeText(txt, x, y);
    c.fillStyle = col; c.fillText(txt, x, y);
  }

  function Draw() {
    if (!_ctx || !GS || !_S) return;
    const c = _ctx, S = _S, t = GS.t, p = GS.paddle;
    const sh = GS.shake;
    _ox = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    _oy = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    Base();

    const par = (p.x + p.w / 2 - CV_W / 2) / CV_W;
    c.drawImage(S.bg.c, -8, -8, CV_W + 16, CV_H + 16);
    DrawTileV(S.sym1, t * 0.006, -par * 6);
    DrawTileV(S.sym2, t * 0.014, -par * 14);
    Blit(S.rail, 2, CV_H / 2);
    Blit(S.rail, CV_W - 2, CV_H / 2);

    for (const b of GS.bricks) {
      if (!b.alive) continue;
      const s = BrickSprite(b);
      const u = Math.min(1, Math.max(0, (GS.bt - b.delay) / 260));
      if (u <= 0) continue;
      if (u < 1) {
        const e = 1 - Math.pow(1 - u, 3);
        c.globalAlpha = u;
        c.drawImage(s.c, b.x - 0.5, b.y - 1.5 - (1 - e) * 24, s.w, s.h);
        c.globalAlpha = 1;
      } else c.drawImage(s.c, Math.round((b.x - 0.5) * _k) / _k, Math.round((b.y - 1.5) * _k) / _k, s.w, s.h);
    }

    for (const pu of GS.powerUps) {
      const bob = Math.sin((t - pu.t0) / 140) * 0.12;
      c.globalAlpha = 0.8;
      Blit(S.puGlow[pu.type], pu.x, pu.y);
      c.globalAlpha = 1;
      BlitT(S.capsule[pu.type], pu.x, pu.y, bob, 1, 1);
      const gx = ((t - pu.t0) / 6) % 60 - 18;
      if (gx > -12 && gx < 12) {
        c.save(); c.beginPath(); c.roundRect(pu.x - 12, pu.y - 5.5, 24, 11, 5.5); c.clip();
        c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(pu.x + gx - 2, pu.y - 6); c.lineTo(pu.x + gx + 2, pu.y - 6); c.lineTo(pu.x + gx - 1, pu.y + 6); c.lineTo(pu.x + gx - 5, pu.y + 6); c.fill();
        c.restore();
      }
    }

    const slow = !!GS.activePU.slow;
    const tsp = slow ? S.trailS : S.trail;
    for (const b of GS.balls) {
      for (let i = 0; i < b.tn; i++) {
        const j = (b.ti - 1 - i + TRAIL_N * 2) % TRAIL_N, f = 1 - (i + 1) / (b.tn + 1);
        c.globalAlpha = f * 0.45;
        BlitT(tsp, b.tr[j * 2], b.tr[j * 2 + 1], 0, f * 0.95, f * 0.95);
      }
      c.globalAlpha = 1;
      Blit(slow ? S.glowS : S.glow, b.x, b.y);
      Blit(S.ball, b.x, b.y);
    }

    const capKey = GS.activePU.wide ? 'w' : p.w < p.baseW ? 's' : 'n';
    for (let i = 3; i >= 0; i--) {
      if (Math.abs(p.gh[i] - p.x) < 1.5) continue;
      c.globalAlpha = 0.1 + (3 - i) * 0.05;
      DrawPaddle(p.gh[i], capKey);
    }
    c.globalAlpha = 1;
    DrawPaddle(p.x, capKey);

    for (let i = 0; i < PN; i++) {
      const q = _P[i];
      if (!q.on) continue;
      const a = 1 - q.t / q.T;
      if (q.k === 0) { c.globalAlpha = a * 0.8; BlitT(S.puff, q.x, q.y, 0, q.s, q.s); }
      else if (q.k === 1) { c.globalAlpha = Math.min(1, a * 2); BlitT(S.chip[q.c] || S.chip[COLORS[0]], q.x, q.y, q.r, q.s, q.s); }
      else if (q.k === 2) { c.globalAlpha = a; BlitT(S.spark, q.x, q.y, q.r, Math.max(0.05, q.s), Math.max(0.05, q.s)); }
      else {
        c.globalAlpha = Math.min(1, a * 2.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const z = (1 + (1 - Math.min(1, q.t / 110)) * 0.4) * _k;
        c.setTransform(z, 0, 0, z, (q.x + _ox) * _k, (q.y + _oy) * _k);
        Outlined(q.c, 0, 0, F_POP, q.c2, 3.5);
        Base();
      }
    }
    c.globalAlpha = 1;

    let att = false;
    for (const b of GS.balls) if (b.attached) att = true;
    if (GS.status === 'playing' && att) {
      const a = 0.65 + Math.sin(t / 200) * 0.35;
      c.globalAlpha = a;
      c.font = F_HINT; c.textAlign = 'center'; c.textBaseline = 'middle';
      const tw = c.measureText(_hint).width + 34;
      const hx = Math.max(tw / 2 + 6, Math.min(CV_W - tw / 2 - 6, p.x + p.w / 2));
      c.fillStyle = S.hintBg; c.beginPath(); c.roundRect(hx - tw / 2, p.y - 38, tw, 17, 8.5); c.fill();
      c.lineWidth = 1.2; c.strokeStyle = 'rgba(59,130,246,0.6)'; c.stroke();
      c.fillStyle = '#3b82f6'; c.beginPath(); c.moveTo(hx - tw / 2 + 9, p.y - 25.5); c.lineTo(hx - tw / 2 + 14, p.y - 33.5); c.lineTo(hx - tw / 2 + 19, p.y - 25.5); c.fill();
      c.fillStyle = S.hintTx; c.fillText(_hint, hx + 8, p.y - 29.2);
      c.globalAlpha = 1;
    }

    let ix = 10;
    for (const pt of PU_TYPES) {
      if (!GS.activePU[pt.type]) continue;
      const rem = Math.max(0, Math.min(1, ((GS.activePU[pt.type + '_end'] || 0) - t) / PU_DURATION));
      Blit(S.ico[pt.type], ix + 1, CV_H - 12);
      c.beginPath(); c.arc(ix + 1, CV_H - 12, 9.5, -Math.PI / 2, -Math.PI / 2 + rem * TAU);
      c.strokeStyle = pt.color; c.lineWidth = 2; c.stroke();
      ix += 23;
    }
    for (let i = 0; i < GS.lives; i++) Blit(S.heart, CV_W - 14 - i * 15, CV_H - 12);

    if (!GS.lvl.freePlay) {
      const prog = Math.min(1, GS.score / GS.lvl.target);
      c.fillStyle = 'rgba(74,222,128,0.18)';
      c.fillRect(0, CV_H - 3, CV_W, 3);
      c.fillStyle = '#4ade80';
      c.fillRect(0, CV_H - 3, CV_W * prog, 3);
      if (prog > 0) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(0, CV_H - 3, CV_W * prog, 1); }
    }

    c.drawImage(S.vign.c, -8, -8, CV_W + 16, CV_H + 16);
    if (GS.hurt > 0) { c.globalAlpha = GS.hurt; c.drawImage(S.hurt.c, -8, -8, CV_W + 16, CV_H + 16); c.globalAlpha = 1; }

    UpdateHUD();
  }

  function DrawPaddle(x, key) {
    const c = _ctx, S = _S, p = GS.paddle;
    const w = p.vw, cx = x + p.w / 2, l = cx - w / 2;
    const sy = 1 - p.bump * 0.25, y = p.y + 4 + p.bump * 1.2;
    c.setTransform(_k, 0, 0, sy * _k, _ox * _k, (y + _oy) * _k);
    const caps = S.cap[key];
    c.drawImage(S.mid.c, l + 6, -6, Math.max(0, w - 12), 12);
    c.drawImage(caps[0].c, l - 1, -6, 12, 12);
    c.drawImage(caps[1].c, l + w - 11, -6, 12, 12);
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(l + 10, -3.6, Math.max(0, w - 20), 1.2);
    Base();
  }

  let _hint = '', _progEl = null;

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!GS) return;
    const isFP = GS.lvl.freePlay;
    const lvChanged = _hud.lv0 !== GS.lvl;
    if (_hud.score !== GS.score || lvChanged) {
      _hud.score = GS.score; _hud.lv0 = GS.lvl;
      SetText('gf-bo-score', GS.score.toLocaleString());
      if (_progEl) _progEl.style.width = isFP ? '100%' : `${Math.min(100, GS.score / GS.lvl.target * 100)}%`;
    }
    if (lvChanged) {
      const lv = isFP ? '∞' : `L${GS.lvl.id}`;
      if (_hud.lvl !== lv) { _hud.lvl = lv; SetText('gf-bo-level', lv); }
    }
    if (_hud.lives !== GS.lives) { _hud.lives = GS.lives; SetText('gf-bo-lives', '♥'.repeat(Math.max(0, GS.lives))); }
  }

  const SCREEN_IDS = ['gf-bos-start','gf-bos-pause','gf-bos-gameover','gf-bos-win'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    SaveScore(GS.lvl.id, GS.score);
    const best = Math.max(LoadScores()[GS.lvl.id] || 0, GS.score);
    SetText('gf-bos-go-score', GS.score.toLocaleString());
    SetText('gf-bos-go-best', best.toLocaleString());
    ShowScreen('gf-bos-gameover'); Draw();
  }

  function ShowWin() {
    SaveScore(GS.lvl.id, GS.score);
    SaveUnlock(GS.lvl.id);
    const hasNext = GS.lvl.id < 5;
    SetText('gf-bos-win-score', `${GS.score.toLocaleString()} pts`);
    document.getElementById('gf-bos-next')?.style.setProperty('display', hasNext ? 'block' : 'none');
    const fpBtn = document.getElementById('gf-bos-fp-btn');
    if (fpBtn) fpBtn.style.display = LoadUnlock() >= 5 ? 'block' : 'none';
    ShowScreen('gf-bos-win'); Draw();
    for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, v = 0.04 + Math.random() * 0.12; Part(1, CV_W / 2, CV_H * 0.45, Math.cos(a) * v, Math.sin(a) * v - 0.08, 1200 + Math.random() * 600, 1.2, COLORS[i % 4], 0.00022, 0, (Math.random() - 0.5) * 0.02); }
    StartLoop();
  }

  function BuildLevelSelect() {
    const el = document.getElementById('gf-bo-lvl-sel');
    if (!el) return;
    const unlocked = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const nm = l.freePlay ? '∞' : `L${l.id}`;
      const desc = l.freePlay ? _GameText('game_snake_free_play') : `${l.rows}×${l.cols} ${_GameText('game_snake_grid')}`;
      const tgtTxt = l.freePlay ? _GameText('game_snake_no_target') : `${l.target.toLocaleString()} pts`;
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_not_played');
      const mini = Array.from({ length: Math.min(l.rows, 4) }, (_, r) => `<i style="background:${COLORS[(r + l.id) % 4]}"></i>`).join('');
      return `<button class="gf-bol${avail ? '' : ' gf-bol-locked'}${l.id === _lvlId ? ' gf-bol-sel' : ''}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-bol-left">
          <div class="gf-bol-badge${l.freePlay ? ' gf-bol-badge-fp' : ''}">${nm}</div>
          <div class="gf-bol-info">
            <span class="gf-bol-name">${desc}</span>
            <span class="gf-bol-tgt">${tgtTxt}</span>
          </div>
        </div>
        <div class="gf-bol-right">
          <span class="gf-bol-mini">${mini}</span>
          ${avail ? `<span class="gf-bol-best">${bestTxt}</span>` : '<span class="gf-bol-lock"></span>'}
        </div>
      </button>`;
    }).join('');
    el.querySelectorAll('[data-lvl]').forEach(btn => {
      btn.addEventListener('click', () => {
        _lvlId = parseInt(btn.dataset.lvl);
        DoStart();
      });
    });
  }

  function Frame(ts) {
    _raf = null;
    if (!GS) return;
    const dt = Math.min(ts - (_last || ts), 50);
    _last = ts;
    Step(dt);
    if (GS.status === 'gameover' && !GS.ended) { GS.ended = true; ShowGameOver(); }
    else if (GS.status === 'win' && !GS.won) { GS.won = true; ShowWin(); return; }
    Draw();
    if (GS.status === 'playing' || GS.status === 'start' || AnyFx()) _raf = requestAnimationFrame(Frame);
  }
  function AnyFx() { if (GS.shake > 0 || GS.hurt > 0) return true; for (let i = 0; i < PN; i++) if (_P[i].on) return true; return false; }

  function StartLoop() { StopLoop(); _last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function ClearPU() {
    if (!GS) return;
    clearTimeout(GS._shrinkTimer);
    for (const pt of PU_TYPES) clearTimeout(GS.activePU[pt.type + '_t']);
  }

  function DoStart() {
    StopLoop();
    ClearPU();
    ClearParts();
    GS = NewGameState(_lvlId);
    GS.status = 'playing';
    ShowScreen(null); Draw(); StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-bos-pause'); Draw();
    } else if (GS.status === 'paused') {
      GS.status = 'playing';
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    StopLoop(); ClearPU(); ClearParts();
    GS = NewGameState(_lvlId);
    BuildLevelSelect(); Draw(); ShowScreen('gf-bos-start');
    StartLoop();
  }

  let _kh = null;

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-bo') || _root.style.display === 'none') return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      GS.status === 'playing' || GS.status === 'paused' ? DoPause() : CloseGradeBreakout();
      return;
    }
    if (e.key === 'p' || e.key === 'P') { DoPause(); return; }
    if (e.key === 'r' || e.key === 'R') { if (GS.status !== 'start') DoStart(); return; }

    if (['ArrowLeft','ArrowRight',' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }

    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (GS.status === 'start' || GS.status === 'gameover') DoStart();
        else if (GS.status === 'paused') DoPause();
        e.preventDefault();
      }
      return;
    }

    if (e.key === ' ') {
      const attached = GS.balls.find(b => b.attached);
      if (attached) LaunchBall(attached, GS);
      return;
    }

    if (e.key === 'ArrowLeft')  _keysHeld.add('left');
    if (e.key === 'ArrowRight') _keysHeld.add('right');
    if (e.key === 'a' || e.key === 'A') _keysHeld.add('left');
    if (e.key === 'd' || e.key === 'D') _keysHeld.add('right');
  }

  function OnKeyUp(e) {
    if (e.key === 'ArrowLeft')  _keysHeld.delete('left');
    if (e.key === 'ArrowRight') _keysHeld.delete('right');
    if (e.key === 'a' || e.key === 'A') _keysHeld.delete('left');
    if (e.key === 'd' || e.key === 'D') _keysHeld.delete('right');
  }

  const _keysHeld = new Set();
  let _khUp = null;

  function UpdatePaddle(gs, dt) {
    if (!gs || gs.status !== 'playing') return;
    const speed = 360 * (dt / 1000);
    if (_keysHeld.has('left'))  gs.paddle.x -= speed;
    if (_keysHeld.has('right')) gs.paddle.x += speed;
    if (_keysHeld.size) ClampPaddle(gs);
  }

  function AttachKeys()  {
    if (_kh) return;
    _kh = OnKey; _khUp = OnKeyUp;
    document.addEventListener('keydown', _kh, true);
    document.addEventListener('keyup',   _khUp, true);
    window.addEventListener('blur', _ClearHeldKeys);
  }
  function DetachKeys()  {
    if (_kh)   { document.removeEventListener('keydown', _kh,   true); _kh   = null; }
    if (_khUp) { document.removeEventListener('keyup',   _khUp, true); _khUp = null; }
    window.removeEventListener('blur', _ClearHeldKeys);
    _ClearHeldKeys();
  }
  function _ClearHeldKeys() { _keysHeld.clear(); }

  function PointerX(clientX) {
    const rect = _cv.getBoundingClientRect();
    return (clientX - rect.left) * (CV_W / rect.width);
  }
  function OnTouchMove(e) {
    if (!GS || GS.status !== 'playing') return;
    GS.paddle.x = PointerX(e.touches[0].clientX) - GS.paddle.w / 2;
    ClampPaddle(GS);
    e.preventDefault();
  }
  function OnMouseMove(e) {
    if (!GS || GS.status !== 'playing') return;
    GS.paddle.x = PointerX(e.clientX) - GS.paddle.w / 2;
    ClampPaddle(GS);
  }
  function OnPointerLaunch() {
    if (GS?.status === 'playing') {
      const attached = GS.balls.find(b => b.attached);
      if (attached) LaunchBall(attached, GS);
    }
  }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-bo');
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
  const _tobs = new MutationObserver(ApplyTheme);

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.6, Math.min(1.5, (innerWidth - 34 - SIDE_W) / CV_W, (innerHeight - 34 - HDR_H) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(CV_W * s), h = Math.round(CV_H * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    _root.style.setProperty('--bo-board-h', `${h}px`);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (_cv.width !== bw || _cv.height !== bh || !_S) {
      _cv.width = bw; _cv.height = bh;
      _k = bw / CV_W;
      BuildSprites();
    }
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-bo')) return;
    InjectCSS();
    _icons = BuildIcons();
    _hint = _GameText('bo_launch');
    const I = _icons;
    const root = document.createElement('div');
    root.id = 'gf-bo';
    root.innerHTML = `
<div id="gf-bo-modal">
  <div id="gf-bo-hdr">
    <div class="gf-bo-hl">
      <div id="gf-bo-logo">GB</div>
      <span id="gf-bo-title">GradeBreakout</span>
    </div>
    <div class="gf-bo-hr">
      <button id="gf-bo-pause-btn" title="${_GameText('game_pause_p')}">&#9208;</button>
      <button id="gf-bo-close" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-bo-body">
    <div id="gf-bo-board">
      <div id="gf-bo-view"><canvas id="gf-bo-canvas" width="${CV_W}" height="${CV_H}"></canvas></div>
    </div>
    <div id="gf-bo-hud">
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('game_score').toUpperCase()}</div>
        <div id="gf-bo-score" class="gf-bop-big">0</div>
        <div class="gf-bo-prog"><i id="gf-bo-prog"></i></div>
      </div>
      <div class="gf-bop gf-bop-row">
        <div>
          <div class="gf-bop-label">${_GameText('bo_level')}</div>
          <div id="gf-bo-level" class="gf-bop-val">L1</div>
        </div>
        <div>
          <div class="gf-bop-label">${_GameText('bo_lives')}</div>
          <div id="gf-bo-lives" class="gf-bop-val gf-bo-hearts">&#9829;&#9829;&#9829;</div>
        </div>
      </div>
      <div class="gf-bop gf-bop-grades">
        <div class="gf-bop-label">${_GameText('bo_grade_effects')}</div>
        <div class="gf-bg-row"><span><i style="background:#4ade80"></i>&#8805;75%</span><span>${_GameText('bo_big_pts')}</span></div>
        <div class="gf-bg-row"><span><i style="background:#a3e635"></i>50&#8211;74%</span><span>${_GameText('bo_pts')}</span></div>
        <div class="gf-bg-row"><span><i style="background:#f97316"></i>25&#8211;49%</span><span>${_GameText('bo_neg_shrink')}</span></div>
        <div class="gf-bg-row"><span><i style="background:#f87171"></i>&lt;25%</span><span>${_GameText('bo_neg_shrink')}</span></div>
      </div>
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('bo_powerups')}</div>
        <div class="gf-bpu-row"><img src="${I.wide}" alt=""><span>${_GameText('bo_wide')}</span></div>
        <div class="gf-bpu-row"><img src="${I.multi}" alt=""><span>${_GameText('bo_multi')}</span></div>
        <div class="gf-bpu-row"><img src="${I.slow}" alt=""><span>${_GameText('bo_slow')}</span></div>
      </div>
      <div class="gf-bop gf-bop-ctrl">
        <div class="gf-bop-label">${_GameText('game_controls')}</div>
        <div class="gf-bc-row"><kbd>&#8592;&#8594;</kbd><span>${_GameText('bo_move')}</span></div>
        <div class="gf-bc-row"><kbd>Space</kbd><span>${_GameText('bo_launch')}</span></div>
        <div class="gf-bc-row"><kbd>P / Esc</kbd><span>${_GameText('bo_pause')}</span></div>
        <div class="gf-bc-row"><kbd>R</kbd><span>${_GameText('bo_restart')}</span></div>
      </div>
    </div>

    <div id="gf-bos-start" class="gf-bos gf-bos-glass">
      <div class="gf-bos-card gf-bos-start-card">
        <div class="gf-bos-start-hdr">
          <div class="gf-bos-logo">${_GameText('bo_title')}</div>
          <div class="gf-bos-sub">${_GameText('bo_subtitle')}</div>
        </div>
        <div id="gf-bo-lvl-sel" class="gf-bo-lvls"></div>
        <div class="gf-bos-footer">${_GameText('bo_launch')} &middot; ${_GameText('bo_move')}</div>
      </div>
    </div>

    <div id="gf-bos-pause" class="gf-bos gf-bos-dim" style="display:none">
      <div class="gf-bos-card">
        <div class="gf-bos-h">${_GameText('game_paused')}</div>
        <button class="gf-tb-btn" id="gf-bos-resume">&#9654;&nbsp; ${_GameText('game_resume')}</button>
        <div class="gf-bos-footer">${_GameText('bo_pause_hint')}</div>
      </div>
    </div>

    <div id="gf-bos-gameover" class="gf-bos gf-bos-dim" style="display:none">
      <div class="gf-bos-go-title">${_GameText('game_gameover')}</div>
      <div class="gf-bos-stats">
        <div class="gf-bos-statc"><span>${_GameText('game_score').toUpperCase()}</span><b id="gf-bos-go-score"></b></div>
        <div class="gf-bos-statc"><span>${_GameText('game_best').toUpperCase()}</span><b id="gf-bos-go-best"></b></div>
      </div>
      <div class="gf-bos-row">
        <button class="gf-tb-btn"               id="gf-bos-retry">&#8634;&nbsp; ${_GameText('game_try_again')}</button>
        <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-back-go">&#8592; ${_GameText('game_levels')}</button>
      </div>
    </div>

    <div id="gf-bos-win" class="gf-bos gf-bos-dim" style="display:none">
      <div class="gf-bos-card">
        <div class="gf-bos-win-title">${_GameText('game_snake_level_clear')}</div>
        <div id="gf-bos-win-score" class="gf-bos-win-score"></div>
        <button class="gf-tb-btn"               id="gf-bos-next">&#8594;&nbsp; ${_GameText('game_snake_next_level')}</button>
        <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-fp-btn" style="display:none">&#8734;&nbsp; ${_GameText('game_snake_free_play')}</button>
        <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-back-win">&#8592; ${_GameText('game_levels')}</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _view = document.getElementById('gf-bo-view');
    _cv = document.getElementById('gf-bo-canvas');
    _ctx = _cv.getContext('2d');
    _progEl = document.getElementById('gf-bo-prog');
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-bo-close')     ?.addEventListener('click', CloseGradeBreakout);
    document.getElementById('gf-bo-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-bos-resume')   ?.addEventListener('click', DoPause);
    document.getElementById('gf-bos-retry')    ?.addEventListener('click', DoStart);
    document.getElementById('gf-bos-back-go')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-bos-back-win') ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-bos-next')     ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-bos-fp-btn')   ?.addEventListener('click', () => { _lvlId = 6; DoStart(); });
    document.getElementById('gf-bo')           ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-bo') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyBreakout();
      else CloseGradeBreakout();
    });
    _cv.addEventListener('touchmove', OnTouchMove, { passive: false });
    _cv.addEventListener('touchstart', OnPointerLaunch);
    _cv.addEventListener('mousemove', OnMouseMove);
    _cv.addEventListener('mousedown', OnPointerLaunch);
  }

  function OpenGradeBreakout(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-bo')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    Fit();
    ShowStartScreen();
  }

  function CloseGradeBreakout() {
    const el = document.getElementById('gf-bo');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    DetachKeys(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function BossKeyBreakout() {
    const el = document.getElementById('gf-bo');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS?._bossHidden) {
        GS._bossHidden = false;
        GS.status = 'playing';
        ShowScreen(null);
        StartLoop();
      } else if (GS?.status === 'start') StartLoop();
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') {
        GS.status = 'paused';
        GS._bossHidden = true;
      }
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  function ToggleGradeBreakout(grades) {
    const el = document.getElementById('gf-bo');
    if (el && el.style.display !== 'none') CloseGradeBreakout(); else OpenGradeBreakout(grades);
  }

  W.OpenGradeBreakout       = OpenGradeBreakout;
  W.CloseGradeBreakout      = CloseGradeBreakout;
  W.ToggleGradeBreakout     = ToggleGradeBreakout;
  W.BossKeyBreakout         = BossKeyBreakout;

  function InjectCSS() {
    if (document.getElementById('gf-breakout-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-breakout-css';
    const ol = OUT;
    s.textContent = `
#gf-bo {
  --bo-modal:#ffffff;--bo-hdr:#f5f7fb;--bo-hud:#fafbfd;--bo-scr:rgba(250,251,253,0.95);
  --bo-brd:rgba(59,130,246,0.24);--bo-brd2:#e2e6ee;--bo-btn-brd:#d0d5de;
  --bo-txt:#111;--bo-txt2:#4b5563;--bo-txt3:#8b93a3;--bo-kbd:#eef0f4;--bo-kbd-brd:#ccd2dc;
  --bo-scroll:#d0d0d0;--bo-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-bo[data-theme="dark"] {
  --bo-modal:rgba(13,14,20,0.97);--bo-hdr:rgba(8,9,14,0.95);--bo-hud:rgba(10,11,17,0.98);
  --bo-scr:rgba(10,12,28,0.93);--bo-brd:rgba(59,130,246,0.22);--bo-brd2:#1e2130;
  --bo-btn-brd:#343846;--bo-txt:#f5f5f5;--bo-txt2:#cbd5e1;--bo-txt3:#8a94a6;
  --bo-kbd:#1e2030;--bo-kbd-brd:#343846;--bo-scroll:#2a2a2a;
  --bo-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-bo{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-bo *{box-sizing:border-box;}
#gf-bo img{-webkit-user-drag:none;user-select:none;}
#gf-bo-modal{position:relative;display:flex;flex-direction:column;background:var(--bo-modal);border:1px solid var(--bo-brd);border-radius:12px;box-shadow:var(--bo-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-bo-hdr{display:flex;align-items:center;justify-content:space-between;height:${HDR_H}px;padding:0 14px;background:var(--bo-hdr);border-bottom:1px solid var(--bo-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-bo-hl{display:flex;align-items:center;gap:8px;} .gf-bo-hr{display:flex;align-items:center;gap:6px;}
#gf-bo-logo{width:26px;height:26px;background:#3b82f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:-1px;flex-shrink:0;}
#gf-bo-title{font-size:14px;font-weight:700;color:var(--bo-txt);letter-spacing:-0.3px;}
#gf-bo-pause-btn,#gf-bo-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--bo-btn-brd);border-radius:6px;background:transparent;color:var(--bo-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-bo-pause-btn:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,.10);}
#gf-bo-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-bo-body{display:flex;position:relative;overflow:hidden;}
#gf-bo-board{flex-shrink:0;border-right:1px solid var(--bo-brd);line-height:0;}
#gf-bo-view{line-height:0;}
#gf-bo-canvas{display:block;touch-action:none;user-select:none;-webkit-user-select:none;}
#gf-bo-hud{width:${SIDE_W}px;height:var(--bo-board-h,auto);flex-shrink:0;display:flex;flex-direction:column;gap:6px;padding:8px;overflow-y:auto;background:var(--bo-hud);line-height:1.25;}
#gf-bo-hud::-webkit-scrollbar{width:3px;} #gf-bo-hud::-webkit-scrollbar-thumb{background:var(--bo-scroll);border-radius:99px;}
.gf-bop{padding:8px 10px;border:1px solid var(--bo-brd2);border-radius:10px;background:rgba(128,128,128,0.05);flex-shrink:0;}
.gf-bop-row{display:flex;justify-content:space-between;gap:8px;}
.gf-bop-label{font-size:8px;font-weight:700;letter-spacing:1.4px;color:var(--bo-txt3);text-transform:uppercase;margin-bottom:5px;}
.gf-bop-big{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:22px;font-weight:900;color:#22c55e;line-height:1.05;font-variant-numeric:tabular-nums;}
#gf-bo[data-theme="dark"] .gf-bop-big{color:#4ade80;}
.gf-bo-prog{height:5px;margin-top:6px;border-radius:99px;background:rgba(74,222,128,0.16);overflow:hidden;}
.gf-bo-prog i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#22c55e,#a3e635);transition:width .25s;}
.gf-bop-val{font-size:15px;font-weight:800;color:var(--bo-txt);}
.gf-bo-hearts{color:#ef4444;letter-spacing:1px;}
.gf-bg-row{display:flex;justify-content:space-between;align-items:center;font-size:9px;padding:2px 0;color:var(--bo-txt);font-weight:700;}
.gf-bg-row span:first-child{display:flex;align-items:center;gap:5px;}
.gf-bg-row i{width:10px;height:7px;border-radius:2px;border:1.2px solid ${ol};}
.gf-bg-row span:last-child{color:var(--bo-txt3);font-weight:600;}
.gf-bpu-row{display:flex;align-items:center;gap:7px;font-size:9px;color:var(--bo-txt2);font-weight:700;padding:2px 0;}
.gf-bpu-row img{width:28px;height:15px;flex-shrink:0;}
.gf-bc-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.gf-bc-row kbd{display:inline-block;padding:1px 4px;font-family:inherit;font-size:7.5px;font-weight:700;background:var(--bo-kbd);border:1px solid var(--bo-kbd-brd);border-bottom-width:2px;border-radius:4px;color:var(--bo-txt2);min-width:34px;text-align:center;flex-shrink:0;}
.gf-bc-row span{font-size:8.5px;color:var(--bo-txt3);}
.gf-bos{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px;line-height:1.3;text-align:center;}
.gf-bos-glass{background:color-mix(in srgb,var(--bo-scr) 30%,transparent);}
.gf-bos-dim{background:rgba(10,14,34,0.34);backdrop-filter:blur(1.5px);}
.gf-bos-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 20px;border-radius:16px;background:var(--bo-scr);border:1px solid var(--bo-brd);box-shadow:0 14px 44px rgba(0,0,0,.22);max-width:440px;}
.gf-bos-start-card{width:min(430px,100%);max-height:100%;overflow-y:auto;gap:8px;padding:14px 16px;}
.gf-bos-start-hdr{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;}
.gf-bos-logo{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:30px;font-weight:900;color:#60a5fa;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};}
.gf-bos-sub{font-size:11.5px;font-weight:700;color:var(--bo-txt2);margin-top:4px;}
.gf-bos-h{font-size:21px;font-weight:800;color:var(--bo-txt);letter-spacing:4px;}
.gf-bos-footer{font-size:9.5px;color:var(--bo-txt3);text-align:center;line-height:1.4;}
.gf-bos-go-title{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:34px;font-weight:900;color:#f87171;letter-spacing:1px;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};animation:gf-bo-drop .45s cubic-bezier(.2,1.5,.4,1);}
.gf-bos-win-title{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:28px;font-weight:900;color:#4ade80;line-height:1.05;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};animation:gf-bo-drop .45s cubic-bezier(.2,1.5,.4,1);}
.gf-bos-win-score{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:24px;font-weight:900;color:var(--bo-txt);}
@keyframes gf-bo-drop{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:none}}
.gf-bos-stats{display:flex;gap:10px;animation:gf-bo-rise .4s .06s cubic-bezier(.2,1.3,.4,1) both;}
@keyframes gf-bo-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.gf-bos-statc{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:110px;padding:10px 12px;border:1px solid var(--bo-brd);border-radius:12px;background:var(--bo-scr);box-shadow:0 10px 28px rgba(0,0,0,0.18);}
.gf-bos-statc span{font-size:8.5px;font-weight:800;letter-spacing:1.4px;color:var(--bo-txt3);}
.gf-bos-statc b{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:24px;font-weight:900;color:var(--bo-txt);line-height:1;}
.gf-bos-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
.gf-tb-btn{padding:8px 20px;border:2px solid ${ol};border-radius:10px;background:#60a5fa;color:#0b1b3a;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;box-shadow:0 4px 0 ${ol};transition:transform .12s,box-shadow .12s,background .12s;}
.gf-tb-btn:hover{background:#93c5fd;transform:translateY(-1px);box-shadow:0 5px 0 ${ol};}
.gf-tb-btn:active{transform:translateY(3px);box-shadow:0 1px 0 ${ol};}
.gf-tb-btn-sec{background:var(--bo-scr);color:var(--bo-txt);}
.gf-tb-btn-sec:hover{background:var(--bo-hud);}
.gf-bo-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-bol{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 10px;border:1px solid var(--bo-brd2);border-radius:10px;background:var(--bo-modal);color:var(--bo-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-bol:hover:not(:disabled){border-color:#3b82f6;background:rgba(59,130,246,0.07);transform:translateX(2px);}
.gf-bol-sel{border-color:rgba(59,130,246,0.55);}
.gf-bol-locked{opacity:0.45;} .gf-bol:disabled{cursor:default;}
.gf-bol-left{display:flex;align-items:center;gap:10px;}
.gf-bol-badge{width:30px;height:30px;border-radius:8px;background:#60a5fa;border:2px solid ${ol};box-shadow:0 2px 0 ${ol};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#0b1b3a;flex-shrink:0;}
.gf-bol-badge-fp{background:#c4b5fd;}
.gf-bol-info{display:flex;flex-direction:column;gap:1px;}
.gf-bol-name{font-size:11.5px;font-weight:700;color:var(--bo-txt);}
.gf-bol-tgt{font-size:9px;color:var(--bo-txt3);font-weight:400;}
.gf-bol-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.gf-bol-mini{display:flex;flex-direction:column;gap:1.5px;}
.gf-bol-mini i{display:block;width:30px;height:3px;border-radius:2px;}
.gf-bol-best{font-size:8px;color:var(--bo-txt3);white-space:nowrap;}
.gf-bol-lock{width:10px;height:9px;border-radius:2px;background:var(--bo-txt3);position:relative;margin-top:4px;}
.gf-bol-lock::before{content:'';position:absolute;left:1.5px;top:-5px;width:4px;height:5px;border:1.5px solid var(--bo-txt3);border-bottom:none;border-radius:4px 4px 0 0;}
`;
    document.head.appendChild(s);
  }

})(window);
