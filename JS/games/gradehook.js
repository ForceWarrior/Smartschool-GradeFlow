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
  };
  const DARK = {
    man: '#f4f6fb', rope: '#e2e8f0', block: '#2b3765', blockTop: '#3f4d88', pad: '#fbbf24', padTop: '#fef3c7', post: '#92400e',
    rail: 'rgba(226,232,240,0.22)', hud: '#f4f6fb', hudSub: 'rgba(244,246,251,0.55)', track: 'rgba(255,255,255,0.14)',
    badge: '#141c36', pill: 'rgba(20,28,54,0.88)', pillTxt: '#f4f6fb', chkA: '#e2e8f0', chkB: '#0f1730',
    cloud: 'rgba(255,255,255,0.035)', trail: 'rgba(244,114,182,0.42)', fade: '#0b1226', sign: '#141c36',
  };
  const POSE_HANG = [-4, 1, -6, -7, 3, 3, 5, -5, -3, -18, -5, -27, 4, -18, 3, -28];
  const POSE_FLY = [-8, 9, -15, 7, 8, 10, 15, 9, -7, -15, -4, -24, 7, -16, 11, -24];
  const CONF_COLORS = ['#ec4899', '#4ade80', '#a3e635', '#f97316', '#60a5fa', '#facc15', '#a78bfa'];

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
    const L = { hooks: [], pads: [], blocks: [], finish: 0, pal: PALS[(n - 1) % PALS.length], g: GradeAt(n * 3) };
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
      bg: null, dark: false,
    };
  }

  function LoadLevel(n, again) {
    GS.level = n;
    GS.lv = BuildLevel(n);
    GS.status = 'ready';
    GS.time = 0; GS.ms = 0; GS.acc = 0; GS.deadT = 0; GS.finT = 0; GS.prog = 0; GS.shake = 0;
    GS.hold = false; GS.target = null; GS.trN = 0; GS.bg = null;
    GS.attempts = again ? GS.attempts + 1 : 1;
    GS.fade = again ? 1 : 0;
    const p = GS.p;
    p.x = 60; p.y = 371; p.vx = 0; p.vy = 0; p.th = 0; p.om = 0; p.hook = null; p.len = 0;
    for (let i = 0; i < 8; i++) {
      const q = GS.pts[i];
      q.x = q.ox = p.x + POSE_HANG[i * 2];
      q.y = q.oy = p.y - POSE_HANG[i * 2 + 1];
    }
    for (const q of GS.parts) q.on = 0;
    for (const q of GS.pops) q.on = 0;
    for (const q of GS.conf) q.on = 0;
    Camera(0, true);
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
    const n = GS.level, times = Times(), prev = times[n];
    GS.status = 'finish';
    GS.finT = 0;
    GS.hold = false;
    GS.p.hook = null;
    GS.prog = 1;
    GS.rec = !prev || GS.ms < prev;
    if (GS.rec) { times[n] = Math.round(GS.ms); StorageSet(LS_TIMES, times); }
    const next = Math.min(LEVELS, n + 1);
    if (next > Unlocked()) StorageSet(LS_LEVEL, next);
    if (next > LoadBest()) StorageSet(LS_BEST, next);
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
    c.x = Math.max(c.x, -170 + CV_W / 2 / c.z);
  }

  function Update(dt) {
    const s = dt / 1000, p = GS.p;
    GS.acc += s;
    while (GS.acc >= STEP) { GS.acc -= STEP; Tick(); }
    if (GS.status === 'dead' && (GS.deadT += s) > 0.36) LoadLevel(GS.level, true);
    if (GS.fade > 0) GS.fade = Math.max(0, GS.fade - s * 3.5);
    if (GS.status === 'finish' && (GS.finT += s) > 1.1) ShowDone();
    GS.target = !p.hook && (GS.status === 'ready' || GS.status === 'playing') ? FindHook() : null;
    if (GS.status === 'playing') GS.prog = Math.max(GS.prog, Math.min(1, (p.x - 60) / (GS.lv.finish - 60)));
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
    const lv = GS.lv, p = GS.p, f = lv.finish, now = GS.time;
    if (f + 20 > vl && f - 20 < vr) {
      const sz = 14, top = Math.floor(Math.max(vt, -1400) / sz) * sz;
      ctx.fillStyle = C.chkA; ctx.fillRect(f - sz, top, sz * 2, 460 - top);
      ctx.fillStyle = C.chkB;
      for (let y = top; y < 460; y += sz) ctx.fillRect(f - sz + ((y / sz) & 1) * sz, y, sz, sz);
      const g = lv.g, gx = f + 150;
      ctx.fillStyle = C.post; ctx.fillRect(gx - 3, 400, 6, 60);
      ctx.fillStyle = C.sign; RR(ctx, gx - 46, 362, 92, 42, 10); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = GradeColor(g.Pct); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = GradeColor(g.Pct); ctx.font = F_SIGN; ctx.fillText(g.label, gx, 378);
      ctx.fillStyle = C.hudSub; ctx.font = F_SMALL; ctx.fillText(g.subject.slice(0, 14), gx, 394);
    }
    ctx.fillStyle = C.block;
    for (const b of lv.blocks) { if (b.x < vr && b.x + b.w > vl) { RR(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill(); } }
    ctx.fillStyle = C.blockTop;
    for (const b of lv.blocks) { if (b.x < vr && b.x + b.w > vl) { RR(ctx, b.x + 4, b.y + 4, b.w - 8, 5, 3); ctx.fill(); } }
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
    const n = GS.level, cx = CV_W / 2, y = 26, bw = 200;
    ctx.fillStyle = C.track; RR(ctx, cx - bw / 2, y - 4, bw, 8, 4); ctx.fill();
    if (GS.prog > 0) { ctx.fillStyle = ACCENT; RR(ctx, cx - bw / 2, y - 4, Math.max(8, bw * GS.prog), 8, 4); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Badge(ctx, cx - bw / 2 - 16, y, String(n), true, C);
    Badge(ctx, cx + bw / 2 + 16, y, n < LEVELS ? String(n + 1) : '', false, C);
    ctx.fillStyle = C.hud; ctx.font = F_TIME; ctx.textAlign = 'right';
    ctx.fillText(Fmt(GS.ms), CV_W - 16, y);
    ctx.fillStyle = C.hudSub; ctx.font = F_SUB; ctx.textAlign = 'left';
    ctx.fillText(`${_txt.level.toUpperCase()} ${n}`, 16, y);
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
    const ctx = _ctx, dark = _root.dataset.theme === 'dark', C = dark ? DARK : LIGHT, c = GS.cam, z = c.z, pal = dark ? NIGHT : GS.lv.pal;
    if (!GS.bg || GS.dark !== dark) {
      GS.dark = dark;
      GS.bg = ctx.createLinearGradient(0, 0, 0, CV_H);
      GS.bg.addColorStop(0, pal[0]); GS.bg.addColorStop(1, pal[1]);
    }
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    ctx.fillStyle = GS.bg; ctx.fillRect(0, 0, CV_W, CV_H);
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
    if (!GS || GS.status === 'paused' || GS.status === 'start' || GS.status === 'levels') return;
    const dt = Math.min(50, Math.max(0, ts - _last));
    _last = ts;
    Update(dt);
    Draw();
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-hk-start', 'gf-hk-levels', 'gf-hk-pause', 'gf-hk-done'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
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
    const n = GS.level, last = n >= LEVELS, g = GS.lv.g;
    GS.status = 'complete';
    SetText('gf-hk-done-title', last ? _GameText('hk_all_clear') : _GameText('hk_level_clear'));
    SetText('gf-hk-done-time', Fmt(GS.ms));
    SetText('gf-hk-done-best', Fmt(Times()[n]));
    SetText('gf-hk-done-tries', GS.attempts);
    SetText('gf-hk-best', LoadBest());
    const chip = document.getElementById('gf-hk-done-grade');
    chip.textContent = `${g.subject} ${g.label}`;
    chip.style.color = GradeColor(g.Pct);
    chip.style.borderColor = GradeColor(g.Pct);
    document.getElementById('gf-hk-done-new').style.display = GS.rec ? 'block' : 'none';
    document.getElementById('gf-hk-next').style.display = last ? 'none' : '';
    ShowScreen('gf-hk-done');
  }

  function Play(n) {
    if (!GS) GS = NewState();
    LoadLevel(Math.max(1, Math.min(LEVELS, n)));
    ShowScreen(null);
    StartLoop();
  }

  function Restart() {
    if (!GS || GS.status === 'start' || GS.status === 'levels') return;
    LoadLevel(GS.level, true);
    ShowScreen(null);
    StartLoop();
  }

  function Next() {
    if (GS && GS.status === 'complete' && GS.level < LEVELS) Play(GS.level + 1);
  }

  function DoPause() {
    if (!GS) return;
    const st = GS.status;
    if (st === 'ready' || st === 'playing' || st === 'dead') {
      GS.prev = st; GS.status = 'paused'; GS.hold = false;
      StopLoop(); Draw();
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

  function SetHold(v) {
    if (!GS) return;
    GS.hold = v && (GS.status === 'ready' || GS.status === 'playing');
  }

  function OnKey(e) {
    if (!GS || !_root || _root.style.display === 'none') return;
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
      if (st === 'ready' || st === 'playing' || st === 'dead' || st === 'paused') DoPause();
      else if (st === 'levels') BackFromLevels();
      else CloseGradeHook();
      return;
    }
    if (k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); DoPause(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); e.stopPropagation(); Restart(); return; }
    if (k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      const st = GS.status;
      if (st === 'start') Play(GS.level);
      else if (st === 'complete') { if (GS.level < LEVELS) Next(); else ShowLevels(); }
      else if (st === 'paused') DoPause();
    }
  }

  function OnDown(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    SetHold(true);
  }
  function OnUp() { if (GS) GS.hold = false; }

  function AttachKeys() {
    if (_kh) return;
    _kh = OnKey;
    document.addEventListener('keydown', _kh, true);
    document.addEventListener('keyup', _kh, true);
    W.addEventListener('mouseup', OnUp, true);
    W.addEventListener('blur', OnUp);
    W.addEventListener('resize', Fit);
  }
  function DetachKeys() {
    if (!_kh) return;
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
      <div class="gf-hk-scr-footer">${T('hk_footer')}</div>
    </div>

    <div id="gf-hk-levels" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('game_levels')}</div>
      <div id="gf-hk-grid"></div>
      <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-back">${T('game_back')}</button>
    </div>

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
        <button class="gf-hk-btn" id="gf-hk-next">${T('hk_next_level')}&nbsp; ▶</button>
        <div class="gf-hk-row">
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-retry">↺&nbsp; ${T('game_try_again')}</button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls3">${T('game_levels')}</button>
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
    on('gf-hk-lvls2', ShowLevels);
    on('gf-hk-lvls3', ShowLevels);
    on('gf-hk-back', BackFromLevels);
    on('gf-hk-next', Next);
    on('gf-hk-retry', () => Play(GS.level));
    _cv.addEventListener('mousedown', OnDown);
    _cv.addEventListener('touchstart', OnDown, { passive: false });
    _cv.addEventListener('touchend', OnUp);
    _cv.addEventListener('touchcancel', OnUp);
    _cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  function OpenGradeHook(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    else if (!_grades.length) _grades = FallbackGrades();
    _txt = { level: _GameText('hk_level'), hold: _GameText('hk_rule_hold'), tries: _GameText('hk_attempts') };
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
`;
    document.head.appendChild(s);
  }

})(window);
