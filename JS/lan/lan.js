(function () {
  'use strict';

  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt',
  ];
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const HELLO_MS = 4000;
  const PEER_TTL = 14000;
  const MAX_PEERS = 15;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const pool = new Map();
  const routes = new Map();
  let netCache = null;

  function Hex(buf) {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function RandomId() {
    return Hex(crypto.getRandomValues(new Uint8Array(8)));
  }

  function Broker(url) {
    let c = pool.get(url);
    if (!c) {
      c = GfMqtt.Client(url, (topic, payload, from) => routes.get(topic)?.forEach(f => f(payload, from)));
      pool.set(url, c);
    }
    return c;
  }

  function ReleaseBrokers() {
    for (const [url, c] of pool) {
      if (c.topicCount) continue;
      c.close();
      pool.delete(url);
    }
  }

  function StunAddress() {
    return new Promise(resolve => {
      const pc = new RTCPeerConnection({ iceServers: ICE });
      const found = [];
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        pc.close();
        const v4 = found.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        if (v4) return resolve(v4);
        const v6 = found.find(a => a.includes(':'));
        resolve(v6 ? v6.split(':').slice(0, 4).join(':') + '::/64' : '');
      };
      pc.onicecandidate = e => {
        if (!e.candidate) return finish();
        const m = / typ srflx /.test(e.candidate.candidate) && e.candidate.candidate.split(' ')[4];
        if (m) {
          found.push(m);
          if (/^\d+\.\d+\.\d+\.\d+$/.test(m)) finish();
        }
      };
      pc.createDataChannel('x');
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(finish);
      setTimeout(finish, 2500);
    });
  }

  async function NetworkId() {
    if (netCache && Date.now() - netCache.at < 10 * 60 * 1000) return netCache.id;
    let id = await StunAddress();
    if (!id) {
      try {
        const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        id = (await r.json()).ip || '';
      } catch (_) {}
    }
    if (id) netCache = { id, at: Date.now() };
    return id;
  }

  async function RoomKeys(netId, channel) {
    const topicHash = await crypto.subtle.digest('SHA-256', enc.encode(`gradeflow-lan-v1|${netId}|${channel}`));
    const base = await crypto.subtle.importKey('raw', enc.encode(netId), 'HKDF', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('gradeflow-lan-v1'), info: enc.encode(channel) },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { topic: `gradeflow/v1/${Hex(topicHash).slice(0, 40)}`, key };
  }

  async function Seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv, 0);
    out.set(ct, 12);
    return out;
  }

  async function Open(key, bytes) {
    if (bytes.length < 29 || bytes.length > 16384) return null;
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));
      return JSON.parse(dec.decode(pt));
    } catch (_) { return null; }
  }

  function GatherComplete(pc) {
    return new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const t = setTimeout(resolve, 2500);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
      });
    });
  }

  function CleanName(v) {
    return String(v || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 24);
  }

  function Join(channel, opts) {
    const selfId = RandomId();
    const peers = new Map();
    const seen = new Map();
    let name = CleanName(opts.name) || 'Speler';
    let keys = null, hello = 0, sweep = 0, closed = false;

    const status = s => opts.onStatus?.(s, selfId);

    async function Publish(obj) {
      if (!keys || closed) return;
      const bytes = await Seal(keys.key, { ...obj, from: selfId, m: RandomId() });
      for (const url of BROKERS) Broker(url).publish(keys.topic, bytes);
    }

    function Hello() {
      Publish({ t: 'hi', name });
    }

    function Peer(id) {
      let p = peers.get(id);
      if (!p) {
        p = { id, name: 'Speler', seen: 0, pc: null, r: null, u: null, open: false, tried: -1e9 };
        peers.set(id, p);
      }
      return p;
    }

    function Drop(p, notify = true) {
      try { p.r?.close(); } catch (_) {}
      try { p.u?.close(); } catch (_) {}
      try { p.pc?.close(); } catch (_) {}
      const was = p.open;
      p.pc = p.r = p.u = null;
      p.open = false;
      if (was && notify) opts.onLeave?.(p.id);
    }

    function WireChannel(p, dc) {
      dc.binaryType = 'arraybuffer';
      if (dc.label === 'r') p.r = dc; else p.u = dc;
      dc.onopen = () => {
        if (p.r?.readyState === 'open' && p.u?.readyState === 'open' && !p.open) {
          p.open = true;
          opts.onPeer?.({ id: p.id, name: p.name });
        }
      };
      dc.onclose = () => { if (peers.get(p.id) === p && (p.r === dc || p.u === dc)) Drop(p); };
      dc.onmessage = e => {
        if (typeof e.data !== 'string' || e.data.length > 65536) return;
        let data;
        try { data = JSON.parse(e.data); } catch (_) { return; }
        opts.onMessage?.(p.id, data, dc.label === 'r');
      };
    }

    function NewPc(p) {
      Drop(p, false);
      const pc = new RTCPeerConnection({ iceServers: ICE });
      p.pc = pc;
      p.tried = performance.now();
      pc.onconnectionstatechange = () => {
        if ((pc.connectionState === 'failed' || pc.connectionState === 'closed') && p.pc === pc) Drop(p);
      };
      pc.ondatachannel = e => WireChannel(p, e.channel);
      return pc;
    }

    async function Offer(p) {
      const pc = NewPc(p);
      WireChannel(p, pc.createDataChannel('r', { ordered: true }));
      WireChannel(p, pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 }));
      await pc.setLocalDescription(await pc.createOffer());
      await GatherComplete(pc);
      if (p.pc === pc) Publish({ t: 'offer', to: p.id, sdp: pc.localDescription.sdp, name });
    }

    async function Answer(p, sdp) {
      const pc = NewPc(p);
      await pc.setRemoteDescription({ type: 'offer', sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await GatherComplete(pc);
      if (p.pc === pc) Publish({ t: 'answer', to: p.id, sdp: pc.localDescription.sdp });
    }

    function Note(p, msg) {
      p.seen = performance.now();
      if (msg.name) {
        const n = CleanName(msg.name);
        if (n && n !== p.name) {
          p.name = n;
          if (p.open) opts.onRename?.(p.id, n);
        }
      }
    }

    async function OnRelay(payload) {
      const msg = await Open(keys.key, payload);
      if (!msg || typeof msg.from !== 'string' || msg.from === selfId || closed) return;
      if (seen.has(msg.m)) return;
      seen.set(msg.m, performance.now());
      if (msg.to && msg.to !== selfId) return;
      if (msg.t === 'bye') {
        const p = peers.get(msg.from);
        if (p) { Drop(p); peers.delete(msg.from); }
        return;
      }
      const known = peers.has(msg.from);
      if (!known && [...peers.values()].filter(x => x.open).length >= MAX_PEERS) return;
      const p = Peer(msg.from);
      Note(p, msg);
      if (msg.t === 'hi') {
        if (!known) Hello();
        if (!p.open && selfId < p.id && performance.now() - p.tried > 8000) Offer(p).catch(() => Drop(p, false));
      } else if (msg.t === 'offer' && typeof msg.sdp === 'string') {
        Answer(p, msg.sdp).catch(() => Drop(p, false));
      } else if (msg.t === 'answer' && typeof msg.sdp === 'string' && p.pc?.signalingState === 'have-local-offer') {
        p.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).catch(() => Drop(p, false));
      }
    }

    function Sweep() {
      const now = performance.now();
      for (const [id, t] of seen) if (now - t > 60000) seen.delete(id);
      for (const [id, p] of peers) {
        if (!p.open && now - p.seen > PEER_TTL) { Drop(p, false); peers.delete(id); }
      }
      const live = BROKERS.some(url => pool.get(url)?.ready);
      status(live ? 'online' : 'connecting');
    }

    (async () => {
      status('discovering');
      const netId = await NetworkId();
      if (closed) return;
      if (!netId) { status('offline'); return; }
      keys = await RoomKeys(netId, channel);
      if (closed) return;
      if (!routes.has(keys.topic)) routes.set(keys.topic, new Set());
      routes.get(keys.topic).add(OnRelay);
      for (const url of BROKERS) Broker(url).subscribe(keys.topic);
      status('connecting');
      setTimeout(Hello, 600);
      hello = setInterval(Hello, HELLO_MS);
      sweep = setInterval(Sweep, 1500);
    })();

    return {
      selfId,
      peers() { return [...peers.values()].filter(p => p.open).map(p => ({ id: p.id, name: p.name })); },
      rename(n) { name = CleanName(n) || name; Hello(); },
      send(to, data, reliable = true) {
        const json = JSON.stringify(data);
        for (const p of to ? [peers.get(to)] : peers.values()) {
          const dc = p && (reliable ? p.r : p.u);
          if (p?.open && dc?.readyState === 'open' && dc.bufferedAmount < 1 << 20) dc.send(json);
        }
      },
      close() {
        if (closed) return;
        Publish({ t: 'bye' });
        closed = true;
        clearInterval(hello);
        clearInterval(sweep);
        for (const p of peers.values()) Drop(p, false);
        peers.clear();
        const set = keys && routes.get(keys.topic);
        if (set?.delete(OnRelay) && !set.size) {
          routes.delete(keys.topic);
          for (const url of BROKERS) pool.get(url)?.unsubscribe(keys.topic);
        }
        setTimeout(ReleaseBrokers, 500);
      },
    };
  }

  globalThis.GfLan = { join: Join };
})();
