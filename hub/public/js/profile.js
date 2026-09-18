/* 내 캐릭터 꾸미기 (옷 입히기) */
import { avatarSvg, PARTS, EMOTES } from '/common/avatar.js';
import { getMe } from '/common/me.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DRAFT = 'bg.profileDraft';

const TABS = [
  { key: 'hair', name: '머리', crop: 'head', noHat: true },
  { key: 'hairColor', name: '머리 색', crop: 'head', noHat: true },
  { key: 'skin', name: '피부', crop: 'head' },
  { key: 'eyes', name: '눈', crop: 'head', expr: 'neutral' },
  { key: 'mouth', name: '입', crop: 'head', expr: 'neutral' },
  { key: 'outfit', name: '옷', crop: 'full' },
  { key: 'cloth', name: '옷 색', crop: 'full' },
  { key: 'hat', name: '모자', crop: 'head' },
  { key: 'acc', name: '장신구', crop: 'head' },
  { key: 'bg', name: '배경', crop: 'bg' },
];

let user = null;
let tab = 'hair';
let dirty = false;
let st = { av: PARTS.fromSeed(Math.random()), nickname: '', title: PARTS.TITLES[0], bio: '' };
let tryTimer = 0;

function loadDraft() {
  try { const d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); if (d && d.av) return d; } catch (_) { /* 무시 */ }
  return null;
}
function keepDraft() {
  try { localStorage.setItem(DRAFT, JSON.stringify(st)); } catch (_) { /* 무시 */ }
}

/* ───── 거울 (큰 캐릭터) */
function paintMirror(emote = '') {
  const bg = PARTS.bg.find((b) => b.id === st.av.bg) || PARTS.bg[0];
  const m = $('#mirror');
  m.style.background = `repeating-linear-gradient(-45deg, transparent 0 16px, ${bg.ink}33 16px 18px), radial-gradient(ellipse at 50% 40%, #ffffff55, transparent 70%), ${bg.fill}`;
  m.innerHTML = `<div class="fig">${avatarSvg(st.av, emote ? { emote } : { cls: 'idle' })}</div>`;
  $('#pTitle').textContent = st.title;
  $('#pName').textContent = st.nickname || '이름 없음';
  $('#pBio').textContent = st.bio;
}

/* ───── 옷장 */
function paintTabs() {
  $('#tabs').innerHTML = TABS.map((t) => `<button type="button" data-tab="${t.key}" class="${t.key === tab ? 'on' : ''}">${t.name}</button>`).join('');
}
function paintShelf() {
  const t = TABS.find((x) => x.key === tab);
  const list = PARTS[t.key];
  $('#shelf').innerHTML = list.map((o) => {
    const av = { ...st.av, [t.key]: o.id, ...(t.noHat ? { hat: 'none' } : {}) };
    let pic;
    if (t.crop === 'bg') pic = avatarSvg(av, { crop: 'head', bg: true });
    else if (t.crop === 'full') pic = avatarSvg(av, {});
    else pic = avatarSvg(av, { crop: 'head', expr: t.expr });
    return `<button type="button" class="item ${t.crop === 'full' ? 'full' : ''} ${st.av[t.key] === o.id ? 'on' : ''}" data-part="${t.key}" data-id="${o.id}">${pic}<span>${esc(o.name)}</span></button>`;
  }).join('');
}
function paintTitles() {
  $('#titles').innerHTML = PARTS.TITLES.map((x) => `<button type="button" class="${x === st.title ? 'on' : ''}" data-title="${esc(x)}">${esc(x)}</button>`).join('');
}
function paintTry() {
  $('#tryRow').innerHTML = EMOTES.map((e) => `<button type="button" data-try="${e.id}">${esc(e.text)}</button>`).join('');
}
function paintWho() {
  const w = $('#who');
  if (user) {
    w.innerHTML = `<span><b>${esc(user.google ? `${user.profile.nickname} (구글)` : user.username)}</b> 로 로그인됨</span><button type="button" id="logout">로그아웃</button>`;
  } else {
    w.innerHTML = '<span>로그인 안 됨 · 꾸민 건 이 브라우저에 임시로 남아요</span>';
  }
  $('#auth').hidden = !!user;
  $('#pwBox').hidden = !user || user.google;
  $('#saveBtn').textContent = user ? '저장하기' : '저장하기 (로그인 필요)';
}
function paintAll() {
  paintTabs();
  paintShelf();
  paintTitles();
  paintMirror();
  paintWho();
  $('#nick').value = st.nickname;
  $('#bio').value = st.bio;
}

