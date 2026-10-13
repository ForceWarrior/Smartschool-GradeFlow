;(function (W) {
  'use strict';
  if (W.OpenGradeSurfers) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 720;
  const CV_H = 460;
  const CX = CV_W / 2;
  const HY = 136;
  const FOC = 520;
  const CAM_BACK = 8;
  const CAM_H = 4.5;
  const NEAR = 0.6;
  const FAR = 170;
  const FOG0 = 100;
  const LANE = 2.5;
  const TW = 1.12;
  const TH = 3.35;
  const CAR = 11.5;
  const GAP = 0.9;
  const RAMP = 7.5;
  const WALL_X = 5.4;
  const WALL_H = 2.8;
  const WIRE_Y = 5.5;
  const GRAV = 26;
  const JUMP_V = 9.6;
  const SNEAK_V = 14.6;
  const ROLL_T = 0.62;
  const JET_Y = 9;
  const D_ACT = 110;
  const V0 = 13;
  const VMAX = 27;
  const DUR = { jet: 7.5, sneak: 10, magnet: 10, double: 12, board: 25 };
  const PU_COL = { jet: '#38bdf8', sneak: '#a855f7', magnet: '#ef4444', double: '#facc15', board: '#22d3ee' };
  const PU_LIST = ['jet', 'sneak', 'magnet', 'double'];
  const HUD_PU = ['jet', 'sneak', 'magnet', 'double', 'board'];
  const BAR_DIM = { L: [2.4, 1.1], H: [2.4, 2.95], M: [2.4, 1.5], S: [1.5, 3.45] };
  const LIVERY = [
    { body: '#e2463c', trim: '#ffd23f' },
    { body: '#2f7de1', trim: '#f2f2f2' },
    { body: '#2fb463', trim: '#f7e34a' },
    { body: '#f2962b', trim: '#33343a' },
    { body: '#c3c9d2', trim: '#e2463c' },
    { body: '#8b55d6', trim: '#4ee6d4' },
  ];
  const PALS = {
    day: {
      sky: ['#2f8fe8', '#83c8f6', '#dcf1ff'], fog: '#d4eaf7', ground: '#958b7e', bed: '#a99f91', gravelD: '#5f574f', gravelL: '#d6cdbf',
      dirt: '#8b8a62', sleeper: '#77573a', rail: '#e3e7ec', railSide: '#6a5a4c', wall: '#c7bfb1', wallD: '#9a9284', wallTop: '#e2dbcf',
      city: ['#a7c9e0', '#86adc9'], pole: '#4b5059', wire: 'rgba(40,40,48,0.75)', night: false,
    },
    night: {
      sky: ['#0b0824', '#3b1d5e', '#c8457a'], fog: '#3d2152', ground: '#3b3546', bed: '#453e52', gravelD: '#221e2b', gravelL: '#776d88',
      dirt: '#302c3a', sleeper: '#4a3936', rail: '#c9c4ec', railSide: '#3a3448', wall: '#4d4660', wallD: '#363046', wallTop: '#655d7c',
      city: ['#2d1d4c', '#1c1234'], pole: '#2e2b3a', wire: 'rgba(10,6,20,0.8)', night: true,
    },
  };
  const LS_BEST = 'gf-ss-best';

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
    const N = ['Wiskunde', 'Nederlands', 'Frans', 'Wetenschappen', 'Geschiedenis', 'Engels', 'Sport', 'Latijn', 'Economie'];
    return Array.from({ length: 24 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${Math.round(p / 5)}/20` };
    });
  }
  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75) return '#4ade80';
    if (Pct >= 50) return '#a3e635';
    if (Pct >= 25) return '#f97316';
    return '#f87171';
  }
  function PickGrade() { return _grades[0 | Math.random() * _grades.length]; }
  function Abbr(s) { return s.replace(/[^A-Za-z\u00c0-\u00ff]/g, '').slice(0, 4).toUpperCase() || 'GF'; }
  function ShortLabel(gr) { return gr.label.length > 7 ? `${Math.round(gr.Pct ?? 50)}%` : gr.label; }

  let GS = null, SPR = null, ctx = null, _grades = [], _raf = null, _kh = null, _tobs = null, _pt = null, _lastTap = 0, _slow = 0;
  let camX = 0, camY = CAM_H, camZ = -CAM_BACK, PX = 0, PY = 0, PK = 0, DPR = 1, SHX = 0, SHY = 0;

  function Cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function RR(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function Hash(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function Shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function Alpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
  function Lin(g, x0, y0, x1, y1, st) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]);
    return gr;
  }
  function Rad(g, x, y, r, st) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    for (let i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]);
    return gr;
  }
  function Ball(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }

  function Tag(g, text, x, y, size, col, rot, glow) {
    g.save();
    g.translate(x, y); g.rotate(rot);
    g.font = `900 ${size}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const w = g.measureText(text).width;
    if (glow) { g.shadowColor = col; g.shadowBlur = size * 0.5; }
    g.lineWidth = size * 0.34; g.strokeStyle = '#17121f'; g.strokeText(text, 0, size * 0.06);
    g.shadowBlur = 0;
    g.lineWidth = size * 0.16; g.strokeStyle = '#fbfbfb'; g.strokeText(text, 0, 0);
    g.fillStyle = Lin(g, 0, -size * 0.5, 0, size * 0.5, [0, Shade(col, 0.55), 0.5, col, 1, Shade(col, -0.4)]);
    g.fillText(text, 0, 0);
    g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = Math.max(2, size * 0.07);
    for (let i = 0; i < 3; i++) {
      const dx = (Math.random() - 0.5) * w * 0.8;
      g.beginPath(); g.moveTo(dx, size * 0.36); g.lineTo(dx, size * (0.48 + Math.random() * 0.35)); g.stroke();
    }
    g.restore();
  }

  function Win(g, x, y, w, h, night) {
    RR(g, x, y, w, h, 6);
    g.fillStyle = night && Math.random() < 0.8 ? Lin(g, 0, y, 0, y + h, [0, '#ffe9a8', 1, '#f0ab52'])
      : Lin(g, 0, y, 0, y + h, [0, '#6b8daa', 0.45, '#2a4058', 1, '#142030']);
    g.fill();
    g.save(); g.clip();
    if (night) {
      Ball(g, x + w * 0.32, y + h * 0.6, h * 0.15, 'rgba(90,50,30,0.4)');
      g.fillRect(x + w * 0.32 - h * 0.2, y + h * 0.72, h * 0.4, h * 0.3);
    } else {
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath(); g.moveTo(x + w * 0.1, y + h); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.75, y); g.lineTo(x + w * 0.35, y + h); g.fill();
    }
    g.restore();
    RR(g, x, y, w, h, 6); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2.5; g.stroke();
  }

  function MakeFront(lv, lit, night, label, num) {
    const w = 202, h = 302, c = Cv(w, h), g = c.getContext('2d');
    const body = night ? Shade(lv.body, -0.28) : lv.body;
    const Shape = () => {
      g.beginPath(); g.moveTo(0, h); g.lineTo(0, 42); g.quadraticCurveTo(1, 3, 40, 2);
      g.lineTo(w - 40, 2); g.quadraticCurveTo(w - 1, 3, w, 42); g.lineTo(w, h); g.closePath();
    };
    Shape();
    g.fillStyle = Lin(g, 0, 0, 0, h, [0, Shade(body, 0.35), 0.5, body, 1, Shade(body, -0.42)]);
    g.fill();
    Shape();
    g.fillStyle = Lin(g, 0, 0, w, 0, [0, 'rgba(0,0,0,0.42)', 0.1, 'rgba(0,0,0,0)', 0.86, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.36)']);
    g.fill();
    RR(g, 34, 5, w - 68, 5, 2); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fill();
    RR(g, 44, 11, w - 88, 26, 5); g.fillStyle = '#121016'; g.fill();
    g.font = '700 17px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff8a00'; g.shadowBlur = night ? 10 : 4; g.fillStyle = '#ffb547';
    g.fillText(label, w / 2, 25); g.shadowBlur = 0;
    RR(g, 14, 42, w - 28, 108, 16); g.fillStyle = Shade(body, -0.62); g.fill();
    for (let i = 0; i < 2; i++) {
      const x = 21 + i * 82, y = 48, ww = 78, hh = 96;
      RR(g, x, y, ww, hh, 11);
      g.fillStyle = night ? Lin(g, 0, y, 0, y + hh, [0, '#4a5f88', 1, '#1b2340'])
        : Lin(g, 0, y, 0, y + hh, [0, '#7397b8', 0.45, '#2a4561', 1, '#101b28']);
      g.fill();
      g.save(); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.26)';
      g.beginPath(); g.moveTo(x + 6, y + hh); g.lineTo(x + 40, y); g.lineTo(x + 60, y); g.lineTo(x + 26, y + hh); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.1)';
      g.beginPath(); g.moveTo(x + 34, y + hh); g.lineTo(x + 68, y); g.lineTo(x + 75, y); g.lineTo(x + 41, y + hh); g.fill();
      g.restore();
    }
    g.strokeStyle = '#0c0c10'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(58, 140); g.lineTo(96, 102); g.stroke();
    g.beginPath(); g.moveTo(140, 140); g.lineTo(178, 102); g.stroke();
    g.fillStyle = lv.trim; g.fillRect(0, 160, w, 20);
    g.fillStyle = 'rgba(255,255,255,0.38)'; g.fillRect(0, 160, w, 3);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 177, w, 3);
    RR(g, w / 2 - 27, 190, 54, 30, 5); g.fillStyle = '#f3efe4'; g.fill();
    g.strokeStyle = '#26262c'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#26262c'; g.font = '800 21px "IBM Plex Mono", monospace'; g.fillText(num, w / 2, 206);
    for (const hx of [38, w - 38]) {
      Ball(g, hx, 224, 19, '#1f2024');
      Ball(g, hx, 224, 16, Lin(g, 0, 206, 0, 242, [0, '#f2f4f7', 1, '#6b7079']));
      Ball(g, hx, 224, 12.5, lit ? Rad(g, hx - 2, 222, 13, [0, '#ffffff', 0.55, '#fff7cf', 1, '#ffd166'])
        : Rad(g, hx - 2, 222, 13, [0, '#fbf8e6', 1, night ? '#8f8762' : '#bdb79c']));
      Ball(g, hx - 4, 220, 3.5, 'rgba(255,255,255,0.85)');
    }
    g.fillStyle = Lin(g, 0, 258, 0, h, [0, '#50545c', 1, '#18191d']); g.fillRect(0, 258, w, h - 258);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 258, w, 3);
    g.save(); g.beginPath(); g.rect(6, 266, 46, 14); g.rect(w - 52, 266, 46, 14); g.clip();
    g.fillStyle = '#f5c518'; g.fillRect(0, 266, w, 14);
    g.fillStyle = '#1a1a1a';
    for (let x = -20; x < w + 20; x += 14) { g.beginPath(); g.moveTo(x, 280); g.lineTo(x + 7, 280); g.lineTo(x + 21, 266); g.lineTo(x + 14, 266); g.fill(); }
    g.restore();
    RR(g, w / 2 - 20, 264, 40, 30, 5); g.fillStyle = '#2a2c31'; g.fill();
    RR(g, w / 2 - 13, 271, 26, 9, 3); g.fillStyle = '#80858f'; g.fill();
    Shape(); g.strokeStyle = Shade(body, -0.65); g.lineWidth = 4; g.stroke();
    return c;
  }

  function MakeSide(lv, night, gr) {
    const w = 575, h = 168, c = Cv(w, h), g = c.getContext('2d');
    const body = night ? Shade(lv.body, -0.3) : lv.body;
    g.fillStyle = Lin(g, 0, 0, 0, h, [0, Shade(body, 0.3), 0.45, body, 0.85, Shade(body, -0.28), 1, Shade(body, -0.45)]);
    g.fillRect(0, 0, w, h);
    g.fillStyle = Lin(g, 0, 0, 0, 14, [0, Shade(body, -0.5), 0.6, Shade(body, -0.1), 1, Shade(body, 0.45)]);
    g.fillRect(0, 0, w, 14);
    g.fillStyle = 'rgba(0,0,0,0.13)';
    for (let x = 48; x < w; x += 96) g.fillRect(x, 14, 2, 134);
    for (const [x, ww] of [[22, 54], [172, 64], [252, 64], [332, 64], [490, 64]]) Win(g, x, 26, ww, 50, night);
    for (const dx of [92, 412]) {
      g.fillStyle = Shade(body, -0.12); g.fillRect(dx, 20, 60, 128);
      g.strokeStyle = Shade(body, -0.55); g.lineWidth = 2; g.strokeRect(dx, 20, 60, 128);
      g.beginPath(); g.moveTo(dx + 30, 20); g.lineTo(dx + 30, 148); g.stroke();
      Win(g, dx + 6, 30, 19, 58, night); Win(g, dx + 35, 30, 19, 58, night);
    }
    g.fillStyle = lv.trim; g.fillRect(0, 86, w, 10);
    g.fillStyle = 'rgba(255,255,255,0.32)'; g.fillRect(0, 86, w, 2);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, 95, w, 2);
    g.fillStyle = Lin(g, 0, 98, 0, 148, [0, 'rgba(60,40,20,0)', 1, 'rgba(60,40,20,0.3)']); g.fillRect(0, 98, w, 50);
    const gc = GradeColor(gr.Pct);
    Tag(g, ShortLabel(gr), 282, 123, 34, gc, -0.05 + Math.random() * 0.1, night);
    Tag(g, Abbr(gr.subject), 48, 124, 20, ['#ff5ca8', '#38bdf8', '#facc15', '#4ade80'][0 | Math.random() * 4], -0.12, night);
    Tag(g, `${Math.round(gr.Pct ?? 50)}%`, 522, 124, 20, gc, 0.1, night);
    g.fillStyle = Lin(g, 0, 148, 0, h, [0, '#3a3c43', 1, '#141518']); g.fillRect(0, 148, w, 20);
    for (const bx of [68, 126, 449, 507]) {
      Ball(g, bx, 160, 12, '#101114');
      Ball(g, bx, 160, 8, '#5c6069');
      Ball(g, bx, 160, 3, '#a3a8b0');
    }
    g.fillStyle = '#25272c'; g.fillRect(52, 150, 90, 6); g.fillRect(433, 150, 90, 6);
    g.fillStyle = Lin(g, 0, 0, 14, 0, [0, 'rgba(0,0,0,0.5)', 1, 'rgba(0,0,0,0)']); g.fillRect(0, 0, 14, h);
    g.fillStyle = Lin(g, w - 14, 0, w, 0, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.5)']); g.fillRect(w - 14, 0, 14, h);
    return c;
  }

  function MakeRoof(night) {
    const w = 90, h = 460, c = Cv(w, h), g = c.getContext('2d');
    g.fillStyle = Lin(g, 0, 0, w, 0, [0, '#4f535a', 0.14, '#8e949c', 0.5, '#aab1b9', 0.86, '#8e949c', 1, '#4f535a']);
    g.fillRect(0, 0, w, h);
    for (let v = 0; v < h; v += 23) {
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(6, v, w - 12, 2);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(6, v + 2, w - 12, 1);
    }
    for (const v of [70, 300]) {
      RR(g, 17, v, 56, 84, 7); g.fillStyle = Lin(g, 17, 0, 73, 0, [0, '#9aa0a8', 0.5, '#d6dbe0', 1, '#8a9098']); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.3)';
      for (let i = 0; i < 6; i++) g.fillRect(23, v + 8 + i * 5, 44, 2);
      Ball(g, 45, v + 60, 13, '#4b5058');
      Ball(g, 45, v + 60, 10, '#2a2d33');
      g.strokeStyle = '#7d838c'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(35, v + 60); g.lineTo(55, v + 60); g.moveTo(45, v + 50); g.lineTo(45, v + 70); g.stroke();
    }
    if (night) { g.fillStyle = 'rgba(16,8,40,0.45)'; g.fillRect(0, 0, w, h); }
    return c;
  }

  function Stripes(g, x, y, w, h, step, col, slope) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = col;
    for (let sx = x - h * 2; sx < x + w + h; sx += step * 2) {
      g.beginPath(); g.moveTo(sx, y + h); g.lineTo(sx + step, y + h); g.lineTo(sx + step + h * slope, y); g.lineTo(sx + h * slope, y); g.fill();
    }
    g.restore();
  }
  function Gloss(g, x, y, w, h, r) {
    RR(g, x, y, w, h, r);
    g.fillStyle = Lin(g, 0, y, 0, y + h, [0, 'rgba(255,255,255,0.45)', 0.35, 'rgba(255,255,255,0.05)', 0.6, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.3)']);
    g.fill();
  }
  function Post(g, x, y0, y1, w, night) {
    g.fillStyle = Lin(g, x - w / 2, 0, x + w / 2, 0, [0, '#3f434b', 0.45, night ? '#9a9fb0' : '#d5dae1', 1, '#3f434b']);
    g.fillRect(x - w / 2, y0, w, y1 - y0);
  }
  function Lamp(g, x, y, r, col, on) {
    if (on) Ball(g, x, y, r * 2.4, Rad(g, x, y, r * 2.4, [0, Alpha(col, 0.55), 1, Alpha(col, 0)]));
    Ball(g, x, y, r + 2, '#141418');
    Ball(g, x, y, r, on ? Rad(g, x - r * 0.3, y - r * 0.3, r, [0, '#fff', 0.35, Shade(col, 0.3), 1, col]) : Shade(col, -0.55));
  }

  function MakeBars(night) {
    const out = {};
    let c = Cv(240, 110), g = c.getContext('2d');
    for (const px of [24, 216]) { Post(g, px, 40, 104, 12, night); RR(g, px - 17, 100, 34, 10, 3); g.fillStyle = '#2e3136'; g.fill(); }
    RR(g, 6, 14, 228, 44, 10); g.fillStyle = '#f7f7f7'; g.fill();
    g.save(); RR(g, 6, 14, 228, 44, 10); g.clip(); Stripes(g, 0, 14, 240, 44, 22, '#e53935', 0.6); g.restore();
    Gloss(g, 6, 14, 228, 44, 10);
    RR(g, 6, 14, 228, 44, 10); g.strokeStyle = '#6e1414'; g.lineWidth = 3.5; g.stroke();
    Lamp(g, 120, 36, 7, '#ffb300', night);
    out.L = c;

    c = Cv(240, 295); g = c.getContext('2d');
    for (const px of [16, 224]) {
      g.save(); g.beginPath(); g.rect(px - 8, 24, 16, 268); g.clip();
      g.fillStyle = '#f5c518'; g.fillRect(px - 8, 24, 16, 268);
      Stripes(g, px - 8, 24, 16, 268, 14, '#1b1b1b', -1.4);
      g.fillStyle = Lin(g, px - 8, 0, px + 8, 0, [0, 'rgba(0,0,0,0.4)', 0.4, 'rgba(255,255,255,0.3)', 1, 'rgba(0,0,0,0.45)']);
      g.fillRect(px - 8, 24, 16, 268);
      g.restore();
      RR(g, px - 18, 284, 36, 11, 3); g.fillStyle = '#2e3136'; g.fill();
    }
    RR(g, 4, 26, 232, 136, 12); g.fillStyle = '#fbc02d'; g.fill();
    g.save(); RR(g, 4, 26, 232, 136, 12); g.clip();
    g.fillStyle = '#1d1d1d';
    for (let x = -40; x < 280; x += 56) {
      g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 18, 40); g.lineTo(x + 46, 94); g.lineTo(x + 18, 148); g.lineTo(x, 148); g.lineTo(x + 28, 94); g.fill();
    }
    g.restore();
    Gloss(g, 4, 26, 232, 136, 12);
    RR(g, 4, 26, 232, 136, 12); g.strokeStyle = '#5a4300'; g.lineWidth = 4; g.stroke();
    for (const lx of [62, 178]) { RR(g, lx - 17, 2, 34, 26, 6); g.fillStyle = '#222428'; g.fill(); Lamp(g, lx, 15, 9, '#ff3b30', true); }
    out.H = c;

    c = Cv(240, 150); g = c.getContext('2d');
    for (const px of [20, 220]) { Post(g, px, 60, 144, 12, night); RR(g, px - 17, 140, 34, 10, 3); g.fillStyle = '#2e3136'; g.fill(); }
    RR(g, 4, 5, 232, 68, 10); g.fillStyle = '#f7f7f7'; g.fill();
    g.save(); RR(g, 4, 5, 232, 68, 10); g.clip(); Stripes(g, 0, 5, 240, 68, 26, '#1e9e57', -0.7); g.restore();
    Gloss(g, 4, 5, 232, 68, 10);
    RR(g, 4, 5, 232, 68, 10); g.strokeStyle = '#0d4a28'; g.lineWidth = 3.5; g.stroke();
    RR(g, 96, 22, 48, 34, 8); g.fillStyle = '#1d1f24'; g.fill();
    Lamp(g, 110, 39, 7, '#ff3b30', true); Lamp(g, 130, 39, 7, '#ffb300', night);
    out.M = c;

    c = Cv(150, 345); g = c.getContext('2d');
    Post(g, 75, 100, 258, 20, night);
    for (let y = 130; y < 250; y += 16) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(65, y, 20, 3); }
    RR(g, 38, 2, 74, 126, 12); g.fillStyle = Lin(g, 38, 0, 112, 0, [0, '#121317', 0.5, '#2c2f36', 1, '#121317']); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
    [['#ff3b30', true], ['#ffb300', false], ['#33d17a', false]].forEach(([col, on], i) => {
      const y = 26 + i * 38;
      g.fillStyle = '#000'; g.beginPath(); g.arc(75, y - 2, 18, Math.PI, 0); g.fill();
      Lamp(g, 75, y + 2, 13, col, on);
    });
    RR(g, 5, 252, 140, 92, 8); g.fillStyle = Lin(g, 0, 252, 0, 344, [0, night ? '#7a7590' : '#b4b4b4', 1, night ? '#3f3b4d' : '#6d6d6d']); g.fill();
    Stripes(g, 5, 262, 140, 22, 14, '#1b1b1b', 0.9);
    g.save(); g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#f5c518'; g.fillRect(5, 262, 140, 22); g.restore();
    RR(g, 5, 252, 140, 92, 8); g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(9, 255, 132, 3);
    out.S = c;
    return out;
  }

  function MakeCoins() {
    const c = Cv(64 * 16, 64), g = c.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI, cw = Math.cos(a), sx = Math.max(0.07, Math.abs(cw)), r = 27;
      const e = 6 * Math.sin(a) * (cw >= 0 ? 1 : -1);
      g.save(); g.translate(i * 64 + 32, 32);
      g.fillStyle = '#9c6a08';
      g.beginPath(); g.ellipse(e, 0, r * sx, r, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(Math.min(0, e), -r, Math.abs(e), r * 2);
      g.beginPath(); g.ellipse(0, 0, r * sx, r, 0, 0, Math.PI * 2);
      g.fillStyle = Rad(g, -r * 0.3 * sx, -r * 0.3, r * 1.3, [0, '#fff7b8', 0.35, '#ffd83d', 0.8, '#f0a90e', 1, '#c98200']);
      g.fill();
      g.lineWidth = 2.5; g.strokeStyle = '#7a4f00'; g.stroke();
      g.beginPath(); g.ellipse(0, 0, r * 0.74 * sx, r * 0.74, 0, 0, Math.PI * 2);
      g.lineWidth = 2.5; g.strokeStyle = 'rgba(170,105,0,0.75)'; g.stroke();
      g.save(); g.scale(sx, 1);
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const ang = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 6.5 : 14;
        g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr + 1);
      }
      g.closePath(); g.fillStyle = '#ffe36a'; g.fill();
      g.lineWidth = 2; g.strokeStyle = '#b07400'; g.stroke();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath(); g.ellipse(-r * 0.38 * sx, -r * 0.45, r * 0.22 * sx, r * 0.12, -0.6, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    return c;
  }

  function MakeIcon(type) {
    const c = Cv(96, 96), g = c.getContext('2d'), col = PU_COL[type];
    Ball(g, 48, 48, 47, Rad(g, 48, 48, 47, [0, Alpha(col, 0.55), 0.7, Alpha(col, 0.25), 1, Alpha(col, 0)]));
    Ball(g, 48, 48, 38, Rad(g, 40, 36, 44, [0, 'rgba(255,255,255,0.95)', 0.55, Alpha(col, 0.85), 1, Shade(col, -0.35)]));
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(48, 48, 38, 0, Math.PI * 2); g.stroke();
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (type === 'jet') {
      for (const x of [28, 50]) {
        g.fillStyle = Lin(g, 0, 70, 0, 90, [0, '#fff3a0', 0.4, '#ff9f1c', 1, 'rgba(255,60,0,0)']);
        g.beginPath(); g.moveTo(x + 2, 66); g.quadraticCurveTo(x + 9, 92, x + 16, 66); g.fill();
        RR(g, x, 22, 18, 46, 9); g.fillStyle = Lin(g, x, 0, x + 18, 0, [0, '#8d939c', 0.4, '#f4f6f8', 1, '#7a808a']); g.fill();
        g.strokeStyle = '#2b2e33'; g.lineWidth = 2.5; g.stroke();
        RR(g, x, 22, 18, 13, 7); g.fillStyle = '#e53935'; g.fill(); g.stroke();
        g.fillStyle = '#3a3d44'; g.fillRect(x + 4, 64, 10, 6);
      }
      g.fillStyle = '#2b2e33'; g.fillRect(44, 36, 8, 22);
    } else if (type === 'sneak') {
      g.strokeStyle = '#d4d8de'; g.lineWidth = 4;
      g.beginPath(); for (let i = 0; i <= 6; i++) g.lineTo(34 + (i % 2) * 12, 66 + i * 3.2); g.stroke();
      g.beginPath();
      g.moveTo(18, 62); g.lineTo(20, 46); g.quadraticCurveTo(26, 34, 40, 36); g.lineTo(52, 44); g.quadraticCurveTo(66, 46, 78, 54);
      g.quadraticCurveTo(82, 62, 76, 64); g.closePath();
      g.fillStyle = Lin(g, 0, 34, 0, 64, [0, '#c084fc', 1, '#7e22ce']); g.fill();
      g.strokeStyle = '#2e1065'; g.lineWidth = 3; g.stroke();
      RR(g, 16, 60, 64, 9, 4); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
      g.strokeStyle = '#4ade80'; g.lineWidth = 4; g.beginPath(); g.moveTo(26, 56); g.quadraticCurveTo(46, 44, 70, 58); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 + i * 5, 40 + i * 2); g.lineTo(46 + i * 5, 46 + i * 2); g.stroke(); }
    } else if (type === 'magnet') {
      g.strokeStyle = '#2d0a0a'; g.lineWidth = 24;
      g.beginPath(); g.moveTo(30, 26); g.lineTo(30, 48); g.arc(48, 48, 18, Math.PI, 0, true); g.lineTo(66, 26); g.stroke();
      g.strokeStyle = Lin(g, 0, 26, 0, 70, [0, '#ff6b5b', 1, '#b3121d']); g.lineWidth = 18;
      g.beginPath(); g.moveTo(30, 34); g.lineTo(30, 48); g.arc(48, 48, 18, Math.PI, 0, true); g.lineTo(66, 34); g.stroke();
      for (const x of [21, 57]) { RR(g, x, 18, 18, 14, 3); g.fillStyle = Lin(g, x, 0, x + 18, 0, [0, '#9aa0a8', 0.5, '#ffffff', 1, '#8a9098']); g.fill(); g.strokeStyle = '#2d0a0a'; g.lineWidth = 2.5; g.stroke(); }
      g.strokeStyle = '#fff59d'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(42, 14); g.lineTo(46, 20); g.lineTo(43, 22); g.lineTo(48, 28); g.stroke();
    } else if (type === 'double') {
      g.fillStyle = '#fff59d';
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? 22 : 33; g.lineTo(48 + Math.cos(a) * rr, 48 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.font = '900 34px "Arial Black", "Segoe UI Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = '#3b2500'; g.strokeText('2x', 48, 50);
      g.fillStyle = Lin(g, 0, 34, 0, 64, [0, '#fff', 0.4, '#ffd23f', 1, '#f08c00']); g.fillText('2x', 48, 50);
    } else {
      g.save(); g.translate(48, 50); g.rotate(-0.55);
      Ball(g, -26, 10, 6, '#22d3ee'); Ball(g, 26, 10, 6, '#22d3ee');
      RR(g, -36, -11, 72, 22, 11); g.fillStyle = Lin(g, -36, 0, 36, 0, [0, '#22d3ee', 0.5, '#f472b6', 1, '#facc15']); g.fill();
      g.strokeStyle = '#1e1b4b'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-24, -4, 48, 3);
      g.restore();
    }
    return c;
  }

  function MakeWall(pal, v) {
    const w = 480, h = 112, c = Cv(w, h), g = c.getContext('2d'), night = pal.night;
    g.fillStyle = Lin(g, 0, 0, 0, h, [0, Shade(pal.wall, 0.08), 0.7, pal.wall, 1, pal.wallD]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w;
      g.fillStyle = Lin(g, 0, 10, 0, h, [0, 'rgba(40,30,20,0.12)', 1, 'rgba(40,30,20,0)']); g.fillRect(x, 10, 3 + Math.random() * 10, 40 + Math.random() * 60);
    }
    for (let x = 0; x <= w; x += 120) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, 0, 1, h); }
    g.fillStyle = pal.wallTop; g.fillRect(0, 0, w, 7);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 7, w, 3);
    g.fillStyle = Lin(g, 0, 92, 0, h, [0, 'rgba(30,20,10,0)', 1, 'rgba(30,20,10,0.35)']); g.fillRect(0, 92, w, 20);
    const cols = ['#ff5ca8', '#38bdf8', '#facc15', '#4ade80', '#fb923c', '#c084fc'];
    const C = () => cols[0 | Math.random() * cols.length];
    if (v === 0) {
      const gr = PickGrade();
      Tag(g, gr.subject.toUpperCase().slice(0, 10), 240, 56, 36, C(), -0.03, night);
      Tag(g, 'GF', 60, 50, 22, C(), -0.2, night);
    } else if (v === 1) {
      const a = PickGrade(), b = PickGrade();
      Tag(g, ShortLabel(a), 130, 58, 40, GradeColor(a.Pct), -0.08, night);
      Tag(g, ShortLabel(b), 360, 54, 34, GradeColor(b.Pct), 0.06, night);
    } else if (v === 4) {
      g.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 4; i++) g.fillRect(30 + i * 120, 40, 60, 3);
    } else if (v === 5) {
      Tag(g, Abbr(PickGrade().subject), 110, 60, 34, C(), 0.08, night);
      Tag(g, `${Math.round(PickGrade().Pct ?? 50)}%`, 350, 58, 30, C(), -0.06, night);
    } else if (v === 2) {
      for (const y of [30, 44]) {
        g.fillStyle = Lin(g, 0, y, 0, y + 9, [0, night ? '#8a8aa0' : '#d8dde3', 1, night ? '#3d3d52' : '#727982']); g.fillRect(0, y, w, 9);
        for (let x = 30; x < w; x += 110) { g.fillStyle = '#4b5059'; g.fillRect(x, y - 2, 8, 13); }
      }
      Tag(g, Abbr(PickGrade().subject), 330, 78, 26, C(), 0.05, night);
    } else {
      for (const px of [70, 290]) {
        const gr = PickGrade(), gc = GradeColor(gr.Pct);
        RR(g, px, 22, 110, 70, 4); g.fillStyle = night ? '#1c1730' : '#f4efe4'; g.fill();
        g.fillStyle = gc; g.fillRect(px + 6, 28, 98, 18);
        g.font = '800 12px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#111'; g.fillText(gr.subject.slice(0, 12), px + 55, 37);
        g.font = '900 26px "Arial Black", sans-serif'; g.fillStyle = night ? gc : '#222';
        if (night) { g.shadowColor = gc; g.shadowBlur = 10; }
        g.fillText(ShortLabel(gr), px + 55, 70); g.shadowBlur = 0;
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; RR(g, px, 22, 110, 70, 4); g.stroke();
      }
    }
    return c;
  }

  function MakeFacade(pal, v) {
    const w = 480, h = 624, c = Cv(w, h), g = c.getContext('2d'), night = pal.night;
    const base = (night ? ['#3b2c4a', '#463a52', '#2e3550', '#2f4846'] : ['#b8603f', '#d8c39f', '#8697ac', '#6fa699'])[v];
    g.fillStyle = Lin(g, 0, 0, 0, h, [0, Shade(base, 0.08), 1, Shade(base, -0.2)]); g.fillRect(0, 0, w, h);
    if (v === 0) {
      g.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1);
    }
    for (let fy = h - 72; fy > 0; fy -= 72) {
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, fy, w, 3);
      if (fy === h - 72) continue;
      for (let x = 13; x < w; x += 60) {
        const lit = night && Math.random() < 0.55;
        RR(g, x - 3, fy + 14, 40, 46, 2); g.fillStyle = night ? '#1c1626' : Shade(base, 0.35); g.fill();
        g.fillStyle = lit ? Lin(g, 0, fy + 17, 0, fy + 57, [0, Math.random() < 0.3 ? '#bfe6ff' : '#ffe2a0', 1, Math.random() < 0.3 ? '#6aaee0' : '#f2a65a'])
          : night ? '#141a2e' : Lin(g, 0, fy + 17, 0, fy + 57, [0, '#dff1fb', 0.5, '#94b9d3', 1, '#5f86a6']);
        g.fillRect(x, fy + 17, 34, 40);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 16, fy + 17, 2, 40);
        g.fillStyle = night ? '#2a2236' : '#ece6dc'; g.fillRect(x - 4, fy + 58, 42, 4);
      }
    }
    const sy = h - 72;
    g.fillStyle = Shade(base, -0.35); g.fillRect(0, sy, w, 72);
    g.fillStyle = Shade(base, 0.25); g.fillRect(0, sy, w, 5);
    for (let x = 10; x < w; x += 120) {
      RR(g, x, sy + 16, 100, 56, 3); g.fillStyle = night && Math.random() < 0.6 ? Lin(g, 0, sy + 16, 0, sy + 72, [0, '#ffd27a', 1, '#c9772a']) : (night ? '#171d30' : Lin(g, 0, sy + 16, 0, sy + 72, [0, '#a9c6da', 1, '#4f6f88']));
      g.fill();
      g.fillStyle = ['#e53935', '#2f7de1', '#2fb463', '#f2962b'][(v + x / 120) % 4 | 0]; g.fillRect(x - 4, sy + 9, 108, 9);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 4, sy + 17, 108, 3);
    }
    return c;
  }

  function MakeBill(night, gr) {
    const c = Cv(240, 120), g = c.getContext('2d'), gc = GradeColor(gr.Pct);
    RR(g, 0, 0, 240, 120, 8); g.fillStyle = '#23262d'; g.fill();
    RR(g, 7, 7, 226, 106, 5);
    g.fillStyle = night ? Lin(g, 0, 7, 0, 113, [0, '#2a1f45', 1, '#120c22']) : Lin(g, 0, 7, 0, 113, [0, '#ffffff', 1, '#e7edf3']);
    g.fill();
    g.fillStyle = gc; g.fillRect(7, 7, 226, 22);
    g.font = '800 15px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#111'; g.fillText(gr.subject.toUpperCase().slice(0, 16), 120, 19);
    g.font = '900 46px "Arial Black", "Segoe UI Black", sans-serif';
    if (night) { g.shadowColor = gc; g.shadowBlur = 16; }
    g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = night ? '#000' : '#1b1b1b'; g.strokeText(ShortLabel(gr), 120, 70);
    g.fillStyle = gc; g.fillText(ShortLabel(gr), 120, 70); g.shadowBlur = 0;
    g.font = '700 10px "IBM Plex Mono", monospace'; g.fillStyle = night ? '#c4b5fd' : '#555'; g.fillText('GRADEFLOW', 196, 104);
    return c;
  }

  function MakeBridge(pal) {
    const w = 840, h = 42, c = Cv(w, h), g = c.getContext('2d'), night = pal.night;
    g.fillStyle = Lin(g, 0, 10, 0, h, [0, Shade(pal.wall, 0.12), 1, pal.wallD]); g.fillRect(0, 10, w, h - 10);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < w; x += 60) g.fillRect(x, 10, 2, h - 10);
    g.fillStyle = pal.wallTop; g.fillRect(0, 8, w, 4);
    g.fillStyle = pal.pole;
    g.fillRect(0, 0, w, 2.5);
    for (let x = 4; x < w; x += 14) g.fillRect(x, 0, 2, 9);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, h - 4, w, 4);
    const gr = PickGrade(), gc = GradeColor(gr.Pct);
    RR(g, w / 2 - 120, 14, 240, 22, 4); g.fillStyle = night ? '#0f3b2a' : '#1f6b45'; g.fill();
    g.strokeStyle = '#f2f2f2'; g.lineWidth = 2; g.stroke();
    g.font = '800 15px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.fillText(gr.subject.toUpperCase().slice(0, 14), w / 2 - 30, 25.5);
    g.fillStyle = gc; g.fillText(ShortLabel(gr), w / 2 + 78, 25.5);
    Tag(g, Abbr(PickGrade().subject), 130, 26, 20, '#ff5ca8', -0.05, night);
    Tag(g, `${Math.round(PickGrade().Pct ?? 50)}%`, 700, 26, 20, '#38bdf8', 0.05, night);
    return c;
  }

  function MakeGround(pal) {
    const w = 422, h = 192, c = Cv(w, h), g = c.getContext('2d');
    g.fillStyle = pal.ground; g.fillRect(0, 0, w, h);
    for (const lc of [-LANE, 0, LANE]) {
      const x0 = (lc + 6.6 - 1.5) * 32, bw = 3 * 32;
      g.fillStyle = Lin(g, x0, 0, x0 + bw, 0, [0, Alpha(pal.bed, 0), 0.15, pal.bed, 0.85, pal.bed, 1, Alpha(pal.bed, 0)]);
      g.fillRect(x0, 0, bw, h);
    }
    g.fillStyle = Lin(g, 0, 0, 90, 0, [0, pal.dirt, 0.7, pal.dirt, 1, Alpha(pal.dirt, 0)]); g.fillRect(0, 0, 90, h);
    g.fillStyle = Lin(g, w - 90, 0, w, 0, [0, Alpha(pal.dirt, 0), 0.3, pal.dirt, 1, pal.dirt]); g.fillRect(w - 90, 0, 90, h);
    for (let i = 0; i < 3400; i++) {
      const x = Math.random() * w, y = Math.random() * h, s = 1 + Math.random() * 2.2;
      g.globalAlpha = 0.25 + Math.random() * 0.55;
      g.fillStyle = Math.random() < 0.5 ? pal.gravelD : pal.gravelL;
      g.fillRect(x, y, s, s * 0.8);
      if (y < 3) g.fillRect(x, y + h, s, s * 0.8);
      if (y > h - 3) g.fillRect(x, y - h, s, s * 0.8);
    }
    g.globalAlpha = 1;
    if (!pal.night) {
      g.strokeStyle = '#6d8f3c'; g.lineWidth = 1.5;
      for (let i = 0; i < 90; i++) {
        const x = Math.random() < 0.5 ? Math.random() * 40 : w - Math.random() * 40, y = 4 + Math.random() * (h - 8);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 5); g.moveTo(x, y); g.lineTo(x + 2, y - 6); g.stroke();
      }
    }
    return c;
  }

  function MakeSky(pal) {
    const c = Cv(CV_W, HY + 30), g = c.getContext('2d');
    g.fillStyle = Lin(g, 0, 0, 0, HY + 30, [0, pal.sky[0], 0.62, pal.sky[1], 1, pal.sky[2]]); g.fillRect(0, 0, CV_W, HY + 30);
    if (pal.night) {
      for (let i = 0; i < 150; i++) { g.globalAlpha = 0.3 + Math.random() * 0.7; Ball(g, Math.random() * CV_W, Math.random() * (HY - 30), Math.random() * 1.3 + 0.3, '#fff'); }
      g.globalAlpha = 1;
      Ball(g, 592, 50, 60, Rad(g, 592, 50, 60, [0, 'rgba(255,235,210,0.45)', 1, 'rgba(255,235,210,0)']));
      Ball(g, 592, 50, 19, Rad(g, 586, 44, 22, [0, '#fffdf2', 1, '#f1e3c2']));
      Ball(g, 586, 46, 4, 'rgba(180,160,130,0.45)'); Ball(g, 598, 56, 3, 'rgba(180,160,130,0.4)');
    } else {
      Ball(g, 590, 48, 110, Rad(g, 590, 48, 110, [0, 'rgba(255,253,225,0.85)', 0.25, 'rgba(255,246,190,0.35)', 1, 'rgba(255,246,190,0)']));
      Ball(g, 590, 48, 22, '#fffbe6');
    }
    return c;
  }

  function MakeCity(pal) {
    const w = 1800, h = 170, c = Cv(w, h), g = c.getContext('2d'), night = pal.night;
    for (let layer = 0; layer < 2; layer++) {
      let x = -10;
      while (x < w) {
        const bw = 30 + Math.random() * 70, bh = (layer ? 30 : 60) + Math.random() * (layer ? 70 : 90);
        g.fillStyle = pal.city[layer];
        g.fillRect(x, h - bh, bw, bh);
        if (Math.random() < 0.25) g.fillRect(x + bw * 0.45, h - bh - 18, 3, 18);
        if (Math.random() < 0.2) { g.beginPath(); g.moveTo(x, h - bh); g.lineTo(x + bw / 2, h - bh - 16); g.lineTo(x + bw, h - bh); g.fill(); }
        if (night) {
          for (let wy = h - bh + 6; wy < h - 4; wy += 7) for (let wx = x + 4; wx < x + bw - 4; wx += 6) {
            if (Math.random() < (layer ? 0.3 : 0.18)) { g.fillStyle = ['#ffd27a', '#ff7ac6', '#7ad8ff'][0 | Math.random() * 3]; g.globalAlpha = layer ? 0.8 : 0.5; g.fillRect(wx, wy, 2, 3); g.globalAlpha = 1; }
          }
        } else if (layer) {
          g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, h - bh, 3, bh);
        }
        x += bw + (layer ? 2 : -6) + Math.random() * 8;
      }
    }
    return c;
  }

  function MakeCloud() {
    const c = Cv(280, 100), g = c.getContext('2d');
    for (let i = 0; i < 7; i++) {
      const x = 50 + i * 30 + Math.random() * 10, y = 62 - Math.sin(i / 6 * Math.PI) * 26 - Math.random() * 8, r = 22 + Math.random() * 18;
      Ball(g, x, y, r, Rad(g, x - r * 0.3, y - r * 0.4, r * 1.3, [0, '#ffffff', 0.7, '#f4f9ff', 1, '#d8e8f5']));
    }
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 78, 280, 22);
    return c;
  }

  const OUTL = '#1a1a28';
  const SKIN = '#f2c38f';

  function BuildSprites(night) {
    const pal = night ? PALS.night : PALS.day, g = ctx;
    const S = { night, pal };
    S.sky = MakeSky(pal);
    S.city = MakeCity(pal);
    S.clouds = night ? [] : [MakeCloud(), MakeCloud(), MakeCloud()];
    S.ground = MakeGround(pal);
    S.fronts = []; S.lit = []; S.sides = [];
    LIVERY.forEach(lv => {
      const gr = PickGrade(), lab = ShortLabel(gr), num = String(10 + (0 | Math.random() * 89));
      S.fronts.push(MakeFront(lv, false, night, lab, num));
      S.lit.push(MakeFront(lv, true, night, lab, num));
      S.sides.push(MakeSide(lv, night, gr));
    });
    S.roof = MakeRoof(night);
    S.bars = MakeBars(night);
    S.coins = MakeCoins();
    S.icons = {};
    for (const k of PU_LIST.concat('board')) S.icons[k] = MakeIcon(k);
    S.walls = [0, 1, 2, 3, 4, 5, 4, 1].map(v => MakeWall(pal, v));
    S.facades = [0, 1, 2, 3].map(v => MakeFacade(pal, v));
    S.bcol = (night ? ['#3b2c4a', '#463a52', '#2e3550', '#2f4846'] : ['#b8603f', '#d8c39f', '#8697ac', '#6fa699']).map((b, i) => night
      ? [b, Shade(b, -0.35), Shade(b, 0.18), i % 2 ? '#9fd3ff' : '#ffd27a', '#141a2c', Shade(b, 0.3), i % 2 ? '#ffd27a' : '#ff9fd8']
      : [b, Shade(b, -0.35), Shade(b, 0.38), '#dcf0fa', '#7fa7c4', Shade(b, 0.5), '#5d7f99']);
    S.bills = [0, 1, 2, 3].map(() => MakeBill(night, PickGrade()));
    S.bridge = MakeBridge(pal);
    S.bridgeUnder = night ? '#1d1828' : '#5c5a58';
    S.roofCol = night ? '#2a2536' : '#6f737c';
    S.rampTop = night ? '#6d6a80' : '#a9b0ba';
    S.rampSide = night ? '#2c2a38' : '#4a4f58';
    S.skyBand = Lin(g, 0, HY - 70, 0, HY + 2, [0, Alpha(pal.fog, 0), 1, Alpha(pal.fog, 0.85)]);
    S.fogBand = Lin(g, 0, HY - 2, 0, HY + 40, [0, Alpha(pal.fog, 0.92), 0.25, Alpha(pal.fog, 0.8), 1, Alpha(pal.fog, 0)]);
    S.railTop = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.12, pal.rail, 1, pal.rail]);
    S.railSide = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.12, pal.railSide, 1, pal.railSide]);
    S.groundBase = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.15, pal.ground, 1, pal.ground]);
    S.glow = Rad(g, 0, 0, 1, [0, night ? 'rgba(255,240,190,0.85)' : 'rgba(255,244,200,0.6)', 1, 'rgba(255,244,200,0)']);
    S.vign = Rad(g, CX, CV_H / 2, 440, [0, 'rgba(230,30,40,0)', 0.62, 'rgba(230,30,40,0)', 1, 'rgba(230,30,40,0.55)']);
    S.gHood = Lin(g, -18, 0, 18, 0, [0, '#1a5f9e', 0.3, '#5cc0ff', 0.65, '#2e9df0', 1, '#174f86']);
    S.jeans = '#34426e';
    S.gPack = Lin(g, -12, 0, 12, 0, [0, '#c4500c', 0.35, '#ffa04d', 0.7, '#ff7a1f', 1, '#b84a0a']);
    S.gCap = Lin(g, 0, -116, 0, -100, [0, '#ff6f61', 1, '#c62828']);
    S.gCoat = Lin(g, -24, 0, 24, 0, [0, '#121c3a', 0.3, '#3a5296', 0.65, '#24366b', 1, '#0f1832']);
    S.gJet = Lin(g, -16, 0, 16, 0, [0, '#7d838c', 0.35, '#f2f4f7', 0.6, '#b9bec6', 1, '#5f656e']);
    S.gFlame = Lin(g, 0, 0, 0, 16, [0, '#ffffff', 0.25, '#fff176', 0.6, '#ff9800', 1, 'rgba(255,60,0,0)']);
    S.gBoard = Lin(g, -34, 0, 34, 0, [0, '#22d3ee', 0.5, '#f472b6', 1, '#facc15']);
    S.gBoardGlow = Rad(g, 0, 0, 34, [0, 'rgba(34,211,238,0.55)', 1, 'rgba(34,211,238,0)']);
    S.gBall = Rad(g, -9, -35, 34, [0, 'rgba(255,255,255,0.35)', 0.45, 'rgba(255,255,255,0)', 0.8, 'rgba(0,0,0,0.12)', 1, 'rgba(0,0,0,0.35)']);
    S.gDog = Lin(g, -16, 0, 16, 0, [0, '#7a4a1e', 0.4, '#d18d4a', 1, '#6e4219']);
    return S;
  }

  function NewGame() {
    camX = 0; camY = CAM_H; camZ = -CAM_BACK;
    const gr = _grades.reduce((a, b) => ((b.Pct ?? 0) > (a.Pct ?? 0) ? b : a), _grades[0]);
    return {
      status: 'start', t: 0, last: 0, dist: 0, speed: V0, score: 0, coins: 0, mult: 1,
      lane: 0, x: 0, prevX: 0, y: 0, vy: 0, ground: true, surf: 0, rollT: 0, rollQ: false, lean: 0, phase: 0,
      jet: 0, jetFall: false, sneak: 0, magnet: 0, double: 0, board: 0, boardAvail: true, invT: 0,
      stumbleT: 0, wobT: 0, insT: 2.6, insZ: -2.4, insX: -0.8, crashT: 0, crashKind: '', shake: 0, flash: 0, lastSpace: -9,
      popup: '', popT: 0, tagCol: GradeColor(gr.Pct), best0: LoadBest(),
      T: [], B: [], C: [], I: [],
      gen: { z: 26, cover: [0, 0, 0], obj: [null, null, null], mv: [false, false, false], reserve: [0, 0, 0], prev: [false, false, false],
             last: ['E', 'E', 'E'], free: [0, 0, 0], gm: 7, rm: 0, pu: 200, clearA: 0, clearB: 0 },
    };
  }

  function PickCell(f, allowR, after, z) {
    const wE = 0.4 - 0.14 * f, wL = 0.12, wH = 0.1, wM = 0.04 + 0.04 * f, wS = after || z < 300 ? 0 : 0.03 + 0.02 * f;
    const wT = after ? 0 : 0.1 + 0.05 * f, wR = allowR ? 0.09 + 0.03 * f : 0, wV = after || z < 450 ? 0 : 0.04 + 0.05 * f;
    let r = Math.random() * (wE + wL + wH + wM + wS + wT + wR + wV);
    if ((r -= wE) < 0) return 'E';
    if ((r -= wL) < 0) return 'L';
    if ((r -= wH) < 0) return 'H';
    if ((r -= wM) < 0) return 'M';
    if ((r -= wS) < 0) return 'S';
    if ((r -= wT) < 0) return 'T';
    if ((r -= wR) < 0) return 'R';
    return 'V';
  }

  function Reach(cells, cov, cpv, mv, gm, rm) {
    let open = gm, nr = 0;
    for (let l = 0; l < 3; l++) {
      if (!(rm >> l & 1)) continue;
      if (cov[l] && !mv[l]) nr |= 1 << l; else open |= 1 << l;
      for (let n = l - 1; n <= l + 1; n += 2) {
        if (n < 0 || n > 2) continue;
        if (cpv[n] && cov[n] && !mv[n]) nr |= 1 << n;
        else if (!cpv[n]) open |= 1 << n;
      }
    }
    for (let pass = 0; pass < 2; pass++) for (let l = 0; l < 3; l++) {
      if (!(open >> l & 1)) continue;
      for (let n = l - 1; n <= l + 1; n += 2) if (n >= 0 && n < 3 && !cpv[n] && cells[n] !== 'R') open |= 1 << n;
    }
    let ng = 0;
    for (let l = 0; l < 3; l++) {
      if (!(open >> l & 1) || cov[l]) continue;
      const c = cells[l];
      if (c === 'R') nr |= 1 << l;
      else if (c === 'E' || c === 'L' || c === 'H' || c === 'M') ng |= 1 << l;
    }
    return ng | nr << 3;
  }

  function IsTrain(c) { return c === 'T' || c === 'R' || c === 'V'; }

  function GenRow() {
    const G = GS.gen, s = GS.speed, R = Math.max(14, s * 1.05), z = G.z + R, f = Math.min(1, z / 2500);
    const cov = [z <= G.cover[0], z <= G.cover[1], z <= G.cover[2]];
    const calm = z < 70 || (z > G.clearA && z < G.clearB) || Math.random() < 0.2 - 0.12 * f;
    const cells = ['E', 'E', 'E'];
    let best = null, mask = 0;
    for (let tries = 0; tries < 10 && !best && !calm; tries++) {
      let trains = 0;
      for (let l = 0; l < 3; l++) {
        cells[l] = 'E';
        if (cov[l]) { trains++; continue; }
        if (z <= G.reserve[l]) continue;
        const after = G.prev[l];
        cells[l] = PickCell(f, !after && G.last[l] === 'E', after, z);
        if (IsTrain(cells[l])) trains++;
      }
      if (trains > 2) continue;
      const m = Reach(cells, cov, G.prev, G.mv, G.gm, G.rm);
      if (m & 7) { best = cells.slice(); mask = m; }
    }
    if (!best) { best = ['E', 'E', 'E']; mask = Reach(best, cov, G.prev, G.mv, G.gm, G.rm); }
    for (let l = 0; l < 3; l++) {
      const c = best[l], x = (l - 1) * LANE;
      if (IsTrain(c)) {
        const cars = 1 + (Math.random() * 2.7 | 0), L = cars * CAR + (cars - 1) * GAP;
        const t = { x, z, L, cars, lv: 0 | Math.random() * LIVERY.length, ramp: c === 'R', mv: c === 'V', v: 0, M: z, act: false, dead: false };
        if (t.mv) {
          t.v = 6 + Math.random() * 3;
          t.z = z + D_ACT * t.v / s;
          G.cover[l] = z + L * s / (s + t.v) + 1.5;
          G.reserve[l] = t.z + L + 6;
          G.free[l] = G.reserve[l];
        } else {
          G.cover[l] = z + L + 2;
          G.free[l] = z + L + 1;
        }
        G.obj[l] = t; G.mv[l] = t.mv;
        GS.T.push(t);
      } else if (c !== 'E') GS.B.push({ x, z, type: c, L: 0, dead: false });
    }
    const opts = [];
    for (let l = 0; l < 3; l++) { if (mask >> (l + 3) & 1) opts.push(l + 3, l + 3); if (mask >> l & 1) opts.push(l); }
    if (opts.length) {
      const st = opts[0 | Math.random() * opts.length];
      if (z > G.pu && GS.jet <= 0) { PlaceItem(st, z, R, best); G.pu = z + 260 + Math.random() * 240; }
      else if (Math.random() < 0.66) RowCoins(st, z, R, best);
    }
    G.prev = [cov[0] || IsTrain(best[0]), cov[1] || IsTrain(best[1]), cov[2] || IsTrain(best[2])];
    G.last = best; G.gm = mask & 7; G.rm = mask >> 3; G.z = z;
  }

  function AddCoin(x, y, z, car, air) { GS.C.push({ x, y, z, car, air, mag: false, dead: false, L: 0 }); }

  function RowCoins(st, z, R, cells) {
    const G = GS.gen, l = st % 3, x = (l - 1) * LANE, c = cells[l];
    if (st >= 3) {
      const t = G.obj[l];
      if (!t) return;
      if (c === 'R') { for (let zz = z - RAMP + 0.8; zz < z + R * 0.6 && zz < t.z + t.L - 1; zz += 2) AddCoin(x, (zz < z ? TH * (zz - z + RAMP) / RAMP : TH) + 0.9, zz, t, false); }
      else { const b = Math.min(z + R * 0.5, t.z + t.L - 1); for (let zz = Math.max(z - R * 0.5, t.z + 1); zz < b; zz += 2) AddCoin(x, TH + 0.9, zz, t, false); }
      return;
    }
    const a = Math.max(z - R * 0.6, G.free[l]), b = z + R * 0.3;
    if (c === 'L' || c === 'M') {
      const half = GS.speed * JUMP_V / GRAV;
      for (let zz = a; zz < b; zz += 2) { const u = (zz - z) / half; AddCoin(x, 1 + (Math.abs(u) < 1 ? 1.6 * (1 - u * u) : 0), zz, null, false); }
    } else {
      for (let zz = a; zz < b; zz += 2) AddCoin(x, c === 'H' && Math.abs(zz - z) < 4 ? 0.5 : 1, zz, null, false);
    }
  }

  function PlaceItem(st, z, R, cells) {
    const G = GS.gen, l = st % 3, r = Math.random();
    const type = r < 0.2 ? 'jet' : r < 0.45 ? 'sneak' : r < 0.75 ? 'magnet' : 'double';
    if (st >= 3) {
      const t = G.obj[l];
      if (!t) return;
      const zz = Math.min(cells[l] === 'R' ? z + 3 : z, t.z + t.L - 2);
      GS.I.push({ type, x: (l - 1) * LANE, y: TH + 1.1, z: zz, car: t, L: 0, dead: false });
    } else {
      const zz = z - R * 0.4;
      if (zz > G.free[l]) GS.I.push({ type, x: (l - 1) * LANE, y: 1.1, z: zz, car: null, L: 0, dead: false });
    }
  }

  function JetCoins() {
    const p = GS;
    let l = p.lane, zz = p.dist + 20, next = zz + 24 + Math.random() * 10, x = l * LANE;
    const end = p.dist + p.speed * DUR.jet - 15;
    while (zz < end) {
      if (zz > next) { l = Math.max(-1, Math.min(1, l + (Math.random() < 0.5 ? -1 : 1))); next = zz + 22 + Math.random() * 14; }
      x += Math.max(-0.7, Math.min(0.7, l * LANE - x));
      AddCoin(x, JET_Y + 0.7, zz, null, true);
      zz += 2.2;
    }
  }

  function ClearLanding(ze) {
    const p = GS, G = p.gen, a = ze - 14, b = ze + 45;
    for (const t of p.T) {
      const near = t.ramp ? t.z - RAMP : t.z;
      if (t.mv ? t.M > ze - 30 && t.M < ze + 70 : near < b && t.z + t.L > a) t.dead = true;
    }
    for (const o of p.B) if (o.z > a && o.z < b) o.dead = true;
    for (const c of p.C) if (c.car?.dead) c.dead = true;
    for (const it of p.I) if (it.car?.dead) it.dead = true;
    for (let l = 0; l < 3; l++) if (G.obj[l]?.dead) { G.cover[l] = 0; G.obj[l] = null; G.mv[l] = false; }
    G.clearA = a; G.clearB = b;
  }

  function Prune(a, zmin) {
    let j = 0;
    for (let i = 0; i < a.length; i++) { const o = a[i]; if (!o.dead && o.z + o.L > zmin) a[j++] = o; }
    a.length = j;
  }

  function Surface(x, z) {
    let top = 0;
    const T = GS.T;
    for (let i = 0; i < T.length; i++) {
      const t = T[i];
      if (t.dead || Math.abs(x - t.x) > TW + 0.2) continue;
      if (z > t.z - 0.3 && z < t.z + t.L + 0.3) top = TH;
      else if (t.ramp && z > t.z - RAMP && z <= t.z) top = Math.max(top, TH * (z - t.z + RAMP) / RAMP);
    }
    return top;
  }

  const PARTS = Array.from({ length: 160 }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, size: 0, col: '', kind: 0, g: 0 }));
  function Spawn(x, y, vx, vy, life, size, col, kind, g) {
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (q.on) continue;
      q.on = true; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = life; q.age = 0; q.size = size; q.col = col; q.kind = kind; q.g = g;
      return;
    }
  }
  function Dust() {
    if (!Proj(GS.x, GS.surf, GS.dist)) return;
    for (let i = 0; i < 6; i++) Spawn(PX + (Math.random() - 0.5) * 30, PY - 4, (Math.random() - 0.5) * 120, -20 - Math.random() * 40, 0.45, 6 + Math.random() * 6, 'rgba(225,215,200,0.7)', 1, 0);
  }
  function Sparkle(c) {
    if (!Proj(c.x, c.y, c.z)) return;
    for (let i = 0; i < 3; i++) Spawn(PX + (Math.random() - 0.5) * 16, PY + (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 90, -60 - Math.random() * 60, 0.4, 5 + Math.random() * 4, '#fff3a3', 2, 0);
  }
  function Shards(n, cols) {
    if (!Proj(GS.x, GS.y + 0.6, GS.dist)) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      Spawn(PX, PY, Math.cos(a) * v, Math.sin(a) * v - 120, 0.7 + Math.random() * 0.4, 4 + Math.random() * 6, cols[i % cols.length], 0, 700);
    }
  }
  function Parts(dt) {
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (!q.on) continue;
      q.age += dt;
      if (q.age >= q.life) { q.on = false; continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt;
    }
  }

  function Steer(d) {
    const p = GS, n = Math.max(-1, Math.min(1, p.lane + d));
    if (n === p.lane) { p.lean = d * 0.25; return; }
    p.lane = n;
  }
  function Jump() {
    const p = GS;
    if (p.jet > 0 || p.jetFall || !p.ground) return;
    p.vy = p.sneak > 0 ? SNEAK_V : JUMP_V; p.ground = false; p.rollT = 0; p.rollQ = false;
  }
  function Roll() {
    const p = GS;
    if (p.jet > 0 || p.jetFall) return;
    if (p.ground) p.rollT = ROLL_T;
    else { p.vy = Math.min(p.vy, -22); p.rollQ = true; }
  }
  function Board() {
    const p = GS;
    if (!p.boardAvail || p.board > 0 || p.status !== 'playing') return false;
    p.board = DUR.board; p.boardAvail = false; p.popup = 'board'; p.popT = 1.4;
    return true;
  }

  function Power(type) {
    const p = GS;
    p.popup = type; p.popT = 1.6;
    if (type === 'jet') {
      p.jet = DUR.jet; p.jetFall = false; p.rollT = 0; p.vy = 0; p.ground = false;
      ClearLanding(p.dist + p.speed * (DUR.jet + 1.3));
      JetCoins();
    } else p[type] = DUR[type];
  }

  function BreakBoard() {
    const p = GS;
    p.board = 0; p.invT = 2; p.shake = 0.4; p.flash = 0.25;
    Shards(26, ['#22d3ee', '#f472b6', '#facc15', '#ffffff']);
  }
  function Crash(kind) {
    const p = GS;
    p.status = 'crash'; p.crashKind = kind; p.crashT = 0; p.shake = 0.55; p.flash = kind === 'crash' ? 0.35 : 0.15;
    p.insT = 9; p.rollT = 0;
    Shards(10, ['#ffffff', '#fde68a']);
  }
  function Stumble() {
    const p = GS;
    p.shake = 0.35; p.wobT = 0.5;
    if (p.stumbleT > 0) { if (p.board > 0) BreakBoard(); else Crash('caught'); return; }
    p.stumbleT = 9; p.insT = 9;
  }
  function Hit(head, ox, oz) {
    const p = GS;
    if (head) {
      if (p.board > 0) { BreakBoard(); return; }
      p.dist = oz - 0.45; camZ = p.dist - CAM_BACK;
      Crash('crash');
      return;
    }
    p.lane = Math.max(-1, Math.min(1, Math.round(ox / LANE) + (p.prevX > ox ? 1 : -1)));
    p.x = p.prevX;
    Stumble();
  }

  function Collide() {
    const p = GS, h = p.rollT > 0 ? 0.8 : 1.7, z = p.dist, y = p.y;
    for (let i = 0; i < p.T.length; i++) {
      const t = p.T[i], ox = TW + 0.33;
      if (t.dead || Math.abs(p.x - t.x) >= ox) continue;
      let top = -1;
      if (z + 0.3 > t.z && z - 0.3 < t.z + t.L) top = TH;
      else if (t.ramp && z > t.z - RAMP && z <= t.z) top = TH * (z - t.z + RAMP) / RAMP;
      if (top < 0 || y >= top - 0.45) continue;
      Hit(top === TH && Math.abs(p.prevX - t.x) < ox, t.x, t.z);
      return;
    }
    for (let i = 0; i < p.B.length; i++) {
      const b = p.B[i], tp = b.type, ox = tp === 'S' ? 1.05 : 1.25;
      if (b.dead || Math.abs(z - b.z) > 0.45 || Math.abs(p.x - b.x) >= ox) continue;
      const hit = tp === 'L' ? y < 0.95 : tp === 'H' ? y + h > 1.3 && y < 2.7 : tp === 'M' ? y + h > 0.78 && y < 1.42 : y < 3.3;
      if (!hit) continue;
      Hit(Math.abs(p.prevX - b.x) < ox, b.x, b.z);
      return;
    }
  }

  function Player(dt) {
    const p = GS, tx = p.lane * LANE;
    p.prevX = p.x;
    p.x += (tx - p.x) * (1 - Math.exp(-dt * 20));
    if (Math.abs(tx - p.x) < 0.01) p.x = tx;
    p.lean += ((tx - p.x) * 0.13 - p.lean) * Math.min(1, dt * 14);
    p.surf = Surface(p.x, p.dist);
    if (p.jet > 0) {
      p.y += (JET_Y - p.y) * (1 - Math.exp(-dt * 3)); p.vy = 0;
    } else if (p.jetFall) {
      p.y -= dt * 7;
      if (p.y <= p.surf) { p.y = p.surf; p.jetFall = false; p.ground = true; p.invT = Math.max(p.invT, 1); Dust(); }
    } else {
      if (p.ground) {
        if (p.surf > p.y && p.surf - p.y < 0.75) p.y = p.surf;
        else if (p.surf < p.y - 0.05) { p.ground = false; p.vy = 0; }
      }
      if (!p.ground) {
        p.vy -= GRAV * dt;
        p.y += p.vy * dt;
        if (p.y <= p.surf) {
          p.y = p.surf; p.vy = 0; p.ground = true;
          if (p.rollQ) { p.rollQ = false; p.rollT = ROLL_T; }
          Dust();
        }
      }
    }
    if (p.rollT > 0) p.rollT -= dt;
    p.phase += dt * (5.5 + p.speed * 0.42);
    if (p.jet <= 0 && !p.jetFall && p.invT <= 0) Collide();
  }

  function Pickups(dt) {
    const p = GS, h = p.rollT > 0 ? 0.8 : 1.7, k = 1 - Math.exp(-dt * 10);
    for (let i = 0; i < p.C.length; i++) {
      const c = p.C[i];
      if (c.dead) continue;
      let dz = c.z - p.dist;
      if (p.magnet > 0 && !c.mag && !c.air && dz < 28 && dz > -1) { c.mag = true; c.car = null; }
      if (c.mag) { c.x += (p.x - c.x) * k; c.y += (p.y + 1 - c.y) * k; c.z += (p.dist + 0.3 - c.z) * k; dz = c.z - p.dist; }
      const r = c.mag ? 1.4 : 1;
      if (Math.abs(dz) < r && Math.abs(c.x - p.x) < r - 0.1 && c.y > p.y - 0.3 && c.y < p.y + h + 0.6) { c.dead = true; p.coins++; Sparkle(c); }
    }
    for (let i = 0; i < p.I.length; i++) {
      const it = p.I[i];
      if (it.dead || Math.abs(it.z - p.dist) > 1.1 || Math.abs(it.x - p.x) > 1 || it.y < p.y - 0.4 || it.y > p.y + h + 0.9) continue;
      it.dead = true;
      Power(it.type);
    }
  }

  function Chaser(dt) {
    const p = GS, target = p.status === 'crash' ? -0.95 : p.insT > 0 ? -2.4 : -12;
    p.insZ += (target - p.insZ) * Math.min(1, dt * (p.status === 'crash' ? 3 : p.insT > 0 ? 2.2 : 0.8));
    p.insX += (p.x - 0.85 - p.insX) * Math.min(1, dt * 4);
  }

  function Camera(dt) {
    const p = GS, flying = p.jet > 0 || p.jetFall;
    camX += (p.x * 0.75 - camX) * (1 - Math.exp(-dt * 6));
    const ty = CAM_H + (flying ? p.y * 0.9 : p.surf * 0.88 + Math.max(0, p.y - p.surf) * 0.3);
    camY += (ty - camY) * (1 - Math.exp(-dt * 4));
    camZ = p.dist - CAM_BACK;
  }

  function Timers(dt) {
    const p = GS;
    p.t += dt;
    for (let i = 0; i < HUD_PU.length; i++) if (p[HUD_PU[i]] > 0) p[HUD_PU[i]] = Math.max(0, p[HUD_PU[i]] - dt);
    p.invT = Math.max(0, p.invT - dt); p.stumbleT = Math.max(0, p.stumbleT - dt); p.insT = Math.max(0, p.insT - dt);
    p.wobT = Math.max(0, p.wobT - dt); p.shake = Math.max(0, p.shake - dt); p.flash = Math.max(0, p.flash - dt); p.popT = Math.max(0, p.popT - dt);
  }

  function Overrun(a, t) {
    for (let i = 0; i < a.length; i++) { const o = a[i]; if (Math.abs(o.x - t.x) < 1 && o.z > t.z - 0.5 && o.z < t.z + t.L) o.dead = true; }
  }

  function Update(dt) {
    const p = GS, jetWas = p.jet > 0;
    Timers(dt);
    if (jetWas && p.jet <= 0) p.jetFall = true;
    p.speed = Math.min(VMAX, p.speed + dt * (p.speed < 20 ? 0.075 : 0.04));
    const s = p.speed, dd = s * dt;
    p.dist += dd;
    p.mult = p.double > 0 ? 2 : 1;
    p.score += dd * p.mult;
    while (p.gen.z < p.dist + 200) GenRow();
    for (let i = 0; i < p.T.length; i++) {
      const t = p.T[i];
      if (!t.mv) continue;
      if (!t.act && t.M - p.dist <= D_ACT) { t.act = true; t.z = t.M + (t.M - p.dist) * t.v / s; }
      if (t.act) { t.z -= t.v * dt; Overrun(p.B, t); Overrun(p.C, t); Overrun(p.I, t); }
    }
    const zmin = camZ - 3;
    Prune(p.T, zmin); Prune(p.B, zmin); Prune(p.C, zmin); Prune(p.I, zmin);
    Player(dt);
    if (p.status === 'playing') Pickups(dt);
    Chaser(dt);
    Camera(dt);
    Parts(dt);
  }

  function UpdateCrash(dt) {
    const p = GS;
    Timers(dt);
    p.crashT += dt;
    if (p.y > p.surf) { p.vy -= GRAV * dt; p.y = Math.max(p.surf, p.y + p.vy * dt); }
    Chaser(dt);
    Camera(dt);
    Parts(dt);
    if (p.crashT > 1.5) { p.status = 'gameover'; SaveBest(Math.floor(p.score)); ShowGameOver(); }
  }

  function Proj(x, y, z) {
    const dz = z - camZ;
    if (dz < NEAR - 0.001) return false;
    PK = FOC / dz; PX = CX + (x - camX) * PK; PY = HY - (y - camY) * PK;
    return true;
  }
  function Mv(x, y, z) { Proj(x, y, z); ctx.moveTo(PX, PY); }
  function Ln(x, y, z) { Proj(x, y, z); ctx.lineTo(PX, PY); }
  function FogA(dz) { return Math.max(0, Math.min(1, (FAR - dz) / (FAR - FOG0))); }
  function Haze(dz) { return Math.max(0, Math.min(0.85, (dz - 30) / 150)); }

  function DrawFace(img, u0, v0, uw, vh, xw, za, zb, yb, yt) {
    const zn = camZ + NEAR;
    if (zb <= zn || za - camZ > FAR + 20) return;
    const ox = (xw - camX) * FOC, rev = ox > 0, span = zb - za;
    const ca = Math.max(za, zn), ia = 1 / (ca - camZ), ib = 1 / (zb - camZ);
    const xa = CX + ox * ia, xb = CX + ox * ib;
    const ty = (yt - camY) * FOC, by = (yb - camY) * FOC;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xa, HY - ty * ia); ctx.lineTo(xb, HY - ty * ib); ctx.lineTo(xb, HY - by * ib); ctx.lineTo(xa, HY - by * ia);
    ctx.closePath(); ctx.clip();
    const sw = Math.max(1.5, Math.min(8, 3.5 * Math.abs(xw - camX) / Math.max(0.5, yt - yb)));
    const n = Math.max(1, Math.min(240, Math.ceil(Math.abs(xa - xb) / sw)));
    let pi = ia, pt = (ca - za) / span;
    for (let i = 1; i <= n; i++) {
      const inv = ia + (ib - ia) * i / n, t1 = (1 / inv + camZ - za) / span;
      const iA = rev ? inv : pi, iB = rev ? pi : inv, xA = CX + ox * iA, w = ox * (iB - iA);
      const tA = HY - ty * iA, h = (ty - by) * (iA + iB) * 0.5;
      ctx.setTransform(DPR * w, DPR * ty * (iA - iB), 0, DPR * h, DPR * (xA + SHX), DPR * (tA + SHY));
      ctx.drawImage(img, u0 + uw * (rev ? 1 - t1 : pt), v0, Math.max(0.5, uw * (t1 - pt)), vh, 0, 0, 1 + 0.7 / Math.abs(w), 1);
      pi = inv; pt = t1;
    }
    ctx.restore();
  }

  function DrawRoof(img, x0, x1, za, zb, y) {
    const zn = camZ + NEAR;
    if (zb <= zn) return;
    const span = zb - za, ca = Math.max(za, zn), oy = (y - camY) * FOC;
    const ia = 1 / (ca - camZ), ib = 1 / (zb - camZ), l0 = (x0 - camX) * FOC, l1 = (x1 - camX) * FOC;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX + l0 * ia, HY - oy * ia); ctx.lineTo(CX + l1 * ia, HY - oy * ia); ctx.lineTo(CX + l1 * ib, HY - oy * ib); ctx.lineTo(CX + l0 * ib, HY - oy * ib);
    ctx.closePath(); ctx.clip();
    const n = Math.max(1, Math.min(60, Math.ceil(Math.abs(oy * (ia - ib)) / 3)));
    const ih = img.height, iw = img.width;
    let pi = ia, pt = (ca - za) / span;
    for (let i = 1; i <= n; i++) {
      const inv = ia + (ib - ia) * i / n, t1 = (1 / inv + camZ - za) / span, w = (l1 - l0) * pi + 1, dy = oy * (pi - inv);
      ctx.setTransform(DPR * w, 0, DPR * l0 * (inv - pi), DPR * (dy + (dy > 0 ? 0.6 : -0.6)), DPR * (CX + l0 * pi + SHX), DPR * (HY - oy * pi + SHY));
      ctx.drawImage(img, 0, ih * pt, iw, Math.max(0.5, ih * (t1 - pt)), 0, 0, 1, 1);
      pi = inv; pt = t1;
    }
    ctx.restore();
  }

  function QuadX(x, y0, y1, za, zb) {
    const zn = camZ + NEAR;
    if (zb <= zn) return;
    za = Math.max(za, zn);
    ctx.beginPath(); Mv(x, y0, za); Ln(x, y1, za); Ln(x, y1, zb); Ln(x, y0, zb); ctx.fill();
  }
  function QuadY(y, x0, x1, za, zb) {
    const zn = camZ + NEAR;
    if (zb <= zn) return;
    za = Math.max(za, zn);
    ctx.beginPath(); Mv(x0, y, za); Ln(x1, y, za); Ln(x1, y, zb); Ln(x0, y, zb); ctx.fill();
  }
  function QP(x, y0, y1, za, zb) { Mv(x, y0, za); Ln(x, y1, za); Ln(x, y1, zb); Ln(x, y0, zb); ctx.closePath(); }
  function QuadZ(z, x0, x1, y0, y1) {
    if (!Proj(x0, y1, z)) return;
    const ax = PX, ay = PY;
    Proj(x1, y0, z);
    ctx.fillRect(ax, ay, PX - ax, PY - ay);
  }

  function DrawSky() {
    ctx.drawImage(SPR.sky, 0, 0);
    if (!SPR.night) {
      for (let i = 0; i < SPR.clouds.length; i++) {
        const w = 1000, x = ((i * 340 + GS.t * (5 + i * 2) - camX * 4) % w + w) % w - 200;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(SPR.clouds[i], x, 14 + i * 26, 230 - i * 30, 82 - i * 10);
      }
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(SPR.city, -540 - camX * 4, HY - 142);
    ctx.fillStyle = SPR.skyBand; ctx.fillRect(0, HY - 70, CV_W, 72);
  }

  function DrawGround() {
    ctx.fillStyle = SPR.groundBase; ctx.fillRect(0, HY, CV_W, CV_H - HY);
    const img = SPR.ground;
    for (let y = CV_H; y > HY + 1; ) {
      const h = y - HY > 130 ? 3 : y - HY > 44 ? 2 : 1, yc = y - h * 0.5, dz = camY * FOC / (yc - HY);
      if (dz > FAR) break;
      const k = FOC / dz, xl = CX + (-6.6 - camX) * k, xr = CX + (6.6 - camX) * k;
      let v = ((camZ + dz) * 32) % 192;
      if (v < 0) v += 192;
      ctx.drawImage(img, 0, v, 422, 1, xl, y - h, xr - xl, h + 0.3);
      y -= h;
    }
  }

  const SLP_Z = [NEAR, 26, 40, 56], SLP_A = [1, 0.6, 0.28];
  function DrawTrack() {
    const pal = SPR.pal;
    ctx.fillStyle = pal.sleeper;
    for (let b = 0; b < 3; b++) {
      const za = camZ + SLP_Z[b], zb = camZ + SLP_Z[b + 1];
      ctx.globalAlpha = SLP_A[b];
      ctx.beginPath();
      for (let i = Math.ceil(za / 0.7); i * 0.7 < zb; i++) {
        const z0 = i * 0.7, k0 = FOC / (z0 - camZ), k1 = FOC / (z0 + 0.28 - camZ), y0 = HY + camY * k0, y1 = HY + camY * k1;
        for (let l = -1; l <= 1; l++) {
          const xa = l * LANE - 1.05 - camX, xb = l * LANE + 1.05 - camX;
          ctx.moveTo(CX + xa * k0, y0); ctx.lineTo(CX + xb * k0, y0); ctx.lineTo(CX + xb * k1, y1); ctx.lineTo(CX + xa * k1, y1);
        }
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = Math.floor((camZ + FAR - 90) / 230); i > 0 && BridgeZ(i) + 7 > camZ + NEAR; i--) if (Hash(i * 9.1) < 0.65) QuadY(0.01, -WALL_X, WALL_X, BridgeZ(i) - 0.5, BridgeZ(i) + 6);
    const kn = FOC / NEAR, kf = FOC / FAR;
    for (let l = -1; l <= 1; l++) for (let s = -1; s <= 1; s += 2) {
      const xr = l * LANE + s * 0.72, xs = xr + (xr > camX ? -0.04 : 0.04) - camX, xa = xr - 0.04 - camX, xb = xr + 0.04 - camX, yk = camY - 0.15;
      ctx.fillStyle = SPR.railSide;
      ctx.beginPath();
      ctx.moveTo(CX + xs * kn, HY + camY * kn); ctx.lineTo(CX + xs * kf, HY + camY * kf); ctx.lineTo(CX + xs * kf, HY + yk * kf); ctx.lineTo(CX + xs * kn, HY + yk * kn);
      ctx.fill();
      ctx.fillStyle = SPR.railTop;
      ctx.beginPath();
      ctx.moveTo(CX + xa * kn, HY + yk * kn); ctx.lineTo(CX + xb * kn, HY + yk * kn); ctx.lineTo(CX + xb * kf, HY + yk * kf); ctx.lineTo(CX + xa * kf, HY + yk * kf);
      ctx.fill();
    }
  }

  function DrawWalls() {
    const zn = camZ + NEAR, zf = camZ + FAR;
    for (let s = -1; s <= 1; s += 2) {
      const xw = s * WALL_X;
      ctx.fillStyle = SPR.pal.fog;
      for (let i = Math.floor(zf / 12); i >= Math.floor(zn / 12); i--) {
        DrawFace(SPR.walls[(Hash(i * 3.7 + s) * SPR.walls.length) | 0], 0, 0, 480, 112, xw, i * 12, i * 12 + 12, 0, WALL_H);
        const f = Haze(i * 12 + 6 - camZ);
        if (f > 0) { ctx.globalAlpha = f; QuadX(xw, 0, WALL_H, i * 12, i * 12 + 12.05); ctx.globalAlpha = 1; }
      }
      ctx.fillStyle = SPR.pal.wallTop;
      ctx.beginPath(); Mv(xw, WALL_H, zn); Ln(xw + s * 0.35, WALL_H, zn); Ln(xw + s * 0.35, WALL_H, zf); Ln(xw, WALL_H, zf); ctx.fill();
    }
  }

  const BLD = { z0: 0, z1: 0, x: 0, w: 0, h: 0, v: 0, bill: -1, id: 0 };
  function Bld(i, s) {
    BLD.id = i * 2 + (s > 0 ? 1 : 0);
    const h1 = Hash(i * 13.7 + s * 91.3), h2 = Hash(i * 7.1 + s * 17.9 + 3), h3 = Hash(i * 3.3 + s * 5.5 + 11);
    BLD.z0 = i * 18 + h1 * 3; BLD.z1 = BLD.z0 + 11 + h2 * 5;
    BLD.x = s * (WALL_X + 3.2 + h3 * 4); BLD.w = 7 + h1 * 6;
    BLD.h = 7 + Math.floor(h2 * 5) * 3 + (h3 > 0.8 ? 6 : 0);
    BLD.v = (h3 * 4) | 0; BLD.bill = h1 > 0.62 && BLD.h >= 10 ? (h2 * 4) | 0 : -1;
  }
  function DrawBuildings() {
    const zn = camZ + NEAR, zf = camZ + FAR + 10, B = BLD;
    for (let i = Math.floor(zf / 18); i >= Math.floor((zn - 20) / 18); i--) for (let s = -1; s <= 1; s += 2) {
      Bld(i, s);
      const a = FogA(B.z0 - camZ);
      if (B.z1 < zn || a <= 0) continue;
      ctx.globalAlpha = a;
      const tex = SPR.facades[B.v], th = tex.height, vh = B.h * 24;
      BldSide(B, s, Math.max(B.z0, zn));
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      QuadX(B.x - s * 0.02, B.h - 0.45, B.h, B.z0, B.z1);
      if (B.bill >= 0) DrawFace(SPR.bills[B.bill], 0, 0, 240, 120, B.x - s * 0.12, B.z0 + 2, B.z0 + 8, B.h - 5.5, B.h - 2.5);
      const fa = Haze((B.z0 + B.z1) / 2 - camZ);
      ctx.globalAlpha = a * fa; ctx.fillStyle = SPR.pal.fog;
      QuadX(B.x - s * 0.15, 0, B.h, B.z0, B.z1);
      ctx.globalAlpha = a;
      if (B.z0 > zn && Proj(B.x, B.h, B.z0)) {
        const x1 = PX, y1 = PY, k = PK, x2 = CX + (B.x + s * B.w - camX) * k, y2 = HY + camY * k;
        ctx.drawImage(tex, 0, th - vh, B.w * 24, vh, Math.min(x1, x2), y1, Math.abs(x2 - x1), y2 - y1);
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1), y2 - y1);
        ctx.globalAlpha = a * Haze(B.z0 - camZ); ctx.fillStyle = SPR.pal.fog; ctx.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1), y2 - y1);
        ctx.globalAlpha = a;
      }
      if (camY > B.h) { ctx.fillStyle = SPR.roofCol; QuadY(B.h, B.x, B.x + s * B.w, B.z0, B.z1); }
    }
    ctx.globalAlpha = 1;
  }

  function BldSide(B, s, zs) {
    const c = SPR.bcol[B.v], x = B.x - s * 0.03, z1 = B.z1, floors = Math.floor(B.h / 3);
    ctx.fillStyle = c[0]; QuadX(B.x, 0, B.h, B.z0, z1);
    ctx.fillStyle = c[1]; QuadX(x, 0, 3, B.z0, z1);
    ctx.fillStyle = c[2]; ctx.beginPath();
    for (let f = 1; f < floors; f++) for (let wz = B.z0 + 0.7; wz + 1.6 < z1; wz += 2.5) if (wz + 1.5 > zs) QP(x, f * 3 + 0.45, f * 3 + 2.45, Math.max(wz - 0.1, zs), wz + 1.5);
    ctx.fill();
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = c[3 + pass]; ctx.beginPath();
      for (let f = 1; f < floors; f++) {
        let j = 0;
        for (let wz = B.z0 + 0.7; wz + 1.6 < z1; wz += 2.5, j++) {
          if (wz + 1.4 <= zs) continue;
          const lit = Hash(B.id * 17 + f * 5 + j) < 0.5;
          if (SPR.night ? lit !== !pass : false) continue;
          if (SPR.night) QP(x - s * 0.01, f * 3 + 0.6, f * 3 + 2.3, Math.max(wz, zs), wz + 1.4);
          else QP(x - s * 0.01, pass ? f * 3 + 0.6 : f * 3 + 1.55, pass ? f * 3 + 1.55 : f * 3 + 2.3, Math.max(wz, zs), wz + 1.4);
        }
      }
      ctx.fill();
    }
    ctx.fillStyle = c[5]; ctx.beginPath();
    for (let f = 1; f < floors; f++) for (let wz = B.z0 + 0.7; wz + 1.6 < z1; wz += 2.5) if (wz + 1.5 > zs) QP(x - s * 0.02, f * 3 + 0.4, f * 3 + 0.55, Math.max(wz - 0.15, zs), wz + 1.55);
    for (let wz = B.z0 + 0.5; wz + 3 < z1; wz += 4) if (wz + 3 > zs) QP(x - s * 0.02, 2.35, 2.8, Math.max(wz, zs), wz + 3);
    ctx.fill();
    ctx.fillStyle = c[6]; ctx.beginPath();
    for (let wz = B.z0 + 0.5; wz + 3 < z1; wz += 4) if (wz + 3 > zs) QP(x - s * 0.01, 0.3, 2.35, Math.max(wz + 0.15, zs), wz + 2.85);
    ctx.fill();
  }

  function TrainKey(t, P) {
    const near = t.ramp ? t.z - RAMP : t.z, far = t.z + t.L;
    return far < P ? far : Math.max(near, P + 0.5);
  }

  function DrawTrain(t) {
    const zn = camZ + NEAR, xl = t.x - TW, xr = t.x + TW;
    const side = camX < xl ? xl : camX > xr ? xr : null, tex = SPR.sides[t.lv];
    ctx.globalAlpha = FogA(t.z - camZ) * 0.9;
    ctx.fillStyle = '#000';
    ctx.globalAlpha *= 0.28;
    QuadY(0.02, xl - 0.2, xr + 0.2, t.z - 0.15, t.z + t.L + 0.3);
    for (let i = t.cars - 1; i >= 0; i--) {
      const z0 = t.z + i * (CAR + GAP), z1 = z0 + CAR, a = FogA(z0 - camZ);
      if (z1 <= zn || a <= 0) continue;
      ctx.globalAlpha = a;
      if (i < t.cars - 1) {
        ctx.fillStyle = '#1c1d22';
        if (side !== null) QuadX(side + (side < t.x ? 0.12 : -0.12), 0.35, TH - 0.25, z1, z1 + GAP);
        if (camY > TH) QuadY(TH - 0.25, xl + 0.12, xr - 0.12, z1, z1 + GAP);
      }
      if (side !== null) DrawFace(tex, 0, 0, tex.width, tex.height, side, z0, z1, 0, TH);
      if (camY > TH) DrawRoof(SPR.roof, xl, xr, z0, z1, TH);
    }
    ctx.globalAlpha = FogA(t.z - camZ);
    if (t.z > zn && Proj(xl, TH, t.z)) ctx.drawImage(t.mv ? SPR.lit[t.lv] : SPR.fronts[t.lv], PX, PY, TW * 2 * PK, TH * PK);
    if (t.ramp) DrawRamp(t);
    if (t.mv && t.z > zn + 2) {
      ctx.globalAlpha = Math.min(1, ctx.globalAlpha * (SPR.night ? 1 : 0.7));
      ctx.fillStyle = SPR.glow;
      for (let s = -1; s <= 1; s += 2) if (Proj(t.x + s * 0.7, 0.87, t.z - 0.05)) Glow(PX, PY, 0.55 * PK, 0.55 * PK);
      if (Proj(t.x, 0.02, t.z - 4)) Glow(PX, PY, 2.2 * PK, 0.7 * PK);
    }
    ctx.globalAlpha = 1;
  }

  function Glow(x, y, rx, ry) {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function DrawRamp(t) {
    const zn = camZ + NEAR, zb = t.z, z0 = t.z - RAMP;
    if (zb <= zn) return;
    const za = Math.max(z0, zn), ha = TH * (za - z0) / RAMP, xl = t.x - TW + 0.06, xr = t.x + TW - 0.06;
    const sx = camX < xl ? xl : camX > xr ? xr : null;
    if (sx !== null) {
      ctx.fillStyle = SPR.rampSide;
      ctx.beginPath(); Mv(sx, 0, za); Ln(sx, ha, za); Ln(sx, TH, zb); Ln(sx, 0, zb); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let j = 1; j < 5; j++) { const z = z0 + RAMP * j / 5; if (z > za) { Mv(sx, 0, z); Ln(sx, TH * j / 5, z); } }
      ctx.stroke();
    }
    ctx.fillStyle = SPR.rampTop;
    ctx.beginPath(); Mv(xl, ha, za); Ln(xr, ha, za); Ln(xr, TH, zb); Ln(xl, TH, zb); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, PK * 0.05);
    ctx.beginPath();
    for (let j = 1; j < 12; j++) { const z = z0 + RAMP * j / 12; if (z > za) { Mv(xl, TH * j / 12, z); Ln(xr, TH * j / 12, z); } }
    ctx.stroke();
    ctx.fillStyle = '#f5c518';
    for (let s = 0; s < 2; s++) {
      const x = s ? xr - 0.16 : xl;
      ctx.beginPath(); Mv(x, ha + 0.01, za); Ln(x + 0.16, ha + 0.01, za); Ln(x + 0.16, TH + 0.01, zb); Ln(x, TH + 0.01, zb); ctx.fill();
    }
  }

  function DrawBar(b) {
    const a = FogA(b.z - camZ);
    if (a <= 0 || !Proj(b.x, 0, b.z)) return;
    const d = BAR_DIM[b.type], w = d[0] * PK, h = d[1] * PK;
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, w * 0.52, Math.max(1, 0.18 * PK), 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a;
    ctx.drawImage(SPR.bars[b.type], PX - w / 2, PY - h, w, h);
    ctx.globalAlpha = 1;
  }

  let CoinFrame = 0;
  function DrawCoin(c) {
    if (!Proj(c.x, c.y, c.z)) return;
    const s = 0.74 * PK;
    if (s < 1.2) return;
    ctx.globalAlpha = FogA(c.z - camZ);
    ctx.drawImage(SPR.coins, ((CoinFrame + c.z * 0.45) | 0) % 16 * 64, 0, 64, 64, PX - s / 2, PY - s / 2, s, s);
    ctx.globalAlpha = 1;
  }

  function DrawItem(it) {
    if (!Proj(it.x, it.y + Math.sin(GS.t * 4 + it.z) * 0.15, it.z)) return;
    const s = 1.3 * PK * (1 + Math.sin(GS.t * 6) * 0.05);
    ctx.globalAlpha = FogA(it.z - camZ);
    ctx.drawImage(SPR.icons[it.type], PX - s / 2, PY - s / 2, s, s);
    ctx.globalAlpha = 1;
  }

  function DrawCat(z) {
    const a = FogA(z - camZ);
    if (a <= 0 || z - camZ < NEAR) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = SPR.pal.pole;
    QuadZ(z, -4.55, 4.55, 6.0, 6.3);
    for (let s = -1; s <= 1; s += 2) QuadZ(z, s * 4.35 - 0.12, s * 4.35 + 0.12, 0, 6.3);
    for (let l = -1; l <= 1; l++) QuadZ(z, l * LANE - 0.03, l * LANE + 0.03, WIRE_Y, 6.0);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    QuadZ(z, -4.55, 4.55, 6.24, 6.3);
    for (let s = -1; s <= 1; s += 2) QuadZ(z, s * 4.35 - 0.12, s * 4.35 - 0.05, 0, 6.3);
    ctx.globalAlpha = 1;
  }

  function BridgeZ(i) { return i * 230 + 90; }
  function DrawBridge(z) {
    const a = FogA(z - camZ);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = SPR.pal.pole;
    for (let s = -1; s <= 1; s += 2) QuadZ(z + 2.5, s * 4.75 - 0.25, s * 4.75 + 0.25, 0, 6.5);
    if (camY < 6.5) { ctx.fillStyle = SPR.bridgeUnder; QuadY(6.5, -14, 14, z, z + 5); }
    else if (camY > 7.9) { ctx.fillStyle = SPR.pal.wallTop; QuadY(7.9, -14, 14, z, z + 5); }
    if (z > camZ + NEAR && Proj(-14, 7.9, z)) ctx.drawImage(SPR.bridge, PX, PY, 28 * PK, 1.4 * PK);
    ctx.globalAlpha = 1;
  }

  function DrawWires() {
    const kn = FOC / 1.5, kf = FOC / FAR;
    ctx.strokeStyle = SPR.pal.wire; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let l = -1; l <= 1; l++) {
      const sx = l * LANE - camX, a = WIRE_Y - camY, b = 5.95 - camY;
      ctx.moveTo(CX + sx * kn, HY - a * kn); ctx.lineTo(CX + sx * kf, HY - a * kf);
      ctx.moveTo(CX + sx * kn, HY - b * kn); ctx.lineTo(CX + sx * kf, HY - b * kf);
    }
    ctx.stroke();
  }

  const LG = [{ hx: 0, hy: 0, kx: 0, ky: 0, fx: 0, fy: 0, lift: 0 }, { hx: 0, hy: 0, kx: 0, ky: 0, fx: 0, fy: 0, lift: 0 }];
  const AR = [{ sx: 0, sy: 0, ex: 0, ey: 0, hx: 0, hy: 0, back: 0 }, { sx: 0, sy: 0, ex: 0, ey: 0, hx: 0, hy: 0, back: 0 }];
  let BY = 0, TWS = 0;

  function RunPose(ph) {
    BY = -2.4 * Math.abs(Math.cos(ph)); TWS = Math.sin(ph) * 1.6;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, sw = Math.sin(ph + i * Math.PI), lift = Math.max(0, sw), plant = Math.max(0, -sw), L = LG[i], A = AR[i];
      L.hx = s * 7.5; L.hy = -50 + BY;
      L.kx = s * (8.5 + lift * 1.5); L.ky = -27 - lift * 9 - plant * 2 + BY * 0.5;
      L.fx = s * (7 + lift * 2); L.fy = -2 - lift * 25 - plant * 4;
      L.lift = lift - plant * 0.5;
      const back = Math.max(0, -sw), fwd = Math.max(0, sw);
      A.sx = s * 15 + TWS; A.sy = -81 + BY;
      A.ex = s * (19.5 + back * 3.5); A.ey = -66 - back * 9 + BY;
      A.hx = s * (17.5 + back * 1.5 - fwd * 4.5); A.hy = -55 - back * 21 - fwd * 8 + BY;
      A.back = back - fwd;
    }
  }
  function StandPose() {
    BY = 0; TWS = 0;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i];
      L.hx = s * 7.5; L.hy = -50; L.kx = s * 8.5; L.ky = -27; L.fx = s * 8.5; L.fy = -2; L.lift = -0.2;
      A.sx = s * 15; A.sy = -81; A.ex = s * 19; A.ey = -66; A.hx = s * 18.5; A.hy = -53; A.back = 0.1;
    }
  }
  function JumpPose(vy) {
    const u = Math.max(-1, Math.min(1, vy / JUMP_V));
    BY = -1; TWS = 0;
    const L0 = LG[0], L1 = LG[1];
    L0.hx = -7.5; L0.hy = -50; L0.kx = -10; L0.ky = -33; L0.fx = -8.5; L0.fy = -30 + (1 - u) * 5; L0.lift = 0.9;
    L1.hx = 7.5; L1.hy = -50; L1.kx = 10; L1.ky = -37 + (1 - u) * 4; L1.fx = 8; L1.fy = -16 - u * 3 + (1 - u) * 6; L1.lift = -0.4;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, A = AR[i];
      A.sx = s * 15; A.sy = -81; A.ex = s * 23; A.ey = -84 + (1 - u) * 6; A.hx = s * 27; A.hy = -97 + (1 - u) * 12; A.back = 0.6;
    }
  }
  function BoardPose() {
    const hov = Math.sin(GS.t * 6) * 1.5;
    BY = 1 + hov * 0.5; TWS = 0;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i];
      L.hx = s * 7.5; L.hy = -47 + BY; L.kx = s * 12.5; L.ky = -25 + BY; L.fx = s * 11; L.fy = -6 + hov; L.lift = -0.2;
      A.sx = s * 15; A.sy = -80 + BY; A.ex = s * 25; A.ey = -71 + BY; A.hx = s * 32; A.hy = -64 + BY + Math.sin(GS.t * 3 + i * 2) * 2.5; A.back = 0.3;
    }
  }
  function JetPose() {
    BY = Math.sin(GS.t * 5) * 1.2; TWS = 0;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i], sw = Math.sin(GS.t * 7 + i * 2) * 1.5;
      L.hx = s * 7; L.hy = -50 + BY; L.kx = s * 8; L.ky = -29 + BY + sw; L.fx = s * 6.5; L.fy = -9 + BY + sw; L.lift = 0.1;
      A.sx = s * 15; A.sy = -81 + BY; A.ex = s * 21; A.ey = -70 + BY; A.hx = s * 15; A.hy = -77 + BY; A.back = -0.5;
    }
  }

  function Limb(x0, y0, x1, y1, x2, y2, w, col, hi) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = OUTL; ctx.lineWidth = w + 3.5; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 - w * 0.2, y0); ctx.lineTo(x1 - w * 0.2, y1); ctx.lineTo(x2 - w * 0.2, y2);
    ctx.strokeStyle = hi; ctx.lineWidth = w * 0.28; ctx.stroke();
  }
  function Oval(x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }

  function Shoe(x, y, lift, accent, dark) {
    const s = 1 + Math.max(0, lift) * 0.22 - Math.max(0, -lift) * 0.15;
    if (lift > 0.3) {
      Oval(x, y, 6 * s + 1.8, 7.4 * s + 1.8, OUTL);
      Oval(x, y, 6 * s, 7.4 * s, dark ? '#2b2b33' : '#f4f4f4');
      Oval(x, y + s, 3.6 * s, 4.8 * s, accent);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let k = 0; k < 3; k++) ctx.fillRect(x - 3 * s, y - 2.5 * s + k * 3 * s, 6 * s, 1.1 * s);
    } else {
      RR(ctx, x - 7 * s, y - 7 * s, 14 * s, 10 * s, 4.5 * s); ctx.fillStyle = dark ? '#24242c' : '#f4f4f4'; ctx.fill();
      ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
      RR(ctx, x - 3 * s, y - 8.5 * s, 6 * s, 6 * s, 2 * s); ctx.fillStyle = accent; ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 6 * s, y + 0.5 * s, 12 * s, 2 * s);
    }
  }

  function Torso(wTop, wBot, top, bot, fill, rib) {
    const t = TWS;
    ctx.beginPath();
    ctx.moveTo(-wTop + t, top + BY);
    ctx.quadraticCurveTo(t, top - 7 + BY, wTop + t, top + BY);
    ctx.quadraticCurveTo(wTop + 2 + t * 0.5, (top + bot) / 2 + BY, wBot, bot + BY);
    ctx.quadraticCurveTo(0, bot + 4 + BY, -wBot, bot + BY);
    ctx.quadraticCurveTo(-wTop - 2 + t * 0.5, (top + bot) / 2 + BY, -wTop + t, top + BY);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; ctx.stroke();
    if (rib) { ctx.fillStyle = rib; ctx.beginPath(); ctx.ellipse(0, bot - 1 + BY, wBot, 3.2, 0, 0, Math.PI); ctx.fill(); }
  }

  function KidLegsArms(front) {
    if (!front) {
      const o = LG[0].lift < LG[1].lift ? 0 : 1;
      for (let j = 0; j < 2; j++) {
        const L = LG[j ? 1 - o : o];
        Limb(L.hx, L.hy, L.kx, L.ky, L.fx, L.fy, 11, SPR.jeans, '#56679c');
        if (GS.sneak > 0) Oval(L.fx, L.fy + 2, 11, 7, 'rgba(192,132,252,0.55)');
        Shoe(L.fx, L.fy, L.lift, GS.sneak > 0 ? '#a855f7' : '#e53935', false);
      }
    }
    for (let i = 0; i < 2; i++) {
      const A = AR[i];
      if ((A.back >= 0) !== front) continue;
      Limb(A.sx, A.sy, A.ex, A.ey, A.hx, A.hy, 8.5, '#2e9df0', '#7fd0ff');
      Oval(A.hx, A.hy, 5 + Math.max(0, A.back), 5 + Math.max(0, A.back), OUTL);
      Oval(A.hx, A.hy, 3.6 + Math.max(0, A.back), 3.6 + Math.max(0, A.back), SKIN);
      if (i && GS.magnet > 0) {
        ctx.save(); ctx.translate(A.hx + 3, A.hy - 4); ctx.rotate(0.4);
        ctx.lineCap = 'butt'; ctx.strokeStyle = OUTL; ctx.lineWidth = 7.5;
        ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI, 0, true); ctx.stroke();
        ctx.strokeStyle = '#e53935'; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-8.5, -4, 5, 4); ctx.fillRect(3.5, -4, 5, 4);
        ctx.restore();
      }
    }
  }

  function KidHead() {
    const hx = TWS * 0.8, hy = -101 + BY;
    Oval(hx, hy + 13.5, 11.5, 5, '#1b6fb3');
    ctx.fillStyle = SKIN; ctx.fillRect(hx - 4.5, hy + 5, 9, 8);
    Oval(hx, hy, 12.8, 12.8, OUTL);
    Oval(hx, hy, 11.3, 11.3, '#4a2f1d');
    for (let s = -1; s <= 1; s += 2) { Oval(hx + s * 11.6, hy + 1.5, 3.4, 4.6, OUTL); Oval(hx + s * 11.6, hy + 1.5, 2.2, 3.4, SKIN); }
    ctx.beginPath(); ctx.ellipse(hx, hy - 2, 13.2, 12, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = SPR.gCap; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.fillStyle = '#a61d1d'; ctx.fillRect(hx - 13, hy - 3.5, 26, 3);
    Oval(hx, hy - 1.2, 4.2, 3.2, '#4a2f1d');
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(hx - 4.2, hy - 2.6, 8.4, 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(hx, hy - 13.6); ctx.lineTo(hx, hy - 4); ctx.moveTo(hx - 8, hy - 10.5); ctx.quadraticCurveTo(hx - 6, hy - 6, hx - 7, hy - 3.5); ctx.stroke();
    Oval(hx, hy - 14, 2, 1.6, '#ffca28');
  }

  function KidPack() {
    const x = -12 + TWS * 1.2, y = -83 + BY * 1.3;
    ctx.fillStyle = '#7a3a0b'; ctx.fillRect(x + 2, y - 3, 5, 7); ctx.fillRect(x + 17, y - 3, 5, 7);
    RR(ctx, x, y, 24, 31, 7); ctx.fillStyle = SPR.gPack; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.4; ctx.stroke();
    RR(ctx, x, y, 24, 12, 7); ctx.fillStyle = '#d65a0e'; ctx.fill(); ctx.stroke();
    RR(ctx, x + 5, y + 16, 14, 11, 4); ctx.fillStyle = '#ffa25a'; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 7, y + 18, 10, 1.5);
    ctx.save(); ctx.translate(x + 21, y + 26); ctx.rotate(Math.sin(GS.phase) * 0.35);
    RR(ctx, -2.5, 0, 5, 7, 1.5); ctx.fillStyle = GS.tagCol; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function KidJet() {
    const y = -88 + BY;
    for (let s = -1; s <= 1; s += 2) {
      const x = s * 7.5 - 6;
      const fl = 18 + Math.sin(GS.t * 47 + s) * 5;
      ctx.save(); ctx.translate(x + 6, y + 34); ctx.scale(1, fl / 16);
      ctx.fillStyle = SPR.gFlame;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, 32, 5, 0); ctx.fill();
      ctx.restore();
      RR(ctx, x, y, 12, 34, 6); ctx.fillStyle = SPR.gJet; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.2; ctx.stroke();
      RR(ctx, x, y, 12, 9, 5); ctx.fillStyle = '#e53935'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(x + 3, y + 33, 6, 4);
    }
    ctx.fillStyle = '#2b2e33'; ctx.fillRect(-3, y + 6, 6, 20);
  }

  function DrawBoardUnder() {
    const hov = Math.sin(GS.t * 6) * 1.5;
    ctx.fillStyle = SPR.gBoardGlow; ctx.beginPath(); ctx.ellipse(0, 6 + hov, 36, 12, 0, 0, Math.PI * 2); ctx.fill();
    RR(ctx, -33, -5 + hov, 66, 10, 5); ctx.fillStyle = SPR.gBoard; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-24, -3 + hov, 48, 2);
    Oval(-22, 7 + hov, 4, 2.4, '#a5f3fc'); Oval(22, 7 + hov, 4, 2.4, '#a5f3fc');
  }

  function DrawRollBall() {
    const r = 24, cy = -25, a = GS.t * 15;
    Oval(0, cy, r + 2.2, r + 2.2, OUTL);
    ctx.fillStyle = SPR.gHood; ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2); ctx.clip();
    for (let k = 0; k < 3; k++) {
      const th = a + k * 2.1, vis = Math.sin(th);
      if (vis <= 0.08) continue;
      ctx.save(); ctx.translate(0, cy + Math.cos(th) * r * 0.62); ctx.scale(1, vis);
      if (k === 0) {
        RR(ctx, -13, -11, 26, 22, 7); ctx.fillStyle = SPR.gPack; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.2; ctx.stroke();
        RR(ctx, -13, -11, 26, 8, 6); ctx.fillStyle = '#d65a0e'; ctx.fill(); ctx.stroke();
      } else if (k === 1) {
        RR(ctx, -20, -6, 40, 12, 6); ctx.fillStyle = SPR.jeans; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
        RR(ctx, -22, -5, 9, 10, 4); ctx.fillStyle = '#f4f4f4'; ctx.fill(); ctx.stroke();
        RR(ctx, 13, -5, 9, 10, 4); ctx.fill(); ctx.stroke();
      } else {
        Oval(0, 2, 12, 9, '#4a2f1d');
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, Math.PI, 0); ctx.fillStyle = '#d32f2f'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.fillStyle = SPR.gBall; ctx.fillRect(-r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, cy, r - 5, -2.6, -1.7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.arc(0, cy, r + 7, s > 0 ? -0.5 : Math.PI - 0.4, s > 0 ? 0.4 : Math.PI + 0.5); ctx.stroke(); }
  }

  function DrawRunner() {
    const p = GS;
    if (!Proj(p.x, p.surf, p.dist)) return;
    const air = Math.max(0, p.y - p.surf), sh = Math.max(0, 1 - air / 6);
    ctx.globalAlpha = 0.34 * sh; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.5 * PK * (0.6 + 0.4 * sh), 0.14 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = p.invT > 0 && (p.invT * 14 | 0) % 2 ? 0.35 : 1;
    Proj(p.x, p.y, p.dist);
    const sc = PK * 0.017;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(sc, sc);
    let rot = p.lean;
    if (p.wobT > 0) rot += Math.sin(p.wobT * 40) * 0.18 * p.wobT * 2;
    if (p.status === 'crash' && p.crashKind === 'crash') rot = -0.35 * Math.min(1, p.crashT * 4);
    ctx.rotate(rot);
    const crash = p.status === 'crash';
    if (p.board > 0 && p.jet <= 0 && !p.jetFall && !crash) DrawBoardUnder();
    if (p.rollT > 0 && !crash) DrawRollBall();
    else {
      if (p.jet > 0 || p.jetFall) JetPose();
      else if (p.status === 'start') StandPose();
      else if (crash) { StandPose(); for (let i = 0; i < 2; i++) { const A = AR[i], s = i ? 1 : -1; A.ex = s * 23; A.ey = -86; A.hx = s * 25; A.hy = -100 + Math.sin(p.t * 20 + i * 3) * 3; A.back = 0.5; } }
      else if (p.board > 0 && p.ground) BoardPose();
      else if (!p.ground) JumpPose(p.vy);
      else RunPose(p.phase);
      if (p.wobT > 0) for (let i = 0; i < 2; i++) { AR[i].hy -= 20 * p.wobT; AR[i].hx *= 1.3; }
      KidLegsArms(false);
      Torso(16, 14, -82, -50, SPR.gHood, '#1b6fb3');
      KidLegsArms(true);
      if (p.jet > 0 || p.jetFall) KidJet(); else KidPack();
      KidHead();
      if (crash && p.crashKind === 'crash') {
        ctx.fillStyle = '#fde047'; ctx.strokeStyle = OUTL; ctx.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) {
          const a = p.t * 6 + k * 2.1, sx = Math.cos(a) * 17, sy = -122 + Math.sin(a) * 4;
          ctx.beginPath();
          for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.2 : 5, b = j * Math.PI / 5 + p.t * 3; ctx.lineTo(sx + Math.cos(b) * r, sy + Math.sin(b) * r); }
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function DrawInspector() {
    const p = GS, z = p.dist + p.insZ;
    if (p.insZ < -9.5 || !Proj(p.insX, 0, z)) return;
    const sc = PK * 0.0185;
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.55 * PK, 0.15 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(sc, sc);
    if (p.status === 'start') StandPose(); else RunPose(p.phase * 0.82 + 1.4);
    for (let i = 0; i < 2; i++) { const L = LG[i]; L.hx *= 1.35; L.kx *= 1.35; L.fx *= 1.35; }
    const o = LG[0].lift < LG[1].lift ? 0 : 1;
    for (let j = 0; j < 2; j++) {
      const L = LG[j ? 1 - o : o];
      Limb(L.hx, L.hy, L.kx, L.ky, L.fx, L.fy, 13, '#1d2440', '#3a4470');
      Shoe(L.fx, L.fy, L.lift, '#111', true);
    }
    const A = AR[1];
    A.sx = 21; A.sy = -80 + BY; A.ex = 27; A.ey = -98 + BY; A.hx = 25; A.hy = -116 + BY + Math.sin(p.t * 22) * 4; A.back = 1;
    const B = AR[0];
    B.sx = -21 + TWS; B.ex *= 1.3; B.hx *= 1.25;
    if (B.back < 0) Limb(B.sx, B.sy, B.ex, B.ey, B.hx, B.hy, 10, '#24366b', '#4a63a8');
    Torso(22, 21, -80, -40, SPR.gCoat, null);
    ctx.fillStyle = '#121a33'; ctx.fillRect(-20, -52 + BY, 40, 4);
    Oval(-6, -50 + BY, 2, 2, '#f5c518'); Oval(6, -50 + BY, 2, 2, '#f5c518');
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -48 + BY); ctx.lineTo(0, -40 + BY); ctx.stroke();
    if (B.back >= 0) Limb(B.sx, B.sy, B.ex, B.ey, B.hx, B.hy, 10, '#24366b', '#4a63a8');
    Limb(A.sx, A.sy, A.ex, A.ey, A.hx, A.hy, 10, '#24366b', '#4a63a8');
    for (let i = 0; i < 2; i++) { Oval(AR[i].hx, AR[i].hy, 6, 6, OUTL); Oval(AR[i].hx, AR[i].hy, 4.6, 4.6, '#eab08c'); }
    const hx = TWS * 0.8, hy = -96 + BY;
    ctx.fillStyle = '#d99a78'; ctx.fillRect(hx - 6, hy + 4, 12, 9);
    Oval(hx, hy, 14, 13.5, OUTL); Oval(hx, hy, 12.5, 12, '#d99a78');
    ctx.beginPath(); ctx.ellipse(hx, hy + 1, 12.5, 10.5, 0, Math.PI * 1.02, Math.PI * 1.98, true); ctx.fillStyle = '#b9b9bd'; ctx.fill();
    ctx.strokeStyle = '#8d8d93'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let k = -4; k <= 4; k++) { ctx.moveTo(hx + k * 2.4, hy - 3); ctx.lineTo(hx + k * 2.6, hy + 6 - Math.abs(k) * 0.6); }
    ctx.stroke();
    for (let s = -1; s <= 1; s += 2) { Oval(hx + s * 13, hy + 1, 3.8, 5, OUTL); Oval(hx + s * 13, hy + 1, 2.6, 3.8, '#eab08c'); }
    RR(ctx, hx - 15, hy + 9, 30, 8, 4); ctx.fillStyle = '#1b2a55'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
    RR(ctx, hx - 13.5, hy - 12, 27, 8, 2); ctx.fillStyle = '#1b2a55'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#f5c518'; ctx.fillRect(hx - 13.5, hy - 7.5, 27, 2.5);
    ctx.beginPath(); ctx.ellipse(hx, hy - 15, 18, 6.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#22336a'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function DrawDog() {
    const p = GS, z = p.dist + p.insZ + 1.6;
    if (p.insZ < -9.5 || !Proj(p.insX + 1.4, 0, z)) return;
    const sc = PK * 0.0075, g = p.phase * 1.15 + 0.6;
    ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.3 * PK, 0.1 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(PX, PY - Math.abs(Math.sin(g)) * 4 * sc); ctx.scale(sc, sc);
    const lift = Math.sin(g) * 9;
    for (let s = -1; s <= 1; s += 2) Limb(s * 9, -30, s * 11, -16 - Math.max(0, lift), s * 10, -4 - Math.max(0, lift) * 1.6, 8, '#8a5426', '#c08048');
    ctx.strokeStyle = OUTL; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const tw = Math.sin(p.t * 16) * 9;
    ctx.beginPath(); ctx.moveTo(0, -44); ctx.quadraticCurveTo(tw * 0.5, -62, tw, -70); ctx.stroke();
    ctx.strokeStyle = '#b8743a'; ctx.lineWidth = 5.5; ctx.stroke();
    Oval(0, -36, 18.5, 18, OUTL); Oval(0, -36, 16.5, 16, SPR.gDog);
    Oval(0, -27, 9, 6, '#e3b07c');
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath(); ctx.moveTo(s * 4, -62); ctx.lineTo(s * 12, -80); ctx.lineTo(s * 13, -60); ctx.closePath();
      ctx.fillStyle = '#7a4a1e'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.stroke();
    }
    Oval(0, -58, 12.5, 11.5, OUTL); Oval(0, -58, 11, 10, '#a86a32');
    RR(ctx, -11, -50, 22, 4, 2); ctx.fillStyle = '#e53935'; ctx.fill();
    ctx.restore();
  }

  const POOL = Array.from({ length: 900 }, () => ({ k: 0, t: 0, o: null }));
  const LOW = [], HIGH = [];
  let PN = 0;
  function Add(list, k, t, o) { if (PN >= POOL.length) return; const e = POOL[PN++]; e.k = k; e.t = t; e.o = o; list.push(e); }
  function ByK(a, b) { return b.k - a.k; }
  function DrawEntry(e) {
    switch (e.t) {
      case 1: DrawTrain(e.o); break;
      case 2: DrawBar(e.o); break;
      case 3: DrawCoin(e.o); break;
      case 4: DrawItem(e.o); break;
      case 5: DrawRunner(); break;
      case 6: DrawInspector(); break;
      case 7: DrawDog(); break;
      case 9: DrawBridge(e.k); break;
      default: DrawCat(e.k);
    }
  }

  function DrawWorld() {
    const p = GS, P = p.dist, zn = camZ + NEAR, zf = camZ + FAR;
    PN = 0; LOW.length = 0; HIGH.length = 0;
    CoinFrame = p.t * 13 % 16;
    for (let i = 0; i < p.T.length; i++) {
      const t = p.T[i];
      if (t.dead || t.z - (t.ramp ? RAMP : 0) > zf || t.z + t.L < zn) continue;
      Add(LOW, TrainKey(t, P), 1, t);
    }
    for (let i = 0; i < p.B.length; i++) { const b = p.B[i]; if (!b.dead && b.z < zf && b.z > zn) Add(LOW, b.z, 2, b); }
    for (let i = 0; i < p.C.length; i++) {
      const c = p.C[i];
      if (c.dead || c.z > zf || c.z < zn) continue;
      Add(c.y > WIRE_Y ? HIGH : LOW, c.car ? TrainKey(c.car, P) - 0.3 + c.z * 1e-5 : c.z, 3, c);
    }
    for (let i = 0; i < p.I.length; i++) {
      const it = p.I[i];
      if (it.dead || it.z > zf || it.z < zn) continue;
      Add(LOW, it.car ? TrainKey(it.car, P) - 0.25 : it.z, 4, it);
    }
    for (let i = Math.floor(zf / 30); i * 30 > zn; i--) Add(LOW, i * 30, 8, null);
    for (let i = Math.floor((zf - 90) / 230); i > 0 && BridgeZ(i) + 5 > zn; i--) if (Hash(i * 9.1) < 0.65) Add(LOW, BridgeZ(i), 9, null);
    Add(p.y > WIRE_Y - 0.3 ? HIGH : LOW, P, 5, null);
    if (p.insZ > -9.5) { Add(LOW, P + p.insZ, 6, null); Add(LOW, P + p.insZ + 1.6, 7, null); }
    LOW.sort(ByK); HIGH.sort(ByK);
    for (let i = 0; i < LOW.length; i++) DrawEntry(LOW[i]);
    DrawWires();
    for (let i = 0; i < HIGH.length; i++) DrawEntry(HIGH[i]);
  }

  function DrawParts() {
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (!q.on) continue;
      const a = 1 - q.age / q.life;
      ctx.globalAlpha = a; ctx.fillStyle = q.col;
      if (q.kind === 1) { ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.4 - a * 0.6), 0, Math.PI * 2); ctx.fill(); }
      else if (q.kind === 2) {
        const s = q.size * (0.6 + a);
        ctx.beginPath(); ctx.moveTo(q.x, q.y - s); ctx.lineTo(q.x + s * 0.25, q.y - s * 0.25); ctx.lineTo(q.x + s, q.y); ctx.lineTo(q.x + s * 0.25, q.y + s * 0.25);
        ctx.lineTo(q.x, q.y + s); ctx.lineTo(q.x - s * 0.25, q.y + s * 0.25); ctx.lineTo(q.x - s, q.y); ctx.lineTo(q.x - s * 0.25, q.y - s * 0.25); ctx.fill();
      } else ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size * 0.6);
    }
    ctx.globalAlpha = 1;
  }

  const TXT = {};
  function HudText(t, x, y, size, fill, align) {
    ctx.font = `900 ${size}px "Arial Black", "Segoe UI Black", system-ui, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22; ctx.strokeStyle = 'rgba(15,12,30,0.85)'; ctx.strokeText(t, x, y);
    ctx.fillStyle = fill; ctx.fillText(t, x, y);
  }

  function DrawHUD() {
    const p = GS;
    if (p.status === 'start') return;
    const sc = String(Math.floor(p.score));
    HudText(sc, CV_W - 16, 30, 28, '#ffffff', 'right');
    const sw = ctx.measureText(sc).width;
    const bx = CV_W - 24 - sw - 46;
    RR(ctx, bx, 15, 42, 30, 9); ctx.fillStyle = p.mult > 1 ? '#facc15' : 'rgba(20,16,40,0.6)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    HudText(`x${p.mult}`, bx + 21, 30.5, 17, p.mult > 1 ? '#fff7c2' : '#ffffff', 'center');
    ctx.drawImage(SPR.coins, 0, 0, 64, 64, CV_W - 42, 52, 26, 26);
    HudText(String(p.coins), CV_W - 48, 66, 20, '#ffd84a', 'right');
    let y = 14;
    for (let i = 0; i < HUD_PU.length; i++) {
      const k = HUD_PU[i];
      if (p[k] <= 0) continue;
      ctx.drawImage(SPR.icons[k], 8, y - 4, 42, 42);
      RR(ctx, 50, y + 11, 92, 12, 6); ctx.fillStyle = 'rgba(15,12,30,0.6)'; ctx.fill();
      RR(ctx, 52, y + 13, Math.max(4, 88 * p[k] / DUR[k]), 8, 4); ctx.fillStyle = PU_COL[k]; ctx.fill();
      y += 40;
    }
    if (p.boardAvail && p.status === 'playing') {
      ctx.globalAlpha = 0.95;
      ctx.drawImage(SPR.icons.board, 8, CV_H - 54, 46, 46);
      RR(ctx, 52, CV_H - 42, 30, 22, 6); ctx.fillStyle = 'rgba(15,12,30,0.65)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
      HudText('H', 67, CV_H - 30.5, 13, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }
    if (p.popT > 0) {
      const a = Math.min(1, p.popT * 2), s = 1 + Math.max(0, p.popT - 1.3) * 1.5;
      ctx.globalAlpha = a;
      HudText(TXT[p.popup] || '', CX, 104, 26 * s, PU_COL[p.popup] || '#fff', 'center');
      ctx.globalAlpha = 1;
    }
    if (p.stumbleT > 0 && p.status === 'playing') {
      ctx.globalAlpha = Math.min(1, p.stumbleT / 2) * (0.4 + 0.2 * Math.sin(p.t * 8));
      ctx.fillStyle = SPR.vign; ctx.fillRect(0, 0, CV_W, CV_H);
      ctx.globalAlpha = 1;
    }
    if (p.flash > 0) { ctx.globalAlpha = p.flash * 2; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CV_W, CV_H); ctx.globalAlpha = 1; }
  }

  let _night = false;
  function Draw() {
    if (!ctx || !GS) return;
    if (!SPR || SPR.night !== _night) SPR = BuildSprites(_night);
    ctx.save();
    const m = GS.shake * 16;
    SHX = m > 0 ? (Math.random() - 0.5) * m : 0; SHY = m > 0 ? (Math.random() - 0.5) * m : 0;
    ctx.translate(SHX, SHY);
    DrawSky();
    DrawGround();
    DrawTrack();
    ctx.fillStyle = SPR.fogBand; ctx.fillRect(-20, HY - 2, CV_W + 40, 42);
    DrawBuildings();
    DrawWalls();
    DrawWorld();
    DrawParts();
    ctx.restore();
    SHX = 0; SHY = 0;
    DrawHUD();
  }

  function Frame(ts) {
    _raf = null;
    if (!GS) return;
    const raw = (ts - GS.last) / 1000, dt = Math.min(0.05, Math.max(0, raw));
    GS.last = ts;
    _slow = raw > 0.024 && raw < 0.2 ? _slow + 1 : Math.max(0, _slow - 2);
    if (_slow > 120 && DPR > 1) { _slow = 0; SetDpr(1); }
    if (GS.status === 'playing') Update(dt);
    else if (GS.status === 'crash') UpdateCrash(dt);
    Draw();
    if (GS.status === 'playing' || GS.status === 'crash') _raf = requestAnimationFrame(Frame);
  }
  function StartLoop() { StopLoop(); GS.last = performance.now(); _raf = requestAnimationFrame(Frame); }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-ss-start', 'gf-ss-pause', 'gf-ss-gameover'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function Prime() { GS = NewGame(); while (GS.gen.z < 200) GenRow(); }

  function ShowStart() {
    StopLoop();
    Prime();
    SetText('gf-ss-best', LoadBest());
    Draw();
    ShowScreen('gf-ss-start');
  }

  function DoStart() {
    StopLoop();
    if (!GS || GS.status !== 'start') Prime();
    GS.status = 'playing'; GS.insT = 2.6;
    SetText('gf-ss-best', LoadBest());
    ShowScreen(null);
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); ShowScreen('gf-ss-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }

  function ShowGameOver() {
    const sc = Math.floor(GS.score), best = Math.max(LoadBest(), sc);
    SetText('gf-ss-go-score', sc);
    SetText('gf-ss-go-coins', GS.coins);
    SetText('gf-ss-go-best', best);
    SetText('gf-ss-best', best);
    SetText('gf-ss-go-reason', _GameText(GS.crashKind === 'caught' ? 'ss_caught' : 'ss_crashed'));
    const nb = document.getElementById('gf-ss-go-new');
    if (nb) nb.style.display = sc > GS.best0 ? 'block' : 'none';
    ShowScreen('gf-ss-gameover');
  }

  function OnKey(e) {
    const root = document.getElementById('gf-ss');
    if (!GS || !root || root.style.display === 'none') return;
    const k = e.key, st = GS.status;
    if (k === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (st === 'playing' || st === 'paused') DoPause(); else CloseGradeSurfers();
      return;
    }
    if (k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); DoPause(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); e.stopPropagation(); DoStart(); return; }
    if (k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (st === 'start' || st === 'gameover') DoStart(); else if (st === 'paused') DoPause();
      return;
    }
    const left = k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'q' || k === 'Q';
    const right = k === 'ArrowRight' || k === 'd' || k === 'D';
    const up = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'z' || k === 'Z' || k === ' ';
    const down = k === 'ArrowDown' || k === 's' || k === 'S';
    const hb = k === 'h' || k === 'H';
    if (!(left || right || up || down || hb)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat) return;
    if (st === 'start' || st === 'gameover') { if (k === ' ') DoStart(); return; }
    if (st !== 'playing') return;
    if (left) Steer(-1);
    else if (right) Steer(1);
    else if (down) Roll();
    else if (hb) Board();
    else {
      if (k === ' ') {
        const dbl = GS.t - GS.lastSpace < 0.32;
        GS.lastSpace = dbl ? -9 : GS.t;
        if (dbl && Board()) return;
      }
      Jump();
    }
  }

  function OnPDown(e) {
    if (GS?.status !== 'playing') return;
    e.preventDefault();
    _pt = { x: e.clientX, y: e.clientY, t: performance.now(), done: false };
  }
  function OnPMove(e) {
    if (!_pt || _pt.done || GS?.status !== 'playing') return;
    const dx = e.clientX - _pt.x, dy = e.clientY - _pt.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    _pt.done = true;
    if (Math.abs(dx) > Math.abs(dy)) Steer(dx > 0 ? 1 : -1);
    else if (dy < 0) Jump();
    else Roll();
  }
  function OnPUp() {
    if (!_pt) return;
    if (!_pt.done && performance.now() - _pt.t < 260) {
      const now = performance.now();
      if (now - _lastTap < 330) { Board(); _lastTap = 0; } else _lastTap = now;
    }
    _pt = null;
  }

  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); }
  function DetachKeys() { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } }
  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function Fit() {
    const cv = document.getElementById('gf-ss-canvas');
    if (!cv) return;
    const s = Math.min(1, (window.innerWidth - 34) / CV_W, (window.innerHeight - 78) / CV_H);
    cv.style.width = `${Math.round(CV_W * s)}px`; cv.style.height = `${Math.round(CV_H * s)}px`;
  }

  function ApplyTheme() {
    const el = document.getElementById('gf-ss');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    const n = el.dataset.theme === 'dark';
    if (n !== _night) { _night = n; if (GS && GS.status !== 'playing' && GS.status !== 'crash') Draw(); }
  }

  function BuildOverlay() {
    if (document.getElementById('gf-ss')) return;
    InjectCSS();
    TXT.jet = _GameText('ss_pu_jet'); TXT.sneak = _GameText('ss_pu_sneak'); TXT.magnet = _GameText('ss_pu_magnet');
    TXT.double = _GameText('ss_pu_double'); TXT.board = _GameText('ss_board');
    const sp = _GameText('ss_key_space');
    const root = document.createElement('div');
    root.id = 'gf-ss';
    root.innerHTML = `
<div id="gf-ss-modal">
  <div id="gf-ss-hdr">
    <div class="gf-ss-hl">
      <div id="gf-ss-logo">GS</div>
      <span id="gf-ss-title">${_GameText('ss_title')}</span>
    </div>
    <div class="gf-ss-hr">
      <span id="gf-ss-best-hdr"><span class="gf-ss-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-ss-best">0</span></span>
      <button id="gf-ss-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-ss-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-ss-body">
    <canvas id="gf-ss-canvas"></canvas>

    <div id="gf-ss-start" class="gf-ss-scr">
      <div class="gf-ss-scr-logo">${_GameText('ss_title')}</div>
      <div class="gf-ss-scr-sub">${_GameText('ss_subtitle')}</div>
      <div class="gf-ss-keys">
        <div class="gf-ss-key"><span><kbd>←</kbd><kbd>→</kbd><kbd>A</kbd><kbd>D</kbd></span><b>${_GameText('ss_ctrl_move')}</b></div>
        <div class="gf-ss-key"><span><kbd>↑</kbd><kbd>W</kbd><kbd>${sp}</kbd></span><b>${_GameText('ss_ctrl_jump')}</b></div>
        <div class="gf-ss-key"><span><kbd>↓</kbd><kbd>S</kbd></span><b>${_GameText('ss_ctrl_roll')}</b></div>
        <div class="gf-ss-key gf-ss-key-hb"><span><kbd>H</kbd><kbd>${sp} x2</kbd></span><b>${_GameText('ss_ctrl_board')}</b></div>
        <div class="gf-ss-key"><span><kbd>Esc</kbd><kbd>P</kbd></span><b>${_GameText('game_pause')}</b></div>
      </div>
      <div class="gf-ss-scr-footer">${_GameText('ss_ctrl_swipe')}<br>${_GameText('ss_start_hint')}</div>
      <button class="gf-ss-btn" id="gf-ss-go">▶&nbsp; ${_GameText('game_play')}</button>
    </div>

    <div id="gf-ss-pause" class="gf-ss-scr" style="display:none">
      <div class="gf-ss-scr-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-ss-btn" id="gf-ss-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-ss-gameover" class="gf-ss-scr" style="display:none">
      <div class="gf-ss-scr-go">${_GameText('game_gameover')}</div>
      <div id="gf-ss-go-reason" class="gf-ss-scr-sub"></div>
      <div class="gf-ss-go-stats">
        <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('game_score').toUpperCase()}</div><div class="gf-ss-go-val" id="gf-ss-go-score">0</div></div>
        <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('ss_coins').toUpperCase()}</div><div class="gf-ss-go-val gf-ss-gold" id="gf-ss-go-coins">0</div></div>
        <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('game_best').toUpperCase()}</div><div class="gf-ss-go-val" id="gf-ss-go-best">0</div></div>
      </div>
      <div id="gf-ss-go-new" class="gf-ss-scr-new" style="display:none">${_GameText('game_new_best')}</div>
      <button class="gf-ss-btn" id="gf-ss-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    ctx = document.getElementById('gf-ss-canvas').getContext('2d');
    SetDpr(Math.min(2, window.devicePixelRatio || 1));
    BindButtons();
  }

  function SetDpr(d) {
    const cv = document.getElementById('gf-ss-canvas');
    DPR = d;
    cv.width = CV_W * d; cv.height = CV_H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function BindButtons() {
    document.getElementById('gf-ss-close')?.addEventListener('click', CloseGradeSurfers);
    document.getElementById('gf-ss-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-ss-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-ss-retry')?.addEventListener('click', DoStart);
    const cv = document.getElementById('gf-ss-canvas');
    cv.addEventListener('pointerdown', OnPDown);
    cv.addEventListener('pointermove', OnPMove);
    cv.addEventListener('pointerup', OnPUp);
    cv.addEventListener('pointercancel', OnPUp);
    const start = document.getElementById('gf-ss-start');
    start.addEventListener('click', e => { e.stopPropagation(); if (GS?.status === 'start') DoStart(); });
  }

  function OpenGradeSurfers(grades) {
    if (grades?.length || !_grades.length) _grades = NormalizeGrades(grades);
    SPR = null;
    if (!document.getElementById('gf-ss')) BuildOverlay();
    document.getElementById('gf-ss').style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    window.addEventListener('resize', Fit);
    Fit();
    ShowStart();
  }

  function CloseGradeSurfers() {
    const el = document.getElementById('gf-ss');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; ShowScreen('gf-ss-pause'); }
    StopLoop();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    window.removeEventListener('resize', Fit);
  }

  function ToggleGradeSurfers(grades) {
    const el = document.getElementById('gf-ss');
    if (el && el.style.display !== 'none') CloseGradeSurfers(); else OpenGradeSurfers(grades);
  }

  function BossKeyGradeSurfers() {
    const el = document.getElementById('gf-ss');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); ShowScreen('gf-ss-pause'); }
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeSurfers = OpenGradeSurfers;
  W.CloseGradeSurfers = CloseGradeSurfers;
  W.ToggleGradeSurfers = ToggleGradeSurfers;
  W.BossKeyGradeSurfers = BossKeyGradeSurfers;

  function InjectCSS() {
    if (document.getElementById('gf-ss-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-ss-css';
    s.textContent = `
#gf-ss {
  --ss-modal:#fff;--ss-hdr:#f5f5f5;--ss-scr:rgba(250,248,244,0.8);
  --ss-brd:rgba(245,158,11,0.3);--ss-brd2:#e0e0e0;--ss-btn-brd:#d0d0d0;
  --ss-txt:#111;--ss-txt2:#555;--ss-txt3:#999;
  --ss-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-ss[data-theme="dark"] {
  --ss-modal:rgba(13,13,13,0.97);--ss-hdr:rgba(8,8,8,0.95);
  --ss-scr:rgba(8,8,12,0.76);--ss-brd:rgba(245,158,11,0.24);--ss-brd2:#1c1c1c;
  --ss-btn-brd:#333;--ss-txt:#f5f5f5;--ss-txt2:#cbd5e1;--ss-txt3:#8a94a6;
  --ss-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-ss{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-ss-modal{position:relative;display:flex;flex-direction:column;background:var(--ss-modal);border:1px solid var(--ss-brd);border-radius:12px;box-shadow:var(--ss-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-ss-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--ss-hdr);border-bottom:1px solid var(--ss-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-ss-hl{display:flex;align-items:center;gap:8px;} .gf-ss-hr{display:flex;align-items:center;gap:8px;}
#gf-ss-logo{width:24px;height:24px;background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-ss-title{font-size:13px;font-weight:700;color:var(--ss-txt);letter-spacing:-0.3px;}
#gf-ss-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--ss-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--ss-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-ss-best-lbl{font-size:8px;font-weight:700;color:var(--ss-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-ss-pause-btn,#gf-ss-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--ss-btn-brd);border-radius:6px;background:transparent;color:var(--ss-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-ss-pause-btn:hover{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.10);}
#gf-ss-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-ss-body{position:relative;line-height:0;flex-shrink:0;}
#gf-ss-canvas{display:block;width:${CV_W}px;height:${CV_H}px;touch-action:none;user-select:none;}
.gf-ss-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--ss-scr);padding:20px;overflow-y:auto;line-height:1.35;text-align:center;}
#gf-ss-start{cursor:pointer;}
.gf-ss-scr-logo{font-size:38px;font-weight:900;color:#f59e0b;letter-spacing:1px;line-height:1.05;text-shadow:0 3px 0 #b45309,0 0 34px rgba(245,158,11,0.45);}
.gf-ss-scr-sub{font-size:13px;color:var(--ss-txt2);line-height:1.45;max-width:420px;}
.gf-ss-keys{display:grid;gap:5px;width:min(420px,100%);}
.gf-ss-key{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:4px 10px;border:1px solid transparent;border-radius:8px;background:rgba(255,255,255,0.55);font-size:12px;}
#gf-ss[data-theme="dark"] .gf-ss-key{background:rgba(0,0,0,0.4);}
.gf-ss-key b{color:var(--ss-txt2);font-weight:700;text-align:right;}
.gf-ss-key kbd{display:inline-block;min-width:14px;padding:2px 6px;margin-right:4px;border:1px solid var(--ss-btn-brd);border-bottom-width:2px;border-radius:5px;background:var(--ss-modal);font:700 11px "IBM Plex Mono",monospace;color:var(--ss-txt);line-height:1.3;}
.gf-ss-key-hb{border-color:rgba(34,211,238,0.5);background:rgba(34,211,238,0.12);}
.gf-ss-scr-footer{font-size:11px;color:var(--ss-txt2);line-height:1.5;max-width:420px;}
.gf-ss-scr-go{font-size:31px;font-weight:800;color:#f87171;letter-spacing:3px;text-shadow:0 0 30px rgba(248,113,113,0.5);line-height:1.05;}
.gf-ss-scr-new{font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:2px;animation:gf-ss-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-ss-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
.gf-ss-go-stats{display:grid;grid-template-columns:repeat(3,minmax(92px,1fr));gap:10px;width:min(360px,100%);}
.gf-ss-go-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 8px;border:1px solid var(--ss-brd2);border-radius:9px;background:rgba(128,128,128,0.10);}
.gf-ss-go-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--ss-txt3);line-height:1;text-transform:uppercase;}
.gf-ss-go-val{font-size:26px;font-weight:800;color:var(--ss-txt);line-height:1;}
.gf-ss-gold{color:#e0a400;}
.gf-ss-btn{padding:10px 24px;border:1px solid #f59e0b;border-radius:8px;background:rgba(245,158,11,0.14);color:#d97706;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
#gf-ss[data-theme="dark"] .gf-ss-btn{color:#fbbf24;}
.gf-ss-btn:hover{background:rgba(245,158,11,0.24);box-shadow:0 4px 18px rgba(245,158,11,0.3);transform:translateY(-1px);}
`;
    document.head.appendChild(s);
  }

})(window);
