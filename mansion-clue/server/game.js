'use strict';
const crypto = require('crypto');
const C = require('../public/shared/data');

const TURN_MS = 90_000;
const SHOW_MS = 45_000;
const OFFLINE_TURN_MS = 12_000;
const LOG_MAX = 150;

const { dehydrate, rebuild } = require('../../hub/persist');
const rand = (n) => crypto.randomInt(n);
const pick = (a) => a[rand(a.length)];
let botDelay = () => 1000 + rand(900);
const CHAR_ORDER = C.SUSPECTS.map((s) => s.id);
const TYPE_IDS = {
  suspect: C.SUSPECTS.map((s) => s.id),
  weapon: C.WEAPONS.map((w) => w.id),
  room: C.ROOMS.map((r) => r.id),
};
const TYPE_RANK = { suspect: 0, weapon: 1, room: 2 };

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ok = () => ({ ok: true });
const err = (error) => ({ ok: false, error });

/** 한 플레이어가 아는 정보만으로 추리하는 두뇌 (봇 + 자리 비운 사람 대리용) */
class Brain {
  constructor(hand) {
    this.known = new Set(hand);
    this.solved = {};
    this.shownTo = new Map();
  }
  learn(card) {
    this.known.add(card);
  }
  unknown(type) {
    if (this.solved[type]) return [this.solved[type]];
    return TYPE_IDS[type].filter((id) => !this.known.has(id));
  }
  solution() {
    const s = this.unknown('suspect');
    const w = this.unknown('weapon');
    const r = this.unknown('room');
    return s.length === 1 && w.length === 1 && r.length === 1 ? { suspect: s[0], weapon: w[0], room: r[0] } : null;
  }
  noDisprove(sg) {
    for (const card of [sg.suspect, sg.weapon, sg.room]) {
      if (!this.known.has(card)) this.solved[C.CARDS[card].type] = card;
    }
  }
  chooseShow(matches, to) {
    const prev = this.shownTo.get(to) || new Set();
    const again = matches.filter((c) => prev.has(c));
    const card = again.length ? pick(again) : pick(matches);
    prev.add(card);
    this.shownTo.set(to, prev);
    return card;
  }
  suggestion() {
    return { type: 'suggest', suspect: pick(this.unknown('suspect')), weapon: pick(this.unknown('weapon')) };
  }
}

class Game {
  /**
   * seats: [{ pid, name, isBot, char }]
   * hooks: { changed(), isOnline(pid) }
   */
  constructor(seats, hooks) {
    this.hooks = hooks;
    this.id = crypto.randomBytes(6).toString('hex');
    this.players = seats
      .map((s) => ({ pid: s.pid, name: s.name, isBot: !!s.isBot, char: s.char, hand: [], out: false, left: false }))
      .sort((a, b) => CHAR_ORDER.indexOf(a.char) - CHAR_ORDER.indexOf(b.char));
    this.phase = 'play';
    this.log = [];
    this.events = [];
    this.seq = 0;
    this.logSeq = 0;
    this.timer = null;
    this.botTimer = null;
    this.deadline = null;
    this.actorOnline = null;
    this.accusations = [];
    this.winner = null;
    this.movedIn = new Set();
    this.intel = new Map();
    this.revealed = [];
    this.turnNo = 0;
    this.idx = -1;
    this.suggestion = null;

    this.deal();
    this.brains = new Map(this.players.map((p) => [p.pid, new Brain(p.hand)]));
    this.pos = {};
    for (const s of C.SUSPECTS) this.pos[s.id] = { cell: [...s.start] };
    this.wpos = {};
    const rooms = shuffle(C.ROOMS.map((r) => r.id));
    C.WEAPONS.forEach((w, i) => { this.wpos[w.id] = rooms[i]; });

    this.addLog('story', '폭풍우 치는 밤, 저택의 주인 도회장이 살해되었습니다. 범인은 이 안에 있습니다.');
    this.nextTurn();
  }

