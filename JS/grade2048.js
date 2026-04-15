;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  /* CONFIG */
  const GRID    = 4;
  const CELL    = 82;   // px per tile
  const GAP     = 8;    // px gap
  const PAD     = 10;   // grid padding
  const WIN_VAL = 2048;
  const ANIM_MS = 115;
  const LS_BEST = 'gf-2048-best';

  const TD = {
    2:    { label: '1/20',  Pct: '5%',   bg: '#ef4444', fg: '#fff',    glow: 'rgba(239,68,68,.50)'   },
    4:    { label: '2/20',  Pct: '10%',  bg: '#f97316', fg: '#fff',    glow: 'rgba(249,115,22,.50)'  },
    8:    { label: '4/20',  Pct: '20%',  bg: '#f59e0b', fg: '#1a1a1a', glow: 'rgba(245,158,11,.45)'  },
    16:   { label: '6/20',  Pct: '30%',  bg: '#fbbf24', fg: '#1a1a1a', glow: 'rgba(251,191,36,.45)'  },
    32:   { label: '8/20',  Pct: '40%',  bg: '#a3e635', fg: '#1a1a1a', glow: 'rgba(163,230,53,.45)'  },
    64:   { label: '10/20', Pct: '50%',  bg: '#4ade80', fg: '#1a1a1a', glow: 'rgba(74,222,128,.50)'  },
    128:  { label: '12/20', Pct: '60%',  bg: '#22c55e', fg: '#fff',    glow: 'rgba(34,197,94,.50)'   },
    256:  { label: '14/20', Pct: '70%',  bg: '#10b981', fg: '#fff',    glow: 'rgba(16,185,129,.50)'  },
    512:  { label: '16/20', Pct: '80%',  bg: '#06b6d4', fg: '#fff',    glow: 'rgba(6,182,212,.50)'   },
    1024: { label: '18/20', Pct: '90%',  bg: '#8b5cf6', fg: '#fff',    glow: 'rgba(139,92,246,.55)'  },
    2048: { label: '20/20', Pct: '100%', bg: '#f59e0b', fg: '#1a1a1a', glow: 'rgba(245,158,11,.80)', perfect: true },
  };
  function GetTileData(v) {
    return TD[v] || { label: `${v}`, Pct: '', bg: '#a78bfa', fg: '#fff', glow: 'rgba(167,139,250,.5)' };
  }
  function TileFontSize(v) { return v >= 1024 ? 15 : v >= 128 ? 17 : 19; } // label font-size px

  /* PERSISTENCE */
  function GetBestScore()  { try { return +localStorage.getItem(LS_BEST) || 0; } catch (_) { return 0; } }
  function SetBestScore(n) { try { if (n > GetBestScore()) localStorage.setItem(LS_BEST, n); } catch (_) {} }

  let G   = null;
  let _id = 0;

  function EmptyBoard() { return Array.from({ length: GRID }, () => Array(GRID).fill(0)); }

  function NewGame() {
    _id = 0;
    G = { board: EmptyBoard(), tiles: new Map(), score: 0, best: GetBestScore(),
          status: 'playing', wonShown: false, locked: false };
    SpawnTile(); SpawnTile();
    RenderBoard(); HideOverlays();
  }

  function SpawnTile() {
    const pool = [];
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (!G.board[r][c]) pool.push([r, c]);
    if (!pool.length) return false;
    const [r, c] = pool[Math.floor(Math.random() * pool.length)];
    const val = Math.random() < 0.85 ? 2 : 4;
    const id  = ++_id;
    G.board[r][c] = id;
    G.tiles.set(id, { id, val, row: r, col: c, isNew: true, isMerged: false });
    return true;
  }

  /* MOVE */
  function GetLineIds(a, dir) {
    const order = (dir === 'right' || dir === 'down') ? [3, 2, 1, 0] : [0, 1, 2, 3];
    return order.map(b => dir === 'left' || dir === 'right' ? G.board[a][b] : G.board[b][a]).filter(Boolean);
  }
  function ToRowCol(a, pos, dir) {
    const idx = (dir === 'right' || dir === 'down') ? GRID - 1 - pos : pos;
    return dir === 'left' || dir === 'right' ? [a, idx] : [idx, a];
  }

  function DoMove(dir) {
    if (!G || G.locked || G.status !== 'playing') return;
    G.locked = true;

    const moves   = new Map(); // id -> { toRow, toCol }
    const absorbs = new Map(); // absorbedId -> { toRow, toCol } (slides to merge pos then vanishes)
    const merges  = new Map(); // id -> newVal
    const newBoard = EmptyBoard();
    let totalScore = 0, anythingMoved = false;

    for (let a = 0; a < GRID; a++) {
      const ids = GetLineIds(a, dir);
      if (!ids.length) continue;

      // Slide + merge
      const result = [];
      let i = 0;
      while (i < ids.length) {
        const va = G.tiles.get(ids[i]).val;
        if (i + 1 < ids.length && va === G.tiles.get(ids[i + 1]).val) {
          const nv = va * 2;
          result.push({ id: ids[i], newVal: nv, absorbedId: ids[i + 1] });
          totalScore += nv; i += 2;
        } else {
          result.push({ id: ids[i], newVal: va, absorbedId: null });
          i++;
        }
      }

      result.forEach((p, pos) => {
        const [toR, toC] = ToRowCol(a, pos, dir);
        const t = G.tiles.get(p.id);
        if (t.row !== toR || t.col !== toC) anythingMoved = true;
        moves.set(p.id, { toRow: toR, toCol: toC });
        if (p.absorbedId) absorbs.set(p.absorbedId, { toRow: toR, toCol: toC });
        if (p.newVal !== t.val) merges.set(p.id, p.newVal);
        newBoard[toR][toC] = p.id;
      });
    }

    if (!anythingMoved && !absorbs.size) { G.locked = false; return; }

    G.board = newBoard;

    function AnimSlide(id, toRow, toCol) {
      const t  = G.tiles.get(id); if (!t) return;
      const el = document.getElementById(`gf28t-${id}`); if (!el) return;
      const dx = (toCol - t.col) * (CELL + GAP);
      const dy = (toRow - t.row) * (CELL + GAP);
      el.style.transition = `transform ${ANIM_MS}ms ease-in-out`;
      el.style.transform  = `translate(${dx}px,${dy}px)`;
    }
    moves.forEach(({ toRow, toCol }, id) => AnimSlide(id, toRow, toCol));
    absorbs.forEach(({ toRow, toCol }, id) => AnimSlide(id, toRow, toCol));

    setTimeout(() => {
      moves.forEach(({ toRow, toCol }, id) => {
        const t = G.tiles.get(id);
        if (t) { t.row = toRow; t.col = toCol; t.isNew = false; }
      });
      merges.forEach((newVal, id) => {
        const t = G.tiles.get(id); if (t) { t.val = newVal; t.isMerged = true; }
      });
      absorbs.forEach((_, id) => { G.tiles.delete(id); document.getElementById(`gf28t-${id}`)?.remove(); });

      G.score += totalScore;
      if (G.score > G.best) { G.best = G.score; SetBestScore(G.best); }

      SpawnTile();

      let hasWin = false;
      G.tiles.forEach(t => { if (t.val >= WIN_VAL) hasWin = true; });
      if (hasWin && !G.wonShown) { G.wonShown = true; G.status = 'won'; }
      else if (!CanMove()) G.status = 'gameover';

      G.locked = false;
      RenderBoard();
      if (G.status !== 'playing') setTimeout(ShowOverlay, 250);
    }, ANIM_MS + 15);
  }

  function CanMove() {
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      if (!G.board[r][c]) return true;
      const v = G.tiles.get(G.board[r][c])?.val;
      if (c + 1 < GRID && G.tiles.get(G.board[r][c + 1])?.val === v) return true;
      if (r + 1 < GRID && G.tiles.get(G.board[r + 1][c])?.val === v) return true;
    }
    return false;
  }

  /* RENDERING */
  function CreateTileElement(t) {
    const { id, val, row, col, isNew, isMerged } = t;
    const d  = GetTileData(val);
    const x  = PAD + col * (CELL + GAP);
    const y  = PAD + row * (CELL + GAP);
    const el = document.createElement('div');
    el.id    = `gf28t-${id}`;
    el.className = 'gf28-tile' +
      (isNew    ? ' gf28-tile-new'    : '') +
      (isMerged ? ' gf28-tile-merge'  : '') +
      (d.perfect ? ' gf28-tile-perfect' : '');
    el.style.cssText = `left:${x}px;top:${y}px;background:${d.bg};color:${d.fg};` +
      `box-shadow:0 4px 18px ${d.glow},inset 0 1px 0 rgba(255,255,255,.15);`;
    el.innerHTML =
      `<span class="gf28-lbl" style="font-size:${TileFontSize(val)}px">${d.label}</span>` +
      `<span class="gf28-pct">${d.Pct}</span>`;
    t.isNew = false; t.isMerged = false;
    return el;
  }

  function RenderBoard() {
    const layer = document.getElementById('gf28-tile-layer');
    if (!layer) return;
    layer.innerHTML = '';
    G.tiles.forEach(t => layer.appendChild(CreateTileElement(t)));
    UpdateScore();
  }

  function UpdateScore() {
    const s = document.getElementById('gf-28-score'); if (s) s.textContent = G.score.toLocaleString();
    const b = document.getElementById('gf-28-best');  if (b) b.textContent = G.best.toLocaleString();
  }

  function HideOverlays() {
    ['gf-28-ovr-win', 'gf-28-ovr-over'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
  }
  function ShowOverlay() {
    if (G.status === 'won') {
      const el = document.getElementById('gf-28-ovr-win'); if (el) el.style.display = 'flex';
    } else if (G.status === 'gameover') {
      const el = document.getElementById('gf-28-ovr-over');
      if (el) {
        el.style.display = 'flex';
        const sc = el.querySelector('#gf-28-ovr-score');
        if (sc) sc.textContent = `${_GameText('game_score')}: ${G.score.toLocaleString()}`;
      }
    }
  }

  /* INPUT */
  const DIR_MAP = {
    ArrowLeft:'left',a:'left',A:'left',
    ArrowRight:'right',d:'right',D:'right',
    ArrowUp:'up',w:'up',W:'up',
    ArrowDown:'down',s:'down',S:'down',
  };
  let _kh = null;
  function OnKey(e) {
    const el = document.getElementById('gf-2048');
    if (!el || el.style.display === 'none') return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGrade2048(); return; }
    if (e.key === 'F8')     { e.preventDefault(); e.stopPropagation(); return; } // handled by content.js
    const dir = DIR_MAP[e.key];
    if (dir) { e.preventDefault(); e.stopPropagation(); DoMove(dir); }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  function AddSwipe(el) {
    let sx, sy;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 30) return;
      DoMove(adx > ady ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });
  }

  /* THEME */
  function ApplyTheme() {
    const el = document.getElementById('gf-2048'); if (!el) return;
    const dark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
    el.style.filter  = dark ? 'invert(1) hue-rotate(180deg)' : '';
    el.dataset.theme = dark ? 'dark' : 'light';
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* BUILD OVERLAY */
  const GW = GRID * CELL + (GRID - 1) * GAP + PAD * 2; // grid total px

  function BuildOverlay() {
    if (document.getElementById('gf-2048')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-2048';
    const bgCells = Array.from({ length: GRID * GRID }, () => '<div class="gf28-cell"></div>').join('');
    root.innerHTML = `
<div id="gf-28-modal">
  <div id="gf-28-hdr">
    <div class="gf-28-hl">
      <div id="gf-28-logo">G</div>
      <div>
        <div id="gf-28-title">Grade 2048</div>
        <div id="gf-28-sub">${_GameText('game_2048_subtitle')}</div>
      </div>
    </div>
    <div class="gf-28-hr">
      <div class="gf-28-sbox"><div class="gf-28-slbl">${_GameText('game_score').toUpperCase()}</div><div id="gf-28-score">0</div></div>
      <div class="gf-28-sbox"><div class="gf-28-slbl">${_GameText('game_best').toUpperCase()}</div><div id="gf-28-best">0</div></div>
      <button id="gf-28-new" title="${_GameText('game_new_game')}">↺</button>
      <button id="gf-28-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-28-body">
    <div id="gf-28-grid-wrap" style="width:${GW}px;height:${GW}px;">
      <div id="gf-28-bg-grid">${bgCells}</div>
      <div id="gf28-tile-layer"></div>
      <div id="gf-28-ovr-win" style="display:none">
        <div class="gf28-ovr-icon">🏆</div>
        <div class="gf28-ovr-title" style="color:#f59e0b">${_GameText('game_2048_perfect')}</div>
        <div class="gf28-ovr-sub">${_GameText('game_2048_reached')}</div>
        <button class="gf28-btn" id="gf-28-continue">${_GameText('game_2048_keep_going')} -></button>
        <button class="gf28-btn gf28-btn-sec" id="gf-28-new2">${_GameText('game_new_game')}</button>
      </div>
      <div id="gf-28-ovr-over" style="display:none">
        <div class="gf28-ovr-icon">📝</div>
        <div class="gf28-ovr-title" style="color:#f87171">${_GameText('game_2048_no_moves')}</div>
        <div id="gf-28-ovr-score" class="gf28-ovr-sub"></div>
        <button class="gf28-btn" id="gf-28-retry">${_GameText('game_try_again')} ↺</button>
      </div>
    </div>
    <div id="gf-28-legend">
      ${Object.entries(TD).map(([, d]) =>
        `<div class="gf28-leg" style="background:${d.bg};color:${d.fg};box-shadow:0 2px 8px ${d.glow}">${d.label}${d.perfect ? ' ✦' : ''}</div>`
      ).join('')}
    </div>
    <div id="gf-28-hint">${_GameText('game_2048_hint')}</div>
  </div>
</div>`;
    document.body.appendChild(root);

    document.getElementById('gf-28-close')  ?.addEventListener('click', CloseGrade2048);
    document.getElementById('gf-28-new')    ?.addEventListener('click', NewGame);
    document.getElementById('gf-2048')?.addEventListener('click', e => { if (e.target.id === 'gf-2048') BossKey2048(); });
    document.getElementById('gf-28-new2')   ?.addEventListener('click', NewGame);
    document.getElementById('gf-28-retry')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-28-continue')?.addEventListener('click', () => {
      G.status = 'playing'; HideOverlays();
    });
    AddSwipe(document.getElementById('gf-28-grid-wrap'));
  }

  /* PUBLIC API */
  function OpenGrade2048() {
    if (!document.getElementById('gf-2048')) BuildOverlay();
    const el = document.getElementById('gf-2048');
    el.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
    AttachKeys();
    if (!G) NewGame(); else RenderBoard();
  }

  function CloseGrade2048() {
    const el = document.getElementById('gf-2048');
    if (el) el.style.display = 'none';
    DetachKeys(); _tobs.disconnect();
  }

  function ToggleGrade2048() {
    const el = document.getElementById('gf-2048');
    if (el && el.style.display !== 'none') CloseGrade2048(); else OpenGrade2048();
  }

  function BossKey2048() {
    const el = document.getElementById('gf-2048'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex'; delete el.dataset.bossHidden; return true;
    }
    if (el.style.display !== 'none') {
      el.style.display = 'none'; el.dataset.bossHidden = '1'; return true;
    }
    return false;
  }

  W.OpenGrade2048  = OpenGrade2048;
  W.CloseGrade2048 = CloseGrade2048;
  W.ToggleGrade2048 = ToggleGrade2048;
  W.BossKey2048    = BossKey2048;

  function InjectCSS() {
    if (document.getElementById('gf-2048-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-2048-css';
    s.textContent = `
#gf-2048 {
  --g2-modal:#ffffff;--g2-hdr:#f5f5f5;--g2-brd:rgba(245,158,11,.2);--g2-brd2:#e0e0e0;
  --g2-cell:rgba(0,0,0,.06);--g2-txt:#111;--g2-txt2:#555;--g2-txt3:#999;
  --g2-btn:#eee;--g2-btn-brd:#ccc;--g2-sbox:rgba(0,0,0,.05);
  --g2-sh:0 8px 40px rgba(0,0,0,.13),0 1px 4px rgba(0,0,0,.06);
  --g2-ovr:rgba(255,255,255,.92);
}
#gf-2048[data-theme="dark"] {
  --g2-modal:rgba(13,13,13,.97);--g2-hdr:rgba(8,8,8,.95);--g2-brd:rgba(245,158,11,.18);
  --g2-brd2:#222;--g2-cell:rgba(255,255,255,.05);--g2-txt:#f0f0f0;--g2-txt2:#aaa;--g2-txt3:#555;
  --g2-btn:#1c1c1c;--g2-btn-brd:#333;--g2-sbox:rgba(255,255,255,.06);
  --g2-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --g2-ovr:rgba(10,10,10,.90);
}
#gf-2048{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-28-modal{display:flex;flex-direction:column;background:var(--g2-modal);border:1px solid var(--g2-brd);border-radius:14px;box-shadow:var(--g2-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
#gf-28-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--g2-hdr);border-bottom:1px solid var(--g2-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-28-hl{display:flex;align-items:center;gap:10px;} .gf-28-hr{display:flex;align-items:center;gap:6px;}
#gf-28-logo{width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0;}
#gf-28-title{font-size:14px;font-weight:700;color:var(--g2-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-28-sub{font-size:9px;color:var(--g2-txt3);}
.gf-28-sbox{display:flex;flex-direction:column;align-items:center;padding:4px 10px;background:var(--g2-sbox);border-radius:6px;min-width:52px;}
.gf-28-slbl{font-size:7px;font-weight:600;letter-spacing:1.5px;color:var(--g2-txt3);}
.gf-28-sbox > div:last-child{font-size:16px;font-weight:700;color:var(--g2-txt);line-height:1.2;}
#gf-28-new,#gf-28-close{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--g2-btn-brd);border-radius:6px;background:var(--g2-btn);color:var(--g2-txt2);cursor:pointer;font-size:13px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s;}
#gf-28-new:hover{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.1);}
#gf-28-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-28-body{display:flex;flex-direction:column;align-items:center;padding:14px;gap:10px;overflow-y:auto;}
#gf-28-grid-wrap{position:relative;flex-shrink:0;border-radius:10px;overflow:hidden;}
#gf-28-bg-grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(${GRID},${CELL}px);grid-template-rows:repeat(${GRID},${CELL}px);gap:${GAP}px;padding:${PAD}px;background:var(--g2-brd2);border-radius:10px;}
.gf28-cell{background:var(--g2-cell);border-radius:8px;}
#gf28-tile-layer{position:absolute;inset:0;pointer-events:none;}
.gf28-tile{position:absolute;width:${CELL}px;height:${CELL}px;border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-family:inherit;pointer-events:none;will-change:transform;}
.gf28-lbl{font-weight:800;letter-spacing:-.5px;line-height:1;}
.gf28-pct{font-size:10px;font-weight:600;opacity:.75;line-height:1;}
@keyframes gf28-appear{0%{transform:scale(0);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes gf28-pop{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes gf28-pulse{0%,100%{box-shadow:0 4px 18px rgba(245,158,11,.8),0 0 40px rgba(245,158,11,.6),inset 0 1px 0 rgba(255,255,255,.2)}50%{box-shadow:0 4px 28px rgba(245,158,11,1),0 0 60px rgba(245,158,11,.8),inset 0 1px 0 rgba(255,255,255,.2)}}
.gf28-tile-new{animation:gf28-appear 160ms ease-out both;}
.gf28-tile-merge{animation:gf28-pop 200ms ease-out both;}
.gf28-tile-perfect{animation:gf28-pulse 1.4s ease-in-out infinite;}
/* Overlays */
#gf-28-ovr-win,#gf-28-ovr-over{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--g2-ovr);border-radius:10px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:24px;}
.gf28-ovr-icon{font-size:36px;line-height:1;}
.gf28-ovr-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;}
.gf28-ovr-sub{font-size:11px;color:var(--g2-txt2);}
.gf28-btn{padding:9px 22px;border:1px solid #f59e0b;border-radius:7px;background:rgba(245,158,11,.12);color:#f59e0b;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px;transition:background .14s,box-shadow .14s,transform .12s;}
.gf28-btn:hover{background:rgba(245,158,11,.22);box-shadow:0 4px 20px rgba(245,158,11,.3);transform:translateY(-1px);}
.gf28-btn-sec{border-color:var(--g2-btn-brd);color:var(--g2-txt2);background:transparent;}
.gf28-btn-sec:hover{background:rgba(128,128,128,.1);box-shadow:none;transform:translateY(-1px);}
/* Legend */
#gf-28-legend{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:${GW}px;}
.gf28-leg{padding:3px 7px;border-radius:5px;font-size:9px;font-weight:700;letter-spacing:.3px;white-space:nowrap;}
/* Hint */
#gf-28-hint{font-size:9px;color:var(--g2-txt3);text-align:center;max-width:${GW}px;line-height:1.6;}
#gf-28-hint strong{color:var(--g2-txt2);}
`;
    document.head.appendChild(s);
  }

})(window);
