import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { faceChip } from '/common/avatar.js';
// 바람섬 개척기 - 브라우저 쪽 전체 화면과 조작
const I = window.ISLE;
const SFX = window.SFX;
const { RES } = I;
// 지금 보고 있는 판의 맵 좌표 (게임이 바뀌면 useMap 으로 갈아 끼운다)
let VERTS = I.VERTS;
let EDGES = I.EDGES;
let HEXES = I.HEXES;
let MAP = I.map('random');
function useMap(id) {
  if (MAP.id === id) return;
  MAP = I.map(id);
  ({ VERTS, EDGES, HEXES } = MAP);
  const xs = VERTS.map((v) => v.x);
  const ys = VERTS.map((v) => v.y);
  const pad = 70;
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  document.getElementById('board').setAttribute('viewBox', `${Math.round(x0)} ${Math.round(y0)} ${Math.round(Math.max(...xs) - x0 + pad)} ${Math.round(Math.max(...ys) - y0 + pad)}`);
}

/* ═════════════════════════ 작은 도구 ═════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n) => `<i class="ic ic-${n}"></i>`;
const ri = (r) => `<i class="ri ri-${r}"></i>`;
const f1 = (n) => Number(n.toFixed(1));
const resName = (r) => I.RES_INFO[r].name;

function token() {
  let t = null;
  try { t = localStorage.getItem('isle.token'); } catch (_) { /* 무시 */ }
  if (!t || !/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    try { localStorage.setItem('isle.token', t); } catch (_) { /* 무시 */ }
  }
  return t;
}
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };

/** 사람 말 모양 (색깔 표시) */
function pawn(color, size = 22) {
  const c = I.COLOR[color] || { fill: '#999', dark: '#333' };
  return `<span class="pawn" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24"><path d="M12 2.5a4.2 4.2 0 0 1 2.4 7.6c2.2 1.2 3.4 3.4 3.6 6.2l3 1.6V21H3v-3.1l3-1.6c.2-2.8 1.4-5 3.6-6.2A4.2 4.2 0 0 1 12 2.5Z" fill="${c.fill}" stroke="${c.dark}" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 5.5a3 3 0 0 1 3-1.2" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none" stroke-linecap="round"/></svg></span>`;
}

/* ═════════════════════════ 상태 ═════════════════════════ */

const S = {
  me: null, room: null, g: null, gameId: null, seenSeq: 0,
  mode: null,          // null | 'road' | 'settlement' | 'city'
  tab: 'log', unread: 0, chatLog: [],
  introShown: false, overShown: false, busy: false,
  links: [],
};

/* ═════════════════════════ 소켓 ═════════════════════════ */

// 서버가 다시 켜져도 하던 게임이 이어지게: 서버가 맡긴 방 사본을 접속할 때 같이 보낸다
const keeper = roomKeeper('isle');
const socket = io('/isle', { auth: (cb) => cb({ token: token(), save: keeper.get() }), transports: ['websocket', 'polling'] });
keeper.attach(socket);
const conn = $('#conn');
let connTimer = null;
const setConn = (html) => { conn.hidden = !html; if (html) conn.innerHTML = html; };
socket.on('connect', () => { clearTimeout(connTimer); setConn(''); });
socket.on('disconnect', () => { clearTimeout(connTimer); connTimer = setTimeout(() => setConn('서버와 연결이 끊겼습니다. <b>다시 연결하는 중…</b>'), 3000); });
socket.on('replaced', () => setConn('다른 창에서 접속해서 이 창의 연결이 끊겼습니다. 새로고침하면 이 창으로 돌아옵니다.'));
socket.on('hello', ({ pid }) => { S.me = pid; });
socket.on('toast', (t) => toast(t, 'gold'));
socket.on('chat:history', (list) => { S.chatLog = list || []; renderChat(); });
socket.on('chat', (m) => {
  S.chatLog.push(m);
  if (S.chatLog.length > 150) S.chatLog.shift();
  renderChat();
  if (!m.system && m.pid !== S.me) {
    SFX.chat();
    if (screenName() === 'game' && S.tab !== 'chat') { S.unread++; renderBadge(); }
  }
});
socket.on('room', (room) => {
  S.room = room;
  S.g = room && room.game;
  render();
});

const emit = (ev, data) => new Promise((res) => socket.emit(ev, data, (r) => res(r || { ok: true })));
async function call(ev, data) {
  const r = await emit(ev, data);
  if (!r.ok && r.error) toast(r.error, 'err');
  return r;
}
async function act(a) {
  const r = await emit('game:act', a);
  if (!r.ok && r.error) { toast(r.error, 'err'); SFX.alarm(); }
  return r;
}

/* ═════════════════════════ 화면 · 알림 ═════════════════════════ */

const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');
function showScreen(n) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== n;
  document.body.dataset.screen = n;
}
function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = text;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

/* ═════════════════════════ 카드 ═════════════════════════ */

function resCard(r, cls = '') {
  return `<div class="card r-${r} ${cls}" data-res="${r}">
    <div class="c-art"><img src="assets/res/${r}.svg" alt=""></div>
    <div class="c-name">${resName(r)}</div>
    <div class="c-en">${I.RES_INFO[r].en}</div>
  </div>`;
}
function devCard(d, cls = '') {
  const info = I.DEV[d.type];
  return `<div class="card dev ${cls}" data-dev="${d.id || ''}" data-type="${d.type}">
    <div class="c-art"><img src="assets/dev/${d.type}.svg" alt=""></div>
    <div class="c-name">${info.name}</div>
    <div class="c-en">${info.en}</div>
    <div class="c-desc">${esc(info.desc)}</div>
  </div>`;
}
const backCard = (cls = '') => `<div class="card back ${cls}"></div>`;
const costHtml = (cost) => RES.filter((r) => cost[r]).map((r) => Array(cost[r]).fill(ri(r)).join('')).join('');

function costCardHtml() {
  const row = (kind, icon, note) => `<div class="cost-row"><b>${ic(icon)}${I.BUILD_NAME[kind]}</b>${costHtml(I.COST[kind])}<em>${note}</em></div>`;
  return `<h4>건설 비용</h4>
    ${row('road', 'road', '0점')}
    ${row('settlement', 'house', '1점')}
    ${row('city', 'city', '2점')}
    ${row('dev', 'cards', '?')}`;
}
$('#costCard').innerHTML = costCardHtml();
$('#lobbyCost').innerHTML = costCardHtml();

/* ═════════════════════════ 시작 화면 ═════════════════════════ */

const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('isle.name');
// 로그인했으면 프로필 닉네임으로 채운다 (이름 안 쳐도 됨) · 이모트 버튼
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []) });
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();

function needName() {
  const n = nameInput.value.trim();
  if (!n) { toast('닉네임을 입력하세요', 'err'); nameInput.focus(); return null; }
  remember('isle.name', n);
  return n;
}
$('#createBtn').addEventListener('click', () => { const n = needName(); if (n) { SFX.unlock(); SFX.click(); call('room:create', { name: n }); } });
async function doJoin() {
  const n = needName();
  if (!n) return;
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) { toast('초대 코드 4글자를 입력하세요', 'err'); return; }
  SFX.unlock(); SFX.click();
  call('room:join', { name: n, code });
}
$('#joinBtn').addEventListener('click', doJoin);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });

$$('[data-leave]').forEach((b) => b.addEventListener('click', () => {
  if (S.g && S.g.phase !== 'over' && !confirm('게임 중입니다. 정말 나가시겠어요?\n(자리는 AI가 대신 맡습니다)')) return;
  socket.emit('room:leave');
}));
$('#backHub').addEventListener('click', (e) => {
  if (S.g && S.g.phase !== 'over' && myPlayer() && !confirm('게임 중입니다. 목록으로 나가시겠어요?\n(자리는 AI가 대신 맡습니다)')) { e.preventDefault(); return; }
  if (S.room) socket.emit('room:leave');
});
function paintMute() { $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; }); }
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => { SFX.setMuted(!SFX.muted); paintMute(); if (!SFX.muted) { SFX.unlock(); SFX.click(); } }));
paintMute();
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/isle/?room=${S.room.code}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다', 'gold'); } catch (_) { prompt('이 주소를 친구에게 보내세요', url); }
});

