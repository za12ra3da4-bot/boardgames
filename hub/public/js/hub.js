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
      <img class="box-art" src="/bang/assets/box.svg" alt="" onload="this.parentNode.classList.add('has-art')" onerror="this.remove()">
      <div class="art-title">황야의 <b>뱅!</b></div>
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
  // 짙은 남색 상자 · 벽난로 응접실에 모인 용의자들 · 둥근 흰 제목
  clue: () => `
    <div class="cf">
      <img class="cf-room" src="/clue/assets/box.svg" alt="">
      <div class="cf-shade"></div>
      <div class="cf-title">밤의 저택<small>MANSION MYSTERY</small></div>
      <div class="cf-tag"><small>모두가 용의자, 진실은 단 하나</small>폭풍우 치는 밤, 저택의 살인 사건</div>
      <div class="cf-age">10+</div>
    </div>`,
};

FRONT.isle = () => `
    <div class="if">
      <img class="if-art" src="/isle/assets/box.svg" alt="">
      <div class="if-small">개척과 교역의 보드게임</div>
      <div class="if-title">바람섬</div>
      <div class="if-rule"></div>
      <div class="if-en">ISLE OF WINDS</div>
      <div class="if-band"><span>3~4명</span><span>45~75분</span><span>10세 이상</span></div>
    </div>`;

// 주황 바탕에 카드를 든 바퀴 (직접 그린 상자 그림)
FRONT.roach = () => `
    <div class="kf">
      <img class="kf-art" src="/roach/assets/box.png" alt="">
    </div>`;

// 어둠 속 보석상 그림 + 금빛 제목 (스플렌더 상자 느낌)
FRONT.gem = () => `
    <div class="gf2">
      <img class="gf2-art" src="/gem/assets/box.svg" alt="">
      <div class="gf2-author">Renaissance Merchants</div>
      <div class="gf2-title">찬란한 보석상</div>
      <div class="gf2-band"><span>2~4명</span><span>30분</span><span>10세 이상</span></div>
    </div>`;

// 붉은 연기 속 누아르 · 네온 푸른 제목 (디셉션 상자 구도)
FRONT.kowloon = () => `
    <div class="kf">
      <img class="kf-art" src="/kowloon/assets/box.png" alt="">
      <div class="kf-band"><span>3~12명</span><span>20분</span><span>14세 이상</span></div>
    </div>`;

// 붉은 휘장 왕궁 · 계급 카드 피라미드
FRONT.dalmuti = () => `
    <div class="kf dmf">
      <img class="kf-art" src="/dalmuti/assets/box.png" alt="">
    </div>`;

// 확장판 상자: 쪽빛 · 일월오봉도
FRONT['dalmuti-joseon'] = () => `
    <div class="kf dmf">
      <img class="kf-art" src="/dalmuti/assets/box-joseon.png" alt="">
    </div>`;

const SPINE = {
  'dalmuti-joseon': '달무티 조선 궁궐판',
  dalmuti: '왕궁의 달무티',
  kowloon: '구룡 살인사건',
  gem: '찬란한 보석상',
  roach: '바퀴벌레 포커',
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
  filmBtn.hidden = !CAN_EDIT;
  document.getElementById('artBtn').hidden = !CAN_EDIT;
}

