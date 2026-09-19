import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { watchConnection } from '/common/net.js';
import { memberFace } from '/common/avatar.js';
import { cardSvg, cardHtml, prewarm, backSvg, setEdition } from './cards.js';
import { playEnding } from './ending.js';
// 왕궁의 달무티 - 브라우저 쪽 화면과 조작
const D = window.DALMUTI;
const SFX = window.SFX;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };
function token() {
  let t = remembered('dalmuti.token');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    remember('dalmuti.token', t);
  }
  return t;
}
const face = (pid, size = 40) => {
  const m = S.room && S.room.members.find((x) => x.pid === pid);
  return `<span class="av-face" style="width:${size}px;height:${size}px">${memberFace(m || { pid })}</span>`;
};
/* 판(확장판): 첫 화면은 주소(?ed=joseon), 방에 들어가면 방의 판을 따른다 */
const URL_ED = (() => { const e = new URLSearchParams(location.search).get('ed'); return D.EDITIONS[e] ? e : 'classic'; })();
function applyEdition(ed) {
  if (document.body.dataset.edition === ed) return;
  document.body.dataset.edition = ed;
  setEdition(ed);
  prewarm(ed);
  const jo = ed === 'joseon';
  document.title = jo ? '달무티 조선 궁궐판 · 계급 카드게임' : '왕궁의 달무티 · 계급 카드게임';
  const H = {
    box: jo ? 'assets/box-joseon.png' : 'assets/box.png',
    kicker: jo ? '임금부터 노비까지, 조선 궁궐의 신분 싸움' : '왕부터 농노까지, 모두가 카드를 쥔 왕궁',
    title: jo ? '달무티<br><small>조선 궁궐판</small>' : '왕궁의<br>달무티',
    en: jo ? 'JOSEON COURT EDITION' : 'THE GREAT DALMUTI',
    tag: jo ? '숫자가 작을수록 높은 신분. 같은 장수로 더 작은 숫자를 내거나 패스!<br>노비는 <b>세금</b>을 바치고, 탈광대 두 장이면 <b>혁명</b>. 그리고 <b>마패</b> 한 장이면 — <b>암행어사 출두요!</b> 깔린 판을 엎는다.' : null,
  };
  const hb = $('.hero-box'); if (hb) hb.src = H.box;
  document.querySelectorAll('.bar-brand span').forEach((s) => { s.textContent = jo ? '달무티 조선 궁궐판' : '왕궁의 달무티'; });
  const k = $('.hero .kicker'); if (k) k.textContent = H.kicker;
  const tt = $('.hero .title'); if (tt) tt.innerHTML = H.title;
  const en = $('.hero .en'); if (en) en.textContent = H.en;
  const tg = $('.hero .tagline'); if (tg && H.tag) { tg.dataset.orig = tg.dataset.orig || tg.innerHTML; tg.innerHTML = H.tag; } else if (tg && tg.dataset.orig) tg.innerHTML = tg.dataset.orig;
}
applyEdition(URL_ED);
window.addEventListener('dcards-ready', () => {
  S.handKey = S.tableKey = null;
  if (S.g && screenName() === 'game') { renderTable(); renderHand(); renderDialogs(); }
  if (S.room && screenName() === 'lobby') renderLobby();
});
const rname = (r) => D.ranksOf(S.g && S.g.edition)[r].name;

const S = { me: null, room: null, g: null, gameId: null, seenSeq: 0, tab: 'log', unread: 0, chatLog: [], receivedAt: 0, sel: new Set(), taxSel: new Set(), filmShown: null };

