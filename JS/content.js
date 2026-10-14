
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

    const rules = [];

    if (hasPfp) {
      rules.push(`
        img[src*="userpicture"], img[data-gf-orig-src] {
          content: url(${pfpCache}) !important;
        }
      `);
    }

    if (hasName) {
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

    if (hasName && realName) {
      window._gfDetectedRealName = realName;
    }
  } catch (_) {}
})();

;(function GfAntiFlashDarkMode() {
  if (localStorage.getItem('gf-smpp-active-cache') === '1') return;
  if (localStorage.getItem('gf-theme-cache') === 'custom') {
    try {
      const palette = JSON.parse(localStorage.getItem('gf-theme-palette-cache') || 'null');
      if (palette?.site !== false) GfThemeEngine.early(GfCleanPalette(palette));
    } catch (_) {}
    return;
  }
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
    html[data-gf-theme="dark"] :where(img, svg, video, canvas, object, embed, [role="img"], .gf-dark-media-protected, .homepage__google-apps__link, .datepicker__navigation__previous, .datepicker__navigation__next) {
      filter: invert(1) hue-rotate(180deg) !important;
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
let _gfHomeSummaryEnabled = true;
let _gfDarkMediaObserver = null;
let _gfDarkMediaTimer = 0;
let _gfCustomPalette = null;
let _gfCustomSig = '';
const GF_HOME_SUMMARY_ENABLED_KEY = 'gradeflow-home-summary-enabled';
const GF_DARK_MEDIA_FILTER = 'invert(1) hue-rotate(180deg)';
const GF_DARK_MEDIA_CLASS = 'gf-dark-media-protected';
const GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR = 'data-gf-dark-media-original-filter';
const GF_DARK_MEDIA_ORIGINAL_FILTER_PRIORITY_ATTR = 'data-gf-dark-media-original-filter-priority';

const GF_THEME_SHEETS = [
  { id: 'gf-theme-css', href: 'CSS/smartschool-theme.css' },
];

function _GfNormalizeTheme(value) {
  return value === 'dark' || value === 'smpp' || value === 'custom' ? value : 'light';
}

function _GfBridged() {
  return /^(smpp|custom)$/.test(document.documentElement.getAttribute('data-gf-theme-source') || '');
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
  root.setAttribute('data-gf-theme-source', vars.source === 'custom' ? 'custom' : 'smpp');
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
const GF_HOST_THEME_PREFIXES = ['gs', 'g2', 'gm', 'sw', 'bo', 'po', 'fl', 'rn', 'tw', 'io', 'cr', 'ss', 'hk'];
const GF_GAME_HOST_IDS = ['gf-tetris', 'gf-snake', 'gf-2048', 'gf-sweep', 'gf-memory', 'gf-shooter', 'gf-bo', 'gf-po', 'gf-fl', 'gf-rn', 'gf-tw', 'gf-io', 'gf-cr', 'gf-ss', 'gf-hk'];
const GF_GAME_HOST_SELECTOR = GF_GAME_HOST_IDS.map(id => '#' + id).join(',');
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
  const source = _GfBridged() ? root.getAttribute('data-gf-theme-source') : 'gradeflow';
  const isDark = source !== 'gradeflow' ? root.getAttribute('data-gf-external-dark') === '1' : root.getAttribute('data-gf-theme') === 'dark';
  return { source, isDark, bridged: source !== 'gradeflow' };
}

function _GfApplyThemeToHost(host) {
  if (!host) return;
  const themeState = _GfThemeState();
  host.dataset.theme = themeState.isDark ? 'dark' : 'light';
  host.dataset.themeSource = themeState.source;
  host.classList.toggle('is-smpp', themeState.bridged);
  host.style.filter = themeState.isDark && !themeState.bridged ? 'invert(1) hue-rotate(180deg)' : '';
  if (themeState.bridged) {
    for (const [propertyName, sourceName] of Object.entries(GF_HOST_THEME_BASE_VARS)) host.style.setProperty(propertyName, `var(${sourceName})`);
    for (const prefix of GF_HOST_THEME_PREFIXES) {
      for (const [partName, sourceName] of Object.entries(GF_HOST_THEME_PARTS)) host.style.setProperty(`--${prefix}-${partName}`, `var(${sourceName})`);
    }
  } else {
    GF_HOST_THEME_CUSTOM_PROPS.forEach(propertyName => host.style.removeProperty(propertyName));
  }
}

function _GfRefreshThemedHosts() {
  document.querySelectorAll(`#gf-arcade,${GF_GAME_HOST_SELECTOR}`)
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

const GF_DARK_MEDIA_SELECTOR = [
  `.${GF_DARK_MEDIA_CLASS}`,
  'img',
  'svg',
  'video',
  'canvas',
  'object',
  'embed',
  '[role="img"]',
  'smsc-svg',
  'smsc-icon',
  '[class*="smsc-svg" i]',
  '[class*="smsc-icon" i]',
  '[class*="avatar" i]',
  '[class*="profile-pic" i]',
  '[class*="profilepic" i]',
  '[class*="userpic" i]',
  '[class*="user-picture" i]',
  '[class*="userpicture" i]',
  '[class*="logo" i]',
  '.smsc-column-nav__button',
  '.smsc_cm_body_row_block',
  '.smsc_cm_no_items',
  '.icon-label[class*="smsc-svg" i]',
  '.homepage__google-apps__link',
  '.datepicker__navigation__previous',
  '.datepicker__navigation__next'
].join(',');
const GF_DARK_MEDIA_BACKGROUND_SELECTOR = [
  '[style*="background-image" i]',
  '[style*="background:" i][style*="url(" i]',
  '[class*="image" i]',
  '[class*="photo" i]',
  '[class*="avatar" i]',
  '[class*="picture" i]',
  '[class*="poster" i]',
  '[class*="qr" i]',
  '[class*="qrcode" i]',
  '[class*="logo" i]',
  '[class*="icon" i]',
  '[class*="google-apps" i]',
  '[class*="datepicker__navigation" i]',
  '.smsc-column-nav__button',
  '.smsc_cm_body_row_block',
  '.smsc_cm_no_items',
  '.icon-label[class*="smsc-svg" i]'
].join(',');
const GF_DARK_MEDIA_SURFACE_SELECTOR = `#gradeflow-panel-host,#gf-chat-root,#gf-update-overlay,#gf-home-summary,#gf-arcade,${GF_GAME_HOST_SELECTOR}`;
const GF_DARK_MEDIA_CONTAINER_SELECTOR = [
  '.topnav__menu',
  '.topnav__menu--courses',
  '.topnav__menu--links',
  '.topnav__menu--shortcuts',
  '.topnav__menu__hdr',
  '.shortcut-wrapper',
  '.homepage__google-apps',
  '.datepicker',
  '.datepicker__navigation',
  '.course-list',
  '.js-courses-list',
  '.course-btnbar',
  '.js-course-filters',
  '.smsc_cm_body',
  '.smsc_cm_body table',
  '.smsc_cm_body tbody',
  '.smsc_cm_body tr',
  '.toolbar',
  '.toolbar-buttons',
  '.leftContainer__top',
  '.leftContainer__bottom'
].join(',');
const GF_DARK_MEDIA_NEVER_SELECTOR = [
  'iframe',
  'input',
  'textarea',
  'select',
  'option',
  'ul',
  'ol',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  '[contenteditable="true"]',
  '.input-search',
  '.course-list',
  '.js-courses-list',
  '.course-btnbar',
  '.js-course-filters',
  '.toolbar-top',
  '.toolbar-bottom',
  '.resize-handle',
  '.leftContainer .border',
  '.icon-label-btn--no-icon .icon-label[class*="smsc-svg--undefined" i]'
].join(',');
const GF_DARK_TEXT_ICON_SELECTOR = [
  '.topnav__menuitem--icon',
  '.topnav__menuitem[class*="smsc-svg" i]',
  '.shortcut[class*="smsc-svg" i]',
  '.course-link[class*="smsc-svg" i]',
  '.favourite-button[class*="smsc-svg" i]',
  '.course-ico',
  '.smsc-column-nav__button',
  '.smsc_cm_body_row_block',
  '.smsc_cm_no_items',
  '.homepage__google-apps__link',
  '.icon-label[class*="smsc-svg" i]'
].join(',');
const GF_DARK_MEDIA_NAME_RE = /(?:image|img|photo|picture|avatar|profile|logo|icon|svg|poster|qr|qrcode|google|gmail|mail|calendar|agenda|drive|sites|apps|datepicker|navigation|previous|next|arrow|sprite|column-nav|planner|news|conference|documents|folder|mime|lpaths|weblinks|tasks|exercises|uploadzone|cooperate|classmates|forum|wiki|flag)/i;

function _GfIsHomeSummaryEnabledValue(value) {
  return value !== false && value !== '0' && value !== 'false';
}

function _GfDarkMediaIsActive() {
  return document.documentElement.getAttribute('data-gf-theme') === 'dark' && !_GfBridged();
}

function _GfElementMatches(element, selector) {
  try { return element.matches(selector); }
  catch (_) { return false; }
}

function _GfIsGradeFlowSurface(element) {
  try { return !!element.closest(GF_DARK_MEDIA_SURFACE_SELECTOR); }
  catch (_) { return false; }
}

function _GfIsMediaContainer(element) {
  try { return _GfElementMatches(element, GF_DARK_MEDIA_CONTAINER_SELECTOR); }
  catch (_) { return false; }
}

function _GfIsNeverDarkMedia(element) {
  try { return _GfElementMatches(element, GF_DARK_MEDIA_NEVER_SELECTOR); }
  catch (_) { return false; }
}

function _GfIsTextIconElement(element) {
  try { return _GfElementMatches(element, GF_DARK_TEXT_ICON_SELECTOR); }
  catch (_) { return false; }
}

function _GfSetDarkMediaInlineFilter(element, value) {
  if (!element || !element.style) return;
  if (!element.hasAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR)) {
    element.setAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR, element.style.getPropertyValue('filter') || '');
    element.setAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_PRIORITY_ATTR, element.style.getPropertyPriority('filter') || '');
  }
  if (element.style.getPropertyValue('filter') !== value || element.style.getPropertyPriority('filter') !== 'important') {
    element.style.setProperty('filter', value, 'important');
  }
}

function _GfRestoreDarkMediaInlineFilter(element) {
  if (!element || !element.style || !element.hasAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR)) return;
  const original = element.getAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR) || '';
  const priority = element.getAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_PRIORITY_ATTR) || '';
  if (original) element.style.setProperty('filter', original, priority);
  else element.style.removeProperty('filter');
  element.removeAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR);
  element.removeAttribute(GF_DARK_MEDIA_ORIGINAL_FILTER_PRIORITY_ATTR);
}

