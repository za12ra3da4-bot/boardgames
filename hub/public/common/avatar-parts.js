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

  /* ───── 모양은 전부 다른 것 50가지 (색은 따로 고른다) */
  const named = (arr) => arr.map(([id, name]) => ({ id, name }));

  // 머리: 앞머리 8 × 뒷머리 6 + 까까머리 · 민머리 (예전 id 는 그대로 살린다)
  const FRONT = [['short', '짧은'], ['spiky', '삐죽'], ['side', '옆가르마'], ['slick', '넘긴'], ['straight', '일자 앞머리'], ['center', '가운데 가르마'], ['messy', '부스스'], ['curly', '곱슬']];
  const BACK = { none: '', long: '긴 머리', bob: '단발', pony: '포니테일', twin: '양갈래', bun: '올림머리', braid: '땋은 머리', afro: '뽀글 머리' };
  const OLD_HAIR = { 'short|none': 'short', 'spiky|none': 'spiky', 'side|long': 'long', 'side|bob': 'bob', 'slick|pony': 'pony', 'curly|afro': 'curly', 'center|twin': 'twin', 'slick|bun': 'bun' };
  const HAIR = [];
  for (const [f, fn] of FRONT) {
    const backs = f === 'curly' ? ['afro', 'long', 'bob', 'pony', 'twin', 'bun'] : f === 'straight' ? ['none', 'long', 'bob', 'braid', 'twin', 'bun'] : ['none', 'long', 'bob', 'pony', 'twin', 'bun'];
    for (const bk of backs) {
      const id = OLD_HAIR[`${f}|${bk}`] || `${f}-${bk}`;
      HAIR.push({ id, name: bk === 'none' ? `${fn} 머리` : `${fn} ${BACK[bk]}`, front: f, back: bk });
    }
  }
  HAIR.push({ id: 'buzz', name: '까까머리', front: 'buzz', back: 'none' }, { id: 'bald', name: '민머리', front: 'bald', back: 'none' });

  // 눈: 모양 10 × 눈썹 5
  const EYE_SHAPE = [['dot', '콩알'], ['big', '초롱'], ['sharp', '날카로운'], ['sleepy', '졸린'], ['smile', '웃는'], ['round', '동그란'], ['lashes', '속눈썹'], ['cat', '고양이'], ['star', '반짝'], ['bags', '피곤한']];
  const BROW = [['arch', ''], ['thick', '굵은 눈썹'], ['sharp', '치켜뜬 눈썹'], ['worry', '처진 눈썹'], ['dots', '점 눈썹']];
  const EYES = [];
  for (const [s, sn] of EYE_SHAPE) for (const [b, bn] of BROW) EYES.push({ id: b === 'arch' ? s : `${s}-${b}`, name: bn ? `${sn} 눈 · ${bn}` : `${sn} 눈`, shape: s, brow: b });

  // 입: 모양 10 × 코 5
  const MOUTH_SHAPE = [['smile', '미소'], ['grin', '씩'], ['flat', '무표정'], ['cat', '고양이 입'], ['fang', '송곳니'], ['open', '벌린 입'], ['pout', '뾰로통'], ['smirk', '비죽'], ['teeth', '토끼 이'], ['wavy', '울렁']];
  const NOSE = [['tick', ''], ['round', '동글 코'], ['dot', '점 코'], ['button', '들창코'], ['long', '오똑한 코']];
  const MOUTH = [];
  for (const [s, sn] of MOUTH_SHAPE) for (const [n, nn] of NOSE) MOUTH.push({ id: n === 'tick' ? s : `${s}-${n}`, name: nn ? `${sn} · ${nn}` : sn, shape: s, nose: n });

  const OUTFIT = named([
    ['tee', '티셔츠'], ['hoodie', '후드티'], ['suit', '정장'], ['vest', '카우보이 조끼'], ['cloak', '망토'],
    ['apron', '앞치마'], ['dress', '드레스'], ['overalls', '멜빵바지'], ['hanbok', '한복'], ['knight', '갑옷'],
    ['sweater', '목폴라 니트'], ['jersey', '농구 유니폼'], ['sailor', '세일러복'], ['labcoat', '실험 가운'], ['qipao', '치파오'],
    ['trench', '트렌치코트'], ['tank', '민소매'], ['cardigan', '가디건'], ['tuxedo', '턱시도'], ['police', '경찰복'],
    ['chef', '요리사복'], ['pajama', '잠옷'], ['raincoat', '우비'], ['leather', '가죽 재킷'], ['varsity', '야구 점퍼'],
    ['track', '트레이닝복'], ['school', '교복'], ['nurse', '간호복'], ['pirate', '해적 옷'], ['ninja', '닌자복'],
    ['astro', '우주복'], ['bee', '꿀벌 옷'], ['prince', '왕자 옷'], ['gown', '공주 드레스'], ['aloha', '하와이안 셔츠'],
    ['flannel', '체크 남방'], ['hanbokdress', '치마저고리'], ['robe', '마법사 로브'], ['jumpsuit', '정비복'], ['bathrobe', '목욕 가운'],
    ['poncho', '판초'], ['cheer', '치어리더'], ['soccer', '축구 유니폼'], ['marine', '마린 티셔츠'], ['hero', '슈퍼히어로'],
    ['lifevest', '구명조끼'], ['butler', '집사 연미복'], ['maid', '메이드복'], ['scrubs', '수술복'], ['dino', '공룡 옷'],
  ]);
  const HAT = named([
    ['none', '없음'], ['cowboy', '카우보이'], ['beanie', '털모자'], ['crown', '왕관'], ['wizard', '마법사 모자'],
    ['band', '머리띠'], ['top', '신사 모자'], ['cap', '야구 모자'], ['beret', '베레모'], ['ears', '고양이 귀'],
    ['bunny', '토끼 귀'], ['bear', '곰 귀'], ['fox', '여우 귀'], ['horns', '악마 뿔'], ['halo', '천사 고리'],
    ['flowers', '꽃 화관'], ['tiara', '티아라'], ['tricorn', '해적 모자'], ['toque', '요리사 모자'], ['policecap', '경찰 모자'],
    ['helmet', '군용 철모'], ['knighthelm', '기사 투구'], ['viking', '바이킹 투구'], ['straw', '밀짚모자'], ['sunhat', '챙 넓은 모자'],
    ['bucket', '벙거지'], ['hardhat', '안전모'], ['grad', '학사모'], ['santa', '산타 모자'], ['party', '고깔모자'],
    ['phones', '헤드폰'], ['bandana', '두건'], ['gat', '갓'], ['satgat', '삿갓'], ['nursecap', '간호사 모자'],
    ['mushroom', '버섯 모자'], ['frog', '개구리 모자'], ['sailorhat', '수병 모자'], ['jester', '광대 모자'], ['propeller', '프로펠러 모자'],
    ['deerstalker', '탐정 모자'], ['fedora', '중절모'], ['bowler', '둥근 신사 모자'], ['bow', '큰 리본'], ['goggles', '고글'],
    ['antlers', '사슴뿔'], ['unicorn', '유니콘 뿔'], ['antenna', '외계인 더듬이'], ['bikehelm', '자전거 헬멧'], ['flowerpin', '꽃 핀'],
  ]);
  const ACC = named([
    ['none', '없음'], ['glasses', '동그란 안경'], ['shades', '선글라스'], ['patch', '안대'], ['mustache', '팔자 콧수염'],
    ['bandaid', '반창고'], ['monocle', '외알 안경'], ['mask', '마스크'], ['beard', '덥수룩 수염'], ['earring', '링 귀걸이'],
    ['square', '뿔테 안경'], ['cateye', '여우 안경'], ['heartshades', '하트 선글라스'], ['starshades', '별 선글라스'], ['3d', '3D 안경'],
    ['reading', '반달 돋보기'], ['goatee', '염소 수염'], ['stubble', '까칠한 수염'], ['chevron', '두툼 콧수염'], ['pencil', '가는 콧수염'],
    ['sideburns', '구레나룻'], ['clown', '광대 코'], ['heart', '하트 스티커'], ['star', '별 스티커'], ['mole', '눈물점'],
    ['scar', '흉터'], ['whiskers', '고양이 수염'], ['tiger', '호랑이 무늬'], ['warpaint', '전투 분장'], ['freckles', '주근깨'],
    ['nosering', '코 피어싱'], ['studs', '큐빅 귀걸이'], ['pearls', '진주 귀걸이'], ['stardrop', '별 귀걸이'], ['choker', '초커'],
    ['necklace', '진주 목걸이'], ['chain', '금목걸이'], ['bowtie', '나비넥타이'], ['scarf', '목도리'], ['kerchief', '목 스카프'],
    ['medal', '금메달'], ['stetho', '청진기'], ['headset', '헤드셋 마이크'], ['pipe', '파이프'], ['lolly', '막대사탕'],
    ['rose', '입에 문 장미'], ['toothpick', '이쑤시개'], ['gum', '풍선껌'], ['masquerade', '가면무도회 가면'], ['headwrap', '머리 붕대'],
  ]);

  // 따로 고르는 색들
  const PAL = [
    ['red', '빨강', '#c8453a'], ['orange', '주황', '#e0843a'], ['yellow', '노랑', '#e8c43a'], ['lime', '연두', '#9ac83a'], ['green', '초록', '#4d8a3c'],
    ['teal', '청록', '#2f8a8a'], ['sky', '하늘', '#5aa0d8'], ['navy', '남색', '#34497a'], ['purple', '보라', '#7a4a9a'], ['pink', '분홍', '#e08aa8'],
    ['brown', '갈색', '#8a5a32'], ['beige', '베이지', '#d8c29a'], ['white', '흰색', '#f4f0e6'], ['grey', '회색', '#9a9a9e'], ['black', '검정', '#2e2a28'],
    ['gold', '금색', '#d8a830'], ['silver', '은색', '#b8bcc4'], ['mint', '민트', '#8ad8c0'], ['wine', '와인', '#8a2a44'], ['coral', '산호', '#f08a6a'],
  ];
  const palette = () => PAL.map(([id, name, fill]) => ({ id, name, fill, shade: mix(fill, '#000000', 0.3) }));
  const HAT_COLOR = [{ id: 'auto', name: '기본색', fill: null, shade: null }, ...palette()];
  const ACC_COLOR = [{ id: 'auto', name: '기본색', fill: null, shade: null }, ...palette()];
  const EYE_COLOR = [
    { id: 'ink', name: '먹색', fill: '#2a1d14' }, { id: 'brown', name: '갈색', fill: '#6a4226' }, { id: 'blue', name: '파랑', fill: '#2f64b0' },
    { id: 'green', name: '초록', fill: '#2f8a4a' }, { id: 'red', name: '빨강', fill: '#b0302a' }, { id: 'violet', name: '보라', fill: '#7a3ab0' },
    { id: 'gold', name: '금색', fill: '#c89420' }, { id: 'grey', name: '회색', fill: '#6a6e76' }, { id: 'pink', name: '분홍', fill: '#d0507a' },
    { id: 'teal', name: '청록', fill: '#1f8a8a' },
  ];
  const PATTERN = named([['plain', '무늬 없음'], ['stripe', '줄무늬'], ['dots', '물방울'], ['check', '체크'], ['stars', '별무늬'], ['flowers', '꽃무늬'], ['hearts', '하트'], ['zigzag', '지그재그']]);

  /** id → [모양, 꾸밈 번호] */
  const split = (id) => { const [b, v] = String(id || '').split('~'); return [b, Number(v) || 0]; };

  const TITLES = [
    '떠돌이 총잡이', '마을 보안관', '현상수배범', '수상한 배신자',
    '저택의 탐정', '밤의 목격자', '바람섬 개척자', '양털 부자',
    '늑대 사냥꾼', '보름밤의 늑대', '거짓말 장인', '보석상 견습생',
    '귀족의 단골', '주사위의 신', '패배 전문가', '오늘의 방장',
  ];

  const LISTS = {
    skin: SKIN, hair: HAIR, hairColor: HAIR_COLOR, eyes: EYES, eyeColor: EYE_COLOR, mouth: MOUTH,
    outfit: OUTFIT, cloth: CLOTH, pattern: PATTERN, hat: HAT, hatColor: HAT_COLOR, acc: ACC, accColor: ACC_COLOR, bg: BG,
  };
  const DEFAULT = { skin: 'peach', hair: 'short', hairColor: 'brown', eyes: 'dot', eyeColor: 'ink', mouth: 'smile', outfit: 'tee', cloth: 'red', pattern: 'plain', hat: 'none', hatColor: 'auto', acc: 'none', accColor: 'auto', bg: 'parchment' };

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
      skin: pick(SKIN.slice(0, 30)), hair: pick(HAIR), hairColor: pick(HAIR_COLOR.slice(0, 25)), eyes: pick(EYES), eyeColor: pick(EYE_COLOR.slice(0, 4)), mouth: pick(MOUTH),
      outfit: pick(OUTFIT), cloth: pick(CLOTH), pattern: 'plain', hat: pick(HAT), hatColor: 'auto', acc: 'none', accColor: 'auto', bg: pick(BG),
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
