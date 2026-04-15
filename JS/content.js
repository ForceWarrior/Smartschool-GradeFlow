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
    if (localStorage.getItem('gf-pers-active') === '1') {
      const style = document.createElement('style');
      style.id = 'gf-pers-hide';
      style.textContent = `
        header, nav, [class*="topbar"], [class*="top-bar"], [role="banner"],
        .smsc-top-bar, .smsc-top, #smsc-top, .smsc-header,
        [class*="TopBar"], [class*="Header"] {
          visibility: hidden !important;
        }
        img[src*="userpicture"] {
          visibility: hidden !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
      setTimeout(() => document.getElementById('gf-pers-hide')?.remove(), 4000);
    }
  } catch (_) {}
  try {
    chrome.storage.sync.get('gf-personalization', res => {
      const s = res['gf-personalization'];
      if (!s) return;
      const needsHide = (s.nameChanger && s.customName) || s.pfpChanger;
      if (!needsHide) return;
      if (!document.getElementById('gf-pers-hide')) {
        const style = document.createElement('style');
        style.id = 'gf-pers-hide';
        style.textContent = `
          header, nav, [class*="topbar"], [class*="top-bar"], [role="banner"],
          .smsc-top-bar, .smsc-top, #smsc-top, .smsc-header,
          [class*="TopBar"], [class*="Header"] {
            visibility: hidden !important;
          }
          img[src*="userpicture"] {
            visibility: hidden !important;
          }
        `;
        (document.head || document.documentElement).appendChild(style);
        setTimeout(() => document.getElementById('gf-pers-hide')?.remove(), 4000);
      }
    });
  } catch (_) {}
})();

// Dark mode flash prevention
;(function GfAntiFlashDarkMode() {
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
let _gfSheetRevealed = false;
let _gfNavObserver = null;

const GF_THEME_SHEETS = [
  { id: 'gf-theme-css', href: 'CSS/smartschool-theme.css' },
];

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
  localStorage.setItem('gf-theme-cache', theme);

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
  _gfCurrentTheme = saved === 'dark' ? 'dark' : 'light';
  _gfSheetRevealed = false;
  ApplyPageTheme(_gfCurrentTheme);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes['gradeflow-theme']) {
    _gfCurrentTheme = changes['gradeflow-theme'].newValue === 'dark' ? 'dark' : 'light';
    _gfSheetRevealed = false;
    ApplyPageTheme(_gfCurrentTheme);
    document.querySelector('#gradeflow-panel-host iframe')
      ?.contentWindow?.postMessage({ type: 'gf-theme', theme: _gfCurrentTheme }, '*');
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

// Nav watcher
function _GfStartNavWatcher() {
  if (_gfNavObserver) return;
  let lastHref = location.href;
  _gfNavObserver = setInterval(() => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    if (document.body) document.body.style.opacity = '1';
    if (!document.getElementById('gradeflow-tab')) SetupButton();
  }, 500);
}

function _GfStopNavWatcher() {
  if (!_gfNavObserver) return;
  clearInterval(_gfNavObserver);
  _gfNavObserver = null;
}

// Panel
function _GfGetPanelIframe() {
  return document.querySelector('#gradeflow-panel-host iframe');
}

function OnPanelMessage(e) {
  if (e.data?.type === 'gf-close') ClosePanel();
  if (e.data?.type === 'gf-f8') _GfLaunchArcade();
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
    iframe.contentWindow?.postMessage({ type: 'gf-theme', theme: _gfCurrentTheme }, '*');
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

function OpenPanel() {
  const existingHost = document.getElementById('gradeflow-panel-host');

  if (existingHost && existingHost.style.display !== 'none') {
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
  if (e.key === 'F8') {
    e.preventDefault();
    e.stopPropagation();
    _GfLaunchArcade();
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
  if (e.target.closest('header, nav, [class*="topbar"], [class*="top-bar"], [role="banner"], [class*="topnav"], [class*="TopBar"]')) return;
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

  const sample = wrapper.querySelector('[class*="optionWrapper"]')
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
    || [...btn.querySelectorAll('span')].find(s => !s.querySelector('*') && !s.closest('[data-type="icon"]'));
  if (label) label.textContent = 'GradeFlow';

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    OpenPanel();
  }, true);

  wrapper.appendChild(clone);
}

function InitObserver() {
  if (_gfButtonObserver) return;
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', InitObserver, { once: true });
    return;
  }

  _gfButtonObserver = new MutationObserver(() => {
    if (!document.getElementById('gradeflow-tab')) SetupButton();
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


const _GF_P_SETTINGS_KEY = 'gf-personalization';
const _GF_P_PFP_KEY      = 'gf-profile-picture';
let _gfPersSettings = null;
let _gfPersPfp      = null;
let _gfPersReady    = false; // true once settings are loaded from storage

let _gfDetectedRealName = null;

function _GfApplyName(name) {
  if (!name) return;
  let count = 0;

  document.querySelectorAll('[data-gf-orig-name]').forEach(el => {
    el.textContent = name;
    count++;
  });

  const realName = _gfDetectedRealName;
  if (realName) {
    document.querySelectorAll('a, span, div, p, li, td, h1, h2, h3, h4, button, label').forEach(el => {
      if (el.dataset.gfOrigName) return; // already tagged
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
  if (count) return;

  const candidates = [];
  document.querySelectorAll('a, span, div, p, li, td, h1, h2, h3, h4, button, label').forEach(el => {
    if (el.closest('#gradeflow-panel-host, #gf-arcade, iframe')) return;
    if (el.children.length > 0) return;
    const t = el.textContent.trim();
    if (t.length < 3 || t.length > 60) return;
    if (/^(start|berichten|vakken|links|ga naar|help|zoek|instellingen|afmelden|GradeFlow)/i.test(t)) return;
    if (/^\d/.test(t)) return;
    if (!/\s/.test(t)) return;
    if (!/^[A-Za-zÀ-ÿ\s\-'.]+$/.test(t)) return;
    const inHeader = !!el.closest('header, nav, [class*="topbar"], [class*="top-bar"], [role="banner"]');
    candidates.push({ el, text: t, score: inHeader ? 10 : 1 });
  });

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return;

  _gfDetectedRealName = best.text;

  candidates.forEach(c => {
    if (c.text === best.text) {
      c.el.dataset.gfOrigName = c.text;
      c.el.textContent = name;
      count++;
    }
  });
}

function _GfRevertName() {
  document.querySelectorAll('[data-gf-orig-name]').forEach(el => {
    el.textContent = el.dataset.gfOrigName;
    delete el.dataset.gfOrigName;
  });
}

// Profile picture
let _gfDetectedAvatarSrc = null; // cached original avatar URL

function _GfApplyPfp(dataUrl) {
  if (!dataUrl) return;
  let count = 0;

  document.querySelectorAll('[data-gf-orig-src]').forEach(el => {
    if (el.tagName === 'IMG') el.src = dataUrl;
    else el.style.backgroundImage = `url(${dataUrl})`;
    count++;
  });

  if (!_gfDetectedAvatarSrc) {
    for (const img of document.querySelectorAll('img')) {
      if (img.closest('#gradeflow-panel-host, #gf-arcade')) continue;
      if (img.dataset.gfOrigSrc) { _gfDetectedAvatarSrc = img.dataset.gfOrigSrc; break; }
      const src = img.src || '';
      if (/userpicture\d*\.smartschool\.be/i.test(src)) {
        _gfDetectedAvatarSrc = src;
        break;
      }
    }
    if (!_gfDetectedAvatarSrc) {
      const avatarParents = document.querySelectorAll(
        '[class*="avatar"] img, [class*="header-avatar"] img, [class*="header__avatar"] img, ' +
        '[class*="profile"] img, [class*="user-img"] img, [class*="userpic"] img, ' +
        '[class*="foto"] img, [class*="profielfoto"] img, ' +
        'header img, nav img, [class*="topbar"] img, [class*="top-bar"] img, [role="banner"] img'
      );
      for (const img of avatarParents) {
        if (img.closest('#gradeflow-panel-host, #gf-arcade')) continue;
        if (img.dataset.gfOrigSrc) { _gfDetectedAvatarSrc = img.dataset.gfOrigSrc; break; }
        const src = img.src || '';
        if (!src || src.startsWith('data:')) continue;
        if (/logo|favicon|sprite|icon\.(png|svg)|\/icons?\//i.test(src)) continue;
        _gfDetectedAvatarSrc = src;
        break;
      }
    }
  }

  if (_gfDetectedAvatarSrc) {
    const avatarUrl = _gfDetectedAvatarSrc;
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.gfOrigSrc) return;
      if (img.closest('#gradeflow-panel-host, #gf-arcade')) return;
      const src = img.src || '';
      if (src === avatarUrl || _GfSameAvatarUrl(src, avatarUrl)) {
        img.dataset.gfOrigSrc = src;
        img.src = dataUrl;
        count++;
      }
    });
  }

  document.querySelectorAll('img').forEach(img => {
    if (img.dataset.gfOrigSrc) return;
    if (img.closest('#gradeflow-panel-host, #gf-arcade')) return;
    const src = img.src || '';
    if (_gfDetectedAvatarSrc && /userpicture\d*\.smartschool\.be/i.test(src)) {
      const detectedId = _GfExtractSmscUserId(_gfDetectedAvatarSrc);
      const thisId = _GfExtractSmscUserId(src);
      if (detectedId && thisId && detectedId === thisId) {
        img.dataset.gfOrigSrc = src;
        img.src = dataUrl;
        count++;
      }
    }
  });

  if (!_gfDetectedAvatarSrc) {
    document.querySelectorAll(
      'header [class*="avatar"] img, nav [class*="avatar"] img, ' +
      '[role="banner"] [class*="avatar"] img, [class*="topbar"] [class*="avatar"] img, ' +
      '[class*="header__avatar"] img, [class*="header-avatar"] img'
    ).forEach(img => {
      if (img.dataset.gfOrigSrc) return;
      if (img.closest('#gradeflow-panel-host, #gf-arcade')) return;
      if (!_gfDetectedAvatarSrc && img.src && !img.src.startsWith('data:')) {
        _gfDetectedAvatarSrc = img.src;
      }
      img.dataset.gfOrigSrc = img.src;
      img.src = dataUrl;
      count++;
    });
  }

  document.querySelectorAll(
    '[class*="avatar"], [class*="profile-pic"], [class*="foto"], [class*="user-img"], [class*="userpic"]'
  ).forEach(el => {
    if (el.tagName === 'IMG') return;
    if (el.dataset.gfOrigSrc) return;
    if (el.closest('#gradeflow-panel-host, #gf-arcade')) return;
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none' && bg.startsWith('url(')) {
      el.dataset.gfOrigSrc = bg;
      el.style.backgroundImage = `url(${dataUrl})`;
      count++;
    }
  });


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
      // background-image element
      el.style.backgroundImage = el.dataset.gfOrigSrc;
    }
    delete el.dataset.gfOrigSrc;
  });
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
  let _gfKeepAliveId = null;
  let _gfRetryCount  = 0;
  const _GF_MAX_RETRIES = 30; // 30 × 500 ms = 15 s fast phase

  function _GfStartRetryPolling() {
    if (_gfRetryId) return;
    _gfRetryId = setInterval(() => {
      _gfRetryCount++;
      if (!_gfPersReady || !document.body) {
        if (_gfRetryCount >= _GF_MAX_RETRIES) clearInterval(_gfRetryId);
        return;
      }
      const s = _gfPersSettings;
      if (!s) { clearInterval(_gfRetryId); return; }

      const anyActive = (s.nameChanger && s.customName) || (s.pfpChanger && _gfPersPfp) || s.fakeMsgCounter || s.fakeNotifCounter || s.fakeNewsCounter;
      if (anyActive) _GfRunPersonalization();

      if (_gfRetryCount >= _GF_MAX_RETRIES) {
        clearInterval(_gfRetryId);
        _gfRetryId = null;
        _GfStartKeepAlive(); // switch to slow indefinite poll
      }
    }, 500);
  }

  function _GfStartKeepAlive() {
    if (_gfKeepAliveId) return;
    _gfKeepAliveId = setInterval(() => {
      if (!_gfPersReady || !_gfPersSettings) return;
      const s = _gfPersSettings;
      const anyActive = (s.nameChanger && s.customName) || (s.pfpChanger && _gfPersPfp) || s.fakeMsgCounter || s.fakeNotifCounter || s.fakeNewsCounter;
      if (anyActive) _GfRunPersonalization();
    }, 2000);
  }

  let _gfObsTimer = null;
  let _gfFirstApply = true;
  const _gfPersObserver = new MutationObserver((mutations) => {
    if (!_gfPersReady) return;
    const s = _gfPersSettings;
    if (!s) return;
    const anyActive = (s.nameChanger && s.customName) || (s.pfpChanger && _gfPersPfp) || s.fakeMsgCounter || s.fakeNotifCounter || s.fakeNewsCounter;
    if (!anyActive) return;

    let hasNewNodes = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0 || m.removedNodes.length > 0 || m.type === 'characterData') { hasNewNodes = true; break; }
    }
    if (!hasNewNodes) return;

    if (_gfFirstApply) {
      _gfFirstApply = false;
      _GfRunPersonalization();
      return;
    }
    if (_gfObsTimer) return;
    _gfObsTimer = setTimeout(() => {
      _gfObsTimer = null;
      _GfRunPersonalization();
    }, 200);
  });

  function StartObserving() {
    if (!document.body) return;
    _gfPersObserver.observe(document.body, {
      childList: true, subtree: true, characterData: true
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
