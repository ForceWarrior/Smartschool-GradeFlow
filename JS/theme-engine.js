;(function (W) {
  'use strict';
  if (W.GfThemeEngine || W.self !== W.top) return;

  const CACHE_KEY = 'gf-theme-engine-cache';
  const SHEET_PREFIX = 'gf-te:';
  const INDEX_KEY = 'gf-te-index';
  const CACHE_BUDGET = 1500000;
  const ENGINE_VERSION = 'e1';
  const BORDER_SIDES = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
  const PROPS = {
    'color': 'fg', 'background-color': 'bg', 'background-image': 'bg',
    'border-top-color': 'border', 'border-right-color': 'border', 'border-bottom-color': 'border', 'border-left-color': 'border',
    'outline-color': 'border', 'column-rule-color': 'border', 'text-decoration-color': 'fg', 'caret-color': 'fg',
    'fill': 'fg', 'stroke': 'fg', 'box-shadow': 'shadow', 'text-shadow': 'shadow',
  };
  const NAMED = 'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen';
  const TOKEN_SRC = `#[0-9a-f]{3,8}\\b|(?:rgba?|hsla?)\\([^()]*\\)|\\b(?:${NAMED})\\b`;
  const TOKEN_RE = new RegExp(TOKEN_SRC, 'gi');
  const TOKEN_TEST = new RegExp(TOKEN_SRC, 'i');
  const QUICK_RE = /#|rgb|hsl|color|background|border|fill|stroke|shadow|outline/i;
  const VAR_ROLE = [[/background|-bg\b|bg-|surface|fill/i, 'bg'], [/border|outline|divider|separator|shadow/i, 'border'], [/(^|-)color(-|$)|text|foreground|-fg\b|link|icon/i, 'fg']];
  const SMSC_VARS = {
    '--c-white--500': 'bg', '--c-whitesmoke--500': 'bg', '--c-row-hover--500': 'bg', '--c-neutral--500': 'bg',
    '--c-selected-grey--500': 'bg', '--c-border--500': 'border', '--c-grey--500': 'fg', '--c-darkgrey--500': 'fg',
    '--c-black--500': 'fg', '--c-vantablack--500': 'fg', '--c-primary--500': 'bg', '--c-smsc--500': 'bg', '--c-link--500': 'fg',
  };
  const BRAND_HUES = [[19, 14, 0.6], [218, 14, 0.42]];

  let ctx2d = null;
  const parseCache = new Map();
  const docs = new Set();
  let P = null, sig = '', mapCache = new Map(), active = false, pollTimer = 0;

  function Clamp(v, a = 0, b = 1) { return v < a ? a : v > b ? b : v; }

  function ParseHex(h) {
    h = h.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h.slice(0, 6), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }

  function Parse(str) {
    const key = str.toLowerCase();
    if (parseCache.has(key)) return parseCache.get(key);
    let out = null;
    if (key === 'transparent') out = { r: 0, g: 0, b: 0, a: 0 };
    else if (key[0] === '#') out = ParseHex(key);
    else {
      const m = key.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
      if (m) out = { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4] };
      else {
        if (!ctx2d) ctx2d = document.createElement('canvas').getContext('2d');
        ctx2d.fillStyle = '#010203';
        ctx2d.fillStyle = key;
        const v = ctx2d.fillStyle;
        if (v !== '#010203' || key === '#010203') out = v[0] === '#' ? ParseHex(v) : Parse(v);
      }
    }
    if (parseCache.size > 4000) parseCache.clear();
    parseCache.set(key, out);
    return out;
  }

  function ToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  }

  function FromHsl(h, s, l, a = 1) {
    h = ((h % 360) + 360) % 360 / 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => {
      t = (t + 1) % 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    };
    return s === 0 ? { r: l * 255, g: l * 255, b: l * 255, a } : { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255, a };
  }

  function Mix(a, b, t) {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: a.a ?? 1 };
  }

  function Fmt(c) {
    const r = Clamp(Math.round(c.r), 0, 255), g = Clamp(Math.round(c.g), 0, 255), b = Clamp(Math.round(c.b), 0, 255);
    return c.a >= 0.999 ? '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1) : `rgba(${r},${g},${b},${Math.round(c.a * 1000) / 1000})`;
  }

  function HashKey(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return SHEET_PREFIX + (h >>> 0).toString(36);
  }

  function CacheGet(key) {
    try { return JSON.parse(localStorage.getItem(HashKey(key)) || 'null'); } catch (_) { return null; }
  }

  function CacheSet(key, val) {
    try { localStorage.setItem(HashKey(key), JSON.stringify(val)); } catch (_) {}
  }

  function Prune(used) {
    const index = JSON.parse(localStorage.getItem(INDEX_KEY) || '{}');
    const now = Date.now();
    for (const [h, n] of used) index[h] = [now, n];
    let total = 0;
    for (const h of Object.keys(index).sort((a, b) => index[b][0] - index[a][0])) {
      total += index[h][1];
      if (total > CACHE_BUDGET) { delete index[h]; localStorage.removeItem(h); }
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  function Prepare(palette) {
    const c = {};
    for (const k of ['bg', 'surface', 'surface2', 'surface3', 'border', 'text', 'muted', 'accent']) c[k] = Parse(palette[k]) || Parse('#808080');
    c.dark = ToHsl(c.bg).l < 0.5;
    c.accentHsl = ToHsl(c.accent);
    c.surfaceL = ToHsl(c.surface).l;
    c.recolor = palette.recolor !== false;
    return c;
  }

  function Neutral(src, role, hsl) {
    const l = hsl.l;
    const out = c => ({ ...c, a: src.a });
    if (role === 'bg') {
      if (l >= 0.985) return out(P.surface);
      if (l >= 0.925) return out(Mix(P.bg, P.surface, (l - 0.925) / 0.06 * 0.35));
      if (l >= 0.82) return out(Mix(P.surface2, P.bg, (l - 0.82) / 0.105 * 0.3));
      if (l >= 0.55) return out(Mix(P.surface3, P.surface2, (l - 0.55) / 0.27));
      return out(Mix(P.surface3, P.text, Clamp((0.55 - l) / 0.55) * (P.dark ? 0.55 : 0.85)));
    }
    if (role === 'border') {
      if (l >= 0.62) return out(Mix(P.border, P.surface2, Clamp((l - 0.62) / 0.38) * 0.4));
      return out(Mix(P.border, P.muted, Clamp((0.62 - l) / 0.5)));
    }
    if (role === 'shadow') return src;
    if (l <= 0.22) return out(P.text);
    if (l <= 0.5) return out(Mix(P.text, P.muted, (l - 0.22) / 0.28));
    if (l <= 0.72) return out(P.muted);
    return src;
  }

  function Saturated(src, role, hsl) {
    let { h, s, l } = hsl;
    if (P.recolor) {
      for (const [hue, range, minS] of BRAND_HUES) {
        const d = Math.abs(((h - hue) % 360 + 540) % 360 - 180);
        if (d <= range && s >= minS) {
          h = P.accentHsl.h;
          s = Clamp(P.accentHsl.s * Math.min(1.1, s / 0.85));
          if (hue === 19) l = Clamp(l + (P.accentHsl.l - 0.53));
          break;
        }
      }
    }
    if (!P.dark) return FromHsl(h, s, l, src.a);
    if (role === 'bg') {
      if (l > 0.8) return FromHsl(h, Math.min(s, 0.55), Clamp(P.surfaceL + 0.05 + (0.97 - l) * 0.45, 0, 0.42), src.a);
      if (l > 0.58) return FromHsl(h, s, l * 0.86, src.a);
      return FromHsl(h, s, l, src.a);
    }
    if (role === 'border') {
      if (l > 0.72) return FromHsl(h, s * 0.7, Clamp(P.surfaceL + 0.2, 0, 0.5), src.a);
      return FromHsl(h, s, l, src.a);
    }
    if (role === 'shadow') return src;
    if (l < 0.56) return FromHsl(h, Math.min(1, s * 1.05), Clamp(1.06 - l, 0.6, 0.84), src.a);
    return FromHsl(h, s, l, src.a);
  }

  function MapColor(str, role) {
    const key = role + '|' + str;
    const hit = mapCache.get(key);
    if (hit !== undefined) return hit;
    const src = Parse(str);
    let res = str;
    if (src && src.a > 0) {
      const hsl = ToHsl(src);
      res = Fmt(hsl.s < 0.16 || hsl.l > 0.965 || hsl.l < 0.06 ? Neutral(src, role, hsl) : Saturated(src, role, hsl));
    }
    if (mapCache.size > 20000) mapCache.clear();
    mapCache.set(key, res);
    return res;
  }

  function MapValue(value, role) {
    if (!value || /^(inherit|initial|unset|revert|currentcolor|none|auto)$/i.test(value)) return null;
    if (/url\(/i.test(value) && !/gradient/i.test(value)) return null;
    if (!TOKEN_TEST.test(value.replace(/var\([^)]*\)/g, ''))) return null;
    let changed = false;
    const segments = value.split(/(url\([^)]*\))/i);
    const out = segments.map(seg => /^url\(/i.test(seg) ? seg : seg.replace(TOKEN_RE, tok => {
      const m = MapColor(tok, role);
      if (m !== tok) changed = true;
      return m;
    })).join('');
    return changed ? out : null;
  }

  function VarRole(name) {
    if (SMSC_VARS[name]) return SMSC_VARS[name];
    if (/^--c-[a-z-]+--\d+$/.test(name)) return null;
    for (const [re, role] of VAR_ROLE) if (re.test(name)) return role;
    return null;
  }

  function Rules(sheet) {
    try { return sheet.cssRules; } catch (_) { return null; }
  }

  function Extract(rules, wrap, out) {
    for (const rule of rules) {
      if (rule.style && rule.selectorText) {
        const text = rule.style.cssText;
        if (!QUICK_RE.test(text)) continue;
        const decls = [];
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          const role = PROPS[prop] || (prop.startsWith('--') ? VarRole(prop) : null);
          if (!role) continue;
          const value = rule.style.getPropertyValue(prop).trim();
          if (value) decls.push([prop, value, role, rule.style.getPropertyPriority(prop) === 'important']);
        }
        if (decls.length) out.push([wrap, rule.selectorText, decls]);
      } else if (rule.cssRules && (rule.conditionText != null || rule.media)) {
        const kind = rule.constructor.name === 'CSSSupportsRule' ? '@supports' : rule.constructor.name === 'CSSContainerRule' ? '@container' : '@media';
        Extract(rule.cssRules, `${wrap}${kind} ${rule.conditionText || rule.media.mediaText}{`, out);
      } else if (rule.cssRules && rule.constructor.name === 'CSSLayerBlockRule') {
        Extract(rule.cssRules, `${wrap}@layer ${rule.name}{`, out);
      } else if (rule.styleSheet) {
        const inner = Rules(rule.styleSheet);
        if (inner) Extract(inner, wrap, out);
      }
    }
  }

  function Build(decls) {
    let css = '';
    for (const [wrap, sel, list] of decls) {
      let body = '';
      let hits = 0;
      const out = [];
      for (const [prop, value, role, imp] of list) {
        const mapped = MapValue(value, role);
        if (mapped) hits++;
        out.push([prop, `${mapped || value}${imp ? '!important' : ''}`]);
      }
      if (!hits && !list.some(d => PROPS[d[0]] === 'bg' || d[0] === 'color')) continue;
      const sides = out.filter(([prop]) => BORDER_SIDES.includes(prop));
      const collapse = sides.length === 4 && sides.every(([, v]) => v === sides[0][1]);
      for (const [prop, v] of out) {
        if (collapse && BORDER_SIDES.includes(prop)) continue;
        body += `${prop}:${v};`;
      }
      if (collapse) body += `border-color:${sides[0][1]};`;
      const closes = (wrap.match(/\{/g) || []).length;
      css += `${wrap}${sel}{${body}}${'}'.repeat(closes)}\n`;
    }
    return css;
  }

  function BaseCss() {
    const v = k => Fmt(P[k]);
    return `html{background-color:${v('bg')}!important;color:${v('text')};color-scheme:${P.dark ? 'dark' : 'light'};scrollbar-color:${v('surface3')} ${v('bg')}}
body{background-color:${v('bg')};color:${v('text')}}
:where(input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=image]),textarea,select){background-color:${v('surface')};color:${v('text')};border-color:${v('border')}}
:where(button){color:inherit}
:where(a:link,a:visited){color:${MapColor('#1a73e8', 'fg')}}
::selection{background-color:${Fmt({ ...P.accent, a: 0.38 })}}
::placeholder{color:${v('muted')}}
`;
  }

  function SheetKey(sheet) {
    const node = sheet.ownerNode;
    if (sheet.href) return sheet.href;
    return 'inline:' + (node?.textContent?.length || 0) + ':' + (node?.textContent?.slice(0, 80) || '');
  }

  function Own(sheet) {
    const node = sheet.ownerNode;
    return !!node && ((node.id || '').startsWith('gf-') || /^chrome-extension:/.test(sheet.href || ''));
  }

  function DocState(doc) {
    if (!doc.__gfTheme) doc.__gfTheme = { sheets: new Map(), fetching: new Set(), style: null, base: null, inline: new WeakMap(), observer: null, frames: new Set() };
    return doc.__gfTheme;
  }

  function FetchSheet(doc, st, sheet) {
    const href = sheet.href;
    if (!href || st.fetching.has(href)) return;
    st.fetching.add(href);
    chrome.runtime.sendMessage({ type: 'gf-fetch-css', url: href }, res => {
      void chrome.runtime.lastError;
      st.fetching.delete(href);
      if (!res?.css || !active) { st.sheets.set(href, { count: -1, decls: [], css: '', sig, blocked: true }); return; }
      try {
        const parsed = new CSSStyleSheet();
        parsed.replaceSync(res.css.replace(/@import[^;]+;/g, ''));
        const decls = [];
        Extract(parsed.cssRules, '', decls);
        st.sheets.set(href, { count: -2, decls, css: null, sig: '', fetched: true });
        Render(doc);
      } catch (_) {
        st.sheets.set(href, { count: -1, decls: [], css: '', sig, blocked: true });
      }
    });
  }

  function Scan(doc) {
    const st = DocState(doc);
    let changed = false;
    const live = new Set();
    for (const sheet of doc.styleSheets) {
      if (Own(sheet)) continue;
      const key = SheetKey(sheet);
      live.add(key);
      const rules = Rules(sheet);
      const prev = st.sheets.get(key);
      if (!rules) {
        if (prev) continue;
        const cached = doc === document && CacheGet(key);
        if (cached && cached.sig === sig && cached.count === -2) { st.sheets.set(key, { count: -2, decls: null, css: cached.css, sig, fetched: true }); changed = true; }
        else FetchSheet(doc, st, sheet);
        continue;
      }
      if (prev && prev.count === rules.length) { prev.sheet = sheet; continue; }
      const cached = !prev && doc === document && CacheGet(key);
      if (cached && cached.sig === sig && cached.count === rules.length) {
        st.sheets.set(key, { count: rules.length, decls: null, css: cached.css, sig, sheet });
      } else {
        const decls = [];
        Extract(rules, '', decls);
        st.sheets.set(key, { count: rules.length, decls, css: null, sig: '', sheet });
      }
      changed = true;
    }
    for (const key of st.sheets.keys()) if (!live.has(key)) { st.sheets.delete(key); changed = true; }
    return changed;
  }

  function Render(doc) {
    const st = DocState(doc);
    const head = doc.head || doc.documentElement;
    if (!st.base) {
      st.base = doc.createElement('style');
      st.base.id = 'gf-theme-base';
    }
    if (!st.style) {
      st.style = doc.createElement('style');
      st.style.id = 'gf-theme-engine';
    }
    let css = '';
    const keys = [], used = [];
    for (const [key, e] of [...st.sheets]) {
      if (e.css == null || e.sig !== sig) {
        if (!e.decls) {
          const rules = e.sheet && Rules(e.sheet);
          if (!rules) {
            st.sheets.delete(key);
            if (e.fetched) FetchSheet(doc, st, { href: key });
            continue;
          }
          e.decls = [];
          Extract(rules, '', e.decls);
        }
        e.css = Build(e.decls);
        e.sig = sig;
        if (doc === document && !e.blocked && e.css.length < 500000) CacheSet(key, { sig, count: e.count, css: e.css });
      }
      css += e.css;
      if (e.blocked) continue;
      keys.push(key);
      if (e.css.length < 500000) used.push([HashKey(key), e.css.length]);
    }
    st.base.textContent = BaseCss();
    st.style.textContent = css;
    if (st.base.parentNode !== head) head.prepend(st.base);
    if (st.style.parentNode !== head || head.lastElementChild !== st.style) head.appendChild(st.style);
    if (doc === document) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ sig, base: st.base.textContent, keys }));
        Prune(used);
      } catch (_) {}
    }
  }

  const INLINE_PROPS = Object.keys(PROPS);

  function Inline(el, st) {
    if (el.closest?.('#gradeflow-panel-host,#gf-chat-root,#gf-arcade,#gf-home-summary,#gf-update-overlay,[id^="gf-"]')) return;
    const orig = st.inline.get(el) || {};
    const style = el.style;
    for (const prop of INLINE_PROPS) {
      const value = style.getPropertyValue(prop);
      if (orig[prop]?.mapped === value) continue;
      delete orig[prop];
      const mapped = value && MapValue(value, PROPS[prop]);
      if (!mapped) continue;
      const prio = style.getPropertyPriority(prop);
      style.setProperty(prop, mapped, prio);
      orig[prop] = { value, prio, mapped: style.getPropertyValue(prop) };
    }
    for (const [attr, role] of [['bgcolor', 'bg'], ['color', 'fg']]) {
      if (attr === 'color' && el.tagName !== 'FONT') continue;
      const value = el.getAttribute(attr) || '';
      const key = '@' + attr;
      if (orig[key]?.mapped === value) continue;
      delete orig[key];
      const mapped = value && MapValue(value, role);
      if (!mapped) continue;
      el.setAttribute(attr, mapped);
      orig[key] = { value, mapped };
    }
    if (Object.keys(orig).length) st.inline.set(el, orig);
    else st.inline.delete(el);
  }

  function InlineAll(root, st) {
    if (root.nodeType === 1 && (root.hasAttribute('style') || root.hasAttribute('bgcolor') || root.tagName === 'FONT')) Inline(root, st);
    root.querySelectorAll?.('[style],[bgcolor],font[color]').forEach(el => Inline(el, st));
  }

  function Restore(doc) {
    const st = doc.__gfTheme;
    if (!st) return;
    st.observer?.disconnect();
    st.observer = null;
    st.style?.remove();
    st.base?.remove();
    doc.querySelectorAll('[style],[bgcolor],font[color]').forEach(el => {
      const orig = st.inline.get(el);
      if (!orig) return;
      for (const [key, o] of Object.entries(orig)) {
        if (key[0] === '@') { if (el.getAttribute(key.slice(1)) === o.mapped) el.setAttribute(key.slice(1), o.value); }
        else if (el.style.getPropertyValue(key) === o.mapped) el.style.setProperty(key, o.value, o.prio);
      }
    });
    st.inline = new WeakMap();
    for (const frame of st.frames) { try { Restore(frame.contentDocument); } catch (_) {} }
    st.frames.clear();
  }

  function Frame(frame, st) {
    if (st.frames.has(frame)) return;
    st.frames.add(frame);
    const attach = () => {
      let doc = null;
      try { doc = frame.contentDocument; } catch (_) {}
      if (doc && doc.documentElement && active) Attach(doc);
    };
    frame.addEventListener('load', attach);
    attach();
  }

  function Attach(doc) {
    docs.add(doc);
    const st = DocState(doc);
    Scan(doc);
    Render(doc);
    if (doc.body) InlineAll(doc.body, st);
    doc.querySelectorAll('iframe').forEach(f => Frame(f, st));
    if (st.observer) return;
    let pending = false;
    st.observer = new MutationObserver(muts => {
      let sheets = false;
      for (const m of muts) {
        if (m.type === 'attributes') { if (m.target.nodeType === 1) Inline(m.target, st); continue; }
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'STYLE' || (n.tagName === 'LINK' && /stylesheet/i.test(n.rel))) {
            if (n.id?.startsWith('gf-')) continue;
            sheets = true;
            if (n.tagName === 'LINK') n.addEventListener('load', () => { if (active && Scan(doc)) Render(doc); }, { once: true });
          } else if (n.tagName === 'IFRAME') Frame(n, st);
          else {
            InlineAll(n, st);
            n.querySelectorAll?.('iframe').forEach(f => Frame(f, st));
          }
        }
      }
      if (sheets && !pending) {
        pending = true;
        requestAnimationFrame(() => { pending = false; if (active && Scan(doc)) Render(doc); });
      }
    });
    st.observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'bgcolor', 'color'] });
  }

  function Signature(palette) {
    return ENGINE_VERSION + '|' + ['bg', 'surface', 'surface2', 'surface3', 'border', 'text', 'muted', 'accent', 'recolor'].map(k => palette[k]).join('|');
  }

  function Start(palette) {
    const nextSig = Signature(palette);
    const repaint = active && nextSig !== sig;
    P = Prepare(palette);
    sig = nextSig;
    mapCache = new Map();
    active = true;
    if (repaint) for (const doc of docs) { Restore(doc); }
    const go = () => {
      if (!active) return;
      Attach(document);
      const loaded = () => {
        if (active && Scan(document)) Render(document);
        document.getElementById('gf-theme-early')?.remove();
        document.getElementById('gf-theme-early-base')?.remove();
      };
      if (document.readyState === 'complete') loaded();
      else addEventListener('load', loaded, { once: true });
      clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        for (const doc of docs) { if (doc.defaultView && Scan(doc)) Render(doc); }
      }, 3000);
    };
    if (document.head && document.body) go();
    else {
      Early(palette);
      document.addEventListener('DOMContentLoaded', go, { once: true });
    }
  }

  function Early(palette) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      const want = Signature(palette);
      if (!cache || cache.sig !== want) return false;
      const css = (cache.keys || []).map(k => { const c = CacheGet(k); return c && c.sig === want ? c.css : ''; }).join('');
      const head = document.head || document.documentElement;
      for (const [id, text] of [['gf-theme-early-base', cache.base], ['gf-theme-early', css]]) {
        if (!text || document.getElementById(id)) continue;
        const s = document.createElement('style');
        s.id = id;
        s.textContent = text;
        head.appendChild(s);
      }
      return true;
    } catch (_) { return false; }
  }

  function Stop() {
    active = false;
    clearInterval(pollTimer);
    for (const doc of docs) Restore(doc);
    docs.clear();
    document.getElementById('gf-theme-early')?.remove();
    document.getElementById('gf-theme-early-base')?.remove();
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(INDEX_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(SHEET_PREFIX)) localStorage.removeItem(k);
      }
    } catch (_) {}
  }

  function Blocked() {
    let n = 0;
    for (const doc of docs) for (const s of DocState(doc).sheets.values()) if (s.blocked) n++;
    return n;
  }

  W.GfThemeEngine = { start: Start, stop: Stop, early: Early, blocked: Blocked, map: (c, role) => P ? MapColor(c, role) : c };
})(window);
