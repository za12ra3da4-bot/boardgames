// 서버와 브라우저가 함께 쓰는 뱅 데이터: 카드 80장, 캐릭터 16명, 역할, 거리 계산
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BANG = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 4;
  const MAX_PLAYERS = 7;

  const SUIT_NAME = { S: '스페이드', H: '하트', D: '다이아', C: '클로버' };
  const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const rankLabel = (r) => RANK_LABEL[r] || String(r);

  /**
   * kind: brown(바로 쓰는 카드) / blue(내 앞에 놓는 장비)
   * target: range(사거리 안) / dist1(거리 1) / any(아무나) / jail(보안관 제외) / none / self / all
   */
  const TYPES = {
    bang: { name: '뱅!', kind: 'brown', target: 'range', desc: '사거리 안의 한 명을 쏩니다. 상대가 빗나감!으로 피하지 못하면 체력 1을 잃습니다. 차례마다 한 번만 쓸 수 있어요.' },
    missed: { name: '빗나감!', kind: 'brown', target: 'none', desc: '뱅!이나 개틀링을 맞았을 때 내서 총알을 피합니다.' },
    beer: { name: '맥주', kind: 'brown', target: 'self', desc: '체력을 1 회복합니다. 죽기 직전에도 쓸 수 있어요. 두 명만 남으면 효과가 없습니다.' },
    panic: { name: '강탈!', kind: 'brown', target: 'dist1', desc: '거리 1 이내에 있는 한 명의 카드(손패 무작위 또는 장비) 1장을 빼앗습니다.' },
    catbalou: { name: '캣 벌루', kind: 'brown', target: 'any', desc: '거리와 상관없이 한 명의 카드(손패 무작위 또는 장비) 1장을 버리게 합니다.' },
    stagecoach: { name: '역마차', kind: 'brown', target: 'self', desc: '카드 2장을 뽑습니다.' },
    wellsfargo: { name: '웰스 파고', kind: 'brown', target: 'self', desc: '카드 3장을 뽑습니다.' },
    gatling: { name: '개틀링', kind: 'brown', target: 'all', desc: '나를 뺀 모두에게 뱅!을 쏩니다. (뱅! 1회 제한에 포함되지 않아요)' },
    indians: { name: '인디언 습격!', kind: 'brown', target: 'all', desc: '나를 뺀 모두는 뱅!을 1장 버리거나 체력 1을 잃습니다. 술통으로는 막을 수 없어요.' },
    duel: { name: '결투', kind: 'brown', target: 'any', desc: '한 명과 결투합니다. 상대부터 번갈아 뱅!을 버리고, 먼저 못 버린 쪽이 체력 1을 잃어요.' },
    store: { name: '잡화점', kind: 'brown', target: 'all', desc: '살아 있는 인원수만큼 카드를 펼치고, 나부터 차례로 1장씩 가져갑니다.' },
    saloon: { name: '살롱', kind: 'brown', target: 'all', desc: '살아 있는 모두가 체력을 1 회복합니다.' },
    barrel: { name: '술통', kind: 'blue', target: 'self', desc: '뱅!을 맞으면 판정! 하트가 나오면 빗나감! 처리됩니다.' },
    scope: { name: '조준경', kind: 'blue', target: 'self', desc: '내가 다른 사람을 볼 때 거리가 1 줄어듭니다.' },
    mustang: { name: '야생마', kind: 'blue', target: 'self', desc: '다른 사람이 나를 볼 때 거리가 1 늘어납니다.' },
    jail: { name: '감옥', kind: 'blue', target: 'jail', desc: '보안관을 뺀 한 명을 가둡니다. 갇힌 사람은 차례 시작에 판정! 하트면 탈출, 아니면 차례를 건너뜁니다.' },
    dynamite: { name: '다이너마이트', kind: 'blue', target: 'self', desc: '내 앞에 놓습니다. 차례 시작마다 판정! 스페이드 2~9면 폭발해 체력 3을 잃고, 아니면 다음 사람에게 넘어갑니다.' },
    volcanic: { name: '볼케닉', kind: 'blue', target: 'self', weapon: 1, desc: '총 사거리 1. 뱅!을 차례마다 몇 번이든 쓸 수 있어요.' },
    schofield: { name: '스코필드', kind: 'blue', target: 'self', weapon: 2, desc: '총 사거리 2.' },
    remington: { name: '레밍턴', kind: 'blue', target: 'self', weapon: 3, desc: '총 사거리 3.' },
    carabine: { name: '카빈총', kind: 'blue', target: 'self', weapon: 4, desc: '총 사거리 4.' },
    winchester: { name: '윈체스터', kind: 'blue', target: 'self', weapon: 5, desc: '총 사거리 5.' },
  };

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const D = (type, suit, ranks) => ranks.map((r) => [type, suit, r]);
  const DECK = [
    ...D('bang', 'S', [14]), ...D('bang', 'D', range(2, 14)), ...D('bang', 'H', [12, 13, 14]), ...D('bang', 'C', range(2, 9)),
    ...D('missed', 'C', range(10, 14)), ...D('missed', 'S', range(2, 8)),
    ...D('beer', 'H', range(6, 11)),
    ...D('panic', 'H', [11, 12, 14]), ...D('panic', 'D', [8]),
    ...D('catbalou', 'H', [13]), ...D('catbalou', 'D', [9, 10, 11]),
    ...D('stagecoach', 'S', [9, 9]),
    ...D('wellsfargo', 'H', [3]),
    ...D('gatling', 'H', [10]),
    ...D('indians', 'D', [13, 14]),
    ...D('duel', 'D', [12]), ...D('duel', 'S', [11]), ...D('duel', 'C', [8]),
    ...D('store', 'C', [9]), ...D('store', 'S', [12]),
    ...D('saloon', 'H', [5]),
    ...D('barrel', 'S', [12, 13]),
    ...D('scope', 'S', [14]),
    ...D('mustang', 'H', [8, 9]),
    ...D('jail', 'S', [11, 10]), ...D('jail', 'H', [4]),
    ...D('dynamite', 'H', [2]),
    ...D('volcanic', 'S', [10]), ...D('volcanic', 'C', [10]),
    ...D('schofield', 'C', [11, 12]), ...D('schofield', 'S', [13]),
    ...D('remington', 'C', [13]),
    ...D('carabine', 'C', [14]),
    ...D('winchester', 'S', [8]),
  ].map(([type, suit, rank], i) => ({ id: `c${i}`, type, suit, rank }));

  const CHARACTERS = [
    { id: 'ben', name: '악바리 벤', hp: 4, ability: '체력을 1 잃을 때마다 카드를 1장 뽑습니다.' },
    { id: 'jack', name: '도박꾼 잭', hp: 4, ability: '카드를 뽑을 때 두 번째 카드를 공개해서 하트나 다이아면 1장 더 뽑습니다.' },
    { id: 'janet', name: '쌍권총 재닛', hp: 4, ability: '뱅!을 빗나감!으로, 빗나감!을 뱅!으로 쓸 수 있습니다.' },
    { id: 'lobo', name: '엘 로보', hp: 3, ability: '다른 사람의 카드 때문에 체력을 잃으면, 그 사람 손패에서 1장을 빼앗습니다.' },
    { id: 'jesse', name: '소매치기 제시', hp: 4, ability: '카드를 뽑을 때 첫 장을 다른 사람의 손패에서 무작위로 가져올 수 있습니다.' },
    { id: 'jordan', name: '방탄 조던', hp: 4, ability: '항상 술통을 가진 것처럼 판정할 수 있습니다.' },
    { id: 'kit', name: '카드장인 킷', hp: 4, ability: '카드를 뽑을 때 3장을 보고 2장을 고른 뒤, 나머지는 덱 위에 돌려놓습니다.' },
    { id: 'luke', name: '행운아 루크', hp: 4, ability: '판정할 때 2장을 뒤집어 유리한 쪽을 고릅니다.' },
    { id: 'paul', name: '바람잡이 폴', hp: 3, ability: '항상 야생마를 가진 것처럼, 다른 사람이 볼 때 거리가 1 늘어납니다.' },
    { id: 'pedro', name: '페드로', hp: 4, ability: '카드를 뽑을 때 첫 장을 버린 카드 더미 맨 위에서 가져올 수 있습니다.' },
    { id: 'rose', name: '매의 눈 로즈', hp: 4, ability: '항상 조준경을 가진 것처럼, 다른 사람을 볼 때 거리가 1 줄어듭니다.' },
    { id: 'sid', name: '약초꾼 시드', hp: 4, ability: '언제든 카드 2장을 버려서 체력을 1 회복할 수 있습니다.' },
    { id: 'cole', name: '냉혈한 콜', hp: 4, ability: '내 뱅!을 피하려면 빗나감!이 2장 필요합니다.' },
    { id: 'suzy', name: '행운의 수지', hp: 4, ability: '손패가 한 장도 없게 되면 곧바로 1장을 뽑습니다.' },
    { id: 'vic', name: '대머리독수리 빅', hp: 4, ability: '누군가 죽으면 그 사람의 손패와 장비를 모두 가져옵니다.' },
    { id: 'will', name: '꼬마 윌', hp: 4, ability: '차례마다 뱅!을 몇 번이든 쓸 수 있습니다.' },
  ];
  const CHAR = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

  const ROLES = {
    sheriff: { name: '보안관', goal: '무법자와 배신자를 모두 제거하세요. 보안관은 모두에게 공개되고 체력이 1 더 많아요.' },
    deputy: { name: '부관', goal: '보안관을 지키세요. 무법자와 배신자가 모두 죽으면 보안관과 함께 승리합니다.' },
    outlaw: { name: '무법자', goal: '보안관을 쓰러뜨리세요. 보안관이 죽으면 무법자 모두가 승리합니다.' },
    renegade: { name: '배신자', goal: '혼자 최후의 생존자가 되세요. 다른 사람을 모두 없애고 마지막에 보안관을 쓰러뜨려야 합니다.' },
  };
  const ROLE_SETS = {
    4: ['sheriff', 'renegade', 'outlaw', 'outlaw'],
    5: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'deputy'],
    6: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'outlaw', 'deputy'],
    7: ['sheriff', 'renegade', 'outlaw', 'outlaw', 'outlaw', 'deputy', 'deputy'],
  };

  const hasEquip = (p, type) => p.equip.some((c) => c.type === type);
  const weaponRange = (p) => {
    const w = p.equip.find((c) => TYPES[c.type].weapon);
    return w ? TYPES[w.type].weapon : 1;
  };
  const isBangLike = (p, card) => card.type === 'bang' || (p.char === 'janet' && card.type === 'missed');
  const isMissLike = (p, card) => card.type === 'missed' || (p.char === 'janet' && card.type === 'bang');

  /** a 가 b 를 볼 때의 거리 (살아 있는 사람 기준, 좌석 순서 배열) */
  function distance(players, a, b) {
    const alive = players.filter((p) => p.alive);
    const i = alive.indexOf(a);
    const j = alive.indexOf(b);
    if (i < 0 || j < 0 || a === b) return Infinity;
    const n = alive.length;
    const d = Math.abs(i - j);
    let dist = Math.min(d, n - d);
    if (hasEquip(b, 'mustang')) dist++;
    if (b.char === 'paul') dist++;
    if (hasEquip(a, 'scope')) dist--;
    if (a.char === 'rose') dist--;
    return Math.max(1, dist);
  }

  return {
    MIN_PLAYERS, MAX_PLAYERS, SUIT_NAME, rankLabel, TYPES, DECK, CHARACTERS, CHAR, ROLES, ROLE_SETS,
    hasEquip, weaponRange, isBangLike, isMissLike, distance,
  };
});
