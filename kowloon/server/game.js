'use strict';
// 구룡 살인사건 - 서버 쪽 게임 진행 (서버가 모든 걸 판정한다)
//
// 흐름: 밤(살인자가 수단·단서 고름) → 감식(법의학자가 현장 타일에 총알) → 토론 1
//       → 타일 교체 → 토론 2 → 타일 교체 → 토론 3 → (못 잡으면 살인자 승)
//       누가 맞히면 수사팀 승 · 목격자가 있으면 살인자가 목격자를 찾을 기회 한 번
const crypto = require('crypto');
const K = require('../public/shared/kowloon');
const { dehydrate, rebuild } = require('../../hub/persist');

let PACE = 1;
const rand = (n) => crypto.randomInt(n);
const rnd = () => crypto.randomInt(1_000_000) / 1_000_000;
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ok = (x = {}) => ({ ok: true, ...x });
const err = (error) => ({ ok: false, error });

const T = { night: 40_000, forensic: 120_000, swap: 60_000, witness: 60_000, offline: 8_000, reveal: 6_000 };
const DISCUSS = [240_000, 180_000, 180_000];

class Game {
  /**
   * seats: 카드를 받는 사람들 [{pid, name, isBot}]
   * fs:    법의학자 {pid, name, isBot} (AI 면 pid 는 'fs_ai')
   * hooks: { changed(), isOnline(pid), chat(pid, text) }
   */
  constructor(seats, fs, hooks, opts = {}) {
    this.id = crypto.randomBytes(5).toString('hex');
    this.hooks = hooks;
    this.fs = { pid: fs.pid, name: fs.name, isBot: !!fs.isBot };
    const roles = shuffle(K.rolesFor(seats.length, opts));
    const means = shuffle(K.MEANS.map((c) => c.id));
    const clues = shuffle(K.CLUES.map((c) => c.id));
    this.players = seats.map((s, i) => ({
      pid: s.pid, name: s.name, isBot: !!s.isBot, seat: i, role: roles[i],
      means: means.splice(0, K.HAND), clues: clues.splice(0, K.HAND), badge: true, ready: false,
    }));
    this.discussMs = opts.discussMs || null;
    this.murder = null;             // { means, clue }
    this.tiles = [];                // [{ id, pick }]  0: 사인 · 1: 장소 · 2~5: 현장
    this.pool = shuffle(K.SCENES.slice());
    this.round = 0;
    this.phase = 'night';
    this.swapIdx = null;
    this.accusations = [];
    this.witnessGuess = null;
    this.over = null;
    this.log = [];
    this.events = [];
    this.seq = 0;
    this.timer = null;
    this.botTimers = [];
    this.deadline = 0;
    this.deadlineTotal = 0;
    this.dead = false;
    this.addLog('story', '비 내리는 구룡의 밤, 골목에서 시신이 발견되었습니다. 범인은 이 안에 있습니다.');
    this.addLog('sys', '밤이 되었습니다. 살인자는 수단 1장과 단서 1장을 고르세요.');
    this.event({ type: 'night' });
    this.schedule(T.night, () => this.autoMurder());
    this.botNight();
    this.changed();
  }

