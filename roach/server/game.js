'use strict';
// 바퀴벌레 포커 - 규칙 엔진 (서버가 판정) + AI
//   차례: 손에서 한 장 골라 엎어 놓고 "이건 OO야" 하고 남에게 민다.
//   받은 사람은 ① 맞다 ② 아니다 ③ 몰래 보고 다른 사람에게 다시 민다.
//   틀린 쪽이 그 카드를 자기 앞에 펼쳐 놓는다. 같은 벌레 4장이면 그 사람이 진다.
const crypto = require('crypto');
const R = require('../public/shared/roach');
const { dehydrate, rebuild } = require('../../hub/persist');

const { KIND_IDS, kindOf, tally, DEAD } = R;
let PACE = 1;
const T_OFFLINE = 9000;      // 접속이 끊긴 사람 자리는 이만큼만 기다렸다 AI 가 대신

const rand = (n) => crypto.randomInt(n);
const pick = (a) => a[rand(a.length)];
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
    this.players = seats.map((s, i) => ({
      pid: s.pid, name: s.name, isBot: s.isBot, seat: i,
      hand: [], pile: [], passed: 0, caught: 0, fooled: 0,
    }));
    // 64장을 골고루 나눠 준다 (남는 장은 빼 둔다)
    const deck = shuffle(R.DECK.slice());
    const n = this.players.length;
    const each = Math.floor(deck.length / n);
    this.players.forEach((p, i) => { p.hand = deck.slice(i * each, (i + 1) * each); });
    this.out = deck.slice(each * n);          // 쓰지 않는 카드
    this.turn = rand(n);                      // 미는 사람
    this.stage = 'offer';                     // offer | reply | reveal
    this.pending = null;                      // { card, kind, claim, from, to, seen[], hops }
    this.reveal = null;                       // 방금 뒤집힌 결과 (화면 연출용)
    this.phase = 'play';
    this.over = null;
    this.round = 1;
    this.events = [];
    this.seq = 0;
    this.log = [];
    this.dead = false;
    this.addLog(`${this.cur().name}님부터 시작합니다. 같은 벌레 ${DEAD}장을 모으면 집니다!`);
    this.arm();
  }

  cur() { return this.players[this.turn]; }
  pl(pid) { return this.players.find((p) => p.pid === pid); }
  alive() { return this.players.filter((p) => !R.deadKind(p.pile)); }
  /** 지금 답할 사람 (없으면 미는 사람) */
  actor() { return this.stage === 'reply' && this.pending ? this.pl(this.pending.to) : this.cur(); }

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

  /* ── 시간 · AI ─────────────────────────────────────────── */
  arm() {
    clearTimeout(this.timer);
    if (this.phase !== 'play') return;
    const p = this.actor();
    if (!p) return;
    const auto = p.isBot || !this.hooks.isOnline(p.pid);
    const think = this.stage === 'reply' ? 1400 + rand(1600) : 1100 + rand(1400);
    const ms = p.isBot ? think : auto ? T_OFFLINE : this.stage === 'reply' ? R.REPLY_MS : R.OFFER_MS;
    this.deadline = Date.now() + ms * PACE;
    this.deadlineTotal = ms * PACE;
    this.timer = setTimeout(() => {
      if (this.dead) return;
      try { this.botStep(p); } catch (e) { console.error('[바퀴벌레 포커 AI 오류]', e); }
      this.arm();
      this.changed();
    }, ms * PACE);
  }
  onPresence() { this.arm(); this.changed(); }

  /* ── 사람이 하는 행동 ───────────────────────────────────── */
  act(pid, a) {
    if (this.phase !== 'play') return err('게임이 끝났습니다');
    const p = this.pl(pid);
    if (!p) return err('게임 참가자가 아닙니다');
    if (!a || typeof a.type !== 'string') return err('잘못된 요청입니다');
    let r;
    if (this.stage === 'offer') {
      if (p !== this.cur()) return err('내 차례가 아닙니다');
      r = a.type === 'offer' ? this.offer(p, a) : err('카드를 골라 상대에게 미세요');
    } else if (this.stage === 'reply') {
      if (!this.pending || this.pending.to !== pid) return err('내가 받은 카드가 아닙니다');
      if (a.type === 'guess') r = this.guess(p, a.believe === true);
      else if (a.type === 'peek') r = this.peek(p);
      else if (a.type === 'pass') r = this.passOn(p, a);
      else r = err('맞다 · 아니다 · 넘기기 중에 고르세요');
    } else r = err('잠시 기다려 주세요');
    if (r.ok) { this.arm(); this.changed(); }
    return r;
  }

  /** ① 카드를 골라 상대에게 민다 */
  offer(p, a) {
    const card = String(a.card || '');
    const claim = String(a.claim || '');
    const to = String(a.to || '');
    if (!p.hand.includes(card)) return err('손에 없는 카드입니다');
    if (!KIND_IDS.includes(claim)) return err('무슨 벌레라고 할지 고르세요');
    const t = this.pl(to);
    if (!t || t === p) return err('받을 사람을 고르세요');
    if (R.deadKind(t.pile)) return err('이미 끝난 사람에게는 줄 수 없습니다');
    p.hand.splice(p.hand.indexOf(card), 1);
    this.pending = { card, kind: kindOf(card), claim, from: p.pid, to: t.pid, origin: p.pid, seen: [p.pid], hops: 0 };
    this.stage = 'reply';
    this.addLog(`${p.name} → ${t.name}: “이건 ${R.KIND[claim].name}야”`);
    this.event({ type: 'offer', from: p.pid, to: t.pid, claim });
    return ok();
  }

  /** ② 맞다 / 아니다 */
  guess(p, believe) {
    const pd = this.pending;
    const truth = pd.kind === pd.claim;            // 민 사람의 말이 사실인가
    const rightGuess = believe === truth;          // 받은 사람이 제대로 읽었나
    const loser = rightGuess ? this.pl(pd.from) : p;
    const from = this.pl(pd.from);
    if (rightGuess) p.caught++; else from.fooled++;
    this.finish(loser, `${p.name}님이 “${believe ? '맞다' : '아니다'}” → ${truth ? '정말 ' : '거짓! 진짜는 '}${R.KIND[pd.kind].name}`, { believe, truth, rightGuess, judge: p.pid });
    return ok();
  }

  /** ③ 몰래 본다 (본 사람은 다시 받을 수 없다) */
  peek(p) {
    const pd = this.pending;
    if (pd.peeked) return err('이미 봤습니다');
    pd.peeked = true;
    if (!pd.seen.includes(p.pid)) pd.seen.push(p.pid);
    this.event({ type: 'peek', pid: p.pid });
    this.addLog(`${p.name}님이 카드를 몰래 봤습니다`);
    return ok();
  }

  /** ③ 본 다음 다른 사람에게 다시 민다 */
  passOn(p, a) {
    const pd = this.pending;
    if (!pd.peeked) return err('카드를 먼저 보고 넘길 수 있습니다');
    const claim = String(a.claim || '');
    const to = String(a.to || '');
    if (!KIND_IDS.includes(claim)) return err('무슨 벌레라고 할지 고르세요');
    const t = this.pl(to);
    if (!t || t === p) return err('넘길 사람을 고르세요');
    if (pd.seen.includes(t.pid)) return err('이미 그 카드를 본 사람입니다');
    if (R.deadKind(t.pile)) return err('이미 끝난 사람에게는 줄 수 없습니다');
    pd.from = p.pid;
    pd.to = t.pid;
    pd.claim = claim;
    pd.peeked = false;
    pd.hops++;
    if (!pd.seen.includes(p.pid)) pd.seen.push(p.pid);
    this.addLog(`${p.name} → ${t.name}: “아니야, 이건 ${R.KIND[claim].name}야”`);
    this.event({ type: 'offer', from: p.pid, to: t.pid, claim, hop: pd.hops });
    return ok();
  }

  /** 받을 사람이 더 없으면 지금 든 사람이 반드시 답해야 한다 */
  canPass(p) {
    const pd = this.pending;
    if (!pd) return false;
    return this.players.some((q) => q !== p && !pd.seen.includes(q.pid) && !R.deadKind(q.pile));
  }

  /** 카드를 진 쪽 앞에 펼쳐 놓고 다음 차례로 */
  finish(loser, text, extra) {
    const pd = this.pending;
    loser.pile.push(pd.card);
    this.reveal = { card: pd.card, kind: pd.kind, claim: pd.claim, loser: loser.pid, from: pd.from, to: pd.to, ...extra };
    this.addLog(`${text} → ${loser.name}님이 ${R.KIND[pd.kind].name}를 받습니다`);
    this.event({ type: 'reveal', ...this.reveal });
    this.pending = null;
    this.stage = 'offer';
    const dk = R.deadKind(loser.pile);
    if (dk) return this.finishGame(loser, `${loser.name}님 앞에 ${R.KIND[dk].name} ${DEAD}장!`);
    // 카드를 받은 사람이 다음 차례. 손에 카드가 없으면 그 사람이 진다
    if (!loser.hand.length) return this.finishGame(loser, `${loser.name}님의 손에 카드가 없습니다!`);
    this.turn = this.players.indexOf(loser);
    this.round++;
    return ok();
  }

  finishGame(loser, why) {
    this.phase = 'over';
    clearTimeout(this.timer);
    const winners = this.players.filter((p) => p !== loser).map((p) => p.pid);
    this.over = {
      loser: loser.pid,
      why,
      winners,
      scores: this.players.map((p) => ({
        pid: p.pid, name: p.name, pile: p.pile.slice(), hand: p.hand.length, caught: p.caught, fooled: p.fooled,
      })),
    };
    this.addLog(`${why} 게임 끝 — ${loser.name}님이 벌레를 다 뒤집어썼습니다!`);
    this.event({ type: 'over', loser: loser.pid });
    return ok();
  }

  /* ── AI ─────────────────────────────────────────────────
     AI 가 아는 것: 자기 손패, 모두의 앞에 펼쳐진 카드. (남의 손패는 모른다)
     이걸로 "저 말이 사실일 확률" 을 세어 보고, 위험한 벌레는 피해서 민다. */
  known(p) {
    const seen = {};
    for (const k of KIND_IDS) seen[k] = 0;
    for (const q of this.players) for (const id of q.pile) seen[kindOf(id)]++;
    for (const id of p.hand) seen[kindOf(id)]++;
    return seen;
  }
  /** 이 사람이 보기에, 남은 카드 중 그 종류가 얼마나 남았나 (0~1) */
  plausible(p, kind) {
    const seen = this.known(p);
    const leftOfKind = R.PER_KIND - seen[kind];
    const total = KIND_IDS.reduce((s, k) => s + (R.PER_KIND - seen[k]), 0) || 1;
    return leftOfKind / total;
  }

  botStep(p) {
    if (this.phase !== 'play') return;
    if (this.stage === 'offer' && p === this.cur()) return this.botOffer(p);
    if (this.stage === 'reply' && this.pending && this.pending.to === p.pid) return this.botReply(p);
    return null;
  }

  /** 누구에게 밀까: 위험한(3장 모인) 사람 · 카드가 적은 사람을 노린다 */
  botTarget(p, exclude = []) {
    const cands = this.players.filter((q) => q !== p && !R.deadKind(q.pile) && !exclude.includes(q.pid));
    if (!cands.length) return null;
    const score = (q) => {
      const t = tally(q.pile);
      const near = Math.max(0, ...KIND_IDS.map((k) => t[k] || 0));
      return near * 2 + (q.pile.length * 0.3) + (q.isBot ? 0 : 0.6) + Math.random();
    };
    return cands.sort((a, b) => score(b) - score(a))[0];
  }

  botOffer(p) {
    const target = this.botTarget(p);
    if (!target) return null;
    const danger = R.dangerKinds(target.pile);       // 한 장 더 받으면 죽는 종류
    const myTally = tally(p.hand.map((id) => id));
    // 손에 많이 든 종류부터 털어낸다
    const byCount = KIND_IDS.filter((k) => myTally[k]).sort((a, b) => myTally[b] - myTally[a]);
    const killKind = danger.find((k) => myTally[k]);  // 죽일 수 있는 진짜 카드가 있으면
    let card;
    let claim;
    const bluff = Math.random();
    if (killKind && bluff < 0.75) {
      // 진짜 그 벌레를 주면서 다른 이름을 댄다 (상대가 "아니다" 하면 상대가 먹는다)
      card = p.hand.find((id) => kindOf(id) === killKind);
      claim = Math.random() < 0.55 ? killKind : pick(KIND_IDS.filter((k) => k !== killKind));
    } else if (bluff < 0.45) {
      // 정직하게
      card = p.hand.find((id) => kindOf(id) === (byCount[0] || kindOf(p.hand[0])));
      claim = kindOf(card);
    } else {
      // 거짓말: 그럴듯한(아직 많이 안 나온) 이름을 댄다
      card = p.hand.find((id) => kindOf(id) === (byCount[0] || kindOf(p.hand[0]))) || p.hand[0];
      const real = kindOf(card);
      const names = KIND_IDS.filter((k) => k !== real).sort((a, b) => this.plausible(p, b) - this.plausible(p, a));
      claim = names[rand(Math.min(3, names.length))];
    }
    if (!card) card = p.hand[0];
    if (!claim) claim = kindOf(card);
    return this.offer(p, { card, claim, to: target.pid });
  }

  botReply(p) {
    const pd = this.pending;
    const iDie = R.dangerKinds(p.pile).includes(pd.claim);   // 말대로라면 내가 죽는다
    const canPass = this.canPass(p);
    // 아직 안 본 카드고, 넘길 사람이 있으면 종종 훔쳐보고 떠넘긴다
    if (!pd.peeked && canPass && (iDie ? Math.random() < 0.85 : Math.random() < 0.45 + pd.hops * 0.1)) {
      this.peek(p);
      const real = pd.kind;
      const next = this.botTarget(p, pd.seen);
      if (next) {
        const danger = R.dangerKinds(next.pile);
        let claim;
        if (danger.includes(real) && Math.random() < 0.6) claim = real;            // 사실대로 밀어 죽이기
        else if (Math.random() < 0.5) claim = real;                                // 정직
        else claim = pick(KIND_IDS.filter((k) => k !== real));                     // 거짓
        const r = this.passOn(p, { claim, to: next.pid });
        if (r.ok) return r;
      }
    }
    // 답한다: 그럴듯함 + 상대가 나를 죽이려 한다는 낌새 + 약간의 변덕
    const seen = this.known(p);
    const leftOfClaim = R.PER_KIND - seen[pd.claim];
    let believeP = 0.5;
    if (leftOfClaim <= 0) believeP = 0.05;                       // 그 벌레는 이미 다 봤다 → 거짓말
    else believeP = 0.28 + this.plausible(p, pd.claim) * 1.6;
    if (iDie) believeP -= 0.3;                                   // 죽는 소리면 의심부터
    if (pd.hops > 0) believeP -= 0.12;                           // 돌고 돌아온 카드는 수상하다
    believeP = Math.max(0.06, Math.min(0.9, believeP));
    return this.guess(p, Math.random() < believeP);
  }

  /* ── 화면용 ─────────────────────────────────────────────── */
  viewFor(pid) {
    const me = this.pl(pid);
    const pd = this.pending;
    const showCard = !!pd && (pd.peeked && pd.to === pid);
    return {
      id: this.id,
      phase: this.phase,
      stage: this.stage,
      round: this.round,
      turn: this.cur().pid,
      actor: this.actor() ? this.actor().pid : null,
      kinds: KIND_IDS,
      pending: pd ? {
        from: pd.from, to: pd.to, claim: pd.claim, hops: pd.hops, seen: pd.seen, peeked: !!pd.peeked,
        card: showCard || this.phase === 'over' ? pd.card : null,
        canPass: pd.to === pid ? this.canPass(this.pl(pid)) : false,
      } : null,
      reveal: this.reveal,
      hand: me ? me.hand.slice().sort() : [],
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, seat: p.seat,
        online: p.isBot || this.hooks.isOnline(p.pid),
        hand: p.hand.length, pile: p.pile, tally: tally(p.pile),
        danger: R.dangerKinds(p.pile), dead: R.deadKind(p.pile),
        caught: p.caught, fooled: p.fooled,
      })),
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      deadlineTotal: this.deadlineTotal,
      log: this.log,
      events: this.events,
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
