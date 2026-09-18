/* 로그인한 사람 정보 (모든 게임이 같이 쓴다) */
import { avatarSvg, PARTS } from './avatar.js';

let mePromise = null;

/** 로그인 중이면 { id, username, profile }, 아니면 null */
export function getMe(force = false) {
  if (!mePromise || force) {
    mePromise = fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && d.user) || null)
      .catch(() => null);
  }
  return mePromise;
}

const loadCss = () => {
  if (document.querySelector('link[data-social]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = '/common/social.css';
  l.dataset.social = '1';
  document.head.appendChild(l);
};

/**
 * 로그인했으면 이름 칸을 프로필 닉네임으로 채우고 잠근다 (이름을 칠 필요가 없다).
 * 로그인 안 했으면 이름 칸 아래에 '로그인하면 이름 자동' 안내를 단다.
 */
export async function bindName(input) {
  loadCss();
  if (!input) return null;
  const u = await getMe();
  const chip = document.createElement('a');
  chip.className = 'acc-chip';
  chip.href = '/profile.html';
  chip.target = '_blank';
  if (u) {
    input.value = u.profile.nickname;
    input.readOnly = true;
    input.classList.add('acc-bound');
    input.title = '로그인한 닉네임으로 들어가요 (프로필에서 바꿀 수 있어요)';
    chip.innerHTML = `${avatarSvg(u.profile.avatar, { crop: 'head' })}<span><b></b> 로 들어가요 <small>· 프로필 꾸미기</small></span>`;
    chip.querySelector('b').textContent = u.profile.nickname;
  } else {
    chip.innerHTML = `${avatarSvg(PARTS.DEFAULT, { crop: 'head' })}<span>로그인하면 이름 안 쳐도 돼요 <small>· 로그인</small></span>`;
  }
  input.insertAdjacentElement('afterend', chip);
  return u;
}

export { loadCss };
