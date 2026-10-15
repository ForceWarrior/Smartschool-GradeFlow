;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 360;
  const CV_H = 540;
  const TAU = Math.PI * 2;
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const HDR_H = 41;
  const HUD_H = 46;
  const F_LBL = `900 9.5px ${FONT}`;
  const F_SCORE = `900 42px ${FONT}`;
  const F_POP = `900 18px ${FONT}`;

  const LS_BEST = 'gf-flappy-best';

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }
  function SaveBest(s) { if (s > LoadBest()) StorageSet(LS_BEST, s); }

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

  const GRAVITY      = 0.0012;
  const FLAP_VEL     = -0.38;
  const BIRD_SIZE    = 22;
  const BIRD_X       = 55;
  const PIPE_W       = 36;
  const PIPE_CAP_H   = 14;
  const PIPE_CAP_OV  = 4;
  const BASE_GAP     = 100;
  const MIN_GAP      = 62;
  const GAP_SHRINK   = 0.6;
  const BASE_SPEED   = 0.1;
  const MAX_SPEED    = 0.22;
  const SPEED_INC    = 0.0008;
  const PIPE_SPACING = 140;
  const GROUND_H     = 32;
  const SKY_H        = CV_H - GROUND_H;
  const CLOUD_TW     = 540;
  const CITY_TW      = 420;
  const BUSH_TW      = 360;

  let GS = null, _raf = null, _grades = [], _kh = null, _last = 0, _best = 0;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _dark = false, _S = null, _medals = null;
  const _hud = { score: -1, best: -1, grade: null };

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
  function Night(s, a = 0.22) { return _dark ? Shade(s, `rgba(16,24,64,${a})`) : s; }
  function Blit(s, x, y) { _ctx.drawImage(s.c, Math.round((x - s.ax) * _k) / _k, Math.round((y - s.ay) * _k) / _k, s.w, s.h); }
  function BlitC(s, x, y, a, sc) { _ctx.save(); _ctx.translate(x, y); if (a) _ctx.rotate(a); if (sc !== 1) _ctx.scale(sc, sc); _ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h); _ctx.restore(); }

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

  function BirdArt(g, c, f) {
    const wa = [0.75, 0.05, -0.62][f];
    Poly(g, [-10, -3, -18, -7.5, -19, -1, -17, 3.5, -10, 3]); Fl(g, Dk(c, 0.16), 1.5);
    Ln(g, -17, -1.6, -12, -0.6, Dk(c, 0.35), 0.9);
    Ell(g, 0, 0, 13, 11); Fl(g, c, 1.8);
    g.save(); Ell(g, 0, 0, 13, 11); g.clip();
    Ell(g, 1, 10, 16, 6.5); g.fillStyle = Dk(c, 0.2); g.fill();
    Ell(g, 3, 4.5, 9, 6); g.fillStyle = Lt(c, 0.6); g.fill();
    Ell(g, -3.5, -7, 7, 3); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fill();
    g.restore();
    Ell(g, 0, 0, 13, 11); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
    Ell(g, 2.6, 3.4, 2.4, 1.4); g.fillStyle = 'rgba(244,114,182,0.5)'; g.fill();
    Circ(g, 5.6, -3.6, 4.7); Fl(g, '#ffffff', 1.4);
    Circ(g, 7.1, -3.3, 2.2); g.fillStyle = OUT; g.fill();
    Circ(g, 7.8, -4.2, 0.85); g.fillStyle = '#fff'; g.fill();
    Ell(g, 12.6, 4.6, 4.6, 2.1); Fl(g, '#ea580c', 1.3);
    Ell(g, 13.2, 1.6, 5.4, 2.5); Fl(g, '#fb923c', 1.3);
    Ln(g, 10, 0.8, 14.5, 0.7, 'rgba(255,255,255,0.55)', 0.9);
    Poly(g, [-1, -9.5, 8.5, -9.5, 7.6, -6.6, 0, -6.6]); Fl(g, '#20263a', 1.2);
    Poly(g, [-6, -11.6, 3.8, -15.8, 13.6, -11.6, 3.8, -7.6]); Fl(g, '#2f3650', 1.3);
    Ln(g, -2.5, -12.2, 4.2, -15, 'rgba(255,255,255,0.28)', 1);
    Ln(g, 3.8, -11.7, -3.6, -9.2, '#fbbf24', 1.1);
    Ln(g, -3.6, -9.2, -3.6, -6.4, '#fbbf24', 1.2);
    Circ(g, -3.6, -6, 1.3); Fl(g, '#fbbf24', 0.8);
    Circ(g, 3.8, -11.7, 1); g.fillStyle = '#fbbf24'; g.fill();
    g.save(); g.translate(-3, 2); g.rotate(wa);
    Ell(g, -4, 0, 8, 4.8); Fl(g, Lt(c, 0.32), 1.5);
    Ln(g, -9, 0.6, -2, 0.4, Dk(c, 0.12), 1);
    Ln(g, -8, 2.4, -3, 2.2, Dk(c, 0.12), 0.9);
    g.restore();
  }

  function PipeBody(c) {
    return Night(Spr(PIPE_W + 4, SKY_H, g => {
      g.translate(-(PIPE_W + 4) / 2, -SKY_H / 2);
      g.fillStyle = c; g.fillRect(2, 0, PIPE_W, SKY_H);
      g.fillStyle = Lt(c, 0.55); g.fillRect(6, 0, 5, SKY_H);
      g.fillStyle = Lt(c, 0.25); g.fillRect(11, 0, 4, SKY_H);
      g.fillStyle = Dk(c, 0.12); g.fillRect(PIPE_W - 8, 0, 4, SKY_H);
      g.fillStyle = Dk(c, 0.26); g.fillRect(PIPE_W - 4, 0, 5, SKY_H);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(7, 0, 1.4, SKY_H);
      g.fillStyle = OUT; g.fillRect(0.5, 0, 2, SKY_H); g.fillRect(PIPE_W + 1.5, 0, 2, SKY_H);
    }, SKY_H / 2), 0.2);
  }
  function PipeCap(c, top) {
    const w = PIPE_W + PIPE_CAP_OV * 2;
    return Night(Spr(w + 4, PIPE_CAP_H + 4, g => {
      g.translate(-(w + 4) / 2 + 2, -(PIPE_CAP_H + 4) / 2 + 2);
      RR(g, 0, 0, w, PIPE_CAP_H, top ? [1, 1, 4, 4] : [4, 4, 1, 1]); g.fillStyle = c; g.fill();
      g.save(); g.clip();
      g.fillStyle = Lt(c, 0.55); g.fillRect(3, 0, 6, PIPE_CAP_H);
      g.fillStyle = Lt(c, 0.25); g.fillRect(9, 0, 4, PIPE_CAP_H);
      g.fillStyle = Dk(c, 0.14); g.fillRect(w - 10, 0, 4, PIPE_CAP_H);
      g.fillStyle = Dk(c, 0.28); g.fillRect(w - 6, 0, 6, PIPE_CAP_H);
      g.fillStyle = top ? Dk(c, 0.3) : 'rgba(255,255,255,0.4)';
      g.fillRect(0, top ? PIPE_CAP_H - 2.5 : 0, w, 2.5);
      g.restore();
      RR(g, 0, 0, w, PIPE_CAP_H, top ? [1, 1, 4, 4] : [4, 4, 1, 1]); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    }, (PIPE_CAP_H + 4) / 2), 0.2);
  }

  function BlobRow(g, pts, outline, fills) {
    g.fillStyle = outline;
    for (const [x, y, r] of pts) { Circ(g, x, y, r + 1.6); g.fill(); }
    for (let i = 0; i < fills.length; i++) {
      const [c, dx, dy, sc] = fills[i];
      g.fillStyle = c;
      for (const [x, y, r] of pts) { Circ(g, x + dx * r, y + dy * r, r * sc); g.fill(); }
    }
  }

  function BuildSky() {
    const s = Cv(CV_W, SKY_H, _k), g = s.g;
    const gr = g.createLinearGradient(0, 0, 0, SKY_H);
    if (_dark) { gr.addColorStop(0, '#0a1230'); gr.addColorStop(0.6, '#1d2350'); gr.addColorStop(1, '#3a3570'); }
    else { gr.addColorStop(0, '#46b8e8'); gr.addColorStop(0.65, '#8fd8f5'); gr.addColorStop(1, '#d7f4ff'); }
    g.fillStyle = gr; g.fillRect(0, 0, CV_W, SKY_H);
    const R = Rng(7);
    if (_dark) {
      for (let i = 0; i < 90; i++) {
        const x = R() * CV_W, y = R() * SKY_H * 0.7, r = 0.4 + R() * 1.1;
        g.fillStyle = `rgba(255,255,240,${0.35 + R() * 0.6})`; Circ(g, x, y, r); g.fill();
      }
      for (let i = 0; i < 6; i++) { const x = R() * CV_W, y = R() * SKY_H * 0.5; Glow(g, x, y, 5, '#fff7d6', 0.6); Star(g, x, y, 2.6, 0.7, 4); g.fillStyle = '#fffbe8'; g.fill(); }
      Glow(g, 282, 78, 70, '#c7d2fe', 0.28);
      Circ(g, 282, 78, 22); Fl(g, '#f8f3d4', 1.8);
      g.save(); Circ(g, 282, 78, 22); g.clip();
      Circ(g, 292, 70, 22); g.fillStyle = 'rgba(214,206,170,0.35)'; g.fill();
      for (const [x, y, r] of [[274, 72, 4], [286, 88, 3], [276, 90, 2.2], [270, 82, 1.6]]) { Circ(g, x, y, r); g.fillStyle = '#e4dcb6'; g.fill(); }
      g.restore();
    } else {
      Glow(g, 290, 70, 90, '#fff6c9', 0.6);
      Circ(g, 290, 70, 20); g.fillStyle = '#fffbe6'; g.fill();
    }
    return s;
  }

  function BuildClouds(seed, z, n0) {
    const H = 170 * z, s = Cv(CLOUD_TW, H, _k), g = s.g, R = Rng(seed);
    const out = _dark ? 'rgba(10,14,40,0.55)' : 'rgba(43,34,54,0.16)';
    const base = _dark ? '#323b70' : '#ffffff', shade = _dark ? '#29305f' : '#d9eff9', hi = _dark ? '#3e4882' : '#ffffff';
    const list = [];
    for (let i = 0; i < n0; i++) {
      const cx = i * (CLOUD_TW / n0) + R() * 40, cy = (40 + R() * 100) * z, sc = (0.6 + R() * 0.7) * z;
      const pts = [];
      const n = 3 + (R() * 3 | 0);
      for (let j = 0; j < n; j++) pts.push([cx + (j - n / 2) * 13 * sc, cy - Math.sin(j / (n - 1) * Math.PI) * 9 * sc, (10 + R() * 8) * sc]);
      pts.push([cx - 8 * sc, cy + 4 * sc, 10 * sc], [cx + 10 * sc, cy + 5 * sc, 9 * sc]);
      list.push(pts);
    }
    for (const off of [-CLOUD_TW, 0, CLOUD_TW]) {
      for (const pts of list) {
        const p = pts.map(([x, y, r]) => [x + off, y, r]);
        BlobRow(g, p, out, [[shade, 0, 0, 1], [base, -0.08, -0.16, 0.9], [hi, -0.22, -0.32, 0.45]]);
      }
    }
    return s;
  }

  function Building(g, x, w, h, H, c, win, lit, R) {
    const y = H - h;
    g.fillStyle = c; g.fillRect(x, y, w, h);
    g.fillStyle = Dk(c, 0.08); g.fillRect(x + w - 4, y, 4, h);
    g.fillStyle = Lt(c, 0.2); g.fillRect(x, y, w, 2);
    g.lineWidth = 1.2; g.strokeStyle = Mix(c, OUT, _dark ? 0.5 : 0.32); g.strokeRect(x + 0.6, y + 0.6, w - 1.2, h);
    for (let wy = y + 6; wy < H - 8; wy += 10) {
      for (let wx = x + 4; wx < x + w - 6; wx += 7) {
        const on = lit && R() < 0.33;
        g.fillStyle = on ? '#fcd34d' : win;
        g.fillRect(wx, wy, 3.4, 5);
        if (on) { g.fillStyle = 'rgba(252,211,77,0.18)'; g.fillRect(wx - 1.5, wy - 1.5, 6.4, 8); }
      }
    }
  }
  function BuildCity() {
    const H = 150, s = Cv(CITY_TW, H, _k), g = s.g, R = Rng(41);
    const cols = _dark ? ['#25315c', '#1e2851', '#2b3868'] : ['#b6e0d9', '#a4d6cd', '#c4e8e2'];
    const win = _dark ? '#34426f' : '#e3f5f2';
    const blds = [];
    let x = 0;
    while (x < CITY_TW) {
      const w = 22 + R() * 26, h = 36 + R() * 70;
      blds.push([x, w, h, cols[blds.length % 3]]);
      x += w + R() * 3;
    }
    for (const off of [-CITY_TW, 0, CITY_TW]) {
      const r2 = Rng(77);
      for (const [bx, w, h, c] of blds) {
        if (bx + off > CITY_TW + 4 || bx + w + off < -4) continue;
        Building(g, bx + off, w, h, H, c, win, _dark, r2);
        if (h > 80) { Ln(g, bx + off + w * 0.5, H - h, bx + off + w * 0.5, H - h - 10, Mix(c, OUT, 0.4), 1.2); Circ(g, bx + off + w * 0.5, H - h - 11, 1.4); g.fillStyle = _dark ? '#f87171' : Mix(c, OUT, 0.4); g.fill(); }
      }
      const sx = 160 + off, sw = 74, sh = 64, sy = H - sh, sc = _dark ? '#3a3f6e' : '#f1e3c8';
      g.fillStyle = sc; g.fillRect(sx, sy, sw, sh);
      g.lineWidth = 1.4; g.strokeStyle = Mix(sc, OUT, 0.4); g.strokeRect(sx + 0.7, sy + 0.7, sw - 1.4, sh);
      Poly(g, [sx - 4, sy, sx + sw / 2, sy - 20, sx + sw + 4, sy]); g.fillStyle = _dark ? '#6b3a4f' : '#d9715a'; g.fill(); g.strokeStyle = Mix(sc, OUT, 0.45); g.stroke();
      Circ(g, sx + sw / 2, sy - 7, 5.4); g.fillStyle = _dark ? '#e7e2c8' : '#ffffff'; g.fill(); g.lineWidth = 1.1; g.stroke();
      Ln(g, sx + sw / 2, sy - 7, sx + sw / 2, sy - 10.5, OUT, 1); Ln(g, sx + sw / 2, sy - 7, sx + sw / 2 + 2.6, sy - 6, OUT, 1);
      Ln(g, sx + sw / 2, sy - 20, sx + sw / 2, sy - 34, Mix(sc, OUT, 0.5), 1.2);
      Poly(g, [sx + sw / 2, sy - 34, sx + sw / 2 + 11, sy - 31, sx + sw / 2, sy - 28]); g.fillStyle = '#4ade80'; g.fill();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        g.fillStyle = _dark && (i + j) % 2 ? '#fcd34d' : _dark ? '#4a4f82' : '#9fd3e6';
        g.fillRect(sx + 7 + i * 17, sy + 9 + j * 20, 9, 11);
      }
      RR(g, sx + sw / 2 - 7, H - 18, 14, 18, [6, 6, 0, 0]); g.fillStyle = _dark ? '#5a3b2d' : '#8b5a3c'; g.fill();
    }
    return s;
  }

  function BuildBushes() {
    const H = 48, s = Cv(BUSH_TW, H, _k), g = s.g, R = Rng(5);
    const pts = [];
    for (let x = 0; x < BUSH_TW; x += 14 + R() * 10) pts.push([x, H - 6 - R() * 12, 10 + R() * 12]);
    const all = [];
    for (const off of [-BUSH_TW, 0, BUSH_TW]) for (const [x, y, r] of pts) all.push([x + off, y, r]);
    const C = _dark ? ['#1d4d3c', '#256149', '#2f7656'] : ['#3fa34d', '#56bd5b', '#7fd66f'];
    BlobRow(g, all, OUT, [[C[0], 0, 0, 1], [C[1], -0.1, -0.12, 0.86], [C[2], -0.28, -0.38, 0.4]]);
    g.fillStyle = C[0]; g.fillRect(0, H - 8, BUSH_TW, 8);
    return s;
  }

  function BuildGround() {
    const w = CV_W + 48, s = Cv(w, GROUND_H, _k), g = s.g;
    const dirt = _dark ? ['#5f5638', '#3e3826'] : ['#e2d696', '#c9b86b'];
    _S.dirt = dirt[1];
    const gr = g.createLinearGradient(0, 0, 0, GROUND_H);
    gr.addColorStop(0, dirt[0]); gr.addColorStop(1, dirt[1]);
    g.fillStyle = gr; g.fillRect(0, 0, w, GROUND_H);
    const grass = _dark ? '#3d7f35' : '#74c43a', stripe = _dark ? '#4f9944' : '#9be35a';
    g.fillStyle = grass; g.fillRect(0, 0, w, 10);
    g.fillStyle = stripe;
    for (let x = -24; x < w + 24; x += 24) { Poly(g, [x, 1.5, x + 11, 1.5, x + 5, 9.5, x - 6, 9.5]); g.fill(); }
    g.fillStyle = Dk(grass, 0.35); g.fillRect(0, 9.5, w, 2);
    g.fillStyle = Lt(dirt[0], 0.3); g.fillRect(0, 11.5, w, 1.2);
    g.fillStyle = OUT; g.fillRect(0, 0, w, 1.8);
    const R = Rng(3), specks = [];
    for (let i = 0; i < 6; i++) specks.push([R() * 24, 15 + R() * 14, 0.8 + R() * 1.2]);
    for (let x = 0; x < w; x += 24) for (const [sx, sy, r] of specks) { Ell(g, x + sx, sy, r * 1.4, r); g.fillStyle = Dk(dirt[0], 0.14); g.fill(); }
    return s;
  }

  function BuildSprites() {
    const S = { bird: {}, body: {}, capT: {}, capB: {}, feather: {} };
    for (const c of COLORS) {
      S.bird[c] = [0, 1, 2].map(f => Night(Spr(42, 36, g => BirdArt(g, c, f), 18), 0.1));
      S.body[c] = PipeBody(c);
      S.capT[c] = PipeCap(c, true);
      S.capB[c] = PipeCap(c, false);
      S.feather[c] = Spr(12, 6, g => { Ell(g, 0, 0, 5, 2.2); Fl(g, Lt(c, 0.2), 1); Ln(g, -4, 0, 4, 0, Dk(c, 0.2), 0.7); });
    }
    S.puff = Spr(16, 16, g => { Circ(g, 0, 0, 6.5); g.fillStyle = _dark ? 'rgba(220,228,255,0.85)' : '#ffffff'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(43,34,54,0.25)'; g.stroke(); });
    S.spark = Spr(18, 18, g => { Glow(g, 0, 0, 9, '#fde047', 0.7); Star(g, 0, 0, 7, 2, 4); Fl(g, '#fef08a', 1.1); });
    S.aura = Spr(64, 64, g => Glow(g, 0, 0, 32, '#4ade80', 0.4));
    S.sky = BuildSky();
    S.clouds = BuildClouds(19, 1, 7);
    S.far = BuildClouds(23, 0.55, 5);
    S.city = BuildCity();
    S.bushes = BuildBushes();
    _S = S;
    S.ground = BuildGround();
    S.vign = Cv(CV_W, CV_H, _k);
    const vg = S.vign.g.createRadialGradient(CV_W / 2, CV_H * 0.45, CV_H * 0.3, CV_W / 2, CV_H * 0.45, CV_H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, _dark ? 'rgba(4,6,22,0.45)' : 'rgba(20,40,80,0.12)');
    S.vign.g.fillStyle = vg; S.vign.g.fillRect(0, 0, CV_W, CV_H);
    _S = S;
  }

  function MedalArt(g, tier) {
    if (!tier) {
      Circ(g, 0, 4, 17); g.setLineDash([3, 3]); g.lineWidth = 2; g.strokeStyle = 'rgba(128,128,128,0.55)'; g.stroke(); g.setLineDash([]);
      return;
    }
    const C = [null, ['#e08b3a', '#b45309'], ['#e2e8f0', '#94a3b8'], ['#facc15', '#ca8a04'], ['#a5f3fc', '#22d3ee']][tier];
    Poly(g, [-10, -24, -2, -24, 4, -8, -4, -8]); Fl(g, '#3b82f6', 1.3);
    Poly(g, [10, -24, 2, -24, -4, -8, 4, -8]); Fl(g, '#ef4444', 1.3);
    Circ(g, 0, 6, 17); Fl(g, C[1], 1.8);
    Circ(g, 0, 6, 13.5); Fl(g, C[0], 1.2);
    Star(g, 0, 6.5, 8, 3.6); Fl(g, Lt(C[0], 0.45), 1.2);
    g.beginPath(); g.arc(0, 6, 11, Math.PI * 1.1, Math.PI * 1.55); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.8; g.stroke();
  }
  function BuildMedals() {
    return [0, 1, 2, 3, 4].map(t => Spr(48, 56, g => MedalArt(g, t), 26, 2).c.toDataURL());
  }
  function MedalTier(s) { return s >= 40 ? 4 : s >= 30 ? 3 : s >= 20 ? 2 : s >= 10 ? 1 : 0; }

  const PN = 120;
  const _P = Array.from({ length: PN }, () => ({ on: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, T: 1, s: 1, ds: 0, r: 0, vr: 0, c: '', c2: '' }));
  let _pi = 0;
  function Part(k, x, y, vx, vy, T, s, c, g = 0, ds = 0, vr = 0) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.T = T; p.t = 0; p.s = s; p.ds = ds; p.c = c; p.g = g; p.r = Math.random() * TAU; p.vr = vr;
    return p;
  }
  function ClearParts() { for (const p of _P) p.on = 0; }
  const _plus = {};
  function PlusStr(n) { return _plus[n] || (_plus[n] = `+${n}`); }

  function PickGrade() {
    const pool = _grades.length ? _grades : FallbackGrades();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function MakePipe(x) {
    const grade = PickGrade();
    const gap = Math.max(MIN_GAP, BASE_GAP - (GS ? GS.score * GAP_SHRINK : 0));
    const minTop = 40;
    const maxTop = CV_H - GROUND_H - gap - 40;
    const topH = minTop + Math.random() * Math.max(0, maxTop - minTop);
    const pct = grade.Pct != null ? Math.round(grade.Pct) : '?';
    return { x, topH, gap, grade, color: GradeColor(grade.Pct), scored: false, lbl: `${pct}%` };
  }

  function NewGameState() {
    const birdGrade = PickGrade();
    const pipes = [];
    GS = null;
    for (let i = 0; i < 4; i++) pipes.push(MakePipe(CV_W + i * PIPE_SPACING));
    return {
      status: 'start',
      birdY: CV_H * 0.4,
      birdVel: 0,
      birdGrade,
      birdColor: GradeColor(birdGrade.Pct),
      birdRotation: 0,
      pipes,
      score: 0,
      bgX: 0,
      wingT: 0,
      t: 0,
      flashAlpha: 0,
      shake: 0,
      deadT: 0,
      speedMod: 0,
      speedModTimer: 0,
      streakT: 0,
      _bossHidden: false,
    };
  }

  function GetSpeed() {
    const base = Math.min(MAX_SPEED, BASE_SPEED + (GS ? GS.score * SPEED_INC : 0));
    return Math.max(0.04, base + (GS ? GS.speedMod : 0));
  }

  function Flap() {
    if (!GS) return;
    if (GS.status !== 'start' && GS.status !== 'playing') return;
    if (GS.status === 'start') {
      GS.status = 'playing';
      ShowScreen(null);
      if (!_raf) StartLoop();
    }
    GS.birdVel = FLAP_VEL;
    GS.wingT = 0;
    const cx = BIRD_X + BIRD_SIZE / 2, cy = GS.birdY + BIRD_SIZE / 2;
    for (let i = 0; i < 3; i++) Part(0, cx - 12 - Math.random() * 4, cy + 4 + Math.random() * 4, -0.05 - Math.random() * 0.05, 0.02 + Math.random() * 0.04, 320 + Math.random() * 160, 0.35 + Math.random() * 0.25, '', 0, 0.0016);
    if (Math.random() < 0.3) Part(1, cx - 6, cy + 2, -0.06, 0.02, 900, 1, GS.birdColor, 0.00008, 0, (Math.random() - 0.5) * 0.01);
  }

  function Update(dt) {
    const speed = GetSpeed();

    GS.birdVel += GRAVITY * dt;
    GS.birdY += GS.birdVel * dt;

    const target = Math.max(-0.5, Math.min(1.35, GS.birdVel / 0.4 * 1.2));
    GS.birdRotation += (target - GS.birdRotation) * Math.min(1, dt * (target > GS.birdRotation ? 0.008 : 0.03));

    if (GS.speedModTimer > 0) {
      GS.speedModTimer -= dt;
      if (GS.speedModTimer <= 0) { GS.speedMod = 0; GS.speedModTimer = 0; }
    }

    GS.bgX += speed * dt;

    for (const p of GS.pipes) {
      p.x -= speed * dt;

      if (!p.scored && p.x + PIPE_W < BIRD_X) {
        p.scored = true;
        const Pct = p.grade.Pct ?? 50;
        let pts = 1;
        if (Pct >= 75) {
          pts = 2;
          GS.speedMod = -0.03;
          GS.speedModTimer = 800;
        } else if (Pct < 50) {
          GS.speedMod = 0.03;
          GS.speedModTimer = 800;
        }
        GS.score += pts;
        GS.birdGrade = p.grade;
        GS.birdColor = p.color;
        const gy = p.topH + p.gap / 2;
        Part(4, BIRD_X + BIRD_SIZE / 2, GS.birdY - 6, 0, -0.045, 750, 1, PlusStr(pts)).c2 = p.color;
        for (let i = 0; i < 5; i++) Part(2, p.x + PIPE_W / 2 + (Math.random() - 0.5) * 20, gy + (Math.random() - 0.5) * p.gap * 0.7, (Math.random() - 0.5) * 0.04, -0.02 - Math.random() * 0.04, 420 + Math.random() * 200, 0.5 + Math.random() * 0.5, '', 0, -0.0009);
        for (let i = 0; i < 6; i++) Part(1, BIRD_X + 6, GS.birdY + BIRD_SIZE / 2, -0.04 - Math.random() * 0.06, (Math.random() - 0.6) * 0.08, 700 + Math.random() * 300, 0.9, p.color, 0.00015, 0, (Math.random() - 0.5) * 0.02);
      }
    }

    while (GS.pipes.length > 0 && GS.pipes[0].x + PIPE_W < -10) {
      GS.pipes.shift();
      const last = GS.pipes[GS.pipes.length - 1];
      GS.pipes.push(MakePipe(last.x + PIPE_SPACING));
    }

    if (GS.speedMod > 0) {
      GS.streakT -= dt;
      if (GS.streakT <= 0) { GS.streakT = 40; Part(3, CV_W + 10, 20 + Math.random() * (SKY_H - 40), -0.9, 0, 500, 0.6 + Math.random() * 0.6, ''); }
    }

    const bx = BIRD_X, by = GS.birdY, bs = BIRD_SIZE;

    if (by + bs >= CV_H - GROUND_H || by <= 0) { Crash(by + bs >= CV_H - GROUND_H); return; }

    for (const p of GS.pipes) {
      if (bx + bs < p.x || bx > p.x + PIPE_W) continue;
      if (by < p.topH || by + bs > p.topH + p.gap) { Crash(false); return; }
    }
  }

  function Crash(ground) {
    GS.status = 'dying';
    GS.flashAlpha = 0.9;
    GS.shake = 6;
    GS.deadT = ground ? 380 : 1400;
    if (GS.birdVel < 0) GS.birdVel = 0;
    if (ground) GS.birdY = Math.min(GS.birdY, CV_H - GROUND_H - BIRD_SIZE);
    SaveBest(GS.score);
    const cx = BIRD_X + BIRD_SIZE / 2, cy = GS.birdY + BIRD_SIZE / 2;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * TAU, v = 0.04 + Math.random() * 0.1;
      Part(1, cx, cy, Math.cos(a) * v, Math.sin(a) * v - 0.05, 900 + Math.random() * 500, 0.8 + Math.random() * 0.4, GS.birdColor, 0.00018, 0, (Math.random() - 0.5) * 0.03);
    }
    for (let i = 0; i < 5; i++) Part(0, cx + (Math.random() - 0.5) * 14, cy + (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, 380, 0.5, '', 0, 0.002);
  }

  function UpdateDying(dt) {
    const floor = CV_H - GROUND_H - BIRD_SIZE;
    if (GS.birdY < floor) {
      GS.birdVel = Math.min(0.55, GS.birdVel + GRAVITY * 1.4 * dt);
      GS.birdY = Math.min(floor, GS.birdY + GS.birdVel * dt);
      if (GS.birdY >= floor) {
        GS.shake = Math.max(GS.shake, 3);
        GS.deadT = Math.min(GS.deadT, 420);
        for (let i = 0; i < 4; i++) Part(0, BIRD_X + BIRD_SIZE / 2 + (Math.random() - 0.5) * 18, CV_H - GROUND_H - 2, (Math.random() - 0.5) * 0.08, -0.02, 420, 0.45, '', 0, 0.0016);
      }
    }
    GS.birdRotation += (1.55 - GS.birdRotation) * Math.min(1, dt * 0.012);
    GS.deadT -= dt;
    if (GS.deadT <= 0) Die();
  }

  function Die() {
    GS.status = 'gameover';
    SaveBest(GS.score);
    ShowGameOver();
  }

  function Step(dt) {
    GS.t += dt;
    GS.wingT += dt;
    if (GS.status === 'start') {
      GS.bgX += BASE_SPEED * dt;
      GS.birdY = CV_H * 0.4 + Math.sin(GS.t * 0.0055) * 6;
      GS.birdRotation = Math.sin(GS.t * 0.0055 + 1.2) * 0.08;
    } else if (GS.status === 'playing') Update(dt);
    else if (GS.status === 'dying') UpdateDying(dt);
    for (let i = 0; i < PN; i++) {
      const p = _P[i];
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.T) { p.on = 0; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.r += p.vr * dt; p.s += p.ds * dt;
      if (p.k === 1) { p.vx *= 0.996; p.vy = Math.min(p.vy, 0.05); }
    }
    if (GS.flashAlpha > 0) GS.flashAlpha = Math.max(0, GS.flashAlpha - dt * 0.004);
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - dt * 0.022);
  }

  function WingFrame() {
    if (GS.status === 'dying' || GS.status === 'gameover') return 1;
    if (GS.status === 'playing' && GS.birdVel > 0.2 && GS.wingT > 260) return 1;
    const ph = (GS.wingT / (GS.status === 'start' ? 95 : 62) | 0) % 4;
    return ph === 3 ? 1 : ph;
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

  function Draw() {
    if (!_ctx || !GS || !_S) return;
    const c = _ctx, S = _S;
    c.setTransform(_k, 0, 0, _k, 0, 0);
    let sx = 0, sy = 0;
    if (GS.shake > 0) { sx = (Math.random() - 0.5) * GS.shake * 2; sy = (Math.random() - 0.5) * GS.shake * 2; }
    c.translate(sx, sy);

    c.fillStyle = S.dirt;
    c.fillRect(-8, SKY_H, CV_W + 16, GROUND_H + 8);
    c.drawImage(S.sky.c, -6, -6, CV_W + 12, SKY_H + 6);
    const bx = GS.bgX, drift = GS.t * 0.006;
    c.globalAlpha = _dark ? 0.5 : 0.75;
    Tile(S.far, bx * 0.04 + drift * 0.5, 60);
    c.globalAlpha = _dark ? 0.75 : 1;
    Tile(S.clouds, bx * 0.08 + drift, SKY_H - S.clouds.h - 70);
    c.globalAlpha = 1;
    Tile(S.city, bx * 0.22, SKY_H - S.city.h - 12);
    Tile(S.bushes, bx * 0.5, SKY_H - S.bushes.h + 2);

    if (GS.speedModTimer > 0 && GS.speedMod < 0) {
      c.globalAlpha = Math.min(1, GS.speedModTimer / 300) * 0.8;
      BlitC(S.aura, BIRD_X + BIRD_SIZE / 2, GS.birdY + BIRD_SIZE / 2, 0, 1);
      c.globalAlpha = 1;
    }

    if (GS.status !== 'start') for (const p of GS.pipes) DrawPipe(p);

    for (let i = 0; i < PN; i++) { const p = _P[i]; if (p.on && p.k === 3) DrawPart(p); }

    const sp = S.bird[GS.birdColor] || S.bird[COLORS[0]];
    BlitC(sp[WingFrame()], BIRD_X + BIRD_SIZE / 2, GS.birdY + BIRD_SIZE / 2, GS.birdRotation, 1);

    Tile(S.ground, GS.bgX, SKY_H);

    for (let i = 0; i < PN; i++) { const p = _P[i]; if (p.on && p.k !== 3) DrawPart(p); }

    c.drawImage(S.vign.c, -6, -6, CV_W + 12, CV_H + 12);

    if (GS.status === 'playing' || GS.status === 'dying') {
      c.textAlign = 'center'; c.textBaseline = 'top';
      Outlined(_hud.scoreStr || '0', CV_W / 2, 22, F_SCORE, '#ffffff', 7);
    }

    if (GS.flashAlpha > 0) {
      c.globalAlpha = GS.flashAlpha;
      c.fillStyle = '#fff';
      c.fillRect(-8, -8, CV_W + 16, CV_H + 16);
      c.globalAlpha = 1;
    }

    UpdateHud();
  }

  function DrawPipe(p) {
    const S = _S, c = _ctx;
    if (p.x > CV_W + 8 || p.x + PIPE_W < -12) return;
    const body = S.body[p.color], k = body.k;
    const botY = p.topH + p.gap;
    const x = Math.round((p.x - 2) * _k) / _k;
    const th = Math.max(0, p.topH - PIPE_CAP_H + 1);
    if (th > 0) c.drawImage(body.c, 0, 0, body.c.width, Math.ceil(th * k), x, 0, body.w, Math.ceil(th * k) / k);
    const bh = SKY_H - botY - PIPE_CAP_H + 1;
    if (bh > 0) c.drawImage(body.c, 0, 0, body.c.width, Math.ceil(bh * k), x, botY + PIPE_CAP_H - 1, body.w, Math.ceil(bh * k) / k);
    c.fillStyle = 'rgba(20,16,34,0.22)';
    c.fillRect(x + 2.5, botY + PIPE_CAP_H, PIPE_W - 1, 3);
    const ct = S.capT[p.color], cb = S.capB[p.color];
    c.drawImage(ct.c, x - PIPE_CAP_OV, p.topH - PIPE_CAP_H - 2, ct.w, ct.h);
    c.drawImage(cb.c, x - PIPE_CAP_OV, botY - 2, cb.w, cb.h);
    c.font = F_LBL;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(43,34,54,0.85)';
    c.fillText(p.lbl, p.x + PIPE_W / 2 + 1, botY + PIPE_CAP_H / 2 + 0.5);
  }

  function DrawPart(p) {
    const c = _ctx, S = _S, u = p.t / p.T, a = 1 - u;
    if (p.k === 0) { c.globalAlpha = a * 0.9; BlitC(S.puff, p.x, p.y, 0, p.s); }
    else if (p.k === 1) { c.globalAlpha = Math.min(1, a * 2); BlitC(S.feather[p.c] || S.feather[COLORS[0]], p.x + Math.sin(p.t * 0.012) * 3, p.y, p.r, p.s); }
    else if (p.k === 2) { c.globalAlpha = a; BlitC(S.spark, p.x, p.y, p.r, Math.max(0.05, p.s)); }
    else if (p.k === 3) { c.globalAlpha = 0.5 * a; c.fillStyle = _dark ? '#fca5a5' : '#ffffff'; c.fillRect(p.x, p.y, 26 * p.s, 1.6); }
    else {
      c.globalAlpha = Math.min(1, a * 2.5);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const z = 1 + (1 - Math.min(1, p.t / 120)) * 0.35;
      c.save(); c.translate(p.x, p.y); c.scale(z, z);
      Outlined(p.c, 0, 0, F_POP, p.c2 || '#fff', 4);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  function UpdateHud() {
    if (_hud.score !== GS.score) { _hud.score = GS.score; _hud.scoreStr = String(GS.score); SetText('gf-fl-score', GS.score); }
    if (_hud.best !== _best) { _hud.best = _best; SetText('gf-fl-best', _best); }
    if (_hud.grade !== GS.birdGrade) {
      _hud.grade = GS.birdGrade;
      const g = GS.birdGrade;
      SetText('gf-fl-grade-sub', g.subject);
      SetText('gf-fl-grade-pct', g.Pct != null ? `${Math.round(g.Pct)}%` : '?');
      const dot = document.getElementById('gf-fl-grade-dot');
      if (dot) dot.style.background = GS.birdColor;
    }
  }

  function Frame(ts) {
    _raf = null;
    if (!GS) return;
    const dt = Math.min(ts - (_last || ts), 50);
    _last = ts;
    Step(dt);
    Draw();
    if (GS.status === 'start' || GS.status === 'playing' || GS.status === 'dying' || AnyParts()) _raf = requestAnimationFrame(Frame);
  }
  function AnyParts() { for (let i = 0; i < PN; i++) if (_P[i].on) return true; return GS.shake > 0 || GS.flashAlpha > 0; }

  function StartLoop() { StopLoop(); _last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREEN_IDS = ['gf-fl-start', 'gf-fl-pause', 'gf-fl-gameover'];

  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStartScreen() {
    StopLoop();
    ClearParts();
    GS = NewGameState();
    _best = LoadBest();
    ShowScreen('gf-fl-start');
    Draw();
    StartLoop();
  }

  function ShowGameOver() {
    SaveBest(GS.score);
    const prev = _best;
    _best = Math.max(LoadBest(), GS.score);
    SetText('gf-fl-go-score', GS.score);
    SetText('gf-fl-go-best', _best);
    const isNew = GS.score > prev && GS.score > 0;
    const newEl = document.getElementById('gf-fl-go-new');
    if (newEl) newEl.style.display = isNew ? 'block' : 'none';
    const tier = MedalTier(GS.score);
    const m = document.getElementById('gf-fl-go-medal');
    if (m && _medals) { m.src = _medals[tier]; m.classList.toggle('on', tier > 0); }
    ShowScreen('gf-fl-gameover');
    Draw();
  }

  function DoStart() {
    StopLoop();
    ClearParts();
    GS = NewGameState();
    _best = LoadBest();
    GS.status = 'playing';
    ShowScreen(null);
    Flap();
    Draw();
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-fl-pause'); Draw();
    } else if (GS.status === 'paused') {
      GS.status = 'playing';
      ShowScreen(null); StartLoop();
    }
  }

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-fl') || _root.style.display === 'none') return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeFlappy();
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
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'start') {
        Flap();
      } else if (GS.status === 'paused') {
        DoPause();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (GS.status === 'gameover') DoStart();
      else if (GS.status === 'start') Flap();
      return;
    }
  }

  function OnCanvasInteract(e) {
    e.preventDefault();
    if (!GS) return;
    if (GS.status === 'playing' || GS.status === 'start') Flap();
    else if (GS.status === 'gameover') DoStart();
  }

  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); }
  function DetachKeys() { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } }
  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-fl');
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
    const s = Math.max(0.5, Math.min(1.25, (innerWidth - 34) / CV_W, (innerHeight - 34 - HDR_H - HUD_H) / CV_H));
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
    if (document.getElementById('gf-fl')) return;
    InjectCSS();
    _medals = BuildMedals();
    const root = document.createElement('div');
    root.id = 'gf-fl';
    root.innerHTML = `
<div id="gf-fl-modal">
  <div id="gf-fl-hdr">
    <div class="gf-fl-hl">
      <div id="gf-fl-logo">GF</div>
      <span id="gf-fl-title">GradeFlappy</span>
    </div>
    <div class="gf-fl-hr">
      <button id="gf-fl-pause-btn" title="${_GameText('game_pause_p')}">&#9208;</button>
      <button id="gf-fl-close" title="${_GameText('game_close_esc')}">&#x2715;</button>
    </div>
  </div>
  <div id="gf-fl-hud">
    <div class="gf-fl-hud-cell">
      <span class="gf-fl-hud-lbl">${_GameText('game_score').toUpperCase()}</span>
      <span id="gf-fl-score" class="gf-fl-hud-val">0</span>
    </div>
    <div class="gf-fl-hud-cell">
      <span class="gf-fl-hud-lbl">${_GameText('game_best').toUpperCase()}</span>
      <span id="gf-fl-best" class="gf-fl-hud-val">0</span>
    </div>
    <div id="gf-fl-grade"><i id="gf-fl-grade-dot"></i><span id="gf-fl-grade-sub"></span><b id="gf-fl-grade-pct"></b></div>
  </div>
  <div id="gf-fl-body">
    <div id="gf-fl-view"><canvas id="gf-fl-canvas" width="${CV_W}" height="${CV_H}"></canvas></div>

    <div id="gf-fl-start" class="gf-fl-scr">
      <div class="gf-fl-start-top">
        <div class="gf-fl-scr-logo">${_GameText('fl_title')}</div>
        <div class="gf-fl-ready">${_GameText('fl_get_ready')}</div>
      </div>
      <div class="gf-fl-card gf-fl-start-card">
        <div class="gf-fl-scr-sub">${_GameText('fl_subtitle')}</div>
        <div class="gf-fl-scr-effects">
          <span><i style="background:#4ade80"></i>${_GameText('fl_eff_great')}</span>
          <span><i style="background:#a3e635"></i>${_GameText('fl_eff_ok')}</span>
          <span><i style="background:#f87171"></i>${_GameText('fl_eff_bad')}</span>
        </div>
        <div class="gf-fl-scr-footer"><span class="gf-fl-tap"></span>${_GameText('fl_start_hint')}</div>
      </div>
    </div>

    <div id="gf-fl-pause" class="gf-fl-scr gf-fl-dim" style="display:none">
      <div class="gf-fl-card">
        <div class="gf-fl-scr-h">${_GameText('game_paused')}</div>
        <button class="gf-fl-btn" id="gf-fl-resume">&#9654;&nbsp; ${_GameText('game_resume')}</button>
        <div class="gf-fl-scr-footer">${_GameText('fl_pause_hint')}</div>
      </div>
    </div>

    <div id="gf-fl-gameover" class="gf-fl-scr gf-fl-dim" style="display:none">
      <div class="gf-fl-scr-go">${_GameText('game_gameover')}</div>
      <div class="gf-fl-card gf-fl-go-card">
        <div class="gf-fl-go-medal-wrap">
          <div class="gf-fl-go-lbl">${_GameText('fl_medal')}</div>
          <img id="gf-fl-go-medal" alt="">
        </div>
        <div class="gf-fl-go-stats">
          <div class="gf-fl-go-stat">
            <div class="gf-fl-go-lbl">${_GameText('game_score').toUpperCase()}</div>
            <div class="gf-fl-go-val" id="gf-fl-go-score">0</div>
          </div>
          <div class="gf-fl-go-stat">
            <div class="gf-fl-go-lbl">${_GameText('game_best').toUpperCase()}</div>
            <div class="gf-fl-go-val" id="gf-fl-go-best">0</div>
          </div>
        </div>
      </div>
      <div id="gf-fl-go-new" class="gf-fl-scr-new" style="display:none">${_GameText('fl_new_best')}</div>
      <button class="gf-fl-btn" id="gf-fl-retry">&#8634;&nbsp; ${_GameText('game_try_again')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _view = document.getElementById('gf-fl-view');
    _cv = document.getElementById('gf-fl-canvas');
    _ctx = _cv.getContext('2d');
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-fl-close')?.addEventListener('click', CloseGradeFlappy);
    document.getElementById('gf-fl-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-fl-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-fl-retry')?.addEventListener('click', DoStart);
    _cv.addEventListener('mousedown', OnCanvasInteract);
    _cv.addEventListener('touchstart', OnCanvasInteract, { passive: false });
    const startScr = document.getElementById('gf-fl-start');
    if (startScr) {
      startScr.addEventListener('mousedown', e => {
        e.stopPropagation();
        if (GS?.status === 'start') Flap();
      });
      startScr.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        if (GS?.status === 'start') Flap();
      }, { passive: false });
    }
    document.getElementById('gf-fl')?.addEventListener('click', e => {
      if (e.target.id !== 'gf-fl') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyFlappy();
      else CloseGradeFlappy();
    });
  }

  function OpenGradeFlappy(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-fl')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    Fit();
    ShowStartScreen();
  }

  function CloseGradeFlappy() {
    const el = document.getElementById('gf-fl');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    if (GS?.status === 'dying') Die();
    StopLoop();
    DetachKeys(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function BossKeyFlappy() {
    const el = document.getElementById('gf-fl');
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
      if (GS?.status === 'dying') Die();
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  function ToggleGradeFlappy(grades) {
    const el = document.getElementById('gf-fl');
    if (el && el.style.display !== 'none') CloseGradeFlappy(); else OpenGradeFlappy(grades);
  }

  W.OpenGradeFlappy       = OpenGradeFlappy;
  W.CloseGradeFlappy      = CloseGradeFlappy;
  W.ToggleGradeFlappy     = ToggleGradeFlappy;
  W.BossKeyFlappy         = BossKeyFlappy;

  function InjectCSS() {
    if (document.getElementById('gf-fl-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-fl-css';
    const ol = '#2b2236';
    s.textContent = `
