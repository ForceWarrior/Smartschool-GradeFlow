(function () {
  'use strict';

  const C  = window.GfChatCrypto;
  const SG = window.GfChatSignaling;
  const HS = window.GfChatHandshake;
  const CG = window.GfChatChannelGuard;
  const PI = window.GfChatPeerIdentity;
  if (!C || !SG || !HS || !CG || !PI) {
    console.warn('[GfChat offscreen] missing modules');
    return;
  }

  const MAX_MESSAGES = 60;
  const MAX_NICKNAME = 24;
  const MAX_PEERS = 7;

  const state = {
    ipAcknowledged: false,
    overlayVisible: false,
    nickname: '',
    role: null,
    roomCodeStr: null,
    roomId: null,
    roomKey: null,
    myPeerId: null,
    mySenderId: null,
    peerSession: null,
    invites: new Map(),
    peers: new Map(),
    hostConn: null,
    joinerAnswerPacked: null,
    messages: [],
  };

  function snapshot() {
    return {
      ipAcknowledged: state.ipAcknowledged,
      overlayVisible: state.overlayVisible,
      nickname: state.nickname,
      role: state.role,
      roomCodeStr: state.roomCodeStr,
      myPeerId: state.myPeerId,
      invites: [...state.invites.entries()].map(([id, s]) => ({
        id, packed: s.packed, status: s.status,
        nickname: s.nickname || null,
        peerId: s.peerId || null,
        error: s.error || null,
      })),
      peers: [...state.peers.entries()].map(([id, p]) => ({
        peerId: id, nickname: p.nickname,
      })),
      hostNickname: state.hostConn?.hostNickname || null,
      hostConnected: !!(state.hostConn && state.hostConn.dc && state.hostConn.dc.readyState === 'open'),
      joinerAnswerPacked: state.joinerAnswerPacked,
      messages: state.messages.slice(),
    };
  }

  function pushState() {
    try {
      chrome.runtime.sendMessage({ ns: 'gf-chat-event', kind: 'state', state: snapshot() })
        .catch(() => {});
    } catch (_) {}
  }

  function appendMessage(m) {
    state.messages.push(m);
    while (state.messages.length > MAX_MESSAGES) state.messages.shift();
    pushState();
  }

  function systemMsg(text, key, args) {
    appendMessage({ from: 'system', text, key: key || null, args: args || null, ts: Date.now() });
  }

  function nonceStr() { return C.bytesToB64(C.generateNonce(12)); }

  function createPc() {
    return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  }

  function gatherCandidates(pc, timeoutMs = 4000) {
    return new Promise((resolve) => {
      const out = [];
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        pc.removeEventListener('icecandidate', onCand);
        clearTimeout(t);
        resolve(out);
      };
      const onCand = (e) => {
        if (e.candidate) out.push(e.candidate.toJSON());
        else finish();
      };
      pc.addEventListener('icecandidate', onCand);
      if (pc.iceGatheringState === 'complete') return finish();
      const t = setTimeout(finish, timeoutMs);
    });
  }

  function cleanupAll() {
    for (const [, slot] of state.invites) {
      try { slot.dc?.close(); } catch (_) {}
      try { slot.pc?.close(); } catch (_) {}
    }
    state.invites.clear();
    for (const [, p] of state.peers) {
      try { p.dc?.close(); } catch (_) {}
      try { p.pc?.close(); } catch (_) {}
    }
    state.peers.clear();
    if (state.hostConn) {
      try { state.hostConn.dc?.close(); } catch (_) {}
      try { state.hostConn.pc?.close(); } catch (_) {}
    }
    state.hostConn = null;
    try { state.peerSession?.stop(); } catch (_) {}
    state.peerSession = null;
    state.mySenderId = null;
    state.myPeerId = null;
    state.role = null;
    state.roomKey = null;
    state.roomCodeStr = null;
    state.roomId = null;
    state.joinerAnswerPacked = null;
    state.messages = [];
  }

  async function cmdHostCreate() {
    if (state.role) return { ok: false, error: 'Already in a room.' };
    state.role = 'host';
    try {
      const codeBytes = C.generateRoomCodeBytes();
      state.roomCodeStr = C.formatRoomCode(codeBytes);
      state.roomKey = await C.deriveRoomKey(codeBytes);
      const idHash = await C.sha256(codeBytes);
      state.roomId = C.bytesToB64(idHash.slice(0, 8));
      C.wipe(codeBytes);
      state.myPeerId = C.bytesToB64(C.generateNonce(8));
      state.peerSession = PI.createSession(state.roomKey, state.myPeerId, (next) => {
        state.mySenderId = next;
      });
      state.mySenderId = await state.peerSession.init();
      pushState();
      return { ok: true };
    } catch (e) {
      cleanupAll();
      pushState();
      return { ok: false, error: String(e?.message || e) };
    }
  }

  function _findInviteByDc(dc) {
    for (const [id, s] of state.invites) if (s.dc === dc) return { id, slot: s };
    return null;
  }

  function _markInviteFailed(dc, msg) {
    const f = _findInviteByDc(dc);
    if (!f) return;
    f.slot.status = 'failed';
    f.slot.error = msg || 'Connection failed.';
    pushState();
  }

  function wireHostDataChannel(dc, pc) {
    dc.binaryType = 'arraybuffer';

    pc.addEventListener('iceconnectionstatechange', () => {
      const st = pc.iceConnectionState;
      if (st === 'failed') _markInviteFailed(dc, 'ICE connection failed (network/firewall).');
    });
    pc.addEventListener('connectionstatechange', () => {
      const st = pc.connectionState;
      if (st === 'failed') _markInviteFailed(dc, 'WebRTC connection failed.');
    });

    dc.addEventListener('open', async () => {
      const send = (obj) => { try { dc.send(JSON.stringify(obj)); } catch (_) {} };
      try {
        const result = await HS.runHostHandshake(state.roomKey, dc, send, state.myPeerId);
        const f = _findInviteByDc(dc);
        const slot = f?.slot;
        const claimedNick = slot?._claimedNickname || ('User-' + result.peerId.slice(0, 4));
        const peerSenderId = await PI.deriveToken(state.roomKey, result.peerId, PI.currentHourBucket());
        const guard = CG.createGuard({
          expectedSenderId: peerSenderId,
          onValid: (msg) => hostHandlePeerMessage(result.peerId, msg),
          onDrop: (r) => console.debug('[GfChat host] drop', r),
        });
        state.peers.set(result.peerId, {
          pc: slot?.pc, dc, guard, peerSenderId, nickname: claimedNick,
        });
        if (slot) {
          slot.status = 'connected';
          slot.peerId = result.peerId;
          slot.nickname = claimedNick;
          slot.error = null;
        }
        broadcastSystem(claimedNick + ' joined the room.', 'chat_sys_joined_room', { name: claimedNick });
        systemMsg(claimedNick + ' joined.', 'chat_sys_joined', { name: claimedNick });
        pushState();
      } catch (e) {
        _markInviteFailed(dc, 'Handshake failed: ' + String(e?.message || e));
        try { dc.close(); } catch (_) {}
      }
    });

    dc.addEventListener('message', (ev) => {
      const peer = [...state.peers.values()].find((p) => p.dc === dc);
      if (!peer || !peer.guard) return;
      peer.guard.handle(ev.data);
    });

    dc.addEventListener('close', () => {
      const entry = [...state.peers.entries()].find(([, p]) => p.dc === dc);
      const f = _findInviteByDc(dc);
      if (entry) {
        const [pid, p] = entry;
        state.peers.delete(pid);
        broadcastSystem((p.nickname || 'A peer') + ' left the room.', 'chat_sys_left_room', { name: p.nickname || 'A peer' });
        systemMsg((p.nickname || 'A peer') + ' left.', 'chat_sys_left', { name: p.nickname || 'A peer' });
      }
      if (f) state.invites.delete(f.id);
      pushState();
    });
  }

  function hostHandlePeerMessage(fromPeerId, msg) {
    const peer = state.peers.get(fromPeerId);
    if (!peer) return;
    if (msg.type === 'chat') {
      const author = peer.nickname || ('User-' + fromPeerId.slice(0, 4));
      appendMessage({ from: 'peer', author, text: msg.text, ts: msg.ts });
      hostBroadcastChat(author, msg.text, fromPeerId);
    } else if (msg.type === 'leave') {
      try { peer.dc?.close(); } catch (_) {}
    }
  }

  function hostBroadcastChat(author, text, exceptPeerId) {
    const wire = {
      type: 'chat', text, author, ts: Date.now(),
      senderId: state.mySenderId, nonce: nonceStr(),
    };
    const json = JSON.stringify(wire);
    for (const [pid, p] of state.peers) {
      if (pid === exceptPeerId) continue;
      try { p.dc?.send(json); } catch (_) {}
    }
  }

  function broadcastSystem(text, key, args) {
    const wire = {
      type: 'chat', text, author: '__system__', ts: Date.now(),
      senderId: state.mySenderId, nonce: nonceStr(),
      sysKey: key || null, sysArgs: args || null,
    };
    const json = JSON.stringify(wire);
    for (const [, p] of state.peers) { try { p.dc?.send(json); } catch (_) {} }
  }

  async function cmdHostCreateInvite() {
    if (state.role !== 'host') return { ok: false, error: 'Not hosting.' };
    if (state.invites.size >= MAX_PEERS) {
      return { ok: false, error: 'Room is full (max ' + (MAX_PEERS + 1) + ' people including you).' };
    }
    const inviteId = C.bytesToB64(C.generateNonce(4));
    let pc, dc;
    try {
      pc = createPc();
      dc = pc.createDataChannel('gf-chat-' + inviteId, { ordered: true });
      wireHostDataChannel(dc, pc);
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
    state.invites.set(inviteId, {
      pc, dc, packed: null, status: 'preparing',
      peerId: null, nickname: null, error: null,
    });
    pushState();
    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const candidates = await gatherCandidates(pc);
        const signed = await SG.signMessage(state.roomKey, {
          type: 'offer', roomId: state.roomId, from: 'host',
          seq: Date.now(), ts: Date.now(),
          payload: {
            sdp: pc.localDescription, candidates,
            hostNickname: state.nickname, hostPeerId: state.myPeerId,
          },
        });
        const packed = SG.pack(signed);
        const slot = state.invites.get(inviteId);
        if (!slot) return;
        slot.packed = packed;
        slot.status = 'pending';
        pushState();
      } catch (e) {
        const slot = state.invites.get(inviteId);
        if (!slot) return;
        slot.status = 'failed';
        slot.error = 'Could not create invite: ' + String(e?.message || e);
        pushState();
      }
    })();
    return { ok: true, inviteId };
  }

  function cmdHostCancelInvite({ inviteId }) {
    const slot = state.invites.get(inviteId);
    if (!slot) return { ok: false };
    try { slot.dc?.close(); } catch (_) {}
    try { slot.pc?.close(); } catch (_) {}
    state.invites.delete(inviteId);
    pushState();
    return { ok: true };
  }

  async function cmdHostAcceptAnswer({ inviteId, blob }) {
    const slot = state.invites.get(inviteId);
    if (!slot) return { ok: false, error: 'Invite not found.' };
    if (!blob) return { ok: false, error: 'Paste their answer blob first.' };
    let parsed;
    try { parsed = SG.unpack(blob); }
    catch (_) {
      slot.status = 'failed'; slot.error = 'That doesn\u2019t look like a valid answer blob.'; pushState();
      return { ok: false, error: slot.error };
    }
    const verified = await SG.verifyMessage(state.roomKey, parsed, { expectedRoomId: state.roomId });
    if (!verified || verified.type !== 'answer') {
      slot.status = 'failed'; slot.error = 'Invalid or unsigned answer, wrong room code or corrupted blob.'; pushState();
      return { ok: false, error: slot.error };
    }
    if (slot.pc.signalingState !== 'have-local-offer') {
      slot.status = 'failed'; slot.error = 'This invite has already been used.'; pushState();
      return { ok: false, error: slot.error };
    }
    try {
      await slot.pc.setRemoteDescription(verified.payload.sdp);
      for (const c of verified.payload.candidates || []) {
        try { await slot.pc.addIceCandidate(c); } catch (_) {}
      }
      slot._claimedNickname = String(verified.payload.joinerNickname || '').slice(0, MAX_NICKNAME);
      slot.status = 'connecting';
      slot.error = null;
      pushState();
      return { ok: true };
    } catch (e) {
      const msg = String(e?.message || e);
      slot.status = 'failed';
      slot.error = /wrong state|stable/i.test(msg)
        ? 'This invite has already been used.'
        : 'Failed to connect: ' + msg;
      pushState();
      return { ok: false, error: slot.error };
    }
  }

  function cmdHostClose() {
    cleanupAll();
    pushState();
    return { ok: true };
  }

  function wireJoinerDataChannel(dc, hostPeerIdFromOffer, hostNickname) {
    dc.binaryType = 'arraybuffer';
    if (state.hostConn) state.hostConn.dc = dc;
    dc.addEventListener('open', async () => {
      const send = (obj) => { try { dc.send(JSON.stringify(obj)); } catch (_) {} };
      try {
        const result = await HS.runJoinerHandshake(state.roomKey, dc, send, state.myPeerId);
        const peerSenderId = await PI.deriveToken(
          state.roomKey, result.hostPeerId || hostPeerIdFromOffer, PI.currentHourBucket()
        );
        const guard = CG.createGuard({
          expectedSenderId: peerSenderId,
          onValid: joinerHandleHostMessage,
          onDrop: (r) => console.debug('[GfChat joiner] drop:', r),
        });
        state.hostConn = { pc: state.hostConn?.pc, dc, guard, peerSenderId, hostNickname };
        state.joinerAnswerPacked = null;
        pushState();
      } catch (e) {
        try { dc.close(); } catch (_) {}
      }
    });
    dc.addEventListener('message', (ev) => {
      if (!state.hostConn?.guard) return;
      state.hostConn.guard.handle(ev.data);
    });
    dc.addEventListener('close', () => {
      if (state.role !== 'joiner') return;
      systemMsg('Disconnected from host.', 'chat_sys_disconnected');
      cleanupAll();
      pushState();
    });
  }

  function joinerHandleHostMessage(msg) {
    if (msg.type === 'chat') {
      const author = (typeof msg.author === 'string' && msg.author)
        ? msg.author
        : (state.hostConn?.hostNickname || 'Host');
      if (author === '__system__') {
        appendMessage({ from: 'system', text: msg.text, key: msg.sysKey || null, args: msg.sysArgs || null, ts: msg.ts });
      } else {
        appendMessage({ from: 'peer', author, text: msg.text, ts: msg.ts });
      }
    } else if (msg.type === 'leave') {
      systemMsg('Host closed the room.', 'chat_sys_host_closed');
      cleanupAll();
      pushState();
    }
  }

  async function cmdJoinStart({ code, blob }) {
    if (state.role) return { ok: false, error: 'Already in a room.' };
    let codeBytes;
    try { codeBytes = C.parseRoomCode(code); }
    catch (_) { return { ok: false, error: 'That room code looks wrong (typo?).' }; }
    if (codeBytes.length < 16) return { ok: false, error: 'Room code is too short.' };
    state.role = 'joiner';
    try {
      state.roomKey = await C.deriveRoomKey(codeBytes);
      C.wipe(codeBytes);
      const parsed = SG.unpack(blob);
      const verified = await SG.verifyMessage(state.roomKey, parsed);
      if (!verified || verified.type !== 'offer') {
        cleanupAll(); pushState();
        return { ok: false, error: 'Invalid or unsigned invite, wrong room code or corrupted blob.' };
      }
      state.roomId = verified.roomId;
      state.myPeerId = C.bytesToB64(C.generateNonce(8));
      state.peerSession = PI.createSession(state.roomKey, state.myPeerId, (next) => {
        state.mySenderId = next;
      });
      state.mySenderId = await state.peerSession.init();
      const pc = createPc();
      pc.addEventListener('datachannel', (ev) => {
        wireJoinerDataChannel(ev.channel, verified.payload.hostPeerId, verified.payload.hostNickname);
      });
      await pc.setRemoteDescription(verified.payload.sdp);
      for (const c of verified.payload.candidates || []) {
        try { await pc.addIceCandidate(c); } catch (_) {}
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const candidates = await gatherCandidates(pc);
      const signed = await SG.signMessage(state.roomKey, {
        type: 'answer', roomId: state.roomId, from: 'joiner',
        seq: Date.now(), ts: Date.now(),
        payload: {
          sdp: pc.localDescription, candidates,
          joinerNickname: state.nickname, joinerPeerId: state.myPeerId,
        },
      });
      const packed = SG.pack(signed);
      state.hostConn = { pc, dc: null, guard: null, peerSenderId: null, hostNickname: verified.payload.hostNickname || 'Host' };
      state.joinerAnswerPacked = packed;
      pushState();
      return { ok: true, packed };
    } catch (e) {
      cleanupAll(); pushState();
      return { ok: false, error: 'Join failed: ' + String(e?.message || e) };
    }
  }

  function cmdJoinLeave() {
    cleanupAll();
    pushState();
    return { ok: true };
  }

  function cmdChatSend({ text }) {
    text = String(text || '').slice(0, CG.MAX_TEXT_LEN).trim();
    if (!text) return { ok: false };
    if (state.role === 'host') {
      appendMessage({ from: 'me', author: state.nickname, text, ts: Date.now() });
      hostBroadcastChat(state.nickname, text, null);
      return { ok: true };
    }
    if (state.role === 'joiner') {
      const dc = state.hostConn?.dc;
      if (!dc || dc.readyState !== 'open') {
        systemMsg('Not connected.', 'chat_sys_not_connected');
        return { ok: false };
      }
      const wire = {
        type: 'chat', text, ts: Date.now(),
        senderId: state.mySenderId, nonce: nonceStr(),
        author: state.nickname,
      };
      try {
        dc.send(JSON.stringify(wire));
        appendMessage({ from: 'me', author: state.nickname, text, ts: wire.ts });
        return { ok: true };
      } catch (_) {
        systemMsg('Send failed.', 'chat_sys_send_failed');
        return { ok: false };
      }
    }
    return { ok: false };
  }

  function cmdSetNickname({ nickname }) {
    state.nickname = String(nickname || '').trim().slice(0, MAX_NICKNAME);
    pushState();
    return { ok: true };
  }

  function cmdAckIp() {
    state.ipAcknowledged = true;
    pushState();
    return { ok: true };
  }

  function cmdSetOverlayVisible({ visible }) {
    state.overlayVisible = !!visible;
    pushState();
    return { ok: true };
  }

  function cmdToggleOverlay() {
    state.overlayVisible = !state.overlayVisible;
    pushState();
    return { ok: true };
  }

  function cmdGetState() { return { ok: true, state: snapshot() }; }

  const HANDLERS = {
    'getState': cmdGetState,
    'setNickname': cmdSetNickname,
    'ackIp': cmdAckIp,
    'setOverlayVisible': cmdSetOverlayVisible,
    'toggleOverlay': cmdToggleOverlay,
    'host:create': cmdHostCreate,
    'host:createInvite': cmdHostCreateInvite,
    'host:cancelInvite': cmdHostCancelInvite,
    'host:acceptAnswer': cmdHostAcceptAnswer,
    'host:close': cmdHostClose,
    'join:start': cmdJoinStart,
    'join:leave': cmdJoinLeave,
    'chat:send': cmdChatSend,
  };

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.ns !== 'gf-chat-cmd-direct') return false;
    const handler = HANDLERS[msg.cmd];
    if (!handler) {
      sendResponse({ ok: false, error: 'unknown command' });
      return false;
    }
    Promise.resolve()
      .then(() => handler(msg.payload || {}))
      .then((r) => { try { sendResponse(r); } catch (_) {} })
      .catch((e) => { try { sendResponse({ ok: false, error: String(e?.message || e) }); } catch (_) {} });
    return true;
  });

  try {
    chrome.runtime.sendMessage({ ns: 'gf-chat-event', kind: 'ready' }).catch(() => {});
  } catch (_) {}
})();
