// 보름밤의 늑대인간 - 브라우저 쪽 화면과 조작
import { playCutscene } from './cutscene.js';

const W = window.WOLF;
const SFX = window.SFX;
const { ROLES } = W;

/* ═════════════════════════ 작은 도구 ═════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n) => `<i class="ic ic-${n}"></i>`;
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };

function token() {
  let t = remembered('wolf.token', '');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    remember('wolf.token', t);
  }
  return t;
}

const AV_COLORS = ['#b8322a', '#2a6ab8', '#3a8a4a', '#c8902a', '#7a3aa8', '#2a9a9a', '#c85a8a', '#6a6a2a', '#8a4a2a', '#4a5ab8'];
const avatar = (name, i, size = 54) => `<span class="avatar" style="background:${AV_COLORS[i % AV_COLORS.length]};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px">${esc(String(name || '?').slice(0, 1))}</span>`;
const TEAM_NAME = { village: '마을 편', wolf: '늑대 편', tanner: '혼자만의 편' };

function roleCard(role, { w = 120, cls = '', attrs = '' } = {}) {
  const R = ROLES[role];
  return `<div class="card ${cls}" style="--w:${w}px;--c:${R.color}" data-role="${role}" ${attrs}>
    <div class="c-art"><img src="assets/role/${role}.svg" alt=""><span class="c-team ${R.team}">${TEAM_NAME[R.team]}</span></div>
    <div class="c-name">${R.name}<small>${R.en}</small></div>
  </div>`;
}
const backCard = (w = 100, cls = '', attrs = '') => `<div class="card back ${cls}" style="--w:${w}px" ${attrs}></div>`;

/* ═════════════════════════ 상태 ═════════════════════════ */

const S = {
  me: null, room: null, g: null, gameId: null, seenSeq: 0,
  sel: [], tab: 'chat', unread: 0, chatLog: [],
  lookShown: false, overPlayed: false, receivedAt: 0,
  draft: null, links: [], lastStep: null,
};

/* ═════════════════════════ 소켓 ═════════════════════════ */

const socket = io('/wolf', { auth: { token: token() }, transports: ['websocket', 'polling'] });
const conn = $('#conn');
let connTimer = null;
const setConn = (html) => { conn.hidden = !html; if (html) conn.innerHTML = html; };
socket.on('connect', () => { clearTimeout(connTimer); setConn(''); });
socket.on('disconnect', () => { clearTimeout(connTimer); connTimer = setTimeout(() => setConn('서버와 연결이 끊겼습니다. <b>다시 연결하는 중…</b>'), 3000); });
socket.on('replaced', () => setConn('다른 창에서 접속해서 이 창의 연결이 끊겼습니다. 새로고침하면 이 창으로 돌아옵니다.'));
socket.on('hello', ({ pid }) => { S.me = pid; });
socket.on('toast', (t) => toast(esc(t), 'gold'));
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
  S.receivedAt = Date.now();
  render();
});

const emit = (ev, data) => new Promise((res) => socket.emit(ev, data, (r) => res(r || { ok: true })));
async function call(ev, data) {
  const r = await emit(ev, data);
  if (!r.ok && r.error) toast(esc(r.error), 'err');
  return r;
}
async function act(a) {
  const r = await emit('game:act', a);
  if (!r.ok && r.error) { toast(esc(r.error), 'err'); SFX.alarm(); }
  return r;
}

/* ═════════════════════════ 화면 · 알림 ═════════════════════════ */

const screens = { home: $('#home'), lobby: $('#lobby'), game: $('#game') };
const screenName = () => (!S.room ? 'home' : S.g ? 'game' : 'lobby');
function showScreen(n) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== n;
  document.body.dataset.screen = n;
}
function toast(html, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

function paintToggles() {
  $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; });
}
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => { SFX.setMuted(!SFX.muted); paintToggles(); if (!SFX.muted) { SFX.unlock(); SFX.click(); } }));
paintToggles();

/* ═════════════════════════ 시작 화면 ═════════════════════════ */

$('#heroCards').innerHTML = ['werewolf', 'seer', 'robber', 'troublemaker', 'tanner']
  .map((r, i) => roleCard(r, { w: 76 }).replace('class="card ', `class="card " data-i="${i}" `).replace('style="', `style="--r:${(i - 2) * 4}deg;`)).join('');

const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('wolf.name');
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();

function needName() {
  const n = nameInput.value.trim();
  if (!n) { toast('닉네임을 입력하세요', 'err'); nameInput.focus(); return null; }
  remember('wolf.name', n);
  return n;
}
$('#createBtn').addEventListener('click', () => { const n = needName(); if (n) { SFX.unlock(); SFX.click(); call('room:create', { name: n }); } });
function doJoin() {
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
  if (S.g && S.g.phase !== 'over' && S.g.me && !confirm('게임 중입니다. 정말 나가시겠어요?\n(자리는 AI가 대신 맡습니다)')) return;
  socket.emit('room:leave');
}));
$('#backHub').addEventListener('click', () => { if (S.room) socket.emit('room:leave'); });
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/wolf/?room=${S.room.code}`;
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
  renderChat();
}
function renderChat() {
  for (const h of chatHosts) {
    const log = $('.chat-log', h);
    log.innerHTML = S.chatLog.map((m) => (m.system ? `<div class="cm sys">${esc(m.text)}</div>`
      : `<div class="cm ${m.pid === S.me ? 'mine' : ''}"><div class="cm-name">${esc(m.name)}</div><div class="cm-text">${esc(m.text)}</div></div>`)).join('');
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
  for (const t of ['chat', 'log', 'deck']) $(`#tab-${t}`).hidden = S.tab !== t;
  if (S.tab === 'chat') { S.unread = 0; renderBadge(); renderChat(); }
});

