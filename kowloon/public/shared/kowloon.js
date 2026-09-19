/* 구룡 살인사건 - 공용 데이터 (서버 · 브라우저 같이 쓴다)
   카드마다 '태그' 가 있고, 현장 타일 칸마다 어울리는 태그가 있다.
   AI 법의학자는 태그가 많이 겹치는 칸에 총알을 놓고, AI 수사관은 그걸 거꾸로 읽어 범인을 추리한다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KOWLOON = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const MIN_PLAYERS = 3;      // 카드를 받는 사람 수 (AI 법의학자일 때)
  const MAX_PLAYERS = 12;
  const HAND = 4;             // 수단 · 단서 각각 몇 장씩
  const ROUNDS = 3;

  const ROLES = {
    forensic: { name: '법의학자', team: 'good', short: '진실을 알지만 말은 못 한다. 현장 타일에 총알로만 알려 준다.' },
    murderer: { name: '살인자', team: 'bad', short: '수단 1장과 단서 1장을 골라 살인을 저질렀다. 끝까지 들키지 마라.' },
    accomplice: { name: '공범', team: 'bad', short: '살인자가 누구인지, 무엇을 골랐는지 안다. 수사를 엉뚱한 곳으로.' },
    witness: { name: '목격자', team: 'good', short: '범인 두 명의 얼굴을 봤다(누가 살인자인지는 모름). 들키면 제거당한다.' },
    investigator: { name: '수사관', team: 'good', short: '수단과 단서를 맞혀 살인자를 체포하라. 지목은 한 번뿐.' },
  };

  // [id, 이름, 태그들]
  const MEANS_RAW = [
    ['knife', '부엌칼', 'sharp kitchen metal blood'], ['axe', '도끼', 'sharp tool wood big blood'], ['hammer', '망치', 'blunt tool metal'],
    ['pistol', '권총', 'gun metal small loud'], ['shotgun', '엽총', 'gun big wood loud'], ['rope', '밧줄', 'rope choke'],
    ['necktie', '넥타이', 'cloth choke money'], ['pillow', '베개', 'cloth choke bed soft'], ['poison', '독약병', 'poison glass chemical'],
    ['pills', '수면제', 'medical poison small'], ['syringe', '주사기', 'medical sharp small poison'], ['cable', '전깃줄', 'electric choke rope'],
    ['dryer', '헤어드라이어', 'electric water accident'], ['brick', '벽돌', 'blunt dirt big'], ['golf', '골프채', 'blunt sport metal money'],
    ['bat', '야구방망이', 'blunt sport wood'], ['scissors', '가위', 'sharp paper metal small'], ['bottle', '술병', 'glass drink blunt'],
    ['shard', '깨진 유리', 'glass sharp blood'], ['bag', '비닐봉지', 'plastic choke'], ['pot', '화분', 'blunt plant dirt'],
    ['snake', '독사', 'animal poison'], ['bee', '벌떼', 'animal poison small'], ['car', '자동차', 'vehicle big metal accident'],
    ['bike', '오토바이', 'vehicle metal accident loud'], ['gas', '휘발유', 'fire chemical'], ['match', '성냥', 'fire small wood'],
    ['candle', '촛대', 'blunt fire metal old'], ['trophy', '트로피', 'blunt metal sport money'], ['ice', '얼음덩어리', 'cold water blunt'],
    ['bathtub', '욕조 물', 'water choke bath'], ['mushroom', '독버섯', 'poison plant food'], ['choco', '초콜릿', 'food poison sweet'],
    ['wine', '와인', 'drink poison glass'], ['fishline', '낚싯줄', 'rope water sport choke'], ['scarf', '스카프', 'cloth choke'],
    ['chain', '쇠사슬', 'metal rope big'], ['chainsaw', '전기톱', 'sharp tool electric big loud blood'], ['bow', '활', 'sport sharp wood'],
    ['stairs', '계단', 'fall accident big'],
  ];
  const CLUES_RAW = [
    ['ring', '반지', 'money metal small love'], ['key', '열쇠', 'metal small'], ['glasses', '안경', 'glass small paper'],
    ['hanky', '손수건', 'cloth small'], ['lipstick', '립스틱', 'love small red'], ['wallet', '지갑', 'money'],
    ['receipt', '영수증', 'paper money'], ['letter', '편지', 'paper love secret'], ['photo', '사진', 'paper secret love'],
    ['newspaper', '신문', 'paper old'], ['book', '낡은 책', 'paper old book'], ['keycard', '카드키', 'tech plastic secret'],
    ['phone', '휴대폰', 'tech electric secret'], ['watch', '손목시계', 'metal small old money'], ['cigarette', '담배꽁초', 'fire small night'],
    ['lighter', '라이터', 'fire metal small'], ['coffee', '커피잔', 'drink glass food'], ['umbrella', '우산', 'water cloth'],
    ['gloves', '장갑', 'cloth cold'], ['sneakers', '운동화', 'sport shoe dirt'], ['heels', '하이힐', 'shoe love'],
    ['hat', '중절모', 'cloth old'], ['hair', '머리카락', 'small body'], ['button', '단추', 'small plastic cloth'],
    ['perfume', '향수병', 'glass chemical love'], ['petal', '꽃잎', 'plant love red'], ['soil', '흙', 'dirt plant'],
    ['sand', '모래', 'dirt water outdoor'], ['coin', '동전', 'money metal small'], ['dice', '주사위', 'small plastic money game'],
    ['chess', '체스 말', 'wood small old game'], ['teddy', '곰 인형', 'child cloth soft'], ['balloon', '풍선', 'child plastic crowd red'],
    ['candy', '사탕', 'food child sweet'], ['bread', '빵', 'food kitchen'], ['fishbone', '생선 가시', 'food animal water'],
    ['feather', '깃털', 'animal small'], ['footprint', '발자국', 'dirt shoe'], ['flashlight', '손전등', 'electric night metal'],
    ['wax', '촛농', 'fire old'], ['recorder', '녹음기', 'tech music secret'], ['string', '기타 줄', 'music metal'],
    ['ticket', '공연 표', 'paper crowd music'], ['map', '지도', 'paper outdoor secret'], ['medbottle', '약병', 'medical glass'],
    ['bandage', '붕대', 'medical cloth blood'], ['thermo', '체온계', 'medical glass cold'], ['necklace', '목걸이', 'money metal love'],
    ['mahjong', '마작 패', 'game small old money'], ['chopsticks', '젓가락', 'food wood kitchen'], ['fan', '부채', 'paper old hot'],
    ['lantern', '종이 등', 'paper fire night red'], ['tape', '테이프', 'plastic tool'], ['nail', '못', 'metal tool sharp small'],
    ['paint', '페인트', 'chemical red'], ['mask', '가면', 'secret crowd'], ['bell', '방울', 'metal music small'],
    ['towel', '수건', 'cloth water bath'], ['battery', '건전지', 'electric small chemical'], ['leaf', '낙엽', 'plant outdoor old'],
  ];

  const toCard = (kind) => ([id, name, tags]) => ({ id: `${kind}_${id}`, key: id, kind, name, tags: tags.split(' ') });
  const MEANS = MEANS_RAW.map(toCard('m'));
  const CLUES = CLUES_RAW.map(toCard('c'));
  const CARD = Object.fromEntries([...MEANS, ...CLUES].map((c) => [c.id, c]));

  // 현장 타일: [id, 이름, 종류, [[칸 이름, 태그들] × 6]]
  const TILE_RAW = [
    ['cause', '사인', 'cause', [['질식', 'choke rope cloth water plastic bath'], ['심한 부상', 'blunt big fall vehicle loud'], ['과다 출혈', 'sharp blood glass gun'],
      ['병', 'medical animal food cold'], ['중독', 'poison chemical drink food sweet'], ['사고', 'accident electric fire vehicle fall water']]],
    ['loc_home', '장소 (집)', 'location', [['거실', 'soft game tech'], ['침실', 'bed cloth love night soft'], ['창고', 'tool old dirt metal'],
      ['욕실', 'water bath glass medical'], ['부엌', 'kitchen food sharp fire'], ['서재', 'paper book old secret']]],
    ['loc_out', '장소 (야외)', 'location', [['공원', 'plant outdoor sport child'], ['숲', 'plant animal dirt wood'], ['학교', 'paper child sport book'],
      ['들판', 'plant outdoor animal dirt'], ['주차장', 'vehicle metal night'], ['시장', 'food money crowd']]],
    ['loc_shop', '장소 (가게)', 'location', [['술집', 'drink glass night'], ['서점', 'paper book old'], ['식당', 'food kitchen sharp'],
      ['호텔', 'bed cloth money love'], ['병원', 'medical chemical sharp'], ['공사장', 'tool metal dirt big']]],
    ['loc_city', '장소 (거리)', 'location', [['부두', 'water vehicle rope animal'], ['지하철', 'vehicle crowd electric'], ['놀이공원', 'child sport crowd sweet'],
      ['뒷골목', 'night dirt glass secret'], ['옥상', 'fall outdoor night'], ['극장', 'music crowd night secret']]],
    ['weather', '그날 날씨', 'scene', [['맑음', 'outdoor sport'], ['비', 'water cloth'], ['강한 바람', 'outdoor paper plant'],
      ['눈', 'cold water'], ['무더위', 'fire hot drink'], ['안개', 'night secret']]],
    ['time', '사건 시각', 'scene', [['새벽', 'night secret'], ['아침', 'food drink kitchen'], ['점심', 'food crowd'],
      ['오후', 'sport outdoor child'], ['저녁', 'drink food love'], ['한밤중', 'night fire']]],
    ['body', '시신 상태', 'scene', [['따뜻함', 'fire hot'], ['차가움', 'cold water'], ['뒤틀림', 'poison chemical electric'],
      ['멍투성이', 'blunt fall'], ['젖어 있음', 'water bath drink'], ['깨끗함', 'medical cloth choke']]],
    ['trace', '남은 흔적', 'scene', [['지문', 'glass metal plastic'], ['발자국', 'dirt shoe'], ['핏자국', 'blood sharp red'],
      ['그을음', 'fire chemical'], ['물 자국', 'water bath'], ['긁힌 자국', 'animal sharp tool']]],
    ['job', '피해자 직업', 'scene', [['사장', 'money paper'], ['학생', 'child paper sport book'], ['의사', 'medical chemical'],
      ['요리사', 'kitchen food sharp'], ['경비원', 'metal night tool'], ['가수', 'music crowd love']]],
    ['mind', '범인의 성격', 'scene', [['꼼꼼함', 'tool paper small'], ['충동적', 'blunt sharp loud'], ['교활함', 'poison chemical secret'],
      ['겁이 많음', 'gun small medical'], ['잔인함', 'blood fire'], ['침착함', 'water cold choke']]],
    ['motive', '동기', 'scene', [['돈', 'money'], ['사랑', 'love cloth plant'], ['복수', 'blood old'],
      ['질투', 'glass love red'], ['사고였다', 'accident vehicle electric'], ['비밀', 'secret paper tech']]],
    ['size', '흉기 크기', 'scene', [['아주 작음', 'small'], ['작음', 'small medical'], ['중간', 'tool kitchen'],
      ['큼', 'big'], ['아주 큼', 'big vehicle'], ['모양 없음', 'chemical water fire poison']]],
    ['material', '흉기 재질', 'scene', [['쇠', 'metal'], ['나무', 'wood'], ['플라스틱', 'plastic tech'],
      ['천', 'cloth soft'], ['유리', 'glass'], ['액체', 'drink chemical water']]],
    ['color', '단서 색깔', 'scene', [['빨강', 'red blood love fire'], ['파랑', 'water cold'], ['초록', 'plant poison'],
      ['검정', 'night old'], ['흰색', 'medical paper'], ['노랑', 'money electric']]],
    ['sound', '들린 소리', 'scene', [['비명', 'crowd blood'], ['아무 소리 없음', 'poison choke secret'], ['쾅!', 'gun loud blunt'],
      ['음악', 'music'], ['유리 깨지는 소리', 'glass'], ['동물 소리', 'animal']]],
    ['how', '흉기 쓰는 법', 'scene', [['휘두르기', 'blunt sport'], ['찌르기', 'sharp medical'], ['던지기', 'small sport'],
      ['먹이기', 'poison food drink sweet'], ['조르기', 'choke rope cloth'], ['켜기 · 불붙이기', 'electric fire tech']]],
    ['relation', '둘의 관계', 'scene', [['가족', 'old money'], ['연인', 'love'], ['친구', 'game drink'],
      ['직장 동료', 'paper tech money'], ['모르는 사이', 'crowd night'], ['원수', 'blood secret']]],
  ];
  const TILES = TILE_RAW.map(([id, name, type, opts]) => ({ id, name, type, opts: opts.map(([n, tags]) => ({ name: n, tags: tags.split(' ') })) }));
  const TILE = Object.fromEntries(TILES.map((t) => [t.id, t]));
  const LOCATIONS = TILES.filter((t) => t.type === 'location').map((t) => t.id);
  const SCENES = TILES.filter((t) => t.type === 'scene').map((t) => t.id);

  /** 카드가 그 칸과 얼마나 어울리나 */
  const fit = (card, opt) => card.tags.reduce((s, t) => s + (opt.tags.includes(t) ? 1 : 0), 0);
  /** 수단+단서 한 쌍을 가장 잘 가리키는 칸 번호 (법의학자 AI) */
  function bestOption(tileId, meansId, clueId, rnd = Math.random) {
    const tile = TILE[tileId];
    const m = CARD[meansId];
    const c = CARD[clueId];
    let best = [];
    let top = -1;
    tile.opts.forEach((o, i) => {
      const s = fit(m, o) * 1.2 + fit(c, o);
      if (s > top + 1e-9) { top = s; best = [i]; } else if (Math.abs(s - top) < 1e-9) best.push(i);
    });
    return best[Math.floor(rnd() * best.length)];
  }
  /** 타일에 놓인 총알로 (수단, 단서) 한 쌍의 점수 (수사관 AI) */
  function scorePair(tiles, meansId, clueId) {
    const m = CARD[meansId];
    const c = CARD[clueId];
    let s = 0;
    for (const t of tiles) {
      if (t.pick == null) continue;
      const o = TILE[t.id].opts[t.pick];
      s += fit(m, o) * 1.2 + fit(c, o);
      // 다른 칸이 더 어울리면 감점 (법의학자가 그 칸을 안 골랐으니까)
      const alt = Math.max(...TILE[t.id].opts.map((x) => fit(m, x) * 1.2 + fit(c, x)));
      s -= Math.max(0, alt - (fit(m, o) * 1.2 + fit(c, o))) * 0.5;
    }
    return s;
  }

  /** 인원에 따른 역할 (법의학자는 따로) */
  function rolesFor(n, opts = {}) {
    const roles = ['murderer'];
    if (n >= 6 && opts.accomplice !== false) roles.push('accomplice');
    if (n >= 6 && opts.witness !== false) roles.push('witness');
    while (roles.length < n) roles.push('investigator');
    return roles;
  }

  return { MIN_PLAYERS, MAX_PLAYERS, HAND, ROUNDS, ROLES, MEANS, CLUES, CARD, TILES, TILE, LOCATIONS, SCENES, fit, bestOption, scorePair, rolesFor };
}));
