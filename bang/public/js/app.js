// 황야의 뱅 - 브라우저 쪽 전체 화면과 조작
import { rulesPanelHtml, rulesModalHtml } from './rules.js';
import { cardHtml, zoomCardHtml, chCardHtml, boardHtml, esc, ic } from './cards.js';
import { playEnding } from './ending.js';
import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { watchConnection } from '/common/net.js';
import { faceChip } from '/common/avatar.js';

const B = window.BANG;
const SFX = window.SFX;
const T = B.TYPES;

/* ═════════════════════════ 작은 도구들 ═════════════════════════ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function token() {
  let t = null;
  try { t = localStorage.getItem('bang.token'); } catch (_) { /* 저장소 차단 */ }
  if (!t || !/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now())
      .replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    try { localStorage.setItem('bang.token', t); } catch (_) { /* 무시 */ }
  }
  return t;
}
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };

/* ═════════════════════════ 상태 ═════════════════════════ */

const S = {
  me: null,          // 내 pid
  room: null,        // 서버가 보내주는 방 정보
  g: null,           // room.game
  gameId: null,      // 게임이 새로 시작됐는지 판별
  seenSeq: 0,        // 애니메이션을 재생한 마지막 이벤트 번호
  pick: null,        // 손에서 고른 카드 (대상 지정 대기)
  discardSel: [],    // 버릴 카드로 고른 id 목록
  sidSel: [],        // 시드 능력으로 고른 id 목록
  answered: 0,       // 이미 응답한 promptId
  tab: 'log',        // 옆 패널 탭
  unread: 0,
  rulesOff: remembered('bang.rules', '') === 'off',
  chatLog: [],
  toastedOver: false,
  introShown: false,
  dealPending: false,
  skipDrawFly: 0,     // 내가 끌어서 가져온 카드는 날아가는 연출을 생략
};

/* ═════════════════════════ 소켓 ═════════════════════════ */

// 사이트 하나에 게임이 여러 개라 네임스페이스로 나눈다
// 서버가 다시 켜져도 하던 게임이 이어지게: 서버가 맡긴 방 사본을 접속할 때 같이 보낸다
const keeper = roomKeeper('bang');
const socket = io('/bang', { auth: (cb) => cb({ token: token(), save: keeper.get() }), transports: ['websocket', 'polling'] });
watchConnection(socket);
keeper.attach(socket);
const conn = $('#conn');
let connLost = null;

function setConn(html) {
  if (!html) { conn.hidden = true; return; }
  conn.innerHTML = html;
  conn.hidden = false;
}

socket.on('connect', () => { clearTimeout(connLost); setConn(''); });
socket.on('disconnect', () => {
  clearTimeout(connLost);
  // 짧게 끊겼다 붙는 건 굳이 알리지 않는다
  connLost = setTimeout(() => setConn('서버와 연결이 끊겼습니다. <b>다시 연결하는 중…</b>'), 3000);
});
socket.on('connect_error', () => {
  clearTimeout(connLost);
  connLost = setTimeout(() => setConn('서버에 연결할 수 없습니다. <b>다시 시도하는 중…</b>'), 3000);
});
socket.on('replaced', () => setConn('다른 창에서 접속해서 이 창의 연결이 끊겼습니다. 새로고침하면 이 창으로 돌아옵니다.'));
socket.on('hello', ({ pid }) => { S.me = pid; });
socket.on('toast', (t) => toast(t, 'gold'));

socket.on('chat:history', (list) => { S.chatLog = list || []; renderChat(); });
socket.on('chat', (msg) => {
  S.chatLog.push(msg);
  if (S.chatLog.length > 150) S.chatLog.shift();
  renderChat(true);
  if (!msg.system && msg.pid !== S.me) {
    SFX.chat();
    if (screenName() === 'game' && S.tab !== 'chat') { S.unread++; renderBadge(); }
  }
});

socket.on('room', (room) => {
  S.room = room;
  S.g = room && room.game;
  render();
});

// 서버 답을 영원히 기다리지 않는다: 10초가 지나면 버튼이 다시 풀리게
const emit = (ev, data) => new Promise((res) => {
  let done = false;
  const tm = setTimeout(() => { if (!done) { done = true; res({ ok: false, slow: true, error: '서버 응답이 늦어요. 잠시 뒤 다시 눌러 주세요' }); } }, 10_000);
  socket.emit(ev, data, (r) => { if (done) return; done = true; clearTimeout(tm); res(r || { ok: true }); });
});
async function call(ev, data) {
  const r = await emit(ev, data);
  if (!r.ok && r.error) toast(r.error, 'err');
  return r;
}

/* ═════════════════════════ 화면 전환 ═════════════════════════ */

const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');

function showScreen(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  document.body.dataset.screen = name;
}

/* ═════════════════════════ 토스트 · 확대 ═════════════════════════ */

const toastBox = $('#toasts');
function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = text;
  toastBox.appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

const zoom = $('#zoom');
function showZoom(html, anchor) {
  zoom.innerHTML = html;
  zoom.hidden = false;
  const r = anchor.getBoundingClientRect();
  const w = zoom.offsetWidth || 250;
  const h = zoom.offsetHeight || 350;
  let x = r.right + 14;
  if (x + w > innerWidth - 8) x = r.left - w - 14;
  if (x < 8) x = Math.min(innerWidth - w - 8, Math.max(8, r.left));
  let y = r.top + r.height / 2 - h / 2;
  y = Math.max(8, Math.min(innerHeight - h - 8, y));
  zoom.style.left = `${x}px`;
  zoom.style.top = `${y}px`;
}
const hideZoom = () => { zoom.hidden = true; };

/* ═════════════════════════ 카드 그리기 ═════════════════════════ */

const hpHtml = (hp, maxHp) => {
  const full = Math.max(0, hp);
  const empty = Math.max(0, maxHp - full);
  return '<img src="assets/bullet.svg" alt="">'.repeat(full) + '<img src="assets/bullet-empty.svg" alt="">'.repeat(empty);
};

/* ═════════════════════════ 시작 화면 ═════════════════════════ */

const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('bang.name');
// 로그인했으면 프로필 닉네임으로 채운다 (이름 안 쳐도 됨) · 이모트 버튼
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []), anchor: (pid) => (pid === S.me ? document.getElementById('meInfo') : null) });

function inviteCode() {
  const m = /[?&#]room=([A-Za-z0-9]{4})/.exec(location.href);
  return m ? m[1].toUpperCase() : '';
}
codeInput.value = inviteCode();

function needName() {
  const n = nameInput.value.trim();
  if (!n) { toast('닉네임을 입력하세요', 'err'); nameInput.focus(); return null; }
  remember('bang.name', n);
  return n;
}

$('#createBtn').addEventListener('click', async () => {
  const name = needName();
  if (!name) return;
  SFX.unlock(); SFX.click();
  await call('room:create', { name });
});

async function doJoin() {
  const name = needName();
  if (!name) return;
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) { toast('초대 코드 4글자를 입력하세요', 'err'); codeInput.focus(); return; }
  SFX.unlock(); SFX.click();
  await call('room:join', { name, code });
}
$('#joinBtn').addEventListener('click', doJoin);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') (codeInput.value.trim().length === 4 ? doJoin() : $('#createBtn').click()); });

/* ═════════════════════════ 공통 버튼 ═════════════════════════ */

$$('[data-leave]').forEach((b) => b.addEventListener('click', () => {
  if (S.g && S.g.phase === 'play' && !confirm('게임 중입니다. 정말 나가시겠어요?\n(자리는 AI가 대신 맡습니다)')) return;
  SFX.click();
  socket.emit('room:leave');
}));

function paintMute() {
  $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; });
}
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => {
  SFX.setMuted(!SFX.muted);
  paintMute();
  if (!SFX.muted) { SFX.unlock(); SFX.click(); }
}));
paintMute();

$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/bang/?room=${S.room.code}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('초대 링크를 복사했습니다', 'gold');
  } catch (_) {
    prompt('이 주소를 친구에게 보내세요', url);
  }
});

/* ═════════════════════════ 채팅 ═════════════════════════ */

const chatMounts = [];
function mountChat(host) {
  if (host.dataset.chat) return;
  host.dataset.chat = '1';
  host.appendChild($('#chatTpl').content.cloneNode(true));
  const form = $('.chat-form', host);
  const input = $('input', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    socket.emit('chat', t);
    input.value = '';
  });
  chatMounts.push(host);
}

function renderChat(scroll) {
  for (const host of chatMounts) {
    const log = $('.chat-log', host);
    if (!log) continue;
    log.innerHTML = S.chatLog.map((m) => (m.system
      ? `<div class="cm sys">${esc(m.text)}</div>`
      : `<div class="cm"><div class="cm-name">${esc(m.name)}</div><div class="cm-text">${esc(m.text)}</div></div>`)).join('');
    if (scroll !== false) log.scrollTop = log.scrollHeight;
  }
}

function renderBadge() {
  const b = $('#chatBadge');
  b.hidden = !S.unread;
  b.textContent = S.unread > 9 ? '9+' : String(S.unread);
}