  /* ── 기본 도구 */
  pl(pid) { return this.players.find((p) => p.pid === pid); }
  byRole(role) { return this.players.find((p) => p.role === role); }
  changed() { if (!this.dead) this.hooks.changed(); }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 40) this.events.shift();
  }
  addLog(kind, text) {
    this.log.push({ kind, text });
    if (this.log.length > 120) this.log.shift();
  }
  schedule(ms, fn) {
    clearTimeout(this.timer);
    const d = Math.round(ms * PACE);
    this.deadline = Date.now() + d;
    this.deadlineTotal = d;
    this.timer = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[구룡 진행 오류]', e); }
      this.changed();
    }, d);
  }
  later(ms, fn) {
    const t = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[구룡 AI 오류]', e); }
      this.changed();
    }, Math.round(ms * PACE));
    this.botTimers.push(t);
  }
  clearBots() { for (const t of this.botTimers) clearTimeout(t); this.botTimers = []; }
  say(p, text) { if (this.hooks.chat && p) this.hooks.chat(p.pid, text); }
  cardName(id) { return K.CARD[id] ? K.CARD[id].name : '?'; }
  fsOnline() { return this.fs.isBot || this.hooks.isOnline(this.fs.pid); }
  onPresence() {
    // 법의학자가 나갔으면 AI 가 대신 한다
    if (!this.fs.isBot && !this.hooks.isOnline(this.fs.pid) && (this.phase === 'forensic' || this.phase === 'swap')) {
      if (this.deadline - Date.now() > T.offline) this.schedule(T.offline, () => (this.phase === 'forensic' ? this.autoForensic() : this.autoSwap()));
    }
    this.changed();
  }

  /* ── 밤: 살인 */
  botNight() {
    const m = this.byRole('murderer');
    if (m.isBot) this.later(1500 + rand(2500), () => this.autoMurder());
    else if (!this.hooks.isOnline(m.pid)) this.later(T.offline, () => this.autoMurder());
  }
  autoMurder() {
    if (this.phase !== 'night') return;
    const m = this.byRole('murderer');
    this.commitMurder(m, m.means[rand(K.HAND)], m.clues[rand(K.HAND)]);
  }
  commitMurder(m, means, clue) {
    if (this.phase !== 'night') return err('지금은 고를 수 없습니다');
    if (m.role !== 'murderer') return err('살인자만 고를 수 있습니다');
    if (!m.means.includes(means) || !m.clues.includes(clue)) return err('내 카드에서 고르세요');
    this.murder = { means, clue };
    this.addLog('night', '살인이 일어났습니다. 법의학자가 현장을 감식합니다.');
    this.startForensic();
    return ok();
  }

  /* ── 감식: 사인 · 장소 · 현장 4장 */
  startForensic() {
    this.phase = 'forensic';
    this.tiles = [{ id: 'cause', pick: null }, { id: null, pick: null }];
    for (let i = 0; i < 4; i++) this.tiles.push({ id: this.pool.pop(), pick: null });
    this.event({ type: 'forensic' });
    if (this.fs.isBot) this.later(2500 + rand(2000), () => this.autoForensic());
    this.schedule(this.fsOnline() ? T.forensic : T.offline, () => this.autoForensic());
  }
  /** 법의학자 AI (또는 시간 초과): 태그가 가장 잘 맞는 칸에 */
  autoForensic() {
    if (this.phase !== 'forensic') return;
    const { means, clue } = this.murder;
    let loc = this.tiles[1].id;
    if (!loc) {
      let top = -1;
      for (const id of shuffle(K.LOCATIONS.slice())) {
        const o = K.TILE[id].opts[K.bestOption(id, means, clue, rnd)];
        const s = K.fit(K.CARD[means], o) * 1.2 + K.fit(K.CARD[clue], o);
        if (s > top) { top = s; loc = id; }
      }
    }
    const picks = this.tiles.map((t, i) => (t.pick != null ? t.pick : K.bestOption(i === 1 ? loc : t.id, means, clue, rnd)));
    this.placeAll(loc, picks);
  }
  placeAll(loc, picks) {
    if (this.phase !== 'forensic') return err('지금은 감식 시간이 아닙니다');
    if (!K.LOCATIONS.includes(loc)) return err('장소 타일을 고르세요');
    if (!Array.isArray(picks) || picks.length !== this.tiles.length) return err('모든 타일에 총알을 놓으세요');
    if (picks.some((p) => !Number.isInteger(p) || p < 0 || p > 5)) return err('칸을 잘못 골랐습니다');
    this.tiles[1].id = loc;
    this.tiles.forEach((t, i) => { t.pick = picks[i]; });
    this.addLog('forensic', '법의학자가 감식 결과를 내놓았습니다. 총알이 놓인 칸을 보고 범인을 추리하세요.');
    this.event({ type: 'tiles' });
    this.startDiscuss(1);
    return ok();
  }

  /* ── 토론 */
  startDiscuss(round) {
    this.round = round;
    this.phase = 'discuss';
    for (const p of this.players) p.ready = false;
    this.event({ type: 'round', round });
    this.addLog('round', `── ${round}라운드 토론 ── 지목은 한 사람당 게임에서 딱 한 번!`);
    const ms = this.discussMs || DISCUSS[round - 1];
    this.schedule(ms, () => this.endDiscuss());
    this.botDiscuss(ms);
  }
  setReady(p, v) {
    if (this.phase !== 'discuss') return err('지금은 토론 시간이 아닙니다');
    p.ready = !!v;
    const humans = this.players.filter((q) => !q.isBot && this.hooks.isOnline(q.pid));
    if (humans.length && humans.every((q) => q.ready)) this.later(800, () => this.endDiscuss());
    return ok();
  }
  endDiscuss() {
    if (this.phase !== 'discuss') return;
    this.clearBots();
    if (this.round >= K.ROUNDS) return this.finish('bad', 'time');
    if (!this.players.some((p) => p.badge && p.role !== 'murderer' && p.role !== 'accomplice')) return this.finish('bad', 'badges');
    this.startSwap();
  }

  /* ── 지목 (체포 시도) */
  accuse(p, target, means, clue) {
    if (this.phase !== 'discuss') return err('토론 시간에만 지목할 수 있습니다');
    if (!p.badge) return err('지목 기회를 이미 썼습니다');
    const t = this.pl(target);
    if (!t || t === p) return err('다른 사람을 고르세요');
    if (!t.means.includes(means) || !t.clues.includes(clue)) return err('그 사람의 수단 1장과 단서 1장을 고르세요');
    p.badge = false;
    const right = t.role === 'murderer' && this.murder.means === means && this.murder.clue === clue;
    this.accusations.push({ by: p.pid, target, means, clue, right, round: this.round });
    this.event({ type: 'accuse', by: p.pid, target, means, clue, right });
    this.addLog(right ? 'good' : 'bad', `{p:${p.pid}} → {p:${target}} 지목 · ${this.cardName(means)} + ${this.cardName(clue)} … ${right ? '정답!' : '틀렸습니다'}`);
    if (right) {
      clearTimeout(this.timer);
      this.clearBots();
      const w = this.byRole('witness');
      if (w) this.later(T.reveal, () => this.startWitnessHunt(p));
      else this.later(T.reveal, () => this.finish('good', 'solved', p.pid));
      this.phase = 'solved';
      this.deadline = 0;
      return ok({ right });
    }
    if (!this.players.some((q) => q.badge && q.role !== 'murderer' && q.role !== 'accomplice')) {
      clearTimeout(this.timer);
      this.clearBots();
      this.phase = 'solved';
      this.later(T.reveal, () => this.finish('bad', 'badges'));
    }
    return ok({ right });
  }

  /* ── 라운드 사이: 법의학자가 현장 타일 한 장을 바꾼다 */
  startSwap() {
    this.phase = 'swap';
    this.swapIdx = null;
    this.event({ type: 'swap' });
    this.addLog('forensic', '법의학자가 현장 타일 한 장을 새 타일로 바꿉니다.');
    if (this.fs.isBot) this.later(2000 + rand(1500), () => this.autoSwap());
    this.schedule(this.fsOnline() ? T.swap : T.offline, () => this.autoSwap());
  }
  /** 가장 쓸모없는(두루뭉술한) 현장 타일을 빼고 새로 */
  autoSwap() {
    if (this.phase !== 'swap') return;
    const { means, clue } = this.murder;
    if (this.swapIdx == null) {
      let worst = 2;
      let low = Infinity;
      for (let i = 2; i < this.tiles.length; i++) {
        const t = this.tiles[i];
        const o = K.TILE[t.id].opts[t.pick];
        const s = K.fit(K.CARD[means], o) * 1.2 + K.fit(K.CARD[clue], o);
        if (s < low) { low = s; worst = i; }
      }
      this.swapOut(worst);
    }
    this.swapPick(K.bestOption(this.tiles[this.swapIdx].id, means, clue, rnd));
  }
  swapOut(idx) {
    if (this.phase !== 'swap' || this.swapIdx != null) return err('지금은 바꿀 수 없습니다');
    if (!Number.isInteger(idx) || idx < 2 || idx >= this.tiles.length) return err('현장 타일(사인 · 장소 말고)을 고르세요');
    const old = this.tiles[idx].id;
    this.tiles[idx] = { id: this.pool.pop(), pick: null, fresh: true };
    this.swapIdx = idx;
    this.event({ type: 'swapOut', idx, old });
    return ok();
  }
  swapPick(pick) {
    if (this.phase !== 'swap' || this.swapIdx == null) return err('먼저 바꿀 타일을 고르세요');
    if (!Number.isInteger(pick) || pick < 0 || pick > 5) return err('칸을 고르세요');
    this.tiles[this.swapIdx].pick = pick;
    this.addLog('forensic', `새 현장 타일: ${K.TILE[this.tiles[this.swapIdx].id].name}`);
    this.startDiscuss(this.round + 1);
    return ok();
  }

  /* ── 목격자 찾기 (범인이 잡힌 뒤 마지막 반격) */
  startWitnessHunt(solver) {
    this.phase = 'witness';
    this.solver = solver.pid;
    this.event({ type: 'witnessHunt' });
    this.addLog('bad', '살인자가 잡혔습니다! 하지만… 살인자는 목격자를 찾아 입을 막을 마지막 기회가 있습니다.');
    const m = this.byRole('murderer');
    if (m.isBot || !this.hooks.isOnline(m.pid)) this.later(3500 + rand(2500), () => this.autoWitness());
    this.schedule(T.witness, () => this.autoWitness());
  }
  autoWitness() {
    if (this.phase !== 'witness') return;
    const cands = this.players.filter((p) => p.role !== 'murderer' && p.role !== 'accomplice');
    // 정답을 맞힌 사람이 목격자일 확률이 높다고 본다
    const solver = cands.find((p) => p.pid === this.solver);
    const pick = solver && rand(100) < 45 ? solver : cands[rand(cands.length)];
    this.guessWitness(this.byRole('murderer'), pick.pid);
  }
  guessWitness(p, target) {
    if (this.phase !== 'witness') return err('지금은 목격자를 찾을 때가 아닙니다');
    if (p.role !== 'murderer' && p.role !== 'accomplice') return err('범인 쪽만 고를 수 있습니다');
    const t = this.pl(target);
    if (!t || t.role === 'murderer' || t.role === 'accomplice') return err('수사팀 중에서 고르세요');
    const right = t.role === 'witness';
    this.witnessGuess = { by: p.pid, target, right };
    this.event({ type: 'witnessGuess', target, right });
    this.addLog(right ? 'bad' : 'good', `살인자가 {p:${target}}를 목격자로 지목… ${right ? '목격자였습니다!' : '빗나갔습니다!'}`);
    clearTimeout(this.timer);
    this.phase = 'solved';
    this.later(T.reveal * 0.6, () => this.finish(right ? 'bad' : 'good', right ? 'witness' : 'solved', this.solver));
    return ok();
  }

  /* ── 끝 */
  finish(winner, reason, solver = null) {
    if (this.phase === 'over') return;
    clearTimeout(this.timer);
    this.clearBots();
    this.phase = 'over';
    this.deadline = 0;
    const m = this.byRole('murderer');
    this.over = {
      winner, reason, solver,
      murderer: m.pid,
      accomplice: (this.byRole('accomplice') || {}).pid || null,
      witness: (this.byRole('witness') || {}).pid || null,
      murder: this.murder,
      roles: this.players.map((p) => ({ pid: p.pid, role: p.role })),
    };
    const why = {
      solved: '수사팀이 살인자를 체포했습니다!',
      time: '세 라운드 동안 아무도 맞히지 못했습니다. 살인자가 빗속으로 사라졌습니다.',
      badges: '모든 수사관이 지목 기회를 써 버렸습니다. 살인자 승리!',
      witness: '살인자가 목격자를 찾아냈습니다. 살인자 승리!',
    }[reason];
    this.addLog(winner === 'good' ? 'good' : 'bad', why);
    this.addLog('sys', `진실: {p:${m.pid}} · ${this.cardName(this.murder.means)} + ${this.cardName(this.murder.clue)}`);
    this.event({ type: 'over', winner, reason });
  }

  /* ── AI 수사 */
  /** 이 AI 가 보기에 가장 그럴듯한 (사람, 수단, 단서) 후보들 */
  suspects(me) {
    const tiles = this.tiles.filter((t) => t.id && t.pick != null);
    const tried = new Set(this.accusations.map((a) => `${a.target}|${a.means}|${a.clue}`));
    let pool = this.players.filter((p) => p !== me);
    if (me.role === 'witness') {
      const bad = this.players.filter((p) => p.role === 'murderer' || p.role === 'accomplice');
      pool = pool.filter((p) => bad.includes(p));
    }
    const out = [];
    for (const p of pool) {
      for (const m of p.means) for (const c of p.clues) {
        if (tried.has(`${p.pid}|${m}|${c}`)) continue;
        out.push({ pid: p.pid, means: m, clue: c, s: K.scorePair(tiles, m, c) + rnd() * 0.3 });
      }
    }
    return out.sort((a, b) => b.s - a.s);
  }
  botDiscuss(ms) {
    const talkers = shuffle(this.players.filter((p) => p.isBot));
    talkers.forEach((p, i) => {
      // 한두 마디 떠들기
      this.later(ms * (0.08 + 0.12 * i / Math.max(1, talkers.length)) + rand(4000), () => this.botTalk(p));
      if (!p.badge) return;
      const bad = p.role === 'murderer' || p.role === 'accomplice';
      if (bad) {
        // 범인 쪽은 3라운드에 가끔 엉뚱한 지목으로 연막
        if (this.round === 3 && rand(100) < 35) this.later(ms * (0.4 + rnd() * 0.4), () => this.botFakeAccuse(p));
        return;
      }
      this.later(ms * (0.35 + rnd() * 0.5), () => this.botThink(p));
    });
  }
  botThink(p) {
    if (this.phase !== 'discuss' || !p.badge) return;
    const list = this.suspects(p);
    if (!list.length) return;
    const [a, b] = list;
    const gap = a.s - (b ? b.s : 0);
    const need = this.round === 3 ? -1 : this.round === 2 ? 1.6 : 2.6;
    const others = this.players.filter((q) => q.isBot && q.badge && q !== p && q.role !== 'murderer' && q.role !== 'accomplice').length;
    // 마지막 라운드엔 누군가는 꼭 지목, 앞 라운드는 확신이 클 때만
    if (gap >= need || (this.round === 3 && (others === 0 || rand(100) < 60))) this.accuse(p, a.pid, a.means, a.clue);
  }
  botFakeAccuse(p) {
    if (this.phase !== 'discuss' || !p.badge) return;
    const inno = this.players.filter((q) => q !== p && q.role !== 'murderer' && q.role !== 'accomplice');
    const t = inno[rand(inno.length)];
    this.accuse(p, t.pid, t.means[rand(K.HAND)], t.clues[rand(K.HAND)]);
  }
  botTalk(p) {
    if (this.phase !== 'discuss') return;
    const bad = p.role === 'murderer' || p.role === 'accomplice';
    const list = bad ? this.suspects({ ...p, role: 'investigator' }).filter((x) => this.pl(x.pid).role !== 'murderer') : this.suspects(p);
    const x = list[rand(Math.min(3, list.length))];
    if (!x) return;
    const who = this.pl(x.pid).name;
    const lines = [
      `${who}의 ${this.cardName(x.means)}… 좀 수상하지 않아요?`,
      `${this.cardName(x.clue)} 이거 현장 타일이랑 잘 맞는데요`,
      `저는 ${who} 쪽이 제일 의심돼요`,
      `${this.cardName(x.means)}(이)면 사인이랑 딱 맞아요`,
      `아직 확신은 없어요. 다음 타일 보고 정할게요`,
    ];
    this.say(p, lines[rand(lines.length)]);
  }

  /* ── 사람 행동 */
  act(pid, a) {
    if (!a || typeof a !== 'object') return err('잘못된 요청입니다');
    if (pid === this.fs.pid && !this.fs.isBot) {
      if (a.type === 'forensic') return this.placeAll(a.location, a.picks);
      if (a.type === 'swapOut') return this.swapOut(a.idx);
      if (a.type === 'swapPick') return this.swapPick(a.pick);
      return err('법의학자는 말할 수 없습니다. 총알로만 알려 주세요');
    }
    const p = this.pl(pid);
    if (!p) return err('게임 참가자가 아닙니다');
    switch (a.type) {
      case 'murder': return this.commitMurder(p, a.means, a.clue);
      case 'accuse': return this.accuse(p, a.target, a.means, a.clue);
      case 'ready': return this.setReady(p, a.value);
      case 'witness': return this.guessWitness(p, a.target);
      default: return err('알 수 없는 행동입니다');
    }
  }

  /* ── 화면에 보낼 것 (사람마다 아는 게 다르다) */
  viewFor(pid) {
    const me = this.pl(pid);
    const isFs = pid === this.fs.pid;
    const done = this.phase === 'over';
    const know = {};
    if (me && (me.role === 'murderer' || me.role === 'accomplice')) {
      know.murderer = this.byRole('murderer').pid;
      know.accomplice = (this.byRole('accomplice') || {}).pid || null;
      know.murder = this.murder;
    }
    if (me && me.role === 'witness') {
      know.suspects = this.players.filter((p) => p.role === 'murderer' || p.role === 'accomplice').map((p) => p.pid).sort();
    }
    if (isFs) {
      know.murderer = this.byRole('murderer').pid;
      know.accomplice = (this.byRole('accomplice') || {}).pid || null;
      know.witness = (this.byRole('witness') || {}).pid || null;
      know.murder = this.murder;
    }
    return {
      id: this.id,
      phase: this.phase,
      round: this.round,
      rounds: K.ROUNDS,
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      deadlineTotal: this.deadlineTotal,
      fs: { ...this.fs, online: this.fsOnline(), me: isFs },
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, seat: p.seat, means: p.means, clues: p.clues, badge: p.badge, ready: p.ready,
        online: p.isBot || this.hooks.isOnline(p.pid),
        role: done || p.pid === pid ? p.role : null,
      })),
      me: me ? { pid: me.pid, role: me.role, badge: me.badge } : (isFs ? { pid, role: 'forensic' } : null),
      know,
      tiles: this.tiles.map((t) => ({ id: t.id, pick: t.pick, fresh: !!t.fresh })),
      swapIdx: this.swapIdx,
      accusations: this.accusations,
      witnessGuess: this.witnessGuess,
      log: this.log.slice(-60),
      events: this.events,
      seq: this.seq,
      over: this.over,
    };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    this.clearBots();
  }

  /* ── 서버가 다시 켜져도 이어 하기 */
  snapshot() { return dehydrate(this, ['timer', 'botTimers']); }
  static restore(data, hooks) {
    const g = rebuild(Game, data);
    g.hooks = hooks;
    g.timer = null;
    g.botTimers = [];
    g.dead = false;
    const left = Math.max(3000, (g.deadline || 0) - Date.now());
    const go = {
      night: () => g.autoMurder(),
      forensic: () => g.autoForensic(),
      swap: () => g.autoSwap(),
      discuss: () => g.endDiscuss(),
      witness: () => g.autoWitness(),
    }[g.phase];
    if (go) g.schedule(left, go);
    if (g.phase === 'night') g.botNight();
    if (g.phase === 'forensic' && g.fs.isBot) g.later(2000, () => g.autoForensic());
    if (g.phase === 'swap' && g.fs.isBot) g.later(2000, () => g.autoSwap());
    if (g.phase === 'discuss') g.botDiscuss(left);
    if (g.phase === 'witness' && g.byRole('murderer').isBot) g.later(3000, () => g.autoWitness());
    if (g.phase === 'solved') {
      // 정답 발표 연출 중에 꺼졌으면 바로 결과로
      const last = g.accusations[g.accusations.length - 1];
      if (last && last.right) g.later(1500, () => (g.byRole('witness') ? g.startWitnessHunt(g.pl(last.by)) : g.finish('good', 'solved', last.by)));
      else g.later(1500, () => g.finish('bad', 'badges'));
    }
    return g;
  }
}

Game.setPace = (v) => { PACE = v; };
module.exports = Game;
