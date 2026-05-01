// Iframe guard
if (window.self !== window.top) {
  (function CleanupIframe() {
    const run = () => {
      document.getElementById('gf-dark-flash-shield')?.remove();
      document.documentElement.removeAttribute('data-gf-theme');
      if (document.body) {
        document.body.style.opacity = '';
        document.body.style.transition = '';
        document.body.style.filter = '';
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
  })();
} else {

;(function _GfEarlyPersonalization() {
  try {
    if (localStorage.getItem('gf-pers-active') !== '1') return;

    const pfpCache = localStorage.getItem('gf-pfp-cache');
    const nameCache = localStorage.getItem('gf-name-cache');
    const realName = localStorage.getItem('gf-realname-cache');
    const hasPfp = !!pfpCache;
    const hasName = !!nameCache;
    if (!hasPfp && !hasName) return;

    // Inject CSS BEFORE any content paints
    const rules = [];

    if (hasPfp) {
      // Hide userpicture imgs by default, then content:url() shows our cached PFP.
      // This prevents any frame of the original avatar from being painted.
      rules.push(`
        img[src*="userpicture"], img[data-gf-orig-src] {
          content: url(${pfpCache}) !important;
        }
      `);
    }

    if (hasName) {
      // Only hide the actual SmartSchool top bar, NOT broad selectors like
      // [class*="Header"] which could match content containers.
      rules.push(`
        .smsc-top-bar, .smsc-top, #smsc-top, .smsc-header {
          visibility: hidden !important;
        }
      `);
    }

    if (rules.length) {
      const style = document.createElement('style');
      style.id = 'gf-pers-hide';
      style.textContent = rules.join('\n');
      (document.head || document.documentElement).appendChild(style);
      setTimeout(() => document.getElementById('gf-pers-hide')?.remove(), 4000);
    }

    // Intercept img.src assignment so userpicture URLs are swapped to our
    // cached PFP BEFORE the browser fetches the original. Zero network trip,
    // zero flicker.
    if (hasPfp) {
      try {
        const proto = HTMLImageElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (desc && desc.configurable && desc.set) {
          const origSet = desc.set;
          const origGet = desc.get;
          Object.defineProperty(proto, 'src', {
            configurable: true,
            enumerable: desc.enumerable,
            get() { return origGet.call(this); },
            set(v) {
              try {
                if (typeof v === 'string' && /userpicture\d*\.smartschool\.be/i.test(v)) {
                  if (!this.dataset.gfOrigSrc) this.dataset.gfOrigSrc = v;
                  origSet.call(this, pfpCache);
                  return;
                }
              } catch (_) {}
              origSet.call(this, v);
            },
          });
        }
      } catch (_) {}
    }

    // Same trick for the real name: stash the cached real name so the
    // personalization code can find/replace it instantly when DOM is ready.
    if (hasName && realName) {
      window._gfDetectedRealName = realName;
    }
  } catch (_) {}
})();

// Dark mode flash prevention
;(function GfAntiFlashDarkMode() {
  if (localStorage.getItem('gf-smpp-active-cache') === '1') return;
  if (localStorage.getItem('gf-theme-cache') !== 'dark') return;
  document.documentElement.setAttribute('data-gf-theme', 'dark');
  const s = document.createElement('style');
  s.id = 'gf-dark-flash-shield';
  s.textContent = `
    html[data-gf-theme="dark"] {
      filter: invert(1) hue-rotate(180deg) !important;
      background-color: #ffffff !important;
    }
    html[data-gf-theme="dark"] body {
      background-color: #ffffff !important;
      opacity: 0;
    }
  `;
  (document.head || document.documentElement).appendChild(s);

  setTimeout(() => {
    if (document.body && document.body.style.opacity !== '1') {
      document.getElementById('gf-dark-flash-shield')?.remove();
      document.body.style.transition = 'opacity 0.15s ease';
      document.body.style.opacity = '1';
    }
  }, 1500);
})();

// Theme state
let _gfCurrentTheme = 'light';
let _gfEffectiveTheme = 'light';
let _gfExternalThemeVars = null;
let _gfExternalThemeSignature = '';
let _gfSheetRevealed = false;
let _gfNavObserver = null;
let _gfThemeApplyTimer = 0;
let _gfExternalThemeObserver = null;
let _gfExternalThemePoll = 0;
let _gfHomeSummaryLayoutObserver = null;
let _gfHomeSummaryLayoutTimer = 0;

const GF_THEME_SHEETS = [
  { id: 'gf-theme-css', href: 'CSS/smartschool-theme.css' },
];

function _GfNormalizeTheme(value) {
  return value === 'dark' || value === 'smpp' ? value : 'light';
}

function _GfCssVar(name) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (_) { return ''; }
}

function _GfParseColor(value) {
  const raw = String(value || '').trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const v = hex[1].length === 3 ? hex[1].split('').map(ch => ch + ch).join('') : hex[1];
    return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
  }
  const rgb = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

function _GfIsDarkColor(value) {
  const color = _GfParseColor(value);
  if (!color) return false;
  return (color.r * 299 + color.g * 587 + color.b * 114) / 1000 < 130;
}

function _GfReadSmartschoolPlusPlusTheme() {
  const accent = _GfCssVar('--color-accent');
  const text = _GfCssVar('--color-text');
  const bg = _GfCssVar('--color-base00');
  if (!accent || !text || !bg) return null;
  const surface = _GfCssVar('--color-base01') || bg;
  const surface2 = _GfCssVar('--color-base02') || surface;
  const surface3 = _GfCssVar('--color-base03') || surface2;
  return {
    source: 'smpp',
    accent,
    text,
    muted: _GfCssVar('--color-base03') || text,
    bg,
    surface,
    surface2,
    surface3,
    border: surface3,
    overlay: _GfCssVar('--darken-background') || 'rgba(0,0,0,.2)',
    isDark: _GfIsDarkColor(bg),
    glass: document.documentElement.classList.contains('glass') || document.body?.classList.contains('glass'),
  };
}

try { window._GfReadSmartschoolPlusPlusTheme = _GfReadSmartschoolPlusPlusTheme; } catch (_) {}

function _GfExternalThemeSignature(vars) {
  if (!vars) return '';
  return [vars.accent, vars.text, vars.bg, vars.surface, vars.surface2, vars.surface3, vars.border, vars.overlay, vars.isDark ? 'dark' : 'light', vars.glass ? 'glass' : 'flat'].join('|');
}

function _GfSetExternalThemeVars(vars) {
  const root = document.documentElement;
  root.setAttribute('data-gf-theme-source', 'smpp');
  root.setAttribute('data-gf-external-dark', vars.isDark ? '1' : '0');
  root.setAttribute('data-gf-external-glass', vars.glass ? '1' : '0');
  root.style.setProperty('--gf-ext-accent', vars.accent);
  root.style.setProperty('--gf-ext-text', vars.text);
  root.style.setProperty('--gf-ext-muted', vars.muted);
  root.style.setProperty('--gf-ext-bg', vars.bg);
  root.style.setProperty('--gf-ext-surface', vars.surface);
  root.style.setProperty('--gf-ext-surface-2', vars.surface2);
  root.style.setProperty('--gf-ext-surface-3', vars.surface3);
  root.style.setProperty('--gf-ext-border', vars.border);
  root.style.setProperty('--gf-ext-overlay', vars.overlay);
  root.style.setProperty('--gf-ext-shadow-soft', vars.isDark ? '0 8px 32px rgba(0,0,0,.45),0 1px 4px rgba(0,0,0,.28)' : '0 8px 32px rgba(0,0,0,.14),0 1px 4px rgba(0,0,0,.08)');
  root.style.setProperty('--gf-ext-shadow-strong', vars.isDark ? '0 12px 48px rgba(0,0,0,.62),0 36px 90px rgba(0,0,0,.7)' : '0 10px 42px rgba(0,0,0,.18),0 1px 5px rgba(0,0,0,.1)');
  root.style.setProperty('--gf-ext-cell', vars.isDark ? vars.surface3 : vars.surface2);
}

function _GfClearExternalThemeVars() {
  const root = document.documentElement;
  root.removeAttribute('data-gf-theme-source');
  root.removeAttribute('data-gf-external-dark');
  root.removeAttribute('data-gf-external-glass');
  ['--gf-ext-accent', '--gf-ext-text', '--gf-ext-muted', '--gf-ext-bg', '--gf-ext-surface', '--gf-ext-surface-2', '--gf-ext-surface-3', '--gf-ext-border', '--gf-ext-overlay', '--gf-ext-shadow-soft', '--gf-ext-shadow-strong', '--gf-ext-cell'].forEach(name => root.style.removeProperty(name));
}

const GF_HOST_THEME_BASE_VARS = {
  '--bg': '--gf-ext-surface', '--surf': '--gf-ext-surface-2', '--surf2': '--gf-ext-bg', '--brd': '--gf-ext-border',
  '--txt': '--gf-ext-text', '--txt2': '--gf-ext-muted', '--txt3': '--gf-ext-muted', '--sh1': '--gf-ext-shadow-soft', '--sh2': '--gf-ext-shadow-strong',
  '--gf-game-accent': '--gf-ext-accent', '--sh-bg': '--gf-ext-bg', '--sh-surf': '--gf-ext-surface', '--sh-surf2': '--gf-ext-surface-2',
  '--sh-brd': '--gf-ext-border', '--sh-txt': '--gf-ext-text', '--sh-txt2': '--gf-ext-muted', '--sh-txt3': '--gf-ext-muted', '--sh-acc': '--gf-ext-accent',
};
const GF_HOST_THEME_PREFIXES = ['gs', 'g2', 'gm', 'sw', 'bo', 'po', 'fl', 'rn', 'tw'];
const GF_HOST_THEME_PARTS = {
  modal: '--gf-ext-surface', hdr: '--gf-ext-surface-2', hud: '--gf-ext-surface-2', bar: '--gf-ext-surface-2', body: '--gf-ext-bg',
  scr: '--gf-ext-overlay', brd: '--gf-ext-accent', brd2: '--gf-ext-border', 'btn-brd': '--gf-ext-border', btn: '--gf-ext-surface-2',
  txt: '--gf-ext-text', txt2: '--gf-ext-muted', txt3: '--gf-ext-muted', kbd: '--gf-ext-surface-2', 'kbd-brd': '--gf-ext-border',
  scroll: '--gf-ext-border', sh: '--gf-ext-shadow-strong', sbox: '--gf-ext-surface-2', cell: '--gf-ext-cell', ovr: '--gf-ext-overlay',
  back: '--gf-ext-surface-3', 'back-shine': '--gf-ext-overlay', 'back-dot': '--gf-ext-border', 'cell-hidden': '--gf-ext-surface-3',
  'cell-revealed': '--gf-ext-surface-2', 'cell-hover': '--gf-ext-border', 'lcd-bg': '--gf-ext-surface-2',
};
const GF_HOST_THEME_CUSTOM_PROPS = [
  ...Object.keys(GF_HOST_THEME_BASE_VARS),
  ...GF_HOST_THEME_PREFIXES.flatMap(prefix => Object.keys(GF_HOST_THEME_PARTS).map(part => `--${prefix}-${part}`)),
];

function _GfThemeState() {
  const root = document.documentElement;
  const source = root.getAttribute('data-gf-theme-source') === 'smpp' ? 'smpp' : 'gradeflow';
  const isDark = source === 'smpp' ? root.getAttribute('data-gf-external-dark') === '1' : root.getAttribute('data-gf-theme') === 'dark';
  return { source, isDark };
}

function _GfApplyThemeToHost(host) {
  if (!host) return;
  const themeState = _GfThemeState();
  host.dataset.theme = themeState.isDark ? 'dark' : 'light';
  host.dataset.themeSource = themeState.source;
  host.classList.toggle('is-smpp', themeState.source === 'smpp');
  host.style.filter = themeState.isDark && themeState.source !== 'smpp' ? 'invert(1) hue-rotate(180deg)' : '';
  if (themeState.source === 'smpp') {
    for (const [propertyName, sourceName] of Object.entries(GF_HOST_THEME_BASE_VARS)) host.style.setProperty(propertyName, `var(${sourceName})`);
    for (const prefix of GF_HOST_THEME_PREFIXES) {
      for (const [partName, sourceName] of Object.entries(GF_HOST_THEME_PARTS)) host.style.setProperty(`--${prefix}-${partName}`, `var(${sourceName})`);
    }
  } else {
    GF_HOST_THEME_CUSTOM_PROPS.forEach(propertyName => host.style.removeProperty(propertyName));
  }
}

function _GfRefreshThemedHosts() {
  document.querySelectorAll('#gf-arcade,#gf-tetris,#gf-snake,#gf-2048,#gf-sweep,#gf-memory,#gf-shooter,#gf-bo,#gf-po,#gf-fl,#gf-rn,#gf-tw')
    .forEach(host => _GfApplyThemeToHost(host));
}

try {
  window._GfApplyThemeToHost = _GfApplyThemeToHost;
  window._GfIsEffectiveThemeDark = () => _GfThemeState().isDark;
} catch (_) {}

function _GfPostThemeToPanel() {
  document.querySelector('#gradeflow-panel-host iframe')
    ?.contentWindow?.postMessage({ type: 'gf-theme', theme: _gfEffectiveTheme, vars: _gfExternalThemeVars }, '*');
}

function _GfUseExternalTheme(vars) {
  _gfExternalThemeVars = vars;
  _gfExternalThemeSignature = _GfExternalThemeSignature(vars);
  _gfEffectiveTheme = 'smpp';
  localStorage.setItem('gf-smpp-active-cache', '1');
  document.documentElement.removeAttribute('data-gf-theme');
  document.getElementById('gf-dark-flash-shield')?.remove();
  GF_THEME_SHEETS.forEach(({ id }) => document.getElementById(id)?.remove());
  _GfSetExternalThemeVars(vars);
  if (document.body) {
    document.body.style.opacity = '';
    document.body.style.transition = '';
  }
  _GfStopNavWatcher();
  _gfSheetRevealed = false;
  _GfApplyHomeSummaryTheme(document.getElementById('gf-home-summary'));
  _GfRefreshThemedHosts();
  _GfPostThemeToPanel();
}

function _GfSchedulePageThemeApply(delay = 80) {
  clearTimeout(_gfThemeApplyTimer);
  _gfThemeApplyTimer = setTimeout(() => ApplyPageTheme(_gfCurrentTheme), delay);
}

function _GfSyncSmartschoolPlusPlusTheme(force = false) {
  const vars = _GfReadSmartschoolPlusPlusTheme();
  const signature = _GfExternalThemeSignature(vars);
  if (vars) {
    if (force || signature !== _gfExternalThemeSignature || _gfEffectiveTheme !== 'smpp') _GfUseExternalTheme(vars);
    return true;
  }
  if (_gfEffectiveTheme === 'smpp') {
    _gfExternalThemeVars = null;
    _gfExternalThemeSignature = '';
    _GfClearExternalThemeVars();
    localStorage.removeItem('gf-smpp-active-cache');
    _GfSchedulePageThemeApply(120);
  }
  return false;
}

function _GfStartSmartschoolPlusPlusWatcher() {
  if (_gfExternalThemePoll) return;
  const watch = () => _GfSyncSmartschoolPlusPlusTheme(false);
  _gfExternalThemePoll = setInterval(watch, 600);
  if (window.MutationObserver) {
    _gfExternalThemeObserver = new MutationObserver(() => _GfSchedulePageThemeApply(120));
    _gfExternalThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    if (document.body) _gfExternalThemeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
  }
  [120, 350, 900, 1800, 3200].forEach(delay => setTimeout(watch, delay));
}

function _GfEnsureThemeSheets(onDone) {
  let remaining = 0, doneCalled = false;
  const done = () => {
    if (doneCalled) return;
    doneCalled = true;
    onDone?.();
  };

  GF_THEME_SHEETS.forEach(({ id, href }) => {
    if (document.getElementById(id)) return;
    remaining++;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(href);
    link.onload = () => { remaining--; if (!remaining) done(); };
    link.onerror = () => { remaining--; if (!remaining) done(); };
    (document.head || document.documentElement).appendChild(link);
  });

  if (!remaining) done();
  setTimeout(done, 900);
}

function ApplyPageTheme(theme) {
  theme = _GfNormalizeTheme(theme);
  localStorage.setItem('gf-theme-cache', theme);
  const smppTheme = _GfReadSmartschoolPlusPlusTheme();

  if (theme === 'smpp' || smppTheme) {
    if (smppTheme) _GfUseExternalTheme(smppTheme);
    else {
      _gfExternalThemeVars = null;
      _gfExternalThemeSignature = '';
      _gfEffectiveTheme = 'light';
      localStorage.setItem('gf-smpp-active-cache', '0');
      document.documentElement.removeAttribute('data-gf-theme');
      document.getElementById('gf-dark-flash-shield')?.remove();
      GF_THEME_SHEETS.forEach(({ id }) => document.getElementById(id)?.remove());
      _GfClearExternalThemeVars();
      _GfApplyHomeSummaryTheme(document.getElementById('gf-home-summary'));
      _GfRefreshThemedHosts();
      _GfPostThemeToPanel();
    }
    return;
  }

  _gfExternalThemeVars = null;
  _gfExternalThemeSignature = '';
  _gfEffectiveTheme = theme;
  localStorage.removeItem('gf-smpp-active-cache');
  _GfClearExternalThemeVars();

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-gf-theme', 'dark');
    _GfEnsureThemeSheets(() => { _GfRevealPage(); });
    _GfStartNavWatcher();
  } else {
    document.documentElement.removeAttribute('data-gf-theme');
    document.getElementById('gf-dark-flash-shield')?.remove();
    GF_THEME_SHEETS.forEach(({ id }) => document.getElementById(id)?.remove());
    if (document.body) {
      document.body.style.opacity = '';
      document.body.style.transition = '';
    }
    _GfStopNavWatcher();
    _gfSheetRevealed = false;
  }
  _GfApplyHomeSummaryTheme(document.getElementById('gf-home-summary'));
  _GfRefreshThemedHosts();
  _GfPostThemeToPanel();
}

function _GfRevealPage() {
  if (_gfSheetRevealed) return;
  _gfSheetRevealed = true;
  document.getElementById('gf-dark-flash-shield')?.remove();
  if (document.body) {
    document.body.style.transition = 'opacity 0.12s ease';
    document.body.style.opacity = '1';
  }
}

// Chrome storage
chrome.storage.local.get('gradeflow-theme', ({ 'gradeflow-theme': saved }) => {
  _gfCurrentTheme = _GfNormalizeTheme(saved);
  _gfSheetRevealed = false;
  _GfStartSmartschoolPlusPlusWatcher();
  _GfSchedulePageThemeApply(40);
  [350, 1200, 2500].forEach(delay => setTimeout(() => _GfSyncSmartschoolPlusPlusTheme(true) || _GfSchedulePageThemeApply(40), delay));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes['gradeflow-theme']) {
    _gfCurrentTheme = _GfNormalizeTheme(changes['gradeflow-theme'].newValue);
    _gfSheetRevealed = false;
    _GfSchedulePageThemeApply(120);
  }

  if (changes['gradeflow-grades']) {
    _GfRenderHomeSummaryFromRaw(changes['gradeflow-grades'].newValue);
  }
});

