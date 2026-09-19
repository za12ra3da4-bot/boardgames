'use strict';
/* 방 저장 · 되살리기
   서버가 다시 켜져도(코드 수정, Render 배포) 하던 게임이 그대로 이어지게 한다.
   1) 이 컴퓨터의 data/rooms-<게임>.json 에 몇 초마다 저장 (꺼질 때도 저장)
   2) 같은 내용을 암호화해서 방 사람들 브라우저에도 맡겨 둔다.
      Render 처럼 디스크가 지워지는 곳에서는 다시 접속한 사람이 그 사본을 내밀어 방을 되살린다. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { seal, unseal } = require('./accounts');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MAX_AGE = 30 * 60_000;   // 30분 넘은 사본은 버린다
const TICK = 3000;

/* ───── 게임 상태 ↔ 평범한 JSON (Map · Set 도 살린다, 타이머 · 함수는 버린다) */
const isTimer = (v) => v && typeof v === 'object' && v.constructor && (v.constructor.name === 'Timeout' || v.constructor.name === 'Immediate');
function dehydrate(obj, skip = []) {
  const drop = new Set(['hooks', ...skip]);
  return JSON.parse(JSON.stringify(obj, function replacer(k, v) {
    if (drop.has(k)) return undefined;
    if (isTimer(v)) return undefined;
    if (v instanceof Map) return { __map: [...v] };
    if (v instanceof Set) return { __set: [...v] };
    return v;
  }));
}
function revive(v) {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    if (v.__map) return new Map(v.__map.map(([k, x]) => [k, revive(x)]));
    if (v.__set) return new Set(v.__set.map(revive));
    for (const k of Object.keys(v)) v[k] = revive(v[k]);
  }
  return v;
}
/** 저장해 둔 값으로 클래스 인스턴스를 다시 만든다 (생성자는 부르지 않는다) */
function rebuild(Cls, data) {
  return Object.assign(Object.create(Cls.prototype), revive(data));
}

/* ───── 꺼질 때 한꺼번에 저장 */
const savers = [];
let exiting = false;
function flushAll() {
  for (const s of savers) {
    try { s.flush(); } catch (e) { console.error('[방 저장 실패]', e.message); }
  }
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (exiting) return;
    exiting = true;
    flushAll();
    process.exit(0);
  });
}

/**
 * 게임 하나의 방 저장기
 * @param {object} o
 *   id          게임 이름 (파일 이름에 씀)
 *   rooms, sessions, tokenOfPid   mount 의 Map 들
 *   restoreRoom(snap) → room      저장본으로 방 객체를 되살린다 (게임 포함)
 *   getNsp()    socket.io 네임스페이스
 */
function createSaver(o) {
  // 같은 컴퓨터에서 서버를 여러 개(포트별로) 켜도 저장 파일이 섞이지 않게
  const port = String(process.env.PORT || process.argv[2] || 3000).replace(/\D/g, '');
  const file = path.join(DATA_DIR, `rooms-${o.id}-${port}.json`);
  const dirty = new Set();

  /** 방 하나 → 저장본 (게임 엔진이 지금 저장할 수 없으면 직전 저장본을 쓴다) */
  function snapRoom(room) {
    let game = null;
    if (room.game) {
      game = room.game.snapshot ? room.game.snapshot() : null;
      if (!game) return room.lastSnap || null;
    }
    const tokens = {};
    for (const m of room.members) {
      if (m.isBot) continue;
      const t = o.tokenOfPid.get(m.pid);
      if (t) tokens[t] = m.pid;
    }
    const snap = { v: 1, at: Date.now(), code: room.code, room: dehydrate(room, ['game', 'flushQueued', 'lastSnap', 'emptySince']), game, tokens };
    room.lastSnap = snap;
    return snap;
  }

  function writeDisk() {
    const all = [];
    for (const room of o.rooms.values()) {
      const s = snapRoom(room);
      if (s) all.push(s);
    }
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(`${file}.tmp`, JSON.stringify(all));
      fs.renameSync(`${file}.tmp`, file);
    } catch (e) { console.error('[방 저장 실패]', e.message); }
  }

  /** 방 사람들 브라우저에 암호화한 사본을 맡긴다 */
  function handOut(room, snap) {
    const nsp = o.getNsp();
    if (!nsp) return;
    const blob = seal(zlib.deflateRawSync(Buffer.from(JSON.stringify(snap))));
    nsp.to(room.code).emit('room:save', blob);
  }

  function tick() {
    if (!dirty.size) return;
    const list = [...dirty];
    dirty.clear();
    for (const code of list) {
      const room = o.rooms.get(code);
      if (!room) continue;
      const before = room.lastSnap;
      const snap = snapRoom(room);
      if (snap && snap !== before) handOut(room, snap);
    }
    writeDisk();
  }
  setInterval(tick, TICK).unref();

  function install(snap) {
    if (!snap || !snap.code || o.rooms.has(snap.code)) return false;
    if (Date.now() - (snap.at || 0) > MAX_AGE) return false;
    let room;
    try { room = o.restoreRoom(snap); } catch (e) {
      console.error(`[${o.id}] 방 ${snap.code} 되살리기 실패`, e);
      return false;
    }
    if (!room) return false;
    room.lastSnap = snap;
    o.rooms.set(room.code, room);
    for (const [token, pid] of Object.entries(snap.tokens || {})) {
      if (o.sessions.has(token)) continue;
      o.sessions.set(token, { pid, socket: null, roomCode: room.code, lastChat: 0, dropTimer: null });
      o.tokenOfPid.set(pid, token);
    }
    console.log(`  [${o.id}] 방 ${room.code} 되살림${room.game ? ' (게임 이어서)' : ''}`);
    return true;
  }

  // 켜질 때: 이 컴퓨터에 저장해 둔 방들
  try {
    const all = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const snap of all) install(snap);
  } catch (_) { /* 처음이거나 없음 */ }

  const api = {
    /** 방 상태가 바뀌었다고 알림 (broadcast 할 때 부른다) */
    mark(room) { if (room) dirty.add(room.code); },
    /** 방이 없어졌을 때 */
    forget(code) { dirty.delete(code); },
    /** 접속한 브라우저가 내민 사본으로 방 되살리기 */
    tryRestore(blob) {
      if (!blob || typeof blob !== 'string' || blob.length > 2_000_000) return false;
      const raw = unseal(blob);
      if (!raw) return false;
      let snap = null;
      try { snap = JSON.parse(zlib.inflateRawSync(raw).toString('utf8')); } catch (_) { return false; }
      return install(snap);
    },
    flush: writeDisk,
  };
  savers.push(api);
  return api;
}

module.exports = { createSaver, dehydrate, revive, rebuild };
