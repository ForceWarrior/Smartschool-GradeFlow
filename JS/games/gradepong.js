;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 320;
  const CV_H = 320;
  const TAU = Math.PI * 2;
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const F_BIG = `900 96px ${FONT}`;
  const F_ORB = `900 7.5px ${FONT}`;
  const F_POP = `900 12px ${FONT}`;
  const HDR_H = 47;
  const BAR_H = 44;
  const SIDE_W = 156;
  const P_GREEN = '#4ade80';
  const P_RED = '#f87171';

  const LEVELS = [
    { id: 1, aiSpeed: 1.6, aiReact: 0.06, aiMiss: 36, aiTrack: 0.55, winScore: 5, labelKey: 'pong_lvl_beginner' },
    { id: 2, aiSpeed: 2.1, aiReact: 0.10, aiMiss: 24, aiTrack: 0.70, winScore: 5, labelKey: 'pong_lvl_easy'     },
    { id: 3, aiSpeed: 2.7, aiReact: 0.16, aiMiss: 14, aiTrack: 0.82, winScore: 5, labelKey: 'pong_lvl_medium'   },
    { id: 4, aiSpeed: 3.4, aiReact: 0.24, aiMiss:  6, aiTrack: 0.92, winScore: 5, labelKey: 'pong_lvl_hard'     },
    { id: 5, aiSpeed: 4.2, aiReact: 0.36, aiMiss:  2, aiTrack: 0.98, winScore: 5, labelKey: 'pong_lvl_expert'   },
    { id: 6, aiSpeed: 2.8, aiReact: 0.18, aiMiss: 14, aiTrack: 0.85, winScore: Infinity, freePlay: true, labelKey: 'pong_lvl_freeplay' },
  ];

  const LS_UNLOCK = 'gf-pong-unlock';
  const LS_SCORES = 'gf-pong-scores';

  const PADDLE_W  = 8;
  const PADDLE_H  = 50;
  const BALL_R    = 5;
  const WALL_PAD  = 14;
  const BALL_INIT = 2.4;
  const BALL_MAX  = 5.5;
  const BALL_RAMP = 0.10;
  const ORB_R     = 10;
  const ORB_INTERVAL = 6000;
  const EFFECT_DUR   = 4000;
  const TRAIL_N = 12;
  const PH_SET = [PADDLE_H * 0.6, PADDLE_H, PADDLE_H * 1.5];
  const EFF_TYPES = ['bigSelf', 'shrinkOpp', 'slowOpp', 'smallSelf', 'fastOpp'];

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

  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }
  const COLORS = ['#4ade80', '#a3e635', '#f97316', '#f87171', '#a78bfa'];

  function IsPositive(g) { return g.Pct == null || g.Pct >= 50; }

  let GS = null, _grades = [], _lvlId = 1, _raf = null, _last = 0;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _dark = false, _S = null, _ox = 0, _oy = 0;
  const _hud = { p: -1, a: -1, lvl: '' };

  function PickGrade() {
    const pool = _grades.length ? _grades : FallbackGrades();
    return pool[0 | (Math.random() * pool.length)];
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
  function Night(s, a = 0.14) { return _dark ? Shade(s, `rgba(16,24,64,${a})`) : s; }
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
  function Chalk(g, x1, y1, x2, y2, c, lw, R) {
    for (let i = 0; i < 3; i++) Ln(g, x1 + (R() - 0.5) * 0.8, y1 + (R() - 0.5) * 0.8, x2 + (R() - 0.5) * 0.8, y2 + (R() - 0.5) * 0.8, c, lw * (0.6 + i * 0.2));
  }

  function BoardC() { return _dark ? ['#14352a', '#0e261e', '#1b4436'] : ['#2f6b50', '#255a43', '#3a7d5e']; }

  function BuildBoard() {
    const s = Cv(CV_W, CV_H, _k), g = s.g, B = BoardC(), R = Rng(4);
    const gr = g.createRadialGradient(CV_W / 2, CV_H * 0.45, 20, CV_W / 2, CV_H / 2, CV_W * 0.75);
    gr.addColorStop(0, B[2]); gr.addColorStop(1, B[1]);
    g.fillStyle = gr; g.fillRect(0, 0, CV_W, CV_H);
    for (let i = 0; i < 26; i++) {
      const x = R() * CV_W, y = R() * CV_H, w = 30 + R() * 90;
      g.fillStyle = `rgba(255,255,255,${0.012 + R() * 0.025})`;
      g.beginPath(); g.ellipse(x, y, w, w * (0.2 + R() * 0.3), (R() - 0.5) * 0.6, 0, TAU); g.fill();
    }
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.05})`; g.fillRect(R() * CV_W, R() * CV_H, 1, 1); }
    const ch = 'rgba(240,248,240,0.32)';
    for (let y = 6; y < CV_H - 6; y += 16) Chalk(g, CV_W / 2, y, CV_W / 2, y + 8, ch, 2, R);
    g.beginPath(); g.arc(CV_W / 2, CV_H / 2, 40, 0, TAU); g.strokeStyle = 'rgba(240,248,240,0.2)'; g.lineWidth = 1.8; g.stroke();
    g.beginPath(); g.arc(CV_W / 2, CV_H / 2, 3, 0, TAU); g.fillStyle = 'rgba(240,248,240,0.3)'; g.fill();
    g.strokeStyle = 'rgba(240,248,240,0.12)'; g.lineWidth = 1.4;
    g.strokeRect(6, 6, CV_W - 12, CV_H - 12);
    return s;
  }
  function BuildDoodles(seed, n, z, a) {
    const W2 = CV_W + 80, s = Cv(W2, CV_H, _k), g = s.g, R = Rng(seed);
    const txt = ['a²+b²=c²', 'E=mc²', 'π≈3,14', 'x=√9', '2+2=4', '∑n', 'H₂O', 'f(x)', '½', '∠ 90°', 'CO₂', '10/10'];
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = 20 + R() * (W2 - 40), y = 18 + R() * (CV_H - 36), sz = (9 + R() * 6) * z;
      g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.5);
      g.font = `700 ${sz}px ${FONT}`; g.fillStyle = `rgba(240,248,240,${a})`;
      g.fillText(txt[R() * txt.length | 0], 0, 0);
      g.restore();
    }
    for (let i = 0; i < n / 2; i++) {
      const x = R() * W2, y = R() * CV_H, r = (5 + R() * 9) * z;
      g.strokeStyle = `rgba(240,248,240,${a * 0.8})`; g.lineWidth = 1.2;
      if (R() < 0.5) { Star(g, x, y, r, r * 0.45); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, r, 0, TAU * 0.8); g.stroke(); }
    }
    return s;
  }
  function BuildFrame() {
    const s = Cv(CV_W, CV_H, _k), g = s.g;
    const wood = _dark ? ['#5b3a24', '#3d2617', '#7a5236'] : ['#b07a4c', '#8a5a33', '#d19a66'];
    for (const y of [0, CV_H - 5]) {
      const gr = g.createLinearGradient(0, y, 0, y + 5);
      gr.addColorStop(0, wood[2]); gr.addColorStop(1, wood[1]);
      g.fillStyle = gr; g.fillRect(0, y, CV_W, 5);
      g.fillStyle = OUT; g.fillRect(0, y === 0 ? 5 : y - 1, CV_W, 1.2);
    }
    for (let x = 30; x < CV_W; x += 70) { RR(g, x, CV_H - 7, 14, 3.2, 1.4); g.fillStyle = '#fafaf5'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = OUT; g.stroke(); }
    const vg = g.createRadialGradient(CV_W / 2, CV_H / 2, CV_H * 0.35, CV_W / 2, CV_H / 2, CV_H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, _dark ? 'rgba(0,4,10,0.55)' : 'rgba(0,20,10,0.3)');
    g.fillStyle = vg; g.fillRect(0, 0, CV_W, CV_H);
    if (_dark) { g.globalCompositeOperation = 'lighter'; Glow(g, CV_W * 0.5, -10, 170, '#fde68a', 0.14); g.globalCompositeOperation = 'source-over'; }
    return s;
  }

  function RulerArt(g, h, c, ai) {
    const w = 10, x = -w / 2, y = -h / 2;
    g.fillStyle = 'rgba(0,0,0,0.25)'; RR(g, x + 2, y + 2.5, w, h, 3); g.fill();
    RR(g, x, y, w, h, 3); g.fillStyle = c; g.fill();
    g.save(); RR(g, x, y, w, h, 3); g.clip();
    g.fillStyle = Lt(c, 0.45); g.fillRect(x, y, 3, h);
    g.fillStyle = Dk(c, 0.22); g.fillRect(x + w - 3, y, 3, h);
    for (let i = 4; i < h - 2; i += 4) Ln(g, ai ? x + w - 3.6 : x + 0.6, y + i, ai ? x + w - 0.6 : x + (i % 12 === 0 ? 4.4 : 3), y + i, Dk(c, 0.45), 0.8);
    g.restore();
    RR(g, x, y, w, h, 3); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke();
  }
  function EyeWhite(g) { Ell(g, 0, 0, 2.6, 3.1); Fl(g, '#ffffff', 1.1); }

  function OrbArt(g, c, good) {
    Glow(g, 0, 0, 22, c, 0.55);
    if (good) { Star(g, 0, 0, 14, 9.5, 8); Fl(g, '#facc15', 1.5); }
    else { Star(g, 0, 0, 14, 8.5, 10); Fl(g, '#475569', 1.5); }
    Circ(g, 0, 0, 9); Fl(g, c, 1.4);
    Circ(g, 0, 0, 6.6); g.fillStyle = Lt(c, 0.55); g.fill();
    g.beginPath(); g.arc(0, 0, 7.6, Math.PI * 1.1, Math.PI * 1.6); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.4; g.stroke();
  }

  function EffIcon(g, type, col) {
    Circ(g, 0, 0, 7.5); Fl(g, col, 1.4);
    if (type === 'bigSelf' || type === 'smallSelf') {
      const s = type === 'bigSelf' ? 1 : -1;
      Poly(g, [0, -5 * s, -2.8, -2 * s, 2.8, -2 * s]); Fl(g, '#fff', 0.9);
      Poly(g, [0, 5 * s, -2.8, 2 * s, 2.8, 2 * s]); Fl(g, '#fff', 0.9);
      g.fillStyle = '#fff'; g.fillRect(-1, -2, 2, 4);
    } else if (type === 'shrinkOpp') {
      Poly(g, [0, -1, -2.8, -4.4, 2.8, -4.4]); Fl(g, '#fff', 0.9);
      Poly(g, [0, 1, -2.8, 4.4, 2.8, 4.4]); Fl(g, '#fff', 0.9);
    } else if (type === 'slowOpp') {
      Circ(g, 0, 0, 4.2); Fl(g, '#fff', 0.9); Ln(g, 0, 0, 0, -2.6, OUT, 1.1); Ln(g, 0, 0, 2, 0.8, OUT, 1.1);
    } else {
      Poly(g, [1.4, -5, -3, 0.8, -0.2, 0.8, -1.4, 5, 3, -0.8, 0.2, -0.8]); Fl(g, '#fff', 0.9);
    }
  }

  function BuildSprites() {
    const S = { pad: { player: [], ai: [] }, orbG: {}, orbB: {}, eff: {}, chip: {} };
    PH_SET.forEach(h => {
      S.pad.player.push(Night(Spr(16, h + 8, g => RulerArt(g, h, P_GREEN, false))));
      S.pad.ai.push(Night(Spr(16, h + 8, g => RulerArt(g, h, P_RED, true))));
    });
    S.eye = Spr(8, 9, g => EyeWhite(g));
    S.ball = Night(Spr(14, 14, g => {
      Circ(g, 0, 0, BALL_R); Fl(g, '#fbfbf4', 1.4);
      g.save(); Circ(g, 0, 0, BALL_R); g.clip(); Circ(g, 1.8, 2.2, 5); g.fillStyle = '#d7dccf'; g.fill(); g.restore();
      Circ(g, 0, 0, BALL_R); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke();
      Circ(g, -1.7, -1.8, 1.5); g.fillStyle = '#fff'; g.fill();
    }), 0.06);
    S.ballGlow = Spr(40, 40, g => Glow(g, 0, 0, 20, '#f8fafc', _dark ? 0.4 : 0.3));
    S.trail = Spr(12, 12, g => { Circ(g, 0, 0, 5); g.fillStyle = 'rgba(245,250,240,0.9)'; g.fill(); });
    for (const c of COLORS) {
      S.orbG[c] = Night(Spr(46, 46, g => OrbArt(g, c, true)), 0.08);
      S.orbB[c] = Night(Spr(46, 46, g => OrbArt(g, c, false)), 0.08);
    }
    for (const t of EFF_TYPES) {
      S.eff[t] = {};
      for (const c of [P_GREEN, P_RED]) S.eff[t][c] = Spr(18, 18, g => EffIcon(g, t, c));
    }
    S.dust = Spr(14, 14, g => { Circ(g, 0, 0, 5.5); g.fillStyle = 'rgba(240,248,240,0.75)'; g.fill(); });
    S.spark = Spr(18, 18, g => { Glow(g, 0, 0, 9, '#fde047', 0.7); Star(g, 0, 0, 7, 2, 4); Fl(g, '#fef08a', 1); });
    for (const c of [...COLORS, '#f0f8f0']) S.chip[c] = Spr(8, 8, g => { RR(g, -2.4, -2, 4.8, 4, 1); g.fillStyle = c; g.fill(); });
    S.board = BuildBoard();
    S.doodleFar = BuildDoodles(8, 14, 0.9, _dark ? 0.06 : 0.08);
    S.doodleNear = BuildDoodles(15, 7, 1.35, _dark ? 0.09 : 0.11);
    S.frame = BuildFrame();
    S.digit = 'rgba(240,248,240,0.08)';
    _S = S;
  }

  const PN = 150;
  const _P = Array.from({ length: PN }, () => ({ on: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, T: 1, s: 1, ds: 0, r: 0, vr: 0, c: '', c2: '' }));
  let _pi = 0;
  function Part(k, x, y, vx, vy, T, s, c, g = 0, ds = 0, vr = 0) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.T = T; p.t = 0; p.s = s; p.ds = ds; p.c = c; p.c2 = ''; p.g = g; p.r = Math.random() * TAU; p.vr = vr;
    return p;
  }
  function ClearParts() { for (const p of _P) p.on = 0; }
  function Burst(x, y, n, dir, c) {
    for (let i = 0; i < n; i++) {
      const a = (dir == null ? Math.random() * TAU : dir + (Math.random() - 0.5) * 1.6), v = 0.04 + Math.random() * 0.12;
      Part(2, x, y, Math.cos(a) * v, Math.sin(a) * v, 260 + Math.random() * 200, 0.35 + Math.random() * 0.35, '', 0, -0.0012);
    }
    if (c) for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 0.03 + Math.random() * 0.1; Part(1, x, y, Math.cos(a) * v, Math.sin(a) * v, 500 + Math.random() * 300, 1, c, 0.0002, 0, (Math.random() - 0.5) * 0.03); }
  }

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    return {
      lvl,
      status: 'start',
      _bossHidden: false,

      playerY: CV_H / 2,
      aiY: CV_H / 2,
      playerH: PADDLE_H,
      aiH: PADDLE_H,
      playerSpeed: 5,
      pVH: PADDLE_H, aVH: PADDLE_H,
      pBump: 0, aBump: 0,
      pPrev: CV_H / 2, aPrev: CV_H / 2,

      ballX: CV_W / 2, ballY: CV_H / 2,
      ballVX: 0, ballVY: 0,
      ballSpeed: BALL_INIT,
      tr: new Float32Array(TRAIL_N * 2), tn: 0, ti: 0,

      playerScore: 0,
      aiScore: 0,
      totalHits: 0,

      orb: null,
      orbTimer: 0,

      effects: [],

      servePause: 0,
      queuedServe: null,

      shake: 0,
      scoreFlash: null,
      t: 0,
      pStr: '0', aStr: '0',
    };
  }

  function LaunchBall(gs, towardsPlayer) {
    const angle = (Math.random() * 0.8 - 0.4);
    const dir = towardsPlayer ? -1 : 1;
    gs.ballX = CV_W / 2;
    gs.ballY = CV_H / 2;
    gs.ballSpeed = BALL_INIT;
    gs.ballVX = Math.cos(angle) * gs.ballSpeed * dir;
    gs.ballVY = Math.sin(angle) * gs.ballSpeed;
    gs.tn = 0;
    gs.servePause = 0;
    gs.queuedServe = null;
  }

  function QueueServe(gs, towardsPlayer) {
    const angle = (Math.random() * 0.8 - 0.4);
    const dir = towardsPlayer ? -1 : 1;
    gs.ballX = CV_W / 2;
    gs.ballY = CV_H / 2;
    gs.ballSpeed = BALL_INIT;
    gs.ballVX = 0;
    gs.ballVY = 0;
    gs.tn = 0;
    gs.queuedServe = {
      vx: Math.cos(angle) * BALL_INIT * dir,
      vy: Math.sin(angle) * BALL_INIT,
    };
    gs.servePause = 750;
  }

  function ApplyEffect(gs, grade, owner) {
    const good = IsPositive(grade);
    if (!owner) owner = Math.random() < 0.5 ? 'player' : 'ai';

    let type;
    if (good) {
      type = ['bigSelf', 'shrinkOpp', 'slowOpp'][0 | Math.random() * 3];
    } else {
      type = ['smallSelf', 'fastOpp'][0 | Math.random() * 2];
    }

    gs.effects = gs.effects.filter(e => !(e.type === type && e.owner === owner));
    gs.effects.push({ type, owner, grade, start: performance.now(), dur: EFFECT_DUR });
    RecalcEffects(gs);
  }

  function RecalcEffects(gs) {
    let pH = PADDLE_H, aH = PADDLE_H;
    let aiMult = 1, plMult = 1;
    const now = performance.now();
    if (gs.effects.length && gs.effects.some(e => now - e.start >= e.dur)) gs.effects = gs.effects.filter(e => now - e.start < e.dur);
    for (const e of gs.effects) {
      const sIsPlayer = e.owner === 'player';
      switch (e.type) {
        case 'bigSelf':    if (sIsPlayer) pH = PADDLE_H * 1.5; else aH = PADDLE_H * 1.5; break;
        case 'shrinkOpp':  if (sIsPlayer) aH = PADDLE_H * 0.6; else pH = PADDLE_H * 0.6; break;
        case 'slowOpp':    if (sIsPlayer) aiMult = 0.5;        else plMult = 0.5;        break;
        case 'smallSelf':  if (sIsPlayer) pH = PADDLE_H * 0.6; else aH = PADDLE_H * 0.6; break;
        case 'fastOpp':    if (sIsPlayer) aiMult = 1.5;        else plMult = 1.5;        break;
      }
    }
    gs.playerH = pH;
    gs.aiH = aH;
    gs._aiSpeedMult     = aiMult;
    gs._playerSpeedMult = plMult;
  }

  function SpawnOrb(gs) {
    const g = PickGrade();
    gs.orb = {
      x: CV_W * 0.10 + Math.random() * CV_W * 0.80,
      y: CV_H * 0.15 + Math.random() * CV_H * 0.70,
      grade: g,
      color: GradeColor(g.Pct),
      born: performance.now(),
      lbl: g.Pct != null ? `${Math.round(g.Pct)}%` : '?',
      good: IsPositive(g),
    };
  }

  function Update(gs, dt) {
    if (gs.status !== 'playing') return;

    RecalcEffects(gs);

    gs.orbTimer += dt;
    if (!gs.orb && gs.orbTimer > ORB_INTERVAL) {
      SpawnOrb(gs);
      gs.orbTimer = 0;
      Burst(gs.orb.x, gs.orb.y, 6, null, null);
    }

    const stepScale = dt / 16.6667;
    gs.ballX += gs.ballVX * stepScale;
    gs.ballY += gs.ballVY * stepScale;

    if (gs.ballY - BALL_R <= 0) {
      gs.ballY = BALL_R;
      gs.ballVY = Math.abs(gs.ballVY);
      Part(0, gs.ballX, 4, gs.ballVX * 0.01, 0.01, 300, 0.45, '', 0, 0.0014);
    }
    if (gs.ballY + BALL_R >= CV_H) {
      gs.ballY = CV_H - BALL_R;
      gs.ballVY = -Math.abs(gs.ballVY);
      Part(0, gs.ballX, CV_H - 4, gs.ballVX * 0.01, -0.01, 300, 0.45, '', 0, 0.0014);
    }

    const pTop = gs.playerY - gs.playerH / 2;
    const pBot = gs.playerY + gs.playerH / 2;
    if (gs.ballVX < 0 &&
        gs.ballX - BALL_R <= WALL_PAD + PADDLE_W &&
        gs.ballX - BALL_R >= WALL_PAD - 2 &&
        gs.ballY >= pTop - BALL_R && gs.ballY <= pBot + BALL_R) {
      gs.ballX = WALL_PAD + PADDLE_W + BALL_R;
      const relY = (gs.ballY - gs.playerY) / (gs.playerH / 2);
      const angle = relY * (Math.PI / 4);
      gs.ballSpeed = Math.min(BALL_MAX, gs.ballSpeed + BALL_RAMP);
      gs.ballVX =  Math.cos(angle) * gs.ballSpeed;
      gs.ballVY =  Math.sin(angle) * gs.ballSpeed;
      gs.totalHits++;
      gs.lastHit = 'player';
      gs.pBump = 1;
      Burst(WALL_PAD + PADDLE_W + 1, gs.ballY, 5, 0, null);
      if (gs.ballSpeed > 4) gs.shake = Math.max(gs.shake, 1.5);
    }

    const aTop = gs.aiY - gs.aiH / 2;
    const aBot = gs.aiY + gs.aiH / 2;
    if (gs.ballVX > 0 &&
        gs.ballX + BALL_R >= CV_W - WALL_PAD - PADDLE_W &&
        gs.ballX + BALL_R <= CV_W - WALL_PAD + 2 &&
        gs.ballY >= aTop - BALL_R && gs.ballY <= aBot + BALL_R) {
      gs.ballX = CV_W - WALL_PAD - PADDLE_W - BALL_R;
      const relY = (gs.ballY - gs.aiY) / (gs.aiH / 2);
      const angle = relY * (Math.PI / 4);
      gs.ballSpeed = Math.min(BALL_MAX, gs.ballSpeed + BALL_RAMP);
      gs.ballVX = -Math.cos(angle) * gs.ballSpeed;
      gs.ballVY =  Math.sin(angle) * gs.ballSpeed;
      gs.totalHits++;
      gs.lastHit = 'ai';
      gs.aBump = 1;
      Burst(CV_W - WALL_PAD - PADDLE_W - 1, gs.ballY, 5, Math.PI, null);
      if (gs.ballSpeed > 4) gs.shake = Math.max(gs.shake, 1.5);
    }

    if (gs.orb) {
      const dx = gs.ballX - gs.orb.x, dy = gs.ballY - gs.orb.y;
      if (dx * dx + dy * dy < (BALL_R + ORB_R) * (BALL_R + ORB_R)) {
        ApplyEffect(gs, gs.orb.grade, gs.lastHit);
        Burst(gs.orb.x, gs.orb.y, 10, null, gs.orb.color);
        const p = Part(3, gs.orb.x, gs.orb.y - 12, 0, -0.035, 800, 1, gs.orb.lbl);
        p.c2 = gs.orb.color;
        gs.orb = null;
        gs.orbTimer = 0;
      }
    }

    if (gs.servePause > 0) {
      gs.servePause = Math.max(0, gs.servePause - dt);
      if (gs.servePause === 0 && gs.queuedServe) {
        gs.ballVX = gs.queuedServe.vx;
        gs.ballVY = gs.queuedServe.vy;
        gs.queuedServe = null;
      }
    }

    if (gs.servePause === 0 && gs.ballX < -BALL_R * 2) {
      gs.aiScore++;
      Goal(gs, 'ai');
      if (CheckWin(gs)) return;
      QueueServe(gs, true);
    }
    else if (gs.servePause === 0 && gs.ballX > CV_W + BALL_R * 2) {
      gs.playerScore++;
      Goal(gs, 'player');
      if (CheckWin(gs)) return;
      QueueServe(gs, false);
    }

    const aiReact = gs.lvl.aiReact;
    const aiSpd   = gs.lvl.aiSpeed * (gs._aiSpeedMult || 1);
    const aiMiss  = gs.lvl.aiMiss;
    const aiTrack = gs.lvl.aiTrack;

    gs._aiThinkT = (gs._aiThinkT || 0) - dt;
    if (gs._aiThinkT <= 0) {
      gs._aiThinkT = 90 + Math.random() * 80;
      const ballApproaching = gs.ballVX > 0;
      if (ballApproaching && Math.random() < aiTrack) {
        const wobble = Math.sin(performance.now() * 0.003) * aiMiss * 0.6;
        const jitter = (Math.random() - 0.5) * aiMiss * 1.6;
        gs._aiTarget = gs.ballY + wobble + jitter;
      } else {
        gs._aiTarget = CV_H / 2 + (Math.random() - 0.5) * 30;
      }
    }

    const stepScaleAI = dt / 16.6667;
    const diff = (gs._aiTarget ?? CV_H / 2) - gs.aiY;
    if (Math.abs(diff) > 3) {
      gs.aiY += Math.sign(diff) * Math.min(Math.abs(diff) * aiReact, aiSpd) * stepScaleAI;
    }
    gs.aiY = Math.max(gs.aiH / 2, Math.min(CV_H - gs.aiH / 2, gs.aiY));
  }

  function Goal(gs, side) {
    gs.shake = 5;
    gs.scoreFlash = { side, t: performance.now() };
    gs.pStr = String(gs.playerScore); gs.aStr = String(gs.aiScore);
    const x = side === 'ai' ? 4 : CV_W - 4, y = Math.max(10, Math.min(CV_H - 10, gs.ballY));
    for (let i = 0; i < 14; i++) {
      const a = (side === 'ai' ? 0 : Math.PI) + (Math.random() - 0.5) * 2.4, v = 0.04 + Math.random() * 0.14;
      Part(i % 2 ? 0 : 1, x, y, Math.cos(a) * v, Math.sin(a) * v, 500 + Math.random() * 400, i % 2 ? 0.7 : 1, side === 'player' ? P_GREEN : P_RED, i % 2 ? 0 : 0.0002, i % 2 ? 0.0012 : 0, (Math.random() - 0.5) * 0.03);
    }
  }

  function CheckWin(gs) {
    const winScore = gs.lvl.winScore;
    if (gs.playerScore >= winScore) {
      gs.status = 'win';
      SaveScore(gs.lvl.id, gs.playerScore);
      if (!gs.lvl.freePlay) SaveUnlock(gs.lvl.id);
      ShowScreen('gf-pos-win');
      SetText('gf-po-win-title', gs.lvl.freePlay
        ? _GameText('game_gameover')
        : `Lv ${gs.lvl.id} - ${_GameText('po_round_won')}`);
      SetText('gf-po-win-score', `${gs.playerScore} - ${gs.aiScore}`);
      const nextBtn = document.getElementById('gf-po-next');
      if (nextBtn) {
        const hasNext = gs.lvl.id < 5;
        nextBtn.style.display = hasNext ? 'block' : 'none';
      }
      const modsBtn = document.getElementById('gf-po-free-btn');
      if (modsBtn) modsBtn.style.display = LoadUnlock() >= 5 ? 'block' : 'none';
      for (let i = 0; i < 24; i++) { const a = Math.random() * TAU, v = 0.05 + Math.random() * 0.12; Part(1, CV_W / 2, CV_H * 0.4, Math.cos(a) * v, Math.sin(a) * v - 0.08, 1200 + Math.random() * 500, 1.2, COLORS[i % 4], 0.00022, 0, (Math.random() - 0.5) * 0.02); }
      Draw();
      return true;
    }
    if (gs.aiScore >= winScore) {
      gs.status = 'gameover';
      ShowScreen('gf-pos-gameover');
      SetText('gf-po-go-score', `${gs.playerScore} - ${gs.aiScore}`);
      Draw();
      return true;
    }
    if (gs.lvl.freePlay && gs.aiScore >= 5) {
      gs.status = 'gameover';
      SaveScore(gs.lvl.id, gs.playerScore);
      ShowScreen('gf-pos-gameover');
      SetText('gf-po-go-score', `${gs.playerScore} - ${gs.aiScore}`);
      Draw();
      return true;
    }
    return false;
  }

  function Step(dt) {
    const gs = GS;
    gs.t += dt;
    gs.pPrev = gs.playerY; gs.aPrev = gs.aiY;
    if (gs.status === 'playing') {
      UpdatePlayerPaddle(dt);
      Update(gs, dt);
      gs.tr[gs.ti * 2] = gs.ballX; gs.tr[gs.ti * 2 + 1] = gs.ballY;
      gs.ti = (gs.ti + 1) % TRAIL_N;
      if (gs.tn < TRAIL_N) gs.tn++;
      if (gs.servePause > 0) gs.tn = 0;
    } else if (gs.status === 'start') {
      gs.playerY = CV_H / 2 + Math.sin(gs.t * 0.0016) * 40;
      gs.aiY = CV_H / 2 + Math.sin(gs.t * 0.0016 + 2) * 40;
      gs.ballX = CV_W / 2 + Math.sin(gs.t * 0.0011) * 90;
      gs.ballY = CV_H / 2 + Math.sin(gs.t * 0.0023) * 70;
    }
    const f = Math.min(1, dt * 0.012);
    gs.pVH += (gs.playerH - gs.pVH) * f;
    gs.aVH += (gs.aiH - gs.aVH) * f;
    if (gs.pBump > 0) gs.pBump = Math.max(0, gs.pBump - dt * 0.006);
    if (gs.aBump > 0) gs.aBump = Math.max(0, gs.aBump - dt * 0.006);
    for (let i = 0; i < PN; i++) {
      const p = _P[i];
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.T) { p.on = 0; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.r += p.vr * dt; p.s += p.ds * dt;
    }
    if (gs.shake > 0) gs.shake = Math.max(0, gs.shake - dt * 0.018);
  }

  function DrawTileH(s, off, y) {
    let x = -(off % s.w);
    if (x > -8) x -= s.w;
    while (x < CV_W + 8) { _ctx.drawImage(s.c, x, y, s.w, s.h); x += s.w; }
  }
  function Outlined(txt, x, y, font, col, lw) {
    const c = _ctx;
    c.font = font; c.lineWidth = lw; c.strokeStyle = OUT; c.lineJoin = 'round';
    c.strokeText(txt, x, y);
    c.fillStyle = col; c.fillText(txt, x, y);
  }

  function PadIdx(h) { return h < PADDLE_H * 0.8 ? 0 : h > PADDLE_H * 1.25 ? 2 : 1; }

  const EYES = [-2.3, 2.3];
  function DrawPaddle(side, cy, vh, bump, prev) {
    const c = _ctx, S = _S, ai = side === 'ai';
    const x = ai ? CV_W - WALL_PAD - PADDLE_W / 2 : WALL_PAD + PADDLE_W / 2;
    const set = ai ? S.pad.ai : S.pad.player, spr = set[PadIdx(vh)];
    const base = PH_SET[PadIdx(vh)];
    const sy = vh / base, sx = 1 + bump * 0.35;
    const mv = cy - prev;
    if (Math.abs(mv) > 1.2) {
      c.globalAlpha = Math.min(0.35, Math.abs(mv) * 0.06);
      BlitT(spr, x, cy - mv * 2.2, 0, 1, sy);
      c.globalAlpha = 1;
    }
    BlitT(spr, x + (ai ? 1 : -1) * bump * 1.5, cy, 0, sx, sy);
    const ey = cy - vh / 2 + 9, dx = GS.ballX - x, dy = GS.ballY - ey, d = Math.hypot(dx, dy) || 1;
    const blink = (GS.t + (ai ? 1700 : 0)) % 3400 < 110;
    for (const ex of EYES) {
      if (blink) { c.fillStyle = OUT; c.fillRect(x + ex - 2.2, ey - 0.6, 4.4, 1.3); continue; }
      Blit(S.eye, x + ex, ey);
      c.fillStyle = OUT;
      c.beginPath(); c.arc(x + ex + dx / d * 1.1, ey + dy / d * 1.4, 1.3, 0, TAU); c.fill();
    }
    if (ai) { c.strokeStyle = OUT; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 4, ey - 4.5); c.lineTo(x - 0.8, ey - 3); c.moveTo(x + 4, ey - 4.5); c.lineTo(x + 0.8, ey - 3); c.stroke(); }
  }

  function Draw() {
    if (!_ctx || !GS || !_S) return;
    const c = _ctx, S = _S, gs = GS, now = performance.now();
    const sh = gs.shake;
    _ox = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    _oy = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    Base();

    c.drawImage(S.board.c, -8, -8, CV_W + 16, CV_H + 16);
    const px = (gs.ballX - CV_W / 2) / CV_W, py = (gs.ballY - CV_H / 2) / CV_H;
    DrawTileH(S.doodleFar, gs.t * 0.004 - px * 8, -py * 5);
    c.font = F_BIG; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = S.digit;
    c.fillText(gs.pStr, CV_W * 0.25 - px * 4, CV_H / 2 - py * 3);
    c.fillText(gs.aStr, CV_W * 0.75 - px * 4, CV_H / 2 - py * 3);

    if (gs.scoreFlash) {
      const elapsed = now - gs.scoreFlash.t;
      if (elapsed < 450) {
        const alpha = (1 - elapsed / 450) * 0.22;
        c.fillStyle = gs.scoreFlash.side === 'player' ? `rgba(74,222,128,${alpha})` : `rgba(248,113,113,${alpha})`;
        c.fillRect(gs.scoreFlash.side === 'player' ? CV_W / 2 : -8, -8, CV_W / 2 + 8, CV_H + 16);
      } else gs.scoreFlash = null;
    }

    DrawTileH(S.doodleNear, gs.t * 0.009 - px * 18, -py * 10);

    if (gs.orb) {
      const o = gs.orb, age = now - o.born;
      const pop = Math.min(1, age / 260), pulse = (0.92 + 0.08 * Math.sin(age / 400 * TAU)) * (pop < 1 ? 1.25 * pop - 0.25 * pop * pop : 1);
      BlitT(o.good ? S.orbG[o.color] : S.orbB[o.color], o.x, o.y, age * 0.0012 * (o.good ? 1 : -1), pulse, pulse);
      c.font = F_ORB; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = OUT; c.fillText(o.lbl, o.x, o.y + 0.5);
    }

    DrawPaddle('player', gs.playerY, gs.pVH, gs.pBump, gs.pPrev);
    DrawPaddle('ai', gs.aiY, gs.aVH, gs.aBump, gs.aPrev);

    for (let i = 0; i < gs.tn; i++) {
      const j = (gs.ti - 1 - i + TRAIL_N * 2) % TRAIL_N, f = 1 - (i + 1) / (gs.tn + 1);
      c.globalAlpha = f * 0.4;
      BlitT(S.trail, gs.tr[j * 2], gs.tr[j * 2 + 1], 0, f * 0.9, f * 0.9);
    }
    c.globalAlpha = 1;
    const sp = Math.hypot(gs.ballVX, gs.ballVY);
    if (gs.status === 'playing' && gs.servePause > 0) {
      const u = gs.servePause / 750;
      c.beginPath(); c.arc(gs.ballX, gs.ballY, 9 + u * 6, -Math.PI / 2, -Math.PI / 2 + u * TAU);
      c.strokeStyle = 'rgba(240,248,240,0.7)'; c.lineWidth = 2; c.stroke();
    }
    Blit(S.ballGlow, gs.ballX, gs.ballY);
    if (sp > 0.1) {
      const st = Math.min(0.3, sp * 0.045);
      BlitT(S.ball, gs.ballX, gs.ballY, Math.atan2(gs.ballVY, gs.ballVX), 1 + st, 1 - st * 0.6);
    } else Blit(S.ball, gs.ballX, gs.ballY);

    for (let i = 0; i < PN; i++) {
      const p = _P[i];
      if (!p.on) continue;
      const a = 1 - p.t / p.T;
      if (p.k === 0) { c.globalAlpha = a * 0.8; BlitT(S.dust, p.x, p.y, 0, p.s, p.s); }
      else if (p.k === 1) { c.globalAlpha = Math.min(1, a * 2); BlitT(S.chip[p.c] || S.chip['#f0f8f0'], p.x, p.y, p.r, 1, 1); }
      else if (p.k === 2) { c.globalAlpha = a; BlitT(S.spark, p.x, p.y, p.r, Math.max(0.05, p.s), Math.max(0.05, p.s)); }
      else {
        c.globalAlpha = Math.min(1, a * 2.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const z = (1 + (1 - Math.min(1, p.t / 110)) * 0.4) * _k;
        c.setTransform(z, 0, 0, z, (p.x + _ox) * _k, (p.y + _oy) * _k);
        Outlined(p.c, 0, 0, F_POP, p.c2 || '#fff', 3.5);
        Base();
      }
    }
    c.globalAlpha = 1;

    c.drawImage(S.frame.c, 0, 0, CV_W, CV_H);

    let lx = 16, rx = CV_W - 16;
    for (const e of gs.effects) {
      const rem = 1 - (now - e.start) / e.dur;
      if (rem <= 0) continue;
      const left = e.owner === 'player', col = IsPositive(e.grade) ? P_GREEN : P_RED;
      const x = left ? lx : rx;
      Blit(S.eff[e.type][left ? P_GREEN : P_RED], x, 18);
      c.beginPath(); c.arc(x, 18, 10, -Math.PI / 2, -Math.PI / 2 + rem * TAU); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
      if (left) lx += 24; else rx -= 24;
    }

    UpdateHUD();
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
  function AnyFx() { if (GS.shake > 0) return true; for (let i = 0; i < PN; i++) if (_P[i].on) return true; return false; }
  function StartLoop() { StopLoop(); _last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!GS) return;
    if (_hud.p !== GS.playerScore) { _hud.p = GS.playerScore; SetText('gf-po-pscore', GS.playerScore); }
    if (_hud.a !== GS.aiScore) { _hud.a = GS.aiScore; SetText('gf-po-ascore', GS.aiScore); }
    const lv = GS.lvl.freePlay ? '∞' : `Lv ${GS.lvl.id}`;
    if (_hud.lvl !== lv) { _hud.lvl = lv; SetText('gf-po-level', lv); }
  }

  const SCREEN_IDS = ['gf-pos-start','gf-pos-pause','gf-pos-gameover','gf-pos-win'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  let _keysDown = {};

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-po') || _root.style.display === 'none') return;

    if (e.type === 'keydown') _keysDown[e.key] = true;
    if (e.type === 'keyup')   delete _keysDown[e.key];

    if (e.type !== 'keydown') return;

    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradePong();
      return;
    }
    if (e.key === 'p' || e.key === 'P') { if (GS.status === 'playing' || GS.status === 'paused') { e.preventDefault(); DoPause(); } return; }
    if (e.key === 'r' || e.key === 'R') { if (GS.status !== 'start') { e.preventDefault(); DoStart(); } return; }
    if (['ArrowUp','ArrowDown','w','W','s','S'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
    }

    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (GS.status === 'start' || GS.status === 'gameover') DoStart();
        else if (GS.status === 'paused') DoPause();
      }
    }
  }

  function UpdatePlayerPaddle(dt) {
    if (!GS || GS.status !== 'playing') return;
    const stepScale = dt / 16.6667;
    const mult = GS._playerSpeedMult || 1;
    const speed = (GS.playerSpeed || 5) / mult * stepScale;
    if (_keysDown['ArrowUp']   || _keysDown['w'] || _keysDown['W']) GS.playerY -= speed;
    if (_keysDown['ArrowDown'] || _keysDown['s'] || _keysDown['S']) GS.playerY += speed;
    GS.playerY = Math.max(GS.playerH / 2, Math.min(CV_H - GS.playerH / 2, GS.playerY));
  }

  function AttachKeys() {
    document.addEventListener('keydown', OnKey, true);
    document.addEventListener('keyup', OnKey, true);
    window.addEventListener('blur', _ClearKeys);
  }
  function DetachKeys() {
    document.removeEventListener('keydown', OnKey, true);
    document.removeEventListener('keyup', OnKey, true);
    window.removeEventListener('blur', _ClearKeys);
    _ClearKeys();
  }
  function _ClearKeys() { _keysDown = {}; }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function DoStart() {
    StopLoop();
    ClearParts();
    GS = NewGameState(_lvlId);
    GS.status = 'playing';
    LaunchBall(GS, false);
    ShowScreen(null);
    UpdateHUD();
    Draw();
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-pos-pause'); Draw();
    } else if (GS.status === 'paused') {
      GS.status = 'playing';
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    StopLoop();
    ClearParts();
    GS = NewGameState(_lvlId);
    BuildLevelSelect();
    Draw();
    ShowScreen('gf-pos-start');
    StartLoop();
  }

  function BuildLevelSelect() {
    const el = document.getElementById('gf-po-lvl-sel');
    if (!el) return;
    const unlocked = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const nm = l.freePlay ? '∞' : `L${l.id}`;
      const desc = l.freePlay
        ? _GameText('po_freeplay_label')
        : _GameText('po_first_to').replace('{n}', l.winScore);
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts}` : '–';
      const pips = l.freePlay ? '' : Array.from({ length: 5 }, (_, i) => `<i class="${i < l.id ? 'on' : ''}"></i>`).join('');
      return `<button class="gf-pol${avail ? '' : ' gf-pol-locked'}${l.id === _lvlId ? ' gf-pol-sel' : ''}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-pol-left">
          <div class="gf-pol-badge${l.freePlay ? ' gf-pol-badge-fp' : ''}">${nm}</div>
          <div class="gf-pol-info">
            <span class="gf-pol-name">${_GameText(l.labelKey)}</span>
            <span class="gf-pol-tgt">${desc}</span>
          </div>
        </div>
        <div class="gf-pol-right">
          <span class="gf-pol-pips">${pips}</span>
          ${avail ? `<span class="gf-pol-best">${bestTxt}</span>` : '<span class="gf-pol-lock"></span>'}
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

  function ApplyTheme() {
    const el = document.getElementById('gf-po');
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
    const s = Math.max(0.6, Math.min(1.5, (innerWidth - 34 - SIDE_W) / CV_W, (innerHeight - 34 - HDR_H - BAR_H) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(CV_W * s), h = Math.round(CV_H * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    _root.style.setProperty('--po-board-h', `${h + BAR_H}px`);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (_cv.width !== bw || _cv.height !== bh || !_S) {
      _cv.width = bw; _cv.height = bh;
      _k = bw / CV_W;
      BuildSprites();
    }
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-po')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-po';
    const arc = window.GfKeys ? GfKeys.label('arcade') : 'F8';
    root.innerHTML = `
