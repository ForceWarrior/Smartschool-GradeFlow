;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const COLS = 10, ROWS = 20, CELL = 24;
  const BW = COLS * CELL, BH = ROWS * CELL;
  const NC = 20, NS = 5 * NC;

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

  // Highscore
  const GF_HI_KEY = 'gradeflow-tetris-hi';
  function LoadHiScore() {
    try { return parseInt(localStorage.getItem(GF_HI_KEY)) || 0; } catch (_) { return 0; }
  }
  function SaveHiScore(n) {
    try { localStorage.setItem(GF_HI_KEY, String(n)); } catch (_) {}
  }

  // Grade helpers
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

  // Tetromino helpers
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

  // Game state
  let GT = null;

  function NewGradeTile(grades) {
    const g = NormalizeGrades(grades);
    const shuffled = [...g].sort(() => Math.random() - 0.5);
    let gIdx = 0;
    return {
      board:     Array.from({length: ROWS}, () => Array(COLS).fill(null)),
      cur: null, nxt: null,
      bag: NewPieceBag(), bagIdx: 0,
      nextGrade: () => shuffled[gIdx++ % shuffled.length],
      grades: g,
      score: 0, lines: 0, level: 1,
      hiScore: LoadHiScore(),
      status: 'start',
      raf: null, lastTick: 0, flash: null,
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

  // Game actions
  function Spawn(gs) {
    if (!gs.nxt) {
      gs.cur = CreatePiece(PullFromBag(gs), gs.nextGrade());
      gs.nxt = CreatePiece(PullFromBag(gs), gs.nextGrade());
    } else {
      gs.cur = { ...gs.nxt, row:-1, col: Math.floor((COLS - gs.nxt.cells[0].length) / 2), cells: SHAPES[gs.nxt.shape].map(r => [...r]) };
      gs.nxt = CreatePiece(PullFromBag(gs), gs.nextGrade());
    }
    if (!IsValidPos(gs.board, Coords(gs.cur))) { gs.status = 'gameover'; return false; }
    return true;
  }

  function MovePiece(gs, dRow, dCol) {
    const p = { ...gs.cur, row: gs.cur.row+dRow, col: gs.cur.col+dCol };
    if (!IsValidPos(gs.board, Coords(p))) return false;
    gs.cur = p; return true;
  }

  function RotateCur(gs, dir) {
    const nc = RotateMatrix(gs.cur.cells, dir);
    for (const [dc, dr] of [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1],[0,1]]) {
      const p = { ...gs.cur, cells:nc, col: gs.cur.col+dc, row: gs.cur.row+dr };
      if (IsValidPos(gs.board, Coords(p))) { gs.cur = p; return true; }
    }
    return false;
  }

  function GhostRow(gs) {
    let r = gs.cur.row;
    while (IsValidPos(gs.board, Coords({ ...gs.cur, row: r+1 }))) r++;
    return r;
  }

  function LockCur(gs) {
    for (const {r, c} of Coords(gs.cur))
      if (r >= 0) gs.board[r][c] = { color: gs.cur.color, label: gs.cur.grade?.label || '', Pct: gs.cur.grade?.percentage };

    const full = [];
    for (let r = 0; r < ROWS; r++)
      if (gs.board[r].every(x => x !== null)) full.push(r);

    if (full.length) {
      gs.flash = { rows: full, born: performance.now() };

      for (const r of [...full].reverse()) gs.board.splice(r, 1);
      for (let i = 0; i < full.length; i++) gs.board.unshift(Array(COLS).fill(null));

      const mult = GradeMultiplier(gs.cur.grade?.percentage);
      gs.score  += Math.floor(LINE_PTS[full.length] * gs.level * mult);
      gs.lines  += full.length;
      gs.level   = Math.floor(gs.lines / 10) + 1;

      if (gs.score > gs.hiScore) { gs.hiScore = gs.score; SaveHiScore(gs.score); }
    }

    Spawn(gs);
  }

  function HardDrop(gs) {
    const gr = GhostRow(gs);
    gs.score += (gr - gs.cur.row) * 2;
    gs.cur = { ...gs.cur, row: gr };
    LockCur(gs);
  }

  // Game loop
  function StartLoop(gs) {
    function Tick(ts) {
      if (!GT || GT.status !== 'playing') return;
      if (ts - GT.lastTick >= SPEED(GT.level)) {
        GT.lastTick = ts;
        if (!MovePiece(GT, 1, 0)) {
          LockCur(GT);
          if (GT.status === 'gameover') { ShowGameOver(); return; }
        }
      }
      DrawFrame();
      GT.raf = requestAnimationFrame(Tick);
    }
    gs.lastTick = performance.now();
    gs.raf = requestAnimationFrame(Tick);
  }

  // Rendering
  function DrawFrame() { DrawBoard(); DrawNext(); UpdateHUD(); }

  function DrawCell(ctx, x, y, sz, color, label) {
    const p = 1, w = sz-p*2, h = sz-p*2;
    ctx.fillStyle = color;
    ctx.fillRect(x+p, y+p, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x+p, y+p, w, 3);
    ctx.fillRect(x+p, y+p, 3, h);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x+p, y+p+h-3, w, 3);
    ctx.fillRect(x+p+w-3, y+p, 3, h);
    if (label && sz >= 20) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.font = `600 ${Math.floor(sz * 0.30)}px "IBM Plex Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x+sz/2, y+sz/2);
    }
  }

  function DrawBoard() {
    const cv = document.getElementById('gf-tc-board');
    if (!cv || !GT) return;
    const ctx = cv.getContext('2d');
    const cc = GetCanvasColors();
    ctx.fillStyle = cc.boardBg;
    ctx.fillRect(0, 0, BW, BH);
    ctx.strokeStyle = cc.grid; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*CELL); ctx.lineTo(BW,r*CELL); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,BH); ctx.stroke(); }

    const fl = GT.flash;
    const fp = fl ? Math.min(1, (performance.now() - fl.born) / 180) : 0;
    if (fl && fp >= 1) GT.flash = null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = GT.board[r][c];
        if (!cell) continue;
        const flashing = fl && fl.rows.includes(r);
        const color = flashing ? `rgba(255,255,255,${0.3 + Math.sin(fp * Math.PI) * 0.7})` : cell.color;
        DrawCell(ctx, c*CELL, r*CELL, CELL, color, flashing ? '' : cell.label);
      }
    }

    if (GT.cur && GT.status === 'playing') {
      const gr = GhostRow(GT);
      if (gr !== GT.cur.row) {
        for (const {r, c} of Coords({ ...GT.cur, row: gr })) {
          if (r < 0) continue;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
          ctx.strokeStyle = GT.cur.color + '44'; ctx.lineWidth = 1;
          ctx.strokeRect(c*CELL+0.5, r*CELL+0.5, CELL-1, CELL-1);
        }
      }
      for (const {r, c} of Coords(GT.cur))
        if (r >= 0) DrawCell(ctx, c*CELL, r*CELL, CELL, GT.cur.color, '');
    }
  }

  function DrawNext() {
    const cv = document.getElementById('gf-tc-next');
    if (!cv || !GT?.nxt) return;
    const ctx = cv.getContext('2d');
    const cells = GT.nxt.cells, R = cells.length, C = cells[0].length;
    const ox = Math.floor((NS - C*NC) / 2), oy = Math.floor((NS - R*NC) / 2);
    ctx.fillStyle = GetCanvasColors().nextBg; ctx.fillRect(0, 0, NS, NS);
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++)
        if (cells[r][c]) DrawCell(ctx, ox+c*NC, oy+r*NC, NC, GT.nxt.color, '');
  }

  function UpdateHUD() {
    if (!GT) return;
    if (GT.score > GT.hiScore) { GT.hiScore = GT.score; SaveHiScore(GT.score); }

    SetText('gf-th-score', GT.score.toLocaleString());
    SetText('gf-th-lines', String(GT.lines));
    SetText('gf-th-level', String(GT.level));
    SetText('gf-th-best',  GT.hiScore.toLocaleString());

    const g = GT.cur?.grade;
    if (g) {
      SetText('gf-th-csubj',  g.subject || '');
      SetText('gf-th-cscore', g.label   || '');
      const pctEl = document.getElementById('gf-th-cpct');
      if (pctEl) { pctEl.textContent = g.percentage != null ? `${Math.round(g.percentage)}%` : '?'; pctEl.style.color = GetGradeColor(g.percentage); }
      const mult = GradeMultiplier(g.percentage);
      const multEl = document.getElementById('gf-th-cmult');
      if (multEl) { multEl.textContent = `×${mult.toFixed(2)}`; multEl.style.color = mult > 1 ? '#4ade80' : mult < 1 ? '#f87171' : '#666'; }
    }
    const ng = GT.nxt?.grade;
    if (ng) SetText('gf-th-nsubj', ng.subject || '');
  }

  function SetText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

  // Screens
  const SCREEN_IDS = ['gf-ts-start', 'gf-ts-gameover', 'gf-ts-pause'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const el = document.getElementById(sid); if (el) el.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    if (GT.score > GT.hiScore) { GT.hiScore = GT.score; SaveHiScore(GT.score); }
    const msg = GO_MSGS[0 | (Math.random() * GO_MSGS.length)];
    SetText('gf-ts-go-msg',   msg);
    SetText('gf-ts-go-score', `${_GameText('game_score')}: ${GT.score.toLocaleString()}`);
    SetText('gf-ts-go-lines', `${_GameText('game_stack_lines_cleared')}: ${GT.lines}`);
    SetText('gf-ts-go-level', `${_GameText('game_stack_level_reached')}: ${GT.level}`);
    SetText('gf-ts-go-best',  `${_GameText('game_best')}: ${GT.hiScore.toLocaleString()}`);
    ShowScreen('gf-ts-gameover');
  }

  // Overlay HTML
  function BuildOverlay() {
    if (document.getElementById('gf-tetris')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-tetris';
    root.innerHTML = `
<div id="gf-tetris-modal">
  <div id="gf-tt-header">
    <div id="gf-tt-hl">
      <div id="gf-tt-logo">GS</div>
      <span id="gf-tt-title">GradeStack</span>
      <span id="gf-tt-badge">BETA</span>
    </div>
    <div id="gf-tt-hr">
      <span id="gf-tt-hint">F8</span>
      <button id="gf-tt-pause" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-tt-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-tt-body">
    <div id="gf-tb-board">
      <canvas id="gf-tc-board" width="${BW}" height="${BH}"></canvas>
    </div>
    <div id="gf-tb-hud">
      <div class="gf-tp">
        <div class="gf-tp-label">${_GameText('game_stack_next')}</div>
        <canvas id="gf-tc-next" width="${NS}" height="${NS}"></canvas>
        <div id="gf-th-nsubj" class="gf-tp-subj"></div>
      </div>
      <div class="gf-tp">
        <div class="gf-tp-label">${_GameText('game_stack_current')}</div>
        <div id="gf-th-csubj" class="gf-tp-subj"></div>
        <div class="gf-tp-grade-row">
          <span id="gf-th-cscore" class="gf-tp-gscore"></span>
          <span id="gf-th-cpct"   class="gf-tp-gpct"></span>
        </div>
        <div id="gf-th-cmult" class="gf-tp-mult"></div>
      </div>
      <div class="gf-tp">
        <div class="gf-tp-stat-row">
          <span class="gf-tp-label">${_GameText('game_score').toUpperCase()}</span>
          <span id="gf-th-score" class="gf-tp-val">0</span>
        </div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-label">${_GameText('game_best').toUpperCase()}</span>
          <span id="gf-th-best" class="gf-tp-val gf-tp-best">0</span>
        </div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-label">${_GameText('game_stack_lines').toUpperCase()}</span>
          <span id="gf-th-lines" class="gf-tp-val">0</span>
        </div>
        <div class="gf-tp-stat-row">
          <span class="gf-tp-label">${_GameText('game_stack_level').toUpperCase()}</span>
          <span id="gf-th-level" class="gf-tp-val">1</span>
        </div>
      </div>
      <div class="gf-tp gf-tp-ctrl">
        <div class="gf-tp-label">${_GameText('game_controls')}</div>
        <div class="gf-tc-row"><kbd>← →</kbd>          <span>${_GameText('game_stack_move_desc')}</span></div>
        <div class="gf-tc-row"><kbd>↑ X W</kbd>        <span>${_GameText('game_stack_rotate_cw')}</span></div>
        <div class="gf-tc-row"><kbd>Z</kbd>             <span>${_GameText('game_stack_rotate_ccw')}</span></div>
        <div class="gf-tc-row"><kbd>↓ S</kbd>          <span>${_GameText('game_stack_soft_drop')}</span></div>
        <div class="gf-tc-row"><kbd>Space</kbd>         <span>${_GameText('game_stack_hard_drop')}</span></div>
        <div class="gf-tc-row"><kbd>P / Esc</kbd>       <span>${_GameText('game_pause')}</span></div>
      </div>
    </div>
    <div id="gf-ts-start" class="gf-ts">
      <div class="gf-ts-logo">GradeStack</div>
      <div class="gf-ts-sub">${_GameText('game_stack_subtitle')}</div>
      <div id="gf-ts-start-hint" class="gf-ts-hint"></div>
      <button class="gf-ts-btn" id="gf-ts-play">▶&nbsp; ${_GameText('game_start')}</button>
      <div class="gf-ts-footer">${_GameText('game_stack_footer')}</div>
    </div>
    <div id="gf-ts-gameover" class="gf-ts" style="display:none">
      <div class="gf-ts-go-title">${_GameText('game_gameover')}</div>
      <div id="gf-ts-go-msg" class="gf-ts-go-msg"></div>
      <div class="gf-ts-go-stats">
        <div id="gf-ts-go-score"></div>
        <div id="gf-ts-go-best"  style="color:#f97316;font-weight:600;"></div>
        <div id="gf-ts-go-lines"></div>
        <div id="gf-ts-go-level"></div>
      </div>
      <button class="gf-ts-btn" id="gf-ts-restart">↺&nbsp; ${_GameText('game_play_again')}</button>
    </div>
    <div id="gf-ts-pause" class="gf-ts" style="display:none">
      <div class="gf-ts-sub" style="font-size:22px;letter-spacing:4px;">${_GameText('game_paused')}</div>
      <div id="gf-ts-pause-score" style="font-size:11px;color:#555;margin-top:-4px;"></div>
      <button class="gf-ts-btn" id="gf-ts-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindOverlayButtons();
  }

  function BindOverlayButtons() {
    document.getElementById('gf-tt-close')  ?.addEventListener('click', CloseGradeTetris);
    document.getElementById('gf-tt-pause')  ?.addEventListener('click', DoPause);
    document.getElementById('gf-ts-play')   ?.addEventListener('click', DoStart);
    document.getElementById('gf-ts-restart')?.addEventListener('click', DoStart);
    document.getElementById('gf-ts-resume') ?.addEventListener('click', DoPause);
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
    const dark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
    el.style.filter = dark ? 'invert(1) hue-rotate(180deg)' : '';
    el.dataset.theme = dark ? 'dark' : 'light';
  }
  const _themeWatcher = new MutationObserver(ApplyInvertFix);

  function GetCanvasColors() {
    const dark = document.getElementById('gf-tetris')?.dataset.theme === 'dark';
    return dark
      ? { boardBg: '#0a0a0a', grid: '#191919', nextBg: '#111111' }
      : { boardBg: '#f0f0f0', grid: '#d0d0d0', nextBg: '#e4e4e4' };
  }

  // Flow control
  function DoStart() {
    if (!GT) return;
    if (GT.raf) { cancelAnimationFrame(GT.raf); GT.raf = null; }
    const grades = GT.grades, hi = GT.hiScore;
    Object.assign(GT, NewGradeTile(grades));
    GT.hiScore = hi; // preserve hi score across games
    GT.status = 'playing';
    ShowScreen(null);
    Spawn(GT); DrawFrame(); StartLoop(GT);
  }

  function DoPause() {
    if (!GT) return;
    if (GT.status === 'playing') {
      GT.status = 'paused';
      if (GT.raf) { cancelAnimationFrame(GT.raf); GT.raf = null; }
      const ps = document.getElementById('gf-ts-pause-score');
      if (ps) ps.textContent = `${_GameText('game_score')}: ${GT.score.toLocaleString()} \u00b7 ${_GameText('game_best')}: ${GT.hiScore.toLocaleString()}`;
      ShowScreen('gf-ts-pause');
    } else if (GT.status === 'paused') {
      GT.status = 'playing';
      ShowScreen(null);
      StartLoop(GT);
    }
  }

  function OnVisibilityChange() {
    if (document.hidden && GT?.status === 'playing') DoPause();
  }

  // Keyboard
  function OnKey(e) {
    if (!GT || !document.getElementById('gf-tetris')) return;

    if (e.key === 'Escape') {
      if (GT.status === 'playing' || GT.status === 'paused') DoPause();
      else CloseGradeTetris();
      e.preventDefault(); e.stopPropagation(); return;
    }

    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (GT.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (GT.status === 'start' || GT.status === 'gameover') DoStart();
        else if (GT.status === 'paused') DoPause();
        e.preventDefault();
      }
      return;
    }

    let consumed = true;
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
          if (GT.status === 'gameover') { ShowGameOver(); return; }
        } else { GT.score++; }
        break;

      case ' ':
        HardDrop(GT);
        if (GT.status === 'gameover') { ShowGameOver(); return; }
        break;

      case 'p': case 'P': DoPause(); break;
      default: consumed = false;
    }

    if (consumed) {
      DrawFrame();
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
      }
    }
  }

  function AttachKeys() {
    document.addEventListener('keydown', OnKey, true);
    document.addEventListener('visibilitychange', OnVisibilityChange);
  }
  function DetachKeys() {
    document.removeEventListener('keydown', OnKey, true);
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  // Public API
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
      : `\u2713 ${GT.grades.length} ${_GameText('game_grades_loaded')}`;

    const hiEl = document.getElementById('gf-ts-start-hi');
    if (hiEl) hiEl.textContent = GT.hiScore > 0 ? `${_GameText('game_best')}: ${GT.hiScore.toLocaleString()}` : '';

    document.getElementById('gf-tetris').style.display = 'flex';
    if (GT.status === 'start' || GT.status === 'gameover') ShowScreen('gf-ts-start');
    else if (GT.status === 'paused') ShowScreen('gf-ts-pause');
    ApplyInvertFix();
    AttachKeys();
    _themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
  }

  function ToggleGradeTetris(grades) {
    const el = document.getElementById('gf-tetris');
    if (el && el.style.display !== 'none') CloseGradeTetris();
    else OpenGradeTetris(grades);
  }

  function CloseGradeTetris() {
    const el = document.getElementById('gf-tetris');
    if (el) el.style.display = 'none';
    if (GT?.status === 'playing') {
      GT.status = 'paused';
      if (GT.raf) { cancelAnimationFrame(GT.raf); GT.raf = null; }
    }
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
/* ── GradeStack – theme tokens ───────────────────────────────────────────── */
#gf-tetris {
  --gs-modal:   #ffffff;
  --gs-hdr:     #f5f5f5;
  --gs-hud:     #fafafa;
  --gs-scr:     rgba(248,248,248,0.96);
  --gs-brd:     rgba(249,115,22,0.2);
  --gs-brd2:    #e0e0e0;
  --gs-btn-brd: #d0d0d0;
  --gs-txt:     #111111;
  --gs-txt2:    #444444;
  --gs-txt3:    #888888;
  --gs-kbd:     #eeeeee;
  --gs-kbd-brd: #cccccc;
  --gs-scroll:  #d0d0d0;
}
#gf-tetris[data-theme="dark"] {
  --gs-modal:   rgba(13,13,13,0.97);
  --gs-hdr:     rgba(8,8,8,0.95);
  --gs-hud:     rgba(10,10,10,0.98);
  --gs-scr:     rgba(6,6,6,0.94);
  --gs-brd:     rgba(249,115,22,0.22);
  --gs-brd2:    #1c1c1c;
  --gs-btn-brd: #333333;
  --gs-txt:     #f5f5f5;
  --gs-txt2:    #aaaaaa;
  --gs-txt3:    #555555;
  --gs-kbd:     #1e1e1e;
  --gs-kbd-brd: #333333;
  --gs-scroll:  #2a2a2a;
}

