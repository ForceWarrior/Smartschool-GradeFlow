;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV = 400;
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const TAU = Math.PI * 2;
  const DEAD_MS = 750, WIN_MS = 1000, PU_LIFE = 7000;
  const PU = {
    dbl:  { ms: 8000, col: '#facc15', key: 'game_snake_pu_double' },
    slow: { ms: 6000, col: '#38bdf8', key: 'game_snake_pu_slow' },
  };

  const LEVELS = [
    { id: 1, N: 8,  speed: 200, target: 1500  },
    { id: 2, N: 10, speed: 175, target: 3500  },
    { id: 3, N: 13, speed: 155, target: 6000  },
    { id: 4, N: 16, speed: 138, target: 10000 },
    { id: 5, N: 20, speed: 120, target: 15000 },
    { id: 6, N: 15, speed: 150, target: Infinity, freePlay: true },
  ];

  const LS_UNLOCK = 'gf-snake-unlock';
  const LS_SCORES = 'gf-snake-scores';
  const LS_MODS   = 'gf-snake-mods';
  const MIN_LEN   = 2;

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function LoadUnlock()    { return StorageGet(LS_UNLOCK, 0); }
  function SaveUnlock(n)   { if (n > LoadUnlock()) StorageSet(LS_UNLOCK, n); }
  function LoadScores()    { return StorageGet(LS_SCORES, {}); }
  function SaveScore(l, s) { const sc = LoadScores(); if (s > (sc[l] || 0)) { sc[l] = s; StorageSet(LS_SCORES, sc); } }
  function LoadMods()      { return { ...DefaultMods(), ...StorageGet(LS_MODS, {}) }; }
  function SaveMods(m)     { StorageSet(LS_MODS, m); }
  function DefaultMods()   { return { negRate: 0.25, posBoost: 1, speedMult: 1.0, maxApples: 2, powerUps: 1 }; }

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
    return { c, g };
  }
  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Ell(g, x, y, rx, ry, a = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

  let GS = null, _root = null, _grades = [], _lvlId = 1, _raf = null, _l6N = 15;
  let _cv = null, _ctx = null, _k = 1, _dark = false, _last = 0, _fitT = 0;
  let _bg = null, _S = null, _sN = 0, _sK = 0, _sD = null;
  let SX = new Float32Array(2048), SY = new Float32Array(2048), SD = new Float32Array(2048), SR = new Float32Array(2048);
  const _parts = Array.from({ length: 220 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, t: 0, T: 1, r: 1, c: '', k: 0, g: 0 }));
  let _np = 0;
  const _pops = Array.from({ length: 6 }, () => ({ txt: '', c: '', x: 0, y: 0, t: 1, T: 1 }));
  const _hud = {};
  const _flies = Array.from({ length: 9 }, (_, i) => ({ x: (i * 97 + 31) % CV, y: (i * 173 + 57) % CV, p: i * 1.7 }));

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    const N = lvl.freePlay ? _l6N : lvl.N;
    const cx = Math.floor(N / 2), cy = Math.floor(N / 2);
    const snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    return {
      lvl, N, mods: LoadMods(),
      snake, PrevSnake: snake.map(s => ({ ...s })),
      dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, dirQ: [],
      apples: [], power: null, fx: { dbl: 0, slow: 0 }, bulges: [],
      growthBuffer: 0,
      score: 0, applesEaten: 0,
      status: 'start',
      lastEaten: null,
      flash: null,
      moveT: 0,
      toxicity: 0,
      dead: null, winT: -1, shake: 0, clock: 0,
    };
  }

  function OccupiedSet(gs) {
    const s = new Set();
    gs.snake.forEach(p => s.add(`${p.x},${p.y}`));
    gs.apples.forEach(a => s.add(`${a.x},${a.y}`));
    if (gs.power) s.add(`${gs.power.x},${gs.power.y}`);
    return s;
  }

  function RandomEmpty(gs) {
    const Occ = OccupiedSet(gs);
    const pool = [];
    for (let y = 0; y < gs.N; y++)
      for (let x = 0; x < gs.N; x++)
        if (!Occ.has(`${x},${y}`)) pool.push({ x, y });
    return pool.length ? pool[0 | (Math.random() * pool.length)] : null;
  }

  function PickPos() {
    const pool = _grades.length ? _grades : FallbackGrades();
    const pos = pool.filter(IsPositive);
    return (pos.length ? pos : pool)[0 | (Math.random() * (pos.length || pool.length))];
  }
  function PickNeg() {
    const pool = _grades.length ? _grades : FallbackGrades();
    const neg = pool.filter(g => !IsPositive(g));
    return (neg.length ? neg : pool)[0 | (Math.random() * (neg.length || pool.length))];
  }

  function SyncApples(gs) {
    const maxA = Math.max(1, Math.min(gs.mods.maxApples, 3));
    let hasPosApple = gs.apples.some(a =>  IsPositive(a.grade));
    let hasNegApple = gs.apples.some(a => !IsPositive(a.grade));

    while (gs.apples.length < maxA) {
      const pos = RandomEmpty(gs);
      if (!pos) break;

      let g;
      if (!hasPosApple) {
        g = PickPos(); hasPosApple = true;
      } else if (!hasNegApple && gs.mods.negRate > 0 && Math.random() < gs.mods.negRate) {
        g = PickNeg(); hasNegApple = true;
      } else {
        g = PickPos(); hasPosApple = true;
      }

      gs.apples.push({ x: pos.x, y: pos.y, grade: g, color: GradeColor(g.Pct), born: performance.now(),
                       txt: g.Pct != null ? `${Math.round(g.Pct)}` : '?', eff: GradeEffect(g.Pct) });
    }
  }

  function MaybePower(gs) {
    if (!gs.mods.powerUps || gs.power || gs.applesEaten < 3 || Math.random() > 0.16) return;
    const pos = RandomEmpty(gs);
    if (pos) gs.power = { x: pos.x, y: pos.y, kind: Math.random() < 0.6 ? 'dbl' : 'slow', life: PU_LIFE, born: performance.now() };
  }

  function Step(gs) {
    if (gs.dirQ.length) gs.nextDir = gs.dirQ.shift();
    gs.dir = gs.nextDir;
    const nx = gs.snake[0].x + gs.dir.x;
    const ny = gs.snake[0].y + gs.dir.y;

    if (nx < 0 || nx >= gs.N || ny < 0 || ny >= gs.N) {
      gs.PrevSnake = gs.snake.map(s => ({ x: s.x, y: s.y }));
      gs.snake.unshift({ x: nx, y: ny });
      gs.status = 'gameover';
      return;
    }

    const tailsFreed = gs.growthBuffer >= 1 ? 0 : gs.growthBuffer <= -1 ? 2 : 1;
    for (let i = 0; i < gs.snake.length; i++) {
      if (i >= gs.snake.length - tailsFreed) continue;
      if (gs.snake[i].x === nx && gs.snake[i].y === ny) {
        gs.PrevSnake = gs.snake.map(s => ({ x: s.x, y: s.y }));
        gs.snake.unshift({ x: nx, y: ny });
        gs.status = 'gameover';
        return;
      }
    }

    gs.PrevSnake = gs.snake.map(s => ({ x: s.x, y: s.y }));

    gs.snake.unshift({ x: nx, y: ny });
    for (let i = gs.bulges.length - 1; i >= 0; i--) if (++gs.bulges[i] >= gs.snake.length) gs.bulges.splice(i, 1);

    const C = CV / gs.N, hx = (nx + 0.5) * C, hy = (ny + 0.5) * C;
    const ai = gs.apples.findIndex(a => a.x === nx && a.y === ny);
    if (ai >= 0) {
      const apple = gs.apples.splice(ai, 1)[0];
      const rawDelta = GradeEffect(apple.grade.Pct);
      const delta    = rawDelta > 0 ? rawDelta * (gs.mods.posBoost || 1) : rawDelta;
      gs.growthBuffer = Math.max(-3, Math.min(3, gs.growthBuffer + delta));
      gs.applesEaten++;
      gs.lastEaten = apple.grade;
      const pts = Math.round((apple.grade.Pct ?? 60) * Math.abs(rawDelta) * 10);
      if (rawDelta > 0) {
        const got = gs.fx.dbl > 0 ? pts * 2 : pts;
        gs.score += got;
        gs.toxicity = Math.max(0, gs.toxicity - 0.15 * rawDelta);
        Popup(`+${got}`, hx, hy, gs.fx.dbl > 0 ? '#facc15' : '#4ade80');
        if (gs.bulges.length < 4) gs.bulges.push(0);
      } else {
        gs.score = Math.max(0, gs.score - pts);
        gs.toxicity = Math.min(1, gs.toxicity + 0.35 * Math.abs(rawDelta));
        Popup(`−${pts}`, hx, hy, '#f87171');
        for (let i = 0; i < 6; i++) Part(hx, hy, (Math.random() - 0.5) * 60, -20 - Math.random() * 50, 0.7, C * 0.22, '#8b8fa3', 1, -30);
        gs.shake = 3;
      }
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * TAU, v = 70 + Math.random() * 130;
        Part(hx, hy, Math.cos(a) * v, Math.sin(a) * v - 40, 0.45 + Math.random() * 0.3, C * (0.06 + Math.random() * 0.07), apple.color, 0, 380);
      }
      gs.flash = { x: nx, y: ny, color: apple.color, t: 0 };
      SyncApples(gs);
      MaybePower(gs);
    }

    if (gs.power && gs.power.x === nx && gs.power.y === ny) {
      const D = PU[gs.power.kind];
      gs.fx[gs.power.kind] = D.ms;
      Popup(_GameText(D.key), hx, hy, D.col);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * TAU, v = 90 + Math.random() * 60;
        Part(hx, hy, Math.cos(a) * v, Math.sin(a) * v, 0.6, C * 0.1, D.col, 2, 0);
      }
      gs.flash = { x: nx, y: ny, color: D.col, t: 0 };
      gs.power = null;
    }

    if (gs.growthBuffer >= 1) {
      gs.growthBuffer -= 1;
    } else if (gs.growthBuffer <= -1) {
      gs.growthBuffer += 1;
      const t1 = gs.snake.pop();
      Puff(t1, C);
      if (gs.snake.length > MIN_LEN) Puff(gs.snake.pop(), C);
    } else {
      gs.snake.pop();
    }

    if (!gs.lvl.freePlay && gs.score >= gs.lvl.target) gs.status = 'win';
  }

  function Puff(p, C) {
    for (let i = 0; i < 4; i++) Part((p.x + 0.5) * C, (p.y + 0.5) * C, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.5, C * 0.25, _dark ? '#c7cbe0' : '#ffffff', 1, 0);
  }

  function GetSpeed(gs) { return Math.max(60, Math.round(gs.lvl.speed / (gs.mods.speedMult || 1))) * (gs.fx.slow > 0 ? 1.5 : 1); }

  function Part(x, y, vx, vy, T, r, c, k, g) {
    if (_np >= _parts.length) return;
    const p = _parts[_np++];
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.T = T; p.r = r; p.c = c; p.k = k; p.g = g;
  }
  function Popup(txt, x, y, c) {
    let p = _pops[0];
    for (const q of _pops) if (q.t >= q.T) { p = q; break; }
    p.txt = txt; p.c = c; p.x = Math.max(30, Math.min(CV - 30, x)); p.y = Math.max(20, y); p.t = 0; p.T = 0.9;
  }

  function UpdateFx(dt) {
    const s = dt / 1000;
    for (let i = _np - 1; i >= 0; i--) {
      const p = _parts[i];
      p.t += s;
      if (p.t >= p.T) { _parts[i] = _parts[--_np]; _parts[_np] = p; continue; }
      p.vy += p.g * s; p.vx *= 1 - s * 2; p.x += p.vx * s; p.y += p.vy * s;
    }
    for (const p of _pops) if (p.t < p.T) p.t += s;
    if (GS.flash) { GS.flash.t = Math.min(1, GS.flash.t + dt / 320); if (GS.flash.t >= 1) GS.flash = null; }
    GS.shake *= Math.exp(-dt / 80);
    GS.clock += dt;
  }

  function Tick(dt) {
    GS.moveT += dt / GetSpeed(GS);
    GS.toxicity = Math.max(0, GS.toxicity - dt * 0.00018);
    GS.fx.dbl = Math.max(0, GS.fx.dbl - dt);
    GS.fx.slow = Math.max(0, GS.fx.slow - dt);
    if (GS.power && (GS.power.life -= dt) <= 0) { Puff(GS.power, CV / GS.N); GS.power = null; }

    if (GS.moveT >= 1) {
      GS.moveT = Math.min(0.5, GS.moveT - 1);
      Step(GS);
      if (GS.status === 'gameover') {
        GS.moveT = 0.22; GS.dead = { t: 0 }; GS.shake = 7;
        return;
      }
      if (GS.status === 'win') { GS.winT = 0; Confetti(); return; }
    }
  }

  function Confetti() {
    const cols = ['#4ade80', '#facc15', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'];
    for (let i = 0; i < 90; i++) Part(Math.random() * CV, -10 - Math.random() * 60, (Math.random() - 0.5) * 80, 60 + Math.random() * 120, 1.6 + Math.random() * 0.8, 3 + Math.random() * 3, cols[i % 6], 3, 90);
  }

  function Frame(ts) {
    _raf = requestAnimationFrame(Frame);
    const dt = Math.min(ts - (_last || ts), 50);
    _last = ts;
    if (!GS || !_root || _root.style.display === 'none') return;
    if (GS.status !== 'paused') UpdateFx(dt);
    if (GS.status === 'playing') Tick(dt);
    else if (GS.dead && GS.dead.t < DEAD_MS) { GS.dead.t += dt; if (GS.dead.t >= DEAD_MS) ShowGameOver(); }
    else if (GS.winT >= 0 && GS.winT < WIN_MS) { GS.winT += dt; if (GS.winT >= WIN_MS) ShowWin(); }
    Draw();
  }

  function StartLoop() { if (!_raf) { _last = 0; _raf = requestAnimationFrame(Frame); } }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function BodyColor(tox) {
    const r0 = Math.round(74  + (248 - 74)  * tox);
    const g0 = Math.round(222 + (113 - 222) * tox);
    const b0 = Math.round(128 + (113 - 128) * tox);
    return '#' + [r0, g0, b0].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function PaintDisc(g, r, c) {
    const gr = g.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, 0, 0, r);
    gr.addColorStop(0, Lt(c, 0.42)); gr.addColorStop(0.5, c); gr.addColorStop(1, Dk(c, 0.2));
    g.fillStyle = gr; Circ(g, 0, 0, r); g.fill();
  }

  function PaintApple(g, cx, cy, r, col, bad) {
    const lw = Math.max(1.2, r * 0.13), o = Mix(col, OUT, 0.7);
    g.save(); g.translate(cx, cy);
    g.lineWidth = lw * 2; g.strokeStyle = o;
    g.beginPath(); g.moveTo(r * 0.02, -r * 0.75); g.quadraticCurveTo(r * 0.12, -r * 1.15, r * 0.32, -r * 1.25); g.stroke();
    Ell(g, r * 0.5, -r * 0.98, r * 0.34, r * 0.17, -0.5); g.stroke();
    g.beginPath(); g.arc(-r * 0.32, 0, r * 0.74, 0, TAU); g.arc(r * 0.32, 0, r * 0.74, 0, TAU); g.moveTo(0, r * 0.8); g.arc(0, r * 0.18, r * 0.66, 0, TAU); g.stroke();
    const gr = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, r * 0.1, r * 1.15);
    gr.addColorStop(0, Lt(col, 0.4)); gr.addColorStop(0.5, col); gr.addColorStop(1, Dk(col, 0.28));
    g.fillStyle = gr;
    g.beginPath(); g.arc(-r * 0.32, 0, r * 0.74, 0, TAU); g.fill();
    g.beginPath(); g.arc(r * 0.32, 0, r * 0.74, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, r * 0.18, r * 0.66, 0, TAU); g.fill();
    g.lineWidth = lw * 0.9; g.strokeStyle = Dk(col, 0.35);
    g.beginPath(); g.moveTo(-r * 0.18, -r * 0.6); g.quadraticCurveTo(0, -r * 0.48, r * 0.18, -r * 0.6); g.stroke();
    g.lineWidth = lw * 1.05; g.strokeStyle = '#7c4a1e';
    g.beginPath(); g.moveTo(r * 0.02, -r * 0.75); g.quadraticCurveTo(r * 0.12, -r * 1.15, r * 0.32, -r * 1.25); g.stroke();
    Ell(g, r * 0.5, -r * 0.98, r * 0.32, r * 0.15, -0.5); g.fillStyle = bad ? '#8a9a3a' : '#4ade80'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; Ell(g, r * 0.45, -r * 1.02, r * 0.18, r * 0.05, -0.5); g.fill();
    if (bad) {
      g.fillStyle = Rgba(Dk(col, 0.45), 0.55);
      Ell(g, r * 0.42, r * 0.28, r * 0.17, r * 0.13, 0.4); g.fill();
      Ell(g, -r * 0.5, r * 0.36, r * 0.11, r * 0.09); g.fill();
      Ell(g, r * 0.05, r * 0.62, r * 0.08, r * 0.06); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.6)'; Ell(g, -r * 0.5, -r * 0.3, r * 0.17, r * 0.27, 0.5); g.fill();
    g.restore();
  }

  function PaintStar(g, r, col) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * 0.46 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    g.closePath();
    g.lineWidth = Math.max(1.4, r * 0.16); g.strokeStyle = Mix(col, OUT, 0.65); g.stroke();
    const gr = g.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, Lt(col, 0.45)); gr.addColorStop(1, Dk(col, 0.15));
    g.fillStyle = gr; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.65)'; Ell(g, -r * 0.2, -r * 0.3, r * 0.18, r * 0.1, -0.6); g.fill();
  }

  function PaintClock(g, r, col) {
    const lw = Math.max(1.4, r * 0.15);
    Circ(g, 0, 0, r); g.lineWidth = lw * 2; g.strokeStyle = Mix(col, OUT, 0.65); g.stroke();
    PaintDisc(g, r, col);
    Circ(g, 0, 0, r * 0.68); g.fillStyle = '#f8fafc'; g.fill(); g.lineWidth = lw * 0.7; g.strokeStyle = Dk(col, 0.3); g.stroke();
    g.strokeStyle = OUT; g.lineWidth = lw * 0.8;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.48); g.moveTo(0, 0); g.lineTo(r * 0.34, r * 0.1); g.stroke();
    Circ(g, 0, -r * 1.08, r * 0.18); g.fillStyle = Dk(col, 0.1); g.fill();
  }

  function BuildBg(N) {
    const s = Cv(CV, CV, _k), g = s.g, C = CV / N;
    const A = _dark ? '#1c2142' : '#eceefc', B = _dark ? '#181c3a' : '#e1e5f8';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      g.fillStyle = (x + y) % 2 ? B : A;
      g.fillRect(x * C, y * C, C + 0.5, C + 0.5);
    }
    let seed = N * 131 + (_dark ? 7 : 3);
    const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.lineWidth = 1;
    for (let i = 0; i < N * N * 0.5; i++) {
      const x = R() * CV, y = R() * CV;
      g.fillStyle = _dark ? `rgba(160,170,255,${0.04 + R() * 0.06})` : `rgba(110,100,190,${0.04 + R() * 0.05})`;
      Circ(g, x, y, 0.6 + R() * 1.2); g.fill();
    }
    for (let i = 0; i < Math.max(3, N * 0.4); i++) {
      const x = R() * CV, y = R() * CV, r = C * (0.12 + R() * 0.1);
      g.strokeStyle = _dark ? 'rgba(170,180,255,0.07)' : 'rgba(110,100,190,0.09)';
      g.lineWidth = 1.4;
      g.beginPath();
      for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, q = j % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
      g.closePath(); g.stroke();
    }
    const v = g.createRadialGradient(CV / 2, CV / 2, CV * 0.3, CV / 2, CV / 2, CV * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, _dark ? 'rgba(4,4,20,0.45)' : 'rgba(70,60,140,0.1)');
    g.fillStyle = v; g.fillRect(0, 0, CV, CV);
    g.strokeStyle = _dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
    g.lineWidth = 2; RR(g, 1, 1, CV - 2, CV - 2, 8); g.stroke();
    return s;
  }

  function BuildSprites(N) {
    const C = CV / N, k = _k, R = C * 0.39;
    _S = { C, R, tube: {}, apple: {}, txt: {}, badge: {}, glow: {} };
    _sN = N; _sK = k; _sD = _dark;
    _bg = BuildBg(N);
    const D = Math.ceil(R * 2 + 4);
    _S.D = D;
    const sh = Cv(C * 1.2, C * 0.5, k);
    sh.g.fillStyle = _dark ? 'rgba(0,0,0,0.4)' : 'rgba(50,40,110,0.18)';
    Ell(sh.g, C * 0.6, C * 0.25, C * 0.42, C * 0.16); sh.g.fill();
    _S.shadow = sh;
    const spot = Cv(D, D, k);
    spot.g.fillStyle = 'rgba(0,40,20,0.22)'; Ell(spot.g, D / 2, D / 2, R * 0.32, R * 0.24); spot.g.fill();
    _S.spot = spot;
    const pu = (fn, col) => { const s = Cv(C * 1.2, C * 1.2, k); s.g.translate(C * 0.6, C * 0.62); fn(s.g, C * 0.36, col); return s; };
    _S.star = pu(PaintStar, PU.dbl.col);
    _S.clock = pu(PaintClock, PU.slow.col);
    for (const [e, t, c] of [[1, '++', '#16a34a'], [0.5, '+', '#65a30d'], [-0.5, '−', '#ea580c'], [-1, '−−', '#dc2626']]) {
      const s = Cv(C * 0.5, C * 0.4, k), g = s.g, w = C * 0.5, h = C * 0.4;
      RR(g, 1, 1, w - 2, h - 2, h / 2); g.fillStyle = c; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
      g.fillStyle = '#ffffff'; g.font = `900 ${h * 0.62}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, w / 2, h / 2 + 0.5);
      _S.badge[e] = s;
    }
    for (const c of ['#4ade80', '#a3e635', '#f97316', '#f87171', '#a78bfa', PU.dbl.col, PU.slow.col]) {
      const s = Cv(C * 2, C * 2, k), g = s.g, gr = g.createRadialGradient(C, C, 0, C, C, C);
      gr.addColorStop(0, Rgba(c, 0.45)); gr.addColorStop(1, Rgba(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, C * 2, C * 2);
      _S.glow[c] = s;
    }
  }

  function TubeCols(tox) {
    if (_S.tube[tox]) return _S.tube[tox];
    const base = BodyColor(tox / 8);
    return (_S.tube[tox] = { out: Mix(base, OUT, 0.72), shade: Dk(base, 0.2), hi: Lt(base, 0.36), body: [0, 1, 2, 3, 4, 5].map(b => Dk(base, b * 0.035)) });
  }
  function AppleSpr(col, bad) {
    const key = col + (bad ? 'b' : '');
    if (_S.apple[key]) return _S.apple[key];
    const C = _S.C, s = Cv(C * 1.3, C * 1.3, _sK);
    PaintApple(s.g, C * 0.65, C * 0.74, C * 0.37, col, bad);
    return (_S.apple[key] = s);
  }
  function TxtSpr(t) {
    if (_S.txt[t]) return _S.txt[t];
    const C = _S.C, s = Cv(C, C, _sK), g = s.g;
    g.font = `900 ${Math.max(7, C * 0.28)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = Math.max(2, C * 0.09); g.strokeStyle = 'rgba(30,20,40,0.75)'; g.strokeText(t, C / 2, C / 2);
    g.fillStyle = '#ffffff'; g.fillText(t, C / 2, C / 2);
    return (_S.txt[t] = s);
  }

  let _nx = 0, _ny = 0;
  function Node(j, L, t) {
    const s = GS.snake, C = _S.C;
    if (j === 0) {
      const a = s[1] || s[0], b = s[0];
      _nx = (a.x + (b.x - a.x) * t + 0.5) * C; _ny = (a.y + (b.y - a.y) * t + 0.5) * C;
    } else if (j < L) {
      _nx = (s[j].x + 0.5) * C; _ny = (s[j].y + 0.5) * C;
    } else {
      const b = s[L - 1], a = GS.PrevSnake[L - 1] || b;
      _nx = (a.x + (b.x - a.x) * t + 0.5) * C; _ny = (a.y + (b.y - a.y) * t + 0.5) * C;
    }
  }

  function DrawSnake(x, t) {
    const L = GS.snake.length, C = _S.C, ds = C / 4.5;
    if (L * 6 + 8 > SX.length) { SX = new Float32Array(L * 8); SY = new Float32Array(L * 8); SD = new Float32Array(L * 8); SR = new Float32Array(L * 8); }
    let n = 0, s = 0, need = 0;
    Node(0, L, t);
    let ax = _nx, ay = _ny;
    for (let j = 0; j < L; j++) {
      Node(j + 1, L, t);
      const bx = _nx, by = _ny, len = Math.hypot(bx - ax, by - ay);
      while (need <= s + len) {
        const u = len ? (need - s) / len : 0;
        SX[n] = ax + (bx - ax) * u; SY[n] = ay + (by - ay) * u; SD[n] = need; n++;
        need += ds;
      }
      s += len; ax = bx; ay = by;
    }
    SX[n] = ax; SY[n] = ay; SD[n] = s; n++;
    const D = _S.D, total = Math.max(s, C), tl = Math.min(2, total / C * 0.45);
    const dead = GS.dead, flick = dead && dead.t < 500 && Math.floor(dead.t / 90) % 2 === 0;
    const tox = flick ? 8 : Math.round(GS.toxicity * 8);
    const glow = GS.fx.dbl > 0 && (GS.fx.dbl > 1500 || Math.floor(GS.fx.dbl / 120) % 2 === 0);
    const P = TubeCols(tox), lw = Math.max(1.2, C * 0.06);
    for (let i = 0; i < n; i++) {
      const d = SD[i] / C, fromTail = (total - SD[i]) / C;
      let r = fromTail < tl ? 0.5 + 0.5 * (fromTail / tl) : 1;
      for (const b of GS.bulges) { const q = Math.abs(d - b - t); if (q < 1) r *= 1 + 0.28 * (1 - q); }
      SR[i] = _S.R * r;
    }
    if (glow) {
      x.globalAlpha = _dark ? 0.35 : 0.5; if (_dark) x.globalCompositeOperation = 'lighter';
      for (let i = n - 1; i >= 0; i -= 3) x.drawImage(_S.glow[PU.dbl.col].c, SX[i] - C, SY[i] - C, C * 2, C * 2);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    }
    const HR = _S.R * 1.12, hx = SX[0], hy = SY[0];
    Circ(x, hx, hy, HR + lw); x.fillStyle = P.out; x.fill();
    x.lineCap = 'round';
    for (let pass = 0; pass < 4; pass++) {
      const ox = pass === 2 ? -0.1 : pass === 3 ? -0.3 : 0, oy = pass === 2 ? -0.14 : pass === 3 ? -0.36 : 0;
      const wm = pass === 2 ? 0.8 : pass === 3 ? 0.32 : 1, ex = pass === 0 ? lw * 2 : 0;
      x.strokeStyle = pass === 0 ? P.out : pass === 1 ? P.shade : P.hi;
      for (let i = n - 1; i > 0; i--) {
        const R = SR[i];
        if (pass === 2) x.strokeStyle = P.body[Math.min(5, Math.floor(SD[i] / total * 6))];
        x.lineWidth = 2 * R * wm + ex;
        x.beginPath(); x.moveTo(SX[i] + ox * R, SY[i] + oy * R); x.lineTo(SX[i - 1] + ox * R, SY[i - 1] + oy * R); x.stroke();
      }
    }
    Circ(x, hx, hy, HR); x.fillStyle = P.shade; x.fill();
    Circ(x, hx - HR * 0.1, hy - HR * 0.14, HR * 0.8); x.fillStyle = P.body[0]; x.fill();
    Ell(x, hx - HR * 0.32, hy - HR * 0.4, HR * 0.3, HR * 0.18, -0.5); x.fillStyle = P.hi; x.fill();
    for (let j = 2; j < L; j += 2) {
      Node(j, L, t);
      x.drawImage(_S.spot.c, _nx - D / 2, _ny - D / 2, D, D);
    }
    DrawHead(x, SX[0], SY[0], C);
  }

  const SIGNS = [-1, 1];
  function DrawHead(x, hx, hy, C) {
    const d = GS.dir, px = -d.y, py = d.x, R = _S.R * 1.12;
    const er = Math.max(1.6, C * 0.13), fw = R * 0.28, side = R * 0.48;
    const dead = !!GS.dead || GS.status === 'gameover';
    const blink = !dead && GS.clock % 3600 < 120;
    let ahead = false;
    const h = GS.snake[0];
    for (const a of GS.apples) if ((a.x === h.x + d.x && a.y === h.y + d.y) || (a.x === h.x + 2 * d.x && a.y === h.y + 2 * d.y)) ahead = true;
    if (ahead && !dead) {
      x.fillStyle = '#7f1d1d';
      Ell(x, hx + d.x * R * 0.72, hy + d.y * R * 0.72, Math.abs(px) * R * 0.5 + Math.abs(d.x) * R * 0.2, Math.abs(py) * R * 0.5 + Math.abs(d.y) * R * 0.2);
      x.fill();
    } else if (!dead && GS.status === 'playing' && GS.clock % 1700 < 220) {
      const tx = hx + d.x * R * 0.9, ty = hy + d.y * R * 0.9, tl = R * 0.55;
      x.strokeStyle = '#ef4444'; x.lineWidth = Math.max(1.2, C * 0.05);
      x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + d.x * tl, ty + d.y * tl);
      x.lineTo(tx + d.x * tl * 1.35 + px * tl * 0.3, ty + d.y * tl * 1.35 + py * tl * 0.3);
      x.moveTo(tx + d.x * tl, ty + d.y * tl);
      x.lineTo(tx + d.x * tl * 1.35 - px * tl * 0.3, ty + d.y * tl * 1.35 - py * tl * 0.3);
      x.stroke();
    }
    for (const sg of SIGNS) {
      const ex = hx + d.x * fw + px * side * sg, ey = hy + d.y * fw + py * side * sg;
      if (dead) {
        x.strokeStyle = OUT; x.lineWidth = Math.max(1.3, C * 0.06);
        const q = er * 0.8;
        x.beginPath(); x.moveTo(ex - q, ey - q); x.lineTo(ex + q, ey + q); x.moveTo(ex + q, ey - q); x.lineTo(ex - q, ey + q); x.stroke();
        continue;
      }
      if (blink) {
        x.strokeStyle = OUT; x.lineWidth = Math.max(1.3, C * 0.06);
        x.beginPath(); x.moveTo(ex - px * er, ey - py * er); x.lineTo(ex + px * er, ey + py * er); x.stroke();
        continue;
      }
      Circ(x, ex, ey, er); x.fillStyle = '#ffffff'; x.fill();
      x.lineWidth = Math.max(1, C * 0.045); x.strokeStyle = OUT; x.stroke();
      Circ(x, ex + d.x * er * 0.35, ey + d.y * er * 0.35, er * 0.55); x.fillStyle = OUT; x.fill();
      Circ(x, ex + d.x * er * 0.15 - er * 0.2, ey + d.y * er * 0.15 - er * 0.25, er * 0.2); x.fillStyle = '#ffffff'; x.fill();
    }
    x.fillStyle = 'rgba(20,40,20,0.45)';
    for (const sg of SIGNS) { Circ(x, hx + d.x * R * 0.72 + px * R * 0.16 * sg, hy + d.y * R * 0.72 + py * R * 0.16 * sg, Math.max(0.8, C * 0.025)); x.fill(); }
  }

  function Draw() {
    if (!_ctx || !GS) return;
    const N = GS.N;
    if (_sN !== N || _sK !== _k || _sD !== _dark || !_S) BuildSprites(N);
    const x = _ctx, C = _S.C, now = performance.now();
    const t = GS.status === 'playing' ? Math.min(1, GS.moveT) : GS.status === 'start' ? 0 : GS.moveT;
    let sx = 0, sy = 0;
    if (GS.shake > 0.2) { sx = (Math.random() - 0.5) * GS.shake; sy = (Math.random() - 0.5) * GS.shake; }
    x.setTransform(_k, 0, 0, _k, sx * _k, sy * _k);
    x.drawImage(_bg.c, 0, 0, CV, CV);

    if (_dark) {
      x.globalCompositeOperation = 'lighter';
      for (const f of _flies) {
        const fx = (f.x + Math.sin(now / 2300 + f.p) * 30 + CV) % CV, fy = (f.y + Math.cos(now / 3100 + f.p) * 24 + CV) % CV;
        x.globalAlpha = 0.25 + 0.25 * Math.sin(now / 600 + f.p * 3);
        x.drawImage(_S.glow['#a3e635'].c, fx - C * 0.35, fy - C * 0.35, C * 0.7, C * 0.7);
      }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    }

    if (GS.flash) {
      const f = GS.flash, r = C * (0.35 + f.t * 0.9);
      x.globalAlpha = (1 - f.t) * 0.8;
      x.strokeStyle = f.color; x.lineWidth = Math.max(2, C * 0.12 * (1 - f.t));
      Circ(x, (f.x + 0.5) * C, (f.y + 0.5) * C, r); x.stroke();
      x.globalAlpha = 1;
    }

    for (const a of GS.apples) {
      const age = (now - a.born) / 300, pop = age >= 1 ? 1 : 1 + 2.4 * Math.pow(age - 1, 3) + 1.4 * Math.pow(age - 1, 2);
      const bob = Math.sin((now - a.born) / 420 * Math.PI) * C * 0.05;
      const ax = a.x * C, ay = a.y * C, sc = Math.max(0, pop);
      x.drawImage(_S.shadow.c, ax - C * 0.1 + C * 0.6 * (1 - sc), ay + C * 0.62, C * 1.2 * sc, C * 0.5 * sc);
      if (_dark) x.drawImage(_S.glow[a.color].c, ax - C * 0.5, ay - C * 0.5, C * 2, C * 2);
      const w = C * 1.3 * sc;
      x.drawImage(AppleSpr(a.color, a.eff < 0).c, ax + C / 2 - w / 2, ay + C * 0.55 - w * 0.55 + bob - C * 0.04, w, w);
      if (C >= 15 && sc > 0.6) x.drawImage(TxtSpr(a.txt).c, ax, ay + C * 0.08 + bob, C, C);
      if (C >= 12 && sc > 0.6) x.drawImage(_S.badge[a.eff].c, ax + C * 0.56, ay - C * 0.06, C * 0.5, C * 0.4);
    }

    if (GS.power) {
      const p = GS.power, D = PU[p.kind], age = (now - p.born) / 300, sc = age >= 1 ? 1 : 1 + 2.4 * Math.pow(age - 1, 3) + 1.4 * Math.pow(age - 1, 2);
      const blink = p.life < 1800 && Math.floor(p.life / 130) % 2 === 0;
      const cx = (p.x + 0.5) * C, cy = (p.y + 0.5) * C;
      x.drawImage(_S.glow[D.col].c, cx - C, cy - C, C * 2, C * 2);
      if (!blink) {
        const w = C * 1.2 * sc, rot = Math.sin(now / 300) * 0.18, rc = Math.cos(rot) * _k, rs = Math.sin(rot) * _k;
        x.setTransform(rc, rs, -rs, rc, (cx + sx) * _k, (cy + Math.sin(now / 260) * C * 0.05 + sy) * _k);
        x.drawImage((p.kind === 'dbl' ? _S.star : _S.clock).c, -w / 2, -w / 2, w, w);
        x.setTransform(_k, 0, 0, _k, sx * _k, sy * _k);
      }
      x.strokeStyle = Rgba(D.col, 0.85); x.lineWidth = Math.max(1.5, C * 0.07);
      x.beginPath(); x.arc(cx, cy, C * 0.52, -Math.PI / 2, -Math.PI / 2 + TAU * (p.life / PU_LIFE)); x.stroke();
    }

    DrawSnake(x, t);

    for (let i = 0; i < _np; i++) {
      const p = _parts[i], u = p.t / p.T;
      x.globalAlpha = p.k === 1 ? (1 - u) * 0.6 : 1 - u * u;
      x.fillStyle = p.c;
      if (p.k === 3) {
        const a = p.t * 6 + i, c = Math.cos(a) * _k, n = Math.sin(a) * _k;
        x.setTransform(c, n, -n, c, (p.x + sx) * _k, (p.y + sy) * _k); x.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); x.setTransform(_k, 0, 0, _k, sx * _k, sy * _k);
      }
      else { Circ(x, p.x, p.y, p.k === 1 ? p.r * (0.6 + u * 0.8) : p.r * (1 - u * 0.4)); x.fill(); }
    }
    x.globalAlpha = 1;

    x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    for (const p of _pops) {
      if (p.t >= p.T) continue;
      const u = p.t / p.T, sc = u < 0.18 ? 0.7 + u / 0.18 * 0.4 : u < 0.3 ? 1.1 - (u - 0.18) * 0.8 : 1;
      const z = sc * _k;
      x.globalAlpha = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      x.setTransform(z, 0, 0, z, (p.x + sx) * _k, (p.y - C * 0.5 - u * 28 + sy) * _k);
      x.font = F_POP; x.lineWidth = 4; x.strokeStyle = OUT; x.strokeText(p.txt, 0, 0);
      x.fillStyle = p.c; x.fillText(p.txt, 0, 0);
    }
    x.globalAlpha = 1;
    x.setTransform(_k, 0, 0, _k, sx * _k, sy * _k);

    if (!GS.lvl.freePlay) {
      const prog = Math.min(1, GS.score / GS.lvl.target);
      x.fillStyle = _dark ? 'rgba(255,255,255,0.08)' : 'rgba(60,50,120,0.1)';
      RR(x, 6, CV - 8, CV - 12, 4, 2); x.fill();
      if (prog > 0) { x.fillStyle = '#4ade80'; RR(x, 6, CV - 8, (CV - 12) * prog, 4, 2); x.fill(); }
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    UpdateHUD();
  }
  const F_POP = `900 17px ${FONT}`;

  function SetText(id, v) {
    if (_hud[id] === v) return;
    const e = document.getElementById(id);
    if (e) { e.textContent = v; _hud[id] = v; }
  }
  function SetStyle(id, prop, v) {
    const key = id + prop;
    if (_hud[key] === v) return;
    const e = document.getElementById(id);
    if (e) { e.style[prop] = v; _hud[key] = v; }
  }

  function UpdateHUD() {
    if (!GS) return;
    const isFP = GS.lvl.freePlay;
    const prog = isFP ? 1 : Math.min(1, GS.score / GS.lvl.target);
    if (_hud.score !== GS.score || _hud.lvl !== GS.lvl) {
      _hud.score = GS.score; _hud.lvl = GS.lvl;
      SetText('gf-sn-score',   GS.score.toLocaleString());
      SetText('gf-sn-target',  isFP ? '∞' : GS.lvl.target.toLocaleString());
      SetText('gf-sn-progpct', isFP ? _GameText('game_snake_free').toUpperCase() : `${Math.round(prog * 100)}%`);
      SetText('gf-sn-lvl',     `${isFP ? '∞' : `L${GS.lvl.id}`} · ${GS.N}×${GS.N}`);
      SetStyle('gf-sn-progbar', 'transform', `scaleX(${isFP ? 1 : prog.toFixed(3)})`);
      SetStyle('gf-sn-progbar', 'background', isFP ? 'linear-gradient(90deg,#c4b5fd,#a78bfa)' : 'linear-gradient(90deg,#86efac,#22c55e)');
    }
    if (_hud.len !== GS.snake.length) { _hud.len = GS.snake.length; SetText('gf-sn-len', `${GS.snake.length}`); }
    if (_hud.eaten !== GS.applesEaten) { _hud.eaten = GS.applesEaten; SetText('gf-sn-eaten', String(GS.applesEaten)); }

    const buf = Math.max(-3, Math.min(3, GS.growthBuffer));
    if (_hud.buf !== buf) {
      _hud.buf = buf;
      SetStyle('gf-sn-gbuf', 'transform', `scaleX(${((buf + 3) / 6).toFixed(3)})`);
      SetStyle('gf-sn-gbuf', 'background', buf >= 0 ? 'linear-gradient(90deg,#86efac,#22c55e)' : 'linear-gradient(90deg,#fca5a5,#ef4444)');
    }

    const fx = GS.fx, kind = fx.dbl > 0 ? 'dbl' : fx.slow > 0 ? 'slow' : '';
    SetStyle('gf-sn-pu', 'display', kind ? 'flex' : 'none');
    if (kind) {
      SetText('gf-sn-pu-name', _GameText(PU[kind].key));
      SetStyle('gf-sn-pu', 'color', _dark ? PU[kind].col : Dk(PU[kind].col, 0.4));
      SetStyle('gf-sn-pubar', 'transform', `scaleX(${(fx[kind] / PU[kind].ms).toFixed(2)})`);
      SetStyle('gf-sn-pubar', 'background', PU[kind].col);
    }

    if (GS.lastEaten && _hud.le !== GS.lastEaten) {
      _hud.le = GS.lastEaten;
      SetText('gf-sn-le-subj', GS.lastEaten.subject || '');
      const eff = GradeEffect(GS.lastEaten.Pct);
      const eEl = document.getElementById('gf-sn-le-eff');
      if (eEl) { eEl.textContent = eff === 1 ? '+1' : eff === 0.5 ? '+½' : eff === -0.5 ? '−½' : '−1'; eEl.dataset.pos = eff > 0 ? '1' : '0'; }
      const pEl = document.getElementById('gf-sn-le-pct');
      if (pEl) { pEl.textContent = GS.lastEaten.Pct != null ? `${Math.round(GS.lastEaten.Pct)}%` : '?'; pEl.style.color = GradeColor(GS.lastEaten.Pct); }
    } else if (!GS.lastEaten && _hud.le) {
      _hud.le = null;
      SetText('gf-sn-le-subj', '-');
      SetText('gf-sn-le-eff', '');
      SetText('gf-sn-le-pct', '');
    }
  }

  const SCREEN_IDS = ['gf-sns-start','gf-sns-pause','gf-sns-gameover','gf-sns-win','gf-sns-mods'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    const isFP = GS.lvl.freePlay;
    const pEl = document.getElementById('gf-sns-go-pct');
    if (isFP) {
      SaveScore(GS.lvl.id, GS.score);
      const best = LoadScores()[GS.lvl.id] || 0;
      SetText('gf-sns-go-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()}`);
      SetText('gf-sns-go-pct',   `${_GameText('game_best')}: ${best.toLocaleString()}`);
      if (pEl) pEl.style.color = '#a78bfa';
      SetStyle('gf-sns-go-bar', 'width', '100%');
    } else {
      const p = Math.min(100, Math.round(GS.score / GS.lvl.target * 100));
      SetText('gf-sns-go-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()} / ${GS.lvl.target.toLocaleString()}`);
      SetText('gf-sns-go-pct',   `${p}% ${_GameText('game_snake_of_target')}`);
      if (pEl) pEl.style.color = '#f97316';
      SetStyle('gf-sns-go-bar', 'width', `${p}%`);
    }
    ShowScreen('gf-sns-gameover');
  }

  function ShowWin() {
    SaveScore(GS.lvl.id, GS.score);
    SaveUnlock(GS.lvl.id);
    const unlocked  = LoadUnlock();
    const nextLvl   = LEVELS.find(l => l.id === GS.lvl.id + 1);
    const hasNext   = nextLvl && !nextLvl.freePlay;
    const wonL5     = GS.lvl.id === 5;
    SetText('gf-sns-win-title', wonL5 ? `★ ${_GameText('game_snake_all_clear')}` : `${_GameText('game_snake_level_clear')}`);
    SetText('gf-sns-win-score', `${GS.score.toLocaleString()} pts`);
    document.getElementById('gf-sns-next')?.style.setProperty('display', hasNext ? 'block' : 'none');
    const modsBtn = document.getElementById('gf-sns-mods-btn');
    if (modsBtn) {
      if (unlocked >= 5) {
        modsBtn.textContent = `∞  ${_GameText('game_snake_free_play')}`;
        modsBtn.style.display = 'block';
      } else {
        modsBtn.style.display = 'none';
      }
    }
    ShowScreen('gf-sns-win');
  }

  function BuildLevelSelect() {
    const el = document.getElementById('gf-sn-lvl-sel');
    if (!el) return;
    const unlocked  = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail   = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const prog    = l.freePlay || !bestPts ? 0 : Math.min(1, bestPts / l.target);
      const done    = !l.freePlay && l.id <= unlocked;
      const nm      = l.freePlay ? '∞' : `L${l.id}`;
      const sz      = l.freePlay ? `${_l6N}×${_l6N}` : `${l.N}×${l.N}`;
      const tgtTxt  = l.freePlay ? `${_GameText('game_snake_free_play')} - ${_GameText('game_snake_no_target')}` : `${l.target.toLocaleString()} pts`;
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_not_played');
      return `<button class="gf-snl${avail ? '' : ' gf-snl-locked'}${done ? ' gf-snl-done' : ''}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-snl-left">
          <div class="gf-snl-badge${l.freePlay ? ' gf-snl-badge-fp' : ''}">${nm}</div>
          <div class="gf-snl-info">
            <span class="gf-snl-name">${sz} ${_GameText('game_snake_grid')}</span>
            <span class="gf-snl-tgt">${tgtTxt}</span>
          </div>
        </div>
        <div class="gf-snl-right">
          ${avail && !l.freePlay ? `
            <div class="gf-snl-prog-track"><div class="gf-snl-prog-fill" style="width:${(prog*100).toFixed(0)}%"></div></div>
            <span class="gf-snl-best">${bestTxt}</span>
          ` : avail ? `<span class="gf-snl-best" style="color:#a78bfa">${bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_unlocked')}</span>` : `<span class="gf-snl-lock"></span>`}
        </div>
      </button>`;
    }).join('');
    el.querySelectorAll('[data-lvl]').forEach(btn => {
      btn.addEventListener('click', () => {
        _lvlId = parseInt(btn.dataset.lvl);
        DoStart();
      });
    });
    UpdatePuChip();
  }

  function UpdatePuChip() {
    const b = document.getElementById('gf-sns-pu');
    if (!b) return;
    const on = !!LoadMods().powerUps;
    b.classList.toggle('on', on);
    b.textContent = `${_GameText('game_snake_powerups')}: ${_GameText(on ? 'game_snake_on' : 'game_snake_off')}`;
  }

  function BuildModsScreen() {
    const el = document.getElementById('gf-sns-mods');
    if (!el) return;
    const m = LoadMods();
    function Opts(id, pairs, cur) {
      return `<div class="gf-mod-opts" id="${id}">${pairs.map(([v, lbl]) =>
        `<button class="gf-mod-btn${+cur === v ? ' gf-mod-active' : ''}" data-val="${v}">${lbl}</button>`).join('')}</div>`;
    }
    el.innerHTML = `
      <div class="gf-sns-card gf-sns-card-wide">
      <div class="gf-sns-logo" style="font-size:20px">${_GameText('game_snake_free_settings')}</div>
      <div class="gf-sns-sub">${_GameText('game_snake_tune')}</div>
      <div class="gf-mod-grid">
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_bad_rate')}</span>
          ${Opts('gfm-neg',[[0,_GameText('game_snake_none')],[0.1,_GameText('game_snake_rare')],[0.25,_GameText('game_snake_normal')],[0.5,_GameText('game_snake_often')],[0.8,_GameText('game_snake_lots')]], m.negRate)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_pos_boost')}</span>
          ${Opts('gfm-pos',[[1,'×1'],[1.5,'×1.5'],[2,'×2'],[3,'×3']], m.posBoost)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_speed')}</span>
          ${Opts('gfm-spd',[[0.5,_GameText('game_snake_slow')],[0.75,_GameText('game_snake_easy')],[1,_GameText('game_snake_normal')],[1.5,_GameText('game_snake_fast')],[2,_GameText('game_snake_chaos')]], m.speedMult)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_apples')}</span>
          ${Opts('gfm-apl',[[1,'1'],[2,'2'],[3,'3']], m.maxApples)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_powerups')}</span>
          ${Opts('gfm-pu',[[1,_GameText('game_snake_on')],[0,_GameText('game_snake_off')]], m.powerUps)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_grid_size')}</span>
          ${Opts('gfm-grid',[[5,'5×5'],[8,'8×8'],[11,'11×11'],[15,'15×15'],[20,'20×20']], _l6N)}</div>
      </div>
      <div class="gf-mod-actions">
        <button class="gf-ts-btn" id="gfm-save">▶&nbsp; ${_GameText('game_snake_start_free')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gfm-back">← ${_GameText('game_back')}</button>
      </div>
      </div>`;
    el.querySelectorAll('.gf-mod-opts').forEach(row => {
      row.querySelectorAll('.gf-mod-btn').forEach(btn => {
        btn.addEventListener('click', () => { row.querySelectorAll('.gf-mod-btn').forEach(b => b.classList.remove('gf-mod-active')); btn.classList.add('gf-mod-active'); });
      });
    });
    document.getElementById('gfm-save')?.addEventListener('click', () => {
      const pick = id => { const b = document.querySelector(`#${id} .gf-mod-active`); return b ? parseFloat(b.dataset.val) : null; };
      SaveMods({ negRate: pick('gfm-neg') ?? m.negRate, posBoost: pick('gfm-pos') ?? m.posBoost, speedMult: pick('gfm-spd') ?? m.speedMult, maxApples: pick('gfm-apl') ?? m.maxApples, powerUps: pick('gfm-pu') ?? m.powerUps });
      const gridPick = pick('gfm-grid'); if (gridPick != null) _l6N = gridPick;
      _lvlId = 6; DoStart();
    });
    document.getElementById('gfm-back')?.addEventListener('click', ShowStartScreen);
  }

  function ResetFx() {
    _np = 0;
    for (const p of _pops) p.t = p.T;
    _hud.le = undefined; _hud.score = undefined;
  }

  function DoStart() {
    GS = NewGameState(_lvlId); SyncApples(GS);
    GS.status = 'playing';
    ResetFx();
    ShowScreen(null); StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; ShowScreen('gf-sns-pause');
      SetText('gf-sns-pause-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()}`);
    } else if (GS.status === 'paused') {
      GS.status = 'playing';
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    GS = NewGameState(_lvlId); SyncApples(GS);
    ResetFx();
    BuildLevelSelect(); ShowScreen('gf-sns-start'); StartLoop();
  }

  let _kh = null;
  function OnKey(e) {
    if (!GS || !document.getElementById('gf-snake')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); GS.status === 'playing' || GS.status === 'paused' ? DoPause() : CloseGradeSnake(); return; }
    if (e.key === 'p' || e.key === 'P') { DoPause(); return; }
    if (e.key === 'r' || e.key === 'R') {
      if (GS.status !== 'start' && !document.getElementById('gf-sns-mods')?.offsetParent && !(GS.dead && GS.dead.t < DEAD_MS)) DoStart();
      return;
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (GS.status === 'start' || (GS.status === 'gameover' && (!GS.dead || GS.dead.t >= DEAD_MS))) DoStart();
        else if (GS.status === 'paused') DoPause();
        e.preventDefault();
      }
      return;
    }
    const d = GS.dirQ.length ? GS.dirQ[GS.dirQ.length - 1] : GS.nextDir;
    let nd = null;
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': if (d.y === 0) nd = { x:  0, y: -1 }; break;
      case 'ArrowDown':  case 's': case 'S': if (d.y === 0) nd = { x:  0, y:  1 }; break;
      case 'ArrowLeft':  case 'a': case 'A': if (d.x === 0) nd = { x: -1, y:  0 }; break;
      case 'ArrowRight': case 'd': case 'D': if (d.x === 0) nd = { x:  1, y:  0 }; break;
    }
    if (nd && GS.dirQ.length < 3) GS.dirQ.push(nd);
  }
  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); W.addEventListener('resize', Fit); }
  function DetachKeys()  { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } W.removeEventListener('resize', Fit); }
  function OnVisibilityChange()       { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-snake');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    _dark = el.dataset.theme === 'dark';
  }
  const _tobs = new MutationObserver(ApplyTheme);

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.6, Math.min(1, (innerHeight - 32 - 46 - 26) / CV, (innerWidth - 32 - 36 - 176) / CV));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(CV * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${w}px`;
    _root.style.setProperty('--gs-board-h', `${w}px`);
    const bw = Math.round(w * dpr);
    clearTimeout(_fitT);
    if (_cv.width !== bw) {
      if (!_S) { _cv.width = _cv.height = bw; _k = bw / CV; }
      else _fitT = setTimeout(() => { _cv.width = _cv.height = bw; _k = bw / CV; }, 120);
    }
  }

  function BuildArt() {
    const img = document.getElementById('gf-sns-art');
    if (!img) return;
    const k = Math.min(3, W.devicePixelRatio || 1), w = 150, h = 54, s = Cv(w, h, k), g = s.g, r = 9;
    const pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([14 + u * 92, 30 + Math.sin(u * Math.PI * 2.2 + 0.4) * 11]); }
    const c = '#4ade80';
    g.fillStyle = Mix(c, OUT, 0.72);
    pts.forEach(([x, y], i) => { const q = r * (0.55 + 0.45 * Math.min(1, i / 10)) + 1.5; Circ(g, x, y, q); g.fill(); });
    pts.forEach(([x, y], i) => { const q = r * (0.55 + 0.45 * Math.min(1, i / 10)); g.save(); g.translate(x, y); PaintDisc(g, q, c); g.restore(); });
    const [hx, hy] = pts[40];
    g.save(); g.translate(hx, hy); PaintDisc(g, r * 1.12, c); g.restore();
    for (const sg of [-1, 1]) {
      Circ(g, hx + 3, hy + sg * 4.6, 2.8); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1; g.strokeStyle = OUT; g.stroke();
      Circ(g, hx + 4, hy + sg * 4.6, 1.5); g.fillStyle = OUT; g.fill();
    }
    PaintApple(g, 132, 30, 10, '#f87171', false);
    img.src = s.c.toDataURL();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-snake')) return;
    InjectCSS();
    const KL = a => window.GfKeys ? GfKeys.label(a) : a === 'pause' ? 'P' : 'R';
    const root = document.createElement('div');
    root.id = 'gf-snake';
    root.innerHTML = `
<div id="gf-sn-modal">
  <div id="gf-sn-hdr">
    <div class="gf-sn-hl">
      <div id="gf-sn-logo"><i></i></div>
      <span id="gf-sn-title">GradeSnake</span>
      <span id="gf-sn-badge">BETA</span>
    </div>
    <div class="gf-sn-hr">
      <span id="gf-sn-hint">${window.GfKeys ? GfKeys.label('arcade') : 'F8'}</span>
      <button id="gf-sn-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-sn-close-btn" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-sn-body">
    <div id="gf-sn-board">
      <canvas id="gf-sn-canvas"></canvas>
    </div>
    <div id="gf-sn-hud">
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_score').toUpperCase()} <span id="gf-sn-lvl" class="gf-snp-lvl"></span></div>
        <div id="gf-sn-score" class="gf-snp-big">0</div>
        <div class="gf-snp-sub">${_GameText('game_snake_target')}: <span id="gf-sn-target">-</span></div>
        <div id="gf-sn-pu" class="gf-snp-pu" style="display:none"><span id="gf-sn-pu-name"></span><div class="gf-snp-putrack"><div id="gf-sn-pubar"></div></div></div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_snake_progress')} <span id="gf-sn-progpct" class="gf-snp-right">0%</span></div>
        <div class="gf-snp-bufwrap"><div id="gf-sn-progbar" class="gf-snp-buf"></div></div>
        <div class="gf-snp-label" style="margin-top:8px">${_GameText('game_snake_momentum')}</div>
        <div class="gf-snp-bufwrap gf-snp-mid"><div id="gf-sn-gbuf" class="gf-snp-buf"></div></div>
        <div class="gf-snp-buflbl"><span style="color:#ef4444">${_GameText('game_snake_shrink')}</span><span>·</span><span style="color:#22c55e">${_GameText('game_snake_grow')}</span></div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_snake_last_eaten')}</div>
        <div id="gf-sn-le-subj" class="gf-snp-le-subj">-</div>
        <div class="gf-snp-le-row">
          <span id="gf-sn-le-pct" class="gf-snp-le-pct"></span>
          <span id="gf-sn-le-eff" class="gf-snp-le-eff"></span>
        </div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-stat-row">
          <span class="gf-snp-k">${_GameText('game_snake_length')}</span><span id="gf-sn-len" class="gf-snp-val">3</span>
        </div>
        <div class="gf-snp-stat-row">
          <span class="gf-snp-k">${_GameText('game_snake_eaten')}</span><span id="gf-sn-eaten" class="gf-snp-val">0</span>
        </div>
      </div>
      <div class="gf-snp gf-snp-grades">
        <div class="gf-snp-label">${_GameText('game_snake_grade_effects')}</div>
        <div class="gf-sg-row"><i style="background:#4ade80"></i><span>≥75%</span><span>${_GameText('game_snake_big_pts')}</span></div>
        <div class="gf-sg-row"><i style="background:#a3e635"></i><span>50–74%</span><span>${_GameText('game_snake_pts')}</span></div>
        <div class="gf-sg-row"><i style="background:#f97316"></i><span>25–49%</span><span>${_GameText('game_snake_neg_half')}</span></div>
        <div class="gf-sg-row"><i style="background:#f87171"></i><span>&lt;25%</span><span>${_GameText('game_snake_neg_one')}</span></div>
      </div>
      <div class="gf-snp gf-snp-ctrl">
        <div class="gf-snp-label">${_GameText('game_controls')}</div>
        <div class="gf-sc-row"><kbd>↑↓←→</kbd><span>${_GameText('game_snake_move_desc')}</span></div>
        <div class="gf-sc-row"><kbd>${KL('pause')} / Esc</kbd><span>${_GameText('game_pause')}</span></div>
        <div class="gf-sc-row"><kbd>${KL('restart')}</kbd><span>${_GameText('game_try_again')}</span></div>
      </div>
    </div>

    <div id="gf-sns-start" class="gf-sns">
      <div class="gf-sns-card gf-sns-card-wide">
        <div class="gf-sns-start-hdr">
          <img id="gf-sns-art" alt="">
          <div class="gf-sns-start-txt">
            <div class="gf-sns-logo">GradeSnake</div>
            <div class="gf-sns-sub">${_GameText('game_snake_subtitle')}</div>
          </div>
          <button class="gf-ts-btn gf-ts-btn-sec gf-sns-gear" id="gf-sns-settings" title="${_GameText('game_snake_free_settings')}">⚙</button>
        </div>
        <div id="gf-sn-lvl-sel" class="gf-sn-lvls"></div>
        <div class="gf-sns-effects">
          <span style="color:#16a34a">≥75%&nbsp;+1</span>
          <span style="color:#65a30d">50%&nbsp;+½</span>
          <span style="color:#ea580c">25%&nbsp;−½</span>
          <span style="color:#dc2626">&lt;25%&nbsp;−1</span>
          <button id="gf-sns-pu" class="gf-sns-pu"></button>
        </div>
        <div class="gf-sns-footer">${_GameText('game_snake_footer')}</div>
      </div>
    </div>

    <div id="gf-sns-pause" class="gf-sns" style="display:none">
      <div class="gf-sns-card">
        <div class="gf-sns-pause-title">${_GameText('game_paused')}</div>
        <div id="gf-sns-pause-score" class="gf-sns-stat"></div>
        <button class="gf-ts-btn" id="gf-sns-resume">▶&nbsp; ${_GameText('game_resume')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-back-pause">← ${_GameText('game_levels')}</button>
      </div>
    </div>

    <div id="gf-sns-gameover" class="gf-sns" style="display:none">
      <div class="gf-sns-card">
        <div class="gf-sns-go-title">${_GameText('game_gameover')}</div>
        <div id="gf-sns-go-score" class="gf-sns-stat"></div>
        <div class="gf-sns-go-track"><div id="gf-sns-go-bar"></div></div>
        <div id="gf-sns-go-pct"   class="gf-sns-stat" style="color:#f97316;font-weight:700"></div>
        <button class="gf-ts-btn"               id="gf-sns-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-back-go">← ${_GameText('game_levels')}</button>
      </div>
    </div>

    <div id="gf-sns-win" class="gf-sns" style="display:none">
      <div class="gf-sns-card">
        <div id="gf-sns-win-title" class="gf-sns-win-title">${_GameText('game_snake_level_clear')}</div>
        <div id="gf-sns-win-score" class="gf-sns-win-score"></div>
        <button class="gf-ts-btn"               id="gf-sns-next">→&nbsp; ${_GameText('game_snake_next_level')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-mods-btn" style="display:none">⚙&nbsp; ${_GameText('game_snake_modifiers')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-back-win">← ${_GameText('game_levels')}</button>
      </div>
    </div>

    <div id="gf-sns-mods" class="gf-sns" style="display:none"></div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.getElementById('gf-sn-canvas');
    _ctx = _cv.getContext('2d');
    BindButtons();
    BuildArt();
  }

  function BindButtons() {
    document.getElementById('gf-sn-close-btn') ?.addEventListener('click', CloseGradeSnake);
    document.getElementById('gf-sn-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-sns-resume')   ?.addEventListener('click', DoPause);
    document.getElementById('gf-sns-retry')    ?.addEventListener('click', DoStart);
    document.getElementById('gf-sns-back-go')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-sns-back-win') ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-sns-back-pause')?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-sns-next')     ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-sns-mods-btn') ?.addEventListener('click', () => { BuildModsScreen(); ShowScreen('gf-sns-mods'); });
    document.getElementById('gf-sns-settings') ?.addEventListener('click', () => { BuildModsScreen(); ShowScreen('gf-sns-mods'); });
    document.getElementById('gf-sns-pu')       ?.addEventListener('click', () => {
      const m = LoadMods(); m.powerUps = m.powerUps ? 0 : 1; SaveMods(m);
      if (GS) GS.mods = m;
      UpdatePuChip();
    });
    document.getElementById('gf-snake')        ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-snake') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeySnake();
      else CloseGradeSnake();
    });
  }

  function OpenGradeSnake(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-snake')) BuildOverlay();
    document.getElementById('gf-snake').style.display = 'flex';
    ApplyTheme();
    Fit();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStartScreen();
  }

  function CloseGradeSnake() {
    const el = document.getElementById('gf-snake');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    DetachKeys(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function BossKeySnake() {
    const el = document.getElementById('gf-snake');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS?._bossHidden) {
        GS._bossHidden = false;
        GS.status = 'playing';
        ShowScreen(null);
      }
      StartLoop();
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

  function ToggleGradeSnake(grades) {
    const el = document.getElementById('gf-snake');
    if (el && el.style.display !== 'none') CloseGradeSnake(); else OpenGradeSnake(grades);
  }

  W.OpenGradeSnake       = OpenGradeSnake;
  W.CloseGradeSnake      = CloseGradeSnake;
  W.ToggleGradeSnake     = ToggleGradeSnake;
  W.BossKeySnake         = BossKeySnake;

  function InjectCSS() {
    if (document.getElementById('gf-snake-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-snake-css';
    s.textContent = `
#gf-snake {
  --gs-modal:#ffffff;--gs-hdr:#f6f5fb;--gs-hud:#f4f3fa;--gs-scr:rgba(246,245,252,0.6);
  --gs-brd:rgba(74,222,128,0.3);--gs-brd2:#e4e2ee;--gs-btn-brd:#d4d1e0;
  --gs-txt:#17142a;--gs-txt2:#4a4660;--gs-txt3:#8a86a0;--gs-kbd:#fff;--gs-kbd-brd:#d6d3e3;
  --gs-scroll:#d0d0d0;--gs-sh:0 8px 40px rgba(30,20,60,0.16),0 1px 4px rgba(30,20,60,0.06);
  --gs-frame:linear-gradient(180deg,#d9d5ea,#c7c2dd);--gs-well:#ebe9f5;
}
#gf-snake[data-theme="dark"] {
  --gs-modal:rgba(18,19,32,0.98);--gs-hdr:rgba(12,13,24,0.96);--gs-hud:rgba(14,15,27,0.98);
  --gs-scr:rgba(8,9,20,0.6);--gs-brd:rgba(74,222,128,0.22);--gs-brd2:#262840;
  --gs-btn-brd:#34374f;--gs-txt:#f3f2fa;--gs-txt2:#b4b2c8;--gs-txt3:#6f6d88;
  --gs-kbd:#20223a;--gs-kbd-brd:#34374f;--gs-scroll:#2a2a2a;
  --gs-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
  --gs-frame:linear-gradient(180deg,#2c2f4f,#1a1c33);--gs-well:#0f1124;
}
#gf-snake{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-snake *{box-sizing:border-box;}
#gf-sn-modal{position:relative;display:flex;flex-direction:column;background:var(--gs-modal);border:1px solid var(--gs-brd);border-radius:14px;box-shadow:var(--gs-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-sn-hdr{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:var(--gs-hdr);border-bottom:1px solid var(--gs-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-sn-hl{display:flex;align-items:center;gap:9px;} .gf-sn-hr{display:flex;align-items:center;gap:6px;}
#gf-sn-logo{position:relative;width:26px;height:26px;background:linear-gradient(145deg,#86efac,#22c55e);border-radius:7px;flex-shrink:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,0.18),0 2px 6px rgba(34,197,94,0.35);}
#gf-sn-logo::before{content:'';position:absolute;left:5px;top:9px;width:14px;height:8px;border:3px solid #fff;border-top:none;border-radius:0 0 8px 8px;}
#gf-sn-logo i{position:absolute;right:4px;top:5px;width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 1.5px #fff;}
#gf-sn-title{font-size:14px;font-weight:700;color:var(--gs-txt);letter-spacing:-0.3px;}
#gf-sn-badge{font-size:8px;font-weight:600;color:#22c55e;border:1px solid rgba(74,222,128,0.5);border-radius:4px;padding:2px 5px;letter-spacing:1px;}
#gf-sn-hint{font-size:9px;color:var(--gs-txt3);}
#gf-sn-pause-btn,#gf-sn-close-btn{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--gs-btn-brd);border-radius:7px;background:transparent;color:var(--gs-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-sn-pause-btn:hover{border-color:#22c55e;color:#22c55e;background:rgba(74,222,128,.10);}
#gf-sn-close-btn:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-sn-body{display:flex;position:relative;overflow:hidden;gap:12px;padding:12px;background:var(--gs-hud);}
#gf-sn-board{flex-shrink:0;line-height:0;padding:5px;border-radius:12px;background:var(--gs-frame);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 10px 24px rgba(30,20,70,0.22);}
#gf-sn-canvas{display:block;border-radius:8px;}
#gf-sn-hud{width:170px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:calc(var(--gs-board-h, ${CV}px) + 10px);}
#gf-sn-hud::-webkit-scrollbar{width:3px;} #gf-sn-hud::-webkit-scrollbar-thumb{background:var(--gs-scroll);border-radius:99px;}
.gf-snp{padding:8px 10px;flex-shrink:0;background:var(--gs-modal);border:1px solid var(--gs-brd2);border-radius:11px;box-shadow:0 3px 10px rgba(30,20,70,0.06);}
.gf-snp-label{font-size:8px;font-weight:700;letter-spacing:1.5px;color:var(--gs-txt3);text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.gf-snp-label::before{content:'';width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(74,222,128,0.7);flex-shrink:0;}
.gf-snp-right,.gf-snp-lvl{margin-left:auto;color:#22c55e;letter-spacing:.5px;}
.gf-snp-lvl{color:var(--gs-txt2);font-weight:700;}
.gf-snp-big{font-size:22px;font-weight:800;color:#22c55e;letter-spacing:-0.8px;line-height:1.1;font-variant-numeric:tabular-nums;}
#gf-snake[data-theme="dark"] .gf-snp-big{color:#4ade80;}
.gf-snp-sub{font-size:9px;color:var(--gs-txt3);margin-top:2px;}
.gf-snp-pu{display:flex;flex-direction:column;gap:3px;margin-top:6px;padding:5px 7px;border-radius:8px;background:rgba(128,128,128,0.1);font-size:9px;font-weight:800;animation:gf-sn-pop .3s ease-out;}
.gf-snp-putrack{height:4px;border-radius:99px;background:var(--gs-well);overflow:hidden;}
#gf-sn-pubar{height:100%;width:100%;border-radius:99px;transform-origin:left;}
@keyframes gf-sn-pop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.05)}100%{transform:none;opacity:1}}
.gf-snp-val{font-size:13px;font-weight:700;color:var(--gs-txt);font-variant-numeric:tabular-nums;}
.gf-snp-k{font-size:9px;color:var(--gs-txt3);}
.gf-snp-stat-row{display:flex;justify-content:space-between;align-items:center;padding:2px 0;}
.gf-snp-bufwrap{position:relative;height:7px;background:var(--gs-well);border-radius:99px;overflow:hidden;margin:4px 0;box-shadow:inset 0 1px 2px rgba(0,0,0,0.14);}
.gf-snp-mid::after{content:'';position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--gs-txt3);opacity:.5;}
.gf-snp-buf{height:100%;width:100%;background:#4ade80;border-radius:99px;transform-origin:left;transform:scaleX(0.5);transition:transform .18s ease-out;}
.gf-snp-buflbl{display:flex;justify-content:space-between;font-size:8px;color:var(--gs-txt3);}
.gf-snp-le-subj{font-size:9px;color:var(--gs-txt2);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.gf-snp-le-row{display:flex;align-items:baseline;gap:6px;}
.gf-snp-le-pct{font-size:15px;font-weight:800;}
.gf-snp-le-eff{font-size:10px;font-weight:800;padding:1px 6px;border-radius:99px;}
.gf-snp-le-eff[data-pos="1"]{color:#16a34a;background:rgba(74,222,128,0.16);}
.gf-snp-le-eff[data-pos="0"]{color:#dc2626;background:rgba(248,113,113,0.16);}
.gf-snp-le-eff:empty{display:none;}
.gf-sg-row{display:flex;align-items:center;gap:6px;font-size:9px;padding:2px 0;color:var(--gs-txt2);}
.gf-sg-row i{width:8px;height:8px;border-radius:50%;flex-shrink:0;box-shadow:inset 0 -1.5px 0 rgba(0,0,0,0.2);}
.gf-sg-row span:nth-of-type(1){font-weight:700;min-width:44px;}
.gf-sg-row span:last-child{color:var(--gs-txt3);margin-left:auto;text-align:right;}
.gf-sc-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.gf-sc-row kbd{display:inline-block;padding:2px 4px;font-family:inherit;font-size:8px;font-weight:700;background:var(--gs-kbd);border:1px solid var(--gs-kbd-brd);border-bottom-width:2px;border-radius:4px;color:var(--gs-txt2);min-width:38px;text-align:center;flex-shrink:0;}
.gf-sc-row span{font-size:8px;color:var(--gs-txt3);}
.gf-sns{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--gs-scr);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);padding:16px;overflow-y:auto;animation:gf-sns-fade .2s ease-out;}
@keyframes gf-sns-fade{from{opacity:0}to{opacity:1}}
@keyframes gf-sns-rise{from{transform:translateY(10px) scale(.97);opacity:0}to{transform:none;opacity:1}}
.gf-sns-card{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:250px;max-width:100%;max-height:100%;overflow-y:auto;padding:20px 24px;background:var(--gs-modal);border:1px solid var(--gs-brd);border-radius:16px;box-shadow:0 18px 50px rgba(20,10,50,0.28);animation:gf-sns-rise .28s cubic-bezier(.2,.9,.3,1.2);text-align:center;}
.gf-sns-card-wide{width:400px;padding:16px 18px;gap:9px;}
.gf-sns-logo{font-size:26px;font-weight:800;letter-spacing:-1.2px;line-height:1;background:linear-gradient(180deg,#86efac,#22c55e 55%,#15803d);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 8px rgba(34,197,94,0.3));}
.gf-sns-sub{font-size:11px;color:var(--gs-txt2);letter-spacing:0.3px;} .gf-sns-footer{font-size:8px;color:var(--gs-txt3);text-align:center;}
.gf-sns-stat{font-size:11px;color:var(--gs-txt2);}
.gf-sns-pause-title{font-size:22px;font-weight:800;letter-spacing:5px;color:var(--gs-txt);}
.gf-sns-go-title{font-size:26px;font-weight:800;color:#ef4444;letter-spacing:4px;text-shadow:0 3px 18px rgba(239,68,68,0.35);}
.gf-sns-go-track{width:100%;height:8px;border-radius:99px;background:var(--gs-well);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.14);}
#gf-sns-go-bar{height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#fdba74,#f97316);transition:width .6s cubic-bezier(.2,.9,.3,1);}
.gf-sns-win-title{font-size:22px;font-weight:800;color:#22c55e;letter-spacing:1px;text-shadow:0 3px 18px rgba(74,222,128,0.4);}
.gf-sns-win-score{font-size:20px;font-weight:800;color:var(--gs-txt);}
.gf-ts-btn{padding:10px 24px;min-width:170px;border:none;border-radius:10px;background:linear-gradient(180deg,#4ade80,#22c55e);color:#052e16;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;box-shadow:0 3px 0 #15803d,0 6px 18px rgba(34,197,94,0.32);transition:transform .12s,box-shadow .12s,filter .12s;}
.gf-ts-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 4px 0 #15803d,0 10px 24px rgba(34,197,94,0.4);}
.gf-ts-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #15803d;}
.gf-ts-btn-sec{border:1px solid var(--gs-btn-brd);color:var(--gs-txt2);background:transparent;box-shadow:none;padding:8px 18px;}
.gf-ts-btn-sec:hover,.gf-ts-btn-sec:active{background:rgba(128,128,128,0.10);box-shadow:none;}
.gf-sns-start-hdr{display:flex;align-items:center;width:100%;gap:10px;}
#gf-sns-art{width:110px;height:40px;flex-shrink:0;}
.gf-sns-start-txt{display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex:1;min-width:0;text-align:left;}
.gf-sns-gear{min-width:0;padding:6px 10px;font-size:14px;}
.gf-sns-effects{display:flex;gap:10px;font-size:9px;font-weight:700;color:var(--gs-txt3);flex-wrap:wrap;justify-content:center;align-items:center;}
.gf-sns-pu{font-family:inherit;font-size:9px;font-weight:800;padding:3px 9px;border-radius:99px;border:1px solid var(--gs-btn-brd);background:transparent;color:var(--gs-txt3);cursor:pointer;}
.gf-sns-pu.on{border-color:#eab308;color:#a16207;background:rgba(250,204,21,0.16);}
#gf-snake[data-theme="dark"] .gf-sns-pu.on{color:#facc15;}
.gf-sn-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-snl{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 12px;border:1px solid var(--gs-brd2);border-radius:10px;background:var(--gs-hud);color:var(--gs-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-snl:hover:not(:disabled){border-color:#22c55e;background:rgba(74,222,128,0.08);transform:translateX(2px);}
.gf-snl-locked{opacity:0.45;} .gf-snl:disabled{cursor:default;}
.gf-snl-left{display:flex;align-items:center;gap:10px;}
.gf-snl-badge{width:30px;height:30px;border-radius:8px;background:linear-gradient(145deg,#86efac,#22c55e);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#052e16;flex-shrink:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,0.18);}
.gf-snl-locked .gf-snl-badge{background:var(--gs-well);color:var(--gs-txt3);box-shadow:inset 0 1px 2px rgba(0,0,0,0.15);}
.gf-snl-done .gf-snl-badge::after{content:'✓';position:absolute;transform:translate(13px,-12px);font-size:9px;width:13px;height:13px;line-height:13px;border-radius:50%;background:#facc15;color:#713f12;text-align:center;}
.gf-snl-badge-fp{background:linear-gradient(145deg,#c4b5fd,#8b5cf6);color:#fff;}
.gf-snl-info{display:flex;flex-direction:column;gap:1px;}
.gf-snl-name{font-size:12px;font-weight:700;color:var(--gs-txt);}
.gf-snl-tgt{font-size:9px;color:var(--gs-txt3);font-weight:400;}
.gf-snl-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;}
.gf-snl-prog-track{width:72px;height:4px;background:var(--gs-well);border-radius:99px;overflow:hidden;}
.gf-snl-prog-fill{height:100%;background:linear-gradient(90deg,#86efac,#22c55e);border-radius:99px;}
.gf-snl-best{font-size:8px;color:var(--gs-txt3);white-space:nowrap;}
.gf-snl-lock{position:relative;width:14px;height:11px;margin-top:5px;border-radius:3px;background:var(--gs-txt3);}
.gf-snl-lock::before{content:'';position:absolute;left:2px;top:-7px;width:6px;height:6px;border:2px solid var(--gs-txt3);border-bottom:none;border-radius:5px 5px 0 0;}
.gf-mod-grid{display:flex;flex-direction:column;gap:9px;width:100%;}
.gf-mod-row{display:flex;flex-direction:column;gap:4px;align-items:flex-start;}
.gf-mod-label{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gs-txt3);}
.gf-mod-opts{display:flex;gap:5px;flex-wrap:wrap;}
.gf-mod-btn{padding:5px 10px;border:1px solid var(--gs-brd2);border-radius:7px;background:var(--gs-hud);color:var(--gs-txt2);font-family:inherit;font-size:10px;cursor:pointer;transition:border-color .12s,background .12s;}
.gf-mod-btn:hover{border-color:#a78bfa;}
.gf-mod-active{border-color:#a78bfa!important;color:#7c3aed;background:rgba(167,139,250,0.14)!important;font-weight:700;}
#gf-snake[data-theme="dark"] .gf-mod-active{color:#c4b5fd;}
.gf-mod-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px;}
`;
    document.head.appendChild(s);
  }

})(window);
