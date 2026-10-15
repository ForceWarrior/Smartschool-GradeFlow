;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const COLS = 10, ROWS = 20, CELL = 26;
  const BW = COLS * CELL, BH = ROWS * CELL;
  const SW = 100, QH = 190, HH = 64;
  const CLEAR_MS = 340, FALL_MS = 150, OVER_MS = 950, TRAIL_MS = 260, LOCK_MS = 200;
  const OUT = '#2b2236';
  const GRAY = '#8e92a8';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const TAU = Math.PI * 2;
  const F_POP = `900 24px ${FONT}`, F_SUB = `900 15px ${FONT}`;

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
  };
  const SKEYS = Object.keys(SHAPES);
  const LINE_PTS = [0, 100, 300, 500, 800];
  const SPEED = lvl => Math.max(50, 800 - (lvl - 1) * 70);

  const GO_MSGS = [
    '"Rapport locked in"', '"Study diff"', '"You got stacked"',
    '"Cijfers ingediend"', '"Stack overflow"', '"Definitief geblokkeerd"',
  ];

  const GF_HI_KEY = 'gradeflow-tetris-hi';
  function LoadHiScore() {
    try { return parseInt(localStorage.getItem(GF_HI_KEY)) || 0; } catch (_) { return 0; }
  }
  function SaveHiScore(n) {
    try { localStorage.setItem(GF_HI_KEY, String(n)); } catch (_) {}
  }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return GetFallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage != null ? g.percentage
        : (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return {
        id: g.id || `g${i}`, subject: g.subject || `Vak ${i + 1}`,
        score: g.score ?? null, maxScore: g.maxScore ?? null,
        percentage: Pct != null ? +(Pct.toFixed(1)) : null,
        label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?'),
      };
    });
  }

  function GetGradeColor(Pct) {
    if (Pct == null || isNaN(Pct)) return '#a78bfa';
    if (Pct >= 90) return '#4ade80';
    if (Pct >= 75) return '#a3e635';
    if (Pct >= 60) return '#fbbf24';
    if (Pct >= 50) return '#f97316';
    return '#f87171';
  }

  function GradeMultiplier(Pct) {
    if (Pct == null) return 1.00;
    if (Pct >= 90)   return 1.25;
    if (Pct >= 75)   return 1.10;
    if (Pct >= 60)   return 1.00;
    if (Pct >= 50)   return 0.90;
    return 0.75;
  }

  function GetFallbackGrades() {
    const names = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis',
      'Aardrijkskunde','Engels','Informatica','Muziek','Sport',
      'Latijn','Tekenen','Godsdienst','Economie','Chemie'];
    return Array.from({length: 30}, (_, i) => {
      const Pct = 35 + (0 | (Math.random() * 61));
      const max = 20, sc = +((Pct / 100 * max).toFixed(1));
      return { id:`f${i}`, subject: names[i % names.length], score:sc, maxScore:max, percentage:Pct, label:`${sc}/${max}` };
    });
  }

  function RotateMatrix(m, dir) {
    const R = m.length, C = m[0].length;
    return dir === 1
      ? Array.from({length:C}, (_, c) => Array.from({length:R}, (_, r) => m[R-1-r][c]))
      : Array.from({length:C}, (_, c) => Array.from({length:R}, (_, r) => m[r][C-1-c]));
  }

  function NewPieceBag() {
    const b = [...SKEYS];
    for (let i = b.length - 1; i > 0; i--) {
      const j = 0 | (Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
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
  function EaseOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }

  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g };
  }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }

  function PaintBlock(g, s, c) {
    const r = Math.max(2, s * 0.2), b = Math.max(2, s * 0.17), lw = Math.max(1, s * 0.06), f = s - 2 * b;
    g.save();
    RR(g, lw / 2, lw / 2, s - lw, s - lw, r); g.clip();
    g.fillStyle = Dk(c, 0.24); g.fillRect(0, 0, s, s);
    g.fillStyle = Lt(c, 0.45); Poly(g, [0, 0, s, 0, s - b, b, b, b]); g.fill();
    g.fillStyle = Lt(c, 0.2); Poly(g, [0, 0, b, b, b, s - b, 0, s]); g.fill();
    g.fillStyle = Dk(c, 0.1); Poly(g, [s, 0, s, s, s - b, s - b, s - b, b]); g.fill();
    const gr = g.createLinearGradient(0, b, 0, s - b);
    gr.addColorStop(0, Lt(c, 0.14)); gr.addColorStop(1, Dk(c, 0.05));
    g.fillStyle = gr; RR(g, b, b, f, f, r * 0.45); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; Ell(g, b + f * 0.3, b + f * 0.22, f * 0.2, f * 0.09); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; Ell(g, s - b - f * 0.18, s - b - f * 0.2, f * 0.05, f * 0.05); g.fill();
    g.restore();
    RR(g, lw / 2, lw / 2, s - lw, s - lw, r); g.lineWidth = lw; g.strokeStyle = Mix(c, OUT, 0.62); g.stroke();
  }

  let GT = null;
  let _root = null, _cv = null, _ctx = null, _k = 1, _dark = false, _raf = null, _last = 0, _fitT = 0;
  let _bg = null, _dangerG = null, _blk = {}, _gst = {}, _lab = {}, _mini = new Map();
  const _parts = Array.from({ length: 260 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, t: 0, T: 1, s: 1, r: 0, vr: 0, c: '' }));
  let _np = 0;
  const _pops = Array.from({ length: 5 }, () => ({ txt: '', sub: '', c: '', t: 1, T: 1, y: 0 }));
  const _hud = {};

  function Block(c) { return _blk[c] || (_blk[c] = MakeBlock(c, CELL, _k)); }
  function MakeBlock(c, s, k) { const b = Cv(s, s, k); PaintBlock(b.g, s, c); return b; }
  function MiniBlock(c, s, k) {
    const key = `${c}${s}${k}`;
    let b = _mini.get(key);
    if (!b) { b = MakeBlock(c, s, k); _mini.set(key, b); }
    return b;
  }
  function GhostSpr(c) {
    if (_gst[c]) return _gst[c];
    const b = Cv(CELL, CELL, _k), g = b.g;
    RR(g, 2.5, 2.5, CELL - 5, CELL - 5, CELL * 0.18);
    g.fillStyle = Rgba(c, _dark ? 0.15 : 0.18); g.fill();
    g.setLineDash([3.5, 2.5]); g.lineWidth = 1.6; g.strokeStyle = _dark ? Rgba(c, 0.8) : Mix(c, OUT, 0.3); g.stroke();
    return (_gst[c] = b);
  }
  function LabelSpr(key, txt, c) {
    if (_lab[key]) return _lab[key];
    const b = Cv(CELL, CELL, _k), g = b.g;
    let fs = CELL * 0.32;
    g.font = `800 ${fs}px ${FONT}`;
    while (fs > CELL * 0.2 && g.measureText(txt).width > CELL - 7) { fs -= 0.5; g.font = `800 ${fs}px ${FONT}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = Rgba(Lt(c, 0.6), 0.7); g.fillText(txt, CELL / 2, CELL / 2 + 1.6);
    g.fillStyle = Rgba(Dk(c, 0.7), 0.88); g.fillText(txt, CELL / 2, CELL / 2 + 0.6);
    return (_lab[key] = b);
  }

  function BuildBg() {
    const s = Cv(BW, BH, _k), g = s.g;
    const P = _dark
      ? { a: '#1d2142', b: '#0d1022', cell: 'rgba(255,255,255,0.04)', top: 'rgba(0,0,0,0.28)', bot: 'rgba(255,255,255,0.05)', stripe: 'rgba(255,255,255,0.018)', vig: 'rgba(4,4,16,0.5)' }
      : { a: '#f7f5ff', b: '#e3e8f8', cell: 'rgba(92,84,160,0.065)', top: 'rgba(60,50,120,0.07)', bot: 'rgba(255,255,255,0.95)', stripe: 'rgba(92,84,160,0.03)', vig: 'rgba(70,60,130,0.12)' };
    const gr = g.createLinearGradient(0, 0, 0, BH);
    gr.addColorStop(0, P.a); gr.addColorStop(1, P.b);
    g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
    g.fillStyle = P.stripe;
    for (let c = 1; c < COLS; c += 2) g.fillRect(c * CELL, 0, CELL, BH);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL;
      RR(g, x + 2, y + 2, CELL - 4, CELL - 4, 5); g.fillStyle = P.cell; g.fill();
      g.fillStyle = P.top; g.fillRect(x + 5, y + 2, CELL - 10, 1.2);
      g.fillStyle = P.bot; g.fillRect(x + 5, y + CELL - 2.6, CELL - 10, 1);
    }
    if (_dark) {
      let seed = 7;
      const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(200,210,255,${0.05 + R() * 0.12})`; g.beginPath(); g.arc(R() * BW, R() * BH, 0.5 + R() * 0.9, 0, TAU); g.fill(); }
    }
    const v = g.createRadialGradient(BW / 2, BH * 0.45, BH * 0.25, BW / 2, BH * 0.45, BH * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, P.vig);
    g.fillStyle = v; g.fillRect(0, 0, BW, BH);
    return s;
  }

  function Rebuild() {
    _blk = {}; _gst = {}; _lab = {}; _mini.clear();
    _bg = BuildBg();
    _dangerG = _ctx.createLinearGradient(0, 0, 0, CELL * 5);
    _dangerG.addColorStop(0, 'rgba(239,68,68,0.38)'); _dangerG.addColorStop(1, 'rgba(239,68,68,0)');
    BuildArt();
  }

  function NewGradeTile(grades) {
    const g = NormalizeGrades(grades);
    const shuffled = [...g].sort(() => Math.random() - 0.5);
    let gIdx = 0;
    return {
      board:     Array.from({length: ROWS}, () => Array(COLS).fill(null)),
      cur: null, nxt: null, hold: null, canHold: true, queue: [],
      bag: NewPieceBag(), bagIdx: 0,
      nextGrade: () => shuffled[gIdx++ % shuffled.length],
      grades: g,
      score: 0, lines: 0, level: 1,
      hiScore: LoadHiScore(), startHi: 0,
      status: 'start',
      drop: 0, gr: 0, vx: 0, vy: 0, shake: 0, danger: false,
      clearing: null, fall: null, over: null, trail: null, lockFx: null,
    };
  }

  function PullFromBag(gs) {
    if (gs.bagIdx >= gs.bag.length) { gs.bag = NewPieceBag(); gs.bagIdx = 0; }
    return gs.bag[gs.bagIdx++];
  }

  function CreatePiece(shape, grade) {
    const cells = SHAPES[shape].map(r => [...r]);
    return { shape, cells, row:-1, col: Math.floor((COLS - cells[0].length) / 2), color: GetGradeColor(grade?.percentage), grade };
  }

  function Coords(p) {
    const out = [];
    for (let r = 0; r < p.cells.length; r++)
      for (let c = 0; c < p.cells[r].length; c++)
        if (p.cells[r][c]) out.push({ r: p.row+r, c: p.col+c });
    return out;
  }

  function IsValidPos(board, cs) {
    for (const {r, c} of cs) {
      if (c < 0 || c >= COLS || r >= ROWS) return false;
      if (r >= 0 && board[r][c] !== null) return false;
    }
    return true;
  }

  function Spawn(gs) {
    while (gs.queue.length < 3) gs.queue.push(CreatePiece(PullFromBag(gs), gs.nextGrade()));
    gs.cur = gs.queue.shift();
    gs.queue.push(CreatePiece(PullFromBag(gs), gs.nextGrade()));
    gs.nxt = gs.queue[0];
    gs.canHold = true; gs.vx = gs.vy = 0; gs.drop = 0;
    DrawSide();
    if (!IsValidPos(gs.board, Coords(gs.cur))) { gs.status = 'gameover'; return false; }
    gs.gr = GhostRow(gs);
    return true;
  }

  function HoldCur(gs) {
    if (!gs.canHold || !gs.cur) return;
    const h = gs.hold;
    gs.hold = CreatePiece(gs.cur.shape, gs.cur.grade);
    if (h) {
      gs.cur = h; gs.vx = gs.vy = 0; gs.drop = 0;
      if (!IsValidPos(gs.board, Coords(gs.cur))) gs.status = 'gameover';
      else gs.gr = GhostRow(gs);
    } else Spawn(gs);
    gs.canHold = false;
    DrawSide();
  }

  function MovePiece(gs, dRow, dCol) {
    const p = { ...gs.cur, row: gs.cur.row+dRow, col: gs.cur.col+dCol };
    if (!IsValidPos(gs.board, Coords(p))) return false;
    gs.cur = p;
    gs.vx = Math.max(-1.4, Math.min(1.4, gs.vx - dCol));
    gs.vy = Math.max(-1, gs.vy - dRow);
    if (dCol) gs.gr = GhostRow(gs);
    return true;
  }

  function RotateCur(gs, dir) {
    const nc = RotateMatrix(gs.cur.cells, dir);
    for (const [dc, dr] of [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1],[0,1]]) {
      const p = { ...gs.cur, cells:nc, col: gs.cur.col+dc, row: gs.cur.row+dr };
      if (IsValidPos(gs.board, Coords(p))) { gs.cur = p; gs.vy = 0; gs.gr = GhostRow(gs); return true; }
    }
    return false;
  }

  function GhostRow(gs) {
    let r = gs.cur.row;
    while (IsValidPos(gs.board, Coords({ ...gs.cur, row: r+1 }))) r++;
    return r;
  }

  function LockCur(gs) {
    const cs = Coords(gs.cur);
    const Pct = gs.cur.grade?.percentage, color = gs.cur.color;
    const label = Pct != null ? `${Math.round(Pct)}%` : gs.cur.grade?.label || '';
    for (const {r, c} of cs)
      if (r >= 0) gs.board[r][c] = { color, label, Pct, lk: `${label}|${color}` };
    gs.lockFx = { cs, t: 0 };

    const full = [];
    for (let r = 0; r < ROWS; r++)
      if (gs.board[r].every(x => x !== null)) full.push(r);

    if (full.length) {
      const mult = GradeMultiplier(gs.cur.grade?.percentage);
      const pts = Math.floor(LINE_PTS[full.length] * gs.level * mult);
      const lvl = gs.level;
      gs.score  += pts;
      gs.lines  += full.length;
      gs.level   = Math.floor(gs.lines / 10) + 1;

      if (gs.score > gs.hiScore) { gs.hiScore = gs.score; SaveHiScore(gs.score); }
      gs.clearing = { rows: full, t: 0 };
      gs.cur = null;
      for (const r of full) for (let c = 0; c < COLS; c++) {
        const col = gs.board[r][c].color;
        for (let i = 0; i < 2; i++) Part(c * CELL + CELL / 2, r * CELL + CELL / 2, (Math.random() - 0.5) * 340 + (c - 4.5) * 22, -120 - Math.random() * 260, 0.7 + Math.random() * 0.4, 0.28 + Math.random() * 0.32, col);
      }
      const n = full.length;
      Popup(n > 1 ? _GameText(`game_stack_clear_${n}`) : `+${pts}`, n > 1 ? `+${pts}` : '', n === 4 ? '#f97316' : n === 3 ? '#a78bfa' : n === 2 ? '#22d3ee' : '#4ade80');
      if (gs.level > lvl) Popup(`${_GameText('game_stack_level')} ${gs.level}`, '', '#fbbf24');
      gs.shake = n === 4 ? 7 : n * 1.2;
      return;
    }

    Spawn(gs);
    CheckDanger(gs);
  }

  function FinishClear(gs) {
    const rows = gs.clearing.rows;
    const map = new Int8Array(ROWS);
    const kept = [];
    for (let r = 0; r < ROWS; r++) if (!rows.includes(r)) kept.push(r);
    for (const r of [...rows].reverse()) gs.board.splice(r, 1);
    for (let i = 0; i < rows.length; i++) gs.board.unshift(Array(COLS).fill(null));
    kept.forEach((r, i) => { map[rows.length + i] = rows.length + i - r; });
    gs.fall = { map, t: 0 };
    gs.clearing = null;
    Spawn(gs);
    CheckDanger(gs);
  }

  function CheckDanger(gs) {
    gs.danger = false;
    for (let r = 0; r < 4; r++) if (gs.board[r].some(Boolean)) { gs.danger = true; break; }
  }

  function HardDrop(gs) {
    const gr = GhostRow(gs);
    const d = gr - gs.cur.row;
    gs.score += d * 2;
    if (d > 0) {
      const top = {};
      for (const { r, c } of Coords(gs.cur)) if (top[c] == null || r < top[c]) top[c] = r;
      gs.trail = { cols: Object.keys(top).map(c => ({ c: +c, r0: top[c], r1: top[c] + d })), color: gs.cur.color, t: 0 };
    }
    gs.cur = { ...gs.cur, row: gr };
    gs.vx = gs.vy = 0;
    for (const { r, c } of Coords(gs.cur)) {
      if (r + 1 < ROWS && gs.board[r + 1][c] === null) continue;
      for (let i = 0; i < 2; i++) Part(c * CELL + Math.random() * CELL, (r + 1) * CELL, (Math.random() - 0.5) * 160, -60 - Math.random() * 120, 0.35 + Math.random() * 0.2, 0.22 + Math.random() * 0.2, gs.cur.color);
    }
    if (d > 3) gs.shake = Math.max(gs.shake, 2.6);
    LockCur(gs);
  }

  function Part(x, y, vx, vy, T, s, c) {
    if (_np >= _parts.length) return;
    const p = _parts[_np++];
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.T = T; p.s = s; p.c = c;
    p.r = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 14;
  }

  function Popup(txt, sub, c) {
    let p = _pops[0];
    for (const q of _pops) if (q.t >= q.T) { p = q; break; }
    let busy = 0;
    for (const q of _pops) if (q !== p && q.t < q.T) busy++;
    p.txt = txt; p.sub = sub; p.c = c; p.t = 0; p.T = 1.15; p.y = BH * 0.4 + busy * 44;
  }

  function Update(dt) {
    const g = GT, s = dt / 1000;
    for (let i = _np - 1; i >= 0; i--) {
      const p = _parts[i];
      p.t += s;
      if (p.t >= p.T) { _parts[i] = _parts[--_np]; _parts[_np] = p; continue; }
      p.vy += 980 * s; p.x += p.vx * s; p.y += p.vy * s; p.r += p.vr * s;
    }
    for (const p of _pops) if (p.t < p.T) p.t += s;
    g.shake *= Math.exp(-dt / 70);
    if (g.trail && (g.trail.t += dt) >= TRAIL_MS) g.trail = null;
    if (g.lockFx && (g.lockFx.t += dt) >= LOCK_MS) g.lockFx = null;
    if (g.fall && (g.fall.t += dt) >= FALL_MS) g.fall = null;
    const d = Math.exp(-dt / 30);
    g.vx *= d; g.vy *= d;

    if (g.over) {
      const was = g.over.t;
      g.over.t += dt;
      if (was < OVER_MS && g.over.t >= OVER_MS) ShowGameOver();
      return;
    }
    if (g.status !== 'playing') return;
    if (g.clearing) {
      g.clearing.t += dt;
      if (g.clearing.t >= CLEAR_MS) { FinishClear(g); if (g.status === 'gameover') EnterOver(); }
      return;
    }
    if (!g.cur) return;
    g.drop += dt;
    if (g.drop >= SPEED(g.level)) {
      g.drop = 0;
      if (!MovePiece(g, 1, 0)) {
        LockCur(g);
        if (g.status === 'gameover') EnterOver();
      }
    }
  }

  function EnterOver() {
    if (GT.score > GT.hiScore) { GT.hiScore = GT.score; SaveHiScore(GT.score); }
    GT.over = { t: 0 };
    GT.shake = 5;
  }

  function Frame(ts) {
    _raf = requestAnimationFrame(Frame);
    const dt = Math.min(50, ts - (_last || ts));
    _last = ts;
    if (!GT || !_root) return;
    if (_root.style.display === 'none') { if (GT.status === 'playing' && !GT.over) DoPause(); return; }
    if (GT.status !== 'paused') Update(dt);
    DrawBoard();
    UpdateHUD();
  }

  function DrawBoard() {
    if (!_ctx || !GT || !_bg) return;
    const x = _ctx, g = GT, now = performance.now();
    x.setTransform(_k, 0, 0, _k, 0, 0);
    x.fillStyle = _dark ? '#0d1022' : '#e3e8f8';
    x.fillRect(0, 0, BW, BH);
    if (g.shake > 0.15) x.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    x.drawImage(_bg.c, 0, 0, BW, BH);

    if (g.danger && g.status === 'playing') {
      x.globalAlpha = 0.6 + 0.4 * Math.sin(now / 170);
      x.fillStyle = _dangerG; x.fillRect(0, 0, BW, CELL * 5);
      x.globalAlpha = 1;
    }

    const cl = g.clearing, ct = cl ? cl.t / CLEAR_MS : 0;
    const fl = g.fall, fe = fl ? 1 - EaseOut(Math.min(1, fl.t / FALL_MS)) : 0;
    const og = g.over ? Math.min(ROWS, g.over.t / OVER_MS * ROWS * 1.2) : -1;

    for (let r = 0; r < ROWS; r++) {
      const row = g.board[r];
      const clr = cl !== null && cl.rows.includes(r);
      const yo = fl ? fl.map[r] * CELL * fe : 0;
      const gray = og >= 0 && ROWS - 1 - r < og;
      for (let c = 0; c < COLS; c++) {
        const cell = row[c];
        if (!cell) continue;
        const px = c * CELL, py = r * CELL - yo;
        if (clr) {
          const lt = Math.max(0, Math.min(1, (ct - 0.3 - Math.abs(c - 4.5) * 0.05) / 0.42));
          if (lt >= 1) continue;
          const hs = CELL * (1 - lt * lt), o = (CELL - hs) / 2;
          x.drawImage(Block(cell.color).c, px + o, py + o, hs, hs);
          x.globalAlpha = Math.min(1, ct * 4) * (1 - lt) * 0.85;
          x.fillStyle = '#ffffff';
          RR(x, px + o + 1, py + o + 1, hs - 2, hs - 2, 5); x.fill();
          x.globalAlpha = 1;
        } else {
          x.drawImage(Block(gray ? GRAY : cell.color).c, px, py, CELL, CELL);
          if (cell.label && !gray) x.drawImage(LabelSpr(cell.lk, cell.label, cell.color).c, px, py, CELL, CELL);
        }
      }
      if (clr && ct < 0.55) {
        x.globalAlpha = (1 - ct / 0.55) * 0.6;
        x.fillStyle = '#ffffff';
        x.fillRect(0, r * CELL + CELL * 0.25 * ct, BW, CELL * (1 - ct * 0.5));
        x.globalAlpha = 1;
      }
    }

    if (g.trail) {
      const tr = g.trail, a = 1 - tr.t / TRAIL_MS;
      x.fillStyle = tr.color;
      for (const col of tr.cols) {
        const n = col.r1 - col.r0;
        for (let i = 0; i < n; i++) {
          x.globalAlpha = a * 0.42 * ((i + 1) / n);
          x.fillRect(col.c * CELL + 4, (col.r0 + i) * CELL, CELL - 8, CELL);
        }
        x.globalAlpha = a * 0.7;
        x.fillStyle = '#ffffff';
        x.fillRect(col.c * CELL + CELL / 2 - 1, col.r0 * CELL, 2, n * CELL);
        x.fillStyle = tr.color;
      }
      x.globalAlpha = 1;
    }

    const p = g.cur;
    if (p && g.status !== 'start' && !g.over) {
      if (g.gr > p.row) {
        const gs = GhostSpr(p.color);
        for (let r = 0; r < p.cells.length; r++) for (let c = 0; c < p.cells[r].length; c++)
          if (p.cells[r][c]) x.drawImage(gs.c, (p.col + c) * CELL, (g.gr + r) * CELL, CELL, CELL);
      }
      const b = Block(p.color).c, ox = (p.col + g.vx) * CELL, oy = (p.row + g.vy) * CELL;
      x.fillStyle = _dark ? 'rgba(0,0,0,0.35)' : 'rgba(40,30,90,0.14)';
      for (let r = 0; r < p.cells.length; r++) for (let c = 0; c < p.cells[r].length; c++)
        if (p.cells[r][c]) { RR(x, ox + c * CELL + 2, oy + r * CELL + 4, CELL - 2, CELL - 2, 5); x.fill(); }
      for (let r = 0; r < p.cells.length; r++) for (let c = 0; c < p.cells[r].length; c++)
        if (p.cells[r][c]) x.drawImage(b, ox + c * CELL, oy + r * CELL, CELL, CELL);
    }

    if (g.lockFx) {
      x.globalAlpha = (1 - g.lockFx.t / LOCK_MS) * 0.55;
      x.fillStyle = '#ffffff';
      for (const { r, c } of g.lockFx.cs) { if (r < 0) continue; RR(x, c * CELL + 1.5, r * CELL + 1.5, CELL - 3, CELL - 3, 5); x.fill(); }
      x.globalAlpha = 1;
    }

    for (let i = 0; i < _np; i++) {
      const q = _parts[i], u = q.t / q.T, sz = CELL * q.s * (1 - u * 0.5);
      x.globalAlpha = 1 - u * u;
      x.save(); x.translate(q.x, q.y); x.rotate(q.r);
      x.drawImage(Block(q.c).c, -sz / 2, -sz / 2, sz, sz);
      x.restore();
    }
    x.globalAlpha = 1;

    for (const q of _pops) {
      if (q.t >= q.T) continue;
      const u = q.t / q.T, sc = u < 0.15 ? 0.6 + u / 0.15 * 0.5 : u < 0.25 ? 1.1 - (u - 0.15) * 1 : 1;
      x.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
      x.save(); x.translate(BW / 2, q.y - u * 26); x.scale(sc, sc);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.font = F_POP;
      x.lineWidth = 5; x.strokeStyle = OUT; x.strokeText(q.txt, 0, 0);
      x.fillStyle = q.c; x.fillText(q.txt, 0, 0);
      if (q.sub) {
        x.font = F_SUB;
        x.lineWidth = 4; x.strokeText(q.sub, 0, 22);
        x.fillStyle = '#ffffff'; x.fillText(q.sub, 0, 22);
      }
      x.restore();
    }
    x.globalAlpha = 1;
    x.setTransform(1, 0, 0, 1, 0, 0);
  }

  function DrawMini(x, p, cx, cy, s, k, a) {
    let r0 = 9, r1 = -1, c0 = 9, c1 = -1;
    for (let r = 0; r < p.cells.length; r++) for (let c = 0; c < p.cells[r].length; c++)
      if (p.cells[r][c]) { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); }
    const ox = cx - (c1 - c0 + 1) * s / 2 - c0 * s, oy = cy - (r1 - r0 + 1) * s / 2 - r0 * s;
    const b = MiniBlock(a < 1 ? GRAY : p.color, s, k).c;
    x.globalAlpha = a;
    for (let r = 0; r < p.cells.length; r++) for (let c = 0; c < p.cells[r].length; c++)
      if (p.cells[r][c]) x.drawImage(b, ox + c * s, oy + r * s, s, s);
    x.globalAlpha = 1;
  }

  function SideCtx(id, w, h) {
    const cv = document.getElementById(id);
    if (!cv) return null;
    const k = Math.min(3, W.devicePixelRatio || 1);
    const bw = Math.round(w * k), bh = Math.round(h * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const x = cv.getContext('2d');
    x.setTransform(k, 0, 0, k, 0, 0);
    x.clearRect(0, 0, w, h);
    return { x, k };
  }

  function DrawSide() {
    if (!GT || !_root) return;
    const q = SideCtx('gf-tc-next', SW, QH);
    if (q) GT.queue.forEach((p, i) => DrawMini(q.x, p, SW / 2, i === 0 ? 36 : 96 + (i - 1) * 54, i === 0 ? 19 : 14, q.k, 1));
    const h = SideCtx('gf-tc-hold', SW, HH);
    if (h && GT.hold) DrawMini(h.x, GT.hold, SW / 2, HH / 2, 17, h.k, GT.canHold ? 1 : 0.45);
    SetText('gf-th-nsubj', GT.nxt?.grade?.subject || '');
    SetText('gf-th-hsubj', GT.hold?.grade?.subject || '');
  }

  function BuildArt() {
    const imgs = _root?.querySelectorAll('.gf-ts-art img');
    if (!imgs) return;
    const k = Math.min(3, W.devicePixelRatio || 1);
    [['T', '#4ade80'], ['L', '#fbbf24'], ['S', '#a78bfa'], ['I', '#f97316']].forEach(([sh, c], i) => {
      if (!imgs[i]) return;
      const p = CreatePiece(sh, null), s = 15, b = Cv(70, 48, k);
      p.color = c;
      DrawMini(b.g, p, 35, 24, s, k, 1);
      imgs[i].src = b.c.toDataURL();
    });
  }

  function UpdateHUD() {
    if (!GT) return;
    if (_hud.score !== GT.score || _hud.hi !== GT.hiScore || _hud.lines !== GT.lines) {
      if (GT.score > GT.hiScore) { GT.hiScore = GT.score; SaveHiScore(GT.score); }
      _hud.score = GT.score; _hud.hi = GT.hiScore; _hud.lines = GT.lines;
      SetText('gf-th-score', GT.score.toLocaleString());
      SetText('gf-th-lines', String(GT.lines));
      SetText('gf-th-level', String(GT.level));
      SetText('gf-th-best',  GT.hiScore.toLocaleString());
    }
    const bar = document.getElementById('gf-th-lvlbar');
    const w = `${(GT.lines % 10) * 10}%`;
    if (bar && _hud.bar !== w) { _hud.bar = w; bar.style.width = w; }

    const g = GT.cur?.grade;
    if (g && _hud.g !== g) {
      _hud.g = g;
      SetText('gf-th-csubj',  g.subject || '');
      SetText('gf-th-cscore', g.label   || '');
      const pctEl = document.getElementById('gf-th-cpct');
      if (pctEl) { pctEl.textContent = g.percentage != null ? `${Math.round(g.percentage)}%` : '?'; pctEl.style.color = GetGradeColor(g.percentage); }
      const mult = GradeMultiplier(g.percentage);
      const multEl = document.getElementById('gf-th-cmult');
      if (multEl) { multEl.textContent = `×${mult.toFixed(2)}`; multEl.dataset.m = mult > 1 ? 'up' : mult < 1 ? 'down' : ''; }
      const sw = document.getElementById('gf-th-cswatch');
      if (sw) sw.style.background = GetGradeColor(g.percentage);
    }
  }

  function SetText(id, v) {
    if (_hud[id] === v) return;
    const el = document.getElementById(id);
    if (el) { el.textContent = v; _hud[id] = v; }
  }

  const SCREEN_IDS = ['gf-ts-start', 'gf-ts-gameover', 'gf-ts-pause'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const el = document.getElementById(sid); if (el) el.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    if (GT.score > GT.hiScore) { GT.hiScore = GT.score; SaveHiScore(GT.score); }
    const msg = GO_MSGS[0 | (Math.random() * GO_MSGS.length)];
    SetText('gf-ts-go-msg',   msg);
    SetText('gf-ts-go-score', GT.score.toLocaleString());
    SetText('gf-ts-go-lines', String(GT.lines));
    SetText('gf-ts-go-level', String(GT.level));
    SetText('gf-ts-go-best',  GT.hiScore.toLocaleString());
    const nb = document.getElementById('gf-ts-go-new');
    if (nb) nb.style.display = GT.startHi > 0 && GT.score > GT.startHi ? 'block' : 'none';
    ShowScreen('gf-ts-gameover');
  }

  function KeyLabel(a) { return window.GfKeys ? GfKeys.label(a) : a === 'pause' ? 'P' : 'R'; }

  function BuildOverlay() {
    if (document.getElementById('gf-tetris')) return;
    InjectCSS();
    const T = _GameText;
    const root = document.createElement('div');
    root.id = 'gf-tetris';
    root.innerHTML = `
<div id="gf-tetris-modal">
  <div id="gf-tt-header">
    <div id="gf-tt-hl">
      <div id="gf-tt-logo"><i></i><i></i><i></i><i></i></div>
      <span id="gf-tt-title">GradeStack</span>
      <span id="gf-tt-badge">BETA</span>
    </div>
    <div id="gf-tt-hr">
      <span id="gf-tt-hint">${window.GfKeys ? GfKeys.label('arcade') : 'F8'}</span>
      <button id="gf-tt-pause" title="${T('game_pause_p')}">⏸</button>
      <button id="gf-tt-close" title="${T('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-tt-body">
    <div id="gf-tb-left" class="gf-tb-col">
      <div class="gf-tp">
        <div class="gf-tp-label">${T('game_stack_hold')}</div>
        <div class="gf-tp-well"><canvas id="gf-tc-hold" style="width:${SW}px;height:${HH}px"></canvas></div>
        <div id="gf-th-hsubj" class="gf-tp-subj"></div>
      </div>
      <div class="gf-tp">
        <div class="gf-tp-label">${T('game_stack_current')}</div>
        <div class="gf-tp-cur"><span id="gf-th-cswatch"></span><span id="gf-th-csubj" class="gf-tp-subj"></span></div>
        <div class="gf-tp-grade-row">
          <span id="gf-th-cscore" class="gf-tp-gscore"></span>
          <span id="gf-th-cpct"   class="gf-tp-gpct"></span>
        </div>
        <div id="gf-th-cmult" class="gf-tp-mult"></div>
      </div>
      <div class="gf-tp gf-tp-stats">
        <div class="gf-tp-big-lbl">${T('game_score')}</div>
        <div id="gf-th-score" class="gf-tp-big">0</div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-k">${T('game_best')}</span>
          <span id="gf-th-best" class="gf-tp-val gf-tp-best">0</span>
        </div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-k">${T('game_stack_lines')}</span>
          <span id="gf-th-lines" class="gf-tp-val">0</span>
        </div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-k">${T('game_stack_level')}</span>
          <span id="gf-th-level" class="gf-tp-val">1</span>
        </div>
        <div class="gf-tp-lvltrack"><div id="gf-th-lvlbar"></div></div>
      </div>
    </div>
    <div id="gf-tb-board">
      <canvas id="gf-tc-board"></canvas>
    </div>
    <div id="gf-tb-hud" class="gf-tb-col">
      <div class="gf-tp">
        <div class="gf-tp-label">${T('game_stack_next')}</div>
        <div class="gf-tp-well"><canvas id="gf-tc-next" style="width:${SW}px;height:${QH}px"></canvas></div>
        <div id="gf-th-nsubj" class="gf-tp-subj"></div>
      </div>
      <div class="gf-tp gf-tp-ctrl">
        <div class="gf-tp-label">${T('game_controls')}</div>
        <div class="gf-tc-row"><kbd>← →</kbd><span>${T('game_stack_move_desc')}</span></div>
        <div class="gf-tc-row"><kbd>↑ X</kbd><span>${T('game_stack_rotate_cw')}</span></div>
        <div class="gf-tc-row"><kbd>Z</kbd><span>${T('game_stack_rotate_ccw')}</span></div>
        <div class="gf-tc-row"><kbd>↓</kbd><span>${T('game_stack_soft_drop')}</span></div>
        <div class="gf-tc-row"><kbd>Space</kbd><span>${T('game_stack_hard_drop')}</span></div>
        <div class="gf-tc-row"><kbd>C</kbd><span>${T('game_stack_hold_desc')}</span></div>
        <div class="gf-tc-row"><kbd>${KeyLabel('pause')}</kbd><span>${T('game_pause')}</span></div>
        <div class="gf-tc-row"><kbd>${KeyLabel('restart')}</kbd><span>${T('game_new_game')}</span></div>
      </div>
    </div>
    <div id="gf-ts-start" class="gf-ts">
      <div class="gf-ts-card">
        <div class="gf-ts-art"><img alt=""><img alt=""><img alt=""><img alt=""></div>
        <div class="gf-ts-logo">GradeStack</div>
        <div class="gf-ts-sub">${T('game_stack_subtitle')}</div>
        <div id="gf-ts-start-hint" class="gf-ts-hint"></div>
        <div id="gf-ts-start-hi" class="gf-ts-hi"></div>
        <button class="gf-ts-btn" id="gf-ts-play">▶&nbsp; ${T('game_start')}</button>
        <div class="gf-ts-footer">${T('game_stack_footer')}</div>
      </div>
    </div>
    <div id="gf-ts-gameover" class="gf-ts" style="display:none">
      <div class="gf-ts-card">
        <div class="gf-ts-go-title">${T('game_gameover')}</div>
        <div id="gf-ts-go-msg" class="gf-ts-go-msg"></div>
        <div id="gf-ts-go-new" class="gf-ts-new" style="display:none">${T('game_new_best')}</div>
        <div class="gf-ts-go-stats">
          <div class="gf-ts-stat gf-ts-stat-main"><span>${T('game_score')}</span><b id="gf-ts-go-score"></b></div>
          <div class="gf-ts-stat"><span>${T('game_best')}</span><b id="gf-ts-go-best" class="gf-tp-best"></b></div>
          <div class="gf-ts-stat"><span>${T('game_stack_lines_cleared')}</span><b id="gf-ts-go-lines"></b></div>
          <div class="gf-ts-stat"><span>${T('game_stack_level_reached')}</span><b id="gf-ts-go-level"></b></div>
        </div>
        <button class="gf-ts-btn" id="gf-ts-restart">↺&nbsp; ${T('game_play_again')}</button>
      </div>
    </div>
    <div id="gf-ts-pause" class="gf-ts" style="display:none">
      <div class="gf-ts-card">
        <div class="gf-ts-pause-title">${T('game_paused')}</div>
        <div id="gf-ts-pause-score" class="gf-ts-hint"></div>
        <button class="gf-ts-btn" id="gf-ts-resume">▶&nbsp; ${T('game_resume')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-ts-new">↺&nbsp; ${T('game_new_game')} (${KeyLabel('restart')})</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.getElementById('gf-tc-board');
    _ctx = _cv.getContext('2d');
    BindOverlayButtons();
  }

  function BindOverlayButtons() {
    document.getElementById('gf-tt-close')  ?.addEventListener('click', CloseGradeTetris);
    document.getElementById('gf-tt-pause')  ?.addEventListener('click', DoPause);
    document.getElementById('gf-ts-play')   ?.addEventListener('click', DoStart);
    document.getElementById('gf-ts-restart')?.addEventListener('click', DoStart);
    document.getElementById('gf-ts-resume') ?.addEventListener('click', DoPause);
    document.getElementById('gf-ts-new')    ?.addEventListener('click', DoStart);
    document.getElementById('gf-tetris')    ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-tetris') return;
      const el = document.getElementById('gf-tetris');
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
    });
  }

  function ApplyInvertFix() {
    const el = document.getElementById('gf-tetris');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    const d = el.dataset.theme === 'dark';
    if (d !== _dark) { _dark = d; if (_bg) { Rebuild(); DrawSide(); } }
  }
  const _themeWatcher = new MutationObserver(ApplyInvertFix);

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.55, Math.min(1, (innerHeight - 32 - 46 - 26) / BH, (innerWidth - 32 - 26 - 2 * (SW + 34)) / BW));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(BW * s), h = Math.round(BH * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    _root.style.setProperty('--gs-board-h', `${h}px`);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    clearTimeout(_fitT);
    if (!_bg) Resize(bw, bh);
    else if (_cv.width !== bw || _cv.height !== bh) _fitT = setTimeout(() => Resize(bw, bh), 120);
  }
  function Resize(bw, bh) {
    _cv.width = bw; _cv.height = bh;
    _k = bw / BW;
    Rebuild();
    DrawBoard();
  }

  function DoStart() {
    if (!GT) return;
    const grades = GT.grades, hi = GT.hiScore;
    Object.assign(GT, NewGradeTile(grades));
    GT.hiScore = hi; GT.startHi = hi;
    GT.status = 'playing';
    _np = 0;
    for (const p of _pops) p.t = p.T;
    _hud.g = null;
    ShowScreen(null);
    Spawn(GT);
    DrawSide();
  }

  function DoPause() {
    if (!GT || GT.over) return;
    if (GT.status === 'playing') {
      GT.status = 'paused';
      const ps = document.getElementById('gf-ts-pause-score');
      if (ps) ps.textContent = `${_GameText('game_score')}: ${GT.score.toLocaleString()} · ${_GameText('game_best')}: ${GT.hiScore.toLocaleString()}`;
      ShowScreen('gf-ts-pause');
    } else if (GT.status === 'paused') {
      GT.status = 'playing';
      ShowScreen(null);
    }
  }

  function OnVisibilityChange() {
    if (document.hidden && GT?.status === 'playing') DoPause();
  }

  function OnKey(e) {
    if (!GT || !document.getElementById('gf-tetris')) return;

    if (e.key === 'Escape') {
      if (GT.status === 'playing' || GT.status === 'paused') DoPause();
      else CloseGradeTetris();
      e.preventDefault(); e.stopPropagation(); return;
    }

    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'p' || e.key === 'P') { DoPause(); return; }
    if (e.key === 'r' || e.key === 'R') {
      if (!GT.over || GT.over.t >= OVER_MS) DoStart();
      e.preventDefault(); return;
    }
    if (GT.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (GT.status === 'start' || (GT.status === 'gameover' && GT.over?.t >= OVER_MS)) DoStart();
        else if (GT.status === 'paused') DoPause();
        e.preventDefault();
      }
      return;
    }
    if (!GT.cur) return;

    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': case 'q': case 'Q':
        MovePiece(GT, 0, -1); break;

      case 'ArrowRight': case 'd': case 'D':
        MovePiece(GT, 0,  1); break;

      case 'ArrowUp': case 'x': case 'X': case 'w': case 'W':
        RotateCur(GT,  1); break;

      case 'z': case 'Z':
        RotateCur(GT, -1); break;

      case 'ArrowDown': case 's': case 'S':
        if (!MovePiece(GT, 1, 0)) {
          LockCur(GT);
          if (GT.status === 'gameover') EnterOver();
        } else { GT.score++; GT.drop = 0; }
        break;

      case ' ':
        HardDrop(GT);
        if (GT.status === 'gameover') EnterOver();
        break;

      case 'c': case 'C': case 'Shift':
        HoldCur(GT);
        if (GT.status === 'gameover') EnterOver();
        break;
    }
  }

  function AttachKeys() {
    document.removeEventListener('keydown', OnKey, true);
    document.addEventListener('keydown', OnKey, true);
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
  }
  function DetachKeys() {
    document.removeEventListener('keydown', OnKey, true);
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function OpenGradeTetris(grades) {
    if (!document.getElementById('gf-tetris')) BuildOverlay();
    if (!GT) {
      GT = NewGradeTile(grades || []);
    } else if (grades?.length) {
      GT.grades = NormalizeGrades(grades);
    }
    const hint = document.getElementById('gf-ts-start-hint');
    if (hint) hint.textContent = (!grades?.length)
      ? _GameText('game_no_grades')
      : `✓ ${GT.grades.length} ${_GameText('game_grades_loaded')}`;

    const hiEl = document.getElementById('gf-ts-start-hi');
    if (hiEl) hiEl.textContent = GT.hiScore > 0 ? `${_GameText('game_best')}: ${GT.hiScore.toLocaleString()}` : '';

    document.getElementById('gf-tetris').style.display = 'flex';
    if (GT.status === 'start' || (GT.status === 'gameover' && !GT.over)) ShowScreen('gf-ts-start');
    else if (GT.status === 'gameover') ShowScreen(GT.over.t >= OVER_MS ? 'gf-ts-gameover' : null);
    else if (GT.status === 'paused') ShowScreen('gf-ts-pause');
    ApplyInvertFix();
    Fit();
    AttachKeys();
    _themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    if (!_raf) { _last = 0; _raf = requestAnimationFrame(Frame); }
  }

  function ToggleGradeTetris(grades) {
    const el = document.getElementById('gf-tetris');
    if (el && el.style.display !== 'none') CloseGradeTetris();
    else OpenGradeTetris(grades);
  }

  function CloseGradeTetris() {
    const el = document.getElementById('gf-tetris');
    if (el) el.style.display = 'none';
    if (GT?.status === 'playing') GT.status = 'paused';
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    DetachKeys();
    _themeWatcher.disconnect();
  }

  W.OpenGradeTetris   = OpenGradeTetris;
  W.ToggleGradeTetris = ToggleGradeTetris;
  W.CloseGradeTetris  = CloseGradeTetris;
  W.NormalizeGrades   = NormalizeGrades;
  W.GetGradeColor     = GetGradeColor;
  W.GetFallbackGrades = GetFallbackGrades;

  function InjectCSS() {
    if (document.getElementById('gf-tetris-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-tetris-css';
    s.textContent = `
#gf-tetris {
  --gs-modal:   #ffffff;
  --gs-hdr:     #f6f5fb;
  --gs-hud:     #f4f3fa;
  --gs-scr:     rgba(246,245,252,0.62);
  --gs-brd:     rgba(249,115,22,0.24);
  --gs-brd2:    #e4e2ee;
  --gs-btn-brd: #d4d1e0;
  --gs-txt:     #17142a;
  --gs-txt2:    #4a4660;
  --gs-txt3:    #8a86a0;
  --gs-kbd:     #ffffff;
  --gs-kbd-brd: #d6d3e3;
  --gs-scroll:  #d0d0d0;
  --gs-sh:      0 0 0 1px rgba(249,115,22,0.08), 0 8px 32px rgba(30,20,60,0.16), 0 40px 90px rgba(30,20,60,0.2);
  --gs-frame:   linear-gradient(180deg,#d9d5ea,#c7c2dd);
  --gs-well:    #ebe9f5;
}
#gf-tetris[data-theme="dark"] {
  --gs-modal:   rgba(18,19,32,0.98);
  --gs-hdr:     rgba(12,13,24,0.96);
  --gs-hud:     rgba(14,15,27,0.98);
  --gs-scr:     rgba(8,9,20,0.6);
  --gs-brd:     rgba(249,115,22,0.24);
  --gs-brd2:    #262840;
  --gs-btn-brd: #34374f;
  --gs-txt:     #f3f2fa;
  --gs-txt2:    #b4b2c8;
  --gs-txt3:    #6f6d88;
  --gs-kbd:     #20223a;
  --gs-kbd-brd: #34374f;
  --gs-scroll:  #2a2a2a;
  --gs-sh:      0 0 0 1px rgba(249,115,22,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 40px 90px rgba(0,0,0,0.8);
  --gs-frame:   linear-gradient(180deg,#2c2f4f,#1a1c33);
  --gs-well:    #0f1124;
}

#gf-tetris {
  position: fixed;
  inset: 0;
  z-index: 2147483640;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  font-family: "IBM Plex Mono", monospace;
}
#gf-tetris * { box-sizing: border-box; }

#gf-tetris-modal {
  position: relative;
  background: var(--gs-modal);
  border: 1px solid var(--gs-brd);
  border-radius: 14px;
  box-shadow: var(--gs-sh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  max-width: calc(100vw - 32px);
}

#gf-tt-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 14px;
  background: var(--gs-hdr);
  border-bottom: 1px solid var(--gs-brd);
  flex-shrink: 0; gap: 8px; user-select: none;
}
#gf-tt-hl { display: flex; align-items: center; gap: 9px; }
#gf-tt-hr { display: flex; align-items: center; gap: 6px; }

#gf-tt-logo {
  width: 26px; height: 26px; padding: 4px;
  background: linear-gradient(145deg,#fb923c,#ea580c); border-radius: 7px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px; flex-shrink: 0;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.18), 0 2px 6px rgba(249,115,22,0.35);
}
#gf-tt-logo i { display: block; border-radius: 2px; background: rgba(255,255,255,0.92); box-shadow: inset 0 -1.5px 0 rgba(0,0,0,0.15); }
#gf-tt-logo i:nth-child(2) { background: rgba(255,255,255,0.45); }
#gf-tt-title { font-size: 14px; font-weight: 700; color: var(--gs-txt); letter-spacing: -0.3px; }
#gf-tt-badge {
  font-size: 8px; font-weight: 600; color: #f97316;
  border: 1px solid rgba(249,115,22,0.4); border-radius: 4px; padding: 2px 5px; letter-spacing: 1px;
}
#gf-tt-hint { font-size: 9px; color: var(--gs-txt3); letter-spacing: 0.3px; }

