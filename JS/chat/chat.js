(function () {
  'use strict';

  if (window.self !== window.top) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'F7') return;
      e.preventDefault();
      e.stopPropagation();
      try { window.parent.postMessage({ type: 'gf-chat-f7' }, '*'); } catch (_) {}
      try {
        chrome.runtime.sendMessage({ ns: 'gf-chat-cmd', cmd: 'toggleOverlay' }).catch(() => {});
      } catch (_) {}
    }, true);
    return;
  }

  const MAX_NICKNAME = 24;
  const MAX_TEXT_LEN = 1000;
  const MAX_PEERS = 7;

  let snap = null;
  let port = null;
  let root = null;
  let bodyObserver = null;
  let themeObserver = null;
  let overlayMounted = false;
  let localScreen = null;
  let localScreenData = null;
  const formCache = new Map();
  const formMeta = { focusedId: null, selStart: null, selEnd: null };

  function _el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function _ensureCssAttached() {
    const head = document.head || document.documentElement;
    if (!head) return;
    const existing = document.getElementById('gf-chat-css');
    if (existing && existing.isConnected) return;
    if (existing && !existing.isConnected) existing.remove();
    const link = document.createElement('link');
    link.id = 'gf-chat-css';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('CSS/chat.css');
    head.appendChild(link);
  }

  function _ensureRoot() {
    _ensureCssAttached();
    if (!root) {
      root = document.createElement('div');
      root.id = 'gf-chat-root';
      root.className = overlayMounted ? '' : 'gf-chat-hidden';
    }
    if (document.body && !document.body.contains(root)) document.body.appendChild(root);
    return root;
  }

  function _reattach() {
    _ensureCssAttached();
    if (root && document.body && !document.body.contains(root)) {
      document.body.appendChild(root);
    }
  }

  function _installPersistenceObservers() {
    if (!bodyObserver) {
      bodyObserver = new MutationObserver(_reattach);
      bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    if (!themeObserver) {
      themeObserver = new MutationObserver(() => { if (overlayMounted) render(); });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-gf-theme', 'data-theme'],
      });
    }
  }

  function _saveForms() {
    if (!root) return;
    const a = document.activeElement;
    formMeta.focusedId = (a && a.id && root.contains(a)) ? a.id : null;
    formMeta.selStart = (a && 'selectionStart' in a) ? a.selectionStart : null;
    formMeta.selEnd   = (a && 'selectionEnd'   in a) ? a.selectionEnd   : null;
    for (const el of root.querySelectorAll('input, textarea')) {
      if (el.id) formCache.set(el.id, el.value);
    }
  }

  function _restoreForms() {
    if (!root) return;
    for (const el of root.querySelectorAll('input, textarea')) {
      if (el.id && formCache.has(el.id)) {
        const v = formCache.get(el.id);
        if (v !== undefined && el.value !== v) el.value = v;
      }
      if (el.id) {
        el.addEventListener('input', () => formCache.set(el.id, el.value));
      }
    }
    if (formMeta.focusedId) {
      const e = document.getElementById(formMeta.focusedId);
      if (e) {
        try { e.focus({ preventScroll: true }); } catch (_) { try { e.focus(); } catch (_) {} }
        if (formMeta.selStart != null && 'setSelectionRange' in e) {
          try { e.setSelectionRange(formMeta.selStart, formMeta.selEnd ?? formMeta.selStart); } catch (_) {}
        }
      }
    }
  }

  function _clearFormCache(prefix) {
    if (!prefix) { formCache.clear(); return; }
    for (const k of [...formCache.keys()]) {
      if (k.startsWith(prefix)) formCache.delete(k);
    }
  }

  function _renderTo(node) {
    _ensureRoot();
    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(node);
  }

  function _header(title, back) {
    return _el('div', { class: 'gf-chat-headerbar' }, [
      _el('div', { class: 'gf-chat-headerbtns' }, [
        back && _el('button', { class: 'gf-chat-min', title: _t('chat_back'), onclick: back }, '\u2013'),
      ]),
      _el('h2', { class: 'gf-chat-title' }, [
        document.createTextNode(title + ' '),
        _el('span', { class: 'gf-chat-beta', title: _t('chat_beta_tooltip') }, 'BETA'),
      ]),
      _el('div', { class: 'gf-chat-headerbtns' }, [
        _el('button', { class: 'gf-chat-x', title: _t('chat_hide'), onclick: hideOverlay }, '\u00d7'),
      ]),
    ]);
  }

  function _copy(text) { try { navigator.clipboard?.writeText(text); } catch (_) {} }

  function _packInviteLink(code, packed) {
    if (!code || !packed) return '';
    return 'gfchat:v1:' + code + ':' + packed;
  }
  function _parseInviteLink(s) {
    if (!s) return null;
    const t = s.trim();
    if (!t.startsWith('gfchat:v1:')) return null;
    const rest = t.slice('gfchat:v1:'.length);
    const sep = rest.indexOf(':');
    if (sep <= 0) return null;
    const code = rest.slice(0, sep).trim();
    const blob = rest.slice(sep + 1).trim();
    if (!code || !blob) return null;
    return { code, blob };
  }

  function _t(key, vars) {
    let s;
    try {
      if (typeof window._GfTranslate === 'function') s = window._GfTranslate(key);
    } catch (_) {}
    if (!s || s === key) {
      if (typeof window.GF_LANGS !== 'undefined') s = window.GF_LANGS?.en?.[key] || key;
      else s = key;
    }
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
      }
    }
    return s;
  }

  try {
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area === 'sync' && changes['gf-lang']) {
        try { window._gfTLang = changes['gf-lang'].newValue || null; } catch (_) {}
        if (overlayMounted) render();
      }
    });
  } catch (_) {}

  function sendCmd(cmd, payload) {
    return chrome.runtime.sendMessage({ ns: 'gf-chat-cmd', cmd, payload })
      .catch((e) => ({ ok: false, error: String(e?.message || e) }));
  }

  function connectPort() {
    if (port) return;
    try {
      port = chrome.runtime.connect({ name: 'gf-chat' });
      port.onMessage.addListener((msg) => {
        if (msg && msg.kind === 'state') applyState(msg.state);
      });
      port.onDisconnect.addListener(() => {
        port = null;
        void chrome.runtime.lastError;
        setTimeout(connectPort, 1000);
      });
    } catch (_) {
      port = null;
      setTimeout(connectPort, 1000);
    }
  }

  function pickAutoScreen(s) {
    if (!s.ipAcknowledged) return 'ip-warning';
    if (s.role === 'host' && s.roomCodeStr) return 'host-room';
    if (s.role === 'joiner' && s.hostConnected) return 'joiner-room';
    if (s.role === 'joiner' && s.joinerAnswerPacked) return 'join-answer-pending';
    return 'menu';
  }

  function screenValid(scr, s) {
    switch (scr) {
      case 'ip-warning': return !s.ipAcknowledged;
      case 'menu': return s.ipAcknowledged && !s.role;
      case 'host-room':
      case 'host-invite':
      case 'host-help':
      case 'host-confirm-close':
        return s.role === 'host';
      case 'join-prompt': return s.ipAcknowledged && !s.role;
      case 'join-answer-pending': return s.role === 'joiner' && !s.hostConnected;
      case 'joiner-room': return s.role === 'joiner' && s.hostConnected;
      case 'error': return true;
      default: return true;
    }
  }

  function setScreen(scr, data) {
    localScreen = scr;
    localScreenData = data || null;
    render();
  }

  function applyState(s) {
    snap = s;
    const wantOverlay = !!s.overlayVisible;
    if (wantOverlay !== overlayMounted) {
      overlayMounted = wantOverlay;
      if (wantOverlay) _showOverlayDom();
      else { _hideOverlayDom(); return; }
    }
    if (!overlayMounted) return;
    if (!localScreen || !screenValid(localScreen, s)) {
      localScreen = pickAutoScreen(s);
    }
    render();
  }

  function _showOverlayDom() {
    _ensureRoot();
    _installPersistenceObservers();
    root.classList.remove('gf-chat-hidden');
  }
  function _hideOverlayDom() {
    if (root) root.classList.add('gf-chat-hidden');
  }

  let renderScheduled = false;
  const uiToggles = { peerListOpen: false };
  function render() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      _renderNow();
    });
  }

  function _renderNow() {
    if (!snap || !overlayMounted) return;
    _saveForms();
    switch (localScreen) {
      case 'ip-warning': renderIpWarning(); break;
      case 'menu': renderMenu(); break;
      case 'host-room': renderHostRoom(); break;
      case 'host-invite': renderHostInvitePanel(); break;
      case 'host-help': renderHostHelp(); break;
      case 'host-confirm-close': renderConfirmCloseRoom(); break;
      case 'join-prompt': renderJoinPrompt(); break;
      case 'join-answer-pending': renderJoinerAnswerPending(); break;
      case 'joiner-room': renderChatRoomJoiner(); break;
      case 'error': renderError(localScreenData?.text, localScreenData?.back); break;
      default: renderMenu();
    }
    _restoreForms();
  }

  function renderIpWarning() {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_heads_up'), null),
      _el('p', { class: 'gf-chat-body' }, _t('chat_warn_body1')),
      _el('p', { class: 'gf-chat-body' }, _t('chat_warn_body2')),
      _el('p', { class: 'gf-chat-body-mute' }, _t('chat_warn_body3')),
      _el('div', { class: 'gf-chat-row' }, [
        _el('button', { class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-flex1', onclick: hideOverlay }, _t('chat_cancel')),
        _el('button', {
          class: 'gf-chat-btn gf-chat-btn-primary gf-chat-flex1',
          onclick: async () => { await sendCmd('ackIp'); setScreen('menu'); },
        }, _t('chat_continue')),
      ]),
    ]));
  }

  function renderMenu() {
    const nick = formCache.get('gf-chat-nick-in') ?? snap.nickname ?? '';
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_title'), null),
      _el('p', { class: 'gf-chat-body-mute' }, _t('chat_menu_intro')),
      _el('label', { class: 'gf-chat-label' }, _t('chat_nick_label')),
      _el('input', {
        class: 'gf-chat-input', id: 'gf-chat-nick-in',
        placeholder: _t('chat_nick_placeholder'), maxlength: String(MAX_NICKNAME),
        value: nick,
      }),
      _el('div', { class: 'gf-chat-row' }, [
        _el('button', {
          class: 'gf-chat-btn gf-chat-btn-primary gf-chat-flex1',
          onclick: () => _captureNickAndThen(async () => {
            const r = await sendCmd('host:create');
            if (!r?.ok) return setScreen('error', { text: r?.error || _t('chat_something_wrong'), back: () => setScreen('menu') });
            setScreen('host-room');
          }),
        }, _t('chat_create_room')),
        _el('button', {
          class: 'gf-chat-btn gf-chat-btn-secondary gf-chat-flex1',
          onclick: () => _captureNickAndThen(() => setScreen('join-prompt')),
        }, _t('chat_join_room')),
      ]),
    ]));
    setTimeout(() => document.getElementById('gf-chat-nick-in')?.focus(), 0);
  }

  async function _captureNickAndThen(next) {
    const inp = document.getElementById('gf-chat-nick-in');
    const v = (inp?.value || '').trim().slice(0, MAX_NICKNAME);
    const nick = v || ('User-' + Math.floor(Math.random() * 9000 + 1000));
    formCache.set('gf-chat-nick-in', nick);
    await sendCmd('setNickname', { nickname: nick });
    next();
  }

  function _renderPeerListBlock(role) {
    const others = snap.peers || [];
    const totalPeople = (role === 'host') ? (others.length + 1) : (others.length + 1 + 1);
    const open = uiToggles.peerListOpen;
    const header = _el('button', {
      class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-w gf-chat-peerlist-toggle',
      onclick: () => { uiToggles.peerListOpen = !uiToggles.peerListOpen; render(); },
    }, (open ? '\u25be ' : '\u25b8 ') + _t('chat_people', { count: totalPeople }));
    if (!open) return header;
    const entries = [];
    if (role === 'joiner') {
      entries.push(_el('div', { class: 'gf-chat-peer' }, [
        _el('span', { class: 'gf-chat-peer-dot' }),
        _el('span', { class: 'gf-chat-peer-name' }, (snap.hostNickname || 'Host') + ' ' + _t('chat_host_suffix')),
      ]));
      entries.push(_el('div', { class: 'gf-chat-peer' }, [
        _el('span', { class: 'gf-chat-peer-dot' }),
        _el('span', { class: 'gf-chat-peer-name' }, (snap.nickname || 'You') + ' ' + _t('chat_you_suffix')),
      ]));
      for (const p of others) {
        entries.push(_el('div', { class: 'gf-chat-peer' }, [
          _el('span', { class: 'gf-chat-peer-dot' }),
          _el('span', { class: 'gf-chat-peer-name' }, p.nickname || _t('chat_joining')),
        ]));
      }
    } else {
      entries.push(_el('div', { class: 'gf-chat-peer' }, [
        _el('span', { class: 'gf-chat-peer-dot' }),
        _el('span', { class: 'gf-chat-peer-name' }, (snap.nickname || 'You') + ' ' + _t('chat_host_suffix')),
      ]));
      for (const p of others) {
        entries.push(_el('div', { class: 'gf-chat-peer' }, [
          _el('span', { class: 'gf-chat-peer-dot' }),
          _el('span', { class: 'gf-chat-peer-name' }, p.nickname || _t('chat_joining')),
        ]));
      }
    }
    return _el('div', {}, [header, _el('div', { class: 'gf-chat-peerlist' }, entries)]);
  }

  function renderHostRoom() {
    const peerCount = snap.peers.length;
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_hosting', { count: peerCount, max: MAX_PEERS }), null),
      _el('div', { class: 'gf-chat-row' }, [
        _el('button', { class: 'gf-chat-btn gf-chat-btn-primary gf-chat-flex1',
          onclick: () => setScreen('host-invite') }, _t('chat_invite_people')),
        _el('button', { class: 'gf-chat-btn gf-chat-btn-ghost',
          onclick: () => setScreen('host-help'), title: _t('chat_help_btn_title') }, '?'),
      ]),
      _renderPeerListBlock('host'),
      renderChatStrip(),
      _el('button', { class: 'gf-chat-btn gf-chat-btn-danger gf-chat-w',
        onclick: () => setScreen('host-confirm-close') }, _t('chat_close_room')),
    ]));
    _scrollMessagesToEnd();
  }

  function renderHostHelp() {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_help_title'), () => setScreen('host-room')),
      _el('div', { class: 'gf-chat-step' }, [
        _el('b', {}, '1. '), document.createTextNode(_t('chat_help_step1_new')),
        _el('br'),
        _el('b', {}, '2. '), document.createTextNode(_t('chat_help_step2_new')),
        _el('br'),
        _el('b', {}, '3. '), document.createTextNode(_t('chat_help_step3_new')),
        _el('br'),
        _el('b', {}, '4. '), document.createTextNode(_t('chat_help_step4_new')),
      ]),
      _el('p', { class: 'gf-chat-body-mute' }, _t('chat_help_cap', { total: MAX_PEERS + 1 })),
      _el('button', { class: 'gf-chat-btn gf-chat-btn-secondary gf-chat-w', onclick: () => setScreen('host-room') }, _t('chat_got_it')),
    ]));
  }

  function renderHostInvitePanel() {
    const slotNodes = [];
    let i = 0;
    for (const slot of snap.invites) {
      i += 1;
      slotNodes.push(_renderInviteSlot(slot, i));
    }

    const slotCount = snap.invites.length;
    const atCap = slotCount >= MAX_PEERS;

    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_invite_title', { count: slotCount, max: MAX_PEERS }), () => setScreen('host-room')),
      _el('div', { class: 'gf-chat-step' }, [
        _el('b', {}, _t('chat_invite_tip_label')),
        document.createTextNode(_t('chat_invite_tip')),
      ]),
      slotCount === 0 && _el('p', { class: 'gf-chat-body-mute' }, _t('chat_invite_empty')),
      slotCount > 0 && _el('div', { class: 'gf-chat-invite-list' }, slotNodes),
      _el('button', {
        class: 'gf-chat-btn gf-chat-btn-primary gf-chat-w',
        disabled: atCap || undefined,
        onclick: async () => {
          if (atCap) return;
          const r = await sendCmd('host:createInvite');
          if (!r?.ok) return setScreen('error', { text: r?.error || _t('chat_something_wrong'), back: () => setScreen('host-invite') });
        },
      }, atCap ? _t('chat_room_full') : _t('chat_add_invite')),
      _el('button', {
        class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-w',
        onclick: () => setScreen('host-room'),
      }, _t('chat_done')),
    ]));
  }

  function _renderInviteSlot(slot, idx) {
    if (slot.status === 'connected') {
      return _el('div', { class: 'gf-chat-invite-slot gf-chat-invite-connected' }, [
        _el('div', { class: 'gf-chat-invite-head' }, [
          _el('b', {}, '\u2713 ' + (slot.nickname || _t('chat_connected'))),
          _el('button', {
            class: 'gf-chat-btn gf-chat-btn-danger gf-chat-btn-xs',
            title: _t('chat_kick_title'),
            onclick: async () => {
              await sendCmd('host:cancelInvite', { inviteId: slot.id });
            },
          }, _t('chat_kick')),
        ]),
        _el('div', { class: 'gf-chat-status gf-chat-status-ok' }, _t('chat_connected')),
      ]);
    }

    const taId = 'gf-chat-ans-' + slot.id;
    const preparing = slot.status === 'preparing';
    const statusText =
      slot.status === 'failed'     ? (slot.error || _t('chat_failed')) :
      slot.status === 'connecting' ? _t('chat_connecting') :
      preparing                    ? _t('chat_preparing') :
                                     _t('chat_waiting_answer');
    const statusCls =
      slot.status === 'failed'     ? 'gf-chat-status-err' :
      (slot.status === 'connecting' || preparing) ? 'gf-chat-status-ok' : '';

    return _el('div', { class: 'gf-chat-invite-slot' }, [
      _el('div', { class: 'gf-chat-invite-head' }, [
        _el('b', {}, _t('chat_invite_num', { n: idx })),
        _el('button', {
          class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-btn-xs',
          title: _t('chat_remove_title'),
          onclick: async () => {
            await sendCmd('host:cancelInvite', { inviteId: slot.id });
            _clearFormCache('gf-chat-ans-' + slot.id);
          },
        }, _t('chat_remove')),
      ]),
      _el('label', { class: 'gf-chat-label' }, _t('chat_invite_link_label')),
      _el('textarea', { class: 'gf-chat-blob', readonly: true, rows: '3' },
        preparing ? _t('chat_preparing_short') : _packInviteLink(snap.roomCodeStr, slot.packed)),
      _el('button', { class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-w',
        disabled: preparing || !slot.packed || undefined,
        onclick: () => slot.packed && _copy(_packInviteLink(snap.roomCodeStr, slot.packed)) }, _t('chat_copy_invite_link')),
      _el('label', { class: 'gf-chat-label' }, _t('chat_answer_blob_label')),
      _el('textarea', {
        class: 'gf-chat-blob', id: taId, rows: '3',
        placeholder: _t('chat_answer_blob_placeholder'),
      }),
      _el('button', {
        class: 'gf-chat-btn gf-chat-btn-primary gf-chat-w',
        disabled: preparing || slot.status === 'connecting' || undefined,
        onclick: async () => {
          const ta = document.getElementById(taId);
          const blob = (ta?.value || '').trim();
          if (!blob) return;
          const r = await sendCmd('host:acceptAnswer', { inviteId: slot.id, blob });
          if (r?.ok) _clearFormCache('gf-chat-ans-' + slot.id);
        },
      }, slot.status === 'connecting' ? _t('chat_connecting') : _t('chat_connect_this')),
      _el('div', { class: 'gf-chat-status ' + statusCls }, statusText),
    ]);
  }

  function renderConfirmCloseRoom() {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_confirm_close_title'), () => setScreen('host-room')),
      _el('p', { class: 'gf-chat-body' }, _t('chat_confirm_close_body')),
      _el('div', { class: 'gf-chat-row' }, [
        _el('button', { class: 'gf-chat-btn gf-chat-btn-ghost gf-chat-flex1',
          onclick: () => setScreen('host-room') }, _t('chat_keep_open')),
        _el('button', {
          class: 'gf-chat-btn gf-chat-btn-danger gf-chat-flex1',
          onclick: async () => {
            await sendCmd('host:close');
            _clearFormCache();
            setScreen('menu');
          },
        }, _t('chat_close_room')),
      ]),
    ]));
  }

  function renderJoinPrompt() {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_join_title'), () => setScreen('menu')),
      _el('div', { class: 'gf-chat-step' }, [
        _el('b', {}, '1. '), document.createTextNode(_t('chat_join_step1_new')),
        _el('br'),
        _el('b', {}, '2. '), document.createTextNode(_t('chat_join_step2_new')),
      ]),
      _el('label', { class: 'gf-chat-label' }, _t('chat_invite_link_from_host')),
      _el('textarea', { class: 'gf-chat-blob', id: 'gf-chat-offer-in', rows: '4', placeholder: _t('chat_paste_invite_link_placeholder') }),
      _el('button', {
        class: 'gf-chat-btn gf-chat-btn-primary gf-chat-w',
        onclick: async () => {
          const raw = (document.getElementById('gf-chat-offer-in')?.value || '').trim();
          const status = document.getElementById('gf-chat-status');
          const setStatus = (t, cls = '') => { if (status) { status.className = 'gf-chat-status ' + cls; status.textContent = t; } };
          if (!raw) return setStatus(_t('chat_link_required'), 'gf-chat-status-err');
          const parsed = _parseInviteLink(raw);
          if (!parsed) return setStatus(_t('chat_link_invalid'), 'gf-chat-status-err');
          const r = await sendCmd('join:start', { code: parsed.code, blob: parsed.blob });
          if (!r?.ok) return setStatus(r?.error || _t('chat_join_failed'), 'gf-chat-status-err');
          _clearFormCache('gf-chat-offer-in');
        },
      }, _t('chat_generate_answer')),
      _el('div', { class: 'gf-chat-status', id: 'gf-chat-status' }, ''),
    ]));
  }

  function renderJoinerAnswerPending() {
    const packed = snap.joinerAnswerPacked || '';
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_send_back_title'), async () => {
        await sendCmd('join:leave');
        setScreen('menu');
      }),
      _el('div', { class: 'gf-chat-step' }, [
        _el('b', {}, _t('chat_almost_done_label')),
        document.createTextNode(_t('chat_almost_done_body')),
      ]),
      _el('textarea', { class: 'gf-chat-blob', readonly: true, rows: '6' }, packed),
      _el('button', { class: 'gf-chat-btn gf-chat-btn-primary gf-chat-w',
        onclick: () => _copy(packed) }, _t('chat_copy_answer_blob')),
      _el('div', { class: 'gf-chat-status' }, _t('chat_waiting_host')),
    ]));
  }

  function renderChatRoomJoiner() {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_connected_to', { host: snap.hostNickname || 'host' }), null),
      _renderPeerListBlock('joiner'),
      renderChatStrip(),
      _el('button', {
        class: 'gf-chat-btn gf-chat-btn-danger gf-chat-w',
        onclick: async () => {
          await sendCmd('join:leave');
          _clearFormCache();
          setScreen('menu');
        },
      }, _t('chat_leave_room')),
    ]));
    _scrollMessagesToEnd();
  }

  function renderChatStrip() {
    const list = _el('div', { class: 'gf-chat-list', id: 'gf-chat-list' });
    for (const m of snap.messages) {
      const node = _el('div', { class: 'gf-chat-msg gf-chat-msg-' + m.from });
      if (m.from === 'peer' && m.author) {
        node.appendChild(_el('span', { class: 'gf-chat-msg-author' }, m.author));
      }
      const body = (m.from === 'system' && m.key) ? _t(m.key, m.args || undefined) : m.text;
      node.appendChild(document.createTextNode(body));
      list.appendChild(node);
    }
    const input = _el('input', {
      class: 'gf-chat-input gf-chat-msg-input',
      id: 'gf-chat-msg-in',
      placeholder: _t('chat_msg_placeholder'),
      maxlength: String(MAX_TEXT_LEN),
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _doSend(); }
    });
    const wrap = _el('div', { class: 'gf-chat-row' }, [
      input,
      _el('button', { class: 'gf-chat-btn gf-chat-btn-primary', onclick: _doSend }, _t('chat_send')),
    ]);
    return _el('div', { class: 'gf-chat-strip' }, [list, wrap]);
  }

  async function _doSend() {
    const inp = document.getElementById('gf-chat-msg-in');
    if (!inp) return;
    const text = (inp.value || '').slice(0, MAX_TEXT_LEN).trim();
    if (!text) return;
    inp.value = '';
    formCache.set('gf-chat-msg-in', '');
    await sendCmd('chat:send', { text });
  }

  function _scrollMessagesToEnd() {
    const list = document.getElementById('gf-chat-list');
    if (!list) return;
    requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  }

  function renderError(text, back) {
    _renderTo(_el('div', { class: 'gf-chat-card' }, [
      _header(_t('chat_error_title'), back || null),
      _el('div', { class: 'gf-chat-status gf-chat-status-err' }, text || _t('chat_something_wrong')),
      back && _el('button', { class: 'gf-chat-btn gf-chat-btn-secondary gf-chat-w', onclick: back }, _t('chat_ok')),
    ]));
  }

  async function hideOverlay() { await sendCmd('setOverlayVisible', { visible: false }); }
  async function toggleOverlay() { await sendCmd('toggleOverlay'); }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'F7') return;
    e.preventDefault();
    e.stopPropagation();
    toggleOverlay();
  }, true);

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'gf-chat-f7') toggleOverlay();
  });

  function _bootstrap() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', _bootstrap, { once: true });
      return;
    }
    _ensureRoot();
    _installPersistenceObservers();
    connectPort();
  }
  _bootstrap();

  window.GfChat = { toggle: toggleOverlay };
})();
