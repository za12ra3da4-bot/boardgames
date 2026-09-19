import { bindName } from '/common/me.js';
import { mountEmotes } from '/common/emote.js';
import { roomKeeper } from '/common/keep.js';
import { memberFace } from '/common/avatar.js';
import { cardSvg } from './art.js';
import { playEnding } from './ending.js';
// 구룡 살인사건 - 브라우저 쪽 화면과 조작
const K = window.KOWLOON;
const SFX = window.SFX;
const { CARD, TILE, ROLES } = K;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const remembered = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* 무시 */ } };
function token() {
  let t = remembered('kowloon.token');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(t)) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).padEnd(32, '0');
    remember('kowloon.token', t);
  }
  return t;
}
const face = (pid, size = 30) => {
  const m = S.room && S.room.members.find((x) => x.pid === pid);
  return `<span class="av-face" style="width:${size}px;height:${size}px">${memberFace(m || { pid })}</span>`;
};
const BULLET = '<svg class="bullet" viewBox="0 0 60 28"><path d="M4 6 h30 q20 0 24 8 q-4 8 -24 8 h-30Z" fill="#d8a830" stroke="#1a1210" stroke-width="2.4"/><path d="M4 6 h8 v16 h-8Z" fill="#a87a20" stroke="#1a1210" stroke-width="2"/><path d="M16 9 h22 q10 0 14 3" stroke="#fff4c0" stroke-width="2" fill="none" opacity=".7"/></svg>';

const S = { me: null, room: null, g: null, gameId: null, seenSeq: 0, tab: 'log', unread: 0, chatLog: [], receivedAt: 0,
  pick: { means: null, clue: null }, fsEdit: null, witness: null, filmShown: null, stamps: {} };

/* ── 소켓 */
const keeper = roomKeeper('kowloon');
const socket = io('/kowloon', { auth: (cb) => cb({ token: token(), save: keeper.get() }), transports: ['websocket', 'polling'] });
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

/* ── 시작 화면 · 공용 */
const nameInput = $('#nameInput');
const codeInput = $('#codeInput');
nameInput.value = remembered('kowloon.name');
bindName(nameInput);
mountEmotes({ socket, myPid: () => S.me, active: () => !!S.room, members: () => (S.room ? S.room.members : []), anchor: (pid) => document.querySelector(`.sus[data-pid="${pid}"]`) || (pid === S.me ? $('#me') : null) });
const inv = /[?&#]room=([A-Za-z]{4})/.exec(location.href);
if (inv) codeInput.value = inv[1].toUpperCase();
const needName = () => { const n = nameInput.value.trim(); if (!n) { toast('닉네임을 입력하세요', 'err'); return null; } remember('kowloon.name', n); return n; };
$('#createBtn').addEventListener('click', () => { const n = needName(); if (n) { SFX.unlock(); call('room:create', { name: n }); } });
const doJoin = () => { const n = needName(); const c = codeInput.value.trim().toUpperCase(); if (n && c.length === 4) { SFX.unlock(); call('room:join', { name: n, code: c }); } };
$('#joinBtn').addEventListener('click', doJoin);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
$$('[data-leave]').forEach((b) => b.addEventListener('click', () => {
  if (S.g && S.g.phase !== 'over' && !confirm('수사 중입니다. 정말 나가시겠어요? (자리는 AI가 대신 맡습니다)')) return;
  socket.emit('room:leave');
}));
$('#backHub').addEventListener('click', () => { if (S.room) socket.emit('room:leave'); });
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}/kowloon/?room=${S.room.code}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다', 'gold'); } catch (_) { prompt('이 주소를 친구에게 보내세요', url); }
});
const paintMute = () => $$('[data-mute] .ic').forEach((i) => { i.className = `ic ic-${SFX.muted ? 'mute' : 'volume'}`; });
$$('[data-mute]').forEach((b) => b.addEventListener('click', () => { SFX.setMuted(!SFX.muted); paintMute(); }));
paintMute();