$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  S.tab = btn.dataset.tab;
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === S.tab));
  $('#tab-log').hidden = S.tab !== 'log';
  $('#tab-chat').hidden = S.tab !== 'chat';
  if (S.tab === 'chat') { S.unread = 0; renderBadge(); renderChat(); }
});

/* ═════════════════════════ 대기실 ═════════════════════════ */

function renderLobby() {
  const room = S.room;
  const isHost = room.hostPid === S.me;
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));

  const seated = room.members.filter((m) => m.seated);
  const specs = room.members.filter((m) => !m.seated);

  const slots = [];
  for (let i = 0; i < B.MAX_PLAYERS; i++) {
    const m = seated[i];
    if (!m) { slots.push('<div class="slot empty">빈 자리</div>'); continue; }
    const tags = [];
    if (m.pid === room.hostPid) tags.push(`<span class="tag">${ic('crown')}방장</span>`);
    if (m.isBot) tags.push(`<span class="tag">${ic('bot')}AI</span>`);
    if (m.pid === S.me) tags.push('<span class="tag">나</span>');
    if (!m.online && !m.isBot) tags.push('<span class="tag red">접속 끊김</span>');
    const kick = isHost && m.pid !== S.me
      ? `<button class="icon-btn sm kick" data-kick="${m.pid}" title="내보내기">${ic('x')}</button>` : '';
    slots.push(`<div class="slot">
      ${kick}
      <div class="slot-wanted">WANTED</div>
      ${faceChip(m, 64, 'slot-face')}
      <div class="slot-name">${esc(m.name)}</div>
      <div class="slot-tags">${tags.join('')}</div>
    </div>`);
  }
  $('#seatGrid').innerHTML = slots.join('');

  $('#spectators').innerHTML = specs.length
    ? `${ic('eye')}관전 ${specs.map((m) => `<span class="chip">${esc(m.name)}</span>`).join('')}`
    : '';

  const meM = room.members.find((m) => m.pid === S.me);
  const seatBtn = $('#seatBtn');
  seatBtn.innerHTML = meM && meM.seated ? `${ic('eye')}관전으로 전환` : `${ic('users')}자리에 앉기`;

  $('#addBotBtn').hidden = !isHost;
  $('#startBtn').hidden = !isHost;
  const n = seated.length;
  const hint = n < B.MIN_PLAYERS
    ? `${B.MIN_PLAYERS}명부터 시작할 수 있어요 (지금 ${n}명)`
    : `${n}명으로 시작합니다`;
  $('#startHint').textContent = isHost ? hint : `방장이 시작하기를 기다리는 중… (${n}명)`;
  $('#startBtn').disabled = n < B.MIN_PLAYERS;

  const set = B.ROLE_SETS[Math.min(B.MAX_PLAYERS, Math.max(B.MIN_PLAYERS, n))] || [];
  const count = (r) => set.filter((x) => x === r).length;
  // 이번 인원수에 쓰이는 역할 카드를 실제로 펼쳐 보여 준다
  $('#roleTable').innerHTML = Object.entries(B.ROLES).map(([id, r]) => {
    const c = count(id);
    const pics = c
      ? Array.from({ length: c }, (_, i) => `<img src="assets/role/${id}.svg" alt="" style="--i:${i - (c - 1) / 2}">`).join('')
      : `<img class="none" src="assets/role/${id}.svg" alt="" style="--i:0">`;
    return `<div class="rt-col ${c ? 'on' : ''}">
      <div class="rt-cards">${pics}</div>
      <b>${r.name} ${c ? `× ${c}` : '(이 인원에선 없음)'}</b>
      <div>${esc(r.goal)}</div>
    </div>`;
  }).join('');
}

