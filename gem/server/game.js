'use strict';
// 찬란한 보석상 - 규칙 엔진 (서버가 판정) + AI
const crypto = require('crypto');
const G = require('../public/shared/gem');

const { COLORS, CARD, NOBLE } = G;
const { dehydrate, rebuild } = require('../../hub/persist');
let PACE = 1;
const TURN_MS = 90000;
const DISCARD_MS = 30000;
const T_OFFLINE = 8000;

const rand = (n) => crypto.randomInt(n);
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const ok = (x = {}) => ({ ok: true, ...x });
const err = (error) => ({ ok: false, error });

class Game {
  constructor(seats, hooks) {
    this.id = crypto.randomBytes(4).toString('hex');
    this.hooks = hooks;
    const n = seats.length;
    this.players = seats.map((s, i) => ({
      pid: s.pid, name: s.name, isBot: s.isBot, seat: i,
      gems: G.emptyGems(true), cards: [], reserved: [], nobles: [],
    }));
    const tc = G.tokenCount(n);
    this.bank = { ...Object.fromEntries(COLORS.map((c) => [c, tc])), gold: G.GOLD_COUNT };
    this.decks = { 1: [], 2: [], 3: [] };
    for (const c of shuffle(G.CARDS.slice())) this.decks[c.tier].push(c.id);
    this.market = { 1: [], 2: [], 3: [] };
    for (const t of [1, 2, 3]) for (let i = 0; i < 4; i++) this.market[t].push(this.decks[t].pop());
    this.nobles = shuffle(G.NOBLES.map((x) => x.id)).slice(0, n + 1);
    this.turn = 0;             // players 인덱스
    this.round = 1;
    this.stage = 'act';        // act | discard | noble
    this.pendingNobles = [];
    this.finalRound = false;
    this.phase = 'play';
    this.over = null;
    this.events = [];
    this.seq = 0;
    this.log = [];
    this.dead = false;
    this.addLog(`${this.cur().name}님부터 시작합니다. 먼저 ${G.WIN_POINTS}점을 모으세요!`);
    this.arm();
  }