function _GfClosestProtectedMediaAncestor(element) {
  try { return element.parentElement?.closest(`.${GF_DARK_MEDIA_CLASS}`) || null; }
  catch (_) { return null; }
}

function _GfLooksLikeBackgroundMedia(element) {
  if (!element) return false;
  if (_GfIsNeverDarkMedia(element) || _GfIsMediaContainer(element)) return false;
  let backgroundImage = '';
  try { backgroundImage = getComputedStyle(element).backgroundImage || ''; }
  catch (_) { return false; }
  if (!backgroundImage || backgroundImage === 'none' || !backgroundImage.includes('url(')) return false;
  const visibleText = (element.textContent || '').trim();
  if (visibleText.length > 1) return _GfIsTextIconElement(element);
  const nameText = `${element.id || ''} ${element.className || ''} ${element.getAttribute('aria-label') || ''}`;
  return GF_DARK_MEDIA_NAME_RE.test(nameText);
}

const GF_DARK_MEDIA_TAG_SELECTOR = 'img,svg,video,canvas,object,embed,picture,[role="img"],smsc-svg,smsc-icon';
const GF_DARK_MEDIA_FUZZY_SELECTOR = '[class*="smsc-svg" i],[class*="smsc-icon" i],[class*="avatar" i],[class*="profile-pic" i],[class*="profilepic" i],[class*="userpic" i],[class*="user-picture" i],[class*="userpicture" i],[class*="logo" i]';

function _GfIsMediaMatch(element) {
  if (!_GfElementMatches(element, GF_DARK_MEDIA_SELECTOR)) return false;
  if (element.matches(GF_DARK_MEDIA_TAG_SELECTOR) || element.classList.contains(GF_DARK_MEDIA_CLASS) && !element.matches(GF_DARK_MEDIA_FUZZY_SELECTOR)) return true;
  if (!element.matches(GF_DARK_MEDIA_FUZZY_SELECTOR) || element.matches('.icon-label')) return true;
  if (element.querySelector(GF_DARK_MEDIA_TAG_SELECTOR)) return false;
  if ((element.textContent || '').trim().length <= 2) return true;
  try { return getComputedStyle(element).backgroundImage.includes('url('); } catch (_) { return false; }
}

function _GfProtectMediaElement(element) {
  if (!element || element.nodeType !== 1 || !element.classList) return;
  if (_GfIsNeverDarkMedia(element) || _GfIsMediaContainer(element)) {
    element.classList.remove(GF_DARK_MEDIA_CLASS);
    _GfRestoreDarkMediaInlineFilter(element);
    return;
  }
  if (_GfIsGradeFlowSurface(element)) {
    element.classList.remove(GF_DARK_MEDIA_CLASS);
    _GfRestoreDarkMediaInlineFilter(element);
    return;
  }
  if (_GfClosestProtectedMediaAncestor(element) && _GfIsMediaMatch(element)) {
    element.classList.remove(GF_DARK_MEDIA_CLASS);
    _GfSetDarkMediaInlineFilter(element, 'none');
    return;
  }
  const isMedia = _GfIsMediaMatch(element) || _GfLooksLikeBackgroundMedia(element);
  element.classList.toggle(GF_DARK_MEDIA_CLASS, isMedia);
  if (isMedia) _GfSetDarkMediaInlineFilter(element, GF_DARK_MEDIA_FILTER);
  else _GfRestoreDarkMediaInlineFilter(element);
}

function _GfProtectDarkMedia(root = document) {
  if (!_GfDarkMediaIsActive()) return;
  const scope = root && root.nodeType === 1 ? root : document;
  if (scope.nodeType === 1) _GfProtectMediaElement(scope);
  if (!scope.querySelectorAll) return;
  try { scope.querySelectorAll('*').forEach(element => { if (_GfLooksLikeBackgroundMedia(element)) _GfProtectMediaElement(element); }); }
  catch (_) {}
  try { scope.querySelectorAll(GF_DARK_MEDIA_SELECTOR).forEach(element => _GfProtectMediaElement(element)); }
  catch (_) {}
  try { scope.querySelectorAll(GF_DARK_MEDIA_BACKGROUND_SELECTOR).forEach(element => _GfProtectMediaElement(element)); }
  catch (_) {}
}

