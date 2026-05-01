;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 480;
  const CV_H = 360;
  const CELL = 30;
  const COLS = CV_W / CELL;       // 16
  const ROWS = CV_H / CELL;       // 12
  const START_LIVES = 20;

  // S-shaped path through the grid (cells). End is rightmost row.
  const PATH = [
    {x:0,y:2},{x:1,y:2},{x:2,y:2},{x:3,y:2},{x:4,y:2},{x:5,y:2},
    {x:5,y:3},{x:5,y:4},{x:5,y:5},
    {x:6,y:5},{x:7,y:5},{x:8,y:5},{x:9,y:5},{x:10,y:5},
    {x:10,y:6},{x:10,y:7},{x:10,y:8},
    {x:9,y:8},{x:8,y:8},{x:7,y:8},{x:6,y:8},{x:5,y:8},{x:4,y:8},{x:3,y:8},
    {x:3,y:9},{x:3,y:10},
    {x:4,y:10},{x:5,y:10},{x:6,y:10},{x:7,y:10},{x:8,y:10},
    {x:9,y:10},{x:10,y:10},{x:11,y:10},{x:12,y:10},{x:13,y:10},{x:14,y:10},{x:15,y:10},
  ];

  const PATH_KEY_SET = new Set(PATH.map(c => `${c.x},${c.y}`));

  const DIFFICULTIES = [
    { id: 1, key: 'td_diff_easy',   waves: 8,  hpMul: 0.85, spdMul: 0.90, money: 320, lives: 25, intervalMul: 1.20 },
    { id: 2, key: 'td_diff_normal', waves: 12, hpMul: 1.00, spdMul: 1.00, money: 250, lives: 20, intervalMul: 1.00 },
    { id: 3, key: 'td_diff_hard',   waves: 16, hpMul: 1.30, spdMul: 1.10, money: 200, lives: 15, intervalMul: 0.85 },
    { id: 4, key: 'td_diff_expert', waves: 22, hpMul: 1.65, spdMul: 1.22, money: 170, lives: 10, intervalMul: 0.70 },
  ];

  // Tower archetypes, values unlocked by grade %
  const TOWER_DEFS = [
    { id: 'rapid', minPct:  0,  cost: 50,  range: 90,  damage: 6,   fireMs: 280, color: '#22d3ee', label: 'R', name: 'td_tower_rapid' },
    { id: 'sniper', minPct: 50, cost: 90,  range: 170, damage: 22,  fireMs: 900, color: '#a3e635', label: 'S', name: 'td_tower_sniper' },
    { id: 'cannon', minPct: 65, cost: 110, range: 80,  damage: 14,  fireMs: 700, color: '#f97316', label: 'C', name: 'td_tower_cannon', splash: 28 },
    { id: 'elite',  minPct: 80, cost: 150, range: 110, damage: 34,  fireMs: 600, color: '#4ade80', label: 'E', name: 'td_tower_elite'  },
  ];

  const LS_BEST = 'gf-tower-best';

  /* ── Storage / grades ─────────────────────────────────────── */
  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest()  { return StorageGet(LS_BEST, {}); }
  function SaveBest(diffId, wave) {
    const all = LoadBest();
    if (wave > (all[diffId] || 0)) { all[diffId] = wave; StorageSet(LS_BEST, all); }
  }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde','Nederlands','Frans','Wetenschappen','Geschiedenis','Engels','Sport','Latijn','Economie','Chemie'];
    return Array.from({ length: 28 }, (_, i) => {
      const p = 20 + Math.random() * 80;
      return { subject: N[i % N.length], Pct: +p.toFixed(1), label: `${+(p / 5).toFixed(1)}/20` };
    });
  }
  function GradeColor(Pct) {
    if (Pct == null) return '#a78bfa';
    if (Pct >= 75) return '#4ade80';
    if (Pct >= 50) return '#a3e635';
    if (Pct >= 25) return '#f97316';
    return '#f87171';
  }

  /* ── State ───────────────────────────────────────────────── */
  let GS = null, _grades = [], _raf = null, _kh = null, _tobs = null;
  let _diffId = 2;

  function HighestPct() {
    if (!_grades.length) return 100;
    const list = _grades.length ? _grades : FallbackGrades();
    let m = 0;
    for (const g of list) if ((g.Pct ?? 0) > m) m = g.Pct ?? 0;
    return m;
  }

  function NewGameState(diffId) {
    const d = DIFFICULTIES.find(x => x.id === diffId) || DIFFICULTIES[1];
    return {
      status: 'start',
      diff: d,
      money: d.money,
      lives: d.lives,
      maxLives: d.lives,
      wave: 0,
      enemies: [],
      towers: [],
      bullets: [],
      effects: [],
      waveActive: false,
      waveQueue: [],
      spawnTimer: 0,
      score: 0,
      selectedTower: null,
      hoverCell: null,
      placePreview: null,        // { tDef, x, y } when player picked a tower in toolbar
      betweenWaves: 2500,         // ms before next wave button or auto-start
      autoNextTimer: 0,
      lastTs: 0,
      _shake: 0,
    };
  }

  function CellToPx(c) { return { x: c.x * CELL + CELL / 2, y: c.y * CELL + CELL / 2 }; }

  function MakeWave(waveIdx, diff) {
    // Difficulty-scaled enemy roster
    const list = [];
    const total = 6 + Math.floor(waveIdx * 1.6);
    const eliteEvery = 5;
    for (let i = 0; i < total; i++) {
      const isElite = (i % eliteEvery) === eliteEvery - 1 && waveIdx >= 2;
      const isFast  = !isElite && waveIdx >= 3 && Math.random() < 0.30;
      const baseHp = 28 + waveIdx * 12;
      list.push({
        kind: isElite ? 'elite' : isFast ? 'fast' : 'basic',
        hp:   Math.round(baseHp * diff.hpMul * (isElite ? 3.2 : isFast ? 0.7 : 1)),
        speed: 0.04 * diff.spdMul * (isElite ? 0.75 : isFast ? 1.7 : 1),  // px/ms along path
        bounty: isElite ? 28 : isFast ? 9 : 12,
        damage: isElite ? 3 : 1,
      });
    }
    return list;
  }

  function StartWave() {
    if (!GS || GS.waveActive) return;
    if (GS.wave >= GS.diff.waves) { Win(); return; }
    GS.wave++;
    GS.waveActive = true;
    GS.waveQueue = MakeWave(GS.wave - 1, GS.diff);
    const interval = (700 - GS.wave * 18) * GS.diff.intervalMul;
    GS.spawnTimer = 0;
    GS._spawnInterval = Math.max(220, interval);
  }

  /* ── Update ──────────────────────────────────────────────── */
  function Update(dt) {
    if (!GS || GS.status !== 'playing') return;

    // Wave spawn
    if (GS.waveActive && GS.waveQueue.length) {
      GS.spawnTimer += dt;
      if (GS.spawnTimer >= GS._spawnInterval) {
        GS.spawnTimer = 0;
        const t = GS.waveQueue.shift();
        const start = CellToPx(PATH[0]);
        GS.enemies.push({
          ...t, maxHp: t.hp,
          x: start.x, y: start.y,
          pathIdx: 0,
          pathT: 0,
        });
      }
    } else if (GS.waveActive && !GS.waveQueue.length && GS.enemies.length === 0) {
      // Wave cleared
      GS.waveActive = false;
      const reward = 20 + GS.wave * 4;
      GS.money += reward;
      GS.score += reward * 4;
      GS.autoNextTimer = GS.betweenWaves;
      if (GS.wave >= GS.diff.waves) { Win(); return; }
    }

    // Auto-start next wave between rounds
    if (!GS.waveActive && GS.autoNextTimer > 0) {
      GS.autoNextTimer -= dt;
      if (GS.autoNextTimer <= 0) StartWave();
    }

    // Enemies follow path
    for (const e of GS.enemies) {
      const cur = PATH[e.pathIdx];
      const next = PATH[e.pathIdx + 1];
      if (!next) {
        // reached end
        GS.lives -= e.damage;
        e.dead = true;
        GS._shake = 220;
        if (GS.lives <= 0) { Lose(); return; }
        continue;
      }
      const fromPx = CellToPx(cur);
      const toPx   = CellToPx(next);
      const dx = toPx.x - fromPx.x, dy = toPx.y - fromPx.y;
      const len = Math.hypot(dx, dy) || 1;
      e.pathT += (e.speed * dt) / len;
      while (e.pathT >= 1 && e.pathIdx + 1 < PATH.length) {
        e.pathT -= 1; e.pathIdx++;
      }
      const c = PATH[e.pathIdx];
      const n = PATH[e.pathIdx + 1];
      if (!n) { e.x = toPx.x; e.y = toPx.y; continue; }
      const a = CellToPx(c), b = CellToPx(n);
      e.x = a.x + (b.x - a.x) * e.pathT;
      e.y = a.y + (b.y - a.y) * e.pathT;
    }
    GS.enemies = GS.enemies.filter(e => !e.dead);

    // Towers shoot
    for (const tw of GS.towers) {
      tw.cooldown = Math.max(0, (tw.cooldown || 0) - dt);
      if (tw.cooldown > 0) continue;
      // Find nearest enemy in range
      let bestEnemy = null, bestD = Infinity;
      for (const e of GS.enemies) {
        const dx = e.x - tw.x, dy = e.y - tw.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= tw.range * tw.range && d2 < bestD) { bestD = d2; bestEnemy = e; }
      }
      if (bestEnemy) {
        GS.bullets.push({
          x: tw.x, y: tw.y, target: bestEnemy,
          damage: tw.damage, splash: tw.splash || 0,
          color: tw.color, speed: 0.42, dead: false,
        });
        tw.cooldown = tw.fireMs;
      }
    }

    // Bullets
    for (const b of GS.bullets) {
      const t = b.target;
      if (!t || t.dead || t.hp <= 0) { b.dead = true; continue; }
      const dx = t.x - b.x, dy = t.y - b.y;
      const dist = Math.hypot(dx, dy);
      const move = b.speed * dt;
      if (move >= dist) {
        // Hit
        if (b.splash > 0) {
          for (const e of GS.enemies) {
            const ex = e.x - t.x, ey = e.y - t.y;
            if (ex * ex + ey * ey <= b.splash * b.splash) {
              e.hp -= b.damage * (e === t ? 1 : 0.55);
              if (e.hp <= 0 && !e.dead) { e.dead = true; GS.money += e.bounty; GS.score += e.bounty * 6; }
            }
          }
          GS.effects.push({ kind: 'splash', x: t.x, y: t.y, r: b.splash, t: 0, color: b.color });
        } else {
          t.hp -= b.damage;
          if (t.hp <= 0 && !t.dead) { t.dead = true; GS.money += t.bounty; GS.score += t.bounty * 6; }
        }
        GS.effects.push({ kind: 'hit', x: t.x, y: t.y, t: 0, color: b.color });
        b.dead = true;
      } else {
        b.x += (dx / dist) * move;
        b.y += (dy / dist) * move;
      }
    }
    GS.bullets = GS.bullets.filter(b => !b.dead);
    GS.enemies = GS.enemies.filter(e => !e.dead);

    // Effects
    for (const fx of GS.effects) fx.t += dt;
    GS.effects = GS.effects.filter(fx => fx.t < (fx.kind === 'splash' ? 380 : 240));

    if (GS._shake > 0) GS._shake = Math.max(0, GS._shake - dt);
  }

  function Win() {
    GS.status = 'win';
    SaveBest(GS.diff.id, GS.wave);
    StopLoop();
    SetText('gf-tw-win-stat', `${_GameText('td_wave')}: ${GS.wave}/${GS.diff.waves}  •  ${_GameText('game_score')}: ${GS.score}`);
    ShowScreen('gf-tw-win');
  }
  function Lose() {
    GS.status = 'gameover';
    SaveBest(GS.diff.id, GS.wave - 1);
    StopLoop();
    SetText('gf-tw-go-stat', `${_GameText('td_wave')}: ${GS.wave}/${GS.diff.waves}  •  ${_GameText('game_score')}: ${GS.score}`);
    ShowScreen('gf-tw-go');
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function Draw() {
    const cv = document.getElementById('gf-tw-canvas');
    if (!cv || !GS) return;
    const ctx = cv.getContext('2d');
    const dark = document.getElementById('gf-tw')?.dataset.theme === 'dark';

    const sx = GS._shake > 0 ? (Math.random() - 0.5) * 4 * (GS._shake / 220) : 0;
    const sy = GS._shake > 0 ? (Math.random() - 0.5) * 4 * (GS._shake / 220) : 0;
    ctx.save(); ctx.translate(sx, sy);

    // Background
    ctx.fillStyle = dark ? '#0a0e15' : '#e8efe5';
    ctx.fillRect(0, 0, CV_W, CV_H);

    // Grid
    ctx.strokeStyle = dark ? '#161b24' : '#d4dcd0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, CV_H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(CV_W, y * CELL); ctx.stroke(); }

    // Path
    ctx.fillStyle = dark ? '#1f2a3a' : '#c8b889';
    for (const c of PATH) ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
    // path overlay
    ctx.strokeStyle = dark ? 'rgba(180,180,180,0.18)' : 'rgba(80,60,40,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    const start = CellToPx(PATH[0]); ctx.moveTo(start.x, start.y);
    for (let i = 1; i < PATH.length; i++) { const p = CellToPx(PATH[i]); ctx.lineTo(p.x, p.y); }
    ctx.stroke();
    ctx.setLineDash([]);

    // Hover preview / range
    if (GS.placePreview && GS.hoverCell) {
      const c = GS.hoverCell;
      const cx = c.x * CELL + CELL / 2, cy = c.y * CELL + CELL / 2;
      const def = GS.placePreview.tDef;
      const state = GetPlacementState(c.x, c.y, def);
      const previewColor = state.ok ? def.color : '#f87171';
      ctx.fillStyle = previewColor + (state.ok ? '33' : '42');
      ctx.fillRect(c.x * CELL, c.y * CELL, CELL, CELL);
      ctx.strokeStyle = previewColor + 'dd';
      ctx.lineWidth = state.ok ? 1.5 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, def.range, 0, Math.PI * 2); ctx.stroke();
      if (!state.ok) {
        ctx.fillStyle = previewColor;
        ctx.font = '800 14px "IBM Plex Mono",monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('!', cx, cy);
      }
    }

    // Towers
    for (const tw of GS.towers) {
      const cx = tw.x, cy = tw.y;
      // base
      ctx.fillStyle = dark ? '#1f2937' : '#37474f';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2); ctx.fill();
      // body
      ctx.fillStyle = tw.color;
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.32, 0, Math.PI * 2); ctx.fill();
      // letter
      ctx.fillStyle = '#0a0a0a';
      ctx.font = '700 12px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tw.label, cx, cy);
      // range when selected
      if (GS.selectedTower === tw) {
        ctx.strokeStyle = tw.color + 'aa';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, tw.range, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffffcc';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.46, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Bullets
    for (const b of GS.bullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.color + '55';
      ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
    }

    // Enemies
    for (const e of GS.enemies) {
      const r = e.kind === 'elite' ? 11 : e.kind === 'fast' ? 7 : 9;
      const col = e.kind === 'elite' ? '#a78bfa' : e.kind === 'fast' ? '#fbbf24' : '#f87171';
      // body
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
      ctx.stroke();
      // hp bar
      const w = r * 2 + 4, h = 3;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(e.x - w / 2, e.y - r - 7, w, h);
      ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#4ade80' : e.hp / e.maxHp > 0.25 ? '#fbbf24' : '#f87171';
      ctx.fillRect(e.x - w / 2, e.y - r - 7, w * Math.max(0, e.hp / e.maxHp), h);
    }

    // Effects
    for (const fx of GS.effects) {
      if (fx.kind === 'hit') {
        const a = 1 - fx.t / 240;
        ctx.globalAlpha = a;
        ctx.fillStyle = fx.color;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, 6 + fx.t * 0.04, 0, Math.PI * 2); ctx.fill();
      } else if (fx.kind === 'splash') {
        const a = 1 - fx.t / 380;
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = fx.color;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = a;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Update HUD
    SetText('gf-tw-money', GS.money);
    SetText('gf-tw-lives', `${GS.lives}/${GS.maxLives}`);
    SetText('gf-tw-wave', `${GS.wave}/${GS.diff.waves}`);
    SetText('gf-tw-score', GS.score);
    const startBtn = document.getElementById('gf-tw-startwave');
    if (startBtn) {
      if (!GS.waveActive && GS.wave < GS.diff.waves) {
        startBtn.style.display = 'flex';
        startBtn.textContent = `▶ ${_GameText('td_start_wave')} ${GS.wave + 1}`;
      } else {
        startBtn.style.display = 'none';
      }
    }
    const deleteBtn = document.getElementById('gf-tw-delete');
    const deleteLabel = document.getElementById('gf-tw-delete-label');
    if (deleteBtn) deleteBtn.disabled = !GS.selectedTower;
    if (deleteLabel) {
      deleteLabel.textContent = GS.selectedTower
        ? `${_GameText('td_delete_tower')} (+${SellValue(GS.selectedTower)}c)`
        : _GameText('td_delete_tower');
    }
    UpdateToolbarHighlight();
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
  const SCREENS = ['gf-tw-start', 'gf-tw-pause', 'gf-tw-go', 'gf-tw-win'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    StopLoop();
    GS = NewGameState(_diffId);
    RenderDiffPicker();
    Draw();
    ShowScreen('gf-tw-start');
  }

  function DoStart() {
    StopLoop();
    GS = NewGameState(_diffId);
    GS.status = 'playing';
    GS.lastTs = performance.now();
    GS.autoNextTimer = 1500;        // start first wave shortly after
    ShowScreen(null);
    StartLoop();
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; StopLoop(); ShowScreen('gf-tw-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; GS.lastTs = performance.now(); ShowScreen(null); StartLoop(); }
  }

  /* ── Tower placement ─────────────────────────────────────── */
  function GetPlacementState(cellX, cellY, def) {
    if (!def) return { ok: false, reason: 'none' };
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return { ok: false, reason: 'bounds' };
    if (PATH_KEY_SET.has(`${cellX},${cellY}`)) return { ok: false, reason: 'path' };
    if (GS.towers.some(t => t.cellX === cellX && t.cellY === cellY)) return { ok: false, reason: 'occupied' };
    if (HighestPct() < def.minPct) return { ok: false, reason: 'locked' };
    if (GS.money < def.cost) return { ok: false, reason: 'money' };
    return { ok: true, reason: 'ok' };
  }
  function PickTower(defId) {
    const def = TOWER_DEFS.find(t => t.id === defId);
    if (!def) return;
    if (GS.placePreview?.tDef?.id === defId) {
      CancelPlacement();
      return;
    }
    GS.placePreview = { tDef: def };
    GS.selectedTower = null;
    UpdateToolbarHighlight();
  }
  function CancelPlacement() { GS.placePreview = null; UpdateToolbarHighlight(); }
  function UpdateToolbarHighlight() {
    document.querySelectorAll('.gf-tw-tool').forEach(el => {
      const def = TOWER_DEFS.find(t => t.id === el.dataset.tower);
      el.classList.toggle('gf-tw-tool-on', GS.placePreview?.tDef?.id === el.dataset.tower);
      el.classList.toggle('gf-tw-tool-low-money', !!def && GS.money < def.cost);
      el.classList.toggle('gf-tw-tool-locked', !!def && HighestPct() < def.minPct);
    });
  }
  function SellValue(tower) { return Math.floor((tower?.cost || 0) * 0.7); }
  function DeleteSelectedTower() {
    if (!GS?.selectedTower) return;
    const idx = GS.towers.indexOf(GS.selectedTower);
    if (idx < 0) { GS.selectedTower = null; return; }
    const [tower] = GS.towers.splice(idx, 1);
    GS.money += SellValue(tower);
    GS.selectedTower = null;
    UpdateToolbarHighlight();
    Draw();
  }
  function PlaceAt(cellX, cellY) {
    if (!GS.placePreview) return false;
    const def = GS.placePreview.tDef;
    if (!GetPlacementState(cellX, cellY, def).ok) return false;
    const pos = CellToPx({ x: cellX, y: cellY });
    const tower = {
      ...def,
      cellX, cellY, x: pos.x, y: pos.y, cooldown: 0,
    };
    GS.towers.push(tower);
    GS.selectedTower = tower;
    GS.money -= def.cost;
    return true;
  }

  /* ── Input ───────────────────────────────────────────────── */
  function CanvasMouse(e) {
    const cv = document.getElementById('gf-tw-canvas');
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const sx = cv.width  / r.width;
    const sy = cv.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  function OnCanvasMove(e) {
    if (!GS || GS.status !== 'playing') return;
    const m = CanvasMouse(e); if (!m) return;
    GS.hoverCell = { x: 0 | (m.x / CELL), y: 0 | (m.y / CELL) };
  }
  function OnCanvasLeave() { if (GS) GS.hoverCell = null; }
  function OnCanvasClick(e) {
    if (!GS || GS.status !== 'playing') return;
    const m = CanvasMouse(e); if (!m) return;
    const cx = 0 | (m.x / CELL), cy = 0 | (m.y / CELL);
    const tw = GS.towers.find(t => t.cellX === cx && t.cellY === cy);
    if (tw) {
      GS.selectedTower = tw;
      Draw();
      return;
    }
    if (GS.placePreview) {
      PlaceAt(cx, cy);
      UpdateToolbarHighlight();
    } else {
      GS.selectedTower = null;
    }
  }

  function OnCanvasContext(e) {
    if (!GS || GS.status !== 'playing') return;
    e.preventDefault();
    const m = CanvasMouse(e); if (!m) return;
    const cx = 0 | (m.x / CELL), cy = 0 | (m.y / CELL);
    const tw = GS.towers.find(t => t.cellX === cx && t.cellY === cy);
    if (!tw) return;
    GS.selectedTower = tw;
    DeleteSelectedTower();
  }

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-tw')) return;
    if (e.type !== 'keydown') return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.placePreview) { CancelPlacement(); return; }
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeTower();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (GS.status === 'playing' && !GS.waveActive) { e.preventDefault(); StartWave(); }
      else if (GS.status === 'gameover' || GS.status === 'win' || GS.status === 'start') { e.preventDefault(); DoStart(); }
      return;
    }
    if (['1','2','3','4'].includes(e.key)) {
      const def = TOWER_DEFS[parseInt(e.key) - 1];
      if (def) PickTower(def.id);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (GS.selectedTower) { e.preventDefault(); DeleteSelectedTower(); }
    }
  }

  function AttachKeys()  { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); }
  function DetachKeys()  { if (_kh) { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  /* ── Theme ───────────────────────────────────────────────── */
  function ApplyTheme() {
    const el = document.getElementById('gf-tw');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
  }

  /* ── Build ───────────────────────────────────────────────── */
  function RenderDiffPicker() {
    const el = document.getElementById('gf-tw-diffs');
    if (!el) return;
    const bests = LoadBest();
    el.innerHTML = DIFFICULTIES.map(d => {
      const best = bests[d.id] || 0;
      const sel = d.id === _diffId ? ' gf-twd-sel' : '';
      return `<button class="gf-twd${sel}" data-diff="${d.id}">
        <div class="gf-twd-row">
          <span class="gf-twd-name">${_GameText(d.key)}</span>
          <span class="gf-twd-meta">${d.waves} ${_GameText('td_waves_short')} · ${d.lives} ♥</span>
        </div>
        <span class="gf-twd-best">${best ? _GameText('game_best') + ': W' + best : '–'}</span>
      </button>`;
    }).join('');
    el.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        _diffId = parseInt(btn.dataset.diff);
        RenderDiffPicker();
      });
    });
  }

  function BuildOverlay() {
    if (document.getElementById('gf-tw')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-tw';
    const toolbar = TOWER_DEFS.map((t, i) => `
      <button class="gf-tw-tool" data-tower="${t.id}" title="${_GameText(t.name)} - ${t.cost}">
        <div class="gf-tw-tool-icon" style="background:${t.color};">${t.label}</div>
        <div class="gf-tw-tool-info">
          <div class="gf-tw-tool-name">${_GameText(t.name)}</div>
          <div class="gf-tw-tool-cost">${t.cost}c · &ge;${t.minPct}%</div>
        </div>
        <div class="gf-tw-tool-key">${i + 1}</div>
      </button>`).join('');

    root.innerHTML = `
<div id="gf-tw-modal">
  <div id="gf-tw-hdr">
    <div class="gf-tw-hl">
      <div id="gf-tw-logo">GT</div>
      <span id="gf-tw-title">${_GameText('tw_title')}</span>
      <span id="gf-tw-badge">BETA</span>
    </div>
    <div class="gf-tw-hr">
      <button id="gf-tw-pause-btn" title="Pause (Esc)">⏸</button>
      <button id="gf-tw-close" title="Close (Esc)">✕</button>
    </div>
  </div>
  <div id="gf-tw-body">
    <div id="gf-tw-stage">
      <div id="gf-tw-hud">
        <div class="gf-twh-cell"><span class="gf-twh-lbl">${_GameText('td_money')}</span><span class="gf-twh-val" id="gf-tw-money">0</span></div>
        <div class="gf-twh-cell"><span class="gf-twh-lbl">${_GameText('td_lives')}</span><span class="gf-twh-val" id="gf-tw-lives">0/0</span></div>
        <div class="gf-twh-cell"><span class="gf-twh-lbl">${_GameText('td_wave')}</span><span class="gf-twh-val" id="gf-tw-wave">0/0</span></div>
        <div class="gf-twh-cell"><span class="gf-twh-lbl">${_GameText('game_score').toUpperCase()}</span><span class="gf-twh-val" id="gf-tw-score">0</span></div>
      </div>
      <canvas id="gf-tw-canvas" width="${CV_W}" height="${CV_H}"></canvas>
      <button id="gf-tw-startwave" style="display:none">▶ ${_GameText('td_start_wave')}</button>

      <div id="gf-tw-start" class="gf-tw-scr">
        <div class="gf-tw-scr-logo">${_GameText('tw_title')}</div>
        <div class="gf-tw-scr-sub">${_GameText('tw_subtitle')}</div>
        <div class="gf-tw-scr-label">${_GameText('td_difficulty')}</div>
        <div id="gf-tw-diffs" class="gf-tw-diffs"></div>
        <button id="gf-tw-play" class="gf-tw-btn">▶&nbsp; ${_GameText('game_play')}</button>
        <div class="gf-tw-scr-footer">${_GameText('td_hint')}</div>
      </div>

      <div id="gf-tw-pause" class="gf-tw-scr" style="display:none">
        <div class="gf-tw-scr-sub" style="font-size:22px;letter-spacing:4px">${_GameText('game_paused')}</div>
        <button class="gf-tw-btn" id="gf-tw-resume">▶&nbsp; ${_GameText('game_resume')}</button>
      </div>

      <div id="gf-tw-go" class="gf-tw-scr" style="display:none">
        <div class="gf-tw-scr-go">${_GameText('game_gameover')}</div>
        <div id="gf-tw-go-stat" class="gf-tw-scr-stat"></div>
        <button class="gf-tw-btn" id="gf-tw-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
        <button class="gf-tw-btn gf-tw-btn-sec" id="gf-tw-back-go">← ${_GameText('td_difficulty')}</button>
      </div>

      <div id="gf-tw-win" class="gf-tw-scr" style="display:none">
        <div class="gf-tw-scr-win">${_GameText('td_victory')}</div>
        <div id="gf-tw-win-stat" class="gf-tw-scr-stat"></div>
        <button class="gf-tw-btn" id="gf-tw-back-win">← ${_GameText('td_difficulty')}</button>
      </div>
    </div>
    <div id="gf-tw-toolbar">
      <div class="gf-tw-tool-hdr">${_GameText('td_towers')}</div>
      ${toolbar}
      <button id="gf-tw-delete" class="gf-tw-delete" disabled title="${_GameText('td_delete_tower')}">
        <span class="gf-tw-delete-icon">X</span>
        <span id="gf-tw-delete-label">${_GameText('td_delete_tower')}</span>
      </button>
      <div class="gf-tw-help">${_GameText('td_help')}</div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    BindButtons();
  }

  function BindButtons() {
    document.getElementById('gf-tw-close')?.addEventListener('click', CloseGradeTower);
    document.getElementById('gf-tw-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-tw-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-tw-play')?.addEventListener('click', DoStart);
    document.getElementById('gf-tw-retry')?.addEventListener('click', DoStart);
    document.getElementById('gf-tw-back-go')?.addEventListener('click', ShowStart);
    document.getElementById('gf-tw-back-win')?.addEventListener('click', ShowStart);
    document.getElementById('gf-tw-startwave')?.addEventListener('click', () => { if (GS?.status === 'playing') StartWave(); });
    document.getElementById('gf-tw-delete')?.addEventListener('click', DeleteSelectedTower);

    const cv = document.getElementById('gf-tw-canvas');
    if (cv) {
      cv.addEventListener('mousemove', OnCanvasMove);
      cv.addEventListener('mouseleave', OnCanvasLeave);
      cv.addEventListener('click', OnCanvasClick);
      cv.addEventListener('contextmenu', OnCanvasContext);
    }

    document.querySelectorAll('.gf-tw-tool').forEach(btn => {
      btn.addEventListener('click', () => PickTower(btn.dataset.tower));
    });
  }

  /* ── Public API ──────────────────────────────────────────── */
  function OpenGradeTower(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-tw')) BuildOverlay();
    document.getElementById('gf-tw').style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    ShowStart();
  }
  function CloseGradeTower() {
    const el = document.getElementById('gf-tw');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') { GS.status = 'paused'; StopLoop(); }
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }
  function ToggleGradeTower(grades) {
    const el = document.getElementById('gf-tw');
    if (el && el.style.display !== 'none') CloseGradeTower(); else OpenGradeTower(grades);
  }
  function BossKeyTower() {
    const el = document.getElementById('gf-tw');
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

  W.OpenGradeTower   = OpenGradeTower;
  W.CloseGradeTower  = CloseGradeTower;
  W.ToggleGradeTower = ToggleGradeTower;
  W.BossKeyTower     = BossKeyTower;

  /* ── CSS ─────────────────────────────────────────────────── */
  function InjectCSS() {
    if (document.getElementById('gf-tw-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-tw-css';
    s.textContent = `
#gf-tw {
  --tw-modal:#fff;--tw-hdr:#f5f5f5;--tw-bar:#fafafa;--tw-scr:rgba(248,248,248,0.96);
  --tw-brd:rgba(74,222,128,0.22);--tw-brd2:#e0e0e0;--tw-btn-brd:#d0d0d0;
  --tw-txt:#111;--tw-txt2:#555;--tw-txt3:#999;
  --tw-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-tw[data-theme="dark"] {
  --tw-modal:rgba(13,13,13,0.97);--tw-hdr:rgba(8,8,8,0.95);--tw-bar:rgba(10,10,10,0.98);
  --tw-scr:rgba(6,6,6,0.94);--tw-brd:rgba(74,222,128,0.18);--tw-brd2:#1c1c1c;
  --tw-btn-brd:#333;--tw-txt:#f5f5f5;--tw-txt2:#cbd5e1;--tw-txt3:#8a94a6;
  --tw-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-tw{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-tw-modal{position:relative;display:flex;flex-direction:column;background:var(--tw-modal);border:1px solid var(--tw-brd);border-radius:12px;box-shadow:var(--tw-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-tw-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--tw-hdr);border-bottom:1px solid var(--tw-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-tw-hl{display:flex;align-items:center;gap:8px;}.gf-tw-hr{display:flex;align-items:center;gap:6px;}
#gf-tw-logo{width:24px;height:24px;background:#22d3ee;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#111;letter-spacing:-1px;}
#gf-tw-title{font-size:13px;font-weight:700;color:var(--tw-txt);letter-spacing:-0.3px;}
#gf-tw-badge{font-size:7px;font-weight:600;color:#22d3ee;border:1px solid rgba(34,211,238,0.4);border-radius:4px;padding:1px 4px;letter-spacing:1px;}
#gf-tw-pause-btn,#gf-tw-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--tw-btn-brd);border-radius:6px;background:transparent;color:var(--tw-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-tw-pause-btn:hover{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,.10);}
#gf-tw-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}

#gf-tw-body{display:flex;flex-direction:row;flex-shrink:0;}
#gf-tw-stage{position:relative;line-height:0;}
#gf-tw-hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 10px;background:var(--tw-bar);border-bottom:1px solid var(--tw-brd);user-select:none;line-height:1.15;}
.gf-twh-cell{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0;padding:6px 8px;border:1px solid var(--tw-brd2);border-radius:8px;background:rgba(128,128,128,0.08);}
.gf-twh-lbl{font-size:9px;font-weight:800;letter-spacing:0.9px;color:var(--tw-txt3);text-transform:uppercase;white-space:nowrap;}
.gf-twh-val{font-size:16px;font-weight:800;color:var(--tw-txt);letter-spacing:0;line-height:1;white-space:nowrap;}
#gf-tw-canvas{display:block;width:${CV_W}px;height:${CV_H}px;cursor:pointer;}
#gf-tw-startwave{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:#4ade80;color:#0a0a0a;border:none;border-radius:6px;padding:6px 14px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.4px;display:flex;align-items:center;gap:6px;box-shadow:0 4px 18px rgba(74,222,128,0.4);transition:transform .12s,box-shadow .12s;}
#gf-tw-startwave:hover{transform:translateX(-50%) translateY(-1px);box-shadow:0 6px 22px rgba(74,222,128,0.55);}

#gf-tw-toolbar{display:flex;flex-direction:column;width:190px;background:var(--tw-bar);border-left:1px solid var(--tw-brd);padding:12px;gap:8px;line-height:1.25;}
.gf-tw-tool-hdr{font-size:10px;font-weight:800;letter-spacing:1.2px;color:var(--tw-txt2);text-transform:uppercase;margin-bottom:4px;}
.gf-tw-tool{display:flex;align-items:center;gap:10px;background:rgba(128,128,128,0.06);border:1px solid var(--tw-brd2);border-radius:9px;padding:8px 9px;cursor:pointer;font-family:inherit;text-align:left;color:var(--tw-txt);transition:border-color .12s,background .12s,transform .12s;}
.gf-tw-tool:hover{border-color:rgba(34,211,238,0.5);background:rgba(34,211,238,0.06);}
.gf-tw-tool-on{border-color:#22d3ee;background:rgba(34,211,238,0.14);}
.gf-tw-tool:hover{transform:translateY(-1px);}
.gf-tw-tool-low-money .gf-tw-tool-cost{color:#f87171;}
.gf-tw-tool-locked{opacity:0.58;}
.gf-tw-tool-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#0a0a0a;flex-shrink:0;}
.gf-tw-tool-info{display:flex;flex-direction:column;flex:1;min-width:0;line-height:1.2;gap:3px;}
.gf-tw-tool-name{font-size:12px;font-weight:800;color:var(--tw-txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-tw-tool-cost{font-size:10px;color:var(--tw-txt2);white-space:nowrap;}
.gf-tw-tool-key{width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--tw-txt2);background:rgba(128,128,128,0.13);border-radius:6px;font-weight:800;flex-shrink:0;}
.gf-tw-delete{display:flex;align-items:center;gap:9px;margin-top:2px;border:1px solid rgba(248,113,113,0.35);border-radius:9px;background:rgba(248,113,113,0.08);color:#f87171;padding:8px 9px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;line-height:1.2;text-align:left;}
.gf-tw-delete:hover:not(:disabled){background:rgba(248,113,113,0.16);transform:translateY(-1px);}
.gf-tw-delete:disabled{opacity:0.42;cursor:default;filter:grayscale(0.4);}
.gf-tw-delete-icon{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:rgba(248,113,113,0.16);flex-shrink:0;}
.gf-tw-help{margin-top:auto;font-size:10px;color:var(--tw-txt2);line-height:1.45;letter-spacing:0;padding:9px 0 0;border-top:1px solid var(--tw-brd2);}

.gf-tw-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;background:var(--tw-scr);padding:24px;overflow-y:auto;line-height:1.4;text-align:center;}
.gf-tw-scr-logo{font-size:32px;font-weight:800;color:#22d3ee;letter-spacing:0;text-shadow:0 0 40px rgba(34,211,238,0.5);line-height:1.05;}
.gf-tw-scr-sub{font-size:13px;color:var(--tw-txt2);letter-spacing:0;line-height:1.45;text-align:center;max-width:390px;}
.gf-tw-scr-label{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--tw-txt3);text-transform:uppercase;margin-top:6px;}
.gf-tw-scr-go{font-size:30px;font-weight:800;color:#f87171;letter-spacing:5px;text-shadow:0 0 30px rgba(248,113,113,0.5);}
.gf-tw-scr-win{font-size:30px;font-weight:800;color:#4ade80;letter-spacing:3px;text-shadow:0 0 30px rgba(74,222,128,0.5);}
.gf-tw-scr-stat{font-size:13px;color:var(--tw-txt2);font-weight:700;line-height:1.4;}
.gf-tw-scr-footer{font-size:11px;color:var(--tw-txt2);text-align:center;margin-top:4px;line-height:1.45;max-width:410px;}

.gf-tw-diffs{display:flex;flex-direction:column;gap:6px;width:min(360px, 90%);}
.gf-twd{background:transparent;border:1px solid var(--tw-brd2);border-radius:8px;padding:8px 12px;cursor:pointer;font-family:inherit;color:var(--tw-txt);display:flex;justify-content:space-between;align-items:center;transition:border-color .12s,background .12s;}
.gf-twd:hover{border-color:rgba(34,211,238,0.5);background:rgba(34,211,238,0.05);}
.gf-twd-sel{border-color:#22d3ee;background:rgba(34,211,238,0.13);}
.gf-twd-row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;}
.gf-twd-name{font-size:13px;font-weight:700;}
.gf-twd-meta{font-size:9px;color:var(--tw-txt3);letter-spacing:0.5px;}
.gf-twd-best{font-size:10px;color:#22d3ee;font-weight:700;letter-spacing:0.5px;}

.gf-tw-btn{padding:9px 22px;border:1px solid #22d3ee;border-radius:7px;background:rgba(34,211,238,0.10);color:#22d3ee;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px;}
.gf-tw-btn:hover{background:rgba(34,211,238,0.22);box-shadow:0 4px 18px rgba(34,211,238,0.28);transform:translateY(-1px);}
.gf-tw-btn-sec{border-color:var(--tw-btn-brd);color:var(--tw-txt2);background:transparent;}
.gf-tw-btn-sec:hover{border-color:var(--tw-txt2);color:var(--tw-txt);background:rgba(0,0,0,0.04);box-shadow:none;}
`;
    document.head.appendChild(s);
  }

})(window);