$('#seatGrid').addEventListener('click', (e) => {
  const k = e.target.closest('[data-kick]');
  if (k) call('room:kick', { pid: k.dataset.kick });
});
$('#addBotBtn').addEventListener('click', () => { SFX.click(); call('room:addBot'); });
$('#seatBtn').addEventListener('click', () => {
  const m = S.room.members.find((x) => x.pid === S.me);
  call('room:seat', { seated: !(m && m.seated) });
});
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.bell(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ═════════════════════════ 게임: 기본 정보 ═════════════════════════ */

const pl = (pid) => (S.g ? S.g.players.find((p) => p.pid === pid) : null);
const pname = (pid) => { const p = pl(pid); return p ? p.name : '?'; };
const meP = () => pl(S.me);
const myPrompt = () => (S.g && S.g.prompt && S.g.prompt.pid === S.me ? S.g.prompt : null);
const isSpectator = () => !!S.g && !meP();

/** 내 자리를 맨 아래에 두고 나머지를 시계 방향으로 돌린 순서 */
function ringOrder() {
  const ps = S.g.players;
  const meIdx = ps.findIndex((p) => p.pid === S.me);
  const base = meIdx < 0 ? 0 : meIdx;
  return ps.map((_, i) => ps[(base + i) % ps.length]);
}

/** 규칙과 같은 방식의 거리 (죽은 사람 제외) */
function distTo(target) {
  const me = meP();
  if (!me || !target || !me.alive || !target.alive || me === target) return null;
  return B.distance(S.g.players, me, target);
}

/* ═════════════════════════ 게임: 자리 ═════════════════════════ */

const hash = (v) => { let h = 7; for (const ch of String(v)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };

/** 역할 카드 (보안관·죽은 사람·나만 앞면, 나머지는 뒷면) */
function roleCardHtml(role, cls = '') {
  if (!role) return `<div class="rcard back ${cls}" title="숨겨진 역할"><img src="assets/role/back.svg" alt=""></div>`;
  return `<div class="rcard r-${role} ${cls}" title="${esc(B.ROLES[role].name)}"><img src="assets/role/${role}.svg" alt="${esc(B.ROLES[role].name)}"></div>`;
}

/** 캐릭터 카드 (실제 뱅처럼 초록 테두리 · 초상화 · 총알 · 능력) */
function charCardHtml(p, cls = '') {
  return chCardHtml(p.char, { cls });
}

const weaponOf = (p) => p.equip.find((c) => T[c.type].weapon) || null;
const gearOf = (p) => p.equip.filter((c) => !T[c.type].weapon);

/** 손에 든 카드를 뒷면으로 부채꼴 표시 */
function handFanHtml(n) {
  const k = Math.min(n, 7);
  const backs = Array.from({ length: k }, (_, i) => {
    const t = k > 1 ? (i / (k - 1)) * 2 - 1 : 0;
    return `<i style="--r:${(t * 16).toFixed(1)}deg;--x:${(t * 13).toFixed(1)}px"></i>`;
  }).join('');
  return `<div class="handfan" title="손패 ${n}장">${backs}<b>${n}</b></div>`;
}

function seatHtml(p, idx, total) {
  const ang = (Math.PI / 2) + (2 * Math.PI * idx) / total;
  const x = 50 + 40 * Math.cos(ang);
  const y = 50 + 36 * Math.sin(ang);
  const me = meP();
  const turn = S.g.turn;
  const cls = ['seat'];
  if (turn && turn.pid === p.pid) cls.push('cur');
  if (!p.alive) cls.push('dead');
  const thinking = S.g.prompt && S.g.prompt.pid === p.pid;
  if (thinking) cls.push('thinking');

  const d = distTo(p);
  const range = me ? B.weaponRange(me) : 0;
  const stats = [];
  if (d !== null) stats.push(`<span class="stat dist ${d > range ? 'far' : ''}">${ic('target')}거리 ${d}</span>`);
  if (!p.online) stats.push(`<span class="stat off">${ic('clock')}자리비움</span>`);

  if (p.role === 'sheriff') cls.push('sheriff');
  const badge = p.role === 'sheriff' ? `<div class="sheriff-badge">${ic('star')}보안관</div>` : '';

  return `<div class="${cls.join(' ')}" data-seat="${p.pid}" style="left:${x}%;top:${y}%">
    ${badge}
    ${thinking ? '<div class="think">선택 중…</div>' : ''}
    <div class="seat-head">
      <div class="seat-name">${esc(p.name)}${p.isBot ? ic('bot') : ''}</div>
      ${handFanHtml(p.handCount)}
    </div>
    ${boardHtml({ roleHtml: roleCardHtml(p.role), charHtml: charCardHtml(p), gun: weaponOf(p), hp: p.hp, maxHp: p.maxHp })}
    <div class="seat-row">${stats.join('')}</div>
    ${gearOf(p).length ? `<div class="equip">${gearOf(p).map((c) => cardHtml(c)).join('')}</div>` : ''}
  </div>`;
}

function renderSeats() {
  const ring = ringOrder();
  const others = ring.slice(1);
  const total = ring.length;
  $('#seats').innerHTML = others.map((p, i) => seatHtml(p, i + 1, total)).join('');
  paintTargets();
}

/* ═════════════════════════ 게임: 대상 지정 ═════════════════════════ */

/** 지금 이 카드를 낼 수 있는지 (서버 규칙을 화면용으로 흉내 낸다) */
function playCheck(card) {
  const g = S.g;
  const me = meP();
  const pr = myPrompt();
  if (!me || !pr || pr.type !== 'play') return { ok: false };
  const type = me.char === 'janet' && card.type === 'missed' ? 'bang' : card.type;
  const info = T[type];
  switch (type) {
    case 'missed':
      return { ok: false, why: '빗나감!은 총을 맞았을 때만 낼 수 있어요' };
    case 'bang': {
      if (g.turn.bangs >= 1 && !B.hasEquip(me, 'volcanic') && me.char !== 'will') {
        return { ok: false, why: '뱅!은 차례마다 한 번만 쓸 수 있어요' };
      }
      const list = targetsFor(type);
      return list.length ? { ok: true, target: 'range' } : { ok: false, why: '사거리 안에 쏠 사람이 없어요' };
    }
    case 'beer':
      if (g.players.filter((p) => p.alive).length <= 2) return { ok: false, why: '두 명만 남으면 맥주는 효과가 없어요' };
      if (me.hp >= me.maxHp) return { ok: false, why: '체력이 이미 가득 찼어요' };
      return { ok: true };
    case 'panic':
    case 'catbalou': {
      const list = targetsFor(type);
      return list.length ? { ok: true, target: type } : { ok: false, why: '가져올 카드를 가진 사람이 없어요' };
    }
    case 'duel':
    case 'jail': {
      const list = targetsFor(type);
      return list.length ? { ok: true, target: type } : { ok: false, why: '대상이 없어요' };
    }
    case 'dynamite':
    case 'barrel':
    case 'scope':
    case 'mustang':
      return B.hasEquip(me, type) ? { ok: false, why: '같은 장비는 하나만 놓을 수 있어요' } : { ok: true };
    default:
      return { ok: true, target: info.target === 'none' ? null : null };
  }
}

/** 그 카드로 노릴 수 있는 사람들 */
function targetsFor(type) {
  const g = S.g;
  const me = meP();
  if (!me) return [];
  const others = g.players.filter((p) => p.alive && p !== me);
  switch (type) {
    case 'bang': {
      const r = B.weaponRange(me);
      return others.filter((p) => B.distance(g.players, me, p) <= r);
    }
    case 'panic':
      return others.filter((p) => B.distance(g.players, me, p) <= 1 && (p.handCount || p.equip.length));
    case 'catbalou':
      return others.filter((p) => p.handCount || p.equip.length);
    case 'jail':
      return others.filter((p) => p.role !== 'sheriff' && !B.hasEquip(p, 'jail'));
    case 'duel':
      return others;
    default:
      return [];
  }
}

function paintTargets() {
  const pickable = S.pick ? targetsFor(S.pick.type === 'missed' && meP().char === 'janet' ? 'bang' : S.pick.type) : null;
  $$('#seats .seat').forEach((el) => {
    el.classList.remove('can-target', 'no-target');
    if (!pickable) return;
    if (pickable.some((p) => p.pid === el.dataset.seat)) el.classList.add('can-target');
    else el.classList.add('no-target');
  });
}

$('#seats').addEventListener('click', (e) => {
  const seat = e.target.closest('.seat');
  if (!seat || !S.pick) return;
  if (!seat.classList.contains('can-target')) return;
  chooseTarget(seat.dataset.seat);
});

async function chooseTarget(pid) {
  const card = S.pick;
  if (!card) return;
  const target = pl(pid);
  const type = meP().char === 'janet' && card.type === 'missed' ? 'bang' : card.type;
  if (type === 'panic' || type === 'catbalou') {
    const which = await askTargetCard(target, type);
    if (!which) return;
    sendPlay({ type: 'play', card: card.id, target: pid, targetCard: which });
    return;
  }
  sendPlay({ type: 'play', card: card.id, target: pid });
}

/** 강탈/캣벌루로 무엇을 노릴지 고르기 */
function askTargetCard(target, type) {
  const opts = [];
  if (target.handCount) opts.push({ id: 'hand', label: `손패에서 무작위 1장 (${target.handCount}장)`, html: '<div class="bcard back"></div>' });
  for (const c of target.equip) opts.push({ id: c.id, label: T[c.type].name, html: cardHtml(c) });
  if (!opts.length) { toast('가져올 카드가 없어요', 'err'); return Promise.resolve(null); }
  if (opts.length === 1) return Promise.resolve(opts[0].id);
  return modalChoice({
    title: `${ic(type === 'panic' ? 'swap' : 'x')} ${esc(target.name)}의 카드 고르기`,
    sub: type === 'panic' ? '가져올 카드를 고르세요.' : '버리게 할 카드를 고르세요.',
    options: opts,
    cancel: true,
  });
}

/* ═════════════════════════ 게임: 손패 ═════════════════════════ */

function renderHand() {
  const g = S.g;
  const hand = g.me ? g.me.hand : [];
  const box = $('#hand');
  if (!hand.length) {
    box.innerHTML = isSpectator() ? '<div class="hand-empty">관전 중입니다</div>' : '<div class="hand-empty">손에 카드가 없습니다</div>';
    return;
  }
  const pr = myPrompt();
  const n = hand.length;
  box.innerHTML = hand.map((c, i) => {
    const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;   // -1 … 1
    const style = `--r:${(t * 5).toFixed(2)}deg;--y:${(Math.abs(t) * 10).toFixed(1)}px`;
    let cls = '';
    if (pr) {
      if (pr.type === 'play') cls = playCheck(c).ok ? 'playable' : 'dim';
      else if (pr.type === 'missed') cls = B.isMissLike(meP(), c) ? 'playable' : 'dim';
      else if (pr.type === 'indians' || pr.type === 'duel') cls = B.isBangLike(meP(), c) ? 'playable' : 'dim';
      else if (pr.type === 'dying') cls = c.type === 'beer' ? 'playable' : 'dim';
      else if (pr.type === 'discard') cls = S.discardSel.includes(c.id) ? 'selected' : '';
    }
    if (S.pick && S.pick.id === c.id) cls = 'selected';
    if (S.sidSel.includes(c.id)) cls = 'selected';
    return cardHtml(c, { cls, style });
  }).join('');
}

$('#hand').addEventListener('click', (e) => {
  if (dragJustEnded) return;
  const el = e.target.closest('.bcard');
  if (!el) return;
  const id = el.dataset.card;
  const card = (S.g.me.hand || []).find((c) => c.id === id);
  if (!card) return;
  onHandClick(card);
});

function onHandClick(card) {
  const pr = myPrompt();
  if (!pr) { toast('지금은 카드를 낼 수 없어요', 'err'); return; }
  SFX.click();

  if (pr.type === 'discard') {
    const i = S.discardSel.indexOf(card.id);
    if (i >= 0) S.discardSel.splice(i, 1);
    else if (S.discardSel.length < pr.data.count) S.discardSel.push(card.id);
    else { S.discardSel.shift(); S.discardSel.push(card.id); }
    renderHand(); renderActionBar();
    return;
  }
  if (pr.type === 'missed') {
    if (!B.isMissLike(meP(), card)) return toast('빗나감! 카드를 골라주세요', 'err');
    return answer({ card: card.id });
  }
  if (pr.type === 'indians' || pr.type === 'duel') {
    if (!B.isBangLike(meP(), card)) return toast('뱅! 카드를 골라주세요', 'err');
    return answer({ card: card.id });
  }
  if (pr.type === 'dying') {
    if (card.type === 'beer') return answer({ type: 'beer', card: card.id });
    if (meP().char === 'sid') return sidToggle(card);
    return toast('맥주만 낼 수 있어요', 'err');
  }
  if (pr.type !== 'play') return;

  if (S.sidSel.length) return sidToggle(card);

  const chk = playCheck(card);
  if (!chk.ok) { toast(chk.why || '지금은 낼 수 없는 카드예요', 'err'); return; }
  if (chk.target) {
    S.pick = S.pick && S.pick.id === card.id ? null : card;
    renderHand(); paintTargets(); renderActionBar();
    return;
  }
  sendPlay({ type: 'play', card: card.id });
}

function sidToggle(card) {
  if (meP().char !== 'sid') return;
  const i = S.sidSel.indexOf(card.id);
  if (i >= 0) S.sidSel.splice(i, 1);
  else if (S.sidSel.length < 2) S.sidSel.push(card.id);
  else { S.sidSel.shift(); S.sidSel.push(card.id); }
  renderHand(); renderActionBar();
}

function sendPlay(payload) {
  S.pick = null;
  answer(payload);
}

async function answer(payload) {
  const pr = myPrompt();
  if (!pr) return;
  if (S.answered === pr.id) return;
  S.answered = pr.id;
  const r = await emit('game:answer', { promptId: pr.id, ...payload });
  if (!r.ok) {
    S.answered = 0;
    if (r.error) toast(r.error, 'err');
    render();
  }
}

/* ═════════════════════════ 게임: 행동 바 ═════════════════════════ */

let clockTimer = null;

function renderActionBar() {
  const bar = $('#actionBar');
  const g = S.g;
  const pr = g.prompt;
  const mine = myPrompt();
  clearInterval(clockTimer);

  if (g.phase === 'over') {
    bar.innerHTML = `<div class="ab-text">${ic('star')}게임이 끝났습니다.</div>
      <div class="ab-btns"><button class="btn btn-gold" data-act="result">결과 다시 보기</button><button class="btn" data-act="replay">결말 영상 다시 보기</button></div>`;
    return;
  }
  if (!pr) {
    bar.innerHTML = `<div class="ab-text">${ic('clock')}카드가 처리되는 중…</div>`;
    return;
  }
  if (!mine) {
    const p = pl(pr.pid);
    bar.innerHTML = `<div class="ab-text"><img src="assets/face/${p ? p.char : ''}.svg" alt="">
      <b>${esc(pname(pr.pid))}</b>님이 선택하는 중…</div>`;
    return;
  }

  const btn = (act, label, cls = 'btn-dark') => `<button class="btn ${cls}" data-act="${act}">${label}</button>`;
  let text = '';
  let btns = [];
  const me = meP();

  switch (mine.type) {
    case 'play': {
      const stage = S.pick
        ? `<b>${esc(T[S.pick.type].name)}</b> 낼 대상을 자리에서 고르세요. (다시 누르면 취소)`
        : '손패를 눌러 카드를 내세요.';
      text = `${ic('gun')}${stage}`;
      if (S.pick) btns.push(btn('cancel', '고르기 취소'));
      if (me.char === 'sid') {
        btns.push(S.sidSel.length === 2
          ? btn('sid', `${ic('heal')}이 2장 버리고 회복`, 'btn-gold')
          : btn('sidStart', `${ic('heal')}약초 (2장 버리고 회복)`));
      }
      btns.push(btn('end', `${ic('next')}턴 마치기`, 'btn-red'));
      break;
    }
    case 'missed':
      text = `<span class="ab-text alert">${ic('target')}<b>${esc(pname(mine.data.from))}</b>의 뱅! ${mine.data.need > 1 ? `빗나감! <b>${mine.data.need}장</b>이 필요합니다` : '빗나감!을 내서 피하세요'}</span>`;
      btns.push(btn('none', `${ic('skull')}그냥 맞기`, 'btn-red'));
      break;
    case 'indians':
      text = `<span class="ab-text alert">${ic('target')}인디언 습격! 뱅!을 버리거나 체력을 잃습니다</span>`;
      btns.push(btn('none', `${ic('skull')}체력 잃기`, 'btn-red'));
      break;
    case 'duel':
      text = `<span class="ab-text alert">${ic('gun')}<b>${esc(pname(mine.data.vs))}</b>와(과) 결투 중! 뱅!을 내서 버티세요</span>`;
      btns.push(btn('none', `${ic('skull')}포기하기`, 'btn-red'));
      break;
    case 'dying':
      text = `<span class="ab-text alert">${ic('heart')}쓰러지기 직전! 맥주를 마시면 버틸 수 있어요</span>`;
      if (me.char === 'sid') {
        btns.push(S.sidSel.length === 2
          ? btn('sidDie', `${ic('heal')}이 2장 버리고 버티기`, 'btn-gold')
          : btn('sidStart', `${ic('heal')}약초로 버티기 (2장 선택)`));
      }
      btns.push(btn('die', `${ic('skull')}쓰러지기`, 'btn-red'));
      break;
    case 'discard':
      text = `${ic('cards')}손패 제한! 버릴 카드 <b>${mine.data.count}장</b>을 고르세요 (${S.discardSel.length}/${mine.data.count})`;
      btns.push(btn('discard', `${ic('check')}확인`, S.discardSel.length === mine.data.count ? 'btn-gold' : 'btn-dark'));
      break;
    case 'store':
      text = `${ic('cards')}잡화점! 가운데에서 카드 1장을 고르세요`;
      break;
    case 'draw':
      text = `${ic('deck')}차례 시작! 가운데 <b>덱</b>을 끌어서 손으로 가져오세요 (남은 <b>${mine.data.left}장</b>)`;
      btns.push(btn('take', `${ic('deck')}한 장 가져오기`, 'btn-gold'));
      break;
    case 'kit':
      text = `${ic('deck')}카드 3장 중 덱에 돌려놓을 1장을 고르세요`;
      break;
    case 'jesse':
      text = `${ic('swap')}첫 카드를 누구의 손패에서 가져올까요?`;
      break;
    case 'pedro':
      text = `${ic('swap')}첫 카드를 버린 더미에서 가져올까요?`;
      break;
    default:
      text = '';
  }

  const clock = mine.deadlineIn != null
    ? `<div class="clock" id="clock"><svg viewBox="0 0 40 40"><circle class="clock-bg" cx="20" cy="20" r="18"/><circle class="clock-ring" cx="20" cy="20" r="18"/></svg><div class="clock-t"></div></div>` : '';

  bar.innerHTML = `${text.startsWith('<span') ? text : `<div class="ab-text">${text}</div>`}
    <div class="ab-btns">${btns.join('')}</div>${clock}`;

  if (mine.deadlineIn != null) startClock(mine.deadlineIn);
}

function startClock(ms) {
  const box = $('#clock');
  if (!box) return;
  const ring = $('.clock-ring', box);
  const label = $('.clock-t', box);
  const total = ms;
  const end = Date.now() + ms;
  let lastTick = -1;
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    const frac = total ? left / total : 0;
    ring.style.strokeDashoffset = String(113 * (1 - frac));
    const secs = Math.ceil(left / 1000);
    label.textContent = String(secs);
    box.classList.toggle('urgent', left < 6000);
    if (left < 6000 && secs !== lastTick) { lastTick = secs; if (secs > 0) SFX.tick(); }
    if (left <= 0) clearInterval(clockTimer);
  };
  tick();
  clockTimer = setInterval(tick, 200);
}

$('#actionBar').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  SFX.click();
  const act = b.dataset.act;
  const pr = myPrompt();
  if (act === 'result') return showOver();
  if (act === 'replay') return playEndingFilm();
  if (!pr) return;
  switch (act) {
    case 'cancel': S.pick = null; renderHand(); paintTargets(); renderActionBar(); break;
    case 'take': takeFromDeck(false); break;
    case 'end': sendPlay({ type: 'end' }); break;
    case 'none': answer({ card: null }); break;
    case 'die': answer({ type: 'die' }); break;
    case 'sidStart': S.sidSel = []; toast('버릴 카드 2장을 손패에서 고르세요', 'gold'); renderHand(); renderActionBar(); break;
    case 'sid': answer({ type: 'sid', cards: [...S.sidSel] }); S.sidSel = []; break;
    case 'sidDie': answer({ type: 'sid', cards: [...S.sidSel] }); S.sidSel = []; break;
    case 'discard':
      if (S.discardSel.length !== pr.data.count) return toast(`${pr.data.count}장을 골라야 해요`, 'err');
      answer({ cards: [...S.discardSel] });
      S.discardSel = [];
      break;
    default: break;
  }
});