/* ═════════════════════════ 채팅 ═════════════════════════ */

const chatHosts = [];
function mountChat(host) {
  if (host.dataset.chat) return;
  host.dataset.chat = '1';
  host.appendChild($('#chatTpl').content.cloneNode(true));
  const form = $('.chat-form', host);
  const input = $('input', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (t) socket.emit('chat', t);
    input.value = '';
  });
  chatHosts.push(host);
}
function renderChat() {
  for (const h of chatHosts) {
    const log = $('.chat-log', h);
    log.innerHTML = S.chatLog.map((m) => (m.system ? `<div class="cm sys">${esc(m.text)}</div>`
      : `<div class="cm"><div class="cm-name">${esc(m.name)}</div><div class="cm-text">${esc(m.text)}</div></div>`)).join('');
    log.scrollTop = log.scrollHeight;
  }
}
function renderBadge() {
  const b = $('#chatBadge');
  b.hidden = !S.unread;
  b.textContent = S.unread > 9 ? '9+' : String(S.unread);
}
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  S.tab = b.dataset.tab;
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $('#tab-log').hidden = S.tab !== 'log';
  $('#tab-chat').hidden = S.tab !== 'chat';
  if (S.tab === 'chat') { S.unread = 0; renderBadge(); renderChat(); }
});

/* ═════════════════════════ 대기실 ═════════════════════════ */

/** 맵 모양 미리보기 (작은 육각 그림) */
const MAP_TINT = ['#3f7a34', '#b8583a', '#8cbf4a', '#e0b840', '#8a8a92', '#d8c48a'];
function mapThumb(id) {
  const M = I.map(id);
  const xs = M.HEXES.map((h) => h.x);
  const ys = M.HEXES.map((h) => h.y);
  const x0 = Math.min(...xs) - R;
  const y0 = Math.min(...ys) - R;
  const w = Math.max(...xs) + R - x0;
  const h = Math.max(...ys) + R - y0;
  const poly = (hx) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 90); return `${(hx.x + R * 0.94 * Math.cos(a)).toFixed(0)},${(hx.y + R * 0.94 * Math.sin(a)).toFixed(0)}`; }).join(' ');
  return `<svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}">${M.HEXES.map((hx) => `<polygon points="${poly(hx)}" fill="${hx.lake ? '#4a9ad0' : MAP_TINT[(hx.id * 7 + hx.col) % 6]}" stroke="#1f3a20" stroke-width="6"/>`).join('')}</svg>`;
}
function renderMaps() {
  const host = S.room.hostPid === S.me;
  const cur = (S.room.config && S.room.config.map) || 'random';
  const n = S.room.members.filter((m) => m.seated).length;
  $('#mapPick').innerHTML = `<div class="mp-head">맵 <small>${host ? '방장이 고를 수 있어요' : '방장이 고릅니다'}</small></div>
    <div class="mp-row">${I.MAP_IDS.map((id) => {
    const M = I.map(id);
    const tooMany = n > M.maxPlayers;
    return `<button class="mp ${id === cur ? 'on' : ''} ${tooMany ? 'warn' : ''}" data-map="${id}" ${host ? '' : 'disabled'} title="${esc(M.desc)}">
      <div class="mp-art">${mapThumb(id)}</div><b>${esc(M.name)}</b><small>${esc(M.desc)} · ${M.minPlayers}~${M.maxPlayers}명</small></button>`;
  }).join('')}</div>`;
}

function renderLobby() {
  const room = S.room;
  const host = room.hostPid === S.me;
  $('#lobbyCode').textContent = room.code;
  renderMaps();
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  const slots = [];
  const maxSeats = I.map((room.config && room.config.map) || 'random').maxPlayers;
  for (let i = 0; i < Math.max(maxSeats, seated.length); i++) {
    const m = seated[i];
    if (!m) { slots.push('<div class="slot empty">빈 자리</div>'); continue; }
    const tags = [];
    if (m.pid === room.hostPid) tags.push(`<span class="tag">${ic('crown')}방장</span>`);
    if (m.isBot) tags.push(`<span class="tag">${ic('bot')}AI</span>`);
    if (m.pid === S.me) tags.push('<span class="tag">나</span>');
    if (!m.online && !m.isBot) tags.push('<span class="tag red">접속 끊김</span>');
    slots.push(`<div class="slot">
      ${host && m.pid !== S.me ? `<button class="icon-btn kick" data-kick="${m.pid}" title="내보내기">${ic('x')}</button>` : ''}
      <div class="slot-faces">${faceChip(m, 60)}${pawn(I.COLORS[i].id, 28)}</div>
      <div class="slot-name">${esc(m.name)}</div>
      <div class="slot-tags">${tags.join('')}</div>
    </div>`);
  }
  $('#seatGrid').innerHTML = slots.join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').innerHTML = specs.length ? `${ic('eye')}관전 ${specs.map((m) => `<span class="chip">${esc(m.name)}</span>`).join('')}` : '';
  const me = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').innerHTML = me && me.seated ? `${ic('eye')}관전으로 전환` : `${ic('users')}자리에 앉기`;
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  $('#startBtn').disabled = seated.length < I.MIN_PLAYERS;
  $('#startHint').textContent = host
    ? (seated.length < I.MIN_PLAYERS ? `${I.MIN_PLAYERS}명부터 시작할 수 있어요 (지금 ${seated.length}명)` : `${seated.length}명으로 시작합니다`)
    : `방장이 시작하기를 기다리는 중… (${seated.length}명)`;
}
$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#mapPick').addEventListener('click', (e) => {
  const b = e.target.closest('[data-map]');
  if (b && !b.disabled) { SFX.click(); call('room:config', { map: b.dataset.map }); }
});
$('#addBotBtn').addEventListener('click', () => { SFX.click(); call('room:addBot'); });
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.bell(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ═════════════════════════ 게임 도우미 ═════════════════════════ */

const pl = (pid) => (S.g ? S.g.players.find((p) => p.pid === pid) : null);
const myPlayer = () => pl(S.me);
const pname = (pid) => (pl(pid) ? pl(pid).name : '?');
const colorOf = (pid) => (pl(pid) ? I.COLOR[pl(pid).color] : { fill: '#888', dark: '#333' });
const myNeed = () => (S.g ? (S.g.needs || []).find((n) => n.pid === S.me) : null);
const curPid = () => (S.g.phase === 'setup' ? S.g.setup && S.g.setup.pid : S.g.turn && S.g.turn.pid);

// 규칙 판정 (서버와 같은 방식, 화면 표시용)
const B = () => S.g.board;
function vertexFree(v) {
  const b = B();
  return !b.buildings[v] && !VERTS[v].adj.some((u) => b.buildings[u]);
}
function canSettle(v, setup) {
  if (!vertexFree(v)) return false;
  return setup || VERTS[v].edges.some((e) => B().roads[e] === S.me);
}
function canRoad(e, near = null) {
  const b = B();
  if (b.roads[e] != null) return false;
  const ends = [EDGES[e].a, EDGES[e].b];
  if (near != null) return ends.includes(near);
  return ends.some((v) => {
    const bd = b.buildings[v];
    if (bd) return bd.pid === S.me;
    return VERTS[v].edges.some((o) => o !== e && b.roads[o] === S.me);
  });
}
const canCity = (v) => { const bd = B().buildings[v]; return !!(bd && bd.pid === S.me && bd.type === 'settlement'); };
const afford = (kind) => { const me = S.g.me; return me && I.canPay(me.res, I.COST[kind]); };

/** 지금 보드에서 고를 수 있는 자리들 */
function boardTargets() {
  const need = myNeed();
  if (!need) return null;
  if (need.what === 'setupSettlement') return { kind: 'v', list: VERTS.map((v) => v.id).filter((v) => canSettle(v, true)), act: (v) => ({ type: 'settle', v }) };
  if (need.what === 'setupRoad') return { kind: 'e', list: EDGES.map((e) => e.id).filter((e) => canRoad(e, S.g.setup.last)), act: (e) => ({ type: 'road', e }) };
  if (need.what === 'robber') return { kind: 'h', list: HEXES.map((h) => h.id).filter((h) => h !== B().robber), act: (hex) => ({ type: 'robber', hex }) };
  if (need.what === 'roads') return { kind: 'e', list: EDGES.map((e) => e.id).filter((e) => canRoad(e)), act: (e) => ({ type: 'road', e }) };
  if (need.what === 'main' && S.mode) {
    if (S.mode === 'road') return { kind: 'e', list: EDGES.map((e) => e.id).filter((e) => canRoad(e)), act: (at) => ({ type: 'build', kind: 'road', at }) };
    if (S.mode === 'settlement') return { kind: 'v', list: VERTS.map((v) => v.id).filter((v) => canSettle(v, false)), act: (at) => ({ type: 'build', kind: 'settlement', at }) };
    if (S.mode === 'city') return { kind: 'v', list: VERTS.map((v) => v.id).filter(canCity), act: (at) => ({ type: 'build', kind: 'city', at }) };
  }
  return null;
}

/* ═════════════════════════ 보드 그리기 ═════════════════════════ */

const R = I.R;
/** 호수 칸: 물결 치는 푸른 물 + 갈대 */
function lakeSvg(h) {
  const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 90); return `${(h.x + R * 0.98 * Math.cos(a)).toFixed(1)},${(h.y + R * 0.98 * Math.sin(a)).toFixed(1)}`; }).join(' ');
  let s = `<polygon points="${pts}" fill="#3a86b8" stroke="#1f5a86" stroke-width="3"/>`;
  s += `<ellipse cx="${h.x}" cy="${h.y}" rx="${R * 0.62}" ry="${R * 0.5}" fill="#5aa8d8" opacity=".6"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M${h.x - 26 + (i % 2) * 10} ${h.y - 18 + i * 12}q8 -5 16 0t16 0" stroke="#d8f0ff" stroke-width="2" fill="none" opacity=".75"/>`;
  s += `<path d="M${h.x + 26} ${h.y + 30}v-18M${h.x + 30} ${h.y + 30}v-24M${h.x + 34} ${h.y + 30}v-14" stroke="#4a6a2a" stroke-width="2.4" stroke-linecap="round"/>`;
  return s;
}
const HW = R * I.SQ3;          // 육각 너비
const hexPts = (h, k = 1) => Array.from({ length: 6 }, (_, i) => { const c = I.corner({ x: 0, y: 0 }, i); return `${f1(h.x + c.x * k)},${f1(h.y + c.y * k)}`; }).join(' ');

