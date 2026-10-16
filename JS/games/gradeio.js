;(function (W) {
  'use strict';
  if (W.OpenGradeIo) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;
  const T = (k, vars) => { let s = _GameText(k); if (vars) for (const v in vars) s = s.replace(`{${v}}`, vars[v]); return s; };

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
  const VIRUS_KINDS = [13, 4, 2];
  const MOTHER_MASS = 150;
  const MOTHER_MAX = 320;
  const SPORE_MASS = 2;
  const SPORE_MAX = 44;
  const PELLET_MASS = [1, 3, 8];
  const POW_KEYS = ['speed', 'magnet', 'shield', 'mass'];
  const POW_TIME = [7, 9, 7, 0];
  const POW_COLORS = ['#f59e0b', '#a855f7', '#06b6d4', '#22c55e'];
  const POW_R = 26;
  const MAGNET = 150;
  const RUSH_TIME = 300;
  const VARIANTS = ['classic', 'rush', 'teams', 'royale'];
  const ROYALE_TIME = 240;
  const ZONE_MIN = 320;
  const EV_KEYS = ['feast', 'double', 'storm', 'rain'];
  const EV_TIME = [40, 30, 45, 20];
  const EV_COLORS = ['#f97316', '#eab308', '#84cc16', '#a855f7'];
  const EV_POOL = [0, 1, 2, 3], EV_POOL_Z = [0, 1, 3];
  const BOT_KINDS = 4;
  const TEAM_HUES = [212, 354, 134];
  const SKINS = 8;
  const STEP = 1 / 40;
  const SEND_MS = 50;
  const INTERP_MS = 80;
  const GRID = 256;
  const GCOLS = Math.ceil(SIZE / GRID);
  const TAU = Math.PI * 2;
  const LS_BEST = 'gf-io-best';
  const LS_NAME = 'gf-io-name';
  const LS_MASS = 'gf-io-show-mass';
  const LS_VAR = 'gf-io-variant';
  const LS_SKIN = 'gf-io-skin';
  const LS_HUE = 'gf-io-hue';
  const PELLET_COLORS = ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ef4444'];
  const BOT_NAMES = ['Wiskunde', 'Frans', 'Herexamen', 'B-attest', 'Deliberatie', '20/20', 'Strafstudie', 'Spiekbriefje', 'Toetsweek', 'Rapport', 'Huiswerk', 'Proefwerk', 'Uitmuntend', 'Op weg naar', 'Beginsituatie', 'Geschiedenis', 'Chemie', 'Fysica', 'Latijn', 'Biologie', 'Examen', 'Dagelijks werk', 'Nul op tien', 'Bisser', 'Turnzak', 'Klasraad', 'Speelplaats', 'Agenda', 'Lesrooster', 'Studie', 'Zomerwerk', 'Inhaaltoets'];

  let root = null, cv = null, ctx = null, dpr = 1, cw = 0, ch = 0, raf = 0, tobs = null;
  let mode = 'solo', screen = 'start', paused = false, showMass = true, grades = [];
  let variant = 'classic', netVariant = 'classic', mySkin = 0, myHue = 0, touchUi = false;
  let world = null, acc = 0, lastTs = 0, simAlpha = 0;
  let myId = 'me', myName = '', alive = false, deathStats = null;
  let mouse = { x: 0, y: 0, has: false }, ejecting = false, ejectTimer = 0, splitCount = 0, ejectCount = 0;
  let cam = { x: SIZE / 2, y: SIZE / 2, s: 1 }, zoom = 1, shake = 0, frameNo = 0;
  let net = null, lastFx = 0;
  const snaps = [];
  let pelletState = null, roster = new Map();
  let SPR = null, vig = null, vigW = 0, vigH = 0, vigD = false, vigR = 0, parked = false, BK = 1, BX = 0, BY = 0;
  const VIEW = { l: 0, t: 0, r: 0, b: 0 };
  const HITS = [];
  const seen = new Map(), seenNow = new Set();
  const FR = { cells: [], nc: 0, viruses: [], nv: 0, ejected: [], ne: 0, players: [], np: 0, pows: [], nw: 0, pellets: null, rt: 0, variant: 'classic', mine: null, mfx: [0, 0, 0], zone: [0, 0, 0, 0, 0], hasZone: false, ev: [0, 0, 0, 0], hasEv: false };
  const ITEMS = [], LB = [];
  const PARTS = Array.from({ length: 720 }, () => ({ on: false, k: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, s: 1, c: '#fff', a: 0, va: 0, tx: 0, ty: 0 }));
  const FLOATS = Array.from({ length: 24 }, () => ({ on: false, x: 0, y: 0, t: 0, life: 1, str: '', c: '#fff', s: 20 }));
  const TEAMSUM = [0, 0, 0];
  const DASH = [10, 8], NODASH = [];
  const toast = { str: '', sub: '', t: 0, c: '#38bdf8' };
  let partHead = 0, floatHead = 0;

  function LsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function LsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function Clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function Radius(m) { return Math.sqrt(m * 100); }
  function Speed(r) { return 1650 * Math.pow(r, -0.439); }
  function Rand(a, b) { return a + Math.random() * (b - a); }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function Mix(a, b, t) {
    const x = Hex(a), y = Hex(b);
    let s = '#';
    for (let i = 0; i < 3; i++) s += Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    return s;
  }
  function Rgba(c, a) { const x = Hex(c); return `rgba(${x[0]},${x[1]},${x[2]},${a})`; }

  const HC = new Array(360 * 5);
  const TONES = [[82, 54], [78, 36], [92, 72], [70, 26], [90, 62]];
  function Hc(h, t = 0) {
    h = (((h | 0) % 360) + 360) % 360;
    const i = h * 5 + t;
    return HC[i] || (HC[i] = `hsl(${h},${TONES[t][0]}%,${TONES[t][1]}%)`);
  }

  function Hash(seed, i, g) {
    let h = (seed ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(g + 7, 0x85ebca6b)) >>> 0;
    const next = () => {
      h = (h + 0x6d2b79f5) >>> 0;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const x = 30 + next() * (SIZE - 60), y = 30 + next() * (SIZE - 60), c = Math.floor(next() * PELLET_COLORS.length), q = next();
    return { x, y, c, k: q < 0.016 ? 2 : q < 0.085 ? 1 : 0 };
  }

  function NewPellets(seed, gens) {
    const st = { seed, gen: new Uint16Array(PELLETS), x: new Float32Array(PELLETS), y: new Float32Array(PELLETS), c: new Uint8Array(PELLETS), k: new Uint8Array(PELLETS), grid: Array.from({ length: GCOLS * GCOLS }, () => new Set()) };
    for (let i = 0; i < PELLETS; i++) Place(st, i, gens ? gens[i] : 0);
    return st;
  }

  function Bucket(x, y) { return Clamp(Math.floor(y / GRID), 0, GCOLS - 1) * GCOLS + Clamp(Math.floor(x / GRID), 0, GCOLS - 1); }

  function Place(st, i, g) {
    if (st.gen[i] === g && st.x[i]) return;
    if (st.x[i] || st.y[i]) st.grid[Bucket(st.x[i], st.y[i])].delete(i);
    const p = Hash(st.seed, i, g);
    st.gen[i] = g; st.x[i] = p.x; st.y[i] = p.y; st.c[i] = p.c; st.k[i] = p.k;
    st.grid[Bucket(p.x, p.y)].add(i);
  }

  function ForPellets(st, x, y, r, fn) {
    const x0 = Clamp(Math.floor((x - r) / GRID), 0, GCOLS - 1), x1 = Clamp(Math.floor((x + r) / GRID), 0, GCOLS - 1);
    const y0 = Clamp(Math.floor((y - r) / GRID), 0, GCOLS - 1), y1 = Clamp(Math.floor((y + r) / GRID), 0, GCOLS - 1);
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const i of st.grid[gy * GCOLS + gx]) if (fn(i) === false) return;
  }

  function NearPellets(st, x, y, r) {
    HITS.length = 0;
    const x0 = Clamp(Math.floor((x - r) / GRID), 0, GCOLS - 1), x1 = Clamp(Math.floor((x + r) / GRID), 0, GCOLS - 1);
    const y0 = Clamp(Math.floor((y - r) / GRID), 0, GCOLS - 1), y1 = Clamp(Math.floor((y + r) / GRID), 0, GCOLS - 1);
    const rr = r * r;
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const i of st.grid[gy * GCOLS + gx]) {
      const dx = st.x[i] - x, dy = st.y[i] - y;
      if (dx * dx + dy * dy < rr) HITS.push(i);
    }
    return HITS;
  }

  function Hue() { return Math.floor(Math.random() * 360); }

  function NewWorld(vr) {
    const w = { seed: (Math.random() * 4294967296) >>> 0, ep: Date.now(), tick: 0, nextId: 1, players: new Map(), cells: new Map(), viruses: new Map(), ejected: new Map(), pows: new Map(), events: [], fx: [], fxSeq: lastFx + 1, time: 0, variant: VARIANTS.includes(vr) ? vr : 'classic', roundEnd: RUSH_TIME, roundStart: 0, sporeN: 0, results: null, zone: null, ev: null, nextEv: Rand(40, 70) };
    if (w.variant === 'royale') w.zone = NewZone();
    w.pellets = NewPellets(w.seed);
    for (let k = 0; k < 3; k++) for (let i = 0; i < VIRUS_KINDS[k]; i++) AddVirus(w, Rand(300, SIZE - 300), Rand(300, SIZE - 300), 0, 0, k);
    for (let i = 0; i < PowCount(w); i++) AddPow(w);
    return w;
  }

  function NewZone() {
    const r0 = SIZE * 0.74;
    return { x: Rand(SIZE * 0.38, SIZE * 0.62), y: Rand(SIZE * 0.38, SIZE * 0.62), r0, r: r0 };
  }

  function PowCount(w) { return w.variant === 'rush' ? 9 : 5; }

  function AddVirus(w, x, y, vx = 0, vy = 0, k = 0) {
    const id = w.nextId++;
    w.viruses.set(id, { id, x, y, m: k === 2 ? MOTHER_MASS : VIRUS_MASS, fed: 0, vx, vy, px: x, py: y, k, h: Rand(0, TAU), cd: Rand(0, 1) });
  }

  function AddPow(w) {
    const s = SafeSpot(w), id = w.nextId++;
    w.pows.set(id, { id, x: s.x, y: s.y, k: Math.floor(Math.random() * POW_KEYS.length) });
  }

  function TopUp(w) {
    const have = [0, 0, 0];
    for (const v of w.viruses.values()) have[v.k]++;
    for (let k = 0; k < 3; k++) if (have[k] < VIRUS_KINDS[k] && Math.random() < (k === 2 ? 0.06 : 0.35)) { const s = SafeSpot(w); AddVirus(w, s.x, s.y, 0, 0, k); }
    if (w.pows.size < PowCount(w) && Math.random() < 0.12) AddPow(w);
  }

  function SafeSpot(w) {
    let best = null, bestD = -Infinity;
    const z = w.zone;
    for (let k = 0; k < 12; k++) {
      let x = Rand(200, SIZE - 200), y = Rand(200, SIZE - 200);
      if (z) { const a = Rand(0, TAU), d = Math.sqrt(Math.random()) * z.r * 0.7; x = Clamp(z.x + Math.cos(a) * d, 200, SIZE - 200); y = Clamp(z.y + Math.sin(a) * d, 200, SIZE - 200); }
      let d = Infinity;
      for (const c of w.cells.values()) if (c.m > 40) d = Math.min(d, Math.hypot(c.x - x, c.y - y) - Radius(c.m));
      for (const v of w.viruses.values()) d = Math.min(d, Math.hypot(v.x - x, v.y - y) - 120);
      if (d > bestD) { bestD = d; best = { x, y }; }
      if (d > 600) break;
    }
    return best;
  }

  function TeamFor(w) {
    const n = [0, 0, 0];
    for (const p of w.players.values()) if (p.team >= 0) n[p.team]++;
    let best = Math.floor(Math.random() * 3);
    for (let t = 0; t < 3; t++) if (n[t] < n[best]) best = t;
    return best;
  }

  function AddPlayer(w, id, name, bot, hue = Hue(), skin = 0) {
    const p = { id, name: String(name || '').slice(0, 15), hue, bot, skin: Clamp(skin | 0, 0, SKINS - 1), team: -1, fx: [0, 0, 0], cells: new Set(), target: { x: SIZE / 2, y: SIZE / 2 }, alive: false, splits: 0, ejects: 0, seenSplit: 0, seenEject: 0, respawnAt: 0, brain: bot ? { next: 0, mood: Math.random(), aim: null, kind: Math.floor(Math.random() * BOT_KINDS) } : null, stats: null };
    if (w.variant === 'teams') { p.team = TeamFor(w); p.hue = (TEAM_HUES[p.team] + Math.floor(Rand(-9, 9)) + 360) % 360; }
    w.players.set(id, p);
    return p;
  }

  function Spawn(w, p, mass = START_MASS) {
    for (const cid of p.cells) w.cells.delete(cid);
    p.cells.clear();
    const s = SafeSpot(w);
    if (w.variant === 'rush') mass = Math.max(mass, 30);
    AddCell(w, p, s.x, s.y, mass);
    p.alive = true;
    p.fx[0] = p.fx[1] = p.fx[2] = 0;
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

  function MergeDelay(w, m) { return (30 + m * 0.0233) * (w.variant === 'rush' ? 0.6 : 1); }

  function Split(w, p) {
    const list = [...p.cells].map(id => w.cells.get(id)).filter(Boolean).sort((a, b) => b.m - a.m);
    let count = p.cells.size;
    for (const c of list) {
      if (count >= MAX_CELLS) break;
      if (c.m < MIN_SPLIT) continue;
      const dx = p.target.x - c.x, dy = p.target.y - c.y, d = Math.hypot(dx, dy) || 1;
      const half = c.m / 2;
      c.m = half;
      c.mergeAt = w.time + MergeDelay(w, half);
      const r = Radius(half), v = Math.max(900, Speed(r) * 3.6);
      AddCell(w, p, c.x + dx / d * r * 0.5, c.y + dy / d * r * 0.5, half, dx / d * v, dy / d * v, MergeDelay(w, half));
      count++;
    }
  }

  function Eject(w, p) {
    for (const id of p.cells) {
      const c = w.cells.get(id);
      if (!c || c.m < MIN_EJECT) continue;
      const dx = p.target.x - c.x, dy = p.target.y - c.y;
      const r = Radius(c.m);
      c.m -= EJECT_LOSS;
      const a = Math.atan2(dy, dx) + Rand(-0.18, 0.18);
      const eid = w.nextId++;
      w.ejected.set(eid, { id: eid, x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, px: c.x, py: c.y, m: EJECT_MASS, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, hue: p.hue, owner: p.id, born: w.time, sp: 0 });
    }
  }

  function PopVirus(w, p, c, gain) {
    Emit(w, 1, c.x, c.y, p.hue, gain, p.id);
    const free = MAX_CELLS - p.cells.size;
    if (free <= 0) return;
    const total = c.m;
    const n = Math.min(free, Math.max(1, Math.floor(total / 36)));
    const each = Math.ceil(total * (n >= 6 ? 0.62 : 0.5) / n * 1024) / 1024;
    const rc = Radius(total - each * n), re = Radius(each);
    const a0 = Rand(0, TAU), v = (rc * 0.55 + re * 0.7) * 4.2;
    let used = 0;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + Rand(-0.15, 0.15);
      AddCell(w, p, c.x + Math.cos(a) * rc * 0.25, c.y + Math.sin(a) * rc * 0.25, each, Math.cos(a) * v, Math.sin(a) * v, MergeDelay(w, each));
      used += each;
    }
    c.m = total - used;
    c.mergeAt = w.time + MergeDelay(w, c.m);
  }

  function Power(w, p, c, u) {
    let gain = 0;
    if (u.k === 3) { gain = Math.round(Clamp(Score(w, p) * 0.12, 40, 300)); c.m += gain; }
    else p.fx[u.k] = w.time + POW_TIME[u.k];
    Emit(w, 3, u.x, u.y, u.k, gain, p.id);
  }

  function Emit(w, type, x, y, a, val, owner) {
    const e = [w.fxSeq++, type, Math.round(x), Math.round(y), a, Math.round(val), owner];
    w.fx.push([w.tick, e]);
    if (w === world) PlayFx(e);
  }

  function Kill(w, p, by, rank) {
    p.alive = false;
    p.respawnAt = w.time + (p.bot && !w.zone ? Rand(1.5, 4) : Infinity);
    if (!p.bot && p.stats) {
      let place = 0;
      if (w.zone && !rank) { place = 1; for (const q of w.players.values()) if (q.alive) place++; }
      const stats = { ...p.stats, alive: w.time - p.stats.born, by: by ? w.players.get(by)?.name || '' : '', round: rank || 0, res: rank ? w.results : null, place, vr: w.variant };
      if (p.id === myId && w === world) OnDeath(stats);
      else net?.send(p.id, { t: 'dead', stats }, true);
    }
  }

  function EndRound(w) {
    const lb = [...w.players.values()].filter(p => p.alive).sort((a, b) => Score(w, b) - Score(w, a));
    w.results = lb.slice(0, 5).map(p => [p.name, Math.floor(Score(w, p)), p.hue]);
    lb.forEach((p, i) => {
      if (p.stats) p.stats.top = Math.max(p.stats.top, Score(w, p));
      for (const id of p.cells) w.cells.delete(id);
      p.cells.clear();
      Kill(w, p, '', i + 1);
    });
    w.ejected.clear();
    w.sporeN = 0;
    w.roundEnd = w.time + RUSH_TIME;
    w.roundStart = w.time;
    if (w.zone) {
      w.zone = NewZone();
      for (const p of w.players.values()) if (p.bot) p.respawnAt = w.time + Rand(0.5, 2.5);
    }
    Emit(w, 5, SIZE / 2, SIZE / 2, VARIANTS.indexOf(w.variant), 0, '');
  }

  function StartEvent(w) {
    const pool = w.zone ? EV_POOL_Z : EV_POOL;
    const kk = pool[Math.floor(Math.random() * pool.length)];
    const s = SafeSpot(w);
    w.ev = { k: kk, until: w.time + EV_TIME[kk], x: s.x, y: s.y };
    if (kk === 0) for (let i = 0; i < 44; i++) {
      const a = Rand(0, TAU), d = Math.sqrt(Math.random()) * 380, id = w.nextId++;
      const x = Clamp(s.x + Math.cos(a) * d, 20, SIZE - 20), y = Clamp(s.y + Math.sin(a) * d, 20, SIZE - 20);
      w.ejected.set(id, { id, x, y, px: x, py: y, m: 4, vx: 0, vy: 0, hue: Math.floor(Math.random() * 12), owner: '', born: w.time, sp: -2 });
    } else if (kk === 2) for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      AddVirus(w, Clamp(s.x + Math.cos(a) * 520, 100, SIZE - 100), Clamp(s.y + Math.sin(a) * 520, 100, SIZE - 100), 0, 0, 1);
      const v = [...w.viruses.values()].pop();
      v.h = a + Math.PI / 2; v.ttl = w.ev.until;
    } else if (kk === 3) for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU, id = w.nextId++;
      w.pows.set(id, { id, x: Clamp(s.x + Math.cos(a) * 340, 100, SIZE - 100), y: Clamp(s.y + Math.sin(a) * 340, 100, SIZE - 100), k: i % POW_KEYS.length });
    }
    Emit(w, 6, s.x, s.y, kk, 0, '');
  }

  function EndEvent(w) {
    for (const v of w.viruses.values()) if (v.ttl) w.viruses.delete(v.id);
    w.ev = null;
    w.nextEv = w.time + Rand(55, 95);
  }

  function Score(w, p) {
    let m = 0;
    for (const id of p.cells) m += w.cells.get(id)?.m || 0;
    return m;
  }

  function SameTeam(a, b) { return a.team >= 0 && a.team === b.team; }

  function Step(w, dt) {
    w.time += dt;
    w.tick++;
    if (w.variant === 'rush' && w.time >= w.roundEnd) EndRound(w);
    if (w.zone) {
      const z = w.zone, f = Clamp((w.time - w.roundStart - 25) / (ROYALE_TIME - 70), 0, 1);
      z.r = z.r0 + (ZONE_MIN - z.r0) * f;
      let n = 0;
      for (const p of w.players.values()) if (p.alive) n++;
      if ((n <= 1 && w.time - w.roundStart > 30) || w.time - w.roundStart > ROYALE_TIME + 25) EndRound(w);
    }
    if (!w.ev && w.time >= w.nextEv) StartEvent(w);
    else if (w.ev && w.time >= w.ev.until) EndEvent(w);
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
      const sp = Speed(r) * Math.min(1, d / (r * 0.5 + 30)) * (p.fx[0] > w.time ? 1.55 : 1);
      if (d > 0.5) { c.x += dx / d * sp * dt; c.y += dy / d * sp * dt; }
      c.x += c.bvx * dt; c.y += c.bvy * dt;
      const decay = Math.exp(-dt * 4.2);
      c.bvx *= decay; c.bvy *= decay;
      if (c.m > 50) c.m = Math.max(50, c.m * (1 - 0.003 * dt));
      if (c.m > MAX_MASS) {
        if (p.cells.size < MAX_CELLS) {
          const half = c.m / 2, a = Rand(0, TAU);
          c.m = half;
          c.mergeAt = w.time + MergeDelay(w, half);
          AddCell(w, p, c.x, c.y, half, Math.cos(a) * 600, Math.sin(a) * 600, MergeDelay(w, half));
        } else c.m = MAX_MASS;
      }
      const rr = r * 0.5;
      c.x = Clamp(c.x, rr, SIZE - rr); c.y = Clamp(c.y, rr, SIZE - rr);
      if (w.zone && Math.hypot(c.x - w.zone.x, c.y - w.zone.y) > w.zone.r) {
        c.m -= (c.m * 0.07 + 3) * dt;
        if (c.m < 6) { w.cells.delete(c.id); p.cells.delete(c.id); if (!p.cells.size) Kill(w, p, ''); }
      }
    }
    for (const e of w.ejected.values()) {
      if (e.sp && w.time - e.born > 40) { w.ejected.delete(e.id); if (e.sp !== -2) w.sporeN--; continue; }
      e.px = e.x; e.py = e.y;
      e.x += e.vx * dt; e.y += e.vy * dt;
      const decay = Math.exp(-dt * 5.5);
      e.vx *= decay; e.vy *= decay;
      e.x = Clamp(e.x, 10, SIZE - 10); e.y = Clamp(e.y, 10, SIZE - 10);
    }
    for (const v of w.viruses.values()) {
      v.px = v.x; v.py = v.y;
      if (v.k === 1) {
        v.h += Rand(-0.7, 0.7) * dt;
        if (v.x < 400 || v.x > SIZE - 400 || v.y < 400 || v.y > SIZE - 400) {
          const want = Math.atan2(SIZE / 2 - v.y, SIZE / 2 - v.x);
          v.h += Math.sin(want - v.h) * dt * 1.5;
        }
        v.x += Math.cos(v.h) * 58 * dt; v.y += Math.sin(v.h) * 58 * dt;
      } else if (v.k === 2) {
        v.m = Math.min(MOTHER_MAX, v.m + 1.4 * dt);
        v.cd -= dt;
        if (v.cd <= 0 && w.sporeN < SPORE_MAX) {
          v.cd = Rand(0.45, 0.85);
          const a = Rand(0, TAU), rv = Radius(v.m) + 6, s = Rand(260, 520), id = w.nextId++;
          const x = v.x + Math.cos(a) * rv, y = v.y + Math.sin(a) * rv;
          w.ejected.set(id, { id, x, y, px: x, py: y, m: SPORE_MASS, vx: Math.cos(a) * s, vy: Math.sin(a) * s, hue: 320 + Math.floor(Rand(0, 30)), owner: '', born: w.time, sp: v.id });
          w.sporeN++;
        }
      }
      if (v.vx || v.vy) {
        v.x += v.vx * dt; v.y += v.vy * dt;
        const decay = Math.exp(-dt * 3.2);
        v.vx *= decay; v.vy *= decay;
        if (Math.abs(v.vx) + Math.abs(v.vy) < 5) v.vx = v.vy = 0;
      }
      v.x = Clamp(v.x, 60, SIZE - 60); v.y = Clamp(v.y, 60, SIZE - 60);
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
      const er = p.fx[1] > w.time ? r + MAGNET : r;
      const hits = NearPellets(w.pellets, c.x, c.y, er);
      for (let h = 0; h < hits.length; h++) {
        const i = hits[h];
        c.m += PELLET_MASS[w.pellets.k[i]] * (w.ev && w.ev.k === 1 ? 2 : 1);
        if (p.stats) p.stats.food++;
        if (w === world) Fly(w.pellets.x[i], w.pellets.y[i], c.x, c.y, PELLET_COLORS[w.pellets.c[i]]);
        const g = (w.pellets.gen[i] + 1) & 0xffff;
        Place(w.pellets, i, g);
        w.events.push([w.tick, i, g]);
      }
      for (const e of w.ejected.values()) {
        if (e.owner === c.owner && w.time - e.born < 0.35) continue;
        if (c.m < e.m * 1.25) continue;
        const dx = e.x - c.x, dy = e.y - c.y, lim = er - 4;
        if (dx * dx + dy * dy < lim * lim) {
          c.m += e.m;
          if (e.sp) { if (e.sp !== -2) w.sporeN--; if (w === world) Fly(e.x, e.y, c.x, c.y, e.sp === -2 ? PELLET_COLORS[e.hue % 12] : '#f472b6'); }
          w.ejected.delete(e.id);
        }
      }
      for (const v of w.viruses.values()) {
        const rv = Radius(v.m);
        const d = Math.hypot(v.x - c.x, v.y - c.y);
        if (c.m >= v.m * 1.33 && d < r - rv * 0.35) {
          w.viruses.delete(v.id);
          c.m += v.m;
          if (v.k === 2) Emit(w, 4, v.x, v.y, 330, v.m, p.id);
          else PopVirus(w, p, c, v.m);
          break;
        }
      }
      for (const u of w.pows.values()) {
        const dx = u.x - c.x, dy = u.y - c.y, lim = r + POW_R * 0.5;
        if (dx * dx + dy * dy < lim * lim) { w.pows.delete(u.id); Power(w, p, c, u); }
      }
      for (const o of cells) {
        if (o === c || o.owner === c.owner || !w.cells.has(o.id) || c.m < o.m * 1.25) continue;
        const op = w.players.get(o.owner);
        if (SameTeam(p, op) || op.fx[2] > w.time) continue;
        const ro = Radius(o.m);
        const dx = o.x - c.x, dy = o.y - c.y;
        const lim = r - ro * 0.35;
        if (lim > 0 && dx * dx + dy * dy < lim * lim) {
          c.m += o.m;
          w.cells.delete(o.id);
          op.cells.delete(o.id);
          Emit(w, 2, o.x, o.y, op.hue, o.m, p.id);
          if (p.stats) p.stats.eaten++;
          if (!op.cells.size) Kill(w, op, p.id);
        }
      }
    }
    for (const e of w.ejected.values()) {
      if (e.sp) continue;
      for (const v of w.viruses.values()) {
        const rv = Radius(v.m);
        if (Math.hypot(e.x - v.x, e.y - v.y) < rv) {
          w.ejected.delete(e.id);
          v.m += EJECT_MASS;
          if (v.k !== 2 && ++v.fed >= 7) {
            v.m = VIRUS_MASS; v.fed = 0;
            const sp = Math.hypot(e.vx, e.vy) || 1;
            if (w.viruses.size < 40) AddVirus(w, v.x, v.y, e.vx / sp * 1300, e.vy / sp * 1300);
          } else if (v.k === 2) v.m = Math.min(MOTHER_MAX + 80, v.m);
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
    if (w.tick % 40 === 0) TopUp(w);
    const cutoff = w.tick - 12;
    while (w.events.length && w.events[0][0] < cutoff) w.events.shift();
    while (w.fx.length && w.fx[0][0] < cutoff) w.fx.shift();
  }

  function Think(w, p) {
    const b = p.brain;
    b.next = w.time + Rand(0.08, 0.16);
    let main = null;
    for (const id of p.cells) { const c = w.cells.get(id); if (c && (!main || c.m > main.m)) main = c; }
    if (!main) return;
    const r = Radius(main.m);
    const kind = b.kind;
    const sight = (420 + r * 4) * (kind === 0 ? 1.15 : 1);
    const shielded = p.fx[2] > w.time, fast = p.fx[0] > w.time;
    const z = w.zone;
    if (z) {
      const dz = Math.hypot(main.x - z.x, main.y - z.y);
      if (dz > z.r - r - 160) { p.target = { x: z.x + (main.x - z.x) * 0.2, y: z.y + (main.y - z.y) * 0.2 }; return; }
    }
    let fx = 0, fy = 0, prey = null, preyScore = 0, thr = null;
    for (const o of w.cells.values()) {
      if (o.owner === p.id) continue;
      const op = w.players.get(o.owner);
      if (SameTeam(p, op)) continue;
      const dx = o.x - main.x, dy = o.y - main.y, d = Math.hypot(dx, dy) || 1;
      if (d > sight) continue;
      const ro = Radius(o.m);
      if (o.m > main.m * 1.25) {
        if (shielded) continue;
        if (!thr || o.m > thr.m) thr = o;
        const k = (o.m / main.m) * 1600 / Math.max(40, d - ro - r * 0.4);
        fx -= dx / d * k; fy -= dy / d * k;
      } else if (main.m > o.m * 1.25 && !(op.fx[2] > w.time)) {
        const s = o.m / Math.max(60, d) * (fast ? 1.6 : 1);
        if (s > preyScore) { preyScore = s; prey = o; }
      }
    }
    let hide = null, hideD = 460, farm = null;
    for (const v of w.viruses.values()) {
      const dx = v.x - main.x, dy = v.y - main.y, d = Math.hypot(dx, dy) || 1;
      if (v.k === 2) {
        if (main.m > v.m * 1.4 && d < sight) { const s = v.m / Math.max(60, d) * 0.8; if (s > preyScore) { preyScore = s; prey = v; } }
        else if (d < 900 && main.m < v.m) farm = v;
        continue;
      }
      if (main.m > v.m * 1.33 && p.cells.size < MAX_CELLS - 2) {
        if (d < r + 200) { const k = 900 / Math.max(30, d - r); fx -= dx / d * k; fy -= dy / d * k; }
      } else if (main.m < v.m * 0.9 && d < hideD) { hideD = d; hide = v; }
    }
    if (kind === 3 && thr && thr.m > VIRUS_MASS * 1.45 && main.m > 55 && main.m < VIRUS_MASS * 1.3) {
      const ta = Math.atan2(thr.y - main.y, thr.x - main.x), td = Math.hypot(thr.x - main.x, thr.y - main.y);
      for (const v of w.viruses.values()) {
        if (v.k === 2) continue;
        const vd = Math.hypot(v.x - main.x, v.y - main.y);
        if (vd > 520 || vd > td) continue;
        const da = Math.abs(Math.atan2(Math.sin(Math.atan2(v.y - main.y, v.x - main.x) - ta), Math.cos(Math.atan2(v.y - main.y, v.x - main.x) - ta)));
        if (da < 0.3) { p.target = { x: v.x, y: v.y }; if (vd < r + 260 && Math.random() < 0.7) p.ejects++; return; }
      }
    }
    const flee = Math.hypot(fx, fy);
    if (flee > (6 + b.mood * 6) * (kind === 2 ? 0.45 : kind === 0 ? 1.7 : 1)) {
      if (hide && (kind === 2 || (hide.x - main.x) * fx + (hide.y - main.y) * fy > -hideD * flee * 0.3)) p.target = { x: hide.x, y: hide.y };
      else p.target = { x: Clamp(main.x + fx / flee * 600, 0, SIZE), y: Clamp(main.y + fy / flee * 600, 0, SIZE) };
      return;
    }
    let pw = null, pd = (kind === 1 ? 800 : 520) + r;
    for (const u of w.pows.values()) { const d = Math.hypot(u.x - main.x, u.y - main.y); if (d < pd) { pd = d; pw = u; } }
    if (pw && (!prey || pd < 260 + r)) { p.target = { x: pw.x, y: pw.y }; return; }
    if (prey && preyScore > (kind === 0 ? 0.03 : kind === 1 ? 0.09 : 0.04)) {
      p.target = { x: prey.x, y: prey.y };
      const d = Math.hypot(prey.x - main.x, prey.y - main.y);
      if (prey.owner && main.m > prey.m * 2.7 && p.cells.size <= 2 && d < r * 3.2 && d > r * 0.8 && Math.random() < 0.35 + b.mood * 0.3 + (w.variant === 'rush' ? 0.2 : 0) + (kind === 0 ? 0.25 : kind === 1 ? -0.25 : 0)) p.splits++;
      return;
    }
    if (farm && main.m < (kind === 1 ? 320 : 220)) {
      let best = null, bestD = 420;
      for (const e of w.ejected.values()) {
        if (e.sp !== farm.id) continue;
        const d = Math.hypot(e.x - main.x, e.y - main.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) { p.target = { x: best.x, y: best.y }; return; }
    }
    if (w.ev && w.ev.k === 0 && Math.hypot(w.ev.x - main.x, w.ev.y - main.y) < (kind === 1 ? 1600 : 900)) {
      let best = null, bestD = 600;
      for (const e of w.ejected.values()) {
        if (e.sp !== -2) continue;
        const d = Math.hypot(e.x - main.x, e.y - main.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      p.target = best ? { x: best.x, y: best.y } : { x: w.ev.x, y: w.ev.y };
      return;
    }
    if (!b.aim || Math.random() < 0.06 || Math.hypot(b.aim.x - main.x, b.aim.y - main.y) < r) {
      let best = null, bestD = Infinity;
      ForPellets(w.pellets, main.x, main.y, 520, i => {
        const d = (Math.hypot(w.pellets.x[i] - main.x, w.pellets.y[i] - main.y) + Rand(0, 120)) / (1 + w.pellets.k[i] * 1.2);
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
      const p = AddPlayer(w, 'b' + w.nextId++, name, true, Hue(), Math.random() < 0.45 ? 0 : 1 + Math.floor(Math.random() * (SKINS - 1)));
      Spawn(w, p, START_MASS + Math.random() * 60);
    }
    for (let i = want; i < bots.length; i++) {
      for (const cid of bots[i].cells) w.cells.delete(cid);
      w.players.delete(bots[i].id);
    }
  }

  function FxOf(w, p) {
    if (!(p.fx[0] > w.time || p.fx[1] > w.time || p.fx[2] > w.time)) return 0;
    return p.fx.map(t => Math.max(0, Math.round((t - w.time) * 10) / 10));
  }

  function SnapshotOf(w) {
    const pl = [];
    for (const p of w.players.values()) {
      const cells = [];
      for (const id of p.cells) { const c = w.cells.get(id); if (c) cells.push(c.id, Math.round(c.x), Math.round(c.y), Math.round(c.m * 10) / 10); }
      pl.push([p.id, p.alive ? 1 : 0, cells, FxOf(w, p), Math.round(Score(w, p) * 10) / 10]);
    }
    const v = [...w.viruses.values()].map(x => [x.id, Math.round(x.x), Math.round(x.y), Math.round(x.m), x.k]);
    const e = [...w.ejected.values()].map(x => [x.id, Math.round(x.x), Math.round(x.y), x.hue, x.m]);
    const pw = [...w.pows.values()].map(x => [x.id, Math.round(x.x), Math.round(x.y), x.k]);
    return { t: 'st', k: w.tick, p: pl, v, e, pw, pe: w.events.map(x => [x[1], x[2]]), fx: w.fx.map(x => x[1]), vr: VARIANTS.indexOf(w.variant), rt: w.variant === 'rush' ? Math.round((w.roundEnd - w.time) * 10) / 10 : 0, z: w.zone ? ZoneOf(w) : 0, ev: w.ev ? [w.ev.k, Math.round((w.ev.until - w.time) * 10) / 10, Math.round(w.ev.x), Math.round(w.ev.y)] : 0 };
  }

  function ZoneOf(w) {
    let n = 0;
    for (const p of w.players.values()) if (p.alive) n++;
    const z = w.zone;
    return [Math.round(z.x), Math.round(z.y), Math.round(z.r), n, Math.round(Math.max(0, w.roundStart + ROYALE_TIME - 45 - w.time)), Math.round(z.r0)];
  }

  function RosterOf(w) {
    return [...w.players.values()].map(p => [p.id, p.name, p.hue, p.bot ? 1 : 0, p.skin, p.team]);
  }

  function SyncOf(w) {
    return { t: 'sync', ep: w.ep, seed: w.pellets.seed, gens: [...w.pellets.gen], roster: RosterOf(w), vr: VARIANTS.indexOf(w.variant) };
  }

  function WorldFromSnapshot(snap) {
    const w = { seed: pelletState.seed, ep: net.hostEp || Date.now(), tick: snap.k, nextId: 1, players: new Map(), cells: new Map(), viruses: new Map(), ejected: new Map(), pows: new Map(), events: [], fx: [], fxSeq: lastFx + 1000, time: 0, pellets: pelletState, variant: VARIANTS[snap.vr] || 'classic', roundEnd: snap.rt || RUSH_TIME, roundStart: 0, sporeN: 0, results: null, zone: null, ev: null, nextEv: 30 };
    if (Array.isArray(snap.ev)) w.ev = { k: snap.ev[0], until: snap.ev[1], x: snap.ev[2], y: snap.ev[3] };
    if (Array.isArray(snap.z)) { const [x, y, r, , left, r0] = snap.z; w.zone = { x, y, r, r0: r0 || r }; w.roundStart = Math.min(0, left + 45 - ROYALE_TIME); }
    let maxId = 0;
    for (const [id, name, hue, bot, skin, team] of roster.values()) {
      const q = AddPlayer(w, id, name, !!bot, hue, skin || 0);
      if (Number.isInteger(team) && team >= 0 && team < 3) { q.team = team; q.hue = hue; } else if (w.variant !== 'teams') q.team = -1;
    }
    for (const [pid, aliveFlag, flat, fx] of snap.p) {
      const p = w.players.get(pid) || AddPlayer(w, pid, 'Speler', false);
      for (let i = 0; i < flat.length; i += 4) {
        const c = { id: flat[i], owner: pid, x: flat[i + 1], y: flat[i + 2], px: flat[i + 1], py: flat[i + 2], m: flat[i + 3], bvx: 0, bvy: 0, mergeAt: 8, born: -1 };
        w.cells.set(c.id, c);
        p.cells.add(c.id);
        maxId = Math.max(maxId, c.id);
      }
      if (Array.isArray(fx)) for (let k = 0; k < 3; k++) p.fx[k] = fx[k] > 0 ? fx[k] : 0;
      p.alive = !!aliveFlag && p.cells.size > 0;
      if (p.alive) p.stats = { born: 0, food: 0, eaten: 0, top: Score(w, p), best: 99, lbTime: 0 };
      if (p.bot && !p.alive) p.respawnAt = 1;
    }
    for (const [id, x, y, m, k] of snap.v) { w.viruses.set(id, { id, x, y, px: x, py: y, m, fed: 0, vx: 0, vy: 0, k: k || 0, h: Rand(0, TAU), cd: 0 }); maxId = Math.max(maxId, id); }
    for (const [id, x, y, hue, m] of snap.e) {
      const sp = m && m < EJECT_MASS ? (m === 4 ? -2 : -1) : 0;
      w.ejected.set(id, { id, x, y, px: x, py: y, m: m || EJECT_MASS, vx: 0, vy: 0, hue, owner: '', born: 0, sp });
      if (sp === -1) w.sporeN++;
      maxId = Math.max(maxId, id);
    }
    for (const [id, x, y, k] of snap.pw || []) { w.pows.set(id, { id, x, y, k }); maxId = Math.max(maxId, id); }
    w.nextId = maxId + 1;
    return w;
  }

  function Net() {
    const self = { port: null, selfId: '', status: 'discovering', peers: new Map(), dead: new Set(), host: '', hostEp: 0, hostAt: 0, ready: false, lastSend: 0, lastSnapAt: 0 };
    const post = m => { try { self.port?.postMessage(m); } catch (_) {} };
    self.send = (to, data, rel = true) => post({ kind: 'send', to, data, rel });
    self.rename = name => post({ kind: 'rename', name });
    self.elect = () => {
      let best = self.selfId;
      for (const id of self.peers.keys()) if (!self.dead.has(id) && id < best) best = id;
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

  function MeId() { return IsHost() ? myId : net?.selfId; }

  function BecomeHost() {
    if (!world) {
      const last = snaps[snaps.length - 1];
      world = last && pelletState ? WorldFromSnapshot(last.data) : NewWorld(variant);
      pelletState = world.pellets;
    }
    net.hostEp = world.ep;
    net.ready = true;
    netVariant = world.variant;
    myId = net.selfId;
    if (!world.players.has(myId)) AddPlayer(world, myId, myName, false, myHue, mySkin);
    else world.players.get(myId).name = myName;
    for (const id of net.peers.keys()) if (!world.players.has(id)) AddPlayer(world, id, net.peers.get(id).name, false);
    for (const p of [...world.players.values()]) if (!p.bot && p.id !== myId && !net.peers.has(p.id)) { for (const c of p.cells) world.cells.delete(c); world.players.delete(p.id); }
    FillBots(world);
    alive = !!world.players.get(myId)?.alive;
    net.send(null, SyncOf(world), true);
  }

  function SetHost(id, ep) {
    const prev = net.host;
    net.host = id;
    net.hostEp = ep;
    net.hostAt = net.lastSnapAt = performance.now();
    if (id === net.selfId) return BecomeHost();
    if (prev === net.selfId) { if (world) lastFx = world.fxSeq; world = null; snaps.length = 0; net.pendingSpawn = alive; }
    net.ready = !!pelletState;
  }

  function Rehost() {
    if (!net?.selfId || net.status === 'offline' || (net.host && !net.dead.has(net.host))) return;
    SetHost(net.elect(), net.hostEp);
    UpdateLobby();
  }

  function OnNet(m) {
    if (!net) return;
    if (m.kind === 'status') {
      if (!net.selfId) net.selfId = m.selfId;
      net.status = m.status;
      if (m.status === 'online' && !net.host) setTimeout(() => { if (net?.status === 'online') Rehost(); }, 4000);
      UpdateLobby();
    } else if (m.kind === 'peer') {
      net.peers.set(m.id, { name: m.name });
      if (IsHost() && world) {
        if (!world.players.has(m.id)) AddPlayer(world, m.id, m.name, false);
        FillBots(world);
        net.send(m.id, SyncOf(world), true);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
      }
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
      if (net.host === m.id) { net.host = ''; Rehost(); }
      UpdateLobby();
    } else if (m.kind === 'msg') OnPeerData(m.id, m.data);
  }

  function OnPeerData(from, d) {
    if (!d || typeof d !== 'object') return;
    net.dead.delete(from);
    if (d.t === 'sync' && from !== net.host) {
      const ep = Number(d.ep) || 0;
      const held = net.host && !net.dead.has(net.host) && (IsHost() || net.ready);
      if (held && !(ep < net.hostEp || (ep === net.hostEp && from < net.host))) {
        if (IsHost() && world) net.send(from, SyncOf(world), true);
        return;
      }
      SetHost(from, ep);
    }
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
        if (Number.isFinite(d.sk)) q.skin = Clamp(d.sk | 0, 0, SKINS - 1);
        if (Number.isFinite(d.hu) && q.team < 0) q.hue = Clamp(d.hu | 0, 0, 359);
        Spawn(world, q);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
      }
      return;
    }
    if (from !== net.host) return;
    if (d.t === 'sync') {
      pelletState = NewPellets(d.seed >>> 0, d.gens);
      roster = new Map(d.roster.map(r => [r[0], r]));
      netVariant = VARIANTS[d.vr] || 'classic';
      net.ready = true;
      if (net.pendingSpawn) { net.pendingSpawn = false; net.send(net.host, SpawnMsg(), true); }
      UpdateLobby();
    } else if (d.t === 'roster') {
      roster = new Map(d.roster.map(r => [r[0], r]));
    } else if (d.t === 'st' && pelletState) {
      for (const [i, g] of d.pe) if (i >= 0 && i < PELLETS && ((g - pelletState.gen[i]) & 0xffff) < 0x8000 && pelletState.gen[i] !== g) {
        const x = pelletState.x[i], y = pelletState.y[i];
        if (InView(x, y)) { const c = NearestCell(x, y); if (c) Fly(x, y, c.x, c.y, PELLET_COLORS[pelletState.c[i]]); }
        Place(pelletState, i, g);
      }
      if (Array.isArray(d.fx) && d.fx.length) {
        if (d.fx[d.fx.length - 1][0] < lastFx - 500) lastFx = d.fx[0][0] - 1;
        for (const e of d.fx) if (e[0] > lastFx) { lastFx = e[0]; PlayFx(e); }
      }
      d.ci = new Map(); d.vi = new Map(); d.ei = new Map();
      for (const pl of d.p) { const f = pl[2]; for (let k = 0; k < f.length; k += 4) d.ci.set(f[k], f[k + 1] * 8192 + f[k + 2]); }
      for (const v of d.v) d.vi.set(v[0], v[1] * 8192 + v[2]);
      for (const e of d.e) d.ei.set(e[0], e[1] * 8192 + e[2]);
      if (Number.isInteger(d.vr)) netVariant = VARIANTS[d.vr] || 'classic';
      net.lastSnapAt = performance.now();
      snaps.push({ at: net.lastSnapAt, data: d });
      while (snaps.length > 12) snaps.shift();
      const me = d.p.find(x => x[0] === net.selfId);
      if (me && me[1] && !alive && screen === 'play') alive = true;
    } else if (d.t === 'dead') {
      if (alive) OnDeath(d.stats || {});
    }
  }

  function SpawnMsg() { return { t: 'spawn', name: myName, s: splitCount, w: ejectCount, sk: mySkin, hu: myHue }; }

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

  function Slot(arr, i) { return arr[i] || (arr[i] = { id: 0, owner: '', x: 0, y: 0, m: 0, hue: 0, name: '', skin: 0, team: -1, sh: false, sp: false, mg: false, isV: false, k: 0, score: 0, n: 0 }); }

  function Frame() {
    FR.nc = FR.nv = FR.ne = FR.np = FR.nw = 0;
    FR.mine = null;
    FR.mfx[0] = FR.mfx[1] = FR.mfx[2] = 0;
    FR.pellets = null;
    const me = MeId();
    if (IsHost() && world) {
      const a = simAlpha, wt = world.time;
      for (const c of world.cells.values()) {
        const p = world.players.get(c.owner);
        const o = Slot(FR.cells, FR.nc++);
        o.id = c.id; o.owner = c.owner; o.x = c.px + (c.x - c.px) * a; o.y = c.py + (c.y - c.py) * a; o.m = c.m;
        o.hue = p.hue; o.name = p.name; o.skin = p.skin; o.team = p.team; o.isV = false;
        o.sp = p.fx[0] > wt; o.mg = p.fx[1] > wt; o.sh = p.fx[2] > wt;
      }
      for (const v of world.viruses.values()) { const o = Slot(FR.viruses, FR.nv++); o.id = v.id; o.x = v.px + (v.x - v.px) * a; o.y = v.py + (v.y - v.py) * a; o.m = v.m; o.k = v.k; o.isV = true; }
      for (const e of world.ejected.values()) { const o = Slot(FR.ejected, FR.ne++); o.x = e.px + (e.x - e.px) * a; o.y = e.py + (e.y - e.py) * a; o.hue = e.hue; o.m = e.m; }
      for (const u of world.pows.values()) { const o = Slot(FR.pows, FR.nw++); o.id = u.id; o.x = u.x; o.y = u.y; o.k = u.k; }
      for (const p of world.players.values()) {
        if (!p.alive) continue;
        const o = Slot(FR.players, FR.np++);
        o.id = p.id; o.name = p.name; o.score = Score(world, p); o.hue = p.hue; o.team = p.team; o.n = p.cells.size;
        if (p.id === me) { FR.mine = o; for (let k = 0; k < 3; k++) FR.mfx[k] = Math.max(0, p.fx[k] - wt); }
      }
      FR.rt = world.variant === 'rush' ? world.roundEnd - wt : 0;
      FR.variant = world.variant;
      FR.hasZone = !!world.zone;
      if (world.zone) { const z = world.zone, q = FR.zone; q[0] = z.x; q[1] = z.y; q[2] = z.r; let n = 0; for (const p of world.players.values()) if (p.alive) n++; q[3] = n; q[4] = Math.max(0, world.roundStart + ROYALE_TIME - 45 - wt); }
      FR.hasEv = !!world.ev;
      if (world.ev) { const e = world.ev, q = FR.ev; q[0] = e.k; q[1] = e.until - wt; q[2] = e.x; q[3] = e.y; }
      FR.pellets = world.pellets;
      return;
    }
    if (!snaps.length || !pelletState) return;
    const rt = performance.now() - INTERP_MS;
    let i = snaps.length - 1;
    while (i > 0 && snaps[i - 1].at > rt) i--;
    const b = snaps[i], a = snaps[Math.max(0, i - 1)];
    const t = b === a ? 1 : Clamp((rt - a.at) / Math.max(1, b.at - a.at), 0, 1.15);
    const ad = a.data, bd = b.data;
    for (const pl of bd.p) {
      const pid = pl[0], flat = pl[2], fx = pl[3];
      const r = roster.get(pid);
      let score = 0;
      for (let k = 0; k < flat.length; k += 4) {
        const id = flat[k];
        let x = flat[k + 1], y = flat[k + 2];
        const pf = ad.ci ? ad.ci.get(id) : undefined;
        if (pf !== undefined) { const px = Math.floor(pf / 8192), py = pf - px * 8192; x = px + (x - px) * t; y = py + (y - py) * t; }
        const o = Slot(FR.cells, FR.nc++);
        o.id = id; o.owner = pid; o.x = x; o.y = y; o.m = flat[k + 3]; o.isV = false;
        o.hue = r ? r[2] : 0; o.name = r ? r[1] : ''; o.skin = r && r[4] ? r[4] : 0; o.team = r && Number.isInteger(r[5]) ? r[5] : -1;
        o.sp = !!(fx && fx[0] > 0); o.mg = !!(fx && fx[1] > 0); o.sh = !!(fx && fx[2] > 0);
        score += flat[k + 3];
      }
      if (flat.length) {
        const o = Slot(FR.players, FR.np++);
        o.id = pid; o.name = r ? r[1] : ''; o.score = Number.isFinite(pl[4]) ? pl[4] : score; o.hue = r ? r[2] : 0; o.team = r && Number.isInteger(r[5]) ? r[5] : -1; o.n = flat.length / 4;
        if (pid === me) { FR.mine = o; if (fx) for (let k = 0; k < 3; k++) FR.mfx[k] = fx[k] || 0; }
      }
    }
    for (const v of bd.v) {
      const q = ad.vi ? ad.vi.get(v[0]) : undefined;
      const o = Slot(FR.viruses, FR.nv++);
      o.id = v[0]; o.m = v[3]; o.k = v[4] || 0; o.isV = true;
      if (q !== undefined) { const px = Math.floor(q / 8192), py = q - px * 8192; o.x = px + (v[1] - px) * t; o.y = py + (v[2] - py) * t; } else { o.x = v[1]; o.y = v[2]; }
    }
    for (const e of bd.e) {
      const q = ad.ei ? ad.ei.get(e[0]) : undefined;
      const o = Slot(FR.ejected, FR.ne++);
      o.hue = e[3]; o.m = e[4] || EJECT_MASS;
      if (q !== undefined) { const px = Math.floor(q / 8192), py = q - px * 8192; o.x = px + (e[1] - px) * t; o.y = py + (e[2] - py) * t; } else { o.x = e[1]; o.y = e[2]; }
    }
    for (const u of bd.pw || []) { const o = Slot(FR.pows, FR.nw++); o.id = u[0]; o.x = u[1]; o.y = u[2]; o.k = u[3]; }
    FR.rt = bd.rt || 0;
    FR.variant = VARIANTS[bd.vr] || netVariant;
    FR.hasZone = Array.isArray(bd.z);
    if (FR.hasZone) for (let k = 0; k < 5; k++) FR.zone[k] = bd.z[k];
    FR.hasEv = Array.isArray(bd.ev);
    if (FR.hasEv) for (let k = 0; k < 4; k++) FR.ev[k] = bd.ev[k];
    FR.pellets = pelletState;
  }

  function NearestCell(x, y) {
    let best = null, bd = 260000;
    for (let i = 0; i < FR.nc; i++) {
      const c = FR.cells[i], dx = c.x - x, dy = c.y - y, d = dx * dx + dy * dy - Radius(c.m) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  function TargetWorld() {
    if (!mouse.has) return { x: cam.x, y: cam.y };
    return { x: cam.x + (mouse.x - cw / 2) / cam.s, y: cam.y + (mouse.y - ch / 2) / cam.s };
  }

  function UpdateCamera() {
    let sx = 0, sy = 0, sm = 0, sr = 0;
    const me = MeId();
    for (let i = 0; i < FR.nc; i++) {
      const c = FR.cells[i];
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

  function InView(x, y) { return x > VIEW.l - 40 && x < VIEW.r + 40 && y > VIEW.t - 40 && y < VIEW.b + 40; }

  function Part(k, x, y, vx, vy, life, s, c) {
    const q = PARTS[partHead];
    partHead = (partHead + 1) % PARTS.length;
    q.on = true; q.k = k; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.t = 0; q.life = life; q.s = s; q.c = c; q.a = Rand(0, TAU); q.va = Rand(-8, 8);
    return q;
  }

  function Fly(x, y, tx, ty, c) {
    if (!InView(x, y)) return;
    const q = Part(5, x, y, 0, 0, 0.2, 9, c);
    q.tx = tx; q.ty = ty;
  }

  function Float(x, y, str, c, s) {
    const f = FLOATS[floatHead];
    floatHead = (floatHead + 1) % FLOATS.length;
    f.on = true; f.x = x; f.y = y; f.t = 0; f.life = 1.3; f.str = str; f.c = c; f.s = s;
  }

  function Toast(str, sub, c) { toast.str = str; toast.sub = sub; toast.t = 2.4; toast.c = c; }

  function PlayFx(e) {
    const type = e[1], x = e[2], y = e[3], a = e[4], val = e[5], owner = e[6];
    const mine = owner === MeId();
    if (type === 5) { const v = VARIANTS[a] || 'classic'; Toast(T('io_round_new'), T('io_var_' + v + '_desc'), '#38bdf8'); return; }
    if (type === 6) { const k = EV_KEYS[a]; if (!k) return; Toast(T('io_ev_' + k), T('io_ev_' + k + '_desc'), EV_COLORS[a]); if (InView(x, y)) for (let i = 0; i < 20; i++) { const an = Rand(0, TAU), sp = Rand(120, 420); Part(4, x, y, Math.cos(an) * sp, Math.sin(an) * sp, Rand(0.6, 1), Rand(12, 20), EV_COLORS[a]); } return; }
    if (!InView(x, y) && !mine) return;
    if (type === 1) {
      const r = Radius(VIRUS_MASS);
      Part(1, x, y, 0, 0, 0.55, r, '#4ade80');
      Part(1, x, y, 0, 0, 0.8, r * 0.6, Hc(a, 2));
      for (let i = 0; i < 18; i++) { const an = Rand(0, TAU), s = Rand(260, 620); Part(3, x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.6, Math.cos(an) * s, Math.sin(an) * s, Rand(0.45, 0.8), Rand(7, 13), i % 3 ? '#22c55e' : '#bbf7d0'); }
      for (let i = 0; i < 16; i++) { const an = Rand(0, TAU), s = Rand(120, 420); Part(0, x, y, Math.cos(an) * s, Math.sin(an) * s, Rand(0.4, 0.75), Rand(5, 10), Hc(a, i % 2 ? 0 : 2)); }
      Float(x, y - r, '+' + val, '#4ade80', 34);
      if (mine) { shake = Math.max(shake, 9); Toast(T('io_pop'), T('io_pop_desc'), '#22c55e'); }
    } else if (type === 2) {
      const r = Radius(Math.max(10, val));
      Part(1, x, y, 0, 0, 0.4, r * 0.8, Hc(a, 2));
      for (let i = 0; i < 12; i++) { const an = Rand(0, TAU), s = Rand(100, 320); Part(0, x, y, Math.cos(an) * s, Math.sin(an) * s, Rand(0.35, 0.6), Rand(4, 9), Hc(a, i % 2)); }
      if (mine && val >= 15) Float(x, y, '+' + val, '#fff', 26);
    } else if (type === 3) {
      const c = POW_COLORS[a] || '#fff';
      Part(1, x, y, 0, 0, 0.6, POW_R, c);
      Part(1, x, y, 0, 0, 0.9, POW_R * 0.5, '#ffffff');
      for (let i = 0; i < 16; i++) { const an = Rand(0, TAU), s = Rand(140, 380); Part(4, x, y, Math.cos(an) * s, Math.sin(an) * s, Rand(0.5, 0.9), Rand(10, 18), c); }
      if (mine) {
        const key = POW_KEYS[a];
        Toast(T('io_pw_' + key), T('io_pw_' + key + '_desc', { m: val }), c);
        if (val) Float(x, y - 30, '+' + val, c, 30);
      }
    } else if (type === 4) {
      const r = Radius(val);
      Part(1, x, y, 0, 0, 0.6, r, '#f472b6');
      for (let i = 0; i < 20; i++) { const an = Rand(0, TAU), s = Rand(150, 480); Part(0, x, y, Math.cos(an) * s, Math.sin(an) * s, Rand(0.4, 0.8), Rand(6, 12), i % 2 ? '#f472b6' : '#fbcfe8'); }
      Float(x, y - r * 0.5, '+' + val, '#f472b6', 34);
    }
  }

  function BuildSprites() {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; return [c, g]; };
    const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
    const star = (g, x, y, ro, ri, n, rot) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, r = i % 2 ? ri : ro; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
    const pellet = col => {
      const [c, g] = mk(64, 64);
      g.fillStyle = 'rgba(15,23,42,.16)'; circ(g, 33.5, 35, 19); g.fill();
      const gr = g.createRadialGradient(25, 23, 2, 32, 32, 21);
      gr.addColorStop(0, Mix(col, '#ffffff', 0.5)); gr.addColorStop(0.5, col); gr.addColorStop(1, Mix(col, '#000000', 0.25));
      g.fillStyle = gr; circ(g, 32, 32, 18.5); g.fill();
      g.lineWidth = 2.6; g.strokeStyle = Mix(col, '#000000', 0.32); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(25, 24, 6, 3.6, -0.7, 0, TAU); g.fill();
      return c;
    };
    const pel = PELLET_COLORS.map(pellet);
    const [gold, gg] = mk(80, 80);
    { const gr = gg.createRadialGradient(40, 40, 4, 40, 40, 40); gr.addColorStop(0, 'rgba(253,224,71,.65)'); gr.addColorStop(1, 'rgba(253,224,71,0)'); gg.fillStyle = gr; circ(gg, 40, 40, 40); gg.fill();
      star(gg, 41, 43, 23, 10.5, 5, -Math.PI / 2); gg.fillStyle = 'rgba(120,53,15,.3)'; gg.fill();
      star(gg, 40, 41, 23, 10.5, 5, -Math.PI / 2);
      const sg = gg.createLinearGradient(20, 18, 58, 62); sg.addColorStop(0, '#fef08a'); sg.addColorStop(0.5, '#facc15'); sg.addColorStop(1, '#ca8a04');
      gg.fillStyle = sg; gg.fill(); gg.lineWidth = 2.4; gg.strokeStyle = '#a16207'; gg.stroke();
      star(gg, 38, 37, 9, 4, 5, -Math.PI / 2); gg.fillStyle = 'rgba(255,255,255,.6)'; gg.fill(); }
    const [gloss, lg] = mk(256, 256);
    { let gr = lg.createRadialGradient(128, 128, 84, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.75, 'rgba(0,0,0,.08)'); gr.addColorStop(1, 'rgba(0,0,0,.26)'); lg.fillStyle = gr; circ(lg, 128, 128, 128); lg.fill();
      gr = lg.createRadialGradient(84, 76, 0, 84, 76, 120); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); lg.fillStyle = gr; circ(lg, 128, 128, 128); lg.fill();
      lg.fillStyle = 'rgba(255,255,255,.42)'; lg.beginPath(); lg.ellipse(78, 66, 26, 13, -0.75, 0, TAU); lg.fill();
      lg.strokeStyle = 'rgba(255,255,255,.16)'; lg.lineWidth = 7; lg.beginPath(); lg.arc(128, 128, 104, 0.35, 1.25); lg.stroke(); }
    const [shadow, hg] = mk(128, 128);
    { const gr = hg.createRadialGradient(64, 64, 30, 64, 64, 64); gr.addColorStop(0, 'rgba(10,20,40,.26)'); gr.addColorStop(1, 'rgba(10,20,40,0)'); hg.fillStyle = gr; circ(hg, 64, 64, 64); hg.fill(); }
    const skins = [null];
    for (let k = 1; k < SKINS; k++) {
      const [c, g] = mk(256, 256);
      circ(g, 128, 128, 128); g.save(); g.clip();
      if (k === 1) {
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2.5;
        for (let x = 8; x < 256; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.moveTo(0, x); g.lineTo(256, x); g.stroke(); }
      } else if (k === 2) {
        g.strokeStyle = 'rgba(255,255,255,.34)'; g.lineWidth = 3;
        for (let y = 26; y < 256; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
        g.strokeStyle = 'rgba(239,68,68,.8)'; g.lineWidth = 5; g.beginPath(); g.moveTo(66, 0); g.lineTo(66, 256); g.stroke();
      } else if (k === 3) {
        star(g, 130, 136, 92, 40, 5, -Math.PI / 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fill();
        star(g, 128, 130, 92, 40, 5, -Math.PI / 2);
        const sg = g.createLinearGradient(50, 40, 200, 220); sg.addColorStop(0, '#fef08a'); sg.addColorStop(0.55, '#facc15'); sg.addColorStop(1, '#d97706');
        g.fillStyle = sg; g.fill(); g.lineWidth = 6; g.strokeStyle = '#a16207'; g.stroke();
        star(g, 118, 116, 30, 13, 5, -Math.PI / 2); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill();
      } else if (k === 4) {
        g.fillStyle = 'rgba(255,255,255,.92)'; circ(g, 128, 128, 84); g.fill();
        g.strokeStyle = '#dc2626'; g.lineWidth = 7; g.beginPath(); g.ellipse(128, 128, 74, 66, -0.15, 0.2, TAU - 0.1); g.stroke();
        g.fillStyle = '#dc2626'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 82px Ubuntu, "Segoe UI", Arial, sans-serif'; g.fillText('10', 120, 118);
        g.font = '700 30px Ubuntu, "Segoe UI", Arial, sans-serif'; g.fillText('/10', 156, 168);
      } else if (k === 5) {
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 128px Ubuntu, "Segoe UI", Arial, sans-serif';
        g.lineWidth = 14; g.strokeStyle = 'rgba(0,0,0,.28)'; g.strokeText('A+', 128, 138);
        g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('A+', 128, 134);
      } else if (k === 6) {
        g.fillStyle = 'rgba(255,255,255,.32)';
        for (let y = 0, row = 0; y < 280; y += 40, row++) for (let x = row % 2 ? 20 : 0; x < 280; x += 40) { circ(g, x, y, 11); g.fill(); }
      } else if (k === 7) {
        g.fillStyle = 'rgba(28,58,42,.9)'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 18; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-20, 40 + i * 44); g.lineTo(280, 20 + i * 44); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.82)'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = 'italic 700 34px Georgia, serif'; g.fillText('a²+b²=c²', 128, 82);
        g.font = 'italic 700 46px Georgia, serif'; g.fillText('π ≈ 3,14', 124, 140);
        g.font = 'italic 700 32px Georgia, serif'; g.fillText('x = ?', 150, 194);
      }
      g.restore();
      skins.push(c);
    }
    const virus = k => {
      const [c, g] = mk(300, 300);
      const C = 150, R = 128;
      const body = k ? '#a3e635' : '#4ade80', dark = k ? '#4d7c0f' : '#15803d', light = k ? '#ecfccb' : '#dcfce7';
      const path = (dx, dy) => { g.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU, r = i % 2 ? R : R * 0.88; g.lineTo(C + dx + Math.cos(a) * r, C + dy + Math.sin(a) * r); } g.closePath(); };
      path(5, 8); g.fillStyle = 'rgba(10,30,15,.2)'; g.fill();
      path(0, 0);
      const gr = g.createRadialGradient(C - 40, C - 48, 8, C, C, R);
      gr.addColorStop(0, light); gr.addColorStop(0.45, body); gr.addColorStop(1, Mix(body, '#000000', 0.22));
      g.fillStyle = gr; g.fill(); g.lineWidth = 7; g.strokeStyle = dark; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 4; circ(g, C, C, R * 0.76); g.stroke();
      let s = 7 + k * 13;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < 11; i++) {
        const a = rnd() * TAU, d = rnd() * R * 0.58, r = 7 + rnd() * 12;
        g.fillStyle = Rgba(dark, 0.32); circ(g, C + Math.cos(a) * d, C + Math.sin(a) * d, r); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; circ(g, C + Math.cos(a) * d - r * 0.3, C + Math.sin(a) * d - r * 0.3, r * 0.35); g.fill();
      }
      if (k) { g.strokeStyle = Rgba(dark, 0.55); g.lineWidth = 8; for (const o of [-34, 4]) { g.beginPath(); g.moveTo(C + o, C - 30); g.lineTo(C + o + 26, C); g.lineTo(C + o, C + 30); g.stroke(); } }
      g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(C - 48, C - 56, 30, 15, -0.7, 0, TAU); g.fill();
      return c;
    };
    const [mother, mg] = mk(300, 300);
    { const C = 150, R = 124;
      const path = (dx, dy) => { mg.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = R * (0.93 + 0.07 * Math.cos(a * 12)); mg.lineTo(C + dx + Math.cos(a) * r, C + dy + Math.sin(a) * r); } mg.closePath(); };
      path(5, 8); mg.fillStyle = 'rgba(60,10,30,.2)'; mg.fill();
      path(0, 0);
      const gr = mg.createRadialGradient(C - 36, C - 44, 8, C, C, R);
      gr.addColorStop(0, '#fce7f3'); gr.addColorStop(0.45, '#f472b6'); gr.addColorStop(1, '#be185d');
      mg.fillStyle = gr; mg.fill(); mg.lineWidth = 7; mg.strokeStyle = '#9d174d'; mg.stroke();
      const ng = mg.createRadialGradient(C + 6, C + 2, 4, C + 10, C + 8, 46); ng.addColorStop(0, '#fdf2f8'); ng.addColorStop(0.5, '#db2777'); ng.addColorStop(1, '#831843');
      mg.fillStyle = ng; circ(mg, C + 10, C + 8, 42); mg.fill();
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, d = R * 0.66; mg.fillStyle = 'rgba(255,255,255,.4)'; circ(mg, C + Math.cos(a) * d, C + Math.sin(a) * d, 9 + (i % 3) * 3); mg.fill(); }
      mg.fillStyle = 'rgba(255,255,255,.42)'; mg.beginPath(); mg.ellipse(C - 46, C - 54, 30, 15, -0.7, 0, TAU); mg.fill(); }
    const pows = POW_COLORS.map((col, k) => {
      const [c, g] = mk(112, 112);
      const C = 56, R = POW_R;
      let gr = g.createRadialGradient(C, C, R * 0.6, C, C, 56); gr.addColorStop(0, Rgba(col, 0.5)); gr.addColorStop(1, Rgba(col, 0)); g.fillStyle = gr; circ(g, C, C, 56); g.fill();
      g.fillStyle = 'rgba(0,0,0,.22)'; circ(g, C + 2, C + 4, R); g.fill();
      gr = g.createRadialGradient(C - 9, C - 10, 2, C, C, R); gr.addColorStop(0, Mix(col, '#ffffff', 0.55)); gr.addColorStop(0.55, col); gr.addColorStop(1, Mix(col, '#000000', 0.3));
      g.fillStyle = gr; circ(g, C, C, R); g.fill(); g.lineWidth = 3; g.strokeStyle = Mix(col, '#000000', 0.4); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; circ(g, C, C, R + 6); g.setLineDash([5, 6]); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#fff'; g.strokeStyle = Mix(col, '#000000', 0.45); g.lineWidth = 2.4;
      g.beginPath();
      if (k === 0) { g.moveTo(C + 3, C - 16); g.lineTo(C - 9, C + 2); g.lineTo(C - 1, C + 2); g.lineTo(C - 4, C + 16); g.lineTo(C + 9, C - 3); g.lineTo(C + 1, C - 3); g.closePath(); g.fill(); g.stroke(); }
      else if (k === 1) { g.lineWidth = 8; g.strokeStyle = '#fff'; g.arc(C, C - 1, 9, Math.PI, 0, true); g.stroke(); g.fillStyle = '#ef4444'; g.fillRect(C - 13, C - 13, 8, 7); g.fillRect(C + 5, C - 13, 8, 7); g.fillStyle = '#fff'; g.fillRect(C - 13, C - 6, 8, 3); g.fillRect(C + 5, C - 6, 8, 3); }
      else if (k === 2) { g.moveTo(C, C - 15); g.lineTo(C + 12, C - 10); g.quadraticCurveTo(C + 12, C + 8, C, C + 15); g.quadraticCurveTo(C - 12, C + 8, C - 12, C - 10); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(C - 5, C); g.lineTo(C - 1, C + 4); g.lineTo(C + 6, C - 5); g.stroke(); }
      else { g.rect(C - 3.5, C - 13, 7, 26); g.rect(C - 13, C - 3.5, 26, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(C - 10, C - 12, 8, 4, -0.7, 0, TAU); g.fill();
      return c;
    });
    const [spark, sg] = mk(32, 32);
    { const gr = sg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = gr; circ(sg, 16, 16, 16); sg.fill(); star(sg, 16, 16, 15, 2.5, 4, 0); sg.fillStyle = '#fff'; sg.fill(); }
    SPR = { pel, gold, gloss, shadow, skins, viruses: [virus(0), virus(1)], mother, pows, spark };
  }

  function Vignette(dark) {
    if (vig && vigW === cw && vigH === ch && vigD === dark && vigR === dpr) return vig;
    vigW = cw; vigH = ch; vigD = dark; vigR = dpr;
    vig = document.createElement('canvas');
    vig.width = Math.max(1, Math.round(cw * dpr / 2)); vig.height = Math.max(1, Math.round(ch * dpr / 2));
    const g = vig.getContext('2d');
    const gr = g.createRadialGradient(vig.width / 2, vig.height / 2, Math.min(vig.width, vig.height) * 0.35, vig.width / 2, vig.height / 2, Math.hypot(vig.width, vig.height) / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, dark ? 'rgba(0,0,0,.5)' : 'rgba(30,60,100,.16)');
    g.fillStyle = gr; g.fillRect(0, 0, vig.width, vig.height);
    return vig;
  }

  const UF = 'Ubuntu, "Segoe UI", Arial, sans-serif', FONTS = {};
  function Font(w, px) { const k = w * 100 + px; return FONTS[k] || (FONTS[k] = `${w} ${px}px ${UF}`); }

  function Text(str, x, y, size, stroke = true) {
    ctx.font = `700 ${size}px ${UF}`;
    if (stroke) { ctx.lineWidth = Math.max(2, size * 0.14); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(str, x, y); }
    ctx.fillText(str, x, y);
  }

  function DrawGround(dark, left, top, right, bottom, s) {
    ctx.fillStyle = dark ? '#121a24' : '#f8fbfe';
    ctx.fillRect(0, 0, SIZE, SIZE);
    const x0 = Math.max(0, left), x1 = Math.min(SIZE, right), y0 = Math.max(0, top), y1 = Math.min(SIZE, bottom);
    if (50 * s > 7) {
      ctx.strokeStyle = dark ? '#1a2532' : '#e4edf5';
      ctx.lineWidth = 1 / s;
      ctx.beginPath();
      for (let x = Math.floor(x0 / 50) * 50; x <= x1; x += 50) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
      for (let y = Math.floor(y0 / 50) * 50; y <= y1; y += 50) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
      ctx.stroke();
    }
    ctx.strokeStyle = dark ? '#243346' : '#cfdeec';
    ctx.lineWidth = 2 / s;
    ctx.beginPath();
    for (let x = Math.floor(x0 / 250) * 250; x <= x1; x += 250) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
    for (let y = Math.floor(y0 / 250) * 250; y <= y1; y += 250) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    ctx.stroke();
    if (left < 60 || top < 60 || right > SIZE - 60 || bottom > SIZE - 60) {
      ctx.strokeStyle = dark ? 'rgba(248,113,113,.18)' : 'rgba(239,68,68,.14)';
      ctx.lineWidth = 26;
      ctx.strokeRect(-13, -13, SIZE + 26, SIZE + 26);
      ctx.strokeStyle = dark ? '#f87171' : '#ef4444';
      ctx.lineWidth = 5;
      ctx.strokeRect(-2.5, -2.5, SIZE + 5, SIZE + 5);
    }
  }

  function CellPath(x, y, r, t, seed, amp, n) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      const w = Math.sin(t * 2.3 + a * 3 + seed) * 0.6 + Math.sin(t * 3.7 - a * 5 + seed * 1.3) * 0.4;
      const rr = r * (1 + amp * w);
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + rr, y);
    }
    ctx.closePath();
  }

  function DrawCell(c, t, s, me, nowS) {
    const r = Radius(c.m), x = c.x, y = c.y;
    const age = nowS - (seen.get(c.id) || nowS);
    const amp = 0.012 + 0.018 * Math.min(1, 40 / r * 1.4) + (age < 0.9 ? 0.09 * (1 - age / 0.9) * Math.sin(age * 22) : 0);
    const n = Clamp(Math.round(r * s / 3), 16, 72);
    const sw = r * 1.18;
    ctx.drawImage(SPR.shadow, x - sw + r * 0.06, y - sw + r * 0.12, sw * 2, sw * 2);
    CellPath(x, y, r, t, c.id * 1.7, amp, n);
    ctx.fillStyle = Hc(c.hue, 0);
    ctx.fill();
    if (c.skin && SPR.skins[c.skin]) { const k = r * 0.93; ctx.drawImage(SPR.skins[c.skin], x - k, y - k, k * 2, k * 2); }
    ctx.drawImage(SPR.gloss, x - r, y - r, r * 2, r * 2);
    ctx.lineWidth = Math.max(2.5 / s, r * 0.055);
    ctx.strokeStyle = Hc(c.hue, 1);
    ctx.stroke();
    if (c.sh) {
      ctx.fillStyle = 'rgba(103,232,249,.13)';
      ctx.beginPath(); ctx.arc(x, y, r * 1.1 + 6, 0, TAU); ctx.fill();
      ctx.setLineDash(DASH); ctx.lineDashOffset = -t * 40;
      ctx.strokeStyle = 'rgba(34,211,238,.85)'; ctx.lineWidth = Math.max(3 / s, r * 0.035);
      ctx.stroke();
      ctx.setLineDash(NODASH);
    }
    if (c.mg) {
      ctx.strokeStyle = 'rgba(168,85,247,.22)'; ctx.lineWidth = Math.max(4 / s, r * 0.08);
      ctx.beginPath(); ctx.arc(x, y, r + 12 + Math.sin(t * 6) * 4, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#c084fc';
      for (let i = 0; i < 3; i++) { const a = t * 2.6 + i * TAU / 3 + c.id, d = r + 14 + (1 + Math.sin(t * 3 + i)) * 10; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 5, 0, TAU); ctx.fill(); }
    }
    if (c.sp && Math.random() < 0.5) { const a = Rand(0, TAU), d = Rand(0, r * 0.8); Part(4, x + Math.cos(a) * d, y + Math.sin(a) * d, 0, 0, 0.45, Math.max(8, r * 0.18), '#fbbf24'); }
    if (r * s > 9) {
      ctx.fillStyle = '#fff';
      const fs = Math.max(r * 0.3, 14 / s);
      if (c.name) Text(c.name, x, y, fs);
      if (showMass && (c.owner === me || r * s > 18)) Text(String(Math.floor(c.m)), x, y + (c.name ? fs * 0.9 : 0), Math.max(fs * 0.55, 11 / s));
    }
  }

  function DrawVirus(v, t) {
    const r = Radius(v.m), a = v.k === 2 ? t * 0.12 + v.id : (v.k ? t * 0.6 : t * 0.1) + v.id;
    const co = Math.cos(a) * BK, si = Math.sin(a) * BK;
    ctx.setTransform(co, si, -si, co, BK * v.x + BX, BK * v.y + BY);
    if (v.k === 2) {
      const k = r * (1 + Math.sin(t * 3 + v.id) * 0.03) * 300 / 248;
      ctx.drawImage(SPR.mother, -k, -k, k * 2, k * 2);
    } else {
      const k = r * 300 / 256;
      ctx.drawImage(SPR.viruses[v.k], -k, -k, k * 2, k * 2);
    }
    ctx.setTransform(BK, 0, 0, BK, BX, BY);
  }

  function ByMass(a, b) { return a.m - b.m; }
  function ByScore(a, b) { return b.score - a.score; }

  function Draw(dt) {
    Frame();
    UpdateCamera();
    frameNo++;
    const dark = root.dataset.theme === 'dark';
    const nowS = performance.now() / 1000, t = nowS;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = dark ? '#0a0f16' : '#dfe8f1';
    ctx.fillRect(0, 0, cw, ch);
    let ox = 0, oy = 0;
    if (shake > 0.3) { ox = Rand(-shake, shake); oy = Rand(-shake, shake); shake *= Math.exp(-dt * 8); } else shake = 0;
    const s = cam.s;
    const left = cam.x - cw / 2 / s, top = cam.y - ch / 2 / s, right = cam.x + cw / 2 / s, bottom = cam.y + ch / 2 / s;
    VIEW.l = left; VIEW.t = top; VIEW.r = right; VIEW.b = bottom;
    BK = dpr * s; BX = dpr * (cw / 2 - cam.x * s + ox); BY = dpr * (ch / 2 - cam.y * s + oy);
    ctx.setTransform(BK, 0, 0, BK, BX, BY);
    DrawGround(dark, left, top, right, bottom, s);
    if (FR.hasZone) {
      const z = FR.zone;
      ctx.beginPath();
      ctx.rect(left - 50, top - 50, right - left + 100, bottom - top + 100);
      ctx.arc(z[0], z[1], z[2], 0, TAU, true);
      ctx.fillStyle = dark ? 'rgba(239,68,68,.16)' : 'rgba(239,68,68,.12)';
      ctx.fill();
    }
    if (FR.pellets) {
      const st = FR.pellets;
      const pulse = 1 + Math.sin(t * 4) * 0.08;
      ForPellets(st, (left + right) / 2, (top + bottom) / 2, Math.max(right - left, bottom - top) / 2 + 20, i => {
        const x = st.x[i], y = st.y[i];
        if (x < left - 30 || x > right + 30 || y < top - 30 || y > bottom + 30) return;
        const k = st.k[i];
        if (k === 2) { const h = 25 * pulse; ctx.drawImage(SPR.gold, x - h, y - h, h * 2, h * 2); }
        else { const h = k ? 21 : 15; ctx.drawImage(SPR.pel[st.c[i]], x - h, y - h, h * 2, h * 2); }
      });
    }
    for (let i = 0; i < FR.ne; i++) {
      const e = FR.ejected[i];
      if (e.x < left - 40 || e.x > right + 40 || e.y < top - 40 || e.y > bottom + 40) continue;
      if (e.m < EJECT_MASS) { const h = e.m === 4 ? 19 : 11; ctx.drawImage(SPR.pel[e.m === 4 ? e.hue % 12 : 10], e.x - h, e.y - h, h * 2, h * 2); continue; }
      const r = Radius(e.m);
      ctx.fillStyle = Hc(e.hue, 0);
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill();
      ctx.drawImage(SPR.gloss, e.x - r, e.y - r, r * 2, r * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = Hc(e.hue, 1); ctx.stroke();
    }
    for (let i = 0; i < FR.nw; i++) {
      const u = FR.pows[i];
      if (u.x < left - 60 || u.x > right + 60 || u.y < top - 60 || u.y > bottom + 60) continue;
      const h = 56 * (1 + Math.sin(t * 3 + u.id) * 0.06), by = Math.sin(t * 2.4 + u.id) * 6;
      ctx.drawImage(SPR.pows[u.k], u.x - h, u.y + by - h, h * 2, h * 2);
    }
    ITEMS.length = 0;
    seenNow.clear();
    for (let i = 0; i < FR.nc; i++) { const c = FR.cells[i]; ITEMS.push(c); seenNow.add(c.id); if (!seen.has(c.id)) seen.set(c.id, nowS); }
    for (let i = 0; i < FR.nv; i++) ITEMS.push(FR.viruses[i]);
    ITEMS.sort(ByMass);
    const me = MeId();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i], r = Radius(it.m) * 1.25;
      if (it.x + r < left || it.x - r > right || it.y + r < top || it.y - r > bottom) continue;
      if (it.isV) DrawVirus(it, t); else DrawCell(it, t, s, me, nowS);
    }
    if (frameNo % 90 === 0) for (const id of seen.keys()) if (!seenNow.has(id)) seen.delete(id);
    if (FR.hasZone) {
      const z = FR.zone;
      ctx.strokeStyle = 'rgba(239,68,68,.22)'; ctx.lineWidth = 34 / Math.max(0.4, s) * 0.5 + 10;
      ctx.beginPath(); ctx.arc(z[0], z[1], z[2], 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = Math.max(4, 3 / s);
      ctx.setLineDash(DASH); ctx.lineDashOffset = -t * 30;
      ctx.stroke();
      ctx.setLineDash(NODASH);
    }
    DrawParts(dt, s);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(Vignette(dark), 0, 0, cw, ch);
    DrawHud(me, dt);
  }

  function DrawParts(dt, s) {
    const decay = Math.exp(-dt * 3.2);
    for (let i = 0; i < PARTS.length; i++) {
      const q = PARTS[i];
      if (!q.on) continue;
      q.t += dt;
      if (q.t >= q.life) { q.on = false; continue; }
      const f = q.t / q.life;
      if (q.k === 5) {
        const e = f * f;
        const x = q.x + (q.tx - q.x) * e, y = q.y + (q.ty - q.y) * e;
        ctx.globalAlpha = 1 - f * 0.6;
        ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.arc(x, y, q.s * (1 - f * 0.7), 0, TAU); ctx.fill();
        continue;
      }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= decay; q.vy *= decay; q.a += q.va * dt;
      ctx.globalAlpha = 1 - f;
      if (q.k === 0) { ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (1 - f * 0.5), 0, TAU); ctx.fill(); }
      else if (q.k === 1) { ctx.strokeStyle = q.c; ctx.lineWidth = Math.max(2 / s, q.s * 0.18 * (1 - f)); ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (1 + f * 2.2), 0, TAU); ctx.stroke(); }
      else if (q.k === 3) {
        const c = Math.cos(q.a) * q.s, sn = Math.sin(q.a) * q.s;
        ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.moveTo(q.x + c, q.y + sn); ctx.lineTo(q.x - sn * 0.5 - c * 0.4, q.y + c * 0.5 - sn * 0.4); ctx.lineTo(q.x + sn * 0.5 - c * 0.4, q.y - c * 0.5 - sn * 0.4); ctx.closePath(); ctx.fill();
      } else if (q.k === 4) {
        const h = q.s * (1 - f * 0.5);
        ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, h * 0.35, 0, TAU); ctx.fill();
        ctx.drawImage(SPR.spark, q.x - h, q.y - h, h * 2, h * 2);
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < FLOATS.length; i++) {
      const f = FLOATS[i];
      if (!f.on) continue;
      f.t += dt;
      if (f.t >= f.life) { f.on = false; continue; }
      const k = f.t / f.life;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.fillStyle = f.c;
      Text(f.str, f.x, f.y - k * 60, Math.max(f.s * (1 + (k < 0.15 ? (0.15 - k) * 3 : 0)), 16 / s));
    }
    ctx.globalAlpha = 1;
  }

  function FmtMass(m) { return m >= 10000 ? (m / 1000).toFixed(1) + 'k' : String(Math.floor(m)); }

  function Glass(x, y, w, h, r) {
    ctx.fillStyle = 'rgba(12,18,32,.6)';
    RoundRect(x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function DrawHud(me, dt) {
    LB.length = 0;
    for (let i = 0; i < FR.np; i++) LB.push(FR.players[i]);
    LB.sort(ByScore);
    let myRank = 0;
    for (let i = 0; i < LB.length; i++) if (LB[i].id === me) myRank = i + 1;
    const teams = FR.variant === 'teams';
    const lbW = 214, rows = Math.min(10, LB.length), rowH = 21;
    const teamH = teams ? 64 : 0;
    const x0 = cw - lbW - 12, y0 = 12;
    const h = 44 + teamH + rows * rowH + (myRank > 10 ? rowH + 6 : 0);
    Glass(x0, y0, lbW, h, 10);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    RoundRect(x0 + 12, y0 + 14, 4, 16, 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = Font(800, 15);
    ctx.fillText(T('io_leaderboard'), x0 + 22, y0 + 22);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(x0 + 10, y0 + 36, lbW - 20, 1);
    let y = y0 + 42;
    if (teams) {
      TEAMSUM[0] = TEAMSUM[1] = TEAMSUM[2] = 0;
      for (let i = 0; i < LB.length; i++) if (LB[i].team >= 0) TEAMSUM[LB[i].team] += LB[i].score;
      const tot = TEAMSUM[0] + TEAMSUM[1] + TEAMSUM[2] || 1;
      ctx.font = Font(700, 11);
      for (let k = 0; k < 3; k++) {
        const by = y + 4 + k * 19, frac = TEAMSUM[k] / tot;
        ctx.fillStyle = 'rgba(255,255,255,.08)'; RoundRect(x0 + 12, by, lbW - 24, 15, 5); ctx.fill();
        ctx.fillStyle = Hc(TEAM_HUES[k], 0); RoundRect(x0 + 12, by, Math.max(10, (lbW - 24) * frac), 15, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(T('io_team_' + k), x0 + 18, by + 8);
        ctx.textAlign = 'right'; ctx.fillText(Math.round(frac * 100) + '%', x0 + lbW - 18, by + 8);
      }
      y += teamH;
    }
    const row = (rank, p, ry) => {
      const mine = p.id === me;
      if (mine) { ctx.fillStyle = 'rgba(56,189,248,.24)'; RoundRect(x0 + 6, ry - 10, lbW - 12, 20, 6); ctx.fill(); }
      ctx.fillStyle = rank === 1 ? '#f5c542' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#d6955b' : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.arc(x0 + 21, ry, 8.5, 0, TAU); ctx.fill();
      ctx.fillStyle = rank <= 3 ? '#1f2937' : '#e5e7eb';
      ctx.textAlign = 'center'; ctx.font = Font(800, rank > 9 ? 9 : 11);
      ctx.fillText(String(rank), x0 + 21, ry + 0.5);
      ctx.fillStyle = Hc(p.hue, 0); ctx.beginPath(); ctx.arc(x0 + 39, ry, 5, 0, TAU); ctx.fill();
      ctx.textAlign = 'left'; ctx.font = Font(mine ? 800 : 600, 13);
      ctx.fillStyle = mine ? '#bae6fd' : '#f8fafc';
      ctx.fillText((p.name || T('io_unnamed')).slice(0, 15), x0 + 50, ry);
      ctx.textAlign = 'right'; ctx.font = Font(600, 11); ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillText(FmtMass(p.score), x0 + lbW - 14, ry);
    };
    for (let i = 0; i < rows; i++) row(i + 1, LB[i], y + 10 + i * rowH);
    if (myRank > 10) {
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x0 + 10, y + rows * rowH + 2, lbW - 20, 1);
      row(myRank, LB[myRank - 1], y + 10 + rows * rowH + 6);
    }
    const mine = FR.mine;
    if (mine && alive) {
      const label = T('io_mass').toUpperCase(), val = FmtMass(mine.score), sub = T('io_cells', { n: mine.n });
      ctx.textAlign = 'left';
      ctx.font = Font(800, 24);
      const vw = ctx.measureText(val).width;
      ctx.font = Font(700, 10);
      const lw = Math.max(ctx.measureText(label).width, ctx.measureText(sub).width);
      const bw = vw + lw + 40, by = ch - 58;
      Glass(12, by, bw, 46, 10);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText(label, 24, by + 16);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText(sub, 24, by + 31);
      ctx.font = Font(800, 24); ctx.fillStyle = '#fff';
      ctx.fillText(val, 32 + lw, by + 24);
      let px = 12;
      for (let k = 0; k < 3; k++) {
        const rem = FR.mfx[k];
        if (rem <= 0) continue;
        const cx = px + 20, cy = by - 26;
        ctx.drawImage(SPR.pows[k], cx - 40, cy - 40, 80, 80);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + TAU * Clamp(rem / POW_TIME[k], 0, 1)); ctx.stroke();
        px += 48;
      }
    }
    if (FR.variant === 'rush' && FR.rt > 0) {
      const sec = Math.ceil(FR.rt), label = FmtTime(sec);
      ctx.font = Font(800, 22);
      const w = ctx.measureText(label).width + 64;
      const low = sec <= 30;
      Glass(cw / 2 - w / 2, 12, w, 38, 19);
      ctx.fillStyle = low ? (Math.floor(FR.rt * 2) % 2 ? '#fca5a5' : '#ef4444') : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(label, cw / 2 + 10, 32);
      ctx.strokeStyle = low ? '#ef4444' : '#38bdf8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cw / 2 - w / 2 + 22, 31, 9, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cw / 2 - w / 2 + 22, 31); ctx.lineTo(cw / 2 - w / 2 + 22, 25); ctx.moveTo(cw / 2 - w / 2 + 22, 31); ctx.lineTo(cw / 2 - w / 2 + 26, 33); ctx.stroke();
    }
    let topY = FR.variant === 'rush' && FR.rt > 0 ? 58 : 12;
    if (FR.hasZone) {
      const z = FR.zone, label = T('io_alive_left', { n: z[3] }), sub = z[4] > 0 ? `${T('io_zone')} ${FmtTime(z[4])}` : T('io_zone_final');
      ctx.font = Font(800, 17);
      const w1 = ctx.measureText(label).width;
      ctx.font = Font(700, 11);
      const w = Math.max(w1, ctx.measureText(sub).width) + 60;
      Glass(cw / 2 - w / 2, 12, w, 42, 21);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cw / 2 - w / 2 + 22, 33, 9, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(cw / 2 - w / 2 + 22, 33, 4 + (Math.sin(performance.now() / 200) + 1) * 1.5, 0, TAU); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = Font(800, 17); ctx.fillStyle = '#fff'; ctx.fillText(label, cw / 2 + 12, 26);
      ctx.font = Font(700, 11); ctx.fillStyle = '#fca5a5'; ctx.fillText(sub, cw / 2 + 12, 43);
      topY = 62;
      let out = false;
      for (let i = 0; i < FR.nc; i++) { const c = FR.cells[i]; if (c.owner === me && Math.hypot(c.x - z[0], c.y - z[1]) > z[2]) { out = true; break; } }
      if (out && alive) {
        const pulse = 0.5 + Math.sin(performance.now() / 160) * 0.5;
        ctx.strokeStyle = `rgba(239,68,68,${0.35 + pulse * 0.45})`; ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, cw - 10, ch - 10);
        ctx.font = Font(800, 15);
        const ww = ctx.measureText(T('io_zone_warn')).width + 30;
        ctx.fillStyle = 'rgba(185,28,28,.85)'; RoundRect(cw / 2 - ww / 2, ch - 64, ww, 32, 16); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(T('io_zone_warn'), cw / 2, ch - 47);
      }
    }
    if (FR.hasEv && FR.ev[1] > 0) {
      const k = FR.ev[0] | 0, label = `${T('io_ev_' + EV_KEYS[k])} · ${FmtTime(Math.ceil(FR.ev[1]))}`;
      ctx.font = Font(700, 12);
      const w = ctx.measureText(label).width + 34, ey = mode === 'lan' && net ? 44 : 12;
      Glass(12, ey, w, 26, 13);
      ctx.fillStyle = EV_COLORS[k]; ctx.beginPath(); ctx.arc(25, ey + 13, 5, 0, TAU); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(label, 36, ey + 14);
    }
    if (toast.t > 0) {
      toast.t -= dt;
      const a = Clamp(toast.t / 0.4, 0, 1) * Clamp((2.4 - toast.t) / 0.15, 0, 1);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.font = Font(800, 20);
      const w1 = ctx.measureText(toast.str).width;
      ctx.font = Font(600, 12);
      const w = Math.max(w1, ctx.measureText(toast.sub).width) + 44, ty = topY + 4;
      Glass(cw / 2 - w / 2, ty, w, 52, 12);
      ctx.fillStyle = toast.c; RoundRect(cw / 2 - w / 2, ty, w, 4, 2); ctx.fill();
      ctx.font = Font(800, 20); ctx.fillStyle = '#fff'; ctx.fillText(toast.str, cw / 2, ty + 22);
      ctx.font = Font(600, 12); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(toast.sub, cw / 2, ty + 40);
      ctx.globalAlpha = 1;
    }
    DrawMinimap(me);
    if (mode === 'lan' && net) {
      ctx.textAlign = 'left';
      ctx.font = Font(600, 12);
      const text = `${T('io_network')} · ${T('io_players_online', { n: net.peers.size + 1 })}${IsHost() ? ' · host' : ''}`;
      Glass(12, 12, ctx.measureText(text).width + 34, 26, 8);
      ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(24, 25, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d1fae5';
      ctx.fillText(text, 34, 26);
    }
  }

  function DrawMinimap(me) {
    const mm = Math.min(124, Math.floor(ch * 0.2)), mx = cw - mm - 12, my = ch - mm - 12 - (touchUi ? 84 : 0), k = mm / SIZE;
    Glass(mx, my, mm, mm, 8);
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) { ctx.moveTo(mx + mm * i / 4, my + 3); ctx.lineTo(mx + mm * i / 4, my + mm - 3); ctx.moveTo(mx + 3, my + mm * i / 4); ctx.lineTo(mx + mm - 3, my + mm * i / 4); }
    ctx.stroke();
    for (let i = 0; i < FR.nv; i++) { const v = FR.viruses[i]; if (v.k !== 2) continue; ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(mx + v.x * k, my + v.y * k, 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < FR.nw; i++) { const u = FR.pows[i]; ctx.fillStyle = POW_COLORS[u.k]; ctx.beginPath(); ctx.arc(mx + u.x * k, my + u.y * k, 2.6, 0, TAU); ctx.fill(); }
    const mine = FR.mine;
    for (let i = 0; i < FR.nc; i++) {
      const c = FR.cells[i];
      const own = c.owner === me;
      if (!own && !(mine && c.team >= 0 && c.team === mine.team)) continue;
      ctx.fillStyle = own ? '#fff' : Hc(c.hue, 2);
      ctx.beginPath(); ctx.arc(mx + c.x * k, my + c.y * k, Math.max(own ? 2.6 : 1.6, Radius(c.m) * k), 0, TAU); ctx.fill();
    }
    if (FR.hasZone) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx + FR.zone[0] * k, my + FR.zone[1] * k, FR.zone[2] * k, 0, TAU); ctx.stroke(); }
    if (FR.hasEv && FR.ev[0] !== 1) { ctx.fillStyle = EV_COLORS[FR.ev[0] | 0]; ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 180) * 0.4; ctx.beginPath(); ctx.arc(mx + FR.ev[2] * k, my + FR.ev[3] * k, 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.strokeRect(mx + Clamp(VIEW.l, 0, SIZE) * k, my + Clamp(VIEW.t, 0, SIZE) * k, (Clamp(VIEW.r, 0, SIZE) - Clamp(VIEW.l, 0, SIZE)) * k, (Clamp(VIEW.b, 0, SIZE) - Clamp(VIEW.t, 0, SIZE)) * k);
  }

  function RoundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }

  function Loop(ts) {
    if (root.style.display === 'none' && mode === 'solo') { raf = 0; parked = true; return; }
    raf = requestAnimationFrame(Loop);
    const dt = Math.min(0.1, (ts - (lastTs || ts)) / 1000);
    lastTs = ts;
    if (ejecting && alive) {
      ejectTimer -= dt;
      if (ejectTimer <= 0) { ejectTimer = 0.09; Act('eject'); }
    }
    const frozen = paused && mode === 'solo';
    if (IsHost() && world && !frozen) {
      const me = world.players.get(myId);
      if (me && me.alive) me.target = TargetWorld();
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 6) { Step(world, STEP); acc -= STEP; steps++; }
      if (steps === 6) acc = 0;
      simAlpha = acc / STEP;
      Broadcast();
    }
    if (net && net.host && !IsHost() && performance.now() - (net.ready ? net.lastSnapAt : net.hostAt) > (net.ready ? 3500 : 6000)) {
      net.dead.add(net.host);
      Rehost();
    }
    SendInput();
    Draw(frozen ? 0 : dt);
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
      if (!world || !world.solo || world.variant !== variant) { world = NewWorld(variant); world.solo = true; myId = 'me'; FillBots(world); }
      const me = world.players.get(myId) || AddPlayer(world, myId, myName, false, myHue, mySkin);
      me.name = myName;
      me.skin = mySkin;
      if (me.team < 0) me.hue = myHue;
      Spawn(world, me);
      alive = true;
    } else {
      if (!net || net.status === 'offline' || !net.host || (!IsHost() && !net.ready)) return;
      net.rename(myName);
      if (IsHost()) {
        const me = world.players.get(myId) || AddPlayer(world, myId, myName, false, myHue, mySkin);
        me.name = myName;
        me.skin = mySkin;
        if (me.team < 0) me.hue = myHue;
        Spawn(world, me);
        net.send(null, { t: 'roster', roster: RosterOf(world) }, true);
        alive = true;
      } else {
        net.send(net.host, SpawnMsg(), true);
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
    lastFx = 0;
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

  function SetVariant(v) {
    if (!VARIANTS.includes(v)) return;
    variant = v;
    LsSet(LS_VAR, v);
    if (mode === 'solo' && !alive && (!world || world.variant !== v)) { world = NewWorld(v); world.solo = true; myId = 'me'; FillBots(world); }
    UpdateLobby();
  }

  function SetSkin(k) {
    if (k === mySkin) { myHue = (myHue + 47 + Math.floor(Math.random() * 90)) % 360; LsSet(LS_HUE, String(myHue)); }
    mySkin = Clamp(k, 0, SKINS - 1);
    LsSet(LS_SKIN, String(mySkin));
    DrawSkinPicks();
  }

  function DrawSkinPicks() {
    if (!root || !SPR) return;
    root.querySelectorAll('[data-io-skin]').forEach(b => {
      const k = +b.dataset.ioSkin, c = b.querySelector('canvas'), g = c.getContext('2d');
      const R = 28, C = 34;
      b.classList.toggle('active', k === mySkin);
      g.clearRect(0, 0, 68, 68);
      g.fillStyle = Hc(myHue, 0); g.beginPath(); g.arc(C, C, R, 0, TAU); g.fill();
      if (k) g.drawImage(SPR.skins[k], C - R * 0.93, C - R * 0.93, R * 1.86, R * 1.86);
      g.drawImage(SPR.gloss, C - R, C - R, R * 2, R * 2);
      g.lineWidth = 3; g.strokeStyle = Hc(myHue, 1); g.beginPath(); g.arc(C, C, R - 1, 0, TAU); g.stroke();
    });
    const nm = root.querySelector('#gf-io-skin-name');
    if (nm) nm.textContent = T('io_skin_' + mySkin);
  }

  function UpdateLobby() {
    if (!root) return;
    root.querySelectorAll('[data-io-mode]').forEach(b => b.classList.toggle('active', b.dataset.ioMode === mode));
    const lobbyVar = mode === 'lan' && net && net.host && (IsHost() ? world?.variant : net.ready ? netVariant : '');
    root.querySelectorAll('[data-io-var]').forEach(b => b.classList.toggle('active', b.dataset.ioVar === (lobbyVar || variant)));
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
      if (ok && lobbyVar && lobbyVar !== variant) text += ' · ' + T('io_lobby_variant', { v: T('io_var_' + lobbyVar) });
    }
    if (status) { status.textContent = text; status.classList.toggle('is-wait', !ok); }
    if (play) play.disabled = !ok;
    const best = root.querySelector('#gf-io-best');
    if (best) best.textContent = LsGet(LS_BEST) || '0';
  }

  function ShowScreen(name) {
    screen = name;
    touchUi = matchMedia('(pointer: coarse)').matches;
    root.querySelector('#gf-io-start').style.display = name === 'start' ? 'flex' : 'none';
    root.querySelector('#gf-io-dead').style.display = name === 'dead' ? 'flex' : 'none';
    root.querySelector('#gf-io-pause').style.display = name === 'pause' ? 'flex' : 'none';
    root.querySelector('#gf-io-touch').style.display = name === 'play' && touchUi ? 'flex' : 'none';
    if (name === 'dead' && deathStats) {
      const s = deathStats;
      root.querySelector('#gf-io-dead-title').textContent = s.round === 1 ? T('io_round_win') : s.round ? T('io_round_over') : T('game_gameover');
      root.querySelector('#gf-io-stats').innerHTML = [
        ['io_stat_food', Math.floor(s.food || 0)],
        ['io_stat_time', FmtTime(s.alive)],
        ['io_stat_cells', Math.floor(s.eaten || 0)],
        ['io_stat_mass', Math.floor(s.top || 0)],
        ['io_stat_lb', FmtTime(s.lbTime)],
        ['io_stat_pos', s.best && s.best < 99 ? s.best : '-'],
      ].map(([k, v]) => `<div class="gf-io-stat"><b>${v}</b><span>${T(k)}</span></div>`).join('');
      root.querySelector('#gf-io-killer').textContent = s.round ? T('io_round_rank', { n: s.round }) : [s.by ? T('io_eaten_by', { name: s.by }) : '', s.place ? T('io_place', { n: s.place }) : ''].filter(Boolean).join(' · ').replace(/^./, ch => ch.toUpperCase());
      const res = root.querySelector('#gf-io-results');
      res.innerHTML = '';
      res.style.display = Array.isArray(s.res) && s.res.length ? 'grid' : 'none';
      if (Array.isArray(s.res)) s.res.forEach((r, i) => {
        const d = document.createElement('div');
        d.className = 'gf-io-res';
        const dot = document.createElement('i');
        dot.style.background = Hc(+r[2] || 0, 0);
        const nm = document.createElement('span');
        nm.textContent = `${i + 1}. ${String(r[0] || T('io_unnamed')).slice(0, 15)}`;
        const ms = document.createElement('b');
        ms.textContent = FmtMass(+r[1] || 0);
        d.append(dot, nm, ms);
        res.appendChild(d);
      });
    }
    UpdateLobby();
    if (name === 'start') { DrawSkinPicks(); setTimeout(() => root.querySelector('#gf-io-name')?.focus(), 30); }
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
    BuildSprites();
    root = document.createElement('div');
    root.id = 'gf-io';
    const saved = LsGet(LS_NAME) || (LsGet('gf-realname-cache') || '').split(/\s+/)[0] || '';
    showMass = LsGet(LS_MASS) !== '0';
    variant = VARIANTS.includes(LsGet(LS_VAR)) ? LsGet(LS_VAR) : 'classic';
    mySkin = Clamp(parseInt(LsGet(LS_SKIN), 10) || 0, 0, SKINS - 1);
    const hs = parseInt(LsGet(LS_HUE), 10);
    myHue = Number.isFinite(hs) ? Clamp(hs, 0, 359) : Hue();
    if (!Number.isFinite(hs)) LsSet(LS_HUE, String(myHue));
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
        <div class="gf-io-sec"><span>${T('io_variant')}</span><em>${T('io_experimental')}</em></div>
        <div class="gf-io-vars">${VARIANTS.map(v => `<button data-io-var="${v}"><b>${T('io_var_' + v)}</b><span>${T('io_var_' + v + '_desc')}</span></button>`).join('')}</div>
        <div class="gf-io-sec"><span>${T('io_skin')}</span><em id="gf-io-skin-name"></em></div>
        <div class="gf-io-skins">${Array.from({ length: SKINS }, (_, i) => `<button data-io-skin="${i}" title="${T('io_skin_' + i)} · ${T('io_skin_hint')}"><canvas width="68" height="68"></canvas></button>`).join('')}</div>
        <div id="gf-io-status"></div>
        <button id="gf-io-play">${T('game_play')}</button>
        <label class="gf-io-check"><input type="checkbox" id="gf-io-mass"${showMass ? ' checked' : ''}> ${T('io_show_mass')}</label>
        <div class="gf-io-keys">${T('io_controls')}</div>
        <div class="gf-io-tip">${T('io_tip_virus')}</div>
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
        <div class="gf-io-brand" id="gf-io-dead-title" style="font-size:30px">${T('game_gameover')}</div>
        <div id="gf-io-killer" class="gf-io-keys"></div>
        <div id="gf-io-results" style="display:none"></div>
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
    root.querySelectorAll('[data-io-var]').forEach(b => b.addEventListener('click', () => SetVariant(b.dataset.ioVar)));
    root.querySelectorAll('[data-io-skin]').forEach(b => b.addEventListener('click', () => SetSkin(+b.dataset.ioSkin)));
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
    if (!world && mode === 'solo') { world = NewWorld(variant); world.solo = true; FillBots(world); }
    paused = false;
    ShowScreen(alive ? 'play' : 'start');
    lastTs = 0;
    parked = false;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(Loop);
  }

  function CloseGradeIo() {
    if (!root) return;
    root.style.display = 'none';
    cancelAnimationFrame(raf);
    raf = 0;
    parked = false;
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
      if (parked) { parked = false; lastTs = 0; raf = requestAnimationFrame(Loop); }
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
.gf-io-scr{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--io-scr);backdrop-filter:blur(2px);line-height:1.3;overflow:auto;}
.gf-io-panel{width:min(372px,calc(100% - 32px));display:grid;gap:9px;padding:20px 22px;margin:auto;border-radius:12px;background:var(--io-modal);border:1px solid var(--io-brd2);box-shadow:0 10px 40px rgba(0,0,0,.25);text-align:center;}
.gf-io-brand{font-size:38px;font-weight:800;color:var(--io-txt);letter-spacing:-1px;line-height:1.1;}
.gf-io-brand span{color:#38bdf8;}
#gf-io-name{padding:10px 12px;border:1px solid var(--io-brd2);border-radius:6px;background:var(--io-hdr);color:var(--io-txt);font:600 15px inherit;font-family:inherit;text-align:center;outline:none;}
#gf-io-name:focus{border-color:#38bdf8;}
.gf-io-modes,.gf-io-vars{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.gf-io-vars{grid-template-columns:repeat(4,1fr);gap:5px;}
.gf-io-modes button,.gf-io-vars button{display:grid;gap:3px;padding:9px;border:1px solid var(--io-brd2);border-radius:7px;background:var(--io-hdr);color:var(--io-txt);font-family:inherit;cursor:pointer;text-align:center;}
.gf-io-vars button{padding:7px 3px;min-width:0;}
.gf-io-vars button b,.gf-io-vars button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gf-io-modes button b,.gf-io-vars button b{font-size:13px;}
.gf-io-vars button b{font-size:12px;}
.gf-io-modes button span,.gf-io-vars button span{font-size:10px;color:var(--io-txt2);}
.gf-io-modes button.active,.gf-io-vars button.active{border-color:#38bdf8;box-shadow:inset 0 0 0 1px #38bdf8;background:rgba(56,189,248,.1);}
.gf-io-sec{display:flex;align-items:center;justify-content:space-between;margin-top:2px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--io-txt3);}
.gf-io-sec em{font-style:normal;font-weight:700;letter-spacing:.2px;text-transform:none;color:#f59e0b;}
.gf-io-sec em#gf-io-skin-name{color:#38bdf8;}
.gf-io-skins{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;}
.gf-io-skins button{aspect-ratio:1;padding:2px;border:1px solid var(--io-brd2);border-radius:50%;background:var(--io-hdr);cursor:pointer;display:grid;place-items:center;transition:transform .12s;}
.gf-io-skins button:hover{transform:scale(1.08);}
.gf-io-skins button.active{border-color:#38bdf8;box-shadow:0 0 0 2px #38bdf8;}
.gf-io-skins canvas{width:100%;height:100%;display:block;}
#gf-io-status{font-size:11px;color:#16a34a;min-height:15px;}
#gf-io-status.is-wait{color:var(--io-txt3);}
#gf-io-play,#gf-io-again,#gf-io-resume{padding:11px;border:0;border-radius:6px;background:#54c800;color:#fff;font:800 16px inherit;font-family:inherit;cursor:pointer;}
#gf-io-play:hover:not(:disabled),#gf-io-again:hover,#gf-io-resume:hover{background:#4ab300;}
#gf-io-play:disabled{background:#9ca3af;cursor:default;}
.gf-io-ghost{padding:8px;border:1px solid var(--io-brd2);border-radius:6px;background:none;color:var(--io-txt2);font:600 13px inherit;font-family:inherit;cursor:pointer;}
.gf-io-check{display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:var(--io-txt2);}
.gf-io-keys{font-size:11px;color:var(--io-txt3);line-height:1.5;}
.gf-io-tip{font-size:10.5px;line-height:1.45;color:var(--io-txt2);padding:7px 9px;border-radius:7px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.35);}
#gf-io-results{display:grid;gap:4px;}
.gf-io-res{display:grid;grid-template-columns:12px 1fr auto;align-items:center;gap:8px;padding:5px 9px;border:1px solid var(--io-brd2);border-radius:6px;font-size:12px;color:var(--io-txt);text-align:left;}
.gf-io-res:first-child{border-color:#f5c542;background:rgba(245,197,66,.12);}
.gf-io-res i{width:10px;height:10px;border-radius:50%;}
.gf-io-res b{font-size:12px;color:var(--io-txt2);}
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
