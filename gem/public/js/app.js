import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { memberFace } from '/common/avatar.js';
// 찬란한 보석상 - 브라우저 쪽 화면과 조작
const G = window.GEM;
const SFX = window.SFX;
const { COLORS, CARD, NOBLE, GEMS } = G;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };
function token() {
  let t = remembered('gem.token');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    remember('gem.token', t);
  }
  return t;
}
const AV = ['#8a1a2a', '#1a4a8a', '#1a6a3a', '#8a6a1a'];
/** 그 사람이 꾸민 캐릭터 얼굴 (이름으로 방 멤버를 찾는다) */
const avatar = (name) => {
  const m = S.room && S.room.members.find((x) => x.name === name);
  return `<span class="avatar av-in">${memberFace(m || { pid: name })}</span>`;
};
const chipImg = (c, w) => `<img src="assets/chip/${c}.svg" alt="" style="width:${w}px">`;

const S = { me: null, room: null, g: null, gameId: null, seenSeq: 0, sel: {}, tab: 'log', unread: 0, chatLog: [], links: [], overShown: false, receivedAt: 0 };

/* ── 소켓 */
const socket = io('/gem', { auth: { token: token() }, transports: ['websocket', 'polling'] });
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
  setTimeout(() => el.remove(), 3000);
}
const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');