/* ───── 결말 영상 미리 보기 (관리자 전용) ───── */
const filmBtn = document.getElementById('filmBtn');
const filmDialog = document.getElementById('filmDialog');
const FILMS = [
  { game: '황야의 뱅', list: [['무법자 승리', 'bang', 'outlaw'], ['보안관 승리', 'bang', 'sheriff'], ['배신자 승리', 'bang', 'renegade']] },
  { game: '밤의 저택', list: [['사건 해결', 'clue', 'solved'], ['미제 사건', 'clue', 'unsolved']] },
  { game: '왕궁의 달무티', list: [['대관식', 'dalmuti', 'crown'], ['혁명 후 대관식', 'dalmuti', 'rose']] },
  { game: '달무티 조선 궁궐판', list: [['즉위식', 'dalmuti', 'joseon']] },
  { game: '구룡 살인사건', list: [['사건 해결', 'kowloon', 'solved'], ['미제 사건', 'kowloon', 'escaped'], ['목격자 제거', 'kowloon', 'witness']] },
  { game: '바퀴벌레 포커', list: [['패자 결정', 'roach', 'lose']] },
];
// 영상에 나올 물건 · 증거를 직접 고른다 (기본은 무작위)
const PICKS = {
  kowloon: [['kwMeans', '살인 수단'], ['kwClue', '단서']],
  clue: [['clSuspect', '범인'], ['clWeapon', '흉기'], ['clRoom', '장소']],
};
document.getElementById('filmList').innerHTML = FILMS.map((g) => {
  const id0 = g.list[0][1];
  const picks = PICKS[id0] ? `<div class="film-pick">${PICKS[id0].map(([sid, label]) => `<label>${label}<select id="${sid}"><option value="">무작위</option></select></label>`).join('')}</div>` : '';
  return `<div class="film-game"><h4>${g.game}</h4>${picks}${g.list.map(([label, id, kind]) => `<button type="button" class="btn" data-film="${id}:${kind}">▶ ${label}</button>`).join('')}</div>`;
}).join('');
const loadScript = (src, glob) => (window[glob] ? Promise.resolve() : new Promise((res) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); }));
async function fillPicks() {
  await Promise.all([loadScript('/kowloon/shared/kowloon.js', 'KOWLOON'), loadScript('/clue/shared/data.js', 'CLUE')]);
  const fill = (sid, items) => { const el = document.getElementById(sid); if (el && el.options.length <= 1) el.insertAdjacentHTML('beforeend', items.map(([v, n]) => `<option value="${v}">${esc(n)}</option>`).join('')); };
  if (window.KOWLOON) {
    const all = Object.values(window.KOWLOON.CARD);
    fill('kwMeans', all.filter((c) => c.kind === 'm').map((c) => [c.id, c.name]));
    fill('kwClue', all.filter((c) => c.kind === 'c').map((c) => [c.id, c.name]));
  }
  if (window.CLUE) {
    fill('clSuspect', window.CLUE.SUSPECTS.map((s) => [s.id, s.name]));
    fill('clWeapon', window.CLUE.WEAPONS.map((w) => [w.id, w.name]));
    fill('clRoom', window.CLUE.ROOMS.map((r) => [r.id, r.name]));
  }
}
const picked = (sid, list) => { const v = (document.getElementById(sid) || {}).value; return v || list[Math.floor(Math.random() * list.length)]; };
filmBtn.addEventListener('click', () => { filmDialog.hidden = false; fillPicks(); });
document.getElementById('filmClose').addEventListener('click', () => { filmDialog.hidden = true; });
document.getElementById('filmList').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-film]');
  if (!b) return;
  const [id, kind] = b.dataset.film.split(':');
  const host = document.getElementById('filmHost');
  filmDialog.hidden = true;
  // 효과음: 늑대인간 게임의 합성 효과음을 빌려 쓴다
  if (!window.SFX) await new Promise((res) => { const s = document.createElement('script'); s.src = '/roach/js/sfx.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  const X = window.SFX || {};
  X.unlock && X.unlock();
  const call = (n) => X[n] && X[n]();
  const MAP = {
    'start:wolf': () => { call('drone'); setTimeout(() => call('drone'), 2200); }, 'start:village': () => { call('drone'); setTimeout(() => call('rooster'), 4000); },
    'start:tanner': () => call('drone'), 'start:none': () => { call('drone'); setTimeout(() => call('lose'), 3000); }, 'start:duel': () => call('bell'),
    roar: () => { call('growl'); call('hit'); }, whoosh: () => call('flip'), impact: () => call('boom'), slash: () => { call('slash'); call('hit'); },
    cheer: () => { call('win'); setTimeout(() => call('bell'), 600); }, thunder: () => call('boom'), tension: () => call('tick'),
    gun: () => { call('boom'); call('hit'); }, gun2: () => setTimeout(() => { call('boom'); }, 40), laugh: () => call('lose'), wind: () => call('flip'), whistle: () => call('bell'),
  };
  const sound = (k) => (MAP[k] ? MAP[k]() : call(k));
  try {
    if (id === 'bang') {
      const m = await import('/bang/js/ending.js');
      await m.playEnding(host, [kind], { sub: '미리 보기', sound });
    } else if (id === 'roach') {
      const m = await import('/roach/js/ending.js');
      const KS = ['파리', '전갈', '두꺼비', '거미', '쥐', '박쥐', '노린재'];
      await m.playEnding(host, { loser: '미리 보기', winners: '나머지 타짜', claim: KS[Math.floor(Math.random() * KS.length)], liar: '맞은편 타짜', sound });
    } else if (id === 'clue') {
      if (!window.CLUE) await new Promise((res) => { const s = document.createElement('script'); s.src = '/clue/shared/data.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
      const m = await import('/clue/js/ending.js');
      const C = window.CLUE;
      const solution = { suspect: picked('clSuspect', C.SUSPECTS.map((s) => s.id)), weapon: picked('clWeapon', C.WEAPONS.map((w) => w.id)), room: picked('clRoom', C.ROOMS.map((r) => r.id)) };
      await m.playEnding(host, { kind, solution, solver: '미리 보기', sound: X });
    } else if (id === 'dalmuti') {
      if (!window.DALMUTI) await new Promise((res) => { const s = document.createElement('script'); s.src = '/dalmuti/shared/dalmuti.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
      const m = await import('/dalmuti/js/ending.js');
      await m.playEnding(host, { champion: '미리 보기', peon: kind === 'joseon' ? '노비' : '농노', rose: kind === 'rose', sound: X, edition: kind === 'joseon' ? 'joseon' : 'classic' });
    } else if (id === 'kowloon') {
      // 카드 데이터가 필요하다
      if (!window.KOWLOON) await new Promise((res) => { const s = document.createElement('script'); s.src = '/kowloon/shared/kowloon.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
      const m = await import('/kowloon/js/ending.js');
      // 볼 때마다 다른 수단 · 단서
      const all = Object.values(window.KOWLOON.CARD);
      const ids = (kd) => all.filter((c) => c.kind === kd).map((c) => c.id);
      await m.playEnding(host, { kind, murder: { means: picked('kwMeans', ids('m')), clue: picked('kwClue', ids('c')) }, murderer: '미리 보기', solver: '진 형사', witness: '메이', sound: X });
    }
  } catch (err) {
    console.error(err);
    alert('영상을 불러오지 못했어요');
  }
  filmDialog.hidden = false;
});

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