function _GfClearDarkMediaProtection() {
  document.querySelectorAll(`.${GF_DARK_MEDIA_CLASS},[${GF_DARK_MEDIA_ORIGINAL_FILTER_ATTR}]`).forEach(element => {
    element.classList?.remove(GF_DARK_MEDIA_CLASS);
    _GfRestoreDarkMediaInlineFilter(element);
  });
}

const _gfDarkMediaPending = new Set();

const _gfDarkMediaSolo = new Set();

function _GfScheduleDarkMediaProtection(root = document, delay = 80) {
  if (root) _gfDarkMediaPending.add(root);
  clearTimeout(_gfDarkMediaTimer);
  _gfDarkMediaTimer = setTimeout(() => {
    const roots = [..._gfDarkMediaPending];
    _gfDarkMediaPending.clear();
    for (const el of _gfDarkMediaSolo) if (el.isConnected) _GfProtectMediaElement(el);
    _gfDarkMediaSolo.clear();
    if (roots.includes(document) || roots.length > 150) { _GfProtectDarkMedia(document); return; }
    for (const r of roots) {
      if (r.isConnected && !roots.some(o => o !== r && o.contains(r))) _GfProtectDarkMedia(r);
    }
  }, delay);
}

function _GfStartDarkMediaWatcher() {
  if (!_GfDarkMediaIsActive()) return;
  _GfProtectDarkMedia(document);
  if (_gfDarkMediaObserver || !window.MutationObserver) return;
  const observeRoot = document.body || document.documentElement;
  _gfDarkMediaObserver = new MutationObserver(mutations => {
    let any = false;
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const node = mutation.target;
        const now = node.getAttribute?.('class') || '';
        if (node.nodeType !== 1 || _GfIsGradeFlowSurface(node)) continue;
        if (String(mutation.oldValue || '').replace(GF_DARK_MEDIA_CLASS, '').trim() === now.replace(GF_DARK_MEDIA_CLASS, '').trim()) continue;
        _gfDarkMediaSolo.add(node);
        any = true;
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1 || _GfIsGradeFlowSurface(node)) continue;
        _gfDarkMediaPending.add(node);
        any = true;
      }
    }
    if (any) _GfScheduleDarkMediaProtection(_gfDarkMediaPending.values().next().value || null, 80);
  });
  _gfDarkMediaObserver.observe(observeRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true
  });
}

function _GfStopDarkMediaWatcher() {
  clearTimeout(_gfDarkMediaTimer);
  _gfDarkMediaPending.clear();
  _gfDarkMediaSolo.clear();
  _gfDarkMediaTimer = 0;
  if (_gfDarkMediaObserver) {
    _gfDarkMediaObserver.disconnect();
    _gfDarkMediaObserver = null;
  }
  _GfClearDarkMediaProtection();
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
  _GfStopDarkMediaWatcher();
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
    if (force || signature !== _gfExternalThemeSignature || _gfEffectiveTheme !== 'smpp') {
      GfThemeEngine.stop();
      _GfUseExternalTheme(vars);
    }
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
  setTimeout(() => { clearInterval(_gfExternalThemePoll); _gfExternalThemePoll = setInterval(watch, 2500); }, 10000);
  _gfExternalThemeObserver = new MutationObserver(() => _GfSchedulePageThemeApply(120));
  const observe = () => {
    for (const el of [document.documentElement, document.body]) if (el) _gfExternalThemeObserver.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
  };
  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe, { once: true });
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

function _GfUseCustomTheme(palette) {
  const p = GfCleanPalette(palette);
  const sigNow = JSON.stringify(p);
  if (sigNow === _gfCustomSig && _gfEffectiveTheme === 'custom' && document.documentElement.getAttribute('data-gf-theme-source') === 'custom') return;
  _gfCustomSig = sigNow;
  const vars = GfThemeVars(p);
  _gfExternalThemeVars = vars;
  _gfExternalThemeSignature = '';
  _gfEffectiveTheme = 'custom';
  localStorage.removeItem('gf-smpp-active-cache');
  localStorage.setItem('gf-theme-palette-cache', JSON.stringify(p));
  document.documentElement.removeAttribute('data-gf-theme');
  document.getElementById('gf-dark-flash-shield')?.remove();
  GF_THEME_SHEETS.forEach(({ id }) => document.getElementById(id)?.remove());
  _GfStopDarkMediaWatcher();
  _GfStopNavWatcher();
  _gfSheetRevealed = false;
  if (document.body) {
    document.body.style.opacity = '';
    document.body.style.transition = '';
  }
  _GfSetExternalThemeVars(vars);
  if (p.site) {
    GfThemeEngine.start(p);
    setTimeout(() => _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-theme-status', blocked: GfThemeEngine.blocked() }, '*'), 2500);
  } else GfThemeEngine.stop();
  _GfApplyHomeSummaryTheme(document.getElementById('gf-home-summary'));
  _GfRefreshThemedHosts();
  _GfPostThemeToPanel();
}

function ApplyPageTheme(theme) {
  theme = _GfNormalizeTheme(theme);
  localStorage.setItem('gf-theme-cache', theme);
  const smppTheme = _GfReadSmartschoolPlusPlusTheme();
  if (theme === 'custom' && !smppTheme) {
    if (_gfCustomPalette) _GfUseCustomTheme(_gfCustomPalette);
    else chrome.storage.local.get(GF_THEME_PALETTE_KEY, r => {
      _gfCustomPalette = GfCleanPalette(r?.[GF_THEME_PALETTE_KEY] || GF_THEME_PRESETS[0]);
      if (_gfCurrentTheme === 'custom') _GfUseCustomTheme(_gfCustomPalette);
    });
    return;
  }
  _gfCustomSig = '';
  GfThemeEngine.stop();

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
      _GfStopDarkMediaWatcher();
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
  localStorage.removeItem('gf-theme-palette-cache');
  _GfClearExternalThemeVars();

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-gf-theme', 'dark');
    _GfEnsureThemeSheets(() => { _GfRevealPage(); });
    _GfStartDarkMediaWatcher();
    _GfStartNavWatcher();
  } else {
    document.documentElement.removeAttribute('data-gf-theme');
    document.getElementById('gf-dark-flash-shield')?.remove();
    GF_THEME_SHEETS.forEach(({ id }) => document.getElementById(id)?.remove());
    _GfStopDarkMediaWatcher();
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

chrome.storage.local.get(['gradeflow-theme', GF_THEME_PALETTE_KEY], ({ 'gradeflow-theme': saved, [GF_THEME_PALETTE_KEY]: palette }) => {
  _gfCustomPalette = palette ? GfCleanPalette(palette) : null;
  _gfCurrentTheme = _GfNormalizeTheme(saved);
  _gfSheetRevealed = false;
  _GfStartSmartschoolPlusPlusWatcher();
  _GfSchedulePageThemeApply(40);
  [350, 1200, 2500].forEach(delay => setTimeout(() => _GfSyncSmartschoolPlusPlusTheme(true) || _GfSchedulePageThemeApply(40), delay));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes[GF_HOME_SUMMARY_ENABLED_KEY]) {
    _gfHomeSummaryEnabled = _GfIsHomeSummaryEnabledValue(changes[GF_HOME_SUMMARY_ENABLED_KEY].newValue);
    _GfInitHomeSummary(changes[GF_HOME_SUMMARY_ENABLED_KEY].newValue);
  }

  if (changes['gradeflow-theme']) {
    _gfCurrentTheme = _GfNormalizeTheme(changes['gradeflow-theme'].newValue);
    _gfSheetRevealed = false;
    _GfSchedulePageThemeApply(_gfCurrentTheme === 'custom' ? 0 : 120);
  }

  if (changes[GF_THEME_PALETTE_KEY]) {
    _gfCustomPalette = GfCleanPalette(changes[GF_THEME_PALETTE_KEY].newValue || GF_THEME_PRESETS[0]);
    if (_gfCurrentTheme === 'custom' && _gfEffectiveTheme !== 'smpp') _GfUseCustomTheme(_gfCustomPalette);
  }

  if (changes['gradeflow-grades']) {
    if (_gfHomeSummaryEnabled) _GfRenderHomeSummaryFromRaw(changes['gradeflow-grades'].newValue);
  }
});

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

const _GF_PLANNER_KEY = 'gradeflow-planner-v2';
const _GF_ATTENDANCE_KEY = 'gradeflow-attendance-v2';
if (!localStorage.getItem('gf-v13-cleanup')) {
  chrome.storage.local.remove(['gradeflow-planner-items', 'gradeflow-attendance-items']);
  localStorage.setItem('gf-v13-cleanup', '1');
}

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

const _GF_MONTHS = {
  jan: 1, januari: 1, janvier: 1, january: 1, janv: 1,
  feb: 2, februari: 2, fev: 2, fevr: 2, fevrier: 2, février: 2, févr: 2, february: 2,
  maa: 3, mrt: 3, maart: 3, mar: 3, mars: 3, march: 3,
  apr: 4, april: 4, avr: 4, avril: 4,
  mei: 5, mai: 5, may: 5,
  jun: 6, juni: 6, juin: 6, june: 6,
  jul: 7, juli: 7, juil: 7, juillet: 7, july: 7,
  aug: 8, augustus: 8, aout: 8, août: 8, august: 8,
  sep: 9, sept: 9, september: 9, septembre: 9,
  okt: 10, oct: 10, oktober: 10, octobre: 10, october: 10,
  nov: 11, november: 11, novembre: 11,
  dec: 12, december: 12, decembre: 12, décembre: 12, déc: 12,
};
const _GF_MONTH_RE = new RegExp(`\\b(\\d{1,2})\\s+(${Object.keys(_GF_MONTHS).sort((a, b) => b.length - a.length).join('|')})\\.?\\s+(20\\d{2})\\b`, 'i');
const _GF_SCRAPE_SKIP = '#gradeflow-panel-host,#gradeflow-tab-wrapper,#gf-chat-root,#gf-home-summary,#gf-arcade,header,nav,[role="banner"],[role="navigation"],[role="menu"],[role="tooltip"],[class*="topnav" i],[id*="topnav" i],[class*="notif" i],[id*="notif" i],[class*="message" i],[id*="message" i],[class*="toast" i],[class*="popover" i],[class*="dropdown" i],[class*="tooltip" i],.smsc-top-bar,.smsc-header,script,style,template,noscript';

function _GfSchoolYearStart() {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function _GfValidDate(day, month, year) {
  if (!(month >= 1 && month <= 12 && day >= 1 && day <= 31)) return false;
  const d = new Date(year, month - 1, day);
  return d.getMonth() === month - 1;
}

function _GfFindDate(text, allowNoYear = false) {
  const raw = String(text || '');
  let m = raw.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (m && _GfValidDate(+m[3], +m[2], +m[1])) return { day: +m[3], month: +m[2], year: +m[1], text: m[0] };
  m = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|\d{2})\b/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (_GfValidDate(+m[1], +m[2], year)) return { day: +m[1], month: +m[2], year, text: m[0] };
  }
  m = raw.match(_GF_MONTH_RE);
  if (m) {
    const month = _GF_MONTHS[m[2].toLowerCase()];
    if (month && _GfValidDate(+m[1], month, +m[3])) return { day: +m[1], month, year: +m[3], text: m[0] };
  }
  if (!allowNoYear) return null;
  m = raw.match(/(?:^|[^\d\/.:-])(\d{1,2})\/(\d{1,2})(?![\d\/.:-])/);
  if (!m || !_GfValidDate(+m[1], +m[2], 2000)) return null;
  const start = _GfSchoolYearStart();
  const year = +m[2] >= 8 ? start : start + 1;
  return { day: +m[1], month: +m[2], year, text: `${m[1]}/${m[2]}` };
}