#gf-fl {
  --fl-modal:#fff;--fl-hdr:#f5f7f8;--fl-hud:#fafbfc;--fl-scr:rgba(250,251,252,0.94);
  --fl-brd:rgba(74,222,128,0.26);--fl-brd2:#e2e6ea;--fl-btn-brd:#d0d5da;
  --fl-txt:#111;--fl-txt2:#4b5563;--fl-txt3:#8b939c;--fl-kbd:#eee;--fl-kbd-brd:#ccc;
  --fl-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-fl[data-theme="dark"] {
  --fl-modal:rgba(13,14,18,0.97);--fl-hdr:rgba(8,9,12,0.95);--fl-hud:rgba(10,11,15,0.98);
  --fl-scr:rgba(10,12,26,0.92);--fl-brd:rgba(74,222,128,0.2);--fl-brd2:#1e2128;
  --fl-btn-brd:#343842;--fl-txt:#f5f5f5;--fl-txt2:#cbd5e1;--fl-txt3:#8a94a6;
  --fl-kbd:#1e1e1e;--fl-kbd-brd:#333;
  --fl-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-fl{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-fl *{box-sizing:border-box;}
#gf-fl-modal{position:relative;display:flex;flex-direction:column;background:var(--fl-modal);border:1px solid var(--fl-brd);border-radius:12px;box-shadow:var(--fl-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-fl-hdr{display:flex;align-items:center;justify-content:space-between;height:${HDR_H}px;padding:0 12px;background:var(--fl-hdr);border-bottom:1px solid var(--fl-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-fl-hl{display:flex;align-items:center;gap:8px;} .gf-fl-hr{display:flex;align-items:center;gap:6px;}
#gf-fl-logo{width:24px;height:24px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-fl-title{font-size:13px;font-weight:700;color:var(--fl-txt);letter-spacing:-0.3px;}
#gf-fl-pause-btn,#gf-fl-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--fl-btn-brd);border-radius:6px;background:transparent;color:var(--fl-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-fl-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-fl-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-fl-hud{display:flex;align-items:center;gap:6px;height:${HUD_H}px;padding:0 8px;background:var(--fl-hud);border-bottom:1px solid var(--fl-brd);user-select:none;line-height:1.1;}
.gf-fl-hud-cell{display:flex;flex-direction:column;justify-content:center;gap:2px;height:34px;padding:0 10px;border:1px solid var(--fl-brd2);border-radius:9px;background:rgba(128,128,128,0.07);min-width:62px;}
.gf-fl-hud-lbl{font-size:7.5px;font-weight:700;letter-spacing:1.2px;color:var(--fl-txt3);text-transform:uppercase;}
.gf-fl-hud-val{font-size:15px;font-weight:800;color:var(--fl-txt);font-variant-numeric:tabular-nums;}
#gf-fl-grade{display:flex;align-items:center;gap:6px;height:34px;padding:0 10px;margin-left:auto;border:1px solid var(--fl-brd2);border-radius:9px;background:rgba(128,128,128,0.07);min-width:0;flex:0 1 auto;}
#gf-fl-grade i{width:12px;height:12px;border-radius:50%;border:2px solid ${ol};flex-shrink:0;}
#gf-fl-grade-sub{font-size:10px;font-weight:700;color:var(--fl-txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;}
#gf-fl-grade-pct{font-size:12px;font-weight:800;color:var(--fl-txt);}
#gf-fl-body{position:relative;line-height:0;flex-shrink:0;}
#gf-fl-view{line-height:0;}
#gf-fl-canvas{display:block;touch-action:manipulation;user-select:none;-webkit-user-select:none;cursor:pointer;}
.gf-fl-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:22px 18px;overflow-y:auto;line-height:1.35;text-align:center;}
.gf-fl-dim{background:rgba(10,14,30,0.32);backdrop-filter:blur(1.5px);}
#gf-fl-start{cursor:pointer;justify-content:space-between;padding:44px 18px 30px;}
.gf-fl-start-top{display:flex;flex-direction:column;align-items:center;gap:8px;}
.gf-fl-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 20px;border-radius:16px;background:var(--fl-scr);border:1px solid var(--fl-brd);box-shadow:0 14px 40px rgba(0,0,0,.22);max-width:310px;width:100%;}
.gf-fl-start-card{gap:10px;padding:14px 16px;}
.gf-fl-scr-logo{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:40px;font-weight:900;color:#fff;letter-spacing:0;line-height:1;text-shadow:3px 0 0 ${ol},-3px 0 0 ${ol},0 3px 0 ${ol},0 -3px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 6px 0 ${ol},0 8px 18px rgba(0,0,0,0.25);}
.gf-fl-ready{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:22px;font-weight:900;color:#fbbf24;line-height:1.1;text-shadow:2px 0 0 ${ol},-2px 0 0 ${ol},0 2px 0 ${ol},0 -2px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 4px 0 ${ol};animation:gf-fl-bob 1.4s ease-in-out infinite;}
@keyframes gf-fl-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.gf-fl-scr-sub{font-size:12.5px;font-weight:700;color:var(--fl-txt);line-height:1.3;text-align:center;}
.gf-fl-scr-h{font-size:21px;font-weight:800;color:var(--fl-txt);letter-spacing:4px;}
.gf-fl-scr-effects{display:flex;flex-direction:column;gap:5px;font-size:10.5px;font-weight:700;color:var(--fl-txt2);align-items:stretch;line-height:1.2;width:100%;}
.gf-fl-scr-effects > span{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:8px;background:rgba(128,128,128,0.08);text-align:left;}
.gf-fl-scr-effects i{width:10px;height:14px;border-radius:2px;border:1.5px solid ${ol};flex-shrink:0;}
.gf-fl-scr-footer{display:flex;align-items:center;justify-content:center;gap:7px;font-size:10px;color:var(--fl-txt3);text-align:center;letter-spacing:0.3px;line-height:1.4;}
.gf-fl-tap{width:14px;height:14px;border-radius:50%;border:2px solid #4ade80;animation:gf-fl-tap 1s ease-out infinite;flex-shrink:0;}
@keyframes gf-fl-tap{0%{transform:scale(0.6);opacity:1}100%{transform:scale(1.4);opacity:0}}
.gf-fl-scr-go{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:36px;font-weight:900;color:#fb923c;letter-spacing:1px;line-height:1;text-shadow:3px 0 0 ${ol},-3px 0 0 ${ol},0 3px 0 ${ol},0 -3px 0 ${ol},2px 2px 0 ${ol},-2px -2px 0 ${ol},2px -2px 0 ${ol},-2px 2px 0 ${ol},0 6px 0 ${ol};animation:gf-fl-drop .45s cubic-bezier(.2,1.5,.4,1);}
@keyframes gf-fl-drop{from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:none}}
.gf-fl-go-card{flex-direction:row;justify-content:space-around;gap:14px;animation:gf-fl-rise .4s .08s cubic-bezier(.2,1.3,.4,1) both;}
@keyframes gf-fl-rise{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
.gf-fl-go-medal-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
#gf-fl-go-medal{width:48px;height:56px;}
#gf-fl-go-medal.on{animation:gf-fl-medal .6s .35s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes gf-fl-medal{from{opacity:0;transform:scale(0.2) rotate(-30deg)}to{opacity:1;transform:none}}
.gf-fl-go-stats{display:flex;flex-direction:column;gap:8px;align-items:flex-end;}
.gf-fl-go-stat{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.gf-fl-go-lbl{font-size:8.5px;font-weight:800;letter-spacing:1.5px;color:#f97316;text-transform:uppercase;}
.gf-fl-go-val{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:28px;font-weight:900;color:var(--fl-txt);line-height:1;font-variant-numeric:tabular-nums;}
.gf-fl-scr-new{font-size:10.5px;font-weight:800;color:#fff;background:#ef4444;border:2px solid ${ol};border-radius:999px;padding:3px 10px;letter-spacing:1.5px;animation:gf-fl-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-fl-pulse{from{transform:scale(0.95)}to{transform:scale(1.06)}}
.gf-fl-btn{padding:9px 22px;border:2px solid ${ol};border-radius:10px;background:#4ade80;color:#052e16;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;box-shadow:0 4px 0 ${ol};transition:transform .12s,box-shadow .12s,background .12s;}
.gf-fl-btn:hover{background:#6ee7a0;transform:translateY(-1px);box-shadow:0 5px 0 ${ol};}
.gf-fl-btn:active{transform:translateY(3px);box-shadow:0 1px 0 ${ol};}
`;
    document.head.appendChild(s);
  }

})(window);
