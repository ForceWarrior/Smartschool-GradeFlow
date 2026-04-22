(function () {
  'use strict';

  const C = globalThis.GfChatCrypto;
  if (!C) throw new Error('GfChatHandshake: crypto-utils.js must load first');

  const HS_LABEL = 'gradeflow.chat.v1.handshake-hmac';
  const HS_TIMEOUT_MS = 10_000;

  async function getHsKey(masterKey) {
    return C.deriveHmacKey(masterKey, HS_LABEL);
  }


function runHostHandshake(masterKey, channel, send, myPeerId) {
    return new Promise(async (resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        channel.removeEventListener('message', onMsg);
      };
      const fail = (why) => {
        if (settled) return;
        settled = true;
        cleanup();
        try { channel.close(); } catch (_) {}
        reject(new Error(why));
      };

      const timer = setTimeout(() => fail('handshake-timeout'), HS_TIMEOUT_MS);
      const nonce = C.generateNonce(32);
      const hostPeerId = myPeerId || C.bytesToB64(C.generateNonce(8));

      let hsKey;
      try { hsKey = await getHsKey(masterKey); }
      catch (e) { return fail('handshake-key-derivation: ' + (e.message || e)); }

      const onMsg = async (ev) => {
        if (settled) return;
        let msg;
        try { msg = JSON.parse(ev.data); } catch (_) { return fail('handshake-bad-json'); }
        if (!msg || msg.t !== 'hs-resp' || typeof msg.tag !== 'string' || typeof msg.peerId !== 'string') {
          return fail('handshake-bad-resp');
        }
        try {
          const tag = C.b64ToBytes(msg.tag);
          const ok = await C.hmacVerify(hsKey, nonce, tag);
          if (!ok) return fail('handshake-bad-tag');


const ackTag = await C.hmacSign(hsKey, C.enc.encode('host:' + hostPeerId + ':' + msg.peerId));
          send({ t: 'hs-ack', peerId: hostPeerId, tag: C.bytesToB64(ackTag) });

          settled = true;
          cleanup();
          C.wipe(nonce);
          resolve({ peerId: msg.peerId, hostPeerId });
        } catch (e) {
          fail('handshake-error: ' + (e.message || e));
        }
      };

      channel.addEventListener('message', onMsg);
      send({ t: 'hs-chal', nonce: C.bytesToB64(nonce) });
    });
  }

  function runJoinerHandshake(masterKey, channel, send, myPeerId) {
    return new Promise(async (resolve, reject) => {
      let settled = false;
      let nonce = null;
      const cleanup = () => {
        clearTimeout(timer);
        channel.removeEventListener('message', onMsg);
      };
      const fail = (why) => {
        if (settled) return;
        settled = true;
        cleanup();
        try { channel.close(); } catch (_) {}
        reject(new Error(why));
      };

      const timer = setTimeout(() => fail('handshake-timeout'), HS_TIMEOUT_MS);
      const joinerPeerId = myPeerId || C.bytesToB64(C.generateNonce(8));

      let hsKey;
      try { hsKey = await getHsKey(masterKey); }
      catch (e) { return fail('handshake-key-derivation: ' + (e.message || e)); }

      const onMsg = async (ev) => {
        if (settled) return;
        let msg;
        try { msg = JSON.parse(ev.data); } catch (_) { return fail('handshake-bad-json'); }
        try {
          if (msg.t === 'hs-chal' && typeof msg.nonce === 'string') {
            nonce = C.b64ToBytes(msg.nonce);
            const tag = await C.hmacSign(hsKey, nonce);
            send({ t: 'hs-resp', peerId: joinerPeerId, tag: C.bytesToB64(tag) });
            return;
          }
          if (msg.t === 'hs-ack' && typeof msg.tag === 'string' && typeof msg.peerId === 'string') {
            const expect = C.enc.encode('host:' + msg.peerId + ':' + joinerPeerId);
            const ok = await C.hmacVerify(hsKey, expect, C.b64ToBytes(msg.tag));
            if (!ok) return fail('handshake-bad-ack');
            settled = true;
            cleanup();
            if (nonce) C.wipe(nonce);
            return resolve({ peerId: joinerPeerId, hostPeerId: msg.peerId });
          }
          return fail('handshake-unexpected');
        } catch (e) {
          fail('handshake-error: ' + (e.message || e));
        }
      };

      channel.addEventListener('message', onMsg);
    });
  }

  globalThis.GfChatHandshake = { runHostHandshake, runJoinerHandshake, HS_TIMEOUT_MS };
})();