#gf-tt-pause, #gf-tt-close {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  border: 1px solid var(--gs-btn-brd); border-radius: 7px;
  background: transparent; color: var(--gs-txt3);
  cursor: pointer; font-size: 12px; line-height: 1; padding: 0; flex-shrink: 0;
  transition: border-color 0.13s, color 0.13s, background 0.13s;
}
#gf-tt-pause:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,0.10); }
#gf-tt-close:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.10); }

#gf-tt-body { display: flex; position: relative; overflow: hidden; gap: 12px; padding: 12px; background: var(--gs-hud); }
#gf-tb-board {
  flex-shrink: 0; line-height: 0; padding: 5px; border-radius: 12px;
  background: var(--gs-frame);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px rgba(30,20,70,0.22);
}
#gf-tc-board { display: block; border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }

.gf-tb-col {
  width: ${SW + 22}px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 10px;
  overflow-y: auto; max-height: calc(var(--gs-board-h, ${BH}px) + 10px);
}
.gf-tb-col::-webkit-scrollbar { width: 3px; }
.gf-tb-col::-webkit-scrollbar-thumb { background: var(--gs-scroll); border-radius: 99px; }

.gf-tp {
  padding: 9px 10px; flex-shrink: 0;
  background: var(--gs-modal); border: 1px solid var(--gs-brd2); border-radius: 11px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 3px 10px rgba(30,20,70,0.06);
}
.gf-tp-label {
  font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: var(--gs-txt3);
  text-transform: uppercase; margin-bottom: 6px;
  display: flex; align-items: center; gap: 5px;
}
.gf-tp-label::before { content: ''; width: 6px; height: 6px; border-radius: 2px; background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,0.6); }
.gf-tp-well { border-radius: 8px; background: var(--gs-well); box-shadow: inset 0 2px 5px rgba(20,10,60,0.12); line-height: 0; }
.gf-tp-well canvas { display: block; }