/* ── 게임 방법 */
function showRules() {
  $('#modalBox').innerHTML = `<h3>구룡 살인사건 · 게임 방법</h3><div class="rules">
    <h4>역할</h4><ul>
    <li><b>법의학자</b> — 진실(범인 · 수단 · 단서)을 알지만 <b>말을 못 합니다</b>. 현장 타일의 한 칸에 총알을 놓아서만 알려 줍니다. (AI 가 맡을 수도 있어요)</li>
    <li><b>살인자</b> — 자기 카드에서 <b>수단 1장</b>(파란 테두리)과 <b>단서 1장</b>(빨간 테두리)을 골라 살인을 저지릅니다.</li>
    <li><b>수사관</b> — 모두의 카드는 공개돼 있어요. 총알이 가리키는 걸 읽고 범인을 찾습니다.</li>
    <li><b>공범</b> (6명 이상) — 살인자와 한 편. 살인자와 고른 카드를 알고 있어요.</li>
    <li><b>목격자</b> (6명 이상) — 범인 두 명(살인자 · 공범)의 얼굴을 봤지만 누가 살인자인지는 몰라요. 들키면 끝!</li></ul>
    <h4>진행</h4><ol>
    <li><b>밤</b> — 살인자가 수단과 단서를 한 장씩 고릅니다.</li>
    <li><b>감식</b> — 법의학자가 <b>사인</b>, <b>장소</b>, 그리고 현장 타일 4장에 총알을 하나씩 놓습니다.</li>
    <li><b>토론 3라운드</b> — 대화로 추리해요. 라운드 사이마다 법의학자가 현장 타일 한 장을 새로 바꿉니다.</li>
    <li><b>지목</b> — 토론 중 언제든 <b>한 번만</b>: 한 사람과 그 사람의 수단 1장 + 단서 1장을 고릅니다. 둘 다 맞아야 정답!</li></ol>
    <h4>승리</h4><ul>
    <li>누군가 정답을 맞히면 <b>수사팀 승리</b>. 단, 목격자가 있으면 살인자가 목격자를 한 번 지목할 수 있고, 맞히면 살인자 승리.</li>
    <li>3라운드가 끝나도, 수사관들이 지목 기회를 다 써도 못 맞히면 <b>살인자 승리</b>.</li></ul>
    <h4>요령</h4><p>총알이 놓인 칸과 <i>잘 어울리는</i> 카드 한 쌍을 찾으세요. 사인이 '중독'인데 수단이 '야구방망이'면 아니겠죠? 살인자도 의심받지 않게 그럴듯한 말을 섞어요.</p>
    </div><div class="modal-btns"><button class="btn btn-red" data-close>알겠어요</button></div>`;
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
  const cfg = room.config || { fs: 'ai', discuss: 'normal' };
  $('#lobbyCode').textContent = room.code;
  mountChat($('#lobbyChatMount'));
  const seated = room.members.filter((m) => m.seated);
  const slots = Math.max(8, Math.min(K.MAX_PLAYERS, seated.length + 1));
  $('#seatGrid').innerHTML = Array.from({ length: slots }, (_, i) => {
    const m = seated[i];
    if (!m) return '<div class="slot empty">빈 자리</div>';
    return `<div class="slot" data-pid="${m.pid}">${host && m.pid !== S.me ? `<button class="btn btn-sm kick" data-kick="${m.pid}">✕</button>` : ''}${face(m.pid, 64)}<b>${esc(m.name)}</b>
      <div>${m.pid === room.hostPid ? '<span class="tag">방장</span>' : ''}${m.isBot ? '<span class="tag">AI</span>' : ''}${m.pid === S.me ? '<span class="tag">나</span>' : ''}${!m.online && !m.isBot ? '<span class="tag">끊김</span>' : ''}</div></div>`;
  }).join('');
  const specs = room.members.filter((m) => !m.seated);
  $('#spectators').textContent = specs.length ? `관전: ${specs.map((m) => m.name).join(', ')}` : '';
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) => `<button data-cfg="${key}" data-v="${v}" class="${cfg[key] === v ? 'on' : ''}" ${host ? '' : 'disabled'}>${t}</button>`).join('')}</div>`;
  $('#cfg').innerHTML = `<div class="cfg-box"><h4>법의학자</h4>${seg('fs', [['ai', 'AI 가 맡기'], ['human', '사람 중 무작위']])}<p>${cfg.fs === 'ai' ? 'AI 가 진실을 보고 총알을 놓아요. 적은 인원에 좋아요.' : '한 명이 법의학자가 되어 말없이 총알로만 힌트를 줍니다.'}</p></div>
    <div class="cfg-box"><h4>토론 시간</h4>${seg('discuss', [['short', '짧게 2분'], ['normal', '보통'], ['long', '길게 5분']])}<p>보통: 1라운드 4분 · 2~3라운드 3분. 모두 '토론 끝' 을 누르면 바로 넘어가요.</p></div>`;
  const me = room.members.find((m) => m.pid === S.me);
  $('#seatBtn').textContent = me && me.seated ? '관전으로 전환' : '자리에 앉기';
  $('#addBotBtn').hidden = !host;
  $('#startBtn').hidden = !host;
  const holders = seated.length - (cfg.fs === 'human' ? 1 : 0);
  $('#startBtn').disabled = holders < K.MIN_PLAYERS;
  $('#startHint').textContent = host
    ? (holders < K.MIN_PLAYERS ? `카드를 받을 사람이 ${K.MIN_PLAYERS}명 이상 필요해요` : `용의자 ${holders}명${holders >= 6 ? ' · 공범 · 목격자 포함' : ''}`)
    : '방장이 수사를 시작하기를 기다리는 중…';
}
$('#seatGrid').addEventListener('click', (e) => { const k = e.target.closest('[data-kick]'); if (k) call('room:kick', { pid: k.dataset.kick }); });
$('#cfg').addEventListener('click', (e) => { const b = e.target.closest('[data-cfg]'); if (b && !b.disabled) { SFX.click(); call('room:config', { [b.dataset.cfg]: b.dataset.v }); } });
$('#addBotBtn').addEventListener('click', () => call('room:addBot'));
$('#seatBtn').addEventListener('click', () => { const m = S.room.members.find((x) => x.pid === S.me); call('room:seat', { seated: !(m && m.seated) }); });
$('#startBtn').addEventListener('click', () => { SFX.unlock(); SFX.thunder(); call('room:start'); });
$('#hostLobbyBtn').addEventListener('click', () => call('room:lobby'));

/* ── 게임 도우미 */
const pl = (pid) => S.g.players.find((p) => p.pid === pid);
const nameOf = (pid) => (pid === S.g.fs.pid ? S.g.fs.name : (pl(pid) || {}).name || '?');
const myRole = () => (S.g.me ? S.g.me.role : null);
const isFs = () => S.g.fs.me;
const bad = (r) => r === 'murderer' || r === 'accomplice';
const card = (id, o = {}) => cardSvg(CARD[id], o).replace('<svg ', `<svg data-card="${id}" `);
const logText = (t) => esc(t).replace(/\{p:([^}]+)\}/g, (_, pid) => `<span class="pn">${esc(nameOf(pid))}</span>`);
const PHASE = {
  night: '밤 — 살인이 일어나는 중',
  forensic: '감식 — 법의학자가 현장을 살핍니다',
  discuss: '토론',
  swap: '새 증거 — 현장 타일 교체',
  solved: '판정 중…',
  witness: '마지막 반격 — 살인자가 목격자를 찾습니다',
  over: '사건 종결',
};

/* ── 현장 타일 */
function tileHtml(t, i, o = {}) {
  if (!t.id) return `<div class="tile empty">${o.text || '장소 타일<br>감식 중…'}</div>`;
  const T = TILE[t.id];
  const editPick = o.picks ? o.picks[i] : null;
  const shown = editPick != null ? editPick : t.pick;
  return `<div class="tile ${T.type} ${t.fresh && o.animate ? 'fresh' : ''} ${o.swappable ? 'swappable' : ''}" data-ti="${i}">
    <h5>${esc(T.name)}<small>${T.type === 'cause' ? 'CAUSE' : T.type === 'location' ? 'LOCATION' : 'SCENE'}</small></h5>
    ${T.opts.map((op, k) => `<div class="opt ${shown === k ? 'pick' : ''} ${o.canPick ? 'can' : ''}" data-ti="${i}" data-k="${k}"><span class="n">${k + 1}</span>${esc(op.name)}${shown === k ? BULLET : ''}</div>`).join('')}
  </div>`;
}
function renderScene() {
  const g = S.g;
  const fsName = g.fs.isBot ? '법의학자 AI' : esc(g.fs.name);
  let head = `<div class="scene-head"><h3>법의학자의 증언</h3><p>총알이 놓인 칸이 진실을 가리킵니다</p><span class="fs">${g.fs.isBot ? '' : face(g.fs.pid, 24)}${fsName}${g.fs.online ? '' : ' (자리비움)'}</span></div>`;
  let body = '';
  const editing = isFs() && g.phase === 'forensic';
  if (g.phase === 'night') {
    body = `<div class="tiles">${Array.from({ length: 6 }, () => '<div class="tile empty">살인이<br>일어나는 중…</div>').join('')}</div>`;
  } else if (editing) {
    if (!S.fsEdit) S.fsEdit = { loc: null, picks: g.tiles.map(() => null) };
    const E = S.fsEdit;
    const tiles = g.tiles.map((t, i) => (i === 1 ? { id: E.loc, pick: null } : t));
    body = `<div class="tiles">${tiles.map((t, i) => tileHtml(t, i, { picks: E.picks, canPick: !!t.id, text: '아래에서 장소 타일을<br>하나 고르세요' })).join('')}</div>
      <p class="loc-hint">장소 타일 넷 중 하나를 골라 그 안의 칸을 누르세요 (고른 타일이 위 두 번째 자리에 들어가요)</p>
      <div class="loc-pick">${K.LOCATIONS.map((id) => `<div class="tile location ${E.loc === id ? 'on' : ''}" data-loc="${id}"><h5>${esc(TILE[id].name)}</h5>${TILE[id].opts.map((o, k) => `<div class="opt can ${E.loc === id && E.picks[1] === k ? 'pick' : ''}" data-loc-opt="${id}" data-k="${k}"><span class="n">${k + 1}</span>${esc(o.name)}${E.loc === id && E.picks[1] === k ? BULLET : ''}</div>`).join('')}</div>`).join('')}</div>
      <div class="fs-bar"><p>진실: <b>${esc(nameOf(g.know.murderer))}</b> · ${esc(CARD[g.know.murder.means].name)} + ${esc(CARD[g.know.murder.clue].name)}<br>여섯 타일마다 진실을 가리키는 칸 하나에 총알을 놓으세요. 말은 할 수 없어요!</p>
      <span class="fs-count">총알 <b>${E.picks.filter((x, i) => x != null && (i !== 1 || E.loc)).length}</b> / 6</span>
      <button class="btn btn-teal" id="fsSubmit">감식 결과 발표</button></div>`;
  } else if (g.phase === 'forensic') {
    body = `<div class="tiles">${g.tiles.map((t, i) => tileHtml(i === 1 ? { id: null } : { ...t, pick: null }, i, { text: '감식 중…' })).join('')}</div>`;
  } else {
    const swapMode = isFs() && g.phase === 'swap';
    body = `<div class="tiles">${g.tiles.map((t, i) => tileHtml(t, i, {
      animate: true,
      swappable: swapMode && g.swapIdx == null && i >= 2,
      canPick: swapMode && g.swapIdx === i,
    })).join('')}</div>`;
    if (swapMode) body += `<div class="fs-bar"><p>${g.swapIdx == null ? '바꿀 현장 타일을 하나 누르세요 (사인 · 장소는 못 바꿔요)' : '새 타일에 총알을 놓으세요'}<br>진실: <b>${esc(nameOf(g.know.murderer))}</b> · ${esc(CARD[g.know.murder.means].name)} + ${esc(CARD[g.know.murder.clue].name)}</p></div>`;
  }
  $('#scene').innerHTML = head + body;
}
$('#scene').addEventListener('click', (e) => {
  const g = S.g;
  if (!g) return;
  const loc = !e.target.closest('[data-loc-opt]') && e.target.closest('[data-loc]');
  if (loc && S.fsEdit) { SFX.card(); S.fsEdit.loc = loc.dataset.loc; S.fsEdit.picks[1] = null; renderScene(); return; }
  const lo = e.target.closest('[data-loc-opt]');
  if (lo && S.fsEdit) { SFX.bullet(); S.fsEdit.loc = lo.dataset.locOpt; S.fsEdit.picks[1] = Number(lo.dataset.k); renderScene(); return; }
  if (e.target.closest('#fsSubmit')) {
    const E = S.fsEdit;
    const missing = [];
    if (!E.loc || E.picks[1] == null) missing.push('장소');
    g.tiles.forEach((tl, i) => { if (i !== 1 && E.picks[i] == null) missing.push(TILE[tl.id].name); });
    if (missing.length) {
      toast(`아직 총알이 없는 타일: <b>${missing.map(esc).join(', ')}</b>`, 'err');
      SFX.alarm();
      $$('#scene .tiles .tile').forEach((el, i) => el.classList.toggle('need', i === 1 ? !E.loc || E.picks[1] == null : E.picks[i] == null));
      if (!E.loc) $('#scene .loc-pick').classList.add('need');
      return;
    }
    SFX.stamp();
    act({ type: 'forensic', location: E.loc, picks: E.picks }).then((r) => { if (r.ok) S.fsEdit = null; });
    return;
  }
  const opt = e.target.closest('.opt.can');
  if (opt && g.phase === 'forensic' && S.fsEdit) { SFX.bullet(); S.fsEdit.picks[Number(opt.dataset.ti)] = Number(opt.dataset.k); renderScene(); return; }
  if (opt && g.phase === 'swap') { SFX.bullet(); act({ type: 'swapPick', pick: Number(opt.dataset.k) }); return; }
  const sw = e.target.closest('.tile.swappable');
  if (sw) { SFX.card(); act({ type: 'swapOut', idx: Number(sw.dataset.ti) }); }
});

/* ── 용의자들 */
function renderSuspects() {
  const g = S.g;
  const r = myRole();
  const murder = g.know.murder;
  const nightPick = g.phase === 'night' && r === 'murderer';
  const huntPick = g.phase === 'witness' && bad(r);
  $('#suspects').innerHTML = g.players.map((p) => {
    const mine = p.pid === S.me;
    const knownRole = p.role || (g.know.murderer === p.pid ? 'murderer' : g.know.accomplice === p.pid ? 'accomplice' : g.know.witness === p.pid ? 'witness' : null);
    const suspect = g.know.suspects && g.know.suspects.includes(p.pid);
    const pickable = huntPick && !bad(p.role || (g.know.murderer === p.pid ? 'murderer' : g.know.accomplice === p.pid ? 'accomplice' : ''));
    const chosen = (id) => murder && g.know.murderer === p.pid && (murder.means === id || murder.clue === id);
    const cls = (id) => ({ w: 80, sel: mine && nightPick && (S.pick.means === id || S.pick.clue === id), uid: p.pid.slice(-3) });
    const cardEl = (id) => card(id, cls(id)).replace('class="kcard', `class="kcard ${chosen(id) ? 'chosen' : ''}`);
    const stamp = S.stamps[p.pid];
    return `<div class="sus ${mine ? 'me-sus' : ''} ${pickable ? 'pickable' : ''} ${S.witness === p.pid ? 'target' : ''} ${mine && nightPick ? 'picking' : ''}" data-pid="${p.pid}">
      <div class="sus-top">${face(p.pid, 30)}<b>${esc(p.name)}</b>${mine ? '<span class="tag">나</span>' : ''}
        ${knownRole ? `<span class="role ${knownRole}">${ROLES[knownRole].name}</span>` : ''}${suspect ? '<span class="role murderer">목격한 얼굴</span>' : ''}
        ${p.online ? '' : '<span class="off">자리비움</span>'}${g.phase === 'discuss' && p.ready ? '<span class="ready">토론 끝 ✓</span>' : ''}
        <span class="badge-ic ${p.badge ? '' : 'used'}" title="지목 기회">${p.badge ? '지목권 1' : '지목 끝'}</span></div>
      <div class="hand">${p.means.map(cardEl).join('')}</div>
      <div class="hand">${p.clues.map(cardEl).join('')}</div>
      ${stamp ? `<div class="stamp ${stamp.right ? 'yes' : 'no'}">${stamp.right ? '체포!' : '오답'}</div>` : ''}
    </div>`;
  }).join('');
}
$('#suspects').addEventListener('click', (e) => {
  const g = S.g;
  if (!g) return;
  const sus = e.target.closest('.sus');
  const c = e.target.closest('[data-card]');
  // 밤: 살인자가 내 카드에서 고르기
  if (g.phase === 'night' && myRole() === 'murderer' && sus && sus.dataset.pid === S.me && c) {
    const id = c.dataset.card;
    SFX.card();
    if (CARD[id].kind === 'm') S.pick.means = S.pick.means === id ? null : id;
    else S.pick.clue = S.pick.clue === id ? null : id;
    render();
    return;
  }
  // 목격자 찾기
  if (g.phase === 'witness' && bad(myRole()) && sus && sus.classList.contains('pickable')) {
    SFX.heart();
    S.witness = sus.dataset.pid;
    render();
    return;
  }
  if (c) zoom(c.dataset.card);
});
function zoom(id) {
  $('#zoom').innerHTML = cardSvg(CARD[id], { w: 300 });
  $('#zoom').hidden = false;
}
$('#zoom').addEventListener('click', () => { $('#zoom').hidden = true; });

