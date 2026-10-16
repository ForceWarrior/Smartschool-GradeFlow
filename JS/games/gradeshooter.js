;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const BANDS = [
    { id:0, range:'0–9',   bg:'#ef4444', fg:'#fff',    border:'#b91c1c', label:'FAIL'  },
    { id:1, range:'10–11', bg:'#f97316', fg:'#fff',    border:'#c2410c', label:'PASS'  },
    { id:2, range:'12–13', bg:'#eab308', fg:'#1a1a1a', border:'#a16207', label:'OK'    },
    { id:3, range:'14–15', bg:'#22c55e', fg:'#fff',    border:'#15803d', label:'GOOD'  },
    { id:4, range:'16–17', bg:'#3b82f6', fg:'#fff',    border:'#1d4ed8', label:'GREAT' },
    { id:5, range:'18–20', bg:'#d946ef', fg:'#fff',    border:'#a21caf', label:'PERF'  },
  ];

  function GetBandIndex(Pct) {
    const g = Math.round(Pct / 5);
    if (g <= 9)  return 0;
    if (g <= 11) return 1;
    if (g <= 13) return 2;
    if (g <= 15) return 3;
    if (g <= 17) return 4;
    return 5;
  }

  const COLS        = 11;
  const ROWS        = 12;
  const R           = 20;
  const DIAM        = R * 2;
  const ROW_H       = Math.round(R * Math.sqrt(3));
  const PROJ_SPD    = 660;
  const MATCH_MIN   = 3;
  const CEIL_ROWS   = 7;
  const DESCEND_EVERY = 18;
  const OY          = 12;
  const STEP        = 1 / 120;
  const TAU         = Math.PI * 2;
  const ACCENT      = '#22d3ee';
  const POP_GAP     = 38;
  const PN          = 420;

  function CanvasWidth()  { return R + COLS * DIAM + R; }
  function CanvasHeight()  { return OY + ROWS * ROW_H + R * 3 + 52; }
  const CW = CanvasWidth(), CH = CanvasHeight();
  const DANGER_Y = OY + R + (ROWS - 1) * ROW_H + R + 3;
  const CANNON_X = CW / 2, CANNON_Y = CH - 36;
  const NEXT_X = CANNON_X - 76, NEXT_Y = CANNON_Y + 8;

  function GetColsForRow(r) { return r % 2 === 1 ? COLS - 1 : COLS; }

  function GetBubblePos(row, col) {
    const indent = row % 2 === 1 ? R : 0;
    return { x: R + indent + col * DIAM, y: OY + R + row * ROW_H };
  }

  function SnapToGrid(px, py) {
    let bRow = 0, bCol = 0, bD = Infinity;
    for (let r = 0; r < ROWS + 2; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (GameState.grid[r]?.[c]) continue;
        const { x, y } = GetBubblePos(r, c);
        const d = (x - px) ** 2 + (y - py) ** 2;
        if (d < bD) { bD = d; bRow = r; bCol = c; }
      }
    }
    return { row: Math.min(bRow, ROWS + 1), col: Math.max(0, Math.min(bCol, GetColsForRow(bRow) - 1)) };
  }

  function GetHexNeighbors(row, col) {
    const even = row % 2 === 0;
    const offs = even
      ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
      : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
    return offs
      .map(([dr,dc]) => ({ row: row+dr, col: col+dc }))
      .filter(({row:r,col:c}) => r >= 0 && c >= 0 && c < GetColsForRow(r));
  }

  let GameState   = null;
  let _raf = null;
  let _grades = [];
  let _host = null, _cv = null, _ctx = null, _view = null;
  let _dark = false, _k = 1, _S = null, _I = null, _dangerG = null;
  let _last = 0, _acc = 0;
  let _screen = 'start';
  let _mode = 'clear';

  const _P = Array.from({ length: PN }, () => ({ on: 0, kind: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, life: 1, s: 1, col: '#fff', rot: 0, vr: 0 }));
  let _pi = 0;
  function Emit(kind, x, y, vx, vy, life, s, col, g) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.t = 0; p.s = s; p.col = col; p.g = g;
    p.rot = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 12;
  }

  function MakeGrid() {
    return Array.from({ length: ROWS + 4 }, () => new Array(COLS).fill(null));
  }

  let _bandPool = null;

  function InitGradeBandPool() {
    if (!_grades.length) { _bandPool = null; return; }
    const seen = new Set();
    for (const g of _grades) {
      const Pct = g.percentage ?? g.Pct ?? null;
      if (Pct != null) seen.add(GetBandIndex(Pct));
    }
    if (seen.size < 3) {
      for (const b of [...seen]) {
        if (b > 0) seen.add(b - 1);
        if (b < BANDS.length - 1) seen.add(b + 1);
      }
    }
    while (seen.size < 3) seen.add(Math.floor(Math.random() * BANDS.length));
    _bandPool = [...seen];
  }

  function RandomBand() {
    if (_bandPool && Math.random() < 0.6) {
      return _bandPool[Math.floor(Math.random() * _bandPool.length)];
    }
    return Math.floor(Math.random() * BANDS.length);
  }
  function RandomSubject() {
    if (_grades.length) return _grades[Math.floor(Math.random() * _grades.length)].subject || 'Grade';
    return 'Grade';
  }

  function Bubble(band) { return { band, born: 0, wob: 0, wx: 0, wy: 0 }; }

  function FillGrid() {
    InitGradeBandPool();
    const g = MakeGrid();
    for (let r = 0; r < CEIL_ROWS; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        g[r][c] = Bubble(RandomBand());
      }
    }
    return g;
  }

  function MakeQueue() {
    return Array.from({ length: 24 }, () => ({ band: RandomBand(), subject: RandomSubject() }));
  }

  function InitGameState(mode) {
    const q = MakeQueue();
    return {
      mode,
      grid: FillGrid(),
      proj: null,
      nextBand:    q[0].band,
      nextSubject: q[0].subject,
      queue: q.slice(1),
      score: 0, shots: 0, cleared: 0,
      status: mode === 'demo' ? 'demo' : 'playing',
      _bossHidden: false,
      canW: CW, canH: CH,
      cannonX: CANNON_X,
      cannonY: CANNON_Y,
      aimAngle: -Math.PI / 2,
      falling: [],
      pops: [],
      texts: [],
      trail: [],
      recoil: 0, swapT: -1, descT: -1, deadT: -1, endT: -1,
      time: 0, ver: 0,
      aimCache: null,
    };
  }

  function BandsOnBoard() {
    const s = new Set();
    for (const row of GameState.grid) for (const b of row) if (b) s.add(b.band);
    return s;
  }

  function SmartBand(band) {
    if (GameState.mode !== 'clear') return band;
    const s = BandsOnBoard();
    if (!s.size || s.has(band)) return band;
    const a = [...s];
    return a[Math.floor(Math.random() * a.length)];
  }

  function FindMatchingCluster(grid, row, col) {
    const band = grid[row]?.[col]?.band;
    if (band == null) return [];
    const visited = new Set([`${row},${col}`]);
    const q = [{ row, col }];
    for (let h = 0; h < q.length; h++) {
      const cur = q[h];
      for (const nb of GetHexNeighbors(cur.row, cur.col)) {
        const k = `${nb.row},${nb.col}`;
        if (!visited.has(k) && grid[nb.row]?.[nb.col]?.band === band) {
          visited.add(k); q.push(nb);
        }
      }
    }
    return q;
  }

  function FindFloatingBubbles(grid) {
    const visited = new Set();
    const q = [];
    for (let c = 0; c < GetColsForRow(0); c++) {
      if (grid[0][c]) { visited.add(`0,${c}`); q.push({ row:0, col:c }); }
    }
    for (let h = 0; h < q.length; h++) {
      const cur = q[h];
      for (const nb of GetHexNeighbors(cur.row, cur.col)) {
        const k = `${nb.row},${nb.col}`;
        if (!visited.has(k) && grid[nb.row]?.[nb.col]) { visited.add(k); q.push(nb); }
      }
    }
    const floating = [];
    for (let r = 1; r < ROWS + 4; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (grid[r]?.[c] && !visited.has(`${r},${c}`)) floating.push({ row:r, col:c });
      }
    }
    return floating;
  }

  function ClampAim(a) {
    return (Math.sin(a) > -0.1) ? (Math.cos(a) < 0 ? -Math.PI + 0.12 : -0.12) : a;
  }

  function Shoot() {
    if (!GameState || GameState.proj || GameState.status !== 'playing' || _screen !== 'none') return;
    const a = ClampAim(GameState.aimAngle);
    GameState.proj = {
      x: GameState.cannonX + Math.cos(a) * 26, y: GameState.cannonY + Math.sin(a) * 26,
      vx: Math.cos(a) * PROJ_SPD,
      vy: Math.sin(a) * PROJ_SPD,
      band: GameState.nextBand,
    };
    GameState.trail.length = 0;
    const next = GameState.queue.shift();
    GameState.nextBand    = SmartBand(next.band);
    GameState.nextSubject = next.subject;
    if (GameState.queue.length < 6) GameState.queue.push(...MakeQueue().slice(0, 8));
    GameState.queue[0].band = SmartBand(GameState.queue[0].band);
    GameState.shots++;
    GameState.recoil = 1;
    for (let i = 0; i < 6; i++) {
      const s = a + (Math.random() - 0.5) * 0.8, v = 60 + Math.random() * 80;
      Emit(2, GameState.cannonX + Math.cos(a) * 44, GameState.cannonY + Math.sin(a) * 44, Math.cos(s) * v, Math.sin(s) * v, 0.35, 4 + Math.random() * 3, _dark ? '#475569' : '#cbd5e1', -30);
    }
    if (GameState.mode === 'endless' && GameState.shots % DESCEND_EVERY === 0) DescendCeiling();
    UpdateHUD();
  }

  function Swap() {
    if (!GameState || GameState.status !== 'playing' || _screen !== 'none' || !GameState.queue.length) return;
    const q = GameState.queue[0];
    const b = GameState.nextBand, s = GameState.nextSubject;
    GameState.nextBand = q.band; GameState.nextSubject = q.subject;
    q.band = b; q.subject = s;
    GameState.swapT = GameState.time;
    GameState.ver++;
    UpdateHUD();
  }

  function DescendCeiling() {
    const row0 = new Array(COLS).fill(null);
    const row1 = new Array(COLS).fill(null);
    for (let c = 0; c < GetColsForRow(0); c++) row0[c] = Bubble(RandomBand());
    for (let c = 0; c < GetColsForRow(1); c++) row1[c] = Bubble(RandomBand());
    GameState.grid.unshift(row0, row1);
    while (GameState.grid.length > ROWS + 4) GameState.grid.pop();
    GameState.descT = GameState.time;
    GameState.ver++;
  }

  function StepProjectile(dt) {
    const p = GameState.proj;
    if (!p) return;
    p.x += p.vx * dt; p.y += p.vy * dt;

    if (p.x - R < 0) { p.x = R; p.vx = Math.abs(p.vx); WallHit(p.x - R, p.y); }
    if (p.x + R > GameState.canW) { p.x = GameState.canW - R; p.vx = -Math.abs(p.vx); WallHit(p.x + R, p.y); }

    if (p.y - R <= OY) { p.y = OY + R; Land(p.x, p.y, p.band); return; }

    if (p.y > GameState.canH + R * 4) { GameState.proj = null; return; }

    for (let r = 0; r < ROWS; r++) {
      const row = GameState.grid[r];
      if (!row) continue;
      const y = OY + R + r * ROW_H, x0 = R + (r % 2 === 1 ? R : 0);
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (!row[c]) continue;
        const x = x0 + c * DIAM;
        if ((p.x-x)**2 + (p.y-y)**2 < (DIAM - 3)**2) {
          Land(p.x, p.y, p.band); return;
        }
      }
    }
  }

  function WallHit(x, y) {
    for (let i = 0; i < 4; i++) Emit(1, x, y, (x < CW / 2 ? 1 : -1) * (40 + Math.random() * 60), (Math.random() - 0.5) * 90, 0.3, 1.6, '#ffffff', 0);
  }

  function Land(px, py, band) {
    GameState.proj = null;
    GameState.ver++;
    const { row, col } = SnapToGrid(px, py);
    const safeRow = Math.max(0, Math.min(row, ROWS + 2));
    const safeCol = Math.max(0, Math.min(col, GetColsForRow(safeRow) - 1));

    if (!GameState.grid[safeRow]) GameState.grid[safeRow] = new Array(COLS).fill(null);
    const nb = Bubble(band);
    nb.born = GameState.time;
    GameState.grid[safeRow][safeCol] = nb;
    const lp = GetBubblePos(safeRow, safeCol);
    for (const n of GetHexNeighbors(safeRow, safeCol)) {
      const b = GameState.grid[n.row]?.[n.col];
      if (!b) continue;
      const q = GetBubblePos(n.row, n.col), d = Math.hypot(q.x - lp.x, q.y - lp.y) || 1;
      b.wob = GameState.time; b.wx = (q.x - lp.x) / d; b.wy = (q.y - lp.y) / d;
    }

    const cluster = FindMatchingCluster(GameState.grid, safeRow, safeCol);
    if (cluster.length >= MATCH_MIN) {
      const t0 = GameState.time;
      GameState.score += cluster.length * 10;
      GameState.cleared += cluster.length;
      let sx = 0, sy = 0;
      cluster.forEach(({ row: r, col: c }, i) => {
        const { x, y } = GetBubblePos(r, c);
        sx += x; sy += y;
        GameState.pops.push({ x, y, band: GameState.grid[r][c].band, at: t0 + i * POP_GAP / 1000, done: 0 });
        GameState.grid[r][c] = null;
      });
      AddText(sx / cluster.length, sy / cluster.length, `+${cluster.length * 10}`, BANDS[band].bg, t0 + 0.05);

      const floating = FindFloatingBubbles(GameState.grid);
      const ft = t0 + cluster.length * POP_GAP / 1000 + 0.05;
      let fx = 0, fy = 0;
      floating.forEach(({ row: r, col: c }, i) => {
        const { x, y } = GetBubblePos(r, c);
        fx += x; fy += y;
        GameState.falling.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 80, band: GameState.grid[r][c].band, at: ft + i * 0.012, rot: 0, vr: (Math.random() - 0.5) * 6, b: 0 });
        GameState.grid[r][c] = null;
        GameState.score += 5; GameState.cleared++;
      });
      if (floating.length) AddText(fx / floating.length, fy / floating.length + 16, `+${floating.length * 5}`, '#facc15', ft + 0.1);

      if (GameState.mode === 'clear' && !GameState.grid.some(row => row.some(b => b))) {
        GameState.status = 'win'; GameState.endT = ft + 0.9; UpdateHUD(); return;
      }
      GameState.nextBand = SmartBand(GameState.nextBand);
      if (GameState.queue.length) GameState.queue[0].band = SmartBand(GameState.queue[0].band);
    } else {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU;
        Emit(1, lp.x + Math.cos(a) * R, lp.y + Math.sin(a) * R, Math.cos(a) * 50, Math.sin(a) * 50, 0.3, 1.5, '#ffffff', 0);
      }
    }

    for (let c = 0; c < GetColsForRow(ROWS - 1); c++) {
      if (GameState.grid[ROWS - 1]?.[c]) { GameState.status = 'lose'; GameState.deadT = GameState.time; GameState.endT = GameState.time + 1.3; UpdateHUD(); return; }
    }

    UpdateHUD();
  }

  function AddText(x, y, txt, col, at) {
    GameState.texts.push({ x, y, txt, col, at });
    if (GameState.texts.length > 8) GameState.texts.shift();
  }

  function Update(dt) {
    const G = GameState;
    G.time += dt;
    if (G.status === 'demo') {
      G.aimAngle = -Math.PI / 2 + Math.sin(G.time * 0.8) * 0.9;
      G.ver++;
    }
    if (G.proj) {
      StepProjectile(dt);
      if (G.proj) { G.trail.push(G.proj.x, G.proj.y); if (G.trail.length > 16) G.trail.splice(0, 2); }
    }
    G.recoil = Math.max(0, G.recoil - dt * 6);
    for (const p of G.pops) {
      if (p.done || G.time < p.at) continue;
      p.done = 1;
      const b = BANDS[p.band];
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU + Math.random() * 0.4, v = 90 + Math.random() * 110;
        Emit(0, p.x + Math.cos(a) * R * 0.5, p.y + Math.sin(a) * R * 0.5, Math.cos(a) * v, Math.sin(a) * v, 0.45 + Math.random() * 0.25, 2.5 + Math.random() * 2.5, i % 3 ? b.bg : Lt(b.bg, 0.5), 520);
      }
      Emit(3, p.x, p.y, 0, 0, 0.3, R * 1.5, Lt(b.bg, 0.4), 0);
    }
    if (G.pops.length && G.pops.every(p => p.done && G.time - p.at > 0.2)) G.pops.length = 0;
    for (let i = G.falling.length - 1; i >= 0; i--) {
      const f = G.falling[i];
      if (G.time < f.at) continue;
      f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.x < R) { f.x = R; f.vx = Math.abs(f.vx) * 0.6; }
      if (f.x > CW - R) { f.x = CW - R; f.vx = -Math.abs(f.vx) * 0.6; }
      if (!f.b && f.y > DANGER_Y + 40 && f.vy > 0) {
        f.b = 1; f.vy = -f.vy * 0.35; f.y = DANGER_Y + 40;
        Emit(3, f.x, f.y + R * 0.6, 0, 0, 0.25, R, '#ffffff', 0);
      }
      if (f.y > CH + R * 2) G.falling.splice(i, 1);
    }
    for (const p of _P) {
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = 0; continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.kind === 0) { p.vx *= 0.985; }
    }
    if ((G.status === 'win' || G.status === 'lose') && G.endT > 0 && G.time >= G.endT) {
      G.endT = -1;
      ShowResult();
    }
  }

  function StartLoop() {
    if (_raf) return;
    _last = 0;
    function Frame(now) {
      _raf = requestAnimationFrame(Frame);
      const dt = Math.min(0.05, _last ? (now - _last) / 1000 : 0); _last = now;
      if (!GameState || !_S) return;
      if (_screen !== 'paused') {
        _acc += dt;
        while (_acc >= STEP) { Update(STEP); _acc -= STEP; }
      }
      Draw();
    }
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function IsDark() {
    return typeof window._GfIsEffectiveThemeDark === 'function'
      ? window._GfIsEffectiveThemeDark()
      : document.documentElement.getAttribute('data-gf-theme') === 'dark';
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
  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g, w, h };
  }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  const FONT = '"Segoe UI", system-ui, -apple-system, Arial, sans-serif';
  const F_NEXT = `800 9px ${FONT}`, F_NUM = `800 13px ${FONT}`;

  function BubbleArt(bg, fg, label, r, k) {
    const e = 5, s = Cv(r * 2 + e * 2, r * 2 + e * 2, k), g = s.g, c = r + e;
    g.save();
    g.filter = `blur(${(1.6 * k).toFixed(1)}px)`;
    Circ(g, c + 1.2, c + 2.4, r - 0.5); g.fillStyle = 'rgba(10,15,40,0.32)'; g.fill();
    g.restore();
    const gr = g.createRadialGradient(c - r * 0.35, c - r * 0.42, r * 0.08, c, c, r * 1.05);
    gr.addColorStop(0, Lt(bg, 0.6)); gr.addColorStop(0.42, Lt(bg, 0.06)); gr.addColorStop(0.85, Dk(bg, 0.12)); gr.addColorStop(1, Dk(bg, 0.32));
    Circ(g, c, c, r - 0.6); g.fillStyle = gr; g.fill();
    g.beginPath(); g.arc(c, c, r - 3, Math.PI * 0.15, Math.PI * 0.85);
    g.strokeStyle = Rgba(Lt(bg, 0.5), 0.55); g.lineWidth = 1.6; g.stroke();
    Circ(g, c, c, r - 0.6); g.lineWidth = Math.max(1.3, r * 0.08); g.strokeStyle = Dk(bg, 0.5); g.stroke();
    g.beginPath(); g.ellipse(c - r * 0.38, c - r * 0.46, r * 0.34, r * 0.19, -0.65, 0, TAU);
    g.fillStyle = 'rgba(255,255,255,0.78)'; g.fill();
    Circ(g, c + r * 0.02, c - r * 0.64, r * 0.07); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill();
    if (label) {
      let fs = Math.round(r * 0.62);
      g.font = `800 ${fs}px ${FONT}`;
      while (fs > 6 && g.measureText(label).width > r * 1.6) { fs--; g.font = `800 ${fs}px ${FONT}`; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = Math.max(2, r * 0.13);
      g.strokeStyle = fg === '#fff' ? Dk(bg, 0.45) : 'rgba(255,255,255,0.55)';
      g.strokeText(label, c, c + r * 0.08);
      g.fillStyle = fg; g.fillText(label, c, c + r * 0.08);
    }
    s.e = e;
    return s;
  }

  function BgArt(k, dark) {
    const s = Cv(CW, CH, k), g = s.g;
    const sky = g.createLinearGradient(0, 0, 0, DANGER_Y);
    if (dark) { sky.addColorStop(0, '#0a1230'); sky.addColorStop(1, '#16193a'); }
    else { sky.addColorStop(0, '#d6ecff'); sky.addColorStop(1, '#f4f9ff'); }
    g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
    const rnd = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(7);
    for (let i = 0; i < 22; i++) {
      const x = rnd() * CW, y = OY + rnd() * (DANGER_Y - OY), r = 10 + rnd() * 40;
      const gl = g.createRadialGradient(x, y, 0, x, y, r);
      gl.addColorStop(0, dark ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; Circ(g, x, y, r); g.fill();
    }
    if (dark) {
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(226,232,240,${0.15 + rnd() * 0.35})`; Circ(g, rnd() * CW, OY + rnd() * (DANGER_Y - OY), 0.5 + rnd()); g.fill(); }
    }
    g.fillStyle = dark ? 'rgba(148,163,184,0.07)' : 'rgba(59,130,246,0.08)';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < GetColsForRow(r); c++) { const p = GetBubblePos(r, c); Circ(g, p.x, p.y, 1.6); g.fill(); }
    for (const x of [0, CW - 4]) {
      const rg = g.createLinearGradient(x, 0, x + 4, 0);
      rg.addColorStop(0, dark ? '#334155' : '#94a3b8'); rg.addColorStop(0.5, dark ? '#64748b' : '#e2e8f0'); rg.addColorStop(1, dark ? '#1e293b' : '#94a3b8');
      g.fillStyle = rg; g.fillRect(x, OY, 4, DANGER_Y - OY);
    }
    const cg = g.createLinearGradient(0, 0, 0, OY);
    cg.addColorStop(0, dark ? '#64748b' : '#cbd5e1'); cg.addColorStop(0.5, dark ? '#475569' : '#94a3b8'); cg.addColorStop(1, dark ? '#1e293b' : '#64748b');
    g.fillStyle = cg; g.fillRect(0, 0, CW, OY);
    g.fillStyle = ACCENT; g.fillRect(0, OY - 3, CW, 1.5);
    for (let x = 14; x < CW; x += 44) { Circ(g, x, OY * 0.42, 2); g.fillStyle = dark ? '#94a3b8' : '#f1f5f9'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#334155'; g.stroke(); }
    const dy = DANGER_Y + 10;
    const wg = g.createLinearGradient(0, dy, 0, CH);
    if (dark) { wg.addColorStop(0, '#4a3426'); wg.addColorStop(1, '#2a1d15'); }
    else { wg.addColorStop(0, '#e8c28f'); wg.addColorStop(1, '#c9955a'); }
    g.fillStyle = wg; g.fillRect(0, dy, CW, CH - dy);
    g.strokeStyle = dark ? 'rgba(0,0,0,0.25)' : 'rgba(120,70,30,0.18)'; g.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = dy + 8 + i * 12 + rnd() * 4;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= CW; x += 40) g.quadraticCurveTo(x + 20, y + (rnd() - 0.5) * 6, x + 40, y);
      g.stroke();
    }
    g.fillStyle = dark ? '#6b4a33' : '#f5d8ad'; g.fillRect(0, dy, CW, 2.5);
    g.fillStyle = dark ? 'rgba(0,0,0,0.45)' : 'rgba(90,50,20,0.25)'; g.fillRect(0, dy + 2.5, CW, 2);
    return s;
  }

  function BaseArt(k, dark) {
    const s = Cv(140, 60, k), g = s.g, cx = 70;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx, 52, 50, 7, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(cx - 44, 50); g.lineTo(cx - 30, 22); g.lineTo(cx + 30, 22); g.lineTo(cx + 44, 50); g.closePath();
    const bg = g.createLinearGradient(0, 22, 0, 50);
    bg.addColorStop(0, dark ? '#64748b' : '#94a3b8'); bg.addColorStop(1, dark ? '#334155' : '#475569');
    g.fillStyle = bg; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#0f172a'; g.stroke();
    g.fillStyle = '#f97316'; g.fillRect(cx - 38, 40, 76, 3);
    for (const x of [cx - 32, cx + 32]) { Circ(g, x, 33, 2.2); g.fillStyle = '#e2e8f0'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#0f172a'; g.stroke(); }
    return s;
  }

  function BarrelArt(k) {
    const s = Cv(60, 26, k), g = s.g;
    RR(g, 10, 4, 44, 18, 5);
    const gr = g.createLinearGradient(0, 4, 0, 22);
    gr.addColorStop(0, '#cbd5e1'); gr.addColorStop(0.45, '#64748b'); gr.addColorStop(1, '#1e293b');
    g.fillStyle = gr; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#0f172a'; g.stroke();
    RR(g, 46, 2, 12, 22, 3);
    const mg = g.createLinearGradient(0, 2, 0, 24);
    mg.addColorStop(0, '#fdba74'); mg.addColorStop(1, '#c2410c');
    g.fillStyle = mg; g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(14, 7, 30, 2.5);
    return s;
  }

  function RingArt(k, dark) {
    const s = Cv(64, 64, k), g = s.g;
    const gr = g.createLinearGradient(0, 4, 0, 60);
    gr.addColorStop(0, dark ? '#94a3b8' : '#e2e8f0'); gr.addColorStop(1, dark ? '#1e293b' : '#475569');
    Circ(g, 32, 32, 28); g.fillStyle = gr; g.fill(); g.lineWidth = 1.8; g.strokeStyle = '#0f172a'; g.stroke();
    Circ(g, 32, 32, 22.5); g.fillStyle = '#0b1120'; g.fill();
    Circ(g, 32, 32, 25); g.lineWidth = 1.4; g.strokeStyle = ACCENT; g.stroke();
    return s;
  }

  function CradleArt(k, dark) {
    const s = Cv(52, 40, k), g = s.g;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(26, 34, 20, 4.5, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(26, 26, 21, 8, 0, 0, Math.PI); g.lineTo(5, 24); g.ellipse(26, 24, 21, 6, 0, Math.PI, 0, true); g.closePath();
    g.fillStyle = dark ? '#475569' : '#94a3b8'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#0f172a'; g.stroke();
    g.beginPath(); g.ellipse(26, 24, 21, 6, 0, 0, TAU); g.fillStyle = dark ? '#1e293b' : '#cbd5e1'; g.fill(); g.stroke();
    return s;
  }

  function BuildSprites() {
    const k = _k, dark = _dark;
    _S = {
      bub: BANDS.map(b => BubbleArt(b.bg, b.fg, b.range, R, k)),
      small: BANDS.map(b => BubbleArt(b.bg, b.fg, b.range, R * 0.78, k)),
      dead: BubbleArt('#94a3b8', '#fff', '', R, k),
      bg: BgArt(k, dark), base: BaseArt(k, dark), barrel: BarrelArt(k), ring: RingArt(k, dark), cradle: CradleArt(k, dark),
    };
  }

  function BuildIcons() {
    _I = BANDS.map(b => BubbleArt(b.bg, b.fg, b.range, 20, 2).c.toDataURL());
  }

  function Img(s, x, y) { _ctx.drawImage(s.c, x, y, s.c.width / _k, s.c.height / _k); }
  function ImgC(s, cx, cy, sc) {
    const w = s.c.width / _k * sc, h = s.c.height / _k * sc;
    _ctx.drawImage(s.c, cx - w / 2, cy - h / 2, w, h);
  }

  function Draw() {
    if (!_ctx || !GameState || !_S) return;
    const ctx = _ctx, G = GameState, k = _k, t = G.time;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalAlpha = 1;
    Img(_S.bg, 0, 0);

    let lowest = 0;
    for (let r = 0; r < ROWS; r++) { const row = G.grid[r]; if (row) for (const b of row) if (b) { lowest = r; break; } }
    const danger = lowest >= ROWS - 3 && G.status === 'playing';
    ctx.globalAlpha = danger ? 0.55 + 0.35 * Math.sin(t * 8) : 0.35;
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = danger ? 2 : 1.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 12;
    ctx.beginPath(); ctx.moveTo(4, DANGER_Y); ctx.lineTo(CW - 4, DANGER_Y); ctx.stroke();
    ctx.setLineDash([]);
    if (danger) {
      if (!_dangerG) {
        _dangerG = ctx.createLinearGradient(0, DANGER_Y - 50, 0, DANGER_Y);
        _dangerG.addColorStop(0, 'rgba(239,68,68,0)'); _dangerG.addColorStop(1, 'rgba(239,68,68,0.16)');
      }
      ctx.fillStyle = _dangerG; ctx.fillRect(0, DANGER_Y - 50, CW, 50);
    }
    ctx.globalAlpha = 1;

    if (G.status === 'playing' || G.status === 'demo') DrawAim(ctx);

    let off = 0;
    if (G.descT >= 0 && t - G.descT < 0.4) { const u = (t - G.descT) / 0.4; off = -2 * ROW_H * (1 - u) * (1 - u); }
    for (let r = 0; r < ROWS + 2; r++) {
      const row = G.grid[r]; if (!row) continue;
      const ry = OY + R + r * ROW_H + off, x0 = R + (r % 2 === 1 ? R : 0);
      for (let c = 0; c < GetColsForRow(r); c++) {
        const b = row[c]; if (!b) continue;
        let x = x0 + c * DIAM, y = ry;
        let sc = 1;
        if (b.born && t - b.born < 0.25) { const u = (t - b.born) / 0.25; sc = 1 + Math.sin(u * Math.PI) * 0.12; }
        if (b.wob && t - b.wob < 0.3) { const u = (t - b.wob) / 0.3, a = Math.sin(u * Math.PI) * 3.2 * (1 - u); x += b.wx * a; y += b.wy * a; }
        if (G.deadT >= 0 && t - G.deadT > (ROWS - r) * 0.06) ImgC(_S.dead, x, y, sc);
        else ImgC(_S.bub[b.band], x, y, sc);
      }
    }

    for (const p of G.pops) {
      if (p.done) continue;
      const lead = p.at - t;
      const sc = lead < 0.12 ? 1 + (0.12 - lead) * 1.6 : 1;
      ImgC(_S.bub[p.band], p.x, p.y, sc);
      if (lead < 0.12) { ctx.globalAlpha = (0.12 - lead) * 5; ctx.fillStyle = '#ffffff'; Circ(ctx, p.x, p.y, R * sc * 0.95); ctx.fill(); ctx.globalAlpha = 1; }
    }

    for (const f of G.falling) {
      if (t < f.at) { const { x, y } = f; ImgC(_S.bub[f.band], x + Math.sin(t * 60 + x) * 1.2, y, 1); continue; }
      const fc = Math.cos(f.rot) * k, fs = Math.sin(f.rot) * k;
      ctx.setTransform(fc, fs, -fs, fc, f.x * k, f.y * k);
      ctx.globalAlpha = Math.max(0, Math.min(1, (CH + R - f.y) / 60));
      ImgC(_S.bub[f.band], 0, 0, 1);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.globalAlpha = 1;
    }

    if (G.proj) {
      const tr = G.trail, n = tr.length / 2;
      for (let i = 0; i < n - 1; i++) {
        const u = (i + 1) / n;
        ctx.globalAlpha = u * 0.35;
        ctx.fillStyle = BANDS[G.proj.band].bg;
        Circ(ctx, tr[i * 2], tr[i * 2 + 1], R * (0.35 + 0.5 * u)); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ImgC(_S.bub[G.proj.band], G.proj.x, G.proj.y, 1);
    }

    DrawCannon(ctx);
    DrawFx(ctx);
  }

  function DrawCannon(ctx) {
    const G = GameState, k = _k, t = G.time;
    Img(_S.base, CANNON_X - 70, CANNON_Y - 20);
    const a = ClampAim(G.aimAngle), rc = G.recoil * 6;
    const co = Math.cos(a), si = Math.sin(a);
    ctx.setTransform(co * k, si * k, -si * k, co * k, (CANNON_X - co * rc) * k, (CANNON_Y - si * rc) * k);
    Img(_S.barrel, 0, -13);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ImgC(_S.ring, CANNON_X, CANNON_Y, 1);
    if (G.status === 'playing' || G.status === 'demo') {
      const st = G.swapT >= 0 ? Math.min(1, (t - G.swapT) / 0.22) : 1;
      if (st < 1) {
        const e = st * st * (3 - 2 * st);
        ImgC(_S.small[G.nextBand], NEXT_X + (CANNON_X - NEXT_X) * e, NEXT_Y - 8 + (CANNON_Y - NEXT_Y + 8) * e - Math.sin(st * Math.PI) * 22, 0.78 + 0.22 * e);
      } else ImgC(_S.bub[G.nextBand], CANNON_X, CANNON_Y, 1 - G.recoil * 0.25);
    }
    Img(_S.cradle, NEXT_X - 26, NEXT_Y - 14);
    if (G.queue.length && (G.status === 'playing' || G.status === 'demo')) {
      const st = G.swapT >= 0 ? Math.min(1, (t - G.swapT) / 0.22) : 1;
      if (st < 1) {
        const e = st * st * (3 - 2 * st);
        ImgC(_S.small[G.queue[0].band], CANNON_X + (NEXT_X - CANNON_X) * e, CANNON_Y + (NEXT_Y - 8 - CANNON_Y) * e + Math.sin(st * Math.PI) * 16, 1 - 0.22 * e);
      } else ImgC(_S.small[G.queue[0].band], NEXT_X, NEXT_Y - 8 + Math.sin(t * 3) * 1.2, 1);
    }
    ctx.font = F_NEXT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = _dark ? 'rgba(254,243,199,0.75)' : 'rgba(69,26,3,0.6)';
    ctx.fillText(_GameText('game_next').toUpperCase(), NEXT_X, NEXT_Y - 34);
    ctx.strokeStyle = _dark ? 'rgba(254,243,199,0.6)' : 'rgba(69,26,3,0.45)'; ctx.lineWidth = 1.6;
    const sx = (NEXT_X + CANNON_X) / 2 - 4, sy = CANNON_Y + 14;
    ctx.beginPath(); ctx.arc(sx, sy, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 7 * Math.cos(Math.PI * 1.9) - 3, sy + 7 * Math.sin(Math.PI * 1.9) - 1); ctx.lineTo(sx + 7 * Math.cos(Math.PI * 1.9), sy + 7 * Math.sin(Math.PI * 1.9)); ctx.lineTo(sx + 7 * Math.cos(Math.PI * 1.9) + 0.5, sy + 7 * Math.sin(Math.PI * 1.9) - 3.5); ctx.stroke();

    const px = CANNON_X + 82, py = CANNON_Y + 6;
    RR(ctx, px - 30, py - 15, 60, 30, 9);
    ctx.fillStyle = _dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = _dark ? 'rgba(148,163,184,0.35)' : 'rgba(120,70,30,0.35)'; ctx.stroke();
    if (G.mode === 'endless') {
      const left = DESCEND_EVERY - (G.shots % DESCEND_EVERY);
      ctx.fillStyle = left <= 3 ? '#ef4444' : (_dark ? '#e2e8f0' : '#1e293b');
      ctx.font = F_NUM; ctx.fillText(String(left), px + 7, py + 1);
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - 14, py - 6); ctx.lineTo(px - 14, py + 5); ctx.moveTo(px - 18, py + 1); ctx.lineTo(px - 14, py + 6); ctx.lineTo(px - 10, py + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 21, py - 8); ctx.lineTo(px - 7, py - 8); ctx.stroke();
    } else {
      let n = 0;
      for (const row of G.grid) for (const b of row) if (b) n++;
      ImgC(_S.small[2], px - 13, py, 0.42);
      ctx.fillStyle = _dark ? '#e2e8f0' : '#1e293b';
      ctx.font = F_NUM; ctx.fillText(String(n), px + 8, py + 1);
    }
  }

  function TraceAim() {
    const G = GameState;
    if (G.aimCache && G.aimA === G.aimAngle && G.aimV === G.ver) return G.aimCache;
    G.aimA = G.aimAngle; G.aimV = G.ver;
    const a = ClampAim(G.aimAngle);
    let x = CANNON_X, y = CANNON_Y, vx = Math.cos(a), vy = Math.sin(a);
    const pts = [x, y];
    let hit = false;
    for (let i = 0; i < 400 && !hit; i++) {
      x += vx * 4; y += vy * 4;
      if (x - R < 0) { x = R; vx = Math.abs(vx); pts.push(x, y); }
      if (x + R > CW) { x = CW - R; vx = -Math.abs(vx); pts.push(x, y); }
      if (y - R <= OY) { y = OY + R; hit = true; break; }
      for (let r = 0; r < ROWS && !hit; r++) {
        const row = G.grid[r]; if (!row) continue;
        const py = OY + R + r * ROW_H, x0 = R + (r % 2 === 1 ? R : 0);
        for (let c = 0; c < GetColsForRow(r); c++) {
          if (!row[c]) continue;
          const px = x0 + c * DIAM;
          if ((x - px) ** 2 + (y - py) ** 2 < (DIAM - 3) ** 2) { hit = true; break; }
        }
      }
    }
    pts.push(x, y);
    let ghost = null;
    if (hit) { const s = SnapToGrid(x, y); ghost = GetBubblePos(Math.max(0, Math.min(s.row, ROWS + 2)), s.col); }
    G.aimCache = { pts, ghost };
    return G.aimCache;
  }

  function DrawAim(ctx) {
    const G = GameState;
    if (G.proj) return;
    const { pts, ghost } = TraceAim();
    let dist = 0;
    const gap = 14, phase = (G.time * 40) % gap;
    const col = G.status === 'demo' ? (_dark ? '#94a3b8' : '#64748b') : BANDS[G.nextBand].bg;
    ctx.fillStyle = col;
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3];
      const L = Math.hypot(x1 - x0, y1 - y0);
      let s = (gap - ((dist - phase) % gap + gap) % gap) % gap;
      for (; s < L; s += gap) {
        const d = dist + s;
        if (d < 30) continue;
        const u = s / L, f = Math.max(0.15, 1 - d / 700);
        ctx.globalAlpha = 0.85 * f;
        Circ(ctx, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 2.6 * f + 1);
        ctx.fill();
      }
      dist += L;
    }
    ctx.globalAlpha = 1;
    if (ghost && G.status === 'playing') {
      const pulse = 0.5 + 0.2 * Math.sin(G.time * 6);
      ctx.globalAlpha = pulse * 0.45;
      ImgC(_S.bub[G.nextBand], ghost.x, ghost.y, 0.92);
      ctx.globalAlpha = pulse + 0.2;
      Circ(ctx, ghost.x, ghost.y, R - 1.5);
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -G.time * 10;
      ctx.lineWidth = 2; ctx.strokeStyle = _dark ? '#ffffff' : Dk(BANDS[G.nextBand].bg, 0.3); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  function DrawFx(ctx) {
    const G = GameState, k = _k;
    for (const p of _P) {
      if (!p.on) continue;
      const u = p.t / p.life, a = u > 0.6 ? (1 - u) / 0.4 : 1;
      ctx.globalAlpha = a;
      if (p.kind === 0) {
        ctx.fillStyle = p.col; Circ(ctx, p.x, p.y, p.s * (1 - u * 0.4)); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; Circ(ctx, p.x - p.s * 0.3, p.y - p.s * 0.3, p.s * 0.35); ctx.fill();
      } else if (p.kind === 1) {
        ctx.fillStyle = p.col; Circ(ctx, p.x, p.y, p.s); ctx.fill();
      } else if (p.kind === 2) {
        ctx.globalAlpha = a * 0.4; ctx.fillStyle = p.col; Circ(ctx, p.x, p.y, p.s * (0.6 + u)); ctx.fill();
      } else {
        ctx.globalAlpha = (1 - u) * 0.8;
        Circ(ctx, p.x, p.y, p.s * (0.5 + u * 0.7)); ctx.lineWidth = 3 * (1 - u) + 0.5; ctx.strokeStyle = p.col; ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of G.texts) {
      const age = G.time - tx.at;
      if (age < 0 || age > 0.9) continue;
      const u = age / 0.9, sc = age < 0.12 ? 0.6 + age / 0.12 * 0.5 : 1.1 - Math.min(0.1, (age - 0.12));
      ctx.globalAlpha = u > 0.65 ? (1 - u) / 0.35 : 1;
      ctx.font = `900 ${Math.round(17 * sc)}px ${FONT}`;
      ctx.lineWidth = 4; ctx.strokeStyle = _dark ? '#0b1020' : '#ffffff';
      ctx.strokeText(tx.txt, tx.x, tx.y - u * 26);
      ctx.fillStyle = tx.col; ctx.fillText(tx.txt, tx.x, tx.y - u * 26);
    }
    ctx.globalAlpha = 1;
  }

  function UpdateHUD() {
    if (!GameState) return;
    const e = id => document.getElementById(id);
    const score   = e('gf-sh-score');
    const cleared = e('gf-sh-cleared');
    const shots   = e('gf-sh-shots');
    const nxt     = e('gf-sh-next');
    const nxtLbl  = e('gf-sh-next-lbl');
    if (score && score.textContent !== String(GameState.score)) {
      score.textContent = GameState.score;
      score.classList.remove('gf-sh-bump'); void score.offsetWidth; score.classList.add('gf-sh-bump');
    }
    if (cleared) cleared.textContent = GameState.cleared;
    if (shots)   shots.textContent   = GameState.shots;
    const q = GameState.queue[0];
    if (nxt && q && _I) nxt.style.backgroundImage = `url(${_I[q.band]})`;
    if (nxtLbl && q) nxtLbl.textContent = q.subject;
    const best = e('gf-sh-best');
    if (best) best.textContent = GetBest(GameState.mode === 'endless' ? 'endless' : 'clear');
    const pb = e('gf-sh-pause');
    if (pb) pb.disabled = GameState.status !== 'playing';
  }

  function GetBest(mode) { try { return parseInt(localStorage.getItem(`gf-sh-best-${mode}`) || '0') || 0; } catch (_) { return 0; } }
  function SetBest(mode, v) { try { localStorage.setItem(`gf-sh-best-${mode}`, v); } catch (_) {} }

  function ShowResult() {
    const ov = id('gf-sh-result');
    if (!ov) return;
    _screen = 'result';
    const win = GameState.status === 'win';
    const prev = GetBest(GameState.mode);
    const isNew = GameState.score > prev;
    if (isNew) SetBest(GameState.mode, GameState.score);
    ov.innerHTML = `
      <div class="gf-sh-card">
        <div class="gf-sh-res-ic ${win ? 'gf-sh-ic-win' : 'gf-sh-ic-lose'}">${BubbleStack(win)}</div>
        <div class="gf-sh-res-title ${win ? 'gf-sh-good' : 'gf-sh-bad'}">${win ? _GameText('game_shoot_board_cleared') : _GameText('game_shoot_overflow')}</div>
        <div class="gf-sh-res-score">${GameState.score}<span>${_GameText('game_score')}</span></div>
        <div class="gf-sh-stats">
          <div><span>${_GameText('game_shoot_cleared')}</span><strong>${GameState.cleared}</strong></div>
          <div><span>${_GameText('game_shoot_shots')}</span><strong>${GameState.shots}</strong></div>
          <div><span>${_GameText('game_best')}</span><strong>${Math.max(prev, GameState.score)}</strong></div>
        </div>
        ${isNew ? `<div class="gf-sh-badge">${_GameText('game_new_best')}</div>` : ''}
        <div class="gf-sh-btns">
          <button class="gf-sh-btn" id="gf-sh-again">${_GameText('game_play_again')}</button>
          <button class="gf-sh-btn gf-sh-btn2" id="gf-sh-menu">${_GameText('game_shoot_menu')}</button>
        </div>
      </div>`;
    ov.dataset.kind = 'result';
    ov.style.display = 'flex';
    id('gf-sh-again')?.addEventListener('click', () => StartGame(GameState.mode, _grades));
    id('gf-sh-menu')?.addEventListener('click', ShowStart);
    UpdateHUD();
  }

  function BubbleStack(win) {
    const b = win ? [3, 4, 5] : [0, 1, 0];
    return b.map((x, i) => `<i style="background-image:url(${_I[x]});animation-delay:${i * 0.1}s"></i>`).join('');
  }

  function ShowStart() {
    const ov = id('gf-sh-result');
    if (!ov) return;
    _screen = 'start';
    GameState = InitGameState('demo');
    const cB = GetBest('clear'), eB = GetBest('endless');
    ov.innerHTML = `
      <div class="gf-sh-card gf-sh-card-wide">
        <div class="gf-sh-res-ic gf-sh-ic-win">${[4, 3, 5].map((x, i) => `<i style="background-image:url(${_I[x]});animation-delay:${i * 0.12}s"></i>`).join('')}</div>
        <div class="gf-sh-res-title">GradeShooter</div>
        <div class="gf-sh-sub">${_GameText('game_shoot_subtitle')}</div>
        <div class="gf-sh-modes">
          <button class="gf-sh-mode-card" data-mode="clear">
            <span class="gf-sh-mode-art gf-sh-art-clear"><i></i><i></i><i></i></span>
            <b style="color:#f97316">${_GameText('game_shoot_clear_mode')}</b>
            <span>${_GameText('game_shoot_clear_desc')}</span>
            <em>${_GameText('game_best')}: ${cB} pts</em>
          </button>
          <button class="gf-sh-mode-card" data-mode="endless">
            <span class="gf-sh-mode-art gf-sh-art-endless"><i></i><i></i><i></i></span>
            <b style="color:#3b82f6">${_GameText('game_shoot_endless_mode')}</b>
            <span>${_GameText('game_shoot_endless_desc').replace('{n}', DESCEND_EVERY)}</span>
            <em>${_GameText('game_best')}: ${eB} pts</em>
          </button>
        </div>
        <div class="gf-sh-ctl">
          <span><kbd>${_GameText('game_shoot_mouse')}</kbd> ${_GameText('game_shoot_aim')}</span>
          <span><kbd>${_GameText('game_shoot_click')}</kbd> ${_GameText('game_shoot_shoot')}</span>
          <span><kbd>${_GameText('game_shoot_swap_key')}</kbd> ${_GameText('game_shoot_swap')}</span>
          <span><kbd>P</kbd> ${_GameText('game_pause')}</span>
        </div>
      </div>`;
    ov.querySelectorAll('.gf-sh-mode-card i').forEach((el, i) => { el.style.backgroundImage = `url(${_I[[0, 3, 4, 1, 5, 2][i]]})`; });
    ov.dataset.kind = 'start';
    ov.style.display = 'flex';
    ov.querySelectorAll('.gf-sh-mode-card').forEach(btn => btn.addEventListener('click', () => StartGame(btn.dataset.mode, _grades)));
    SetModePill();
    UpdateHUD();
  }

  function TogglePause() {
    if (!GameState || GameState.status !== 'playing') return;
    const ov = id('gf-sh-result');
    if (!ov) return;
    if (_screen === 'paused') { _screen = 'none'; ov.style.display = 'none'; ov.innerHTML = ''; _host?.classList.remove('gf-sh-paused'); return; }
    if (_screen !== 'none') return;
    _screen = 'paused';
    ov.innerHTML = `
      <div class="gf-sh-card">
        <div class="gf-sh-res-title">${_GameText('game_paused')}</div>
        <div class="gf-sh-res-score">${GameState.score}<span>${_GameText('game_score')}</span></div>
        <div class="gf-sh-btns">
          <button class="gf-sh-btn" id="gf-sh-resume">${_GameText('game_resume')}</button>
          <button class="gf-sh-btn gf-sh-btn2" id="gf-sh-restart">${_GameText('game_new_game')}</button>
        </div>
      </div>`;
    ov.dataset.kind = 'paused';
    ov.style.display = 'flex';
    _host?.classList.add('gf-sh-paused');
    id('gf-sh-resume')?.addEventListener('click', TogglePause);
    id('gf-sh-restart')?.addEventListener('click', () => StartGame(GameState.mode, _grades));
  }

  function SetModePill() {
    const el = id('gf-sh-mode'); if (!el) return;
    if (!GameState || GameState.mode === 'demo') { el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = GameState.mode === 'clear' ? _GameText('game_shoot_clear') : _GameText('game_shoot_endless');
    el.className = GameState.mode === 'clear' ? 'gf-sh-pill-clear' : 'gf-sh-pill-endless';
  }

  function UpdateAim(mx, my) {
    if (!GameState || GameState.status !== 'playing' || _screen !== 'none') return;
    const dx = mx - GameState.cannonX, dy = my - GameState.cannonY;
    let a = Math.atan2(dy, dx);
    if (Math.sin(a) > -0.08) a = Math.cos(a) < 0 ? -(Math.PI - 0.12) : -0.12;
    GameState.aimAngle = a;
  }

  function CanvasCoords(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      mx: (clientX - rect.left) * (GameState.canW / rect.width),
      my: (clientY - rect.top)  * (GameState.canH / rect.height),
    };
  }

  function id(s) { return document.getElementById(s); }

  function InjectCSS() {
    if (id('gf-sh-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-sh-css';
    s.textContent = `
#gf-shooter{--sh-bg:#f4f8fd;--sh-surf:#ffffff;--sh-surf2:#f1f5fa;--sh-brd:#e1e8f0;--sh-txt:#0f172a;--sh-txt2:#475569;--sh-txt3:#94a3b8;--sh-acc:#f97316;--sh-ovr:rgba(240,246,252,.78);
  position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);font-family:"IBM Plex Mono",monospace;}
#gf-shooter[data-theme="dark"]{--sh-bg:#0b1020;--sh-surf:#121726;--sh-surf2:#0c1120;--sh-brd:rgba(255,255,255,.08);--sh-txt:#e8edf5;--sh-txt2:#a3afc2;--sh-txt3:#5f6b80;--sh-ovr:rgba(6,9,20,.78)}
#gf-shooter *{box-sizing:border-box;}
#gf-sh-modal{display:flex;flex-direction:column;background:var(--sh-surf);border:1px solid var(--sh-brd);border-radius:16px;box-shadow:0 10px 50px rgba(0,0,0,.45);overflow:hidden;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);}
#gf-sh-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-bottom:1px solid var(--sh-brd);background:var(--sh-surf2);user-select:none;}
.gf-sh-hl,.gf-sh-hr{display:flex;align-items:center;gap:8px;}
#gf-sh-logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(160deg,#67e8f9,#0891b2);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -2px 0 rgba(0,0,0,.2),0 2px 6px rgba(8,145,178,.35);}
#gf-sh-logo i{display:block;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 18%,#f97316 45%,#c2410c 100%);box-shadow:0 0 0 1.5px #431407;}
#gf-sh-title{font-size:14px;font-weight:800;color:var(--sh-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-sh-subt{font-size:9px;color:var(--sh-txt3);}
#gf-sh-mode{padding:3px 9px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.05em;}
.gf-sh-pill-clear{background:rgba(249,115,22,.14);color:#f97316;}
.gf-sh-pill-endless{background:rgba(59,130,246,.14);color:#3b82f6;}
.gf-sh-ib{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--sh-brd);border-radius:8px;background:transparent;color:var(--sh-txt2);cursor:pointer;font-size:13px;padding:0;transition:border-color .12s,color .12s,background .12s;}
.gf-sh-ib:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};background:rgba(34,211,238,.1);}
.gf-sh-ib:disabled{opacity:.35;cursor:default;}
#gf-sh-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-sh-body{display:flex;gap:12px;padding:12px;background:var(--sh-bg);min-height:0;}
#gf-sh-stage{position:relative;flex-shrink:0;line-height:0;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,.18),0 0 0 1px var(--sh-brd);}
#gf-sh-view{line-height:0;}
#gf-sh-canvas{display:block;cursor:crosshair;touch-action:none;user-select:none;}
#gf-sh-result{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:14px;line-height:1.3;background:var(--sh-ovr);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:gf-sh-fade .22s ease-out;}
#gf-sh-result[data-kind="start"]{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}
#gf-sh-result[data-kind="result"]{background:linear-gradient(180deg,transparent,var(--sh-ovr) 45%);backdrop-filter:none;-webkit-backdrop-filter:none;}
@keyframes gf-sh-fade{from{opacity:0}to{opacity:1}}
.gf-sh-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 20px;background:var(--sh-surf);border:1px solid var(--sh-brd);border-radius:16px;box-shadow:0 14px 40px rgba(15,23,42,.28);text-align:center;max-width:100%;animation:gf-sh-pop .34s cubic-bezier(.2,1.4,.4,1);}
@keyframes gf-sh-pop{from{transform:scale(.85) translateY(10px);opacity:0}to{transform:none;opacity:1}}
.gf-sh-res-ic{display:flex;gap:2px;height:42px;align-items:flex-end;}
.gf-sh-res-ic i{display:block;width:36px;height:36px;background:center/contain no-repeat;animation:gf-sh-bob 1.4s ease-in-out infinite;}
.gf-sh-ic-lose i{animation:gf-sh-drop .7s cubic-bezier(.3,1.6,.5,1) both;filter:grayscale(.4);}
@keyframes gf-sh-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes gf-sh-drop{from{transform:translateY(-30px);opacity:0}to{transform:none;opacity:1}}
.gf-sh-res-title{font-size:21px;font-weight:800;letter-spacing:-.5px;color:var(--sh-txt);line-height:1.1;}
.gf-sh-good{color:#22c55e;} .gf-sh-bad{color:#ef4444;}
.gf-sh-sub{font-size:10px;color:var(--sh-txt2);}
.gf-sh-res-score{display:flex;flex-direction:column;align-items:center;font-size:30px;font-weight:900;color:#f97316;line-height:1;}
.gf-sh-res-score span{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sh-txt3);margin-top:3px;}
.gf-sh-stats{display:flex;gap:6px;}
.gf-sh-stats>div{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:68px;padding:6px 8px;border-radius:10px;background:var(--sh-surf2);border:1px solid var(--sh-brd);}
.gf-sh-stats span{font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--sh-txt3);}
.gf-sh-stats strong{font-size:15px;font-weight:800;color:var(--sh-txt);}
.gf-sh-badge{padding:3px 10px;border-radius:999px;background:linear-gradient(90deg,#fde047,#f59e0b);color:#422006;font-size:10px;font-weight:800;box-shadow:0 2px 8px rgba(245,158,11,.4);}
.gf-sh-btns{display:flex;gap:8px;margin-top:2px;}
.gf-sh-btn{padding:9px 20px;border:none;border-radius:10px;background:linear-gradient(180deg,#fb923c,#ea580c);color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2),0 4px 14px rgba(234,88,12,.35);transition:transform .12s,filter .12s;}
.gf-sh-btn:hover{transform:translateY(-1px);filter:brightness(1.06);}
.gf-sh-btn:active{transform:translateY(1px);}
.gf-sh-btn2{background:var(--sh-surf2);color:var(--sh-txt2);border:1px solid var(--sh-brd);box-shadow:inset 0 -3px 0 rgba(0,0,0,.06);}
.gf-sh-modes{display:flex;flex-direction:column;gap:8px;width:300px;max-width:100%;}
.gf-sh-mode-card{display:grid;grid-template-columns:52px 1fr;grid-template-rows:auto auto auto;column-gap:10px;align-items:center;text-align:left;padding:10px 12px;border:1.5px solid var(--sh-brd);border-radius:12px;background:var(--sh-surf2);color:var(--sh-txt);font-family:inherit;cursor:pointer;transition:transform .14s,border-color .14s,box-shadow .14s;}
.gf-sh-mode-card:hover{transform:translateY(-2px);border-color:var(--sh-acc);box-shadow:0 8px 20px rgba(249,115,22,.2);}
.gf-sh-mode-card b{font-size:13px;font-weight:800;}
.gf-sh-mode-card span:not(.gf-sh-mode-art){font-size:10px;color:var(--sh-txt2);}
.gf-sh-mode-card em{font-style:normal;font-size:9px;color:var(--sh-txt3);}
.gf-sh-mode-art{grid-row:1/4;position:relative;width:52px;height:44px;}
.gf-sh-mode-art i{position:absolute;width:24px;height:24px;background:center/contain no-repeat;}
.gf-sh-mode-art i:nth-child(1){left:0;top:0;} .gf-sh-mode-art i:nth-child(2){left:22px;top:0;} .gf-sh-mode-art i:nth-child(3){left:11px;top:19px;}
.gf-sh-mode-card:hover .gf-sh-mode-art i{animation:gf-sh-bob .8s ease-in-out infinite;}
.gf-sh-mode-card:hover .gf-sh-mode-art i:nth-child(2){animation-delay:.1s;}
.gf-sh-ctl{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;font-size:9.5px;color:var(--sh-txt2);max-width:320px;}
.gf-sh-ctl kbd,.gf-sh-keys kbd{display:inline-block;padding:1px 5px;margin-right:2px;border:1px solid var(--sh-brd);border-bottom-width:2px;border-radius:5px;background:var(--sh-surf2);font-family:inherit;font-size:9px;font-weight:700;color:var(--sh-txt);}
#gf-sh-side{display:flex;flex-direction:column;gap:8px;width:132px;flex-shrink:0;line-height:1.3;user-select:none;}
.gf-sh-box{padding:8px 10px;border-radius:12px;background:var(--sh-surf);border:1px solid var(--sh-brd);box-shadow:0 1px 3px rgba(15,23,42,.06);}
.gf-sh-lbl{font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--sh-txt3);margin-bottom:2px;}
#gf-sh-score{font-size:24px;font-weight:900;color:var(--sh-acc);line-height:1.1;font-variant-numeric:tabular-nums;}
.gf-sh-bump{animation:gf-sh-bmp .35s ease-out;}
@keyframes gf-sh-bmp{0%{transform:scale(1.3);transform-origin:left center}100%{transform:none}}
.gf-sh-row{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--sh-txt2);}
.gf-sh-row b{color:var(--sh-txt);font-size:12px;font-weight:800;}
#gf-sh-next{width:44px;height:44px;margin:4px auto 2px;background:center/contain no-repeat;cursor:pointer;transition:transform .15s;}
#gf-sh-next:hover{transform:scale(1.08) rotate(-8deg);}
#gf-sh-next-lbl{font-size:9px;color:var(--sh-txt2);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gf-sh-band{display:flex;align-items:center;gap:6px;font-size:9.5px;color:var(--sh-txt2);margin-bottom:2px;}
.gf-sh-band i{width:14px;height:14px;background:center/contain no-repeat;flex-shrink:0;}
.gf-sh-keys{font-size:9px;line-height:1.9;color:var(--sh-txt3);}
#gf-shooter.gf-sh-paused #gf-sh-view{filter:blur(6px);}
@media (max-width:700px){#gf-sh-side{display:none}}
    `;
    document.head.appendChild(s);
  }

  function SyncTheme(host) {
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(host);
    else {
      const isDark = IsDark();
      host.dataset.theme = isDark ? 'dark' : 'light';
      host.style.filter  = isDark ? 'invert(1) hue-rotate(180deg)' : '';
    }
    if (_cv && _view) {
      let n = 0;
      for (let e = _cv; e; e = e.parentElement) if (e !== _view && getComputedStyle(e).filter.includes('invert')) n++;
      _view.style.filter = n % 2 ? 'invert(1) hue-rotate(180deg)' : '';
    }
    const d = host.dataset.theme === 'dark';
    if (d !== _dark || !_S) { _dark = d; if (_cv) BuildSprites(); }
  }

  function Fit() {
    if (!_cv) return;
    const side = innerWidth > 700 ? 160 : 0;
    const s = Math.max(0.5, Math.min(1.15, (innerWidth - 40 - side) / CW, (innerHeight - 90) / CH));
    const dpr = Math.min(3, W.devicePixelRatio || 1);
    const w = Math.round(CW * s), h = Math.round(CH * s);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    _cv.width = Math.round(w * dpr); _cv.height = Math.round(h * dpr);
    _k = _cv.width / CW;
    _ctx = _cv.getContext('2d');
    _dangerG = null;
    BuildSprites();
  }

  function BuildHost() {
    InjectCSS();
    if (!_I) BuildIcons();
    const host = document.createElement('div');
    host.id = 'gf-shooter';
    host.innerHTML = `
      <div id="gf-sh-modal">
        <div id="gf-sh-hdr">
          <div class="gf-sh-hl">
            <div id="gf-sh-logo"><i></i></div>
            <div><div id="gf-sh-title">GradeShooter</div><div id="gf-sh-subt">${_GameText('game_shoot_subtitle')}</div></div>
            <span id="gf-sh-mode" style="display:none"></span>
          </div>
          <div class="gf-sh-hr">
            <button id="gf-sh-pause" class="gf-sh-ib" title="${_GameText('game_pause_p')}"><svg viewBox="0 0 12 12" width="11" height="11"><rect x="2" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/></svg></button>
            <button id="gf-sh-new" class="gf-sh-ib" title="${_GameText('game_new_game_r')}">&#8634;</button>
            <button id="gf-sh-close" class="gf-sh-ib" title="${_GameText('game_close_esc')}">&#10005;</button>
          </div>
        </div>
        <div id="gf-sh-body">
          <div id="gf-sh-stage">
            <div id="gf-sh-view"><canvas id="gf-sh-canvas"></canvas></div>
            <div id="gf-sh-result"></div>
          </div>
          <div id="gf-sh-side">
            <div class="gf-sh-box">
              <div class="gf-sh-lbl">${_GameText('game_score')}</div>
              <div id="gf-sh-score">0</div>
              <div class="gf-sh-row"><span>${_GameText('game_best')}</span><b id="gf-sh-best">0</b></div>
            </div>
            <div class="gf-sh-box">
              <div class="gf-sh-row"><span>${_GameText('game_shoot_cleared')}</span><b id="gf-sh-cleared">0</b></div>
              <div class="gf-sh-row"><span>${_GameText('game_shoot_shots')}</span><b id="gf-sh-shots">0</b></div>
            </div>
            <div class="gf-sh-box">
              <div class="gf-sh-lbl" style="text-align:center">${_GameText('game_next')}</div>
              <div id="gf-sh-next" title="${_GameText('game_shoot_swap')}"></div>
              <div id="gf-sh-next-lbl"></div>
            </div>
            <div class="gf-sh-box">
              <div class="gf-sh-lbl">${_GameText('game_shoot_bands')}</div>
              ${BANDS.map((b, i) => `<div class="gf-sh-band"><i style="background-image:url(${_I[i]})"></i>${b.range}</div>`).join('')}
            </div>
            <div class="gf-sh-keys">
              <kbd>${_GameText('game_shoot_mouse')}</kbd> ${_GameText('game_shoot_aim')}<br>
              <kbd>${_GameText('game_shoot_click')}</kbd> ${_GameText('game_shoot_shoot')}<br>
              <kbd>${_GameText('game_shoot_swap_key')}</kbd> ${_GameText('game_shoot_swap')}<br>
              <kbd>${window.GfKeys ? GfKeys.label('arcade') : 'F8'}</kbd> ${_GameText('game_shoot_hide')}
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);
    _host = host;
    _cv = id('gf-sh-canvas');
    _cv.style.setProperty('filter', 'none', 'important');
    _view = id('gf-sh-view');
    SyncTheme(host);
    Fit();

    const tobs = new MutationObserver(() => SyncTheme(host));
    tobs.observe(document.documentElement, { attributes:true, attributeFilter:['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    host._tobs = tobs;

    const cv = _cv;
    cv.addEventListener('pointermove', e => {
      const { mx, my } = CanvasCoords(cv, e.clientX, e.clientY);
      UpdateAim(mx, my);
    });
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') { const { mx, my } = CanvasCoords(cv, e.clientX, e.clientY); UpdateAim(mx, my); }
    });
    cv.addEventListener('pointerup', e => {
      const { mx, my } = CanvasCoords(cv, e.clientX, e.clientY);
      if (e.button === 2) { Swap(); return; }
      if (e.button) return;
      if (Math.hypot(mx - NEXT_X, my - NEXT_Y + 6) < 26) { Swap(); return; }
      UpdateAim(mx, my);
      Shoot();
    });
    cv.addEventListener('contextmenu', e => e.preventDefault());

    id('gf-sh-next')?.addEventListener('click', Swap);
    id('gf-sh-pause')?.addEventListener('click', TogglePause);
    id('gf-sh-new')?.addEventListener('click', () => { if (GameState && GameState.mode !== 'demo') StartGame(GameState.mode, _grades); else ShowStart(); });
    id('gf-sh-close')?.addEventListener('click', CloseGradeShooter);
    host.addEventListener('click', e => { if (e.target.id === 'gf-shooter') BossKeyShooter(); });
    document.addEventListener('keydown', _Esc, true);
    W.addEventListener('resize', OnResize);
    document.addEventListener('visibilitychange', OnVisibility);
  }

  function OnResize() { if (_cv) Fit(); }
  function OnVisibility() { if (document.hidden && GameState?.status === 'playing' && _screen === 'none') TogglePause(); }

  function StartGame(mode, grades) {
    _grades = grades || _grades || [];
    if (!id('gf-shooter')) BuildHost();
    for (const p of _P) p.on = 0;
    _mode = mode;
    GameState = InitGameState(mode);
    GameState.nextBand = SmartBand(GameState.nextBand);
    _screen = 'none';
    _acc = 0;
    const ov = id('gf-sh-result');
    if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; }
    _host?.classList.remove('gf-sh-paused');
    SetModePill();
    UpdateHUD();
    StartLoop();
  }

  function BossKeyShooter() {
    const host = id('gf-shooter');
    if (!host) return false;
    if (host.dataset.bossHidden === '1') {
      host.style.display = 'flex';
      delete host.dataset.bossHidden;
      if (GameState?._bossHidden) { GameState._bossHidden = false; StartLoop(); }
      return true;
    }
    if (host.style.display !== 'none') {
      if (GameState) { StopLoop(); GameState._bossHidden = true; }
      host.style.display = 'none';
      host.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  function _Esc(e) {
    const host = id('gf-shooter');
    if (!host || host.style.display === 'none') return;
    const k = e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) {
      e.preventDefault(); e.stopPropagation();
      if (!GameState || GameState.status !== 'playing' || _screen !== 'none') return;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const a = ClampAim(GameState.aimAngle) + (k === 'ArrowLeft' ? -0.06 : 0.06);
        GameState.aimAngle = Math.max(-Math.PI + 0.12, Math.min(-0.12, a));
      }
      if (k === 'ArrowUp') Shoot();
      if (k === 'ArrowDown') Swap();
      return;
    }
    if (k === 'Escape') { e.preventDefault(); CloseGradeShooter(); return; }
    if (k === 'p' || k === 'P') { e.preventDefault(); TogglePause(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); if (GameState && GameState.mode !== 'demo') StartGame(GameState.mode, _grades); return; }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (_screen === 'paused') { TogglePause(); return; }
      if (_screen === 'result') { StartGame(GameState.mode, _grades); return; }
      if (_screen === 'start') { StartGame(_mode === 'endless' ? 'endless' : 'clear', _grades); return; }
      if (k === ' ') Swap(); else Shoot();
    }
  }

  function OpenGradeShooter(grades) {
    _grades = grades || [];
    CloseGradeShooter();
    BuildHost();
    ShowStart();
    StartLoop();
  }

  function CloseGradeShooter() {
    StopLoop();
    document.removeEventListener('keydown', _Esc, true);
    W.removeEventListener('resize', OnResize);
    document.removeEventListener('visibilitychange', OnVisibility);
    const host = id('gf-shooter');
    if (host) { host._tobs?.disconnect(); host.remove(); }
    _host = null; _cv = null; _ctx = null; _view = null; _S = null; _dangerG = null;
  }

  W.OpenGradeShooter  = OpenGradeShooter;
  W.CloseGradeShooter = CloseGradeShooter;
  W.BossKeyShooter    = BossKeyShooter;

})(window);
