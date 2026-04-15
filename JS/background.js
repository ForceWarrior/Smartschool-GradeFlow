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
    if (cmd !== 'toggle-grade-tetris') return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.sendMessage(tab.id, { type: 'toggle-grade-tetris' }, () => {
        void chrome.runtime.lastError;
      });
    });
  });
}
