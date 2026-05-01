const SMSC_CDN_HOSTS = [
  'https://static2.smart-school.net',
  'https://static1.smart-school.net',
  'https://static3.smart-school.net',
  'https://static4.smart-school.net',
];

// Personalization cache
const GF_SETTINGS_KEY = 'gf-personalization';
const GF_PFP_KEY      = 'gf-profile-picture';
const GF_STUDY_KEY    = 'gradeflow-study-sessions';
const GF_STUDY_ALARM_PREFIX = 'gf-study:';
let _cachedSettings = null;
let _cachedPfp      = null;

function _GfStudySessionsFrom(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && item.id && item.startAt);
  } catch (_) { return []; }
}

function _GfStudyFutureSessions(sessions) {
  const now = Date.now();
  return _GfStudySessionsFrom(sessions).filter(session => new Date(session.startAt).getTime() > now);
}

function _GfStudyAlarmName(id) {
  return `${GF_STUDY_ALARM_PREFIX}${id}`;
}

function _GfStudyScheduleSession(session) {
  const startTime = new Date(session.startAt).getTime();
  if (!Number.isFinite(startTime) || startTime <= Date.now()) return;
  chrome.alarms.create(_GfStudyAlarmName(session.id), { when: startTime });
}

function _GfStudyScheduleAll() {
  chrome.storage.local.get(GF_STUDY_KEY, result => {
    if (chrome.runtime.lastError) return;
    const storedSessions = _GfStudySessionsFrom(result?.[GF_STUDY_KEY]);
    const futureSessions = _GfStudyFutureSessions(storedSessions);
    if (futureSessions.length !== storedSessions.length) {
      chrome.storage.local.set({ [GF_STUDY_KEY]: futureSessions });
      return;
    }
    chrome.alarms.getAll(alarms => {
      for (const alarm of alarms || []) {
        if (alarm.name.startsWith(GF_STUDY_ALARM_PREFIX)) chrome.alarms.clear(alarm.name);
      }
      for (const session of futureSessions) _GfStudyScheduleSession(session);
    });
  });
}

function _GfStudyNotify(session) {
  const duration = Number(session.durationMin) || 0;
  const title = session.subject ? `Study: ${session.subject}` : 'Study reminder';
  const bits = [];
  if (session.topic) bits.push(session.topic);
  if (duration > 0) bits.push(`${duration} min`);
  chrome.notifications.create(`gradeflow-study-${session.id}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('Assets/icon.png'),
    title,
    message: bits.join(' • ') || 'Time to study.',
    priority: 1,
  }, () => { void chrome.runtime.lastError; });
}

function _GfStudyRemoveSession(id) {
  chrome.storage.local.get(GF_STUDY_KEY, result => {
    const sessions = _GfStudySessionsFrom(result?.[GF_STUDY_KEY]);
    const next = sessions.filter(session => session.id !== id);
    chrome.storage.local.set({ [GF_STUDY_KEY]: next });
  });
}

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
  if (area === 'local' && changes[GF_STUDY_KEY]) _GfStudyScheduleAll();
});

chrome.runtime.onInstalled.addListener(_GfStudyScheduleAll);
chrome.runtime.onStartup.addListener(_GfStudyScheduleAll);

chrome.alarms.onAlarm.addListener(alarm => {
  if (!alarm.name.startsWith(GF_STUDY_ALARM_PREFIX)) return;
  const id = alarm.name.slice(GF_STUDY_ALARM_PREFIX.length);
  chrome.storage.local.get(GF_STUDY_KEY, result => {
    const session = _GfStudySessionsFrom(result?.[GF_STUDY_KEY]).find(item => item.id === id);
    if (!session) return;
    _GfStudyNotify(session);
    _GfStudyRemoveSession(id);
  });
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
  if (msg?.type === 'gf-study-sync') {
    _GfStudyScheduleAll();
    try { sendResponse({ ok: true }); } catch (_) {}
    return false;
  }

  if (msg?.type === 'gf-notify') {
    try {
      chrome.notifications.create(msg.id || `gradeflow-${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('Assets/icon.png'),
        title: String(msg.title || 'GradeFlow'),
        message: String(msg.message || ''),
        priority: 1,
      }, () => {
        void chrome.runtime.lastError;
        try { sendResponse({ ok: true }); } catch (_) {}
      });
      return true;
    } catch (e) {
      try { sendResponse({ ok: false, error: String(e?.message || e) }); } catch (_) {}
      return false;
    }
  }

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
