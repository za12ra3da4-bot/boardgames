/* 프로필 캐릭터: 고를 수 있는 부위 목록 (서버 · 브라우저 같이 쓴다) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AVATAR_PARTS = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const SKIN = [
    { id: 'porcelain', name: '하얀', fill: '#fbe3d0', shade: '#e9bfa4' },
    { id: 'peach', name: '복숭아', fill: '#f6cfae', shade: '#dea883' },
    { id: 'honey', name: '꿀빛', fill: '#e6b184', shade: '#c28a5e' },
    { id: 'tan', name: '구릿빛', fill: '#c98c5e', shade: '#a06a40' },
    { id: 'cocoa', name: '갈색', fill: '#91603c', shade: '#6e4426' },
    { id: 'green', name: '괴물', fill: '#a8c98a', shade: '#7fa266' },
  ];
  const HAIR_COLOR = [
    { id: 'ink', name: '먹색', fill: '#2b2320', light: '#54463e' },
    { id: 'brown', name: '밤색', fill: '#6b4128', light: '#94613e' },
    { id: 'blond', name: '금발', fill: '#e2b55a', light: '#f5d68e' },
    { id: 'ginger', name: '주황', fill: '#c4602c', light: '#e58e56' },
    { id: 'silver', name: '은발', fill: '#b9bcc4', light: '#e4e6ec' },
    { id: 'rose', name: '분홍', fill: '#e07a9c', light: '#f5a9c2' },
    { id: 'sky', name: '하늘', fill: '#5f93d0', light: '#96bdea' },
    { id: 'mint', name: '민트', fill: '#56b39a', light: '#8ed6c1' },
  ];
  const HAIR = [
    { id: 'short', name: '짧은 머리' },
    { id: 'spiky', name: '삐죽 머리' },
    { id: 'long', name: '긴 머리' },
    { id: 'bob', name: '단발' },
    { id: 'pony', name: '포니테일' },
    { id: 'buzz', name: '까까머리' },
    { id: 'curly', name: '곱슬' },
    { id: 'bald', name: '민머리' },
  ];
  const EYES = [
    { id: 'dot', name: '콩알' },
    { id: 'big', name: '초롱' },
    { id: 'sharp', name: '날카로운' },
    { id: 'sleepy', name: '졸린' },
    { id: 'smile', name: '웃는' },
  ];
  const MOUTH = [
    { id: 'smile', name: '미소' },
    { id: 'grin', name: '씩' },
    { id: 'flat', name: '무표정' },
    { id: 'cat', name: '고양이' },
    { id: 'fang', name: '송곳니' },
  ];
  const OUTFIT = [
    { id: 'tee', name: '티셔츠' },
    { id: 'hoodie', name: '후드티' },
    { id: 'suit', name: '정장' },
    { id: 'vest', name: '카우보이 조끼' },
    { id: 'cloak', name: '망토' },
    { id: 'apron', name: '앞치마' },
    { id: 'dress', name: '드레스' },
    { id: 'overalls', name: '멜빵바지' },
  ];
  const CLOTH = [
    { id: 'red', name: '빨강', fill: '#c8453a', shade: '#8e2a22' },
    { id: 'navy', name: '남색', fill: '#34497a', shade: '#1f2d52' },
    { id: 'forest', name: '초록', fill: '#4d7a3c', shade: '#2f5024' },
    { id: 'mustard', name: '겨자', fill: '#d7a53c', shade: '#a37a22' },
    { id: 'plum', name: '보라', fill: '#7a4a86', shade: '#52305c' },
    { id: 'charcoal', name: '먹빛', fill: '#44403c', shade: '#2a2724' },
    { id: 'cream', name: '크림', fill: '#efe2c2', shade: '#cdbb92' },
    { id: 'teal', name: '청록', fill: '#2f8a8a', shade: '#1c5c5c' },
  ];
  const HAT = [
    { id: 'none', name: '없음' },
    { id: 'cowboy', name: '카우보이' },
    { id: 'beanie', name: '털모자' },
    { id: 'crown', name: '왕관' },
    { id: 'wizard', name: '마법사' },
    { id: 'band', name: '머리띠' },
    { id: 'top', name: '신사 모자' },
    { id: 'cap', name: '야구 모자' },
  ];
  const ACC = [
    { id: 'none', name: '없음' },
    { id: 'glasses', name: '동그란 안경' },
    { id: 'shades', name: '선글라스' },
    { id: 'patch', name: '안대' },
    { id: 'mustache', name: '콧수염' },
    { id: 'bandaid', name: '반창고' },
  ];
  const BG = [
    { id: 'parchment', name: '양피지', fill: '#efe0bd', ink: '#8a6a3a' },
    { id: 'dusk', name: '노을', fill: '#e8a878', ink: '#a0502a' },
    { id: 'night', name: '밤', fill: '#2e3656', ink: '#8fa0d8' },
    { id: 'meadow', name: '들판', fill: '#b9d49a', ink: '#5a7a3a' },
    { id: 'sea', name: '바다', fill: '#9cc6de', ink: '#3a6a8a' },
    { id: 'rose', name: '장미', fill: '#eab4c0', ink: '#a04a62' },
    { id: 'gold', name: '금빛', fill: '#ecca6a', ink: '#8a6414' },
    { id: 'smoke', name: '잿빛', fill: '#c8c4bc', ink: '#5a5650' },
  ];
  const TITLES = [
    '떠돌이 총잡이', '마을 보안관', '현상수배범', '수상한 배신자',
    '저택의 탐정', '밤의 목격자', '바람섬 개척자', '양털 부자',
    '늑대 사냥꾼', '보름밤의 늑대', '거짓말 장인', '보석상 견습생',
    '귀족의 단골', '주사위의 신', '패배 전문가', '오늘의 방장',
  ];

  const LISTS = {
    skin: SKIN, hair: HAIR, hairColor: HAIR_COLOR, eyes: EYES, mouth: MOUTH,
    outfit: OUTFIT, cloth: CLOTH, hat: HAT, acc: ACC, bg: BG,
  };
  const DEFAULT = { skin: 'peach', hair: 'short', hairColor: 'brown', eyes: 'dot', mouth: 'smile', outfit: 'tee', cloth: 'red', hat: 'none', acc: 'none', bg: 'parchment' };

  /** 이상한 값은 버리고 목록에 있는 값만 남긴다 */
  function clean(av) {
    const out = {};
    for (const [k, list] of Object.entries(LISTS)) {
      const v = av && typeof av[k] === 'string' ? av[k] : '';
      out[k] = list.some((o) => o.id === v) ? v : DEFAULT[k];
    }
    return out;
  }

  /** 손님용: 아이디(pid)마다 늘 같은 무작위 캐릭터 */
  function fromSeed(seed) {
    let h = 2166136261;
    for (const ch of String(seed || 'guest')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const pick = (list) => { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return list[h % list.length].id; };
    return {
      skin: pick(SKIN.slice(0, 5)), hair: pick(HAIR), hairColor: pick(HAIR_COLOR.slice(0, 5)), eyes: pick(EYES), mouth: pick(MOUTH),
      outfit: pick(OUTFIT), cloth: pick(CLOTH), hat: pick(HAT), acc: 'none', bg: pick(BG),
    };
  }

  const EMOTES = [
    { id: 'hurry', text: '빨리 해!', expr: 'annoyed' },
    { id: 'mock', text: 'ㅈㄴ 못하네', expr: 'smug' },
    { id: 'lol', text: 'ㅋㅋㅋㅋㅋ', expr: 'laugh' },
    { id: 'tease', text: '메롱~', expr: 'tongue' },
    { id: 'nice', text: '잘했어!', expr: 'happy' },
    { id: 'close', text: '아깝다…', expr: 'sad' },
    { id: 'angry', text: '아오 진짜!', expr: 'angry' },
    { id: 'gg', text: 'GG', expr: 'content' },
  ];
  const EMOTE_IDS = EMOTES.map((e) => e.id);

  return { ...LISTS, LISTS, TITLES, DEFAULT, clean, fromSeed, EMOTES, EMOTE_IDS };
}));
