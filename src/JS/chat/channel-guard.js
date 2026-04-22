(function () {
  'use strict';

  const ALLOWED_TYPES = new Set(['chat', 'typing', 'leave', 'ping', 'pong']);
  const REPLAY_WINDOW_MS = 30_000;
  const RATE_LIMIT = 20;
  const RATE_PAUSE_MS = 5_000;
  const MAX_MSG_BYTES = 4 * 1024;
  const MAX_TEXT_LEN = 1000;
  const RECONNECT_LIMIT = 3;
  const RECONNECT_WINDOW_MS = 60_000;

  function createGuard({ expectedSenderId, onValid, onDrop }) {
    const state = {
      ts: [],
      pausedUntil: 0,
      seenNonces: new Map(),
      reconnects: [],
      backoffMs: 0,
    };

    const drop = (reason, raw) => {
      if (typeof onDrop === 'function') {
        try { onDrop(reason, raw); } catch (_) {}
      }
    };

    function pruneNonces(now) {
      for (const [n, t] of state.seenNonces) {
        if (now - t > REPLAY_WINDOW_MS) state.seenNonces.delete(n);
      }
    }

    function handle(rawData) {
      const now = Date.now();

      if (now < state.pausedUntil) return drop('rate-paused', rawData);


      while (state.ts.length && now - state.ts[0] > 1000) state.ts.shift();
      if (state.ts.length >= RATE_LIMIT) {
        state.pausedUntil = now + RATE_PAUSE_MS;
        state.ts.length = 0;
        return drop('rate-limit', rawData);
      }

      if (typeof rawData !== 'string') return drop('non-string', rawData);
      if (rawData.length > MAX_MSG_BYTES) return drop('oversized', null);

      let msg;
      try { msg = JSON.parse(rawData); } catch (_) { return drop('bad-json', null); }
      if (!msg || typeof msg !== 'object') return drop('not-object', null);

      if (typeof msg.type !== 'string' || !ALLOWED_TYPES.has(msg.type)) {
        return drop('bad-type', msg);
      }
      if (typeof msg.ts !== 'number' || !Number.isFinite(msg.ts)) {
        return drop('bad-ts', msg);
      }
      if (Math.abs(now - msg.ts) > REPLAY_WINDOW_MS) {
        return drop('stale-or-future', msg);
      }
      if (typeof msg.senderId !== 'string' || msg.senderId !== expectedSenderId) {
        return drop('bad-sender', msg);
      }
      if (typeof msg.nonce !== 'string' || msg.nonce.length < 8 || msg.nonce.length > 64) {
        return drop('bad-nonce', msg);
      }

      pruneNonces(now);
      if (state.seenNonces.has(msg.nonce)) return drop('replay', msg);
      state.seenNonces.set(msg.nonce, now);

      if (msg.type === 'chat') {
        if (typeof msg.text !== 'string') return drop('bad-text', msg);
        if (msg.text.length === 0 || msg.text.length > MAX_TEXT_LEN) return drop('bad-text-len', msg);
      }

      state.ts.push(now);
      try { onValid(msg); } catch (_) {  }
    }


    function trackReconnect(success) {
      const now = Date.now();
      state.reconnects = state.reconnects.filter(t => now - t < RECONNECT_WINDOW_MS);

      if (success) { state.backoffMs = 0; return { allowed: true, waitMs: 0 }; }

      state.reconnects.push(now);

      state.backoffMs = state.backoffMs ? Math.min(state.backoffMs * 2, 60_000) : 2_000;

      if (state.reconnects.length > RECONNECT_LIMIT) {
        return { allowed: false, waitMs: RECONNECT_WINDOW_MS };
      }
      return { allowed: true, waitMs: state.backoffMs };
    }

    function setExpectedSenderId(id) { expectedSenderId = id; }

    return { handle, trackReconnect, setExpectedSenderId };
  }

  globalThis.GfChatChannelGuard = {
    createGuard,
    ALLOWED_TYPES,
    REPLAY_WINDOW_MS,
    RATE_LIMIT,
    RATE_PAUSE_MS,
    MAX_MSG_BYTES,
    MAX_TEXT_LEN,
  };
})();
