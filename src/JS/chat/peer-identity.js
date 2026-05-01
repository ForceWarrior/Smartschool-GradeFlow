(function () {
  'use strict';

  const C = globalThis.GfChatCrypto;
  if (!C) throw new Error('GfChatPeerIdentity: crypto-utils.js must load first');

  const ID_LABEL = 'gradeflow.chat.v1.peer-id';
  const HOUR_MS = 60 * 60 * 1000;

  function currentHourBucket(now = Date.now()) {
    return Math.floor(now / HOUR_MS);
  }

  async function deriveToken(masterKey, peerId, hourBucket) {
    const info = `${ID_LABEL}|${peerId}|${hourBucket}`;
    const bits = await C.deriveBits(
      masterKey,
      info,
      new Uint8Array(0),
      128
    );
    return C.bytesToB64(new Uint8Array(bits));
  }


function createSession(masterKey, peerId, onRotate) {
    let current = null;
    let bucket = -1;
    let timer = null;
    let stopped = false;

    async function refresh() {
      if (stopped) return current;
      const b = currentHourBucket();
      if (b === bucket && current) return current;
      const next = await deriveToken(masterKey, peerId, b);
      const prev = current;
      current = next;
      bucket = b;
      if (prev && typeof onRotate === 'function') {
        try { onRotate(next, prev); } catch (_) {}
      }
      return current;
    }

    function scheduleNext() {
      if (stopped) return;
      const now = Date.now();
      const msToTopOfHour = HOUR_MS - (now % HOUR_MS) + 1_000;
      timer = setTimeout(async () => {
        await refresh();
        scheduleNext();
      }, msToTopOfHour);
    }

    function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
      current = null;
      bucket = -1;
    }

    return {
      init: async () => { await refresh(); scheduleNext(); return current; },
      refresh,
      getCurrent: () => current,
      stop,
    };
  }

  globalThis.GfChatPeerIdentity = { createSession, deriveToken, currentHourBucket };
})();