// Misc helpers
let gradeflowWeightMode = 'points';
let gradeflowManualHours = LoadManualHours();
let gradeflowFormula = LoadFormula();

function LoadFormula() {
  try {
    const r = localStorage.getItem('gradeflow-formula-v1');
    const p = r ? JSON.parse(r) : [];
    return Array.isArray(p) ? p : [];
  } catch (_) { return []; }
}
function HasFormula() {
  return (gradeflowFormula || []).some(g => (parseFloat(g.totalWeight) || 0) > 0 && (g.parts || []).some(p => p.period && (parseFloat(p.weight) || 0) > 0));
}

function FormulaSubjectPct(subject, store) {
  if (!store || !HasFormula()) return null;
  let ws = 0, tw = 0;
  for (const group of gradeflowFormula) {
    const gw = parseFloat(group.totalWeight) || 0;
    if (!gw) continue;
    let gws = 0, gtw = 0;
    for (const part of (group.parts || [])) {
      const pw = parseFloat(part.weight) || 0;
      if (!pw || !part.period) continue;
      const scores = store[part.period]?.[subject]?.scores || [];
      if (!scores.length) continue;
      gws += CalcPercent(scores) * pw;
      gtw += pw;
    }
    if (!gtw) continue;
    ws += (gws / gtw) * gw;
    tw += gw;
  }
  return tw > 0 ? ws / tw : null;
}

function FormulaOverallPct(store) {
  if (!store) return 0;
  const allData = BuildAllPeriodData(store);
  const subjects = Object.keys(allData);
  if (!subjects.length) return 0;

  if (HasManualHours()) {
    let w = 0, th = 0;
    for (const s of subjects) {
      const sp = FormulaSubjectPct(s, store);
      if (sp == null) continue;
      const h = GetHoursForSubject(s);
      if (!h || isNaN(h)) continue;
      w += sp * h;
      th += h;
    }
    if (th > 0) return w / th;
  }

  let sum = 0, count = 0;
  for (const s of subjects) {
    const sp = FormulaSubjectPct(s, store);
    if (sp == null) continue;
    sum += sp;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

const gradeflowCache = {
  gradesStore: null,
  periods: [],
  activePeriod: 'Alle',
  loadPromise: null,
  domSyncStarted: false,
  domSyncObserver: null,
  apiSucceeded: false
};

const _GF_PLANNER_KEY = 'gradeflow-planner-items';
const _GF_ATTENDANCE_KEY = 'gradeflow-attendance-items';

function LoadManualHours() {
  try {
    const r = localStorage.getItem('gradeflow-manual-hours-v1');
    const p = r ? JSON.parse(r) : {};
    return (p && typeof p === 'object') ? p : {};
  } catch (_) { return {}; }
}
function SaveManualHours(map) {
  gradeflowManualHours = { ...(map || {}) };
  try { localStorage.setItem('gradeflow-manual-hours-v1', JSON.stringify(gradeflowManualHours)); } catch (_) {}
}
function HasManualHours() { return !!(gradeflowManualHours && Object.keys(gradeflowManualHours).length); }
function NormalizeSubjectName(name) { return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
function GetHoursForSubject(subject) {
  const m = gradeflowManualHours || {};
  if (subject in m) return m[subject];
  const t = NormalizeSubjectName(subject);
  for (const [n, v] of Object.entries(m)) {
    if (NormalizeSubjectName(n) === t) return v;
  }
  return null;
}
function WeightedPctWithHoursMap(data, hoursMap) {
  let w = 0, th = 0;
  for (const [subject, { scores }] of Object.entries(data || {})) {
    const sp = CalcPercent(scores);
    let hours = null;
    if (subject in hoursMap) hours = hoursMap[subject];
    else {
      const t = NormalizeSubjectName(subject);
      for (const [n, v] of Object.entries(hoursMap)) {
        if (NormalizeSubjectName(n) === t) { hours = v; break; }
      }
    }
    if (!hours || isNaN(hours)) continue;
    w += sp * hours;
    th += hours;
  }
  return th > 0 ? w / th : 0;
}

function ParseLocalDateToTime(value) {
  if (!value) return 0;
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
  }
  const d = new Date(value);
  return isNaN(d) ? 0 : d.getTime();
}
function SortScoresChronologically(scores) {
  return [...scores].sort((a, b) => {
    const da = ParseLocalDateToTime(a.date), db = ParseLocalDateToTime(b.date);
    if (da !== db) return da - db;
    return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
  });
}
function FormatShortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return String(value).split('T')[0];
  return d.toLocaleDateString('nl-BE');
}

function _GfParsePlannerDate(text) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const now = new Date();
  if (/\b(vandaag|today|aujourd'hui)\b/.test(lower)) return now.toISOString();
  if (/\b(morgen|tomorrow|demain)\b/.test(lower)) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return d.toISOString();
  }
  const match = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (!match) return '';
  let year = match[3] ? Number(match[3]) : now.getFullYear();
  if (year < 100) year += 2000;
  const date = new Date(year, Number(match[2]) - 1, Number(match[1]));
  if (!match[3] && date.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 120) date.setFullYear(date.getFullYear() + 1);
  return isNaN(date) ? '' : date.toISOString();
}

function _GfPlannerDisplayDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return isNaN(date) ? String(iso) : date.toLocaleDateString('nl-BE');
}

function _GfPlannerSubjects() {
  const subjects = new Set();
  const all = BuildAllPeriodData(gradeflowCache.gradesStore || {});
  Object.keys(all || {}).forEach(subject => subjects.add(subject));
  return [...subjects];
}

function _GfGuessPlannerSubject(text) {
  const lower = String(text || '').toLowerCase();
  return _GfPlannerSubjects().find(subject => lower.includes(subject.toLowerCase())) || '';
}

function _GfCleanPlannerTitle(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\b\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?\b/g, '')
    .trim()
    .slice(0, 140);
}

function _GfExtractPlannerItemsFromDom() {
  if (!document.body) return [];
  const pathHint = /(planner|planning|agenda|task|tasks|taken|opdracht|calendar)/i.test(location.pathname + ' ' + location.hash);
  const keyword = /(taak|taken|opdracht|deadline|agenda|planner|planning|toets|test|huiswerk|assignment|task|calendar|due|planned|devoir|travail)/i;
  const candidates = [...document.querySelectorAll('a, li, tr, article, [role="listitem"], [class]')]
    .filter(el => !el.closest('#gradeflow-panel-host, #gradeflow-tab-wrapper'))
    .slice(0, 1200);
  const seen = new Set();
  const items = [];
  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 8 || text.length > 420) continue;
    const meta = `${el.className || ''} ${el.id || ''} ${el.getAttribute('href') || ''}`;
    const dueIso = _GfParsePlannerDate(text);
    if (!dueIso && !pathHint && !keyword.test(text + ' ' + meta)) continue;
    if (!dueIso && !keyword.test(text + ' ' + meta)) continue;
    const title = _GfCleanPlannerTitle(text);
    if (!title || title.length < 3) continue;
    const href = el.closest('a')?.href || el.querySelector?.('a[href]')?.href || '';
    const item = {
      title,
      subject: _GfGuessPlannerSubject(text),
      dueDate: _GfPlannerDisplayDate(dueIso),
      dueIso,
      type: keyword.exec(text + ' ' + meta)?.[0] || '',
      url: href,
      source: location.pathname,
    };
    const key = [item.title, item.subject, item.dueDate].join('\u0001').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= 80) break;
  }
  return items.sort((a, b) => String(a.dueIso || '').localeCompare(String(b.dueIso || '')));
}

function _GfStorePlannerItems(items) {
  chrome.storage.local.set({ [_GF_PLANNER_KEY]: JSON.stringify(items || []) }, () => {
    _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-planner-ready' }, '*');
  });
}

function _GfRefreshPlannerItems() {
  const items = _GfExtractPlannerItemsFromDom();
  if (items.length) _GfStorePlannerItems(items);
  return items;
}

