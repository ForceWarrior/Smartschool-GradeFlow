;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const ALL_GRADES = [
    { id: 'g06', label: '6/20',  sub: '30%', bg: '#ef4444', fg: '#fff'      },
    { id: 'g07', label: '7/20',  sub: '35%', bg: '#f97316', fg: '#fff'      },
    { id: 'g08', label: '8/20',  sub: '40%', bg: '#f59e0b', fg: '#1a1a1a'  },
    { id: 'g09', label: '9/20',  sub: '45%', bg: '#fbbf24', fg: '#1a1a1a'  },
    { id: 'g10', label: '10/20', sub: '50%', bg: '#4ade80', fg: '#1a1a1a'  },
    { id: 'g11', label: '11/20', sub: '55%', bg: '#22c55e', fg: '#fff'      },
    { id: 'g12', label: '12/20', sub: '60%', bg: '#16a34a', fg: '#fff'      },
    { id: 'g13', label: '13/20', sub: '65%', bg: '#10b981', fg: '#fff'      },
    { id: 'g14', label: '14/20', sub: '70%', bg: '#06b6d4', fg: '#fff'      },
    { id: 'g15', label: '15/20', sub: '75%', bg: '#3b82f6', fg: '#fff'      },
    { id: 'g16', label: '16/20', sub: '80%', bg: '#6366f1', fg: '#fff'      },
    { id: 'g17', label: '17/20', sub: '85%', bg: '#8b5cf6', fg: '#fff'      },
    { id: 'g18', label: '18/20', sub: '90%', bg: '#a855f7', fg: '#fff'      },
    { id: 'g19', label: '19/20', sub: '95%', bg: '#ec4899', fg: '#fff'      },
    { id: 'g20', label: '20/20', sub: '100%', bg: '#f59e0b', fg: '#1a1a1a', perfect: true },
  ];

  const SUBJECTS = [
    { id: 'pi', col: '#3b82f6' }, { id: 'book', col: '#ef4444' }, { id: 'talk', col: '#f97316' },
    { id: 'hourglass', col: '#a16207' }, { id: 'globe', col: '#0891b2' }, { id: 'leaf', col: '#16a34a' },
    { id: 'flask', col: '#9333ea' }, { id: 'atom', col: '#2563eb' }, { id: 'screen', col: '#475569' },
    { id: 'note', col: '#db2777' }, { id: 'ball', col: '#ea580c' }, { id: 'palette', col: '#ca8a04' },
    { id: 'bulb', col: '#eab308' }, { id: 'coin', col: '#059669' },
  ];

  const SHAPES = [
    { id: 'star', col: '#facc15' }, { id: 'heart', col: '#ef4444' }, { id: 'diamond', col: '#06b6d4' },
    { id: 'hex', col: '#8b5cf6' }, { id: 'tri', col: '#22c55e' }, { id: 'circle', col: '#f97316' },
    { id: 'square', col: '#3b82f6' }, { id: 'moon', col: '#6366f1' }, { id: 'bolt', col: '#eab308' },
    { id: 'drop', col: '#0ea5e9' }, { id: 'plus', col: '#ec4899' }, { id: 'ring', col: '#14b8a6' },
    { id: 'penta', col: '#f43f5e' }, { id: 'clover', col: '#65a30d' },
  ];

  const SETS = [
    { id: 'grades',   label: () => _GameText('game_mem_set_grades'),   items: ALL_GRADES },
    { id: 'subjects', label: () => _GameText('game_mem_set_subjects'), items: SUBJECTS },
    { id: 'shapes',   label: () => _GameText('game_mem_set_shapes'),   items: SHAPES },
  ];

  const DIFFICULTIES = [
    { id: 'easy',   label: () => _GameText('game_mem_easy'),   cols: 4, rows: 3, pairs: 6  },
    { id: 'medium', label: () => _GameText('game_mem_medium'), cols: 4, rows: 4, pairs: 8  },
    { id: 'hard',   label: () => _GameText('game_mem_hard'),   cols: 5, rows: 4, pairs: 10 },
    { id: 'expert', label: () => _GameText('game_expert'),     cols: 6, rows: 4, pairs: 12 },
  ];

  const CARD_W = { easy: 92, medium: 84, hard: 76, expert: 70 };
  const CARD_H = { easy: 118, medium: 108, hard: 98, expert: 90 };
  const CARD_GAP = 10;
  const MARGIN = 16;
  const TAU = Math.PI * 2;
  const ACCENT = '#a78bfa';
  const FLIP_MS = 360;
  const DEAL_MS = 420;
  const PN = 320;

  const LS_BEST = 'gf-mem-best';
  const LS_SET = 'gf-mem-set';
  const FLIP_DELAY_MS = 720;

  const PAL = {
    light: {
      dark: false, felt: '#f1ecfe', felt2: '#e2d9fb', dot: 'rgba(109,40,217,0.08)', back: ['#a78bfa', '#6d28d9'], backEdge: '#4c1d95',
      backLine: 'rgba(255,255,255,0.32)', out: '#2e1065', face: '#fffdf8', face2: '#f4efe4', faceEdge: '#cfc5b3', ink: '#1f2937', muted: '#8a7f6c',
      shadow: 'rgba(46,16,101,0.32)', disc: 0.78,
    },
    dark: {
      dark: true, felt: '#15112a', felt2: '#0b0918', dot: 'rgba(167,139,250,0.07)', back: ['#8b5cf6', '#4c1d95'], backEdge: '#24104f',
      backLine: 'rgba(255,255,255,0.2)', out: '#05010f', face: '#2a2e42', face2: '#20232f', faceEdge: '#0f1119', ink: '#f1f5f9', muted: '#94a3b8',
      shadow: 'rgba(0,0,0,0.65)', disc: -0.55,
    },
  };

  function LoadBests() { try { return JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch (_) { return {}; } }
  function SaveBestScore(id, moves, secs) {
    const b = LoadBests();
    const prev = b[id];
    if (!prev || moves < prev.moves || (moves === prev.moves && secs < prev.secs))
      b[id] = { moves, secs };
    try { localStorage.setItem(LS_BEST, JSON.stringify(b)); } catch (_) {}
  }
  function GetBestScore(id) { return LoadBests()[id] || null; }
  function LoadSet() { try { return localStorage.getItem(LS_SET) || 'grades'; } catch (_) { return 'grades'; } }
  function SaveSet(v) { try { localStorage.setItem(LS_SET, v); } catch (_) {} }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function Mix(a, b, t) {
    const x = Hex(a), y = Hex(b);
    let s = '#';
    for (let i = 0; i < 3; i++) s += Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    return s;
  }
  function Lt(c, t) { return Mix(c, '#ffffff', t); }
  function Dk(c, t) { return Mix(c, '#000000', t); }
  function Tone(c, t) { return t >= 0 ? Lt(c, t) : Dk(c, -t); }
  function Cv(w, h, k) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * k));
    c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { c, g, w, h };
  }
  function RR(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function StarPath(g, x, y, r1, r2, n) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, r = i % 2 ? r2 : r1; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath();
  }
  function EaseBack(t) { const c = 1.7, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; }
  function EaseOut(t) { return 1 - (1 - t) * (1 - t); }
  function EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2; }
  const FONT = '"Segoe UI", system-ui, -apple-system, Arial, sans-serif';

  function CardBody(g, w, h, top, top2, edge, out, lip) {
    const r = Math.min(w, h) * 0.13;
    RR(g, 1, 1, w - 2, h - 2, r); g.fillStyle = edge; g.fill();
    const gr = g.createLinearGradient(0, 0, w * 0.4, h);
    gr.addColorStop(0, top); gr.addColorStop(1, top2);
    RR(g, 1, 1, w - 2, h - 2 - lip, r); g.fillStyle = gr; g.fill();
    RR(g, 1, 1, w - 2, h - 2, r); g.lineWidth = 1.4; g.strokeStyle = out; g.stroke();
    return r;
  }

  function BackArt(w, h, k, P) {
    const s = Cv(w, h, k), g = s.g, lip = 4;
    const r = CardBody(g, w, h, P.back[0], P.back[1], P.backEdge, Rgb(P.out, 0.7), lip);
    g.save();
    RR(g, 1, 1, w - 2, h - 2 - lip, r); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = -h; x < w + h; x += 10) { g.moveTo(x, 0); g.lineTo(x + h, h); g.moveTo(x + h, 0); g.lineTo(x, h); }
    g.stroke();
    const gl = g.createLinearGradient(0, 0, 0, h * 0.5);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(0, 0, w, h * 0.5);
    g.restore();
    const m = w * 0.09;
    RR(g, m, m, w - m * 2, h - m * 2 - lip, r * 0.6); g.lineWidth = 1.5; g.strokeStyle = P.backLine; g.stroke();
    const cx = w / 2, cy = (h - lip) / 2, R = w * 0.22;
    Circ(g, cx, cy + 1.5, R); g.fillStyle = 'rgba(20,6,50,0.3)'; g.fill();
    Circ(g, cx, cy, R); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fill();
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
    StarPath(g, cx, cy, R * 0.66, R * 0.28, 5);
    g.fillStyle = '#fef3c7'; g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#92400e'; g.stroke();
    StarPath(g, cx - R * 0.08, cy - R * 0.12, R * 0.26, R * 0.11, 5); g.fillStyle = '#ffffff'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (const [x, y] of [[m + 5, m + 5], [w - m - 5, m + 5], [m + 5, h - lip - m - 5], [w - m - 5, h - lip - m - 5]]) { Circ(g, x, y, 1.6); g.fill(); }
    return s;
  }

  function Rgb(c, a) { const x = Hex(c); return `rgba(${x[0]},${x[1]},${x[2]},${a})`; }

  function FrontBase(g, w, h, P, perfect) {
    const lip = 4;
    const r = perfect
      ? CardBody(g, w, h, '#fff3c4', '#f8c64a', '#b7791f', Rgb('#78350f', 0.75), lip)
      : CardBody(g, w, h, P.face, P.face2, P.faceEdge, Rgb(P.out, P.dark ? 0.8 : 0.45), lip);
    const m = w * 0.07;
    RR(g, m, m, w - m * 2, h - m * 2 - lip, r * 0.6);
    g.lineWidth = 1; g.strokeStyle = perfect ? 'rgba(146,64,14,0.35)' : P.dark ? 'rgba(255,255,255,0.07)' : 'rgba(120,100,70,0.18)'; g.stroke();
    return lip;
  }

  function FitFont(g, txt, weight, size, maxW) {
    let s = size;
    g.font = `${weight} ${s}px ${FONT}`;
    while (s > 6 && g.measureText(txt).width > maxW) { s -= 1; g.font = `${weight} ${s}px ${FONT}`; }
    return s;
  }

  function GradeFace(g, w, h, P, it) {
    const lip = FrontBase(g, w, h, P, it.perfect);
    const bx = w * 0.13, by = h * 0.2, bw = w * 0.74, bh = h * 0.4;
    RR(g, bx, by + 2.5, bw, bh, bw * 0.16); g.fillStyle = Dk(it.bg, 0.45); g.fill();
    const gr = g.createLinearGradient(0, by, 0, by + bh);
    gr.addColorStop(0, Lt(it.bg, 0.22)); gr.addColorStop(1, it.bg);
    RR(g, bx, by, bw, bh, bw * 0.16); g.fillStyle = gr; g.fill();
    g.lineWidth = 1.4; g.strokeStyle = Dk(it.bg, 0.4); g.stroke();
    RR(g, bx + bw * 0.12, by + bh * 0.1, bw * 0.76, bh * 0.16, bh * 0.08); g.fillStyle = 'rgba(255,255,255,0.32)'; g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    FitFont(g, it.label, 900, Math.round(w * 0.27), bw * 0.86);
    if (it.fg === '#fff') { g.lineWidth = 2.2; g.strokeStyle = Dk(it.bg, 0.35); g.strokeText(it.label, w / 2, by + bh * 0.55); }
    g.fillStyle = it.fg; g.fillText(it.label, w / 2, by + bh * 0.55);
    g.font = `800 ${Math.round(w * 0.14)}px ${FONT}`;
    g.fillStyle = it.perfect ? '#92400e' : P.muted;
    g.fillText(it.sub, w / 2, by + bh + (h - lip - by - bh) * 0.42);
    if (it.perfect) {
      for (const [x, y, r] of [[w * 0.2, h * 0.11, 5], [w * 0.8, h * 0.11, 5], [w * 0.5, h * 0.88, 6]]) {
        StarPath(g, x, y, r, r * 0.42, 5); g.fillStyle = '#fffbeb'; g.fill(); g.lineWidth = 1; g.strokeStyle = '#b45309'; g.stroke();
      }
    } else {
      g.fillStyle = it.bg;
      Circ(g, w * 0.17, h * 0.11, 2.6); g.fill();
      Circ(g, w * 0.83, h * 0.11, 2.6); g.fill();
    }
  }

  function Disc(g, w, h, P, col) {
    const cx = w / 2, cy = (h - 4) * 0.5, R = w * 0.34;
    Circ(g, cx, cy + 2, R); g.fillStyle = P.dark ? 'rgba(0,0,0,0.35)' : Rgb(Dk(col, 0.3), 0.18); g.fill();
    const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
    gr.addColorStop(0, Tone(col, P.disc + (P.dark ? 0.08 : 0.12))); gr.addColorStop(1, Tone(col, P.disc));
    Circ(g, cx, cy, R); g.fillStyle = gr; g.fill();
    g.lineWidth = 2; g.strokeStyle = Rgb(col, P.dark ? 0.75 : 0.55); g.stroke();
    return [cx, cy, R];
  }

  function Fill(g, col, out) {
    g.fillStyle = col; g.fill();
    g.lineWidth = 1.6; g.strokeStyle = out; g.stroke();
  }

  function SubjectFace(g, w, h, P, it) {
    FrontBase(g, w, h, P, false);
    const [cx, cy, R] = Disc(g, w, h, P, it.col);
    const c = it.col, o = Dk(c, 0.55), u = R * 0.62, L = Lt(c, 0.55);
    g.save(); g.translate(cx, cy);
    switch (it.id) {
      case 'pi':
        g.font = `900 ${Math.round(R * 1.35)}px Georgia, "Times New Roman", serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 3; g.strokeStyle = o; g.strokeText('π', 0, -R * 0.04);
        g.fillStyle = c; g.fillText('π', 0, -R * 0.04);
        break;
      case 'book':
        Poly(g, [0, -u * 0.55, -u, -u * 0.75, -u, u * 0.65, 0, u * 0.85]); Fill(g, '#fffdf7', o);
        Poly(g, [0, -u * 0.55, u, -u * 0.75, u, u * 0.65, 0, u * 0.85]); Fill(g, '#fff7ed', o);
        g.strokeStyle = Rgb(c, 0.7); g.lineWidth = 1.3;
        g.beginPath();
        for (let i = 0; i < 3; i++) { const y = -u * 0.3 + i * u * 0.35; g.moveTo(-u * 0.8, y - u * 0.12); g.lineTo(-u * 0.18, y); g.moveTo(u * 0.18, y); g.lineTo(u * 0.8, y - u * 0.12); }
        g.stroke();
        RR(g, -u * 1.08, u * 0.62, u * 2.16, u * 0.3, 2); Fill(g, c, o);
        break;
      case 'talk':
        RR(g, -u, -u * 0.8, u * 1.5, u * 1.05, u * 0.3); Fill(g, c, o);
        Poly(g, [-u * 0.6, u * 0.2, -u * 0.75, u * 0.65, -u * 0.2, u * 0.25]); Fill(g, c, o);
        RR(g, -u * 0.15, -u * 0.25, u * 1.2, u * 0.95, u * 0.28); Fill(g, '#fffdf7', o);
        Poly(g, [u * 0.75, u * 0.65, u * 0.95, u * 1.0, u * 0.4, u * 0.7]); Fill(g, '#fffdf7', o);
        g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { Circ(g, -u * 0.65 + i * u * 0.32, -u * 0.28, u * 0.09); g.fill(); }
        g.fillStyle = c; for (let i = 0; i < 3; i++) { Circ(g, u * 0.15 + i * u * 0.3, u * 0.22, u * 0.08); g.fill(); }
        break;
      case 'hourglass':
        RR(g, -u * 0.8, -u, u * 1.6, u * 0.24, 2); Fill(g, '#92400e', o);
        RR(g, -u * 0.8, u * 0.76, u * 1.6, u * 0.24, 2); Fill(g, '#92400e', o);
        Poly(g, [-u * 0.6, -u * 0.76, u * 0.6, -u * 0.76, u * 0.1, 0, u * 0.6, u * 0.76, -u * 0.6, u * 0.76, -u * 0.1, 0]); Fill(g, '#e0f2fe', o);
        Poly(g, [-u * 0.35, -u * 0.45, u * 0.35, -u * 0.45, 0, -u * 0.05]); g.fillStyle = '#facc15'; g.fill();
        Poly(g, [-u * 0.5, u * 0.74, u * 0.5, u * 0.74, 0, u * 0.3]); g.fillStyle = '#facc15'; g.fill();
        break;
      case 'globe':
        Circ(g, 0, 0, u); Fill(g, '#38bdf8', o);
        g.save(); Circ(g, 0, 0, u); g.clip();
        g.fillStyle = '#22c55e';
        g.beginPath(); g.ellipse(-u * 0.35, -u * 0.25, u * 0.45, u * 0.3, 0.5, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(u * 0.4, u * 0.35, u * 0.35, u * 0.42, -0.4, 0, TAU); g.fill();
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.1;
        g.beginPath(); g.ellipse(0, 0, u * 0.45, u, 0, 0, TAU); g.moveTo(-u, 0); g.lineTo(u, 0); g.stroke();
        Circ(g, 0, 0, u); g.lineWidth = 1.6; g.strokeStyle = o; g.stroke();
        break;
      case 'leaf':
        g.beginPath(); g.moveTo(-u * 0.85, u * 0.85); g.bezierCurveTo(-u * 1.0, -u * 0.4, -u * 0.1, -u * 1.0, u * 0.95, -u * 0.95);
        g.bezierCurveTo(u * 0.9, u * 0.1, u * 0.3, u * 0.95, -u * 0.85, u * 0.85); Fill(g, c, o);
        g.beginPath(); g.moveTo(-u * 0.85, u * 0.85); g.quadraticCurveTo(0, 0, u * 0.7, -u * 0.7);
        g.strokeStyle = L; g.lineWidth = 1.6; g.stroke();
        break;
      case 'flask':
        Poly(g, [-u * 0.25, -u, u * 0.25, -u, u * 0.25, -u * 0.35, u * 0.85, u * 0.8, -u * 0.85, u * 0.8, -u * 0.25, -u * 0.35]); Fill(g, '#f5f3ff', o);
        Poly(g, [-u * 0.52, u * 0.2, u * 0.52, u * 0.2, u * 0.8, u * 0.75, -u * 0.8, u * 0.75]); g.fillStyle = c; g.fill();
        g.fillStyle = '#fff'; Circ(g, -u * 0.15, u * 0.42, u * 0.1); g.fill(); Circ(g, u * 0.2, u * 0.55, u * 0.07); g.fill();
        Poly(g, [-u * 0.25, -u, u * 0.25, -u, u * 0.25, -u * 0.35, u * 0.85, u * 0.8, -u * 0.85, u * 0.8, -u * 0.25, -u * 0.35]);
        g.lineWidth = 1.6; g.strokeStyle = o; g.stroke();
        RR(g, -u * 0.38, -u * 1.08, u * 0.76, u * 0.2, 2); Fill(g, '#cbd5e1', o);
        break;
      case 'atom':
        g.lineWidth = 2; g.strokeStyle = c;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, u, u * 0.36, i * Math.PI / 3, 0, TAU); g.stroke(); }
        Circ(g, 0, 0, u * 0.24); Fill(g, '#f43f5e', o);
        g.fillStyle = L; Circ(g, u * 0.95, 0, u * 0.1); g.fill(); Circ(g, -u * 0.48, -u * 0.8, u * 0.1); g.fill();
        break;
      case 'screen':
        RR(g, -u, -u * 0.8, u * 2, u * 1.3, u * 0.18); Fill(g, '#334155', o);
        RR(g, -u * 0.82, -u * 0.62, u * 1.64, u * 0.94, u * 0.08); g.fillStyle = '#0f172a'; g.fill();
        g.lineWidth = 1.8;
        g.strokeStyle = '#4ade80'; g.beginPath(); g.moveTo(-u * 0.6, -u * 0.35); g.lineTo(u * 0.1, -u * 0.35); g.stroke();
        g.strokeStyle = '#60a5fa'; g.beginPath(); g.moveTo(-u * 0.4, -u * 0.12); g.lineTo(u * 0.5, -u * 0.12); g.stroke();
        g.strokeStyle = '#f472b6'; g.beginPath(); g.moveTo(-u * 0.4, u * 0.1); g.lineTo(u * 0.25, u * 0.1); g.stroke();
        Poly(g, [-u * 0.25, u * 0.5, u * 0.25, u * 0.5, u * 0.38, u * 0.85, -u * 0.38, u * 0.85]); Fill(g, '#64748b', o);
        break;
      case 'note':
        g.lineWidth = 2.6; g.strokeStyle = o;
        Poly(g, [-u * 0.42, -u * 0.55, u * 0.78, -u * 0.85, u * 0.78, -u * 0.55, -u * 0.42, -u * 0.25]); Fill(g, c, o);
        RR(g, -u * 0.48, -u * 0.5, u * 0.16, u * 1.2, 1); Fill(g, c, o);
        RR(g, u * 0.66, -u * 0.8, u * 0.16, u * 1.2, 1); Fill(g, c, o);
        g.beginPath(); g.ellipse(-u * 0.62, u * 0.68, u * 0.3, u * 0.22, -0.4, 0, TAU); Fill(g, c, o);
        g.beginPath(); g.ellipse(u * 0.52, u * 0.38, u * 0.3, u * 0.22, -0.4, 0, TAU); Fill(g, c, o);
        break;
      case 'ball':
        Circ(g, 0, 0, u); Fill(g, '#ffffff', o);
        StarPath(g, 0, 0, u * 0.36, u * 0.36, 5); g.fillStyle = '#1f2937'; g.fill();
        g.strokeStyle = '#1f2937'; g.lineWidth = 1.3;
        g.beginPath();
        for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; g.moveTo(Math.cos(a) * u * 0.36, Math.sin(a) * u * 0.36); g.lineTo(Math.cos(a) * u, Math.sin(a) * u); }
        g.stroke();
        Circ(g, 0, 0, u); g.lineWidth = 1.6; g.strokeStyle = o; g.stroke();
        break;
      case 'palette':
        g.beginPath(); g.ellipse(0, 0, u, u * 0.8, -0.2, 0, TAU); Fill(g, '#fde68a', o);
        Circ(g, u * 0.35, u * 0.3, u * 0.18); g.fillStyle = Lt(c, 0.6); g.fill(); g.lineWidth = 1.3; g.strokeStyle = o; g.stroke();
        for (const [x, y, cc] of [[-u * 0.5, -u * 0.15, '#ef4444'], [-u * 0.15, -u * 0.45, '#3b82f6'], [u * 0.35, -u * 0.35, '#22c55e'], [-u * 0.45, u * 0.35, '#a855f7']]) { Circ(g, x, y, u * 0.16); Fill(g, cc, o); }
        break;
      case 'bulb':
        Circ(g, 0, -u * 0.2, u * 0.72); Fill(g, '#fef08a', o);
        RR(g, -u * 0.32, u * 0.45, u * 0.64, u * 0.5, u * 0.08); Fill(g, '#94a3b8', o);
        g.strokeStyle = '#b45309'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(-u * 0.2, u * 0.4); g.lineTo(-u * 0.2, -u * 0.1); g.lineTo(0, -u * 0.3); g.lineTo(u * 0.2, -u * 0.1); g.lineTo(u * 0.2, u * 0.4); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-u * 0.32, -u * 0.5, u * 0.16, u * 0.1, -0.7, 0, TAU); g.fill();
        break;
      case 'coin':
        Circ(g, u * 0.15, u * 0.15, u * 0.82); Fill(g, Dk('#f59e0b', 0.15), o);
        Circ(g, -u * 0.08, -u * 0.08, u * 0.82); Fill(g, '#fbbf24', o);
        Circ(g, -u * 0.08, -u * 0.08, u * 0.6); g.lineWidth = 1.3; g.strokeStyle = '#b45309'; g.stroke();
        g.font = `900 ${Math.round(u * 1.05)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#92400e'; g.fillText('€', -u * 0.08, -u * 0.04);
        break;
    }
    g.restore();
  }

  function ShapeFace(g, w, h, P, it) {
    FrontBase(g, w, h, P, false);
    const cx = w / 2, cy = (h - 4) * 0.5, u = w * 0.3, c = it.col, o = Dk(c, 0.5);
    g.save(); g.translate(cx, cy + 2);
    g.globalAlpha = 0.25; ShapePath(g, it.id, u); g.fillStyle = Dk(c, 0.6); g.fill(); g.globalAlpha = 1;
    g.translate(0, -2);
    ShapePath(g, it.id, u);
    const gr = g.createLinearGradient(0, -u, 0, u);
    gr.addColorStop(0, Lt(c, 0.3)); gr.addColorStop(1, Dk(c, 0.08));
    g.fillStyle = gr; g.fill('evenodd');
    g.lineWidth = 2; g.strokeStyle = o; g.stroke();
    g.save(); ShapePath(g, it.id, u); g.clip('evenodd');
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-u * 0.3, -u * 0.55, u * 0.55, u * 0.28, -0.4, 0, TAU); g.fill();
    g.restore();
    g.restore();
  }

  function ShapePath(g, id, u) {
    g.beginPath();
    switch (id) {
      case 'star': StarPath(g, 0, u * 0.05, u * 1.05, u * 0.45, 5); break;
      case 'heart':
        g.moveTo(0, u * 0.9);
        g.bezierCurveTo(-u * 1.3, 0, -u * 0.8, -u * 1.05, 0, -u * 0.45);
        g.bezierCurveTo(u * 0.8, -u * 1.05, u * 1.3, 0, 0, u * 0.9); g.closePath(); break;
      case 'diamond': Poly(g, [0, -u, u * 0.75, 0, 0, u, -u * 0.75, 0]); break;
      case 'hex': { const p = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(Math.cos(a) * u, Math.sin(a) * u); } Poly(g, p); break; }
      case 'penta': { const p = []; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; p.push(Math.cos(a) * u, Math.sin(a) * u + u * 0.08); } Poly(g, p); break; }
      case 'tri': Poly(g, [0, -u * 0.95, u, u * 0.75, -u, u * 0.75]); break;
      case 'circle': g.arc(0, 0, u * 0.9, 0, TAU); break;
      case 'square': g.roundRect(-u * 0.8, -u * 0.8, u * 1.6, u * 1.6, u * 0.25); break;
      case 'moon':
        g.arc(0, 0, u * 0.9, Math.PI * 0.35, Math.PI * 1.65, false);
        g.arc(u * 0.42, -u * 0.12, u * 0.72, Math.PI * 1.45, Math.PI * 0.62, true); g.closePath(); break;
      case 'bolt': Poly(g, [u * 0.2, -u, -u * 0.65, u * 0.12, -u * 0.05, u * 0.12, -u * 0.25, u, u * 0.65, -u * 0.15, u * 0.05, -u * 0.15]); break;
      case 'drop':
        g.moveTo(0, -u);
        g.bezierCurveTo(u * 0.25, -u * 0.5, u * 0.8, 0, u * 0.8, u * 0.3);
        g.arc(0, u * 0.3, u * 0.8, 0, Math.PI, false);
        g.bezierCurveTo(-u * 0.8, 0, -u * 0.25, -u * 0.5, 0, -u); g.closePath(); break;
      case 'plus': g.roundRect(-u * 0.32, -u * 0.95, u * 0.64, u * 1.9, u * 0.18); g.roundRect(-u * 0.95, -u * 0.32, u * 1.9, u * 0.64, u * 0.18); break;
      case 'ring': g.arc(0, 0, u * 0.92, 0, TAU); g.moveTo(u * 0.48, 0); g.arc(0, 0, u * 0.48, 0, TAU, true); break;
      case 'clover':
        for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]) { g.moveTo(Math.cos(a) * u * 0.48 + u * 0.42, Math.sin(a) * u * 0.48); g.arc(Math.cos(a) * u * 0.48, Math.sin(a) * u * 0.48, u * 0.42, 0, TAU); }
        break;
    }
  }

  function FaceArt(w, h, k, P, setId, it) {
    const s = Cv(w, h, k), g = s.g;
    if (setId === 'subjects') SubjectFace(g, w, h, P, it);
    else if (setId === 'shapes') ShapeFace(g, w, h, P, it);
    else GradeFace(g, w, h, P, it);
    return s;
  }

  function ShadowArt(w, h, k, P) {
    const e = 14, s = Cv(w + e * 2, h + e * 2, k), g = s.g;
    g.filter = `blur(${(5 * k).toFixed(1)}px)`;
    RR(g, e + 2, e + 4, w - 4, h - 4, Math.min(w, h) * 0.13); g.fillStyle = P.shadow; g.fill();
    s.e = e;
    return s;
  }

  function GlowArt(w, h, k) {
    const e = 10, s = Cv(w + e * 2, h + e * 2, k), g = s.g;
    g.filter = `blur(${(4 * k).toFixed(1)}px)`;
    RR(g, e - 2, e - 2, w + 4, h + 4, Math.min(w, h) * 0.16); g.lineWidth = 5; g.strokeStyle = 'rgba(250,204,21,0.9)'; g.stroke();
    s.e = e;
    return s;
  }

  function CheckArt(k) {
    const s = Cv(22, 22, k), g = s.g;
    Circ(g, 11, 11, 9.5); g.fillStyle = '#22c55e'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#14532d'; g.stroke();
    g.beginPath(); g.moveTo(6.5, 11.5); g.lineTo(9.6, 14.5); g.lineTo(15.5, 8); g.lineWidth = 2.4; g.strokeStyle = '#ffffff'; g.stroke();
    return s;
  }

  function SparkArt(k, col) {
    const s = Cv(24, 24, k), g = s.g;
    const gr = g.createRadialGradient(12, 12, 0, 12, 12, 12);
    gr.addColorStop(0, Rgb(col, 0.9)); gr.addColorStop(1, Rgb(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 24, 24);
    StarPath(g, 12, 12, 11, 2.2, 4); g.fillStyle = '#ffffff'; g.fill();
    return s;
  }

  function FeltArt(bw, bh, k, P) {
    const s = Cv(bw, bh, k), g = s.g;
    RR(g, 0, 0, bw, bh, 14);
    const gr = g.createRadialGradient(bw / 2, bh * 0.4, 10, bw / 2, bh / 2, Math.max(bw, bh) * 0.75);
    gr.addColorStop(0, P.felt); gr.addColorStop(1, P.felt2);
    g.fillStyle = gr; g.fill();
    g.save(); RR(g, 0, 0, bw, bh, 14); g.clip();
    g.fillStyle = P.dot;
    for (let y = 8; y < bh; y += 14) for (let x = (y / 14 & 1) ? 15 : 8; x < bw; x += 14) { Circ(g, x, y, 1.3); g.fill(); }
    g.restore();
    RR(g, 0.5, 0.5, bw - 1, bh - 1, 14); g.lineWidth = 1; g.strokeStyle = P.dark ? 'rgba(167,139,250,0.18)' : 'rgba(109,40,217,0.16)'; g.stroke();
    return s;
  }

  let G = null;
  let _diffId = 'easy';
  let _setId = LoadSet();
  let _timerInterval = null;
  let _timerStart    = null;
  let _timerElapsed  = 0;
  let _cv = null, _ctx = null, _view = null;
  let _dark = false, _k = 1, _S = null;
  let _raf = 0, _last = 0, _dirty = true, _animUntil = 0;
  let _hover = -1, _cursor = 0, _kbd = false, _press = -1;
  let _screen = 'none';
  let _scrT = 0;
  let _flipT = 0;

  const _P = Array.from({ length: PN }, () => ({ on: 0, kind: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, t: 0, life: 1, s: 1, rot: 0, vr: 0, col: '#fff', spr: 0 }));
  let _pi = 0, _alive = 0;
  function Emit(kind, x, y, vx, vy, life, s, col, g, spr) {
    const p = _P[_pi]; _pi = (_pi + 1) % PN;
    p.on = 1; p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.t = 0; p.s = s; p.col = col; p.g = g; p.spr = spr || 0;
    p.rot = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 10;
  }

  function GetDifficulty() { return DIFFICULTIES.find(d => d.id === _diffId) || DIFFICULTIES[0]; }
  function GetSet() { return SETS.find(s => s.id === _setId) || SETS[0]; }
  function BoardW() { const d = G.diff; return MARGIN * 2 + d.cols * CARD_W[d.id] + (d.cols - 1) * CARD_GAP; }
  function BoardH() { const d = G.diff; return MARGIN * 2 + d.rows * CARD_H[d.id] + (d.rows - 1) * CARD_GAP; }
  function Bump(t) { if (t > _animUntil) _animUntil = t; _dirty = true; }

  function Shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function NewGame() {
    StopTimer();
    clearTimeout(_scrT); clearTimeout(_flipT);
    _timerElapsed = 0;

    const d = GetDifficulty(), set = GetSet();
    const picked = Shuffle([...set.items]).slice(0, d.pairs);
    const deck = [];
    picked.forEach((g, pi) => {
      deck.push({ uid: `${pi}a`, gradeId: g.id, grade: g, state: 'hidden', matchId: pi });
      deck.push({ uid: `${pi}b`, gradeId: g.id, grade: g, state: 'hidden', matchId: pi });
    });
    Shuffle(deck);
    const cw = CARD_W[d.id], ch = CARD_H[d.id], now = performance.now();
    deck.forEach((c, i) => {
      c.x = MARGIN + (i % d.cols) * (cw + CARD_GAP) + cw / 2;
      c.y = MARGIN + Math.floor(i / d.cols) * (ch + CARD_GAP) + ch / 2;
      c.ft = 0; c.pop = 0; c.shake = 0; c.wave = 0; c.deal = now + 120 + i * 38;
      c.face = picked.indexOf(c.grade);
    });

    const sizeChanged = !G || G.diff !== d || G.setId !== set.id;
    G = {
      diff: d, deck, setId: set.id, faces: picked,
      open: [],
      locked: false,
      moves: 0,
      misses: 0,
      matched: 0,
      elapsed: 0,
      status: 'playing',
      startedTimer: false,
      dealEnd: now + 120 + deck.length * 38 + DEAL_MS,
      streak: 0,
    };
    for (const p of _P) p.on = 0;
    _hover = -1; _press = -1;
    if (_cursor >= deck.length) _cursor = 0;
    HideScreen();
    if (sizeChanged || !_S) Fit(); else BuildFaces();
    Bump(G.dealEnd);
    UpdateHUD();
  }

  function FlipCard(uid) {
    if (!G || G.locked || G.status !== 'playing' || _screen !== 'none') return;
    const now = performance.now();
    if (now < G.dealEnd) return;
    const card = G.deck.find(c => c.uid === uid);
    if (!card || card.state !== 'hidden') return;
    if (G.open.includes(uid)) return;

    if (!G.startedTimer) { G.startedTimer = true; StartTimer(); }

    card.state = 'revealed';
    card.ft = now;
    G.open.push(uid);
    Bump(now + FLIP_MS);

    if (G.open.length < 2) return;

    G.moves++;
    const [uidA, uidB] = G.open;
    const cardA = G.deck.find(c => c.uid === uidA);
    const cardB = G.deck.find(c => c.uid === uidB);

    if (cardA.matchId === cardB.matchId) {
      cardA.state = 'matched';
      cardB.state = 'matched';
      G.matched++;
      G.streak++;
      G.open = [];
      const t = now + FLIP_MS * 0.85;
      cardA.pop = t; cardB.pop = t + 60;
      _flipT = setTimeout(() => { Sparkle(cardA); Sparkle(cardB); }, FLIP_MS * 0.85);
      Bump(t + 700);
      UpdateHUD();

      if (G.matched === G.diff.pairs) {
        StopTimer();
        G.status = 'won';
        const w0 = t + 500;
        G.deck.forEach((c, i) => { c.wave = w0 + ((i % G.diff.cols) + Math.floor(i / G.diff.cols)) * 70; });
        Bump(w0 + 1400);
        _scrT = setTimeout(() => { Confetti(); _scrT = setTimeout(ShowWin, 900); }, w0 - now + 300);
      }
    } else {
      G.misses++;
      G.streak = 0;
      G.locked = true;
      cardA.shake = cardB.shake = now + FLIP_MS;
      Bump(now + FLIP_MS + 400);
      UpdateHUD();
      _flipT = setTimeout(() => {
        const t = performance.now();
        cardA.state = 'hidden';
        cardB.state = 'hidden';
        cardA.ft = cardB.ft = t;
        G.open = [];
        G.locked = false;
        Bump(t + FLIP_MS);
      }, FLIP_DELAY_MS);
    }
  }

  function Sparkle(c) {
    const cw = CARD_W[G.diff.id], ch = CARD_H[G.diff.id];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * TAU, v = 40 + Math.random() * 90;
      Emit(0, c.x + Math.cos(a) * cw * 0.3, c.y + Math.sin(a) * ch * 0.3, Math.cos(a) * v, Math.sin(a) * v - 30, 0.55 + Math.random() * 0.4, 0.5 + Math.random() * 0.7, '#fff', 60, i % 3 === 0 ? 1 : 0);
    }
    Bump(performance.now() + 900);
  }

  function Confetti() {
    const bw = BoardW(), cols = ['#a78bfa', '#f472b6', '#facc15', '#4ade80', '#60a5fa', '#fb923c'];
    for (let i = 0; i < 90; i++) {
      Emit(1, Math.random() * bw, -10 - Math.random() * 40, (Math.random() - 0.5) * 80, 50 + Math.random() * 110, 2 + Math.random() * 1.4, 5 + Math.random() * 3, cols[i % cols.length], 110);
    }
    Bump(performance.now() + 500);
  }

  function StartTimer() {
    _timerStart = Date.now();
    _timerInterval = setInterval(() => {
      G.elapsed = Math.floor((_timerElapsed + Date.now() - _timerStart) / 1000);
      SetText('gf-mem-timer', FormatTime(G.elapsed));
    }, 500);
  }
  function StopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    if (_timerStart)    { _timerElapsed += Date.now() - _timerStart; _timerStart = null; }
  }
  function ResumeTimer() {
    if (G?.status === 'playing' && G.startedTimer && !_timerInterval && _screen === 'none') StartTimer();
  }
  function FormatTime(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  function TogglePause() {
    if (!G || G.status !== 'playing') return;
    if (_screen === 'paused') { HideScreen(); ResumeTimer(); _dirty = true; }
    else if (_screen === 'none') { StopTimer(); ShowScreen('paused'); }
  }

  function BuildFaces() {
    const d = G.diff, cw = CARD_W[d.id], ch = CARD_H[d.id], P = _dark ? PAL.dark : PAL.light;
    _S.faces = G.faces.map(it => FaceArt(cw, ch, _k, P, G.setId, it));
    _dirty = true;
  }

  function BuildSprites() {
    const d = G.diff, cw = CARD_W[d.id], ch = CARD_H[d.id], P = _dark ? PAL.dark : PAL.light;
    _S = {
      cw, ch, P,
      felt: FeltArt(BoardW(), BoardH(), _k, P),
      back: BackArt(cw, ch, _k, P),
      sh: ShadowArt(cw, ch, _k, P),
      glow: GlowArt(cw, ch, _k),
      check: CheckArt(_k),
      spark: [SparkArt(_k, '#a78bfa'), SparkArt(_k, '#facc15')],
      faces: [],
    };
    BuildFaces();
  }

  function Fit() {
    if (!G || !_cv) return;
    const bw = BoardW(), bh = BoardH();
    const s = Math.max(0.45, Math.min(1.2, (innerWidth - 60) / bw, (innerHeight - 230) / bh));
    const dpr = Math.min(3, W.devicePixelRatio || 1);
    const cw = Math.round(bw * s), ch = Math.round(bh * s);
    _cv.style.width = `${cw}px`; _cv.style.height = `${ch}px`;
    _cv.width = Math.round(cw * dpr); _cv.height = Math.round(ch * dpr);
    _k = _cv.width / bw;
    _ctx = _cv.getContext('2d');
    BuildSprites();
    _dirty = true;
  }

  function Img(s, x, y) { _ctx.drawImage(s.c, x, y, s.c.width / _k, s.c.height / _k); }
  function ImgC(s, cx, cy, sx, sy) {
    const w = s.c.width / _k * sx, h = s.c.height / _k * sy;
    _ctx.drawImage(s.c, cx - w / 2, cy - h / 2, w, h);
  }

  function DrawCard(spr, cx, cy, a, sc) {
    const ctx = _ctx, w = spr.c.width / _k * sc, h = spr.c.height / _k * sc;
    const co = Math.cos(a);
    if (co > 0.995) { ctx.drawImage(spr.c, cx - w / 2, cy - h / 2, w, h); return; }
    const si = Math.sin(a), N = 16, D = w * 2.4, sw = spr.c.width / N;
    let px = cx + (-1 * co * w / 2) * (D / (D + si * w / 2));
    for (let i = 0; i < N; i++) {
      const u1 = -1 + 2 * (i + 1) / N, um = -1 + 2 * (i + 0.5) / N;
      const z1 = -u1 * si * w / 2, x1 = cx + u1 * co * w / 2 * (D / (D + z1));
      const pm = D / (D - um * si * w / 2), hh = h * pm;
      ctx.drawImage(spr.c, i * sw, 0, sw, spr.c.height, px, cy - hh / 2, Math.max(0.6, x1 - px + 0.6), hh);
      px = x1;
    }
  }

  function CardTheta(c, now) {
    const front = c.state !== 'hidden';
    if (!c.ft) return front ? Math.PI : 0;
    const p = Math.min(1, (now - c.ft) / FLIP_MS);
    const e = EaseInOut(p);
    return front ? e * Math.PI : (1 - e) * Math.PI;
  }

  function Draw(now, dt) {
    const ctx = _ctx, sp = _S, k = _k, deck = G.deck, d = G.diff;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, _cv.width, _cv.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    Img(sp.felt, 0, 0);
    const live = G.status === 'playing' && _screen === 'none' && now >= G.dealEnd;
    let anim = false;
    const bw = BoardW(), bh = BoardH();
    for (let i = 0; i < deck.length; i++) {
      const c = deck[i];
      let x = c.x, y = c.y, rot = 0, sc = 1, lift = 0;
      if (now < c.deal) continue;
      const dp = Math.min(1, (now - c.deal) / DEAL_MS);
      if (dp < 1) {
        anim = true;
        const e = EaseOut(dp);
        x = bw / 2 + (c.x - bw / 2) * e;
        y = bh + sp.ch * 0.6 + (c.y - bh - sp.ch * 0.6) * e;
        rot = (1 - e) * (i % 2 ? 0.5 : -0.5);
        lift = Math.sin(dp * Math.PI) * 10;
      }
      const theta = CardTheta(c, now);
      const flipping = theta > 0.001 && theta < Math.PI - 0.001;
      if (flipping) { anim = true; lift += Math.sin(theta) * 9; sc *= 1 + Math.sin(theta) * 0.06; }
      if (live && (i === _hover || (_kbd && i === _cursor)) && c.state === 'hidden' && !G.locked) { lift += i === _press ? 0 : 4; sc *= i === _press ? 0.96 : 1.03; }
      if (c.pop && now >= c.pop && now - c.pop < 420) {
        anim = true;
        const t = (now - c.pop) / 420;
        sc *= 1 + Math.sin(t * Math.PI) * 0.12;
        lift += Math.sin(t * Math.PI) * 6;
      }
      if (c.wave && now >= c.wave && now - c.wave < 520) {
        anim = true;
        const t = (now - c.wave) / 520;
        lift += Math.sin(t * Math.PI) * 14;
        rot += Math.sin(t * TAU) * 0.06;
      }
      if (c.shake && now >= c.shake && now - c.shake < 380) {
        anim = true;
        const t = (now - c.shake) / 380;
        x += Math.sin(t * Math.PI * 6) * 4 * (1 - t);
      }
      const shw = Math.max(0.15, Math.abs(Math.cos(theta)));
      ctx.globalAlpha = 1 - Math.min(0.5, lift / 40);
      ImgC(sp.sh, x + lift * 0.3, y + lift * 0.6, shw * (1 + lift / 120), 1 + lift / 160);
      ctx.globalAlpha = 1;
      y -= lift;
      if (rot) { const rc = Math.cos(rot) * k, rs = Math.sin(rot) * k; ctx.setTransform(rc, rs, -rs, rc, x * k, y * k); x = 0; y = 0; }
      const showFront = theta > Math.PI / 2;
      if (c.state === 'matched' && !flipping) {
        const ga = c.pop && now - c.pop < 420 ? 1 : 0.55 + 0.15 * Math.sin(now / 400 + i);
        ctx.globalAlpha = ga; ImgC(sp.glow, x, y, sc, sc); ctx.globalAlpha = 1;
        anim = true;
      }
      DrawCard(showFront ? sp.faces[c.face] : sp.back, x, y, showFront ? theta - Math.PI : theta, sc);
      if (c.state === 'matched' && !flipping) {
        const t = c.pop ? Math.min(1, Math.max(0, (now - c.pop - 120) / 300)) : 1;
        if (t > 0) ImgC(sp.check, x + sp.cw * sc / 2 - 7, y - sp.ch * sc / 2 + 7, EaseBack(t) * 0.9, EaseBack(t) * 0.9);
      }
      if (c.shake && now >= c.shake && now - c.shake < 380) {
        ctx.globalAlpha = 0.28 * (1 - (now - c.shake) / 380);
        RR(ctx, x - sp.cw * sc / 2 + 1, y - sp.ch * sc / 2 + 1, sp.cw * sc - 2, sp.ch * sc - 2, sp.cw * 0.13);
        ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.globalAlpha = 1;
      }
      if (rot) ctx.setTransform(k, 0, 0, k, 0, 0);
      if (live && _kbd && i === _cursor) {
        RR(ctx, c.x - sp.cw / 2 - 4, c.y - sp.ch / 2 - 4 - lift, sp.cw + 8, sp.ch + 8, sp.cw * 0.16);
        ctx.lineWidth = 2.5; ctx.strokeStyle = _dark ? '#fde047' : '#f59e0b'; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 160); ctx.stroke(); ctx.globalAlpha = 1;
        anim = true;
      }
    }
    DrawFx(dt / 1000);
    return anim;
  }

  function DrawFx(dt) {
    const ctx = _ctx, k = _k;
    let alive = 0;
    ctx.globalCompositeOperation = 'source-over';
    for (const p of _P) {
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = 0; continue; }
      alive++;
      p.vy += p.g * dt;
      if (p.kind === 1) { p.vx *= 0.985; p.x += Math.sin(p.t * 5 + p.rot) * 0.7; }
      else { p.vx *= 0.96; p.vy *= 0.96; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const u = p.t / p.life, a = u > 0.6 ? (1 - u) / 0.4 : 1;
      if (p.kind === 0) {
        ctx.globalAlpha = a;
        const s = p.s * (u < 0.2 ? u / 0.2 : 1);
        ImgC(_S.spark[p.spr], p.x, p.y, s, s);
      } else {
        const co = Math.cos(p.rot), si = Math.sin(p.rot), w = p.s, h = p.s * 0.55 * Math.abs(Math.sin(p.t * 7 + p.rot));
        ctx.globalAlpha = a;
        ctx.setTransform(co * k, si * k, -si * k, co * k, p.x * k, p.y * k);
        ctx.fillStyle = p.col; ctx.fillRect(-w / 2, -h / 2 - 0.5, w, h + 1);
        ctx.setTransform(k, 0, 0, k, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
    _alive = alive;
  }

  function Loop(now) {
    _raf = requestAnimationFrame(Loop);
    const dt = Math.min(50, now - (_last || now)); _last = now;
    if (!G || !_S || !_ctx) return;
    const glow = G.matched > 0 && _screen === 'none';
    if (!_dirty && now > _animUntil && !_alive && !(_kbd && _screen === 'none') && !glow) return;
    _dirty = false;
    if (Draw(now, dt)) _dirty = true;
  }
  function StartLoop() { if (!_raf) { _last = 0; _raf = requestAnimationFrame(Loop); } }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = 0; } }

  function CardAt(e) {
    if (!G || !_cv) return -1;
    const r = _cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * BoardW(), y = (e.clientY - r.top) / r.height * BoardH();
    const cw = CARD_W[G.diff.id], ch = CARD_H[G.diff.id];
    for (let i = 0; i < G.deck.length; i++) {
      const c = G.deck[i];
      if (Math.abs(x - c.x) <= cw / 2 && Math.abs(y - c.y) <= ch / 2) return i;
    }
    return -1;
  }

  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
  function Ic(src, cls) { return `<i class="gf-mem-i ${cls}" style="background-image:url(${src})"></i>`; }

  function UpdateHUD() {
    if (!G) return;
    const total = G.diff.pairs;
    SetText('gf-mem-pairs',  `${G.matched}/${total}`);
    SetText('gf-mem-moves',  String(G.moves));
    SetText('gf-mem-misses', String(G.misses));
    SetText('gf-mem-timer',  FormatTime(G.elapsed));
    const bar = document.getElementById('gf-mem-prog');
    if (bar) bar.style.width = `${(G.matched / total * 100).toFixed(1)}%`;
    document.querySelectorAll('.gf-mem-diff-btn').forEach(btn =>
      btn.classList.toggle('gf-mem-diff-active', btn.dataset.diff === _diffId));
    document.querySelectorAll('.gf-mem-set-btn').forEach(btn =>
      btn.classList.toggle('gf-mem-diff-active', btn.dataset.set === _setId));
    const pb = document.getElementById('gf-mem-pause');
    if (pb) pb.disabled = !(G.status === 'playing' && G.startedTimer);
    const mv = document.getElementById('gf-mem-moves');
    if (mv && G.moves) { mv.classList.remove('gf-mem-bump'); void mv.offsetWidth; mv.classList.add('gf-mem-bump'); }
  }

  function HideScreen() {
    _screen = 'none';
    const el = document.getElementById('gf-mem-ovr'); if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    document.getElementById('gf-mem-body')?.classList.remove('gf-mem-blur');
  }

  function SetPreview(setId) {
    const P = _dark ? PAL.dark : PAL.light, set = SETS.find(s => s.id === setId);
    const picks = setId === 'grades' ? [ALL_GRADES[14], ALL_GRADES[9]] : [set.items[4], set.items[0]];
    return picks.map(it => FaceArt(46, 60, 2, P, setId, it).c.toDataURL());
  }

  function ShowScreen(kind) {
    const el = document.getElementById('gf-mem-ovr'); if (!el) return;
    _screen = kind;
    let html = '';
    if (kind === 'start') {
      const back = BackArt(46, 60, 2, _dark ? PAL.dark : PAL.light).c.toDataURL();
      const sets = SETS.map(s => {
        const [a, b] = SetPreview(s.id);
        return `<button class="gf-mem-pick${s.id === _setId ? ' gf-mem-pick-on' : ''}" data-pick-set="${s.id}">
          <span class="gf-mem-fan">${Ic(back, 'gf-mem-fan0')}${Ic(b, 'gf-mem-fan1')}${Ic(a, 'gf-mem-fan2')}</span>
          <b>${s.label()}</b></button>`;
      }).join('');
      const bests = LoadBests();
      const lvls = DIFFICULTIES.map(d => `<button class="gf-mem-lv${d.id === _diffId ? ' gf-mem-lv-on' : ''}" data-pick-diff="${d.id}">
          <b>${d.label()}</b><span>${d.pairs} ${_GameText('game_mem_pairs').toLowerCase()}</span>
          <em>${bests[d.id] ? `${bests[d.id].moves} ${_GameText('game_moves').toLowerCase()}` : '&ndash;'}</em></button>`).join('');
      html = `
        <div class="gf-mem-card gf-mem-card-wide">
          <div class="gf-mem-scr-title">GradeMemory</div>
          <div class="gf-mem-scr-sub">${_GameText('game_mem_subtitle')}</div>
          <div class="gf-mem-sec">${_GameText('game_mem_set')}</div>
          <div class="gf-mem-picks">${sets}</div>
          <div class="gf-mem-sec">${_GameText('game_levels')}</div>
          <div class="gf-mem-lvs">${lvls}</div>
          <button class="gf-mem-btn" data-act="start">${_GameText('game_start')}</button>
        </div>`;
    } else if (kind === 'paused') {
      html = `
        <div class="gf-mem-card">
          <div class="gf-mem-scr-title">${_GameText('game_paused')}</div>
          <div class="gf-mem-ovr-stats">
            <div class="gf-mem-ovr-stat"><span>${_GameText('game_mem_pairs')}</span><strong>${G.matched}/${G.diff.pairs}</strong></div>
            <div class="gf-mem-ovr-stat"><span>${_GameText('game_moves')}</span><strong>${G.moves}</strong></div>
            <div class="gf-mem-ovr-stat"><span>${_GameText('game_time')}</span><strong>${FormatTime(Math.round(_timerElapsed / 1000))}</strong></div>
          </div>
          <div class="gf-mem-btns">
            <button class="gf-mem-btn" data-act="resume">${_GameText('game_resume')}</button>
            <button class="gf-mem-btn gf-mem-btn2" data-act="new">${_GameText('game_new_game')}</button>
          </div>
        </div>`;
    }
    el.innerHTML = html;
    el.dataset.kind = kind;
    el.style.display = 'flex';
    document.getElementById('gf-mem-body')?.classList.toggle('gf-mem-blur', kind === 'paused');
    UpdateHUD();
  }

  function ShowWin() {
    const el = document.getElementById('gf-mem-ovr'); if (!el) return;
    _screen = 'win';
    const secs  = Math.round(_timerElapsed / 1000);
    const best  = GetBestScore(_diffId);
    const isNew = !best || G.moves < best.moves || (G.moves === best.moves && secs < best.secs);
    if (isNew) SaveBestScore(_diffId, G.moves, secs);

    const accuracy = G.moves > 0 ? Math.round(G.diff.pairs / G.moves * 100) : 100;
    const stars = G.moves <= Math.ceil(G.diff.pairs * 1.5) ? 3 : G.moves <= G.diff.pairs * 2.2 ? 2 : 1;
    const starRow = [0, 1, 2].map(i => `<i class="gf-mem-star${i < stars ? ' on' : ''}" style="animation-delay:${0.15 + i * 0.15}s"></i>`).join('');
    el.innerHTML = `
      <div class="gf-mem-card">
        <div class="gf-mem-stars">${starRow}</div>
        <div class="gf-mem-ovr-title">${_GameText('game_mem_cleared')}</div>
        <div class="gf-mem-ovr-stats">
          <div class="gf-mem-ovr-stat"><span>${_GameText('game_time')}</span><strong>${FormatTime(secs)}</strong></div>
          <div class="gf-mem-ovr-stat"><span>${_GameText('game_moves')}</span><strong>${G.moves}</strong></div>
          <div class="gf-mem-ovr-stat"><span>${_GameText('game_mem_accuracy')}</span><strong>${accuracy}%</strong></div>
        </div>
        ${isNew ? `<div class="gf-mem-ovr-best">${_GameText('game_mem_personal_best')}</div>` : (best ? `<div class="gf-mem-ovr-sub">${_GameText('game_best')}: ${FormatTime(best.secs)} · ${best.moves} ${_GameText('game_moves').toLowerCase()}</div>` : '')}
        <div class="gf-mem-btns">
          <button class="gf-mem-btn" id="gf-mem-again">${_GameText('game_play_again')}</button>
          <button class="gf-mem-btn gf-mem-btn2" data-act="menu">${_GameText('game_levels')}</button>
        </div>
      </div>`;
    el.dataset.kind = 'win';
    el.style.display = 'flex';
    document.getElementById('gf-mem-again')?.addEventListener('click', NewGame);
  }

  function OnOverlayClick(e) {
    const s = e.target.closest('[data-pick-set]');
    if (s) {
      _setId = s.dataset.pickSet; SaveSet(_setId);
      document.querySelectorAll('.gf-mem-pick').forEach(b => b.classList.toggle('gf-mem-pick-on', b === s));
      return;
    }
    const d = e.target.closest('[data-pick-diff]');
    if (d) {
      _diffId = d.dataset.pickDiff;
      document.querySelectorAll('.gf-mem-lv').forEach(b => b.classList.toggle('gf-mem-lv-on', b === d));
      return;
    }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'start' || act === 'new') NewGame();
    else if (act === 'resume') TogglePause();
    else if (act === 'menu') ShowScreen('start');
  }

  function OnPointerMove(e) {
    const i = CardAt(e);
    if (i !== _hover) { _hover = i; _dirty = true; }
    if (_kbd) { _kbd = false; _dirty = true; }
    _cv.style.cursor = i >= 0 && G.deck[i].state === 'hidden' ? 'pointer' : 'default';
  }
  function OnPointerDown(e) { if (e.button) return; _press = CardAt(e); _dirty = true; }
  function OnPointerUp(e) {
    if (e.button) return;
    const i = CardAt(e), p = _press;
    _press = -1; _dirty = true;
    if (i >= 0 && i === p) { _cursor = i; FlipCard(G.deck[i].uid); }
  }

  let _kh = null;
  function OnKey(e) {
    const el = document.getElementById('gf-memory');
    if (!el || el.style.display === 'none') return;
    const k = e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) {
      e.preventDefault(); e.stopPropagation();
      if (!G || _screen !== 'none') return;
      const d = G.diff, n = G.deck.length;
      if (_kbd) {
        if (k === 'ArrowLeft') _cursor = (_cursor + n - 1) % n;
        if (k === 'ArrowRight') _cursor = (_cursor + 1) % n;
        if (k === 'ArrowUp') _cursor = (_cursor + n - d.cols) % n;
        if (k === 'ArrowDown') _cursor = (_cursor + d.cols) % n;
      }
      _kbd = true; _dirty = true;
      return;
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGradeMemory(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); NewGame(); return; }
    if (k === 'p' || k === 'P') { e.preventDefault(); TogglePause(); return; }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (_screen === 'paused') { TogglePause(); return; }
      if (_screen === 'start' || _screen === 'win') { NewGame(); return; }
      if (G && _cursor >= 0 && _cursor < G.deck.length) { _kbd = true; FlipCard(G.deck[_cursor].uid); }
    }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  function OnVisibility() { if (document.hidden && G?.status === 'playing' && G.startedTimer && _screen === 'none') TogglePause(); }
  function OnResize() { if (G) Fit(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-memory'); if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter  = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    if (_cv && _view) {
      let n = 0;
      for (let e = _cv; e; e = e.parentElement) if (e !== _view && getComputedStyle(e).filter.includes('invert')) n++;
      _view.style.filter = n % 2 ? 'invert(1) hue-rotate(180deg)' : '';
    }
    const d = el.dataset.theme === 'dark';
    if (d !== _dark) {
      _dark = d;
      if (G && _cv) BuildSprites();
      if (_screen === 'start') ShowScreen('start');
    }
  }
  const _tobs = new MutationObserver(ApplyTheme);

  function BuildOverlay() {
    if (document.getElementById('gf-memory')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-memory';

    const diffBtns = DIFFICULTIES.map(d =>
      `<button class="gf-mem-diff-btn${d.id === _diffId ? ' gf-mem-diff-active' : ''}" data-diff="${d.id}">${d.label()}</button>`
    ).join('');
    const setBtns = SETS.map(s =>
      `<button class="gf-mem-diff-btn gf-mem-set-btn${s.id === _setId ? ' gf-mem-diff-active' : ''}" data-set="${s.id}">${s.label()}</button>`
    ).join('');

    root.innerHTML = `
<div id="gf-mem-modal">
  <div id="gf-mem-hdr">
    <div class="gf-mem-hl">
      <div id="gf-mem-logo"><span></span><span></span></div>
      <div>
        <div id="gf-mem-title">GradeMemory</div>
        <div id="gf-mem-sub">${_GameText('game_mem_subtitle')}</div>
      </div>
    </div>
    <div class="gf-mem-hr">
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_mem_pairs')}</div><div id="gf-mem-pairs">0/0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_moves').toUpperCase()}</div><div id="gf-mem-moves">0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_mem_misses')}</div><div id="gf-mem-misses">0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_time').toUpperCase()}</div><div id="gf-mem-timer">0:00</div></div>
      <button id="gf-mem-pause" class="gf-mem-ib" title="${_GameText('game_pause_p')}"><svg viewBox="0 0 12 12" width="11" height="11"><rect x="2" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1" fill="currentColor"/></svg></button>
      <button id="gf-mem-new" class="gf-mem-ib" title="${_GameText('game_new_game_r')}">&#8634;</button>
      <button id="gf-mem-close" class="gf-mem-ib" title="${_GameText('game_close_esc')}">&#10005;</button>
    </div>
  </div>
  <div id="gf-mem-progress-track"><div id="gf-mem-prog"></div></div>
  <div id="gf-mem-wrap">
    <div id="gf-mem-body">
      <div id="gf-mem-diff"><div class="gf-mem-seg">${diffBtns}</div><div class="gf-mem-seg">${setBtns}</div></div>
      <div id="gf-mem-board-wrap"><div id="gf-mem-view"><canvas id="gf-mem-cv"></canvas></div></div>
    </div>
    <div id="gf-mem-ovr" style="display:none"></div>
  </div>
  <div id="gf-mem-hint">${_GameText('game_mem_hint2')}</div>
</div>`;

    document.body.appendChild(root);
    _cv = document.getElementById('gf-mem-cv');
    _cv.style.setProperty('filter', 'none', 'important');
    _view = document.getElementById('gf-mem-view');
    _ctx = _cv.getContext('2d');

    _cv.addEventListener('pointermove', OnPointerMove);
    _cv.addEventListener('pointerleave', () => { _hover = -1; _press = -1; _dirty = true; });
    _cv.addEventListener('pointerdown', OnPointerDown);
    _cv.addEventListener('pointerup', OnPointerUp);

    document.getElementById('gf-mem-diff').addEventListener('click', e => {
      const btn = e.target.closest('[data-diff]');
      if (btn) { _diffId = btn.dataset.diff; NewGame(); return; }
      const sb = e.target.closest('[data-set]');
      if (sb) { _setId = sb.dataset.set; SaveSet(_setId); NewGame(); }
    });
    document.getElementById('gf-mem-ovr').addEventListener('click', OnOverlayClick);

    document.getElementById('gf-mem-pause')?.addEventListener('click', TogglePause);
    document.getElementById('gf-mem-new')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-mem-close')?.addEventListener('click', CloseGradeMemory);
    document.getElementById('gf-memory')?.addEventListener('click', e => { if (e.target.id === 'gf-memory') BossKeyMemory(); });
  }

  function OpenGradeMemory() {
    if (!document.getElementById('gf-memory')) BuildOverlay();
    const el = document.getElementById('gf-memory');
    el.style.display = 'flex';
    delete el.dataset.bossHidden;
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    W.addEventListener('resize', OnResize);
    document.addEventListener('visibilitychange', OnVisibility);
    StartLoop();
    if (!G) { NewGame(); ShowScreen('start'); return; }
    Fit();
    if (G.locked) {
      clearTimeout(_flipT);
      G.open.forEach(uid => {
        const card = G.deck.find(c => c.uid === uid);
        if (card && card.state === 'revealed') { card.state = 'hidden'; card.ft = 0; }
      });
      G.open = [];
      G.locked = false;
    }
    if (G.status === 'playing' && G.startedTimer && _screen === 'none') ShowScreen('paused');
  }

  function CloseGradeMemory() {
    const el = document.getElementById('gf-memory');
    if (el) el.style.display = 'none';
    StopTimer();
    StopLoop();
    DetachKeys();
    _tobs.disconnect();
    W.removeEventListener('resize', OnResize);
    document.removeEventListener('visibilitychange', OnVisibility);
  }

  function BossKeyMemory() {
    const el = document.getElementById('gf-memory'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      ResumeTimer();
      StartLoop();
      _dirty = true;
      return true;
    }
    if (el.style.display !== 'none') {
      StopTimer();
      StopLoop();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeMemory  = OpenGradeMemory;
  W.CloseGradeMemory = CloseGradeMemory;
  W.BossKeyMemory    = BossKeyMemory;

  function InjectCSS() {
    if (document.getElementById('gf-mem-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-mem-css';
    s.textContent = `
#gf-memory {
  --gm-modal:#ffffff;--gm-hdr:#f8f6fd;--gm-brd:rgba(167,139,250,.28);--gm-brd2:#e6e1f2;
  --gm-txt:#1e1b2e;--gm-txt2:#5b5670;--gm-txt3:#9d97b0;--gm-sbox:rgba(109,40,217,.06);
  --gm-sh:0 10px 44px rgba(46,16,101,.16),0 1px 4px rgba(46,16,101,.08);
  --gm-ovr:rgba(246,243,253,.82);--gm-btn-brd:#d9d3e8;--gm-body:#f6f3fd;--gm-card:#ffffff;
}
#gf-memory[data-theme="dark"] {
  --gm-modal:rgba(14,12,24,.97);--gm-hdr:rgba(9,8,16,.96);--gm-brd:rgba(167,139,250,.2);
  --gm-brd2:#262138;--gm-txt:#f3f0fb;--gm-txt2:#bdb6d2;--gm-txt3:#756d8f;
  --gm-sbox:rgba(167,139,250,.08);--gm-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --gm-ovr:rgba(10,8,20,.82);--gm-btn-brd:#332c48;--gm-body:#0c0a16;--gm-card:#171427;
}
#gf-memory{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-memory *{box-sizing:border-box;}
#gf-memory .gf-mem-i{display:inline-block;background:center/contain no-repeat;flex-shrink:0;}
#gf-mem-modal{display:flex;flex-direction:column;min-width:min(500px,calc(100vw - 24px));background:var(--gm-modal);border:1px solid var(--gm-brd);border-radius:14px;box-shadow:var(--gm-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
#gf-mem-hdr{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--gm-hdr);border-bottom:1px solid var(--gm-brd);flex-shrink:0;gap:10px;user-select:none;}
.gf-mem-hl{display:flex;align-items:center;gap:9px;min-width:0;} .gf-mem-hr{display:flex;align-items:center;gap:5px;}
#gf-mem-logo{position:relative;width:30px;height:30px;flex-shrink:0;}
#gf-mem-logo span{position:absolute;width:17px;height:23px;top:3px;border-radius:4px;border:1.5px solid #2e1065;background:linear-gradient(150deg,#c4b5fd,#7c3aed);box-shadow:0 2px 4px rgba(46,16,101,.3);}
#gf-mem-logo span:first-child{left:2px;transform:rotate(-12deg);}
#gf-mem-logo span:last-child{left:11px;transform:rotate(10deg);background:linear-gradient(160deg,#fffdf8,#f1e9d8);}
#gf-mem-logo span:last-child::after{content:'';position:absolute;inset:6px 3px;border-radius:3px;background:#f59e0b;}
#gf-mem-title{font-size:14px;font-weight:800;color:var(--gm-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-mem-sub{font-size:9px;color:var(--gm-txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-mem-stat-box{display:flex;flex-direction:column;align-items:center;justify-content:center;height:32px;padding:0 8px;background:var(--gm-sbox);border:1px solid var(--gm-brd2);border-radius:8px;min-width:46px;}
.gf-mem-slbl{font-size:7px;font-weight:700;letter-spacing:1.1px;color:var(--gm-txt3);}
.gf-mem-stat-box>div:last-child{font-size:13px;font-weight:800;color:var(--gm-txt);line-height:1.25;font-variant-numeric:tabular-nums;}
.gf-mem-bump{animation:gf-mem-bmp .3s ease-out;}
@keyframes gf-mem-bmp{0%{transform:scale(1.35);color:${ACCENT}}100%{transform:none}}
.gf-mem-ib{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--gm-btn-brd);border-radius:8px;background:transparent;color:var(--gm-txt2);cursor:pointer;font-size:13px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s,transform .12s;}
.gf-mem-ib:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};background:rgba(167,139,250,.1);}
.gf-mem-ib:active:not(:disabled){transform:scale(.92);}
.gf-mem-ib:disabled{opacity:.35;cursor:default;}
#gf-mem-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
#gf-mem-progress-track{height:4px;background:var(--gm-brd2);flex-shrink:0;}
#gf-mem-prog{height:100%;width:0%;background:linear-gradient(90deg,#c4b5fd,#7c3aed,#f59e0b);border-radius:0 3px 3px 0;transition:width .4s cubic-bezier(.3,1.4,.5,1);box-shadow:0 0 8px rgba(167,139,250,.6);}
#gf-mem-wrap{position:relative;display:flex;flex-direction:column;background:var(--gm-body);min-height:0;}
#gf-mem-body{display:flex;flex-direction:column;align-items:center;transition:filter .2s;}
#gf-mem-body.gf-mem-blur{filter:blur(8px) saturate(.6);}
#gf-mem-diff{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;align-self:stretch;padding:9px 12px 0;flex-shrink:0;}
.gf-mem-seg{display:flex;gap:2px;padding:3px;border-radius:10px;background:rgba(109,40,217,.08);}
.gf-mem-diff-btn{padding:5px 10px;border:none;border-radius:7px;background:transparent;color:var(--gm-txt2);font-family:inherit;font-size:10px;font-weight:700;cursor:pointer;transition:color .12s,background .12s,box-shadow .12s;}
.gf-mem-diff-btn:hover{color:${ACCENT};}
.gf-mem-diff-active{background:var(--gm-card)!important;color:#8b5cf6!important;box-shadow:0 1px 3px rgba(46,16,101,.2);}
#gf-memory[data-theme="dark"] .gf-mem-diff-active{color:${ACCENT}!important;}
#gf-mem-board-wrap{position:relative;margin:10px 12px 12px;line-height:0;flex-shrink:0;}
#gf-mem-view{display:inline-block;line-height:0;}
#gf-mem-cv{display:block;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
#gf-mem-ovr{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:14px;background:var(--gm-ovr);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:gf-mem-fade .22s ease-out;}
#gf-mem-ovr[data-kind="paused"]{backdrop-filter:none;-webkit-backdrop-filter:none;}
#gf-mem-ovr[data-kind="win"]{background:linear-gradient(180deg,transparent,var(--gm-ovr) 40%);backdrop-filter:none;-webkit-backdrop-filter:none;}
@keyframes gf-mem-fade{from{opacity:0}to{opacity:1}}
.gf-mem-card{display:flex;flex-direction:column;align-items:center;gap:9px;max-width:100%;padding:18px 22px;background:var(--gm-card);border:1px solid var(--gm-brd);border-radius:16px;box-shadow:0 14px 40px rgba(46,16,101,.22);text-align:center;animation:gf-mem-pop .34s cubic-bezier(.2,1.4,.4,1);}
.gf-mem-card-wide{gap:7px;padding:16px 18px;}
@keyframes gf-mem-pop{from{transform:scale(.85) translateY(10px);opacity:0}to{transform:none;opacity:1}}
.gf-mem-scr-title,.gf-mem-ovr-title{font-size:21px;font-weight:800;letter-spacing:-.5px;color:var(--gm-txt);line-height:1.1;}
.gf-mem-ovr-title{background:linear-gradient(90deg,#8b5cf6,#ec4899,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;}
.gf-mem-scr-sub{font-size:10px;color:var(--gm-txt2);}
.gf-mem-sec{align-self:stretch;margin-top:4px;font-size:8px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--gm-txt3);text-align:left;}
.gf-mem-picks,.gf-mem-lvs{display:flex;gap:7px;}
.gf-mem-pick{display:flex;flex-direction:column;align-items:center;gap:5px;width:112px;padding:9px 6px 8px;border:1.5px solid var(--gm-brd2);border-radius:12px;background:var(--gm-sbox);color:var(--gm-txt);font-family:inherit;cursor:pointer;transition:transform .14s,border-color .14s,box-shadow .14s;}
.gf-mem-pick b{font-size:11px;font-weight:800;}
.gf-mem-pick:hover,.gf-mem-lv:hover{transform:translateY(-3px);border-color:${ACCENT};box-shadow:0 8px 20px rgba(124,58,237,.2);}
.gf-mem-pick-on,.gf-mem-lv-on{border-color:#8b5cf6;background:rgba(139,92,246,.12);}
.gf-mem-fan{position:relative;width:86px;height:58px;}
.gf-mem-fan .gf-mem-i{position:absolute;top:2px;width:40px;height:52px;filter:drop-shadow(0 2px 3px rgba(30,10,70,.3));transition:transform .2s;}
.gf-mem-fan0{left:2px;transform:rotate(-14deg) translateY(4px);}
.gf-mem-fan1{left:23px;transform:rotate(-2deg);}
.gf-mem-fan2{left:44px;transform:rotate(12deg) translateY(4px);}
.gf-mem-pick:hover .gf-mem-fan0{transform:rotate(-20deg) translate(-4px,4px);}
.gf-mem-pick:hover .gf-mem-fan2{transform:rotate(18deg) translate(4px,4px);}
.gf-mem-lv{display:flex;flex-direction:column;align-items:center;gap:2px;width:84px;padding:7px 4px;border:1.5px solid var(--gm-brd2);border-radius:10px;background:var(--gm-sbox);color:var(--gm-txt);font-family:inherit;cursor:pointer;transition:transform .14s,border-color .14s,box-shadow .14s;}
.gf-mem-lv b{font-size:11px;font-weight:800;}
.gf-mem-lv span{font-size:9px;color:var(--gm-txt2);}
.gf-mem-lv em{font-style:normal;font-size:8.5px;font-weight:700;color:var(--gm-txt3);}
.gf-mem-stars{display:flex;gap:4px;align-items:flex-end;}
.gf-mem-star{width:30px;height:30px;background:rgba(148,163,184,.35);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:gf-mem-st .45s cubic-bezier(.2,1.6,.4,1) both;}
.gf-mem-star:nth-child(2){width:38px;height:38px;}
.gf-mem-star.on{background:linear-gradient(180deg,#fde68a,#f59e0b);}
@keyframes gf-mem-st{from{transform:scale(0) rotate(-40deg)}to{transform:none}}
.gf-mem-ovr-stats{display:flex;gap:6px;}
.gf-mem-ovr-stat{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:70px;padding:6px 10px;border-radius:10px;background:var(--gm-sbox);}
.gf-mem-ovr-stat span{font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--gm-txt3);}
.gf-mem-ovr-stat strong{font-size:16px;font-weight:800;color:var(--gm-txt);font-variant-numeric:tabular-nums;}
.gf-mem-ovr-best{padding:3px 10px;border-radius:999px;background:linear-gradient(90deg,#fde047,#f59e0b);color:#422006;font-size:10px;font-weight:800;box-shadow:0 2px 8px rgba(245,158,11,.4);}
.gf-mem-ovr-sub{font-size:10px;color:var(--gm-txt2);}
.gf-mem-btns{display:flex;gap:8px;margin-top:2px;}
.gf-mem-btn{padding:9px 22px;border:none;border-radius:10px;background:linear-gradient(180deg,#a78bfa,#7c3aed);color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.2px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.22),0 4px 14px rgba(124,58,237,.35);transition:transform .12s,box-shadow .12s,filter .12s;}
.gf-mem-btn:hover{transform:translateY(-1px);filter:brightness(1.06);box-shadow:inset 0 -3px 0 rgba(0,0,0,.22),0 6px 18px rgba(124,58,237,.45);}
.gf-mem-btn:active{transform:translateY(1px);}
.gf-mem-btn2{background:var(--gm-sbox);color:var(--gm-txt2);border:1px solid var(--gm-brd2);box-shadow:inset 0 -3px 0 rgba(0,0,0,.06);}
.gf-mem-btn2:hover{color:#8b5cf6;box-shadow:inset 0 -3px 0 rgba(0,0,0,.06);}
#gf-mem-hint{font-size:9px;color:var(--gm-txt3);text-align:center;padding:7px 14px 9px;flex-shrink:0;background:var(--gm-hdr);border-top:1px solid var(--gm-brd);}
@media (max-width:560px){.gf-mem-stat-box:nth-child(3){display:none}#gf-mem-sub{display:none}.gf-mem-picks,.gf-mem-lvs{flex-wrap:wrap;justify-content:center}}
`;
    document.head.appendChild(s);
  }

})(window);
