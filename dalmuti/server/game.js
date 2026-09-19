'use strict';
// 왕궁의 달무티 - 서버 쪽 게임 진행
//
// 한 판: 카드 나누기 → (광대 2장 가진 사람이) 혁명 선언? → 세금(농노가 좋은 카드를 바친다)
//        → 대달무티부터 카드 내기 (같은 장수 · 더 작은 숫자, 아니면 패스) → 먼저 다 턴 순서가 다음 판 신분
// 정해진 판 수를 하고 점수(신분)가 가장 높은 사람이 우승.
const crypto = require('crypto');
const Dm = require('../public/shared/dalmuti');
const { dehydrate, rebuild } = require('../../hub/persist');

let PACE = 1;
const rand = (n) => crypto.randomInt(n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ok = (x = {}) => ({ ok: true, ...x });
const err = (error) => ({ ok: false, error });
const J = Dm.JESTER;
const M = Dm.MAPAE;
const plain = (c) => c.r !== J && c.r !== M; // 광대 · 마패가 아닌 보통 카드
const T = { turn: 40_000, offline: 5_000, tax: 40_000, revolt: 20_000, between: 6_500, bot: [900, 1500] };

class Game {
  /**
   * seats: [{pid, name, isBot}]  hooks: { changed(), isOnline(pid) }  opts: { rounds, edition }
   */
  constructor(seats, hooks, opts = {}) {
    this.id = crypto.randomBytes(5).toString('hex');
    this.hooks = hooks;
    this.rounds = Math.max(1, Math.min(10, opts.rounds || 3));
    this.edition = Dm.EDITIONS[opts.edition] ? opts.edition : 'classic';
    // 첫 판 신분은 제비뽑기 (카드 한 장씩 뽑아 작은 숫자가 높은 신분)
    const draws = shuffle(Dm.makeDeck(this.edition)).slice(0, seats.length);
    const order = seats.map((s, i) => ({ s, r: plain(draws[i]) ? draws[i].r : 99, k: rand(1000) })).sort((a, b) => a.r - b.r || a.k - b.k);
    this.players = order.map(({ s }, pos) => ({ pid: s.pid, name: s.name, isBot: !!s.isBot, pos, hand: [], out: false, place: null, score: 0, passed: false, draw: draws[seats.indexOf(s)].r }));
    this.round = 0;
    this.phase = 'deal';
    this.trick = null;        // { rank, count, by, cards }
    this.turn = null;         // 차례인 pid
    this.lastPlay = null;     // 마지막으로 낸 사람 pid
    this.finish = [];         // 이번 판 다 턴 순서
    this.tax = null;          // 세금 진행 { steps:[{from,to,n,give:[], back:null}], i }
    this.revolt = null;       // { pid, great }
    this.history = [];        // 판마다 결과
    this.log = [];
    this.events = [];
    this.seq = 0;
    this.timer = null;
    this.botTimer = null;
    this.deadline = 0;
    this.deadlineTotal = 0;
    this.over = null;
    this.dead = false;
    this.addLog('story', '왕궁에 새 계급이 정해졌습니다. 제비뽑기로 첫 신분을 정했습니다.');
    this.event({ type: 'draw' });
    this.later(2200, () => this.startRound());
  }

  /* ── 도구 */
  pl(pid) { return this.players.find((p) => p.pid === pid); }
  byPos() { return this.players.slice().sort((a, b) => a.pos - b.pos); }
  n() { return this.players.length; }
  changed() { if (!this.dead) this.hooks.changed(); }
  event(e) { e.seq = ++this.seq; this.events.push(e); if (this.events.length > 50) this.events.shift(); }
  addLog(kind, text) { this.log.push({ kind, text }); if (this.log.length > 120) this.log.shift(); }
  online(p) { return p.isBot || this.hooks.isOnline(p.pid); }
  later(ms, fn) {
    clearTimeout(this.botTimer);
    this.botTimer = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[달무티 진행 오류]', e); }
      this.changed();
    }, Math.round(ms * PACE));
  }
  schedule(ms, fn) {
    clearTimeout(this.timer);
    const d = Math.round(ms * PACE);
    this.deadline = Date.now() + d;
    this.deadlineTotal = d;
    this.timer = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[달무티 시간 초과 처리 오류]', e); }
      this.changed();
    }, d);
  }
  sortHand(p) { p.hand.sort((a, b) => a.r - b.r || (a.id < b.id ? -1 : 1)); }
  cardName(r) { return Dm.ranksOf(this.edition)[r].name; }
  title(pos) { return Dm.seatTitle(pos, this.n(), this.edition); }

  /* ── 판 시작: 나누기 */
  startRound() {
    this.round++;
    this.phase = 'deal';
    this.trick = null;
    this.lastPlay = null;
    this.finish = [];
    this.revolt = null;
    for (const p of this.players) { p.hand = []; p.out = false; p.place = null; p.passed = false; }
    const deck = shuffle(Dm.makeDeck(this.edition));
    const seat = this.byPos();
    // 대달무티부터 한 장씩 돌린다
    deck.forEach((c, i) => seat[i % seat.length].hand.push(c));
    for (const p of this.players) this.sortHand(p);
    this.event({ type: 'deal', round: this.round });
    this.addLog('round', `── ${this.round}번째 판 (${this.rounds}판 중) ──`);
    // 광대 두 장을 가진 사람은 혁명을 외칠 수 있다
    const jj = this.players.find((p) => p.hand.filter((c) => c.r === J).length === 2);
    if (jj) {
      this.phase = 'revolt';
      this.revolt = { pid: jj.pid, great: jj.pos === this.n() - 1, asked: true };
      this.addLog('sys', `{p:${jj.pid}} 님이 광대 두 장을 받았습니다! 혁명을 일으킬 수 있습니다.`);
      if (jj.isBot || !this.online(jj)) this.later(1500 + rand(1500), () => this.decideRevolt(jj, this.botWantsRevolt(jj)));
      this.schedule(this.online(jj) ? T.revolt : T.offline, () => this.decideRevolt(jj, false));
      return;
    }
    this.startTax();
  }
  botWantsRevolt(p) {
    // 아래 계급일수록, 손패가 나쁠수록 혁명을 외친다
    const good = p.hand.filter((c) => c.r <= 4).length;
    return p.pos >= this.n() / 2 || good < 3;
  }
  decideRevolt(p, yes) {
    if (this.phase !== 'revolt' || !this.revolt || this.revolt.pid !== p.pid) return err('지금은 혁명을 고를 때가 아닙니다');
    clearTimeout(this.timer);
    if (yes) {
      const great = this.revolt.great;
      this.event({ type: 'revolution', pid: p.pid, great });
      if (great) {
        // 대혁명: 신분이 뒤집힌다
        for (const q of this.players) q.pos = this.n() - 1 - q.pos;
        this.addLog('bad', `대혁명! {p:${p.pid}} 님이 봉기했습니다. 신분이 거꾸로 뒤집히고 세금도 없습니다!`);
      } else {
        this.addLog('bad', `혁명! {p:${p.pid}} 님의 선언으로 이번 판은 세금이 없습니다.`);
      }
      this.revolt.done = true;
      this.later(3200, () => this.startPlay());
      this.phase = 'revolting';
      return ok();
    }
    this.addLog('sys', `{p:${p.pid}} 님은 혁명을 일으키지 않았습니다.`);
    this.startTax();
    return ok();
  }

  /* ── 세금: 대농노 → 대달무티 2장, 소농노 → 소달무티 1장, 그리고 돌려받기 */
  startTax() {
    const s = this.byPos();
    const n = s.length;
    const steps = [{ from: s[n - 1].pid, to: s[0].pid, n: 2 }];
    if (n >= 4) steps.push({ from: s[n - 2].pid, to: s[1].pid, n: 1 });
    this.phase = 'tax';
    this.tax = { steps };
    // 농노는 가장 좋은 카드(작은 숫자, 광대 빼고)를 자동으로 바친다
    for (const st of steps) {
      const from = this.pl(st.from);
      const to = this.pl(st.to);
      const give = from.hand.filter(plain).slice(0, st.n);
      for (const c of give) from.hand.splice(from.hand.indexOf(c), 1);
      to.hand.push(...give);
      this.sortHand(to);
      st.give = give.map((c) => c.id);
      st.back = null;
      this.event({ type: 'tax', from: st.from, to: st.to, cards: give.map((c) => c.r) });
      this.addLog('tax', `{p:${st.from}} → {p:${st.to}} 세금 ${give.map((c) => this.cardName(c.r)).join(', ')}`);
    }
    // 달무티들이 돌려줄 카드를 고른다
    for (const st of steps) {
      const to = this.pl(st.to);
      if (to.isBot || !this.online(to)) {
        this.taxBack(to, this.botTaxBack(to, st.n));
      }
    }
    if (this.tax && this.tax.steps.every((st) => st.back)) return;
    this.schedule(T.tax, () => { for (const st of this.tax.steps) if (!st.back) { const to = this.pl(st.to); this.taxBack(to, this.botTaxBack(to, st.n)); } });
  }
  botTaxBack(p, n) {
    // 가장 나쁜 카드(큰 숫자)를 돌려준다, 광대는 지킨다
    return p.hand.filter(plain).slice(-n).map((c) => c.id);
  }
  taxBack(p, ids) {
    if (this.phase !== 'tax') return err('지금은 세금을 돌려줄 때가 아닙니다');
    const st = this.tax.steps.find((x) => x.to === p.pid && !x.back);
    if (!st) return err('돌려줄 카드가 없습니다');
    if (!Array.isArray(ids) || ids.length !== st.n || new Set(ids).size !== ids.length) return err(`${st.n}장을 골라 주세요`);
    const cards = ids.map((id) => p.hand.find((c) => c.id === id));
    if (cards.some((c) => !c)) return err('내 카드에서 고르세요');
    const from = this.pl(st.from);
    for (const c of cards) p.hand.splice(p.hand.indexOf(c), 1);
    from.hand.push(...cards);
    this.sortHand(from);
    st.back = ids;
    this.event({ type: 'taxBack', from: p.pid, to: from.pid, cards: cards.map((c) => c.r) });
    if (this.tax.steps.every((x) => x.back)) {
      clearTimeout(this.timer);
      this.later(1400, () => this.startPlay());
      this.phase = 'taxdone';
    }
    return ok();
  }

  /* ── 카드 내기 */
  startPlay() {
    this.phase = 'play';
    this.tax = null;
    this.trick = null;
    const lead = this.byPos()[0];
    this.addLog('sys', `{p:${lead.pid}} (${this.title(0)}) 님이 먼저 냅니다.`);
    this.setTurn(lead.pid, true);
  }
  active() { return this.players.filter((p) => !p.out); }
  nextActive(pid) {
    const s = this.byPos();
    let i = s.findIndex((p) => p.pid === pid);
    for (let k = 0; k < s.length; k++) {
      i = (i + 1) % s.length;
      if (!s[i].out) return s[i];
    }
    return null;
  }
  setTurn(pid, lead = false) {
    this.turn = pid;
    const p = this.pl(pid);
    if (lead) { this.trick = null; for (const q of this.players) q.passed = false; }
    this.event({ type: 'turn', pid, lead });
    const auto = p.isBot || !this.online(p);
    if (auto) this.later(p.isBot ? T.bot[0] + rand(T.bot[1]) : T.offline, () => this.botMove(p));
    else clearTimeout(this.botTimer);
    this.schedule(auto ? T.offline + 3000 : T.turn, () => this.timeoutMove(p));
  }
  timeoutMove(p) {
    if (this.phase !== 'play' || this.turn !== p.pid) return;
    if (!this.trick) this.botMove(p); // 먼저 낼 차례면 대신 골라 낸다
    else this.pass(p, true);
  }

  play(p, ids) {
    if (this.phase !== 'play') return err('지금은 카드를 낼 때가 아닙니다');
    if (this.turn !== p.pid) return err('내 차례가 아닙니다');
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) return err('낼 카드를 고르세요');
    const cards = ids.map((id) => p.hand.find((c) => c.id === id));
    if (cards.some((c) => !c)) return err('내 카드에서 고르세요');
    const set = Dm.evalSet(cards);
    if (!set) return err(cards.some((c) => c.r === M) ? '마패는 한 장만 따로 냅니다' : '같은 숫자끼리만 낼 수 있어요 (광대는 아무 숫자)');
    if (set.mapae) return this.playMapae(p, cards[0]);
    if (this.trick && set.count !== this.trick.count) return err(`${this.trick.count}장을 내야 합니다`);
    if (!Dm.beats(set, this.trick)) return err(`${this.cardName(this.trick.rank)}(${this.trick.rank})보다 작은 숫자를 내야 합니다`);
    for (const c of cards) p.hand.splice(p.hand.indexOf(c), 1);
    this.trick = { ...set, by: p.pid, cards: cards.map((c) => ({ id: c.id, r: c.r })) };
    this.lastPlay = p.pid;
    this.event({ type: 'play', pid: p.pid, rank: set.rank, count: set.count, cards: this.trick.cards });
    this.addLog('play', `{p:${p.pid}} ${this.cardName(set.rank)} ×${set.count}`);
    if (!p.hand.length) this.goOut(p);
    this.advance(p.pid);
    return ok();
  }
  /** 암행어사 출두: 지금 판을 통째로 치우고, 낸 사람이 새로 연다 */
  playMapae(p, card) {
    p.hand.splice(p.hand.indexOf(card), 1);
    this.trick = null;
    this.lastPlay = p.pid;
    for (const q of this.players) q.passed = false;
    this.event({ type: 'mapae', pid: p.pid, cards: [{ id: card.id, r: card.r }] });
    this.addLog('good', `{p:${p.pid}} 암행어사 출두요! 판을 엎었습니다`);
    this.turn = null;
    clearTimeout(this.timer);
    if (!p.hand.length) {
      this.goOut(p);
      const act = this.active();
      if (act.length <= 1) {
        if (act.length === 1) this.goOut(act[0]);
        this.endRound();
        return ok();
      }
      const nx = this.nextActive(p.pid);
      this.later(1800, () => this.setTurn(nx.pid, true));
      return ok();
    }
    this.later(1800, () => this.setTurn(p.pid, true));
    return ok();
  }
  pass(p, auto = false) {
    if (this.phase !== 'play' || this.turn !== p.pid) return err('내 차례가 아닙니다');
    if (!this.trick) return err('먼저 내는 차례에는 패스할 수 없어요');
    p.passed = true;
    this.event({ type: 'pass', pid: p.pid, auto });
    this.advance(p.pid);
    return ok();
  }
  goOut(p) {
    p.out = true;
    p.place = this.finish.length;
    this.finish.push(p.pid);
    const title = this.title(p.place);
    this.event({ type: 'out', pid: p.pid, place: p.place });
    this.addLog('good', `{p:${p.pid}} 님이 ${p.place + 1}번째로 다 냈습니다 → 다음 판 ${title}`);
  }
  advance(fromPid) {
    const act = this.active();
    if (act.length <= 1) {
      if (act.length === 1) this.goOut(act[0]);
      return this.endRound();
    }
    // 판을 연 사람 말고 모두 패스했으면, 마지막으로 낸 사람이 새로 연다
    const nxt = this.nextActive(fromPid);
    const contenders = act.filter((q) => !q.passed && q.pid !== this.lastPlay);
    if (!contenders.length) {
      const leader = this.pl(this.lastPlay);
      this.event({ type: 'clear' });
      const lead = leader && !leader.out ? leader : this.nextActive(this.lastPlay);
      this.later(700, () => this.setTurn(lead.pid, true));
      this.phase = 'play';
      this.turn = null;
      return;
    }
    let q = nxt;
    let guard = 0;
    while ((q.passed || q.out) && guard++ < 20) q = this.nextActive(q.pid);
    if (q.pid === this.lastPlay) {
      this.event({ type: 'clear' });
      this.later(700, () => this.setTurn(q.pid, true));
      this.turn = null;
      return;
    }
    this.setTurn(q.pid, false);
  }

  /* ── 판 끝 */
  endRound() {
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
    this.turn = null;
    const n = this.n();
    // 점수: 대달무티 n-1 … 대농노 0
    for (const p of this.players) { p.score += n - 1 - p.place; p.pos = p.place; }
    this.history.push({ round: this.round, order: this.finish.slice() });
    this.event({ type: 'roundOver', order: this.finish.slice() });
    this.addLog('round', `${this.round}번째 판 끝 · 새 ${this.title(0)}: {p:${this.finish[0]}}`);
    if (this.round >= this.rounds) {
      this.phase = 'over';
      const rank = this.players.slice().sort((a, b) => b.score - a.score || a.pos - b.pos);
      this.over = { ranking: rank.map((p) => ({ pid: p.pid, score: p.score })), champion: rank[0].pid, peon: rank[rank.length - 1].pid };
      this.addLog('good', `왕좌의 주인: {p:${rank[0].pid}}!`);
      this.event({ type: 'over' });
      return;
    }
    this.phase = 'between';
    this.schedule(T.between, () => this.startRound());
  }

  /* ── AI */
  botMove(p) {
    if (this.phase !== 'play' || this.turn !== p.pid) return;
    const ids = this.botChoose(p);
    if (ids) this.play(p, ids);
    else this.pass(p, true);
  }
  /** 가진 카드를 숫자별로 묶는다 */
  groups(p) {
    const g = {};
    for (const c of p.hand) if (plain(c)) (g[c.r] = g[c.r] || []).push(c);
    return g;
  }
  botChoose(p) {
    const g = this.groups(p);
    const jest = p.hand.filter((c) => c.r === J);
    const mapae = p.hand.find((c) => c.r === M);
    const ranks = Object.keys(g).map(Number).sort((a, b) => b - a); // 나쁜(큰) 숫자부터
    if (!this.trick) {
      // 먼저 낼 때: 가장 나쁜 숫자 묶음을 통째로 (광대는 아낀다, 마패는 마지막에)
      if (!ranks.length) return jest.length ? jest.map((c) => c.id) : mapae ? [mapae.id] : null;
      const r = ranks[0];
      return g[r].map((c) => c.id);
    }
    const { count, rank } = this.trick;
    // 이길 수 있는 묶음 중 가장 나쁜(큰) 숫자로, 광대는 되도록 안 쓴다
    const tries = [];
    for (const r of ranks) {
      if (r >= rank) continue;
      const have = g[r].length;
      if (have >= count) tries.push({ r, ids: g[r].slice(0, count).map((c) => c.id), jest: 0 });
      else if (have + jest.length >= count) tries.push({ r, ids: [...g[r], ...jest.slice(0, count - have)].map((c) => c.id), jest: count - have });
    }
    if (!tries.length) {
      if (jest.length >= count && rank > J) return jest.slice(0, count).map((c) => c.id);
      // 못 이기면 마패로 판을 엎는다: 손패가 적거나, 센 카드 묶음이 깔렸을 때
      if (mapae && (p.hand.length <= 4 || (rank <= 4 && count >= 2) || rand(100) < 12)) return [mapae.id];
      return null;
    }
    tries.sort((a, b) => a.jest - b.jest || b.r - a.r);
    const pick = tries[0];
    // 높은 카드(1~3)를 아껴 두다가, 손패가 적거나 앞 사람이 거의 다 냈을 때 쓴다
    const nearEnd = p.hand.length <= count + 2 || this.active().some((q) => q.pid !== p.pid && q.hand.length <= 2);
    if (pick.r <= 3 && !nearEnd && rand(100) < 55) return null;
    // 묶음을 깨서 내는 건 가끔만
    if (g[pick.r].length > count && pick.r >= 8 && rand(100) < 30) return null;
    return pick.ids;
  }

  /* ── 사람 행동 */
  act(pid, a) {
    const p = this.pl(pid);
    if (!p) return err('게임 참가자가 아닙니다');
    if (!a || typeof a !== 'object') return err('잘못된 요청입니다');
    switch (a.type) {
      case 'play': return this.play(p, a.cards);
      case 'pass': return this.pass(p);
      case 'taxBack': return this.taxBack(p, a.cards);
      case 'revolt': return this.decideRevolt(p, !!a.yes);
      default: return err('알 수 없는 행동입니다');
    }
  }
  onPresence() {
    // 차례인 사람이 나갔으면 곧 자동으로
    if (this.phase === 'play' && this.turn) {
      const p = this.pl(this.turn);
      if (p && !p.isBot && !this.online(p) && this.deadline - Date.now() > T.offline) this.schedule(T.offline, () => this.timeoutMove(p));
    }
    this.changed();
  }

  viewFor(pid) {
    const me = this.pl(pid);
    const n = this.n();
    let myTax = null;
    if (me && this.phase === 'tax' && this.tax) {
      const st = this.tax.steps.find((x) => x.to === pid && !x.back);
      if (st) myTax = { n: st.n, got: st.give };
    }
    return {
      id: this.id,
      edition: this.edition,
      phase: this.phase,
      round: this.round,
      rounds: this.rounds,
      turn: this.turn,
      trick: this.trick,
      lastPlay: this.lastPlay,
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      deadlineTotal: this.deadlineTotal,
      players: this.byPos().map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, pos: p.pos, title: this.title(p.pos), count: p.hand.length,
        out: p.out, place: p.place, score: p.score, passed: p.passed, online: this.online(p),
        jesters: this.phase === 'revolt' && this.revolt && this.revolt.pid === p.pid ? 2 : null,
      })),
      me: me ? { pid, hand: me.hand, pos: me.pos, title: this.title(me.pos) } : null,
      tax: myTax,
      taxSteps: this.tax ? this.tax.steps.map((s) => ({ from: s.from, to: s.to, n: s.n, done: !!s.back })) : null,
      revolt: this.revolt ? { pid: this.revolt.pid, great: this.revolt.great, done: !!this.revolt.done } : null,
      finish: this.finish,
      history: this.history,
      log: this.log.slice(-60),
      events: this.events,
      seq: this.seq,
      over: this.over,
    };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
  }

  /* ── 서버가 다시 켜져도 이어 하기 */
  snapshot() { return dehydrate(this, ['timer', 'botTimer']); }
  static restore(data, hooks) {
    const g = rebuild(Game, data);
    g.hooks = hooks;
    g.timer = null;
    g.botTimer = null;
    g.dead = false;
    const go = {
      deal: () => g.later(1000, () => g.startRound()),
      revolt: () => { const p = g.pl(g.revolt.pid); g.schedule(T.revolt, () => g.decideRevolt(p, false)); if (p.isBot) g.later(1500, () => g.decideRevolt(p, g.botWantsRevolt(p))); },
      revolting: () => g.later(1500, () => g.startPlay()),
      tax: () => g.schedule(T.tax, () => { for (const st of g.tax.steps) if (!st.back) { const to = g.pl(st.to); g.taxBack(to, g.botTaxBack(to, st.n)); } }),
      taxdone: () => g.later(1000, () => g.startPlay()),
      play: () => (g.turn ? g.setTurn(g.turn, !g.trick) : g.setTurn((g.pl(g.lastPlay) && !g.pl(g.lastPlay).out ? g.pl(g.lastPlay) : g.nextActive(g.lastPlay || g.byPos()[0].pid)).pid, true)),
      between: () => g.schedule(3000, () => g.startRound()),
    }[g.phase];
    if (go) go();
    return g;
  }
}

Game.setPace = (v) => { PACE = v; };
module.exports = Game;