function _GfAttendanceDateFromText(text) {
  const raw = String(text || '');
  const numeric = raw.match(/\b(?:ma|di|wo|do|vr|za|zo)?\s*(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/i);
  if (numeric) {
    let year = numeric[3] ? Number(numeric[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    return { text: numeric[0], value: `${numeric[1]}/${numeric[2]}/${year}`, day: Number(numeric[1]), month: Number(numeric[2]), year };
  }
  const monthMap = {
    jan: 1, januari: 1, feb: 2, februari: 2, maa: 3, maart: 3, mrt: 3, apr: 4, april: 4,
    mei: 5, jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, augustus: 8, sep: 9, sept: 9, september: 9,
    okt: 10, oktober: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const word = raw.match(/\b(?:ma|di|wo|do|vr|za|zo)?\s*(\d{1,2})\s+(jan(?:uari)?|feb(?:ruari)?|maa(?:rt)?|mrt|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sep(?:t|tember)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i);
  if (!word) return { text: '', value: '' };
  const month = monthMap[word[2].toLowerCase()];
  return month ? { text: word[0], value: `${word[1]}/${month}/${word[3]}`, day: Number(word[1]), month, year: Number(word[3]) } : { text: '', value: '' };
}

function _GfAttendanceDateIsRelevant(foundDate) {
  const day = Number(foundDate?.day), month = Number(foundDate?.month), year = Number(foundDate?.year);
  if (!day || !month || !year || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const now = new Date();
  const schoolStartYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return year >= schoolStartYear && year <= schoolStartYear + 1;
}

function _GfExtractAttendanceItemsFromDom(root = document, sourcePath = location.pathname) {
  const body = root.body || root;
  if (!body) return [];
  const pageHint = /(studentcard|leerling|afwezig|absen|attendance|late|te-laat|lvs)/i.test(sourcePath + ' ' + (root.title || document.title));
  const keyword = /(afwezig|afwezigheid|doktersattest|te laat|overmacht|openbaar vervoer|ziek|absence|absent|late|retard|attest)/i;
  const junk = /(highcharts|created with highcharts|chart|evolutie afwezigheden|totalen per|klassen\b|alle informatie|leerlingvolgsysteem)/i;
  const candidates = [...body.querySelectorAll('li, tr, article, p, div, [role="listitem"], [class*="absence"], [class*="absen"], [class*="afwezig"], [class*="late"], [class*="lvs"]')]
    .filter(el => !el.closest('#gradeflow-panel-host, #gradeflow-tab-wrapper'))
    .sort((a, b) => (a.innerText || a.textContent || '').length - (b.innerText || b.textContent || '').length)
    .slice(0, 1400);
  const seen = new Set();
  const items = [];
  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 8 || text.length > 360) continue;
    const meta = `${el.className || ''} ${el.id || ''}`;
    if (junk.test(text + ' ' + meta)) continue;
    if (!pageHint && !keyword.test(text + ' ' + meta)) continue;
    if (!keyword.test(text + ' ' + meta)) continue;
    const foundDate = _GfAttendanceDateFromText(text);
    if (!foundDate.value || !_GfAttendanceDateIsRelevant(foundDate)) continue;
    const momentMatch = text.match(/\b(VM|NM|AM|PM)\b(?:\s*,\s*\b(VM|NM|AM|PM)\b)?/i);
    const codeMatch = text.match(/\b([LDRBZ])\b/);
    let title = text
      .replace(foundDate.text || '', '')
      .replace(momentMatch?.[0] || '', '')
      .replace(codeMatch ? new RegExp(`\\b${codeMatch[1]}\\b`) : /$^/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (title.length > 120) title = title.slice(0, 120).trim();
    const item = {
      date: foundDate.value,
      moment: momentMatch?.[0] || '',
      code: codeMatch?.[1] || '',
      title: title || keyword.exec(text)?.[0] || '',
      detail: '',
      type: keyword.exec(text + ' ' + meta)?.[0] || '',
      source: sourcePath,
    };
    const key = [item.date, item.moment, item.code, item.title].join('\u0001').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= 100) break;
  }
  return items;
}

const _GF_ATTENDANCE_URLS = [
  '/?module=LVS&file=index&function=main',
  '/?module=StudentCard&file=index&function=main',
];
let _gfAttendanceRefreshPromise = null;

function _GfNormalizeAttendanceUrl(raw) {
  const value = String(raw || '').trim().replace(/&amp;/g, '&');
  if (!value || value === '#' || /^javascript:/i.test(value)) return '';
  try {
    const url = new URL(value, location.href);
    if (url.origin !== location.origin) return '';
    const full = `${url.pathname}${url.search}${url.hash}` || '/';
    return /(module=(?:LVS|StudentCard)\b|afwezig|absen|absence|attendance|te[-_ ]?laat|studentcard)/i.test(full) ? full : '';
  } catch (_) {
    return '';
  }
}

function _GfExtractAttendanceUrlsFromText(text) {
  const found = [];
  const raw = String(text || '').replace(/\\\//g, '/').replace(/\u0026/g, '&');
  const matches = raw.match(/(?:https?:\/\/[^'"\s<>]+|\/\?[^'"\s<>]+|\/index\.php\?[^'"\s<>]+|index\.php\?[^'"\s<>]+)/gi) || [];
  for (const match of matches) {
    const clean = match.replace(/[),.;]+$/g, '');
    const url = _GfNormalizeAttendanceUrl(clean.startsWith('index.php') ? `/${clean}` : clean);
    if (url) found.push(url);
  }
  return found;
}

function _GfDiscoverAttendanceUrls(root = document) {
  const body = root.body || root;
  if (!body) return [];
  const urls = [];
  const push = value => {
    const url = _GfNormalizeAttendanceUrl(value);
    if (url) urls.push(url);
  };
  push(location.href);
  const candidates = [...body.querySelectorAll('a[href], area[href], form[action], [onclick], [data-href], [data-url], [data-link], [data-module]')]
    .filter(el => !el.closest('#gradeflow-panel-host, #gradeflow-tab-wrapper'))
    .slice(0, 2200);
  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const meta = `${el.getAttribute('href') || ''} ${el.getAttribute('action') || ''} ${el.getAttribute('onclick') || ''} ${el.dataset?.href || ''} ${el.dataset?.url || ''} ${el.dataset?.link || ''} ${el.dataset?.module || ''} ${text}`;
    if (!/(module=(?:LVS|StudentCard)\b|afwezig|absen|absence|attendance|te[-_ ]?laat|studentcard|leerlingvolgsysteem)/i.test(meta)) continue;
    push(el.getAttribute('href'));
    push(el.getAttribute('action'));
    push(el.dataset?.href);
    push(el.dataset?.url);
    push(el.dataset?.link);
    if (/^(LVS|StudentCard)$/i.test(el.dataset?.module || '')) push(`/?module=${el.dataset.module}&file=index&function=main`);
    urls.push(..._GfExtractAttendanceUrlsFromText(el.getAttribute('onclick')));
    urls.push(..._GfExtractAttendanceUrlsFromText(meta));
  }
  return [...new Set(urls)];
}

function _GfAttendanceUrls() {
  return [...new Set([..._GfDiscoverAttendanceUrls(), ..._GF_ATTENDANCE_URLS])].slice(0, 12);
}

function _GfMergeAttendanceItems(...groups) {
  const seen = new Set();
  const out = [];
  for (const items of groups) {
    for (const item of (items || [])) {
      const key = [item.date, item.moment, item.code, item.title].join('\u0001').toLowerCase();
      if (!item.date || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 180) return out;
    }
  }
  return out;
}

function _GfDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function _GfFindAttendanceNavElement(doc) {
  const root = doc?.body || doc;
  if (!root) return null;
  const candidates = [...root.querySelectorAll('a, button, li, span, div, td')]
    .filter(el => !el.closest('#gradeflow-panel-host, #gradeflow-tab-wrapper'))
    .slice(0, 1800);
  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (text === 'afwezigheden' || text === 'absences') return el.closest('a, button, li, tr, [onclick]') || el;
  }
  for (const el of candidates) {
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text || text.length > 80) continue;
    if (/evolutie|totalen|grafiek|chart/.test(text)) continue;
    if (!/\bafwezigheden\b|\bafwezigheid\b|\babsences\b|\babsence\b/i.test(text)) continue;
    return el.closest('a, button, li, tr, [onclick]') || el;
  }
  return null;
}

function _GfActivateAttendanceNav(doc) {
  const target = _GfFindAttendanceNavElement(doc);
  if (!target) return false;
  const link = target.matches?.('a[href]') ? target : target.querySelector?.('a[href]') || target.closest?.('a[href]');
  if (link) {
    try { link.setAttribute('target', '_self'); } catch (_) {}
  }
  try { target.scrollIntoView?.({ block: 'center', inline: 'center' }); } catch (_) {}
  try {
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: target.ownerDocument.defaultView }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: target.ownerDocument.defaultView }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: target.ownerDocument.defaultView }));
    return true;
  } catch (_) {
    try { target.click?.(); return true; } catch (_) { return false; }
  }
}

async function _GfLoadAttendanceItemsInFrame(url) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;border:0;';
  document.documentElement.appendChild(frame);
  try {
    await new Promise(resolve => {
      const done = () => resolve();
      frame.addEventListener('load', done, { once: true });
      frame.src = url;
      setTimeout(done, 3500);
    });
    const deadline = Date.now() + 10000;
    const minWaitUntil = Date.now() + 1200;
    let items = [], stableReads = 0, navClicked = false;
    while (Date.now() < deadline) {
      const doc = frame.contentDocument;
      if (doc?.body) {
        if (!navClicked) {
          navClicked = _GfActivateAttendanceNav(doc);
          if (navClicked) { await _GfDelay(700); continue; }
        }
        const nextItems = _GfExtractAttendanceItemsFromDom(doc, url);
        if (nextItems.length > items.length) {
          items = nextItems;
          stableReads = 0;
        } else if (items.length) {
          stableReads++;
          if (Date.now() >= minWaitUntil && stableReads >= 3) return items;
        }
      }
      await _GfDelay(450);
    }
    return items;
  } catch (_) {
    return [];
  } finally {
    frame.remove();
  }
}

async function _GfFetchAttendanceItems() {
  const found = [];
  for (const url of _GfAttendanceUrls()) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) continue;
      const html = await res.text();
      if (!/afwezig|te laat|doktersattest|absence|studentcard|leerling/i.test(html)) continue;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = _GfExtractAttendanceItemsFromDom(doc, url);
      if (items.length) found.push(items);
    } catch (_) {}
  }
  return _GfMergeAttendanceItems(...found);
}

async function _GfRenderAttendanceItems() {
  const found = [];
  for (const url of _GfAttendanceUrls()) {
    const items = await _GfLoadAttendanceItemsInFrame(url);
    if (items.length) found.push(items);
  }
  return _GfMergeAttendanceItems(...found);
}

function _GfStoreAttendanceItems(items) {
  chrome.storage.local.set({ [_GF_ATTENDANCE_KEY]: JSON.stringify(items || []) }, () => {
    _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-attendance-ready' }, '*');
  });
}

async function _GfRefreshAttendanceItems() {
  if (_gfAttendanceRefreshPromise) return _gfAttendanceRefreshPromise;
  _gfAttendanceRefreshPromise = (async () => {
    const fetchedItems = await _GfFetchAttendanceItems();
    if (fetchedItems.length) _GfStoreAttendanceItems(fetchedItems);
    const renderedItems = await _GfRenderAttendanceItems();
    const domItems = _GfExtractAttendanceItemsFromDom();
    const items = _GfMergeAttendanceItems(fetchedItems, renderedItems, domItems);
    if (items.length) _GfStoreAttendanceItems(items);
    return items;
  })().finally(() => { _gfAttendanceRefreshPromise = null; });
  return _gfAttendanceRefreshPromise;
}

function CreateStore() { return {}; }
function CloneStore(store) {
  const out = CreateStore();
  for (const [p, subjects] of Object.entries(store || {})) {
    if (p.startsWith('_')) { out[p] = subjects; continue; }
    out[p] = {};
    for (const [s, payload] of Object.entries(subjects || {})) {
      out[p][s] = { scores: (payload?.scores || []).map(x => ({ ...x })) };
    }
  }
  return out;
}
function StoreGrade(store, { subject, period, title, date, scored, max }) {
  if (!subject || isNaN(scored) || isNaN(max) || max <= 0) return false;
  period = period || 'Onbekend';
  if (!store[period]) store[period] = {};
  if (!store[period][subject]) store[period][subject] = { scores: [] };
  const scores = store[period][subject].scores;
  if (!scores.some(x => x.scored === scored && x.max === max && x.title === (title || '') && x.date === (date || ''))) {
    scores.push({ title: title || '', date: date || '', scored, max });
    return true;
  }
  return false;
}
function RemoveGrade(store, { subject, period, title, date, scored, max }) {
  if (!store?.[period]?.[subject]?.scores) return false;
  const scores = store[period][subject].scores;
  const idx = scores.findIndex(x => x.scored === scored && x.max === max && x.title === (title || '') && x.date === (date || ''));
  if (idx === -1) return false;
  scores.splice(idx, 1);
  if (!scores.length) delete store[period][subject];
  if (!Object.keys(store[period]).length) delete store[period];
  return true;
}
function StoreSize(store) {
  return Object.entries(store).filter(([k]) => !k.startsWith('_')).flatMap(([,p]) => Object.values(p)).reduce((n, s) => n + s.scores.length, 0);
}
function CalcPercent(scores) {
  const s = scores.reduce((a, e) => a + e.scored, 0),
        m = scores.reduce((a, e) => a + e.max, 0);
  return m > 0 ? (s / m) * 100 : 0;
}

function SortPeriods(periods) {
  const pr = p => {
    const x = String(p || '').toLowerCase();
    if (x === 'alle') return 0;
    if (x.includes('semester 1')) return 10;
    if (x.includes('kerst')) return 15;
    if (x.includes('semester 2')) return 20;
    if (x.includes('trimester 1')) return 10;
    if (x.includes('trimester 2')) return 20;
    if (x.includes('trimester 3')) return 30;
    if (x.includes('eindexamen')) return 40;
    if (x.includes('examen')) return 35;
    return 100;
  };
  return [...periods].sort((a, b) => {
    const pa = pr(a), pb = pr(b);
    if (pa !== pb) return pa - pb;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  });
}
function BuildAllPeriodData(store) {
  const merged = {};
  for (const [key, subjects] of Object.entries(store || {})) {
    if (key.startsWith('_')) continue;
    for (const [s, payload] of Object.entries(subjects || {})) {
      if (!merged[s]) merged[s] = { scores: [] };
      for (const score of (payload?.scores || [])) {
        if (!merged[s].scores.some(x => x.title === score.title && x.date === score.date && x.scored === score.scored && x.max === score.max)) {
          merged[s].scores.push({ ...score });
        }
      }
    }
  }
  return merged;
}
function ComputePeriodsFromStore(store) { return ['Alle', ...SortPeriods(Object.keys(store || {}).filter(p => p !== 'Alle' && !p.startsWith('_')))]; }

function NormalizeApiResultToEntries(result) {
  if (result?.type !== 'normal') return [];
  const period = result?.period?.name || 'Onbekend',
        title = result?.name || '',
        date = FormatShortDate(result?.date || ''),
        desc = result?.graphic?.description || '';
  const match = desc.match(/^\s*([\d.,]+)\s*\/\s*([\d.,]+)\s*$/);
  if (!match) return [];
  const scored = parseFloat(match[1].replace(',', '.')),
        max = parseFloat(match[2].replace(',', '.'));
  if (isNaN(scored) || isNaN(max) || max <= 0) return [];
  return (result?.courses || []).map(c => ({
    subject: c?.name?.trim(),
    graphic: c?.graphic || null,
    period, title, date, scored, max
  })).filter(x => x.subject);
}

function FetchSvgViaBackground(val) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'gf-fetch-svg', value: val }, resp => {
      if (chrome.runtime.lastError) { resolve(null); return; }
      resolve(resp?.dataUri ?? null);
    });
  });
}

async function FetchIconDataUris(values) {
  if (!values.length) return {};
  const uris = {};
  await Promise.all(values.map(async val => {
    const dataUri = await FetchSvgViaBackground(val);
    if (dataUri) uris[val] = dataUri;
  }));
  return uris;
}

function ScrapeDomCourseIcons() {
  const iconMap = {};
  document.querySelectorAll('[class*="smsc-svg--"]').forEach(el => {
    let iconValue = null;
    for (const cls of el.classList) {
      const m = cls.match(/^smsc-svg--(.+)--24$/);
      if (m && m[1]) { iconValue = m[1]; break; }
    }
    if (!iconValue) return;
    const parent = el.closest('button, a, li, [role="option"], [class*="item"]');
    if (!parent) return;
    const label = parent.querySelector('[data-type="label"]')
      || [...parent.querySelectorAll('span, div')].find(s =>
        !s.querySelector('*') && ![...s.classList].some(c => c.startsWith('smsc-svg'))
        && s.textContent.trim().length > 1
      );
    const text = label?.textContent?.trim();
    if (text && text.length > 1 && !iconMap[text]) {
      iconMap[text] = { value: iconValue, type: 'smsc-svg' };
    }
  });
  return iconMap;
}

async function FetchAllApiGrades(onProgress) {
  const store = CreateStore(),
        urls = ['/results/api/v1/evaluations?itemsOnPage=1000', '/results/api/v1/evaluations?itemsOnPage=500'];
  let results = null;

  for (const url of urls) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) continue;
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      results = data;
      break;
    }
  }

  if (!Array.isArray(results) || !results.length) {
    throw new Error('Kon geen evaluaties laden via de API.');
  }

  const courseIcons = {};
  for (const result of results) {
    for (const entry of NormalizeApiResultToEntries(result)) {
      StoreGrade(store, entry);
      if (entry.graphic?.value && !courseIcons[entry.subject]) {
        courseIcons[entry.subject] = { value: entry.graphic.value, type: entry.graphic.type };
      }
    }
    if (onProgress) onProgress(StoreSize(store));
  }

  const domIcons = ScrapeDomCourseIcons();
  for (const [subj, gfx] of Object.entries(domIcons)) {
    if (!courseIcons[subj]) courseIcons[subj] = gfx;
  }

  const iconValues = [...new Set(
    Object.values(courseIcons).map(g => g.value).filter(Boolean)
  )];

  const dataUris = await FetchIconDataUris(iconValues);
  for (const [subj, gfx] of Object.entries(courseIcons)) {
    if (gfx?.value && dataUris[gfx.value]) {
      gfx.dataUri = dataUris[gfx.value];
    }
  }

  store._courseIcons = courseIcons;
  return store;
}