/* ── 소켓 */
const keeper = roomKeeper('dalmuti');
const socket = io('/dalmuti', { auth: (cb) => cb({ token: token(), save: keeper.get() }), transports: ['websocket', 'polling'] });
watchConnection(socket);
keeper.attach(socket);
const conn = $('#conn');
let connTimer = null;
socket.on('connect', () => { clearTimeout(connTimer); conn.hidden = true; });
socket.on('disconnect', () => { connTimer = setTimeout(() => { conn.hidden = false; conn.textContent = '서버와 연결이 끊겼습니다. 다시 연결하는 중…'; }, 3000); });
socket.on('replaced', () => { conn.hidden = false; conn.textContent = '다른 창에서 접속해서 이 창의 연결이 끊겼습니다.'; });
socket.on('hello', ({ pid }) => { S.me = pid; });
socket.on('toast', (t) => toast(esc(t), 'gold'));
socket.on('chat:history', (l) => { S.chatLog = l || []; renderChat(); });
socket.on('chat', (m) => {
  S.chatLog.push(m);
  renderChat();
  if (!m.system && m.pid !== S.me) { SFX.chat(); if (S.g && S.tab !== 'chat') { S.unread++; renderBadge(); } }
});
socket.on('room', (room) => { S.room = room; S.g = room && room.game; S.receivedAt = Date.now(); render(); });
const emit = (ev, d) => new Promise((res) => socket.emit(ev, d, (r) => res(r || { ok: true })));
async function call(ev, d) { const r = await emit(ev, d); if (!r.ok && r.error) toast(esc(r.error), 'err'); return r; }
async function act(a) { const r = await emit('game:act', a); if (!r.ok && r.error) { toast(esc(r.error), 'err'); SFX.alarm(); } return r; }
function toast(html, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');

/* ── 시작 · 공용 */
const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('dalmuti.name');
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []), anchor: (pid) => document.querySelector(`.seat[data-pid="${pid}"]`) });
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();
const needName = () => { const n = nameInput.value.trim(); if (!n) { toast('닉네임을 입력하세요', 'err'); return null; } remember('dalmuti.name', n); return n; };
$('#createBtn').addEventListener('click', () => { const n = needName(); if (n) { SFX.unlock(); call('room:create', { name: n, edition: URL_ED }); } });
const doJoin = () => { const n = needName(); const c = codeInput.value.trim().toUpperCase(); if (n && c.length === 4) { SFX.unlock(); call('room:join', { name: n, code: c }); } };
$('#joinBtn').addEventListener('click', doJoin);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
$$('[data-leave]').forEach((b) => b.addEventListener('click', () => {
  if (S.g && S.g.phase !== 'over' && !confirm('게임 중입니다. 정말 나가시겠어요? (자리는 AI가 대신 맡습니다)')) return;
  socket.emit('room:leave');
}));
$('#backHub').addEventListener('click', () => { if (S.room) socket.emit('room:leave'); });
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/dalmuti/?room=${S.room.code}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다', 'gold'); } catch (_) { prompt('이 주소를 친구에게 보내세요', url); }
});
const paintMute = () => $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; });
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => { SFX.setMuted(!SFX.muted); paintMute(); }));
paintMute();

function showRules() {
  $('#modalBox').innerHTML = `<h3>왕궁의 달무티 · 게임 방법</h3><div class="rules">
    <h4>카드</h4><ul><li>숫자가 <b>작을수록 강한</b> 카드예요. 1 대달무티는 1장, 2 대주교는 2장 … 12 농노는 12장. 광대 2장은 아무 숫자로 쓸 수 있어요 (광대만 내면 13).</li></ul>
    <h4>한 판</h4><ol>
    <li>신분 순서대로 카드를 모두 나눕니다. 첫 판 신분은 제비뽑기.</li>
    <li><b>세금</b>: 대농노(꼴찌)는 가장 좋은 카드 2장을 대달무티에게, 소농노는 1장을 소달무티에게 바칩니다. 달무티는 아무 카드나 같은 수만큼 돌려줘요.</li>
    <li><b>혁명</b>: 광대 2장을 받은 사람은 혁명을 외쳐 세금을 없앨 수 있어요. 대농노가 외치면 <b>대혁명</b> — 신분이 통째로 뒤집힙니다!</li>
    <li>대달무티부터 같은 숫자 카드를 몇 장이든 냅니다. 다음 사람은 <b>같은 장수</b>로 <b>더 작은 숫자</b>를 내거나 패스.</li>
    <li>모두 패스하면 마지막에 낸 사람이 새로 시작해요. 손을 먼저 다 턴 순서대로 다음 판 신분이 정해집니다.</li></ol>
    <h4>승리</h4><ul><li>정한 판 수를 하고, 판마다 받은 신분 점수를 더해 가장 높은 사람이 왕좌의 주인!</li></ul>
    </div><div class="modal-btns"><button class="btn btn-gold" data-close>알겠어요</button></div>`;
  $('#modal').hidden = false;
}
$$('[data-rules]').forEach((b) => b.addEventListener('click', showRules));
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').hidden = true; });

