import { Board } from './board3d.js';
import { rulesPanelHtml, rulesModalHtml, currentStep } from './rules.js';
import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { faceChip } from '/common/avatar.js';

const C = window.CLUE;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n) => `<i class="ic ic-${n}"></i>`;
const store = (kind) => ({
  get: (k) => { try { return window[kind].getItem(k); } catch (_) { return null; } },
  set: (k, v) => { try { window[kind].setItem(k, v); } catch (_) { /* 저장소 차단 */ } },
});
const LS = store('localStorage');
const SS = store('sessionStorage');

const typeOf = (id) => C.CARDS[id].type;
const artOf = (id) => `assets/${typeOf(id) === 'suspect' ? 'char' : typeOf(id)}/${id}.svg`;
const charImg = (id) => `assets/face/${id}.svg`;
const thumbOf = (id) => (typeOf(id) === 'suspect' ? charImg(id) : artOf(id));
const EMBLEM = { suspect: 'hat', weapon: 'dagger', room: 'key' };
const colorOf = (char) => (C.SUSPECT[char] ? C.SUSPECT[char].color : '#8a7f78');

function newToken() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  const t = Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  SS.set('clue.token', t);
  return t;
}

/** 탭을 복제하면 토큰까지 복사되어 서로 연결을 끊게 되므로, 다른 탭이 이미 쓰는 토큰이면 새로 만든다 */
async function claimToken() {
  let t = SS.get('clue.token');
  if (!t || !/^[a-zA-Z0-9_-]{16,64}$/.test(t)) t = newToken();
  if (!('BroadcastChannel' in window)) return t;
  const bc = new BroadcastChannel('clue-token');
  const taken = await new Promise((resolve) => {
    bc.onmessage = (e) => { if (e.data && e.data.type === 'here' && e.data.token === t) resolve(true); };
    bc.postMessage({ type: 'who', token: t });
    setTimeout(() => resolve(false), 250);
  });
  if (taken) t = newToken();
  bc.onmessage = (e) => { if (e.data && e.data.type === 'who' && e.data.token === t) bc.postMessage({ type: 'here', token: t }); };
  window.__clueTokenChannel = bc;
  return t;
}

const S = {
  pid: null, room: null, game: null, screen: '', tab: 'hand', unread: 0, chat: [], replaced: false, rulesOpen: true, ruleStep: null,
  modal: null, modalLocked: false, sel: {}, onOk: null, deadline: null,
  seq: 0, seqGid: null, lastLogN: -1, handKey: '', diceTurn: null, overSeen: {},
};
// 사이트 하나에 게임이 여러 개라 네임스페이스로 나눈다
// 서버가 다시 켜져도 하던 게임이 이어지게: 서버가 맡긴 방 사본을 접속할 때 같이 보낸다
const keeper = roomKeeper('clue');
const clueToken = await claimToken();
const socket = io('/clue', { auth: (cb) => cb({ token: clueToken, save: keeper.get() }), reconnectionDelay: 800, reconnectionDelayMax: 4000 });
keeper.attach(socket);

const player = (pid) => (S.game ? S.game.players.find((p) => p.pid === pid) : null);
const pname = (pid) => {
  const p = player(pid) || (S.room && S.room.members.find((m) => m.pid === pid));
  return p ? p.name : '???';
};
const pchar = (pid) => { const p = player(pid); return p ? p.char : null; };
const who = (pid) => `<b class="who" style="--c:${colorOf(pchar(pid))}">${esc(pname(pid))}</b>`;

function send(ev, data) {
  return new Promise((resolve) => {
    socket.emit(ev, data, (r) => {
      if (r && r.ok === false && r.error) toast(esc(r.error), 'err');
      resolve(r || {});
    });
  });
}
const act = (a) => send('game:act', a);

/** 내용이 같으면 DOM 을 갈아끼우지 않는다 (버튼 클릭이 씹히지 않게) */
function setHtml(el, html) {
  if (el._html === html) return false;
  el._html = html;
  el.innerHTML = html;
  return true;
}

// ───────────────────────── 공통 UI

function toast(html, kind = '') {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 3300);
}

function flash() {
  const f = $('#flash');
  f.classList.remove('on');
  void f.offsetWidth;
  f.classList.add('on');
  if (Board.ready) Board.flash();
}

function show(name) {
  if (S.screen === name) return;
  S.screen = name;
  for (const id of ['home', 'lobby', 'game']) $('#' + id).hidden = id !== name;
  document.body.dataset.screen = name;
}

