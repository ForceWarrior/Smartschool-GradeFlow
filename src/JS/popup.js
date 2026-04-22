// SVG icons
const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

// Storage key
const KEY_THEME = 'gradeflow-theme';

// State
let pageTheme = 'light';

// DOM refs
const toggleBtn  = document.getElementById('theme-toggle');
const presetBtns = document.querySelectorAll('.preset-btn');

// Popup appearance
function ApplyPopupAppearance(base) {
  document.documentElement.setAttribute('data-theme', base === 'dark' ? 'dark' : '');
  toggleBtn.innerHTML = base === 'dark' ? SUN_SVG : MOON_SVG;
  toggleBtn.title = base === 'dark' ? 'Switch to Smartschool theme' : 'Switch to Dark theme';
}

// Preset highlight
function UpdatePresetHighlight() {
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === pageTheme);
  });
}

// Activate
function ActivatePreset(preset) {
  pageTheme = preset;
  ApplyPopupAppearance(preset);
  UpdatePresetHighlight();
  chrome.storage.local.set({ [KEY_THEME]: preset });
}

// Header buttons
toggleBtn.addEventListener('click', () => ActivatePreset(pageTheme === 'dark' ? 'light' : 'dark'));
presetBtns.forEach(btn => btn.addEventListener('click', () => ActivatePreset(btn.dataset.preset)));

// Load state
chrome.storage.local.get(KEY_THEME, res => {
  pageTheme = res[KEY_THEME] ?? 'light';
  ApplyPopupAppearance(pageTheme);
  UpdatePresetHighlight();
});

// Version
document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version;

// Status ping
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const statusEl = document.getElementById('status');
  const onSmartschool = tab?.url?.includes('smartschool.be');
  if (!onSmartschool) {
    statusEl.textContent = _PopupText('popup_status_not_on');
    statusEl.className = 'inactive';
    return;
  }
  chrome.tabs.sendMessage(tab.id, { type: 'ping' }, res => {
    if (chrome.runtime.lastError || !res) {
      statusEl.textContent = _PopupText('popup_status_no_script');
      statusEl.className = 'error';
    } else {
      statusEl.textContent = _PopupText('popup_status_active') + ' ' + new URL(tab.url).hostname;
      statusEl.className = 'active';
    }
  });
});

function _GfResolveLang(code) {
  if (!code || code === 'auto' || code === 'custom') {
    const nav = (navigator.language || 'nl').split('-')[0].toLowerCase();
    return (typeof GF_LANGS !== 'undefined' && GF_LANGS[nav]) ? nav : 'nl';
  }
  return (typeof GF_LANGS !== 'undefined' && GF_LANGS[code]) ? code : 'nl';
}

function _PopupText(key) {
  if (typeof GF_LANGS === 'undefined') return key;
  const code = _GfResolveLang(_gfPopupLang);
  return GF_LANGS[code]?.[key] ?? GF_LANGS['nl']?.[key] ?? key;
}

let _gfPopupLang = 'auto';

function _GfApplyPopupTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = _PopupText(key);
    if (text !== key) el.textContent = text;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = _PopupText(key);
    if (text !== key) el.placeholder = text;
  });
}

chrome.storage.sync.get('gf-lang', res => {
  _gfPopupLang = res['gf-lang'] || 'auto';
  _GfApplyPopupTranslations();
});

// Personalization settings

const GF_SETTINGS_KEY = 'gf-personalization';
const GF_PFP_KEY      = 'gf-profile-picture';

// DOM refs
const nameToggle      = document.getElementById('name-changer-toggle');
const nameSection     = document.getElementById('name-section');
const customNameInput = document.getElementById('custom-name');
const pfpToggle       = document.getElementById('pfp-changer-toggle');
const pfpSection      = document.getElementById('pfp-changer-section');
const pfpFileInput    = document.getElementById('pfpFileInput');
const pfpFileName     = document.getElementById('pfpFileName');
const pfpPreview      = document.getElementById('pfpPreview');
const pfpPlaceholder  = document.getElementById('pfpPlaceholder');
const msgToggle       = document.getElementById('fake-msg-counter-toggle');
const msgSection      = document.getElementById('fake-msg-counter-section');
const msgValue        = document.getElementById('msg-counter-value');
const notifToggle     = document.getElementById('fake-notif-counter-toggle');
const notifSection    = document.getElementById('fake-notif-counter-section');
const notifValue      = document.getElementById('notif-counter-value');
const newsToggle      = document.getElementById('fake-news-counter-toggle');
const newsSection     = document.getElementById('fake-news-counter-section');
const newsValue       = document.getElementById('news-counter-value');
const statusMsg       = document.getElementById('status-message');
const dropZone        = document.getElementById('pfp-drop-zone');
const saveBtn         = document.getElementById('save-settings');
const resetBtn        = document.getElementById('reset-settings');
const confirmModal    = document.getElementById('confirm-modal');
const confirmMessage  = document.getElementById('confirm-message');
const confirmConfirm  = document.getElementById('confirm-confirm');
const confirmCancel   = document.getElementById('confirm-cancel');

