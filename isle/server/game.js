'use strict';
// 바람섬 개척기 규칙 엔진 (기본판 규칙).
// 서버가 모든 판정을 한다. 사람은 act() 로 행동하고, 봇은 같은 act() 를 스스로 호출한다.
const crypto = require('crypto');
const I = require('../public/shared/isle');

const { RES, COST, PIECES } = I;

const T = { setup: 60_000, roll: 25_000, discard: 45_000, robber: 30_000, steal: 20_000, roads: 40_000, main: 150_000 };
const T_OFFLINE = 6_000;
const LOG_MAX = 250;

let PACE = 1;
const rand = (n) => crypto.randomInt(n);
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ok = (extra) => ({ ok: true, ...extra });
const err = (error) => ({ ok: false, error });
const resName = (r) => I.RES_INFO[r].name;
const fmtRes = (m) => RES.filter((r) => m[r]).map((r) => `{x:${r}}×${m[r]}`).join(' ');

/** 판 만들기: 맵의 지형·숫자를 놓되 (무작위 맵은) 6과 8이 서로 붙지 않게 */
function makeBoard(M) {
  const landIds = M.HEXES.filter((h) => !h.lake).map((h) => h.id);
  let terr;
  let numbers;
  if (M.fixed) {
    terr = M.fixed.terrain.slice();
    numbers = M.fixed.numbers.slice();
  } else {
    terr = shuffle(M.terrainList.slice());
    for (let tries = 0; tries < 800; tries++) {
      const pool = shuffle([...M.numbers]);
      numbers = terr.map((t) => (t === 'desert' ? 0 : pool.pop()));
      const hot = (k) => numbers[k] === 6 || numbers[k] === 8;
      const idx = new Map(landIds.map((id, k) => [id, k]));
      const bad = landIds.some((id, k) => hot(k) && M.HEXES[id].nbrs.some((n) => idx.has(n) && hot(idx.get(n))));
      if (!bad) break;
    }
  }
  const hexes = M.HEXES.map((h) => ({ terrain: 'lake', number: 0 }));
  landIds.forEach((id, k) => { hexes[id] = { terrain: terr[k], number: numbers[k] }; });
  const types = M.fixed ? [...M.HARBOR_TYPES] : shuffle([...M.HARBOR_TYPES]);
  const harbors = M.HARBOR_SPOTS.map((e, i) => ({ edge: e, type: types[i], verts: [M.EDGES[e].a, M.EDGES[e].b] }));
  return { hexes, harbors };
}

class Game {
  /**
   * seats: [{ pid, name, isBot }] (3~4명)
   * hooks: { changed(), isOnline(pid) }
   */
  constructor(seats, hooks, opts = {}) {
    this.hooks = hooks;
    this.M = I.map(opts.map || 'random');
    this.mapId = this.M.id;
    this.id = crypto.randomBytes(6).toString('hex');
    const order = shuffle(seats.map((s, i) => i));
    this.players = order.map((i, k) => ({
      pid: seats[i].pid, name: seats[i].name, isBot: !!seats[i].isBot,
      color: I.COLORS[k].id, seat: k,
      res: I.emptyRes(), dev: [], knights: 0,
      left: { ...PIECES },
    }));
    const b = makeBoard(this.M);
    this.hexes = b.hexes;
    this.harbors = b.harbors;
    this.robber = this.hexes.findIndex((h) => h.terrain === 'desert');
    if (this.robber < 0) this.robber = this.hexes.findIndex((h) => h.terrain === 'lake');
    if (this.robber < 0) this.robber = 0;
    this.buildings = {};   // 꼭짓점 id → { pid, type }
    this.roads = {};       // 변 id → pid
    this.bank = Object.fromEntries(RES.map((r) => [r, this.M.BANK_EACH]));
    this.devDeck = shuffle(Object.entries(I.DEV).flatMap(([type, d]) => Array(d.count).fill(type)))
      .map((type, i) => ({ id: `d${i}`, type }));
    this.awards = { road: null, army: null };
    this.roadLen = {};

    const n = this.players.length;
    this.phase = 'setup';
    this.setup = { seq: [...Array(n).keys(), ...[...Array(n).keys()].reverse()], i: 0, step: 'settlement', last: null };
    this.turn = null;
    this.turnNo = 0;
    this.dice = null;
    this.trade = null;
    this.tradeSeq = 0;
    this.log = [];
    this.logSeq = 0;
    this.events = [];
    this.seq = 0;
    this.over = null;
    this.dead = false;
    this.timer = null;
    this.deadline = null;
    this.botTimer = null;
    this.botBusy = 0;

    this.addLog('story', '바람섬에 개척자들이 도착했습니다. 차례대로 첫 마을과 도로를 놓으세요.');
    this.arm();
  }

  // ───────────────────────── 기본 도우미