/* ── 내 자리 · 행동 */
function renderMe() {
  const g = S.g;
  const r = myRole();
  const box = $('#me');
  if (!r) {
    box.innerHTML = '<div class="me-role"><div class="role-card watch">관전</div><div><h4>관전 중</h4><p>사건을 지켜보고 있어요.</p></div></div>';
    return;
  }
  let know = '';
  if (r === 'murderer' || r === 'accomplice') {
    const m = g.know.murder;
    know = `<p class="know">${r === 'accomplice' ? `살인자: <b>${esc(nameOf(g.know.murderer))}</b> · ` : ''}${g.know.accomplice && r === 'murderer' ? `공범: <b>${esc(nameOf(g.know.accomplice))}</b> · ` : ''}${m ? `고른 카드: <b>${esc(CARD[m.means].name)}</b> + <b>${esc(CARD[m.clue].name)}</b>` : '아직 고르는 중'}</p>`;
  }
  if (r === 'witness') know = `<p class="know">목격한 얼굴: <b>${g.know.suspects.map((p) => esc(nameOf(p))).join('</b>, <b>')}</b> (둘 중 하나가 살인자)</p>`;
  if (r === 'forensic') know = `<p class="know">진실: <b>${esc(nameOf(g.know.murderer))}</b> · ${g.know.murder ? `${esc(CARD[g.know.murder.means].name)} + ${esc(CARD[g.know.murder.clue].name)}` : '살인자가 고르는 중'}</p>`;
  const meP = pl(S.me);
  let acts = '';
  if (g.phase === 'night' && r === 'murderer') {
    const ok = S.pick.means && S.pick.clue;
    acts = `<span class="act-hint">내 카드에서 수단 1장 · 단서 1장을 누르세요</span><button class="btn btn-red" id="murderBtn" ${ok ? '' : 'disabled'}>이걸로 한다</button>`;
  } else if (g.phase === 'discuss' && meP) {
    acts = `${meP.badge ? '<button class="btn btn-red btn-lg" id="accuseBtn">지목하기</button>' : '<span class="act-hint">지목 기회를 썼어요</span>'}
      <button class="btn" id="readyBtn">${meP.ready ? '토론 계속' : '토론 끝'}</button>`;
  } else if (g.phase === 'witness' && bad(r)) {
    acts = r === 'murderer'
      ? `<span class="act-hint">목격자로 보이는 사람을 누르세요 (한 번)</span><button class="btn btn-red" id="witnessBtn" ${S.witness ? '' : 'disabled'}>이 사람이 목격자다</button>`
      : '<span class="act-hint">살인자에게 목격자가 누군지 대화로 알려 주세요</span>';
  } else if (g.phase === 'over') {
    acts = `<button class="btn" id="replayBtn">결말 다시 보기</button><button class="btn" id="resultBtn">결과 보기</button>`;
  }
  box.innerHTML = `<div class="me-role"><div class="role-card ${r}">${ROLES[r].name}</div><div><h4>나는 ${ROLES[r].name}${meP && !meP.badge && r !== 'forensic' ? ' · 지목 끝' : ''}</h4><p>${ROLES[r].short}</p>${know}</div></div><div class="me-actions">${acts}</div>`;
}
$('#me').addEventListener('click', (e) => {
  const g = S.g;
  if (e.target.closest('#murderBtn')) { SFX.stamp(); act({ type: 'murder', means: S.pick.means, clue: S.pick.clue }).then((r) => { if (r.ok) S.pick = { means: null, clue: null }; }); }
  if (e.target.closest('#readyBtn')) { SFX.click(); act({ type: 'ready', value: !pl(S.me).ready }); }
  if (e.target.closest('#accuseBtn')) openAccuse();
  if (e.target.closest('#witnessBtn')) { SFX.stamp(); act({ type: 'witness', target: S.witness }); }
  if (e.target.closest('#replayBtn')) showFilm(true);
  if (e.target.closest('#resultBtn')) showResult();
  void g;
});

