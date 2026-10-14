;(function (W) {
  'use strict';
  if (W.GfThemeEngine || W.self !== W.top) return;

  const CACHE_KEY = 'gf-theme-engine-cache';
  const SHEET_PREFIX = 'gf-te:';
  const INDEX_KEY = 'gf-te-index';
  const CACHE_BUDGET = 1500000;
  const ENGINE_VERSION = 'e2';
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
  let P = null, sig = '', mapCache = new Map(), active = false, pollTimer = 0, outKeys = new Set();
  const DYN_ATTR = 'data-gf-d';
  const DYN_HOLD = 'data-gf-dr';
  const DYN_SKIP = new Set(['head', 'script', 'style', 'link', 'meta', 'title', 'template', 'noscript', 'svg', 'img', 'video', 'canvas', 'iframe', 'picture', 'object', 'embed', 'br', 'wbr', 'source', 'track', 'math']);
  const GF_ID = /^(gf-|gradeflow-panel-host$)/;
  const GF_HOSTS = '[id^="gf-"],#gradeflow-panel-host,svg,math';
  const SIDES = ['top', 'right', 'bottom', 'left'];

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
        if (!ctx2d) ctx2d = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
        ctx2d.fillStyle = '#010203';
        ctx2d.fillStyle = key;
        const v = ctx2d.fillStyle;
        if (v[0] === '#' && (v !== '#010203' || key === '#010203')) out = ParseHex(v);
        else if (v !== '#010203' && v !== key && /^rgba?\(/.test(v)) out = Parse(v);
        else if (v !== '#010203') {
          ctx2d.clearRect(0, 0, 1, 1);
          ctx2d.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx2d.getImageData(0, 0, 1, 1).data;
          out = { r, g, b, a: a / 255 };
        }
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

  function Key(c) {
    return `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Math.round(c.a * 255)}`;
  }

  function Lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function Contrast(a, b) {
    const x = Lum(a), y = Lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
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
    let brand = false;
    if (P.recolor) {
      for (const [hue, range, minS] of BRAND_HUES) {
        const d = Math.abs(((h - hue) % 360 + 540) % 360 - 180);
        if (d <= range && s >= minS) {
          h = P.accentHsl.h;
          s = Clamp(P.accentHsl.s * Math.min(1.1, s / 0.85));
          if (hue === 19) l = Clamp(l + (P.accentHsl.l - 0.53));
          brand = true;
          break;
        }
      }
    }
    if (!P.dark) return FromHsl(h, s, l, src.a);
    if (role === 'bg') {
      if (l > 0.8) return FromHsl(h, Math.min(s, 0.55), Clamp(P.surfaceL + 0.05 + (0.97 - l) * 0.45, 0, 0.42), src.a);
      if (l > 0.45 && !brand) {
        s = Math.min(s, 0.8);
        l = 0.3 + (l - 0.45) * 0.35;
        while (l > 0.16 && Contrast(FromHsl(h, s, l), P.text) < 4.5) l -= 0.02;
      }
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
    const out = Parse(res);
    if (out) outKeys.add(role + Key(out));
    return res;
  }

  function SplitTop(value) {
    const parts = [];
    let depth = 0, start = 0;
    for (let i = 0; i < value.length; i++) {
      const c = value[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ',' && !depth) { parts.push(value.slice(start, i)); start = i + 1; }
    }
    parts.push(value.slice(start));
    return parts;
  }

  function MapTokens(value, role, known) {
    let changed = false;
    const out = value.replace(TOKEN_RE, tok => {
      const c = Parse(tok);
      if (!c || c.a === 0 || (known && outKeys.has(role + Key(c)))) return tok;
      const m = MapColor(tok, role);
      if (m !== tok) changed = true;
      return m;
    });
    return changed ? out : null;
  }

  function MapShadow(value, known) {
    let changed = false;
    const out = SplitTop(value).map(part => {
      if (!/inset/i.test(part)) return part;
      const nums = part.replace(TOKEN_RE, ' ').match(/-?\d*\.?\d+/g) || [];
      const role = (parseFloat(nums[3]) || 0) > 4 ? 'bg' : 'border';
      return part.replace(TOKEN_RE, tok => {
        const c = Parse(tok);
        if (!c || c.a === 0 || ToHsl(c).l < 0.5 || (known && (outKeys.has('bg' + Key(c)) || outKeys.has('border' + Key(c))))) return tok;
        const m = MapColor(tok, role);
        if (m !== tok) changed = true;
        return m;
      });
    });
    return changed ? out.join(',') : null;
  }

  function MapValue(value, role) {
    if (!value || /^(inherit|initial|unset|revert|currentcolor|none|auto)$/i.test(value)) return null;
    if (role === 'shadow') return /inset/i.test(value) ? MapShadow(value, false) : null;
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

  function NoteCss(css) {
    const re = /(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+)/gi;
    let m;
    while ((m = re.exec(css))) {
      const prop = m[1].toLowerCase();
      const role = PROPS[prop] || (prop === 'border-color' ? 'border' : prop.startsWith('--') ? VarRole(prop) : null);
      if (!role) continue;
      for (const tok of m[2].match(TOKEN_RE) || []) {
        const c = Parse(tok);
        if (c) outKeys.add(role + Key(c));
      }
    }
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
    return `@layer gf-dyn;
html{background-color:${v('bg')}!important;color:${v('text')};color-scheme:${P.dark ? 'dark' : 'light'};scrollbar-color:${v('surface3')} ${v('bg')}}
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
      if (!res?.css || !active) {
        st.sheets.set(href, { count: -1, decls: [], css: '', sig, blocked: true });
        if (active) DynHover(doc, st);
        return;
      }
      try {
        const parsed = new CSSStyleSheet();
        parsed.replaceSync(res.css.replace(/@import[^;]+;/g, ''));
        const decls = [];
        Extract(parsed.cssRules, '', decls);
        st.sheets.set(href, { count: -2, decls, css: null, sig: '', fetched: true });
        Render(doc);
      } catch (_) {
        st.sheets.set(href, { count: -1, decls: [], css: '', sig, blocked: true });
        DynHover(doc, st);
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
        e.noted = true;
        if (doc === document && !e.blocked && e.css.length < 500000) CacheSet(key, { sig, count: e.count, css: e.css });
      }
      if (!e.noted) { NoteCss(e.css); e.noted = true; }
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
    if ([...st.sheets.values()].some(e => e.blocked)) DynHover(doc, st);
    DynQueue(doc, null, true);
  }

  function DynState(doc, st) {
    if (!st.dyn) {
      const style = doc.createElement('style');
      style.id = 'gf-theme-dyn';
      style.textContent = `[${DYN_HOLD}]{transition:none!important}`;
      st.dyn = { style, ids: new Map(), queue: new Set(), solo: new Set(), pending: [], full: false, raf: 0, hover: null };
    }
    const head = doc.head || doc.documentElement;
    if (st.dyn.style.parentNode !== head) head.appendChild(st.dyn.style);
    return st.dyn;
  }

  function DynQueue(doc, el, full, shallow = false) {
    if (!active || !doc.defaultView) return;
    const d = DynState(doc, DocState(doc));
    if (full) d.full = true;
    else if (el === doc.documentElement || el === doc.body) d.solo.add(el);
    else if (el && shallow && el.getElementsByTagName('*').length > 400) { d.solo.add(el); for (const c of el.children) d.solo.add(c); }
    else if (el) d.queue.add(el);
    if (!d.raf) d.raf = doc.defaultView.requestAnimationFrame(() => DynFlush(doc));
  }

  function DynHover(doc, st) {
    const d = DynState(doc, st);
    if (d.hover) return;
    d.hover = e => {
      let el = e.target;
      for (let i = 0; el && el.nodeType === 1 && i < 3; i++, el = el.parentElement) d.solo.add(el);
      if (!d.raf) d.raf = doc.defaultView.requestAnimationFrame(() => DynFlush(doc));
    };
    for (const t of ['mouseover', 'mouseout', 'focusin', 'focusout']) doc.addEventListener(t, d.hover, true);
    DynQueue(doc, null, true);
  }

  function OwnText(el) {
    for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.data.trim()) return true;
    return false;
  }

  function Collect(doc, root, out, seen) {
    if (root.nodeType !== 1 || DYN_SKIP.has(root.localName)) return;
    const walker = doc.createTreeWalker(root, 1, { acceptNode: n => DYN_SKIP.has(n.localName) || (n.id && GF_ID.test(n.id)) ? 2 : 1 });
    for (let n = root; n; n = walker.nextNode()) if (!seen.has(n)) { seen.add(n); out.push(n); }
  }

  function DynFlush(doc) {
    const st = DocState(doc), d = st.dyn;
    if (!d) return;
    d.raf = 0;
    if (!active || !doc.body) return;
    if (d.full || (!d.pending.length && d.queue.size)) {
      const roots = d.full ? [doc.body] : [...d.queue].filter(n => n.isConnected).sort((a, b) => a.compareDocumentPosition(b) & 2 ? 1 : -1);
      const seen = new Set();
      d.pending = [];
      d.full = false;
      d.queue.clear();
      for (const root of roots) if (root === doc.body || !root.closest(GF_HOSTS)) Collect(doc, root, d.pending, seen);
    }
    const els = d.pending.splice(0, 1500).filter(n => n.isConnected);
    const seen = new Set(els);
    let extra = false;
    for (const el of d.solo) if (el.isConnected && !seen.has(el) && !DYN_SKIP.has(el.localName) && !el.closest(GF_HOSTS)) { els.push(el); extra = true; }
    d.solo.clear();
    if (extra) els.sort((a, b) => a === b ? 0 : a.compareDocumentPosition(b) & 2 ? 1 : -1);
    if (els.length) DynApply(doc, d, els);
    if ((d.pending.length || d.queue.size || d.full) && !d.raf) d.raf = doc.defaultView.requestAnimationFrame(() => DynFlush(doc));
  }

  function Remap(str, role) {
    const c = Parse(str);
    if (!c || c.a === 0 || outKeys.has(role + Key(c))) return null;
    const m = MapColor(str, role);
    const mc = Parse(m);
    return mc && Key(mc) !== Key(c) ? m : null;
  }

  function DynApply(doc, d, els) {
    const view = doc.defaultView;
    const held = [];
    for (const el of els) {
      if (!el.hasAttribute(DYN_ATTR)) continue;
      el.setAttribute(DYN_HOLD, '');
      el.removeAttribute(DYN_ATTR);
      held.push(el);
    }
    const ebg = new Map();
    const Effective = el => {
      if (!el || el === doc.documentElement) return P.bg;
      if (ebg.has(el)) return ebg.get(el);
      const cs = view.getComputedStyle(el);
      let r;
      if (cs.backgroundImage !== 'none' && (cs.backgroundImage.includes('url(') || !cs.backgroundImage.match(TOKEN_RE))) r = null;
      else if (cs.backgroundImage !== 'none') r = Parse(MapTokens(cs.backgroundImage, 'bg', true)?.match(TOKEN_RE)?.[0] || cs.backgroundImage.match(TOKEN_RE)[0]);
      else {
        const c = Parse(Remap(cs.backgroundColor, 'bg') || cs.backgroundColor);
        r = c && c.a >= 0.6 ? c : Effective(el.parentElement);
      }
      ebg.set(el, r);
      return r;
    };
    const writes = [];
    for (const el of els) {
      const cs = view.getComputedStyle(el);
      let body = '';
      const bg = Remap(cs.backgroundColor, 'bg');
      if (bg) body += `background-color:${bg}!important;`;
      const sides = [];
      for (const side of SIDES) {
        if (cs[`border-${side}-style`] === 'none' || !parseFloat(cs[`border-${side}-width`]) || cs[`border-${side}-color`] === cs.color) continue;
        const m = Remap(cs[`border-${side}-color`], 'border');
        if (m) sides.push([side, m]);
      }
      if (sides.length === 4 && sides.every(x => x[1] === sides[0][1])) body += `border-color:${sides[0][1]}!important;`;
      else for (const [side, m] of sides) body += `border-${side}-color:${m}!important;`;
      const img = cs.backgroundImage;
      const grad = img !== 'none' && !img.includes('url(');
      const gimg = grad ? MapTokens(img, 'bg', true) : null;
      if (gimg) body += `background-image:${gimg}!important;`;
      if (cs.boxShadow !== 'none' && cs.boxShadow.includes('inset')) {
        const sh = MapShadow(cs.boxShadow, true);
        if (sh) body += `box-shadow:${sh}!important;`;
      }
      let pseudo = '';
      if (d.hover) for (const pe of ['::before', '::after']) {
        const ps = view.getComputedStyle(el, pe);
        if (ps.content === 'none' || ps.content === 'normal') continue;
        let pb = '';
        const pbg = Remap(ps.backgroundColor, 'bg');
        if (pbg) pb += `background-color:${pbg}!important;`;
        if (ps.backgroundImage !== 'none' && !ps.backgroundImage.includes('url(')) {
          const pg = MapTokens(ps.backgroundImage, 'bg', true);
          if (pg) pb += `background-image:${pg}!important;`;
        }
        const pfg = Remap(ps.color, 'fg');
        if (pfg) pb += `color:${pfg}!important;`;
        if (pb) pseudo += `${pe}{${pb}}`;
      }
      let fg = Remap(cs.color, 'fg');
      const first = grad ? (gimg || img).match(TOKEN_RE)?.[0] : null;
      const own = first ? Parse(first) : Parse(bg || cs.backgroundColor);
      const eb = img !== 'none' && !grad ? null : own && own.a >= 0.6 ? own : Effective(el.parentElement);
      ebg.set(el, eb);
      if (eb && OwnText(el)) {
        const tc = Parse(fg || cs.color);
        if (tc && tc.a > 0.4 && Contrast(tc, eb) < 3) {
          const best = Contrast(P.text, eb) >= Contrast(P.bg, eb) ? P.text : P.bg;
          if (Key(best) !== Key(tc)) fg = Fmt(best);
        }
      }
      if (fg) body += `color:${fg}!important;`;
      if (body || pseudo) {
        writes.push([el, body + (pseudo ? '\u0001' + pseudo : '')]);
        if (!el.hasAttribute(DYN_HOLD) && /[1-9]/.test(cs.transitionDuration)) { el.setAttribute(DYN_HOLD, ''); held.push(el); }
      }
    }
    let rules = '';
    for (const [el, body] of writes) {
      let id = d.ids.get(body);
      if (id == null) {
        id = d.ids.size;
        d.ids.set(body, id);
        const [own, pseudo] = body.split('\u0001');
        const sel = `[${DYN_ATTR}="${id}"]`;
        if (own) rules += `${sel}{${own}}`;
        if (pseudo) rules += pseudo.replace(/(::(?:before|after))\{/g, `${sel}$1{`);
      }
      el.setAttribute(DYN_ATTR, id);
    }
    if (rules) d.style.textContent += `@layer gf-dyn{${rules}}`;
    if (held.length) view.requestAnimationFrame(() => { for (const el of held) el.removeAttribute(DYN_HOLD); });
  }

  function DynStop(doc, st) {
    const d = st.dyn;
    if (!d) return;
    if (d.raf) doc.defaultView?.cancelAnimationFrame(d.raf);
    if (d.hover) for (const t of ['mouseover', 'mouseout', 'focusin', 'focusout']) doc.removeEventListener(t, d.hover, true);
    d.style.remove();
    doc.querySelectorAll(`[${DYN_ATTR}],[${DYN_HOLD}]`).forEach(el => { el.removeAttribute(DYN_ATTR); el.removeAttribute(DYN_HOLD); });
    st.dyn = null;
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
    DynStop(doc, st);
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
        if (m.type === 'attributes') {
          if (m.target.nodeType !== 1) continue;
          if (m.attributeName !== 'class') Inline(m.target, st);
          DynQueue(doc, m.target, false, true);
          continue;
        }
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
            DynQueue(doc, n);
          }
        }
      }
      if (sheets && !pending) {
        pending = true;
        requestAnimationFrame(() => { pending = false; if (active && Scan(doc)) Render(doc); });
      }
    });
    st.observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'bgcolor', 'color', 'class'] });
  }

  function Signature(palette) {
    return ENGINE_VERSION + '|' + ['bg', 'surface', 'surface2', 'surface3', 'border', 'text', 'muted', 'accent', 'recolor'].map(k => palette[k]).join('|');
  }

  function Start(palette) {
    const nextSig = Signature(palette);
    const changed = nextSig !== sig;
    const repaint = active && changed;
    P = Prepare(palette);
    sig = nextSig;
    if (changed || !outKeys.size) {
      mapCache = new Map();
      outKeys = new Set();
    }
    for (const k of ['bg', 'surface', 'surface2', 'surface3', 'accent']) outKeys.add('bg' + Key(P[k]));
    for (const k of ['text', 'muted', 'accent', 'bg']) outKeys.add('fg' + Key(P[k]));
    for (const k of ['border', 'surface3']) outKeys.add('border' + Key(P[k]));
    active = true;
    if (repaint) for (const doc of docs) { Restore(doc); }
    const go = () => {
      if (!active) return;
      Attach(document);
      const loaded = () => {
        if (active && Scan(document)) Render(document);
        document.getElementById('gf-theme-early')?.remove();
        document.getElementById('gf-theme-early-base')?.remove();
        DynQueue(document, null, true);
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

  function Refetch() {
    for (const doc of docs) {
      const st = DocState(doc);
      let any = false;
      for (const [k, e] of st.sheets) if (e.blocked) { st.sheets.delete(k); any = true; }
      if (any) Scan(doc);
    }
  }

  function Blocked() {
    let n = 0;
    for (const doc of docs) for (const s of DocState(doc).sheets.values()) if (s.blocked) n++;
    return n;
  }

  W.GfThemeEngine = { start: Start, stop: Stop, early: Early, blocked: Blocked, refetch: Refetch, map: (c, role) => P ? MapColor(c, role) : c };
})(window);
