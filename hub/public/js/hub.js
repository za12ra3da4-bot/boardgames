'use strict';
// 게임 목록을 불러와 실제 보드게임 상자처럼 진열한다.

const shelf = document.getElementById('shelf');
const addrUrl = document.getElementById('addr-url');
const copyBtn = document.getElementById('copy');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 친구가 접속한 그대로의 주소를 쓴다 (하마치 IP든 localhost든) */
const hubUrl = location.origin;
addrUrl.textContent = hubUrl;

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(hubUrl);
    copyBtn.textContent = '복사됨!';
    setTimeout(() => { copyBtn.textContent = '복사'; }, 1600);
  } catch (e) {
    const r = document.createRange();
    r.selectNodeContents(addrUrl);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }
});

/* ───── 상자 앞면 그림 (게임마다) ───── */

const FRONT = {
  // 나무 상자 + 수배 전단
  bang: () => `
    <div class="bf">
      <div class="bf-title">황야의 <b>뱅!</b></div>
      <div class="bf-kicker">서부 총잡이 카드게임</div>
      <div class="bf-poster">
        <div class="bf-wanted">WANTED</div>
        <div class="bf-dead">DEAD OR ALIVE</div>
        <img src="/bang/assets/char/jack.svg" alt="">
        <div class="bf-reward">현상금 $5,000</div>
      </div>
      <div class="bf-star"><span>4~7명<br>온라인</span></div>
      <div class="bf-foot">보안관 · 부관 · 무법자 · 배신자</div>
    </div>`,
  // 짙은 초록 띠 + 가운데 인물 그림 + 아래 문구 띠
  clue: () => `
    <div class="cf">
      <div class="cf-band">
        <div class="cf-badge">한판 추리</div>
        <div class="cf-small">MANSION MYSTERY GAME</div>
        <div class="cf-title">밤의 저택</div>
      </div>
      <div class="cf-art">
        <img class="cf-room" src="/clue/assets/room/library.svg" alt="">
        ${['kang', 'seo', 'baek', 'han', 'yoon', 'oh'].map((id, i) => `<img class="cf-face" style="--i:${i}" src="/clue/assets/char/${id}.svg" alt="">`).join('')}
      </div>
      <div class="cf-tag">저택에 숨은 진실을 밝혀라!</div>
    </div>`,
};

FRONT.isle = () => `
    <div class="if">
      <img class="if-art" src="/isle/assets/box.svg" alt="">
      <div class="if-title">바람섬<b>개척기</b></div>
      <div class="if-en">ISLE OF WINDS</div>
      <div class="if-band"><span>3~4명</span><span>45~75분</span><span>10세 이상</span></div>
    </div>`;

const SPINE = {
  bang: '황야의 뱅!',
  clue: '밤의 저택',
  isle: '바람섬 개척기',
};

let CAN_EDIT = false;

/* ───── 관리자 로그인 (링크 고치기는 관리자만) ───── */
const adminBtn = document.getElementById('adminBtn');
const adminDialog = document.getElementById('adminDialog');
const adminForm = document.getElementById('adminForm');
const adminErr = document.getElementById('adminErr');
const getToken = () => { try { return localStorage.getItem('hub.adminToken') || ''; } catch (e) { return ''; } };
const setToken = (t) => { try { if (t) localStorage.setItem('hub.adminToken', t); else localStorage.removeItem('hub.adminToken'); } catch (e) { /* 무시 */ } };
const authHeaders = () => (getToken() ? { 'x-admin-token': getToken() } : {});

function paintAdmin() {
  adminBtn.textContent = CAN_EDIT ? '관리자 로그아웃' : '관리자';
  adminBtn.classList.toggle('on', CAN_EDIT);
}

adminBtn.addEventListener('click', async () => {
  if (CAN_EDIT) {
    await fetch('api/admin/logout', { method: 'POST', headers: authHeaders() }).catch(() => {});
    setToken('');
    await load();
    return;
  }
  adminErr.hidden = true;
  adminForm.reset();
  adminDialog.hidden = false;
  adminForm.password.focus();
});
document.getElementById('adminCancel').addEventListener('click', () => { adminDialog.hidden = true; });
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminForm.password.value }),
  });
  const r = await res.json().catch(() => ({ ok: false, error: '서버 응답을 읽지 못했어요' }));
  if (!r.ok) {
    adminErr.textContent = r.error || '로그인하지 못했어요';
    adminErr.hidden = false;
    adminForm.password.select();
    return;
  }
  setToken(r.token);
  adminDialog.hidden = true;
  await load();
});