/* ── 지목 창: 사람 → 수단 1장 + 단서 1장 */
const A = { target: null, means: null, clue: null };
function openAccuse() {
  Object.assign(A, { target: null, means: null, clue: null });
  paintAccuse();
  $('#modal').hidden = false;
}
function paintAccuse() {
  const g = S.g;
  const t = A.target && pl(A.target);
  $('#modalBox').innerHTML = `<h3>지목하기 <small class="muted" style="font:13px var(--font)">게임에서 딱 한 번!</small></h3><div class="acc-steps">
    <div class="acc-who">${g.players.filter((p) => p.pid !== S.me).map((p) => `<button data-acc="${p.pid}" class="${A.target === p.pid ? 'on' : ''}">${face(p.pid, 26)}${esc(p.name)}</button>`).join('')}</div>
    ${t ? `<div><b>수단</b> 한 장<div class="acc-cards">${t.means.map((id) => card(id, { w: 120, sel: A.means === id })).join('')}</div></div>
      <div><b>단서</b> 한 장<div class="acc-cards">${t.clues.map((id) => card(id, { w: 120, sel: A.clue === id })).join('')}</div></div>` : '<p class="muted">먼저 범인이라고 생각하는 사람을 고르세요.</p>'}
    <div class="acc-sum">${t ? `<b>${esc(t.name)}</b> 이(가) ${A.means ? `<b>${esc(CARD[A.means].name)}</b>` : '?'} (으)로 죽였고, 결정적 단서는 ${A.clue ? `<b>${esc(CARD[A.clue].name)}</b>` : '?'} 이다!` : '…'}</div>
  </div><div class="modal-btns"><button class="btn" data-close>취소</button><button class="btn btn-red btn-lg" id="accGo" ${A.target && A.means && A.clue ? '' : 'disabled'}>지목!</button></div>`;
}
$('#modalBox').addEventListener('click', (e) => {
  const w = e.target.closest('[data-acc]');
  if (w) { SFX.click(); A.target = w.dataset.acc; A.means = null; A.clue = null; paintAccuse(); return; }
  const c = e.target.closest('.acc-cards [data-card]');
  if (c) { SFX.card(); const id = c.dataset.card; if (CARD[id].kind === 'm') A.means = id; else A.clue = id; paintAccuse(); return; }
  if (e.target.closest('#accGo')) {
    act({ type: 'accuse', target: A.target, means: A.means, clue: A.clue }).then((r) => { if (r.ok) $('#modal').hidden = true; });
  }
});

