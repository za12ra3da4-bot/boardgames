// 카드 한 장을 그리는 코드 (게임 화면과 카드 확인 페이지가 함께 쓴다)
const B = window.BANG;
const T = B.TYPES;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ic = (n) => `<i class="ic ic-${n}"></i>`;
const SUIT_IC = { S: 'spade', H: 'heart', D: 'diamond', C: 'club' };
const isRed = (suit) => suit === 'H' || suit === 'D';

/** 카드에 찍히는 효과 기호 (실제 뱅 카드는 글 대신 기호로 효과를 보여 준다) */
const CARD_ICONS = {
  bang: ['gun', 'target'],
  missed: ['shield'],
  beer: ['heal'],
  saloon: ['heal', 'users'],
  panic: ['swap'],
  catbalou: ['x'],
  stagecoach: ['deck', 'deck'],
  wellsfargo: ['deck', 'deck', 'deck'],
  gatling: ['gun', 'users'],
  indians: ['skull', 'users'],
  duel: ['gun', 'gun'],
  store: ['cards', 'users'],
  barrel: ['check'],
  scope: ['eye'],
  mustang: ['eye'],
  jail: ['clock'],
  dynamite: ['skull'],
};

/** 실제 카드처럼 위에 찍히는 영문 제목 */
const CARD_EN = {
  bang: 'BANG!', missed: 'MISSED!', beer: 'BEER', panic: 'PANIC!', catbalou: 'CAT BALOU',
  stagecoach: 'STAGECOACH', wellsfargo: 'WELLS FARGO', gatling: 'GATLING', indians: 'INDIANS!',
  duel: 'DUEL', store: 'GENERAL STORE', saloon: 'SALOON', barrel: 'BARREL', scope: 'SCOPE',
  mustang: 'MUSTANG', jail: 'JAIL', dynamite: 'DYNAMITE', volcanic: 'VOLCANIC', schofield: 'SCHOFIELD',
  remington: 'REMINGTON', carabine: 'REV. CARABINE', winchester: 'WINCHESTER',
};

/** 카드 한 장: 흰 종이 + 거친 테두리, 위 제목 · 가운데 그림 · 아래 기호 · 왼쪽 아래 숫자와 무늬 */
export function cardHtml(card, opt = {}) {
  const { cls = '', style = '' } = opt;
  if (!card) return `<div class="bcard back ${cls}" style="${style}"></div>`;
  const info = T[card.type];
  const blue = info.kind === 'blue';
  const en = CARD_EN[card.type] || info.name;
  const fs = Math.min(15, 118 / Math.max(5, en.length)).toFixed(1);
  const icons = (CARD_ICONS[card.type] || []).map((n) => `<span class="ico">${ic(n)}</span>`).join('');
  const sight = info.weapon ? `<span class="bc-sight"><b>${info.weapon}</b></span>` : '';
  return `<div class="bcard ${blue ? 'blue' : 'brown'} ${cls}" style="${style}" data-card="${card.id}" data-type="${card.type}">
    <img class="bc-frame" src="assets/${blue ? 'frame-blue' : 'frame-brown'}.svg" alt="">
    <div class="bc-en" style="--fs:${fs}cqw">${esc(en)}</div>
    <div class="bc-ko">${esc(info.name)}</div>
    <div class="bc-art"><img src="assets/card/${card.type}.svg" alt=""></div>
    <div class="bc-icons">${sight}${icons}</div>
    <div class="bc-index ${isRed(card.suit) ? 'red' : ''}">${B.rankLabel(card.rank)}${ic(SUIT_IC[card.suit])}</div>
  </div>`;
}

const SUIT_KO = { S: '스페이드', H: '하트', D: '다이아', C: '클로버' };

