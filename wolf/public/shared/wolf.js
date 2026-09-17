// 보름밤 늑대인간 - 서버와 브라우저가 함께 쓰는 데이터: 역할, 밤 순서, 기본 역할 구성
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WOLF = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 10;
  const CENTER = 3;

  // team: village(마을) · wolf(늑대) · tanner(혼자)
  const ROLES = {
    werewolf: {
      name: '늑대인간', en: 'WEREWOLF', team: 'wolf', max: 2, night: 1, color: '#b8322a',
      short: '밤에 서로를 확인합니다. 혼자라면 가운데 카드 1장을 볼 수 있어요.',
      desc: '밤에 다른 늑대인간과 눈을 맞춥니다. 늑대인간이 혼자라면 가운데 카드 1장을 몰래 볼 수 있어요. 낮에는 정체를 숨기고, 늑대인간이 한 명도 죽지 않으면 승리합니다.',
    },
    minion: {
      name: '하수인', en: 'MINION', team: 'wolf', max: 1, night: 2, color: '#7a2a5a',
      short: '늑대인간이 누구인지 봅니다. 늑대 편입니다.',
      desc: '밤에 늑대인간이 누구인지 알게 됩니다 (늑대인간은 하수인을 모릅니다). 늑대 편이라, 자기가 죽더라도 늑대인간이 살아남으면 승리합니다.',
    },
    mason: {
      name: '비밀결사', en: 'MASON', team: 'village', max: 2, night: 3, color: '#8a6a2a',
      short: '다른 비밀결사원이 누구인지 확인합니다.',
      desc: '밤에 다른 비밀결사원과 서로를 확인합니다. 혼자 눈을 떴다면 다른 한 장은 가운데에 있다는 뜻이에요.',
    },
    seer: {
      name: '예언자', en: 'SEER', team: 'village', max: 1, night: 4, color: '#5a4aa8',
      short: '다른 사람 카드 1장, 또는 가운데 카드 2장을 봅니다.',
      desc: '밤에 다른 사람 한 명의 카드를 보거나, 가운데 카드 2장을 볼 수 있어요.',
    },
    robber: {
      name: '강도', en: 'ROBBER', team: 'village', max: 1, night: 5, color: '#3a5a7a',
      short: '다른 사람과 카드를 바꾸고 새 카드를 봅니다.',
      desc: '밤에 다른 사람의 카드와 내 카드를 맞바꾸고, 새로 가진 카드를 확인합니다. 바꾼 카드의 편이 곧 내 편이 됩니다.',
    },
    troublemaker: {
      name: '말썽꾼', en: 'TROUBLEMAKER', team: 'village', max: 1, night: 6, color: '#c8702a',
      short: '다른 두 사람의 카드를 몰래 바꿉니다.',
      desc: '밤에 나를 뺀 두 사람의 카드를 서로 맞바꿉니다. 바꾼 카드는 보지 않아요.',
    },
    drunk: {
      name: '술꾼', en: 'DRUNK', team: 'village', max: 1, night: 7, color: '#6a8a3a',
      short: '가운데 카드 1장과 내 카드를 바꿉니다 (보지 못해요).',
      desc: '밤에 가운데 카드 1장과 내 카드를 반드시 바꿉니다. 새 카드는 보지 못해서, 내가 무엇이 되었는지 모릅니다.',
    },
    insomniac: {
      name: '불면증 환자', en: 'INSOMNIAC', team: 'village', max: 1, night: 8, color: '#4a7a8a',
      short: '밤이 끝날 때 내 카드를 다시 확인합니다.',
      desc: '밤이 끝날 무렵 눈을 떠서, 누군가 내 카드를 바꿨는지 확인합니다.',
    },
    hunter: {
      name: '사냥꾼', en: 'HUNTER', team: 'village', max: 1, night: 0, color: '#5a6a2a',
      short: '내가 죽으면, 내가 투표한 사람도 함께 죽습니다.',
      desc: '밤에는 아무것도 하지 않습니다. 투표로 사냥꾼이 죽으면, 사냥꾼이 투표한 사람도 함께 죽어요.',
    },
    tanner: {
      name: '무두장이', en: 'TANNER', team: 'tanner', max: 1, night: 0, color: '#7a5a3a',
      short: '삶이 지겹습니다. 내가 죽어야 이깁니다.',
      desc: '자기 일이 너무 싫어서 죽고 싶어 합니다. 투표로 무두장이가 죽으면 무두장이 혼자 승리하고, 늑대인간은 (죽지 않았어도) 패배합니다.',
    },
    villager: {
      name: '마을 주민', en: 'VILLAGER', team: 'village', max: 3, night: 0, color: '#5a7a4a',
      short: '특별한 능력이 없습니다. 추리로 늑대를 찾으세요.',
      desc: '밤에는 아무것도 하지 않습니다. 대화와 추리로 늑대인간을 찾아 투표하세요.',
    },
  };
  const ROLE_IDS = Object.keys(ROLES);
  const NIGHT_ORDER = ROLE_IDS.filter((r) => ROLES[r].night).sort((a, b) => ROLES[a].night - ROLES[b].night);

  // 밤 진행자 대사
  const NARRATION = {
    dusk: '모두 눈을 감으세요. 보름밤이 찾아왔습니다.',
    werewolf: '늑대인간은 눈을 뜨고, 서로를 확인하세요.',
    minion: '하수인은 눈을 뜨세요. 늑대인간이 누구인지 확인하세요.',
    mason: '비밀결사원은 눈을 뜨고, 서로를 확인하세요.',
    seer: '예언자는 눈을 뜨세요. 다른 사람의 카드 한 장, 또는 가운데 카드 두 장을 볼 수 있습니다.',
    robber: '강도는 눈을 뜨세요. 다른 사람과 카드를 바꾸고, 새 카드를 확인하세요.',
    troublemaker: '말썽꾼은 눈을 뜨세요. 다른 두 사람의 카드를 바꿀 수 있습니다.',
    drunk: '술꾼은 눈을 뜨세요. 가운데 카드 한 장과 내 카드를 바꾸세요.',
    insomniac: '불면증 환자는 눈을 뜨세요. 내 카드를 다시 확인하세요.',
    dawn: '모두 눈을 뜨세요. 아침이 밝았습니다. 누가 늑대인간일까요?',
  };

  /** 인원수에 맞는 기본 역할 구성 (인원 + 3장) */
  function defaultDeck(n) {
    const base = ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager'];
    const extra = ['drunk', 'insomniac', 'minion', 'mason', 'mason', 'hunter', 'tanner', 'villager', 'villager'];
    const need = n + CENTER;
    const deck = base.slice(0, need);
    for (let i = 0; deck.length < need; i++) deck.push(extra[i]);
    return deck;
  }

  /** 역할 구성이 올바른지 */
  function checkDeck(deck, n) {
    if (!Array.isArray(deck)) return '역할 구성이 잘못되었습니다';
    if (deck.length !== n + CENTER) return `역할 카드는 인원 + 3장 = ${n + CENTER}장이어야 해요 (지금 ${deck.length}장)`;
    const count = {};
    for (const r of deck) {
      if (!ROLES[r]) return '알 수 없는 역할이 있어요';
      count[r] = (count[r] || 0) + 1;
      if (count[r] > ROLES[r].max) return `${ROLES[r].name} 카드는 최대 ${ROLES[r].max}장이에요`;
    }
    if (!count.werewolf) return '늑대인간 카드가 1장 이상 있어야 해요';
    return null;
  }

  const countDeck = (deck) => deck.reduce((m, r) => ((m[r] = (m[r] || 0) + 1), m), {});

  return { MIN_PLAYERS, MAX_PLAYERS, CENTER, ROLES, ROLE_IDS, NIGHT_ORDER, NARRATION, defaultDeck, checkDeck, countDeck };
});
