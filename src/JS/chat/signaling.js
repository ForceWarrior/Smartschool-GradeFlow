(function () {
  'use strict';

  const C = globalThis.GfChatCrypto;
  if (!C) throw new Error('GfChatSignaling: crypto-utils.js must load first');

  const ALLOWED_TYPES = new Set(['offer', 'answer', 'ice', 'ice-end']);
  const SIG_LABEL = 'gradeflow.chat.v1.signaling-hmac';

  async function getSigningKey(masterKey) {
    return C.deriveHmacKey(masterKey, SIG_LABEL);
  }


function canonicalize(msg) {
    const parts = [
      'v1',
      String(msg.type),
      String(msg.roomId || ''),
      String(msg.from || ''),
      String(msg.seq | 0),
      String(msg.ts | 0),
      JSON.stringify(msg.payload ?? null),
    ];
    return C.enc.encode(parts.join('\n'));
  }

  async function signMessage(masterKey, msg) {
    if (!ALLOWED_TYPES.has(msg.type)) throw new Error('Bad signaling type');
    const key = await getSigningKey(masterKey);
    const sig = await C.hmacSign(key, canonicalize(msg));
    return { ...msg, sig: C.bytesToB64(sig) };
  }


async function verifyMessage(masterKey, signed, opts = {}) {
    try {
      if (!signed || typeof signed !== 'object') return null;
      if (!ALLOWED_TYPES.has(signed.type)) return null;
      if (typeof signed.sig !== 'string') return null;
      if (opts.expectedRoomId && signed.roomId !== opts.expectedRoomId) return null;

      const tag = C.b64ToBytes(signed.sig);
      const key = await getSigningKey(masterKey);
      const data = canonicalize(signed);
      const ok = await C.hmacVerify(key, data, tag);
      if (!ok) return null;


      if (signed.ts && Math.abs(Date.now() - signed.ts) > 5 * 60_000) return null;
      return signed;
    } catch (_) {
      return null;
    }
  }


  function pack(signed) {
    return C.bytesToB64(C.enc.encode(JSON.stringify(signed)));
  }
  function unpack(blob) {
    try { return JSON.parse(C.dec.decode(C.b64ToBytes(String(blob).trim()))); }
    catch (_) { return null; }
  }

  globalThis.GfChatSignaling = {
    ALLOWED_TYPES,
    signMessage, verifyMessage,
    pack, unpack,
  };
})();
