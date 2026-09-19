/* 왕궁의 달무티 - 공용 데이터 (서버 · 브라우저 같이 쓴다)
   카드 80장: 숫자 n 카드가 n장 (1 대달무티 1장 … 12 농노 12장) + 광대 2장(아무 숫자나 됨) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DALMUTI = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const MIN_PLAYERS = 4;
  const MAX_PLAYERS = 8;
  const JESTER = 13;

  // 계급: 숫자가 작을수록 높은 신분 (카드도 작을수록 강하다)
  const RANKS = [
    null,
    { n: 1, name: '대달무티', en: 'THE GREAT DALMUTI', tier: 'gold' },
    { n: 2, name: '대주교', en: 'ARCHBISHOP', tier: 'gold' },
    { n: 3, name: '원수', en: 'EARL MARSHAL', tier: 'gold' },
    { n: 4, name: '남작 부인', en: 'BARONESS', tier: 'silver' },
    { n: 5, name: '수녀원장', en: 'ABBESS', tier: 'silver' },
    { n: 6, name: '기사', en: 'KNIGHT', tier: 'silver' },
    { n: 7, name: '재봉사', en: 'SEAMSTRESS', tier: 'bronze' },
    { n: 8, name: '석공', en: 'MASON', tier: 'bronze' },
    { n: 9, name: '요리사', en: 'COOK', tier: 'bronze' },
    { n: 10, name: '양치기', en: 'SHEPHERDESS', tier: 'wood' },
    { n: 11, name: '채석공', en: 'STONECUTTER', tier: 'wood' },
    { n: 12, name: '농노', en: 'PEASANT', tier: 'wood' },
    { n: 13, name: '광대', en: 'JESTER', tier: 'jester' },
  ];

  function makeDeck() {
    const deck = [];
    for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) deck.push({ id: `c${n}_${i}`, r: n });
    deck.push({ id: 'j_0', r: JESTER }, { id: 'j_1', r: JESTER });
    return deck;
  }

  /** 자리(순위)별 호칭: 1등 대달무티 … 꼴찌 대농노 */
  function seatTitle(pos, n) {
    if (pos === 0) return '대달무티';
    if (pos === 1) return '소달무티';
    if (pos === n - 1) return '대농노';
    if (pos === n - 2) return '소농노';
    return '상인';
  }

  /**
   * 낸 카드 묶음 판정: 같은 숫자끼리(광대는 아무 숫자). 광대만 내면 13.
   * @returns {{ rank, count } | null}
   */
  function evalSet(cards) {
    if (!cards.length) return null;
    const normal = cards.filter((c) => c.r !== JESTER);
    if (!normal.length) return { rank: JESTER, count: cards.length };
    const r = normal[0].r;
    if (normal.some((c) => c.r !== r)) return null;
    return { rank: r, count: cards.length };
  }
  /** 지금 판(trick) 위에 낼 수 있나: 장수가 같고 숫자가 더 작아야 */
  function beats(set, trick) {
    if (!set) return false;
    if (!trick) return true;
    return set.count === trick.count && set.rank < trick.rank;
  }

  return { MIN_PLAYERS, MAX_PLAYERS, JESTER, RANKS, makeDeck, seatTitle, evalSet, beats };
}));
