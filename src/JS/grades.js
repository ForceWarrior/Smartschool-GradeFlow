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
function ApplyGradeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
}

chrome.storage.local.get('gradeflow-theme', ({ 'gradeflow-theme': saved }) => {
  const th = saved === 'dark' ? 'dark' : 'light';
  S.theme = th;
  ApplyGradeTheme(th);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['gradeflow-theme']) {
    const th = changes['gradeflow-theme'].newValue;
    S.theme = th;
    ApplyGradeTheme(th);
    const overlay = document.getElementById('gf-settings-overlay');
    if (overlay?.classList.contains('is-open')) RenderSettings();
  }
});

window.addEventListener('message', e => {
  if (e.data?.type === 'gf-theme') {
    S.theme = e.data.theme;
    ApplyGradeTheme(e.data.theme);
    const overlay = document.getElementById('gf-settings-overlay');
    if (overlay?.classList.contains('is-open')) RenderSettings();
  }

  if (e.data?.type === 'gf-grades-ready') {
    const prevJSON = S.store ? JSON.stringify(S.store) : null;
    chrome.storage.local.get('gradeflow-grades', result => {
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
        const wrap = document.getElementById('gf-table-wrap');
        if (wrap) { wrap.style.transition = 'opacity 0.1s'; wrap.style.opacity = '0'; }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          RenderSidebar();
          RenderTable(false);
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
        if (!seen.has(k)) { seen.add(k); merged[subject].scores.push({ ...score }); }
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
function WeightedPct(data) {
  let weighted = 0, totalHours = 0;
  for (const [subject, { scores }] of Object.entries(data || {})) {
    const h = GetHoursForSubject(subject);
    if (!h || isNaN(h)) continue;
    weighted += CalcPercent(scores) * h;
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
      const scores = store[part.period]?.[subject]?.scores || [];
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

// State
const S = {
  store: null,
  periods: [],
  activePeriod: 'Alle',
  weightMode: LoadWeightMode(),
  useFormula: LoadUseFormula(),
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

function OverallPct(data) {
  if (!data || !Object.keys(data).length) return 0;
  const applyFormula = S.useFormula && S.store && S.activePeriod === 'Alle' && HasFormula();
  if (applyFormula) return FormulaOverallPct(S.store, S.weightMode === 'hours');
  if (S.weightMode === 'hours') return WeightedPct(data);
  return CalcPercent(Object.values(data).flatMap(s => s.scores));
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
    if (!scores.length) continue;
    const subjPct = CalcPercent(scores);
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
  const tScored    = allScores.reduce((a, e) => a + e.scored, 0);
  const tMax       = allScores.reduce((a, e) => a + e.max, 0);
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
      RenderTable(false); UpdateTopbar(); UpdateBottomBar();
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

  const longest = Math.max(...entries.map(([, s]) => s.length), 0);

  const tipMode = S.useFormula
    ? (S.weightMode === 'hours' ? 'hours+formula' : 'formula')
    : S.weightMode;

  const rows = entries.map(([subj, scores], rowIdx) => {
    const rawSubjPct      = CalcPercent(scores);
    const formulaPctValue = useFormulaPct ? FormulaSubjectPct(subj, S.store) : null;
    const subjPct         = formulaPctValue ?? rawSubjPct;
    const subjTotalMax    = scores.reduce((a, e) => a + e.max, 0);
    const subjTotalScored = scores.reduce((a, e) => a + e.scored, 0);
    const activeHours     = GetHoursForSubject(subj);

    const filledCells = scores.map(e => {
      const ep         = e.max > 0 ? (e.scored / e.max) * 100 : 0;
      const contrib_pp = subjTotalMax > 0 ? (e.max / subjTotalMax) * 100 : 0;
      const wpp        = (S.weightMode === 'hours' && activeHours && totalWeightedHours && subjTotalMax > 0)
        ? ((e.scored / subjTotalMax) * (activeHours / totalWeightedHours) * 100).toFixed(2) : null;

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

      return `<td class="gf-grade-cell" data-gf-grade="${tip}" style="background:${BgForPercent(ep)};">${FormatNumber(e.scored)}/${FormatNumber(e.max)}</td>`;
    }).join('');

    const emptyCells = Array.from({ length: longest - scores.length }, () => `<td class="gf-empty-cell"></td>`).join('');
    const hoursBadge = (S.weightMode === 'hours' && activeHours) ? `<span class="gf-hours-badge">${activeHours}u</span>` : '';
    const formulaTag = (useFormulaPct && formulaPctValue != null)
      ? `<span style="margin-left:6px;color:var(--text-3);font-size:10px;" title="${Translate('custom_formula')}">ƒ</span>` : '';

    const rowStyle = animated ? `style="animation:gf-row-in 0.22s ${rowIdx * 20}ms ease both;"` : '';
    return `<tr ${rowStyle}>
      <td class="gf-subject-cell" data-gf-subj="${subj.replace(/"/g, '&quot;')}">${SubjectIconHtml(subj)}${subj}${hoursBadge}</td>
      ${filledCells}${emptyCells}
      <td class="gf-pct-cell" data-gf-pct-tip="1" style="color:${ColorForPercent(subjPct)};">
        ${FormatPercent(subjPct)}%${formulaTag}
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
      <td class="gf-total-pct" data-gf-pct-tip="1" style="color:${ColorForPercent(totalPct)};">${FormatPercent(totalPct)}%</td>
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
  btn.classList.toggle('is-visible',
    wrap.scrollWidth - wrap.clientWidth > 80 &&
    wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 60);
}
function BindScrollButton() {
  const wrap = document.getElementById('gf-table-wrap');
  if (!wrap || wrap._gfScrollBound) return;
  wrap._gfScrollBound = true;
  wrap.addEventListener('scroll', UpdateScrollButton, { passive: true });
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

function InitInteractAnimations() {
  if (typeof interact === 'undefined') return;
  const SELS = ['.gf-period-btn', '.gf-action-btn', '.gf-sett-opt', '#gf-refresh-btn',
    '#gf-settings-btn', '#gf-help-btn', '#gf-github-btn', '#gf-cws-btn',
    '#gf-close-btn', '.gf-formula-remove', '#gf-scroll-recent-btn',
    '#gf-collapse-btn', '.gf-formula-add-part'];

  function ApplyPress(el) {
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

  SELS.forEach(sel => document.querySelectorAll(sel).forEach(ApplyPress));
  new MutationObserver(() => SELS.forEach(sel => document.querySelectorAll(sel).forEach(ApplyPress)))
    .observe(document.body, { childList: true, subtree: true });
}

// Master Render
function Render(animated = true) {
  RenderSidebar();
  RenderTable(animated);
  UpdateTopbar();
  UpdateBottomBar();
  BindScrollButton();
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
    chrome.storage.local.get('gradeflow-grades', result => {
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