/* ── 시작 화면 · 공용 버튼 */
const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('gem.name');
// 로그인했으면 프로필 닉네임으로 채운다 (이름 안 쳐도 됨) · 이모트 버튼
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []), anchor: (pid) => (pid === S.me ? document.getElementById('me') : null) });
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();
const needName = () => { const n = nameInput.value.trim(); if (!n) { toast('닉네임을 입력하세요', 'err'); return null; } remember('gem.name', n); return n; };
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
  const url = `${location.origin}/gem/?room=${S.room.code}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다', 'gold'); } catch (_) { prompt('이 주소를 친구에게 보내세요', url); }
});
const paintMute = () => $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; });
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
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  $('#seatGrid').innerHTML = Array.from({ length: G.MAX_PLAYERS }, (_, i) => {
    const m = seated[i];
    if (!m) return '<div class="slot empty">빈 자리</div>';
    return `<div class="slot">${host && m.pid !== S.me ? `<button class="btn btn-sm kick" data-kick="${m.pid}">✕</button>` : ''}${avatar(m.name, i)}<b>${esc(m.name)}</b>
      <div>${m.pid === room.hostPid ? '<span class="tag">방장</span>' : ''}${m.isBot ? '<span class="tag">AI</span>' : ''}${m.pid === S.me ? '<span class="tag">나</span>' : ''}</div></div>`;
  }).join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').textContent = specs.length ? `관전: ${specs.map((m) => m.name).join(', ')}` : '';
  const me = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').textContent = me && me.seated ? '관전으로 전환' : '자리에 앉기';
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  $('#startBtn').disabled = seated.length < G.MIN_PLAYERS;
  $('#startHint').textContent = host ? (seated.length < G.MIN_PLAYERS ? `${G.MIN_PLAYERS}명부터 시작할 수 있어요` : `${seated.length}명 · 보석 색마다 ${G.tokenCount(seated.length)}개`) : '방장이 시작하기를 기다리는 중…';
}
$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#addBotBtn').addEventListener('click', () => call('room:addBot'));
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.bell(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ── 게임 도우미 */
const pl = (pid) => S.g.players.find((p) => p.pid === pid);
const me = () => (S.g ? pl(S.me) : null);
const myTurn = () => S.g && S.g.phase === 'play' && S.g.turn === S.me;
const canAct = () => myTurn() && S.g.stage === 'act';
const canBuy = (id) => { const p = me(); return p && G.payment(CARD[id], p.gems, p.bonus); };

/* ── 탁자 */
function renderTable() {
  const g = S.g;
  $('#nobles').innerHTML = g.nobles.map((id) => `<img class="noble" src="assets/noble/${id}.svg" alt="" title="${esc(G.NOBLE_NAMES[NOBLE[id].face])}" data-noble="${id}">`).join('');
  $('#market').innerHTML = [3, 2, 1].map((t) => `<div class="row">
    <div class="deck ${g.deckLeft[t] ? '' : 'empty'}" data-deck="${t}" title="더미 맨 위 카드를 예약"><img src="assets/back/${t}.svg" alt=""><span class="left">${g.deckLeft[t]}장</span></div>
    ${g.market[t].map((id) => (id ? `<div class="gcard ${canAct() && canBuy(id) ? 'can' : ''}" data-card="${id}"><img src="assets/card/${id}.svg" alt=""></div>` : '<div class="gcard slot-empty"></div>')).join('')}
  </div>`).join('');
  const total = Object.values(S.sel).reduce((a, b) => a + b, 0);
  $('#bank').innerHTML = [...COLORS, 'gold'].map((c) => `<div class="chip ${c === 'gold' || !canAct() || g.bank[c] <= (S.sel[c] || 0) ? 'off' : ''} ${S.sel[c] ? 'sel' : ''}" data-chip="${c}" ${S.sel[c] ? `data-sel="${S.sel[c]}"` : ''} title="${GEMS[c].name}">
    <img src="assets/chip/${c}.svg" alt=""><span class="n">${g.bank[c] - (S.sel[c] || 0)}</span></div>`).join('')
    + (total ? `<button class="btn btn-gold btn-sm" id="takeBtn">가져오기</button><button class="btn btn-sm" id="clearSel">취소</button>` : '');
}

function gemsHtml(p, big = false) {
  return `<div class="${big ? 'me-gems' : 'gems'}">${COLORS.map((c) => `<div class="gem-col">
      <div class="bonus" style="background:${GEMS[c].fill};color:${c === 'white' ? '#1a1a24' : '#fff'}">${p.bonus[c]}</div>
      <div class="tok">${chipImg(c, big ? 30 : 20)}${p.gems[c]}</div></div>`).join('')}
    <div class="gem-col"><div class="bonus" style="background:transparent;border-color:transparent"></div><div class="tok">${chipImg('gold', big ? 30 : 20)}${p.gems.gold}</div></div></div>`;
}

function renderPlayers() {
  const g = S.g;
  $('#opponents').innerHTML = g.players.filter((p) => p.pid !== S.me).map((p) => `<div class="pl ${g.turn === p.pid ? 'cur' : ''}" data-pid="${p.pid}">
    <div class="pl-top">${avatar(p.name, p.seat)}<b>${esc(p.name)}${p.isBot ? ' <small>AI</small>' : ''}${p.online ? '' : ' <small>(자리비움)</small>'}</b><span class="pts">${p.points}</span></div>
    ${gemsHtml(p)}
    <div class="mini-row">${p.nobles.map((id) => `<img src="assets/noble/${id}.svg" alt="">`).join('')}${p.reserved.map((x) => (x.hidden ? `<span class="res" style="background-image:url(assets/back/${x.tier}.svg)"></span>` : `<img src="assets/card/${x}.svg" alt="">`)).join('')}</div>
  </div>`).join('');
  const p = me();
  const box = $('#me');
  if (!p) { box.innerHTML = '<div class="me-info"><b>관전 중</b></div>'; return; }
  box.classList.toggle('cur', myTurn());
  const tot = G.total(p.gems);
  let actionHtml = '';
  if (g.phase === 'over') actionHtml = '<p>게임이 끝났습니다.</p><button class="btn btn-gold" id="resultBtn">결과 보기</button>';
  else if (!myTurn()) actionHtml = `<p><b>${esc(pl(g.turn).name)}</b>님의 차례입니다…</p>`;
  else if (g.stage === 'act') actionHtml = '<p><b>내 차례!</b> 보석 칩을 누르거나, 카드를 눌러 사거나 예약하세요.</p>';
  else if (g.stage === 'discard') actionHtml = '<p>보석이 10개를 넘었어요. 버릴 보석을 고르세요.</p><button class="btn btn-red" id="discardBtn">보석 버리기</button>';
  else actionHtml = '<p>귀족 두 명이 찾아왔어요. 한 명을 고르세요.</p><button class="btn btn-gold" id="nobleBtn">귀족 고르기</button>';
  box.innerHTML = `<div class="me-info">${avatar(p.name, p.seat)}<b>${esc(p.name)} (나)</b><span class="pts">${p.points}<small style="font-size:16px"> / ${G.WIN_POINTS}점</small></span><span class="muted">보석 ${tot} / ${G.HAND_LIMIT}</span></div>
    ${gemsHtml(p, true)}
    <div class="me-nobles">${p.nobles.map((id) => `<img src="assets/noble/${id}.svg" alt="">`).join('')}</div>
    <div class="me-res">${p.reserved.map((id) => `<div class="gcard ${canAct() && canBuy(id) ? 'can' : ''}" data-card="${id}" data-mine="1"><img src="assets/card/${id}.svg" alt=""></div>`).join('') || '<span class="muted">예약한 카드 없음</span>'}</div>
    <div class="action">${actionHtml}</div>`;
}

function renderBanner() {
  const g = S.g;
  const el = $('#turnBanner');
  if (g.phase === 'over') { el.innerHTML = '<b>게임 종료</b>'; return; }
  const p = pl(g.turn);
  el.innerHTML = `${g.round}바퀴 · <b>${g.turn === S.me ? '내 차례' : `${esc(p.name)}의 차례`}</b><span class="clock" id="clock"></span>${g.finalRound ? '<span class="final">마지막 바퀴!</span>' : ''}`;
  clearInterval(S.clockT);
  const end = S.receivedAt + (g.deadlineIn || 0);
  const tick = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); const c = $('#clock'); if (c) c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  tick();
  S.clockT = setInterval(tick, 500);
}

/* ── 조작 */
$('#game').addEventListener('click', async (e) => {
  const g = S.g;
  if (!g) return;
  const chip = e.target.closest('[data-chip]');
  if (chip && !chip.classList.contains('off')) return pickChip(chip.dataset.chip);
  if (chip && chip.classList.contains('sel')) return pickChip(chip.dataset.chip);
  if (e.target.closest('#takeBtn')) {
    const r = await act({ type: 'take', gems: S.sel });
    if (r.ok) S.sel = {};
    return render();
  }
  if (e.target.closest('#clearSel')) { S.sel = {}; return render(); }
  const card = e.target.closest('[data-card]');
  if (card) return zoomCard(card.dataset.card, !!card.dataset.mine);
  const deck = e.target.closest('[data-deck]');
  if (deck && canAct()) {
    if (confirm(`${deck.dataset.deck}단계 더미 맨 위 카드를 몰래 예약할까요? (황금 1개를 받아요)`)) act({ type: 'reserve', tier: Number(deck.dataset.deck) });
    return;
  }
  if (e.target.closest('#discardBtn')) return openDiscard();
  if (e.target.closest('#nobleBtn')) return openNobles();
  if (e.target.closest('#resultBtn')) return showOver();
  const noble = e.target.closest('[data-noble]');
  if (noble) {
    const n = NOBLE[noble.dataset.noble];
    toast(`${esc(G.NOBLE_NAMES[n.face])}: ${COLORS.filter((c) => n.req[c]).map((c) => `${GEMS[c].name} 카드 ${n.req[c]}장`).join(', ')}이 있으면 찾아옵니다 (3점)`);
  }
});

function pickChip(c) {
  if (!canAct()) return;
  const sel = { ...S.sel };
  const kinds = Object.keys(sel);
  const n = Object.values(sel).reduce((a, b) => a + b, 0);
  if (sel[c]) {
    // 같은 색을 한 번 더 누르면 2개 (다른 색이 없고 은행에 4개 이상일 때), 아니면 선택 취소
    if (sel[c] === 1 && kinds.length === 1 && S.g.bank[c] >= 4) sel[c] = 2;
    else delete sel[c];
  } else {
    if (Object.values(sel).some((v) => v === 2)) return toast('같은 색 2개를 고른 뒤에는 다른 색을 더할 수 없어요', 'err');
    if (n >= 3) return toast('서로 다른 색은 3개까지예요', 'err');
    sel[c] = 1;
  }
  SFX.click();
  S.sel = sel;
  renderTable();
}

function zoomCard(id, mine) {
  const c = CARD[id];
  const p = me();
  const pay = p && G.payment(c, p.gems, p.bonus);
  const act2 = canAct();
  const inMarket = [1, 2, 3].some((t) => S.g.market[t].includes(id));
  openModal(`<div class="zoom"><img src="assets/card/${id}.svg" alt=""><div class="info">
    <h3 class="m-title">${GEMS[c.bonus].name} 카드 · ${G.TIER_NAME[c.tier]}</h3>
    <p>점수 <b>${c.points}</b> · 사면 앞으로 ${GEMS[c.bonus].name} 1개를 영구히 할인받아요.</p>
    <p>비용: ${COLORS.filter((k) => c.cost[k]).map((k) => `${GEMS[k].name} ${c.cost[k]}`).join(', ')}</p>
    ${pay ? `<p>낼 보석:</p><div class="pay">${[...COLORS, 'gold'].filter((k) => pay[k]).map((k) => `<span class="tok">${chipImg(k, 26)}×${pay[k]}</span>`).join('') || '<span class="muted">공짜! (보너스로 충분)</span>'}</div>` : '<p class="muted">보석이 모자라요.</p>'}
  </div></div>
  <div class="m-actions">
    ${act2 && pay ? '<button class="btn btn-gold" data-do="buy">구입하기</button>' : ''}
    ${act2 && inMarket && p.reserved.length < G.RESERVE_LIMIT ? `<button class="btn" data-do="reserve">예약하기${S.g.bank.gold ? ' (+황금 1)' : ''}</button>` : ''}
    <button class="btn" data-close>닫기</button>
  </div>`);
  $$('[data-do]', $('#modalBox')).forEach((b) => b.addEventListener('click', async () => {
    const r = await act(b.dataset.do === 'buy' ? { type: 'buy', card: id } : { type: 'reserve', card: id });
    if (r.ok) closeModal();
  }));
}

function openDiscard() {
  const p = me();
  const need = G.total(p.gems) - G.HAND_LIMIT;
  const pick = { ...G.emptyGems(true) };
  const draw = () => {
    const n = G.total(pick);
    openModal(`<h3 class="m-title">보석 버리기 (${n} / ${need})</h3>
      <div class="steppers">${[...COLORS, 'gold'].map((c) => `<div class="stepper">${chipImg(c, 56)}<div class="row2"><button data-d="-1" data-c="${c}" ${pick[c] ? '' : 'disabled'}>−</button><b>${pick[c]}</b><button data-d="1" data-c="${c}" ${pick[c] < p.gems[c] && n < need ? '' : 'disabled'}>+</button></div><small class="muted">가진 것 ${p.gems[c]}</small></div>`).join('')}</div>
      <div class="m-actions"><button class="btn btn-red" id="dOk" ${n === need ? '' : 'disabled'}>버리기</button></div>`, true);
    $$('[data-c]', $('#modalBox')).forEach((b) => b.addEventListener('click', () => { pick[b.dataset.c] += Number(b.dataset.d); draw(); }));
    $('#dOk').addEventListener('click', async () => { const r = await act({ type: 'discard', gems: pick }); if (r.ok) closeModal(); });
  };
  draw();
}

function openNobles() {
  openModal(`<h3 class="m-title">어느 귀족을 맞이할까요?</h3><div class="pick-nobles">${S.g.pendingNobles.map((id) => `<img src="assets/noble/${id}.svg" data-pick="${id}" alt="">`).join('')}</div>`, true);
  $$('[data-pick]', $('#modalBox')).forEach((b) => b.addEventListener('click', async () => { const r = await act({ type: 'noble', id: b.dataset.pick }); if (r.ok) closeModal(); }));
}

/* ── 모달 · 룰 · 결과 */
const modal = $('#modal');
let modalLock = false;
function openModal(html, lock = false, wide = false) { $('#modalBox').className = `modal-box ${wide ? 'wide' : ''}`; $('#modalBox').innerHTML = html; modal.hidden = false; modalLock = lock; }
function closeModal() { modal.hidden = true; modalLock = false; }
modal.addEventListener('click', (e) => { if ((e.target === modal && !modalLock) || e.target.closest('[data-close]')) closeModal(); });

fetch('/api/games').then((r) => r.json()).then((d) => { const g = (d.games || []).find((x) => x.id === 'gem'); S.links = g ? g.links : []; }).catch(() => {});
function showRules() {
  openModal(`<h3 class="m-title">찬란한 보석상 게임 방법</h3><div class="rules">
    ${S.links.length ? `<p>영상으로 보면 쉬워요 (규칙은 스플렌더와 같아요):<br>${S.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">▶ ${esc(l.title)}</a>`).join('<br>')}</p>` : ''}
    <h4>목표</h4><p>누군가 <b>15점</b>을 넘으면 그 바퀴를 끝까지 하고, 가장 점수가 높은 사람이 이깁니다 (같으면 카드를 적게 산 사람).</p>
    <h4>내 차례에는 넷 중 하나</h4><ol>
      <li><b>서로 다른 색 보석 3개</b>를 가져온다.</li>
      <li><b>같은 색 보석 2개</b>를 가져온다 (은행에 그 색이 4개 이상일 때만).</li>
      <li><b>카드를 예약</b>한다 (최대 3장). 황금 1개를 받는다 — 황금은 아무 색으로 쓸 수 있어요.</li>
      <li><b>카드를 산다</b> (시장이나 내 예약 카드). 산 카드의 보석은 앞으로 계속 1개씩 할인됩니다.</li></ol>
    <h4>그 밖에</h4><p>보석은 10개까지만 가질 수 있어요. 카드 보석(보너스)이 조건을 채우면 차례 끝에 <b>귀족</b>이 찾아와 3점을 줍니다.</p>
  </div><div class="m-actions"><button class="btn" data-close>닫기</button></div>`, false, true);
}
$$('[data-rules]').forEach((b) => b.addEventListener('click', showRules));

