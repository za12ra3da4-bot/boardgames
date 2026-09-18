// 바람섬 개척기 - 서버와 브라우저가 함께 쓰는 데이터: 자원, 건설 비용, 발전 카드, 육각 보드 좌표
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ISLE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 6;   // 맵마다 따로 (기본판 4명, 대형 맵 6명)
  const WIN_VP = 10;

  const RES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
  const RES_INFO = {
    wood: { name: '목재', en: 'LUMBER', terrain: 'forest' },
    brick: { name: '벽돌', en: 'BRICK', terrain: 'hills' },
    sheep: { name: '양털', en: 'WOOL', terrain: 'pasture' },
    wheat: { name: '곡식', en: 'GRAIN', terrain: 'fields' },
    ore: { name: '광석', en: 'ORE', terrain: 'mountains' },
  };
  const TERRAIN = {
    forest: { name: '숲', res: 'wood', count: 4 },
    hills: { name: '언덕', res: 'brick', count: 3 },
    pasture: { name: '목초지', res: 'sheep', count: 4 },
    fields: { name: '밭', res: 'wheat', count: 4 },
    mountains: { name: '산', res: 'ore', count: 3 },
    desert: { name: '사막', res: null, count: 1 },
    lake: { name: '호수', res: null, count: 0 },
  };
  const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const BANK_EACH = 19;

  const COST = {
    road: { wood: 1, brick: 1 },
    settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
    city: { wheat: 2, ore: 3 },
    dev: { sheep: 1, wheat: 1, ore: 1 },
  };
  const BUILD_NAME = { road: '도로', settlement: '마을', city: '도시', dev: '발전 카드' };
  const PIECES = { road: 15, settlement: 5, city: 4 };

  const DEV = {
    knight: { name: '기사', en: 'KNIGHT', count: 14, desc: '도적을 옮기고, 도적 칸에 건물이 있는 사람에게서 자원 1장을 빼앗습니다. 3장 이상 내면 최강 기사단(2점)을 노릴 수 있어요.' },
    vp: { name: '승리 점수', en: 'VICTORY POINT', count: 5, desc: '가지고 있기만 하면 1점입니다. 다른 사람에게는 보이지 않아요.' },
    roads: { name: '도로 건설', en: 'ROAD BUILDING', count: 2, desc: '도로 2개를 공짜로 놓습니다.' },
    plenty: { name: '풍년', en: 'YEAR OF PLENTY', count: 2, desc: '은행에서 원하는 자원 2장을 가져옵니다.' },
    monopoly: { name: '독점', en: 'MONOPOLY', count: 2, desc: '자원 하나를 고르면 다른 모든 사람이 그 자원을 전부 나에게 줍니다.' },
  };

  const COLORS = [
    { id: 'red', name: '빨강', fill: '#c8342a', dark: '#6e140e', light: '#ee7a6a' },
    { id: 'blue', name: '파랑', fill: '#2f62b0', dark: '#122c5a', light: '#7aa6e6' },
    { id: 'white', name: '하양', fill: '#efe8d8', dark: '#6e6450', light: '#ffffff' },
    { id: 'orange', name: '주황', fill: '#e2812e', dark: '#7a3a0a', light: '#f8b878' },
    { id: 'green', name: '초록', fill: '#3a8a3a', dark: '#14401a', light: '#88cc80' },
    { id: 'brown', name: '갈색', fill: '#7a4a24', dark: '#3a1e0a', light: '#c89868' },
  ];
  const COLOR = Object.fromEntries(COLORS.map((c) => [c.id, c]));

  const pips = (n) => (n ? 6 - Math.abs(7 - n) : 0);

  /* ───────── 맵: 모양(육각 칸 배치)과 지형 구성 ─────────
     모양은 줄마다 글자로 그린다 (홀수 줄은 반 칸 오른쪽으로 밀린다).
     x = 땅, L = 호수, . = 바다 */

  const R = 60;
  const SQ3 = Math.sqrt(3);
  const key = (x, y) => `${Math.round(x)},${Math.round(y)}`;

  const MAP_DEFS = {
    base: {
      name: '기본', desc: '초보 추천 고정 배치', players: [3, 4],
      rows: ['.xxx.', 'xxxx', 'xxxxx', 'xxxx', '.xxx.'],
      fixed: {
        terrain: ['mountains', 'pasture', 'forest', 'fields', 'hills', 'pasture', 'hills', 'fields', 'forest', 'desert', 'forest', 'mountains', 'forest', 'mountains', 'fields', 'pasture', 'hills', 'fields', 'pasture'],
        numbers: [10, 2, 9, 12, 6, 4, 10, 9, 11, 0, 3, 8, 8, 3, 4, 5, 5, 6, 11],
      },
    },
    random: { name: '기본 무작위', desc: '매 판 지형 · 숫자가 섞여요', players: [3, 4], rows: ['.xxx.', 'xxxx', 'xxxxx', 'xxxx', '.xxx.'] },
    pond: { name: '연못', desc: '가운데가 호수 · 사막 없음', players: [3, 4], rows: ['.xxx.', 'xxxx', 'xxLxx', 'xxxx', '.xxx.'] },
    big: { name: '5~6인 대형', desc: '30칸 · 최대 6명', players: [3, 6], rows: ['..xxx', '.xxxx', '.xxxxx', 'xxxxxx', '.xxxxx', '.xxxx', '..xxx'] },
    islands: { name: '군도', desc: '작은 섬 세 개', players: [3, 4], rows: ['.xx...xx', 'xxx..xxx', '.xx...xx', '........', '...xxx..', '..xxxx..', '...xx...'] },
    earth: { name: '대륙', desc: '세계 지도 모양 · 최대 6명', players: [3, 6], rows: ['.xxx.....xxxxx..', 'xxxx....xxxxxxx.', '.xxx...xxxxxx...', '..xx....xxxx....', '...xx......x..xx', '...xx.........xx', '....x...........'] },
    usa: { name: '신대륙', desc: '넓은 대평원 · 최대 6명', players: [3, 6], rows: ['xxxxxx..xx', 'xxxxxxxxxx', 'xxxxxxxxxx', '.xxxxxxxx.', '...xx...x.', '........x.'] },
  };
  const MAP_IDS = Object.keys(MAP_DEFS);

  const corner = (h, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return { x: h.x + R * Math.cos(a), y: h.y + R * Math.sin(a) };
  };

  /** 글자 모양 → 칸 · 꼭짓점 · 변 · 해안 · 항구 자리 */
  function buildGeometry(rows) {
    const cells = [];
    rows.forEach((row, r) => {
      [...row].forEach((ch, i) => {
        if (ch === 'x' || ch === 'L') cells.push({ col: 2 * i + (r & 1), r, lake: ch === 'L' });
      });
    });
    const cx = cells.reduce((s, c) => s + c.col, 0) / cells.length;
    const cy = cells.reduce((s, c) => s + c.r, 0) / cells.length;
    const HEXES = cells.map((c, i) => ({ id: i, col: c.col, row: c.r, lake: c.lake, x: (R * SQ3 / 2) * (c.col - cx), y: R * 1.5 * (c.r - cy) }));

    const vmap = new Map();
    for (const h of HEXES) {
      for (let i = 0; i < 6; i++) {
        const c = corner(h, i);
        const k = key(c.x, c.y);
        if (!vmap.has(k)) vmap.set(k, { x: c.x, y: c.y, hexes: [] });
        vmap.get(k).hexes.push(h.id);
      }
    }
    const VERTS = [...vmap.entries()]
      .sort((a, b) => (Math.round(a[1].y) - Math.round(b[1].y)) || (a[1].x - b[1].x))
      .map(([k, v], i) => ({ id: i, k, x: v.x, y: v.y, hexes: v.hexes, edges: [], adj: [] }));
    const vByKey = new Map(VERTS.map((v) => [v.k, v]));
    for (const h of HEXES) h.verts = Array.from({ length: 6 }, (_, i) => { const c = corner(h, i); return vByKey.get(key(c.x, c.y)).id; });

    const emap = new Map();
    for (const h of HEXES) {
      for (let i = 0; i < 6; i++) {
        const a = h.verts[i];
        const b = h.verts[(i + 1) % 6];
        const k = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!emap.has(k)) emap.set(k, { a: Math.min(a, b), b: Math.max(a, b), hexes: [] });
        emap.get(k).hexes.push(h.id);
      }
    }
    const EDGES = [...emap.values()]
      .map((e) => ({ ...e, x: (VERTS[e.a].x + VERTS[e.b].x) / 2, y: (VERTS[e.a].y + VERTS[e.b].y) / 2 }))
      .sort((p, q) => (Math.round(p.y) - Math.round(q.y)) || (p.x - q.x));
    EDGES.forEach((e, i) => {
      e.id = i;
      VERTS[e.a].edges.push(i);
      VERTS[e.b].edges.push(i);
      VERTS[e.a].adj.push(e.b);
      VERTS[e.b].adj.push(e.a);
    });
    const NB = R * SQ3 * 1.05;
    for (const h of HEXES) {
      h.edges = Array.from({ length: 6 }, (_, i) => {
        const a = h.verts[i];
        const b = h.verts[(i + 1) % 6];
        return VERTS[a].edges.find((eid) => VERTS[b].edges.includes(eid));
      });
      h.nbrs = HEXES.filter((o) => o !== h && Math.hypot(o.x - h.x, o.y - h.y) < NB).map((o) => o.id);
    }
    // 해안: 바다와 닿은 변 (호수 가는 해안이 아니다)
    const COAST = EDGES.filter((e) => e.hexes.length === 1)
      .sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x))
      .map((e) => e.id);
    return { HEXES, VERTS, EDGES, COAST };
  }

  const STD_EXTRA = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 3, 4, 5, 6, 8, 9, 10, 11];
  const BASE_RATIO = { forest: 4, hills: 3, pasture: 4, fields: 4, mountains: 3 };
  const cache = {};

  /** 맵 하나의 모든 것: 모양 + 지형 수 + 숫자 목록 + 항구 자리 + 은행 자원 수 */
  function map(id) {
    if (!MAP_DEFS[id]) id = 'random';
    if (cache[id]) return cache[id];
    const def = MAP_DEFS[id];
    const g = buildGeometry(def.rows);
    const land = g.HEXES.filter((h) => !h.lake).length;
    // 지형 개수
    let terrainList;
    if (def.fixed) terrainList = def.fixed.terrain.slice();
    else {
      const deserts = id === 'pond' ? 0 : land >= 30 ? 2 : 1;
      const rest = land - deserts;
      const counts = {};
      let used = 0;
      const tot = Object.values(BASE_RATIO).reduce((a, b) => a + b, 0);
      for (const [k, v] of Object.entries(BASE_RATIO)) { counts[k] = Math.floor((rest * v) / tot); used += counts[k]; }
      const order = ['forest', 'pasture', 'fields', 'hills', 'mountains'];
      for (let i = 0; used < rest; i++, used++) counts[order[i % 5]]++;
      terrainList = [];
      for (const [k, v] of Object.entries(counts)) for (let i = 0; i < v; i++) terrainList.push(k);
      for (let i = 0; i < deserts; i++) terrainList.push('desert');
    }
    const producing = terrainList.filter((t) => t !== 'desert').length;
    const numbers = def.fixed ? null : [...NUMBERS];
    if (numbers) for (let i = 0; numbers.length < producing; i++) numbers.push(STD_EXTRA[i % STD_EXTRA.length]);
    if (numbers) numbers.length = producing;
    // 항구: 해안을 따라 고르게, 서로 꼭짓점을 나누지 않게
    const nHarbor = id === 'base' || id === 'random' || id === 'pond' ? 9 : Math.max(6, Math.min(12, Math.round(land / 2.7)));
    let HARBOR_SPOTS;
    if (g.COAST.length === 30 && nHarbor === 9) HARBOR_SPOTS = [0, 3, 6, 10, 13, 16, 20, 23, 26].map((i) => g.COAST[i]);
    else {
      HARBOR_SPOTS = [];
      const used = new Set();
      const step = g.COAST.length / nHarbor;
      for (let k = 0; k < nHarbor; k++) {
        for (let d = 0; d < step; d++) {
          const e = g.EDGES[g.COAST[Math.floor(k * step + d) % g.COAST.length]];
          if (used.has(e.a) || used.has(e.b)) continue;
          HARBOR_SPOTS.push(e.id);
          for (const v of [e.a, e.b]) { used.add(v); for (const u of g.VERTS[v].adj) used.add(u); }
          break;
        }
      }
    }
    const generic = Math.round(HARBOR_SPOTS.length * 0.45);
    const HARBOR_TYPES = [];
    for (let i = 0; i < generic; i++) HARBOR_TYPES.push('any');
    for (let i = 0; HARBOR_TYPES.length < HARBOR_SPOTS.length; i++) HARBOR_TYPES.push(RES[i % 5]);
    const scale = land / 19;
    const m = {
      id, name: def.name, desc: def.desc, rows: def.rows,
      minPlayers: def.players[0], maxPlayers: def.players[1],
      ...g, HARBOR_SPOTS, HARBOR_TYPES, terrainList, numbers, fixed: def.fixed || null,
      BANK_EACH: Math.max(19, Math.round(19 * Math.min(scale, 1.6))),
    };
    cache[id] = m;
    return m;
  }

  // 기존 코드와 호환: 기본 맵의 좌표를 그대로 내보낸다
  const BASE = map('random');
  const { HEXES, VERTS, EDGES, COAST, HARBOR_SPOTS } = BASE;
  const HARBOR_TYPES = ['any', 'any', 'any', 'any', 'wood', 'brick', 'sheep', 'wheat', 'ore'];
  const edgeBetween = (a, b) => VERTS[a].edges.find((eid) => VERTS[b].edges.includes(eid));

  /* ───────── 도우미 ───────── */

  const emptyRes = () => ({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  const total = (r) => RES.reduce((s, k) => s + (r[k] || 0), 0);
  const canPay = (have, cost) => RES.every((k) => (have[k] || 0) >= (cost[k] || 0));

  return {
    MIN_PLAYERS, MAX_PLAYERS, WIN_VP, RES, RES_INFO, TERRAIN, NUMBERS, BANK_EACH,
    COST, BUILD_NAME, PIECES, DEV, COLORS, COLOR, pips,
    R, SQ3, HEXES, VERTS, EDGES, COAST, HARBOR_SPOTS, HARBOR_TYPES, edgeBetween, corner,
    MAP_DEFS, MAP_IDS, map,
    emptyRes, total, canPay,
  };
});