function linksHtml(g) {
  const items = g.links.map((l, i) => `<li>
      <a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
        <img src="assets/play.svg" alt=""><span>${esc(l.title)}</span>${l.note ? `<em>${esc(l.note)}</em>` : ''}
      </a>
      ${CAN_EDIT ? `<span class="lk-tools">
        <button type="button" data-link="move" data-dir="up" data-game="${esc(g.id)}" data-i="${i}" title="위로" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" data-link="move" data-dir="down" data-game="${esc(g.id)}" data-i="${i}" title="아래로" ${i === g.links.length - 1 ? 'disabled' : ''}>▼</button>
        <button type="button" data-link="remove" data-game="${esc(g.id)}" data-i="${i}" title="삭제">✕</button>
      </span>` : ''}
    </li>`).join('');
  return `<div class="links">
    <div class="links-head">게임 방법 영상</div>
    ${items ? `<ul>${items}</ul>` : '<p class="links-empty">아직 등록된 영상이 없어요</p>'}
    ${CAN_EDIT ? `<form class="link-add" data-game="${esc(g.id)}">
        <input name="url" placeholder="영상 주소 (https://…)" required>
        <input name="title" placeholder="제목 (예: 3분 룰 설명)">
        <input name="note" placeholder="길이 (예: 4분)" class="short">
        <button type="submit" class="btn small">+ 추가</button>
      </form>` : ''}
  </div>`;
}

function boxHtml(g) {
  const front = FRONT[g.id] ? FRONT[g.id]() : `<div class="gf"><img src="logo/${g.id}.svg" alt=""><b>${esc(g.title)}</b></div>`;
  return `<div class="game ${esc(g.id)}">
    <a class="stage" href="${esc(g.url)}" title="${esc(g.title)} 들어가기">
      <div class="box">
        <div class="face front">${front}</div>
        <div class="face side"><span>${esc(SPINE[g.id] || g.title)}</span></div>
        <div class="face lid"></div>
      </div>
      <div class="floor-shadow"></div>
    </a>
    <div class="label">
      <b>${esc(g.title)}</b>
      <p>${esc(g.desc)}</p>
      <div class="meta">
        <span>${esc(g.sub)}</span><span>${esc(g.players)}</span><span>${esc(g.time)}</span>
      </div>
      <a class="btn go" href="${esc(g.url)}">들어가기</a>
      ${linksHtml(g)}
    </div>
  </div>`;
}

async function load() {
  let data;
  try {
    const res = await fetch('api/games', { cache: 'no-store', headers: authHeaders() });
    data = await res.json();
  } catch (e) {
    shelf.innerHTML = '<div class="loading">서버와 연결이 끊겼어요. 잠시 뒤 다시 시도합니다…</div>';
    setTimeout(load, 3000);
    return;
  }
  CAN_EDIT = !!data.canEdit;
  if (!CAN_EDIT && getToken()) setToken('');   // 만료된 로그인은 지운다
  paintAdmin();
  shelf.innerHTML = data.games.map(boxHtml).join('');
  shelf.removeAttribute('aria-busy');
  document.body.classList.toggle('can-edit', CAN_EDIT);
}

async function editLinks(body) {
  const res = await fetch('api/links', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body),
  });
  const r = await res.json().catch(() => ({ ok: false, error: '서버 응답을 읽지 못했어요' }));
  if (!r.ok) alert(r.error || '고치지 못했어요');
  await load();
}

shelf.addEventListener('click', (e) => {
  const b = e.target.closest('[data-link]');
  if (!b) return;
  e.preventDefault();
  const body = { game: b.dataset.game, action: b.dataset.link, index: Number(b.dataset.i), dir: b.dataset.dir };
  if (body.action === 'remove' && !confirm('이 링크를 지울까요?')) return;
  editLinks(body);
});
shelf.addEventListener('submit', (e) => {
  const f = e.target.closest('.link-add');
  if (!f) return;
  e.preventDefault();
  const d = new FormData(f);
  editLinks({ game: f.dataset.game, action: 'add', url: d.get('url'), title: d.get('title'), note: d.get('note') });
});

load();