function openModal(kind, html, { wide = false, locked = false } = {}) {
  S.modal = kind;
  S.modalLocked = locked;
  const box = $('#modalBox');
  box.className = `modal-box ${wide ? 'wide' : ''}`;
  box.innerHTML = html;
  $('#modal').hidden = false;
}
function closeModal() {
  S.modal = null;
  S.modalLocked = false;
  $('#modal').hidden = true;
  $('#modalBox').innerHTML = '';
}
function confirmBox(title, text, okLabel, onOk, danger) {
  S.onOk = onOk;
  openModal('confirm', `<h3 class="m-title">${title}</h3><p class="m-sub">${text}</p>
    <div class="m-actions"><button class="btn btn-dark" data-m="close">취소</button><button class="btn ${danger ? 'btn-red' : 'btn-gold'}" data-m="ok">${okLabel}</button></div>`);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function syncMute() {
  for (const b of $$('[data-mute]')) b.innerHTML = ic(SFX.muted ? 'mute' : 'volume');
}

// ───────────────────────── 카드 조각

const cardInner = (id) => `<div class="card-art"><img src="${artOf(id)}" alt=""></div><img class="card-frame" src="assets/card-frame.svg" alt=""><div class="card-type">${C.TYPE_NAME[typeOf(id)]}</div><span class="card-emblem">${ic(EMBLEM[typeOf(id)])}</span><div class="card-name"><span>${esc(C.CARDS[id].name)}</span></div>`;
const bigCard = (id) => `<div class="card t-${typeOf(id)}">${cardInner(id)}</div>`;
const miniCard = (id) => `<div class="card mcard t-${typeOf(id)}">${cardInner(id)}</div>`;
function pickCard(id, { fixed = false, plain = false } = {}) {
  const known = !plain && NB.data ? NB.data.has[id] : null;
  const tag = known === S.pid ? '<em class="tag">내 카드</em>' : known ? '<em class="tag seen">확인됨</em>' : '';
  return `<button type="button" class="card pcard t-${typeOf(id)} ${fixed ? 'fixed sel' : ''} ${known ? 'dim' : ''}" data-card="${id}">${cardInner(id)}${tag}</button>`;
}
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const die = (v) => `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'pip' : ''}"></i>`).join('')}</div>`;

function fmt(text) {
  return esc(text).replace(/\{([pswr]):([a-z0-9_]+)\}/g, (_m, k, id) => {
    if (k === 'p') return who(id);
    const c = C.CARDS[id];
    return c ? `<b class="lc t-${c.type}">${esc(c.name)}</b>` : '?';
  });
}

// ───────────────────────── 탐정 수첩

const NB = { gid: null, data: null };
function nbLoad(gid) {
  NB.gid = gid;
  try { NB.data = JSON.parse(LS.get('clue.nb.' + gid)); } catch (_) { NB.data = null; }
  if (!NB.data || !NB.data.has) NB.data = { manual: {}, has: {}, not: {} };
}
function nbSave() {
  LS.set('clue.nb.' + NB.gid, JSON.stringify(NB.data));
}
function nbIngest(g) {
  const d = NB.data;
  let changed = false;
  const setHas = (card, pid) => { if (d.has[card] !== pid) { d.has[card] = pid; changed = true; } };
  if (g.me) {
    for (const c of g.me.hand) setHas(c, S.pid);
    for (const i of g.me.intel) setHas(i.card, i.from);
  }
  for (const r of g.revealed) for (const c of r.cards) setHas(c, r.pid);
  if (g.over) for (const h of g.over.hands) for (const c of h.cards) setHas(c, h.pid);
  const sg = g.suggestion;
  if (sg) {
    for (const ch of sg.checks) {
      if (ch.has) continue;
      for (const c of [sg.suspect, sg.weapon, sg.room]) {
        const arr = d.not[c] || (d.not[c] = []);
        if (!arr.includes(ch.pid)) { arr.push(ch.pid); changed = true; }
      }
    }
  }
  if (changed) nbSave();
}
function nbCell(card, pid) {
  const m = NB.data.manual[card + '|' + pid];
  if (m !== undefined) return { v: m, manual: true };
  const d = NB.data;
  if (d.has[card]) return { v: d.has[card] === pid ? 'o' : 'x', manual: false };
  if ((d.not[card] || []).includes(pid)) return { v: 'x', manual: false };
  return { v: '', manual: false };
}
const MARK = { o: ic('check'), x: ic('x'), '?': '<b>?</b>', '': '' };
const MARK_CLS = { o: 'o', x: 'x', '?': 'q', '': 'e' };

// ───────────────────────── 채팅

const chatNode = $('#chatTpl').content.firstElementChild.cloneNode(true);
const chatLog = $('.chat-log', chatNode);
const chatInput = $('input', chatNode);
$('.chat-form', chatNode).addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  socket.emit('chat', text);
  chatInput.value = '';
});
function chatHtml(m) {
  if (m.system) return `<div class="cm sys">${esc(m.text)}</div>`;
  const face = m.char ? `<img src="${charImg(m.char)}" alt="">` : `<span class="cm-noface">${ic('eye')}</span>`;
  return `<div class="cm" style="--c:${colorOf(m.char)}">${face}<div><div class="cm-name">${esc(m.name)}</div><div class="cm-text">${esc(m.text)}</div></div></div>`;
}
function renderChat() {
  chatLog.innerHTML = S.chat.map(chatHtml).join('');
  chatLog.scrollTop = chatLog.scrollHeight;
}
function mountChat(target) {
  if (chatNode.parentElement !== target) {
    target.appendChild(chatNode);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}
function updateBadge() {
  const b = $('#chatBadge');
  b.hidden = !S.unread;
  b.textContent = S.unread > 9 ? '9+' : String(S.unread);
}

// ───────────────────────── 소켓

socket.on('hello', (d) => { S.pid = d.pid; });
// 3초 안에 다시 붙으면 배너를 띄우지 않는다
const conn = { timer: null, longTimer: null };
function connLost() {
  if (conn.timer) return;
  conn.timer = setTimeout(() => {
    const el = $('#conn');
    el.textContent = '연결이 잠깐 끊겼어요. 자동으로 다시 연결하는 중...';
    el.hidden = false;
  }, 3000);
  conn.longTimer = setTimeout(() => {
    $('#conn').innerHTML = '서버에 연결할 수 없어요. 방장 컴퓨터에서 <b>밤의저택_서버실행.bat</b> 창이 켜져 있는지 확인해 주세요. (켜지면 자동으로 다시 연결돼요)';
  }, 20000);
}
function connBack() {
  clearTimeout(conn.timer);
  clearTimeout(conn.longTimer);
  conn.timer = null;
  conn.longTimer = null;
  $('#conn').hidden = true;
}
socket.on('connect_error', () => connLost());
socket.io.on('reconnect_attempt', () => connLost());

socket.on('connect', () => {
  connBack();
  if (S.modal === 'replaced') closeModal();
  S.replaced = false;
});
socket.on('replaced', () => { S.replaced = true; });
socket.on('disconnect', (reason) => {
  if (S.replaced) {
    openModal('replaced', `<h3 class="m-title">${ic('link')} 다른 창에서 접속 중</h3>
      <p class="m-sub">같은 브라우저의 다른 창(탭)에서 이 게임에 접속해서 연결을 그쪽으로 넘겨주었습니다.</p>
      <div class="m-actions"><button class="btn btn-gold btn-lg" data-m="reconnect">${ic('refresh')}이 창에서 다시 접속</button></div>`, { locked: true });
    return;
  }
  connLost();
  // 서버가 먼저 끊은 경우 socket.io 는 스스로 다시 붙지 않으므로 직접 재접속
  if (reason === 'io server disconnect') setTimeout(() => socket.connect(), 1000);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !socket.connected && !S.replaced) socket.connect();
});
socket.on('toast', (t) => toast(esc(t), 'err'));
socket.on('chat:history', (list) => { S.chat = list || []; renderChat(); });
socket.on('chat', (m) => {
  S.chat.push(m);
  if (S.chat.length > 150) S.chat.shift();
  const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 80;
  chatLog.insertAdjacentHTML('beforeend', chatHtml(m));
  if (nearBottom || m.pid === S.pid) chatLog.scrollTop = chatLog.scrollHeight;
  if (!m.system && m.pid !== S.pid) {
    SFX.chat();
    if (S.screen === 'game' && S.tab !== 'chat') { S.unread++; updateBadge(); }
  }
});

socket.on('room', (r) => {
  S.room = r;
  if (!r) {
    S.game = null;
    closeModal();
    show('home');
    if (location.search) history.replaceState(null, '', location.pathname);
    return;
  }
  if (new URLSearchParams(location.search).get('room') !== r.code) history.replaceState(null, '', `?room=${r.code}`);
  const g = r.game;
  if (!g) {
    if (S.game) closeModal();
    S.game = null;
    show('lobby');
    mountChat($('#lobbyChatMount'));
    renderLobby();
    return;
  }
  const fresh = !S.game || S.game.id !== g.id;
  S.game = g;
  S.deadline = g.turn.deadlineIn != null ? Date.now() + g.turn.deadlineIn : null;
  show('game');
  if (!Board.ready) Board.build($('#board'), { onPick: (to) => act({ type: 'move', to }) });
  if (fresh) enterGame(g);
  processEvents(g);
  renderGame();
  if (fresh) afterEnterGame(g);
});

// ───────────────────────── 시작 화면

const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = LS.get('clue.name') || '';
// 로그인했으면 프로필 닉네임으로 채운다 (이름 안 쳐도 됨) · 이모트 버튼
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.pid, active: () => !!S.room, members: () => (S.room ? S.room.members : []) });
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) codeInput.value = urlRoom.toUpperCase().slice(0, 4);
codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, ''); });

function checkName() {
  const n = nameInput.value.trim();
  if (!n) {
    toast('탐정 이름을 입력하세요', 'err');
    nameInput.focus();
    return null;
  }
  LS.set('clue.name', n);
  return n;
}
$('#createBtn').addEventListener('click', () => {
  const name = checkName();
  if (!name) return;
  SFX.unlock();
  send('room:create', { name });
});
function join() {
  const name = checkName();
  if (!name) return;
  if (codeInput.value.length !== 4) return toast('4자리 초대 코드를 입력하세요', 'err');
  SFX.unlock();
  send('room:join', { name, code: codeInput.value });
}
$('#joinBtn').addEventListener('click', join);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
nameInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (codeInput.value.length === 4) join();
  else $('#createBtn').click();
});

// ───────────────────────── 대기실

function renderLobby() {
  const r = S.room;
  const isHost = r.hostPid === S.pid;
  const me = r.members.find((m) => m.pid === S.pid);
  $('#lobbyCode').textContent = r.code;

  $('#charGrid').innerHTML = C.SUSPECTS.map((s) => {
    const m = r.members.find((x) => x.char === s.id);
    const mine = m && m.pid === S.pid;
    let foot;
    if (m) {
      foot = `<span class="occupant">${faceChip(m, 28)} ${m.isBot ? ic('bot') : ''}${esc(m.name)}${m.pid === r.hostPid ? ic('crown') : ''}${m.online ? '' : '<span class="off">연결 끊김</span>'}</span>
        ${isHost && !mine ? `<button class="icon-btn sm" data-kick="${m.pid}" title="${m.isBot ? 'AI 제거' : '내보내기'}">${ic('x')}</button>` : ''}`;
    } else {
      foot = '<span class="empty">비어 있음 · 눌러서 선택</span>';
    }
    return `<div class="char ${m ? 'taken' : ''} ${mine ? 'mine' : ''}" data-char="${s.id}" style="--c:${s.color}">
      <div class="char-portrait"><img src="${artOf(s.id)}" alt="">${mine ? '<span class="char-mine-tag">나</span>' : ''}</div>
      <div class="char-body"><div class="char-name">${s.name}</div><div class="char-title">${s.title}</div><p class="char-bio">${s.bio}</p></div>
      <div class="char-foot">${foot}</div></div>`;
  }).join('');

  const specs = r.members.filter((m) => !m.char);
  $('#spectators').innerHTML = specs.length
    ? `관전 중: ${specs.map((m) => `<span class="chip">${ic('eye')}${esc(m.name)}${m.pid === r.hostPid ? ic('crown') : ''}</span>`).join('')}`
    : '';

  const seats = r.members.filter((m) => m.char && m.online).length;
  const free = C.SUSPECTS.some((s) => !r.members.some((m) => m.char === s.id));
  $('#addBotBtn').hidden = !isHost || !free;
  $('#spectateBtn').hidden = !me || !me.char;
  $('#startBtn').hidden = !isHost;
  $('#startBtn').disabled = seats < C.MIN_PLAYERS;
  $('#startHint').textContent = isHost
    ? (seats < C.MIN_PLAYERS ? `${C.MIN_PLAYERS}명 이상 필요 (AI 탐정을 추가할 수 있어요)` : `탐정 ${seats}명 준비 완료`)
    : '방장이 수사를 시작하기를 기다리는 중...';
}

$('#charGrid').addEventListener('click', (e) => {
  const kick = e.target.closest('[data-kick]');
  if (kick) {
    e.stopPropagation();
    send('room:kick', { pid: kick.dataset.kick });
    return;
  }
  const card = e.target.closest('[data-char]');
  if (!card) return;
  const holder = S.room.members.find((m) => m.char === card.dataset.char);
  if (holder && holder.pid === S.pid) return;
  if (holder && !holder.isBot) return toast('다른 탐정이 고른 캐릭터입니다', 'err');
  SFX.click();
  send('room:char', { char: card.dataset.char });
});
$('#addBotBtn').addEventListener('click', () => send('room:addBot'));
$('#spectateBtn').addEventListener('click', () => send('room:char', { char: null }));
$('#startBtn').addEventListener('click', () => { SFX.unlock(); send('room:start'); });
$('#copyLinkBtn').addEventListener('click', () => {
  copyText(`${location.origin}/clue/?room=${S.room.code}`).then(() => toast('초대 링크를 복사했습니다', 'gold'));
});

// ───────────────────────── 게임 진입 / 이벤트

function enterGame(g) {
  nbLoad(g.id);
  S.lastLogN = -1;
  S.handKey = '';
  S.diceTurn = g.turn.dice ? g.turn.no : null;
  mountChat($('#tab-chat'));
  setTab(S.tab);
  setRulesOpen(LS.get('clue.rules') !== '0');
}

function afterEnterGame(g) {
  if (g.phase === 'over') {
    S.overSeen[g.id] = true;
    openOver();
    return;
  }
  if (g.turn.no === 1 && !g.turn.dice && !SS.get('clue.intro.' + g.id)) {
    SS.set('clue.intro.' + g.id, '1');
    openIntro();
    SFX.thunder();
    flash();
  }
}

function processEvents(g) {
  const max = g.events.reduce((m, e) => Math.max(m, e.seq), 0);
  if (S.seqGid !== g.id) {
    S.seqGid = g.id;
    S.seq = max;
    return;
  }
  for (const e of g.events) if (e.seq > S.seq) handleEvent(e, g);
  S.seq = Math.max(S.seq, max);
}

function handleEvent(e, g) {
  switch (e.type) {
    case 'turn':
      if (e.pid === S.pid && g.phase === 'play') {
        SFX.turn();
        toast(`${ic('clock')} 당신의 차례입니다!`, 'gold');
      }
      break;
    case 'dice':
      SFX.dice();
      Board.rollDice(e.dice);
      break;
    case 'move':
      Board.animateMove(e.char, e.path);
      break;
    case 'weapon':
      Board.pulseWeapon(e.weapon);
      break;
    case 'suggest':
      SFX.suggest();
      announce(e);
      break;
    case 'show':
      SFX.card();
      if (e.by === S.pid) setTimeout(openReveal, 250);
      else if (e.from === S.pid) toast(`${who(e.by)}님에게 카드를 몰래 보여줬습니다`);
      else toast(`${who(e.from)} → ${who(e.by)} 카드 한 장 전달`);
      break;
    case 'none':
      SFX.none();
      toast(`${ic('search')} 아무도 반박하지 못했습니다!`, 'gold');
      break;
    case 'accuse':
      SFX.alarm();
      flash();
      if (!e.correct) toast(`${ic('skull')} ${who(e.pid)}의 고발이 틀렸습니다 — 탈락`, 'err');
      break;
    case 'over':
      setTimeout(() => {
        SFX.thunder();
        flash();
        const w = S.game && S.game.over && S.game.over.winner;
        if (w && w.pid === S.pid) SFX.win(); else SFX.lose();
        S.overSeen[g.id] = true;
        openOver();
      }, 700);
      break;
    default:
  }
}

function announce(e) {
  const el = $('#boardToast');
  const char = pchar(e.pid);
  el.innerHTML = `<div class="bt-kicker">${ic('search')} 추리 발표</div>
    <div class="bt-who" style="--c:${colorOf(char)}"><img src="${charImg(char)}" alt="">${esc(pname(e.pid))}</div>
    <div class="sugg-cards">${miniCard(e.suspect)}${miniCard(e.weapon)}${miniCard(e.room)}</div>`;
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  clearTimeout(announce.t);
  announce.t = setTimeout(() => el.classList.remove('on'), 3400);
}

// ───────────────────────── 게임 렌더

function renderGame() {
  const g = S.game;
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = S.room.hostPid !== S.pid;
  nbIngest(g);
  renderBanner(g);
  renderRules(g);
  renderPlayers(g);
  renderTurn(g);
  renderSugg(g);
  renderHand(g);
  renderLog(g);
  if (S.tab === 'notes') renderNotes(g);

  const meP = player(S.pid);
  const play = g.phase === 'play';
  Board.update(g, {
    reach: play && g.turn.pid === S.pid && g.turn.stage === 'move' ? g.turn.reach : null,
    curChar: play ? pchar(g.turn.pid) : null,
    myChar: meP ? meP.char : null,
    suggestRoom: play && g.suggestion ? g.suggestion.room : null,
  });

  const sg = g.suggestion;
  if (play && sg && sg.waiting === S.pid && sg.matches) {
    if (S.modal !== 'show') openShow();
  } else if (S.modal === 'show') {
    closeModal();
  }
  if (!play && ['suggest', 'accuse', 'show'].includes(S.modal)) closeModal();
  if (S.modal === 'suggest' && !g.turn.canSuggest) closeModal();
  if (S.modal === 'accuse' && (g.turn.pid !== S.pid || g.turn.stage === 'disprove')) closeModal();
}

function renderBanner(g) {
  const el = $('#turnBanner');
  if (g.phase === 'over') {
    setHtml(el, `${ic('trophy')}<span>사건 종결</span>`);
    return;
  }
  const cur = player(g.turn.pid);
  setHtml(el, `<img src="${charImg(cur.char)}" alt="" style="--c:${colorOf(cur.char)}"><span><b>${esc(cur.name)}</b>${cur.pid === S.pid ? ' (나)' : ''}의 차례</span><em>턴 ${g.turn.no}</em>`);
}

function renderPlayers(g) {
  setHtml($('#playersStrip'), g.players.map((p) => {
    const s = C.SUSPECT[p.char];
    const cur = g.phase === 'play' && p.pid === g.turn.pid;
    const tag = p.left ? '<span class="pl-tag">떠남</span>'
      : p.out ? '<span class="pl-tag red">탈락</span>'
      : !p.online ? '<span class="pl-tag">끊김</span>'
      : p.pid === S.pid ? '<span class="pl-tag me">나</span>' : '';
    return `<div class="pl ${cur ? 'cur' : ''} ${p.out ? 'out' : ''} ${!p.online || p.left ? 'off' : ''}" data-pid="${p.pid}" style="--c:${s.color}">
      <div class="pl-face"><img src="${charImg(p.char)}" alt=""></div>
      <div class="pl-txt"><div class="pl-name">${p.isBot ? ic('bot') + ' ' : ''}${esc(p.name)}</div><div class="pl-sub">${s.name} · 카드 ${p.handCount}</div></div>${tag}</div>`;
  }).join(''));
}

function stageText(g) {
  const t = g.turn;
  const mine = t.pid === S.pid;
  const sum = t.dice ? t.dice[0] + t.dice[1] : 0;
  const here = g.pos[pchar(t.pid)].room;
  const sg = g.suggestion;
  switch (t.stage) {
    case 'start':
      if (mine && g.me && g.me.movedIn && here) return `추리에 지목되어 ${C.ROOM[here].name}(으)로 끌려왔습니다. 이동하지 않고 바로 추리할 수 있어요`;
      return mine ? '주사위를 굴려 이동하세요' : '행동을 고민하는 중...';
    case 'move':
      return mine ? `보드에서 빛나는 칸이나 방을 눌러 이동하세요 (최대 ${sum}칸)` : `주사위 ${sum} · 이동할 곳을 고르는 중`;
    case 'room':
      return `${C.ROOM[here].name}에 들어왔습니다${mine ? ' — 추리하세요!' : ''}`;
    case 'disprove':
      return `${esc(pname(sg.waiting))}님이 반박할 카드를 고르는 중`;
    case 'reveal':
      return sg && sg.none ? '아무도 반박하지 못했습니다!' : `${esc(pname(sg && sg.shownBy))}님이 카드를 보여줬습니다`;
    case 'after':
      return mine ? '이동 완료. 고발하거나 턴을 마치세요' : '이동 완료';
    default:
      return '';
  }
}

const actBtn = (a, label, icon, cls) => `<button class="btn ${cls}" data-act="${a}">${ic(icon)}${esc(label)}</button>`;

function renderTurn(g) {
  const el = $('#turnPanel');
  const t = g.turn;
  if (g.phase === 'over') {
    const w = g.over.winner;
    setHtml(el, `<div class="turn-head"><div class="turn-face" style="--c:${w.pid ? colorOf(pchar(w.pid)) : '#777'}">${w.pid ? `<img src="${charImg(pchar(w.pid))}" alt="">` : ic('skull')}</div>
      <div class="turn-info"><div class="turn-who">${w.pid ? `${esc(pname(w.pid))} 승리` : '미제 사건'}</div><div class="turn-stage">사건이 종결되었습니다</div></div></div>
      <div class="actions"><button class="btn btn-gold big" data-act="openOver">${ic('envelope')}사건 파일 다시 보기</button></div>`);
    return;
  }
  const cur = player(t.pid);
  const mine = t.pid === S.pid;
  const waitingMe = t.stage === 'disprove' && g.suggestion && g.suggestion.waiting === S.pid;
  const total = Math.max(t.stage === 'disprove' ? 45000 : 90000, t.deadlineIn || 0);
  const clock = S.deadline
    ? `<div class="clock" data-deadline="${S.deadline}" data-total="${total}" data-tick="${mine || waitingMe ? 1 : 0}"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" class="clock-bg"/><circle cx="20" cy="20" r="18" class="clock-ring"/></svg><span class="clock-t"></span></div>`
    : '';
  let dice = '';
  if (t.dice) {
    const rolling = S.diceTurn !== t.no;
    S.diceTurn = t.no;
    dice = `<div class="dice-row ${rolling ? 'rolling' : ''}">${die(t.dice[0])}${die(t.dice[1])}<span class="dice-sum">= ${t.dice[0] + t.dice[1]}</span></div>`;
  }
  let actions = '';
  if (mine && g.me && !g.me.out) {
    const here = g.pos[cur.char].room;
    const b = [];
    if (t.stage === 'start') b.push(actBtn('roll', '주사위 굴리기', 'dice', 'btn-gold big'));
    if (t.canPassage) b.push(actBtn('passage', `비밀 통로 → ${C.ROOM[C.ROOM[here].passage].name}`, 'passage', 'btn-dark'));
    if (t.canSuggest) b.push(actBtn('suggest', `${C.ROOM[here].name}에서 추리하기`, 'search', t.stage === 'room' ? 'btn-gold big' : 'btn-gold'));
    if (t.stage !== 'disprove') {
      b.push(actBtn('accuse', '최종 고발', 'gavel', 'btn-red'));
      b.push(actBtn('end', t.stage === 'start' ? '차례 넘기기' : '턴 마치기', 'next', 'btn-dark'));
    }
    actions = `<div class="actions">${b.join('')}</div>`;
  } else if (waitingMe) {
    actions = `<div class="actions"><button class="btn btn-gold big" data-act="openShow">${ic('cards')}반박 카드 고르기</button></div>`;
  } else if (g.me && g.me.out) {
    actions = `<div class="note-out">${ic('skull')} 고발에 실패해 탈락했습니다. 반박은 계속 참여합니다.</div>`;
  }
  setHtml(el, `<div class="turn-head"><div class="turn-face" style="--c:${colorOf(cur.char)}"><img src="${charImg(cur.char)}" alt=""></div>
    <div class="turn-info"><div class="turn-who">${mine ? '당신의 차례' : `${esc(cur.name)}의 차례`}</div><div class="turn-stage">${waitingMe ? '<b class="gold">당신이 반박할 차례입니다!</b>' : stageText(g)}</div></div>${clock}</div>${dice}${actions}`);
  tickClocks();
}

