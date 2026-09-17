// 바람섬 개척기 - 서버와 브라우저가 함께 쓰는 데이터: 자원, 건설 비용, 발전 카드, 육각 보드 좌표
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ISLE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 4;
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
  ];
  const COLOR = Object.fromEntries(COLORS.map((c) => [c.id, c]));

  const pips = (n) => (n ? 6 - Math.abs(7 - n) : 0);

  /* ───────── 육각 보드 좌표 (뾰족한 꼭짓점이 위로, 가로줄 3-4-5-4-3) ───────── */

  const R = 60;
  const SQ3 = Math.sqrt(3);
  const key = (x, y) => `${Math.round(x)},${Math.round(y)}`;

  const HEXES = [];
  for (let r = -2; r <= 2; r++) {
    for (let q = -2; q <= 2; q++) {
      if (Math.abs(q + r) > 2) continue;
      HEXES.push({ q, r, x: R * SQ3 * (q + r / 2), y: R * 1.5 * r });
    }
  }
  HEXES.forEach((h, i) => { h.id = i; });

  const corner = (h, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return { x: h.x + R * Math.cos(a), y: h.y + R * Math.sin(a) };
  };

  // 꼭짓점
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
  for (const h of HEXES) {
    h.verts = Array.from({ length: 6 }, (_, i) => { const c = corner(h, i); return vByKey.get(key(c.x, c.y)).id; });
  }

  // 변(도로 자리)
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
  for (const h of HEXES) {
    h.edges = Array.from({ length: 6 }, (_, i) => {
      const a = h.verts[i];
      const b = h.verts[(i + 1) % 6];
      return VERTS[a].edges.find((eid) => VERTS[b].edges.includes(eid));
    });
    h.nbrs = HEXES.filter((o) => o !== h && Math.abs(o.q - h.q) + Math.abs(o.r - h.r) + Math.abs((o.q + o.r) - (h.q + h.r)) === 2).map((o) => o.id);
  }
  const edgeBetween = (a, b) => VERTS[a].edges.find((eid) => VERTS[b].edges.includes(eid));

  // 해안선 (항구 자리). 둘레를 돌면서 순서대로
  const COAST = EDGES.filter((e) => e.hexes.length === 1)
    .sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x))
    .map((e) => e.id);
  const HARBOR_SPOTS = [0, 3, 6, 10, 13, 16, 20, 23, 26].map((i) => COAST[i]);
  const HARBOR_TYPES = ['any', 'any', 'any', 'any', 'wood', 'brick', 'sheep', 'wheat', 'ore'];

  /* ───────── 도우미 ───────── */

  const emptyRes = () => ({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  const total = (r) => RES.reduce((s, k) => s + (r[k] || 0), 0);
  const canPay = (have, cost) => RES.every((k) => (have[k] || 0) >= (cost[k] || 0));

  return {
    MIN_PLAYERS, MAX_PLAYERS, WIN_VP, RES, RES_INFO, TERRAIN, NUMBERS, BANK_EACH,
    COST, BUILD_NAME, PIECES, DEV, COLORS, COLOR, pips,
    R, SQ3, HEXES, VERTS, EDGES, COAST, HARBOR_SPOTS, HARBOR_TYPES, edgeBetween, corner,
    emptyRes, total, canPay,
  };
});