/* ── GradeStack overlay ──────────────────────────────────────────────────── */
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

#gf-tetris-modal {
  position: relative;
  background: var(--gs-modal);
  border: 1px solid var(--gs-brd);
  border-radius: 12px;
  box-shadow:
    0 0 0 1px rgba(249,115,22,0.08),
    0 8px 32px rgba(0,0,0,0.18),
    0 40px 90px rgba(0,0,0,0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  max-width: calc(100vw - 32px);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
#gf-tt-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: var(--gs-hdr);
  border-bottom: 1px solid var(--gs-brd);
  flex-shrink: 0; gap: 8px; user-select: none;
}
#gf-tt-hl { display: flex; align-items: center; gap: 8px; }
#gf-tt-hr { display: flex; align-items: center; gap: 6px; }

#gf-tt-logo {
  width: 26px; height: 26px;
  background: #f97316; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; letter-spacing: -1px; flex-shrink: 0;
}
#gf-tt-title { font-size: 14px; font-weight: 700; color: var(--gs-txt); letter-spacing: -0.3px; }
#gf-tt-badge {
  font-size: 8px; font-weight: 600; color: #f97316;
  border: 1px solid rgba(249,115,22,0.4); border-radius: 4px; padding: 2px 5px; letter-spacing: 1px;
}
#gf-tt-hint { font-size: 9px; color: var(--gs-txt3); letter-spacing: 0.3px; }

