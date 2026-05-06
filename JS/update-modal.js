;(function _GfUpdateModal() {
  'use strict';

  if (window.self !== window.top) return;

  /* ─────────────────────────────────────────────────────────────
  *  UPDATE CONTENT: edit this block for each new release
   * ───────────────────────────────────────────────────────────── */
  /*  ┌─ SHOW_UPDATE ────────────────────────────────────────────┐
   *  │ Set to TRUE when you want the modal to appear for this  │
   *  │ release.  Once every user has dismissed it, set back to │
   *  │ FALSE so it never fires again until the next release.   │
   *  └────────────────────────────────────────────────────────────┘ */
  const SHOW_UPDATE = true;
  const GF_UPDATE_ALWAYS_SHOW_FOR_TESTING = false;

  const GF_UPDATE = {
    id: 'v1.2.6',               // unique id per update, change each release
    version: '1.2.6',
    image: '',
    features: [
      { icon: '⚙️', titleKey: 'update_feat_toggles',   descKey: 'update_feat_toggles_desc'   },
      { icon: '🌙', titleKey: 'update_feat_darkfix',   descKey: 'update_feat_darkfix_desc'   },
    ],
  };
  /* ───────────────────────────────────────────────────────────── */

  const STORAGE_KEY = 'gf-update-dismissed';
  let _gfUpdateThemeTimer = 0;

  const GF_UPDATE_INLINE_THEME_PROPS = [
    '--upd-bg', '--upd-surf', '--upd-surf-2', '--upd-brd', '--upd-txt', '--upd-txt2', '--upd-txt3',
    '--upd-acc', '--upd-acc-2', '--upd-acc-soft', '--upd-on-acc', '--upd-hero-bg', '--upd-hero-txt',
    '--upd-close-bg', '--upd-close-txt', '--upd-shadow',
  ];

  function CssVar(name) {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (_) { return ''; }
  }

  function ParseColor(value) {
    const raw = String(value || '').trim();
    const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const v = hex[1].length === 3 ? hex[1].split('').map(ch => ch + ch).join('') : hex[1];
      return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
    }
    const rgb = raw.match(/^rgba?\(\s*(\d+(?:\.\d+)?)(?:,|\s+)\s*(\d+(?:\.\d+)?)(?:,|\s+)\s*(\d+(?:\.\d+)?)/i);
    if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    return null;
  }

  function IsDarkColor(value) {
    const color = ParseColor(value);
    if (!color) return false;
    return (color.r * 299 + color.g * 587 + color.b * 114) / 1000 < 130;
  }

  function ReadRootBridgeTheme() {
    const root = document.documentElement;
    if (root.getAttribute('data-gf-theme-source') !== 'smpp') return null;
    const accent = CssVar('--gf-ext-accent');
    const text = CssVar('--gf-ext-text');
    const bg = CssVar('--gf-ext-bg');
    if (!accent || !text || !bg) return null;
    const surface = CssVar('--gf-ext-surface') || bg;
    const surface2 = CssVar('--gf-ext-surface-2') || surface;
    const surface3 = CssVar('--gf-ext-surface-3') || surface2;
    return {
      source: 'smpp', accent, text,
      muted: CssVar('--gf-ext-muted') || text,
      bg, surface, surface2, surface3,
      border: CssVar('--gf-ext-border') || surface3,
      overlay: CssVar('--gf-ext-overlay') || 'rgba(0,0,0,.44)',
      shadow: CssVar('--gf-ext-shadow-strong') || '',
      isDark: root.getAttribute('data-gf-external-dark') === '1' || IsDarkColor(bg),
      glass: root.getAttribute('data-gf-external-glass') === '1',
    };
  }

  function ReadSmartschoolPlusPlusTheme() {
    const shared = typeof window._GfReadSmartschoolPlusPlusTheme === 'function' ? window._GfReadSmartschoolPlusPlusTheme() : null;
    if (shared) return shared;

    const bridged = ReadRootBridgeTheme();
    if (bridged) return bridged;

    const accent = CssVar('--color-accent');
    const text = CssVar('--color-text');
    const bg = CssVar('--color-base00');
    if (!accent || !text || !bg) return null;
    const surface = CssVar('--color-base01') || bg;
    const surface2 = CssVar('--color-base02') || surface;
    const surface3 = CssVar('--color-base03') || surface2;
    return {
      source: 'smpp', accent, text,
      muted: surface3 || text,
      bg, surface, surface2, surface3,
      border: surface3,
      overlay: CssVar('--darken-background') || 'rgba(0,0,0,.44)',
      shadow: '',
      isDark: IsDarkColor(bg),
      glass: document.documentElement.classList.contains('glass') || document.body?.classList.contains('glass'),
    };
  }

  function ClearInlineSppTheme(overlay, modal) {
    if (overlay) overlay.style.removeProperty('--upd-overlay');
    if (modal) GF_UPDATE_INLINE_THEME_PROPS.forEach(name => modal.style.removeProperty(name));
  }

  function ApplyInlineSppTheme(overlay, modal, vars) {
    if (!vars || !modal) return;
    const bg = vars.bg || '#ffffff';
    const surface = vars.surface || bg;
    const surface2 = vars.surface2 || surface;
    const surface3 = vars.surface3 || surface2;
    const text = vars.text || '#171717';
    const muted = vars.muted || text;
    const accent = vars.accent || '#f97316';
    if (overlay) overlay.style.setProperty('--upd-overlay', vars.overlay || 'rgba(0,0,0,.44)');
    modal.style.setProperty('--upd-bg', surface);
    modal.style.setProperty('--upd-surf', surface2);
    modal.style.setProperty('--upd-surf-2', bg);
    modal.style.setProperty('--upd-brd', vars.border || surface3);
    modal.style.setProperty('--upd-txt', text);
    modal.style.setProperty('--upd-txt2', muted);
    modal.style.setProperty('--upd-txt3', muted);
    modal.style.setProperty('--upd-acc', accent);
    modal.style.setProperty('--upd-acc-2', `color-mix(in srgb, ${accent} 82%, ${text})`);
    modal.style.setProperty('--upd-acc-soft', `color-mix(in srgb, ${accent} 16%, transparent)`);
    modal.style.setProperty('--upd-on-acc', IsDarkColor(accent) ? '#fff' : '#111');
    modal.style.setProperty('--upd-hero-bg', surface);
    modal.style.setProperty('--upd-hero-txt', text);
    modal.style.setProperty('--upd-close-bg', surface2);
    modal.style.setProperty('--upd-close-txt', muted);
    modal.style.setProperty('--upd-shadow', vars.shadow || (vars.isDark ? '0 24px 80px rgba(0,0,0,.55)' : '0 24px 80px rgba(0,0,0,.35)'));
  }

  function ReadThemeState() {
    const smpp = ReadSmartschoolPlusPlusTheme();
    if (smpp) return { source: 'smpp', dark: smpp.isDark, glass: !!smpp.glass, vars: smpp };

    const root = document.documentElement;
    const source = root.getAttribute('data-gf-theme-source') === 'smpp' ? 'smpp' : 'gradeflow';
    const dark = source === 'smpp'
      ? root.getAttribute('data-gf-external-dark') === '1'
      : (root.getAttribute('data-gf-theme') === 'dark' || localStorage.getItem('gf-theme-cache') === 'dark');
    return { source, dark, glass: source === 'smpp' && root.getAttribute('data-gf-external-glass') === '1', vars: null };
  }

  function SyncModalTheme() {
    const state = ReadThemeState();
    const overlay = document.getElementById('gf-update-overlay');
    const modal = document.getElementById('gf-upd-modal');
    if (overlay) overlay.dataset.themeSource = state.source;
    if (!modal) return;
    modal.dataset.theme = state.dark ? 'dark' : 'light';
    modal.dataset.themeSource = state.source;
    modal.dataset.glass = state.glass ? '1' : '0';
    if (state.source === 'smpp') ApplyInlineSppTheme(overlay, modal, state.vars);
    else ClearInlineSppTheme(overlay, modal);
  }

  function T(key) {
    return typeof _GfTranslate === 'function' ? _GfTranslate(key) : key;
  }

  function GetLocalDismissedUpdate() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (_) { return null; }
  }

  function GetStoredDismissedUpdate() {
    return new Promise(resolve => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) {
          resolve(GetLocalDismissedUpdate());
          return;
        }

        chrome.storage.local.get(STORAGE_KEY, result => {
          if (chrome.runtime.lastError) {
            resolve(GetLocalDismissedUpdate());
            return;
          }

          resolve(result?.[STORAGE_KEY] || GetLocalDismissedUpdate());
        });
      } catch (_) {
        resolve(GetLocalDismissedUpdate());
      }
    });
  }

  function StoreDismissedUpdate() {
    try { localStorage.setItem(STORAGE_KEY, GF_UPDATE.id); } catch (_) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.set({ [STORAGE_KEY]: GF_UPDATE.id });
    } catch (_) {}
  }

  async function ShouldShow() {
    // 1. Developer kill-switch, if false, never show
    if (!SHOW_UPDATE) return false;

    // 2. Only on SmartSchool home page
    const path = location.pathname;
    if (path !== '/' && path !== '' && !/^\/index/i.test(path) && !/^\/?$/.test(path)) return false;

    // 3. Already dismissed this specific update id → stay gone
    const dismissed = await GetStoredDismissedUpdate();
    if (!GF_UPDATE_ALWAYS_SHOW_FOR_TESTING && dismissed === GF_UPDATE.id) return false;
    return true;
  }

  function Dismiss() {
    StoreDismissedUpdate();
    clearInterval(_gfUpdateThemeTimer);
    const el = document.getElementById('gf-update-overlay');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }
  }

  function Build() {
    const ver  = GF_UPDATE.version;
    const themeState = ReadThemeState();

    const imgUrl = GF_UPDATE.image ? chrome.runtime.getURL(GF_UPDATE.image) : '';

    const featuresHtml = GF_UPDATE.features.map(f => `
      <div class="gf-upd-feat">
        <div class="gf-upd-feat-icon">${f.icon}</div>
        <div>
          <div class="gf-upd-feat-title">${T(f.titleKey)}</div>
          <div class="gf-upd-feat-desc">${T(f.descKey)}</div>
        </div>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'gf-update-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `GradeFlow - ${T('update_title')}`);

    overlay.innerHTML = `
      <div id="gf-upd-modal" data-theme="${themeState.dark ? 'dark' : 'light'}" data-theme-source="${themeState.source}" data-glass="${themeState.glass ? '1' : '0'}">
        <div class="gf-upd-hero">
          <button class="gf-upd-close" id="gf-upd-close" aria-label="${T('update_close')}">✕</button>
          <div class="gf-upd-version-tag">✦ ${T('update_version_prefix')} ${ver}</div>
          <h2 class="gf-upd-title">GradeFlow<br>${T('update_title')}</h2>
          <p class="gf-upd-subtitle">${T('update_subtitle').replace('{v}', ver)}</p>
        </div>
        <div class="gf-upd-body">
          ${imgUrl ? `<div class="gf-upd-img-slot"><img src="${imgUrl}" alt="v${ver} preview" loading="lazy"></div>` : ''}
          <div class="gf-upd-section-label">${T('update_whats_new')}</div>
          <div class="gf-upd-features">${featuresHtml}</div>
          <div class="gf-upd-divider"></div>
          <div class="gf-upd-footer">
            <button class="gf-upd-btn-primary" id="gf-upd-dismiss">${T('update_close')}</button>
          </div>
        </div>
      </div>`;

    InjectCSS();
    document.body.appendChild(overlay);
    SyncModalTheme();

    document.getElementById('gf-upd-close')?.addEventListener('click', Dismiss);
    document.getElementById('gf-upd-dismiss')?.addEventListener('click', Dismiss);
    overlay.addEventListener('click', e => { if (e.target === overlay) Dismiss(); });
    document.addEventListener('keydown', function _esc(e) {
      if (e.key === 'Escape' && document.getElementById('gf-update-overlay')) {
        Dismiss();
        document.removeEventListener('keydown', _esc, true);
      }
    }, true);

    const tobs = new MutationObserver(SyncModalTheme);
    tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme', 'data-gf-theme-source', 'data-gf-external-dark', 'data-gf-external-glass', 'style'] });
    clearInterval(_gfUpdateThemeTimer);
    _gfUpdateThemeTimer = setInterval(() => {
      if (!document.getElementById('gf-update-overlay')) { clearInterval(_gfUpdateThemeTimer); return; }
      SyncModalTheme();
    }, 600);

    requestAnimationFrame(() => overlay.style.opacity = '1');
  }

  function InjectCSS() {
    let s = document.getElementById('gf-upd-css');
    if (!s) {
      s = document.createElement('style');
      s.id = 'gf-upd-css';
      document.head.appendChild(s);
    }
    s.textContent = `
#gf-update-overlay{position:fixed;inset:0;z-index:2147483639;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.64);font-family:"IBM Plex Mono","SF Mono",monospace;opacity:0;transition:opacity .2s ease;}
html[data-gf-theme="dark"] #gf-update-overlay{filter:invert(1) hue-rotate(180deg)!important;background:rgba(0,0,0,.68);}
html[data-gf-theme-source="smpp"] #gf-update-overlay,#gf-update-overlay[data-theme-source="smpp"]{filter:none!important;background:var(--upd-overlay,var(--gf-ext-overlay,rgba(0,0,0,.44)));}
html[data-gf-theme="dark"] #gf-update-overlay[data-theme-source="smpp"]{filter:none!important;background:var(--upd-overlay,var(--gf-ext-overlay,rgba(0,0,0,.44)));}
#gf-upd-modal{--upd-bg:#fff;--upd-surf:#f7f7f7;--upd-surf-2:#fff;--upd-brd:#dedede;--upd-txt:#171717;--upd-txt2:#525252;--upd-txt3:#737373;--upd-acc:#f97316;--upd-acc-2:#ea580c;--upd-acc-soft:rgba(249,115,22,.12);--upd-on-acc:#111;--upd-hero-bg:#fff;--upd-hero-txt:#171717;--upd-close-bg:#f5f5f5;--upd-close-txt:#525252;position:relative;width:min(560px,calc(100vw - 40px));max-height:calc(100vh - 40px);background:var(--upd-bg);border:1px solid var(--upd-brd);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.35);overflow:hidden;display:flex;flex-direction:column;color:var(--upd-txt);}
#gf-upd-modal[data-theme="dark"]{--upd-bg:#101010;--upd-surf:#171717;--upd-surf-2:#121212;--upd-brd:#2b2b2b;--upd-txt:#f4f4f5;--upd-txt2:#c7c7c7;--upd-txt3:#9a9a9a;--upd-on-acc:#111;--upd-hero-bg:#101010;--upd-hero-txt:#f4f4f5;--upd-close-bg:#1f1f1f;--upd-close-txt:#d4d4d4;box-shadow:0 24px 80px rgba(0,0,0,.55);}
#gf-upd-modal[data-theme-source="smpp"]{--upd-bg:var(--gf-ext-surface,#fff);--upd-surf:var(--gf-ext-surface-2,#f7f7f7);--upd-surf-2:var(--gf-ext-bg,#fff);--upd-brd:var(--gf-ext-border,#dedede);--upd-txt:var(--gf-ext-text,#171717);--upd-txt2:var(--gf-ext-muted,#525252);--upd-txt3:var(--gf-ext-muted,#737373);--upd-acc:var(--gf-ext-accent,#f97316);--upd-acc-2:color-mix(in srgb,var(--gf-ext-accent,#f97316) 82%,var(--gf-ext-text,#171717));--upd-acc-soft:color-mix(in srgb,var(--gf-ext-accent,#f97316) 16%,transparent);--upd-on-acc:var(--gf-ext-bg,#111);--upd-hero-bg:var(--gf-ext-surface,#fff);--upd-hero-txt:var(--gf-ext-text,#171717);--upd-close-bg:var(--gf-ext-surface-2,#f5f5f5);--upd-close-txt:var(--gf-ext-muted,#525252);box-shadow:var(--upd-shadow,var(--gf-ext-shadow-strong,0 24px 80px rgba(0,0,0,.35)));}
#gf-upd-modal[data-theme-source="smpp"][data-glass="1"]{background:color-mix(in srgb,var(--gf-ext-surface,#fff) 82%,transparent);backdrop-filter:blur(18px) saturate(1.18);}
.gf-upd-hero{background:var(--upd-hero-bg);padding:30px 28px 23px;position:relative;border-bottom:3px solid var(--upd-acc);}
.gf-upd-close{position:absolute;top:12px;right:14px;background:var(--upd-close-bg);border:1px solid var(--upd-brd);border-radius:8px;color:var(--upd-close-txt);font-size:14px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
.gf-upd-close:hover{background:var(--upd-acc-soft);border-color:color-mix(in srgb,var(--upd-acc) 55%,transparent);color:var(--upd-acc-2);}
.gf-upd-version-tag{display:inline-block;padding:4px 12px;border:1px solid color-mix(in srgb,var(--upd-acc) 52%,transparent);border-radius:20px;font-size:10px;font-weight:800;color:var(--upd-acc);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px;background:var(--upd-acc-soft);}
.gf-upd-title{font-size:26px;font-weight:850;color:var(--upd-hero-txt);letter-spacing:0;line-height:1.2;margin:0 0 8px;}
.gf-upd-subtitle{font-size:13px;color:var(--upd-txt2);margin:0;letter-spacing:0;}
.gf-upd-body{padding:20px 24px 24px;overflow-y:auto;flex:1;}
.gf-upd-body::-webkit-scrollbar{width:4px;} .gf-upd-body::-webkit-scrollbar-thumb{background:var(--upd-brd);border-radius:99px;}
.gf-upd-img-slot{border-radius:10px;overflow:hidden;border:1px solid var(--upd-brd);margin-bottom:18px;line-height:0;}
.gf-upd-img-slot img{width:100%;display:block;}
.gf-upd-section-label{font-size:11px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:var(--upd-acc);margin-bottom:12px;}
.gf-upd-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
.gf-upd-feat{display:flex;gap:10px;padding:12px 14px;border-radius:9px;background:var(--upd-surf);border:1px solid var(--upd-brd);box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
#gf-upd-modal[data-theme="light"] .gf-upd-feat{background:var(--upd-surf);box-shadow:inset 0 1px 0 rgba(255,255,255,.72);}
.gf-upd-feat-icon{font-size:20px;flex-shrink:0;line-height:1.3;}
.gf-upd-feat-title{font-size:12px;font-weight:700;color:var(--upd-txt);margin-bottom:2px;}
.gf-upd-feat-desc{font-size:11px;color:var(--upd-txt2);line-height:1.5;}
.gf-upd-divider{height:1px;background:var(--upd-brd);margin:4px 0 16px;}
.gf-upd-footer{display:flex;justify-content:flex-end;gap:10px;}
.gf-upd-btn-primary{padding:9px 22px;background:var(--upd-acc);color:var(--upd-on-acc);border:1px solid var(--upd-acc-2);border-radius:8px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;transition:background .15s,transform .1s,border-color .15s;}
.gf-upd-btn-primary:hover{background:var(--upd-acc-2);border-color:var(--upd-acc-2);transform:translateY(-1px);}
@media(max-width:560px){.gf-upd-features{grid-template-columns:1fr;}}
`;
  }

  async function Init() {
    if (!(await ShouldShow())) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(Build, 600), { once: true });
    } else {
      setTimeout(Build, 600);
    }
  }

  Init();
})();
