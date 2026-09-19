/* 프로필 캐릭터: 고를 수 있는 부위 목록 (서버 · 브라우저 같이 쓴다) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AVATAR_PARTS = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  /* ───── 색 도우미: 한 가지 색에서 연한 · 진한 단계를 만든다 */
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
  const mix = (a, b, k) => { const x = hx(a); const y = hx(b); return toHex(x.map((v, i) => v + (y[i] - v) * k)); };
  const TONES = [
    { s: '', f: (c) => c },
    { s: ' 연한', f: (c) => mix(c, '#ffffff', 0.32) },
    { s: ' 아주 연한', f: (c) => mix(c, '#ffffff', 0.58) },
    { s: ' 진한', f: (c) => mix(c, '#000000', 0.24) },
    { s: ' 아주 진한', f: (c) => mix(c, '#000000', 0.45) },
  ];
  /** [id, 이름, 기본색] 10개 → 50개 (기본 id 는 예전 그대로, 나머지는 id~1 ~ id~4) */
  function tones(families, make) {
    const out = [];
    for (const [id, name, base] of families) {
      TONES.forEach((tn, v) => out.push({ id: v ? `${id}~${v}` : id, name: name + tn.s, ...make(tn.f(base), v) }));
    }
    return out;
  }
  /** 모양 10개 × 꾸밈 5개 → 50개 */
  function variants(bases, vnames) {
    const out = [];
    for (const [id, name] of bases) vnames.forEach((vn, v) => out.push({ id: v ? `${id}~${v}` : id, name: vn ? `${name} · ${vn}` : name }));
    return out;
  }

  const SKIN = tones([
    ['porcelain', '하얀', '#fbe3d0'], ['peach', '복숭아', '#f6cfae'], ['honey', '꿀빛', '#e6b184'], ['tan', '구릿빛', '#c98c5e'],
    ['cocoa', '갈색', '#91603c'], ['ebony', '초콜릿', '#6a4028'], ['green', '괴물', '#a8c98a'], ['fairy', '요정', '#9cc4ea'],
    ['ghost', '유령', '#c8ccd4'], ['imp', '도깨비', '#e0826a'],
  ], (c) => ({ fill: c, shade: mix(c, '#5a2a10', 0.22) }));
  const HAIR_COLOR = tones([
    ['ink', '먹색', '#2b2320'], ['brown', '밤색', '#6b4128'], ['blond', '금발', '#e2b55a'], ['ginger', '주황', '#c4602c'],
    ['silver', '은발', '#b9bcc4'], ['rose', '분홍', '#e07a9c'], ['sky', '하늘', '#5f93d0'], ['mint', '민트', '#56b39a'],
    ['violet', '보라', '#8a5ac0'], ['crimson', '빨강', '#b8303a'],
  ], (c) => ({ fill: c, light: mix(c, '#ffffff', 0.35) }));
  const CLOTH = tones([
    ['red', '빨강', '#c8453a'], ['navy', '남색', '#34497a'], ['forest', '초록', '#4d7a3c'], ['mustard', '겨자', '#d7a53c'],
    ['plum', '보라', '#7a4a86'], ['charcoal', '먹빛', '#44403c'], ['cream', '크림', '#efe2c2'], ['teal', '청록', '#2f8a8a'],
    ['pink', '분홍', '#e08aa8'], ['sky', '하늘', '#6aa8d8'],
  ], (c) => ({ fill: c, shade: mix(c, '#000000', 0.3) }));
  const BG_PATTERNS = ['stripe', 'dots', 'check', 'stars', 'waves'];
  const BG = [];
  for (const [id, name, fill, ink] of [
    ['parchment', '양피지', '#efe0bd', '#8a6a3a'], ['dusk', '노을', '#e8a878', '#a0502a'], ['night', '밤', '#2e3656', '#8fa0d8'],
    ['meadow', '들판', '#b9d49a', '#5a7a3a'], ['sea', '바다', '#9cc6de', '#3a6a8a'], ['rose', '장미', '#eab4c0', '#a04a62'],
    ['gold', '금빛', '#ecca6a', '#8a6414'], ['smoke', '잿빛', '#c8c4bc', '#5a5650'], ['mintbg', '박하', '#bfe6d6', '#3a8a6a'],
    ['lavender', '라벤더', '#d4c8ec', '#6a5a9a'],
  ]) {
    ['줄무늬', '물방울', '체크', '별', '물결'].forEach((pn, v) => BG.push({ id: v ? `${id}~${v}` : id, name: `${name} ${pn}`, fill, ink, pattern: BG_PATTERNS[v] }));
  }

  const HAIR = variants([
    ['short', '짧은 머리'], ['spiky', '삐죽 머리'], ['long', '긴 머리'], ['bob', '단발'], ['pony', '포니테일'],
    ['buzz', '까까머리'], ['curly', '곱슬'], ['bald', '민머리'], ['twin', '양갈래'], ['bun', '올림머리'],
  ], ['', '더듬이', '별 핀', '브릿지', '리본']);
  const EYES = variants([
    ['dot', '콩알'], ['big', '초롱'], ['sharp', '날카로운'], ['sleepy', '졸린'], ['smile', '웃는'],
    ['round', '동그란'], ['lashes', '속눈썹'], ['cat', '고양이'], ['star', '반짝'], ['bags', '피곤한'],
  ], ['', '파란', '초록', '빨간', '보라']);
  const MOUTH = variants([
    ['smile', '미소'], ['grin', '씩'], ['flat', '무표정'], ['cat', '고양이'], ['fang', '송곳니'],
    ['open', '벌린'], ['pout', '뾰로통'], ['smirk', '비죽'], ['teeth', '토끼 이'], ['wavy', '울렁'],
  ], ['', '빨간 입술', '분홍 입술', '점', '주근깨']);
  const OUTFIT = variants([
    ['tee', '티셔츠'], ['hoodie', '후드티'], ['suit', '정장'], ['vest', '카우보이 조끼'], ['cloak', '망토'],
    ['apron', '앞치마'], ['dress', '드레스'], ['overalls', '멜빵바지'], ['hanbok', '한복'], ['knight', '갑옷'],
  ], ['', '줄무늬', '물방울', '체크', '별무늬']);
  const HAT = variants([
    ['none', '없음'], ['cowboy', '카우보이'], ['beanie', '털모자'], ['crown', '왕관'], ['wizard', '마법사'],
    ['band', '머리띠'], ['top', '신사 모자'], ['cap', '야구 모자'], ['beret', '베레모'], ['ears', '고양이 귀'],
  ], ['', '빨강', '남색', '초록', '분홍']);
  // '없음' 모자의 꾸밈은 머리 장식으로
  ['꽃 한 송이', '나비 핀', '천사 고리', '악마 뿔'].forEach((n, i) => { HAT[i + 1].name = n; });
  const ACC = variants([
    ['none', '없음'], ['glasses', '동그란 안경'], ['shades', '선글라스'], ['patch', '안대'], ['mustache', '콧수염'],
    ['bandaid', '반창고'], ['monocle', '외알 안경'], ['mask', '마스크'], ['beard', '턱수염'], ['earring', '귀걸이'],
  ], ['', '빨강', '파랑', '금색', '분홍']);
  ['하트 스티커', '별 스티커', '눈물점', '흉터'].forEach((n, i) => { ACC[i + 1].name = n; });

  /** id → [모양, 꾸밈 번호] */
  const split = (id) => { const [b, v] = String(id || '').split('~'); return [b, Number(v) || 0]; };

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
      skin: pick(SKIN.slice(0, 30)), hair: pick(HAIR), hairColor: pick(HAIR_COLOR.slice(0, 25)), eyes: pick(EYES), mouth: pick(MOUTH),
      outfit: pick(OUTFIT), cloth: pick(CLOTH), hat: pick(HAT), acc: pick(ACC.slice(0, 5)) === 'none' ? 'none' : 'none', bg: pick(BG),
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

  return { ...LISTS, LISTS, TITLES, DEFAULT, clean, fromSeed, EMOTES, EMOTE_IDS, split, mix };
}));