function _GfDateInSchoolYear(found) {
  if (!found) return false;
  const start = _GfSchoolYearStart();
  const t = new Date(found.year, found.month - 1, found.day).getTime();
  return t >= new Date(start, 7, 15).getTime() && t <= new Date(start + 1, 7, 31).getTime();
}

function _GfDateValue(found) {
  return `${found.day}/${found.month}/${found.year}`;
}

function _GfNodeText(el) {
  return String((el.ownerDocument?.defaultView ? el.innerText : el.textContent) || '').replace(/\s+/g, ' ').trim();
}

function _GfScrapeCandidates(root, selector, limit) {
  const body = root.body || root;
  if (!body?.querySelectorAll) return [];
  const out = [];
  for (const el of body.querySelectorAll(selector)) {
    if (el.closest(_GF_SCRAPE_SKIP)) continue;
    out.push(el);
    if (out.length >= limit) break;
  }
  return out;
}

function _GfCollapseRepeat(text) {
  const words = text.split(' ');
  const half = words.length / 2;
  if (words.length >= 2 && words.length % 2 === 0 && words.slice(0, half).join(' ').toLowerCase() === words.slice(half).join(' ').toLowerCase()) return words.slice(0, half).join(' ');
  return text;
}

function _GfPickMinimalRows(entries, sameRow) {
  entries.sort((a, b) => a.text.length - b.text.length);
  const accepted = [];
  for (const entry of entries) {
    const inner = accepted.filter(a => entry.el.contains(a.el));
    if (!inner.length) { accepted.push(entry); continue; }
    if (inner.length === 1 && sameRow(inner[0], entry) && entry.text.length <= inner[0].text.length * 2 + 16) {
      const target = inner[0];
      target.el = entry.el;
      for (const key of Object.keys(entry.info)) if (!target.info[key] && entry.info[key]) target.info[key] = entry.info[key];
      target.text = entry.text;
    }
  }
  return accepted;
}

const _GF_ATT_LATE_RE = /\bte\s*laat\b|\blaatkom|\blaattijdig|\bretard|\blate\b/i;
const _GF_ATT_ABSENT_RE = /afwezig|ziek|attest|dokter|overmacht|begrafenis|gewettigd|spijbel|absen|malad|excus|sick/i;
const _GF_ATT_JUNK_RE = /highcharts|evolutie|totalen|statistiek|grafiek|chart|alle informatie|leerlingvolgsysteem/i;
const _GF_ATT_MOMENT_RE = /\b(VM|NM|voormiddag|namiddag|matin|apr[eè]s-midi|AM|PM)\b/i;
const _GF_ATT_HEADINGS_RE = /\b(alle afwezigheden|afwezigheden|absences|te laat|aanwezigheden|filter|overzicht)\b/gi;
const _GF_ATT_WEEKDAY_RE = /\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|ma|di|wo|do|vr|za|zo|lun|mar|mer|jeu|ven|sam|dim)\.?(?=\s|$)/gi;

const _GF_ATT_ABSENT_CODES = 'ZDBRQPMYUTJA';

function _GfAttendanceCode(el) {
  const leaves = el.children.length ? el.querySelectorAll('*') : [el];
  for (const leaf of leaves) {
    if (leaf.children.length) continue;
    const t = (leaf.textContent || '').trim();
    if (/^[A-Z]$/.test(t)) return t;
  }
  return '';
}