function ExtractGradeFromLi(li) {
  const st = li.querySelector('.evaluation-list-item__graphic > span:last-child')?.textContent.trim() ?? '';
  const [s, m] = st.replace(',', '.').split('/').map(parseFloat);
  const tokens = li.querySelectorAll('.evaluation-list-item__container__tokens__token');
  const entry = {
    subject: tokens[0]?.textContent.trim() ?? null,
    period: tokens[1]?.textContent.trim() ?? 'Onbekend',
    title: li.querySelector('.evaluation-list-item__container__title')?.textContent.trim() ?? '',
    date: li.querySelector('.evaluation-list-item__container__subtitle')?.textContent.trim() ?? '',
    scored: s,
    max: m
  };
  if (!entry.subject || isNaN(entry.scored) || isNaN(entry.max) || entry.max <= 0) return null;
  return entry;
}
function ScrapeItemInto(store, li) { const e = ExtractGradeFromLi(li); return e ? StoreGrade(store, e) : false; }
function RemoveItemFromStore(store, li) { const e = ExtractGradeFromLi(li); return e ? RemoveGrade(store, e) : false; }

function StartDomIncrementalSync() {
  if (gradeflowCache.domSyncStarted || gradeflowCache.apiSucceeded) return;
  const listRoot = document.querySelector('ol.evaluations__filterlistview,ol#evaluations-filterlistview,.listview__rows');
  if (!listRoot) return;

  const observer = new MutationObserver(mutations => {
    if (!gradeflowCache.gradesStore) return;
    let changed = false;

    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('li.evaluation__filterlistview__evaluation-container')) {
          if (ScrapeItemInto(gradeflowCache.gradesStore, node)) changed = true;
        }
        node.querySelectorAll?.('li.evaluation__filterlistview__evaluation-container').forEach(li => {
          if (ScrapeItemInto(gradeflowCache.gradesStore, li)) changed = true;
        });
      });

      m.removedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('li.evaluation__filterlistview__evaluation-container')) {
          if (RemoveItemFromStore(gradeflowCache.gradesStore, node)) changed = true;
        }
        node.querySelectorAll?.('li.evaluation__filterlistview__evaluation-container').forEach(li => {
          if (RemoveItemFromStore(gradeflowCache.gradesStore, li)) changed = true;
        });
      });
    }

    if (changed) {
      gradeflowCache.periods = ComputePeriodsFromStore(gradeflowCache.gradesStore);
      if (!gradeflowCache.periods.includes(gradeflowCache.activePeriod)) gradeflowCache.activePeriod = 'Alle';
    }
  });

  observer.observe(listRoot, { childList: true, subtree: true });
  gradeflowCache.domSyncObserver = observer;
  gradeflowCache.domSyncStarted = true;
}

async function GetAllGrades(onProgress) {
  try {
    const s = await FetchAllApiGrades(onProgress);
    if (StoreSize(s) > 0) {
      gradeflowCache.apiSucceeded = true;
      return s;
    }
  } catch (err) {
    throw err;
  }
  throw new Error('Error while loading grades.');
}

function GetIconUrl() {
  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
      return chrome.runtime.getURL('Assets/icon.png');
    }
  } catch (_) {}
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="3" fill="#f97316"/><path d="M7 3v4M17 3v4M3 9h18" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M8 12h3M13 12h3M8 16h3M13 16h3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>');
}

// Nav watcher: event-based instead of polling
function _GfOnNav() {
  if (document.body) document.body.style.opacity = '1';
  if (!document.getElementById('gradeflow-tab')) SetupButton();
  setTimeout(_GfInitHomeSummary, 350);
  setTimeout(_GfRefreshPlannerItems, 650);
  setTimeout(_GfRefreshAttendanceItems, 750);
}

// Patch pushState/replaceState ONCE at module level so they never stack.
const _gfOrigPush    = history.pushState;
const _gfOrigReplace = history.replaceState;
let _gfNavPatched    = false;

function _GfStartNavWatcher() {
  if (_gfNavObserver) return;
  _gfNavObserver = true;
  window.addEventListener('popstate', _GfOnNav);

  if (!_gfNavPatched) {
    _gfNavPatched = true;
    history.pushState    = function() { _gfOrigPush.apply(this, arguments);    _GfOnNav(); };
    history.replaceState = function() { _gfOrigReplace.apply(this, arguments); _GfOnNav(); };
  }
}

function _GfStopNavWatcher() {
  if (!_gfNavObserver) return;
  window.removeEventListener('popstate', _GfOnNav);
  _gfNavObserver = null;
  // Restore original history methods so they don't fire _GfOnNav while stopped
  if (_gfNavPatched) {
    _gfNavPatched = false;
    history.pushState    = _gfOrigPush;
    history.replaceState = _gfOrigReplace;
  }
}

// Panel
function _GfGetPanelIframe() {
  return document.querySelector('#gradeflow-panel-host iframe');
}

function OnPanelMessage(e) {
  if (e.data?.type === 'gf-close') ClosePanel();
  if (e.data?.type === 'gf-f8') _GfLaunchArcade();
  if (e.data?.type === 'gf-open-gradeflow') OpenPanel(true);
  if (e.data?.type === 'gf-refresh-planner') _GfRefreshPlannerItems();
  if (e.data?.type === 'gf-refresh-attendance') _GfRefreshAttendanceItems();
  if (e.data?.type === 'gf-panel-rendered') {
    const iframe = _GfGetPanelIframe();
    if (iframe) iframe.style.opacity = '1';
  }
}

function ClosePanel() {
  const host = document.getElementById('gradeflow-panel-host');
  if (host) host.style.display = 'none';
  document.getElementById('gradeflow-tab')?.setAttribute('data-selected', 'false');
  document.getElementById('gradeflow-tab-wrapper')?.setAttribute('data-selected', 'false');

  _GfStopUrlGuard();
  try {
    if (_gfPrevUrl) { history.pushState({}, '', _gfPrevUrl); _gfPrevUrl = null; }
    else if (location.pathname.endsWith('/GradeFlow')) {
      history.pushState({}, '', '/results/main/results');
    }
  } catch (_) {}
}

function _GfCreatePanelHost() {
  const sidebar =
    document.querySelector('[role="toolbar"].sidebar-results') ||
    document.querySelector('.sidebar-results') ||
    document.querySelector('nav[class*="sidebar"]') ||
    document.querySelector('[class*="sidebar"]');

  const sidebarRight = sidebar
    ? Math.round(sidebar.getBoundingClientRect().right)
    : 37;

  const topNav =
    document.querySelector('header[class*="topbar"]') ||
    document.querySelector('[class*="topbar"]') ||
    document.querySelector('[class*="top-bar"]') ||
    document.querySelector('header') ||
    null;

  const topOffset = topNav
    ? Math.round(topNav.getBoundingClientRect().bottom)
    : 0;

  const host = document.createElement('div');
  host.id = 'gradeflow-panel-host';
  host.style.cssText = [
    `position:fixed`,
    `left:${sidebarRight}px`,
    `top:${topOffset}px`,
    `right:0`,
    `bottom:0`,
    `z-index:0`,
    `display:flex`,
    `flex-direction:column`,
    `background:#0c0a09`,
    `overflow:hidden`,
    `pointer-events:none`,
    `transition:left 200ms ease`,
  ].join(';');

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('HTML/grades.html');
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;flex:1;pointer-events:all;opacity:0;transition:opacity 0.25s ease;';
  iframe.setAttribute('allowtransparency', 'true');

  setTimeout(() => { if (iframe.style.opacity !== '1') iframe.style.opacity = '1'; }, 1500);

  iframe.addEventListener('load', () => {
    iframe.contentWindow?.postMessage({ type: 'gf-theme', theme: _gfEffectiveTheme, vars: _gfExternalThemeVars }, '*');
  }, { once: true });

  function _GfAttachSidebarRO(sb) {
    if (!sb || !window.ResizeObserver || host._gfRO) return;
    const ro = new ResizeObserver(() => {
      const newLeft = Math.round(sb.getBoundingClientRect().right);
      const currentLeft = parseInt(host.style.left) || 37;
      const expanding = newLeft > currentLeft;
      host.style.transition = expanding
        ? 'left 10ms cubic-bezier(0.4, 0, 0.35, 2.5)'
        : 'left 10ms cubic-bezier(0.425, 0, 0.45, 2.5)';
      host.style.left = newLeft + 'px';
    });
    ro.observe(sb);
    host._gfRO = ro;
    host.style.left = Math.round(sb.getBoundingClientRect().right) + 'px';
  }

  if (sidebar) {
    _GfAttachSidebarRO(sidebar);
  } else {
    let _sbRetry = setInterval(() => {
      const sb =
        document.querySelector('[role="toolbar"].sidebar-results') ||
        document.querySelector('.sidebar-results') ||
        document.querySelector('nav[class*="sidebar"]') ||
        document.querySelector('[class*="sidebar"]');
      if (sb) {
        clearInterval(_sbRetry);
        _GfAttachSidebarRO(sb);
      }
    }, 200);
    setTimeout(() => clearInterval(_sbRetry), 10000);
  }

  host.appendChild(iframe);
  document.body.appendChild(host);
  window.addEventListener('message', OnPanelMessage);
  return host;
}

let _gfGradeLoadPromise = null;
let _gfLastFetchTime = 0;
const _GF_REFETCH_COOLDOWN_MS = 15_000;

function _GfLoadGradesInBackground() {
  if (_gfGradeLoadPromise) return _gfGradeLoadPromise;

  _gfGradeLoadPromise = GetAllGrades()
    .then(store => {
      gradeflowCache.gradesStore = CloneStore(store);
      gradeflowCache.periods = ComputePeriodsFromStore(gradeflowCache.gradesStore);
      gradeflowCache.activePeriod = 'Alle';
      _gfLastFetchTime = Date.now();
      StartDomIncrementalSync();
      _GfRefreshPlannerItems();
      _GfRefreshAttendanceItems();

      return new Promise(resolve => {
        chrome.storage.local.set({ 'gradeflow-grades': JSON.stringify(store) }, () => {
          _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-grades-ready' }, '*');
          resolve(store);
        });
      });
    })
    .catch(err => {
      _gfGradeLoadPromise = null;
      _GfGetPanelIframe()?.contentWindow?.postMessage({
        type: 'gf-grades-error',
        message: err.message || 'Kon punten niet laden'
      }, '*');
      throw err;
    });

  return _gfGradeLoadPromise;
}

let _gfPrevUrl = null;
let _gfUrlTimer = null;

const _GF_URL = '/results/main/results/GradeFlow';

function _GfStartUrlGuard() {
  _GfStopUrlGuard();
  _gfUrlTimer = setInterval(() => {
    if (!location.pathname.endsWith('/GradeFlow')) {
      history.replaceState({ gfPanel: true }, '', _GF_URL);
    }
  }, 150);
}
function _GfStopUrlGuard() {
  if (_gfUrlTimer) { clearInterval(_gfUrlTimer); _gfUrlTimer = null; }
}

function OpenPanel(forceOpen = false) {
  if (forceOpen && !/^\/results(\/|$)/.test(location.pathname)) {
    try { _gfPrevUrl = location.href; } catch (_) {}
    location.assign(_GF_URL);
    return;
  }

  const existingHost = document.getElementById('gradeflow-panel-host');

  if (existingHost && existingHost.style.display !== 'none' && !forceOpen) {
    ClosePanel();
    return;
  }

  if (existingHost) {
    existingHost.style.display = 'flex';
  } else {
    _GfCreatePanelHost();
  }

  document.getElementById('gradeflow-tab')?.setAttribute('data-selected', 'true');
  document.getElementById('gradeflow-tab-wrapper')?.setAttribute('data-selected', 'true');

  try {
    if (!location.pathname.endsWith('/GradeFlow')) {
      _gfPrevUrl = location.href;
      history.pushState({ gfPanel: true }, '', _GF_URL);
    }
  } catch (_) {}
  _GfStartUrlGuard();

  const now = Date.now();
  if (now - _gfLastFetchTime > _GF_REFETCH_COOLDOWN_MS) {
    _gfGradeLoadPromise = null;
  }
  _GfLoadGradesInBackground();
}

// Arcade launcher
function _GfLaunchArcade() {
  const bossGames = [
    { id: 'gf-bo',      fn: () => typeof BossKeyBreakout === 'function' && BossKeyBreakout() },
    { id: 'gf-po',      fn: () => typeof BossKeyPong     === 'function' && BossKeyPong() },
    { id: 'gf-fl',      fn: () => typeof BossKeyFlappy   === 'function' && BossKeyFlappy() },
    { id: 'gf-rn',      fn: () => typeof BossKeyRunner   === 'function' && BossKeyRunner() },
    { id: 'gf-tw',      fn: () => typeof BossKeyTower    === 'function' && BossKeyTower() },
    { id: 'gf-snake',   fn: () => typeof BossKeySnake   === 'function' && BossKeySnake() },
    { id: 'gf-2048',    fn: () => typeof BossKey2048    === 'function' && BossKey2048() },
    { id: 'gf-sweep',   fn: () => typeof BossKeySweeper === 'function' && BossKeySweeper() },
    { id: 'gf-memory',  fn: () => typeof BossKeyMemory  === 'function' && BossKeyMemory() },
    { id: 'gf-shooter', fn: () => typeof BossKeyShooter === 'function' && BossKeyShooter() },
  ];
  for (const { id, fn } of bossGames) {
    const el = document.getElementById(id);
    if (el && (el.dataset.bossHidden === '1' || el.style.display !== 'none')) { fn(); return; }
  }

  for (const id of ['gf-tetris', 'gf-arcade']) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.dataset.bossHidden === '1') { el.style.display = 'flex'; delete el.dataset.bossHidden; return; }
    if (el.style.display !== 'none')   { el.style.display = 'none'; el.dataset.bossHidden = '1'; return; }
  }

  const grades = gradeflowCache.gradesStore ? ExtractGradesForTetris(gradeflowCache.gradesStore) : [];
  if (typeof ToggleGameMenu === 'function') ToggleGameMenu(grades);
}