$('#turnPanel').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  SFX.click();
  const a = b.dataset.act;
  if (a === 'roll' || a === 'passage' || a === 'end') {
    b.disabled = true;
    act({ type: a });
  } else if (a === 'suggest') openSuggest();
  else if (a === 'accuse') openAccuse();
  else if (a === 'openShow') openShow();
  else if (a === 'openOver') openOver();
});

function renderSugg(g) {
  const el = $('#suggPanel');
  const sg = g.suggestion;
  if (!sg || g.phase !== 'play') {
    el.hidden = true;
    el.dataset.key = '';
    return;
  }
  el.hidden = false;
  const idx = g.players.findIndex((p) => p.pid === sg.by);
  const order = [];
  for (let i = 1; i < g.players.length; i++) order.push(g.players[(idx + i) % g.players.length]);
  const chain = order.map((p) => {
    const c = sg.checks.find((x) => x.pid === p.pid);
    const st = c ? (c.has ? 'has' : 'no') : sg.waiting === p.pid ? 'wait' : 'pending';
    const icon = { has: ic('cards'), no: ic('x'), wait: ic('clock'), pending: '' }[st];
    return `<span class="chk ${st}" title="${esc(p.name)}"><img src="${charImg(p.char)}" alt="">${icon}${esc(p.name)}</span>`;
  }).join(`<i class="ic ic-next chain-arrow"></i>`);
  let result = '';
  if (sg.card) {
    const label = sg.by === S.pid ? `${who(sg.shownBy)}님이 보여준 카드` : `${who(sg.by)}님에게 보여준 카드`;
    result = `<div class="sugg-result">${miniCard(sg.card)}<span>${label}</span></div>`;
  } else if (sg.none) {
    result = `<div class="sugg-result none">${ic('search')} 아무도 반박하지 못했습니다 — 수상한 조합!</div>`;
  } else if (sg.shownBy) {
    result = `<div class="sugg-result">${ic('lock')}<span>${who(sg.shownBy)}님이 ${who(sg.by)}님에게만 카드를 보여줬습니다</span></div>`;
  }
  setHtml(el, `<div class="sugg-head" style="--c:${colorOf(pchar(sg.by))}">${ic('search')}<img src="${charImg(pchar(sg.by))}" alt=""><span>${who(sg.by)}의 추리</span></div>
    <div class="sugg-cards">${miniCard(sg.suspect)}${miniCard(sg.weapon)}${miniCard(sg.room)}</div>
    <div class="chain">${chain}</div>${result}`);
}

