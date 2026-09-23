import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { watchConnection } from '/common/net.js';
import { memberFace } from '/common/avatar.js';
// 바퀴벌레 포커 - 브라우저 쪽 화면과 조작
const R = window.ROACH;
const C = window.RCARD;
const SFX = window.SFX;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };
function token() {
  let t = remembered('roach.token');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    remember('roach.token', t);
  }
  return t;
}
const avatar = (name) => {
  const m = S.room && S.room.members.find((x) => x.name === name);
  return `<span class="avatar">${memberFace(m || { pid: name })}</span>`;
};
const kname = (k) => (R.KIND[k] ? R.KIND[k].name : '?');

const S = { me: null, room: null, g: null, gameId: null, seenSeq: 0, sel: {}, tab: 'log', unread: 0, chatLog: [], overShown: false, revealing: false };

/* ── 소켓 */
const keeper = roomKeeper('roach');
const socket = io('/roach', { auth: (cb) => cb({ token: token(), save: keeper.get() }), transports: ['websocket', 'polling'] });
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
socket.on('room', (room) => { S.room = room; S.g = room && room.game; render(); });
// 서버 답을 영원히 기다리지 않는다
const emit = (ev, d) => new Promise((res) => {
  let done = false;
  const tm = setTimeout(() => { if (!done) { done = true; res({ ok: false, slow: true, error: '서버 응답이 늦어요. 잠시 뒤 다시 눌러 주세요' }); } }, 10_000);
  socket.emit(ev, d, (r) => { if (done) return; done = true; clearTimeout(tm); res(r || { ok: true }); });
});
async function call(ev, d) { const r = await emit(ev, d); if (!r.ok && r.error) toast(esc(r.error), 'err'); return r; }
async function act(a) { const r = await emit('game:act', a); if (!r.ok && r.error) { toast(esc(r.error), 'err'); SFX.alarm(); } return r; }

