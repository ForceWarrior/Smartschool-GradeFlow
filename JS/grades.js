function LoadDecimalSep() {
  try { return localStorage.getItem('gradeflow-decimal-v1') || 'auto'; } catch (_) { return 'auto'; }
}
function SaveDecimalSep(sep) {
  S.decimalSep = sep;
  try { localStorage.setItem('gradeflow-decimal-v1', sep); } catch (_) {}
}
function GetDecimalSep() {
  if (S.decimalSep && S.decimalSep !== 'auto') return S.decimalSep;
  return GF_LANGS[ResolveLangCode()]?._decimal ?? ',';
}
function FormatPercent(n, dec = 1) {
  if (isNaN(n) || n == null) return '?';
  return Number(n).toFixed(dec).replace('.', GetDecimalSep());
}
function ApplyDecimalSep(s) { return String(s).replace('.', GetDecimalSep()); }

function LoadGradeDecimals() {
  try {
    const v = localStorage.getItem('gradeflow-grade-dec-v1');
    return ['auto', '0', '1', '2'].includes(v) ? v : 'auto';
  } catch (_) { return 'auto'; }
}
function SaveGradeDecimals(val) {
  S.gradeDecimals = val;
  try { localStorage.setItem('gradeflow-grade-dec-v1', val); } catch (_) {}
}

// Mode persistence
function LoadWeightMode() {
  try {
    const v = localStorage.getItem('gradeflow-weightmode-v1');
    if (['points', 'hours'].includes(v)) return v;
    const old = localStorage.getItem('gradeflow-mode-v1');
    return old === 'hours' ? 'hours' : 'points';
  } catch (_) { return 'points'; }
}
function SaveWeightMode(mode) {
  S.weightMode = mode;
  try { localStorage.setItem('gradeflow-weightmode-v1', mode); } catch (_) {}
}
function LoadUseFormula() {
  try {
    const v = localStorage.getItem('gradeflow-useformula-v1');
    if (v !== null) return v === '1';
    const old = localStorage.getItem('gradeflow-mode-v1');
    return old === 'formula';
  } catch (_) { return false; }
}
function SaveUseFormula(val) {
  S.useFormula = !!val;
  try { localStorage.setItem('gradeflow-useformula-v1', val ? '1' : '0'); } catch (_) {}
}

// Translations
function LoadLangPref() {
  try { return localStorage.getItem('gradeflow-lang-v1') || 'auto'; } catch (_) { return 'auto'; }
}
function SaveLangPref(lang) {
  S.lang = lang;
  try { localStorage.setItem('gradeflow-lang-v1', lang); } catch (_) {}
  try { chrome.storage?.sync?.set({ 'gf-lang': lang }); } catch (_) {}
}
function LoadCustomLang() {
  try {
    const raw = localStorage.getItem('gradeflow-custom-lang-v1');
    const p = raw ? JSON.parse(raw) : {};
    return (p && typeof p === 'object') ? p : {};
  } catch (_) { return {}; }
}
function SaveCustomLang(obj) {
  S.customLang = { ...obj };
  try { localStorage.setItem('gradeflow-custom-lang-v1', JSON.stringify(S.customLang)); } catch (_) {}
}
function ResolveLangCode() {
  const pref = S.lang;
  if (pref === 'auto' || pref === 'custom') {
    const nav = (navigator.language || 'nl').split('-')[0].toLowerCase();
    return GF_LANGS[nav] ? nav : 'nl';
  }
  return GF_LANGS[pref] ? pref : 'nl';
}
function Translate(key) {
  if (S.lang === 'custom' && S.customLang[key]) return S.customLang[key];
  const code = ResolveLangCode();
  return GF_LANGS[code]?.[key] ?? GF_LANGS['nl'][key] ?? key;
}

const _GF_DEFAULT_ICON_RULES = [
  { keys: 'nederlands,dutch,néerlandais,nl',           icon: '🇳🇱' },
  { keys: 'frans,french,français,fr',                  icon: '🇫🇷' },
  { keys: 'engels,english,anglais,en',                 icon: '🇬🇧' },
  { keys: 'duits,german,allemand,deutsch,de',          icon: '🇩🇪' },
  { keys: 'spaans,spanish,espagnol,español,es',        icon: '🇪🇸' },
  { keys: 'italiaans,italian,italien,it',              icon: '🇮🇹' },
  { keys: 'portugees,portuguese,portugais,pt',         icon: '🇵🇹' },
  { keys: 'russisch,russian,russe,ru',                 icon: '🇷🇺' },
  { keys: 'chinees,chinese,chinois,zh',                icon: '🇨🇳' },
  { keys: 'japans,japanese,japonais,ja',               icon: '🇯🇵' },
  { keys: 'arabisch,arabic,arabe,ar',                  icon: '🇸🇦' },
  { keys: 'turks,turkish,turc,tr',                     icon: '🇹🇷' },
  { keys: 'zweeds,swedish,suédois,sv',                 icon: '🇸🇪' },
  { keys: 'noors,norwegian,norvégien,no',              icon: '🇳🇴' },
  { keys: 'deens,danish,danois,da',                    icon: '🇩🇰' },
  { keys: 'pools,polish,polonais,pl',                  icon: '🇵🇱' },

  // Sciences
  { keys: 'wiskunde,math,mathématiques,calcul',        icon: '📐' },
  { keys: 'fysica,physics,physique,natuurkunde',       icon: '⚛️' },
  { keys: 'chemie,chemistry,chimie,scheikunde',        icon: '🧪' },
  { keys: 'biologie,biology,biolog',                   icon: '🧬' },
  { keys: 'wetenschappen,sciences,science',            icon: '🔬' },
  { keys: 'aardrijkskunde,geografie,geography,géo',   icon: '🌍' },

  // Humanities
  { keys: 'geschiedenis,history,histoire',             icon: '📜' },
  { keys: 'latijn,latin',                              icon: '🏛️' },
  { keys: 'grieks,greek,grec',                         icon: '🏺' },
  { keys: 'filosofie,philosophy,philosophie',          icon: '💭' },
  { keys: 'psychologie,psychology',                    icon: '🧠' },
  { keys: 'sociaal,social,maatschappij,sociologie',    icon: '👥' },
  { keys: 'religie,godsdienst,religion,levensbeschouw',icon: '✝️' },
  { keys: 'recht,juridisch,law,droit',                 icon: '⚖️' },

  // Arts & music
  { keys: 'muziek,music,musique',                      icon: '🎵' },
  { keys: 'kunst,art,teken,beeldend,plastisch',        icon: '🎨' },

  // Tech & economy
  { keys: 'informatica,computer,ict,programmeer',      icon: '💻' },
  { keys: 'economie,economy,économie',                 icon: '📊' },
  { keys: 'techniek,technology,technique,toegepaste',  icon: '🔧' },
  { keys: 'elektriciteit,elektro,electric',            icon: '⚡' },

  // PE & projects
  { keys: 'sport,lichamelijk,gym,educatie fysieke,beweging', icon: '⚽' },
  { keys: 'project,stage,praktijk',                   icon: '📋' },
];

function LoadIconRules() {
  try {
    const raw = localStorage.getItem('gradeflow-icon-rules-v1');
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch (_) { return null; }
}

function SaveIconRules(arr) {
  S.iconRules = arr;
  try { localStorage.setItem('gradeflow-icon-rules-v1', JSON.stringify(arr)); } catch (_) {}
}

function GetIconRules() { return S.iconRules ?? _GF_DEFAULT_ICON_RULES; }

function LoadSubjectIcons() {
  try {
    const raw = localStorage.getItem('gradeflow-subj-icons-v1');
    return raw ? JSON.parse(raw) || {} : {};
  } catch (_) { return {}; }
}

function SaveSubjectIcons(obj) {
  S.subjectIcons = { ...obj };
  try { localStorage.setItem('gradeflow-subj-icons-v1', JSON.stringify(S.subjectIcons)); } catch (_) {}
}

function EmojiForSubject(subj) {
  const lower = subj.toLowerCase();
  for (const rule of GetIconRules()) {
    const keywords = rule.keys.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.some(k => lower.includes(k))) return rule.icon;
  }
  return '📘';
}

function SubjectIconHtml(subj) {
  if (S.subjectIcons?.[subj]) {
    return `<span class="gf-subj-icon">${S.subjectIcons[subj]}</span>`;
  }
  const gfx = S.courseIcons?.[subj];
  if (gfx?.dataUri) {
    return `<span class="gf-subj-icon gf-smsc-icon"><img src="${gfx.dataUri}" width="20" height="20" alt=""></span>`;
  }
  return `<span class="gf-subj-icon">${EmojiForSubject(subj)}</span>`;
}

// Theme sync
const GF_EXTERNAL_THEME_PROPS = ['--orange', '--orange-dim', '--orange-bg', '--orange-bg2', '--bg-0', '--bg-1', '--bg-2', '--bg-3', '--bg-4', '--border', '--border-hi', '--text-0', '--text-1', '--text-2', '--text-3'];
let _gfParentThemeSource = '';

function ClearExternalGradeTheme() {
  GF_EXTERNAL_THEME_PROPS.forEach(name => document.documentElement.style.removeProperty(name));
}

function ApplyGradeTheme(theme, vars = null) {
  if (theme === 'smpp' && vars) {
    document.documentElement.setAttribute('data-theme', 'smpp');
    document.documentElement.style.setProperty('--orange', vars.accent || '#f97316');
    document.documentElement.style.setProperty('--orange-dim', vars.accent || '#f97316');
    document.documentElement.style.setProperty('--orange-bg', `color-mix(in srgb, ${vars.accent || '#f97316'} 14%, transparent)`);
    document.documentElement.style.setProperty('--orange-bg2', `color-mix(in srgb, ${vars.accent || '#f97316'} 22%, transparent)`);
    document.documentElement.style.setProperty('--bg-0', vars.bg || '#0d0d0d');
    document.documentElement.style.setProperty('--bg-1', vars.surface || vars.bg || '#141414');
    document.documentElement.style.setProperty('--bg-2', vars.surface2 || vars.surface || vars.bg || '#1c1c1c');
    document.documentElement.style.setProperty('--bg-3', vars.surface2 || vars.surface || '#242424');
    document.documentElement.style.setProperty('--bg-4', vars.surface3 || vars.surface2 || '#2e2e2e');
    document.documentElement.style.setProperty('--border', vars.border || vars.surface3 || '#2a2a2a');
    document.documentElement.style.setProperty('--border-hi', vars.accent || vars.border || '#3a3a3a');
    document.documentElement.style.setProperty('--text-0', vars.text || '#f5f5f5');
    document.documentElement.style.setProperty('--text-1', vars.text || '#c4c4c4');
    document.documentElement.style.setProperty('--text-2', vars.text || '#888');
    document.documentElement.style.setProperty('--text-3', vars.text || '#555');
    return;
  }
  ClearExternalGradeTheme();
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

chrome.storage.local.get('gradeflow-theme', ({ 'gradeflow-theme': saved }) => {
  const th = saved === 'dark' || saved === 'smpp' ? saved : 'light';
  S.theme = th;
  ApplyGradeTheme(th);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['gradeflow-theme']) {
    const th = changes['gradeflow-theme'].newValue;
    if (_gfParentThemeSource === 'smpp' && th !== 'smpp') return;
    S.theme = th;
    ApplyGradeTheme(th);
    const overlay = document.getElementById('gf-settings-overlay');
    if (overlay?.classList.contains('is-open')) RenderSettings();
  }
  if (area === 'local' && changes['gradeflow-study-sessions']) {
    S.studySessions = NormalizeStudySessions(changes['gradeflow-study-sessions'].newValue);
    if (S.activeView === 'planner') RenderMainContent(false);
  }
  if (area === 'local' && changes['gradeflow-attendance-items']) {
    S.attendanceItems = NormalizeAttendanceItems(changes['gradeflow-attendance-items'].newValue);
    if (S.activeView === 'attendance') RenderMainContent(false);
  }
  if (area === 'local' && changes['gf-profile-picture']) {
    S.profilePicture = changes['gf-profile-picture'].newValue || '';
    if (S.activeView === 'comparison') RenderMainContent(false);
  }
  if (area === 'local' && changes['gf-detected-profile-picture']) {
    S.detectedProfilePicture = changes['gf-detected-profile-picture'].newValue || '';
    if (S.activeView === 'comparison') RenderMainContent(false);
  }
});

window.addEventListener('message', e => {
  if (e.data?.type === 'gf-theme') {
    _gfParentThemeSource = e.data.theme === 'smpp' ? 'smpp' : '';
    S.theme = e.data.theme;
    ApplyGradeTheme(e.data.theme, e.data.vars || null);
    const overlay = document.getElementById('gf-settings-overlay');
    if (overlay?.classList.contains('is-open')) RenderSettings();
  }

  if (e.data?.type === 'gf-grades-ready') {
    const prevJSON = S.store ? JSON.stringify(S.store) : null;
    const prevStore = S.store ? JSON.parse(JSON.stringify(S.store)) : null;
    chrome.storage.local.get(['gradeflow-grades', 'gradeflow-planner-items', 'gradeflow-study-sessions', 'gradeflow-attendance-items', 'gf-profile-picture', 'gf-detected-profile-picture'], result => {
      S.profilePicture = result?.['gf-profile-picture'] || S.profilePicture || '';
      S.detectedProfilePicture = result?.['gf-detected-profile-picture'] || S.detectedProfilePicture || '';
      S.plannerItems = NormalizePlannerItems(result?.['gradeflow-planner-items']);
      S.studySessions = NormalizeStudySessions(result?.['gradeflow-study-sessions']);
      S.attendanceItems = NormalizeAttendanceItems(result?.['gradeflow-attendance-items']);
      const raw = result?.['gradeflow-grades'];
      if (!raw || (prevJSON && prevJSON === raw)) return;
      const wasAlreadyLoaded = !!S.store;
      S.store = JSON.parse(raw);
      InvalidatePeriodCache();
if (S.store?._courseIcons) {
  S.courseIcons = S.store._courseIcons;
  delete S.store._courseIcons;
}
      S.periods = ComputePeriods(S.store);
      if (!S.periods.includes(S.activePeriod)) S.activePeriod = 'Alle';
      if (wasAlreadyLoaded) {
        NotifyNewGrades(prevStore, S.store);
        const wrap = document.getElementById('gf-table-wrap');
        if (wrap) { wrap.style.transition = 'opacity 0.1s'; wrap.style.opacity = '0'; }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          RenderSidebar();
          RenderMainContent(false);
          UpdateTopbar();
          UpdateBottomBar();
          if (wrap) { wrap.style.opacity = '1'; setTimeout(() => { wrap.style.transition = ''; }, 110); }
        }));
      } else {
        Render(false);
        window.parent.postMessage({ type: 'gf-panel-rendered' }, '*');
      }
    });
  }

  if (e.data?.type === 'gf-planner-ready') {
    LoadPlannerItems(() => {
      if (S.activeView === 'planner') RenderMainContent(false);
    });
  }

  if (e.data?.type === 'gf-attendance-ready') {
    LoadAttendanceItems(() => {
      if (S.activeView === 'attendance') RenderMainContent(false);
    });
  }

  if (e.data?.type === 'gf-grades-error') {
    const wrap = document.getElementById('gf-table-wrap');
    if (wrap) {
      wrap.innerHTML = `
        <div id="gf-state" style="color:var(--red);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.6">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <span>❌ ${e.data.message || Translate('error_load')}</span>
        </div>`;
    }
    UpdateBottomBar();
  }
});

// Formatting
function FormatNumber(n) {
  if (isNaN(n) || n == null) return '?';
  const r = Math.round(n * 100) / 100;
  const dec = S?.gradeDecimals ?? 'auto';
  if (dec === '0') return String(Math.round(r));
  if (dec === '1') return r.toFixed(1).replace('.', GetDecimalSep());
  if (dec === '2') return r.toFixed(2).replace('.', GetDecimalSep());
  if (r % 1 === 0) return String(r);
  return r.toFixed(r * 10 % 1 === 0 ? 1 : 2).replace('.', GetDecimalSep());
}
const ColorForPercent = p => p >= 70 ? '#4ade80' : p >= 50 ? '#fbbf24' : '#f87171';
const BgForPercent    = p => p >= 70 ? '#bbf7d0' : p >= 50 ? '#fde68a' : '#fecaca';

function ParseLocalDateToTime(value) {
  if (!value) return 0;
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) { const [, dd, mm, yyyy] = m; return new Date(+yyyy, +mm - 1, +dd).getTime(); }
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
function CalcPercent(scores) {
  const s = scores.reduce((a, e) => a + e.scored, 0);
  const m = scores.reduce((a, e) => a + e.max, 0);
  return m > 0 ? (s / m) * 100 : 0;
}

// Period helpers
let _allPeriodCache = null;
let _allPeriodCacheStore = null;

function InvalidatePeriodCache() { _allPeriodCache = null; _allPeriodCacheStore = null; }