/* ── 기록 · 배너 · 시간 */
function renderLog() {
  const el = $('#tab-log');
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  el.innerHTML = S.g.log.map((l) => `<div class="lg ${l.kind}">${logText(l.text)}</div>`).join('');
  if (atBottom) el.scrollTop = el.scrollHeight;
}
function renderBanner() {
  const g = S.g;
  const txt = g.phase === 'discuss' ? `토론 ${g.round}라운드` : PHASE[g.phase];
  $('#phaseBanner').innerHTML = `${g.round ? `<span class="rd">ROUND ${g.round}/${g.rounds}</span>` : ''}<span>${txt}</span><span class="tm" id="tm"></span>`;
  $('#gameCode').textContent = S.room.code;
  $('#hostLobbyBtn').hidden = !(g.phase === 'over' && S.room.hostPid === S.me);
}
function tickTimer() {
  const g = S.g;
  const bar = $('#timerBar');
  if (!g || !g.deadlineIn || g.phase === 'over') { if (bar) bar.style.width = '0'; const t = $('#tm'); if (t) t.textContent = ''; return; }
  const left = Math.max(0, g.deadlineIn - (Date.now() - S.receivedAt));
  const tot = g.deadlineTotal || g.deadlineIn;
  bar.style.width = `${Math.min(100, (left / tot) * 100)}%`;
  const t = $('#tm');
  if (t) t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
  if (left < 10000 && left > 0 && g.phase === 'discuss' && Math.floor(left / 1000) !== S.lastTick) { S.lastTick = Math.floor(left / 1000); SFX.tick(); }
}
setInterval(tickTimer, 250);

