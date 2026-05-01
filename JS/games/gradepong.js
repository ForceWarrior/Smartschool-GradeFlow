;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV = 320;

  // AI tuning notes:
  //  - aiSpeed: max paddle speed in px/frame at 60fps (dt-scaled in Update)
  //  - aiReact: proportion of distance-to-ball it closes per frame (lower = laggier AI)
  //  - aiMiss : 0..1 random vertical jitter applied to its target, makes it human-flawed
  //  - aiTrack: 0..1 fraction of incoming ball trajectory it actually tracks
  //             (the rest of the time it drifts toward center), gives players an opening
  const LEVELS = [
    { id: 1, aiSpeed: 1.6, aiReact: 0.06, aiMiss: 36, aiTrack: 0.55, winScore: 5, labelKey: 'pong_lvl_beginner' },
    { id: 2, aiSpeed: 2.1, aiReact: 0.10, aiMiss: 24, aiTrack: 0.70, winScore: 5, labelKey: 'pong_lvl_easy'     },
    { id: 3, aiSpeed: 2.7, aiReact: 0.16, aiMiss: 14, aiTrack: 0.82, winScore: 5, labelKey: 'pong_lvl_medium'   },
    { id: 4, aiSpeed: 3.4, aiReact: 0.24, aiMiss:  6, aiTrack: 0.92, winScore: 5, labelKey: 'pong_lvl_hard'     },
    { id: 5, aiSpeed: 4.2, aiReact: 0.36, aiMiss:  2, aiTrack: 0.98, winScore: 5, labelKey: 'pong_lvl_expert'   },
    { id: 6, aiSpeed: 2.8, aiReact: 0.18, aiMiss: 14, aiTrack: 0.85, winScore: Infinity, freePlay: true, labelKey: 'pong_lvl_freeplay' },
  ];

  const LS_UNLOCK = 'gf-pong-unlock';
  const LS_SCORES = 'gf-pong-scores';

  const PADDLE_W  = 8;
  const PADDLE_H  = 50;
  const BALL_R    = 5;
  const WALL_PAD  = 14;
  // Ball velocities are stored in px-per-frame at 60fps, then dt-scaled in Update
  const BALL_INIT = 2.4;   // was 3.0, felt too fast
  const BALL_MAX  = 5.5;   // was 7.5
  const BALL_RAMP = 0.10;  // was 0.15
  const ORB_R     = 10;
  const ORB_INTERVAL = 6000;
  const EFFECT_DUR   = 4000;

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function LoadUnlock()    { return StorageGet(LS_UNLOCK, 0); }
  function SaveUnlock(n)   { if (n > LoadUnlock()) StorageSet(LS_UNLOCK, n); }
  function LoadScores()    { return StorageGet(LS_SCORES, {}); }
  function SaveScore(l, s) { const sc = LoadScores(); if (s > (sc[l] || 0)) { sc[l] = s; StorageSet(LS_SCORES, sc); } }

  /* GRADE HELPERS */
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

  function IsPositive(g) { return g.Pct == null || g.Pct >= 50; }

  /* STATE */
  let GS = null, _el = null, _grades = [], _lvlId = 1, _raf = null;

  function PickGrade() {
    const pool = _grades.length ? _grades : FallbackGrades();
    return pool[0 | (Math.random() * pool.length)];
  }

  function NewGameState(lvlId) {
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    return {
      lvl,
      status: 'start',
      _bossHidden: false,

      // paddles: y = center
      playerY: CV / 2,
      aiY: CV / 2,
      playerH: PADDLE_H,
      aiH: PADDLE_H,
      playerSpeed: 5,

      // ball
      ballX: CV / 2, ballY: CV / 2,
      ballVX: 0, ballVY: 0,
      ballSpeed: BALL_INIT,
      ballTrail: [],

      // scores
      playerScore: 0,
      aiScore: 0,
      totalHits: 0,

      // grade orb
      orb: null,
      orbTimer: 0,

      // active effects
      effects: [],

      // serve flow
      servePause: 0,
      queuedServe: null,

      // visual
      shake: 0,
      scoreFlash: null,
      lastTs: 0,
    };
  }

  function LaunchBall(gs, towardsPlayer) {
    const angle = (Math.random() * 0.8 - 0.4); // ±0.4 rad from horizontal
    const dir = towardsPlayer ? -1 : 1;
    gs.ballX = CV / 2;
    gs.ballY = CV / 2;
    gs.ballSpeed = BALL_INIT;
    gs.ballVX = Math.cos(angle) * gs.ballSpeed * dir;
    gs.ballVY = Math.sin(angle) * gs.ballSpeed;
    gs.ballTrail = [];
    gs.servePause = 0;
    gs.queuedServe = null;
  }

  // Centers the ball, freezes it briefly, then serves with a queued velocity.
  function QueueServe(gs, towardsPlayer) {
    const angle = (Math.random() * 0.8 - 0.4);
    const dir = towardsPlayer ? -1 : 1;
    gs.ballX = CV / 2;
    gs.ballY = CV / 2;
    gs.ballSpeed = BALL_INIT;
    gs.ballVX = 0;
    gs.ballVY = 0;
    gs.ballTrail = [];
    gs.queuedServe = {
      vx: Math.cos(angle) * BALL_INIT * dir,
      vy: Math.sin(angle) * BALL_INIT,
    };
    gs.servePause = 750; // ms
  }

  /* EFFECT SYSTEM
   *
   * Effects are owner-targeted: when the ball hits an orb, the effect lands on
   * whichever paddle last struck the ball ('player' or 'ai').
   *  • good grade  → buff for the owner   (big own paddle / shrink opponent)
   *  • bad grade   → debuff for the owner (small own paddle / boost opponent speed)
   * If nobody has hit the ball yet (orb collected on initial serve) we pick a
   * random side so neither player has an unfair advantage. */
  function ApplyEffect(gs, grade, owner) {
    const good = IsPositive(grade);
    if (!owner) owner = Math.random() < 0.5 ? 'player' : 'ai';

    let type;
    if (good) {
      type = ['bigSelf', 'shrinkOpp', 'slowOpp'][0 | Math.random() * 3];
    } else {
      type = ['smallSelf', 'fastOpp'][0 | Math.random() * 2];
    }

    // Replace existing effect of same type+owner
    gs.effects = gs.effects.filter(e => !(e.type === type && e.owner === owner));
    gs.effects.push({ type, owner, grade, start: performance.now(), dur: EFFECT_DUR });
    RecalcEffects(gs);
  }

  function RecalcEffects(gs) {
    let pH = PADDLE_H, aH = PADDLE_H;
    let aiMult = 1, plMult = 1;
    const now = performance.now();
    gs.effects = gs.effects.filter(e => now - e.start < e.dur);
    for (const e of gs.effects) {
      const sIsPlayer = e.owner === 'player';
      switch (e.type) {
        // Buffs for the owner
        case 'bigSelf':    if (sIsPlayer) pH = PADDLE_H * 1.5; else aH = PADDLE_H * 1.5; break;
        case 'shrinkOpp':  if (sIsPlayer) aH = PADDLE_H * 0.6; else pH = PADDLE_H * 0.6; break;
        case 'slowOpp':    if (sIsPlayer) aiMult = 0.5;        else plMult = 0.5;        break;
        // Debuffs for the owner
        case 'smallSelf':  if (sIsPlayer) pH = PADDLE_H * 0.6; else aH = PADDLE_H * 0.6; break;
        case 'fastOpp':    if (sIsPlayer) aiMult = 1.5;        else plMult = 1.5;        break;
      }
    }
    gs.playerH = pH;
    gs.aiH = aH;
    gs._aiSpeedMult     = aiMult;
    gs._playerSpeedMult = plMult;
  }

  /* ORB
   * Orbs can spawn anywhere across the playfield (player side, centre, or
   * AI side), so debuffs and buffs alike can land on either player. */
  function SpawnOrb(gs) {
    const g = PickGrade();
    // 0.10..0.90 of CV horizontally, covers both halves
    gs.orb = {
      x: CV * 0.10 + Math.random() * CV * 0.80,
      y: CV * 0.15 + Math.random() * CV * 0.70,
      grade: g,
      color: GradeColor(g.Pct),
      born: performance.now(),
    };
  }

  /* GAME LOOP */
  function Update(gs, dt) {
    if (gs.status !== 'playing') return;
    const dtS = dt / 1000;

    // Decay shake
    if (gs.shake > 0) gs.shake = Math.max(0, gs.shake - dt * 0.008);

    // Expire effects
    RecalcEffects(gs);

    // Orb timer
    gs.orbTimer += dt;
    if (!gs.orb && gs.orbTimer > ORB_INTERVAL) {
      SpawnOrb(gs);
      gs.orbTimer = 0;
    }

    // Move ball, dt-scaled so motion is identical at 60Hz / 120Hz / 144Hz
    gs.ballTrail.push({ x: gs.ballX, y: gs.ballY, t: performance.now() });
    if (gs.ballTrail.length > 12) gs.ballTrail.shift();

    const stepScale = dt / 16.6667; // 1.0 at 60fps, 0.5 at 120fps
    gs.ballX += gs.ballVX * stepScale;
    gs.ballY += gs.ballVY * stepScale;

    // Wall bounce (top/bottom)
    if (gs.ballY - BALL_R <= 0) {
      gs.ballY = BALL_R;
      gs.ballVY = Math.abs(gs.ballVY);
    }
    if (gs.ballY + BALL_R >= CV) {
      gs.ballY = CV - BALL_R;
      gs.ballVY = -Math.abs(gs.ballVY);
    }

    // Paddle collision - player (left)
    const pTop = gs.playerY - gs.playerH / 2;
    const pBot = gs.playerY + gs.playerH / 2;
    if (gs.ballVX < 0 &&
        gs.ballX - BALL_R <= WALL_PAD + PADDLE_W &&
        gs.ballX - BALL_R >= WALL_PAD - 2 &&
        gs.ballY >= pTop - BALL_R && gs.ballY <= pBot + BALL_R) {
      gs.ballX = WALL_PAD + PADDLE_W + BALL_R;
      const relY = (gs.ballY - gs.playerY) / (gs.playerH / 2); // -1 to 1
      const angle = relY * (Math.PI / 4); // max 45 deg
      gs.ballSpeed = Math.min(BALL_MAX, gs.ballSpeed + BALL_RAMP);
      gs.ballVX =  Math.cos(angle) * gs.ballSpeed;
      gs.ballVY =  Math.sin(angle) * gs.ballSpeed;
      gs.totalHits++;
      gs.lastHit = 'player';
    }

    // Paddle collision - AI (right)
    const aTop = gs.aiY - gs.aiH / 2;
    const aBot = gs.aiY + gs.aiH / 2;
    if (gs.ballVX > 0 &&
        gs.ballX + BALL_R >= CV - WALL_PAD - PADDLE_W &&
        gs.ballX + BALL_R <= CV - WALL_PAD + 2 &&
        gs.ballY >= aTop - BALL_R && gs.ballY <= aBot + BALL_R) {
      gs.ballX = CV - WALL_PAD - PADDLE_W - BALL_R;
      const relY = (gs.ballY - gs.aiY) / (gs.aiH / 2);
      const angle = relY * (Math.PI / 4);
      gs.ballSpeed = Math.min(BALL_MAX, gs.ballSpeed + BALL_RAMP);
      gs.ballVX = -Math.cos(angle) * gs.ballSpeed;
      gs.ballVY =  Math.sin(angle) * gs.ballSpeed;
      gs.totalHits++;
      gs.lastHit = 'ai';
    }

    // Orb collision with ball
    if (gs.orb) {
      const dx = gs.ballX - gs.orb.x, dy = gs.ballY - gs.orb.y;
      if (dx * dx + dy * dy < (BALL_R + ORB_R) * (BALL_R + ORB_R)) {
        ApplyEffect(gs, gs.orb.grade, gs.lastHit);
        gs.orb = null;
        gs.orbTimer = 0;
      }
    }

    // Resolve serve-pause: after a goal, ball sits still in the middle for a
    // moment, then the queued velocity is applied so the player can react.
    if (gs.servePause > 0) {
      gs.servePause = Math.max(0, gs.servePause - dt);
      if (gs.servePause === 0 && gs.queuedServe) {
        gs.ballVX = gs.queuedServe.vx;
        gs.ballVY = gs.queuedServe.vy;
        gs.queuedServe = null;
      }
    }

    // Score - ball past left edge (only check when ball isn't frozen for serve)
    if (gs.servePause === 0 && gs.ballX < -BALL_R * 2) {
      gs.aiScore++;
      gs.shake = 6;
      gs.scoreFlash = { side: 'ai', t: performance.now() };
      if (CheckWin(gs)) return;
      QueueServe(gs, true);                 // ball sits in center, then serves left
    }
    // Score - ball past right edge
    else if (gs.servePause === 0 && gs.ballX > CV + BALL_R * 2) {
      gs.playerScore++;
      gs.shake = 6;
      gs.scoreFlash = { side: 'player', t: performance.now() };
      if (CheckWin(gs)) return;
      QueueServe(gs, false);
    }

    // AI movement, humanized:
    //   - only tracks ball some of the time (aiTrack), otherwise drifts to centre
    //   - perturbs the target with a slow-moving sine + random jitter so it
    //     doesn't lock onto the ball perfectly
    //   - dt-scaled so 144Hz monitors don't make the AI superhuman
    const aiReact = gs.lvl.aiReact;
    const aiSpd   = gs.lvl.aiSpeed * (gs._aiSpeedMult || 1);
    const aiMiss  = gs.lvl.aiMiss  ?? 10;
    const aiTrack = gs.lvl.aiTrack ?? 0.85;

    // refresh AI's "intended" target periodically rather than every frame so it
    // can't reactively counter every paddle-tilt
    gs._aiThinkT = (gs._aiThinkT || 0) - dt;
    if (gs._aiThinkT <= 0) {
      gs._aiThinkT = 90 + Math.random() * 80;       // re-decide every ~90-170ms
      const ballApproaching = gs.ballVX > 0;
      if (ballApproaching && Math.random() < aiTrack) {
        const wobble = Math.sin(performance.now() * 0.003) * aiMiss * 0.6;
        const jitter = (Math.random() - 0.5) * aiMiss * 1.6;
        gs._aiTarget = gs.ballY + wobble + jitter;
      } else {
        gs._aiTarget = CV / 2 + (Math.random() - 0.5) * 30;
      }
    }

    const stepScaleAI = dt / 16.6667;
    const diff = (gs._aiTarget ?? CV / 2) - gs.aiY;
    if (Math.abs(diff) > 3) {
      gs.aiY += Math.sign(diff) * Math.min(Math.abs(diff) * aiReact, aiSpd) * stepScaleAI;
    }
    gs.aiY = Math.max(gs.aiH / 2, Math.min(CV - gs.aiH / 2, gs.aiY));

    UpdateHUD();
  }

  function CheckWin(gs) {
    const winScore = gs.lvl.winScore;
    if (gs.playerScore >= winScore) {
      gs.status = 'win';
      StopLoop();
      SaveScore(gs.lvl.id, gs.playerScore);
      if (!gs.lvl.freePlay) SaveUnlock(gs.lvl.id);
      ShowScreen('gf-pos-win');
      SetText('gf-po-win-title', gs.lvl.freePlay
        ? _GameText('game_gameover')
        : `Lv ${gs.lvl.id} - ${_GameText('po_round_won')}`);
      SetText('gf-po-win-score', `${gs.playerScore} - ${gs.aiScore}`);
      const nextBtn = document.getElementById('gf-po-next');
      if (nextBtn) {
        const hasNext = gs.lvl.id < 5;
        nextBtn.style.display = hasNext ? 'block' : 'none';
      }
      const modsBtn = document.getElementById('gf-po-free-btn');
      if (modsBtn) modsBtn.style.display = LoadUnlock() >= 5 ? 'block' : 'none';
      Draw();
      return true;
    }
    if (gs.aiScore >= winScore) {
      gs.status = 'gameover';
      StopLoop();
      ShowScreen('gf-pos-gameover');
      SetText('gf-po-go-score', `${gs.playerScore} - ${gs.aiScore}`);
      Draw();
      return true;
    }
    if (gs.lvl.freePlay && gs.aiScore >= 5) {
      gs.status = 'gameover';
      StopLoop();
      SaveScore(gs.lvl.id, gs.playerScore);
      ShowScreen('gf-pos-gameover');
      SetText('gf-po-go-score', `${gs.playerScore} - ${gs.aiScore}`);
      Draw();
      return true;
    }
    return false;
  }

  /* RENDER */
  function Draw() {
    const cv = document.getElementById('gf-po-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const dark = document.getElementById('gf-po')?.dataset.theme === 'dark';

    // Shake offset
    const sx = GS.shake > 0 ? (Math.random() - 0.5) * GS.shake : 0;
    const sy = GS.shake > 0 ? (Math.random() - 0.5) * GS.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // Background
    ctx.fillStyle = dark ? '#0a0a0a' : '#f0f0f0';
    ctx.fillRect(-4, -4, CV + 8, CV + 8);

    // Center dashed line
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(CV / 2, 0);
    ctx.lineTo(CV / 2, CV);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(CV / 2, CV / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Score flash
    if (GS.scoreFlash) {
      const elapsed = performance.now() - GS.scoreFlash.t;
      if (elapsed < 400) {
        const alpha = (1 - elapsed / 400) * 0.15;
        ctx.fillStyle = GS.scoreFlash.side === 'player'
          ? `rgba(74,222,128,${alpha})`
          : `rgba(248,113,113,${alpha})`;
        const fx = GS.scoreFlash.side === 'player' ? CV / 2 : 0;
        ctx.fillRect(fx, 0, CV / 2, CV);
      } else {
        GS.scoreFlash = null;
      }
    }

    // Active effects indicator
    const now = performance.now();
    for (const e of GS.effects) {
      const remaining = 1 - (now - e.start) / e.dur;
      if (remaining > 0) {
        const color = IsPositive(e.grade) ? 'rgba(74,222,128,' : 'rgba(248,113,113,';
        ctx.fillStyle = color + (remaining * 0.06).toFixed(3) + ')';
        ctx.fillRect(0, 0, CV, CV);
      }
    }

    // Paddle glow + paddles
    DrawPaddle(ctx, WALL_PAD, GS.playerY, PADDLE_W, GS.playerH, '#4ade80', dark);
    DrawPaddle(ctx, CV - WALL_PAD - PADDLE_W, GS.aiY, PADDLE_W, GS.aiH, '#f87171', dark);

    // Ball trail
    for (let i = 0; i < GS.ballTrail.length; i++) {
      const t = GS.ballTrail[i];
      const age = now - t.t;
      if (age > 200) continue;
      const alpha = (1 - age / 200) * 0.3;
      const r = BALL_R * (1 - age / 200) * 0.7;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(GS.ballX, GS.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Grade orb
    if (GS.orb) {
      const pulse = 0.85 + 0.15 * Math.sin((now - GS.orb.born) / 400 * Math.PI * 2);
      const orbR = ORB_R * pulse;

      // Glow
      const grd = ctx.createRadialGradient(GS.orb.x, GS.orb.y, 0, GS.orb.x, GS.orb.y, orbR * 2);
      grd.addColorStop(0, GS.orb.color + '66');
      grd.addColorStop(1, GS.orb.color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(GS.orb.x, GS.orb.y, orbR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = GS.orb.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(GS.orb.x, GS.orb.y, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Sheen
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(GS.orb.x - orbR * 0.25, GS.orb.y - orbR * 0.25, orbR * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = dark ? '#fff' : '#000';
      ctx.font = '700 7px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(GS.orb.grade.Pct != null ? `${Math.round(GS.orb.grade.Pct)}%` : '?', GS.orb.x, GS.orb.y);
    }

    // Effect timers bar at top
    let barX = 4;
    for (const e of GS.effects) {
      const remaining = 1 - (now - e.start) / e.dur;
      if (remaining <= 0) continue;
      const col = IsPositive(e.grade) ? '#4ade80' : '#f87171';
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(barX, 2, 40 * remaining, 3);
      ctx.globalAlpha = 1;
      barX += 44;
    }

    ctx.restore();
  }

  function DrawPaddle(ctx, x, cy, w, h, color, dark) {
    const top = cy - h / 2;
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, top, w, h, 3);
      ctx.fill();
    } else {
      ctx.fillRect(x, top, w, h);
    }
    ctx.shadowBlur = 0;
    // Sheen
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, top, w, h * 0.35);
  }

  /* GAME LOOP */
  function StartLoop() {
    _raf = requestAnimationFrame(function Frame(ts) {
      if (!GS) return;
      if (GS.status !== 'playing') { Draw(); return; }
      const dt = Math.min(ts - (GS.lastTs || ts), 80);
      GS.lastTs = ts;
      UpdatePlayerPaddle(dt);
      Update(GS, dt);
      Draw();
      _raf = requestAnimationFrame(Frame);
    });
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  /* HUD */
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!GS) return;
    SetText('gf-po-pscore', GS.playerScore);
    SetText('gf-po-ascore', GS.aiScore);
    SetText('gf-po-level', GS.lvl.freePlay ? 'Free' : `Lv ${GS.lvl.id}`);
  }

  /* SCREENS */
  const SCREEN_IDS = ['gf-pos-start','gf-pos-pause','gf-pos-gameover','gf-pos-win'];
  function ShowScreen(id) {
    SCREEN_IDS.forEach(sid => { const e = document.getElementById(sid); if (e) e.style.display = sid === id ? 'flex' : 'none'; });
  }

  /* INPUT */
  let _inputY = null; // for mouse/touch continuous input
  let _keysDown = {};

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-po')) return;

    // Always track held-key state on both keydown and keyup
    if (e.type === 'keydown') _keysDown[e.key] = true;
    if (e.type === 'keyup')   delete _keysDown[e.key];

    // Action keys (Escape / Enter / Space), keydown only, otherwise the
    // matching keyup event would re-fire DoPause() / DoStart() and cancel it.
    if (e.type !== 'keydown') return;

    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradePong();
      return;
    }
    if (['ArrowUp','ArrowDown','w','W','s','S'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
    }

    if (GS.status !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (GS.status === 'start' || GS.status === 'gameover') DoStart();
        else if (GS.status === 'paused') DoPause();
      }
    }
  }

  // Player paddle update, dt-scaled, runs from the game loop instead of a
  // 16ms setInterval. Honours `_playerSpeedMult` so a "fastOpp" effect from
  // the AI's side actually slows the player down.
  function UpdatePlayerPaddle(dt) {
    if (!GS || GS.status !== 'playing') return;
    const stepScale = dt / 16.6667;
    const mult = GS._playerSpeedMult || 1;
    // mult > 1 → opponent boosted *their* fastOpp effect → player paddle slows
    const speed = (GS.playerSpeed || 5) / mult * stepScale;
    if (_keysDown['ArrowUp']   || _keysDown['w'] || _keysDown['W']) GS.playerY -= speed;
    if (_keysDown['ArrowDown'] || _keysDown['s'] || _keysDown['S']) GS.playerY += speed;
    GS.playerY = Math.max(GS.playerH / 2, Math.min(CV - GS.playerH / 2, GS.playerY));
  }

  function AttachKeys() {
    document.addEventListener('keydown', OnKey, true);
    document.addEventListener('keyup', OnKey, true);
    window.addEventListener('blur', _ClearKeys);
  }
  function DetachKeys() {
    document.removeEventListener('keydown', OnKey, true);
    document.removeEventListener('keyup', OnKey, true);
    window.removeEventListener('blur', _ClearKeys);
    _ClearKeys();
  }
  function _ClearKeys() { _keysDown = {}; }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  /* FLOW */
  function DoStart() {
    StopLoop();
    GS = NewGameState(_lvlId);
    GS.status = 'playing';
    GS.lastTs = performance.now();
    LaunchBall(GS, false);
    ShowScreen(null);
    UpdateHUD();
    Draw();
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') {
      GS.status = 'paused'; StopLoop(); ShowScreen('gf-pos-pause');
    } else if (GS.status === 'paused') {
      GS.status = 'playing'; GS.lastTs = performance.now();
      ShowScreen(null); StartLoop();
    }
  }

  function ShowStartScreen() {
    StopLoop();
    GS = NewGameState(_lvlId);
    BuildLevelSelect();
    Draw();
    ShowScreen('gf-pos-start');
  }

  /* LEVEL SELECT */
  function BuildLevelSelect() {
    const el = document.getElementById('gf-po-lvl-sel');
    if (!el) return;
    const unlocked = LoadUnlock(), scores = LoadScores();
    const visLevels = unlocked >= 5 ? LEVELS : LEVELS.filter(l => !l.freePlay);
    el.innerHTML = visLevels.map(l => {
      const avail = l.freePlay ? unlocked >= 5 : (l.id === 1 || l.id <= unlocked + 1);
      const bestPts = scores[l.id] || 0;
      const nm = l.freePlay ? '∞' : `L${l.id}`;
      const desc = l.freePlay
        ? _GameText('po_freeplay_label')
        : (_GameText('po_first_to') || 'First to {n}').replace('{n}', l.winScore);
      const bestTxt = bestPts ? `${_GameText('game_best')}: ${bestPts}` : '–';
      return `<button class="gf-pol${avail ? '' : ' gf-pol-locked'}"
        data-lvl="${l.id}"${avail ? '' : ' disabled'}>
        <div class="gf-pol-left">
          <div class="gf-pol-badge${l.freePlay ? ' gf-pol-badge-fp' : ''}">${nm}</div>
          <div class="gf-pol-info">
            <span class="gf-pol-name">${l.labelKey ? _GameText(l.labelKey) : (l.label || '')}</span>
            <span class="gf-pol-tgt">${desc}</span>
          </div>
        </div>
        <div class="gf-pol-right">
          ${avail ? `<span class="gf-pol-best">${bestTxt}</span>` : '<span style="font-size:14px">🔒</span>'}
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

  /* THEME: content.js applies a page-wide invert filter in dark mode, so we
   * counter-invert the modal here to match Snake/Tetris/etc. */
  function ApplyTheme() {
    const el = document.getElementById('gf-po');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* BUILD OVERLAY */
  function BuildOverlay() {
    if (document.getElementById('gf-po')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-po';
    root.innerHTML = `
<div id="gf-po-modal">
  <div id="gf-po-hdr">
    <div class="gf-po-hl">
      <div id="gf-po-logo">GP</div>
      <span id="gf-po-title">GradePong</span>
      <span id="gf-po-badge">BETA</span>
    </div>
    <div class="gf-po-hr">
      <span id="gf-po-hint">F8</span>
      <button id="gf-po-pause-btn" title="Pause (Esc)">⏸</button>
      <button id="gf-po-close" title="Close (Esc)">✕</button>
    </div>
  </div>
  <div id="gf-po-body">
    <div id="gf-po-board">
      <div id="gf-po-hud-bar">
        <div class="gf-po-hud-side">
          <span class="gf-po-hud-label">${_GameText('po_you')}</span>
          <span id="gf-po-pscore" class="gf-po-hud-score" style="color:#4ade80">0</span>
        </div>
        <div id="gf-po-level" class="gf-po-hud-lvl">Lv 1</div>
        <div class="gf-po-hud-side">
          <span class="gf-po-hud-label">${_GameText('po_ai')}</span>
          <span id="gf-po-ascore" class="gf-po-hud-score" style="color:#f87171">0</span>
        </div>
      </div>
      <canvas id="gf-po-canvas" width="${CV}" height="${CV}"></canvas>
    </div>
    <div id="gf-po-sidebar">
      <div class="gf-pop">
        <div class="gf-pop-label">${_GameText('po_grade_effects')}</div>
        <div class="gf-po-eff-row"><span style="color:#4ade80">≥75%</span><span>${_GameText('po_big_paddle')}</span></div>
        <div class="gf-po-eff-row"><span style="color:#a3e635">50–74%</span><span>${_GameText('po_slow_ai')}</span></div>
        <div class="gf-po-eff-row"><span style="color:#f97316">25–49%</span><span>${_GameText('po_small_paddle')}</span></div>
        <div class="gf-po-eff-row"><span style="color:#f87171">&lt;25%</span><span>${_GameText('po_fast_ai')}</span></div>
      </div>
      <div class="gf-pop">
        <div class="gf-pop-label">${_GameText('po_controls')}</div>
        <div class="gf-po-ctrl-row"><kbd>↑ ↓</kbd><span>${_GameText('po_move')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>W / S</kbd><span>${_GameText('po_move')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>Esc</kbd><span>${_GameText('po_pause')}</span></div>
        <div class="gf-po-ctrl-row"><kbd>F8</kbd><span>${_GameText('po_boss')}</span></div>
      </div>
    </div>

    <div id="gf-pos-start" class="gf-pos" style="padding:16px 20px;justify-content:flex-start;gap:10px;">
      <div class="gf-pos-start-hdr">
        <div>
          <div class="gf-pos-logo" style="font-size:22px;margin-bottom:2px;">${_GameText('po_title')}</div>
          <div class="gf-pos-sub">${_GameText('po_subtitle')}</div>
        </div>
      </div>
      <div id="gf-po-lvl-sel" class="gf-po-lvls"></div>
      <div class="gf-pos-effects">
        <span style="color:#4ade80">≥75% ${_GameText('po_big_paddle')}</span>
        <span style="color:#a3e635">50% ${_GameText('po_slow_ai')}</span>
        <span style="color:#f97316">25% ${_GameText('po_small_paddle')}</span>
        <span style="color:#f87171">&lt;25% ${_GameText('po_fast_ai')}</span>
      </div>
      <div class="gf-pos-footer">${_GameText('po_move')} · ${_GameText('po_pause')}</div>
    </div>

    <div id="gf-pos-pause" class="gf-pos" style="display:none">
      <div class="gf-pos-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
      <button class="gf-po-btn" id="gf-po-resume">▶&nbsp; ${_GameText('game_resume')}</button>
    </div>

    <div id="gf-pos-gameover" class="gf-pos" style="display:none">
      <div class="gf-pos-go-title">${_GameText('game_gameover')}</div>
      <div id="gf-po-go-score" class="gf-pos-stat"></div>
      <button class="gf-po-btn" id="gf-po-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
      <button class="gf-po-btn gf-po-btn-sec" id="gf-po-back-go">← ${_GameText('po_grade_effects') ? 'Levels' : 'Levels'}</button>
    </div>

    <div id="gf-pos-win" class="gf-pos" style="display:none">
      <div id="gf-po-win-title" class="gf-pos-win-title">Level Clear!</div>
      <div id="gf-po-win-score" class="gf-pos-stat" style="color:#4ade80;font-weight:700;font-size:18px"></div>
      <button class="gf-po-btn" id="gf-po-next">→&nbsp; Next Level</button>
      <button class="gf-po-btn gf-po-btn-sec" id="gf-po-free-btn" style="display:none">∞&nbsp; Free Play</button>
      <button class="gf-po-btn gf-po-btn-sec" id="gf-po-back-win">← Levels</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-po-close')     ?.addEventListener('click', CloseGradePong);
    document.getElementById('gf-po-pause-btn') ?.addEventListener('click', DoPause);
    document.getElementById('gf-po-resume')    ?.addEventListener('click', DoPause);
    document.getElementById('gf-po-retry')     ?.addEventListener('click', DoStart);
    document.getElementById('gf-po-back-go')   ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-po-back-win')  ?.addEventListener('click', ShowStartScreen);
    document.getElementById('gf-po-next')      ?.addEventListener('click', () => { _lvlId = Math.min(_lvlId + 1, 5); DoStart(); });
    document.getElementById('gf-po-free-btn')  ?.addEventListener('click', () => { _lvlId = 6; DoStart(); });
    document.getElementById('gf-po')           ?.addEventListener('click', e => {
      if (e.target.id !== 'gf-po') return;
      if (GS?.status === 'playing' || GS?.status === 'paused') BossKeyPong();
      else CloseGradePong();
    });

    // Touch support on canvas
    const cv = document.getElementById('gf-po-canvas');
    if (cv) {
      cv.addEventListener('touchmove', e => {
        if (!GS || GS.status !== 'playing' || !e.touches.length) return;
        const rect = cv.getBoundingClientRect();
        const ty = (e.touches[0].clientY - rect.top) * (CV / rect.height);
        GS.playerY = Math.max(GS.playerH / 2, Math.min(CV - GS.playerH / 2, ty));
      }, { passive: true });
      cv.addEventListener('mousemove', e => {
        if (!GS || GS.status !== 'playing') return;
        const rect = cv.getBoundingClientRect();
        const my = (e.clientY - rect.top) * (CV / rect.height);
        GS.playerY = Math.max(GS.playerH / 2, Math.min(CV - GS.playerH / 2, my));
      });
    }
  }

  /* PUBLIC API */
  function OpenGradePong(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-po')) BuildOverlay();
    document.getElementById('gf-po').style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStartScreen();
  }

  function CloseGradePong() {
    const el = document.getElementById('gf-po');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys();
    _tobs.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function ToggleGradePong(grades) {
    const el = document.getElementById('gf-po');
    if (el && el.style.display !== 'none') CloseGradePong(); else OpenGradePong(grades);
  }

  function BossKeyPong() {
    const el = document.getElementById('gf-po');
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

  W.OpenGradePong   = OpenGradePong;
  W.CloseGradePong  = CloseGradePong;
  W.ToggleGradePong = ToggleGradePong;
  W.BossKeyPong     = BossKeyPong;

  /* CSS */
  function InjectCSS() {
    if (document.getElementById('gf-pong-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-pong-css';
    s.textContent = `
#gf-po {
  --po-modal:#ffffff;--po-hdr:#f5f5f5;--po-hud:#fafafa;--po-scr:rgba(248,248,248,0.96);
  --po-brd:rgba(74,222,128,0.22);--po-brd2:#e0e0e0;--po-btn-brd:#d0d0d0;
  --po-txt:#111;--po-txt2:#555;--po-txt3:#999;--po-kbd:#eee;--po-kbd-brd:#ccc;
  --po-scroll:#d0d0d0;--po-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-po[data-theme="dark"] {
  --po-modal:rgba(13,13,13,0.97);--po-hdr:rgba(8,8,8,0.95);--po-hud:rgba(10,10,10,0.98);
  --po-scr:rgba(6,6,6,0.94);--po-brd:rgba(74,222,128,0.18);--po-brd2:#1c1c1c;
  --po-btn-brd:#333;--po-txt:#f5f5f5;--po-txt2:#aaa;--po-txt3:#555;
  --po-kbd:#1e1e1e;--po-kbd-brd:#333;--po-scroll:#2a2a2a;
  --po-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-po{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-po-modal{position:relative;display:flex;flex-direction:column;background:var(--po-modal);border:1px solid var(--po-brd);border-radius:12px;box-shadow:var(--po-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-po-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--po-hdr);border-bottom:1px solid var(--po-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-po-hl{display:flex;align-items:center;gap:8px;} .gf-po-hr{display:flex;align-items:center;gap:6px;}
#gf-po-logo{width:26px;height:26px;background:#4ade80;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#111;letter-spacing:-1px;flex-shrink:0;}
#gf-po-title{font-size:14px;font-weight:700;color:var(--po-txt);letter-spacing:-0.3px;}
#gf-po-badge{font-size:8px;font-weight:600;color:#4ade80;border:1px solid rgba(74,222,128,0.4);border-radius:4px;padding:2px 5px;letter-spacing:1px;}
#gf-po-hint{font-size:9px;color:var(--po-txt3);}
#gf-po-pause-btn,#gf-po-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--po-btn-brd);border-radius:6px;background:transparent;color:var(--po-txt3);cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;transition:border-color .13s,color .13s,background .13s;}
#gf-po-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-po-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-po-body{display:flex;position:relative;overflow:hidden;}
#gf-po-board{flex-shrink:0;border-right:1px solid var(--po-brd);display:flex;flex-direction:column;}
#gf-po-hud-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:var(--po-hdr);border-bottom:1px solid var(--po-brd);user-select:none;}
.gf-po-hud-side{display:flex;align-items:center;gap:6px;}
.gf-po-hud-label{font-size:8px;font-weight:600;letter-spacing:1.5px;color:var(--po-txt3);text-transform:uppercase;}
.gf-po-hud-score{font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1;}
.gf-po-hud-lvl{font-size:10px;font-weight:700;color:var(--po-txt2);letter-spacing:0.5px;}
#gf-po-canvas{display:block;width:${CV}px;height:${CV}px;cursor:none;}
#gf-po-sidebar{width:148px;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto;background:var(--po-hud);}
#gf-po-sidebar::-webkit-scrollbar{width:3px;} #gf-po-sidebar::-webkit-scrollbar-thumb{background:var(--po-scroll);border-radius:99px;}
.gf-pop{padding:8px 10px;border-bottom:1px solid var(--po-brd2);flex-shrink:0;} .gf-pop:last-child{border-bottom:none;}
.gf-pop-label{font-size:8px;font-weight:600;letter-spacing:1.5px;color:var(--po-txt3);text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.gf-pop-label::before{content:'•';color:#4ade80;font-size:11px;line-height:1;}
.gf-po-eff-row{display:flex;justify-content:space-between;font-size:9px;padding:2px 0;} .gf-po-eff-row span:last-child{color:var(--po-txt3);}
.gf-po-ctrl-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.gf-po-ctrl-row kbd{display:inline-block;padding:1px 4px;font-family:inherit;font-size:7px;font-weight:600;background:var(--po-kbd);border:1px solid var(--po-kbd-brd);border-radius:3px;color:var(--po-txt2);min-width:30px;text-align:center;flex-shrink:0;}
.gf-po-ctrl-row span{font-size:8px;color:var(--po-txt3);}
.gf-po-hint-txt{font-size:9px;color:var(--po-txt3);line-height:1.5;}
.gf-pos{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;background:var(--po-scr);padding:24px;}
.gf-pos-logo{font-size:28px;font-weight:700;color:#4ade80;letter-spacing:-1px;text-shadow:0 0 50px rgba(74,222,128,0.5);}
.gf-pos-sub{font-size:12px;color:var(--po-txt2);letter-spacing:0.5px;} .gf-pos-footer{font-size:8px;color:var(--po-txt3);text-align:center;}
.gf-pos-stat{font-size:22px;color:var(--po-txt);font-weight:800;letter-spacing:1px;margin:4px 0;}
.gf-pos-go-title{font-size:28px;font-weight:700;color:#f87171;letter-spacing:5px;text-shadow:0 0 35px rgba(248,113,113,0.5);}
.gf-pos-win-title{font-size:24px;font-weight:700;color:#4ade80;letter-spacing:2px;text-shadow:0 0 40px rgba(74,222,128,0.55);}
.gf-po-btn{padding:9px 24px;border:1px solid #4ade80;border-radius:7px;background:rgba(74,222,128,0.10);color:#4ade80;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;transition:background .14s,box-shadow .14s,transform .14s;}
.gf-po-btn:hover{background:rgba(74,222,128,0.22);box-shadow:0 4px 20px rgba(74,222,128,0.28);transform:translateY(-1px);}
.gf-po-btn-sec{border-color:var(--po-btn-brd);color:var(--po-txt2);background:transparent;}
.gf-po-btn-sec:hover{background:rgba(128,128,128,0.10);box-shadow:none;}
.gf-pos-start-hdr{display:flex;justify-content:space-between;align-items:flex-start;width:100%;gap:10px;}
.gf-pos-effects{display:flex;gap:8px;font-size:8px;font-weight:600;color:var(--po-txt3);flex-wrap:wrap;justify-content:center;}
.gf-po-lvls{display:flex;flex-direction:column;gap:5px;width:100%;}
.gf-pol{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--po-brd2);border-radius:9px;background:var(--po-hud);color:var(--po-txt);cursor:pointer;font-family:inherit;width:100%;text-align:left;transition:border-color .13s,background .13s,transform .1s;}
.gf-pol:hover:not(:disabled){border-color:#4ade80;background:rgba(74,222,128,0.07);transform:translateX(2px);}
.gf-pol-locked{opacity:0.4;} .gf-pol:disabled{cursor:default;}
.gf-pol-left{display:flex;align-items:center;gap:10px;}
.gf-pol-badge{width:30px;height:30px;border-radius:7px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#4ade80;flex-shrink:0;}
.gf-pol-badge-fp{background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.3);color:#a78bfa;}
.gf-pol-info{display:flex;flex-direction:column;gap:1px;}
.gf-pol-name{font-size:12px;font-weight:700;color:var(--po-txt);}
.gf-pol-tgt{font-size:9px;color:var(--po-txt3);font-weight:400;}
.gf-pol-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;}
.gf-pol-best{font-size:8px;color:var(--po-txt3);white-space:nowrap;}
`;
    document.head.appendChild(s);
  }

})(window);
