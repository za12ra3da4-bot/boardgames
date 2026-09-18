// 찬란한 보석상 - 서버와 브라우저가 함께 쓰는 데이터: 보석, 개발 카드 90장, 귀족 10명
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GEM = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 4;
  const WIN_POINTS = 15;
  const HAND_LIMIT = 10;
  const RESERVE_LIMIT = 3;

  const COLORS = ['white', 'blue', 'green', 'red', 'black'];
  const GEMS = {
    white: { name: '다이아몬드', short: '백', fill: '#f4f6fa', dark: '#8a94a8', light: '#ffffff' },
    blue: { name: '사파이어', short: '청', fill: '#2a6ad8', dark: '#12306a', light: '#8ac0ff' },
    green: { name: '에메랄드', short: '녹', fill: '#1e9a5a', dark: '#0a4a28', light: '#7aeab0' },
    red: { name: '루비', short: '적', fill: '#d82a3a', dark: '#6a0a14', light: '#ff8a90' },
    black: { name: '오닉스', short: '흑', fill: '#3a3230', dark: '#0a0808', light: '#8a7a74' },
    gold: { name: '황금', short: '금', fill: '#f0c040', dark: '#8a6010', light: '#fff0a0' },
  };
  const tokenCount = (n) => (n <= 2 ? 4 : n === 3 ? 5 : 7);
  const GOLD_COUNT = 5;

  // 색마다 같은 틀을 돌려 쓴다: o1~o4 는 자기 색 다음 색부터 차례로
  const PATTERNS = {
    1: [
      [{ o1: 1, o2: 1, o3: 1, o4: 1 }, 0],
      [{ o1: 1, o2: 2, o3: 1, o4: 1 }, 0],
      [{ o1: 2, o2: 2, o4: 1 }, 0],
      [{ c: 1, o1: 3, o3: 1 }, 0],
      [{ o2: 2, o3: 1 }, 0],
      [{ o1: 2, o3: 2 }, 0],
      [{ o2: 3 }, 0],
      [{ o3: 4 }, 1],
    ],
    2: [
      [{ c: 2, o1: 2, o2: 3 }, 1],
      [{ c: 3, o3: 2, o4: 3 }, 1],
      [{ o1: 1, o2: 4, o3: 2 }, 2],
      [{ o2: 5, o3: 3 }, 2],
      [{ o4: 5 }, 2],
      [{ c: 6 }, 3],
    ],
    3: [
      [{ o1: 3, o2: 3, o3: 5, o4: 3 }, 3],
      [{ o4: 7 }, 4],
      [{ c: 3, o3: 6, o4: 3 }, 4],
      [{ c: 3, o4: 7 }, 5],
    ],
  };

  const CARDS = [];
  for (const tier of [1, 2, 3]) {
    COLORS.forEach((c, ci) => {
      const o = (k) => COLORS[(ci + k) % 5];
      PATTERNS[tier].forEach(([p, points], pi) => {
        const cost = {};
        for (const [k, v] of Object.entries(p)) cost[k === 'c' ? c : o(Number(k.slice(1)))] = v;
        CARDS.push({ id: `${tier}${'wugrk'[ci]}${pi}`, tier, bonus: c, points, cost, art: (ci * 3 + pi) % 6 });
      });
    });
  }
  const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c]));

  const NOBLES = [];
  COLORS.forEach((c, i) => {
    NOBLES.push({ id: `n4${i}`, req: { [c]: 4, [COLORS[(i + 1) % 5]]: 4 }, points: 3, face: i });
    NOBLES.push({ id: `n3${i}`, req: { [c]: 3, [COLORS[(i + 1) % 5]]: 3, [COLORS[(i + 2) % 5]]: 3 }, points: 3, face: i + 5 });
  });
  const NOBLE = Object.fromEntries(NOBLES.map((n) => [n.id, n]));
  const NOBLE_NAMES = ['피렌체 공작', '베네치아 총독', '밀라노 백작 부인', '로마 추기경', '나폴리 왕비', '제노바 제독', '만토바 후작', '페라라 공작 부인', '우르비노 공작', '시에나 대주교'];

  const TIER_NAME = { 1: '광산', 2: '공방 · 교역', 3: '궁정 · 도시' };

  const emptyGems = (gold = false) => {
    const g = Object.fromEntries(COLORS.map((c) => [c, 0]));
    if (gold) g.gold = 0;
    return g;
  };
  const total = (g) => Object.values(g).reduce((a, b) => a + b, 0);

  /** 이 카드를 사려면 보석이 얼마나 필요한가 (보너스 할인 · 황금 대체) */
  function payment(card, gems, bonus) {
    const pay = emptyGems(true);
    let goldNeed = 0;
    for (const c of COLORS) {
      const need = Math.max(0, (card.cost[c] || 0) - (bonus[c] || 0));
      const use = Math.min(need, gems[c] || 0);
      pay[c] = use;
      goldNeed += need - use;
    }
    if (goldNeed > (gems.gold || 0)) return null;
    pay.gold = goldNeed;
    return pay;
  }
  const canVisit = (noble, bonus) => COLORS.every((c) => (bonus[c] || 0) >= (noble.req[c] || 0));

  return {
    MIN_PLAYERS, MAX_PLAYERS, WIN_POINTS, HAND_LIMIT, RESERVE_LIMIT, GOLD_COUNT,
    COLORS, GEMS, tokenCount, CARDS, CARD, NOBLES, NOBLE, NOBLE_NAMES, TIER_NAME,
    emptyGems, total, payment, canVisit,
  };
});
