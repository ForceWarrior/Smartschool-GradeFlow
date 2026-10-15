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
      id: 'gradeio',
      file: 'JS/games/gradeio.js',
      title: 'Grade.io',
      descKey: 'game_gradeio_desc',
      accent: '#38bdf8',
      ready: true,
      isNew: true,
      buildPreview: PreviewShot('gradeio'),
      launch(gr) { CloseGameMenu(); W.OpenGradeIo?.(gr); },
      stop()     { W.CloseGradeIo?.(); },
    },
    {
      id: 'gradecross',
      file: 'JS/games/gradecross.js',
      title: 'Crossy Grade',
      descKey: 'game_gradecross_desc',
      accent: '#22c55e',
      ready: true,
      isNew: true,
      buildPreview: PreviewShot('gradecross'),
      launch(gr) { CloseGameMenu(); W.OpenGradeCross?.(gr); },
      stop()     { W.CloseGradeCross?.(); },
    },
    {
      id: 'gradesurfers',
      file: 'JS/games/gradesurfers.js',
      title: 'Grade Surfers',
      descKey: 'game_gradesurfers_desc',
      accent: '#f59e0b',
      ready: true,
      isNew: true,
      buildPreview: PreviewShot('gradesurfers'),
      launch(gr) { CloseGameMenu(); W.OpenGradeSurfers?.(gr); },
      stop()     { W.CloseGradeSurfers?.(); },
    },
    {
      id: 'gradehook',
      file: 'JS/games/gradehook.js',
      title: 'Grade Hook',
      descKey: 'game_gradehook_desc',
      accent: '#ec4899',
      ready: true,
      isNew: true,
      buildPreview: PreviewHook,
      launch(gr) { CloseGameMenu(); W.OpenGradeHook?.(gr); },
      stop()     { W.CloseGradeHook?.(); },
    },
    {
      id: 'gradestack',
      file: 'JS/games/tetris.js',
      title: 'GradeStack',
      descKey: 'game_gradestack_desc',
      desc: 'Classic block stacking powered by your grades',
      accent: '#f97316',
      ready: true,
      buildPreview: PreviewShot('tetris'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeTetris === 'function') OpenGradeTetris(gr); },
      stop()     { if (typeof CloseGradeTetris === 'function') CloseGradeTetris(); },
    },
    {
      id: 'gradesnake',
      file: 'JS/games/snake.js',
      title: 'GradeSnake',
      descKey: 'game_gradesnake_desc',
      desc: 'Guide the snake through your report card',
      accent: '#4ade80',
      ready: true,
      buildPreview: PreviewShot('snake'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeSnake === 'function') OpenGradeSnake(gr); },
      stop()     { if (typeof CloseGradeSnake === 'function') CloseGradeSnake(); },
    },
    {
      id: 'grade2048',
      file: 'JS/games/grade2048.js',
      title: 'Grade 2048',
      descKey: 'game_grade2048_desc',
      desc: 'Merge weak grades into stronger ones - reach 20/20!',
      accent: '#f59e0b',
      ready: true,
      buildPreview: PreviewShot('grade2048'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGrade2048 === 'function') OpenGrade2048(gr); },
      stop()     { if (typeof CloseGrade2048 === 'function') CloseGrade2048(); },
    },
    {
      id: 'gradesweeper',
      file: 'JS/games/gradesweeper.js',
      title: 'GradeSweeper',
      descKey: 'game_gradesweeper_desc',
      desc: 'Reveal all safe grades without uncovering a fail',
      accent: '#60a5fa',
      ready: true,
      buildPreview: PreviewShot('gradesweeper'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeSweeper === 'function') OpenGradeSweeper(gr); },
      stop()     { if (typeof CloseGradeSweeper === 'function') CloseGradeSweeper(); },
    },
    {
      id: 'gradememory',
      file: 'JS/games/gradememory.js',
      title: 'GradeMemory',
      descKey: 'game_gradememory_desc',
      desc: 'Flip grade cards and match every pair from memory',
      accent: '#a78bfa',
      ready: true,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeMemory === 'function') OpenGradeMemory(gr); },
      stop()     { if (typeof CloseGradeMemory === 'function') CloseGradeMemory(); },
      buildPreview: PreviewShot('gradememory'),
    },
    {
      id: 'gradeshooter',
      file: 'JS/games/gradeshooter.js',
      title: 'GradeShooter',
      descKey: 'game_gradeshooter_desc',
      desc: 'Fire grade bubbles and match 3+ of the same band to clear',
      accent: '#22d3ee',
      ready: true,
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeShooter === 'function') OpenGradeShooter(gr); },
      stop()     { if (typeof CloseGradeShooter === 'function') CloseGradeShooter(); },
      buildPreview: PreviewShot('gradeshooter'),
    },
    {
      id: 'gradebreakout',
      file: 'JS/games/gradebreakout.js',
      title: 'GradeBreakout',
      descKey: 'game_gradebreakout_desc',
      desc: 'Smash grade bricks with the ball and rack up points',
      accent: '#f43f5e',
      ready: true,
      buildPreview: PreviewShot('gradebreakout'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeBreakout === 'function') OpenGradeBreakout(gr); },
      stop()     { if (typeof CloseGradeBreakout === 'function') CloseGradeBreakout(); },
    },
    {
      id: 'gradepong',
      file: 'JS/games/gradepong.js',
      title: 'GradePong',
      descKey: 'game_gradepong_desc',
      desc: 'Beat the AI in a grade-powered game of pong',
      accent: '#06b6d4',
      ready: true,
      buildPreview: PreviewShot('gradepong'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradePong === 'function') OpenGradePong(gr); },
      stop()     { if (typeof CloseGradePong === 'function') CloseGradePong(); },
    },
    {
      id: 'gradeflappy',
      file: 'JS/games/gradeflappy.js',
      title: 'GradeFlappy',
      descKey: 'game_gradeflappy_desc',
      desc: 'Fly through the pipes and dodge bad grades',
      accent: '#eab308',
      ready: true,
      buildPreview: PreviewShot('gradeflappy'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeFlappy === 'function') OpenGradeFlappy(gr); },
      stop()     { if (typeof CloseGradeFlappy === 'function') CloseGradeFlappy(); },
    },
    {
      id: 'graderunner',
      file: 'JS/games/graderunner.js',
      title: 'GradeRunner',
      descKey: 'game_graderunner_desc',
      desc: 'Sprint, jump, and slide through a grade-powered endless run',
      accent: '#4ade80',
      ready: true,
      buildPreview: PreviewShot('graderunner'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeRunner === 'function') OpenGradeRunner(gr); },
      stop()     { if (typeof CloseGradeRunner === 'function') CloseGradeRunner(); },
    },
    {
      id: 'gradetower',
      file: 'JS/games/gradetower.js',
      title: 'GradeTower',
      descKey: 'game_gradetower_desc',
      desc: 'Build tiny grade towers and defend your report path',
      accent: '#22d3ee',
      ready: true,
      buildPreview: PreviewShot('gradetower'),
      launch(gr) { CloseGameMenu(); if (typeof OpenGradeTower === 'function') OpenGradeTower(gr); },
      stop()     { if (typeof CloseGradeTower === 'function') CloseGradeTower(); },
    },
  ];

  W._gfGames = GAMES;

  let _el = null, _grades = [], _activeId = null, _kh = null;

  const _previewTicks = [];
  let _previewRaf = null;
  let _previewLastTs = 0;
  const PREVIEW_INTERVAL = 33;

  function _PreviewLoop(ts) {
    _previewRaf = null;
    if (!_previewTicks.length) return;
    const elapsed = ts - _previewLastTs;
    if (elapsed >= PREVIEW_INTERVAL) {
      _previewLastTs = ts - (elapsed % PREVIEW_INTERVAL);
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

  function RandomInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function CreateCanvas(el, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    el.appendChild(cv);
    return cv;
  }

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
          <div class="gf-gc-title" style="color:${g.accent}">${g.title}${g.isNew ? `<span class="gf-gc-new">${_GameText('game_new')}</span>` : ''}</div>
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
          <kbd class="gf-arc-key">${W.GfKeys ? W.GfKeys.label('arcade') : 'F8'}</kbd>
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











  function PreviewShot(name) {
    return el => {
      const img = document.createElement('img');
      img.className = 'gf-gc-shot';
      img.alt = '';
      img.decoding = 'async';
      img.src = chrome.runtime.getURL(`Assets/previews/${name}-${_el?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}.png`);
      el.appendChild(img);
    };
  }



  function PreviewHook(el) {
    const W = 160, H = 105;
    const cv = CreateCanvas(el, W, H);
    const ctx = cv.getContext('2d');
    const hooks = [{ x: 40, y: 22 }, { x: 95, y: 18 }, { x: 150, y: 26 }];
    let hi = 0, ang = -1.1, vel = 0.055, len = 34, flyT = 0, fx = 0, fy = 0, fvx = 0, fvy = 0, cam = 0;
    function Tick() {
      if (!cv.isConnected) return false;
      const dark = document.getElementById('gf-arcade')?.dataset.theme === 'dark';
      ctx.fillStyle = dark ? '#111827' : '#e0f2fe';
      ctx.fillRect(0, 0, W, H);
      let px, py;
      const h = hooks[hi];
      if (flyT > 0) {
        fvy += 0.12; fx += fvx; fy += fvy; flyT--;
        px = fx; py = fy;
        if (!flyT) { hi = (hi + 1) % hooks.length; const nh = hooks[hi]; len = Math.hypot(px - nh.x, py - nh.y); ang = Math.atan2(px - nh.x, py - nh.y); vel = 0.04; if (hi === 0) cam = 0; }
      } else {
        vel += -Math.sin(ang) * 0.004;
        ang += vel;
        px = h.x + Math.sin(ang) * len; py = h.y + Math.cos(ang) * len;
        if (ang > 0.9 && vel > 0) { flyT = 22; fx = px; fy = py; fvx = Math.cos(ang) * vel * len * 1.15; fvy = -Math.sin(ang) * vel * len * 0.9; }
      }
      cam += ((px - 60) - cam) * 0.08;
      ctx.save(); ctx.translate(-Math.max(0, cam), 0);
      ctx.fillStyle = '#f472b6'; ctx.fillRect(170, 90, 50, 6);
      for (const k of hooks) { ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(k.x, k.y, 5, 0, 6.28); ctx.fill(); ctx.fillStyle = '#fbcfe8'; ctx.beginPath(); ctx.arc(k.x - 1.5, k.y - 1.5, 1.6, 0, 6.28); ctx.fill(); }
      if (!flyT) { ctx.strokeStyle = dark ? '#e5e7eb' : '#1f2937'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(px, py); ctx.stroke(); }
      const rot = flyT ? (22 - flyT) * 0.3 : ang;
      ctx.translate(px, py); ctx.rotate(-rot * 0.6);
      ctx.strokeStyle = dark ? '#f9fafb' : '#111827'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 4, 3, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, 16); ctx.moveTo(0, 9); ctx.lineTo(0, 0); ctx.moveTo(0, 10); ctx.lineTo(5, 13); ctx.moveTo(0, 16); ctx.lineTo(-4, 22); ctx.moveTo(0, 16); ctx.lineTo(4, 22); ctx.stroke();
      ctx.restore();
      return true;
    }
    RegisterPreview(Tick);
  }

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
    gradeio:       '#gf-io-close',
    gradecross:    '#gf-cr-close',
    gradesurfers:  '#gf-ss-close',
    gradehook:     '#gf-hk-close',
  };

  function LaunchGame(game) {
    _activeId = game.id;
    _Hide();
    const load = W._GfLoadScripts ? W._GfLoadScripts([game.file]) : Promise.resolve(true);
    load.then(ok => {
      if (_activeId !== game.id) return;
      if (!ok) { _activeId = null; OpenGameMenu(_grades); return; }
      game.launch(_grades);
      WatchClose(game);
    });
  }

  function WatchClose(game) {
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

  function InjectCSS() {
    if (document.getElementById('gf-arcade-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-arcade-css';
    s.textContent = `
#gf-arcade {
  --bg:#ffffff; --surf:#f5f5f5; --surf2:#ececec; --brd:#e0e0e0;
  --txt:#111; --txt2:#555; --txt3:#868686;
  --sh1:rgba(0,0,0,0.06); --sh2:rgba(0,0,0,0.14);
}
#gf-arcade[data-theme="dark"] {
  --bg:#111; --surf:#1a1a1a; --surf2:#222; --brd:#2a2a2a;
  --txt:#eee; --txt2:#999; --txt3:#777;
  --sh1:rgba(0,0,0,0.3); --sh2:rgba(0,0,0,0.55);
}

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
  grid-auto-rows:198px; gap:14px; padding:18px; overflow-y:auto; flex:1; min-height:0;
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
.gf-gc-shot { display:block; width:100%; height:100%; object-fit:cover; }
.gf-gc-body { padding:9px 12px; flex:1; min-height:0; overflow:hidden; }
.gf-gc-title { font-size:13px; font-weight:700; margin-bottom:2px; }
.gf-gc-new { margin-left:6px; padding:1px 5px; border-radius:4px; background:var(--gf-game-accent,#f97316); color:#fff; font-size:8px; font-weight:800; letter-spacing:.6px; vertical-align:2px; }
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