function _GfParseAttendance(el, text) {
  if (text.length < 6 || text.length > 260 || _GF_ATT_JUNK_RE.test(text)) return null;
  const found = _GfFindDate(text, true);
  if (!found || !_GfDateInSchoolYear(found)) return null;
  const code = _GfAttendanceCode(el);
  const late = code === 'L' || _GF_ATT_LATE_RE.test(text);
  const absent = !late && (_GF_ATT_ABSENT_RE.test(text));
  if (!late && !absent && !code) return null;
  const moment = (text.match(_GF_ATT_MOMENT_RE)?.[1] || '').toUpperCase().replace('VOORMIDDAG', 'VM').replace('NAMIDDAG', 'NM');
  let title = text
    .replace(found.text, ' ')
    .replace(_GF_ATT_MOMENT_RE, ' ')
    .replace(_GF_ATT_HEADINGS_RE, ' ')
    .replace(_GF_ATT_WEEKDAY_RE, ' ')
    .replace(code ? new RegExp(`(^|\\s)${code}(?=\\s|$)`, 'g') : /$^/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  title = _GfCollapseRepeat(title).slice(0, 120);
  return {
    date: _GfDateValue(found),
    moment,
    code,
    title,
    type: late ? 'late' : absent || (code && _GF_ATT_ABSENT_CODES.includes(code)) ? 'absent' : 'other',
  };
}

function _GfExtractAttendanceItemsFromDom(root = document, sourcePath = location.pathname) {
  const entries = [];
  for (const el of _GfScrapeCandidates(root, '.lvs-pupilpresences-row,tr,li,[role="row"],[role="listitem"],article,div,section,p,td', 3000)) {
    const text = _GfNodeText(el);
    const info = _GfParseAttendance(el, text);
    if (info) entries.push({ el, text, info });
  }
  const rows = _GfPickMinimalRows(entries, (a, b) => a.info.date === b.info.date && (!a.info.moment || !b.info.moment || a.info.moment === b.info.moment));
  return _GfMergeAttendanceItems(rows.map(r => ({ ...r.info, source: sourcePath })));
}

function _GfAttendanceKey(item) {
  return [item.date, item.moment || '', String(item.title || '').toLowerCase()].join('\u0001');
}

function _GfMergeAttendanceItems(...groups) {
  const out = [];
  for (const item of groups.flat()) {
    if (!item?.date) continue;
    const title = String(item.title || '').toLowerCase();
    const twin = out.find(o => o.date === item.date && (o.moment || '') === (item.moment || '') && (o.title.toLowerCase() === title || (title && o.title.toLowerCase().includes(title)) || (o.title && title.includes(o.title.toLowerCase()))));
    if (twin) {
      if (!twin.code && item.code) twin.code = item.code;
      if (item.title.length > twin.title.length) twin.title = item.title;
      if (twin.type === 'other' && item.type !== 'other') twin.type = item.type;
      continue;
    }
    out.push({ ...item, title: String(item.title || '') });
    if (out.length >= 200) break;
  }
  return out;
}

const _GF_ATTENDANCE_URLS = [
  '/Studentcard',
  '/?module=StudentCard&file=index&function=main',
  '/?module=LVS&file=index&function=main',
];
let _gfAttendanceRefreshPromise = null;

function _GfIsAttendancePage(path = location.pathname + location.search) {
  return /studentcard|module=(lvs|absence|absences)\b|afwezig/i.test(path);
}

function _GfDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function _GfFindAttendanceNavElement(doc) {
  for (const el of _GfScrapeCandidates(doc, 'a,button,[role="tab"],li,span', 1800)) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (text === 'afwezigheden' || text === 'absences' || text === 'aanwezigheden') return el.closest('a,button,[role="tab"],li,[onclick]') || el;
  }
  return null;
}

function _GfActivateAttendanceNav(doc) {
  const target = _GfFindAttendanceNavElement(doc);
  if (!target) return false;
  const link = target.matches('a[href]') ? target : target.querySelector('a[href]');
  link?.setAttribute('target', '_self');
  const view = target.ownerDocument.defaultView;
  for (const type of ['mousedown', 'mouseup', 'click']) target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view }));
  return true;
}

async function _GfLoadAttendanceItemsInFrame(url) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:768px;opacity:0;pointer-events:none;border:0;';
  document.documentElement.appendChild(frame);
  try {
    await new Promise(resolve => {
      frame.addEventListener('load', resolve, { once: true });
      frame.src = url;
      setTimeout(resolve, 4000);
    });
    const deadline = Date.now() + 9000;
    let items = [], stable = 0, navTried = false;
    while (Date.now() < deadline) {
      const doc = frame.contentDocument;
      if (doc?.body) {
        if (!navTried) {
          navTried = true;
          if (_GfActivateAttendanceNav(doc)) { await _GfDelay(800); continue; }
        }
        const next = _GfExtractAttendanceItemsFromDom(doc, url);
        if (next.length > items.length) { items = next; stable = 0; }
        else if (items.length && ++stable >= 2) return items;
      }
      await _GfDelay(500);
    }
    return items;
  } catch (_) {
    return [];
  } finally {
    frame.remove();
  }
}

function _GfStoreAttendanceItems(items) {
  chrome.storage.local.set({ [_GF_ATTENDANCE_KEY]: JSON.stringify(items || []), [_GF_ATTENDANCE_KEY + '-at']: Date.now() }, () => {
    _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-attendance-ready' }, '*');
  });
}

function _GfRefreshAttendanceItems(force = false) {
  if (_gfAttendanceRefreshPromise) return _gfAttendanceRefreshPromise;
  _gfAttendanceRefreshPromise = (async () => {
    if (_GfIsAttendancePage()) {
      const domItems = _GfExtractAttendanceItemsFromDom();
      if (domItems.length) { _GfStoreAttendanceItems(domItems); return domItems; }
    }
    if (!force) {
      const at = (await chrome.storage.local.get(_GF_ATTENDANCE_KEY + '-at'))?.[_GF_ATTENDANCE_KEY + '-at'] || 0;
      if (Date.now() - at < 30 * 60 * 1000) return null;
    }
    for (const url of _GF_ATTENDANCE_URLS) {
      const items = await _GfLoadAttendanceItemsInFrame(url);
      if (items.length) { _GfStoreAttendanceItems(items); return items; }
    }
    chrome.storage.local.set({ [_GF_ATTENDANCE_KEY + '-at']: Date.now() });
    return [];
  })().finally(() => { _gfAttendanceRefreshPromise = null; });
  return _gfAttendanceRefreshPromise;
}

const _GF_PLANNER_TYPES = 'planned-assignments,planned-to-dos';
let _gfPlannerRefreshPromise = null;

