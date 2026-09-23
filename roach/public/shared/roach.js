// 바퀴벌레 포커 - 서버와 브라우저가 함께 쓰는 데이터: 벌레 8종 × 8장 = 64장
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ROACH = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 6;
  const PER_KIND = 8;        // 종류마다 8장
  const DEAD = 4;            // 같은 종류 4장을 모으면 진다

  // 8종. 색은 카드 테두리 · 이름 띠에 쓴다
  const KINDS = [
    { id: 'roach', name: '바퀴벌레', en: 'COCKROACH', ink: '#5a2a12', fill: '#c8621e', dark: '#7a3208', light: '#f0a860' },
    { id: 'rat', name: '쥐', en: 'RAT', ink: '#3a3a44', fill: '#8a8e9a', dark: '#4a4e58', light: '#d8dce4' },
    { id: 'bat', name: '박쥐', en: 'BAT', ink: '#2a2038', fill: '#6a4a9a', dark: '#382a5a', light: '#c0a8e8' },
    { id: 'toad', name: '두꺼비', en: 'TOAD', ink: '#1e3a1e', fill: '#4a9a3a', dark: '#22541c', light: '#a8e08a' },
    { id: 'scorpion', name: '전갈', en: 'SCORPION', ink: '#4a2008', fill: '#d8a020', light: '#ffe08a', dark: '#8a5c08' },
    { id: 'spider', name: '거미', en: 'SPIDER', ink: '#241a2a', fill: '#3a3048', dark: '#1a1420', light: '#9a8ab0' },
    { id: 'fly', name: '파리', en: 'FLY', ink: '#12303a', fill: '#2a7a8a', dark: '#0e4450', light: '#8ad8e8' },
    { id: 'stinkbug', name: '노린재', en: 'STINK BUG', ink: '#4a1a24', fill: '#b03248', dark: '#6a1020', light: '#f09aa8' },
  ];
  const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const KIND_IDS = KINDS.map((k) => k.id);

  /** 64장 한 벌 (id 는 'roach3' 처럼 종류+번호) */
  const DECK = [];
  for (const k of KINDS) for (let i = 0; i < PER_KIND; i++) DECK.push(`${k.id}${i}`);
  /** 카드 id → 종류 id */
  const kindOf = (cardId) => String(cardId || '').replace(/\d+$/, '');

  /** 사람 수에 맞는 제한 시간 (ms) */
  const OFFER_MS = 75_000;
  const REPLY_MS = 60_000;

  /** 앞에 깔린 카드를 종류별로 센다 */
  function tally(pile) {
    const t = {};
    for (const id of pile || []) { const k = kindOf(id); t[k] = (t[k] || 0) + 1; }
    return t;
  }
  /** 이 사람이 죽는 종류 (4장째) */
  const deadKind = (pile) => KIND_IDS.find((k) => (tally(pile)[k] || 0) >= DEAD) || null;
  /** 한 장만 더 받으면 죽는 종류들 */
  const dangerKinds = (pile) => { const t = tally(pile); return KIND_IDS.filter((k) => (t[k] || 0) === DEAD - 1); };

  return {
    MIN_PLAYERS, MAX_PLAYERS, PER_KIND, DEAD, OFFER_MS, REPLY_MS,
    KINDS, KIND, KIND_IDS, DECK, kindOf, tally, deadKind, dangerKinds,
  };
});