/* ── 사건 소리 · 도장 */
function playEvents() {
  const g = S.g;
  const fresh = g.events.filter((e) => e.seq > S.seenSeq);
  S.seenSeq = g.seq;
  for (const e of fresh) {
    if (e.type === 'night') SFX.thunder();
    if (e.type === 'tiles') { for (let i = 0; i < 6; i++) setTimeout(() => SFX.bullet(), 200 + i * 180); }
    if (e.type === 'round') SFX.type();
    if (e.type === 'swapOut') SFX.card();
    if (e.type === 'accuse') {
      SFX.stamp();
      setTimeout(() => (e.right ? SFX.right() : SFX.wrong()), 300);
      S.stamps[e.target] = { right: e.right };
      toast(`<b>${esc(nameOf(e.by))}</b> → <b>${esc(nameOf(e.target))}</b> · ${esc(CARD[e.means].name)} + ${esc(CARD[e.clue].name)} … ${e.right ? '<b style="color:#6af0a0">정답!</b>' : '틀렸습니다'}`, e.right ? 'gold' : 'err');
      setTimeout(() => { delete S.stamps[e.target]; if (S.g) renderSuspects(); }, 4200);
    }
    if (e.type === 'witnessHunt') { SFX.heart(); setTimeout(() => SFX.heart(), 900); }
    if (e.type === 'witnessGuess') (e.right ? SFX.scream : SFX.right)();
  }
}