// Message listener
try {
  if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage?.addListener) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'toggle-panel') {
        OpenPanel();
      } else if (msg.type === 'toggle-grade-tetris') {
        _GfLaunchArcade();
      } else if (msg.type === 'ping') {
        sendResponse({ ok: true });
        return true;
      } else if (msg.type === 'getTheme') {
        sendResponse({ ok: true, theme: _gfEffectiveTheme, savedTheme: _gfCurrentTheme, vars: _gfExternalThemeVars });
        return true;
      } else if (msg.type === 'applySettings') {
        const s = msg.settings || {};
        _gfPersSettings = s;
        if (s.pfpChanger && !_gfPersPfp) {
          try {
            chrome.storage.local.get(_GF_P_PFP_KEY, r => {
              if (r[_GF_P_PFP_KEY]) _gfPersPfp = r[_GF_P_PFP_KEY];
              _GfApplyPersonalization(s);
            });
          } catch (_) { _GfApplyPersonalization(s); }
        } else {
          _GfApplyPersonalization(s);
        }
      } else if (msg.type === 'applyPfp') {
        _gfPersPfp = msg.dataUrl;
        _GfApplyPfp(msg.dataUrl);
      } else if (msg.type === 'gf-reinject-badge') {
        _GfRevertMsgCounter();
        if (_gfPersSettings?.fakeMsgCounter) {
          _GfApplyMsgCounter(_gfPersSettings.msgCounterValue ?? 0);
        }
      }
    });
  }
} catch (_) {}

document.addEventListener('keydown', (e) => {
  if (e.key === 'F6') {
    e.preventDefault();
    e.stopPropagation();
    OpenPanel(true);
  }
  if (e.key === 'F8') {
    e.preventDefault();
    e.stopPropagation();
    _GfLaunchArcade();
  }
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    const panelOpen = document.getElementById('gradeflow-panel-host')?.style.display !== 'none';
    const GAME_IDS = ['gf-tetris','gf-snake','gf-2048','gf-sweep','gf-memory','gf-shooter','gf-bo','gf-po','gf-fl','gf-rn','gf-tw','gf-arcade'];
    const gameOpen = GAME_IDS.some(id => { const el = document.getElementById(id); return el && el.style.display !== 'none'; });
    if (panelOpen || gameOpen) { e.preventDefault(); e.stopPropagation(); }
  }
}, true);

// URL persistence
window.addEventListener('popstate', () => {
  if (location.pathname.endsWith('/GradeFlow')) {
    const host = document.getElementById('gradeflow-panel-host');
    if (!host || host.style.display === 'none') OpenPanel();
  } else {
    const host = document.getElementById('gradeflow-panel-host');
    if (host && host.style.display !== 'none') {
      host.style.display = 'none';
      document.getElementById('gradeflow-tab')?.setAttribute('data-selected', 'false');
      document.getElementById('gradeflow-tab-wrapper')?.setAttribute('data-selected', 'false');
    }
  }
});

document.addEventListener('click', e => {
  const host = document.getElementById('gradeflow-panel-host');
  if (!host || host.style.display === 'none') return;
  const rect = host.getBoundingClientRect();
  if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) return;
  if (e.target.closest('#gradeflow-tab-wrapper, #gradeflow-tab')) return;
  if (e.target.closest('header, nav, [class*="topbar"], [class*="top-bar"], [role="banner"], [class*="topnav"], [class*="TopBar"], [class*="sidebar"], [role="toolbar"]')) return;
  const GAME_IDS = ['gf-tetris','gf-snake','gf-2048','gf-sweep','gf-memory','gf-shooter','gf-arcade'];
  if (GAME_IDS.some(id => document.getElementById(id)?.contains(e.target))) return;
  const activeGame = GAME_IDS.slice(0,-1).some(id => {
    const el = document.getElementById(id);
    return el && el.style.display !== 'none';
  });
  if (activeGame) { _GfLaunchArcade(); return; }
  ClosePanel();
}, false);

if (location.pathname.endsWith('/GradeFlow')) {
  _gfPrevUrl = '/results/main/results';
  _GfStartUrlGuard();

  const _gfHideStyle = document.createElement('style');
  _gfHideStyle.id = 'gf-autoopen-hide';
  _gfHideStyle.textContent = `
    #mainViewAccessPoint, [id*="mainView"], .smsc-content, [class*="content-wrapper"],
    main, [role="main"] { visibility: hidden !important; }
  `;
  (document.head || document.documentElement).appendChild(_gfHideStyle);

  const _gfAutoOpen = () => {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', _gfAutoOpen, { once: true });
      return;
    }
    const host = document.getElementById('gradeflow-panel-host');
    if (!host || host.style.display === 'none') OpenPanel();
    document.getElementById('gf-autoopen-hide')?.remove();
  };
  _gfAutoOpen();
}

let _gfRetryInterval = null, _gfButtonObserver = null;
let _gfPlannerRefreshTimer = null;
let _gfAttendanceRefreshTimer = null;

function _GfQueuePlannerRefresh(delay = 700) {
  clearTimeout(_gfPlannerRefreshTimer);
  _gfPlannerRefreshTimer = setTimeout(_GfRefreshPlannerItems, delay);
}

function _GfInjectFallbackButton(wrapper) {
  if (document.getElementById('gradeflow-tab')) return;

  if (!document.getElementById('gf-btn-style')) {
    const st = document.createElement('style');
    st.id = 'gf-btn-style';
    st.textContent = '#gradeflow-tab-wrapper{display:block;width:100%}#gradeflow-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;padding:10px 4px;border:none;background:none;cursor:pointer;color:inherit;font-size:11px;font-family:inherit;opacity:0.7;transition:opacity 0.15s,background 0.15s;border-radius:6px}#gradeflow-tab:hover,#gradeflow-tab[data-selected="true"]{opacity:1;background:rgba(249,115,22,0.12);color:#f97316}#gradeflow-tab img{display:block;width:24px;height:24px}#gradeflow-tab .gf-btn-label{font-size:10px;line-height:1}';
    document.head.appendChild(st);
  }

  const wrapEl = document.createElement('div');
  wrapEl.id = 'gradeflow-tab-wrapper';
  wrapEl.setAttribute('data-selected', 'false');

  const btn = document.createElement('button');
  btn.id = 'gradeflow-tab';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'GradeFlow');
  btn.setAttribute('title', 'GradeFlow');
  btn.setAttribute('data-selected', 'false');
  btn.innerHTML = `<img src="${GetIconUrl()}" width="24" height="24" style="border-radius:4px;"><span class="gf-btn-label">GradeFlow</span>`;
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    OpenPanel();
  }, true);

  wrapEl.appendChild(btn);
  wrapper.appendChild(wrapEl);
}

function _GfIsSmartschoolHome() {
  return location.pathname === '/' && !location.search && !location.hash;
}

function _GfEsc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function _GfFmtNumber(value) {
  if (!Number.isFinite(value)) return '?';
  const rounded = Math.round(value * 10) / 10;
  return String(rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1)).replace('.', ',');
}

function _GfFmtPct(value) {
  return `${_GfFmtNumber(value)}%`;
}

function _GfSummaryColor(pct) {
  return pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';
}

function _GfHomeGaugeSvg(pct) {
  const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
  const angle = (180 - safePct * 1.8) * Math.PI / 180;
  const needleX = 60 + Math.cos(angle) * 39;
  const needleY = 60 - Math.sin(angle) * 39;
  return `<svg class="gf-home-gauge-svg" viewBox="0 0 120 76" focusable="false" aria-hidden="true">
    <path class="gf-home-gauge-band gf-home-red" d="M12 60 A48 48 0 0 1 45.2 14.3" />
    <path class="gf-home-gauge-band gf-home-yellow" d="M45.2 14.3 A48 48 0 0 1 89.6 22.2" />
    <path class="gf-home-gauge-band gf-home-green" d="M89.6 22.2 A48 48 0 0 1 108 60" />
    <line class="gf-home-gauge-needle" x1="60" y1="60" x2="${needleX.toFixed(1)}" y2="${needleY.toFixed(1)}" />
    <circle class="gf-home-gauge-dot" cx="60" cy="60" r="5" />
  </svg>`;
}

function _GfBuildHomeSummary(store) {
  const data = BuildAllPeriodData(store || {});
  const subjectRows = Object.entries(data).map(([subject, payload]) => {
    const scores = payload?.scores || [];
    const scored = scores.reduce((sum, score) => sum + (Number(score.scored) || 0), 0);
    const max = scores.reduce((sum, score) => sum + (Number(score.max) || 0), 0);
    return { subject, scored, max, pct: max > 0 ? scored / max * 100 : 0 };
  }).filter(row => row.max > 0);
  const scored = subjectRows.reduce((sum, row) => sum + row.scored, 0);
  const max = subjectRows.reduce((sum, row) => sum + row.max, 0);
  const pct = max > 0 ? scored / max * 100 : 0;
  const best = subjectRows.reduce((winner, row) => !winner || row.pct > winner.pct ? row : winner, null);
  const weakest = subjectRows.reduce((loser, row) => !loser || row.pct < loser.pct ? row : loser, null);
  return { scored, max, pct, best, weakest, subjectCount: subjectRows.length, riskCount: subjectRows.filter(row => row.pct < 60).length };
}

function _GfHomeStatusText(pct) {
  if (pct >= 60) return _GfTranslate('overview_status_good');
  if (pct >= 50) return _GfTranslate('overview_status_watch');
  return _GfTranslate('overview_status_critical');
}

function _GfHomeSummaryHtml(summary) {
  if (!summary || !summary.max) {
    return `<div class="homepage__block__top">
      <div class="homepage__block__top__title"><h2 class="smsc-title--1 gf-home-title"><img src="${GetIconUrl()}" alt="">${_GfTranslate('overview_summary_title')}</h2></div>
      <div class="homepage__block__top__buttonbar"></div>
    </div>
    <div class="homepage__block__content"><div class="gf-home-lock-wrap is-loading">${_GfTranslate('fetching')}</div></div>`;
  }
  const best = summary.best ? `${_GfEsc(summary.best.subject)} (${_GfFmtPct(summary.best.pct)})` : '-';
  const weakest = summary.weakest ? `${_GfEsc(summary.weakest.subject)} (${_GfFmtPct(summary.weakest.pct)})` : '-';
  return `<div class="homepage__block__top">
    <div class="homepage__block__top__title"><h2 class="smsc-title--1 gf-home-title"><img src="${GetIconUrl()}" alt="">${_GfTranslate('overview_summary_title')}</h2></div>
    <div class="homepage__block__top__buttonbar"></div>
  </div>
  <div class="homepage__block__content">
    <div class="gf-home-lock-wrap" style="--gf-home-pct:${_GfSummaryColor(summary.pct)};">
      <div class="gf-home-lock-left">
        <div class="gf-home-lock-head">
          <div class="gf-home-lock-copy">
            <p class="gf-home-lock-message">${_GfHomeStatusText(summary.pct)}</p>
          </div>
          <button type="button" class="gf-home-open">Open GradeFlow</button>
        </div>
        <div class="gf-home-lock-detail">${_GfTranslate('total')}: ${_GfFmtNumber(summary.scored)} / ${_GfFmtNumber(summary.max)} • ${_GfTranslate('overview_average')}: ${_GfFmtPct(summary.pct)}</div>
        <div class="gf-home-lock-stats">
          <div class="gf-home-lock-stat"><div class="gf-home-lock-stat-label">${_GfTranslate('best_subject')}</div><div class="gf-home-lock-stat-value">${best}</div></div>
          <div class="gf-home-lock-stat"><div class="gf-home-lock-stat-label">${_GfTranslate('overview_weakest_subject')}</div><div class="gf-home-lock-stat-value">${weakest}</div></div>
          <div class="gf-home-lock-stat"><div class="gf-home-lock-stat-label">${_GfTranslate('overview_subject_count')}</div><div class="gf-home-lock-stat-value">${summary.subjectCount}</div></div>
          <div class="gf-home-lock-stat"><div class="gf-home-lock-stat-label">${_GfTranslate('overview_risk_subjects')}</div><div class="gf-home-lock-stat-value">${summary.riskCount}</div></div>
        </div>
      </div>
      <div class="gf-home-lock-right">
        <div class="gf-home-lock-meter">${_GfHomeGaugeSvg(summary.pct)}</div>
        <div class="gf-home-lock-value">${_GfFmtPct(summary.pct)}</div>
      </div>
    </div>
  </div>`;
}