function BuildAllPeriodData(store) {
  if (store && store === _allPeriodCacheStore && _allPeriodCache) return _allPeriodCache;
  const merged = {};
  for (const [key, subjects] of Object.entries(store || {})) {
    if (key.startsWith('_')) continue;
    for (const [subject, payload] of Object.entries(subjects || {})) {
      if (!merged[subject]) merged[subject] = { scores: [] };
      const seen = new Set(merged[subject].scores.map(x => x.title + '\0' + x.date + '\0' + x.scored + '\0' + x.max));
      for (const score of (payload?.scores || [])) {
        const k = score.title + '\0' + score.date + '\0' + score.scored + '\0' + score.max;
        if (!seen.has(k)) { seen.add(k); merged[subject].scores.push({ ...score, _period: key }); }
      }
    }
  }
  if (store) { _allPeriodCacheStore = store; _allPeriodCache = merged; }
  return merged;
}
function GetPeriodData(store, period) {
  return period === 'Alle' ? BuildAllPeriodData(store) : store?.[period] || {};
}
function SortPeriods(periods) {
  const priority = p => {
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
    const pa = priority(a), pb = priority(b);
    if (pa !== pb) return pa - pb;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  });
}
function ComputePeriods(store) {
  return ['Alle', ...SortPeriods(Object.keys(store || {}).filter(p => p !== 'Alle' && !p.startsWith('_')))];
}

