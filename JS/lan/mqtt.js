(function () {
  'use strict';

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function Str(s) {
    const b = enc.encode(s);
    return [b.length >> 8, b.length & 255, ...b];
  }

  function Len(n) {
    const out = [];
    do {
      let byte = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) byte |= 128;
      out.push(byte);
    } while (n > 0);
    return out;
  }

  function Packet(head, body) {
    const len = Len(body.length);
    const out = new Uint8Array(1 + len.length + body.length);
    out[0] = head;
    out.set(len, 1);
    out.set(body, 1 + len.length);
    return out;
  }

  function Concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  }

  function Client(url, onMessage) {
    const topics = new Set();
    let ws = null, buf = new Uint8Array(0), alive = true, ready = false, ping = 0, retry = 0, pid = 1, backoff = 1500;

    function Send(bytes) {
      if (ws && ws.readyState === 1) ws.send(bytes);
    }

    function SubscribeNow(topic) {
      pid = pid % 65535 + 1;
      Send(Packet(0x82, [pid >> 8, pid & 255, ...Str(topic), 0]));
    }

    function Handle(type, flags, body) {
      if (type === 2) {
        if (body[1] !== 0) return ws.close();
        ready = true;
        backoff = 1500;
        topics.forEach(SubscribeNow);
      } else if (type === 3) {
        const tlen = (body[0] << 8) | body[1];
        const topic = dec.decode(body.subarray(2, 2 + tlen));
        const offset = 2 + tlen + (((flags >> 1) & 3) ? 2 : 0);
        onMessage(topic, body.slice(offset), url);
      }
    }

    function Parse() {
      while (buf.length >= 2) {
        let mult = 1, len = 0, i = 1, byte;
        do {
          if (i >= buf.length) return;
          byte = buf[i++];
          len += (byte & 127) * mult;
          mult *= 128;
        } while (byte & 128 && i < 5);
        if (buf.length < i + len) return;
        Handle(buf[0] >> 4, buf[0] & 15, buf.subarray(i, i + len));
        buf = buf.slice(i + len);
      }
    }

    function Connect() {
      if (!alive) return;
      ready = false;
      buf = new Uint8Array(0);
      try { ws = new WebSocket(url, ['mqtt']); } catch (_) { Schedule(); return; }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        const id = 'gf' + Math.random().toString(36).slice(2, 12);
        Send(Packet(0x10, [...Str('MQTT'), 4, 2, 0, 60, ...Str(id)]));
        clearInterval(ping);
        ping = setInterval(() => Send(new Uint8Array([0xc0, 0])), 25000);
      };
      ws.onmessage = e => { buf = Concat(buf, new Uint8Array(e.data)); Parse(); };
      ws.onclose = () => { ready = false; clearInterval(ping); Schedule(); };
      ws.onerror = () => {};
    }

    function Schedule() {
      if (!alive) return;
      clearTimeout(retry);
      retry = setTimeout(Connect, backoff);
      backoff = Math.min(backoff * 2, 30000);
    }

    Connect();

    return {
      url,
      get ready() { return ready; },
      subscribe(topic) {
        if (topics.has(topic)) return;
        topics.add(topic);
        if (ready) SubscribeNow(topic);
      },
      unsubscribe(topic) {
        if (!topics.delete(topic) || !ready) return;
        pid = pid % 65535 + 1;
        Send(Packet(0xa2, [pid >> 8, pid & 255, ...Str(topic)]));
      },
      publish(topic, payload) {
        if (!ready) return false;
        const t = Str(topic);
        const body = new Uint8Array(t.length + payload.length);
        body.set(t, 0);
        body.set(payload, t.length);
        Send(Packet(0x30, body));
        return true;
      },
      get topicCount() { return topics.size; },
      close() {
        alive = false;
        clearTimeout(retry);
        clearInterval(ping);
        if (ws) { try { Send(new Uint8Array([0xe0, 0])); ws.close(); } catch (_) {} }
      },
    };
  }

  globalThis.GfMqtt = { Client };
})();