  pl(pid) { return this.players.find((p) => p.pid === pid); }
  cur() {
    if (this.phase === 'setup') return this.players[this.setup.seq[this.setup.i]];
    return this.turn ? this.pl(this.turn.pid) : null;
  }
  changed() { if (!this.dead) this.hooks.changed(); }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 80) this.events.shift();
  }
  addLog(kind, text) {
    this.log.push({ n: ++this.logSeq, kind, text });
    if (this.log.length > LOG_MAX) this.log.shift();
  }
  harborsOf(p) {
    return this.harbors.filter((h) => h.verts.some((v) => this.buildings[v] && this.buildings[v].pid === p.pid)).map((h) => h.type);
  }
  ratio(p, r) {
    const hs = this.harborsOf(p);
    if (hs.includes(r)) return 2;
    if (hs.includes('any')) return 3;
    return 4;
  }
  publicVP(p) {
    let vp = 0;
    for (const b of Object.values(this.buildings)) if (b.pid === p.pid) vp += b.type === 'city' ? 2 : 1;
    if (this.awards.road && this.awards.road.pid === p.pid) vp += 2;
    if (this.awards.army && this.awards.army.pid === p.pid) vp += 2;
    return vp;
  }
  totalVP(p) { return this.publicVP(p) + p.dev.filter((d) => d.type === 'vp').length; }

  pay(p, cost) {
    for (const r of RES) {
      const n = cost[r] || 0;
      p.res[r] -= n;
      this.bank[r] += n;
    }
  }

  // ───────────────────────── 자리 판정

  /** 거리 규칙: 그 꼭짓점과 이웃 꼭짓점에 건물이 없어야 한다 */
  vertexFree(v) {
    if (this.buildings[v]) return false;
    return !this.M.VERTS[v].adj.some((u) => this.buildings[u]);
  }
  canSettle(p, v, setup = false) {
    if (v == null || !this.M.VERTS[v] || !this.vertexFree(v)) return false;
    if (setup) return true;
    return this.M.VERTS[v].edges.some((e) => this.roads[e] === p.pid);
  }
  /** 도로는 내 건물이나 내 도로에 이어져야 한다 (남의 건물을 건너서는 안 됨) */
  canRoad(p, e, near = null) {
    if (e == null || !this.M.EDGES[e] || this.roads[e] != null) return false;
    const ends = [this.M.EDGES[e].a, this.M.EDGES[e].b];
    if (near != null) return ends.includes(near);
    return ends.some((v) => {
      const b = this.buildings[v];
      if (b && b.pid === p.pid) return true;
      if (b && b.pid !== p.pid) return false;
      return this.M.VERTS[v].edges.some((o) => o !== e && this.roads[o] === p.pid);
    });
  }
  canCity(p, v) {
    const b = this.buildings[v];
    return !!(b && b.pid === p.pid && b.type === 'settlement');
  }
  spots(p, kind) {
    if (kind === 'road') return this.M.EDGES.map((e) => e.id).filter((e) => this.canRoad(p, e));
    if (kind === 'settlement') return this.M.VERTS.map((v) => v.id).filter((v) => this.canSettle(p, v));
    if (kind === 'city') return this.M.VERTS.map((v) => v.id).filter((v) => this.canCity(p, v));
    return [];
  }

  // ───────────────────────── 최장 교역로 · 최강 기사단

  longestRoad(p) {
    const mine = this.M.EDGES.filter((e) => this.roads[e.id] === p.pid);
    if (!mine.length) return 0;
    const blocked = (v) => this.buildings[v] && this.buildings[v].pid !== p.pid;
    let best = 0;
    const used = new Set();
    const walk = (v, len) => {
      if (len > best) best = len;
      if (len > 0 && blocked(v)) return;
      for (const eid of this.M.VERTS[v].edges) {
        if (used.has(eid) || this.roads[eid] !== p.pid) continue;
        used.add(eid);
        const e = this.M.EDGES[eid];
        walk(e.a === v ? e.b : e.a, len + 1);
        used.delete(eid);
      }
    };
    const starts = new Set(mine.flatMap((e) => [e.a, e.b]));
    for (const v of starts) walk(v, 0);
    return best;
  }

  updateRoadAward() {
    for (const p of this.players) this.roadLen[p.pid] = this.longestRoad(p);
    const len = (p) => this.roadLen[p.pid];
    const holder = this.awards.road && this.pl(this.awards.road.pid);
    const max = Math.max(...this.players.map(len));
    const leaders = this.players.filter((p) => len(p) === max);
    let next = null;
    if (holder && len(holder) >= 5 && len(holder) === max) next = holder;
    else if (max >= 5 && leaders.length === 1) next = leaders[0];
    const before = holder ? holder.pid : null;
    this.awards.road = next ? { pid: next.pid, n: len(next) } : null;
    if ((next ? next.pid : null) !== before) {
      if (next) {
        this.addLog('win', `{p:${next.pid}} 최장 교역로 차지! (도로 ${len(next)}개, +2점)`);
        this.event({ type: 'award', kind: 'road', pid: next.pid });
      } else {
        this.addLog('move', '최장 교역로 주인이 사라졌습니다');
      }
    }
  }

  updateArmyAward(p) {
    const holder = this.awards.army;
    if (p.knights >= 3 && (!holder || (holder.pid !== p.pid && p.knights > holder.n))) {
      this.awards.army = { pid: p.pid, n: p.knights };
      this.addLog('win', `{p:${p.pid}} 최강 기사단 차지! (기사 ${p.knights}명, +2점)`);
      this.event({ type: 'award', kind: 'army', pid: p.pid });
    } else if (holder && holder.pid === p.pid) {
      holder.n = p.knights;
    }
  }

  checkWin() {
    if (this.phase !== 'play') return false;
    const p = this.cur();
    if (p && this.totalVP(p) >= I.WIN_VP) {
      this.finish(p);
      return true;
    }
    return false;
  }

  finish(p) {
    this.phase = 'over';
    this.trade = null;
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
    this.over = {
      winner: p.pid,
      scores: this.players.map((q) => ({ pid: q.pid, vp: this.totalVP(q), vpCards: q.dev.filter((d) => d.type === 'vp').length })),
    };
    this.addLog('win', `{p:${p.pid}} 승리! ${this.totalVP(p)}점으로 바람섬의 주인이 되었습니다`);
    this.event({ type: 'over', pid: p.pid });
    this.changed();
  }

  // ───────────────────────── 누가 무엇을 해야 하나

  needs() {
    if (this.phase === 'over') return [];
    if (this.phase === 'setup') {
      const p = this.cur();
      return [{ pid: p.pid, what: this.setup.step === 'settlement' ? 'setupSettlement' : 'setupRoad' }];
    }
    const t = this.turn;
    if (t.stage === 'discard') return Object.keys(t.discard).map((pid) => ({ pid, what: 'discard' }));
    return [{ pid: t.pid, what: t.stage }];
  }

  /** 다음 행동을 기다린다: 봇이면 스스로 두고, 사람은 제한 시간이 지나면 자동으로 처리 */
  arm() {
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
    if (this.dead || this.phase === 'over') return;
    const needs = this.needs();
    const stage = this.phase === 'setup' ? 'setup' : this.turn.stage;
    const humans = needs.filter((n) => !this.pl(n.pid).isBot);
    const bots = needs.filter((n) => this.pl(n.pid).isBot);

    if (humans.length) {
      const now = Date.now();
      const allOffline = humans.every((n) => !this.hooks.isOnline(n.pid));
      const key = `${stage}:${this.turnNo}:${this.setup.i}:${this.setup.step}`;
      if (this.deadlineKey !== key || !this.deadline) {
        this.deadline = now + (allOffline ? T_OFFLINE : T[stage]);
        this.deadlineKey = key;
        this.deadlineOffline = allOffline;
      } else if (allOffline && !this.deadlineOffline) {
        this.deadline = Math.min(this.deadline, now + T_OFFLINE);
        this.deadlineOffline = true;
      } else if (!allOffline && this.deadlineOffline) {
        this.deadline = now + T[stage];
        this.deadlineOffline = false;
      }
      this.timer = setTimeout(() => this.timeout(), Math.max(0, this.deadline - now));
    } else {
      this.deadline = null;
    }

    if (bots.length) {
      const delay = PACE === 0 ? 0 : (stage === 'main' ? 700 : 900) + rand(500);
      this.botTimer = setTimeout(() => this.botStep(bots[0].pid), delay * PACE);
    } else if (this.trade && this.phase === 'play') {
      const waiting = Object.entries(this.trade.responses).filter(([pid, v]) => v === null && this.pl(pid).isBot);
      if (waiting.length) this.botTimer = setTimeout(() => this.botRespond(waiting[0][0]), (PACE === 0 ? 0 : 900 + rand(700)) * PACE);
    }
  }

  onPresence() {
    this.arm();
    this.changed();
  }

  timeout() {
    if (this.dead || this.phase === 'over') return;
    for (const n of this.needs()) {
      const p = this.pl(n.pid);
      if (p.isBot) continue;
      const a = n.what === 'main' ? { type: 'end' } : this.botDecide(p, n.what);
      const r = this.apply(p, a, true);
      if (!r.ok) console.error('[자동 처리 실패]', n.what, r.error);
      if (this.phase === 'over') return;
    }
    this.deadline = null;
    this.deadlineKey = null;
    this.arm();
    this.changed();
  }

  // ───────────────────────── 행동

  /** 소켓에서 들어온 사람의 행동 */
  act(pid, a) {
    if (this.dead) return err('게임이 끝났습니다');
    const p = this.pl(pid);
    if (!p) return err('참가자가 아닙니다');
    if (!a || typeof a !== 'object') return err('잘못된 요청입니다');
    const r = this.apply(p, a, false);
    if (r.ok) {
      this.arm();
      this.changed();
    }
    return r;
  }

  apply(p, a, auto) {
    if (this.phase === 'over') return err('게임이 끝났습니다');
    // 거래 응답은 차례와 상관없이
    if (a.type === 'respond') return this.respond(p, a);

    const needs = this.needs();
    const mine = needs.find((n) => n.pid === p.pid);
    if (!mine) return err('지금은 당신 차례가 아닙니다');

    switch (mine.what) {
      case 'setupSettlement': return a.type === 'settle' ? this.setupSettle(p, a.v) : err('마을 자리를 고르세요');
      case 'setupRoad': return a.type === 'road' ? this.setupRoad(p, a.e) : err('도로 자리를 고르세요');
      case 'discard': return a.type === 'discard' ? this.discard(p, a.cards) : err('버릴 카드를 고르세요');
      case 'robber': return a.type === 'robber' ? this.moveRobber(p, a.hex) : err('도적을 옮길 칸을 고르세요');
      case 'steal': return a.type === 'steal' ? this.steal(p, a.target) : err('빼앗을 사람을 고르세요');
      case 'roads':
        if (a.type === 'road') return this.freeRoad(p, a.e);
        if (a.type === 'end') return this.endFreeRoads(p);
        return err('도로를 놓으세요');
      case 'roll':
        if (a.type === 'roll') return this.roll(p);
        if (a.type === 'playDev') return this.playDev(p, a);
        return err('먼저 주사위를 굴리세요');
      case 'main':
        switch (a.type) {
          case 'build': return this.build(p, a.kind, a.at);
          case 'buyDev': return this.buyDev(p);
          case 'playDev': return this.playDev(p, a);
          case 'bank': return this.bankTrade(p, a.give, a.get);
          case 'offer': return this.offer(p, a.give, a.get);
          case 'confirm': return this.confirm(p, a.tradeId, a.with);
          case 'cancelOffer': this.trade = null; return ok();
          case 'end': return this.endTurn(p);
          default: return err('할 수 없는 행동입니다');
        }
      default:
        return err('할 수 없는 행동입니다');
    }
  }

  // ── 처음 배치

  setupSettle(p, v) {
    if (!this.canSettle(p, v, true)) return err('여기는 마을을 지을 수 없어요 (다른 마을과 두 칸 이상 떨어져야 해요)');
    this.buildings[v] = { pid: p.pid, type: 'settlement' };
    p.left.settlement--;
    this.setup.last = v;
    this.setup.step = 'road';
    this.event({ type: 'build', pid: p.pid, kind: 'settlement', at: v });
    const second = this.setup.i >= this.players.length;
    if (second) {
      const got = I.emptyRes();
      for (const h of this.M.VERTS[v].hexes) {
        const r = I.TERRAIN[this.hexes[h].terrain].res;
        if (r && this.bank[r] > 0) { got[r]++; p.res[r]++; this.bank[r]--; }
      }
      this.addLog('build', `{p:${p.pid}} 두 번째 마을 건설, 시작 자원 ${fmtRes(got) || '없음'}`);
      if (I.total(got)) this.event({ type: 'produce', gains: { [p.pid]: got } });
    } else {
      this.addLog('build', `{p:${p.pid}} 첫 마을 건설`);
    }
    return ok();
  }

  setupRoad(p, e) {
    if (!this.canRoad(p, e, this.setup.last)) return err('방금 지은 마을에 붙여서 도로를 놓으세요');
    this.roads[e] = p.pid;
    p.left.road--;
    this.event({ type: 'build', pid: p.pid, kind: 'road', at: e });
    this.setup.step = 'settlement';
    this.setup.last = null;
    this.setup.i++;
    if (this.setup.i >= this.setup.seq.length) {
      this.phase = 'play';
      this.addLog('story', '모든 개척자가 자리를 잡았습니다. 게임 시작!');
      this.startTurn(this.players[0]);
    }
    return ok();
  }

  // ── 차례

  startTurn(p) {
    this.turnNo++;
    this.trade = null;
    this.dice = null;
    this.turn = { pid: p.pid, stage: 'roll', rolled: false, devPlayed: false, discard: {}, stealFrom: [], returnTo: null, freeRoads: 0, no: this.turnNo, bankTrades: 0, actions: 0 };
    this.addLog('turn', `── {p:${p.pid}}의 차례 ──`);
    this.event({ type: 'turn', pid: p.pid });
  }

  roll(p) {
    const a = 1 + rand(6);
    const b = 1 + rand(6);
    const n = a + b;
    this.dice = [a, b];
    this.turn.rolled = true;
    this.event({ type: 'dice', pid: p.pid, a, b });
    this.addLog('dice', `{p:${p.pid}} 주사위 ${a} + ${b} = {n:${n}}`);
    if (n === 7) {
      for (const q of this.players) {
        const c = I.total(q.res);
        if (c > 7) this.turn.discard[q.pid] = Math.floor(c / 2);
      }
      if (Object.keys(this.turn.discard).length) {
        this.turn.stage = 'discard';
        this.addLog('bad', `7! 카드가 8장 이상인 사람은 절반을 버려야 합니다`);
      } else {
        this.turn.stage = 'robber';
      }
      this.turn.returnTo = 'main';
      return ok();
    }
    this.produce(n);
    this.turn.stage = 'main';
    return ok();
  }

  produce(n) {
    const want = {};          // res → pid → 수량
    for (const h of this.M.HEXES) {
      const tile = this.hexes[h.id];
      if (tile.number !== n || h.id === this.robber) continue;
      const r = I.TERRAIN[tile.terrain].res;
      for (const v of h.verts) {
        const b = this.buildings[v];
        if (!b) continue;
        want[r] = want[r] || {};
        want[r][b.pid] = (want[r][b.pid] || 0) + (b.type === 'city' ? 2 : 1);
      }
    }
    const gains = {};
    for (const [r, byPid] of Object.entries(want)) {
      const need = Object.values(byPid).reduce((s, x) => s + x, 0);
      const owners = Object.keys(byPid);
      if (need > this.bank[r] && owners.length > 1) {
        this.addLog('bad', `은행에 {x:${r}}이 모자라 아무도 받지 못했습니다`);
        continue;
      }
      for (const pid of owners) {
        const give = Math.min(byPid[pid], this.bank[r]);
        if (!give) continue;
        this.bank[r] -= give;
        this.pl(pid).res[r] += give;
        gains[pid] = gains[pid] || I.emptyRes();
        gains[pid][r] += give;
      }
    }
    for (const [pid, g] of Object.entries(gains)) this.addLog('good', `{p:${pid}} 생산 ${fmtRes(g)}`);
    if (!Object.keys(gains).length) this.addLog('move', '이번 숫자로는 아무것도 생산되지 않았습니다');
    this.event({ type: 'produce', n, gains });
  }

  discard(p, cards) {
    const need = this.turn.discard[p.pid];
    if (!cards || typeof cards !== 'object') return err('버릴 카드를 고르세요');
    const c = I.emptyRes();
    for (const r of RES) c[r] = Math.max(0, Math.floor(Number(cards[r]) || 0));
    if (I.total(c) !== need) return err(`정확히 ${need}장을 골라야 해요`);
    if (!I.canPay(p.res, c)) return err('가진 것보다 많이 버릴 수 없어요');
    this.pay(p, c);
    delete this.turn.discard[p.pid];
    this.addLog('bad', `{p:${p.pid}} 카드 ${need}장을 버렸습니다`);
    this.event({ type: 'discard', pid: p.pid, n: need });
    if (!Object.keys(this.turn.discard).length) this.turn.stage = 'robber';
    return ok();
  }

  moveRobber(p, hex) {
    hex = Number(hex);
    if (!Number.isInteger(hex) || !this.M.HEXES[hex]) return err('칸을 고르세요');
    if (hex === this.robber) return err('도적은 다른 칸으로 옮겨야 해요');
    this.robber = hex;
    this.event({ type: 'robber', pid: p.pid, hex });
    this.addLog('bad', `{p:${p.pid}} 도적을 {h:${hex}}(으)로 옮겼습니다`);
    const victims = [...new Set(this.M.HEXES[hex].verts.map((v) => this.buildings[v]).filter(Boolean).map((b) => b.pid))]
      .filter((pid) => pid !== p.pid && I.total(this.pl(pid).res) > 0);
    if (victims.length === 1) return this.doSteal(p, victims[0]);
    if (victims.length > 1) {
      this.turn.stealFrom = victims;
      this.turn.stage = 'steal';
      return ok();
    }
    this.turn.stage = this.turn.returnTo || 'main';
    return ok();
  }

  steal(p, target) {
    if (!this.turn.stealFrom.includes(target)) return err('빼앗을 사람을 고르세요');
    return this.doSteal(p, target);
  }

  doSteal(p, target) {
    const q = this.pl(target);
    const bag = RES.flatMap((r) => Array(q.res[r]).fill(r));
    if (bag.length) {
      const r = bag[rand(bag.length)];
      q.res[r]--;
      p.res[r]++;
      this.event({ type: 'steal', from: q.pid, to: p.pid, res: r, vis: [p.pid, q.pid] });
      this.addLog('bad', `{p:${p.pid}} {p:${q.pid}}에게서 자원 1장을 빼앗았습니다`);
    }
    this.turn.stealFrom = [];
    this.turn.stage = this.turn.returnTo || 'main';
    return ok();
  }

  build(p, kind, at) {
    at = Number(at);
    if (!['road', 'settlement', 'city'].includes(kind)) return err('무엇을 지을지 고르세요');
    if (p.left[kind] <= 0) return err(`${I.BUILD_NAME[kind]} 말이 더 없어요`);
    if (!I.canPay(p.res, COST[kind])) return err(`${I.BUILD_NAME[kind]}을(를) 지을 자원이 부족해요`);
    if (kind === 'road') {
      if (!this.canRoad(p, at)) return err('여기는 도로를 놓을 수 없어요 (내 도로나 건물에 이어져야 해요)');
      this.pay(p, COST.road);
      this.roads[at] = p.pid;
      p.left.road--;
    } else if (kind === 'settlement') {
      if (!this.canSettle(p, at)) return err('여기는 마을을 지을 수 없어요 (내 도로에 닿고, 다른 건물과 두 칸 떨어져야 해요)');
      this.pay(p, COST.settlement);
      this.buildings[at] = { pid: p.pid, type: 'settlement' };
      p.left.settlement--;
    } else {
      if (!this.canCity(p, at)) return err('내 마을 위에만 도시를 지을 수 있어요');
      this.pay(p, COST.city);
      this.buildings[at] = { pid: p.pid, type: 'city' };
      p.left.city--;
      p.left.settlement++;
    }
    this.event({ type: 'build', pid: p.pid, kind, at });
    this.addLog('build', `{p:${p.pid}} ${I.BUILD_NAME[kind]} 건설`);
    this.updateRoadAward();
    this.checkWin();
    return ok();
  }

  freeRoad(p, e) {
    if (p.left.road <= 0) return this.endFreeRoads(p);
    if (!this.canRoad(p, e)) return err('여기는 도로를 놓을 수 없어요');
    this.roads[e] = p.pid;
    p.left.road--;
    this.turn.freeRoads--;
    this.event({ type: 'build', pid: p.pid, kind: 'road', at: e });
    this.addLog('build', `{p:${p.pid}} 도로 건설 카드로 도로를 놓았습니다`);
    this.updateRoadAward();
    if (this.checkWin()) return ok();
    if (this.turn.freeRoads <= 0 || p.left.road <= 0 || !this.spots(p, 'road').length) return this.endFreeRoads(p);
    return ok();
  }

  endFreeRoads() {
    this.turn.freeRoads = 0;
    this.turn.stage = this.turn.returnTo || 'main';
    return ok();
  }

  buyDev(p) {
    if (!this.devDeck.length) return err('발전 카드가 다 떨어졌어요');
    if (!I.canPay(p.res, COST.dev)) return err('발전 카드를 살 자원이 부족해요');
    this.pay(p, COST.dev);
    const card = this.devDeck.pop();
    p.dev.push({ ...card, turn: this.turnNo });
    this.event({ type: 'buyDev', pid: p.pid, card, vis: [p.pid] });
    this.addLog('build', `{p:${p.pid}} 발전 카드를 샀습니다`);
    this.checkWin();
    return ok();
  }

  playDev(p, a) {
    const card = p.dev.find((d) => d.id === a.card);
    if (!card) return err('가진 카드가 아닙니다');
    if (card.type === 'vp') return err('승리 점수 카드는 내지 않아도 점수가 됩니다');
    if (this.turn.devPlayed) return err('발전 카드는 차례마다 1장만 낼 수 있어요');
    if (card.turn === this.turnNo) return err('이번 차례에 산 카드는 다음 차례부터 낼 수 있어요');
    if (this.turn.stage === 'roll' && card.type !== 'knight' && !this.turn.rolled) {
      // 규칙상 굴리기 전에도 낼 수 있지만, 헷갈리지 않게 기사만 허용
      return err('주사위를 굴리기 전에는 기사 카드만 낼 수 있어요');
    }
    const info = I.DEV[card.type];
    if (card.type === 'plenty') {
      const picks = [a.res, a.res2];
      if (!picks.every((r) => RES.includes(r))) return err('가져올 자원 2개를 고르세요');
      const need = I.emptyRes();
      for (const r of picks) need[r]++;
      if (!RES.every((r) => this.bank[r] >= need[r])) return err('은행에 그 자원이 모자라요');
      for (const r of picks) { this.bank[r]--; p.res[r]++; }
      this.addLog('dev', `{p:${p.pid}} {d:plenty} → ${fmtRes(need)}`);
    } else if (card.type === 'monopoly') {
      if (!RES.includes(a.res)) return err('자원 하나를 고르세요');
      let got = 0;
      for (const q of this.players) {
        if (q === p) continue;
        got += q.res[a.res];
        p.res[a.res] += q.res[a.res];
        q.res[a.res] = 0;
      }
      this.addLog('dev', `{p:${p.pid}} {d:monopoly} → 모두의 {x:${a.res}} ${got}장을 가져갔습니다`);
    } else if (card.type === 'roads') {
      if (p.left.road <= 0 || !this.spots(p, 'road').length) return err('놓을 수 있는 도로 자리가 없어요');
      this.turn.freeRoads = Math.min(2, p.left.road);
      this.turn.returnTo = this.turn.rolled ? 'main' : 'roll';
      this.turn.stage = 'roads';
      this.addLog('dev', `{p:${p.pid}} {d:roads}`);
    } else if (card.type === 'knight') {
      p.knights++;
      this.turn.returnTo = this.turn.rolled ? 'main' : 'roll';
      this.turn.stage = 'robber';
      this.addLog('dev', `{p:${p.pid}} {d:knight} (기사 ${p.knights}명)`);
      this.updateArmyAward(p);
    }
    p.dev = p.dev.filter((d) => d !== card);
    this.turn.devPlayed = true;
    this.event({ type: 'playDev', pid: p.pid, card: card.type });
    this.checkWin();
    return ok({ name: info.name });
  }

  bankTrade(p, give, get) {
    if (!RES.includes(give) || !RES.includes(get) || give === get) return err('줄 자원과 받을 자원을 고르세요');
    const n = this.ratio(p, give);
    if (p.res[give] < n) return err(`${resName(give)} ${n}장이 필요해요`);
    if (this.bank[get] <= 0) return err(`은행에 ${resName(get)}이(가) 없어요`);
    p.res[give] -= n;
    this.bank[give] += n;
    p.res[get]++;
    this.bank[get]--;
    this.turn.bankTrades++;
    this.event({ type: 'bank', pid: p.pid, give, get, n });
    this.addLog('trade', `{p:${p.pid}} 은행 교환 {x:${give}}×${n} → {x:${get}}×1`);
    return ok();
  }

  cleanRes(m) {
    const c = I.emptyRes();
    if (!m || typeof m !== 'object') return c;
    for (const r of RES) c[r] = Math.max(0, Math.min(19, Math.floor(Number(m[r]) || 0)));
    return c;
  }

  offer(p, give, get) {
    const g = this.cleanRes(give);
    const w = this.cleanRes(get);
    if (!I.total(g) || !I.total(w)) return err('주는 것과 받는 것을 하나 이상 정하세요');
    if (RES.some((r) => g[r] && w[r])) return err('같은 자원을 주고받을 수는 없어요');
    if (!I.canPay(p.res, g)) return err('가진 것보다 많이 줄 수 없어요');
    const responses = {};
    for (const q of this.players) if (q !== p) responses[q.pid] = null;
    this.trade = { id: ++this.tradeSeq, from: p.pid, give: g, get: w, responses };
    this.addLog('trade', `{p:${p.pid}} 거래 제안: ${fmtRes(g)} ↔ ${fmtRes(w)}`);
    this.event({ type: 'offer', pid: p.pid });
    return ok();
  }

  respond(p, a) {
    const t = this.trade;
    if (!t || t.id !== a.tradeId) return err('이미 끝난 거래입니다');
    if (!(p.pid in t.responses)) return err('이 거래에 응답할 수 없어요');
    if (a.accept && !I.canPay(p.res, t.get)) return err('상대가 원하는 자원이 부족해요');
    t.responses[p.pid] = a.accept ? 'accept' : 'decline';
    this.addLog('trade', `{p:${p.pid}} ${a.accept ? '거래 수락' : '거래 거절'}`);
    this.arm();
    this.changed();
    return ok();
  }

  confirm(p, tradeId, withPid) {
    const t = this.trade;
    if (!t || t.id !== tradeId || t.from !== p.pid) return err('이미 끝난 거래입니다');
    if (t.responses[withPid] !== 'accept') return err('수락한 사람과만 거래할 수 있어요');
    const q = this.pl(withPid);
    if (!I.canPay(p.res, t.give)) return err('줄 자원이 부족해요');
    if (!I.canPay(q.res, t.get)) return err('상대의 자원이 부족해져서 거래할 수 없어요');
    for (const r of RES) {
      p.res[r] += t.get[r] - t.give[r];
      q.res[r] += t.give[r] - t.get[r];
    }
    this.event({ type: 'trade', a: p.pid, b: q.pid, give: t.give, get: t.get });
    this.addLog('trade', `{p:${p.pid}} ↔ {p:${q.pid}} 거래 성사: ${fmtRes(t.give)} ↔ ${fmtRes(t.get)}`);
    this.trade = null;
    return ok();
  }

  endTurn(p) {
    const i = this.players.indexOf(p);
    this.startTurn(this.players[(i + 1) % this.players.length]);
    return ok();
  }

  // ───────────────────────── 봇

  scoreVertex(p, v) {
    const seen = new Set(RES.filter((r) => p && Object.values(this.buildings).some((b) => b.pid === p.pid)
      && this.M.VERTS.some((u) => this.buildings[u.id] && this.buildings[u.id].pid === p.pid && u.hexes.some((h) => I.TERRAIN[this.hexes[h].terrain].res === r))));
    let s = 0;
    const kinds = new Set();
    for (const h of this.M.VERTS[v].hexes) {
      const t = this.hexes[h];
      const r = I.TERRAIN[t.terrain].res;
      if (!r) continue;
      const w = { wood: 1, brick: 1, sheep: 0.85, wheat: 1.15, ore: 1.1 }[r];
      s += I.pips(t.number) * w * (h === this.robber ? 0.4 : 1) * (seen.has(r) ? 0.85 : 1.1);
      kinds.add(r);
    }
    s += kinds.size * 1.2;
    const hb = this.harbors.find((x) => x.verts.includes(v));
    if (hb) s += hb.type === 'any' ? 1 : 1.5;
    return s;
  }

  bestSpot(p, list) {
    let best = null;
    let bs = -1;
    for (const v of list) {
      const s = this.scoreVertex(p, v) + Math.random() * 0.3;
      if (s > bs) { bs = s; best = v; }
    }
    return best;
  }

  /** 도로 한 칸이 좋은 마을 자리에 얼마나 가까워지게 하나 */
  roadTarget(p, candidates) {
    let best = null;
    let bs = -Infinity;
    for (const e of candidates) {
      const E = this.M.EDGES[e];
      let s = -1;
      for (const v of [E.a, E.b]) {
        if (this.vertexFree(v)) s = Math.max(s, this.scoreVertex(p, v));
        for (const u of this.M.VERTS[v].adj) if (this.vertexFree(u)) s = Math.max(s, this.scoreVertex(p, u) * 0.7);
      }
      s += Math.random() * 0.5;
      if (s > bs) { bs = s; best = e; }
    }
    return best;
  }

  /** 지금 모아야 할 목표 건물 */
  goal(p) {
    if (p.left.city > 0 && this.spots(p, 'city').length && (p.res.ore >= 1 || p.res.wheat >= 2)) return 'city';
    if (p.left.settlement > 0 && this.spots(p, 'settlement').length) return 'settlement';
    if (p.left.road > 0 && this.spots(p, 'road').length && p.left.settlement > 0) return 'road';
    if (this.devDeck.length) return 'dev';
    return 'city';
  }

  missing(p, kind) {
    const c = COST[kind];
    const m = I.emptyRes();
    for (const r of RES) m[r] = Math.max(0, (c[r] || 0) - p.res[r]);
    return m;
  }

  botDecide(p, what) {
    switch (what) {
      case 'setupSettlement': {
        const list = this.M.VERTS.map((v) => v.id).filter((v) => this.canSettle(p, v, true));
        return { type: 'settle', v: this.bestSpot(p, list) };
      }
      case 'setupRoad': {
        const list = this.M.VERTS[this.setup.last].edges.filter((e) => this.canRoad(p, e, this.setup.last));
        return { type: 'road', e: this.roadTarget(p, list) };
      }
      case 'discard': {
        let need = this.turn.discard[p.pid];
        const keep = { ...p.res };
        const out = I.emptyRes();
        const g = this.goal(p);
        const want = COST[g] || {};
        while (need > 0) {
          const r = RES.filter((x) => keep[x] > 0)
            .sort((x, y) => (keep[y] - (want[y] || 0)) - (keep[x] - (want[x] || 0)))[0];
          keep[r]--;
          out[r]++;
          need--;
        }
        return { type: 'discard', cards: out };
      }
      case 'robber': {
        let best = null;
        let bs = -Infinity;
        for (const h of this.M.HEXES) {
          if (h.id === this.robber) continue;
          const t = this.hexes[h.id];
          let s = 0;
          for (const v of h.verts) {
            const b = this.buildings[v];
            if (!b) continue;
            const w = (b.type === 'city' ? 2 : 1) * I.pips(t.number);
            if (b.pid === p.pid) s -= w * 3;
            else s += w * (1 + this.publicVP(this.pl(b.pid)) / 4) + (I.total(this.pl(b.pid).res) ? 1 : 0);
          }
          s += Math.random() * 0.5;
          if (s > bs) { bs = s; best = h.id; }
        }
        return { type: 'robber', hex: best };
      }
      case 'steal': {
        const t = [...this.turn.stealFrom].sort((x, y) => this.publicVP(this.pl(y)) - this.publicVP(this.pl(x))
          || I.total(this.pl(y).res) - I.total(this.pl(x).res))[0];
        return { type: 'steal', target: t };
      }
      case 'roads': {
        const list = this.spots(p, 'road');
        return list.length ? { type: 'road', e: this.roadTarget(p, list) } : { type: 'end' };
      }
      case 'roll': {
        const knight = p.dev.find((d) => d.type === 'knight' && d.turn !== this.turnNo);
        const robbed = this.M.HEXES[this.robber].verts.some((v) => this.buildings[v] && this.buildings[v].pid === p.pid);
        if (knight && !this.turn.devPlayed && robbed) return { type: 'playDev', card: knight.id };
        return { type: 'roll' };
      }
      case 'main':
        return this.botMain(p);
      default:
        return { type: 'end' };
    }
  }

  botMain(p) {
    const t = this.turn;
    if (t.actions > 40) return { type: 'end' };
    const can = (k) => I.canPay(p.res, COST[k]) && (k === 'dev' ? this.devDeck.length > 0 : p.left[k] > 0);

    if (can('city')) {
      const list = this.spots(p, 'city');
      if (list.length) return { type: 'build', kind: 'city', at: this.bestSpot(p, list) };
    }
    if (can('settlement')) {
      const list = this.spots(p, 'settlement');
      if (list.length) return { type: 'build', kind: 'settlement', at: this.bestSpot(p, list) };
    }
    // 발전 카드 쓰기
    if (!t.devPlayed) {
      const usable = p.dev.filter((d) => d.turn !== this.turnNo && d.type !== 'vp');
      const knight = usable.find((d) => d.type === 'knight');
      const army = this.awards.army;
      if (knight && (p.knights + 1 >= 3 && (!army || (army.pid !== p.pid && p.knights + 1 > army.n)))) return { type: 'playDev', card: knight.id };
      const plenty = usable.find((d) => d.type === 'plenty');
      if (plenty) {
        const m = this.missing(p, this.goal(p) === 'road' ? 'settlement' : this.goal(p));
        const picks = RES.flatMap((r) => Array(m[r]).fill(r)).filter((r) => this.bank[r] > 0);
        if (picks.length) return { type: 'playDev', card: plenty.id, res: picks[0], res2: picks[1] || picks[0] };
      }
      const roads = usable.find((d) => d.type === 'roads');
      if (roads && p.left.road >= 2 && !this.spots(p, 'settlement').length && this.spots(p, 'road').length) return { type: 'playDev', card: roads.id };
      const mono = usable.find((d) => d.type === 'monopoly');
      if (mono && Math.random() < 0.5) {
        const r = this.goal(p) === 'city' ? 'ore' : 'wheat';
        return { type: 'playDev', card: mono.id, res: r };
      }
      if (knight && Math.random() < 0.35) return { type: 'playDev', card: knight.id };
    }
    // 도로
    if (can('road') && !this.spots(p, 'settlement').length) {
      const list = this.spots(p, 'road');
      const roads = Object.values(this.roads).filter((x) => x === p.pid).length;
      if (list.length && (p.left.settlement > 0 || roads < 13)) return { type: 'build', kind: 'road', at: this.roadTarget(p, list) };
    }
    if (can('dev') && (p.left.settlement === 0 || !this.spots(p, 'settlement').length || I.total(p.res) > 6)) return { type: 'buyDev' };
    // 은행 교환으로 목표 채우기
    if (t.bankTrades < 3) {
      const g = this.goal(p);
      const kind = g === 'road' ? 'road' : g;
      const m = this.missing(p, kind);
      const cost = COST[kind];
      const need = RES.filter((r) => m[r] > 0 && this.bank[r] > 0);
      if (need.length) {
        for (const r of RES) {
          const spare = p.res[r] - (cost[r] || 0);
          if (spare >= this.ratio(p, r)) return { type: 'bank', give: r, get: need[0] };
        }
      }
    }
    return { type: 'end' };
  }

  botStep(pid) {
    if (this.dead || this.phase === 'over') return;
    const p = this.pl(pid);
    const n = this.needs().find((x) => x.pid === pid);
    if (!p || !n) return this.arm();
    // 사람의 거래 제안이 열려 있으면 봇 차례에 쓰지 않는다
    const a = this.botDecide(p, n.what);
    if (this.turn) this.turn.actions++;
    let r = this.apply(p, a, true);
    if (!r.ok) {
      // 판단이 규칙에 어긋나면 안전하게 넘긴다
      console.error('[봇 행동 실패]', n.what, a, r.error);
      const fallback = n.what === 'main' || n.what === 'roads' ? { type: 'end' } : this.botDecide(p, n.what);
      r = this.apply(p, fallback, true);
      if (!r.ok && n.what !== 'main') {
        // 그래도 안 되면 첫 번째로 가능한 선택
        if (n.what === 'robber') this.apply(p, { type: 'robber', hex: this.M.HEXES.find((h) => h.id !== this.robber).id }, true);
      }
    }
    this.arm();
    this.changed();
  }

  botRespond(pid) {
    const t = this.trade;
    if (!t || this.dead) return;
    const p = this.pl(pid);
    const from = this.pl(t.from);
    let accept = I.canPay(p.res, t.get);
    if (accept) {
      const g = this.goal(p);
      const cost = COST[g] || {};
      const helps = RES.some((r) => t.give[r] && p.res[r] < (cost[r] || 0));
      const spare = RES.every((r) => !t.get[r] || p.res[r] - t.get[r] >= (cost[r] || 0));
      const fair = I.total(t.give) >= I.total(t.get);
      accept = helps && spare && fair && this.totalVP(from) < 8 && Math.random() < 0.85;
    }
    t.responses[pid] = accept ? 'accept' : 'decline';
    this.addLog('trade', `{p:${pid}} ${accept ? '거래 수락' : '거래 거절'}`);
    this.arm();
    this.changed();
  }

  // ───────────────────────── 화면용 데이터

  viewFor(pid) {
    const me = this.pl(pid);
    const over = this.phase === 'over';
    const needs = this.needs();
    return {
      id: this.id,
      map: this.mapId,
      phase: this.phase,
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, color: p.color, seat: p.seat,
        online: p.isBot || this.hooks.isOnline(p.pid),
        cards: I.total(p.res), devCount: p.dev.length, knights: p.knights, left: p.left,
        vp: over || p.pid === pid ? this.totalVP(p) : this.publicVP(p),
        road: this.roadLen[p.pid] || 0,
        ratios: p.pid === pid ? Object.fromEntries(RES.map((r) => [r, this.ratio(p, r)])) : null,
      })),
      me: me ? { pid, res: me.res, dev: me.dev.map((d) => ({ id: d.id, type: d.type, fresh: d.turn === this.turnNo })) } : null,
      board: { hexes: this.hexes, harbors: this.harbors, robber: this.robber, buildings: this.buildings, roads: this.roads },
      bank: this.bank,
      devLeft: this.devDeck.length,
      awards: this.awards,
      setup: this.phase === 'setup' ? { pid: this.cur().pid, step: this.setup.step, last: this.setup.last, round: this.setup.i < this.players.length ? 1 : 2 } : null,
      turn: this.turn && {
        pid: this.turn.pid, stage: this.turn.stage, rolled: this.turn.rolled, devPlayed: this.turn.devPlayed,
        discard: this.turn.discard, stealFrom: this.turn.stealFrom, freeRoads: this.turn.freeRoads, no: this.turn.no,
      },
      dice: this.dice,
      trade: this.trade,
      needs,
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      log: this.log,
      events: this.events.map((e) => (!e.vis || e.vis.includes(pid) ? e : { ...e, res: null, card: null, hidden: true })),
      over: this.over,
    };
  }

  /** 자원·말 개수가 어긋나지 않았는지 (시뮬레이션 검사용) */
  audit() {
    const sum = { ...this.bank };
    for (const p of this.players) for (const r of RES) sum[r] += p.res[r];
    const bad = RES.filter((r) => sum[r] !== this.M.BANK_EACH);
    const neg = this.players.some((p) => RES.some((r) => p.res[r] < 0)) || RES.some((r) => this.bank[r] < 0);
    const pieces = this.players.every((p) => {
      const s = Object.values(this.buildings).filter((b) => b.pid === p.pid && b.type === 'settlement').length;
      const c = Object.values(this.buildings).filter((b) => b.pid === p.pid && b.type === 'city').length;
      const rd = Object.values(this.roads).filter((x) => x === p.pid).length;
      return s + p.left.settlement === PIECES.settlement && c + p.left.city === PIECES.city && rd + p.left.road === PIECES.road;
    });
    return { bad, neg, pieces };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
  }
}

Game.setPace = (v) => { PACE = v; };
module.exports = Game;
