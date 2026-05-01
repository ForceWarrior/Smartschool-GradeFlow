;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 480;
  const CV_H = 240;
  const GROUND_H = 32;
  const GRAVITY = 0.0031;       // px/ms²
  const JUMP_VEL = -0.64;       // px/ms (single-jump impulse)
  const DOUBLE_VEL = -0.52;     // weaker for the second jump
  const PLAYER_X = 70;
  const PLAYER_W = 26;
  const PLAYER_H = 30;

  const LS_BEST = 'gf-runner-best';

  /* ── Storage ─────────────────────────────────────────────── */
  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }
  function SaveBest(v) { if (v > LoadBest()) StorageSet(LS_BEST, v); }

  /* ── Grades ──────────────────────────────────────────────── */
  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis','Engels','Sport','Latijn','Economie'];
    return Array.from({ length: 24 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }
  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }
  function PickGrade() {
    const g = _grades.length ? _grades : FallbackGrades();
    return g[0 | Math.random() * g.length];
  }
  function PickGood() {
    const g = (_grades.length ? _grades : FallbackGrades()).filter(x => (x.Pct ?? 60) >= 50);
    return g.length ? g[0 | Math.random() * g.length] : PickGrade();
  }
  function PickBad() {
    const g = (_grades.length ? _grades : FallbackGrades()).filter(x => (x.Pct ?? 60) < 50);
    return g.length ? g[0 | Math.random() * g.length] : PickGrade();
  }

  /* ── State ───────────────────────────────────────────────── */
  let GS = null, _grades = [], _raf = null, _kh = null, _khU = null, _tobs = null;

  function NewGameState() {
    return {
      status: 'start',
      playerY: CV_H - GROUND_H - PLAYER_H,
      playerVel: 0,
      onGround: true,
      jumpsRemaining: 2,
      sliding: false,
      slideTimer: 0,
      groundX: 0,
      cloudX: 0,
      obstacles: [],
      pickups: [],
      particles: [],
      score: 0,
      distance: 0,
      speed: 0.32,             // px/ms ground speed
      speedRamp: 0.000004,     // accel per ms
      spawnTimer: 600,
      pickupTimer: 1200,
      shakeT: 0,
      flashT: 0,
      grade: PickGood(),
      gradeColor: '#4ade80',
      lastTs: 0,
    };
  }

  /* ── Physics ─────────────────────────────────────────────── */
  function Jump() {
    if (!GS) return;
    if (GS.status === 'start')    { GS.status = 'playing'; GS.lastTs = performance.now(); ShowScreen(null); StartLoop(); }
    if (GS.status !== 'playing')  return;

    if (GS.onGround || GS.jumpsRemaining > 0) {
      GS.playerVel = GS.onGround ? JUMP_VEL : DOUBLE_VEL;
      GS.onGround = false;
      GS.jumpsRemaining--;
      Particles(PLAYER_X + PLAYER_W / 2, GS.playerY + PLAYER_H, GS.gradeColor, 6, 'jump');
    }
  }

  function Slide() {
    if (!GS || GS.status !== 'playing') return;
    if (GS.onGround && !GS.sliding) {
      GS.sliding = true;
      GS.slideTimer = 600;
    }
  }

  function Particles(x, y, color, n, kind) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = kind === 'jump' ? 0.06 + Math.random() * 0.12 : 0.04 + Math.random() * 0.16;
      GS.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'jump' ? 0.05 : 0),
        life: 600 + Math.random() * 200, age: 0, color, size: 2 + Math.random() * 2,
      });
    }
  }

  function SpawnObstacle() {
    const types = ['low', 'low', 'high', 'tall'];
    const type = types[0 | Math.random() * types.length];
    const grade = PickBad();
    const o = {
      type, grade, color: GradeColor(grade.Pct),
      x: CV_W + 10, w: 24,
    };
    if (type === 'low')  { o.h = 26; o.y = CV_H - GROUND_H - o.h; }
    if (type === 'high') { o.h = 18; o.y = CV_H - GROUND_H - o.h - 22; }
    if (type === 'tall') { o.h = 44; o.y = CV_H - GROUND_H - o.h; o.w = 18; }
    GS.obstacles.push(o);
  }

  function SpawnPickup() {
    const grade = PickGood();
    const goodTier = (grade.Pct ?? 60) >= 75;
    GS.pickups.push({
      grade, color: GradeColor(grade.Pct), tier: goodTier ? 'great' : 'ok',
      x: CV_W + 10, y: CV_H - GROUND_H - 50 - Math.random() * 60,
      r: 11, picked: false, born: performance.now(),
    });
  }

  function Update(dt) {
    if (!GS || GS.status !== 'playing') return;
    GS.distance += GS.speed * dt;
    GS.speed = Math.min(0.95, GS.speed + GS.speedRamp * dt);

    // Player physics
    if (!GS.onGround) {
      GS.playerVel += GRAVITY * dt;
      GS.playerY += GS.playerVel * dt;
      const floor = CV_H - GROUND_H - PLAYER_H;
      if (GS.playerY >= floor) {
        GS.playerY = floor;
        GS.playerVel = 0;
        GS.onGround = true;
        GS.jumpsRemaining = 2;
        Particles(PLAYER_X + PLAYER_W / 2, floor + PLAYER_H, '#cbd5e1', 4, 'land');
      }
    }
    if (GS.sliding) {
      GS.slideTimer -= dt;
      if (GS.slideTimer <= 0) GS.sliding = false;
    }

    // Scrolling
    GS.groundX = (GS.groundX + GS.speed * dt) % 32;
    GS.cloudX  = (GS.cloudX  + GS.speed * dt * 0.18) % 200;

    // Spawn timers
    GS.spawnTimer -= dt;
    if (GS.spawnTimer <= 0) {
      SpawnObstacle();
      const minGap = Math.max(550, 1100 - GS.speed * 800);
      GS.spawnTimer = minGap + Math.random() * 400;
    }
    GS.pickupTimer -= dt;
    if (GS.pickupTimer <= 0) {
      SpawnPickup();
      GS.pickupTimer = 800 + Math.random() * 1600;
    }

    // Move obstacles
    for (const o of GS.obstacles) o.x -= GS.speed * dt;
    GS.obstacles = GS.obstacles.filter(o => o.x + o.w > -10);

    // Move pickups
    for (const p of GS.pickups) p.x -= GS.speed * dt;
    GS.pickups = GS.pickups.filter(p => p.x + p.r > -10 && !p.picked);

    // Particles
    for (const p of GS.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 0.0008 * dt; // mild gravity
      p.age += dt;
    }
    GS.particles = GS.particles.filter(p => p.age < p.life);

    // Player hitbox
    const ph = GS.sliding ? PLAYER_H * 0.55 : PLAYER_H;
    const py = GS.sliding ? GS.playerY + (PLAYER_H - ph) : GS.playerY;
    const px = PLAYER_X;
    const pw = PLAYER_W;

    // Pickup collision
    for (const p of GS.pickups) {
      if (p.picked) continue;
      const cx = Math.max(px, Math.min(p.x, px + pw));
      const cy = Math.max(py, Math.min(p.y, py + ph));
      const dx = cx - p.x, dy = cy - p.y;
      if (dx * dx + dy * dy <= p.r * p.r) {
        p.picked = true;
        const pts = p.tier === 'great' ? 25 : 12;
        GS.score += pts;
        GS.flashT = 250;
        GS.grade = p.grade;
        GS.gradeColor = p.color;
        Particles(p.x, p.y, p.color, 12, 'pickup');
      }
    }

    // Obstacle collision
    for (const o of GS.obstacles) {
      if (o.x + o.w < px || o.x > px + pw) continue;
      if (o.y + o.h < py || o.y > py + ph) continue;
      Die();
      return;
    }

    // Score from distance
    GS.score = Math.max(GS.score, Math.floor(GS.distance / 10));

    if (GS.shakeT > 0) GS.shakeT = Math.max(0, GS.shakeT - dt);
    if (GS.flashT > 0) GS.flashT = Math.max(0, GS.flashT - dt);
  }

  function Die() {
    GS.status = 'gameover';
    GS.shakeT = 350;
    GS.flashT = 400;
    SaveBest(GS.score);
    Particles(PLAYER_X + PLAYER_W / 2, GS.playerY + PLAYER_H / 2, '#f87171', 30, 'die');
    StopLoop();
    ShowGameOver();
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function Draw() {
    const cv = document.getElementById('gf-rn-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const dark = document.getElementById('gf-rn')?.dataset.theme === 'dark';

    const sx = GS.shakeT > 0 ? (Math.random() - 0.5) * 6 * (GS.shakeT / 350) : 0;
    const sy = GS.shakeT > 0 ? (Math.random() - 0.5) * 6 * (GS.shakeT / 350) : 0;
    ctx.save(); ctx.translate(sx, sy);

    // Sky
    const skyG = ctx.createLinearGradient(0, 0, 0, CV_H - GROUND_H);
    if (dark) { skyG.addColorStop(0, '#0a0e1a'); skyG.addColorStop(1, '#172033'); }
    else      { skyG.addColorStop(0, '#7dd3fc'); skyG.addColorStop(1, '#bae6fd'); }
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CV_W, CV_H - GROUND_H);

    // Clouds
    ctx.fillStyle = dark ? 'rgba(180,200,230,0.10)' : 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 200) - GS.cloudX + 800) % 800 - 100;
      const cy = 25 + ((i * 31) % 60);
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.arc(cx + 14, cy + 4, 11, 0, Math.PI * 2);
      ctx.arc(cx - 12, cy + 4, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    const groundY = CV_H - GROUND_H;
    ctx.fillStyle = dark ? '#1f2937' : '#d4b886';
    ctx.fillRect(0, groundY, CV_W, GROUND_H);
    ctx.fillStyle = dark ? '#0f1419' : '#a08960';
    ctx.fillRect(0, groundY, CV_W, 3);
    ctx.strokeStyle = dark ? '#374151' : '#b8946a';
    ctx.lineWidth = 1;
    for (let gx = -GS.groundX; gx < CV_W; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY + 8); ctx.lineTo(gx + 12, groundY + 8);
      ctx.moveTo(gx + 6, groundY + 18); ctx.lineTo(gx + 22, groundY + 18);
      ctx.stroke();
    }

    // Pickups
    for (const p of GS.pickups) {
      if (p.picked) continue;
      const pulse = 0.92 + 0.08 * Math.sin((performance.now() - p.born) / 200);
      const r = p.r * pulse;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
      grd.addColorStop(0, p.color + '99'); grd.addColorStop(1, p.color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.font = '700 9px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(p.grade.Pct ?? 60)}`, p.x, p.y);
    }

    // Obstacles
    for (const o of GS.obstacles) {
      ctx.fillStyle = o.color;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 4); ctx.fill(); }
      else ctx.fillRect(o.x, o.y, o.w, o.h);
      // top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 3);
      // grade label
      if (o.h >= 24) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = '700 8px "IBM Plex Mono",monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(o.grade.Pct ?? 30)}`, o.x + o.w / 2, o.y + o.h / 2);
      }
    }

    // Player
    const ph = GS.sliding ? PLAYER_H * 0.55 : PLAYER_H;
    const py = GS.sliding ? GS.playerY + (PLAYER_H - ph) : GS.playerY;
    ctx.save();
    ctx.shadowColor = GS.gradeColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = GS.gradeColor;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(PLAYER_X, py, PLAYER_W, ph, 6); ctx.fill(); }
    else ctx.fillRect(PLAYER_X, py, PLAYER_W, ph);
    ctx.restore();
    // body highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(PLAYER_X + 2, py + 2, PLAYER_W - 4, ph * 0.35);
    // eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(PLAYER_X + PLAYER_W - 7, py + 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(PLAYER_X + PLAYER_W - 6, py + 8, 1.6, 0, Math.PI * 2); ctx.fill();

    // Particles
    for (const p of GS.particles) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // HUD overlay (in-canvas score)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.78)';
    ctx.font = '700 18px "IBM Plex Mono",monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(`${GS.score}`, CV_W - 12, 10);
    ctx.font = '600 9px "IBM Plex Mono",monospace';
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillText(_GameText('game_score').toUpperCase(), CV_W - 12, 32);

    // Pickup flash
    if (GS.flashT > 0) {
      ctx.globalAlpha = (GS.flashT / 250) * 0.18;
      ctx.fillStyle = GS.gradeColor;
      ctx.fillRect(0, 0, CV_W, CV_H);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /* ── Loop ────────────────────────────────────────────────── */
  function StartLoop() {
    StopLoop();
    _raf = requestAnimationFrame(function Frame(ts) {
      if (!GS) return;
      const dt = Math.min(ts - (GS.lastTs || ts), 80);
      GS.lastTs = ts;
      if (GS.status === 'playing') Update(dt);
      Draw();
      if (GS.status === 'playing') _raf = requestAnimationFrame(Frame);
      else _raf = null;
    });
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  /* ── UI flow ─────────────────────────────────────────────── */
  const SCREENS = ['gf-rn-start', 'gf-rn-pause', 'gf-rn-gameover'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    StopLoop();
    GS = NewGameState();
    SetText('gf-rn-best', LoadBest());
    Draw();
    ShowScreen('gf-rn-start');
  }

  function ShowGameOver() {
    SetText('gf-rn-go-score', GS.score);
    SetText('gf-rn-go-best', LoadBest());
    const isNew = GS.score >= LoadBest() && GS.score > 0;
    const newEl = document.getElementById('gf-rn-go-new');
    if (newEl) newEl.style.display = isNew ? 'block' : 'none';
    ShowScreen('gf-rn-gameover');
  }

  function DoStart() {
    StopLoop();
    GS = NewGameState();
    GS.status = 'playing';
    GS.lastTs = performance.now();
    ShowScreen(null);
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); ShowScreen('gf-rn-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; GS.lastTs = performance.now(); ShowScreen(null); StartLoop(); }
  }

  /* ── Input ───────────────────────────────────────────────── */
  function OnKey(e) {
    if (!GS || !document.getElementById('gf-rn')) return;
    if (e.type !== 'keydown') return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeRunner();
      return;
    }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'gameover') DoStart();
      else Jump();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault(); e.stopPropagation();
      Slide();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (GS.status === 'gameover' || GS.status === 'start') DoStart();
      else if (GS.status === 'paused') DoPause();
    }
  }

  function OnTap(e) {
    if (!GS) return;
    e.preventDefault();
    if (GS.status === 'gameover') { DoStart(); return; }
    Jump();
  }

  function AttachKeys()  { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); document.addEventListener('keyup', _kh, true); }
  function DetachKeys()  { if (_kh) { document.removeEventListener('keydown', _kh, true); document.removeEventListener('keyup', _kh, true); _kh = null; } }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  /* ── Theme ───────────────────────────────────────────────── */
  function ApplyTheme() {
    const el = document.getElementById('gf-rn');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }

  /* ── Build ───────────────────────────────────────────────── */
  function BuildOverlay() {
    if (document.getElementById('gf-rn')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-rn';
    root.innerHTML = `
<div id="gf-rn-modal">
  <div id="gf-rn-hdr">
    <div class="gf-rn-hl">
      <div id="gf-rn-logo">GR</div>
      <span id="gf-rn-title">${_GameText('rn_title')}</span>
      <span id="gf-rn-badge">BETA</span>
    </div>
    <div class="gf-rn-hr">
      <span id="gf-rn-best-hdr"><span class="gf-rn-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-rn-best">0</span></span>
      <button id="gf-rn-pause-btn" title="Pause (Esc)">⏸</button>
      <button id="gf-rn-close" title="Close (Esc)">✕</button>
    </div>
  </div>
  <div id="gf-rn-body">
    <canvas id="gf-rn-canvas" width="${CV_W}" height="${CV_H}"></canvas>

    <div id="gf-rn-start" class="gf-rn-scr">
      <div class="gf-rn-scr-logo">${_GameText('rn_title')}</div>
      <div class="gf-rn-scr-sub">${_GameText('rn_subtitle')}</div>
      <div class="gf-rn-scr-rules">
        <span style="color:#4ade80">${_GameText('rn_rule_pickup')}</span>
        <span style="color:#f87171">${_GameText('rn_rule_avoid')}</span>
      </div>
      <div class="gf-rn-scr-footer">${_GameText('rn_start_hint')}</div>
    </div>

    <div id="gf-rn-pause" class="gf-rn-scr" style="display:none">
      <div class="gf-rn-scr-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-rn-btn" id="gf-rn-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-rn-gameover" class="gf-rn-scr gf-rn-scr-gameover" style="display:none">
      <div class="gf-rn-scr-go">${_GameText('game_gameover')}</div>
      <div class="gf-rn-go-stats">
        <div class="gf-rn-go-stat">
          <div class="gf-rn-go-lbl">${_GameText('game_score').toUpperCase()}</div>
          <div class="gf-rn-go-val" id="gf-rn-go-score">0</div>
        </div>
        <div class="gf-rn-go-stat">
          <div class="gf-rn-go-lbl">${_GameText('game_best').toUpperCase()}</div>
          <div class="gf-rn-go-val" id="gf-rn-go-best">0</div>
        </div>
      </div>
      <div id="gf-rn-go-new" class="gf-rn-scr-new" style="display:none">${_GameText('rn_new_best')}</div>
      <button class="gf-rn-btn" id="gf-rn-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-rn-close')?.addEventListener('click', CloseGradeRunner);
    document.getElementById('gf-rn-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-rn-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-rn-retry')?.addEventListener('click', DoStart);
    const cv = document.getElementById('gf-rn-canvas');
    if (cv) {
      cv.addEventListener('click', OnTap);
      cv.addEventListener('touchstart', OnTap, { passive: false });
    }
    const startScr = document.getElementById('gf-rn-start');
    if (startScr) {
      startScr.addEventListener('click', e => { e.stopPropagation(); if (GS?.status === 'start') DoStart(); });
      startScr.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); if (GS?.status === 'start') DoStart(); }, { passive: false });
    }
  }

  /* ── Public API ──────────────────────────────────────────── */
  function OpenGradeRunner(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-rn')) BuildOverlay();
    document.getElementById('gf-rn').style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStart();
  }

  function CloseGradeRunner() {
    const el = document.getElementById('gf-rn');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function ToggleGradeRunner(grades) {
    const el = document.getElementById('gf-rn');
    if (el && el.style.display !== 'none') CloseGradeRunner(); else OpenGradeRunner(grades);
  }

  function BossKeyRunner() {
    const el = document.getElementById('gf-rn');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeRunner   = OpenGradeRunner;
  W.CloseGradeRunner  = CloseGradeRunner;
  W.ToggleGradeRunner = ToggleGradeRunner;
  W.BossKeyRunner     = BossKeyRunner;

  /* ── CSS ─────────────────────────────────────────────────── */
  function InjectCSS() {
    if (document.getElementById('gf-rn-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-rn-css';
    s.textContent = `
#gf-rn {
  --rn-modal:#fff;--rn-hdr:#f5f5f5;--rn-scr:rgba(248,248,248,0.96);
  --rn-brd:rgba(74,222,128,0.22);--rn-brd2:#e0e0e0;--rn-btn-brd:#d0d0d0;
  --rn-txt:#111;--rn-txt2:#555;--rn-txt3:#999;
  --rn-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-rn[data-theme="dark"] {
  --rn-modal:rgba(13,13,13,0.97);--rn-hdr:rgba(8,8,8,0.95);
  --rn-scr:rgba(6,6,6,0.94);--rn-brd:rgba(74,222,128,0.18);--rn-brd2:#1c1c1c;
  --rn-btn-brd:#333;--rn-txt:#f5f5f5;--rn-txt2:#cbd5e1;--rn-txt3:#8a94a6;
  --rn-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-rn{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-rn-modal{position:relative;display:flex;flex-direction:column;background:var(--rn-modal);border:1px solid var(--rn-brd);border-radius:12px;box-shadow:var(--rn-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-rn-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--rn-hdr);border-bottom:1px solid var(--rn-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-rn-hl{display:flex;align-items:center;gap:8px;} .gf-rn-hr{display:flex;align-items:center;gap:8px;}
#gf-rn-logo{width:24px;height:24px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-rn-title{font-size:13px;font-weight:700;color:var(--rn-txt);letter-spacing:-0.3px;}
#gf-rn-badge{font-size:7px;font-weight:600;color:#4ade80;border:1px solid rgba(74,222,128,0.4);border-radius:4px;padding:1px 4px;letter-spacing:1px;}
#gf-rn-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--rn-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--rn-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-rn-best-lbl{font-size:8px;font-weight:700;color:var(--rn-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-rn-pause-btn,#gf-rn-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--rn-btn-brd);border-radius:6px;background:transparent;color:var(--rn-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-rn-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-rn-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-rn-body{position:relative;line-height:0;flex-shrink:0;}
#gf-rn-canvas{display:block;width:${CV_W}px;height:${CV_H}px;}
.gf-rn-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--rn-scr);padding:24px;overflow-y:auto;line-height:1.35;text-align:center;}
#gf-rn-start{cursor:pointer;}
#gf-rn-start:hover{background:rgba(248,248,248,0.99);}
#gf-rn[data-theme="dark"] #gf-rn-start:hover{background:rgba(8,8,8,0.96);}
.gf-rn-scr-logo{font-size:34px;font-weight:800;color:#4ade80;letter-spacing:0;text-shadow:0 0 40px rgba(74,222,128,0.5);line-height:1.05;}
.gf-rn-scr-sub{font-size:13px;color:var(--rn-txt2);letter-spacing:0;line-height:1.45;text-align:center;max-width:360px;}
.gf-rn-scr-rules{display:grid;gap:8px;font-size:12px;font-weight:700;color:var(--rn-txt3);align-items:center;margin-top:2px;line-height:1.35;}
.gf-rn-scr-rules span{display:block;padding:3px 10px;border-radius:999px;background:rgba(128,128,128,0.08);}
.gf-rn-scr-footer{font-size:11px;color:var(--rn-txt2);text-align:center;margin-top:2px;letter-spacing:0;line-height:1.45;max-width:390px;}
.gf-rn-scr-gameover{gap:18px;}
.gf-rn-scr-go{font-size:31px;font-weight:800;color:#f87171;letter-spacing:3px;text-shadow:0 0 30px rgba(248,113,113,0.5);line-height:1.05;}
.gf-rn-scr-new{font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:2px;animation:gf-rn-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-rn-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
.gf-rn-go-stats{display:grid;grid-template-columns:repeat(2,minmax(104px,1fr));gap:12px;justify-content:center;width:min(260px,100%);}
.gf-rn-go-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 12px;border:1px solid var(--rn-brd2);border-radius:9px;background:rgba(128,128,128,0.10);box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);}
.gf-rn-go-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--rn-txt3);line-height:1;text-transform:uppercase;}
.gf-rn-go-val{font-size:30px;font-weight:800;color:var(--rn-txt);letter-spacing:0;line-height:1;}
.gf-rn-btn{padding:10px 24px;border:1px solid #4ade80;border-radius:8px;background:rgba(74,222,128,0.12);color:#4ade80;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.2px;line-height:1.2;min-width:146px;}
.gf-rn-btn:hover{background:rgba(74,222,128,0.22);box-shadow:0 4px 18px rgba(74,222,128,0.28);transform:translateY(-1px);}
`;
    document.head.appendChild(s);
  }

})(window);
