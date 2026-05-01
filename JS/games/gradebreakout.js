;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV = 320;

  const LEVELS = [
    { id: 1, rows: 3, cols: 8, ballSpeed: 2.2, target: 800   },
    { id: 2, rows: 4, cols: 8, ballSpeed: 2.6, target: 2000  },
    { id: 3, rows: 5, cols: 8, ballSpeed: 3.0, target: 4000  },
    { id: 4, rows: 5, cols: 9, ballSpeed: 3.4, target: 7000  },
    { id: 5, rows: 6, cols: 9, ballSpeed: 3.8, target: 11000 },
    { id: 6, rows: 5, cols: 8, ballSpeed: 3.0, target: Infinity, freePlay: true },
  ];

  const LS_UNLOCK = 'gf-breakout-unlock';
  const LS_SCORES = 'gf-breakout-scores';

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function LoadUnlock()    { return StorageGet(LS_UNLOCK, 0); }
  function SaveUnlock(n)   { if (n > LoadUnlock()) StorageSet(LS_UNLOCK, n); }
  function LoadScores()    { return StorageGet(LS_SCORES, {}); }
  function SaveScore(l, s) { const sc = LoadScores(); if (s > (sc[l] || 0)) { sc[l] = s; StorageSet(LS_SCORES, sc); } }

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

  /* ── Particles ── */
  let _particles = [];

  function SpawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      _particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.025,
        size: 1.5 + Math.random() * 2.5,
        color,
      });
    }
  }

  function UpdateParticles(dt) {
    for (let i = _particles.length - 1; i >= 0; i--) {
      const p = _particles[i];
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy += 0.03 * dt * 0.06;
      p.life -= p.decay * dt * 0.06;
      if (p.life <= 0) _particles.splice(i, 1);
    }
  }

  function DrawParticles(ctx) {
    for (const p of _particles) {
      ctx.globalAlpha = Math.max(0, p.life) * 0.85;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ── Ball Trail ── */
  let _trail = [];
  const TRAIL_MAX = 12;

  function PushTrail(x, y) {
    _trail.push({ x, y });
    if (_trail.length > TRAIL_MAX) _trail.shift();
  }

  function DrawTrail(ctx, ballR) {
    for (let i = 0; i < _trail.length; i++) {
      const t = _trail[i];
      const a = (i / _trail.length) * 0.3;
      const r = ballR * (i / _trail.length) * 0.8;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ── Power-ups ── */
  const PU_TYPES = [
    { type: 'wide',  symbol: 'W', color: '#22d3ee', desc: 'Wide Paddle'   },
    { type: 'multi', symbol: 'M', color: '#c084fc', desc: 'Multi Ball'    },
    { type: 'slow',  symbol: 'S', color: '#fbbf24', desc: 'Slow Ball'     },
  ];
  const PU_DROP_CHANCE = 0.18;
  const PU_SPEED = 1.2;
  const PU_DURATION = 8000;

  /* ── State ── */
  let GS = null, _el = null, _grades = [], _lvlId = 1, _raf = null;

  function MakeBricks(lvl) {
    const pool = _grades.length ? _grades : FallbackGrades();
    const bricks = [];
    const bw = CV / lvl.cols;
    const bh = 14;
    const topOffset = 28;
    for (let r = 0; r < lvl.rows; r++) {
      for (let c = 0; c < lvl.cols; c++) {
        const g = pool[(r * lvl.cols + c) % pool.length];
        bricks.push({
          x: c * bw, y: topOffset + r * (bh + 2),
          w: bw - 2, h: bh,
          grade: g,
          color: GradeColor(g.Pct),
          alive: true,
          hitAnim: 0,
        });
      }
    }
    return bricks;
  }

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    const paddleW = 52;
    const paddleH = 8;
    const paddleY = CV - 20;
    const ballR = 4;
    const bricks = MakeBricks(lvl);
    return {
      lvl,
      status: 'start',
      score: 0,
      lives: 3,
      combo: 0,

      paddle: { x: CV / 2 - paddleW / 2, y: paddleY, w: paddleW, h: paddleH, baseW: paddleW },
      balls: [{
        x: CV / 2, y: paddleY - ballR - 1,
        vx: 0, vy: 0,
        r: ballR,
        attached: true,
      }],
      bricks,
      powerUps: [],
      activePU: {},

      lastFrameTs: 0,
      trailTimer: 0,
    };
  }

  function LaunchBall(ball, gs) {
    if (!ball.attached) return;
    ball.attached = false;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const spd = gs.lvl.ballSpeed;
    ball.vx = Math.cos(angle) * spd;
    ball.vy = Math.sin(angle) * spd;
  }

  function ClampPaddle(gs) {
    gs.paddle.x = Math.max(0, Math.min(CV - gs.paddle.w, gs.paddle.x));
  }

  function ResetBall(gs) {
    const b = {
      x: gs.paddle.x + gs.paddle.w / 2,
      y: gs.paddle.y - 5,
      vx: 0, vy: 0,
      r: 4, attached: true,
    };
    gs.balls = [b];
    _trail = [];
  }

  /* ── Physics ── */
  function UpdateBalls(gs, dt) {
    const speedMult = gs.activePU.slow ? 0.55 : 1;
    const dtF = dt * 0.06;

    for (let bi = gs.balls.length - 1; bi >= 0; bi--) {
      const ball = gs.balls[bi];

      if (ball.attached) {
        ball.x = gs.paddle.x + gs.paddle.w / 2;
        ball.y = gs.paddle.y - ball.r - 1;
        continue;
      }

      ball.x += ball.vx * dtF * speedMult;
      ball.y += ball.vy * dtF * speedMult;

      // Wall collisions
      if (ball.x - ball.r <= 0)  { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x + ball.r >= CV) { ball.x = CV - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - ball.r <= 0)  { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

      // Paddle collision
      const p = gs.paddle;
      if (ball.vy > 0 &&
          ball.y + ball.r >= p.y && ball.y + ball.r <= p.y + p.h + 4 &&
          ball.x >= p.x - 2 && ball.x <= p.x + p.w + 2) {
        ball.y = p.y - ball.r;
        const hitPos = (ball.x - p.x) / p.w; // 0..1
        const angle = -Math.PI * 0.15 - hitPos * Math.PI * 0.7; // spread
        const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = Math.cos(angle) * spd;
        ball.vy = Math.sin(angle) * spd;
        // Ensure upward
        if (ball.vy > -0.5) ball.vy = -Math.abs(ball.vy) - 0.5;
        gs.combo = 0;
      }

      // Brick collision
      for (const brick of gs.bricks) {
        if (!brick.alive) continue;
        const bx = brick.x + 1, by = brick.y, bw = brick.w, bh = brick.h;
        // AABB vs circle
        const closestX = Math.max(bx, Math.min(ball.x, bx + bw));
        const closestY = Math.max(by, Math.min(ball.y, by + bh));
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        if (dx * dx + dy * dy <= ball.r * ball.r) {
          brick.alive = false;
          brick.hitAnim = 1;
          SpawnParticles(bx + bw / 2, by + bh / 2, brick.color, 10);

          gs.combo++;
          const comboMult = Math.min(gs.combo, 5);
          const eff = GradeEffect(brick.grade.Pct);
          const basePts = Math.round((brick.grade.Pct ?? 50) * 2);
          if (eff > 0) {
            gs.score += basePts * comboMult;
          } else {
            gs.score = Math.max(0, gs.score - Math.round(basePts * 0.5));
            // Shrink paddle briefly for bad grades
            if (!gs.activePU.wide) {
              gs.paddle.w = Math.max(28, gs.paddle.baseW * 0.65);
              clearTimeout(gs._shrinkTimer);
              gs._shrinkTimer = setTimeout(() => {
                if (GS && !GS.activePU.wide) GS.paddle.w = GS.paddle.baseW;
              }, 2500);
            }
          }

          // Power-up drop
          if (Math.random() < PU_DROP_CHANCE && IsPositive(brick.grade)) {
            const puType = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
            gs.powerUps.push({
              x: bx + bw / 2, y: by + bh / 2,
              ...puType,
              vy: PU_SPEED,
            });
          }

          // Bounce ball
          if (Math.abs(dx) > Math.abs(dy)) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;

          break; // one brick per frame
        }
      }

      // Ball lost (below paddle)
      if (ball.y - ball.r > CV + 10) {
        gs.balls.splice(bi, 1);
      }
    }

    // If no balls left, lose a life
    if (gs.balls.length === 0) {
      gs.lives--;
      if (gs.lives <= 0) {
        gs.status = 'gameover';
      } else {
        ResetBall(gs);
      }
    }

    // Win check
    if (gs.bricks.every(b => !b.alive)) {
      if (gs.lvl.freePlay) {
        // Rebuild bricks for endless play
        gs.bricks = MakeBricks(gs.lvl);
      } else {
        gs.status = 'win';
      }
    }
  }

  function UpdatePowerUps(gs, dt) {
    const dtF = dt * 0.06;
    for (let i = gs.powerUps.length - 1; i >= 0; i--) {
      const pu = gs.powerUps[i];
      pu.y += pu.vy * dtF;

      // Catch by paddle
      const p = gs.paddle;
      if (pu.y >= p.y && pu.y <= p.y + p.h + 6 &&
          pu.x >= p.x - 4 && pu.x <= p.x + p.w + 4) {
        ActivatePowerUp(gs, pu);
        gs.powerUps.splice(i, 1);
        continue;
      }

      if (pu.y > CV + 20) {
        gs.powerUps.splice(i, 1);
      }
    }
  }

  function ActivatePowerUp(gs, pu) {
    clearTimeout(gs.activePU[pu.type + '_t']);

    if (pu.type === 'wide') {
      gs.activePU.wide = true;
      gs.paddle.w = gs.paddle.baseW * 1.6;
      ClampPaddle(gs);
      gs.activePU.wide_t = setTimeout(() => {
        if (GS) { GS.activePU.wide = false; GS.paddle.w = GS.paddle.baseW; ClampPaddle(GS); }
      }, PU_DURATION);
    } else if (pu.type === 'multi') {
      gs.activePU.multi = true;
      const src = gs.balls.find(b => !b.attached) || gs.balls[0];
      if (src) {
        for (let n = 0; n < 2; n++) {
          const angle = Math.atan2(src.vy, src.vx) + (n === 0 ? 0.4 : -0.4);
          const spd = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || gs.lvl.ballSpeed;
          gs.balls.push({
            x: src.x, y: src.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            r: src.r, attached: false,
          });
        }
      }
      gs.activePU.multi_t = setTimeout(() => { if (GS) GS.activePU.multi = false; }, PU_DURATION);
    } else if (pu.type === 'slow') {
      gs.activePU.slow = true;
      gs.activePU.slow_t = setTimeout(() => { if (GS) GS.activePU.slow = false; }, PU_DURATION);
    }
  }

  /* ── Drawing ── */
  function GetCanvasColors() {
    const dark = document.getElementById('gf-bo')?.dataset.theme === 'dark';
    return dark
      ? { bg: '#0a0a0a', grid: '#181818', paddleGlow: 'rgba(96,165,250,0.35)', paddleBody: '#60a5fa', hudText: '#ccc' }
      : { bg: '#f0f0f0', grid: '#d8d8d8', paddleGlow: 'rgba(59,130,246,0.25)', paddleBody: '#3b82f6', hudText: '#555' };
  }

  function Draw() {
    const cv = document.getElementById('gf-bo-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const cc = GetCanvasColors();

    // Background
    ctx.fillStyle = cc.bg;
    ctx.fillRect(0, 0, CV, CV);

    // Bricks
    for (const brick of GS.bricks) {
      if (!brick.alive) continue;
      const bx = brick.x + 1, by = brick.y;
      ctx.fillStyle = brick.color;
      ctx.globalAlpha = 0.92;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(bx, by, brick.w, brick.h, 3); ctx.fill();
      } else {
        ctx.fillRect(bx, by, brick.w, brick.h);
      }
      // Sheen
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, by, brick.w, brick.h * 0.4);
      ctx.globalAlpha = 1;

      // Grade text
      if (brick.w > 20) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = '600 8px "IBM Plex Mono",monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          brick.grade.Pct != null ? `${Math.round(brick.grade.Pct)}%` : '?',
          bx + brick.w / 2, by + brick.h / 2
        );
      }
    }
    ctx.textAlign = 'left';

    // Power-ups (falling)
    for (const pu of GS.powerUps) {
      ctx.fillStyle = pu.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#111';
      ctx.font = '700 8px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.symbol, pu.x, pu.y);
    }
    ctx.textAlign = 'left';

    // Ball trail
    if (GS.balls.length > 0) {
      DrawTrail(ctx, GS.balls[0].r);
    }

    // Balls
    for (const ball of GS.balls) {
      // Glow
      const grd = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.r * 3);
      grd.addColorStop(0, 'rgba(96,165,250,0.25)');
      grd.addColorStop(1, 'rgba(96,165,250,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r * 3, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.r * 0.25, ball.y - ball.r * 0.25, ball.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Paddle
    const p = GS.paddle;
    // Glow
    ctx.shadowColor = cc.paddleGlow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = cc.paddleBody;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 4); ctx.fill();
    } else {
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.shadowBlur = 0;
    // Paddle sheen
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(p.x + 2, p.y, p.w - 4, p.h * 0.45, 2); ctx.fill();
    } else {
      ctx.fillRect(p.x + 2, p.y, p.w - 4, p.h * 0.45);
    }

    // Active PU indicators
    const puActive = [];
    if (GS.activePU.wide)  puActive.push({ symbol: 'W', color: '#22d3ee' });
    if (GS.activePU.multi) puActive.push({ symbol: 'M', color: '#c084fc' });
    if (GS.activePU.slow)  puActive.push({ symbol: 'S', color: '#fbbf24' });
    if (puActive.length) {
      let px = 4;
      for (const pu of puActive) {
        ctx.fillStyle = pu.color;
        ctx.globalAlpha = 0.7;
        ctx.font = '700 8px "IBM Plex Mono",monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pu.symbol, px, CV - 3);
        px += 12;
      }
      ctx.globalAlpha = 1;
    }

    // Particles
    DrawParticles(ctx);

    // Lives indicator (bottom right)
    ctx.fillStyle = '#f87171';
    ctx.font = '700 9px "IBM Plex Mono",monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('♥'.repeat(Math.max(0, GS.lives)), CV - 4, CV - 3);
    ctx.textAlign = 'left';

    // Level progress bar (very bottom)
    if (!GS.lvl.freePlay) {
      const prog = Math.min(1, GS.score / GS.lvl.target);
      ctx.fillStyle = 'rgba(74,222,128,0.18)';
      ctx.fillRect(0, CV - 2, CV, 2);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, CV - 2, CV * prog, 2);
    }

    UpdateHUD();
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!GS) return;
    const isFP = GS.lvl.freePlay;
    SetText('gf-bo-score', GS.score.toLocaleString());
    SetText('gf-bo-level', isFP ? '∞' : `L${GS.lvl.id}`);
    SetText('gf-bo-lives', '♥'.repeat(Math.max(0, GS.lives)));
  }

  /* ── Screens ── */
  const SCREEN_IDS = ['gf-bos-start','gf-bos-pause','gf-bos-gameover','gf-bos-win'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  function ShowGameOver() {
    SaveScore(GS.lvl.id, GS.score);
    const best = LoadScores()[GS.lvl.id] || 0;
    SetText('gf-bos-go-score', `${_GameText('game_score')}: ${GS.score.toLocaleString()}`);
    SetText('gf-bos-go-best', `${_GameText('game_best')}: ${best.toLocaleString()}`);
    ShowScreen('gf-bos-gameover'); Draw();
  }

  function ShowWin() {
    SaveScore(GS.lvl.id, GS.score);
    SaveUnlock(GS.lvl.id);
    const hasNext = GS.lvl.id < 5;
    SetText('gf-bos-win-score', `${GS.score.toLocaleString()} pts`);
    document.getElementById('gf-bos-next')?.style.setProperty('display', hasNext ? 'block' : 'none');
    const fpBtn = document.getElementById('gf-bos-fp-btn');
    if (fpBtn) fpBtn.style.display = LoadUnlock() >= 5 ? 'block' : 'none';
    ShowScreen('gf-bos-win'); Draw();
  }

  /* ── Level selector ── */
  function BuildLevelSelect() {
    const el = document.getElementById('gf-bo-lvl-sel');
    if (!el) return;
    const unlocked = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const nm = l.freePlay ? '∞' : `L${l.id}`;
      const desc = l.freePlay ? _GameText('game_snake_free_play') : `${l.rows}×${l.cols} ${_GameText('game_snake_grid')}`;
      const tgtTxt = l.freePlay ? _GameText('game_snake_no_target') : `${l.target.toLocaleString()} pts`;
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts.toLocaleString()}` : _GameText('game_snake_not_played');
      return `<button class="gf-bol${avail ? '' : ' gf-bol-locked'}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-bol-left">
          <div class="gf-bol-badge${l.freePlay ? ' gf-bol-badge-fp' : ''}">${nm}</div>
          <div class="gf-bol-info">
            <span class="gf-bol-name">${desc}</span>
            <span class="gf-bol-tgt">${tgtTxt}</span>
          </div>
        </div>
        <div class="gf-bol-right">
          ${avail ? `<span class="gf-bol-best">${bestTxt}</span>` : '<span style="font-size:14px">&#128274;</span>'}
        </div>
      </button>`;
    }).join('');
    el.querySelectorAll('[data-lvl]').forEach(btn => {
      btn.addEventListener('click', () => {
        _lvlId = parseInt(btn.dataset.lvl);
        DoStart();
      });
    });
  }

  /* ── Game loop ── */
  function StartLoop() {
    _raf = requestAnimationFrame(function Frame(ts) {
      if (!GS || GS.status !== 'playing') return;

      const dt = Math.min(ts - (GS.lastFrameTs || ts), 80);
      GS.lastFrameTs = ts;

      // Trail
      GS.trailTimer += dt;
      if (GS.trailTimer > 18 && GS.balls.length > 0 && !GS.balls[0].attached) {
        PushTrail(GS.balls[0].x, GS.balls[0].y);
        GS.trailTimer = 0;
      }

      UpdatePaddle(GS, dt);
      UpdateBalls(GS, dt);
      UpdatePowerUps(GS, dt);
      UpdateParticles(dt);

      if (GS.status === 'gameover') { StopLoop(); ShowGameOver(); return; }
      if (GS.status === 'win')      { StopLoop(); ShowWin();      return; }

      Draw();
      _raf = requestAnimationFrame(Frame);
    });
  }

  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  /* ── Flow ── */
  function DoStart() {
    StopLoop();
    _particles = [];
    _trail = [];
    GS = NewGameState(_lvlId);
    GS.status = 'playing';
    GS.lastFrameTs = performance.now();
    ShowScreen(null); Draw(); StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-bos-pause');
    } else if (GS.status === 'paused') {
      GS.status = 'playing'; GS.lastFrameTs = performance.now();
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    StopLoop(); _particles = []; _trail = [];
    GS = NewGameState(_lvlId);
    BuildLevelSelect(); Draw(); ShowScreen('gf-bos-start');
  }

  /* ── Input ── */
  let _kh = null, _moveDir = 0;

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-bo')) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      GS.status === 'playing' || GS.status === 'paused' ? DoPause() : CloseGradeBreakout();
      return;
    }
    if (e.key === 'p' || e.key === 'P') { DoPause(); return; }

    if (['ArrowLeft','ArrowRight',' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }

    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (GS.status === 'start' || GS.status === 'gameover') DoStart();
        else if (GS.status === 'paused') DoPause();
        e.preventDefault();
      }
      return;
    }

    if (e.key === ' ') {
      const attached = GS.balls.find(b => b.attached);
      if (attached) LaunchBall(attached, GS);
      return;
    }

    // Held-key tracking, actual movement happens per-frame for smoothness
    if (e.key === 'ArrowLeft')  _keysHeld.add('left');
    if (e.key === 'ArrowRight') _keysHeld.add('right');
    if (e.key === 'a' || e.key === 'A') _keysHeld.add('left');
    if (e.key === 'd' || e.key === 'D') _keysHeld.add('right');
  }

  function OnKeyUp(e) {
    if (e.key === 'ArrowLeft')  _keysHeld.delete('left');
    if (e.key === 'ArrowRight') _keysHeld.delete('right');
    if (e.key === 'a' || e.key === 'A') _keysHeld.delete('left');
    if (e.key === 'd' || e.key === 'D') _keysHeld.delete('right');
  }

  const _keysHeld = new Set();
  let _khUp = null;

  function UpdatePaddle(gs, dt) {
    if (!gs || gs.status !== 'playing') return;
    // 360 px/sec, smooth 60fps movement, dt-scaled so it's framerate-independent
    const speed = 360 * (dt / 1000);
    if (_keysHeld.has('left'))  gs.paddle.x -= speed;
    if (_keysHeld.has('right')) gs.paddle.x += speed;
    if (_keysHeld.size) ClampPaddle(gs);
  }

  function AttachKeys()  {
    if (_kh) return;
    _kh = OnKey; _khUp = OnKeyUp;
    document.addEventListener('keydown', _kh, true);
    document.addEventListener('keyup',   _khUp, true);
    window.addEventListener('blur', _ClearHeldKeys);
  }
  function DetachKeys()  {
    if (_kh)   { document.removeEventListener('keydown', _kh,   true); _kh   = null; }
    if (_khUp) { document.removeEventListener('keyup',   _khUp, true); _khUp = null; }
    window.removeEventListener('blur', _ClearHeldKeys);
    _ClearHeldKeys();
  }
  function _ClearHeldKeys() { _keysHeld.clear(); }

  /* Touch support */
  let _touchHandler = null;
  function AttachTouch() {
    if (_touchHandler) return;
    _touchHandler = function(e) {
      if (!GS || GS.status !== 'playing') return;
      const cv = document.getElementById('gf-bo-canvas');
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const tx = (e.touches[0].clientX - rect.left) * (CV / rect.width);
      GS.paddle.x = tx - GS.paddle.w / 2;
      ClampPaddle(GS);
      e.preventDefault();
    };
    document.getElementById('gf-bo-canvas')?.addEventListener('touchmove', _touchHandler, { passive: false });
    document.getElementById('gf-bo-canvas')?.addEventListener('touchstart', function(e) {
      if (GS?.status === 'playing') {
        const attached = GS.balls.find(b => b.attached);
        if (attached) LaunchBall(attached, GS);
      }
    });
  }
  function DetachTouch() {
    if (_touchHandler) {
      document.getElementById('gf-bo-canvas')?.removeEventListener('touchmove', _touchHandler);
      _touchHandler = null;
    }
  }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  /* ── Theme ── */
  function ApplyTheme() {
    const el = document.getElementById('gf-bo');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* ── Overlay ── */
  function BuildOverlay() {
    if (document.getElementById('gf-bo')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-bo';
    root.innerHTML = `
<div id="gf-bo-modal">
  <div id="gf-bo-hdr">
    <div class="gf-bo-hl">
      <div id="gf-bo-logo">GB</div>
      <span id="gf-bo-title">GradeBreakout</span>
      <span id="gf-bo-badge">BETA</span>
    </div>
    <div class="gf-bo-hr">
      <button id="gf-bo-pause-btn" title="${_GameText('game_pause_p')}">&#9208;</button>
      <button id="gf-bo-close" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-bo-body">
    <div id="gf-bo-board">
      <canvas id="gf-bo-canvas" width="${CV}" height="${CV}"></canvas>
    </div>
    <div id="gf-bo-hud">
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('game_score').toUpperCase()}</div>
        <div id="gf-bo-score" class="gf-bop-big" style="color:#4ade80">0</div>
      </div>
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('bo_level')}</div>
        <div id="gf-bo-level" class="gf-bop-val">L1</div>
      </div>
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('bo_lives')}</div>
        <div id="gf-bo-lives" class="gf-bop-val" style="color:#f87171">&#9829;&#9829;&#9829;</div>
      </div>
      <div class="gf-bop gf-bop-grades">
        <div class="gf-bop-label">${_GameText('bo_grade_effects')}</div>
        <div class="gf-bg-row"><span style="color:#4ade80">&#8805;75%</span><span>${_GameText('bo_big_pts')}</span></div>
        <div class="gf-bg-row"><span style="color:#a3e635">50&#8211;74%</span><span>${_GameText('bo_pts')}</span></div>
        <div class="gf-bg-row"><span style="color:#f97316">25&#8211;49%</span><span>${_GameText('bo_neg_shrink')}</span></div>
        <div class="gf-bg-row"><span style="color:#f87171">&lt;25%</span><span>${_GameText('bo_neg_shrink')}</span></div>
      </div>
      <div class="gf-bop">
        <div class="gf-bop-label">${_GameText('bo_powerups')}</div>
        <div class="gf-bg-row"><span style="color:#22d3ee">W</span><span>${_GameText('bo_wide')}</span></div>
        <div class="gf-bg-row"><span style="color:#c084fc">M</span><span>${_GameText('bo_multi')}</span></div>
        <div class="gf-bg-row"><span style="color:#fbbf24">S</span><span>${_GameText('bo_slow')}</span></div>
      </div>
      <div class="gf-bop gf-bop-ctrl">
        <div class="gf-bop-label">${_GameText('game_controls')}</div>
        <div class="gf-bc-row"><kbd>&#8592;&#8594;</kbd><span>${_GameText('bo_move')}</span></div>
        <div class="gf-bc-row"><kbd>Space</kbd><span>${_GameText('bo_launch')}</span></div>
        <div class="gf-bc-row"><kbd>P / Esc</kbd><span>${_GameText('bo_pause')}</span></div>
      </div>
    </div>

    <div id="gf-bos-start" class="gf-bos" style="padding:16px 20px;justify-content:flex-start;gap:10px;">
      <div class="gf-bos-start-hdr">
        <div>
          <div class="gf-bos-logo" style="font-size:22px;margin-bottom:2px;">${_GameText('bo_title')}</div>
          <div class="gf-bos-sub">${_GameText('bo_subtitle')}</div>
        </div>
      </div>
      <div id="gf-bo-lvl-sel" class="gf-bo-lvls"></div>
      <div class="gf-bos-effects">
        <span style="color:#4ade80">&#8805;75%&nbsp;+pts</span>
        <span style="color:#a3e635">50%&nbsp;+pts</span>
        <span style="color:#f97316">25%&nbsp;&#8722;pts</span>
        <span style="color:#f87171">&lt;25%&nbsp;&#8722;pts</span>
      </div>
      <div class="gf-bos-footer">${_GameText('bo_launch')} &middot; ${_GameText('bo_move')}</div>
    </div>

    <div id="gf-bos-pause" class="gf-bos" style="display:none">
      <div class="gf-bos-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-tb-btn" id="gf-bos-resume">&#9654;&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-bos-gameover" class="gf-bos" style="display:none">
      <div class="gf-bos-go-title">${_GameText('game_gameover')}</div>
      <div id="gf-bos-go-score" class="gf-bos-stat"></div>
      <div id="gf-bos-go-best" class="gf-bos-stat" style="color:#f97316"></div>
      <button class="gf-tb-btn"               id="gf-bos-retry">&#8634;&nbsp; ${_GameText('game_try_again')}</button>
      <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-back-go">&#8592; ${_GameText('game_levels')}</button>
    </div>

    <div id="gf-bos-win" class="gf-bos" style="display:none">
      <div class="gf-bos-win-title">${_GameText('game_snake_level_clear')}</div>
      <div id="gf-bos-win-score" class="gf-bos-stat" style="color:#4ade80;font-weight:700;font-size:18px"></div>
      <button class="gf-tb-btn"               id="gf-bos-next">&#8594;&nbsp; ${_GameText('game_snake_next_level')}</button>
      <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-fp-btn" style="display:none">&#8734;&nbsp; ${_GameText('game_snake_free_play')}</button>
      <button class="gf-tb-btn gf-tb-btn-sec" id="gf-bos-back-win">&#8592; ${_GameText('game_levels')}</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-bo-close')     ?.addEventListener('click', CloseGradeBreakout);
    document.getElementById('gf-bo-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-bos-resume')   ?.addEventListener('click', DoPause);
    document.getElementById('gf-bos-retry')    ?.addEventListener('click', DoStart);
    document.getElementById('gf-bos-back-go')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-bos-back-win') ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-bos-next')     ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-bos-fp-btn')   ?.addEventListener('click', () => { _lvlId = 6; DoStart(); });
    document.getElementById('gf-bo')           ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-bo') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyBreakout();
      else CloseGradeBreakout();
    });
  }

  /* ── Public API ── */
  function OpenGradeBreakout(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-bo')) BuildOverlay();
    document.getElementById('gf-bo').style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    AttachTouch();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStartScreen();
  }

  function CloseGradeBreakout() {
    const el = document.getElementById('gf-bo');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys(); DetachTouch(); _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function BossKeyBreakout() {
    const el = document.getElementById('gf-bo');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
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

  function ToggleGradeBreakout(grades) {
    const el = document.getElementById('gf-bo');
    if (el && el.style.display !== 'none') CloseGradeBreakout(); else OpenGradeBreakout(grades);
  }

  W.OpenGradeBreakout       = OpenGradeBreakout;
  W.CloseGradeBreakout      = CloseGradeBreakout;
  W.ToggleGradeBreakout     = ToggleGradeBreakout;
  W.BossKeyBreakout         = BossKeyBreakout;

  /* ── CSS ── */
  function InjectCSS() {
    if (document.getElementById('gf-breakout-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-breakout-css';
    s.textContent = `
#gf-bo {
  --bo-modal:#ffffff;--bo-hdr:#f5f5f5;--bo-hud:#fafafa;--bo-scr:rgba(248,248,248,0.96);
  --bo-brd:rgba(59,130,246,0.22);--bo-brd2:#e0e0e0;--bo-btn-brd:#d0d0d0;
  --bo-txt:#111;--bo-txt2:#555;--bo-txt3:#999;--bo-kbd:#eee;--bo-kbd-brd:#ccc;
  --bo-scroll:#d0d0d0;--bo-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-bo[data-theme="dark"] {
  --bo-modal:rgba(13,13,13,0.97);--bo-hdr:rgba(8,8,8,0.95);--bo-hud:rgba(10,10,10,0.98);
  --bo-scr:rgba(6,6,6,0.94);--bo-brd:rgba(59,130,246,0.18);--bo-brd2:#1c1c1c;
  --bo-btn-brd:#333;--bo-txt:#f5f5f5;--bo-txt2:#aaa;--bo-txt3:#555;
  --bo-kbd:#1e1e1e;--bo-kbd-brd:#333;--bo-scroll:#2a2a2a;
  --bo-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-bo{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-bo-modal{position:relative;display:flex;flex-direction:column;background:var(--bo-modal);border:1px solid var(--bo-brd);border-radius:12px;box-shadow:var(--bo-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-bo-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bo-hdr);border-bottom:1px solid var(--bo-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-bo-hl{display:flex;align-items:center;gap:8px;} .gf-bo-hr{display:flex;align-items:center;gap:6px;}
#gf-bo-logo{width:26px;height:26px;background:#3b82f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:-1px;flex-shrink:0;}
#gf-bo-title{font-size:14px;font-weight:700;color:var(--bo-txt);letter-spacing:-0.3px;}
#gf-bo-badge{font-size:8px;font-weight:600;color:#3b82f6;border:1px solid rgba(59,130,246,0.4);border-radius:4px;padding:2px 5px;letter-spacing:1px;}
#gf-bo-pause-btn,#gf-bo-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--bo-btn-brd);border-radius:6px;background:transparent;color:var(--bo-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-bo-pause-btn:hover{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,.10);}
#gf-bo-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-bo-body{display:flex;position:relative;overflow:hidden;}
#gf-bo-board{flex-shrink:0;border-right:1px solid var(--bo-brd);line-height:0;}
#gf-bo-canvas{display:block;width:${CV}px;height:${CV}px;}
#gf-bo-hud{width:148px;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto;background:var(--bo-hud);}
#gf-bo-hud::-webkit-scrollbar{width:3px;} #gf-bo-hud::-webkit-scrollbar-thumb{background:var(--bo-scroll);border-radius:99px;}
.gf-bop{padding:8px 10px;border-bottom:1px solid var(--bo-brd2);flex-shrink:0;} .gf-bop:last-child{border-bottom:none;}
.gf-bop-label{font-size:8px;font-weight:600;letter-spacing:1.5px;color:var(--bo-txt3);text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.gf-bop-label::before{content:'\\2022';color:#3b82f6;font-size:11px;line-height:1;}
.gf-bop-big{font-size:20px;font-weight:700;color:var(--bo-txt);letter-spacing:-0.5px;line-height:1.1;}
.gf-bop-val{font-size:14px;font-weight:700;color:var(--bo-txt);}
.gf-bg-row{display:flex;justify-content:space-between;font-size:9px;padding:2px 0;} .gf-bg-row span:last-child{color:var(--bo-txt3);}
.gf-bc-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.gf-bc-row kbd{display:inline-block;padding:1px 4px;font-family:inherit;font-size:7px;font-weight:600;background:var(--bo-kbd);border:1px solid var(--bo-kbd-brd);border-radius:3px;color:var(--bo-txt2);min-width:30px;text-align:center;flex-shrink:0;}
.gf-bc-row span{font-size:8px;color:var(--bo-txt3);}
.gf-bos{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;background:var(--bo-scr);padding:24px;}
.gf-bos-logo{font-size:28px;font-weight:700;color:#3b82f6;letter-spacing:-1px;text-shadow:0 0 50px rgba(59,130,246,0.5);}
.gf-bos-sub{font-size:12px;color:var(--bo-txt2);letter-spacing:0.5px;} .gf-bos-footer{font-size:8px;color:var(--bo-txt3);text-align:center;}
.gf-bos-stat{font-size:11px;color:var(--bo-txt2);}
.gf-bos-go-title{font-size:28px;font-weight:700;color:#f87171;letter-spacing:5px;text-shadow:0 0 35px rgba(248,113,113,0.5);}
.gf-bos-win-title{font-size:24px;font-weight:700;color:#4ade80;letter-spacing:2px;text-shadow:0 0 40px rgba(74,222,128,0.55);}
.gf-tb-btn{padding:9px 24px;border:1px solid #3b82f6;border-radius:7px;background:rgba(59,130,246,0.10);color:#3b82f6;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;transition:background .14s,box-shadow .14s,transform .14s;}
.gf-tb-btn:hover{background:rgba(59,130,246,0.22);box-shadow:0 4px 20px rgba(59,130,246,0.28);transform:translateY(-1px);}
.gf-tb-btn-sec{border-color:var(--bo-btn-brd);color:var(--bo-txt2);background:transparent;}
.gf-tb-btn-sec:hover{background:rgba(128,128,128,0.10);box-shadow:none;}
.gf-bos-start-hdr{display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:10px;}
.gf-bos-effects{display:flex;gap:10px;font-size:9px;font-weight:600;color:var(--bo-txt3);flex-wrap:wrap;justify-content:center;}
.gf-bo-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-bol{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--bo-brd2);border-radius:9px;background:var(--bo-hud);color:var(--bo-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-bol:hover:not(:disabled){border-color:#3b82f6;background:rgba(59,130,246,0.07);transform:translateX(2px);}
.gf-bol-locked{opacity:0.4;} .gf-bol:disabled{cursor:default;}
.gf-bol-left{display:flex;align-items:center;gap:10px;}
.gf-bol-badge{width:30px;height:30px;border-radius:7px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#3b82f6;flex-shrink:0;}
.gf-bol-badge-fp{background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.3);color:#a78bfa;}
.gf-bol-info{display:flex;flex-direction:column;gap:1px;}
.gf-bol-name{font-size:12px;font-weight:700;color:var(--bo-txt);}
.gf-bol-tgt{font-size:9px;color:var(--bo-txt3);font-weight:400;}
.gf-bol-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;}
.gf-bol-best{font-size:8px;color:var(--bo-txt3);white-space:nowrap;}
`;
    document.head.appendChild(s);
  }

})(window);