function settlementSvg(x, y, c, cls = '') {
  return `<g class="${cls}" transform="translate(${f1(x)} ${f1(y)})">
    <ellipse cx="2" cy="10" rx="12" ry="3.5" fill="#000" opacity=".35"/>
    <path d="M-9 9V-2L0 -11L9 -2V9Z" fill="${c.fill}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M0 -11L9 -2V9H3V-3Z" fill="#000" opacity=".18"/>
    <path d="M-7 -1L0 -8" stroke="#fff" stroke-width="1.4" opacity=".6"/>
  </g>`;
}
function citySvg(x, y, c, cls = '') {
  return `<g class="${cls}" transform="translate(${f1(x)} ${f1(y)})">
    <ellipse cx="2" cy="11" rx="17" ry="4" fill="#000" opacity=".35"/>
    <path d="M-14 10V-3L-7 -10L0 -3V-1H14V10Z" fill="${c.fill}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M0 -1H14V10H0Z" fill="#000" opacity=".16"/>
    <path d="M-9 3h4v7h-4Z" fill="${c.dark}" opacity=".6"/>
    <path d="M-12 -3L-7 -8" stroke="#fff" stroke-width="1.4" opacity=".6"/>
  </g>`;
}
function roadSvg(e, c, cls = '') {
  const A = VERTS[EDGES[e].a];
  const Bv = VERTS[EDGES[e].b];
  const x1 = A.x + (Bv.x - A.x) * 0.2;
  const y1 = A.y + (Bv.y - A.y) * 0.2;
  const x2 = A.x + (Bv.x - A.x) * 0.8;
  const y2 = A.y + (Bv.y - A.y) * 0.8;
  return `<g class="${cls}">
    <line x1="${f1(x1 + 1.5)}" y1="${f1(y1 + 2.5)}" x2="${f1(x2 + 1.5)}" y2="${f1(y2 + 2.5)}" stroke="#000" stroke-width="9" stroke-linecap="round" opacity=".3"/>
    <line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c.dark}" stroke-width="9" stroke-linecap="round"/>
    <line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c.fill}" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}
function robberSvg(x, y, cls = '') {
  return `<g class="${cls}" transform="translate(${f1(x - 20)} ${f1(y + 4)})">
    <ellipse cx="2" cy="16" rx="12" ry="3.5" fill="#000" opacity=".4"/>
    <path d="M-9 15C-10 4 -7 -6 -4 -10C-8 -13 -8 -22 0 -24C8 -22 8 -13 4 -10C7 -6 10 4 9 15Z" fill="#2a2420" stroke="#0a0806" stroke-width="1.6"/>
    <path d="M-2 -20C-4 -17 -4 -14 -2 -12" stroke="#8a8078" stroke-width="1.4" fill="none" opacity=".8"/>
  </g>`;
}
function tokenSvg(h, n, hot) {
  const pips = I.pips(n);
  const dots = Array.from({ length: pips }, (_, i) => `<circle cx="${f1((i - (pips - 1) / 2) * 3.4)}" cy="9" r="1.2" fill="${hot ? '#b8261c' : '#1c120a'}"/>`).join('');
  return `<g transform="translate(${f1(h.x)} ${f1(h.y)})">
    <circle r="17.5" fill="#000" opacity=".3" transform="translate(1.5 2.5)"/>
    <circle r="17" fill="#f3e6c4" stroke="#2a1a0c" stroke-width="2"/>
    <circle r="14" fill="none" stroke="#c8aa7a" stroke-width="1"/>
    <text y="4" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${n >= 10 ? 15 : 17}" fill="${hot ? '#b8261c' : '#1c120a'}">${n}</text>
    ${dots}
  </g>`;
}
function harborSvg(hb) {
  const e = EDGES[hb.edge];
  const len = Math.hypot(e.x, e.y);
  const ux = e.x / len;
  const uy = e.y / len;
  const px = e.x + ux * 38;
  const py = e.y + uy * 38;
  let s = '';
  for (const v of [e.a, e.b]) {
    const V = VERTS[v];
    s += `<line x1="${f1(V.x)}" y1="${f1(V.y)}" x2="${f1(px + (V.x - e.x) * 0.25)}" y2="${f1(py + (V.y - e.y) * 0.25)}" stroke="#6a4a2a" stroke-width="5" stroke-linecap="round"/>`;
    s += `<line x1="${f1(V.x)}" y1="${f1(V.y)}" x2="${f1(px + (V.x - e.x) * 0.25)}" y2="${f1(py + (V.y - e.y) * 0.25)}" stroke="#b88a52" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 2"/>`;
  }
  const label = hb.type === 'any' ? '<text y="5" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="13" fill="#1c120a">3:1</text>'
    : `<image href="assets/icon/${hb.type}.svg" x="-10" y="-13" width="20" height="20"/><text y="15" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="10" fill="#1c120a">2:1</text>`;
  s += `<g transform="translate(${f1(px)} ${f1(py)})" class="harbor" data-harbor="${hb.type}">
    <circle r="18" fill="#000" opacity=".25" transform="translate(1.5 2)"/>
    <circle r="17" fill="#f3e6c4" stroke="#1c120a" stroke-width="2"/>
    ${label}
  </g>`;
  return s;
}

