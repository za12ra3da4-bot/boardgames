// 서버(Node)와 브라우저가 함께 쓰는 게임 데이터 + 보드 이동 계산
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CLUE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 24;
  const H = 25;
  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 6;

  const SUSPECTS = [
    { id: 'han', name: '한여사', title: '은퇴한 영화배우', color: '#d8433b', start: [16, 24],
      bio: '왕년의 톱스타. 도회장에게 거액의 빚이 있다는 소문이 돈다.' },
    { id: 'kang', name: '강대령', title: '퇴역 육군 대령', color: '#e2b23a', start: [0, 17],
      bio: '회장의 오랜 전우. 최근 사업 문제로 크게 다퉜다.' },
    { id: 'baek', name: '백집사', title: '30년 차 집사', color: '#e9e4d8', start: [9, 0],
      bio: '저택의 모든 열쇠를 가진 남자. 유언장 내용을 알고 있다.' },
    { id: 'oh', name: '오박사', title: '괴짜 식물학자', color: '#4fa35a', start: [14, 0],
      bio: '온실에서 희귀한 독초를 키운다. 연구비가 끊길 위기다.' },
    { id: 'yoon', name: '윤교수', title: '천문학 교수', color: '#4a7fd0', start: [23, 5],
      bio: '회장의 조카. 상속 순위 두 번째라는 사실을 숨기지 않는다.' },
    { id: 'seo', name: '서화백', title: '몰락한 화가', color: '#8e5bc4', start: [23, 19],
      bio: '회장이 사들인 위작 스캔들의 당사자. 복수를 다짐했었다.' },
  ];

  const WEAPONS = [
    { id: 'candle', name: '은촛대' },
    { id: 'dagger', name: '단검' },
    { id: 'rope', name: '밧줄' },
    { id: 'poison', name: '독약병' },
    { id: 'revolver', name: '리볼버' },
    { id: 'wrench', name: '렌치' },
  ];

  // rect: [x, y, w, h]  doors: [밖(복도)x, 밖y, 안x, 안y]
  const ROOMS = [
    { id: 'kitchen', name: '부엌', rect: [0, 0, 6, 6], doors: [[4, 6, 4, 5]], passage: 'study', floor: 'checker' },
    { id: 'ballroom', name: '연회장', rect: [8, 1, 8, 6], doors: [[7, 4, 8, 4], [16, 4, 15, 4], [10, 7, 10, 6], [13, 7, 13, 6]], floor: 'parquet' },
    { id: 'conservatory', name: '온실', rect: [18, 0, 6, 5], doors: [[18, 5, 18, 4]], passage: 'lounge', floor: 'terracotta' },
    { id: 'dining', name: '식당', rect: [0, 9, 7, 7], doors: [[7, 12, 6, 12], [3, 8, 3, 9]], floor: 'wood' },
    { id: 'billiard', name: '당구장', rect: [18, 7, 6, 5], doors: [[17, 9, 18, 9], [22, 12, 22, 11]], floor: 'felt' },
    { id: 'library', name: '도서관', rect: [17, 14, 7, 5], doors: [[16, 16, 17, 16], [20, 13, 20, 14]], floor: 'planks' },
    { id: 'lounge', name: '라운지', rect: [0, 19, 7, 6], doors: [[5, 18, 5, 19], [7, 22, 6, 22]], passage: 'conservatory', floor: 'damask' },
    { id: 'hall', name: '현관홀', rect: [9, 18, 6, 7], doors: [[11, 17, 11, 18], [12, 17, 12, 18], [15, 21, 14, 21]], floor: 'marble' },
    { id: 'study', name: '서재', rect: [17, 21, 7, 4], doors: [[17, 20, 17, 21]], passage: 'kitchen', floor: 'navy' },
  ];
  const CENTER = [9, 9, 6, 7];

  const CARDS = {};
  for (const s of SUSPECTS) CARDS[s.id] = { id: s.id, type: 'suspect', name: s.name };
  for (const w of WEAPONS) CARDS[w.id] = { id: w.id, type: 'weapon', name: w.name };
  for (const r of ROOMS) CARDS[r.id] = { id: r.id, type: 'room', name: r.name };
  const ROOM = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
  const SUSPECT = Object.fromEntries(SUSPECTS.map((s) => [s.id, s]));
  const WEAPON = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));
  const TYPE_NAME = { suspect: '용의자', weapon: '흉기', room: '장소' };

  // grid[y][x] = 방 id | 'center' | null(복도)
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const fill = (rect, v) => {
    const [x0, y0, w, h] = rect;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) grid[y][x] = v;
  };
  for (const r of ROOMS) fill(r.rect, r.id);
  fill(CENTER, 'center');

  const key = (x, y) => x + ',' + y;
  const parseKey = (k) => k.split(',').map(Number);
  const isHall = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y][x] === null;

  // 복도 칸 -> 그 칸에서 들어갈 수 있는 방들
  const doorsAt = new Map();
  for (const r of ROOMS) {
    for (const [ox, oy] of r.doors) {
      const k = key(ox, oy);
      if (!doorsAt.has(k)) doorsAt.set(k, []);
      doorsAt.get(k).push(r.id);
    }
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  /**
   * 주사위 steps 칸 이내로 갈 수 있는 곳 계산
   * from: { cell:[x,y] } | { room:id }
   * blocked: Set<'x,y'> 다른 말이 서 있는 복도 칸
   * 결과 경로는 출발지를 뺀 위치 목록 ('x,y' | 'room:id')
   */
  function reachable(from, steps, blocked) {
    const dist = new Map();
    const parent = new Map();
    const queue = [];
    if (from.cell) {
      const k = key(from.cell[0], from.cell[1]);
      dist.set(k, 0);
      parent.set(k, null);
      queue.push(k);
    } else if (from.room) {
      for (const [ox, oy] of ROOM[from.room].doors) {
        const k = key(ox, oy);
        if (blocked.has(k) || dist.has(k)) continue;
        dist.set(k, 1);
        parent.set(k, null);
        queue.push(k);
      }
    }
    for (let i = 0; i < queue.length; i++) {
      const k = queue[i];
      const d = dist.get(k);
      if (d >= steps) continue;
      const [x, y] = parseKey(k);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        const nk = key(nx, ny);
        if (!isHall(nx, ny) || blocked.has(nk) || dist.has(nk)) continue;
        dist.set(nk, d + 1);
        parent.set(nk, k);
        queue.push(nk);
      }
    }
    const pathTo = (k) => {
      const out = [];
      for (let c = k; c != null; c = parent.get(c)) out.push(c);
      out.reverse();
      if (from.cell) out.shift();
      return out;
    };
    const cells = {};
    const rooms = {};
    for (const [k, d] of dist) {
      if (d >= 1 && !(from.cell && d === 0)) cells[k] = pathTo(k);
      const entries = doorsAt.get(k);
      if (!entries || d + 1 > steps) continue;
      for (const rid of entries) {
        if (rid === from.room) continue;
        const p = pathTo(k).concat('room:' + rid);
        if (!rooms[rid] || rooms[rid].length > p.length) rooms[rid] = p;
      }
    }
    return { cells, rooms };
  }

  /** 막힌 칸을 무시하고 목표 방까지 몇 걸음인지 (봇 길찾기용) */
  function distanceField(roomIds) {
    const dist = new Map();
    const queue = [];
    for (const rid of roomIds) {
      for (const [ox, oy] of ROOM[rid].doors) {
        const k = key(ox, oy);
        if (!dist.has(k)) { dist.set(k, 1); queue.push(k); }
      }
    }
    for (let i = 0; i < queue.length; i++) {
      const k = queue[i];
      const [x, y] = parseKey(k);
      for (const [dx, dy] of DIRS) {
        const nk = key(x + dx, y + dy);
        if (!isHall(x + dx, y + dy) || dist.has(nk)) continue;
        dist.set(nk, dist.get(k) + 1);
        queue.push(nk);
      }
    }
    return dist;
  }

  return {
    W, H, MIN_PLAYERS, MAX_PLAYERS,
    SUSPECTS, WEAPONS, ROOMS, CENTER, CARDS, ROOM, SUSPECT, WEAPON, TYPE_NAME,
    grid, key, parseKey, isHall, doorsAt, reachable, distanceField,
  };
});