/* ── 대화 */
const chatHosts = [];
function mountChat(host) {
  if (host.dataset.chat) return;
  host.dataset.chat = '1';
  host.appendChild($('#chatTpl').content.cloneNode(true));
  const form = $('.chat-form', host);
  form.addEventListener('submit', (e) => { e.preventDefault(); const i = $('input', form); if (i.value.trim()) socket.emit('chat', i.value.trim()); i.value = ''; });
  chatHosts.push(host);
  renderChat();
}
function renderChat() {
  for (const h of chatHosts) {
    const log = $('.chat-log', h);
    log.innerHTML = S.chatLog.map((m) => (m.system ? `<div class="cm sys">${esc(m.text)}</div>` : `<div class="cm"><b>${esc(m.name)}</b>${esc(m.text)}</div>`)).join('');
    log.scrollTop = log.scrollHeight;
  }
}
function renderBadge() { const b = $('#chatBadge'); b.hidden = !S.unread; b.textContent = S.unread; }
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  S.tab = b.dataset.tab;
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $('#tab-log').hidden = S.tab !== 'log';
  $('#tab-chat').hidden = S.tab !== 'chat';
  if (S.tab === 'chat') { S.unread = 0; renderBadge(); }
});

/* ── 대기실 */
function renderLobby() {
  const room = S.room;
  const host = room.hostPid === S.me;
  const cfg = room.config || { rounds: 3 };
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  $('#seatGrid').innerHTML = Array.from({ length: D.MAX_PLAYERS }, (_, i) => {
    const m = seated[i];
    if (!m) return '<div class="slot empty">빈 자리</div>';
    return `<div class="slot">${host && m.pid !== S.me ? `<button class="btn btn-sm kick" data-kick="${m.pid}">✕</button>` : ''}${face(m.pid, 64)}<b>${esc(m.name)}</b>
      <div>${m.pid === room.hostPid ? '<span class="tag">방장</span>' : ''}${m.isBot ? '<span class="tag">AI</span>' : ''}${m.pid === S.me ? '<span class="tag">나</span>' : ''}</div></div>`;
  }).join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').textContent = specs.length ? `관전: ${specs.map((m) => m.name).join(', ')}` : '';
  const ed = D.EDITIONS[cfg.edition] ? cfg.edition : 'classic';
  applyEdition(ed);
  const E = D.EDITIONS[ed];
  $('#cfg').innerHTML = `<div class="cfg-box"><h4>이 왕궁 ${ed !== 'classic' ? '<small>확장판</small>' : ''}</h4><div class="eds"><div class="ed ed-${E.id} on">
      <span class="ed-cards">${[1, 13, 12].map((r, i) => cardHtml(r, { w: 54, edition: E.id, cls: `k${i}` })).join('')}${E.mapae ? cardHtml(14, { w: 54, edition: E.id, cls: 'k3' }) : ''}</span>
      <b>${E.name}</b><small>${E.sub}</small></div></div>
    ${ed === 'joseon' ? '<p class="ed-rule"><b>마패</b> 2장이 더 들어갑니다. 내 차례에 마패 한 장만 내면 <b>암행어사 출두!</b> 깔린 카드를 모두 치우고 내가 새로 냅니다.</p>' : ''}</div>
    <div class="cfg-box"><h4>몇 판 할까요?</h4><div class="seg">${[1, 3, 5, 7].map((n) => `<button data-rounds="${n}" class="${cfg.rounds === n ? 'on' : ''}" ${host ? '' : 'disabled'}>${n}판</button>`).join('')}</div><p>판마다 신분 점수(대달무티가 가장 높음)를 더해 우승자를 가립니다.</p></div>`;
  const me = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').textContent = me && me.seated ? '관전으로 전환' : '자리에 앉기';
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  $('#startBtn').disabled = seated.length < D.MIN_PLAYERS;
  $('#startHint').textContent = host ? (seated.length < D.MIN_PLAYERS ? `${D.MIN_PLAYERS}명부터 시작할 수 있어요` : `${seated.length}명 · ${cfg.rounds}판 · ${(D.EDITIONS[cfg.edition] || D.EDITIONS.classic).name}`) : '방장이 시작하기를 기다리는 중…';
}
$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#cfg').addEventListener('click', (e) => { const b = e.target.closest('[data-rounds]'); if (b && !b.disabled) { SFX.click(); call('room:config', { rounds: Number(b.dataset.rounds) }); } });
$('#addBotBtn').addEventListener('click', () => call('room:addBot'));
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.fanfare(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ── 게임 도우미 */
const pl = (pid) => S.g.players.find((p) => p.pid === pid);
const nameOf = (pid) => (pl(pid) || {}).name || '?';
const logText = (t) => esc(t).replace(/\{p:([^}]+)\}/g, (_, pid) => `<span class="pn">${esc(nameOf(pid))}</span>`);
const myTurn = () => S.g && S.g.phase === 'play' && S.g.turn === S.me;

