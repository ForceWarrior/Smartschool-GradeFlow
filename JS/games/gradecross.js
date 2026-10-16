;(function (W) {
  'use strict';
  if (W.OpenGradeCross) return;

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const CV_W = 720;
  const CV_H = 480;
  const TS = 46;
  const YS = 0.25;
  const YC = Math.sqrt(1 - YS * YS);
  const PS = 0.8;
  const HY = 0.6 * TS;
  const SLOPE = YS * PS / YC;
  const FOCUS_Y = CV_H * 0.6;
  const HALF = 4;
  const WRAP = 16;
  const HOP_T = 0.14;
  const HOP_H = 0.42;
  const SLIDE_T = 0.12;
  const GRASS_H = 0.14;
  const ICE_H = 0.05;
  const WATER_H = -0.16;
  const LOG_TOP = 0.2;
  const BACK = 4.2;
  const TRAIN_V = 26;
  const WARN_T = 1.1;
  const IDLE_WARN = 4.6;
  const IDLE_MAX = 7;
  const MAXP = 240;
  const NAMB = 60;
  const NSTR = 8;
  const STR_T = 1.25;
  const EVENTS = [
    { key: 'cr_ev_rush', amb: 0, dur: 9, road: 1.4, river: 1, ice: 1, sand: 1, dark: 0, fog: '', strike: 0 },
    { key: 'cr_ev_storm', amb: 4, dur: 10, road: 1, river: 1.3, ice: 1, sand: 1, dark: 0.22, fog: '', strike: 1.3 },
    { key: 'cr_ev_blizzard', amb: 2, dur: 10, road: 1, river: 1, ice: 1.35, sand: 1, dark: 0, fog: 'rgb(235,244,255)', strike: 0 },
    { key: 'cr_ev_sand', amb: 3, dur: 10, road: 1.15, river: 1, ice: 1, sand: 1.45, dark: 0.06, fog: 'rgb(214,160,80)', strike: 0 },
    { key: 'cr_ev_blackout', amb: 4, dur: 9, road: 1.1, river: 1, ice: 1, sand: 1, dark: 0.42, fog: '', strike: 0 },
    { key: 'cr_ev_meteor', amb: 5, dur: 10, road: 1, river: 1, ice: 1, sand: 1, dark: 0.1, fog: '', strike: 0.85 },
  ];
  const VLEN = [1.3, 1.75, 2.7, 0.9, 0.85, 0.95];
  const DEATH = ['car', 'car', 'car', 'boulder', 'tumble', 'slide'];
  const BSTART = [0, 32, 70, 112, 158, 206];
  const BLAST = 60;
  const BLOOP = 52;
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const KEYDIR = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, W: 0, z: 0, Z: 0, d: 1, D: 1, s: 2, S: 2, a: 3, A: 3, q: 3, Q: 3 };
  const FONT_HUD = '800 44px "IBM Plex Mono",monospace';
  const FONT_SM = '700 12px "IBM Plex Mono",monospace';
  const FONT_NUM = '800 22px "IBM Plex Mono",monospace';
  const FONT_COIN = '800 10px "IBM Plex Mono",monospace';
  const FONT_TRUCK = '800 11px "IBM Plex Mono",monospace';
  const FONT_BAN = '800 30px "IBM Plex Mono",monospace';
  const FONT_BAN2 = '800 11px "IBM Plex Mono",monospace';
  const FONT_MARK = '800 13px "IBM Plex Mono",monospace';
  const FONT_EV = '800 12px "IBM Plex Mono",monospace';

  const LS_BEST = 'gf-cr-best';
  const LS_COINS = 'gf-cr-coins';
  const LS_SOUND = 'gf-cr-sound';
  const LS_CHAR = 'gf-cr-char';
  const LS_OWN = 'gf-cr-own';
  const NINK = '#060b1c';

  const GLOWS = [['255,90,60', 16], ['255,232,160', 30], ['244,114,182', 26], ['34,211,238', 26], ['163,230,53', 26], ['250,204,21', 26], ['192,132,252', 26], ['255,140,40', 24]];

  const BASE = {
    grass: ['#a9df66', '#9fd65b'], grassSide: '#7a9f45', oob: 'rgba(20,40,10,0.26)',
    road: '#5d6170', roadSide: '#474a56', dash: '#eef0f3', curb: '#c9ccd4',
    rail: '#9a8f84', railSide: '#7a7068', sleeper: '#71503a', steel: '#d7dce2', steelSide: '#81848a',
    water: '#62cbf5', foam: '#c6f0ff', ripple: '#a3e3fc', crust: '',
    ice: '#c8ecfa', iceSide: '#8fc3dc', iceLine: '#ffffff',
    trail: '#dcb46e', trailSide: '#b98e4c', wind: '#ecca8c',
    trunk: '#8d5b3a', leaf: '#6fc142', leaf2: '#5cb33d', pine: '#2f8a4c', rock: '#b1b6bd', moss: '#6fae3f',
    log: '#a0703f', logEnd: '#e0b47c', bark: '#86592f', floe: '#f1fbff', stone: '#5c4e4a', barge: '#39445e',
    pad: '#5cb85c', tuft: '#86c64c', flowers: ['#ffffff', '#ffd84d', '#ff8fb1'],
    snow: '#fbfdff', cactus: '#4fa64a', mesa: '#cf8656', bone: '#f3ecdc', tumble: '#c49a5a',
    bld: '#2e3150', win: '#fde68a', lamp: '#fff3b0', tile: '', neon: ['#f472b6', '#22d3ee', '#a3e635', '#facc15', '#c084fc'],
    crystal: '#ffb020', glowc: '#ff7a1a', boulder: '#6a5a56',
    shadow: 'rgba(25,45,15,0.2)', dust: '#eef8d8',
    glass: '#cdeeff', head: '#fff7c4', tail: '#ff5a4f', panel: '#ffffff', cargo: '#eef1f4', tire: '#2b2d33',
    cars: ['#e8483d', '#3d8fe0', '#f6c234', '#3cc46e', '#9b5bd6', '#f28b30', '#25b7ae', '#ee6aa0'],
    train: '#d9473b', trainTrim: '#f5f5f5', trainRoof: '#5b5f6b', signal: '#a8aeb6', lampOff: '#5a1d18',
    bus: false, plow: false, taxi: false, cart: false,
  };

  const BIOMES = [
    { key: 'cr_biome_school', acc: '#22c55e', lanes: [['road', 0.56], ['rail', 0.2], ['river', 0.24]], veh: [0.56, 0.8], vmul: 1, rmul: 1, lily: 0.3, raft: 0, pad: 0,
      obsIn: [0, 0, 0, 2, 2, 1, 3], obsOut: [0, 0, 0, 2], outP: 0.5, deco: [0, 0, 1, 2, 3, 12], amb: 0, tint: '', ta: 0, nf: 0.5, keep: [], lit: false,
      pal: { bus: true } },
    { key: 'cr_biome_forest', acc: '#16a34a', lanes: [['river', 0.5], ['road', 0.36], ['rail', 0.14]], veh: [0.55, 0.82], vmul: 0.92, rmul: 1, lily: 0.34, raft: 0, pad: 0,
      obsIn: [4, 4, 4, 5, 16, 0], obsOut: [4, 4, 4, 0], outP: 0.62, deco: [0, 6, 6, 5, 5, 11, 1], amb: 1, tint: 'rgb(0,40,10)', ta: 0.05, nf: 0.5, keep: [], lit: false,
      pal: { grass: ['#78ba4f', '#6fb147'], grassSide: '#4f8233', road: '#a67f57', roadSide: '#80603f', dash: '#caa97e', curb: '#8c6a47',
        water: '#3fb0c8', foam: '#c4f0f6', ripple: '#80d3e1', trunk: '#6e4a2f', leaf: '#43a24b', leaf2: '#4aa845', pine: '#2c8048', rock: '#94a08f',
        tuft: '#5aa840', shadow: 'rgba(10,40,15,0.24)', dust: '#d8edc0', rail: '#8b7e6e', railSide: '#6a5f53',
        cars: ['#c0392b', '#2e86c1', '#f4d03f', '#27ae60', '#a07856', '#e67e22', '#16a085', '#7d5ba6'],
        train: '#2f7a42', trainTrim: '#f0e4c4', trainRoof: '#403c37' } },
    { key: 'cr_biome_snow', acc: '#38bdf8', lanes: [['ice', 0.38], ['river', 0.26], ['road', 0.23], ['rail', 0.13]], veh: [0.5, 0.7], vmul: 0.92, rmul: 0.95, lily: 0.32, raft: 1, pad: 1,
      obsIn: [6, 6, 6, 7, 1], obsOut: [6, 6, 6, 1], outP: 0.55, deco: [7, 7, 7, 4], amb: 2, tint: 'rgb(200,230,255)', ta: 0.07, nf: 0.48, keep: [], lit: false,
      pal: { grass: ['#eef4fa', '#e4edf6'], grassSide: '#b4c6da', road: '#7d879a', roadSide: '#5e677a', dash: '#ffffff', curb: '#e3eaf3',
        rail: '#9ba4ae', railSide: '#78818b', sleeper: '#6b5444', water: '#3d8fcb', foam: '#e3f5ff', ripple: '#7bbbe5',
        rock: '#a5b6c8', trunk: '#6b4a35', pine: '#2f6e5d', tuft: '#d0dcea', shadow: 'rgba(40,70,130,0.17)', dust: '#ffffff',
        cars: ['#e04848', '#3a6fd8', '#f2b531', '#2fa36b', '#7e57c2', '#ff7043', '#26a69a', '#ec407a'],
        train: '#2c5fa8', trainTrim: '#f0f4f8', plow: true } },
    { key: 'cr_biome_desert', acc: '#f59e0b', lanes: [['road', 0.58], ['tumble', 0.24], ['rail', 0.18]], veh: [0.36, 0.56], vmul: 1.08, rmul: 1, lily: 0, raft: 0, pad: 0,
      obsIn: [8, 8, 9, 9, 1], obsOut: [8, 9, 9, 8], outP: 0.45, deco: [9, 9, 8, 4], amb: 3, tint: 'rgb(255,190,90)', ta: 0.06, nf: 0.5, keep: [], lit: false,
      pal: { grass: ['#efd08b', '#e9c880'], grassSide: '#c9a35a', road: '#5a5550', roadSide: '#3f3b37', dash: '#f5f0e1', curb: '#facc15',
        rail: '#b88f66', railSide: '#94704d', sleeper: '#6b4a2e', rock: '#c98e5c', tuft: '#b8a45e', shadow: 'rgba(110,60,10,0.2)', dust: '#f5e3b5',
        cars: ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00', '#00acc1', '#f06292'],
        train: '#c2410c', trainTrim: '#fde68a', trainRoof: '#57534e' } },
    { key: 'cr_biome_city', acc: '#ec4899', lanes: [['road', 0.5], ['rail', 0.24], ['river', 0.26]], veh: [0.52, 0.76], vmul: 1.05, rmul: 1.05, lily: 0, raft: 2, pad: 0,
      obsIn: [10, 11, 12, 12, 2], obsOut: [17, 17, 17, 12], outP: 0.78, deco: [14, 15, 4], amb: 4, tint: 'rgb(12,8,44)', ta: 0.3, nf: 0.22, keep: ['dash', 'curb', 'glass', 'foam', 'trainTrim'], lit: true,
      pal: { grass: ['#4d5272', '#494e6d'], grassSide: '#2f3349', tile: '#5c6288', road: '#272939', roadSide: '#1a1b27', dash: '#f0abfc', curb: '#22d3ee',
        rail: '#3a3d52', railSide: '#2a2c3b', sleeper: '#24263a', steel: '#c4c9e0', steelSide: '#6b7090', water: '#1f3b63', foam: '#38bdf8', ripple: '#3b82f6',
        rock: '#6b7090', leaf2: '#3f8f5a', tuft: '#5a6084', shadow: 'rgba(0,0,24,0.34)', dust: '#9aa3c7', glass: '#a5f3fc', oob: 'rgba(0,0,20,0.32)',
        cars: ['#ec4899', '#06b6d4', '#facc15', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#3b82f6'],
        train: '#cbd5e1', trainTrim: '#22d3ee', trainRoof: '#475569', taxi: true } },
    { key: 'cr_biome_lava', acc: '#f97316', lanes: [['river', 0.42], ['boulder', 0.36], ['rail', 0.22]], veh: [1, 1], vmul: 1, rmul: 1.12, lily: 0.3, raft: 3, pad: 2,
      obsIn: [13, 13, 14, 15], obsOut: [13, 15, 14, 13], outP: 0.55, deco: [10, 10, 4], amb: 5, tint: 'rgb(255,80,0)', ta: 0.07, nf: 0.3, keep: ['water', 'foam', 'ripple', 'dash', 'crust', 'glowc', 'crystal', 'curb'], lit: false,
      pal: { grass: ['#4f4342', '#493d3c'], grassSide: '#2e2524', road: '#3c3130', roadSide: '#271f1e', dash: '#ff7a1a', curb: '#ff7a1a',
        rail: '#3d3333', railSide: '#2b2323', sleeper: '#231b1b', steel: '#a8a29e', steelSide: '#5c5552', water: '#ff6a00', foam: '#ffd166', ripple: '#ffb347', crust: '#b8400c',
        rock: '#30263a', trunk: '#2a201c', tuft: '#5a4a46', shadow: 'rgba(30,0,0,0.32)', dust: '#7a6a66', oob: 'rgba(20,0,0,0.3)',
        train: '#57534e', trainTrim: '#f59e0b', trainRoof: '#3a3532', cart: true } },
  ];
  const PAL = [BIOMES.map(b => Object.assign({ night: false, lit: b.lit }, BASE, b.pal)), null];
  PAL[1] = PAL[0].map((p, i) => Nightify(p, BIOMES[i]));

  const OBSV = [3, 1, 1, 1, 3, 1, 3, 1, 3, 1, 1, 1, 5, 1, 1, 1, 1, 3];
  const OBSW = [0.62, 0.5, 0.56, 0.42, 0.66, 0.5, 0.66, 0.56, 0.4, 0.56, 0.26, 0.26, 0.6, 0.5, 0.4, 0.4, 0.5, 0.9];
  const OBSG = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, 2, -1, 7, -1, -1, -1];

  const CHICK = [
    [-0.19, 0, -0.04, -0.1, 0.16, 0.05, '#f5a623'],
    [0.1, 0, -0.04, 0.19, 0.16, 0.05, '#f5a623'],
    [-0.31, 0.15, -0.3, 0.31, 0.8, 0.25, '#ffffff'],
    [-0.19, 0.5, -0.41, 0.19, 0.75, -0.3, '#f4f4f4'],
    [-0.07, 0.8, -0.1, 0.07, 0.9, 0.16, '#e8423a'],
    [-0.07, 0.9, -0.02, 0.07, 0.97, 0.1, '#e8423a'],
    [-0.09, 0.52, 0.25, 0.09, 0.65, 0.39, '#f5a623'],
    [-0.055, 0.4, 0.25, 0.055, 0.52, 0.31, '#e8423a'],
    [0.31, 0.59, 0.07, 0.33, 0.69, 0.16, '#222222'],
    [-0.33, 0.59, 0.07, -0.31, 0.69, 0.16, '#222222'],
    [0.31, 0.3, -0.18, 0.37, 0.55, 0.1, '#ececec'],
    [-0.37, 0.3, -0.18, -0.31, 0.55, 0.1, '#ececec'],
  ];
  const FROG = [
    [-0.36, 0, -0.12, -0.16, 0.08, 0.2, '#3f9e45'],
    [0.16, 0, -0.12, 0.36, 0.08, 0.2, '#3f9e45'],
    [-0.32, 0.06, -0.3, 0.32, 0.5, 0.3, '#5cc05a'],
    [-0.26, 0.08, 0.3, 0.26, 0.36, 0.33, '#c9f29b'],
    [-0.2, 0.3, 0.33, 0.2, 0.34, 0.34, '#e05a6a'],
    [-0.19, 0.26, -0.31, -0.04, 0.4, -0.3, '#3e9a43'],
    [0.06, 0.14, -0.31, 0.2, 0.28, -0.3, '#3e9a43'],
    [-0.3, 0.5, -0.06, -0.08, 0.66, 0.2, '#5cc05a'],
    [0.08, 0.5, -0.06, 0.3, 0.66, 0.2, '#5cc05a'],
    [-0.27, 0.66, -0.02, -0.11, 0.72, 0.16, '#ffffff'],
    [0.11, 0.66, -0.02, 0.27, 0.72, 0.16, '#ffffff'],
    [-0.32, 0.55, 0.04, -0.3, 0.64, 0.14, '#1d1d1d'],
    [0.3, 0.55, 0.04, 0.32, 0.64, 0.14, '#1d1d1d'],
  ];
  const PENGUIN = [
    [-0.22, 0, 0, -0.04, 0.06, 0.24, '#f59e0b'],
    [0.04, 0, 0, 0.22, 0.06, 0.24, '#f59e0b'],
    [-0.29, 0.06, -0.26, 0.29, 0.86, 0.24, '#2b3142'],
    [-0.21, 0.1, 0.24, 0.21, 0.66, 0.28, '#f5f5f5'],
    [-0.33, 0.2, -0.16, -0.29, 0.56, 0.12, '#222736'],
    [0.29, 0.2, -0.16, 0.33, 0.56, 0.12, '#222736'],
    [-0.07, 0.6, 0.24, 0.07, 0.68, 0.38, '#f59e0b'],
    [0.29, 0.6, 0.04, 0.31, 0.74, 0.18, '#ffffff'],
    [-0.31, 0.6, 0.04, -0.29, 0.74, 0.18, '#ffffff'],
    [0.31, 0.63, 0.08, 0.32, 0.71, 0.15, '#111111'],
    [-0.32, 0.63, 0.08, -0.31, 0.71, 0.15, '#111111'],
  ];
  const FOX = [
    [-0.2, 0, -0.06, -0.06, 0.1, 0.1, '#3b2a20'],
    [0.06, 0, -0.06, 0.2, 0.1, 0.1, '#3b2a20'],
    [-0.24, 0.1, -0.3, 0.24, 0.5, 0.2, '#f07c2a'],
    [-0.16, 0.12, 0.2, 0.16, 0.42, 0.24, '#fff4e6'],
    [-0.1, 0.18, -0.6, 0.1, 0.42, -0.3, '#f07c2a'],
    [-0.1, 0.18, -0.74, 0.1, 0.42, -0.6, '#fff4e6'],
    [-0.25, 0.42, -0.08, 0.25, 0.78, 0.3, '#f07c2a'],
    [-0.12, 0.44, 0.3, 0.12, 0.6, 0.46, '#fff4e6'],
    [-0.04, 0.56, 0.46, 0.04, 0.62, 0.5, '#222222'],
    [-0.24, 0.78, 0.02, -0.1, 0.94, 0.14, '#f07c2a'],
    [0.1, 0.78, 0.02, 0.24, 0.94, 0.14, '#f07c2a'],
    [-0.24, 0.94, 0.02, -0.1, 1.0, 0.14, '#2b2b2b'],
    [0.1, 0.94, 0.02, 0.24, 1.0, 0.14, '#2b2b2b'],
    [0.25, 0.6, 0.12, 0.27, 0.68, 0.2, '#222222'],
    [-0.27, 0.6, 0.12, -0.25, 0.68, 0.2, '#222222'],
  ];
  const ROBOT = [
    [-0.2, 0, -0.08, -0.06, 0.18, 0.08, '#6b7280'],
    [0.06, 0, -0.08, 0.2, 0.18, 0.08, '#6b7280'],
    [-0.28, 0.18, -0.22, 0.28, 0.6, 0.22, '#9ca3af'],
    [-0.14, 0.3, -0.24, 0.14, 0.5, -0.22, '#22d3ee'],
    [-0.36, 0.26, -0.08, -0.28, 0.54, 0.08, '#6b7280'],
    [0.28, 0.26, -0.08, 0.36, 0.54, 0.08, '#6b7280'],
    [-0.24, 0.6, -0.2, 0.24, 0.92, 0.2, '#d1d5db'],
    [-0.18, 0.7, 0.2, 0.18, 0.82, 0.22, '#22d3ee'],
    [0.24, 0.72, 0.02, 0.26, 0.8, 0.14, '#22d3ee'],
    [-0.26, 0.72, 0.02, -0.24, 0.8, 0.14, '#22d3ee'],
    [-0.025, 0.92, -0.025, 0.025, 1.08, 0.025, '#6b7280'],
    [-0.055, 1.08, -0.055, 0.055, 1.17, 0.055, '#ef4444'],
  ];
  const OWL = [
    [-0.18, 0, 0, -0.06, 0.06, 0.16, '#f59e0b'],
    [0.06, 0, 0, 0.18, 0.06, 0.16, '#f59e0b'],
    [-0.3, 0.06, -0.26, 0.3, 0.8, 0.26, '#8b5e3c'],
    [-0.2, 0.1, 0.26, 0.2, 0.5, 0.29, '#e9d3b0'],
    [-0.24, 0.5, 0.26, 0.24, 0.76, 0.29, '#f3e5c8'],
    [-0.04, 0.54, 0.29, 0.04, 0.64, 0.36, '#f59e0b'],
    [-0.34, 0.2, -0.18, -0.3, 0.62, 0.18, '#6f4a2e'],
    [0.3, 0.2, -0.18, 0.34, 0.62, 0.18, '#6f4a2e'],
    [-0.16, 0.3, -0.27, 0.16, 0.36, -0.26, '#6f4a2e'],
    [0.3, 0.54, 0.04, 0.32, 0.74, 0.22, '#facc15'],
    [-0.32, 0.54, 0.04, -0.3, 0.74, 0.22, '#facc15'],
    [0.32, 0.59, 0.09, 0.33, 0.69, 0.17, '#111111'],
    [-0.33, 0.59, 0.09, -0.32, 0.69, 0.17, '#111111'],
    [-0.22, 0.8, -0.22, 0.22, 0.85, 0.22, '#111827'],
    [-0.36, 0.85, -0.36, 0.36, 0.9, 0.36, '#1f2937'],
    [0.28, 0.62, -0.32, 0.32, 0.85, -0.28, '#facc15'],
  ];
  const CHARS = [
    { key: 'cr_char_chick', price: 0, fx: ['#ffffff', '#f0e6d8'], parts: CHICK },
    { key: 'cr_char_frog', price: 15, fx: ['#5cc05a', '#c9f29b'], parts: FROG },
    { key: 'cr_char_penguin', price: 30, fx: ['#2b3142', '#f5f5f5'], parts: PENGUIN },
    { key: 'cr_char_fox', price: 50, fx: ['#f07c2a', '#fff4e6'], parts: FOX },
    { key: 'cr_char_robot', price: 80, fx: ['#9ca3af', '#22d3ee'], parts: ROBOT },
    { key: 'cr_char_owl', price: 120, fx: ['#8b5e3c', '#f3e5c8'], parts: OWL },
  ];
  for (const ch of CHARS) { ch.cp = ch.parts.map(() => ({ x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0, c: '' })); ch.co = ch.cp.slice(); }

  const PARTS = Array.from({ length: MAXP }, () => ({ k: 0, t: 0, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, ph: 0, c: '' }));
  const AMB = Array.from({ length: NAMB }, () => ({ k: 0, x: 0, y: 0, vx: 0, vy: 0, s: 0, ph: 0, a: 0, c: '' }));
  const AMBN = [0, 22, 46, 26, 46, 34];
  const STRIKES = Array.from({ length: NSTR }, () => ({ on: false, x: 0, z: 0, t: 0, k: 0, hit: false }));
  const ByX = (a, b) => a.x - b.x;

  function StorageGet(k, d) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch (_) { return d; } }
  function StorageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function LoadBest() { return StorageGet(LS_BEST, 0); }

  function NormalizeGrades(raw) {
    if (!Array.isArray(raw) || !raw.length) return FallbackGrades();
    return raw.map((g, i) => {
      const Pct = g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : null);
      return { subject: g.subject || `Vak ${i + 1}`, Pct: Pct != null ? +Pct.toFixed(1) : null,
               label: g.label || (g.score != null ? `${g.score}/${g.maxScore}` : '?') };
    });
  }
  function FallbackGrades() {
    const N = ['Wiskunde', 'Nederlands', 'Frans', 'Wetenschappen', 'Geschiedenis', 'Engels', 'Sport', 'Latijn', 'Economie'];
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
  function Pool() { return _grades.length ? _grades : (_fallback || (_fallback = FallbackGrades())); }
  function PickGood() {
    const g = Pool().filter(x => (x.Pct ?? 60) >= 50);
    return g.length ? g[RndI(g.length)] : { Pct: 80, label: '16/20' };
  }
  function PickBad() {
    const g = Pool().filter(x => (x.Pct ?? 60) < 50);
    return g.length ? g[RndI(g.length)] : { Pct: 30, label: '6/20' };
  }

  function Hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function Mix(a, b, t) {
    const p = Hex(a), q = Hex(b);
    return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function Nightify(p, bm) {
    const o = {};
    for (const k in p) {
      const v = p[k];
      if (bm.keep.includes(k)) o[k] = v;
      else if (typeof v === 'string' && v[0] === '#') o[k] = Mix(v, NINK, bm.nf);
      else if (Array.isArray(v)) o[k] = v.map(c => Mix(c, NINK, k === 'neon' ? 0 : bm.nf));
      else o[k] = v;
    }
    o.night = true; o.lit = true;
    o.shadow = 'rgba(0,0,12,0.32)';
    o.oob = 'rgba(0,4,16,0.32)';
    o.head = '#fff2b0'; o.tail = '#ff4a3d'; o.win = '#fde68a'; o.lamp = '#fff3b0';
    if (!bm.keep.includes('glass')) o.glass = '#ffe08a';
    return o;
  }
  function Rnd(a, b) { return a + Math.random() * (b - a); }
  function RndI(n) { return Math.random() * n | 0; }
  function Diff(z) { return Math.min(1, Math.max(0, z) / 240); }
  function BiomeAt(z) {
    if (z < BSTART[5] + BLAST) { let i = 5; while (i > 0 && z < BSTART[i]) i--; return i; }
    return 1 + (((z - BSTART[5] - BLAST) / BLOOP | 0) % 5);
  }
  function PickW(list) {
    let r = Math.random(), i = 0;
    for (; i < list.length - 1; i++) { r -= list[i][1]; if (r < 0) break; }
    return list[i][0];
  }

  let GS = null, P = null, _grades = [], _fallback = null, _raf = null, _kh = null, _tobs = null;
  let _root = null, _cv = null, _ctx = null, _icon = null, _ptr = null, _vig = null, _topN = -1, _topS = '', _scN = -1, _scS = '', _bkN = -1, _bkS = '';
  let B = PAL[0][0], _K = 0, _ink = '#000000', _dark = null, _tv = 0, RES = 1, _pi = 0;
  let X = null, OX = 0, OY = 0, _mb = null;
  let _ac = null, _noise = null, _sound = StorageGet(LS_SOUND, false);
  let _own = StorageGet(LS_OWN, [0]), _char = StorageGet(LS_CHAR, 0), _pcv = [];
  if (!Array.isArray(_own) || !_own.includes(0)) _own = [0];
  if (!_own.includes(_char)) _char = 0;
  const _spr = new Map();
  const _shade = new Map();

  function Shade(c) {
    let s = _shade.get(c);
    if (!s) { s = [Mix(c, '#ffffff', 0.07), Mix(c, _ink, 0.17), Mix(c, _ink, 0.34), Mix(c, _ink, 0.58), Mix(c, '#ffffff', 0.42)]; _shade.set(c, s); }
    return s;
  }

  function SX(x, z) { return OX + (x * YC + z * YS) * TS; }
  function GY(x, z) { return OY - (z * YC - x * YS) * PS * TS; }

  function Ext(x, y) {
    if (x < _mb[0]) _mb[0] = x;
    if (y < _mb[1]) _mb[1] = y;
    if (x > _mb[2]) _mb[2] = x;
    if (y > _mb[3]) _mb[3] = y;
  }
  function Face(c, ax, ay, bx, by, cx, cy, dx, dy) {
    if (_mb) { Ext(ax, ay); Ext(bx, by); Ext(cx, cy); Ext(dx, dy); return; }
    X.fillStyle = c; X.strokeStyle = c;
    X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx, by); X.lineTo(cx, cy); X.lineTo(dx, dy); X.closePath();
    X.fill(); X.stroke();
  }
  function Box(x0, y0, z0, x1, y1, z1, c) {
    const s = Shade(c), h0 = y0 * HY, h1 = y1 * HY;
    const ax = SX(x0, z0), ay = GY(x0, z0), bx = SX(x1, z0), by = GY(x1, z0);
    const cx = SX(x1, z1), cy = GY(x1, z1), dx = SX(x0, z1), dy = GY(x0, z1);
    Face(s[1], ax, ay - h0, bx, by - h0, bx, by - h1, ax, ay - h1);
    Face(s[2], bx, by - h0, cx, cy - h0, cx, cy - h1, bx, by - h1);
    Face(s[0], ax, ay - h1, bx, by - h1, cx, cy - h1, dx, dy - h1);
    if (_mb || (x1 - x0) * TS < 4.5 || (z1 - z0) * TS < 4.5 || (y1 - y0) * HY < 2.5) return;
    X.lineWidth = 0.85; X.strokeStyle = s[4]; X.globalAlpha = 0.55;
    X.beginPath(); X.moveTo(ax, ay - h1); X.lineTo(bx, by - h1); X.lineTo(cx, cy - h1); X.moveTo(bx, by - h1); X.lineTo(bx, by - h0); X.stroke();
    X.globalAlpha = 1; X.strokeStyle = s[3];
    X.beginPath(); X.moveTo(ax, ay - h0); X.lineTo(bx, by - h0); X.lineTo(cx, cy - h0); X.lineTo(cx, cy - h1); X.lineTo(dx, dy - h1); X.lineTo(ax, ay - h1); X.closePath(); X.stroke();
    X.lineWidth = 0.6;
  }
  function DecF(x0, y0, x1, y1, z, c) {
    Face(Shade(c)[1], SX(x0, z), GY(x0, z) - y0 * HY, SX(x1, z), GY(x1, z) - y0 * HY, SX(x1, z), GY(x1, z) - y1 * HY, SX(x0, z), GY(x0, z) - y1 * HY);
  }
  function DecR(z0, y0, z1, y1, x, c) {
    Face(Shade(c)[2], SX(x, z0), GY(x, z0) - y0 * HY, SX(x, z1), GY(x, z1) - y0 * HY, SX(x, z1), GY(x, z1) - y1 * HY, SX(x, z0), GY(x, z0) - y1 * HY);
  }
  function DecT(x0, z0, x1, z1, y, c) {
    const h = y * HY;
    Face(Shade(c)[0], SX(x0, z0), GY(x0, z0) - h, SX(x1, z0), GY(x1, z0) - h, SX(x1, z1), GY(x1, z1) - h, SX(x0, z1), GY(x0, z1) - h);
  }
  function TopPoly(c, pts, y) {
    if (_mb) { for (const p of pts) Ext(SX(p[0], p[1]), GY(p[0], p[1]) - y * HY); return; }
    X.fillStyle = c; X.beginPath();
    pts.forEach((p, i) => { const sx = SX(p[0], p[1]), sy = GY(p[0], p[1]) - y * HY; if (i) X.lineTo(sx, sy); else X.moveTo(sx, sy); });
    X.closePath(); X.fill();
  }
  function SubStrip(x0, x1, z0, z1, y) {
    const h = y * HY;
    X.moveTo(SX(x0, z0), GY(x0, z0) - h); X.lineTo(SX(x1, z0), GY(x1, z0) - h);
    X.lineTo(SX(x1, z1), GY(x1, z1) - h); X.lineTo(SX(x0, z1), GY(x0, z1) - h); X.closePath();
  }
  function SubFront(x0, x1, z, y0, y1) {
    const a = GY(x0, z), b = GY(x1, z);
    X.moveTo(SX(x0, z), a - y0 * HY); X.lineTo(SX(x1, z), b - y0 * HY);
    X.lineTo(SX(x1, z), b - y1 * HY); X.lineTo(SX(x0, z), a - y1 * HY); X.closePath();
  }
  function FillPath(c, stroke) {
    X.fillStyle = c; X.fill();
    if (stroke) { X.strokeStyle = c; X.stroke(); }
  }

  function Spr(bi, key, fn, a, b, c) {
    const id = bi * 10000 + key, s = _spr.get(id);
    if (s) return s;
    const sb = B;
    B = PAL[_K][bi];
    const r = MakeSprite(id, fn, a, b, c);
    B = sb;
    return r;
  }
  function MakeSprite(key, fn, a, b, c) {
    const sx = X, so = OX, sp = OY;
    OX = 0; OY = 0; _mb = [1e9, 1e9, -1e9, -1e9];
    fn(a, b, c);
    const m = _mb;
    _mb = null;
    const w = Math.ceil(m[2] - m[0]) + 4, h = Math.ceil(m[3] - m[1]) + 4;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * RES); cv.height = Math.ceil(h * RES);
    X = cv.getContext('2d');
    X.setTransform(RES, 0, 0, RES, 0, 0); X.lineWidth = 0.6; X.lineJoin = 'round'; X.lineCap = 'round';
    OX = 2 - m[0]; OY = 2 - m[1];
    fn(a, b, c);
    const s = { cv, w, h, ox: OX, oy: OY };
    X = sx; OX = so; OY = sp;
    _spr.set(key, s);
    return s;
  }
  function Blit(s, x, y, z) { X.drawImage(s.cv, SX(x, z) - s.ox, GY(x, z) - y * HY - s.oy, s.w, s.h); }

  function TreeModel(v) {
    const fh = [0.62, 0.98, 1.38][v];
    Box(-0.12, 0, -0.12, 0.12, 0.3, 0.12, B.trunk);
    Box(-0.37, 0.3, -0.37, 0.37, 0.3 + fh, 0.37, B.leaf);
    if (v) DecF(-0.37, 0.3 + fh * 0.48, 0.37, 0.3 + fh * 0.53, -0.37, Mix(B.leaf, _ink, 0.12));
    DecT(-0.27, -0.27, 0.02, 0.02, 0.3 + fh, Mix(B.leaf, '#ffffff', 0.14));
  }
  function RockModel() {
    Box(-0.36, 0, -0.32, 0.34, 0.28, 0.3, B.rock);
    Box(-0.22, 0.28, -0.2, 0.16, 0.4, 0.14, Mix(B.rock, '#ffffff', 0.12));
  }
  function BushModel() {
    Box(-0.4, 0, -0.34, 0.4, 0.4, 0.32, B.leaf2);
    Box(-0.28, 0.4, -0.24, 0.2, 0.54, 0.18, Mix(B.leaf2, '#ffffff', 0.12));
    DecF(-0.3, 0.22, -0.2, 0.3, -0.34, B.flowers[2]);
    DecF(0.1, 0.12, 0.2, 0.2, -0.34, B.flowers[1]);
  }
  function BinModel() {
    Box(-0.24, 0, -0.24, 0.24, 0.58, 0.24, '#2f9e5b');
    Box(-0.28, 0.58, -0.28, 0.28, 0.66, 0.28, '#24804a');
    DecF(-0.1, 0.22, 0.1, 0.42, -0.24, '#e8f7ee');
    DecF(-0.05, 0.27, 0.05, 0.37, -0.24, '#2f9e5b');
  }
  function PineModel(v, snowy) {
    const n = 2 + v;
    Box(-0.1, 0, -0.1, 0.1, 0.26, 0.1, B.trunk);
    let y = 0.26;
    for (let i = 0; i < n; i++) {
      const w = 0.44 - i * (0.3 / n);
      Box(-w, y, -w, w, y + 0.4, w, B.pine);
      if (snowy) { DecT(-w + 0.04, -w + 0.04, w - 0.04, w - 0.04, y + 0.4, B.snow); DecF(-w, y + 0.31, w, y + 0.4, -w, B.snow); }
      else DecF(-w, y + 0.04, w, y + 0.09, -w, Mix(B.pine, _ink, 0.14));
      y += 0.34;
    }
    Box(-0.06, y + 0.06, -0.06, 0.06, y + 0.2, 0.06, snowy ? B.snow : Mix(B.pine, '#ffffff', 0.1));
  }
  function StumpModel() {
    Box(-0.3, 0, -0.28, 0.3, 0.32, 0.28, B.trunk);
    DecT(-0.22, -0.2, 0.22, 0.2, 0.32, B.logEnd);
    DecT(-0.1, -0.08, 0.1, 0.08, 0.32, Mix(B.logEnd, B.trunk, 0.5));
    Box(0.22, 0, -0.4, 0.28, 0.12, -0.34, '#f5f0e6');
    Box(0.15, 0.12, -0.46, 0.35, 0.2, -0.28, '#e74c3c');
  }
  function SnowmanModel() {
    Box(-0.32, 0, -0.3, 0.32, 0.5, 0.3, B.snow);
    Box(-0.22, 0.5, -0.2, 0.22, 0.86, 0.2, B.snow);
    Box(-0.25, 0.47, -0.23, 0.25, 0.56, 0.23, '#e5484d');
    Box(-0.03, 0.64, -0.34, 0.03, 0.7, -0.2, '#f97316');
    DecF(-0.13, 0.73, -0.07, 0.79, -0.2, '#1f2937');
    DecF(0.07, 0.73, 0.13, 0.79, -0.2, '#1f2937');
    Box(-0.23, 0.86, -0.21, 0.23, 0.9, 0.21, '#1f2937');
    Box(-0.15, 0.9, -0.14, 0.15, 1.12, 0.14, '#1f2937');
  }
  function CactusModel(v) {
    const h = 0.95 + v * 0.18;
    Box(-0.13, 0, -0.13, 0.13, h, 0.13, B.cactus);
    Box(0.13, 0.4, -0.08, 0.33, 0.52, 0.08, B.cactus);
    Box(0.21, 0.52, -0.08, 0.33, 0.84, 0.08, B.cactus);
    if (v) { Box(-0.33, 0.55, -0.08, -0.13, 0.66, 0.08, B.cactus); Box(-0.33, 0.66, -0.08, -0.21, 0.94, 0.08, B.cactus); }
    DecF(-0.05, 0.1, -0.02, h - 0.1, -0.13, Mix(B.cactus, '#ffffff', 0.25));
    DecF(0.05, 0.1, 0.08, h - 0.1, -0.13, Mix(B.cactus, _ink, 0.12));
    if (v === 2) Box(-0.06, h, -0.06, 0.06, h + 0.07, 0.06, '#f472b6');
  }
  function MesaModel() {
    const c = B.mesa;
    Box(-0.42, 0, -0.38, 0.4, 0.24, 0.36, Mix(c, _ink, 0.06));
    Box(-0.32, 0.24, -0.28, 0.26, 0.46, 0.24, c);
    Box(-0.16, 0.46, -0.14, 0.12, 0.6, 0.1, Mix(c, '#ffffff', 0.12));
    DecF(-0.42, 0.1, 0.4, 0.13, -0.38, Mix(c, '#ffffff', 0.18));
    DecF(-0.32, 0.33, 0.26, 0.36, -0.28, Mix(c, _ink, 0.14));
  }
  function LampModel() {
    Box(-0.12, 0, -0.12, 0.12, 0.12, 0.12, '#334155');
    Box(-0.04, 0.12, -0.04, 0.04, 1.55, 0.04, '#475569');
    Box(-0.04, 1.5, -0.04, 0.3, 1.56, 0.04, '#475569');
    Box(0.16, 1.4, -0.08, 0.38, 1.5, 0.08, B.lamp);
  }
  function HydrantModel() {
    Box(-0.14, 0, -0.14, 0.14, 0.48, 0.14, '#ef4444');
    Box(-0.1, 0.48, -0.1, 0.1, 0.57, 0.1, '#dc2626');
    Box(-0.22, 0.25, -0.05, 0.22, 0.34, 0.05, '#dc2626');
  }
  function SignModel(v) {
    const n = B.neon[v];
    Box(-0.34, 0, -0.3, 0.34, 0.92, 0.3, '#1e1b2e');
    Box(-0.36, 0.92, -0.32, 0.36, 0.98, 0.32, n);
    DecF(-0.27, 0.68, 0.27, 0.76, -0.3, n);
    DecF(-0.27, 0.5, 0.12, 0.58, -0.3, n);
    DecF(-0.27, 0.32, 0.2, 0.4, -0.3, n);
    DecR(-0.22, 0.3, 0.22, 0.78, 0.34, Mix(n, '#ffffff', 0.15));
  }
  function ObsidianModel() {
    Box(-0.36, 0, -0.32, 0.34, 0.32, 0.3, B.rock);
    Box(-0.2, 0.32, -0.18, 0.14, 0.54, 0.12, Mix(B.rock, '#ffffff', 0.1));
    DecF(-0.24, 0.06, -0.2, 0.24, -0.32, B.glowc);
    DecF(0.08, 0.12, 0.12, 0.28, -0.32, B.glowc);
    DecR(-0.1, 0.08, -0.06, 0.26, 0.34, B.glowc);
  }
  function CrystalModel() {
    Box(-0.1, 0, -0.1, 0.1, 0.82, 0.1, B.crystal);
    Box(0.08, 0, -0.02, 0.22, 0.5, 0.12, Mix(B.crystal, '#ffffff', 0.15));
    Box(-0.27, 0, -0.06, -0.11, 0.42, 0.08, Mix(B.crystal, '#ff4400', 0.2));
    Box(-0.2, 0, -0.16, 0.2, 0.08, 0.16, B.rock);
  }
  function CharredModel() {
    Box(-0.1, 0, -0.1, 0.1, 0.95, 0.1, B.trunk);
    Box(0.1, 0.5, -0.05, 0.34, 0.58, 0.05, B.trunk);
    Box(0.26, 0.58, -0.05, 0.34, 0.82, 0.05, B.trunk);
    Box(-0.32, 0.66, -0.05, -0.1, 0.73, 0.05, B.trunk);
    Box(0.27, 0.82, -0.04, 0.33, 0.87, 0.04, B.glowc);
    DecF(-0.04, 0.2, 0.0, 0.5, -0.1, B.glowc);
  }
  function MossModel() {
    RockModel();
    Box(-0.24, 0.4, -0.2, 0.12, 0.45, 0.12, B.moss);
    DecF(-0.36, 0.2, 0.34, 0.26, -0.32, B.moss);
  }
  function BuildingModel(v) {
    const h = 1.5 + v * 0.8, wc = B.win, dc = Mix(B.bld, _ink, 0.3);
    Box(-0.47, 0, -0.47, 0.47, h, 0.47, B.bld);
    Box(-0.42, h, -0.42, 0.42, h + 0.08, 0.42, Mix(B.bld, '#ffffff', 0.08));
    let r = 0;
    for (let y = 0.3; y < h - 0.25; y += 0.42, r++) {
      for (let c = 0; c < 3; c++) {
        const lit = (r * 3 + c * 7 + v) % 4 !== 0;
        DecF(-0.38 + c * 0.28, y, -0.22 + c * 0.28, y + 0.22, -0.47, lit ? wc : dc);
        if (c < 2) DecR(-0.34 + c * 0.42, y, -0.12 + c * 0.42, y + 0.22, 0.47, (r + c + v) % 3 ? wc : dc);
      }
    }
    DecF(-0.44, 0.06, 0.44, 0.12, -0.47, B.neon[v % 5]);
  }
  const OBSM = [TreeModel, RockModel, BushModel, BinModel, PineModel, StumpModel, v => PineModel(v, true), SnowmanModel, CactusModel, MesaModel,
    LampModel, HydrantModel, SignModel, ObsidianModel, CrystalModel, CharredModel, MossModel, BuildingModel];
  function ObsModel(m, v) { OBSM[m](v); }

  function DecoModel(k) {
    if (k === 0 || k === 9) {
      Box(-0.08, 0, -0.03, -0.04, 0.1, 0.01, B.tuft);
      Box(-0.01, 0, -0.02, 0.03, 0.15, 0.02, B.tuft);
      Box(0.06, 0, 0, 0.1, 0.08, 0.04, B.tuft);
    } else if (k <= 3) {
      Box(-0.015, 0, -0.015, 0.015, 0.08, 0.015, B.tuft);
      Box(-0.05, 0.08, -0.05, 0.05, 0.13, 0.05, B.flowers[k - 1]);
      Box(-0.02, 0.13, -0.02, 0.02, 0.15, 0.02, '#ffd84d');
    } else if (k === 4) {
      Box(-0.07, 0, -0.05, 0.06, 0.06, 0.05, Mix(B.rock, '#ffffff', 0.1));
      Box(0.08, 0, 0.02, 0.13, 0.04, 0.07, B.rock);
    } else if (k === 5) {
      Box(-0.025, 0, -0.025, 0.025, 0.08, 0.025, '#f5f0e6');
      Box(-0.08, 0.08, -0.08, 0.08, 0.14, 0.08, '#e74c3c');
      DecT(-0.04, -0.04, 0.0, 0.0, 0.14, '#ffffff');
    } else if (k === 6) {
      Box(-0.12, 0, -0.02, -0.08, 0.14, 0.02, B.pine);
      Box(-0.02, 0, -0.02, 0.02, 0.2, 0.02, B.pine);
      Box(0.07, 0, -0.02, 0.11, 0.13, 0.02, B.pine);
    } else if (k === 7) {
      Box(-0.16, 0, -0.1, 0.14, 0.07, 0.1, B.snow);
      Box(-0.08, 0.07, -0.06, 0.06, 0.12, 0.05, B.snow);
    } else if (k === 8) {
      Box(-0.12, 0, -0.025, 0.12, 0.04, 0.025, B.bone);
      Box(-0.15, 0, -0.05, -0.1, 0.05, 0.05, B.bone);
      Box(0.1, 0, -0.05, 0.15, 0.05, 0.05, B.bone);
    } else if (k === 10) {
      DecT(-0.3, -0.05, 0.06, -0.01, 0.004, B.glowc);
      DecT(0.02, -0.05, 0.06, 0.16, 0.004, B.glowc);
      DecT(-0.12, 0.06, 0.2, 0.1, 0.004, B.crystal);
    } else if (k === 11) {
      Box(-0.12, 0, -0.06, 0.0, 0.025, 0.04, '#e0913a');
      Box(0.02, 0, -0.02, 0.12, 0.02, 0.08, '#c85a2a');
      Box(-0.04, 0.02, 0.0, 0.06, 0.04, 0.06, '#f0b84a');
    } else if (k === 12) {
      Box(-0.13, 0, -0.09, 0.13, 0.05, 0.09, '#3b82f6');
      DecF(-0.11, 0.01, 0.11, 0.04, -0.09, '#ffffff');
    } else if (k === 14) {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; pts.push([Math.cos(a) * 0.2, Math.sin(a) * 0.2]); }
      TopPoly('#2f3346', pts, 0.004);
    } else {
      Box(-0.09, 0, -0.09, 0.09, 0.03, 0.09, '#f97316');
      Box(-0.05, 0.03, -0.05, 0.05, 0.22, 0.05, '#f97316');
      DecF(-0.05, 0.1, 0.05, 0.14, -0.05, '#ffffff');
    }
  }
  function PadModel(kind) {
    if (kind === 1) {
      Box(-0.36, -0.06, -0.3, 0.34, 0.06, 0.3, B.floe);
      DecT(-0.24, -0.18, 0.06, 0.06, 0.06, '#ffffff');
      return;
    }
    if (kind === 2) {
      Box(-0.34, -0.1, -0.31, 0.34, 0.06, 0.3, B.stone);
      DecF(-0.34, -0.1, 0.34, -0.04, -0.31, B.glowc);
      DecT(-0.2, -0.15, 0.1, -0.11, 0.06, Mix(B.stone, '#ffffff', 0.1));
      return;
    }
    const pts = [[0, 0]];
    for (let i = 0; i <= 12; i++) { const a = 0.45 + i / 12 * (Math.PI * 2 - 0.9); pts.push([Math.cos(a) * 0.37, Math.sin(a) * 0.37]); }
    TopPoly(Mix(B.pad, _ink, 0.35), pts, 0);
    TopPoly(B.pad, pts, 0.05);
    Box(-0.05, 0.05, 0.08, 0.05, 0.12, 0.18, B.flowers[2]);
  }
  function RaftModel(kind, len) {
    if (kind === 1) {
      Box(0.04, -0.1, -0.34, len - 0.04, LOG_TOP, 0.34, B.floe);
      DecT(0.2, -0.22, len * 0.5, 0.0, LOG_TOP, '#ffffff');
      DecF(0.04, -0.1, len - 0.04, 0.0, -0.34, Mix(B.floe, '#5aa6d6', 0.35));
      return;
    }
    if (kind === 2) {
      Box(0, -0.1, -0.32, len, LOG_TOP - 0.04, 0.32, B.barge);
      Box(0.08, LOG_TOP - 0.04, -0.26, len - 0.08, LOG_TOP, 0.26, '#5b6684');
      DecF(0, 0.02, len, 0.07, -0.32, B.neon[len % 5]);
      DecR(-0.28, 0.0, 0.28, 0.06, len, B.neon[len % 5]);
      return;
    }
    if (kind === 3) {
      Box(0, -0.1, -0.32, len, LOG_TOP, 0.32, B.stone);
      DecF(0.02, -0.1, len - 0.02, -0.03, -0.32, B.glowc);
      DecT(0.3, -0.12, len * 0.6, -0.08, LOG_TOP, Mix(B.stone, _ink, 0.2));
      DecT(len * 0.5, 0.1, len - 0.3, 0.14, LOG_TOP, Mix(B.stone, '#ffffff', 0.1));
      return;
    }
    Box(0, -0.08, -0.3, len, LOG_TOP, 0.3, B.log);
    DecT(0.2, -0.17, len * 0.55, -0.13, LOG_TOP, B.bark);
    DecT(len * 0.35, 0.02, len - 0.25, 0.06, LOG_TOP, B.bark);
    DecT(0.45, 0.17, len * 0.7, 0.21, LOG_TOP, B.bark);
    DecF(0.3, 0.02, len * 0.6, 0.06, -0.3, B.bark);
    DecR(-0.25, -0.04, 0.25, LOG_TOP - 0.03, len, B.logEnd);
    DecR(-0.12, 0.03, 0.12, 0.11, len, Mix(B.logEnd, B.log, 0.5));
  }
  function SignalModel() {
    Box(-0.2, 0, -0.1, 0.2, 0.08, 0.1, B.signal);
    Box(-0.045, 0.08, -0.045, 0.045, 1.0, 0.045, B.signal);
    Box(-0.25, 1.0, -0.08, 0.25, 1.25, 0.06, '#33363d');
    Box(-0.3, 1.36, -0.03, 0.3, 1.44, 0.01, '#f2f2f2');
    DecF(-0.3, 1.38, 0.3, 1.42, -0.03, '#d63b30');
    Box(-0.03, 1.25, -0.03, 0.03, 1.36, 0.01, B.signal);
  }
  function FlagModel() {
    Box(-0.035, 0, -0.035, 0.035, 1.25, 0.035, '#e5e7eb');
    Box(0.035, 0.86, -0.02, 0.5, 1.2, 0.01, '#facc15');
    DecF(0.12, 0.96, 0.42, 1.1, -0.02, '#f59e0b');
  }
  function GlowModel(gi) {
    const r = GLOWS[gi][1];
    if (_mb) { Ext(-r, -r); Ext(r, r); return; }
    const g = X.createRadialGradient(OX, OY, 0, OX, OY, r);
    g.addColorStop(0, `rgba(${GLOWS[gi][0]},0.75)`); g.addColorStop(0.4, `rgba(${GLOWS[gi][0]},0.28)`); g.addColorStop(1, `rgba(${GLOWS[gi][0]},0)`);
    X.fillStyle = g; X.beginPath(); X.arc(OX, OY, r, 0, Math.PI * 2); X.fill();
  }
  function BeamModel(dir) {
    const x1 = dir * 3;
    const pts = [SX(0, -0.24), GY(0, -0.24), SX(x1, -0.5), GY(x1, -0.5), SX(x1, 0.5), GY(x1, 0.5), SX(0, 0.24), GY(0, 0.24)];
    if (_mb) { for (let i = 0; i < 8; i += 2) Ext(pts[i], pts[i + 1]); return; }
    const g = X.createLinearGradient(SX(0, 0), GY(0, 0), SX(x1, 0), GY(x1, 0));
    g.addColorStop(0, 'rgba(255,236,160,0.5)'); g.addColorStop(1, 'rgba(255,236,160,0)');
    X.fillStyle = g; X.beginPath(); X.moveTo(pts[0], pts[1]);
    for (let i = 2; i < 8; i += 2) X.lineTo(pts[i], pts[i + 1]);
    X.closePath(); X.fill();
  }
  function BoulderModel(f) {
    const c = B.boulder, o = f * 0.15;
    Box(0.04, 0.16, -0.38, 0.86, 0.66, 0.38, c);
    Box(0.14, 0.03, -0.3, 0.76, 0.8, 0.3, Mix(c, '#ffffff', 0.04));
    Box(0.24, 0, -0.2, 0.66, 0.9, 0.2, Mix(c, '#ffffff', 0.09));
    DecF(0.1 + o, 0.22, 0.15 + o, 0.6, -0.38, B.glowc);
    DecF(0.15 + o, 0.4, 0.4 + o, 0.45, -0.38, B.glowc);
    DecF(0.6 - o * 0.5, 0.28, 0.74 - o * 0.5, 0.33, -0.38, B.crystal);
    DecT(0.3 + o * 0.6, -0.14, 0.34 + o * 0.6, 0.14, 0.9, B.glowc);
  }
  function TumbleModel(f) {
    const c = B.tumble, d = Mix(c, _ink, 0.38), o = f * 0.12;
    Box(0.06, 0.16, -0.32, 0.8, 0.6, 0.32, c);
    Box(0.16, 0.05, -0.24, 0.7, 0.72, 0.24, Mix(c, '#ffffff', 0.05));
    Box(0.26, 0, -0.14, 0.6, 0.78, 0.14, Mix(c, '#ffffff', 0.1));
    DecF(0.12 + o, 0.2, 0.17 + o, 0.58, -0.32, d);
    DecF(0.08, 0.3 + o, 0.78, 0.34 + o, -0.32, d);
    DecF(0.5 - o, 0.18, 0.54 - o, 0.6, -0.32, d);
    DecF(0.3, 0.48 - o, 0.62, 0.52 - o, -0.32, d);
    DecT(0.3, -0.12 + o, 0.56, -0.09 + o, 0.78, d);
  }
  function VehModel(kind, ci, dir) {
    if (kind === 3) { BoulderModel(ci); return; }
    if (kind === 4) { TumbleModel(ci); return; }
    const L = VLEN[kind], m = dir > 0;
    const Bx = (x0, y0, z0, x1, y1, z1, c) => m ? Box(x0, y0, z0, x1, y1, z1, c) : Box(L - x1, y0, z0, L - x0, y1, z1, c);
    const F = (x0, y0, x1, y1, z, c) => m ? DecF(x0, y0, x1, y1, z, c) : DecF(L - x1, y0, L - x0, y1, z, c);
    if (kind === 5) {
      if (ci) {
        Bx(0.12, 0, -0.32, 0.82, 0.24, 0.32, '#9ca3af');
        Bx(0.16, 0.24, -0.28, 0.78, 0.28, 0.28, '#ef4444');
        Bx(0.32, 0.28, -0.05, 0.62, 0.38, 0.05, '#dc2626');
        return;
      }
      Bx(0.05, 0.02, -0.22, 0.7, 0.3, 0.22, '#2b3142');
      Bx(0.55, 0.1, -0.19, 0.86, 0.4, 0.19, '#2b3142');
      Bx(0.86, 0.2, -0.05, 0.95, 0.27, 0.05, '#f59e0b');
      Bx(-0.05, 0.04, -0.12, 0.05, 0.1, 0.12, '#f59e0b');
      F(0.08, 0.02, 0.62, 0.1, -0.22, '#f5f5f5');
      F(0.7, 0.28, 0.76, 0.34, -0.19, '#ffffff');
      return;
    }
    const lamp = m ? B.head : B.tail;
    const bus = kind === 1 && B.bus && ci % 2 === 0;
    const col = bus ? '#f6c234' : B.cars[ci];
    if (kind === 0) {
      Bx(0, 0.12, -0.36, L, 0.48, 0.36, col);
      DecR(-0.3, 0.27, -0.16, 0.37, L, lamp); DecR(0.16, 0.27, 0.3, 0.37, L, lamp);
      F(0.02, 0.2, L - 0.02, 0.26, -0.36, Mix(col, _ink, 0.25));
      Bx(0.26, 0.48, -0.3, 0.98, 0.8, 0.3, Mix(col, '#ffffff', 0.08));
      F(0.32, 0.54, 0.6, 0.75, -0.3, B.glass); F(0.66, 0.54, 0.92, 0.75, -0.3, B.glass);
      DecR(-0.25, 0.53, 0.25, 0.76, m ? 0.98 : L - 0.26, B.glass);
      if (B.taxi) {
        F(0.02, 0.12, L - 0.02, 0.16, -0.36, B.neon[ci % 5]);
        if (ci === 2) Bx(0.48, 0.8, -0.12, 0.76, 0.92, 0.12, '#fde047');
      }
      Bx(0.14, 0, -0.41, 0.42, 0.24, -0.35, B.tire); Bx(L - 0.42, 0, -0.41, L - 0.14, 0.24, -0.35, B.tire);
    } else if (kind === 1) {
      Bx(0, 0.12, -0.37, L, 0.88, 0.37, col);
      F(0.1, 0.52, 0.62, 0.76, -0.37, B.glass); F(0.7, 0.52, 1.18, 0.76, -0.37, B.glass); F(1.26, 0.52, L - 0.1, 0.76, -0.37, B.glass);
      F(0, 0.3, L, 0.38, -0.37, bus ? '#1f2937' : Mix(col, '#ffffff', 0.45));
      if (B.taxi) F(0, 0.12, L, 0.16, -0.37, B.neon[(ci + 1) % 5]);
      DecR(-0.29, 0.5, 0.29, 0.78, L, B.glass);
      DecR(-0.31, 0.24, -0.18, 0.34, L, lamp); DecR(0.18, 0.24, 0.31, 0.34, L, lamp);
      Bx(0.16, 0, -0.42, 0.46, 0.25, -0.36, B.tire); Bx(L - 0.46, 0, -0.42, L - 0.16, 0.25, -0.36, B.tire);
    } else {
      const cargo = () => {
        Bx(0, 0.24, -0.4, L - 0.9, 1.06, 0.4, B.cargo);
        F(0.2, 0.34, L - 1.1, 0.96, -0.4, col);
        F(0.25, 0.39, L - 1.15, 0.91, -0.4, B.panel);
        if (!m) DecR(-0.36, 0.3, 0.36, 1.0, L, Mix(B.cargo, _ink, 0.06));
      };
      const cab = () => {
        Bx(L - 0.84, 0.18, -0.36, L, 0.84, 0.36, col);
        F(L - 0.62, 0.5, L - 0.12, 0.74, -0.36, B.glass);
        if (m) { DecR(-0.28, 0.5, 0.28, 0.76, L, B.glass); DecR(-0.3, 0.26, -0.18, 0.36, L, lamp); DecR(0.18, 0.26, 0.3, 0.36, L, lamp); }
        if (B.plow) Bx(L - 0.06, 0.04, -0.44, L + 0.08, 0.4, 0.44, '#f59e0b');
      };
      Bx(0, 0.1, -0.3, L, 0.24, 0.3, B.tire);
      if (m) { cargo(); cab(); } else { cab(); cargo(); }
      if (!m) { DecR(-0.32, 0.3, -0.2, 0.4, L, lamp); DecR(0.2, 0.3, 0.32, 0.4, L, lamp); }
      Bx(0.18, 0, -0.42, 0.5, 0.26, -0.36, B.tire); Bx(0.56, 0, -0.42, 0.88, 0.26, -0.36, B.tire); Bx(L - 0.52, 0, -0.42, L - 0.2, 0.26, -0.36, B.tire);
    }
  }
  function TrainLen(n) { return 3 + n * 2.95; }
  function TrainModel(n, dir) {
    let x = 0;
    for (let i = 0; i <= n; i++) {
      const loco = dir > 0 ? i === n : i === 0;
      const w = loco ? 3 : 2.8;
      Box(x + 0.1, 0, -0.43, x + w - 0.1, 0.18, 0.43, '#2c2d33');
      if (B.cart) {
        Box(x, 0.18, -0.44, x + w, loco ? 1.0 : 0.82, 0.44, B.train);
        DecF(x + 0.1, 0.3, x + w - 0.1, 0.36, -0.44, B.trainTrim);
        if (loco) {
          Box(x + 0.6, 1.0, -0.3, x + w - 0.6, 1.36, 0.3, B.trainRoof);
          if (dir > 0) DecR(-0.12, 0.5, 0.12, 0.7, x + w, B.head);
        } else {
          Box(x + 0.2, 0.82, -0.32, x + w - 0.2, 0.9, 0.32, B.glowc);
          Box(x + 0.6, 0.9, -0.2, x + 1.2, 1.02, 0.1, B.crystal);
          Box(x + 1.5, 0.9, -0.1, x + 2.1, 0.98, 0.22, B.crystal);
        }
        x += w + 0.15;
        continue;
      }
      Box(x, 0.18, -0.45, x + w, loco ? 1.0 : 1.2, 0.45, B.train);
      if (loco) {
        const cx = dir > 0 ? x : x + 1.8;
        Box(cx, 1.0, -0.45, cx + 1.2, 1.42, 0.45, B.train);
        Box(cx + 0.1, 1.42, -0.4, cx + 1.1, 1.5, 0.4, B.trainRoof);
        DecF(cx + 0.2, 1.06, cx + 1.0, 1.32, -0.45, B.glass);
        DecF(x, 0.42, x + w, 0.54, -0.45, B.trainTrim);
        if (dir > 0) {
          DecR(-0.32, 0.5, 0.32, 0.86, x + w, B.glass);
          DecR(-0.1, 0.24, 0.1, 0.38, x + w, B.head);
          Box(x + w - 0.04, 0.18, -0.45, x + w + 0.08, 0.3, 0.45, '#3a3b42');
        }
        const hx = dir > 0 ? x + 1.6 : x + 0.9;
        Box(hx, 1.0, -0.1, hx + 0.22, 1.24, 0.12, '#3a3b42');
      } else {
        Box(x + 0.12, 1.2, -0.4, x + w - 0.12, 1.3, 0.4, B.trainRoof);
        for (let k = 0; k < 4; k++) DecF(x + 0.22 + k * 0.62, 0.66, x + 0.66 + k * 0.62, 1.0, -0.45, B.glass);
        DecF(x, 0.42, x + w, 0.52, -0.45, B.trainTrim);
      }
      x += w + 0.15;
    }
  }

  function CharDraw(ci, x, y, z, face, k, sy) {
    const ch = CHARS[ci], D = ch.parts, cp = ch.cp;
    for (let i = 0; i < D.length; i++) {
      const d = D[i], o = cp[i];
      const a0 = d[0] * k, a1 = d[3] * k, b0 = d[2] * k, b1 = d[5] * k;
      let x0, x1, z0, z1;
      if (face === 0) { x0 = a0; x1 = a1; z0 = b0; z1 = b1; }
      else if (face === 1) { x0 = b0; x1 = b1; z0 = -a1; z1 = -a0; }
      else if (face === 2) { x0 = -a1; x1 = -a0; z0 = -b1; z1 = -b0; }
      else { x0 = -b1; x1 = -b0; z0 = a0; z1 = a1; }
      o.x0 = x + x0; o.x1 = x + x1; o.z0 = z + z0; o.z1 = z + z1;
      o.y0 = y + d[1] * sy; o.y1 = y + d[4] * sy; o.c = d[6];
    }
    ch.co.sort(PartCmp);
    for (const o of ch.co) Box(o.x0, o.y0, o.z0, o.x1, o.y1, o.z1, o.c);
  }
  function PartCmp(a, b) {
    if (a.z1 <= b.z0) return 1;
    if (b.z1 <= a.z0) return -1;
    if (a.x1 <= b.x0) return -1;
    if (b.x1 <= a.x0) return 1;
    return a.y0 - b.y0;
  }

  function Eagle(x, y, z, flap) {
    const f = Math.sin(flap) * 0.3;
    Box(x - 0.28, y + 0.08, z + 0.7, x + 0.28, y + 0.28, z + 1.3, '#3e2f25');
    Box(x - 2, y + 0.14 + f, z - 0.05, x - 0.85, y + 0.28 + f, z + 0.65, '#4a3a2e');
    Box(x - 0.88, y + 0.16 + f * 0.4, z - 0.12, x - 0.4, y + 0.32 + f * 0.4, z + 0.72, '#5a4636');
    Box(x - 0.42, y, z - 0.7, x + 0.42, y + 0.58, z + 0.78, '#5a4636');
    Box(x - 0.3, y + 0.2, z - 1.15, x + 0.3, y + 0.72, z - 0.65, '#f4f4f4');
    Box(x - 0.11, y + 0.28, z - 1.4, x + 0.11, y + 0.48, z - 1.15, '#f6b93b');
    Box(x + 0.4, y + 0.16 + f * 0.4, z - 0.12, x + 0.88, y + 0.32 + f * 0.4, z + 0.72, '#5a4636');
    Box(x + 0.85, y + 0.14 + f, z - 0.05, x + 2, y + 0.28 + f, z + 0.65, '#4a3a2e');
  }

  function Snd(kind) {
    if (!_sound || !_ac) return;
    const t = _ac.currentTime;
    if (kind === 'hop') Tone(t, 360, 620, 0.06, 'square', 0.02);
    else if (kind === 'slide') Tone(t, 900, 500, 0.12, 'triangle', 0.025);
    else if (kind === 'coin') { Tone(t, 988, 990, 0.07, 'square', 0.035); Tone(t + 0.07, 1319, 1320, 0.16, 'square', 0.035); }
    else if (kind === 'ding') Tone(t, 1760, 1740, 0.35, 'triangle', 0.06);
    else if (kind === 'eagle') Tone(t, 1600, 700, 0.5, 'sawtooth', 0.035);
    else if (kind === 'zone') { Tone(t, 523, 524, 0.1, 'square', 0.03); Tone(t + 0.09, 659, 660, 0.1, 'square', 0.03); Tone(t + 0.18, 784, 785, 0.22, 'square', 0.03); }
    else if (kind === 'buy') { Tone(t, 660, 990, 0.12, 'triangle', 0.05); Tone(t + 0.1, 990, 1480, 0.2, 'triangle', 0.05); }
    else if (kind === 'hit') { Noise(t, 0.2, 600, 0.22); Tone(t, 170, 50, 0.22, 'square', 0.06); }
    else if (kind === 'splash') Noise(t, 0.45, 1500, 0.16);
    else if (kind === 'zap') { Noise(t, 0.5, 5000, 0.18); Tone(t, 90, 40, 0.5, 'sawtooth', 0.05); }
    else if (kind === 'boom') { Noise(t, 0.5, 900, 0.22); Tone(t, 120, 40, 0.4, 'square', 0.05); }
    else if (kind === 'alarm') { Tone(t, 880, 660, 0.18, 'triangle', 0.04); Tone(t + 0.2, 880, 660, 0.18, 'triangle', 0.04); }
    else if (kind === 'gem') { Tone(t, 1319, 1320, 0.08, 'square', 0.035); Tone(t + 0.07, 1760, 1761, 0.08, 'square', 0.035); Tone(t + 0.14, 2637, 2640, 0.2, 'square', 0.03); }
    else if (kind === 'sizzle') { Noise(t, 0.6, 3200, 0.12); Tone(t, 220, 80, 0.4, 'sawtooth', 0.03); }
  }
  function Tone(t, f0, f1, dur, type, vol) {
    const o = _ac.createOscillator(), g = _ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(_ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function Noise(t, dur, freq, vol) {
    if (!_noise) {
      _noise = _ac.createBuffer(1, _ac.sampleRate / 2 | 0, _ac.sampleRate);
      const d = _noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = _ac.createBufferSource(), f = _ac.createBiquadFilter(), g = _ac.createGain();
    s.buffer = _noise; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(_ac.destination); s.start(t); s.stop(t + dur);
  }
  function WakeAudio() {
    if (!_sound) return;
    if (!_ac) {
      const AC = W.AudioContext || W.webkitAudioContext;
      if (!AC) return;
      _ac = new AC();
    }
    if (_ac.state === 'suspended') _ac.resume();
  }
  function ToggleSound() {
    _sound = !_sound;
    StorageSet(LS_SOUND, _sound);
    WakeAudio();
    SyncSoundBtn();
  }
  function SyncSoundBtn() {
    document.getElementById('gf-cr-sound-btn')?.classList.toggle('on', _sound);
    _icon.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/>${_sound ? '<path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>' : '<path d="M17 9.5l5 5M22 9.5l-5 5"/>'}</svg>`;
  }

  function NewLane(z, type, bi) {
    return { z, type, bi, from: -1, t: 1, ban: false, sub: 0, h: 0, obs: [], items: [], pads: null, block: null, deco: [], coin: null,
             speed: 0, dir: 1, tt: 0, warn: false, ding: 0, ring: 0, seed: Math.random() * 32, cv: -1, c0: '', c1: '' };
  }

  function PickRun(z) {
    const g = GS.gen, d = Diff(z), prev = g.type, bm = BIOMES[g.bi];
    let t = 'grass';
    if (prev === 'grass' || (prev !== 'ice' && Math.random() > 0.68)) {
      for (let k = 0; k < 8; k++) {
        t = PickW(bm.lanes);
        if (t !== prev && (t !== 'ice' || prev === 'grass')) break;
        t = 'grass';
      }
    }
    g.type = t;
    if (t === 'grass') g.left = Math.random() < 0.3 ? 2 : 1;
    else if (t === 'road') g.left = 1 + RndI(2 + Math.round(3 * d)) + (g.bi === 3 && Math.random() < 0.5 ? 1 : 0);
    else if (t === 'river') g.left = 1 + RndI(2 + Math.round(1.5 * d));
    else if (t === 'ice') g.left = Math.random() < 0.4 ? 2 : 1;
    else if (t === 'tumble' || t === 'boulder') g.left = 1 + RndI(2 + Math.round(d));
    else g.left = Math.random() < 0.25 + 0.3 * d ? 2 : 1;
  }

  function Gen(z) {
    const g = GS.gen, bi = BiomeAt(z);
    if (bi !== g.bi) { g.from = g.bi; g.bi = bi; g.trans = 3; g.left = 0; g.type = 'grass'; }
    let type = 'grass';
    if (!g.trans && z >= 3) {
      if (g.left <= 0) PickRun(z);
      type = g.type;
      g.left--;
    }
    const bm = BIOMES[bi];
    const L = NewLane(z, type === 'tumble' || type === 'boulder' ? 'road' : type, bi);
    if (g.trans) { L.from = g.from; L.t = (4 - g.trans) / 4; L.ban = g.trans === 3; g.trans--; }
    if (type === 'grass') GenGrass(L, z <= -3);
    else if (type === 'road') GenRoad(L, 0);
    else if (type === 'tumble') GenRoad(L, 1);
    else if (type === 'boulder') GenRoad(L, 2);
    else if (type === 'rail') GenRail(L);
    else if (type === 'ice') GenIce(L);
    else if (g.last !== 'lily' && Math.random() < bm.lily) GenLily(L);
    else GenRiver(L);
    g.last = L.type;
    GS.lanes.set(z, L);
  }

  function PickOpen(open) {
    const c = [];
    for (let i = 0; i < 9; i++) if (open[i]) c.push(i);
    return c[RndI(c.length)];
  }
  function Spread(blk, prev) {
    const o = new Uint8Array(9);
    for (let c = 0; c < 9; c++) if (!blk[c] && prev[c]) o[c] = 1;
    for (let c = 1; c < 9; c++) if (o[c - 1] && !blk[c]) o[c] = 1;
    for (let c = 7; c >= 0; c--) if (o[c + 1] && !blk[c]) o[c] = 1;
    return o;
  }
  function MaybeCoin(L, open) {
    if (L.z < 4 || Math.random() > 0.11) return;
    const c = PickOpen(open), gr = PickGood(), col = GradeColor(gr.Pct), gem = L.z > 20 && Math.random() < 0.16;
    L.coin = { x: c - HALF, t: String(Math.round(gr.Pct ?? 75)), col, rim: Mix(col, '#000000', 0.32), got: false, v: gem ? 5 : 1 };
  }
  function PickBi(L) { return L.from >= 0 && Math.random() > L.t ? L.from : L.bi; }

  function GenGrass(L, wall) {
    const g = GS.gen, d = Diff(L.z), blk = new Uint8Array(9);
    L.h = GRASS_H;
    const p = wall ? 1 : L.z < 3 ? 0.1 : 0.12 + 0.24 * d;
    for (let c = 0; c < 9; c++) blk[c] = Math.random() < p ? 1 : 0;
    if (L.z === 0) blk.fill(0, 2, 7);
    if (!wall) {
      let free = 0, hit = false;
      for (let c = 0; c < 9; c++) if (!blk[c]) { free++; if (g.open[c]) hit = true; }
      if (!hit) { blk[PickOpen(g.open)] = 0; free++; }
      while (free < 3) { const c = RndI(9); if (blk[c]) { blk[c] = 0; free++; } }
      g.open = Spread(blk, g.open);
      MaybeCoin(L, g.open);
    }
    L.block = blk;
    for (let x = -13; x <= 13; x++) {
      const inside = Math.abs(x) <= HALF, bi = PickBi(L), bm = BIOMES[bi];
      if (inside ? blk[x + HALF] : Math.random() < (wall ? 0.92 : bm.outP)) {
        const pool = inside && !wall ? bm.obsIn : bm.obsOut, m = pool[RndI(pool.length)];
        const v = !inside && OBSV[m] === 3 ? 1 + RndI(2) : RndI(OBSV[m]);
        L.obs.push({ x, m, v, bi });
      }
    }
    const n = 3 + RndI(5);
    for (let i = 0; i < n; i++) {
      const bi = PickBi(L), dk = BIOMES[bi].deco;
      L.deco.push({ x: Rnd(-13, 13), z: L.z + Rnd(-0.38, 0.38), k: dk[RndI(dk.length)], bi });
    }
  }

  function GenRoad(L, sub) {
    const d = Diff(L.z), bm = BIOMES[L.bi], r = Math.random();
    L.sub = sub;
    L.dir = Math.random() < 0.5 ? 1 : -1;
    let kind, v, fast = false;
    if (sub === 1) { kind = 4; v = Rnd(1.4, 2.3) + 1.6 * d; }
    else if (sub === 2) { kind = 3; v = Rnd(1.5, 2.4) + 2 * d; }
    else {
      kind = r < bm.veh[0] ? 0 : r < bm.veh[1] ? 1 : 2;
      v = (Rnd(1.9, 2.9) + 2.8 * d + Math.random() * 1.2 * d) * [1, 0.88, 0.72][kind] * bm.vmul;
      fast = d > 0.12 && kind === 0 && Math.random() < (L.bi === 3 ? 0.32 : 0.18);
      if (fast) v *= 1.7;
    }
    L.speed = v * L.dir;
    const len = VLEN[kind], gap = Math.max(sub ? 3.2 : 2.8, v * 0.8), extra = (fast ? 9 : sub ? 7 : 6) - 3 * d;
    const start = -WRAP + Math.random() * 4;
    for (let x = start; x + len + gap <= start + WRAP * 2; x += len + gap + Math.random() * extra) {
      const gr = kind === 2 ? PickBad() : null;
      L.items.push({ x, len, kind, ci: kind >= 3 ? 0 : RndI(8), g: gr, tc: gr ? Mix(GradeColor(gr.Pct), '#000000', 0.12) : '', bob: 0, ph: Math.random() * 6 });
    }
    GS.gen.open.fill(1);
    MaybeCoin(L, GS.gen.open);
  }

  function GenIce(L) {
    const d = Diff(L.z);
    L.h = ICE_H;
    L.dir = Math.random() < 0.5 ? 1 : -1;
    const v = Rnd(1.3, 2) + 1.5 * d;
    L.speed = v * L.dir;
    const gap = Math.max(3.4, v), extra = 7 - 3 * d, start = -WRAP + Math.random() * 4;
    for (let x = start; x + 1 + gap <= start + WRAP * 2; x += 1 + gap + Math.random() * extra) {
      const ci = Math.random() < 0.65 ? 0 : 1;
      L.items.push({ x, len: ci ? 0.7 : VLEN[5], kind: 5, ci, g: null, tc: '', bob: 0, ph: 0 });
    }
    GS.gen.open.fill(1);
    MaybeCoin(L, GS.gen.open);
  }

  function GenRiver(L) {
    const g = GS.gen, d = Diff(L.z), bm = BIOMES[L.bi];
    L.type = 'river'; L.h = WATER_H;
    g.rdir = -g.rdir; L.dir = g.rdir;
    L.speed = (Rnd(0.9, 1.5) + 1.2 * d) * bm.rmul * L.dir;
    const lens = d < 0.35 ? [2, 3, 3, 4] : [2, 2, 3, 3], logs = [];
    let used = 0;
    for (;;) {
      const len = lens[RndI(4)], gap = Rnd(1.1, 1.9 + d);
      if (used + len + gap > WRAP * 2) break;
      logs.push([len, gap]);
      used += len + gap;
    }
    const extra = (WRAP * 2 - used) / logs.length;
    let x = -WRAP + Math.random() * 3;
    for (const [len, gap] of logs) { L.items.push({ x, len, bob: 0 }); x += len + gap + extra; }
    g.open.fill(1);
  }

  function GenLily(L) {
    const g = GS.gen, pads = new Uint8Array(9);
    L.type = 'lily'; L.h = WATER_H;
    const n = 3 + RndI(3);
    for (let i = 0; i < n; i++) pads[RndI(9)] = 1;
    let hit = false;
    for (let c = 0; c < 9; c++) if (pads[c] && g.open[c]) hit = true;
    if (!hit) pads[PickOpen(g.open)] = 1;
    g.open = Spread(pads.map(v => 1 - v), g.open);
    L.pads = pads;
  }

  function GenRail(L) {
    L.dir = Math.random() < 0.5 ? 1 : -1;
    L.speed = TRAIN_V * L.dir;
    L.tt = Rnd(1.5, 5);
    GS.gen.open.fill(1);
    MaybeCoin(L, GS.gen.open);
  }

  function NewGameState() {
    GS = {
      status: 'start', time: 0, lanes: new Map(),
      gen: { type: 'grass', left: 0, last: 'grass', open: new Uint8Array(9).fill(1), rdir: 1, bi: 0, from: -1, trans: 0 },
      genZ: -10, minZ: -10, cx: 0, cz: 0, moved: false,
      score: 0, coins: 0, bank: StorageGet(LS_COINS, 0), best: LoadBest(),
      charge: -1, chargeKey: '', queued: -1, shake: 0, eagle: null, lastTs: 0,
      idle: 0, warned: false, cb: 0, bw: new Float32Array(6), zone: 0, banBi: 0,
      ban: { t: 9, bi: 0, txt: '', sub: '', w: 0 }, markS: '', ev: null, evT: Rnd(16, 26), flash: 0,
    };
    GS.bw[0] = 1;
    GS.markS = `${_GameText('game_best').toUpperCase()} ${GS.best}`;
    P = { x: 0, z: 0, rx: 0, ry: GRASS_H, rz: 0, fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0, t: -1, dur: HOP_T, arc: HOP_H, dir: 0, slide: false,
          face: 0, sq: 0, land: 0, log: null, off: 0, slot: 0, dead: '', dt: 0, flat: false, hide: false };
    for (const p of PARTS) p.life = 0;
    for (const s of STRIKES) s.on = false;
    while (GS.genZ <= 18) Gen(GS.genZ++);
  }

  function StandH(L) {
    if (L.type === 'grass') return GRASS_H;
    if (L.type === 'river') return WATER_H + LOG_TOP;
    if (L.type === 'lily') return WATER_H + 0.06;
    if (L.type === 'ice') return ICE_H;
    return 0;
  }

  function Press(dir, code) {
    if (GS.status === 'start') BeginPlay();
    if (GS.status !== 'playing' || P.dead) return;
    if (GS.charge >= 0) Release();
    GS.charge = dir; GS.chargeKey = code;
    if (P.t < 0) P.face = dir;
  }
  function Release() {
    const d = GS.charge;
    GS.charge = -1; GS.chargeKey = '';
    if (d >= 0) TryHop(d);
  }

  function Move(tx, tz, ty, dur, arc) {
    P.fx = P.x; P.fy = P.ry; P.fz = P.z;
    P.tx = tx; P.tz = tz; P.ty = ty;
    P.t = 0; P.dur = dur; P.arc = arc; P.log = null;
  }

  function TryHop(dir) {
    if (P.dead) return;
    if (P.t >= 0) { GS.queued = dir; return; }
    P.face = dir;
    const tz = P.z + DIRS[dir][1], L = GS.lanes.get(tz);
    if (!L) return;
    let tx = P.x + DIRS[dir][0];
    if (L.type !== 'river') tx = Math.round(tx);
    else if (P.log && tz === P.z) tx += L.speed * HOP_T;
    const c = Math.round(tx) + HALF;
    if (c < 0 || c > 8 || (L.type === 'grass' && L.block[c])) { P.land = 0.7; return; }
    Move(tx, tz, StandH(L), HOP_T, HOP_H);
    P.dir = dir; P.slide = false;
    GS.moved = true; GS.idle = 0; GS.warned = false;
    Snd('hop');
  }

  function Slide(dir) {
    const tz = P.z + DIRS[dir][1], L = GS.lanes.get(tz);
    if (!L || (L.type !== 'grass' && L.type !== 'ice')) return false;
    const tx = Math.round(P.x + DIRS[dir][0]), c = tx + HALF;
    if (c < 0 || c > 8 || (L.type === 'grass' && L.block[c])) return false;
    Move(tx, tz, StandH(L), SLIDE_T, 0);
    P.dir = dir; P.slide = true;
    Emit(4, P.x, ICE_H, P.z, 3, 0, '#ffffff');
    Snd('slide');
    return true;
  }

  function Land() {
    const L = GS.lanes.get(P.z), slid = P.slide;
    P.slide = false;
    P.land = slid ? 0.35 : 1;
    P.ry = P.ty;
    if (L.type === 'river') {
      let log = null;
      for (const v of L.items) if (P.x > v.x - 0.22 && P.x < v.x + v.len + 0.22) log = v;
      if (!log) { Die(L.bi === 5 ? 'lava' : 'water'); return; }
      P.log = log; log.bob = 1;
      P.off = P.x - log.x;
      P.slot = Math.max(0.5, Math.min(log.len - 0.5, Math.floor(P.off) + 0.5));
    } else if (L.type === 'lily' && !L.pads[Math.round(P.x) + HALF]) { Die(L.bi === 5 ? 'lava' : 'water'); return; }
    if (L.coin && !L.coin.got && L.coin.x === Math.round(P.x)) Collect(L);
    if (P.z > GS.score) GS.score = P.z;
    if (L.ban && L.bi !== GS.banBi) { GS.banBi = L.bi; ShowBanner(L.bi); }
    if (L.type === 'ice' && !(slid && P.dir & 1) && Slide(P.dir)) return;
    if (!slid && L.type !== 'river' && L.type !== 'lily') Emit(4, P.x, L.h, P.z, 5, 0, PAL[_K][L.bi].dust);
    if (GS.queued >= 0) { const q = GS.queued; GS.queued = -1; TryHop(q); }
  }

  function Collect(L) {
    L.coin.got = true;
    GS.coins += L.coin.v; GS.bank += L.coin.v;
    StorageSet(LS_COINS, GS.bank);
    Emit(3, L.coin.x, L.h + 0.45, L.z, L.coin.v > 1 ? 26 : 14, 0);
    Snd(L.coin.v > 1 ? 'gem' : 'coin');
  }

  function ShowBanner(bi) {
    const b = GS.ban;
    GS.zone++;
    b.t = 0; b.bi = bi;
    b.txt = _GameText(BIOMES[bi].key).toUpperCase();
    b.sub = `${_GameText('cr_zone').toUpperCase()} ${GS.zone}`;
    _ctx.font = FONT_BAN;
    b.w = Math.min(560, _ctx.measureText(b.txt).width);
    if (GS.zone > 1) Snd('zone');
  }

  function Die(kind, dir) {
    if (P.dead) return;
    P.dead = kind; P.dt = 0; P.log = null;
    GS.queued = -1; GS.charge = -1;
    const x = P.rx, y = P.ry, z = P.rz;
    if (kind === 'car' || kind === 'boulder' || kind === 'tumble' || kind === 'slide' || kind === 'meteor') {
      const L = GS.lanes.get(Math.round(z));
      P.flat = true; P.t = -1; P.rz = L.z; P.ry = L.h + 0.01;
      GS.shake = 0.35;
      Emit(0, x, y + 0.3, z, 12, dir * 1.5);
      Snd('hit');
    } else if (kind === 'train' || kind === 'bolt') {
      P.hide = true; P.t = -1;
      GS.shake = 0.6;
      Emit(0, x, y + 0.4, z, 30, dir * 6);
      Snd('hit');
    } else if (kind === 'eagle') {
      P.t = -1;
      GS.eagle = { x: P.rx, y: 4, z: P.rz + 12, got: false, flap: 0 };
      Snd('eagle');
    } else if (kind === 'lava') {
      Emit(5, x, WATER_H, z, 22, 0);
      Emit(2, x, WATER_H + 0.01, z, 1, 0, '#ffd166');
      GS.shake = 0.2;
      Snd('sizzle');
    } else {
      Emit(1, x, WATER_H, z, 20, 0, PAL[_K][GS.lanes.get(Math.round(z))?.bi || 0].foam);
      Emit(2, x, WATER_H + 0.01, z, 1, 0, '#ffffff');
      Snd('splash');
    }
  }

  function Emit(k, x, y, z, n, bias, col) {
    const fx = CHARS[_char].fx;
    for (let i = 0; i < n; i++) {
      const p = PARTS[_pi];
      _pi = (_pi + 1) % MAXP;
      const a = Math.random() * Math.PI * 2, s = Math.random();
      p.k = k; p.t = 0; p.x = x; p.y = y; p.z = z; p.ph = Math.random() * 6;
      if (k === 0) {
        p.vx = Math.cos(a) * (0.8 + s * 2.2) + bias; p.vz = Math.sin(a) * (0.8 + s * 2.2); p.vy = 1.5 + Math.random() * 2.8;
        p.life = 1.3 + Math.random() * 0.9; p.s = 5 + Math.random() * 3; p.c = Math.random() < 0.8 ? fx[0] : fx[1];
      } else if (k === 1) {
        p.vx = Math.cos(a) * (0.5 + s * 1.5); p.vz = Math.sin(a) * (0.5 + s * 1.5); p.vy = 3 + Math.random() * 3.5;
        p.life = 1; p.s = 3 + Math.random() * 2.5; p.c = Math.random() < 0.5 ? '#ffffff' : col;
      } else if (k === 2) {
        p.vx = 0; p.vy = 0; p.vz = 0; p.life = 0.9; p.s = 0; p.c = col;
      } else if (k === 3) {
        p.vx = Math.cos(a) * 1.4; p.vz = Math.sin(a) * 1.4; p.vy = 2 + Math.random() * 2.5;
        p.life = 0.6 + Math.random() * 0.3; p.s = 3 + Math.random() * 2; p.c = Math.random() < 0.5 ? '#ffe066' : '#ffffff';
      } else if (k === 4) {
        p.vx = Math.cos(a) * (0.7 + s * 0.6); p.vz = Math.sin(a) * (0.5 + s * 0.4); p.vy = 0.5 + Math.random() * 0.6;
        p.life = 0.35 + Math.random() * 0.2; p.s = 3 + Math.random() * 2.5; p.c = col;
      } else {
        p.vx = Math.cos(a) * (0.4 + s * 1.2); p.vz = Math.sin(a) * (0.4 + s * 1.2); p.vy = 2.5 + Math.random() * 3.5;
        p.life = 0.8 + Math.random() * 0.6; p.s = 3 + Math.random() * 3; p.c = Math.random() < 0.3 ? '#ffd166' : Math.random() < 0.5 ? '#ff6a00' : '#5b4a46';
      }
    }
  }

  function Update(dt) {
    GS.time += dt;
    UpdateLanes(dt);
    if (GS.status === 'playing') {
      if (P.dead) UpdateDeath(dt);
      else UpdatePlayer(dt);
      UpdateCamera(dt);
    }
    for (const p of PARTS) {
      if (p.t >= p.life) continue;
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.k === 0) {
        p.vy = Math.max(-0.7, p.vy - 6 * dt); p.vx *= 1 - Math.min(1, dt * 2.5); p.vz *= 1 - Math.min(1, dt * 2.5);
        if (p.y < 0.04) p.y = 0.04;
      } else if (p.k === 4) {
        p.vx *= 1 - Math.min(1, dt * 5); p.vz *= 1 - Math.min(1, dt * 5);
      } else if (p.k !== 2) {
        p.vy -= (p.k === 5 ? 6 : 12) * dt;
        if (p.k === 1 && p.y < WATER_H) p.t = p.life;
      }
    }
    if (GS.shake > 0) GS.shake = Math.max(0, GS.shake - dt);
    if (GS.ban.t < 9) GS.ban.t += dt;
    const cl = GS.lanes.get(Math.round(GS.cz) + 2);
    if (cl) GS.cb = cl.bi;
    for (let i = 0; i < 6; i++) GS.bw[i] += ((i === GS.cb ? 1 : 0) - GS.bw[i]) * Math.min(1, dt * 1.4);
    UpdateEvent(dt);
    UpdateAmb(dt);
    while (GS.genZ <= GS.cz + 18) Gen(GS.genZ++);
    while (GS.minZ < GS.cz - 13) GS.lanes.delete(GS.minZ++);
  }

  function AmbSpawn(p, k, any) {
    p.k = k; p.ph = Math.random() * 6; p.a = 0;
    p.x = Math.random() * CV_W; p.y = any ? Math.random() * CV_H : -10;
    if (k === 1) {
      if (_K) { p.y = Math.random() * CV_H; p.vx = Rnd(-8, 8); p.vy = Rnd(-6, 6); p.s = 2.5; p.c = '#e8ff8a'; }
      else { p.vx = Rnd(-14, 14); p.vy = Rnd(16, 30); p.s = 3 + Math.random() * 1.5; p.c = Math.random() < 0.5 ? '#e0a43a' : '#8cc152'; }
    } else if (k === 2) { p.vx = Rnd(-10, 10); p.vy = Rnd(26, 56); p.s = 2 + Math.random() * 2; p.c = '#ffffff'; }
    else if (k === 3) { p.x = any ? p.x : -10; p.y = Math.random() * CV_H; p.vx = Rnd(30, 70); p.vy = Rnd(-6, 6); p.s = 2 + Math.random() * 1.5; p.c = '#fff1c9'; }
    else if (k === 4) { p.vx = -60; p.vy = Rnd(380, 460); p.s = 1; p.c = '#b4c3ff'; }
    else { p.y = any ? p.y : CV_H + 10; p.vx = Rnd(-12, 12); p.vy = Rnd(-60, -26); p.s = 2 + Math.random() * 2; p.c = Math.random() < 0.5 ? '#ffb020' : '#ff6a1a'; }
  }
  function UpdateAmb(dt) {
    const em = GS.ev && GS.ev.w > 0.3 ? EVENTS[GS.ev.k].amb : 0;
    const mode = em || BIOMES[GS.cb].amb, cap = em ? NAMB : AMBN[mode];
    for (let i = 0; i < NAMB; i++) {
      const p = AMB[i];
      if (!p.k) { if (mode && i < cap && Math.random() < dt * 4) AmbSpawn(p, mode, true); continue; }
      p.a = Math.min(1, p.a + dt * 2);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 1 || p.k === 2) p.x += Math.sin(GS.time * 2 + p.ph) * dt * 18;
      if (p.x < -20 || p.x > CV_W + 20 || p.y < -20 || p.y > CV_H + 20) {
        if (mode && i < cap) AmbSpawn(p, mode, false); else p.k = 0;
      }
    }
  }

  function UpdateLanes(dt) {
    for (const L of GS.lanes.values()) {
      if (L.type === 'road' || L.type === 'river' || L.type === 'ice') {
        const sp = L.speed * EvMul(L);
        for (const v of L.items) {
          v.x += sp * dt;
          if (L.speed > 0 && v.x > WRAP) v.x -= WRAP * 2;
          else if (L.speed < 0 && v.x + v.len < -WRAP) v.x += WRAP * 2;
          if (v.bob > 0) v.bob = Math.max(0, v.bob - dt * 4);
        }
        L.items.sort(ByX);
      } else if (L.type === 'rail') UpdateRail(L, dt);
      if (L.ring > 0) L.ring = Math.max(0, L.ring - dt * 2.6);
    }
  }

  function EvMul(L) {
    if (!GS.ev) return 1;
    const e = EVENTS[GS.ev.k], m = L.type === 'river' ? e.river : L.type === 'ice' ? e.ice : L.sub === 0 ? e.road : e.sand;
    return 1 + (m - 1) * GS.ev.w;
  }

  function UpdateEvent(dt) {
    const ev = GS.ev;
    if (ev) {
      ev.t += dt;
      ev.w = Math.min(1, ev.t / 1.2, Math.max(0, (ev.dur - ev.t) / 1.2));
      const e = EVENTS[ev.k];
      if (e.strike && ev.t > 1.5 && ev.t < ev.dur - 1.6 && GS.status === 'playing' && !P.dead) {
        ev.st -= dt;
        if (ev.st <= 0) { ev.st = e.strike * Rnd(0.75, 1.25); Strike(ev.k === 5 ? 1 : 0); }
      }
      if (ev.t >= ev.dur) { GS.ev = null; GS.evT = Rnd(24, 40); }
    } else if (GS.status === 'playing' && GS.moved && !P.dead && GS.score >= 12 && GS.ban.t > 3) {
      GS.evT -= dt;
      if (GS.evT <= 0) StartEvent(GS.cb);
    }
    for (const s of STRIKES) {
      if (!s.on) continue;
      s.t += dt;
      if (!s.hit && s.t >= STR_T) {
        s.hit = true;
        GS.shake = Math.max(GS.shake, s.k ? 0.3 : 0.18);
        const L = GS.lanes.get(s.z), y = L ? L.h : 0;
        if (s.k) { Emit(5, s.x, y + 0.1, s.z, 16, 0); Snd('boom'); }
        else { GS.flash = 1; Emit(3, s.x, y + 0.2, s.z, 14, 0); Snd('zap'); }
        if (GS.status === 'playing' && !P.dead && Math.round(P.rx) === s.x && Math.round(P.rz) === s.z) Die(s.k ? 'meteor' : 'bolt', 0);
      }
      if (s.t > STR_T + 0.45) s.on = false;
    }
    if (GS.flash > 0) GS.flash = Math.max(0, GS.flash - dt * 3.2);
  }

  function StartEvent(k) {
    GS.ev = { k, t: 0, w: 0, dur: EVENTS[k].dur, st: 0.6, txt: _GameText(EVENTS[k].key).toUpperCase() };
    _ctx.font = FONT_EV;
    GS.ev.tw = _ctx.measureText(GS.ev.txt).width;
    Snd('alarm');
  }

  function Strike(k) {
    let s = null;
    for (const o of STRIKES) if (!o.on) { s = o; break; }
    if (!s) return;
    for (let n = 0; n < 6; n++) {
      const aim = Math.random() < 0.35;
      const z = aim ? P.z : P.z + 1 + RndI(4), x = aim ? Math.round(P.x) : RndI(9) - HALF, L = GS.lanes.get(z);
      if (!L || L.type === 'river' || L.type === 'lily' || Math.abs(x) > HALF || (L.type === 'grass' && L.block[x + HALF])) continue;
      let dup = false;
      for (const o of STRIKES) if (o.on && o.x === x && o.z === z) dup = true;
      if (dup) continue;
      s.on = true; s.hit = false; s.t = 0; s.x = x; s.z = z; s.k = k;
      return;
    }
  }

  function UpdateRail(L, dt) {
    const tr = L.items[0];
    if (tr) {
      tr.x += L.speed * dt;
      if (L.dir > 0 ? tr.x > WRAP : tr.x + tr.len < -WRAP) { L.items.length = 0; L.tt = Rnd(2.5, 6.5 - 2 * Diff(L.z)); }
    } else {
      L.tt -= dt;
      if (L.tt <= 0) {
        const n = 2 + RndI(3), len = TrainLen(n);
        L.items.push({ x: L.dir > 0 ? -WRAP - len : WRAP, len, n });
      }
    }
    L.warn = L.items.length > 0 || L.tt < WARN_T;
    if (!L.warn) { L.ding = 0; return; }
    L.ding -= dt;
    if (L.ding <= 0) {
      L.ding = 0.34; L.ring = 1;
      if (GS.status === 'playing' && Math.abs(L.z - GS.cz) < 8) Snd('ding');
    }
  }

  function UpdatePlayer(dt) {
    if (P.t >= 0) {
      P.t = Math.min(1, P.t + dt / P.dur);
      const e = P.t;
      P.rx = P.fx + (P.tx - P.fx) * e;
      P.rz = P.fz + (P.tz - P.fz) * e;
      P.ry = P.fy + (P.ty - P.fy) * e + Math.sin(Math.PI * e) * P.arc;
      if (P.t >= 1) { P.t = -1; P.x = P.tx; P.z = P.tz; P.rx = P.x; P.rz = P.z; Land(); }
    } else if (P.log) {
      P.off += (P.slot - P.off) * Math.min(1, dt * 14);
      P.x = P.log.x + P.off;
      P.rx = P.x;
      P.ry = WATER_H + LOG_TOP - Math.sin(P.log.bob * Math.PI) * 0.06;
      if (Math.abs(P.x) > HALF + 0.7) { Die('edge', 0); return; }
    }
    if (P.dead) return;
    P.sq += ((GS.charge >= 0 ? 1 : 0) - P.sq) * Math.min(1, dt * 30);
    P.land = Math.max(0, P.land - dt * 6);
    const L = GS.lanes.get(Math.round(P.rz));
    if (L && (L.type === 'road' || L.type === 'rail' || L.type === 'ice')) {
      for (const v of L.items) {
        if (P.rx + 0.25 > v.x && P.rx - 0.25 < v.x + v.len) { Die(L.type === 'rail' ? 'train' : DEATH[v.kind], L.dir); return; }
      }
    }
    if (GS.moved && P.t < 0) {
      GS.idle += dt;
      if (GS.idle > IDLE_WARN && !GS.warned) { GS.warned = true; Snd('eagle'); }
      if (GS.idle > IDLE_MAX) { Die('eagle', 0); return; }
    }
    if (P.rz < GS.cz - BACK) Die('eagle', 0);
  }

  function UpdateDeath(dt) {
    P.dt += dt;
    const e = GS.eagle;
    if (e) {
      e.z -= 17 * dt;
      e.flap += dt * 16;
      if (!e.got && e.z <= P.rz) { e.got = true; P.hide = true; Emit(0, P.rx, P.ry + 0.4, P.rz, 10, 0); }
      e.y = e.got ? 1.1 + (P.rz - e.z) * 0.12 : 1.1 + (e.z - P.rz) * 0.24;
    }
    if (P.dt > (e ? 1.5 : 1.05)) GameOver();
  }

  function UpdateCamera(dt) {
    if (GS.moved && !P.dead) GS.cz += (0.55 + Math.min(0.4, GS.score * 0.002)) * dt;
    if (P.rz > GS.cz) GS.cz += (P.rz - GS.cz) * Math.min(1, dt * 3.5);
    GS.cx += (Math.max(-2, Math.min(2, P.rx * 0.5)) - GS.cx) * Math.min(1, dt * 3);
  }

  function SyncTheme() {
    const dark = _root.dataset.theme === 'dark';
    if (dark === _dark) return;
    _dark = dark; _K = dark ? 1 : 0; _ink = dark ? NINK : '#000000';
    _spr.clear(); _shade.clear(); _tv++;
    DrawPortraits();
  }

  function Draw() {
    if (!_ctx || !GS) return;
    SyncTheme();
    X = _ctx;
    X.setTransform(RES, 0, 0, RES, 0, 0);
    X.lineWidth = 0.6; X.lineJoin = 'round'; X.lineCap = 'round';
    const sh = GS.shake * 14, pc = PAL[_K][GS.cb];
    OX = CV_W / 2 - (GS.cx * YC + GS.cz * YS) * TS + (Math.random() - 0.5) * sh;
    OY = FOCUS_Y + (GS.cz * YC - GS.cx * YS) * PS * TS + (Math.random() - 0.5) * sh;
    X.fillStyle = pc.grass[0];
    X.fillRect(0, 0, CV_W, CV_H);
    const zc = Math.floor(GS.cz), zt = zc + 12, zb = zc - 9;
    DrawGround(zt, zb);
    DrawShadows(zt, zb, pc);
    if (P.flat) { const f = Math.min(1, P.dt * 12); CharDraw(_char, P.rx, P.ry, P.rz, P.face, 1 + 0.4 * f, 1 - 0.86 * f); }
    DrawObjects(zt, zb);
    DrawStrikes();
    DrawParticles();
    if (GS.eagle) DrawEagle();
    for (let i = 1; i < 6; i++) {
      const a = GS.bw[i] * BIOMES[i].ta;
      if (a < 0.004) continue;
      X.globalAlpha = a; X.fillStyle = BIOMES[i].tint;
      X.fillRect(0, 0, CV_W, CV_H);
    }
    X.globalAlpha = 1;
    if (GS.ev) {
      const e = EVENTS[GS.ev.k], w = GS.ev.w;
      if (e.dark) { X.globalAlpha = e.dark * w; X.fillStyle = '#05061a'; X.fillRect(0, 0, CV_W, CV_H); }
      if (e.fog) {
        X.globalAlpha = w * (0.42 + 0.06 * Math.sin(GS.time * 1.7));
        X.fillStyle = e.fog;
        X.fillRect(0, 0, CV_W, CV_H * 0.22);
        X.globalAlpha = w * 0.22;
        X.fillRect(0, CV_H * 0.22, CV_W, CV_H * 0.78);
      }
      X.globalAlpha = 1;
    }
    DrawGlows(zt, zb);
    if (C_Night() || GS.bw[4] > 0.05) {
      if (!_vig) {
        _vig = X.createRadialGradient(CV_W / 2, CV_H * 0.55, 160, CV_W / 2, CV_H * 0.55, 520);
        _vig.addColorStop(0, 'rgba(4,8,24,0)'); _vig.addColorStop(1, 'rgba(4,8,24,0.5)');
      }
      X.globalAlpha = C_Night() ? 1 : GS.bw[4];
      X.fillStyle = _vig;
      X.fillRect(0, 0, CV_W, CV_H);
      X.globalAlpha = 1;
    }
    DrawAmb();
    if (GS.flash > 0) { X.globalAlpha = GS.flash * 0.55; X.fillStyle = '#eef2ff'; X.fillRect(0, 0, CV_W, CV_H); X.globalAlpha = 1; }
    if (GS.status !== 'start') { DrawBanner(); DrawEvent(); DrawHud(); }
  }
  function C_Night() { return _K === 1; }

  function LaneCol(L, p) {
    L.cv = _tv;
    const t = L.type;
    if (t === 'grass') {
      let a = p.grass[L.z & 1], s = p.grassSide;
      if (L.from >= 0) { const q = PAL[_K][L.from]; a = Mix(q.grass[L.z & 1], a, L.t); s = Mix(q.grassSide, s, L.t); }
      L.c0 = a; L.c1 = s;
    } else if (t === 'road') { L.c0 = L.sub === 1 ? p.trail : p.road; L.c1 = L.sub === 1 ? p.trailSide : p.roadSide; }
    else if (t === 'rail') { L.c0 = p.rail; L.c1 = p.railSide; }
    else if (t === 'ice') { L.c0 = p.ice; L.c1 = p.iceSide; }
    else { L.c0 = p.water; L.c1 = p.water; }
  }

  function DrawGround(zt, zb) {
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L) continue;
      const N = GS.lanes.get(z - 1), F = GS.lanes.get(z + 1), h = L.h, hn = N ? N.h : h, t = L.type, p = PAL[_K][L.bi];
      if (L.cv !== _tv) LaneCol(L, p);
      X.beginPath();
      SubStrip(-15, 15, z - 0.5, z + 0.5, h);
      FillPath(L.c0, true);
      if (hn < h) {
        X.beginPath();
        SubFront(-15, 15, z - 0.5, hn, h);
        FillPath(L.c1, true);
      }
      if (t === 'grass') {
        if (p.tile && (L.from < 0 || L.t > 0.5)) {
          X.beginPath();
          for (let x = -14.5; x < 15; x += 1) SubStrip(x - 0.02, x + 0.02, z - 0.5, z + 0.5, h);
          SubStrip(-15, 15, z - 0.02, z + 0.02, h);
          FillPath(p.tile, false);
        }
        for (const d of L.deco) Blit(Spr(d.bi, 600 + d.k, DecoModel, d.k), d.x, h, d.z);
      } else if (t === 'road') {
        if (L.sub === 0) {
          X.beginPath();
          if (N && N.type === 'road' && N.sub === 0) for (let x = -15; x < 15; x += 1.6) SubStrip(x, x + 0.75, z - 0.535, z - 0.465, 0);
          else SubStrip(-15, 15, z - 0.46, z - 0.42, 0);
          if (!F || F.type !== 'road' || F.sub !== 0) SubStrip(-15, 15, z + 0.42, z + 0.46, 0);
          FillPath(N && N.type === 'road' && N.sub === 0 ? p.dash : p.curb, false);
          if (N && N.type === 'road' && N.sub === 0 && (!F || F.type !== 'road' || F.sub !== 0)) { X.beginPath(); SubStrip(-15, 15, z + 0.42, z + 0.46, 0); FillPath(p.curb, false); }
        } else {
          X.beginPath();
          for (let i = 0; i < 9; i++) {
            const x = ((i * 3.7 + L.seed) % 30) - 15, zz = z - 0.36 + ((i * 3) % 7) * 0.1;
            SubStrip(x, x + (L.sub === 1 ? 1.1 : 0.5), zz, zz + 0.04, 0);
          }
          FillPath(L.sub === 1 ? p.wind : p.dash, false);
        }
      } else if (t === 'rail') {
        X.beginPath();
        for (let x = -15; x < 15; x += 0.62) SubStrip(x, x + 0.26, z - 0.42, z + 0.42, 0);
        FillPath(p.sleeper, false);
        X.beginPath();
        SubFront(-15, 15, z - 0.3, 0, 0.07); SubFront(-15, 15, z + 0.17, 0, 0.07);
        FillPath(p.steelSide, false);
        X.beginPath();
        SubStrip(-15, 15, z - 0.3, z - 0.23, 0.07); SubStrip(-15, 15, z + 0.17, z + 0.24, 0.07);
        FillPath(p.steel, false);
      } else if (t === 'ice') {
        X.beginPath();
        for (let i = 0; i < 7; i++) {
          const x = ((i * 4.3 + L.seed) % 30) - 15, zz = z - 0.34 + ((i * 2) % 5) * 0.15;
          SubStrip(x, x + 0.9, zz, zz + 0.05, h); SubStrip(x + 0.3, x + 0.55, zz + 0.09, zz + 0.13, h);
        }
        X.globalAlpha = 0.85;
        FillPath(p.iceLine, false);
        X.globalAlpha = 1;
      } else {
        X.beginPath();
        if (!F || F.h > h) SubStrip(-15, 15, z + 0.36, z + 0.5, h);
        const off = GS.time * L.speed * 0.5 + L.seed;
        for (let i = 0; i < 8; i++) {
          const x = ((i * 4.1 + off) % 32 + 32) % 32 - 16, zz = z - 0.32 + ((i * 5) % 7) * 0.09;
          SubStrip(x, x + 0.6, zz, zz + 0.045, h);
        }
        FillPath(p.ripple, false);
        if (p.crust) {
          X.beginPath();
          const o2 = GS.time * L.speed * 0.25 + L.seed * 2;
          for (let i = 0; i < 6; i++) {
            const x = ((i * 5.3 + o2) % 32 + 32) % 32 - 16, zz = z - 0.28 + ((i * 3) % 5) * 0.12;
            SubStrip(x, x + 1.1, zz, zz + 0.14, h);
          }
          FillPath(p.crust, false);
        }
        if (!F || F.h > h) { X.beginPath(); SubStrip(-15, 15, z + 0.4, z + 0.5, h); FillPath(p.foam, false); }
      }
      X.beginPath();
      SubStrip(-15, -HALF - 0.5, z - 0.5, z + 0.5, h); SubStrip(HALF + 0.5, 15, z - 0.5, z + 0.5, h);
      if (hn < h) { SubFront(-15, -HALF - 0.5, z - 0.5, hn, h); SubFront(HALF + 0.5, 15, z - 0.5, hn, h); }
      FillPath(p.oob, false);
      if (z === GS.best && GS.best > 0) DrawMarkLine(z, h);
    }
  }

  function DrawMarkLine(z, h) {
    X.beginPath();
    for (let x = -15; x < 15; x += 0.8) SubStrip(x, x + 0.48, z - 0.5, z - 0.4, h);
    X.globalAlpha = 0.85;
    FillPath('#ffffff', false);
    X.globalAlpha = 1;
    const px = HALF + 1.15, pz = z - 0.3;
    X.setTransform(RES, RES * SLOPE, 0, RES, SX(px, pz) * RES, (GY(px, pz) - h * HY) * RES);
    X.font = FONT_MARK; X.textAlign = 'left'; X.textBaseline = 'middle';
    X.fillStyle = 'rgba(0,0,0,0.35)'; X.fillText(GS.markS, 1.5, 1.5);
    X.fillStyle = '#ffffff'; X.fillText(GS.markS, 0, 0);
    X.setTransform(RES, 0, 0, RES, 0, 0);
  }

  function DrawShadows(zt, zb, pc) {
    X.beginPath();
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L) continue;
      if (L.type === 'grass') {
        for (const o of L.obs) SubStrip(o.x - 0.3, o.x + OBSW[o.m] + (OBSV[o.m] === 3 ? o.v * 0.12 : 0), z - 0.37, z + 0.26, L.h);
      } else if (L.type === 'road' || L.type === 'rail' || L.type === 'ice') {
        for (const v of L.items) SubStrip(v.x + 0.08, v.x + v.len + 0.24, z - 0.4, z + 0.3, L.h);
      }
      if (L.coin && !L.coin.got) SubStrip(L.coin.x - 0.13, L.coin.x + 0.18, z - 0.1, z + 0.1, L.h);
    }
    if (!P.hide && !P.flat) {
      const L = GS.lanes.get(Math.round(P.rz));
      const gy = P.log ? P.ry : L ? (L.type === 'river' ? WATER_H : L.h) : 0;
      const r = 0.25 * (1 - Math.min(0.45, Math.max(0, P.ry - gy) * 0.9));
      if (!(P.dead === 'water' || P.dead === 'edge' || P.dead === 'lava')) SubStrip(P.rx - r, P.rx + r + 0.08, P.rz - r - 0.04, P.rz + r - 0.04, gy);
    }
    if (GS.eagle) {
      const e = GS.eagle, k = Math.max(0.3, 1 - e.y * 0.15);
      SubStrip(e.x - 1.7 * k, e.x + 1.9 * k, e.z - 0.5 * k, e.z + 0.8 * k, 0);
    }
    FillPath(pc.shadow, false);
    if (GS.status === 'playing' && !P.dead && GS.idle > IDLE_WARN) {
      const k = (GS.idle - IDLE_WARN) / (IDLE_MAX - IDLE_WARN), s = 2.6 - 1.6 * k, oz = 2.4 * (1 - k);
      X.beginPath();
      SubStrip(P.rx - 1.9 * s * 0.6, P.rx + 1.9 * s * 0.6, P.rz + oz - 0.2 * s, P.rz + oz + 0.3 * s, 0);
      SubStrip(P.rx - 0.35 * s, P.rx + 0.35 * s, P.rz + oz - 0.7 * s, P.rz + oz + 0.6 * s, 0);
      X.globalAlpha = 0.12 + 0.3 * k + 0.08 * Math.sin(GS.time * 14);
      FillPath('#0b0f1c', false);
      X.globalAlpha = 1;
    }
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L || (L.type !== 'road' && L.type !== 'rail') || L.sub || !PAL[_K][L.bi].lit) continue;
      const s = Spr(0, L.dir > 0 ? 71 : 70, BeamModel, L.dir);
      for (const v of L.items) Blit(s, L.dir > 0 ? v.x + v.len : v.x, 0, z);
    }
  }

  function DrawObjects(zt, zb) {
    const pz = P.hide || P.flat ? 1e9 : Math.ceil(P.rz - 0.001);
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (L) DrawLane(L, z === pz);
    }
  }

  function DrawLane(L, withP) {
    const z = L.z, bm = BIOMES[L.bi];
    if (L.type === 'river' || L.type === 'lily') {
      if (L.pads) { const s = Spr(L.bi, 40 + bm.pad, PadModel, bm.pad); for (let c = 0; c < 9; c++) if (L.pads[c]) Blit(s, c - HALF, WATER_H, z); }
      else for (const v of L.items) Blit(Spr(L.bi, 60 + bm.raft * 8 + v.len, RaftModel, bm.raft, v.len), v.x, WATER_H - Math.sin(v.bob * Math.PI) * 0.06, z);
      if (withP) DrawPlayer();
      return;
    }
    const grass = L.type === 'grass', list = grass ? L.obs : L.items;
    let pd = !withP, cd = !L.coin || L.coin.got;
    for (const o of list) {
      const ox = grass ? o.x : o.x + o.len * 0.5;
      if (!cd && L.coin.x < ox) { DrawCoin(L); cd = true; }
      if (!pd && P.rx < ox) { DrawPlayer(); pd = true; }
      if (grass) Blit(Spr(o.bi, 1000 + o.m * 8 + o.v, ObsModel, o.m, o.v), o.x, L.h, z);
      else if (L.type === 'rail') Blit(Spr(L.bi, 400 + o.n * 2 + (L.dir > 0 ? 1 : 0), TrainModel, o.n, L.dir), o.x, 0, z);
      else DrawVehicle(o, L);
    }
    if (!cd) DrawCoin(L);
    if (!pd) DrawPlayer();
    if (L.type === 'rail') DrawSignal(L);
    if (z === GS.best && GS.best > 0) Blit(Spr(0, 52, FlagModel), HALF + 0.75, L.h, z - 0.42);
  }

  function DrawVehicle(v, L) {
    let ci = v.ci, y = L.h;
    if (v.kind === 3 || v.kind === 4) {
      ci = (((v.x * (v.kind === 3 ? 1.8 : 2.4)) % 4 + 4) % 4) | 0;
      if (v.kind === 4) y += Math.abs(Math.sin(v.x * 1.3 + v.ph)) * 0.55;
    }
    Blit(Spr(L.bi, 100 + v.kind * 40 + ci * 2 + (L.dir > 0 ? 1 : 0), VehModel, v.kind, ci, L.dir), v.x, y, L.z);
    if (!v.g) return;
    const half = (v.len - 0.9) / 2, px = v.x + (L.dir > 0 ? half : v.len - half), pz = L.z - 0.4;
    X.setTransform(RES, RES * SLOPE, 0, RES, SX(px, pz) * RES, (GY(px, pz) - 0.65 * HY) * RES);
    X.fillStyle = v.tc; X.font = FONT_TRUCK; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(v.g.label, 0, 0);
    X.setTransform(RES, 0, 0, RES, 0, 0);
  }

  function DrawPlayer() {
    let sy, k;
    if (P.t >= 0 && P.arc > 0) { const s = Math.sin(Math.PI * P.t); sy = 1 + 0.22 * s - 0.12 * (1 - P.t) * (1 - P.t) * (P.t < 0.25 ? 1 : 0); k = 1 - 0.08 * s; }
    else if (P.t >= 0) { sy = 0.86; k = 1.08; }
    else { sy = 1 - 0.3 * P.sq - 0.22 * P.land; k = 1 + 0.12 * P.sq + 0.1 * P.land; }
    let y = P.ry;
    if (P.dead === 'water' || P.dead === 'edge' || P.dead === 'lava') {
      if (P.dt > 0.3) return;
      y -= P.dt * 1.6;
      k *= 1 - P.dt * 1.5;
    }
    CharDraw(_char, P.rx, y, P.rz, P.face, k, sy);
  }

  function DrawGem(L) {
    const c = L.coin, y = L.h + 0.5 + Math.sin(GS.time * 3 + c.x) * 0.07;
    const sx = SX(c.x, L.z), sy = GY(c.x, L.z) - y * HY, w = Math.cos(GS.time * 2.2 + c.x), aw = Math.abs(w) * 10 + 1.5, r = 13;
    X.fillStyle = '#4c1d95';
    X.beginPath(); X.moveTo(sx + 1.5, sy - r + 1.5); X.lineTo(sx + aw + 1.5, sy - 3 + 1.5); X.lineTo(sx + 1.5, sy + r + 1.5); X.lineTo(sx - aw + 1.5, sy - 3 + 1.5); X.closePath(); X.fill();
    X.fillStyle = '#a78bfa';
    X.beginPath(); X.moveTo(sx, sy - r); X.lineTo(sx + aw, sy - 3); X.lineTo(sx, sy + r); X.lineTo(sx - aw, sy - 3); X.closePath(); X.fill();
    X.fillStyle = w > 0 ? '#ddd6fe' : '#7c3aed';
    X.beginPath(); X.moveTo(sx, sy - r); X.lineTo(sx + aw, sy - 3); X.lineTo(sx, sy - 3); X.closePath(); X.fill();
    X.fillStyle = w > 0 ? '#7c3aed' : '#c4b5fd';
    X.beginPath(); X.moveTo(sx, sy - 3); X.lineTo(sx - aw, sy - 3); X.lineTo(sx, sy + r); X.closePath(); X.fill();
    X.strokeStyle = '#3b0764'; X.lineWidth = 1;
    X.beginPath(); X.moveTo(sx, sy - r); X.lineTo(sx + aw, sy - 3); X.lineTo(sx, sy + r); X.lineTo(sx - aw, sy - 3); X.closePath(); X.stroke();
    X.lineWidth = 0.6;
    const tw = (GS.time * 1.7 + c.x) % 2;
    if (tw < 0.4) {
      const a = Math.sin(tw / 0.4 * Math.PI), px = sx - 5, py = sy - 8;
      X.globalAlpha = a; X.fillStyle = '#ffffff';
      X.fillRect(px - 0.8, py - 5, 1.6, 10); X.fillRect(px - 5, py - 0.8, 10, 1.6);
      X.globalAlpha = 1;
    }
  }

  function DrawCoin(L) {
    if (L.coin.v > 1) { DrawGem(L); return; }
    const c = L.coin, y = L.h + 0.44 + Math.sin(GS.time * 3 + c.x) * 0.05;
    const sx = SX(c.x, L.z), sy = GY(c.x, L.z) - y * HY;
    const w = Math.abs(Math.cos(GS.time * 2.4 + c.x * 0.7)), r = 11;
    X.fillStyle = c.rim;
    X.beginPath(); X.ellipse(sx + 2.2 * (1 - w) + 0.8, sy + 0.8, Math.max(2.4, r * w + 1.6), r + 0.8, 0, 0, Math.PI * 2); X.fill();
    X.fillStyle = c.col;
    X.beginPath(); X.ellipse(sx, sy, Math.max(1, r * w), r, 0, 0, Math.PI * 2); X.fill();
    X.strokeStyle = c.rim; X.lineWidth = 1;
    X.stroke();
    if (w < 0.5) { X.lineWidth = 0.6; return; }
    X.strokeStyle = 'rgba(255,255,255,0.6)'; X.lineWidth = 1.2;
    X.beginPath(); X.ellipse(sx, sy, r * w - 2.5, r - 2.5, 0, 0, Math.PI * 2); X.stroke();
    X.fillStyle = 'rgba(255,255,255,0.55)';
    X.beginPath(); X.ellipse(sx - r * w * 0.38, sy - r * 0.42, 1.6 * w, 2.2, 0.5, 0, Math.PI * 2); X.fill();
    X.lineWidth = 0.6;
    X.setTransform(RES * w, 0, 0, RES, sx * RES, sy * RES);
    X.fillStyle = '#1f2937'; X.font = FONT_COIN; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText(c.t, 0, 0.5);
    X.setTransform(RES, 0, 0, RES, 0, 0);
  }

  function DrawSignal(L) {
    const x = -HALF - 0.8, z = L.z - 0.43;
    Blit(Spr(L.bi, 50, SignalModel), x, 0, z);
    const ph = Math.floor(GS.time * 5) & 1;
    for (let i = 0; i < 2; i++) {
      const lx = x - 0.12 + i * 0.24, sx = SX(lx, z - 0.08), sy = GY(lx, z - 0.08) - 1.125 * HY;
      const on = L.warn && ph === i;
      X.fillStyle = on ? '#ff4033' : PAL[_K][L.bi].lampOff;
      X.beginPath(); X.arc(sx, sy, 3.6, 0, Math.PI * 2); X.fill();
      if (on) Blit(Spr(0, 2000, GlowModel, 0), lx, 1.125, z - 0.08);
    }
    if (L.ring > 0) {
      const sx = SX(x, z - 0.08), sy = GY(x, z - 0.08) - 1.125 * HY;
      X.globalAlpha = L.ring * 0.7; X.strokeStyle = '#ffd65a'; X.lineWidth = 2;
      X.beginPath(); X.arc(sx, sy, 10 + (1 - L.ring) * 14, 0, Math.PI * 2); X.stroke();
      X.globalAlpha = 1; X.lineWidth = 0.6;
    }
  }

  function DrawGlows(zt, zb) {
    X.globalCompositeOperation = 'lighter';
    const fl = 0.85 + 0.15 * Math.sin(GS.time * 9);
    for (let z = zt; z >= zb; z--) {
      const L = GS.lanes.get(z);
      if (!L || L.type !== 'grass') continue;
      for (const o of L.obs) {
        const gi = OBSG[o.m];
        if (gi < 0) continue;
        const gx = o.m === 10 ? o.x + 0.27 : o.x, gy = o.m === 10 ? 1.42 : o.m === 12 ? 0.6 : 0.5, gz = o.m === 12 ? z - 0.3 : z;
        X.globalAlpha = o.m === 14 ? fl * 0.8 : 0.9;
        Blit(Spr(0, 2000 + (o.m === 12 ? 2 + o.v : gi), GlowModel, o.m === 12 ? 2 + o.v : gi), gx, L.h + gy, gz);
      }
    }
    X.globalAlpha = 1;
    X.globalCompositeOperation = 'source-over';
  }

  function DrawEagle() {
    const e = GS.eagle;
    if (e.got) CharDraw(_char, e.x, e.y - 0.78, e.z, 2, 1, 1);
    Eagle(e.x, e.y, e.z, e.flap);
  }

  function DrawParticles() {
    for (const p of PARTS) {
      if (p.t >= p.life) continue;
      const a = 1 - p.t / p.life, sx = SX(p.x, p.z), sy = GY(p.x, p.z) - p.y * HY;
      X.globalAlpha = Math.min(1, a * 1.6);
      if (p.k === 2) {
        const r = (0.18 + p.t * 1.1) * TS;
        X.strokeStyle = p.c; X.lineWidth = 2.5 * a + 0.5;
        X.beginPath(); X.ellipse(sx, sy, r, r * PS * 0.85, 0, 0, Math.PI * 2); X.stroke();
        X.lineWidth = 0.6;
      } else if (p.k === 4) {
        X.globalAlpha = a * 0.8;
        const s = p.s * (1 + p.t * 2.5);
        X.fillStyle = p.c;
        X.fillRect(sx - s / 2, sy - s * 0.35, s, s * 0.7);
      } else {
        const w = p.k === 0 ? p.s * (0.3 + 0.7 * Math.abs(Math.cos(p.t * 8 + p.ph))) : p.s;
        X.fillStyle = p.c;
        X.fillRect(sx - w / 2, sy - p.s / 2, w, p.k === 0 ? p.s * 0.55 : p.s);
      }
    }
    X.globalAlpha = 1;
  }

  function DrawAmb() {
    for (const p of AMB) {
      if (!p.k) continue;
      X.fillStyle = p.c;
      if (p.k === 4) { X.globalAlpha = 0.35 * p.a; X.fillRect(p.x, p.y, 1.2, 10); continue; }
      if (p.k === 1 && _K) X.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(GS.time * 4 + p.ph));
      else if (p.k === 3) X.globalAlpha = 0.45 * p.a;
      else if (p.k === 5) X.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(GS.time * 11 + p.ph));
      else X.globalAlpha = 0.85 * p.a;
      X.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    X.globalAlpha = 1;
  }

  function DrawStrikes() {
    for (const s of STRIKES) {
      if (!s.on) continue;
      const L = GS.lanes.get(s.z);
      if (!L) continue;
      const h = L.h, sx = SX(s.x, s.z), sy = GY(s.x, s.z) - h * HY;
      if (s.t < STR_T) {
        const k = s.t / STR_T, pul = 0.5 + 0.5 * Math.sin(s.t * 18);
        X.globalAlpha = 0.25 + 0.35 * k;
        X.fillStyle = s.k ? '#ff3d00' : '#fde047';
        X.beginPath(); X.ellipse(sx, sy, 20 * (0.5 + 0.5 * k), 13 * (0.5 + 0.5 * k), 0, 0, Math.PI * 2); X.fill();
        X.globalAlpha = 0.6 + 0.4 * pul; X.strokeStyle = s.k ? '#ff6a00' : '#facc15'; X.lineWidth = 2;
        X.beginPath(); X.ellipse(sx, sy, 22, 14, 0, 0, Math.PI * 2); X.stroke();
        X.globalAlpha = 1; X.lineWidth = 0.6;
        if (s.k && k > 0.35) {
          const f = (1 - k) / 0.65, my = sy - f * 380, mx = sx + f * 150;
          X.globalAlpha = 0.5; X.strokeStyle = '#ff9a3c'; X.lineWidth = 7;
          X.beginPath(); X.moveTo(mx, my); X.lineTo(mx + 40, my - 100); X.stroke();
          X.globalAlpha = 1; X.lineWidth = 0.6;
          Blit(Spr(0, 2007, GlowModel, 7), s.x + f * 3.2, h + f * 13, s.z);
          X.fillStyle = '#4a3a36'; X.fillRect(mx - 7, my - 7, 14, 14);
          X.fillStyle = '#ffb020'; X.fillRect(mx - 4, my - 4, 8, 8);
        }
      } else if (!s.k && s.t < STR_T + 0.16) {
        X.strokeStyle = '#fefce8'; X.lineWidth = 3.5;
        X.beginPath(); X.moveTo(sx, sy);
        for (let i = 1; i <= 7; i++) X.lineTo(sx + ((i * 37 + s.x * 13) % 22) - 11, sy - i * 62);
        X.stroke();
        X.strokeStyle = '#fde047'; X.lineWidth = 1.4; X.stroke();
        X.lineWidth = 0.6;
      } else if (s.k) {
        X.globalAlpha = Math.max(0, 1 - (s.t - STR_T) / 0.45);
        X.fillStyle = '#2a1d1a';
        X.beginPath(); X.ellipse(sx, sy, 18, 11, 0, 0, Math.PI * 2); X.fill();
        X.fillStyle = '#ff6a00';
        X.beginPath(); X.ellipse(sx, sy, 9, 5.5, 0, 0, Math.PI * 2); X.fill();
        X.globalAlpha = 1;
      }
    }
  }

  function DrawEvent() {
    const ev = GS.ev;
    if (!ev) return;
    const w = ev.tw + 46, x = (CV_W - w) / 2, y = 14, acc = BIOMES[ev.k].acc;
    X.globalAlpha = Math.min(1, ev.w * 1.5);
    X.fillStyle = 'rgba(12,16,30,0.78)';
    X.beginPath(); X.roundRect(x, y, w, 26, 13); X.fill();
    X.fillStyle = acc;
    X.beginPath(); X.arc(x + 15, y + 13, 4 + Math.sin(GS.time * 10) * 1.2, 0, Math.PI * 2); X.fill();
    X.fillRect(x + 12, y + 22, (w - 24) * Math.max(0, 1 - ev.t / ev.dur), 2);
    X.font = FONT_EV; X.textAlign = 'left'; X.textBaseline = 'middle'; X.fillStyle = '#ffffff';
    X.fillText(ev.txt, x + 28, y + 12.5);
    X.globalAlpha = 1;
  }

  function DrawBanner() {
    const b = GS.ban;
    if (b.t > 3) return;
    const t = b.t, a = t < 0.3 ? t / 0.3 : t > 2.5 ? Math.max(0, (3 - t) / 0.5) : 1;
    const e = Math.min(1, t / 0.45), y = 96 - (1 - e) * (1 - e) * 46, w = b.w + 64, x = (CV_W - w) / 2;
    const acc = BIOMES[b.bi].acc;
    X.globalAlpha = a;
    X.fillStyle = 'rgba(0,0,0,0.28)';
    X.beginPath(); X.roundRect(x + 3, y + 5, w, 58, 12); X.fill();
    X.fillStyle = 'rgba(12,16,30,0.82)';
    X.beginPath(); X.roundRect(x, y, w, 58, 12); X.fill();
    X.fillStyle = acc;
    X.beginPath(); X.roundRect(x, y + 52, w, 6, [0, 0, 12, 12]); X.fill();
    X.fillRect(x + 18, y + 12, 22, 3);
    X.fillRect(x + w - 40, y + 12, 22, 3);
    X.textAlign = 'center'; X.textBaseline = 'middle';
    X.font = FONT_BAN2; X.fillStyle = acc;
    X.fillText(b.sub, CV_W / 2, y + 14);
    X.font = FONT_BAN; X.fillStyle = '#ffffff';
    X.fillText(b.txt, CV_W / 2, y + 34, 560);
    X.globalAlpha = 1;
  }

  function DrawHud() {
    X.textBaseline = 'top'; X.textAlign = 'left';
    X.font = FONT_HUD;
    if (GS.score !== _scN) { _scN = GS.score; _scS = String(_scN); }
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(_scS, 21, 13);
    X.fillStyle = '#ffffff'; X.fillText(_scS, 18, 10);
    X.font = FONT_SM;
    const b = Math.max(GS.best, GS.score);
    if (b !== _topN) { _topN = b; _topS = `${_GameText('game_best').toUpperCase()} ${b}`; }
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(_topS, 21, 61);
    X.fillStyle = '#ffffff'; X.fillText(_topS, 20, 60);
    const cx = CV_W - 28, cy = 30;
    X.fillStyle = '#b8860b';
    X.beginPath(); X.arc(cx + 1.5, cy + 1.5, 11, 0, Math.PI * 2); X.fill();
    X.fillStyle = '#ffcf3f';
    X.beginPath(); X.arc(cx, cy, 11, 0, Math.PI * 2); X.fill();
    X.strokeStyle = '#fff4c2'; X.lineWidth = 1.5;
    X.beginPath(); X.arc(cx, cy, 7.5, 0, Math.PI * 2); X.stroke();
    X.lineWidth = 0.6;
    X.font = FONT_NUM; X.textAlign = 'right'; X.textBaseline = 'middle';
    if (GS.bank !== _bkN) { _bkN = GS.bank; _bkS = String(_bkN); }
    X.fillStyle = 'rgba(0,0,0,0.38)'; X.fillText(_bkS, cx - 18, cy + 3);
    X.fillStyle = '#ffffff'; X.fillText(_bkS, cx - 20, cy + 1);
  }

  function DrawPortraits() {
    if (!_pcv.length) return;
    const sx = X, so = OX, sp = OY;
    for (let i = 0; i < CHARS.length; i++) {
      const cv = _pcv[i];
      OX = 0; OY = 0; _mb = [1e9, 1e9, -1e9, -1e9];
      CharDraw(i, 0, 0, 0, 1, 1, 1);
      const m = _mb;
      _mb = null;
      const k = Math.min(36 / (m[2] - m[0]), 38 / (m[3] - m[1])), r = cv.width / 48;
      X = cv.getContext('2d');
      X.setTransform(1, 0, 0, 1, 0, 0);
      X.clearRect(0, 0, cv.width, cv.height);
      X.setTransform(r * k, 0, 0, r * k, 0, 0);
      X.lineJoin = 'round'; X.lineCap = 'round';
      OX = 24 / k - (m[0] + m[2]) / 2; OY = 25 / k - (m[1] + m[3]) / 2;
      CharDraw(i, 0, 0, 0, 1, 1, 1);
    }
    X = sx; OX = so; OY = sp;
  }

  function SyncPicker(msg) {
    SetText('gf-cr-bank', GS ? GS.bank : StorageGet(LS_COINS, 0));
    const bank = GS ? GS.bank : 0;
    document.querySelectorAll('#gf-cr-chars .gf-cr-char').forEach((el, i) => {
      const own = _own.includes(i);
      el.classList.toggle('sel', i === _char);
      el.classList.toggle('locked', !own);
      el.classList.toggle('cheap', !own && bank >= CHARS[i].price);
      el.querySelector('b').textContent = own ? _GameText(CHARS[i].key) : CHARS[i].price;
      el.querySelector('i').style.display = own ? 'none' : '';
    });
    SetText('gf-cr-pick-msg', msg || _GameText(CHARS[_char].key));
  }

  function PickChar(i, el) {
    if (!GS) return;
    WakeAudio();
    let msg = '';
    if (_own.includes(i)) _char = i;
    else if (GS.bank >= CHARS[i].price) {
      GS.bank -= CHARS[i].price;
      StorageSet(LS_COINS, GS.bank);
      _own.push(i);
      StorageSet(LS_OWN, _own);
      _char = i;
      msg = `${_GameText(CHARS[i].key)}: ${_GameText('cr_unlocked')}`;
      Emit(3, P.x, P.ry + 0.5, P.z, 18, 0);
      Snd('buy');
    } else {
      msg = _GameText('cr_need').replace('{n}', CHARS[i].price - GS.bank);
      el.classList.remove('no');
      void el.offsetWidth;
      el.classList.add('no');
    }
    StorageSet(LS_CHAR, _char);
    SyncPicker(msg);
  }

  function StartLoop() {
    StopLoop();
    GS.lastTs = performance.now();
    _raf = requestAnimationFrame(Frame);
  }
  function Frame(ts) {
    if (!GS || GS.status === 'paused') { _raf = null; return; }
    const dt = Math.max(0, Math.min(ts - GS.lastTs, 50)) / 1000;
    GS.lastTs = ts;
    if (dt > 0) Update(dt);
    Draw();
    _raf = requestAnimationFrame(Frame);
  }
  function StopLoop() { if (_raf) { cancelAnimationFrame(_raf); _raf = null; } }

  const SCREENS = ['gf-cr-start', 'gf-cr-pause', 'gf-cr-gameover'];
  function ShowScreen(id) {
    SCREENS.forEach(s => { const e = document.getElementById(s); if (e) e.style.display = s === id ? 'flex' : 'none'; });
  }
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function ShowStart() {
    NewGameState();
    SetText('gf-cr-best', GS.best);
    ShowScreen('gf-cr-start');
    SyncPicker();
    StartLoop();
  }

  function BeginPlay() {
    if (GS.status !== 'start') return;
    GS.status = 'playing';
    ShowScreen(null);
    ShowBanner(0);
  }

  function DoStart() {
    NewGameState();
    GS.status = 'playing';
    ShowScreen(null);
    ShowBanner(0);
    StartLoop();
  }

  function GameOver() {
    GS.status = 'gameover';
    const best = Math.max(GS.best, GS.score), isNew = GS.score > GS.best;
    if (isNew) StorageSet(LS_BEST, GS.score);
    SetText('gf-cr-best', best);
    SetText('gf-cr-go-score', GS.score);
    SetText('gf-cr-go-best', best);
    SetText('gf-cr-go-coins', GS.coins);
    SetText('gf-cr-go-why', _GameText(`cr_death_${P.dead}`));
    const el = document.getElementById('gf-cr-go-new');
    if (el) el.style.display = isNew ? 'block' : 'none';
    ShowScreen('gf-cr-gameover');
  }

  function DoPause() {
    if (!GS) return;
    if (GS.status === 'playing') { GS.status = 'paused'; GS.charge = -1; GS.chargeKey = ''; StopLoop(); ShowScreen('gf-cr-pause'); }
    else if (GS.status === 'paused') { GS.status = 'playing'; ShowScreen(null); StartLoop(); }
  }

  function OnKey(e) {
    if (!GS || !document.getElementById('gf-cr')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const down = e.type === 'keydown', dir = KEYDIR[e.key];
    if (dir !== undefined) {
      e.preventDefault(); e.stopPropagation();
      if (!down) { if (e.code === GS.chargeKey) Release(); return; }
      if (e.repeat) return;
      WakeAudio();
      Press(dir, e.code);
      return;
    }
    if (!down) return;
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (GS.status === 'playing' || GS.status === 'paused') DoPause();
      else CloseGradeCross();
    } else if (k === 'p' || k === 'P') {
      e.preventDefault(); e.stopPropagation();
      DoPause();
    } else if (k === 'r' || k === 'R') {
      e.preventDefault(); e.stopPropagation();
      WakeAudio();
      DoStart();
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault(); e.stopPropagation();
      WakeAudio();
      if (GS.status === 'start') BeginPlay();
      else if (GS.status === 'gameover') DoStart();
      else if (GS.status === 'paused') DoPause();
    }
  }

  function OnPtrDown(e) {
    if (!GS || e.button > 0 || GS.status !== 'playing' || P.dead) return;
    e.preventDefault();
    WakeAudio();
    _ptr = { id: e.pointerId, x: e.clientX, y: e.clientY };
    _cv.setPointerCapture(e.pointerId);
    Press(0, 'ptr');
  }
  function OnPtrUp(e) {
    if (!_ptr || e.pointerId !== _ptr.id) return;
    const dx = e.clientX - _ptr.x, dy = e.clientY - _ptr.y;
    _ptr = null;
    if (GS.chargeKey !== 'ptr') return;
    if (e.type === 'pointercancel') { GS.charge = -1; GS.chargeKey = ''; return; }
    if (dx * dx + dy * dy > 576) GS.charge = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
    Release();
  }

  function AttachKeys() { if (_kh) return; _kh = OnKey; document.addEventListener('keydown', _kh, true); document.addEventListener('keyup', _kh, true); }
  function DetachKeys() { if (_kh) { document.removeEventListener('keydown', _kh, true); document.removeEventListener('keyup', _kh, true); _kh = null; } }

  function OnVisibilityChange() { if (document.hidden && GS?.status === 'playing') DoPause(); }

  function ApplyTheme() {
    const el = document.getElementById('gf-cr');
    if (!el) return;
    if (typeof window._GfApplyThemeToHost === 'function') window._GfApplyThemeToHost(el);
    else {
      const isDark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
      el.style.filter = isDark ? 'invert(1) hue-rotate(180deg)' : '';
      el.dataset.theme = isDark ? 'dark' : 'light';
    }
    if (GS && GS.status !== 'playing') Draw();
  }

  function Fit() {
    if (!_cv) return;
    const hh = document.getElementById('gf-cr-hdr')?.offsetHeight || 41;
    const k = Math.min(1, (W.innerWidth - 34) / CV_W, (W.innerHeight - 34 - hh) / CV_H);
    const w = Math.max(240, Math.floor(CV_W * k)), h = Math.round(w * CV_H / CV_W);
    _cv.style.width = `${w}px`; _cv.style.height = `${h}px`;
    const res = Math.min(3, Math.max(1, (w / CV_W) * (W.devicePixelRatio || 1)));
    if (Math.abs(res - RES) > 0.01) { RES = res; _spr.clear(); }
    const bw = Math.round(CV_W * RES), bh = Math.round(CV_H * RES);
    if (_cv.width !== bw || _cv.height !== bh) { _cv.width = bw; _cv.height = bh; }
    Draw();
  }

  function BuildOverlay() {
    if (document.getElementById('gf-cr')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-cr';
    root.innerHTML = `
<div id="gf-cr-modal">
  <div id="gf-cr-hdr">
    <div class="gf-cr-hl">
      <div id="gf-cr-logo">CG</div>
      <span id="gf-cr-title">${_GameText('cr_title')}</span>
    </div>
    <div class="gf-cr-hr">
      <span id="gf-cr-best-hdr"><span class="gf-cr-best-lbl">${_GameText('game_best').toUpperCase()}</span> <span id="gf-cr-best">0</span></span>
      <button id="gf-cr-sound-btn" title="${_GameText('cr_sound')}"></button>
      <button id="gf-cr-pause-btn" title="${_GameText('game_pause_p')}">⏸</button>
      <button id="gf-cr-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-cr-body">
    <div id="gf-cr-view"></div>

    <div id="gf-cr-start" class="gf-cr-scr">
      <div class="gf-cr-head">
        <div class="gf-cr-name">${_GameText('cr_title')}</div>
        <div class="gf-cr-tag">${_GameText('cr_subtitle')}</div>
      </div>
      <div class="gf-cr-card">
        <div class="gf-cr-rules">
          <span><i class="gf-cr-dot" style="background:#4ade80"></i>${_GameText('cr_rule_coins')}</span>
          <span><i class="gf-cr-dot" style="background:#f87171"></i>${_GameText('cr_rule_avoid')}</span>
          <span><i class="gf-cr-dot" style="background:#a78bfa"></i>${_GameText('cr_rule_eagle')}</span>
        </div>
        <div class="gf-cr-pick" id="gf-cr-pick">
          <div class="gf-cr-pick-hd"><span>${_GameText('cr_pick')}</span><span class="gf-cr-bank"><i class="gf-cr-coin"></i><span id="gf-cr-bank">0</span></span></div>
          <div class="gf-cr-chars" id="gf-cr-chars"></div>
          <div class="gf-cr-pick-msg" id="gf-cr-pick-msg"></div>
        </div>
        <div class="gf-cr-hint">${_GameText('cr_start_hint')}</div>
      </div>
    </div>

    <div id="gf-cr-pause" class="gf-cr-scr" style="display:none">
      <div class="gf-cr-card">
        <div class="gf-cr-big">${_GameText('game_paused')}</div>
        <button class="gf-cr-btn" id="gf-cr-resume">▶&nbsp; ${_GameText('game_resume')}</button>
      </div>
    </div>

    <div id="gf-cr-gameover" class="gf-cr-scr" style="display:none">
      <div class="gf-cr-card">
        <div class="gf-cr-go">${_GameText('game_gameover')}</div>
        <div class="gf-cr-why" id="gf-cr-go-why"></div>
        <div class="gf-cr-stats">
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('game_score').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-score">0</div></div>
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('game_best').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-best">0</div></div>
          <div class="gf-cr-stat"><div class="gf-cr-lbl">${_GameText('cr_coins').toUpperCase()}</div><div class="gf-cr-val" id="gf-cr-go-coins">0</div></div>
        </div>
        <div id="gf-cr-go-new" class="gf-cr-new" style="display:none">${_GameText('game_new_best')}</div>
        <div class="gf-cr-btns">
          <button class="gf-cr-btn" id="gf-cr-retry">↺&nbsp; ${_GameText('game_try_again')}</button>
          <button class="gf-cr-btn gf-cr-btn2" id="gf-cr-chars-btn">${_GameText('cr_chars')}</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(root);
    _root = root;
    _cv = document.createElement('canvas');
    _cv.style.cssText = `display:block;width:${CV_W}px;height:${CV_H}px;touch-action:none;cursor:pointer`;
    document.getElementById('gf-cr-view').attachShadow({ mode: 'open' }).appendChild(_cv);
    _icon = document.getElementById('gf-cr-sound-btn').appendChild(document.createElement('span')).attachShadow({ mode: 'open' });
    _ctx = _cv.getContext('2d');
    const box = document.getElementById('gf-cr-chars');
    _pcv = CHARS.map((ch, i) => {
      const b = document.createElement('button');
      b.className = 'gf-cr-char';
      b.title = _GameText(ch.key);
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      cv.style.cssText = 'display:block;width:48px;height:48px';
      b.appendChild(document.createElement('span')).attachShadow({ mode: 'open' }).appendChild(cv);
      const lab = b.appendChild(document.createElement('em'));
      lab.appendChild(document.createElement('i')).className = 'gf-cr-coin';
      lab.appendChild(document.createElement('b'));
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', e => { e.stopPropagation(); PickChar(i, b); });
      box.appendChild(b);
      return cv;
    });
    BindButtons();
    SyncSoundBtn();
  }

  function BindButtons() {
    document.getElementById('gf-cr-close')?.addEventListener('click', CloseGradeCross);
    document.getElementById('gf-cr-pause-btn')?.addEventListener('click', DoPause);
    document.getElementById('gf-cr-sound-btn')?.addEventListener('click', ToggleSound);
    document.getElementById('gf-cr-resume')?.addEventListener('click', DoPause);
    document.getElementById('gf-cr-retry')?.addEventListener('click', () => { WakeAudio(); DoStart(); });
    document.getElementById('gf-cr-chars-btn')?.addEventListener('click', ShowStart);
    document.getElementById('gf-cr-pick')?.addEventListener('pointerdown', e => e.stopPropagation());
    _cv.addEventListener('pointerdown', OnPtrDown);
    _cv.addEventListener('pointerup', OnPtrUp);
    _cv.addEventListener('pointercancel', OnPtrUp);
    const st = document.getElementById('gf-cr-start');
    st?.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); WakeAudio(); BeginPlay(); });
  }

  function OpenGradeCross(grades) {
    if (grades?.length) _grades = NormalizeGrades(grades);
    if (!document.getElementById('gf-cr')) BuildOverlay();
    document.getElementById('gf-cr').style.display = 'flex';
    if (_sound && _ac) _ac.resume();
    ApplyTheme();
    if (!_tobs) _tobs = new MutationObserver(ApplyTheme);
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'style'] });
    AttachKeys();
    document.addEventListener('visibilitychange', OnVisibilityChange);
    W.addEventListener('resize', Fit);
    ShowStart();
    Fit();
    DrawPortraits();
  }

  function CloseGradeCross() {
    const el = document.getElementById('gf-cr');
    if (el) el.style.display = 'none';
    if (GS?.status === 'playing') GS.status = 'paused';
    StopLoop();
    _ac?.suspend();
    DetachKeys();
    _tobs?.disconnect();
    document.removeEventListener('visibilitychange', OnVisibilityChange);
    W.removeEventListener('resize', Fit);
  }

  function ToggleGradeCross(grades) {
    const el = document.getElementById('gf-cr');
    if (el && el.style.display !== 'none') CloseGradeCross(); else OpenGradeCross(grades);
  }

  function BossKeyGradeCross() {
    const el = document.getElementById('gf-cr');
    if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      if (_sound && _ac) _ac.resume();
      if (GS && GS.status !== 'paused') StartLoop();
      return true;
    }
    if (el.style.display !== 'none') {
      if (GS?.status === 'playing') DoPause();
      StopLoop();
      _ac?.suspend();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeCross = OpenGradeCross;
  W.CloseGradeCross = CloseGradeCross;
  W.ToggleGradeCross = ToggleGradeCross;
  W.BossKeyGradeCross = BossKeyGradeCross;

  function InjectCSS() {
    if (document.getElementById('gf-cr-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-cr-css';
    s.textContent = `
#gf-cr {
  --cr-modal:#fff;--cr-hdr:#f5f5f5;--cr-scr:rgba(255,255,255,0.94);
  --cr-brd:rgba(34,197,94,0.25);--cr-brd2:#e0e0e0;--cr-btn-brd:#d0d0d0;
  --cr-txt:#111;--cr-txt2:#555;--cr-txt3:#999;
  --cr-sh:0 8px 40px rgba(0,0,0,0.13),0 1px 4px rgba(0,0,0,0.06);
}
#gf-cr[data-theme="dark"] {
  --cr-modal:rgba(13,13,13,0.97);--cr-hdr:rgba(8,8,8,0.95);
  --cr-scr:rgba(12,14,18,0.93);--cr-brd:rgba(34,197,94,0.2);--cr-brd2:#262626;
  --cr-btn-brd:#333;--cr-txt:#f5f5f5;--cr-txt2:#cbd5e1;--cr-txt3:#8a94a6;
  --cr-sh:0 8px 32px rgba(0,0,0,0.6),0 40px 90px rgba(0,0,0,0.85);
}
#gf-cr{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-cr-modal{position:relative;display:flex;flex-direction:column;background:var(--cr-modal);border:1px solid var(--cr-brd);border-radius:12px;box-shadow:var(--cr-sh);overflow:hidden;max-height:calc(100vh - 32px);max-width:calc(100vw - 32px);}
#gf-cr-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--cr-hdr);border-bottom:1px solid var(--cr-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-cr-hl,.gf-cr-hr{display:flex;align-items:center;gap:8px;}
#gf-cr-logo{width:24px;height:24px;background:#22c55e;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#0b2e16;letter-spacing:-1px;flex-shrink:0;box-shadow:inset 0 -3px 0 rgba(0,0,0,0.18);}
#gf-cr-title{font-size:13px;font-weight:700;color:var(--cr-txt);letter-spacing:-0.3px;}
#gf-cr-best-hdr{min-width:72px;padding:4px 8px;border:1px solid var(--cr-brd2);border-radius:7px;background:rgba(128,128,128,0.08);font-size:12px;font-weight:800;color:var(--cr-txt);display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;line-height:1;}
.gf-cr-best-lbl{font-size:8px;font-weight:700;color:var(--cr-txt3);letter-spacing:1px;text-transform:uppercase;}
#gf-cr-sound-btn,#gf-cr-pause-btn,#gf-cr-close{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--cr-btn-brd);border-radius:6px;background:transparent;color:var(--cr-txt3);cursor:pointer;font-size:11px;line-height:1;padding:0;}
#gf-cr-sound-btn.on{color:#22c55e;border-color:rgba(34,197,94,0.5);}
#gf-cr-sound-btn:hover,#gf-cr-pause-btn:hover{border-color:#22c55e;color:#22c55e;background:rgba(34,197,94,.10);}
#gf-cr-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.10);}
#gf-cr-body{position:relative;line-height:0;flex-shrink:0;}
#gf-cr-view{display:block;}
#gf-cr-sound-btn span{display:flex;}
.gf-cr-scr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;overflow-y:auto;line-height:1.35;text-align:center;background:rgba(6,12,24,0.3);}
#gf-cr-start{justify-content:space-between;cursor:pointer;padding:22px 18px 14px;background:linear-gradient(180deg,rgba(6,12,24,0.42) 0%,rgba(6,12,24,0) 32%,rgba(6,12,24,0) 55%,rgba(6,12,24,0.38) 100%);}
.gf-cr-head{display:flex;flex-direction:column;align-items:center;gap:12px;}
.gf-cr-name{font-size:46px;font-weight:800;color:#fff;letter-spacing:1px;line-height:1;text-shadow:0 2px 0 #22c55e,0 4px 0 #16a34a,0 6px 0 #15803d,0 8px 0 #166534,0 14px 20px rgba(0,0,0,0.4);}
.gf-cr-tag{font-size:12px;font-weight:700;color:#fff;background:rgba(0,0,0,0.35);padding:4px 12px;border-radius:999px;letter-spacing:0.2px;}
.gf-cr-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px 22px;background:var(--cr-scr);border:1px solid var(--cr-brd2);border-radius:14px;box-shadow:var(--cr-sh);max-width:calc(100% - 16px);}
.gf-cr-rules{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;font-size:11px;font-weight:700;color:var(--cr-txt2);}
.gf-cr-rules span{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(128,128,128,0.1);}
.gf-cr-dot{display:inline-block;width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.gf-cr-hint{font-size:11px;color:var(--cr-txt3);max-width:460px;}
.gf-cr-pick{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:default;}
.gf-cr-pick-hd{display:flex;align-items:center;gap:12px;font-size:9px;font-weight:800;letter-spacing:1px;color:var(--cr-txt3);text-transform:uppercase;line-height:1;}
.gf-cr-bank{display:flex;align-items:center;gap:4px;color:var(--cr-txt);font-size:12px;letter-spacing:0;}
.gf-cr-coin{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ffcf3f;box-shadow:inset 0 0 0 1.5px #d49b00;flex-shrink:0;}
.gf-cr-chars{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
.gf-cr-char{position:relative;width:58px;height:68px;padding:3px 0 0;border:1px solid var(--cr-brd2);border-radius:10px;background:rgba(128,128,128,0.08);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;color:var(--cr-txt2);transition:transform .12s,border-color .12s,background .12s;}
.gf-cr-char:hover{transform:translateY(-2px);border-color:rgba(34,197,94,0.6);}
.gf-cr-char > span{display:block;width:48px;height:48px;}
.gf-cr-char em{font-style:normal;font-size:9px;font-weight:800;line-height:1;display:flex;align-items:center;gap:3px;max-width:54px;overflow:hidden;white-space:nowrap;}
.gf-cr-char em b{font-weight:800;overflow:hidden;text-overflow:ellipsis;}
.gf-cr-char.sel{border-color:#22c55e;background:rgba(34,197,94,0.16);box-shadow:0 0 0 2px rgba(34,197,94,0.28);color:var(--cr-txt);}
.gf-cr-char.locked > span{filter:brightness(0.18) saturate(0);opacity:0.7;}
.gf-cr-char.locked.cheap{border-color:rgba(245,158,11,0.7);}
.gf-cr-char.locked.cheap em{color:#d97706;}
.gf-cr-char.no{animation:gf-cr-shake .32s;}
.gf-cr-pick-msg{font-size:11px;font-weight:700;color:var(--cr-txt2);min-height:14px;line-height:14px;}
.gf-cr-big{font-size:22px;font-weight:800;letter-spacing:4px;color:var(--cr-txt);}
.gf-cr-go{font-size:30px;font-weight:800;color:#f87171;letter-spacing:3px;line-height:1.05;text-shadow:0 3px 0 rgba(127,29,29,0.35);}
.gf-cr-why{font-size:12px;font-weight:700;color:var(--cr-txt2);margin-top:-4px;}
.gf-cr-stats{display:grid;grid-template-columns:repeat(3,minmax(84px,1fr));gap:10px;}
.gf-cr-stat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 12px;border:1px solid var(--cr-brd2);border-radius:9px;background:rgba(128,128,128,0.1);}
.gf-cr-lbl{font-size:9px;font-weight:800;letter-spacing:1px;color:var(--cr-txt3);line-height:1;}
.gf-cr-val{font-size:26px;font-weight:800;color:var(--cr-txt);line-height:1;}
.gf-cr-new{font-size:11px;font-weight:800;color:#d97706;letter-spacing:2px;animation:gf-cr-pulse 0.8s ease-in-out infinite alternate;}
.gf-cr-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
@media (max-width:640px),(max-height:460px){.gf-cr-name{font-size:28px}.gf-cr-scr{gap:8px;padding:10px}#gf-cr-start{padding:12px 10px 10px}.gf-cr-card{padding:10px 14px;gap:8px}.gf-cr-go{font-size:22px}.gf-cr-val{font-size:18px}.gf-cr-stat{padding:6px 8px}.gf-cr-stats{grid-template-columns:repeat(3,minmax(64px,1fr))}.gf-cr-hint,.gf-cr-rules{display:none}.gf-cr-char{width:48px;height:58px}.gf-cr-char > span{transform:scale(0.8);margin:-5px 0}}
@keyframes gf-cr-pulse{from{opacity:0.5;transform:scale(0.95)}to{opacity:1;transform:scale(1.05)}}
@keyframes gf-cr-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.gf-cr-btn{padding:10px 24px;border:1px solid #22c55e;border-radius:8px;background:rgba(34,197,94,0.14);color:#16a34a;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;line-height:1.2;min-width:146px;}
.gf-cr-btn2{border-color:var(--cr-btn-brd);background:rgba(128,128,128,0.08);color:var(--cr-txt2);min-width:0;}
#gf-cr[data-theme="dark"] .gf-cr-btn{color:#4ade80;}
#gf-cr[data-theme="dark"] .gf-cr-btn2{color:var(--cr-txt2);}
.gf-cr-btn:hover{background:rgba(34,197,94,0.24);box-shadow:0 4px 18px rgba(34,197,94,0.28);transform:translateY(-1px);}
`;
    document.head.appendChild(s);
  }

})(window);