let lastBoardKey = '';
function renderBoard(fresh = {}) {
  const g = S.g;
  const b = g.board;
  const t = boardTargets();
  let s = `<image href="assets/sea.svg" x="-1600" y="-1000" width="3200" height="2000" preserveAspectRatio="xMidYMid slice"/>`;
  // 모래 해안
  s += `<g opacity=".95">${HEXES.map((h) => `<polygon points="${hexPts(h, 1.2)}" fill="#e6cf98"/>`).join('')}</g>`;
  s += `<g opacity=".5">${HEXES.map((h) => `<polygon points="${hexPts(h, 1.28)}" fill="#f4e6c0"/>`).join('')}</g>`;
  s += b.harbors.map(harborSvg).join('');
  // 타일
  s += HEXES.map((h) => {
    const tile = b.hexes[h.id];
    const v = (h.id % 3) + 1;
    if (tile.terrain === 'lake') return lakeSvg(h);
    return `<image href="assets/tile/${tile.terrain}-${v}.svg" x="${f1(h.x - HW / 2)}" y="${f1(h.y - R)}" width="${f1(HW)}" height="${2 * R}" class="${fresh.hexes && fresh.hexes.includes(h.id) ? 'hex-hot' : ''}"/>`;
  }).join('');
  s += HEXES.map((h) => (b.hexes[h.id].number ? tokenSvg(h, b.hexes[h.id].number, [6, 8].includes(b.hexes[h.id].number)) : '')).join('');
  // 도로 · 건물
  for (const [e, pid] of Object.entries(b.roads)) s += roadSvg(Number(e), colorOf(pid), fresh.road === Number(e) ? 'piece-new' : '');
  for (const [v, bd] of Object.entries(b.buildings)) {
    const V = VERTS[v];
    const c = colorOf(bd.pid);
    const cls = fresh.vertex === Number(v) ? 'piece-new' : '';
    s += bd.type === 'city' ? citySvg(V.x, V.y, c, cls) : settlementSvg(V.x, V.y, c, cls);
  }
  const rh = HEXES[b.robber];
  s += robberSvg(rh.x, rh.y, fresh.robber ? 'robber-move' : '');
  // 고를 수 있는 자리
  if (t) {
    if (t.kind === 'h') s += t.list.map((h) => `<polygon class="spot spot-h" data-h="${h}" points="${hexPts(HEXES[h], 0.92)}"/>`).join('');
    if (t.kind === 'e') s += t.list.map((e) => { const A = VERTS[EDGES[e].a]; const Bv = VERTS[EDGES[e].b]; return `<line class="spot spot-e" data-e="${e}" x1="${f1(A.x + (Bv.x - A.x) * 0.2)}" y1="${f1(A.y + (Bv.y - A.y) * 0.2)}" x2="${f1(A.x + (Bv.x - A.x) * 0.8)}" y2="${f1(A.y + (Bv.y - A.y) * 0.8)}"/>`; }).join('');
    if (t.kind === 'v') s += t.list.map((v) => `<circle class="spot spot-v" data-v="${v}" cx="${f1(VERTS[v].x)}" cy="${f1(VERTS[v].y)}" r="9"/>`).join('');
  }
  $('#board').innerHTML = s;
  lastBoardKey = JSON.stringify([b.roads, b.buildings, b.robber]);
}

$('#board').addEventListener('click', (e) => {
  const spot = e.target.closest('.spot');
  if (!spot) return;
  const t = boardTargets();
  if (!t) return;
  const id = Number(spot.dataset.v ?? spot.dataset.e ?? spot.dataset.h);
  SFX.click();
  act(t.act(id)).then((r) => { if (r.ok && S.mode) S.mode = null; });
});

/* ═════════════════════════ 플레이어 판 · 은행 ═════════════════════════ */

function renderPlayers() {
  const g = S.g;
  const cur = curPid();
  const needs = g.needs || [];
  $('#players').innerHTML = g.players.map((p) => {
    const c = I.COLOR[p.color];
    const badges = [];
    if (g.awards.road && g.awards.road.pid === p.pid) badges.push(`<span class="award">${ic('road')}최장 교역로 +2</span>`);
    if (g.awards.army && g.awards.army.pid === p.pid) badges.push(`<span class="award">${ic('knight')}최강 기사단 +2</span>`);
    const thinking = needs.some((n) => n.pid === p.pid) && p.pid !== S.me;
    return `<div class="pcard ${p.pid === cur ? 'cur' : ''}" data-pid="${p.pid}" style="--c:${c.fill}">
      <div class="pc-top">${faceChip((S.room && S.room.members.find((x) => x.pid === p.pid)) || p, 30)}${pawn(p.color)}<b>${esc(p.name)}${p.pid === S.me ? ' (나)' : ''}</b>${p.isBot ? ic('bot') : ''}
        <span class="pc-vp">${ic('star')}${p.vp}</span></div>
      <div class="pc-stats">
        <span class="stat ${p.cards > 7 ? 'warn' : ''}" title="자원 카드">${ic('cards')}${p.cards}</span>
        <span class="stat" title="발전 카드">${ic('scroll')}${p.devCount}</span>
        <span class="stat" title="낸 기사">${ic('knight')}${p.knights}</span>
        <span class="stat" title="가장 긴 도로">${ic('road')}${p.road}</span>
        ${p.online ? '' : `<span class="stat off">${ic('clock')}자리비움</span>`}
      </div>
      ${badges.length ? `<div class="pc-awards">${badges.join('')}</div>` : ''}
      ${thinking ? '<div class="pc-think">생각하는 중…</div>' : ''}
    </div>`;
  }).join('');
  $('#bankBox').innerHTML = `<h4>은행 · 발전 카드 ${g.devLeft}장 남음</h4>
    <div class="bank-row">${RES.map((r) => `<span>${ri(r)}${g.bank[r]}</span>`).join('')}</div>`;
}

/* ═════════════════════════ 내 손 ═════════════════════════ */

