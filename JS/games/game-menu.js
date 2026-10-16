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
    ['gradeio',       'gradeio',       'Grade.io',      '#38bdf8', 'GradeIo', 'io-close', true],
    ['gradecross',    'gradecross',    'Crossy Grade',  '#22c55e', 'GradeCross', 'cr-close', true],
    ['gradesurfers',  'gradesurfers',  'Grade Surfers', '#f59e0b', 'GradeSurfers', 'ss-close', true],
    ['gradehook',     'gradehook',     'Grade Hook',    '#ec4899', 'GradeHook', 'hk-close', true],
    ['gradestack',    'tetris',        'GradeStack',    '#f97316', 'GradeTetris', 'tt-close'],
    ['gradesnake',    'snake',         'GradeSnake',    '#4ade80', 'GradeSnake', 'sn-close-btn'],
    ['grade2048',     'grade2048',     'Grade 2048',    '#f59e0b', 'Grade2048', '28-close'],
    ['gradesweeper',  'gradesweeper',  'GradeSweeper',  '#60a5fa', 'GradeSweeper', 'sw-close'],
    ['gradememory',   'gradememory',   'GradeMemory',   '#a78bfa', 'GradeMemory', 'mem-close'],
    ['gradeshooter',  'gradeshooter',  'GradeShooter',  '#22d3ee', 'GradeShooter', 'sh-close'],
    ['gradebreakout', 'gradebreakout', 'GradeBreakout', '#f43f5e', 'GradeBreakout', 'bo-close'],
    ['gradepong',     'gradepong',     'GradePong',     '#06b6d4', 'GradePong', 'po-close'],
    ['gradeflappy',   'gradeflappy',   'GradeFlappy',   '#eab308', 'GradeFlappy', 'fl-close'],
    ['graderunner',   'graderunner',   'GradeRunner',   '#4ade80', 'GradeRunner', 'rn-close'],
    ['gradetower',    'gradetower',    'GradeTower',    '#22d3ee', 'GradeTower', 'tw-close'],
  ].map(([id, shot, title, accent, fn, close, isNew]) => ({
    id, shot, title, accent, isNew,
    file: `JS/games/${shot}.js`,
    closeSel: `#gf-${close}`,
    launch(gr) { W['Open' + fn]?.(gr); },
    stop() { W['Close' + fn]?.(); },
  }));

  W._gfGames = GAMES;

  let _el = null, _grades = [], _activeId = null, _kh = null;

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

    const cards = GAMES.map(g => `
      <div class="gf-gc" data-gid="${g.id}">
        <div class="gf-gc-prev" id="gf-gp-${g.id}"></div>
        <div class="gf-gc-body">
          <div class="gf-gc-title" style="color:${g.accent}">${g.title}${g.isNew ? `<span class="gf-gc-new">${_GameText('game_new')}</span>` : ''}</div>
          <div class="gf-gc-desc">${_GameText(`game_${g.id}_desc`)}</div>
        </div>
        <button class="gf-gc-play" data-play="${g.id}">
          ▶ ${_GameText('game_play')}
        </button>
      </div>`).join('');

    _el.innerHTML = `
    <div id="gf-arc-modal">
      <div id="gf-arc-hdr">
        <div class="gf-arc-hl">
          <div id="gf-arc-icon">GF</div>
          <span id="gf-arc-t">${_GameText('game_arcade')}</span>
          <span id="gf-arc-badge">${GAMES.length} ${_GameText('game_games')}</span>
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
      if (btn) {
        const g = GAMES.find(x => x.id === btn.dataset.play);
        if (g) LaunchGame(g);
      }
    });
  }

  function RenderPreviews() {
    const theme = _el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    for (const g of GAMES) {
      const img = document.createElement('img');
      img.className = 'gf-gc-shot';
      img.alt = '';
      img.decoding = 'async';
      img.src = chrome.runtime.getURL(`Assets/previews/${g.shot}-${theme}.webp`);
      document.getElementById(`gf-gp-${g.id}`).replaceChildren(img);
    }
  }

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
    function OnGameClose(e) {
      if (!e.target.closest(game.closeSel)) return;
      e.stopImmediatePropagation();
      document.removeEventListener('click', OnGameClose, true);
      game.stop();
      _activeId = null;
      OpenGameMenu(_grades);
    }
    document.addEventListener('click', OnGameClose, true);
  }

  function _Hide() {
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
      if (g) g.stop();
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
    if (!_activeId && _el && _el.style.display !== 'none') CloseGameMenu();
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
.gf-gc:hover { transform:translateY(-2px); box-shadow:0 6px 24px var(--sh2); }
.gf-gc-prev {
  height:96px; background:var(--surf2);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; border-bottom:1px solid var(--brd);
}
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
.gf-gc-play:hover { background:color-mix(in srgb, var(--gf-game-accent,#f97316) 12%, transparent); }
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
