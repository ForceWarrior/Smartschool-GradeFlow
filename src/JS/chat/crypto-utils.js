(function () {
  'use strict';

  const subtle = (globalThis.crypto && globalThis.crypto.subtle) || null;
  if (!subtle) throw new Error('GfChat: Web Crypto subtle unavailable');

  const enc = new TextEncoder();
  const dec = new TextDecoder();


const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function bytesToBase32(bytes) {
    let bits = 0, value = 0, out = '';
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        out += ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
    return out;
  }

  function base32ToBytes(str) {
    const clean = str.toUpperCase().replace(/[^A-Z2-9]/g, '');
    const out = [];
    let bits = 0, value = 0;
    for (const c of clean) {
      const idx = ALPHABET.indexOf(c);
      if (idx < 0) throw new Error('Invalid room-code character');
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return new Uint8Array(out);
  }

  function bytesToB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64ToBytes(b64) {
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }


  function ctEqual(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }


function wipe(buf) {
    if (buf && buf.byteLength) {
      try { crypto.getRandomValues(new Uint8Array(buf.buffer || buf)); } catch (_) {}
    }
  }


  function generateRoomCodeBytes() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytes;
  }


  function formatRoomCode(bytes) {
    const raw = bytesToBase32(bytes);
    return raw.match(/.{1,5}/g).join('-');
  }

  function parseRoomCode(str) {
    return base32ToBytes(str);
  }

  function generateNonce(byteLen = 32) {
    const n = new Uint8Array(byteLen);
    crypto.getRandomValues(n);
    return n;
  }


async function deriveRoomKey(roomCodeBytes, passwordStrOrBytes) {
    if (!(roomCodeBytes instanceof Uint8Array) || roomCodeBytes.length < 16) {
      throw new Error('Room code must be >=128 bits');
    }
    let material = roomCodeBytes;
    if (passwordStrOrBytes != null && passwordStrOrBytes !== '') {
      const pwBytes = passwordStrOrBytes instanceof Uint8Array
        ? passwordStrOrBytes
        : enc.encode(String(passwordStrOrBytes));

material = new Uint8Array(roomCodeBytes.length + 1 + pwBytes.length);
      material.set(roomCodeBytes, 0);
      material[roomCodeBytes.length] = 0x1f;
      material.set(pwBytes, roomCodeBytes.length + 1);
    }
    const baseKey = await subtle.importKey(
      'raw', material, { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const pbkdf2Bits = await subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: enc.encode('gradeflow.chat.v1.salt'),
        iterations: 200_000,
      },
      baseKey,
      256
    );

    return subtle.importKey(
      'raw', pbkdf2Bits, { name: 'HKDF' }, false, ['deriveKey', 'deriveBits']
    );
  }


  async function deriveHmacKey(masterHkdfKey, label, salt = new Uint8Array(0)) {
    return subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(label) },
      masterHkdfKey,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      false,
      ['sign', 'verify']
    );
  }


  async function deriveBits(masterHkdfKey, label, salt, lengthBits) {
    return subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(label) },
      masterHkdfKey,
      lengthBits
    );
  }

  async function hmacSign(hmacKey, data) {
    const sig = await subtle.sign('HMAC', hmacKey, data);
    return new Uint8Array(sig);
  }


async function hmacVerify(hmacKey, data, tag) {
    return subtle.verify('HMAC', hmacKey, tag, data);
  }

  async function sha256(data) {
    return new Uint8Array(await subtle.digest('SHA-256', data));
  }

  globalThis.GfChatCrypto = {
    enc, dec,
    bytesToB64, b64ToBytes,
    bytesToBase32, base32ToBytes,
    ctEqual, wipe,
    generateRoomCodeBytes, formatRoomCode, parseRoomCode,
    generateNonce,
    deriveRoomKey, deriveHmacKey, deriveBits,
    hmacSign, hmacVerify, sha256,
  };
})();
