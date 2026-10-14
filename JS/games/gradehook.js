;(function (W) {
  'use strict';
  if (W.OpenGradeHook) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 760;
  const CV_H = 460;
  const STEP = 1 / 120;
  const GRAV = 1900;
  const DRAG_K = Math.exp(-0.02 * STEP);
  const REACH = 255;
  const MAX_V = 1500;
  const PUMP = 260;
  const PUMP_MAX = 1150;
  const CORE_R = 11;
  const PAD_R = 7;
  const KILL_Y = 680;
  const LEVELS = 24;
  const TRAIL = 20;
  const ARM = 8.5;
  const LEG = 10;
  const ACCENT = '#ec4899';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const F_HOOK = `800 10px ${FONT}`;
  const F_POP = `900 13px ${FONT}`;
  const F_SIGN = `900 16px ${FONT}`;
  const F_SMALL = `700 9px ${FONT}`;
  const F_BADGE = `900 12px ${FONT}`;
  const F_TIME = `800 15px ${FONT}`;
  const F_SUB = `800 11px ${FONT}`;
  const F_HINT = `800 14px ${FONT}`;

  const LS_BEST = 'gf-hk-best';
  const LS_LEVEL = 'gf-hk-level';
  const LS_TIMES = 'gf-hk-times';
  const LS_CUSTOM = 'gf-hk-custom';
  const LS_SNAP = 'gf-hk-snap';
  const CODE_PRE = 'GFHOOK1:';
  const Q = 5;
  const GRID = 20;
  const NAME_MAX = 32;
  const MAX_N = { h: 150, b: 120, p: 60, z: 120 };
  const MAX_ALL = 400;
  const MAX_CUSTOM = 100;
  const MAX_CODE = 12000;
  const MAX_RAW = 16384;
  const TOOLS = ['sel', 'h', 'b', 'p', 'z', 's', 'f'];
  const EL_KEY = { sel: 'hk_tool_select', h: 'hk_el_hook', b: 'hk_el_block', p: 'hk_el_pad', z: 'hk_el_haz', s: 'hk_el_start', f: 'hk_el_finish' };
  const XY = [['X', 5], ['Y', 5]];
  const FIELDS = {
    h: [...XY, ['hk_move_x', 5], ['hk_move_y', 5], ['hk_speed', 0.1, 0.1], ['hk_phase', 1]],
    b: [...XY, ['hk_width', 5], ['hk_height', 5]],
    z: [...XY, ['hk_width', 5], ['hk_height', 5]],
    p: [...XY, ['hk_width', 5], ['hk_angle', 1]],
    s: XY,
    f: XY,
  };
  const RUN = { ready: 1, playing: 1, dead: 1, finish: 1, complete: 1 };

  const PALS = [
    ['#cdeefa', '#f1fbff', '#b5e2f3', '#9dd5ea'],
    ['#fbdcea', '#fff4f9', '#f6c6dc', '#efafcc'],
    ['#e3dcfb', '#f8f6ff', '#d2c6f6', '#bfaff0'],
    ['#d6f3df', '#f4fcf6', '#bfe9cc', '#a5ddb7'],
    ['#fde9c8', '#fffaf1', '#f8d9a6', '#f1c785'],
  ];
  const NIGHT = ['#0b1226', '#1a2444', '#18213f', '#1f2a4f'];
  const LIGHT = {
    man: '#1c1a2b', rope: '#26233a', block: '#3d3b58', blockTop: '#5a587c', pad: '#f59e0b', padTop: '#fde68a', post: '#a16207',
    rail: 'rgba(61,59,88,0.28)', hud: '#26233a', hudSub: 'rgba(38,35,58,0.55)', track: 'rgba(38,35,58,0.13)',
    badge: '#ffffff', pill: 'rgba(255,255,255,0.88)', pillTxt: '#26233a', chkA: '#ffffff', chkB: '#1c1a2b',
    cloud: 'rgba(255,255,255,0.7)', trail: 'rgba(236,72,153,0.28)', fade: '#ffffff', sign: '#ffffff',
    haz: '#e11d48', hazTop: 'rgba(255,255,255,0.4)', kill: 'rgba(239,68,68,0.1)', grid: 'rgba(38,35,58,0.08)', grid2: 'rgba(38,35,58,0.16)',
  };
  const DARK = {
    man: '#f4f6fb', rope: '#e2e8f0', block: '#2b3765', blockTop: '#3f4d88', pad: '#fbbf24', padTop: '#fef3c7', post: '#92400e',
    rail: 'rgba(226,232,240,0.22)', hud: '#f4f6fb', hudSub: 'rgba(244,246,251,0.55)', track: 'rgba(255,255,255,0.14)',
    badge: '#141c36', pill: 'rgba(20,28,54,0.88)', pillTxt: '#f4f6fb', chkA: '#e2e8f0', chkB: '#0f1730',
    cloud: 'rgba(255,255,255,0.035)', trail: 'rgba(244,114,182,0.42)', fade: '#0b1226', sign: '#141c36',
    haz: '#f43f5e', hazTop: 'rgba(255,255,255,0.3)', kill: 'rgba(239,68,68,0.14)', grid: 'rgba(255,255,255,0.05)', grid2: 'rgba(255,255,255,0.11)',
  };
  const POSE_HANG = [-4, 1, -6, -7, 3, 3, 5, -5, -3, -18, -5, -27, 4, -18, 3, -28];
  const POSE_FLY = [-8, 9, -15, 7, 8, 10, 15, 9, -7, -15, -4, -24, 7, -16, 11, -24];
  const CONF_COLORS = ['#ec4899', '#4ade80', '#a3e635', '#f97316', '#60a5fa', '#facc15', '#a78bfa'];
  const Ico = p => `<svg class="gf-hk-i" viewBox="0 0 16 16" aria-hidden="true">${p}</svg>`;
  const IC = {
    back: Ico('<path d="M10 3L5 8l5 5"/>'),
    undo: Ico('<path d="M5.5 3.5l-3 3 3 3"/><path d="M2.5 6.5H10a3.5 3.5 0 010 7H7"/>'),
    redo: Ico('<path d="M10.5 3.5l3 3-3 3"/><path d="M13.5 6.5H6a3.5 3.5 0 000 7h3"/>'),
    grid: Ico('<path d="M2 5.5h12M2 10.5h12M5.5 2v12M10.5 2v12"/>'),
    fit: Ico('<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>'),
    del: Ico('<path d="M2.5 4.5h11M6.5 4.5v-2h3v2M4 4.5l.8 9h6.4l.8-9"/>'),
    code: Ico('<path d="M5.5 4l-4 4 4 4M10.5 4l4 4-4 4"/>'),
    play: Ico('<path d="M5 3l8 5-8 5z" fill="currentColor"/>'),
    edit: Ico('<path d="M2.5 13.5l.8-3.3 7.9-7.9 2.5 2.5-7.9 7.9z"/><path d="M9.5 4L12 6.5"/>'),
    ren: Ico('<path d="M3 4.5v-2h10v2M8 2.5v11M6 13.5h4"/>'),
    dup: Ico('<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3 10.5h-.5v-8h8V3"/>'),
    sel: Ico('<path d="M3.5 2.5l9 4.5-4 1.2-1.7 4.3z"/>'),
    h: Ico('<circle cx="8" cy="8" r="4.5" fill="currentColor"/>'),
    b: Ico('<rect x="1.5" y="6" width="13" height="5.5" rx="1.5"/>'),
    p: Ico('<path d="M2 7.5q6 3 12 0M4 9.5V13M12 9.5V13"/>'),
    z: Ico('<path d="M1.5 13l2.2-7 2.2 7 2.2-7 2.2 7 2.2-7 2.2 7"/>'),
    s: Ico('<circle cx="8" cy="3.5" r="1.7"/><path d="M8 5.5V10M5 7.5h6M8 10l-2.5 4M8 10l2.5 4"/>'),
    f: Ico('<path d="M3.5 14.5V2M3.5 2.5h9v6h-9M6.5 2.5v6M9.5 2.5v6M3.5 5.5h9"/>'),
  };

  const _mem = {};
  function StorageGet(k, d) { try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (_) {} return k in _mem ? _mem[k] : d; }
  function StorageSet(k, v) { _mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function Unlocked() { return Math.max(1, Math.min(LEVELS, StorageGet(LS_LEVEL, 1) | 0)); }
  function LoadBest() { return Math.max(Unlocked(), StorageGet(LS_BEST, 1) | 0); }
  function Times() { return StorageGet(LS_TIMES, {}) || {}; }

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
    if (Pct >= 75) return '#4ade80';
    if (Pct >= 50) return '#a3e635';
    if (Pct >= 25) return '#f97316';
    return '#f87171';
  }
  function GradeAt(i) { return _grades[i % _grades.length]; }

  let GS = null, _grades = [], _raf = null, _last = 0, _kh = null, _tobs = null;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _ball = null, _glow = null, _txt = null;
  let ED = null, _edRaf = 0, _toastT = 0, _armT = 0, _cur = '', _busy = false, _codeMode = '';

  function Rng(s) {
    return () => {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function BuildLevel(n) {
    if (!_grades.length) _grades = FallbackGrades();
    const r = Rng(n * 7919 + 104729), d = (n - 1) / (LEVELS - 1);
    const L = { hooks: [], pads: [], blocks: [], haz: [], finish: 0, fy: 460, sx: 60, sy: 371, pal: PALS[(n - 1) % PALS.length], g: GradeAt(n * 3) };
    let x = 230, ly = 205;
    const Hook = (hx, hy, ax, ay, sp) => {
      const g = GradeAt(n * 5 + L.hooks.length);
      ly = hy;
      L.hooks.push({ x: hx, y: hy, bx: hx, by: hy, ax: ax || 0, ay: ay || 0, sp: sp || 0, ph: r() * 6.283, vx: 0, vy: 0, g, t: String(Math.round((g.Pct ?? 60) / 5)) });
    };
    const Pad = (px, py, w, a) => { const c = Math.cos(a) * w / 2, s = Math.sin(a) * w / 2; L.pads.push({ x1: px - c, y1: py - s, x2: px + c, y2: py + s, hit: 0 }); };
    const Block = (bx, by, w, h) => L.blocks.push({ x: bx, y: by, w, h });
    Block(-700, 400, 772, 900);
    Hook(x, ly);
    const kinds = ['run'];
    if (n >= 2) kinds.push('pad');
    if (n >= 3) kinds.push('wall');
    if (n >= 5) kinds.push('roof');
    if (n >= 6) kinds.push('chain');
    if (n >= 8) kinds.push('move', 'move');
    if (n >= 10) kinds.push('tunnel');
    if (n >= 12) kinds.push('gap');
    const intro = { 2: 'pad', 3: 'wall', 5: 'roof', 6: 'chain', 8: 'move', 10: 'tunnel', 12: 'gap' }[n];
    const count = 3 + Math.round(d * 5);
    let prev = 'run';
    for (let i = 0; i < count; i++) {
      let k = i === 0 ? 'run' : i === 1 && intro ? intro : kinds[r() * kinds.length | 0];
      if (k === prev && k !== 'run') k = 'run';
      prev = k;
      if (k === 'run') {
        const m = 2 + (r() * 2 | 0);
        for (let j = 0; j < m; j++) { x += 165 + r() * 40 + d * 85; Hook(x, 140 + r() * 110); }
      } else if (k === 'pad') {
        const px = x + 190 + r() * 30;
        Pad(px, 480 + r() * 25, 150 - d * 40, 0.14 + r() * 0.08);
        x = px + 220 + d * 40;
        Hook(x, 150 + r() * 50);
      } else if (k === 'wall') {
        const wx = x + 125 + r() * 25, ny = 150 + r() * 50;
        Block(wx, Math.max(ly, ny) + 195 - d * 45, 44, 1000);
        x = wx + 150 + r() * 30;
        Hook(x, ny);
      } else if (k === 'roof') {
        const rx = x + 130 + r() * 20, bot = Math.min(ly, 190) - 20 - r() * 20;
        Block(rx, -1400, 54, 1400 + bot);
        Hook(rx + 27, bot + 85 + r() * 25);
        x = rx + 214 + r() * 30;
        Hook(x, 150 + r() * 60);
      } else if (k === 'chain') {
        const m = 2 + (d > 0.55 ? 1 : 0);
        let px = x + 200;
        for (let j = 0; j < m; j++) { Pad(px, 495 - j * 10, 140 - d * 25, 0.26); if (j < m - 1) px += 300; }
        x = px + 230;
        Hook(x, 170 + r() * 40);
      } else if (k === 'move') {
        const m = 2 + (r() * 2 | 0);
        for (let j = 0; j < m; j++) {
          x += 200 + d * 50 + r() * 30;
          const v = r() < 0.5;
          Hook(x, 190 + r() * 40, v ? 0 : 45 + r() * 25, v ? 55 + r() * 30 : 0, 1.5 + r() * 1.2);
        }
      } else if (k === 'tunnel') {
        const tx = x + 130, len = 560 + r() * 180, top = 110 + r() * 25, gap = 310 - d * 40, m = Math.round((len - 200) / 170) + 1;
        Block(tx, -1400, len, 1400 + top);
        Block(tx, top + gap, len, 1000);
        for (let j = 0; j < m; j++) Hook(tx + 100 + j * (len - 200) / (m - 1), top + 80 + r() * 25);
        x = tx + len + 110;
        Hook(x, top + 90 + r() * 30);
      } else {
        x += 300 + d * 70 + r() * 30;
        Hook(x, 155 + r() * 50);
      }
    }
    x += 185;
    L.finish = x;
    Block(x - 30, 460, 1440, 900);
    Block(x + 1410, -1400, 200, 2760);
    return L;
  }

  const Cl = (v, lo, hi, q) => Math.max(lo, Math.min(hi, Math.round(v / q) * q));
  const Fin = v => typeof v === 'number' && Number.isFinite(v);
  const Rows = (a, n, w) => Array.isArray(a) && a.length <= n && a.every(r => Array.isArray(r) && r.length === w && r.every(Fin));
  function FixPt(a) { a[0] = Cl(a[0], -500, 12000, Q); a[1] = Cl(a[1], -200, 660, Q); return a; }
  function FixH(a) {
    FixPt(a);
    a[2] = Cl(a[2], -400, 400, Q); a[3] = Cl(a[3], -400, 400, Q);
    if (a[2] || a[3]) { a[4] = Cl(a[4], 5, 60, 1); a[5] = Cl(a[5], 0, 15, 1); } else { a[4] = 20; a[5] = 0; }
    return a;
  }
  function FixR(a) { a[0] = Cl(a[0], -2000, 12000, Q); a[1] = Cl(a[1], -1500, 1500, Q); a[2] = Cl(a[2], 10, 4000, Q); a[3] = Cl(a[3], 10, 3000, Q); return a; }
  function FixP(a) { FixPt(a); a[2] = Cl(a[2], 40, 600, Q); a[3] = Cl(a[3], -90, 90, 1); return a; }
  const FIX = { h: FixH, b: FixR, p: FixP, z: FixR };
  function FixSF(d, m) {
    d.s[0] = Cl(d.s[0], -500, 11800, Q); d.s[1] = Cl(d.s[1], -200, 660, Q);
    d.f[0] = Cl(d.f[0], -400, 12000, Q); d.f[1] = Cl(d.f[1], -200, 660, Q);
    if (m === 's') d.s[0] = Math.min(d.s[0], d.f[0] - 100);
    else if (m === 'f') d.f[0] = Math.max(d.f[0], d.s[0] + 100);
  }
  function CleanName(s) { return Array.from(String(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').trim()).slice(0, NAME_MAX).join('').trim(); }

  function Normalize(d) {
    if (!d || typeof d.n !== 'string' || !Fin(d.c) || !Rows([d.s, d.f], 2, 2) || !Rows(d.h, MAX_N.h, 6) || !Rows(d.b, MAX_N.b, 4) || !Rows(d.p, MAX_N.p, 4) || !Rows(d.z, MAX_N.z, 4)) return null;
    if (d.h.length + d.b.length + d.p.length + d.z.length > MAX_ALL) return null;
    const o = { n: CleanName(d.n), c: Cl(d.c, 0, PALS.length - 1, 1), s: d.s.slice(), f: d.f.slice(), h: d.h.map(r => FixH(r.slice())), b: d.b.map(r => FixR(r.slice())), p: d.p.map(r => FixP(r.slice())), z: d.z.map(r => FixR(r.slice())) };
    FixSF(o);
    return o.f[0] - o.s[0] >= 100 ? o : null;
  }

  function PadEnds(r) { const a = r[3] * Math.PI / 180, c = Math.cos(a) * r[2] / 2, s = Math.sin(a) * r[2] / 2; return [r[0] - c, r[1] - s, r[0] + c, r[1] + s]; }

  function BuildCustom(d) {
    if (!_grades.length) _grades = FallbackGrades();
    const Box = ([x, y, w, h]) => ({ x, y, w, h });
    const L = { hooks: [], pads: [], blocks: d.b.map(Box), haz: d.z.map(Box), finish: d.f[0], fy: d.f[1], sx: d.s[0], sy: d.s[1] - 29, pal: PALS[d.c], g: GradeAt(d.h.length * 3 + 1) };
    d.h.forEach(([x, y, ax, ay, sp, ph], i) => {
      const g = GradeAt(i * 5 + 1);
      L.hooks.push({ x, y, bx: x, by: y, ax, ay, sp: ax || ay ? sp / 10 : 0, ph: ph * Math.PI / 8, vx: 0, vy: 0, g, t: String(Math.round((g.Pct ?? 60) / 5)) });
    });
    for (const r of d.p) { const [x1, y1, x2, y2] = PadEnds(r); L.pads.push({ x1, y1, x2, y2, hit: 0 }); }
    return L;
  }

  function Hash(d) {
    const s = JSON.stringify([d.s, d.f, d.h, d.b, d.p, d.z]);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
  }

  const Zz = v => v < 0 ? -v * 2 - 1 : v * 2;
  function Pack(d) {
    const o = [], q = v => Math.round(v / Q);
    const U = v => { while (v > 127) { o.push(v & 127 | 128); v = Math.floor(v / 128); } o.push(v); }, S = v => U(Zz(v));
    const nm = new TextEncoder().encode(d.n);
    U(nm.length); o.push(...nm); U(d.c);
    let px = q(d.s[0]), py = q(d.s[1]);
    S(px); S(py); S(q(d.f[0]) - px); S(q(d.f[1]) - py);
    U(d.h.length);
    for (const [x, y, ax, ay, sp, ph] of d.h) {
      const m = ax || ay ? 1 : 0;
      S(q(x) - px); U(Zz(q(y) - py) * 2 + m);
      px = q(x); py = q(y);
      if (m) { S(q(ax)); S(q(ay)); U(sp); U(ph); }
    }
    for (const t of 'bpz') {
      U(d[t].length);
      for (const [x, y, w, h] of d[t]) {
        S(q(x) - px); S(q(y) - py); U(q(w));
        if (t === 'p') S(h); else U(q(h));
        px = q(x); py = q(y);
      }
    }
    return Uint8Array.from(o);
  }

  function Unpack(u) {
    let i = 0;
    const Bad = m => { throw new Error(m || 'bad'); };
    const U = () => { let v = 0, s = 1, b; do { if (i >= u.length || s > 2097152) Bad(); b = u[i++]; v += (b & 127) * s; s *= 128; } while (b & 128); return v; };
    const S = () => { const v = U(); return v % 2 ? -(v + 1) / 2 : v / 2; };
    const N = t => { const k = U(); if (k > MAX_N[t]) Bad(); return k; };
    const nl = U();
    if (nl > 128 || i + nl > u.length) Bad();
    const n = new TextDecoder('utf-8', { fatal: true }).decode(u.subarray(i, i += nl)), c = U();
    let px = S(), py = S();
    const d = { n, c, s: [px * Q, py * Q], f: [(px + S()) * Q, (py + S()) * Q], h: [], b: [], p: [], z: [] };
    for (let k = N('h'); k > 0; k--) {
      px += S();
      const w = U(), dy = Math.floor(w / 2);
      py += dy % 2 ? -(dy + 1) / 2 : dy / 2;
      d.h.push(w % 2 ? [px * Q, py * Q, S() * Q, S() * Q, U(), U()] : [px * Q, py * Q, 0, 0, 20, 0]);
    }
    for (const t of 'bpz') for (let k = N(t); k > 0; k--) { px += S(); py += S(); d[t].push([px * Q, py * Q, U() * Q, t === 'p' ? S() : U() * Q]); }
    if (i !== u.length || d.h.length + d.b.length + d.p.length + d.z.length > MAX_ALL) Bad();
    return d;
  }

  async function Inflate(z) {
    const rd = new Blob([z]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(), out = new Uint8Array(MAX_RAW);
    let n = 0;
    for (;;) {
      const { done, value } = await rd.read();
      if (done) return out.subarray(0, n);
      if (n + value.length > MAX_RAW) { rd.cancel(); throw new Error('big'); }
      out.set(value, n);
      n += value.length;
    }
  }

  async function Encode(d) {
    const raw = Pack(d);
    let z = null;
    try { z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch (_) {}
    const use = z && z.length < raw.length, out = new Uint8Array((use ? z : raw).length + 1);
    out[0] = use ? 1 : 0;
    out.set(use ? z : raw, 1);
    let s = '';
    for (const c of out) s += String.fromCharCode(c);
    return CODE_PRE + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function Decode(text) {
    const s = String(text).replace(/\s+/g, ''), m = /^GFHOOK(\d+):/i.exec(s);
    if (!m) return { e: 'hk_err_code' };
    if (m[1] !== '1') return { e: 'hk_err_version' };
    const b = s.slice(m[0].length);
    if (b.length > MAX_CODE) return { e: 'hk_err_big' };
    if (!/^[\w-]{4,}$/.test(b)) return { e: 'hk_err_broken' };
    try {
      let u = Uint8Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      if (u[0] > 1) return { e: 'hk_err_broken' };
      u = u[0] ? await Inflate(u.subarray(1)) : u.subarray(1);
      const d = Normalize(Unpack(u));
      return d ? { d } : { e: 'hk_err_broken' };
    } catch (err) {
      return { e: err.message === 'big' ? 'hk_err_big' : 'hk_err_broken' };
    }
  }

  function NewState() {
    return {
      status: 'start', prev: '', level: Unlocked(), lv: null,
      p: { x: 0, y: 0, vx: 0, vy: 0, th: 0, om: 0, hook: null, len: 0, ground: false },
      pts: Array.from({ length: 8 }, () => ({ x: 0, y: 0, ox: 0, oy: 0 })),
      cam: { x: 0, y: 0, z: 1 },
      hold: false, target: null, time: 0, ms: 0, acc: 0, deadT: 0, finT: 0, fade: 0, prog: 0, attempts: 1, rec: false, shake: 0,
      parts: Array.from({ length: 160 }, () => ({ on: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, c: '', s: 2 })), pi: 0,
      conf: Array.from({ length: 150 }, () => ({ on: 0, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 6, h: 3, c: '', t: 0 })), ci: 0,
      pops: Array.from({ length: 6 }, () => ({ on: 0, x: 0, y: 0, t: 0, txt: '', c: '' })), qi: 0,
      trX: new Float32Array(TRAIL), trY: new Float32Array(TRAIL), trN: 0, trH: 0,
      bg: null, dark: false, custom: null, cid: null, test: false, fresh: false, best: 0,
    };
  }

  function LoadLevel(n, again) {
    GS.level = n;
    GS.lv = GS.custom ? BuildCustom(GS.custom) : BuildLevel(n);
    GS.status = 'ready';
    GS.time = 0; GS.ms = 0; GS.acc = 0; GS.deadT = 0; GS.finT = 0; GS.prog = 0; GS.shake = 0;
    GS.hold = false; GS.target = null; GS.trN = 0; GS.bg = null;
    GS.attempts = again ? GS.attempts + 1 : 1;
    GS.fade = again ? 1 : 0;
    Stand();
    Camera(0, true);
  }

  function Stand() {
    const p = GS.p;
    p.x = GS.lv.sx; p.y = GS.lv.sy; p.vx = 0; p.vy = 0; p.th = 0; p.om = 0; p.hook = null; p.len = 0;
    for (let i = 0; i < 8; i++) {
      const q = GS.pts[i];
      q.x = q.ox = p.x + POSE_HANG[i * 2];
      q.y = q.oy = p.y - POSE_HANG[i * 2 + 1];
    }
    for (const q of GS.parts) q.on = 0;
    for (const q of GS.pops) q.on = 0;
    for (const q of GS.conf) q.on = 0;
  }

  function FindHook() {
    const p = GS.p;
    let best = null, bs = 1e9;
    for (const h of GS.lv.hooks) {
      const dx = h.x - p.x, dy = h.y - p.y, d = Math.hypot(dx, dy);
      if (d > REACH) continue;
      const s = d + (dx < 0 ? -dx * 0.9 : 0) + (dy > 0 ? dy * 0.5 : 0);
      if (s < bs) { bs = s; best = h; }
    }
    return best;
  }

  function Grab() {
    const p = GS.p, h = FindHook();
    if (!h) return;
    const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) || 1, tx = -dy / d, ty = dx / d;
    const rx = p.vx - h.vx, ry = p.vy - h.vy, vt = rx * tx + ry * ty;
    const dir = Math.abs(vt) > 40 ? Math.sign(vt) : (tx >= 0 ? 1 : -1);
    const v = Math.min(MAX_V, Math.max(Math.abs(vt), Math.hypot(rx, ry) * 0.8) * 1.04 + 40);
    p.vx = h.vx + tx * dir * v;
    p.vy = h.vy + ty * dir * v;
    p.hook = h;
    p.len = Math.max(30, d);
    Pop(h.x, h.y - 20, h.g.label, GradeColor(h.g.Pct));
    Burst(h.x, h.y, 6, ACCENT, 140);
  }

  function Release() {
    const p = GS.p, sp = Math.hypot(p.vx, p.vy);
    p.hook = null;
    p.om = (p.vx >= 0 ? 1 : -1) * Math.min(12, Math.max(Math.abs(p.om), 3 + sp / 110));
  }

  function Collide(p, lv) {
    for (const b of lv.blocks) {
      if (p.x + CORE_R < b.x || p.x - CORE_R > b.x + b.w || p.y + CORE_R < b.y || p.y - CORE_R > b.y + b.h) continue;
      const cx = Math.max(b.x, Math.min(p.x, b.x + b.w)), cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
      let nx = p.x - cx, ny = p.y - cy, pen;
      const d = Math.hypot(nx, ny);
      if (d > 0) { nx /= d; ny /= d; pen = CORE_R - d; }
      else {
        const l = p.x - b.x, rr = b.x + b.w - p.x, t = p.y - b.y, bt = b.y + b.h - p.y, m = Math.min(l, rr, t, bt);
        if (m === l) { nx = -1; ny = 0; } else if (m === rr) { nx = 1; ny = 0; } else if (m === t) { nx = 0; ny = -1; } else { nx = 0; ny = 1; }
        pen = m + CORE_R;
      }
      if (pen <= 0) continue;
      p.x += nx * pen; p.y += ny * pen;
      const vn = p.vx * nx + p.vy * ny;
      if (vn < 0) {
        p.vx -= nx * vn * 1.4; p.vy -= ny * vn * 1.4;
        if (vn < -320) { Burst(p.x - nx * CORE_R, p.y - ny * CORE_R, 8, GS.dark ? DARK.blockTop : LIGHT.blockTop, 160); GS.shake = Math.min(1, -vn / 1400); }
      }
      if (ny < -0.6) p.ground = true;
    }
    for (const pd of lv.pads) {
      const ex = pd.x2 - pd.x1, ey = pd.y2 - pd.y1, u = Math.max(0, Math.min(1, ((p.x - pd.x1) * ex + (p.y - pd.y1) * ey) / (ex * ex + ey * ey)));
      const qx = pd.x1 + ex * u, qy = pd.y1 + ey * u, rr = CORE_R + PAD_R;
      let nx = p.x - qx, ny = p.y - qy;
      const d = Math.hypot(nx, ny);
      if (d >= rr) continue;
      nx /= d || 1; ny /= d || 1;
      p.x = qx + nx * rr; p.y = qy + ny * rr;
      const vn = p.vx * nx + p.vy * ny;
      if (vn >= 0) continue;
      const tx = -ny, ty = nx, vt = p.vx * tx + p.vy * ty, out = Math.min(1400, Math.max(1080, -vn));
      p.vx = nx * out + tx * vt * 0.7;
      p.vy = ny * out + ty * vt * 0.7;
      p.om = (p.vx >= 0 ? 1 : -1) * Math.min(12, 4 + out / 160);
      pd.hit = 1;
      Burst(qx, qy, 14, GS.dark ? DARK.pad : LIGHT.pad, 260);
    }
    if (GS.status !== 'playing') return;
    for (const z of lv.haz) {
      const cx = Math.max(z.x, Math.min(p.x, z.x + z.w)), cy = Math.max(z.y, Math.min(p.y, z.y + z.h));
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 >= 144) continue;
      Burst(p.x, p.y, 18, GS.dark ? DARK.haz : LIGHT.haz, 260);
      Die();
      return;
    }
  }

  function Spin(p) {
    let t = null, k = 0, c = 0;
    if (p.hook) { t = Math.atan2(p.hook.x - p.x, p.y - p.hook.y) + 0.3; k = 160; c = 18; }
    else if (p.ground) { t = 0; k = 70; c = 14; }
    if (t !== null) {
      let df = (t - p.th) % 6.2832;
      if (df > Math.PI) df -= 6.2832; else if (df < -Math.PI) df += 6.2832;
      p.om += (df * k - p.om * c) * STEP;
    } else p.om *= 0.998;
    p.th += p.om * STEP;
  }

  function Link(ax, ay, q, len) {
    const dx = q.x - ax, dy = q.y - ay, k = len / (Math.hypot(dx, dy) || 1);
    q.x = ax + dx * k; q.y = ay + dy * k;
  }
  function Link2(a, b, len, pinB) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - len) / d;
    if (pinB) { a.x += dx * f; a.y += dy * f; return; }
    a.x += dx * f * 0.5; a.y += dy * f * 0.5;
    b.x -= dx * f * 0.5; b.y -= dy * f * 0.5;
  }

  function Rag() {
    const p = GS.p, P = GS.pts, ux = Math.sin(p.th), uy = -Math.cos(p.th);
    const sx = p.x + ux * 7.5, sy = p.y + uy * 7.5, hx = p.x - ux * 9, hy = p.y - uy * 9;
    const pose = p.hook || GS.status === 'ready' ? POSE_HANG : POSE_FLY, g = GRAV * STEP * STEP;
    for (let i = 0; i < 8; i++) {
      const q = P[i], vx = (q.x - q.ox) * 0.985, vy = (q.y - q.oy) * 0.985, a = pose[i * 2], b = pose[i * 2 + 1];
      q.ox = q.x; q.oy = q.y;
      q.x += vx + (p.x - uy * a + ux * b - q.x) * 0.07;
      q.y += vy + g + (p.y + ux * a + uy * b - q.y) * 0.07;
    }
    const h = p.hook;
    for (let it = 0; it < 3; it++) {
      if (h) {
        const dx = h.x - sx, dy = h.y - sy, d = Math.hypot(dx, dy) || 1, k = Math.max(0, Math.min(ARM * 2 - 0.5, d - 3)) / d;
        P[3].x = sx + dx * k; P[3].y = sy + dy * k;
      }
      Link(sx, sy, P[0], ARM); Link2(P[0], P[1], ARM);
      Link(sx, sy, P[2], ARM); Link2(P[2], P[3], ARM, !!h);
      Link(hx, hy, P[4], LEG); Link2(P[4], P[5], LEG);
      Link(hx, hy, P[6], LEG); Link2(P[6], P[7], LEG);
    }
    for (const b of GS.lv.blocks) {
      if (b.x > p.x + 40 || b.x + b.w < p.x - 40 || b.y > p.y + 40 || b.y + b.h < p.y - 40) continue;
      for (const q of P) {
        if (q.x <= b.x || q.x >= b.x + b.w || q.y <= b.y || q.y >= b.y + b.h) continue;
        const l = q.x - b.x, rr = b.x + b.w - q.x, t = q.y - b.y, bt = b.y + b.h - q.y, m = Math.min(l, rr, t, bt);
        if (m === t) { q.y = b.y; q.ox = q.x - (q.x - q.ox) * 0.6; }
        else if (m === l) q.x = b.x;
        else if (m === rr) q.x = b.x + b.w;
        else q.y = b.y + b.h;
      }
    }
  }

  function Tick() {
    const p = GS.p, lv = GS.lv;
    GS.time += STEP;
    for (const h of lv.hooks) {
      if (!h.sp) continue;
      const s = Math.sin(GS.time * h.sp + h.ph), nx = h.bx + h.ax * s, ny = h.by + h.ay * s;
      h.vx = (nx - h.x) / STEP; h.vy = (ny - h.y) / STEP; h.x = nx; h.y = ny;
    }
    if (GS.status === 'ready') {
      if (!GS.hold) { Rag(); return; }
      GS.status = 'playing';
    }
    if (GS.status === 'dead') return;
    if (GS.status === 'playing') {
      GS.ms += STEP * 1000;
      if (GS.hold && !p.hook) Grab();
      else if (!GS.hold && p.hook) Release();
    }
    const h = p.hook;
    if (h) {
      let a = Math.atan2(p.x - h.x, p.y - h.y), w = ((p.vx - h.vx) * Math.cos(a) - (p.vy - h.vy) * Math.sin(a)) / p.len;
      w = (w - GRAV / p.len * Math.sin(a) * STEP) * DRAG_K;
      if (Math.abs(w) * p.len < PUMP_MAX) w += Math.sign(w || 1) * PUMP / p.len * STEP;
      a += w * STEP;
      const s = Math.sin(a), c = Math.cos(a);
      p.x = h.x + s * p.len; p.y = h.y + c * p.len;
      p.vx = h.vx + c * w * p.len; p.vy = h.vy - s * w * p.len;
    } else {
      p.vy += GRAV * STEP;
      p.vx *= DRAG_K; p.vy *= DRAG_K;
      p.x += p.vx * STEP; p.y += p.vy * STEP;
    }
    p.ground = false;
    Collide(p, lv);
    if (p.ground && !h) p.vx *= 0.97;
    if (GS.status === 'finish' || GS.status === 'complete') p.vx *= 0.993;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > MAX_V) { p.vx *= MAX_V / sp; p.vy *= MAX_V / sp; }
    Spin(p);
    if (GS.status === 'playing') {
      if (p.y > KILL_Y) Die();
      else if (p.x > lv.finish) Finish();
    }
    Rag();
  }

  function Die() {
    GS.status = 'dead';
    GS.deadT = 0;
    GS.p.hook = null;
  }

  function Finish() {
    GS.status = 'finish';
    GS.finT = 0;
    GS.hold = false;
    GS.p.hook = null;
    GS.prog = 1;
    if (GS.custom) CustomDone();
    else {
      const n = GS.level, times = Times(), prev = times[n];
      GS.rec = !prev || GS.ms < prev;
      if (GS.rec) { times[n] = Math.round(GS.ms); StorageSet(LS_TIMES, times); }
      const next = Math.min(LEVELS, n + 1);
      if (next > Unlocked()) StorageSet(LS_LEVEL, next);
      if (next > LoadBest()) StorageSet(LS_BEST, next);
    }
    for (let i = 0; i < 140; i++) {
      const q = GS.conf[GS.ci = (GS.ci + 1) % GS.conf.length], left = i % 2 === 0;
      const a = -Math.PI / 2 + (left ? 0.35 : -0.35) + (Math.random() - 0.5) * 0.7, v = 520 + Math.random() * 480;
      q.on = 1; q.t = 0;
      q.x = left ? -10 : CV_W + 10; q.y = CV_H - 20;
      q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v;
      q.a = Math.random() * 6.28; q.va = (Math.random() - 0.5) * 16;
      q.w = 5 + Math.random() * 5; q.h = 3 + Math.random() * 3;
      q.c = CONF_COLORS[i % CONF_COLORS.length];
    }
  }

  function CustomDone() {
    const a = Customs(), r = a.find(x => x.id === GS.cid), h = Hash(GS.custom), ms = Math.round(GS.ms), prev = r && r.v === h ? r.bt : 0;
    GS.rec = !prev || ms < prev;
    GS.fresh = !r || r.v !== h;
    GS.best = GS.rec ? ms : prev;
    if (r) { r.v = h; r.bt = GS.best; SaveCustoms(a); }
    if (GS.test && ED) ED.v = h;
  }

  function Burst(x, y, n, c, sp) {
    for (let i = 0; i < n; i++) {
      const q = GS.parts[GS.pi = (GS.pi + 1) % GS.parts.length], a = Math.random() * 6.2832, v = sp * (0.35 + Math.random() * 0.8);
      q.on = 1; q.x = x; q.y = y; q.t = 0; q.c = c;
      q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v - sp * 0.3;
      q.life = 0.35 + Math.random() * 0.35; q.s = 2 + Math.random() * 2.5;
    }
  }

  function Pop(x, y, txt, c) {
    const q = GS.pops[GS.qi = (GS.qi + 1) % GS.pops.length];
    q.on = 1; q.x = x; q.y = y; q.t = 0; q.txt = txt; q.c = c;
  }

  function Camera(s, snap) {
    const p = GS.p, c = GS.cam, sp = Math.hypot(p.vx, p.vy);
    const tz = Math.max(0.8, Math.min(1, 1.12 - sp / 2200));
    const tx = p.x + 110 + Math.max(-80, Math.min(170, p.vx * 0.25));
    const ty = p.y * 0.5 + 125 + Math.max(-40, Math.min(90, p.vy * 0.12));
    const a = snap ? 1 : 1 - Math.exp(-s * 4.5), b = snap ? 1 : 1 - Math.exp(-s * 4), e = snap ? 1 : 1 - Math.exp(-s * 1.4);
    c.z += (tz - c.z) * e;
    c.x += (tx - c.x) * a;
    c.y += (ty - c.y) * b;
    c.y = Math.min(c.y, 640 - CV_H / 2 / c.z);
    c.x = Math.max(c.x, GS.lv.sx - 230 + CV_W / 2 / c.z);
  }

  function Update(dt) {
    const s = dt / 1000, p = GS.p;
    GS.acc += s;
    while (GS.acc >= STEP) { GS.acc -= STEP; Tick(); }
    if (GS.status === 'dead' && (GS.deadT += s) > 0.36) LoadLevel(GS.level, true);
    if (GS.fade > 0) GS.fade = Math.max(0, GS.fade - s * 3.5);
    if (GS.status === 'finish' && (GS.finT += s) > 1.1) ShowDone();
    GS.target = !p.hook && (GS.status === 'ready' || GS.status === 'playing') ? FindHook() : null;
    if (GS.status === 'playing') GS.prog = Math.max(GS.prog, Math.min(1, (p.x - GS.lv.sx) / (GS.lv.finish - GS.lv.sx)));
    Camera(s, false);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 560 && GS.status !== 'ready' && GS.status !== 'dead') {
      GS.trH = (GS.trH + 1) % TRAIL; GS.trX[GS.trH] = p.x; GS.trY[GS.trH] = p.y; GS.trN = Math.min(TRAIL, GS.trN + 1);
    } else if (GS.trN) GS.trN--;
    for (const q of GS.parts) {
      if (!q.on) continue;
      if ((q.t += s) > q.life) { q.on = 0; continue; }
      q.x += q.vx * s; q.y += q.vy * s; q.vy += 900 * s;
    }
    for (const q of GS.pops) if (q.on && (q.t += s) > 0.9) q.on = 0;
    const fr = Math.exp(-1.6 * s);
    for (const q of GS.conf) {
      if (!q.on) continue;
      q.t += s; q.vy += 620 * s; q.vx *= fr; q.vy *= fr;
      q.x += (q.vx + Math.sin(q.t * 7 + q.a) * 40) * s; q.y += q.vy * s; q.a += q.va * s;
      if (q.y > CV_H + 30) q.on = 0;
    }
    for (const pd of GS.lv.pads) if (pd.hit > 0) pd.hit = Math.max(0, pd.hit - s * 1.8);
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - s * 3);
  }

  function Fmt(ms) { return ms == null ? '-' : `${(ms / 1000).toFixed(2)}s`; }

  function RR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function Hills(ctx, pal, c) {
    ctx.fillStyle = GS.dark ? DARK.cloud : LIGHT.cloud;
    const csx = c.x * 0.05, ci0 = Math.floor(csx / 340);
    ctx.beginPath();
    for (let i = ci0 - 1; i < ci0 + 4; i++) {
      const x = i * 340 - csx + ((i * 53) % 5 + 5) % 5 * 24, y = 70 + ((i * 29) % 4 + 4) % 4 * 26 + (300 - c.y) * 0.05;
      ctx.moveTo(x + 34, y); ctx.arc(x, y, 34, 0, 6.2832);
      ctx.moveTo(x + 62, y + 10); ctx.arc(x + 36, y + 10, 26, 0, 6.2832);
      ctx.moveTo(x - 14, y + 12); ctx.arc(x - 40, y + 12, 26, 0, 6.2832);
    }
    ctx.fill();
    for (let l = 0; l < 2; l++) {
      const per = l ? 300 : 460, par = l ? 0.28 : 0.12, base = CV_H + (l ? 110 : 190) + (300 - c.y) * (l ? 0.2 : 0.1), sx = c.x * par, i0 = Math.floor(sx / per);
      ctx.fillStyle = pal[2 + l];
      ctx.beginPath();
      for (let i = i0 - 1; i < i0 + CV_W / per + 2; i++) {
        const rad = (l ? 140 : 240) + ((i * 7919) % 4 + 4) % 4 * (l ? 18 : 30), x = i * per - sx + ((i * 31) % 3 + 3) % 3 * 24;
        ctx.moveTo(x + rad, base); ctx.arc(x, base, rad, 0, 6.2832);
      }
      ctx.fill();
    }
  }

  function DrawWorld(ctx, C, vl, vr, vt) {
    const lv = GS.lv, p = GS.p, f = lv.finish, fy = lv.fy, now = GS.time;
    if (f + 20 > vl && f - 20 < vr) {
      const sz = 14, top = Math.floor(Math.max(vt, -1400) / sz) * sz;
      ctx.fillStyle = C.chkA; ctx.fillRect(f - sz, top, sz * 2, fy - top);
      ctx.fillStyle = C.chkB;
      for (let y = top; y < fy; y += sz) ctx.fillRect(f - sz + ((y / sz) & 1) * sz, y, sz, sz);
      const g = lv.g, gx = f + 150;
      ctx.fillStyle = C.post; ctx.fillRect(gx - 3, fy - 60, 6, 60);
      ctx.fillStyle = C.sign; RR(ctx, gx - 46, fy - 98, 92, 42, 10); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = GradeColor(g.Pct); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = GradeColor(g.Pct); ctx.font = F_SIGN; ctx.fillText(g.label, gx, fy - 82);
      ctx.fillStyle = C.hudSub; ctx.font = F_SMALL; ctx.fillText(g.subject.slice(0, 14), gx, fy - 66);
    }
    ctx.fillStyle = C.block;
    for (const b of lv.blocks) { if (b.x < vr && b.x + b.w > vl) { RR(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill(); } }
    ctx.fillStyle = C.blockTop;
    for (const b of lv.blocks) { if (b.x < vr && b.x + b.w > vl) { RR(ctx, b.x + 4, b.y + 4, b.w - 8, 5, 3); ctx.fill(); } }
    if (lv.haz.length) {
      ctx.fillStyle = C.haz;
      ctx.beginPath();
      for (const z of lv.haz) if (z.x < vr && z.x + z.w > vl) HazPath(ctx, z);
      ctx.fill();
      ctx.fillStyle = C.hazTop;
      for (const z of lv.haz) if (z.x < vr && z.x + z.w > vl) ctx.fillRect(z.x + 2, z.y + 4, z.w - 4, 2);
    }
    ctx.lineCap = 'round';
    for (const pd of lv.pads) {
      if (pd.x2 < vl || pd.x1 > vr) continue;
      const mx = (pd.x1 + pd.x2) / 2, my = (pd.y1 + pd.y2) / 2, ex = pd.x2 - pd.x1, ey = pd.y2 - pd.y1, el = Math.hypot(ex, ey), nx = ey / el, ny = -ex / el;
      const dip = pd.hit > 0 ? Math.sin((1 - pd.hit) * 16) * pd.hit * 11 : 0;
      ctx.strokeStyle = C.post; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(pd.x1 + ex * 0.12, pd.y1 + ey * 0.12); ctx.lineTo(pd.x1 + ex * 0.12, pd.y1 + ey * 0.12 + 26);
      ctx.moveTo(pd.x2 - ex * 0.12, pd.y2 - ey * 0.12); ctx.lineTo(pd.x2 - ex * 0.12, pd.y2 - ey * 0.12 + 26); ctx.stroke();
      ctx.strokeStyle = C.pad; ctx.lineWidth = PAD_R * 2;
      ctx.beginPath(); ctx.moveTo(pd.x1, pd.y1); ctx.quadraticCurveTo(mx - nx * dip * 2, my - ny * dip * 2, pd.x2, pd.y2); ctx.stroke();
      ctx.strokeStyle = C.padTop; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pd.x1 + nx * 3.5, pd.y1 + ny * 3.5); ctx.quadraticCurveTo(mx - nx * (dip * 2 - 3.5), my - ny * (dip * 2 - 3.5), pd.x2 + nx * 3.5, pd.y2 + ny * 3.5); ctx.stroke();
    }
    ctx.strokeStyle = C.rail; ctx.lineWidth = 3; ctx.setLineDash([2, 7]);
    ctx.beginPath();
    for (const h of lv.hooks) {
      if (!h.sp || h.bx < vl || h.bx > vr) continue;
      ctx.moveTo(h.bx - h.ax, h.by - h.ay); ctx.lineTo(h.bx + h.ax, h.by + h.ay);
    }
    ctx.stroke(); ctx.setLineDash([]);
    const live = GS.status === 'ready' || GS.status === 'playing';
    for (const h of lv.hooks) {
      if (h.x < vl || h.x > vr || !live || p.hook) continue;
      if (Math.hypot(h.x - p.x, h.y - p.y) > REACH) continue;
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now * 6 + h.bx);
      ctx.drawImage(_glow, h.x - 34, h.y - 34, 68, 68);
    }
    ctx.globalAlpha = 1;
    ctx.font = F_HOOK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const h of lv.hooks) {
      if (h.x < vl || h.x > vr) continue;
      ctx.drawImage(_ball, h.x - 14, h.y - 14, 28, 28);
      ctx.fillStyle = '#fff';
      ctx.fillText(h.t, h.x, h.y + 0.5);
    }
    const t = p.hook || GS.target;
    if (t) {
      ctx.strokeStyle = p.hook ? ACCENT : C.man; ctx.lineWidth = 2.5;
      if (!p.hook) { ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 24; }
      ctx.beginPath(); ctx.arc(t.x, t.y, 19.5 + (p.hook ? 0 : Math.sin(now * 8) * 1.5), 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    if (GS.trN > 3) {
      const n = GS.trN, X = GS.trX, Y = GS.trY, at = i => (GS.trH - Math.max(0, Math.min(n - 1, i)) + TRAIL) % TRAIL;
      ctx.fillStyle = C.trail;
      ctx.beginPath();
      for (let j = 0; j < n * 2; j++) {
        const side = j < n ? 1 : -1, i = j < n ? j : n * 2 - 1 - j, a = at(i), f = at(i - 1), b = at(i + 1);
        const dx = X[f] - X[b], dy = Y[f] - Y[b], l = Math.hypot(dx, dy) || 1, w = 8 * (1 - i / n) * side;
        if (j) ctx.lineTo(X[a] - dy / l * w, Y[a] + dx / l * w); else ctx.moveTo(X[a] - dy / l * w, Y[a] + dx / l * w);
      }
      ctx.fill();
    }
    DrawMan(ctx, C);
    for (const q of GS.parts) {
      if (!q.on) continue;
      ctx.globalAlpha = 1 - q.t / q.life;
      ctx.fillStyle = q.c;
      ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
    }
    ctx.globalAlpha = 1;
    ctx.font = F_POP;
    for (const q of GS.pops) {
      if (!q.on) continue;
      ctx.globalAlpha = Math.min(1, (0.9 - q.t) * 3);
      ctx.fillStyle = q.c;
      ctx.fillText(q.txt, q.x, q.y - q.t * 34);
    }
    ctx.globalAlpha = 1;
  }

  function HazPath(ctx, z) {
    const n = Math.max(1, Math.round(z.w / 14)), s = z.w / n, b = z.y + z.h;
    ctx.moveTo(z.x, z.y + 3);
    for (let i = 0; i < n; i++) { ctx.lineTo(z.x + s * (i + 0.5), z.y - 7); ctx.lineTo(z.x + s * (i + 1), z.y + 3); }
    ctx.lineTo(z.x + z.w, b - 3);
    for (let i = n; i > 0; i--) { ctx.lineTo(z.x + s * (i - 0.5), b + 7); ctx.lineTo(z.x + s * (i - 1), b - 3); }
    ctx.closePath();
  }

  function DrawMan(ctx, C) {
    const p = GS.p, P = GS.pts, ux = Math.sin(p.th), uy = -Math.cos(p.th);
    const sx = p.x + ux * 7.5, sy = p.y + uy * 7.5, hx = p.x - ux * 9, hy = p.y - uy * 9;
    if (p.hook) {
      ctx.strokeStyle = C.rope; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P[3].x, P[3].y); ctx.lineTo(p.hook.x, p.hook.y); ctx.stroke();
    }
    ctx.strokeStyle = C.man; ctx.fillStyle = C.man; ctx.lineWidth = 4.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x + ux * 9, p.y + uy * 9); ctx.lineTo(hx, hy);
    ctx.moveTo(sx, sy); ctx.lineTo(P[0].x, P[0].y); ctx.lineTo(P[1].x, P[1].y);
    ctx.moveTo(sx, sy); ctx.lineTo(P[2].x, P[2].y); ctx.lineTo(P[3].x, P[3].y);
    ctx.moveTo(hx, hy); ctx.lineTo(P[4].x, P[4].y); ctx.lineTo(P[5].x, P[5].y);
    ctx.moveTo(hx, hy); ctx.lineTo(P[6].x, P[6].y); ctx.lineTo(P[7].x, P[7].y);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x + ux * 16, p.y + uy * 16, 6.4, 0, 6.2832); ctx.fill();
  }

  function Badge(ctx, x, y, txt, on, C) {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.2832);
    ctx.fillStyle = on ? ACCENT : C.badge; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = ACCENT; ctx.stroke();
    if (txt) {
      ctx.fillStyle = on ? '#fff' : ACCENT; ctx.font = F_BADGE;
      ctx.fillText(txt, x, y + 0.5);
      return;
    }
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.chkB;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) & 1) ctx.fillRect(x - 14 + i * 7, y - 14 + j * 7, 7, 7);
    ctx.restore();
  }

  function Hud(ctx, C) {
    const n = GS.level, cu = GS.custom, cx = CV_W / 2, y = 26, bw = 200;
    ctx.fillStyle = C.track; RR(ctx, cx - bw / 2, y - 4, bw, 8, 4); ctx.fill();
    if (GS.prog > 0) { ctx.fillStyle = ACCENT; RR(ctx, cx - bw / 2, y - 4, Math.max(8, bw * GS.prog), 8, 4); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Badge(ctx, cx - bw / 2 - 16, y, cu ? ' ' : String(n), true, C);
    Badge(ctx, cx + bw / 2 + 16, y, !cu && n < LEVELS ? String(n + 1) : '', false, C);
    ctx.fillStyle = C.hud; ctx.font = F_TIME; ctx.textAlign = 'right';
    ctx.fillText(Fmt(GS.ms), CV_W - 16, y);
    ctx.fillStyle = C.hudSub; ctx.font = F_SUB; ctx.textAlign = 'left';
    if (cu) {
      const nm = Array.from(LevelName(cu));
      ctx.fillText(`${GS.test ? `${_txt.test} · ` : ''}${nm.length > 18 ? `${nm.slice(0, 17).join('')}…` : nm.join('')}`.toUpperCase(), 16, y);
      if (GS.test) { ctx.textAlign = 'right'; ctx.fillText(_txt.esc, CV_W - 16, y + 20); ctx.textAlign = 'left'; }
    } else ctx.fillText(`${_txt.level.toUpperCase()} ${n}`, 16, y);
    if (GS.attempts > 1) ctx.fillText(`${_txt.tries} ${GS.attempts}`, 16, y + 17);
    if (GS.status === 'ready') {
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(GS.time * 5);
      ctx.font = F_HINT; ctx.textAlign = 'center';
      const w = ctx.measureText(_txt.hold).width + 40;
      ctx.fillStyle = C.pill; RR(ctx, cx - w / 2, CV_H - 58, w, 32, 16); ctx.fill();
      ctx.fillStyle = C.pillTxt; ctx.fillText(_txt.hold, cx, CV_H - 41.5);
      ctx.globalAlpha = 1;
    }
  }

  function Draw() {
    if (!_ctx || !GS || !GS.lv) return;
    if (GS.status === 'editor') { DrawEditor(); return; }
    const ctx = _ctx, dark = _root.dataset.theme === 'dark', C = dark ? DARK : LIGHT, c = GS.cam, z = c.z, pal = dark ? NIGHT : GS.lv.pal;
    Sky(ctx, dark, pal);
    Hills(ctx, pal, c);
    const sh = GS.shake, ox = sh ? (Math.random() - 0.5) * sh * 9 : 0, oy = sh ? (Math.random() - 0.5) * sh * 9 : 0;
    ctx.setTransform(_k * z, 0, 0, _k * z, _k * (CV_W / 2 - c.x * z + ox), _k * (CV_H / 2 - c.y * z + oy));
    const hw = CV_W / 2 / z + 60;
    DrawWorld(ctx, C, c.x - hw, c.x + hw, c.y - CV_H / 2 / z - 60);
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    Hud(ctx, C);
    for (const q of GS.conf) {
      if (!q.on) continue;
      ctx.setTransform(_k * Math.cos(q.a), _k * Math.sin(q.a), -_k * Math.sin(q.a), _k * Math.cos(q.a), _k * q.x, _k * q.y);
      ctx.fillStyle = q.c;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
    }
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    const fa = GS.status === 'dead' ? Math.min(1, GS.deadT / 0.36) : GS.fade;
    if (fa > 0) {
      ctx.globalAlpha = fa * 0.8;
      ctx.fillStyle = C.fade;
      ctx.fillRect(0, 0, CV_W, CV_H);
      ctx.globalAlpha = 1;
    }
  }

  function Sky(ctx, dark, pal) {
    if (!GS.bg || GS.dark !== dark) {
      GS.dark = dark;
      GS.bg = ctx.createLinearGradient(0, 0, 0, CV_H);
      GS.bg.addColorStop(0, pal[0]); GS.bg.addColorStop(1, pal[1]);
    }
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    ctx.fillStyle = GS.bg; ctx.fillRect(0, 0, CV_W, CV_H);
  }

  function MakeSprites() {
    _ball = document.createElement('canvas');
    _ball.width = _ball.height = 72;
    let c = _ball.getContext('2d');
    c.scale(3, 3);
    c.fillStyle = '#9d174d'; c.beginPath(); c.arc(12, 13, 10, 0, 6.2832); c.fill();
    c.fillStyle = ACCENT; c.beginPath(); c.arc(12, 12, 10, 0, 6.2832); c.fill();
    const g = c.createRadialGradient(8.5, 8, 0.5, 12, 12, 10);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.55, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(12, 12, 10, 0, 6.2832); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.4; c.beginPath(); c.arc(12, 12, 7.6, 0, 6.2832); c.stroke();
    _glow = document.createElement('canvas');
    _glow.width = _glow.height = 120;
    c = _glow.getContext('2d');
    const gg = c.createRadialGradient(60, 60, 8, 60, 60, 60);
    gg.addColorStop(0, 'rgba(236,72,153,0.6)'); gg.addColorStop(0.45, 'rgba(236,72,153,0.22)'); gg.addColorStop(1, 'rgba(236,72,153,0)');
    c.fillStyle = gg; c.fillRect(0, 0, 120, 120);
  }

  function StartLoop() {
    if (_raf) return;
    _last = performance.now();
    _raf = requestAnimationFrame(Frame);
  }
  function Frame(ts) {
    _raf = null;
    if (!GS || !RUN[GS.status]) return;
    const dt = Math.min(50, Math.max(0, ts - _last));
    _last = ts;
    Update(dt);
    Draw();
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-hk-start', 'gf-hk-levels', 'gf-hk-pause', 'gf-hk-done', 'gf-hk-custom', 'gf-hk-ed', 'gf-hk-code'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
    if (id !== 'gf-hk-ed' && _root.dataset.ed) { delete _root.dataset.ed; _view.style.cursor = _cur = ''; }
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    StopLoop();
    GS = NewState();
    LoadLevel(GS.level);
    GS.status = 'start';
    SetText('gf-hk-best', LoadBest());
    SetText('gf-hk-play-lvl', `${_txt.level} ${GS.level}`);
    Draw();
    ShowScreen('gf-hk-start');
  }

  function ShowLevels() {
    if (!GS) return;
    StopLoop();
    if (GS.status !== 'paused') GS.prev = GS.status;
    GS.status = 'levels';
    const un = Unlocked(), times = Times(), grid = document.getElementById('gf-hk-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= LEVELS; i++) {
      const b = document.createElement('button');
      b.className = 'gf-hk-lv' + (i === un ? ' gf-hk-lv-cur' : '') + (times[i] ? ' gf-hk-lv-done' : '');
      b.disabled = i > un;
      b.innerHTML = `<b>${i}</b><small>${times[i] ? Fmt(times[i]) : i > un ? '' : '-'}</small>`;
      b.addEventListener('click', () => Play(i));
      grid.appendChild(b);
    }
    ShowScreen('gf-hk-levels');
  }

  function ShowDone() {
    const n = GS.level, cu = GS.custom, last = !cu && n >= LEVELS, g = GS.lv.g;
    GS.status = 'complete';
    SetText('gf-hk-done-title', _GameText(cu && GS.fresh ? 'hk_verified' : last ? 'hk_all_clear' : 'hk_level_clear'));
    SetText('gf-hk-done-time', Fmt(GS.ms));
    SetText('gf-hk-done-best', Fmt(cu ? GS.best : Times()[n]));
    SetText('gf-hk-done-tries', GS.attempts);
    SetText('gf-hk-best', LoadBest());
    const chip = document.getElementById('gf-hk-done-grade');
    chip.textContent = `${g.subject} ${g.label}`;
    chip.style.color = GradeColor(g.Pct);
    chip.style.borderColor = GradeColor(g.Pct);
    document.getElementById('gf-hk-done-new').style.display = GS.rec ? 'block' : 'none';
    document.getElementById('gf-hk-done-share').style.display = cu && GS.fresh ? 'block' : 'none';
    const nx = document.getElementById('gf-hk-next');
    nx.style.display = last || cu && !GS.test ? 'none' : '';
    nx.textContent = GS.test ? _GameText('hk_back_editor') : `${_GameText('hk_next_level')}\u00a0 ▶`;
    document.getElementById('gf-hk-dcode').style.display = cu ? '' : 'none';
    document.getElementById('gf-hk-lvls3').style.display = GS.test ? 'none' : '';
    MenuLabel('gf-hk-lvls3');
    ShowScreen('gf-hk-done');
  }

  function MenuLabel(id) { SetText(id, _GameText(GS.test ? 'hk_editor' : GS.custom ? 'hk_custom' : 'game_levels')); }
  function ToMenu() { if (GS.test) EdReturn(); else if (GS.custom) ShowCustom(); else ShowLevels(); }

  function Play(n) {
    if (!GS) GS = NewState();
    LoadLevel(Math.max(1, Math.min(LEVELS, n)));
    ShowScreen(null);
    StartLoop();
  }

  function Restart() {
    if (!GS || !RUN[GS.status] && GS.status !== 'paused') return;
    LoadLevel(GS.level, true);
    ShowScreen(null);
    StartLoop();
  }

  function Next() {
    if (!GS || GS.status !== 'complete') return;
    if (GS.test) EdReturn();
    else if (!GS.custom && GS.level < LEVELS) Play(GS.level + 1);
  }

  function DoPause() {
    if (!GS) return;
    const st = GS.status;
    if (st === 'ready' || st === 'playing' || st === 'dead') {
      GS.prev = st; GS.status = 'paused'; GS.hold = false;
      StopLoop(); Draw();
      MenuLabel('gf-hk-lvls2');
      ShowScreen('gf-hk-pause');
    } else if (st === 'paused') {
      GS.status = GS.prev || 'ready';
      ShowScreen(null);
      StartLoop();
    }
  }

  function BackFromLevels() {
    const pv = GS.prev;
    if (pv === 'complete') { GS.status = 'complete'; ShowScreen('gf-hk-done'); StartLoop(); }
    else if (pv === 'ready' || pv === 'playing' || pv === 'dead') { GS.status = 'paused'; ShowScreen('gf-hk-pause'); }
    else ShowStart();
  }

  function Customs() {
    const a = StorageGet(LS_CUSTOM, []);
    return Array.isArray(a) ? a.filter(r => r && typeof r.id === 'string' && (r.d = Normalize(r.d))) : [];
  }
  function SaveCustoms(a) { StorageSet(LS_CUSTOM, a); }
  function IsOk(r) { return !!r && r.v === Hash(r.d); }
  function LevelName(d) { return d.n || _GameText('hk_untitled'); }
  function NewId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function Esc(s) { return String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`); }
  function ById(id) { return document.getElementById(id); }

  function Toast(msg, bad) {
    const t = ById('gf-hk-toast');
    t.textContent = msg;
    t.className = bad ? 'on bad' : 'on';
    clearTimeout(_toastT);
    _toastT = setTimeout(() => { t.className = bad ? 'bad' : ''; }, 2200);
  }

  function Arm(b, fn) {
    if (b.classList.contains('arm')) { b.classList.remove('arm'); fn(); return; }
    _root.querySelectorAll('.arm').forEach(x => x.classList.remove('arm'));
    b.classList.add('arm');
    Toast(_GameText('hk_confirm'));
    clearTimeout(_armT);
    _armT = setTimeout(() => b.classList.remove('arm'), 2500);
  }

  async function Clip(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (_) {}
    const ta = document.createElement('textarea');
    ta.value = s;
    ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
    _root.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }

  async function CopyCode(d) {
    const code = await Encode(d);
    if (await Clip(code)) Toast(_GameText('hk_copied'));
    else OpenCode(code);
  }

  function CodeOpen() { return !!_root && ById('gf-hk-code').style.display !== 'none'; }
  function OpenCode(code) {
    const T = _GameText, imp = code == null, ta = ById('gf-hk-code-in');
    _codeMode = imp ? 'imp' : 'exp';
    SetText('gf-hk-code-h', T(imp ? 'hk_import' : 'hk_code_title'));
    SetText('gf-hk-code-sub', T(imp ? 'hk_import_sub' : 'hk_copy_manual'));
    SetText('gf-hk-code-ok', T(imp ? 'hk_import_btn' : 'hk_copy'));
    SetText('gf-hk-code-x', T(imp ? 'hk_cancel' : 'hk_close'));
    SetText('gf-hk-code-err', '');
    ta.readOnly = !imp;
    ta.value = imp ? '' : code;
    ById('gf-hk-code').style.display = 'flex';
    ta.focus();
    if (!imp) ta.select();
  }
  function CloseCode() { ById('gf-hk-code').style.display = 'none'; }

  async function CodeOk() {
    const ta = ById('gf-hk-code-in');
    if (_codeMode === 'exp') {
      ta.select();
      if (await Clip(ta.value)) { CloseCode(); Toast(_GameText('hk_copied')); }
      return;
    }
    if (_busy) return;
    _busy = true;
    const res = await Decode(ta.value);
    _busy = false;
    if (res.e) { SetText('gf-hk-code-err', _GameText(res.e)); ta.focus(); return; }
    const a = Customs(), j = JSON.stringify(res.d), dup = a.find(r => JSON.stringify(r.d) === j);
    if (dup) { ShowCustom(dup.id); Toast(_GameText('hk_already')); return; }
    if (a.length >= MAX_CUSTOM) { SetText('gf-hk-code-err', _GameText('hk_err_full')); return; }
    const r = { id: NewId(), d: res.d, v: Hash(res.d), bt: 0, im: 1, at: Date.now() };
    a.push(r);
    SaveCustoms(a);
    ShowCustom(r.id);
    Toast(_GameText('hk_imported'));
  }

  function ShowCustom(flash) {
    if (!GS) GS = NewState();
    StopLoop();
    GS.status = 'custom'; GS.custom = null; GS.test = false; GS.hold = false;
    RenderList(flash);
    ShowScreen('gf-hk-custom');
  }

  function RenderList(flash) {
    const T = _GameText, a = Customs(), el = ById('gf-hk-clist');
    el.innerHTML = a.length ? a.map(r => {
      const ok = IsOk(r), nm = Esc(LevelName(r.d));
      const tags = (r.im ? `<span class="gf-hk-tag gf-hk-tag-im">${T('hk_imported_tag')}</span>` : '')
        + (!ok ? `<span class="gf-hk-tag">${T('hk_not_cleared')}</span>` : r.bt ? `<span class="gf-hk-tag gf-hk-tag-ok">${T('hk_cleared')} · ${Fmt(r.bt)}</span>` : '');
      return `<div class="gf-hk-ci${r.id === flash ? ' gf-hk-flash' : ''}" data-id="${Esc(r.id)}">
        <div class="gf-hk-ci-m"><div class="gf-hk-ci-n" title="${nm}">${nm}</div><div class="gf-hk-ci-s">${tags}<span>${r.d.h.length} ${T('hk_hooks')}</span></div></div>
        <button class="gf-hk-sb" data-act="play">${IC.play}${T('game_play')}</button>
        <button class="gf-hk-ib" data-act="edit" title="${T('hk_edit')}">${IC.edit}</button>
        <button class="gf-hk-ib${ok ? '' : ' off'}" data-act="code" title="${T(ok ? 'hk_copy_code' : 'hk_need_clear')}">${IC.code}</button>
        <button class="gf-hk-ib" data-act="ren" title="${T('hk_rename')}">${IC.ren}</button>
        <button class="gf-hk-ib" data-act="dup" title="${T('hk_duplicate')}">${IC.dup}</button>
        <button class="gf-hk-ib gf-hk-ib-del" data-act="del" title="${T('hk_delete')}">${IC.del}</button>
      </div>`;
    }).join('') : `<div class="gf-hk-empty">${T('hk_no_custom')}</div>`;
    if (flash) [...el.children].find(c => c.dataset.id === flash)?.scrollIntoView({ block: 'nearest' });
  }

  function OnListClick(e) {
    const b = e.target.closest('button[data-act]'), row = b && b.closest('.gf-hk-ci');
    if (!row) return;
    const a = Customs(), i = a.findIndex(r => r.id === row.dataset.id), r = a[i], act = b.dataset.act;
    if (!r) return;
    if (act === 'play') PlayCustom(r);
    else if (act === 'edit') OpenEditor(r.id);
    else if (act === 'code') { if (IsOk(r)) CopyCode(r.d); else Toast(_GameText('hk_need_clear'), 1); }
    else if (act === 'ren') RenameStart(row, r);
    else if (act === 'dup') {
      if (a.length >= MAX_CUSTOM) { Toast(_GameText('hk_err_full'), 1); return; }
      const c = { ...r, id: NewId(), at: Date.now(), d: { ...r.d, n: CleanName(`${LevelName(r.d)} (${_GameText('hk_copy_suffix')})`) } };
      a.splice(i + 1, 0, c);
      SaveCustoms(a);
      RenderList(c.id);
    } else if (act === 'del') Arm(b, () => { a.splice(i, 1); SaveCustoms(a); RenderList(); });
  }

  function RenameStart(row, r) {
    const n = row.querySelector('.gf-hk-ci-n'), inp = document.createElement('input');
    inp.className = 'gf-hk-ren';
    inp.maxLength = NAME_MAX;
    inp.spellcheck = false;
    inp.value = r.d.n;
    n.replaceWith(inp);
    inp.focus();
    inp.select();
    inp.addEventListener('blur', () => RenameDone(inp, true));
  }
  function RenameDone(inp, save) {
    if (inp.dataset.done) return;
    inp.dataset.done = '1';
    const id = inp.closest('.gf-hk-ci').dataset.id, a = Customs(), r = a.find(x => x.id === id), n = CleanName(inp.value);
    if (save && r && n && n !== r.d.n) { r.d.n = n; SaveCustoms(a); }
    RenderList();
  }

  function PlayCustom(r) {
    GS.custom = r.d; GS.cid = r.id; GS.test = false;
    LoadLevel(1);
    ShowScreen(null);
    StartLoop();
  }

  function Blank() {
    return { n: `${_GameText('hk_my_level')} ${Customs().length + 1}`, c: 0, s: [60, 400], f: [780, 460],
      h: [[220, 200, 0, 0, 20, 0], [400, 175, 0, 0, 20, 0], [580, 200, 0, 0, 20, 0]],
      b: [[-240, 400, 310, 300], [750, 460, 700, 300]], p: [], z: [] };
  }

  function OpenEditor(id) {
    if (!GS) GS = NewState();
    StopLoop();
    const r = id ? Customs().find(x => x.id === id) : null, d = r ? r.d : Blank();
    ED = { id: r ? r.id : null, d, v: r ? r.v : '', last: JSON.stringify(d), undo: [], redo: [], sel: null, tool: 'sel', hov: null, drag: null, ptr: null, space: false, snap: StorageGet(LS_SNAP, true) !== false, x: 0, y: 0, z: 1 };
    FitCam();
    ById('gf-hk-ed-name').value = d.n;
    EdShow();
  }

  function EdShow() {
    GS.status = 'editor'; GS.custom = null; GS.test = false; GS.hold = false;
    GS.trN = 0; GS.target = null; GS.shake = 0; GS.fade = 0;
    ED.drag = null;
    ED.space = false;
    _root.dataset.ed = '1';
    EdSync();
    ShowScreen('gf-hk-ed');
    SetTool(ED.tool);
    RenderPanel();
    EdBar();
    Draw();
  }

  function EdReturn() { StopLoop(); EdShow(); }
  function EdSync() { GS.lv = BuildCustom(ED.d); GS.bg = null; Stand(); }
  function EdOk() { return ED.v === Hash(ED.d); }
  function EdDraw() { if (!_edRaf) _edRaf = requestAnimationFrame(() => { _edRaf = 0; if (GS && GS.status === 'editor') Draw(); }); }

  function EdBar() {
    ById('gf-hk-ed-undo').disabled = !ED.undo.length;
    ById('gf-hk-ed-redo').disabled = !ED.redo.length;
    ById('gf-hk-ed-grid').classList.toggle('on', ED.snap);
    ById('gf-hk-ed-share').classList.toggle('off', !EdOk());
    SetText('gf-hk-ed-zl', `${Math.round(ED.z * 100)}%`);
  }

  function EdSave() {
    const a = Customs();
    let r = a.find(x => x.id === ED.id);
    if (!r) {
      if (a.length >= MAX_CUSTOM) { Toast(_GameText('hk_err_full'), 1); return; }
      a.push(r = { id: ED.id = NewId(), v: '', bt: 0, im: 0 });
    }
    r.d = ED.d; r.v = ED.v; r.at = Date.now();
    SaveCustoms(a);
  }

  function Commit() {
    const j = JSON.stringify(ED.d);
    if (j !== ED.last) {
      ED.undo.push(ED.last);
      if (ED.undo.length > 150) ED.undo.shift();
      ED.redo.length = 0;
      ED.last = j;
      EdSave();
    }
    EdSync();
    if (ED.sel) SyncPanel(); else RenderPanel();
    EdBar();
    EdDraw();
  }

  function UndoRedo(from, to) {
    if (!from.length) return;
    to.push(ED.last);
    ED.last = from.pop();
    ED.d = JSON.parse(ED.last);
    ED.hov = null;
    const s = ED.sel;
    if (s && s.t !== 's' && s.t !== 'f' && !ED.d[s.t][s.i]) ED.sel = null;
    ById('gf-hk-ed-name').value = ED.d.n;
    EdSave();
    EdSync();
    RenderPanel();
    EdBar();
    EdDraw();
  }

  function El(s) { return s.t === 's' || s.t === 'f' ? ED.d[s.t] : ED.d[s.t][s.i]; }
  function FixSel() { const s = ED.sel; if (s.t === 's' || s.t === 'f') FixSF(ED.d, s.t); else FIX[s.t](El(s)); }
  function Sn(v) { const g = ED.snap ? GRID : Q; return Math.round(v / g) * g; }
  function Count() { const d = ED.d; return d.h.length + d.b.length + d.p.length + d.z.length; }

  function Select(s) { ED.sel = s; RenderPanel(); EdDraw(); }
  function SetTool(t) {
    ED.tool = t;
    ById('gf-hk-ed-tools').querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    Cursor(ED.hov);
    EdDraw();
  }
  function ToggleSnap() { ED.snap = !ED.snap; StorageSet(LS_SNAP, ED.snap); EdBar(); EdDraw(); }

  function RenderPanel() {
    const T = _GameText, s = ED.sel, pn = ById('gf-hk-ed-panel'), d = ED.d;
    if (!s) {
      const ok = EdOk();
      pn.innerHTML = `<div class="gf-hk-pt">${T('hk_level_props')}</div><div class="gf-hk-pl">${T('hk_colour')}</div>
        <div class="gf-hk-sw">${PALS.map((p, i) => `<button data-pal="${i}" class="${i === d.c ? 'on' : ''}" style="background:linear-gradient(135deg,${p[0]},${p[3]})"></button>`).join('')}</div>
        <div class="gf-hk-st${ok ? ' ok' : ''}">${T(ok ? 'hk_ready_share' : 'hk_need_clear')}</div>
        <div class="gf-hk-pc">${'hbpz'.split('').map(t => `<span title="${T(EL_KEY[t])}">${IC[t]}${d[t].length}</span>`).join('')}</div>`;
      return;
    }
    const sf = s.t === 's' || s.t === 'f';
    pn.innerHTML = `<div class="gf-hk-pt">${T(EL_KEY[s.t])}</div>
      <div class="gf-hk-pf">${FIELDS[s.t].map((f, k) => `<label><span>${f[0].length > 1 ? T(f[0]) : f[0]}</span><input type="number" data-k="${k}" step="${f[1]}"></label>`).join('')}</div>
      ${sf ? '' : `<div class="gf-hk-pa"><button class="gf-hk-eb" data-act="dup" title="${T('hk_duplicate')} (Ctrl+D)">${IC.dup}${T('hk_duplicate')}</button><button class="gf-hk-eb gf-hk-eb-del" data-act="del" title="${T('hk_delete')} (Del)">${IC.del}</button></div>`}`;
    SyncPanel();
  }

  function SyncPanel() {
    const s = ED.sel;
    if (!s) return;
    const e = El(s), F = FIELDS[s.t];
    ById('gf-hk-ed-panel').querySelectorAll('input').forEach(inp => { const k = +inp.dataset.k; inp.value = +(e[k] * (F[k][2] || 1)).toFixed(1); });
  }

  function PanelInput(inp) {
    const s = ED.sel, k = +inp.dataset.k, v = parseFloat(inp.value);
    if (!s || !Number.isFinite(v)) { SyncPanel(); return; }
    El(s)[k] = v / (FIELDS[s.t][k][2] || 1);
    FixSel();
    Commit();
  }

  function DelSel() {
    const s = ED.sel;
    if (!s || s.t === 's' || s.t === 'f') return;
    ED.d[s.t].splice(s.i, 1);
    ED.sel = null;
    ED.hov = null;
    Commit();
  }

  function DupSel() {
    const s = ED.sel;
    if (!s || s.t === 's' || s.t === 'f') return;
    if (ED.d[s.t].length >= MAX_N[s.t] || Count() >= MAX_ALL) { Toast(_GameText('hk_limit'), 1); return; }
    const c = El(s).slice();
    c[0] += 40; c[1] += 40;
    ED.d[s.t].push(FIX[s.t](c));
    ED.sel = { t: s.t, i: ED.d[s.t].length - 1 };
    RenderPanel();
    Commit();
  }

  function ClearAll() {
    const d = ED.d;
    d.h = []; d.b = []; d.p = []; d.z = [];
    ED.sel = null;
    ED.hov = null;
    Commit();
  }

  function EdBack() { ShowCustom(ED.id); }

  function EdTest() {
    EdSave();
    GS.custom = JSON.parse(JSON.stringify(ED.d)); GS.cid = ED.id; GS.test = true;
    LoadLevel(1);
    ShowScreen(null);
    StartLoop();
  }

  function EdShare() {
    if (EdOk()) CopyCode(ED.d);
    else Toast(_GameText('hk_need_clear'), 1);
  }

  function ClampCam() { ED.x = Math.max(-2500, Math.min(12500, ED.x)); ED.y = Math.max(-1600, Math.min(1600, ED.y)); }
  function Zoom(f, lx = CV_W / 2, ly = CV_H / 2) {
    const z = Math.max(0.2, Math.min(2, ED.z * f)), wx = ED.x + (lx - CV_W / 2) / ED.z, wy = ED.y + (ly - CV_H / 2) / ED.z;
    ED.z = z; ED.x = wx - (lx - CV_W / 2) / z; ED.y = wy - (ly - CV_H / 2) / z;
    ClampCam(); EdBar(); EdDraw();
  }
  function FitView() { FitCam(); EdBar(); EdDraw(); }
  function FitCam() {
    const d = ED.d, lo = d.s[0] - 150, hi = d.f[0] + 200, xs = [d.s[0] - 120, hi], ys = [d.s[1] - 80, d.f[1], 700];
    for (const r of d.h) { xs.push(r[0] - Math.abs(r[2]), r[0] + Math.abs(r[2])); ys.push(r[1] - Math.abs(r[3])); }
    for (const r of d.p) { xs.push(r[0]); ys.push(r[1]); }
    for (const r of [...d.b, ...d.z]) { xs.push(Math.max(r[0], lo), Math.min(r[0] + r[2], hi)); ys.push(Math.max(r[1], -200)); }
    const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 20;
    ED.z = Math.max(0.45, Math.min(1.2, (CV_W - 200) / (x1 - x0), (CV_H - 100) / (y1 - y0)));
    ED.x = Math.min((x0 + x1) / 2 + 65 / ED.z, x0 + 324 / ED.z); ED.y = (y0 + y1) / 2;
    ClampCam();
  }

  function EdPt(e) {
    const r = _cv.getBoundingClientRect(), lx = (e.clientX - r.left) * CV_W / r.width, ly = (e.clientY - r.top) * CV_H / r.height;
    return [ED.x + (lx - CV_W / 2) / ED.z, ED.y + (ly - CV_H / 2) / ED.z, lx, ly];
  }

  function PadDist(r, px, py) {
    const [x1, y1, x2, y2] = PadEnds(r), ex = x2 - x1, ey = y2 - y1, u = Math.max(0, Math.min(1, ((px - x1) * ex + (py - y1) * ey) / (ex * ex + ey * ey)));
    return Math.hypot(px - x1 - ex * u, py - y1 - ey * u);
  }

  function Handles(s) {
    const e = El(s);
    if (s.t === 'b' || s.t === 'z') {
      const out = [];
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i || j) out.push([e[0] + (i + 1) / 2 * e[2], e[1] + (j + 1) / 2 * e[3], [i, j]]);
      return out;
    }
    if (s.t === 'p') { const q = PadEnds(e); return [[q[0], q[1], -1], [q[2], q[3], 1]]; }
    return s.t === 'h' && (e[2] || e[3]) ? [[e[0] + e[2], e[1] + e[3], 'm']] : [];
  }

  function Pick(x, y) {
    const d = ED.d, tol = 6 / ED.z;
    if (ED.sel) for (const h of Handles(ED.sel)) if (Math.abs(x - h[0]) < tol && Math.abs(y - h[1]) < tol) return { ...ED.sel, hd: h[2] };
    if (Math.abs(x - d.s[0]) < 14 && y > d.s[1] - 54 && y < d.s[1] + 4) return { t: 's' };
    for (let i = d.h.length - 1; i >= 0; i--) if (Math.hypot(x - d.h[i][0], y - d.h[i][1]) < 15 + tol) return { t: 'h', i };
    for (let i = d.p.length - 1; i >= 0; i--) if (PadDist(d.p[i], x, y) < PAD_R + tol) return { t: 'p', i };
    if (Math.abs(x - d.f[0]) < 15 && y < d.f[1] + 4 || x > d.f[0] + 102 && x < d.f[0] + 198 && y > d.f[1] - 100 && y < d.f[1]) return { t: 'f' };
    for (const t of 'zb') for (let i = d[t].length - 1; i >= 0; i--) {
      const r = d[t][i];
      if (x > r[0] - tol && x < r[0] + r[2] + tol && y > r[1] - tol && y < r[1] + r[3] + tol) return { t, i };
    }
    return null;
  }

  function Cursor(h) {
    const g = ED.drag, hd = h && h.hd;
    const c = g && g.m === 'pan' ? 'grabbing' : ED.space ? 'grab' : Array.isArray(hd) ? (hd[0] * hd[1] > 0 ? 'nwse-resize' : hd[0] * hd[1] < 0 ? 'nesw-resize' : hd[0] ? 'ew-resize' : 'ns-resize')
      : hd != null ? 'crosshair' : h || g ? 'move' : ED.tool === 'sel' ? 'default' : 'crosshair';
    if (c !== _cur) _view.style.cursor = _cur = c;
  }

  function EdDown(e) {
    if (!ED || GS.status !== 'editor') return;
    const a = document.activeElement;
    if (a && a !== document.body && _root.contains(a)) a.blur();
    e.preventDefault();
    _cv.setPointerCapture(e.pointerId);
    const [x, y] = EdPt(e), hit = e.button || ED.space ? null : Pick(x, y);
    if (e.button === 1 || e.button === 2 || ED.space || !hit && ED.tool === 'sel') {
      if (!e.button && !ED.space && ED.sel) Select(null);
      ED.drag = { m: 'pan', x: e.clientX, y: e.clientY, cx: ED.x, cy: ED.y };
      Cursor(null);
      return;
    }
    if (e.button) return;
    if (hit) {
      const s = { t: hit.t, i: hit.i }, el = El(s);
      if (!ED.sel || ED.sel.t !== s.t || ED.sel.i !== s.i) Select(s);
      ED.drag = hit.hd != null ? { m: 'hd', hd: hit.hd, o: el.slice() } : { m: 'mv', ox: x - el[0], oy: y - el[1] };
    } else Place(x, y);
    Cursor(hit);
    EdDraw();
  }

  function Place(x, y) {
    const t = ED.tool, d = ED.d, gx = Sn(x), gy = Sn(y);
    if (t === 's' || t === 'f') {
      d[t][0] = gx; d[t][1] = gy;
      FixSF(d, t);
      Select({ t });
      ED.drag = { m: 'mv', ox: x - d[t][0], oy: y - d[t][1] };
      EdSync();
      return;
    }
    if (d[t].length >= MAX_N[t] || Count() >= MAX_ALL) { Toast(_GameText('hk_limit'), 1); return; }
    d[t].push(FIX[t](t === 'h' ? [gx, gy, 0, 0, 20, 0] : t === 'p' ? [gx, gy, 140, 15] : [gx, gy, 10, 10]));
    Select({ t, i: d[t].length - 1 });
    ED.drag = t === 'b' || t === 'z' ? { m: 'new', x0: gx, y0: gy } : { m: 'mv', ox: x - gx, oy: y - gy };
    EdSync();
  }

  function EdMove(e) {
    if (!ED || GS.status !== 'editor') return;
    const [x, y] = EdPt(e), g = ED.drag;
    ED.ptr = [x, y];
    if (!g) { ED.hov = Pick(x, y); Cursor(ED.hov); EdDraw(); return; }
    if (g.m === 'pan') {
      const k = CV_W / _cv.getBoundingClientRect().width / ED.z;
      ED.x = g.cx - (e.clientX - g.x) * k; ED.y = g.cy - (e.clientY - g.y) * k;
      ClampCam(); EdDraw();
      return;
    }
    const s = ED.sel, el = El(s), mx = Sn(x), my = Sn(y);
    if (g.m === 'mv') { el[0] = Sn(x - g.ox); el[1] = Sn(y - g.oy); }
    else if (g.m === 'new') { el[0] = Math.min(g.x0, mx); el[1] = Math.min(g.y0, my); el[2] = Math.abs(mx - g.x0); el[3] = Math.abs(my - g.y0); }
    else if (s.t === 'h') { el[2] = mx - el[0]; el[3] = my - el[1]; }
    else if (s.t === 'p') {
      const q = PadEnds(g.o), fx = g.hd > 0 ? q[0] : q[2], fy = g.hd > 0 ? q[1] : q[3];
      let a = Math.atan2((my - fy) * g.hd, (mx - fx) * g.hd) * 180 / Math.PI;
      if (a > 90) a -= 180; else if (a < -90) a += 180;
      el[0] = (fx + mx) / 2; el[1] = (fy + my) / 2; el[2] = Math.hypot(mx - fx, my - fy); el[3] = a;
    } else {
      const [i, j] = g.hd, o = g.o;
      let x0 = o[0], y0 = o[1], x1 = o[0] + o[2], y1 = o[1] + o[3];
      if (i < 0) x0 = Math.min(mx, x1 - 10); else if (i > 0) x1 = Math.max(mx, x0 + 10);
      if (j < 0) y0 = Math.min(my, y1 - 10); else if (j > 0) y1 = Math.max(my, y0 + 10);
      el[0] = x0; el[1] = y0; el[2] = x1 - x0; el[3] = y1 - y0;
    }
    if (g.m !== 'new') FixSel();
    EdSync();
    SyncPanel();
    EdDraw();
  }

  function EdUp() {
    if (!ED || !ED.drag) return;
    const g = ED.drag;
    ED.drag = null;
    if (g.m === 'new') {
      const el = El(ED.sel);
      if (el[2] < 15 && el[3] < 15) { const b = ED.sel.t === 'b'; el.splice(0, 4, g.x0 - (b ? 80 : 60), g.y0 - (b ? 20 : 10), b ? 160 : 120, b ? 40 : 20); }
      FixSel();
    }
    if (g.m !== 'pan') Commit();
    Cursor(ED.hov);
    EdDraw();
  }

  function EdLeave() { if (ED && !ED.drag) { ED.ptr = null; ED.hov = null; EdDraw(); } }

  function EdWheel(e) {
    if (!ED || GS.status !== 'editor') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { ED.x += (e.deltaX || e.deltaY) / ED.z; ClampCam(); EdDraw(); return; }
    const p = EdPt(e);
    Zoom(Math.exp(-Math.max(-300, Math.min(300, e.deltaY)) * 0.0015), p[2], p[3]);
  }

  function EdKey(e) {
    const k = e.key;
    if (k === ' ') {
      e.preventDefault();
      if (e.type === 'keypress' || e.repeat) return;
      ED.space = e.type === 'keydown';
      Cursor(ED.hov);
      return;
    }
    if (e.type !== 'keydown') return;
    const c = e.ctrlKey || e.metaKey, lk = k.toLowerCase();
    let ok = true;
    if (c && lk === 'z') { if (e.shiftKey) UndoRedo(ED.redo, ED.undo); else UndoRedo(ED.undo, ED.redo); }
    else if (c && lk === 'y') UndoRedo(ED.redo, ED.undo);
    else if (c && lk === 'd') DupSel();
    else if (c || e.altKey) ok = false;
    else if (k === 'Delete' || k === 'Backspace') DelSel();
    else if (k === 'Escape') { if (ED.sel) Select(null); else SetTool('sel'); }
    else if (k >= '1' && k <= '7') SetTool(TOOLS[k - 1]);
    else if (lk === 'g') ToggleSnap();
    else if (k === '+' || k === '=') Zoom(1.25);
    else if (k === '-' || k === '_') Zoom(0.8);
    else if (k === '0' || k === 'Home') FitView();
    else if (k === 'Enter') EdTest();
    else if (k.startsWith('Arrow')) {
      const dx = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0, dy = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0;
      if (ED.sel) {
        const st = (ED.snap ? GRID : Q) * (e.shiftKey ? 5 : 1), el = El(ED.sel);
        el[0] += dx * st; el[1] += dy * st;
        FixSel();
        Commit();
      } else { ED.x += dx * 80 / ED.z; ED.y += dy * 80 / ED.z; ClampCam(); EdDraw(); }
    } else ok = false;
    if (ok) e.preventDefault();
  }

  function DrawEditor() {
    const ctx = _ctx, dark = _root.dataset.theme === 'dark', C = dark ? DARK : LIGHT, z = ED.z, d = ED.d, pal = dark ? NIGHT : GS.lv.pal;
    Sky(ctx, dark, pal);
    Hills(ctx, pal, ED);
    ctx.setTransform(_k * z, 0, 0, _k * z, _k * (CV_W / 2 - ED.x * z), _k * (CV_H / 2 - ED.y * z));
    const hw = CV_W / 2 / z, hh = CV_H / 2 / z, vl = ED.x - hw, vr = ED.x + hw, vt = ED.y - hh, vb = ED.y + hh;
    if (vb > KILL_Y) { ctx.fillStyle = C.kill; ctx.fillRect(vl, KILL_Y, vr - vl, vb - KILL_Y); }
    DrawWorld(ctx, C, vl - 60, vr + 60, vt - 60);
    if (ED.snap) {
      for (const [g, col] of [[GRID, C.grid], [100, C.grid2]]) {
        if (g * z < 7) continue;
        ctx.beginPath();
        for (let x = Math.ceil(vl / g) * g; x <= vr; x += g) { ctx.moveTo(x, vt); ctx.lineTo(x, vb); }
        for (let y = Math.ceil(vt / g) * g; y <= vb; y += g) { ctx.moveTo(vl, y); ctx.lineTo(vr, y); }
        ctx.strokeStyle = col; ctx.lineWidth = 1 / z; ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(239,68,68,0.55)'; ctx.lineWidth = 1.5 / z; ctx.setLineDash([8 / z, 6 / z]);
    ctx.beginPath(); ctx.moveTo(vl, KILL_Y); ctx.lineTo(vr, KILL_Y); ctx.stroke();
    const s = ED.sel;
    if (s && (s.t === 'h' || s.t === 's')) {
      const e = El(s);
      ctx.strokeStyle = C.hudSub; ctx.lineWidth = 1.2 / z; ctx.setLineDash([3 / z, 6 / z]);
      ctx.beginPath(); ctx.arc(e[0], s.t === 's' ? e[1] - 29 : e[1], REACH, 0, 6.2832); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (!ED.drag && !ED.hov && ED.ptr && ED.tool !== 'sel' && !ED.space) Ghost(ctx, C, Sn(ED.ptr[0]), Sn(ED.ptr[1]), vt);
    const hv = ED.hov && !ED.drag && (!s || ED.hov.t !== s.t || ED.hov.i !== s.i) ? ED.hov : null;
    if (hv) Outline(ctx, hv, true, vt);
    if (s) Outline(ctx, s, false, vt);
  }

  function Ghost(ctx, C, x, y, vt) {
    const t = ED.tool;
    ctx.globalAlpha = 0.45;
    if (t === 'h') ctx.drawImage(_ball, x - 14, y - 14, 28, 28);
    else if (t === 'b') { ctx.fillStyle = C.block; RR(ctx, x - 80, y - 20, 160, 40, 9); ctx.fill(); }
    else if (t === 'z') { ctx.fillStyle = C.haz; ctx.beginPath(); HazPath(ctx, { x: x - 60, y: y - 10, w: 120, h: 20 }); ctx.fill(); }
    else if (t === 'p') { const q = PadEnds([x, y, 140, 15]); ctx.strokeStyle = C.pad; ctx.lineWidth = PAD_R * 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    else if (t === 's') { ctx.fillStyle = C.man; ctx.beginPath(); ctx.arc(x, y - 45, 6.4, 0, 6.2832); ctx.fill(); ctx.fillRect(x - 2.3, y - 38, 4.6, 38); }
    else { ctx.fillStyle = C.chkB; ctx.fillRect(x - 3, vt, 6, y - vt); }
    ctx.globalAlpha = 1;
  }

  function Outline(ctx, s, hov, vt) {
    const e = El(s), z = ED.z;
    ctx.lineWidth = (hov ? 1.5 : 2) / z;
    ctx.strokeStyle = hov ? 'rgba(236,72,153,0.65)' : ACCENT;
    ctx.setLineDash(hov ? [5 / z, 4 / z] : []);
    ctx.beginPath();
    if (s.t === 'h') ctx.arc(e[0], e[1], 19, 0, 6.2832);
    else if (s.t === 'b' || s.t === 'z') ctx.rect(e[0] - 3, e[1] - 3, e[2] + 6, e[3] + 6);
    else if (s.t === 'p') {
      const q = PadEnds(e), a = e[3] * Math.PI / 180, nx = -Math.sin(a) * 12, ny = Math.cos(a) * 12, ux = Math.cos(a) * 9, uy = Math.sin(a) * 9;
      ctx.moveTo(q[0] - ux + nx, q[1] - uy + ny); ctx.lineTo(q[2] + ux + nx, q[3] + uy + ny);
      ctx.lineTo(q[2] + ux - nx, q[3] + uy - ny); ctx.lineTo(q[0] - ux - nx, q[1] - uy - ny); ctx.closePath();
    } else if (s.t === 's') ctx.rect(e[0] - 16, e[1] - 56, 32, 60);
    else ctx.rect(e[0] - 18, vt, 36, e[1] - vt + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    if (hov) return;
    const hs = 4 / z;
    ctx.fillStyle = '#fff';
    for (const [hx, hy] of Handles(s)) { ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2); ctx.strokeRect(hx - hs, hy - hs, hs * 2, hs * 2); }
  }

  function SetHold(v) {
    if (!GS) return;
    GS.hold = v && (GS.status === 'ready' || GS.status === 'playing');
  }

  function OnKey(e) {
    if (!GS || !_root || _root.style.display === 'none' || GS.status === 'editor') return;
    const k = e.key, down = e.type === 'keydown';
    if (k === ' ' || e.code === 'Space') {
      e.preventDefault(); e.stopPropagation();
      if (down && e.repeat) return;
      SetHold(down);
      return;
    }
    if (!down) return;
    if (k === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      const st = GS.status;
      if (GS.test) EdReturn();
      else if (st === 'ready' || st === 'playing' || st === 'dead' || st === 'paused') DoPause();
      else if (st === 'levels') BackFromLevels();
      else if (st === 'custom') ShowStart();
      else if (st === 'complete' && GS.custom) ShowCustom();
      else CloseGradeHook();
      return;
    }
    if (k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); DoPause(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); e.stopPropagation(); Restart(); return; }
    if (k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      const st = GS.status;
      if (st === 'start') Play(GS.level);
      else if (st === 'complete') { if (GS.custom) ToMenu(); else if (GS.level < LEVELS) Next(); else ShowLevels(); }
      else if (st === 'paused') DoPause();
    }
  }

  function OnDown(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    SetHold(true);
  }
  function OnUp(e) {
    if (GS) GS.hold = false;
    if (ED && e && e.type === 'blur') ED.space = false;
  }

  function OnWinKey(e) {
    if (!GS || !_root || _root.style.display === 'none') return;
    const t = e.target, inp = !!t && t.nodeType === 1 && _root.contains(t) && /^(INPUT|TEXTAREA)$/.test(t.tagName), code = CodeOpen();
    if (!inp && !code && GS.status !== 'editor') return;
    if (W.GfKeys && ['panel', 'chat', 'arcade'].some(a => W.GfKeys.match(e, a))) return;
    e.stopPropagation();
    if (e.type !== 'keydown') { if (!inp && !code) EdKey(e); return; }
    if (inp) InputKey(e, t);
    else if (code) { if (e.key === 'Escape') { e.preventDefault(); CloseCode(); } }
    else EdKey(e);
  }

  function InputKey(e, t) {
    const k = e.key;
    if (k !== 'Enter' && k !== 'Escape') return;
    e.preventDefault();
    if (t.id === 'gf-hk-code-in') { if (k === 'Enter') CodeOk(); else CloseCode(); }
    else if (t.classList.contains('gf-hk-ren')) RenameDone(t, k === 'Enter');
    else t.blur();
  }

  function AttachKeys() {
    if (_kh) return;
    _kh = OnKey;
    for (const t of ['keydown', 'keyup', 'keypress']) W.addEventListener(t, OnWinKey, true);
    document.addEventListener('keydown', _kh, true);
    document.addEventListener('keyup', _kh, true);
    W.addEventListener('mouseup', OnUp, true);
    W.addEventListener('blur', OnUp);
    W.addEventListener('resize', Fit);
  }
  function DetachKeys() {
    if (!_kh) return;
    for (const t of ['keydown', 'keyup', 'keypress']) W.removeEventListener(t, OnWinKey, true);
    document.removeEventListener('keydown', _kh, true);
    document.removeEventListener('keyup', _kh, true);
    W.removeEventListener('mouseup', OnUp, true);
    W.removeEventListener('blur', OnUp);
    W.removeEventListener('resize', Fit);
    _kh = null;
  }

  function OnVisibilityChange() {
    if (document.hidden && GS && (GS.status === 'playing' || GS.status === 'ready')) DoPause();
  }

  function ApplyTheme() {
    const el = document.getElementById('gf-hk');
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
    if (GS && GS.status !== 'playing' && GS.status !== 'ready') Draw();
  }

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.3, Math.min(1.3, (innerWidth - 34) / CV_W, (innerHeight - 34 - 42) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1);
    _cv.style.width = `${Math.round(CV_W * s)}px`;
    _cv.style.height = `${Math.round(CV_H * s)}px`;
    _cv.width = Math.round(CV_W * s * dpr);
    _cv.height = Math.round(CV_H * s * dpr);
    _k = _cv.width / CV_W;
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-hk')) return;
    InjectCSS();
    MakeSprites();
    const T = _GameText;
    const root = document.createElement('div');
    root.id = 'gf-hk';
    root.innerHTML = `
<div id="gf-hk-modal">
  <div id="gf-hk-hdr">
    <div class="gf-hk-hl">
      <div id="gf-hk-logo">GH</div>
      <span id="gf-hk-title">${T('hk_title')}</span>
    </div>
    <div class="gf-hk-hr">
      <span id="gf-hk-best-hdr"><span class="gf-hk-best-lbl">${T('game_best').toUpperCase()}</span> <span id="gf-hk-best">1</span></span>
      <button id="gf-hk-pause-btn" title="${T('game_pause_p')}">⏸</button>
      <button id="gf-hk-close" title="${T('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-hk-body">
    <div id="gf-hk-view"><canvas id="gf-hk-canvas"></canvas></div>

    <div id="gf-hk-start" class="gf-hk-scr">
      <div class="gf-hk-scr-title">${T('hk_title')}</div>
      <div class="gf-hk-scr-sub">${T('hk_subtitle')}</div>
      <div class="gf-hk-rules">
        <span><b>1</b>${T('hk_rule_hold')}</span>
        <span><b>2</b>${T('hk_rule_release')}</span>
      </div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn" id="gf-hk-play">▶&nbsp; ${T('game_play')} <span class="gf-hk-dim" id="gf-hk-play-lvl"></span></button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls">${T('game_levels')}</button>
      </div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-edit">${IC.edit}${T('hk_level_editor')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cust">${IC.b}${T('hk_custom')}</button>
      </div>
      <div class="gf-hk-scr-footer">${T('hk_footer')}</div>
    </div>

    <div id="gf-hk-levels" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('game_levels')}</div>
      <div id="gf-hk-grid"></div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-back">${T('game_back')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cust2">${IC.b}${T('hk_custom')}</button>
      </div>
    </div>

    <div id="gf-hk-custom" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('hk_custom')}</div>
      <div id="gf-hk-clist"></div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn" id="gf-hk-cnew">${IC.edit}${T('hk_new_level')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cimp">${IC.code}${T('hk_import')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cback">${T('game_back')}</button>
      </div>
    </div>

    <div id="gf-hk-ed" style="display:none">
      <div class="gf-hk-ed-top">
        <button class="gf-hk-eb" id="gf-hk-ed-back" title="${T('game_back')}">${IC.back}</button>
        <input id="gf-hk-ed-name" maxlength="${NAME_MAX}" spellcheck="false" autocomplete="off" placeholder="${T('hk_level_name')}">
        <span class="gf-hk-ed-sp"></span>
        <button class="gf-hk-eb" id="gf-hk-ed-undo" title="${T('hk_undo')} (Ctrl+Z)">${IC.undo}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-redo" title="${T('hk_redo')} (Ctrl+Y)">${IC.redo}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-grid" title="${T('hk_grid')} (G)">${IC.grid}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-fit" title="${T('hk_fit')} (0)">${IC.fit}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-clear" title="${T('hk_clear')}">${IC.del}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-share" title="${T('hk_copy_code')}">${IC.code}${T('hk_copy_code')}</button>
        <button class="gf-hk-eb gf-hk-eb-p" id="gf-hk-ed-test" title="${T('hk_test')} (Enter)">${IC.play}${T('hk_test')}</button>
      </div>
      <div class="gf-hk-ed-tools" id="gf-hk-ed-tools">${TOOLS.map((t, i) => `<button class="gf-hk-eb" data-tool="${t}" title="${T(EL_KEY[t])} (${i + 1})">${IC[t]}<small>${i + 1}</small></button>`).join('')}</div>
      <div id="gf-hk-ed-panel"></div>
      <div class="gf-hk-ed-hint">${T('hk_ed_hint')}</div>
      <div class="gf-hk-ed-zoom">
        <button class="gf-hk-eb" id="gf-hk-ed-zo" title="${T('hk_zoom_out')} (-)">&minus;</button>
        <span id="gf-hk-ed-zl">100%</span>
        <button class="gf-hk-eb" id="gf-hk-ed-zi" title="${T('hk_zoom_in')} (+)">+</button>
      </div>
    </div>

    <div id="gf-hk-code" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-card">
        <div class="gf-hk-scr-h" id="gf-hk-code-h"></div>
        <div class="gf-hk-scr-sub" id="gf-hk-code-sub"></div>
        <textarea id="gf-hk-code-in" spellcheck="false" autocomplete="off" placeholder="${CODE_PRE}..."></textarea>
        <div class="gf-hk-err" id="gf-hk-code-err"></div>
        <div class="gf-hk-row">
          <button class="gf-hk-btn" id="gf-hk-code-ok"></button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-code-x"></button>
        </div>
      </div>
    </div>
    <div id="gf-hk-toast"></div>

    <div id="gf-hk-pause" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('game_paused')}</div>
      <button class="gf-hk-btn" id="gf-hk-resume">▶&nbsp; ${T('game_resume')}</button>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-restart">↺&nbsp; ${T('hk_restart')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls2">${T('game_levels')}</button>
      </div>
    </div>

    <div id="gf-hk-done" class="gf-hk-scr gf-hk-scr-done" style="display:none">
      <div class="gf-hk-card">
        <div class="gf-hk-done-t" id="gf-hk-done-title"></div>
        <div class="gf-hk-chip" id="gf-hk-done-grade"></div>
        <div class="gf-hk-stats">
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('game_time')}</div><div class="gf-hk-val" id="gf-hk-done-time">0</div></div>
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('hk_best_time')}</div><div class="gf-hk-val" id="gf-hk-done-best">0</div></div>
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('hk_attempts')}</div><div class="gf-hk-val" id="gf-hk-done-tries">1</div></div>
        </div>
        <div id="gf-hk-done-new" class="gf-hk-new" style="display:none">${T('game_new_best')}</div>
        <div id="gf-hk-done-share" class="gf-hk-share" style="display:none">${T('hk_share_now')}</div>
        <button class="gf-hk-btn" id="gf-hk-next">${T('hk_next_level')}&nbsp; ▶</button>
        <div class="gf-hk-row">
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-retry">↺&nbsp; ${T('game_try_again')}</button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls3">${T('game_levels')}</button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-dcode" style="display:none">${IC.code}${T('hk_copy_code')}</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.getElementById('gf-hk-canvas');
    _ctx = _cv.getContext('2d');
    _view = document.getElementById('gf-hk-view');
    BindButtons();
  }

  function BindButtons() {
    const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    on('gf-hk-close', CloseGradeHook);
    on('gf-hk-pause-btn', DoPause);
    on('gf-hk-resume', DoPause);
    on('gf-hk-restart', Restart);
    on('gf-hk-play', () => Play(GS ? GS.level : Unlocked()));
    on('gf-hk-lvls', ShowLevels);
    on('gf-hk-lvls2', ToMenu);
    on('gf-hk-lvls3', ToMenu);
    on('gf-hk-back', BackFromLevels);
    on('gf-hk-next', Next);
    on('gf-hk-retry', () => Play(GS.level));
    on('gf-hk-dcode', () => CopyCode(GS.custom));
    on('gf-hk-edit', () => OpenEditor(null));
    on('gf-hk-cust', () => ShowCustom());
    on('gf-hk-cust2', () => ShowCustom());
    on('gf-hk-cnew', () => OpenEditor(null));
    on('gf-hk-cimp', () => OpenCode());
    on('gf-hk-cback', ShowStart);
    on('gf-hk-code-ok', CodeOk);
    on('gf-hk-code-x', CloseCode);
    on('gf-hk-ed-back', EdBack);
    on('gf-hk-ed-undo', () => UndoRedo(ED.undo, ED.redo));
    on('gf-hk-ed-redo', () => UndoRedo(ED.redo, ED.undo));
    on('gf-hk-ed-grid', ToggleSnap);
    on('gf-hk-ed-fit', FitView);
    on('gf-hk-ed-clear', e => Arm(e.currentTarget, ClearAll));
    on('gf-hk-ed-share', EdShare);
    on('gf-hk-ed-test', EdTest);
    on('gf-hk-ed-zo', () => Zoom(0.8));
    on('gf-hk-ed-zi', () => Zoom(1.25));
    ById('gf-hk-clist').addEventListener('click', OnListClick);
    ById('gf-hk-ed').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && e.detail) b.blur();
      if (b && b.dataset.tool) SetTool(b.dataset.tool);
    });
    const pn = ById('gf-hk-ed-panel'), nm = ById('gf-hk-ed-name');
    pn.addEventListener('change', e => PanelInput(e.target));
    pn.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.pal) { ED.d.c = +b.dataset.pal; Commit(); }
      else if (b.dataset.act === 'dup') DupSel();
      else if (b.dataset.act === 'del') DelSel();
    });
    nm.addEventListener('input', () => { ED.d.n = CleanName(nm.value); });
    nm.addEventListener('change', () => { ED.d.n = CleanName(nm.value); nm.value = ED.d.n; Commit(); });
    _cv.addEventListener('pointerdown', EdDown);
    _cv.addEventListener('pointermove', EdMove);
    _cv.addEventListener('pointerup', EdUp);
    _cv.addEventListener('pointercancel', EdUp);
    _cv.addEventListener('pointerleave', EdLeave);
    _cv.addEventListener('wheel', EdWheel, { passive: false });
    _cv.addEventListener('mousedown', OnDown);
    _cv.addEventListener('touchstart', OnDown, { passive: false });
    _cv.addEventListener('touchend', OnUp);
    _cv.addEventListener('touchcancel', OnUp);
    _cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  function OpenGradeHook(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    else if (!_grades.length) _grades = FallbackGrades();
    _txt = { level: _GameText('hk_level'), hold: _GameText('hk_rule_hold'), tries: _GameText('hk_attempts'), test: _GameText('hk_test'), esc: _GameText('hk_esc_editor') };
    if (!document.getElementById('gf-hk')) BuildOverlay();
    _root.style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    _tobs.observe(_cv, { attributes: true, attributeFilter: ['style', 'class'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    Fit();
    ShowStart();
  }

  function CloseGradeHook() {
    const el = document.getElementById('gf-hk');
    if (el) el.style.display = 'none';
    if (GS && (GS.status === 'playing' || GS.status === 'ready' || GS.status === 'dead')) { GS.prev = GS.status; GS.status = 'paused'; }
    StopLoop();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function ToggleGradeHook(grades) {
    const el = document.getElementById('gf-hk');
    if (el && el.style.display !== 'none') CloseGradeHook(); else OpenGradeHook(grades);
  }

  function BossKeyGradeHook() {
    const el = document.getElementById('gf-hk');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS && (GS.status === 'playing' || GS.status === 'ready' || GS.status === 'dead')) DoPause();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeHook = OpenGradeHook;
  W.CloseGradeHook = CloseGradeHook;
  W.ToggleGradeHook = ToggleGradeHook;
  W.BossKeyGradeHook = BossKeyGradeHook;

  function InjectCSS() {
    if (document.getElementById('gf-hk-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-hk-css';
    s.textContent = `
#gf-hk {
  --hk-modal:#fff;--hk-hdr:#f8f5f7;--hk-scr:rgba(250,247,249,0.95);
  --hk-brd:rgba(236,72,153,0.24);--hk-brd2:#e7e0e5;--hk-btn-brd:#d8d0d6;
  --hk-txt:#1c1a2b;--hk-txt2:#57536a;--hk-txt3:#9b96a8;
  --hk-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-hk[data-theme="dark"] {
  --hk-modal:rgba(13,13,17,0.97);--hk-hdr:rgba(8,8,11,0.95);
  --hk-scr:rgba(7,10,22,0.93);--hk-brd:rgba(236,72,153,0.2);--hk-brd2:#1f1f27;
  --hk-btn-brd:#34343f;--hk-txt:#f5f5f8;--hk-txt2:#cbd0dc;--hk-txt3:#8a90a2;
  --hk-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-hk{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-hk-modal{position:relative;display:flex;flex-direction:column;background:var(--hk-modal);border:1px solid var(--hk-brd);border-radius:12px;box-shadow:var(--hk-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-hk-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--hk-hdr);border-bottom:1px solid var(--hk-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-hk-hl,.gf-hk-hr{display:flex;align-items:center;gap:8px;}
#gf-hk-logo{width:24px;height:24px;background:${ACCENT};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;letter-spacing:-0.5px;flex-shrink:0;}
#gf-hk-title{font-size:13px;font-weight:700;color:var(--hk-txt);letter-spacing:-0.3px;}
#gf-hk-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--hk-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--hk-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-hk-best-lbl{font-size:8px;font-weight:700;color:var(--hk-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-hk-pause-btn,#gf-hk-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--hk-btn-brd);border-radius:6px;background:transparent;color:var(--hk-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-hk-pause-btn:hover{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,.10);}
#gf-hk-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-hk-body{position:relative;line-height:0;flex-shrink:0;}
#gf-hk-view{line-height:0;}
#gf-hk-canvas{display:block;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;}
.gf-hk-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--hk-scr);padding:24px;overflow-y:auto;line-height:1.35;text-align:center;}
.gf-hk-scr-title{font-size:40px;font-weight:800;color:${ACCENT};letter-spacing:-1px;text-shadow:0 0 40px rgba(236,72,153,0.4);line-height:1.05;}
.gf-hk-scr-h{font-size:22px;font-weight:800;color:var(--hk-txt);letter-spacing:3px;text-transform:uppercase;}
.gf-hk-scr-sub{font-size:13px;color:var(--hk-txt2);line-height:1.45;max-width:380px;}
.gf-hk-rules{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;font-size:12px;font-weight:700;color:var(--hk-txt);}
.gf-hk-rules span{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(128,128,128,0.09);}
.gf-hk-rules b{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${ACCENT};color:#fff;font-size:11px;}
.gf-hk-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}
.gf-hk-scr-footer{font-size:11px;color:var(--hk-txt3);line-height:1.45;max-width:420px;}
.gf-hk-btn{padding:10px 22px;border:1px solid ${ACCENT};border-radius:8px;background:rgba(236,72,153,0.12);color:${ACCENT};font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
.gf-hk-btn:hover{background:rgba(236,72,153,0.22);box-shadow:0 4px 18px rgba(236,72,153,0.28);transform:translateY(-1px);}
.gf-hk-btn2{border-color:var(--hk-btn-brd);background:rgba(128,128,128,0.06);color:var(--hk-txt2);min-width:120px;}
.gf-hk-btn2:hover{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,0.08);box-shadow:none;}
.gf-hk-dim{opacity:0.7;font-weight:700;margin-left:4px;}
#gf-hk-grid{display:grid;grid-template-columns:repeat(8,58px);gap:8px;}
.gf-hk-lv{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:50px;border:1px solid var(--hk-brd2);border-radius:10px;background:rgba(128,128,128,0.07);color:var(--hk-txt);font-family:inherit;cursor:pointer;padding:0;line-height:1;}
.gf-hk-lv b{font-size:16px;font-weight:800;}
.gf-hk-lv small{font-size:9px;font-weight:700;color:var(--hk-txt3);min-height:9px;}
.gf-hk-lv:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};transform:translateY(-1px);}
.gf-hk-lv-done{border-color:rgba(236,72,153,0.35);}
.gf-hk-lv-cur{border-color:${ACCENT};background:rgba(236,72,153,0.14);color:${ACCENT};}
.gf-hk-lv:disabled{opacity:0.32;cursor:default;}
.gf-hk-scr-done{background:transparent;}
#gf-hk-start{background:color-mix(in srgb,var(--hk-scr) 78%,transparent);}
.gf-hk-card{display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px 26px;border-radius:16px;background:var(--hk-scr);border:1px solid var(--hk-brd);box-shadow:0 12px 40px rgba(0,0,0,0.16);}
.gf-hk-done-t{font-size:28px;font-weight:800;color:${ACCENT};letter-spacing:-0.5px;line-height:1.05;}
.gf-hk-chip{font-size:11px;font-weight:800;padding:4px 12px;border:1px solid;border-radius:999px;background:rgba(128,128,128,0.08);}
.gf-hk-stats{display:grid;grid-template-columns:repeat(3,minmax(92px,1fr));gap:10px;}
.gf-hk-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 12px;border:1px solid var(--hk-brd2);border-radius:9px;background:rgba(128,128,128,0.10);}
.gf-hk-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--hk-txt3);line-height:1;text-transform:uppercase;}
.gf-hk-val{font-size:20px;font-weight:800;color:var(--hk-txt);line-height:1;}
.gf-hk-new{font-size:11px;font-weight:800;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;animation:gf-hk-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-hk-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
#gf-hk .gf-hk-i{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}
.gf-hk-btn .gf-hk-i{vertical-align:-2px;margin-right:7px;}
.gf-hk-share{font-size:11px;font-weight:800;color:#16a34a;letter-spacing:1px;text-transform:uppercase;}
#gf-hk[data-ed="1"] #gf-hk-canvas{cursor:inherit;}
#gf-hk-clist{width:min(640px,100%);max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px;box-sizing:border-box;}
.gf-hk-ci{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--hk-brd2);border-radius:10px;background:rgba(128,128,128,0.07);text-align:left;}
.gf-hk-flash{border-color:${ACCENT};box-shadow:0 0 0 2px rgba(236,72,153,0.22);}
.gf-hk-ci-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.gf-hk-ci-n{font-size:13px;font-weight:800;color:var(--hk-txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-hk-ci-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--hk-txt3);}
.gf-hk-tag{padding:1px 7px;border-radius:999px;background:rgba(245,158,11,0.15);color:#b45309;}
.gf-hk-tag-ok{background:rgba(34,197,94,0.15);color:#15803d;}
.gf-hk-tag-im{background:rgba(96,165,250,0.17);color:#2563eb;}
#gf-hk[data-theme="dark"] .gf-hk-tag{color:#fbbf24;}
#gf-hk[data-theme="dark"] .gf-hk-tag-ok{color:#4ade80;}
#gf-hk[data-theme="dark"] .gf-hk-tag-im{color:#93c5fd;}
.gf-hk-ren,#gf-hk-ed-name,.gf-hk-pf input,#gf-hk-code-in{box-sizing:border-box;border:1px solid var(--hk-btn-brd);border-radius:7px;background:rgba(128,128,128,0.08);color:var(--hk-txt);font-family:inherit;font-weight:700;outline:none;}
.gf-hk-ren:focus,#gf-hk-ed-name:focus,.gf-hk-pf input:focus,#gf-hk-code-in:focus{border-color:${ACCENT};}
.gf-hk-ren{flex:1;min-width:0;height:26px;padding:0 8px;font-size:13px;}
.gf-hk-ib,.gf-hk-sb,.gf-hk-eb{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;border:1px solid var(--hk-btn-brd);border-radius:7px;background:transparent;color:var(--hk-txt2);font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;flex-shrink:0;line-height:1;}
.gf-hk-ib{width:28px;padding:0;}
.gf-hk-sb{padding:0 11px;border-color:${ACCENT};background:rgba(236,72,153,0.12);color:${ACCENT};}
.gf-hk-sb .gf-hk-i{width:10px;height:10px;}
.gf-hk-ib:hover,.gf-hk-eb:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};}
.gf-hk-sb:hover{background:rgba(236,72,153,0.22);}
.gf-hk-ib.off,.gf-hk-eb.off{opacity:0.45;}
.gf-hk-ib-del:hover,.gf-hk-ib.arm,.gf-hk-eb.arm,.gf-hk-eb-del:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,0.1);}
.gf-hk-empty{padding:28px 12px;font-size:12px;color:var(--hk-txt3);}
#gf-hk-ed{position:absolute;inset:0;z-index:5;pointer-events:none;line-height:1.3;color:var(--hk-txt);}
#gf-hk-ed>*{pointer-events:auto;}
.gf-hk-ed-top{position:absolute;top:8px;left:8px;right:8px;display:flex;align-items:center;gap:5px;}
.gf-hk-eb{min-width:28px;padding:0 8px;background:var(--hk-scr);box-sizing:border-box;}
.gf-hk-eb:disabled{opacity:0.35;cursor:default;}
.gf-hk-eb.on{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,0.14);}
.gf-hk-eb-p,.gf-hk-eb-p:hover:not(:disabled){border-color:${ACCENT};background:${ACCENT};color:#fff;}
.gf-hk-eb-p:hover{box-shadow:0 4px 14px rgba(236,72,153,0.35);}
.gf-hk-eb-p .gf-hk-i{width:10px;height:10px;}
#gf-hk-ed-name{flex:0 1 190px;min-width:70px;height:28px;padding:0 9px;font-size:12px;background:var(--hk-scr);}
.gf-hk-ed-sp{flex:1;}
.gf-hk-ed-tools{position:absolute;left:8px;top:46px;display:flex;flex-direction:column;gap:3px;padding:4px;border:1px solid var(--hk-brd2);border-radius:10px;background:var(--hk-scr);}
.gf-hk-ed-tools .gf-hk-eb{position:relative;width:30px;height:30px;padding:0;border-color:transparent;background:transparent;}
.gf-hk-ed-tools .gf-hk-eb.on{border-color:${ACCENT};background:rgba(236,72,153,0.14);}
.gf-hk-ed-tools small{position:absolute;right:2px;bottom:1px;font-size:7px;opacity:0.6;}
#gf-hk-ed-panel{position:absolute;right:8px;top:46px;width:168px;max-height:calc(100% - 96px);overflow-y:auto;padding:10px;box-sizing:border-box;border:1px solid var(--hk-brd2);border-radius:10px;background:var(--hk-scr);font-size:11px;}
.gf-hk-pt{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};margin-bottom:8px;}
.gf-hk-pl{font-size:9px;font-weight:700;color:var(--hk-txt3);margin-bottom:4px;}
.gf-hk-sw{display:flex;gap:5px;}
.gf-hk-sw button{width:22px;height:22px;padding:0;border:2px solid var(--hk-brd2);border-radius:6px;cursor:pointer;}
.gf-hk-sw button.on{border-color:${ACCENT};box-shadow:0 0 0 2px rgba(236,72,153,0.25);}
.gf-hk-st{margin-top:10px;font-size:10px;font-weight:700;line-height:1.4;color:#b45309;}
.gf-hk-st.ok{color:#15803d;}
#gf-hk[data-theme="dark"] .gf-hk-st{color:#fbbf24;}
#gf-hk[data-theme="dark"] .gf-hk-st.ok{color:#4ade80;}
.gf-hk-pc{display:flex;flex-wrap:wrap;gap:9px;margin-top:10px;font-size:10px;font-weight:800;color:var(--hk-txt2);}
.gf-hk-pc span{display:inline-flex;align-items:center;gap:3px;}
.gf-hk-pc .gf-hk-i{width:11px;height:11px;}
.gf-hk-pf{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.gf-hk-pf label{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:9px;font-weight:700;color:var(--hk-txt3);}
.gf-hk-pf input{width:100%;height:25px;padding:0 6px;font-size:11px;}
.gf-hk-pa{display:flex;gap:6px;margin-top:9px;}
.gf-hk-pa .gf-hk-eb{height:26px;}
.gf-hk-pa .gf-hk-eb:first-child{flex:1;}
.gf-hk-ed-hint{position:absolute;left:8px;bottom:8px;max-width:calc(100% - 140px);padding:4px 9px;box-sizing:border-box;border-radius:7px;background:var(--hk-scr);color:var(--hk-txt3);font-size:9.5px;font-weight:700;line-height:1.45;}
#gf-hk-ed>.gf-hk-ed-hint{pointer-events:none;}
.gf-hk-ed-zoom{position:absolute;right:8px;bottom:8px;display:flex;align-items:center;gap:4px;}
.gf-hk-ed-zoom .gf-hk-eb{width:26px;min-width:26px;height:26px;padding:0;font-size:14px;}
#gf-hk-ed-zl{min-width:40px;padding:3px 0;border-radius:6px;background:var(--hk-scr);text-align:center;font-size:10px;font-weight:800;color:var(--hk-txt2);}
#gf-hk-code{z-index:30;}
#gf-hk-code-in{width:min(460px,70vw);height:88px;padding:8px 10px;font-size:11px;line-height:1.4;resize:none;word-break:break-all;}
.gf-hk-err{min-height:15px;font-size:11px;font-weight:800;color:#ef4444;}
#gf-hk-toast{position:absolute;left:50%;bottom:48px;z-index:40;max-width:80%;padding:7px 14px;border-radius:999px;background:var(--hk-txt);color:var(--hk-modal);font-size:12px;font-weight:800;line-height:1.3;text-align:center;opacity:0;pointer-events:none;transform:translate(-50%,8px);transition:opacity .18s,transform .18s;}
#gf-hk-toast.on{opacity:1;transform:translate(-50%,0);}
#gf-hk-toast.bad{background:#ef4444;color:#fff;}
`;
    document.head.appendChild(s);
  }

})(window);
