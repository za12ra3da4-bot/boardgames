/* 왕궁의 달무티 - 공용 데이터 (서버 · 브라우저 같이 쓴다)
   카드 80장: 숫자 n 카드가 n장 (1 대달무티 1장 … 12 농노 12장) + 광대 2장(아무 숫자나 됨)
   확장판(edition): 'classic' 왕궁판 · 'joseon' 조선 궁궐판 (카드 그림 · 호칭이 다르고, 마패 2장이 더 들어간다) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DALMUTI = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const MIN_PLAYERS = 4;
  const MAX_PLAYERS = 8;
  const JESTER = 13;
  const MAPAE = 14; // 조선판: 암행어사 마패 (혼자 내면 판을 엎는다)

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

  const RANKS_JOSEON = [
    null,
    { n: 1, name: '임금', en: 'THE KING', tier: 'gold' },
    { n: 2, name: '영의정', en: 'CHIEF COUNCILLOR', tier: 'gold' },
    { n: 3, name: '대장군', en: 'GRAND GENERAL', tier: 'gold' },
    { n: 4, name: '상궁', en: 'COURT LADY', tier: 'silver' },
    { n: 5, name: '스님', en: 'MONK', tier: 'silver' },
    { n: 6, name: '선비', en: 'SCHOLAR', tier: 'silver' },
    { n: 7, name: '의원', en: 'PHYSICIAN', tier: 'bronze' },
    { n: 8, name: '대장장이', en: 'BLACKSMITH', tier: 'bronze' },
    { n: 9, name: '주모', en: 'TAVERN KEEPER', tier: 'bronze' },
    { n: 10, name: '보부상', en: 'PEDDLER', tier: 'wood' },
    { n: 11, name: '사공', en: 'FERRYMAN', tier: 'wood' },
    { n: 12, name: '노비', en: 'SERVANT', tier: 'wood' },
    { n: 13, name: '탈광대', en: 'MASKED DANCER', tier: 'jester' },
    { n: 14, name: '마패', en: 'ROYAL INSPECTOR', tier: 'mapae' },
  ];

  /** 확장판 목록: 새 판을 더하려면 여기에 한 줄 (카드 그림은 js/cards-<id>.js) */
  const EDITIONS = {
    classic: { id: 'classic', name: '왕궁판', sub: '원조 중세 왕궁', ranks: RANKS, titles: ['대달무티', '소달무티', '상인', '소농노', '대농노'], mapae: 0 },
    joseon: { id: 'joseon', name: '조선 궁궐판', sub: '확장판 · 임금부터 노비까지, 마패 2장', ranks: RANKS_JOSEON, titles: ['임금', '영의정', '백성', '천민', '노비'], mapae: 2 },
  };
  const edOf = (ed) => EDITIONS[ed] || EDITIONS.classic;
  const ranksOf = (ed) => edOf(ed).ranks;

  function makeDeck(ed) {
    const deck = [];
    for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) deck.push({ id: `c${n}_${i}`, r: n });
    deck.push({ id: 'j_0', r: JESTER }, { id: 'j_1', r: JESTER });
    for (let i = 0; i < edOf(ed).mapae; i++) deck.push({ id: `m_${i}`, r: MAPAE });
    return deck;
  }

  /** 자리(순위)별 호칭: 1등 대달무티 … 꼴찌 대농노 (판마다 이름이 다르다) */
  function seatTitle(pos, n, ed) {
    const T = edOf(ed).titles;
    if (pos === 0) return T[0];
    if (pos === 1) return T[1];
    if (pos === n - 1) return T[4];
    if (pos === n - 2) return T[3];
    return T[2];
  }

  /**
   * 낸 카드 묶음 판정: 같은 숫자끼리(광대는 아무 숫자). 광대만 내면 13.
   * @returns {{ rank, count } | null}
   */
  function evalSet(cards) {
    if (!cards.length) return null;
    // 마패는 반드시 한 장만, 혼자
    if (cards.some((c) => c.r === MAPAE)) return cards.length === 1 ? { rank: MAPAE, count: 1, mapae: true } : null;
    const normal = cards.filter((c) => c.r !== JESTER);
    if (!normal.length) return { rank: JESTER, count: cards.length };
    const r = normal[0].r;
    if (normal.some((c) => c.r !== r)) return null;
    return { rank: r, count: cards.length };
  }
  /** 지금 판(trick) 위에 낼 수 있나: 장수가 같고 숫자가 더 작아야 */
  function beats(set, trick) {
    if (!set) return false;
    if (set.mapae) return true; // 암행어사 출두: 언제든 판을 엎는다
    if (!trick) return true;
    return set.count === trick.count && set.rank < trick.rank;
  }

  return { MIN_PLAYERS, MAX_PLAYERS, JESTER, MAPAE, RANKS, EDITIONS, ranksOf, makeDeck, seatTitle, evalSet, beats };
}));
