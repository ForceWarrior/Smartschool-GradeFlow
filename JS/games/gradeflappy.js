;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 360;
  const CV_H = 540;

  const LS_BEST = 'gf-flappy-best';

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }
  function SaveBest(s) { if (s > LoadBest()) StorageSet(LS_BEST, s); }

  /* ── Grade helpers ─────────────────────────────────────── */

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

  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75)  return '#4ade80';
    if (Pct >= 50)  return '#a3e635';
    if (Pct >= 25)  return '#f97316';
    return '#f87171';
  }

  /* ── Constants ─────────────────────────────────────────── */

  const GRAVITY      = 0.0012;   // px/ms^2
  const FLAP_VEL     = -0.38;    // px/ms upward
  const BIRD_SIZE    = 22;
  const BIRD_X       = 55;
  const PIPE_W       = 36;
  const PIPE_CAP_H   = 8;
  const PIPE_CAP_OV  = 4;       // overhang each side
  const BASE_GAP     = 100;
  const MIN_GAP      = 62;
  const GAP_SHRINK   = 0.6;     // gap shrinks per point
  const BASE_SPEED   = 0.1;     // px/ms
  const MAX_SPEED    = 0.22;
  const SPEED_INC    = 0.0008;  // per point
  const PIPE_SPACING = 140;     // horizontal distance between pipes
  const GROUND_H     = 32;
  const CLOUD_COUNT  = 5;

  /* ── Game state ────────────────────────────────────────── */

  let GS = null, _raf = null, _grades = [], _kh = null;

  function PickGrade() {
    const pool = _grades.length ? _grades : FallbackGrades();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function MakePipe(x) {
    const grade = PickGrade();
    const gap = Math.max(MIN_GAP, BASE_GAP - (GS ? GS.score * GAP_SHRINK : 0));
    const minTop = 40;
    const maxTop = CV_H - GROUND_H - gap - 40;
    const topH = minTop + Math.random() * Math.max(0, maxTop - minTop);
    return { x, topH, gap, grade, color: GradeColor(grade.Pct), scored: false };
  }

  function MakeClouds() {
    return Array.from({ length: CLOUD_COUNT }, () => ({
      x: Math.random() * CV_W * 1.5,
      y: 15 + Math.random() * (CV_H * 0.35),
      w: 28 + Math.random() * 32,
      h: 10 + Math.random() * 10,
      speed: 0.01 + Math.random() * 0.015,
    }));
  }

  function NewGameState() {
    const birdGrade = PickGrade();
    const pipes = [];
    for (let i = 0; i < 4; i++) pipes.push(MakePipe(CV_W + i * PIPE_SPACING));
    return {
      status: 'start',
      birdY: CV_H * 0.4,
      birdVel: 0,
      birdGrade,
      birdColor: GradeColor(birdGrade.Pct),
      birdRotation: 0,
      pipes,
      score: 0,
      groundX: 0,
      clouds: MakeClouds(),
      particles: [],
      flashAlpha: 0,
      speedMod: 0,        // temporary speed modifier (positive = faster, negative = slower)
      speedModTimer: 0,
      _bossHidden: false,
      lastTs: 0,
    };
  }

  function GetSpeed() {
    const base = Math.min(MAX_SPEED, BASE_SPEED + (GS ? GS.score * SPEED_INC : 0));
    return Math.max(0.04, base + (GS ? GS.speedMod : 0));
  }

  /* ── Particles ─────────────────────────────────────────── */

  function SpawnParticles(x, y, color, count) {
    if (!GS) return;
    for (let i = 0; i < count; i++) {
      GS.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.7) * 0.12,
        life: 300 + Math.random() * 200,
        age: 0,
        size: 2 + Math.random() * 2,
        color,
      });
    }
  }

  /* ── Physics / update ──────────────────────────────────── */

  function Flap() {
    if (!GS) return;
    if (GS.status === 'gameover') return;
    if (GS.status === 'paused')   return;
    if (GS.status === 'start') {
      GS.status = 'playing';
      GS.lastTs = performance.now();
      ShowScreen(null);
      StartLoop();                          // Was missing, game never animated
    }
    GS.birdVel = FLAP_VEL;
    SpawnParticles(BIRD_X, GS.birdY + BIRD_SIZE / 2, GS.birdColor, 4);
  }

  function Update(dt) {
    if (!GS || GS.status !== 'playing') return;

    const speed = GetSpeed();

    // Bird physics
    GS.birdVel += GRAVITY * dt;
    GS.birdY += GS.birdVel * dt;

    // Bird rotation: map velocity to angle
    const maxDown = 0.4;
    GS.birdRotation = Math.max(-0.5, Math.min(1.2, GS.birdVel / maxDown * 1.2));

    // Speed modifier decay
    if (GS.speedModTimer > 0) {
      GS.speedModTimer -= dt;
      if (GS.speedModTimer <= 0) { GS.speedMod = 0; GS.speedModTimer = 0; }
    }

    // Ground scrolling
    GS.groundX = (GS.groundX + speed * dt) % 24;

    // Clouds
    for (const c of GS.clouds) {
      c.x -= c.speed * dt;
      if (c.x + c.w < 0) { c.x = CV_W + Math.random() * 40; c.y = 15 + Math.random() * (CV_H * 0.35); }
    }

    // Pipes
    for (const p of GS.pipes) {
      p.x -= speed * dt;

      // Scoring
      if (!p.scored && p.x + PIPE_W < BIRD_X) {
        p.scored = true;
        const Pct = p.grade.Pct ?? 50;
        if (Pct >= 75) {
          GS.score += 2;
          GS.speedMod = -0.03;
          GS.speedModTimer = 800;
        } else if (Pct >= 50) {
          GS.score += 1;
        } else {
          GS.score += 1;
          GS.speedMod = 0.03;
          GS.speedModTimer = 800;
        }
        // Change bird grade on passing a pipe
        GS.birdGrade = p.grade;
        GS.birdColor = p.color;
      }
    }

    // Recycle pipes
    while (GS.pipes.length > 0 && GS.pipes[0].x + PIPE_W < -10) {
      GS.pipes.shift();
      const last = GS.pipes[GS.pipes.length - 1];
      GS.pipes.push(MakePipe(last.x + PIPE_SPACING));
    }

    // Particles
    for (let i = GS.particles.length - 1; i >= 0; i--) {
      const p = GS.particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.0005 * dt;
      if (p.age >= p.life) GS.particles.splice(i, 1);
    }

    // Flash decay
    if (GS.flashAlpha > 0) GS.flashAlpha = Math.max(0, GS.flashAlpha - dt * 0.004);

    // Collision detection
    const bx = BIRD_X, by = GS.birdY, bs = BIRD_SIZE;

    // Ground / ceiling
    if (by + bs >= CV_H - GROUND_H || by <= 0) { Die(); return; }

    // Pipe collision
    for (const p of GS.pipes) {
      if (bx + bs < p.x || bx > p.x + PIPE_W) continue;
      if (by < p.topH || by + bs > p.topH + p.gap) { Die(); return; }
    }
  }

  function Die() {
    GS.status = 'gameover';
    GS.flashAlpha = 1;
    SaveBest(GS.score);
    StopLoop();
    ShowGameOver();
  }

  /* ── Rendering ─────────────────────────────────────────── */

  function Draw() {
    const cv = document.getElementById('gf-fl-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const dark = document.getElementById('gf-fl')?.dataset.theme === 'dark';

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CV_H - GROUND_H);
    if (dark) {
      skyGrad.addColorStop(0, '#0a0f1a');
      skyGrad.addColorStop(1, '#111827');
    } else {
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(1, '#c8e6f5');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CV_W, CV_H - GROUND_H);

    // Clouds (parallax)
    ctx.globalAlpha = dark ? 0.08 : 0.5;
    for (const c of GS.clouds) {
      ctx.fillStyle = dark ? '#334155' : '#fff';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // puff
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.3, c.y + c.h * 0.3, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.7, c.y + c.h * 0.35, c.w * 0.25, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pipes
    for (const p of GS.pipes) {
      DrawPipe(ctx, p, dark);
    }

    // Particles
    for (const pt of GS.particles) {
      ctx.globalAlpha = Math.max(0, 1 - pt.age / pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bird
    DrawBird(ctx);

    // Ground
    const gGrad = ctx.createLinearGradient(0, CV_H - GROUND_H, 0, CV_H);
    if (dark) {
      gGrad.addColorStop(0, '#1e293b');
      gGrad.addColorStop(1, '#0f172a');
    } else {
      gGrad.addColorStop(0, '#d4a76a');
      gGrad.addColorStop(1, '#b8935a');
    }
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, CV_H - GROUND_H, CV_W, GROUND_H);

    // Ground pattern (scrolling dashes)
    ctx.strokeStyle = dark ? '#334155' : '#c49a5c';
    ctx.lineWidth = 1;
    const dashY = CV_H - GROUND_H + 4;
    for (let x = -GS.groundX; x < CV_W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, dashY);
      ctx.lineTo(x + 12, dashY);
      ctx.stroke();
    }

    // Ground top edge
    ctx.fillStyle = dark ? '#4ade80' : '#6dc96d';
    ctx.fillRect(0, CV_H - GROUND_H, CV_W, 3);

    // Death flash
    if (GS.flashAlpha > 0) {
      ctx.globalAlpha = GS.flashAlpha;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, CV_W, CV_H);
      ctx.globalAlpha = 1;
    }

    // Update HUD
    SetText('gf-fl-score', GS.score);
    SetText('gf-fl-best', LoadBest());
  }

  function DrawPipe(ctx, p, dark) {
    const topH = p.topH;
    const botY = topH + p.gap;
    const botH = CV_H - GROUND_H - botY;
    const capW = PIPE_W + PIPE_CAP_OV * 2;
    const capX = p.x - PIPE_CAP_OV;

    // Pipe body color
    const bodyColor = dark ? DarkenColor(p.color, 0.5) : p.color;
    const edgeColor = dark ? DarkenColor(p.color, 0.35) : DarkenColor(p.color, 0.75);

    // Top pipe body
    ctx.fillStyle = bodyColor;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(p.x, 0, PIPE_W, topH, [0, 0, 0, 0]); ctx.fill();
    } else {
      ctx.fillRect(p.x, 0, PIPE_W, topH);
    }
    // Top pipe highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x + 3, 0, 4, topH);

    // Top pipe cap
    ctx.fillStyle = bodyColor;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(capX, topH - PIPE_CAP_H, capW, PIPE_CAP_H, [0, 0, 5, 5]); ctx.fill();
    } else {
      ctx.fillRect(capX, topH - PIPE_CAP_H, capW, PIPE_CAP_H);
    }
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(capX, topH - PIPE_CAP_H, capW, PIPE_CAP_H);

    // Bottom pipe body
    ctx.fillStyle = bodyColor;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(p.x, botY, PIPE_W, botH, [0, 0, 0, 0]); ctx.fill();
    } else {
      ctx.fillRect(p.x, botY, PIPE_W, botH);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x + 3, botY, 4, botH);

    // Bottom pipe cap
    ctx.fillStyle = bodyColor;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(capX, botY, capW, PIPE_CAP_H, [5, 5, 0, 0]); ctx.fill();
    } else {
      ctx.fillRect(capX, botY, capW, PIPE_CAP_H);
    }
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(capX, botY, capW, PIPE_CAP_H);

    // Grade label on pipe gap
    const labelY = topH + p.gap / 2;
    const pct = p.grade.Pct != null ? Math.round(p.grade.Pct) : '?';
    ctx.fillStyle = p.color;
    ctx.font = '700 9px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${pct}%`, p.x + PIPE_W / 2, labelY);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function DrawBird(ctx) {
    if (!GS) return;
    const bx = BIRD_X + BIRD_SIZE / 2;
    const by = GS.birdY + BIRD_SIZE / 2;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(GS.birdRotation);

    // Bird body (rounded square)
    const hs = BIRD_SIZE / 2;
    ctx.fillStyle = GS.birdColor;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(-hs, -hs, BIRD_SIZE, BIRD_SIZE, 5); ctx.fill();
    } else {
      ctx.fillRect(-hs, -hs, BIRD_SIZE, BIRD_SIZE);
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-hs + 2, -hs + 2, BIRD_SIZE - 4, BIRD_SIZE * 0.35);

    // Border
    ctx.strokeStyle = DarkenColor(GS.birdColor, 0.7);
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(-hs, -hs, BIRD_SIZE, BIRD_SIZE, 5); ctx.stroke();
    } else {
      ctx.strokeRect(-hs, -hs, BIRD_SIZE, BIRD_SIZE);
    }

    // Grade label on bird
    const pct = GS.birdGrade.Pct != null ? Math.round(GS.birdGrade.Pct) : '?';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '700 8px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pct, 0, 0);

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(hs * 0.35, -hs * 0.25, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(hs * 0.45, -hs * 0.25, 1.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
    ctx.textAlign = 'left';
  }

  function DarkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
  }

  /* ── Game loop ─────────────────────────────────────────── */

  function StartLoop() {
    _raf = requestAnimationFrame(function Frame(ts) {
      if (!GS) return;
      if (GS.status !== 'playing') { Draw(); return; }
      const dt = Math.min(ts - (GS.lastTs || ts), 80);
      GS.lastTs = ts;
      Update(dt);
      Draw();
      if (GS.status === 'playing') _raf = requestAnimationFrame(Frame);
    });
  }

  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  /* ── Screens ───────────────────────────────────────────── */

  const SCREEN_IDS = ['gf-fl-start', 'gf-fl-pause', 'gf-fl-gameover'];

  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStartScreen() {
    StopLoop();
    GS = NewGameState();
    SetText('gf-fl-score', 0);
    SetText('gf-fl-best', LoadBest());
    Draw();
    ShowScreen('gf-fl-start');
  }

  function ShowGameOver() {
    SaveBest(GS.score);
    const best = LoadBest();
    SetText('gf-fl-go-score', GS.score);
    SetText('gf-fl-go-best', best);
    const isNew = GS.score >= best && GS.score > 0;
    const newEl = document.getElementById('gf-fl-go-new');
    if (newEl) newEl.style.display = isNew ? 'block' : 'none';
    ShowScreen('gf-fl-gameover');
    Draw();
  }

  /* ── Flow ──────────────────────────────────────────────── */

  function DoStart() {
    StopLoop();
    GS = NewGameState();
    GS.status = 'playing';
    GS.lastTs = performance.now();
    ShowScreen(null);
    Draw();
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-fl-pause');
    } else if (GS.status === 'paused') {
      GS.status = 'playing'; GS.lastTs = performance.now();
      ShowScreen(null); StartLoop();
    }
  }

  /* ── Input ─────────────────────────────────────────────── */

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-fl')) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeFlappy();
      return;
    }
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'start') {
        Flap();
      } else if (GS.status === 'paused') {
        DoPause();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (GS.status === 'gameover') DoStart();
      else if (GS.status === 'start') Flap();
      return;
    }
  }

  function OnCanvasInteract(e) {
    e.preventDefault();
    if (!GS) return;
    if (GS.status === 'playing' || GS.status === 'start') Flap();
    else if (GS.status === 'gameover') DoStart();
  }

  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); }
  function DetachKeys() { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } }
  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  /* ── Theme ─────────────────────────────────────────────── */

  function ApplyTheme() {
    const el = document.getElementById('gf-fl');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* ── Overlay ───────────────────────────────────────────── */

  function BuildOverlay() {
    if (document.getElementById('gf-fl')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-fl';
    root.innerHTML = `
<div id="gf-fl-modal">
  <div id="gf-fl-hdr">
    <div class="gf-fl-hl">
      <div id="gf-fl-logo">GF</div>
      <span id="gf-fl-title">GradeFlappy</span>
      <span id="gf-fl-badge">BETA</span>
    </div>
    <div class="gf-fl-hr">
      <button id="gf-fl-close" title="${_GameText('game_close_esc')}">&#x2715;</button>
    </div>
  </div>
  <div id="gf-fl-hud">
    <div class="gf-fl-hud-cell">
      <span class="gf-fl-hud-lbl">${_GameText('game_score').toUpperCase()}</span>
      <span id="gf-fl-score" class="gf-fl-hud-val">0</span>
    </div>
    <div class="gf-fl-hud-cell">
      <span class="gf-fl-hud-lbl">${_GameText('game_best').toUpperCase()}</span>
      <span id="gf-fl-best" class="gf-fl-hud-val">0</span>
    </div>
  </div>
  <div id="gf-fl-body">
    <canvas id="gf-fl-canvas" width="${CV_W}" height="${CV_H}"></canvas>

    <div id="gf-fl-start" class="gf-fl-scr">
      <div class="gf-fl-scr-logo">${_GameText('fl_title')}</div>
      <div class="gf-fl-scr-sub">${_GameText('fl_subtitle')}</div>
      <div class="gf-fl-scr-effects">
        <span style="color:#4ade80">${_GameText('fl_eff_great')}</span>
        <span style="color:#a3e635">${_GameText('fl_eff_ok')}</span>
        <span style="color:#f87171">${_GameText('fl_eff_bad')}</span>
      </div>
      <div class="gf-fl-scr-footer">${_GameText('fl_start_hint')}</div>
    </div>

    <div id="gf-fl-pause" class="gf-fl-scr" style="display:none">
      <div class="gf-fl-scr-sub" style="font-size:20px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-fl-btn" id="gf-fl-resume">&triangleright;&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-fl-gameover" class="gf-fl-scr" style="display:none">
      <div class="gf-fl-scr-go">${_GameText('game_gameover')}</div>
      <div class="gf-fl-go-stats">
        <div class="gf-fl-go-stat">
          <div class="gf-fl-go-lbl">${_GameText('game_score').toUpperCase()}</div>
          <div class="gf-fl-go-val" id="gf-fl-go-score">0</div>
        </div>
        <div class="gf-fl-go-stat">
          <div class="gf-fl-go-lbl">${_GameText('game_best').toUpperCase()}</div>
          <div class="gf-fl-go-val" id="gf-fl-go-best">0</div>
        </div>
      </div>
      <div id="gf-fl-go-new" class="gf-fl-scr-new" style="display:none">${_GameText('fl_new_best')}</div>
      <button class="gf-fl-btn" id="gf-fl-retry">&circlearrowleft;&nbsp; ${_GameText('game_try_again')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-fl-close')?.addEventListener('click', CloseGradeFlappy);
    document.getElementById('gf-fl-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-fl-retry')?.addEventListener('click', DoStart);
    const cv = document.getElementById('gf-fl-canvas');
    if (cv) {
      cv.addEventListener('click', OnCanvasInteract);
      cv.addEventListener('touchstart', OnCanvasInteract, { passive: false });
    }
    // The start screen overlay sits on top of the canvas, bind click on it
    // directly so tapping the overlay starts the game (Flap from 'start').
    const startScr = document.getElementById('gf-fl-start');
    if (startScr) {
      startScr.addEventListener('click', e => {
        e.stopPropagation();
        if (GS?.status === 'start') Flap();
      });
      startScr.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        if (GS?.status === 'start') Flap();
      }, { passive: false });
    }
    document.getElementById('gf-fl')?.addEventListener('click', e => {
      if (e.target.id !== 'gf-fl') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyFlappy();
      else CloseGradeFlappy();
    });
  }

  /* ── Public API ────────────────────────────────────────── */

  function OpenGradeFlappy(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-fl')) BuildOverlay();
    document.getElementById('gf-fl').style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStartScreen();
  }

  function CloseGradeFlappy() {
    const el = document.getElementById('gf-fl');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function BossKeyFlappy() {
    const el = document.getElementById('gf-fl');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (GS?._bossHidden) {
        GS._bossHidden = false;
        GS.status = 'playing';
        GS.lastTs = performance.now();
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

  function ToggleGradeFlappy(grades) {
    const el = document.getElementById('gf-fl');
    if (el && el.style.display !== 'none') CloseGradeFlappy(); else OpenGradeFlappy(grades);
  }

  W.OpenGradeFlappy       = OpenGradeFlappy;
  W.CloseGradeFlappy      = CloseGradeFlappy;
  W.ToggleGradeFlappy     = ToggleGradeFlappy;
  W.BossKeyFlappy         = BossKeyFlappy;

  /* ── CSS ───────────────────────────────────────────────── */

  function InjectCSS() {
    if (document.getElementById('gf-fl-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-fl-css';
    s.textContent = `
#gf-fl {
  --fl-modal:#fff;--fl-hdr:#f5f5f5;--fl-hud:#fafafa;--fl-scr:rgba(248,248,248,0.96);
  --fl-brd:rgba(74,222,128,0.22);--fl-brd2:#e0e0e0;--fl-btn-brd:#d0d0d0;
  --fl-txt:#111;--fl-txt2:#555;--fl-txt3:#999;--fl-kbd:#eee;--fl-kbd-brd:#ccc;
  --fl-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-fl[data-theme="dark"] {
  --fl-modal:rgba(13,13,13,0.97);--fl-hdr:rgba(8,8,8,0.95);--fl-hud:rgba(10,10,10,0.98);
  --fl-scr:rgba(6,6,6,0.94);--fl-brd:rgba(74,222,128,0.18);--fl-brd2:#1c1c1c;
  --fl-btn-brd:#333;--fl-txt:#f5f5f5;--fl-txt2:#aaa;--fl-txt3:#555;
  --fl-kbd:#1e1e1e;--fl-kbd-brd:#333;
  --fl-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-fl{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-fl-modal{position:relative;display:flex;flex-direction:column;background:var(--fl-modal);border:1px solid var(--fl-brd);border-radius:12px;box-shadow:var(--fl-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-fl-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--fl-hdr);border-bottom:1px solid var(--fl-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-fl-hl{display:flex;align-items:center;gap:8px;} .gf-fl-hr{display:flex;align-items:center;gap:6px;}
#gf-fl-logo{width:24px;height:24px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-fl-title{font-size:13px;font-weight:700;color:var(--fl-txt);letter-spacing:-0.3px;}
#gf-fl-badge{font-size:7px;font-weight:600;color:#4ade80;border:1px solid rgba(74,222,128,0.4);border-radius:4px;padding:1px 4px;letter-spacing:1px;}
#gf-fl-close{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid var(--fl-btn-brd);border-radius:6px;background:transparent;color:var(--fl-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-fl-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-fl-hud{display:flex;justify-content:center;gap:20px;padding:6px 12px;background:var(--fl-hud);border-bottom:1px solid var(--fl-brd);user-select:none;}
.gf-fl-hud-cell{display:flex;flex-direction:column;align-items:center;gap:1px;}
.gf-fl-hud-lbl{font-size:7px;font-weight:600;letter-spacing:1.5px;color:var(--fl-txt3);text-transform:uppercase;}
.gf-fl-hud-val{font-size:16px;font-weight:700;color:var(--fl-txt);letter-spacing:-0.5px;}
#gf-fl-body{position:relative;line-height:0;flex-shrink:0;}
#gf-fl-canvas{display:block;width:${CV_W}px;height:${CV_H}px;}
.gf-fl-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--fl-scr);padding:24px 20px;overflow-y:auto;}
#gf-fl-start{cursor:pointer;}
#gf-fl-start:hover{background:rgba(248,248,248,0.99);}
#gf-fl[data-theme="dark"] #gf-fl-start:hover{background:rgba(8,8,8,0.96);}
.gf-fl-scr-logo{font-size:32px;font-weight:800;color:#4ade80;letter-spacing:-1px;text-shadow:0 0 40px rgba(74,222,128,0.5);line-height:1;margin-bottom:0;}
.gf-fl-scr-sub{font-size:13px;color:var(--fl-txt2);letter-spacing:0.5px;line-height:1.3;text-align:center;}
.gf-fl-scr-effects{display:flex;flex-direction:column;gap:8px;font-size:11px;font-weight:600;color:var(--fl-txt3);align-items:center;line-height:1.2;margin-top:6px;}
.gf-fl-scr-effects > span{display:block;padding:2px 0;}
.gf-fl-scr-footer{font-size:10px;color:var(--fl-txt3);text-align:center;margin-top:14px;letter-spacing:0.4px;}
.gf-fl-scr-go{font-size:24px;font-weight:700;color:#f87171;letter-spacing:4px;text-shadow:0 0 30px rgba(248,113,113,0.5);}
.gf-fl-scr-stat{font-size:12px;color:var(--fl-txt2);font-weight:600;}
.gf-fl-go-stats{display:flex;gap:32px;justify-content:center;margin:8px 0 4px;}
.gf-fl-go-stat{display:flex;flex-direction:column;align-items:center;gap:4px;}
.gf-fl-go-lbl{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--fl-txt3);}
.gf-fl-go-val{font-size:30px;font-weight:800;color:var(--fl-txt);letter-spacing:-0.5px;line-height:1;}
.gf-fl-scr-new{font-size:10px;font-weight:700;color:#f59e0b;letter-spacing:2px;animation:gf-fl-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-fl-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
.gf-fl-btn{padding:8px 20px;border:1px solid #4ade80;border-radius:7px;background:rgba(74,222,128,0.10);color:#4ade80;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;transition:background .14s,box-shadow .14s,transform .14s;}
.gf-fl-btn:hover{background:rgba(74,222,128,0.22);box-shadow:0 4px 18px rgba(74,222,128,0.28);transform:translateY(-1px);}
`;
    document.head.appendChild(s);
  }

})(window);