function _GfEnsureHomeSummaryStyle() {
  let style = document.getElementById('gf-home-summary-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'gf-home-summary-style';
    (document.head || document.documentElement).appendChild(style);
  }
  style.textContent = `
    #gf-home-summary.gf-homepage-block{box-sizing:border-box;position:relative;z-index:2;--gf-home-card-bg:#eeeeee;--gf-home-card-border:#d4d4d4;--gf-home-label:#c2410c;--gf-home-value:#111827;--gf-home-detail-bg:#eeeeee;--gf-home-detail-border:#d4d4d4;--gf-home-detail-text:#111827}
    .smpp-news-container > #gf-home-summary.gf-homepage-block{margin:16px 24px 12px;width:auto;max-width:none}
    html[data-gf-theme="dark"] #gf-home-summary:not(.is-smpp){filter:invert(1) hue-rotate(180deg)!important}
    #gf-home-summary.is-dark{color:#f5f5f5!important;background:transparent!important;--gf-home-card-bg:#171717;--gf-home-card-border:rgba(249,115,22,.42);--gf-home-label:#ff8a2a;--gf-home-value:#f9fafb;--gf-home-detail-bg:#171717;--gf-home-detail-border:rgba(249,115,22,.32);--gf-home-detail-text:#e5e7eb}
    #gf-home-summary.is-smpp{color:var(--gf-home-value)!important;background:transparent!important}
    #gf-home-summary.is-dark .homepage__block__content{color:#f5f5f5!important;background:transparent!important}
    #gf-home-summary.is-smpp .homepage__block__content{color:var(--gf-home-value)!important;background:transparent!important}
    #gf-home-summary .homepage__block__content{overflow:hidden}
    #gf-home-summary .gf-home-title{display:flex;align-items:center;gap:8px;color:#c90001!important}
    #gf-home-summary.is-smpp .gf-home-title{color:var(--gf-home-label)!important}
    #gf-home-summary .gf-home-title img{width:24px;height:24px;border-radius:6px;display:block;flex:0 0 auto}
    #gf-home-summary .gf-home-lock-wrap{display:grid;grid-template-columns:minmax(0,1fr) clamp(104px,10vw,132px);grid-template-areas:"left right";gap:clamp(12px,2vw,24px);align-items:center;width:100%;padding:8px 0 4px}
    #gf-home-summary .gf-home-lock-wrap.is-loading{display:block;color:inherit;font-size:12px;padding:10px 0}
    #gf-home-summary .gf-home-lock-left{grid-area:left;min-width:0}
    #gf-home-summary .gf-home-lock-right{grid-area:right;display:grid;place-items:center;gap:2px;align-self:center;justify-self:start}
    #gf-home-summary .gf-home-lock-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:8px}
    #gf-home-summary .gf-home-lock-copy{min-width:0}
    #gf-home-summary .gf-home-lock-message{margin:0;font-size:14px;font-weight:800;color:inherit;line-height:1.35}
    html[data-gf-theme="dark"] #gf-home-summary .gf-home-lock-message,#gf-home-summary.is-dark .gf-home-lock-message{color:#f3f4f6!important}
    #gf-home-summary.is-smpp .gf-home-lock-message{color:var(--gf-home-value)!important}
    #gf-home-summary.is-smpp.is-glass .gf-home-lock-detail,#gf-home-summary.is-smpp.is-glass .gf-home-lock-stat{backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}
    #gf-home-summary .gf-home-lock-detail{display:inline-flex;max-width:100%;margin:9px 0 13px;padding:6px 9px;border:1px solid var(--gf-home-detail-border)!important;border-radius:6px;background:var(--gf-home-detail-bg)!important;color:var(--gf-home-detail-text)!important;font-size:12px;font-weight:750;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.35;white-space:normal}
    html[data-gf-theme="dark"] #gf-home-summary{--gf-home-card-bg:#171717;--gf-home-card-border:rgba(249,115,22,.42);--gf-home-label:#ff8a2a;--gf-home-value:#f9fafb;--gf-home-detail-bg:#171717;--gf-home-detail-border:rgba(249,115,22,.32);--gf-home-detail-text:#e5e7eb}
    #gf-home-summary .gf-home-lock-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:2px}
    #gf-home-summary .gf-home-lock-stat{min-width:0;padding:10px 11px;border:1px solid var(--gf-home-card-border)!important;border-radius:6px;background:var(--gf-home-card-bg)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important}
    #gf-home-summary .gf-home-lock-stat-label{margin-bottom:5px;color:var(--gf-home-label)!important;font-size:10px;font-weight:900;letter-spacing:.55px;text-transform:uppercase;line-height:1.2}
    #gf-home-summary .gf-home-lock-stat-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:900;color:var(--gf-home-value)!important;line-height:1.3}
    #gf-home-summary .gf-home-open{flex:0 0 auto;border:1px solid rgba(249,115,22,.55);border-radius:6px;background:rgba(249,115,22,.10);color:#ea580c;padding:7px 11px;font-size:12px;font-weight:850;cursor:pointer;line-height:1.15}
    #gf-home-summary .gf-home-open:hover{background:#f97316;color:#111}
    #gf-home-summary.is-smpp .gf-home-open{border-color:var(--gf-home-label)!important;background:var(--gf-home-detail-bg)!important;color:var(--gf-home-label)!important}
    #gf-home-summary.is-smpp .gf-home-open:hover{background:var(--gf-home-label)!important;color:var(--gf-home-card-bg)!important}
    #gf-home-summary .gf-home-lock-meter{width:clamp(96px,9vw,120px);height:clamp(62px,6vw,76px);display:grid;place-items:center;overflow:visible}
    #gf-home-summary .gf-home-gauge-svg{width:clamp(96px,9vw,120px);height:clamp(62px,6vw,76px);overflow:visible}.gf-home-gauge-band{fill:none;stroke-width:18}.gf-home-red{stroke:#f87171}.gf-home-yellow{stroke:#fbbf24}.gf-home-green{stroke:#4ade80}.gf-home-gauge-needle{stroke:#d6d3d1;stroke-width:4;stroke-linecap:round}.gf-home-gauge-dot{fill:#d6d3d1}
    #gf-home-summary .gf-home-lock-value{color:var(--gf-home-pct);font-size:24px;font-weight:900;line-height:1}
    @media(max-width:980px){#gf-home-summary .gf-home-lock-wrap{grid-template-columns:1fr;grid-template-areas:"left"}#gf-home-summary .gf-home-lock-right{display:none}}
    @media(max-width:520px){#gf-home-summary .gf-home-lock-head{display:block}#gf-home-summary .gf-home-open{margin-top:10px}#gf-home-summary .gf-home-lock-stats{grid-template-columns:1fr}#gf-home-summary .gf-home-title{font-size:16px!important}}
  `;
}

function _GfFindHomeSummaryMount() {
  const smppNews = document.querySelector('.smpp-news-container');
  if (smppNews) return smppNews;
  const smppNewsContent = document.getElementById('smpp-news-content');
  if (smppNewsContent?.parentElement?.classList.contains('smpp-news-container')) return smppNewsContent.parentElement;
  const center = document.getElementById('centercontainer') || document.querySelector('.homepage__center');
  if (center) return center;
  const selectors = ['main', '[role="main"]', '#smscMain', '#main', '.smsc-main', '.main-content', '.content', '[class*="mainContent"]', '[class*="MainContent"]'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el || el.closest('header,nav,aside,#gradeflow-panel-host,.smpp-widget,.smpp-widget-pannel,#leftcontainer,#rightcontainer,.homepage__left,.homepage__right')) continue;
    if (el.classList.contains('smpp-widgets-container') || el.querySelector(':scope > .smpp-news-container')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 360 && rect.height > 80) return el;
  }
  const news = [...document.querySelectorAll('h1,h2,h3,h4,[class]')].find(el => /^nieuws$/i.test((el.textContent || '').trim()));
  const newsMount = news?.closest('#smpp-news-content,.smpp-news-container,#centercontainer,.homepage__center') || news?.parentElement?.parentElement || news?.parentElement;
  if (newsMount?.classList?.contains('smpp-news-container')) return newsMount;
  if (newsMount?.id === 'smpp-news-content' && newsMount.parentElement?.classList.contains('smpp-news-container')) return newsMount.parentElement;
  if (newsMount && !newsMount.closest?.('.smpp-widget,.smpp-widget-pannel,#leftcontainer,#rightcontainer,.homepage__left,.homepage__right')) return newsMount;
  return null;
}

function _GfHomeSummaryInsertBefore(mount) {
  if (!mount) return null;
  if (mount.classList?.contains('smpp-news-container')) {
    return mount.querySelector('#smpp-news-content,.smpp-news-editor') || mount.firstChild;
  }
  return mount.firstChild;
}

function _GfCleanupHomeSummaryWidgetShell(shell) {
  if (!shell || !shell.classList?.contains('smpp-widget')) return;
  if (shell.dataset.widgetName !== 'SmartschoolWidget-gf-home-summary' && !shell.querySelector('#gf-home-summary')) return;
  const next = shell.nextElementSibling;
  if (next?.classList.contains('smpp-widget-insertion-point')) next.remove();
  shell.remove();
}

function _GfStartHomeSummaryLayoutWatcher() {
  if (_gfHomeSummaryLayoutObserver || !_GfIsSmartschoolHome() || !document.body) return;
  const schedule = () => {
    clearTimeout(_gfHomeSummaryLayoutTimer);
    _gfHomeSummaryLayoutTimer = setTimeout(() => {
      if (!_GfIsSmartschoolHome()) return;
      chrome.storage.local.get('gradeflow-grades', result => {
        _GfRenderHomeSummaryFromRaw(result?.['gradeflow-grades'] || '');
      });
    }, 120);
  };
  _gfHomeSummaryLayoutObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.smpp-widgets-container,.smpp-news-container,#smpp-news-content,#centercontainer,.homepage__center') || node.querySelector?.('.smpp-widgets-container,.smpp-news-container,#smpp-news-content,#centercontainer,.homepage__center')) {
          schedule();
          return;
        }
      }
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.id === 'gf-home-summary' || node.querySelector?.('#gf-home-summary')) {
          schedule();
          return;
        }
      }
    }
  });
  _gfHomeSummaryLayoutObserver.observe(document.body, { childList: true, subtree: true });
}

function _GfApplyHomeSummaryTheme(card) {
  if (!card) return;
  const smpp = _gfExternalThemeVars || _GfReadSmartschoolPlusPlusTheme();
  if (smpp) {
    const cardBg = smpp.glass ? smpp.overlay : smpp.surface;
    const detailBg = smpp.glass ? smpp.overlay : smpp.surface2;
    card.classList.add('is-smpp');
    card.classList.toggle('is-glass', !!smpp.glass);
    card.classList.toggle('is-dark', !!smpp.isDark);
    card.classList.toggle('is-light', !smpp.isDark);
    card.style.setProperty('--gf-home-card-bg', cardBg);
    card.style.setProperty('--gf-home-card-border', smpp.border);
    card.style.setProperty('--gf-home-label', smpp.accent);
    card.style.setProperty('--gf-home-value', smpp.text);
    card.style.setProperty('--gf-home-detail-bg', detailBg);
    card.style.setProperty('--gf-home-detail-border', smpp.border);
    card.style.setProperty('--gf-home-detail-text', smpp.text);
    return;
  }
  card.classList.remove('is-smpp');
  card.classList.remove('is-glass');
  ['--gf-home-card-bg', '--gf-home-card-border', '--gf-home-label', '--gf-home-value', '--gf-home-detail-bg', '--gf-home-detail-border', '--gf-home-detail-text'].forEach(name => card.style.removeProperty(name));
  const isDark = _gfCurrentTheme === 'dark' || localStorage.getItem('gf-theme-cache') === 'dark' || document.documentElement.getAttribute('data-gf-theme') === 'dark';
  card.classList.toggle('is-dark', !!isDark);
  card.classList.toggle('is-light', !isDark);
}

function _GfRenderHomeSummary(store) {
  if (!_GfIsSmartschoolHome() || !document.body) return;
  _GfEnsureHomeSummaryStyle();
  document.querySelectorAll('#gf-home-summary:not(.gf-homepage-block)').forEach(node => node.remove());
  let card = document.getElementById('gf-home-summary');
  const mount = _GfFindHomeSummaryMount();
  if (!mount) return;
  const beforeNode = _GfHomeSummaryInsertBefore(mount);
  const oldWidgetShell = card?.closest?.('.smpp-widget') || null;
  if (!card) {
    card = document.createElement('div');
    card.id = 'gf-home-summary';
    card.className = 'homepage__block gf-homepage-block';
    card.setAttribute('aria-label', 'GradeFlow samenvatting');
    mount.insertBefore(card, beforeNode);
    card.addEventListener('click', e => {
      if (!e.target.closest('.gf-home-open')) return;
      e.preventDefault();
      OpenPanel(true);
    });
  } else {
    card.className = 'homepage__block gf-homepage-block';
    if (card.parentElement !== mount && !card.contains(mount)) mount.insertBefore(card, beforeNode);
    else if (beforeNode && beforeNode !== card && card.nextSibling !== beforeNode) mount.insertBefore(card, beforeNode);
  }
  _GfCleanupHomeSummaryWidgetShell(oldWidgetShell);
  _GfApplyHomeSummaryTheme(card);
  card.innerHTML = _GfHomeSummaryHtml(_GfBuildHomeSummary(store || {}));
}

function _GfRenderHomeSummaryFromRaw(raw) {
  if (!_GfIsSmartschoolHome()) return;
  try { _GfRenderHomeSummary(raw ? JSON.parse(raw) : null); } catch (_) {}
}

function _GfInitHomeSummary() {
  if (!_GfIsSmartschoolHome()) {
    document.getElementById('gf-home-summary')?.remove();
    if (_gfHomeSummaryLayoutObserver) { _gfHomeSummaryLayoutObserver.disconnect(); _gfHomeSummaryLayoutObserver = null; }
    clearTimeout(_gfHomeSummaryLayoutTimer);
    return;
  }
  if (!document.body) return;
  _GfStartHomeSummaryLayoutWatcher();
  chrome.storage.local.get('gradeflow-grades', result => {
    _GfRenderHomeSummaryFromRaw(result?.['gradeflow-grades'] || '');
  });
  setTimeout(() => {
    _GfLoadGradesInBackground().then(store => _GfRenderHomeSummary(store)).catch(() => {});
  }, 900);
}

function SetupButton() {
  if (!/^\/results(\/|$)/.test(location.pathname)) return;
  if (document.getElementById('gradeflow-tab')) return;

  const toolbar = document.querySelector('div[role="toolbar"].sidebar-results')
    || document.querySelector('.sidebar-results')
    || document.querySelector('[role="toolbar"]');
  if (!toolbar) return;

  const wrapper = toolbar.querySelector('[class*="itemsWrapper"]')
    || toolbar.querySelector('ul')
    || toolbar.querySelector('ol')
    || toolbar;
  if (!wrapper) return;

  if (wrapper.dataset.gfCloseBound !== '1') {
    wrapper.dataset.gfCloseBound = '1';
    wrapper.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.id === 'gradeflow-tab') return;
      if (document.getElementById('gradeflow-panel-host')) ClosePanel();
    }, true);
  }

  const sample = wrapper.querySelector('[class*="optionWrapper"]:not(:has(button[aria-current]))')
    || wrapper.querySelector('li[class]:not(:has(button[aria-current]))')
    || wrapper.querySelector('li:not(:has(button[aria-current]))')
    || wrapper.querySelector('[class*="optionWrapper"]')
    || wrapper.querySelector('li[class]')
    || wrapper.querySelector('li')
    || wrapper.querySelector('[role="listitem"]');

  if (!sample) {
    _GfInjectFallbackButton(wrapper);
    return;
  }

  const clone = sample.cloneNode(true);
  clone.id = 'gradeflow-tab-wrapper';
  clone.setAttribute('data-selected', 'false');

  const btn = clone.querySelector('button');
  if (!btn) {
    _GfInjectFallbackButton(wrapper);
    return;
  }

  btn.id = 'gradeflow-tab';
  btn.type = 'button';
  btn.removeAttribute('aria-current');
  btn.setAttribute('aria-label', 'GradeFlow');
  btn.setAttribute('title', 'GradeFlow');
  btn.setAttribute('data-selected', 'false');

  const icon = btn.querySelector('[data-type="icon"]');
  if (icon) icon.innerHTML = `<img src="${GetIconUrl()}" width="24" height="24" style="display:block;border-radius:4px;">`;

  const label = btn.querySelector('[data-type="label"]')
    || btn.querySelector('[class*="label"]')
    || [...btn.querySelectorAll('*')].find(el =>
        !el.querySelector('*') && el.textContent.trim() &&
        !el.closest('[data-type="icon"]') && !el.closest('svg'));
  if (label) label.textContent = 'GradeFlow';

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    OpenPanel();
  }, true);

  wrapper.appendChild(clone);

  if (label) {
    const siblingLabel = wrapper.querySelector('[class*="label"]:not(#gradeflow-tab [class*="label"])');
    if (siblingLabel) {
      const syncHidden = () => {
        const h = siblingLabel.getAttribute('aria-hidden');
        if (h !== null) label.setAttribute('aria-hidden', h);
      };
      syncHidden();
      new MutationObserver(syncHidden).observe(siblingLabel, { attributes: true, attributeFilter: ['aria-hidden'] });
    }
  }
}

function InitObserver() {
  if (_gfButtonObserver) return;
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', InitObserver, { once: true });
    return;
  }

  _gfButtonObserver = new MutationObserver(() => {
    if (!document.getElementById('gradeflow-tab')) SetupButton();
    _GfQueuePlannerRefresh();
    clearTimeout(_gfAttendanceRefreshTimer);
    _gfAttendanceRefreshTimer = setTimeout(_GfRefreshAttendanceItems, 900);
  });
  _gfButtonObserver.observe(document.body, { childList: true, subtree: true });

  let retries = 0;
  _gfRetryInterval = setInterval(() => {
    if (document.getElementById('gradeflow-tab')) {
      clearInterval(_gfRetryInterval);
      _gfRetryInterval = null;
      return;
    }
    retries++;
    SetupButton();
    if (retries >= 30) {
      clearInterval(_gfRetryInterval);
      _gfRetryInterval = null;
    }
  }, 1000);
}