/* ── 서열 (왕좌 → 농노) */
function renderCourt() {
  const g = S.g;
  const n = g.players.length;
  const key = JSON.stringify([g.players, g.turn, g.phase, S.room && S.room.members.map((m) => [m.pid, m.online])]);
  if (S.courtKey === key && $('#court').firstChild) return;
  S.courtKey = key;
  $('#court').innerHTML = g.players.map((p) => {
    const cls = p.pos === 0 ? 'p0' : p.pos === 1 ? 'p1' : p.pos === n - 1 ? 'pl' : p.pos === n - 2 ? 'pl2' : 'pm';
    const st = g.phase === 'play' && p.passed && !p.out ? '<span class="st pass">패스</span>' : g.turn === p.pid ? '<span class="st">차례</span>' : '';
    return `<div class="seat ${cls} ${g.turn === p.pid ? 'turn' : ''} ${p.out ? 'out' : ''} ${p.online ? '' : 'off'}" data-pid="${p.pid}"><div class="chair"></div>
      ${p.out ? `<span class="medal">${p.place + 1}</span>` : ''}${st}
      ${face(p.pid, p.pos === 0 ? 50 : 42)}<b>${esc(p.name)}${p.pid === S.me ? ' (나)' : ''}</b><span class="ttl">${esc(p.title)}</span>
      <span class="cnt"><i class="mini-back"></i>${p.count}장 · ${p.score}점</span></div>`;
  }).join('');
}

/* ── 탁자 */
function renderTable() {
  const g = S.g;
  const t = g.trick;
  const key = JSON.stringify([g.phase, g.turn, t && t.cards.map((c) => c.id), t && t.by]);
  if (S.tableKey === key && $('#table').firstChild) return;
  S.tableKey = key;
  let html;
  if (t) {
    const cards = t.cards;
    const w = 118;
    const spread = Math.min(46, 360 / Math.max(1, cards.length));
    html = `<div class="pile">${cards.map((c, i) => cardHtml(c.r, { w, attrs: `style="transform: translateX(${(i - (cards.length - 1) / 2) * spread}px) rotate(${(i - (cards.length - 1) / 2) * 4}deg)"` })).join('')}</div>
      <div class="trick-label">${esc(nameOf(t.by))} · ${rname(t.rank)} ×${t.count}</div>`;
  } else {
    const leadP = g.turn && pl(g.turn);
    html = `<div class="table-empty">${g.phase === 'play' ? `${leadP ? `${esc(leadP.name)} 님이 새로 냅니다` : '다음 사람이 새로 냅니다'}<small>아무 숫자든 같은 카드 몇 장이든</small>` : g.phase === 'tax' || g.phase === 'taxdone' ? '세금을 거두는 중…<small>농노가 좋은 카드를 바칩니다</small>' : g.phase === 'revolt' ? '광대 두 장! 혁명이 일어날까…' : g.phase === 'between' ? '판이 끝났습니다<small>새 신분으로 다시 나눕니다</small>' : '카드를 나누는 중…'}</div>`;
  }
  $('#table').innerHTML = html;
}