#gf-tt-pause, #gf-tt-close {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border: 1px solid var(--gs-btn-brd); border-radius: 6px;
  background: transparent; color: var(--gs-txt3);
  cursor: pointer; font-size: 12px; line-height: 1; padding: 0; flex-shrink: 0;
  transition: border-color 0.13s, color 0.13s, background 0.13s;
}
#gf-tt-pause:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,0.10); }
#gf-tt-close:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.10); }

/* ── Body layout ─────────────────────────────────────────────────────────── */
#gf-tt-body { display: flex; position: relative; overflow: hidden; }
#gf-tb-board { flex-shrink: 0; border-right: 1px solid var(--gs-brd); line-height: 0; }

/* ── HUD sidebar ─────────────────────────────────────────────────────────── */
#gf-tb-hud {
  width: 158px; flex-shrink: 0;
  display: flex; flex-direction: column;
  overflow-y: auto;
  background: var(--gs-hud);
}
#gf-tb-hud::-webkit-scrollbar { width: 3px; }
#gf-tb-hud::-webkit-scrollbar-thumb { background: var(--gs-scroll); border-radius: 99px; }

.gf-tp { padding: 8px 10px; border-bottom: 1px solid var(--gs-brd2); flex-shrink: 0; }
.gf-tp:last-child { border-bottom: none; }