function renderHand(g) {
  const el = $('#tab-hand');
  const key = JSON.stringify([g.me && g.me.hand, g.me && g.me.intel.length, g.revealed.length, g.phase]);
  if (key === S.handKey) return;
  S.handKey = key;
  let html = '';
  if (!g.me) {
    html += `<div class="empty-note">${ic('eye')} 관전 중입니다. 다음 게임부터 참가할 수 있어요.</div>`;
  } else {
    html += `<div class="sec-title">내 손패 <small>이 카드들은 범인·흉기·장소가 아닙니다</small></div><div class="hand-grid">${g.me.hand.map(bigCard).join('')}</div>`;
    if (g.me.intel.length) {
      html += `<div class="sec-title">추리로 알아낸 카드</div><div class="intel">${g.me.intel.map((i) => `<div class="intel-row">${miniCard(i.card)}<span>${who(i.from)}님이 보여줌</span></div>`).join('')}</div>`;
    }
  }
  for (const r of g.revealed) {
    html += `<div class="sec-title">${esc(pname(r.pid))}님이 떠나며 공개한 카드</div><div class="hand-grid">${r.cards.map(bigCard).join('')}</div>`;
  }
  el.innerHTML = html;
}

function renderLog(g) {
  const el = $('#tab-log');
  const last = g.log.length ? g.log[g.log.length - 1].n : 0;
  if (last === S.lastLogN) return;
  S.lastLogN = last;
  el.innerHTML = g.log.map((l) => `<div class="log-row k-${l.kind}">${fmt(l.text)}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function renderNotes(g) {
  const el = $('#tab-notes');
  const scroll = el.scrollTop;
  const players = g.players;
  const head = `<tr><th></th>${players.map((p) => `<th title="${esc(p.name)}"><img src="${charImg(p.char)}" alt="" style="--c:${colorOf(p.char)}"></th>`).join('')}<th title="봉투">${ic('envelope')}</th></tr>`;
  const groups = [['용의자', C.SUSPECTS], ['흉기', C.WEAPONS], ['장소', C.ROOMS]];
  const body = groups.map(([label, list]) => `<tr class="grp"><td colspan="${players.length + 2}">${label}</td></tr>` + list.map((item) => {
    const cells = players.map((p) => nbCell(item.id, p.pid));
    const cleared = cells.some((c) => c.v === 'o');
    const solved = !cleared && cells.every((c) => c.v === 'x');
    const tds = cells.map((c, i) => `<td class="nb-c ${c.manual ? 'man' : 'auto'} v-${MARK_CLS[c.v]}" data-nb="${item.id}|${players[i].pid}">${MARK[c.v]}</td>`).join('');
    return `<tr class="${cleared ? 'cleared' : ''} ${solved ? 'solved' : ''}"><td><div class="nb-name t-${typeOf(item.id)}"><img src="${thumbOf(item.id)}" alt=""><span>${esc(item.name)}</span></div></td>${tds}<td class="nb-env">${cleared ? ic('x') : solved ? ic('check') : ''}</td></tr>`;
  }).join('')).join('');
  el.innerHTML = `<p class="nb-help">칸을 눌러 표시 · ${ic('check')} 가지고 있음 · ${ic('x')} 없음 · <b>?</b> 의심. 흐린 표시는 자동 기록이고, 모든 탐정이 ${ic('x')}인 카드는 봉투 속 정답 후보입니다.</p><table class="nb">${head}${body}</table>`;
  el.scrollTop = scroll;
}

$('#tab-notes').addEventListener('click', (e) => {
  const td = e.target.closest('[data-nb]');
  if (!td || !S.game) return;
  const [card, pid] = td.dataset.nb.split('|');
  const order = ['', 'o', 'x', '?'];
  const cur = nbCell(card, pid).v;
  NB.data.manual[td.dataset.nb] = order[(order.indexOf(cur) + 1) % order.length];
  nbSave();
  SFX.click();
  renderNotes(S.game);
});

function setTab(name) {
  S.tab = name;
  for (const b of $$('#tabs [data-tab]')) b.classList.toggle('on', b.dataset.tab === name);
  for (const t of ['hand', 'notes', 'log', 'chat']) $('#tab-' + t).hidden = t !== name;
  if (name === 'chat') {
    S.unread = 0;
    updateBadge();
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  if (name === 'notes' && S.game) renderNotes(S.game);
}
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) setTab(b.dataset.tab);
});

// ───────────────────────── 왼쪽 룰 패널

function renderRules(g) {
  const el = $('#rulesPanel');
  setHtml(el, rulesPanelHtml(g, S.pid, { ic, esc, pname }));
  const step = g.phase === 'play' ? currentStep(g, S.pid) : null;
  if (step !== S.ruleStep) {
    S.ruleStep = step;
    const on = el.querySelector('li.on');
    if (on && S.rulesOpen) on.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function setRulesOpen(open) {
  S.rulesOpen = open;
  $('#gameGrid').classList.toggle('rules-off', !open);
  $('#rulesBtn').classList.toggle('on', open);
  LS.set('clue.rules', open ? '1' : '0');
}

$('#rulesPanel').addEventListener('click', (e) => {
  if (e.target.closest('[data-rules-close]')) setRulesOpen(false);
  else if (e.target.closest('[data-rules-more]')) openRules();
});

// ───────────────────────── 모달들

function openSuggest() {
  const g = S.game;
  const here = g.pos[pchar(S.pid)].room;
  if (!here) return;
  S.sel = { room: here };
  openModal('suggest', `<h3 class="m-title">${ic('search')} 추리하기</h3>
    <p class="m-sub"><b>${C.ROOM[here].name}</b>에서 벌어진 일이라면... 범인과 흉기를 지목하세요.<br>지목한 용의자의 말과 흉기가 이 방으로 옮겨집니다.</p>
    <div class="pick-label">용의자</div><div class="pick-grid" data-group="suspect">${C.SUSPECTS.map((s) => pickCard(s.id)).join('')}</div>
    <div class="pick-label">흉기</div><div class="pick-grid" data-group="weapon">${C.WEAPONS.map((w) => pickCard(w.id)).join('')}</div>
    <div class="pick-label">장소 (현재 방)</div><div>${pickCard(here, { fixed: true })}</div>
    <div class="m-actions"><button class="btn btn-dark" data-m="close">취소</button><button class="btn btn-gold btn-lg" data-m="confirmSuggest" disabled>${ic('search')}추리 발표</button></div>`, { wide: true });
}

function openAccuse() {
  S.sel = {};
  openModal('accuse', `<h3 class="m-title">${ic('gavel')} 최종 고발</h3>
    <p class="m-sub">봉투 속 세 장의 카드를 지목하세요. 방에 있지 않아도 고발할 수 있습니다.</p>
    <div class="pick-label">범인</div><div class="pick-grid" data-group="suspect">${C.SUSPECTS.map((s) => pickCard(s.id)).join('')}</div>
    <div class="pick-label">흉기</div><div class="pick-grid" data-group="weapon">${C.WEAPONS.map((w) => pickCard(w.id)).join('')}</div>
    <div class="pick-label">장소</div><div class="pick-grid rooms" data-group="room">${C.ROOMS.map((r) => pickCard(r.id)).join('')}</div>
    <div class="warn">${ic('skull')} 틀리면 즉시 탈락합니다. 반박에는 계속 참여해야 합니다.</div>
    <div class="m-actions"><button class="btn btn-dark" data-m="close">취소</button><button class="btn btn-red btn-lg" data-m="confirmAccuse" disabled>${ic('gavel')}고발하기</button></div>`, { wide: true });
}

function openShow() {
  const sg = S.game && S.game.suggestion;
  if (!sg || !sg.matches) return;
  const total = 45000;
  openModal('show', `<h3 class="m-title">${ic('cards')} 반박하기</h3>
    <p class="m-sub">${who(sg.by)}님의 추리를 반박할 카드가 있습니다. 한 장을 골라 <b>몰래</b> 보여주세요.</p>
    <div class="sugg-cards">${miniCard(sg.suspect)}${miniCard(sg.weapon)}${miniCard(sg.room)}</div>
    <div class="pick-label">보여줄 카드를 누르세요</div><div class="pick-grid show">${sg.matches.map((id) => pickCard(id, { plain: true })).join('')}</div>
    <div class="m-foot">${S.deadline ? `<div class="clock" data-deadline="${S.deadline}" data-total="${total}" data-tick="1"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" class="clock-bg"/><circle cx="20" cy="20" r="18" class="clock-ring"/></svg><span class="clock-t"></span></div>` : ''}<span>시간이 지나면 자동으로 한 장이 보여집니다</span></div>`, { locked: true });
  SFX.alarm();
  tickClocks();
}

function openReveal() {
  const sg = S.game && S.game.suggestion;
  if (!sg || !sg.card) return;
  openModal('reveal', `<div class="reveal"><h3 class="m-title" style="justify-content:center">${ic('eye')} 몰래 받은 카드</h3>
    <p class="m-sub">${who(sg.shownBy)}님이 당신에게만 보여준 카드입니다</p>
    <div class="flip"><div class="flip-inner"><div class="card card-back"></div>${bigCard(sg.card)}</div></div>
    <p class="hint">탐정 수첩에 자동으로 기록되었습니다</p>
    <div class="m-actions" style="justify-content:center"><button class="btn btn-gold btn-lg" data-m="close">확인</button></div></div>`);
}

function openIntro() {
  const g = S.game;
  const meP = player(S.pid);
  const s = meP && C.SUSPECT[meP.char];
  openModal('intro', `<div class="intro"><div class="intro-kicker">사건 개요</div><h2>도회장 살인 사건</h2>
    <p class="story">폭풍우가 몰아치던 밤, 저택의 주인 도회장이 싸늘한 시신으로 발견되었다. 저택에 머물던 여섯 명 모두가 용의자다.
    봉투 속에 봉인된 진실 — <b>범인, 흉기, 장소</b>를 가장 먼저 밝혀내라.</p>
    ${s ? `<div class="intro-me" style="--c:${s.color}"><img src="${charImg(s.id)}" alt=""><div>당신은 <b>${s.name}</b> (${s.title})<br><small>손에 든 카드는 사건과 무관합니다. 수첩에 자동 표시됩니다.</small></div></div>
    <div class="intro-hand">${g.me.hand.map(bigCard).join('')}</div>` : ''}
    <div class="m-actions" style="justify-content:center"><button class="btn btn-gold btn-lg" data-m="close">${ic('search')}수사 시작</button></div></div>`, { wide: true });
}

function openOver() {
  const g = S.game;
  if (!g || !g.over) return;
  const o = g.over;
  const w = o.winner;
  const sol = o.solution;
  const title = w.reason === 'solved' ? `${esc(pname(w.pid))}의 추리가 적중했습니다!`
    : w.reason === 'last' ? `최후의 탐정 ${esc(pname(w.pid))} 승리`
    : '미제 사건으로 남았습니다';
  const acc = o.accusations.map((a) => `<div class="acc">${ic(a.correct ? 'check' : 'x')}${who(a.pid)}<span>${esc(C.CARDS[a.suspect].name)} · ${esc(C.CARDS[a.weapon].name)} · ${esc(C.CARDS[a.room].name)}</span></div>`).join('');
  const isHost = S.room.hostPid === S.pid;
  openModal('over', `<div class="over"><div class="over-kicker">사건 파일 공개</div><h2 class="over-title">${title}</h2>
    <img class="env" src="assets/envelope.svg" alt="">
    <div class="solution">${[sol.suspect, sol.weapon, sol.room].map((id, i) => `<div class="sol" style="--d:${0.3 + i * 0.35}s">${bigCard(id)}</div>`).join('')}</div>
    <p class="over-story">범인은 <b>${C.SUSPECT[sol.suspect].name}</b>. 장소는 <b>${C.ROOM[sol.room].name}</b>, 흉기는 <b>${C.WEAPON[sol.weapon].name}</b>였다.</p>
    ${acc ? `<div class="acc-list">${acc}</div>` : ''}
    <div class="m-actions" style="justify-content:center">
      ${isHost ? `<button class="btn btn-gold btn-lg" data-m="restart">${ic('refresh')}다시 하기</button><button class="btn btn-dark" data-m="toLobby">대기실로</button>` : '<span class="hint">방장이 새 게임을 시작할 수 있습니다</span>'}
      <button class="btn btn-dark" data-m="close">보드 보기</button></div></div>`, { wide: true });
}

function openRules() {
  openModal('rules', `${rulesModalHtml(ic)}<div class="m-actions"><button class="btn btn-gold btn-lg" data-m="close">알겠어요</button></div>`, { wide: true });
}

function updatePickConfirm() {
  const btn = $('[data-m="confirmSuggest"], [data-m="confirmAccuse"]', $('#modalBox'));
  if (!btn) return;
  btn.disabled = !['suspect', 'weapon', 'room'].every((k) => S.sel[k]);
  btn.classList.remove('armed');
  if (S.modal === 'accuse') btn.innerHTML = `${ic('gavel')}고발하기`;
}

$('#modal').addEventListener('click', (e) => {
  if (e.target === $('#modal')) {
    if (!S.modalLocked) closeModal();
    return;
  }
  const card = e.target.closest('[data-card]');
  if (card && S.modal === 'show') {
    act({ type: 'show', card: card.dataset.card }).then((r) => { if (r.ok) closeModal(); });
    return;
  }
  const grp = card && card.closest('[data-group]');
  if (grp) {
    S.sel[grp.dataset.group] = card.dataset.card;
    for (const b of $$('.pcard', grp)) b.classList.toggle('sel', b === card);
    SFX.click();
    updatePickConfirm();
    return;
  }
  const m = e.target.closest('[data-m]');
  if (!m) return;
  const a = m.dataset.m;
  if (a === 'close') closeModal();
  else if (a === 'ok') {
    const f = S.onOk;
    closeModal();
    if (f) f();
  } else if (a === 'confirmSuggest') {
    m.disabled = true;
    act({ type: 'suggest', suspect: S.sel.suspect, weapon: S.sel.weapon }).then((r) => { if (r.ok) closeModal(); else m.disabled = false; });
  } else if (a === 'confirmAccuse') {
    if (!m.classList.contains('armed')) {
      m.classList.add('armed');
      m.innerHTML = `${ic('gavel')}정말 고발합니다`;
      return;
    }
    m.disabled = true;
    act({ type: 'accuse', suspect: S.sel.suspect, weapon: S.sel.weapon, room: S.sel.room }).then((r) => { if (r.ok) closeModal(); else m.disabled = false; });
  } else if (a === 'restart') {
    send('room:start').then((r) => { if (r.ok) closeModal(); });
  } else if (a === 'toLobby') {
    send('room:lobby').then((r) => { if (r.ok) closeModal(); });
  } else if (a === 'reconnect') {
    S.replaced = false;
    closeModal();
    connLost();
    socket.connect();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.modal && !S.modalLocked) closeModal();
});

// ───────────────────────── 기타 버튼 / 타이머

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-mute]')) {
    SFX.setMuted(!SFX.muted);
    syncMute();
  }
  const hub = e.target.closest('#backHub');
  if (hub) {
    // 허브로 나갈 때도 방에서는 빠져 나간다
    const g = S.game;
    if (g && g.phase === 'play' && player(S.pid) && !player(S.pid).out) {
      e.preventDefault();
      confirmBox('저택을 떠날까요?', '게임 도중에 나가면 가지고 있던 카드가 모두에게 공개됩니다. 보드게임 목록으로 돌아갑니다.', '나가기', () => {
        socket.emit('room:leave');
        location.href = '/';
      }, true);
    } else {
      socket.emit('room:leave');
    }
  }
  if (e.target.closest('[data-leave]')) {
    const g = S.game;
    const leave = () => socket.emit('room:leave');
    if (g && g.phase === 'play' && player(S.pid) && !player(S.pid).out) {
      confirmBox('저택을 떠날까요?', '게임 도중에 나가면 가지고 있던 카드가 모두에게 공개됩니다.', '나가기', leave, true);
    } else {
      leave();
    }
  }
});
$('#rulesBtn').addEventListener('click', () => {
  if (S.screen === 'game') setRulesOpen(!S.rulesOpen);
  else openRules();
});
$('#hostLobbyBtn').addEventListener('click', () => {
  if (S.game && S.game.phase === 'play') confirmBox('대기실로 돌아갈까요?', '진행 중인 게임이 모두에게 종료됩니다.', '대기실로', () => send('room:lobby'), true);
  else send('room:lobby');
});

function tickClocks() {
  for (const el of $$('[data-deadline]')) {
    const left = Math.max(0, Number(el.dataset.deadline) - Date.now());
    const sec = Math.ceil(left / 1000);
    const t = $('.clock-t', el);
    if (t) t.textContent = String(sec);
    const ring = $('.clock-ring', el);
    if (ring) ring.style.strokeDashoffset = String(113 * (1 - left / (Number(el.dataset.total) || 90000)));
    el.classList.toggle('urgent', sec <= 10);
    if (el.dataset.tick === '1' && sec <= 10 && sec > 0 && el.dataset.last !== String(sec)) {
      el.dataset.last = String(sec);
      SFX.tick();
    }
  }
}
setInterval(tickClocks, 250);

(function lightning() {
  setTimeout(() => {
    if (S.screen === 'home' || (S.screen === 'game' && !S.modal)) flash();
    lightning();
  }, 25000 + Math.random() * 35000);
})();

document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
syncMute();