/* ── 내 손패 */
function renderHand() {
  const g = S.g;
  const box = $('#handArea');
  if (!g.me) { box.innerHTML = '<div class="hand-top"><span class="me-t">관전 중</span></div>'; return; }
  const hand = g.me.hand;
  for (const id of [...S.sel]) if (!hand.some((c) => c.id === id)) S.sel.delete(id);
  const key = JSON.stringify([hand.map((c) => c.id), [...S.sel], g.trick && [g.trick.rank, g.trick.count], g.turn, g.phase, g.me.title]);
  if (S.handKey === key && box.firstChild) return;
  S.handKey = key;
  const t = g.trick;
  const mine = myTurn();
  const selCards = hand.filter((c) => S.sel.has(c.id));
  const set = D.evalSet(selCards);
  const canPlay = mine && set && D.beats(set, t);
  let hint = '';
  if (mine) hint = t ? `${t.count}장 · ${t.rank === 13 ? rname(13) : `${rname(t.rank)}(${t.rank})`}보다 작은 숫자를 내거나 패스${hand.some((c) => c.r === D.MAPAE) ? ' · 마패로 판을 엎을 수도 있어요' : ''}` : '먼저 냅니다: 같은 숫자 카드 몇 장이든';
  else if (g.phase === 'play') hint = `${esc(nameOf(g.turn))} 님의 차례`;
  let prev = null;
  box.innerHTML = `<div class="hand-top"><span class="me-t">${esc(g.me.title)} · ${hand.length}장</span><span class="hint2">${hint}</span><span class="grow"></span>
    ${mine ? `<button class="btn" id="passBtn" ${t ? '' : 'disabled'}>패스</button><button class="btn btn-gold btn-lg" id="playBtn" ${canPlay ? '' : 'disabled'}>${set ? (set.mapae ? '마패! 출두요' : `${rname(set.rank)} ${set.count}장 내기`) : '내기'}</button>` : ''}</div>
    <div class="hand">${hand.map((c) => {
      const gap = prev !== null && prev !== c.r;
      prev = c.r;
      // 숫자가 더 작고, 광대를 보태서 장수를 맞출 수 있어야 낼 수 있다
      const jesters = hand.filter((x) => x.r === 13).length;
      const same = hand.filter((x) => x.r === c.r).length;
      const playable = !t || c.r === D.MAPAE || (c.r === 13 ? jesters >= t.count || hand.some((x) => x.r < t.rank && hand.filter((y) => y.r === x.r).length + jesters >= t.count) : c.r < t.rank && same + jesters >= t.count);
      return cardHtml(c.r, { w: 96, cls: `${S.sel.has(c.id) ? 'sel' : ''} ${gap ? 'gap' : ''} ${mine && t && !playable ? 'dim' : ''}`, attrs: `data-id="${c.id}"` });
    }).join('')}</div>`;
}
$('#handArea').addEventListener('click', (e) => {
  const c = e.target.closest('.hand [data-id]');
  if (c) {
    const id = c.dataset.id;
    const g = S.g;
    const card = g.me.hand.find((x) => x.id === id);
    if (S.sel.has(id)) S.sel.delete(id);
    else if (card.r === D.MAPAE) { S.sel.clear(); S.sel.add(id); }
    else {
      // 다른 숫자를 누르면 그 숫자로 새로 고른다 (광대는 같이 쓸 수 있다)
      for (const x of g.me.hand) if (x.r === D.MAPAE) S.sel.delete(x.id);
      const cur = g.me.hand.filter((x) => S.sel.has(x.id) && x.r !== 13);
      if (card.r !== 13 && cur.length && cur[0].r !== card.r) S.sel.clear();
      S.sel.add(id);
      // 판이 있으면 장수를 맞춰 자동으로 더 고른다
      if (g.trick && card.r !== 13) {
        const same = g.me.hand.filter((x) => x.r === card.r && !S.sel.has(x.id));
        while (S.sel.size < g.trick.count && same.length) S.sel.add(same.shift().id);
        const js = g.me.hand.filter((x) => x.r === 13 && !S.sel.has(x.id));
        while (S.sel.size < g.trick.count && js.length) S.sel.add(js.shift().id);
      }
    }
    SFX.click();
    renderHand();
    return;
  }
  if (e.target.closest('#playBtn')) {
    const ids = [...S.sel];
    act({ type: 'play', cards: ids }).then((r) => { if (r.ok) S.sel.clear(); });
  }
  if (e.target.closest('#passBtn')) { S.sel.clear(); act({ type: 'pass' }); }
});
$('#handArea').addEventListener('contextmenu', (e) => {
  const c = e.target.closest('[data-id]');
  if (!c) return;
  e.preventDefault();
  const card = S.g.me.hand.find((x) => x.id === c.dataset.id);
  if (card) { $('#zoom').innerHTML = cardHtml(card.r, { w: 320 }); $('#zoom').hidden = false; }
});
$('#zoom').addEventListener('click', () => { $('#zoom').hidden = true; });