.gf-tp-label {
  font-size: 8px; font-weight: 600; letter-spacing: 1.5px; color: var(--gs-txt3);
  text-transform: uppercase; margin-bottom: 5px;
  display: flex; align-items: center; gap: 5px;
}
.gf-tp-label::before { content: '•'; color: #f97316; font-size: 11px; line-height: 1; }

#gf-tc-next { display: block; border-radius: 4px; overflow: hidden; }
.gf-tp-subj { font-size: 9px; color: var(--gs-txt2); line-height: 1.3; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gf-tp-grade-row { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
.gf-tp-gscore { font-size: 11px; font-weight: 600; color: var(--gs-txt2); }
.gf-tp-gpct   { font-size: 15px; font-weight: 700; }
.gf-tp-mult   { font-size: 10px; font-weight: 700; margin-top: 3px; letter-spacing: 0.3px; }

.gf-tp-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
.gf-tp-val { font-size: 14px; font-weight: 700; color: var(--gs-txt); }
.gf-tp-best { color: #f97316 !important; }

.gf-tc-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.gf-tc-row kbd {
  display: inline-block; padding: 1px 4px;
  font-family: inherit; font-size: 7px; font-weight: 600;
  background: var(--gs-kbd); border: 1px solid var(--gs-kbd-brd); border-radius: 3px;
  color: var(--gs-txt2); min-width: 28px; text-align: center; flex-shrink: 0;
}
.gf-tc-row span { font-size: 8px; color: var(--gs-txt3); }

/* ── Overlay screens ─────────────────────────────────────────────────────── */
.gf-ts {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 11px;
  background: var(--gs-scr);
  padding: 24px;
}
.gf-ts-logo {
  font-size: 30px; font-weight: 700; color: #f97316; letter-spacing: -1px;
  text-shadow: 0 0 50px rgba(249,115,22,0.55);
}
.gf-ts-sub    { font-size: 12px; color: var(--gs-txt2); letter-spacing: 0.5px; }
.gf-ts-hint   { font-size: 9px; color: var(--gs-txt3); text-align: center; line-height: 1.5; }
.gf-ts-footer { font-size: 8px; color: var(--gs-txt3); text-align: center; }

.gf-ts-btn {
  padding: 9px 24px;
  border: 1px solid #f97316; border-radius: 7px;
  background: rgba(249,115,22,0.10); color: #f97316;
  font-family: inherit; font-size: 12px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.3px;
  transition: background 0.14s, box-shadow 0.14s, transform 0.14s;
}
.gf-ts-btn:hover {
  background: rgba(249,115,22,0.22);
  box-shadow: 0 4px 20px rgba(249,115,22,0.28);
  transform: translateY(-1px);
}
.gf-ts-go-title {
  font-size: 28px; font-weight: 700; color: #f87171; letter-spacing: 5px;
  text-shadow: 0 0 35px rgba(248,113,113,0.5);
}
.gf-ts-go-msg   { font-size: 11px; color: #f97316; font-style: italic; }
.gf-ts-go-stats { font-size: 11px; color: var(--gs-txt2); line-height: 1.9; text-align: center; }
`;
    document.head.appendChild(s);
  }

})(window);