/* ═════════════════════════ 게임: 내 정보 ═════════════════════════ */

let roleHidden = true;

function renderMe() {
  const g = S.g;
  const me = meP();
  const box = $('#meInfo');
  if (!me) {
    box.className = 'me-info';
    box.innerHTML = `<div class="me-txt"><b>관전 중</b><small>게임을 지켜보고 있습니다.</small></div>`;
    return;
  }
  const char = B.CHAR[me.char];
  const role = B.ROLES[me.role];
  const isTurn = g.turn && g.turn.pid === me.pid;
  // 보안관은 실제 게임처럼 처음부터 앞면
  const hidden = roleHidden && me.role !== 'sheriff' && me.alive;
  box.className = `me-info ${isTurn ? 'cur' : ''} ${me.role === 'sheriff' ? 'sheriff' : ''}`;
  const roleSlot = `<div class="me-role-card ${hidden ? 'hide' : ''}" title="눌러서 내 역할 보기/가리기">
      ${hidden ? roleCardHtml(null) : roleCardHtml(me.role)}
    </div>`;
  box.innerHTML = `
    ${me.role === 'sheriff' ? `<div class="sheriff-badge">${ic('star')}내가 보안관</div>` : ''}
    ${boardHtml({ roleHtml: roleSlot, charHtml: charCardHtml(me), gun: weaponOf(me), hp: me.hp, maxHp: me.maxHp, cls: 'big' })}
    <div class="me-txt">
      <b>${esc(char.name)} <small class="me-role-name">${hidden ? '· 역할 카드를 눌러 확인' : `· ${esc(role.name)}`}</small></b>
      <small>${esc(char.ability)}</small>
    </div>
    ${hidden ? '' : `<div class="me-goal">${esc(role.goal)}</div>`}
    <div class="me-row">
      <span class="stat">${ic('heart')}체력 ${me.hp}/${me.maxHp}</span>
      <span class="stat">${ic('gun')}사거리 ${B.weaponRange(me)}</span>
      ${!me.alive ? '<span class="stat off">탈락</span>' : ''}
    </div>
    ${gearOf(me).length ? `<div class="me-equip">${gearOf(me).map((c) => cardHtml(c)).join('')}</div>` : ''}`;
}

$('#meInfo').addEventListener('click', (e) => {
  if (e.target.closest('.me-role-card')) { roleHidden = !roleHidden; renderMe(); }
});

/* ═════════════════════════ 게임: 가운데 (덱·버린 카드·판정·잡화점) ═════════════════════════ */