function _GfPlannerUserId() {
  const url = document.querySelector('#datePickerMenu')?.getAttribute('plannerurl') || document.querySelector('[plannerurl]')?.getAttribute('plannerurl') || '';
  const fromUrl = url.split('/')[4];
  if (/^\d+_\d+_\d+$/.test(fromUrl || '')) return fromUrl;
  for (const script of document.scripts) {
    const m = script.textContent.match(/authenticatedUser[\\"']*\s*:\s*\{[^}]*?[\\"']id[\\"']*\s*:\s*[\\"']*(\d+_\d+_\d+)/);
    if (m) return m[1];
  }
  try { return localStorage.getItem('gf-planner-user') || ''; } catch (_) { return ''; }
}

function _GfIsoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function _GfPlannerItemFromApi(el) {
  const at = new Date(el?.period?.dateTimeTo || el?.period?.dateTimeFrom || '');
  if (!el?.name || isNaN(at)) return null;
  return {
    id: String(el.id || ''),
    title: String(el.name).trim().slice(0, 160),
    subject: String(el.courses?.[0]?.name || '').trim(),
    dueDate: `${at.getDate()}/${at.getMonth() + 1}/${at.getFullYear()}`,
    dueIso: at.toISOString(),
    type: String(el.assignmentType?.name || (el.plannedElementType === 'planned-to-dos' ? 'To-do' : '')).trim(),
    resolved: el.resolvedStatus === 'resolved',
    url: `${location.origin}/planner/main/`,
    source: 'api',
  };
}

function _GfStorePlannerItems(items) {
  chrome.storage.local.set({ [_GF_PLANNER_KEY]: JSON.stringify(items || []), [_GF_PLANNER_KEY + '-at']: Date.now() }, () => {
    _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-planner-ready' }, '*');
  });
}

function _GfRefreshPlannerItems(force = false) {
  if (_gfPlannerRefreshPromise) return _gfPlannerRefreshPromise;
  _gfPlannerRefreshPromise = (async () => {
    const userId = _GfPlannerUserId();
    if (!userId) return null;
    try { localStorage.setItem('gf-planner-user', userId); } catch (_) {}
    if (!force) {
      const at = (await chrome.storage.local.get(_GF_PLANNER_KEY + '-at'))?.[_GF_PLANNER_KEY + '-at'] || 0;
      if (Date.now() - at < 10 * 60 * 1000) return null;
    }
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 21);
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42);
    const res = await fetch(`/planner/api/v1/planned-elements/user/${encodeURIComponent(userId)}?from=${_GfIsoDay(from)}&to=${_GfIsoDay(to)}&types=${_GF_PLANNER_TYPES}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const seen = new Set();
    const items = data.map(_GfPlannerItemFromApi).filter(item => {
      if (!item) return false;
      const key = item.id || `${item.title}|${item.dueDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.dueIso.localeCompare(b.dueIso)).slice(0, 150);
    _GfStorePlannerItems(items);
    return items;
  })().catch(() => null).finally(() => { _gfPlannerRefreshPromise = null; });
  return _gfPlannerRefreshPromise;
}

function CreateStore() { return {}; }
function CloneStore(store) {
  const out = CreateStore();
  for (const [p, subjects] of Object.entries(store || {})) {
    if (p.startsWith('_')) { out[p] = subjects; continue; }
    out[p] = {};
    for (const [s, payload] of Object.entries(subjects || {})) {
      out[p][s] = { scores: (payload?.scores || []).map(x => ({ ...x })) };
      if (payload?.extra?.length) out[p][s].extra = payload.extra.map(x => ({ ...x }));
    }
  }
  return out;
}
function StoreGrade(store, { subject, period, title, date, scored, max, nc, extra }) {
  if (!subject) return false;
  period = period || 'Onbekend';
  if (!store[period]) store[period] = {};
  if (!store[period][subject]) store[period][subject] = { scores: [] };
  const slot = store[period][subject];
  title = title || '';
  date = date || '';
  if (extra) {
    const list = slot.extra || (slot.extra = []);
    if (list.some(x => x.title === title && x.date === date && x.label === extra.label && x.icon === extra.icon)) return false;
    list.push({ title, date, ...extra, ...(nc ? { nc: true } : {}) });
    return true;
  }
  if (isNaN(scored) || isNaN(max) || max <= 0) return false;
  if (slot.scores.some(x => x.scored === scored && x.max === max && x.title === title && x.date === date)) return false;
  slot.scores.push(nc ? { title, date, scored, max, nc: true } : { title, date, scored, max });
  return true;
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
  return Object.entries(store).filter(([k]) => !k.startsWith('_')).flatMap(([,p]) => Object.values(p)).reduce((n, s) => n + s.scores.length + (s.extra?.length || 0), 0);
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

function _GfNum(v) {
  return parseFloat(String(v).replace(',', '.'));
}

function _GfRangeFrom(text) {
  const m = String(text || '').match(/(\d+(?:[.,]\d+)?)\s*%?\s*(?:-|–|tot|à|to)\s*(\d+(?:[.,]\d+)?)\s*%/i);
  if (!m) return null;
  const lo = _GfNum(m[1]), hi = _GfNum(m[2]);
  return hi >= lo && hi <= 100 ? { lo, hi } : null;
}

function _GfParseGraphic(g) {
  if (!g || typeof g !== 'object') return null;
  const desc = String(g.description ?? '').trim();
  const color = String(g.color || '');
  if (g.type === 'percentage') {
    const frac = desc.match(/^\s*([\d.,]+)\s*\/\s*([\d.,]+)\s*$/);
    if (frac) {
      const scored = _GfNum(frac[1]), max = _GfNum(frac[2]);
      if (Number.isFinite(scored) && max > 0) return { scored, max };
    }
    const range = _GfRangeFrom(desc);
    if (range) return { extra: { kind: 'range', label: desc, pct: (range.lo + range.hi) / 2, lo: range.lo, hi: range.hi, color } };
    const single = desc.match(/^(\d+(?:[.,]\d+)?)\s*%$/);
    if (single) return { extra: { kind: 'percent', label: desc, pct: _GfNum(single[1]), color } };
    if (Number.isFinite(Number(g.value)) && g.value !== null && g.value !== '') return { extra: { kind: 'percent', label: desc || `${g.value}%`, pct: Number(g.value), color } };
    return color ? { extra: { kind: 'label', label: desc, color } } : null;
  }
  if (g.type === 'text') {
    const label = String(g.value ?? '').trim() || desc;
    if (!label) return null;
    const range = _GfRangeFrom(`${label} ${desc}`);
    return { extra: { kind: range ? 'range' : 'label', label, detail: desc && desc !== label ? desc : '', color, ...(range ? { pct: (range.lo + range.hi) / 2, lo: range.lo, hi: range.hi } : {}) } };
  }
  if (g.type === 'icon' && (g.value || color)) {
    return { extra: { kind: 'icon', label: desc, icon: String(g.value || color), color } };
  }
  return null;
}

function NormalizeApiResultToEntries(result) {
  const parsed = _GfParseGraphic(result?.graphic);
  if (!parsed) return [];
  const base = {
    period: result?.period?.name || 'Onbekend',
    title: result?.name || '',
    date: FormatShortDate(result?.date || ''),
    nc: result?.doesCount === false,
  };
  if (parsed.extra) {
    base.extra = { ...parsed.extra, id: String(result?.identifier || '') };
  } else {
    base.scored = parsed.scored;
    base.max = parsed.max;
  }
  return (result?.courses || []).map(c => ({
    subject: c?.name?.trim(),
    graphic: c?.graphic || null,
    ...base,
  })).filter(x => x.subject);
}

const _GF_DETAILS_KEY = 'gradeflow-eval-details-v2';

function _GfDetailSummary(data) {
  const det = data?.details || {};
  const scales = (det.scales || []).map((sc, rank, all) => ({ sc, rank, of: all.length }));
  const goals = new Map();
  let scored = 0, max = 0;
  for (const goal of det.projectGoals || det.goals || []) {
    const g = goal?.graphic;
    if (!g || typeof g !== 'object') continue;
    const parsed = _GfParseGraphic(g);
    if (parsed && !parsed.extra) { scored += parsed.scored; max += parsed.max; continue; }
    const hit = scales.find(({ sc }) => (g.value && sc.value === g.value) || (g.color && sc.color === g.color));
    const label = String(g.description || hit?.sc.description || hit?.sc.name || hit?.sc.label || (parsed?.extra?.kind === 'icon' ? '' : parsed?.extra?.label) || '').trim();
    const pct = Number.isFinite(parsed?.extra?.pct) ? parsed.extra.pct : hit?.sc.type === 'percentage' && Number.isFinite(Number(hit.sc.value)) ? Number(hit.sc.value) : null;
    const icon = g.type === 'icon' ? String(g.value || '') : '';
    const key = `${label}|${icon}|${g.color || ''}`;
    const row = goals.get(key) || { label, icon, color: String(g.color || ''), count: 0, pct, rank: hit ? hit.rank : null, of: hit ? hit.of : null };
    row.count++;
    goals.set(key, row);
  }
  return { goals: [...goals.values()], points: max > 0 ? { scored, max } : null, at: Date.now() };
}

function _GfApplyDetail(x, d) {
  const goals = d.goals || [];
  if (!goals.length) return;
  x.goals = goals;
  const total = goals.reduce((a, g) => a + g.count, 0);
  const top = [...goals].sort((a, b) => b.count - a.count || (a.rank ?? 0) - (b.rank ?? 0))[0];
  if (!x.label && top.label) x.label = top.label;
  if (top.icon) x.icon = top.icon;
  if (top.color) x.color = top.color;
  if (goals.every(g => Number.isFinite(g.pct))) x.pct = goals.reduce((a, g) => a + g.pct * g.count, 0) / total;
  else if (goals.every(g => Number.isFinite(g.rank) && g.of > 1)) {
    x.rank = goals.reduce((a, g) => a + g.rank * g.count, 0) / total;
    x.of = top.of;
  }
}

async function _GfEnrichExtras(store) {
  const slots = [];
  for (const [key, subjects] of Object.entries(store)) {
    if (key.startsWith('_')) continue;
    for (const payload of Object.values(subjects)) if (payload.extra?.some(x => x.id && (x.kind === 'icon' || x.kind === 'label'))) slots.push(payload);
  }
  if (!slots.length) return;
  chrome.storage.local.remove('gradeflow-eval-details-v1');
  const cache = (await chrome.storage.local.get(_GF_DETAILS_KEY))?.[_GF_DETAILS_KEY] || {};
  const ids = [...new Set(slots.flatMap(p => p.extra.filter(x => x.id && (x.kind === 'icon' || x.kind === 'label')).map(x => x.id)))];
  const todo = ids.filter(id => !cache[id] || Date.now() - cache[id].at > 3 * 864e5).slice(0, 150);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(6, todo.length) }, async () => {
    while (i < todo.length) {
      const id = todo[i++];
      try {
        const res = await fetch(`/results/api/v1/evaluations/${encodeURIComponent(id)}`, { credentials: 'include' });
        if (res.ok) cache[id] = _GfDetailSummary(await res.json());
      } catch (_) {}
    }
  }));
  const keys = Object.keys(cache);
  if (keys.length > 400) keys.sort((a, b) => cache[a].at - cache[b].at).slice(0, keys.length - 400).forEach(id => delete cache[id]);
  chrome.storage.local.set({ [_GF_DETAILS_KEY]: cache });
  for (const payload of slots) {
    payload.extra = payload.extra.filter(x => {
      const d = x.id && cache[x.id];
      if (!d) return true;
      if (d.points) {
        payload.scores.push({ title: x.title, date: x.date, scored: d.points.scored, max: d.points.max, ...(x.nc ? { nc: true } : {}) });
        return false;
      }
      _GfApplyDetail(x, d);
      return true;
    });
  }
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

  await _GfEnrichExtras(store);
  const gradeIcons = new Set();
  for (const [key, subjects] of Object.entries(store)) {
    if (key.startsWith('_')) continue;
    for (const payload of Object.values(subjects)) for (const x of payload.extra || []) {
      if (x.icon) gradeIcons.add(x.icon);
      for (const g of x.goals || []) if (g.icon) gradeIcons.add(g.icon);
    }
  }

  const domIcons = ScrapeDomCourseIcons();
  for (const [subj, gfx] of Object.entries(domIcons)) {
    if (!courseIcons[subj]) courseIcons[subj] = gfx;
  }

  const iconValues = [...new Set([
    ...Object.values(courseIcons).map(g => g.value).filter(Boolean),
    ...gradeIcons,
  ])];

  const dataUris = await FetchIconDataUris(iconValues);
  for (const [subj, gfx] of Object.entries(courseIcons)) {
    if (gfx?.value && dataUris[gfx.value]) {
      gfx.dataUri = dataUris[gfx.value];
    }
  }

  store._courseIcons = courseIcons;
  store._gradeIcons = Object.fromEntries([...gradeIcons].filter(v => dataUris[v]).map(v => [v, dataUris[v]]));
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