function toast(html, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');

/* ── 시작 화면 · 공용 버튼 */
const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('roach.name');
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []), anchor: (pid) => (pid === S.me ? document.getElementById('me') : null) });
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();
const needName = () => { const n = nameInput.value.trim(); if (!n) { toast('닉네임을 입력하세요', 'err'); return null; } remember('roach.name', n); return n; };
$('#createBtn').addEventListener('click', () => { const n = needName(); if (n) { SFX.unlock(); call('room:create', { name: n }); } });
const doJoin = () => { const n = needName(); const c = codeInput.value.trim().toUpperCase(); if (n && c.length === 4) { SFX.unlock(); call('room:join', { name: n, code: c }); } };
$('#joinBtn').addEventListener('click', doJoin);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
$$('[data-leave]').forEach((b) => b.addEventListener('click', () => {
  if (S.g && S.g.phase === 'play' && !confirm('게임 중입니다. 정말 나가시겠어요? (자리는 AI가 대신 맡습니다)')) return;
  socket.emit('room:leave');
}));
$('#backHub').addEventListener('click', () => { if (S.room) socket.emit('room:leave'); });
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/roach/?room=${S.room.code}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다', 'gold'); } catch (_) { prompt('이 주소를 친구에게 보내세요', url); }
});
const paintMute = () => $$('[data-mute]').forEach((b) => { b.textContent = SFX.muted ? '♬̸' : '♪'; });
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => { SFX.setMuted(!SFX.muted); paintMute(); }));
paintMute();

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
    if (!log) continue;
    log.innerHTML = S.chatLog.map((m) => (m.system ? `<div class="cmsg sys">${esc(m.text)}</div>` : `<div class="cmsg"><b>${esc(m.name)}</b> ${esc(m.text)}</div>`)).join('');
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
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  $('#seatGrid').innerHTML = Array.from({ length: R.MAX_PLAYERS }, (_, i) => {
    const m = seated[i];
    if (!m) return '<div class="seat off"><span class="avatar"></span><b>빈 자리</b></div>';
    return `<div class="seat ${m.pid === room.hostPid ? 'host' : ''} ${m.online === false ? 'off' : ''}">${avatar(m.name)}<b>${esc(m.name)}</b>
      <span class="tag">${m.pid === room.hostPid ? '방장' : m.isBot ? 'AI' : m.pid === S.me ? '나' : '타짜'}</span>
      ${host && m.pid !== S.me ? `<button class="btn btn-sm" data-kick="${m.pid}">✕</button>` : ''}</div>`;
  }).join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').textContent = specs.length ? `관전: ${specs.map((m) => m.name).join(', ')}` : '';
  const m0 = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').textContent = m0 && m0.seated ? '관전으로 전환' : '자리에 앉기';
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  $('#startBtn').disabled = seated.length < R.MIN_PLAYERS;
  const each = Math.floor(R.DECK.length / Math.max(1, seated.length));
  $('#startHint').textContent = host
    ? (seated.length < R.MIN_PLAYERS ? `${R.MIN_PLAYERS}명부터 시작할 수 있어요` : `${seated.length}명 · 한 사람당 ${each}장씩`)
    : '방장이 시작하기를 기다리는 중…';
}
$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#addBotBtn').addEventListener('click', () => call('room:addBot'));
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.bell(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ── 게임 도우미 */
const pl = (pid) => S.g.players.find((p) => p.pid === pid);
const me = () => (S.g ? pl(S.me) : null);
const playing = () => S.g && S.g.phase === 'play';
const iOffer = () => playing() && S.g.stage === 'offer' && S.g.turn === S.me;
const iReply = () => playing() && S.g.stage === 'reply' && S.g.pending && S.g.pending.to === S.me;
/** 지금 카드를 넘길 수 있는 사람들 */
function targets() {
  const g = S.g;
  const pd = g.pending;
  return g.players.filter((p) => p.pid !== S.me && !p.dead && (!pd || !pd.seen.includes(p.pid)));
}

/* ── 자리(상대) */
function pileHtml(p) {
  const ks = R.KIND_IDS.filter((k) => p.tally[k]);
  if (!ks.length) return '<div class="pile"><span class="muted" style="font-size:12px">앞에 깔린 카드 없음</span></div>';
  return `<div class="pile">${ks.map((k) => `<span class="pc n${p.tally[k]}" title="${kname(k)} ${p.tally[k]}장">${C.icon(k, R.KIND[k].light)}<i>${p.tally[k]}</i></span>`).join('')}</div>`;
}
function renderSeats() {
  const g = S.g;
  const pick = (iOffer() && S.sel.card) || (iReply() && g.pending.peeked);
  const able = new Set(targets().map((p) => p.pid));
  $('#seats').innerHTML = g.players.filter((p) => p.pid !== S.me).map((p) => `
    <div class="pl ${g.actor === p.pid ? 'turn' : ''} ${p.online ? '' : 'off'} ${p.dead ? 'dead' : ''} ${pick && able.has(p.pid) ? 'target' : ''} ${S.sel.to === p.pid ? 'picked' : ''}" data-to="${p.pid}">
      <div class="pl-top">${avatar(p.name)}<span class="nm">${esc(p.name)}</span>${p.isBot ? '<span class="bot">AI</span>' : ''}${p.online ? '' : '<span class="bot">자리비움</span>'}
        <span class="pl-hand">손패 <b>${p.hand}</b></span></div>
      ${pileHtml(p)}
    </div>`).join('');
}

/* ── 가운데 */
function claimsHtml(sel) {
  return `<div class="claims">${R.KIND_IDS.map((k) => `<button class="claim ${sel === k ? 'on' : ''}" data-claim="${k}">${C.icon(k, R.KIND[k].light)}<span>${kname(k)}</span></button>`).join('')}</div>`;
}
function renderCenter() {
  const g = S.g;
  const box = $('#center');
  const pd = g.pending;
  if (g.phase === 'over') {
    const lo = pl(g.over.loser);
    box.innerHTML = `<div class="speech">${esc(lo.name)}님이 벌레를 다 뒤집어썼습니다!<small>${esc(g.over.why)}</small></div>
      <button class="btn btn-gold btn-lg" id="resultBtn">결과 보기</button>`;
    return;
  }
  if (!pd) {
    // 미는 차례
    if (iOffer()) {
      const ok = S.sel.card && S.sel.to && S.sel.claim;
      box.innerHTML = `<div class="speech">내 차례 — 카드를 골라 엎어서 밀자<small>아래 손패에서 카드 → 위에서 받을 사람 → 무슨 벌레라고 할지</small></div>
        <div class="hintline">${S.sel.card ? `고른 카드: <b>비밀</b>` : '① 손패에서 카드를 고르세요'} · ${S.sel.to ? `받을 사람: <b>${esc(pl(S.sel.to).name)}</b>` : '② 받을 사람을 누르세요'} · ${S.sel.claim ? `내 말: <b>“${kname(S.sel.claim)}야”</b>` : '③ 뭐라고 할지 고르세요'}</div>
        ${claimsHtml(S.sel.claim)}
        <div class="acts"><button class="btn btn-gold btn-lg" id="offerBtn" ${ok ? '' : 'disabled'}>엎어서 밀기</button>
          ${S.sel.card || S.sel.to || S.sel.claim ? '<button class="btn" id="clearSel">다시 고르기</button>' : ''}</div>`;
      return;
    }
    const who = pl(g.turn);
    box.innerHTML = `<div class="waiting"><span class="dots">${esc(who.name)}님이 카드를 고르는 중</span></div>
      <div class="pcard">${C.backSvg()}</div>`;
    return;
  }
  const from = pl(pd.from);
  const to = pl(pd.to);
  const bubble = `<div class="speech"><b>${esc(from.name)}</b> → <b>${esc(to.name)}</b> : “이건 <span class="kn">${kname(pd.claim)}</span>야”${pd.hops ? `<small>${pd.hops}번 떠넘겨진 카드</small>` : ''}</div>`;
  if (iReply()) {
    const shown = pd.card ? C.cardSvg(pd.card) : C.backSvg();
    const ok = S.sel.to && S.sel.claim;
    box.innerHTML = `${bubble}
      <div class="pcard fly">${shown}</div>
      ${pd.peeked
    ? `<div class="hintline">진짜는 <b>${kname(R.kindOf(pd.card))}</b>. 그대로 답하거나, 다른 사람에게 떠넘기세요</div>
         ${claimsHtml(S.sel.claim)}
         <div class="acts">
           <button class="btn btn-green btn-lg" data-guess="1">맞다</button>
           <button class="btn btn-red btn-lg" data-guess="0">아니다</button>
           <button class="btn btn-gold btn-lg" id="passBtn" ${ok ? '' : 'disabled'}>${S.sel.to ? `${esc(pl(S.sel.to).name)}에게 떠넘기기` : '떠넘기기'}</button>
         </div>`
    : `<div class="acts">
           <button class="btn btn-green btn-lg" data-guess="1">맞다</button>
           <button class="btn btn-red btn-lg" data-guess="0">아니다</button>
           ${pd.canPass ? '<button class="btn btn-lg" id="peekBtn">몰래 보기</button>' : '<span class="hintline">모두가 이미 본 카드 — 직접 답해야 합니다</span>'}
         </div>`}`;
    return;
  }
  box.innerHTML = `${bubble}
    <div class="pcard fly">${C.backSvg()}</div>
    <div class="waiting"><span class="dots">${esc(to.name)}님이 고민하는 중</span></div>`;
}

/* ── 내 자리 */
function renderMe() {
  const g = S.g;
  const p = me();
  const box = $('#me');
  if (!p) { box.innerHTML = '<div class="me-info"><b>관전 중</b></div>'; return; }
  const locked = !(iOffer() && !g.pending);
  box.innerHTML = `
    <div class="me-info">${avatar(p.name)}<b>${esc(p.name)} (나)</b>
      <span class="muted">손패 ${p.hand}장</span>
      ${pileHtml(p)}
      ${p.danger.length ? `<span style="color:#ff9a7a;font-weight:800">${p.danger.map(kname).join(' · ')} 한 장만 더 받으면 패배!</span>` : ''}
    </div>
    <div class="hand ${locked ? 'locked' : ''}" id="hand">${g.hand.map((id) => `<div class="hcard ${S.sel.card === id ? 'on' : ''}" data-card="${id}">${C.cardSvg(id)}</div>`).join('')}</div>`;
}

function renderBanner() {
  const g = S.g;
  const el = $('#turnBanner');
  if (g.phase === 'over') { el.innerHTML = '<b>게임 종료</b>'; return; }
  const who = g.actor ? pl(g.actor) : pl(g.turn);
  const mine = g.actor === S.me;
  el.innerHTML = `${g.round}번째 판 · <span class="who">${mine ? '내 차례!' : `${esc(who.name)}`}</span>
    <span class="tbar" id="tbar"><i style="width:100%"></i></span>`;
}
let clockTimer = null;
function tickClock() {
  clearInterval(clockTimer);
  const g = S.g;
  if (!g || g.phase !== 'play' || !g.deadlineIn) return;
  const end = Date.now() + g.deadlineIn;
  const total = g.deadlineTotal || g.deadlineIn;
  clockTimer = setInterval(() => {
    const bar = $('#tbar');
    if (!bar) return clearInterval(clockTimer);
    const left = Math.max(0, end - Date.now());
    const i = $('i', bar);
    if (i) i.style.width = `${(left / total) * 100}%`;
    bar.classList.toggle('warn', left < total * 0.35);
    return null;
  }, 120);
}

/* ── 연출: 카드 뒤집기 */
function showReveal(ev) {
  const lo = pl(ev.loser);
  const truth = ev.kind === ev.claim;
  document.querySelectorAll('.reveal-wrap').forEach((x) => x.remove());
  const wrap = document.createElement('div');
  wrap.className = 'reveal-wrap';
  wrap.innerHTML = `<div class="reveal-who">“${kname(ev.claim)}”라고 했는데…</div>
    ${C.cardSvg(ev.card)}
    <div class="stamp ${truth ? 'truth' : 'lie'}">${truth ? '진짜다!' : '거짓말!'}</div>
    <div class="reveal-who">${esc(lo.name)}님이 ${kname(ev.kind)} 카드를 가져갑니다</div>`;
  document.body.appendChild(wrap);
  SFX.flip();
  setTimeout(() => { SFX[truth ? 'bell' : 'clank'](); }, 420);
  setTimeout(() => { wrap.style.transition = 'opacity .3s'; wrap.style.opacity = '0'; setTimeout(() => wrap.remove(), 320); }, 2200);
}

function handleEvents() {
  const g = S.g;
  if (!g) return;
  if (S.gameId !== g.id) { S.gameId = g.id; S.seenSeq = 0; S.overShown = false; S.sel = {}; }
  for (const ev of g.events || []) {
    if (ev.seq <= S.seenSeq) continue;
    S.seenSeq = ev.seq;
    if (ev.type === 'offer') { SFX.card(); if (ev.to === S.me) SFX.turn(); }
    else if (ev.type === 'peek') SFX.draw();
    else if (ev.type === 'reveal') showReveal(ev);
    else if (ev.type === 'over') setTimeout(() => { SFX[ev.loser === S.me ? 'lose' : 'win'](); }, 2300);
  }
}

/* ── 결말 영상 → 결과 */
async function playEndFilm() {
  const g = S.g;
  if (!g || !g.over) return;
  const lo = pl(g.over.loser);
  const wins = g.players.filter((p) => p.pid !== g.over.loser).map((p) => p.name);
  const last = (g.reveal && g.reveal.claim) ? kname(g.reveal.claim) : '파리';
  const liar = (g.reveal && pl(g.reveal.from)) ? pl(g.reveal.from).name : '맞은편 타짜';
  try {
    const m = await import('./ending.js');
    await m.playEnding($('#film'), { loser: lo.name, winners: wins.join(' · '), claim: last, liar, sound: SFX });
  } catch (e) { /* 영상이 안 되면 그냥 결과로 */ }
  showResult();
}

/* ── 결과 */
function showResult() {
  const g = S.g;
  const o = g.over;
  const lo = pl(o.loser);
  const rows = o.scores.slice().sort((a, b) => (a.pid === o.loser ? 1 : 0) - (b.pid === o.loser ? 1 : 0) || b.caught - a.caught);
  openModal(`<h3>판 끝!</h3>
    <div class="over-loser">${avatar(lo.name)}<div><div class="big">${esc(lo.name)} 패배</div><div>${esc(o.why)}</div></div></div>
    <table class="score"><tr><th>타짜</th><th>앞에 깔린 벌레</th><th>남은 손패</th><th>간파</th><th>속임</th></tr>
      ${rows.map((s) => `<tr class="${s.pid === o.loser ? '' : 'win'}"><td>${esc(s.name)}${s.pid === o.loser ? ' <b>(패)</b>' : ''}</td>
        <td>${R.KIND_IDS.filter((k) => R.tally(s.pile)[k]).map((k) => `${kname(k)}×${R.tally(s.pile)[k]}`).join(', ') || '-'}</td>
        <td>${s.hand}장</td><td>${s.caught}회</td><td>${s.fooled}회</td></tr>`).join('')}
    </table>
    <p class="muted" style="margin-top:12px">방장이 “대기실로”를 누르면 새 판을 시작할 수 있습니다.</p>`);
}

/* ── 모달 */
function openModal(html) {
  $('#modalBox').innerHTML = `${html}<div style="text-align:right;margin-top:14px"><button class="btn btn-gold" id="modalClose">닫기</button></div>`;
  $('#modal').hidden = false;
  $('#modalClose').onclick = () => { $('#modal').hidden = true; };
}
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('#modal').hidden = true; });
const RULES = `<h3>바퀴벌레 포커 — 이렇게 합니다</h3>
  <p>벌레 8종이 8장씩, 모두 64장. 시작할 때 똑같이 나눠 가집니다.</p>
  <h4>내 차례</h4>
  <p>손패에서 한 장을 <b>엎어서</b> 아무에게나 밀면서 <b>“이건 OO야”</b> 라고 말합니다. 진실이든 거짓이든 마음대로.</p>
  <h4>받은 사람</h4>
  <ul>
    <li><b>맞다 / 아니다</b> — 카드를 뒤집습니다. 제대로 읽었으면 <b>민 사람</b>이, 틀렸으면 <b>내가</b> 그 카드를 앞에 펼쳐 놓습니다.</li>
    <li><b>몰래 보기 → 떠넘기기</b> — 나만 보고, 아직 그 카드를 보지 않은 사람에게 새 이름을 붙여 다시 밉니다. 모두가 봤다면 반드시 답해야 합니다.</li>
  </ul>
  <h4>지는 사람</h4>
  <p>앞에 <b>같은 벌레 4장</b>이 깔리면 그 사람이 집니다. 자기 차례에 <b>손패가 없어도</b> 집니다. 나머지는 모두 승리!</p>
  <p class="muted">카드를 받은 사람이 다음 차례를 시작합니다.</p>`;
