'use strict';
// 보름밤 늑대인간 - 게임 규칙 엔진 (서버가 모든 카드를 쥐고 판정한다)
const crypto = require('crypto');
const W = require('../public/shared/wolf');

const { ROLES, NIGHT_ORDER, CENTER } = W;

let PACE = 1; // 시뮬레이션에서 0 으로 줄인다
const T = {
  look: 9000,          // 내 카드 확인
  dusk: 4500,          // 눈을 감으세요
  stepAct: 15000,      // 행동이 있는 밤 차례
  stepView: 8000,      // 보기만 하는 밤 차례
  dawn: 4000,
  vote: 35000,
};
const dayTime = (n) => Math.min(420, 150 + n * 25) * 1000;

const rand = (n) => crypto.randomInt(n);
const pick = (a) => a[rand(a.length)];
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const ok = (extra = {}) => ({ ok: true, ...extra });
const err = (error) => ({ ok: false, error });
const INTERACTIVE = new Set(['werewolf', 'seer', 'robber', 'troublemaker', 'drunk']);

class Game {
  /**
   * @param {{pid:string,name:string,isBot:boolean}[]} seats
   * @param {{changed:Function,isOnline:Function,chat:Function}} hooks
   * @param {{deck?:string[], dayMs?:number}} opts
   */
  constructor(seats, hooks, opts = {}) {
    this.id = crypto.randomBytes(4).toString('hex');
    this.hooks = hooks;
    this.players = seats.map((s, i) => ({ pid: s.pid, name: s.name, isBot: s.isBot, seat: i, notes: [], ready: false, vote: null, know: {}, belief: null }));
    const deck = opts.deck && !W.checkDeck(opts.deck, seats.length) ? opts.deck.slice() : W.defaultDeck(seats.length);
    this.deck = deck.slice().sort((a, b) => W.ROLE_IDS.indexOf(a) - W.ROLE_IDS.indexOf(b));
    const cards = shuffle(deck.slice());
    this.original = {};
    this.cards = {};
    this.players.forEach((p, i) => {
      this.original[p.pid] = cards[i];
      this.cards[p.pid] = cards[i];
      p.belief = cards[i];
    });
    this.center = cards.slice(seats.length);
    this.centerOriginal = this.center.slice();
    this.steps = NIGHT_ORDER.filter((r) => this.deck.includes(r));
    this.phase = 'look';          // look → night → day → vote → over
    this.step = null;             // 밤 차례 역할 (dusk / 역할 / dawn)
    this.acted = new Set();       // 이번 밤 차례에 행동을 마친 사람
    this.nightLog = [];           // 결과 화면에서 공개할 밤 기록
    this.dayMs = opts.dayMs || dayTime(seats.length);
    this.claims = {};
    this.events = [];
    this.seq = 0;
    this.log = [];
    this.over = null;
    this.timer = null;
    this.botTimers = [];
    this.deadline = 0;
    this.dead = false;
    this.addLog('sys', '카드를 한 장씩 나눠 받았습니다. 내 역할을 확인하세요.');
    this.schedule(T.look, () => this.startNight());
    this.changed();
  }