// Hours
function LoadManualHours() {
  try {
    const raw = localStorage.getItem('gradeflow-manual-hours-v1');
    const p = raw ? JSON.parse(raw) : {};
    return (p && typeof p === 'object') ? p : {};
  } catch (_) { return {}; }
}
function SaveManualHours(map) {
  S.manualHours = { ...(map || {}) };
  try { localStorage.setItem('gradeflow-manual-hours-v1', JSON.stringify(S.manualHours)); } catch (_) {}
}
function HasManualHours() { return !!(S.manualHours && Object.keys(S.manualHours).length); }
function NormalizeSubjectName(n) { return String(n || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
function GetHoursForSubject(subject) {
  const m = S.manualHours || {};
  if (subject in m) return m[subject];
  const tgt = NormalizeSubjectName(subject);
  for (const [name, value] of Object.entries(m))
    if (NormalizeSubjectName(name) === tgt) return value;
  return null;
}
function ComputeTotalWeightedHours(data) {
  if (S.weightMode !== 'hours' || !data) return null;
  let total = 0;
  for (const subj of Object.keys(data)) { const h = GetHoursForSubject(subj); if (h) total += h; }
  return total > 0 ? total : null;
}
function WeightedPct(data, period = S.activePeriod, includeWhatIf = period === S.activePeriod) {
  let weighted = 0, totalHours = 0;
  for (const [subject, { scores }] of Object.entries(data || {})) {
    const h = GetHoursForSubject(subject);
    if (!h || isNaN(h)) continue;
    weighted += EffectiveSubjectPct(subject, scores, period, includeWhatIf) * h;
    totalHours += h;
  }
  return totalHours > 0 ? (weighted / totalHours) : 0;
}

// Formula
function LoadFormula() {
  try {
    const raw = localStorage.getItem('gradeflow-formula-v1');
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch (_) { return []; }
}
function SaveFormula(formula) {
  S.formula = Array.isArray(formula) ? formula : [];
  try { localStorage.setItem('gradeflow-formula-v1', JSON.stringify(S.formula)); } catch (_) {}
}
function HasFormula() {
  return (S.formula || []).some(g =>
    (parseFloat(g.totalWeight) || 0) > 0 &&
    (g.parts || []).some(p => p.period && (parseFloat(p.weight) || 0) > 0));
}
function NextFormulaId() { return 'g' + Date.now() + Math.random().toString(36).slice(2, 6); }

function FormulaSubjectPct(subject, store) {
  if (!store || !HasFormula()) return null;
  let ws = 0, tw = 0;
  for (const group of S.formula) {
    const gw = parseFloat(group.totalWeight) || 0;
    if (!gw) continue;
    let gws = 0, gtw = 0;
    for (const part of (group.parts || [])) {
      const pw = parseFloat(part.weight) || 0;
      if (!pw || !part.period) continue;
      const scores = EffectiveScores(subject, store[part.period]?.[subject]?.scores || [], part.period, false);
      if (!scores.length) continue;
      gws += CalcPercent(scores) * pw;
      gtw += pw;
    }
    if (!gtw) continue;
    ws += (gws / gtw) * gw;
    tw += gw;
  }
  return tw > 0 ? (ws / tw) : null;
}

function FormulaOverallPct(store, useHours = false) {
  if (!store) return 0;
  const allData = GetPeriodData(store, 'Alle');
  const subjects = Object.keys(allData);
  if (!subjects.length) return 0;
  if (useHours && HasManualHours()) {
    let w = 0, th = 0;
    for (const subject of subjects) {
      const sp = FormulaSubjectPct(subject, store);
      if (sp == null) continue;
      const h = GetHoursForSubject(subject);
      if (!h || isNaN(h)) continue;
      w += sp * h; th += h;
    }
    if (th > 0) return w / th;
  }
  let sum = 0, count = 0;
  for (const subject of subjects) {
    const sp = FormulaSubjectPct(subject, store);
    if (sp == null) continue;
    sum += sp; count++;
  }
  return count > 0 ? sum / count : 0;
}

// Decision-tool state
function LoadJSONSetting(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) { return fallback; }
}
function SaveJSONSetting(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value || {})); } catch (_) {}
}
function LoadActiveView() {
  try {
    const v = localStorage.getItem('gradeflow-active-view-v1');
    return ['overview', 'trends', 'planner', 'comparison', 'attendance', 'decision', 'export'].includes(v) ? v : 'overview';
  } catch (_) { return 'overview'; }
}
function SaveActiveView(view) {
  S.activeView = view;
  try { localStorage.setItem('gradeflow-active-view-v1', view); } catch (_) {}
}
function LoadWhatIfMode() {
  try { return localStorage.getItem('gradeflow-whatif-enabled-v1') === '1'; } catch (_) { return false; }
}
function SaveWhatIfMode(val) {
  S.whatIfMode = !!val;
  try { localStorage.setItem('gradeflow-whatif-enabled-v1', val ? '1' : '0'); } catch (_) {}
}
function LoadRiskNextMax() {
  try {
    const n = parseFloat(localStorage.getItem('gradeflow-risk-nextmax-v1'));
    return Number.isFinite(n) && n > 0 ? n : 20;
  } catch (_) { return 20; }
}
function SaveRiskNextMax(value) {
  S.riskNextMax = Math.max(1, parseFloat(value) || 20);
  try { localStorage.setItem('gradeflow-risk-nextmax-v1', String(S.riskNextMax)); } catch (_) {}
}
function NormalizeRiskThresholds(value) {
  const source = value && typeof value === 'object' ? value : {};
  let watch = parseFloat(source.watch);
  let safe = parseFloat(source.safe);
  if (!Number.isFinite(watch)) watch = 50;
  if (!Number.isFinite(safe)) safe = 60;
  watch = Math.max(0, Math.min(99, watch));
  safe = Math.max(watch + 1, Math.min(100, safe));
  return { watch, safe };
}
function LoadRiskThresholds() {
  return NormalizeRiskThresholds(LoadJSONSetting('gradeflow-risk-thresholds-v1', { watch: 50, safe: 60 }));
}
function SaveRiskThresholds(next) {
  S.riskThresholds = NormalizeRiskThresholds(next);
  SaveJSONSetting('gradeflow-risk-thresholds-v1', S.riskThresholds);
}
function Esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
function GetScorePeriod(score, fallbackPeriod) {
  return score?._period || fallbackPeriod || S.activePeriod || 'Alle';
}
function GradeKey(period, subject, score) {
  return [period || '', subject || '', score?.title || '', score?.date || '', String(score?.scored ?? ''), String(score?.max ?? '')]
    .join('\u0001');
}
function GradeKeyFromScore(subject, score, fallbackPeriod) {
  return GradeKey(GetScorePeriod(score, fallbackPeriod), subject, score);
}
function IsGradeExcluded(period, subject, score) {
  return !!S.excludedGrades?.[GradeKey(period, subject, score)];
}
function GetGradeWeight(period, subject, score) {
  const v = parseFloat(S.gradeWeights?.[GradeKey(period, subject, score)]);
  return Number.isFinite(v) && v > 0 ? v : 1;
}
function SaveExcludedGrades(map) {
  S.excludedGrades = { ...(map || {}) };
  SaveJSONSetting('gradeflow-excluded-grades-v1', S.excludedGrades);
}
function SaveGradeWeights(map) {
  S.gradeWeights = { ...(map || {}) };
  SaveJSONSetting('gradeflow-grade-weights-v1', S.gradeWeights);
}
function SaveWhatIfScores(map) {
  S.whatIfScores = { ...(map || {}) };
  SaveJSONSetting('gradeflow-whatif-scores-v1', S.whatIfScores);
}
function BuildWhatIfScore(subject) {
  const w = S.whatIfScores?.[subject];
  if (!w || w.period !== S.activePeriod) return null;
  const scored = parseFloat(w?.scored);
  const max = parseFloat(w?.max);
  if (!S.whatIfMode || !Number.isFinite(scored) || !Number.isFinite(max) || max <= 0) return null;
  return { title: Translate('planned_grade'), date: '', scored, max, _whatIf: true, _period: S.activePeriod };
}
function ApplyScoreModel(subject, score, fallbackPeriod) {
  if (score?._whatIf) return { ...score };
  const period = GetScorePeriod(score, fallbackPeriod);
  const weight = GetGradeWeight(period, subject, score);
  return { ...score, scored: score.scored * weight, max: score.max * weight, _weight: weight, _period: period };
}
function EffectiveScores(subject, scores, fallbackPeriod, includeWhatIf = true) {
  const base = (scores || [])
    .filter(score => !score?._whatIf && !IsGradeExcluded(GetScorePeriod(score, fallbackPeriod), subject, score))
    .map(score => ApplyScoreModel(subject, score, fallbackPeriod));
  const planned = includeWhatIf ? BuildWhatIfScore(subject) : null;
  return planned ? [...base, planned] : base;
}
function EffectiveSubjectPct(subject, scores, fallbackPeriod, includeWhatIf = true) {
  return CalcPercent(EffectiveScores(subject, scores, fallbackPeriod, includeWhatIf));
}
function EffectiveTotals(data, fallbackPeriod, includeWhatIf = true) {
  return Object.entries(data || {}).flatMap(([subject, payload]) => EffectiveScores(subject, payload?.scores || [], fallbackPeriod, includeWhatIf));
}
function NormalizePlannerItems(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed.map(item => ({
      title: String(item?.title || '').trim(),
      subject: String(item?.subject || '').trim(),
      dueDate: String(item?.dueDate || '').trim(),
      type: String(item?.type || '').trim(),
      url: String(item?.url || '').trim(),
      source: String(item?.source || '').trim(),
    })).filter(item => item.title || item.subject).filter(item => {
      const key = [item.title, item.subject, item.dueDate].join('\u0001').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 120);
  } catch (_) { return []; }
}
function NormalizeAttendanceItems(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const now = new Date();
    const schoolStartYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const junk = /highcharts|created with highcharts|evolutie afwezigheden|totalen per|klassen\b|alle informatie|leerlingvolgsysteem/i;
    return parsed.map(item => ({
      date: String(item?.date || '').trim(),
      moment: String(item?.moment || '').trim(),
      code: String(item?.code || '').trim(),
      title: String(item?.title || '').trim(),
      detail: String(item?.detail || '').trim(),
      type: String(item?.type || '').trim(),
      source: String(item?.source || '').trim(),
    })).filter(item => {
      if (!item.date || junk.test(`${item.title} ${item.detail}`)) return false;
      const time = ParseLocalDateToTime(item.date);
      if (!time) return false;
      const year = new Date(time).getFullYear();
      return year >= schoolStartYear && year <= schoolStartYear + 1;
    }).filter(item => {
      const key = [item.date, item.moment, item.code, item.title].join('\u0001').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 180);
  } catch (_) { return []; }
}
function LoadPlannerItems(done) {
  try {
    chrome.storage.local.get('gradeflow-planner-items', result => {
      S.plannerItems = NormalizePlannerItems(result?.['gradeflow-planner-items']);
      if (done) done(S.plannerItems);
    });
  } catch (_) {
    S.plannerItems = [];
    if (done) done(S.plannerItems);
  }
}
function LoadAttendanceItems(done) {
  try {
    chrome.storage.local.get('gradeflow-attendance-items', result => {
      S.attendanceItems = NormalizeAttendanceItems(result?.['gradeflow-attendance-items']);
      if (done) done(S.attendanceItems);
    });
  } catch (_) {
    S.attendanceItems = [];
    if (done) done(S.attendanceItems);
  }
}
function CurrentMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function NormalizeStudySessions(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => ({
      id: String(item?.id || ''),
      subject: String(item?.subject || '').trim(),
      topic: String(item?.topic || '').trim(),
      startAt: String(item?.startAt || '').trim(),
      durationMin: Math.max(5, parseInt(item?.durationMin, 10) || 45),
      notifiedAt: String(item?.notifiedAt || '').trim(),
    })).filter(item => item.id && item.startAt && (item.subject || item.topic) && new Date(item.startAt).getTime() > Date.now());
  } catch (_) { return []; }
}
function LoadStudySessions(done) {
  try {
    chrome.storage.local.get('gradeflow-study-sessions', result => {
      S.studySessions = NormalizeStudySessions(result?.['gradeflow-study-sessions']);
      if (done) done(S.studySessions);
    });
  } catch (_) {
    S.studySessions = [];
    if (done) done(S.studySessions);
  }
}
function SaveStudySessions(sessions) {
  S.studySessions = NormalizeStudySessions(sessions);
  chrome.storage.local.set({ 'gradeflow-study-sessions': S.studySessions }, () => {
    try { chrome.runtime.sendMessage({ type: 'gf-study-sync' }, () => { void chrome.runtime.lastError; }); } catch (_) {}
  });
}
function CleanupExpiredStudySessions() {
  const active = NormalizeStudySessions(S.studySessions || []);
  if (active.length !== (S.studySessions || []).length) SaveStudySessions(active);
  else S.studySessions = active;
}
function StudySessionInputValue(value) {
  const date = value ? new Date(value) : new Date();
  if (isNaN(date)) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
function StudySessionDisplay(value) {
  const date = new Date(value);
  if (isNaN(date)) return String(value || '');
  return `${date.toLocaleDateString()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function StudySessionMonth(value) {
  const date = new Date(value);
  return isNaN(date) ? '' : CurrentMonthValue(date);
}
function AddStudySessionFromForm(root) {
  const subject = root.querySelector('#gf-study-subject')?.value?.trim() || '';
  const topic = root.querySelector('#gf-study-topic')?.value?.trim() || '';
  const startAtValue = root.querySelector('#gf-study-start')?.value || '';
  const durationMin = parseInt(root.querySelector('#gf-study-duration')?.value, 10) || 45;
  const startDate = startAtValue ? new Date(startAtValue) : null;
  if (!startDate || isNaN(startDate) || startDate.getTime() <= Date.now() || (!subject && !topic)) {
    ShowToast(Translate('study_invalid'), '', 'warn');
    return;
  }
  const session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject,
    topic,
    startAt: startDate.toISOString(),
    durationMin: Math.max(5, durationMin),
  };
  SaveStudySessions([...(S.studySessions || []), session]);
  S.studyMonth = StudySessionMonth(session.startAt) || S.studyMonth;
  RenderPlannerView();
  ShowToast(Translate('study_saved'), StudySessionDisplay(session.startAt), 'ok');
}
function DeleteStudySession(id) {
  SaveStudySessions((S.studySessions || []).filter(session => session.id !== id));
  RenderPlannerView();
}
function FirstNameOnly(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}
function LoadClassComparisonAlias() {
  try { return localStorage.getItem('gradeflow-class-share-alias-v1') || ''; } catch (_) { return ''; }
}
function SaveClassComparisonAlias(value) {
  S.classShareAlias = String(value || '').trim().slice(0, 80);
  try { localStorage.setItem('gradeflow-class-share-alias-v1', S.classShareAlias); } catch (_) {}
}
function LoadClassComparisonShareName() {
  try { return localStorage.getItem('gradeflow-class-share-real-name-v1') !== '0'; } catch (_) { return true; }
}
function SaveClassComparisonShareName(value) {
  S.classShareRealName = !!value;
  try { localStorage.setItem('gradeflow-class-share-real-name-v1', value ? '1' : '0'); } catch (_) {}
}
function ClassComparisonRawName() {
  try {
    return localStorage.getItem('gf-realname-cache') || localStorage.getItem('gf-name-cache') || Translate('comparison_you');
  } catch (_) { return Translate('comparison_you'); }
}
function ClassComparisonName() {
  if (!S.classShareRealName) return S.classShareAlias || Translate('comparison_you');
  return S.classShareAlias || FirstNameOnly(ClassComparisonRawName()) || Translate('comparison_you');
}
function ClassComparisonIdentity() {
  try {
    let id = localStorage.getItem('gradeflow-class-identity-v1');
    if (!id) {
      const part = globalThis.crypto?.getRandomValues ? [...globalThis.crypto.getRandomValues(new Uint32Array(3))].map(v => v.toString(36)).join('') : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      id = `gf-${part}`.slice(0, 48);
      localStorage.setItem('gradeflow-class-identity-v1', id);
    }
    return id;
  } catch (_) { return ''; }
}
function SanitizedClassComparisonPicture(value) {
  const url = String(value || '').trim();
  if (!url || url.length > 2048 || /^data:/i.test(url)) return '';
  return /^https?:\/\//i.test(url) ? url : '';
}
function ClassComparisonPicture() {
  try {
    return SanitizedClassComparisonPicture(S.detectedProfilePicture)
      || SanitizedClassComparisonPicture(localStorage.getItem('gf-pfp-cache'))
      || SanitizedClassComparisonPicture(S.profilePicture);
  } catch (_) { return SanitizedClassComparisonPicture(S.detectedProfilePicture || S.profilePicture); }
}
function ClassComparisonSubjects(data) {
  const subjects = {};
  for (const [subject, payload] of Object.entries(data || {})) {
    const scores = EffectiveScores(subject, payload?.scores || [], S.activePeriod, false);
    const scored = scores.reduce((sum, score) => sum + score.scored, 0);
    const max = scores.reduce((sum, score) => sum + score.max, 0);
    if (max > 0) subjects[subject] = { o: Math.round(scored * 10) / 10, m: Math.round(max * 10) / 10 };
  }
  return subjects;
}
function ClassComparisonOverall(subjects) {
  let scored = 0, max = 0;
  for (const score of Object.values(subjects || {})) {
    scored += Number(score?.o) || 0;
    max += Number(score?.m) || 0;
  }
  return max > 0 ? scored / max * 100 : 0;
}
function Base64UrlEncodeJson(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function Base64UrlDecodeJson(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function BuildClassComparisonPayload() {
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  return {
    v: 1,
    u: ClassComparisonIdentity(),
    n: ClassComparisonName(),
    p: ClassComparisonPicture(),
    s: ClassComparisonSubjects(data),
    ts: Date.now(),
    period: S.activePeriod === 'Alle' ? 'both' : S.activePeriod,
  };
}
function BuildClassComparisonCode() {
  return `SSCOMP:${Base64UrlEncodeJson(BuildClassComparisonPayload())}`;
}
function NormalizeClassPeer(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const rawSubjects = payload.s && typeof payload.s === 'object' ? payload.s : {};
  const subjects = {};
  for (const [subject, score] of Object.entries(rawSubjects)) {
    const scored = Number(score?.o);
    const max = Number(score?.m);
    if (!subject || !Number.isFinite(scored) || !Number.isFinite(max) || max <= 0) continue;
    subjects[String(subject).trim()] = { o: Math.round(scored * 10) / 10, m: Math.round(max * 10) / 10 };
  }
  if (!Object.keys(subjects).length) return null;
  const name = String(payload.n || Translate('comparison_peer')).trim().slice(0, 80);
  const uid = String(payload.u || '').trim().slice(0, 80).replace(/[^a-z0-9_-]/gi, '');
  const nameKey = name.toLowerCase().replace(/\s+/g, ' ').trim() || Translate('comparison_peer').toLowerCase();
  const timestamp = Number(payload.ts) || Date.now();
  return {
    id: uid ? `u:${uid}` : `n:${nameKey}`,
    uid,
    name,
    picture: SanitizedClassComparisonPicture(payload.p),
    period: String(payload.period || '').trim(),
    ts: timestamp,
    subjects,
  };
}
function NormalizeClassPeers(raw) {
  const source = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  return source.map(NormalizeClassPeer).filter(peer => {
    if (!peer || seen.has(peer.id)) return false;
    seen.add(peer.id);
    return true;
  }).slice(0, 60);
}
function DecodeClassComparisonCodes(text) {
  const raw = String(text || '').trim();
  const matches = [...raw.matchAll(/SSCOMP:([A-Za-z0-9_-]+)/g)].map(match => match[1]);
  const chunks = matches.length ? matches : [raw.replace(/^SSCOMP:/i, '')].filter(Boolean);
  return chunks.map(chunk => NormalizeClassPeer(Base64UrlDecodeJson(chunk))).filter(Boolean);
}
function SaveClassPeers(peers) {
  S.classPeers = NormalizeClassPeers(peers);
  SaveJSONSetting('gradeflow-class-peers-v1', S.classPeers);
}
function DeleteClassPeer(id) {
  SaveClassPeers((S.classPeers || []).filter(peer => peer.id !== id));
  RenderComparisonView();
}
async function CopyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  return ok;
}
function ToggleGradeExcluded(key) {
  const next = { ...(S.excludedGrades || {}) };
  const nowExcluded = !next[key];
  if (nowExcluded) next[key] = 1; else delete next[key];
  SaveExcludedGrades(next);
  ShowToast(nowExcluded ? Translate('notify_grade_excluded') : Translate('notify_grade_included'), '', nowExcluded ? 'warn' : 'ok');
  RenderMainContent(false);
  UpdateTopbar();
  UpdateBottomBar();
}
function SetGradeWeight(key, value) {
  const next = { ...(S.gradeWeights || {}) };
  const n = parseFloat(value);
  if (Number.isFinite(n) && n > 0 && Math.abs(n - 1) > 0.001) next[key] = n;
  else delete next[key];
  SaveGradeWeights(next);
  RenderMainContent(false);
  UpdateTopbar();
  UpdateBottomBar();
}
function ShowToast(title, message = '', kind = 'info') {
  const stack = document.getElementById('gf-toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `gf-toast gf-toast-${kind}`;
  toast.innerHTML = `<div class="gf-toast-icon">GF</div><div><div class="gf-toast-title">${Esc(title)}</div>${message ? `<div class="gf-toast-msg">${Esc(message)}</div>` : ''}</div>`;
  stack.appendChild(toast);
  const close = () => {
    if (!toast.isConnected) return;
    toast.classList.add('is-out');
    setTimeout(() => toast.remove(), 220);
  };
  [...stack.querySelectorAll('.gf-toast:not(.is-out)')].slice(0, -4).forEach(oldToast => {
    oldToast.classList.add('is-out');
    setTimeout(() => oldToast.remove(), 180);
  });
  toast.addEventListener('click', close, { once: true });
  setTimeout(close, 4200);
}
function SnapshotGradeKeys(store) {
  const map = new Map();
  for (const [period, subjects] of Object.entries(store || {})) {
    if (period.startsWith('_')) continue;
    for (const [subject, payload] of Object.entries(subjects || {})) {
      for (const score of (payload?.scores || [])) {
        const key = GradeKey(period, subject, score);
        map.set(key, { period, subject, score });
      }
    }
  }
  return map;
}
function NotifyNewGrades(previousStore, nextStore) {
  if (!previousStore || !nextStore) return;
  const before = SnapshotGradeKeys(previousStore);
  const after = SnapshotGradeKeys(nextStore);
  const added = [...after.entries()].filter(([key]) => !before.has(key)).map(([, value]) => value);
  if (!added.length) return;
  if (added.length === 1) {
    const item = added[0];
    ShowToast(Translate('notify_new_grade'), `${item.subject}: ${FormatNumber(item.score.scored)} / ${FormatNumber(item.score.max)}`, 'ok');
  } else {
    ShowToast(Translate('notify_new_grades').replace('{count}', added.length), Translate('notify_new_grades_body'), 'ok');
  }
}

// State
const S = {
  store: null,
  periods: [],
  activePeriod: 'Alle',
  activeView: LoadActiveView(),
  weightMode: LoadWeightMode(),
  useFormula: LoadUseFormula(),
  excludedGrades: LoadJSONSetting('gradeflow-excluded-grades-v1', {}),
  gradeWeights: LoadJSONSetting('gradeflow-grade-weights-v1', {}),
  whatIfMode: LoadWhatIfMode(),
  whatIfScores: LoadJSONSetting('gradeflow-whatif-scores-v1', {}),
  riskNextMax: LoadRiskNextMax(),
  riskThresholds: LoadRiskThresholds(),
  classPeers: NormalizeClassPeers(LoadJSONSetting('gradeflow-class-peers-v1', [])),
  classShareAlias: LoadClassComparisonAlias(),
  classShareRealName: LoadClassComparisonShareName(),
  profilePicture: '',
  detectedProfilePicture: '',
  plannerItems: [],
  attendanceItems: [],
  studySessions: [],
  studyMonth: CurrentMonthValue(),
  hoursOpen: false,
  formulaOpen: false,
  manualHours: LoadManualHours(),
  formula: LoadFormula(),
  bestSubjectMode: 'grade',
  theme: 'dark',
  lang: LoadLangPref(),
  customLang: LoadCustomLang(),
  decimalSep: LoadDecimalSep(),
  gradeDecimals: LoadGradeDecimals(),
  subjectIcons: LoadSubjectIcons(),
  iconRules: LoadIconRules(),
  courseIcons: {},
};

function OverallPct(data, period = S.activePeriod, includeWhatIf = period === S.activePeriod) {
  if (!data || !Object.keys(data).length) return 0;
  const applyFormula = S.useFormula && S.store && period === 'Alle' && HasFormula();
  if (applyFormula) return FormulaOverallPct(S.store, S.weightMode === 'hours');
  if (S.weightMode === 'hours') return WeightedPct(data, period, includeWhatIf);
  return CalcPercent(EffectiveTotals(data, period, includeWhatIf));
}

function GetModeLabel() {
  const base = S.weightMode === 'hours'
    ? (HasManualHours() ? Translate('mode_desc_hours_set') : Translate('mode_desc_hours_unset'))
    : Translate('mode_desc_points');
  if (S.useFormula) {
    const fDesc = HasFormula() ? Translate('mode_desc_formula_set') : Translate('mode_desc_formula_unset');
    return `${base} ${fDesc}`;
  }
  return `${base} ${Translate('mode_desc_formula_off')}`;
}

// Best subject
function GetBestSubject(data) {
  if (!data || !Object.keys(data).length) return null;
  const useValue = S.bestSubjectMode === 'value' && HasManualHours() && S.weightMode === 'hours';
  let best = null, bestScore = -Infinity;
  for (const [subj, { scores }] of Object.entries(data)) {
    const effective = EffectiveScores(subj, scores, S.activePeriod);
    if (!effective.length) continue;
    const subjPct = CalcPercent(effective);
    const score = useValue ? (GetHoursForSubject(subj) ? subjPct * GetHoursForSubject(subj) : -Infinity) : subjPct;
    if (score > bestScore) { bestScore = score; best = { subj, CalcPercent: subjPct, hours: GetHoursForSubject(subj), valueScore: score }; }
  }
  return best;
}

// Bottom bar
function UpdateBottomBar() {
  const pctEl   = document.getElementById('gf-bb-pct');
  const fillEl  = document.getElementById('gf-bb-bar-fill');
  const scoreEl = document.getElementById('gf-bb-score');
  const metaEl  = document.getElementById('gf-bb-meta');
  const labelEl = document.getElementById('gf-bb-label');
  if (!pctEl || !fillEl) return;
  if (labelEl) labelEl.textContent = Translate('total_label');

  const data   = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const hasData = S.store && Object.keys(data).length > 0;

  if (!hasData) {
    pctEl.textContent = '–'; pctEl.style.color = 'var(--text-3)';
    fillEl.style.width = '0%'; fillEl.style.background = 'var(--bg-4)';
    if (scoreEl) scoreEl.textContent = '–';
    if (metaEl)  metaEl.textContent  = '–';
    RenderBestSubjectWidget(null);
    return;
  }

  const total = OverallPct(data);
  const col = ColorForPercent(total);
  pctEl.textContent = FormatPercent(total) + '%';
  pctEl.style.color = col;
  fillEl.style.width = Math.min(Math.max(total, 0), 100) + '%';
  fillEl.style.background = col;

  const allScores  = Object.values(data).flatMap(s => s.scores);
  const modelScores = EffectiveTotals(data, S.activePeriod);
  const tScored    = modelScores.reduce((a, e) => a + e.scored, 0);
  const tMax       = modelScores.reduce((a, e) => a + e.max, 0);
  if (scoreEl) scoreEl.textContent = FormatNumber(tScored) + ' / ' + FormatNumber(tMax) + ' pt';

  if (metaEl) {
    const periodLabel = S.activePeriod === 'Alle' ? Translate('all_periods_tag') : S.activePeriod;
    const tags = [];
    if (S.weightMode === 'hours') tags.push(Translate('hour_weighted_tag'));
    if (S.useFormula) tags.push(Translate('formula_tag'));
    const tagsStr = tags.length ? ' · ' + tags.join(' · ') : '';
    metaEl.textContent = `${Object.keys(data).length} ${Translate('subjects')} · ${allScores.length} ${Translate('results')} · ${periodLabel}${tagsStr}`;
  }

  RenderBestSubjectWidget(GetBestSubject(data));
}

function RenderBestSubjectWidget(best) {
  const nameEl  = document.getElementById('gf-bb-best-name');
  const statEl  = document.getElementById('gf-bb-best-stat');
  const labelEl = document.getElementById('gf-bb-best-label-text');
  if (!nameEl || !statEl) return;
  const useValue = S.bestSubjectMode === 'value' && HasManualHours();
  if (labelEl) labelEl.textContent = useValue ? Translate('best_value') : Translate('best_subject');
  if (!best) { nameEl.textContent = '–'; statEl.textContent = '–'; return; }
  nameEl.textContent = best.subj;
  nameEl.style.color = ColorForPercent(best.CalcPercent);
  statEl.textContent = (useValue && best.hours)
    ? `${FormatPercent(best.CalcPercent)}% × ${best.hours}u`
    : `${FormatPercent(best.CalcPercent)}%`;
}

function ExportCustomLang() {
  const data = { ...S.customLang };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gradeflow-lang-custom.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BuildIconRulesEditor() {
  const rules = GetIconRules();
  const rows = rules.map((r, i) => `
    <div class="gf-icon-rule" data-icon-idx="${i}">
      <input class="gf-icon-keys-input" type="text" value="${(r.keys || '').replace(/"/g, '&quot;')}" placeholder="${Translate('icon_keywords')}" />
      <input class="gf-icon-emoji-input" type="text" value="${r.icon || ''}" style="width:42px;text-align:center;font-size:16px;" />
      <button class="gf-icon-del-btn" data-icon-idx="${i}" title="×">×</button>
    </div>
  `).join('');
  return `<div id="gf-icon-rules-editor">
    <div class="gf-icon-rules-body">${rows}</div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="gf-action-btn" id="gf-icon-add-btn" style="margin:0;width:auto;padding:4px 10px;display:inline-flex;">${Translate('icon_add')}</button>
      <button class="gf-action-btn gf-danger-btn" id="gf-icon-reset-btn" style="margin:0;width:auto;padding:4px 10px;display:inline-flex;">${Translate('icon_reset')}</button>
    </div>
  </div>`;
}

function BindIconRulesEditor(body) {
  let _iconSaveTimer = null;
  function SaveFromInputs() {
    clearTimeout(_iconSaveTimer);
    _iconSaveTimer = setTimeout(() => {
      const rows = body.querySelectorAll('.gf-icon-rule');
      const rules = [...rows].map(row => ({
        keys: row.querySelector('.gf-icon-keys-input')?.value || '',
        icon: row.querySelector('.gf-icon-emoji-input')?.value || '📘',
      })).filter(r => r.keys.trim());
      SaveIconRules(rules);
      Render();
    }, 400);
  }
  body.querySelectorAll('.gf-icon-keys-input, .gf-icon-emoji-input').forEach(inp => {
    inp.addEventListener('input', SaveFromInputs);
  });
  body.querySelectorAll('.gf-icon-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rules = [...GetIconRules()];
      rules.splice(parseInt(btn.dataset.iconIdx, 10), 1);
      SaveIconRules(rules);
      Render(); RenderSettings();
    });
  });
  body.querySelector('#gf-icon-add-btn')?.addEventListener('click', () => {
    const rules = [...GetIconRules(), { keys: '', icon: '📘' }];
    SaveIconRules(rules);
    RenderSettings();
    setTimeout(() => {
      const inputs = body.querySelectorAll('.gf-icon-keys-input');
      inputs[inputs.length - 1]?.focus();
    }, 50);
  });
  body.querySelector('#gf-icon-reset-btn')?.addEventListener('click', () => {
    S.iconRules = null;
    try { localStorage.removeItem('gradeflow-icon-rules-v1'); } catch (_) {}
    SaveSubjectIcons({});
    Render(); RenderSettings();
  });
}

function ImportCustomLang() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object') throw new Error('bad format');
        const filtered = {};
        for (const key of GF_TRANSLATION_KEYS) {
          if (typeof data[key] === 'string' && data[key]) filtered[key] = data[key];
        }
        SaveCustomLang(filtered);
        SaveLangPref('custom');
        Render(); RenderSettings();
      } catch (_) {
        alert('Invalid language file.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// Settings modal
function OpenSettings() {
  const overlay = document.getElementById('gf-settings-overlay');
  if (!overlay) return;
  RenderSettings();
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('gf-settings-btn')?.classList.add('is-open');
}
function CloseSettings() {
  document.getElementById('gf-settings-overlay')?.classList.remove('is-open');
  document.getElementById('gf-settings-overlay')?.setAttribute('aria-hidden', 'true');
  document.getElementById('gf-settings-btn')?.classList.remove('is-open');
}

// Help modal
const GF_GITHUB_URL = 'https://github.com/ForceWarrior/Smartschool-GradeFlow';
const GF_CWS_URL    = 'https://chromewebstore.google.com/detail/gradeflow/mhcppcdlhnopfnkicmdmjakibpkbilkm';

function OpenHelp() {
  const overlay = document.getElementById('gf-help-overlay');
  if (!overlay) return;
  RenderHelp();
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('gf-help-btn')?.classList.add('is-open');
}
function CloseHelp() {
  document.getElementById('gf-help-overlay')?.classList.remove('is-open');
  document.getElementById('gf-help-overlay')?.setAttribute('aria-hidden', 'true');
  document.getElementById('gf-help-btn')?.classList.remove('is-open');
}
function RenderHelp() {
  const body = document.getElementById('gf-help-body');
  if (!body) return;
  const titleEl = document.getElementById('gf-help-title');
  if (titleEl) titleEl.textContent = Translate('help_title');

  body.innerHTML = `
    <div class="gf-help-section">
      <p class="gf-help-text">${Translate('help_intro')}</p>
    </div>
    <div class="gf-help-section">
      <div class="gf-help-section-title">${Translate('help_features_title')}</div>
      <ul class="gf-help-list">
        <li>${Translate('help_feature_grades')}</li>
        <li>${Translate('help_feature_weighting')}</li>
        <li>${Translate('help_feature_theme')}</li>
        <li>${Translate('help_feature_lang')}</li>
        <li>${Translate('help_feature_icons')}</li>
        <li>${Translate('help_feature_personalization')}</li>
        <li>${Translate('help_feature_arcade')}</li>
        <li>${Translate('help_feature_chat')}</li>
      </ul>
    </div>
    <div class="gf-help-section">
      <div class="gf-help-section-title">${Translate('help_shortcuts_title')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_f6')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_f7')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_f8')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_esc')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_p')}</div>
      <div class="gf-help-shortcut">${Translate('help_shortcut_r')}</div>
    </div>
    <div class="gf-help-section">
      <div class="gf-help-links">
        <a class="gf-help-link" href="${GF_GITHUB_URL}" target="_blank" rel="noopener noreferrer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.3 2.8.2 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>
          ${Translate('help_github')}
        </a>
        <a class="gf-help-link" href="${GF_CWS_URL}" target="_blank" rel="noopener noreferrer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${Translate('help_cws_review')}
        </a>
      </div>
    </div>`;
}

let _langSaveTimer = null;

function RenderSettings() {
  const body = document.getElementById('gf-settings-body');
  if (!body) return;
  const titleEl = document.getElementById('gf-settings-title');
  if (titleEl) titleEl.textContent = Translate('settings');

  const autoLabel = GF_LANGS[ResolveLangCode()]._name;
  const decAuto   = !S.decimalSep || S.decimalSep === 'auto';

  body.innerHTML = `
    <!-- Theme -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('theme')}</div>
      <div class="gf-sett-toggle-row">
        <button class="gf-sett-opt${S.theme === 'dark'  ? ' active' : ''}" data-sett-action="theme" data-sett-val="dark">${Translate('dark')}</button>
        <button class="gf-sett-opt${S.theme === 'light' ? ' active' : ''}" data-sett-action="theme" data-sett-val="light">${Translate('light')}</button>
      </div>
    </div>

    <!-- Language -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('language')}</div>
      <select class="gf-sett-select" id="gf-sett-lang-select">
        <option value="auto" ${S.lang === 'auto' ? 'selected' : ''}>Auto (${autoLabel})</option>
        ${Object.values(GF_LANGS).map(l => `<option value="${l._code}" ${S.lang === l._code ? 'selected' : ''}>${l._name}</option>`).join('')}
        <option value="custom" ${S.lang === 'custom' ? 'selected' : ''}>${Translate('custom_lang')}</option>
      </select>
      ${S.lang === 'custom' ? BuildCustomLangEditor() : ''}
    </div>

    <!-- Decimal separator -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('decimal_sep')}</div>
      <div class="gf-sett-toggle-row" style="grid-template-columns:1fr 1fr 1fr;">
        <button class="gf-sett-opt${decAuto ? ' active' : ''}" data-sett-action="decimal" data-sett-val="auto">${Translate('decimal_auto')}</button>
        <button class="gf-sett-opt${!decAuto && S.decimalSep === ',' ? ' active' : ''}" data-sett-action="decimal" data-sett-val=",">${Translate('decimal_comma')}</button>
        <button class="gf-sett-opt${!decAuto && S.decimalSep === '.' ? ' active' : ''}" data-sett-action="decimal" data-sett-val=".">${Translate('decimal_point')}</button>
      </div>
    </div>

    <!-- Grade decimal places -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('grade_dec')}</div>
      <div class="gf-sett-toggle-row" style="grid-template-columns:repeat(4,1fr);">
        <button class="gf-sett-opt${S.gradeDecimals === 'auto' ? ' active' : ''}" data-sett-action="gradeDecimals" data-sett-val="auto">${Translate('grade_dec_auto')}</button>
        <button class="gf-sett-opt${S.gradeDecimals === '0' ? ' active' : ''}" data-sett-action="gradeDecimals" data-sett-val="0">0</button>
        <button class="gf-sett-opt${S.gradeDecimals === '1' ? ' active' : ''}" data-sett-action="gradeDecimals" data-sett-val="1">1</button>
        <button class="gf-sett-opt${S.gradeDecimals === '2' ? ' active' : ''}" data-sett-action="gradeDecimals" data-sett-val="2">2</button>
      </div>
      <div class="gf-mode-desc" style="margin-top:6px;">${Translate('grade_dec_desc')}</div>
    </div>

    <!-- Base weighting method -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('base_method')}</div>
      <div class="gf-sett-toggle-row">
        <button class="gf-sett-opt${S.weightMode === 'points' ? ' active' : ''}" data-sett-action="weightMode" data-sett-val="points">${Translate('points')}</button>
        <button class="gf-sett-opt${S.weightMode === 'hours'  ? ' active' : ''}" data-sett-action="weightMode" data-sett-val="hours">${Translate('hour_weighted')}</button>
      </div>
      ${S.weightMode === 'hours' && !HasManualHours()
        ? `<div class="gf-mode-desc" style="margin-top:6px;color:var(--yellow);">${Translate('mode_desc_hours_unset')}</div>`
        : ''}
    </div>

    <!-- Formula overlay -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('formula_overlay')}</div>
      <div class="gf-sett-toggle-row">
        <button class="gf-sett-opt${!S.useFormula ? ' active' : ''}" data-sett-action="useFormula" data-sett-val="0">${Translate('formula_off')}</button>
        <button class="gf-sett-opt${ S.useFormula ? ' active' : ''}" data-sett-action="useFormula" data-sett-val="1">${Translate('formula_on')}</button>
      </div>
      <div class="gf-mode-desc" style="margin-top:6px;">${GetModeLabel()}</div>
    </div>

    <!-- Subject icons -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('subject_icons')}</div>
      <div class="gf-mode-desc" style="margin-bottom:6px;">${Translate('icon_desc')}</div>
      ${BuildIconRulesEditor()}
    </div>

    <!-- Best subject mode -->
    <div class="gf-sett-section">
      <div class="gf-sett-label">${Translate('best_subject_mode')}</div>
      <div class="gf-sett-toggle-row">
        <button class="gf-sett-opt${S.bestSubjectMode === 'grade' ? ' active' : ''}"
          data-sett-action="bestMode" data-sett-val="grade"
          title="${Translate('best_mode_grade_title')}">${Translate('highest_grade')}</button>
        <button class="gf-sett-opt${S.bestSubjectMode === 'value' ? ' active' : ''}"
          data-sett-action="bestMode" data-sett-val="value"
          title="${Translate('best_mode_value_title')}">${Translate('hour_value')}</button>
      </div>
      ${S.bestSubjectMode === 'value' && !HasManualHours()
        ? `<div class="gf-mode-desc" style="margin-top:8px;color:var(--yellow);">${Translate('warn_hours_needed')}</div>`
        : ''}
    </div>
  `;

  body.querySelectorAll('[data-sett-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.settAction, val = btn.dataset.settVal;
      if (action === 'theme') {
        chrome.storage.local.set({ 'gradeflow-theme': val });
        S.theme = val; RenderSettings();
      } else if (action === 'weightMode') {
        SaveWeightMode(val);
        S.hoursOpen = val === 'hours';
        RenderSettings(); Render();
      } else if (action === 'useFormula') {
        SaveUseFormula(val === '1');
        S.formulaOpen = val === '1';
        RenderSettings(); Render();
      } else if (action === 'bestMode') {
        S.bestSubjectMode = val; RenderSettings();
        RenderBestSubjectWidget(GetBestSubject(S.store ? GetPeriodData(S.store, S.activePeriod) : {}));
      } else if (action === 'decimal') {
        SaveDecimalSep(val); RenderSettings(); Render();
      } else if (action === 'gradeDecimals') {
        SaveGradeDecimals(val); RenderSettings(); Render();
      }
    });
  });

  body.querySelector('#gf-sett-lang-select')?.addEventListener('change', function () {
    SaveLangPref(this.value); Render(); RenderSettings();
  });

  BindCustomLangEditor(body);
  BindIconRulesEditor(body);
}

function BuildCustomLangEditor() {
  const baseCode = ResolveLangCode(), base = GF_LANGS[baseCode];
  const rows = GF_TRANSLATION_KEYS.map(key => {
    const bv = base[key] ?? '', cv = S.customLang[key] ?? '';
    const escaped = (cv || bv).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const ph = bv.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<div class="gf-lang-row${cv && cv !== bv ? ' is-modified' : ''}">
      <span class="gf-lang-key" title="${key}">${key}</span>
      <input class="gf-lang-input" type="text" data-lang-key="${key}" value="${escaped}" placeholder="${ph}" />
    </div>`;
  }).join('');
  return `<div id="gf-lang-editor">
    <div class="gf-lang-editor-header">
      <span>${Translate('custom_editor_based_on')}: <strong style="color:var(--text-1);">${GF_LANGS[baseCode]._name}</strong></span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="gf-action-btn" id="gf-lang-import-btn" style="margin:0;width:auto;padding:4px 10px;display:inline-flex;">${Translate('import_lang')}</button>
        <button class="gf-action-btn" id="gf-lang-export-btn" style="margin:0;width:auto;padding:4px 10px;display:inline-flex;">${Translate('export_lang')}</button>
        <button class="gf-action-btn gf-danger-btn" id="gf-lang-reset-btn" style="margin:0;width:auto;padding:4px 10px;display:inline-flex;">${Translate('custom_editor_reset')}</button>
      </div>
    </div>
    <div class="gf-lang-editor-body">${rows}</div>
  </div>`;
}