  cur() { return this.players[this.turn]; }
  pl(pid) { return this.players.find((p) => p.pid === pid); }
  bonus(p) {
    const b = G.emptyGems();
    for (const id of p.cards) b[CARD[id].bonus]++;
    return b;
  }
  points(p) {
    return p.cards.reduce((s, id) => s + CARD[id].points, 0) + p.nobles.length * 3;
  }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 40) this.events.shift();
  }
  addLog(text) {
    this.log.push(text);
    if (this.log.length > 80) this.log.shift();
  }
  changed() { if (!this.dead) this.hooks.changed(); }

  /* ── 시간 · AI */
  arm() {
    clearTimeout(this.timer);
    if (this.phase !== 'play') return;
    const p = this.cur();
    const auto = p.isBot || !this.hooks.isOnline(p.pid);
    const ms = p.isBot ? 900 + rand(900) : auto ? T_OFFLINE : this.stage === 'act' ? TURN_MS : DISCARD_MS;
    this.deadline = Date.now() + ms * PACE;
    this.deadlineTotal = ms * PACE;
    this.timer = setTimeout(() => {
      if (this.dead) return;
      try {
        const r = this.botStep(p);
        if (r && !r.ok && this.stage === 'act') this.endTurn(p);
      } catch (e) { console.error('[보석상 AI 오류]', e); }
      this.arm();
      this.changed();
    }, ms * PACE);
  }
  onPresence() { this.arm(); this.changed(); }

  /* ── 행동 */
  act(pid, a) {
    if (this.phase !== 'play') return err('게임이 끝났습니다');
    const p = this.pl(pid);
    if (!p) return err('게임 참가자가 아닙니다');
    if (p !== this.cur()) return err('내 차례가 아닙니다');
    if (!a || typeof a.type !== 'string') return err('잘못된 요청입니다');
    let r;
    if (this.stage === 'discard') r = a.type === 'discard' ? this.discard(p, a.gems) : err('보석을 10개로 줄여야 해요');
    else if (this.stage === 'noble') r = a.type === 'noble' ? this.takeNoble(p, a.id) : err('찾아올 귀족을 고르세요');
    else if (a.type === 'take') r = this.take(p, a.gems);
    else if (a.type === 'reserve') r = this.reserve(p, a);
    else if (a.type === 'buy') r = this.buy(p, a.card);
    else r = err('알 수 없는 행동입니다');
    if (r.ok) { this.arm(); this.changed(); }
    return r;
  }

  take(p, gems) {
    if (!gems || typeof gems !== 'object') return err('가져올 보석을 고르세요');
    const picks = COLORS.filter((c) => gems[c] > 0);
    const n = picks.reduce((s, c) => s + gems[c], 0);
    if (Object.keys(gems).some((k) => !COLORS.includes(k) && gems[k])) return err('황금은 예약할 때만 받아요');
    const avail = COLORS.filter((c) => this.bank[c] > 0);
    if (picks.length === 1 && gems[picks[0]] === 2) {
      if (this.bank[picks[0]] < 4) return err('같은 색 2개는 은행에 4개 이상 있을 때만 가져올 수 있어요');
    } else if (picks.every((c) => gems[c] === 1)) {
      if (n > 3) return err('서로 다른 색 3개까지 가져올 수 있어요');
      if (n < Math.min(3, avail.length)) return err('서로 다른 색 3개를 고르세요');
      if (picks.some((c) => this.bank[c] < 1)) return err('은행에 없는 보석이에요');
    } else return err('서로 다른 3색 1개씩, 또는 같은 색 2개만 가져올 수 있어요');
    for (const c of picks) { this.bank[c] -= gems[c]; p.gems[c] += gems[c]; }
    this.event({ type: 'take', pid: p.pid, gems });
    this.addLog(`${p.name}: 보석 ${picks.map((c) => `${G.GEMS[c].name}${gems[c] > 1 ? '×2' : ''}`).join(', ')}`);
    return this.after(p);
  }

  reserve(p, a) {
    if (p.reserved.length >= G.RESERVE_LIMIT) return err(`예약은 ${G.RESERVE_LIMIT}장까지예요`);
    let id;
    if (a.card) {
      const t = [1, 2, 3].find((x) => this.market[x].includes(a.card));
      if (!t) return err('그 카드는 시장에 없어요');
      id = a.card;
      this.market[t][this.market[t].indexOf(id)] = this.decks[t].pop() || null;
    } else if ([1, 2, 3].includes(a.tier)) {
      if (!this.decks[a.tier].length) return err('더미가 비었어요');
      id = this.decks[a.tier].pop();
    } else return err('예약할 카드를 고르세요');
    p.reserved.push(id);
    let gold = false;
    if (this.bank.gold > 0) { this.bank.gold--; p.gems.gold++; gold = true; }
    this.event({ type: 'reserve', pid: p.pid, card: a.card ? id : null, tier: CARD[id].tier, gold, secret: !a.card, id });
    this.addLog(`${p.name}: ${a.card ? '카드' : `${CARD[id].tier}단계 더미 맨 위 카드`}를 예약${gold ? ' (황금 1개)' : ''}`);
    return this.after(p);
  }

  buy(p, id) {
    const fromMarket = [1, 2, 3].find((x) => this.market[x].includes(id));
    const fromHand = p.reserved.includes(id);
    if (!fromMarket && !fromHand) return err('살 수 없는 카드예요');
    const pay = G.payment(CARD[id], p.gems, this.bonus(p));
    if (!pay) return err('보석이 모자라요');
    for (const k of [...COLORS, 'gold']) { p.gems[k] -= pay[k]; this.bank[k] += pay[k]; }
    if (fromMarket) this.market[fromMarket][this.market[fromMarket].indexOf(id)] = this.decks[fromMarket].pop() || null;
    else p.reserved.splice(p.reserved.indexOf(id), 1);
    p.cards.push(id);
    this.event({ type: 'buy', pid: p.pid, card: id, pay, from: fromMarket ? 'market' : 'reserve' });
    this.addLog(`${p.name}: ${G.GEMS[CARD[id].bonus].name} 카드 구입${CARD[id].points ? ` (+${CARD[id].points}점)` : ''}`);
    return this.after(p);
  }

  /** 행동 뒤: 보석 10개 초과 → 버리기, 귀족 방문 → 차례 넘김 */
  after(p) {
    if (G.total(p.gems) > G.HAND_LIMIT) { this.stage = 'discard'; return ok(); }
    return this.checkNobles(p);
  }

  discard(p, gems) {
    const over = G.total(p.gems) - G.HAND_LIMIT;
    if (!gems || typeof gems !== 'object') return err('버릴 보석을 고르세요');
    let n = 0;
    for (const k of [...COLORS, 'gold']) {
      const v = Math.floor(Number(gems[k]) || 0);
      if (v < 0 || v > p.gems[k]) return err('가진 것보다 많이 버릴 수 없어요');
      n += v;
    }
    if (n !== over) return err(`보석 ${over}개를 버려야 해요`);
    for (const k of [...COLORS, 'gold']) { const v = Math.floor(Number(gems[k]) || 0); p.gems[k] -= v; this.bank[k] += v; }
    this.event({ type: 'discard', pid: p.pid });
    this.stage = 'act';
    return this.checkNobles(p);
  }

  checkNobles(p) {
    const b = this.bonus(p);
    const can = this.nobles.filter((id) => G.canVisit(NOBLE[id], b));
    if (can.length > 1) { this.stage = 'noble'; this.pendingNobles = can; return ok(); }
    if (can.length === 1) this.giveNoble(p, can[0]);
    return this.endTurn(p);
  }
  takeNoble(p, id) {
    if (!this.pendingNobles.includes(id)) return err('그 귀족은 올 수 없어요');
    this.giveNoble(p, id);
    this.stage = 'act';
    this.pendingNobles = [];
    return this.endTurn(p);
  }
  giveNoble(p, id) {
    this.nobles = this.nobles.filter((x) => x !== id);
    p.nobles.push(id);
    this.event({ type: 'noble', pid: p.pid, id });
    this.addLog(`${G.NOBLE_NAMES[NOBLE[id].face]}이(가) ${p.name}님을 찾아왔습니다! (+3점)`);
  }

  endTurn(p) {
    this.stage = 'act';
    if (this.points(p) >= G.WIN_POINTS && !this.finalRound) {
      this.finalRound = true;
      this.addLog(`${p.name}님이 ${G.WIN_POINTS}점을 넘었습니다! 이번 바퀴까지만 진행합니다.`);
      this.event({ type: 'final', pid: p.pid });
    }
    this.turn = (this.turn + 1) % this.players.length;
    if (this.turn === 0) {
      if (this.finalRound) return this.finish();
      this.round++;
    }
    this.event({ type: 'turn', pid: this.cur().pid });
    return ok();
  }

  finish() {
    this.phase = 'over';
    clearTimeout(this.timer);
    const ranked = this.players.slice().sort((a, b) => this.points(b) - this.points(a) || a.cards.length - b.cards.length);
    const top = ranked[0];
    const winners = ranked.filter((q) => this.points(q) === this.points(top) && q.cards.length === top.cards.length).map((q) => q.pid);
    this.over = { winners, scores: ranked.map((q) => ({ pid: q.pid, points: this.points(q), cards: q.cards.length, nobles: q.nobles.length })) };
    this.addLog(`게임 끝! ${winners.map((w) => this.pl(w).name).join(', ')}님 승리!`);
    this.event({ type: 'over', winners });
    return ok();
  }

  /* ── AI: 점수 · 귀족에 가까운 카드를 노리고, 모자란 보석을 모은다 */
  botStep(p) {
    if (this.phase !== 'play' || p !== this.cur()) return;
    if (this.stage === 'discard') {
      const over = G.total(p.gems) - G.HAND_LIMIT;
      const dis = G.emptyGems(true);
      for (let i = 0; i < over; i++) {
        const c = COLORS.slice().sort((a, b) => (p.gems[b] - dis[b]) - (p.gems[a] - dis[a]))[0];
        dis[c]++;
      }
      return this.discard(p, dis);
    }
    if (this.stage === 'noble') return this.takeNoble(p, this.pendingNobles[0]);
    const b = this.bonus(p);
    const visible = [...[1, 2, 3].flatMap((t) => this.market[t]).filter(Boolean), ...p.reserved];
    const score = (id) => {
      const c = CARD[id];
      let s = c.points * 3 + 1;
      for (const nid of this.nobles) if ((NOBLE[nid].req[c.bonus] || 0) > b[c.bonus]) s += 1.2;
      return s;
    };
    const buyable = visible.filter((id) => G.payment(CARD[id], p.gems, b));
    if (buyable.length) {
      buyable.sort((x, y) => score(y) - score(x));
      return this.buy(p, buyable[0]);
    }
    // 목표 카드: 부족한 보석이 적고 점수가 높은 것
    const need = (id) => COLORS.reduce((s, c) => s + Math.max(0, (CARD[id].cost[c] || 0) - b[c] - p.gems[c]), 0) - p.gems.gold;
    const target = visible.slice().sort((x, y) => (need(x) - score(x) * 0.6) - (need(y) - score(y) * 0.6))[0];
    const want = target ? COLORS.filter((c) => (CARD[target].cost[c] || 0) - b[c] - p.gems[c] > 0) : [];
    const room = G.HAND_LIMIT - G.total(p.gems);
    const avail = COLORS.filter((c) => this.bank[c] > 0);
    if (room >= 2 && want.length === 1 && this.bank[want[0]] >= 4 && CARD[target].cost[want[0]] - b[want[0]] - p.gems[want[0]] >= 2) {
      return this.take(p, { [want[0]]: 2 });
    }
    if (avail.length && room > 0) {
      const pick = [...want.filter((c) => this.bank[c] > 0), ...shuffle(avail.slice())].filter((c, i, a) => a.indexOf(c) === i).slice(0, Math.min(3, avail.length));
      const r = this.take(p, Object.fromEntries(pick.map((c) => [c, 1])));
      if (r.ok) return r;
    }
    if (p.reserved.length < G.RESERVE_LIMIT && target && !p.reserved.includes(target)) return this.reserve(p, { card: target });
    if (p.reserved.length < G.RESERVE_LIMIT) return this.reserve(p, { tier: [1, 2, 3].find((t) => this.decks[t].length) });
    // 할 수 있는 게 없으면 아무 보석 하나라도
    if (avail.length) return this.take(p, { [avail[0]]: 1 });
    return this.endTurn(p);
  }

  /* ── 화면용 */
  viewFor(pid) {
    return {
      id: this.id,
      phase: this.phase,
      stage: this.stage,
      turn: this.cur().pid,
      round: this.round,
      finalRound: this.finalRound,
      bank: this.bank,
      market: this.market,
      deckLeft: { 1: this.decks[1].length, 2: this.decks[2].length, 3: this.decks[3].length },
      nobles: this.nobles,
      pendingNobles: this.cur().pid === pid ? this.pendingNobles : [],
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, seat: p.seat,
        online: p.isBot || this.hooks.isOnline(p.pid),
        gems: p.gems, bonus: this.bonus(p), points: this.points(p), cards: p.cards, nobles: p.nobles,
        reserved: p.pid === pid || this.phase === 'over' ? p.reserved : p.reserved.map((id) => ({ hidden: true, tier: CARD[id].tier })),
      })),
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      deadlineTotal: this.deadlineTotal,
      log: this.log,
      events: this.events.map((e) => (e.secret && e.pid !== pid ? { ...e, id: null } : e)),
      over: this.over,
    };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
  }

  /* ── 서버가 다시 켜져도 이어 하기 */
  snapshot() { return dehydrate(this, ['timer']); }
  static restore(data, hooks) {
    const g = rebuild(Game, data);
    g.hooks = hooks;
    g.timer = null;
    g.dead = false;
    g.arm();
    return g;
  }
}

Game.setPace = (v) => { PACE = v; };
module.exports = Game;