/* ═════════════════════════ 역할 보기 · 룰 ═════════════════════════ */

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
  if ((e.target === modal && !modalLock) || e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden && !modalLock) closeModal(); });

function showRole(role, title = '') {
  const R = ROLES[role];
  openModal(`<h3 class="m-title">${esc(title || R.name)}</h3>
    <div class="role-view">
      ${roleCard(role, { w: 210 })}
      <div>
        <p><b style="color:var(--gold2)">${R.name}</b> · ${TEAM_NAME[R.team]}</p>
        <p>${esc(R.desc)}</p>
        ${R.night ? `<p class="hint">밤 순서: ${W.NIGHT_ORDER.indexOf(role) + 1}번째</p>` : '<p class="hint">밤에 눈을 뜨지 않습니다.</p>'}
      </div>
    </div>
    <div class="m-actions"><button class="btn btn-gold" data-close>확인</button></div>`);
}
document.addEventListener('click', (e) => {
  const c = e.target.closest('.card[data-role]');
  if (!c || c.closest('.modal') || c.closest('.pick') || c.closest('#heroCards')) return;
  if (c.closest('.deck-item, .deck-list, .me-panel, .result-grid, .seat, .ccard')) showRole(c.dataset.role);
});

fetch('/api/games').then((r) => r.json()).then((d) => {
  const g = (d.games || []).find((x) => x.id === 'wolf');
  S.links = g ? g.links : [];
}).catch(() => {});

function showRules() {
  const video = S.links.map((l) => `<a class="video" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><img src="/assets/play.svg" alt="">${esc(l.title)}${l.note ? ` (${esc(l.note)})` : ''}</a>`).join('<br>');
  openModal(`<h3 class="m-title">${ic('help')} 보름밤의 늑대인간 게임 방법</h3>
    <div class="rules">
      ${video ? `<p>영상으로 먼저 보면 쉬워요 (규칙은 한밤의 늑대인간과 같아요):<br>${video}</p>` : ''}
      <h4>한 판은 하룻밤</h4>
      <ol>
        <li><b>카드 받기</b> — 모두 역할 카드를 1장씩 받고, 남은 3장은 가운데에 뒤집어 둡니다.</li>
        <li><b>밤</b> — 진행자가 부르는 순서대로 역할이 눈을 뜨고 능력을 씁니다. 카드가 몰래 뒤바뀔 수 있어요!</li>
        <li><b>낮</b> — 모두 눈을 뜨고 자유롭게 대화합니다. 거짓말도 괜찮아요.</li>
        <li><b>투표</b> — 동시에 한 명을 지목합니다. 가장 많은 표(2표 이상)를 받은 사람이 처형됩니다. 동점이면 모두 처형.</li>
      </ol>
      <h4>승리 조건</h4>
      <p><b>마을 편</b>: 늑대인간을 한 명이라도 처형하면 승리. 아무도 늑대인간이 아니라면, 아무도 죽지 않아야 승리.<br>
      <b>늑대 편</b>: 늑대인간이 한 명도 처형되지 않으면 승리.<br>
      <b>무두장이</b>: 자기가 처형되면 혼자 승리 (늑대는 패배).<br>
      <b>중요</b>: 편은 <u>게임이 끝났을 때 내 앞에 있는 카드</u>로 정해집니다. 밤에 카드가 바뀌었다면 편도 바뀝니다!</p>
      <h4>밤 순서와 역할</h4>
      <div class="rules-roles">${W.ROLE_IDS.map((r) => `<div class="rr">${roleCard(r, { w: 64 })}<div><b>${ROLES[r].night ? `${W.NIGHT_ORDER.indexOf(r) + 1}. ` : ''}${ROLES[r].name}</b><p>${esc(ROLES[r].desc)}</p></div></div>`).join('')}</div>
    </div>
    <div class="m-actions"><button class="btn" data-close>닫기</button></div>`, { wide: true });
}
$$('[data-rules]').forEach((b) => b.addEventListener('click', showRules));

/* ═════════════════════════ 대기실 ═════════════════════════ */

const DAY_OPTIONS = [[0, '자동'], [120, '2분'], [180, '3분'], [240, '4분'], [300, '5분'], [420, '7분'], [600, '10분']];