function showOver() {
  const o = S.g.over;
  if (!o) return;
  const won = o.winners.includes(S.me);
  openModal(`<h3 class="m-title" style="text-align:center;font-size:34px">${o.winners.map((w) => esc(pl(w).name)).join(', ')} 승리!</h3>
    <p style="text-align:center">${won ? '축하합니다! 가장 찬란한 보석상이 되었어요.' : '다음 거래에서 만회하세요!'}</p>
    <div class="over-grid">${o.scores.map((s) => `<div class="over-p ${o.winners.includes(s.pid) ? 'win' : ''}">${avatar(pl(s.pid).name, pl(s.pid).seat)}<div><b>${esc(pl(s.pid).name)}</b></div><div class="pts">${s.points}</div><small class="muted">카드 ${s.cards}장 · 귀족 ${s.nobles}명</small></div>`).join('')}</div>
    <div class="m-actions">${S.room.hostPid === S.me ? '<button class="btn btn-gold" id="againBtn">한 판 더</button>' : ''}<button class="btn" data-close>닫기</button></div>`, false, true);
  $('#againBtn')?.addEventListener('click', () => { closeModal(); call('room:start'); });
  if (won) SFX.win(); else SFX.lose();
}

/* ── 움직임: 칩과 카드가 날아간다 */
function rectOf(sel) { const el = typeof sel === 'string' ? $(sel) : sel; return el ? el.getBoundingClientRect() : null; }
function fly(src, from, to, w, delay = 0) {
  if (!from || !to) return;
  const img = document.createElement('img');
  img.src = src;
  img.style.width = `${w}px`;
  $('#fly').appendChild(img);
  const a = [from.left + from.width / 2 - w / 2, from.top + from.height / 2 - w / 2];
  const b = [to.left + to.width / 2 - w / 2, to.top + to.height / 2 - w / 2];
  img.animate([{ transform: `translate(${a[0]}px, ${a[1]}px) scale(1)` }, { transform: `translate(${(a[0] + b[0]) / 2}px, ${Math.min(a[1], b[1]) - 60}px) scale(1.15)`, offset: 0.5 }, { transform: `translate(${b[0]}px, ${b[1]}px) scale(.8)`, opacity: 0.9 }],
    { duration: 650, delay, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' }).onfinish = () => img.remove();
}
const playerBox = (pid) => (pid === S.me ? $('#me') : $$('#opponents .pl')[S.g.players.filter((p) => p.pid !== S.me).findIndex((p) => p.pid === pid)]);

function playEvents(before) {
  const g = S.g;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  if (!fresh.length) return;
  S.seenSeq = g.events[g.events.length - 1].seq;
  if (fresh.length > 6) return;
  for (const e of fresh) {
    const to = rectOf(playerBox(e.pid));
    if (e.type === 'take') {
      let i = 0;
      for (const c of COLORS) for (let k = 0; k < (e.gems[c] || 0); k++) fly(`assets/chip/${c}.svg`, before.chips[c], to, 56, (i++) * 90);
      SFX.card();
    }
    if (e.type === 'buy') {
      fly(`assets/card/${e.card}.svg`, before.cards[e.card] || rectOf('#market'), to, 110);
      SFX.clank();
      if (e.pid === S.me) toast('카드를 샀어요!', 'gold');
    }
    if (e.type === 'reserve') {
      fly(e.card ? `assets/card/${e.card}.svg` : `assets/back/${e.tier}.svg`, e.card ? before.cards[e.card] : before.decks[e.tier], to, 100);
      if (e.gold) fly('assets/chip/gold.svg', before.chips.gold, to, 56, 150);
      SFX.draw();
    }
    if (e.type === 'noble') {
      fly(`assets/noble/${e.id}.svg`, before.nobles[e.id] || rectOf('#nobles'), to, 120);
      SFX.bell();
      toast(`${esc(G.NOBLE_NAMES[NOBLE[e.id].face])}이(가) ${esc(pl(e.pid).name)}님을 찾아왔습니다! (+3점)`, 'gold');
    }
    if (e.type === 'turn' && e.pid === S.me) { SFX.turn(); toast('내 차례입니다!', 'gold'); }
    if (e.type === 'final') toast(`${esc(pl(e.pid).name)}님이 ${G.WIN_POINTS}점을 넘었어요! 이번 바퀴가 마지막입니다.`, 'gold');
  }
}
function snapshot() {
  const s = { chips: {}, cards: {}, decks: {}, nobles: {} };
  $$('#bank [data-chip]').forEach((el) => { s.chips[el.dataset.chip] = el.getBoundingClientRect(); });
  $$('#market [data-card]').forEach((el) => { s.cards[el.dataset.card] = el.getBoundingClientRect(); });
  $$('#me [data-card]').forEach((el) => { s.cards[el.dataset.card] = el.getBoundingClientRect(); });
  $$('#market [data-deck]').forEach((el) => { s.decks[el.dataset.deck] = el.getBoundingClientRect(); });
  $$('#nobles [data-noble]').forEach((el) => { s.nobles[el.dataset.noble] = el.getBoundingClientRect(); });
  return s;
}

/* ── 전체 그리기 */
function render() {
  const name = screenName();
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  document.body.dataset.screen = name;
  if (name === 'home') return;
  if (name === 'lobby') { S.gameId = null; renderLobby(); return; }
  const g = S.g;
  mountChat($('#tab-chat'));
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(S.room.hostPid === S.me && g.phase === 'over');
  if (S.gameId !== g.id) {
    S.gameId = g.id;
    S.seenSeq = g.events.length ? g.events[g.events.length - 1].seq : 0;
    S.overShown = false;
    S.sel = {};
  }
  if (!canAct()) S.sel = {};
  const before = snapshot();
  renderTable();
  renderPlayers();
  renderBanner();
  $('#tab-log').innerHTML = g.log.map((l) => `<div class="log-row">${esc(l)}</div>`).join('');
  $('#tab-log').scrollTop = $('#tab-log').scrollHeight;
  playEvents(before);
  if (myTurn() && g.stage === 'noble' && modal.hidden) openNobles();
  if (myTurn() && g.stage === 'discard' && modal.hidden) openDiscard();
  if (g.phase === 'over' && !S.overShown) { S.overShown = true; setTimeout(showOver, 900); }
}

document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
render();