/** 크게 보기: 실제 카드 모양 + 아래에 설명 */
export function zoomCardHtml(card) {
  const info = T[card.type];
  const blue = info.kind === 'blue';
  const tags = [
    `<span class="zc-tag ${blue ? 'blue' : 'brown'}">${blue ? '파란 카드 · 앞에 장착' : '갈색 카드 · 쓰고 버림'}</span>`,
    `<span class="zc-tag ${isRed(card.suit) ? 'red' : ''}">${ic(SUIT_IC[card.suit])}${SUIT_KO[card.suit]} ${B.rankLabel(card.rank)}</span>`,
  ];
  if (info.weapon) tags.push(`<span class="zc-tag blue">${ic('target')}사거리 ${info.weapon}</span>`);
  const target = {
    range: '대상: 사거리 안의 한 명', dist1: '대상: 거리 1 이내의 한 명', any: '대상: 아무나 한 명',
    jail: '대상: 보안관이 아닌 한 명', all: '대상: 모두', self: '', none: '총에 맞았을 때만 사용',
  }[info.target] || '';
  return `<div class="zoom-card">
    ${cardHtml(card)}
    <div class="zc-info">
      <b>${esc(info.name)}</b>
      <div class="zc-tags">${tags.join('')}</div>
      <p>${esc(info.desc)}</p>
      ${target ? `<small>${esc(target)}</small>` : ''}
    </div>
  </div>`;
}

/* ───── 캐릭터 카드 (초록 테두리 · 영문/한글 이름 · 오른쪽 총알 · 초상화 · 능력) ───── */

const CHAR_EN = {
  ben: 'BULLDOG BEN', jack: 'GAMBLER JACK', janet: 'TWO-GUN JANET', lobo: 'EL LOBO',
  jesse: 'QUICK JESSE', jordan: 'IRONHIDE JORDAN', kit: 'CARDSHARP KIT', luke: 'FORTUNE LUKE',
  paul: 'SLIPPERY PAUL', pedro: 'PEDRO', rose: 'HAWKEYE ROSE', sid: 'HERB SID',
  cole: 'COLD COLE', suzy: 'SUNNY SUZY', vic: 'VULTURE VIC', will: 'LITTLE WILL',
};

export function chCardHtml(id, { cls = '', style = '' } = {}) {
  const c = B.CHAR[id];
  if (!c) return '';
  const en = CHAR_EN[id] || id.toUpperCase();
  const fs = Math.min(12.5, 118 / Math.max(6, en.length)).toFixed(1);
  const bullets = Array.from({ length: c.hp }, () => '<img src="assets/bullet-h.svg" alt="">').join('');
  return `<div class="chcard ${cls}" style="${style}" data-char="${id}">
    <img class="bc-frame" src="assets/frame-green.svg" alt="">
    <div class="ch-en" style="--fs:${fs}cqw">${esc(en)}</div>
    <div class="ch-ko">${esc(c.name)}</div>
    <div class="ch-hp" title="체력 ${c.hp}">${bullets}</div>
    <div class="ch-art"><img src="assets/char/${id}.svg" alt=""></div>
    <div class="ch-text">${esc(c.ability)}</div>
  </div>`;
}

/* ───── 플레이어 보드판 (가로형): 역할 · 캐릭터 · 총 칸 + 총알 5칸 ───── */

const BOARD_BULLETS = 5;

export function boardHtml({ roleHtml = '', charHtml = '', gun = null, hp = 0, maxHp = 0, cls = '' }) {
  const bullets = Array.from({ length: BOARD_BULLETS }, (_, i) => {
    const top = (((14 + i * 22) / 130) * 100).toFixed(2);
    if (i >= maxHp) return `<i class="pb-off" style="top:${top}%"></i>`;
    return i < hp ? `<img class="pb-b" style="top:${top}%" src="assets/bullet-h.svg" alt="">` : '';
  }).join('');
  return `<div class="pboard ${cls}" title="체력 ${hp}/${maxHp}">
    <div class="pb-slot s0">${roleHtml}</div>
    <div class="pb-slot s1">${charHtml}</div>
    <div class="pb-slot s2">${gun ? cardHtml(gun) : ''}</div>
    ${bullets}
  </div>`;
}