<div id="gf-po-modal">
  <div id="gf-po-hdr">
    <div class="gf-po-hl">
      <div id="gf-po-logo">GP</div>
      <span id="gf-po-title">GradePong</span>
    </div>
    <div class="gf-po-hr">
      <span id="gf-po-hint">${arc}</span>
      <button id="gf-po-pause-btn" title="${_GameText('game_pause_p')}">&#9208;</button>
      <button id="gf-po-close" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-po-body">
    <div id="gf-po-board">
      <div id="gf-po-hud-bar">
        <div class="gf-po-hud-side">
          <i class="gf-po-dot" style="background:${P_GREEN}"></i>
          <span class="gf-po-hud-label">${_GameText('po_you')}</span>
          <span id="gf-po-pscore" class="gf-po-hud-score">0</span>
        </div>
        <div id="gf-po-level" class="gf-po-hud-lvl">Lv 1</div>
        <div class="gf-po-hud-side gf-po-hud-r">
          <span id="gf-po-ascore" class="gf-po-hud-score">0</span>
          <span class="gf-po-hud-label">${_GameText('po_ai')}</span>
          <i class="gf-po-dot" style="background:${P_RED}"></i>
        </div>
      </div>
      <div id="gf-po-view"><canvas id="gf-po-canvas" width="${CV_W}" height="${CV_H}"></canvas></div>
    </div>
    <div id="gf-po-sidebar">
      <div class="gf-pop">
        <div class="gf-pop-label">${_GameText('po_grade_effects')}</div>
        <div class="gf-po-eff-row"><span><i style="background:#4ade80"></i>&#8805;75%</span><span>${_GameText('po_big_paddle')}</span></div>
        <div class="gf-po-eff-row"><span><i style="background:#a3e635"></i>50&#8211;74%</span><span>${_GameText('po_slow_ai')}</span></div>
        <div class="gf-po-eff-row"><span><i style="background:#f97316"></i>25&#8211;49%</span><span>${_GameText('po_small_paddle')}</span></div>
        <div class="gf-po-eff-row"><span><i style="background:#f87171"></i>&lt;25%</span><span>${_GameText('po_fast_ai')}</span></div>
      </div>
      <div class="gf-pop">
        <div class="gf-pop-label">${_GameText('po_controls')}</div>
        <div class="gf-po-ctrl-row"><kbd>&#8593; &#8595;</kbd><span>${_GameText('po_move')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>W / S</kbd><span>${_GameText('po_move')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>P / Esc</kbd><span>${_GameText('po_pause')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>R</kbd><span>${_GameText('po_restart')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>${arc}</kbd><span>${_GameText('po_boss')}</span></div>
      </div>
      <div class="gf-pop gf-po-tip">${_GameText('po_orb_tip')}</div>
    </div>

    <div id="gf-pos-start" class="gf-pos gf-pos-glass">
      <div class="gf-pos-card gf-pos-start-card">
        <div class="gf-pos-start-hdr">
          <div class="gf-pos-logo">${_GameText('po_title')}</div>
          <div class="gf-pos-sub">${_GameText('po_subtitle')}</div>
        </div>
        <div id="gf-po-lvl-sel" class="gf-po-lvls"></div>
        <div class="gf-pos-footer">${_GameText('po_move')} &middot; ${_GameText('po_pause')}</div>
      </div>
    </div>

    <div id="gf-pos-pause" class="gf-pos gf-pos-dim" style="display:none">
      <div class="gf-pos-card">
        <div class="gf-pos-h">${_GameText('game_paused')}</div>
        <button class="gf-po-btn" id="gf-po-resume">&#9654;&nbsp; ${_GameText('game_resume')}</button>
        <div class="gf-pos-footer">${_GameText('po_pause_hint')}</div>
      </div>
    </div>

    <div id="gf-pos-gameover" class="gf-pos gf-pos-dim" style="display:none">
      <div class="gf-pos-go-title">${_GameText('game_gameover')}</div>
      <div id="gf-po-go-score" class="gf-pos-stat"></div>
      <div class="gf-pos-row">
        <button class="gf-po-btn" id="gf-po-retry">&#8634;&nbsp; ${_GameText('game_try_again')}</button>
        <button class="gf-po-btn gf-po-btn-sec" id="gf-po-back-go">&#8592; ${_GameText('game_levels')}</button>
      </div>
    </div>

    <div id="gf-pos-win" class="gf-pos gf-pos-dim" style="display:none">
      <div class="gf-pos-card">
        <div id="gf-po-win-title" class="gf-pos-win-title">${_GameText('game_snake_level_clear')}</div>
        <div id="gf-po-win-score" class="gf-pos-stat"></div>
        <button class="gf-po-btn" id="gf-po-next">&#8594;&nbsp; ${_GameText('game_snake_next_level')}</button>
        <button class="gf-po-btn gf-po-btn-sec" id="gf-po-free-btn" style="display:none">&#8734;&nbsp; ${_GameText('game_snake_free_play')}</button>
        <button class="gf-po-btn gf-po-btn-sec" id="gf-po-back-win">&#8592; ${_GameText('game_levels')}</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _view = document.getElementById('gf-po-view');
    _cv = document.getElementById('gf-po-canvas');
    _ctx = _cv.getContext('2d');
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-po-close')     ?.addEventListener('click', CloseGradePong);
    document.getElementById('gf-po-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-po-resume')    ?.addEventListener('click', DoPause);
    document.getElementById('gf-po-retry')     ?.addEventListener('click', DoStart);
    document.getElementById('gf-po-back-go')   ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-po-back-win')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-po-next')      ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-po-free-btn')  ?.addEventListener('click', () => { _lvlId = 6; DoStart(); });
    document.getElementById('gf-po')           ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-po') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyPong();
      else CloseGradePong();
    });

    _cv.addEventListener('touchmove', e => {
      if (!GS || GS.status !== 'playing' || !e.touches.length) return;
      const rect = _cv.getBoundingClientRect();
      const ty = (e.touches[0].clientY - rect.top) * (CV_H / rect.height);
      GS.playerY = Math.max(GS.playerH / 2, Math.min(CV_H - GS.playerH / 2, ty));
    }, { passive: true });
    _cv.addEventListener('mousemove', e => {
      if (!GS || GS.status !== 'playing') return;
      const rect = _cv.getBoundingClientRect();
      const my = (e.clientY - rect.top) * (CV_H / rect.height);
      GS.playerY = Math.max(GS.playerH / 2, Math.min(CV_H - GS.playerH / 2, my));
    });
  }

  function OpenGradePong(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-po')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    Fit();
    ShowStartScreen();
  }

  function CloseGradePong() {
    const el = document.getElementById('gf-po');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    DetachKeys();
    _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function ToggleGradePong(grades) {
    const el = document.getElementById('gf-po');
    if (el && el.style.display !== 'none') CloseGradePong(); else OpenGradePong(grades);
  }

  function BossKeyPong() {
    const el = document.getElementById('gf-po');
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

  W.OpenGradePong   = OpenGradePong;
  W.CloseGradePong  = CloseGradePong;
  W.ToggleGradePong = ToggleGradePong;
  W.BossKeyPong     = BossKeyPong;

  function InjectCSS() {
    if (document.getElementById('gf-pong-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-pong-css';
    const ol = OUT;
    s.textContent = `
#gf-po {
  --po-modal:#ffffff;--po-hdr:#f5f7f6;--po-hud:#fafbfa;--po-scr:rgba(250,251,250,0.95);
  --po-brd:rgba(74,222,128,0.26);--po-brd2:#e2e6e3;--po-btn-brd:#d0d5d2;
  --po-txt:#111;--po-txt2:#4b5563;--po-txt3:#8b939c;--po-kbd:#eef0ee;--po-kbd-brd:#ccd2ce;
  --po-scroll:#d0d0d0;--po-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-po[data-theme="dark"] {
  --po-modal:rgba(13,14,18,0.97);--po-hdr:rgba(8,9,12,0.95);--po-hud:rgba(10,11,15,0.98);
  --po-scr:rgba(10,16,20,0.93);--po-brd:rgba(74,222,128,0.2);--po-brd2:#1e2128;
  --po-btn-brd:#343842;--po-txt:#f5f5f5;--po-txt2:#cbd5e1;--po-txt3:#8a94a6;
  --po-kbd:#1e2026;--po-kbd-brd:#343842;--po-scroll:#2a2a2a;
  --po-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-po{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-po *{box-sizing:border-box;}
#gf-po-modal{position:relative;display:flex;flex-direction:column;background:var(--po-modal);border:1px solid var(--po-brd);border-radius:12px;box-shadow:var(--po-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-po-hdr{display:flex;align-items:center;justify-content:space-between;height:${HDR_H}px;padding:0 14px;background:var(--po-hdr);border-bottom:1px solid var(--po-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-po-hl{display:flex;align-items:center;gap:8px;} .gf-po-hr{display:flex;align-items:center;gap:6px;}
#gf-po-logo{width:26px;height:26px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-po-title{font-size:14px;font-weight:700;color:var(--po-txt);letter-spacing:-0.3px;}
#gf-po-hint{font-size:9px;color:var(--po-txt3);}
#gf-po-pause-btn,#gf-po-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--po-btn-brd);border-radius:6px;background:transparent;color:var(--po-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-po-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-po-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-po-body{display:flex;position:relative;overflow:hidden;}
#gf-po-board{flex-shrink:0;border-right:1px solid var(--po-brd);display:flex;flex-direction:column;}
#gf-po-hud-bar{display:flex;align-items:center;justify-content:space-between;height:${BAR_H}px;padding:0 12px;background:var(--po-hdr);border-bottom:1px solid var(--po-brd);user-select:none;}
.gf-po-hud-side{display:flex;align-items:center;gap:7px;}
.gf-po-dot{width:12px;height:12px;border-radius:50%;border:2px solid ${ol};}
.gf-po-hud-label{font-size:9px;font-weight:800;letter-spacing:1.4px;color:var(--po-txt3);text-transform:uppercase;}
.gf-po-hud-score{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:24px;font-weight:900;color:var(--po-txt);line-height:1;font-variant-numeric:tabular-nums;min-width:18px;text-align:center;}
.gf-po-hud-lvl{font-size:10px;font-weight:800;color:var(--po-txt2);padding:3px 10px;border:1px solid var(--po-brd2);border-radius:999px;background:rgba(128,128,128,0.07);}
#gf-po-view{line-height:0;}
#gf-po-canvas{display:block;cursor:none;touch-action:none;user-select:none;-webkit-user-select:none;}
#gf-po-sidebar{width:${SIDE_W}px;height:var(--po-board-h,auto);flex-shrink:0;display:flex;flex-direction:column;gap:6px;padding:8px;overflow-y:auto;background:var(--po-hud);line-height:1.25;}
#gf-po-sidebar::-webkit-scrollbar{width:3px;} #gf-po-sidebar::-webkit-scrollbar-thumb{background:var(--po-scroll);border-radius:99px;}
.gf-pop{padding:8px 10px;border:1px solid var(--po-brd2);border-radius:10px;background:rgba(128,128,128,0.05);flex-shrink:0;}
.gf-pop-label{font-size:8px;font-weight:700;letter-spacing:1.4px;color:var(--po-txt3);text-transform:uppercase;margin-bottom:5px;}
.gf-po-eff-row{display:flex;justify-content:space-between;align-items:center;font-size:9px;padding:2px 0;color:var(--po-txt);font-weight:700;}
.gf-po-eff-row span:first-child{display:flex;align-items:center;gap:5px;}
.gf-po-eff-row i{width:9px;height:9px;border-radius:50%;border:1.2px solid ${ol};}
.gf-po-eff-row span:last-child{color:var(--po-txt3);font-weight:600;}
.gf-po-ctrl-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.gf-po-ctrl-row kbd{display:inline-block;padding:1px 4px;font-family:inherit;font-size:7.5px;font-weight:700;background:var(--po-kbd);border:1px solid var(--po-kbd-brd);border-bottom-width:2px;border-radius:4px;color:var(--po-txt2);min-width:34px;text-align:center;flex-shrink:0;}
.gf-po-ctrl-row span{font-size:8.5px;color:var(--po-txt3);}
.gf-po-tip{font-size:9px;color:var(--po-txt2);line-height:1.45;}
.gf-pos{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px;line-height:1.3;text-align:center;}
.gf-pos-glass{background:color-mix(in srgb,var(--po-scr) 25%,transparent);}
.gf-pos-dim{background:rgba(6,16,12,0.36);backdrop-filter:blur(1.5px);}
.gf-pos-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 20px;border-radius:16px;background:var(--po-scr);border:1px solid var(--po-brd);box-shadow:0 14px 44px rgba(0,0,0,.24);max-width:440px;}
.gf-pos-start-card{width:min(430px,100%);max-height:100%;overflow-y:auto;gap:8px;padding:14px 16px;}
.gf-pos-start-hdr{display:flex;flex-direction:column;align-items:center;gap:3px;}
.gf-pos-logo{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:30px;font-weight:900;color:#4ade80;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};}
.gf-pos-sub{font-size:11.5px;font-weight:700;color:var(--po-txt2);margin-top:4px;}
.gf-pos-h{font-size:21px;font-weight:800;color:var(--po-txt);letter-spacing:4px;}
.gf-pos-footer{font-size:9.5px;color:var(--po-txt3);text-align:center;line-height:1.4;}
.gf-pos-stat{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:30px;color:var(--po-txt);font-weight:900;letter-spacing:2px;padding:6px 18px;border-radius:12px;background:var(--po-scr);border:1px solid var(--po-brd);}
.gf-pos-card .gf-pos-stat{border:none;padding:0;background:none;}
.gf-pos-go-title{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:34px;font-weight:900;color:#f87171;letter-spacing:1px;line-height:1;text-shadow:2.5px 0 0 ${ol},-2.5px 0 0 ${ol},0 2.5px 0 ${ol},0 -2.5px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 5px 0 ${ol};animation:gf-po-drop .45s cubic-bezier(.2,1.5,.4,1);}
.gf-pos-win-title{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:24px;font-weight:900;color:#4ade80;line-height:1.1;text-shadow:2px 0 0 ${ol},-2px 0 0 ${ol},0 2px 0 ${ol},0 -2px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 4px 0 ${ol};animation:gf-po-drop .45s cubic-bezier(.2,1.5,.4,1);}
@keyframes gf-po-drop{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:none}}
.gf-pos-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
.gf-po-btn{padding:8px 20px;border:2px solid ${ol};border-radius:10px;background:#4ade80;color:#052e16;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;box-shadow:0 4px 0 ${ol};transition:transform .12s,box-shadow .12s,background .12s;}
.gf-po-btn:hover{background:#6ee7a0;transform:translateY(-1px);box-shadow:0 5px 0 ${ol};}
.gf-po-btn:active{transform:translateY(3px);box-shadow:0 1px 0 ${ol};}
.gf-po-btn-sec{background:var(--po-scr);color:var(--po-txt);}
.gf-po-btn-sec:hover{background:var(--po-hud);}
.gf-po-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-pol{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 10px;border:1px solid var(--po-brd2);border-radius:10px;background:var(--po-modal);color:var(--po-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-pol:hover:not(:disabled){border-color:#4ade80;background:rgba(74,222,128,0.07);transform:translateX(2px);}
.gf-pol-sel{border-color:rgba(74,222,128,0.6);}
.gf-pol-locked{opacity:0.45;} .gf-pol:disabled{cursor:default;}
.gf-pol-left{display:flex;align-items:center;gap:10px;}
.gf-pol-badge{width:30px;height:30px;border-radius:8px;background:#4ade80;border:2px solid ${ol};box-shadow:0 2px 0 ${ol};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#052e16;flex-shrink:0;}
.gf-pol-badge-fp{background:#c4b5fd;color:#1e1b4b;}
.gf-pol-info{display:flex;flex-direction:column;gap:1px;}
.gf-pol-name{font-size:11.5px;font-weight:700;color:var(--po-txt);}
.gf-pol-tgt{font-size:9px;color:var(--po-txt3);font-weight:400;}
.gf-pol-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.gf-pol-pips{display:flex;gap:2px;}
.gf-pol-pips i{width:6px;height:6px;border-radius:2px;background:rgba(128,128,128,0.25);}
.gf-pol-pips i.on{background:#f87171;}
.gf-pol-best{font-size:8px;color:var(--po-txt3);white-space:nowrap;}
.gf-pol-lock{width:10px;height:9px;border-radius:2px;background:var(--po-txt3);position:relative;margin-top:4px;}
.gf-pol-lock::before{content:'';position:absolute;left:1.5px;top:-5px;width:4px;height:5px;border:1.5px solid var(--po-txt3);border-bottom:none;border-radius:4px 4px 0 0;}
`;
    document.head.appendChild(s);
  }

})(window);
