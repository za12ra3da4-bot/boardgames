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

const SPINE = {
  bang: '황야의 뱅!',
  clue: '밤의 저택',
};

function boxHtml(g) {
  const front = FRONT[g.id] ? FRONT[g.id]() : `<div class="gf"><img src="logo/${g.id}.svg" alt=""><b>${esc(g.title)}</b></div>`;
  return `<a class="game ${esc(g.id)}" href="${esc(g.url)}">
    <div class="stage">
      <div class="box">
        <div class="face front">${front}</div>
        <div class="face side"><span>${esc(SPINE[g.id] || g.title)}</span></div>
        <div class="face lid"></div>
      </div>
      <div class="floor-shadow"></div>
    </div>
    <div class="label">
      <b>${esc(g.title)}</b>
      <p>${esc(g.desc)}</p>
      <div class="meta">
        <span>${esc(g.sub)}</span><span>${esc(g.players)}</span><span>${esc(g.time)}</span>
      </div>
      <span class="btn go">들어가기</span>
    </div>
  </a>`;
}

async function load() {
  let games;
  try {
    const res = await fetch('api/games', { cache: 'no-store' });
    games = await res.json();
  } catch (e) {
    shelf.innerHTML = '<div class="loading">서버와 연결이 끊겼어요. 잠시 뒤 다시 시도합니다…</div>';
    setTimeout(load, 3000);
    return;
  }
  shelf.innerHTML = games.map(boxHtml).join('');
  shelf.removeAttribute('aria-busy');
}

load();