// Storage helpers
function GetPersonalization() {
  return new Promise(resolve => {
    chrome.storage.sync.get(GF_SETTINGS_KEY, res => {
      resolve(res[GF_SETTINGS_KEY] || {
        nameChanger: false, customName: '',
        pfpChanger: false,
        fakeMsgCounter: false, msgCounterValue: 0,
        fakeNotifCounter: false, notifCounterValue: 0,
        fakeNewsCounter: false, newsCounterValue: 0,
      });
    });
  });
}

function PutPersonalization(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [GF_SETTINGS_KEY]: data }, () => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      resolve();
    });
  });
}

function GetStoredProfilePic() {
  return new Promise(resolve => {
    chrome.storage.local.get(GF_PFP_KEY, res => resolve(res[GF_PFP_KEY] || ''));
  });
}

function PutStoredProfilePic(dataUrl) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [GF_PFP_KEY]: dataUrl }, () => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      resolve();
    });
  });
}

// Auto save state
let _initializing = true;

let _statusTimer;
function ShowStatusMessage(text, type) {
  clearTimeout(_statusTimer);
  statusMsg.textContent = text;
  statusMsg.className = `status-message ${type}`;
  statusMsg.classList.remove('hidden');
  _statusTimer = setTimeout(() => statusMsg.classList.add('hidden'), 3000);
}

function Debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

let _pendingSave = false;

async function _flushSave() {
  _pendingSave = false;
  try {
    const count = Math.max(0, parseInt(msgValue.value, 10) || 0);
    msgValue.value = count;
    const notifCount = Math.max(0, parseInt(notifValue.value, 10) || 0);
    notifValue.value = notifCount;
    const newsCount = Math.max(0, parseInt(newsValue.value, 10) || 0);
    newsValue.value = newsCount;
    const data = {
      nameChanger:      nameToggle.checked,
      customName:       customNameInput.value.trim(),
      pfpChanger:       pfpToggle.checked,
      fakeMsgCounter:   msgToggle.checked,
      msgCounterValue:  count,
      fakeNotifCounter: notifToggle.checked,
      notifCounterValue: notifCount,
      fakeNewsCounter:  newsToggle.checked,
      newsCounterValue: newsCount,
    };
    await PutPersonalization(data);
    const pfp = data.pfpChanger ? await GetStoredProfilePic() : '';
    NotifySmartschoolTabs(data, pfp);
    ShowStatusMessage(_PopupText('popup_auto_saved'), 'success');
  } catch (err) {
    console.error('auto-save failed:', err);
  }
}

const autoSave = Debounce(() => { _flushSave(); }, 3000);

function immediateAutoSave() {
  _pendingSave = false;
  _flushSave();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && _pendingSave) _flushSave();
});

function NotifySmartschoolTabs(settings, pfpDataUrl) {
  chrome.tabs.query({ url: '*://*.smartschool.be/*' }, tabs => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: 'applySettings', settings }, () => {
        void chrome.runtime.lastError; // suppress
      });
      if (settings.pfpChanger && pfpDataUrl) {
        chrome.tabs.sendMessage(tab.id, { type: 'applyPfp', dataUrl: pfpDataUrl }, () => {
          void chrome.runtime.lastError;
        });
      }
    }
  });
}

function ReloadSmartschoolTabs() {
  chrome.tabs.query({ url: '*://*.smartschool.be/*' }, tabs => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs) {
      if (tab.id) chrome.tabs.reload(tab.id, () => { void chrome.runtime.lastError; });
    }
  });
}