function renderLobby() {
  const room = S.room;
  const host = room.hostPid === S.me;
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  const slots = [];
  for (let i = 0; i < W.MAX_PLAYERS; i++) {
    const m = seated[i];
    if (!m) { slots.push('<div class="slot empty">빈 자리</div>'); continue; }
    const tags = [];
    if (m.pid === room.hostPid) tags.push(`<span class="tag">${ic('crown')}방장</span>`);
    if (m.isBot) tags.push(`<span class="tag">${ic('bot')}AI</span>`);
    if (m.pid === S.me) tags.push('<span class="tag">나</span>');
    if (!m.online && !m.isBot) tags.push('<span class="tag red">접속 끊김</span>');
    slots.push(`<div class="slot">
      ${host && m.pid !== S.me ? `<button class="icon-btn kick" data-kick="${m.pid}" title="내보내기">${ic('x')}</button>` : ''}
      ${avatar(m.name, i)}
      <div class="slot-name">${esc(m.name)}</div>
      <div class="slot-tags">${tags.join('')}</div>
    </div>`);
  }
  $('#seatGrid').innerHTML = slots.join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').innerHTML = specs.length ? `${ic('eye')} 관전 ${specs.map((m) => `<span class="chip">${esc(m.name)}</span>`).join('')}` : '';
  const me = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').innerHTML = me && me.seated ? `${ic('eye')}관전으로 전환` : `${ic('users')}자리에 앉기`;
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  $('#startBtn').disabled = seated.length < W.MIN_PLAYERS || !!(S.draft && draftError());
  $('#startHint').textContent = host
    ? (seated.length < W.MIN_PLAYERS ? `${W.MIN_PLAYERS}명부터 시작할 수 있어요 (지금 ${seated.length}명)` : `${seated.length}명 · 역할 카드 ${seated.length + W.CENTER}장`)
    : `방장이 시작하기를 기다리는 중… (${seated.length}명)`;
  renderDeckPanel();
}

const seatedN = () => Math.max(W.MIN_PLAYERS, S.room.members.filter((m) => m.seated).length);
const draftError = () => W.checkDeck(S.draft, seatedN());