  deal() {
    this.solution = {
      suspect: pick(TYPE_IDS.suspect),
      weapon: pick(TYPE_IDS.weapon),
      room: pick(TYPE_IDS.room),
    };
    const sol = Object.values(this.solution);
    const deck = shuffle(Object.keys(C.CARDS).filter((id) => !sol.includes(id)));
    deck.forEach((card, i) => this.players[i % this.players.length].hand.push(card));
    for (const p of this.players) {
      p.hand.sort((a, b) => TYPE_RANK[C.CARDS[a].type] - TYPE_RANK[C.CARDS[b].type] || a.localeCompare(b));
    }
  }

  // ───────────────────────── 유틸

  player(pid) {
    return this.players.find((p) => p.pid === pid);
  }
  active() {
    return this.players.filter((p) => !p.out && !p.left);
  }
  changed() {
    this.hooks.changed();
  }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 40) this.events.shift();
  }
  addLog(kind, text) {
    this.log.push({ n: ++this.logSeq, kind, text, t: Date.now() });
    if (this.log.length > LOG_MAX) this.log.shift();
  }
  /** 타이머 콜백에서 오류가 나도 게임이 멈추지 않게 다음 차례로 넘긴다 */
  guard(fn) {
    return () => {
      try {
        fn();
      } catch (e) {
        console.error('[게임 진행 오류 - 다음 차례로 복구]', e);
        try {
          if (this.phase === 'play') this.nextTurn();
        } catch (e2) {
          console.error('[복구 실패]', e2);
        }
      }
    };
  }

  clearTimers() {
    clearTimeout(this.timer);
    clearTimeout(this.botTimer);
    this.timer = null;
    this.botTimer = null;
  }
  blockedFor(char) {
    const set = new Set();
    for (const [c, p] of Object.entries(this.pos)) if (c !== char && p.cell) set.add(C.key(p.cell[0], p.cell[1]));
    return set;
  }
  moveChar(char, dest, path) {
    this.pos[char] = dest;
    this.event({ type: 'move', char, path });
  }
  canSuggest(p) {
    const t = this.turn;
    const here = this.pos[p.char].room;
    if (!here || t.suggested) return false;
    return t.stage === 'room' || (t.stage === 'start' && this.movedIn.has(p.pid));
  }

  // ───────────────────────── 턴 진행

  nextTurn() {
    this.clearTimers();
    const n = this.players.length;
    for (let i = 1; i <= n; i++) {
      const j = (this.idx + i + n) % n;
      const p = this.players[j];
      if (!p.out && !p.left) {
        this.idx = j;
        break;
      }
    }
    const p = this.players[this.idx];
    this.turnNo++;
    this.turn = { pid: p.pid, stage: 'start', dice: null, reach: null, suggested: false, no: this.turnNo };
    this.suggestion = null;
    this.event({ type: 'turn', pid: p.pid });
    this.arm();
    this.changed();
  }

  /** 현재 행동해야 하는 사람 기준으로 타이머 / 봇 예약 */
  arm() {
    this.clearTimers();
    this.deadline = null;
    if (this.phase !== 'play') return;
    if (this.turn.stage === 'disprove') {
      const w = this.suggestion.waiting;
      const wp = this.player(w);
      const online = this.hooks.isOnline(w);
      this.actorOnline = online;
      if (wp.isBot) this.botTimer = setTimeout(this.guard(() => this.autoShow(w)), botDelay());
      else if (!online) this.botTimer = setTimeout(this.guard(() => this.autoShow(w)), 2500);
      this.deadline = Date.now() + SHOW_MS;
      this.timer = setTimeout(this.guard(() => this.autoShow(w)), SHOW_MS);
      return;
    }
    const p = this.player(this.turn.pid);
    if (p.isBot) {
      this.actorOnline = true;
      this.botTimer = setTimeout(this.guard(() => this.botStep()), botDelay());
      return;
    }
    const online = this.hooks.isOnline(p.pid);
    this.actorOnline = online;
    const ms = online ? TURN_MS : OFFLINE_TURN_MS;
    this.deadline = Date.now() + ms;
    this.timer = setTimeout(this.guard(() => this.timeout()), ms);
  }

  timeout() {
    if (this.phase !== 'play') return;
    if (this.turn.stage === 'disprove') return this.autoShow(this.suggestion.waiting);
    const p = this.player(this.turn.pid);
    this.addLog('system', `{p:${p.pid}} 시간 초과로 차례가 넘어갑니다`);
    this.nextTurn();
  }

  onPresence() {
    if (this.phase !== 'play') return;
    const actor = this.turn.stage === 'disprove' ? this.suggestion.waiting : this.turn.pid;
    const p = this.player(actor);
    if (!p || p.isBot) return;
    if (this.hooks.isOnline(actor) !== this.actorOnline) {
      this.arm();
      this.changed();
    }
  }

  // ───────────────────────── 행동

  act(pid, a) {
    if (this.phase !== 'play') return err('게임이 끝났습니다');
    const p = this.player(pid);
    if (!p || p.left) return err('이 게임의 참가자가 아닙니다');
    const type = a && a.type;
    if (type === 'show') return this.doShow(pid, a.card);
    if (this.turn.pid !== pid) return err('당신의 차례가 아닙니다');
    switch (type) {
      case 'roll': return this.doRoll(p);
      case 'passage': return this.doPassage(p);
      case 'move': return this.doMove(p, String(a.to || ''));
      case 'suggest': return this.doSuggest(p, a.suspect, a.weapon);
      case 'accuse': return this.doAccuse(p, a.suspect, a.weapon, a.room);
      case 'end': return this.doEnd();
      default: return err('알 수 없는 행동입니다');
    }
  }

  doRoll(p) {
    const t = this.turn;
    if (t.stage !== 'start') return err('지금은 주사위를 굴릴 수 없습니다');
    this.movedIn.delete(p.pid);
    t.dice = [1 + rand(6), 1 + rand(6)];
    t.reach = C.reachable(this.pos[p.char], t.dice[0] + t.dice[1], this.blockedFor(p.char));
    t.stage = 'move';
    this.event({ type: 'dice', pid: p.pid, dice: t.dice });
    if (!Object.keys(t.reach.cells).length && !Object.keys(t.reach.rooms).length) {
      t.stage = 'after';
      t.reach = null;
      this.addLog('system', `{p:${p.pid}} 길이 막혀 움직일 수 없습니다`);
    }
    this.arm();
    this.changed();
    return ok();
  }

  doPassage(p) {
    const t = this.turn;
    const here = this.pos[p.char].room;
    const to = here && C.ROOM[here].passage;
    if (t.stage !== 'start' || !to) return err('비밀 통로를 쓸 수 없습니다');
    this.movedIn.delete(p.pid);
    this.moveChar(p.char, { room: to }, ['room:' + to]);
    t.stage = 'room';
    this.addLog('move', `{p:${p.pid}} 비밀 통로로 {r:${to}}에 들어갔습니다`);
    this.arm();
    this.changed();
    return ok();
  }

  doMove(p, to) {
    const t = this.turn;
    if (t.stage !== 'move' || !t.reach) return err('지금은 이동할 수 없습니다');
    const isRoom = to.startsWith('room:');
    const path = isRoom ? t.reach.rooms[to.slice(5)] : t.reach.cells[to];
    if (!path) return err('그곳으로는 갈 수 없습니다');
    const dest = isRoom ? { room: to.slice(5) } : { cell: C.parseKey(to) };
    this.moveChar(p.char, dest, path);
    t.reach = null;
    if (isRoom) {
      t.stage = 'room';
      this.addLog('move', `{p:${p.pid}} {r:${dest.room}}에 들어갔습니다`);
    } else {
      t.stage = 'after';
    }
    this.arm();
    this.changed();
    return ok();
  }

  doSuggest(p, suspect, weapon) {
    const t = this.turn;
    const here = this.pos[p.char].room;
    if (!this.canSuggest(p)) return err('방 안에서, 차례마다 한 번만 추리할 수 있습니다');
    if (!C.SUSPECT[suspect] || !C.WEAPON[weapon]) return err('용의자와 흉기를 골라주세요');
    this.movedIn.delete(p.pid);

    if (this.pos[suspect].room !== here) {
      this.moveChar(suspect, { room: here }, ['room:' + here]);
      const dragged = this.players.find((x) => x.char === suspect);
      if (dragged && dragged.pid !== p.pid && !dragged.left) this.movedIn.add(dragged.pid);
    }
    if (this.wpos[weapon] !== here) {
      this.wpos[weapon] = here;
      this.event({ type: 'weapon', weapon, room: here });
    }
    this.suggestion = {
      by: p.pid, suspect, weapon, room: here,
      checks: [], waiting: null, matches: null, shownBy: null, card: null, none: false,
    };
    t.stage = 'disprove';
    t.suggested = true;
    this.addLog('suggest', `{p:${p.pid}} 추리: {s:${suspect}} · {w:${weapon}} · {r:${here}}`);
    this.event({ type: 'suggest', pid: p.pid, suspect, weapon, room: here });
    this.advanceDisprove();
    return ok();
  }

  advanceDisprove() {
    const sg = this.suggestion;
    const n = this.players.length;
    const byIdx = this.players.findIndex((x) => x.pid === sg.by);
    for (let off = sg.checks.length + 1; off < n; off++) {
      const p = this.players[(byIdx + off) % n];
      const matches = p.left ? [] : p.hand.filter((c) => c === sg.suspect || c === sg.weapon || c === sg.room);
      if (!matches.length) {
        sg.checks.push({ pid: p.pid, has: false });
        continue;
      }
      sg.waiting = p.pid;
      sg.matches = matches;
      this.arm();
      this.changed();
      return;
    }
    sg.none = true;
    sg.waiting = null;
    this.turn.stage = 'reveal';
    this.brains.get(sg.by).noDisprove(sg);
    this.addLog('none', '아무도 반박하지 못했습니다!');
    this.event({ type: 'none', pid: sg.by });
    this.arm();
    this.changed();
  }

  doShow(pid, card) {
    const sg = this.suggestion;
    if (!sg || this.turn.stage !== 'disprove' || sg.waiting !== pid) return err('지금은 카드를 보여줄 차례가 아닙니다');
    if (!sg.matches.includes(card)) return err('그 카드는 보여줄 수 없습니다');
    this.brains.get(pid).chooseShow([card], sg.by);
    this.finishShow(pid, card);
    return ok();
  }

  autoShow(pid) {
    const sg = this.suggestion;
    if (this.phase !== 'play' || !sg || this.turn.stage !== 'disprove' || sg.waiting !== pid) return;
    this.finishShow(pid, this.brains.get(pid).chooseShow(sg.matches, sg.by));
  }

  finishShow(pid, card) {
    const sg = this.suggestion;
    sg.checks.push({ pid, has: true });
    sg.shownBy = pid;
    sg.card = card;
    sg.waiting = null;
    sg.matches = null;
    this.turn.stage = 'reveal';
    this.brains.get(sg.by).learn(card);
    if (!this.intel.has(sg.by)) this.intel.set(sg.by, []);
    this.intel.get(sg.by).push({ card, from: pid, turn: this.turnNo });
    this.addLog('show', `{p:${pid}} → {p:${sg.by}} 에게 카드 한 장을 몰래 보여주었습니다`);
    this.event({ type: 'show', by: sg.by, from: pid });
    this.arm();
    this.changed();
  }

  doAccuse(p, suspect, weapon, room) {
    if (this.turn.stage === 'disprove') return err('반박이 끝난 뒤에 고발할 수 있습니다');
    if (!C.SUSPECT[suspect] || !C.WEAPON[weapon] || !C.ROOM[room]) return err('세 가지를 모두 골라주세요');
    const sol = this.solution;
    const correct = suspect === sol.suspect && weapon === sol.weapon && room === sol.room;
    this.accusations.push({ pid: p.pid, suspect, weapon, room, correct, turn: this.turnNo });
    this.event({ type: 'accuse', pid: p.pid, correct });
    if (correct) {
      this.addLog('win', `{p:${p.pid}} 고발: {s:${suspect}} · {w:${weapon}} · {r:${room}} — 정답!`);
      return this.finish(p.pid, 'solved'), ok();
    }
    p.out = true;
    this.addLog('wrong', `{p:${p.pid}} 의 고발이 틀렸습니다. 탈락! (카드는 계속 반박에 쓰입니다)`);
    const active = this.active();
    if (active.length === 1) return this.finish(active[0].pid, 'last'), ok();
    if (!active.length) return this.finish(null, 'none'), ok();
    this.nextTurn();
    return ok();
  }

  doEnd() {
    if (this.turn.stage === 'disprove') return err('반박이 끝날 때까지 기다려주세요');
    this.nextTurn();
    return ok();
  }

  finish(pid, reason) {
    this.clearTimers();
    this.phase = 'over';
    this.deadline = null;
    this.winner = { pid, reason };
    if (reason === 'last') this.addLog('win', `남은 탐정 {p:${pid}} 의 승리!`);
    if (reason === 'none') this.addLog('system', '모든 탐정이 틀렸습니다. 범인은 유유히 사라졌습니다...');
    this.event({ type: 'over', pid, reason });
    this.changed();
  }

  /** 게임 도중 방을 완전히 나간 사람: 카드는 모두에게 공개 */
  removePlayer(pid) {
    const p = this.player(pid);
    if (!p || p.left || this.phase !== 'play') return;
    p.left = true;
    this.revealed.push({ pid, cards: [...p.hand] });
    for (const b of this.brains.values()) for (const c of p.hand) b.learn(c);
    this.addLog('system', `{p:${pid}} 이(가) 저택을 떠났습니다. 가지고 있던 카드가 공개됩니다`);
    const active = this.active();
    if (active.length <= 1 || !this.players.some((x) => !x.left && !x.isBot)) {
      return this.finish(active.length === 1 ? active[0].pid : null, active.length === 1 ? 'last' : 'none');
    }
    if (this.turn.pid === pid) return this.nextTurn();
    const sg = this.suggestion;
    if (this.turn.stage === 'disprove' && sg.waiting === pid) {
      sg.waiting = null;
      sg.matches = null;
      sg.checks.push({ pid, has: false });
      this.advanceDisprove();
      return;
    }
    this.changed();
  }

  // ───────────────────────── 봇

  botStep() {
    if (this.phase !== 'play') return;
    const t = this.turn;
    const me = this.player(t.pid);
    if (!me || !me.isBot) return;
    const b = this.brains.get(me.pid);
    const sol = b.solution();
    const here = this.pos[me.char].room;
    const run = (a) => {
      const r = this.act(me.pid, a);
      if (!r.ok && t === this.turn && this.phase === 'play' && t.stage !== 'disprove') this.act(me.pid, { type: 'end' });
    };
    switch (t.stage) {
      case 'start': {
        if (sol) return run({ type: 'accuse', ...sol });
        const unknownRooms = b.unknown('room');
        if (here && this.movedIn.has(me.pid) && unknownRooms.includes(here)) return run(b.suggestion());
        const via = here && C.ROOM[here].passage;
        if (via && unknownRooms.includes(via) && rand(3) > 0) return run({ type: 'passage' });
        return run({ type: 'roll' });
      }
      case 'move':
        return run({ type: 'move', to: this.botDestination(me, b) });
      case 'room':
        return run(b.suggestion());
      default:
        if (sol) return run({ type: 'accuse', ...sol });
        return run({ type: 'end' });
    }
  }

  botDestination(me, b) {
    const reach = this.turn.reach;
    const cur = this.pos[me.char].room;
    const targets = b.unknown('room').filter((r) => r !== cur);
    const roomOpts = Object.keys(reach.rooms);
    const good = roomOpts.filter((r) => targets.includes(r));
    if (good.length) {
      good.sort((x, y) => reach.rooms[x].length - reach.rooms[y].length);
      return 'room:' + good[0];
    }
    const stillCurious = b.unknown('suspect').length > 1 || b.unknown('weapon').length > 1;
    if (roomOpts.length && stillCurious && rand(2)) return 'room:' + pick(roomOpts);
    const goal = targets.length ? targets : TYPE_IDS.room.filter((r) => r !== cur);
    const field = C.distanceField(goal);
    let best = null;
    let bestD = Infinity;
    for (const k of Object.keys(reach.cells)) {
      const d = field.has(k) ? field.get(k) : 999;
      if (d < bestD) { bestD = d; best = k; }
    }
    if (best) return best;
    return roomOpts.length ? 'room:' + roomOpts[0] : '';
  }

  // ───────────────────────── 화면용 데이터

  viewFor(pid) {
    const me = this.player(pid);
    const t = this.turn;
    const sg = this.suggestion;
    const over = this.phase === 'over';
    const cur = this.player(t.pid);
    return {
      id: this.id,
      phase: this.phase,
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, char: p.char, out: p.out, left: p.left,
        handCount: p.hand.length, online: p.isBot || this.hooks.isOnline(p.pid),
      })),
      pos: this.pos,
      wpos: this.wpos,
      turn: {
        pid: t.pid,
        stage: t.stage,
        dice: t.dice,
        no: t.no,
        deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
        reach: t.pid === pid ? t.reach : null,
        canPassage: t.stage === 'start' && !!(this.pos[cur.char].room && C.ROOM[this.pos[cur.char].room].passage),
        canSuggest: this.canSuggest(cur),
      },
      suggestion: sg && {
        by: sg.by, suspect: sg.suspect, weapon: sg.weapon, room: sg.room,
        checks: sg.checks, waiting: sg.waiting, none: sg.none, shownBy: sg.shownBy,
        card: pid === sg.by || pid === sg.shownBy ? sg.card : null,
        matches: pid === sg.waiting ? sg.matches : null,
      },
      me: me ? { hand: me.hand, out: me.out, intel: this.intel.get(pid) || [], movedIn: this.movedIn.has(pid) } : null,
      revealed: this.revealed,
      log: this.log,
      events: this.events,
      over: over ? {
        winner: this.winner,
        solution: this.solution,
        hands: this.players.map((p) => ({ pid: p.pid, cards: p.hand })),
        accusations: this.accusations,
      } : null,
    };
  }

  destroy() {
    this.clearTimers();
    this.phase = 'over';
  }

  /* ── 서버가 다시 켜져도 이어 하기 */
  snapshot() { return this.phase === 'over' && !this.winner ? null : dehydrate(this, ['timer', 'botTimer']); }
  static restore(data, hooks) {
    const g = rebuild(Game, data);
    g.hooks = hooks;
    g.timer = null;
    g.botTimer = null;
    for (const b of g.brains.values()) Object.setPrototypeOf(b, Brain.prototype);
    g.arm();
    return g;
  }
}

/** 시뮬레이션용: 봇 대기 시간을 바꾼다 */
Game.setBotDelay = (fn) => { botDelay = fn; };

module.exports = Game;