async function SaveAndApply() {
  const count = Math.max(0, parseInt(msgValue.value, 10) || 0);
  msgValue.value = count;
  const notifCount = Math.max(0, parseInt(notifValue.value, 10) || 0);
  notifValue.value = notifCount;
  const newsCount = Math.max(0, parseInt(newsValue.value, 10) || 0);
  newsValue.value = newsCount;
  const data = {
    nameChanger:      nameToggle.checked,
    customName:       customNameInput.value.trim(),
    pfpChanger:       pfpToggle.checked,
    fakeMsgCounter:   msgToggle.checked,
    msgCounterValue:  count,
    fakeNotifCounter: notifToggle.checked,
    notifCounterValue: notifCount,
    fakeNewsCounter:  newsToggle.checked,
    newsCounterValue: newsCount,
  };
  try {
    await PutPersonalization(data);
    const pfp = data.pfpChanger ? await GetStoredProfilePic() : '';
    NotifySmartschoolTabs(data, pfp);
    ShowStatusMessage(_PopupText('popup_saved'), 'success');
    setTimeout(() => ReloadSmartschoolTabs(), 400);
  } catch (err) {
    console.error('save failed:', err);
    ShowStatusMessage(_PopupText('popup_save_failed'), 'error');
  }
}

// Confirm dialog
function ConfirmDialog(message) {
  return new Promise(resolve => {
    confirmMessage.textContent = message;
    confirmModal.classList.remove('hidden');

    const cleanup = () => {
      confirmModal.classList.add('hidden');
      confirmConfirm.removeEventListener('click', onYes);
      confirmCancel.removeEventListener('click', onNo);
      document.removeEventListener('keydown', OnKey);
    };
    const onYes = () => { cleanup(); resolve(true); };
    const onNo  = () => { cleanup(); resolve(false); };
    const OnKey = e => { if (e.key === 'Escape') { e.preventDefault(); onNo(); } };

    confirmConfirm.addEventListener('click', onYes);
    confirmCancel.addEventListener('click', onNo);
    document.addEventListener('keydown', OnKey);
    confirmConfirm.focus();
  });
}

async function ResetAllSettings() {
  const ok = await ConfirmDialog(_PopupText('popup_reset_confirm'));
  if (!ok) return;
  try {
    await PutPersonalization({
      nameChanger: false, customName: '',
      pfpChanger: false,
      fakeMsgCounter: false, msgCounterValue: 0,
      fakeNotifCounter: false, notifCounterValue: 0,
      fakeNewsCounter: false, newsCounterValue: 0,
    });
    await new Promise(r => chrome.storage.local.remove(GF_PFP_KEY, r));

    nameToggle.checked = false;
    nameSection.classList.add('hidden');
    customNameInput.value = '';
    pfpToggle.checked = false;
    pfpSection.classList.add('hidden');
    pfpPreview.classList.add('hidden');
    pfpPlaceholder.classList.remove('hidden');
    pfpFileName.textContent = _PopupText('popup_pfp_none');
    msgToggle.checked = false;
    msgSection.classList.add('hidden');
    msgValue.value = '0';
    notifToggle.checked = false;
    notifSection.classList.add('hidden');
    notifValue.value = '0';
    newsToggle.checked = false;
    newsSection.classList.add('hidden');
    newsValue.value = '0';

    ShowStatusMessage(_PopupText('popup_reset_done'), 'success');
    setTimeout(() => ReloadSmartschoolTabs(), 400);
  } catch (err) {
    console.error('Reset failed:', err);
    ShowStatusMessage(_PopupText('popup_reset_failed'), 'error');
  }
}

function ApplyImageFile(file) {
  if (!file?.type.startsWith('image/')) {
    ShowStatusMessage(_PopupText('popup_pfp_only_images'), 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async e => {
    const url = e.target?.result;
    if (!url) return;
    pfpPreview.src = url;
    pfpPreview.classList.remove('hidden');
    pfpPlaceholder.classList.add('hidden');
    pfpFileName.textContent = file.name;
    try {
      await PutStoredProfilePic(url);
      if (!pfpToggle.checked) {
        pfpToggle.checked = true;
        pfpSection.classList.remove('hidden');
      }
      ShowStatusMessage(_PopupText('popup_pfp_saved'), 'success');
    } catch (_) {
      ShowStatusMessage(_PopupText('popup_save_failed'), 'error');
    }
  };
  reader.readAsDataURL(file);
}

dropZone.addEventListener('click', () => pfpFileInput.click());
pfpFileInput.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (file) ApplyImageFile(file);
});

