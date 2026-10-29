;(function (W) {
  'use strict';
  if (W.GfKeys) return;

  const STORE_KEY = 'gf-keybinds';
  const CACHE_KEY = 'gf-keybinds-cache';
  const DEFAULTS = {
    panel: { key: 'F6' },
    chat: { key: 'F7' },
    arcade: { key: 'F8' },
    pause: { key: 'p' },
    restart: { key: 'r' },
  };
  const CANONICAL = { pause: { key: 'p', code: 'KeyP' }, restart: { key: 'r', code: 'KeyR' } };
  const GAME_HOSTS = '#gf-tetris,#gf-snake,#gf-2048,#gf-sweep,#gf-memory,#gf-shooter,#gf-bo,#gf-po,#gf-fl,#gf-rn,#gf-tw,#gf-io,#gf-cr,#gf-ss,#gf-hk';
  const listeners = new Set();
  let custom = {};

  try { custom = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { custom = {}; }

  function NormKey(key) {
    if (key === 'Spacebar') return ' ';
    return key && key.length === 1 ? key.toLowerCase() : key;
  }

  function Clean(b) {
    if (!b || typeof b.key !== 'string' || !b.key) return null;
    const out = { key: NormKey(b.key) };
    if (b.shift) out.shift = true;
    if (b.ctrl) out.ctrl = true;
    if (b.alt) out.alt = true;
    if (b.meta) out.meta = true;
    return out;
  }

  function Apply(raw) {
    const next = {};
    for (const action of Object.keys(DEFAULTS)) {
      const b = Clean(raw?.[action]);
      if (b) next[action] = b;
    }
    custom = next;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(custom)); } catch (_) {}
    listeners.forEach(fn => fn());
  }

  try {
    chrome.storage.local.get(STORE_KEY, r => Apply(r?.[STORE_KEY] || {}));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[STORE_KEY]) Apply(changes[STORE_KEY].newValue || {});
    });
  } catch (_) {}

  function Get(action) { return custom[action] || DEFAULTS[action]; }
  function IsDefault(action) { return !custom[action]; }
  function Printable(b) { return b.key.length === 1 && !b.ctrl && !b.alt && !b.meta; }

  function IsEditable(t) {
    return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''));
  }

  function MatchBinding(e, b) {
    if (!b || NormKey(e.key) !== b.key) return false;
    if (!!e.ctrlKey !== !!b.ctrl || !!e.altKey !== !!b.alt || !!e.metaKey !== !!b.meta) return false;
    if (b.key.length > 1 && b.shift && !e.shiftKey) return false;
    return true;
  }

  function Match(e, action) {
    const b = Get(action);
    if (Printable(b) && IsEditable(e.composedPath?.()[0] || e.target)) return false;
    return MatchBinding(e, b);
  }

  function FromEvent(e) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'Dead', 'Unidentified', 'Process'].includes(e.key)) return null;
    return Clean({ key: e.key, shift: e.shiftKey && e.key.length > 1, ctrl: e.ctrlKey, alt: e.altKey, meta: e.metaKey });
  }

  function KeyName(key) {
    if (key === ' ') return 'Space';
    if (key.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[key];
    return key.length === 1 ? key.toUpperCase() : key;
  }

  function Label(action, b = Get(action)) {
    if (!b) return '';
    return [b.ctrl && 'Ctrl', b.alt && 'Alt', b.meta && 'Meta', b.shift && 'Shift', KeyName(b.key)].filter(Boolean).join('+');
  }

  function Save(next) {
    try { chrome.storage.local.set({ [STORE_KEY]: next }); } catch (_) {}
    Apply(next);
  }

  function Bind(action, binding) {
    const b = Clean(binding);
    if (!b || !DEFAULTS[action]) return;
    const next = { ...custom };
    if (Label(action, b) === Label(action, DEFAULTS[action])) delete next[action];
    else next[action] = b;
    Save(next);
  }

  function Reset(action) {
    const next = { ...custom };
    if (action) delete next[action];
    Save(action ? next : {});
  }

  function Conflict(action, b) {
    return Object.keys(DEFAULTS).find(other => other !== action && Label(other) === Label(action, b)) || null;
  }

  function GameOpen() {
    for (const el of document.querySelectorAll(GAME_HOSTS)) if (el.style.display !== 'none' && el.dataset.bossHidden !== '1') return true;
    return false;
  }

  if (W.self !== W.top && !/^chrome-extension:/.test(location.protocol)) {
    W.addEventListener('keydown', e => {
      for (const action of ['panel', 'arcade']) {
        if (!Match(e, action)) continue;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) try { W.top.postMessage({ type: 'gf-frame-key', action }, '*'); } catch (_) {}
        return;
      }
    }, true);
  }

  if (W.self === W.top && !/^chrome-extension:/.test(location.protocol)) {
    W.addEventListener('keydown', e => {
      if (!e.isTrusted || (IsDefault('pause') && IsDefault('restart')) || IsEditable(e.composedPath()[0] || e.target) || !GameOpen()) return;
      for (const action of ['pause', 'restart']) {
        if (IsDefault(action) || !MatchBinding(e, Get(action))) continue;
        e.preventDefault();
        e.stopImmediatePropagation();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: CANONICAL[action].key, code: CANONICAL[action].code, bubbles: true, cancelable: true }));
        return;
      }
      const k = NormKey(e.key);
      for (const action of ['pause', 'restart']) {
        if (!IsDefault(action) && k === CANONICAL[action].key && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.stopImmediatePropagation();
          return;
        }
      }
    }, true);
  }

  W.GfKeys = {
    ACTIONS: Object.keys(DEFAULTS),
    get: Get,
    match: Match,
    label: Label,
    set: Bind,
    reset: Reset,
    isDefault: IsDefault,
    fromEvent: FromEvent,
    conflict: Conflict,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})(window);