function renderDeckPanel() {
  const host = S.room.hostPid === S.me;
  const cfg = S.room.config;
  if (S.draft && !host) S.draft = null;
  const deck = S.draft || cfg.deck;
  const count = W.countDeck(deck);
  const need = seatedN() + W.CENTER;
  const e = S.draft ? draftError() : null;
  $('#deckPanel').innerHTML = `
    <div class="deck-head">
      <h3>이번 밤의 역할 카드</h3>
      <span class="deck-count ${deck.length !== need ? 'bad' : ''}">${deck.length} / ${need}장</span>
      <span class="hint">${e ? esc(e) : cfg.custom || S.draft ? '방장이 고른 구성' : '인원에 맞춘 기본 구성'}</span>
      <div class="grow"></div>
      <label class="day-select">토론 시간
        <select id="daySel" ${host ? '' : 'disabled'}>${DAY_OPTIONS.map(([v, l]) => `<option value="${v}" ${cfg.daySec === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </label>
      ${host ? '<button class="btn btn-sm" id="deckReset">기본 구성으로</button>' : ''}
    </div>
    <div class="deck-grid">${W.ROLE_IDS.map((r) => `<div class="deck-item">
      ${roleCard(r, { w: 104, cls: count[r] ? '' : 'none' })}
      ${host ? `<div class="stepper"><button data-dk="${r}" data-d="-1" ${count[r] ? '' : 'disabled'}>−</button><b>${count[r] || 0}</b><button data-dk="${r}" data-d="1" ${(count[r] || 0) >= ROLES[r].max ? 'disabled' : ''}>+</button></div>`
    : `<b>${count[r] ? `× ${count[r]}` : '-'}</b>`}
    </div>`).join('')}</div>`;
  $('#daySel').addEventListener('change', (ev) => call('room:config', { daySec: Number(ev.target.value) }));
  $('#deckReset')?.addEventListener('click', () => { S.draft = null; call('room:config', { reset: true }); });
  $$('[data-dk]', $('#deckPanel')).forEach((b) => b.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    const r = b.dataset.dk;
    const d = S.draft ? S.draft.slice() : cfg.deck.slice();
    if (Number(b.dataset.d) > 0) d.push(r);
    else d.splice(d.indexOf(r), 1);
    S.draft = d;
    SFX.click();
    if (!draftError()) {
      const res = await call('room:config', { deck: d });
      if (res.ok) S.draft = null;
    }
    renderLobby();
  }));
}

$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#addBotBtn').addEventListener('click', () => { SFX.click(); S.draft = null; call('room:addBot'); });
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.bell(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ═════════════════════════ 게임 도우미 ═════════════════════════ */

const pl = (pid) => (S.g ? S.g.players.find((p) => p.pid === pid) : null);
const pname = (pid) => (pl(pid) ? pl(pid).name : '?');

/** 내가 밤에 알게 된 카드 (나중 정보가 앞선 정보를 덮는다) */
function knowledge() {
  const k = { who: {}, center: {} };
  const me = S.g.me;
  if (!me) return k;
  for (const n of me.notes) {
    for (const c of n.cards) {
      if (c.who) k.who[c.who] = c.role;
      else if (c.center != null) k.center[c.center] = c.role;
    }
  }
  return k;
}

/** 지금 무엇을 고를 수 있는지 */
function pickMode() {
  const g = S.g;
  if (g.phase === 'vote' && g.me && !g.over) return { players: true, center: 0 };
  switch (g.needs) {
    case 'werewolf': return { players: false, center: 1 };
    case 'seer': return { players: true, center: 2 };
    case 'robber': return { players: true, center: 0 };
    case 'troublemaker': return { players: 2, center: 0 };
    case 'drunk': return { players: false, center: 1 };
    default: return null;
  }
}

/* ═════════════════════════ 테이블 ═════════════════════════ */

function seatPos(i, n, myIdx) {
  const a = Math.PI / 2 + ((i - myIdx) * 2 * Math.PI) / n;
  return { x: 50 + 47 * Math.cos(a), y: 50 + 44 * Math.sin(a) };
}

function renderTable() {
  if (S.t3d) { render3d(); return; }
  ensure3d();
  const g = S.g;
  const n = g.players.length;
  const myIdx = Math.max(0, g.players.findIndex((p) => p.pid === S.me));
  const cw = n > 8 ? 58 : n > 6 ? 66 : 76;
  const know = knowledge();
  const mode = pickMode();
  const over = g.over;
  const flipNow = over && !S.flipDone;

  $('#seats').innerHTML = g.players.map((p, i) => {
    const pos = seatPos(i, n, myIdx);
    const me = p.pid === S.me;
    const canPick = mode && mode.players && !me;
    const picked = S.sel.includes(p.pid) || (g.phase === 'vote' && g.me && g.me.vote === p.pid);
    let card;
    if (over) {
      const fin = over.final[p.pid];
      card = `<div class="flip ${flipNow ? '' : 'show'}" style="width:${cw}px;height:${cw * 1.4}px" data-flip>
        <div class="flip-inner"><div class="face">${backCard(cw)}</div><div class="face front">${roleCard(fin, { w: cw })}</div></div></div>`;
    } else {
      const k = know.who[p.pid];
      const label = me && g.me ? (k ? `나: ${ROLES[k].name}` : g.me.notes.some((x) => x.text.includes('술꾼')) ? '나: ?' : `나: ${ROLES[g.me.role].name}`) : k ? `${ROLES[k].name}(봤음)` : '';
      const kr = me ? (k || g.me?.role) : k;
      card = backCard(cw, `${label ? `known ${kr && ROLES[kr].team !== 'wolf' ? 'v' : ''}` : ''}`, label ? `data-known="${esc(label)}"` : '');
    }
    let state = '';
    if (g.phase === 'day' && p.ready) state = '투표 준비 완료';
    if (g.phase === 'vote') state = p.voted ? '투표함' : '고민 중…';
    if (over) {
      const orig = over.original[p.pid];
      state = orig !== over.final[p.pid] ? `<span class="orig">처음: ${ROLES[orig].name}</span>` : '';
    }
    const dead = over && over.dead.includes(p.pid);
    const win = over && over.winners.includes(p.pid) && S.flipDone;
    const votes = over && S.flipDone ? over.count[p.pid] || 0 : 0;
    return `<div class="seat ${me ? 'me' : ''} ${p.online ? '' : 'off'} ${dead && S.flipDone ? 'dead' : ''} ${win ? 'win' : ''} ${canPick ? 'pick' : ''} ${picked ? 'picked' : ''}" data-pid="${p.pid}" style="left:${pos.x}%;top:${pos.y}%">
      <div style="position:relative">${card}${votes ? `<span class="votes-n">${votes}</span>` : ''}${dead && S.flipDone ? `<span class="skull">${ic('skull')}</span>` : ''}</div>
      <div class="plate">${avatar(p.name, p.seat, 22)}${esc(p.name)}${p.isBot ? ` ${ic('bot')}` : ''}</div>
      <div class="state">${state}</div>
    </div>`;
  }).join('');

  const ccw = cw * 0.9;
  $('#centerCards').innerHTML = Array.from({ length: W.CENTER }, (_, i) => {
    const canPick = mode && mode.center > 0;
    const picked = S.sel.includes(`c${i}`);
    let card;
    if (over) {
      card = `<div class="flip ${flipNow ? '' : 'show'}" style="width:${ccw}px;height:${ccw * 1.4}px" data-flip>
        <div class="flip-inner"><div class="face">${backCard(ccw)}</div><div class="face front">${roleCard(over.center[i], { w: ccw })}</div></div></div>`;
    } else {
      const k = know.center[i];
      card = backCard(ccw, k ? `known ${ROLES[k].team !== 'wolf' ? 'v' : ''}` : '', k ? `data-known="${esc(k === 'drunk' ? '내 술꾼' : `${ROLES[k].name}(봤음)`)}"` : '');
    }
    return `<div class="ccard ${canPick ? 'pick' : ''} ${picked ? 'picked' : ''}" data-center="${i}">${card}<small>가운데 ${i + 1}</small></div>`;
  }).join('');

  if (flipNow) {
    S.flipDone = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('[data-flip]').forEach((el, i) => setTimeout(() => { el.classList.add('show'); SFX.flip(); }, 150 + i * 120));
    }));
    setTimeout(() => { renderTable(); drawArrows(); }, 400 + (n + 3) * 120);
  } else if (over) drawArrows();
  else $('#arrows').innerHTML = '';
}

/** 결과: 누가 누구에게 투표했는지 화살표 */
function drawArrows() {
  const svg = $('#arrows');
  const over = S.g.over;
  if (!over) { svg.innerHTML = ''; return; }
  const box = $('#table').getBoundingClientRect();
  const center = (pid) => {
    const el = $(`.seat[data-pid="${pid}"] .card, .seat[data-pid="${pid}"] .flip`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
  };
  let s = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ff6a5a"/></marker></defs>';
  for (const [from, to] of Object.entries(over.votes)) {
    const a = center(from);
    const b = center(to);
    if (!a || !b) continue;
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.12;
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.12;
    const t = 0.82;
    const ex = a.x + (b.x - a.x) * t;
    const ey = a.y + (b.y - a.y) * t;
    s += `<path d="M${a.x} ${a.y}Q${mx} ${my} ${ex} ${ey}" stroke="#ff6a5a" stroke-width="2.5" fill="none" opacity=".85" marker-end="url(#ah)" stroke-dasharray="6 4"/>`;
  }
  svg.innerHTML = s;
}
window.addEventListener('resize', () => { if (S.g && S.g.over) drawArrows(); });

/* 카드 고르기: key 는 사람 pid 또는 가운데 'c0'~'c2' */
async function pickKey(key) {
  const g = S.g;
  if (!g || !pickMode()) return;
  SFX.click();
  const me = S.me;
  const fx = (a, b) => { if (S.t3d) S.t3d.swap(a, b); };
  if (!key.startsWith('c')) {
    const pid = key;
    if (pid === me) return;
    if (g.phase === 'vote') { await act({ type: 'vote', target: pid }); return; }
    if (g.needs === 'seer') { S.sel = []; await act({ type: 'seer', target: pid }); return; }
    if (g.needs === 'robber') { const r = await act({ type: 'rob', target: pid }); if (r.ok) fx(me, pid); return; }
    if (g.needs === 'troublemaker') {
      S.sel = S.sel.includes(pid) ? S.sel.filter((x) => x !== pid) : [...S.sel.filter((x) => !x.startsWith('c')), pid];
      if (S.sel.length === 2) {
        const [a, b] = S.sel;
        S.sel = [];
        const r = await act({ type: 'swap', a, b });
        if (r.ok) fx(a, b);
      }
      render();
    }
    return;
  }
  const i = Number(key.slice(1));
  if (g.needs === 'werewolf') { await act({ type: 'peek', center: i }); return; }
  if (g.needs === 'drunk') { const r = await act({ type: 'drunk', center: i }); if (r.ok) fx(me, key); return; }
  if (g.needs === 'seer') {
    S.sel = S.sel.includes(key) ? S.sel.filter((x) => x !== key) : [...S.sel.filter((x) => x.startsWith('c')), key];
    if (S.sel.length === 2) {
      const centers = S.sel.map((x) => Number(x.slice(1)));
      S.sel = [];
      await act({ type: 'seer', centers });
    }
    render();
  }
}

$('#table').addEventListener('click', (e) => {
  const seat = e.target.closest('.seat.pick');
  const cc = e.target.closest('.ccard.pick');
  if (seat) pickKey(seat.dataset.pid);
  else if (cc) pickKey(`c${cc.dataset.center}`);
});

/* ── 3D 테이블 */
let t3dLoading = false;
async function ensure3d() {
  if (S.t3d || t3dLoading || S.no3d) return;
  t3dLoading = true;
  try {
    const { createTable } = await import('./table3d.js');
    const host = document.createElement('div');
    host.className = 't3d';
    $('#tableWrap').prepend(host);
    S.t3d = createTable(host, { onPick: (k) => pickKey(k) });
    $('#tableWrap').classList.add('has3d');
    S.seenNotes = S.g && S.g.me ? S.g.me.notes.length : 0;
    render();
  } catch (e) {
    console.warn('3D 테이블을 켤 수 없어 평면 테이블을 씁니다', e);
    S.no3d = true;
  } finally {
    t3dLoading = false;
  }
}

function render3d() {
  const g = S.g;
  const know = knowledge();
  const mode = pickMode();
  const over = g.over;
  const teamOf = (r) => (r ? ROLES[r].team : '');
  const players = g.players.map((p) => {
    const me = p.pid === S.me;
    const k = know.who[p.pid];
    let label = '';
    let labelTeam = '';
    if (!over) {
      if (me && g.me) {
        const drunkNow = g.me.role === 'drunk' && g.me.notes.some((x) => x.text.includes('모릅니다'));
        const r = k || (drunkNow ? null : g.me.role);
        label = r ? `나: ${ROLES[r].name}` : '나: ?';
        labelTeam = teamOf(r);
      } else if (k) {
        label = `${ROLES[k].name} (봤음)`;
        labelTeam = teamOf(k);
      }
    }
    let state = '';
    if (g.phase === 'day' && p.ready) state = '투표 준비 완료';
    if (g.phase === 'vote') state = p.voted ? '투표함' : '고민 중…';
    if (over && over.original[p.pid] !== over.final[p.pid]) state = `처음: ${ROLES[over.original[p.pid]].name}`;
    return {
      pid: p.pid, seat: p.seat, isMe: me, online: p.online,
      nameHtml: `${esc(p.name)}${p.isBot ? ' 🤖'.replace('🤖', '<small>AI</small>') : ''}`,
      label, labelTeam, state,
      pick: mode && mode.players && !me,
      picked: S.sel.includes(p.pid) || (g.phase === 'vote' && g.me && g.me.vote === p.pid),
      dead: over && over.dead.includes(p.pid),
      win: over && over.winners.includes(p.pid),
      votes: over ? over.count[p.pid] || 0 : 0,
    };
  });
  const center = [0, 1, 2].map((i) => {
    const k = know.center[i];
    return {
      label: over ? '' : k ? (k === 'drunk' ? '내 술꾼 카드' : `${ROLES[k].name} (봤음)`) : '',
      labelTeam: teamOf(k),
      pick: mode && mode.center > 0,
      picked: S.sel.includes(`c${i}`),
    };
  });
  let faces = null;
  if (over) {
    faces = { ...over.final };
    over.center.forEach((r, i) => { faces[`c${i}`] = r; });
  } else if (g.phase === 'look' && g.me) {
    faces = { [S.me]: g.me.role };
  }
  S.t3d.update({
    players, center, faces,
    night: ['look', 'night'].includes(g.phase),
    over: !!over,
    arrows: over ? Object.entries(over.votes) : [],
  });
  // 새로 본 카드는 들어서 보여 준다
  if (g.me) {
    const notes = g.me.notes;
    if (S.seenNotes == null || S.seenNotes > notes.length) S.seenNotes = notes.length;
    for (const n of notes.slice(S.seenNotes)) {
      n.cards.forEach((c, j) => setTimeout(() => S.t3d && S.t3d.peek(c.who || `c${c.center}`, c.role), j * 500));
    }
    S.seenNotes = notes.length;
  }
}

/* ═════════════════════════ 내 정보 · 행동 줄 ═════════════════════════ */

function renderMe() {
  const g = S.g;
  const box = $('#mePanel');
  if (!g.me) {
    box.innerHTML = `<div class="me-info"><h4>관전 중</h4><div class="team">밤에 무슨 일이 있었는지는 게임이 끝나면 공개됩니다.</div></div>`;
    return;
  }
  const R = ROLES[g.me.role];
  const notes = g.me.notes.length ? g.me.notes.map((n) => `<li>${esc(n.text)}</li>`).join('') : '<li class="empty">아직 밤에 본 것이 없습니다.</li>';
  box.innerHTML = `${roleCard(g.me.role, { w: 96 })}
    <div class="me-info">
      <h4>처음 받은 카드: ${R.name}</h4>
      <div class="team">${TEAM_NAME[R.team]} · ${esc(R.short)}</div>
      <ul class="notes">${notes}</ul>
    </div>`;
}

let clockTimer = null;
function renderBanner() {
  const g = S.g;
  const el = $('#phaseBanner');
  const LABEL = { look: '카드 확인', night: '밤', day: '낮 · 토론', vote: '투표', over: '결과' };
  let sub = '';
  if (g.phase === 'night' && g.step && ROLES[g.step]) sub = `${ROLES[g.step].name}의 차례`;
  el.innerHTML = `<b>${LABEL[g.phase]}</b>${sub ? `<span>${sub}</span>` : ''}${g.deadlineIn != null && g.phase !== 'over' ? '<span class="pclock" id="pclock"></span>' : ''}`;
  clearInterval(clockTimer);
  const pc = $('#pclock');
  if (!pc) return;
  const end = S.receivedAt + g.deadlineIn;
  let last = -1;
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    const s = Math.ceil(left / 1000);
    pc.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    pc.classList.toggle('urgent', left < 10000);
    if (left < 6000 && s !== last && s > 0 && ['day', 'vote'].includes(g.phase)) { last = s; SFX.tick(); }
    if (!left) clearInterval(clockTimer);
  };
  tick();
  clockTimer = setInterval(tick, 250);
}

function renderActionBar() {
  const g = S.g;
  const host = S.room.hostPid === S.me;
  let text = '';
  const btns = [];
  const btn = (a, label, cls = '') => `<button class="btn ${cls}" data-a="${a}">${label}</button>`;
  const need = g.needs;
  if (g.phase === 'look') {
    text = g.me ? `내 카드를 확인하세요. 당신은 <b>${ROLES[g.me.role].name}</b>입니다. 곧 밤이 됩니다.` : '모두 자기 카드를 확인하는 중입니다.';
    if (g.me) btns.push(btn('myrole', '내 역할 자세히'));
  } else if (g.phase === 'night') {
    if (need === 'werewolf') text = '늑대인간은 <b>나 혼자</b>입니다. 원하면 <b>가운데 카드 1장</b>을 눌러 보세요.';
    else if (need === 'seer') text = '<b>다른 사람 1명</b>의 카드를 누르거나, <b>가운데 카드 2장</b>을 눌러 보세요.';
    else if (need === 'robber') text = '카드를 <b>훔칠 사람</b>을 누르세요. 그 사람과 카드를 바꾸고 새 카드를 봅니다.';
    else if (need === 'troublemaker') text = `카드를 서로 바꿀 <b>두 사람</b>을 누르세요. (${S.sel.length}/2)`;
    else if (need === 'drunk') text = '<b>가운데 카드 1장</b>을 누르세요. 내 카드와 바뀝니다 (보지 못해요).';
    else if (g.me && g.step === g.me.role) text = '지금 당신의 차례입니다. 위 <b>내 정보</b>에서 본 것을 확인하세요.';
    else text = '<b>눈을 감고</b> 기다리세요… 누군가 움직이고 있습니다.';
    if (need && need !== 'drunk') btns.push(btn('skip', '아무것도 안 하기'));
  } else if (g.phase === 'day') {
    const humans = g.players.filter((p) => !p.isBot && p.online);
    const ready = humans.filter((p) => p.ready).length;
    text = '아침입니다! <b>대화</b>로 누가 늑대인간인지 찾아내세요. 거짓말을 해도 됩니다.';
    if (g.me) btns.push(btn('ready', g.me.ready ? `${ic('check')}준비 취소 (${ready}/${humans.length})` : `${ic('target')}투표할 준비 완료 (${ready}/${humans.length})`, g.me.ready ? '' : 'btn-gold'));
    if (host) btns.push(btn('skipDay', '바로 투표 시작', 'btn-red'));
  } else if (g.phase === 'vote') {
    if (g.me) text = g.me.vote ? `<b>${esc(pname(g.me.vote))}</b>에게 투표했어요. 시간 안에 바꿀 수 있습니다.` : '늑대인간이라고 생각하는 사람의 <b>카드를 누르세요</b>.';
    else text = '투표가 진행 중입니다.';
  } else if (g.phase === 'over') {
    const o = g.over;
    const won = g.me && o.winners.includes(S.me);
    text = g.me ? (won ? `${ic('cup')} <b>승리!</b> 당신의 마지막 카드는 ${ROLES[o.final[S.me]].name}였습니다.` : `패배… 당신의 마지막 카드는 <b>${ROLES[o.final[S.me]].name}</b>였습니다.`) : '게임이 끝났습니다.';
    btns.push(btn('result', '결과 · 밤 기록 보기', 'btn-gold'), btn('replay', '결말 영상 다시 보기'));
    if (host) btns.push(btn('again', `${ic('refresh')}한 판 더`, 'btn-red'));
  }
  $('#actionBar').innerHTML = `<div class="ab-text">${text}</div><div class="ab-btns">${btns.join('')}</div>`;
}

$('#actionBar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a;
  const g = S.g;
  SFX.click();
  if (a === 'myrole') showRole(g.me.role, '당신의 역할');
  if (a === 'skip') { S.sel = []; act({ type: 'skip' }); }
  if (a === 'ready') act({ type: 'ready', value: !g.me.ready });
  if (a === 'skipDay') act({ type: 'skipDay' });
  if (a === 'result') showResult();
  if (a === 'replay') runCutscene();
  if (a === 'again') call('room:start');
});

/* ═════════════════════════ 기록 · 역할 목록 ═════════════════════════ */

function renderLog() {
  $('#tab-log').innerHTML = S.g.log.map((l) => `<div class="log-row k-${l.kind}">${esc(l.text)}</div>`).join('');
  const c = W.countDeck(S.g.deck);
  $('#tab-deck').innerHTML = `<p class="hint">이번 판에 들어간 카드 (${S.g.deck.length}장 · 가운데 ${W.CENTER}장)</p>
    <div class="deck-list">${Object.keys(c).map((r) => `<div>${roleCard(r, { w: 80 })}<div class="hint" style="text-align:center">× ${c[r]}</div></div>`).join('')}</div>`;
}

/* ═════════════════════════ 결과 ═════════════════════════ */

const HEADLINE = {
  village: ['마을의 승리', '늑대인간을 찾아냈습니다!'],
  wolf: ['늑대인간의 승리', '늑대인간은 끝까지 숨어 있었습니다.'],
  tanner: ['무두장이의 승리', '무두장이가 원하던 대로 처형되었습니다.'],
  'tanner+village': ['무두장이와 마을의 승리', '무두장이와 늑대인간이 함께 처형되었습니다.'],
  none: ['모두 패배', '늑대인간이 없는데 죄 없는 사람이 처형되었습니다.'],
};

function showResult() {
  const o = S.g.over;
  const [h, sub] = HEADLINE[o.outcome];
  const cls = o.outcome.startsWith('tanner') ? 'tanner' : o.outcome === 'none' ? 'wolf' : o.outcome;
  const grid = S.g.players.map((p) => {
    const fin = o.final[p.pid];
    const orig = o.original[p.pid];
    return `<div class="rg ${o.winners.includes(p.pid) ? 'win' : ''}">
      ${roleCard(fin, { w: 84 })}
      <b>${esc(p.name)}</b>
      <span>${orig !== fin ? `처음: ${ROLES[orig].name}` : '카드 그대로'}</span>
      <span>→ ${esc(pname(o.votes[p.pid]))}에게 투표</span>
      ${o.dead.includes(p.pid) ? `<span class="dead">${ic('skull')} 처형 (${o.count[p.pid] || 0}표)</span>` : `<span>${o.count[p.pid] || 0}표</span>`}
    </div>`;
  }).join('');
  const center = o.center.map((r, i) => `<div class="rg">${roleCard(r, { w: 84 })}<b>가운데 ${i + 1}</b>${o.centerOriginal[i] !== r ? `<span>처음: ${ROLES[o.centerOriginal[i]].name}</span>` : ''}</div>`).join('');
  const shots = o.hunterShots.map((s) => `<li>사냥꾼 ${esc(pname(s.from))}이(가) 쓰러지며 ${esc(pname(s.to))}을(를) 쐈습니다.</li>`).join('');
  openModal(`<div class="result-head ${cls}"><h3>${h}</h3><p class="m-sub">${sub}${o.noWolves ? ' (이번 판에는 늑대인간이 아무도 없었습니다)' : ''}</p></div>
    <div class="result-grid">${grid}${center}</div>
    <h4 class="m-title" style="font-size:22px">${ic('scroll')} 그날 밤 무슨 일이 있었나</h4>
    <ol class="night-log">${o.nightLog.map((t) => `<li>${esc(t)}</li>`).join('') || '<li>아무 일도 없었습니다.</li>'}${shots}</ol>
    <div class="m-actions">${S.room.hostPid === S.me ? '<button class="btn btn-red" data-again>한 판 더</button>' : ''}<button class="btn btn-gold" data-close>닫기</button></div>`, { wide: true });
  $('[data-again]', modalBox)?.addEventListener('click', () => { closeModal(); call('room:start'); });
}

function runCutscene() {
  const o = S.g.over;
  const kind = o.outcome === 'tanner+village' ? 'tanner' : o.outcome;
  const won = S.g.me && o.winners.includes(S.me);
  const sub = o.outcome === 'tanner+village' ? '마을도 함께 승리' : S.g.me ? (won ? '당신은 승리했습니다' : '당신은 패배했습니다') : '';
  return playCutscene($('#cutscene'), kind, {
    sub,
    sound: (k) => {
      const S2 = {
        'start:wolf': () => { SFX.drone(); setTimeout(() => SFX.drone(), 2200); setTimeout(() => SFX.drone(), 4400); },
        howl: () => SFX.howl(),
        slash: () => { SFX.boom(); SFX.hit(); },
        'start:village': () => { SFX.drone(); setTimeout(() => SFX.rooster(), 4000); setTimeout(() => SFX.birds(), 5200); },
        hit: () => { SFX.hit(); SFX.death(); },
        cheer: () => { SFX.win(); setTimeout(() => SFX.bell(), 600); },
        'start:tanner': () => SFX.drone(),
        thunder: () => SFX.boom(),
        ghost: () => { SFX.ghost(); setTimeout(() => SFX.ghost(), 2600); },
        'start:none': () => { SFX.drone(); setTimeout(() => SFX.lose(), 3000); },
      };
      if (S2[k]) S2[k]();
    },
  });
}

/* ═════════════════════════ 사건 → 소리 · 목소리 ═════════════════════════ */

function playEvents() {
  const g = S.g;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  if (!fresh.length) return;
  S.seenSeq = g.events[g.events.length - 1].seq;
  if (fresh.length > 8) return;
  for (const e of fresh) {
    if (e.type === 'night') { SFX.drone(); }
    if (e.type === 'step') {
      if (g.me && g.me.role === e.role) { SFX.turn(); toast(`${ic('eye')} 당신의 차례! 눈을 뜨세요`, 'gold'); }
    }
    if (e.type === 'swap') { SFX.flip(); if (S.t3d && !(g.me && g.me.role === g.step)) S.t3d.shuffleAll(); }
    if (e.type === 'day') { SFX.rooster(); setTimeout(() => SFX.birds(), 900); }
    if (e.type === 'vote') { SFX.bell(); }
    if (e.type === 'over') SFX.boom();
  }
}

/* ═════════════════════════ 전체 그리기 ═════════════════════════ */

function render() {
  const name = screenName();
  showScreen(name);
  document.body.classList.remove('eyes-closed', 'day-mode');
  if (name === 'home') { S.gameId = null; return; }
  if (name === 'lobby') { S.gameId = null; renderLobby(); return; }

  const g = S.g;
  mountChat($('#tab-chat'));
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(S.room.hostPid === S.me && g.phase === 'over');
  if (S.gameId !== g.id) {
    S.gameId = g.id;
    S.seenSeq = 0;
    S.lookShown = false;
    S.overPlayed = false;
    S.flipDone = false;
    S.sel = [];
    S.seenNotes = 0;
    closeModal();
  }
  if (!g.needs && g.phase !== 'vote') S.sel = [];
  playEvents();

  const wrap = $('#tableWrap');
  wrap.classList.toggle('day', ['day', 'vote', 'over'].includes(g.phase));
  if (['day', 'vote', 'over'].includes(g.phase)) document.body.classList.add('day-mode');
  const myTurn = g.me && g.phase === 'night' && g.step === g.me.role;
  if (g.phase === 'night' && g.me && !myTurn) document.body.classList.add('eyes-closed');
  const nar = g.phase === 'night' ? W.NARRATION[g.step] || '' : g.phase === 'look' ? '카드를 확인하세요. 곧 밤이 찾아옵니다.' : g.phase === 'vote' ? '투표 시간! 늑대인간이라고 생각하는 사람을 지목하세요.' : '';
  $('#narration').innerHTML = nar ? `<span class="who">진행자</span>${esc(nar)}` : '';

  renderTable();
  renderMe();
  renderBanner();
  renderActionBar();
  renderLog();

  if (g.phase === 'look' && g.me && !S.lookShown) {
    S.lookShown = true;
    SFX.flip();
    showRole(g.me.role, '당신의 역할');
  }
  if (g.phase === 'night' && !modal.hidden && $('.role-view', modalBox)) closeModal();
  if (g.phase === 'over' && !S.overPlayed) {
    S.overPlayed = true;
    setTimeout(async () => {
      if (!S.g || !S.g.over) return;
      await runCutscene();
      if (S.g && S.g.over) showResult();
    }, 2400);
  }
}

document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
render();
