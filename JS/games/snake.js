;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV = 320;

  const LEVELS = [
    { id: 1, N: 8,  speed: 200, target: 1500  },
    { id: 2, N: 10, speed: 175, target: 3500  },
    { id: 3, N: 13, speed: 155, target: 6000  },
    { id: 4, N: 16, speed: 138, target: 10000 },
    { id: 5, N: 20, speed: 120, target: 15000 },
    { id: 6, N: 15, speed: 150, target: Infinity, freePlay: true },
  ];

  const LS_UNLOCK = 'gf-snake-unlock';
  const LS_SCORES = 'gf-snake-scores';
  const LS_MODS   = 'gf-snake-mods';
  const MIN_LEN   = 2;

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function LoadUnlock()    { return StorageGet(LS_UNLOCK, 0); }
  function SaveUnlock(n)   { if (n > LoadUnlock()) StorageSet(LS_UNLOCK, n); }
  function LoadScores()    { return StorageGet(LS_SCORES, {}); }
  function SaveScore(l, s) { const sc = LoadScores(); if (s > (sc[l] || 0)) { sc[l] = s; StorageSet(LS_SCORES, sc); } }
  function LoadMods()      { return { ...DefaultMods(), ...StorageGet(LS_MODS, {}) }; }
  function SaveMods(m)     { StorageSet(LS_MODS, m); }
  function DefaultMods()   { return { negRate: 0.25, posBoost: 1, speedMult: 1.0, maxApples: 2 }; }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }

  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis',
               'Engels','Informatica','Muziek','Sport','Latijn','Economie','Chemie'];
    return Array.from({ length: 28 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }

  function GradeEffect(Pct) {
    if (Pct == null) return 0.5;
    if (Pct >= 75)  return  1.0;
    if (Pct >= 50)  return  0.5;
    if (Pct >= 25)  return -0.5;
    return -1.0;
  }

  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }

  function IsPositive(g) { return g.Pct == null || g.Pct >= 50; }

  let GS = null, _el = null, _grades = [], _lvlId = 1, _raf = null, _l6N = 15;

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    const N = lvl.freePlay ? _l6N : lvl.N;
    const cx = Math.floor(N / 2), cy = Math.floor(N / 2);
    const snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    return {
      lvl, N, mods: LoadMods(),
      snake, PrevSnake: snake.map(s => ({ ...s })),
      dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      apples: [],
      growthBuffer: 0,   // float, resolved ±1 per Step
      score: 0, applesEaten: 0,
      status: 'start',
      lastEaten: null,
      flash: null,       // { x, y, color, t 0→1 }
      moveT: 0,          // linear 0->1 between logical steps
      lastFrameTs: 0,
      toxicity: 0,       // 0=green, 1=red; rises on negative grades, decays over time
    };
  }

  function OccupiedSet(gs) {
    const s = new Set();
    gs.snake.forEach(p => s.add(`${p.x},${p.y}`));
    gs.apples.forEach(a => s.add(`${a.x},${a.y}`));
    return s;
  }

  function RandomEmpty(gs) {
    const Occ = OccupiedSet(gs);
    const pool = [];
    for (let y = 0; y < gs.N; y++)
      for (let x = 0; x < gs.N; x++)
        if (!Occ.has(`${x},${y}`)) pool.push({ x, y });
    return pool.length ? pool[0 | (Math.random() * pool.length)] : null;
  }

  function PickPos() {
    const pool = _grades.length ? _grades : FallbackGrades();
    const pos = pool.filter(IsPositive);
    return (pos.length ? pos : pool)[0 | (Math.random() * (pos.length || pool.length))];
  }
  function PickNeg() {
    const pool = _grades.length ? _grades : FallbackGrades();
    const neg = pool.filter(g => !IsPositive(g));
    return (neg.length ? neg : pool)[0 | (Math.random() * (neg.length || pool.length))];
  }

  function SyncApples(gs) {
    const maxA = Math.max(1, Math.min(gs.mods.maxApples, 3));
    let hasPosApple = gs.apples.some(a =>  IsPositive(a.grade));
    let hasNegApple = gs.apples.some(a => !IsPositive(a.grade));

    while (gs.apples.length < maxA) {
      const pos = RandomEmpty(gs);
      if (!pos) break;

      let g;
      if (!hasPosApple) {
        g = PickPos(); hasPosApple = true;
      } else if (!hasNegApple && gs.mods.negRate > 0 && Math.random() < gs.mods.negRate) {
        g = PickNeg(); hasNegApple = true;
      } else {
        g = PickPos(); hasPosApple = true;
      }

      gs.apples.push({ x: pos.x, y: pos.y, grade: g, color: GradeColor(g.Pct), born: performance.now() });
    }
  }

  function Step(gs) {
    gs.dir = gs.nextDir;
    const nx = gs.snake[0].x + gs.dir.x;
    const ny = gs.snake[0].y + gs.dir.y;

    // Wall
    if (nx < 0 || nx >= gs.N || ny < 0 || ny >= gs.N) { gs.status = 'gameover'; return; }

    const tailFrees = gs.growthBuffer < 1;
    for (let i = 0; i < gs.snake.length; i++) {
      if (tailFrees && i === gs.snake.length - 1) continue;
      if (gs.snake[i].x === nx && gs.snake[i].y === ny) { gs.status = 'gameover'; return; }
    }

    gs.PrevSnake = gs.snake.map(s => ({ x: s.x, y: s.y }));

    gs.snake.unshift({ x: nx, y: ny });

    // Apple eaten?
    const ai = gs.apples.findIndex(a => a.x === nx && a.y === ny);
    if (ai >= 0) {
      const apple = gs.apples.splice(ai, 1)[0];
      const rawDelta = GradeEffect(apple.grade.Pct);
      const delta    = rawDelta > 0 ? rawDelta * (gs.mods.posBoost || 1) : rawDelta;
      gs.growthBuffer = Math.max(-3, Math.min(3, gs.growthBuffer + delta));
      gs.applesEaten++;
      gs.lastEaten = apple.grade;
      const pts = Math.round((apple.grade.Pct ?? 60) * Math.abs(rawDelta) * 10);
      if (rawDelta > 0) {
        gs.score += pts;
        gs.toxicity = Math.max(0, gs.toxicity - 0.15 * rawDelta);
      } else {
        gs.score = Math.max(0, gs.score - pts);
        gs.toxicity = Math.min(1, gs.toxicity + 0.35 * Math.abs(rawDelta));
      }
      gs.flash = { x: nx, y: ny, color: apple.color, t: 0 };
      SyncApples(gs);
    }

    if (gs.growthBuffer >= 1) {
      gs.growthBuffer -= 1;
    } else if (gs.growthBuffer <= -1) {
      gs.growthBuffer += 1;
      gs.snake.pop(); // normal tail move
      if (gs.snake.length > MIN_LEN) gs.snake.pop(); // extra shrink
    } else {
      gs.snake.pop(); // neutral move
    }

    if (!gs.lvl.freePlay && gs.score >= gs.lvl.target) gs.status = 'win';
  }

  function GetSpeed(gs) { return Math.max(60, Math.round(gs.lvl.speed / (gs.mods.speedMult || 1))); }

  function StartLoop() {
    _raf = requestAnimationFrame(function Frame(ts) {
      if (!GS || GS.status !== 'playing') return;

      const dt = Math.min(ts - (GS.lastFrameTs || ts), 80); // cap to avoid jumps
      GS.lastFrameTs = ts;

      GS.moveT += dt / GetSpeed(GS);
      GS.toxicity = Math.max(0, GS.toxicity - dt * 0.00018);

      if (GS.moveT >= 1) {
        GS.moveT = 0; // snap no leftover carry, keeps timing tight
        Step(GS);
        if (GS.status === 'gameover') { StopLoop(); ShowGameOver(); return; }
        if (GS.status === 'win')      { StopLoop(); ShowWin();      return; }
      }

      if (GS.flash) { GS.flash.t = Math.min(1, GS.flash.t + dt / 220); if (GS.flash.t >= 1) GS.flash = null; }

      Draw();
      _raf = requestAnimationFrame(Frame);
    });
  }

  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  function GetCanvasColors() {
    const dark = document.getElementById('gf-snake')?.dataset.theme === 'dark';
    return dark ? { bg: '#0a0a0a', grid: '#181818' } : { bg: '#f0f0f0', grid: '#d8d8d8' };
  }

  function GetSnakeSegmentColor(tox, segT) {
    const r0 = Math.round(74  + (248 - 74)  * tox);
    const g0 = Math.round(222 + (113 - 222) * tox);
    const b0 = Math.round(128 + (113 - 128) * tox);
    const f  = Math.max(0.5, 1 - segT * 0.45);
    return `rgb(${Math.round(r0 * f)},${Math.round(g0 * f)},${Math.round(b0 * f)})`;
  }

  function Draw() {
    const cv = document.getElementById('gf-sn-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const N = GS.N, CW = CV / N, CH = CV / N;
    const cc = GetCanvasColors();
    const t  = GS.moveT; // linear: 0 = just stepped, 1 = about to Step

    // Background + grid
    ctx.fillStyle = cc.bg; ctx.fillRect(0, 0, CV, CV);
    ctx.strokeStyle = cc.grid; ctx.lineWidth = 0.5;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CW, 0);  ctx.lineTo(i * CW, CV);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,  i * CH); ctx.lineTo(CV,  i * CH); ctx.stroke();
    }

    // Eat flash
    if (GS.flash) {
      ctx.globalAlpha = (1 - GS.flash.t) * 0.4;
      ctx.fillStyle = GS.flash.color;
      ctx.fillRect(GS.flash.x * CW, GS.flash.y * CH, CW, CH);
      ctx.globalAlpha = 1;
    }

    if (!GS.lvl.freePlay) {
      const prog = Math.min(1, GS.score / GS.lvl.target);
      ctx.fillStyle = 'rgba(74,222,128,0.18)';
      ctx.fillRect(0, CV - 3, CV * prog, 3);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, CV - 3, CV * prog, 3);
    }

    // Apples
    const now = performance.now();
    for (const a of GS.apples) {
      const pulse = 0.88 + 0.12 * Math.sin((now - a.born) / 420 * Math.PI * 2);
      const ax = a.x * CW + CW / 2, ay = a.y * CH + CH / 2;
      const r  = Math.min(CW, CH) * 0.37 * pulse;

      // Soft glow
      const grd = ctx.createRadialGradient(ax, ay, 0, ax, ay, r * 1.7);
      grd.addColorStop(0, a.color + '88'); grd.addColorStop(1, a.color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(ax, ay, r * 1.7, 0, Math.PI * 2); ctx.fill();

      // Body
      ctx.fillStyle = a.color; ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      // Grade % label
      if (CW >= 15) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.font = `700 ${Math.max(7, Math.floor(CW * 0.27))}px "IBM Plex Mono",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.grade.Pct != null ? `${Math.round(a.grade.Pct)}` : '?', ax, ay);
      }

      // ± badge
      if (CW >= 12) {
        const eff = GradeEffect(a.grade.Pct);
        ctx.fillStyle = eff > 0 ? '#4ade80' : '#f87171';
        ctx.font = `800 ${Math.max(5, Math.floor(CW * 0.19))}px "IBM Plex Mono",monospace`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText(eff >= 1 ? '++' : eff >= 0.5 ? '+' : eff <= -1 ? '--' : '−',
                     a.x * CW + CW - 2, a.y * CH + 2);
      }
    }
    ctx.textAlign = 'left';

    const slen = GS.snake.length;
    const prev = GS.PrevSnake;
    const pad  = Math.max(1, CW * 0.07);
    const rad  = Math.max(1.5, CW * 0.14);

    for (let i = slen - 1; i >= 0; i--) {
      const cur = GS.snake[i];
      const p   = prev?.[i];

      const rx = (p ? p.x + (cur.x - p.x) * t : cur.x) * CW;
      const ry = (p ? p.y + (cur.y - p.y) * t : cur.y) * CH;

      const isHead = i === 0;
      const segT   = i / Math.max(slen - 1, 1); // 0=head 1=tail
      const alpha  = isHead ? 1 : Math.max(0.45, 1 - segT * 0.4);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = GetSnakeSegmentColor(GS.toxicity, segT);

      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(rx + pad, ry + pad, CW - pad * 2, CH - pad * 2, rad); ctx.fill();
      } else {
        ctx.fillRect(rx + pad, ry + pad, CW - pad * 2, CH - pad * 2);
      }

      // Sheen
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(rx + pad, ry + pad, CW - pad * 2, (CH - pad * 2) * 0.36);
      ctx.globalAlpha = 1;

      if (isHead && CW >= 8) {
        const d  = GS.dir;
        const hx = rx + CW / 2, hy = ry + CH / 2;
        const er = Math.max(1.2, CW * 0.1);
        const fw = d.x !== 0 ? CW * 0.14 : CH * 0.14;
        const pf = d.x !== 0 ? CH * 0.22 : CW * 0.22;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath(); ctx.arc(hx + d.x*fw - d.y*pf, hy + d.y*fw + d.x*pf, er, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + d.x*fw + d.y*pf, hy + d.y*fw - d.x*pf, er, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const pr = er * 0.38;
        ctx.beginPath(); ctx.arc(hx + d.x*(fw+pr) - d.y*pf, hy + d.y*(fw+pr) + d.x*pf, pr, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + d.x*(fw+pr) + d.y*pf, hy + d.y*(fw+pr) - d.x*pf, pr, 0, Math.PI*2); ctx.fill();
      }
    }

    UpdateHUD();
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!GS) return;
    const isFP = GS.lvl.freePlay;
    const prog = isFP ? 1 : Math.min(1, GS.score / GS.lvl.target);
    SetText('gf-sn-score',   GS.score.toLocaleString());
    SetText('gf-sn-target',  isFP ? '∞' : GS.lvl.target.toLocaleString());
    SetText('gf-sn-progpct', isFP ? _GameText('game_snake_free').toUpperCase() : `${Math.round(prog * 100)}%`);
    SetText('gf-sn-len',     `${GS.snake.length}`);
    SetText('gf-sn-eaten',   String(GS.applesEaten));

    const barEl = document.getElementById('gf-sn-progbar');
    if (barEl) {
      barEl.style.width = isFP ? '100%' : `${(prog * 100).toFixed(1)}%`;
      barEl.style.background = isFP ? '#a78bfa' : '#4ade80';
    }

    const bufEl = document.getElementById('gf-sn-gbuf');
    if (bufEl) {
      const buf = Math.max(-3, Math.min(3, GS.growthBuffer));
      bufEl.style.width      = `${((buf + 3) / 6 * 100).toFixed(1)}%`;
      bufEl.style.background = buf >= 0 ? '#4ade80' : '#f87171';
    }

    if (GS.lastEaten) {
      SetText('gf-sn-le-subj', GS.lastEaten.subject || '');
      const eff = GradeEffect(GS.lastEaten.Pct);
      const eEl = document.getElementById('gf-sn-le-eff');
      if (eEl) { eEl.textContent = eff === 1 ? '+1' : eff === 0.5 ? '+½' : eff === -0.5 ? '−½' : '−1'; eEl.style.color = eff > 0 ? '#4ade80' : '#f87171'; }
      const pEl = document.getElementById('gf-sn-le-pct');
      if (pEl) { pEl.textContent = GS.lastEaten.Pct != null ? `${Math.round(GS.lastEaten.Pct)}%` : '?'; pEl.style.color = GradeColor(GS.lastEaten.Pct); }
    }
  }

  const SCREEN_IDS = ['gf-sns-start','gf-sns-pause','gf-sns-gameover','gf-sns-win','gf-sns-mods'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    const isFP = GS.lvl.freePlay;
    if (isFP) {
      SaveScore(GS.lvl.id, GS.score);
      const best = LoadScores()[GS.lvl.id] || 0;
      SetText('gf-sns-go-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()}`);
      SetText('gf-sns-go-pct',   `${_GameText('game_best')}: ${best.toLocaleString()}`);
      const pEl = document.getElementById('gf-sns-go-pct');
      if (pEl) pEl.style.color = '#a78bfa';
    } else {
      SetText('gf-sns-go-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()} / ${GS.lvl.target.toLocaleString()}`);
      SetText('gf-sns-go-pct',   `${Math.round(GS.score / GS.lvl.target * 100)}% ${_GameText('game_snake_of_target')}`);
      const pEl = document.getElementById('gf-sns-go-pct');
      if (pEl) pEl.style.color = '#f97316';
    }
    ShowScreen('gf-sns-gameover'); Draw();
  }

  function ShowWin() {
    SaveScore(GS.lvl.id, GS.score);
    SaveUnlock(GS.lvl.id);
    const unlocked  = LoadUnlock();
    const nextLvl   = LEVELS.find(l => l.id === GS.lvl.id + 1);
    const hasNext   = nextLvl && !nextLvl.freePlay;
    const wonL5     = GS.lvl.id === 5;
    SetText('gf-sns-win-title', wonL5 ? `🏆 ${_GameText('game_snake_all_clear')}` : `${_GameText('game_snake_level_clear')}`);
    SetText('gf-sns-win-score', `${GS.score.toLocaleString()} pts`);
    document.getElementById('gf-sns-next')?.style.setProperty('display', hasNext ? 'block' : 'none');
    const modsBtn = document.getElementById('gf-sns-mods-btn');
    if (modsBtn) {
      if (unlocked >= 5) {
        modsBtn.textContent = `∞  ${_GameText('game_snake_free_play')}`;
        modsBtn.style.display = 'block';
      } else {
        modsBtn.style.display = 'none';
      }
    }
    ShowScreen('gf-sns-win'); Draw();
  }

  /* Level selector */
  function BuildLevelSelect() {
    const el = document.getElementById('gf-sn-lvl-sel');
    if (!el) return;
    const unlocked  = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail   = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const prog    = l.freePlay || !bestPts ? 0 : Math.min(1, bestPts / l.target);
      const nm      = l.freePlay ? '∞' : `L${l.id}`;
      const sz      = l.freePlay ? `${_l6N}×${_l6N}` : `${l.N}×${l.N}`;
      const tgtTxt  = l.freePlay ? `${_GameText('game_snake_free_play')} - ${_GameText('game_snake_no_target')}` : `${l.target.toLocaleString()} pts`;
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_not_played');
      return `<button class="gf-snl${avail ? '' : ' gf-snl-locked'}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-snl-left">
          <div class="gf-snl-badge${l.freePlay ? ' gf-snl-badge-fp' : ''}">${nm}</div>
          <div class="gf-snl-info">
            <span class="gf-snl-name">${sz} ${_GameText('game_snake_grid')}</span>
            <span class="gf-snl-tgt">${tgtTxt}</span>
          </div>
        </div>
        <div class="gf-snl-right">
          ${avail && !l.freePlay ? `
            <div class="gf-snl-prog-track"><div class="gf-snl-prog-fill" style="width:${(prog*100).toFixed(0)}%"></div></div>
            <span class="gf-snl-best">${bestTxt}</span>
          ` : avail ? `<span class="gf-snl-best" style="color:#a78bfa">${bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_unlocked')}</span>` : `<span style="font-size:14px">🔒</span>`}
        </div>
      </button>`;
    }).join('');
    el.querySelectorAll('[data-lvl]').forEach(btn => {
      btn.addEventListener('click', () => {
        _lvlId = parseInt(btn.dataset.lvl);
        DoStart(); // click = start immediately
      });
    });
  }

  /* Modifiers */
  function BuildModsScreen() {
    const el = document.getElementById('gf-sns-mods');
    if (!el) return;
    const m = LoadMods();
    function Opts(id, pairs, cur) {
      return `<div class="gf-mod-opts" id="${id}">${pairs.map(([v, lbl]) =>
        `<button class="gf-mod-btn${+cur === v ? ' gf-mod-active' : ''}" data-val="${v}">${lbl}</button>`).join('')}</div>`;
    }
    el.innerHTML = `
      <div class="gf-sns-logo" style="font-size:20px;color:#a78bfa">${_GameText('game_snake_free_settings')}</div>
      <div class="gf-sns-sub">${_GameText('game_snake_tune')}</div>
      <div class="gf-mod-grid">
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_bad_rate')}</span>
          ${Opts('gfm-neg',[[0,_GameText('game_snake_none')],[0.1,_GameText('game_snake_rare')],[0.25,_GameText('game_snake_normal')],[0.5,_GameText('game_snake_often')],[0.8,_GameText('game_snake_lots')]], m.negRate)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_pos_boost')}</span>
          ${Opts('gfm-pos',[[1,'×1'],[1.5,'×1.5'],[2,'×2'],[3,'×3']], m.posBoost)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_speed')}</span>
          ${Opts('gfm-spd',[[0.5,_GameText('game_snake_slow')],[0.75,_GameText('game_snake_easy')],[1,_GameText('game_snake_normal')],[1.5,_GameText('game_snake_fast')],[2,_GameText('game_snake_chaos')]], m.speedMult)}</div>
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_apples')}</span>
          ${Opts('gfm-apl',[[1,'1'],[2,'2'],[3,'3']], m.maxApples)}</div>
      </div>
      <div class="gf-mod-grid" style="margin-top:8px">
        <div class="gf-mod-row"><span class="gf-mod-label">${_GameText('game_snake_grid_size')}</span>
          ${Opts('gfm-grid',[[5,'5×5'],[8,'8×8'],[11,'11×11'],[15,'15×15'],[20,'20×20']], _l6N)}</div>
      </div>
      <div class="gf-mod-actions">
        <button class="gf-ts-btn" id="gfm-save">▶&nbsp; ${_GameText('game_snake_start_free')}</button>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gfm-back">← ${_GameText('game_back')}</button>
      </div>`;
    el.querySelectorAll('.gf-mod-opts').forEach(row => {
      row.querySelectorAll('.gf-mod-btn').forEach(btn => {
        btn.addEventListener('click', () => { row.querySelectorAll('.gf-mod-btn').forEach(b => b.classList.remove('gf-mod-active')); btn.classList.add('gf-mod-active'); });
      });
    });
    document.getElementById('gfm-save')?.addEventListener('click', () => {
      const pick = id => { const b = document.querySelector(`#${id} .gf-mod-active`); return b ? parseFloat(b.dataset.val) : null; };
      SaveMods({ negRate: pick('gfm-neg') ?? m.negRate, posBoost: pick('gfm-pos') ?? m.posBoost, speedMult: pick('gfm-spd') ?? m.speedMult, maxApples: pick('gfm-apl') ?? m.maxApples });
      const gridPick = pick('gfm-grid'); if (gridPick != null) _l6N = gridPick;
      _lvlId = 6; DoStart();
    });
    document.getElementById('gfm-back')?.addEventListener('click', ShowStartScreen);
  }

  /* FLOW */
  function DoStart() {
    StopLoop();
    GS = NewGameState(_lvlId); SyncApples(GS);
    GS.status = 'playing'; GS.lastFrameTs = performance.now();
    ShowScreen(null); Draw(); StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-sns-pause');
    } else if (GS.status === 'paused') {
      GS.status = 'playing'; GS.lastFrameTs = performance.now();
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    StopLoop(); GS = NewGameState(_lvlId); SyncApples(GS);
    BuildLevelSelect(); Draw(); ShowScreen('gf-sns-start');
  }

  let _kh = null;
  function OnKey(e) {
    if (!GS || !document.getElementById('gf-snake')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); GS.status === 'playing' || GS.status === 'paused' ? DoPause() : CloseGradeSnake(); return; }
    if (e.key === 'p' || e.key === 'P') { DoPause(); return; }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') { (GS.status === 'start' || GS.status === 'gameover') ? DoStart() : GS.status === 'paused' && DoPause(); e.preventDefault(); }
      return;
    }
    const d = GS.dir;
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': if (d.y !==  1) GS.nextDir = { x:  0, y: -1 }; break;
      case 'ArrowDown':  case 's': case 'S': if (d.y !== -1) GS.nextDir = { x:  0, y:  1 }; break;
      case 'ArrowLeft':  case 'a': case 'A': if (d.x !==  1) GS.nextDir = { x: -1, y:  0 }; break;
      case 'ArrowRight': case 'd': case 'D': if (d.x !== -1) GS.nextDir = { x:  1, y:  0 }; break;
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
  }
  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); }
  function DetachKeys()  { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } }
  function OnVisibilityChange()       { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-snake');
    if (!el) return;
    const dark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
    el.style.filter = dark ? 'invert(1) hue-rotate(180deg)' : '';
    el.dataset.theme = dark ? 'dark' : 'light';
  }
  const _tobs = new MutationObserver(ApplyTheme);

  function BuildOverlay() {
    if (document.getElementById('gf-snake')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-snake';
    root.innerHTML = `
<div id="gf-sn-modal">
  <div id="gf-sn-hdr">
    <div class="gf-sn-hl">
      <div id="gf-sn-logo">GS</div>
      <span id="gf-sn-title">GradeSnake</span>
      <span id="gf-sn-badge">BETA</span>
    </div>
    <div class="gf-sn-hr">
      <span id="gf-sn-hint">F8</span>
      <button id="gf-sn-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-sn-close-btn" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-sn-body">
    <div id="gf-sn-board">
      <canvas id="gf-sn-canvas" width="${CV}" height="${CV}"></canvas>
    </div>
    <div id="gf-sn-hud">
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_score').toUpperCase()}</div>
        <div id="gf-sn-score" class="gf-snp-big" style="color:#4ade80">0</div>
        <div class="gf-snp-sub">${_GameText('game_snake_target')}: <span id="gf-sn-target">-</span></div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_snake_progress')} <span id="gf-sn-progpct" style="color:#4ade80;float:right">0%</span></div>
        <div class="gf-snp-bufwrap" style="margin-top:5px"><div id="gf-sn-progbar" class="gf-snp-buf" style="background:#4ade80"></div></div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_snake_momentum')}</div>
        <div class="gf-snp-bufwrap"><div id="gf-sn-gbuf" class="gf-snp-buf"></div></div>
        <div class="gf-snp-buflbl"><span style="color:#f87171">${_GameText('game_snake_shrink')}</span><span style="color:#888">·</span><span style="color:#4ade80">${_GameText('game_snake_grow')}</span></div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-label">${_GameText('game_snake_last_eaten')}</div>
        <div id="gf-sn-le-subj" class="gf-snp-le-subj">-</div>
        <div class="gf-snp-le-row">
          <span id="gf-sn-le-pct" class="gf-snp-le-pct"></span>
          <span id="gf-sn-le-eff" class="gf-snp-le-eff"></span>
        </div>
      </div>
      <div class="gf-snp">
        <div class="gf-snp-stat-row">
          <span class="gf-snp-label">${_GameText('game_snake_length')}</span><span id="gf-sn-len" class="gf-snp-val">3</span>
        </div>
        <div class="gf-snp-stat-row">
          <span class="gf-snp-label">${_GameText('game_snake_eaten')}</span><span id="gf-sn-eaten" class="gf-snp-val">0</span>
        </div>
      </div>
      <div class="gf-snp gf-snp-grades">
        <div class="gf-snp-label">${_GameText('game_snake_grade_effects')}</div>
        <div class="gf-sg-row"><span style="color:#4ade80">≥75%</span><span>${_GameText('game_snake_big_pts')}</span></div>
        <div class="gf-sg-row"><span style="color:#a3e635">50–74%</span><span>${_GameText('game_snake_pts')}</span></div>
        <div class="gf-sg-row"><span style="color:#f97316">25–49%</span><span>${_GameText('game_snake_neg_half')}</span></div>
        <div class="gf-sg-row"><span style="color:#f87171">&lt;25%</span><span>${_GameText('game_snake_neg_one')}</span></div>
      </div>
      <div class="gf-snp gf-snp-ctrl">
        <div class="gf-snp-label">${_GameText('game_controls')}</div>
        <div class="gf-sc-row"><kbd>↑↓←→</kbd><span>${_GameText('game_snake_move_desc')}</span></div>
        <div class="gf-sc-row"><kbd>P / Esc</kbd><span>${_GameText('game_pause')}</span></div>
      </div>
    </div>

    <div id="gf-sns-start" class="gf-sns" style="padding:16px 20px;justify-content:flex-start;gap:10px;">
      <div class="gf-sns-start-hdr">
        <div>
          <div class="gf-sns-logo" style="font-size:22px;margin-bottom:2px;">GradeSnake</div>
          <div class="gf-sns-sub">${_GameText('game_snake_subtitle')}</div>
        </div>
        <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-settings" title="${_GameText('game_snake_free_settings')}" style="padding:7px 12px;font-size:13px;">⚙</button>
      </div>
      <div id="gf-sn-lvl-sel" class="gf-sn-lvls"></div>
      <div class="gf-sns-effects">
        <span style="color:#4ade80">≥75%&nbsp;+1</span>
        <span style="color:#a3e635">50%&nbsp;+½</span>
        <span style="color:#f97316">25%&nbsp;−½</span>
        <span style="color:#f87171">&lt;25%&nbsp;−1</span>
      </div>
      <div class="gf-sns-footer">${_GameText('game_snake_footer')}</div>
      <button id="gf-sns-play" style="display:none"></button>
    </div>

    <div id="gf-sns-pause" class="gf-sns" style="display:none">
      <div class="gf-sns-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-ts-btn" id="gf-sns-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-sns-gameover" class="gf-sns" style="display:none">
      <div class="gf-sns-go-title">${_GameText('game_gameover')}</div>
      <div id="gf-sns-go-score" class="gf-sns-stat"></div>
      <div id="gf-sns-go-pct"   class="gf-sns-stat" style="color:#f97316"></div>
      <button class="gf-ts-btn"               id="gf-sns-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
      <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-back-go">← ${_GameText('game_levels')}</button>
    </div>

    <div id="gf-sns-win" class="gf-sns" style="display:none">
      <div id="gf-sns-win-title" class="gf-sns-win-title">${_GameText('game_snake_level_clear')}</div>
      <div id="gf-sns-win-score" class="gf-sns-stat" style="color:#4ade80;font-weight:700;font-size:18px"></div>
      <button class="gf-ts-btn"               id="gf-sns-next">→&nbsp; ${_GameText('game_snake_next_level')}</button>
      <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-mods-btn" style="display:none">⚙&nbsp; ${_GameText('game_snake_modifiers')}</button>
      <button class="gf-ts-btn gf-ts-btn-sec" id="gf-sns-back-win">← ${_GameText('game_levels')}</button>
    </div>

    <div id="gf-sns-mods" class="gf-sns" style="display:none;overflow-y:auto;padding:20px"></div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-sn-close-btn') ?.addEventListener('click', CloseGradeSnake);
    document.getElementById('gf-sn-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-sns-play')     ?.addEventListener('click', DoStart);
    document.getElementById('gf-sns-resume')   ?.addEventListener('click', DoPause);
    document.getElementById('gf-sns-retry')    ?.addEventListener('click', DoStart);
    document.getElementById('gf-sns-back-go')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-sns-back-win') ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-sns-next')     ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-sns-mods-btn') ?.addEventListener('click', () => { BuildModsScreen(); ShowScreen('gf-sns-mods'); });
    document.getElementById('gf-sns-settings') ?.addEventListener('click', () => { BuildModsScreen(); ShowScreen('gf-sns-mods'); });
    document.getElementById('gf-snake')        ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-snake') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeySnake();
      else CloseGradeSnake();
    });
  }

  function OpenGradeSnake(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-snake')) BuildOverlay();
    document.getElementById('gf-snake').style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStartScreen();
  }

  function CloseGradeSnake() {
    const el = document.getElementById('gf-snake');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function BossKeySnake() {
    const el = document.getElementById('gf-snake');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      // Restore
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS?._bossHidden) {
        GS._bossHidden = false;
        GS.status = 'playing';
        GS.lastFrameTs = performance.now();
        ShowScreen(null);
        StartLoop();
      }
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') {
        GS.status = 'paused';
        GS._bossHidden = true;
        StopLoop();
      }
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  function ToggleGradeSnake(grades) {
    const el = document.getElementById('gf-snake');
    if (el && el.style.display !== 'none') CloseGradeSnake(); else OpenGradeSnake(grades);
  }

  W.OpenGradeSnake       = OpenGradeSnake;
  W.CloseGradeSnake      = CloseGradeSnake;
  W.ToggleGradeSnake     = ToggleGradeSnake;
  W.BossKeySnake         = BossKeySnake;
  W.normalizeGradesSnake = NormalizeGrades;

  function InjectCSS() {
    if (document.getElementById('gf-snake-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-snake-css';
    s.textContent = `
#gf-snake {
  --gs-modal:#ffffff;--gs-hdr:#f5f5f5;--gs-hud:#fafafa;--gs-scr:rgba(248,248,248,0.96);
  --gs-brd:rgba(74,222,128,0.22);--gs-brd2:#e0e0e0;--gs-btn-brd:#d0d0d0;
  --gs-txt:#111;--gs-txt2:#555;--gs-txt3:#999;--gs-kbd:#eee;--gs-kbd-brd:#ccc;
  --gs-scroll:#d0d0d0;--gs-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-snake[data-theme="dark"] {
  --gs-modal:rgba(13,13,13,0.97);--gs-hdr:rgba(8,8,8,0.95);--gs-hud:rgba(10,10,10,0.98);
  --gs-scr:rgba(6,6,6,0.94);--gs-brd:rgba(74,222,128,0.18);--gs-brd2:#1c1c1c;
  --gs-btn-brd:#333;--gs-txt:#f5f5f5;--gs-txt2:#aaa;--gs-txt3:#555;
  --gs-kbd:#1e1e1e;--gs-kbd-brd:#333;--gs-scroll:#2a2a2a;
  --gs-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-snake{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-sn-modal{position:relative;display:flex;flex-direction:column;background:var(--gs-modal);border:1px solid var(--gs-brd);border-radius:12px;box-shadow:var(--gs-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-sn-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--gs-hdr);border-bottom:1px solid var(--gs-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-sn-hl{display:flex;align-items:center;gap:8px;} .gf-sn-hr{display:flex;align-items:center;gap:6px;}
#gf-sn-logo{width:26px;height:26px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-sn-title{font-size:14px;font-weight:700;color:var(--gs-txt);letter-spacing:-0.3px;}
#gf-sn-badge{font-size:8px;font-weight:600;color:#4ade80;border:1px solid rgba(74,222,128,0.4);border-radius:4px;padding:2px 5px;letter-spacing:1px;}
#gf-sn-hint{font-size:9px;color:var(--gs-txt3);}
#gf-sn-pause-btn,#gf-sn-close-btn{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--gs-btn-brd);border-radius:6px;background:transparent;color:var(--gs-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-sn-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-sn-close-btn:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-sn-body{display:flex;position:relative;overflow:hidden;}
#gf-sn-board{flex-shrink:0;border-right:1px solid var(--gs-brd);line-height:0;}
#gf-sn-canvas{display:block;width:${CV}px;height:${CV}px;}
#gf-sn-hud{width:162px;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto;background:var(--gs-hud);}
#gf-sn-hud::-webkit-scrollbar{width:3px;} #gf-sn-hud::-webkit-scrollbar-thumb{background:var(--gs-scroll);border-radius:99px;}
.gf-snp{padding:8px 10px;border-bottom:1px solid var(--gs-brd2);flex-shrink:0;} .gf-snp:last-child{border-bottom:none;}
.gf-snp-label{font-size:8px;font-weight:600;letter-spacing:1.5px;color:var(--gs-txt3);text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.gf-snp-label::before{content:'•';color:#4ade80;font-size:11px;line-height:1;}
.gf-snp-big{font-size:20px;font-weight:700;color:var(--gs-txt);letter-spacing:-0.5px;line-height:1.1;}
.gf-snp-sub{font-size:9px;color:var(--gs-txt3);margin-top:2px;}
.gf-snp-val{font-size:14px;font-weight:700;color:var(--gs-txt);}
.gf-snp-stat-row{display:flex;justify-content:space-between;align-items:center;padding:2px 0;}
.gf-snp-bufwrap{height:7px;background:var(--gs-brd2);border-radius:4px;overflow:hidden;margin:4px 0;}
.gf-snp-buf{height:100%;width:50%;background:#4ade80;border-radius:4px;transition:width .1s,background .15s;}
.gf-snp-buflbl{display:flex;justify-content:space-between;font-size:8px;color:var(--gs-txt3);}
.gf-snp-le-subj{font-size:9px;color:var(--gs-txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.gf-snp-le-row{display:flex;align-items:baseline;gap:6px;}
.gf-snp-le-pct{font-size:13px;font-weight:700;} .gf-snp-le-eff{font-size:11px;font-weight:700;}
.gf-sg-row{display:flex;justify-content:space-between;font-size:9px;padding:2px 0;} .gf-sg-row span:last-child{color:var(--gs-txt3);}
.gf-sc-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.gf-sc-row kbd{display:inline-block;padding:1px 4px;font-family:inherit;font-size:7px;font-weight:600;background:var(--gs-kbd);border:1px solid var(--gs-kbd-brd);border-radius:3px;color:var(--gs-txt2);min-width:30px;text-align:center;flex-shrink:0;}
.gf-sc-row span{font-size:8px;color:var(--gs-txt3);}
.gf-sns{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;background:var(--gs-scr);padding:24px;}
.gf-sns-logo{font-size:28px;font-weight:700;color:#4ade80;letter-spacing:-1px;text-shadow:0 0 50px rgba(74,222,128,0.5);}
.gf-sns-sub{font-size:12px;color:var(--gs-txt2);letter-spacing:0.5px;} .gf-sns-footer{font-size:8px;color:var(--gs-txt3);text-align:center;}
.gf-sns-stat{font-size:11px;color:var(--gs-txt2);}
.gf-sns-go-title{font-size:28px;font-weight:700;color:#f87171;letter-spacing:5px;text-shadow:0 0 35px rgba(248,113,113,0.5);}
.gf-sns-win-title{font-size:24px;font-weight:700;color:#4ade80;letter-spacing:2px;text-shadow:0 0 40px rgba(74,222,128,0.55);}
.gf-ts-btn{padding:9px 24px;border:1px solid #4ade80;border-radius:7px;background:rgba(74,222,128,0.10);color:#4ade80;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;transition:background .14s,box-shadow .14s,transform .14s;}
.gf-ts-btn:hover{background:rgba(74,222,128,0.22);box-shadow:0 4px 20px rgba(74,222,128,0.28);transform:translateY(-1px);}
.gf-ts-btn-sec{border-color:var(--gs-btn-brd);color:var(--gs-txt2);background:transparent;}
.gf-ts-btn-sec:hover{background:rgba(128,128,128,0.10);box-shadow:none;}
.gf-sns-start-hdr{display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:10px;}
.gf-sns-effects{display:flex;gap:10px;font-size:9px;font-weight:600;color:var(--gs-txt3);flex-wrap:wrap;justify-content:center;}
.gf-sn-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-snl{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--gs-brd2);border-radius:9px;background:var(--gs-hud);color:var(--gs-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-snl:hover:not(:disabled){border-color:#4ade80;background:rgba(74,222,128,0.07);transform:translateX(2px);}
.gf-snl-locked{opacity:0.4;} .gf-snl:disabled{cursor:default;}
.gf-snl-left{display:flex;align-items:center;gap:10px;}
.gf-snl-badge{width:30px;height:30px;border-radius:7px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#4ade80;flex-shrink:0;}
.gf-snl-badge-fp{background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.3);color:#a78bfa;}
.gf-snl-info{display:flex;flex-direction:column;gap:1px;}
.gf-snl-name{font-size:12px;font-weight:700;color:var(--gs-txt);}
.gf-snl-tgt{font-size:9px;color:var(--gs-txt3);font-weight:400;}
.gf-snl-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;}
.gf-snl-prog-track{width:72px;height:3px;background:var(--gs-brd2);border-radius:3px;overflow:hidden;}
.gf-snl-prog-fill{height:100%;background:#4ade80;border-radius:3px;}
.gf-snl-best{font-size:8px;color:var(--gs-txt3);white-space:nowrap;}
.gf-mod-grid{display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px;}
.gf-mod-row{display:flex;flex-direction:column;gap:5px;}
.gf-mod-label{font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--gs-txt3);}
.gf-mod-opts{display:flex;gap:5px;flex-wrap:wrap;}
.gf-mod-btn{padding:5px 10px;border:1px solid var(--gs-brd2);border-radius:6px;background:transparent;color:var(--gs-txt2);font-family:inherit;font-size:10px;cursor:pointer;transition:border-color .12s,background .12s;}
.gf-mod-btn:hover{border-color:#a78bfa;}
.gf-mod-active{border-color:#a78bfa!important;color:#a78bfa;background:rgba(167,139,250,0.12)!important;}
.gf-mod-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px;}
`;
    document.head.appendChild(s);
  }

})(window);
