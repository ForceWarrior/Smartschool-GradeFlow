const GF_THEME_KEY = 'gradeflow-theme';
const GF_THEME_PALETTE_KEY = 'gradeflow-theme-custom';
const GF_THEME_LIBRARY_KEY = 'gradeflow-theme-library';
const GF_THEME_TOKENS = ['bg', 'surface', 'surface2', 'surface3', 'border', 'text', 'muted', 'accent', 'good', 'mid', 'bad'];

const GF_THEME_PRESETS = [
  { id: 'midnight', name: 'Midnight', bg: '#0f1115', surface: '#171a21', surface2: '#1e222b', surface3: '#2a303c', border: '#2c3340', text: '#e6e9ef', muted: '#9aa3b2', accent: '#f97316', good: '#4ade80', mid: '#fbbf24', bad: '#f87171' },
  { id: 'graphite', name: 'Graphite', bg: '#121212', surface: '#1b1b1b', surface2: '#232323', surface3: '#2e2e2e', border: '#333333', text: '#ededed', muted: '#a0a0a0', accent: '#a3e635', good: '#4ade80', mid: '#facc15', bad: '#f87171' },
  { id: 'amoled', name: 'AMOLED', bg: '#000000', surface: '#0a0a0a', surface2: '#141414', surface3: '#1f1f1f', border: '#262626', text: '#f5f5f5', muted: '#a3a3a3', accent: '#38bdf8', good: '#22c55e', mid: '#eab308', bad: '#ef4444' },
  { id: 'nord', name: 'Nord', bg: '#2e3440', surface: '#3b4252', surface2: '#434c5e', surface3: '#4c566a', border: '#4c566a', text: '#eceff4', muted: '#a3adbf', accent: '#88c0d0', good: '#a3be8c', mid: '#ebcb8b', bad: '#bf616a' },
  { id: 'dracula', name: 'Dracula', bg: '#22212c', surface: '#282a36', surface2: '#313443', surface3: '#3c3f52', border: '#44475a', text: '#f8f8f2', muted: '#a9abc3', accent: '#bd93f9', good: '#50fa7b', mid: '#f1fa8c', bad: '#ff5555' },
  { id: 'mocha', name: 'Mocha', bg: '#11111b', surface: '#1e1e2e', surface2: '#262637', surface3: '#313244', border: '#383a50', text: '#cdd6f4', muted: '#a6adc8', accent: '#f5c2e7', good: '#a6e3a1', mid: '#f9e2af', bad: '#f38ba8' },
  { id: 'solarized', name: 'Solarized', bg: '#002b36', surface: '#073642', surface2: '#0b414f', surface3: '#124d5c', border: '#1b5867', text: '#eee8d5', muted: '#93a1a1', accent: '#b58900', good: '#859900', mid: '#cb8b16', bad: '#dc322f' },
  { id: 'forest', name: 'Forest', bg: '#0e1512', surface: '#141f1a', surface2: '#1a2821', surface3: '#22342b', border: '#273b31', text: '#e2ece6', muted: '#97ab9f', accent: '#34d399', good: '#4ade80', mid: '#fcd34d', bad: '#fb7185' },
  { id: 'ocean', name: 'Ocean', bg: '#0b1220', surface: '#111a2c', surface2: '#172238', surface3: '#1f2c47', border: '#22314e', text: '#e2e8f0', muted: '#94a3b8', accent: '#3b82f6', good: '#4ade80', mid: '#fbbf24', bad: '#f87171' },
  { id: 'rose', name: 'Rosé', bg: '#191724', surface: '#1f1d2e', surface2: '#26233a', surface3: '#2f2b45', border: '#393552', text: '#e0def4', muted: '#a8a3c4', accent: '#ebbcba', good: '#9ccfd8', mid: '#f6c177', bad: '#eb6f92' },
  { id: 'paper', name: 'Paper', bg: '#f4efe6', surface: '#fbf8f2', surface2: '#efe8dc', surface3: '#e4dccd', border: '#d8cdb9', text: '#2b2520', muted: '#7a6f62', accent: '#c2410c', good: '#15803d', mid: '#b45309', bad: '#b91c1c' },
  { id: 'frost', name: 'Frost', bg: '#eef2f7', surface: '#ffffff', surface2: '#e6ecf3', surface3: '#d9e1ec', border: '#cbd5e1', text: '#0f172a', muted: '#526077', accent: '#6366f1', good: '#16a34a', mid: '#ca8a04', bad: '#dc2626' },
];

function GfHexOk(v) {
  return /^#[0-9a-f]{6}$/i.test(String(v || ''));
}

function GfCleanPalette(raw) {
  const base = GF_THEME_PRESETS[0];
  const out = { id: String(raw?.id || 'custom').slice(0, 40), name: String(raw?.name || 'Custom').slice(0, 40) };
  for (const k of GF_THEME_TOKENS) out[k] = GfHexOk(raw?.[k]) ? raw[k].toLowerCase() : base[k];
  out.recolor = raw?.recolor !== false;
  out.site = raw?.site !== false;
  return out;
}

function GfLuma(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 255000;
}

function GfThemeVars(palette) {
  const p = GfCleanPalette(palette);
  const dark = GfLuma(p.bg) < 0.5;
  return {
    source: 'custom', accent: p.accent, text: p.text, muted: p.muted, bg: p.bg,
    surface: p.surface, surface2: p.surface2, surface3: p.surface3, border: p.border,
    overlay: dark ? 'rgba(0,0,0,.5)' : 'rgba(15,23,42,.28)', isDark: dark, glass: false,
    good: p.good, mid: p.mid, bad: p.bad,
  };
}

function GfEncodePalette(palette) {
  const p = GfCleanPalette(palette);
  return 'GFTHEME:' + btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/=+$/, '');
}

function GfDecodePalette(text) {
  const m = String(text || '').trim().match(/^(?:GFTHEME:)?([A-Za-z0-9+/]+)$/);
  if (m) {
    try { return GfCleanPalette(JSON.parse(decodeURIComponent(escape(atob(m[1]))))); } catch (_) {}
  }
  try { return GfCleanPalette(JSON.parse(text)); } catch (_) { return null; }
}