function renderCenter() {
  const g = S.g;
  $('#deckCount').textContent = String(g.deckCount);
  // 덱은 남은 장수만큼 두껍게
  const thick = Math.min(9, Math.ceil(g.deckCount / 9));
  const deckCard = $('#deckPile .bcard');
  deckCard.style.boxShadow = [
    ...Array.from({ length: thick }, (_, i) => `${-(i + 1) * 0.6}px ${(i + 1) * 1.1}px 0 ${i % 2 ? '#1c0c04' : '#d9bf8f'}`),
    '0 10px 18px rgba(0,0,0,.55)',
  ].join(',');
  deckCard.hidden = g.deckCount === 0;
  const canTake = !!(myPrompt() && myPrompt().type === 'draw');
  $('#deckPile').classList.toggle('takeable', canTake);
  // 버린 카드는 조금씩 비뚤게 겹쳐 쌓인다
  if (g.discardTop) {
    const top = g.discardTop;
    const rot = (hash(top.id) % 19) - 9;
    const under = Math.min(3, g.discardCount - 1);
    $('#discardPile').innerHTML = `<div class="tossed">
      ${Array.from({ length: under }, (_, i) => `<div class="bcard under" style="--rot:${((hash(top.id + i) % 27) - 13)}deg"></div>`).join('')}
      ${cardHtml(top, { cls: 'top', style: `--rot:${rot}deg` })}
    </div>`;
  } else {
    $('#discardPile').innerHTML = '';
  }

  const store = $('#storeArea');
  if (g.store && g.store.length) {
    const mine = myPrompt() && myPrompt().type === 'store';
    store.hidden = false;
    store.innerHTML = `<h4>${ic('cards')} 잡화점</h4>
      <div class="store-cards ${mine ? 'pick' : ''}">${g.store.map((c) => cardHtml(c)).join('')}</div>`;
  } else {
    store.hidden = true;
    store.innerHTML = '';
  }
}

$('#storeArea').addEventListener('click', (e) => {
  const el = e.target.closest('.bcard');
  const pr = myPrompt();
  if (!el || !pr || pr.type !== 'store') return;
  SFX.card();
  answer({ card: el.dataset.card });
});

/* ═════════════════════════ 게임: 기록 ═════════════════════════ */

function logText(t) {
  return String(t)
    .replace(/\{p:([^}]+)\}/g, (_, pid) => `<span class="lp">${esc(pname(pid))}</span>`)
    .replace(/\{c:([^}]+)\}/g, (_, type) => {
      const info = T[type];
      return `<span class="lc ${info && info.kind === 'blue' ? 'blue' : ''}">${esc(info ? info.name : type)}</span>`;
    })
    .replace(/\{r:([^}]+)\}/g, (_, r) => `<span class="lr r-${r}">${esc(B.ROLES[r] ? B.ROLES[r].name : r)}</span>`);
}

function renderLog() {
  const box = $('#tab-log');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = S.g.log.map((l) => `<div class="log-row k-${l.kind}">${logText(l.text)}</div>`).join('');
  if (near) box.scrollTop = box.scrollHeight;
}

/* ═════════════════════════ 게임: 룰 패널 ═════════════════════════ */

function renderRules() {
  const grid = $('#gameGrid');
  grid.classList.toggle('rules-off', S.rulesOff);
  if (S.rulesOff) return;
  $('#rulesPanel').innerHTML = rulesPanelHtml(S.g, S.me, { ic, esc, pname });
}

$('#rulesBtn').addEventListener('click', () => {
  S.rulesOff = !S.rulesOff;
  remember('bang.rules', S.rulesOff ? 'off' : 'on');
  renderRules();
});
$('#rulesPanel').addEventListener('click', (e) => {
  if (e.target.closest('[data-rules-close]')) {
    S.rulesOff = true; remember('bang.rules', 'off'); renderRules();
  }
  if (e.target.closest('[data-rules-more]')) openModal(rulesModalHtml(ic), { wide: true, close: '닫기' });
});

/* ═════════════════════════ 모달 ═════════════════════════ */

const modal = $('#modal');
const modalBox = $('#modalBox');
let modalResolve = null;

function openModal(html, opt = {}) {
  modalBox.className = `modal-box ${opt.wide ? 'wide' : ''}`;
  modalBox.innerHTML = html + (opt.close
    ? `<div class="m-actions"><button class="btn btn-dark" data-close>${esc(opt.close)}</button></div>` : '');
  modal.hidden = false;
}
function closeModal(value) {
  if (S.dealPending) { S.dealPending = false; setTimeout(dealAnimation, 150); }
  modal.hidden = true;
  modalBox.innerHTML = '';
  const r = modalResolve;
  modalResolve = null;
  if (r) r(value ?? null);
}
modal.addEventListener('click', (e) => {
  // 캐릭터 고르는 중에는 바깥을 눌러도 닫히면 안 된다
  const locked = S.g && S.g.phase === 'setup';
  if (e.target === modal && !modalResolve && !locked) return closeModal();
  if (e.target.closest('[data-close]')) return closeModal();
  const opt = e.target.closest('[data-choice]');
  if (opt) { SFX.click(); closeModal(opt.dataset.choice); }
});

function modalChoice({ title, sub, options, cancel }) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    openModal(`<h3 class="m-title">${title}</h3>
      ${sub ? `<p class="m-sub">${sub}</p>` : ''}
      <div class="pick-row">${options.map((o) => `<button class="pick-btn" data-choice="${esc(o.id)}">${o.html || ''}<span>${esc(o.label)}</span></button>`).join('')}</div>
      ${cancel ? '<div class="m-actions"><button class="btn btn-dark" data-close>취소</button></div>' : ''}`);
  });
}

/* ═════════════════════════ 특수 선택 (킷 · 제시 · 페드로) ═════════════════════════ */

let specialFor = 0;

function renderSpecialPrompt() {
  const pr = myPrompt();
  if (!pr || !['kit', 'jesse', 'pedro'].includes(pr.type)) return;
  if (specialFor === pr.id) return;
  specialFor = pr.id;

  if (pr.type === 'kit') {
    modalChoice({
      title: `${ic('deck')} 카드장인 킷`,
      sub: '3장 중 <b>덱 위에 돌려놓을</b> 1장을 고르세요. 나머지 2장을 가져갑니다.',
      options: pr.data.cards.map((c) => ({ id: c.id, label: T[c.type].name, html: cardHtml(c) })),
    }).then((v) => { if (v) answer({ back: v }); });
    return;
  }
  if (pr.type === 'jesse') {
    const opts = [{ id: 'deck', label: '덱에서 뽑기', html: '<div class="bcard back"></div>' }];
    for (const pid of pr.data.targets) {
      const p = pl(pid);
      if (p) opts.push({ id: pid, label: `${p.name} (${p.handCount}장)`, html: `<img src="assets/face/${p.char}.svg" alt="">` });
    }
    modalChoice({
      title: `${ic('swap')} 소매치기 제시`,
      sub: '첫 카드를 <b>누구의 손패</b>에서 가져올까요?',
      options: opts,
    }).then((v) => { if (v) answer({ from: v }); });
    return;
  }
  if (pr.type === 'pedro') {
    const top = pr.data.top;
    modalChoice({
      title: `${ic('swap')} 페드로`,
      sub: '첫 카드를 어디에서 가져올까요?',
      options: [
        { id: 'discard', label: top ? T[top.type].name : '버린 더미', html: top ? cardHtml(top) : '<div class="bcard back"></div>' },
        { id: 'deck', label: '덱에서 뽑기', html: '<div class="bcard back"></div>' },
      ],
    }).then((v) => { if (v) answer({ from: v }); });
  }
}

/* ═════════════════════════ 캐릭터 고르기 ═════════════════════════ */

let pickCharTimer = null;