SetupButton();
InitObserver();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _GfInitHomeSummary, { once: true });
} else {
  _GfInitHomeSummary();
}
setTimeout(_GfRefreshPlannerItems, 1200);
setTimeout(_GfRefreshAttendanceItems, 1400);


const _GF_P_SETTINGS_KEY = 'gf-personalization';
const _GF_P_PFP_KEY      = 'gf-profile-picture';
let _gfPersSettings = null;
let _gfPersPfp      = null;
let _gfPersReady    = false; // true once settings are loaded from storage

let _gfDetectedRealName = (typeof window !== 'undefined' && window._gfDetectedRealName) || null;

function _GfNameScanRoot() {
  // Use SmartSchool-specific selectors only, broad wildcards like
  // [class*="Header"] can accidentally match content containers.
  return document.querySelector(
    '.smsc-top-bar, .smsc-top, #smsc-top, .smsc-header, header, nav, [role="banner"]'
  ) || document.body;
}

function _GfApplyName(name) {
  if (!name) return;
  let count = 0;

  document.querySelectorAll('[data-gf-orig-name]').forEach(el => {
    if (el.textContent !== name) el.textContent = name;
    count++;
  });

  const root = _GfNameScanRoot();
  if (!root) return;

  const realName = _gfDetectedRealName;
  if (realName) {
    root.querySelectorAll('a, span, div, p, li, td, h1, h2, h3, h4, button, label').forEach(el => {
      if (el.dataset.gfOrigName) return;
      if (el.closest('#gradeflow-panel-host, #gf-arcade, iframe')) return;
      if (el.children.length > 0) return;
      const t = el.textContent.trim();
      if (t === realName) {
        el.dataset.gfOrigName = t;
        el.textContent = name;
        count++;
      }
    });
  }
  if (count) { _GfCacheName(name); return; }

  const candidates = [];
  root.querySelectorAll('a, span, div, p, li, td, h1, h2, h3, h4, button, label').forEach(el => {
    if (el.closest('#gradeflow-panel-host, #gf-arcade, iframe')) return;
    if (el.children.length > 0) return;
    const t = el.textContent.trim();
    if (t.length < 3 || t.length > 60) return;
    if (/^(start|berichten|vakken|links|ga naar|help|zoek|instellingen|afmelden|GradeFlow)/i.test(t)) return;
    if (/^\d/.test(t)) return;
    if (!/\s/.test(t)) return;
    if (!/^[A-Za-zÀ-ÿ\s\-'.]+$/.test(t)) return;
    candidates.push({ el, text: t });
  });

  if (!candidates.length) return;

  // Best candidate is the first (we're already scoped to header/nav)
  const best = candidates[0];
  _gfDetectedRealName = best.text;
  try { localStorage.setItem('gf-realname-cache', best.text); } catch (_) {}

  candidates.forEach(c => {
    if (c.text === best.text) {
      c.el.dataset.gfOrigName = c.text;
      c.el.textContent = name;
      count++;
    }
  });
  if (count) _GfCacheName(name);
}

function _GfCacheName(name) {
  try { localStorage.setItem('gf-name-cache', name || ''); } catch (_) {}
}

function _GfRevertName() {
  document.querySelectorAll('[data-gf-orig-name]').forEach(el => {
    el.textContent = el.dataset.gfOrigName;
    delete el.dataset.gfOrigName;
  });
  try {
    localStorage.removeItem('gf-name-cache');
    localStorage.removeItem('gf-realname-cache');
  } catch (_) {}
}

// Profile picture
let _gfDetectedAvatarSrc = null;
let _gfPfpLastUrl = '';
let _gfPfpBgUrlCache = '';
let _gfBgScanDone = false;  // background-image avatars only need scanning once

function _GfPfpScanRoot() {
  // SmartSchool-specific selectors only. Falls back to body if not present yet.
  return document.querySelector(
    '.smsc-top-bar, .smsc-top, #smsc-top, .smsc-header, header, nav, [role="banner"]'
  ) || document.body;
}

function _GfRememberDetectedAvatar(src) {
  if (!src || src.startsWith('data:')) return;
  _gfDetectedAvatarSrc = src;
  try { chrome.storage.local.set({ 'gf-detected-profile-picture': src }); } catch (_) {}
}

function _GfDetectOriginalAvatar() {
  if (_gfDetectedAvatarSrc) return _gfDetectedAvatarSrc;
  const root = _GfPfpScanRoot();
  const img = root?.querySelector('img[src*="userpicture"], img[src*="Userimage"], img[src*="UserImage"]');
  const src = img?.dataset?.gfOrigSrc || img?.src || '';
  if (src) _GfRememberDetectedAvatar(src);
  return _gfDetectedAvatarSrc;
}

function _GfApplyPfp(dataUrl) {
  if (!dataUrl) return;
  if (dataUrl !== _gfPfpLastUrl) {
    _gfPfpLastUrl = dataUrl;
    _gfPfpBgUrlCache = `url(${dataUrl})`;
    try { localStorage.setItem('gf-pfp-cache', dataUrl); } catch (_) {}
    _gfBgScanDone = false; // re-scan backgrounds when PFP changes
  }
  const bgUrl = _gfPfpBgUrlCache;
  const skip = '#gradeflow-panel-host, #gf-arcade';

  // 1) Re-apply to elements we already swapped (cheap targeted query)
  document.querySelectorAll('[data-gf-orig-src]').forEach(el => {
    if (el.tagName === 'IMG') { if (el.src !== dataUrl) el.src = dataUrl; }
    else if (el.style.backgroundImage !== bgUrl) el.style.backgroundImage = bgUrl;
  });

  // 2) Scan only the header/nav region for new userpicture imgs.
  //    The src setter override at document_start already swaps most of these
  //    instantly, but this handles imgs created after that override missed
  //    (e.g. dynamically added in a deeply nested shadow DOM, or via cssText).
  const root = _GfPfpScanRoot();
  if (root) {
    const avatarUrl = _gfDetectedAvatarSrc;
    const detectedId = avatarUrl ? _GfExtractSmscUserId(avatarUrl) : null;

    root.querySelectorAll('img').forEach(img => {
      if (img.dataset.gfOrigSrc || img.src === dataUrl) return;
      if (img.closest(skip)) return;
      const src = img.src || '';
      if (!src || src.startsWith('data:')) return;

      let match = /userpicture\d*\.smartschool\.be/i.test(src);
      if (!match && avatarUrl) {
        if (src === avatarUrl || _GfSameAvatarUrl(src, avatarUrl)) match = true;
        else if (detectedId) {
          const thisId = _GfExtractSmscUserId(src);
          if (thisId && detectedId === thisId) match = true;
        }
      }

      if (match) {
        if (!_gfDetectedAvatarSrc) {
          _GfRememberDetectedAvatar(src);
        }
        img.dataset.gfOrigSrc = src;
        img.src = dataUrl;
      }
    });
  }

  // 3) Background-image avatars: only scan ONCE per PFP value.
  //    getComputedStyle is expensive; once we've found and tagged them, the
  //    targeted [data-gf-orig-src] re-apply above keeps them in sync.
  if (!_gfBgScanDone && root) {
    _gfBgScanDone = true;
    root.querySelectorAll(
      '[class*="avatar"], [class*="profile-pic"], [class*="foto"], [class*="user-img"], [class*="userpic"]'
    ).forEach(el => {
      if (el.tagName === 'IMG' || el.dataset.gfOrigSrc) return;
      if (el.closest(skip)) return;
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.startsWith('url(')) {
        el.dataset.gfOrigSrc = bg;
        el.style.backgroundImage = bgUrl;
      }
    });
  }
}

function _GfSameAvatarUrl(a, b) {
  if (!a || !b) return false;
  try {
    const ua = new URL(a, location.origin);
    const ub = new URL(b, location.origin);
    return ua.pathname === ub.pathname;
  } catch (_) { return false; }
}

function _GfExtractSmscUserId(url) {
  if (!url) return null;
  const m = url.match(/\/hash\/(\d+)_/);
  return m ? m[1] : null;
}

function _GfRevertPfp() {
  document.querySelectorAll('[data-gf-orig-src]').forEach(el => {
    if (el.tagName === 'IMG') {
      el.src = el.dataset.gfOrigSrc;
    } else {
      el.style.backgroundImage = el.dataset.gfOrigSrc;
    }
    delete el.dataset.gfOrigSrc;
  });
  try { localStorage.removeItem('gf-pfp-cache'); } catch (_) {}
}

function _GfIsInTopnav(el) {
  let cur = el.parentElement;
  while (cur && cur !== document.body) {
    const cls = cur.className || '';
    if (/dropdown|flyout|favourites-container/i.test(cls)) return false;
    if (cur.tagName === 'HEADER') return true;
    if (cur.getAttribute('role') === 'banner') return true;
    if (/topnav|topbar|top-bar/i.test(cls)) return true;
    cur = cur.parentElement;
  }
  return false;
}

let _gfMsgLinks     = []; // topnav Berichten <a> elements only
let _gfMsgObserver  = null;
let _gfMsgCount     = 0;
let _gfMsgEnabled   = false;

function _GfFindAllBerichtenLinks() {
  const skip = '#gradeflow-panel-host, #gf-arcade';
  const seen = new Set();
  const results = [];

  for (const badge of document.querySelectorAll('.js-badge-msg')) {
    const a = badge.closest('a');
    if (a && !a.closest(skip) && !seen.has(a)) { seen.add(a); results.push(a); }
  }

  for (const a of document.querySelectorAll('a[data-id="messages"]')) {
    if (!a.closest(skip) && !seen.has(a)) { seen.add(a); results.push(a); }
  }

  return results;
}

function _GfAssertBadgeOn(link) {
  if (!link || !_gfMsgEnabled || _gfMsgCount <= 0) return;

  const existing = link.querySelector('[data-gf-orig-counter]');
  if (existing) {
    if (existing.textContent !== String(_gfMsgCount)) existing.textContent = String(_gfMsgCount);
    if (existing.getAttribute('data-value') !== String(_gfMsgCount)) existing.setAttribute('data-value', String(_gfMsgCount));
    existing.removeAttribute('hidden');
    existing.style.removeProperty('display');
    return;
  }

  const smsc = link.querySelector('.js-badge-msg, .topnav__badge, [class*="badge"]');
  if (smsc) {
    smsc.dataset.gfOrigCounter = smsc.textContent.trim();
    smsc.dataset.gfOrigDisplay = smsc.style.display || '';
    smsc.textContent = String(_gfMsgCount);
    smsc.setAttribute('data-value', String(_gfMsgCount));
    smsc.removeAttribute('hidden');
    smsc.style.removeProperty('display');
    smsc.style.visibility = '';
    return;
  }

  const badge = document.createElement('span');
  badge.className = 'js-badge-msg topnav__badge';
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-label', _gfMsgCount + ' Ongelezen meldingen');
  badge.setAttribute('aria-live', 'polite');
  badge.setAttribute('aria-relevant', 'additions');
  badge.setAttribute('data-value', String(_gfMsgCount));
  badge.dataset.gfOrigCounter = '';
  badge.dataset.gfOrigDisplay = '';
  badge.dataset.gfCreated     = '1';
  badge.textContent = String(_gfMsgCount);
  badge.style.cssText =
    'display:inline-flex !important;align-items:center;justify-content:center;' +
    'min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e53935;color:#fff;' +
    'font-size:11px;font-weight:700;margin-left:4px;line-height:1;vertical-align:middle;';
  link.appendChild(badge);
}

function _GfAssertBadge() {
  _gfMsgLinks.forEach(_GfAssertBadgeOn);
}

function _GfWatchMsgLinks() {
  if (_gfMsgObserver) { _gfMsgObserver.disconnect(); _gfMsgObserver = null; }
  if (!_gfMsgLinks.length) return;
  _gfMsgObserver = new MutationObserver(() => {
    if (!_gfMsgEnabled || _gfMsgCount <= 0) return;
    setTimeout(_GfAssertBadge, 0);
  });
  for (const link of _gfMsgLinks) {
    _gfMsgObserver.observe(link, { childList: true, subtree: true, characterData: true });
  }
}

let _gfMsgLinkWatcher = null;
function _GfStartMsgLinkWatcher() {
  if (_gfMsgLinkWatcher) return;
  const tryLock = () => {
    const found = _GfFindAllBerichtenLinks();
    if (!found.length) return;
    const same = found.length === _gfMsgLinks.length && found.every((l, i) => l === _gfMsgLinks[i]);
    if (same) return;
    _gfMsgLinks = found;
    _GfWatchMsgLinks();
    _GfAssertBadge();
  };
  tryLock();
  _gfMsgLinkWatcher = new MutationObserver(tryLock);
  _gfMsgLinkWatcher.observe(document.documentElement, { childList: true, subtree: true });
}

function _GfApplyMsgCounter(count) {
  _gfMsgCount   = count;
  _gfMsgEnabled = true;
  _GfStartMsgLinkWatcher();
  _GfAssertBadge();
}

function _GfRevertMsgCounter() {
  _gfMsgEnabled = false;
  _gfMsgCount   = 0;
  if (_gfMsgObserver) { _gfMsgObserver.disconnect(); _gfMsgObserver = null; }
  document.querySelectorAll('[data-gf-orig-counter]').forEach(el => {
    if (el.dataset.gfCreated === '1') {
      el.remove();
    } else {
      el.textContent = el.dataset.gfOrigCounter;
      el.style.display = el.dataset.gfOrigDisplay || '';
      if (el.dataset.gfOrigCounter === '' || el.dataset.gfOrigCounter === '0') el.setAttribute('hidden', '');
      delete el.dataset.gfOrigCounter;
      delete el.dataset.gfOrigDisplay;
    }
  });
}

let _gfNotifLinks    = [];
let _gfNotifObserver = null;
let _gfNotifCount    = 0;
let _gfNotifEnabled  = false;

function _GfFindNotifLinks() {
  const skip = '#gradeflow-panel-host, #gf-arcade';
  const seen = new Set();
  const results = [];

  for (const badge of document.querySelectorAll('.js-badge-notifs')) {
    const btn = badge.closest('button, a');
    if (btn && !btn.closest(skip) && !seen.has(btn)) { seen.add(btn); results.push(btn); }
  }

  for (const btn of document.querySelectorAll('button.js-btn-notifs, button[title="Meldingen"]')) {
    if (!btn.closest(skip) && !seen.has(btn)) { seen.add(btn); results.push(btn); }
  }

  return results;
}

function _GfAssertNotifBadgeOn(link) {
  if (!link || !_gfNotifEnabled || _gfNotifCount <= 0) return;
  const existing = link.querySelector('[data-gf-notif-badge]');
  if (existing) {
    if (existing.textContent !== String(_gfNotifCount)) existing.textContent = String(_gfNotifCount);
    if (existing.getAttribute('data-value') !== String(_gfNotifCount)) existing.setAttribute('data-value', String(_gfNotifCount));
    existing.removeAttribute('hidden');
    existing.style.removeProperty('display');
    return;
  }
  const smsc = link.querySelector('.js-badge-notifs, .topnav__badge, [class*="badge"]');
  if (smsc) {
    smsc.dataset.gfNotifBadge = '1';
    smsc.dataset.gfNotifOrig  = smsc.textContent.trim();
    smsc.dataset.gfNotifDisp  = smsc.style.display || '';
    smsc.textContent = String(_gfNotifCount);
    smsc.setAttribute('data-value', String(_gfNotifCount));
    smsc.removeAttribute('hidden');
    smsc.style.removeProperty('display');
    smsc.style.visibility = '';
    return;
  }
  const badge = document.createElement('span');
  badge.className = 'js-badge-notifs topnav__badge';
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-label', _gfNotifCount + ' Meldingen');
  badge.setAttribute('data-value', String(_gfNotifCount));
  badge.dataset.gfNotifBadge = '1';
  badge.dataset.gfNotifOrig  = '';
  badge.dataset.gfNotifDisp  = '';
  badge.dataset.gfNotifCreated = '1';
  badge.textContent = String(_gfNotifCount);
  badge.style.cssText =
    'display:inline-flex !important;align-items:center;justify-content:center;' +
    'min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e53935;color:#fff;' +
    'font-size:11px;font-weight:700;margin-left:4px;line-height:1;vertical-align:middle;';
  link.appendChild(badge);
}

function _GfAssertNotifBadge() { _gfNotifLinks.forEach(_GfAssertNotifBadgeOn); }

function _GfWatchNotifLinks() {
  if (_gfNotifObserver) { _gfNotifObserver.disconnect(); _gfNotifObserver = null; }
  if (!_gfNotifLinks.length) return;
  _gfNotifObserver = new MutationObserver(() => {
    if (!_gfNotifEnabled || _gfNotifCount <= 0) return;
    setTimeout(_GfAssertNotifBadge, 0);
  });
  for (const link of _gfNotifLinks) {
    _gfNotifObserver.observe(link, { childList: true, subtree: true, characterData: true });
  }
}

let _gfNotifLinkWatcher = null;
function _GfStartNotifLinkWatcher() {
  if (_gfNotifLinkWatcher) return;
  const tryLock = () => {
    const found = _GfFindNotifLinks();
    if (!found.length) return;
    const same = found.length === _gfNotifLinks.length && found.every((l, i) => l === _gfNotifLinks[i]);
    if (same) return;
    _gfNotifLinks = found;
    _GfWatchNotifLinks();
    _GfAssertNotifBadge();
  };
  tryLock();
  _gfNotifLinkWatcher = new MutationObserver(tryLock);
  _gfNotifLinkWatcher.observe(document.documentElement, { childList: true, subtree: true });
}

function _GfApplyNotifCounter(count) {
  _gfNotifCount   = count;
  _gfNotifEnabled = true;
  _GfStartNotifLinkWatcher();
  _GfAssertNotifBadge();
}

function _GfRevertNotifCounter() {
  _gfNotifEnabled = false;
  _gfNotifCount   = 0;
  if (_gfNotifObserver) { _gfNotifObserver.disconnect(); _gfNotifObserver = null; }
  document.querySelectorAll('[data-gf-notif-badge]').forEach(el => {
    if (el.dataset.gfNotifCreated === '1') {
      el.remove();
    } else {
      el.textContent = el.dataset.gfNotifOrig;
      el.style.display = el.dataset.gfNotifDisp || '';
      if (el.dataset.gfNotifOrig === '' || el.dataset.gfNotifOrig === '0') el.setAttribute('hidden', '');
      delete el.dataset.gfNotifBadge;
      delete el.dataset.gfNotifOrig;
      delete el.dataset.gfNotifDisp;
      delete el.dataset.gfNotifCreated;
    }
  });
}

let _gfNewsLinks    = [];
let _gfNewsObserver = null;
let _gfNewsCount    = 0;
let _gfNewsEnabled  = false;

function _GfFindNewsLinks() {
  const skip = '#gradeflow-panel-host, #gf-arcade';
  const seen = new Set();
  const results = [];

  for (const badge of document.querySelectorAll('.js-badge-news')) {
    const el = badge.closest('a, button');
    if (el && !el.closest(skip) && !seen.has(el)) { seen.add(el); results.push(el); }
  }

  for (const a of document.querySelectorAll('a[data-id="news"]')) {
    if (!a.closest(skip) && !seen.has(a)) { seen.add(a); results.push(a); }
  }

  return results;
}

function _GfAssertNewsBadgeOn(link) {
  if (!link || !_gfNewsEnabled || _gfNewsCount <= 0) return;
  const existing = link.querySelector('[data-gf-news-badge]');
  if (existing) {
    if (existing.textContent !== String(_gfNewsCount)) existing.textContent = String(_gfNewsCount);
    if (existing.getAttribute('data-value') !== String(_gfNewsCount)) existing.setAttribute('data-value', String(_gfNewsCount));
    existing.removeAttribute('hidden');
    existing.style.removeProperty('display');
    return;
  }
  const smsc = link.querySelector('.js-badge-news, .topnav__badge, [class*="badge"]');
  if (smsc) {
    smsc.dataset.gfNewsBadge = '1';
    smsc.dataset.gfNewsOrig  = smsc.textContent.trim();
    smsc.dataset.gfNewsDisp  = smsc.style.display || '';
    smsc.textContent = String(_gfNewsCount);
    smsc.setAttribute('data-value', String(_gfNewsCount));
    smsc.removeAttribute('hidden');
    smsc.style.removeProperty('display');
    smsc.style.visibility = '';
    return;
  }
  const badge = document.createElement('span');
  badge.className = 'js-badge-news topnav__badge';
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-label', _gfNewsCount + ' Nieuwsberichten');
  badge.setAttribute('data-value', String(_gfNewsCount));
  badge.dataset.gfNewsBadge   = '1';
  badge.dataset.gfNewsOrig    = '';
  badge.dataset.gfNewsDisp    = '';
  badge.dataset.gfNewsCreated = '1';
  badge.textContent = String(_gfNewsCount);
  badge.style.cssText =
    'display:inline-flex !important;align-items:center;justify-content:center;' +
    'min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e53935;color:#fff;' +
    'font-size:11px;font-weight:700;margin-left:4px;line-height:1;vertical-align:middle;';
  link.appendChild(badge);
}

function _GfAssertNewsBadge() { _gfNewsLinks.forEach(_GfAssertNewsBadgeOn); }

function _GfWatchNewsLinks() {
  if (_gfNewsObserver) { _gfNewsObserver.disconnect(); _gfNewsObserver = null; }
  if (!_gfNewsLinks.length) return;
  _gfNewsObserver = new MutationObserver(() => {
    if (!_gfNewsEnabled || _gfNewsCount <= 0) return;
    setTimeout(_GfAssertNewsBadge, 0);
  });
  for (const link of _gfNewsLinks) {
    _gfNewsObserver.observe(link, { childList: true, subtree: true, characterData: true });
  }
}

let _gfNewsLinkWatcher = null;
function _GfStartNewsLinkWatcher() {
  if (_gfNewsLinkWatcher) return;
  const tryLock = () => {
    const found = _GfFindNewsLinks();
    if (!found.length) return;
    const same = found.length === _gfNewsLinks.length && found.every((l, i) => l === _gfNewsLinks[i]);
    if (same) return;
    _gfNewsLinks = found;
    _GfWatchNewsLinks();
    _GfAssertNewsBadge();
  };
  tryLock();
  _gfNewsLinkWatcher = new MutationObserver(tryLock);
  _gfNewsLinkWatcher.observe(document.documentElement, { childList: true, subtree: true });
}

function _GfApplyNewsCounter(count) {
  _gfNewsCount   = count;
  _gfNewsEnabled = true;
  _GfStartNewsLinkWatcher();
  _GfAssertNewsBadge();
}

function _GfRevertNewsCounter() {
  _gfNewsEnabled = false;
  _gfNewsCount   = 0;
  if (_gfNewsObserver) { _gfNewsObserver.disconnect(); _gfNewsObserver = null; }
  document.querySelectorAll('[data-gf-news-badge]').forEach(el => {
    if (el.dataset.gfNewsCreated === '1') {
      el.remove();
    } else {
      el.textContent = el.dataset.gfNewsOrig;
      el.style.display = el.dataset.gfNewsDisp || '';
      if (el.dataset.gfNewsOrig === '' || el.dataset.gfNewsOrig === '0') el.setAttribute('hidden', '');
      delete el.dataset.gfNewsBadge;
      delete el.dataset.gfNewsOrig;
      delete el.dataset.gfNewsDisp;
      delete el.dataset.gfNewsCreated;
    }
  });
}

function _GfApplyPersonalization(s) {
  _gfPersSettings = s;
  try { _GfDetectOriginalAvatar(); } catch (_) {}

  const needsHide = (s.nameChanger && s.customName) || s.pfpChanger;
  try { localStorage.setItem('gf-pers-active', needsHide ? '1' : '0'); } catch (_) {}

  try {
    if (s.nameChanger && s.customName) _GfApplyName(s.customName);
    else _GfRevertName();
  } catch (_) {}

  try {
    if (s.fakeMsgCounter) _GfApplyMsgCounter(s.msgCounterValue ?? 0);
    else _GfRevertMsgCounter();
  } catch (_) {}

  try {
    if (s.fakeNotifCounter) _GfApplyNotifCounter(s.notifCounterValue ?? 0);
    else _GfRevertNotifCounter();
  } catch (_) {}

  try {
    if (s.fakeNewsCounter) _GfApplyNewsCounter(s.newsCounterValue ?? 0);
    else _GfRevertNewsCounter();
  } catch (_) {}

  if (s.pfpChanger) {
    if (_gfPersPfp) {
      try { _GfApplyPfp(_gfPersPfp); } catch (_) {}
      document.getElementById('gf-pers-hide')?.remove();
    } else {
      try {
        chrome.storage.local.get(_GF_P_PFP_KEY, r => {
          const pfp = r[_GF_P_PFP_KEY];
          if (pfp) { _gfPersPfp = pfp; try { _GfApplyPfp(pfp); } catch (_) {} }
          document.getElementById('gf-pers-hide')?.remove();
        });
      } catch (_) {
        document.getElementById('gf-pers-hide')?.remove();
      }
    }
  } else {
    try { _GfRevertPfp(); } catch (_) {}
    document.getElementById('gf-pers-hide')?.remove();
  }
}

;(function _GfBootPersonalization() {
  try {
    chrome.storage.sync.get(_GF_P_SETTINGS_KEY, res => {
      if (chrome.runtime.lastError) return;
      const s = res[_GF_P_SETTINGS_KEY];
      if (!s) return;
      _gfPersSettings = s;
      _gfPersReady = true;

      if (s.pfpChanger) {
        chrome.storage.local.get(_GF_P_PFP_KEY, r => {
          const pfp = r[_GF_P_PFP_KEY];
          if (pfp) _gfPersPfp = pfp;
          if (document.body) _GfRunPersonalization();
          _GfStartRetryPolling();
        });
      } else {
        if (document.body) _GfRunPersonalization();
        _GfStartRetryPolling();
      }
    });
  } catch (_) {}

  function _GfRunPersonalization() {
    if (!_gfPersSettings) return;
    _GfApplyPersonalization(_gfPersSettings);
  }

  let _gfRetryId     = null;
  let _gfRetryCount  = 0;
  const _GF_MAX_RETRIES = 8;       // 8 × 750 ms = 6 s fast phase
  const _GF_FAST_INTERVAL = 750;
  const _GF_SLOW_INTERVAL = 8000;  // keepalive idle interval

  function _GfAnyActive() {
    const s = _gfPersSettings;
    if (!s) return false;
    return (s.nameChanger && s.customName) || (s.pfpChanger && _gfPersPfp) ||
           s.fakeMsgCounter || s.fakeNotifCounter || s.fakeNewsCounter;
  }

  function _GfStartRetryPolling() {
    if (_gfRetryId) return;
    _gfRetryId = setInterval(() => {
      _gfRetryCount++;
      if (!_gfPersReady || !document.body) {
        if (_gfRetryCount >= _GF_MAX_RETRIES) { clearInterval(_gfRetryId); _gfRetryId = null; }
        return;
      }
      if (!_gfPersSettings) { clearInterval(_gfRetryId); _gfRetryId = null; return; }

      if (_GfAnyActive()) _GfRunPersonalization();

      if (_gfRetryCount >= _GF_MAX_RETRIES) {
        clearInterval(_gfRetryId);
        _gfRetryId = null;
        _GfStartKeepAlive();
      }
    }, _GF_FAST_INTERVAL);
  }

  // Idle-scheduled keepalive: never blocks an interactive frame.
  function _GfStartKeepAlive() {
    const ric = window.requestIdleCallback || function (cb) { return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), _GF_SLOW_INTERVAL); };
    function tick() {
      if (!_gfPersReady || !_gfPersSettings) return;
      if (_GfAnyActive()) _GfRunPersonalization();
      ric(tick, { timeout: _GF_SLOW_INTERVAL });
    }
    ric(tick, { timeout: _GF_SLOW_INTERVAL });
  }

  // Mutation observer: scope to header/nav once it exists, fall back to body.
  let _gfObsTimer = null;
  let _gfFirstApply = true;

  function _GfMutationCallback(mutations) {
    if (!_gfPersReady || !_GfAnyActive()) return;

    // Only react to additions/removals of element nodes
    let hasRelevant = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.addedNodes.length > 0 || m.removedNodes.length > 0) { hasRelevant = true; break; }
      if (m.type === 'characterData') { hasRelevant = true; break; }
    }
    if (!hasRelevant) return;

    if (_gfFirstApply) {
      _gfFirstApply = false;
      _GfRunPersonalization();
      return;
    }
    if (_gfObsTimer) return;
    _gfObsTimer = setTimeout(() => {
      _gfObsTimer = null;
      // Run inside requestIdleCallback if available so the work happens
      // off the critical path (no Violation warnings).
      const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
      ric(_GfRunPersonalization, { timeout: 1500 });
    }, 800);
  }

  const _gfPersObserver = new MutationObserver(_GfMutationCallback);

  function StartObserving() {
    if (!document.body) return;
    // Prefer narrow scope: only watch header/nav. If those don't exist yet,
    // watch the body but still get filtered by relevance check above.
    const root = document.querySelector(
      '.smsc-top-bar, .smsc-top, #smsc-top, .smsc-header, header, nav, [role="banner"]'
    ) || document.body;
    _gfPersObserver.observe(root, {
      childList: true, subtree: true, characterData: true,
    });
  }
  if (document.body) StartObserving();
  else document.addEventListener('DOMContentLoaded', StartObserving, { once: true });
})();

}

function ExtractGradesForTetris(store) {
  const out = [];
  for (const [key, subjects] of Object.entries(store || {})) {
    if (key.startsWith('_')) continue;
    for (const [subject, { scores }] of Object.entries(subjects || {}))
      for (const s of scores)
        if (s.max > 0) out.push({
          id:         `${subject}-${s.title}-${s.date}`,
          subject,
          score:      s.scored,
          maxScore:   s.max,
          percentage: (s.scored / s.max) * 100,
          label:      `${s.scored}/${s.max}`,
        });
  }
  return out;
}
