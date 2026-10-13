;(function (W) {
  'use strict';
  if (W.OpenGradeIo) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;
  const T = (k, vars) => { let s = _GameText(k); for (const v in vars || {}) s = s.replace(`{${v}}`, vars[v]); return s; };

  const SIZE = 6000;
  const PELLETS = 900;
  const START_MASS = 12;
  const MAX_CELLS = 16;
  const MIN_SPLIT = 35;
  const MIN_EJECT = 35;
  const EJECT_LOSS = 16;
  const EJECT_MASS = 13;
  const MAX_MASS = 22500;
  const VIRUS_MASS = 100;
  const VIRUS_COUNT = 18;
  const STEP = 1 / 40;
  const SEND_MS = 50;
  const INTERP_MS = 80;
  const GRID = 256;
  const GCOLS = Math.ceil(SIZE / GRID);
  const LS_BEST = 'gf-io-best';
  const LS_NAME = 'gf-io-name';
  const LS_MASS = 'gf-io-show-mass';
  const PELLET_COLORS = ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ef4444'];
  const BOT_NAMES = ['Wiskunde', 'Frans', 'Herexamen', 'B-attest', 'Deliberatie', '20/20', 'Strafstudie', 'Spiekbriefje', 'Toetsweek', 'Rapport', 'Huiswerk', 'Proefwerk', 'Uitmuntend', 'Op weg naar', 'Beginsituatie', 'Geschiedenis', 'Chemie', 'Fysica', 'Latijn', 'Biologie', 'Examen', 'Dagelijks werk', 'Nul op tien', 'Bisser', 'Turnzak', 'Klasraad', 'Speelplaats', 'Agenda', 'Lesrooster', 'Studie', 'Zomerwerk', 'Inhaaltoets'];

  let root = null, cv = null, ctx = null, dpr = 1, cw = 0, ch = 0, raf = 0, tobs = null;
  let mode = 'solo', screen = 'start', paused = false, showMass = true, grades = [];
  let world = null, acc = 0, lastTs = 0, simAlpha = 0;
  let myId = 'me', myName = '', alive = false, deathStats = null;
  let mouse = { x: 0, y: 0, has: false }, ejecting = false, ejectTimer = 0, splitCount = 0, ejectCount = 0;
  let cam = { x: SIZE / 2, y: SIZE / 2, s: 1 }, zoom = 1;
  let net = null;
  const snaps = [];
  let pelletState = null, roster = new Map();

  function LsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function LsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function Clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function Radius(m) { return Math.sqrt(m * 100); }
  function Speed(r) { return 1650 * Math.pow(r, -0.439); }
  function Rand(a, b) { return a + Math.random() * (b - a); }

  function Hash(seed, i, g) {
    let h = (seed ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(g + 7, 0x85ebca6b)) >>> 0;
    const next = () => {
      h = (h + 0x6d2b79f5) >>> 0;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return { x: 30 + next() * (SIZE - 60), y: 30 + next() * (SIZE - 60), c: Math.floor(next() * PELLET_COLORS.length) };
  }

  function NewPellets(seed, gens) {
    const st = { seed, gen: new Uint16Array(PELLETS), x: new Float32Array(PELLETS), y: new Float32Array(PELLETS), c: new Uint8Array(PELLETS), grid: Array.from({ length: GCOLS * GCOLS }, () => new Set()) };
    for (let i = 0; i < PELLETS; i++) Place(st, i, gens ? gens[i] : 0);
    return st;
  }

  function Bucket(x, y) { return Clamp(Math.floor(y / GRID), 0, GCOLS - 1) * GCOLS + Clamp(Math.floor(x / GRID), 0, GCOLS - 1); }

  function Place(st, i, g) {
    if (st.gen[i] === g && st.x[i]) return;
    if (st.x[i] || st.y[i]) st.grid[Bucket(st.x[i], st.y[i])].delete(i);
    const p = Hash(st.seed, i, g);
    st.gen[i] = g; st.x[i] = p.x; st.y[i] = p.y; st.c[i] = p.c;
    st.grid[Bucket(p.x, p.y)].add(i);
  }

  function ForPellets(st, x, y, r, fn) {
    const x0 = Clamp(Math.floor((x - r) / GRID), 0, GCOLS - 1), x1 = Clamp(Math.floor((x + r) / GRID), 0, GCOLS - 1);
    const y0 = Clamp(Math.floor((y - r) / GRID), 0, GCOLS - 1), y1 = Clamp(Math.floor((y + r) / GRID), 0, GCOLS - 1);
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const i of st.grid[gy * GCOLS + gx]) if (fn(i) === false) return;
  }

  function Hue() { return Math.floor(Math.random() * 360); }

  function NewWorld() {
    const w = { seed: (Math.random() * 4294967296) >>> 0, tick: 0, nextId: 1, players: new Map(), cells: new Map(), viruses: new Map(), ejected: new Map(), events: [], time: 0 };
    w.pellets = NewPellets(w.seed);
    for (let i = 0; i < VIRUS_COUNT; i++) AddVirus(w, Rand(300, SIZE - 300), Rand(300, SIZE - 300));
    return w;
  }

  function AddVirus(w, x, y, vx = 0, vy = 0) {
    const id = w.nextId++;
    w.viruses.set(id, { id, x, y, m: VIRUS_MASS, fed: 0, vx, vy, px: x, py: y });
  }

  function SafeSpot(w) {
    let best = null, bestD = -1;
    for (let k = 0; k < 12; k++) {
      const x = Rand(200, SIZE - 200), y = Rand(200, SIZE - 200);
      let d = Infinity;
      for (const c of w.cells.values()) if (c.m > 40) d = Math.min(d, Math.hypot(c.x - x, c.y - y) - Radius(c.m));
      for (const v of w.viruses.values()) d = Math.min(d, Math.hypot(v.x - x, v.y - y) - 120);
      if (d > bestD) { bestD = d; best = { x, y }; }
      if (d > 600) break;
    }
    return best;
  }

  function AddPlayer(w, id, name, bot, hue = Hue()) {
    const p = { id, name: String(name || '').slice(0, 15), hue, bot, cells: new Set(), target: { x: SIZE / 2, y: SIZE / 2 }, alive: false, splits: 0, ejects: 0, seenSplit: 0, seenEject: 0, respawnAt: 0, brain: bot ? { next: 0, mood: Math.random(), aim: null } : null, stats: null };
    w.players.set(id, p);
    return p;
  }

  function Spawn(w, p, mass = START_MASS) {
    for (const cid of p.cells) w.cells.delete(cid);
    p.cells.clear();
    const s = SafeSpot(w);
    AddCell(w, p, s.x, s.y, mass);
    p.alive = true;
    p.target = { x: s.x, y: s.y };
    p.stats = { born: w.time, food: 0, eaten: 0, top: mass, best: 99, lbTime: 0 };
  }

  function AddCell(w, p, x, y, m, bvx = 0, bvy = 0, mergeDelay = 0) {
    const id = w.nextId++;
    const c = { id, owner: p.id, x, y, px: x, py: y, m, bvx, bvy, mergeAt: w.time + mergeDelay, born: w.time };
    w.cells.set(id, c);
    p.cells.add(id);
    return c;
  }

  function MergeDelay(m) { return 30 + m * 0.0233; }

  function Split(w, p) {
    const list = [...p.cells].map(id => w.cells.get(id)).filter(Boolean).sort((a, b) => b.m - a.m);
    let count = p.cells.size;
    for (const c of list) {
      if (count >= MAX_CELLS) break;
      if (c.m < MIN_SPLIT) continue;
      const dx = p.target.x - c.x, dy = p.target.y - c.y, d = Math.hypot(dx, dy) || 1;
      const half = c.m / 2;
      c.m = half;
      c.mergeAt = w.time + MergeDelay(half);
      const r = Radius(half), v = Math.max(900, Speed(r) * 3.6);
      AddCell(w, p, c.x + dx / d * r * 0.5, c.y + dy / d * r * 0.5, half, dx / d * v, dy / d * v, MergeDelay(half));
      count++;
    }
  }

  function Eject(w, p) {
    for (const id of p.cells) {
      const c = w.cells.get(id);
      if (!c || c.m < MIN_EJECT) continue;
      const dx = p.target.x - c.x, dy = p.target.y - c.y, d = Math.hypot(dx, dy) || 1;
      const r = Radius(c.m);
      c.m -= EJECT_LOSS;
      const a = Math.atan2(dy, dx) + Rand(-0.18, 0.18);
      const eid = w.nextId++;
      w.ejected.set(eid, { id: eid, x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, px: c.x, py: c.y, m: EJECT_MASS, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, hue: p.hue, owner: p.id, born: w.time });
    }
  }

  function PopVirus(w, p, c) {
    const free = MAX_CELLS - p.cells.size;
    if (free <= 0) return;
    const pieces = Math.min(free, Math.max(1, Math.floor(c.m / 36)));
    const each = c.m / (pieces + 1);
    c.m = each;
    c.mergeAt = w.time + MergeDelay(each);
    for (let i = 0; i < pieces; i++) {
      const a = (i / pieces) * Math.PI * 2 + Rand(-0.2, 0.2);
      const v = Math.max(700, Speed(Radius(each)) * 3);
      AddCell(w, p, c.x, c.y, each, Math.cos(a) * v, Math.sin(a) * v, MergeDelay(each));
    }
  }

  function Kill(w, p, by) {
    p.alive = false;
    p.respawnAt = w.time + (p.bot ? Rand(1.5, 4) : Infinity);
    if (!p.bot && p.stats) {
      const stats = { ...p.stats, alive: w.time - p.stats.born, by: by ? w.players.get(by)?.name || '' : '' };
      if (p.id === myId) OnDeath(stats);
      else net?.send(p.id, { t: 'dead', stats }, true);
    }
  }

  function Score(w, p) {
    let m = 0;
    for (const id of p.cells) m += w.cells.get(id)?.m || 0;
    return m;
  }

  function Step(w, dt) {
    w.time += dt;
    w.tick++;
    for (const p of w.players.values()) {
      if (p.bot) {
        if (!p.alive && w.time >= p.respawnAt) Spawn(w, p);
        if (p.alive && w.time >= p.brain.next) Think(w, p);
      }
      if (!p.alive) continue;
      if (p.splits > p.seenSplit) { p.seenSplit = Math.min(p.splits, p.seenSplit + 2); Split(w, p); }
      if (p.ejects > p.seenEject) { p.seenEject = Math.min(p.ejects, p.seenEject + 2); Eject(w, p); }
    }
    for (const c of w.cells.values()) {
      c.px = c.x; c.py = c.y;
      const p = w.players.get(c.owner);
      const r = Radius(c.m);
      const dx = p.target.x - c.x, dy = p.target.y - c.y, d = Math.hypot(dx, dy);
      const sp = Speed(r) * Math.min(1, d / (r * 0.5 + 30));
      if (d > 0.5) { c.x += dx / d * sp * dt; c.y += dy / d * sp * dt; }
      c.x += c.bvx * dt; c.y += c.bvy * dt;
      const decay = Math.exp(-dt * 4.2);
      c.bvx *= decay; c.bvy *= decay;
      if (c.m > 50) c.m = Math.max(50, c.m * (1 - 0.003 * dt));
      if (c.m > MAX_MASS) c.m = MAX_MASS;
      const rr = r * 0.5;
      c.x = Clamp(c.x, rr, SIZE - rr); c.y = Clamp(c.y, rr, SIZE - rr);
    }
    for (const e of w.ejected.values()) {
      e.px = e.x; e.py = e.y;
      e.x += e.vx * dt; e.y += e.vy * dt;
      const decay = Math.exp(-dt * 5.5);
      e.vx *= decay; e.vy *= decay;
      e.x = Clamp(e.x, 10, SIZE - 10); e.y = Clamp(e.y, 10, SIZE - 10);
    }
    for (const v of w.viruses.values()) {
      v.px = v.x; v.py = v.y;
      if (v.vx || v.vy) {
        v.x += v.vx * dt; v.y += v.vy * dt;
        const decay = Math.exp(-dt * 3.2);
        v.vx *= decay; v.vy *= decay;
        if (Math.abs(v.vx) + Math.abs(v.vy) < 5) v.vx = v.vy = 0;
        v.x = Clamp(v.x, 60, SIZE - 60); v.y = Clamp(v.y, 60, SIZE - 60);
      }
    }
    for (const p of w.players.values()) {
      if (!p.alive || p.cells.size < 2) continue;
      const list = [...p.cells].map(id => w.cells.get(id));
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!w.cells.has(a.id) || !w.cells.has(b.id)) continue;
        const ra = Radius(a.m), rb = Radius(b.m);
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
        const canMerge = w.time >= a.mergeAt && w.time >= b.mergeAt;
        if (canMerge) {
          if (d < Math.max(ra, rb) - Math.min(ra, rb) * 0.25) {
            const [big, small] = a.m >= b.m ? [a, b] : [b, a];
            big.m += small.m;
            w.cells.delete(small.id);
            p.cells.delete(small.id);
          }
        } else if (d < ra + rb && w.time - a.born > 0.12 && w.time - b.born > 0.12) {
          const push = (ra + rb - d) * 0.5;
          const ta = b.m / (a.m + b.m), tb = a.m / (a.m + b.m);
          a.x -= dx / d * push * ta; a.y -= dy / d * push * ta;
          b.x += dx / d * push * tb; b.y += dy / d * push * tb;
        }
      }
    }
    const cells = [...w.cells.values()].sort((a, b) => b.m - a.m);
    for (const c of cells) {
      if (!w.cells.has(c.id)) continue;
      const p = w.players.get(c.owner);
      const r = Radius(c.m);
      ForPellets(w.pellets, c.x, c.y, r, i => {
        const dx = w.pellets.x[i] - c.x, dy = w.pellets.y[i] - c.y;
        if (dx * dx + dy * dy < r * r) {
          c.m += 1;
          if (p.stats) p.stats.food++;
          const g = (w.pellets.gen[i] + 1) & 0xffff;
          Place(w.pellets, i, g);
          w.events.push([w.tick, i, g]);
        }
      });
      for (const e of w.ejected.values()) {
        if (e.owner === c.owner && w.time - e.born < 0.35) continue;
        if (c.m < EJECT_MASS * 1.25) continue;
        const dx = e.x - c.x, dy = e.y - c.y;
        if (dx * dx + dy * dy < (r - 4) * (r - 4)) { c.m += e.m; w.ejected.delete(e.id); }
      }
      for (const v of w.viruses.values()) {
        const rv = Radius(v.m);
        const d = Math.hypot(v.x - c.x, v.y - c.y);
        if (c.m >= v.m * 1.33 && d < r - rv * 0.35) {
          w.viruses.delete(v.id);
          c.m += v.m;
          PopVirus(w, p, c);
          if (w.viruses.size < VIRUS_COUNT) { const s = SafeSpot(w); AddVirus(w, s.x, s.y); }
          break;
        }
      }
      for (const o of cells) {
        if (o === c || o.owner === c.owner || !w.cells.has(o.id) || c.m < o.m * 1.25) continue;
        const ro = Radius(o.m);
        const dx = o.x - c.x, dy = o.y - c.y;
        const lim = r - ro * 0.35;
        if (lim > 0 && dx * dx + dy * dy < lim * lim) {
          c.m += o.m;
          w.cells.delete(o.id);
          const op = w.players.get(o.owner);
          op.cells.delete(o.id);
          if (p.stats) p.stats.eaten++;
          if (!op.cells.size) Kill(w, op, p.id);
        }
      }
    }
    for (const e of w.ejected.values()) {
      for (const v of w.viruses.values()) {
        const rv = Radius(v.m);
        if (Math.hypot(e.x - v.x, e.y - v.y) < rv) {
          w.ejected.delete(e.id);
          v.m += EJECT_MASS;
          if (++v.fed >= 7) {
            v.m = VIRUS_MASS; v.fed = 0;
            const sp = Math.hypot(e.vx, e.vy) || 1;
            if (w.viruses.size < VIRUS_COUNT * 2) AddVirus(w, v.x, v.y, e.vx / sp * 1300, e.vy / sp * 1300);
          }
          break;
        }
      }
    }
    for (const p of w.players.values()) {
      if (!p.alive || !p.stats) continue;
      p.stats.top = Math.max(p.stats.top, Score(w, p));
    }
    if (w.tick % 20 === 0) {
      const lb = [...w.players.values()].filter(p => p.alive).sort((a, b) => Score(w, b) - Score(w, a));
      lb.forEach((p, i) => { if (p.stats) { p.stats.best = Math.min(p.stats.best, i + 1); if (i === 0) p.stats.lbTime += 0.5; } });
    }
    const cutoff = w.tick - 12;
    while (w.events.length && w.events[0][0] < cutoff) w.events.shift();
  }

  function Think(w, p) {
    const b = p.brain;
    b.next = w.time + Rand(0.08, 0.16);
    let main = null;
    for (const id of p.cells) { const c = w.cells.get(id); if (c && (!main || c.m > main.m)) main = c; }
    if (!main) return;
    const r = Radius(main.m);
    const sight = 420 + r * 4;
    let fx = 0, fy = 0, prey = null, preyScore = 0;
    for (const o of w.cells.values()) {
      if (o.owner === p.id) continue;
      const dx = o.x - main.x, dy = o.y - main.y, d = Math.hypot(dx, dy);
      if (d > sight) continue;
      const ro = Radius(o.m);
      if (o.m > main.m * 1.25) {
        const k = (o.m / main.m) * 1600 / Math.max(40, d - ro - r * 0.4);
        fx -= dx / d * k; fy -= dy / d * k;
      } else if (main.m > o.m * 1.25) {
        const s = o.m / Math.max(60, d);
        if (s > preyScore) { preyScore = s; prey = o; }
      }
    }
    if (main.m > VIRUS_MASS * 1.33 && p.cells.size < MAX_CELLS - 2) {
      for (const v of w.viruses.values()) {
        const dx = v.x - main.x, dy = v.y - main.y, d = Math.hypot(dx, dy);
        if (d < r + 200) { const k = 900 / Math.max(30, d - r); fx -= dx / d * k; fy -= dy / d * k; }
      }
    }
    const flee = Math.hypot(fx, fy);
    if (flee > 6 + b.mood * 6) {
      p.target = { x: Clamp(main.x + fx / flee * 600, 0, SIZE), y: Clamp(main.y + fy / flee * 600, 0, SIZE) };
      return;
    }
    if (prey && preyScore > 0.04) {
      p.target = { x: prey.x, y: prey.y };
      const d = Math.hypot(prey.x - main.x, prey.y - main.y);
      if (main.m > prey.m * 2.7 && p.cells.size <= 2 && d < r * 3.2 && d > r * 0.8 && Math.random() < 0.35 + b.mood * 0.3) p.splits++;
      return;
    }
    if (!b.aim || Math.random() < 0.06 || Math.hypot(b.aim.x - main.x, b.aim.y - main.y) < r) {
      let best = null, bestD = Infinity;
      ForPellets(w.pellets, main.x, main.y, 520, i => {
        const d = Math.hypot(w.pellets.x[i] - main.x, w.pellets.y[i] - main.y) + Rand(0, 120);
        if (d < bestD) { bestD = d; best = i; }
      });
      b.aim = best != null ? { x: w.pellets.x[best], y: w.pellets.y[best] } : { x: Rand(300, SIZE - 300), y: Rand(300, SIZE - 300) };
    }
    p.target = b.aim;
  }

  function BotCount(humans) {
    return mode === 'solo' ? 24 : Math.max(10, 26 - humans);
  }

  function FillBots(w) {
    const humans = [...w.players.values()].filter(p => !p.bot).length;
    const bots = [...w.players.values()].filter(p => p.bot);
    const want = BotCount(humans);
    const used = new Set(bots.map(b => b.name));
    for (let i = bots.length; i < want; i++) {
      const pool = BOT_NAMES.filter(n => !used.has(n));
      const name = pool[Math.floor(Math.random() * pool.length)] || 'Bot';
      used.add(name);
      const p = AddPlayer(w, 'b' + w.nextId++, name, true);
      Spawn(w, p, START_MASS + Math.random() * 60);
    }
    for (let i = want; i < bots.length; i++) {
      for (const cid of bots[i].cells) w.cells.delete(cid);
      w.players.delete(bots[i].id);
    }
  }

  function SnapshotOf(w) {
    const pl = [];
    for (const p of w.players.values()) {
      const cells = [];
      for (const id of p.cells) { const c = w.cells.get(id); if (c) cells.push(c.id, Math.round(c.x), Math.round(c.y), Math.round(c.m * 10) / 10); }
      pl.push([p.id, p.alive ? 1 : 0, cells]);
    }
    const v = [...w.viruses.values()].map(x => [x.id, Math.round(x.x), Math.round(x.y), Math.round(x.m)]);
    const e = [...w.ejected.values()].map(x => [x.id, Math.round(x.x), Math.round(x.y), x.hue]);
    return { t: 'st', k: w.tick, p: pl, v, e, pe: w.events.map(x => [x[1], x[2]]) };
  }

  function RosterOf(w) {
    return [...w.players.values()].map(p => [p.id, p.name, p.hue, p.bot ? 1 : 0]);
  }

  function SyncOf(w) {
    return { t: 'sync', seed: w.pellets.seed, gens: [...w.pellets.gen], roster: RosterOf(w) };
  }

  function WorldFromSnapshot(snap) {
    const w = { seed: pelletState.seed, tick: snap.k, nextId: 1, players: new Map(), cells: new Map(), viruses: new Map(), ejected: new Map(), events: [], time: 0, pellets: pelletState };
    let maxId = 0;
    for (const [id, name, hue, bot] of roster.values()) AddPlayer(w, id, name, !!bot, hue);
    for (const [pid, aliveFlag, flat] of snap.p) {
      const p = w.players.get(pid) || AddPlayer(w, pid, 'Speler', false);
      for (let i = 0; i < flat.length; i += 4) {
        const c = { id: flat[i], owner: pid, x: flat[i + 1], y: flat[i + 2], px: flat[i + 1], py: flat[i + 2], m: flat[i + 3], bvx: 0, bvy: 0, mergeAt: 8, born: -1 };
        w.cells.set(c.id, c);
        p.cells.add(c.id);
        maxId = Math.max(maxId, c.id);
      }
      p.alive = !!aliveFlag && p.cells.size > 0;
      if (p.alive) p.stats = { born: 0, food: 0, eaten: 0, top: Score(w, p), best: 99, lbTime: 0 };
      if (p.bot && !p.alive) p.respawnAt = 1;
    }
    for (const [id, x, y, m] of snap.v) { w.viruses.set(id, { id, x, y, px: x, py: y, m, fed: 0, vx: 0, vy: 0 }); maxId = Math.max(maxId, id); }
    for (const [id, x, y, hue] of snap.e) { w.ejected.set(id, { id, x, y, px: x, py: y, m: EJECT_MASS, vx: 0, vy: 0, hue, owner: '', born: -1 }); maxId = Math.max(maxId, id); }
    w.nextId = maxId + 1;
    return w;
  }

  function Net() {
    const self = { port: null, selfId: '', status: 'discovering', peers: new Map(), dead: new Set(), host: '', upBase: 0, ready: false, lastSend: 0, lastSnapAt: 0 };
    const post = m => { try { self.port?.postMessage(m); } catch (_) {} };
    self.send = (to, data, rel = true) => post({ kind: 'send', to, data, rel });
    self.rename = name => post({ kind: 'rename', name });
    self.myUp = () => performance.now() - self.upBase;
    self.peerUp = id => { const p = self.peers.get(id); return p ? p.up + (performance.now() - p.at) : 0; };
    self.elect = () => {
      let best = self.selfId, bestUp = self.myUp();
      for (const id of self.peers.keys()) {
        if (self.dead.has(id)) continue;
        const up = self.peerUp(id);
        if (up > bestUp + 1500 || (Math.abs(up - bestUp) <= 1500 && id < best)) { best = id; bestUp = up; }
      }
      return best;
    };
    self.start = () => {
      chrome.runtime.sendMessage({ type: 'gf-lan-ensure' }).then(r => {
        if (!r?.ok || self.closed) { self.status = 'offline'; return; }
        self.port = chrome.runtime.connect({ name: 'gf-lan:agar' });
        self.port.onMessage.addListener(OnNet);
        self.port.onDisconnect.addListener(() => { self.port = null; self.status = 'offline'; void chrome.runtime.lastError; });
        post({ kind: 'join', name: myName });
      }).catch(() => { self.status = 'offline'; });
    };
    self.close = () => {
      self.closed = true;
      post({ kind: 'leave' });
      try { self.port?.disconnect(); } catch (_) {}
      self.port = null;
    };
    return self;
  }

  function IsHost() { return mode === 'solo' || (net && net.host === net.selfId); }

  function BecomeHost() {
    if (!world) {
      const last = snaps[snaps.length - 1];
      world = last && pelletState ? WorldFromSnapshot(last.data) : NewWorld();
      pelletState = world.pellets;
    }
    myId = net.selfId;
    if (!world.players.has(myId)) AddPlayer(world, myId, myName, false);
    else world.players.get(myId).name = myName;
    for (const id of net.peers.keys()) if (!world.players.has(id)) AddPlayer(world, id, net.peers.get(id).name, false);
    for (const p of [...world.players.values()]) if (!p.bot && p.id !== myId && !net.peers.has(p.id)) { for (const c of p.cells) world.cells.delete(c); world.players.delete(p.id); }
    FillBots(world);
    alive = !!world.players.get(myId)?.alive;
    net.send(null, SyncOf(world), true);
  }

  function Rehost() {
    if (!net?.selfId || net.status === 'offline') return;
    const prev = net.host;
    net.host = net.elect();
    if (net.host === prev) return;
    if (net.host === net.selfId) BecomeHost();
    else if (prev === net.selfId) { world = null; net.ready = false; snaps.length = 0; net.pendingSpawn = alive; }
    else { net.ready = !!pelletState && prev !== ''; net.lastSnapAt = performance.now(); }
  }

  function OnNet(m) {
    if (!net) return;
    if (m.kind === 'status') {
      if (!net.selfId) { net.selfId = m.selfId; net.upBase = performance.now() - (m.up || 0); }
      net.status = m.status;
      if (m.status === 'online' && !net.host) setTimeout(() => { if (!net?.host && net?.status === 'online') Rehost(); }, net.peers.size ? 0 : 4000);
      UpdateLobby();
    } else if (m.kind === 'peer') {
      net.peers.set(m.id, { name: m.name, up: m.up || 0, at: performance.now() });
      if (net.host) Rehost();
      if (IsHost() && world) {
        if (!world.players.has(m.id)) AddPlayer(world, m.id, m.name, false);
        FillBots(world);
        net.send(m.id, SyncOf(world), true);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
      }
      if (!net.host) Rehost();
      UpdateLobby();
    } else if (m.kind === 'rename') {
      const p = net.peers.get(m.id);
      if (p) p.name = m.name;
      if (IsHost() && world?.players.has(m.id)) { world.players.get(m.id).name = m.name.slice(0, 15); net.send(null, { t: 'roster', roster: RosterOf(world) }, true); }
    } else if (m.kind === 'leave') {
      net.peers.delete(m.id);
      net.dead.delete(m.id);
      if (IsHost() && world?.players.has(m.id)) {
        const p = world.players.get(m.id);
        for (const c of p.cells) world.cells.delete(c);
        world.players.delete(m.id);
        FillBots(world);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
      }
      Rehost();
      UpdateLobby();
    } else if (m.kind === 'msg') OnPeerData(m.id, m.data);
  }

  function OnPeerData(from, d) {
    if (!d || typeof d !== 'object') return;
    if (net.dead.has(from)) { net.dead.delete(from); Rehost(); }
    if (IsHost() && world) {
      const p = world.players.get(from);
      if (d.t === 'in' && p && !p.bot) {
        if (Number.isFinite(d.x) && Number.isFinite(d.y)) p.target = { x: Clamp(d.x, 0, SIZE), y: Clamp(d.y, 0, SIZE) };
        if (Number.isFinite(d.s) && d.s > p.splits) p.splits = Math.min(d.s, p.splits + 4);
        if (Number.isFinite(d.w) && d.w > p.ejects) p.ejects = Math.min(d.w, p.ejects + 4);
        if (d.s < p.seenSplit - 20) p.seenSplit = p.splits = d.s;
        if (d.w < p.seenEject - 20) p.seenEject = p.ejects = d.w;
      } else if (d.t === 'spawn') {
        const q = p || AddPlayer(world, from, d.name, false);
        q.name = String(d.name || q.name).slice(0, 15);
        q.splits = q.seenSplit = Number(d.s) || 0;
        q.ejects = q.seenEject = Number(d.w) || 0;
        Spawn(world, q);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
      }
      return;
    }
    if (from !== net.host) return;
    if (d.t === 'sync') {
      pelletState = NewPellets(d.seed >>> 0, d.gens);
      roster = new Map(d.roster.map(r => [r[0], r]));
      net.ready = true;
      if (net.pendingSpawn) { net.pendingSpawn = false; net.send(net.host, { t: 'spawn', name: myName, s: splitCount, w: ejectCount }, true); }
      UpdateLobby();
    } else if (d.t === 'roster') {
      roster = new Map(d.roster.map(r => [r[0], r]));
    } else if (d.t === 'st' && pelletState) {
      for (const [i, g] of d.pe) if (i >= 0 && i < PELLETS && ((g - pelletState.gen[i]) & 0xffff) < 0x8000) Place(pelletState, i, g);
      net.lastSnapAt = performance.now();
      snaps.push({ at: net.lastSnapAt, data: d });
      while (snaps.length > 12) snaps.shift();
      const me = d.p.find(x => x[0] === net.selfId);
      if (me && me[1] && !alive && screen === 'play') alive = true;
    } else if (d.t === 'dead') {
      if (alive) OnDeath(d.stats || {});
    }
  }

  function SendInput() {
    if (!net || IsHost() || !alive) return;
    const now = performance.now();
    if (now - net.lastSend < SEND_MS) return;
    net.lastSend = now;
    const t = TargetWorld();
    net.send(net.host, { t: 'in', x: Math.round(t.x), y: Math.round(t.y), s: splitCount, w: ejectCount }, false);
  }

  function Broadcast() {
    if (!net || !world || !IsHost() || !net.peers.size) return;
    const now = performance.now();
    if (now - net.lastSend < SEND_MS) return;
    net.lastSend = now;
    net.send(null, SnapshotOf(world), false);
    if (world.tick % 400 === 0) net.send(null, SyncOf(world), true);
  }

  function Frame() {
    const out = { cells: [], viruses: [], ejected: [], players: [], pellets: null };
    if (IsHost() && world) {
      const a = simAlpha;
      for (const c of world.cells.values()) {
        const p = world.players.get(c.owner);
        out.cells.push({ id: c.id, owner: c.owner, x: c.px + (c.x - c.px) * a, y: c.py + (c.y - c.py) * a, m: c.m, hue: p.hue, name: p.name });
      }
      for (const v of world.viruses.values()) out.viruses.push({ x: v.px + (v.x - v.px) * a, y: v.py + (v.y - v.py) * a, m: v.m });
      for (const e of world.ejected.values()) out.ejected.push({ x: e.px + (e.x - e.px) * a, y: e.py + (e.y - e.py) * a, hue: e.hue });
      for (const p of world.players.values()) if (p.alive) out.players.push({ id: p.id, name: p.name, score: Score(world, p) });
      out.pellets = world.pellets;
      return out;
    }
    if (!snaps.length || !pelletState) return out;
    const rt = performance.now() - INTERP_MS;
    let i = snaps.length - 1;
    while (i > 0 && snaps[i - 1].at > rt) i--;
    const b = snaps[i], a = snaps[Math.max(0, i - 1)];
    const t = b === a ? 1 : Clamp((rt - a.at) / Math.max(1, b.at - a.at), 0, 1.15);
    const prev = new Map();
    for (const [, , flat] of a.data.p) for (let k = 0; k < flat.length; k += 4) prev.set(flat[k], [flat[k + 1], flat[k + 2]]);
    for (const [pid, , flat] of b.data.p) {
      const r = roster.get(pid);
      let score = 0;
      for (let k = 0; k < flat.length; k += 4) {
        const id = flat[k];
        let x = flat[k + 1], y = flat[k + 2];
        const pf = prev.get(id);
        if (pf) { x = pf[0] + (x - pf[0]) * t; y = pf[1] + (y - pf[1]) * t; }
        out.cells.push({ id, owner: pid, x, y, m: flat[k + 3], hue: r ? r[2] : 0, name: r ? r[1] : '' });
        score += flat[k + 3];
      }
      if (flat.length) out.players.push({ id: pid, name: r ? r[1] : '', score });
    }
    const pv = new Map(a.data.v.map(v => [v[0], v]));
    for (const v of b.data.v) { const q = pv.get(v[0]); out.viruses.push({ x: q ? q[1] + (v[1] - q[1]) * t : v[1], y: q ? q[2] + (v[2] - q[2]) * t : v[2], m: v[3] }); }
    const pe = new Map(a.data.e.map(v => [v[0], v]));
    for (const e of b.data.e) { const q = pe.get(e[0]); out.ejected.push({ x: q ? q[1] + (e[1] - q[1]) * t : e[1], y: q ? q[2] + (e[2] - q[2]) * t : e[2], hue: e[3] }); }
    out.pellets = pelletState;
    return out;
  }

  function TargetWorld() {
    if (!mouse.has) return { x: cam.x, y: cam.y };
    return { x: cam.x + (mouse.x - cw / 2) / cam.s, y: cam.y + (mouse.y - ch / 2) / cam.s };
  }

  function UpdateCamera(frame) {
    let sx = 0, sy = 0, sm = 0, sr = 0;
    const me = IsHost() ? myId : net?.selfId;
    for (const c of frame.cells) {
      if (c.owner !== me) continue;
      sx += c.x * c.m; sy += c.y * c.m; sm += c.m; sr += Radius(c.m) ** 2;
    }
    if (sm > 0) {
      cam.x += (sx / sm - cam.x) * 0.25;
      cam.y += (sy / sm - cam.y) * 0.25;
    }
    const base = Math.max(cw, ch * 1.6) / 1600;
    const target = base * Math.pow(Math.min(1, 64 / Math.max(1, Math.sqrt(sr))), 0.4) * zoom;
    cam.s += ((sm > 0 ? target : base * 0.55 * zoom) - cam.s) * 0.08;
  }

  function CellColor(h, l = 52) { return `hsl(${h},85%,${l}%)`; }

  function DrawVirus(x, y, r) {
    const spikes = Math.max(24, Math.round(r / 3.2));
    ctx.beginPath();
    for (let i = 0; i <= spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const rr = i % 2 ? r : r * 0.93;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(51,255,51,.82)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.strokeStyle = '#1fbf1f';
    ctx.stroke();
  }

  function Text(str, x, y, size, stroke = true) {
    ctx.font = `700 ${size}px Ubuntu, "Segoe UI", Arial, sans-serif`;
    if (stroke) { ctx.lineWidth = Math.max(2, size * 0.14); ctx.strokeStyle = '#000'; ctx.strokeText(str, x, y); }
    ctx.fillText(str, x, y);
  }

  function Draw() {
    const frame = Frame();
    UpdateCamera(frame);
    const dark = root.dataset.theme === 'dark';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = dark ? '#111111' : '#f2fbff';
    ctx.fillRect(0, 0, cw, ch);
    const s = cam.s;
    const left = cam.x - cw / 2 / s, top = cam.y - ch / 2 / s, right = cam.x + cw / 2 / s, bottom = cam.y + ch / 2 / s;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cw / 2 - cam.x * s), dpr * (ch / 2 - cam.y * s));
    ctx.strokeStyle = dark ? '#262626' : '#dbe4ea';
    ctx.lineWidth = 1 / s;
    ctx.beginPath();
    const g = 50;
    for (let x = Math.max(0, Math.floor(left / g) * g); x <= Math.min(SIZE, right); x += g) { ctx.moveTo(x, Math.max(0, top)); ctx.lineTo(x, Math.min(SIZE, bottom)); }
    for (let y = Math.max(0, Math.floor(top / g) * g); y <= Math.min(SIZE, bottom); y += g) { ctx.moveTo(Math.max(0, left), y); ctx.lineTo(Math.min(SIZE, right), y); }
    ctx.stroke();
    ctx.strokeStyle = dark ? '#444' : '#9fb3c2';
    ctx.lineWidth = 6 / s;
    ctx.strokeRect(0, 0, SIZE, SIZE);
    if (frame.pellets) {
      const st = frame.pellets;
      const pr = 9;
      ForPellets(st, (left + right) / 2, (top + bottom) / 2, Math.max(right - left, bottom - top) / 2 + 20, i => {
        const x = st.x[i], y = st.y[i];
        if (x < left - pr || x > right + pr || y < top - pr || y > bottom + pr) return;
        ctx.fillStyle = PELLET_COLORS[st.c[i]];
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + i; ctx.lineTo(x + Math.cos(a) * pr, y + Math.sin(a) * pr); }
        ctx.fill();
      });
    }
    for (const e of frame.ejected) {
      if (e.x < left - 20 || e.x > right + 20 || e.y < top - 20 || e.y > bottom + 20) continue;
      const r = Radius(EJECT_MASS);
      ctx.fillStyle = CellColor(e.hue);
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = CellColor(e.hue, 38); ctx.stroke();
    }
    const items = [...frame.cells.map(c => ({ c, m: c.m })), ...frame.viruses.map(v => ({ v, m: v.m }))].sort((a, b) => a.m - b.m);
    const me = IsHost() ? myId : net?.selfId;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of items) {
      if (it.v) {
        const r = Radius(it.v.m);
        if (it.v.x + r < left || it.v.x - r > right || it.v.y + r < top || it.v.y - r > bottom) continue;
        DrawVirus(it.v.x, it.v.y, r);
        continue;
      }
      const c = it.c, r = Radius(c.m);
      if (c.x + r < left || c.x - r > right || c.y + r < top || c.y - r > bottom) continue;
      ctx.fillStyle = CellColor(c.hue);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = Math.max(3, r * 0.06);
      ctx.strokeStyle = CellColor(c.hue, 40);
      ctx.beginPath(); ctx.arc(c.x, c.y, r - ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
      if (r * s > 9) {
        ctx.fillStyle = '#fff';
        const fs = Math.max(r * 0.32, 14 / s);
        if (c.name) Text(c.name, c.x, c.y, fs);
        if (showMass && (c.owner === me || r * s > 18)) Text(String(Math.floor(c.m)), c.x, c.y + (c.name ? fs * 0.9 : 0), Math.max(fs * 0.55, 11 / s));
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    DrawHud(frame, me);
  }

  function DrawHud(frame, me) {
    const players = frame.players.sort((a, b) => b.score - a.score);
    const lbW = 200, rows = Math.min(10, players.length);
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    RoundRect(cw - lbW - 12, 12, lbW, 44 + rows * 22, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 20px Ubuntu, "Segoe UI", Arial, sans-serif';
    ctx.fillText(T('io_leaderboard'), cw - lbW / 2 - 12, 34);
    ctx.font = '600 15px Ubuntu, "Segoe UI", Arial, sans-serif';
    let myRank = 0;
    players.forEach((p, i) => { if (p.id === me) myRank = i + 1; });
    for (let i = 0; i < rows; i++) {
      const p = players[i];
      ctx.fillStyle = p.id === me ? '#ffaaaa' : '#fff';
      const name = (p.name || T('io_unnamed')).slice(0, 15);
      ctx.fillText(`${i + 1}. ${name}`, cw - lbW / 2 - 12, 62 + i * 22);
    }
    if (myRank > 10) {
      ctx.fillStyle = '#ffaaaa';
      ctx.fillText(`${myRank}. ${myName || T('io_unnamed')}`, cw - lbW / 2 - 12, 62 + rows * 22 + 4);
    }
    const mine = players.find(p => p.id === me);
    if (mine && alive) {
      ctx.textAlign = 'left';
      ctx.font = '700 22px Ubuntu, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      const label = `${T('game_score')}: ${Math.floor(mine.score)}`;
      const w = ctx.measureText(label).width + 22;
      RoundRect(12, ch - 46, w, 34, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, 23, ch - 22);
    }
    if (mode === 'lan' && net) {
      ctx.textAlign = 'left';
      ctx.font = '600 12px Ubuntu, "Segoe UI", Arial, sans-serif';
      const text = `${T('io_network')} · ${T('io_players_online', { n: net.peers.size + 1 })}${IsHost() ? ' · host' : ''}`;
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      RoundRect(12, 12, ctx.measureText(text).width + 20, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#9ff59f';
      ctx.fillText(text, 22, 30);
    }
  }

  function RoundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }

  function Loop(ts) {
    raf = requestAnimationFrame(Loop);
    if (!root || root.style.display === 'none') return;
    const dt = Math.min(0.1, (ts - (lastTs || ts)) / 1000);
    lastTs = ts;
    if (ejecting && alive) {
      ejectTimer -= dt;
      if (ejectTimer <= 0) { ejectTimer = 0.09; Act('eject'); }
    }
    if (IsHost() && world && !(paused && mode === 'solo')) {
      const me = world.players.get(myId);
      if (me && me.alive) me.target = TargetWorld();
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 6) { Step(world, STEP); acc -= STEP; steps++; }
      if (steps === 6) acc = 0;
      simAlpha = acc / STEP;
      Broadcast();
    }
    if (net && net.ready && net.host && !IsHost() && performance.now() - net.lastSnapAt > 3500) {
      net.dead.add(net.host);
      net.lastSnapAt = performance.now();
      Rehost();
    }
    SendInput();
    Draw();
  }

  function Act(kind) {
    if (!alive || paused) return;
    if (kind === 'split') splitCount++; else ejectCount++;
    if (IsHost() && world) {
      const me = world.players.get(myId);
      if (!me) return;
      me.target = TargetWorld();
      if (kind === 'split') me.splits++; else me.ejects++;
    }
  }

  function StartPlay() {
    const input = root.querySelector('#gf-io-name');
    myName = (input?.value || '').trim().slice(0, 15);
    LsSet(LS_NAME, myName);
    deathStats = null;
    if (mode === 'solo') {
      if (!world || !world.solo) { world = NewWorld(); world.solo = true; myId = 'me'; FillBots(world); }
      const me = world.players.get(myId) || AddPlayer(world, myId, myName, false);
      me.name = myName;
      Spawn(world, me);
      alive = true;
    } else {
      if (!net || net.status === 'offline' || !net.host || (!IsHost() && !net.ready)) return;
      net.rename(myName);
      if (IsHost()) {
        const me = world.players.get(myId) || AddPlayer(world, myId, myName, false);
        me.name = myName;
        Spawn(world, me);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
        alive = true;
      } else {
        net.send(net.host, { t: 'spawn', name: myName, s: splitCount, w: ejectCount }, true);
        alive = true;
      }
    }
    paused = false;
    ShowScreen('play');
  }

  function OnDeath(stats) {
    alive = false;
    deathStats = stats;
    const top = Math.floor(stats.top || 0);
    if (top > (+LsGet(LS_BEST) || 0)) LsSet(LS_BEST, String(top));
    ShowScreen('dead');
  }

  function FmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }

  function SetMode(next) {
    if (mode === next && (next === 'solo' || net)) return;
    mode = next;
    if (next === 'lan') {
      world = null;
      snaps.length = 0;
      pelletState = null;
      roster = new Map();
      net = Net();
      net.start();
    } else {
      net?.close();
      net = null;
      world = null;
    }
    UpdateLobby();
  }

  function UpdateLobby() {
    if (!root) return;
    root.querySelectorAll('[data-io-mode]').forEach(b => b.classList.toggle('active', b.dataset.ioMode === mode));
    const status = root.querySelector('#gf-io-status');
    const play = root.querySelector('#gf-io-play');
    let text = T('io_solo_hint'), ok = true;
    if (mode === 'lan') {
      const n = net ? net.peers.size : 0;
      if (!net || net.status === 'discovering' || net.status === 'connecting') { text = T('io_lan_searching'); ok = false; }
      else if (net.status === 'offline') { text = T('io_lan_offline'); ok = false; }
      else if (!net.host) { text = T('io_lan_searching'); ok = false; }
      else if (!IsHost() && !net.ready) { text = T('io_lan_joining'); ok = false; }
      else text = n ? T('io_lan_found', { n: n + 1 }) : T('io_lan_alone');
    }
    if (status) { status.textContent = text; status.classList.toggle('is-wait', !ok); }
    if (play) play.disabled = !ok;
    const best = root.querySelector('#gf-io-best');
    if (best) best.textContent = LsGet(LS_BEST) || '0';
  }

  function ShowScreen(name) {
    screen = name;
    root.querySelector('#gf-io-start').style.display = name === 'start' ? 'flex' : 'none';
    root.querySelector('#gf-io-dead').style.display = name === 'dead' ? 'flex' : 'none';
    root.querySelector('#gf-io-pause').style.display = name === 'pause' ? 'flex' : 'none';
    root.querySelector('#gf-io-touch').style.display = name === 'play' && matchMedia('(pointer: coarse)').matches ? 'flex' : 'none';
    if (name === 'dead' && deathStats) {
      const s = deathStats;
      root.querySelector('#gf-io-stats').innerHTML = [
        ['io_stat_food', Math.floor(s.food || 0)],
        ['io_stat_time', FmtTime(s.alive)],
        ['io_stat_cells', Math.floor(s.eaten || 0)],
        ['io_stat_mass', Math.floor(s.top || 0)],
        ['io_stat_lb', FmtTime(s.lbTime)],
        ['io_stat_pos', s.best && s.best < 99 ? s.best : '-'],
      ].map(([k, v]) => `<div class="gf-io-stat"><b>${v}</b><span>${T(k)}</span></div>`).join('');
      root.querySelector('#gf-io-killer').textContent = s.by ? T('io_eaten_by', { name: s.by }) : '';
    }
    UpdateLobby();
    if (name === 'start') setTimeout(() => root.querySelector('#gf-io-name')?.focus(), 30);
  }

  function Resize() {
    if (!root) return;
    const maxW = Math.min(1180, innerWidth - 32), maxH = Math.min(760, innerHeight - 32 - 46);
    cw = Math.max(320, Math.floor(maxW));
    ch = Math.max(240, Math.floor(maxH));
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    cv.style.width = cw + 'px';
    cv.style.height = ch + 'px';
  }

  function OnKey(e) {
    if (!root || root.style.display === 'none') return;
    const typing = e.target?.id === 'gf-io-name';
    if (e.type === 'keyup') {
      if (e.code === 'KeyW' || e.key === 'w' || e.key === 'W') ejecting = false;
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (screen === 'play') { if (mode === 'solo') paused = true; ShowScreen('pause'); }
      else if (screen === 'pause') { paused = false; ShowScreen('play'); }
      else CloseGradeIo();
      return;
    }
    if (typing) {
      if (e.key === 'Enter') { e.preventDefault(); StartPlay(); }
      e.stopPropagation();
      return;
    }
    if ((e.key === 'p' || e.key === 'P') && screen !== 'start') {
      e.preventDefault(); e.stopPropagation();
      if (screen === 'play') { if (mode === 'solo') paused = true; ShowScreen('pause'); } else if (screen === 'pause') { paused = false; ShowScreen('play'); }
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && screen === 'dead') { e.preventDefault(); e.stopPropagation(); StartPlay(); return; }
    if (screen !== 'play') {
      if (e.key === 'Enter' && (screen === 'dead' || screen === 'start')) { e.preventDefault(); StartPlay(); }
      return;
    }
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) Act('split'); return; }
    if (e.code === 'KeyW' || e.key === 'w' || e.key === 'W') { e.preventDefault(); e.stopPropagation(); if (!ejecting) { ejecting = true; ejectTimer = 0; } return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
  }

  function OnMove(e) {
    const r = cv.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    mouse.x = (pt.clientX - r.left) * (cw / r.width);
    mouse.y = (pt.clientY - r.top) * (ch / r.height);
    mouse.has = true;
  }

  function OnVis() { if (document.hidden && mode === 'solo' && screen === 'play') { paused = true; ShowScreen('pause'); } }

  function ApplyTheme() {
    if (!root) return;
    if (typeof W._GfApplyThemeToHost === 'function') W._GfApplyThemeToHost(root);
    else root.dataset.theme = document.documentElement.getAttribute('data-gf-theme') === 'dark' ? 'dark' : 'light';
  }

  function Build() {
    InjectCSS();
    root = document.createElement('div');
    root.id = 'gf-io';
    const saved = LsGet(LS_NAME) || (LsGet('gf-realname-cache') || '').split(/\s+/)[0] || '';
    showMass = LsGet(LS_MASS) !== '0';
    root.innerHTML = `
<div id="gf-io-modal">
  <div id="gf-io-hdr">
    <div class="gf-io-hl"><div id="gf-io-logo">IO</div><span id="gf-io-title">Grade.io</span></div>
    <div class="gf-io-hr">
      <span class="gf-io-best-box"><span>${T('game_best').toUpperCase()}</span><b id="gf-io-best">0</b></span>
      <button id="gf-io-pause-btn" title="Esc">⏸</button>
      <button id="gf-io-close" title="Esc">✕</button>
    </div>
  </div>
  <div id="gf-io-body">
    <canvas id="gf-io-canvas"></canvas>
    <div id="gf-io-start" class="gf-io-scr">
      <div class="gf-io-panel">
        <div class="gf-io-brand">Grade<span>.io</span></div>
        <input id="gf-io-name" maxlength="15" placeholder="${T('io_nick')}" value="${String(saved).replace(/[<>"&]/g, '')}" autocomplete="off" spellcheck="false">
        <div class="gf-io-modes">
          <button data-io-mode="solo"><b>${T('io_mode_solo')}</b><span>${T('io_mode_solo_desc')}</span></button>
          <button data-io-mode="lan"><b>${T('io_mode_lan')}</b><span>${T('io_mode_lan_desc')}</span></button>
        </div>
        <div id="gf-io-status"></div>
        <button id="gf-io-play">${T('game_play')}</button>
        <label class="gf-io-check"><input type="checkbox" id="gf-io-mass"${showMass ? ' checked' : ''}> ${T('io_show_mass')}</label>
        <div class="gf-io-keys">${T('io_controls')}</div>
      </div>
    </div>
    <div id="gf-io-pause" class="gf-io-scr" style="display:none">
      <div class="gf-io-panel">
        <div class="gf-io-brand" style="font-size:30px">${T('game_paused')}</div>
        <div class="gf-io-keys" id="gf-io-pause-note"></div>
        <button id="gf-io-resume">${T('game_resume')}</button>
        <button id="gf-io-menu" class="gf-io-ghost">${T('io_menu')}</button>
      </div>
    </div>
    <div id="gf-io-dead" class="gf-io-scr" style="display:none">
      <div class="gf-io-panel">
        <div class="gf-io-brand" style="font-size:30px">${T('game_gameover')}</div>
        <div id="gf-io-killer" class="gf-io-keys"></div>
        <div id="gf-io-stats"></div>
        <button id="gf-io-again">${T('game_try_again')}</button>
        <button id="gf-io-menu2" class="gf-io-ghost">${T('io_menu')}</button>
      </div>
    </div>
    <div id="gf-io-touch" style="display:none"><button data-io-act="eject">W</button><button data-io-act="split">${T('io_split')}</button></div>
  </div>
</div>`;
    document.body.appendChild(root);
    cv = root.querySelector('#gf-io-canvas');
    ctx = cv.getContext('2d');
    root.querySelector('#gf-io-close').addEventListener('click', CloseGradeIo);
    root.querySelector('#gf-io-pause-btn').addEventListener('click', () => {
      if (screen === 'play') { if (mode === 'solo') paused = true; ShowScreen('pause'); } else if (screen === 'pause') { paused = false; ShowScreen('play'); }
    });
    root.querySelector('#gf-io-play').addEventListener('click', StartPlay);
    root.querySelector('#gf-io-again').addEventListener('click', StartPlay);
    root.querySelector('#gf-io-resume').addEventListener('click', () => { paused = false; ShowScreen('play'); });
    for (const id of ['#gf-io-menu', '#gf-io-menu2']) root.querySelector(id).addEventListener('click', () => {
      if (alive && IsHost() && world) { const me = world.players.get(myId); if (me) { for (const c of me.cells) world.cells.delete(c); me.cells.clear(); me.alive = false; } }
      alive = false;
      paused = false;
      ShowScreen('start');
    });
    root.querySelectorAll('[data-io-mode]').forEach(b => b.addEventListener('click', () => SetMode(b.dataset.ioMode)));
    root.querySelector('#gf-io-mass').addEventListener('change', e => { showMass = e.target.checked; LsSet(LS_MASS, showMass ? '1' : '0'); });
    root.querySelector('#gf-io-name').addEventListener('input', e => { myName = e.target.value.trim().slice(0, 15); });
    root.querySelectorAll('[data-io-act]').forEach(b => b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Act(b.dataset.ioAct); }, { passive: false }));
    cv.addEventListener('mousemove', OnMove);
    cv.addEventListener('touchstart', e => { OnMove(e); e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchmove', e => { OnMove(e); e.preventDefault(); }, { passive: false });
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Clamp(zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.45, 1.8); }, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  function OpenGradeIo(gr) {
    grades = Array.isArray(gr) ? gr : [];
    if (!root) Build();
    root.style.display = 'flex';
    ApplyTheme();
    if (!tobs) tobs = new MutationObserver(ApplyTheme);
    tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    Resize();
    addEventListener('resize', Resize);
    document.addEventListener('keydown', OnKey, true);
    document.addEventListener('keyup', OnKey, true);
    document.addEventListener('visibilitychange', OnVis);
    if (!world && mode === 'solo') { world = NewWorld(); world.solo = true; FillBots(world); }
    paused = false;
    ShowScreen(alive ? 'play' : 'start');
    lastTs = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(Loop);
  }

  function CloseGradeIo() {
    if (!root) return;
    root.style.display = 'none';
    cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener('resize', Resize);
    document.removeEventListener('keydown', OnKey, true);
    document.removeEventListener('keyup', OnKey, true);
    document.removeEventListener('visibilitychange', OnVis);
    tobs?.disconnect();
    ejecting = false;
    if (mode === 'lan') { net?.close(); net = null; world = null; mode = 'solo'; alive = false; snaps.length = 0; }
    else paused = true;
  }

  function ToggleGradeIo(gr) {
    if (root && root.style.display !== 'none') CloseGradeIo(); else OpenGradeIo(gr);
  }

  function BossKeyGradeIo() {
    if (!root) return false;
    if (root.dataset.bossHidden === '1') {
      root.style.display = 'flex';
      delete root.dataset.bossHidden;
      return true;
    }
    if (root.style.display !== 'none') {
      if (mode === 'solo' && screen === 'play') { paused = true; ShowScreen('pause'); }
      root.style.display = 'none';
      root.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeIo = OpenGradeIo;
  W.CloseGradeIo = CloseGradeIo;
  W.ToggleGradeIo = ToggleGradeIo;
  W.BossKeyGradeIo = BossKeyGradeIo;

  function InjectCSS() {
    if (document.getElementById('gf-io-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-io-css';
    s.textContent = `
#gf-io{--io-modal:#fff;--io-hdr:#f5f5f5;--io-scr:rgba(242,251,255,.55);--io-brd:rgba(56,189,248,.35);--io-brd2:#e0e0e0;--io-btn-brd:#d0d0d0;--io-txt:#111;--io-txt2:#555;--io-txt3:#999;--io-sh:0 8px 40px rgba(0,0,0,.18);position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:Ubuntu,"Segoe UI",Arial,sans-serif;}
#gf-io[data-theme="dark"]{--io-modal:#121212;--io-hdr:#0c0c0c;--io-scr:rgba(10,10,10,.5);--io-brd:rgba(56,189,248,.3);--io-brd2:#262626;--io-btn-brd:#333;--io-txt:#f5f5f5;--io-txt2:#cbd5e1;--io-txt3:#8a94a6;--io-sh:0 8px 40px rgba(0,0,0,.7);}
#gf-io-modal{display:flex;flex-direction:column;background:var(--io-modal);border:1px solid var(--io-brd);border-radius:12px;box-shadow:var(--io-sh);overflow:hidden;}
#gf-io-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:var(--io-hdr);border-bottom:1px solid var(--io-brd2);user-select:none;}
.gf-io-hl,.gf-io-hr{display:flex;align-items:center;gap:8px;}
#gf-io-logo{width:24px;height:24px;border-radius:6px;background:#38bdf8;color:#04121c;display:grid;place-items:center;font-size:10px;font-weight:800;}
#gf-io-title{font-size:13px;font-weight:700;color:var(--io-txt);}
.gf-io-best-box{display:flex;gap:8px;align-items:center;padding:4px 8px;border:1px solid var(--io-brd2);border-radius:7px;font-size:12px;color:var(--io-txt);}
.gf-io-best-box span{font-size:8px;font-weight:700;letter-spacing:1px;color:var(--io-txt3);}
#gf-io-pause-btn,#gf-io-close{width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--io-btn-brd);border-radius:6px;background:transparent;color:var(--io-txt3);cursor:pointer;font-size:11px;padding:0;}
#gf-io-pause-btn:hover{border-color:#38bdf8;color:#38bdf8;}
#gf-io-close:hover{border-color:#ef4444;color:#ef4444;}
#gf-io-body{position:relative;line-height:0;}
#gf-io-canvas{display:block;cursor:crosshair;touch-action:none;}
.gf-io-scr{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--io-scr);backdrop-filter:blur(2px);line-height:1.3;}
.gf-io-panel{width:min(360px,calc(100% - 32px));display:grid;gap:10px;padding:22px;border-radius:10px;background:var(--io-modal);border:1px solid var(--io-brd2);box-shadow:0 10px 40px rgba(0,0,0,.25);text-align:center;}
.gf-io-brand{font-size:40px;font-weight:800;color:var(--io-txt);letter-spacing:-1px;}
.gf-io-brand span{color:#38bdf8;}
#gf-io-name{padding:10px 12px;border:1px solid var(--io-brd2);border-radius:6px;background:var(--io-hdr);color:var(--io-txt);font:600 15px inherit;font-family:inherit;text-align:center;outline:none;}
#gf-io-name:focus{border-color:#38bdf8;}
.gf-io-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.gf-io-modes button{display:grid;gap:3px;padding:9px;border:1px solid var(--io-brd2);border-radius:7px;background:var(--io-hdr);color:var(--io-txt);font-family:inherit;cursor:pointer;text-align:center;}
.gf-io-modes button b{font-size:13px;}
.gf-io-modes button span{font-size:10px;color:var(--io-txt2);}
.gf-io-modes button.active{border-color:#38bdf8;box-shadow:inset 0 0 0 1px #38bdf8;background:rgba(56,189,248,.1);}
#gf-io-status{font-size:11px;color:#16a34a;min-height:15px;}
#gf-io-status.is-wait{color:var(--io-txt3);}
#gf-io-play,#gf-io-again,#gf-io-resume{padding:11px;border:0;border-radius:6px;background:#54c800;color:#fff;font:800 16px inherit;font-family:inherit;cursor:pointer;}
#gf-io-play:hover:not(:disabled),#gf-io-again:hover,#gf-io-resume:hover{background:#4ab300;}
#gf-io-play:disabled{background:#9ca3af;cursor:default;}
.gf-io-ghost{padding:8px;border:1px solid var(--io-brd2);border-radius:6px;background:none;color:var(--io-txt2);font:600 13px inherit;font-family:inherit;cursor:pointer;}
.gf-io-check{display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:var(--io-txt2);}
.gf-io-keys{font-size:11px;color:var(--io-txt3);line-height:1.5;}
#gf-io-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.gf-io-stat{display:grid;gap:2px;padding:8px 4px;border:1px solid var(--io-brd2);border-radius:6px;}
.gf-io-stat b{font-size:17px;color:var(--io-txt);}
.gf-io-stat span{font-size:9px;color:var(--io-txt3);text-transform:uppercase;letter-spacing:.4px;}
#gf-io-touch{position:absolute;right:14px;bottom:14px;gap:10px;}
#gf-io-touch button{width:62px;height:62px;border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(0,0,0,.35);color:#fff;font:800 13px inherit;font-family:inherit;}
`;
    document.head.appendChild(s);
  }
})(window);