function renderPickChar() {
  const g = S.g;
  const st = g.setup;
  const me = meP();
  if (!st || !me) return;

  const role = B.ROLES[me.role];
  const waiting = st.waiting.filter((pid) => pid !== S.me).map(pname);
  const done = st.myPick;

  const card = (id) => {
    const c = B.CHAR[id];
    const hp = c.hp + (me.role === 'sheriff' ? 1 : 0);
    const chosen = done === id;
    return `<button class="pc-card ${done && !chosen ? 'taken' : ''}" data-char-pick="${id}" ${done ? 'disabled' : ''}>
      ${chCardHtml(id)}
      <span class="pc-note">${chosen ? '선택함' : `체력 ${hp}${hp !== c.hp ? ' (보안관 +1)' : ''} · 이 캐릭터로`}</span>
    </button>`;
  };

  openModal(`<div class="pickchar">
      <h3 class="m-title">${ic('hat')} 캐릭터를 고르세요</h3>
      <div class="pc-role">
        <img src="assets/role/${me.role}.svg" alt="">
        <div><b>${esc(role.name)}</b><small>${esc(role.goal)}</small></div>
      </div>
      <p class="m-sub">두 명 중 한 명으로 이번 판을 치릅니다. ${me.role === 'sheriff' ? '보안관은 체력이 1 더 많습니다.' : ''}</p>
      <div class="pc-grid">${st.choices.map(card).join('')}</div>
      <div class="pc-wait">
        ${done
          ? `<b>${esc(B.CHAR[done].name)}</b> 선택 완료! ${waiting.length ? `${esc(waiting.join(', '))} 기다리는 중…` : '곧 시작합니다…'}`
          : '남은 시간 <span class="pc-clock" id="pcClock">–</span>초'}
      </div>
    </div>`);

  clearInterval(pickCharTimer);
  if (!done) {
    const end = Date.now() + (st.deadlineIn || 0);
    const tick = () => {
      const el = $('#pcClock');
      if (!el) { clearInterval(pickCharTimer); return; }
      el.textContent = String(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    };
    tick();
    pickCharTimer = setInterval(tick, 300);
  }
}

modalBox.addEventListener('click', (e) => {
  const b = e.target.closest('[data-char-pick]');
  if (!b) return;
  SFX.click();
  socket.emit('game:pickChar', { char: b.dataset.charPick }, (r) => {
    if (r && !r.ok && r.error) toast(r.error, 'err');
  });
});

/* ═════════════════════════ 게임 시작 인트로 · 결과 ═════════════════════════ */

function showIntro() {
  const me = meP();
  if (!me) return;
  const role = B.ROLES[me.role];
  const char = B.CHAR[me.char];
  openModal(`<div class="intro">
      <div class="intro-kicker">당신의 정체</div>
      <h2>${esc(role.name)}</h2>
      <p class="intro-sheriff">${ic('star')}이번 판 보안관: <b>${esc(pname((S.g.players.find((p) => p.role === 'sheriff') || {}).pid))}</b>${me.role === 'sheriff' ? ' (바로 당신!)' : ''}</p>
      <div class="intro-cards">
        <div class="intro-role">
          <img src="assets/role/${me.role}.svg" alt="">
          <b>${esc(role.name)}</b>
          <p>${esc(role.goal)}</p>
        </div>
        <div class="intro-char">
          ${chCardHtml(me.char)}
          <b>${esc(char.name)}</b>
          <p>${esc(char.ability)}</p>
          <p style="margin-top:6px;color:#c8b48a">체력 ${me.maxHp}</p>
        </div>
      </div>
    </div>`, { close: '시작하기' });
  SFX.bell();
}

/** 결말 영상 → 결과 창 */
async function playEndingFilm() {
  const g = S.g;
  if (!g || !g.over) return;
  const me = g.players && g.players.find((p) => p.pid === S.me);
  const myRole = me && (me.role || (g.me && g.me.role));
  const iWon = myRole && g.over.winners.includes(myRole);
  const SND = {
    'start:duel': () => SFX.bell(),
    tension: () => SFX.tick(),
    tick: () => SFX.tick(),
    gun: () => SFX.gun(),
    gun2: () => setTimeout(() => SFX.gun(), 40),
    hit: () => SFX.hit(),
    thud: () => SFX.death(),
    laugh: () => SFX.lose(),
    bell: () => SFX.win(),
    wind: () => SFX.flip(),
    whistle: () => SFX.bell(),
  };
  try {
    await playEnding($('#ending'), g.over.winners, { sub: myRole ? (iWon ? '당신의 승리입니다' : '당신은 패배했습니다') : '', sound: (k) => SND[k] && SND[k]() });
  } catch (e) {
    console.warn('결말 영상 오류', e);
  }
  if (S.g && S.g.over) showOver();
}

function showOver() {
  const g = S.g;
  if (!g.over) return;
  const winners = g.over.winners;
  const label = winners.includes('sheriff') ? '보안관과 부관' : winners.includes('renegade') ? '배신자' : '무법자';
  const me = meP();
  const iWon = me && winners.includes(me.role);
  const isHost = S.room.hostPid === S.me;

  const cards = g.over.roles.map((r) => {
    const p = pl(r.pid);
    const win = winners.includes(r.role);
    return `<div class="over-p ${win ? 'win' : ''}">
      <img class="face-img" src="assets/face/${p ? p.char : ''}.svg" alt="">
      <img class="role-img" src="assets/role/${r.role}.svg" alt="">
      <b>${esc(p ? p.name : '?')}</b>
      <small>${esc(B.ROLES[r.role].name)} · ${r.alive ? '생존' : '탈락'}</small>
    </div>`;
  }).join('');

  openModal(`<div class="over">
      <h2 class="over-title">GAME OVER</h2>
      <div class="over-sub">${esc(label)}의 승리!${me ? (iWon ? ' 🎉 당신의 승리입니다' : '') : ''}</div>
      <div class="over-grid">${cards}</div>
      <div class="m-actions">
        ${isHost ? '<button class="btn btn-gold btn-lg" data-again>대기실로 돌아가기</button>' : '<span class="hint">방장이 다음 판을 시작할 때까지 기다려 주세요</span>'}
        <button class="btn btn-dark" data-close>닫기</button>
      </div>
    </div>`, {});
  if (me) (iWon ? SFX.win() : SFX.lose());
  else SFX.win();
}

modalBox.addEventListener('click', (e) => {
  if (e.target.closest('[data-again]')) { closeModal(); call('room:lobby'); }
});

/* ═════════════════════════ 애니메이션 ═════════════════════════ */

const felt = $('#felt');
const fx = $('#fx');
const flyLayer = $('#flyLayer');

function anchorRect(pid) {
  if (pid === S.me) {
    const el = $('#meInfo');
    return el ? el.getBoundingClientRect() : null;
  }
  const el = $(`#seats .seat[data-seat="${pid}"]`);
  return el ? el.getBoundingClientRect() : null;
}
const deckRect = () => $('#deckPile').getBoundingClientRect();
const discardRect = () => $('#discardPile').getBoundingClientRect();
const center = (r) => (r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);

/** 덱에서 한 장씩 돌아가며 나눠 주기 */
function dealAnimation() {
  const g = S.g;
  if (!g) return;
  const ring = ringOrder();
  const most = Math.max(...ring.map((p) => (p.pid === S.me && g.me ? g.me.hand.length : p.handCount)));
  let t = 0;
  for (let k = 0; k < most; k++) {
    for (const p of ring) {
      const n = p.pid === S.me && g.me ? g.me.hand.length : p.handCount;
      if (k >= n) continue;
      const at = t;
      setTimeout(() => {
        flyCard(deckRect(), anchorRect(p.pid), null);
        if (at % 140 === 0) SFX.card();
      }, at);
      t += 70;
    }
  }
}

function flyCard(fromR, toR, card, delay = 0) {
  const a = center(fromR);
  const b = center(toR);
  if (!a || !b) return;
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = cardHtml(card);
  el.style.left = '0px';
  el.style.top = '0px';
  el.style.transform = `translate(${a.x - 35}px, ${a.y - 49}px) scale(.7)`;
  flyLayer.appendChild(el);
  setTimeout(() => {
    el.style.transform = `translate(${b.x - 35}px, ${b.y - 49}px) scale(1)`;
  }, 20 + delay);
  setTimeout(() => { el.style.opacity = '0'; }, 480 + delay);
  setTimeout(() => el.remove(), 800 + delay);
}

function tracer(fromPid, toPid) {
  const a = center(anchorRect(fromPid));
  const b = center(anchorRect(toPid));
  const fr = felt.getBoundingClientRect();
  if (!a || !b) return;
  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('class', 'tracer');
  line.setAttribute('x1', a.x - fr.left); line.setAttribute('y1', a.y - fr.top);
  line.setAttribute('x2', b.x - fr.left); line.setAttribute('y2', b.y - fr.top);
  fx.appendChild(line);
  const flash = document.createElementNS(ns, 'circle');
  flash.setAttribute('class', 'muzzle');
  flash.setAttribute('cx', a.x - fr.left); flash.setAttribute('cy', a.y - fr.top);
  flash.setAttribute('r', '4');
  fx.appendChild(flash);
  setTimeout(() => { line.remove(); flash.remove(); }, 700);
}

function pulse(pid, cls) {
  const el = pid === S.me ? $('#meInfo') : $(`#seats .seat[data-seat="${pid}"]`);
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 1200);
}

let checkTimer = null;
function showCheck(e) {
  const area = $('#checkArea');
  const cards = e.cards || [];
  area.innerHTML = cards.map((c) => `<div class="check-card ${c.id === e.chosen ? 'chosen' : ''}">
    ${cardHtml(c)}
    ${c.id === e.chosen ? `<b class="${e.success ? 'ok' : 'bad'}">${e.success ? '성공' : '실패'}</b>` : ''}
  </div>`).join('');
  clearTimeout(checkTimer);
  checkTimer = setTimeout(() => { area.innerHTML = ''; }, 3200);
}

const CHECK_LABEL = { barrel: '술통', jail: '감옥', dynamite: '다이너마이트', jordan: '방탄 조던' };

function playEvents() {
  const g = S.g;
  if (!g || !g.events) return;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  if (!fresh.length) return;
  S.seenSeq = g.events[g.events.length - 1].seq;
  // 첫 진입(과거 기록까지 몰려 있을 때)에는 애니메이션을 생략한다
  if (fresh.length > 12) return;

  fresh.forEach((e, i) => setTimeout(() => runEvent(e), i * 90));
}