/* ── 세금 · 혁명 창 */
function renderDialogs() {
  const g = S.g;
  const box = $('#modalBox');
  if (g.tax && g.me) {
    const { n, got } = g.tax;
    for (const id of [...S.taxSel]) if (!g.me.hand.some((c) => c.id === id)) S.taxSel.delete(id);
    box.innerHTML = `<h3>세금을 받았습니다</h3><p>농노가 바친 카드: ${got.map((id) => { const c = g.me.hand.find((x) => x.id === id); return c ? `<b>${rname(c.r)}</b>` : ''; }).join(', ')}. 이제 돌려줄 카드 <b>${n}장</b>을 고르세요 (보통 가장 쓸모없는 카드).</p>
      <div class="pick-row">${g.me.hand.map((c) => cardHtml(c.r, { w: 92, cls: S.taxSel.has(c.id) ? 'sel' : '', attrs: `data-tax="${c.id}"` })).join('')}</div>
      <div class="modal-btns"><button class="btn btn-gold btn-lg" id="taxGo" ${S.taxSel.size === n ? '' : 'disabled'}>${n}장 돌려주기</button></div>`;
    $('#modal').hidden = false;
    $('#modal').dataset.kind = 'tax';
    return;
  }
  if (g.phase === 'revolt' && g.revolt && g.revolt.pid === S.me) {
    box.innerHTML = `<h3>광대 두 장이 손에 들어왔다!</h3><p>${g.revolt.great ? '당신은 <b>대농노</b>입니다. 지금 외치면 <b>대혁명</b> — 신분이 통째로 뒤집히고 세금도 없어집니다!' : '혁명을 외치면 이번 판은 세금이 없습니다. (대신 광대 두 장이 들킵니다)'}</p>
      <div class="modal-btns"><button class="btn" id="revNo">그냥 둔다</button><button class="btn btn-red btn-lg" id="revYes">${g.revolt.great ? '대혁명!' : '혁명!'}</button></div>`;
    $('#modal').hidden = false;
    $('#modal').dataset.kind = 'revolt';
    return;
  }
  if ($('#modal').dataset.kind === 'tax' || $('#modal').dataset.kind === 'revolt') { $('#modal').hidden = true; $('#modal').dataset.kind = ''; }
}
$('#modalBox').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tax]');
  if (t) {
    const id = t.dataset.tax;
    if (S.taxSel.has(id)) S.taxSel.delete(id); else if (S.taxSel.size < S.g.tax.n) S.taxSel.add(id);
    SFX.click();
    renderDialogs();
    return;
  }
  if (e.target.closest('#taxGo')) { act({ type: 'taxBack', cards: [...S.taxSel] }).then((r) => { if (r.ok) { S.taxSel.clear(); SFX.coin(); } }); }
  if (e.target.closest('#revYes')) act({ type: 'revolt', yes: true });
  if (e.target.closest('#revNo')) act({ type: 'revolt', yes: false });
});

