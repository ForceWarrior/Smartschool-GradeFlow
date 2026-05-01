;(function (W) {
  'use strict';

  let _gtLang = null;
  try { chrome.storage?.sync?.get('gf-lang', r => { _gtLang = r?.['gf-lang'] || null; }); } catch (_) {}
  function _GameText(key) {
    if (typeof GF_LANGS === 'undefined') return key;
    let code = _gtLang;
    if (!code || code === 'auto' || code === 'custom') {
      const nav = (navigator.language || 'nl').split('-')[0].toLowerCase();
      code = (GF_LANGS[nav]) ? nav : 'nl';
    }
    if (!GF_LANGS[code]) code = 'nl';
    return GF_LANGS[code]?.[key] ?? GF_LANGS['nl']?.[key] ?? key;
  }

  const GAMES = [
    {
      id: 'gradestack',
      title: 'GradeStack',
      descKey: 'game_gradestack_desc',
      desc: 'Classic block stacking powered by your grades',
      accent: '#f97316',
      ready: true,
      buildPreview: PreviewTetris,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeTetris === 'function') OpenGradeTetris(gr); },
      stop()     { if (typeof CloseGradeTetris === 'function') CloseGradeTetris(); },
    },
    {
      id: 'gradesnake',
      title: 'GradeSnake',
      descKey: 'game_gradesnake_desc',
      desc: 'Guide the snake through your report card',
      accent: '#4ade80',
      ready: true,
      buildPreview: PreviewSnake,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeSnake === 'function') OpenGradeSnake(gr); },
      stop()     { if (typeof CloseGradeSnake === 'function') CloseGradeSnake(); },
    },
    {
      id: 'grade2048',
      title: 'Grade 2048',
      descKey: 'game_grade2048_desc',
      desc: 'Merge weak grades into stronger ones - reach 20/20!',
      accent: '#f59e0b',
      ready: true,
      buildPreview: Preview2048,
      launch(gr) { CloseGameMenu(); if (typeof OpenGrade2048 === 'function') OpenGrade2048(gr); },
      stop()     { if (typeof CloseGrade2048 === 'function') CloseGrade2048(); },
    },
    {
      id: 'gradesweeper',
      title: 'GradeSweeper',
      descKey: 'game_gradesweeper_desc',
      desc: 'Reveal all safe grades without uncovering a fail',
      accent: '#60a5fa',
      ready: true,
      buildPreview: PreviewMinesweeper,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeSweeper === 'function') OpenGradeSweeper(gr); },
      stop()     { if (typeof CloseGradeSweeper === 'function') CloseGradeSweeper(); },
    },
    {
      id: 'gradememory',
      title: 'GradeMemory',
      descKey: 'game_gradememory_desc',
      desc: 'Flip grade cards and match every pair from memory',
      accent: '#a78bfa',
      ready: true,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeMemory === 'function') OpenGradeMemory(gr); },
      stop()     { if (typeof CloseGradeMemory === 'function') CloseGradeMemory(); },
      buildPreview: PreviewMemory,
    },
    {
      id: 'gradeshooter',
      title: 'GradeShooter',
      descKey: 'game_gradeshooter_desc',
      desc: 'Fire grade bubbles and match 3+ of the same band to clear',
      accent: '#22d3ee',
      ready: true,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeShooter === 'function') OpenGradeShooter(gr); },
      stop()     { if (typeof CloseGradeShooter === 'function') CloseGradeShooter(); },
      buildPreview: PreviewShooter,
    },
    {
      id: 'gradebreakout',
      title: 'GradeBreakout',
      descKey: 'game_gradebreakout_desc',
      desc: 'Smash grade bricks with the ball and rack up points',
      accent: '#f43f5e',
      ready: true,
      buildPreview: PreviewBreakout,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeBreakout === 'function') OpenGradeBreakout(gr); },
      stop()     { if (typeof CloseGradeBreakout === 'function') CloseGradeBreakout(); },
    },
    {
      id: 'gradepong',
      title: 'GradePong',
      descKey: 'game_gradepong_desc',
      desc: 'Beat the AI in a grade-powered game of pong',
      accent: '#06b6d4',
      ready: true,
      buildPreview: PreviewPong,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradePong === 'function') OpenGradePong(gr); },
      stop()     { if (typeof CloseGradePong === 'function') CloseGradePong(); },
    },
    {
      id: 'gradeflappy',
      title: 'GradeFlappy',
      descKey: 'game_gradeflappy_desc',
      desc: 'Fly through the pipes and dodge bad grades',
      accent: '#eab308',
      ready: true,
      buildPreview: PreviewFlappy,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeFlappy === 'function') OpenGradeFlappy(gr); },
      stop()     { if (typeof CloseGradeFlappy === 'function') CloseGradeFlappy(); },
    },
    {
      id: 'graderunner',
      title: 'GradeRunner',
      descKey: 'game_graderunner_desc',
      desc: 'Sprint, jump, and slide through a grade-powered endless run',
      accent: '#4ade80',
      ready: true,
      buildPreview: PreviewRunner,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeRunner === 'function') OpenGradeRunner(gr); },
      stop()     { if (typeof CloseGradeRunner === 'function') CloseGradeRunner(); },
    },
    {
      id: 'gradetower',
      title: 'GradeTower',
      descKey: 'game_gradetower_desc',
      desc: 'Build tiny grade towers and defend your report path',
      accent: '#22d3ee',
      ready: true,
      buildPreview: PreviewTower,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeTower === 'function') OpenGradeTower(gr); },
      stop()     { if (typeof CloseGradeTower === 'function') CloseGradeTower(); },
    },
  ];

  W._gfGames = GAMES;

  let _el = null, _grades = [], _activeId = null, _kh = null;

  /* Shared preview loop: all previews share one RAF at ~12 fps */
  const _previewTicks = [];
  let _previewRaf = null;
  let _previewLastTs = 0;
  const PREVIEW_INTERVAL = 33; // ~30 fps, smooth enough for previews

  function _PreviewLoop(ts) {
    _previewRaf = null;
    if (!_previewTicks.length) return;
    const elapsed = ts - _previewLastTs;
    if (elapsed >= PREVIEW_INTERVAL) {
      _previewLastTs = ts - (elapsed % PREVIEW_INTERVAL); // keep cadence steady
      for (let i = _previewTicks.length - 1; i >= 0; i--) {
        if (!_previewTicks[i](ts)) _previewTicks.splice(i, 1);
      }
    }
    if (_previewTicks.length) _previewRaf = requestAnimationFrame(_PreviewLoop);
  }

  function RegisterPreview(tickFn) {
    _previewTicks.push(tickFn);
    if (!_previewRaf) _previewRaf = requestAnimationFrame(_PreviewLoop);
  }

  function StopAllPreviews() {
    _previewTicks.length = 0;
    if (_previewRaf) { cancelAnimationFrame(_previewRaf); _previewRaf = null; }
  }

  /* Utilities */
  function RandomInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function CreateCanvas(el, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    el.appendChild(cv);
    return cv;
  }

  /* Theme */
  function SyncTheme() {
    if (!_el) return;
    if (typeof W._GfApplyThemeToHost === 'function') W._GfApplyThemeToHost(_el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      _el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      _el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }

  const _tobs = new MutationObserver(SyncTheme);

  /* Build menu DOM */
  function Build() {
    if (_el) return;
    InjectCSS();

    _el = document.createElement('div');
    _el.id = 'gf-arcade';

    const playable = GAMES.filter(g => g.ready).length;
    const cards = GAMES.map(g => `
      <div class="gf-gc${g.ready ? '' : ' gf-gc-soon'}" data-gid="${g.id}">
        <div class="gf-gc-prev" id="gf-gp-${g.id}"></div>
        <div class="gf-gc-body">
          <div class="gf-gc-title" style="color:${g.accent}">${g.title}</div>
          <div class="gf-gc-desc">${g.descKey ? _GameText(g.descKey) : g.desc}</div>
        </div>
        <button class="gf-gc-play" data-play="${g.id}"${g.ready ? '' : ' disabled'}>
          ${g.ready ? '▶ ' + _GameText('game_play') : _GameText('game_coming_soon')}
        </button>
      </div>`).join('');

    _el.innerHTML = `
    <div id="gf-arc-modal">
      <div id="gf-arc-hdr">
        <div class="gf-arc-hl">
          <div id="gf-arc-icon">GF</div>
          <span id="gf-arc-t">${_GameText('game_arcade')}</span>
          <span id="gf-arc-badge">${playable} ${_GameText('game_games')}</span>
        </div>
        <div class="gf-arc-hr">
          <kbd class="gf-arc-key">F8</kbd>
          <button id="gf-arc-x" title="${_GameText('game_close_esc')}">✕</button>
        </div>
      </div>
      <div id="gf-arc-grid">${cards}</div>
    </div>`;

    document.body.appendChild(_el);

    document.getElementById('gf-arc-x').addEventListener('click', CloseGameMenu);
    _el.addEventListener('click', e => {
      if (e.target === _el) CloseGameMenu();
      const btn = e.target.closest('[data-play]');
      if (btn && !btn.disabled) {
        const g = GAMES.find(x => x.id === btn.dataset.play);
        if (g) LaunchGame(g);
      }
    });

  }

  function RenderPreviews() {
    StopAllPreviews();
    for (const g of GAMES) {
      const c = document.getElementById(`gf-gp-${g.id}`);
      if (!c || !g.buildPreview) continue;
      c.textContent = '';
      g.buildPreview(c, g.accent);
    }
  }

  /* CANVAS PREVIEW ANIMATIONS */

  function PreviewTetris(el, accent) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const COLS = 7, ROWS = 8;
    const CW = W / COLS, CH = H / ROWS;
    const CLRS = ['#4ade80', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa', '#a3e635'];

    function DrawCell(x, y, color, alpha) {
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + 1, y + 1, CW - 2, 2);
      ctx.fillRect(x + 1, y + 1, 2, CH - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + 1, y + CH - 3, CW - 2, 2);
      ctx.globalAlpha = 1;
    }

    const INIT_ROWS = [
      [0, 1, 2, null, 3, 4, null],
      [4, 0, null, 1, 2, null, 3],
      [1, 4, 2, 0, null, 3, 4],
    ];

    function MakeBoard() {
      const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      INIT_ROWS.forEach((row, i) => {
        b[ROWS - 1 - i] = row.map(v => v === null ? null : CLRS[v]);
      });
      return b;
    }

    // Piece shapes
    const PIECES = [
      { cells: [[0,0],[1,0],[2,0],[1,1]], color: accent },       // T
      { cells: [[0,0],[1,0],[1,1],[2,1]], color: '#a78bfa' },    // S
      { cells: [[0,1],[1,1],[2,1],[2,0]], color: '#60a5fa' },    // L
      { cells: [[0,0],[1,0],[2,0],[3,0]], color: '#4ade80' },    // I
      { cells: [[0,0],[0,1],[1,1],[1,0]], color: '#fbbf24' },    // O
    ];

    let board = MakeBoard();
    let piece = null, pRow = 0, pCol = 2;
    let flashRows = [], flashTimer = 0, Frame = 0;
    let phase = 'fall';

    function Spawn() {
      piece = PIECES[Math.floor(Math.random() * PIECES.length)];
      pRow = -1;
      pCol = RandomInt(0, COLS - (piece.id === 3 ? 4 : 3));
      pCol = Math.max(0, Math.min(pCol, COLS - piece.cells.reduce((m, [c]) => Math.max(m, c + 1), 0)));
      phase = 'fall';
      Frame = 0;
    }

    function CanDown() {
      for (const [dc, dr] of piece.cells) {
        const nr = pRow + dr + 1, nc = pCol + dc;
        if (nr >= ROWS) return false;
        if (nr >= 0 && nc >= 0 && nc < COLS && board[nr][nc]) return false;
      }
      return true;
    }

    function Lock() {
      for (const [dc, dr] of piece.cells) {
        const r = pRow + dr, c = pCol + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) board[r][c] = piece.color;
      }
      flashRows = board.reduce((a, row, i) => { if (row.every(x => x)) a.push(i); return a; }, []);
      if (flashRows.length) { phase = 'flash'; flashTimer = 0; }
      else CheckFull();
    }

    function CheckFull() {
      const filled = board.filter(r => r.some(x => x)).length;
      if (filled > 6) board = MakeBoard();
      Spawn();
    }

    function ClearFlash() {
      for (const r of [...flashRows].reverse()) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); }
      flashRows = [];
      CheckFull();
    }

    Spawn();

    function Tick() {
      if (!cv.isConnected) return false;
      Frame++;

      if (phase === 'fall' && Frame % 7 === 0) {
        if (CanDown()) pRow++;
        else Lock();
      } else if (phase === 'flash') {
        flashTimer++;
        if (flashTimer > 28) ClearFlash();
      }

      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 0.5;
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CH); ctx.lineTo(W, r * CH); ctx.stroke(); }
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CW, 0); ctx.lineTo(c * CW, H); ctx.stroke(); }

      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (!board[r][c]) continue;
        const fl = flashRows.includes(r);
        const alpha = fl ? (0.4 + 0.6 * Math.abs(Math.sin(flashTimer * 0.25))) : 1;
        DrawCell(c * CW, r * CH, fl ? '#fff' : board[r][c], alpha);
      }

      if (phase === 'fall' && piece) {
        let GhostRow = pRow;
        while (true) {
          let ok = true;
          for (const [dc, dr] of piece.cells) {
            const nr = GhostRow + dr + 1, nc = pCol + dc;
            if (nr >= ROWS || (nr >= 0 && nc >= 0 && nc < COLS && board[nr][nc])) { ok = false; break; }
          }
          if (!ok) break;
          GhostRow++;
        }
        if (GhostRow !== pRow) {
          for (const [dc, dr] of piece.cells) {
            const r = GhostRow + dr, c = pCol + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
              ctx.fillStyle = piece.color + '28';
              ctx.fillRect(c * CW + 1, r * CH + 1, CW - 2, CH - 2);
            }
          }
        }
        for (const [dc, dr] of piece.cells) {
          const r = pRow + dr, c = pCol + dc;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) DrawCell(c * CW, r * CH, piece.color);
        }
      }

      return true;
    }
    RegisterPreview(Tick);
  }

  // GradeSnake
  function PreviewSnake(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const COLS = 8, ROWS = 5;
    const CW = W / COLS, CH = H / ROWS;
    const STEP_MS = 310;

    const GRADES = [
      { Pct: 82, color: '#4ade80', eff: '++' },
      { Pct: 61, color: '#a3e635', eff: '+' },
      { Pct: 36, color: '#f97316', eff: '−' },
      { Pct: 14, color: '#f87171', eff: '--' },
    ];

    let snake     = [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    let prevSeg   = snake.map(s => ({ ...s }));
    let dir       = { x: 1, y: 0 };
    let foods     = [{ x: 6, y: 1, g: GRADES[0] }, { x: 5, y: 4, g: GRADES[2] }];
    let growing   = 0, moveT = 0, lastTs = 0;
    let deathFlash = 0, toxicity = 0;

    function Occ() {
      const s = new Set();
      snake.forEach(p => s.add(`${p.x},${p.y}`));
      foods.forEach(f => s.add(`${f.x},${f.y}`));
      return s;
    }
    function SpawnFood() {
      const o = Occ(), pool = [];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!o.has(`${x},${y}`)) pool.push({ x, y });
      if (!pool.length) return;
      const pos  = pool[Math.floor(Math.random() * pool.length)];
      const hasNeg = foods.some(f => f.g.eff[0] !== '+');
      const g = GRADES[hasNeg ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * GRADES.length)];
      foods.push({ ...pos, g });
    }
    function ai() {
      const h = snake[0];
      const tgt = foods.find(f => f.g.eff[0] === '+') || foods[0];
      const Opts = [{ x:1,y:0 },{ x:-1,y:0 },{ x:0,y:1 },{ x:0,y:-1 }]
        .filter(d => !(d.x === -dir.x && d.y === -dir.y))
        .filter(d => { const nx=h.x+d.x,ny=h.y+d.y; return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!snake.slice(0,-1).some(s=>s.x===nx&&s.y===ny); })
        .sort((a,b) => (Math.abs(tgt.x-(h.x+a.x))+Math.abs(tgt.y-(h.y+a.y)))-(Math.abs(tgt.x-(h.x+b.x))+Math.abs(tgt.y-(h.y+b.y))));
      if (Opts.length) dir = Opts[0];
    }
    function Step() {
      ai();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const dead = head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)||snake.length>11;
      if (dead) {
        deathFlash = 28; toxicity = 0;
        snake = [{ x:3,y:2 },{ x:2,y:2 },{ x:1,y:2 }]; dir = { x:1,y:0 }; growing = 0;
        foods = [{ x:6,y:1,g:GRADES[0] },{ x:5,y:4,g:GRADES[2] }]; return;
      }
      prevSeg = snake.map(s => ({ ...s }));
      const fi = foods.findIndex(f => f.x===head.x&&f.y===head.y);
      if (fi >= 0) {
        const f = foods.splice(fi, 1)[0];
        if (f.g.eff[0]==='+') { growing++; toxicity=Math.max(0,toxicity-0.2); }
        else toxicity = Math.min(1, toxicity+0.4);
        SpawnFood();
      }
      snake.unshift(head);
      if (growing > 0) growing--; else snake.pop();
    }

    function SegColor(tox, segT) {
      const r=Math.round(74+(248-74)*tox), g=Math.round(222+(113-222)*tox), b=Math.round(128+(113-128)*tox);
      const f=Math.max(0.5,1-segT*0.45);
      return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
    }

    function Tick(ts) {
      if (!cv.isConnected) return false;
      const dt = Math.min(ts-(lastTs||ts), 80); lastTs = ts;
      moveT += dt/STEP_MS;
      if (moveT >= 1) { moveT = 0; Step(); }
      if (deathFlash > 0) deathFlash--;
      toxicity = Math.max(0, toxicity - dt*0.0002);

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0a0a0a' : '#f0f0f0';
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = dark ? '#181818' : '#d0d0d0'; ctx.lineWidth = 0.5;
      for (let i=0;i<=ROWS;i++){ctx.beginPath();ctx.moveTo(0,i*CH);ctx.lineTo(W,i*CH);ctx.stroke();}
      for (let i=0;i<=COLS;i++){ctx.beginPath();ctx.moveTo(i*CW,0);ctx.lineTo(i*CW,H);ctx.stroke();}

      if (deathFlash>0){ctx.globalAlpha=(deathFlash/28)*0.35;ctx.fillStyle='#f87171';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}

      // Food grade
      const now = performance.now();
      for (const f of foods) {
        const pulse = 0.88+0.12*Math.sin(now/420*Math.PI*2);
        const ax=f.x*CW+CW/2, ay=f.y*CH+CH/2, r=Math.min(CW,CH)*0.37*pulse;
        const grd=ctx.createRadialGradient(ax,ay,0,ax,ay,r*1.7);
        grd.addColorStop(0,f.g.color+'88'); grd.addColorStop(1,f.g.color+'00');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(ax,ay,r*1.7,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=f.g.color; ctx.globalAlpha=0.95;
        ctx.beginPath(); ctx.arc(ax,ay,r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='rgba(0,0,0,0.75)';
        ctx.font=`700 ${Math.floor(CW*0.27)}px "IBM Plex Mono",monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(`${f.g.Pct}`,ax,ay);
        ctx.fillStyle=f.g.eff[0]==='+'?'#4ade80':'#f87171';
        ctx.font=`800 ${Math.floor(CW*0.19)}px "IBM Plex Mono",monospace`;
        ctx.textAlign='right'; ctx.textBaseline='top';
        ctx.fillText(f.g.eff,f.x*CW+CW-1,f.y*CH+1);
      }
      ctx.textAlign='left';

      const t=moveT, slen=snake.length;
      const pad=Math.max(1,CW*0.07), rad=Math.max(1.5,CW*0.14);
      for (let i=slen-1;i>=0;i--) {
        const cur=snake[i], p=prevSeg?.[i];
        const rx=(p?p.x+(cur.x-p.x)*t:cur.x)*CW;
        const ry=(p?p.y+(cur.y-p.y)*t:cur.y)*CH;
        const segT=i/Math.max(slen-1,1);
        ctx.globalAlpha=i===0?1:Math.max(0.45,1-segT*0.4);
        ctx.fillStyle=SegColor(toxicity,segT);
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(rx+pad,ry+pad,CW-pad*2,CH-pad*2,rad);ctx.fill();}
        else ctx.fillRect(rx+pad,ry+pad,CW-pad*2,CH-pad*2);
        ctx.fillStyle='rgba(255,255,255,0.12)';
        ctx.fillRect(rx+pad,ry+pad,CW-pad*2,(CH-pad*2)*0.36);
        ctx.globalAlpha=1;
        if (i===0) { // eyes
          const d=dir, hx=rx+CW/2, hy=ry+CH/2, er=Math.max(1,CW*0.1);
          const fw=d.x!==0?CW*0.14:CH*0.14, pf=d.x!==0?CH*0.22:CW*0.22;
          ctx.fillStyle='rgba(0,0,0,0.85)';
          ctx.beginPath();ctx.arc(hx+d.x*fw-d.y*pf,hy+d.y*fw+d.x*pf,er,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.arc(hx+d.x*fw+d.y*pf,hy+d.y*fw-d.x*pf,er,0,Math.PI*2);ctx.fill();
        }
      }
      return true;
    }
    RegisterPreview(Tick);
  }

  // Grade 2048
  function Preview2048(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const SZ = 3, PAD = 4;
    const CW = (W - PAD * (SZ + 1)) / SZ;
    const CH = (H - PAD * (SZ + 1)) / SZ;

    const GD = {
      2:   { bg:'#ef4444',fg:'#fff',  label:'1/20' },
      4:   { bg:'#f97316',fg:'#fff',  label:'2/20' },
      8:   { bg:'#f59e0b',fg:'#1a1a1a',label:'4/20' },
      16:  { bg:'#fbbf24',fg:'#1a1a1a',label:'6/20' },
      32:  { bg:'#a3e635',fg:'#1a1a1a',label:'8/20' },
      64:  { bg:'#4ade80',fg:'#1a1a1a',label:'10/20'},
      128: { bg:'#22c55e',fg:'#fff',  label:'12/20'},
      256: { bg:'#10b981',fg:'#fff',  label:'14/20'},
    };
    function gd(v) { return GD[v] || { bg:'#a78bfa',fg:'#fff',label:`${v}` }; }

    let grid = [[4, 16, 0], [8, 4, 32], [0, 8, 16]];
    let moving = null;
    let wait = 50;

    function CellPos(c, r) { return [PAD + c*(CW+PAD), PAD + r*(CH+PAD)]; }

    function DrawTile(val, cx, cy, scale) {
      if (!val) return;
      scale = scale || 1;
      const d = gd(val);
      const x = cx + (1-scale)*CW/2, y = cy + (1-scale)*CH/2;
      const w = CW*scale, h = CH*scale, r = 5*scale;
      ctx.fillStyle = d.bg;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
      else { ctx.fillRect(x,y,w,h); }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x,y,w,h*0.4,r); ctx.fill(); }
      else ctx.fillRect(x,y,w,h*0.4);
      const fs = val>=128?8:val>=64?9:9;
      ctx.fillStyle = d.fg;
      ctx.font = `700 ${Math.round(fs*scale)}px "IBM Plex Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.label, cx+CW/2, cy+CH/2);
    }

    function FindMerge() {
      for (let r=0;r<SZ;r++) for (let c=0;c<SZ-1;c++)
        if (grid[r][c]&&grid[r][c]===grid[r][c+1]) return {fc:c,fr:r,tc:c+1,tr:r};
      for (let r=0;r<SZ-1;r++) for (let c=0;c<SZ;c++)
        if (grid[r][c]&&grid[r][c]===grid[r+1][c]) return {fc:c,fr:r,tc:c,tr:r+1};
      return null;
    }

    function StartNext() {
      const m = FindMerge();
      if (!m) {
        const vals = [2,4,8,16,32,64,128,256];
        grid = Array.from({length:SZ},()=>Array(SZ).fill(0));
        const positions=[];
        for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++) positions.push([r,c]);
        positions.sort(()=>Math.random()-.5);
        for(let i=0;i<5;i++) { const[r,c]=positions[i]; grid[r][c]=vals[Math.floor(Math.random()*5)]; }
        wait=60; return;
      }
      const [x1,y1]=CellPos(m.fc,m.fr),[x2,y2]=CellPos(m.tc,m.tr);
      moving={fc:m.fc,fr:m.fr,tc:m.tc,tr:m.tr,val:grid[m.fr][m.fc],x1,y1,x2,y2,t:0};
      grid[m.fr][m.fc]=0;
    }

    StartNext();

    function Tick(ts) {
      if (!cv.isConnected) return false;

      if (wait>0) { wait--; if (wait===0) StartNext(); }
      else if (moving) {
        moving.t = Math.min(1, moving.t+0.07);
        if (moving.t>=1) {
          grid[moving.tr][moving.tc]*=2;
          moving=null; wait=30;
        }
      }
      const dark = document.getElementById('gf-arcade')?.dataset.theme==='dark';
      ctx.fillStyle = dark?'#1a1a1a':'#e8e8e8';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.07)';
      for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
        const[x,y]=CellPos(c,r);
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,CW,CH,5);ctx.fill();}
        else ctx.fillRect(x,y,CW,CH);
      }
      for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
        if(!grid[r][c]) continue;
        const[x,y]=CellPos(c,r);
        DrawTile(grid[r][c],x,y,1);
      }
      if(moving){
        const ease = moving.t<.5?2*moving.t*moving.t:-1+(4-2*moving.t)*moving.t;
        const x=moving.x1+(moving.x2-moving.x1)*ease;
        const y=moving.y1+(moving.y2-moving.y1)*ease;
        const popScale = moving.t>.8?1+(moving.t-.8)*0.6:1;
        if(moving.t<.5) DrawTile(moving.val,moving.x2,moving.y2,0.92);
        DrawTile(moving.val,x,y,popScale);
      }

      return true;
    }
    RegisterPreview(Tick);
  }

  // GradeSweeper
  function PreviewMinesweeper(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const COLS = 7, ROWS = 5, GAP = 2;
    const CW = (W - GAP * (COLS - 1)) / COLS;
    const CH = (H - GAP * (ROWS - 1)) / ROWS;

    const NUM_C = ['','#3b82f6','#22c55e','#ef4444','#7c3aed','#f97316','#06b6d4','#ec4899'];
    const FAILS  = ['3/20','5/20','7/20','9/20'];

    const BOARD = [
      [  0,  1, -1,  1,  0,  1, -1 ],
      [  0,  1,  1,  1,  0,  1,  1 ],
      [  0,  0,  0,  0,  0,  0,  0 ],
      [  1,  1,  0,  0,  1,  2,  1 ],
      [ -1,  1,  0,  0,  1, -1,  1 ],
    ];
    const FAIL_LBL = Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>FAILS[(r*COLS+c)%FAILS.length]));
    const revealOrder = [];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (BOARD[r][c]>=0) revealOrder.push([r,c]);
    revealOrder.sort(()=>Math.random()-.5);
    const mines = [];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (BOARD[r][c]===-1) mines.push([r,c]);
    const hitMine = mines[Math.floor(Math.random()*mines.length)];
    revealOrder.push(hitMine);

    let revealed = Array.from({length:ROWS},()=>Array(COLS).fill(false));
    let flagged  = Array.from({length:ROWS},()=>Array(COLS).fill(false));
    mines.forEach(([r,c])=>{ if(r!==hitMine[0]||c!==hitMine[1]) flagged[r][c]=true; });

    let revIdx=0, ticker=0, state='Reveal', waitTick=0;
    let explodeT=0;

    function Reset(){
      revealed=Array.from({length:ROWS},()=>Array(COLS).fill(false));
      mines.forEach(([r,c])=>{ if(r!==hitMine[0]||c!==hitMine[1]) flagged[r][c]=true; });
      revIdx=0; ticker=0; state='Reveal'; waitTick=0; explodeT=0;
    }

    function CellXY(c,r){ return [c*(CW+GAP), r*(CH+GAP)]; }

    function DrawCell(c,r){
      const [x,y]=CellXY(c,r);
      const val=BOARD[r][c];
      const isRev=revealed[r][c];
      const isFlag=flagged[r][c];
      const isHit=(state==='explode'||state==='wait')&&r===hitMine[0]&&c===hitMine[1];
      const dark=document.getElementById('gf-arcade')?.dataset.theme==='dark';

      const hiddenBg  = dark?'#4a4a4a':'#c8c8c8';
      const revBg     = dark?'#2a2a2a':'#d8d8d8';

      ctx.save();
      const rr=(px,py,pw,ph,pr)=>{
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(px,py,pw,ph,pr);return;}
        ctx.beginPath();ctx.rect(px,py,pw,ph);
      };

      if (!isRev && !isFlag) {
        ctx.fillStyle=hiddenBg; rr(x,y,CW,CH,2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.5)'; rr(x,y,CW,2,0); ctx.fill(); rr(x,y,2,CH,0); ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.22)'; rr(x,y+CH-2,CW,2,0); ctx.fill(); rr(x+CW-2,y,2,CH,0); ctx.fill();
      } else if (isFlag) {
        ctx.fillStyle=hiddenBg; rr(x,y,CW,CH,2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.5)'; rr(x,y,CW,2,0); ctx.fill(); rr(x,y,2,CH,0); ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.22)'; rr(x,y+CH-2,CW,2,0); ctx.fill(); rr(x+CW-2,y,2,CH,0); ctx.fill();
        ctx.fillStyle='#ef4444';
        ctx.font=`${Math.floor(CH*.55)}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('⚑',x+CW/2,y+CH/2+1);
      } else if (val===-1) {
        ctx.fillStyle=isHit?'#ef4444':'#fca5a5'; rr(x,y,CW,CH,2); ctx.fill();
        const fs=Math.max(5,Math.floor(CW*0.42));
        ctx.fillStyle='#fff';
        ctx.font=`700 ${fs}px "IBM Plex Mono",monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(FAIL_LBL[r][c],x+CW/2,y+CH/2);
        if(isHit&&state==='explode'){
          const glow=ctx.createRadialGradient(x+CW/2,y+CH/2,0,x+CW/2,y+CH/2,CW);
          glow.addColorStop(0,'rgba(255,100,100,'+(.5+.5*Math.sin(explodeT*.3))+')');
          glow.addColorStop(1,'rgba(255,100,100,0)');
          ctx.fillStyle=glow; rr(x-4,y-4,CW+8,CH+8,4); ctx.fill();
        }
      } else {
        ctx.fillStyle=revBg; rr(x,y,CW,CH,2); ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.1)'; rr(x,y,CW,1,0); ctx.fill(); rr(x,y,1,CH,0); ctx.fill();
        if (val>0){
          ctx.fillStyle=NUM_C[val]||'#aaa';
          ctx.font=`800 ${Math.floor(CH*.55)}px "IBM Plex Mono",monospace`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(val,x+CW/2,y+CH/2);
        }
      }
      ctx.restore();
    }

    function Tick(){
      if(!cv.isConnected) return;
      ticker++;

      if(state==='Reveal'){
        if(ticker%10===0&&revIdx<revealOrder.length){
          const[r,c]=revealOrder[revIdx++];
          revealed[r][c]=true;
          if(r===hitMine[0]&&c===hitMine[1]){state='explode';explodeT=0;}
        }
        if(revIdx>=revealOrder.length&&state==='Reveal'){state='wait';waitTick=0;}
      } else if(state==='explode'){
        explodeT++;
        if(explodeT>50){state='wait';waitTick=0;}
      } else if(state==='wait'){
        waitTick++;
        if(waitTick>40) Reset();
      }

      const dark=document.getElementById('gf-arcade')?.dataset.theme==='dark';
      ctx.fillStyle=dark?'#1c1c1c':'#e0e0e0';
      ctx.fillRect(0,0,W,H);

      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) DrawCell(c,r);

      return true;
    }
    RegisterPreview(Tick);
  }

  // GradeMemory
  function PreviewMemory(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const COLS = 4, ROWS = 3, PAD = 4;
    const CW = (W - PAD * (COLS + 1)) / COLS;
    const CH = (H - PAD * (ROWS + 1)) / ROWS;

    const GRADES = [
      { label:'10/20', sub:'50%', bg:'#4ade80', fg:'#1a1a1a' },
      { label:'12/20', sub:'60%', bg:'#16a34a', fg:'#fff'    },
      { label:'14/20', sub:'70%', bg:'#06b6d4', fg:'#fff'    },
      { label:'15/20', sub:'75%', bg:'#3b82f6', fg:'#fff'    },
      { label:'17/20', sub:'85%', bg:'#8b5cf6', fg:'#fff'    },
      { label:'8/20',  sub:'40%', bg:'#f59e0b', fg:'#1a1a1a' },
    ];

    function MakeCards() {
      return [...GRADES, ...GRADES]
        .sort(() => Math.random() - 0.5)
        .map((g, i) => ({ row: Math.floor(i / COLS), col: i % COLS, grade: g, flip: 0, matched: false, matchGlow: 0 }));
    }

    let cards = MakeCards();
    let flipped = [], state = 'idle', waitF = 0;

    function Unmatched() { return cards.filter(c => !c.matched && c.flip === 0 && !flipped.includes(c)); }

    function StartFlip() {
      const pool = Unmatched();
      if (pool.length < 2) { state = 'resetting'; waitF = 0; return; }
      const a = pool[RandomInt(0, pool.length - 1)];
      let b; do { b = pool[RandomInt(0, pool.length - 1)]; } while (b === a);
      flipped = [a, b]; state = 'flipping';
    }

    function DrawCard(card) {
      const x = PAD + card.col * (CW + PAD), y = PAD + card.row * (CH + PAD);
      const g = card.grade;
      const frontAlpha = card.matched ? 1 : card.flip;
      const backAlpha  = 1 - frontAlpha;
      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';

      ctx.save();
      ctx.translate(x, y);

      // Back face
      if (backAlpha > 0.01) {
        ctx.globalAlpha = backAlpha;
        const backBg = dark ? '#2d3748' : '#475569';
        ctx.fillStyle = backBg;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0,0,CW,CH,3); ctx.fill(); }
        else ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.2)';
        ctx.font = `700 ${Math.floor(CH*.28)}px "IBM Plex Mono",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', CW/2, CH/2);
      }

      // Front face
      if (frontAlpha > 0.01) {
        ctx.globalAlpha = frontAlpha;
        ctx.fillStyle = g.bg;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0,0,CW,CH,3); ctx.fill(); }
        else ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0,0,CW,CH*.4,3); ctx.fill(); }
        else ctx.fillRect(0,0,CW,CH*.4);
        ctx.fillStyle = g.fg;
        ctx.font = `800 ${Math.floor(CH*.34)}px "IBM Plex Mono",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g.label, CW/2, CH*.44);
        ctx.font = `600 ${Math.floor(CH*.2)}px "IBM Plex Mono",monospace`;
        ctx.globalAlpha = frontAlpha * 0.75;
        ctx.fillText(g.sub, CW/2, CH*.75);
        ctx.globalAlpha = frontAlpha;
        if (card.matchGlow > 0) {
          ctx.fillStyle = `rgba(255,255,255,${card.matchGlow * 0.35})`;
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0,0,CW,CH,3); ctx.fill(); }
          else ctx.fillRect(0,0,CW,CH);
        }
      }

      ctx.restore();
    }

    function Tick() {
      if (!cv.isConnected) return false;

      if (state === 'flipping') {
        let done = true;
        for (const c of flipped) { c.flip = Math.min(1, c.flip + 0.08); if (c.flip < 1) done = false; }
        if (done) { state = 'showing'; waitF = 0; }
      } else if (state === 'showing') {
        waitF++;
        if (waitF > 38) {
          const [a, b] = flipped;
          if (a.grade === b.grade) {
            a.matchGlow = b.matchGlow = 1;
            a.matched = b.matched = true;
            flipped = []; state = 'idle'; setTimeout(StartFlip, 500);
          } else { state = 'unflipping'; }
        }
      } else if (state === 'unflipping') {
        let done = true;
        for (const c of flipped) { c.flip = Math.max(0, c.flip - 0.08); if (c.flip > 0) done = false; }
        if (done) { flipped = []; state = 'idle'; setTimeout(StartFlip, 380); }
      } else if (state === 'resetting') {
        waitF++;
        if (waitF > 40) { cards = MakeCards(); flipped = []; state = 'idle'; setTimeout(StartFlip, 600); }
      }

      for (const c of cards) { if (c.matchGlow > 0) c.matchGlow = Math.max(0, c.matchGlow - 0.022); }
      const allMatched = cards.every(c => c.matched);
      if (allMatched && state === 'idle') { state = 'resetting'; waitF = 0; }

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0d0d0d' : '#f0f0f0';
      ctx.fillRect(0, 0, W, H);

      for (const card of cards) DrawCard(card);
      return true;
    }

    setTimeout(StartFlip, 700);
    RegisterPreview(Tick);
  }

  function PreviewShooter(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');

    const PREV_BANDS = [
      { bg:'#ef4444', border:'#b91c1c', fg:'#fff',    range:'0–9'   },
      { bg:'#f97316', border:'#c2410c', fg:'#fff',    range:'10–11' },
      { bg:'#eab308', border:'#a16207', fg:'#1a1a1a', range:'12–13' },
      { bg:'#22c55e', border:'#15803d', fg:'#fff',    range:'14–15' },
      { bg:'#3b82f6', border:'#1d4ed8', fg:'#fff',    range:'16–17' },
      { bg:'#f59e0b', border:'#d97706', fg:'#1a1a1a', range:'18–20' },
    ];

    const PR = 10;
    const PDIAM = PR * 2;
    const PROW_H = Math.round(PR * Math.sqrt(3));
    const PCOLS = 7, PROWS = 4;

    function PbXY(r, c) {
      const indent = r % 2 === 1 ? PR : 0;
      return { x: PR + indent + c * PDIAM, y: PR + r * PROW_H };
    }

    const grid = Array.from({ length: PROWS }, (_, r) =>
      Array.from({ length: r % 2 === 1 ? PCOLS - 1 : PCOLS }, () =>
        ({ band: Math.floor(Math.random() * PREV_BANDS.length) }))
    );

    let proj = null;
    let projBand = Math.floor(Math.random() * PREV_BANDS.length);
    const cannonX = W / 2, cannonY = H - 10;
    let aimAngle = -Math.PI * 0.65 + Math.random() * 0.3;
    let aimDir = 1;
    let flashCells = [];
    let falling = [];

    function ShootPreview() {
      if (proj) return;
      proj = { x: cannonX, y: cannonY, vx: Math.cos(aimAngle) * 4.5, vy: Math.sin(aimAngle) * 4.5, band: projBand };
      projBand = Math.floor(Math.random() * PREV_BANDS.length);
    }

    function DrawBub(x, y, band, r, alpha) {
      const b = PREV_BANDS[band];
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = b.bg; ctx.fill();
      ctx.strokeStyle = b.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(x - r*.22, y - r*.22, r*.35, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    let shotTimer = 0;
    function Tick() {
      if (!cv.isConnected) return false;

      aimAngle += 0.014 * aimDir;
      if (aimAngle > -0.3)       { aimAngle = -0.3;           aimDir = -1; }
      if (aimAngle < -Math.PI + 0.3) { aimAngle = -Math.PI + 0.3; aimDir =  1; }

      shotTimer++;
      if (shotTimer > 50 && !proj) { ShootPreview(); shotTimer = 0; }

      if (proj) {
        proj.x += proj.vx; proj.y += proj.vy;
        if (proj.x - PR < 0)   { proj.x = PR;   proj.vx = Math.abs(proj.vx); }
        if (proj.x + PR > W)   { proj.x = W-PR; proj.vx = -Math.abs(proj.vx); }
        if (proj.y - PR <= 0)  { LandPreview(proj.x, PR, proj.band); proj = null; }
        else {
          let hit = false;
          for (let r = 0; r < PROWS && !hit; r++) {
            const cols = r % 2 === 1 ? PCOLS - 1 : PCOLS;
            for (let c = 0; c < cols && !hit; c++) {
              if (!grid[r]?.[c]) continue;
              const { x, y } = PbXY(r, c);
              if ((proj.x-x)**2+(proj.y-y)**2 < (PDIAM-2)**2) {
                LandPreview(proj.x, proj.y, proj.band); proj = null; hit = true;
              }
            }
          }
        }
      }

      falling = falling.filter(f => { f.x+=f.vx; f.y+=f.vy; f.vy+=0.35; f.alpha-=0.05; return f.alpha>0; });
      flashCells = flashCells.map(f => ({...f, t: f.t-.07})).filter(f => f.t > 0);

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0d0d0d' : '#f0eeec';
      ctx.fillRect(0, 0, W, H);

      let ax = cannonX, ay = cannonY, avx = Math.cos(aimAngle), avy = Math.sin(aimAngle);
      ctx.save();
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)';
      ctx.lineWidth = 1; ctx.setLineDash([3,6]);
      ctx.beginPath(); ctx.moveTo(ax, ay);
      for (let i = 0; i < 100; i++) {
        ax += avx*5; ay += avy*5;
        if (ax < PR)   { ax = PR;   avx = Math.abs(avx); }
        if (ax > W-PR) { ax = W-PR; avx = -Math.abs(avx); }
        if (ay < 0) break;
        ctx.lineTo(ax, ay);
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      for (let r = 0; r < PROWS; r++) {
        const cols = r % 2 === 1 ? PCOLS - 1 : PCOLS;
        for (let c = 0; c < cols; c++) {
          if (!grid[r]?.[c]) continue;
          const { x, y } = PbXY(r, c);
          const fl = flashCells.find(f => f.row===r && f.col===c);
          DrawBub(x, y, grid[r][c].band, PR, 1);
          if (fl) {
            ctx.save(); ctx.globalAlpha = fl.t * 0.45;
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x,y,PR,0,Math.PI*2); ctx.fill();
            ctx.restore();
          }
        }
      }

      for (const f of falling) DrawBub(f.x, f.y, f.band, PR*0.85, f.alpha);
      if (proj) DrawBub(proj.x, proj.y, proj.band, PR, 1);

      ctx.save();
      ctx.translate(cannonX, cannonY);
      ctx.rotate(aimAngle + Math.PI/2);
      const cDark = dark ? '#4b5563' : '#374151';
      ctx.fillStyle = cDark;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-4, -20, 8, 20, 3); ctx.fill(); }
      else ctx.fillRect(-4, -20, 8, 20);
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fillStyle = dark ? '#1f2937' : '#111827'; ctx.fill();
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();

      ctx.globalAlpha = 0.7;
      DrawBub(cannonX, cannonY, projBand, PR*0.55, 1);
      ctx.globalAlpha = 1;

      return true;
    }

    function LandPreview(px, py, band) {
      let bR = 0, bC = 0, bD = Infinity;
      for (let r = 0; r < PROWS + 1; r++) {
        const cols = r % 2 === 1 ? PCOLS - 1 : PCOLS;
        for (let c = 0; c < cols; c++) {
          const { x, y } = PbXY(r, c);
          const d = (x-px)**2+(y-py)**2;
          if (d < bD) { bD=d; bR=r; bC=c; }
        }
      }
      bR = Math.max(0, Math.min(bR, PROWS));
      if (!grid[bR]) grid[bR] = [];
      grid[bR][bC] = { band };

      const visited = new Set([`${bR},${bC}`]);
      const q = [{ row:bR, col:bC }];
      while (q.length) {
        const cur = q.shift();
        const even = cur.row % 2 === 0;
        const offs = even ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]] : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
        for (const [dr,dc] of offs) {
          const nr=cur.row+dr, nc=cur.col+dc;
          if (nr<0||nc<0) continue;
          const k=`${nr},${nc}`;
          if (!visited.has(k) && grid[nr]?.[nc]?.band === band) { visited.add(k); q.push({row:nr,col:nc}); }
        }
      }
      if (visited.size >= 3) {
        for (const k of visited) {
          const [r,c] = k.split(',').map(Number);
          const { x, y } = PbXY(r, c);
          falling.push({ x, y, vx:(Math.random()-.5)*3.5, vy:-1.5-Math.random()*2, band, alpha:1 });
          if (grid[r]) grid[r][c] = null;
          flashCells.push({ row:r, col:c, t:1 });
        }
        setTimeout(() => {
          for (let r = 0; r < 3; r++) {
            const cols = r % 2 === 1 ? PCOLS-1 : PCOLS;
            for (let c = 0; c < cols; c++) {
              if (!grid[r]?.[c]) grid[r][c] = { band: Math.floor(Math.random()*PREV_BANDS.length) };
            }
          }
        }, 900);
      }
    }

    setTimeout(() => { ShootPreview(); }, 600);
    RegisterPreview(Tick);
  }

  // ── GradeBreakout preview ──
  function PreviewBreakout(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');

    const BCOLS = 7, BROWS = 3, BW = W / BCOLS, BH = 8;
    const BCLR = ['#4ade80','#a3e635','#f97316','#f87171','#60a5fa','#a78bfa'];
    const bricks = [];
    for (let r = 0; r < BROWS; r++)
      for (let c = 0; c < BCOLS; c++)
        bricks.push({ x: c*BW, y: 6+r*(BH+2), w: BW-2, h: BH, clr: BCLR[(r*BCOLS+c)%BCLR.length], alive: true });

    const PW = 28, PH = 5;
    let px = W/2 - PW/2, bx = W/2, by = H-18, bvx = 1.6, bvy = -1.8;
    let particles = [], respawnT = 0;

    function Reset() {
      bx = W/2; by = H-18; bvx = 1.5*(Math.random()>.5?1:-1); bvy = -1.8;
      px = W/2-PW/2; respawnT = 0;
      bricks.forEach(b => b.alive = true);
    }

    function Tick() {
      if (!cv.isConnected) return false;

      // AI paddle
      px += (bx - px - PW/2) * 0.12;
      px = Math.max(0, Math.min(W-PW, px));

      bx += bvx; by += bvy;
      if (bx <= 2 || bx >= W-2) bvx = -bvx;
      if (by <= 2) bvy = Math.abs(bvy);
      // paddle bounce
      if (by >= H-12-PH && by <= H-10 && bx >= px && bx <= px+PW) {
        bvy = -Math.abs(bvy);
        bvx += (bx - px - PW/2) * 0.06;
      }
      // brick hit
      for (const b of bricks) {
        if (!b.alive) continue;
        if (bx >= b.x && bx <= b.x+b.w && by >= b.y && by <= b.y+b.h) {
          b.alive = false; bvy = -bvy;
          for (let i = 0; i < 5; i++) particles.push({ x:bx, y:by, vx:(Math.random()-.5)*3, vy:-Math.random()*2, clr:b.clr, t:1 });
          break;
        }
      }
      // respawn
      if (by > H+5 || !bricks.some(b=>b.alive)) { respawnT++; if (respawnT > 40) Reset(); }

      particles = particles.map(p => ({...p, x:p.x+p.vx, y:p.y+p.vy, vy:p.vy+.15, t:p.t-.04})).filter(p => p.t > 0);

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0a0a0a' : '#f0f0f0';
      ctx.fillRect(0,0,W,H);

      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.clr;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(b.x+1,b.y,b.w,b.h,2); ctx.fill(); }
        else ctx.fillRect(b.x+1,b.y,b.w,b.h);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(b.x+1,b.y,b.w,b.h*.4);
      }

      // ball
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(bx,by,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(244,63,94,.25)'; ctx.beginPath(); ctx.arc(bx-bvx*2,by-bvy*2,5,0,Math.PI*2); ctx.fill();

      // paddle
      ctx.fillStyle = dark ? '#e5e7eb' : '#374151';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px,H-12,PW,PH,2); ctx.fill(); }
      else ctx.fillRect(px,H-12,PW,PH);

      // particles
      for (const p of particles) { ctx.globalAlpha=p.t; ctx.fillStyle=p.clr; ctx.fillRect(p.x-1.5,p.y-1.5,3,3); } ctx.globalAlpha=1;

      return true;
    }
    RegisterPreview(Tick);
  }

  // ── GradePong preview ──
  function PreviewPong(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');

    const PW = 4, PH = 22;
    let ly = H/2-PH/2, ry = H/2-PH/2;
    let bx = W/2, by = H/2, bvx = 1.5, bvy = 1.0;
    let lScore = 0, rScore = 0, flashSide = 0, flashT = 0;
    let trail = [];

    function ResetBall() {
      bx = W/2; by = H/2;
      bvx = 1.5 * (Math.random()>.5?1:-1);
      bvy = (Math.random()-.5)*2;
    }

    function Tick() {
      if (!cv.isConnected) return false;

      // AI paddles
      ly += (by - ly - PH/2) * 0.08;
      ry += (by - ry - PH/2) * 0.11;
      ly = Math.max(0, Math.min(H-PH, ly));
      ry = Math.max(0, Math.min(H-PH, ry));

      trail.push({x:bx,y:by,t:1});
      trail = trail.map(t=>({...t,t:t.t-.08})).filter(t=>t.t>0);

      bx += bvx; by += bvy;
      if (by <= 0 || by >= H) bvy = -bvy;

      // left paddle
      if (bx <= 10+PW && by >= ly && by <= ly+PH && bvx < 0) {
        bvx = Math.abs(bvx) * 1.03;
        bvy += (by - ly - PH/2) * 0.08;
      }
      // right paddle
      if (bx >= W-10-PW && by >= ry && by <= ry+PH && bvx > 0) {
        bvx = -Math.abs(bvx) * 1.03;
        bvy += (by - ry - PH/2) * 0.08;
      }

      if (bx < -5) { rScore = (rScore+1)%10; flashSide=-1; flashT=1; ResetBall(); }
      if (bx > W+5) { lScore = (lScore+1)%10; flashSide=1; flashT=1; ResetBall(); }
      if (flashT > 0) flashT -= 0.03;
      if (Math.abs(bvx) > 4) bvx = 4 * Math.sign(bvx);

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0a0a0a' : '#f0f0f0';
      ctx.fillRect(0,0,W,H);

      // center line
      ctx.strokeStyle = dark ? '#222' : '#ccc'; ctx.lineWidth = 1; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);

      // scores
      ctx.fillStyle = dark ? '#333' : '#ddd';
      ctx.font = 'bold 22px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(lScore, W/2-20, 24);
      ctx.fillText(rScore, W/2+20, 24);

      // paddles
      ctx.fillStyle = '#06b6d4';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(8,ly,PW,PH,2); ctx.fill(); }
      else ctx.fillRect(8,ly,PW,PH);
      ctx.fillStyle = '#f43f5e';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(W-8-PW,ry,PW,PH,2); ctx.fill(); }
      else ctx.fillRect(W-8-PW,ry,PW,PH);

      // trail
      for (const t of trail) { ctx.globalAlpha=t.t*.2; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(t.x,t.y,2.5,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1;

      // ball
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx,by,3.5,0,Math.PI*2); ctx.fill();

      // flash
      if (flashT > 0) {
        ctx.globalAlpha = flashT*.15;
        ctx.fillStyle = flashSide > 0 ? '#06b6d4' : '#f43f5e';
        ctx.fillRect(0,0,W,H);
        ctx.globalAlpha = 1;
      }

      return true;
    }
    RegisterPreview(Tick);
  }

  // ── GradeFlappy preview ──
  function PreviewFlappy(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');

    const GRAVITY = 0.12, FLAP = -2.2, GAP = 36, PW = 18, SPEED = 1.2;
    let birdY = H/2, birdVy = 0, birdRot = 0;
    let pipes = [{x: W+20, gapY: 30+Math.random()*30},{x: W+90, gapY: 25+Math.random()*40}];
    let flapTimer = 0, groundX = 0;
    const BCLR = ['#4ade80','#f97316','#60a5fa','#eab308'];
    let birdClr = BCLR[0];

    function Tick() {
      if (!cv.isConnected) return false;

      // auto flap
      flapTimer++;
      const nextPipe = pipes.find(p => p.x + PW > 30);
      if (nextPipe) {
        const targetY = nextPipe.gapY + GAP/2;
        if (birdY > targetY + 5 || birdVy > 1.5) {
          if (flapTimer > 8) { birdVy = FLAP; flapTimer = 0; birdClr = BCLR[Math.floor(Math.random()*BCLR.length)]; }
        }
      } else if (flapTimer > 18) { birdVy = FLAP; flapTimer = 0; }

      birdVy += GRAVITY;
      birdY += birdVy;
      birdRot = Math.max(-0.4, Math.min(0.6, birdVy * 0.12));

      if (birdY < 5) { birdY = 5; birdVy = 0; }
      if (birdY > H-15) { birdY = H/2; birdVy = 0; pipes.forEach(p => p.x = W + Math.random()*60); }

      // pipes
      for (const p of pipes) p.x -= SPEED;
      if (pipes[0].x < -PW) { pipes.shift(); pipes.push({x: pipes[pipes.length-1].x + 65 + Math.random()*20, gapY: 15+Math.random()*(H-GAP-30)}); }

      groundX = (groundX - SPEED) % 8;

      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#0a0a0a' : '#e8f4f8';
      ctx.fillRect(0,0,W,H);

      // pipes
      for (const p of pipes) {
        const pClr = p.gapY > H/2-10 ? '#4ade80' : '#f97316';
        ctx.fillStyle = pClr;
        // top pipe
        ctx.fillRect(p.x, 0, PW, p.gapY);
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(p.x-2, p.gapY-5, PW+4, 5, 2); ctx.fill(); }
        // bottom pipe
        ctx.fillRect(p.x, p.gapY+GAP, PW, H-p.gapY-GAP-10);
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(p.x-2, p.gapY+GAP, PW+4, 5, 2); ctx.fill(); }
      }

      // ground
      ctx.fillStyle = dark ? '#1a1a1a' : '#c8b07a';
      ctx.fillRect(0, H-10, W, 10);
      ctx.strokeStyle = dark ? '#333' : '#a09060'; ctx.lineWidth = 1;
      for (let gx = groundX; gx < W; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, H-10); ctx.lineTo(gx+4, H); ctx.stroke(); }

      // bird
      ctx.save();
      ctx.translate(30, birdY);
      ctx.rotate(birdRot);
      ctx.fillStyle = birdClr;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-6,-6,12,12,3); ctx.fill(); }
      else ctx.fillRect(-6,-6,12,12);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-6,-6,12,5);
      // eye
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(3, -2, 1.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3.5, -2.5, 0.7, 0, Math.PI*2); ctx.fill();
      // beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(10,-1); ctx.lineTo(10,2); ctx.closePath(); ctx.fill();
      ctx.restore();

      return true;
    }
    RegisterPreview(Tick);
  }

  // GradeRunner preview
  function PreviewRunner(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const groundY = H - 18;
    let xScroll = 0, runnerY = groundY - 24, runnerVy = 0, slideT = 0, score = 0;
    let obstacles = [{ x: 110, y: groundY - 22, w: 14, h: 22, color: '#f87171' }];
    let pickups = [{ x: 70, y: groundY - 46, r: 7, color: '#4ade80', label: '82' }];

    function Reset() {
      runnerY = groundY - 24; runnerVy = 0; slideT = 0; score = 0;
      obstacles = [{ x: W + 25, y: groundY - 22, w: 14, h: 22, color: '#f87171' }];
      pickups = [{ x: W + 70, y: groundY - 48, r: 7, color: '#4ade80', label: '82' }];
    }

    function Tick() {
      if (!cv.isConnected) return false;
      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      const speed = 1.8;
      xScroll = (xScroll + speed) % 24;
      score++;

      const nextObstacle = obstacles.find(o => o.x > 24 && o.x < 82);
      if (nextObstacle && runnerY >= groundY - 24 && slideT <= 0) runnerVy = -4.2;
      if (score % 170 === 70) slideT = 34;
      if (slideT > 0) slideT--;

      runnerVy += 0.22;
      runnerY += runnerVy;
      if (runnerY > groundY - 24) { runnerY = groundY - 24; runnerVy = 0; }

      for (const o of obstacles) o.x -= speed;
      for (const p of pickups) p.x -= speed;
      if (!obstacles.length || obstacles[obstacles.length - 1].x < W - 78) {
        const tall = Math.random() > 0.55;
        obstacles.push({ x: W + RandomInt(8, 28), y: groundY - (tall ? 32 : 22), w: tall ? 12 : 15, h: tall ? 32 : 22, color: tall ? '#f97316' : '#f87171' });
      }
      if (!pickups.length || pickups[pickups.length - 1].x < W - 120) {
        pickups.push({ x: W + RandomInt(30, 70), y: groundY - RandomInt(42, 64), r: 7, color: Math.random() > 0.45 ? '#4ade80' : '#a3e635', label: Math.random() > 0.45 ? '86' : '64' });
      }
      obstacles = obstacles.filter(o => o.x + o.w > -8);
      pickups = pickups.filter(p => p.x + p.r > -8);

      ctx.fillStyle = dark ? '#0a0e1a' : '#bae6fd';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = dark ? 'rgba(180,200,230,0.10)' : 'rgba(255,255,255,0.82)';
      for (let i = 0; i < 3; i++) {
        const cx = ((i * 70 - score * 0.25) % 230 + 230) % 230 - 35;
        const cy = 16 + i * 13;
        ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.arc(cx + 9, cy + 3, 7, 0, Math.PI * 2); ctx.arc(cx - 8, cy + 4, 6, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = dark ? '#1f2937' : '#d4b886';
      ctx.fillRect(0, groundY, W, H - groundY);
      ctx.strokeStyle = dark ? '#374151' : '#a08960';
      for (let gx = -xScroll; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, groundY + 8); ctx.lineTo(gx + 12, groundY + 8); ctx.stroke(); }

      for (const p of pickups) {
        ctx.fillStyle = p.color + '44'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = '700 6px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.label, p.x, p.y);
      }

      for (const o of obstacles) {
        ctx.fillStyle = o.color;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 3); ctx.fill(); }
        else ctx.fillRect(o.x, o.y, o.w, o.h);
      }

      const ph = slideT > 0 ? 14 : 24;
      const py = slideT > 0 ? runnerY + 10 : runnerY;
      ctx.fillStyle = '#4ade80';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(30, py, 18, ph, 5); ctx.fill(); }
      else ctx.fillRect(30, py, 18, ph);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(32, py + 2, 14, Math.max(3, ph * 0.35));
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(43, py + 7, 1.8, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)';
      ctx.font = '700 10px "IBM Plex Mono",monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(String(Math.floor(score / 7)), W - 8, 7);
      return true;
    }
    RegisterPreview(Tick);
  }

  // GradeTower preview
  function PreviewTower(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const CELL = 10;
    const path = [
      [0,3],[1,3],[2,3],[3,3],[4,3],[4,4],[4,5],[5,5],[6,5],[7,5],[8,5],
      [8,6],[8,7],[7,7],[6,7],[5,7],[4,7],[3,7],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8]
    ];
    const towers = [
      { x: 35, y: 25, r: 34, fire: 0, color: '#22d3ee', label: 'R' },
      { x: 75, y: 35, r: 45, fire: 18, color: '#f97316', label: 'C' },
      { x: 112, y: 65, r: 38, fire: 34, color: '#4ade80', label: 'E' },
    ];
    let enemies = [], bullets = [], tick = 0;

    function SpawnEnemy() {
      const p = path[0];
      enemies.push({ x: p[0] * CELL + CELL / 2, y: p[1] * CELL + CELL / 2, idx: 0, t: 0, hp: 1, speed: 0.035 + Math.random() * 0.02, color: Math.random() > 0.75 ? '#a78bfa' : '#f87171' });
    }

    function Tick() {
      if (!cv.isConnected) return false;
      tick++;
      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      if (tick % 58 === 1) SpawnEnemy();

      for (const e of enemies) {
        const a = path[e.idx], b = path[e.idx + 1];
        if (!b) { e.done = true; continue; }
        e.t += e.speed;
        while (e.t >= 1 && e.idx < path.length - 2) { e.t -= 1; e.idx++; }
        const c = path[e.idx], n = path[e.idx + 1];
        e.x = (c[0] + (n[0] - c[0]) * e.t) * CELL + CELL / 2;
        e.y = (c[1] + (n[1] - c[1]) * e.t) * CELL + CELL / 2;
      }
      enemies = enemies.filter(e => !e.done && e.x < W + 10);

      for (const tw of towers) {
        tw.fire--;
        if (tw.fire > 0) continue;
        const target = enemies.find(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= tw.r ** 2);
        if (target) {
          bullets.push({ x: tw.x, y: tw.y, target, color: tw.color, life: 28 });
          tw.fire = 26 + RandomInt(0, 18);
        }
      }

      for (const b of bullets) {
        if (!b.target || b.target.done) { b.life = 0; continue; }
        const dx = b.target.x - b.x, dy = b.target.y - b.y, d = Math.hypot(dx, dy) || 1;
        b.x += dx / d * 4.2; b.y += dy / d * 4.2; b.life--;
        if (d < 5) { b.target.done = true; b.life = 0; }
      }
      bullets = bullets.filter(b => b.life > 0);
      enemies = enemies.filter(e => !e.done);

      ctx.fillStyle = dark ? '#0a0e15' : '#e8efe5'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = dark ? '#161b24' : '#d4dcd0'; ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.fillStyle = dark ? '#1f2a3a' : '#c8b889';
      for (const p of path) ctx.fillRect(p[0] * CELL + 1, p[1] * CELL + 1, CELL - 2, CELL - 2);

      for (const tw of towers) {
        ctx.strokeStyle = tw.color + '38'; ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = dark ? '#1f2937' : '#374151'; ctx.beginPath(); ctx.arc(tw.x, tw.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = tw.color; ctx.beginPath(); ctx.arc(tw.x, tw.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = '800 7px "IBM Plex Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tw.label, tw.x, tw.y);
      }

      for (const e of enemies) {
        ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(e.x - 5, e.y - 8, 10, 2);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(e.x - 5, e.y - 8, 10 * e.hp, 2);
      }
      for (const b of bullets) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, 2.4, 0, Math.PI * 2); ctx.fill(); }

      return true;
    }
    SpawnEnemy();
    RegisterPreview(Tick);
  }


  /* Launch game */
  const _GAME_CLOSE_SEL = {
    gradestack:   '#gf-tt-close',
    gradesnake:   '#gf-sn-close-btn',
    grade2048:    '#gf-28-close',
    gradesweeper: '#gf-sw-close',
    gradememory:  '#gf-mem-close',
    gradeshooter: '#gf-sh-close',
    gradebreakout: '#gf-bo-close',
    gradepong:     '#gf-po-close',
    gradeflappy:   '#gf-fl-close',
    graderunner:   '#gf-rn-close',
    gradetower:    '#gf-tw-close',
  };

  function LaunchGame(game) {
    _activeId = game.id;
    _Hide();
    game.launch(_grades);
    const sel = _GAME_CLOSE_SEL[game.id];
    if (!sel) return;
    function OnGameClose(e) {
      if (!e.target.closest(sel)) return;
      e.stopImmediatePropagation();
      document.removeEventListener('click', OnGameClose, true);
      if (game.stop) game.stop();
      _activeId = null;
      OpenGameMenu(_grades);
    }
    document.addEventListener('click', OnGameClose, true);
  }

  /* Internal helpers */
  function _Hide() {
    StopAllPreviews();
    if (_el) _el.style.display = 'none';
    _DetachKeys();
    _tobs.disconnect();
  }

  function _AttachKeys() {
    if (_kh) return;
    _kh = e => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGameMenu(); }
    };
    document.addEventListener('keydown', _kh, true);
  }

  function _DetachKeys() {
    if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; }
  }

  /* Public API */
  function OpenGameMenu(grades) {
    if (grades) _grades = grades;
    if (_activeId) {
      const g = GAMES.find(x => x.id === _activeId);
      if (g && g.stop) g.stop();
      _activeId = null;
    }
    if (!_el) Build();
    _el.style.display = 'flex';
    SyncTheme();
    RenderPreviews();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    _AttachKeys();
  }

  function CloseGameMenu() { _Hide(); }

  function ToggleGameMenu(grades) {
    if (_activeId) {
      const g = GAMES.find(x => x.id === _activeId);
      if (g && g.stop) g.stop();
      _activeId = null;
      OpenGameMenu(grades);
      return;
    }
    if (_el && _el.style.display !== 'none') CloseGameMenu();
    else OpenGameMenu(grades);
  }

  W.OpenGameMenu = OpenGameMenu;
  W.CloseGameMenu = CloseGameMenu;
  W.ToggleGameMenu = ToggleGameMenu;

  /* CSS */
  function InjectCSS() {
    if (document.getElementById('gf-arcade-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-arcade-css';
    s.textContent = `
/* Arcade – theme tokens */
#gf-arcade {
  --bg:#ffffff; --surf:#f5f5f5; --surf2:#ececec; --brd:#e0e0e0;
  --txt:#111; --txt2:#555; --txt3:#aaa;
  --sh1:rgba(0,0,0,0.06); --sh2:rgba(0,0,0,0.14);
}
#gf-arcade[data-theme="dark"] {
  --bg:#111; --surf:#1a1a1a; --surf2:#222; --brd:#2a2a2a;
  --txt:#eee; --txt2:#888; --txt3:#555;
  --sh1:rgba(0,0,0,0.3); --sh2:rgba(0,0,0,0.55);
}

/* Root NO backdrop */
#gf-arcade {
  position:fixed; inset:0; z-index:2147483640;
  display:flex; align-items:center; justify-content:center;
  background:none;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}
#gf-arc-modal {
  background:var(--bg); border:1px solid var(--brd); border-radius:14px;
  box-shadow:0 8px 48px var(--sh2),0 1px 4px var(--sh1);
  max-width:760px; width:92vw; height:min(680px, calc(100vh - 42px)); max-height:calc(100vh - 42px);
  display:flex; flex-direction:column; overflow:hidden;
}
#gf-arc-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px; border-bottom:1px solid var(--brd); flex-shrink:0; user-select:none;
}
.gf-arc-hl { display:flex; align-items:center; gap:10px; }
.gf-arc-hr { display:flex; align-items:center; gap:8px; }
#gf-arc-icon {
  width:28px; height:28px; background:var(--gf-game-accent,#f97316); border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800; color:#fff; letter-spacing:-0.5px;
}
#gf-arc-t { font-size:16px; font-weight:700; color:var(--txt); letter-spacing:-0.3px; }
#gf-arc-badge {
  font-size:9px; font-weight:600; color:var(--gf-game-accent,#f97316);
  border:1px solid rgba(249,115,22,0.35); border-radius:4px; padding:2px 6px; letter-spacing:0.5px;
}
.gf-arc-key {
  font-size:10px; color:var(--txt3); background:var(--surf2);
  border:1px solid var(--brd); border-radius:4px; padding:2px 7px; font-family:inherit;
}
#gf-arc-x {
  width:26px; height:26px; border:1px solid var(--brd); border-radius:6px;
  background:none; color:var(--txt3); font-size:13px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:border-color .12s,color .12s,background .12s;
}
#gf-arc-x:hover { border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.08); }
#gf-arc-grid {
  display:grid; grid-template-columns:repeat(3,1fr);
  grid-auto-rows:176px; gap:14px; padding:18px; overflow-y:auto; flex:1; min-height:0;
}
#gf-arc-grid::-webkit-scrollbar { width:6px; }
#gf-arc-grid::-webkit-scrollbar-track { background:transparent; }
#gf-arc-grid::-webkit-scrollbar-thumb { background:var(--brd); border-radius:99px; }
#gf-arc-grid::-webkit-scrollbar-thumb:hover { background:var(--txt3); }
.gf-gc {
  display:flex; flex-direction:column;
  border:1px solid var(--brd); border-radius:10px;
  background:var(--surf); overflow:hidden;
  transition:transform .15s,box-shadow .15s;
}
.gf-gc:not(.gf-gc-soon):hover { transform:translateY(-2px); box-shadow:0 6px 24px var(--sh2); }
.gf-gc-soon { opacity:0.42; }
.gf-gc-prev {
  height:96px; background:var(--surf2);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; border-bottom:1px solid var(--brd);
}
.gf-gc-prev canvas { display:block; width:100%; height:100%; }
.gf-gc-body { padding:9px 12px; flex:1; min-height:0; }
.gf-gc-title { font-size:13px; font-weight:700; margin-bottom:2px; }
.gf-gc-desc { font-size:10px; color:var(--txt2); line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.gf-gc-play {
  display:block; width:100%; padding:8px 9px;
  border:none; border-top:1px solid var(--brd);
  background:none; color:var(--gf-game-accent,#f97316);
  font-family:inherit; font-size:11px; font-weight:700;
  cursor:pointer; transition:background .12s;
}
.gf-gc-play:hover:not(:disabled) { background:color-mix(in srgb, var(--gf-game-accent,#f97316) 12%, transparent); }
.gf-gc-play:disabled { color:var(--txt3); cursor:default; font-weight:400; }
@media (max-width: 680px) {
  #gf-arc-modal { width:94vw; height:min(620px, calc(100vh - 28px)); }
  #gf-arc-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width: 460px) {
  #gf-arc-grid { grid-template-columns:1fr; grid-auto-rows:168px; padding:14px; }
}
`;
    document.head.appendChild(s);
  }

})(window);
