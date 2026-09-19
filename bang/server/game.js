'use strict';
// 뱅 규칙 엔진: 서버가 모든 판정을 하고, 사람/봇에게 필요한 순간마다 선택을 요청한다
const crypto = require('crypto');
const B = require('../public/shared/bang');

const { TYPES } = B;
const T_PLAY = 90_000;
const T_RESP = 25_000;
const T_OFFLINE = 5_000;
const T_SETUP = 30_000;   // 캐릭터 고르는 시간
const LOG_MAX = 220;

const { dehydrate, rebuild } = require('../../hub/persist');
let PACE = 1;
const rand = (n) => crypto.randomInt(n);
const botDelay = (type) => (type === 'play' ? 850 + rand(650) : 550 + rand(500));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ok = () => ({ ok: true });
const err = (error) => ({ ok: false, error });

class Abort extends Error {}
class GameOver extends Error {
  constructor(result) {
    super('game over');
    this.result = result;
  }
}

class Game {
  /**
   * seats: [{ pid, name, isBot }] 좌석 순서대로 (4~7명)
   * hooks: { changed(), isOnline(pid) }
   */
  constructor(seats, hooks) {
    this.hooks = hooks;
    this.id = crypto.randomBytes(6).toString('hex');
    const roles = shuffle([...B.ROLE_SETS[seats.length]]);
    // 실제 뱅처럼 각자 캐릭터 2장을 받고 그중 1명을 고른다 (겹치지 않게 나눠 준다)
    const chars = shuffle(B.CHARACTERS.map((c) => c.id));
    this.players = seats.map((s, i) => ({
      pid: s.pid, name: s.name, isBot: !!s.isBot, seat: i,
      role: roles[i],
      charChoices: [chars[i * 2], chars[i * 2 + 1]],
      char: null, maxHp: 0, hp: 0, hand: [], equip: [], alive: true,
    }));
    this.deck = shuffle(B.DECK.map((c) => ({ ...c })));
    this.discard = [];
    this.limbo = [];
    this.store = null;
    this.log = [];
    this.logSeq = 0;
    this.events = [];
    this.seq = 0;
    this.prompt = null;
    this.promptSeq = 0;
    this.turn = null;
    this.turnNo = 0;
    this.hostile = new Map();
    this.over = null;
    this.dead = false;
    this.phase = 'setup';
    this.setupTimer = null;
    this.setupDeadline = 0;

    this.turnIdx = this.players.findIndex((p) => p.role === 'sheriff');
    this.addLog('story', '황야의 마을에 총성이 울립니다. 보안관은 모두에게 공개되고, 나머지 역할은 비밀입니다.');
    this.addLog('story', '각자 받은 캐릭터 2명 중 한 명을 고르세요.');

    // ── 캐릭터 고르기 (모두 동시에)
    this.phase = 'setup';
    this.setupDeadline = Date.now() + T_SETUP;
    this.setupTimer = setTimeout(() => this.finishSetup(), T_SETUP);
    for (const p of this.players) {
      if (!p.isBot) continue;
      setTimeout(() => this.pickChar(p.pid, this.botPickChar(p)), (400 + rand(900)) * PACE);
    }
    this.changed();
  }

  /** 봇은 체력이 높고 능력이 센 쪽을 고른다 */
  botPickChar(p) {
    const score = (id) => {
      const c = B.CHAR[id];
      const bonus = { will: 3, cole: 3, vic: 2, jordan: 2, ben: 2, kit: 2, luke: 1, janet: 1, rose: 1 }[id] || 0;
      return c.hp * 2 + bonus + rand(2);
    };
    const [a, b] = p.charChoices;
    return score(a) >= score(b) ? a : b;
  }

  /** 사람이 캐릭터를 골랐을 때 */
  pickChar(pid, charId) {
    if (this.dead || this.phase !== 'setup') return err('지금은 캐릭터를 고를 수 없습니다');
    const p = this.pl(pid);
    if (!p) return err('참가자가 아닙니다');
    if (p.char) return err('이미 골랐습니다');
    if (!p.charChoices.includes(charId)) return err('내가 받은 캐릭터가 아닙니다');
    p.char = charId;
    if (this.players.every((q) => q.char)) {
      clearTimeout(this.setupTimer);
      this.finishSetup();
    } else {
      this.changed();
    }
    return ok();
  }

  /** 아직 안 고른 사람은 첫 번째 캐릭터로 정하고 게임을 시작한다 */
  finishSetup() {
    if (this.dead || this.phase !== 'setup') return;
    clearTimeout(this.setupTimer);
    for (const p of this.players) {
      if (!p.char) p.char = p.charChoices[0];
      p.maxHp = B.CHAR[p.char].hp + (p.role === 'sheriff' ? 1 : 0);
      p.hp = p.maxHp;
      this.addLog('ability', `{p:${p.pid}} ${B.CHAR[p.char].name} 선택 (체력 ${p.maxHp})`);
    }
    this.phase = 'play';
    const sheriff = this.players.find((p) => p.role === 'sheriff');
    this.event({ type: 'sheriff', pid: sheriff.pid });
    this.addLog('win', `{p:${sheriff.pid}} 님이 {r:sheriff}입니다! 보안관부터 시작합니다`);
    for (const p of this.players) this.give(p, p.hp);
    this.changed();
    setImmediate(() => this.run());
  }

  // ───────────────────────── 유틸

