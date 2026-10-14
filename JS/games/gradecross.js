;(function (W) {
  'use strict';
  if (W.OpenGradeCross) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 720;
  const CV_H = 480;
  const TS = 46;
  const YS = 0.25;
  const YC = Math.sqrt(1 - YS * YS);
  const PS = 0.8;
  const HY = 0.6 * TS;
  const SLOPE = YS * PS / YC;
  const FOCUS_Y = CV_H * 0.6;
  const HALF = 4;
  const WRAP = 16;
  const HOP_T = 0.14;
  const HOP_H = 0.42;
  const GRASS_H = 0.14;
  const WATER_H = -0.16;
  const LOG_TOP = 0.2;
  const BACK = 4.2;
  const TRAIN_V = 26;
  const WARN_T = 1.1;
  const MAXP = 220;
  const VLEN = [1.3, 1.75, 2.7];
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const KEYDIR = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, W: 0, z: 0, Z: 0, d: 1, D: 1, s: 2, S: 2, a: 3, A: 3, q: 3, Q: 3 };
  const FONT_HUD = '800 44px "IBM Plex Mono",monospace';
  const FONT_SM = '700 12px "IBM Plex Mono",monospace';
  const FONT_NUM = '800 22px "IBM Plex Mono",monospace';
  const FONT_COIN = '800 10px "IBM Plex Mono",monospace';
  const FONT_TRUCK = '800 11px "IBM Plex Mono",monospace';

  const LS_BEST = 'gf-cr-best';
  const LS_COINS = 'gf-cr-coins';
  const LS_SOUND = 'gf-cr-sound';

  const DAY = {
    night: false, ink: '#000000',
    grass: ['#a9df66', '#9fd65b'], grassSide: '#7a9f45', oob: 'rgba(20,40,10,0.26)',
    road: '#5d6170', roadSide: '#474a56', dash: '#eef0f3',
    rail: '#9a8f84', railSide: '#7a7068', sleeper: '#71503a', steel: '#d7dce2', steelSide: '#81848a',
    water: '#62cbf5', foam: '#c6f0ff', ripple: '#a3e3fc',
    trunk: '#8d5b3a', leaf: '#6fc142', rock: '#b1b6bd',
    log: '#a0703f', logEnd: '#e0b47c', bark: '#86592f',
    pad: '#5cb85c', tuft: '#86c64c', flowers: ['#ffffff', '#ffd84d', '#ff8fb1'],
    shadow: 'rgba(25,45,15,0.2)',
    glass: '#cdeeff', head: '#fff7c4', tail: '#ff5a4f', panel: '#ffffff', cargo: '#eef1f4', tire: '#2b2d33',
    cars: ['#e8483d', '#3d8fe0', '#f6c234', '#3cc46e', '#9b5bd6', '#f28b30', '#25b7ae', '#ee6aa0'],
    train: '#d9473b', trainTrim: '#f5f5f5', trainRoof: '#5b5f6b', signal: '#a8aeb6', lampOff: '#5a1d18',
  };
  const NIGHT = {
    night: true, ink: '#060b1c',
    grass: ['#3f6c3b', '#3a6537'], grassSide: '#284629', oob: 'rgba(0,4,16,0.32)',
    road: '#30333f', roadSide: '#22242e', dash: '#a3a8b3',
    rail: '#514b46', railSide: '#3b3734', sleeper: '#3f2d22', steel: '#9aa3ae', steelSide: '#5e6470',
    water: '#1d5379', foam: '#4585b0', ripple: '#3a75a3',
    trunk: '#5b3c29', leaf: '#2f6a35', rock: '#6e737c',
    log: '#6a4a2e', logEnd: '#a57d52', bark: '#553a22',
    pad: '#3f8f45', tuft: '#4f8a3f', flowers: ['#c9ced8', '#d8c25a', '#cf7f9c'],
    shadow: 'rgba(0,0,12,0.3)',
    glass: '#ffe08a', head: '#fff2b0', tail: '#ff4a3d', panel: '#d9dee5', cargo: '#98a0ab', tire: '#15161a',
    cars: DAY.cars.map(c => Mix(c, '#060b1c', 0.3)),
    train: '#a3352b', trainTrim: '#d8d8d8', trainRoof: '#2a2b30', signal: '#6c727b', lampOff: '#3a1512',
  };

  const CHICK = [
    [-0.19, 0, -0.04, -0.1, 0.16, 0.05, '#f5a623'],
    [0.1, 0, -0.04, 0.19, 0.16, 0.05, '#f5a623'],
    [-0.31, 0.15, -0.3, 0.31, 0.8, 0.25, '#ffffff'],
    [-0.19, 0.5, -0.41, 0.19, 0.75, -0.3, '#f4f4f4'],
    [-0.07, 0.8, -0.1, 0.07, 0.9, 0.16, '#e8423a'],
    [-0.07, 0.9, -0.02, 0.07, 0.97, 0.1, '#e8423a'],
    [-0.09, 0.52, 0.25, 0.09, 0.65, 0.39, '#f5a623'],
    [-0.055, 0.4, 0.25, 0.055, 0.52, 0.31, '#e8423a'],
    [0.31, 0.59, 0.07, 0.33, 0.69, 0.16, '#222222'],
    [-0.33, 0.59, 0.07, -0.31, 0.69, 0.16, '#222222'],
    [0.31, 0.3, -0.18, 0.37, 0.55, 0.1, '#ececec'],
    [-0.37, 0.3, -0.18, -0.31, 0.55, 0.1, '#ececec'],
  ];
  const _cp = CHICK.map(() => ({ x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0, c: '' }));
  const _co = _cp.slice();
  const PARTS = Array.from({ length: MAXP }, () => ({ k: 0, t: 0, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, ph: 0, c: '' }));
  const ByX = (a, b) => a.x - b.x;

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde', 'Nederlands', 'Frans', 'Wetenschappen', 'Geschiedenis', 'Engels', 'Sport', 'Latijn', 'Economie'];
    return Array.from({ length: 24 }, (_, i) => {
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
  function Pool() { return _grades.length ? _grades : (_fallback || (_fallback = FallbackGrades())); }
  function PickGood() {
    const g = Pool().filter(x => (x.Pct ?? 60) >= 50);
    return g.length ? g[RndI(g.length)] : { Pct: 80, label: '16/20' };
  }
  function PickBad() {
    const g = Pool().filter(x => (x.Pct ?? 60) < 50);
    return g.length ? g[RndI(g.length)] : { Pct: 30, label: '6/20' };
  }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function Mix(a, b, t) {
    const p = Hex(a), q = Hex(b);
    return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function Rnd(a, b) { return a + Math.random() * (b - a); }
  function RndI(n) { return Math.random() * n | 0; }
  function Diff(z) { return Math.min(1, Math.max(0, z) / 220); }

  let GS = null, P = null, _grades = [], _fallback = null, _raf = null, _kh = null, _tobs = null;
  let _cv = null, _ctx = null, _icon = null, _ptr = null, _vig = null, _topN = -1, _topS = '';
  let C = DAY, _dark = null, RES = 1, _pi = 0;
  let X = null, OX = 0, OY = 0, _mb = null;
  let _ac = null, _noise = null, _sound = StorageGet(LS_SOUND, false);
  const _spr = new Map();
  const _shade = new Map();

  function Shade(c) {
    let s = _shade.get(c);
    if (!s) { s = [Mix(c, '#ffffff', 0.05), Mix(c, C.ink, 0.17), Mix(c, C.ink, 0.34)]; _shade.set(c, s); }
    return s;
  }

  function SX(x, z) { return OX + (x * YC + z * YS) * TS; }
  function GY(x, z) { return OY - (z * YC - x * YS) * PS * TS; }

  function Ext(x, y) {
    if (x < _mb[0]) _mb[0] = x;
    if (y < _mb[1]) _mb[1] = y;
    if (x > _mb[2]) _mb[2] = x;
    if (y > _mb[3]) _mb[3] = y;
  }
  function Face(c, ax, ay, bx, by, cx, cy, dx, dy) {
    if (_mb) { Ext(ax, ay); Ext(bx, by); Ext(cx, cy); Ext(dx, dy); return; }
    X.fillStyle = c; X.strokeStyle = c;
    X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx, by); X.lineTo(cx, cy); X.lineTo(dx, dy); X.closePath();
    X.fill(); X.stroke();
  }
  function Box(x0, y0, z0, x1, y1, z1, c) {
    const s = Shade(c), h0 = y0 * HY, h1 = y1 * HY;
    const ax = SX(x0, z0), ay = GY(x0, z0), bx = SX(x1, z0), by = GY(x1, z0);
    const cx = SX(x1, z1), cy = GY(x1, z1), dx = SX(x0, z1), dy = GY(x0, z1);
    Face(s[1], ax, ay - h0, bx, by - h0, bx, by - h1, ax, ay - h1);
    Face(s[2], bx, by - h0, cx, cy - h0, cx, cy - h1, bx, by - h1);
    Face(s[0], ax, ay - h1, bx, by - h1, cx, cy - h1, dx, dy - h1);
  }
  function DecF(x0, y0, x1, y1, z, c) {
    Face(Shade(c)[1], SX(x0, z), GY(x0, z) - y0 * HY, SX(x1, z), GY(x1, z) - y0 * HY, SX(x1, z), GY(x1, z) - y1 * HY, SX(x0, z), GY(x0, z) - y1 * HY);
  }
  function DecR(z0, y0, z1, y1, x, c) {
    Face(Shade(c)[2], SX(x, z0), GY(x, z0) - y0 * HY, SX(x, z1), GY(x, z1) - y0 * HY, SX(x, z1), GY(x, z1) - y1 * HY, SX(x, z0), GY(x, z0) - y1 * HY);
  }
  function DecT(x0, z0, x1, z1, y, c) {
    const h = y * HY;
    Face(Shade(c)[0], SX(x0, z0), GY(x0, z0) - h, SX(x1, z0), GY(x1, z0) - h, SX(x1, z1), GY(x1, z1) - h, SX(x0, z1), GY(x0, z1) - h);
  }
  function TopPoly(c, pts, y) {
    if (_mb) { for (const p of pts) Ext(SX(p[0], p[1]), GY(p[0], p[1]) - y * HY); return; }
    X.fillStyle = c; X.beginPath();
    pts.forEach((p, i) => { const sx = SX(p[0], p[1]), sy = GY(p[0], p[1]) - y * HY; if (i) X.lineTo(sx, sy); else X.moveTo(sx, sy); });
    X.closePath(); X.fill();
  }
  function SubStrip(x0, x1, z0, z1, y) {
    const h = y * HY;
    X.moveTo(SX(x0, z0), GY(x0, z0) - h); X.lineTo(SX(x1, z0), GY(x1, z0) - h);
    X.lineTo(SX(x1, z1), GY(x1, z1) - h); X.lineTo(SX(x0, z1), GY(x0, z1) - h); X.closePath();
  }
  function SubFront(x0, x1, z, y0, y1) {
    const a = GY(x0, z), b = GY(x1, z);
    X.moveTo(SX(x0, z), a - y0 * HY); X.lineTo(SX(x1, z), b - y0 * HY);
    X.lineTo(SX(x1, z), b - y1 * HY); X.lineTo(SX(x0, z), a - y1 * HY); X.closePath();
  }
  function FillPath(c, stroke) {
    X.fillStyle = c; X.fill();
    if (stroke) { X.strokeStyle = c; X.stroke(); }
  }

  function Spr(key, fn, a, b, c) { return _spr.get(key) || MakeSprite(key, fn, a, b, c); }
  function MakeSprite(key, fn, a, b, c) {
    const sx = X, so = OX, sp = OY;
    OX = 0; OY = 0; _mb = [1e9, 1e9, -1e9, -1e9];
    fn(a, b, c);
    const m = _mb;
    _mb = null;
    const w = Math.ceil(m[2] - m[0]) + 4, h = Math.ceil(m[3] - m[1]) + 4;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * RES); cv.height = Math.ceil(h * RES);
    X = cv.getContext('2d');
    X.setTransform(RES, 0, 0, RES, 0, 0); X.lineWidth = 0.6; X.lineJoin = 'round';
    OX = 2 - m[0]; OY = 2 - m[1];
    fn(a, b, c);
    const s = { cv, w, h, ox: OX, oy: OY };
    X = sx; OX = so; OY = sp;
    _spr.set(key, s);
    return s;
  }
  function Blit(s, x, y, z) { X.drawImage(s.cv, SX(x, z) - s.ox, GY(x, z) - y * HY - s.oy, s.w, s.h); }

  function TreeModel(v) {
    const fh = [0.62, 0.98, 1.38][v];
    Box(-0.12, 0, -0.12, 0.12, 0.3, 0.12, C.trunk);
    Box(-0.37, 0.3, -0.37, 0.37, 0.3 + fh, 0.37, C.leaf);
    if (v) DecF(-0.37, 0.3 + fh * 0.48, 0.37, 0.3 + fh * 0.52, -0.37, Mix(C.leaf, C.ink, 0.1));
  }
  function RockModel() {
    Box(-0.36, 0, -0.32, 0.34, 0.28, 0.3, C.rock);
    Box(-0.22, 0.28, -0.2, 0.16, 0.4, 0.14, Mix(C.rock, '#ffffff', 0.12));
  }
  function DecoModel(k) {
    if (!k) {
      Box(-0.08, 0, -0.03, -0.04, 0.1, 0.01, C.tuft);
      Box(-0.01, 0, -0.02, 0.03, 0.15, 0.02, C.tuft);
      Box(0.06, 0, 0, 0.1, 0.08, 0.04, C.tuft);
      return;
    }
    Box(-0.015, 0, -0.015, 0.015, 0.08, 0.015, C.tuft);
    Box(-0.05, 0.08, -0.05, 0.05, 0.13, 0.05, C.flowers[k - 1]);
    Box(-0.02, 0.13, -0.02, 0.02, 0.15, 0.02, '#ffd84d');
  }
  function PadModel() {
    const pts = [[0, 0]];
    for (let i = 0; i <= 12; i++) { const a = 0.45 + i / 12 * (Math.PI * 2 - 0.9); pts.push([Math.cos(a) * 0.37, Math.sin(a) * 0.37]); }
    TopPoly(Mix(C.pad, C.ink, 0.35), pts, 0);
    TopPoly(C.pad, pts, 0.05);
  }
  function LogModel(len) {
    Box(0, -0.08, -0.3, len, LOG_TOP, 0.3, C.log);
    DecT(0.2, -0.17, len * 0.55, -0.13, LOG_TOP, C.bark);
    DecT(len * 0.35, 0.02, len - 0.25, 0.06, LOG_TOP, C.bark);
    DecT(0.45, 0.17, len * 0.7, 0.21, LOG_TOP, C.bark);
    DecF(0.3, 0.02, len * 0.6, 0.06, -0.3, C.bark);
    DecR(-0.25, -0.04, 0.25, LOG_TOP - 0.03, len, C.logEnd);
    DecR(-0.12, 0.03, 0.12, 0.11, len, Mix(C.logEnd, C.log, 0.5));
  }
  function SignalModel() {
    Box(-0.2, 0, -0.1, 0.2, 0.08, 0.1, C.signal);
    Box(-0.045, 0.08, -0.045, 0.045, 1.0, 0.045, C.signal);
    Box(-0.25, 1.0, -0.08, 0.25, 1.25, 0.06, '#33363d');
    Box(-0.3, 1.36, -0.03, 0.3, 1.44, 0.01, '#f2f2f2');
    DecF(-0.3, 1.38, 0.3, 1.42, -0.03, '#d63b30');
    Box(-0.03, 1.25, -0.03, 0.03, 1.36, 0.01, C.signal);
  }
  function GlowModel() {
    if (_mb) { Ext(-16, -16); Ext(16, 16); return; }
    const g = X.createRadialGradient(OX, OY, 0, OX, OY, 16);
    g.addColorStop(0, 'rgba(255,90,60,0.8)'); g.addColorStop(1, 'rgba(255,90,60,0)');
    X.fillStyle = g; X.beginPath(); X.arc(OX, OY, 16, 0, Math.PI * 2); X.fill();
  }
  function BeamModel(dir) {
    const x1 = dir * 3;
    const pts = [SX(0, -0.24), GY(0, -0.24), SX(x1, -0.5), GY(x1, -0.5), SX(x1, 0.5), GY(x1, 0.5), SX(0, 0.24), GY(0, 0.24)];
    if (_mb) { for (let i = 0; i < 8; i += 2) Ext(pts[i], pts[i + 1]); return; }
    const g = X.createLinearGradient(SX(0, 0), GY(0, 0), SX(x1, 0), GY(x1, 0));
    g.addColorStop(0, 'rgba(255,236,160,0.5)'); g.addColorStop(1, 'rgba(255,236,160,0)');
    X.fillStyle = g; X.beginPath(); X.moveTo(pts[0], pts[1]);
    for (let i = 2; i < 8; i += 2) X.lineTo(pts[i], pts[i + 1]);
    X.closePath(); X.fill();
  }
  function VehModel(kind, ci, dir) {
    const L = VLEN[kind], col = C.cars[ci], m = dir > 0;
    const B = (x0, y0, z0, x1, y1, z1, c) => m ? Box(x0, y0, z0, x1, y1, z1, c) : Box(L - x1, y0, z0, L - x0, y1, z1, c);
    const F = (x0, y0, x1, y1, z, c) => m ? DecF(x0, y0, x1, y1, z, c) : DecF(L - x1, y0, L - x0, y1, z, c);
    const lamp = m ? C.head : C.tail;
    if (kind === 0) {
      B(0, 0.12, -0.36, L, 0.48, 0.36, col);
      DecR(-0.3, 0.27, -0.16, 0.37, L, lamp); DecR(0.16, 0.27, 0.3, 0.37, L, lamp);
      F(0.02, 0.2, L - 0.02, 0.26, -0.36, Mix(col, C.ink, 0.25));
      B(0.26, 0.48, -0.3, 0.98, 0.8, 0.3, Mix(col, '#ffffff', 0.08));
      F(0.32, 0.54, 0.6, 0.75, -0.3, C.glass); F(0.66, 0.54, 0.92, 0.75, -0.3, C.glass);
      DecR(-0.25, 0.53, 0.25, 0.76, m ? 0.98 : L - 0.26, C.glass);
      B(0.14, 0, -0.41, 0.42, 0.24, -0.35, C.tire); B(L - 0.42, 0, -0.41, L - 0.14, 0.24, -0.35, C.tire);
    } else if (kind === 1) {
      B(0, 0.12, -0.37, L, 0.88, 0.37, col);
      F(0.1, 0.52, 0.62, 0.76, -0.37, C.glass); F(0.7, 0.52, 1.18, 0.76, -0.37, C.glass); F(1.26, 0.52, L - 0.1, 0.76, -0.37, C.glass);
      F(0, 0.3, L, 0.38, -0.37, Mix(col, '#ffffff', 0.45));
      DecR(-0.29, 0.5, 0.29, 0.78, L, C.glass);
      DecR(-0.31, 0.24, -0.18, 0.34, L, lamp); DecR(0.18, 0.24, 0.31, 0.34, L, lamp);
      B(0.16, 0, -0.42, 0.46, 0.25, -0.36, C.tire); B(L - 0.46, 0, -0.42, L - 0.16, 0.25, -0.36, C.tire);
    } else {
      const cargo = () => {
        B(0, 0.24, -0.4, L - 0.9, 1.06, 0.4, C.cargo);
        F(0.2, 0.34, L - 1.1, 0.96, -0.4, col);
        F(0.25, 0.39, L - 1.15, 0.91, -0.4, C.panel);
        if (!m) DecR(-0.36, 0.3, 0.36, 1.0, L, Mix(C.cargo, C.ink, 0.06));
      };
      const cab = () => {
        B(L - 0.84, 0.18, -0.36, L, 0.84, 0.36, col);
        F(L - 0.62, 0.5, L - 0.12, 0.74, -0.36, C.glass);
        if (m) { DecR(-0.28, 0.5, 0.28, 0.76, L, C.glass); DecR(-0.3, 0.26, -0.18, 0.36, L, lamp); DecR(0.18, 0.26, 0.3, 0.36, L, lamp); }
      };
      B(0, 0.1, -0.3, L, 0.24, 0.3, C.tire);
      if (m) { cargo(); cab(); } else { cab(); cargo(); }
      if (!m) { DecR(-0.32, 0.3, -0.2, 0.4, L, lamp); DecR(0.2, 0.3, 0.32, 0.4, L, lamp); }
      B(0.18, 0, -0.42, 0.5, 0.26, -0.36, C.tire); B(0.56, 0, -0.42, 0.88, 0.26, -0.36, C.tire); B(L - 0.52, 0, -0.42, L - 0.2, 0.26, -0.36, C.tire);
    }
  }
  function TrainLen(n) { return 3 + n * 2.95; }
  function TrainModel(n, dir) {
    let x = 0;
    for (let i = 0; i <= n; i++) {
      const loco = dir > 0 ? i === n : i === 0;
      const w = loco ? 3 : 2.8;
      Box(x + 0.1, 0, -0.43, x + w - 0.1, 0.18, 0.43, '#2c2d33');
      Box(x, 0.18, -0.45, x + w, loco ? 1.0 : 1.2, 0.45, C.train);
      if (loco) {
        const cx = dir > 0 ? x : x + 1.8;
        Box(cx, 1.0, -0.45, cx + 1.2, 1.42, 0.45, C.train);
        Box(cx + 0.1, 1.42, -0.4, cx + 1.1, 1.5, 0.4, C.trainRoof);
        DecF(cx + 0.2, 1.06, cx + 1.0, 1.32, -0.45, C.glass);
        DecF(x, 0.42, x + w, 0.54, -0.45, C.trainTrim);
        if (dir > 0) {
          DecR(-0.32, 0.5, 0.32, 0.86, x + w, C.glass);
          DecR(-0.1, 0.24, 0.1, 0.38, x + w, C.head);
          Box(x + w - 0.04, 0.18, -0.45, x + w + 0.08, 0.3, 0.45, '#3a3b42');
        }
        const hx = dir > 0 ? x + 1.6 : x + 0.9;
        Box(hx, 1.0, -0.1, hx + 0.22, 1.24, 0.12, '#3a3b42');
      } else {
        Box(x + 0.12, 1.2, -0.4, x + w - 0.12, 1.3, 0.4, C.trainRoof);
        for (let k = 0; k < 4; k++) DecF(x + 0.22 + k * 0.62, 0.66, x + 0.66 + k * 0.62, 1.0, -0.45, C.glass);
        DecF(x, 0.42, x + w, 0.52, -0.45, C.trainTrim);
      }
      x += w + 0.15;
    }
  }

  function Chicken(x, y, z, face, k, sy) {
    for (let i = 0; i < CHICK.length; i++) {
      const d = CHICK[i], o = _cp[i];
      const a0 = d[0] * k, a1 = d[3] * k, b0 = d[2] * k, b1 = d[5] * k;
      let x0, x1, z0, z1;
      if (face === 0) { x0 = a0; x1 = a1; z0 = b0; z1 = b1; }
      else if (face === 1) { x0 = b0; x1 = b1; z0 = -a1; z1 = -a0; }
      else if (face === 2) { x0 = -a1; x1 = -a0; z0 = -b1; z1 = -b0; }
      else { x0 = -b1; x1 = -b0; z0 = a0; z1 = a1; }
      o.x0 = x + x0; o.x1 = x + x1; o.z0 = z + z0; o.z1 = z + z1;
      o.y0 = y + d[1] * sy; o.y1 = y + d[4] * sy; o.c = d[6];
    }
    _co.sort(PartCmp);
    for (const o of _co) Box(o.x0, o.y0, o.z0, o.x1, o.y1, o.z1, o.c);
  }
  function PartCmp(a, b) {
    if (a.z1 <= b.z0) return 1;
    if (b.z1 <= a.z0) return -1;
    if (a.x1 <= b.x0) return -1;
    if (b.x1 <= a.x0) return 1;
    return a.y0 - b.y0;
  }

  function Eagle(x, y, z, flap) {
    const f = Math.sin(flap) * 0.3;
    Box(x - 0.28, y + 0.08, z + 0.7, x + 0.28, y + 0.28, z + 1.3, '#3e2f25');
    Box(x - 2, y + 0.14 + f, z - 0.05, x - 0.85, y + 0.28 + f, z + 0.65, '#4a3a2e');
    Box(x - 0.88, y + 0.16 + f * 0.4, z - 0.12, x - 0.4, y + 0.32 + f * 0.4, z + 0.72, '#5a4636');
    Box(x - 0.42, y, z - 0.7, x + 0.42, y + 0.58, z + 0.78, '#5a4636');
    Box(x - 0.3, y + 0.2, z - 1.15, x + 0.3, y + 0.72, z - 0.65, '#f4f4f4');
    Box(x - 0.11, y + 0.28, z - 1.4, x + 0.11, y + 0.48, z - 1.15, '#f6b93b');
    Box(x + 0.4, y + 0.16 + f * 0.4, z - 0.12, x + 0.88, y + 0.32 + f * 0.4, z + 0.72, '#5a4636');
    Box(x + 0.85, y + 0.14 + f, z - 0.05, x + 2, y + 0.28 + f, z + 0.65, '#4a3a2e');
  }

  function Snd(kind) {
    if (!_sound || !_ac) return;
    const t = _ac.currentTime;
    if (kind === 'hop') Tone(t, 360, 620, 0.06, 'square', 0.02);
    else if (kind === 'coin') { Tone(t, 988, 990, 0.07, 'square', 0.035); Tone(t + 0.07, 1319, 1320, 0.16, 'square', 0.035); }
    else if (kind === 'ding') Tone(t, 1760, 1740, 0.35, 'triangle', 0.06);
    else if (kind === 'eagle') Tone(t, 1600, 700, 0.5, 'sawtooth', 0.035);
    else if (kind === 'hit') { Noise(t, 0.2, 600, 0.22); Tone(t, 170, 50, 0.22, 'square', 0.06); }
    else if (kind === 'splash') Noise(t, 0.45, 1500, 0.16);
  }
  function Tone(t, f0, f1, dur, type, vol) {
    const o = _ac.createOscillator(), g = _ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(_ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function Noise(t, dur, freq, vol) {
    if (!_noise) {
      _noise = _ac.createBuffer(1, _ac.sampleRate / 2 | 0, _ac.sampleRate);
      const d = _noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = _ac.createBufferSource(), f = _ac.createBiquadFilter(), g = _ac.createGain();
    s.buffer = _noise; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(_ac.destination); s.start(t); s.stop(t + dur);
  }
  function WakeAudio() {
    if (!_sound) return;
    if (!_ac) {
      const AC = W.AudioContext || W.webkitAudioContext;
      if (!AC) return;
      _ac = new AC();
    }
    if (_ac.state === 'suspended') _ac.resume();
  }
  function ToggleSound() {
    _sound = !_sound;
    StorageSet(LS_SOUND, _sound);
    WakeAudio();
    SyncSoundBtn();
  }
  function SyncSoundBtn() {
    document.getElementById('gf-cr-sound-btn')?.classList.toggle('on', _sound);
    _icon.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/>${_sound ? '<path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>' : '<path d="M17 9.5l5 5M22 9.5l-5 5"/>'}</svg>`;
  }

  function NewLane(z, type) {
    return { z, type, h: 0, obs: [], items: [], pads: null, block: null, deco: [], coin: null, speed: 0, dir: 1, tt: 0, warn: false, ding: 0, ring: 0, seed: Math.random() * 32 };
  }

  function PickRun(z) {
    const g = GS.gen, d = Diff(z), prev = g.type;
    let t = 'grass';
    if (prev === 'grass' || Math.random() > 0.68) {
      do { const r = Math.random(); t = r < 0.52 ? 'road' : r < 0.86 - 0.06 * d ? 'river' : 'rail'; } while (t === prev);
    }
    g.type = t;
    if (t === 'grass') g.left = Math.random() < 0.3 ? 2 : 1;
    else if (t === 'road') g.left = 1 + RndI(2 + Math.round(3 * d));
    else if (t === 'river') g.left = 1 + RndI(2 + Math.round(1.5 * d));
    else g.left = Math.random() < 0.25 + 0.3 * d ? 2 : 1;
  }

  function Gen(z) {
    const g = GS.gen;
    let type = 'grass';
    if (z >= 3) {
      if (g.left <= 0) PickRun(z);
      type = g.type;
      g.left--;
    }
    const L = NewLane(z, type);
    if (type === 'grass') GenGrass(L, z <= -3);
    else if (type === 'road') GenRoad(L);
    else if (type === 'rail') GenRail(L);
    else if (g.last !== 'lily' && Math.random() < 0.2) GenLily(L);
    else GenRiver(L);
    g.last = L.type;
    GS.lanes.set(z, L);
  }

  function PickOpen(open) {
    const c = [];
    for (let i = 0; i < 9; i++) if (open[i]) c.push(i);
    return c[RndI(c.length)];
  }
  function Spread(blk, prev) {
    const o = new Uint8Array(9);
    for (let c = 0; c < 9; c++) if (!blk[c] && prev[c]) o[c] = 1;
    for (let c = 1; c < 9; c++) if (o[c - 1] && !blk[c]) o[c] = 1;
    for (let c = 7; c >= 0; c--) if (o[c + 1] && !blk[c]) o[c] = 1;
    return o;
  }
  function MaybeCoin(L, open) {
    if (L.z < 4 || Math.random() > 0.1) return;
    const c = PickOpen(open), gr = PickGood(), col = GradeColor(gr.Pct);
    L.coin = { x: c - HALF, t: String(Math.round(gr.Pct ?? 75)), col, rim: Mix(col, '#000000', 0.32), got: false };
  }

  function GenGrass(L, wall) {
    const g = GS.gen, d = Diff(L.z), blk = new Uint8Array(9);
    L.h = GRASS_H;
    const p = wall ? 1 : L.z < 3 ? 0.1 : 0.12 + 0.24 * d;
    for (let c = 0; c < 9; c++) blk[c] = Math.random() < p ? 1 : 0;
    if (L.z === 0) blk.fill(0, 2, 7);
    if (!wall) {
      let free = 0, hit = false;
      for (let c = 0; c < 9; c++) if (!blk[c]) { free++; if (g.open[c]) hit = true; }
      if (!hit) { blk[PickOpen(g.open)] = 0; free++; }
      while (free < 3) { const c = RndI(9); if (blk[c]) { blk[c] = 0; free++; } }
      g.open = Spread(blk, g.open);
      MaybeCoin(L, g.open);
    }
    L.block = blk;
    for (let x = -13; x <= 13; x++) {
      const inside = Math.abs(x) <= HALF;
      if (inside ? blk[x + HALF] : Math.random() < (wall ? 0.92 : 0.5)) {
        L.obs.push({ x, kind: inside && !wall && Math.random() < 0.16 ? 1 : 0, v: inside ? RndI(3) : 1 + RndI(2) });
      }
    }
    const n = 3 + RndI(5);
    for (let i = 0; i < n; i++) L.deco.push({ x: Rnd(-13, 13), z: L.z + Rnd(-0.38, 0.38), k: Math.random() < 0.6 ? 0 : 1 + RndI(3) });
  }

  function GenRoad(L) {
    const d = Diff(L.z), r = Math.random(), kind = r < 0.58 ? 0 : r < 0.8 ? 1 : 2;
    L.dir = Math.random() < 0.5 ? 1 : -1;
    let v = Rnd(1.9, 2.9) + 2.8 * d + Math.random() * 1.2 * d;
    v *= [1, 0.88, 0.72][kind];
    const fast = d > 0.12 && kind === 0 && Math.random() < 0.18;
    if (fast) v *= 1.7;
    L.speed = v * L.dir;
    const len = VLEN[kind], gap = Math.max(2.8, v * 0.8), extra = (fast ? 9 : 6) - 3 * d;
    const start = -WRAP + Math.random() * 4;
    for (let x = start; x + len + gap <= start + WRAP * 2; x += len + gap + Math.random() * extra) {
      const gr = kind === 2 ? PickBad() : null;
      L.items.push({ x, len, kind, ci: RndI(8), g: gr, tc: gr ? Mix(GradeColor(gr.Pct), '#000000', 0.12) : '', bob: 0 });
    }
    GS.gen.open.fill(1);
    MaybeCoin(L, GS.gen.open);
  }

  function GenRiver(L) {
    const g = GS.gen, d = Diff(L.z);
    L.type = 'river'; L.h = WATER_H;
    g.rdir = -g.rdir; L.dir = g.rdir;
    L.speed = (Rnd(0.9, 1.5) + 1.2 * d) * L.dir;
    const lens = d < 0.35 ? [2, 3, 3, 4] : [2, 2, 3, 3], logs = [];
    let used = 0;
    for (;;) {
      const len = lens[RndI(4)], gap = Rnd(1.1, 1.9 + d);
      if (used + len + gap > WRAP * 2) break;
      logs.push([len, gap]);
      used += len + gap;
    }
    const extra = (WRAP * 2 - used) / logs.length;
    let x = -WRAP + Math.random() * 3;
    for (const [len, gap] of logs) { L.items.push({ x, len, bob: 0 }); x += len + gap + extra; }
    g.open.fill(1);
  }

  function GenLily(L) {
    const g = GS.gen, pads = new Uint8Array(9);
    L.type = 'lily'; L.h = WATER_H;
    const n = 3 + RndI(3);
    for (let i = 0; i < n; i++) pads[RndI(9)] = 1;
    let hit = false;
    for (let c = 0; c < 9; c++) if (pads[c] && g.open[c]) hit = true;
    if (!hit) pads[PickOpen(g.open)] = 1;
    g.open = Spread(pads.map(v => 1 - v), g.open);
    L.pads = pads;
  }

  function GenRail(L) {
    L.dir = Math.random() < 0.5 ? 1 : -1;
    L.speed = TRAIN_V * L.dir;
    L.tt = Rnd(1.5, 5);
    GS.gen.open.fill(1);
    MaybeCoin(L, GS.gen.open);
  }

  function NewGameState() {
    GS = {
      status: 'start', time: 0, lanes: new Map(),
      gen: { type: 'grass', left: 0, last: 'grass', open: new Uint8Array(9).fill(1), rdir: 1 },
      genZ: -10, minZ: -10, cx: 0, cz: 0, moved: false,
      score: 0, coins: 0, bank: StorageGet(LS_COINS, 0), best: LoadBest(),
      charge: -1, chargeKey: '', queued: -1, shake: 0, eagle: null, lastTs: 0,
    };
    P = { x: 0, z: 0, rx: 0, ry: GRASS_H, rz: 0, fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0, t: -1,
          face: 0, sq: 0, land: 0, log: null, off: 0, slot: 0, dead: '', dt: 0, flat: false, hide: false };
    for (const p of PARTS) p.life = 0;
    while (GS.genZ <= 18) Gen(GS.genZ++);
  }

  function StandH(L) {
    if (L.type === 'grass') return GRASS_H;
    if (L.type === 'river') return WATER_H + LOG_TOP;
    if (L.type === 'lily') return WATER_H + 0.06;
    return 0;
  }

  function Press(dir, code) {
    if (GS.status === 'start') BeginPlay();
    if (GS.status !== 'playing' || P.dead) return;
    if (GS.charge >= 0) Release();
    GS.charge = dir; GS.chargeKey = code;
    if (P.t < 0) P.face = dir;
  }
  function Release() {
    const d = GS.charge;
    GS.charge = -1; GS.chargeKey = '';
    if (d >= 0) TryHop(d);
  }

  function TryHop(dir) {
    if (P.dead) return;
    if (P.t >= 0) { GS.queued = dir; return; }
    P.face = dir;
    const tz = P.z + DIRS[dir][1], L = GS.lanes.get(tz);
    if (!L) return;
    let tx = P.x + DIRS[dir][0];
    if (L.type !== 'river') tx = Math.round(tx);
    else if (P.log && tz === P.z) tx += L.speed * HOP_T;
    const c = Math.round(tx) + HALF;
    if (c < 0 || c > 8 || (L.type === 'grass' && L.block[c])) { P.land = 0.7; return; }
    P.fx = P.x; P.fy = P.ry; P.fz = P.z;
    P.tx = tx; P.tz = tz; P.ty = StandH(L);
    P.t = 0; P.log = null;
    GS.moved = true;
    Snd('hop');
  }

  function Land() {
    const L = GS.lanes.get(P.z);
    P.land = 1;
    P.ry = P.ty;
    if (L.type === 'river') {
      let log = null;
      for (const v of L.items) if (P.x > v.x - 0.22 && P.x < v.x + v.len + 0.22) log = v;
      if (!log) { Die('water'); return; }
      P.log = log; log.bob = 1;
      P.off = P.x - log.x;
      P.slot = Math.max(0.5, Math.min(log.len - 0.5, Math.floor(P.off) + 0.5));
    } else if (L.type === 'lily' && !L.pads[Math.round(P.x) + HALF]) { Die('water'); return; }
    if (L.coin && !L.coin.got && L.coin.x === Math.round(P.x)) Collect(L);
    if (P.z > GS.score) GS.score = P.z;
    if (GS.queued >= 0) { const q = GS.queued; GS.queued = -1; TryHop(q); }
  }

  function Collect(L) {
    L.coin.got = true;
    GS.coins++; GS.bank++;
    StorageSet(LS_COINS, GS.bank);
    Emit(3, L.coin.x, L.h + 0.45, L.z, 12, 0);
    Snd('coin');
  }

  function Die(kind, dir) {
    if (P.dead) return;
    P.dead = kind; P.dt = 0; P.log = null;
    GS.queued = -1; GS.charge = -1;
    const x = P.rx, y = P.ry, z = P.rz;
    if (kind === 'car') {
      const L = GS.lanes.get(Math.round(z));
      P.flat = true; P.t = -1; P.rz = L.z; P.ry = L.h + 0.01;
      GS.shake = 0.35;
      Emit(0, x, y + 0.3, z, 12, dir * 1.5);
      Snd('hit');
    } else if (kind === 'train') {
      P.hide = true; P.t = -1;
      GS.shake = 0.6;
      Emit(0, x, y + 0.4, z, 30, dir * 6);
      Snd('hit');
    } else if (kind === 'eagle') {
      P.t = -1;
      GS.eagle = { x: P.rx, y: 4, z: P.rz + 12, got: false, flap: 0 };
      Snd('eagle');
    } else {
      Emit(1, x, WATER_H, z, 20, 0);
      Emit(2, x, WATER_H + 0.01, z, 1, 0);
      Snd('splash');
    }
  }

  function Emit(k, x, y, z, n, bias) {
    for (let i = 0; i < n; i++) {
      const p = PARTS[_pi];
      _pi = (_pi + 1) % MAXP;
      const a = Math.random() * Math.PI * 2, s = Math.random();
      p.k = k; p.t = 0; p.x = x; p.y = y; p.z = z; p.ph = Math.random() * 6;
      if (k === 0) {
        p.vx = Math.cos(a) * (0.8 + s * 2.2) + bias; p.vz = Math.sin(a) * (0.8 + s * 2.2); p.vy = 1.5 + Math.random() * 2.8;
        p.life = 1.3 + Math.random() * 0.9; p.s = 5 + Math.random() * 3; p.c = Math.random() < 0.85 ? '#ffffff' : '#f0e6d8';
      } else if (k === 1) {
        p.vx = Math.cos(a) * (0.5 + s * 1.5); p.vz = Math.sin(a) * (0.5 + s * 1.5); p.vy = 3 + Math.random() * 3.5;
        p.life = 1; p.s = 3 + Math.random() * 2.5; p.c = Math.random() < 0.5 ? '#ffffff' : C.foam;
      } else if (k === 2) {
        p.vx = 0; p.vy = 0; p.vz = 0; p.life = 0.9; p.s = 0; p.c = '#ffffff';
      } else {
        p.vx = Math.cos(a) * 1.2; p.vz = Math.sin(a) * 1.2; p.vy = 2 + Math.random() * 2.5;
        p.life = 0.6 + Math.random() * 0.3; p.s = 3 + Math.random() * 2; p.c = Math.random() < 0.5 ? '#ffe066' : '#ffffff';
      }
    }
  }

  function Update(dt) {
    GS.time += dt;
    UpdateLanes(dt);
    if (GS.status === 'playing') {
      if (P.dead) UpdateDeath(dt);
      else UpdatePlayer(dt);
      UpdateCamera(dt);
    }
    for (const p of PARTS) {
      if (p.t >= p.life) continue;
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.k === 0) {
        p.vy = Math.max(-0.7, p.vy - 6 * dt); p.vx *= 1 - Math.min(1, dt * 2.5); p.vz *= 1 - Math.min(1, dt * 2.5);
        if (p.y < 0.04) p.y = 0.04;
      } else if (p.k !== 2) {
        p.vy -= 12 * dt;
        if (p.k === 1 && p.y < WATER_H) p.t = p.life;
      }
    }
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - dt);
    while (GS.genZ <= GS.cz + 18) Gen(GS.genZ++);
    while (GS.minZ < GS.cz - 13) GS.lanes.delete(GS.minZ++);
  }

  function UpdateLanes(dt) {
    for (const L of GS.lanes.values()) {
      if (L.type === 'road' || L.type === 'river') {
        for (const v of L.items) {
          v.x += L.speed * dt;
          if (L.speed > 0 && v.x > WRAP) v.x -= WRAP * 2;
          else if (L.speed < 0 && v.x + v.len < -WRAP) v.x += WRAP * 2;
          if (v.bob > 0) v.bob = Math.max(0, v.bob - dt * 4);
        }
        L.items.sort(ByX);
      } else if (L.type === 'rail') UpdateRail(L, dt);
      if (L.ring > 0) L.ring = Math.max(0, L.ring - dt * 2.6);
    }
  }

  function UpdateRail(L, dt) {
    const tr = L.items[0];
    if (tr) {
      tr.x += L.speed * dt;
      if (L.dir > 0 ? tr.x > WRAP : tr.x + tr.len < -WRAP) { L.items.length = 0; L.tt = Rnd(2.5, 6.5 - 2 * Diff(L.z)); }
    } else {
      L.tt -= dt;
      if (L.tt <= 0) {
        const n = 2 + RndI(3), len = TrainLen(n);
        L.items.push({ x: L.dir > 0 ? -WRAP - len : WRAP, len, n });
      }
    }
    L.warn = L.items.length > 0 || L.tt < WARN_T;
    if (!L.warn) { L.ding = 0; return; }
    L.ding -= dt;
    if (L.ding <= 0) {
      L.ding = 0.34; L.ring = 1;
      if (GS.status === 'playing' && Math.abs(L.z - GS.cz) < 8) Snd('ding');
    }
  }

  function UpdatePlayer(dt) {
    if (P.t >= 0) {
      P.t = Math.min(1, P.t + dt / HOP_T);
      const e = P.t;
      P.rx = P.fx + (P.tx - P.fx) * e;
      P.rz = P.fz + (P.tz - P.fz) * e;
      P.ry = P.fy + (P.ty - P.fy) * e + Math.sin(Math.PI * e) * HOP_H;
      if (P.t >= 1) { P.t = -1; P.x = P.tx; P.z = P.tz; P.rx = P.x; P.rz = P.z; Land(); }
    } else if (P.log) {
      P.off += (P.slot - P.off) * Math.min(1, dt * 14);
      P.x = P.log.x + P.off;
      P.rx = P.x;
      P.ry = WATER_H + LOG_TOP - Math.sin(P.log.bob * Math.PI) * 0.06;
      if (Math.abs(P.x) > HALF + 0.7) { Die('edge', 0); return; }
    }
    if (P.dead) return;
    P.sq += ((GS.charge >= 0 ? 1 : 0) - P.sq) * Math.min(1, dt * 30);
    P.land = Math.max(0, P.land - dt * 7);
    const L = GS.lanes.get(Math.round(P.rz));
    if (L && (L.type === 'road' || L.type === 'rail')) {
      for (const v of L.items) {
        if (P.rx + 0.25 > v.x && P.rx - 0.25 < v.x + v.len) { Die(L.type === 'road' ? 'car' : 'train', L.dir); return; }
      }
    }
    if (P.rz < GS.cz - BACK) Die('eagle', 0);
  }

  function UpdateDeath(dt) {
    P.dt += dt;
    const e = GS.eagle;
    if (e) {
      e.z -= 17 * dt;
      e.flap += dt * 16;
      if (!e.got && e.z <= P.rz) { e.got = true; P.hide = true; Emit(0, P.rx, P.ry + 0.4, P.rz, 10, 0); }
      e.y = e.got ? 1.1 + (P.rz - e.z) * 0.12 : 1.1 + (e.z - P.rz) * 0.24;
    }
    if (P.dt > (e ? 1.5 : 1.05)) GameOver();
  }

  function UpdateCamera(dt) {
    if (GS.moved && !P.dead) GS.cz += (0.55 + Math.min(0.4, GS.score * 0.002)) * dt;
    if (P.rz > GS.cz) GS.cz += (P.rz - GS.cz) * Math.min(1, dt * 3.5);
    GS.cx += (Math.max(-2, Math.min(2, P.rx * 0.5)) - GS.cx) * Math.min(1, dt * 3);
  }

  function Draw() {
    if (!_ctx || !GS) return;
    const dark = document.getElementById('gf-cr')?.dataset.theme === 'dark';
    if (dark !== _dark) { _dark = dark; C = dark ? NIGHT : DAY; _spr.clear(); _shade.clear(); }
    X = _ctx;
    X.setTransform(RES, 0, 0, RES, 0, 0);
    X.lineWidth = 0.6; X.lineJoin = 'round';
    const sh = GS.shake * 14;
    OX = CV_W / 2 - (GS.cx * YC + GS.cz * YS) * TS + (Math.random() - 0.5) * sh;
    OY = FOCUS_Y + (GS.cz * YC - GS.cx * YS) * PS * TS + (Math.random() - 0.5) * sh;
    X.fillStyle = C.grass[0];
    X.fillRect(0, 0, CV_W, CV_H);
    const zc = Math.floor(GS.cz), zt = zc + 12, zb = zc - 9;
    DrawGround(zt, zb);
    DrawShadows(zt, zb);
    if (P.flat) { const f = Math.min(1, P.dt * 12); Chicken(P.rx, P.ry, P.rz, P.face, 1 + 0.4 * f, 1 - 0.86 * f); }
    DrawObjects(zt, zb);
    DrawParticles();
    if (GS.eagle) DrawEagle();
    if (C.night) {
      if (!_vig) {
        _vig = X.createRadialGradient(CV_W / 2, CV_H * 0.55, 160, CV_W / 2, CV_H * 0.55, 520);
        _vig.addColorStop(0, 'rgba(4,8,24,0)'); _vig.addColorStop(1, 'rgba(4,8,24,0.5)');
      }
      X.fillStyle = _vig;
      X.fillRect(0, 0, CV_W, CV_H);
    }
    if (GS.status !== 'start') DrawHud();
  }

  function DrawGround(zt, zb) {
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L) continue;
      const N = GS.lanes.get(z - 1), h = L.h, hn = N ? N.h : h, t = L.type;
      X.beginPath();
      SubStrip(-15, 15, z - 0.5, z + 0.5, h);
      FillPath(t === 'grass' ? C.grass[z & 1] : t === 'road' ? C.road : t === 'rail' ? C.rail : C.water, true);
      if (hn < h) {
        X.beginPath();
        SubFront(-15, 15, z - 0.5, hn, h);
        FillPath(t === 'grass' ? C.grassSide : t === 'road' ? C.roadSide : C.railSide, true);
      }
      if (t === 'grass') {
        for (const d of L.deco) Blit(Spr(30 + d.k, DecoModel, d.k), d.x, h, d.z);
      } else if (t === 'road') {
        if (N && N.type === 'road') {
          X.beginPath();
          for (let x = -15; x < 15; x += 1.6) SubStrip(x, x + 0.75, z - 0.535, z - 0.465, 0);
          FillPath(C.dash, false);
        }
      } else if (t === 'rail') {
        X.beginPath();
        for (let x = -15; x < 15; x += 0.62) SubStrip(x, x + 0.26, z - 0.42, z + 0.42, 0);
        FillPath(C.sleeper, false);
        X.beginPath();
        SubFront(-15, 15, z - 0.3, 0, 0.07); SubFront(-15, 15, z + 0.17, 0, 0.07);
        FillPath(C.steelSide, false);
        X.beginPath();
        SubStrip(-15, 15, z - 0.3, z - 0.23, 0.07); SubStrip(-15, 15, z + 0.17, z + 0.24, 0.07);
        FillPath(C.steel, false);
      } else {
        const F = GS.lanes.get(z + 1);
        X.beginPath();
        if (!F || F.h > h) SubStrip(-15, 15, z + 0.36, z + 0.5, h);
        const off = GS.time * L.speed * 0.5 + L.seed;
        for (let i = 0; i < 8; i++) {
          const x = ((i * 4.1 + off) % 32 + 32) % 32 - 16, zz = z - 0.32 + ((i * 5) % 7) * 0.09;
          SubStrip(x, x + 0.6, zz, zz + 0.045, h);
        }
        FillPath(C.ripple, false);
        if (!F || F.h > h) { X.beginPath(); SubStrip(-15, 15, z + 0.4, z + 0.5, h); FillPath(C.foam, false); }
      }
      X.beginPath();
      SubStrip(-15, -HALF - 0.5, z - 0.5, z + 0.5, h); SubStrip(HALF + 0.5, 15, z - 0.5, z + 0.5, h);
      if (hn < h) { SubFront(-15, -HALF - 0.5, z - 0.5, hn, h); SubFront(HALF + 0.5, 15, z - 0.5, hn, h); }
      FillPath(C.oob, false);
    }
  }

  function DrawShadows(zt, zb) {
    X.beginPath();
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L) continue;
      if (L.type === 'grass') {
        for (const o of L.obs) SubStrip(o.x - 0.3, o.x + (o.kind ? 0.5 : 0.62 + o.v * 0.12), z - 0.37, z + 0.26, L.h);
      } else if (L.type === 'road' || L.type === 'rail') {
        for (const v of L.items) SubStrip(v.x + 0.08, v.x + v.len + 0.24, z - 0.4, z + 0.3, 0);
      }
      if (L.coin && !L.coin.got) SubStrip(L.coin.x - 0.13, L.coin.x + 0.18, z - 0.1, z + 0.1, L.h);
    }
    if (!P.hide && !P.flat) {
      const L = GS.lanes.get(Math.round(P.rz));
      const gy = P.log ? P.ry : L ? (L.type === 'river' ? WATER_H : L.h) : 0;
      const r = 0.25 * (1 - Math.min(0.45, Math.max(0, P.ry - gy) * 0.9));
      if (!(P.dead === 'water' || P.dead === 'edge')) SubStrip(P.rx - r, P.rx + r + 0.08, P.rz - r - 0.04, P.rz + r - 0.04, gy);
    }
    if (GS.eagle) {
      const e = GS.eagle, k = Math.max(0.3, 1 - e.y * 0.15);
      SubStrip(e.x - 1.7 * k, e.x + 1.9 * k, e.z - 0.5 * k, e.z + 0.8 * k, 0);
    }
    FillPath(C.shadow, false);
    if (!C.night) return;
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L || (L.type !== 'road' && L.type !== 'rail')) continue;
      const s = Spr(L.dir > 0 ? 71 : 70, BeamModel, L.dir);
      for (const v of L.items) Blit(s, L.dir > 0 ? v.x + v.len : v.x, 0, z);
    }
  }

  function DrawObjects(zt, zb) {
    const pz = P.hide || P.flat ? 1e9 : Math.ceil(P.rz - 0.001);
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (L) DrawLane(L, z === pz);
    }
  }

  function DrawLane(L, withP) {
    const z = L.z;
    if (L.type === 'river' || L.type === 'lily') {
      if (L.pads) { for (let c = 0; c < 9; c++) if (L.pads[c]) Blit(Spr(40, PadModel), c - HALF, WATER_H, z); }
      else for (const v of L.items) Blit(Spr(60 + v.len, LogModel, v.len), v.x, WATER_H - Math.sin(v.bob * Math.PI) * 0.06, z);
      if (withP) DrawPlayer();
      return;
    }
    const grass = L.type === 'grass', list = grass ? L.obs : L.items;
    let pd = !withP, cd = !L.coin || L.coin.got;
    for (const o of list) {
      const ox = grass ? o.x : o.x + o.len * 0.5;
      if (!cd && L.coin.x < ox) { DrawCoin(L); cd = true; }
      if (!pd && P.rx < ox) { DrawPlayer(); pd = true; }
      if (grass) Blit(o.kind ? Spr(20, RockModel) : Spr(10 + o.v, TreeModel, o.v), o.x, L.h, z);
      else if (L.type === 'road') DrawVehicle(o, L);
      else Blit(Spr(300 + o.n * 2 + (L.dir > 0 ? 1 : 0), TrainModel, o.n, L.dir), o.x, 0, z);
    }
    if (!cd) DrawCoin(L);
    if (!pd) DrawPlayer();
    if (L.type === 'rail') DrawSignal(L);
  }

  function DrawVehicle(v, L) {
    Blit(Spr(100 + v.kind * 40 + v.ci * 2 + (L.dir > 0 ? 1 : 0), VehModel, v.kind, v.ci, L.dir), v.x, 0, L.z);
    if (!v.g) return;
    const half = (v.len - 0.9) / 2, px = v.x + (L.dir > 0 ? half : v.len - half), pz = L.z - 0.4;
    X.setTransform(RES, RES * SLOPE, 0, RES, SX(px, pz) * RES, (GY(px, pz) - 0.65 * HY) * RES);
    X.fillStyle = v.tc; X.font = FONT_TRUCK; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(v.g.label, 0, 0);
    X.setTransform(RES, 0, 0, RES, 0, 0);
  }

  function DrawPlayer() {
    let sy, k;
    if (P.t >= 0) { const s = Math.sin(Math.PI * P.t); sy = 1 + 0.14 * s; k = 1 - 0.06 * s; }
    else { sy = 1 - 0.3 * P.sq - 0.18 * P.land; k = 1 + 0.12 * P.sq + 0.08 * P.land; }
    let y = P.ry;
    if (P.dead === 'water' || P.dead === 'edge') {
      if (P.dt > 0.3) return;
      y -= P.dt * 1.6;
      k *= 1 - P.dt * 1.5;
    }
    Chicken(P.rx, y, P.rz, P.face, k, sy);
  }

  function DrawCoin(L) {
    const c = L.coin, y = L.h + 0.44 + Math.sin(GS.time * 3 + c.x) * 0.05;
    const sx = SX(c.x, L.z), sy = GY(c.x, L.z) - y * HY;
    const w = Math.abs(Math.cos(GS.time * 2.4 + c.x * 0.7)), r = 11;
    X.fillStyle = c.rim;
    X.beginPath(); X.ellipse(sx + 1.6 * (1 - w) + 0.8, sy + 0.8, Math.max(2, r * w + 1.2), r + 0.8, 0, 0, Math.PI * 2); X.fill();
    X.fillStyle = c.col;
    X.beginPath(); X.ellipse(sx, sy, Math.max(1, r * w), r, 0, 0, Math.PI * 2); X.fill();
    if (w < 0.5) return;
    X.strokeStyle = 'rgba(255,255,255,0.55)'; X.lineWidth = 1.2;
    X.beginPath(); X.ellipse(sx, sy, r * w - 2.5, r - 2.5, 0, 0, Math.PI * 2); X.stroke();
    X.lineWidth = 0.6;
    X.setTransform(RES * w, 0, 0, RES, sx * RES, sy * RES);
    X.fillStyle = '#1f2937'; X.font = FONT_COIN; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(c.t, 0, 0.5);
    X.setTransform(RES, 0, 0, RES, 0, 0);
  }

  function DrawSignal(L) {
    const x = -HALF - 0.8, z = L.z - 0.43;
    Blit(Spr(50, SignalModel), x, 0, z);
    const ph = Math.floor(GS.time * 5) & 1;
    for (let i = 0; i < 2; i++) {
      const lx = x - 0.12 + i * 0.24, sx = SX(lx, z - 0.08), sy = GY(lx, z - 0.08) - 1.125 * HY;
      const on = L.warn && ph === i;
      X.fillStyle = on ? '#ff4033' : C.lampOff;
      X.beginPath(); X.arc(sx, sy, 3.6, 0, Math.PI * 2); X.fill();
      if (on) Blit(Spr(51, GlowModel), lx, 1.125, z - 0.08);
    }
    if (L.ring > 0) {
      const sx = SX(x, z - 0.08), sy = GY(x, z - 0.08) - 1.125 * HY;
      X.globalAlpha = L.ring * 0.7; X.strokeStyle = '#ffd65a'; X.lineWidth = 2;
      X.beginPath(); X.arc(sx, sy, 10 + (1 - L.ring) * 14, 0, Math.PI * 2); X.stroke();
      X.globalAlpha = 1; X.lineWidth = 0.6;
    }
  }

  function DrawEagle() {
    const e = GS.eagle;
    if (e.got) Chicken(e.x, e.y - 0.78, e.z, 2, 1, 1);
    Eagle(e.x, e.y, e.z, e.flap);
  }

  function DrawParticles() {
    for (const p of PARTS) {
      if (p.t >= p.life) continue;
      const a = 1 - p.t / p.life, sx = SX(p.x, p.z), sy = GY(p.x, p.z) - p.y * HY;
      X.globalAlpha = Math.min(1, a * 1.6);
      if (p.k === 2) {
        const r = (0.18 + p.t * 1.1) * TS;
        X.strokeStyle = p.c; X.lineWidth = 2.5 * a + 0.5;
        X.beginPath(); X.ellipse(sx, sy, r, r * PS * 0.85, 0, 0, Math.PI * 2); X.stroke();
        X.lineWidth = 0.6;
      } else {
        const w = p.k === 0 ? p.s * (0.3 + 0.7 * Math.abs(Math.cos(p.t * 8 + p.ph))) : p.s;
        X.fillStyle = p.c;
        X.fillRect(sx - w / 2, sy - p.s / 2, w, p.k === 0 ? p.s * 0.55 : p.s);
      }
    }
    X.globalAlpha = 1;
  }

  function DrawHud() {
    X.textBaseline = 'top'; X.textAlign = 'left';
    X.font = FONT_HUD;
    const s = String(GS.score);
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(s, 21, 13);
    X.fillStyle = '#ffffff'; X.fillText(s, 18, 10);
    X.font = FONT_SM;
    const b = Math.max(GS.best, GS.score);
    if (b !== _topN) { _topN = b; _topS = `${_GameText('game_best').toUpperCase()} ${b}`; }
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(_topS, 21, 61);
    X.fillStyle = '#ffffff'; X.fillText(_topS, 20, 60);
    const cx = CV_W - 28, cy = 30;
    X.fillStyle = '#b8860b';
    X.beginPath(); X.arc(cx + 1.5, cy + 1.5, 11, 0, Math.PI * 2); X.fill();
    X.fillStyle = '#ffcf3f';
    X.beginPath(); X.arc(cx, cy, 11, 0, Math.PI * 2); X.fill();
    X.strokeStyle = '#fff4c2'; X.lineWidth = 1.5;
    X.beginPath(); X.arc(cx, cy, 7.5, 0, Math.PI * 2); X.stroke();
    X.lineWidth = 0.6;
    X.font = FONT_NUM; X.textAlign = 'right'; X.textBaseline = 'middle';
    const n = String(GS.bank);
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(n, cx - 18, cy + 3);
    X.fillStyle = '#ffffff'; X.fillText(n, cx - 20, cy + 1);
  }

  function StartLoop() {
    StopLoop();
    GS.lastTs = performance.now();
    _raf = requestAnimationFrame(Frame);
  }
  function Frame(ts) {
    if (!GS || GS.status === 'paused') { _raf = null; return; }
    const dt = Math.max(0, Math.min(ts - GS.lastTs, 50)) / 1000;
    GS.lastTs = ts;
    if (dt > 0) Update(dt);
    Draw();
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-cr-start', 'gf-cr-pause', 'gf-cr-gameover'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    NewGameState();
    SetText('gf-cr-best', GS.best);
    ShowScreen('gf-cr-start');
    StartLoop();
  }

  function BeginPlay() {
    if (GS.status !== 'start') return;
    GS.status = 'playing';
    ShowScreen(null);
  }

  function DoStart() {
    NewGameState();
    GS.status = 'playing';
    ShowScreen(null);
    StartLoop();
  }

  function GameOver() {
    GS.status = 'gameover';
    const best = Math.max(GS.best, GS.score), isNew = GS.score > GS.best;
    if (isNew) StorageSet(LS_BEST, GS.score);
    SetText('gf-cr-best', best);
    SetText('gf-cr-go-score', GS.score);
    SetText('gf-cr-go-best', best);
    SetText('gf-cr-go-coins', GS.coins);
    SetText('gf-cr-go-why', _GameText(`cr_death_${P.dead}`));
    const el = document.getElementById('gf-cr-go-new');
    if (el) el.style.display = isNew ? 'block' : 'none';
    ShowScreen('gf-cr-gameover');
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; GS.charge = -1; GS.chargeKey = ''; StopLoop(); ShowScreen('gf-cr-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-cr')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const down = e.type === 'keydown', dir = KEYDIR[e.key];
    if (dir !== undefined) {
      e.preventDefault(); e.stopPropagation();
      if (!down) { if (e.code === GS.chargeKey) Release(); return; }
      if (e.repeat) return;
      WakeAudio();
      Press(dir, e.code);
      return;
    }
    if (!down) return;
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeCross();
    } else if (k === 'p' || k === 'P') {
      e.preventDefault(); e.stopPropagation();
      DoPause();
    } else if (k === 'r' || k === 'R') {
      e.preventDefault(); e.stopPropagation();
      WakeAudio();
      DoStart();
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault(); e.stopPropagation();
      WakeAudio();
      if (GS.status === 'start') BeginPlay();
      else if (GS.status === 'gameover') DoStart();
      else if (GS.status === 'paused') DoPause();
    }
  }

  function OnPtrDown(e) {
    if (!GS || e.button > 0 || GS.status !== 'playing' || P.dead) return;
    e.preventDefault();
    WakeAudio();
    _ptr = { id: e.pointerId, x: e.clientX, y: e.clientY };
    _cv.setPointerCapture(e.pointerId);
    Press(0, 'ptr');
  }
  function OnPtrUp(e) {
    if (!_ptr || e.pointerId !== _ptr.id) return;
    const dx = e.clientX - _ptr.x, dy = e.clientY - _ptr.y;
    _ptr = null;
    if (GS.chargeKey !== 'ptr') return;
    if (e.type === 'pointercancel') { GS.charge = -1; GS.chargeKey = ''; return; }
    if (dx * dx + dy * dy > 576) GS.charge = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
    Release();
  }

  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); document.addEventListener('keyup', _kh, true); }
  function DetachKeys() { if (_kh) { document.removeEventListener('keydown', _kh, true); document.removeEventListener('keyup', _kh, true); _kh = null; } }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-cr');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    if (GS && GS.status !== 'playing') Draw();
  }

  function Fit() {
    if (!_cv) return;
    const hh = document.getElementById('gf-cr-hdr')?.offsetHeight || 41;
    const k = Math.min(1, (W.innerWidth - 34) / CV_W, (W.innerHeight - 34 - hh) / CV_H);
    const w = Math.max(240, Math.floor(CV_W * k)), h = Math.round(w * CV_H / CV_W);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    const res = Math.min(3, Math.max(1, (w / CV_W) * (W.devicePixelRatio || 1)));
    if (Math.abs(res - RES) > 0.01) { RES = res; _spr.clear(); }
    const bw = Math.round(CV_W * RES), bh = Math.round(CV_H * RES);
    if (_cv.width !== bw || _cv.height !== bh) { _cv.width = bw; _cv.height = bh; }
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-cr')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-cr';
    root.innerHTML = `
<div id="gf-cr-modal">
  <div id="gf-cr-hdr">
    <div class="gf-cr-hl">
      <div id="gf-cr-logo">CG</div>
      <span id="gf-cr-title">${_GameText('cr_title')}</span>
    </div>
    <div class="gf-cr-hr">
      <span id="gf-cr-best-hdr"><span class="gf-cr-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-cr-best">0</span></span>
      <button id="gf-cr-sound-btn" title="${_GameText('cr_sound')}"></button>
      <button id="gf-cr-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-cr-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-cr-body">
    <div id="gf-cr-view"></div>

    <div id="gf-cr-start" class="gf-cr-scr">
      <div class="gf-cr-head">
        <div class="gf-cr-name">${_GameText('cr_title')}</div>
        <div class="gf-cr-tag">${_GameText('cr_subtitle')}</div>
      </div>
      <div class="gf-cr-card">
        <div class="gf-cr-rules">
          <span><i class="gf-cr-dot" style="background:#4ade80"></i>${_GameText('cr_rule_coins')}</span>
          <span><i class="gf-cr-dot" style="background:#f87171"></i>${_GameText('cr_rule_avoid')}</span>
          <span><i class="gf-cr-dot" style="background:#a78bfa"></i>${_GameText('cr_rule_eagle')}</span>
        </div>
        <div class="gf-cr-hint">${_GameText('cr_start_hint')}</div>
      </div>
    </div>

    <div id="gf-cr-pause" class="gf-cr-scr" style="display:none">
      <div class="gf-cr-card">
        <div class="gf-cr-big">${_GameText('game_paused')}</div>
        <button class="gf-cr-btn" id="gf-cr-resume">▶&nbsp; ${_GameText('game_resume')}</button>
      </div>
    </div>

    <div id="gf-cr-gameover" class="gf-cr-scr" style="display:none">
      <div class="gf-cr-card">
        <div class="gf-cr-go">${_GameText('game_gameover')}</div>
        <div class="gf-cr-why" id="gf-cr-go-why"></div>
        <div class="gf-cr-stats">
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('game_score').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-score">0</div></div>
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('game_best').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-best">0</div></div>
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('cr_coins').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-coins">0</div></div>
        </div>
        <div id="gf-cr-go-new" class="gf-cr-new" style="display:none">${_GameText('game_new_best')}</div>
        <button class="gf-cr-btn" id="gf-cr-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _cv = document.createElement('canvas');
    _cv.style.cssText = `display:block;width:${CV_W}px;height:${CV_H}px;touch-action:none;cursor:pointer`;
    document.getElementById('gf-cr-view').attachShadow({ mode: 'open' }).appendChild(_cv);
    _icon = document.getElementById('gf-cr-sound-btn').appendChild(document.createElement('span')).attachShadow({ mode: 'open' });
    _ctx = _cv.getContext('2d');
    BindButtons();
    SyncSoundBtn();
  }

  function BindButtons() {
    document.getElementById('gf-cr-close')?.addEventListener('click', CloseGradeCross);
    document.getElementById('gf-cr-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-cr-sound-btn')?.addEventListener('click', ToggleSound);
    document.getElementById('gf-cr-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-cr-retry')?.addEventListener('click', () => { WakeAudio(); DoStart(); });
    _cv.addEventListener('pointerdown', OnPtrDown);
    _cv.addEventListener('pointerup', OnPtrUp);
    _cv.addEventListener('pointercancel', OnPtrUp);
    const st = document.getElementById('gf-cr-start');
    st?.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); WakeAudio(); BeginPlay(); });
  }

  function OpenGradeCross(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-cr')) BuildOverlay();
    document.getElementById('gf-cr').style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    ShowStart();
    Fit();
  }

  function CloseGradeCross() {
    const el = document.getElementById('gf-cr');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function ToggleGradeCross(grades) {
    const el = document.getElementById('gf-cr');
    if (el && el.style.display !== 'none') CloseGradeCross(); else OpenGradeCross(grades);
  }

  function BossKeyGradeCross() {
    const el = document.getElementById('gf-cr');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS && GS.status !== 'paused') StartLoop();
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') DoPause();
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeCross = OpenGradeCross;
  W.CloseGradeCross = CloseGradeCross;
  W.ToggleGradeCross = ToggleGradeCross;
  W.BossKeyGradeCross = BossKeyGradeCross;

  function InjectCSS() {
    if (document.getElementById('gf-cr-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-cr-css';
    s.textContent = `
#gf-cr {
  --cr-modal:#fff;--cr-hdr:#f5f5f5;--cr-scr:rgba(255,255,255,0.94);
  --cr-brd:rgba(34,197,94,0.25);--cr-brd2:#e0e0e0;--cr-btn-brd:#d0d0d0;
  --cr-txt:#111;--cr-txt2:#555;--cr-txt3:#999;
  --cr-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-cr[data-theme="dark"] {
  --cr-modal:rgba(13,13,13,0.97);--cr-hdr:rgba(8,8,8,0.95);
  --cr-scr:rgba(12,14,18,0.93);--cr-brd:rgba(34,197,94,0.2);--cr-brd2:#262626;
  --cr-btn-brd:#333;--cr-txt:#f5f5f5;--cr-txt2:#cbd5e1;--cr-txt3:#8a94a6;
  --cr-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-cr{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-cr-modal{position:relative;display:flex;flex-direction:column;background:var(--cr-modal);border:1px solid var(--cr-brd);border-radius:12px;box-shadow:var(--cr-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-cr-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--cr-hdr);border-bottom:1px solid var(--cr-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-cr-hl,.gf-cr-hr{display:flex;align-items:center;gap:8px;}
#gf-cr-logo{width:24px;height:24px;background:#22c55e;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#0b2e16;letter-spacing:-1px;flex-shrink:0;box-shadow:inset 0 -3px 0 rgba(0,0,0,0.18);}
#gf-cr-title{font-size:13px;font-weight:700;color:var(--cr-txt);letter-spacing:-0.3px;}
#gf-cr-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--cr-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--cr-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-cr-best-lbl{font-size:8px;font-weight:700;color:var(--cr-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-cr-sound-btn,#gf-cr-pause-btn,#gf-cr-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--cr-btn-brd);border-radius:6px;background:transparent;color:var(--cr-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-cr-sound-btn.on{color:#22c55e;border-color:rgba(34,197,94,0.5);}
#gf-cr-sound-btn:hover,#gf-cr-pause-btn:hover{border-color:#22c55e;color:#22c55e;background:rgba(34,197,94,.10);}
#gf-cr-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-cr-body{position:relative;line-height:0;flex-shrink:0;}
#gf-cr-view{display:block;}
#gf-cr-sound-btn span{display:flex;}
.gf-cr-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;overflow-y:auto;line-height:1.35;text-align:center;background:rgba(6,12,24,0.3);}
#gf-cr-start{justify-content:space-between;cursor:pointer;padding:26px 18px 18px;background:linear-gradient(180deg,rgba(6,12,24,0.42) 0%,rgba(6,12,24,0) 32%,rgba(6,12,24,0) 60%,rgba(6,12,24,0.38) 100%);}
.gf-cr-head{display:flex;flex-direction:column;align-items:center;gap:12px;}
.gf-cr-name{font-size:46px;font-weight:800;color:#fff;letter-spacing:1px;line-height:1;text-shadow:0 2px 0 #22c55e,0 4px 0 #16a34a,0 6px 0 #15803d,0 8px 0 #166534,0 14px 20px rgba(0,0,0,0.4);}
.gf-cr-tag{font-size:12px;font-weight:700;color:#fff;background:rgba(0,0,0,0.35);padding:4px 12px;border-radius:999px;letter-spacing:0.2px;}
.gf-cr-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 24px;background:var(--cr-scr);border:1px solid var(--cr-brd2);border-radius:14px;box-shadow:var(--cr-sh);max-width:calc(100% - 16px);}
.gf-cr-rules{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;font-size:11px;font-weight:700;color:var(--cr-txt2);}
.gf-cr-rules span{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(128,128,128,0.1);}
.gf-cr-dot{display:inline-block;width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.gf-cr-hint{font-size:11px;color:var(--cr-txt3);max-width:460px;}
.gf-cr-big{font-size:22px;font-weight:800;letter-spacing:4px;color:var(--cr-txt);}
.gf-cr-go{font-size:30px;font-weight:800;color:#f87171;letter-spacing:3px;line-height:1.05;text-shadow:0 3px 0 rgba(127,29,29,0.35);}
.gf-cr-why{font-size:12px;font-weight:700;color:var(--cr-txt2);margin-top:-4px;}
.gf-cr-stats{display:grid;grid-template-columns:repeat(3,minmax(84px,1fr));gap:10px;}
.gf-cr-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 12px;border:1px solid var(--cr-brd2);border-radius:9px;background:rgba(128,128,128,0.1);}
.gf-cr-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--cr-txt3);line-height:1;}
.gf-cr-val{font-size:26px;font-weight:800;color:var(--cr-txt);line-height:1;}
.gf-cr-new{font-size:11px;font-weight:800;color:#d97706;letter-spacing:2px;animation:gf-cr-pulse 0.8s ease-in-out infinite alternate;}
@media (max-width:640px),(max-height:460px){.gf-cr-name{font-size:28px}.gf-cr-scr{gap:8px;padding:10px}#gf-cr-start{padding:12px 10px 10px}.gf-cr-card{padding:10px 14px;gap:8px}.gf-cr-go{font-size:22px}.gf-cr-val{font-size:18px}.gf-cr-stat{padding:6px 8px}.gf-cr-stats{grid-template-columns:repeat(3,minmax(64px,1fr))}.gf-cr-hint{display:none}}
@keyframes gf-cr-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
.gf-cr-btn{padding:10px 24px;border:1px solid #22c55e;border-radius:8px;background:rgba(34,197,94,0.14);color:#16a34a;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
#gf-cr[data-theme="dark"] .gf-cr-btn{color:#4ade80;}
.gf-cr-btn:hover{background:rgba(34,197,94,0.24);box-shadow:0 4px 18px rgba(34,197,94,0.28);transform:translateY(-1px);}
`;
    document.head.appendChild(s);
  }

})(window);
