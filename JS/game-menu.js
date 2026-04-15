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
  ];

  W._gfGames = GAMES;

  let _el = null, _grades = [], _activeId = null, _kh = null;

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
  const IsDarkTheme = () => document.documentElement.getAttribute('data-gf-theme') === 'dark';

  function SyncTheme() {
    if (!_el) return;
    const d = IsDarkTheme();
    _el.style.filter = d ? 'invert(1) hue-rotate(180deg)' : '';
    _el.dataset.theme = d ? 'dark' : 'light';
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

    for (const g of GAMES) {
      const c = document.getElementById(`gf-gp-${g.id}`);
      if (c && g.buildPreview) g.buildPreview(c, g.accent);
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
      if (!cv.isConnected) return;
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

      requestAnimationFrame(Tick);
    }
    requestAnimationFrame(Tick);
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
      if (!cv.isConnected) return;
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
      requestAnimationFrame(Tick);
    }
    requestAnimationFrame(Tick);
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
      if (!cv.isConnected) return;

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

      requestAnimationFrame(Tick);
    }
    requestAnimationFrame(Tick);
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

      requestAnimationFrame(Tick);
    }
    requestAnimationFrame(Tick);
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
      if (!cv.isConnected) return;

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
      requestAnimationFrame(Tick);
    }

    setTimeout(StartFlip, 700);
    requestAnimationFrame(Tick);
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
      if (!cv.isConnected) return;

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

      requestAnimationFrame(Tick);
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
    requestAnimationFrame(Tick);
  }


  /* Launch game */
  const _GAME_CLOSE_SEL = {
    gradestack:   '#gf-tt-close',
    gradesnake:   '#gf-sn-close-btn',
    grade2048:    '#gf-28-close',
    gradesweeper: '#gf-sw-close',
    gradememory:  '#gf-mem-close',
    gradeshooter: '#gf-sh-close',
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
    if (_el) _el.style.display = 'none';
    _DetachKeys();
    _tobs.disconnect();
  }

  function _AttachKeys() {
    if (_kh) return;
    _kh = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGameMenu(); } };
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
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
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
  max-width:740px; width:92vw; max-height:82vh;
  display:flex; flex-direction:column; overflow:hidden;
}
#gf-arc-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px; border-bottom:1px solid var(--brd); flex-shrink:0; user-select:none;
}
.gf-arc-hl { display:flex; align-items:center; gap:10px; }
.gf-arc-hr { display:flex; align-items:center; gap:8px; }
#gf-arc-icon {
  width:28px; height:28px; background:#f97316; border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800; color:#fff; letter-spacing:-0.5px;
}
#gf-arc-t { font-size:16px; font-weight:700; color:var(--txt); letter-spacing:-0.3px; }
#gf-arc-badge {
  font-size:9px; font-weight:600; color:#f97316;
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
  gap:14px; padding:18px; overflow-y:auto; flex:1;
}
#gf-arc-grid::-webkit-scrollbar { width:4px; }
#gf-arc-grid::-webkit-scrollbar-thumb { background:var(--brd); border-radius:99px; }
.gf-gc {
  display:flex; flex-direction:column;
  border:1px solid var(--brd); border-radius:10px;
  background:var(--surf); overflow:hidden;
  transition:transform .15s,box-shadow .15s;
}
.gf-gc:not(.gf-gc-soon):hover { transform:translateY(-2px); box-shadow:0 6px 24px var(--sh2); }
.gf-gc-soon { opacity:0.42; }
.gf-gc-prev {
  height:110px; background:var(--surf2);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; border-bottom:1px solid var(--brd);
}
.gf-gc-prev canvas { display:block; width:100%; height:100%; }
.gf-gc-body { padding:10px 12px; flex:1; }
.gf-gc-title { font-size:13px; font-weight:700; margin-bottom:2px; }
.gf-gc-desc { font-size:10px; color:var(--txt2); line-height:1.45; }
.gf-gc-play {
  display:block; width:100%; padding:9px;
  border:none; border-top:1px solid var(--brd);
  background:none; color:#f97316;
  font-family:inherit; font-size:11px; font-weight:700;
  cursor:pointer; transition:background .12s;
}
.gf-gc-play:hover:not(:disabled) { background:rgba(249,115,22,0.08); }
.gf-gc-play:disabled { color:var(--txt3); cursor:default; font-weight:400; }
`;
    document.head.appendChild(s);
  }

})(window);
