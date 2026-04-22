const SMSC_CDN_HOSTS = [
  'https://static2.smart-school.net',
  'https://static1.smart-school.net',
  'https://static3.smart-school.net',
  'https://static4.smart-school.net',
];

// Personalization cache
const GF_SETTINGS_KEY = 'gf-personalization';
const GF_PFP_KEY      = 'gf-profile-picture';
let _cachedSettings = null;
let _cachedPfp      = null;

chrome.storage.sync.get(GF_SETTINGS_KEY, res => {
  if (!chrome.runtime.lastError) _cachedSettings = res[GF_SETTINGS_KEY] || null;
});
chrome.storage.local.get(GF_PFP_KEY, res => {
  if (!chrome.runtime.lastError) _cachedPfp = res[GF_PFP_KEY] || null;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[GF_SETTINGS_KEY]) {
    _cachedSettings = changes[GF_SETTINGS_KEY].newValue || null;
    _PushToAllSmartSchoolTabs();
  }
  if (area === 'local' && changes[GF_PFP_KEY]) {
    _cachedPfp = changes[GF_PFP_KEY].newValue || null;
    if (_cachedSettings?.pfpChanger) _PushPfpToAllSmartSchoolTabs();
  }
});

function _PushToAllSmartSchoolTabs() {
  if (!_cachedSettings) return;
  chrome.tabs.query({ url: '*://*.smartschool.be/*' }, tabs => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: 'applySettings', settings: _cachedSettings }, () => {
        void chrome.runtime.lastError;
      });
      if (_cachedSettings.pfpChanger && _cachedPfp) {
        chrome.tabs.sendMessage(tab.id, { type: 'applyPfp', dataUrl: _cachedPfp }, () => {
          void chrome.runtime.lastError;
        });
      }
    }
  });
}

function _PushPfpToAllSmartSchoolTabs() {
  if (!_cachedPfp) return;
  chrome.tabs.query({ url: '*://*.smartschool.be/*' }, tabs => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: 'applyPfp', dataUrl: _cachedPfp }, () => {
        void chrome.runtime.lastError;
      });
    }
  });
}

function _ReinjectBadgeAllSmartSchoolTabs() {
  chrome.tabs.query({ url: '*://*.smartschool.be/*' }, tabs => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: 'gf-reinject-badge' }, () => {
        void chrome.runtime.lastError;
      });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url?.includes('smartschool.be')) return;
  if (!_cachedSettings) return;

  chrome.tabs.sendMessage(tabId, { type: 'applySettings', settings: _cachedSettings }, () => {
    void chrome.runtime.lastError;
  });
  if (_cachedSettings.pfpChanger && _cachedPfp) {
    chrome.tabs.sendMessage(tabId, { type: 'applyPfp', dataUrl: _cachedPfp }, () => {
      void chrome.runtime.lastError;
    });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'gf-fetch-svg') return false;
  const val = msg.value;
  (async () => {
    for (const host of SMSC_CDN_HOSTS) {
      for (const url of [
        `${host}/smsc/svg/${val}/${val}_24x24.svg`,
        `${host}/smsc/svg/${val}/${val}.svg`,
      ]) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const text = await res.text();
          if (!text.includes('<svg')) continue;
          sendResponse({ dataUri: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(text))) });
          return;
        } catch (_) {}
      }
    }
    sendResponse({ dataUri: null });
  })();
  return true;
});

if (typeof chrome.commands !== 'undefined' && chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener((cmd) => {
    if (cmd === 'toggle-gf-chat') {
      _gfChatForward('toggleOverlay').catch(() => {});
      return;
    }
    if (cmd !== 'toggle-grade-tetris') return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.sendMessage(tab.id, { type: 'toggle-grade-tetris' }, () => {
        void chrome.runtime.lastError;
      });
    });
  });
}

const _gfChatPorts = new Set();
let _gfChatLastState = null;
let _gfChatOffscreenPromise = null;
const GF_CHAT_OFFSCREEN_URL = 'HTML/chat.html';

async function _gfChatEnsureOffscreen() {
  if (_gfChatOffscreenPromise) return _gfChatOffscreenPromise;
  _gfChatOffscreenPromise = (async () => {
    try {
      if (typeof chrome.runtime.getContexts === 'function') {
        const ctxs = await chrome.runtime.getContexts({
          contextTypes: ['OFFSCREEN_DOCUMENT'],
          documentUrls: [chrome.runtime.getURL(GF_CHAT_OFFSCREEN_URL)],
        });
        if (ctxs && ctxs.length > 0) return;
      }
    } catch (_) {}
    try {
      await chrome.offscreen.createDocument({
        url: GF_CHAT_OFFSCREEN_URL,
        reasons: ['WEB_RTC'],
        justification: 'Persistent peer-to-peer chat connections across SmartSchool page navigations.',
      });
    } catch (e) {
      const m = String(e?.message || e);
      if (!/already|exists/i.test(m)) throw e;
    }
  })().finally(() => { _gfChatOffscreenPromise = null; });
  return _gfChatOffscreenPromise;
}

async function _gfChatForward(cmd, payload) {
  await _gfChatEnsureOffscreen();
  return chrome.runtime.sendMessage({ ns: 'gf-chat-cmd-direct', cmd, payload });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'gf-chat') return;
  _gfChatPorts.add(port);
  port.onDisconnect.addListener(() => {
    _gfChatPorts.delete(port);
    void chrome.runtime.lastError;
  });
  if (_gfChatLastState) {
    try { port.postMessage({ kind: 'state', state: _gfChatLastState }); } catch (_) {}
  }
  _gfChatForward('getState').then((r) => {
    if (r && r.ok && r.state) {
      _gfChatLastState = r.state;
      try { port.postMessage({ kind: 'state', state: r.state }); } catch (_) {}
    }
  }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return false;
  if (msg.ns === 'gf-chat-cmd') {
    (async () => {
      try {
        const r = await _gfChatForward(msg.cmd, msg.payload);
        sendResponse(r);
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }
  if (msg.ns === 'gf-chat-event') {
    if (msg.kind === 'state') {
      _gfChatLastState = msg.state;
      for (const p of _gfChatPorts) {
        try { p.postMessage({ kind: 'state', state: msg.state }); } catch (_) {}
      }
    }
    try { sendResponse({ ok: true }); } catch (_) {}
    return false;
  }
  return false;
});