/* ── 결과 · 결말 영상 */
async function showFilm(force) {
  const g = S.g;
  if (!g || !g.over) return;
  if (!force && S.filmShown === g.id) return;
  S.filmShown = g.id;
  const o = g.over;
  const kind = o.reason === 'witness' ? 'witness' : o.winner === 'good' ? 'solved' : 'escaped';
  await playEnding($('#film'), { kind, murder: o.murder, murderer: nameOf(o.murderer), solver: o.solver ? nameOf(o.solver) : '', sound: SFX });
  showResult();
}
function showResult() {
  const g = S.g;
  if (!g || !g.over) return;
  const o = g.over;
  const why = { solved: '수사팀이 살인자를 체포했습니다', time: '세 라운드 동안 아무도 맞히지 못했습니다', badges: '수사관들이 지목 기회를 모두 써 버렸습니다', witness: '살인자가 목격자를 찾아내 입을 막았습니다' }[o.reason];
  $('#modalBox').innerHTML = `<div class="result"><div class="verdict ${o.winner}">${o.winner === 'good' ? '수사팀 승리' : '살인자 승리'}</div><p>${why}</p>
    <div class="truth">${face(o.murderer, 60)}<div><b style="font:22px var(--display)">${esc(nameOf(o.murderer))}</b><br><span class="muted">살인자</span></div>${card(o.murder.means, { w: 120 })}${card(o.murder.clue, { w: 120 })}</div>
    <div class="roles">${o.roles.map((x) => `<span>${face(x.pid, 24)}${esc(nameOf(x.pid))} · <b class="role ${x.role}" style="padding:0 5px;border-radius:3px">${ROLES[x.role].name}</b></span>`).join('')}</div>
    </div><div class="modal-btns"><button class="btn btn-red" data-close>닫기</button></div>`;
  $('#modal').hidden = false;
}

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
    S.pick = { means: null, clue: null };
    S.fsEdit = null;
    S.witness = null;
    S.stamps = {};
    mountChat($('#tab-chat'));
    if (g.phase !== 'over') toast(`당신은 <b>${esc(ROLES[myRole() || 'investigator'].name)}</b>입니다`, 'gold');
  }
  if (g.phase !== 'forensic') S.fsEdit = null;
  if (g.phase !== 'witness') S.witness = null;
  playEvents();
  renderBanner();
  renderScene();
  renderSuspects();
  renderMe();
  renderLog();
  tickTimer();
  if (g.phase === 'over') showFilm(false);
}