function runEvent(e) {
  switch (e.type) {
    case 'turn':
      SFX.turn();
      break;
    case 'sheriff':
      SFX.bell();
      toast(`${ic('star')}<b>${esc(pname(e.pid))}</b> 님이 보안관입니다!`, 'gold');
      pulse(e.pid, 'healed');
      break;
    case 'draw':
      if (e.pid === S.me && S.skipDrawFly > 0) { S.skipDrawFly--; break; }
      SFX.draw();
      (e.cards || Array(e.n || 1).fill(null)).forEach((c, i) => flyCard(deckRect(), anchorRect(e.pid), c, i * 90));
      break;
    case 'take':
      SFX.card();
      (e.cards || [null]).forEach((c, i) => flyCard(discardRect(), anchorRect(e.pid), c, i * 90));
      break;
    case 'steal':
      SFX.card();
      (e.cards || Array(e.n || 1).fill(null)).forEach((c, i) => flyCard(anchorRect(e.from), anchorRect(e.to), c, i * 90));
      break;
    case 'discard':
      SFX.card();
      (e.cards || Array(e.n || 1).fill(null)).forEach((c, i) => flyCard(anchorRect(e.pid), discardRect(), c, i * 80));
      break;
    case 'play':
      SFX.card();
      flyCard(anchorRect(e.pid), discardRect(), e.card);
      break;
    case 'equip':
      SFX.clank();
      flyCard(anchorRect(e.from || e.pid), anchorRect(e.pid), e.card);
      break;
    case 'pick': {
      SFX.card();
      const store = $('#storeArea');
      const from = store && !store.hidden ? store.getBoundingClientRect() : felt.getBoundingClientRect();
      (e.cards || [null]).forEach((c) => flyCard(from, anchorRect(e.pid), c));
      break;
    }
    case 'shot':
      SFX.gun();
      tracer(e.from, e.to);
      break;
    case 'damage':
      SFX.hit();
      pulse(e.pid, 'hit');
      break;
    case 'heal':
      SFX.heal();
      pulse(e.pid, 'healed');
      break;
    case 'explode':
      SFX.boom();
      pulse(e.pid, 'boom');
      break;
    case 'death':
      SFX.death();
      toast(`${esc(pname(e.pid))} 탈락 — <b>${esc(B.ROLES[e.role] ? B.ROLES[e.role].name : '')}</b>`, 'gold');
      break;
    case 'check':
      SFX.flip();
      showCheck(e);
      toast(`${ic('deck')}판정! <b>${esc(CHECK_LABEL[e.reason] || e.reason)}</b> — ${e.success ? '성공' : '실패'}`, e.success ? 'gold' : '');
      break;
    case 'reveal':
      SFX.flip();
      if (e.card) toast(`${esc(pname(e.pid))} 공개: <b>${esc(T[e.card.type].name)}</b>`, '');
      break;
    case 'reshuffle':
      SFX.card();
      toast('버린 카드를 섞어 새 덱을 만듭니다', '');
      break;
    case 'store':
      SFX.card();
      break;
    default:
      break;
  }
}

/* ═════════════════════════ 카드를 손으로 집어 옮기기 ═════════════════════════ */

const DRAG_MIN = 7;
let drag = null;
let dragJustEnded = false;

/** 내 차례 시작에 덱에서 한 장 집어 온다 */
function takeFromDeck(dragged) {
  const pr = myPrompt();
  if (!pr || pr.type !== 'draw') return;
  if (dragged) S.skipDrawFly++;
  SFX.draw();
  answer({ take: true });
}

$('#deckPile').addEventListener('click', () => {
  if (dragJustEnded) return;
  takeFromDeck(false);
});

function startDrag(e, kind, card, srcEl) {
  if (e.button !== 0) return;
  drag = { kind, card, srcEl, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
}

$('#hand').addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.bcard');
  if (!el || !myPrompt() || !S.g.me) return;
  const card = S.g.me.hand.find((c) => c.id === el.dataset.card);
  if (card) startDrag(e, 'hand', card, el);
});
$('#deckPile').addEventListener('pointerdown', (e) => {
  const pr = myPrompt();
  if (!pr || pr.type !== 'draw') return;
  startDrag(e, 'deck', null, $('#deckPile .bcard'));
});

function beginDragVisual() {
  hideZoom();
  document.body.classList.add('is-dragging');
  const d = drag;
  if (d.kind === 'hand' && myPrompt() && myPrompt().type === 'play') {
    const chk = playCheck(d.card);
    if (chk.ok && chk.target) { S.pick = d.card; paintTargets(); }
  }
  d.ghost = document.createElement('div');
  d.ghost.className = 'drag-ghost';
  d.ghost.innerHTML = d.kind === 'deck' ? '<div class="bcard back"></div>' : cardHtml(d.card);
  flyLayer.appendChild(d.ghost);
  if (d.srcEl) d.srcEl.classList.add('dragging');
  SFX.card();
}

let dropEl = null;
function markDrop(x, y) {
  const el = document.elementFromPoint(x, y);
  const seat = el && el.closest('#seats .seat.can-target');
  const table = el && (el.closest('#felt') || el.closest('#meInfo'));
  const target = seat || table;
  if (target === dropEl) return;
  if (dropEl) dropEl.classList.remove('drop-hover');
  dropEl = target;
  if (dropEl) dropEl.classList.add('drop-hover');
}

document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_MIN) return;
    drag.moved = true;
    beginDragVisual();
  }
  drag.ghost.style.transform = `translate(${e.clientX - 55}px, ${e.clientY - 40}px) rotate(-5deg)`;
  markDrop(e.clientX, e.clientY);
});

function endDragVisual(d) {
  document.body.classList.remove('is-dragging');
  if (d.ghost) d.ghost.remove();
  if (d.srcEl) d.srcEl.classList.remove('dragging');
  if (dropEl) dropEl.classList.remove('drop-hover');
  dropEl = null;
}

function dropCard(d, x, y) {
  const el = document.elementFromPoint(x, y);
  if (d.kind === 'deck') {
    // 덱 밖 아무 데나 내려놓으면 내 손으로 가져온 것
    if (!el || !el.closest('#deckPile')) takeFromDeck(true);
    return;
  }
  const pr = myPrompt();
  if (!pr) return;
  const seat = el && el.closest('#seats .seat');
  const onTable = !!(el && (el.closest('#felt') || el.closest('#meInfo')));
  const card = d.card;
  if (pr.type === 'play') {
    const chk = playCheck(card);
    if (!chk.ok) {
      toast(chk.why || '지금은 낼 수 없는 카드예요', 'err');
    } else if (chk.target) {
      if (seat && seat.classList.contains('can-target')) { chooseTarget(seat.dataset.seat); return; }
      toast('노릴 사람의 판 위에 내려놓으세요', 'err');
    } else if (onTable) {
      sendPlay({ type: 'play', card: card.id });
      return;
    }
    S.pick = null;
    renderHand(); paintTargets(); renderActionBar();
    return;
  }
  // 빗나감! · 뱅! 대응 · 맥주 등은 테이블에 내려놓으면 낸다
  if (onTable) onHandClick(card);
}

document.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.moved) return;
  endDragVisual(d);
  dragJustEnded = true;
  setTimeout(() => { dragJustEnded = false; }, 60);
  dropCard(d, e.clientX, e.clientY);
});
document.addEventListener('pointercancel', () => {
  if (drag && drag.moved) endDragVisual(drag);
  drag = null;
});

/* ═════════════════════════ 다른 사람의 손 (테이블 위 마우스) ═════════════════════════ */

// 자리마다 테이블이 돌아가 보이므로, 보낼 때는 "모두 같은 기준"으로 바꾸고 받을 때 내 시점으로 돌린다
const RING_X = 40;
const RING_Y = 36;
function viewTurn() {
  const g = S.g;
  if (!g) return 0;
  const i = g.players.findIndex((p) => p.pid === S.me);
  return (2 * Math.PI * Math.max(0, i)) / g.players.length;
}
function toShared(xp, yp) {
  const u = (xp - 50) / RING_X;
  const v = (yp - 50) / RING_Y;
  const r = Math.hypot(u, v);
  const a = Math.atan2(v, u) + viewTurn();
  return { x: +(r * Math.cos(a)).toFixed(3), y: +(r * Math.sin(a)).toFixed(3) };
}
function fromShared(x, y) {
  const r = Math.hypot(x, y);
  const a = Math.atan2(y, x) - viewTurn();
  return { xp: 50 + RING_X * r * Math.cos(a), yp: 50 + RING_Y * r * Math.sin(a) };
}

