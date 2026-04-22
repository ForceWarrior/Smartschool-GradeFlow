;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const BANDS = [
    { id:0, range:'0–9',   bg:'#ef4444', fg:'#fff',    border:'#b91c1c', label:'FAIL'  },
    { id:1, range:'10–11', bg:'#f97316', fg:'#fff',    border:'#c2410c', label:'PASS'  },
    { id:2, range:'12–13', bg:'#eab308', fg:'#1a1a1a', border:'#a16207', label:'OK'    },
    { id:3, range:'14–15', bg:'#22c55e', fg:'#fff',    border:'#15803d', label:'GOOD'  },
    { id:4, range:'16–17', bg:'#3b82f6', fg:'#fff',    border:'#1d4ed8', label:'GREAT' },
    { id:5, range:'18–20', bg:'#f59e0b', fg:'#1a1a1a', border:'#d97706', label:'PERF'  },
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

  /* CONSTANTS */
  const COLS        = 11;
  const ROWS        = 12;
  const R           = 20;
  const DIAM        = R * 2;
  const ROW_H       = Math.round(R * Math.sqrt(3));
  const PROJ_SPD    = 10;
  const MATCH_MIN   = 3;
  const CEIL_ROWS   = 7;
  const DESCEND_EVERY = 12;

  function CanvasWidth()  { return R + COLS * DIAM + R; }
  function CanvasHeight()  { return ROWS * ROW_H + R * 3 + 52; }  // +52 for cannon area

  function GetColsForRow(r) { return r % 2 === 1 ? COLS - 1 : COLS; }

  function GetBubblePos(row, col) {
    const indent = row % 2 === 1 ? R : 0;
    return { x: R + indent + col * DIAM, y: R + row * ROW_H };
  }

  function SnapToGrid(px, py) {
    let bRow = 0, bCol = 0, bD = Infinity;
    for (let r = 0; r < ROWS + 2; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (GameState.grid[r]?.[c]) continue;           // skip occupied cells
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

  /* GAME STATE */
  let GameState   = null;
  let _raf = null;
  let _grades = [];

  function MakeGrid() {
    return Array.from({ length: ROWS + 4 }, () => new Array(COLS).fill(null));
  }

  /* Collect the set of distinct bands actually present in grades */
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

  function FillGrid() {
    InitGradeBandPool();
    const g = MakeGrid();
    for (let r = 0; r < CEIL_ROWS; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        g[r][c] = { band: RandomBand() };
      }
    }
    return g;
  }

  function MakeQueue() {
    return Array.from({ length: 24 }, () => ({ band: RandomBand(), subject: RandomSubject() }));
  }

  function InitGameState(mode) {
    const q = MakeQueue();
    const cannonY = CanvasHeight() - 36;
    return {
      mode,
      grid: FillGrid(),
      proj: null,               // { x, y, vx, vy, band }
      nextBand:    q[0].band,
      nextSubject: q[0].subject,
      queue: q.slice(1),
      score: 0, shots: 0, cleared: 0,
      status: 'playing',        // 'playing'|'win'|'lose'
      _bossHidden: false,
      canW: CanvasWidth(), canH: CanvasHeight(),
      cannonX: CanvasWidth() / 2,
      cannonY,
      aimAngle: -Math.PI / 2,  // straight up
      falling: [],              // { x, y, vx, vy, band, alpha }
      flashCells: [],           // { row, col, t } for match flash
    };
  }

  /* BFS HELPERS */
  function FindMatchingCluster(grid, row, col) {
    const band = grid[row]?.[col]?.band;
    if (band == null) return [];
    const visited = new Set([`${row},${col}`]);
    const q = [{ row, col }];
    while (q.length) {
      const cur = q.shift();
      for (const nb of GetHexNeighbors(cur.row, cur.col)) {
        const k = `${nb.row},${nb.col}`;
        if (!visited.has(k) && grid[nb.row]?.[nb.col]?.band === band) {
          visited.add(k); q.push(nb);
        }
      }
    }
    return [...visited].map(k => k.split(',').map(Number)).map(([r,c]) => ({ row:r, col:c }));
  }

  function FindFloatingBubbles(grid) {
    const visited = new Set();
    const q = [];
    for (let c = 0; c < GetColsForRow(0); c++) {
      if (grid[0][c]) { visited.add(`0,${c}`); q.push({ row:0, col:c }); }
    }
    while (q.length) {
      const cur = q.shift();
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

  /* SHOOTING */
  function Shoot() {
    if (!GameState || GameState.proj || GameState.status !== 'playing') return;
    const a = GameState.aimAngle;
    const clampedA = (Math.sin(a) > -0.1)
      ? (Math.cos(a) < 0 ? -Math.PI + 0.12 : -0.12)
      : a;
    GameState.proj = {
      x: GameState.cannonX, y: GameState.cannonY,
      vx: Math.cos(clampedA) * PROJ_SPD,
      vy: Math.sin(clampedA) * PROJ_SPD,
      band: GameState.nextBand,
    };
    // advance queue
    const next = GameState.queue.shift();
    GameState.nextBand    = next.band;
    GameState.nextSubject = next.subject;
    if (GameState.queue.length < 6) GameState.queue.push(...MakeQueue().slice(0, 8));
    GameState.shots++;
    if (GameState.mode === 'endless' && GameState.shots % DESCEND_EVERY === 0) DescendCeiling();
    UpdateHUD();
  }

  function DescendCeiling() {
    GameState.grid.unshift(new Array(COLS).fill(null));
    for (let c = 0; c < GetColsForRow(0); c++) GameState.grid[0][c] = { band: RandomBand() };
    while (GameState.grid.length > ROWS + 4) GameState.grid.pop();
  }

  /* PROJECTILE STEP */
  function StepProjectile() {
    const p = GameState.proj;
    if (!p) return;
    p.x += p.vx; p.y += p.vy;

    // Wall bounces
    if (p.x - R < 0) { p.x = R; p.vx = Math.abs(p.vx); }
    if (p.x + R > GameState.canW) { p.x = GameState.canW - R; p.vx = -Math.abs(p.vx); }

    // Ceiling
    if (p.y - R <= 0) { p.y = R; Land(p.x, p.y, p.band); return; }

    if (p.y > GameState.canH + R * 4) { GameState.proj = null; return; }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (!GameState.grid[r]?.[c]) continue;
        const { x, y } = GetBubblePos(r, c);
        if ((p.x-x)**2 + (p.y-y)**2 < (DIAM - 3)**2) {
          Land(p.x, p.y, p.band); return;
        }
      }
    }
  }

  function Land(px, py, band) {
    GameState.proj = null;  // clear first band was passed in as parameter
    const { row, col } = SnapToGrid(px, py);
    const safeRow = Math.max(0, Math.min(row, ROWS + 2));
    const safeCol = Math.max(0, Math.min(col, GetColsForRow(safeRow) - 1));

    if (!GameState.grid[safeRow]) GameState.grid[safeRow] = new Array(COLS).fill(null);
    GameState.grid[safeRow][safeCol] = { band };

    // Match
    const cluster = FindMatchingCluster(GameState.grid, safeRow, safeCol);
    if (cluster.length >= MATCH_MIN) {
      GameState.score += cluster.length * 10;
      GameState.cleared += cluster.length;
      for (const { row: r, col: c } of cluster) {
        const { x, y } = GetBubblePos(r, c);
        const b = GameState.grid[r][c].band;
        GameState.falling.push({ x, y, vx:(Math.random()-.5)*5, vy:-3-Math.random()*3, band:b, alpha:1 });
        GameState.grid[r][c] = null;
      }
      GameState.flashCells.push(...cluster.map(({row:r,col:c}) => ({ row:r, col:c, t:1 })));

      // Floating
      const floating = FindFloatingBubbles(GameState.grid);
      for (const { row: r, col: c } of floating) {
        const { x, y } = GetBubblePos(r, c);
        GameState.falling.push({ x, y, vx:(Math.random()-.5)*4, vy:2+Math.random()*2, band:GameState.grid[r][c].band, alpha:1 });
        GameState.grid[r][c] = null;
        GameState.score += 5; GameState.cleared++;
      }

      // Win check
      if (GameState.mode === 'clear' && !GameState.grid.some(row => row.some(b => b))) {
        GameState.status = 'win'; StopLoop(); ShowResult(); return;
      }
    }

    // Lose check
    for (let c = 0; c < GetColsForRow(ROWS - 1); c++) {
      if (GameState.grid[ROWS - 1]?.[c]) { GameState.status = 'lose'; StopLoop(); ShowResult(); return; }
    }

    UpdateHUD();
  }

  /* RENDER LOOP */
  function StartLoop() {
    if (_raf) return;
    function Frame() { _raf = requestAnimationFrame(Frame); Draw(); }
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function IsDark() { return document.documentElement.getAttribute('data-gf-theme') === 'dark'; }

  function Draw() {
    const cv = document.getElementById('gf-sh-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dark = IsDark();

    // Step projectile
    if (GameState.proj) StepProjectile();

    // Step falling
    GameState.falling = GameState.falling.filter(fb => {
      fb.x += fb.vx; fb.y += fb.vy; fb.vy += 0.4; fb.alpha -= 0.024;
      return fb.alpha > 0 && fb.y < GameState.canH + 120;
    });

    // Step flash
    GameState.flashCells = GameState.flashCells.map(f => ({ ...f, t: f.t - 0.05 })).filter(f => f.t > 0);

    // Background
    ctx.fillStyle = dark ? '#0a0908' : '#f0eeec';
    ctx.fillRect(0, 0, GameState.canW, GameState.canH);

    // Aim guide
    DrawAim(ctx, dark);

    // Grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < GetColsForRow(r); c++) {
        if (!GameState.grid[r]?.[c]) continue;
        const { x, y } = GetBubblePos(r, c);
        const flash = GameState.flashCells.find(f => f.row === r && f.col === c);
        DrawBubble(ctx, x, y, GameState.grid[r][c].band, R, 1, flash?.t ?? 0);
      }
    }

    // Falling
    for (const fb of GameState.falling) DrawBubble(ctx, fb.x, fb.y, fb.band, R, fb.alpha, 0);

    // Projectile
    if (GameState.proj) DrawBubble(ctx, GameState.proj.x, GameState.proj.y, GameState.proj.band, R, 1, 0);

    // Danger line
    const dangerY = GetBubblePos(ROWS - 1, 0).y + R + 3;
    ctx.strokeStyle = 'rgba(239,68,68,0.35)';
    ctx.lineWidth = 1.5; ctx.setLineDash([6,5]);
    ctx.beginPath(); ctx.moveTo(0, dangerY); ctx.lineTo(GameState.canW, dangerY); ctx.stroke();
    ctx.setLineDash([]);

    // Cannon
    DrawCannon(ctx, GameState.cannonX, GameState.cannonY, GameState.aimAngle, dark);

    ctx.globalAlpha = 0.85;
    DrawBubble(ctx, GameState.cannonX, GameState.cannonY, GameState.nextBand, R * 0.8, 1, 0);
    ctx.globalAlpha = 1;
  }

  function DrawBubble(ctx, x, y, bandId, radius, alpha, flashT) {
    const band = BANDS[bandId] ?? BANDS[0];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.fillStyle = band.bg; ctx.fill();
    ctx.strokeStyle = band.border; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowBlur = 0;
    // Flash overlay
    if (flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashT * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
    }
    // Sheen
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.arc(x - radius*.28, y - radius*.28, radius*.42, 0, Math.PI*2); ctx.fill();
    // Text
    ctx.fillStyle = band.fg;
    ctx.font = `700 ${Math.round(radius*.7)}px "IBM Plex Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(band.range, x, y);
    ctx.restore();
  }

  function DrawCannon(ctx, cx, cy, angle, dark) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI/2);
    // Barrel
    ctx.fillStyle = dark ? '#6b7280' : '#374151';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-5, -30, 10, 30, 3);
    else ctx.rect(-5, -30, 10, 30);
    ctx.fill();
    // Base
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2);
    ctx.fillStyle = dark ? '#374151' : '#1f2937'; ctx.fill();
    ctx.strokeStyle = dark ? '#9ca3af' : '#4b5563'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function DrawAim(ctx, dark) {
    if (Math.sin(GameState.aimAngle) > -0.08) return;  // only show when pointing up
    let x = GameState.cannonX, y = GameState.cannonY;
    let vx = Math.cos(GameState.aimAngle), vy = Math.sin(GameState.aimAngle);
    const Step = 9, maxSteps = 700, maxBounces = 3;
    let bounces = 0;
    ctx.save();
    ctx.strokeStyle = dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)';
    ctx.lineWidth = 2; ctx.setLineDash([5,9]);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 0; i < maxSteps; i++) {
      x += vx*Step; y += vy*Step;
      if (x-R < 0) { x = R; vx = Math.abs(vx); bounces++; }
      if (x+R > GameState.canW) { x = GameState.canW-R; vx = -Math.abs(vx); bounces++; }
      if (y < 0 || bounces >= maxBounces) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  /* HUD */
  function UpdateHUD() {
    const e = id => document.getElementById(id);
    const score   = e('gf-sh-score');
    const cleared = e('gf-sh-cleared');
    const shots   = e('gf-sh-shots');
    const nxt     = e('gf-sh-next');
    const nxtLbl  = e('gf-sh-next-lbl');
    if (score)   score.textContent   = GameState.score;
    if (cleared) cleared.textContent = GameState.cleared;
    if (shots)   shots.textContent   = GameState.shots;
    if (nxt) {
      const b = BANDS[GameState.nextBand];
      nxt.style.background   = b.bg;
      nxt.style.borderColor  = b.border;
      nxt.style.color        = b.fg;
      nxt.textContent        = b.range;
    }
    if (nxtLbl) nxtLbl.textContent = GameState.nextSubject;
  }

  /* RESULT */
  function ShowResult() {
    const ov = document.getElementById('gf-sh-result');
    if (!ov) return;
    ov.querySelector('.gf-sh-res-title').textContent = GameState.status === 'win' ? `🏆 ${_GameText('game_shoot_board_cleared')}` : `💥 ${_GameText('game_shoot_overflow')}`;
    ov.querySelector('.gf-sh-res-score').textContent = `${_GameText('game_score')}: ${GameState.score}`;
    ov.querySelector('.gf-sh-res-detail').textContent = `${GameState.cleared} ${_GameText('game_shoot_bubbles_cleared')} · ${GameState.shots} ${_GameText('game_shoot_shots').toLowerCase()}`;
    const key = `gf-sh-best-${GameState.mode}`;
    const prev = parseInt(localStorage.getItem(key)||'0');
    if (GameState.score > prev) { localStorage.setItem(key, GameState.score); ov.querySelector('.gf-sh-res-best').textContent = `🎉 ${_GameText('game_new_best')}`; }
    else ov.querySelector('.gf-sh-res-best').textContent = `${_GameText('game_best')}: ${prev} pts`;
    ov.style.display = 'flex';
  }

  /* AIM INPUT */
  function UpdateAim(mx, my) {
    if (!GameState || GameState.status !== 'playing') return;
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

  /* OVERLAY BUILD */
  function id(s) { return document.getElementById(s); }

  function InjectCSS() {
    if (id('gf-sh-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-sh-css';
    s.textContent = `
#gf-shooter{--sh-bg:#f9f7f5;--sh-surf:#ffffff;--sh-surf2:#f3f1ef;--sh-brd:#e8e6e4;--sh-txt:#1c1917;--sh-txt2:#57534e;--sh-txt3:#a8a29e;--sh-acc:#f97316}
#gf-shooter[data-theme="dark"]{--sh-bg:#0c0a09;--sh-surf:#1c1917;--sh-surf2:#141210;--sh-brd:rgba(255,255,255,.08);--sh-txt:#e7e5e4;--sh-txt2:#a8a29e;--sh-txt3:#57534e}
.gf-sh-mode-card{transition:border-color .15s,background .15s}
.gf-sh-mode-card:hover{border-color:var(--sh-acc)!important;background:var(--sh-surf)!important}
    `;
    document.head.appendChild(s);
  }

  function SyncTheme(host) {
    const d = IsDark();
    host.dataset.theme = d ? 'dark' : 'light';
    host.style.filter  = d ? 'invert(1) hue-rotate(180deg)' : '';
  }

  /* MODE SELECT */
  function BuildModeSelect(grades) {
    if (id('gf-shooter')) return;
    InjectCSS();
    const cB = parseInt(localStorage.getItem('gf-sh-best-clear')||'0');
    const eB = parseInt(localStorage.getItem('gf-sh-best-endless')||'0');

    const host = document.createElement('div');
    host.id = 'gf-shooter';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);font-family:"IBM Plex Mono",monospace;';
    SyncTheme(host);
    host.innerHTML = `
      <div style="background:var(--sh-surf);border:1.5px solid var(--sh-brd);border-radius:16px;padding:26px 28px;min-width:300px;box-shadow:0 8px 40px rgba(0,0,0,.5);position:relative;">
        <button id="gf-sh-close" style="position:absolute;top:10px;right:12px;background:none;border:none;color:var(--sh-txt2);font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;">✕</button>
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:22px;margin-bottom:4px;">🎯</div>
          <div style="color:var(--sh-txt);font-size:17px;font-weight:800;letter-spacing:-.3px;">Grade Shooter</div>
          <div style="color:var(--sh-txt2);font-size:11px;margin-top:3px;">${_GameText('game_shoot_subtitle')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="gf-sh-mode-card" data-mode="clear" style="background:var(--sh-surf2);border:1.5px solid var(--sh-brd);border-radius:10px;padding:14px 16px;cursor:pointer;text-align:left;color:var(--sh-txt);">
            <div style="font-size:13px;font-weight:800;color:#f97316;">🎯 ${_GameText('game_shoot_clear_mode')}</div>
            <div style="font-size:11px;color:var(--sh-txt2);margin-top:3px;">${_GameText('game_shoot_clear_desc')}</div>
            <div style="font-size:10px;color:var(--sh-txt3);margin-top:2px;">${_GameText('game_best')}: ${cB} pts</div>
          </button>
          <button class="gf-sh-mode-card" data-mode="endless" style="background:var(--sh-surf2);border:1.5px solid var(--sh-brd);border-radius:10px;padding:14px 16px;cursor:pointer;text-align:left;color:var(--sh-txt);">
            <div style="font-size:13px;font-weight:800;color:#3b82f6;">♾ ${_GameText('game_shoot_endless_mode')}</div>
            <div style="font-size:11px;color:var(--sh-txt2);margin-top:3px;">${_GameText('game_shoot_endless_desc').replace('{n}', DESCEND_EVERY)}</div>
            <div style="font-size:10px;color:var(--sh-txt3);margin-top:2px;">${_GameText('game_best')}: ${eB} pts</div>
          </button>
        </div>
        <div style="color:var(--sh-txt3);font-size:10px;text-align:center;margin-top:14px;line-height:1.8;">
          ${_GameText('game_shoot_hint')}
        </div>
      </div>`;
    document.body.appendChild(host);

    const tobs = new MutationObserver(() => SyncTheme(host));
    tobs.observe(document.documentElement, { attributes:true, attributeFilter:['data-gf-theme'] });
    host._tobs = tobs;

    host.querySelectorAll('.gf-sh-mode-card').forEach(btn =>
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        CloseGradeShooter();
        StartGame(mode, grades);
      }));
    id('gf-sh-close')?.addEventListener('click', CloseGradeShooter);
    document.getElementById('gf-shooter')?.addEventListener('click', e => { if (e.target.id === 'gf-shooter') BossKeyShooter(); });
    document.addEventListener('keydown', _Esc, true);
  }

  /* GAME OVERLAY */
  function StartGame(mode, grades) {
    _grades = grades || [];
    GameState = InitGameState(mode);

    InjectCSS();
    const host = document.createElement('div');
    host.id = 'gf-shooter';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);font-family:"IBM Plex Mono",monospace;';
    SyncTheme(host);

    const modeTxt = mode === 'clear' ? `🎯 ${_GameText('game_shoot_clear')}` : `♾ ${_GameText('game_shoot_endless')}`;

    host.innerHTML = `
      <div style="display:flex;flex-direction:row;align-items:flex-start;gap:14px;background:var(--sh-surf);border:1.5px solid var(--sh-brd);border-radius:16px;padding:14px;box-shadow:0 8px 40px rgba(0,0,0,.5);position:relative;">
        <button id="gf-sh-close" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--sh-txt2);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;">✕</button>

        <!-- Canvas col -->
        <div style="position:relative;flex-shrink:0;">
          <canvas id="gf-sh-canvas" width="${GameState.canW}" height="${GameState.canH}"
            style="display:block;border-radius:10px;cursor:crosshair;background:var(--sh-bg);"></canvas>
          <!-- Mode badge -->
          <div style="position:absolute;top:7px;right:8px;background:rgba(0,0,0,.5);color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;letter-spacing:.05em;">${modeTxt}</div>
          <!-- Result overlay -->
          <div id="gf-sh-result" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.8);border-radius:10px;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff;">
            <div class="gf-sh-res-title" style="font-size:20px;font-weight:800;"></div>
            <div class="gf-sh-res-score" style="font-size:15px;font-weight:700;color:#f97316;"></div>
            <div class="gf-sh-res-detail" style="font-size:11px;color:#a8a29e;"></div>
            <div class="gf-sh-res-best" style="font-size:11px;color:#4ade80;"></div>
            <div style="display:flex;gap:8px;margin-top:6px;">
              <button id="gf-sh-again" style="padding:7px 16px;background:#f97316;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">${_GameText('game_play_again')}</button>
              <button id="gf-sh-menu" style="padding:7px 16px;background:#374151;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">${_GameText('game_shoot_menu')}</button>
            </div>
          </div>
        </div>

        <!-- Side panel -->
        <div style="display:flex;flex-direction:column;gap:10px;min-width:106px;padding-top:4px;">
          <div style="color:var(--sh-txt);font-size:12px;font-weight:800;letter-spacing:.04em;">${_GameText('game_shoot_shooter')}</div>
          <!-- Score -->
          <div style="background:var(--sh-surf2);border-radius:8px;padding:8px 10px;">
            <div style="color:var(--sh-txt2);font-size:9px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px;">${_GameText('game_score')}</div>
            <div id="gf-sh-score" style="color:var(--sh-acc);font-size:20px;font-weight:800;">0</div>
          </div>
          <!-- Stats -->
          <div style="background:var(--sh-surf2);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--sh-txt2);font-size:9px;">${_GameText('game_shoot_cleared')}</span>
              <span id="gf-sh-cleared" style="color:var(--sh-txt);font-size:11px;font-weight:700;">0</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--sh-txt2);font-size:9px;">${_GameText('game_shoot_shots')}</span>
              <span id="gf-sh-shots" style="color:var(--sh-txt);font-size:11px;font-weight:700;">0</span>
            </div>
          </div>
          <!-- Next bubble -->
          <div style="background:var(--sh-surf2);border-radius:8px;padding:8px 10px;text-align:center;">
            <div style="color:var(--sh-txt2);font-size:9px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;">${_GameText('game_next')}</div>
            <div id="gf-sh-next" style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;border:2px solid transparent;margin:0 auto 4px;"></div>
            <div id="gf-sh-next-lbl" style="color:var(--sh-txt2);font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:86px;"></div>
          </div>
          <!-- Band legend -->
          <div style="background:var(--sh-surf2);border-radius:8px;padding:8px 10px;">
            <div style="color:var(--sh-txt2);font-size:9px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">${_GameText('game_shoot_bands')}</div>
            ${BANDS.map(b=>`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
              <div style="width:9px;height:9px;border-radius:50%;background:${b.bg};flex-shrink:0;"></div>
              <span style="color:var(--sh-txt2);font-size:9px;">${b.range}</span>
            </div>`).join('')}
          </div>
          <!-- Hint -->
          <div style="color:var(--sh-txt3);font-size:9px;line-height:1.7;">
            <b style="color:var(--sh-txt2);">${_GameText('game_shoot_mouse')}</b> ${_GameText('game_shoot_aim')}<br>
            <b style="color:var(--sh-txt2);">${_GameText('game_shoot_click')}</b> ${_GameText('game_shoot_shoot')}<br>
            <b style="color:var(--sh-txt2);">F8</b> ${_GameText('game_shoot_hide')}
          </div>
        </div>
      </div>`;

    document.body.appendChild(host);

    const tobs = new MutationObserver(() => SyncTheme(host));
    tobs.observe(document.documentElement, { attributes:true, attributeFilter:['data-gf-theme'] });
    host._tobs = tobs;

    const cv = id('gf-sh-canvas');
    cv.addEventListener('mousemove', e => {
      const { mx, my } = CanvasCoords(cv, e.clientX, e.clientY);
      UpdateAim(mx, my);
    });
    cv.addEventListener('click', e => {
      const { mx, my } = CanvasCoords(cv, e.clientX, e.clientY);
      UpdateAim(mx, my);
      Shoot();
    });
    cv.addEventListener('touchmove', e => {
      if (!e.touches.length) return;
      const { mx, my } = CanvasCoords(cv, e.touches[0].clientX, e.touches[0].clientY);
      UpdateAim(mx, my);
    }, { passive:true });
    cv.addEventListener('touchend', () => Shoot(), { passive:true });

    id('gf-sh-close')?.addEventListener('click', CloseGradeShooter);
    id('gf-sh-again')?.addEventListener('click', () => {
      CloseGradeShooter(); StartGame(mode, grades);
    });
    id('gf-sh-menu')?.addEventListener('click', () => {
      CloseGradeShooter(); OpenGradeShooter(grades);
    });
    document.getElementById('gf-shooter')?.addEventListener('click', e => { if (e.target.id === 'gf-shooter') BossKeyShooter(); });

    document.addEventListener('keydown', _Esc, true);

    UpdateHUD();
    StartLoop();
  }

  function BossKeyShooter() {
    const host = id('gf-shooter');
    if (!host) return false;
    if (host.dataset.bossHidden === '1') {
      host.style.display = 'flex';
      delete host.dataset.bossHidden;
      if (GameState?._bossHidden) { GameState._bossHidden = false; if (GameState.status === 'playing') StartLoop(); }
      return true;
    }
    if (host.style.display !== 'none') {
      if (GameState?.status === 'playing') { StopLoop(); GameState._bossHidden = true; }
      host.style.display = 'none';
      host.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  /* OPEN / CLOSE */
  function _Esc(e) {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'Escape') { e.preventDefault(); CloseGradeShooter(); }
  }

  function OpenGradeShooter(grades) {
    _grades = grades || [];
    CloseGradeShooter();
    BuildModeSelect(_grades);
  }

  function CloseGradeShooter() {
    StopLoop();
    document.removeEventListener('keydown', _Esc, true);
    const host = id('gf-shooter');
    if (host) { host._tobs?.disconnect(); host.remove(); }
  }

  /* PUBLIC */
  W.OpenGradeShooter  = OpenGradeShooter;
  W.CloseGradeShooter = CloseGradeShooter;
  W.BossKeyShooter    = BossKeyShooter;

})(window);