function renderHand() {
  const g = S.g;
  const me = g.me;
  if (!me) {
    $('#hand').innerHTML = '<div class="hand-empty">관전 중입니다</div>';
    $('#devs').innerHTML = '';
    return;
  }
  const stacks = RES.filter((r) => me.res[r] > 0).map((r) => {
    const n = me.res[r];
    const layers = Math.min(n, 4);
    return `<div class="stack" title="${resName(r)} ${n}장">
      ${Array.from({ length: layers }, (_, i) => resCard(r).replace('class="card', `style="transform:translate(${i * 4}px, ${-i * 3}px) rotate(${(i - layers / 2) * 2}deg)" class="card`)).join('')}
      <span class="cnt">${n}</span>
    </div>`;
  });
  $('#hand').innerHTML = stacks.length ? stacks.join('') : '<div class="hand-empty">자원 카드가 없습니다</div>';
  const need = myNeed();
  const canPlay = need && ['main', 'roll'].includes(need.what) && !g.turn.devPlayed;
  $('#devs').innerHTML = me.dev.map((d) => {
    const playable = canPlay && d.type !== 'vp' && !d.fresh && (need.what === 'main' || d.type === 'knight');
    return devCard(d, `${playable ? 'playable' : ''} ${d.fresh ? 'fresh' : ''}`);
  }).join('');
}

$('#devs').addEventListener('click', (e) => {
  const c = e.target.closest('.card.playable');
  if (!c) return;
  SFX.click();
  playDev(c.dataset.dev, c.dataset.type);
});

async function playDev(id, type) {
  if (type === 'plenty') {
    const picks = await pickRes('풍년', '은행에서 가져올 자원 2장을 고르세요 (같은 자원 2장도 돼요).', 2);
    if (picks) act({ type: 'playDev', card: id, res: picks[0], res2: picks[1] });
    return;
  }
  if (type === 'monopoly') {
    const picks = await pickRes('독점', '다른 모든 사람에게서 가져올 자원을 고르세요.', 1);
    if (picks) act({ type: 'playDev', card: id, res: picks[0] });
    return;
  }
  const name = I.DEV[type].name;
  if (!confirm(`${name} 카드를 낼까요?\n${I.DEV[type].desc}`)) return;
  act({ type: 'playDev', card: id });
}

/* ═════════════════════════ 행동 줄 ═════════════════════════ */

let clockTimer = null;
function startClock(ms) {
  const box = $('#clock');
  if (!box) return;
  const end = Date.now() + ms;
  const total = ms;
  let last = -1;
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    $('.clock-ring', box).style.strokeDashoffset = String(113 * (1 - left / total));
    const s = Math.ceil(left / 1000);
    $('.clock-t', box).textContent = String(s);
    box.classList.toggle('urgent', left < 8000);
    if (left < 6000 && s !== last && s > 0) { last = s; SFX.tick(); }
    if (!left) clearInterval(clockTimer);
  };
  tick();
  clockTimer = setInterval(tick, 250);
}

const STAGE_NAME = { roll: '주사위 굴리기', discard: '카드 버리기', robber: '도적 옮기기', steal: '빼앗기', roads: '도로 건설', main: '건설 · 교환' };

function renderActionBar() {
  const g = S.g;
  const bar = $('#actionBar');
  clearInterval(clockTimer);
  const need = myNeed();
  const clock = need && g.deadlineIn != null
    ? '<div class="clock" id="clock"><svg viewBox="0 0 40 40"><circle class="clock-bg" cx="20" cy="20" r="18"/><circle class="clock-ring" cx="20" cy="20" r="18"/></svg><div class="clock-t"></div></div>' : '';
  let text = '';
  const btns = [];
  const btn = (a, label, cls = '', dis = false) => `<button class="btn ${cls}" data-a="${a}" ${dis ? 'disabled' : ''}>${label}</button>`;

  if (g.phase === 'over') {
    text = `${ic('cup')}게임이 끝났습니다.`;
    btns.push(btn('result', '결과 다시 보기', 'btn-gold'));
  } else if (!need) {
    const cp = curPid();
    const stage = g.phase === 'setup' ? '첫 마을 · 도로 놓는 중' : STAGE_NAME[g.turn.stage] || '';
    text = `${pawn(pl(cp) ? pl(cp).color : 'white')}<b>${esc(pname(cp))}</b>님 차례 · ${stage}`;
    if (g.turn && g.turn.stage === 'discard' && myPlayer()) text += ' (카드가 많은 사람은 절반을 버리는 중)';
  } else {
    switch (need.what) {
      case 'setupSettlement':
        text = `${ic('house')}<span>${g.setup.round === 1 ? '첫' : '두 번째'} <b>마을</b>을 놓을 곳을 보드에서 고르세요.${g.setup.round === 2 ? ' 이 마을에 닿은 땅의 자원을 1장씩 받아요.' : ''}</span>`;
        break;
      case 'setupRoad':
        text = `${ic('road')}<span>방금 지은 마을에 붙여 <b>도로</b>를 놓으세요.</span>`;
        break;
      case 'roll':
        text = `${ic('dice')}<span>내 차례! <b>주사위</b>를 굴리세요.${g.me.dev.some((d) => d.type === 'knight' && !d.fresh) ? ' 굴리기 전에 기사 카드를 낼 수도 있어요.' : ''}</span>`;
        btns.push(btn('roll', `${ic('dice')}주사위 굴리기`, 'btn-red btn-lg'));
        break;
      case 'discard':
        text = `${ic('cards')}<span>7이 나왔어요! 카드 <b>${g.turn.discard[S.me]}장</b>을 버려야 해요.</span>`;
        btns.push(btn('discard', '버릴 카드 고르기', 'btn-red'));
        break;
      case 'robber':
        text = `${ic('robber')}<span><b>도적</b>을 옮길 땅을 보드에서 고르세요. 그 땅은 생산이 멈춰요.</span>`;
        break;
      case 'steal':
        text = `${ic('robber')}<span>누구에게서 자원 1장을 빼앗을까요?</span>`;
        btns.push(btn('steal', '빼앗을 사람 고르기', 'btn-red'));
        break;
      case 'roads':
        text = `${ic('road')}<span>공짜 도로 <b>${g.turn.freeRoads}개</b>를 보드에 놓으세요.</span>`;
        btns.push(btn('endRoads', '그만 놓기'));
        break;
      case 'main': {
        const m = S.mode;
        text = m
          ? `${ic(m === 'road' ? 'road' : m === 'city' ? 'city' : 'house')}<span><b>${I.BUILD_NAME[m]}</b> 지을 곳을 보드에서 고르세요.</span>`
          : `${ic('star')}<span>짓고, 교환하고, 발전 카드를 쓰세요. 다 했으면 <b>턴 마치기</b>.</span>`;
        const me = myPlayer();
        const build = (kind, icon) => {
          const ok = afford(kind) && (kind === 'dev' ? g.devLeft > 0 : me.left[kind] > 0);
          return btn(`build:${kind}`, `${ic(icon)}${I.BUILD_NAME[kind]}<span class="cost">${costHtml(I.COST[kind])}</span>`, S.mode === kind ? 'btn-gold' : '', !ok);
        };
        btns.push(build('road', 'road'), build('settlement', 'house'), build('city', 'city'), build('dev', 'cards'));
        btns.push(btn('trade', `${ic('trade')}교환`, 'btn-sea'));
        if (m) btns.push(btn('cancel', '취소'));
        btns.push(btn('end', `${ic('next')}턴 마치기`, 'btn-red'));
        break;
      }
      default:
        break;
    }
  }
  bar.innerHTML = `<div class="ab-text">${text}</div><div class="ab-btns">${btns.join('')}</div>${clock}`;
  if (clock) startClock(g.deadlineIn);
}

$('#actionBar').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a;
  SFX.click();
  if (a === 'roll') return act({ type: 'roll' });
  if (a === 'end') { S.mode = null; return act({ type: 'end' }); }
  if (a === 'endRoads') return act({ type: 'end' });
  if (a === 'cancel') { S.mode = null; return render(); }
  if (a === 'discard') return openDiscard();
  if (a === 'steal') return openSteal();
  if (a === 'trade') return openTrade();
  if (a === 'result') return showOver();
  if (a.startsWith('build:')) {
    const kind = a.slice(6);
    if (kind === 'dev') return act({ type: 'buyDev' });
    S.mode = S.mode === kind ? null : kind;
    if (S.mode && !boardTargets().list.length) { toast('지을 수 있는 자리가 없어요', 'err'); S.mode = null; }
    render();
  }
});

/* ═════════════════════════ 모달 ═════════════════════════ */

const modal = $('#modal');
const modalBox = $('#modalBox');
let modalLock = false;
function openModal(html, { wide = false, lock = false } = {}) {
  modalBox.className = `modal-box ${wide ? 'wide' : ''}`;
  modalBox.innerHTML = html;
  modal.hidden = false;
  modalLock = lock;
}
function closeModal() { modal.hidden = true; modalBox.innerHTML = ''; modalLock = false; }
modal.addEventListener('click', (e) => {
  if (e.target === modal && !modalLock) closeModal();
  if (e.target.closest('[data-close]')) closeModal();
});

/** 자원 고르기 (풍년 2장 / 독점 1장) */
function pickRes(title, sub, count) {
  return new Promise((resolve) => {
    const picks = [];
    const draw = () => {
      openModal(`<h3 class="m-title">${esc(title)}</h3><p class="m-sub">${esc(sub)}</p>
        <div class="pick-row">${RES.map((r) => `<button class="pick-btn" data-pick="${r}">${resCard(r)}${resName(r)}${picks.filter((x) => x === r).length ? ` ×${picks.filter((x) => x === r).length}` : ''}</button>`).join('')}</div>
        <div class="m-actions"><span class="hint" style="color:#6b5236;text-shadow:none">${picks.length}/${count}</span><button class="btn" data-cancel>취소</button></div>`, { lock: true });
      $$('[data-pick]', modalBox).forEach((b) => b.addEventListener('click', () => {
        picks.push(b.dataset.pick);
        SFX.card();
        if (picks.length >= count) { closeModal(); resolve(picks); } else draw();
      }));
      $('[data-cancel]', modalBox).addEventListener('click', () => { closeModal(); resolve(null); });
    };
    draw();
  });
}

/** 카드 개수 고르기 */
function stepperHtml(values, max, prefix) {
  return `<div class="steppers">${RES.map((r) => `<div class="stepper">
    ${resCard(r)}
    <div class="row"><button data-${prefix}="${r}" data-d="-1" ${values[r] <= 0 ? 'disabled' : ''}>−</button><b>${values[r]}</b><button data-${prefix}="${r}" data-d="1" ${values[r] >= max[r] ? 'disabled' : ''}>+</button></div>
    <small>${prefix === 'dis' ? `가진 것 ${max[r]}` : ''}</small>
  </div>`).join('')}</div>`;
}

function openDiscard() {
  const need = S.g.turn.discard[S.me];
  const have = S.g.me.res;
  const pick = I.emptyRes();
  const draw = () => {
    const n = I.total(pick);
    openModal(`<h3 class="m-title">${ic('cards')} 카드 버리기</h3>
      <p class="m-sub">7이 나왔어요. 카드가 8장 이상이라 <b>${need}장</b>을 버려야 해요.</p>
      ${stepperHtml(pick, have, 'dis')}
      <div class="m-actions"><b>${n} / ${need}장</b><button class="btn btn-red" data-ok ${n === need ? '' : 'disabled'}>버리기</button></div>`, { lock: true });
    $$('[data-dis]', modalBox).forEach((b) => b.addEventListener('click', () => {
      const r = b.dataset.dis;
      const d = Number(b.dataset.d);
      if (d > 0 && I.total(pick) >= need) return;
      pick[r] = Math.max(0, Math.min(have[r], pick[r] + d));
      draw();
    }));
    $('[data-ok]', modalBox).addEventListener('click', async () => {
      const r = await act({ type: 'discard', cards: pick });
      if (r.ok) closeModal();
    });
  };
  draw();
}

function openSteal() {
  const list = S.g.turn.stealFrom;
  openModal(`<h3 class="m-title">${ic('robber')} 누구에게서 빼앗을까요?</h3>
    <p class="m-sub">고른 사람의 손패에서 무작위로 1장을 가져옵니다.</p>
    <div class="pick-row">${list.map((pid) => { const p = pl(pid); return `<button class="pick-btn" data-steal="${pid}">${pawn(p.color, 48)}<span>${esc(p.name)}</span><small>카드 ${p.cards}장 · ${p.vp}점</small></button>`; }).join('')}</div>`, { lock: true });
  $$('[data-steal]', modalBox).forEach((b) => b.addEventListener('click', async () => {
    const r = await act({ type: 'steal', target: b.dataset.steal });
    if (r.ok) closeModal();
  }));
}

/* ── 교환 */

function openTrade(tab = 'bank') {
  const g = S.g;
  const me = g.me;
  const ratios = myPlayer().ratios || {};
  let give = null;
  let get = null;
  const offerGive = I.emptyRes();
  const offerGet = I.emptyRes();
  const max19 = Object.fromEntries(RES.map((r) => [r, 19]));
  const draw = () => {
    const bank = `<p class="m-sub">줄 자원을 고르고, 받을 자원을 고르세요. 항구에 마을이 있으면 비율이 좋아져요.</p>
      <div class="sect">줄 것</div>
      <div class="bank-grid">${RES.map((r) => {
    const ok = me.res[r] >= ratios[r];
    return `<div class="bank-cell ${give === r ? 'on' : ''} ${ok ? '' : 'off'}" data-give="${ok ? r : ''}">${resCard(r)}<small>${ratios[r]}장 → 1장</small><small>가진 것 ${me.res[r]}</small></div>`;
  }).join('')}</div>
      <div class="sect">받을 것</div>
      <div class="bank-grid">${RES.map((r) => {
    const ok = g.bank[r] > 0 && r !== give;
    return `<div class="bank-cell ${get === r ? 'on' : ''} ${ok ? '' : 'off'}" data-get="${ok ? r : ''}">${resCard(r)}<small>은행 ${g.bank[r]}장</small></div>`;
  }).join('')}</div>
      <div class="m-actions"><button class="btn btn-sea" data-bank ${give && get ? '' : 'disabled'}>${give && get ? `${resName(give)} ${ratios[give]}장 → ${resName(get)} 1장` : '교환하기'}</button></div>`;
    const player = `<p class="m-sub">다른 사람들에게 거래를 제안합니다. 수락한 사람 중 한 명을 골라 거래해요.</p>
      <div class="sect">내가 줄 것</div>${stepperHtml(offerGive, me.res, 'og')}
      <div class="sect">내가 받을 것</div>${stepperHtml(offerGet, max19, 'ow')}
      <div class="m-actions"><button class="btn btn-sea" data-offer ${I.total(offerGive) && I.total(offerGet) ? '' : 'disabled'}>거래 제안하기</button></div>`;
    openModal(`<h3 class="m-title">${ic('trade')} 교환</h3>
      <div class="trade-tabs">
        <button class="btn btn-sm ${tab === 'bank' ? 'btn-gold' : ''}" data-tab2="bank">은행 · 항구</button>
        <button class="btn btn-sm ${tab === 'player' ? 'btn-gold' : ''}" data-tab2="player">다른 사람과 거래</button>
        <div class="grow"></div><button class="btn btn-sm" data-close>닫기</button>
      </div>
      ${tab === 'bank' ? bank : player}`, { wide: true });
    $$('[data-tab2]', modalBox).forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab2; draw(); }));
    $$('[data-give]', modalBox).forEach((b) => b.addEventListener('click', () => { if (b.dataset.give) { give = b.dataset.give; if (get === give) get = null; draw(); } }));
    $$('[data-get]', modalBox).forEach((b) => b.addEventListener('click', () => { if (b.dataset.get) { get = b.dataset.get; draw(); } }));
    const bb = $('[data-bank]', modalBox);
    if (bb) bb.addEventListener('click', async () => {
      const r = await act({ type: 'bank', give, get });
      if (r.ok) { SFX.card(); toast(`${resName(give)} → ${resName(get)} 교환 완료`, 'gold'); give = null; get = null; setTimeout(draw, 80); }
    });
    $$('[data-og]', modalBox).forEach((b) => b.addEventListener('click', () => {
      const r = b.dataset.og;
      offerGive[r] = Math.max(0, Math.min(me.res[r], offerGive[r] + Number(b.dataset.d)));
      if (offerGive[r]) offerGet[r] = 0;
      draw();
    }));
    $$('[data-ow]', modalBox).forEach((b) => b.addEventListener('click', () => {
      const r = b.dataset.ow;
      offerGet[r] = Math.max(0, Math.min(19, offerGet[r] + Number(b.dataset.d)));
      if (offerGet[r]) offerGive[r] = 0;
      draw();
    }));
    const ob = $('[data-offer]', modalBox);
    if (ob) ob.addEventListener('click', async () => {
      const r = await act({ type: 'offer', give: offerGive, get: offerGet });
      if (r.ok) closeModal();
    });
  };
  draw();
}

const resList = (m) => RES.filter((r) => m[r]).map((r) => `<span class="tb-res">${ri(r)}×${m[r]}</span>`).join(' ');

function renderTradeBox() {
  const g = S.g;
  const t = g.trade;
  const box = $('#tradeBox');
  if (!t || g.phase !== 'play') { box.hidden = true; return; }
  box.hidden = false;
  const from = pl(t.from);
  if (t.from === S.me) {
    const rows = Object.entries(t.responses).map(([pid, v]) => {
      const st = v === 'accept' ? '<span class="st acc">수락</span>' : v === 'decline' ? '<span class="st dec">거절</span>' : '<span class="st wait">고민 중…</span>';
      const go = v === 'accept' ? `<button class="btn btn-sm btn-gold" data-confirm="${pid}">거래하기</button>` : '';
      return `<div>${pawn(pl(pid).color, 18)}${esc(pname(pid))}${st}${go}</div>`;
    }).join('');
    box.innerHTML = `<h4>${ic('trade')} 내 거래 제안</h4>
      <div class="tb-line"><b>줄 것</b>${resList(t.give)}</div>
      <div class="tb-line"><b>받을 것</b>${resList(t.get)}</div>
      <div class="tb-resp">${rows}</div>
      <div class="tb-btns"><button class="btn btn-sm" data-cancel-offer>제안 취소</button></div>`;
  } else if (t.responses && S.me in t.responses) {
    const mine = t.responses[S.me];
    const can = g.me && I.canPay(g.me.res, t.get);
    box.innerHTML = `<h4>${pawn(from.color, 20)} ${esc(from.name)}의 거래 제안</h4>
      <div class="tb-line"><b>받음</b>${resList(t.give)}</div>
      <div class="tb-line"><b>줌</b>${resList(t.get)}</div>
      <div class="tb-btns">
        ${mine ? `<span class="st">${mine === 'accept' ? '수락했어요 · 상대가 고르는 중' : '거절했어요'}</span>` : ''}
        <button class="btn btn-sm" data-respond="0">거절</button>
        <button class="btn btn-sm btn-gold" data-respond="1" ${can ? '' : 'disabled title="줄 자원이 부족해요"'}>수락</button>
      </div>`;
  } else {
    box.innerHTML = `<h4>${pawn(from.color, 20)} ${esc(from.name)}의 거래 제안</h4>
      <div class="tb-line"><b>줌</b>${resList(t.give)}</div><div class="tb-line"><b>받음</b>${resList(t.get)}</div>`;
  }
}

$('#tradeBox').addEventListener('click', (e) => {
  const t = S.g && S.g.trade;
  if (!t) return;
  const c = e.target.closest('[data-confirm]');
  if (c) { SFX.card(); act({ type: 'confirm', tradeId: t.id, with: c.dataset.confirm }); return; }
  if (e.target.closest('[data-cancel-offer]')) { act({ type: 'cancelOffer' }); return; }
  const r = e.target.closest('[data-respond]');
  if (r && !r.disabled) { SFX.click(); act({ type: 'respond', tradeId: t.id, accept: r.dataset.respond === '1' }); }
});

/* ═════════════════════════ 기록 ═════════════════════════ */

function logText(t) {
  return String(t)
    .replace(/\{p:([^}]+)\}/g, (_, pid) => {
      const p = pl(pid);
      const c = p ? I.COLOR[p.color] : { fill: '#888' };
      return `<span class="lp ${p ? `c-${p.color}` : ''}" style="background:${c.fill}">${esc(pname(pid))}</span>`;
    })
    .replace(/\{x:([a-z]+)\}/g, (_, r) => `${ri(r)}${resName(r)}`)
    .replace(/\{n:(\d+)\}/g, (_, n) => `<span class="ln ${n === '6' || n === '8' || n === '7' ? 'hot' : ''}">${n}</span>`)
    .replace(/\{d:([a-z]+)\}/g, (_, d) => `<span class="ld">${I.DEV[d].name}</span>`)
    .replace(/\{h:(\d+)\}/g, (_, h) => {
      const tile = S.g.board.hexes[Number(h)];
      return `<b>${I.TERRAIN[tile.terrain].name}${tile.number ? `(${tile.number})` : ''}</b>`;
    });
}
function renderLog() {
  const box = $('#tab-log');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = S.g.log.map((l) => `<div class="log-row k-${l.kind}">${logText(l.text)}</div>`).join('');
  if (near) box.scrollTop = box.scrollHeight;
}

/* ═════════════════════════ 주사위 · 연출 ═════════════════════════ */

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
function dieHtml(n, red) {
  return `<div class="die ${red ? 'red' : ''}">${Array.from({ length: 9 }, (_, i) => (PIPS[n].includes(i + 1) ? '<i></i>' : '<span></span>')).join('')}</div>`;
}
function renderDice(roll = false) {
  const d = S.g.dice;
  const box = $('#dice');
  if (!d) { box.innerHTML = ''; return; }
  const sum = d[0] + d[1];
  box.innerHTML = `${dieHtml(d[0], false)}${dieHtml(d[1], true)}<div class="sum ${sum === 7 ? 'seven' : ''}">${sum}</div>`;
  if (roll) { box.classList.remove('roll'); void box.offsetWidth; box.classList.add('roll'); }
}

/** 보드 좌표 → 화면 좌표 */
function boardToScreen(x, y) {
  const svg = $('#board');
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = pt.matrixTransform(m);
  return { x: p.x, y: p.y };
}
function fly(html, from, to, delay = 0) {
  if (!from || !to) return;
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = html;
  el.style.transform = `translate(${from.x - 17}px, ${from.y - 17}px) scale(.6)`;
  $('#flyLayer').appendChild(el);
  setTimeout(() => { el.style.transform = `translate(${to.x - 17}px, ${to.y - 17}px) scale(1)`; }, 30 + delay);
  setTimeout(() => { el.style.opacity = '0'; }, 700 + delay);
  setTimeout(() => el.remove(), 1000 + delay);
}
function playerAnchor(pid) {
  if (pid === S.me) {
    const r = $('#hand').getBoundingClientRect();
    return { x: r.left + 60, y: r.top + 40 };
  }
  const idx = S.g.players.findIndex((p) => p.pid === pid);
  const card = $$('#players .pcard')[idx];
  if (!card) return null;
  const r = card.getBoundingClientRect();
  return { x: r.left + r.width - 30, y: r.top + r.height / 2 };
}

function playEvents() {
  const g = S.g;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  if (!fresh.length) return {};
  S.seenSeq = g.events[g.events.length - 1].seq;
  if (fresh.length > 14) return {};
  const mark = {};
  for (const e of fresh) {
    switch (e.type) {
      case 'turn': if (e.pid === S.me) { SFX.turn(); toast(`${ic('star')}내 차례입니다!`, 'gold'); } break;
      case 'dice': SFX.draw(); setTimeout(() => SFX.draw(), 120); mark.roll = true; break;
      case 'produce': {
        const n = e.n;
        mark.hexes = n ? HEXES.filter((h) => g.board.hexes[h.id].number === n && h.id !== g.board.robber).map((h) => h.id) : [];
        let delay = 150;
        for (const [pid, gains] of Object.entries(e.gains || {})) {
          for (const r of RES) {
            for (let k = 0; k < gains[r]; k++) {
              const src = HEXES.find((h) => I.TERRAIN[g.board.hexes[h.id].terrain].res === r && (!n || g.board.hexes[h.id].number === n));
              fly(ri(r), src ? boardToScreen(src.x, src.y) : null, playerAnchor(pid), delay);
              delay += 90;
            }
          }
        }
        if (Object.keys(e.gains || {}).length) setTimeout(() => SFX.card(), 300);
        break;
      }
      case 'build':
        SFX.clank();
        if (e.kind === 'road') mark.road = e.at; else mark.vertex = e.at;
        break;
      case 'robber': SFX.hit(); mark.robber = true; break;
      case 'steal':
        SFX.card();
        if (e.to === S.me && e.res) toast(`${esc(pname(e.from))}에게서 ${ri(e.res)}${resName(e.res)}을(를) 빼앗았어요`, 'gold');
        if (e.from === S.me && e.res) toast(`${esc(pname(e.to))}이(가) 내 ${ri(e.res)}${resName(e.res)}을(를) 빼앗았어요`, 'err');
        fly(backCard(), playerAnchor(e.from), playerAnchor(e.to));
        break;
      case 'discard': SFX.card(); break;
      case 'buyDev': SFX.draw(); if (e.card) toast(`발전 카드 <b>${I.DEV[e.card.type].name}</b>을(를) 샀어요`, 'gold'); break;
      case 'playDev': SFX.bell(); toast(`${esc(pname(e.pid))}: <b>${I.DEV[e.card].name}</b> 카드 사용`, ''); break;
      case 'trade': SFX.card(); break;
      case 'bank': SFX.card(); break;
      case 'offer': if (e.pid !== S.me) { SFX.chat(); } break;
      case 'award': SFX.win(); toast(`${ic('cup')}<b>${esc(pname(e.pid))}</b> ${e.kind === 'road' ? '최장 교역로' : '최강 기사단'} 획득! (+2점)`, 'gold'); break;
      default: break;
    }
  }
  return mark;
}

/* ═════════════════════════ 시작 · 결과 ═════════════════════════ */

function showIntro() {
  const me = myPlayer();
  if (!me) return;
  const order = S.g.players.map((p) => `<span style="display:inline-flex;align-items:center;gap:4px;margin:0 6px">${pawn(p.color, 22)}${esc(p.name)}</span>`).join('→');
  openModal(`<div class="intro">
    ${pawn(me.color, 64)}
    <h3 class="m-title" style="justify-content:center">당신은 ${I.COLOR[me.color].name} 개척자</h3>
    <p class="m-sub">차례 순서: ${order}</p>
    <p class="m-sub">먼저 <b>10점</b>을 모으면 승리! 처음에는 차례대로 <b>마을 1개 + 도로 1개</b>를 두 번 놓고, 두 번째 마을 주변 땅에서 자원을 받아요.</p>
    <div class="cost-card" style="text-align:left;max-width:360px;margin:0 auto">${costCardHtml()}</div>
    <div class="m-actions" style="justify-content:center"><button class="btn btn-red btn-lg" data-close>시작하기</button></div>
  </div>`);
  SFX.bell();
}

function showOver() {
  const o = S.g.over;
  if (!o) return;
  const won = o.winner === S.me;
  const cards = o.scores.slice().sort((a, b) => b.vp - a.vp).map((s) => {
    const p = pl(s.pid);
    return `<div class="over-p ${s.pid === o.winner ? 'win' : ''}">${pawn(p.color, 40)}<b>${esc(p.name)}</b><div class="big">${s.vp}점</div><small>${s.vpCards ? `승리 점수 카드 ${s.vpCards}장 포함` : ''}</small></div>`;
  }).join('');
  const host = S.room.hostPid === S.me;
  openModal(`<div class="intro">
    <h3 class="m-title" style="justify-content:center;font-size:36px">${ic('cup')} ${esc(pname(o.winner))} 승리!</h3>
    <p class="m-sub">${won ? '축하합니다! 바람섬의 주인이 되었어요.' : '다음 판에서 설욕하세요!'}</p>
    <div class="over-grid">${cards}</div>
    <div class="m-actions">${host ? '<button class="btn btn-gold btn-lg" data-again>대기실로 돌아가기</button>' : ''}<button class="btn" data-close>닫기</button></div>
  </div>`, { wide: true });
  $('[data-again]', modalBox)?.addEventListener('click', () => { closeModal(); call('room:lobby'); });
  if (won) SFX.win(); else SFX.lose();
}

/* ═════════════════════════ 룰 ═════════════════════════ */

fetch('/api/games').then((r) => r.json()).then((d) => {
  const g = (d.games || []).find((x) => x.id === 'isle');
  S.links = g ? g.links : [];
}).catch(() => {});

function showRules() {
  const video = S.links.length
    ? S.links.map((l) => `<a class="video" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><img src="/assets/play.svg" alt="">${esc(l.title)}${l.note ? ` (${esc(l.note)})` : ''}</a>`).join('<br>') : '';
  openModal(`<h3 class="m-title">${ic('help')} 바람섬 개척기 게임 방법</h3>
    <div class="rules">
      ${video ? `<p>영상으로 먼저 보면 쉬워요 (규칙은 카탄 기본판과 같아요):<br>${video}</p>` : ''}
      <h4>목표</h4><p>먼저 <b>10점</b>을 모으면 승리합니다. 마을 1점, 도시 2점, 최장 교역로 2점, 최강 기사단 2점, 승리 점수 카드 1점.</p>
      <h4>시작</h4><p>차례대로 마을 1개와 그 옆에 도로 1개를 놓고, 거꾸로 한 바퀴 더 놓습니다. 두 번째 마을에 닿은 땅의 자원을 1장씩 받아요.</p>
      <h4>내 차례</h4>
      <ol>
        <li><b>주사위</b>를 굴리면 그 숫자가 적힌 땅에 닿은 마을은 자원 1장, 도시는 2장을 받습니다 (모든 사람).</li>
        <li><b>7</b>이 나오면 카드가 8장 이상인 사람은 절반을 버리고, 굴린 사람이 <b>도적</b>을 옮겨 그 땅의 생산을 막고 옆 사람에게서 1장을 빼앗습니다.</li>
        <li><b>교환</b>: 은행과 4:1, 항구에 마을이 있으면 3:1 또는 2:1. 다른 사람과도 자유롭게 거래할 수 있어요.</li>
        <li><b>건설</b>: 도로·마을·도시를 짓거나 발전 카드를 삽니다. 마을은 서로 두 칸 이상 떨어져야 하고 내 도로에 닿아야 해요.</li>
        <li>다 했으면 <b>턴 마치기</b>.</li>
      </ol>
      <h4>건설 비용</h4><div class="cost-card" style="max-width:380px">${costCardHtml()}</div>
      <h4>발전 카드</h4>
      <div class="rules-cards">${Object.keys(I.DEV).map((t) => devCard({ type: t }, 'big')).join('')}</div>
      <p>발전 카드는 산 차례에는 쓸 수 없고, 차례마다 1장만 쓸 수 있어요. 기사 카드는 주사위 굴리기 전에도 쓸 수 있습니다.</p>
      <h4>자원</h4>
      <div class="rules-cards">${RES.map((r) => resCard(r)).join('')}</div>
      <p>숲 → 목재, 언덕 → 벽돌, 목초지 → 양털, 밭 → 곡식, 산 → 광석. 사막은 아무것도 나지 않아요. 숫자 토큰의 점이 많을수록(6·8) 자주 나옵니다.</p>
    </div>
    <div class="m-actions"><button class="btn" data-close>닫기</button></div>`, { wide: true });
}
$$('[data-rules]').forEach((b) => b.addEventListener('click', showRules));

/* ═════════════════════════ 전체 그리기 ═════════════════════════ */

function render() {
  const name = screenName();
  showScreen(name);
  if (name === 'home') { S.gameId = null; return; }
  if (name === 'lobby') { S.gameId = null; S.seenSeq = 0; renderLobby(); return; }

  const g = S.g;
  useMap(g.map || 'random');
  mountChat($('#tab-chat'));
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(S.room.hostPid === S.me && g.phase === 'over');
  if (S.gameId !== g.id) {
    S.gameId = g.id;
    S.seenSeq = g.events.length ? g.events[g.events.length - 1].seq : 0;
    S.introShown = false;
    S.overShown = false;
    S.mode = null;
  }
  const need = myNeed();
  if (!need || need.what !== 'main') S.mode = null;

  const mark = playEvents();
  renderPlayers();
  renderBoard(mark);
  renderDice(!!mark.roll);
  renderHand();
  renderActionBar();
  renderTradeBox();
  renderLog();
  renderBanner();

  if (!S.introShown) { S.introShown = true; setTimeout(showIntro, 200); }
  // 버리기 · 빼앗기는 창을 자동으로 연다
  if (need && need.what === 'discard' && modal.hidden) openDiscard();
  if (need && need.what === 'steal' && modal.hidden) openSteal();
  if (g.phase === 'over' && !S.overShown) { S.overShown = true; setTimeout(showOver, 800); }
}

function renderBanner() {
  const g = S.g;
  const el = $('#turnBanner');
  if (g.phase === 'over') { el.innerHTML = `${ic('cup')}<b>게임 종료</b>`; return; }
  const cp = curPid();
  const p = pl(cp);
  if (!p) { el.innerHTML = ''; return; }
  const what = g.phase === 'setup' ? `시작 배치 (${g.setup.round}바퀴째)` : `${g.turn.no}번째 차례 · ${STAGE_NAME[g.turn.stage] || ''}`;
  el.innerHTML = `${pawn(p.color, 20)}<b>${cp === S.me ? '내 차례' : `${esc(p.name)}의 차례`}</b><span>· ${what}</span>`;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (S.mode) { S.mode = null; render(); } else if (!modal.hidden && !modalLock) closeModal();
  }
});
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
window.addEventListener('resize', () => { if (S.g) renderBoard(); });

render();