  pl(pid) {
    return this.players.find((p) => p.pid === pid);
  }
  alive() {
    return this.players.filter((p) => p.alive);
  }
  changed() {
    if (!this.dead) this.hooks.changed();
  }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 60) this.events.shift();
  }
  addLog(kind, text) {
    this.log.push({ n: ++this.logSeq, kind, text });
    if (this.log.length > LOG_MAX) this.log.shift();
  }
  pause(ms) {
    return new Promise((resolve, reject) => {
      const go = () => (this.dead ? reject(new Abort()) : resolve());
      if (PACE === 0) setImmediate(go);
      else setTimeout(go, ms * PACE);
    });
  }
  nextIdx(i) {
    const n = this.players.length;
    for (let k = 1; k <= n; k++) {
      const j = (i + k) % n;
      if (this.players[j].alive) return j;
    }
    return i;
  }
  othersFrom(p) {
    const n = this.players.length;
    const i = this.players.indexOf(p);
    const out = [];
    for (let k = 1; k < n; k++) {
      const q = this.players[(i + k) % n];
      if (q.alive) out.push(q);
    }
    return out;
  }
  hostility(a, b, w) {
    if (!a || !b || a === b) return;
    if (!this.hostile.has(a.pid)) this.hostile.set(a.pid, new Map());
    const m = this.hostile.get(a.pid);
    m.set(b.pid, (m.get(b.pid) || 0) + w);
  }
  drawCard() {
    if (!this.deck.length) {
      if (this.discard.length <= 1) return null;
      const top = this.discard.pop();
      this.deck = shuffle(this.discard);
      this.discard = [top];
      this.event({ type: 'reshuffle' });
      this.addLog('system', '덱을 다 써서 버린 카드를 섞어 새 덱을 만들었습니다');
    }
    return this.deck.pop();
  }
  give(p, n) {
    const got = [];
    for (let i = 0; i < n; i++) {
      const c = this.drawCard();
      if (!c) break;
      p.hand.push(c);
      got.push(c);
    }
    if (got.length) this.event({ type: 'draw', pid: p.pid, cards: got, vis: [p.pid] });
    return got;
  }
  takeFromHand(p, id) {
    const i = p.hand.findIndex((c) => c.id === id);
    return i < 0 ? null : p.hand.splice(i, 1)[0];
  }
  takeEquip(p, id) {
    const i = p.equip.findIndex((c) => c.id === id);
    return i < 0 ? null : p.equip.splice(i, 1)[0];
  }
  afterLoss(p) {
    if (p.alive && p.char === 'suzy' && p.hand.length === 0 && !this.over) {
      if (this.give(p, 1).length) this.addLog('ability', `{p:${p.pid}} 행운의 수지 능력으로 1장 뽑음`);
    }
  }
  heal(p, n) {
    if (!p.alive || p.hp >= p.maxHp) return;
    p.hp = Math.min(p.maxHp, p.hp + n);
    this.event({ type: 'heal', pid: p.pid });
    this.addLog('good', `{p:${p.pid}} 체력 회복 (체력 ${p.hp})`);
  }

  // ───────────────────────── 선택 요청 (사람은 화면, 봇은 AI, 자리 비우면 자동)

  ask(p, type, data = {}, ms = T_RESP) {
    if (this.dead) return Promise.reject(new Abort());
    // 카드 낼 차례 = 진행 중인 효과가 없는 안전한 순간 → 여기서 저장해 둔다
    if (type === 'play') this.safeSnap = { ...dehydrate(this, ['prompt', 'setupTimer', 'safeSnap']), resumeAt: 'play' };
    return new Promise((resolve, reject) => {
      this.prompt = { id: ++this.promptSeq, pid: p.pid, type, data, ms, resolve, reject, timer: null, deadline: null, online: null };
      this.armPrompt();
      this.changed();
    });
  }

  armPrompt() {
    const pr = this.prompt;
    if (!pr) return;
    clearTimeout(pr.timer);
    const p = this.pl(pr.pid);
    if (p.isBot) {
      pr.deadline = null;
      const run = () => this.settle(pr, this.decide(p, pr.type, pr.data));
      if (PACE === 0) setImmediate(run);
      else pr.timer = setTimeout(run, botDelay(pr.type) * PACE);
      return;
    }
    const online = this.hooks.isOnline(p.pid);
    const ms = online ? pr.ms : Math.min(pr.ms, T_OFFLINE);
    pr.online = online;
    pr.deadline = Date.now() + ms;
    pr.timer = setTimeout(() => this.settle(pr, pr.type === 'play' ? { type: 'end' } : this.decide(p, pr.type, pr.data)), ms);
  }

  settle(pr, value) {
    if (this.prompt !== pr) return;
    const p = this.pl(pr.pid);
    let v = value;
    const bad = pr.type === 'play' ? (v && v.type !== 'end' && this.validatePlay(p, v)) : this.validateAnswer(p, pr, v);
    if (bad) {
      console.error('[자동 선택이 규칙에 맞지 않아 기본값 사용]', pr.type, bad);
      v = pr.type === 'play' ? { type: 'end' } : this.safeDefault(p, pr);
    }
    clearTimeout(pr.timer);
    this.prompt = null;
    pr.resolve(v);
  }

  safeDefault(p, pr) {
    switch (pr.type) {
      case 'dying': return { type: 'die' };
      case 'discard': return { cards: p.hand.slice(0, pr.data.count).map((c) => c.id) };
      case 'store': return { card: pr.data.cards[0].id };
      case 'kit': return { back: pr.data.cards[0].id };
      case 'jesse': case 'pedro': return { from: 'deck' };
      case 'draw': return { take: true };
      default: return { card: null };
    }
  }

  /** 소켓에서 들어온 사람의 응답 */
  answer(pid, payload) {
    const pr = this.prompt;
    if (this.over) return err('게임이 끝났습니다');
    if (!pr || pr.pid !== pid) return err('지금은 당신이 선택할 차례가 아닙니다');
    if (!payload || payload.promptId !== pr.id) return err('이미 지나간 요청입니다');
    const p = this.pl(pid);
    const e = pr.type === 'play' ? this.validatePlay(p, payload) : this.validateAnswer(p, pr, payload);
    if (e) return err(e);
    this.settle(pr, payload);
    return ok();
  }

  onPresence() {
    const pr = this.prompt;
    if (!pr) return;
    const p = this.pl(pr.pid);
    if (p.isBot) return;
    if (this.hooks.isOnline(p.pid) !== pr.online) {
      this.armPrompt();
      this.changed();
    }
  }

  // ───────────────────────── 게임 진행

  async run(resumeAt) {
    this.changed();
    try {
      for (;;) {
        if (this.dead) return;
        const p = this.players[this.turnIdx];
        if (p.alive) {
          try {
            if (resumeAt === 'play') {
              resumeAt = null;
              await this.playStage(p);
            } else await this.takeTurn(p);
          } catch (e) {
            if (e instanceof GameOver || e instanceof Abort) throw e;
            console.error('[차례 진행 중 오류 - 다음 사람으로 넘어갑니다]', e);
            this.prompt = null;
          }
        }
        this.turnIdx = this.nextIdx(this.turnIdx);
      }
    } catch (e) {
      if (e instanceof GameOver) this.finish(e.result);
      else if (!(e instanceof Abort)) console.error('[게임 오류]', e);
    }
  }

  async takeTurn(p) {
    this.turn = { pid: p.pid, stage: 'start', bangs: 0, no: ++this.turnNo };
    this.event({ type: 'turn', pid: p.pid });
    this.addLog('turn', `── {p:${p.pid}}의 차례 ──`);
    this.changed();
    await this.pause(300);

    const dyn = p.equip.find((c) => c.type === 'dynamite');
    if (dyn) {
      const { success } = await this.check(p, 'dynamite');
      this.takeEquip(p, dyn.id);
      if (!success) {
        this.discard.push(dyn);
        this.event({ type: 'explode', pid: p.pid });
        this.addLog('bad', `{p:${p.pid}} 앞의 {c:dynamite}가 폭발했습니다!`);
        this.changed();
        await this.damage(p, 3, null);
        if (!p.alive) return;
      } else {
        let q = this.players[this.nextIdx(this.players.indexOf(p))];
        let guard = 0;
        while (q !== p && B.hasEquip(q, 'dynamite') && guard++ < 8) q = this.players[this.nextIdx(this.players.indexOf(q))];
        q.equip.push(dyn);
        if (q !== p) {
          this.event({ type: 'equip', pid: q.pid, from: p.pid, card: dyn });
          this.addLog('move', `{c:dynamite}가 {p:${q.pid}}에게 넘어갔습니다`);
        }
      }
    }

    const jail = p.equip.find((c) => c.type === 'jail');
    if (jail) {
      const { success } = await this.check(p, 'jail');
      this.takeEquip(p, jail.id);
      this.discard.push(jail);
      this.event({ type: 'discard', pid: p.pid, cards: [jail], fromEquip: true });
      if (!success) {
        this.addLog('bad', `{p:${p.pid}} 감옥에서 나오지 못해 차례를 건너뜁니다`);
        this.changed();
        await this.pause(700);
        return;
      }
      this.addLog('good', `{p:${p.pid}} 감옥에서 탈출했습니다!`);
    }

    this.turn.stage = 'draw';
    await this.drawPhase(p);
    await this.playStage(p);
  }

  /** 카드 내기 → 손패 정리 (되살릴 때는 여기서부터 이어 한다) */
  async playStage(p) {
    this.turn.stage = 'play';
    this.changed();
    while (p.alive) {
      const act = await this.ask(p, 'play', {}, T_PLAY);
      if (act.type === 'end') break;
      if (act.type === 'sid') {
        this.sidHeal(p, act.cards);
        continue;
      }
      await this.playCard(p, act);
    }
    if (!p.alive) return;

    const excess = p.hand.length - p.hp;
    if (excess > 0) {
      this.turn.stage = 'discard';
      const res = await this.ask(p, 'discard', { count: excess });
      const cards = res.cards.map((id) => this.takeFromHand(p, id)).filter(Boolean);
      this.discard.push(...cards);
      this.event({ type: 'discard', pid: p.pid, cards });
      this.addLog('move', `{p:${p.pid}} 손패 제한으로 ${cards.length}장을 버렸습니다`);
    }
    this.turn.stage = 'end';
    this.changed();
  }

  /** 덱에서 카드를 가져온다 (자동) */
  async takeFromDeck(p, n) {
    return this.give(p, n);
  }

  async drawPhase(p) {
    if (p.char === 'jesse') {
      const targets = this.alive().filter((q) => q !== p && q.hand.length);
      if (targets.length) {
        const res = await this.ask(p, 'jesse', { targets: targets.map((q) => q.pid) });
        if (res.from !== 'deck') {
          const q = this.pl(res.from);
          const c = q.hand.splice(rand(q.hand.length), 1)[0];
          p.hand.push(c);
          this.event({ type: 'steal', from: q.pid, to: p.pid, cards: [c], vis: [p.pid, q.pid] });
          this.addLog('ability', `{p:${p.pid}} {p:${q.pid}}의 손패에서 1장을 가져왔습니다`);
          this.afterLoss(q);
          await this.takeFromDeck(p, 1);
          return;
        }
      }
    }
    if (p.char === 'pedro' && this.discard.length) {
      const res = await this.ask(p, 'pedro', { top: this.discard[this.discard.length - 1] });
      if (res.from === 'discard') {
        const c = this.discard.pop();
        p.hand.push(c);
        this.event({ type: 'take', pid: p.pid, cards: [c] });
        this.addLog('ability', `{p:${p.pid}} 버린 더미에서 {c:${c.type}}를 가져왔습니다`);
        await this.takeFromDeck(p, 1);
        return;
      }
    }
    if (p.char === 'kit') {
      const cards = [this.drawCard(), this.drawCard(), this.drawCard()].filter(Boolean);
      if (cards.length <= 2) {
        p.hand.push(...cards);
        if (cards.length) this.event({ type: 'draw', pid: p.pid, cards, vis: [p.pid] });
        return;
      }
      this.limbo = cards;
      const res = await this.ask(p, 'kit', { cards });
      const back = cards.find((c) => c.id === res.back) || cards[2];
      this.limbo = [];
      this.deck.push(back);
      const keep = cards.filter((c) => c !== back);
      p.hand.push(...keep);
      this.event({ type: 'draw', pid: p.pid, cards: keep, vis: [p.pid] });
      this.addLog('ability', `{p:${p.pid}} 3장 중 2장을 골랐습니다`);
      return;
    }
    if (p.char === 'jack') {
      const got = await this.takeFromDeck(p, 2);
      if (got[1]) {
        this.event({ type: 'reveal', pid: p.pid, card: got[1] });
        const red = got[1].suit === 'H' || got[1].suit === 'D';
        this.addLog('ability', `{p:${p.pid}} 두 번째 카드 공개: {c:${got[1].type}} (${B.SUIT_NAME[got[1].suit]})${red ? ' → 1장 더!' : ''}`);
        if (red) await this.takeFromDeck(p, 1);
      }
      return;
    }
    await this.takeFromDeck(p, 2);
  }

  /** 판정! 덱 맨 위를 뒤집는다. 루크는 2장 중 유리한 쪽 */
  async check(p, reason) {
    const good = {
      barrel: (c) => c.suit === 'H',
      jail: (c) => c.suit === 'H',
      dynamite: (c) => !(c.suit === 'S' && c.rank >= 2 && c.rank <= 9),
    }[reason];
    const cards = [this.drawCard()];
    if (p.char === 'luke') cards.push(this.drawCard());
    const real = cards.filter(Boolean);
    if (!real.length) return { success: reason === 'dynamite', card: null };
    let chosen = real[0];
    if (real.length === 2 && !good(real[0]) && good(real[1])) chosen = real[1];
    const success = good(chosen);
    this.discard.push(...real.filter((c) => c !== chosen), chosen);
    this.event({ type: 'check', pid: p.pid, reason, cards: real, chosen: chosen.id, success });
    const label = { barrel: '술통', jail: '감옥', dynamite: '다이너마이트' }[reason];
    this.addLog(success ? 'good' : 'bad', `{p:${p.pid}} ${label} 판정: ${B.SUIT_NAME[chosen.suit]} ${B.rankLabel(chosen.rank)} → ${success ? '성공' : '실패'}`);
    this.changed();
    await this.pause(1100);
    return { success, card: chosen };
  }

  validatePlay(p, a) {
    if (!a || typeof a !== 'object') return '잘못된 요청입니다';
    if (a.type === 'end') return null;
    if (a.type === 'sid') {
      if (p.char !== 'sid') return '약초꾼 시드만 쓸 수 있는 능력입니다';
      if (p.hp >= p.maxHp) return '체력이 이미 가득 찼어요';
      if (!Array.isArray(a.cards) || a.cards.length !== 2 || a.cards[0] === a.cards[1] || !a.cards.every((id) => p.hand.some((c) => c.id === id))) return '버릴 카드 2장을 고르세요';
      return null;
    }
    if (a.type !== 'play') return '알 수 없는 행동입니다';
    const card = p.hand.find((c) => c.id === a.card);
    if (!card) return '손에 없는 카드입니다';
    const type = p.char === 'janet' && card.type === 'missed' ? 'bang' : card.type;
    const t = a.target ? this.pl(a.target) : null;
    const needTarget = () => (!t || !t.alive || t === p ? '대상을 골라주세요' : null);
    switch (type) {
      case 'missed':
        return '빗나감!은 총을 맞았을 때만 낼 수 있어요';
      case 'bang': {
        const e = needTarget();
        if (e) return e;
        if (this.turn.bangs >= 1 && !B.hasEquip(p, 'volcanic') && p.char !== 'will') return '뱅!은 차례마다 한 번만 쓸 수 있어요';
        const d = B.distance(this.players, p, t);
        const r = B.weaponRange(p);
        if (d > r) return `사거리가 부족해요 (거리 ${d}, 내 사거리 ${r})`;
        return null;
      }
      case 'beer':
        if (this.alive().length <= 2) return '두 명만 남으면 맥주는 효과가 없어요';
        if (p.hp >= p.maxHp) return '체력이 이미 가득 찼어요';
        return null;
      case 'panic':
      case 'catbalou': {
        const e = needTarget();
        if (e) return e;
        if (type === 'panic' && B.distance(this.players, p, t) > 1) return '강탈!은 거리 1 이내에만 쓸 수 있어요';
        if (a.targetCard === 'hand') return t.hand.length ? null : '상대의 손패가 없어요';
        return t.equip.some((c) => c.id === a.targetCard) ? null : '가져올 카드를 골라주세요';
      }
      case 'duel':
        return needTarget();
      case 'jail': {
        const e = needTarget();
        if (e) return e;
        if (t.role === 'sheriff') return '보안관은 감옥에 가둘 수 없어요';
        if (B.hasEquip(t, 'jail')) return '이미 감옥에 갇혀 있어요';
        return null;
      }
      case 'dynamite':
        return B.hasEquip(p, 'dynamite') ? '이미 다이너마이트가 있어요' : null;
      case 'barrel':
      case 'scope':
      case 'mustang':
        return B.hasEquip(p, type) ? '같은 장비는 하나만 놓을 수 있어요' : null;
      default:
        return null;
    }
  }

  validateAnswer(p, pr, a) {
    if (!a || typeof a !== 'object') return '잘못된 응답입니다';
    const inHand = (id) => p.hand.find((c) => c.id === id);
    switch (pr.type) {
      case 'missed': {
        if (!a.card) return null;
        const c = inHand(a.card);
        return c && B.isMissLike(p, c) ? null : '빗나감! 카드를 골라주세요';
      }
      case 'indians':
      case 'duel': {
        if (!a.card) return null;
        const c = inHand(a.card);
        return c && B.isBangLike(p, c) ? null : '뱅! 카드를 골라주세요';
      }
      case 'dying':
        if (a.type === 'die') return null;
        if (a.type === 'beer') {
          const c = inHand(a.card);
          return c && c.type === 'beer' && this.alive().length > 2 ? null : '맥주 카드를 골라주세요';
        }
        if (a.type === 'sid') {
          return p.char === 'sid' && Array.isArray(a.cards) && a.cards.length === 2 && a.cards[0] !== a.cards[1] && a.cards.every(inHand) ? null : '버릴 카드 2장을 고르세요';
        }
        return '잘못된 응답입니다';
      case 'discard':
        return Array.isArray(a.cards) && a.cards.length === pr.data.count && new Set(a.cards).size === a.cards.length && a.cards.every(inHand)
          ? null : `버릴 카드 ${pr.data.count}장을 고르세요`;
      case 'store':
        return pr.data.cards.some((c) => c.id === a.card) ? null : '가져갈 카드를 고르세요';
      case 'kit':
        return pr.data.cards.some((c) => c.id === a.back) ? null : '덱에 돌려놓을 카드를 고르세요';
      case 'jesse':
        return a.from === 'deck' || pr.data.targets.includes(a.from) ? null : '가져올 곳을 고르세요';
      case 'pedro':
        return a.from === 'deck' || a.from === 'discard' ? null : '가져올 곳을 고르세요';
      case 'draw':
        return null;
      default:
        return '알 수 없는 요청입니다';
    }
  }

  async playCard(p, a) {
    const card = this.takeFromHand(p, a.card);
    const type = p.char === 'janet' && card.type === 'missed' ? 'bang' : card.type;
    const t = a.target ? this.pl(a.target) : null;
    if (TYPES[card.type].kind === 'blue') {
      this.equipCard(p, card, t);
      this.afterLoss(p);
      this.changed();
      await this.pause(500);
      return;
    }
    this.discard.push(card);
    this.event({ type: 'play', pid: p.pid, card, target: t ? t.pid : null });
    this.addLog('play', `{p:${p.pid}} {c:${card.type}}${type !== card.type ? '(뱅!으로)' : ''}${t ? ` → {p:${t.pid}}` : ''}`);
    this.changed();
    await this.pause(550);

    switch (type) {
      case 'bang':
        this.turn.bangs++;
        this.hostility(p, t, 2);
        await this.shoot(p, t, p.char === 'cole' ? 2 : 1);
        break;
      case 'beer':
        this.heal(p, 1);
        break;
      case 'saloon':
        for (const q of this.alive()) this.heal(q, 1);
        break;
      case 'stagecoach':
        this.give(p, 2);
        break;
      case 'wellsfargo':
        this.give(p, 3);
        break;
      case 'panic':
      case 'catbalou': {
        this.hostility(p, t, 1);
        const fromHand = a.targetCard === 'hand';
        const taken = fromHand ? t.hand.splice(rand(t.hand.length), 1)[0] : this.takeEquip(t, a.targetCard);
        if (type === 'panic') {
          p.hand.push(taken);
          this.event(fromHand ? { type: 'steal', from: t.pid, to: p.pid, cards: [taken], vis: [p.pid, t.pid] } : { type: 'steal', from: t.pid, to: p.pid, cards: [taken], fromEquip: true });
          this.addLog('play', `{p:${p.pid}} {p:${t.pid}}의 ${fromHand ? '손패 1장' : `{c:${taken.type}}`}을 빼앗았습니다`);
        } else {
          this.discard.push(taken);
          this.event({ type: 'discard', pid: t.pid, cards: [taken], fromEquip: !fromHand });
          this.addLog('play', `{p:${t.pid}} {c:${taken.type}}를 버렸습니다`);
        }
        this.afterLoss(t);
        break;
      }
      case 'gatling':
        for (const q of this.othersFrom(p)) if (q.alive) await this.shoot(p, q, 1);
        break;
      case 'indians':
        for (const q of this.othersFrom(p)) if (q.alive) await this.indians(p, q);
        break;
      case 'duel':
        this.hostility(p, t, 2);
        await this.duel(p, t);
        break;
      case 'store':
        await this.generalStore(p);
        break;
      default:
    }
    this.afterLoss(p);
    this.changed();
  }

  equipCard(p, card, t) {
    if (card.type === 'jail') {
      t.equip.push(card);
      this.hostility(p, t, 2);
      this.event({ type: 'equip', pid: t.pid, from: p.pid, card });
      this.addLog('play', `{p:${p.pid}} {p:${t.pid}}을(를) {c:jail}에 가뒀습니다`);
      return;
    }
    if (TYPES[card.type].weapon) {
      const old = p.equip.find((c) => TYPES[c.type].weapon);
      if (old) {
        this.takeEquip(p, old.id);
        this.discard.push(old);
        this.event({ type: 'discard', pid: p.pid, cards: [old], fromEquip: true });
      }
    }
    p.equip.push(card);
    this.event({ type: 'equip', pid: p.pid, from: p.pid, card });
    this.addLog('play', `{p:${p.pid}} {c:${card.type}} 장착`);
  }

  async shoot(src, t, need) {
    this.event({ type: 'shot', from: src.pid, to: t.pid });
    this.changed();
    const barrels = (B.hasEquip(t, 'barrel') ? 1 : 0) + (t.char === 'jordan' ? 1 : 0);
    for (let i = 0; i < barrels && need > 0; i++) {
      const { success } = await this.check(t, 'barrel');
      if (success) need--;
    }
    while (need > 0 && t.alive && t.hand.some((c) => B.isMissLike(t, c))) {
      const res = await this.ask(t, 'missed', { from: src.pid, need });
      const c = res && res.card ? this.takeFromHand(t, res.card) : null;
      if (!c) break;
      this.discard.push(c);
      this.event({ type: 'play', pid: t.pid, card: c, response: true });
      this.addLog('good', `{p:${t.pid}} {c:${c.type}}로 총알을 피했습니다`);
      need--;
      this.afterLoss(t);
      this.changed();
    }
    if (need > 0) await this.damage(t, 1, src);
  }

  async indians(src, t) {
    if (t.hand.some((c) => B.isBangLike(t, c))) {
      const res = await this.ask(t, 'indians', { from: src.pid });
      const c = res && res.card ? this.takeFromHand(t, res.card) : null;
      if (c) {
        this.discard.push(c);
        this.event({ type: 'play', pid: t.pid, card: c, response: true });
        this.addLog('good', `{p:${t.pid}} {c:${c.type}}를 버려 습격을 막았습니다`);
        this.afterLoss(t);
        this.changed();
        return;
      }
    }
    await this.damage(t, 1, src);
  }

  async duel(src, t) {
    let cur = t;
    let other = src;
    for (;;) {
      let c = null;
      if (cur.hand.some((x) => B.isBangLike(cur, x))) {
        const res = await this.ask(cur, 'duel', { vs: other.pid });
        c = res && res.card ? this.takeFromHand(cur, res.card) : null;
      }
      if (!c) {
        this.addLog('bad', `{p:${cur.pid}} 결투에서 졌습니다`);
        await this.damage(cur, 1, other);
        return;
      }
      this.discard.push(c);
      this.event({ type: 'play', pid: cur.pid, card: c, response: true });
      this.addLog('play', `{p:${cur.pid}} 결투에서 {c:${c.type}} 발사!`);
      this.afterLoss(cur);
      this.changed();
      [cur, other] = [other, cur];
    }
  }

  async generalStore(p) {
    const order = [p, ...this.othersFrom(p)];
    this.store = order.map(() => this.drawCard()).filter(Boolean);
    this.event({ type: 'store', cards: [...this.store] });
    this.changed();
    await this.pause(800);
    for (const q of order) {
      if (!this.store.length) break;
      if (!q.alive) continue;
      let pick = this.store[0];
      if (this.store.length > 1) {
        const res = await this.ask(q, 'store', { cards: [...this.store] });
        pick = this.store.find((c) => c.id === res.card) || this.store[0];
      }
      this.store = this.store.filter((c) => c !== pick);
      q.hand.push(pick);
      this.event({ type: 'pick', pid: q.pid, cards: [pick] });
      this.addLog('move', `{p:${q.pid}} 잡화점에서 {c:${pick.type}}를 가져갔습니다`);
      this.changed();
      await this.pause(350);
    }
    if (this.store.length) this.discard.push(...this.store);
    this.store = null;
  }

  sidHeal(p, ids) {
    const cards = ids.map((id) => this.takeFromHand(p, id)).filter(Boolean);
    this.discard.push(...cards);
    this.event({ type: 'discard', pid: p.pid, cards });
    this.addLog('ability', `{p:${p.pid}} 카드 2장을 버리고 약초를 먹었습니다`);
    this.heal(p, 1);
    this.afterLoss(p);
    this.changed();
  }

  async damage(t, n, src) {
    for (let i = 0; i < n && t.alive; i++) {
      t.hp--;
      this.event({ type: 'damage', pid: t.pid, src: src ? src.pid : null });
      if (t.hp > 0) {
        if (t.char === 'ben' && this.give(t, 1).length) this.addLog('ability', `{p:${t.pid}} 악바리 능력으로 1장 뽑음`);
        if (t.char === 'lobo' && src && src !== t && src.alive && src.hand.length) {
          const c = src.hand.splice(rand(src.hand.length), 1)[0];
          t.hand.push(c);
          this.event({ type: 'steal', from: src.pid, to: t.pid, cards: [c], vis: [t.pid, src.pid] });
          this.addLog('ability', `{p:${t.pid}} 엘 로보 능력으로 {p:${src.pid}}의 손패 1장을 빼앗음`);
          this.afterLoss(src);
        }
      }
    }
    this.addLog('bad', `{p:${t.pid}} 체력 -${n} (남은 체력 ${Math.max(0, t.hp)})`);
    this.changed();
    await this.pause(450);
    if (t.hp <= 0) await this.dying(t, src);
  }

  async dying(t, src) {
    while (t.hp <= 0) {
      const canBeer = this.alive().length > 2 && t.hand.some((c) => c.type === 'beer');
      const canSid = t.char === 'sid' && t.hand.length >= 2;
      if (!canBeer && !canSid) break;
      const res = await this.ask(t, 'dying', { hp: t.hp });
      if (res.type === 'beer') {
        const c = this.takeFromHand(t, res.card);
        this.discard.push(c);
        this.event({ type: 'play', pid: t.pid, card: c, response: true });
        t.hp++;
        this.event({ type: 'heal', pid: t.pid });
        this.addLog('good', `{p:${t.pid}} 쓰러지기 직전 {c:beer}를 마시고 버텼습니다!`);
      } else if (res.type === 'sid') {
        const cards = res.cards.map((id) => this.takeFromHand(t, id)).filter(Boolean);
        this.discard.push(...cards);
        this.event({ type: 'discard', pid: t.pid, cards });
        t.hp++;
        this.event({ type: 'heal', pid: t.pid });
        this.addLog('good', `{p:${t.pid}} 약초로 목숨을 건졌습니다!`);
      } else {
        break;
      }
      this.afterLoss(t);
      this.changed();
    }
    if (t.hp <= 0) await this.kill(t, src);
  }

  async kill(t, src) {
    t.alive = false;
    t.hp = 0;
    this.event({ type: 'death', pid: t.pid, role: t.role });
    this.addLog('death', `{p:${t.pid}} 사망! 정체는 {r:${t.role}}였습니다`);
    const cards = [...t.hand, ...t.equip];
    t.hand = [];
    t.equip = [];
    const vic = this.alive().find((q) => q.char === 'vic');
    if (vic && cards.length) {
      vic.hand.push(...cards);
      this.event({ type: 'steal', from: t.pid, to: vic.pid, cards, vis: [vic.pid] });
      this.addLog('ability', `{p:${vic.pid}} 대머리독수리 능력으로 유품 ${cards.length}장을 챙겼습니다`);
    } else if (cards.length) {
      this.discard.push(...cards);
      this.event({ type: 'discard', pid: t.pid, cards });
    }
    if (this.prompt && this.prompt.pid === t.pid) this.prompt = null;
    this.changed();
    this.checkWin();
    if (src && src.alive && src !== t) {
      if (t.role === 'outlaw') {
        this.give(src, 3);
        this.addLog('good', `{p:${src.pid}} 무법자를 처치한 현상금으로 3장을 받았습니다`);
      }
      if (t.role === 'deputy' && src.role === 'sheriff') {
        const all = [...src.hand, ...src.equip];
        src.hand = [];
        src.equip = [];
        this.discard.push(...all);
        this.event({ type: 'discard', pid: src.pid, cards: all });
        this.addLog('bad', `{p:${src.pid}} 부관을 쏜 벌로 모든 카드를 잃었습니다`);
        this.afterLoss(src);
      }
    }
    this.changed();
    await this.pause(1000);
  }

  checkWin() {
    const alive = this.alive();
    const sheriff = this.players.find((p) => p.role === 'sheriff');
    let winners = null;
    if (!sheriff.alive) {
      winners = alive.length === 1 && alive[0].role === 'renegade' ? ['renegade'] : ['outlaw'];
    } else if (!alive.some((p) => p.role === 'outlaw' || p.role === 'renegade')) {
      winners = ['sheriff', 'deputy'];
    }
    if (winners) throw new GameOver({ winners });
  }

  finish(result) {
    this.phase = 'over';
    this.over = {
      winners: result.winners,
      roles: this.players.map((p) => ({ pid: p.pid, role: p.role, alive: p.alive })),
    };
    if (this.prompt) {
      clearTimeout(this.prompt.timer);
      this.prompt = null;
    }
    const label = result.winners.includes('sheriff') ? '보안관과 부관' : result.winners.includes('renegade') ? '배신자' : '무법자';
    this.addLog('win', `게임 종료! ${label}의 승리입니다`);
    this.event({ type: 'over', winners: result.winners });
    this.changed();
  }

  // ───────────────────────── 봇 AI

  value(p, c) {
    const info = TYPES[c.type];
    if (info.kind === 'blue' && B.hasEquip(p, c.type)) return 1;
    if (info.weapon && c.type !== 'volcanic' && info.weapon <= B.weaponRange(p)) return 2;
    const base = {
      missed: 7, bang: 6, beer: p.hp < p.maxHp ? 8 : 5, panic: 6, catbalou: 5, stagecoach: 7, wellsfargo: 9, gatling: 7,
      indians: 6, duel: 5, store: 4, saloon: 4, barrel: 7, scope: 5, mustang: 6, jail: 5, dynamite: 1,
      volcanic: 4, schofield: 4, remington: 5, carabine: 5, winchester: 6,
    };
    return base[c.type] || 3;
  }
  worst(p, n) {
    return [...p.hand].sort((a, b) => this.value(p, a) - this.value(p, b)).slice(0, n);
  }

  enemyScore(p, q) {
    if (q === p || !q.alive) return -99;
    const sheriff = this.players.find((x) => x.role === 'sheriff');
    const suspicion = (x) => {
      const h = this.hostile.get(x.pid);
      if (!h) return 0;
      const toSheriff = h.get(sheriff.pid) || 0;
      let toOutlawish = 0;
      for (const [tid, w] of h) {
        const th = this.hostile.get(tid);
        if (tid !== sheriff.pid && th && (th.get(sheriff.pid) || 0) > 0) toOutlawish += w;
      }
      return toSheriff - toOutlawish * 0.7;
    };
    const late = this.turnNo > 70 ? 1.5 : 0;
    const known = !q.alive || q.role === 'sheriff';
    switch (p.role) {
      case 'sheriff':
        return suspicion(q) + late;
      case 'deputy':
        return known && q.role === 'sheriff' ? -10 : suspicion(q) + late;
      case 'outlaw':
        return q.role === 'sheriff' ? 10 : -suspicion(q) + late * 0.5;
      case 'renegade': {
        const totalOutlaws = B.ROLE_SETS[this.players.length].filter((r) => r === 'outlaw').length;
        const deadOutlaws = this.players.filter((x) => !x.alive && x.role === 'outlaw').length;
        if (q.role === 'sheriff') return this.alive().length <= 2 ? 10 : -5;
        return deadOutlaws < totalOutlaws ? suspicion(q) + 0.5 : 5;
      }
      default:
        return 0;
    }
  }

  pickTargetCard(t) {
    const good = t.equip.find((c) => ['barrel', 'mustang', 'scope', 'volcanic', 'winchester', 'carabine', 'remington', 'schofield'].includes(c.type));
    if (good) return good.id;
    if (t.hand.length) return 'hand';
    return t.equip[0] ? t.equip[0].id : 'hand';
  }

  decide(p, type, data) {
    const pick = (fn) => p.hand.find(fn);
    switch (type) {
      case 'missed': {
        const c = pick((c) => c.type === 'missed') || pick((c) => B.isMissLike(p, c));
        return { card: c ? c.id : null };
      }
      case 'indians': {
        const c = pick((c) => c.type === 'bang') || pick((c) => B.isBangLike(p, c));
        return { card: c ? c.id : null };
      }
      case 'duel': {
        const c = pick((c) => B.isBangLike(p, c));
        return { card: c ? c.id : null };
      }
      case 'dying': {
        const beer = pick((c) => c.type === 'beer');
        if (beer && this.alive().length > 2) return { type: 'beer', card: beer.id };
        if (p.char === 'sid' && p.hand.length >= 2) return { type: 'sid', cards: this.worst(p, 2).map((c) => c.id) };
        return { type: 'die' };
      }
      case 'discard':
        return { cards: this.worst(p, data.count).map((c) => c.id) };
      case 'store':
        return { card: [...data.cards].sort((a, b) => this.value(p, b) - this.value(p, a))[0].id };
      case 'kit':
        return { back: [...data.cards].sort((a, b) => this.value(p, a) - this.value(p, b))[0].id };
      case 'jesse': {
        const qs = data.targets.map((id) => this.pl(id)).sort((a, b) => this.enemyScore(p, b) - this.enemyScore(p, a) || b.hand.length - a.hand.length);
        return { from: qs[0] && this.enemyScore(p, qs[0]) >= 0 ? qs[0].pid : 'deck' };
      }
      case 'pedro': {
        const top = this.discard[this.discard.length - 1];
        return { from: top && this.value(p, top) >= 6 ? 'discard' : 'deck' };
      }
      case 'draw':
        return { take: true };
      case 'play':
        return this.botPlay(p);
      default:
        return { card: null };
    }
  }

  botPlay(p) {
    const tryAct = (a) => (this.validatePlay(p, a) ? null : a);
    const hand = p.hand;
    const of = (type) => hand.filter((c) => c.type === type);
    const others = this.alive().filter((q) => q !== p);
    const enemies = others.map((q) => [q, this.enemyScore(p, q)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([q]) => q);

    for (const type of ['wellsfargo', 'stagecoach']) {
      const c = of(type)[0];
      if (c) return { type: 'play', card: c.id };
    }
    if (p.hp < p.maxHp) {
      const c = of('beer')[0];
      const a = c && tryAct({ type: 'play', card: c.id });
      if (a) return a;
    }
    if (p.char === 'sid' && p.hp <= p.maxHp - 2 && hand.length >= 4) return { type: 'sid', cards: this.worst(p, 2).map((c) => c.id) };

    for (const c of hand.filter((x) => TYPES[x.type].kind === 'blue')) {
      if (c.type === 'jail') {
        const t = enemies.find((q) => q.role !== 'sheriff' && !B.hasEquip(q, 'jail'));
        const a = t && tryAct({ type: 'play', card: c.id, target: t.pid });
        if (a) return a;
        continue;
      }
      if (c.type === 'dynamite') {
        if (rand(5) === 0) {
          const a = tryAct({ type: 'play', card: c.id });
          if (a) return a;
        }
        continue;
      }
      if (TYPES[c.type].weapon) {
        const cur = B.weaponRange(p);
        const better = c.type === 'volcanic'
          ? of('bang').length >= 2 && cur <= 1 && !B.hasEquip(p, 'volcanic')
          : TYPES[c.type].weapon > cur;
        if (better) return { type: 'play', card: c.id };
        continue;
      }
      const a = tryAct({ type: 'play', card: c.id });
      if (a) return a;
    }

    for (const t of enemies) {
      for (const c of [...of('panic'), ...of('catbalou')]) {
        const a = tryAct({ type: 'play', card: c.id, target: t.pid, targetCard: this.pickTargetCard(t) });
        if (a) return a;
      }
    }
    const missCount = hand.filter((c) => B.isMissLike(p, c)).length;
    for (const t of enemies) {
      for (const c of hand.filter((x) => x.type === 'bang' || (p.char === 'janet' && x.type === 'missed' && missCount > 1))) {
        const a = tryAct({ type: 'play', card: c.id, target: t.pid });
        if (a) return a;
      }
    }
    if (enemies.length) {
      const myBangs = hand.filter((c) => B.isBangLike(p, c)).length;
      for (const c of of('duel')) {
        const t = enemies[0];
        if (myBangs >= 1 || t.hand.length <= 1) {
          const a = tryAct({ type: 'play', card: c.id, target: t.pid });
          if (a) return a;
        }
      }
      for (const type of ['gatling', 'indians']) {
        const c = of(type)[0];
        if (c && (p.role === 'outlaw' || p.role === 'renegade' || enemies.length * 2 >= others.length)) return { type: 'play', card: c.id };
      }
    }
    const store = of('store')[0];
    if (store && hand.length <= 3) return { type: 'play', card: store.id };
    const saloon = of('saloon')[0];
    if (saloon && p.hp < p.maxHp) return { type: 'play', card: saloon.id };
    return { type: 'end' };
  }

  // ───────────────────────── 화면용 데이터

  eventFor(e, pid) {
    if (!e.vis || e.vis.includes(pid)) return e;
    const { cards, vis, ...rest } = e;
    return { ...rest, hidden: true, n: cards ? cards.length : 0 };
  }

  viewFor(pid) {
    const me = this.pl(pid);
    const pr = this.prompt;
    const over = !!this.over;
    return {
      id: this.id,
      phase: over ? 'over' : this.phase,
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, seat: p.seat, char: p.char, hp: p.hp, maxHp: p.maxHp, alive: p.alive,
        handCount: p.hand.length, equip: p.equip, online: p.isBot || this.hooks.isOnline(p.pid),
        role: p.role === 'sheriff' || !p.alive || over || p.pid === pid ? p.role : null,
        picked: !!p.char,
      })),
      setup: this.phase === 'setup' ? {
        choices: me ? me.charChoices : [],
        myPick: me ? me.char : null,
        deadlineIn: Math.max(0, this.setupDeadline - Date.now()),
        waiting: this.players.filter((p) => !p.char).map((p) => p.pid),
      } : null,
      me: me ? { pid, hand: me.hand, role: me.role } : null,
      deckCount: this.deck.length,
      discardTop: this.discard.length ? this.discard[this.discard.length - 1] : null,
      discardCount: this.discard.length,
      turn: this.turn && { pid: this.turn.pid, stage: this.turn.stage, bangs: this.turn.bangs, no: this.turn.no },
      store: this.store,
      prompt: pr && {
        id: pr.id, pid: pr.pid, type: pr.type,
        deadlineIn: pr.deadline ? Math.max(0, pr.deadline - Date.now()) : null,
        data: pr.type === 'kit' && pr.pid !== pid ? {} : pr.data,
      },
      log: this.log,
      events: this.events.map((e) => this.eventFor(e, pid)),
      over: this.over,
    };
  }

  /** 카드 총 80장이 어디론가 사라지거나 복제되지 않았는지 (시뮬레이션 검사용) */
  cardAudit() {
    const all = [...this.deck, ...this.discard, ...this.limbo, ...(this.store || [])];
    for (const p of this.players) all.push(...p.hand, ...p.equip);
    const ids = new Set(all.map((c) => c.id));
    return { total: all.length, unique: ids.size };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.setupTimer);
    const pr = this.prompt;
    this.prompt = null;
    if (pr) {
      clearTimeout(pr.timer);
      pr.reject(new Abort());
    }
  }
}

Game.setPace = (x) => { PACE = x; };

/* ── 서버가 다시 켜져도 이어 하기 */
Game.prototype.snapshot = function snapshot() {
  if (this.phase === 'setup') return { ...dehydrate(this, ['prompt', 'setupTimer', 'safeSnap']), resumeAt: 'setup' };
  if (this.over) return { ...dehydrate(this, ['prompt', 'setupTimer', 'safeSnap']), resumeAt: 'over' };
  return this.safeSnap || null;
};
Game.restore = function restore(data, hooks) {
  const g = rebuild(Game, data);
  const at = g.resumeAt;
  delete g.resumeAt;
  g.hooks = hooks;
  g.prompt = null;
  g.dead = false;
  g.safeSnap = null;
  if (at === 'setup') {
    const left = Math.max(4000, (g.setupDeadline || 0) - Date.now());
    g.setupDeadline = Date.now() + left;
    g.setupTimer = setTimeout(() => g.finishSetup(), left);
    for (const p of g.players) if (p.isBot && !p.char) setTimeout(() => g.pickChar(p.pid, g.botPickChar(p)), 600 + rand(900));
  } else if (at === 'play') {
    setImmediate(() => g.run('play'));
  }
  return g;
};

module.exports = Game;