function change() {
  dirty = true;
  $('#saveMsg').textContent = user ? '저장 안 한 변경이 있어요' : '';
  $('#saveMsg').className = 'msg';
  keepDraft();
}

/* ───── 서버 */
async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body || {}) });
  let d = {};
  try { d = await r.json(); } catch (_) { /* 무시 */ }
  if (!r.ok || d.ok === false) throw new Error(d.error || '실패했어요');
  return d;
}
async function saveProfile() {
  const d = await post('/api/account/profile', { nickname: st.nickname, avatar: st.av, title: st.title, bio: st.bio });
  user = d.user;
  dirty = false;
  try { localStorage.removeItem(DRAFT); } catch (_) { /* 무시 */ }
  return d;
}

/* ───── 이벤트 */
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  tab = b.dataset.tab;
  paintTabs();
  paintShelf();
});
$('#shelf').addEventListener('click', (e) => {
  const b = e.target.closest('[data-part]');
  if (!b) return;
  st.av = { ...st.av, [b.dataset.part]: b.dataset.id };
  change();
  paintShelf();
  paintMirror();
});
$('#titles').addEventListener('click', (e) => {
  const b = e.target.closest('[data-title]');
  if (!b) return;
  st.title = b.dataset.title;
  change();
  paintTitles();
  paintMirror();
});
$('#nick').addEventListener('input', (e) => { st.nickname = e.target.value.trim(); change(); paintMirror(); });
$('#bio').addEventListener('input', (e) => { st.bio = e.target.value; change(); paintMirror(); });
$('#dice').addEventListener('click', () => {
  st.av = { ...PARTS.fromSeed(Math.random()), acc: PARTS.acc[Math.floor(Math.random() * PARTS.acc.length)].id };
  change();
  paintShelf();
  paintMirror('tease');
  clearTimeout(tryTimer);
  tryTimer = setTimeout(() => paintMirror(), 1800);
});
$('#tryRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-try]');
  if (!b) return;
  paintMirror(b.dataset.try);
  clearTimeout(tryTimer);
  tryTimer = setTimeout(() => paintMirror(), 3400);
});

$('#saveBtn').addEventListener('click', async () => {
  const msg = $('#saveMsg');
  if (!st.nickname) { msg.textContent = '닉네임을 적어 주세요'; msg.className = 'msg err'; $('#nick').focus(); return; }
  if (!user) {
    msg.textContent = '아래에서 가입하거나 로그인하면 저장돼요';
    msg.className = 'msg';
    $('#auth').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#authForm [name=username]').focus();
    return;
  }
  $('#saveBtn').disabled = true;
  try {
    await saveProfile();
    msg.textContent = '저장했어요! 이제 게임에서 이 캐릭터가 나와요';
    msg.className = 'msg ok';
    paintMirror('gg');
    clearTimeout(tryTimer);
    tryTimer = setTimeout(() => paintMirror(), 2600);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg err';
  } finally {
    $('#saveBtn').disabled = false;
  }
});