function BindCustomLangEditor(body) {
  body.querySelector('#gf-lang-reset-btn')?.addEventListener('click', () => { SaveCustomLang({}); Render(); RenderSettings(); });
  body.querySelector('#gf-lang-export-btn')?.addEventListener('click', ExportCustomLang);
  body.querySelector('#gf-lang-import-btn')?.addEventListener('click', ImportCustomLang);
  body.querySelectorAll('.gf-lang-input').forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(_langSaveTimer);
      _langSaveTimer = setTimeout(() => {
        const next = { ...S.customLang }, key = input.dataset.langKey;
        const baseVal = GF_LANGS[ResolveLangCode()]?.[key] ?? '';
        if (!input.value || input.value === baseVal) delete next[key];
        else next[key] = input.value;
        SaveCustomLang(next);
        input.closest('.gf-lang-row')?.classList.toggle('is-modified', !!next[key]);
        UpdateTopbar(); UpdateBottomBar();
        const rl = document.getElementById('gf-refresh-label'); if (rl) rl.textContent = Translate('reload');
        const sb = document.getElementById('gf-scroll-recent-btn'); if (sb) sb.textContent = Translate('go_recent');
      }, 280);
    });
  });
}

// Main views
const GF_VIEW_DEFS = [
  { id: 'overview', icon: '▦', labelKey: 'view_overview' },
  { id: 'trends', icon: '↗', labelKey: 'view_trends' },
  { id: 'planner', icon: '□', labelKey: 'view_planner' },
  { id: 'comparison', icon: '♟', labelKey: 'view_comparison' },
  { id: 'attendance', icon: '!', labelKey: 'view_attendance' },
  { id: 'decision', icon: '◇', labelKey: 'view_decision' },
  { id: 'export', icon: '↓', labelKey: 'view_export' },
];

function RenderTabs() {
  const bar = document.getElementById('gf-view-tabs');
  if (!bar) return;
  bar.innerHTML = GF_VIEW_DEFS.map(v => `
    <button class="gf-view-tab${S.activeView === v.id ? ' active' : ''}" data-gf-view="${v.id}" role="tab" aria-selected="${S.activeView === v.id ? 'true' : 'false'}">
      <span>${v.icon}</span><span>${Translate(v.labelKey)}</span>
    </button>`).join('');
  bar.querySelectorAll('[data-gf-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      SaveActiveView(btn.dataset.gfView);
      RenderTabs();
      RenderMainContent(false);
      UpdateTopbar();
      UpdateBottomBar();
      if (S.activeView === 'attendance') RequestAttendanceRefresh();
      if (typeof _GfApplyPressToAll === 'function') _GfApplyPressToAll(bar);
    });
  });
}

let _gfAttendanceRequestAt = 0;
function RequestAttendanceRefresh() {
  const now = Date.now();
  if (now - _gfAttendanceRequestAt < 2500) return;
  _gfAttendanceRequestAt = now;
  try { window.parent.postMessage({ type: 'gf-refresh-attendance' }, '*'); } catch (_) {}
}

function RenderMainContent(animated = true) {
  if (S.activeView === 'trends') return RenderTrendsView();
  if (S.activeView === 'planner') return RenderPlannerView();
  if (S.activeView === 'comparison') return RenderComparisonView();
  if (S.activeView === 'attendance') return RenderAttendanceView();
  if (S.activeView === 'decision') return RenderDecisionView();
  if (S.activeView === 'export') return RenderExportView();
  return RenderTable(animated);
}

function BuildTrendPoints(subject, scores) {
  let scored = 0, max = 0;
  return SortScoresChronologically(scores || [])
    .filter(score => !score?._whatIf && score.max > 0 && !IsGradeExcluded(GetScorePeriod(score, S.activePeriod), subject, score))
    .map(score => ApplyScoreModel(subject, score, S.activePeriod))
    .map(score => {
      scored += score.scored;
      max += score.max;
      return {
        title: score.title || '',
        date: score.date || '',
        pct: max > 0 ? scored / max * 100 : 0,
        singlePct: score.max > 0 ? score.scored / score.max * 100 : 0,
      };
    });
}

function TrendStatus(delta) {
  if (delta >= 3) return 'up';
  if (delta <= -3) return 'down';
  return 'flat';
}

