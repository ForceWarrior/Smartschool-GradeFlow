;(function (W) {
  'use strict';
  if (W.OpenGradeHook) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 760;
  const CV_H = 460;
  const STEP = 1 / 120;
  const GRAV = 1900;
  const DRAG_K = Math.exp(-0.02 * STEP);
  const REACH = 255;
  const MAX_V = 1500;
  const PUMP = 260;
  const PUMP_MAX = 1150;
  const CORE_R = 11;
  const PAD_R = 7;
  const KILL_Y = 680;
  const LEVELS_OLD = 24;
  const LEVELS = 32;
  const TRAIL = 20;
  const ARM = 8.5;
  const LEG = 10;
  const BOOST = 1280;
  const WIND_K = 260;
  const SHOT_R = 6;
  const TAU = Math.PI * 2;
  const OUT = '#231d33';
  const ACCENT = '#ec4899';
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const F_HOOK = `800 10px ${FONT}`;
  const F_POP = `900 13px ${FONT}`;
  const F_SIGN = `900 16px ${FONT}`;
  const F_SMALL = `700 9px ${FONT}`;
  const F_BADGE = `900 12px ${FONT}`;
  const F_TIME = `800 15px ${FONT}`;
  const F_SUB = `800 11px ${FONT}`;
  const F_HINT = `800 14px ${FONT}`;

  const LS_BEST = 'gf-hk-best';
  const LS_LEVEL = 'gf-hk-level';
  const LS_TIMES = 'gf-hk-times';
  const LS_CUSTOM = 'gf-hk-custom';
  const LS_SNAP = 'gf-hk-snap';
  const LS_SKIN = 'gf-hk-skin';
  const LS_INTRO = 'gf-hk-intro';
  const CODE_PRE = 'GFHOOK1:';
  const CODE_PRE2 = 'GFHOOK2:';
  const Q = 5;
  const GRID = 20;
  const NAME_MAX = 32;
  const MAX_N = { h: 150, b: 120, p: 60, z: 120, t: 40, x: 40, u: 60, o: 40, w: 30, j: 60, q: 12 };
  const WID = { h: 6, b: 4, p: 4, z: 4, t: 6, x: 8, u: 3, o: 3, w: 6, j: 4, q: 2 };
  const OLD_T = 'hbpz';
  const NEW_T = 'txuowjq';
  const ALL_T = OLD_T + NEW_T;
  const SPEC = {
    t: [['S', 5], ['U', 1], ['U', 10], ['U', 1]],
    x: [['U', 5], ['S', 5], ['S', 5], ['S', 5], ['S', 5], ['U', 1]],
    u: [['U', 5]],
    o: [['S', 5]],
    w: [['U', 5], ['U', 5], ['S', 45], ['U', 1]],
    j: [['U', 5], ['S', 1]],
    q: [],
  };
  const MAX_ALL = 400;
  const MAX_CUSTOM = 100;
  const MAX_CODE = 12000;
  const MAX_RAW = 16384;
  const TOOLS = ['sel', 'h', 'b', 'p', 'z', 's', 'f', 't', 'x', 'u', 'o', 'w', 'j', 'q'];
  const EL_KEY = { sel: 'hk_tool_select', h: 'hk_el_hook', b: 'hk_el_block', p: 'hk_el_pad', z: 'hk_el_haz', s: 'hk_el_start', f: 'hk_el_finish',
    t: 'hk_el_turret', x: 'hk_el_spin', u: 'hk_el_crumble', o: 'hk_el_boost', w: 'hk_el_wind', j: 'hk_el_wall', q: 'hk_el_check', y: 'hk_el_kill' };
  const FT_KEY = ['hk_ft_line', 'hk_ft_hoop', 'hk_ft_plat', 'hk_ft_target'];
  const TAG = { h: 'good', b: 'safe', p: 'good', z: 'bad', s: 'goal', f: 'goal', t: 'bad', x: 'bad', u: 'warn', o: 'good', w: 'warn', j: 'warn', q: 'good', y: 'bad', ft0: 'goal', ft1: 'goal', ft2: 'goal', ft3: 'goal' };
  const TAG_C = { bad: '#ef4444', good: '#22c55e', warn: '#f59e0b', goal: '#3b82f6', safe: '#94a3b8' };
  const INTRO_T = { pads: 'p', haz: 'z', turrets: 't', spins: 'x', crum: 'u', boosts: 'o', winds: 'w', walls: 'j', checks: 'q' };
  const HELP_EL = ['h', 'b', 'p', 'z', 't', 'x', 'u', 'o', 'w', 'j', 'q', 'y'];
  const HELP_FT = ['ft0', 'ft1', 'ft2', 'ft3'];
  const XY = [['X', 5], ['Y', 5]];
  const MOT = i => [['hk_move_x', 5, 1, i], ['hk_move_y', 5, 1, i + 1], ['hk_speed', 0.1, 0.1, i + 2]];
  const FIELDS = {
    h: [...XY, ...MOT(2), ['hk_phase', 1]],
    b: [...XY, ['hk_width', 5], ['hk_height', 5]],
    z: [...XY, ['hk_width', 5], ['hk_height', 5]],
    p: [...XY, ['hk_width', 5], ['hk_angle', 1]],
    t: [...XY, ['hk_angle', 5], ['hk_rate', 0.1, 0.1], ['hk_shot_speed', 10], ['hk_phase', 1]],
    x: [...XY, ['hk_length', 5], ['hk_angle', 5], ['hk_spin', 5], ...MOT(5)],
    u: [...XY, ['hk_width', 5]],
    o: [...XY, ['hk_angle', 5]],
    w: [...XY, ['hk_width', 5], ['hk_height', 5], ['hk_angle', 45], ['hk_strength', 1]],
    j: [...XY, ['hk_length', 5], ['hk_angle', 1]],
    q: XY,
    s: XY,
    f: [...XY, ...MOT(3)],
    y: [['hk_kill_y', 5]],
  };
  const ANG_I = { t: 2, x: 3, o: 2 };
  const MOV_I = { h: 2, x: 5, f: 3 };
  const RUN = { ready: 1, playing: 1, dead: 1, finish: 1, complete: 1 };

  const PALS = [
    ['#cdeefa', '#f1fbff', '#b5e2f3', '#9dd5ea'],
    ['#fbdcea', '#fff4f9', '#f6c6dc', '#efafcc'],
    ['#e3dcfb', '#f8f6ff', '#d2c6f6', '#bfaff0'],
    ['#d6f3df', '#f4fcf6', '#bfe9cc', '#a5ddb7'],
    ['#fde9c8', '#fffaf1', '#f8d9a6', '#f1c785'],
  ];
  const NIGHT = ['#0b1226', '#1a2444', '#18213f', '#1f2a4f'];
  const LIGHT = {
    man: '#1c1a2b', rope: '#26233a', block: '#3d3b58', blockTop: '#5a587c', pad: '#f59e0b', padTop: '#fde68a', post: '#a16207',
    rail: 'rgba(61,59,88,0.28)', hud: '#26233a', hudSub: 'rgba(38,35,58,0.55)', track: 'rgba(38,35,58,0.13)',
    badge: '#ffffff', pill: 'rgba(255,255,255,0.88)', pillTxt: '#26233a', chkA: '#ffffff', chkB: '#1c1a2b',
    cloud: 'rgba(255,255,255,0.7)', trail: 'rgba(236,72,153,0.28)', fade: '#ffffff', sign: '#ffffff',
    haz: '#e11d48', hazTop: 'rgba(255,255,255,0.4)', kill: 'rgba(239,68,68,0.1)', grid: 'rgba(38,35,58,0.08)', grid2: 'rgba(38,35,58,0.16)',
    manOut: 'rgba(255,255,255,0.92)', eye: '#ffffff', ropeOut: 'rgba(255,255,255,0.75)', blockOut: '#231f38', blockLip: '#77749e', blockBot: '#2e2c46',
    hazHi: '#fb7185', hazOut: '#7f1231', wind: 'rgba(56,189,248,0.2)', windLine: 'rgba(255,255,255,0.9)', windEdge: 'rgba(14,165,233,0.5)', wall: '#22d3ee', wallBack: 'rgba(34,211,238,0.35)',
    sel: 'rgba(236,72,153,0.12)', label: '#26233a',
  };
  const DARK = {
    man: '#f4f6fb', rope: '#e2e8f0', block: '#2b3765', blockTop: '#3f4d88', pad: '#fbbf24', padTop: '#fef3c7', post: '#92400e',
    rail: 'rgba(226,232,240,0.22)', hud: '#f4f6fb', hudSub: 'rgba(244,246,251,0.55)', track: 'rgba(255,255,255,0.14)',
    badge: '#141c36', pill: 'rgba(20,28,54,0.88)', pillTxt: '#f4f6fb', chkA: '#e2e8f0', chkB: '#0f1730',
    cloud: 'rgba(255,255,255,0.035)', trail: 'rgba(244,114,182,0.42)', fade: '#0b1226', sign: '#141c36',
    haz: '#f43f5e', hazTop: 'rgba(255,255,255,0.3)', kill: 'rgba(239,68,68,0.14)', grid: 'rgba(255,255,255,0.05)', grid2: 'rgba(255,255,255,0.11)',
    manOut: 'rgba(8,12,30,0.9)', eye: '#141c36', ropeOut: 'rgba(8,12,30,0.8)', blockOut: '#0c1330', blockLip: '#5566a8', blockBot: '#1d2650',
    hazHi: '#fda4af', hazOut: '#4c0519', wind: 'rgba(125,211,252,0.14)', windLine: 'rgba(186,230,253,0.75)', windEdge: 'rgba(125,211,252,0.45)', wall: '#67e8f9', wallBack: 'rgba(103,232,249,0.3)',
    sel: 'rgba(244,114,182,0.14)', label: '#f4f6fb',
  };
  const POSE_HANG = [-4, 1, -6, -7, 3, 3, 5, -5, -3, -18, -5, -27, 4, -18, 3, -28];
  const POSE_FLY = [-8, 9, -15, 7, 8, 10, 15, 9, -7, -15, -4, -24, 7, -16, 11, -24];
  const POSE_TUCK = [6, 1, 9, -6, 8, 3, 11, -4, 7, -7, 0, -13, 9, -5, 2, -11];
  const POSE_WIN = [-7, 13, -10, 22, 7, 13, 10, 22, -4, -18, -6, -28, 4, -18, 6, -28];
  const CONF_COLORS = ['#ec4899', '#4ade80', '#a3e635', '#f97316', '#60a5fa', '#facc15', '#a78bfa'];
  const Ico = p => `<svg class="gf-hk-i" viewBox="0 0 16 16" aria-hidden="true">${p}</svg>`;
  const IC = {
    back: Ico('<path d="M10 3L5 8l5 5"/>'),
    undo: Ico('<path d="M5.5 3.5l-3 3 3 3"/><path d="M2.5 6.5H10a3.5 3.5 0 010 7H7"/>'),
    redo: Ico('<path d="M10.5 3.5l3 3-3 3"/><path d="M13.5 6.5H6a3.5 3.5 0 000 7h3"/>'),
    grid: Ico('<path d="M2 5.5h12M2 10.5h12M5.5 2v12M10.5 2v12"/>'),
    fit: Ico('<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>'),
    del: Ico('<path d="M2.5 4.5h11M6.5 4.5v-2h3v2M4 4.5l.8 9h6.4l.8-9"/>'),
    code: Ico('<path d="M5.5 4l-4 4 4 4M10.5 4l4 4-4 4"/>'),
    play: Ico('<path d="M5 3l8 5-8 5z" fill="currentColor"/>'),
    edit: Ico('<path d="M2.5 13.5l.8-3.3 7.9-7.9 2.5 2.5-7.9 7.9z"/><path d="M9.5 4L12 6.5"/>'),
    ren: Ico('<path d="M3 4.5v-2h10v2M8 2.5v11M6 13.5h4"/>'),
    dup: Ico('<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3 10.5h-.5v-8h8V3"/>'),
    sel: Ico('<path d="M3.5 2.5l9 4.5-4 1.2-1.7 4.3z"/>'),
    h: Ico('<circle cx="8" cy="8" r="4.5" fill="currentColor"/>'),
    b: Ico('<rect x="1.5" y="6" width="13" height="5.5" rx="1.5"/>'),
    p: Ico('<path d="M2 7.5q6 3 12 0M4 9.5V13M12 9.5V13"/>'),
    z: Ico('<path d="M1.5 13l2.2-7 2.2 7 2.2-7 2.2 7 2.2-7 2.2 7"/>'),
    s: Ico('<circle cx="8" cy="3.5" r="1.7"/><path d="M8 5.5V10M5 7.5h6M8 10l-2.5 4M8 10l2.5 4"/>'),
    f: Ico('<path d="M3.5 14.5V2M3.5 2.5h9v6h-9M6.5 2.5v6M9.5 2.5v6M3.5 5.5h9"/>'),
    t: Ico('<circle cx="6" cy="10" r="3.5"/><path d="M8 8.2l5.5-4M2 14h8"/>'),
    x: Ico('<path d="M3 13L13 3M5 9.5l-1.8-1.8M8.2 6.3L6.5 4.5M7.8 12.8L6 11M11.2 9.5l-1.8-1.8"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/>'),
    u: Ico('<path d="M1.5 6.5h5l-1 2 1.5 1.5h-5.5zM9 6.5h5.5v3.5H9l1-1.8z"/><path d="M4 12.5l-.5 1.5M11.5 12l.6 1.8"/>'),
    o: Ico('<ellipse cx="8" cy="8" rx="3.2" ry="5.5"/><path d="M1.5 8h3M11.5 6l2 2-2 2"/>'),
    w: Ico('<path d="M2 5.5h7.5a2 2 0 10-2-2M2 8.5h10.5a2 2 0 11-2 2M2 11.5h5"/>'),
    j: Ico('<path d="M2.5 11h11"/><path d="M5 8.5l1.5-2 1.5 2M9 8.5l1.5-2 1.5 2" /><path d="M4.5 14v-1.5M8 14v-1.5M11.5 14v-1.5" opacity=".5"/>'),
    q: Ico('<path d="M4 14.5V2M4 2.5l8 2.8-8 2.8"/><path d="M2 14.5h5"/>'),
    goal: Ico('<path d="M3.5 14.5V2M3.5 2.5h9v6h-9M6.5 2.5v6M9.5 2.5v6M3.5 5.5h9"/><circle cx="12.5" cy="12.5" r="2" fill="currentColor"/>'),
    ft0: Ico('<path d="M5 14.5V2M5 2.5h6v5H5M8 2.5v5M5 5h6"/>'),
    ft1: Ico('<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="3" opacity=".45"/>'),
    ft2: Ico('<rect x="1.5" y="10" width="13" height="3.5" rx="1"/><path d="M8 10V2.5l4 1.6-4 1.6"/>'),
    ft3: Ico('<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3.4"/><circle cx="8" cy="8" r="1" fill="currentColor"/>'),
    help: Ico('<circle cx="8" cy="8" r="6.5"/><path d="M6.1 6.3a2 2 0 113 1.6c-.7.4-1.1.8-1.1 1.6M8 11.4v.2"/>'),
  };

  const _mem = {};
  function StorageGet(k, d) { try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (_) {} return k in _mem ? _mem[k] : d; }
  function StorageSet(k, v) { _mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function Unlocked() {
    const t = Times();
    let n = StorageGet(LS_LEVEL, 1) | 0;
    for (const k in t) if (t[k] && +k + 1 > n) n = +k + 1;
    return Math.max(1, Math.min(LEVELS, n));
  }
  function LoadBest() { return Math.max(Unlocked(), StorageGet(LS_BEST, 1) | 0); }
  function Times() { return StorageGet(LS_TIMES, {}) || {}; }

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
    if (Pct >= 75) return '#4ade80';
    if (Pct >= 50) return '#a3e635';
    if (Pct >= 25) return '#f97316';
    return '#f87171';
  }
  function GradeAt(i) { return _grades[i % _grades.length]; }

  let GS = null, _grades = [], _raf = null, _last = 0, _kh = null, _tobs = null;
  let _root = null, _view = null, _cv = null, _ctx = null, _k = 1, _txt = null;
  let _thm = '';
  let ED = null, _edRaf = 0, _toastT = 0, _armT = 0, _cur = '', _busy = false, _codeMode = '';

  function Rng(s) {
    return () => {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const EXTRA = [
    { c: 5, f: [1900, 460], h: [[230, 200], [420, 180], [610, 205], [1060, 170], [1250, 190], [1440, 175], [1640, 195]], b: [[1870, 460, 1440, 900]], w: [[700, 230, 260, 420, -90, 9]], o: [[1500, 300, -15]] },
    { c: 6, f: [2030, 215, 1], h: [[230, 200], [420, 175], [610, 195], [1010, 175], [1200, 190], [1400, 170], [1590, 180]], o: [[740, 270, -10], [1790, 220, -10]], b: [[1470, 430, 70, 400]], q: [[1490, 430]] },
    { c: 7, f: [2240, 460], h: [[230, 200], [420, 185], [820, 180], [1010, 200], [1410, 180], [1600, 190], [1790, 175], [1980, 195]], u: [[540, 330, 160], [1120, 330, 180]], q: [[1180, 330]], z: [[560, 620, 1600, 20]], b: [[2210, 460, 1440, 900]] },
    { c: 8, f: [2050, 300, 2], h: [[230, 200], [420, 180], [610, 195], [800, 175], [1000, 190], [1200, 170], [1400, 190], [1600, 175], [1800, 195]], t: [[900, 470, -90, 22, 380, 0], [1500, 470, -90, 22, 380, 8]], b: [[860, 485, 80, 400], [1460, 485, 80, 400]] },
    { c: 9, f: [2300, 460], h: [[230, 200], [430, 175], [640, 195], [850, 170], [1060, 190], [1270, 175], [1480, 195], [1690, 170], [1900, 190], [2100, 180]], x: [[745, 330, 160, 0, 90, 0, 0, 20], [1375, 320, 180, 45, -110, 0, 0, 20], [1795, 300, 140, 0, 0, 0, 60, 18]], q: [[1170, 410]], b: [[1120, 410, 120, 600], [2270, 460, 1440, 900]] },
    { c: 5, f: [2000, 220, 1, 0, 70, 16], h: [[230, 200], [420, 180], [610, 195], [810, 175], [1010, 190], [1210, 170], [1410, 190], [1610, 175], [1810, 180]], j: [[520, 420, 200, 0], [1120, 430, 220, 0]], b: [[900, -1400, 60, 1520]], z: [[480, 610, 1300, 20]] },
    { c: 6, f: [2500, 460], h: [[230, 200], [420, 180], [610, 195], [1010, 170], [1210, 195], [1410, 175], [1810, 185], [2010, 170], [2210, 190]], w: [[700, 240, 240, 420, -45, 7]], t: [[1310, 470, -100, 18, 420, 0]], u: [[1560, 340, 160]], q: [[1600, 340]], o: [[1650, 270, -10]], b: [[1270, 485, 80, 400], [2470, 460, 1440, 900]] },
    { c: 7, f: [2800, 250, 3, 0, 40, 12], h: [[230, 200], [420, 180], [610, 195], [810, 170], [1010, 190], [1410, 175], [1610, 190], [1810, 170], [2210, 185], [2410, 175], [2610, 195]], o: [[1130, 280, -15]], x: [[1510, 380, 160, 0, 120, 0, 0, 20]], q: [[1920, 380]], b: [[1870, 380, 110, 600], [2460, 485, 80, 400]], w: [[1990, 220, 200, 420, -90, 9]], t: [[2500, 470, -95, 20, 400, 4]], j: [[700, 430, 180, 0]], u: [[2310, 330, 140]] },
  ];
  const _extra = {};
  function Extra(n) {
    if (_extra[n]) return _extra[n];
    const e = EXTRA[n - LEVELS_OLD - 1], d = { n: '', c: e.c, sk: 0, s: [60, 400], f: e.f.length === 6 ? e.f : [e.f[0], e.f[1], e.f[2] || 0, 0, 0, 20], kh: [KILL_Y] };
    for (const t of ALL_T) d[t] = (e[t] || []).map(r => t === 'h' ? [r[0], r[1], r[2] || 0, r[3] || 0, r[4] || 20, r[5] || 0] : r.slice());
    d.b.unshift([-240, 400, 310, 300]);
    return _extra[n] = Normalize(d);
  }

  function Extras(L) {
    L.turrets = []; L.spins = []; L.crum = []; L.boosts = []; L.winds = []; L.walls = []; L.checks = [];
    L.goal = { t: 0, x: L.finish, y: L.fy, bx: L.finish, by: L.fy, ax: 0, ay: 0, sp: 0 };
    return L;
  }

  function BuildLevel(n) {
    if (n > LEVELS_OLD) return BuildCustom(Extra(n));
    if (!_grades.length) _grades = FallbackGrades();
    const r = Rng(n * 7919 + 104729), d = (n - 1) / (LEVELS_OLD - 1);
    const L = { hooks: [], pads: [], blocks: [], haz: [], finish: 0, fy: 460, sx: 60, sy: 371, ky: KILL_Y, th: THEMES[(n - 1) % PALS.length], g: GradeAt(n * 3) };
    let x = 230, ly = 205;
    const Hook = (hx, hy, ax, ay, sp) => {
      const g = GradeAt(n * 5 + L.hooks.length);
      ly = hy;
      L.hooks.push({ x: hx, y: hy, bx: hx, by: hy, ax: ax || 0, ay: ay || 0, sp: sp || 0, ph: r() * 6.283, vx: 0, vy: 0, g, t: String(Math.round((g.Pct ?? 60) / 5)) });
    };
    const Pad = (px, py, w, a) => { const c = Math.cos(a) * w / 2, s = Math.sin(a) * w / 2; L.pads.push({ x1: px - c, y1: py - s, x2: px + c, y2: py + s, hit: 0 }); };
    const Block = (bx, by, w, h) => L.blocks.push({ x: bx, y: by, w, h });
    Block(-700, 400, 772, 900);
    Hook(x, ly);
    const kinds = ['run'];
    if (n >= 2) kinds.push('pad');
    if (n >= 3) kinds.push('wall');
    if (n >= 5) kinds.push('roof');
    if (n >= 6) kinds.push('chain');
    if (n >= 8) kinds.push('move', 'move');
    if (n >= 10) kinds.push('tunnel');
    if (n >= 12) kinds.push('gap');
    const intro = { 2: 'pad', 3: 'wall', 5: 'roof', 6: 'chain', 8: 'move', 10: 'tunnel', 12: 'gap' }[n];
    const count = 3 + Math.round(d * 5);
    let prev = 'run';
    for (let i = 0; i < count; i++) {
      let k = i === 0 ? 'run' : i === 1 && intro ? intro : kinds[r() * kinds.length | 0];
      if (k === prev && k !== 'run') k = 'run';
      prev = k;
      if (k === 'run') {
        const m = 2 + (r() * 2 | 0);
        for (let j = 0; j < m; j++) { x += 165 + r() * 40 + d * 85; Hook(x, 140 + r() * 110); }
      } else if (k === 'pad') {
        const px = x + 190 + r() * 30;
        Pad(px, 480 + r() * 25, 150 - d * 40, 0.14 + r() * 0.08);
        x = px + 220 + d * 40;
        Hook(x, 150 + r() * 50);
      } else if (k === 'wall') {
        const wx = x + 125 + r() * 25, ny = 150 + r() * 50;
        Block(wx, Math.max(ly, ny) + 195 - d * 45, 44, 1000);
        x = wx + 150 + r() * 30;
        Hook(x, ny);
      } else if (k === 'roof') {
        const rx = x + 130 + r() * 20, bot = Math.min(ly, 190) - 20 - r() * 20;
        Block(rx, -1400, 54, 1400 + bot);
        Hook(rx + 27, bot + 85 + r() * 25);
        x = rx + 214 + r() * 30;
        Hook(x, 150 + r() * 60);
      } else if (k === 'chain') {
        const m = 2 + (d > 0.55 ? 1 : 0);
        let px = x + 200;
        for (let j = 0; j < m; j++) { Pad(px, 495 - j * 10, 140 - d * 25, 0.26); if (j < m - 1) px += 300; }
        x = px + 230;
        Hook(x, 170 + r() * 40);
      } else if (k === 'move') {
        const m = 2 + (r() * 2 | 0);
        for (let j = 0; j < m; j++) {
          x += 200 + d * 50 + r() * 30;
          const v = r() < 0.5;
          Hook(x, 190 + r() * 40, v ? 0 : 45 + r() * 25, v ? 55 + r() * 30 : 0, 1.5 + r() * 1.2);
        }
      } else if (k === 'tunnel') {
        const tx = x + 130, len = 560 + r() * 180, top = 110 + r() * 25, gap = 310 - d * 40, m = Math.round((len - 200) / 170) + 1;
        Block(tx, -1400, len, 1400 + top);
        Block(tx, top + gap, len, 1000);
        for (let j = 0; j < m; j++) Hook(tx + 100 + j * (len - 200) / (m - 1), top + 80 + r() * 25);
        x = tx + len + 110;
        Hook(x, top + 90 + r() * 30);
      } else {
        x += 300 + d * 70 + r() * 30;
        Hook(x, 155 + r() * 50);
      }
    }
    x += 185;
    L.finish = x;
    Block(x - 30, 460, 1440, 900);
    Block(x + 1410, -1400, 200, 2760);
    return Extras(L);
  }

  const Cl = (v, lo, hi, q) => Math.max(lo, Math.min(hi, Math.round(v / q) * q));
  const Fin = v => typeof v === 'number' && Number.isFinite(v);
  const Rows = (a, n, w) => Array.isArray(a) && a.length <= n && a.every(r => Array.isArray(r) && r.length === w && r.every(Fin));
  function Ang(v, q) { v = Math.round((((v + 180) % 360 + 360) % 360 - 180) / q) * q; return v <= -180 ? v + 360 : v; }
  function FixPt(a) { a[0] = Cl(a[0], -500, 12000, Q); a[1] = Cl(a[1], -200, 660, Q); return a; }
  function Mot(a, i) {
    a[i] = Cl(a[i], -400, 400, Q); a[i + 1] = Cl(a[i + 1], -400, 400, Q);
    a[i + 2] = a[i] || a[i + 1] ? Cl(a[i + 2], 5, 60, 1) : 20;
  }
  function FixH(a) {
    FixPt(a);
    Mot(a, 2);
    a[5] = a[2] || a[3] ? Cl(a[5], 0, 15, 1) : 0;
    return a;
  }
  function FixR(a) { a[0] = Cl(a[0], -2000, 12000, Q); a[1] = Cl(a[1], -1500, 1500, Q); a[2] = Cl(a[2], 10, 4000, Q); a[3] = Cl(a[3], 10, 3000, Q); return a; }
  function FixP(a) { FixPt(a); a[2] = Cl(a[2], 40, 600, Q); a[3] = Cl(a[3], -90, 90, 1); return a; }
  function FixT(a) { FixPt(a); a[2] = Ang(a[2], 5); a[3] = Cl(a[3], 3, 50, 1); a[4] = Cl(a[4], 150, 900, 10); a[5] = Cl(a[5], 0, 15, 1); return a; }
  function FixX(a) { FixPt(a); a[2] = Cl(a[2], 40, 400, Q); a[3] = Ang(a[3], 5); a[4] = Cl(a[4], -360, 360, 5); Mot(a, 5); return a; }
  function FixC(a) { FixPt(a); a[2] = Cl(a[2], 40, 400, Q); return a; }
  function FixO(a) { FixPt(a); a[2] = Ang(a[2], 5); return a; }
  function FixW(a) { a[0] = Cl(a[0], -2000, 12000, Q); a[1] = Cl(a[1], -1500, 1500, Q); a[2] = Cl(a[2], 40, 2000, Q); a[3] = Cl(a[3], 40, 2000, Q); a[4] = Ang(a[4], 45); a[5] = Cl(a[5], 1, 10, 1); return a; }
  function FixJ(a) { FixPt(a); a[2] = Cl(a[2], 40, 600, Q); a[3] = Ang(a[3], 1); return a; }
  const FIX = { h: FixH, b: FixR, p: FixP, z: FixR, t: FixT, x: FixX, u: FixC, o: FixO, w: FixW, j: FixJ, q: FixPt };
  function FixSF(d, m) {
    d.s[0] = Cl(d.s[0], -500, 11800, Q); d.s[1] = Cl(d.s[1], -200, 660, Q);
    d.f[0] = Cl(d.f[0], -400, 12000, Q); d.f[1] = Cl(d.f[1], -200, 660, Q);
    if (m === 's') d.s[0] = Math.min(d.s[0], d.f[0] - 100);
    else if (m === 'f') d.f[0] = Math.max(d.f[0], d.s[0] + 100);
    d.f[2] = Cl(d.f[2], 0, 3, 1);
    if (d.f[2]) Mot(d.f, 3); else { d.f[3] = 0; d.f[4] = 0; d.f[5] = 20; }
    d.kh[0] = Math.max(Cl(d.kh[0], 300, 1500, Q), d.s[1] + 60);
  }
  function CleanName(s) { return Array.from(String(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').trim()).slice(0, NAME_MAX).join('').trim(); }

  function Normalize(d) {
    if (!d || typeof d.n !== 'string' || !Fin(d.c) || !Rows([d.s], 1, 2) || !Array.isArray(d.f) || !Rows([d.f], 1, d.f.length === 6 ? 6 : 2)) return null;
    if (d.kh !== undefined && !Rows([d.kh], 1, 1) || d.sk !== undefined && !Fin(d.sk)) return null;
    let n = 0;
    for (const t of ALL_T) {
      const a = d[t] === undefined && NEW_T.includes(t) ? [] : d[t];
      if (!Rows(a, MAX_N[t], WID[t])) return null;
      n += a.length;
    }
    if (n > MAX_ALL) return null;
    const o = { n: CleanName(d.n), c: Cl(d.c, 0, THEMES.length - 1, 1), sk: Cl(d.sk || 0, 0, SKINS.length, 1), s: d.s.slice(), f: d.f.length === 6 ? d.f.slice() : [d.f[0], d.f[1], 0, 0, 0, 20], kh: [d.kh ? d.kh[0] : KILL_Y] };
    for (const t of ALL_T) o[t] = (d[t] || []).map(r => FIX[t](r.slice()));
    FixSF(o);
    return o.f[0] - o.s[0] >= 100 ? o : null;
  }

  function Play2(d) { return d.f[2] !== 0 || d.kh[0] !== KILL_Y || [...NEW_T].some(t => d[t].length > 0); }
  function Ext(d) { return Play2(d) || d.sk > 0; }
  function Total(d) { let n = 0; for (const t of ALL_T) n += d[t].length; return n; }

  function PadEnds(r) { const a = r[3] * Math.PI / 180, c = Math.cos(a) * r[2] / 2, s = Math.sin(a) * r[2] / 2; return [r[0] - c, r[1] - s, r[0] + c, r[1] + s]; }

  function Ray(lv, x, y, dx, dy, max) {
    let best = max;
    for (const b of lv.blocks) {
      let t0 = 0, t1 = best;
      if (Math.abs(dx) < 1e-9) { if (x < b.x || x > b.x + b.w) continue; }
      else { let a = (b.x - x) / dx, c = (b.x + b.w - x) / dx; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); }
      if (Math.abs(dy) < 1e-9) { if (y < b.y || y > b.y + b.h) continue; }
      else { let a = (b.y - y) / dy, c = (b.y + b.h - y) / dy; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); }
      if (t0 <= t1 && t0 < best) best = t0;
    }
    return best;
  }

  function BuildCustom(d) {
    if (!_grades.length) _grades = FallbackGrades();
    const Box = ([x, y, w, h]) => ({ x, y, w, h }), R = Math.PI / 180;
    const L = Extras({ hooks: [], pads: [], blocks: d.b.map(Box), haz: d.z.map(Box), finish: d.f[0], fy: d.f[1], sx: d.s[0], sy: d.s[1] - 29, ky: d.kh[0], th: THEMES[d.c], g: GradeAt(d.h.length * 3 + 1) });
    d.h.forEach(([x, y, ax, ay, sp, ph], i) => {
      const g = GradeAt(i * 5 + 1);
      L.hooks.push({ x, y, bx: x, by: y, ax, ay, sp: ax || ay ? sp / 10 : 0, ph: ph * Math.PI / 8, vx: 0, vy: 0, g, t: String(Math.round((g.Pct ?? 60) / 5)) });
    });
    for (const r of d.p) { const [x1, y1, x2, y2] = PadEnds(r); L.pads.push({ x1, y1, x2, y2, hit: 0 }); }
    const [fx, fy, ft, fax, fay, fsp] = d.f, G = L.goal;
    G.t = ft; G.x = G.bx = fx; G.y = G.by = fy; G.ax = fax; G.ay = fay; G.sp = ft && (fax || fay) ? fsp / 10 : 0;
    for (const [x, y, a, per, spd, ph] of d.t) {
      const dx = Math.cos(a * R), dy = Math.sin(a * R), mx = x + dx * 30, my = y + dy * 30;
      L.turrets.push({ x, y, a: a * R, dx, dy, mx, my, per: per / 10, spd, ph: ph / 16, life: Ray(L, mx, my, dx, dy, 1600) / spd, kick: 0 });
    }
    for (const [x, y, len, a, w, ax, ay, sp] of d.x) L.spins.push({ x, y, bx: x, by: y, len, a0: a * R, a: a * R, w: w * R, ax, ay, sp: ax || ay ? sp / 10 : 0 });
    for (const [x, y, w] of d.u) L.crum.push({ x, y, w, st: 0, t: 0 });
    for (const [x, y, a] of d.o) L.boosts.push({ x, y, a: a * R, dx: Math.cos(a * R), dy: Math.sin(a * R), fl: 0, path: BoostPath(x, y, Math.cos(a * R), Math.sin(a * R)) });
    for (const [x, y, w, h, a, f] of d.w) L.winds.push({ x, y, w, h, a: a * R, dx: Math.round(Math.cos(a * R) * 1e6) / 1e6, dy: Math.round(Math.sin(a * R) * 1e6) / 1e6, f: f * WIND_K });
    for (const r of d.j) { const [x1, y1, x2, y2] = PadEnds(r), a = r[3] * R; L.walls.push({ x1, y1, x2, y2, nx: Math.sin(a), ny: -Math.cos(a), hit: 0 }); }
    for (const [x, y] of d.q) L.checks.push({ x, y, on: 0, t: 0 });
    L.checks.sort((a, b) => a.x - b.x);
    return L;
  }

  function BoostPath(x, y, dx, dy) {
    const P = new Float32Array(14);
    let vx = dx * BOOST, vy = dy * BOOST;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 5; j++) { vy += GRAV * STEP; vx *= DRAG_K; vy *= DRAG_K; x += vx * STEP; y += vy * STEP; }
      P[i * 2] = x; P[i * 2 + 1] = y;
    }
    return P;
  }

  function Hash(d) {
    const s = JSON.stringify(Play2(d) ? [d.s, d.f, d.h, d.b, d.p, d.z, d.kh, ...[...NEW_T].map(t => d[t])] : [d.s, d.f.slice(0, 2), d.h, d.b, d.p, d.z]);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
  }

  const Zz = v => v < 0 ? -v * 2 - 1 : v * 2;
  function Pack(d, v2) {
    const o = [], q = v => Math.round(v / Q);
    const U = v => { while (v > 127) { o.push(v & 127 | 128); v = Math.floor(v / 128); } o.push(v); }, S = v => U(Zz(v));
    const nm = new TextEncoder().encode(d.n);
    U(nm.length); o.push(...nm); U(d.c);
    let px = q(d.s[0]), py = q(d.s[1]);
    S(px); S(py); S(q(d.f[0]) - px); S(q(d.f[1]) - py);
    U(d.h.length);
    for (const [x, y, ax, ay, sp, ph] of d.h) {
      const m = ax || ay ? 1 : 0;
      S(q(x) - px); U(Zz(q(y) - py) * 2 + m);
      px = q(x); py = q(y);
      if (m) { S(q(ax)); S(q(ay)); U(sp); U(ph); }
    }
    for (const t of 'bpz') {
      U(d[t].length);
      for (const [x, y, w, h] of d[t]) {
        S(q(x) - px); S(q(y) - py); U(q(w));
        if (t === 'p') S(h); else U(q(h));
        px = q(x); py = q(y);
      }
    }
    if (!v2) return Uint8Array.from(o);
    U(q(d.kh[0])); U(d.f[2]);
    if (d.f[2]) { S(q(d.f[3])); S(q(d.f[4])); U(d.f[5]); }
    for (const t of NEW_T) {
      U(d[t].length);
      for (const r of d[t]) {
        S(q(r[0]) - px); S(q(r[1]) - py);
        px = q(r[0]); py = q(r[1]);
        SPEC[t].forEach(([k, st], i) => { const v = Math.round(r[i + 2] / st); if (k === 'U') U(v); else S(v); });
      }
    }
    U(d.sk);
    return Uint8Array.from(o);
  }

  function Unpack(u, v2) {
    let i = 0;
    const Bad = m => { throw new Error(m || 'bad'); };
    const U = () => { let v = 0, s = 1, b; do { if (i >= u.length || s > 2097152) Bad(); b = u[i++]; v += (b & 127) * s; s *= 128; } while (b & 128); return v; };
    const S = () => { const v = U(); return v % 2 ? -(v + 1) / 2 : v / 2; };
    const N = t => { const k = U(); if (k > MAX_N[t]) Bad(); return k; };
    const nl = U();
    if (nl > 128 || i + nl > u.length) Bad();
    const n = new TextDecoder('utf-8', { fatal: true }).decode(u.subarray(i, i += nl)), c = U();
    let px = S(), py = S();
    const d = { n, c, s: [px * Q, py * Q], f: [(px + S()) * Q, (py + S()) * Q], h: [], b: [], p: [], z: [] };
    for (let k = N('h'); k > 0; k--) {
      px += S();
      const w = U(), dy = Math.floor(w / 2);
      py += dy % 2 ? -(dy + 1) / 2 : dy / 2;
      d.h.push(w % 2 ? [px * Q, py * Q, S() * Q, S() * Q, U(), U()] : [px * Q, py * Q, 0, 0, 20, 0]);
    }
    for (const t of 'bpz') for (let k = N(t); k > 0; k--) { px += S(); py += S(); d[t].push([px * Q, py * Q, U() * Q, t === 'p' ? S() : U() * Q]); }
    if (v2) {
      d.kh = [U() * Q];
      const ft = U();
      if (ft > 3) Bad();
      d.f.push(ft, ...(ft ? [S() * Q, S() * Q, U()] : [0, 0, 20]));
      for (const t of NEW_T) {
        d[t] = [];
        for (let k = N(t); k > 0; k--) {
          px += S(); py += S();
          d[t].push([px * Q, py * Q, ...SPEC[t].map(([kd, st]) => (kd === 'U' ? U() : S()) * st)]);
        }
      }
      d.sk = U();
      if (d.sk > SKINS.length) Bad();
    }
    if (i !== u.length || ALL_T.split('').reduce((a, t) => a + (d[t] ? d[t].length : 0), 0) > MAX_ALL) Bad();
    return d;
  }

  async function Inflate(z) {
    const rd = new Blob([z]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(), out = new Uint8Array(MAX_RAW);
    let n = 0;
    for (;;) {
      const { done, value } = await rd.read();
      if (done) return out.subarray(0, n);
      if (n + value.length > MAX_RAW) { rd.cancel(); throw new Error('big'); }
      out.set(value, n);
      n += value.length;
    }
  }

  async function Encode(d) {
    const v2 = Ext(d), raw = Pack(d, v2);
    let z = null;
    try { z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch (_) {}
    const use = z && z.length < raw.length, out = new Uint8Array((use ? z : raw).length + 1);
    out[0] = use ? 1 : 0;
    out.set(use ? z : raw, 1);
    let s = '';
    for (const c of out) s += String.fromCharCode(c);
    return (v2 ? CODE_PRE2 : CODE_PRE) + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function Decode(text) {
    const s = String(text).replace(/\s+/g, ''), m = /^GFHOOK(\d+):/i.exec(s);
    if (!m) return { e: 'hk_err_code' };
    if (m[1] !== '1' && m[1] !== '2') return { e: 'hk_err_version' };
    const b = s.slice(m[0].length);
    if (b.length > MAX_CODE) return { e: 'hk_err_big' };
    if (!/^[\w-]{4,}$/.test(b)) return { e: 'hk_err_broken' };
    try {
      let u = Uint8Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      if (u[0] > 1) return { e: 'hk_err_broken' };
      u = u[0] ? await Inflate(u.subarray(1)) : u.subarray(1);
      const d = Normalize(Unpack(u, m[1] === '2'));
      return d ? { d } : { e: 'hk_err_broken' };
    } catch (err) {
      return { e: err.message === 'big' ? 'hk_err_big' : 'hk_err_broken' };
    }
  }

  function NewState() {
    return {
      status: 'start', prev: '', level: Unlocked(), lv: null,
      p: { x: 0, y: 0, vx: 0, vy: 0, th: 0, om: 0, hook: null, len: 0, ground: false },
      pts: Array.from({ length: 8 }, () => ({ x: 0, y: 0, ox: 0, oy: 0 })),
      sc: Array.from({ length: 4 }, () => ({ x: 0, y: 0, ox: 0, oy: 0 })),
      cam: { x: 0, y: 0, z: 1 },
      hold: false, target: null, time: 0, ms: 0, acc: 0, deadT: 0, finT: 0, fade: 0, prog: 0, attempts: 1, rec: false, shake: 0, ropeT: 1, gHit: false, cp: null,
      parts: Array.from({ length: 240 }, () => ({ on: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, c: '', s: 2, g: 1 })), pi: 0,
      conf: Array.from({ length: 150 }, () => ({ on: 0, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 6, h: 3, c: '', t: 0 })), ci: 0,
      pops: Array.from({ length: 6 }, () => ({ on: 0, x: 0, y: 0, t: 0, txt: '', c: '' })), qi: 0,
      trX: new Float32Array(TRAIL), trY: new Float32Array(TRAIL), trN: 0, trH: 0,
      bg: null, dark: false, custom: null, cid: null, test: false, fresh: false, best: 0,
      intro: [], introC: null, introT: 0, tut: false, hint: 0, hintA: 0, grabs: 0,
    };
  }

  function LoadLevel(n, again) {
    GS.level = n;
    GS.lv = GS.custom ? BuildCustom(GS.custom) : BuildLevel(n);
    GS.status = 'ready';
    GS.time = 0; GS.ms = 0; GS.acc = 0; GS.deadT = 0; GS.finT = 0; GS.prog = 0; GS.shake = 0;
    GS.hold = false; GS.target = null; GS.trN = 0; GS.bg = null; GS.cp = null; GS.gHit = false; GS.ropeT = 1;
    GS.attempts = again ? GS.attempts + 1 : 1;
    GS.fade = again ? 1 : 0;
    GS.skin = PickSkin();
    GS.intro = IntroKinds(GS.lv);
    GS.introC = GS.intro.length && _root ? IntroCard(GS.intro, _root.dataset.theme === 'dark') : null;
    GS.introT = 0; GS.hint = 0; GS.hintA = 0; GS.grabs = 0;
    GS.tut = !GS.custom && n <= 2 && !Times()[n];
    Stand(GS.lv.sx, GS.lv.sy);
    Camera(0, true);
  }

  function Respawn() {
    const c = GS.cp, lv = GS.lv;
    GS.status = 'ready';
    GS.deadT = 0; GS.shake = 0; GS.hold = false; GS.target = null; GS.trN = 0; GS.gHit = false; GS.ropeT = 1;
    GS.attempts++;
    GS.fade = 1;
    for (const q of lv.crum) { q.st = 0; q.t = 0; }
    Stand(c.x, c.y - 40);
    Camera(0, true);
  }

  function Stand(x, y) {
    const p = GS.p;
    p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.th = 0; p.om = 0; p.hook = null; p.len = 0;
    for (let i = 0; i < 8; i++) {
      const q = GS.pts[i];
      q.x = q.ox = p.x + POSE_HANG[i * 2];
      q.y = q.oy = p.y - POSE_HANG[i * 2 + 1];
    }
    GS.sc.forEach((q, i) => { q.x = q.ox = p.x - 3 - i * 5; q.y = q.oy = p.y - 16 + i; });
    for (const q of GS.parts) q.on = 0;
    for (const q of GS.pops) q.on = 0;
    for (const q of GS.conf) q.on = 0;
  }

  function FindHook() {
    const p = GS.p;
    let best = null, bs = 1e9;
    for (const h of GS.lv.hooks) {
      const dx = h.x - p.x, dy = h.y - p.y, d = Math.hypot(dx, dy);
      if (d > REACH) continue;
      const s = d + (dx < 0 ? -dx * 0.9 : 0) + (dy > 0 ? dy * 0.5 : 0);
      if (s < bs) { bs = s; best = h; }
    }
    return best;
  }

  function Grab() {
    const p = GS.p, h = FindHook();
    if (!h) return;
    const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) || 1, tx = -dy / d, ty = dx / d;
    const rx = p.vx - h.vx, ry = p.vy - h.vy, vt = rx * tx + ry * ty;
    const dir = Math.abs(vt) > 40 ? Math.sign(vt) : (tx >= 0 ? 1 : -1);
    const v = Math.min(MAX_V, Math.max(Math.abs(vt), Math.hypot(rx, ry) * 0.8) * 1.04 + 40);
    p.vx = h.vx + tx * dir * v;
    p.vy = h.vy + ty * dir * v;
    p.hook = h;
    p.len = Math.max(30, d);
    GS.ropeT = 0;
    GS.grabs++;
    Pop(h.x, h.y - 20, h.g.label, GradeColor(h.g.Pct));
    Burst(h.x, h.y, 8, ACCENT, 150, 1);
  }

  function Release() {
    const p = GS.p, sp = Math.hypot(p.vx, p.vy);
    p.hook = null;
    p.om = (p.vx >= 0 ? 1 : -1) * Math.min(12, Math.max(Math.abs(p.om), 3 + sp / 110));
  }

  function Bump(p, nx, ny) {
    const vn = p.vx * nx + p.vy * ny;
    if (vn >= 0) return;
    p.vx -= nx * vn * 1.4; p.vy -= ny * vn * 1.4;
    if (vn < -320) {
      Burst(p.x - nx * CORE_R, p.y - ny * CORE_R, 6, GS.dark ? DARK.blockLip : LIGHT.blockLip, 160, 0);
      Burst(p.x - nx * CORE_R, p.y - ny * CORE_R, 5, GS.dark ? '#94a3b8' : '#ffffff', 90, 2);
      GS.shake = Math.min(1, -vn / 1400);
    }
  }

  function Solid(p, x, y, w, h) {
    if (p.x + CORE_R < x || p.x - CORE_R > x + w || p.y + CORE_R < y || p.y - CORE_R > y + h) return 0;
    const cx = Math.max(x, Math.min(p.x, x + w)), cy = Math.max(y, Math.min(p.y, y + h));
    let nx = p.x - cx, ny = p.y - cy, pen;
    const d = Math.hypot(nx, ny);
    if (d > 0) { nx /= d; ny /= d; pen = CORE_R - d; }
    else {
      const l = p.x - x, rr = x + w - p.x, t = p.y - y, bt = y + h - p.y, m = Math.min(l, rr, t, bt);
      if (m === l) { nx = -1; ny = 0; } else if (m === rr) { nx = 1; ny = 0; } else if (m === t) { nx = 0; ny = -1; } else { nx = 0; ny = 1; }
      pen = m + CORE_R;
    }
    if (pen <= 0) return 0;
    p.x += nx * pen; p.y += ny * pen;
    Bump(p, nx, ny);
    if (ny < -0.6) { p.ground = true; return 2; }
    return 1;
  }

  function Round(p, cx, cy, r) {
    let nx = p.x - cx, ny = p.y - cy;
    const d = Math.hypot(nx, ny), rr = r + CORE_R;
    if (d >= rr) return;
    nx /= d || 1; ny /= d || 1;
    p.x = cx + nx * rr; p.y = cy + ny * rr;
    Bump(p, nx, ny);
    if (ny < -0.6) p.ground = true;
  }

  function SegD2(px, py, x1, y1, x2, y2) {
    const ex = x2 - x1, ey = y2 - y1, u = Math.max(0, Math.min(1, ((px - x1) * ex + (py - y1) * ey) / (ex * ex + ey * ey || 1))), dx = px - x1 - ex * u, dy = py - y1 - ey * u;
    return dx * dx + dy * dy;
  }

  function Collide(p, lv) {
    for (const b of lv.blocks) Solid(p, b.x, b.y, b.w, b.h);
    for (const c of lv.crum) if (c.st < 2 && Solid(p, c.x, c.y, c.w, 20) && !c.st && GS.status === 'playing') { c.st = 1; c.t = 0; }
    for (const t of lv.turrets) Round(p, t.x, t.y, 15);
    const G = lv.goal;
    if (G.t === 2 && Solid(p, G.x - 80, G.y, 160, 22) === 2) GS.gHit = true;
    for (const pd of lv.pads) {
      const ex = pd.x2 - pd.x1, ey = pd.y2 - pd.y1, u = Math.max(0, Math.min(1, ((p.x - pd.x1) * ex + (p.y - pd.y1) * ey) / (ex * ex + ey * ey)));
      const qx = pd.x1 + ex * u, qy = pd.y1 + ey * u, rr = CORE_R + PAD_R;
      let nx = p.x - qx, ny = p.y - qy;
      const d = Math.hypot(nx, ny);
      if (d >= rr) continue;
      nx /= d || 1; ny /= d || 1;
      p.x = qx + nx * rr; p.y = qy + ny * rr;
      const vn = p.vx * nx + p.vy * ny;
      if (vn >= 0) continue;
      const tx = -ny, ty = nx, vt = p.vx * tx + p.vy * ty, out = Math.min(1400, Math.max(1080, -vn));
      p.vx = nx * out + tx * vt * 0.7;
      p.vy = ny * out + ty * vt * 0.7;
      p.om = (p.vx >= 0 ? 1 : -1) * Math.min(12, 4 + out / 160);
      pd.hit = 1;
      Burst(qx, qy, 14, GS.dark ? DARK.pad : LIGHT.pad, 260, 0);
    }
    for (const w of lv.walls) {
      if (p.vx * w.nx + p.vy * w.ny >= 0) continue;
      const ex = w.x2 - w.x1, ey = w.y2 - w.y1, u = Math.max(0, Math.min(1, ((p.x - w.x1) * ex + (p.y - w.y1) * ey) / (ex * ex + ey * ey)));
      const qx = w.x1 + ex * u, qy = w.y1 + ey * u, rr = CORE_R + 4, dx = p.x - qx, dy = p.y - qy;
      if (dx * w.nx + dy * w.ny <= 0 || dx * dx + dy * dy >= rr * rr) continue;
      const d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny;
      p.x = qx + nx * rr; p.y = qy + ny * rr;
      if (vn >= 0) continue;
      const out = Math.max(-vn * 1.08, 620);
      p.vx += nx * (out - vn); p.vy += ny * (out - vn);
      w.hit = 1;
      Burst(qx, qy, 10, GS.dark ? DARK.wall : LIGHT.wall, 220, 1);
    }
    if (GS.status !== 'playing') return;
    for (const z of lv.haz) {
      const cx = Math.max(z.x, Math.min(p.x, z.x + z.w)), cy = Math.max(z.y, Math.min(p.y, z.y + z.h));
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < 144) { Hurt(p); return; }
    }
    for (const s of lv.spins) {
      const c = Math.cos(s.a) * s.len / 2, n = Math.sin(s.a) * s.len / 2;
      if (SegD2(p.x, p.y, s.x - c, s.y - n, s.x + c, s.y + n) < (CORE_R + 8) ** 2) { Hurt(p); return; }
    }
    const rr = (CORE_R + SHOT_R - 2) ** 2, t = GS.time;
    for (const u of lv.turrets) {
      const k1 = Math.floor(t / u.per - u.ph);
      for (let k = Math.max(0, Math.ceil((t - u.life) / u.per - u.ph)); k <= k1; k++) {
        const a = (t - (k + u.ph) * u.per) * u.spd, dx = p.x - u.mx - u.dx * a, dy = p.y - u.my - u.dy * a;
        if (dx * dx + dy * dy < rr) { Hurt(p); return; }
      }
    }
  }

  function Hurt(p) {
    Burst(p.x, p.y, 18, GS.dark ? DARK.haz : LIGHT.haz, 260, 0);
    Burst(p.x, p.y, 8, '#ffffff', 200, 1);
    Die();
  }

  function Spin(p) {
    let t = null, k = 0, c = 0;
    if (p.hook) { t = Math.atan2(p.hook.x - p.x, p.y - p.hook.y) + 0.3; k = 160; c = 18; }
    else if (p.ground) { t = 0; k = 70; c = 14; }
    if (t !== null) {
      let df = (t - p.th) % 6.2832;
      if (df > Math.PI) df -= 6.2832; else if (df < -Math.PI) df += 6.2832;
      p.om += (df * k - p.om * c) * STEP;
    } else p.om *= 0.998;
    p.th += p.om * STEP;
  }

  function Link(ax, ay, q, len) {
    const dx = q.x - ax, dy = q.y - ay, k = len / (Math.hypot(dx, dy) || 1);
    q.x = ax + dx * k; q.y = ay + dy * k;
  }
  function Link2(a, b, len, pinB) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - len) / d;
    if (pinB) { a.x += dx * f; a.y += dy * f; return; }
    a.x += dx * f * 0.5; a.y += dy * f * 0.5;
    b.x -= dx * f * 0.5; b.y -= dy * f * 0.5;
  }

  function Rag() {
    const p = GS.p, P = GS.pts, ux = Math.sin(p.th), uy = -Math.cos(p.th), st = GS.status;
    const sx = p.x + ux * 7.5, sy = p.y + uy * 7.5, hx = p.x - ux * 9, hy = p.y - uy * 9;
    const pose = st === 'finish' || st === 'complete' ? POSE_WIN : p.hook || st === 'ready' ? POSE_HANG : Math.abs(p.om) > 7.5 ? POSE_TUCK : POSE_FLY, g = GRAV * STEP * STEP;
    for (let i = 0; i < 8; i++) {
      const q = P[i], vx = (q.x - q.ox) * 0.985, vy = (q.y - q.oy) * 0.985, a = pose[i * 2], b = pose[i * 2 + 1];
      q.ox = q.x; q.oy = q.y;
      q.x += vx + (p.x - uy * a + ux * b - q.x) * 0.07;
      q.y += vy + g + (p.y + ux * a + uy * b - q.y) * 0.07;
    }
    const h = p.hook;
    for (let it = 0; it < 3; it++) {
      if (h) {
        const dx = h.x - sx, dy = h.y - sy, d = Math.hypot(dx, dy) || 1, k = Math.max(0, Math.min(ARM * 2 - 0.5, d - 3)) / d;
        P[3].x = sx + dx * k; P[3].y = sy + dy * k;
      }
      Link(sx, sy, P[0], ARM); Link2(P[0], P[1], ARM);
      Link(sx, sy, P[2], ARM); Link2(P[2], P[3], ARM, !!h);
      Link(hx, hy, P[4], LEG); Link2(P[4], P[5], LEG);
      Link(hx, hy, P[6], LEG); Link2(P[6], P[7], LEG);
    }
    for (const b of GS.lv.blocks) {
      if (b.x > p.x + 40 || b.x + b.w < p.x - 40 || b.y > p.y + 40 || b.y + b.h < p.y - 40) continue;
      for (const q of P) {
        if (q.x <= b.x || q.x >= b.x + b.w || q.y <= b.y || q.y >= b.y + b.h) continue;
        const l = q.x - b.x, rr = b.x + b.w - q.x, t = q.y - b.y, bt = b.y + b.h - q.y, m = Math.min(l, rr, t, bt);
        if (m === t) { q.y = b.y; q.ox = q.x - (q.x - q.ox) * 0.6; }
        else if (m === l) q.x = b.x;
        else if (m === rr) q.x = b.x + b.w;
        else q.y = b.y + b.h;
      }
    }
    const S = GS.sc, ax = p.x + ux * 16 - uy * 2, ay = p.y + uy * 16 + ux * 2;
    for (const q of S) {
      const vx = (q.x - q.ox) * 0.9, vy = (q.y - q.oy) * 0.9;
      q.ox = q.x; q.oy = q.y;
      q.x += vx; q.y += vy + g * 0.35;
    }
    for (let it = 0; it < 2; it++) {
      let px = ax, py = ay;
      for (const q of S) { Link(px, py, q, 4.6); px = q.x; py = q.y; }
    }
  }

  function Animate(lv, t) {
    for (const h of lv.hooks) {
      if (!h.sp) continue;
      const s = Math.sin(t * h.sp + h.ph), nx = h.bx + h.ax * s, ny = h.by + h.ay * s;
      h.vx = (nx - h.x) / STEP; h.vy = (ny - h.y) / STEP; h.x = nx; h.y = ny;
    }
    for (const s of lv.spins) {
      s.a = s.a0 + s.w * t;
      if (s.sp) { const m = Math.sin(t * s.sp); s.x = s.bx + s.ax * m; s.y = s.by + s.ay * m; }
    }
    const G = lv.goal;
    if (G.sp) { const m = Math.sin(t * G.sp); G.x = G.bx + G.ax * m; G.y = G.by + G.ay * m; }
  }

  function Goal(p, lv) {
    const G = lv.goal;
    if (G.t === 0) return p.x > lv.finish;
    if (G.t === 2) return GS.gHit;
    const dx = p.x - G.x, dy = p.y - G.y, r = G.t === 1 ? 36 : 28 + CORE_R;
    return dx * dx + dy * dy < r * r;
  }

  function Checks(p, lv) {
    for (const c of lv.checks) {
      if (c.on || Math.abs(p.x - c.x) > 34 || p.y > c.y + 12 || p.y < c.y - 260) continue;
      c.on = 1; c.t = 0; GS.cp = c;
      Burst(c.x + 14, c.y - 62, 18, '#4ade80', 220, 1);
      Pop(c.x, c.y - 96, _txt.check, '#22c55e');
    }
  }

  function Tick() {
    const p = GS.p, lv = GS.lv;
    GS.time += STEP;
    Animate(lv, GS.time);
    for (const c of lv.crum) {
      if (!c.st) continue;
      c.t += STEP;
      if (c.st === 1 && c.t > 0.5) { c.st = 2; c.t = 0; }
      else if (c.st === 2 && c.t > 2.8) { c.st = 0; c.t = 0; }
    }
    if (GS.status === 'ready') {
      if (!GS.hold) { Rag(); return; }
      GS.status = 'playing';
      IntroSeen();
    }
    if (GS.status === 'dead') return;
    if (GS.status === 'playing') {
      GS.ms += STEP * 1000;
      if (GS.hold && !p.hook) Grab();
      else if (!GS.hold && p.hook) Release();
    }
    for (const w of lv.winds) {
      if (p.x < w.x || p.x > w.x + w.w || p.y < w.y || p.y > w.y + w.h) continue;
      p.vx += w.dx * w.f * STEP; p.vy += w.dy * w.f * STEP;
    }
    for (const o of lv.boosts) {
      const dx = p.x - o.x, dy = p.y - o.y;
      if (dx * dx + dy * dy > 1156) continue;
      const al = p.vx * o.dx + p.vy * o.dy, v = Math.max(al, BOOST), qx = p.vx - o.dx * al, qy = p.vy - o.dy * al;
      p.vx = o.dx * v + qx * 0.3; p.vy = o.dy * v + qy * 0.3;
      if (o.fl < 0.5) { Burst(o.x, o.y, 14, '#facc15', 260, 1); GS.shake = Math.max(GS.shake, 0.25); }
      o.fl = 1;
    }
    const h = p.hook;
    if (h) {
      let a = Math.atan2(p.x - h.x, p.y - h.y), w = ((p.vx - h.vx) * Math.cos(a) - (p.vy - h.vy) * Math.sin(a)) / p.len;
      w = (w - GRAV / p.len * Math.sin(a) * STEP) * DRAG_K;
      if (Math.abs(w) * p.len < PUMP_MAX) w += Math.sign(w || 1) * PUMP / p.len * STEP;
      a += w * STEP;
      const s = Math.sin(a), c = Math.cos(a);
      p.x = h.x + s * p.len; p.y = h.y + c * p.len;
      p.vx = h.vx + c * w * p.len; p.vy = h.vy - s * w * p.len;
    } else {
      p.vy += GRAV * STEP;
      p.vx *= DRAG_K; p.vy *= DRAG_K;
      p.x += p.vx * STEP; p.y += p.vy * STEP;
    }
    p.ground = false;
    GS.gHit = false;
    Collide(p, lv);
    if (p.ground && !h) p.vx *= 0.97;
    if (GS.status === 'finish' || GS.status === 'complete') p.vx *= 0.993;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > MAX_V) { p.vx *= MAX_V / sp; p.vy *= MAX_V / sp; }
    Spin(p);
    if (GS.status === 'playing') {
      if (p.y > lv.ky) Die();
      else if (Goal(p, lv)) Finish();
      else Checks(p, lv);
    }
    Rag();
  }

  function Die() {
    GS.status = 'dead';
    GS.deadT = 0;
    GS.p.hook = null;
  }

  function Finish() {
    GS.status = 'finish';
    GS.finT = 0;
    GS.hold = false;
    GS.p.hook = null;
    GS.prog = 1;
    const G = GS.lv.goal;
    if (G.t) { Burst(G.x, G.y, 26, '#facc15', 320, 1); Burst(G.x, G.y, 14, ACCENT, 240, 0); }
    if (GS.custom) CustomDone();
    else {
      const n = GS.level, times = Times(), prev = times[n];
      GS.rec = !prev || GS.ms < prev;
      if (GS.rec) { times[n] = Math.round(GS.ms); StorageSet(LS_TIMES, times); }
      const next = Math.min(LEVELS, n + 1);
      if (next > Unlocked()) StorageSet(LS_LEVEL, next);
      if (next > LoadBest()) StorageSet(LS_BEST, next);
    }
    for (let i = 0; i < 140; i++) {
      const q = GS.conf[GS.ci = (GS.ci + 1) % GS.conf.length], left = i % 2 === 0;
      const a = -Math.PI / 2 + (left ? 0.35 : -0.35) + (Math.random() - 0.5) * 0.7, v = 520 + Math.random() * 480;
      q.on = 1; q.t = 0;
      q.x = left ? -10 : CV_W + 10; q.y = CV_H - 20;
      q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v;
      q.a = Math.random() * 6.28; q.va = (Math.random() - 0.5) * 16;
      q.w = 5 + Math.random() * 5; q.h = 3 + Math.random() * 3;
      q.c = CONF_COLORS[i % CONF_COLORS.length];
    }
  }

  function CustomDone() {
    const a = Customs(), r = a.find(x => x.id === GS.cid), h = Hash(GS.custom), ms = Math.round(GS.ms), prev = r && r.v === h ? r.bt : 0;
    GS.rec = !prev || ms < prev;
    GS.fresh = !r || r.v !== h;
    GS.best = GS.rec ? ms : prev;
    if (r) { r.v = h; r.bt = GS.best; SaveCustoms(a); }
    if (GS.test && ED) ED.v = h;
  }

  function Burst(x, y, n, c, sp, k) {
    for (let i = 0; i < n; i++) {
      const q = GS.parts[GS.pi = (GS.pi + 1) % GS.parts.length], a = Math.random() * 6.2832, v = sp * (0.35 + Math.random() * 0.8);
      q.on = 1; q.k = k; q.x = x; q.y = y; q.t = 0; q.c = c;
      q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v - sp * (k === 2 ? 0.05 : 0.3);
      q.life = k === 2 ? 0.45 + Math.random() * 0.3 : 0.35 + Math.random() * 0.35;
      q.s = k === 2 ? 5 + Math.random() * 4 : k === 1 ? 2.4 + Math.random() * 2 : 2.6 + Math.random() * 2.6;
      q.g = k === 2 ? 0.05 : k === 1 ? 0.35 : 1;
    }
  }

  function Pop(x, y, txt, c) {
    const q = GS.pops[GS.qi = (GS.qi + 1) % GS.pops.length];
    q.on = 1; q.x = x; q.y = y; q.t = 0; q.txt = txt; q.c = c;
  }

  function Camera(s, snap) {
    const p = GS.p, c = GS.cam, sp = Math.hypot(p.vx, p.vy);
    const tz = Math.max(0.8, Math.min(1, 1.12 - sp / 2200));
    const tx = p.x + 110 + Math.max(-80, Math.min(170, p.vx * 0.25));
    const ty = p.y * 0.5 + 125 + Math.max(-40, Math.min(90, p.vy * 0.12));
    const a = snap ? 1 : 1 - Math.exp(-s * 4.5), b = snap ? 1 : 1 - Math.exp(-s * 4), e = snap ? 1 : 1 - Math.exp(-s * 1.4);
    c.z += (tz - c.z) * e;
    c.x += (tx - c.x) * a;
    c.y += (ty - c.y) * b;
    c.y = Math.min(c.y, GS.lv.ky - 40 - CV_H / 2 / c.z);
    c.x = Math.max(c.x, GS.lv.sx - 230 + CV_W / 2 / c.z);
  }

  function Update(dt) {
    const s = dt / 1000, p = GS.p, lv = GS.lv;
    GS.acc += s;
    while (GS.acc >= STEP) { GS.acc -= STEP; Tick(); }
    if (GS.status === 'dead' && (GS.deadT += s) > 0.36) { if (GS.cp) Respawn(); else LoadLevel(GS.level, true); }
    if (GS.fade > 0) GS.fade = Math.max(0, GS.fade - s * 3.5);
    if (GS.status === 'finish' && (GS.finT += s) > 1.1) ShowDone();
    GS.target = !p.hook && (GS.status === 'ready' || GS.status === 'playing') ? FindHook() : null;
    if (GS.status === 'playing') GS.prog = Math.max(GS.prog, Math.min(1, (p.x - lv.sx) / ((lv.goal.t ? lv.goal.bx : lv.finish) - lv.sx)));
    Camera(s, false);
    GS.ropeT += s;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 560 && GS.status !== 'ready' && GS.status !== 'dead') {
      GS.trH = (GS.trH + 1) % TRAIL; GS.trX[GS.trH] = p.x; GS.trY[GS.trH] = p.y; GS.trN = Math.min(TRAIL, GS.trN + 1);
    } else if (GS.trN) GS.trN--;
    for (const q of GS.parts) {
      if (!q.on) continue;
      if ((q.t += s) > q.life) { q.on = 0; continue; }
      q.x += q.vx * s; q.y += q.vy * s; q.vy += 900 * q.g * s;
      if (q.k === 2) { q.vx *= 0.96; q.vy *= 0.96; }
    }
    for (const q of GS.pops) if (q.on && (q.t += s) > 0.9) q.on = 0;
    const fr = Math.exp(-1.6 * s);
    for (const q of GS.conf) {
      if (!q.on) continue;
      q.t += s; q.vy += 620 * s; q.vx *= fr; q.vy *= fr;
      q.x += (q.vx + Math.sin(q.t * 7 + q.a) * 40) * s; q.y += q.vy * s; q.a += q.va * s;
      if (q.y > CV_H + 30) q.on = 0;
    }
    for (const pd of lv.pads) if (pd.hit > 0) pd.hit = Math.max(0, pd.hit - s * 1.8);
    for (const w of lv.walls) if (w.hit > 0) w.hit = Math.max(0, w.hit - s * 2.5);
    for (const o of lv.boosts) if (o.fl > 0) o.fl = Math.max(0, o.fl - s * 2.2);
    for (const c of lv.checks) c.t += s;
    if (GS.status === 'playing') GS.introT += s;
    if (GS.tut) {
      const want = GS.status !== 'playing' || GS.grabs > 5 ? 0 : p.hook ? (GS.ropeT > 0.9 ? 2 : 0) : GS.target && !GS.hold && p.vy > -150 ? 1 : 0;
      if (want) GS.hint = want;
      GS.hintA = Math.max(0, Math.min(1, GS.hintA + (want ? s * 4 : -s * 5)));
    }
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - s * 3);
  }

  function Fmt(ms) { return ms == null ? '-' : `${(ms / 1000).toFixed(2)}s`; }

  function RR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
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
    return { c, g, w, h };
  }
  function Spr(w, h, fn) { const s = Cv(w, h, 3); s.g.translate(w / 2, h / 2); fn(s.g); return s; }
  function Circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function Ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function Poly(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  function Fl(g, c, lw = 1.5) { g.fillStyle = c; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); } }
  function Ln(g, x1, y1, x2, y2, c, lw) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = c; g.lineWidth = lw; g.stroke(); }
  function Glow(g, x, y, r, c, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, Rgba(c, a)); gr.addColorStop(0.45, Rgba(c, a * 0.45)); gr.addColorStop(1, Rgba(c, 0));
    g.fillStyle = gr; Circ(g, x, y, r); g.fill();
  }
  function Shadow(g, x, y, rx, ry, a = 0.24) { g.fillStyle = `rgba(20,16,34,${a})`; Ell(g, x, y, rx, ry); g.fill(); }
  function Gloss(g, r, a0 = 1.08, a1 = 1.48, lw = 1.6, c = 'rgba(255,255,255,0.75)') { g.beginPath(); g.arc(0, 0, r, Math.PI * a0, Math.PI * a1); g.strokeStyle = c; g.lineWidth = lw; g.stroke(); }
  function Put(ctx, s, x, y, k = 1) { ctx.drawImage(s.c, x - s.w * k / 2, y - s.h * k / 2, s.w * k, s.h * k); }

  let _ws = 1, _we = 0, _wf = 0;
  function World(ctx, s, e, f) { _ws = s; _we = e; _wf = f; ctx.setTransform(s, 0, 0, s, e, f); }
  function Rot(ctx, x, y, a) { const c = Math.cos(a) * _ws, n = Math.sin(a) * _ws; ctx.setTransform(c, n, -n, c, _we + _ws * x, _wf + _ws * y); }
  function Unrot(ctx) { ctx.setTransform(_ws, 0, 0, _ws, _we, _wf); }

  let SP = null, _dots = {}, _bars = {}, _bgc = null, _pat = null, _cpal = {};

  function MakeSprites() {
    SP = {};
    SP.ball = Spr(32, 32, g => {
      Shadow(g, 0.8, 2.6, 12, 11.5, 0.26);
      Circ(g, 0, 0, 12); Fl(g, '#be185d', 1.8);
      Circ(g, 0, -1, 10.4); g.fillStyle = ACCENT; g.fill();
      const gr = g.createRadialGradient(-4, -5, 0.5, 0, 0, 11);
      gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; Circ(g, 0, 0, 11); g.fill();
      Circ(g, 0, 0, 7.8); g.strokeStyle = 'rgba(255,255,255,0.82)'; g.lineWidth = 1.5; g.stroke();
      Gloss(g, 10, 1.12, 1.42, 1.7, 'rgba(255,255,255,0.9)');
    });
    SP.glow = Spr(68, 68, g => Glow(g, 0, 0, 34, ACCENT, 0.6));
    SP.tbase = Spr(44, 44, g => {
      Shadow(g, 1, 4, 17, 15, 0.26);
      Circ(g, 0, 0, 16); Fl(g, '#475569', 1.8);
      Circ(g, 0, -1, 13.6); g.fillStyle = '#64748b'; g.fill();
      Gloss(g, 12, 1.1, 1.6, 1.6, 'rgba(255,255,255,0.45)');
      g.fillStyle = '#cbd5e1';
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.5; Circ(g, Math.cos(a) * 11.6, Math.sin(a) * 11.6 - 0.5, 1.25); g.fill(); }
      Circ(g, 0, 0, 8.2); Fl(g, '#334155', 1.4);
    });
    SP.barrel = Spr(38, 22, g => {
      RR(g, -17, -6.5, 28, 13, 4); Fl(g, '#334155', 1.8);
      RR(g, -15, -5, 24, 3.4, 1.7); g.fillStyle = '#64748b'; g.fill();
      g.fillStyle = '#f59e0b'; g.fillRect(-6, -6.2, 3, 12.4); g.fillRect(-1, -6.2, 3, 12.4);
      RR(g, 9, -8.5, 8, 17, 2.5); Fl(g, '#1e293b', 1.8);
      Ln(g, 10.8, -6.2, 10.8, 5.5, 'rgba(255,255,255,0.35)', 1.3);
    });
    SP.tcap = Spr(14, 14, g => { Circ(g, 0, 0, 4); Fl(g, '#ef4444', 1.2); Circ(g, -1.2, -1.2, 1.3); g.fillStyle = '#fecaca'; g.fill(); });
    SP.shot = Spr(30, 30, g => {
      Glow(g, 0, 0, 15, '#f97316', 0.55);
      Circ(g, 0, 0, 6.2); Fl(g, '#ea580c', 1.4);
      Circ(g, -0.6, -0.6, 4.4); g.fillStyle = '#fb923c'; g.fill();
      Circ(g, -1.6, -1.8, 2); g.fillStyle = '#fef3c7'; g.fill();
    });
    SP.flash = Spr(44, 44, g => {
      Glow(g, 0, 0, 22, '#fbbf24', 0.9);
      Poly(g, [0, -13, 3, -3, 13, 0, 3, 3, 0, 13, -3, 3, -13, 0, -3, -3]); g.fillStyle = '#fff7d6'; g.fill();
    });
    SP.boost = Spr(84, 84, g => {
      Glow(g, 0, 0, 42, '#facc15', 0.22);
      Ell(g, 0, 0, 16, 31); g.lineWidth = 10; g.strokeStyle = OUT; g.stroke();
      Ell(g, 0, 0, 16, 31); g.lineWidth = 6.4; g.strokeStyle = '#f59e0b'; g.stroke();
      g.beginPath(); g.ellipse(0, 0, 16, 31, 0, Math.PI * 0.62, Math.PI * 1.38); g.strokeStyle = '#fde047'; g.lineWidth = 2.6; g.stroke();
      g.beginPath(); g.ellipse(0, 0, 16, 31, 0, -Math.PI * 0.3, Math.PI * 0.3); g.strokeStyle = '#b45309'; g.lineWidth = 2; g.stroke();
      for (const x of [-7, 5]) {
        g.beginPath(); g.moveTo(x - 5, -9); g.lineTo(x + 4, 0); g.lineTo(x - 5, 9);
        g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.4; g.strokeStyle = '#fff7ad'; g.stroke();
      }
    });
    SP.hoop = Spr(124, 124, g => {
      Glow(g, 0, 0, 62, '#facc15', 0.28);
      Circ(g, 0, 0, 45); g.lineWidth = 15; g.strokeStyle = OUT; g.stroke();
      for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(0, 0, 45, i * TAU / 20, (i + 1) * TAU / 20 + 0.02); g.lineWidth = 10.5; g.strokeStyle = i % 2 ? '#1c1a2b' : '#ffffff'; g.lineCap = 'butt'; g.stroke(); }
      g.lineCap = 'round';
      for (const r of [51, 39]) { Circ(g, 0, 0, r); g.lineWidth = 3; g.strokeStyle = '#f59e0b'; g.stroke(); }
      Gloss(g, 51, 1.1, 1.45, 1.8, '#fde68a');
      Gloss(g, 39, 0.15, 0.45, 1.6, 'rgba(255,255,255,0.6)');
    });
    SP.target = Spr(80, 80, g => {
      Shadow(g, 2, 5, 33, 31, 0.24);
      Circ(g, 0, 0, 34); Fl(g, '#94a3b8', 2);
      [31, 24.5, 18, 11.5, 5].forEach((r, i) => { Circ(g, 0, 0, r); g.fillStyle = ['#ef4444', '#ffffff', '#ef4444', '#ffffff', '#facc15'][i]; g.fill(); });
      Circ(g, 0, 0, 31); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
      Circ(g, 0, 0, 5); g.lineWidth = 1.2; g.stroke();
      Gloss(g, 27, 1.1, 1.5, 2.4, 'rgba(255,255,255,0.55)');
    });
    SP.plat = Spr(172, 36, g => {
      Shadow(g, 0, 15, 80, 5, 0.25);
      RR(g, -80, -11, 160, 22, 6); Fl(g, '#334155', 2);
      g.save(); RR(g, -80, -11, 160, 22, 6); g.clip();
      for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#1c1a2b' : '#ffffff'; g.fillRect(-80 + i * 10, -11 + j * 5, 10, 5); }
      g.fillStyle = '#f59e0b'; g.fillRect(-80, 6, 160, 3);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-80, -1, 160, 2);
      g.restore();
      RR(g, -80, -11, 160, 22, 6); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    });
    SP.fan = Spr(60, 34, g => {
      Shadow(g, 0, 13, 26, 4, 0.2);
      RR(g, -25, -5, 50, 16, 5); Fl(g, '#64748b', 1.8);
      RR(g, -22, -3, 44, 3, 1.5); g.fillStyle = '#94a3b8'; g.fill();
      RR(g, -22, -12, 44, 9, 3); Fl(g, '#cbd5e1', 1.5);
      for (let i = -18; i <= 18; i += 4.5) Ln(g, i, -10.5, i, -4.5, '#64748b', 1);
      Circ(g, 18, 5, 1.6); g.fillStyle = '#4ade80'; g.fill();
    });
    SP.tiles = [0, 1, 2].map(v => Spr(22, 22, g => {
      RR(g, -10, -10, 20, 20, 3); Fl(g, '#b9824d', 1.5);
      RR(g, -8.4, -8.6, 16.8, 4.4, 2); g.fillStyle = '#e2b47c'; g.fill();
      g.fillStyle = '#8f6136'; g.fillRect(-8.6, 5.2, 17.2, 3);
      const k = [[-4, -4, -1, 1, 2, 4], [3, -6, 1, -1, 4, 3], [-6, 0, -2, 2, -4, 6]][v];
      g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(k[2], k[3]); g.lineTo(k[4], k[5]); g.strokeStyle = '#6b4423'; g.lineWidth = 1.1; g.stroke();
      g.fillStyle = 'rgba(107,68,35,0.45)';
      for (const [x, y] of [[-5, 2], [5, -1], [1, 4]]) { Circ(g, x + v, y, 0.8); g.fill(); }
    }));
    SP.hub = Spr(18, 18, g => { Circ(g, 0, 0, 6.5); Fl(g, '#1e293b', 1.6); Circ(g, 0, 0, 2.6); g.fillStyle = '#facc15'; g.fill(); Gloss(g, 5, 1.1, 1.5, 1.2, 'rgba(255,255,255,0.5)'); });
    SP.puff = Spr(24, 24, g => { const gr = g.createRadialGradient(0, 0, 1, 0, 0, 12); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; Circ(g, 0, 0, 12); g.fill(); });
  }

  function FinSprite(txt, side) {
    const m = Cv(1, 1, 1).g;
    m.font = F_BADGE;
    const tw = Math.ceil(m.measureText(txt).width), w = tw + 42;
    return Spr(w + 18, 46, g => {
      g.fillStyle = 'rgba(20,16,34,0.22)'; RR(g, -w / 2 + 1, -10, w, 26, 13); g.fill();
      if (side) Poly(g, [w / 2 - 6, -9, w / 2 + 7, 0, w / 2 - 6, 9]);
      else Poly(g, [-7, 10, 0, 19, 7, 10]);
      Fl(g, ACCENT, 2);
      RR(g, -w / 2, -13, w, 26, 13); Fl(g, ACCENT, 2);
      g.fillStyle = 'rgba(255,255,255,0.22)'; RR(g, -w / 2 + 5, -10, w - 10, 6, 3); g.fill();
      const x0 = -w / 2 + 10;
      g.fillStyle = '#ffffff'; g.fillRect(x0, -6, 12, 12);
      g.fillStyle = OUT; g.fillRect(x0, -6, 6, 6); g.fillRect(x0 + 6, 0, 6, 6);
      g.lineWidth = 1.2; g.strokeStyle = OUT; g.strokeRect(x0, -6, 12, 12);
      g.font = F_BADGE; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
      g.fillText(txt, x0 + 18, 0.5);
    });
  }

  function Dot(c) {
    return _dots[c] || (_dots[c] = Spr(16, 16, g => {
      Glow(g, 0, 0, 8, c, 0.5);
      Circ(g, 0, 0, 3.8); g.fillStyle = c; g.fill();
      Circ(g, -1.1, -1.1, 1.5); g.fillStyle = 'rgba(255,255,255,0.65)'; g.fill();
    }));
  }

  function Bar(len) {
    return _bars[len] || (_bars[len] = Spr(len + 30, 36, g => {
      const h = len / 2, n = Math.max(2, Math.round(len / 15)), s = len / n;
      for (const sd of [-1, 1]) for (let i = 0; i < n; i++) {
        const x = -h + (i + 0.5) * s;
        Poly(g, [x - 5, sd * 4, x, sd * 14, x + 5, sd * 4]); Fl(g, '#cbd5e1', 1.3);
        Poly(g, [x - 4, sd * 4.5, x, sd * 13, x, sd * 4.5]); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
      }
      RR(g, -h - 6, -6.5, len + 12, 13, 6.5); Fl(g, '#475569', 1.8);
      g.save(); RR(g, -h - 6, -6.5, len + 12, 13, 6.5); g.clip();
      g.fillStyle = '#e11d48';
      for (let x = -h - 10; x < h + 10; x += 16) { Poly(g, [x, 7, x + 7, 7, x + 13, -7, x + 6, -7]); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(-h - 6, -5.5, len + 12, 3);
      g.restore();
    }));
  }

  function Pattern(ctx) {
    const P = {};
    for (const dk of [0, 1]) {
      const t = Cv(48, 48, 2), g = t.g;
      g.strokeStyle = dk ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.06)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, 1); g.lineTo(48, 1); g.moveTo(0, 25); g.lineTo(48, 25); g.moveTo(1, 1); g.lineTo(1, 25); g.moveTo(25, 25); g.lineTo(25, 49); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.14)';
      g.beginPath(); g.moveTo(0, 23.5); g.lineTo(48, 23.5); g.moveTo(0, 47.5); g.lineTo(48, 47.5); g.moveTo(47.5, 1); g.lineTo(47.5, 23.5); g.moveTo(23.5, 25); g.lineTo(23.5, 48); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.1)';
      for (const [x, y] of [[9, 10], [33, 15], [14, 36], [40, 40], [28, 6]]) { Circ(g, x, y, 1.2); g.fill(); }
      const p = ctx.createPattern(t.c, 'repeat');
      p.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
      P[dk] = p;
    }
    return P;
  }

  const TW = 960;
  function HillY(x, base, f) { const k = TAU / TW; return base - f[0] * Math.sin(x * k * 2 + f[1]) - f[2] * Math.sin(x * k * 3 + f[3]) - f[4] * Math.sin(x * k * 7 + f[5]); }
  function HillFill(g, H, base, f, col, rim) {
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= TW; x += 6) g.lineTo(x, HillY(x, base, f));
    g.lineTo(TW, H); g.closePath(); g.fillStyle = col; g.fill();
    g.beginPath();
    for (let x = 0; x <= TW; x += 6) { const y = HillY(x, base, f) + 1.5; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.strokeStyle = rim; g.lineWidth = 3; g.stroke();
  }
  function Tree(g, x, y, s, col, dark) {
    const tr = dark ? '#2a2440' : Dk(col, 0.45);
    g.fillStyle = tr; g.fillRect(x - 1.6 * s, y - 12 * s, 3.2 * s, 13 * s);
    Circ(g, x, y - 17 * s, 9 * s); g.fillStyle = Dk(col, 0.16); g.fill();
    Circ(g, x - 1.5 * s, y - 18.5 * s, 7 * s); g.fillStyle = col; g.fill();
    Circ(g, x - 3.5 * s, y - 21 * s, 2.6 * s); g.fillStyle = Lt(col, dark ? 0.08 : 0.3); g.fill();
  }
  function House(g, x, y, wall, roof, win) {
    g.fillStyle = wall; g.fillRect(x - 13, y - 18, 26, 19);
    Poly(g, [x - 16, y - 17, x, y - 30, x + 16, y - 17]); g.fillStyle = roof; g.fill();
    g.fillStyle = win; g.fillRect(x - 8, y - 13, 5, 5); g.fillRect(x + 3, y - 13, 5, 5);
    g.fillStyle = roof; g.fillRect(x - 2.5, y - 8, 5, 9);
  }

  function Lay(ctx, L, sx, top) {
    const o = -(((sx % TW) + TW) % TW);
    ctx.drawImage(L.c, o, top, TW, L.h);
    ctx.drawImage(L.c, o + TW, top, TW, L.h);
    if (top + L.h < CV_H) { ctx.fillStyle = L.bot; ctx.fillRect(0, top + L.h - 1, CV_W, CV_H - top - L.h + 1); }
  }

  const THEMES = [
    ...PALS.map((p, i) => ({ id: i, key: `hk_th_${i}`, sky: [p[0], p[1]], skyD: [NIGHT[0], NIGHT[1]], hill: [Mix(p[2], p[0], 0.5), p[2], p[3]], hillD: ['#141d3a', NIGHT[2], NIGHT[3]], blk: null, blkD: null, deco: 'trees', sun: '#fff3c4' })),
    { id: 5, key: 'hk_th_neon', sky: ['#f9c6ef', '#c7b8ff'], skyD: ['#080318', '#2a0b4a'], hill: ['#c3a6f2', '#9a7fe0', '#7d62cc'], hillD: ['#1e0b3a', '#2a0f4f', '#170833'], rim: '#ff7ad9', rimD: '#22d3ee',
      blk: ['#2e2257', '#4b3a8a', '#f472b6', '#1f173d', '#140c2b'], blkD: ['#160b30', '#2a1657', '#22d3ee', '#0e0720', '#d946ef'], deco: 'city', sun: 'synth' },
    { id: 6, key: 'hk_th_sunset', sky: ['#ff9a76', '#ffe2a8'], skyD: ['#1b1033', '#4a2042'], hill: ['#ec8a7e', '#c25b72', '#8f3f63'], hillD: ['#3a1d3f', '#2c1534', '#1f0f27'], rim: '#ffc39a', rimD: 'rgba(255,170,140,0.18)',
      blk: ['#5b2a4a', '#87405f', '#ffb38a', '#3e1c33', '#2a1022'], blkD: ['#3a1b33', '#5c2a48', '#e88a6a', '#271222', '#12060f'], deco: 'palms', sun: 'big' },
    { id: 7, key: 'hk_th_candy', sky: ['#ffd6ec', '#fff3fa'], skyD: ['#1d1030', '#3a1f4a'], hill: ['#ffc8e4', '#b8f0d8', '#ffb3d1'], hillD: ['#2c1a40', '#24423f', '#45213f'], rim: '#ffffff', rimD: 'rgba(255,200,230,0.2)',
      blk: ['#e86aa6', '#ff9fcb', '#fff0f7', '#c24f86', '#7a2450'], blkD: ['#9b3a6e', '#c8558f', '#ffd1e8', '#6e2550', '#2a0c1e'], deco: 'candy', sun: '#fff0b8' },
    { id: 8, key: 'hk_th_space', sky: ['#b9c3f2', '#e6e9fb'], skyD: ['#03040d', '#141936'], hill: ['#a3a9cf', '#9097bd', '#7a80a6'], hillD: ['#1a1e38', '#262b4a', '#323858'], rim: '#dfe3fb', rimD: 'rgba(165,180,252,0.2)',
      blk: ['#4b5170', '#6c7396', '#a5b4fc', '#353a55', '#1d2035'], blkD: ['#2e3352', '#454c74', '#818cf8', '#1e2238', '#0a0c1a'], deco: 'space', sun: 'planet' },
    { id: 9, key: 'hk_th_school', sky: ['#bfe6ff', '#f2fbff'], skyD: ['#0b1226', '#1f2b4f'], hill: ['#c9d8b8', '#9fc58c', '#7fb069'], hillD: ['#18243f', '#1d3a35', '#183026'], rim: '#d6f0c4', rimD: 'rgba(160,220,170,0.15)',
      blk: ['#8c4a3a', '#b4654f', '#e8a58c', '#6a372b', '#3a1d16'], blkD: ['#5a3029', '#7a4236', '#c27c66', '#3e211c', '#1c0d0a'], deco: 'school', sun: '#fff3c4' },
  ];

  function Palm(g, x, y, s, c) {
    g.strokeStyle = c; g.lineWidth = 3.4 * s;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6 * s, y - 20 * s, x + 2 * s, y - 40 * s); g.stroke();
    g.fillStyle = c;
    for (const a of [-2.7, -2.1, -1.2, -0.5, 0.1]) {
      const tx = x + 2 * s, ty = y - 40 * s, ex = tx + Math.cos(a) * 22 * s, ey = ty + Math.sin(a) * 12 * s + 6 * s;
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo((tx + ex) / 2, ty - 9 * s, ex, ey); g.quadraticCurveTo((tx + ex) / 2, ty - 2 * s, tx, ty); g.fill();
    }
  }
  function Lolly(g, x, y, s, c1, c2) {
    Ln(g, x, y, x, y - 34 * s, '#ffffff', 2.6 * s);
    Circ(g, x, y - 42 * s, 11 * s); g.fillStyle = c1; g.fill();
    g.strokeStyle = c2; g.lineWidth = 2.6 * s; g.beginPath();
    for (let i = 0; i < 26; i++) { const a = i * 0.55, r = i * 0.38 * s; if (i) g.lineTo(x + Math.cos(a) * r, y - 42 * s + Math.sin(a) * r); else g.moveTo(x, y - 42 * s); }
    g.stroke();
    Circ(g, x - 4 * s, y - 46 * s, 2.4 * s); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
  }
  function Cane(g, x, y, s) {
    g.lineWidth = 4.4 * s; g.strokeStyle = '#ffffff';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 30 * s); g.arc(x + 7 * s, y - 30 * s, 7 * s, Math.PI, 0); g.stroke();
    g.strokeStyle = '#ef4444'; g.lineWidth = 4.4 * s; g.setLineDash([3 * s, 4 * s]); g.stroke(); g.setLineDash([]);
  }
  function School(g, x, y, dark) {
    const wall = dark ? '#3a3f5c' : '#c9785c', trim = dark ? '#262a40' : '#8c4a3a', win = dark ? '#fcd34d' : '#d8efff';
    g.fillStyle = trim; g.fillRect(x - 6, y - 128, 12, 50);
    Poly(g, [x - 16, y - 126, x, y - 150, x + 16, y - 126]); g.fill();
    g.fillStyle = wall; g.fillRect(x - 130, y - 82, 260, 84); g.fillRect(x - 26, y - 118, 52, 40);
    Poly(g, [x - 140, y - 80, x - 120, y - 98, x + 120, y - 98, x + 140, y - 80]); g.fillStyle = trim; g.fill();
    Poly(g, [x - 32, y - 116, x, y - 136, x + 32, y - 116]); g.fill();
    Circ(g, x, y - 101, 9); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 2; g.strokeStyle = trim; g.stroke();
    Ln(g, x, y - 101, x, y - 107, trim, 1.6); Ln(g, x, y - 101, x + 4.5, y - 101, trim, 1.6);
    g.fillStyle = win;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) if (c !== 3 && c !== 4) g.fillRect(x - 118 + c * 30, y - 70 + r * 30, 16, 16);
    g.fillStyle = trim; g.fillRect(x - 14, y - 32, 28, 34);
    Ln(g, x + 150, y, x + 150, y - 100, dark ? '#64748b' : '#94a3b8', 2.4);
    Poly(g, [x + 151, y - 99, x + 175, y - 92, x + 151, y - 85]); g.fillStyle = ACCENT; g.fill();
  }

  function BgBuild(th, dark) {
    const k = Math.min(2, _k);
    if (_bgc && _bgc.th === th && _bgc.dark === dark && _bgc.k === k) return _bgc;
    const H = dark ? th.hillD : th.hill, rim = (dark ? th.rimD : th.rim) || (dark ? 'rgba(148,163,255,0.12)' : Lt(H[1], 0.35)), d = th.deco;
    const B = { th, dark, k, far: Cv(TW, 300, k), mid: Cv(TW, 260, k), near: Cv(TW, 230, k), cloud: [], stars: null };
    let g = B.far.g;
    if (d === 'city') {
      const r = Rng(31);
      for (let x = 0; x < TW; x += 34 + (r() * 30 | 0)) {
        const w = 26 + r() * 30, h = 70 + r() * 130;
        g.fillStyle = H[0]; g.fillRect(x, 300 - h * 0.8, w, h * 0.8);
        if (r() < 0.4) Ln(g, x + w / 2, 300 - h, x + w / 2, 300 - h - 18, H[0], 2);
        g.fillStyle = dark ? (r() < 0.5 ? 'rgba(34,211,238,0.55)' : 'rgba(244,114,182,0.55)') : 'rgba(255,255,255,0.45)';
        for (let yy = 300 - h + 8; yy < 290; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 9) if (r() < 0.45) g.fillRect(xx, yy, 4, 5);
      }
    } else {
      for (const [cx, h, hw] of [[90, 120, 170], [300, 165, 210], [520, 110, 160], [720, 150, 200], [900, 125, 170]]) {
        for (const o of [-TW, 0, TW]) {
          const x = cx + o, top = 300 - 70 - h, sharp = d === 'space' ? 0.06 : 0.14;
          g.beginPath(); g.moveTo(x - hw, 300); g.lineTo(x - hw * sharp, top + 10); g.quadraticCurveTo(x, top - 4, x + hw * sharp, top + 10); g.lineTo(x + hw, 300); g.closePath();
          g.fillStyle = H[0]; g.fill();
          g.beginPath(); g.moveTo(x - hw, 300); g.lineTo(x - hw * sharp, top + 10); g.quadraticCurveTo(x - hw * 0.05, top + 2, x, top + 3); g.lineTo(x - hw * 0.3, 300); g.closePath();
          g.fillStyle = dark ? 'rgba(148,163,255,0.05)' : 'rgba(255,255,255,0.22)'; g.fill();
          if (d !== 'space' && d !== 'palms') {
            g.beginPath(); g.moveTo(x - hw * sharp, top + 10); g.quadraticCurveTo(x, top - 4, x + hw * sharp, top + 10); g.lineTo(x + hw * 0.08, top + 18); g.lineTo(x, top + 13); g.lineTo(x - hw * 0.07, top + 19); g.closePath();
            g.fillStyle = dark ? 'rgba(226,232,240,0.12)' : d === 'candy' ? '#ffffff' : 'rgba(255,255,255,0.8)'; g.fill();
          }
        }
      }
    }
    g.fillStyle = H[0]; g.fillRect(0, 290, TW, 10);
    B.far.bot = H[0];
    g = B.mid.g;
    const mf = [22, 0.6, 14, 2.1, 5, 0.3], MY = x => HillY(x, 120, mf) + 6;
    if (d === 'city') {
      const r = Rng(53);
      for (let x = 10; x < TW - 40; x += 48 + (r() * 40 | 0)) {
        const w = 30 + r() * 24, h = 36 + r() * 60, y = MY(x + w / 2) + 10;
        g.fillStyle = dark ? Dk(H[1], 0.18) : Mix(H[1], th.sky[1], 0.35); g.fillRect(x, y - h, w, h);
        g.fillStyle = dark ? '#ff4fd8' : '#ffffff'; g.fillRect(x, y - h, w, 2.5);
        g.fillStyle = dark ? 'rgba(34,211,238,0.8)' : 'rgba(255,255,255,0.6)';
        for (let yy = y - h + 9; yy < y - 6; yy += 13) for (let xx = x + 6; xx < x + w - 6; xx += 10) if (r() < 0.55) g.fillRect(xx, yy, 5, 6);
      }
    }
    if (d === 'school') School(g, 470, MY(470) + 8, dark);
    HillFill(g, 260, 120, mf, H[1], rim);
    if (d === 'trees') {
      for (const [x, s] of [[60, 1], [84, 0.8], [210, 1.1], [330, 0.9], [560, 1], [585, 0.75], [690, 1.2], [905, 0.9]]) Tree(g, x, MY(x), s, dark ? '#253259' : Dk(H[2], 0.08), dark);
      for (const x of [440, 790]) House(g, x, MY(x), dark ? '#2a3561' : '#fffaf3', dark ? '#1a2244' : Dk(H[1], 0.35), dark ? '#fcd34d' : '#bfe3f7');
    } else if (d === 'palms') {
      for (const [x, s] of [[80, 1], [250, 1.2], [480, 0.9], [700, 1.1], [860, 0.8]]) Palm(g, x, MY(x), s, Dk(H[1], 0.35));
    } else if (d === 'candy') {
      for (const [x, s, c] of [[90, 1, '#f472b6'], [270, 0.8, '#a78bfa'], [520, 1.1, '#fb923c'], [740, 0.9, '#34d399']]) Lolly(g, x, MY(x), s, dark ? Dk(c, 0.35) : c, dark ? 'rgba(255,255,255,0.35)' : '#ffffff');
      for (const x of [170, 620, 880]) Cane(g, x, MY(x), 1);
    } else if (d === 'space') {
      for (const [x, r] of [[120, 16], [380, 22], [610, 12], [820, 18]]) { Ell(g, x, MY(x) + 6, r, r * 0.32); g.fillStyle = Dk(H[1], 0.18); g.fill(); Ell(g, x, MY(x) + 4.5, r * 0.8, r * 0.22); g.fillStyle = Dk(H[1], 0.3); g.fill(); }
    } else if (d === 'school') {
      for (const [x, s] of [[90, 1], [200, 0.9], [760, 1.1], [880, 0.85]]) Tree(g, x, MY(x), s, dark ? '#24452f' : Dk(H[2], 0.1), dark);
    }
    B.mid.bot = H[1];
    g = B.near.g;
    const nf = [16, 2.4, 10, 0.7, 4, 1.9], NY = x => HillY(x, 90, nf) + 7;
    HillFill(g, 230, 90, nf, H[2], rim);
    for (let x = 14; x < TW; x += 38) {
      const y = NY(x), j = (x * 7) % 5;
      if (d === 'space') { if (j < 2) { Ell(g, x, y + 2, 5 + j * 3, 3 + j); g.fillStyle = Dk(H[2], 0.2); g.fill(); } continue; }
      if (d === 'candy') { if (j < 3) { g.beginPath(); g.ellipse(x, y + 3, 6, 7, 0, Math.PI, 0); g.fillStyle = ['#f472b6', '#facc15', '#60a5fa'][j]; g.globalAlpha = dark ? 0.45 : 1; g.fill(); g.globalAlpha = 1; } continue; }
      if (d === 'school') { g.fillStyle = dark ? '#3c4566' : '#ffffff'; g.fillRect(x - 1.5, y - 16, 3, 18); if (x + 38 < TW) { g.fillRect(x, y - 13, 38, 2.2); g.fillRect(x, y - 6, 38, 2.2); } continue; }
      g.strokeStyle = d === 'city' ? (dark ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.5)') : dark ? 'rgba(148,163,255,0.14)' : Dk(H[2], 0.12); g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4, y - 5); g.moveTo(x, y); g.lineTo(x, y - 7); g.moveTo(x + 3, y); g.lineTo(x + 4.5, y - 4.5); g.stroke();
      if (!dark && j < 2 && d === 'trees') { Circ(g, x + 9, y - 2, 2); g.fillStyle = j ? '#ffffff' : '#f9a8d4'; g.fill(); }
    }
    if (d === 'trees' || d === 'school') for (const [x, s] of [[150, 1.4], [480, 1.6], [760, 1.3]]) Tree(g, x, NY(x) + 1, s, dark ? '#2a3866' : Dk(H[2], 0.18), dark);
    if (d === 'palms') for (const [x, s] of [[330, 1.5], [800, 1.3]]) Palm(g, x, NY(x) + 2, s, Dk(H[2], 0.4));
    if (d === 'candy') Lolly(g, 360, NY(360) + 2, 1.3, dark ? '#8e3e6a' : '#38bdf8', '#ffffff');
    B.near.bot = H[2];
    const tint = d === 'candy' ? 'rgba(255,190,220,0.75)' : d === 'palms' ? 'rgba(255,190,150,0.7)' : d === 'city' ? 'rgba(200,170,255,0.7)' : dark ? 'rgba(148,163,255,0.5)' : 'rgba(190,214,236,0.75)';
    for (let i = 0; i < 3; i++) {
      const c = Cv(170, 80, k), cg = c.g, P = [[52, 48, 24], [84, 38, 30], [118, 48, 22], [70, 54, 20], [104, 55, 20]].slice(0, 3 + i);
      for (const [x, y, r] of P) { Circ(cg, x, y + 5, r); cg.fillStyle = tint; cg.fill(); }
      for (const [x, y, r] of P) { Circ(cg, x, y, r); cg.fillStyle = '#ffffff'; cg.fill(); }
      for (const [x, y, r] of P) { cg.beginPath(); cg.arc(x, y, r - 4, Math.PI * 1.15, Math.PI * 1.5); cg.strokeStyle = 'rgba(255,255,255,0.9)'; cg.lineWidth = 2; cg.stroke(); }
      B.cloud.push(c);
    }
    if (dark || d === 'space' || d === 'city') {
      B.stars = Cv(760, 320, k);
      const r = Rng(77), sg = B.stars.g, a = dark ? 1 : 0.55;
      for (let i = 0; i < 110; i++) { Circ(sg, r() * 760, r() * 320, 0.5 + r() * 1.1); sg.fillStyle = dark ? `rgba(226,232,255,${(0.25 + r() * 0.6) * a})` : `rgba(255,255,255,${(0.35 + r() * 0.5) * a})`; sg.fill(); }
    }
    _bgc = B;
    return B;
  }

  const CROWN = [-6, 6, -3, 2.5, 0, 7, 3, 2.5, 6, 6, 6, -2];
  const MOON = [-7, -5, 5, 8, 4, 4, -2, 10, 3, 9, -9, 2.4];
  function Disc(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  function Backdrop(ctx, dark, th, cx, cy) {
    Sky(ctx, dark, th);
    const B = BgBuild(th, dark), t = GS.time, dy = 300 - cy, sun = th.sun;
    if (B.stars) {
      const o = -(((cx * 0.02) % 760) + 760) % 760;
      ctx.drawImage(B.stars.c, o, -10, 760, 320); ctx.drawImage(B.stars.c, o + 760, -10, 760, 320);
      ctx.fillStyle = dark ? '#e2e8ff' : '#ffffff';
      for (let i = 0; i < 9; i++) {
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2.2 + i * 1.7);
        const x = ((i * 97 + 40) - cx * 0.02) % 760, y = 30 + (i * 53) % 170;
        ctx.fillRect((x + 760) % 760, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (sun === 'synth') {
      const x = 590, y = 150 + dy * 0.03, gr = ctx.createLinearGradient(0, y - 70, 0, y + 70);
      gr.addColorStop(0, '#ffe36e'); gr.addColorStop(1, '#ff4fd8');
      Disc(ctx, x, y, 96, dark ? 'rgba(255,79,216,0.12)' : 'rgba(255,255,255,0.25)');
      Disc(ctx, x, y, 70, gr);
      ctx.fillStyle = dark ? th.skyD[1] : th.sky[1];
      for (let i = 0; i < 6; i++) ctx.fillRect(x - 72, y + 6 + i * 11, 144, 2 + i * 1.1);
    } else if (sun === 'planet') {
      const x = 600, y = 92 + dy * 0.02;
      Disc(ctx, x, y, 70, dark ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.35)');
      Disc(ctx, x, y, 40, dark ? '#8b7cf6' : '#a78bfa');
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - 6, y - 10, 30, 9, -0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(30,20,80,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 14, 30, 7, -0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = dark ? '#fbbf24' : '#f59e0b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y, 66, 15, -0.32, -0.1, Math.PI + 0.1); ctx.stroke();
      Disc(ctx, 150, 60 + dy * 0.015, 11, dark ? '#cbd5e1' : '#ffffff');
    } else if (dark) {
      const mx = 610, my = 74 + dy * 0.02;
      Disc(ctx, mx, my, 54, 'rgba(226,232,255,0.07)'); Disc(ctx, mx, my, 38, 'rgba(226,232,255,0.1)'); Disc(ctx, mx, my, 24, '#e8ecf8');
      for (let i = 0; i < MOON.length; i += 3) Disc(ctx, mx + MOON[i], my + MOON[i + 1], MOON[i + 2], 'rgba(148,163,184,0.35)');
    } else if (sun === 'big') {
      const sx = 560, sy = 210 + dy * 0.04;
      Disc(ctx, sx, sy, 120 + Math.sin(t * 1.2) * 4, 'rgba(255,240,190,0.22)'); Disc(ctx, sx, sy, 84, 'rgba(255,236,170,0.35)'); Disc(ctx, sx, sy, 58, '#ffe39a');
    } else {
      const sx = 615, sy = 78 + dy * 0.02;
      Disc(ctx, sx, sy, 62 + Math.sin(t * 1.5) * 3, 'rgba(255,247,214,0.28)'); Disc(ctx, sx, sy, 42, 'rgba(255,247,214,0.4)'); Disc(ctx, sx, sy, 28, sun);
    }
    if (th.deco !== 'space') {
      const csx = cx * 0.05, ci0 = Math.floor(csx / 340);
      ctx.globalAlpha = dark ? 0.07 : th.deco === 'city' ? 0.5 : 1;
      for (let i = ci0 - 1; i < ci0 + 4; i++) {
        const x = i * 340 - csx + ((i * 53) % 5 + 5) % 5 * 24 - 85, y = 30 + ((i * 29) % 4 + 4) % 4 * 26 + dy * 0.05;
        ctx.drawImage(B.cloud[((i % 3) + 3) % 3].c, x, y, 170, 80);
      }
      ctx.globalAlpha = 1;
    }
    Lay(ctx, B.far, cx * 0.05, 120 + dy * 0.05);
    Lay(ctx, B.mid, cx * 0.12, 250 + dy * 0.1);
    Lay(ctx, B.near, cx * 0.26, 330 + dy * 0.2);
  }

  function Sky(ctx, dark, th) {
    if (!GS.bg || GS.bgk !== th || GS.dark !== dark) {
      GS.dark = dark;
      GS.bgk = th;
      const s = dark ? th.skyD : th.sky;
      GS.bg = ctx.createLinearGradient(0, 0, 0, CV_H);
      GS.bg.addColorStop(0, s[0]); GS.bg.addColorStop(1, s[1]);
    }
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    ctx.fillStyle = GS.bg; ctx.fillRect(0, 0, CV_W, CV_H);
  }

  function Pal(dark) {
    const th = GS.lv.th, C = dark ? DARK : LIGHT, b = dark ? th.blkD : th.blk;
    if (!b) return C;
    const k = th.id + (dark ? 'd' : 'l');
    return _cpal[k] || (_cpal[k] = { ...C, block: b[0], blockTop: b[1], blockLip: b[2], blockBot: b[3], blockOut: b[4] });
  }

  function Vis(x0, x1, vl, vr) { return x1 > vl && x0 < vr; }

  function DrawWinds(ctx, C, lv, vl, vr, t) {
    for (const w of lv.winds) {
      if (!Vis(w.x, w.x + w.w, vl, vr)) continue;
      ctx.fillStyle = C.wind; RR(ctx, w.x, w.y, w.w, w.h, 10); ctx.fill();
      ctx.strokeStyle = C.windEdge; ctx.lineWidth = 1.6; ctx.setLineDash([7, 6]); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); RR(ctx, w.x, w.y, w.w, w.h, 10); ctx.clip();
      const n = Math.min(26, 4 + (w.w * w.h / 5000 | 0)), L = Math.abs(w.dx) * w.w + Math.abs(w.dy) * w.h;
      ctx.strokeStyle = C.windLine; ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const u = (t * (0.5 + (i * 0.37) % 0.4) * w.f / 1200 + i * 0.618) % 1, a = (i * 0.381 + 0.13) % 1;
        const x = w.x + (((a * w.w + w.dx * u * L) % w.w) + w.w) % w.w, y = w.y + ((((i * 0.713) % 1) * w.h + w.dy * u * L) % w.h + w.h) % w.h;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w.dx * 22, y - w.dy * 22); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      const fx = w.x + w.w / 2 - w.dx * w.w / 2, fy = w.y + w.h / 2 - w.dy * w.h / 2;
      Rot(ctx, fx, fy, w.a + Math.PI / 2);
      Put(ctx, SP.fan, 0, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const x = Math.sin(t * 16 + i * Math.PI / 2) * 18; ctx.moveTo(x, -9.5); ctx.lineTo(x, -2.5); }
      ctx.stroke();
      Unrot(ctx);
    }
  }

  function DrawLine(ctx, C, lv, vl, vr, vt) {
    const f = lv.finish, fy = lv.fy;
    if (f + 200 < vl || f - 20 > vr) return;
    const sz = 14, top = Math.floor(Math.max(vt, -1400) / sz) * sz;
    ctx.fillStyle = C.chkA; ctx.fillRect(f - sz, top, sz * 2, fy - top);
    ctx.fillStyle = C.chkB;
    for (let y = top; y < fy; y += sz) ctx.fillRect(f - sz + ((y / sz) & 1) * sz, y, sz, sz);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(f - sz, top); ctx.lineTo(f - sz, fy); ctx.moveTo(f + sz, top); ctx.lineTo(f + sz, fy); ctx.stroke();
    Sign(ctx, C, lv, f + 150, fy - 60, true);
  }

  function Sign(ctx, C, lv, x, y, post) {
    const g = lv.g, col = GradeColor(g.Pct);
    if (post) {
      ctx.fillStyle = OUT; ctx.fillRect(x - 4.5, y, 9, 60);
      ctx.fillStyle = C.post; ctx.fillRect(x - 2.5, y, 5, 60);
    }
    ctx.fillStyle = 'rgba(20,16,34,0.22)'; RR(ctx, x - 44, y - 34, 92, 42, 10); ctx.fill();
    ctx.fillStyle = C.sign; RR(ctx, x - 46, y - 38, 92, 42, 10); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col; ctx.font = F_SIGN; ctx.fillText(g.label, x, y - 22);
    ctx.fillStyle = C.hudSub; ctx.font = F_SMALL; ctx.fillText(g.subject.slice(0, 14), x, y - 6);
  }

  function Flag(ctx, x, y, h, col, t, chk) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 1, y - h + 2);
    for (let i = 1; i <= 4; i++) ctx.lineTo(x + 1 + i * 7.5, y - h + 2 + Math.sin(t * 7 - i) * 1.6 * i / 2);
    for (let i = 4; i >= 0; i--) ctx.lineTo(x + 1 + i * 7.5, y - h + 22 + Math.sin(t * 7 - i) * 1.6 * i / 2);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
    if (chk) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 9, y - h + 12); ctx.lineTo(x + 13, y - h + 16 + Math.sin(t * 7 - 2) * 0.8); ctx.lineTo(x + 21, y - h + 7 + Math.sin(t * 7 - 3) * 1.2); ctx.stroke(); }
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y - h - 2, 3, 0, TAU); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
  }

  function DrawGoal(ctx, C, lv, vl, vr, t) {
    const G = lv.goal;
    if (!G.t || !Vis(G.x - 90, G.x + 90, vl, vr)) return;
    const pulse = 1 + Math.sin(t * 4) * 0.03;
    if (G.t === 1) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3); Put(ctx, SP.glow, G.x, G.y, 2.2); ctx.globalAlpha = 1;
      Put(ctx, SP.hoop, G.x, G.y, pulse);
      Put(ctx, SP.fin, G.x, G.y - 72 + Math.sin(t * 3) * 2);
    } else if (G.t === 2) {
      Put(ctx, SP.plat, G.x, G.y + 11);
      Flag(ctx, G.x + 62, G.y, 64, ACCENT, t, false);
      Put(ctx, SP.fin, G.x - 10, G.y - 30 + Math.sin(t * 3) * 2);
    } else {
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5); Put(ctx, SP.glow, G.x, G.y, 1.6); ctx.globalAlpha = 1;
      Put(ctx, SP.target, G.x, G.y, pulse);
      Put(ctx, SP.fin, G.x, G.y - 56 + Math.sin(t * 3) * 2);
    }
  }

  function DrawBlocks(ctx, C, lv, vl, vr, vt, vb) {
    if (!_pat) _pat = Pattern(ctx);
    ctx.beginPath();
    let n = 0;
    for (const b of lv.blocks) if (Vis(b.x, b.x + b.w, vl, vr) && b.y < vb && b.y + b.h > vt) { ctx.roundRect(b.x, b.y, b.w, b.h, 9); n++; }
    if (!n) return;
    ctx.fillStyle = C.block; ctx.fill();
    ctx.fillStyle = _pat[GS.dark ? 1 : 0]; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.blockOut; ctx.stroke();
    ctx.beginPath();
    for (const b of lv.blocks) if (Vis(b.x, b.x + b.w, vl, vr) && b.y + b.h < vb + 20 && b.y + b.h > vt && b.h > 24) ctx.roundRect(b.x + 3, b.y + b.h - 9, b.w - 6, 6, [2, 2, 6, 6]);
    ctx.fillStyle = C.blockBot; ctx.fill();
    ctx.beginPath();
    for (const b of lv.blocks) if (Vis(b.x, b.x + b.w, vl, vr) && b.y > vt - 20 && b.y < vb) ctx.roundRect(b.x + 2.5, b.y + 2.5, b.w - 5, Math.min(10, b.h - 5), [7, 7, 3, 3]);
    ctx.fillStyle = C.blockTop; ctx.fill();
    ctx.beginPath();
    for (const b of lv.blocks) if (Vis(b.x, b.x + b.w, vl, vr) && b.y > vt - 20 && b.y < vb && b.w > 20) { ctx.moveTo(b.x + 9, b.y + 5); ctx.lineTo(b.x + b.w - 9, b.y + 5); }
    ctx.strokeStyle = C.blockLip; ctx.lineWidth = 2; ctx.stroke();
  }

  function DrawCrumble(ctx, lv, vl, vr, t) {
    for (const c of lv.crum) {
      if (!Vis(c.x, c.x + c.w, vl, vr)) continue;
      const n = Math.max(2, Math.round(c.w / 20)), tw = c.w / n;
      for (let i = 0; i < n; i++) {
        const s = SP.tiles[(i * 7 + (c.x / 5 | 0)) % 3];
        if (c.st === 2) {
          const k = c.t, a = 1 - k / 0.75;
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          Rot(ctx, c.x + tw * (i + 0.5), c.y + 10 + 950 * k * k * (0.8 + (i % 3) * 0.15), (i % 2 ? 1 : -1) * k * (2 + i % 3));
          ctx.drawImage(s.c, -tw / 2 - 1, -11, tw + 2, 22);
          Unrot(ctx);
          ctx.globalAlpha = 1;
        } else {
          const sh = c.st === 1 ? Math.sin(t * 80 + i * 2) * 1.6 * (0.4 + c.t) : 0;
          ctx.drawImage(s.c, c.x + tw * i - 1 + sh, c.y - 1 + (c.st === 1 ? Math.abs(sh) * 0.5 : 0), tw + 2, 22);
        }
      }
    }
  }

  function DrawHaz(ctx, C, lv, vl, vr) {
    if (!lv.haz.length) return;
    ctx.beginPath();
    for (const z of lv.haz) if (Vis(z.x, z.x + z.w, vl, vr)) HazPath(ctx, z);
    ctx.fillStyle = C.haz; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = C.hazOut; ctx.stroke();
    ctx.beginPath();
    for (const z of lv.haz) {
      if (!Vis(z.x, z.x + z.w, vl, vr)) continue;
      const n = Math.max(1, Math.round(z.w / 14)), s = z.w / n, b = z.y + z.h;
      for (let i = 0; i < n; i++) {
        const x = z.x + s * (i + 0.5);
        ctx.moveTo(x - s * 0.36, z.y + 2); ctx.lineTo(x, z.y - 6); ctx.lineTo(x, z.y + 2);
        ctx.moveTo(x - s * 0.36, b - 2); ctx.lineTo(x, b + 6); ctx.lineTo(x, b - 2);
      }
    }
    ctx.fillStyle = C.hazHi; ctx.fill();
    ctx.fillStyle = C.hazTop;
    for (const z of lv.haz) if (Vis(z.x, z.x + z.w, vl, vr) && z.h > 8) ctx.fillRect(z.x + 3, z.y + 4, z.w - 6, 2);
  }

  function HazPath(ctx, z) {
    const n = Math.max(1, Math.round(z.w / 14)), s = z.w / n, b = z.y + z.h;
    ctx.moveTo(z.x, z.y + 3);
    for (let i = 0; i < n; i++) { ctx.lineTo(z.x + s * (i + 0.5), z.y - 7); ctx.lineTo(z.x + s * (i + 1), z.y + 3); }
    ctx.lineTo(z.x + z.w, b - 3);
    for (let i = n; i > 0; i--) { ctx.lineTo(z.x + s * (i - 0.5), b + 7); ctx.lineTo(z.x + s * (i - 1), b - 3); }
    ctx.closePath();
  }

  function DrawPads(ctx, C, lv, vl, vr) {
    ctx.lineCap = 'round';
    for (const pd of lv.pads) {
      if (pd.x2 < vl || pd.x1 > vr) continue;
      const mx = (pd.x1 + pd.x2) / 2, my = (pd.y1 + pd.y2) / 2, ex = pd.x2 - pd.x1, ey = pd.y2 - pd.y1, el = Math.hypot(ex, ey), nx = ey / el, ny = -ex / el;
      const dip = pd.hit > 0 ? Math.sin((1 - pd.hit) * 16) * pd.hit * 11 : 0, cx = mx - nx * dip * 2, cy = my - ny * dip * 2;
      ctx.beginPath(); ctx.moveTo(pd.x1 + ex * 0.12, pd.y1 + ey * 0.12); ctx.lineTo(pd.x1 + ex * 0.12, pd.y1 + ey * 0.12 + 26);
      ctx.moveTo(pd.x2 - ex * 0.12, pd.y2 - ey * 0.12); ctx.lineTo(pd.x2 - ex * 0.12, pd.y2 - ey * 0.12 + 26);
      ctx.strokeStyle = OUT; ctx.lineWidth = 7.5; ctx.stroke();
      ctx.strokeStyle = C.post; ctx.lineWidth = 4.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pd.x1, pd.y1); ctx.quadraticCurveTo(cx, cy, pd.x2, pd.y2);
      ctx.strokeStyle = OUT; ctx.lineWidth = PAD_R * 2 + 3.5; ctx.stroke();
      ctx.strokeStyle = C.pad; ctx.lineWidth = PAD_R * 2; ctx.stroke();
      ctx.strokeStyle = C.padTop; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pd.x1 + nx * 3.5, pd.y1 + ny * 3.5); ctx.quadraticCurveTo(cx + nx * 3.5, cy + ny * 3.5, pd.x2 + nx * 3.5, pd.y2 + ny * 3.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(146,64,14,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(pd.x1 - nx * 3, pd.y1 - ny * 3); ctx.quadraticCurveTo(cx - nx * 3, cy - ny * 3, pd.x2 - nx * 3, pd.y2 - ny * 3); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function DrawWalls(ctx, C, lv, vl, vr, t) {
    for (const w of lv.walls) {
      if (Math.max(w.x1, w.x2) < vl || Math.min(w.x1, w.x2) > vr) continue;
      const ex = w.x2 - w.x1, ey = w.y2 - w.y1, l = Math.hypot(ex, ey), ux = ex / l, uy = ey / l;
      ctx.strokeStyle = C.wallBack; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(w.x1 - w.nx * 5, w.y1 - w.ny * 5); ctx.lineTo(w.x2 - w.nx * 5, w.y2 - w.ny * 5); ctx.stroke();
      ctx.setLineDash([]);
      if (w.hit > 0) { ctx.globalAlpha = w.hit * 0.6; ctx.strokeStyle = C.wall; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2);
      ctx.strokeStyle = OUT; ctx.lineWidth = 8.5; ctx.stroke();
      ctx.strokeStyle = C.wall; ctx.lineWidth = 5.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(w.x1 + w.nx * 1.4 + ux * 3, w.y1 + w.ny * 1.4 + uy * 3); ctx.lineTo(w.x2 + w.nx * 1.4 - ux * 3, w.y2 + w.ny * 1.4 - uy * 3); ctx.stroke();
      const n = Math.max(1, Math.round(l / 30)), bob = 2 + Math.sin(t * 5) * 1.5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, cx = w.x1 + ex * k + w.nx * (8 + bob), cy = w.y1 + ey * k + w.ny * (8 + bob);
        ctx.moveTo(cx - ux * 4.5, cy - uy * 4.5); ctx.lineTo(cx + w.nx * 4.5, cy + w.ny * 4.5); ctx.lineTo(cx + ux * 4.5, cy + uy * 4.5);
      }
      ctx.strokeStyle = C.wall; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }

  function DrawChecks(ctx, lv, vl, vr, t) {
    for (const c of lv.checks) {
      if (!Vis(c.x - 20, c.x + 40, vl, vr)) continue;
      if (c.on && c.t < 0.7) { ctx.globalAlpha = 1 - c.t / 0.7; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x + 14, c.y - 60, 14 + c.t * 50, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(20,16,34,0.2)'; ctx.beginPath(); ctx.ellipse(c.x + 1, c.y + 1, 14, 3.5, 0, 0, TAU); ctx.fill();
      RR(ctx, c.x - 10, c.y - 7, 20, 8, 3); ctx.fillStyle = '#94a3b8'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
      Flag(ctx, c.x, c.y - 6, 72, c.on ? '#22c55e' : '#94a3b8', c.on ? t : t * 0.4, c.on);
    }
  }

  function DrawTurrets(ctx, lv, vl, vr, t) {
    for (const u of lv.turrets) {
      if (!Vis(u.x - 40, u.x + 40, vl, vr)) continue;
      const k1 = Math.floor(t / u.per - u.ph), age = k1 >= 0 ? t - (k1 + u.ph) * u.per : 9, kick = Math.max(0, 1 - age / 0.18);
      Put(ctx, SP.tbase, u.x, u.y);
      Rot(ctx, u.x, u.y, u.a);
      Put(ctx, SP.barrel, 15 - kick * 5, 0);
      if (kick > 0.4) { ctx.globalAlpha = (kick - 0.4) / 0.6; Put(ctx, SP.flash, 33, 0, 0.6 + kick * 0.5); ctx.globalAlpha = 1; }
      Unrot(ctx);
      Put(ctx, SP.tcap, u.x, u.y);
    }
  }

  function DrawShots(ctx, lv, vl, vr, t) {
    for (const u of lv.turrets) {
      const k1 = Math.floor(t / u.per - u.ph);
      for (let k = Math.max(0, Math.ceil((t - u.life) / u.per - u.ph)); k <= k1; k++) {
        const a = (t - (k + u.ph) * u.per) * u.spd, x = u.mx + u.dx * a, y = u.my + u.dy * a;
        if (x < vl - 20 || x > vr + 20) continue;
        ctx.globalAlpha = 0.25; Put(ctx, SP.shot, x - u.dx * 14, y - u.dy * 14, 0.6);
        ctx.globalAlpha = 0.5; Put(ctx, SP.shot, x - u.dx * 7, y - u.dy * 7, 0.8);
        ctx.globalAlpha = 1; Put(ctx, SP.shot, x, y);
        if (u.life - a / u.spd < 0.06) { ctx.globalAlpha = 0.7; Put(ctx, SP.puff, x, y, 1.4); ctx.globalAlpha = 1; }
      }
    }
  }

  function DrawSpins(ctx, lv, vl, vr) {
    for (const s of lv.spins) {
      if (!Vis(s.x - s.len, s.x + s.len, vl, vr)) continue;
      ctx.fillStyle = 'rgba(20,16,34,0.16)'; ctx.beginPath(); ctx.arc(s.x + 2, s.y + 4, 7, 0, TAU); ctx.fill();
      Rot(ctx, s.x, s.y, s.a);
      const b = Bar(s.len);
      ctx.drawImage(b.c, -b.w / 2, -b.h / 2, b.w, b.h);
      Unrot(ctx);
      Put(ctx, SP.hub, s.x, s.y);
    }
  }

  function DrawBoosts(ctx, lv, vl, vr, t) {
    for (const o of lv.boosts) {
      if (!Vis(o.x - 45, o.x + 420, vl, vr)) continue;
      const P = o.path;
      if (P) {
        const hi = (t * 9 | 0) % 9;
        ctx.lineWidth = 1.4; ctx.strokeStyle = OUT; ctx.fillStyle = '#facc15';
        for (let i = 0; i < 7; i++) {
          ctx.globalAlpha = 0.95 - i * 0.08;
          ctx.beginPath(); ctx.arc(P[i * 2], P[i * 2 + 1], i === hi ? 5.4 : 4.2, 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.25 + o.fl * 0.6; Put(ctx, SP.glow, o.x, o.y, 1.4 + o.fl * 0.6); ctx.globalAlpha = 1;
      Rot(ctx, o.x, o.y, o.a);
      Put(ctx, SP.boost, 0, 0, 1 + o.fl * 0.18);
      const u = (t * 1.6) % 1, x = -14 + u * 34;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8; ctx.strokeStyle = '#fef9c3'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x - 5, -10); ctx.lineTo(x + 4, 0); ctx.lineTo(x - 5, 10); ctx.stroke();
      ctx.globalAlpha = 1;
      Unrot(ctx);
    }
  }

  function DrawRails(ctx, C, lv, vl, vr) {
    ctx.strokeStyle = C.rail; ctx.lineWidth = 3; ctx.setLineDash([2, 7]); ctx.lineCap = 'round';
    ctx.beginPath();
    for (const h of lv.hooks) if (h.sp && h.bx > vl && h.bx < vr) { ctx.moveTo(h.bx - h.ax, h.by - h.ay); ctx.lineTo(h.bx + h.ax, h.by + h.ay); }
    for (const s of lv.spins) if (s.sp && s.bx > vl - 400 && s.bx < vr + 400) { ctx.moveTo(s.bx - s.ax, s.by - s.ay); ctx.lineTo(s.bx + s.ax, s.by + s.ay); }
    const G = lv.goal;
    if (G.sp) { ctx.moveTo(G.bx - G.ax, G.by - G.ay); ctx.lineTo(G.bx + G.ax, G.by + G.ay); }
    ctx.stroke(); ctx.setLineDash([]);
  }

  function Ribbon(ctx, wd) {
    const n = GS.trN, X = GS.trX, Y = GS.trY, at = i => (GS.trH - Math.max(0, Math.min(n - 1, i)) + TRAIL) % TRAIL;
    ctx.beginPath();
    for (let j = 0; j < n * 2; j++) {
      const side = j < n ? 1 : -1, i = j < n ? j : n * 2 - 1 - j, a = at(i), f = at(i - 1), b = at(i + 1);
      const dx = X[f] - X[b], dy = Y[f] - Y[b], l = Math.hypot(dx, dy) || 1, w = wd * (1 - i / n) * side;
      if (j) ctx.lineTo(X[a] - dy / l * w, Y[a] + dx / l * w); else ctx.moveTo(X[a] - dy / l * w, Y[a] + dx / l * w);
    }
    ctx.fill();
  }

  function DrawWorld(ctx, C, vl, vr, vt, vb) {
    const lv = GS.lv, p = GS.p, now = GS.time;
    DrawWinds(ctx, C, lv, vl, vr, now);
    if (!lv.goal.t) DrawLine(ctx, C, lv, vl, vr, vt);
    DrawBlocks(ctx, C, lv, vl, vr, vt, vb);
    DrawCrumble(ctx, lv, vl, vr, now);
    DrawHaz(ctx, C, lv, vl, vr);
    DrawPads(ctx, C, lv, vl, vr);
    DrawWalls(ctx, C, lv, vl, vr, now);
    DrawChecks(ctx, lv, vl, vr, now);
    DrawRails(ctx, C, lv, vl, vr);
    DrawGoal(ctx, C, lv, vl, vr, now);
    DrawTurrets(ctx, lv, vl, vr, now);
    DrawSpins(ctx, lv, vl, vr);
    DrawBoosts(ctx, lv, vl, vr, now);
    const live = GS.status === 'ready' || GS.status === 'playing';
    for (const h of lv.hooks) {
      if (h.x < vl || h.x > vr || !live || p.hook) continue;
      if (Math.hypot(h.x - p.x, h.y - p.y) > REACH) continue;
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now * 6 + h.bx);
      Put(ctx, SP.glow, h.x, h.y);
    }
    ctx.globalAlpha = 1;
    ctx.font = F_HOOK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const h of lv.hooks) {
      if (h.x < vl || h.x > vr) continue;
      Put(ctx, SP.ball, h.x, h.y);
      ctx.fillStyle = '#fff';
      ctx.fillText(h.t, h.x, h.y + 0.5);
    }
    const t = p.hook || GS.target;
    if (t) {
      ctx.strokeStyle = p.hook ? ACCENT : C.man; ctx.lineWidth = 2.5;
      if (!p.hook) { ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 24; }
      ctx.beginPath(); ctx.arc(t.x, t.y, 19.5 + (p.hook ? 0 : Math.sin(now * 8) * 1.5), 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    if (GS.trN > 3) {
      ctx.fillStyle = C.trail; Ribbon(ctx, 9);
      ctx.globalAlpha = 0.5; ctx.fillStyle = C.manOut; Ribbon(ctx, 2.6); ctx.globalAlpha = 1;
    }
    DrawMan(ctx, C);
    DrawShots(ctx, lv, vl, vr, now);
    for (const q of GS.parts) {
      if (!q.on) continue;
      const a = 1 - q.t / q.life;
      if (q.k === 2) { ctx.globalAlpha = a * 0.7; const s = q.s * (1 + q.t / q.life * 1.6); ctx.drawImage(SP.puff.c, q.x - s, q.y - s, s * 2, s * 2); }
      else if (q.k === 1) { ctx.globalAlpha = a; ctx.strokeStyle = q.c; ctx.lineWidth = q.s * 0.7; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.035, q.y - q.vy * 0.035); ctx.stroke(); }
      else { ctx.globalAlpha = a; const s = q.s * 1.3; ctx.drawImage(Dot(q.c).c, q.x - s, q.y - s, s * 2, s * 2); }
    }
    ctx.globalAlpha = 1;
    ctx.font = F_POP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const q of GS.pops) {
      if (!q.on) continue;
      ctx.globalAlpha = Math.min(1, (0.9 - q.t) * 3);
      ctx.strokeStyle = C.manOut; ctx.lineWidth = 3; ctx.strokeText(q.txt, q.x, q.y - q.t * 34);
      ctx.fillStyle = q.c;
      ctx.fillText(q.txt, q.x, q.y - q.t * 34);
    }
    ctx.globalAlpha = 1;
  }

  const MINI = {
    h: [1.3, 0, g => { Put(g, SP.ball, 0, 0); g.font = F_HOOK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('15', 0, 0.5); }],
    b: [0.62, 15, (g, C) => DrawBlocks(g, C, { blocks: [{ x: -42, y: -2, w: 84, h: 34 }] }, -1e5, 1e5, -1e5, 1e5)],
    p: [0.66, 0, (g, C) => DrawPads(g, C, { pads: [{ x1: -38, y1: 2, x2: 38, y2: -8, hit: 0 }] }, -1e5, 1e5)],
    z: [0.66, 0, (g, C) => DrawHaz(g, C, { haz: [{ x: -42, y: -6, w: 84, h: 12 }] }, -1e5, 1e5)],
    t: [0.66, 0, g => { DrawTurrets(g, { turrets: [{ x: -18, y: 10, a: -0.6, per: 9, ph: 0 }] }, -1e5, 1e5, 5); Put(g, SP.shot, 22, -15); g.globalAlpha = 0.45; Put(g, SP.shot, 34, -23, 0.7); g.globalAlpha = 1; }],
    x: [0.6, 0, g => DrawSpins(g, { spins: [{ x: 0, y: 0, len: 76, a: -0.4 }] }, -1e5, 1e5)],
    u: [0.66, 3, g => { for (let i = 0; i < 4; i++) g.drawImage(SP.tiles[i % 3].c, -41 + i * 20, -9, 22, 22); }],
    o: [0.6, 0, g => DrawBoosts(g, { boosts: [{ x: 0, y: 0, a: -0.15, fl: 0, path: null }] }, -1e5, 1e5, 0.3)],
    w: [0.5, 6, (g, C) => {
      DrawWinds(g, C, { winds: [{ x: -40, y: -34, w: 80, h: 58, a: -Math.PI / 2, dx: 0, dy: -1, f: 2340 }] }, -1e5, 1e5, 0.6);
      g.beginPath();
      for (const x of [-18, 0, 18]) { g.moveTo(x, 12 - Math.abs(x) * 0.4); g.lineTo(x, -22); g.moveTo(x - 7, -14); g.lineTo(x, -23); g.lineTo(x + 7, -14); }
      g.strokeStyle = '#0ea5e9'; g.lineWidth = 3.4; g.stroke();
    }],
    j: [0.66, 0, (g, C) => DrawWalls(g, C, { walls: [{ x1: -38, y1: 8, x2: 38, y2: 8, nx: 0, ny: -1, hit: 0 }] }, -1e5, 1e5, 0)],
    q: [0.5, 0, g => DrawChecks(g, { checks: [{ x: -10, y: 40, on: 1, t: 1 }] }, -1e5, 1e5, 0.4)],
    y: [0.66, 0, g => {
      g.fillStyle = 'rgba(239,68,68,0.2)'; g.fillRect(-44, 0, 88, 24);
      g.setLineDash([8, 6]); Ln(g, -44, 0, 44, 0, '#ef4444', 2.6); g.setLineDash([]);
      for (const x of [-16, 16]) { g.beginPath(); g.moveTo(x - 6, -16); g.lineTo(x, -6); g.lineTo(x + 6, -16); g.strokeStyle = '#ef4444'; g.lineWidth = 3; g.stroke(); }
    }],
    ft0: [0.66, 0, g => {
      for (let y = -36; y < 36; y += 12) for (let i = 0; i < 2; i++) { g.fillStyle = ((y / 12 + i) & 1) ? OUT : '#ffffff'; g.fillRect(-12 + i * 12, y, 12, 12); }
      g.lineWidth = 2; g.strokeStyle = OUT; g.strokeRect(-12, -36, 24, 72);
    }],
    ft1: [0.42, 0, g => Put(g, SP.hoop, 0, 0)],
    ft2: [0.36, -14, g => { Put(g, SP.plat, 0, 11); Flag(g, 56, 0, 56, ACCENT, 0.4, false); }],
    ft3: [0.56, 0, g => Put(g, SP.target, 0, 0)],
  };
  function Icon(g, k, cx, cy, s, dark) {
    const m = MINI[k];
    World(g, s * m[0], cx, cy - m[1] * s * m[0]);
    g.lineJoin = 'round'; g.lineCap = 'round';
    m[2](g, dark ? DARK : LIGHT);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  function Wrap(g, txt, w) {
    const out = [];
    let line = '';
    for (const word of txt.split(' ')) {
      const t = line ? `${line} ${word}` : word;
      if (line && g.measureText(t).width > w) { out.push(line); line = word; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }
  function Seen() { const a = StorageGet(LS_INTRO, []); return Array.isArray(a) ? a : []; }
  function IntroKinds(lv) {
    const seen = Seen(), out = [];
    for (const a in INTRO_T) if (lv[a].length && !seen.includes(INTRO_T[a])) out.push(INTRO_T[a]);
    if (lv.goal.t && !seen.includes('ft' + lv.goal.t)) out.push('ft' + lv.goal.t);
    return out.slice(0, 3);
  }
  function IntroSeen() {
    if (!GS.intro.length) return;
    const seen = Seen();
    for (const k of GS.intro) if (!seen.includes(k)) seen.push(k);
    StorageSet(LS_INTRO, seen);
  }
  function ElName(k) { return _GameText(k.startsWith('ft') ? FT_KEY[+k[2]] : EL_KEY[k]); }
  function IntroCard(list, dark) {
    const C = dark ? DARK : LIGHT, n = list.length, cw = 236, ch = 86, gap = 8, K = 3;
    const s = Cv(n * cw + (n - 1) * gap + 8, ch + 8, K), g = s.g;
    list.forEach((k, i) => {
      const x = 4 + i * (cw + gap), y = 3, col = TAG_C[TAG[k]];
      g.fillStyle = 'rgba(20,16,34,0.18)'; RR(g, x + 1, y + 3, cw, ch, 12); g.fill();
      g.fillStyle = dark ? 'rgba(20,28,54,0.96)' : 'rgba(255,255,255,0.96)'; RR(g, x, y, cw, ch, 12); g.fill();
      g.lineWidth = 2; g.strokeStyle = col; g.stroke();
      g.fillStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(38,35,58,0.05)'; RR(g, x + 7, y + 7, 62, ch - 14, 9); g.fill();
      Icon(g, k, (x + 38) * K, (y + ch / 2) * K, K, dark);
      g.setTransform(K, 0, 0, K, 0, 0);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.font = F_SMALL; g.fillStyle = ACCENT;
      g.fillText(_txt.nw, x + 78, y + 17);
      const tg = _GameText('hk_tag_' + TAG[k]), nx = x + 84 + g.measureText(_txt.nw).width, tw = g.measureText(tg).width + 12;
      g.fillStyle = Rgba(col, dark ? 0.22 : 0.15); RR(g, nx, y + 7, tw, 14, 7); g.fill();
      g.fillStyle = col; g.fillText(tg, nx + 6, y + 17);
      g.font = `800 12.5px ${FONT}`; g.fillStyle = C.hud;
      g.fillText(ElName(k), x + 78, y + 35);
      g.font = `600 10px ${FONT}`; g.fillStyle = C.hudSub;
      Wrap(g, _GameText('hk_in_' + k), cw - 86).slice(0, 3).forEach((l, j) => g.fillText(l, x + 78, y + 50 + j * 12.5));
    });
    return s;
  }

  const SKINS = [
    { key: 'hk_skin_classic', need: 0, body: '', o: '', scarf: ACCENT, scarfO: '#9d174d', band: ACCENT, eye: '', acc: '' },
    { key: 'hk_skin_ninja', need: 3, body: '#1f2937', o: '', scarf: '#ef4444', scarfO: '#7f1d1d', band: '#ef4444', eye: '#ffffff', acc: 'mask' },
    { key: 'hk_skin_robot', need: 6, body: '#94a3b8', o: '#334155', scarf: '', scarfO: '', band: '#38bdf8', eye: '#38bdf8', acc: 'antenna' },
    { key: 'hk_skin_astro', need: 10, body: '#f1f5f9', o: '#334155', scarf: '#f97316', scarfO: '#9a3412', band: '', eye: '#1e293b', acc: 'visor' },
    { key: 'hk_skin_wizard', need: 14, body: '#6d28d9', o: '', scarf: '#facc15', scarfO: '#a16207', band: '', eye: '#ffffff', acc: 'hat' },
    { key: 'hk_skin_neon', need: 18, body: '#22d3ee', o: '#0e7490', scarf: '#f0abfc', scarfO: '#a21caf', band: '#f0abfc', eye: '#0f172a', acc: 'glow' },
    { key: 'hk_skin_candy', need: 22, body: '#f472b6', o: '#9d174d', scarf: '#5eead4', scarfO: '#0f766e', band: '#ffffff', eye: '#ffffff', acc: 'bow' },
    { key: 'hk_skin_gold', need: 32, body: '#facc15', o: '#78350f', scarf: '#fff7ad', scarfO: '#a16207', band: '#fff7ad', eye: '#78350f', acc: 'crown' },
  ];
  function Cleared() { const t = Times(); let n = 0; for (let i = 1; i <= LEVELS; i++) if (t[i]) n++; return n; }
  function SkinOk(i) { return !!SKINS[i] && Cleared() >= SKINS[i].need; }
  function PickSkin() {
    const m = GS.custom ? GS.custom.sk : 0;
    if (m) return SKINS[m - 1];
    const i = StorageGet(LS_SKIN, 0) | 0;
    return SkinOk(i) ? SKINS[i] : SKINS[0];
  }

  function DrawMan(ctx, C) {
    const p = GS.p, P = GS.pts;
    if (p.hook) {
      const k = Math.min(1, GS.ropeT / 0.07), ex = P[3].x + (p.hook.x - P[3].x) * k, ey = P[3].y + (p.hook.y - P[3].y) * k;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P[3].x, P[3].y); ctx.lineTo(ex, ey);
      ctx.strokeStyle = C.ropeOut; ctx.lineWidth = 4.8; ctx.stroke();
      ctx.strokeStyle = C.rope; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.fillStyle = C.rope; ctx.beginPath(); ctx.arc(ex, ey, 3.2, 0, TAU); ctx.fill();
    }
    ManBody(ctx, C, GS.skin || SKINS[0], p.x, p.y, p.th, p.vx, P, GS.sc);
  }

  function Limbs(ctx, x, y, ux, uy, sx, sy, hx, hy, P) {
    ctx.beginPath();
    ctx.moveTo(x + ux * 9, y + uy * 9); ctx.lineTo(hx, hy);
    ctx.moveTo(sx, sy); ctx.lineTo(P[0].x, P[0].y); ctx.lineTo(P[1].x, P[1].y);
    ctx.moveTo(sx, sy); ctx.lineTo(P[2].x, P[2].y); ctx.lineTo(P[3].x, P[3].y);
    ctx.moveTo(hx, hy); ctx.lineTo(P[4].x, P[4].y); ctx.lineTo(P[5].x, P[5].y);
    ctx.moveTo(hx, hy); ctx.lineTo(P[6].x, P[6].y); ctx.lineTo(P[7].x, P[7].y);
  }

  function ManBody(ctx, C, sk, x, y, th, vx, P, S) {
    const ux = Math.sin(th), uy = -Math.cos(th), sx = x + ux * 7.5, sy = y + uy * 7.5, hx = x - ux * 9, hy = y - uy * 9, cx = x + ux * 16, cy = y + uy * 16;
    const body = sk.body || C.man, out = sk.o || C.manOut, rx = -uy, ry = ux, f = vx < -30 ? -1 : 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (sk.scarf) {
      ctx.beginPath(); ctx.moveTo(cx - uy * 2, cy + ux * 2);
      for (const q of S) ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = sk.scarfO; ctx.lineWidth = 5.4; ctx.stroke();
      ctx.strokeStyle = sk.scarf; ctx.lineWidth = 3.2; ctx.stroke();
    }
    Limbs(ctx, x, y, ux, uy, sx, sy, hx, hy, P);
    if (sk.acc === 'glow') { ctx.globalAlpha = 0.25; ctx.strokeStyle = body; ctx.lineWidth = 13; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = out; ctx.lineWidth = 7.6; ctx.stroke();
    ctx.fillStyle = out; ctx.beginPath(); ctx.arc(cx, cy, 8.3, 0, TAU); ctx.fill();
    Limbs(ctx, x, y, ux, uy, sx, sy, hx, hy, P);
    ctx.strokeStyle = body; ctx.lineWidth = 4.8; ctx.stroke();
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, 6.6, 0, TAU); ctx.fill();
    for (let i = 1; i < 8; i += 2) { ctx.beginPath(); ctx.arc(P[i].x, P[i].y, 2.9, 0, TAU); ctx.fill(); }
    const tx = cx + ux * 6.4, ty = cy + uy * 6.4;
    if (sk.acc === 'hat') {
      ctx.beginPath(); ctx.moveTo(tx - rx * 8.5 - ux * 2, ty - ry * 8.5 - uy * 2); ctx.lineTo(cx + ux * 22 - rx * f * 5, cy + uy * 22 - ry * f * 5); ctx.lineTo(tx + rx * 8.5 - ux * 2, ty + ry * 8.5 - uy * 2); ctx.closePath();
      ctx.fillStyle = '#4c1d95'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(cx + ux * 12 - rx * f * 1.5, cy + uy * 12 - ry * f * 1.5, 1.6, 0, TAU); ctx.fill();
    } else if (sk.acc === 'crown') {
      ctx.beginPath(); ctx.moveTo(tx - rx * 6 - ux * 2, ty - ry * 6 - uy * 2);
      for (let i = 0; i < CROWN.length; i += 2) ctx.lineTo(tx + rx * CROWN[i] + ux * CROWN[i + 1], ty + ry * CROWN[i] + uy * CROWN[i + 1]);
      ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#78350f'; ctx.stroke();
    } else if (sk.acc === 'antenna') {
      ctx.strokeStyle = out; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + ux * 6, ty + uy * 6); ctx.stroke();
      ctx.fillStyle = sk.band; ctx.beginPath(); ctx.arc(tx + ux * 7.5, ty + uy * 7.5, 2.3, 0, TAU); ctx.fill();
    } else if (sk.acc === 'bow') {
      const bx = cx - rx * f * 5.5 + ux * 5, by = cy - ry * f * 5.5 + uy * 5;
      ctx.fillStyle = sk.scarf;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + ux * 5 + rx * 3, by + uy * 5 + ry * 3); ctx.lineTo(bx - ux * 1 + rx * 5, by - uy * 1 + ry * 5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - ux * 5 - rx * 3, by - uy * 5 - ry * 3); ctx.lineTo(bx + ux * 1 - rx * 5, by + uy * 1 - ry * 5); ctx.closePath(); ctx.fill();
    }
    if (sk.band) {
      const o = sk.acc === 'mask' ? -0.4 : 2.4;
      ctx.strokeStyle = sk.band; ctx.lineWidth = sk.acc === 'mask' ? 3.8 : 2.4;
      ctx.beginPath(); ctx.moveTo(cx - rx * 6.4 + ux * o, cy - ry * 6.4 + uy * o); ctx.lineTo(cx + rx * 6.4 + ux * o, cy + ry * 6.4 + uy * o); ctx.stroke();
    }
    ctx.fillStyle = sk.eye || C.eye;
    for (let o = 1.6; o < 5; o += 2.8) { ctx.beginPath(); ctx.arc(cx + rx * f * o - ux * 0.6, cy + ry * f * o - uy * 0.6, 1.25, 0, TAU); ctx.fill(); }
    if (sk.acc === 'visor') {
      ctx.fillStyle = 'rgba(125,211,252,0.3)'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 7.4, th + Math.PI * 1.1, th + Math.PI * 1.45); ctx.stroke();
    }
  }

  function SkinPreview(cv, sk, C) {
    const g = cv.getContext('2d'), th = 0.18, x = 30, y = 36, ux = Math.sin(th), uy = -Math.cos(th), sx = x + ux * 7.5, sy = y + uy * 7.5, hx = x - ux * 9, hy = y - uy * 9;
    g.setTransform(cv.width / 64, 0, 0, cv.height / 64, 0, 0);
    g.clearRect(0, 0, 64, 64);
    const P = [];
    for (let i = 0; i < 8; i++) P.push({ x: x - uy * POSE_FLY[i * 2] + ux * POSE_FLY[i * 2 + 1], y: y + ux * POSE_FLY[i * 2] + uy * POSE_FLY[i * 2 + 1] });
    Link(sx, sy, P[0], ARM); Link(P[0].x, P[0].y, P[1], ARM); Link(sx, sy, P[2], ARM); Link(P[2].x, P[2].y, P[3], ARM);
    Link(hx, hy, P[4], LEG); Link(P[4].x, P[4].y, P[5], LEG); Link(hx, hy, P[6], LEG); Link(P[6].x, P[6].y, P[7], LEG);
    const cx = x + ux * 16, cy = y + uy * 16, S = [0, 1, 2, 3].map(i => ({ x: cx - 6 - i * 4.4, y: cy + 1 + i * 2 + Math.sin(i) * 1.5 }));
    ManBody(g, C, sk, x, y, th, 1, P, S);
  }

  function Draw() {
    if (!_ctx || !GS || !GS.lv) return;
    if (GS.status === 'editor') { DrawEditor(); return; }
    const ctx = _ctx, dark = _root.dataset.theme === 'dark', C = Pal(dark), c = GS.cam, z = c.z;
    Backdrop(ctx, dark, GS.lv.th, c.x, c.y);
    const sh = GS.shake, ox = sh ? (Math.random() - 0.5) * sh * 9 : 0, oy = sh ? (Math.random() - 0.5) * sh * 9 : 0;
    World(ctx, _k * z, _k * (CV_W / 2 - c.x * z + ox), _k * (CV_H / 2 - c.y * z + oy));
    const hw = CV_W / 2 / z + 60, hh = CV_H / 2 / z + 60;
    DrawWorld(ctx, C, c.x - hw, c.x + hw, c.y - hh, c.y + hh);
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    Hud(ctx, C);
    for (const q of GS.conf) {
      if (!q.on) continue;
      ctx.setTransform(_k * Math.cos(q.a), _k * Math.sin(q.a), -_k * Math.sin(q.a), _k * Math.cos(q.a), _k * q.x, _k * q.y);
      ctx.fillStyle = q.c;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
    }
    ctx.setTransform(_k, 0, 0, _k, 0, 0);
    const fa = GS.status === 'dead' ? Math.min(1, GS.deadT / 0.36) : GS.fade;
    if (fa > 0) {
      ctx.globalAlpha = fa * 0.8;
      ctx.fillStyle = C.fade;
      ctx.fillRect(0, 0, CV_W, CV_H);
      ctx.globalAlpha = 1;
    }
  }

  function Badge(ctx, x, y, txt, on, C) {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.2832);
    ctx.fillStyle = on ? ACCENT : C.badge; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = ACCENT; ctx.stroke();
    if (txt) {
      ctx.fillStyle = on ? '#fff' : ACCENT; ctx.font = F_BADGE;
      ctx.fillText(txt, x, y + 0.5);
      return;
    }
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.chkB;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) & 1) ctx.fillRect(x - 14 + i * 7, y - 14 + j * 7, 7, 7);
    ctx.restore();
  }

  function Hud(ctx, C) {
    const n = GS.level, cu = GS.custom, cx = CV_W / 2, y = 26, bw = 200;
    ctx.fillStyle = C.track; RR(ctx, cx - bw / 2, y - 4, bw, 8, 4); ctx.fill();
    if (GS.prog > 0) { ctx.fillStyle = ACCENT; RR(ctx, cx - bw / 2, y - 4, Math.max(8, bw * GS.prog), 8, 4); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Badge(ctx, cx - bw / 2 - 16, y, cu ? ' ' : String(n), true, C);
    Badge(ctx, cx + bw / 2 + 16, y, !cu && n < LEVELS ? String(n + 1) : '', false, C);
    ctx.fillStyle = C.hud; ctx.font = F_TIME; ctx.textAlign = 'right';
    ctx.fillText(Fmt(GS.ms), CV_W - 16, y);
    ctx.fillStyle = C.hudSub; ctx.font = F_SUB; ctx.textAlign = 'left';
    if (cu) {
      const nm = Array.from(LevelName(cu));
      ctx.fillText(`${GS.test ? `${_txt.test} · ` : ''}${nm.length > 18 ? `${nm.slice(0, 17).join('')}…` : nm.join('')}`.toUpperCase(), 16, y);
      if (GS.test) { ctx.textAlign = 'right'; ctx.fillText(_txt.esc, CV_W - 16, y + 20); ctx.textAlign = 'left'; }
    } else ctx.fillText(`${_txt.level.toUpperCase()} ${n}`, 16, y);
    if (GS.attempts > 1) ctx.fillText(`${_txt.tries} ${GS.attempts}`, 16, y + 17);
    const G = GS.lv.goal, st = GS.status, c = GS.cam;
    if (G.t && (st === 'ready' || st === 'playing')) {
      const gx = CV_W / 2 + (G.x - c.x) * c.z, gy = CV_H / 2 + (G.y - c.y) * c.z;
      if (gx > CV_W + 20) Put(ctx, SP.fin2, CV_W - SP.fin2.w / 2 - 4, Math.max(84, Math.min(CV_H - 84, gy)) + Math.sin(GS.time * 4) * 1.5);
    }
    if (GS.introC) {
      const a = st === 'ready' ? 1 : st === 'playing' ? 1 - Math.min(1, GS.introT / 0.4) : 0;
      if (a > 0) { ctx.globalAlpha = a; Put(ctx, GS.introC, cx, 52 + GS.introC.h / 2 - (1 - a) * 12); ctx.globalAlpha = 1; }
    }
    if (st === 'ready') {
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(GS.time * 5);
      ctx.font = F_HINT; ctx.textAlign = 'center';
      if (!cu && n <= 3) Steps(ctx, C, cx, CV_H - 42);
      else Pill(ctx, C, cx, CV_H - 42, _txt.hold);
      ctx.globalAlpha = 1;
    } else if (GS.tut && GS.hintA > 0 && st === 'playing') {
      ctx.globalAlpha = GS.hintA; ctx.font = F_HINT; ctx.textAlign = 'center';
      Pill(ctx, C, cx, CV_H - 42 + (1 - GS.hintA) * 8, GS.hint === 2 ? _txt.rel : _txt.hold);
      ctx.globalAlpha = 1;
    }
  }

  function Pill(ctx, C, x, y, txt) {
    const w = ctx.measureText(txt).width + 40;
    ctx.fillStyle = C.pill; RR(ctx, x - w / 2, y - 16, w, 32, 16); ctx.fill();
    ctx.fillStyle = C.pillTxt; ctx.fillText(txt, x, y + 0.5);
  }
  function Steps(ctx, C, x, y) {
    const a = _txt.hold, b = _txt.rel, wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, w = wa + wb + 112;
    const px = x - w / 2;
    ctx.fillStyle = C.pill; RR(ctx, px, y - 18, w, 36, 18); ctx.fill();
    Step(ctx, C, px + 10, y, '1', a);
    const ax = px + 38 + wa;
    ctx.strokeStyle = C.hudSub; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(ax + 10, y - 5); ctx.lineTo(ax + 16, y); ctx.lineTo(ax + 10, y + 5); ctx.stroke();
    Step(ctx, C, ax + 26 + 10, y, '2', b);
    ctx.textAlign = 'center';
  }
  function Step(ctx, C, x, y, i, t) {
    ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(x + 11, y, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = F_BADGE; ctx.textAlign = 'center'; ctx.fillText(i, x + 11, y + 0.5);
    ctx.fillStyle = C.pillTxt; ctx.font = F_HINT; ctx.textAlign = 'left'; ctx.fillText(t, x + 28, y + 0.5);
  }


  function StartLoop() {
    if (_raf) return;
    _last = performance.now();
    _raf = requestAnimationFrame(Frame);
  }
  function Frame(ts) {
    _raf = null;
    if (!GS || !RUN[GS.status]) return;
    const dt = Math.min(50, Math.max(0, ts - _last));
    _last = ts;
    Update(dt);
    Draw();
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-hk-start', 'gf-hk-levels', 'gf-hk-pause', 'gf-hk-done', 'gf-hk-custom', 'gf-hk-ed', 'gf-hk-code', 'gf-hk-skins'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
    ById('gf-hk-help').style.display = 'none';
    if (id !== 'gf-hk-ed' && _root.dataset.ed) { delete _root.dataset.ed; _view.style.cursor = _cur = ''; }
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    StopLoop();
    GS = NewState();
    LoadLevel(GS.level);
    GS.status = 'start';
    SetText('gf-hk-best', LoadBest());
    SetText('gf-hk-play-lvl', `${_txt.level} ${GS.level}`);
    Draw();
    ShowScreen('gf-hk-start');
  }

  function ShowLevels() {
    if (!GS) return;
    StopLoop();
    if (GS.status !== 'paused') GS.prev = GS.status;
    GS.status = 'levels';
    const un = Unlocked(), times = Times(), grid = document.getElementById('gf-hk-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= LEVELS; i++) {
      const b = document.createElement('button');
      b.className = 'gf-hk-lv' + (i === un ? ' gf-hk-lv-cur' : '') + (times[i] ? ' gf-hk-lv-done' : '') + (i > LEVELS_OLD ? ' gf-hk-lv-new' : '');
      b.disabled = i > un;
      b.innerHTML = `<b>${i}</b><small>${times[i] ? Fmt(times[i]) : i > un ? '' : '-'}</small>`;
      b.addEventListener('click', () => Play(i));
      grid.appendChild(b);
    }
    ShowScreen('gf-hk-levels');
  }

  function ShowSkins() {
    if (!GS) return;
    StopLoop();
    GS.status = 'skins';
    RenderSkins();
    ShowScreen('gf-hk-skins');
  }

  function RenderSkins() {
    const T = _GameText, el = ById('gf-hk-skgrid'), cur = StorageGet(LS_SKIN, 0) | 0, C = _root.dataset.theme === 'dark' ? DARK : LIGHT, n = Cleared();
    el.innerHTML = SKINS.map((k, i) => {
      const ok = n >= k.need;
      return `<button class="gf-hk-sk${ok ? '' : ' gf-hk-sk-lock'}${ok && i === (SkinOk(cur) ? cur : 0) ? ' on' : ''}" data-sk="${i}"><canvas width="128" height="128"></canvas><b>${T(k.key)}</b><small>${ok ? i === cur ? T('hk_skin_on') : '' : T('hk_skin_need').replace('{n}', k.need)}</small></button>`;
    }).join('');
    el.querySelectorAll('canvas').forEach((cv, i) => SkinPreview(cv, SKINS[i], C));
  }

  function ShowDone() {
    const n = GS.level, cu = GS.custom, last = !cu && n >= LEVELS, g = GS.lv.g;
    GS.status = 'complete';
    SetText('gf-hk-done-title', _GameText(cu && GS.fresh ? 'hk_verified' : last ? 'hk_all_clear' : 'hk_level_clear'));
    SetText('gf-hk-done-time', Fmt(GS.ms));
    SetText('gf-hk-done-best', Fmt(cu ? GS.best : Times()[n]));
    SetText('gf-hk-done-tries', GS.attempts);
    SetText('gf-hk-best', LoadBest());
    const chip = document.getElementById('gf-hk-done-grade');
    chip.textContent = `${g.subject} ${g.label}`;
    chip.style.color = GradeColor(g.Pct);
    chip.style.borderColor = GradeColor(g.Pct);
    document.getElementById('gf-hk-done-new').style.display = GS.rec ? 'block' : 'none';
    document.getElementById('gf-hk-done-share').style.display = cu && GS.fresh ? 'block' : 'none';
    const nx = document.getElementById('gf-hk-next');
    nx.style.display = last || cu && !GS.test ? 'none' : '';
    nx.textContent = GS.test ? _GameText('hk_back_editor') : `${_GameText('hk_next_level')}\u00a0 ▶`;
    document.getElementById('gf-hk-dcode').style.display = cu ? '' : 'none';
    document.getElementById('gf-hk-lvls3').style.display = GS.test ? 'none' : '';
    MenuLabel('gf-hk-lvls3');
    ShowScreen('gf-hk-done');
  }

  function MenuLabel(id) { SetText(id, _GameText(GS.test ? 'hk_editor' : GS.custom ? 'hk_custom' : 'game_levels')); }
  function ToMenu() { if (GS.test) EdReturn(); else if (GS.custom) ShowCustom(); else ShowLevels(); }

  function Play(n) {
    if (!GS) GS = NewState();
    LoadLevel(Math.max(1, Math.min(LEVELS, n)));
    ShowScreen(null);
    StartLoop();
  }

  function Restart() {
    if (!GS || !RUN[GS.status] && GS.status !== 'paused') return;
    LoadLevel(GS.level, true);
    ShowScreen(null);
    StartLoop();
  }

  function Next() {
    if (!GS || GS.status !== 'complete') return;
    if (GS.test) EdReturn();
    else if (!GS.custom && GS.level < LEVELS) Play(GS.level + 1);
  }

  function DoPause() {
    if (!GS) return;
    const st = GS.status;
    if (st === 'ready' || st === 'playing' || st === 'dead') {
      GS.prev = st; GS.status = 'paused'; GS.hold = false;
      StopLoop(); Draw();
      MenuLabel('gf-hk-lvls2');
      ShowScreen('gf-hk-pause');
    } else if (st === 'paused') {
      GS.status = GS.prev || 'ready';
      ShowScreen(null);
      StartLoop();
    }
  }

  function BackFromLevels() {
    const pv = GS.prev;
    if (pv === 'complete') { GS.status = 'complete'; ShowScreen('gf-hk-done'); StartLoop(); }
    else if (pv === 'ready' || pv === 'playing' || pv === 'dead') { GS.status = 'paused'; ShowScreen('gf-hk-pause'); }
    else ShowStart();
  }

  function Customs() {
    const a = StorageGet(LS_CUSTOM, []);
    return Array.isArray(a) ? a.filter(r => r && typeof r.id === 'string' && (r.d = Normalize(r.d))) : [];
  }
  function SaveCustoms(a) { StorageSet(LS_CUSTOM, a); }
  function IsOk(r) { return !!r && r.v === Hash(r.d); }
  function LevelName(d) { return d.n || _GameText('hk_untitled'); }
  function NewId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function Esc(s) { return String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`); }
  function ById(id) { return document.getElementById(id); }

  function Toast(msg, bad) {
    const t = ById('gf-hk-toast');
    t.textContent = msg;
    t.className = bad ? 'on bad' : 'on';
    clearTimeout(_toastT);
    _toastT = setTimeout(() => { t.className = bad ? 'bad' : ''; }, 2200);
  }

  function Arm(b, fn) {
    if (b.classList.contains('arm')) { b.classList.remove('arm'); fn(); return; }
    _root.querySelectorAll('.arm').forEach(x => x.classList.remove('arm'));
    b.classList.add('arm');
    Toast(_GameText('hk_confirm'));
    clearTimeout(_armT);
    _armT = setTimeout(() => b.classList.remove('arm'), 2500);
  }

  async function Clip(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (_) {}
    const ta = document.createElement('textarea');
    ta.value = s;
    ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
    _root.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }

  async function CopyCode(d) {
    const code = await Encode(d);
    if (await Clip(code)) Toast(_GameText('hk_copied'));
    else OpenCode(code);
  }

  function CodeOpen() { return !!_root && ById('gf-hk-code').style.display !== 'none'; }
  function OpenCode(code) {
    const T = _GameText, imp = code == null, ta = ById('gf-hk-code-in');
    _codeMode = imp ? 'imp' : 'exp';
    SetText('gf-hk-code-h', T(imp ? 'hk_import' : 'hk_code_title'));
    SetText('gf-hk-code-sub', T(imp ? 'hk_import_sub' : 'hk_copy_manual'));
    SetText('gf-hk-code-ok', T(imp ? 'hk_import_btn' : 'hk_copy'));
    SetText('gf-hk-code-x', T(imp ? 'hk_cancel' : 'hk_close'));
    SetText('gf-hk-code-err', '');
    ta.readOnly = !imp;
    ta.value = imp ? '' : code;
    ById('gf-hk-code').style.display = 'flex';
    ta.focus();
    if (!imp) ta.select();
  }
  function CloseCode() { ById('gf-hk-code').style.display = 'none'; }

  async function CodeOk() {
    const ta = ById('gf-hk-code-in');
    if (_codeMode === 'exp') {
      ta.select();
      if (await Clip(ta.value)) { CloseCode(); Toast(_GameText('hk_copied')); }
      return;
    }
    if (_busy) return;
    _busy = true;
    const res = await Decode(ta.value);
    _busy = false;
    if (res.e) { SetText('gf-hk-code-err', _GameText(res.e)); ta.focus(); return; }
    const a = Customs(), j = JSON.stringify(res.d), dup = a.find(r => JSON.stringify(r.d) === j);
    if (dup) { ShowCustom(dup.id); Toast(_GameText('hk_already')); return; }
    if (a.length >= MAX_CUSTOM) { SetText('gf-hk-code-err', _GameText('hk_err_full')); return; }
    const r = { id: NewId(), d: res.d, v: Hash(res.d), bt: 0, im: 1, at: Date.now() };
    a.push(r);
    SaveCustoms(a);
    ShowCustom(r.id);
    Toast(_GameText('hk_imported'));
  }

  function ShowCustom(flash) {
    if (!GS) GS = NewState();
    StopLoop();
    GS.status = 'custom'; GS.custom = null; GS.test = false; GS.hold = false;
    RenderList(flash);
    ShowScreen('gf-hk-custom');
  }

  function RenderList(flash) {
    const T = _GameText, a = Customs(), el = ById('gf-hk-clist');
    el.innerHTML = a.length ? a.map(r => {
      const ok = IsOk(r), nm = Esc(LevelName(r.d));
      const tags = (r.im ? `<span class="gf-hk-tag gf-hk-tag-im">${T('hk_imported_tag')}</span>` : '')
        + (!ok ? `<span class="gf-hk-tag">${T('hk_not_cleared')}</span>` : r.bt ? `<span class="gf-hk-tag gf-hk-tag-ok">${T('hk_cleared')} · ${Fmt(r.bt)}</span>` : '');
      return `<div class="gf-hk-ci${r.id === flash ? ' gf-hk-flash' : ''}" data-id="${Esc(r.id)}">
        <div class="gf-hk-ci-m"><div class="gf-hk-ci-n" title="${nm}">${nm}</div><div class="gf-hk-ci-s">${tags}<span>${r.d.h.length} ${T('hk_hooks')}</span></div></div>
        <button class="gf-hk-sb" data-act="play">${IC.play}${T('game_play')}</button>
        <button class="gf-hk-ib" data-act="edit" title="${T('hk_edit')}">${IC.edit}</button>
        <button class="gf-hk-ib${ok ? '' : ' off'}" data-act="code" title="${T(ok ? 'hk_copy_code' : 'hk_need_clear')}">${IC.code}</button>
        <button class="gf-hk-ib" data-act="ren" title="${T('hk_rename')}">${IC.ren}</button>
        <button class="gf-hk-ib" data-act="dup" title="${T('hk_duplicate')}">${IC.dup}</button>
        <button class="gf-hk-ib gf-hk-ib-del" data-act="del" title="${T('hk_delete')}">${IC.del}</button>
      </div>`;
    }).join('') : `<div class="gf-hk-empty">${T('hk_no_custom')}</div>`;
    if (flash) [...el.children].find(c => c.dataset.id === flash)?.scrollIntoView({ block: 'nearest' });
  }

  function OnListClick(e) {
    const b = e.target.closest('button[data-act]'), row = b && b.closest('.gf-hk-ci');
    if (!row) return;
    const a = Customs(), i = a.findIndex(r => r.id === row.dataset.id), r = a[i], act = b.dataset.act;
    if (!r) return;
    if (act === 'play') PlayCustom(r);
    else if (act === 'edit') OpenEditor(r.id);
    else if (act === 'code') { if (IsOk(r)) CopyCode(r.d); else Toast(_GameText('hk_need_clear'), 1); }
    else if (act === 'ren') RenameStart(row, r);
    else if (act === 'dup') {
      if (a.length >= MAX_CUSTOM) { Toast(_GameText('hk_err_full'), 1); return; }
      const c = { ...r, id: NewId(), at: Date.now(), d: { ...r.d, n: CleanName(`${LevelName(r.d)} (${_GameText('hk_copy_suffix')})`) } };
      a.splice(i + 1, 0, c);
      SaveCustoms(a);
      RenderList(c.id);
    } else if (act === 'del') Arm(b, () => { a.splice(i, 1); SaveCustoms(a); RenderList(); });
  }

  function RenameStart(row, r) {
    const n = row.querySelector('.gf-hk-ci-n'), inp = document.createElement('input');
    inp.className = 'gf-hk-ren';
    inp.maxLength = NAME_MAX;
    inp.spellcheck = false;
    inp.value = r.d.n;
    n.replaceWith(inp);
    inp.focus();
    inp.select();
    inp.addEventListener('blur', () => RenameDone(inp, true));
  }
  function RenameDone(inp, save) {
    if (inp.dataset.done) return;
    inp.dataset.done = '1';
    const id = inp.closest('.gf-hk-ci').dataset.id, a = Customs(), r = a.find(x => x.id === id), n = CleanName(inp.value);
    if (save && r && n && n !== r.d.n) { r.d.n = n; SaveCustoms(a); }
    RenderList();
  }

  function PlayCustom(r) {
    GS.custom = r.d; GS.cid = r.id; GS.test = false;
    LoadLevel(1);
    ShowScreen(null);
    StartLoop();
  }

  function Blank() {
    return { n: `${_GameText('hk_my_level')} ${Customs().length + 1}`, c: 0, sk: 0, s: [60, 400], f: [780, 460, 0, 0, 0, 20], kh: [KILL_Y],
      h: [[220, 200, 0, 0, 20, 0], [400, 175, 0, 0, 20, 0], [580, 200, 0, 0, 20, 0]],
      b: [[-240, 400, 310, 300], [750, 460, 700, 300]], p: [], z: [], t: [], x: [], u: [], o: [], w: [], j: [], q: [] };
  }

  function OpenEditor(id) {
    if (!GS) GS = NewState();
    StopLoop();
    const r = id ? Customs().find(x => x.id === id) : null, d = r ? r.d : Blank();
    ED = { id: r ? r.id : null, d, v: r ? r.v : '', last: JSON.stringify(d), undo: [], redo: [], sel: [], tool: 'sel', hov: null, drag: null, ptr: null, space: false, snap: StorageGet(LS_SNAP, true) !== false, x: 0, y: 0, z: 1 };
    FitCam();
    ById('gf-hk-ed-name').value = d.n;
    EdShow();
  }

  function EdShow() {
    GS.status = 'editor'; GS.custom = null; GS.test = false; GS.hold = false;
    GS.trN = 0; GS.target = null; GS.shake = 0; GS.fade = 0;
    ED.drag = null;
    ED.space = false;
    _root.dataset.ed = '1';
    EdSync();
    ShowScreen('gf-hk-ed');
    SetTool(ED.tool);
    RenderPanel();
    EdBar();
    Draw();
  }

  function EdReturn() { StopLoop(); EdShow(); }
  function EdSync() {
    GS.lv = BuildCustom(ED.d); GS.time = 0;
    GS.skin = ED.d.sk ? SKINS[ED.d.sk - 1] : PickSkin();
    Stand(GS.lv.sx, GS.lv.sy);
  }
  function EdOk() { return ED.v === Hash(ED.d); }
  function EdDraw() { if (!_edRaf) _edRaf = requestAnimationFrame(() => { _edRaf = 0; if (GS && GS.status === 'editor') Draw(); }); }

  function EdBar() {
    ById('gf-hk-ed-undo').disabled = !ED.undo.length;
    ById('gf-hk-ed-redo').disabled = !ED.redo.length;
    ById('gf-hk-ed-grid').classList.toggle('on', ED.snap);
    ById('gf-hk-ed-share').classList.toggle('off', !EdOk());
    SetText('gf-hk-ed-zl', `${Math.round(ED.z * 100)}%`);
  }

  function EdSave() {
    const a = Customs();
    let r = a.find(x => x.id === ED.id);
    if (!r) {
      if (a.length >= MAX_CUSTOM) { Toast(_GameText('hk_err_full'), 1); return; }
      a.push(r = { id: ED.id = NewId(), v: '', bt: 0, im: 0 });
    }
    r.d = ED.d; r.v = ED.v; r.at = Date.now();
    SaveCustoms(a);
  }

  function Commit() {
    const j = JSON.stringify(ED.d);
    if (j !== ED.last) {
      ED.undo.push(ED.last);
      if (ED.undo.length > 150) ED.undo.shift();
      ED.redo.length = 0;
      ED.last = j;
      EdSave();
    }
    EdSync();
    if (ED.sel.length) SyncPanel(); else RenderPanel();
    EdBar();
    EdDraw();
  }

  const Fixed = s => s.t === 's' || s.t === 'f' || s.t === 'y';
  function Exists(s) { return Fixed(s) || !!ED.d[s.t][s.i]; }

  function UndoRedo(from, to) {
    if (!from.length) return;
    to.push(ED.last);
    ED.last = from.pop();
    ED.d = JSON.parse(ED.last);
    ED.hov = null;
    ED.sel = ED.sel.filter(Exists);
    ById('gf-hk-ed-name').value = ED.d.n;
    EdSave();
    EdSync();
    RenderPanel();
    EdBar();
    EdDraw();
  }

  function El(s) { return s.t === 's' || s.t === 'f' ? ED.d[s.t] : s.t === 'y' ? ED.d.kh : ED.d[s.t][s.i]; }
  function FixEl(s) { if (Fixed(s)) FixSF(ED.d, s.t); else FIX[s.t](El(s)); }
  function Sn(v) { const g = ED.snap ? GRID : Q; return Math.round(v / g) * g; }
  function Count() { return Total(ED.d); }
  const Same = (a, b) => a.t === b.t && a.i === b.i;
  function Has(r) { return ED.sel.some(s => Same(s, r)); }
  function One() { return ED.sel.length === 1 ? ED.sel[0] : null; }

  function Select(list) { ED.sel = list; RenderPanel(); EdDraw(); }
  function SelAll() {
    const out = [{ t: 's' }, { t: 'f' }];
    for (const t of ALL_T) ED.d[t].forEach((e, i) => out.push({ t, i }));
    ED.tool = 'sel'; SetTool('sel');
    Select(out);
  }
  function SetTool(t) {
    ED.tool = t;
    ById('gf-hk-ed-tools').querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    Cursor(ED.hov);
    EdDraw();
  }
  function ToggleSnap() { ED.snap = !ED.snap; StorageSet(LS_SNAP, ED.snap); EdBar(); EdDraw(); }

  function GoFinish() {
    const f = ED.d.f;
    ED.x = f[0]; ED.y = f[2] ? f[1] : f[1] - 70;
    ClampCam();
    Select([{ t: 'f' }]);
    EdBar();
  }

  function PF() {
    const S = ED.sel, t = S.length && S.every(s => s.t === S[0].t) ? S[0].t : '';
    if (!t) return XY;
    return t === 'f' && !ED.d.f[2] ? XY : FIELDS[t];
  }

  function RenderPanel() {
    const T = _GameText, S = ED.sel, pn = ById('gf-hk-ed-panel'), d = ED.d;
    if (!S.length) {
      const ok = EdOk();
      pn.innerHTML = `<div class="gf-hk-pt">${T('hk_level_props')}</div><div class="gf-hk-pl">${T('hk_theme')}</div>
        <div class="gf-hk-sw">${THEMES.map((th, i) => `<button data-pal="${i}" class="${i === d.c ? 'on' : ''}" title="${T(th.key)}" style="background:linear-gradient(160deg,${th.sky[0]} 0 45%,${th.hill[2]} 46%)"></button>`).join('')}</div>
        <div class="gf-hk-pl">${T('hk_skin_map')}</div>
        <select class="gf-hk-psel" data-sk="1"><option value="0">${T('hk_skin_player')}</option>${SKINS.map((k, i) => `<option value="${i + 1}"${d.sk === i + 1 ? ' selected' : ''}>${T(k.key)}</option>`).join('')}</select>
        <div class="gf-hk-pf gf-hk-pf1"><label><span>${T('hk_kill_y')}</span><input type="number" data-lk="1" step="5" value="${d.kh[0]}"></label></div>
        <div class="gf-hk-st${ok ? ' ok' : ''}">${T(ok ? 'hk_ready_share' : 'hk_need_clear')}</div>
        <div class="gf-hk-pc">${[...ALL_T].filter(t => t === 'h' || d[t].length).map(t => `<span title="${T(EL_KEY[t])}">${IC[t]}${d[t].length}</span>`).join('')}</div>`;
      return;
    }
    const one = One(), F = PF(), del = S.some(s => !Fixed(s));
    pn.innerHTML = `<div class="gf-hk-pt">${one ? T(EL_KEY[one.t]) : `${S.length} ${T('hk_selected')}`}</div>
      ${one && one.t === 'f' ? `<div class="gf-hk-pl">${T('hk_goal_style')}</div><div class="gf-hk-ft">${FT_KEY.map((k, i) => `<button class="gf-hk-eb${d.f[2] === i ? ' on' : ''}" data-ft="${i}" title="${T(k)}">${IC[`ft${i}`]}</button>`).join('')}</div>` : ''}
      <div class="gf-hk-pf${F.length === 1 ? ' gf-hk-pf1' : ''}">${F.map((f, k) => `<label><span>${f[0].length > 1 ? T(f[0]) : f[0]}</span><input type="number" data-k="${k}" step="${f[1]}"></label>`).join('')}</div>
      ${!one && F === XY && S.some(s => s.t !== S[0].t) ? `<div class="gf-hk-pl gf-hk-pn">${T('hk_shared')}</div>` : ''}
      ${del ? `<div class="gf-hk-pa"><button class="gf-hk-eb" data-act="dup" title="${T('hk_duplicate')} (Ctrl+D)">${IC.dup}${T('hk_duplicate')}</button><button class="gf-hk-eb gf-hk-eb-del" data-act="del" title="${T('hk_delete')} (Del)">${IC.del}</button></div>` : ''}`;
    SyncPanel();
  }

  function SyncPanel() {
    const S = ED.sel, F = PF();
    if (!S.length) return;
    ById('gf-hk-ed-panel').querySelectorAll('input[data-k]').forEach(inp => {
      const k = +inp.dataset.k, f = F[k];
      if (!f) return;
      const i = f[3] ?? k, sc = f[2] || 1, v = El(S[0])[i], same = S.every(s => El(s)[i] === v);
      inp.value = same ? +(v * sc).toFixed(1) : '';
      inp.placeholder = same ? '' : '-';
    });
  }

  function PanelInput(inp) {
    const v = parseFloat(inp.value);
    if (inp.dataset.lk) {
      if (Number.isFinite(v)) { ED.d.kh[0] = v; FixSF(ED.d, 'y'); }
      Commit();
      return;
    }
    if (inp.dataset.sk) { ED.d.sk = +inp.value; Commit(); return; }
    const S = ED.sel, F = PF(), f = F[+inp.dataset.k];
    if (!S.length || !f || !Number.isFinite(v)) { SyncPanel(); return; }
    const i = f[3] ?? +inp.dataset.k;
    for (const s of S) { El(s)[i] = v / (f[2] || 1); FixEl(s); }
    Commit();
    if (S.some(s => s.t in MOV_I)) RenderPanel();
  }

  function DelSel() {
    const S = ED.sel.filter(s => !Fixed(s)).sort((a, b) => b.i - a.i);
    if (!S.length) return;
    for (const s of S) ED.d[s.t].splice(s.i, 1);
    ED.sel = [];
    ED.hov = null;
    Commit();
  }

  function DupSel() {
    const S = ED.sel.filter(s => !Fixed(s)), add = {};
    if (!S.length) return;
    for (const s of S) add[s.t] = (add[s.t] || 0) + 1;
    if (Count() + S.length > MAX_ALL || Object.keys(add).some(t => ED.d[t].length + add[t] > MAX_N[t])) { Toast(_GameText('hk_limit'), 1); return; }
    ED.sel = S.map(s => { const c = El(s).slice(); c[0] += 40; c[1] += 40; ED.d[s.t].push(FIX[s.t](c)); return { t: s.t, i: ED.d[s.t].length - 1 }; });
    RenderPanel();
    Commit();
  }

  function ClearAll() {
    for (const t of ALL_T) ED.d[t] = [];
    ED.sel = [];
    ED.hov = null;
    Commit();
  }

  function EdBack() { ShowCustom(ED.id); }

  function EdTest() {
    EdSave();
    GS.custom = JSON.parse(JSON.stringify(ED.d)); GS.cid = ED.id; GS.test = true;
    LoadLevel(1);
    ShowScreen(null);
    StartLoop();
  }

  function EdShare() {
    if (EdOk()) CopyCode(ED.d);
    else Toast(_GameText('hk_need_clear'), 1);
  }

  function ClampCam() { ED.x = Math.max(-2500, Math.min(12500, ED.x)); ED.y = Math.max(-1600, Math.min(1800, ED.y)); }
  function Zoom(f, lx = CV_W / 2, ly = CV_H / 2) {
    const z = Math.max(0.2, Math.min(2, ED.z * f)), wx = ED.x + (lx - CV_W / 2) / ED.z, wy = ED.y + (ly - CV_H / 2) / ED.z;
    ED.z = z; ED.x = wx - (lx - CV_W / 2) / z; ED.y = wy - (ly - CV_H / 2) / z;
    ClampCam(); EdBar(); EdDraw();
  }
  function FitView() { FitCam(); EdBar(); EdDraw(); }

  function FinBB(e) {
    const [x, y, t] = e;
    return t === 0 ? [x - 16, y - 140, x + 200, y] : t === 1 ? [x - 52, y - 52, x + 52, y + 52] : t === 2 ? [x - 82, y - 70, x + 92, y + 24] : [x - 36, y - 36, x + 36, y + 36];
  }
  function BB(t, e) {
    const [x, y] = e;
    if (t === 'b' || t === 'z' || t === 'w') return [x, y, x + e[2], y + e[3]];
    if (t === 'u') return [x, y, x + e[2], y + 20];
    if (t === 'p' || t === 'j') { const q = PadEnds(e); return [Math.min(q[0], q[2]) - 9, Math.min(q[1], q[3]) - 9, Math.max(q[0], q[2]) + 9, Math.max(q[1], q[3]) + 9]; }
    if (t === 's') return [x - 14, y - 54, x + 14, y + 4];
    if (t === 'f') return FinBB(e);
    if (t === 'q') return [x - 12, y - 82, x + 34, y + 2];
    const r = t === 'x' ? e[2] / 2 + 14 : t === 'o' ? 34 : t === 't' ? 17 : 15;
    return [x - r, y - r, x + r, y + r];
  }

  function FitCam() {
    const d = ED.d, lo = d.s[0] - 150, hi = d.f[0] + 200, xs = [d.s[0] - 120, hi], ys = [d.s[1] - 80, d.f[1], d.kh[0] + 20];
    for (const t of ALL_T) for (const e of d[t]) {
      const b = BB(t, e);
      if (t === 'b' || t === 'z' || t === 'w') { xs.push(Math.max(b[0], lo), Math.min(b[2], hi)); ys.push(Math.max(b[1], -200)); }
      else { xs.push(b[0], b[2]); ys.push(b[1]); }
      if (t === 'h' && (e[2] || e[3])) { xs.push(e[0] - Math.abs(e[2]), e[0] + Math.abs(e[2])); ys.push(e[1] - Math.abs(e[3])); }
    }
    const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 20;
    ED.z = Math.max(0.3, Math.min(1.2, (CV_W - 230) / (x1 - x0), (CV_H - 100) / (y1 - y0)));
    ED.x = Math.min((x0 + x1) / 2 + 65 / ED.z, x0 + 324 / ED.z); ED.y = (y0 + y1) / 2;
    ClampCam();
  }

  function EdPt(e) {
    const r = _cv.getBoundingClientRect(), lx = (e.clientX - r.left) * CV_W / r.width, ly = (e.clientY - r.top) * CV_H / r.height;
    return [ED.x + (lx - CV_W / 2) / ED.z, ED.y + (ly - CV_H / 2) / ED.z, lx, ly];
  }

  function PadDist(r, px, py) { const [x1, y1, x2, y2] = PadEnds(r); return Math.sqrt(SegD2(px, py, x1, y1, x2, y2)); }

  function Handles(s) {
    const e = El(s), t = s.t, R = Math.PI / 180;
    if (t === 'b' || t === 'z' || t === 'w') {
      const out = [];
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i || j) out.push([e[0] + (i + 1) / 2 * e[2], e[1] + (j + 1) / 2 * e[3], [i, j]]);
      return out;
    }
    if (t === 'u') return [[e[0], e[1] + 10, [-1, 0]], [e[0] + e[2], e[1] + 10, [1, 0]]];
    if (t === 'p' || t === 'j') { const q = PadEnds(e); return [[q[0], q[1], -1], [q[2], q[3], 1]]; }
    const out = [];
    if (t in ANG_I) { const a = e[ANG_I[t]] * R, r = t === 'x' ? e[2] / 2 : t === 't' ? 42 : 46; out.push([e[0] + Math.cos(a) * r, e[1] + Math.sin(a) * r, 'a']); }
    if (t in MOV_I && (t !== 'f' || e[2])) { const i = MOV_I[t]; if (e[i] || e[i + 1]) out.push([e[0] + e[i], e[1] + e[i + 1], 'm']); }
    return out;
  }

  function Knob(d) { return [d.f[0], d.f[2] ? d.f[1] : d.f[1] - 26]; }
  function KillTab() { return [ED.x - CV_W / 2 / ED.z + 64 / ED.z, ED.d.kh[0]]; }

  function InFin(d, x, y) {
    const [f0, f1, t] = d.f;
    if (t === 0) return Math.abs(x - f0) < 18 && y < f1 + 4 || x > f0 + 102 && x < f0 + 198 && y > f1 - 100 && y < f1;
    if (t === 2) return x > f0 - 82 && x < f0 + 82 && y > f1 - 4 && y < f1 + 24 || x > f0 + 55 && x < f0 + 95 && y > f1 - 72 && y < f1;
    return Math.hypot(x - f0, y - f1) < (t === 1 ? 54 : 36);
  }

  function Pick(x, y) {
    const d = ED.d, z = ED.z, tol = 6 / z, one = One();
    if (one) for (const h of Handles(one)) if (Math.abs(x - h[0]) < tol + 1 / z && Math.abs(y - h[1]) < tol + 1 / z) return { ...one, hd: h[2] };
    const k = Knob(d);
    if (Math.hypot(x - k[0], y - k[1]) < 16 / z) return { t: 'f' };
    const kt = KillTab();
    if (Math.abs(x - kt[0]) < 26 / z && Math.abs(y - kt[1]) < 12 / z) return { t: 'y' };
    if (Math.abs(x - d.s[0]) < 14 && y > d.s[1] - 54 && y < d.s[1] + 4) return { t: 's' };
    for (const t of 'hto') for (let i = d[t].length - 1; i >= 0; i--) { const e = d[t][i]; if (Math.hypot(x - e[0], y - e[1]) < (t === 'h' ? 15 : t === 't' ? 18 : 30) + tol) return { t, i }; }
    for (let i = d.q.length - 1; i >= 0; i--) { const b = BB('q', d.q[i]); if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return { t: 'q', i }; }
    for (let i = d.x.length - 1; i >= 0; i--) { const e = d.x[i]; if (PadDist([e[0], e[1], e[2], e[3]], x, y) < 14 + tol) return { t: 'x', i }; }
    for (let i = d.p.length - 1; i >= 0; i--) if (PadDist(d.p[i], x, y) < PAD_R + tol) return { t: 'p', i };
    for (let i = d.j.length - 1; i >= 0; i--) if (PadDist(d.j[i], x, y) < 6 + tol) return { t: 'j', i };
    if (InFin(d, x, y)) return { t: 'f' };
    if (Math.abs(y - d.kh[0]) < 5 / z) return { t: 'y' };
    for (const t of 'uzbw') for (let i = d[t].length - 1; i >= 0; i--) {
      const b = BB(t, d[t][i]);
      if (x > b[0] - tol && x < b[2] + tol && y > b[1] - tol && y < b[3] + tol) return { t, i };
    }
    return null;
  }

  function Cursor(h) {
    const g = ED.drag, hd = h && h.hd;
    const c = g && g.m === 'pan' ? 'grabbing' : ED.space ? 'grab' : g && g.m === 'box' ? 'crosshair' : Array.isArray(hd) ? (hd[0] * hd[1] > 0 ? 'nwse-resize' : hd[0] * hd[1] < 0 ? 'nesw-resize' : hd[0] ? 'ew-resize' : 'ns-resize')
      : hd != null ? 'crosshair' : h && h.t === 'y' ? 'ns-resize' : h || g ? 'move' : ED.tool === 'sel' ? 'default' : 'crosshair';
    if (c !== _cur) _view.style.cursor = _cur = c;
  }

  function EdDown(e) {
    if (!ED || GS.status !== 'editor') return;
    const a = document.activeElement;
    if (a && a !== document.body && _root.contains(a)) a.blur();
    e.preventDefault();
    _cv.setPointerCapture(e.pointerId);
    const [x, y] = EdPt(e), add = e.shiftKey || e.ctrlKey || e.metaKey, hit = e.button || ED.space ? null : Pick(x, y);
    if (e.button === 1 || e.button === 2 || ED.space) {
      ED.drag = { m: 'pan', x: e.clientX, y: e.clientY, cx: ED.x, cy: ED.y };
      Cursor(null);
      return;
    }
    if (e.button) return;
    if (!hit && ED.tool === 'sel') {
      ED.drag = { m: 'box', x0: x, y0: y, x1: x, y1: y, base: add ? ED.sel.filter(s => s.t !== 'y') : [] };
      if (!add && ED.sel.length) Select([]);
      Cursor(null);
      EdDraw();
      return;
    }
    if (hit) {
      const r = { t: hit.t, i: hit.i };
      if (hit.hd != null) ED.drag = { m: 'hd', hd: hit.hd, o: El(r).slice() };
      else {
        if (r.t === 'y') Select([r]);
        else if (add) {
          if (Has(r)) { Select(ED.sel.filter(s => !Same(s, r))); Cursor(hit); return; }
          Select([...ED.sel.filter(s => s.t !== 'y'), r]);
        } else if (!Has(r)) Select([r]);
        const el = El(r);
        ED.drag = { m: 'mv', x0: x, y0: y, ax: el[0], ay: r.t === 'y' ? el[0] : el[1], o: ED.sel.map(s => El(s).slice()) };
      }
    } else Place(x, y);
    Cursor(hit);
    EdDraw();
  }

  function Place(x, y) {
    const t = ED.tool, d = ED.d, gx = Sn(x), gy = Sn(y);
    if (t === 's' || t === 'f') {
      d[t][0] = gx; d[t][1] = gy;
      FixSF(d, t);
      Select([{ t }]);
      ED.drag = { m: 'mv', x0: x, y0: y, ax: d[t][0], ay: d[t][1], o: [d[t].slice()] };
      EdSync();
      return;
    }
    if (d[t].length >= MAX_N[t] || Count() >= MAX_ALL) { Toast(_GameText('hk_limit'), 1); return; }
    const D = { h: [gx, gy, 0, 0, 20, 0], p: [gx, gy, 140, 15], b: [gx, gy, 10, 10], z: [gx, gy, 10, 10], w: [gx, gy, 10, 10, -90, 8], t: [gx, gy, 180, 15, 400, 0],
      x: [gx, gy, 160, 0, 90, 0, 0, 20], u: [gx - 70, gy - 10, 140], o: [gx, gy, 0], j: [gx, gy, 140, 0], q: [gx, gy] }[t];
    const rect = t === 'b' || t === 'z' || t === 'w';
    d[t].push(rect ? D : FIX[t](D));
    Select([{ t, i: d[t].length - 1 }]);
    ED.drag = rect ? { m: 'new', x0: gx, y0: gy } : { m: 'mv', x0: x, y0: y, ax: D[0], ay: D[1], o: [D.slice()] };
    EdSync();
  }

  function BoxSel(g) {
    const x0 = Math.min(g.x0, g.x1), x1 = Math.max(g.x0, g.x1), y0 = Math.min(g.y0, g.y1), y1 = Math.max(g.y0, g.y1), d = ED.d, out = g.base.slice();
    const Try = (t, e, i) => {
      const b = BB(t, e), r = i == null ? { t } : { t, i };
      if (b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1 && !out.some(s => Same(s, r))) out.push(r);
    };
    Try('s', d.s); Try('f', d.f);
    for (const t of ALL_T) d[t].forEach((e, i) => Try(t, e, i));
    ED.sel = out;
  }

  function EdMove(e) {
    if (!ED || GS.status !== 'editor') return;
    const [x, y] = EdPt(e), g = ED.drag;
    ED.ptr = [x, y];
    if (!g) { ED.hov = Pick(x, y); Cursor(ED.hov); EdDraw(); return; }
    if (g.m === 'pan') {
      const k = CV_W / _cv.getBoundingClientRect().width / ED.z;
      ED.x = g.cx - (e.clientX - g.x) * k; ED.y = g.cy - (e.clientY - g.y) * k;
      ClampCam(); EdDraw();
      return;
    }
    if (g.m === 'box') { g.x1 = x; g.y1 = y; BoxSel(g); EdDraw(); return; }
    const s = ED.sel[0], el = El(s), t = s.t, mx = Sn(x), my = Sn(y);
    if (g.m === 'mv') {
      const dx = Sn(g.ax + x - g.x0) - g.ax, dy = Sn(g.ay + y - g.y0) - g.ay;
      ED.sel.forEach((q, k) => {
        const a = El(q), o = g.o[k];
        if (q.t === 'y') a[0] = o[0] + dy; else { a[0] = o[0] + dx; a[1] = o[1] + dy; }
        FixEl(q);
      });
    } else if (g.m === 'new') { el[0] = Math.min(g.x0, mx); el[1] = Math.min(g.y0, my); el[2] = Math.abs(mx - g.x0); el[3] = Math.abs(my - g.y0); }
    else if (g.hd === 'm') { const i = MOV_I[t]; el[i] = mx - el[0]; el[i + 1] = my - el[1]; }
    else if (g.hd === 'a') { el[ANG_I[t]] = Math.atan2(y - el[1], x - el[0]) * 180 / Math.PI; if (t === 'x') el[2] = Math.hypot(x - el[0], y - el[1]) * 2; }
    else if (t === 'p' || t === 'j') {
      const q = PadEnds(g.o), fx = g.hd > 0 ? q[0] : q[2], fy = g.hd > 0 ? q[1] : q[3];
      let a = Math.atan2((my - fy) * g.hd, (mx - fx) * g.hd) * 180 / Math.PI;
      if (t === 'p') { if (a > 90) a -= 180; else if (a < -90) a += 180; }
      el[0] = (fx + mx) / 2; el[1] = (fy + my) / 2; el[2] = Math.hypot(mx - fx, my - fy); el[3] = a;
    } else if (t === 'u') {
      const o = g.o;
      let x0 = o[0], x1 = o[0] + o[2];
      if (g.hd[0] < 0) x0 = Math.min(mx, x1 - 40); else x1 = Math.max(mx, x0 + 40);
      el[0] = x0; el[2] = x1 - x0;
    } else {
      const [i, j] = g.hd, o = g.o;
      let x0 = o[0], y0 = o[1], x1 = o[0] + o[2], y1 = o[1] + o[3];
      if (i < 0) x0 = Math.min(mx, x1 - 10); else if (i > 0) x1 = Math.max(mx, x0 + 10);
      if (j < 0) y0 = Math.min(my, y1 - 10); else if (j > 0) y1 = Math.max(my, y0 + 10);
      el[0] = x0; el[1] = y0; el[2] = x1 - x0; el[3] = y1 - y0;
    }
    if (g.m === 'hd') FixEl(s);
    EdSync();
    SyncPanel();
    EdDraw();
  }

  function EdUp() {
    if (!ED || !ED.drag) return;
    const g = ED.drag;
    ED.drag = null;
    if (g.m === 'box') { RenderPanel(); Cursor(ED.hov); EdDraw(); return; }
    if (g.m === 'new') {
      const s = ED.sel[0], el = El(s);
      if (el[2] < 15 && el[3] < 15) { const D = { b: [80, 20, 160, 40], z: [60, 10, 120, 20], w: [60, 200, 120, 200] }[s.t]; el.splice(0, 4, g.x0 - D[0], g.y0 - D[1], D[2], D[3]); }
      FixEl(s);
    }
    if (g.m !== 'pan') Commit();
    Cursor(ED.hov);
    EdDraw();
  }

  function EdLeave() { if (ED && !ED.drag) { ED.ptr = null; ED.hov = null; EdDraw(); } }

  function EdWheel(e) {
    if (!ED || GS.status !== 'editor') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { ED.x += (e.deltaX || e.deltaY) / ED.z; ClampCam(); EdDraw(); return; }
    const p = EdPt(e);
    Zoom(Math.exp(-Math.max(-300, Math.min(300, e.deltaY)) * 0.0015), p[2], p[3]);
  }

  function EdKey(e) {
    const k = e.key;
    if (k === ' ') {
      e.preventDefault();
      if (e.type === 'keypress' || e.repeat) return;
      ED.space = e.type === 'keydown';
      Cursor(ED.hov);
      return;
    }
    if (e.type !== 'keydown') return;
    const c = e.ctrlKey || e.metaKey, lk = k.toLowerCase();
    let ok = true;
    if (c && lk === 'z') { if (e.shiftKey) UndoRedo(ED.redo, ED.undo); else UndoRedo(ED.undo, ED.redo); }
    else if (c && lk === 'y') UndoRedo(ED.redo, ED.undo);
    else if (c && lk === 'd') DupSel();
    else if (c && lk === 'a') SelAll();
    else if (c || e.altKey) ok = false;
    else if (k === 'Delete' || k === 'Backspace') DelSel();
    else if (k === 'Escape') { if (ED.sel.length) Select([]); else SetTool('sel'); }
    else if (k >= '1' && k <= '9') SetTool(TOOLS[k - 1]);
    else if (lk === 'g') ToggleSnap();
    else if (lk === 'f') GoFinish();
    else if (k === '+' || k === '=') Zoom(1.25);
    else if (k === '-' || k === '_') Zoom(0.8);
    else if (k === '0' || k === 'Home') FitView();
    else if (k === 'Enter') EdTest();
    else if (k === '?') OpenHelp();
    else if (k.startsWith('Arrow')) {
      const dx = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0, dy = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0;
      if (ED.sel.length) {
        const st = (ED.snap ? GRID : Q) * (e.shiftKey ? 5 : 1);
        for (const s of ED.sel) { const el = El(s); if (s.t === 'y') el[0] += dy * st; else { el[0] += dx * st; el[1] += dy * st; } FixEl(s); }
        Commit();
      } else { ED.x += dx * 80 / ED.z; ED.y += dy * 80 / ED.z; ClampCam(); EdDraw(); }
    } else ok = false;
    if (ok) e.preventDefault();
  }

  function DrawEditor() {
    const ctx = _ctx, dark = _root.dataset.theme === 'dark', C = Pal(dark), z = ED.z, d = ED.d, ky = d.kh[0], lv = GS.lv;
    Backdrop(ctx, dark, lv.th, ED.x, ED.y);
    World(ctx, _k * z, _k * (CV_W / 2 - ED.x * z), _k * (CV_H / 2 - ED.y * z));
    const hw = CV_W / 2 / z, hh = CV_H / 2 / z, vl = ED.x - hw, vr = ED.x + hw, vt = ED.y - hh, vb = ED.y + hh;
    if (vb > ky) { ctx.fillStyle = C.kill; ctx.fillRect(vl, ky, vr - vl, vb - ky); }
    DrawWorld(ctx, C, vl - 60, vr + 60, vt - 60, vb + 60);
    if (ED.snap) {
      for (const [g, col] of [[GRID, C.grid], [100, C.grid2]]) {
        if (g * z < 7) continue;
        ctx.beginPath();
        for (let x = Math.ceil(vl / g) * g; x <= vr; x += g) { ctx.moveTo(x, vt); ctx.lineTo(x, vb); }
        for (let y = Math.ceil(vt / g) * g; y <= vb; y += g) { ctx.moveTo(vl, y); ctx.lineTo(vr, y); }
        ctx.strokeStyle = col; ctx.lineWidth = 1 / z; ctx.stroke();
      }
    }
    ctx.lineWidth = 1.4 / z; ctx.setLineDash([6 / z, 5 / z]); ctx.strokeStyle = C.hudSub;
    ctx.beginPath();
    for (const u of lv.turrets) { const r = Math.min(u.life * u.spd, 2400); ctx.moveTo(u.mx, u.my); ctx.lineTo(u.mx + u.dx * r, u.my + u.dy * r); }
    for (const s of lv.spins) if (s.w) { ctx.moveTo(s.x + s.len / 2 + 12, s.y); ctx.arc(s.x, s.y, s.len / 2 + 12, 0, TAU); }
    for (const w of lv.winds) { ctx.rect(w.x, w.y, w.w, w.h); const cx = w.x + w.w / 2, cy = w.y + w.h / 2; ctx.moveTo(cx - w.dx * 20, cy - w.dy * 20); ctx.lineTo(cx + w.dx * 20, cy + w.dy * 20); ctx.lineTo(cx + w.dx * 10 - w.dy * 8, cy + w.dy * 10 + w.dx * 8); ctx.moveTo(cx + w.dx * 20, cy + w.dy * 20); ctx.lineTo(cx + w.dx * 10 + w.dy * 8, cy + w.dy * 10 - w.dx * 8); }
    ctx.stroke();
    const ks = ED.sel.some(s => s.t === 'y') || ED.hov && ED.hov.t === 'y';
    ctx.strokeStyle = ks ? '#ef4444' : 'rgba(239,68,68,0.6)'; ctx.lineWidth = (ks ? 2.6 : 1.6) / z; ctx.setLineDash([8 / z, 6 / z]);
    ctx.beginPath(); ctx.moveTo(vl, ky); ctx.lineTo(vr, ky); ctx.stroke();
    ctx.setLineDash([]);
    const [kx] = KillTab(), u = 1 / z;
    ctx.fillStyle = ks ? '#dc2626' : '#ef4444'; RR(ctx, kx - 24 * u, ky - 10 * u, 48 * u, 20 * u, 7 * u); ctx.fill();
    ctx.lineWidth = 1.5 * u; ctx.strokeStyle = '#7f1d1d'; ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(kx - 16 * u, ky + sd * 1.5 * u); ctx.lineTo(kx - 12 * u, ky + sd * 6.5 * u); ctx.lineTo(kx - 8 * u, ky + sd * 1.5 * u); ctx.fill(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8 * u;
    ctx.beginPath(); ctx.moveTo(kx - 3 * u, ky - 4 * u); ctx.lineTo(kx + 5 * u, ky + 4 * u); ctx.moveTo(kx + 5 * u, ky - 4 * u); ctx.lineTo(kx - 3 * u, ky + 4 * u);
    ctx.moveTo(kx + 10 * u, ky - 4 * u); ctx.lineTo(kx + 18 * u, ky + 4 * u); ctx.moveTo(kx + 18 * u, ky - 4 * u); ctx.lineTo(kx + 10 * u, ky + 4 * u); ctx.stroke();
    const one = One();
    if (one && (one.t === 'h' || one.t === 's')) {
      const e = El(one);
      ctx.strokeStyle = C.hudSub; ctx.lineWidth = 1.2 / z; ctx.setLineDash([3 / z, 6 / z]);
      ctx.beginPath(); ctx.arc(e[0], one.t === 's' ? e[1] - 29 : e[1], REACH, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!ED.drag && !ED.hov && ED.ptr && ED.tool !== 'sel' && !ED.space) Ghost(ctx, C, Sn(ED.ptr[0]), Sn(ED.ptr[1]), vt);
    const hv = ED.hov && !ED.drag && !Has(ED.hov) ? ED.hov : null;
    if (hv && hv.t !== 'y') Outline(ctx, hv, true, vt);
    for (const s of ED.sel) if (s.t !== 'y') Outline(ctx, s, false, vt);
    if (one && one.t !== 'y') Grips(ctx, one);
    const fk = Knob(d), fs = Has({ t: 'f' }), fh = hv && hv.t === 'f';
    ctx.fillStyle = 'rgba(20,16,34,0.25)'; ctx.beginPath(); ctx.arc(fk[0] + u, fk[1] + 2 * u, 12 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = fs ? ACCENT : fh ? '#f9a8d4' : '#ffffff'; ctx.beginPath(); ctx.arc(fk[0], fk[1], 12 * u, 0, TAU); ctx.fill();
    ctx.lineWidth = 2 * u; ctx.strokeStyle = fs ? '#ffffff' : ACCENT; ctx.stroke();
    ctx.fillStyle = fs ? '#ffffff' : ACCENT;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(fk[0] + c * 8.5 * u, fk[1] + s * 8.5 * u); ctx.lineTo(fk[0] + (c * 4.5 - s * 3.5) * u, fk[1] + (s * 4.5 + c * 3.5) * u); ctx.lineTo(fk[0] + (c * 4.5 + s * 3.5) * u, fk[1] + (s * 4.5 - c * 3.5) * u); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(fk[0], fk[1], 2 * u, 0, TAU); ctx.fill();
    const g = ED.drag;
    if (g && g.m === 'box') {
      ctx.fillStyle = C.sel; ctx.fillRect(Math.min(g.x0, g.x1), Math.min(g.y0, g.y1), Math.abs(g.x1 - g.x0), Math.abs(g.y1 - g.y0));
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.4 * u; ctx.setLineDash([5 * u, 4 * u]);
      ctx.strokeRect(Math.min(g.x0, g.x1), Math.min(g.y0, g.y1), Math.abs(g.x1 - g.x0), Math.abs(g.y1 - g.y0));
      ctx.setLineDash([]);
    }
  }

  function Ghost(ctx, C, x, y, vt) {
    const t = ED.tool, ft = ED.d.f[2];
    ctx.globalAlpha = 0.5;
    if (t === 'h') Put(ctx, SP.ball, x, y);
    else if (t === 'b') { ctx.fillStyle = C.block; RR(ctx, x - 80, y - 20, 160, 40, 9); ctx.fill(); }
    else if (t === 'z') { ctx.fillStyle = C.haz; ctx.beginPath(); HazPath(ctx, { x: x - 60, y: y - 10, w: 120, h: 20 }); ctx.fill(); }
    else if (t === 'w') { ctx.fillStyle = C.wind; ctx.fillRect(x - 60, y - 200, 120, 200); Put(ctx, SP.fan, x, y + 6); }
    else if (t === 'p') { const q = PadEnds([x, y, 140, 15]); ctx.strokeStyle = C.pad; ctx.lineWidth = PAD_R * 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    else if (t === 'j') { ctx.strokeStyle = C.wall; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 70, y); ctx.lineTo(x + 70, y); ctx.stroke(); }
    else if (t === 's') { ctx.fillStyle = C.man; ctx.beginPath(); ctx.arc(x, y - 45, 6.4, 0, TAU); ctx.fill(); ctx.fillRect(x - 2.3, y - 38, 4.6, 38); }
    else if (t === 't') { Put(ctx, SP.tbase, x, y); Rot(ctx, x, y, Math.PI); Put(ctx, SP.barrel, 15, 0); Unrot(ctx); }
    else if (t === 'x') { const b = Bar(160); ctx.drawImage(b.c, x - b.w / 2, y - b.h / 2, b.w, b.h); Put(ctx, SP.hub, x, y); }
    else if (t === 'u') { for (let i = 0; i < 7; i++) ctx.drawImage(SP.tiles[i % 3].c, x - 71 + i * 20, y - 11, 22, 22); }
    else if (t === 'o') Put(ctx, SP.boost, x, y);
    else if (t === 'q') Flag(ctx, x, y - 6, 72, '#94a3b8', 0, false);
    else if (ft === 1) Put(ctx, SP.hoop, x, y);
    else if (ft === 2) Put(ctx, SP.plat, x, y + 11);
    else if (ft === 3) Put(ctx, SP.target, x, y);
    else { ctx.fillStyle = C.chkB; ctx.fillRect(x - 3, vt, 6, y - vt); }
    ctx.globalAlpha = 1;
  }

  function Outline(ctx, s, hov, vt) {
    const e = El(s), z = ED.z, t = s.t;
    ctx.lineWidth = (hov ? 1.5 : 2) / z;
    ctx.strokeStyle = hov ? 'rgba(236,72,153,0.65)' : ACCENT;
    ctx.setLineDash(hov ? [5 / z, 4 / z] : []);
    ctx.beginPath();
    if (t === 'h' || t === 't' || t === 'o') ctx.arc(e[0], e[1], t === 'h' ? 19 : t === 't' ? 21 : 36, 0, TAU);
    else if (t === 'x') ctx.arc(e[0], e[1], e[2] / 2 + 16, 0, TAU);
    else if (t === 'p' || t === 'j') {
      const q = PadEnds(e), a = e[3] * Math.PI / 180, nx = -Math.sin(a) * 12, ny = Math.cos(a) * 12, ux = Math.cos(a) * 9, uy = Math.sin(a) * 9;
      ctx.moveTo(q[0] - ux + nx, q[1] - uy + ny); ctx.lineTo(q[2] + ux + nx, q[3] + uy + ny);
      ctx.lineTo(q[2] + ux - nx, q[3] + uy - ny); ctx.lineTo(q[0] - ux - nx, q[1] - uy - ny); ctx.closePath();
    } else if (t === 'f' && !e[2]) ctx.rect(e[0] - 18, Math.max(vt, -1400), 36, e[1] - Math.max(vt, -1400) + 4);
    else { const b = BB(t, e); ctx.rect(b[0] - 3, b[1] - 3, b[2] - b[0] + 6, b[3] - b[1] + 6); }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function Grips(ctx, s) {
    const hs = 4 / ED.z;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = ACCENT; ctx.lineWidth = 2 / ED.z;
    for (const [hx, hy, k] of Handles(s)) {
      if (k === 'a') { ctx.beginPath(); ctx.arc(hx, hy, hs * 1.3, 0, TAU); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2); ctx.strokeRect(hx - hs, hy - hs, hs * 2, hs * 2); }
    }
  }

  function SetHold(v) {
    if (!GS) return;
    GS.hold = v && (GS.status === 'ready' || GS.status === 'playing');
  }

  function OnKey(e) {
    if (!GS || !_root || _root.style.display === 'none' || GS.status === 'editor') return;
    const k = e.key, down = e.type === 'keydown';
    if (k === ' ' || e.code === 'Space') {
      e.preventDefault(); e.stopPropagation();
      if (down && e.repeat) return;
      SetHold(down);
      return;
    }
    if (!down) return;
    if (k === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      const st = GS.status;
      if (GS.test) EdReturn();
      else if (st === 'ready' || st === 'playing' || st === 'dead' || st === 'paused') DoPause();
      else if (st === 'levels') BackFromLevels();
      else if (st === 'custom' || st === 'skins') ShowStart();
      else if (st === 'complete' && GS.custom) ShowCustom();
      else CloseGradeHook();
      return;
    }
    if (k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); DoPause(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); e.stopPropagation(); Restart(); return; }
    if (k === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      const st = GS.status;
      if (st === 'start') Play(GS.level);
      else if (st === 'complete') { if (GS.custom) ToMenu(); else if (GS.level < LEVELS) Next(); else ShowLevels(); }
      else if (st === 'paused') DoPause();
    }
  }

  function OnDown(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    SetHold(true);
  }
  function OnUp(e) {
    if (GS) GS.hold = false;
    if (ED && e && e.type === 'blur') ED.space = false;
  }

  function OnWinKey(e) {
    if (!GS || !_root || _root.style.display === 'none') return;
    const t = e.target, inp = !!t && t.nodeType === 1 && _root.contains(t) && /^(INPUT|TEXTAREA)$/.test(t.tagName), code = CodeOpen() || HelpOpen();
    if (!inp && !code && GS.status !== 'editor') return;
    if (W.GfKeys && ['panel', 'chat', 'arcade'].some(a => W.GfKeys.match(e, a))) return;
    e.stopPropagation();
    if (e.type !== 'keydown') { if (!inp && !code) EdKey(e); return; }
    if (inp) InputKey(e, t);
    else if (code) { if (e.key === 'Escape') { e.preventDefault(); if (HelpOpen()) CloseHelp(); else CloseCode(); } }
    else EdKey(e);
  }

  function InputKey(e, t) {
    const k = e.key;
    if (k !== 'Enter' && k !== 'Escape') return;
    e.preventDefault();
    if (t.id === 'gf-hk-code-in') { if (k === 'Enter') CodeOk(); else CloseCode(); }
    else if (t.classList.contains('gf-hk-ren')) RenameDone(t, k === 'Enter');
    else t.blur();
  }

  function AttachKeys() {
    if (_kh) return;
    _kh = OnKey;
    for (const t of ['keydown', 'keyup', 'keypress']) W.addEventListener(t, OnWinKey, true);
    document.addEventListener('keydown', _kh, true);
    document.addEventListener('keyup', _kh, true);
    W.addEventListener('mouseup', OnUp, true);
    W.addEventListener('blur', OnUp);
    W.addEventListener('resize', Fit);
  }
  function DetachKeys() {
    if (!_kh) return;
    for (const t of ['keydown', 'keyup', 'keypress']) W.removeEventListener(t, OnWinKey, true);
    document.removeEventListener('keydown', _kh, true);
    document.removeEventListener('keyup', _kh, true);
    W.removeEventListener('mouseup', OnUp, true);
    W.removeEventListener('blur', OnUp);
    W.removeEventListener('resize', Fit);
    _kh = null;
  }

  function OnVisibilityChange() {
    if (document.hidden && GS && (GS.status === 'playing' || GS.status === 'ready')) DoPause();
  }

  function ApplyTheme() {
    const el = document.getElementById('gf-hk');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    let n = 0;
    for (let e = _cv; e; e = e.parentElement) if (e !== _view && getComputedStyle(e).filter.includes('invert')) n++;
    _view.style.filter = n % 2 ? 'invert(1) hue-rotate(180deg)' : '';
    if (_thm !== el.dataset.theme) {
      _thm = el.dataset.theme;
      if (GS && GS.intro.length) GS.introC = IntroCard(GS.intro, _thm === 'dark');
      if (HelpOpen()) OpenHelp();
    }
    if (GS && GS.status !== 'playing' && GS.status !== 'ready') Draw();
  }

  function Fit() {
    if (!_cv) return;
    const s = Math.max(0.3, Math.min(1.3, (innerWidth - 34) / CV_W, (innerHeight - 34 - 42) / CV_H));
    const dpr = Math.min(3, W.devicePixelRatio || 1);
    _cv.style.width = `${Math.round(CV_W * s)}px`;
    _cv.style.height = `${Math.round(CV_H * s)}px`;
    _cv.width = Math.round(CV_W * s * dpr);
    _cv.height = Math.round(CV_H * s * dpr);
    _k = _cv.width / CV_W;
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-hk')) return;
    InjectCSS();
    MakeSprites();
    const T = _GameText;
    const root = document.createElement('div');
    root.id = 'gf-hk';
    root.innerHTML = `
<div id="gf-hk-modal">
  <div id="gf-hk-hdr">
    <div class="gf-hk-hl">
      <div id="gf-hk-logo">GH</div>
      <span id="gf-hk-title">${T('hk_title')}</span>
    </div>
    <div class="gf-hk-hr">
      <span id="gf-hk-best-hdr"><span class="gf-hk-best-lbl">${T('game_best').toUpperCase()}</span> <span id="gf-hk-best">1</span></span>
      <button id="gf-hk-pause-btn" title="${T('game_pause_p')}">⏸</button>
      <button id="gf-hk-close" title="${T('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-hk-body">
    <div id="gf-hk-view"><canvas id="gf-hk-canvas"></canvas></div>

    <div id="gf-hk-start" class="gf-hk-scr">
      <div class="gf-hk-scr-title">${T('hk_title')}</div>
      <div class="gf-hk-scr-sub">${T('hk_subtitle')}</div>
      <div class="gf-hk-rules">
        <span><b>1</b>${T('hk_rule_hold')}</span>
        <span><b>2</b>${T('hk_rule_release')}</span>
        <button id="gf-hk-help-btn" title="${T('hk_help')}"><b>?</b>${T('hk_help')}</button>
      </div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn" id="gf-hk-play">▶&nbsp; ${T('game_play')} <span class="gf-hk-dim" id="gf-hk-play-lvl"></span></button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls">${T('game_levels')}</button>
      </div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-edit">${IC.edit}${T('hk_level_editor')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cust">${IC.b}${T('hk_custom')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-skin">${IC.s}${T('hk_skins')}</button>
      </div>
      <div class="gf-hk-scr-footer">${T('hk_footer')}</div>
    </div>

    <div id="gf-hk-levels" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('game_levels')}</div>
      <div id="gf-hk-grid"></div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-back">${T('game_back')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cust2">${IC.b}${T('hk_custom')}</button>
      </div>
    </div>

    <div id="gf-hk-skins" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('hk_skins')}</div>
      <div class="gf-hk-scr-sub">${T('hk_skins_sub')}</div>
      <div id="gf-hk-skgrid"></div>
      <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-skback">${T('game_back')}</button>
    </div>

    <div id="gf-hk-custom" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('hk_custom')}</div>
      <div id="gf-hk-clist"></div>
      <div class="gf-hk-row">
        <button class="gf-hk-btn" id="gf-hk-cnew">${IC.edit}${T('hk_new_level')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cimp">${IC.code}${T('hk_import')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-cback">${T('game_back')}</button>
      </div>
    </div>

    <div id="gf-hk-ed" style="display:none">
      <div class="gf-hk-ed-top">
        <button class="gf-hk-eb" id="gf-hk-ed-back" title="${T('game_back')}">${IC.back}</button>
        <input id="gf-hk-ed-name" maxlength="${NAME_MAX}" spellcheck="false" autocomplete="off" placeholder="${T('hk_level_name')}">
        <span class="gf-hk-ed-sp"></span>
        <button class="gf-hk-eb" id="gf-hk-ed-help" title="${T('hk_help')} (?)">${IC.help}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-undo" title="${T('hk_undo')} (Ctrl+Z)">${IC.undo}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-redo" title="${T('hk_redo')} (Ctrl+Y)">${IC.redo}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-grid" title="${T('hk_grid')} (G)">${IC.grid}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-fit" title="${T('hk_fit')} (0)">${IC.fit}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-gofin" title="${T('hk_find_finish')} (F)">${IC.goal}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-clear" title="${T('hk_clear')}">${IC.del}</button>
        <button class="gf-hk-eb" id="gf-hk-ed-share" title="${T('hk_copy_code')}">${IC.code}${T('hk_copy_code')}</button>
        <button class="gf-hk-eb gf-hk-eb-p" id="gf-hk-ed-test" title="${T('hk_test')} (Enter)">${IC.play}${T('hk_test')}</button>
      </div>
      <div class="gf-hk-ed-tools" id="gf-hk-ed-tools">${TOOLS.map((t, i) => `<button class="gf-hk-eb" data-tool="${t}" aria-label="${T(EL_KEY[t])}">${IC[t]}${i < 9 ? `<small>${i + 1}</small>` : ''}</button>`).join('')}</div>
      <div id="gf-hk-tip"></div>
      <div id="gf-hk-ed-panel"></div>
      <div class="gf-hk-ed-hint">${T('hk_ed_hint2')}</div>
      <div class="gf-hk-ed-zoom">
        <button class="gf-hk-eb" id="gf-hk-ed-zo" title="${T('hk_zoom_out')} (-)">&minus;</button>
        <span id="gf-hk-ed-zl">100%</span>
        <button class="gf-hk-eb" id="gf-hk-ed-zi" title="${T('hk_zoom_in')} (+)">+</button>
      </div>
    </div>

    <div id="gf-hk-code" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-card">
        <div class="gf-hk-scr-h" id="gf-hk-code-h"></div>
        <div class="gf-hk-scr-sub" id="gf-hk-code-sub"></div>
        <textarea id="gf-hk-code-in" spellcheck="false" autocomplete="off" placeholder="${CODE_PRE}..."></textarea>
        <div class="gf-hk-err" id="gf-hk-code-err"></div>
        <div class="gf-hk-row">
          <button class="gf-hk-btn" id="gf-hk-code-ok"></button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-code-x"></button>
        </div>
      </div>
    </div>
    <div id="gf-hk-help" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-card gf-hk-hp">
        <div class="gf-hk-scr-h">${T('hk_help')}</div>
        <div class="gf-hk-hs">${T('hk_help_ctrl')}</div>
        <div class="gf-hk-ctl">
          <span><b>1</b>${T('hk_ctl_hold')}</span>
          <span><b>2</b>${T('hk_ctl_release')}</span>
          <span><b>!</b>${T('hk_ctl_tip')}</span>
          <span><b>⌨</b>${T('hk_ctl_keys')}</span>
        </div>
        <div class="gf-hk-hs">${T('hk_help_el')}</div>
        <div class="gf-hk-hg">${HELP_EL.map(HelpItem).join('')}</div>
        <div class="gf-hk-hs">${T('hk_help_goals')}</div>
        <div class="gf-hk-hg">${HELP_FT.map(HelpItem).join('')}</div>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-help-x">${T('game_back')}</button>
      </div>
    </div>
    <div id="gf-hk-toast"></div>

    <div id="gf-hk-pause" class="gf-hk-scr" style="display:none">
      <div class="gf-hk-scr-h">${T('game_paused')}</div>
      <button class="gf-hk-btn" id="gf-hk-resume">▶&nbsp; ${T('game_resume')}</button>
      <div class="gf-hk-row">
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-restart">↺&nbsp; ${T('hk_restart')}</button>
        <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls2">${T('game_levels')}</button>
      </div>
    </div>

    <div id="gf-hk-done" class="gf-hk-scr gf-hk-scr-done" style="display:none">
      <div class="gf-hk-card">
        <div class="gf-hk-done-t" id="gf-hk-done-title"></div>
        <div class="gf-hk-chip" id="gf-hk-done-grade"></div>
        <div class="gf-hk-stats">
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('game_time')}</div><div class="gf-hk-val" id="gf-hk-done-time">0</div></div>
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('hk_best_time')}</div><div class="gf-hk-val" id="gf-hk-done-best">0</div></div>
          <div class="gf-hk-stat"><div class="gf-hk-lbl">${T('hk_attempts')}</div><div class="gf-hk-val" id="gf-hk-done-tries">1</div></div>
        </div>
        <div id="gf-hk-done-new" class="gf-hk-new" style="display:none">${T('game_new_best')}</div>
        <div id="gf-hk-done-share" class="gf-hk-share" style="display:none">${T('hk_share_now')}</div>
        <button class="gf-hk-btn" id="gf-hk-next">${T('hk_next_level')}&nbsp; ▶</button>
        <div class="gf-hk-row">
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-retry">↺&nbsp; ${T('game_try_again')}</button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-lvls3">${T('game_levels')}</button>
          <button class="gf-hk-btn gf-hk-btn2" id="gf-hk-dcode" style="display:none">${IC.code}${T('hk_copy_code')}</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.getElementById('gf-hk-canvas');
    _ctx = _cv.getContext('2d');
    _view = document.getElementById('gf-hk-view');
    BindButtons();
  }

  function HelpItem(k) {
    const tg = TAG[k];
    return `<div class="gf-hk-he"><canvas data-k="${k}"></canvas><div><b>${Esc(ElName(k))}</b><i style="color:${TAG_C[tg]};background:${Rgba(TAG_C[tg], 0.15)}">${Esc(_GameText('hk_tag_' + tg))}</i><small>${Esc(_GameText('hk_in_' + k))}</small></div></div>`;
  }
  function HelpOpen() { return !!_root && ById('gf-hk-help').style.display !== 'none'; }
  function OpenHelp() {
    const el = ById('gf-hk-help'), dark = _root.dataset.theme === 'dark', dpr = Math.min(3, W.devicePixelRatio || 1) * 1.5;
    el.style.display = 'flex';
    el.scrollTop = 0;
    el.querySelectorAll('canvas[data-k]').forEach(cv => {
      cv.width = Math.round(64 * dpr); cv.height = Math.round(48 * dpr);
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      Icon(g, cv.dataset.k, cv.width / 2, cv.height / 2, dpr, dark);
    });
    ById('gf-hk-help-x').focus({ preventScroll: true });
  }
  function CloseHelp() { ById('gf-hk-help').style.display = 'none'; if (GS && GS.status === 'editor') EdDraw(); }
  function ShowTip(b) {
    const tip = ById('gf-hk-tip'), t = b.dataset.tool, i = TOOLS.indexOf(t), k = t === 'sel' ? null : TAG[t];
    tip.innerHTML = `<b>${Esc(_GameText(EL_KEY[t]))}</b>${i < 9 ? `<kbd>${i + 1}</kbd>` : ''}${k ? `<i style="color:${TAG_C[k]};background:${Rgba(TAG_C[k], 0.15)}">${Esc(_GameText('hk_tag_' + k))}</i>` : ''}<small>${Esc(_GameText('hk_in_' + t))}</small>`;
    const bar = b.parentElement;
    tip.style.top = `${bar.offsetTop + b.offsetTop}px`;
    tip.style.left = `${bar.offsetLeft + bar.offsetWidth + 6}px`;
    tip.style.display = 'block';
  }
  function HideTip() { ById('gf-hk-tip').style.display = 'none'; }

  function BindButtons() {
    const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    on('gf-hk-close', CloseGradeHook);
    on('gf-hk-pause-btn', DoPause);
    on('gf-hk-resume', DoPause);
    on('gf-hk-restart', Restart);
    on('gf-hk-play', () => Play(GS ? GS.level : Unlocked()));
    on('gf-hk-lvls', ShowLevels);
    on('gf-hk-lvls2', ToMenu);
    on('gf-hk-lvls3', ToMenu);
    on('gf-hk-back', BackFromLevels);
    on('gf-hk-next', Next);
    on('gf-hk-retry', () => Play(GS.level));
    on('gf-hk-dcode', () => CopyCode(GS.custom));
    on('gf-hk-edit', () => OpenEditor(null));
    on('gf-hk-cust', () => ShowCustom());
    on('gf-hk-cust2', () => ShowCustom());
    on('gf-hk-cnew', () => OpenEditor(null));
    on('gf-hk-cimp', () => OpenCode());
    on('gf-hk-cback', ShowStart);
    on('gf-hk-code-ok', CodeOk);
    on('gf-hk-code-x', CloseCode);
    on('gf-hk-ed-back', EdBack);
    on('gf-hk-ed-undo', () => UndoRedo(ED.undo, ED.redo));
    on('gf-hk-ed-redo', () => UndoRedo(ED.redo, ED.undo));
    on('gf-hk-ed-grid', ToggleSnap);
    on('gf-hk-ed-fit', FitView);
    on('gf-hk-ed-gofin', GoFinish);
    on('gf-hk-help-btn', OpenHelp);
    on('gf-hk-ed-help', OpenHelp);
    on('gf-hk-help-x', CloseHelp);
    ById('gf-hk-help').addEventListener('click', e => { if (e.target.id === 'gf-hk-help') CloseHelp(); });
    const tl = ById('gf-hk-ed-tools');
    tl.addEventListener('mouseover', e => { const b = e.target.closest('button[data-tool]'); if (b) ShowTip(b); });
    tl.addEventListener('mouseleave', HideTip);
    tl.addEventListener('click', HideTip);
    on('gf-hk-skin', ShowSkins);
    on('gf-hk-skback', ShowStart);
    ById('gf-hk-skgrid').addEventListener('click', e => {
      const b = e.target.closest('button[data-sk]');
      if (!b) return;
      if (!SkinOk(+b.dataset.sk)) { Toast(_GameText('hk_skin_locked'), 1); return; }
      StorageSet(LS_SKIN, +b.dataset.sk);
      RenderSkins();
    });
    on('gf-hk-ed-clear', e => Arm(e.currentTarget, ClearAll));
    on('gf-hk-ed-share', EdShare);
    on('gf-hk-ed-test', EdTest);
    on('gf-hk-ed-zo', () => Zoom(0.8));
    on('gf-hk-ed-zi', () => Zoom(1.25));
    ById('gf-hk-clist').addEventListener('click', OnListClick);
    ById('gf-hk-ed').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && e.detail) b.blur();
      if (b && b.dataset.tool) SetTool(b.dataset.tool);
    });
    const pn = ById('gf-hk-ed-panel'), nm = ById('gf-hk-ed-name');
    pn.addEventListener('change', e => PanelInput(e.target));
    pn.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.pal) { ED.d.c = +b.dataset.pal; Commit(); }
      else if (b.dataset.ft) { ED.d.f[2] = +b.dataset.ft; if (ED.d.f[2] && ED.d.f[1] > 380) ED.d.f[1] -= 120; FixSF(ED.d); Commit(); RenderPanel(); }
      else if (b.dataset.act === 'dup') DupSel();
      else if (b.dataset.act === 'del') DelSel();
    });
    nm.addEventListener('input', () => { ED.d.n = CleanName(nm.value); });
    nm.addEventListener('change', () => { ED.d.n = CleanName(nm.value); nm.value = ED.d.n; Commit(); });
    _cv.addEventListener('pointerdown', EdDown);
    _cv.addEventListener('pointermove', EdMove);
    _cv.addEventListener('pointerup', EdUp);
    _cv.addEventListener('pointercancel', EdUp);
    _cv.addEventListener('pointerleave', EdLeave);
    _cv.addEventListener('wheel', EdWheel, { passive: false });
    _cv.addEventListener('mousedown', OnDown);
    _cv.addEventListener('touchstart', OnDown, { passive: false });
    _cv.addEventListener('touchend', OnUp);
    _cv.addEventListener('touchcancel', OnUp);
    _cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  function OpenGradeHook(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    else if (!_grades.length) _grades = FallbackGrades();
    _txt = { level: _GameText('hk_level'), hold: _GameText('hk_rule_hold'), rel: _GameText('hk_rule_release'), tries: _GameText('hk_attempts'), test: _GameText('hk_test'), esc: _GameText('hk_esc_editor'), check: _GameText('hk_checkpoint'), nw: _GameText('hk_new').toUpperCase(), fin: _GameText('hk_el_finish').toUpperCase() };
    if (!document.getElementById('gf-hk')) BuildOverlay();
    SP.fin = FinSprite(_txt.fin, false);
    SP.fin2 = FinSprite(_txt.fin, true);
    _root.style.display = 'flex';
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    _tobs.observe(_cv, { attributes: true, attributeFilter: ['style', 'class'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    Fit();
    ShowStart();
  }

  function CloseGradeHook() {
    const el = document.getElementById('gf-hk');
    if (el) el.style.display = 'none';
    if (GS && (GS.status === 'playing' || GS.status === 'ready' || GS.status === 'dead')) { GS.prev = GS.status; GS.status = 'paused'; }
    StopLoop();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
  }

  function ToggleGradeHook(grades) {
    const el = document.getElementById('gf-hk');
    if (el && el.style.display !== 'none') CloseGradeHook(); else OpenGradeHook(grades);
  }

  function BossKeyGradeHook() {
    const el = document.getElementById('gf-hk');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS && (GS.status === 'playing' || GS.status === 'ready' || GS.status === 'dead')) DoPause();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeHook = OpenGradeHook;
  W.CloseGradeHook = CloseGradeHook;
  W.ToggleGradeHook = ToggleGradeHook;
  W.BossKeyGradeHook = BossKeyGradeHook;

  function InjectCSS() {
    if (document.getElementById('gf-hk-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-hk-css';
    s.textContent = `
#gf-hk {
  --hk-modal:#fff;--hk-hdr:#f8f5f7;--hk-scr:rgba(250,247,249,0.95);
  --hk-brd:rgba(236,72,153,0.24);--hk-brd2:#e7e0e5;--hk-btn-brd:#d8d0d6;
  --hk-txt:#1c1a2b;--hk-txt2:#57536a;--hk-txt3:#9b96a8;
  --hk-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-hk[data-theme="dark"] {
  --hk-modal:rgba(13,13,17,0.97);--hk-hdr:rgba(8,8,11,0.95);
  --hk-scr:rgba(7,10,22,0.93);--hk-brd:rgba(236,72,153,0.2);--hk-brd2:#1f1f27;
  --hk-btn-brd:#34343f;--hk-txt:#f5f5f8;--hk-txt2:#cbd0dc;--hk-txt3:#8a90a2;
  --hk-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-hk{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-hk-modal{position:relative;display:flex;flex-direction:column;background:var(--hk-modal);border:1px solid var(--hk-brd);border-radius:12px;box-shadow:var(--hk-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-hk-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--hk-hdr);border-bottom:1px solid var(--hk-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-hk-hl,.gf-hk-hr{display:flex;align-items:center;gap:8px;}
#gf-hk-logo{width:24px;height:24px;background:${ACCENT};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;letter-spacing:-0.5px;flex-shrink:0;}
#gf-hk-title{font-size:13px;font-weight:700;color:var(--hk-txt);letter-spacing:-0.3px;}
#gf-hk-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--hk-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--hk-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-hk-best-lbl{font-size:8px;font-weight:700;color:var(--hk-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-hk-pause-btn,#gf-hk-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--hk-btn-brd);border-radius:6px;background:transparent;color:var(--hk-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-hk-pause-btn:hover{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,.10);}
#gf-hk-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-hk-body{position:relative;line-height:0;flex-shrink:0;}
#gf-hk-view{line-height:0;}
#gf-hk-canvas{display:block;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;}
.gf-hk-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--hk-scr);padding:24px;overflow-y:auto;line-height:1.35;text-align:center;}
.gf-hk-scr-title{font-size:40px;font-weight:800;color:${ACCENT};letter-spacing:-1px;text-shadow:0 0 40px rgba(236,72,153,0.4);line-height:1.05;}
.gf-hk-scr-h{font-size:22px;font-weight:800;color:var(--hk-txt);letter-spacing:3px;text-transform:uppercase;}
.gf-hk-scr-sub{font-size:13px;color:var(--hk-txt2);line-height:1.45;max-width:380px;}
.gf-hk-rules{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;font-size:12px;font-weight:700;color:var(--hk-txt);}
.gf-hk-rules span{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(128,128,128,0.09);}
.gf-hk-rules b{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${ACCENT};color:#fff;font-size:11px;}
.gf-hk-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}
.gf-hk-scr-footer{font-size:11px;color:var(--hk-txt3);line-height:1.45;max-width:420px;}
.gf-hk-btn{padding:10px 22px;border:1px solid ${ACCENT};border-radius:8px;background:rgba(236,72,153,0.12);color:${ACCENT};font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
.gf-hk-btn:hover{background:rgba(236,72,153,0.22);box-shadow:0 4px 18px rgba(236,72,153,0.28);transform:translateY(-1px);}
.gf-hk-btn2{border-color:var(--hk-btn-brd);background:rgba(128,128,128,0.06);color:var(--hk-txt2);min-width:120px;}
.gf-hk-btn2:hover{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,0.08);box-shadow:none;}
.gf-hk-dim{opacity:0.7;font-weight:700;margin-left:4px;}
#gf-hk-grid{display:grid;grid-template-columns:repeat(8,58px);gap:8px;}
.gf-hk-lv{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:50px;border:1px solid var(--hk-brd2);border-radius:10px;background:rgba(128,128,128,0.07);color:var(--hk-txt);font-family:inherit;cursor:pointer;padding:0;line-height:1;}
.gf-hk-lv b{font-size:16px;font-weight:800;}
.gf-hk-lv small{font-size:9px;font-weight:700;color:var(--hk-txt3);min-height:9px;}
.gf-hk-lv:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};transform:translateY(-1px);}
.gf-hk-lv-done{border-color:rgba(236,72,153,0.35);}
.gf-hk-lv-cur{border-color:${ACCENT};background:rgba(236,72,153,0.14);color:${ACCENT};}
.gf-hk-lv:disabled{opacity:0.32;cursor:default;}
.gf-hk-scr-done{background:transparent;}
#gf-hk-start{background:color-mix(in srgb,var(--hk-scr) 78%,transparent);}
.gf-hk-card{display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px 26px;border-radius:16px;background:var(--hk-scr);border:1px solid var(--hk-brd);box-shadow:0 12px 40px rgba(0,0,0,0.16);}
.gf-hk-done-t{font-size:28px;font-weight:800;color:${ACCENT};letter-spacing:-0.5px;line-height:1.05;}
.gf-hk-chip{font-size:11px;font-weight:800;padding:4px 12px;border:1px solid;border-radius:999px;background:rgba(128,128,128,0.08);}
.gf-hk-stats{display:grid;grid-template-columns:repeat(3,minmax(92px,1fr));gap:10px;}
.gf-hk-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 12px;border:1px solid var(--hk-brd2);border-radius:9px;background:rgba(128,128,128,0.10);}
.gf-hk-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--hk-txt3);line-height:1;text-transform:uppercase;}
.gf-hk-val{font-size:20px;font-weight:800;color:var(--hk-txt);line-height:1;}
.gf-hk-new{font-size:11px;font-weight:800;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;animation:gf-hk-pulse 0.8s ease-in-out infinite alternate;}
@keyframes gf-hk-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
#gf-hk .gf-hk-i{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}
.gf-hk-btn .gf-hk-i{vertical-align:-2px;margin-right:7px;}
.gf-hk-share{font-size:11px;font-weight:800;color:#16a34a;letter-spacing:1px;text-transform:uppercase;}
#gf-hk[data-ed="1"] #gf-hk-canvas{cursor:inherit;}
#gf-hk-clist{width:min(640px,100%);max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px;box-sizing:border-box;}
.gf-hk-ci{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--hk-brd2);border-radius:10px;background:rgba(128,128,128,0.07);text-align:left;}
.gf-hk-flash{border-color:${ACCENT};box-shadow:0 0 0 2px rgba(236,72,153,0.22);}
.gf-hk-ci-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.gf-hk-ci-n{font-size:13px;font-weight:800;color:var(--hk-txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gf-hk-ci-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--hk-txt3);}
.gf-hk-tag{padding:1px 7px;border-radius:999px;background:rgba(245,158,11,0.15);color:#b45309;}
.gf-hk-tag-ok{background:rgba(34,197,94,0.15);color:#15803d;}
.gf-hk-tag-im{background:rgba(96,165,250,0.17);color:#2563eb;}
#gf-hk[data-theme="dark"] .gf-hk-tag{color:#fbbf24;}
#gf-hk[data-theme="dark"] .gf-hk-tag-ok{color:#4ade80;}
#gf-hk[data-theme="dark"] .gf-hk-tag-im{color:#93c5fd;}
.gf-hk-ren,#gf-hk-ed-name,.gf-hk-pf input,#gf-hk-code-in{box-sizing:border-box;border:1px solid var(--hk-btn-brd);border-radius:7px;background:rgba(128,128,128,0.08);color:var(--hk-txt);font-family:inherit;font-weight:700;outline:none;}
.gf-hk-ren:focus,#gf-hk-ed-name:focus,.gf-hk-pf input:focus,#gf-hk-code-in:focus{border-color:${ACCENT};}
.gf-hk-ren{flex:1;min-width:0;height:26px;padding:0 8px;font-size:13px;}
.gf-hk-ib,.gf-hk-sb,.gf-hk-eb{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;border:1px solid var(--hk-btn-brd);border-radius:7px;background:transparent;color:var(--hk-txt2);font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;flex-shrink:0;line-height:1;}
.gf-hk-ib{width:28px;padding:0;}
.gf-hk-sb{padding:0 11px;border-color:${ACCENT};background:rgba(236,72,153,0.12);color:${ACCENT};}
.gf-hk-sb .gf-hk-i{width:10px;height:10px;}
.gf-hk-ib:hover,.gf-hk-eb:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};}
.gf-hk-sb:hover{background:rgba(236,72,153,0.22);}
.gf-hk-ib.off,.gf-hk-eb.off{opacity:0.45;}
.gf-hk-ib-del:hover,.gf-hk-ib.arm,.gf-hk-eb.arm,.gf-hk-eb-del:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,0.1);}
.gf-hk-empty{padding:28px 12px;font-size:12px;color:var(--hk-txt3);}
#gf-hk-ed{position:absolute;inset:0;z-index:5;pointer-events:none;line-height:1.3;color:var(--hk-txt);}
#gf-hk-ed>*{pointer-events:auto;}
.gf-hk-ed-top{position:absolute;top:8px;left:8px;right:8px;display:flex;align-items:center;gap:5px;}
.gf-hk-eb{min-width:28px;padding:0 8px;background:var(--hk-scr);box-sizing:border-box;}
.gf-hk-eb:disabled{opacity:0.35;cursor:default;}
.gf-hk-eb.on{border-color:${ACCENT};color:${ACCENT};background:rgba(236,72,153,0.14);}
.gf-hk-eb-p,.gf-hk-eb-p:hover:not(:disabled){border-color:${ACCENT};background:${ACCENT};color:#fff;}
.gf-hk-eb-p:hover{box-shadow:0 4px 14px rgba(236,72,153,0.35);}
.gf-hk-eb-p .gf-hk-i{width:10px;height:10px;}
#gf-hk-ed-name{flex:0 1 190px;min-width:70px;height:28px;padding:0 9px;font-size:12px;background:var(--hk-scr);}
.gf-hk-ed-sp{flex:1;}
.gf-hk-ed-tools{position:absolute;left:8px;top:46px;display:grid;grid-template-columns:repeat(2,30px);gap:3px;padding:4px;border:1px solid var(--hk-brd2);border-radius:10px;background:var(--hk-scr);}
.gf-hk-ed-tools .gf-hk-eb{position:relative;width:30px;height:30px;padding:0;border-color:transparent;background:transparent;}
.gf-hk-ed-tools .gf-hk-eb.on{border-color:${ACCENT};background:rgba(236,72,153,0.14);}
.gf-hk-ed-tools small{position:absolute;right:2px;bottom:1px;font-size:7px;opacity:0.6;}
#gf-hk-ed-panel{position:absolute;right:8px;top:46px;width:168px;max-height:calc(100% - 96px);overflow-y:auto;padding:10px;box-sizing:border-box;border:1px solid var(--hk-brd2);border-radius:10px;background:var(--hk-scr);font-size:11px;}
.gf-hk-pt{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};margin-bottom:8px;}
.gf-hk-pl{font-size:9px;font-weight:700;color:var(--hk-txt3);margin-bottom:4px;}
.gf-hk-sw{display:flex;gap:5px;}
.gf-hk-sw button{width:22px;height:22px;padding:0;border:2px solid var(--hk-brd2);border-radius:6px;cursor:pointer;}
.gf-hk-sw button.on{border-color:${ACCENT};box-shadow:0 0 0 2px rgba(236,72,153,0.25);}
.gf-hk-st{margin-top:10px;font-size:10px;font-weight:700;line-height:1.4;color:#b45309;}
.gf-hk-st.ok{color:#15803d;}
#gf-hk[data-theme="dark"] .gf-hk-st{color:#fbbf24;}
#gf-hk[data-theme="dark"] .gf-hk-st.ok{color:#4ade80;}
.gf-hk-pc{display:flex;flex-wrap:wrap;gap:9px;margin-top:10px;font-size:10px;font-weight:800;color:var(--hk-txt2);}
.gf-hk-pc span{display:inline-flex;align-items:center;gap:3px;}
.gf-hk-pc .gf-hk-i{width:11px;height:11px;}
.gf-hk-pf{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.gf-hk-pf label{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:9px;font-weight:700;color:var(--hk-txt3);}
.gf-hk-pf input{width:100%;height:25px;padding:0 6px;font-size:11px;}
.gf-hk-pa{display:flex;gap:6px;margin-top:9px;}
.gf-hk-pa .gf-hk-eb{height:26px;}
.gf-hk-pa .gf-hk-eb:first-child{flex:1;}
.gf-hk-ed-hint{position:absolute;left:8px;bottom:8px;max-width:calc(100% - 140px);padding:4px 9px;box-sizing:border-box;border-radius:7px;background:var(--hk-scr);color:var(--hk-txt3);font-size:9.5px;font-weight:700;line-height:1.45;}
#gf-hk-ed>.gf-hk-ed-hint{pointer-events:none;}
.gf-hk-ed-zoom{position:absolute;right:8px;bottom:8px;display:flex;align-items:center;gap:4px;}
.gf-hk-ed-zoom .gf-hk-eb{width:26px;min-width:26px;height:26px;padding:0;font-size:14px;}
#gf-hk-ed-zl{min-width:40px;padding:3px 0;border-radius:6px;background:var(--hk-scr);text-align:center;font-size:10px;font-weight:800;color:var(--hk-txt2);}
#gf-hk-code{z-index:30;}
.gf-hk-lv-new{position:relative;}
.gf-hk-lv-new::after{content:"";position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:#facc15;box-shadow:0 0 0 2px rgba(250,204,21,0.25);}
.gf-hk-sw{flex-wrap:wrap;}
.gf-hk-psel{width:100%;height:25px;margin-bottom:8px;padding:0 4px;box-sizing:border-box;border:1px solid var(--hk-btn-brd);border-radius:7px;background:var(--hk-scr);color:var(--hk-txt);font-family:inherit;font-size:11px;font-weight:700;outline:none;}
.gf-hk-psel:focus{border-color:${ACCENT};}
.gf-hk-sw+.gf-hk-pl{margin-top:9px;}
.gf-hk-pf1{grid-template-columns:1fr;}
.gf-hk-ft{display:flex;gap:4px;margin-bottom:8px;}
.gf-hk-ft .gf-hk-eb{flex:1;min-width:0;padding:0;height:28px;}
.gf-hk-ft .gf-hk-i{width:15px;height:15px;}
.gf-hk-pn{margin-top:7px;}
#gf-hk-skgrid{display:grid;grid-template-columns:repeat(4,104px);gap:10px;}
.gf-hk-sk{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px 7px;border:1px solid var(--hk-brd2);border-radius:12px;background:rgba(128,128,128,0.07);color:var(--hk-txt);font-family:inherit;cursor:pointer;line-height:1.1;}
.gf-hk-sk canvas{width:64px;height:64px;}
.gf-hk-sk b{font-size:11px;font-weight:800;}
.gf-hk-sk small{font-size:9px;font-weight:700;color:var(--hk-txt3);min-height:10px;}
.gf-hk-sk:hover{border-color:${ACCENT};transform:translateY(-1px);}
.gf-hk-sk.on{border-color:${ACCENT};background:rgba(236,72,153,0.14);box-shadow:0 0 0 2px rgba(236,72,153,0.2);}
.gf-hk-sk.on small{color:${ACCENT};}
.gf-hk-sk-lock canvas{filter:grayscale(1) brightness(0.6);opacity:0.55;}
.gf-hk-sk-lock b{color:var(--hk-txt3);}
#gf-hk-code-in{width:min(460px,70vw);height:88px;padding:8px 10px;font-size:11px;line-height:1.4;resize:none;word-break:break-all;}
.gf-hk-err{min-height:15px;font-size:11px;font-weight:800;color:#ef4444;}
.gf-hk-rules button{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border:1px solid ${ACCENT};border-radius:999px;background:rgba(236,72,153,0.1);color:${ACCENT};font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;}
.gf-hk-rules button:hover{background:rgba(236,72,153,0.2);}
#gf-hk-help{z-index:30;justify-content:safe center;}
.gf-hk-hp{gap:9px;max-width:640px;padding:18px 20px;}
.gf-hk-hs{align-self:stretch;margin-top:4px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};text-align:left;}
.gf-hk-ctl{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-self:stretch;}
.gf-hk-ctl span{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:10px;background:rgba(128,128,128,0.08);font-size:11.5px;font-weight:700;color:var(--hk-txt);text-align:left;}
.gf-hk-ctl b{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:20px;height:20px;border-radius:50%;background:${ACCENT};color:#fff;font-size:11px;}
.gf-hk-hg{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-self:stretch;}
.gf-hk-he{display:flex;align-items:center;gap:9px;padding:5px 9px 5px 5px;border:1px solid var(--hk-brd2);border-radius:10px;background:rgba(128,128,128,0.06);text-align:left;}
.gf-hk-he canvas{width:64px;height:48px;flex-shrink:0;border-radius:7px;background:rgba(128,128,128,0.08);}
.gf-hk-he>div{display:flex;flex-wrap:wrap;align-items:center;gap:3px 6px;min-width:0;}
.gf-hk-he b{font-size:12px;font-weight:800;color:var(--hk-txt);}
.gf-hk-he i,#gf-hk-tip i{font-style:normal;font-size:9px;font-weight:800;padding:1px 6px;border-radius:999px;}
.gf-hk-he small{flex-basis:100%;font-size:10.5px;font-weight:600;line-height:1.35;color:var(--hk-txt2);}
#gf-hk-tip{display:none;position:absolute;z-index:6;width:190px;padding:8px 10px;box-sizing:border-box;border:1px solid var(--hk-brd);border-radius:9px;background:var(--hk-scr);box-shadow:0 6px 20px rgba(0,0,0,0.16);pointer-events:none;font-size:11px;line-height:1.35;}
#gf-hk-ed>#gf-hk-tip{pointer-events:none;}
#gf-hk-tip b{font-size:11.5px;font-weight:800;color:var(--hk-txt);margin-right:6px;}
#gf-hk-tip kbd{display:inline-block;min-width:14px;padding:0 4px;margin-right:6px;border:1px solid var(--hk-btn-brd);border-radius:4px;font-family:inherit;font-size:9px;font-weight:800;color:var(--hk-txt3);text-align:center;}
#gf-hk-tip small{display:block;margin-top:4px;font-size:10.5px;font-weight:600;color:var(--hk-txt2);}
#gf-hk-toast{position:absolute;left:50%;bottom:48px;z-index:40;max-width:80%;padding:7px 14px;border-radius:999px;background:var(--hk-txt);color:var(--hk-modal);font-size:12px;font-weight:800;line-height:1.3;text-align:center;opacity:0;pointer-events:none;transform:translate(-50%,8px);transition:opacity .18s,transform .18s;}
#gf-hk-toast.on{opacity:1;transform:translate(-50%,0);}
#gf-hk-toast.bad{background:#ef4444;color:#fff;}
`;
    document.head.appendChild(s);
  }

})(window);