/* ── 연출: 카드가 자리에서 탁자로 날아간다 · 말풍선 · 큰 글씨 */
function seatEl(pid) { return document.querySelector(`.seat[data-pid="${pid}"]`); }
function flyCards(fromPid, ranks) {
  const from = fromPid === S.me ? $('#handArea') : seatEl(fromPid);
  const to = $('#table');
  if (!from || !to) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  ranks.forEach((r, i) => {
    const el = document.createElement('div');
    el.innerHTML = cardHtml(r, { w: 96 });
    const svg = el.firstChild;
    $('#fly').appendChild(svg);
    svg.animate([
      { left: `${a.left + a.width / 2 - 48}px`, top: `${a.top + a.height / 2 - 70}px`, transform: 'scale(.5) rotate(-20deg)', opacity: 0.4 },
      { left: `${b.left + b.width / 2 - 48 + (i - (ranks.length - 1) / 2) * 30}px`, top: `${b.top + b.height / 2 - 70}px`, transform: `scale(1.1) rotate(${(i - 1) * 5}deg)`, opacity: 1 },
    ], { duration: 420 + i * 40, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).onfinish = () => svg.remove();
  });
}
function bubble(pid, text) {
  const el = seatEl(pid);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  b.style.left = `${r.left + r.width / 2}px`;
  b.style.top = `${r.bottom + 4}px`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1300);
}
function bigBanner(text, sub = '') {
  const b = document.createElement('div');
  b.className = 'banner-big';
  b.innerHTML = `${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 2300);
}
function playEvents() {
  const g = S.g;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  S.seenSeq = g.seq;
  for (const e of fresh) {
    if (e.type === 'deal') { SFX.draw(); bigBanner(`${e.round}번째 판`, '카드를 나눕니다'); }
    if (e.type === 'play') { SFX.slam(); setTimeout(() => flyCards(e.pid, e.cards.map((c) => c.r)), 30); }
    if (e.type === 'mapae') { SFX.riot(); SFX.slam(); setTimeout(() => flyCards(e.pid, e.cards.map((c) => c.r)), 30); bigBanner('암행어사 출두요!', `${nameOf(e.pid)} 님이 판을 엎었다`); }
    if (e.type === 'pass') { SFX.pass(); setTimeout(() => bubble(e.pid, '패스'), 40); }
    if (e.type === 'clear') SFX.card();
    if (e.type === 'out') { SFX.bells(); setTimeout(() => bubble(e.pid, `${e.place + 1}등!`), 60); }
    if (e.type === 'tax') { SFX.coin(); toast(`<b>${esc(nameOf(e.from))}</b> → <b>${esc(nameOf(e.to))}</b> 세금: ${e.cards.map(rname).join(', ')}`, 'gold'); }
    if (e.type === 'revolution') { SFX.riot(); bigBanner(e.great ? '대혁명!!' : '혁명!', e.great ? '신분이 뒤집혔다' : '이번 판 세금은 없다'); }
    if (e.type === 'roundOver') { SFX.fanfare(); bigBanner(`새 ${D.seatTitle(0, g.players.length, g.edition)}`, nameOf(e.order[0])); }
    if (e.type === 'turn' && e.pid === S.me) SFX.tick();
  }
}

/* ── 기록 · 배너 · 시간 */
function renderLog() {
  const el = $('#tab-log');
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  el.innerHTML = S.g.log.map((l) => `<div class="lg ${l.kind}">${logText(l.text)}</div>`).join('');
  if (atBottom) el.scrollTop = el.scrollHeight;
}
function renderBanner() {
  const g = S.g;
  const txt = { deal: '카드를 나누는 중', revolt: '혁명의 기운…', revolting: '혁명!', tax: '세금 걷기', taxdone: '세금 걷기', play: myTurn() ? '내 차례!' : `${nameOf(g.turn)} 님의 차례`, between: '판 끝', over: '왕좌의 주인이 정해졌다' }[g.phase] || '';
  $('#phaseBanner').innerHTML = `${g.round ? `<span class="rd">${g.round} / ${g.rounds}판</span>` : ''}<span>${esc(txt)}</span><span class="tm" id="tm"></span>`;
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(g.phase === 'over' && S.room.hostPid === S.me);
}
function tickTimer() {
  const g = S.g;
  const bar = $('#timerBar');
  if (!g || !g.deadlineIn || g.phase === 'over') { if (bar) bar.style.width = '0'; const t = $('#tm'); if (t) t.textContent = ''; return; }
  const left = Math.max(0, g.deadlineIn - (Date.now() - S.receivedAt));
  bar.style.width = `${Math.min(100, (left / (g.deadlineTotal || g.deadlineIn)) * 100)}%`;
  const t = $('#tm');
  if (t) t.textContent = `${Math.ceil(left / 1000)}초`;
}
setInterval(tickTimer, 250);

/* ── 결과 · 대관식 영상 */
async function showFilm(force) {
  const g = S.g;
  if (!g || !g.over) return;
  // 새로고침 · 재접속 때 같은 대관식을 또 틀지 않는다
  const key = `dalmuti.film.${g.id}`;
  let seen = S.filmShown === g.id;
  try { seen = seen || sessionStorage.getItem(key) === '1'; } catch (e) { /* 무시 */ }
  if (!force && seen) { if (S.filmShown !== g.id) { S.filmShown = g.id; showResult(); } return; }
  S.filmShown = g.id;
  try { sessionStorage.setItem(key, '1'); } catch (e) { /* 무시 */ }
  const champ = pl(g.over.champion);
  const peon = pl(g.over.peon);
  const rose = g.history.length > 1 && g.history[0].order[g.history[0].order.length - 1] === g.over.champion;
  await playEnding($('#film'), { champion: champ.name, peon: peon.name, rose, sound: SFX, me: g.over.champion === S.me, edition: g.edition });
  showResult();
}
function showResult() {
  const g = S.g;
  if (!g || !g.over) return;
  $('#modalBox').innerHTML = `<h3>왕좌의 주인</h3><div class="standings">${g.over.ranking.map((r, i) => `<div class="row ${i === 0 ? 'first' : ''}">${face(r.pid, 34)}<b>${esc(nameOf(r.pid))}</b><span class="ttl">${i === 0 ? '대달무티' : i === g.over.ranking.length - 1 ? '대농노' : `${i + 1}위`}</span><span class="sc">${r.score}점</span></div>`).join('')}</div>
    <div class="modal-btns"><button class="btn" id="replayBtn">대관식 다시 보기</button><button class="btn btn-gold" data-close>닫기</button></div>`;
  $('#modal').hidden = false;
  $('#modal').dataset.kind = 'result';
}
document.addEventListener('click', (e) => { if (e.target.closest('#replayBtn')) { $('#modal').hidden = true; showFilm(true); } });

/* ── 그리기 */
function render() {
  const name = screenName();
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  $('#backHub').hidden = name === 'game';
  if (name === 'lobby') renderLobby();
  if (name !== 'game') return;
  const g = S.g;
  if (S.gameId !== g.id) {
    S.gameId = g.id;
    S.seenSeq = g.seq;
    S.sel.clear();
    S.taxSel.clear();
    mountChat($('#tab-chat'));
  }
  if (S.edition !== g.edition) { S.edition = g.edition; applyEdition(g.edition || 'classic'); S.handKey = S.tableKey = null; }
  renderCourt();
  renderTable();
  renderHand();
  renderBanner();
  renderLog();
  renderDialogs();
  playEvents();
  tickTimer();
  if (g.phase === 'over') showFilm(false);
}