  /* ── 기본 도구 */
  pl(pid) { return this.players.find((p) => p.pid === pid); }
  changed() { if (!this.dead) this.hooks.changed(); }
  event(e) {
    e.seq = ++this.seq;
    this.events.push(e);
    if (this.events.length > 40) this.events.shift();
  }
  addLog(kind, text) {
    this.log.push({ kind, text });
    if (this.log.length > 80) this.log.shift();
  }
  note(p, text, cards = []) { p.notes.push({ text, cards }); }
  schedule(ms, fn) {
    clearTimeout(this.timer);
    const d = Math.round(ms * PACE);
    this.deadline = Date.now() + d;
    this.deadlineTotal = d;
    this.timer = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[늑대인간 진행 오류]', e); }
      this.changed();
    }, d);
  }
  later(ms, fn) {
    const t = setTimeout(() => {
      if (this.dead) return;
      try { fn(); } catch (e) { console.error('[늑대인간 AI 오류]', e); }
      this.changed();
    }, Math.round(ms * PACE));
    this.botTimers.push(t);
  }
  holders(role) { return this.players.filter((p) => this.original[p.pid] === role); }
  onPresence() { this.changed(); }

  /* ── 밤 */
  startNight() {
    this.phase = 'night';
    this.step = 'dusk';
    this.event({ type: 'night' });
    this.addLog('night', W.NARRATION.dusk);
    this.schedule(T.dusk, () => this.nextStep());
  }

  nextStep() {
    const i = this.step === 'dusk' ? 0 : this.steps.indexOf(this.step) + 1;
    this.acted.clear();
    if (i >= this.steps.length) return this.startDay();
    const role = this.steps[i];
    this.step = role;
    this.event({ type: 'step', role });
    this.beginStep(role);
    this.schedule(INTERACTIVE.has(role) ? T.stepAct : T.stepView, () => this.endStep(role));
  }

  /** 밤 차례가 시작될 때 자동으로 보여주는 정보 */
  beginStep(role) {
    const hs = this.holders(role);
    const names = (list) => list.map((p) => p.name).join(', ');
    if (role === 'werewolf') {
      if (hs.length === 1) {
        this.note(hs[0], '늑대인간은 나 혼자입니다. 가운데 카드 1장을 볼 수 있어요.');
      } else {
        for (const p of hs) {
          const others = hs.filter((q) => q !== p);
          this.note(p, `다른 늑대인간: ${names(others)}`, others.map((q) => ({ who: q.pid, role: 'werewolf' })));
          for (const q of others) p.know[q.pid] = 'werewolf';
        }
        if (hs.length) this.nightLog.push(`늑대인간 ${names(hs)}이(가) 서로를 확인했습니다.`);
      }
    } else if (role === 'minion') {
      const wolves = this.holders('werewolf');
      for (const p of hs) {
        this.note(p, wolves.length ? `늑대인간: ${names(wolves)}` : '늑대인간이 아무도 없습니다! 누군가 죽기만 하면(내가 아니라면) 이깁니다.', wolves.map((q) => ({ who: q.pid, role: 'werewolf' })));
        for (const q of wolves) p.know[q.pid] = 'werewolf';
        this.nightLog.push(`하수인 ${p.name}이(가) 늑대인간을 확인했습니다.`);
      }
    } else if (role === 'mason') {
      for (const p of hs) {
        const others = hs.filter((q) => q !== p);
        this.note(p, others.length ? `다른 비밀결사원: ${names(others)}` : '다른 비밀결사원 카드는 가운데에 있습니다.', others.map((q) => ({ who: q.pid, role: 'mason' })));
        for (const q of others) p.know[q.pid] = 'mason';
      }
      if (hs.length) this.nightLog.push(`비밀결사 ${names(hs)}이(가) 눈을 떴습니다.`);
    } else if (role === 'insomniac') {
      for (const p of hs) {
        const now = this.cards[p.pid];
        p.belief = now;
        p.know[p.pid] = now;
        this.note(p, now === 'insomniac' ? '내 카드는 그대로 불면증 환자입니다.' : `내 카드가 바뀌었습니다! 지금 나는 ${ROLES[now].name}입니다.`, [{ who: p.pid, role: now }]);
        this.nightLog.push(`불면증 환자 ${p.name}이(가) 자기 카드(${ROLES[now].name})를 확인했습니다.`);
      }
    }
    for (const p of hs) {
      if (p.isBot && this.needsAction(p)) this.later(1500 + rand(4000), () => this.botNight(p));
    }
  }

  needsAction(p) {
    if (this.phase !== 'night' || this.original[p.pid] !== this.step || this.acted.has(p.pid)) return false;
    if (this.step === 'werewolf') return this.holders('werewolf').length === 1;
    return INTERACTIVE.has(this.step);
  }

  /** 시간이 끝났는데 아무것도 안 한 사람 처리 (술꾼은 반드시 바꾼다) */
  endStep(role) {
    if (role === 'drunk') {
      for (const p of this.holders('drunk')) if (!this.acted.has(p.pid)) this.nightAct(p, { type: 'drunk', center: rand(CENTER) }, true);
    }
    if (role === 'robber' || role === 'seer' || role === 'troublemaker' || role === 'werewolf') {
      for (const p of this.holders(role)) {
        if (this.needsAction(p)) {
          this.note(p, '시간이 지나 아무것도 하지 않았습니다.');
          this.nightLog.push(`${ROLES[role].name} ${p.name}은(는) 아무것도 하지 않았습니다.`);
        }
      }
    }
    this.nextStep();
  }

  nightAct(p, a, auto = false) {
    if (!this.needsAction(p)) return err('지금은 행동할 차례가 아닙니다');
    const role = this.step;
    const other = (pid) => {
      const q = this.pl(pid);
      return q && q !== p ? q : null;
    };
    const ci = (i) => (Number.isInteger(i) && i >= 0 && i < CENTER ? i : null);
    if (a.type === 'skip') {
      if (role === 'drunk') return err('술꾼은 반드시 카드를 바꿔야 해요');
      this.note(p, '아무것도 하지 않기로 했습니다.');
      this.nightLog.push(`${ROLES[role].name} ${p.name}은(는) 아무것도 하지 않았습니다.`);
    } else if (role === 'werewolf') {
      const i = ci(a.center);
      if (a.type !== 'peek' || i == null) return err('가운데 카드 1장을 고르세요');
      const r = this.center[i];
      this.note(p, `가운데 ${i + 1}번 카드는 ${ROLES[r].name}입니다.`, [{ center: i, role: r }]);
      p.know[`c${i}`] = r;
      this.nightLog.push(`외로운 늑대인간 ${p.name}이(가) 가운데 ${i + 1}번 카드(${ROLES[r].name})를 봤습니다.`);
    } else if (role === 'seer') {
      if (a.type === 'seer' && a.target) {
        const q = other(a.target);
        if (!q) return err('다른 사람을 고르세요');
        const r = this.cards[q.pid];
        this.note(p, `${q.name}의 카드는 ${ROLES[r].name}입니다.`, [{ who: q.pid, role: r }]);
        p.know[q.pid] = r;
        this.nightLog.push(`예언자 ${p.name}이(가) ${q.name}의 카드(${ROLES[r].name})를 봤습니다.`);
      } else if (a.type === 'seer' && Array.isArray(a.centers)) {
        const [i, j] = a.centers.map(ci);
        if (i == null || j == null || i === j) return err('가운데 카드 2장을 고르세요');
        const ri = this.center[i];
        const rj = this.center[j];
        this.note(p, `가운데 ${i + 1}번은 ${ROLES[ri].name}, ${j + 1}번은 ${ROLES[rj].name}입니다.`, [{ center: i, role: ri }, { center: j, role: rj }]);
        p.know[`c${i}`] = ri;
        p.know[`c${j}`] = rj;
        this.nightLog.push(`예언자 ${p.name}이(가) 가운데 ${i + 1}번(${ROLES[ri].name})과 ${j + 1}번(${ROLES[rj].name})을 봤습니다.`);
      } else return err('볼 카드를 고르세요');
    } else if (role === 'robber') {
      const q = other(a.target);
      if (a.type !== 'rob' || !q) return err('카드를 바꿀 사람을 고르세요');
      const mine = this.cards[p.pid];
      const theirs = this.cards[q.pid];
      this.cards[p.pid] = theirs;
      this.cards[q.pid] = mine;
      p.belief = theirs;
      p.know[p.pid] = theirs;
      p.know[q.pid] = mine;
      this.note(p, `${q.name}와(과) 카드를 바꿨습니다. 이제 나는 ${ROLES[theirs].name}입니다.`, [{ who: p.pid, role: theirs }]);
      this.nightLog.push(`강도 ${p.name}이(가) ${q.name}의 카드(${ROLES[theirs].name})를 훔쳤습니다.`);
      this.event({ type: 'swap', kind: 'rob' });
    } else if (role === 'troublemaker') {
      const x = other(a.a);
      const y = other(a.b);
      if (a.type !== 'swap' || !x || !y || x === y) return err('나를 뺀 두 사람을 고르세요');
      [this.cards[x.pid], this.cards[y.pid]] = [this.cards[y.pid], this.cards[x.pid]];
      [p.know[x.pid], p.know[y.pid]] = [p.know[y.pid], p.know[x.pid]];
      this.note(p, `${x.name}와(과) ${y.name}의 카드를 바꿨습니다.`);
      this.nightLog.push(`말썽꾼 ${p.name}이(가) ${x.name}와(과) ${y.name}의 카드를 바꿨습니다.`);
      this.event({ type: 'swap', kind: 'trouble' });
    } else if (role === 'drunk') {
      const i = ci(a.center);
      if (a.type !== 'drunk' || i == null) return err('가운데 카드 1장을 고르세요');
      [this.cards[p.pid], this.center[i]] = [this.center[i], this.cards[p.pid]];
      p.belief = null;
      p.know[`c${i}`] = 'drunk';
      delete p.know[p.pid];
      this.note(p, `${auto ? '시간이 지나 자동으로 ' : ''}가운데 ${i + 1}번 카드와 내 카드를 바꿨습니다. 지금 내가 무엇인지는 모릅니다.`);
      this.nightLog.push(`술꾼 ${p.name}이(가) 가운데 ${i + 1}번 카드(${ROLES[this.cards[p.pid]].name})와 바꿨습니다.`);
      this.event({ type: 'swap', kind: 'drunk' });
    } else return err('지금은 행동할 수 없습니다');
    this.acted.add(p.pid);
    return ok();
  }

  /* ── 낮 */
  startDay() {
    this.phase = 'day';
    this.step = 'dawn';
    this.event({ type: 'day' });
    this.addLog('day', W.NARRATION.dawn);
    this.schedule(this.dayMs, () => this.startVote());
    this.botsTalk();
  }

  setReady(p, v) {
    if (this.phase !== 'day') return err('지금은 토론 시간이 아닙니다');
    p.ready = !!v;
    const humans = this.players.filter((q) => !q.isBot && this.hooks.isOnline(q.pid));
    if (humans.length && humans.every((q) => q.ready)) this.startVote();
    return ok();
  }

  startVote() {
    if (this.phase !== 'day') return;
    this.phase = 'vote';
    this.step = null;
    this.event({ type: 'vote' });
    this.addLog('vote', '투표 시간! 늑대인간이라고 생각하는 사람을 고르세요.');
    for (const p of this.players) if (p.isBot) this.later(2000 + rand(12000), () => this.botVote(p));
    this.schedule(T.vote, () => this.resolve());
  }

  castVote(p, target) {
    if (this.phase !== 'vote') return err('지금은 투표 시간이 아닙니다');
    const q = this.pl(target);
    if (!q || q === p) return err('나를 뺀 사람에게 투표하세요');
    p.vote = q.pid;
    if (this.players.every((x) => x.vote)) this.later(1200, () => this.resolve());
    return ok();
  }

  resolve() {
    if (this.phase !== 'vote') return;
    clearTimeout(this.timer);
    // 투표하지 않은 사람은 무작위로 가리킨다
    for (const p of this.players) {
      if (!p.vote) p.vote = pick(this.players.filter((q) => q !== p)).pid;
    }
    const count = {};
    for (const p of this.players) count[p.vote] = (count[p.vote] || 0) + 1;
    const top = Math.max(...Object.values(count));
    const dead = top >= 2 ? Object.keys(count).filter((pid) => count[pid] === top) : [];
    // 사냥꾼: 죽으면 자기가 가리킨 사람도 데려간다
    const hunterShots = [];
    for (let i = 0; i < dead.length; i++) {
      const pid = dead[i];
      if (this.cards[pid] === 'hunter') {
        const t = this.pl(pid).vote;
        hunterShots.push({ from: pid, to: t });
        if (!dead.includes(t)) dead.push(t);
      }
    }
    const final = { ...this.cards };
    const wolvesInPlay = this.players.filter((p) => final[p.pid] === 'werewolf');
    const minion = this.players.find((p) => final[p.pid] === 'minion');
    const deadRole = (r) => dead.some((pid) => final[pid] === r);
    const tannerDied = deadRole('tanner');
    let villageWin;
    let wolfWin;
    if (wolvesInPlay.length) {
      villageWin = deadRole('werewolf');
      wolfWin = !villageWin && !tannerDied;
    } else {
      villageWin = dead.length === 0;
      wolfWin = !!minion && dead.length > 0 && !dead.includes(minion.pid) && !tannerDied;
    }
    const winners = this.players.filter((p) => {
      const team = ROLES[final[p.pid]].team;
      if (team === 'tanner') return dead.includes(p.pid);
      if (team === 'wolf') return wolfWin;
      return villageWin;
    }).map((p) => p.pid);
    let outcome = 'none';
    if (tannerDied) outcome = villageWin ? 'tanner+village' : 'tanner';
    else if (villageWin) outcome = 'village';
    else if (wolfWin) outcome = 'wolf';
    this.phase = 'over';
    this.deadline = 0;
    this.over = {
      final,
      original: { ...this.original },
      center: this.center.slice(),
      centerOriginal: this.centerOriginal.slice(),
      votes: Object.fromEntries(this.players.map((p) => [p.pid, p.vote])),
      count,
      dead,
      hunterShots,
      winners,
      outcome,
      noWolves: !wolvesInPlay.length,
      nightLog: this.nightLog.slice(),
    };
    const names = (list) => list.map((pid) => this.pl(pid).name).join(', ');
    this.addLog('over', dead.length ? `${names(dead)}이(가) 처형되었습니다.` : '아무도 죽지 않았습니다.');
    const HEAD = { village: '마을 사람들의 승리!', wolf: '늑대인간의 승리!', tanner: '무두장이의 승리!', 'tanner+village': '무두장이와 마을의 승리!', none: '모두 패배했습니다…' };
    this.addLog('over', HEAD[outcome]);
    this.event({ type: 'over', outcome });
    this.changed();
  }

  /* ── 행동 입력 */
  act(pid, a) {
    const p = this.pl(pid);
    if (!p) return err('게임 참가자가 아닙니다');
    if (!a || typeof a.type !== 'string') return err('잘못된 요청입니다');
    let r;
    if (a.type === 'ready') r = this.setReady(p, a.value);
    else if (a.type === 'vote') r = this.castVote(p, a.target);
    else if (a.type === 'skipDay') {
      if (this.phase !== 'day') return err('지금은 토론 시간이 아닙니다');
      if (!a.host) return err('방장만 할 수 있습니다');
      this.startVote();
      r = ok();
    } else r = this.nightAct(p, a);
    if (r.ok) this.changed();
    return r;
  }

  /* ── AI */
  botNight(p) {
    if (!this.needsAction(p)) return;
    const others = this.players.filter((q) => q !== p);
    const role = this.step;
    if (role === 'werewolf') this.nightAct(p, { type: 'peek', center: rand(CENTER) });
    else if (role === 'seer') {
      if (rand(3)) this.nightAct(p, { type: 'seer', target: pick(others).pid });
      else {
        const i = rand(CENTER);
        this.nightAct(p, { type: 'seer', centers: [i, (i + 1 + rand(CENTER - 1)) % CENTER] });
      }
    } else if (role === 'robber') {
      if (rand(6)) this.nightAct(p, { type: 'rob', target: pick(others).pid });
      else this.nightAct(p, { type: 'skip' });
    } else if (role === 'troublemaker') {
      const [x, y] = shuffle(others.slice());
      if (y) this.nightAct(p, { type: 'swap', a: x.pid, b: y.pid });
    } else if (role === 'drunk') this.nightAct(p, { type: 'drunk', center: rand(CENTER) });
  }

  botSay(p, text) {
    if (this.dead || p.left) return;
    this.hooks.chat(p.pid, text);
  }

  /** 봇이 낮에 자기 역할을 주장한다 */
  botsTalk() {
    const bots = this.players.filter((p) => p.isBot);
    const unique = ['seer', 'robber', 'troublemaker', 'drunk', 'insomniac'];
    bots.forEach((p, k) => {
      const orig = this.original[p.pid];
      const nm = (pid) => this.pl(pid).name;
      const wolfy = ['werewolf', 'minion'].includes(p.belief);
      let claim = orig;
      let lines = [];
      if (orig === 'tanner') {
        claim = pick(['werewolf', 'villager']);
        lines = claim === 'werewolf' ? ['음… 사실 제가 늑대인간일지도 몰라요.', '저 좀 의심스럽지 않아요?'] : ['저는 그냥 마을 주민이에요… 아마도요.'];
      } else if (wolfy) {
        const taken = new Set(Object.values(this.claims));
        claim = pick(['villager', 'villager', ...unique.filter((r) => this.deck.includes(r) && !taken.has(r))]);
        const target = pick(this.players.filter((q) => q !== p && !['werewolf'].includes(p.know[q.pid]))) || pick(this.players.filter((q) => q !== p));
        if (claim === 'seer') lines = [`저 예언자예요. ${nm(target.pid)}님 카드를 봤는데 늑대인간이었어요!`];
        else if (claim === 'insomniac') lines = ['불면증 환자인데, 제 카드는 그대로였어요.'];
        else if (claim === 'drunk') lines = ['술꾼이라 가운데랑 바꿨는데 뭐가 됐는지 몰라요.'];
        else if (claim === 'robber') lines = [`강도였는데 ${nm(target.pid)}님 카드를 가져갔어요. 마을 주민이던데요?`];
        else if (claim === 'troublemaker') {
          const [x, y] = shuffle(this.players.filter((q) => q !== p).slice());
          lines = [`말썽꾼이에요. ${x.name}님이랑 ${y ? y.name : x.name}님 카드를 바꿨어요.`];
        } else lines = ['저는 마을 주민이에요. 밤에 아무것도 못 봤어요.', `${nm(target.pid)}님 좀 수상한데요?`];
      } else {
        const last = p.notes.filter((n) => !n.text.startsWith('시간')).slice(-1)[0];
        const base = {
          seer: '저 예언자예요.', robber: '저 강도였어요.', troublemaker: '저 말썽꾼이에요.', drunk: '저 술꾼이에요.',
          insomniac: '저 불면증 환자예요.', mason: '저 비밀결사예요.', hunter: '저 사냥꾼이에요. 저 찍으면 같이 갑니다.', villager: '저는 마을 주민이에요.',
        }[orig] || '저는 마을 편이에요.';
        lines = [last && orig !== 'villager' && orig !== 'hunter' ? `${base} ${last.text}` : base];
        if (p.belief === 'werewolf') lines = ['저는 마을 주민이에요. 조용히 있을게요.'];
      }
      this.claims[p.pid] = claim;
      lines.forEach((t, i) => this.later(3000 + k * 3500 + i * 4000 + rand(2500), () => this.botSay(p, t)));
    });
    // 겹치는 주장 지적
    this.later(3000 + bots.length * 3500 + 6000, () => {
      const seen = {};
      for (const [pid, r] of Object.entries(this.claims)) {
        if (r === 'villager') continue;
        if (seen[r] && ROLES[r].max === 1) {
          const talker = pick(bots);
          if (talker) this.botSay(talker, `${this.pl(seen[r]).name}님이랑 ${this.pl(pid).name}님 둘 다 ${ROLES[r].name}라고 했죠? 한 명은 거짓말이에요.`);
          return;
        }
        seen[r] = pid;
      }
    });
  }

  botVote(p) {
    if (this.phase !== 'vote' || p.vote) return;
    const others = this.players.filter((q) => q !== p);
    const believe = p.belief;
    const team = believe ? ROLES[believe].team : 'village';
    const score = new Map(others.map((q) => [q.pid, Math.random() * 2]));
    const dup = {};
    for (const [pid, r] of Object.entries(this.claims)) if (r !== 'villager') (dup[r] = dup[r] || []).push(pid);
    for (const list of Object.values(dup)) if (list.length > 1) for (const pid of list) if (score.has(pid)) score.set(pid, score.get(pid) + 3);
    for (const q of others) {
      const k = p.know[q.pid];
      if (!k) continue;
      if (team === 'village') score.set(q.pid, score.get(q.pid) + (k === 'werewolf' ? 12 : k === 'tanner' ? -6 : -4));
      else if (team === 'wolf') score.set(q.pid, score.get(q.pid) + (['werewolf', 'minion'].includes(k) ? -20 : k === 'tanner' ? -6 : 2));
    }
    // 저를 찍지 마세요: 봇이 주장한 역할이 사냥꾼이면 조심
    for (const q of others) if (this.claims[q.pid] === 'hunter') score.set(q.pid, score.get(q.pid) - 1.5);
    const target = [...score.entries()].sort((a, b) => b[1] - a[1])[0][0];
    this.castVote(p, target);
    if (rand(3) === 0) this.botSay(p, `${this.pl(target).name}님에게 투표할게요.`);
  }

  /* ── 화면용 정보 */
  viewFor(pid) {
    const me = this.pl(pid);
    const over = this.phase === 'over';
    const needs = me && this.needsAction(me) ? this.step : null;
    return {
      id: this.id,
      phase: this.phase,
      step: this.step,
      steps: this.steps,
      deck: this.deck,
      dayMs: this.dayMs,
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, isBot: p.isBot, seat: p.seat,
        online: p.isBot || this.hooks.isOnline(p.pid),
        ready: p.ready,
        voted: !!p.vote,
      })),
      me: me ? {
        pid,
        role: this.original[pid],
        notes: me.notes,
        acted: this.acted.has(pid),
        vote: me.vote,
        ready: me.ready,
      } : null,
      needs,
      deadlineIn: this.deadline ? Math.max(0, this.deadline - Date.now()) : null,
      deadlineTotal: this.deadlineTotal || 0,
      log: this.log,
      events: this.events,
      over: over ? this.over : null,
    };
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    this.botTimers.forEach(clearTimeout);
  }
}

Game.setPace = (v) => { PACE = v; };
module.exports = Game;