function _GfOnNav() {
  if (document.body) document.body.style.opacity = '1';
  if (!document.getElementById('gradeflow-tab')) SetupButton();
  setTimeout(_GfInitHomeSummary, 350);
  setTimeout(_GfRefreshPlannerItems, 1500);
  if (_GfIsAttendancePage()) setTimeout(_GfRefreshAttendanceItems, 900);
}

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
  if (_gfNavPatched) {
    _gfNavPatched = false;
    history.pushState    = _gfOrigPush;
    history.replaceState = _gfOrigReplace;
  }
}

function _GfGetPanelIframe() {
  return document.querySelector('#gradeflow-panel-host iframe');
}

function OnPanelMessage(e) {
  if (e.data?.type === 'gf-close') ClosePanel();
  if (e.data?.type === 'gf-f8') {
    _GfGetPanelIframe()?.blur();
    window.focus();
    _GfLaunchArcade();
  }
  if (e.data?.type === 'gf-open-gradeflow') OpenPanel(true);
  if (e.data?.type === 'gf-refresh-planner') _GfRefreshPlannerItems(true);
  if (e.data?.type === 'gf-refresh-attendance') _GfRefreshAttendanceItems(!!e.data.force);
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
  iframe.setAttribute('allow', 'clipboard-write');

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

const _gfLoadedScripts = new Map();

function _GfLoadScripts(files) {
  return Promise.all(files.map(file => {
    if (!_gfLoadedScripts.has(file)) {
      _gfLoadedScripts.set(file, chrome.runtime.sendMessage({ type: 'gf-load-scripts', files: [file] }).then(r => {
        if (!r?.ok) _gfLoadedScripts.delete(file);
        return !!r?.ok;
      }, () => { _gfLoadedScripts.delete(file); return false; }));
    }
    return _gfLoadedScripts.get(file);
  })).then(results => results.every(Boolean));
}
window._GfLoadScripts = _GfLoadScripts;

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
    { id: 'gf-io',      fn: () => typeof BossKeyGradeIo === 'function' && BossKeyGradeIo() },
    { id: 'gf-cr',      fn: () => typeof BossKeyGradeCross === 'function' && BossKeyGradeCross() },
    { id: 'gf-ss',      fn: () => typeof BossKeyGradeSurfers === 'function' && BossKeyGradeSurfers() },
    { id: 'gf-hk',      fn: () => typeof BossKeyGradeHook === 'function' && BossKeyGradeHook() },
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
  if (typeof ToggleGameMenu === 'function') { ToggleGameMenu(grades); return; }
  _GfLoadScripts(['JS/games/game-menu.js']).then(() => { if (typeof ToggleGameMenu === 'function') ToggleGameMenu(grades); });
}

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
      } else if (msg.type === 'gf-theme-refetch') {
        GfThemeEngine.refetch();
        setTimeout(() => _GfGetPanelIframe()?.contentWindow?.postMessage({ type: 'gf-theme-status', blocked: GfThemeEngine.blocked() }, '*'), 2500);
      } else if (msg.type === 'getTheme') {
        sendResponse({ ok: true, theme: _gfEffectiveTheme, savedTheme: _gfCurrentTheme, vars: _gfExternalThemeVars });
        return true;
      } else if (msg.type === 'setHomeSummaryEnabled') {
        _gfHomeSummaryEnabled = _GfIsHomeSummaryEnabledValue(msg.enabled);
        _GfInitHomeSummary(msg.enabled);
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

let _gfInspectAt = [0, 0];
document.addEventListener('mousemove', e => { _gfInspectAt = [e.clientX, e.clientY]; }, { passive: true, capture: true });
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey && e.altKey && e.shiftKey && e.code === 'KeyD')) return;
  e.preventDefault();
  const el = document.elementFromPoint(_gfInspectAt[0], _gfInspectAt[1]);
  if (!el) return;
  const text = JSON.stringify({ gf: '1.3.0', ...GfThemeEngine.inspect(el) });
  const done = ok => {
    const t = document.createElement('div');
    t.id = 'gf-inspect-toast';
    t.textContent = ok ? 'GradeFlow: diagnose gekopieerd, plak ze in je chat' : 'GradeFlow: kopiëren mislukt';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#111;color:#fff;padding:10px 16px;border-radius:8px;font:600 13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.4)';
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };
  navigator.clipboard.writeText(text).then(() => done(true), () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.documentElement.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    done(ok);
  });
}, true);