$$('[data-rules]').forEach((b) => b.addEventListener('click', () => openModal(RULES)));

/* ── 조작 */
$('#me').addEventListener('click', (e) => {
  const c = e.target.closest('[data-card]');
  if (!c || !iOffer() || S.g.pending) return;
  S.sel.card = S.sel.card === c.dataset.card ? null : c.dataset.card;
  SFX.click();
  render();
});
$('#seats').addEventListener('click', (e) => {
  const t = e.target.closest('[data-to]');
  if (!t) return;
  const able = targets().some((p) => p.pid === t.dataset.to);
  if (!able) return;
  if (!(iOffer() || (iReply() && S.g.pending.peeked))) return;
  S.sel.to = S.sel.to === t.dataset.to ? null : t.dataset.to;
  SFX.click();
  render();
});
$('#center').addEventListener('click', async (e) => {
  const cl = e.target.closest('[data-claim]');
  if (cl) { S.sel.claim = S.sel.claim === cl.dataset.claim ? null : cl.dataset.claim; SFX.click(); return render(); }
  const g = e.target.closest('[data-guess]');
  if (g) { SFX.flip(); return act({ type: 'guess', believe: g.dataset.guess === '1' }); }
  if (e.target.closest('#peekBtn')) { SFX.draw(); return act({ type: 'peek' }); }
  if (e.target.closest('#offerBtn')) {
    const r = await act({ type: 'offer', card: S.sel.card, to: S.sel.to, claim: S.sel.claim });
    if (r.ok) { S.sel = {}; SFX.card(); }
    return null;
  }
  if (e.target.closest('#passBtn')) {
    const r = await act({ type: 'pass', to: S.sel.to, claim: S.sel.claim });
    if (r.ok) { S.sel = {}; SFX.card(); }
    return null;
  }
  if (e.target.closest('#clearSel')) { S.sel = {}; return render(); }
  if (e.target.closest('#resultBtn')) return showResult();
  return null;
});

/* ── 그리기 */
function render() {
  const name = screenName();
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  if (name === 'home') return;
  if (name === 'lobby') { renderLobby(); return; }
  const g = S.g;
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(S.room.hostPid === S.me && g.phase === 'over');
  mountChat($('#tab-chat'));
  handleEvents();
  // 내 차례가 아닌데 골라 둔 게 남아 있으면 지운다
  if (!iOffer() && !(iReply() && g.pending && g.pending.peeked) && (S.sel.card || S.sel.to || S.sel.claim)) S.sel = {};
  renderBanner();
  renderSeats();
  renderCenter();
  renderMe();
  $('#tab-log').innerHTML = (g.log || []).slice(-40).reverse().map((l) => `<div class="logline">${esc(l)}</div>`).join('');
  tickClock();
  if (g.phase === 'over' && !S.overShown) { S.overShown = true; setTimeout(playEndFilm, 2400); }
}
render();