let cursorAt = 0;
let cursorShown = false;
function sendCursor(pos) {
  const now = performance.now();
  if (now - cursorAt < 66) return;
  cursorAt = now;
  cursorShown = true;
  socket.emit('cursor', { ...pos, down: !!(drag && drag.moved) });
}
felt.addEventListener('pointermove', (e) => {
  if (!S.g || S.g.phase !== 'play') return;
  const r = felt.getBoundingClientRect();
  sendCursor(toShared(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100));
});
// 내 손패를 만지작거리면 내 자리 앞에 손이 보인다
$('#meArea').addEventListener('pointermove', (e) => {
  if (!S.g || S.g.phase !== 'play' || !meP()) return;
  const r = $('#meArea').getBoundingClientRect();
  const t = (e.clientX - r.left) / r.width - 0.5;
  sendCursor(toShared(50 + t * 24, 90));
});
function hideMyCursor() {
  if (!cursorShown || (drag && drag.moved)) return;
  cursorShown = false;
  socket.emit('cursor', { x: 0, y: 0, out: true });
}
felt.addEventListener('pointerleave', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest('#meArea')) hideMyCursor(); });
$('#meArea').addEventListener('pointerleave', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest('#felt')) hideMyCursor(); });

const HA = window.HAND_ART;
const HAND_PX = 78;                    // 테이블에 그릴 손 너비 (카드 한 장쯤)
const HAND_K = HAND_PX / HA.W;

/** 그 사람의 어깨 위치: 자리보다 바깥쪽이라 팔이 테이블 가장자리에서 뻗어 들어온다 */
function shoulderOf(pid) {
  const ring = ringOrder();
  const idx = ring.findIndex((p) => p.pid === pid);
  if (idx < 0) return { xp: 50, yp: 130 };
  const ang = Math.PI / 2 + (2 * Math.PI * idx) / ring.length;
  return { xp: 50 + RING_X * 1.55 * Math.cos(ang), yp: 50 + RING_Y * 1.55 * Math.sin(ang) };
}

const handsLayer = document.createElement('div');
handsLayer.className = 'hands-layer';
felt.appendChild(handsLayer);
const hands = new Map();

socket.on('cursor', (c) => {
  if (!S.g || S.g.phase !== 'play' || c.pid === S.me) return;
  let h = hands.get(c.pid);
  if (c.out) { if (h) h.el.classList.add('gone'); return; }
  if (!h) {
    const el = document.createElement('div');
    const hue = hash(c.pid) % 360;
    const uid = `h${hash(c.pid).toString(36)}`;
    el.className = 'phand';
    el.style.setProperty('--hue', String(hue));
    el.innerHTML = `<div class="arm" style="width:${HAND_PX}px;left:${-HA.TIP.x * HAND_K}px;top:${-HA.TIP.y * HAND_K}px;transform-origin:${HA.TIP.x * HAND_K}px ${HA.TIP.y * HAND_K}px">
        <div class="pose open">${HA.hand(`${uid}o`, hue, 'open')}</div>
        <div class="pose grab">${HA.hand(`${uid}g`, hue, 'grab')}</div>
      </div><span></span>`;
    handsLayer.appendChild(el);
    h = { el, arm: el.querySelector('.arm'), t: 0, deg: null };
    hands.set(c.pid, h);
  }
  const at = fromShared(c.x, c.y);
  h.el.style.left = `${at.xp}%`;
  h.el.style.top = `${at.yp}%`;
  // 손가락이 어깨 → 마우스 방향을 향하도록 돌린다 (한 바퀴 휙 돌지 않게 가까운 각도로)
  const sh = shoulderOf(c.pid);
  const fr = felt.getBoundingClientRect();
  let deg = (Math.atan2(((at.yp - sh.yp) * fr.height) / 100, ((at.xp - sh.xp) * fr.width) / 100) * 180) / Math.PI + 90;
  if (h.deg !== null) deg += Math.round((h.deg - deg) / 360) * 360;
  h.deg = deg;
  h.arm.style.transform = `rotate(${deg.toFixed(1)}deg)`;
  h.el.classList.toggle('down', !!c.down);
  h.el.classList.remove('gone');
  h.el.querySelector('span').textContent = pname(c.pid) === '?' ? c.name : pname(c.pid);
  h.t = Date.now();
});
setInterval(() => {
  for (const h of hands.values()) if (Date.now() - h.t > 4000) h.el.classList.add('gone');
}, 1000);
function clearHands() {
  for (const h of hands.values()) h.el.remove();
  hands.clear();
}

/* ═════════════════════════ 턴 배너 ═════════════════════════ */

const STAGE = { start: '차례 시작', draw: '카드 뽑는 중', play: '카드 내는 중', discard: '손패 정리 중', end: '차례 종료' };

function renderBanner() {
  const g = S.g;
  const el = $('#turnBanner');
  if (g.phase === 'setup') { el.innerHTML = `${ic('hat')}<b>캐릭터 고르는 중…</b>`; return; }
  if (g.phase === 'over') { el.innerHTML = `${ic('star')}게임 종료`; return; }
  const t = g.turn;
  if (!t) { el.innerHTML = ''; return; }
  const mine = t.pid === S.me;
  const tp = pl(t.pid);
  const star = tp && tp.role === 'sheriff' ? `<span class="banner-sheriff">${ic('star')}보안관</span>` : '';
  el.innerHTML = `${ic(mine ? 'gun' : 'clock')}<b>${mine ? '내 차례' : `${esc(pname(t.pid))}의 차례`}</b>${star}
    <span style="color:var(--muted)">· ${STAGE[t.stage] || ''} · ${t.no}턴</span>`;
}

/* ═════════════════════════ 전체 그리기 ═════════════════════════ */

function render() {
  const name = screenName();
  showScreen(name);

  if (name === 'home') {
    S.gameId = null;
    S.seenSeq = 0;
    S.chatLog = [];
    renderChat(false);
    return;
  }
  if (name === 'lobby') {
    S.gameId = null;
    S.seenSeq = 0;
    renderLobby();
    return;
  }

  const g = S.g;
  mountChat($('#tab-chat'));
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(S.room.hostPid === S.me && g.phase === 'over');

  const isNew = S.gameId !== g.id;
  if (isNew) {
    S.gameId = g.id;
    S.seenSeq = g.events && g.events.length ? g.events[g.events.length - 1].seq : 0;
    S.pick = null; S.discardSel = []; S.sidSel = []; S.answered = 0;
    S.toastedOver = false;
    S.introShown = false;
    S.skipDrawFly = 0;
    clearHands();
    roleHidden = true;
    specialFor = 0;
  }

  // ── 캐릭터 고르는 중에는 테이블 대신 선택 화면만 보여 준다
  if (g.phase === 'setup') {
    renderBanner();
    renderLog();
    renderChat(false);
    renderPickChar();
    return;
  }
  clearInterval(pickCharTimer);

  const pr = myPrompt();
  if (!pr) { S.pick = null; S.sidSel = []; }
  if (!pr || pr.type !== 'discard') S.discardSel = [];
  if (pr && S.answered !== pr.id) S.answered = 0;

  renderSeats();
  renderMe();
  renderHand();
  renderCenter();
  renderActionBar();
  renderBanner();
  renderLog();
  renderRules();
  renderChat(false);

  if (!S.introShown) {
    S.introShown = true;
    closeModal();
    S.dealPending = true;
    setTimeout(showIntro, 200);
  } else {
    playEvents();
  }

  renderSpecialPrompt();

  if (g.phase === 'over' && !S.toastedOver) {
    S.toastedOver = true;
    setTimeout(playEndingFilm, 900);
  }
}

/* ═════════════════════════ 카드 확대 (마우스 올리기) ═════════════════════════ */

document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.bcard:not(.back)');
  if (card && card.dataset.type && !e.target.closest('.zoom')) {
    const type = card.dataset.type;
    const id = card.dataset.card;
    const all = S.g ? [...(S.g.me ? S.g.me.hand : []), ...S.g.players.flatMap((p) => p.equip), ...(S.g.store || [])] : [];
    const data = all.find((c) => c.id === id) || { id, type, suit: 'S', rank: 14 };
    showZoom(zoomCardHtml(data), card);
    return;
  }
  const face = e.target.closest('[data-char]');
  // 캐릭터 고르기 창에서는 카드가 이미 크게 보이므로 확대 창을 띄우지 않는다
  if (face && face.closest('.pickchar')) return;
  if (face && face.dataset.char) {
    const c = B.CHAR[face.dataset.char];
    if (!c) return;
    showZoom(`<div class="zoom-card">${chCardHtml(c.id)}</div>`, face);
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.bcard') || e.target.closest('[data-char]')) hideZoom();
});
window.addEventListener('scroll', hideZoom, true);
window.addEventListener('resize', () => { hideZoom(); if (S.g) renderSeats(); });

/* ═════════════════════════ 보드게임 목록으로 돌아가기 ═════════════════════════ */

// 허브는 같은 사이트의 루트에 있다
$('#backHub').hidden = false;
$('#backHub').addEventListener('click', (e) => {
  if (S.g && S.g.phase === 'play' && meP() && meP().alive) {
    if (!confirm('게임이 진행 중입니다. 목록으로 나가시겠어요?\n(내 자리는 AI가 대신 맡습니다)')) {
      e.preventDefault();
      return;
    }
  }
  if (S.room) socket.emit('room:leave');
});

/* ═════════════════════════ 시작 ═════════════════════════ */

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modal.hidden && !modalResolve) closeModal();
    else if (S.pick) { S.pick = null; renderHand(); paintTargets(); renderActionBar(); }
  }
});
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });

render();