.gf-tp-subj { font-size: 9px; color: var(--gs-txt2); line-height: 1.3; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 12px; }
.gf-tp-cur { display: flex; align-items: center; gap: 6px; }
.gf-tp-cur .gf-tp-subj { margin-top: 0; font-weight: 600; color: var(--gs-txt); }
#gf-th-cswatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; background: #a78bfa; box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2); }
.gf-tp-grade-row { display: flex; align-items: baseline; gap: 6px; margin-top: 5px; }
.gf-tp-gscore { font-size: 11px; font-weight: 600; color: var(--gs-txt2); }
.gf-tp-gpct   { font-size: 17px; font-weight: 800; }
.gf-tp-mult   { display: inline-block; font-size: 10px; font-weight: 800; margin-top: 5px; padding: 2px 7px; border-radius: 99px; background: rgba(128,128,128,0.12); color: var(--gs-txt3); letter-spacing: 0.3px; }
.gf-tp-mult[data-m="up"] { background: rgba(74,222,128,0.16); color: #16a34a; }
.gf-tp-mult[data-m="down"] { background: rgba(248,113,113,0.16); color: #dc2626; }
#gf-tetris[data-theme="dark"] .gf-tp-mult[data-m="up"] { color: #4ade80; }
#gf-tetris[data-theme="dark"] .gf-tp-mult[data-m="down"] { color: #f87171; }

.gf-tp-big-lbl { font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: var(--gs-txt3); text-transform: uppercase; }
.gf-tp-big { font-size: 22px; font-weight: 800; color: var(--gs-txt); letter-spacing: -0.8px; line-height: 1.15; margin-bottom: 4px; font-variant-numeric: tabular-nums; }
.gf-tp-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; }
.gf-tp-k { font-size: 9px; color: var(--gs-txt3); }
.gf-tp-val { font-size: 13px; font-weight: 700; color: var(--gs-txt); font-variant-numeric: tabular-nums; }
.gf-tp-best { color: #f97316 !important; }
.gf-tp-lvltrack { height: 5px; margin-top: 6px; border-radius: 99px; background: var(--gs-well); overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.12); }
#gf-th-lvlbar { height: 100%; width: 0; border-radius: 99px; background: linear-gradient(90deg,#fbbf24,#f97316); transition: width .3s ease-out; }

.gf-tc-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.gf-tc-row kbd {
  display: inline-block; padding: 2px 4px;
  font-family: inherit; font-size: 8px; font-weight: 700;
  background: var(--gs-kbd); border: 1px solid var(--gs-kbd-brd); border-bottom-width: 2px; border-radius: 4px;
  color: var(--gs-txt2); min-width: 34px; text-align: center; flex-shrink: 0;
}
.gf-tc-row span { font-size: 8px; color: var(--gs-txt3); line-height: 1.2; }

.gf-ts {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: var(--gs-scr);
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
  padding: 20px;
  animation: gf-ts-fade .2s ease-out;
}
@keyframes gf-ts-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes gf-ts-rise { from { transform: translateY(10px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes gf-ts-bob { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-5px) rotate(var(--r,0deg)); } }
.gf-ts-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  min-width: 250px; max-width: 320px; padding: 22px 26px 20px;
  background: var(--gs-modal); border: 1px solid var(--gs-brd); border-radius: 16px;
  box-shadow: 0 18px 50px rgba(20,10,50,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
  animation: gf-ts-rise .28s cubic-bezier(.2,.9,.3,1.2);
  text-align: center;
}
.gf-ts-art { display: flex; gap: 2px; margin-bottom: -2px; }
.gf-ts-art img { width: 56px; height: 38px; animation: gf-ts-bob 2.4s ease-in-out infinite; }
.gf-ts-art img:nth-child(1) { --r: -8deg; }
.gf-ts-art img:nth-child(2) { --r: 5deg; animation-delay: -.6s; }
.gf-ts-art img:nth-child(3) { --r: -4deg; animation-delay: -1.2s; }
.gf-ts-art img:nth-child(4) { --r: 9deg; animation-delay: -1.8s; }
.gf-ts-logo {
  font-size: 32px; font-weight: 800; letter-spacing: -1.5px; line-height: 1;
  background: linear-gradient(180deg,#fdba74,#f97316 55%,#c2410c); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 3px 10px rgba(249,115,22,0.35));
}
.gf-ts-sub    { font-size: 12px; color: var(--gs-txt2); letter-spacing: 0.5px; }
.gf-ts-hint   { font-size: 9px; color: var(--gs-txt3); text-align: center; line-height: 1.5; }
.gf-ts-hi     { font-size: 11px; font-weight: 700; color: #f97316; }
.gf-ts-hi:empty { display: none; }
.gf-ts-footer { font-size: 8px; color: var(--gs-txt3); text-align: center; }

.gf-ts-btn {
  padding: 10px 26px; min-width: 170px;
  border: none; border-radius: 10px;
  background: linear-gradient(180deg,#fb923c,#f97316); color: #fff;
  font-family: inherit; font-size: 12px; font-weight: 800;
  cursor: pointer; letter-spacing: 0.3px;
  box-shadow: 0 3px 0 #c2410c, 0 6px 18px rgba(249,115,22,0.35);
  transition: transform 0.12s, box-shadow 0.12s, filter .12s;
}
.gf-ts-btn:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 4px 0 #c2410c, 0 10px 24px rgba(249,115,22,0.4); }
.gf-ts-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #c2410c, 0 3px 10px rgba(249,115,22,0.3); }
.gf-ts-btn-sec { background: transparent; color: var(--gs-txt2); border: 1px solid var(--gs-btn-brd); box-shadow: none; padding: 8px 18px; }
.gf-ts-btn-sec:hover { box-shadow: none; background: rgba(128,128,128,0.1); }
.gf-ts-btn-sec:active { box-shadow: none; }
.gf-ts-pause-title { font-size: 22px; font-weight: 800; letter-spacing: 5px; color: var(--gs-txt); }
.gf-ts-go-title {
  font-size: 26px; font-weight: 800; color: #ef4444; letter-spacing: 4px;
  text-shadow: 0 3px 18px rgba(239,68,68,0.35);
}
.gf-ts-go-msg   { font-size: 11px; color: #f97316; font-style: italic; }
.gf-ts-new { font-size: 10px; font-weight: 800; color: #fff; background: linear-gradient(90deg,#f59e0b,#f97316); padding: 3px 10px; border-radius: 99px; box-shadow: 0 3px 10px rgba(249,115,22,0.4); }
.gf-ts-go-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%; margin: 2px 0 4px; }
.gf-ts-stat { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 7px 4px; border-radius: 9px; background: var(--gs-hud); border: 1px solid var(--gs-brd2); }
.gf-ts-stat span { font-size: 8px; color: var(--gs-txt3); letter-spacing: .5px; text-transform: uppercase; }
.gf-ts-stat b { font-size: 15px; font-weight: 800; color: var(--gs-txt); font-variant-numeric: tabular-nums; }
.gf-ts-stat-main b { color: #f97316; }
`;
    document.head.appendChild(s);
  }

})(window);