document.addEventListener('keydown', (e) => {
  if (GfKeys.match(e, 'panel')) {
    e.preventDefault();
    e.stopPropagation();
    OpenPanel(true);
  }
  if (GfKeys.match(e, 'arcade')) {
    e.preventDefault();
    e.stopPropagation();
    _GfLaunchArcade();
  }
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    const panelOpen = document.getElementById('gradeflow-panel-host')?.style.display !== 'none';
    const gameOpen = [...GF_GAME_HOST_IDS, 'gf-arcade'].some(id => { const el = document.getElementById(id); return el && el.style.display !== 'none'; });
    if (panelOpen || gameOpen) { e.preventDefault(); e.stopPropagation(); }
  }
}, true);

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
  if ([...GF_GAME_HOST_IDS, 'gf-arcade'].some(id => document.getElementById(id)?.contains(e.target))) return;
  const activeGame = GF_GAME_HOST_IDS.some(id => {
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
    const scores = (payload?.scores || []).filter(score => !score.nc);
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

function _GfStopHomeSummary() {
  const card = document.getElementById('gf-home-summary');
  const shell = card?.closest?.('.smpp-widget') || null;
  if (shell) _GfCleanupHomeSummaryWidgetShell(shell);
  else if (card) card.remove();
  if (_gfHomeSummaryLayoutObserver) {
    _gfHomeSummaryLayoutObserver.disconnect();
    _gfHomeSummaryLayoutObserver = null;
  }
  clearTimeout(_gfHomeSummaryLayoutTimer);
}

function _GfStartHomeSummaryLayoutWatcher() {
  if (_gfHomeSummaryLayoutObserver || !_GfIsSmartschoolHome() || !document.body) return;
  const schedule = () => {
    if (!_gfHomeSummaryEnabled) return;
    clearTimeout(_gfHomeSummaryLayoutTimer);
    _gfHomeSummaryLayoutTimer = setTimeout(() => {
      if (!_gfHomeSummaryEnabled || !_GfIsSmartschoolHome()) return;
      chrome.storage.local.get('gradeflow-grades', result => {
        if (_gfHomeSummaryEnabled) _GfRenderHomeSummaryFromRaw(result?.['gradeflow-grades'] || '');
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
  if (!_gfHomeSummaryEnabled) { _GfStopHomeSummary(); return; }
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
  if (!_gfHomeSummaryEnabled || !_GfIsSmartschoolHome()) return;
  try { _GfRenderHomeSummary(raw ? JSON.parse(raw) : null); } catch (_) {}
}

function _GfStartHomeSummary() {
  _GfStartHomeSummaryLayoutWatcher();
  chrome.storage.local.get('gradeflow-grades', result => {
    if (_gfHomeSummaryEnabled) _GfRenderHomeSummaryFromRaw(result?.['gradeflow-grades'] || '');
  });
  setTimeout(() => {
    if (!_gfHomeSummaryEnabled) return;
    _GfLoadGradesInBackground().then(store => _GfRenderHomeSummary(store)).catch(() => {});
  }, 900);
}

function _GfInitHomeSummary(enabledOverride) {
  if (!_GfIsSmartschoolHome()) {
    _GfStopHomeSummary();
    return;
  }
  if (!document.body) return;
  if (enabledOverride !== undefined) {
    _gfHomeSummaryEnabled = _GfIsHomeSummaryEnabledValue(enabledOverride);
    if (!_gfHomeSummaryEnabled) { _GfStopHomeSummary(); return; }
    _GfStartHomeSummary();
    return;
  }
  chrome.storage.local.get(GF_HOME_SUMMARY_ENABLED_KEY, settings => {
    _gfHomeSummaryEnabled = _GfIsHomeSummaryEnabledValue(settings?.[GF_HOME_SUMMARY_ENABLED_KEY]);
    if (!_gfHomeSummaryEnabled) { _GfStopHomeSummary(); return; }
    _GfStartHomeSummary();
  });
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
    if (!document.getElementById('gradeflow-tab') && /^\/results(\/|$)/.test(location.pathname)) SetupButton();
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
setTimeout(_GfRefreshPlannerItems, 2500);
if (_GfIsAttendancePage()) setTimeout(_GfRefreshAttendanceItems, 1400);

const _GF_P_SETTINGS_KEY = 'gf-personalization';
const _GF_P_PFP_KEY      = 'gf-profile-picture';
let _gfPersSettings = null;
let _gfPersPfp      = null;
let _gfPersReady    = false;

let _gfDetectedRealName = (typeof window !== 'undefined' && window._gfDetectedRealName) || null;

function _GfNameScanRoot() {
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

let _gfDetectedAvatarSrc = null;
let _gfPfpLastUrl = '';
let _gfPfpBgUrlCache = '';
let _gfBgScanDone = false;

function _GfPfpScanRoot() {
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
    _gfBgScanDone = false;
  }
  const bgUrl = _gfPfpBgUrlCache;
  const skip = '#gradeflow-panel-host, #gf-arcade';

  document.querySelectorAll('[data-gf-orig-src]').forEach(el => {
    if (el.tagName === 'IMG') { if (el.src !== dataUrl) el.src = dataUrl; }
    else if (el.style.backgroundImage !== bgUrl) el.style.backgroundImage = bgUrl;
  });

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

let _gfMsgLinks     = [];
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
  const _GF_MAX_RETRIES = 8;
  const _GF_FAST_INTERVAL = 750;
  const _GF_SLOW_INTERVAL = 8000;

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

  function _GfStartKeepAlive() {
    const ric = window.requestIdleCallback || function (cb) { return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), _GF_SLOW_INTERVAL); };
    function tick() {
      if (!_gfPersReady || !_gfPersSettings) return;
      if (_GfAnyActive()) _GfRunPersonalization();
      ric(tick, { timeout: _GF_SLOW_INTERVAL });
    }
    ric(tick, { timeout: _GF_SLOW_INTERVAL });
  }

  let _gfObsTimer = null;
  let _gfFirstApply = true;

  function _GfMutationCallback(mutations) {
    if (!_gfPersReady || !_GfAnyActive()) return;

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
      const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
      ric(_GfRunPersonalization, { timeout: 1500 });
    }, 800);
  }

  const _gfPersObserver = new MutationObserver(_GfMutationCallback);

  function StartObserving() {
    if (!document.body) return;
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
