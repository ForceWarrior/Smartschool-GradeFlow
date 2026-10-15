;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const ROWS    = 4;
  const COLS    = 4;
  const CELL    = 84;
  const GAP     = 10;
  const PAD     = 12;
  const WIN_VAL = 2048;
  const ANIM_MS = 115;
  const SPAWN_MS = 190;
  const POP_MS  = 210;
  const LS_BEST = 'gf-2048-best';
  const LS_TOP  = 'gf-2048-besttile';
  const OUT = '#2b2236';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const TAU = Math.PI * 2;
  const BWD = COLS * CELL + (COLS - 1) * GAP + PAD * 2;
  const BHT = ROWS * CELL + (ROWS - 1) * GAP + PAD * 2;

  const TD = {
    2:    { label: '1/20',  Pct: '5%',   bg: '#ef4444', fg: '#fff'    },
    4:    { label: '2/20',  Pct: '10%',  bg: '#f97316', fg: '#fff'    },
    8:    { label: '4/20',  Pct: '20%',  bg: '#f59e0b', fg: '#1a1a1a' },
    16:   { label: '6/20',  Pct: '30%',  bg: '#fbbf24', fg: '#1a1a1a' },
    32:   { label: '8/20',  Pct: '40%',  bg: '#a3e635', fg: '#1a1a1a' },
    64:   { label: '10/20', Pct: '50%',  bg: '#4ade80', fg: '#1a1a1a' },
    128:  { label: '12/20', Pct: '60%',  bg: '#22c55e', fg: '#fff'    },
    256:  { label: '14/20', Pct: '70%',  bg: '#10b981', fg: '#fff'    },
    512:  { label: '16/20', Pct: '80%',  bg: '#06b6d4', fg: '#fff'    },
    1024: { label: '18/20', Pct: '90%',  bg: '#8b5cf6', fg: '#fff'    },
    2048: { label: '20/20', Pct: '100%', bg: '#f59e0b', fg: '#1a1a1a', perfect: true },
  };
  function GetTileData(v) {
    return TD[v] || { label: `${v}`, Pct: '', bg: '#a78bfa', fg: '#fff', perfect: true };
  }

  function GetBestScore()  { try { return +localStorage.getItem(LS_BEST) || 0; } catch (_) { return 0; } }
  function SetBestScore(n) { try { if (n > GetBestScore()) localStorage.setItem(LS_BEST, n); } catch (_) {} }
  function GetTopTile()    { try { return +localStorage.getItem(LS_TOP) || 0; } catch (_) { return 0; } }
  function SetTopTile(n)   { try { localStorage.setItem(LS_TOP, n); } catch (_) {} }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function Mix(a, b, t) {
    const x = Hex(a), y = Hex(b);
    let s = '#';
    for (let i = 0; i < 3; i++) s += Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    return s;
  }
  function Lt(c, t) { return Mix(c, '#ffffff', t); }
  function Dk(c, t) { return Mix(c, '#000000', t); }
  function Rgba(c, a) { const x = Hex(c); return `rgba(${x[0]},${x[1]},${x[2]},${a})`; }
  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g };
  }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Star(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.3 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    g.closePath();
  }
  function EaseOut(t) { return 1 - (1 - t) * (1 - t); }
  function Back(t) { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function CX(c) { return PAD + c * (CELL + GAP); }
  function CY(r) { return PAD + r * (CELL + GAP); }

  let G   = null;
  let _id = 0;
  let _root = null, _cv = null, _ctx = null, _k = 1, _dark = false, _raf = null, _last = 0, _fitT = 0, _dirty = true;
  let _bg = null, _spr = {}, _glow = null;
  const _parts = Array.from({ length: 180 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, t: 0, T: 1, r: 1, c: '', k: 0 }));
  let _np = 0;
  const _pops = Array.from({ length: 10 }, () => ({ txt: '', c: '', x: 0, y: 0, t: 1, T: 1, z: 18 }));

  function EmptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }

  function NewGame() {
    _id = 0;
    G = { board: EmptyBoard(), tiles: new Map(), score: 0, best: GetBestScore(), top: GetTopTile(),
          status: 'playing', wonShown: false, anim: null, pending: null, undo: null };
    _np = 0;
    for (const p of _pops) p.t = p.T;
    SpawnTile(); SpawnTile();
    HideOverlays(); UpdateScore(); UpdateUndo();
    _dirty = true;
  }

  function SpawnTile() {
    const pool = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!G.board[r][c]) pool.push([r, c]);
    if (!pool.length) return false;
    const [r, c] = pool[Math.floor(Math.random() * pool.length)];
    const val = Math.random() < 0.85 ? 2 : 4;
    const id  = ++_id;
    G.board[r][c] = id;
    G.tiles.set(id, { id, val, row: r, col: c, fr: r, fc: c, spawn: 0, pop: -1 });
    return true;
  }

  function Horiz(dir) { return dir === 'left' || dir === 'right'; }
  function LineLen(dir) { return Horiz(dir) ? COLS : ROWS; }
  function GetLineIds(a, dir) {
    const n = LineLen(dir), out = [];
    for (let i = 0; i < n; i++) {
      const b = (dir === 'right' || dir === 'down') ? n - 1 - i : i;
      const id = Horiz(dir) ? G.board[a][b] : G.board[b][a];
      if (id) out.push(id);
    }
    return out;
  }
  function ToRowCol(a, pos, dir) {
    const idx = (dir === 'right' || dir === 'down') ? LineLen(dir) - 1 - pos : pos;
    return Horiz(dir) ? [a, idx] : [idx, a];
  }

  function DoMove(dir) {
    if (!G || G.status !== 'playing') return;
    if (G.anim) { G.pending = dir; return; }

    const moves   = new Map();
    const absorbs = new Map();
    const merges  = new Map();
    const newBoard = EmptyBoard();
    let totalScore = 0, anythingMoved = false;

    for (let a = 0; a < (Horiz(dir) ? ROWS : COLS); a++) {
      const ids = GetLineIds(a, dir);
      if (!ids.length) continue;

      const result = [];
      let i = 0;
      while (i < ids.length) {
        const va = G.tiles.get(ids[i]).val;
        if (i + 1 < ids.length && va === G.tiles.get(ids[i + 1]).val) {
          const nv = va * 2;
          result.push({ id: ids[i], newVal: nv, absorbedId: ids[i + 1] });
          totalScore += nv; i += 2;
        } else {
          result.push({ id: ids[i], newVal: va, absorbedId: null });
          i++;
        }
      }

      result.forEach((p, pos) => {
        const [toR, toC] = ToRowCol(a, pos, dir);
        const t = G.tiles.get(p.id);
        if (t.row !== toR || t.col !== toC) anythingMoved = true;
        moves.set(p.id, { toRow: toR, toCol: toC });
        if (p.absorbedId) absorbs.set(p.absorbedId, { toRow: toR, toCol: toC });
        if (p.newVal !== t.val) merges.set(p.id, p.newVal);
        newBoard[toR][toC] = p.id;
      });
    }

    if (!anythingMoved && !absorbs.size) return;

    G.undo = { tiles: [...G.tiles.values()].map(t => ({ id: t.id, val: t.val, row: t.row, col: t.col })), score: G.score, wonShown: G.wonShown };
    G.board = newBoard;
    const slide = (id, { toRow, toCol }) => {
      const t = G.tiles.get(id);
      t.fr = t.row; t.fc = t.col; t.row = toRow; t.col = toCol; t.spawn = -1; t.pop = -1;
    };
    moves.forEach((v, id) => slide(id, v));
    absorbs.forEach((v, id) => slide(id, v));
    G.anim = { t: 0, merges, absorbs, total: totalScore };
    _dirty = true;
  }

  function Commit() {
    const { merges, absorbs, total } = G.anim;
    G.anim = null;
    G.tiles.forEach(t => { t.fr = t.row; t.fc = t.col; });
    absorbs.forEach((_, id) => G.tiles.delete(id));
    merges.forEach((newVal, id) => {
      const t = G.tiles.get(id);
      if (!t) return;
      t.val = newVal; t.pop = 0;
      const d = GetTileData(newVal), x = CX(t.col) + CELL / 2, y = CY(t.row) + CELL / 2;
      const n = newVal >= 256 ? 14 : 8;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + Math.random() * 0.4, v = 90 + Math.random() * 120;
        Part(x + Math.cos(a) * CELL * 0.3, y + Math.sin(a) * CELL * 0.3, Math.cos(a) * v, Math.sin(a) * v, 0.45 + Math.random() * 0.25, CELL * (0.05 + Math.random() * 0.04), Lt(d.bg, 0.15), newVal >= 256 && i % 2 ? 1 : 0);
      }
      Popup(`+${newVal}`, x, y - CELL * 0.2, d.bg, 17);
    });

    if (total) {
      G.score += total;
      ScoreFloat(total);
    }
    if (G.score > G.best) { G.best = G.score; SetBestScore(G.best); }

    SpawnTile();

    let hasWin = false, maxV = 0;
    G.tiles.forEach(t => { if (t.val >= WIN_VAL) hasWin = true; if (t.val > maxV) maxV = t.val; });
    if (maxV > G.top) {
      const first = G.top > 0;
      G.top = maxV; SetTopTile(maxV);
      if (first && maxV >= 64) { Popup(_GameText('game_2048_new_top'), BWD / 2, BHT / 2, '#f59e0b', 22); BumpTop(); }
    }
    if (hasWin && !G.wonShown) { G.wonShown = true; G.status = 'won'; Confetti(); }
    else if (!CanMove()) G.status = 'gameover';

    UpdateScore(); UpdateUndo();
    const pd = G.pending;
    G.pending = null;
    if (G.status !== 'playing') setTimeout(ShowOverlay, G.status === 'won' ? 500 : 350);
    else if (pd) DoMove(pd);
  }

  function DoUndo() {
    if (!G || !G.undo) return;
    if (G.anim) { G.pending = null; Commit(); }
    const u = G.undo;
    if (!u) return;
    G.undo = null;
    G.tiles = new Map();
    G.board = EmptyBoard();
    for (const t of u.tiles) {
      G.tiles.set(t.id, { ...t, fr: t.row, fc: t.col, spawn: -1, pop: -1 });
      G.board[t.row][t.col] = t.id;
    }
    G.score = u.score; G.wonShown = u.wonShown; G.status = 'playing';
    _np = 0;
    HideOverlays(); UpdateScore(); UpdateUndo();
    _dirty = true;
  }

  function CanMove() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!G.board[r][c]) return true;
      const v = G.tiles.get(G.board[r][c])?.val;
      if (c + 1 < COLS && G.tiles.get(G.board[r][c + 1])?.val === v) return true;
      if (r + 1 < ROWS && G.tiles.get(G.board[r + 1][c])?.val === v) return true;
    }
    return false;
  }

  function Part(x, y, vx, vy, T, r, c, k) {
    if (_np >= _parts.length) return;
    const p = _parts[_np++];
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.T = T; p.r = r; p.c = c; p.k = k;
  }
  function Popup(txt, x, y, c, z) {
    let p = _pops[0];
    for (const q of _pops) if (q.t >= q.T) { p = q; break; }
    p.txt = txt; p.c = c; p.x = x; p.y = y; p.t = 0; p.T = z > 18 ? 1.4 : 0.75; p.z = z;
  }
  function Confetti() {
    const cols = ['#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ef4444', '#fbbf24'];
    for (let i = 0; i < 80; i++) Part(Math.random() * BWD, -10 - Math.random() * 50, (Math.random() - 0.5) * 70, 50 + Math.random() * 110, 1.8 + Math.random() * 0.6, 2.5 + Math.random() * 2.5, cols[i % 6], 2);
  }

  function PaintTile(g, s, d) {
    const r = s * 0.15, dep = Math.max(3, s * 0.065), lw = Math.max(1.2, s * 0.022), bg = d.bg;
    RR(g, lw / 2, lw / 2 + dep, s - lw, s - lw - dep, r); g.fillStyle = Dk(bg, 0.32); g.fill();
    RR(g, lw / 2, lw / 2, s - lw, s - lw - dep, r);
    const gr = g.createLinearGradient(0, 0, 0, s - dep);
    gr.addColorStop(0, Lt(bg, 0.24)); gr.addColorStop(0.55, bg); gr.addColorStop(1, Dk(bg, 0.08));
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.22)';
    RR(g, s * 0.06, s * 0.05, s * 0.88, (s - dep) * 0.38, r * 0.8); g.fill();
    g.restore();
    RR(g, lw * 1.6, lw * 1.6, s - lw * 3.2, s - lw * 3.2 - dep, r * 0.85);
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.32)'; g.stroke();
    RR(g, lw / 2, lw / 2, s - lw, s - lw, r); g.lineWidth = lw; g.strokeStyle = Mix(bg, OUT, 0.62); g.stroke();
    const cy = (s - dep) / 2;
    let fs = s * 0.27;
    g.font = `900 ${fs}px ${FONT}`;
    while (g.measureText(d.label).width > s * 0.8) { fs -= 0.5; g.font = `900 ${fs}px ${FONT}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const ty = d.Pct ? cy - s * 0.06 : cy;
    g.fillStyle = Rgba(Dk(bg, 0.45), 0.55); g.fillText(d.label, s / 2, ty + Math.max(1.2, s * 0.022));
    g.fillStyle = d.fg; g.fillText(d.label, s / 2, ty);
    if (d.Pct) {
      g.font = `800 ${s * 0.13}px ${FONT}`;
      g.globalAlpha = 0.8; g.fillText(d.Pct, s / 2, cy + s * 0.2); g.globalAlpha = 1;
    }
    if (d.perfect) {
      g.fillStyle = '#ffffff';
      Star(g, s * 0.2, s * 0.2, s * 0.07); g.fill();
      Star(g, s * 0.82, s * 0.68, s * 0.05); g.fill();
    }
  }

  function TileSpr(v) {
    if (_spr[v]) return _spr[v];
    const s = Cv(CELL, CELL, _k);
    PaintTile(s.g, CELL, GetTileData(v));
    return (_spr[v] = s);
  }

  function BuildBg() {
    const s = Cv(BWD, BHT, _k), g = s.g;
    const P = _dark
      ? { a: '#262a4b', b: '#1a1d36', well: '#12142a', wtop: 'rgba(0,0,0,0.45)', wbot: 'rgba(255,255,255,0.05)', edge: 'rgba(255,255,255,0.07)' }
      : { a: '#d6d0e8', b: '#c4bddb', well: '#e9e6f4', wtop: 'rgba(60,50,120,0.16)', wbot: 'rgba(255,255,255,0.8)', edge: 'rgba(255,255,255,0.6)' };
    RR(g, 0, 0, BWD, BHT, 14);
    const gr = g.createLinearGradient(0, 0, 0, BHT);
    gr.addColorStop(0, P.a); gr.addColorStop(1, P.b);
    g.fillStyle = gr; g.fill();
    RR(g, 1, 1, BWD - 2, BHT - 2, 13); g.lineWidth = 1.5; g.strokeStyle = P.edge; g.stroke();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = CX(c), y = CY(r);
      RR(g, x, y, CELL, CELL, CELL * 0.15); g.fillStyle = P.well; g.fill();
      g.save(); g.clip();
      g.fillStyle = P.wtop; g.fillRect(x, y, CELL, 3);
      g.fillStyle = P.wbot; g.fillRect(x, y + CELL - 1.5, CELL, 1.5);
      g.restore();
    }
    return s;
  }

  function Rebuild() {
    _spr = {};
    _bg = BuildBg();
    const s = Cv(CELL * 1.6, CELL * 1.6, _k), g = s.g, q = CELL * 0.8;
    const gr = g.createRadialGradient(q, q, CELL * 0.3, q, q, q);
    gr.addColorStop(0, 'rgba(250,204,21,0.75)'); gr.addColorStop(1, 'rgba(250,204,21,0)');
    g.fillStyle = gr; g.fillRect(0, 0, CELL * 1.6, CELL * 1.6);
    _glow = s;
    BuildArt();
    _dirty = true;
  }

  function BuildArt() {
    const k = Math.min(3, W.devicePixelRatio || 1);
    const img = (v, el) => {
      if (!el) return;
      const s = Cv(CELL, CELL, k);
      PaintTile(s.g, CELL, GetTileData(v));
      el.src = s.c.toDataURL();
    };
    img(2048, document.getElementById('gf-28-win-img'));
  }

  function Update(dt) {
    const s = dt / 1000;
    let busy = false;
    if (G.anim) { G.anim.t += dt; busy = true; }
    G.tiles.forEach(t => {
      if (t.spawn >= 0) { t.spawn += dt; if (t.spawn >= SPAWN_MS) t.spawn = -1; busy = true; }
      if (t.pop >= 0) { t.pop += dt; if (t.pop >= POP_MS) t.pop = -1; busy = true; }
      if (t.val >= WIN_VAL) busy = true;
    });
    for (let i = _np - 1; i >= 0; i--) {
      const p = _parts[i];
      p.t += s;
      if (p.t >= p.T) { _parts[i] = _parts[--_np]; _parts[_np] = p; continue; }
      if (p.k === 2) { p.vy += 60 * s; } else { p.vx *= 1 - s * 4; p.vy *= 1 - s * 4; }
      p.x += p.vx * s; p.y += p.vy * s;
    }
    if (_np) busy = true;
    for (const p of _pops) if (p.t < p.T) { p.t += s; busy = true; }
    if (G.anim && G.anim.t >= ANIM_MS) Commit();
    return busy;
  }

  function Frame(ts) {
    _raf = requestAnimationFrame(Frame);
    const dt = Math.min(50, ts - (_last || ts));
    _last = ts;
    if (!G || !_root || _root.style.display === 'none') return;
    if (Update(dt) || _dirty) { _dirty = false; Draw(); }
  }

  function Draw() {
    if (!_ctx || !_bg) return;
    const x = _ctx, now = performance.now();
    x.setTransform(_k, 0, 0, _k, 0, 0);
    x.clearRect(0, 0, BWD, BHT);
    x.drawImage(_bg.c, 0, 0, BWD, BHT);
    const u = G.anim ? EaseOut(Math.min(1, G.anim.t / ANIM_MS)) : 1;
    const absorbs = G.anim ? G.anim.absorbs : null;
    for (let pass = 0; pass < 2; pass++) {
      G.tiles.forEach(t => {
        if ((pass === 0) !== !!(absorbs && absorbs.has(t.id))) return;
        const px = CX(t.fc) + (CX(t.col) - CX(t.fc)) * u, py = CY(t.fr) + (CY(t.row) - CY(t.fr)) * u;
        let sc = 1;
        if (t.spawn >= 0) sc = Math.max(0, Back(t.spawn / SPAWN_MS));
        else if (t.pop >= 0) sc = 1 + 0.2 * Math.sin(Math.PI * t.pop / POP_MS);
        if (t.val >= WIN_VAL) {
          x.globalAlpha = 0.55 + 0.35 * Math.sin(now / 300);
          x.drawImage(_glow.c, px - CELL * 0.3, py - CELL * 0.3, CELL * 1.6, CELL * 1.6);
          x.globalAlpha = 1;
        }
        const w = CELL * sc, o = (CELL - w) / 2;
        if (sc < 1 || t.pop >= 0) {
          x.fillStyle = _dark ? 'rgba(0,0,0,0.3)' : 'rgba(50,40,110,0.12)';
          RR(x, px + o + 2, py + o + 5, w - 4, w - 2, CELL * 0.15); x.fill();
        }
        x.drawImage(TileSpr(t.val).c, px + o, py + o, w, w);
      });
    }

    for (let i = 0; i < _np; i++) {
      const p = _parts[i], q = p.t / p.T;
      x.globalAlpha = 1 - q * q;
      x.fillStyle = p.c;
      if (p.k === 2) { x.save(); x.translate(p.x, p.y); x.rotate(p.t * 7 + i); x.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); x.restore(); }
      else if (p.k === 1) { x.fillStyle = '#ffffff'; Star(x, p.x, p.y, p.r * 1.8 * (1 - q * 0.5)); x.fill(); }
      else { x.beginPath(); x.arc(p.x, p.y, p.r * (1 - q * 0.5), 0, TAU); x.fill(); }
    }
    x.globalAlpha = 1;

    x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    for (const p of _pops) {
      if (p.t >= p.T) continue;
      const q = p.t / p.T, sc = q < 0.18 ? 0.7 + q / 0.18 * 0.4 : q < 0.3 ? 1.1 - (q - 0.18) * 0.8 : 1;
      x.globalAlpha = q > 0.6 ? 1 - (q - 0.6) / 0.4 : 1;
      x.save(); x.translate(p.x, p.y - q * 30); x.scale(sc, sc);
      x.font = p.z > 18 ? F_BIG : F_POP;
      x.lineWidth = p.z > 18 ? 6 : 4.5; x.strokeStyle = OUT; x.strokeText(p.txt, 0, 0);
      x.fillStyle = p.z > 18 ? '#fde047' : Lt(p.c, 0.25); x.fillText(p.txt, 0, 0);
      x.restore();
    }
    x.globalAlpha = 1;
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  const F_POP = `900 17px ${FONT}`, F_BIG = `900 22px ${FONT}`;

  function UpdateScore() {
    const s = document.getElementById('gf-28-score'); if (s) s.textContent = G.score.toLocaleString();
    const b = document.getElementById('gf-28-best');  if (b) b.textContent = G.best.toLocaleString();
    const t = document.getElementById('gf-28-topt');
    if (t) {
      const d = GetTileData(G.top || 2);
      t.textContent = G.top ? d.label : '-';
      t.style.background = G.top ? `linear-gradient(180deg,${Lt(d.bg, 0.2)},${d.bg})` : '';
      t.style.color = G.top ? d.fg : '';
      t.style.boxShadow = G.top ? `inset 0 -3px 0 ${Dk(d.bg, 0.3)}, 0 2px 8px ${Rgba(d.bg, 0.4)}` : '';
    }
  }
  function UpdateUndo() {
    const can = !!G?.undo && !G.anim;
    ['gf-28-undo', 'gf-28-undo2'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = !can; });
  }
  function ScoreFloat(n) {
    const box = document.getElementById('gf-28-scorebox');
    if (!box) return;
    const f = document.createElement('span');
    f.className = 'gf28-float';
    f.textContent = `+${n}`;
    f.addEventListener('animationend', () => f.remove());
    box.appendChild(f);
  }
  function BumpTop() {
    const t = document.getElementById('gf-28-topt');
    if (!t) return;
    t.classList.remove('gf28-bump'); void t.offsetWidth; t.classList.add('gf28-bump');
  }

  function HideOverlays() {
    ['gf-28-ovr-win', 'gf-28-ovr-over'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
  }
  function ShowOverlay() {
    if (!G) return;
    if (G.status === 'won') {
      const el = document.getElementById('gf-28-ovr-win'); if (el) el.style.display = 'flex';
    } else if (G.status === 'gameover') {
      const el = document.getElementById('gf-28-ovr-over');
      if (el) {
        el.style.display = 'flex';
        const sc = el.querySelector('#gf-28-ovr-score');
        if (sc) sc.textContent = `${_GameText('game_score')}: ${G.score.toLocaleString()}`;
        const img = document.getElementById('gf-28-over-img');
        if (img) {
          const s = Cv(CELL, CELL, Math.min(3, W.devicePixelRatio || 1));
          let maxV = 2;
          G.tiles.forEach(t => { if (t.val > maxV) maxV = t.val; });
          PaintTile(s.g, CELL, GetTileData(maxV));
          img.src = s.c.toDataURL();
        }
      }
    }
  }

  const DIR_MAP = {
    ArrowLeft:'left',a:'left',A:'left',
    ArrowRight:'right',d:'right',D:'right',
    ArrowUp:'up',w:'up',W:'up',
    ArrowDown:'down',s:'down',S:'down',
  };
  let _kh = null;
  function OnKey(e) {
    const el = document.getElementById('gf-2048');
    if (!el || el.style.display === 'none') return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGrade2048(); return; }
    if (e.key === 'F8')     { e.preventDefault(); e.stopPropagation(); return; }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); NewGame(); return; }
    if (e.key === 'u' || e.key === 'U' || e.key === 'Backspace' || ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey))) {
      e.preventDefault(); e.stopPropagation(); DoUndo(); return;
    }
    const dir = DIR_MAP[e.key];
    if (dir) { e.preventDefault(); e.stopPropagation(); DoMove(dir); }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); W.addEventListener('resize', Fit); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; W.removeEventListener('resize', Fit); } }

  function AddSwipe(el) {
    let sx, sy;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 30) return;
      DoMove(adx > ady ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });
  }

  function ApplyTheme() {
    const el = document.getElementById('gf-2048'); if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter  = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    const d = el.dataset.theme === 'dark';
    if (d !== _dark) { _dark = d; if (_bg) Rebuild(); }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.6, Math.min(1, (innerHeight - 32 - 54 - 28 - 70) / BHT, (innerWidth - 32 - 28) / BWD));
    const dpr = Math.min(3, W.devicePixelRatio || 1), w = Math.round(BWD * s), h = Math.round(BHT * s);
    const wrap = document.getElementById('gf-28-grid-wrap');
    wrap.style.width = `${w}px`; wrap.style.height = `${h}px`;
    _root.style.setProperty('--g2-board-w', `${w}px`);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    clearTimeout(_fitT);
    const go = () => { _cv.width = bw; _cv.height = bh; _k = bw / BWD; Rebuild(); };
    if (!_bg) go();
    else if (_cv.width !== bw || _cv.height !== bh) _fitT = setTimeout(go, 120);
  }

  function BuildOverlay() {
    if (document.getElementById('gf-2048')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-2048';
    root.innerHTML = `
<div id="gf-28-modal">
  <div id="gf-28-hdr">
    <div class="gf-28-hl">
      <div id="gf-28-logo"><span>20</span><span>48</span></div>
      <div>
        <div id="gf-28-title">Grade 2048</div>
        <div id="gf-28-sub">${_GameText('game_2048_subtitle')}</div>
      </div>
    </div>
    <div class="gf-28-hr">
      <div class="gf-28-sbox" id="gf-28-scorebox"><div class="gf-28-slbl">${_GameText('game_score').toUpperCase()}</div><div id="gf-28-score">0</div></div>
      <div class="gf-28-sbox"><div class="gf-28-slbl">${_GameText('game_best').toUpperCase()}</div><div id="gf-28-best">0</div></div>
      <div class="gf-28-sbox gf-28-topbox" title="${_GameText('game_2048_best_tile')}"><div class="gf-28-slbl">${_GameText('game_2048_best_tile').toUpperCase()}</div><div id="gf-28-topt">-</div></div>
      <button id="gf-28-undo" title="${_GameText('game_2048_undo')}" disabled>↶</button>
      <button id="gf-28-new" title="${_GameText('game_new_game_r')}">↺</button>
      <button id="gf-28-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-28-body">
    <div id="gf-28-grid-wrap" style="width:${BWD}px;height:${BHT}px;">
      <canvas id="gf-28-cv"></canvas>
      <div id="gf-28-ovr-win" style="display:none">
        <div class="gf28-card">
          <img id="gf-28-win-img" class="gf28-ovr-img gf28-ovr-spin" alt="">
          <div class="gf28-ovr-title gf28-win-t">${_GameText('game_2048_perfect')}</div>
          <div class="gf28-ovr-sub">${_GameText('game_2048_reached')}</div>
          <button class="gf28-btn" id="gf-28-continue">${_GameText('game_2048_keep_going')}</button>
          <button class="gf28-btn gf28-btn-sec" id="gf-28-new2">${_GameText('game_new_game')}</button>
        </div>
      </div>
      <div id="gf-28-ovr-over" style="display:none">
        <div class="gf28-card">
          <img id="gf-28-over-img" class="gf28-ovr-img" alt="">
          <div class="gf28-ovr-title" style="color:#ef4444">${_GameText('game_2048_no_moves')}</div>
          <div id="gf-28-ovr-score" class="gf28-ovr-sub"></div>
          <button class="gf28-btn" id="gf-28-retry">${_GameText('game_try_again')} ↺</button>
          <button class="gf28-btn gf28-btn-sec" id="gf-28-undo2">↶ ${_GameText('game_2048_undo')}</button>
        </div>
      </div>
    </div>
    <div id="gf-28-legend">
      ${Object.entries(TD).map(([, d]) =>
        `<div class="gf28-leg" style="background:linear-gradient(180deg,${Lt(d.bg, 0.2)},${d.bg});color:${d.fg};box-shadow:inset 0 -2px 0 ${Dk(d.bg, 0.3)}">${d.label}${d.perfect ? ' ★' : ''}</div>`
      ).join('')}
    </div>
    <div id="gf-28-hint">${_GameText('game_2048_hint')} · ${_GameText('game_2048_undo')}</div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.getElementById('gf-28-cv');
    _ctx = _cv.getContext('2d');

    document.getElementById('gf-28-close')  ?.addEventListener('click', CloseGrade2048);
    document.getElementById('gf-28-new')    ?.addEventListener('click', NewGame);
    document.getElementById('gf-28-undo')   ?.addEventListener('click', DoUndo);
    document.getElementById('gf-28-undo2')  ?.addEventListener('click', DoUndo);
    document.getElementById('gf-2048')?.addEventListener('click', e => { if (e.target.id === 'gf-2048') BossKey2048(); });
    document.getElementById('gf-28-new2')   ?.addEventListener('click', NewGame);
    document.getElementById('gf-28-retry')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-28-continue')?.addEventListener('click', () => {
      G.status = 'playing'; HideOverlays();
    });
    AddSwipe(document.getElementById('gf-28-grid-wrap'));
  }

  function OpenGrade2048() {
    if (!document.getElementById('gf-2048')) BuildOverlay();
    const el = document.getElementById('gf-2048');
    el.style.display = 'flex';
    ApplyTheme();
    Fit();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    if (!G) NewGame(); else { UpdateScore(); UpdateUndo(); }
    _dirty = true;
    if (!_raf) { _last = 0; _raf = requestAnimationFrame(Frame); }
  }

  function CloseGrade2048() {
    const el = document.getElementById('gf-2048');
    if (el) el.style.display = 'none';
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    DetachKeys(); _tobs.disconnect();
  }

  function ToggleGrade2048() {
    const el = document.getElementById('gf-2048');
    if (el && el.style.display !== 'none') CloseGrade2048(); else OpenGrade2048();
  }

  function BossKey2048() {
    const el = document.getElementById('gf-2048'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex'; delete el.dataset.bossHidden; _dirty = true; return true;
    }
    if (el.style.display !== 'none') {
      el.style.display = 'none'; el.dataset.bossHidden = '1'; return true;
    }
    return false;
  }

  W.OpenGrade2048  = OpenGrade2048;
  W.CloseGrade2048 = CloseGrade2048;
  W.ToggleGrade2048 = ToggleGrade2048;
  W.BossKey2048    = BossKey2048;

  function InjectCSS() {
    if (document.getElementById('gf-2048-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-2048-css';
    s.textContent = `
#gf-2048 {
  --g2-modal:#ffffff;--g2-hdr:#f6f5fb;--g2-brd:rgba(245,158,11,.26);--g2-brd2:#e4e2ee;
  --g2-cell:rgba(0,0,0,.06);--g2-txt:#17142a;--g2-txt2:#4a4660;--g2-txt3:#8a86a0;
  --g2-btn:#ffffff;--g2-btn-brd:#d4d1e0;--g2-sbox:#efedf7;
  --g2-sh:0 8px 40px rgba(30,20,60,.16),0 1px 4px rgba(30,20,60,.06);
  --g2-ovr:rgba(246,245,252,.62);--g2-body:#f4f3fa;
}
#gf-2048[data-theme="dark"] {
  --g2-modal:rgba(18,19,32,.98);--g2-hdr:rgba(12,13,24,.96);--g2-brd:rgba(245,158,11,.22);
  --g2-brd2:#262840;--g2-cell:rgba(255,255,255,.05);--g2-txt:#f3f2fa;--g2-txt2:#b4b2c8;--g2-txt3:#6f6d88;
  --g2-btn:#1c1e34;--g2-btn-brd:#34374f;--g2-sbox:#1c1e34;
  --g2-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --g2-ovr:rgba(8,9,20,.6);--g2-body:rgba(14,15,27,.98);
}
#gf-2048{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-2048 *{box-sizing:border-box;}
#gf-28-modal{display:flex;flex-direction:column;background:var(--g2-modal);border:1px solid var(--g2-brd);border-radius:14px;box-shadow:var(--g2-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
#gf-28-hdr{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--g2-hdr);border-bottom:1px solid var(--g2-brd);flex-shrink:0;gap:10px;user-select:none;}
.gf-28-hl{display:flex;align-items:center;gap:10px;min-width:0;} .gf-28-hr{display:flex;align-items:center;gap:5px;}
#gf-28-logo{width:32px;height:32px;background:linear-gradient(150deg,#fbbf24,#f59e0b 50%,#ea580c);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:.95;font-family:${FONT};font-size:10px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2),0 2px 8px rgba(245,158,11,.4);text-shadow:0 1px 0 rgba(0,0,0,.25);}
#gf-28-title{font-size:14px;font-weight:700;color:var(--g2-txt);letter-spacing:-.3px;line-height:1.2;white-space:nowrap;}
#gf-28-sub{font-size:9px;color:var(--g2-txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}
.gf-28-sbox{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;height:36px;padding:3px 9px;background:var(--g2-sbox);border:1px solid var(--g2-brd2);border-radius:8px;min-width:54px;}
.gf-28-slbl{font-size:7px;font-weight:700;letter-spacing:1.2px;color:var(--g2-txt3);white-space:nowrap;}
.gf-28-sbox > div:nth-child(2){font-size:15px;font-weight:800;color:var(--g2-txt);line-height:1.2;font-variant-numeric:tabular-nums;}
#gf-28-topt{margin-top:1px;padding:1px 6px;border-radius:5px;font-family:${FONT};font-size:11px!important;font-weight:900!important;line-height:1.4!important;}
.gf28-bump{animation:gf28-bump .6s cubic-bezier(.2,.9,.3,1.4);}
@keyframes gf28-bump{0%{transform:scale(1)}30%{transform:scale(1.35) rotate(-6deg)}100%{transform:scale(1)}}
.gf28-float{position:absolute;left:50%;top:6px;transform:translateX(-50%);font-size:12px;font-weight:800;color:#f59e0b;pointer-events:none;animation:gf28-float .8s ease-out forwards;}
@keyframes gf28-float{0%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-26px)}}
#gf-28-undo,#gf-28-new,#gf-28-close{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--g2-btn-brd);border-radius:7px;background:var(--g2-btn);color:var(--g2-txt2);cursor:pointer;font-size:14px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s,opacity .12s;}
#gf-28-undo:hover:not(:disabled),#gf-28-new:hover{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.1);}
#gf-28-undo:disabled{opacity:.35;cursor:default;}
#gf-28-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-28-body{display:flex;flex-direction:column;align-items:center;padding:14px;gap:10px;overflow-y:auto;background:var(--g2-body);}
#gf-28-grid-wrap{position:relative;flex-shrink:0;border-radius:14px;box-shadow:0 12px 28px rgba(30,20,70,.22);touch-action:none;}
#gf-28-cv{display:block;width:100%;height:100%;}
#gf-28-ovr-win,#gf-28-ovr-over{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:var(--g2-ovr);border-radius:14px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:18px;animation:gf28-fade .25s ease-out;}
@keyframes gf28-fade{from{opacity:0}to{opacity:1}}
@keyframes gf28-rise{from{transform:translateY(12px) scale(.96);opacity:0}to{transform:none;opacity:1}}
@keyframes gf28-spin{0%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.06)}100%{transform:rotate(-8deg) scale(1)}}
.gf28-card{display:flex;flex-direction:column;align-items:center;gap:9px;padding:18px 22px;min-width:220px;background:var(--g2-modal);border:1px solid var(--g2-brd);border-radius:16px;box-shadow:0 18px 50px rgba(20,10,50,.3);text-align:center;animation:gf28-rise .3s cubic-bezier(.2,.9,.3,1.2);}
.gf28-ovr-img{width:58px;height:58px;filter:drop-shadow(0 6px 12px rgba(0,0,0,.2));}
.gf28-ovr-spin{animation:gf28-spin 2.2s ease-in-out infinite;}
.gf28-ovr-title{font-size:21px;font-weight:800;letter-spacing:-0.5px;}
.gf28-win-t{background:linear-gradient(180deg,#fde68a,#f59e0b 55%,#b45309);-webkit-background-clip:text;background-clip:text;color:transparent;}
.gf28-ovr-sub{font-size:11px;color:var(--g2-txt2);}
.gf28-btn{min-width:170px;padding:10px 22px;border:none;border-radius:10px;background:linear-gradient(180deg,#fbbf24,#f59e0b);color:#422006;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.3px;box-shadow:0 3px 0 #b45309,0 6px 18px rgba(245,158,11,.35);transition:transform .12s,box-shadow .12s,filter .12s;}
.gf28-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 4px 0 #b45309,0 10px 22px rgba(245,158,11,.4);}
.gf28-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #b45309;}
.gf28-btn-sec{border:1px solid var(--g2-btn-brd);color:var(--g2-txt2);background:transparent;box-shadow:none;padding:8px 18px;}
.gf28-btn-sec:hover,.gf28-btn-sec:active{background:rgba(128,128,128,.1);box-shadow:none;}
.gf28-btn-sec:disabled{display:none;}
#gf-28-legend{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:var(--g2-board-w, ${BWD}px);}
.gf28-leg{padding:3px 7px 4px;border-radius:6px;font-family:${FONT};font-size:9px;font-weight:900;letter-spacing:.2px;white-space:nowrap;}
#gf-28-hint{font-size:9px;color:var(--g2-txt3);text-align:center;max-width:var(--g2-board-w, ${BWD}px);line-height:1.6;}
#gf-28-hint strong{color:var(--g2-txt2);}
`;
    document.head.appendChild(s);
  }

})(window);
