'use strict';
// 게임 목록을 불러와 카드로 그리고, 서버가 켜졌는지 주기적으로 확인한다.

const grid = document.getElementById('grid');
const tpl = document.getElementById('card-tpl');
const addrUrl = document.getElementById('addr-url');
const copyBtn = document.getElementById('copy');

/** 친구가 접속한 그대로의 주소를 쓴다 (하마치 IP든 localhost든) */
const hubUrl = location.origin;
addrUrl.textContent = hubUrl;

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(hubUrl);
    copyBtn.textContent = '복사됨';
    copyBtn.classList.add('done');
    setTimeout(() => { copyBtn.textContent = '복사'; copyBtn.classList.remove('done'); }, 1600);
  } catch (e) {
    // 클립보드를 못 쓰는 브라우저면 주소를 선택해 준다
    const r = document.createRange();
    r.selectNodeContents(addrUrl);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }
});

const STATE_TEXT = {
  ready: '바로 시작',
  starting: '켜지는 중…',
  stopped: '꺼짐',
  external: '따로 켜져 있음',
  missing: '폴더 없음',
  error: '실행 실패',
};

/** @type {Map<string, HTMLElement>} */
const cards = new Map();

function build(game) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = game.id;
  node.querySelector('.card-logo').src = `logo/${game.id}.svg`;
  node.querySelector('.card-logo').alt = game.title;
  node.querySelector('.card-kicker').textContent = game.sub;
  node.querySelector('.card-title').textContent = game.title;
  node.querySelector('.card-desc').textContent = game.desc;
  node.querySelector('.meta-players').textContent = game.players;
  node.querySelector('.meta-time').textContent = game.time;
  node.href = game.url;
  return node;
}

function paint(node) {
  node.classList.add('on');
  node.querySelector('.state').textContent = '바로 시작';
  node.querySelector('.go').textContent = '들어가기';
}

let firstPaint = true;

async function refresh() {
  let games;
  try {
    const res = await fetch('api/games', { cache: 'no-store' });
    games = await res.json();
  } catch (e) {
    if (firstPaint) grid.innerHTML = '<div class="loading">허브 서버와 연결이 끊겼어요. 잠시 뒤 다시 시도합니다…</div>';
    return;
  }

  if (firstPaint) {
    grid.innerHTML = '';
    for (const g of games) {
      const node = build(g);
      cards.set(g.id, node);
      grid.appendChild(node);
    }
    grid.removeAttribute('aria-busy');
    firstPaint = false;
  }
  for (const g of games) {
    const node = cards.get(g.id);
    if (node) paint(node);
  }
}

refresh();
