;(function (W) {
  'use strict';

  const _GameText = typeof _GfTranslate === 'function' ? _GfTranslate : k => k;

  const ALL_GRADES = [
    { id: 'g06', label: '6/20',  sub: '30%', bg: '#ef4444', fg: '#fff'      },
    { id: 'g07', label: '7/20',  sub: '35%', bg: '#f97316', fg: '#fff'      },
    { id: 'g08', label: '8/20',  sub: '40%', bg: '#f59e0b', fg: '#1a1a1a'  },
    { id: 'g09', label: '9/20',  sub: '45%', bg: '#fbbf24', fg: '#1a1a1a'  },
    { id: 'g10', label: '10/20', sub: '50%', bg: '#4ade80', fg: '#1a1a1a'  },
    { id: 'g11', label: '11/20', sub: '55%', bg: '#22c55e', fg: '#fff'      },
    { id: 'g12', label: '12/20', sub: '60%', bg: '#16a34a', fg: '#fff'      },
    { id: 'g13', label: '13/20', sub: '65%', bg: '#10b981', fg: '#fff'      },
    { id: 'g14', label: '14/20', sub: '70%', bg: '#06b6d4', fg: '#fff'      },
    { id: 'g15', label: '15/20', sub: '75%', bg: '#3b82f6', fg: '#fff'      },
    { id: 'g16', label: '16/20', sub: '80%', bg: '#6366f1', fg: '#fff'      },
    { id: 'g17', label: '17/20', sub: '85%', bg: '#8b5cf6', fg: '#fff'      },
    { id: 'g18', label: '18/20', sub: '90%', bg: '#a855f7', fg: '#fff'      },
    { id: 'g19', label: '19/20', sub: '95%', bg: '#ec4899', fg: '#fff'      },
    { id: 'g20', label: '20/20', sub: '100%', bg: '#f59e0b', fg: '#1a1a1a', perfect: true },
  ];

  /* DIFFICULTIES */
  const DIFFICULTIES = [
    { id: 'easy',   label: () => _GameText('game_mem_easy'),   cols: 4, rows: 3, pairs: 6  },
    { id: 'medium', label: () => _GameText('game_mem_medium'), cols: 4, rows: 4, pairs: 8  },
    { id: 'hard',   label: () => _GameText('game_mem_hard'),   cols: 5, rows: 4, pairs: 10 },
    { id: 'expert', label: () => _GameText('game_expert'),     cols: 6, rows: 4, pairs: 12 },
  ];

  const CARD_W = { easy: 78, medium: 72, hard: 64, expert: 58 };
  const CARD_H = { easy: 96, medium: 88, hard: 78, expert: 70 };
  const CARD_GAP = 8;

  const LS_BEST = 'gf-mem-best';
  const FLIP_DELAY_MS = 500; // how long to show a non match before flipping back

  /* PERSISTENCE */
  function LoadBests() { try { return JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch (_) { return {}; } }
  function SaveBestScore(id, moves, secs) {
    const b = LoadBests();
    const prev = b[id];
    if (!prev || moves < prev.moves || (moves === prev.moves && secs < prev.secs))
      b[id] = { moves, secs };
    try { localStorage.setItem(LS_BEST, JSON.stringify(b)); } catch (_) {}
  }
  function GetBestScore(id) { return LoadBests()[id] || null; }

  /* STATE */
  let G = null;
  let _diffId = 'easy';
  let _timerInterval = null;
  let _timerStart    = null;
  let _timerElapsed  = 0;

  function GetDifficulty() { return DIFFICULTIES.find(d => d.id === _diffId) || DIFFICULTIES[0]; }

  function NewGame() {
    StopTimer();
    _timerElapsed = 0;

    const d = GetDifficulty();
    const shuffled = [...ALL_GRADES].sort(() => Math.random() - 0.5).slice(0, d.pairs);
    const deck = [];
    shuffled.forEach((g, pi) => {
      deck.push({ uid: `${pi}a`, gradeId: g.id, grade: g, state: 'hidden', matchId: pi });
      deck.push({ uid: `${pi}b`, gradeId: g.id, grade: g, state: 'hidden', matchId: pi });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    G = {
      diff: d, deck,
      open: [],          // up to 2 card uids currently face up (Unmatched)
      locked: false,     // block clicks during flip-back animation
      moves: 0,          // pairs attempted
      misses: 0,
      matched: 0,        // pairs found
      elapsed: 0,
      status: 'playing', // playing | won
      startedTimer: false,
    };

    BuildBoard();
    UpdateHUD();
    HideOverlay();
  }

  /* CARD LOGIC */
  function FlipCard(uid) {
    if (!G || G.locked || G.status !== 'playing') return;
    const card = G.deck.find(c => c.uid === uid);
    if (!card || card.state !== 'hidden') return;
    if (G.open.includes(uid)) return;

    if (!G.startedTimer) { G.startedTimer = true; StartTimer(); }

    card.state = 'revealed';
    G.open.push(uid);
    UpdateCard(uid);

    if (G.open.length < 2) return;

    G.moves++;
    const [uidA, uidB] = G.open;
    const cardA = G.deck.find(c => c.uid === uidA);
    const cardB = G.deck.find(c => c.uid === uidB);

    if (cardA.matchId === cardB.matchId) {
      cardA.state = 'matched';
      cardB.state = 'matched';
      G.matched++;
      G.open = [];
      UpdateCard(uidA);
      UpdateCard(uidB);
      UpdateHUD();

      if (G.matched === G.diff.pairs) {
        StopTimer();
        G.status = 'won';
        setTimeout(ShowWin, 350);
      }
    } else {
      G.misses++;
      G.locked = true;
      UpdateHUD();
      setTimeout(() => {
        cardA.state = 'hidden';
        cardB.state = 'hidden';
        G.open = [];
        G.locked = false;
        UpdateCard(uidA);
        UpdateCard(uidB);
      }, FLIP_DELAY_MS);
    }
  }

  /* TIMER */
  function StartTimer() {
    _timerStart = Date.now();
    _timerInterval = setInterval(() => {
      G.elapsed = Math.floor((_timerElapsed + Date.now() - _timerStart) / 1000);
      SetText('gf-mem-timer', FormatTime(G.elapsed));
    }, 500);
  }
  function StopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    if (_timerStart)    { _timerElapsed += Date.now() - _timerStart; _timerStart = null; }
  }
  function PauseTimer() { StopTimer(); }
  function ResumeTimer() {
    if (G?.status === 'playing' && G.startedTimer && !_timerInterval) {
      _timerStart = Date.now();
      StartTimer();
    }
  }
  function FormatTime(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  /* DOM BOARD */
  function BuildBoard() {
    const d   = G.diff;
    const cw  = CARD_W[d.id], ch = CARD_H[d.id];
    const bw  = d.cols * cw + (d.cols - 1) * CARD_GAP;
    const bh  = d.rows * ch + (d.rows - 1) * CARD_GAP;

    const wrap = document.getElementById('gf-mem-board-wrap');
    const grid = document.getElementById('gf-mem-board');
    if (!wrap || !grid) return;

    wrap.style.width  = `${bw}px`;
    wrap.style.height = `${bh}px`;
    grid.style.gridTemplateColumns = `repeat(${d.cols}, ${cw}px)`;
    grid.style.gridTemplateRows    = `repeat(${d.rows}, ${ch}px)`;

    grid.innerHTML = G.deck.map(card => BuildCardHtml(card, cw, ch)).join('');
  }

  function BuildCardHtml(card, cw, ch) {
    const g = card.grade;
    const isPerfect = g.perfect ? ' gf-mem-perfect' : '';
    return `<div class="gf-mem-card${card.state === 'matched' ? ' gf-mem-matched' : ''}"
      data-uid="${card.uid}" style="width:${cw}px;height:${ch}px;">
      <div class="gf-mem-inner${card.state !== 'hidden' ? ' gf-mem-flipped' : ''}">
        <div class="gf-mem-back"></div>
        <div class="gf-mem-front${isPerfect}" style="background:${g.bg};color:${g.fg}">
          <span class="gf-mem-lbl">${g.label}</span>
          <span class="gf-mem-sub">${g.sub}</span>
          ${g.perfect ? '<span class="gf-mem-star">✦</span>' : ''}
        </div>
      </div>
    </div>`;
  }

  function UpdateCard(uid) {
    const el = document.querySelector(`#gf-mem-board [data-uid="${uid}"]`);
    if (!el) return;
    const card  = G.deck.find(c => c.uid === uid);
    const inner = el.querySelector('.gf-mem-inner');
    if (!inner) return;

    el.classList.toggle('gf-mem-matched', card.state === 'matched');
    inner.classList.toggle('gf-mem-flipped', card.state !== 'hidden');
  }

  /* HUD */
  function SetText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  function UpdateHUD() {
    if (!G) return;
    const total = G.diff.pairs;
    SetText('gf-mem-pairs',  `${G.matched}/${total}`);
    SetText('gf-mem-moves',  String(G.moves));
    SetText('gf-mem-misses', String(G.misses));
    SetText('gf-mem-timer',  FormatTime(G.elapsed));
    // Progress bar
    const bar = document.getElementById('gf-mem-prog');
    if (bar) bar.style.width = `${(G.matched / total * 100).toFixed(1)}%`;
    // Diff buttons
    document.querySelectorAll('.gf-mem-diff-btn').forEach(btn =>
      btn.classList.toggle('gf-mem-diff-active', btn.dataset.diff === _diffId));
  }

  /* OVERLAYS */
  function HideOverlay() {
    const el = document.getElementById('gf-mem-ovr'); if (el) el.style.display = 'none';
  }

  function ShowWin() {
    const el = document.getElementById('gf-mem-ovr'); if (!el) return;
    const secs  = Math.round(_timerElapsed / 1000);
    const best  = GetBestScore(_diffId);
    const isNew = !best || G.moves < best.moves || (G.moves === best.moves && secs < best.secs);
    if (isNew) SaveBestScore(_diffId, G.moves, secs);

    const accuracy = G.moves > 0 ? Math.round(G.diff.pairs / G.moves * 100) : 100;
    el.innerHTML = `
      <div class="gf-mem-ovr-icon">🧠</div>
      <div class="gf-mem-ovr-title" style="color:#a78bfa">${_GameText('game_mem_cleared')}</div>
      <div class="gf-mem-ovr-stats">
        <div class="gf-mem-ovr-stat"><span>${_GameText('game_time')}</span><strong>${FormatTime(secs)}</strong></div>
        <div class="gf-mem-ovr-stat"><span>${_GameText('game_moves')}</span><strong>${G.moves}</strong></div>
        <div class="gf-mem-ovr-stat"><span>${_GameText('game_mem_accuracy')}</span><strong>${accuracy}%</strong></div>
      </div>
      ${isNew ? `<div class="gf-mem-ovr-best">🏆 ${_GameText('game_mem_personal_best')}</div>` : (best ? `<div class="gf-mem-ovr-sub">${_GameText('game_best')}: ${FormatTime(best.secs)} · ${best.moves} ${_GameText('game_moves').toLowerCase()}</div>` : '')}
      <button class="gf-mem-btn" id="gf-mem-again">▶ ${_GameText('game_play_again')}</button>`;
    el.style.display = 'flex';
    document.getElementById('gf-mem-again')?.addEventListener('click', NewGame);
  }

  /* INPUT */
  let _kh = null;
  function OnKey(e) {
    const el = document.getElementById('gf-memory');
    if (!el || el.style.display === 'none') return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); CloseGradeMemory(); }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); NewGame(); }
  }
  function AttachKeys() { if (!_kh) { _kh = OnKey; document.addEventListener('keydown', _kh, true); } }
  function DetachKeys()  { if (_kh)  { document.removeEventListener('keydown', _kh, true); _kh = null; } }

  /* THEME */
  function ApplyTheme() {
    const el = document.getElementById('gf-memory'); if (!el) return;
    const dark = document.documentElement.getAttribute('data-gf-theme') === 'dark';
    el.style.filter  = dark ? 'invert(1) hue-rotate(180deg)' : '';
    el.dataset.theme = dark ? 'dark' : 'light';
  }
  const _tobs = new MutationObserver(ApplyTheme);

  /* BUILD OVERLAY */
  function BuildOverlay() {
    if (document.getElementById('gf-memory')) return;
    InjectCSS();
    const root = document.createElement('div');
    root.id = 'gf-memory';

    const diffBtns = DIFFICULTIES.map(d =>
      `<button class="gf-mem-diff-btn${d.id === _diffId ? ' gf-mem-diff-active' : ''}" data-diff="${d.id}">${typeof d.label === 'function' ? d.label() : d.label}</button>`
    ).join('');

    root.innerHTML = `
<div id="gf-mem-modal">
  <div id="gf-mem-hdr">
    <div class="gf-mem-hl">
      <div id="gf-mem-logo">GM</div>
      <div>
        <div id="gf-mem-title">GradeMemory</div>
        <div id="gf-mem-sub">${_GameText('game_mem_subtitle')}</div>
      </div>
    </div>
    <div class="gf-mem-hr">
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_mem_pairs')}</div><div id="gf-mem-pairs">0/0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_moves').toUpperCase()}</div><div id="gf-mem-moves">0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_mem_misses')}</div><div id="gf-mem-misses">0</div></div>
      <div class="gf-mem-stat-box"><div class="gf-mem-slbl">${_GameText('game_time').toUpperCase()}</div><div id="gf-mem-timer">0:00</div></div>
      <button id="gf-mem-new" title="${_GameText('game_new_game_r')}">↺</button>
      <button id="gf-mem-close" title="${_GameText('game_close_esc')}">✕</button>
    </div>
  </div>
  <div id="gf-mem-progress-track"><div id="gf-mem-prog"></div></div>
  <div id="gf-mem-diff">${diffBtns}</div>
  <div id="gf-mem-body">
    <div id="gf-mem-board-wrap">
      <div id="gf-mem-board"></div>
      <div id="gf-mem-ovr" style="display:none"></div>
    </div>
  </div>
  <div id="gf-mem-hint">${_GameText('game_mem_hint')}</div>
</div>`;

    document.body.appendChild(root);

    document.getElementById('gf-mem-board').addEventListener('click', e => {
      const card = e.target.closest('[data-uid]');
      if (card) FlipCard(card.dataset.uid);
    });

    document.getElementById('gf-mem-diff').addEventListener('click', e => {
      const btn = e.target.closest('[data-diff]'); if (!btn) return;
      _diffId = btn.dataset.diff;
      NewGame();
    });

    document.getElementById('gf-mem-new')  ?.addEventListener('click', NewGame);
    document.getElementById('gf-mem-close')?.addEventListener('click', CloseGradeMemory);
    document.getElementById('gf-memory')?.addEventListener('click', e => { if (e.target.id === 'gf-memory') BossKeyMemory(); });
  }

  /* PUBLIC API */
  function OpenGradeMemory() {
    if (!document.getElementById('gf-memory')) BuildOverlay();
    const el = document.getElementById('gf-memory');
    el.style.display = 'flex';
    ApplyTheme();
    _tobs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gf-theme'] });
    AttachKeys();
    if (!G) { NewGame(); return; }
    if (G.locked) {
      G.open.forEach(uid => {
        const card = G.deck.find(c => c.uid === uid);
        if (card && card.state === 'revealed') { card.state = 'hidden'; UpdateCard(uid); }
      });
      G.open = [];
      G.locked = false;
    }
  }

  function CloseGradeMemory() {
    const el = document.getElementById('gf-memory');
    if (el) el.style.display = 'none';
    StopTimer();
    DetachKeys();
    _tobs.disconnect();
  }

  function BossKeyMemory() {
    const el = document.getElementById('gf-memory'); if (!el) return false;
    if (el.dataset.bossHidden === '1') {
      el.style.display = 'flex';
      delete el.dataset.bossHidden;
      ResumeTimer();
      return true;
    }
    if (el.style.display !== 'none') {
      PauseTimer();
      el.style.display = 'none';
      el.dataset.bossHidden = '1';
      return true;
    }
    return false;
  }

  W.OpenGradeMemory  = OpenGradeMemory;
  W.CloseGradeMemory = CloseGradeMemory;
  W.BossKeyMemory    = BossKeyMemory;

  function InjectCSS() {
    if (document.getElementById('gf-mem-css')) return;
    const s = document.createElement('style');
    s.id = 'gf-mem-css';
    s.textContent = `
#gf-memory {
  --gm-modal:#ffffff;--gm-hdr:#f5f5f5;--gm-brd:rgba(167,139,250,.22);--gm-brd2:#e0e0e0;
  --gm-back:#334155;--gm-back-shine:rgba(255,255,255,.08);--gm-back-dot:rgba(255,255,255,.06);
  --gm-txt:#111;--gm-txt2:#555;--gm-txt3:#999;--gm-sbox:rgba(0,0,0,.05);
  --gm-sh:0 8px 40px rgba(0,0,0,.13),0 1px 4px rgba(0,0,0,.06);
  --gm-ovr:rgba(255,255,255,.93);--gm-btn-brd:#ccc;--gm-body:#f9f9f9;
}
#gf-memory[data-theme="dark"] {
  --gm-modal:rgba(13,13,13,.97);--gm-hdr:rgba(8,8,8,.95);--gm-brd:rgba(167,139,250,.18);
  --gm-brd2:#1e1e1e;--gm-back:#1e293b;--gm-back-shine:rgba(255,255,255,.05);
  --gm-back-dot:rgba(255,255,255,.04);--gm-txt:#f0f0f0;--gm-txt2:#aaa;--gm-txt3:#555;
  --gm-sbox:rgba(255,255,255,.05);--gm-sh:0 8px 32px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.8);
  --gm-ovr:rgba(10,10,10,.92);--gm-btn-brd:#333;--gm-body:#0d0d0d;
}
#gf-memory{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;background:none;font-family:"IBM Plex Mono",monospace;}
#gf-mem-modal{display:flex;flex-direction:column;background:var(--gm-modal);border:1px solid var(--gm-brd);border-radius:14px;box-shadow:var(--gm-sh);overflow:hidden;max-height:calc(100vh - 24px);max-width:calc(100vw - 24px);}
/* Header */
#gf-mem-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--gm-hdr);border-bottom:1px solid var(--gm-brd);flex-shrink:0;gap:8px;user-select:none;}
.gf-mem-hl{display:flex;align-items:center;gap:8px;} .gf-mem-hr{display:flex;align-items:center;gap:5px;}
#gf-mem-logo{width:28px;height:28px;background:linear-gradient(135deg,#a78bfa,#7c3aed);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:-.5px;}
#gf-mem-title{font-size:14px;font-weight:700;color:var(--gm-txt);letter-spacing:-.3px;line-height:1.2;}
#gf-mem-sub{font-size:9px;color:var(--gm-txt3);}
.gf-mem-stat-box{display:flex;flex-direction:column;align-items:center;padding:3px 8px;background:var(--gm-sbox);border-radius:5px;min-width:44px;}
.gf-mem-slbl{font-size:7px;font-weight:600;letter-spacing:1.2px;color:var(--gm-txt3);}
.gf-mem-stat-box>div:last-child{font-size:13px;font-weight:700;color:var(--gm-txt);line-height:1.3;}
#gf-mem-new,#gf-mem-close{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--gm-btn-brd);border-radius:6px;background:transparent;color:var(--gm-txt2);cursor:pointer;font-size:13px;padding:0;flex-shrink:0;transition:border-color .12s,color .12s,background .12s;}
#gf-mem-new:hover{border-color:#a78bfa;color:#a78bfa;background:rgba(167,139,250,.1);}
#gf-mem-close:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);}
/* Progress bar */
#gf-mem-progress-track{height:3px;background:var(--gm-brd2);flex-shrink:0;}
#gf-mem-prog{height:100%;width:0%;background:linear-gradient(90deg,#a78bfa,#7c3aed);border-radius:0 2px 2px 0;transition:width .3s ease;}
/* Diff */
#gf-mem-diff{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid var(--gm-brd);flex-shrink:0;}
.gf-mem-diff-btn{padding:4px 12px;border:1px solid var(--gm-brd2);border-radius:6px;background:transparent;color:var(--gm-txt2);font-family:inherit;font-size:10px;font-weight:600;cursor:pointer;transition:border-color .12s,color .12s,background .12s;}
.gf-mem-diff-btn:hover{border-color:#a78bfa;color:#a78bfa;background:rgba(167,139,250,.08);}
.gf-mem-diff-active{border-color:#a78bfa!important;color:#a78bfa!important;background:rgba(167,139,250,.12)!important;}
/* Body + board */
#gf-mem-body{display:flex;align-items:center;justify-content:center;padding:16px;background:var(--gm-body);flex-shrink:0;}
#gf-mem-board-wrap{position:relative;}
#gf-mem-board{display:grid;gap:${CARD_GAP}px;}
/* Card 3D flip */
.gf-mem-card{perspective:600px;cursor:pointer;flex-shrink:0;}
.gf-mem-card.gf-mem-matched{cursor:default;}
.gf-mem-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 0.35s cubic-bezier(.4,0,.2,1);}
.gf-mem-inner.gf-mem-flipped{transform:rotateY(180deg);}
.gf-mem-back,.gf-mem-front{position:absolute;inset:0;border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;}
/* Back face */
.gf-mem-back{background:var(--gm-back);overflow:hidden;}
.gf-mem-back::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,var(--gm-back-dot) 0,var(--gm-back-dot) 1px,transparent 0,transparent 50%) 0/8px 8px;}
.gf-mem-back::after{content:'GM';font-size:11px;font-weight:800;color:rgba(255,255,255,.18);letter-spacing:1px;font-family:"IBM Plex Mono",monospace;}
/* Front face */
.gf-mem-front{transform:rotateY(180deg);gap:2px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 -1px 0 rgba(0,0,0,.15);}
.gf-mem-lbl{font-size:clamp(12px,18%,19px);font-weight:800;letter-spacing:-.5px;line-height:1;}
.gf-mem-sub{font-size:clamp(8px,11%,12px);font-weight:600;opacity:.75;line-height:1;}
.gf-mem-star{font-size:10px;opacity:.9;margin-top:2px;}
/* Matched glow */
.gf-mem-matched .gf-mem-front{box-shadow:0 0 0 2px rgba(255,255,255,.5),0 0 12px 2px rgba(255,255,255,.3),inset 0 1px 0 rgba(255,255,255,.2);}
.gf-mem-matched{opacity:.82;}
/* Perfect tile pulse */
.gf-mem-perfect{animation:gm-perfect-pulse 1.6s ease-in-out infinite;}
@keyframes gm-perfect-pulse{0%,100%{box-shadow:0 0 0 2px rgba(245,158,11,.6),0 0 18px rgba(245,158,11,.4),inset 0 1px 0 rgba(255,255,255,.2)}50%{box-shadow:0 0 0 2px rgba(245,158,11,.9),0 0 28px rgba(245,158,11,.6),inset 0 1px 0 rgba(255,255,255,.2)}}
/* Hover lift on hidden cards */
.gf-mem-card:not(.gf-mem-matched):hover .gf-mem-back{filter:brightness(1.15);}
.gf-mem-card:not(.gf-mem-matched):active .gf-mem-inner{transform:scale(.94);}
/* Win overlay */
#gf-mem-ovr{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--gm-ovr);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:4px;padding:24px;text-align:center;}
.gf-mem-ovr-icon{font-size:40px;line-height:1;}
.gf-mem-ovr-title{font-size:22px;font-weight:800;letter-spacing:-.5px;}
.gf-mem-ovr-stats{display:flex;gap:14px;}
.gf-mem-ovr-stat{display:flex;flex-direction:column;align-items:center;gap:1px;}
.gf-mem-ovr-stat span{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--gm-txt3);}
.gf-mem-ovr-stat strong{font-size:16px;font-weight:700;color:var(--gm-txt);}
.gf-mem-ovr-best{font-size:12px;font-weight:700;color:#f59e0b;}
.gf-mem-ovr-sub{font-size:10px;color:var(--gm-txt2);}
.gf-mem-btn{padding:9px 22px;border:1px solid #a78bfa;border-radius:7px;background:rgba(167,139,250,.12);color:#a78bfa;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px;transition:background .14s,box-shadow .14s,transform .12s;}
.gf-mem-btn:hover{background:rgba(167,139,250,.22);box-shadow:0 4px 20px rgba(167,139,250,.3);transform:translateY(-1px);}
/* Hint */
#gf-mem-hint{font-size:9px;color:var(--gm-txt3);text-align:center;padding:6px 14px 10px;flex-shrink:0;background:var(--gm-hdr);border-top:1px solid var(--gm-brd);}
`;
    document.head.appendChild(s);
  }

})(window);