function TrendSvg(points) {
  const width = 260, height = 82, pad = 10;
  if (!points.length) return `<svg class="gf-trend-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
  const coords = points.map((point, i) => {
    const x = points.length === 1 ? width / 2 : pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - Math.max(0, Math.min(100, point.pct)) / 100) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const first = coords[0].split(',');
  const last = coords[coords.length - 1].split(',');
  return `<svg class="gf-trend-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" class="gf-trend-axis"/>
    <line x1="${pad}" y1="${pad + (height - pad * 2) * .3}" x2="${width - pad}" y2="${pad + (height - pad * 2) * .3}" class="gf-trend-target"/>
    <polyline points="${coords.join(' ')}" class="gf-trend-line"/>
    <circle cx="${first[0]}" cy="${first[1]}" r="3" class="gf-trend-dot muted"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="4" class="gf-trend-dot"/>
  </svg>`;
}

function BuildTrendRows(data) {
  return Object.entries(data || {}).map(([subject, payload]) => {
    const points = BuildTrendPoints(subject, payload?.scores || []);
    const first = points[0]?.pct ?? 0;
    const last = points[points.length - 1]?.pct ?? 0;
    const delta = points.length > 1 ? last - first : 0;
    return { subject, points, first, last, delta, status: TrendStatus(delta) };
  }).filter(row => row.points.length).sort((a, b) => a.status === b.status ? a.subject.localeCompare(b.subject, undefined, { sensitivity: 'base' }) : a.delta - b.delta);
}

function RenderTrendsView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const rows = BuildTrendRows(data);
  const slipping = rows.filter(row => row.status === 'down').length;
  const improving = rows.filter(row => row.status === 'up').length;
  const stable = rows.filter(row => row.status === 'flat').length;
  const body = rows.length ? rows.map(row => {
    const latest = row.points[row.points.length - 1];
    return `<section class="gf-trend-card is-${row.status}">
      <div class="gf-trend-head">
        <div class="gf-trend-name">${SubjectIconHtml(row.subject)}${Esc(row.subject)}</div>
        <div class="gf-trend-latest" style="color:${ColorForPercent(row.last)}">${FormatPercent(row.last)}%</div>
      </div>
      ${TrendSvg(row.points)}
      <div class="gf-trend-foot">
        <span>${Translate(`trend_${row.status}`)}</span>
        <span>${row.delta >= 0 ? '+' : ''}${FormatPercent(row.delta)} ${Translate('trend_points')}</span>
        <span>${Esc(latest.date || latest.title || '')}</span>
      </div>
    </section>`;
  }).join('') : `<section class="gf-tool-panel"><div id="gf-state"><span>${Translate('trend_empty')}</span></div></section>`;
  wrap.innerHTML = `<div class="gf-tool-view">
    <div class="gf-tool-head"><div><div class="gf-tool-title">${Translate('trends_title')}</div><div class="gf-tool-sub">${Translate('trends_desc')}</div></div></div>
    <div class="gf-trend-summary">
      <div class="gf-trend-stat is-up"><b>${improving}</b><span>${Translate('trend_up')}</span></div>
      <div class="gf-trend-stat is-flat"><b>${stable}</b><span>${Translate('trend_flat')}</span></div>
      <div class="gf-trend-stat is-down"><b>${slipping}</b><span>${Translate('trend_down')}</span></div>
    </div>
    <div class="gf-trend-grid">${body}</div>
  </div>`;
}

function PlannerItemTime(item) {
  const t = ParseLocalDateToTime(item?.dueDate);
  if (!t) return Number.MAX_SAFE_INTEGER;
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function MatchPlannerRisk(item, riskRows) {
  const hay = `${item.subject || ''} ${item.title || ''}`.toLowerCase();
  return riskRows.find(row => hay.includes(row.subject.toLowerCase())) || null;
}

function RenderPlannerView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const riskRows = BuildRiskRows(data);
  const now = Date.now();
  const items = [...(S.plannerItems || [])].sort((a, b) => PlannerItemTime(a) - PlannerItemTime(b));
  const upcoming = items.filter(item => PlannerItemTime(item) >= now || !item.dueDate).slice(0, 40);
  const overdue = items.filter(item => PlannerItemTime(item) < now).slice(0, 12);
  const subjects = Object.keys(data).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
  const selectedMonth = S.studyMonth || CurrentMonthValue();
  const defaultStart = new Date(Date.now() + 60 * 60 * 1000);
  defaultStart.setMinutes(0, 0, 0);
  const subjectOptions = [`<option value="">${Translate('planner_unknown_subject')}</option>`, ...subjects.map(subject => `<option value="${Esc(subject)}">${Esc(subject)}</option>`)].join('');
  const studySessions = [...(S.studySessions || [])]
    .filter(session => StudySessionMonth(session.startAt) === selectedMonth)
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
  const studyRows = studySessions.length ? studySessions.map(session => {
    const isPast = new Date(session.startAt).getTime() < Date.now();
    return `<div class="gf-study-row${isPast ? ' is-past' : ''}">
      <div class="gf-study-time">${Esc(StudySessionDisplay(session.startAt))}</div>
      <div class="gf-planner-main"><div class="gf-planner-title">${Esc(session.subject || Translate('planner_unknown_subject'))}</div><div class="gf-planner-meta">${Esc(session.topic || Translate('study_general'))} · ${FormatNumber(session.durationMin)} ${Translate('study_minutes')}${session.notifiedAt ? ` · ${Translate('study_notified')}` : ''}</div></div>
      <button class="gf-tool-btn" data-study-delete="${Esc(session.id)}">${Translate('study_delete')}</button>
    </div>`;
  }).join('') : `<div id="gf-state"><span>${Translate('study_empty')}</span></div>`;
  const rows = upcoming.length ? upcoming.map(item => {
    const risk = MatchPlannerRisk(item, riskRows);
    const riskClass = risk?.status || 'flat';
    const subject = item.subject || risk?.subject || Translate('planner_unknown_subject');
    return `<div class="gf-planner-row is-${riskClass}">
      <div class="gf-planner-date">${Esc(item.dueDate || Translate('planner_no_date'))}</div>
      <div class="gf-planner-main"><div class="gf-planner-title">${Esc(item.title || Translate('planner_untitled'))}</div><div class="gf-planner-meta">${Esc(subject)}${item.type ? ` · ${Esc(item.type)}` : ''}${risk ? ` · ${Translate(`risk_${risk.status === 'watch' ? 'watchlist' : risk.status}`)}` : ''}</div></div>
      ${item.url ? `<a class="gf-tool-btn" href="${Esc(item.url)}" target="_blank" rel="noopener">${Translate('planner_open')}</a>` : ''}
    </div>`;
  }).join('') : `<div id="gf-state"><span>${Translate('planner_empty')}</span></div>`;
  const overdueHtml = overdue.length ? `<section class="gf-tool-panel"><div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('planner_overdue')}</div></div></div><div class="gf-planner-list">${overdue.map(item => `<div class="gf-planner-row is-critical"><div class="gf-planner-date">${Esc(item.dueDate)}</div><div class="gf-planner-main"><div class="gf-planner-title">${Esc(item.title || Translate('planner_untitled'))}</div><div class="gf-planner-meta">${Esc(item.subject || Translate('planner_unknown_subject'))}</div></div></div>`).join('')}</div></section>` : '';
  wrap.innerHTML = `<div class="gf-tool-view">
    <div class="gf-tool-head"><div><div class="gf-tool-title">${Translate('planner_title')}</div><div class="gf-tool-sub">${Translate('planner_desc')}</div></div><div class="gf-tool-actions"><button class="gf-tool-btn" id="gf-planner-refresh">${Translate('planner_refresh')}</button></div></div>
    <section class="gf-tool-panel">
      <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('study_title')}</div><div class="gf-tool-panel-sub">${Translate('study_desc')}</div></div><label class="gf-tool-btn" style="cursor:default;">${Translate('study_month')}<input id="gf-study-month" type="month" value="${Esc(selectedMonth)}" style="width:118px;margin-left:4px;"></label></div>
      <div class="gf-study-form">
        <select id="gf-study-subject" class="gf-study-input">${subjectOptions}</select>
        <input id="gf-study-topic" class="gf-study-input" type="text" maxlength="80" placeholder="${Translate('study_topic')}">
        <input id="gf-study-start" class="gf-study-input" type="datetime-local" value="${Esc(StudySessionInputValue(defaultStart.toISOString()))}">
        <label class="gf-study-duration"><span>${Translate('study_duration')}</span><input id="gf-study-duration" class="gf-study-input" type="number" min="5" step="5" value="45"></label>
        <button class="gf-tool-btn active" id="gf-study-add">${Translate('study_add')}</button>
      </div>
      <div class="gf-study-list">${studyRows}</div>
    </section>
    ${overdueHtml}
    <section class="gf-tool-panel"><div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('planner_upcoming')}</div><div class="gf-tool-panel-sub">${Translate('planner_hint')}</div></div><span class="gf-planner-count">${items.length}</span></div><div class="gf-planner-list">${rows}</div></section>
  </div>`;
  wrap.querySelector('#gf-planner-refresh')?.addEventListener('click', () => {
    window.parent.postMessage({ type: 'gf-refresh-planner' }, '*');
    ShowToast(Translate('planner_refreshing'), '', 'info');
  });
  wrap.querySelector('#gf-study-month')?.addEventListener('change', event => { S.studyMonth = event.target.value || CurrentMonthValue(); RenderPlannerView(); });
  wrap.querySelector('#gf-study-add')?.addEventListener('click', () => AddStudySessionFromForm(wrap));
  wrap.querySelectorAll('[data-study-delete]').forEach(btn => btn.addEventListener('click', () => DeleteStudySession(btn.dataset.studyDelete || '')));
}

function ClassComparisonRows() {
  const ownPayload = BuildClassComparisonPayload();
  const own = NormalizeClassPeer(ownPayload) || { id: 'self', name: Translate('comparison_you'), subjects: {} };
  own.id = 'self';
  own.isSelf = true;
  own.name = ClassComparisonName();
  return [own, ...NormalizeClassPeers(S.classPeers || [])];
}

function RenderComparisonView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const code = BuildClassComparisonCode();
  const rows = ClassComparisonRows();
  const subjects = [...new Set(rows.flatMap(row => Object.keys(row.subjects || {})))]
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
  const leaders = {};
  for (const subject of subjects) {
    leaders[subject] = Math.max(...rows.map(row => {
      const score = row.subjects?.[subject];
      return score?.m > 0 ? score.o / score.m * 100 : -1;
    }));
  }
  const totalLeader = Math.max(...rows.map(row => ClassComparisonOverall(row.subjects || {})), 0);
  const peers = NormalizeClassPeers(S.classPeers || []);
  const shareName = ClassComparisonName();
  const realFirstName = FirstNameOnly(ClassComparisonRawName()) || Translate('comparison_you');
  const peerChips = peers.length ? peers.map(peer => `
    <button class="gf-compare-chip" data-compare-delete="${Esc(peer.id)}" title="${Translate('comparison_remove')}">
      <span>${Esc(peer.name)}</span><b>x</b>
    </button>`).join('') : `<span class="gf-compare-empty-chip">${Translate('comparison_no_peers')}</span>`;
  const headerCells = subjects.map(subject => `<th title="${Esc(subject)}">${Esc(subject)}</th>`).join('');
  const leftRows = rows.map(row => {
    const avatar = row.picture
      ? `<img src="${Esc(row.picture)}" alt="">`
      : `<span>${Esc((row.name || '?').slice(0, 1).toUpperCase())}</span>`;
    const meta = row.isSelf ? Translate('comparison_you_badge') : `${Translate('comparison_added')} ${new Date(row.ts || Date.now()).toLocaleDateString()}`;
    return `<tr class="${row.isSelf ? 'is-self' : ''}">
      <td class="gf-compare-person">
        <div class="gf-compare-avatar">${avatar}</div>
        <div class="gf-compare-person-main"><strong>${Esc(row.name)}</strong><span>${Esc(meta)}</span></div>
      </td>
    </tr>`;
  }).join('');
  const scoreRows = rows.map(row => {
    const totalPct = ClassComparisonOverall(row.subjects || {});
    const totalBest = rows.length > 1 && Math.abs(totalPct - totalLeader) < 0.05;
    const cells = subjects.map(subject => {
      const score = row.subjects?.[subject];
      if (!score) return `<td class="gf-compare-score-cell is-empty"><span>-</span></td>`;
      const pct = score.m > 0 ? score.o / score.m * 100 : 0;
      const best = rows.length > 1 && Math.abs(pct - leaders[subject]) < 0.05;
      return `<td class="gf-compare-score-cell${best ? ' is-best' : ''}" style="--cmp-color:${ColorForPercent(pct)};">
        <div class="gf-compare-pct-line">${best ? '<span class="gf-compare-crown">♛</span>' : ''}<b>${FormatPercent(pct)}%</b></div>
        <span>${FormatNumber(score.o)}/${FormatNumber(score.m)}</span>
      </td>`;
    }).join('');
    return `<tr class="${row.isSelf ? 'is-self' : ''}">
      ${cells}
      <td class="gf-compare-total-cell${totalBest ? ' is-best' : ''}" style="--cmp-color:${ColorForPercent(totalPct)};">
        <div class="gf-compare-pct-line">${totalBest ? '<span class="gf-compare-crown">♛</span>' : ''}<b>${FormatPercent(totalPct)}%</b></div>
      </td>
    </tr>`;
  }).join('');
  const table = subjects.length ? `<div class="gf-compare-grid">
    <table class="gf-compare-left-table"><thead><tr><th>${Translate('comparison_student')}</th></tr></thead><tbody>${leftRows}</tbody></table>
    <div class="gf-compare-scroller gf-hscroll">
      <table class="gf-compare-table">
        <thead><tr>${headerCells}<th>${Translate('total')}</th></tr></thead>
        <tbody>${scoreRows}</tbody>
      </table>
    </div>
  </div>` : `<div id="gf-state"><span>${Translate('comparison_no_subjects')}</span></div>`;

  wrap.innerHTML = `<div class="gf-tool-view gf-compare-view">
    <div class="gf-tool-head"><div><div class="gf-tool-title">${Translate('comparison_title')}</div><div class="gf-tool-sub">${Translate('comparison_desc')}</div></div></div>
    <div class="gf-compare-actions">
      <section class="gf-tool-panel">
        <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('comparison_share_title')}</div><div class="gf-tool-panel-sub">${Translate('comparison_share_desc')}</div></div></div>
        <div class="gf-compare-box">
          <div class="gf-compare-privacy-row">
            <label class="gf-compare-check"><input id="gf-compare-share-real" type="checkbox" ${S.classShareRealName ? 'checked' : ''}> <span>${Translate('comparison_share_name')}</span></label>
            <input id="gf-compare-alias" type="text" maxlength="80" value="${Esc(S.classShareAlias || '')}" placeholder="${S.classShareRealName ? Esc(realFirstName) : Translate('comparison_alias_placeholder')}">
          </div>
          <div class="gf-compare-share-note" id="gf-compare-share-note">${Translate('comparison_share_note').replace('{name}', Esc(shareName))}</div>
          <textarea id="gf-compare-code" readonly spellcheck="false">${Esc(code)}</textarea>
          <div class="gf-compare-btns"><button class="gf-tool-btn active" id="gf-compare-copy">${Translate('comparison_copy')}</button></div>
        </div>
      </section>
      <section class="gf-tool-panel">
        <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('comparison_add_title')}</div><div class="gf-tool-panel-sub">${Translate('comparison_add_desc')}</div></div></div>
        <div class="gf-compare-box">
          <textarea id="gf-compare-input" spellcheck="false" placeholder="${Translate('comparison_placeholder')}"></textarea>
          <button class="gf-tool-btn active" id="gf-compare-add">${Translate('comparison_add')}</button>
        </div>
      </section>
    </div>
    <section class="gf-tool-panel">
      <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('comparison_table_title')}</div><div class="gf-tool-panel-sub">${Translate('comparison_table_desc')}</div></div><div class="gf-compare-chips">${peerChips}</div></div>
      ${table}
    </section>
  </div>`;

  BindComparisonEvents(wrap);
}

function BindComparisonEvents(root) {
  const codeArea = root.querySelector('#gf-compare-code');
  const aliasInput = root.querySelector('#gf-compare-alias');
  const shareNameInput = root.querySelector('#gf-compare-share-real');
  const shareNote = root.querySelector('#gf-compare-share-note');
  const refreshShareCode = () => {
    SaveClassComparisonAlias(aliasInput?.value || '');
    SaveClassComparisonShareName(!!shareNameInput?.checked);
    if (codeArea) codeArea.value = BuildClassComparisonCode();
    if (shareNote) shareNote.textContent = Translate('comparison_share_note').replace('{name}', ClassComparisonName());
  };
  aliasInput?.addEventListener('input', refreshShareCode);
  shareNameInput?.addEventListener('change', () => RenderComparisonView());
  root.querySelector('#gf-compare-copy')?.addEventListener('click', async () => {
    try {
      refreshShareCode();
      await CopyText(BuildClassComparisonCode());
      ShowToast(Translate('comparison_copied'), '', 'ok');
    } catch (_) { ShowToast(Translate('comparison_copy_failed'), '', 'warn'); }
  });
  root.querySelector('#gf-compare-add')?.addEventListener('click', () => {
    const input = root.querySelector('#gf-compare-input');
    try {
      const incoming = DecodeClassComparisonCodes(input?.value || '');
      if (!incoming.length) throw new Error('empty');
      const current = NormalizeClassPeers(S.classPeers || []);
      const byId = new Map(current.map(peer => [peer.id, peer]));
      incoming.forEach(peer => byId.set(peer.id, peer));
      SaveClassPeers([...byId.values()]);
      if (input) input.value = '';
      ShowToast(Translate('comparison_added_toast'), `${incoming.length}`, 'ok');
      RenderComparisonView();
    } catch (_) { ShowToast(Translate('comparison_invalid'), '', 'warn'); }
  });
  root.querySelectorAll('[data-compare-delete]').forEach(btn => {
    btn.addEventListener('click', () => DeleteClassPeer(btn.dataset.compareDelete || ''));
  });
}

function AttendanceType(item) {
  const hay = `${item.code || ''} ${item.title || ''} ${item.type || ''}`.toLowerCase();
  if (/te laat|late|retard|\bl\b/.test(hay)) return 'late';
  if (/dokter|afwezig|absent|absence|attest|overmacht|ziek|\bd\b|\br\b|\bz\b/.test(hay)) return 'absent';
  return 'other';
}

function AttendanceTime(item) {
  const t = ParseLocalDateToTime(item?.date);
  return t || 0;
}

function RenderAttendanceView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const items = [...(S.attendanceItems || [])].sort((a, b) => AttendanceTime(b) - AttendanceTime(a));
  const lateCount = items.filter(item => AttendanceType(item) === 'late').length;
  const absentCount = items.filter(item => AttendanceType(item) === 'absent').length;
  const otherCount = Math.max(0, items.length - lateCount - absentCount);
  const rows = items.length ? items.map(item => {
    const type = AttendanceType(item);
    const label = type === 'late' ? Translate('attendance_late') : type === 'absent' ? Translate('attendance_absent') : Translate('attendance_other');
    return `<div class="gf-att-row is-${type}">
      <div class="gf-att-code">${Esc(item.code || label.slice(0, 1))}</div>
      <div class="gf-att-main"><div class="gf-att-title">${Esc(item.title || label)}</div><div class="gf-att-meta">${Esc(item.date || Translate('planner_no_date'))}${item.moment ? ` · ${Esc(item.moment)}` : ''}${item.detail ? ` · ${Esc(item.detail)}` : ''}</div></div>
      <div class="gf-att-type">${Esc(label)}</div>
    </div>`;
  }).join('') : `<div id="gf-state"><span>${Translate('attendance_empty')}</span></div>`;
  wrap.innerHTML = `<div class="gf-tool-view">
    <div class="gf-tool-head"><div><div class="gf-tool-title">${Translate('attendance_title')}</div><div class="gf-tool-sub">${Translate('attendance_desc')}</div></div><div class="gf-tool-actions"><button class="gf-tool-btn" id="gf-attendance-refresh">${Translate('attendance_refresh')}</button></div></div>
    <div class="gf-att-summary">
      <div class="gf-att-stat is-late"><b>${lateCount}</b><span>${Translate('attendance_late')}</span></div>
      <div class="gf-att-stat is-absent"><b>${absentCount}</b><span>${Translate('attendance_absent')}</span></div>
      <div class="gf-att-stat is-other"><b>${otherCount}</b><span>${Translate('attendance_other')}</span></div>
    </div>
    <section class="gf-tool-panel"><div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('attendance_recent')}</div><div class="gf-tool-panel-sub">${Translate('attendance_hint')}</div></div><span class="gf-planner-count">${items.length}</span></div><div class="gf-att-list">${rows}</div></section>
  </div>`;
  wrap.querySelector('#gf-attendance-refresh')?.addEventListener('click', () => {
    RequestAttendanceRefresh();
    ShowToast(Translate('attendance_refreshing'), '', 'info');
  });
}

function BuildRiskRows(data) {
  const nextMax = Math.max(1, parseFloat(S.riskNextMax) || 20);
  const thresholds = NormalizeRiskThresholds(S.riskThresholds);
  return Object.entries(data || {}).map(([subject, payload]) => {
    const scores = EffectiveScores(subject, payload?.scores || [], S.activePeriod);
    const scored = scores.reduce((sum, score) => sum + score.scored, 0);
    const max = scores.reduce((sum, score) => sum + score.max, 0);
    const pct = max > 0 ? scored / max * 100 : 0;
    const status = pct >= thresholds.safe ? 'safe' : pct >= thresholds.watch ? 'watch' : 'critical';
    const target = status === 'critical' ? thresholds.watch : thresholds.safe;
    const required = Math.max(0, (target / 100) * (max + nextMax) - scored);
    return { subject, pct, scored, max, status, target, required, nextMax };
  }).filter(row => row.max > 0).sort((a, b) => a.pct - b.pct);
}

function RenderRiskBucket(rows, status, titleKey) {
  const items = rows.filter(row => row.status === status);
  const headClass = status === 'safe' ? 'is-safe' : status === 'watch' ? 'is-watch' : 'is-critical';
  const body = items.length ? items.map(row => {
    const impossible = row.required > row.nextMax;
    const needText = row.required <= 0
      ? Translate('risk_ok')
      : impossible
        ? Translate('risk_impossible').replace('{required}', FormatNumber(row.required)).replace('{score}', FormatNumber(row.nextMax))
        : `${Translate('risk_needed')} ${FormatNumber(row.required)} / ${FormatNumber(row.nextMax)}`;
    return `<div class="gf-risk-row">
      <div class="gf-risk-name" title="${Esc(row.subject)}">${SubjectIconHtml(row.subject)}${Esc(row.subject)}</div>
      <div class="gf-risk-pct" style="color:${ColorForPercent(row.pct)}">${FormatPercent(row.pct)}%</div>
      <div class="gf-risk-meta">${needText}</div>
    </div>`;
  }).join('') : `<div class="gf-risk-row"><div class="gf-risk-meta">${Translate('no_items')}</div></div>`;
  return `<section class="gf-tool-card">
    <div class="gf-tool-card-head ${headClass}"><span>${Translate(titleKey)}</span><span>${items.length}</span></div>
    <div class="gf-risk-list">${body}</div>
  </section>`;
}

function RenderDecisionView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  if (!S.store || !Object.keys(data).length) {
    wrap.innerHTML = `<div id="gf-state"><span>${Translate('no_grades')}</span></div>`;
    return;
  }

  const riskRows = BuildRiskRows(data);
  const thresholds = NormalizeRiskThresholds(S.riskThresholds);
  const subjects = Object.keys(data).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const whatIfRows = subjects.map(subject => {
    const stored = S.whatIfScores?.[subject] || {};
    const planned = stored.period === S.activePeriod ? stored : {};
    return `<tr>
      <td>${SubjectIconHtml(subject)}${Esc(subject)}</td>
      <td><input type="number" min="0" step="0.1" data-whatif-subject="${encodeURIComponent(subject)}" data-whatif-field="scored" value="${Esc(planned.scored ?? '')}" placeholder="${Translate('score')}"></td>
      <td><input type="number" min="0" step="0.1" data-whatif-subject="${encodeURIComponent(subject)}" data-whatif-field="max" value="${Esc(planned.max ?? '')}" placeholder="max"></td>
    </tr>`;
  }).join('');

  const gradeRows = [];
  for (const [subject, payload] of Object.entries(data)) {
    for (const score of SortScoresChronologically(payload?.scores || [])) {
      const period = GetScorePeriod(score, S.activePeriod);
      const key = GradeKey(period, subject, score);
      const excluded = !!S.excludedGrades?.[key];
      const weight = GetGradeWeight(period, subject, score);
      gradeRows.push(`<tr>
        <td>${Esc(period)}</td>
        <td>${Esc(subject)}</td>
        <td>${Esc(score.title || '')}</td>
        <td>${FormatNumber(score.scored)} / ${FormatNumber(score.max)}</td>
        <td><input type="number" min="0.1" step="0.1" data-grade-weight="${encodeURIComponent(key)}" value="${weight === 1 ? '' : String(weight)}" placeholder="1"></td>
        <td><button class="gf-tool-btn${excluded ? ' active' : ''}" data-grade-toggle="${encodeURIComponent(key)}">${excluded ? Translate('excluded') : Translate('included')}</button></td>
      </tr>`);
    }
  }

  wrap.innerHTML = `<div class="gf-tool-view">
    <div class="gf-tool-head">
      <div>
        <div class="gf-tool-title">${Translate('decision_title')}</div>
        <div class="gf-tool-sub">${Translate('decision_desc')}</div>
      </div>
      <div class="gf-tool-actions">
        <button class="gf-tool-btn${S.whatIfMode ? ' active' : ''}" id="gf-whatif-toggle">${Translate('whatif_mode')}</button>
        <label class="gf-tool-btn" style="cursor:default;">
          ${Translate('whatif_next_max')}
          <input id="gf-risk-nextmax" type="number" min="1" step="1" value="${String(S.riskNextMax)}" style="width:54px;margin-left:4px;">
        </label>
        <label class="gf-tool-btn" style="cursor:default;">
          ${Translate('risk_watch_from')}
          <input id="gf-risk-watch" type="number" min="0" max="99" step="1" value="${String(thresholds.watch)}" style="width:48px;margin-left:4px;">
        </label>
        <label class="gf-tool-btn" style="cursor:default;">
          ${Translate('risk_safe_from')}
          <input id="gf-risk-safe" type="number" min="1" max="100" step="1" value="${String(thresholds.safe)}" style="width:48px;margin-left:4px;">
        </label>
      </div>
    </div>
    <div class="gf-tool-grid">
      ${RenderRiskBucket(riskRows, 'critical', 'risk_critical')}
      ${RenderRiskBucket(riskRows, 'watch', 'risk_watchlist')}
      ${RenderRiskBucket(riskRows, 'safe', 'risk_safe')}
    </div>
    <section class="gf-tool-panel">
      <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('whatif_subject_scores')}</div><div class="gf-tool-panel-sub">${Translate('whatif_desc')}</div></div><button class="gf-tool-btn" id="gf-whatif-clear">${Translate('clear_whatif')}</button></div>
      <table class="gf-tool-table"><thead><tr><th>${Translate('subjects')}</th><th>${Translate('score')}</th><th>Max</th></tr></thead><tbody>${whatIfRows}</tbody></table>
    </section>
    <section class="gf-tool-panel">
      <div class="gf-tool-panel-head"><div><div class="gf-tool-panel-title">${Translate('grade_controls')}</div><div class="gf-tool-panel-sub">${Translate('grade_controls_desc')}</div></div></div>
      <table class="gf-tool-table"><thead><tr><th>${Translate('period')}</th><th>${Translate('subjects')}</th><th>${Translate('results')}</th><th>${Translate('score')}</th><th>${Translate('coeff')}</th><th>${Translate('status')}</th></tr></thead><tbody>${gradeRows.join('') || `<tr><td colspan="6">${Translate('no_items')}</td></tr>`}</tbody></table>
    </section>
  </div>`;

  BindDecisionEvents(wrap);
}

function BindDecisionEvents(root) {
  root.querySelector('#gf-whatif-toggle')?.addEventListener('click', () => { SaveWhatIfMode(!S.whatIfMode); Render(); });
  root.querySelector('#gf-whatif-clear')?.addEventListener('click', () => { SaveWhatIfScores({}); Render(); });
  root.querySelector('#gf-risk-nextmax')?.addEventListener('change', e => { SaveRiskNextMax(e.target.value); RenderMainContent(false); });
  const saveRiskThresholdInputs = () => {
    SaveRiskThresholds({
      watch: root.querySelector('#gf-risk-watch')?.value,
      safe: root.querySelector('#gf-risk-safe')?.value,
    });
    RenderMainContent(false);
    UpdateBottomBar();
  };
  root.querySelector('#gf-risk-watch')?.addEventListener('change', saveRiskThresholdInputs);
  root.querySelector('#gf-risk-safe')?.addEventListener('change', saveRiskThresholdInputs);
  root.querySelectorAll('[data-whatif-subject]').forEach(input => {
    input.addEventListener('change', () => {
      const subject = decodeURIComponent(input.dataset.whatifSubject || '');
      const field = input.dataset.whatifField;
      if (!subject || !field) return;
      const next = { ...(S.whatIfScores || {}) };
      const current = { ...((next[subject]?.period === S.activePeriod ? next[subject] : {})), period: S.activePeriod };
      if (input.value === '') delete current[field]; else current[field] = parseFloat(input.value);
      if (current.scored == null && current.max == null) delete next[subject]; else next[subject] = current;
      SaveWhatIfScores(next);
      RenderMainContent(false);
      UpdateBottomBar();
    });
  });
  root.querySelectorAll('[data-grade-toggle]').forEach(btn => btn.addEventListener('click', () => ToggleGradeExcluded(decodeURIComponent(btn.dataset.gradeToggle || ''))));
  root.querySelectorAll('[data-grade-weight]').forEach(input => input.addEventListener('change', () => SetGradeWeight(decodeURIComponent(input.dataset.gradeWeight || ''), input.value)));
}

function BuildExportRows() {
  const rows = [];
  for (const [period, subjects] of Object.entries(S.store || {})) {
    if (period.startsWith('_')) continue;
    for (const [subject, payload] of Object.entries(subjects || {})) {
      for (const score of (payload?.scores || [])) {
        const key = GradeKey(period, subject, score);
        rows.push({
          period, subject, title: score.title || '', date: score.date || '',
          scored: score.scored, max: score.max,
          percent: score.max > 0 ? score.scored / score.max * 100 : 0,
          excluded: !!S.excludedGrades?.[key], weight: GetGradeWeight(period, subject, score),
        });
      }
    }
  }
  return rows;
}

function GroupExportRowsByPeriod(rows) {
  return rows.reduce((map, row) => {
    if (!map[row.period]) map[row.period] = [];
    map[row.period].push(row);
    return map;
  }, {});
}

function ExportTableRows(rows) {
  return rows.map(row => `<tr class="${row.excluded ? 'is-excluded' : ''}"><td>${Esc(row.period)}</td><td>${Esc(row.subject)}</td><td>${Esc(row.title)}</td><td>${Esc(row.date)}</td><td>${FormatNumber(row.scored)} / ${FormatNumber(row.max)}</td><td>${FormatPercent(row.percent)}%</td><td>${row.excluded ? Translate('excluded') : Translate('included')}</td><td>${FormatNumber(row.weight)}</td></tr>`).join('');
}

function CsvCell(value) {
  const text = String(value ?? '');
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function DownloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function ExportGradesCsv() {
  const header = ['period', 'subject', 'title', 'date', 'scored', 'max', 'percent', 'excluded', 'weight'];
  const rows = BuildExportRows().map(row => [row.period, row.subject, row.title, row.date, row.scored, row.max, FormatPercent(row.percent), row.excluded ? 'yes' : 'no', row.weight]);
  const csv = [header, ...rows].map(row => row.map(CsvCell).join(';')).join('\n');
  DownloadBlob('gradeflow-export.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  ShowToast(Translate('export_done'), Translate('export_csv'), 'ok');
}
function ExportGradesPdf() {
  const rows = BuildExportRows();
  const periodSummaries = (S.periods || []).filter(p => p !== 'Alle').map(period => {
    const data = GetPeriodData(S.store, period);
    return `<tr><td>${Esc(period)}</td><td>${Object.keys(data).length}</td><td>${FormatPercent(OverallPct(data, period))}%</td></tr>`;
  }).join('');
  const grouped = GroupExportRowsByPeriod(rows);
  const allRows = rows.slice().sort((a, b) => String(a.period).localeCompare(String(b.period), undefined, { sensitivity: 'base' }) || String(a.subject).localeCompare(String(b.subject), undefined, { sensitivity: 'base' }) || String(a.date).localeCompare(String(b.date), undefined, { sensitivity: 'base' }));
  const periodPages = Object.entries(grouped).map(([period, periodRows]) => `<section class="page"><div class="page-kicker">GradeFlow</div><h2>${Esc(period)}</h2><table><thead><tr><th>${Translate('subjects')}</th><th>${Translate('results')}</th><th>Date</th><th>${Translate('score')}</th><th>%</th><th>${Translate('status')}</th><th>${Translate('coeff')}</th></tr></thead><tbody>${periodRows.map(row => `<tr class="${row.excluded ? 'is-excluded' : ''}"><td>${Esc(row.subject)}</td><td>${Esc(row.title)}</td><td>${Esc(row.date)}</td><td>${FormatNumber(row.scored)} / ${FormatNumber(row.max)}</td><td>${FormatPercent(row.percent)}%</td><td>${row.excluded ? Translate('excluded') : Translate('included')}</td><td>${FormatNumber(row.weight)}</td></tr>`).join('')}</tbody></table></section>`).join('');
  const printWin = window.open('', '_blank', 'width=900,height=700');
  if (!printWin) { ShowToast(Translate('export_failed'), Translate('export_popup_blocked'), 'warn'); return; }
  printWin.document.write(`<!doctype html><html><head><title>GradeFlow export</title><style>
    *{box-sizing:border-box}body{margin:0;background:#050505;color:#fff;font-family:Inter,Arial,sans-serif}body:before{content:"";position:fixed;inset:0;background:linear-gradient(135deg,rgba(255,133,27,.12),transparent 32%),radial-gradient(circle at top right,rgba(255,255,255,.08),transparent 24%);pointer-events:none}.page{position:relative;min-height:100vh;padding:30px 34px 36px;page-break-after:always;background:#050505}.page:last-child{page-break-after:auto}.cover{display:grid;align-content:center;gap:18px}.brand{font-size:40px;font-weight:900;letter-spacing:0}.brand span,.page-kicker{color:#ff8a1f}.stamp{font-family:Consolas,monospace;color:#b8b8b8;font-size:12px}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.summary-card{border:1px solid #f1f1f1;padding:14px 16px;min-height:74px}.summary-card b{display:block;font-size:22px;color:#fff}.summary-card span{font-family:Consolas,monospace;font-size:11px;color:#bdbdbd;text-transform:uppercase}.page-kicker{font-family:Consolas,monospace;font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:8px}h1,h2{margin:0 0 16px}h1{font-size:34px}h2{font-size:20px}table{width:100%;border-collapse:collapse;font-size:11px;background:#050505}th,td{border:1px solid #e8e8e8;padding:6px 7px;text-align:left;vertical-align:top}th{font-size:10px;color:#fff;text-transform:uppercase;background:#101010}td:nth-child(5),td:nth-child(6),td:nth-child(8),th:nth-child(5),th:nth-child(6),th:nth-child(8){text-align:right;font-family:Consolas,monospace}.is-excluded td{color:#8d8d8d;text-decoration:line-through}.muted{color:#a7a7a7}.all-table{font-size:9px}.all-table th,.all-table td{padding:4px 5px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{min-height:auto;height:auto;padding:18mm 12mm}.summary-grid{break-inside:avoid}table{break-inside:auto}tr{break-inside:avoid;page-break-inside:avoid}}
  </style></head><body><section class="page cover"><div><div class="brand">Grade<span>Flow</span></div><div class="stamp">${Esc(new Date().toLocaleString())}</div></div><div class="summary-grid"><div class="summary-card"><b>${rows.length}</b><span>${Translate('results')}</span></div><div class="summary-card"><b>${(S.periods || []).filter(p => p !== 'Alle').length}</b><span>${Translate('period')}</span></div><div class="summary-card"><b>${rows.filter(row => row.excluded).length}</b><span>${Translate('excluded')}</span></div></div><table><thead><tr><th>${Translate('period')}</th><th>${Translate('subjects')}</th><th>${Translate('total')}</th></tr></thead><tbody>${periodSummaries}</tbody></table></section>${periodPages}<section class="page"><div class="page-kicker">GradeFlow</div><h2>${Translate('all')} ${Translate('results')}</h2><table class="all-table"><thead><tr><th>${Translate('period')}</th><th>${Translate('subjects')}</th><th>${Translate('results')}</th><th>Date</th><th>${Translate('score')}</th><th>%</th><th>${Translate('status')}</th><th>${Translate('coeff')}</th></tr></thead><tbody>${ExportTableRows(allRows)}</tbody></table></section><script>window.onload=()=>setTimeout(()=>window.print(),100);<\/script></body></html>`);
  printWin.document.close();
  ShowToast(Translate('export_done'), Translate('export_pdf'), 'ok');
}
function RenderExportView() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const rowCount = BuildExportRows().length;
  wrap.innerHTML = `<div class="gf-tool-view">
    <div class="gf-tool-head"><div><div class="gf-tool-title">${Translate('export_title')}</div><div class="gf-tool-sub">${Translate('export_desc')}</div></div></div>
    <div class="gf-export-grid">
      <div class="gf-export-card"><strong>${Translate('export_csv')}</strong><span>${Translate('export_csv_desc').replace('{count}', rowCount)}</span><button class="gf-tool-btn" id="gf-export-csv">${Translate('export_csv')}</button></div>
      <div class="gf-export-card"><strong>${Translate('export_pdf')}</strong><span>${Translate('export_pdf_desc')}</span><button class="gf-tool-btn" id="gf-export-pdf">${Translate('export_pdf')}</button></div>
    </div>
  </div>`;
  wrap.querySelector('#gf-export-csv')?.addEventListener('click', ExportGradesCsv);
  wrap.querySelector('#gf-export-pdf')?.addEventListener('click', ExportGradesPdf);
}

// Sidebar
function RenderSidebar() {
  const scroll = document.getElementById('gf-sidebar-scroll');
  if (!scroll) return;

  const data       = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const subjects   = Object.keys(data).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const allPeriods = (S.periods || []).filter(p => p !== 'Alle');

  const periodHTML = S.periods.map((p, i) => {
    const label = p === 'Alle' ? Translate('all') : p;
    return `<button class="gf-period-btn${p === S.activePeriod ? ' active' : ''}" data-period="${p}" style="animation-delay:${i * 18}ms">${label}</button>`;
  }).join('');

  const hoursEditorHTML = S.hoursOpen && S.weightMode === 'hours' ? `
    <div id="gf-hours-section">
      <div class="gf-section-head">${Translate('hours_per_subject')}</div>
      <div class="gf-hours-grid">
        ${subjects.map(subj => `
          <div class="gf-hours-row">
            <span title="${subj}">${subj}</span>
            <input class="gf-hours-input" type="number" min="0" step="1"
              data-subject="${encodeURIComponent(subj)}"
              value="${GetHoursForSubject(subj) || ''}" />
            <span class="gf-hours-unit">u</span>
          </div>`).join('')}
      </div>
      <button class="gf-action-btn gf-danger-btn" id="gf-hours-reset-btn" style="margin-top:8px;">${Translate('reset_hours')}</button>
    </div>` : '';

  let formulaEditorHTML = '';
  if (S.formulaOpen && S.useFormula) {
    const formula = S.formula || [];
    const totalWeightSum = formula.reduce((s, g) => s + (parseFloat(g.totalWeight) || 0), 0);
    const warn = formula.length && Math.abs(totalWeightSum - 100) > 0.5
      ? `<div class="gf-warn-badge">⚠ ${Translate('warn_total')} = ${FormatPercent(totalWeightSum)}% (${Translate('warn_ideal')}: 100%)</div>` : '';

    const groupsHTML = formula.length ? formula.map((group, gi) => {
      const partSum = (group.parts || []).reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);
      const partWarn = (group.parts || []).length > 1 && Math.abs(partSum - 100) > 0.5
        ? `<div class="gf-warn-badge" style="margin-bottom:6px;">${Translate('warn_partweights')} = ${FormatPercent(partSum)}%</div>` : '';
      const partsHTML = (group.parts || []).map((part, pi) => `
        <div class="gf-formula-part-row">
          <select class="gf-formula-part-select" data-gi="${gi}" data-pi="${pi}">
            ${allPeriods.length
              ? allPeriods.map(p => `<option value="${p}" ${p === part.period ? 'selected' : ''}>${p}</option>`).join('')
              : `<option value="${part.period || ''}">${part.period || 'Geen periodes'}</option>`}
          </select>
          <input class="gf-formula-weight" type="number" min="0" step="1" data-gi="${gi}" data-pi="${pi}" value="${part.weight || ''}" placeholder="%" />
          <span class="gf-formula-pct-label">%</span>
          <button class="gf-formula-remove gf-part-remove" data-gi="${gi}" data-pi="${pi}">✕</button>
        </div>`).join('');
      return `<div class="gf-formula-group" data-gi="${gi}" title="${Translate('drag_to_reorder')}">
        <div class="gf-formula-group-header">
          <span class="gf-drag-handle">⠿</span>
          <input class="gf-formula-input gf-group-name" data-gi="${gi}" value="${group.name || ''}" placeholder="${Translate('group_name')}" />
          <input class="gf-formula-weight gf-group-weight" data-gi="${gi}" type="number" min="0" step="1" value="${group.totalWeight || ''}" placeholder="%" />
          <span class="gf-formula-pct-label">%</span>
          <button class="gf-formula-remove gf-group-remove" data-gi="${gi}">✕</button>
        </div>
        <div class="gf-formula-parts">${partWarn}${partsHTML}
          <button class="gf-formula-add-part gf-group-add-part" data-gi="${gi}">${Translate('add_period')}</button>
        </div>
      </div>`;
    }).join('') : `<p style="font-size:11px;color:var(--text-3);line-height:1.7;font-family:var(--mono);padding:0 0 4px;">
      ${Translate('no_groups')} <strong style="color:var(--text-2);">${Translate('no_groups_cta')}</strong> ${Translate('no_groups_suffix')}
    </p>`;

    formulaEditorHTML = `<div id="gf-formula-section">
      <div class="gf-section-head">${Translate('weighting_formula')}</div>
      ${warn}${groupsHTML}
      <button class="gf-action-btn" id="gf-formula-add-group">${Translate('add_group')}</button>
      <button class="gf-action-btn gf-danger-btn" id="gf-formula-reset-btn" style="margin-top:6px;">${Translate('reset_formula')}</button>
    </div>`;
  }

  scroll.innerHTML = `
    <div class="gf-section-head">${Translate('period')}</div>
    ${periodHTML}
    ${S.weightMode === 'hours' ? `
      <div class="gf-divider"></div>
      <button class="gf-action-btn${S.hoursOpen ? ' active' : ''}" id="gf-hours-toggle-btn">
        ${S.hoursOpen ? Translate('hide_hours') : Translate('set_hours')}
      </button>
      ${hoursEditorHTML}` : ''}
    ${S.useFormula ? `
      <div class="gf-divider"></div>
      <button class="gf-action-btn${S.formulaOpen ? ' active' : ''}" id="gf-formula-toggle-btn">
        ${S.formulaOpen ? Translate('hide_formula') : Translate('set_formula')}
      </button>
      ${formulaEditorHTML}` : ''}
  `;

  BindSidebarEvents();
}

function BindSidebarEvents() {
  document.querySelectorAll('.gf-period-btn').forEach(btn =>
    btn.addEventListener('click', () => { S.activePeriod = btn.dataset.period; Render(); }));

  document.getElementById('gf-hours-toggle-btn')?.addEventListener('click', () => { S.hoursOpen = !S.hoursOpen; Render(); });
  document.getElementById('gf-hours-reset-btn')?.addEventListener('click', () => { SaveManualHours({}); Render(); });

  document.querySelectorAll('.gf-hours-input').forEach(input => {
    input.addEventListener('input', () => {
      const subject = decodeURIComponent(input.dataset.subject || '');
      const value = parseFloat(input.value);
      const next = { ...S.manualHours };
      if (!subject) return;
      if (isNaN(value) || value <= 0) delete next[subject]; else next[subject] = value;
      SaveManualHours(next);
      RenderMainContent(false); UpdateTopbar(); UpdateBottomBar();
      requestAnimationFrame(UpdateScrollButton);
    });
  });

  document.getElementById('gf-formula-toggle-btn')?.addEventListener('click', () => { S.formulaOpen = !S.formulaOpen; Render(); });
  document.getElementById('gf-formula-reset-btn')?.addEventListener('click', () => { SaveFormula([]); Render(); });
  document.getElementById('gf-formula-add-group')?.addEventListener('click', () => {
    SaveFormula([...S.formula, { id: NextFormulaId(), name: '', totalWeight: '', parts: [] }]); Render();
  });

  document.querySelectorAll('.gf-group-remove').forEach(btn =>
    btn.addEventListener('click', () => { SaveFormula(S.formula.filter((_, i) => i !== +btn.dataset.gi)); Render(); }));
  document.querySelectorAll('.gf-group-name').forEach(input =>
    input.addEventListener('change', () => { const gi = +input.dataset.gi; SaveFormula(S.formula.map((g, i) => i === gi ? { ...g, name: input.value } : g)); Render(); }));
  document.querySelectorAll('.gf-group-weight').forEach(input =>
    input.addEventListener('change', () => { const gi = +input.dataset.gi; SaveFormula(S.formula.map((g, i) => i === gi ? { ...g, totalWeight: parseFloat(input.value) || '' } : g)); Render(); }));
  document.querySelectorAll('.gf-group-add-part').forEach(btn =>
    btn.addEventListener('click', () => {
      const gi = +btn.dataset.gi, avail = (S.periods || []).filter(p => p !== 'Alle');
      SaveFormula(S.formula.map((g, i) => i === gi ? { ...g, parts: [...(g.parts || []), { period: avail[0] || '', weight: '' }] } : g));
      Render();
    }));
  document.querySelectorAll('.gf-formula-part-select').forEach(select =>
    select.addEventListener('change', () => { const gi = +select.dataset.gi, pi = +select.dataset.pi;
      SaveFormula(S.formula.map((g, i) => i !== gi ? g : { ...g, parts: (g.parts || []).map((p, j) => j === pi ? { ...p, period: select.value } : p) })); Render(); }));
  document.querySelectorAll('.gf-part-remove').forEach(btn =>
    btn.addEventListener('click', () => { const gi = +btn.dataset.gi, pi = +btn.dataset.pi;
      SaveFormula(S.formula.map((g, i) => i !== gi ? g : { ...g, parts: (g.parts || []).filter((_, j) => j !== pi) })); Render(); }));
  document.querySelectorAll('.gf-formula-parts .gf-formula-weight').forEach(input =>
    input.addEventListener('change', () => { const gi = +input.dataset.gi, pi = +input.dataset.pi; if (isNaN(pi)) return;
      SaveFormula(S.formula.map((g, i) => i !== gi ? g : { ...g, parts: (g.parts || []).map((p, j) => j === pi ? { ...p, weight: parseFloat(input.value) || '' } : p) })); Render(); }));

  BindDraggableFormulaGroups();
}

// Table
function RenderTable(animated = true) {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;

  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};

  if (!S.store || !Object.keys(data).length) {
    wrap.innerHTML = `<div id="gf-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--bg-4)">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
      <span>${Translate('no_grades')}</span>
    </div>`;
    return;
  }

  const useFormulaPct      = S.useFormula && S.store && S.activePeriod === 'Alle' && HasFormula();
  const totalWeightedHours = ComputeTotalWeightedHours(data);
  const totalPct           = OverallPct(data);

  const entries = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([subj, { scores }]) => [subj, SortScoresChronologically(scores)]);

  const longest = Math.max(...entries.map(([subj, s]) => s.length + (BuildWhatIfScore(subj) ? 1 : 0)), 0);

  const tipMode = S.useFormula
    ? (S.weightMode === 'hours' ? 'hours+formula' : 'formula')
    : S.weightMode;

  const rows = entries.map(([subj, scores], rowIdx) => {
    const effectiveScores = EffectiveScores(subj, scores, S.activePeriod);
    const rawSubjPct      = CalcPercent(effectiveScores);
    const formulaPctValue = useFormulaPct ? FormulaSubjectPct(subj, S.store) : null;
    const subjPct         = formulaPctValue ?? rawSubjPct;
    const subjTotalMax    = effectiveScores.reduce((a, e) => a + e.max, 0);
    const subjTotalScored = effectiveScores.reduce((a, e) => a + e.scored, 0);
    const activeHours     = GetHoursForSubject(subj);

    const filledCells = scores.map(e => {
      const ep         = e.max > 0 ? (e.scored / e.max) * 100 : 0;
      const period     = GetScorePeriod(e, S.activePeriod);
      const key        = GradeKey(period, subj, e);
      const excluded   = !!S.excludedGrades?.[key];
      const weight     = GetGradeWeight(period, subj, e);
      const modeled    = ApplyScoreModel(subj, e, S.activePeriod);
      const contrib_pp = (!excluded && subjTotalMax > 0) ? (modeled.max / subjTotalMax) * 100 : 0;
      const wpp        = (S.weightMode === 'hours' && activeHours && totalWeightedHours && subjTotalMax > 0)
        ? ((modeled.scored / subjTotalMax) * (activeHours / totalWeightedHours) * 100).toFixed(2) : null;

      const tip = encodeURIComponent(JSON.stringify({
        title: e.title || '', date: e.date || '',
        scored: e.scored, max: e.max,
        CalcPercent: ep.toFixed(1), contrib_pp: contrib_pp.toFixed(1),
        subj_scored: subjTotalScored.toFixed(1), subj_max: subjTotalMax,
        subj_pct: rawSubjPct.toFixed(1),
        formula_pct: formulaPctValue != null ? formulaPctValue.toFixed(1) : null,
        hours: activeHours || null, total_hours: totalWeightedHours || null,
        weighted_contrib_pp: wpp, mode: tipMode,
      }));

      const cls = `gf-grade-cell${excluded ? ' gf-grade-excluded' : ''}${weight !== 1 ? ' gf-grade-weighted' : ''}`;
      return `<td class="${cls}" data-gf-grade="${tip}" data-gf-grade-key="${encodeURIComponent(key)}" style="background:${BgForPercent(ep)};">${FormatNumber(e.scored)}/${FormatNumber(e.max)}</td>`;
    });
    const planned = BuildWhatIfScore(subj);
    if (planned) {
      const ep = planned.max > 0 ? (planned.scored / planned.max) * 100 : 0;
      const tip = encodeURIComponent(JSON.stringify({
        title: planned.title, date: '', scored: planned.scored, max: planned.max,
        CalcPercent: ep.toFixed(1), contrib_pp: '0', subj_scored: subjTotalScored.toFixed(1), subj_max: subjTotalMax,
        subj_pct: rawSubjPct.toFixed(1), formula_pct: null,
        hours: activeHours || null, total_hours: totalWeightedHours || null,
        weighted_contrib_pp: null, mode: tipMode,
      }));
      filledCells.push(`<td class="gf-grade-cell gf-grade-whatif" data-gf-grade="${tip}" style="background:${BgForPercent(ep)};">${FormatNumber(planned.scored)}/${FormatNumber(planned.max)}</td>`);
    }
    const filledHtml = filledCells.join('');

    const emptyCells = Array.from({ length: longest - filledCells.length }, () => `<td class="gf-empty-cell"></td>`).join('');
    const hoursBadge = (S.weightMode === 'hours' && activeHours) ? `<span class="gf-hours-badge">${activeHours}u</span>` : '';
    const formulaTag = (useFormulaPct && formulaPctValue != null)
      ? `<span style="margin-left:6px;color:var(--text-3);font-size:10px;" title="${Translate('custom_formula')}">ƒ</span>` : '';

    const rowStyle = animated ? `style="animation:gf-row-in 0.22s ${rowIdx * 20}ms ease both;"` : '';
    return `<tr ${rowStyle}>
      <td class="gf-subject-cell" data-gf-subj="${subj.replace(/"/g, '&quot;')}">${SubjectIconHtml(subj)}${subj}${hoursBadge}</td>
      ${filledHtml}${emptyCells}
      <td class="gf-pct-cell" data-gf-pct-tip="1" style="color:${ColorForPercent(subjPct)};">
        <span class="gf-pct-badge" style="--pct-color:${ColorForPercent(subjPct)};">${FormatPercent(subjPct)}%</span>${formulaTag}
      </td>
    </tr>`;
  }).join('');

  const totalEmpty = Array.from({ length: longest }, () => `<td class="gf-total-empty"></td>`).join('');
  const totalLabel = useFormulaPct ? Translate('total_formula') : Translate('total');
  const totalRowStyle = animated ? `style="animation:gf-row-in 0.22s ${entries.length * 20 + 30}ms ease both;"` : '';

  const hadSpinner = !!wrap.querySelector('#gf-state, .gf-spinner');
  if (hadSpinner && animated) {
    wrap.style.opacity = '0';
    wrap.style.transition = 'none';
  }

  wrap.innerHTML = `<table id="gf-table"><tbody>
    ${rows}
    <tr class="gf-total-row" ${totalRowStyle}>
      <td class="gf-total-subject">${totalLabel}</td>
      ${totalEmpty}
      <td class="gf-total-pct" data-gf-pct-tip="1" style="color:${ColorForPercent(totalPct)};"><span class="gf-total-pct-badge" style="--pct-color:${ColorForPercent(totalPct)};">${FormatPercent(totalPct)}%</span></td>
    </tr>
  </tbody></table>`;

  if (hadSpinner && animated) {
    requestAnimationFrame(() => {
      wrap.style.transition = 'opacity 0.18s ease';
      wrap.style.opacity = '1';
      setTimeout(() => { wrap.style.transition = ''; wrap.style.opacity = ''; }, 220);
    });
  }

  BindTableListeners();
  UpdateDynamicGridSize();
  UpdateDynamicCellSize();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    UpdateDynamicGridSize();
    UpdateDynamicCellSize();
    UpdateScrollButton();
  }));
}

// Topbar
function UpdateTopbar() {
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const n    = Object.values(data).reduce((a, { scores }) => a + scores.length, 0);
  const title = document.getElementById('gf-topbar-title');
  const sub   = document.getElementById('gf-topbar-subtitle');
  const note  = document.getElementById('gf-formula-note');

  if (title) title.textContent = S.activePeriod === 'Alle' ? Translate('all_periods') : S.activePeriod;
  if (sub)   sub.textContent   = `${n} ${Translate('results_label')}  ·  ${Translate('disclaimer')}`;
  const rl = document.getElementById('gf-refresh-label'); if (rl) rl.textContent = Translate('reload');
  const sb = document.getElementById('gf-scroll-recent-btn'); if (sb) sb.textContent = Translate('go_recent');

  if (note) {
    const showWarn = S.useFormula && S.activePeriod !== 'Alle';
    note.textContent = Translate('formula_warning');
    note.style.display = showWarn ? 'block' : 'none';
  }
}

// Scroll button
function UpdateScrollButton() {
  const wrap = document.getElementById('gf-table-wrap');
  const btn  = document.getElementById('gf-scroll-recent-btn');
  if (!wrap || !btn) return;
  if (S.activeView !== 'overview') { btn.classList.remove('is-visible'); return; }
  btn.classList.toggle('is-visible',
    wrap.scrollWidth - wrap.clientWidth > 80 &&
    wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 60);
}
function BindScrollButton() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap || wrap._gfScrollBound) return;
  wrap._gfScrollBound = true;
  wrap.addEventListener('scroll', UpdateScrollButton, { passive: true });
  wrap.addEventListener('wheel', e => {
    if (e.ctrlKey || e.shiftKey || e.altKey) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (e.target.closest('textarea, input, select')) return;
    const scroller = e.target.closest('.gf-hscroll') || wrap;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 8) return;
    const shouldConvert = S.activeView === 'overview' || S.activeView === 'comparison' || e.target.closest('.gf-hscroll');
    if (!shouldConvert) return;
    scroller.scrollLeft += e.deltaY;
    e.preventDefault();
    UpdateScrollButton();
  }, { passive: false });
  if (window.ResizeObserver) new ResizeObserver(UpdateScrollButton).observe(wrap);
}

document.addEventListener('click', e => {
  if (!e.target.closest('#gf-scroll-recent-btn')) return;
  document.getElementById('gf-table-wrap')?.scrollTo({ left: 999999, behavior: 'smooth' });
});
document.addEventListener('click', e => {
  const overlay = document.getElementById('gf-settings-overlay');
  if (overlay?.classList.contains('is-open') && e.target === overlay) CloseSettings();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { CloseSettings(); CloseHelp(); }
  if (e.key === 'F6') { e.preventDefault(); window.parent.postMessage({ type: 'gf-open-gradeflow' }, '*'); }
  if (e.key === 'F8') { e.preventDefault(); window.parent.postMessage({ type: 'gf-f8' }, '*'); }
  if (e.key === 'F7') { e.preventDefault(); window.parent.postMessage({ type: 'gf-chat-f7' }, '*'); }
});

// Tooltip
function PositionTooltip(tt, cx, cy) {
  const tw = tt.offsetWidth || 280, th = tt.offsetHeight || 140;
  let x = cx + 14, y = cy + 14;
  if (x + tw > window.innerWidth  - 8) x = cx - tw - 8;
  if (y + th > window.innerHeight - 8) y = cy - th - 8;
  tt.style.left = x + 'px'; tt.style.top = y + 'px';
}

function BuildTooltipHTML(d) {
  const pctNum   = parseFloat(d.CalcPercent);
  const pctColor = pctNum >= 70 ? '#4ade80' : pctNum >= 50 ? '#fbbf24' : '#f87171';
  const divider  = `<div style="grid-column:1/-1;border-top:1px solid var(--border-hi);margin:4px 0 2px;"></div>`;

  let extra = '';
  if ((d.mode === 'hours' || d.mode === 'hours+formula') && d.hours && d.total_hours) {
    extra += `${divider}
      <span style="color:var(--text-3);">${Translate('hours_subject')}</span>
      <span style="color:#a78bfa;font-weight:600;">${d.hours}u <span style="font-weight:400;color:var(--text-3);">/ ${d.total_hours}u</span></span>
      <span style="color:var(--text-3);">${Translate('weighted_contrib')}</span>
      <span style="color:#a78bfa;font-weight:700;">+${ApplyDecimalSep(d.weighted_contrib_pp)} pp</span>`;
  }
  if ((d.mode === 'formula' || d.mode === 'hours+formula') && d.formula_pct != null) {
    extra += `${divider}
      <span style="color:var(--text-3);">${Translate('subject_pct_formula')}</span>
      <span style="color:var(--orange);font-weight:600;">${ApplyDecimalSep(d.formula_pct)}%</span>
      <span style="color:var(--text-3);">${Translate('subject_pct_points')}</span>
      <span>${ApplyDecimalSep(d.subj_pct)}%</span>`;
  }

  const titleRow = d.title ? `<div style="font-weight:600;font-size:12px;margin-bottom:2px;color:var(--text-0);">${d.title}</div>` : '';
  const dateRow  = d.date  ? `<div style="color:var(--text-3);font-size:10px;margin-bottom:8px;">${d.date}</div>` : '';
  return `${titleRow}${dateRow}
    <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px;">
      <span style="color:var(--text-3);">${Translate('score')}</span>
      <span style="font-weight:700;">${FormatNumber(d.scored)}/${FormatNumber(d.max)} <span style="color:${pctColor};margin-left:4px;">${ApplyDecimalSep(d.CalcPercent)}%</span></span>
      <span style="color:var(--text-3);">${Translate('contribution')}</span>
      <span>${FormatNumber(d.scored)}/${FormatNumber(d.subj_max)} (${ApplyDecimalSep(d.contrib_pp)}%)</span>
      ${extra}
    </div>`;
}

function BindTableListeners() {
  const wrap = document.getElementById('gf-table-wrap');
  const tt   = document.getElementById('gf-tooltip');
  if (!wrap || !tt || wrap._gfTipBound) return;
  wrap._gfTipBound = true;
  wrap.addEventListener('mouseover', e => {
    const cell = e.target.closest('[data-gf-grade]');
    if (cell) {
      tt.innerHTML = BuildTooltipHTML(JSON.parse(decodeURIComponent(cell.dataset.gfGrade)));
      tt.style.display = 'block'; PositionTooltip(tt, e.clientX, e.clientY); return;
    }
    const pctCell = e.target.closest('[data-gf-pct-tip]');
    if (pctCell) {
      tt.innerHTML = `<div style="font-weight:600;font-size:11px;margin-bottom:4px;color:var(--orange);">${Translate('pct_warning_title')}</div>
        <div style="color:var(--text-3);font-size:10px;line-height:1.6;max-width:220px;">${Translate('pct_warning_body')}</div>`;
      tt.style.display = 'block'; PositionTooltip(tt, e.clientX, e.clientY);
    }
  });
  wrap.addEventListener('mousemove', e => {
    if (tt.style.display !== 'block') return;
    if (!e.target.closest('[data-gf-grade]') && !e.target.closest('[data-gf-pct-tip]')) { tt.style.display = 'none'; return; }
    PositionTooltip(tt, e.clientX, e.clientY);
  });
  wrap.addEventListener('mouseout', e => {
    if (!e.relatedTarget?.closest('[data-gf-grade]') && !e.relatedTarget?.closest('[data-gf-pct-tip]')) tt.style.display = 'none';
  });

  wrap.addEventListener('click', e => {
    const gradeCell = e.target.closest('[data-gf-grade-key]');
    if (gradeCell) {
      ToggleGradeExcluded(decodeURIComponent(gradeCell.dataset.gfGradeKey || ''));
      return;
    }

    const icon = e.target.closest('.gf-subj-icon');
    if (!icon) return;
    const cell = icon.closest('[data-gf-subj]');
    if (!cell) return;
    const subj = cell.dataset.gfSubj;
    const current = S.subjectIcons?.[subj] || EmojiForSubject(subj);
    const picked = prompt(`Emoji for "${subj}" (empty = auto):`, current);
    if (picked != null && picked.trim()) {
      SaveSubjectIcons({ ...S.subjectIcons, [subj]: picked.trim() });
    } else if (picked != null) {
      const next = { ...S.subjectIcons };
      delete next[subj];
      SaveSubjectIcons(next);
    }
    if (picked != null) {
      icon.outerHTML = SubjectIconHtml(subj);
    }
  });
}

function BindDraggableFormulaGroups() {
  if (typeof interact === 'undefined') return;
  const section = document.getElementById('gf-formula-section');
  if (!section) return;
  const groups = [...section.querySelectorAll('.gf-formula-group')];
  if (groups.length < 2) return;

  groups.forEach(group => {
    const gi = parseInt(group.dataset.gi, 10);
    try { interact(group).unset(); } catch (_) {}
    let dy = 0;
    interact(group).draggable({
      allowFrom: '.gf-drag-handle', inertia: false,
      modifiers: [interact.modifiers.restrictRect({ restriction: section, endOnly: false })],
      listeners: {
        start() { dy = 0; group.classList.add('gf-dragging'); group.style.zIndex = '50'; group.style.position = 'relative'; },
        move(e) { dy += e.dy; group.style.transform = `translateY(${dy}px)`; },
        end() {
          group.classList.remove('gf-dragging');
          group.style.transform = group.style.zIndex = group.style.position = '';
          const shift = Math.round(dy / (group.offsetHeight + 6));
          const tgi = Math.max(0, Math.min(S.formula.length - 1, gi + shift));
          if (tgi !== gi) {
            const f = [...S.formula]; const [item] = f.splice(gi, 1); f.splice(tgi, 0, item);
            SaveFormula(f); Render();
          }
          dy = 0;
        },
      },
    });
  });
}

const _GF_PRESS_SEL = '.gf-period-btn, .gf-action-btn, .gf-sett-opt, #gf-refresh-btn, ' +
  '#gf-settings-btn, #gf-help-btn, #gf-github-btn, #gf-cws-btn, ' +
  '#gf-close-btn, .gf-formula-remove, #gf-scroll-recent-btn, ' +
  '#gf-collapse-btn, .gf-formula-add-part, .gf-view-tab, .gf-tool-btn';

function _GfApplyPressTo(el) {
  if (typeof interact === 'undefined') return;
  if (!el || el._gfPress) return; el._gfPress = true;
  interact(el)
    .on('down', () => { el.style.transition = 'transform 0.08s ease'; el.style.transform = 'scale(0.93)'; })
    .on('up',   () => {
      el.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'scale(1)';
      setTimeout(() => { if (el.style.transform === 'scale(1)') { el.style.transform = el.style.transition = ''; } }, 400);
    })
    .on('cancel', () => { el.style.transition = 'transform 0.2s ease'; el.style.transform = 'scale(1)'; });
}

function _GfApplyPressToAll(root) {
  (root || document).querySelectorAll(_GF_PRESS_SEL).forEach(_GfApplyPressTo);
}

function InitInteractAnimations() {
  if (typeof interact === 'undefined') return;

  // Initial pass over what exists now
  _GfApplyPressToAll();

  // Lazy: hook each element only on first user interaction. No DOM scanning,
  // no MutationObserver.
  function lazyAttach(e) {
    const t = e.target.closest && e.target.closest(_GF_PRESS_SEL);
    if (t && !t._gfPress) _GfApplyPressTo(t);
  }
  document.addEventListener('pointerdown', lazyAttach, { capture: true, passive: true });
}

// Master Render
function Render(animated = true) {
  RenderTabs();
  RenderSidebar();
  RenderMainContent(animated);
  UpdateTopbar();
  UpdateBottomBar();
  BindScrollButton();
  if (typeof _GfApplyPressToAll === 'function') _GfApplyPressToAll();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    UpdateDynamicGridSize();
    UpdateDynamicCellSize();
    UpdateScrollButton();
  }));
}

// Refresh
function BindRefreshButton() {
  document.getElementById('gf-refresh-btn')?.addEventListener('click', () => {
    const label = document.getElementById('gf-refresh-label');
    if (label) label.textContent = Translate('fetching');
    chrome.tabs.query({ active: true }, tabs => {
      const tab = tabs.find(t => t.url && t.url.includes('/results/'));
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { type: 'gf-refresh' }, () => setTimeout(() => window.location.reload(), 800));
      } else {
        if (label) label.textContent = 'Ga naar Resultaten eerst';
        setTimeout(() => { if (label) label.textContent = Translate('reload'); }, 2500);
      }
    });
  });
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  BindRefreshButton();
  InitCollapseBtn();
  InitResizeObserver();
  InitInteractAnimations();

  document.getElementById('gf-settings-btn')?.addEventListener('click', () => {
    const ov = document.getElementById('gf-settings-overlay');
    ov?.classList.contains('is-open') ? CloseSettings() : OpenSettings();
  });
  document.getElementById('gf-settings-close')?.addEventListener('click', CloseSettings);

  document.getElementById('gf-help-btn')?.addEventListener('click', () => {
    const ov = document.getElementById('gf-help-overlay');
    ov?.classList.contains('is-open') ? CloseHelp() : OpenHelp();
  });
  document.getElementById('gf-help-close')?.addEventListener('click', CloseHelp);
  document.getElementById('gf-help-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'gf-help-overlay') CloseHelp();
  });

  document.getElementById('gf-github-btn')?.addEventListener('click', () => {
    window.open(GF_GITHUB_URL, '_blank', 'noopener,noreferrer');
  });
  document.getElementById('gf-cws-btn')?.addEventListener('click', () => {
    window.open(GF_CWS_URL, '_blank', 'noopener,noreferrer');
  });

  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
      const img = document.getElementById('gf-icon');
      if (img) img.src = chrome.runtime.getURL('Assets/icon.png');
    }
  } catch (_) {}

  document.getElementById('gf-close-btn')?.addEventListener('click', () =>
    window.parent.postMessage({ type: 'gf-close' }, '*'));

  try {
    chrome.storage.local.get(['gradeflow-grades', 'gradeflow-planner-items', 'gradeflow-study-sessions', 'gradeflow-attendance-items', 'gf-profile-picture', 'gf-detected-profile-picture'], result => {
      S.profilePicture = result?.['gf-profile-picture'] || S.profilePicture || '';
      S.detectedProfilePicture = result?.['gf-detected-profile-picture'] || S.detectedProfilePicture || '';
      S.plannerItems = NormalizePlannerItems(result?.['gradeflow-planner-items']);
      S.studySessions = NormalizeStudySessions(result?.['gradeflow-study-sessions']);
      S.attendanceItems = NormalizeAttendanceItems(result?.['gradeflow-attendance-items']);
      CleanupExpiredStudySessions();
      const raw = result?.['gradeflow-grades'];
      const wrap = document.getElementById('gf-table-wrap');
      if (!raw) {
        if (wrap) wrap.innerHTML = `<div id="gf-state"><div class="gf-spinner"></div><span>${Translate('fetching')}</span></div>`;
        UpdateBottomBar(); return;
      }
      S.store = JSON.parse(raw);
      InvalidatePeriodCache();
      if (S.store?._courseIcons) { S.courseIcons = S.store._courseIcons; delete S.store._courseIcons; }
      S.periods = ComputePeriods(S.store);
      S.activePeriod = S.periods.includes('Alle') ? 'Alle' : (S.periods[0] || 'Alle');
      Render(false);
      window.parent.postMessage({ type: 'gf-panel-rendered' }, '*');
    });
  } catch (err) {
    const wrap = document.getElementById('gf-table-wrap');
    if (wrap) wrap.innerHTML = `<div id="gf-state" style="color:var(--red);">${Translate('error_load')}: ${String(err?.message || err)}</div>`;
    UpdateBottomBar();
  }
});

function InitResizeObserver() {
  const outer = document.getElementById('gf-table-outer');
  const wrap  = document.getElementById('gf-table-wrap');
  if (!outer || !wrap || !window.ResizeObserver) return;
  new ResizeObserver(() => {
    UpdateDynamicGridSize();
    UpdateDynamicCellSize();
    UpdateScrollButton();
  }).observe(outer);
}

function InitCollapseBtn() {
  const btn = document.getElementById('gf-collapse-btn');
  if (!btn) return;
  const saved = localStorage.getItem('gradeflow-sidebar-collapsed');
  if (saved === '1') { document.body.classList.add('gf-sidebar-collapsed'); btn.textContent = '»'; }
  else btn.textContent = '«';
  btn.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('gf-sidebar-collapsed');
    btn.textContent = collapsed ? '»' : '«';
    localStorage.setItem('gradeflow-sidebar-collapsed', collapsed ? '1' : '0');
    setTimeout(() => { UpdateDynamicCellSize(); UpdateScrollButton(); }, 220);
  });
}

function UpdateDynamicGridSize() {
  const outer = document.getElementById('gf-table-outer');
  const wrap  = document.getElementById('gf-table-wrap');
  if (!outer || !wrap) return;
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  const rowCount = Object.keys(data).length + 1;
  if (rowCount <= 1) { wrap.style.setProperty('--gf-row-h', '38px'); return; }
  const available = outer.clientHeight;
  if (available === 0) { requestAnimationFrame(UpdateDynamicGridSize); return; }
  const rowH = Math.min(120, Math.max(32, Math.floor(available / rowCount)));
  wrap.style.setProperty('--gf-row-h', rowH + 'px');
}

function UpdateDynamicCellSize() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap) return;
  const data = S.store ? GetPeriodData(S.store, S.activePeriod) : {};
  if (!Object.keys(data).length) return;

  const numCols = Math.max(...Object.values(data).map(({ scores }) => scores.length), 0);
  if (numCols === 0) return;

  const wrapW = wrap.clientWidth;
  if (!wrapW) return;

  let maxSubjW = 120;
  for (const cell of wrap.querySelectorAll('.gf-subject-cell')) {
    if (cell.scrollWidth > maxSubjW) maxSubjW = cell.scrollWidth;
  }
  const SUBJ_W = Math.min(maxSubjW + 2, 320);
  const PCT_W = 68;
  const available = wrapW - SUBJ_W - PCT_W;
  const cellW = Math.min(92, Math.max(56, Math.floor(available / numCols)));

  wrap.style.setProperty('--gf-cell-w', cellW + 'px');
  wrap.style.setProperty('--gf-subj-w', SUBJ_W + 'px');
}
