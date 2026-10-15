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
  const WIRE_Y = 7.65;
  const CAT_Y = 8.15;
  const GRAV = 26;
  const JUMP_V = 9.6;
  const SNEAK_V = 14.6;
  const ROLL_T = 0.62;
  const JET_Y = 9;
  const D_ACT = 110;
  const V0 = 13;
  const VMAX = 27;
  const DUR = { jet: 7.5, sneak: 10, magnet: 10, double: 12, board: 25 };
  const PU_COL = { jet: '#38bdf8', sneak: '#a855f7', magnet: '#ef4444', double: '#facc15', board: '#22d3ee', boost: '#e879f9', mis: '#4ade80' };
  const PU_LIST = ['jet', 'sneak', 'magnet', 'double'];
  const HUD_PU = ['jet', 'sneak', 'magnet', 'double', 'board'];
  const BAR_COL = { L: ['#e53935', '#f7f7f7'], H: ['#fbc02d', '#1d1d1d'], M: ['#1e9e57', '#f7f7f7'], S: ['#ff3b30', '#2c2f36', '#f5c518'] };
  const BAR_DIM = { L: [2.4, 1.1], H: [2.4, 2.95], M: [2.4, 1.5], S: [1.5, 3.45] };
  const BAR_TOP = { L: 0.96, M: 1.45 };
  const BAR_BOT = { L: 0.52, M: 0.77 };
  const BAR_DEP = 3.2;
  const BAR_Z = 0.15;
  const BAR_F = 0.45;
  const BAR_TOL = 0.25;
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
  const TX = 64;
  const G_X = 6.625;
  const GW = 848;
  const GH = 384;
  const G_PAD = 12;
  const G_MIN = [0, 3, 5, 7];
  const GW_LV = [0, 0, 0, 1, 1, 2, 2, 3];
  const SLP_D = 0.75;
  const SLP_T = 0.28;
  const SLP_W = 1.05;
  const SLP_E = 0.06;
  const LS_BEST = 'gf-ss-best';
  const LS_SAVE = 'gf-ss-save';
  const UPG = { jet: [7.5, 1.5], sneak: [10, 2], magnet: [10, 2], double: [12, 2.4] };
  const UP_COST = [250, 500, 900, 1500, 2500];
  const HB_PACKS = [[3, 300], [10, 850]];
  const SB_PACKS = [[1, 450], [3, 1150]];
  const BOOST = 5;
  const MULT_MAX = 30;
  const MIS_T = ['coins', 'jump', 'roll', 'power', 'coins1', 'score1', 'dist1', 'roof', 'hurdle', 'board'];
  const MIS_B = { coins: 60, jump: 12, roll: 3, power: 2, coins1: 40, score1: 600, dist1: 500, roof: 3, hurdle: 4, board: 1 };
  const MIS_O = { coins1: 'coins', score1: 'score', dist1: 'dist' };
  const MIS = [{ t: '', o: '', n: 0 }, { t: '', o: '', n: 0 }, { t: '', o: '', n: 0 }];

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }
  function SaveBest(v) { if (v > LoadBest()) StorageSet(LS_BEST, v); }

  let SAVE = null;
  function LoadSave() {
    const d = StorageGet(LS_SAVE, null) || {};
    SAVE = {
      bank: Math.max(0, d.bank | 0), hb: Math.max(0, d.hb | 0),
      chars: Array.isArray(d.chars) ? d.chars : ['jay'], boards: Array.isArray(d.boards) ? d.boards : ['classic'],
      char: d.char || 'jay', board: d.board || 'classic', up: Object.assign({ jet: 0, sneak: 0, magnet: 0, double: 0 }, d.up),
      sb: Math.max(0, d.sb | 0), sbOn: d.sbOn !== false,
      ms: { lv: Math.max(0, Math.min(MULT_MAX - 1, d.ms?.lv | 0)), p: Array.isArray(d.ms?.p) && d.ms.p.length === 3 ? d.ms.p.map(v => Math.max(0, v | 0)) : [0, 0, 0] },
    };
    MisLoad();
    CH = CHARS.find(c => c.id === SAVE.char && SAVE.chars.includes(c.id)) || CHARS[0];
    BD = BOARDS.find(b => b.id === SAVE.board && SAVE.boards.includes(b.id)) || BOARDS[0];
  }
  function SaveData() { StorageSet(LS_SAVE, SAVE); }
  function Dur(k) { return UPG[k][0] + UPG[k][1] * SAVE.up[k]; }
  function Nice(v) { const s = v >= 1000 ? 100 : v >= 200 ? 50 : v >= 40 ? 5 : 1; return Math.max(1, Math.round(v / s) * s); }
  function MisLoad() {
    const k = SAVE.ms.lv, used = [];
    for (let j = 0; j < 3; j++) {
      let i = k ? (Hash(k * 13.1 + j * 5.7) * MIS_T.length) | 0 : j;
      while (used.includes(i)) i = (i + 1) % MIS_T.length;
      used.push(i);
      const t = MIS_T[i], m = MIS[j];
      m.t = t; m.o = MIS_O[t] || ''; m.n = Nice(MIS_B[t] * (1 + k * 0.32) * (t === 'score1' ? k + 1 : 1));
    }
  }
  function BaseMult() { return Math.min(MULT_MAX, 1 + SAVE.ms.lv); }
  function MisMax() { return SAVE.ms.lv >= MULT_MAX - 1; }
  function MisText(m) { return _GameText(`ss_m_${m.t}`).replace('{n}', m.n); }
  function SetReward() { return 100 + 50 * SAVE.ms.lv; }
  function Durs() { return { jet: Dur('jet'), sneak: Dur('sneak'), magnet: Dur('magnet'), double: Dur('double'), board: DUR.board }; }

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
    for (const [k, c0, c1, c2] of [['L', '#e53935', '#6e1414', 0.6], ['M', '#1e9e57', '#0d4a28', -0.7]]) {
      const base = night ? '#d9d6e4' : '#f7f7f7';
      c = Cv(120, 200); g = c.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, 120, 200);
      g.save(); g.translate(120, 0); g.rotate(Math.PI / 2); Stripes(g, 0, 0, 200, 120, 20, c0, c2); g.restore();
      g.fillStyle = Lin(g, 0, 0, 120, 0, [0, 'rgba(0,0,0,0.32)', 0.16, 'rgba(255,255,255,0.18)', 0.5, 'rgba(255,255,255,0.05)', 0.84, 'rgba(255,255,255,0.18)', 1, 'rgba(0,0,0,0.32)']);
      g.fillRect(0, 0, 120, 200);
      g.fillStyle = Lin(g, 0, 0, 0, 200, [0, 'rgba(255,255,255,0.5)', 0.06, 'rgba(255,255,255,0)', 0.8, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.35)']);
      g.fillRect(0, 0, 120, 200);
      g.fillStyle = c1; g.fillRect(0, 0, 5, 200); g.fillRect(115, 0, 5, 200); g.fillRect(0, 192, 120, 8);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let v = 40; v < 190; v += 40) g.fillRect(5, v, 110, 2);
      const top = c;
      c = Cv(200, 44); g = c.getContext('2d');
      g.fillStyle = Shade(base, -0.12); g.fillRect(0, 0, 200, 44);
      Stripes(g, 0, 0, 200, 44, 18, Shade(c0, -0.18), c2);
      g.fillStyle = Lin(g, 0, 0, 0, 44, [0, 'rgba(255,255,255,0.3)', 0.3, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.4)']);
      g.fillRect(0, 0, 200, 44);
      g.strokeStyle = c1; g.lineWidth = 4; g.strokeRect(2, 2, 196, 40);
      out[k + 'd'] = { top, side: c };
    }
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

  function Bubble(col) {
    const c = Cv(160, 160), g = c.getContext('2d');
    g.scale(160 / 96, 160 / 96);
    Ball(g, 48, 48, 47, Rad(g, 48, 48, 47, [0, Alpha(col, 0.6), 0.62, Alpha(col, 0.26), 1, Alpha(col, 0)]));
    Ball(g, 48, 48, 39.5, '#17121f');
    Ball(g, 48, 48, 37.2, Rad(g, 38, 31, 52, [0, Shade(col, 0.88), 0.42, Shade(col, 0.4), 0.85, col, 1, Shade(col, -0.45)]));
    g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(48, 48, 34.4, Math.PI * 0.95, Math.PI * 1.85); g.stroke();
    g.lineWidth = 3; g.strokeStyle = Alpha(col, 0.55); g.beginPath(); g.arc(48, 48, 34.2, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
    g.lineJoin = 'round'; g.lineCap = 'round';
    return [c, g];
  }
  function Shine(g) {
    g.fillStyle = 'rgba(255,255,255,0.42)'; g.beginPath(); g.ellipse(35, 26, 15, 7.5, -0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(30, 24.5, 4.6, 2.4, -0.6, 0, Math.PI * 2); g.fill();
    Ball(g, 66, 70, 2, 'rgba(255,255,255,0.7)');
  }
  function MakeBoostIcon() {
    const [c, g] = Bubble(PU_COL.boost);
    g.fillStyle = '#17121f';
    g.beginPath(); g.moveTo(48, 15); g.lineTo(66, 37); g.lineTo(56, 37); g.lineTo(56, 47); g.lineTo(40, 47); g.lineTo(40, 37); g.lineTo(30, 37); g.closePath(); g.fill();
    g.fillStyle = Lin(g, 0, 18, 0, 46, [0, '#fff7c2', 0.5, '#facc15', 1, '#f08c00']);
    g.beginPath(); g.moveTo(48, 20); g.lineTo(60, 34.5); g.lineTo(53, 34.5); g.lineTo(53, 44); g.lineTo(43, 44); g.lineTo(43, 34.5); g.lineTo(36, 34.5); g.closePath(); g.fill();
    g.font = '900 30px "Arial Black", "Segoe UI Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#3b0a3f'; g.strokeText('+5', 48, 64);
    g.fillStyle = Lin(g, 0, 50, 0, 78, [0, '#ffffff', 0.5, '#fde7ff', 1, '#f0abfc']); g.fillText('+5', 48, 64);
    Shine(g);
    return c;
  }
  function MakeRays(col) {
    const c = Cv(128, 128), g = c.getContext('2d');
    g.translate(64, 64);
    g.fillStyle = Rad(g, 0, 0, 64, [0, Alpha(col, 0.9), 0.35, Alpha(col, 0.45), 1, Alpha(col, 0)]);
    g.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.moveTo(0, 0); g.arc(0, 0, 64, a, a + 0.18); g.closePath(); }
    g.fill();
    return c;
  }
  function MakeFx(night) {
    const F = { cache: {} };
    const Mk = (key, w, h, fn) => {
      if (!F.cache[key]) { const c = Cv(w, h); fn(c.getContext('2d'), w, h); F.cache[key] = c; }
      return F.cache[key];
    };
    F.Glow = col => Mk(`g${col}`, 64, 64, g => Ball(g, 32, 32, 32, Rad(g, 32, 32, 32, [0, 'rgba(255,255,255,0.95)', 0.18, Alpha(col, 0.85), 0.5, Alpha(col, 0.3), 1, Alpha(col, 0)])));
    F.Ring = col => Mk(`r${col}`, 128, 128, g => {
      g.shadowColor = col; g.shadowBlur = 10;
      g.lineWidth = 7; g.strokeStyle = Alpha(col, 0.85); g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.stroke();
      g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    });
    F.Conf = col => Mk(`c${col}`, 24, 14, g => {
      RR(g, 1, 1, 22, 12, 3); g.fillStyle = col; g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(12, 1, 11, 12);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(3, 2.5, 8, 2);
    });
    F.star = Mk('star', 64, 64, g => {
      Ball(g, 32, 32, 30, Rad(g, 32, 32, 30, [0, 'rgba(255,248,200,0.6)', 1, 'rgba(255,248,200,0)']));
      g.beginPath();
      for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, r = k % 2 ? 6 : 26; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      g.closePath(); g.fillStyle = Rad(g, 32, 32, 26, [0, '#ffffff', 0.4, '#fff7c2', 1, '#ffd23f']); g.fill();
    });
    const pc = night ? '#9d93b8' : '#e9e0d2', sc = night ? '#8a84a3' : '#eef0f4';
    F.puff = Mk('puff', 64, 64, g => {
      Ball(g, 32, 32, 30, Rad(g, 26, 24, 34, [0, Alpha(pc, 0.95), 0.55, Alpha(pc, 0.6), 1, Alpha(pc, 0)]));
    });
    F.smoke = Mk('smoke', 64, 64, g => {
      Ball(g, 32, 32, 30, Rad(g, 26, 24, 34, [0, Alpha(sc, 0.85), 0.6, Alpha(sc, 0.45), 1, Alpha(sc, 0)]));
    });
    F.glow = { y: F.Glow('#ffd84a'), o: F.Glow('#ff9f1c') };
    return F;
  }
  function MakeIcon(type) {
    const [c, g] = Bubble(PU_COL[type]);
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
    } else {
      g.fillStyle = '#fff59d';
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? 22 : 33; g.lineTo(48 + Math.cos(a) * rr, 48 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.font = '900 34px "Arial Black", "Segoe UI Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = '#3b2500'; g.strokeText('2x', 48, 50);
      g.fillStyle = Lin(g, 0, 34, 0, 64, [0, '#fff', 0.4, '#ffd23f', 1, '#f08c00']); g.fillText('2x', 48, 50);
    }
    Shine(g);
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
    const w = GW, h = GH, c = Cv(w, h), g = c.getContext('2d');
    g.fillStyle = pal.ground; g.fillRect(0, 0, w, h);
    for (const lc of [-LANE, 0, LANE]) {
      const x0 = (lc + G_X - 1.5) * TX, bw = 3 * TX;
      g.fillStyle = Lin(g, x0, 0, x0 + bw, 0, [0, Alpha(pal.bed, 0), 0.15, pal.bed, 0.85, pal.bed, 1, Alpha(pal.bed, 0)]);
      g.fillRect(x0, 0, bw, h);
    }
    const dw = 2.8 * TX;
    g.fillStyle = Lin(g, 0, 0, dw, 0, [0, pal.dirt, 0.7, pal.dirt, 1, Alpha(pal.dirt, 0)]); g.fillRect(0, 0, dw, h);
    g.fillStyle = Lin(g, w - dw, 0, w, 0, [0, Alpha(pal.dirt, 0), 0.3, pal.dirt, 1, pal.dirt]); g.fillRect(w - dw, 0, dw, h);
    for (let i = 0; i < 13600; i++) {
      const x = Math.random() * w, y = Math.random() * h, s = 2 + Math.random() * 4.4;
      g.globalAlpha = 0.25 + Math.random() * 0.55;
      g.fillStyle = Math.random() < 0.5 ? pal.gravelD : pal.gravelL;
      for (let k = -1; k <= 1; k++) {
        if (k && (y + k * h < -s || y + k * h > h + s)) continue;
        g.beginPath(); g.ellipse(x, y + k * h, s * 0.5, s * 0.4, 0, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1;
    for (let m = 0; m < 8; m++) for (let l = -1; l <= 1; l++) {
      const x0 = (l * LANE - SLP_W + G_X) * TX, y0 = (m + 1) * SLP_D * TX - SLP_T * TX;
      g.fillStyle = pal.sleeper; g.fillRect(x0, y0, SLP_W * 2 * TX, SLP_T * TX);
      g.fillStyle = Shade(pal.sleeper, -0.28); g.fillRect(x0, y0 + (SLP_T - SLP_E) * TX, SLP_W * 2 * TX, SLP_E * TX);
    }
    if (!pal.night) {
      g.strokeStyle = '#6d8f3c'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 180; i++) {
        const x = Math.random() < 0.5 ? Math.random() * 80 : w - Math.random() * 80, y = 8 + Math.random() * (h - 16);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y - 10); g.moveTo(x, y); g.lineTo(x + 4, y - 12); g.stroke();
      }
    }
    const lv = [];
    let src = c, sw = w, sh = h;
    for (let L = 0; L < 8; L++) {
      const lw = w >> GW_LV[L], lh = h >> L, out = Cv(lw, lh + G_PAD), o = out.getContext('2d');
      o.drawImage(src, 0, 0, sw, sh, 0, 0, lw, lh);
      for (let y = lh; y < lh + G_PAD; y += lh) o.drawImage(out, 0, 0, lw, lh, 0, y, lw, lh);
      lv.push(out);
      src = out; sw = lw; sh = lh;
    }
    return lv;
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
  const OW = 1.9;
  function P3(c) { return [c, Shade(c, -0.3), Shade(c, 0.34)]; }
  function Skin(o) {
    o.topC = P3(o.top); o.armC = o.topC; o.legC = P3(o.legs); o.shoeC = P3(o.shoe); o.soleC = [o.sole, Shade(o.sole, -0.24)];
    o.packC = P3(o.pack); o.skinC = P3(o.skin); o.handC = o.glove ? P3(o.glove) : o.skinC; o.hairC = P3(o.hair);
    o.hatC = o.hat ? P3(o.hat) : null; o.pomC = o.pom ? P3(o.pom) : null;
    o.vestC = o.vest ? P3(o.vest) : null; o.skirtC = o.skirt ? P3(o.skirt) : null;
    return o;
  }
  const CHARS = [
    Skin({ id: 'jay', price: 0, head: 'cap', collar: 'hood', stripe: '#f1f5f9', skin: '#f2c290', hair: '#5a3620', top: '#2f8fe8', rib: '#1d5ea6', legs: '#3a4a7c', cuff: '#2c3a66', shoe: '#f6f7f9', shoeA: '#e53935', sole: '#e2e5ea', pack: '#ff8a2a', packA: '#ffd23f', hat: '#e53935', hatA: '#ffffff' }),
    Skin({ id: 'mila', price: 800, head: 'pony', collar: 'collar', skirt: '#ec4899', skin: '#f7d2ae', hair: '#3a2219', top: '#8b5cf6', rib: '#5b32c0', legs: '#2a2a36', cuff: '#1e1e28', shoe: '#ffffff', shoeA: '#f472b6', sole: '#fbcfe8', pack: '#2dd4bf', packA: '#fef08a', hat: '#f472b6' }),
    Skin({ id: 'tito', price: 1500, head: 'beanie', collar: 'hood', skin: '#a8714a', hair: '#21150e', top: '#25a35c', rib: '#14703c', legs: '#36558a', cuff: '#f4f1ea', shorts: true, deck: '#f97316', shoe: '#ff7a1f', shoeA: '#1f2937', sole: '#f5f0e6', pack: '#6b7686', packA: '#facc15', hat: '#facc15', pom: '#ef4444' }),
    Skin({ id: 'zoe', price: 2500, head: 'mohawk', collar: 'collar', studs: true, vest: '#41679e', skin: '#f0c6a0', hair: '#ff3fa4', top: '#2b2b35', rib: '#16161c', legs: '#5d6b7d', cuff: '#4a5666', shoe: '#1c1c22', shoeA: '#f4f4f6', sole: '#f4f4f6', pack: '#e11d48', packA: '#fde047' }),
    Skin({ id: 'kai', price: 3500, head: 'afro', collar: 'collar', num: '23', nopack: true, shorts: true, skin: '#8a5634', hair: '#2a1a12', top: '#facc15', rib: '#b45309', legs: '#1f3b8a', cuff: '#ffffff', shoe: '#ef4444', shoeA: '#ffffff', sole: '#f4f4f6', pack: '#1f3b8a', packA: '#ffffff', hat: '#ef4444' }),
    Skin({ id: 'robo', price: 5000, head: 'robot', collar: 'robot', robot: true, skin: '#cfd8e2', hair: '#8b97a5', top: '#d4dce6', rib: '#7b8794', legs: '#9aa6b4', cuff: '#7b8794', shoe: '#3b4250', shoeA: '#38bdf8', sole: '#2a303b', pack: '#3b4250', packA: '#38bdf8', glove: '#8b97a5' }),
  ];
  const INS = { coatC: P3('#2a4482'), legC: P3('#1f2745'), skinC: P3('#e9ad86'), hairC: P3('#a3a9b3'), capC: P3('#1d2c5a'), rib: '#1b2c58' };
  INS.armC = INS.coatC; INS.handC = INS.skinC;
  const DOG = { furC: P3('#c8894e'), darkC: P3('#7a4c25'), earC: P3('#7a4c25'), pawC: P3('#f3ece2') };
  const BOARDS = [
    { id: 'classic', price: 0, c: ['#22d3ee', '#f472b6', '#facc15'], glow: '#22d3ee' },
    { id: 'flame', price: 600, c: ['#7f1d1d', '#ef4444', '#fbbf24'], glow: '#f97316' },
    { id: 'neon', price: 1200, c: ['#1e1b4b', '#c026d3', '#22d3ee'], glow: '#a855f7' },
    { id: 'gold', price: 2500, c: ['#a16207', '#facc15', '#fff7c2'], glow: '#facc15' },
  ];
  let CH = CHARS[0], BD = BOARDS[0];

  function PaintDeck(g, bd, x, y, w, h) {
    const r = h / 2, c = bd.c;
    g.save();
    RR(g, x, y, w, h, r); g.clip();
    if (bd.id === 'classic') {
      g.fillStyle = Lin(g, x, 0, x + w, 0, [0, c[0], 0.5, c[1], 1, c[2]]); g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x + w * 0.16, y + h * 0.42, w * 0.68, h * 0.16);
    } else if (bd.id === 'flame') {
      g.fillStyle = Lin(g, x, 0, x + w, 0, [0, c[1], 0.45, c[0], 1, Shade(c[0], -0.2)]); g.fillRect(x, y, w, h);
      for (const [col, ks, kl] of [[Shade(c[1], 0.15), 1, 1], [c[2], 0.55, 0.7], ['#fff7d6', 0.25, 0.42]]) {
        g.fillStyle = col;
        for (const [o, l] of [[-0.24, 0.62], [0.02, 0.88], [0.26, 0.56]]) {
          const yc = y + h * (0.5 + o * ks), hh = h * 0.2 * ks + h * 0.04, L = w * l * kl;
          g.beginPath(); g.moveTo(x, yc - hh);
          g.bezierCurveTo(x + L * 0.45, yc - hh * 1.2, x + L * 0.75, yc - hh * 0.2, x + L, yc - hh * 0.55);
          g.bezierCurveTo(x + L * 0.78, yc + hh * 0.35, x + L * 0.45, yc + hh * 1.1, x, yc + hh);
          g.closePath(); g.fill();
        }
      }
    } else if (bd.id === 'neon') {
      g.fillStyle = Lin(g, 0, y, 0, y + h, [0, Shade(c[0], 0.15), 1, c[0]]); g.fillRect(x, y, w, h);
      g.lineWidth = Math.max(1.5, h * 0.09); g.lineCap = 'round';
      for (const [col, o] of [[c[1], 0.3], [c[2], 0.7]]) {
        g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = h * 0.35;
        g.beginPath(); g.moveTo(x + w * 0.12, y + h * o); g.lineTo(x + w * 0.4, y + h * o); g.lineTo(x + w * 0.5, y + h * (1 - o)); g.lineTo(x + w * 0.88, y + h * (1 - o)); g.stroke();
      }
      g.shadowBlur = 0;
    } else {
      g.fillStyle = Lin(g, 0, y, 0, y + h, [0, c[2], 0.45, c[1], 1, c[0]]); g.fillRect(x, y, w, h);
      g.fillStyle = '#1c1917';
      g.beginPath(); g.moveTo(x + w * 0.56, y + h * 0.08); g.lineTo(x + w * 0.4, y + h * 0.56); g.lineTo(x + w * 0.5, y + h * 0.56); g.lineTo(x + w * 0.42, y + h * 0.94); g.lineTo(x + w * 0.62, y + h * 0.4); g.lineTo(x + w * 0.52, y + h * 0.4); g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x, y, w, h * 0.22);
    g.restore();
    RR(g, x, y, w, h, r); g.lineWidth = Math.max(2, h * 0.12); g.strokeStyle = '#1e1b4b'; g.stroke();
  }
  function MakeDeck(bd) {
    const c = Cv(240, 72), g = c.getContext('2d');
    g.scale(3, 3);
    RR(g, 3, 8, 74, 12, 6); g.fillStyle = Shade(bd.c[0], -0.45); g.fill();
    g.lineWidth = 1.6; g.strokeStyle = '#1e1b4b'; g.stroke();
    for (const x of [18, 62]) { Ball(g, x, 20.5, 3.4, '#1e1b4b'); Ball(g, x, 20.5, 2.2, Shade(bd.glow, 0.5)); }
    PaintDeck(g, bd, 3, 2, 74, 13);
    return c;
  }
  function MakeBoardIcon(bd) {
    const [c, g] = Bubble(bd.glow);
    g.save(); g.translate(48, 50); g.rotate(-0.55);
    Ball(g, -24, 12, 5, '#1e1b4b'); Ball(g, 24, 12, 5, '#1e1b4b');
    PaintDeck(g, bd, -37, -11, 74, 22);
    g.restore();
    Shine(g);
    return c;
  }
  function BoardSprites(S) {
    S.deck = MakeDeck(BD);
    S.deckGlow = Rad(ctx, 0, 0, 42, [0, Alpha(BD.glow, 0.55), 1, Alpha(BD.glow, 0)]);
    S.icons.board = MakeBoardIcon(BD);
  }

  function BuildSprites(night) {
    const pal = night ? PALS.night : PALS.day, g = ctx;
    const S = { night, pal };
    S.sky = MakeSky(pal);
    S.city = MakeCity(pal);
    S.clouds = night ? [] : [MakeCloud(), MakeCloud(), MakeCloud()];
    S.ground = MakeGround(pal);
    S.slpEdge = Shade(pal.sleeper, -0.28);
    S.hazeAt = HZ_D.map(dz => (1 / dz - 1 / HZ_D[0]) / (1 / FAR - 1 / HZ_D[0]));
    S.hazeCol = HZ_D.map(dz => Alpha(pal.fog, Haze(dz)));
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
    for (const k of PU_LIST) S.icons[k] = MakeIcon(k);
    S.icons.boost = MakeBoostIcon();
    S.rays = {};
    for (const k of PU_LIST) S.rays[k] = MakeRays(PU_COL[k]);
    S.fx = MakeFx(night);
    S.hud = MakeHud();
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
    S.fogCol = FOG_A.map(a => Alpha(pal.fog, a));
    S.railTop = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.12, pal.rail, 1, pal.rail]);
    S.railSide = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.12, pal.railSide, 1, pal.railSide]);
    S.groundBase = Lin(g, 0, HY, 0, CV_H, [0, pal.fog, 0.15, pal.ground, 1, pal.ground]);
    S.glow = Rad(g, 0, 0, 1, [0, night ? 'rgba(255,240,190,0.85)' : 'rgba(255,244,200,0.6)', 1, 'rgba(255,244,200,0)']);
    S.vign = Rad(g, CX, CV_H / 2, 440, [0, 'rgba(230,30,40,0)', 0.62, 'rgba(230,30,40,0)', 1, 'rgba(230,30,40,0.55)']);
    S.gJet = Lin(g, -6, 0, 6, 0, [0, '#7d838c', 0.35, '#f2f4f7', 0.6, '#b9bec6', 1, '#5f656e']);
    S.gFlame = Lin(g, 0, 0, 0, 16, [0, '#ffffff', 0.25, '#fff176', 0.6, '#ff9800', 1, 'rgba(255,60,0,0)']);
    BoardSprites(S);
    return S;
  }

  function NewGame() {
    camX = 0; camY = CAM_H; camZ = -CAM_BACK;
    const gr = _grades.reduce((a, b) => ((b.Pct ?? 0) > (a.Pct ?? 0) ? b : a), _grades[0]);
    return {
      status: 'start', t: 0, last: 0, dist: 0, speed: V0, score: 0, coins: 0, mult: 1, base: BaseMult(), boost: 0, multT: 0, onRoof: false,
      run: { coins: 0, jump: 0, roll: 0, power: 0, score: 0, dist: 0, roof: 0, hurdle: 0, board: 0 }, rb: { coins: 0, score: 0, dist: 0 },
      toast: null, toastT: 0, toastQ: [], sets: 0,
      lane: 0, x: 0, prevX: 0, y: 0, vy: 0, ground: true, surf: 0, bar: null, rollT: 0, rollE: 0, rollAir: false, lean: 0, phase: 0, banked: false,
      dur: Durs(),
      jet: 0, jetFall: false, sneak: 0, magnet: 0, double: 0, board: 0, boardAvail: true, invT: 0,
      stumbleT: 0, wobT: 0, insT: 2.6, insZ: -2.4, insX: -0.8, insY: 0, dogY: 0, crashT: 0, crashKind: '', shake: 0, flash: 0, lastSpace: -9,
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
      } else if (c === 'L' || c === 'M') GS.B.push({ x, z: z - BAR_DEP / 2, type: c, L: BAR_DEP, dead: false, pass: false });
      else if (c !== 'E') GS.B.push({ x, z, type: c, L: 0, dead: false, pass: false });
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
    const end = p.dist + p.speed * p.dur.jet - 15;
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
      if (t.dead || t.ghost || Math.abs(x - t.x) > TW + 0.2) continue;
      if (z > t.z - 0.3 && z < t.z + t.L + 0.3) top = TH;
      else if (t.ramp && z > t.z - RAMP && z <= t.z) top = Math.max(top, TH * (z - t.z + RAMP) / RAMP);
    }
    return top;
  }
  function BarSurf(p) {
    const tol = p.vy > 0 ? 0 : BAR_TOL;
    let top = 0;
    p.bar = null;
    for (let i = 0; i < p.B.length; i++) {
      const b = p.B[i], bt = BAR_TOP[b.type];
      if (!bt || b.dead || bt <= top || p.dist - b.z - b.L > BAR_Z || b.z - p.dist > BAR_F || Math.abs(p.x - b.x) > 1.2 || p.y < bt - tol) continue;
      top = bt; p.bar = b;
    }
    return top;
  }

  const PARTS = Array.from({ length: 260 }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, s: 0, ds: 0, g: 0, img: null, add: 0, rot: 0, vr: 0 }));
  function Part(img, x, y, vx, vy, life, s, ds, g, add, rot, vr) {
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (q.on) continue;
      q.on = true; q.img = img; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = life; q.age = 0; q.s = s; q.ds = ds; q.g = g; q.add = add; q.rot = rot; q.vr = vr;
      return;
    }
  }
  function Rnd(a) { return (Math.random() - 0.5) * a; }
  function Dust() {
    if (!Proj(GS.x, GS.surf, GS.dist)) return;
    const k = PK / 65, F = SPR.fx;
    for (let i = 0; i < 7; i++) Part(F.puff, PX + Rnd(36) * k, PY - 3 * k, Rnd(150) * k, (-14 - Math.random() * 36) * k, 0.5 + Math.random() * 0.2, (12 + Math.random() * 8) * k, 40 * k, 30, 0, Math.random() * 6, Rnd(2));
  }
  function BarPuff() {
    const p = GS;
    if (!Proj(p.x, p.surf, p.dist)) return;
    const k = PK / 65, F = SPR.fx, cols = BAR_COL[p.bar.type];
    for (let i = 0; i < 6; i++) {
      const d = i % 2 ? 1 : -1;
      Part(F.puff, PX + d * (6 + Math.random() * 12) * k, PY - 2 * k, d * (70 + Math.random() * 70) * k, (-6 - Math.random() * 18) * k, 0.32 + Math.random() * 0.12, (7 + Math.random() * 5) * k, 34 * k, 20, 0, Math.random() * 6, Rnd(2));
    }
    for (let i = 0; i < 4; i++) Part(F.Conf(cols[i % 2]), PX + Rnd(30) * k, PY - 3 * k, Rnd(160) * k, (-60 - Math.random() * 60) * k, 0.35 + Math.random() * 0.15, (4 + Math.random() * 3) * k, -4 * k, 500, 0, Math.random() * 6, Rnd(14));
  }
  function Sparkle(c) {
    if (!Proj(c.x, c.y, c.z)) return;
    const F = SPR.fx, k = Math.min(1.4, PK / 65);
    Part(F.glow.y, PX, PY, 0, 0, 0.22, 34 * k, 120 * k, 0, 1, 0, 0);
    for (let i = 0; i < 3; i++) Part(F.star, PX + Rnd(16), PY + Rnd(16), Rnd(120), -50 - Math.random() * 80, 0.42, (12 + Math.random() * 8) * k, -18 * k, 120, 1, Math.random(), Rnd(8));
  }
  function Shards(n, cols) {
    if (!Proj(GS.x, GS.y + 0.6, GS.dist)) return;
    const F = SPR.fx;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      Part(F.Conf(cols[i % cols.length]), PX, PY, Math.cos(a) * v, Math.sin(a) * v - 120, 0.7 + Math.random() * 0.4, 8 + Math.random() * 8, -4, 700, 0, a, Rnd(16));
    }
  }
  function Burst(col) {
    if (!Proj(GS.x, GS.y + 0.9, GS.dist)) return;
    const F = SPR.fx;
    Part(F.Ring(col), PX, PY, 0, 0, 0.45, 30, 330, 0, 1, 0, 0);
    Part(F.Glow(col), PX, PY, 0, 0, 0.35, 80, 160, 0, 1, 0, 0);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      Part(F.star, PX, PY, Math.cos(a) * 260, Math.sin(a) * 260, 0.5, 18, -26, 0, 1, a, 4);
    }
  }
  function Grab(it) {
    if (!Proj(it.x, it.y, it.z)) return;
    const F = SPR.fx, col = PU_COL[it.type];
    Part(F.Ring(col), PX, PY, 0, 0, 0.5, 40, 260, 0, 1, 0, 0);
    Part(F.Glow(col), PX, PY, 0, 0, 0.3, 90, 140, 0, 1, 0, 0);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 220;
      Part(i % 2 ? F.star : F.Glow(col), PX, PY, Math.cos(a) * v, Math.sin(a) * v - 60, 0.6 + Math.random() * 0.3, 10 + Math.random() * 12, -8, 260, 1, a, Rnd(10));
    }
  }
  function Exhaust() {
    const p = GS;
    if (!Proj(p.x, p.y, p.dist)) return;
    const k = PK * 0.017, F = SPR.fx;
    Part(F.smoke, PX + Rnd(14) * k, PY - 30 * k, Rnd(60), 40 + Math.random() * 60, 0.7, 14 * k, 70 * k, -40, 0, Math.random() * 6, Rnd(2));
    if (Math.random() < 0.5) Part(F.glow.o, PX + Rnd(12) * k, PY - 34 * k, Rnd(30), 60, 0.18, 16 * k, 10 * k, 0, 1, 0, 0);
  }
  function Confetti() {
    const F = SPR.fx, cols = ['#facc15', '#f472b6', '#38bdf8', '#4ade80', '#fb923c', '#c084fc'];
    for (let i = 0; i < 70; i++) Part(F.Conf(cols[i % 6]), Math.random() * CV_W, -10 - Math.random() * 80, Rnd(80), 60 + Math.random() * 120, 2.4 + Math.random() * 0.8, 8 + Math.random() * 6, 0, 90, 0, Math.random() * 6, Rnd(10));
  }
  function Parts(dt) {
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (!q.on) continue;
      q.age += dt;
      if (q.age >= q.life) { q.on = false; continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.s += q.ds * dt; q.rot += q.vr * dt;
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
    p.vy = p.sneak > 0 ? SNEAK_V : JUMP_V; p.ground = false; p.rollT = 0; p.rollAir = false;
    Mis('jump', 1);
  }
  function Roll() {
    const p = GS;
    if (p.jet > 0 || p.jetFall) return;
    if (p.rollT <= 0) p.rollE = 0;
    p.rollT = ROLL_T;
    if (p.ground) Dust();
    else { p.vy = Math.min(p.vy, -24); p.rollAir = true; }
  }
  function Board() {
    const p = GS;
    if (p.board > 0 || p.status !== 'playing') return false;
    if (p.boardAvail) p.boardAvail = false;
    else if (SAVE.hb > 0) { SAVE.hb--; SaveData(); }
    else return false;
    p.board = p.dur.board; p.popup = 'board'; p.popT = 1.4;
    Mis('board', 1);
    return true;
  }

  function Power(type) {
    const p = GS;
    p.popup = type; p.popT = 1.6;
    if (type === 'jet') {
      p.jet = p.dur.jet; p.jetFall = false; p.rollT = 0; p.rollAir = false; p.vy = 0; p.ground = false;
      ClearLanding(p.dist + p.speed * (p.dur.jet + 1.3));
      JetCoins();
    } else p[type] = p.dur[type];
  }

  function BreakBoard() {
    const p = GS;
    p.board = 0; p.invT = 2; p.shake = 0.4; p.flash = 0.25;
    Shards(26, BD.c.concat('#ffffff'));
    Burst(BD.glow);
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
  function Hit(head, o, train) {
    const p = GS;
    if (head) {
      if (p.invT > 0 || p.board > 0) {
        if (train) o.ghost = true;
        else { o.dead = true; Shards(14, BAR_COL[o.type]); }
        p.surf = Surface(p.x, p.dist);
        if (p.invT <= 0) BreakBoard();
        return;
      }
      p.dist = o.z - 0.45; camZ = p.dist - CAM_BACK;
      p.surf = Surface(p.x, p.dist);
      Crash('crash');
      return;
    }
    p.lane = Math.max(-1, Math.min(1, Math.round(o.x / LANE) + (p.prevX > o.x ? 1 : -1)));
    p.x = p.prevX;
    p.surf = Surface(p.x, p.dist);
    if (p.invT <= 0) Stumble();
  }

  function Collide() {
    const p = GS, h = p.rollT > 0 ? 0.8 : 1.7, z = p.dist, y = p.y;
    for (let i = 0; i < p.T.length; i++) {
      const t = p.T[i], ox = TW + 0.33;
      if (t.dead || t.ghost || Math.abs(p.x - t.x) >= ox) continue;
      let top = -1;
      if (z + 0.3 > t.z && z - 0.3 < t.z + t.L) top = TH;
      else if (t.ramp && z > t.z - RAMP && z <= t.z) top = TH * (z - t.z + RAMP) / RAMP;
      if (top < 0 || y >= top - 0.45) continue;
      Hit(top === TH && Math.abs(p.prevX - t.x) < ox, t, true);
      return;
    }
    for (let i = 0; i < p.B.length; i++) {
      const b = p.B[i], tp = b.type, ox = tp === 'S' ? 1.05 : 1.25;
      if (b.dead || p.invT > 0 || z < b.z - 0.45 || z > b.z + (b.L ? b.L + 0.1 : 0.45) || Math.abs(p.x - b.x) >= ox) continue;
      const hit = b.L ? y < BAR_TOP[tp] - 0.02 : tp === 'H' ? y + h > 1.3 && y < 2.7 : y < 3.3;
      if (!hit) continue;
      Hit(Math.abs(p.prevX - b.x) < ox, b, false);
      return;
    }
  }

  function Player(dt) {
    const p = GS, tx = p.lane * LANE;
    p.prevX = p.x;
    p.x += (tx - p.x) * (1 - Math.exp(-dt * 20));
    if (Math.abs(tx - p.x) < 0.01) p.x = tx;
    p.lean += ((tx - p.x) * 0.13 - p.lean) * Math.min(1, dt * 14);
    const ts = Surface(p.x, p.dist), bs = p.jet > 0 ? 0 : BarSurf(p);
    if (bs <= ts) p.bar = null;
    p.surf = Math.max(ts, bs);
    if (p.jet > 0) {
      p.y += (JET_Y - p.y) * (1 - Math.exp(-dt * 3)); p.vy = 0;
    } else if (p.jetFall) {
      p.y -= dt * 7;
      if (p.y <= p.surf) { p.y = p.surf; p.jetFall = false; p.ground = true; p.invT = Math.max(p.invT, 1); if (p.bar) BarPuff(); else Dust(); }
    } else {
      if (p.ground) {
        if (p.surf > p.y && p.surf - p.y < 0.75) p.y = p.surf;
        else if (p.surf < p.y - 0.05) { p.ground = false; p.vy = 0; }
      }
      if (!p.ground) {
        const y0 = p.y;
        p.vy -= GRAV * dt;
        p.y += p.vy * dt;
        if (p.y <= p.surf && y0 >= p.surf - 0.45) {
          p.y = p.surf; p.vy = 0; p.ground = true;
          if (p.rollAir) { p.rollAir = false; p.rollT = Math.max(p.rollT, ROLL_T * 0.7); }
          if (p.bar) BarPuff(); else Dust();
        }
      }
    }
    if (p.rollT > 0) { p.rollT -= dt; p.rollE += dt; if (p.rollAir) p.rollT = Math.max(p.rollT, 0.2); }
    p.phase += dt * (5.5 + p.speed * 0.42);
    const roof = p.ground && p.surf >= TH - 0.01;
    if (roof && !p.onRoof) Mis('roof', 1);
    p.onRoof = roof;
    if (p.jet <= 0 && !p.jetFall) Collide();
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
      if (Math.abs(dz) < r && Math.abs(c.x - p.x) < r - 0.1 && c.y > p.y - 0.3 && c.y < p.y + h + 0.6) { c.dead = true; p.coins++; Sparkle(c); Mis('coins', 1); }
    }
    for (let i = 0; i < p.I.length; i++) {
      const it = p.I[i];
      if (it.dead || Math.abs(it.z - p.dist) > 1.1 || Math.abs(it.x - p.x) > 1 || it.y < p.y - 0.4 || it.y > p.y + h + 0.9) continue;
      it.dead = true;
      Power(it.type);
      Grab(it);
      Mis('power', 1);
    }
  }

  function Chaser(dt) {
    const p = GS, target = p.status === 'crash' ? -0.95 : p.insT > 0 ? -2.4 : -12;
    p.insZ += (target - p.insZ) * Math.min(1, dt * (p.status === 'crash' ? 3 : p.insT > 0 ? 2.2 : 0.8));
    p.insX += (p.x - 0.85 - p.insX) * Math.min(1, dt * 4);
    const k = Math.min(1, dt * 10), z = p.dist + p.insZ;
    p.insY += (Surface(p.insX, z) - p.insY) * k;
    p.dogY += (Surface(p.insX + 1.4, z + 1.6) - p.dogY) * k;
  }

  function Camera(dt) {
    const p = GS, flying = p.jet > 0 || p.jetFall;
    camX += (p.x * 0.75 - camX) * (1 - Math.exp(-dt * 6));
    const sf = p.bar ? 0 : p.surf;
    let ty = CAM_H + (flying ? p.y * 0.9 : sf * 0.88 + Math.max(0, p.y - sf) * 0.3);
    if (ty > 6.15 && ty < 8.3 && BridgeAt(camZ, 18, 5.5)) ty = 6.15;
    camY += (ty - camY) * (1 - Math.exp(-dt * 4));
    camZ = p.dist - CAM_BACK;
  }

  function Timers(dt) {
    const p = GS;
    p.t += dt;
    for (let i = 0; i < HUD_PU.length; i++) if (p[HUD_PU[i]] > 0) p[HUD_PU[i]] = Math.max(0, p[HUD_PU[i]] - dt);
    p.invT = Math.max(0, p.invT - dt); p.stumbleT = Math.max(0, p.stumbleT - dt); p.insT = Math.max(0, p.insT - dt);
    p.wobT = Math.max(0, p.wobT - dt); p.shake = Math.max(0, p.shake - dt); p.flash = Math.max(0, p.flash - dt); p.popT = Math.max(0, p.popT - dt);
    p.multT = Math.max(0, p.multT - dt);
    if (p.toast) { p.toastT -= dt; if (p.toastT <= 0) p.toast = null; }
    if (!p.toast && p.toastQ.length) { p.toast = p.toastQ.shift(); p.toastT = p.toast.big ? 3.2 : 2.6; if (p.toast.big) { Confetti(); p.multT = 1.2; } }
  }

  function Passed() {
    const p = GS;
    if (p.jet > 0 || p.jetFall) return;
    for (let i = 0; i < p.B.length; i++) {
      const b = p.B[i];
      if (b.pass || b.dead || b.z > p.dist) continue;
      b.pass = true;
      if (Math.abs(b.x - p.x) > 1.2) continue;
      if (b.type === 'H' && p.rollT > 0) Mis('roll', 1);
      else if ((b.type === 'L' || b.type === 'M') && p.y > 0.6) Mis('hurdle', 1);
    }
  }

  function Mis(t, d) {
    const p = GS, M = SAVE.ms;
    if (!p || p.status !== 'playing') return;
    p.run[t] += d;
    if (MisMax()) return;
    for (let i = 0; i < 3; i++) {
      const m = MIS[i], was = M.p[i];
      if (was >= m.n) continue;
      if (m.t === t) M.p[i] = Math.min(m.n, was + d);
      else if (m.o === t) M.p[i] = Math.min(m.n, Math.max(was, p.run[t] - p.rb[t]));
      else continue;
      if (M.p[i] >= m.n) MisDone(i);
    }
  }
  function MisDone(i) {
    const p = GS, M = SAVE.ms;
    p.toastQ.push({ big: false, a: TXT.misDone, b: MisText(MIS[i]) });
    Burst(PU_COL.mis);
    if (M.p[0] >= MIS[0].n && M.p[1] >= MIS[1].n && M.p[2] >= MIS[2].n) {
      const c = SetReward();
      M.lv++; M.p = [0, 0, 0];
      SAVE.bank += c; SAVE.sb++;
      MisLoad();
      p.rb.coins = p.run.coins; p.rb.score = p.run.score; p.rb.dist = p.run.dist;
      p.base = BaseMult(); p.sets++;
      p.toastQ.push({ big: true, a: TXT.setDone, b: _GameText('ss_mult_up').replace('{n}', p.base), c: _GameText('ss_mis_reward').replace('{c}', c) });
    }
    SaveData();
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
    p.mult = (p.base + p.boost) * (p.double > 0 ? 2 : 1);
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
    if (p.status === 'playing') {
      Pickups(dt);
      Passed();
      const sc = Math.floor(p.score), dm = Math.floor(p.dist);
      if (sc > p.run.score) Mis('score', sc - p.run.score);
      if (dm > p.run.dist) Mis('dist', dm - p.run.dist);
      if (p.jet > 0 && Math.random() < dt * 40) Exhaust();
    }
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
    if (p.crashT > 1.5) { p.status = 'gameover'; SaveBest(Math.floor(p.score)); BankRun(); ShowGameOver(); }
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
  const HZ_D = [30, 38, 48, 62, 80, 105, 135, 157.5, FAR];

  function Strips(img, u0, v0, uw, vh, xw, za, zb, yb, yt) {
    const zn = camZ + NEAR;
    if (zb <= zn || za - camZ > FAR + 20) return;
    const ox = (xw - camX) * FOC, rev = ox > 0, span = zb - za, im = ((rev ? CV_W - CX : CX) + 4) / Math.abs(ox);
    const ca = Math.max(za, zn, camZ + 1 / im), ia = 1 / (ca - camZ), ib = 1 / (zb - camZ);
    if (zb <= ca) return;
    const m = ((yt + yb) * 0.5 - camY) * FOC, hh = (yt - yb) * FOC;
    const sw = Math.max(1.5, Math.min(6, 2.2 * Math.abs(xw - camX) / (yt - yb))), ov = ctx.globalAlpha < 1 ? 0 : 0.7;
    const n = Math.max(1, Math.min(400, Math.ceil(Math.abs(ox * (ia - ib)) / sw)));
    let pi = ia, pt = (ca - za) / span;
    for (let i = 1; i <= n; i++) {
      const inv = ia + (ib - ia) * i / n, t1 = (1 / inv + camZ - za) / span;
      const iA = rev ? inv : pi, iB = rev ? pi : inv, w = ox * (iB - iA), ic = (iA + iB) * 0.5;
      const ua = rev ? 1 - t1 : pt, du = t1 - pt, ex = Math.max(0, Math.min(ov / w, (1 - ua) / du - 1));
      ctx.setTransform(DPR * w, -DPR * m * (iB - iA), 0, DPR * hh * ic, DPR * (CX + ox * iA + SHX), DPR * (HY - m * iA - 0.5 * hh * ic + SHY));
      ctx.drawImage(img, u0 + uw * ua, v0, uw * du * (1 + ex), vh, 0, 0, 1 + ex, 1);
      pi = inv; pt = t1;
    }
  }

  function DrawFace(img, u0, v0, uw, vh, xw, za, zb, yb, yt) {
    const zn = camZ + NEAR;
    if (zb <= zn || za - camZ > FAR + 20) return;
    const ca = Math.max(za, zn);
    ctx.save();
    ctx.beginPath(); Mv(xw, yt, ca); Ln(xw, yt, zb); Ln(xw, yb, zb); Ln(xw, yb, ca); ctx.closePath(); ctx.clip();
    Strips(img, u0, v0, uw, vh, xw, za, zb, yb, yt);
    ctx.restore();
  }

  function DrawRoof(img, x0, x1, za, zb, y) {
    const oy = (y - camY) * FOC, ca = Math.max(za, camZ + NEAR, camZ - oy / (CV_H + 4 - HY));
    if (zb <= ca) return;
    const span = zb - za, ia = 1 / (ca - camZ), ib = 1 / (zb - camZ), l0 = (x0 - camX) * FOC, l1 = (x1 - camX) * FOC, lc = (l0 + l1) * 0.5, lw = l1 - l0;
    const n = Math.max(1, Math.min(240, Math.ceil(Math.abs(oy * (ia - ib)) / 0.75))), ih = img.height, iw = img.width, ov = ctx.globalAlpha < 1 ? 0 : 0.6;
    let pi = ia, pt = (ca - za) / span;
    ctx.save();
    for (let i = 1; i <= n; i++) {
      const inv = ia + (ib - ia) * i / n, t1 = (1 / inv + camZ - za) / span, di = inv - pi, ic = (pi + inv) * 0.5, d = -oy * di;
      const ex = Math.max(0, Math.min(ov / Math.abs(d), (1 - pt) / (t1 - pt) - 1));
      ctx.setTransform(DPR * lw * ic, 0, DPR * lc * di, DPR * d, DPR * (CX + lc * pi - 0.5 * lw * ic + SHX), DPR * (HY - oy * pi + SHY));
      ctx.drawImage(img, 0, ih * pt, iw, ih * (t1 - pt) * (1 + ex), 0, 0, 1, 1 + ex);
      pi = inv; pt = t1;
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(20,20,26,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CX + l0 * ia, HY - oy * ia); ctx.lineTo(CX + l0 * ib, HY - oy * ib); ctx.moveTo(CX + l1 * ia, HY - oy * ia); ctx.lineTo(CX + l1 * ib, HY - oy * ib); ctx.stroke();
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
        const w = 1000, x = ((i * 340 + GS.t * (5 + i * 2) - camX * 4) % w + w) % w - 240;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(SPR.clouds[i], x, 14 + i * 26, 230 - i * 30, 82 - i * 10);
      }
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(SPR.city, -540 - camX * 4, HY - 142);
    ctx.fillStyle = SPR.skyBand; ctx.fillRect(0, HY - 70, CV_W, 72);
  }

  const FOG_D = [275, 170, 110, 80, 58], FOG_A = [0.92, 0.8, 0.67, 0.475, 0.27, 0];
  function DrawFog() {
    const fk = camY * FOC, r = fk / FOG_D[4] + 2, gr = ctx.createLinearGradient(0, HY - 2, 0, HY - 2 + r);
    gr.addColorStop(0, SPR.fogCol[0]);
    for (let i = 0; i < FOG_D.length; i++) gr.addColorStop((fk / FOG_D[i] + 2) / r, SPR.fogCol[i + 1]);
    ctx.fillStyle = gr; ctx.fillRect(-20, HY - 2, CV_W + 40, r);
  }

  function DrawGround() {
    ctx.fillStyle = SPR.groundBase; ctx.fillRect(0, HY, CV_W, CV_H - HY);
    const lv = SPR.ground, fk = camY * FOC;
    for (let y = CV_H; y > HY + 1; ) {
      const h = y - HY > 150 ? 2 : 1, yt = y - h, zt = fk / (yt - HY);
      if (zt > FAR) break;
      const zb = fk / (y - HY), k = FOC * (yt + h * 0.5 - HY) / fk, xw = 2 * G_X * k;
      const span = (zt - zb) * TX, mv = span / h / DPR, mh = GW / xw / DPR;
      const L = Math.min(7, Math.max(0, Math.round(Math.log2(mv)), mh >= 2 ? G_MIN[Math.min(3, Math.floor(Math.log2(mh)))] : 0));
      const img = lv[L], lh = GH >> L, sp = Math.min(lh, span / (1 << L));
      let s0 = (-(camZ + zt) * TX / (1 << L)) % lh;
      if (s0 < 0) s0 += lh;
      ctx.drawImage(img, 0, s0, img.width, sp * (h + 0.5) / h, CX + (-G_X - camX) * k, yt, xw, h + 0.5);
      y = yt;
    }
  }

  const SLP_Z = [NEAR, 16, 22, 28, 34], SLP_A = [1, 0.75, 0.45, 0.2];
  function DrawTrack() {
    const pal = SPR.pal;
    for (let b = 0; b < 4; b++) {
      const za = camZ + SLP_Z[b], zb = camZ + SLP_Z[b + 1];
      ctx.globalAlpha = SLP_A[b];
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? pal.sleeper : SPR.slpEdge;
        ctx.beginPath();
        for (let i = Math.ceil(za / SLP_D); i * SLP_D < zb; i++) {
          const z0 = i * SLP_D + (pass ? SLP_E : 0), k0 = FOC / (z0 - camZ), k1 = FOC / (i * SLP_D + (pass ? SLP_T : SLP_E) - camZ), y0 = HY + camY * k0, y1 = HY + camY * k1;
          for (let l = -1; l <= 1; l++) {
            const xa = l * LANE - SLP_W - camX, xb = l * LANE + SLP_W - camX;
            ctx.moveTo(CX + xa * k0, y0); ctx.lineTo(CX + xb * k0, y0); ctx.lineTo(CX + xb * k1, y1); ctx.lineTo(CX + xa * k1, y1);
          }
        }
        ctx.fill();
      }
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

  function HazeFill(xw) {
    const ox = (xw - camX) * FOC, gr = ctx.createLinearGradient(CX + ox / HZ_D[0], 0, CX + ox / FAR, 0);
    for (let i = 0; i < HZ_D.length; i++) gr.addColorStop(SPR.hazeAt[i], SPR.hazeCol[i]);
    return gr;
  }
  function WallEdge(xw, y, zn, zf, d0, d1) {
    ctx.beginPath();
    Proj(xw, y, zn); ctx.moveTo(PX, PY + d0); Proj(xw, y, zf); ctx.lineTo(PX, PY + d0); ctx.lineTo(PX, PY + d1); Proj(xw, y, zn); ctx.lineTo(PX, PY + d1);
    ctx.fill();
  }
  function DrawWalls() {
    const zn = camZ + NEAR, zf = camZ + FAR;
    for (let s = -1; s <= 1; s += 2) {
      const xw = s * WALL_X, xc = xw + s * 0.35;
      ctx.save();
      for (let i = Math.floor(zf / 12); i >= Math.floor(zn / 12); i--) Strips(SPR.walls[(Hash(i * 3.7 + s) * SPR.walls.length) | 0], 0, 0, 480, 112, xw, i * 12, i * 12 + 12, 0, WALL_H);
      ctx.restore();
      ctx.fillStyle = SPR.pal.wallTop;
      ctx.beginPath();
      Proj(xc, WALL_H, zn); ctx.moveTo(PX, PY); Proj(xc, WALL_H, zf); ctx.lineTo(PX, PY);
      Proj(xw, WALL_H, zf); ctx.lineTo(PX, PY + 0.7); Proj(xw, WALL_H, zn); ctx.lineTo(PX, PY + 0.7);
      ctx.fill();
      ctx.fillStyle = SPR.pal.wallD; WallEdge(xw, 0, zn, zf, -0.8, 0.6);
      ctx.fillStyle = HazeFill(xw);
      ctx.beginPath(); Mv(xw, 0, zn); Ln(xw, WALL_H, zn); Ln(xc, WALL_H, zn); Ln(xc, WALL_H, zf); Ln(xw, WALL_H, zf); Ln(xw, 0, zf); ctx.fill();
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
    const side = camX < xl ? xl : camX > xr ? xr : null, tex = SPR.sides[t.lv], ga = t.ghost ? 0.42 + Math.sin(GS.t * 14) * 0.08 : 1;
    ctx.globalAlpha = FogA(t.z - camZ) * 0.9;
    ctx.fillStyle = '#000';
    ctx.globalAlpha *= 0.28;
    QuadY(0.02, xl - 0.2, xr + 0.2, t.z - 0.15, t.z + t.L + 0.3);
    for (let i = t.cars - 1; i >= 0; i--) {
      const z0 = t.z + i * (CAR + GAP), z1 = z0 + CAR, a = FogA(z0 - camZ);
      if (z1 <= zn || a <= 0) continue;
      ctx.globalAlpha = a * ga;
      if (i < t.cars - 1) {
        ctx.fillStyle = '#1c1d22';
        if (side !== null) QuadX(side + (side < t.x ? 0.12 : -0.12), 0.35, TH - 0.25, z1, z1 + GAP);
        if (camY > TH) QuadY(TH - 0.25, xl + 0.12, xr - 0.12, z1, z1 + GAP);
      }
      if (side !== null && z1 > zn) {
        ctx.save(); Strips(tex, 0, 0, tex.width, tex.height, side, z0, z1, 0, TH + 0.04); ctx.restore();
        ctx.fillStyle = '#141518'; WallEdge(side, 0, Math.max(z0, zn), z1, -0.8, 0.5);
      }
      if (camY > TH) DrawRoof(SPR.roof, xl, xr, z0, z1, TH);
    }
    ctx.globalAlpha = FogA(t.z - camZ) * ga;
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

  function DrawBlock(b) {
    const a = FogA(b.z - camZ), z0 = b.z, z1 = b.z + b.L, zn = camZ + NEAR;
    if (a <= 0 || z1 <= zn) return;
    const tp = b.type, hw = BAR_DIM[tp][0] / 2, top = BAR_TOP[tp], bot = BAR_BOT[tp], xl = b.x - hw, xr = b.x + hw, D = SPR.bars[tp + 'd'];
    ctx.globalAlpha = a * 0.28; ctx.fillStyle = '#000';
    QuadY(0.02, xl - 0.12, xr + 0.12, z0 - 0.1, z1 + 0.25);
    ctx.globalAlpha = a; ctx.fillStyle = SPR.night ? '#55586a' : '#3f434b';
    for (let s = -1; s <= 1; s += 2) if (z1 - 0.12 > zn) QuadZ(z1 - 0.12, b.x + s * 0.96 - 0.07, b.x + s * 0.96 + 0.07, 0, bot);
    const side = camX < xl ? xl : camX > xr ? xr : null;
    if (side !== null) {
      DrawFace(D.side, 0, 0, D.side.width, D.side.height, side, z0, z1, bot, top);
      ctx.fillStyle = SPR.night ? '#55586a' : '#3f434b';
      QuadX(side + (side < b.x ? 0.03 : -0.03), 0, bot, Math.max(z1 - 0.16, zn), z1 - 0.04);
    }
    if (camY > top) DrawRoof(D.top, xl, xr, z0, z1, top);
    if (z0 > zn && Proj(b.x, 0, z0)) ctx.drawImage(SPR.bars[tp], PX - hw * PK, PY - BAR_DIM[tp][1] * PK, hw * 2 * PK, BAR_DIM[tp][1] * PK);
    ctx.globalAlpha = 1;
  }

  function DrawBar(b) {
    if (b.L) { DrawBlock(b); return; }
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
    const a = FogA(it.z - camZ), t = GS.t;
    if (a <= 0 || !Proj(it.x, it.car ? TH + 0.02 : 0.02, it.z)) return;
    const gx = PX, gy = PY, k = PK;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * (0.45 + Math.sin(t * 5 + it.z) * 0.1);
    ctx.drawImage(SPR.fx.Glow(PU_COL[it.type]), gx - 0.9 * k, gy - 0.22 * k, 1.8 * k, 0.44 * k);
    Proj(it.x, it.y + Math.sin(t * 4 + it.z) * 0.15, it.z);
    const s = 1.3 * PK * (1 + Math.sin(t * 6) * 0.05), r = s * 1.05;
    ctx.globalAlpha = a * 0.55;
    ctx.save(); ctx.translate(PX, PY); ctx.rotate(t * 1.2 + it.z);
    ctx.drawImage(SPR.rays[it.type], -r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a * 0.3; ctx.fillStyle = SPR.pal.night ? '#000' : 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.ellipse(gx, gy, 0.42 * k, 0.1 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a;
    ctx.drawImage(SPR.icons[it.type], PX - s / 2, PY - s / 2, s, s);
    const tw = (t * 1.6 + it.z * 0.37) % 1;
    if (tw < 0.3) {
      const ss = s * 0.34 * Math.sin(tw / 0.3 * Math.PI);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(SPR.fx.star, PX + s * 0.22 - ss / 2, PY - s * 0.26 - ss / 2, ss, ss);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function DrawCat(z) {
    const a = FogA(z - camZ);
    if (a <= 0 || z - camZ < NEAR) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = SPR.pal.pole;
    QuadZ(z, -4.55, 4.55, CAT_Y, CAT_Y + 0.3);
    for (let s = -1; s <= 1; s += 2) QuadZ(z, s * 4.35 - 0.12, s * 4.35 + 0.12, 0, CAT_Y + 0.3);
    for (let l = -1; l <= 1; l++) QuadZ(z, l * LANE - 0.03, l * LANE + 0.03, WIRE_Y, CAT_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    QuadZ(z, -4.55, 4.55, CAT_Y + 0.24, CAT_Y + 0.3);
    for (let s = -1; s <= 1; s += 2) QuadZ(z, s * 4.35 - 0.12, s * 4.35 - 0.05, 0, CAT_Y + 0.3);
    ctx.globalAlpha = 1;
  }

  function BridgeZ(i) { return i * 230 + 90; }
  function BridgeAt(z, a, b) { const i = Math.round((z - 92.5) / 230); return i > 0 && Hash(i * 9.1) < 0.65 && z > BridgeZ(i) - a && z < BridgeZ(i) + b; }
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
      const sx = l * LANE - camX, a = WIRE_Y - camY, b = CAT_Y - 0.05 - camY;
      ctx.moveTo(CX + sx * kn, HY - a * kn); ctx.lineTo(CX + sx * kf, HY - a * kf);
      ctx.moveTo(CX + sx * kn, HY - b * kn); ctx.lineTo(CX + sx * kf, HY - b * kf);
    }
    ctx.stroke();
  }

  const LG = [{ hx: 0, hy: 0, kx: 0, ky: 0, fx: 0, fy: 0, lift: 0 }, { hx: 0, hy: 0, kx: 0, ky: 0, fx: 0, fy: 0, lift: 0 }];
  const AR = [{ sx: 0, sy: 0, ex: 0, ey: 0, hx: 0, hy: 0, back: 0 }, { sx: 0, sy: 0, ex: 0, ey: 0, hx: 0, hy: 0, back: 0 }];
  const ST = { sneak: false, magnet: false, jet: false, crash: false, t: 0, ph: 0, tag: '#4ade80' };
  let BY = 0, TWS = 0, SX = 0, SY = 0;

  function Smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function Oval(x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }

  function RunPose(ph) {
    BY = -3.4 * Math.abs(Math.cos(ph)); TWS = Math.sin(ph) * 2.4;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, a = ph + i * Math.PI, sw = Math.sin(a), cw = Math.cos(a), k = Smooth(0.5 + 0.5 * sw), fw = Math.max(0, -cw) * (1 - k);
      const L = LG[i], A = AR[i], b = Smooth(0.5 - 0.5 * sw);
      L.hx = s * 7.6; L.hy = -44 + BY;
      L.kx = s * (8.8 + k * 1.8); L.ky = -23 + k * 1.5 - fw * 7 + BY * 0.5;
      L.fx = s * (8.4 + k * 2.4); L.fy = -0.5 - k * 25 - fw * 6;
      L.lift = k * 1.3 - 0.3;
      A.sx = s * 17 + TWS; A.sy = -81 + BY;
      A.ex = s * (22.5 + b * 3); A.ey = -66 - b * 8 + (1 - b) * 3 + BY;
      A.hx = s * (20.5 + b * 3 - (1 - b) * 5); A.hy = -52 - b * 21 - (1 - b) * 8 + BY;
      A.back = b * 2 - 1;
    }
  }
  function StandPose(t) {
    const br = Math.sin(t * 2.2) * 0.7;
    BY = br * 0.4; TWS = 0;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i];
      L.hx = s * 7.6; L.hy = -44 + BY; L.kx = s * 8.8; L.ky = -23 + BY * 0.5; L.fx = s * 9.6; L.fy = -0.5; L.lift = -0.3;
      A.sx = s * 17; A.sy = -81 + BY; A.ex = s * 22; A.ey = -65 + BY; A.hx = s * 22.5; A.hy = -50 + BY + br * 0.5; A.back = 0.2;
    }
  }
  function JumpPose(vy) {
    const u = Math.max(-1, Math.min(1, vy / JUMP_V)), f = Smooth(0.5 - 0.5 * u), r = 1 - f;
    BY = -2 * r; TWS = 0;
    const L0 = LG[0], L1 = LG[1];
    L0.hx = -7.6; L0.hy = -44 + BY; L0.kx = -11.5 + f * 2; L0.ky = -35 + f * 12; L0.fx = -9.5 + f * 1; L0.fy = -27 + f * 24; L0.lift = 1 - f * 1.3;
    L1.hx = 7.6; L1.hy = -44 + BY; L1.kx = 11 - f * 1.5; L1.ky = -30 + f * 8; L1.fx = 9.5; L1.fy = -13 + f * 11; L1.lift = -0.3;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, A = AR[i];
      A.sx = s * 17; A.sy = -81 + BY;
      A.ex = s * (27 + f * 3); A.ey = -90 + f * 18 + BY; A.hx = s * (30 + f * 10); A.hy = -106 + f * 30 + BY; A.back = 0.6;
    }
  }
  function BoardPose(t) {
    const hov = Math.sin(t * 6) * 1.5;
    BY = 4 + hov * 0.5; TWS = Math.sin(t * 3) * 1.2;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i];
      L.hx = s * 7.6; L.hy = -44 + BY; L.kx = s * 13.5; L.ky = -24 + BY; L.fx = s * 12.5; L.fy = -5 + hov; L.lift = -0.3;
      A.sx = s * 17; A.sy = -81 + BY; A.ex = s * 28; A.ey = -70 + BY; A.hx = s * 35; A.hy = -62 + BY + Math.sin(t * 3 + i * 2) * 3; A.back = 0.3;
    }
  }
  function JetPose(t) {
    BY = Math.sin(t * 5) * 1.2; TWS = 0;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, L = LG[i], A = AR[i], sw = Math.sin(t * 7 + i * 2) * 1.8;
      L.hx = s * 7.4; L.hy = -44 + BY; L.kx = s * 8.4; L.ky = -24 + BY + sw; L.fx = s * 7.6; L.fy = -5 + BY + sw; L.lift = 0;
      A.sx = s * 17; A.sy = -81 + BY; A.ex = s * 23.5; A.ey = -68 + BY; A.hx = s * 17.5; A.hy = -74 + BY; A.back = -0.5;
    }
  }
  function CrashPose(t) {
    StandPose(0);
    for (let i = 0; i < 2; i++) { const A = AR[i], s = i ? 1 : -1; A.ex = s * 27; A.ey = -90; A.hx = s * 29; A.hy = -106 + Math.sin(t * 20 + i * 3) * 3; A.back = 0.5; }
  }

  function Cap(x0, y0, r0, x1, y1, r1) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 0.01, a = Math.atan2(dy, dx), t = Math.acos(Math.max(-1, Math.min(1, (r0 - r1) / d)));
    ctx.moveTo(x0 + Math.cos(a + t) * r0, y0 + Math.sin(a + t) * r0);
    ctx.arc(x0, y0, r0, a + t, a + Math.PI * 2 - t);
    ctx.arc(x1, y1, r1, a - t, a + t);
    ctx.closePath();
  }
  function Norm(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    SX = -dy / d; SY = dx / d;
    if (SX * -0.6 + SY * -0.8 > 0) { SX = -SX; SY = -SY; }
  }
  function Seg(x0, y0, r0, x1, y1, r1, o, k) {
    Norm(x0, y0, x1, y1);
    Cap(x0 + SX * r0 * o, y0 + SY * r0 * o, r0 * k, x1 + SX * r1 * o, y1 + SY * r1 * o, r1 * k);
  }
  function Limb(x0, y0, x1, y1, x2, y2, r0, r1, r2, c) {
    ctx.fillStyle = OUTL; ctx.beginPath(); Cap(x0, y0, r0 + OW, x1, y1, r1 + OW); Cap(x1, y1, r1 + OW, x2, y2, r2 + OW); ctx.fill();
    ctx.fillStyle = c[0]; ctx.beginPath(); Cap(x0, y0, r0, x1, y1, r1); Cap(x1, y1, r1, x2, y2, r2); ctx.fill();
    ctx.fillStyle = c[1]; ctx.beginPath(); Seg(x0, y0, r0, x1, y1, r1, 0.44, 0.56); Seg(x1, y1, r1, x2, y2, r2, 0.44, 0.56); ctx.fill();
    ctx.fillStyle = c[2]; ctx.beginPath(); Seg(x0, y0, r0, x1, y1, r1, -0.5, 0.2); Seg(x1, y1, r1, x2, y2, r2, -0.5, 0.2); ctx.fill();
  }
  function Blob(x, y, rx, ry, c, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx + OW, ry + OW, rot || 0, 0, Math.PI * 2); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = c[0]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + rx * 0.3, y + ry * 0.25, rx * 0.66, ry * 0.7, rot || 0, 0, Math.PI * 2); ctx.fillStyle = c[1]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - rx * 0.12, y - ry * 0.08, rx * 0.7, ry * 0.66, rot || 0, 0, Math.PI * 2); ctx.fillStyle = c[0]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - rx * 0.42, y - ry * 0.42, rx * 0.26, ry * 0.2, -0.5, 0, Math.PI * 2); ctx.fillStyle = c[2]; ctx.fill();
  }
  function Ink(path, fill) {
    path(); ctx.lineJoin = 'round'; ctx.lineWidth = OW * 2; ctx.strokeStyle = OUTL; ctx.stroke();
    ctx.fillStyle = fill; ctx.fill();
  }
  function Line(w, col) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }

  function ShoeHeel(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w, y - 2.4);
    ctx.lineTo(x - w, y - h * 0.5);
    ctx.bezierCurveTo(x - w, y - h - 1.2, x + w, y - h - 1.2, x + w, y - h * 0.5);
    ctx.lineTo(x + w, y - 2.4);
    ctx.quadraticCurveTo(x + w, y, x + w - 2.4, y);
    ctx.lineTo(x - w + 2.4, y);
    ctx.quadraticCurveTo(x - w, y, x - w, y - 2.4);
    ctx.closePath();
  }
  function SolePath(x, y, s, o) {
    ctx.beginPath();
    ctx.arc(x, y - 6 * s, 5 * s + o, Math.PI, 0);
    ctx.bezierCurveTo(x + 5 * s + o, y - 1 * s, x + 6.6 * s + o, y + 1 * s, x + 6.6 * s + o, y + 4 * s);
    ctx.arc(x, y + 4 * s, 6.6 * s + o, 0, Math.PI);
    ctx.bezierCurveTo(x - 6.6 * s - o, y + 1 * s, x - 5 * s - o, y - 1 * s, x - 5 * s - o, y - 6 * s);
    ctx.closePath();
  }
  function Shoe(ch, x, y, lift, glow) {
    const s = 1.22 + Math.max(0, lift) * 0.16;
    if (glow) { ctx.globalAlpha *= 0.55; Oval(x, y - 6 * s, 12 * s, 9 * s, '#c084fc'); ctx.globalAlpha /= 0.55; }
    if (lift > 0.45) {
      const cy = y - 2;
      SolePath(x, cy, s, OW); ctx.fillStyle = OUTL; ctx.fill();
      SolePath(x, cy, s, 0); ctx.fillStyle = ch.shoeC[0]; ctx.fill();
      SolePath(x, cy, s, -1.3 * s); ctx.fillStyle = ch.soleC[0]; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.soleC[1];
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x, cy + (1.5 + k * 2.4) * s, 5 * s, 0.7 * s, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(x, cy - 6 * s, 3.4 * s, 2.6 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = ch.shoeA; ctx.beginPath(); ctx.ellipse(x, cy - 9.6 * s, 2.6 * s, 1.3 * s, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      const w = 7 * s, h = 11 * s;
      ShoeHeel(x, y, w + OW, h + OW); ctx.fillStyle = OUTL; ctx.fill();
      ShoeHeel(x, y, w, h); ctx.fillStyle = ch.shoeC[0]; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.shoeC[1]; ctx.beginPath(); ctx.ellipse(x + w * 0.9, y - h * 0.5, w * 0.55, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.soleC[0]; ctx.fillRect(x - w - 1, y - 3.8 * s, 2 * w + 2, 4 * s);
      ctx.fillStyle = ch.soleC[1]; ctx.fillRect(x - w - 1, y - 1.3 * s, 2 * w + 2, 2 * s);
      ctx.fillStyle = ch.shoeA; RR(ctx, x - 3 * s, y - h - 1, 6 * s, h * 0.55, 2.2 * s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - w + 1.5, y - h * 0.62, 1.4, h * 0.3);
      ctx.restore();
    }
  }

  function Hand(ch, x, y, r) {
    Blob(x, y, r, r * 1.05, ch.handC);
  }

  function Leg(ch, L, glow) {
    const ax = L.fx, ay = L.fy - (L.lift > 0.45 ? 10 : 12);
    if (ch.shorts) {
      Limb(L.hx, L.hy, L.kx, L.ky, ax, ay, 6.8, 5.8, 5.2, ch.skinC);
      const mx = L.hx + (L.kx - L.hx) * 0.8, my = L.hy + (L.ky - L.hy) * 0.8;
      ctx.beginPath(); Cap(L.hx, L.hy, 9 + OW, mx, my, 8.4 + OW); ctx.fillStyle = OUTL; ctx.fill();
      ctx.beginPath(); Cap(L.hx, L.hy, 9, mx, my, 8.4); ctx.fillStyle = ch.legC[0]; ctx.fill();
      ctx.beginPath(); Seg(L.hx, L.hy, 9, mx, my, 8.4, 0.44, 0.56); ctx.fillStyle = ch.legC[1]; ctx.fill();
      ctx.beginPath(); Seg(L.hx, L.hy, 9, mx, my, 8.4, -0.5, 0.2); ctx.fillStyle = ch.legC[2]; ctx.fill();
    } else Limb(L.hx, L.hy, L.kx, L.ky, ax, ay, 8, 7, 6.2, ch.legC);
    const r = ch.shorts ? 5.6 : 6.8;
    ctx.beginPath(); Cap(L.kx * 0.22 + ax * 0.78, L.ky * 0.22 + ay * 0.78, r + OW, ax, ay, r + 0.3 + OW); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); Cap(L.kx * 0.22 + ax * 0.78, L.ky * 0.22 + ay * 0.78, r, ax, ay, r + 0.3); ctx.fillStyle = ch.cuff; ctx.fill();
    Shoe(ch, L.fx, L.fy, L.lift, glow);
  }

  function Arm(ch, A, mag) {
    const dx = A.hx - A.ex, dy = A.hy - A.ey, d = Math.hypot(dx, dy) || 1, wx = A.hx - dx / d * 4, wy = A.hy - dy / d * 4, r = 5.3 + Math.max(0, A.back) * 0.7;
    Limb(A.sx, A.sy, A.ex, A.ey, wx, wy, 6.4, 5.4, 4.8, ch.armC);
    if (ch.stripe) { ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(A.ex, A.ey); ctx.lineTo(wx, wy); ctx.lineJoin = 'round'; Line(2.2, ch.stripe); }
    ctx.beginPath(); Cap(wx - dx / d * 2.6, wy - dy / d * 2.6, 5.1 + OW, wx, wy, 5.1 + OW); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); Cap(wx - dx / d * 2.6, wy - dy / d * 2.6, 5.1, wx, wy, 5.1); ctx.fillStyle = ch.rib; ctx.fill();
    Hand(ch, A.hx, A.hy, r);
    if (mag) {
      ctx.save(); ctx.translate(A.hx + 3, A.hy - 5); ctx.rotate(0.4);
      ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI, 0, true);
      Line(8, OUTL); Line(5, '#e53935');
      ctx.fillStyle = OUTL; ctx.fillRect(-9.5, -5, 7, 5.5); ctx.fillRect(2.5, -5, 7, 5.5);
      ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-8.5, -4, 5, 3.5); ctx.fillRect(3.5, -4, 5, 3.5);
      ctx.restore();
    }
  }

  function TorsoPath(sw, ww, top, bot, t) {
    return () => {
      ctx.beginPath();
      ctx.moveTo(-sw + t, top + 7);
      ctx.bezierCurveTo(-sw + t, top - 1, -7 + t, top - 2.5, t, top - 2.5);
      ctx.bezierCurveTo(7 + t, top - 2.5, sw + t, top - 1, sw + t, top + 7);
      ctx.bezierCurveTo(sw + 1.2 + t * 0.5, top + (bot - top) * 0.5, ww + 1, bot - 7, ww, bot);
      ctx.quadraticCurveTo(0, bot + 3, -ww, bot);
      ctx.bezierCurveTo(-ww - 1, bot - 7, -sw - 1.2 + t * 0.5, top + (bot - top) * 0.5, -sw + t, top + 7);
      ctx.closePath();
    };
  }
  function Torso(ch, sw, ww, top, bot) {
    const t = TWS, p = TorsoPath(sw, ww, top + BY, bot + BY, t);
    Ink(p, ch.topC[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = ch.topC[1]; ctx.beginPath(); ctx.ellipse(sw + 2 + t, (top + bot) / 2 + BY + 4, sw * 0.62, (bot - top) * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ch.topC[2]; ctx.beginPath(); ctx.ellipse(-sw * 0.62 + t, top + BY + 3.5, sw * 0.32, 2.6, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ch.rib; ctx.fillRect(-sw - 4, bot + BY - 4.6, 2 * sw + 8, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let x = -ww + 2; x < ww; x += 3) ctx.fillRect(x, bot + BY - 4.2, 1, 6);
    if (ch.studs) {
      for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 3; k++) { Oval(s * (sw - 4 - k * 3.4) + t, top + BY + 2.5 + k * 0.6, 1.3, 1.3, '#d9dde3'); Oval(s * (sw - 4 - k * 3.4) + t - 0.4, top + BY + 2.1 + k * 0.6, 0.5, 0.5, '#ffffff'); }
    }
    if (ch.vest) {
      for (let s = -1; s <= 1; s += 2) {
        ctx.fillStyle = ch.vestC[0]; ctx.beginPath(); ctx.moveTo(s * (sw + 3) + t, top + BY - 2); ctx.lineTo(s * 6 + t, top + BY - 2); ctx.lineTo(s * 8 + t * 0.6, bot + BY - 3); ctx.lineTo(s * (ww + 3), bot + BY - 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = ch.vestC[2]; ctx.fillRect(s * 9 + t * 0.7 - 1, top + BY + 8, 2, bot - top - 14);
      }
      ctx.fillStyle = ch.vestC[1]; ctx.fillRect(-sw - 4, bot + BY - 9, 2 * sw + 8, 5);
    }
    if (ch.num) {
      ctx.font = '900 19px "Arial Black", "Segoe UI Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 4; ctx.strokeStyle = ch.rib; ctx.strokeText(ch.num, t, (top + bot) / 2 + BY + 2);
      ctx.fillStyle = '#ffffff'; ctx.fillText(ch.num, t, (top + bot) / 2 + BY + 2);
      ctx.fillStyle = ch.rib; ctx.fillRect(-sw - 4, top + BY + 1, 2 * sw + 8, 3);
    }
    if (ch.robot) {
      ctx.strokeStyle = ch.topC[1]; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(t, top + BY + 2); ctx.lineTo(t * 0.5, bot + BY - 5); ctx.moveTo(-sw + 2, top + BY + 18); ctx.lineTo(sw - 2, top + BY + 18); ctx.stroke();
      for (const [x, y] of [[-sw + 4, 8], [sw - 4, 8], [-sw + 5, 30], [sw - 5, 30]]) Oval(x + t, top + BY + y, 1.2, 1.2, ch.topC[1]);
    }
    ctx.restore();
    ctx.strokeStyle = OUTL; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-ww + 1, bot + BY - 4.6); ctx.quadraticCurveTo(0, bot + BY - 2, ww - 1, bot + BY - 4.6); ctx.stroke();
  }
  function Collar(ch, top) {
    const t = TWS * 0.9, y = top + BY;
    if (ch.collar === 'hood') {
      Ink(() => {
        ctx.beginPath(); ctx.moveTo(-10 + t, y + 1); ctx.quadraticCurveTo(t, y - 2.5, 10 + t, y + 1);
        ctx.bezierCurveTo(13 + t, y + 9, 7 + t, y + 17, t, y + 17); ctx.bezierCurveTo(-7 + t, y + 17, -13 + t, y + 9, -10 + t, y + 1); ctx.closePath();
      }, ch.topC[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.topC[1]; ctx.beginPath(); ctx.ellipse(8 + t, y + 12, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.topC[2]; ctx.beginPath(); ctx.ellipse(-5 + t, y + 4.5, 4, 2.2, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(t, y + 2); ctx.quadraticCurveTo(t + 0.6, y + 10, t, y + 16.5); Line(1.1, ch.topC[1]);
      ctx.beginPath(); ctx.moveTo(-8 + t, y + 1.4); ctx.quadraticCurveTo(t, y - 1.2, 8 + t, y + 1.4); Line(2.2, ch.rib);
    } else if (ch.collar !== 'robot') {
      Ink(() => {
        ctx.beginPath(); ctx.moveTo(-10.5 + t, y + 1); ctx.quadraticCurveTo(t, y - 4.5, 10.5 + t, y + 1);
        ctx.quadraticCurveTo(11 + t, y + 6, 7 + t, y + 6.5); ctx.quadraticCurveTo(t, y + 4, -7 + t, y + 6.5); ctx.quadraticCurveTo(-11 + t, y + 6, -10.5 + t, y + 1); ctx.closePath();
      }, ch.topC[1]);
      ctx.beginPath(); ctx.moveTo(-8 + t, y + 1.5); ctx.quadraticCurveTo(t, y - 1.8, 8 + t, y + 1.5); Line(1.2, ch.topC[2]);
    }
  }

  function Pack(ch, st) {
    const x = TWS * 1.1, y = -81 + BY * 1.2, c = ch.packC;
    ctx.save(); ctx.translate(x, y); ctx.scale(1.14, 1.12); ctx.translate(-x, -y);
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath(); Cap(x + s * 8.5, y + 4, 2.6 + OW, x + s * 10.5, y - 5.5, 2.4 + OW); ctx.fillStyle = OUTL; ctx.fill();
      ctx.beginPath(); Cap(x + s * 8.5, y + 4, 2.6, x + s * 10.5, y - 5.5, 2.4); ctx.fillStyle = c[1]; ctx.fill();
    }
    PackBody(ch, st, x, y, c);
    ctx.restore();
  }
  function PackBody(ch, st, x, y, c) {
    if (ch.robot) {
      Ink(() => RR(ctx, x - 12, y, 24, 28, 5), c[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = c[1]; ctx.fillRect(x + 5, y, 8, 28);
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        RR(ctx, x - 7, y + 4 + k * 7.6, 14, 5, 2); ctx.fillStyle = '#0f172a'; ctx.fill();
        const on = (st.t * 3 + k) % 3 < 2.2;
        RR(ctx, x - 6, y + 5 + k * 7.6, on ? 12 : 6, 3, 1.5); ctx.fillStyle = on ? ch.packA : Alpha(ch.packA, 0.4); ctx.fill();
      }
      return;
    }
    Ink(() => RR(ctx, x - 12.5, y, 25, 27, 8), c[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(x + 13.5, y + 15, 8.5, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(x - 5.5, y + 3.4, 5.6, 2.2, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(x - 11.9, y + 10); ctx.quadraticCurveTo(x, y + 12.5, x + 11.9, y + 10); Line(1.2, OUTL);
    Ink(() => RR(ctx, x - 8, y + 14, 16, 10, 4.2), c[1]);
    ctx.beginPath(); ctx.moveTo(x - 6, y + 16.8); ctx.lineTo(x + 6, y + 16.8); Line(1, Alpha(ch.packA, 0.9));
    if (ch.deck) {
      ctx.save(); ctx.translate(x, y + 14); ctx.rotate(0.12);
      RR(ctx, -5, -20, 10, 40, 5); ctx.fillStyle = OUTL; ctx.fill();
      RR(ctx, -3.6, -18.6, 7.2, 37.2, 3.6); ctx.fillStyle = ch.deck; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-2.6, -16, 1.6, 30);
      ctx.restore();
    }
    ctx.save(); ctx.translate(x + 6, y + 16.8); ctx.rotate(Math.sin(st.ph) * 0.35);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 2.5); Line(1, OUTL);
    RR(ctx, -2.6, 2.5, 5.2, 6.4, 1.6); ctx.fillStyle = st.tag; ctx.fill(); ctx.lineWidth = 1.1; ctx.strokeStyle = OUTL; ctx.stroke();
    ctx.restore();
  }

  function JetPack(st) {
    const y = -90 + BY;
    for (let s = -1; s <= 1; s += 2) {
      const x = s * 7, fl = 18 + Math.sin(st.t * 47 + s) * 5;
      ctx.save(); ctx.translate(x, y + 35); ctx.scale(1, fl / 16);
      ctx.fillStyle = SPR.gFlame; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, 32, 5, 0); ctx.fill();
      ctx.restore();
      Ink(() => RR(ctx, x - 6, y, 12, 35, 6), SPR.gJet);
      Ink(() => RR(ctx, x - 6, y, 12, 9, 5), '#e53935');
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(x - 3, y + 34, 6, 4);
    }
    ctx.fillStyle = OUTL; ctx.fillRect(-3, y + 6, 6, 21);
    ctx.fillStyle = '#5b616b'; ctx.fillRect(-1.8, y + 7, 3.6, 19);
  }

  function HeadBase(ch, hx, hy, ears) {
    if (ears) for (let s = -1; s <= 1; s += 2) Blob(hx + s * 11.6, hy + 2, 3, 4.2, ch.skinC);
    ctx.beginPath(); ctx.arc(hx, hy, 12.4 + OW, 0, Math.PI * 2); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, 12.4, 0, Math.PI * 2); ctx.fillStyle = ch.hairC[0]; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = ch.hairC[1]; ctx.beginPath(); ctx.arc(hx + 8, hy + 3, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ch.hairC[0]; ctx.beginPath(); ctx.arc(hx - 2, hy - 1, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function Nape(ch, hx, hy) {
    ctx.fillStyle = ch.hairC[1];
    ctx.beginPath(); ctx.moveTo(hx - 7.5, hy + 8.2);
    for (let k = 0; k <= 5; k++) ctx.lineTo(hx - 7.5 + k * 3, hy + (k % 2 ? 11.4 : 9));
    ctx.lineTo(hx + 7.5, hy + 7.4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 4, hy + 2); ctx.quadraticCurveTo(hx - 5, hy + 6, hx - 3, hy + 8); ctx.moveTo(hx + 2, hy + 3); ctx.quadraticCurveTo(hx + 1, hy + 7, hx + 3, hy + 9); Line(1, ch.hairC[1]);
  }

  function Head(ch, st) {
    const hx = TWS * 0.8, hy = -107 + BY, k = ch.head;
    ctx.beginPath(); Cap(hx, hy + 10, 6 + OW, hx, hy + 19, 6.8 + OW); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); Cap(hx, hy + 10, 6, hx, hy + 19, 6.8); ctx.fillStyle = ch.skinC[1]; ctx.fill();
    ctx.save(); ctx.translate(hx, hy); ctx.scale(1.32, 1.3); ctx.translate(-hx, -hy);
    HeadTop(ch, st, hx, hy, k);
    ctx.restore();
  }
  function HeadTop(ch, st, hx, hy, k) {
    if (k === 'robot') {
      for (let s = -1; s <= 1; s += 2) { Blob(hx + s * 12.6, hy + 1, 3.2, 4.6, ch.skinC); Oval(hx + s * 13.3, hy + 1, 1.3, 1.3, ch.shoeA); }
      Ink(() => RR(ctx, hx - 12.5, hy - 12, 25, 24, 10), ch.skinC[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.skinC[1]; ctx.beginPath(); ctx.ellipse(hx + 11, hy + 3, 7.5, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.skinC[2]; ctx.beginPath(); ctx.ellipse(hx - 5.5, hy - 7.5, 4.5, 2.2, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.hairC[1]; ctx.fillRect(hx - 13, hy + 2, 26, 3);
      ctx.restore();
      for (let s = -1; s <= 1; s += 2) Oval(hx + s * 7, hy + 7.5, 1.1, 1.1, ch.hairC[1]);
      ctx.beginPath(); ctx.moveTo(hx, hy - 12); ctx.lineTo(hx + 1.5, hy - 19); Line(3.6, OUTL); Line(1.6, ch.hairC[0]);
      Ball(ctx, hx + 1.5, hy - 20, 3.2, OUTL);
      Ball(ctx, hx + 1.5, hy - 20, 2.1, (st.t * 2 % 1) < 0.6 ? ch.shoeA : Shade(ch.shoeA, -0.4));
      return;
    }
    HeadBase(ch, hx, hy, k !== 'pony');
    if (k === 'cap') {
      Nape(ch, hx, hy);
      Ink(() => { ctx.beginPath(); ctx.moveTo(hx - 13.2, hy + 1.4); ctx.bezierCurveTo(hx - 13.6, hy - 17.5, hx + 13.6, hy - 17.5, hx + 13.2, hy + 1.4); ctx.quadraticCurveTo(hx, hy + 3.2, hx - 13.2, hy + 1.4); ctx.closePath(); }, ch.hatC[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.hatC[1]; ctx.beginPath(); ctx.ellipse(hx + 12, hy - 2, 7, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.hatC[2]; ctx.beginPath(); ctx.ellipse(hx - 5.5, hy - 9.5, 4.2, 2, -0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.hatC[1]; ctx.fillRect(hx - 14, hy - 0.6, 28, 4);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(hx, hy - 12.8); ctx.quadraticCurveTo(hx - 0.5, hy - 8, hx, hy - 5.6); ctx.moveTo(hx - 7.4, hy - 10.4); ctx.quadraticCurveTo(hx - 9.6, hy - 5.5, hx - 9.4, hy - 1); ctx.moveTo(hx + 7.4, hy - 10.4); ctx.quadraticCurveTo(hx + 9.6, hy - 5.5, hx + 9.4, hy - 1); Line(1, ch.hatC[1]);
      ctx.beginPath(); ctx.moveTo(hx - 4.4, hy + 2.6); ctx.bezierCurveTo(hx - 4.4, hy - 4.6, hx + 4.4, hy - 4.6, hx + 4.4, hy + 2.6); ctx.closePath();
      ctx.fillStyle = ch.hairC[1]; ctx.fill(); ctx.lineWidth = 1.1; ctx.strokeStyle = OUTL; ctx.stroke();
      RR(ctx, hx - 5.4, hy - 0.2, 10.8, 2.6, 1.3); ctx.fillStyle = ch.hatC[1]; ctx.fill(); ctx.lineWidth = 0.9; ctx.stroke();
      ctx.fillStyle = '#e5e7eb'; ctx.fillRect(hx + 1, hy + 0.1, 2.2, 2);
      Ball(ctx, hx, hy - 13.8, 2.2, OUTL); Ball(ctx, hx, hy - 13.8, 1.3, ch.hatA);
    } else if (k === 'beanie') {
      Nape(ch, hx, hy);
      Ink(() => { ctx.beginPath(); ctx.moveTo(hx - 13.2, hy + 2); ctx.bezierCurveTo(hx - 14, hy - 19, hx + 14, hy - 19, hx + 13.2, hy + 2); ctx.closePath(); }, ch.hatC[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.hatC[1]; ctx.beginPath(); ctx.ellipse(hx + 12, hy - 3, 7, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = -11; x <= 11; x += 2.75) { ctx.moveTo(hx + x, hy - 3); ctx.quadraticCurveTo(hx + x * 0.7, hy - 10, hx + x * 0.25, hy - 15); } ctx.stroke();
      ctx.restore();
      Ink(() => RR(ctx, hx - 13.8, hy - 3.6, 27.6, 7, 3.4), ch.hatC[1]);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = -12; x < 13; x += 2.6) ctx.fillRect(hx + x, hy - 2.6, 1.1, 5);
      const pb = Math.sin(st.ph * 2) * 1.2;
      Blob(hx + pb * 0.5, hy - 16.5 + pb * 0.3, 4.8, 4.4, ch.pomC);
    } else if (k === 'pony') {
      const sw = Math.sin(st.ph) * 3.2, ty = hy - 2;
      Ink(() => { ctx.beginPath(); ctx.moveTo(hx - 3.2, ty); ctx.bezierCurveTo(hx - 6 + sw * 0.2, ty + 10, hx - 3 + sw, ty + 22, hx + sw * 1.4, ty + 27); ctx.bezierCurveTo(hx + 4 + sw, ty + 20, hx + 5.5 + sw * 0.3, ty + 9, hx + 3.2, ty); ctx.closePath(); }, ch.hairC[0]);
      ctx.save(); ctx.clip(); ctx.fillStyle = ch.hairC[1]; ctx.beginPath(); ctx.ellipse(hx + 4 + sw, ty + 14, 3, 14, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 9); ctx.quadraticCurveTo(hx - 2, hy - 4, hx - 1, hy - 2); ctx.moveTo(hx + 6, hy - 9); ctx.quadraticCurveTo(hx + 2, hy - 4, hx + 1, hy - 2); ctx.moveTo(hx - 9, hy - 4); ctx.quadraticCurveTo(hx - 4, hy - 1, hx - 2.5, hy - 1.2); Line(1, ch.hairC[1]);
      Ink(() => RR(ctx, hx - 4.2, hy - 4.2, 8.4, 4.8, 2.2), ch.hatC[0]);
      ctx.beginPath(); ctx.arc(hx, hy + 1, 14, Math.PI * 1.08, Math.PI * 1.92); Line(5.6, OUTL); Line(2.8, ch.hatC[0]);
      for (let s = -1; s <= 1; s += 2) { Blob(hx + s * 13.4, hy + 2, 4.2, 6, ch.hatC); Oval(hx + s * 14.6, hy + 2, 1.4, 3.2, ch.hatC[1]); }
    } else if (k === 'afro') {
      Nape(ch, hx, hy);
      const P = () => { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 16.2 + (i % 2) * 1.8; ctx.lineTo(hx + Math.cos(a) * r, hy - 3 + Math.sin(a) * r * 0.9); } ctx.closePath(); };
      Ink(P, ch.hairC[0]);
      ctx.save(); P(); ctx.clip();
      ctx.fillStyle = ch.hairC[1]; ctx.beginPath(); ctx.arc(hx + 10, hy + 2, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.hairC[2];
      for (const [x, y] of [[-8, -12], [-2, -16], [-12, -5], [4, -11]]) { ctx.beginPath(); ctx.arc(hx + x, hy + y, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      Ink(() => RR(ctx, hx - 16.5, hy + 2, 33, 5.6, 2.6), ch.hatC[0]);
      ctx.fillStyle = ch.hatC[2]; ctx.fillRect(hx - 13, hy + 3, 10, 1.4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(hx + 4, hy + 2.6, 2, 4.4); ctx.fillRect(hx + 8, hy + 2.6, 2, 4.4);
    } else if (k === 'mohawk') {
      ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 12.4, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = ch.skinC[0]; ctx.fillRect(hx - 13, hy - 13, 26, 26);
      ctx.fillStyle = ch.skinC[1]; ctx.beginPath(); ctx.arc(hx + 8, hy + 3, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,40,0.22)'; ctx.fillRect(hx - 13, hy - 13, 26, 26);
      ctx.fillStyle = ch.hairC[0]; ctx.fillRect(hx - 4, hy - 13, 8, 24);
      ctx.fillStyle = ch.hairC[1]; ctx.fillRect(hx + 1.5, hy - 13, 2.5, 24);
      ctx.restore();
      ctx.beginPath(); ctx.arc(hx, hy, 12.4, 0, Math.PI * 2); Line(OW * 1.1, OUTL);
      Ink(() => {
        ctx.beginPath(); ctx.moveTo(hx - 4, hy - 9);
        const sp = [[-6.5, -21], [-2.5, -14], [-1.5, -26], [1.5, -15], [3.5, -24], [5, -13], [7, -18]];
        for (const [x, y] of sp) ctx.lineTo(hx + x, hy + y + Math.sin(st.ph * 2 + x) * 0.6);
        ctx.lineTo(hx + 4, hy - 9); ctx.closePath();
      }, ch.hairC[0]);
      ctx.fillStyle = ch.hairC[2]; ctx.beginPath(); ctx.moveTo(hx - 1, hy - 10); ctx.lineTo(hx - 1.5, hy - 24); ctx.lineTo(hx + 0.5, hy - 11); ctx.fill();
      for (let s = -1; s <= 1; s += 2) { Blob(hx + s * 11.6, hy + 2, 3, 4.2, ch.skinC); Oval(hx + s * 12.4, hy + 5.6, 1.1, 1.1, '#e5e7eb'); }
    }
  }

  function Skirt(ch) {
    const t = TWS * 0.5, y = -46 + BY, c = ch.skirtC;
    const P = () => { ctx.beginPath(); ctx.moveTo(-16 + t, y); ctx.lineTo(16 + t, y); ctx.lineTo(21, y + 17); ctx.quadraticCurveTo(0, y + 21, -21, y + 17); ctx.closePath(); };
    Ink(P, c[0]);
    ctx.save(); P(); ctx.clip();
    ctx.fillStyle = c[1]; ctx.fillRect(8 + t, y, 16, 24);
    ctx.strokeStyle = c[1]; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = -12; x <= 12; x += 6) { ctx.moveTo(x + t, y + 2); ctx.lineTo(x * 1.3, y + 20); }
    ctx.stroke();
    ctx.fillStyle = c[2]; ctx.fillRect(-16 + t, y + 1, 32, 2);
    ctx.restore();
  }
  function Kid(ch, st) {
    const o = LG[0].lift < LG[1].lift ? 0 : 1;
    for (let i = 0; i < 2; i++) if (AR[i].back < 0) Arm(ch, AR[i], i && st.magnet);
    for (let j = 0; j < 2; j++) Leg(ch, LG[j ? 1 - o : o], st.sneak);
    if (ch.skirt) Skirt(ch);
    Torso(ch, 19, 16, -86, -40);
    if (st.jet) JetPack(st); else if (!ch.nopack) Pack(ch, st);
    Collar(ch, -86);
    for (let i = 0; i < 2; i++) if (AR[i].back >= 0) Arm(ch, AR[i], i && st.magnet);
    Head(ch, st);
  }

  function Tuck(ch, st, u) {
    const k = Smooth(u / 0.09);
    ctx.save(); ctx.scale(1.24, 1.24); ctx.scale(1 - (1 - k) * 0.2, 1 + (1 - k) * 0.55); ctx.rotate(Math.sin(st.t * 24) * 0.05);
    for (let s = -1; s <= 1; s += 2) Shoe(ch, s * 10, -0.5, -0.3, st.sneak);
    for (let s = -1; s <= 1; s += 2) Limb(s * 6.5, -27, s * 13, -19, s * 10, -10, 7.2, 6.4, 5.6, ch.legC);
    Ink(() => { ctx.beginPath(); ctx.ellipse(0, -32, 19.5, 16, 0, 0, Math.PI * 2); }, ch.topC[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = ch.topC[1]; ctx.beginPath(); ctx.ellipse(16, -27, 11, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ch.topC[2]; ctx.beginPath(); ctx.ellipse(-9, -44, 6, 2.4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ch.rib; ctx.fillRect(-22, -20.5, 44, 6);
    const ry = (st.t * 3.4 % 1) * 40 - 52;
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-22, ry, 44, 3.5);
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(-22, ry + 16, 44, 5);
    if (ch.num) {
      ctx.font = '900 14px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff'; ctx.fillText(ch.num, 0, -32);
    }
    ctx.restore();
    if (st.jet) JetPack(st);
    else if (ch.robot) {
      Ink(() => RR(ctx, -11, -45, 22, 20, 5), ch.packC[0]);
      for (let i = 0; i < 2; i++) { RR(ctx, -6.5, -41 + i * 7.5, 13, 4.4, 2); ctx.fillStyle = ch.packA; ctx.fill(); }
    } else if (!ch.nopack) {
      Ink(() => RR(ctx, -12, -46, 24, 21, 7.5), ch.packC[0]);
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.packC[1]; ctx.beginPath(); ctx.ellipse(13, -33, 8, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ch.packC[2]; ctx.beginPath(); ctx.ellipse(-5, -43, 5, 2, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      Ink(() => RR(ctx, -7.5, -36, 15, 8.5, 3.8), ch.packC[1]);
    }
    const hc = ch.hatC && ch.head !== 'pony' && ch.head !== 'afro' ? ch.hatC : ch.head === 'robot' ? ch.skinC : ch.hairC;
    Ink(() => { ctx.beginPath(); ctx.ellipse(0, -47.5, 11.5, 6.5, 0, Math.PI, 0); ctx.closePath(); }, hc[0]);
    if (ch.head === 'mohawk') Ink(() => { ctx.beginPath(); ctx.moveTo(-3, -53); ctx.lineTo(-1, -62); ctx.lineTo(1.5, -55); ctx.lineTo(3.5, -60); ctx.lineTo(4, -53); ctx.closePath(); }, ch.hairC[0]);
    for (let s = -1; s <= 1; s += 2) {
      const A = AR[0];
      A.sx = s * 15; A.sy = -41; A.ex = s * 21; A.ey = -31; A.hx = s * 15.5; A.hy = -21.5; A.back = 0.5;
      Arm(ch, A, false);
    }
    ctx.restore();
    ctx.globalAlpha *= 0.55;
    for (let j = 0; j < 2; j++) {
      const a0 = st.t * 13 + j * Math.PI;
      ctx.beginPath(); ctx.arc(0, -27, 31, a0, a0 + 1.1); Line(2.4, '#ffffff');
    }
    ctx.globalAlpha /= 0.55;
  }

  function Deck(t) {
    const hov = Math.sin(t * 6) * 1.5;
    ctx.save(); ctx.translate(0, 9 + hov); ctx.scale(1, 0.3);
    ctx.fillStyle = SPR.deckGlow; ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.drawImage(SPR.deck, -38, -10 + hov, 76, 24);
  }

  function Boot(x, y, lift) {
    const s = 1.15 + Math.max(0, lift) * 0.14;
    if (lift > 0.45) {
      const w = 7.2 * s, h = 9.6 * s, cy = y - 2;
      RR(ctx, x - w - OW, cy - h - OW, 2 * (w + OW), 2 * (h + OW), w + OW); ctx.fillStyle = OUTL; ctx.fill();
      RR(ctx, x - w, cy - h, 2 * w, 2 * h, w); ctx.fillStyle = '#26262d'; ctx.fill();
      RR(ctx, x - w + 1.6 * s, cy - h + 1.6 * s, 2 * w - 3.2 * s, 2 * h - 3.2 * s, w - 1.6 * s); ctx.fillStyle = '#3d3d47'; ctx.fill();
      ctx.fillStyle = '#26262d'; for (let k = 0; k < 4; k++) ctx.fillRect(x - w + 2.8 * s, cy - h * 0.1 + k * 2.4 * s, 2 * w - 5.6 * s, 1.2 * s);
    } else {
      const w = 7.8 * s, h = 11.5 * s;
      ShoeHeel(x, y, w + OW, h + OW); ctx.fillStyle = OUTL; ctx.fill();
      ShoeHeel(x, y, w, h); ctx.fillStyle = '#26262d'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#17171c'; ctx.beginPath(); ctx.ellipse(x + w * 0.9, y - h * 0.5, w * 0.55, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3d3d47'; ctx.fillRect(x - w - 1, y - 3.6 * s, 2 * w + 2, 3.6 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - w + 1.6, y - h * 0.7, 1.6, h * 0.32);
      ctx.restore();
    }
  }

  function Inspector(st, stand) {
    if (stand) StandPose(st.t); else RunPose(st.ph * 0.82 + 1.4);
    const o = LG[0].lift < LG[1].lift ? 0 : 1, C = INS;
    for (let i = 0; i < 2; i++) { const L = LG[i]; L.hx *= 1.3; L.kx *= 1.32; L.fx *= 1.3; L.hy -= 2; }
    const A = AR[1], B = AR[0];
    A.sx = 21 + TWS; A.sy = -88 + BY; A.ex = 28; A.ey = -104 + BY; A.hx = 25; A.hy = -121 + BY + Math.sin(st.t * 22) * 4; A.back = 1;
    B.sx = -21 + TWS; B.sy = -88 + BY; B.ex *= 1.32; B.hx *= 1.28; B.ey -= 1; B.hy -= 1;
    if (B.back < 0) Arm(C, B, false);
    for (let j = 0; j < 2; j++) {
      const L = LG[j ? 1 - o : o], ax = L.fx, ay = L.fy - (L.lift > 0.45 ? 9 : 11);
      Limb(L.hx, L.hy, L.kx, L.ky, ax, ay, 8, 7, 6.2, C.legC);
      Boot(L.fx, L.fy, L.lift);
    }
    const t = TWS, top = -93 + BY, bot = -44 + BY;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-22 + t, top + 8);
      ctx.bezierCurveTo(-22 + t, top - 1, -8 + t, top - 3, t, top - 3);
      ctx.bezierCurveTo(8 + t, top - 3, 22 + t, top - 1, 22 + t, top + 8);
      ctx.bezierCurveTo(25 + t * 0.5, top + 26, 23.5, bot - 6, 20.5, bot);
      ctx.quadraticCurveTo(0, bot + 3, -20.5, bot);
      ctx.bezierCurveTo(-23.5, bot - 6, -25 + t * 0.5, top + 26, -22 + t, top + 8);
      ctx.closePath();
    };
    Ink(path, C.coatC[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.coatC[1]; ctx.beginPath(); ctx.ellipse(24 + t, top + 30, 15, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.coatC[2]; ctx.beginPath(); ctx.ellipse(-13 + t, top + 3.5, 7, 2.8, -0.2, 0, Math.PI * 2); ctx.fill();
    for (const y of [top + 24, top + 33]) {
      ctx.fillStyle = '#f5c518'; ctx.fillRect(-30, y, 60, 5);
      ctx.fillStyle = '#e8ecf1'; ctx.fillRect(-30, y + 1.6, 60, 1.8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(10 + t, y, 20, 5);
    }
    ctx.fillStyle = '#121a33'; ctx.fillRect(-30, bot - 7, 60, 6);
    ctx.fillStyle = '#2d3a63'; for (const x of [-14, 0, 14]) ctx.fillRect(x - 1.5 + t * 0.3, bot - 8, 3, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(t * 0.6 - 0.6, top + 2, 1.2, bot - top - 9);
    ctx.restore();
    if (B.back >= 0) Arm(C, B, false);
    Arm(C, A, false);
    const hx = t * 0.8, hy = -106 + BY;
    ctx.beginPath(); Cap(hx, hy + 8, 7.5 + OW, hx, hy + 16, 8.5 + OW); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); Cap(hx, hy + 8, 7.5, hx, hy + 16, 8.5); ctx.fillStyle = C.skinC[1]; ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 5, hy + 12); ctx.quadraticCurveTo(hx, hy + 14, hx + 5, hy + 12); Line(1, OUTL);
    for (let s = -1; s <= 1; s += 2) Blob(hx + s * 13, hy + 2, 3.8, 5.4, C.skinC);
    ctx.beginPath(); ctx.arc(hx, hy, 13.2 + OW, 0, Math.PI * 2); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, 13.2, 0, Math.PI * 2); ctx.fillStyle = C.skinC[0]; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.hairC[0]; ctx.beginPath(); ctx.moveTo(hx - 15, hy - 6); ctx.lineTo(hx + 15, hy - 6); ctx.lineTo(hx + 15, hy + 6);
    for (let k = 0; k <= 6; k++) ctx.lineTo(hx + 12 - k * 4, hy + (k % 2 ? 11.5 : 9.5));
    ctx.lineTo(hx - 15, hy + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.hairC[1]; ctx.beginPath(); ctx.arc(hx + 10, hy + 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.hairC[2]; ctx.beginPath(); ctx.ellipse(hx - 6, hy - 1, 4, 1.6, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(hx - 5, hy + 1); ctx.quadraticCurveTo(hx - 6, hy + 5, hx - 4, hy + 8); ctx.moveTo(hx + 3, hy + 2); ctx.quadraticCurveTo(hx + 2, hy + 6, hx + 4, hy + 9); Line(1, C.hairC[1]);
    Ink(() => { ctx.beginPath(); ctx.moveTo(hx - 14.5, hy - 2); ctx.lineTo(hx - 15, hy - 11); ctx.lineTo(hx + 15, hy - 11); ctx.lineTo(hx + 14.5, hy - 2); ctx.quadraticCurveTo(hx, hy + 0.5, hx - 14.5, hy - 2); ctx.closePath(); }, C.capC[0]);
    ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.moveTo(hx - 14.6, hy - 7.2); ctx.lineTo(hx + 14.6, hy - 7.2); ctx.lineTo(hx + 14.5, hy - 4.6); ctx.lineTo(hx - 14.5, hy - 4.6); ctx.fill();
    ctx.fillStyle = C.capC[1]; ctx.fillRect(hx + 7, hy - 10.6, 7.6, 8.4);
    Ink(() => { ctx.beginPath(); ctx.ellipse(hx, hy - 12, 18.5, 6.8, 0, 0, Math.PI * 2); }, C.capC[0]);
    ctx.fillStyle = C.capC[2]; ctx.beginPath(); ctx.ellipse(hx - 4, hy - 13.6, 9, 3, -0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.capC[1]; ctx.beginPath(); ctx.ellipse(hx + 9, hy - 11, 7.5, 3.6, 0.2, 0, Math.PI * 2); ctx.fill();
  }

  function Dog(st) {
    const g = st.ph * 1.15 + 0.6, up = Math.max(0, Math.sin(g)), dn = Math.max(0, -Math.sin(g)), bob = -Math.abs(Math.sin(g)) * 3, C = DOG;
    ctx.save(); ctx.translate(0, bob);
    const fl = Math.sin(g) * 0.5, ex = Math.sin(g * 2) * 0.12, hy = -58 + Math.sin(g) * 1.2;
    for (let s = -1; s <= 1; s += 2) {
      const lf = s < 0 ? dn : up;
      Limb(s * 5.2, -34, s * 5.4, -18 + lf * 2, s * 5.2, -6 - lf * 7, 3.4, 3, 2.8, C.furC);
      Blob(s * 5.2, -4 - lf * 7, 3.4, 2.4, C.pawC);
    }
    for (let s = -1; s <= 1; s += 2) Blob(s * 8.8, hy + 3, 3.4, 7.8, C.earC, s * (0.45 + fl * 0.25 + ex));
    ctx.beginPath(); ctx.arc(0, hy, 9.4 + OW, 0, Math.PI * 2); ctx.fillStyle = OUTL; ctx.fill();
    ctx.beginPath(); ctx.arc(0, hy, 9.4, 0, Math.PI * 2); ctx.fillStyle = C.furC[0]; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.furC[1]; ctx.beginPath(); ctx.arc(6.5, hy + 3, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.darkC[0]; ctx.beginPath(); ctx.ellipse(0, hy - 7, 7.5, 4.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    RR(ctx, -8.5, hy + 6.5, 17, 4.4, 2.2); ctx.fillStyle = '#e53935'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = OUTL; ctx.stroke();
    const back = () => { ctx.beginPath(); ctx.ellipse(0, -41, 10.5, 10.5, 0, 0, Math.PI * 2); };
    Ink(back, C.furC[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.furC[1]; ctx.beginPath(); ctx.ellipse(8, -40, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.darkC[0]; ctx.beginPath(); ctx.ellipse(0, -46, 6.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const body = () => { ctx.beginPath(); ctx.ellipse(0, -27, 15, 13, 0, 0, Math.PI * 2); };
    Ink(body, C.furC[0]);
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.furC[1]; ctx.beginPath(); ctx.ellipse(12, -23, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.darkC[0]; ctx.beginPath(); ctx.ellipse(0, -40, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.pawC[0]; ctx.beginPath(); ctx.ellipse(0, -16, 6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    for (let s = -1; s <= 1; s += 2) {
      const lf = up * 0.9 + 0.1 * dn;
      Blob(s * 10, -24 + lf * 1.5, 6.2, 9.4, C.furC, s * 0.12);
      Limb(s * 9.8, -18 + lf, s * (10.2 + lf), -10 - lf * 4, s * 9.6, -4 - lf * 8, 3.9, 3.3, 3, C.furC);
      Blob(s * 9.6, -2.6 - lf * 8, 4, 2.7 + lf, C.pawC);
    }
    const tw = Math.sin(st.t * 16) * 4;
    ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(1 + tw * 0.3, -43, 4 + tw, -49);
    Line(3.4 + OW * 2, OUTL); Line(3.4, C.furC[0]);
    ctx.beginPath(); ctx.moveTo(3 + tw * 0.85, -46.6); ctx.lineTo(4 + tw, -49); Line(3.4, C.pawC[0]);
    ctx.restore();
  }

  function StateOf(p) {
    ST.sneak = p.sneak > 0; ST.magnet = p.magnet > 0; ST.jet = p.jet > 0 || p.jetFall; ST.crash = p.status === 'crash';
    ST.t = p.t; ST.ph = p.phase; ST.tag = p.tagCol;
    return ST;
  }

  function DrawRunner() {
    const p = GS;
    if (!Proj(p.x, p.surf, p.dist)) return;
    const air = Math.max(0, p.y - p.surf), sh = Math.max(0, 1 - air / 6);
    ctx.globalAlpha = 0.34 * sh; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.5 * PK * (0.6 + 0.4 * sh), 0.14 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = p.invT > 0 && (p.invT * 14 | 0) % 2 ? 0.35 : 1;
    Proj(p.x, p.y, p.dist);
    const sc = PK * 0.017, st = StateOf(p), crash = st.crash;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(sc, sc);
    let rot = p.lean;
    if (p.wobT > 0) rot += Math.sin(p.wobT * 40) * 0.18 * p.wobT * 2;
    if (crash && p.crashKind === 'crash') rot = -0.35 * Math.min(1, p.crashT * 4);
    ctx.rotate(rot);
    if (p.board > 0 && !st.jet && !crash) Deck(p.t);
    if (p.rollT > 0 && !crash) {
      if (!p.ground && p.vy < -6) {
        ctx.globalAlpha *= 0.5;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 12, -64 - Math.abs(k) * 4); ctx.lineTo(k * 12, -94 - (k ? 0 : 14)); Line(2.4, '#ffffff'); }
        ctx.globalAlpha *= 2;
      }
      Tuck(CH, st, p.rollE);
    } else {
      if (st.jet) JetPose(p.t);
      else if (p.status === 'start') StandPose(p.t);
      else if (crash) CrashPose(p.t);
      else if (p.board > 0 && p.ground) BoardPose(p.t);
      else if (!p.ground) JumpPose(p.vy);
      else RunPose(p.phase);
      if (p.wobT > 0) for (let i = 0; i < 2; i++) { AR[i].hy -= 20 * p.wobT; AR[i].hx *= 1.3; }
      Kid(CH, st);
      if (crash && p.crashKind === 'crash') {
        for (let k = 0; k < 3; k++) {
          const a = p.t * 6 + k * 2.1, sx = Math.cos(a) * 17, sy = -128 + Math.sin(a) * 4;
          ctx.beginPath();
          for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.2 : 5, b = j * Math.PI / 5 + p.t * 3; ctx.lineTo(sx + Math.cos(b) * r, sy + Math.sin(b) * r); }
          ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function DrawInspector() {
    const p = GS, z = p.dist + p.insZ;
    if (p.insZ < -9.5 || !Proj(p.insX, p.insY, z)) return;
    const sc = PK * 0.017;
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.6 * PK, 0.16 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(sc, sc);
    Inspector(StateOf(p), p.status === 'start');
    ctx.restore();
  }

  function DrawDog() {
    const p = GS, z = p.dist + p.insZ + 1.6;
    if (p.insZ < -9.5 || !Proj(p.insX + 1.4, p.dogY, z)) return;
    const sc = PK * 0.017;
    ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(PX, PY, 0.32 * PK, 0.1 * PK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(sc, sc);
    Dog(StateOf(p));
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

  function Lat(t) { return Math.abs(t.x - camX); }
  function Solid(e) { return e.t === 1 || (e.t === 2 && e.o.L > 0); }
  function TrainOrder() {
    for (let pass = 0, sw = 1; sw && pass < 8; pass++) {
      sw = 0;
      for (let i = 0; i < LOW.length; i++) {
        const a = LOW[i];
        if (!Solid(a)) continue;
        const ta = a.o, a0 = ta.z - (ta.ramp ? RAMP : 0), a1 = ta.z + ta.L;
        for (let j = i + 1; j < LOW.length; j++) {
          const b = LOW[j];
          if (!Solid(b)) continue;
          const tb = b.o;
          if (Math.abs(ta.x - tb.x) < 0.1 || tb.z - (tb.ramp ? RAMP : 0) > a1 || tb.z + tb.L < a0 || Lat(tb) <= Lat(ta) + 0.1) continue;
          if (a.t === 1 && b.t === 1) { LOW[i] = b; LOW[j] = a; }
          else { for (let k = j; k > i; k--) LOW[k] = LOW[k - 1]; LOW[i] = b; }
          sw = 1;
          break;
        }
        if (sw) break;
      }
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
    for (let i = 0; i < p.B.length; i++) { const b = p.B[i]; if (!b.dead && b.z < zf && b.z > zn) Add(LOW, p.bar === b ? Math.max(b.z + b.L, P + 0.02) : b.z + b.L, 2, b); }
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
    for (let i = Math.floor(zf / 30); i * 30 > zn; i--) if (!BridgeAt(i * 30, 3, 8)) Add(LOW, i * 30, 8, null);
    for (let i = Math.floor((zf - 90) / 230); i > 0 && BridgeZ(i) + 5 > zn; i--) if (Hash(i * 9.1) < 0.65) Add(LOW, BridgeZ(i), 9, null);
    Add(p.y > WIRE_Y - 0.3 ? HIGH : LOW, P, 5, null);
    if (p.insZ > -9.5) { Add(LOW, P + p.insZ, 6, null); Add(LOW, P + p.insZ + 1.6, 7, null); }
    LOW.sort(ByK); HIGH.sort(ByK);
    TrainOrder();
    for (let i = 0; i < LOW.length; i++) DrawEntry(LOW[i]);
    DrawWires();
    for (let i = 0; i < HIGH.length; i++) DrawEntry(HIGH[i]);
  }

  function DrawParts() {
    for (let pass = 0; pass < 2; pass++) {
      if (pass) ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < PARTS.length; i++) {
        const q = PARTS[i];
        if (!q.on || q.add !== pass || q.s <= 0.5) continue;
        const u = q.age / q.life, img = q.img, w = q.s, h = w * img.height / img.width;
        ctx.globalAlpha = u < 0.7 ? 1 : (1 - u) / 0.3;
        if (q.rot) {
          const c = Math.cos(q.rot) * DPR, sn = Math.sin(q.rot) * DPR;
          ctx.setTransform(c, sn, -sn, c, DPR * (q.x + SHX), DPR * (q.y + SHY));
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.setTransform(DPR, 0, 0, DPR, DPR * SHX, DPR * SHY);
          ctx.drawImage(img, q.x - w / 2, q.y - h / 2, w, h);
        }
      }
    }
    ctx.setTransform(DPR, 0, 0, DPR, DPR * SHX, DPR * SHY);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const TXT = {};
  function HudText(t, x, y, size, fill, align) {
    ctx.font = `900 ${size}px "Arial Black", "Segoe UI Black", system-ui, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22; ctx.strokeStyle = 'rgba(15,12,30,0.85)'; ctx.strokeText(t, x, y);
    ctx.fillStyle = fill; ctx.fillText(t, x, y);
  }

  function HudCv(w, h, fn) { const c = Cv(w * 2, h * 2), g = c.getContext('2d'); g.scale(2, 2); fn(g, w, h); return c; }
  function Glass(g, x, y, w, h, r, top, bot, edge) {
    RR(g, x, y + 2.5, w, h, r); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
    RR(g, x, y, w, h, r); g.fillStyle = Lin(g, 0, y, 0, y + h, [0, top, 1, bot]); g.fill();
    g.lineWidth = 2; g.strokeStyle = '#120e24'; g.stroke();
    RR(g, x + 2.2, y + 2.2, w - 4.4, h - 4.4, r - 2); g.lineWidth = 1.2; g.strokeStyle = edge; g.stroke();
    g.save(); RR(g, x + 2.2, y + 2.2, w - 4.4, h * 0.42, r - 2); g.clip(); g.fillStyle = 'rgba(255,255,255,0.13)'; g.fillRect(x, y, w, h); g.restore();
  }
  function Medal(g, c, w, h) {
    const P = () => {
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + k * Math.PI / 8, r = k % 2 ? 19.5 : 23; g.lineTo(w / 2 + Math.cos(a) * r * 1.22, h / 2 + Math.sin(a) * r); }
      g.closePath();
    };
    g.save(); g.translate(0, 2.5); P(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill(); g.restore();
    P(); g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = '#120e24'; g.stroke();
    g.fillStyle = Lin(g, 0, 0, 0, h, [0, c[0], 0.45, c[1], 1, c[2]]); g.fill();
    g.save(); P(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.62, 0); g.lineTo(w * 0.3, h); g.lineTo(0, h); g.fill();
    g.restore();
    g.beginPath(); g.ellipse(w / 2, h / 2, 21, 15.5, 0, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
  }
  function MakeHud() {
    const H = {};
    H.score = HudCv(180, 44, g => Glass(g, 1, 1, 178, 40, 14, 'rgba(52,42,104,0.88)', 'rgba(18,14,40,0.88)', 'rgba(255,255,255,0.3)'));
    H.coin = HudCv(124, 34, g => Glass(g, 1, 1, 122, 30, 12, 'rgba(110,74,8,0.86)', 'rgba(44,28,4,0.86)', 'rgba(255,220,120,0.45)'));
    H.badge = [['#ede9fe', '#8b5cf6', '#3b1782'], ['#fff7c2', '#facc15', '#c2410c'], ['#fdf4ff', '#e879f9', '#7e1a86']].map(c => HudCv(66, 50, (g, w, h) => Medal(g, c, w, h)));
    H.gauge = HudCv(52, 52, g => {
      Ball(g, 26, 28.5, 24, 'rgba(0,0,0,0.3)'); Ball(g, 26, 26, 24, '#120e24');
      Ball(g, 26, 26, 22.4, Lin(g, 0, 4, 0, 48, [0, 'rgba(66,54,124,0.94)', 1, 'rgba(20,16,44,0.94)']));
      g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(26, 26, 19.5, 0, Math.PI * 2); g.stroke();
    });
    H.toast = HudCv(380, 58, g => Glass(g, 1, 1, 378, 54, 16, 'rgba(26,112,58,0.94)', 'rgba(8,50,26,0.94)', 'rgba(187,247,208,0.6)'));
    H.check = HudCv(40, 40, g => {
      Ball(g, 20, 20, 17.5, '#120e24'); Ball(g, 20, 20, 15.5, Rad(g, 15, 13, 22, [0, '#dcfce7', 0.45, '#4ade80', 1, '#15803d']));
      g.strokeStyle = '#ffffff'; g.lineWidth = 4.2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(12, 20.5); g.lineTo(18, 26.5); g.lineTo(28.5, 13.5); g.stroke();
    });
    H.big = HudCv(460, 112, (g, w) => {
      for (const s of [-1, 1]) {
        const x = s < 0 ? 4 : w - 4;
        g.beginPath(); g.moveTo(x, 40); g.lineTo(x + s * -58, 40); g.lineTo(x + s * -58, 94); g.lineTo(x, 94); g.lineTo(x + s * -18, 67); g.closePath();
        g.fillStyle = '#9a3412'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#120e24'; g.stroke();
      }
      Glass(g, 40, 18, w - 80, 70, 20, 'rgba(253,224,71,0.98)', 'rgba(217,119,6,0.98)', 'rgba(255,251,214,0.8)');
      Stripes(g, 50, 24, w - 100, 58, 16, 'rgba(255,255,255,0.08)', 0.6);
    });
    H.hb = HudCv(98, 54, g => Glass(g, 1, 1, 96, 50, 16, 'rgba(14,116,144,0.82)', 'rgba(8,40,60,0.82)', 'rgba(165,243,252,0.5)'));
    return H;
  }

  function FitFont(t, max, w) {
    ctx.font = `900 ${max}px "Arial Black", "Segoe UI Black", system-ui, sans-serif`;
    return Math.min(max, max * w / Math.max(1, ctx.measureText(t).width));
  }

  function DrawToast() {
    const p = GS, T = p.toast, H = SPR.hud;
    if (!T) return;
    const dur = T.big ? 3.2 : 2.6, e = dur - p.toastT, u = Smooth(e * 4), a = Math.min(1, p.toastT * 3);
    if (!T.fs) { T.fs = FitFont(T.b, T.big ? 28 : 16, T.big ? 330 : 300); T.fa = FitFont(T.a, T.big ? 34 : 13, T.big ? 340 : 300); }
    ctx.globalAlpha = a;
    if (!T.big) {
      const x = CX - 190, y = 92 - (1 - u) * 26;
      ctx.drawImage(H.toast, x, y, 380, 58);
      const ck = 1 + Math.max(0, 0.25 - e) * 3;
      ctx.drawImage(H.check, x + 28 - 20 * ck, y + 29 - 20 * ck, 40 * ck, 40 * ck);
      HudText(T.a, x + 56, y + 19, T.fa, '#bbf7d0', 'left');
      HudText(T.b, x + 56, y + 38, T.fs, '#ffffff', 'left');
    } else {
      const sc = 0.6 + 0.4 * u + Math.max(0, Math.sin(Math.min(1, e * 2.5) * Math.PI)) * 0.08, y = 168;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.55;
      const gw = 520 * sc;
      ctx.drawImage(SPR.fx.Glow('#facc15'), CX - gw / 2, y - gw * 0.22, gw, gw * 0.44);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      ctx.drawImage(H.big, CX - 230 * sc, y - 56 * sc, 460 * sc, 112 * sc);
      HudText(T.a, CX, y - 14 * sc, T.fa * sc, '#ffffff', 'center');
      HudText(T.b, CX, y + 16 * sc, T.fs * sc * 0.75, '#fff7c2', 'center');
      HudText(T.c, CX, y + 56 * sc, 14, '#fde68a', 'center');
    }
    ctx.globalAlpha = 1;
  }

  function DrawHUD() {
    const p = GS, H = SPR.hud;
    if (p.status !== 'playing' && p.status !== 'crash') return;
    const R = CV_W - 12;
    ctx.drawImage(H.score, R - 180, 10, 180, 44);
    HudText(String(Math.floor(p.score)), R - 14, 32.5, 25, '#ffffff', 'right');
    const bi = p.double > 0 ? 1 : p.boost > 0 ? 2 : 0, hot = p.double > 0 || p.multT > 0;
    let sc = p.multT > 0 ? 1 + Math.sin(p.multT / 1.2 * Math.PI) * 0.4 : 1;
    if (p.double > 0) sc *= 1 + Math.sin(p.t * 9) * 0.05;
    const bx = R - 180 - 38, by = 32, bw = 66 * sc, bh = 50 * sc;
    if (hot) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6;
      ctx.drawImage(SPR.fx.Glow(p.double > 0 ? '#facc15' : '#a78bfa'), bx - bw, by - bh, bw * 2, bh * 2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    ctx.drawImage(H.badge[bi], bx - bw / 2, by - bh / 2, bw, bh);
    HudText(`x${p.mult}`, bx, by + 1.5, (p.mult > 99 ? 15 : p.mult > 9 ? 18 : 21) * sc, '#ffffff', 'center');
    if (p.boost > 0) ctx.drawImage(SPR.icons.boost, bx + 12, by - 30, 26, 26);
    ctx.drawImage(H.coin, R - 124, 58, 124, 34);
    ctx.drawImage(SPR.coins, ((p.t * 12) | 0) % 16 * 64, 0, 64, 64, R - 118, 61, 28, 28);
    HudText(String(p.coins), R - 14, 75.5, 19, '#ffd84a', 'right');
    let x = 10;
    for (let i = 0; i < HUD_PU.length; i++) {
      const k = HUD_PU[i];
      if (p[k] <= 0) continue;
      const f = p[k] / p.dur[k], blink = p[k] < 2 && (p.t * 8 | 0) % 2;
      ctx.drawImage(H.gauge, x, 10, 52, 52);
      ctx.globalAlpha = blink ? 0.45 : 1;
      ctx.drawImage(SPR.icons[k], x + 3, 13, 46, 46);
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x + 26, 36, 21.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      ctx.lineCap = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = '#120e24'; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = PU_COL[k]; ctx.stroke();
      x += 58;
    }
    const nb = (p.boardAvail ? 1 : 0) + SAVE.hb;
    if (nb && p.board <= 0 && p.status === 'playing') {
      const y = CV_H - 62;
      ctx.drawImage(H.hb, 8, y, 98, 54);
      ctx.drawImage(SPR.icons.board, 10, y + 1, 52, 52);
      RR(ctx, 62, y + 15, 24, 22, 6); ctx.fillStyle = 'rgba(15,12,30,0.75)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      HudText('H', 74, y + 26.5, 13, '#ffffff', 'center');
      if (nb > 1) HudText(`x${nb}`, 110, y + 26.5, 15, '#a5f3fc', 'left');
    }
    if (p.popT > 0) {
      const a = Math.min(1, p.popT * 2), s = 1 + Math.max(0, p.popT - 1.3) * 1.5;
      ctx.globalAlpha = a;
      HudText(TXT[p.popup] || '', CX, p.toast ? 182 : 112, 26 * s, PU_COL[p.popup] || '#fff', 'center');
      ctx.globalAlpha = 1;
    }
    DrawToast();
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
    DrawFog();
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

  const SCREENS = ['gf-ss-start', 'gf-ss-pause', 'gf-ss-gameover', 'gf-ss-shop'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function BankRun() {
    if (!GS || GS.banked) return;
    GS.banked = true;
    SAVE.bank += GS.coins; SaveData();
    SetText('gf-ss-bank', SAVE.bank);
  }
  function Prime() { BankRun(); GS = NewGame(); while (GS.gen.z < 200) GenRow(); }

  function ShowStart() {
    StopLoop();
    SHOP.open = false;
    Prime();
    SetText('gf-ss-best', LoadBest());
    SetText('gf-ss-bank', SAVE.bank);
    Draw();
    RenderMeta();
    ShowScreen('gf-ss-start');
  }

  function DoStart() {
    StopLoop();
    SHOP.open = false;
    if (!GS || GS.status !== 'start') Prime();
    GS.status = 'playing'; GS.insT = 2.6; GS.dur = Durs(); GS.base = BaseMult();
    if (SAVE.sbOn && SAVE.sb > 0) { SAVE.sb--; SaveData(); GS.boost = BOOST; GS.popup = 'boost'; GS.popT = 1.8; GS.multT = 1.2; }
    SetText('gf-ss-best', LoadBest());
    ShowScreen(null);
    StartLoop();
  }

  function Esc(t) { return String(t).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`); }
  function MisHTML() {
    const M = SAVE.ms, max = MisMax(), m = BaseMult();
    let h = `<div class="gf-ss-mis-hd"><span class="gf-ss-medal">x${m}</span><div class="gf-ss-mis-ht"><b>${_GameText('ss_missions')}</b>`
      + `<small>${max ? _GameText('ss_mis_max').replace('{n}', MULT_MAX) : _GameText('ss_mis_next').replace('{s}', M.lv + 1).replace('{n}', m + 1)}</small></div></div>`;
    if (max) return h;
    for (let i = 0; i < 3; i++) {
      const q = MIS[i], v = Math.min(q.n, M.p[i]), done = v >= q.n;
      h += `<div class="gf-ss-mis-row${done ? ' done' : ''}"><i class="gf-ss-mis-ck">${done ? '' : i + 1}</i><div class="gf-ss-mis-tx"><span>${Esc(MisText(q))}</span>`
        + `<div class="gf-ss-mis-bar"><i style="width:${(v / q.n * 100).toFixed(1)}%"></i></div></div><em>${v}/${q.n}</em></div>`;
    }
    return h + `<div class="gf-ss-mis-rw">${_GameText('ss_mis_reward').replace('{c}', SetReward())}</div>`;
  }
  function BoostHTML() {
    const n = SAVE.sb, on = SAVE.sbOn && n > 0;
    return `<i class="gf-ss-boost-ic"></i><span class="gf-ss-boost-tx"><b>${_GameText('ss_boost')} +${BOOST}</b><small>${n ? `${_GameText('ss_boost_have').replace('{n}', n)} · ${_GameText(on ? 'ss_boost_on' : 'ss_boost_off')}` : _GameText('ss_boost_none')}</small></span>`
      + `<span class="gf-ss-tgl${on ? ' on' : ''}"></span><kbd>E</kbd>`;
  }
  function RenderMeta() {
    const mh = MisHTML(), bh = BoostHTML();
    document.querySelectorAll('#gf-ss .gf-ss-mis').forEach(e => { e.innerHTML = mh; });
    document.querySelectorAll('#gf-ss .gf-ss-boost').forEach(e => { e.innerHTML = bh; e.classList.toggle('on', SAVE.sbOn && SAVE.sb > 0); });
    if (SPR && !SPR.boostUrl) SPR.boostUrl = SPR.icons.boost.toDataURL();
    const ic = SPR?.boostUrl;
    if (ic) document.querySelectorAll('#gf-ss .gf-ss-boost-ic').forEach(e => { e.style.backgroundImage = `url(${ic})`; });
  }
  function ToggleBoost() {
    if (!SAVE.sb) { OpenShop(); ShopTab(3); return; }
    SAVE.sbOn = !SAVE.sbOn; SaveData(); RenderMeta();
  }

  const SHOP = { open: false, tab: 0, sel: 0, from: '' }, SHOP_COLS = [6, 4, 2, 2];
  let _noteT = null;
  function ShopList(tab) {
    if (tab === 0) return CHARS.map(it => ({ kind: 'char', it }));
    if (tab === 1) return BOARDS.map(it => ({ kind: 'board', it }));
    if (tab === 2) return PU_LIST.map(it => ({ kind: 'up', it }));
    return HB_PACKS.map(it => ({ kind: 'hb', it })).concat(SB_PACKS.map(it => ({ kind: 'sb', it })));
  }
  function ItemState(x) {
    if (x.kind === 'char' || x.kind === 'board') {
      const own = (x.kind === 'char' ? SAVE.chars : SAVE.boards).includes(x.it.id);
      return { own, eq: own && (x.kind === 'char' ? SAVE.char : SAVE.board) === x.it.id, price: x.it.price };
    }
    if (x.kind === 'up') { const lv = SAVE.up[x.it]; return { lv, max: lv >= UP_COST.length, price: UP_COST[lv] }; }
    return { price: x.it[1] };
  }
  function Secs(v) { return _GameText('ss_sec').replace('{n}', String(+v.toFixed(1)).replace('.', _GameText('ss_dec'))); }
  function CardHTML(x, i) {
    const st = ItemState(x), sel = i === SHOP.sel ? ' sel' : '';
    let name, extra = '', btn, cls = '';
    if (x.kind === 'char') name = _GameText(`ss_char_${x.it.id}`);
    else if (x.kind === 'board') name = _GameText(`ss_board_${x.it.id}`);
    else if (x.kind === 'up') {
      name = _GameText(`ss_up_${x.it}`);
      extra = `<div class="gf-ss-pips">${UP_COST.map((_, k) => `<i class="${k < st.lv ? 'on' : ''}"></i>`).join('')}</div>`
        + `<div class="gf-ss-cdesc">${Secs(Dur(x.it))}${st.max ? '' : ` &rarr; ${Secs(Dur(x.it) + UPG[x.it][1])}`}</div>`;
    } else if (x.kind === 'hb') {
      name = _GameText('ss_hb_pack').replace('{n}', x.it[0]);
      extra = `<div class="gf-ss-cdesc">${_GameText('ss_hb_have').replace('{n}', SAVE.hb)}</div>`;
    } else {
      name = _GameText('ss_sb_pack').replace('{n}', x.it[0]);
      extra = `<div class="gf-ss-cdesc">${_GameText('ss_boost_desc').replace('{n}', BOOST)} · ${_GameText('ss_hb_have').replace('{n}', SAVE.sb)}</div>`;
    }
    if (st.eq) { btn = _GameText('ss_equipped'); cls = ' eq'; }
    else if (st.own) { btn = _GameText('ss_equip'); cls = ' own'; }
    else if (st.max) { btn = 'MAX'; cls = ' eq'; }
    else { btn = `<span class="gf-ss-coin"></span>${st.price}`; cls = SAVE.bank < st.price ? ' off' : ''; }
    return `<div class="gf-ss-card${sel}${st.eq ? ' is-eq' : ''}" data-i="${i}"><canvas></canvas><div class="gf-ss-cbody"><div class="gf-ss-cname">${name}</div>${extra}<button class="gf-ss-buy${cls}" data-i="${i}">${btn}</button></div></div>`;
  }
  function PaintCard(cv, x) {
    const w = cv.clientWidth * 2, h = cv.clientHeight * 2, keep = ctx;
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    if (x.kind === 'char') {
      ctx = g;
      g.translate(w / 2, h * 0.93); g.scale(h / 150, h / 150);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, 0, 26, 6, 0, 0, Math.PI * 2); g.fill();
      ST.sneak = false; ST.magnet = false; ST.jet = false; ST.crash = false; ST.t = 0; ST.ph = 0; ST.tag = '#4ade80';
      StandPose(0);
      Kid(x.it, ST);
      ctx = keep;
    } else if (x.kind === 'board') {
      g.translate(w / 2, h / 2); g.rotate(-0.32);
      const bw = w * 0.84, bh = bw * 0.3;
      g.fillStyle = Rad(g, 0, 0, bw * 0.55, [0, Alpha(x.it.glow, 0.45), 1, Alpha(x.it.glow, 0)]); g.fillRect(-w, -h, 2 * w, 2 * h);
      Ball(g, -bw * 0.32, bh * 0.55, bh * 0.22, '#1e1b4b'); Ball(g, bw * 0.32, bh * 0.55, bh * 0.22, '#1e1b4b');
      PaintDeck(g, x.it, -bw / 2, -bh / 2, bw, bh);
    } else {
      const ic = x.kind === 'up' ? SPR.icons[x.it] : x.kind === 'sb' ? SPR.icons.boost : SPR.icons.board, sz = Math.min(w, h) * 0.9;
      g.drawImage(ic, (w - sz) / 2, (h - sz) / 2, sz, sz);
      if (x.kind !== 'up') {
        g.font = `900 ${h * 0.26}px "Arial Black", "Segoe UI Black", sans-serif`; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
        g.lineWidth = h * 0.06; g.strokeStyle = '#17121f'; g.strokeText(`x${x.it[0]}`, w * 0.96, h * 0.95);
        g.fillStyle = '#fff'; g.fillText(`x${x.it[0]}`, w * 0.96, h * 0.95);
      }
    }
  }
  function RenderShop() {
    const grid = document.getElementById('gf-ss-grid'), items = ShopList(SHOP.tab);
    SHOP.sel = Math.max(0, Math.min(SHOP.sel, items.length - 1));
    SetText('gf-ss-shop-bank', SAVE.bank); SetText('gf-ss-bank', SAVE.bank);
    document.querySelectorAll('#gf-ss-tabs button').forEach((b, i) => b.classList.toggle('on', i === SHOP.tab));
    grid.className = `gf-ss-grid gf-ss-g${SHOP.tab}`;
    grid.innerHTML = items.map(CardHTML).join('');
    grid.querySelectorAll('canvas').forEach((cv, i) => PaintCard(cv, items[i]));
  }
  function Note(key, bad) {
    const el = document.getElementById('gf-ss-shop-msg');
    el.textContent = key ? _GameText(key) : '';
    el.className = bad ? 'bad' : '';
    clearTimeout(_noteT);
    _noteT = setTimeout(() => { el.textContent = ''; }, 1600);
  }
  function Pay(n) { if (SAVE.bank < n) return false; SAVE.bank -= n; return true; }
  function ShopAct(i) {
    const x = ShopList(SHOP.tab)[i], st = ItemState(x);
    SHOP.sel = i;
    let msg = '';
    if (x.kind === 'char' || x.kind === 'board') {
      if (st.eq) { RenderShop(); return; }
      if (!st.own) {
        if (!Pay(st.price)) { RenderShop(); Note('ss_need', true); return; }
        (x.kind === 'char' ? SAVE.chars : SAVE.boards).push(x.it.id); msg = 'ss_bought';
      }
      if (x.kind === 'char') { SAVE.char = x.it.id; CH = x.it; }
      else { SAVE.board = x.it.id; BD = x.it; BoardSprites(SPR); }
    } else {
      if (st.max) return;
      if (!Pay(st.price)) { RenderShop(); Note('ss_need', true); return; }
      if (x.kind === 'up') SAVE.up[x.it]++; else if (x.kind === 'hb') SAVE.hb += x.it[0]; else SAVE.sb += x.it[0];
      msg = 'ss_bought';
    }
    SaveData();
    RenderShop();
    if (msg) Note(msg);
    Draw();
  }
  function OpenShop() {
    if (!GS || (GS.status !== 'start' && GS.status !== 'gameover')) return;
    SHOP.open = true; SHOP.from = GS.status; SHOP.sel = 0;
    ShowScreen('gf-ss-shop');
    RenderShop();
  }
  function CloseShop() {
    SHOP.open = false;
    RenderMeta();
    ShowScreen(SHOP.from === 'gameover' ? 'gf-ss-gameover' : 'gf-ss-start');
  }
  function ShopTab(t) { SHOP.tab = (t + 4) % 4; SHOP.sel = 0; RenderShop(); }
  function ShopKey(e) {
    const k = e.key, n = ShopList(SHOP.tab).length, c = SHOP_COLS[SHOP.tab];
    let d = 0;
    if (k === 'Escape' || k === 'Backspace') CloseShop();
    else if (k === 'Tab') ShopTab(SHOP.tab + (e.shiftKey ? -1 : 1));
    else if (k >= '1' && k <= '4') ShopTab(+k - 1);
    else if (k === 'Enter' || k === ' ') { if (!e.repeat) ShopAct(SHOP.sel); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'q' || k === 'Q') d = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') d = 1;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'z' || k === 'Z') d = -c;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') d = c;
    else return;
    e.preventDefault(); e.stopPropagation();
    if (d && SHOP.sel + d >= 0 && SHOP.sel + d < n) { SHOP.sel += d; RenderShop(); }
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); RenderMeta(); ShowScreen('gf-ss-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }

  function ShowGameOver() {
    const sc = Math.floor(GS.score), best = Math.max(LoadBest(), sc);
    SetText('gf-ss-bank', SAVE.bank);
    SetText('gf-ss-go-score', sc);
    SetText('gf-ss-go-coins', GS.coins);
    SetText('gf-ss-go-best', best);
    SetText('gf-ss-best', best);
    SetText('gf-ss-go-reason', _GameText(GS.crashKind === 'caught' ? 'ss_caught' : 'ss_crashed'));
    SetText('gf-ss-go-mult', `x${GS.base + GS.boost}`);
    const ns = document.getElementById('gf-ss-go-sets');
    if (ns) { ns.style.display = GS.sets ? 'block' : 'none'; ns.textContent = _GameText('ss_go_sets').replace('{n}', GS.sets); }
    RenderMeta();
    const nb = document.getElementById('gf-ss-go-new');
    if (nb) nb.style.display = sc > GS.best0 ? 'block' : 'none';
    ShowScreen('gf-ss-gameover');
  }

  function OnKey(e) {
    const root = document.getElementById('gf-ss');
    if (!GS || !root || root.style.display === 'none') return;
    if (SHOP.open) { ShopKey(e); return; }
    const k = e.key, st = GS.status;
    if ((k === 'b' || k === 'B') && (st === 'start' || st === 'gameover')) { e.preventDefault(); e.stopPropagation(); OpenShop(); return; }
    if ((k === 'e' || k === 'E') && (st === 'start' || st === 'gameover')) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) ToggleBoost(); return; }
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
    TXT.boost = _GameText('ss_pu_boost').replace('{n}', BOOST); TXT.misDone = _GameText('ss_mis_done'); TXT.setDone = _GameText('ss_set_done');
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
      <span id="gf-ss-bank-hdr" title="${_GameText('ss_coins')}"><span class="gf-ss-coin"></span><span id="gf-ss-bank">0</span></span>
      <span id="gf-ss-best-hdr"><span class="gf-ss-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-ss-best">0</span></span>
      <button id="gf-ss-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-ss-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-ss-body">
    <canvas id="gf-ss-canvas"></canvas>

    <div id="gf-ss-start" class="gf-ss-scr">
      <div class="gf-ss-cols">
        <div class="gf-ss-col">
          <div class="gf-ss-scr-logo">${_GameText('ss_title')}</div>
          <div class="gf-ss-scr-sub">${_GameText('ss_subtitle')}</div>
          <div class="gf-ss-keys">
            <div class="gf-ss-key"><span><kbd>←</kbd><kbd>→</kbd><kbd>A</kbd><kbd>D</kbd></span><b>${_GameText('ss_ctrl_move')}</b></div>
            <div class="gf-ss-key"><span><kbd>↑</kbd><kbd>W</kbd><kbd>${sp}</kbd></span><b>${_GameText('ss_ctrl_jump')}</b></div>
            <div class="gf-ss-key"><span><kbd>↓</kbd><kbd>S</kbd></span><b>${_GameText('ss_ctrl_roll')}</b></div>
            <div class="gf-ss-key gf-ss-key-hb"><span><kbd>H</kbd><kbd>${sp} x2</kbd></span><b>${_GameText('ss_ctrl_board2')}</b></div>
            <div class="gf-ss-key"><span><kbd>Esc</kbd><kbd>P</kbd></span><b>${_GameText('game_pause')}</b></div>
          </div>
          <div class="gf-ss-scr-footer">${_GameText('ss_ctrl_swipe')}</div>
        </div>
        <div class="gf-ss-col">
          <div class="gf-ss-mis"></div>
          <button class="gf-ss-boost"></button>
        </div>
      </div>
      <div class="gf-ss-row">
        <button class="gf-ss-btn gf-ss-btn-play" id="gf-ss-go">▶&nbsp; ${_GameText('game_play')}</button>
        <button class="gf-ss-btn gf-ss-btn-shop" data-shop="1">${_GameText('ss_shop')} <kbd>B</kbd></button>
      </div>
      <div class="gf-ss-scr-footer">${_GameText('ss_start_hint')}</div>
    </div>

    <div id="gf-ss-pause" class="gf-ss-scr" style="display:none">
      <div class="gf-ss-scr-logo gf-ss-scr-pz">${_GameText('game_paused')}</div>
      <div class="gf-ss-mis gf-ss-mis-w"></div>
      <button class="gf-ss-btn gf-ss-btn-play" id="gf-ss-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-ss-gameover" class="gf-ss-scr" style="display:none">
      <div class="gf-ss-scr-go">${_GameText('game_gameover')}</div>
      <div id="gf-ss-go-reason" class="gf-ss-scr-sub"></div>
      <div class="gf-ss-cols">
        <div class="gf-ss-col">
          <div class="gf-ss-go-stats">
            <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('game_score').toUpperCase()}</div><div class="gf-ss-go-val" id="gf-ss-go-score">0</div></div>
            <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('game_best').toUpperCase()}</div><div class="gf-ss-go-val" id="gf-ss-go-best">0</div></div>
            <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('ss_coins').toUpperCase()}</div><div class="gf-ss-go-val gf-ss-gold"><span class="gf-ss-coin"></span><span id="gf-ss-go-coins">0</span></div></div>
            <div class="gf-ss-go-stat"><div class="gf-ss-go-lbl">${_GameText('ss_mult').toUpperCase()}</div><div class="gf-ss-go-val gf-ss-violet" id="gf-ss-go-mult">x1</div></div>
          </div>
          <div id="gf-ss-go-new" class="gf-ss-scr-new" style="display:none">${_GameText('game_new_best')}</div>
          <div id="gf-ss-go-sets" class="gf-ss-scr-new gf-ss-green" style="display:none"></div>
          <button class="gf-ss-boost"></button>
        </div>
        <div class="gf-ss-col">
          <div class="gf-ss-mis"></div>
        </div>
      </div>
      <div class="gf-ss-row">
        <button class="gf-ss-btn gf-ss-btn-play" id="gf-ss-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
        <button class="gf-ss-btn gf-ss-btn-shop" data-shop="1">${_GameText('ss_shop')} <kbd>B</kbd></button>
      </div>
    </div>

    <div id="gf-ss-shop" class="gf-ss-scr" style="display:none">
      <div class="gf-ss-shop-hd">
        <div class="gf-ss-shop-title">${_GameText('ss_shop')}</div>
        <div class="gf-ss-bank"><span class="gf-ss-coin"></span><b id="gf-ss-shop-bank">0</b></div>
      </div>
      <div id="gf-ss-tabs" class="gf-ss-tabs">
        <button>${_GameText('ss_tab_chars')}</button><button>${_GameText('ss_tab_boards')}</button><button>${_GameText('ss_tab_upgrades')}</button><button>${_GameText('ss_tab_items2')}</button>
      </div>
      <div id="gf-ss-grid" class="gf-ss-grid"></div>
      <div class="gf-ss-shop-ft">
        <span class="gf-ss-shop-hint">${_GameText('ss_shop_keys')}</span>
        <span id="gf-ss-shop-msg"></span>
        <button class="gf-ss-btn gf-ss-btn-back" id="gf-ss-shop-back">${_GameText('game_back')}</button>
      </div>
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
    document.querySelectorAll('#gf-ss [data-shop]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); OpenShop(); }));
    document.querySelectorAll('#gf-ss .gf-ss-boost').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); ToggleBoost(); }));
    document.querySelectorAll('#gf-ss .gf-ss-mis').forEach(b => b.addEventListener('click', e => e.stopPropagation()));
    document.getElementById('gf-ss-shop-back').addEventListener('click', CloseShop);
    document.querySelectorAll('#gf-ss-tabs button').forEach((b, i) => b.addEventListener('click', () => ShopTab(i)));
    document.getElementById('gf-ss-grid').addEventListener('click', e => {
      const b = e.target.closest('button[data-i]'), c = e.target.closest('.gf-ss-card');
      if (b) ShopAct(+b.dataset.i);
      else if (c && +c.dataset.i !== SHOP.sel) { SHOP.sel = +c.dataset.i; RenderShop(); }
    });
  }

  function OpenGradeSurfers(grades) {
    if (grades?.length || !_grades.length) _grades = NormalizeGrades(grades);
    LoadSave();
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
    if (SAVE) SaveData();
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
  --ss-modal:#fff;--ss-hdr:#f5f5f5;--ss-scr:rgba(250,248,244,0.86);--ss-scr0:rgba(250,248,244,0.5);
  --ss-brd:rgba(245,158,11,0.3);--ss-brd2:#e0e0e0;--ss-btn-brd:#d0d0d0;
  --ss-txt:#111;--ss-txt2:#555;--ss-txt3:#999;
  --ss-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-ss[data-theme="dark"] {
  --ss-modal:rgba(13,13,13,0.97);--ss-hdr:rgba(8,8,8,0.95);
  --ss-scr:rgba(8,8,12,0.84);--ss-scr0:rgba(8,8,12,0.5);--ss-brd:rgba(245,158,11,0.24);--ss-brd2:#1c1c1c;
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
#gf-ss-bank-hdr{padding:4px 8px;border:1px solid var(--ss-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--ss-txt);display:flex;gap:6px;align-items:center;line-height:1;}
.gf-ss-coin{display:inline-block;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7b8 0,#ffd83d 35%,#f0a90e 75%,#c98200 100%);box-shadow:inset 0 0 0 1.5px #a86b00;flex-shrink:0;vertical-align:-2px;}
#gf-ss-pause-btn,#gf-ss-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--ss-btn-brd);border-radius:6px;background:transparent;color:var(--ss-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-ss-pause-btn:hover{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.10);}
#gf-ss-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-ss-body{position:relative;line-height:0;flex-shrink:0;}
#gf-ss-canvas{display:block;width:${CV_W}px;height:${CV_H}px;touch-action:none;user-select:none;}
.gf-ss-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse 85% 80% at 50% 45%,var(--ss-scr0),var(--ss-scr));padding:16px 20px;overflow-y:auto;line-height:1.35;text-align:center;}
#gf-ss-start{cursor:pointer;}
.gf-ss-scr-logo{font:900 38px "Arial Black","Segoe UI Black",Impact,sans-serif;letter-spacing:1px;line-height:1.1;text-transform:uppercase;background:linear-gradient(180deg,#fff7c2 0%,#facc15 42%,#f97316 78%,#ea580c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1.6px #7c2d12;filter:drop-shadow(0 3px 0 #7c2d12) drop-shadow(0 8px 16px rgba(245,158,11,0.4));padding:0 4px;}
.gf-ss-scr-pz{font-size:30px;letter-spacing:4px;}
.gf-ss-cols{display:grid;grid-template-columns:minmax(0,1fr) 296px;gap:18px;width:min(670px,100%);align-items:center;}
.gf-ss-col{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0;}
.gf-ss-mis{width:100%;display:flex;flex-direction:column;gap:5px;padding:10px 11px;border-radius:14px;background:linear-gradient(180deg,rgba(52,42,104,0.94),rgba(18,14,40,0.94));border:2px solid #120e24;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18),0 8px 22px rgba(0,0,0,0.28);color:#fff;text-align:left;cursor:default;box-sizing:border-box;}
.gf-ss-mis-w{width:min(340px,100%);}
.gf-ss-mis-hd{display:flex;align-items:center;gap:10px;margin-bottom:2px;}
.gf-ss-medal{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:50px;height:38px;font:900 16px "Arial Black","Segoe UI Black",sans-serif;color:#fff;text-shadow:0 0 3px #1e0b4b,0 2px 0 #1e0b4b;background:linear-gradient(180deg,#ede9fe,#8b5cf6 45%,#3b1782);clip-path:polygon(22% 0,78% 0,100% 50%,78% 100%,22% 100%,0 50%);}
.gf-ss-mis-ht{display:flex;flex-direction:column;min-width:0;}
.gf-ss-mis-ht b{font:900 13px "Arial Black","Segoe UI Black",sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#fde68a;}
.gf-ss-mis-ht small{font-size:10.5px;color:#c4b5fd;line-height:1.3;}
.gf-ss-mis-row{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px;background:rgba(255,255,255,0.07);}
.gf-ss-mis-row.done{background:rgba(74,222,128,0.17);}
.gf-ss-mis-ck{flex-shrink:0;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:900 10px "Arial Black",sans-serif;font-style:normal;color:#c4b5fd;border:2px solid rgba(196,181,253,0.45);box-sizing:border-box;}
.done .gf-ss-mis-ck{background:radial-gradient(circle at 35% 30%,#dcfce7,#4ade80 45%,#15803d);border-color:#120e24;}
.done .gf-ss-mis-ck::after{content:'';width:8px;height:4px;border:solid #fff;border-width:0 0 2.5px 2.5px;transform:translateY(-1px) rotate(-45deg);}
.gf-ss-mis-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;line-height:1.25;}
.gf-ss-mis-bar{height:6px;border-radius:3px;background:rgba(0,0,0,0.45);overflow:hidden;box-shadow:inset 0 1px 0 rgba(0,0,0,0.4);}
.gf-ss-mis-bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#facc15,#f97316);}
.done .gf-ss-mis-bar i{background:linear-gradient(90deg,#86efac,#22c55e);}
.gf-ss-mis-row em{font-style:normal;font-size:10.5px;font-weight:800;color:#fde68a;min-width:46px;text-align:right;white-space:nowrap;}
.done em{color:#86efac;}
.gf-ss-mis-rw{font-size:10px;color:#a5b4fc;text-align:center;margin-top:1px;}
.gf-ss-boost{display:flex;align-items:center;gap:9px;width:100%;padding:6px 10px;border-radius:12px;border:2px solid #120e24;background:linear-gradient(180deg,rgba(112,26,117,0.92),rgba(46,10,52,0.92));box-shadow:inset 0 0 0 1px rgba(245,208,254,0.28),0 6px 16px rgba(0,0,0,0.22);color:#fff;font-family:inherit;cursor:pointer;text-align:left;box-sizing:border-box;line-height:1.2;}
.gf-ss-boost:hover{box-shadow:inset 0 0 0 1px rgba(245,208,254,0.5),0 6px 18px rgba(232,121,249,0.35);}
.gf-ss-boost-ic{width:34px;height:34px;background-size:contain;background-repeat:no-repeat;flex-shrink:0;}
.gf-ss-boost-tx{flex:1;display:flex;flex-direction:column;min-width:0;}
.gf-ss-boost-tx b{font-size:12px;font-weight:800;}
.gf-ss-boost-tx small{font-size:10px;color:#f5d0fe;}
.gf-ss-tgl{position:relative;width:34px;height:18px;border-radius:9px;background:rgba(0,0,0,0.5);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.2);flex-shrink:0;}
.gf-ss-tgl::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#e5e7eb;transition:left .15s;}
.gf-ss-tgl.on{background:#22c55e;}
.gf-ss-tgl.on::after{left:18px;background:#fff;}
.gf-ss-boost kbd{padding:1px 5px;border:1px solid rgba(255,255,255,0.5);border-radius:4px;font:700 10px "IBM Plex Mono",monospace;}
.gf-ss-btn.gf-ss-btn-play{border:2px solid #7c2d12;background:linear-gradient(180deg,#fde68a,#f59e0b 55%,#d97706);color:#3b1d00;font-size:14px;box-shadow:0 3px 0 #7c2d12,0 8px 18px rgba(245,158,11,0.35);}
#gf-ss[data-theme="dark"] .gf-ss-btn.gf-ss-btn-play{color:#3b1d00;}
.gf-ss-btn.gf-ss-btn-play:hover{background:linear-gradient(180deg,#fef3c7,#fbbf24 55%,#f59e0b);box-shadow:0 3px 0 #7c2d12,0 10px 22px rgba(245,158,11,0.45);}
.gf-ss-violet{color:#8b5cf6;}
#gf-ss[data-theme="dark"] .gf-ss-violet{color:#a78bfa;}
.gf-ss-scr-new.gf-ss-green{color:#15803d;background:rgba(74,222,128,0.18);border-color:rgba(34,197,94,0.45);}
.gf-ss-scr-sub{font-size:13px;color:var(--ss-txt2);line-height:1.45;max-width:420px;}
.gf-ss-keys{display:grid;gap:4px;width:min(420px,100%);}
.gf-ss-key{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:3px 9px;border:1px solid var(--ss-brd2);border-radius:8px;background:rgba(255,255,255,0.62);font-size:11px;}
#gf-ss[data-theme="dark"] .gf-ss-key{background:rgba(0,0,0,0.4);}
.gf-ss-key b{color:var(--ss-txt2);font-weight:700;text-align:right;}
.gf-ss-key kbd{display:inline-block;min-width:14px;padding:2px 6px;margin-right:4px;border:1px solid var(--ss-btn-brd);border-bottom-width:2px;border-radius:5px;background:var(--ss-modal);font:700 11px "IBM Plex Mono",monospace;color:var(--ss-txt);line-height:1.3;}
.gf-ss-key-hb{border-color:rgba(34,211,238,0.5);background:rgba(34,211,238,0.12);}
.gf-ss-scr-footer{font-size:11px;color:var(--ss-txt2);line-height:1.5;max-width:420px;}
.gf-ss-scr-go{font:900 32px "Arial Black","Segoe UI Black",Impact,sans-serif;letter-spacing:3px;line-height:1.1;text-transform:uppercase;background:linear-gradient(180deg,#fecaca,#f87171 45%,#b91c1c);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1.4px #450a0a;filter:drop-shadow(0 3px 0 #450a0a) drop-shadow(0 8px 16px rgba(248,113,113,0.4));padding:0 4px;}
.gf-ss-scr-new{font-size:11px;font-weight:800;color:#b45309;letter-spacing:2px;padding:3px 12px;border-radius:999px;background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.45);animation:gf-ss-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-ss-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
.gf-ss-go-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;}
.gf-ss-go-stat{display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 8px;border:1px solid var(--ss-brd2);border-radius:11px;background:linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.45));box-shadow:0 4px 12px rgba(0,0,0,0.08);}
#gf-ss[data-theme="dark"] .gf-ss-go-stat{background:linear-gradient(180deg,rgba(40,40,52,0.8),rgba(16,16,22,0.8));}
.gf-ss-go-val .gf-ss-coin{width:18px;height:18px;margin-right:6px;vertical-align:-1px;}
.gf-ss-go-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--ss-txt3);line-height:1;text-transform:uppercase;}
.gf-ss-go-val{font:900 23px "Arial Black","Segoe UI Black",sans-serif;color:var(--ss-txt);line-height:1;}
.gf-ss-gold{color:#e0a400;}
.gf-ss-btn{padding:10px 24px;border:1px solid #f59e0b;border-radius:8px;background:rgba(245,158,11,0.14);color:#d97706;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
#gf-ss[data-theme="dark"] .gf-ss-btn{color:#fbbf24;}
.gf-ss-btn:hover{background:rgba(245,158,11,0.24);box-shadow:0 4px 18px rgba(245,158,11,0.3);transform:translateY(-1px);}
.gf-ss-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.gf-ss-btn.gf-ss-btn-shop{border:2px solid #164e63;background:linear-gradient(180deg,#cffafe,#22d3ee 55%,#0891b2);color:#083344;min-width:120px;font-size:13px;box-shadow:0 3px 0 #164e63,0 8px 18px rgba(34,211,238,0.3);}
#gf-ss[data-theme="dark"] .gf-ss-btn.gf-ss-btn-shop{color:#083344;}
.gf-ss-btn.gf-ss-btn-shop:hover{background:linear-gradient(180deg,#ecfeff,#67e8f9 55%,#06b6d4);box-shadow:0 3px 0 #164e63,0 10px 22px rgba(34,211,238,0.42);}
.gf-ss-btn kbd{display:inline-block;margin-left:6px;padding:0 5px;border:1px solid currentColor;border-radius:4px;font:700 10px "IBM Plex Mono",monospace;opacity:0.75;line-height:1.4;}
#gf-ss-shop{justify-content:flex-start;gap:10px;padding:14px 18px;}
.gf-ss-shop-hd{display:flex;align-items:center;justify-content:space-between;width:100%;}
.gf-ss-shop-title{font-size:24px;font-weight:900;color:#f59e0b;letter-spacing:1px;text-shadow:0 2px 0 #b45309;}
.gf-ss-bank{display:flex;align-items:center;gap:7px;padding:5px 12px;border:1px solid var(--ss-brd);border-radius:9px;background:rgba(245,158,11,0.12);font-size:16px;color:#d97706;}
#gf-ss[data-theme="dark"] .gf-ss-bank{color:#fbbf24;}
.gf-ss-bank .gf-ss-coin{width:16px;height:16px;}
.gf-ss-tabs{display:flex;gap:6px;width:100%;}
.gf-ss-tabs button{flex:1;padding:7px 6px;border:1px solid var(--ss-btn-brd);border-radius:8px;background:rgba(128,128,128,0.08);color:var(--ss-txt2);font:800 11px "IBM Plex Mono",monospace;cursor:pointer;letter-spacing:0.5px;}
.gf-ss-tabs button:hover{border-color:#f59e0b;color:#d97706;}
.gf-ss-tabs button.on{border-color:#f59e0b;background:rgba(245,158,11,0.18);color:#b45309;}
#gf-ss[data-theme="dark"] .gf-ss-tabs button.on{color:#fbbf24;}
.gf-ss-grid{display:grid;gap:8px;width:100%;flex:1;min-height:0;align-content:center;}
.gf-ss-g0{grid-template-columns:repeat(6,1fr);}
.gf-ss-g1{grid-template-columns:repeat(4,1fr);}
.gf-ss-g2,.gf-ss-g3{grid-template-columns:repeat(2,1fr);}
.gf-ss-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px;border:1px solid var(--ss-brd2);border-radius:10px;background:rgba(255,255,255,0.78);cursor:pointer;transition:transform .12s,border-color .12s,box-shadow .12s;}
#gf-ss[data-theme="dark"] .gf-ss-card{background:rgba(14,14,20,0.72);}
.gf-ss-card:hover{border-color:rgba(245,158,11,0.55);}
.gf-ss-card.sel{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,0.35),0 6px 18px rgba(245,158,11,0.18);transform:translateY(-2px);}
.gf-ss-card.is-eq{background:rgba(236,253,243,0.9);}
#gf-ss[data-theme="dark"] .gf-ss-card.is-eq{background:rgba(16,48,30,0.78);}
.gf-ss-card canvas{width:100%;height:150px;display:block;}
.gf-ss-g1 .gf-ss-card canvas{height:110px;}
.gf-ss-g2 .gf-ss-card,.gf-ss-g3 .gf-ss-card{flex-direction:row;padding:10px 12px;gap:12px;}
.gf-ss-g2 .gf-ss-card canvas{width:74px;height:74px;flex-shrink:0;}
.gf-ss-g3 .gf-ss-card canvas{width:84px;height:84px;flex-shrink:0;}
.gf-ss-cbody{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;}
.gf-ss-g2 .gf-ss-cbody,.gf-ss-g3 .gf-ss-cbody{align-items:flex-start;}
.gf-ss-cname{font-size:13px;font-weight:800;color:var(--ss-txt);}
.gf-ss-cdesc{font-size:11px;color:var(--ss-txt2);}
.gf-ss-pips{display:flex;gap:4px;}
.gf-ss-pips i{width:16px;height:8px;border-radius:3px;background:rgba(128,128,128,0.25);border:1px solid var(--ss-btn-brd);}
.gf-ss-pips i.on{background:#f59e0b;border-color:#d97706;}
.gf-ss-buy{display:flex;align-items:center;justify-content:center;gap:5px;min-width:88px;padding:6px 10px;border:1px solid #f59e0b;border-radius:7px;background:rgba(245,158,11,0.16);color:#b45309;font:800 12px "IBM Plex Mono",monospace;cursor:pointer;line-height:1.2;}
#gf-ss[data-theme="dark"] .gf-ss-buy{color:#fbbf24;}
.gf-ss-buy:hover{background:rgba(245,158,11,0.28);}
.gf-ss-buy.off{opacity:0.5;}
.gf-ss-buy.own{border-color:#22d3ee;background:rgba(34,211,238,0.14);color:#0e7490;}
#gf-ss[data-theme="dark"] .gf-ss-buy.own{color:#67e8f9;}
.gf-ss-buy.eq{border-color:#4ade80;background:rgba(74,222,128,0.16);color:#15803d;cursor:default;}
#gf-ss[data-theme="dark"] .gf-ss-buy.eq{color:#86efac;}
.gf-ss-shop-ft{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;}
.gf-ss-shop-hint{font-size:10px;color:var(--ss-txt3);text-align:left;}
#gf-ss-shop-msg{font-size:12px;font-weight:800;color:#16a34a;}
#gf-ss-shop-msg.bad{color:#ef4444;}
.gf-ss-btn-back{min-width:110px;padding:8px 18px;}
`;
    document.head.appendChild(s);
  }

})(window);