// Drop zone: drag and drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
  dropZone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
});
dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragover',  () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file) ApplyImageFile(file);
});

nameToggle.addEventListener('change', () => {
  nameSection.classList.toggle('hidden', !nameToggle.checked);
  if (!_initializing) immediateAutoSave();
});
pfpToggle.addEventListener('change', () => {
  pfpSection.classList.toggle('hidden', !pfpToggle.checked);
  if (!_initializing) immediateAutoSave();
});
msgToggle.addEventListener('change', () => {
  msgSection.classList.toggle('hidden', !msgToggle.checked);
  if (!_initializing) immediateAutoSave();
});
notifToggle.addEventListener('change', () => {
  notifSection.classList.toggle('hidden', !notifToggle.checked);
  if (!_initializing) immediateAutoSave();
});
newsToggle.addEventListener('change', () => {
  newsSection.classList.toggle('hidden', !newsToggle.checked);
  if (!_initializing) immediateAutoSave();
});

customNameInput.addEventListener('blur',    () => { if (!_initializing) { _pendingSave = true; autoSave(); } });
customNameInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !_initializing) immediateAutoSave(); });
customNameInput.addEventListener('input',   () => { if (!_initializing) { _pendingSave = true; autoSave(); } });
msgValue.addEventListener('blur',    () => { if (!_initializing) { _pendingSave = true; autoSave(); } });
msgValue.addEventListener('keydown', e => { if (e.key === 'Enter' && !_initializing) immediateAutoSave(); });
notifValue.addEventListener('blur',    () => { if (!_initializing) { _pendingSave = true; autoSave(); } });
notifValue.addEventListener('keydown', e => { if (e.key === 'Enter' && !_initializing) immediateAutoSave(); });
newsValue.addEventListener('blur',    () => { if (!_initializing) { _pendingSave = true; autoSave(); } });
newsValue.addEventListener('keydown', e => { if (e.key === 'Enter' && !_initializing) immediateAutoSave(); });

msgValue.addEventListener('input', () => {
  msgValue.value = msgValue.value.replace(/[^0-9]/g, '') || '0';
});
notifValue.addEventListener('input', () => {
  notifValue.value = notifValue.value.replace(/[^0-9]/g, '') || '0';
});
newsValue.addEventListener('input', () => {
  newsValue.value = newsValue.value.replace(/[^0-9]/g, '') || '0';
});

// Buttons
saveBtn.addEventListener('click', SaveAndApply);
resetBtn.addEventListener('click', ResetAllSettings);

async function _GfRestoreState() {
  try {
    const s = await GetPersonalization();

    nameToggle.checked = s.nameChanger;
    nameSection.classList.toggle('hidden', !s.nameChanger);
    customNameInput.value = s.customName || '';

    pfpToggle.checked = s.pfpChanger;
    pfpSection.classList.toggle('hidden', !s.pfpChanger);
    if (s.pfpChanger) {
      const url = await GetStoredProfilePic();
      if (url) {
        pfpPreview.src = url;
        pfpPreview.classList.remove('hidden');
        pfpPlaceholder.classList.add('hidden');
        pfpFileName.textContent = _PopupText('popup_pfp_current');
      }
    }

    msgToggle.checked = s.fakeMsgCounter;
    msgSection.classList.toggle('hidden', !s.fakeMsgCounter);
    msgValue.value = (s.msgCounterValue ?? 0).toString();

    notifToggle.checked = s.fakeNotifCounter;
    notifSection.classList.toggle('hidden', !s.fakeNotifCounter);
    notifValue.value = (s.notifCounterValue ?? 0).toString();

    newsToggle.checked = s.fakeNewsCounter;
    newsSection.classList.toggle('hidden', !s.fakeNewsCounter);
    newsValue.value = (s.newsCounterValue ?? 0).toString();
  } catch (_) {
    ShowStatusMessage(_PopupText('popup_load_failed'), 'error');
  } finally {
    setTimeout(() => { _initializing = false; }, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _GfRestoreState);
} else {
  _GfRestoreState();
}
