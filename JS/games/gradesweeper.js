;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  /* CONFIG */
  const DIFFICULTIES = [
    { id: 'beginner',     label: () => _GameText('game_beginner'),     cols: 9,  rows: 9,  mines: 10, cell: 32 },
    { id: 'intermediate', label: () => _GameText('game_intermediate'), cols: 12, rows: 10, mines: 20, cell: 26 },
    { id: 'expert',       label: () => _GameText('game_expert'),       cols: 16, rows: 10, mines: 35, cell: 21 },
  ];
  const NUM_COLORS = ['','#3b82f6','#22c55e','#ef4444','#7c3aed','#f97316','#06b6d4','#ec4899','#9ca3af'];
  const FAIL_LABELS = ['2/20','3/20','4/20','5/20','6/20','7/20','8/20','9/20'];
  const LS_BEST = 'gf-sweep-best';

  /* PERSISTENCE */
  function LoadBests() { try { return JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch(_){ return {}; } }
  function SaveBestScore(id, secs) {
    const b = LoadBests();
    if (!b[id] || secs < b[id]) { b[id] = secs; try { localStorage.setItem(LS_BEST, JSON.stringify(b)); } catch(_){} }
  }
  function GetBestScore(id) { return LoadBests()[id] || null; }

  /* STATE */
  let G = null; // game state
  let _diffId  = 'beginner';
  let _timerInterval = null;
  let _timerStart    = null;
  let _timerElapsed  = 0; // ms accumulated before current start (for boss-key pause)

  function GetDifficulty() { return DIFFICULTIES.find(d => d.id === _diffId) || DIFFICULTIES[0]; }

  function NewGame() {
    StopTimer();
    const d = GetDifficulty();
    const board = [];
    for (let r = 0; r < d.rows; r++) {
      board.push([]);
      for (let c = 0; c < d.cols; c++) {
        board[r].push({
          r, c,
          isMine: false, revealed: false, flagged: false,
          adjCount: 0,
          failLabel: FAIL_LABELS[Math.floor(Math.random() * FAIL_LABELS.length)],
        });
      }
    }
    G = {
      diff: d, board,
      status:     'idle',   // idle | playing | won | lost
      firstClick: true,
      flagsLeft:  d.mines,
      elapsed:    0,        // seconds shown
    };
    _timerElapsed = 0;
    BuildBoard();
    UpdateHUD();
    HideOverlays();
  }

  /* MINE PLACEMENT (post first click) */
  function PlaceMines(safeR, safeC) {
    const d = G.diff;
    const excluded = new Set();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = safeR + dr, nc = safeC + dc;
      if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols) excluded.add(`${nr},${nc}`);
    }
    const pool = [];
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++)
      if (!excluded.has(`${r},${c}`)) pool.push([r, c]);

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < d.mines; i++) {
      const [r, c] = pool[i];
      G.board[r][c].isMine = true;
    }

    // Compute adjacency
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
      if (G.board[r][c].isMine) continue;
      let count = 0;
      ForEachNeighbor(r, c, (nr, nc) => { if (G.board[nr][nc].isMine) count++; });
      G.board[r][c].adjCount = count;
    }
  }

  function ForEachNeighbor(r, c, fn) {
    const d = G.diff;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols) fn(nr, nc);
    }
  }

  /* REVEAL LOGIC */
  function Reveal(r, c) {
    if (!G || G.status === 'won' || G.status === 'lost') return;
    const cell = G.board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (G.firstClick) {
      G.firstClick = false;
      G.status = 'playing';
      PlaceMines(r, c);
      StartTimer();
    }

    if (cell.isMine) {
      cell.revealed = true;
      G.status = 'lost';
      StopTimer();
      RevealAllMines(r, c);
      UpdateCell(r, c);
      setTimeout(ShowLose, 180);
      return;
    }

    const queue = [[r, c]];
    const seen  = new Set([`${r},${c}`]);
    while (queue.length) {
      const [cr, cc] = queue.shift();
      const cv = G.board[cr][cc];
      if (cv.revealed || cv.flagged || cv.isMine) continue;
      cv.revealed = true;
      UpdateCell(cr, cc);
      if (cv.adjCount === 0) {
        ForEachNeighbor(cr, cc, (nr, nc) => {
          const key = `${nr},${nc}`;
          if (!seen.has(key)) { seen.add(key); queue.push([nr, nc]); }
        });
      }
    }

    CheckWin();
  }

  function CheckWin() {
    const d = G.diff;
    let unrevealed = 0;
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++)
      if (!G.board[r][c].revealed && !G.board[r][c].isMine) unrevealed++;
    if (unrevealed === 0) {
      G.status = 'won';
      StopTimer();
      for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
        const cell = G.board[r][c];
        if (cell.isMine && !cell.flagged) { cell.flagged = true; UpdateCell(r, c); }
      }
      G.flagsLeft = 0;
      UpdateHUD();
      const secs = Math.round(_timerElapsed / 1000);
      SaveBestScore(_diffId, secs);
      setTimeout(ShowWin, 200);
    }
  }

  function RevealAllMines(hitR, hitC) {
    const d = G.diff;
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
      const cell = G.board[r][c];
      if (cell.isMine && !(r === hitR && c === hitC)) {
        cell.revealed = true;
        UpdateCell(r, c);
      }
    }
  }

  function ToggleFlag(r, c) {
    if (!G || G.status === 'won' || G.status === 'lost') return;
    const cell = G.board[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    G.flagsLeft += cell.flagged ? -1 : 1;
    UpdateCell(r, c);
    UpdateHUD();
  }

  /* TIMER */
  function StartTimer() {
    _timerStart = Date.now();
    _timerInterval = setInterval(() => {
      const total = _timerElapsed + (Date.now() - _timerStart);
      G.elapsed   = Math.min(999, Math.floor(total / 1000));
      SetText('gf-sw-timer', String(G.elapsed).padStart(3, '0'));
    }, 200);
  }
  function StopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    if (_timerStart)    { _timerElapsed += Date.now() - _timerStart; _timerStart = null; }
  }
  function PauseTimer() { StopTimer(); }
  function ResumeTimer() {
    if (G?.status === 'playing' && !_timerInterval) {
      _timerStart = Date.now();
      StartTimer();
    }
  }

  /* DOM BOARD */
  function BuildBoard() {
    const d    = G.diff;
    const gap  = 2;
    const brd  = document.getElementById('gf-sw-board');
    const wrap = document.getElementById('gf-sw-board-wrap');
    if (!brd || !wrap) return;

    const W = d.cols * d.cell + (d.cols - 1) * gap;
    const H = d.rows * d.cell + (d.rows - 1) * gap;
    wrap.style.width  = `${W}px`;
    wrap.style.height = `${H}px`;
    brd.style.gridTemplateColumns = `repeat(${d.cols}, ${d.cell}px)`;
    brd.style.gridTemplateRows    = `repeat(${d.rows}, ${d.cell}px)`;

    const frags = [];
    for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
      frags.push(`<div class="gf-sw-cell gf-sw-hidden" data-r="${r}" data-c="${c}" style="width:${d.cell}px;height:${d.cell}px;font-size:${Math.max(9, d.cell * 0.38)}px"></div>`);
    }
    brd.innerHTML = frags.join('');
  }

  function GetCellElement(r, c) { return document.querySelector(`#gf-sw-board [data-r="${r}"][data-c="${c}"]`); }

  function UpdateCell(r, c) {
    const el   = GetCellElement(r, c); if (!el) return;
    const cell = G.board[r][c];
    el.className = 'gf-sw-cell';
    el.textContent = '';
    el.style.color = '';
    el.style.animationDelay = '';

    if (!cell.revealed) {
      if (cell.flagged) {
        el.classList.add('gf-sw-flag');
        el.textContent = '⚑';
      } else {
        el.classList.add('gf-sw-hidden');
      }
    } else if (cell.isMine) {
      el.classList.add('gf-sw-mine');
      if (G.status === 'lost' && !cell._isHit) el.classList.add('gf-sw-mine-reveal');
      el.textContent = cell.failLabel;
    } else if (cell.adjCount === 0) {
      el.classList.add('gf-sw-safe');
    } else {
      el.classList.add('gf-sw-num', `gf-sw-n${cell.adjCount}`);
      el.style.color = NUM_COLORS[cell.adjCount] || '';
      el.textContent = cell.adjCount;
    }
  }

  /* HUD */
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!G) return;
    SetText('gf-sw-flags', String(Math.max(0, G.flagsLeft)).padStart(3, '0'));
    SetText('gf-sw-timer', String(G.elapsed || 0).padStart(3, '0'));
    document.querySelectorAll('.gf-sw-diff-btn').forEach(btn => {
      btn.classList.toggle('gf-sw-diff-active', btn.dataset.diff === _diffId);
    });
  }

  /* OVERLAYS */
  function HideOverlays() {
    ['gf-sw-ovr-win','gf-sw-ovr-lose'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
  }

  function ShowWin() {
    const el = document.getElementById('gf-sw-ovr-win'); if (!el) return;
    const secs = Math.round(_timerElapsed / 1000);
    const best = GetBestScore(_diffId);
    const isNew = best === secs;
    const bestTxt = best ? `${_GameText('game_best')}: ${best}s${isNew ? ' 🏆 ' + _GameText('game_new_best') : ''}` : '';
    el.innerHTML = `
      <div class="gf-sw-ovr-icon">🎓</div>
      <div class="gf-sw-ovr-title" style="color:#4ade80">${_GameText('game_sweep_cleared')}</div>
      <div class="gf-sw-ovr-sub">${_GameText('game_time')}: ${secs}s${bestTxt ? ` · ${bestTxt}` : ''}</div>
      <button class="gf-sw-btn" id="gf-sw-win-again">▶ ${_GameText('game_play_again')}</button>`;
    el.style.display = 'flex';
    document.getElementById('gf-sw-win-again')?.addEventListener('click', NewGame);
  }

  function ShowLose() {
    const el = document.getElementById('gf-sw-ovr-lose'); if (!el) return;
    el.innerHTML = `
      <div class="gf-sw-ovr-icon">📉</div>
      <div class="gf-sw-ovr-title" style="color:#f87171">${_GameText('game_sweep_fail')}</div>
      <div class="gf-sw-ovr-sub">${_GameText('game_sweep_fail_desc')}</div>
      <button class="gf-sw-btn" id="gf-sw-lose-again">↺ ${_GameText('game_try_again')}</button>`;
    el.style.display = 'flex';
    document.getElementById('gf-sw-lose-again')?.addEventListener('click', NewGame);
  }

  /* INPUT */
  let _longPressTimer = null;
  function OnBoardPointerDown(e) {
    const r = +e.target.dataset.r, c = +e.target.dataset.c;
    if (isNaN(r)) return;
    if (e.type === 'touchstart') {
      _longPressTimer = setTimeout(() => { _longPressTimer = null; ToggleFlag(r, c); }, 500);
    }
  }
  function OnBoardPointerUp(e) {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
  }

  function OnBoardClick(e) {
    const el = e.target.closest('[data-r]'); if (!el) return;
    const r = +el.dataset.r, c = +el.dataset.c;
    if (isNaN(r)) return;
    Reveal(r, c);
  }

  function OnBoardContext(e) {
    e.preventDefault();
    const el = e.target.closest('[data-r]'); if (!el) return;
    const r = +el.dataset.r, c = +el.dataset.c;
    if (isNaN(r)) return;
    ToggleFlag(r, c);
  }

  let _kh = null;
  function OnKey(e) {
    if (!document.getElementById('gf-sweep') || document.getElementById('gf-sweep').style.display === 'none') return;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGradeSweeper(); }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); NewGame(); }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  /* THEME */
  function ApplyTheme() {
    const el = document.getElementById('gf-sweep'); if (!el) return;
    const dark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
    el.style.filter  = dark ? 'invert(1) hue-rotate(180deg)' : '';
    el.dataset.theme = dark ? 'dark' : 'light';
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* BUILD OVERLAY */
  function BuildOverlay() {
    if (document.getElementById('gf-sweep')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-sweep';

    const diffBtns = DIFFICULTIES.map(d =>
      `<button class="gf-sw-diff-btn${d.id === _diffId ? ' gf-sw-diff-active' : ''}" data-diff="${d.id}">${typeof d.label === 'function' ? d.label() : d.label}</button>`
    ).join('');

    root.innerHTML = `
<div id="gf-sw-modal">
  <div id="gf-sw-hdr">
    <div class="gf-sw-hl">
      <div id="gf-sw-logo">GS</div>
      <div>
        <div id="gf-sw-title">GradeSweeper</div>
        <div id="gf-sw-sub">${_GameText('game_sweep_subtitle')}</div>
      </div>
    </div>
    <div class="gf-sw-hr">
      <div class="gf-sw-lcd" title="${_GameText('game_sweep_flags')}">⚑ <span id="gf-sw-flags">010</span></div>
      <div class="gf-sw-lcd" title="${_GameText('game_sweep_elapsed')}">⏱ <span id="gf-sw-timer">000</span></div>
      <button id="gf-sw-new" title="${_GameText('game_new_game_r')}">↺</button>
      <button id="gf-sw-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-sw-diff">${diffBtns}</div>
  <div id="gf-sw-board-wrap">
    <div id="gf-sw-board" style="display:grid;gap:2px;padding:0;"></div>
    <div id="gf-sw-ovr-win"  style="display:none"></div>
    <div id="gf-sw-ovr-lose" style="display:none"></div>
  </div>
  <div id="gf-sw-hint">${_GameText('game_sweep_hint')}</div>
</div>`;

    document.body.appendChild(root);

    const brd = document.getElementById('gf-sw-board');
    brd.addEventListener('click',       OnBoardClick);
    brd.addEventListener('contextmenu', OnBoardContext);
    brd.addEventListener('touchstart',  OnBoardPointerDown, { passive: true });
    brd.addEventListener('touchend',    OnBoardPointerUp,   { passive: true });

    // Difficulty buttons
    document.getElementById('gf-sw-diff').addEventListener('click', e => {
      const btn = e.target.closest('[data-diff]'); if (!btn) return;
      _diffId = btn.dataset.diff;
      NewGame();
    });

    document.getElementById('gf-sw-new')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-sw-close')?.addEventListener('click', CloseGradeSweeper);
    document.getElementById('gf-sweep')?.addEventListener('click', e => { if (e.target.id === 'gf-sweep') BossKeySweeper(); });
  }

  /* PUBLIC API */
  function OpenGradeSweeper() {
    if (!document.getElementById('gf-sweep')) BuildOverlay();
    const el = document.getElementById('gf-sweep');
    el.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
    AttachKeys();
    if (!G) NewGame();
  }

  function CloseGradeSweeper() {
    const el = document.getElementById('gf-sweep');
    if (el) el.style.display = 'none';
    StopTimer();
    DetachKeys();
    _tobs.disconnect();
  }

  function BossKeySweeper() {
    const el = document.getElementById('gf-sweep'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      ResumeTimer();
      return true;
    }
    if (el.style.display !== 'none') {
      PauseTimer();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeSweeper  = OpenGradeSweeper;
  W.CloseGradeSweeper = CloseGradeSweeper;
  W.BossKeySweeper    = BossKeySweeper;

  function InjectCSS() {
    if (document.getElementById('gf-sweep-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-sweep-css';
    s.textContent = `
#gf-sweep {
  --sw-modal:#ffffff;--sw-hdr:#f5f5f5;--sw-brd:rgba(96,165,250,.22);--sw-brd2:#e0e0e0;
  --sw-cell-hidden:#c8c8c8;--sw-cell-revealed:#d8d8d8;--sw-cell-hover:#b8b8b8;
  --sw-txt:#111;--sw-txt2:#555;--sw-txt3:#999;--sw-lcd-bg:rgba(0,0,0,.08);
  --sw-sh:0 8px 40px rgba(0,0,0,.13),0 1px 4px rgba(0,0,0,.06);
  --sw-ovr:rgba(255,255,255,.93);--sw-btn-brd:#ccc;
}
#gf-sweep[data-theme="dark"] {
  --sw-modal:rgba(13,13,13,.97);--sw-hdr:rgba(8,8,8,.95);--sw-brd:rgba(96,165,250,.18);
  --sw-brd2:#1c1c1c;--sw-cell-hidden:#4a4a4a;--sw-cell-revealed:#2a2a2a;--sw-cell-hover:#3a3a3a;
  --sw-txt:#f0f0f0;--sw-txt2:#aaa;--sw-txt3:#555;--sw-lcd-bg:rgba(255,255,255,.07);
  --sw-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --sw-ovr:rgba(10,10,10,.92);--sw-btn-brd:#333;
}
#gf-sweep{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-sw-modal{display:flex;flex-direction:column;background:var(--sw-modal);border:1px solid var(--sw-brd);border-radius:12px;box-shadow:var(--sw-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
#gf-sw-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--sw-hdr);border-bottom:1px solid var(--sw-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-sw-hl{display:flex;align-items:center;gap:8px;} .gf-sw-hr{display:flex;align-items:center;gap:6px;}
#gf-sw-logo{width:28px;height:28px;background:#60a5fa;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:-0.5px;}
#gf-sw-title{font-size:14px;font-weight:700;color:var(--sw-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-sw-sub{font-size:9px;color:var(--sw-txt3);}
.gf-sw-lcd{display:flex;align-items:center;gap:4px;padding:3px 8px;background:var(--sw-lcd-bg);border:1px solid var(--sw-brd);border-radius:5px;font-size:11px;font-weight:700;color:var(--sw-txt);font-family:inherit;letter-spacing:.5px;min-width:56px;}
#gf-sw-new,#gf-sw-close{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--sw-btn-brd);border-radius:6px;background:transparent;color:var(--sw-txt2);cursor:pointer;font-size:13px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s;}
#gf-sw-new:hover{border-color:#60a5fa;color:#60a5fa;background:rgba(96,165,250,.1);}
#gf-sw-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-sw-diff{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid var(--sw-brd);flex-shrink:0;}
.gf-sw-diff-btn{padding:4px 12px;border:1px solid var(--sw-brd2);border-radius:6px;background:transparent;color:var(--sw-txt2);font-family:inherit;font-size:10px;font-weight:600;cursor:pointer;transition:border-color .12s,color .12s,background .12s;}
.gf-sw-diff-btn:hover{border-color:#60a5fa;color:#60a5fa;background:rgba(96,165,250,.08);}
.gf-sw-diff-active{border-color:#60a5fa!important;color:#60a5fa!important;background:rgba(96,165,250,.12)!important;}
#gf-sw-board-wrap{position:relative;margin:12px;border-radius:8px;overflow:hidden;flex-shrink:0;}
#gf-sw-board{display:grid;gap:2px;background:var(--sw-brd2);border-radius:6px;overflow:hidden;}
/* Cells */
.gf-sw-cell{display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:3px;cursor:pointer;transition:transform .08s,background .08s,box-shadow .06s;user-select:none;-webkit-user-select:none;line-height:1;}
.gf-sw-hidden{background:var(--sw-cell-hidden);box-shadow:inset -2px -2px 0 rgba(0,0,0,.25),inset 2px 2px 0 rgba(255,255,255,.5);}
.gf-sw-hidden:hover{background:var(--sw-cell-hover);transform:scale(.92);}
.gf-sw-flag{background:var(--sw-cell-hidden);box-shadow:inset -2px -2px 0 rgba(0,0,0,.25),inset 2px 2px 0 rgba(255,255,255,.5);color:#ef4444;cursor:default;}
.gf-sw-safe{background:var(--sw-cell-revealed);box-shadow:inset 1px 1px 0 rgba(0,0,0,.15);cursor:default;}
.gf-sw-num{background:var(--sw-cell-revealed);box-shadow:inset 1px 1px 0 rgba(0,0,0,.15);cursor:default;font-weight:800;}
.gf-sw-mine{background:#ef4444;color:#fff;cursor:default;font-size:clamp(6px,60%,11px)!important;font-weight:700;animation:sw-mine-pop 220ms ease-out both;line-height:1.1;text-align:center;}
.gf-sw-mine-reveal{background:#dc2626;}
.gf-sw-mine.gf-sw-mine-hit{background:#ff2020;box-shadow:0 0 0 2px #fff,0 0 0 4px #ff2020;z-index:2;position:relative;}
@keyframes sw-mine-pop{0%{transform:scale(.55);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes sw-appear{0%{transform:scale(.8);opacity:.4}100%{transform:scale(1);opacity:1}}
/* Overlays */
#gf-sw-ovr-win,#gf-sw-ovr-lose{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--sw-ovr);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:24px;border-radius:8px;text-align:center;}
.gf-sw-ovr-icon{font-size:36px;line-height:1;}
.gf-sw-ovr-title{font-size:22px;font-weight:800;letter-spacing:-.5px;color:var(--sw-txt);}
.gf-sw-ovr-sub{font-size:10px;color:var(--sw-txt2);}
.gf-sw-btn{padding:9px 22px;border:1px solid #60a5fa;border-radius:7px;background:rgba(96,165,250,.12);color:#60a5fa;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px;transition:background .14s,box-shadow .14s,transform .12s;}
.gf-sw-btn:hover{background:rgba(96,165,250,.22);box-shadow:0 4px 20px rgba(96,165,250,.3);transform:translateY(-1px);}
#gf-sw-hint{font-size:9px;color:var(--sw-txt3);text-align:center;padding:6px 14px 10px;flex-shrink:0;}
`;
    document.head.appendChild(s);
  }

})(window);
