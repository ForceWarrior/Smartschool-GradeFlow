(function () {
  'use strict';

  chrome.runtime.onConnect.addListener(port => {
    if (!port.name.startsWith('gf-lan:')) return;
    const channel = port.name.slice(7).replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'game';
    let sess = null;
    const post = m => { try { port.postMessage(m); } catch (_) {} };
    port.onMessage.addListener(msg => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.kind === 'join') {
        sess?.close();
        sess = GfLan.join(channel, {
          name: msg.name,
          onStatus: (status, selfId) => post({ kind: 'status', status, selfId }),
          onPeer: p => post({ kind: 'peer', ...p }),
          onLeave: id => post({ kind: 'leave', id }),
          onRename: (id, name) => post({ kind: 'rename', id, name }),
          onMessage: (id, data, rel) => post({ kind: 'msg', id, data, rel }),
        });
      } else if (msg.kind === 'send') {
        sess?.send(msg.to || null, msg.data, msg.rel !== false);
      } else if (msg.kind === 'rename') {
        sess?.rename(msg.name);
      } else if (msg.kind === 'leave') {
        sess?.close();
        sess = null;
      }
    });
    port.onDisconnect.addListener(() => { sess?.close(); sess = null; });
  });
})();