let mode = 'signup';
$('#auth .sw2').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  mode = b.dataset.mode;
  document.querySelectorAll('#auth .sw2 button').forEach((x) => x.classList.toggle('on', x === b));
  $('#authBtn').textContent = mode === 'signup' ? '가입하고 저장' : '로그인';
  $('#authForm [name=password]').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  $('#authMsg').textContent = '';
});
$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = $('#authMsg');
  msg.textContent = '';
  msg.className = 'msg';
  if (mode === 'signup' && !st.nickname) { msg.textContent = '위에 닉네임을 먼저 적어 주세요'; msg.className = 'msg err'; $('#nick').focus(); return; }
  $('#authBtn').disabled = true;
  try {
    if (mode === 'signup') {
      const d = await post('/api/account/signup', { username: f.username.value, password: f.password.value, nickname: st.nickname, avatar: st.av });
      user = d.user;
      await saveProfile();
    } else {
      const d = await post('/api/account/login', { username: f.username.value, password: f.password.value });
      user = d.user;
      // 로그인 전에 꾸민 게 있으면 그걸 저장하고, 없으면 저장돼 있던 캐릭터를 불러온다
      if (dirty && st.nickname) await saveProfile();
      else st = { av: user.profile.avatar, nickname: user.profile.nickname, title: user.profile.title, bio: user.profile.bio };
      dirty = false;
    }
    f.reset();
    await getMe(true);
    paintAll();
    $('#saveMsg').textContent = mode === 'signup' ? '가입 완료! 캐릭터를 저장했어요' : '로그인했어요';
    $('#saveMsg').className = 'msg ok';
    paintMirror('nice');
    clearTimeout(tryTimer);
    tryTimer = setTimeout(() => paintMirror(), 2600);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg err';
  } finally {
    $('#authBtn').disabled = false;
  }
});

$('#who').addEventListener('click', async (e) => {
  if (!e.target.closest('#logout')) return;
  await post('/api/account/logout').catch(() => {});
  user = null;
  await getMe(true);
  paintWho();
});

$('#pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const msg = $('#saveMsg');
  try {
    await post('/api/account/password', { old: f.old.value, password: f.password.value });
    f.reset();
    msg.textContent = '비밀번호를 바꿨어요';
    msg.className = 'msg ok';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg err';
  }
});

window.addEventListener('beforeunload', (e) => {
  if (user && dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ───── 구글 로그인 */
async function afterLogin(label) {
  await getMe(true);
  paintAll();
  $('#saveMsg').textContent = label;
  $('#saveMsg').className = 'msg ok';
  paintMirror('nice');
  clearTimeout(tryTimer);
  tryTimer = setTimeout(() => paintMirror(), 2600);
}
async function onGoogle(resp) {
  const gm = $('#gMsg');
  gm.textContent = '확인 중…';
  gm.className = 'msg';
  try {
    const d = await post('/api/account/google', { credential: resp.credential, draft: dirty ? st : null });
    user = d.user;
    if (d.created) {
      // 새 계정: 지금 꾸민 캐릭터 그대로 (구글 이름으로 닉네임을 채웠을 수 있다)
      st.nickname = st.nickname || user.profile.nickname;
      await saveProfile();
    } else if (dirty && st.nickname) {
      await saveProfile();
    } else {
      st = { av: user.profile.avatar, nickname: user.profile.nickname, title: user.profile.title, bio: user.profile.bio };
    }
    dirty = false;
    gm.textContent = '';
    await afterLogin(d.created ? '구글로 가입했어요! 캐릭터를 저장했어요' : '구글로 로그인했어요');
  } catch (err) {
    gm.textContent = err.message;
    gm.className = 'msg err';
  }
}
async function setupGoogle() {
  let cfg = {};
  try { cfg = await (await fetch('/api/auth/config')).json(); } catch (_) { /* 무시 */ }
  const box = $('#gBtn');
  if (!cfg.google) {
    box.innerHTML = '<div class="gnone">구글 로그인은 관리자가 설정하면 켜져요. 지금은 아래 아이디로 해 주세요.</div>';
    $('#idLogin').open = true;
    return;
  }
  await new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = ok;
    s.onerror = bad;
    document.head.appendChild(s);
  }).catch(() => { box.innerHTML = '<div class="gnone">구글 로그인 창을 불러오지 못했어요</div>'; });
  if (!window.google || !google.accounts) return;
  google.accounts.id.initialize({ client_id: cfg.google, callback: onGoogle, ux_mode: 'popup' });
  google.accounts.id.renderButton(box, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', locale: 'ko', width: 280 });
}

/* ───── 시작 */
paintTry();
user = await getMe();
if (user) {
  const d = loadDraft();
  st = { av: user.profile.avatar, nickname: user.profile.nickname, title: user.profile.title, bio: user.profile.bio };
  if (d) try { localStorage.removeItem(DRAFT); } catch (_) { /* 무시 */ }
} else {
  const d = loadDraft();
  if (d) { st = { ...st, ...d, av: PARTS.clean(d.av) }; dirty = true; }
}
paintAll();
setupGoogle();
