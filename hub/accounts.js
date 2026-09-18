/* 계정 · 프로필
   - 아이디/비밀번호로 가입 · 로그인 (비밀번호는 scrypt 해시로만 저장)
   - 계정 파일: data/accounts.json (git 에 안 올라간다)
   - Render 무료 서버는 재시작하면 파일이 지워지므로, 로그인 쿠키 안에 서명된 계정 사본을 같이 넣어 둔다.
     서버에 계정이 없어졌어도 그 브라우저로 다시 오면 사본으로 되살린다. */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const PARTS = require('./public/common/avatar-parts.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'accounts.json');
const COOKIE = 'bg_acc';
const YEAR = 365 * 24 * 3600 * 1000;

/* 서명 열쇠: 따로 정한 값 → 관리자 비번에서 만든 값 → 이 컴퓨터에 저장한 무작위 값 */
function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.ADMIN_PASSWORD) return crypto.createHash('sha256').update(`bg-accounts:${process.env.ADMIN_PASSWORD}`).digest('hex');
  const f = path.join(DATA_DIR, 'secret.local');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch (_) { /* 처음 */ }
  const s = crypto.randomBytes(32).toString('hex');
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, s); } catch (_) { /* 무시 */ }
  return s;
}
const SECRET = loadSecret();

/* 구글 로그인: Google Cloud 에서 만든 'OAuth 클라이언트 ID' (공개돼도 되는 값)
   환경변수 GOOGLE_CLIENT_ID 또는 hub/google.json {"clientId": "..."} */
function loadGoogleId() {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID.trim();
  try { return String(JSON.parse(fs.readFileSync(path.join(__dirname, 'google.json'), 'utf8')).clientId || '').trim(); } catch (_) { return ''; }
}
const GOOGLE_ID = loadGoogleId();

/** 구글이 준 로그인 표(ID 토큰)가 진짜인지 구글에 물어본다 */
async function verifyGoogle(credential) {
  if (!GOOGLE_ID || typeof credential !== 'string' || credential.length > 4096) return null;
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!r.ok) return null;
  const d = await r.json();
  if (d.aud !== GOOGLE_ID) return null;
  if (d.iss !== 'accounts.google.com' && d.iss !== 'https://accounts.google.com') return null;
  if (!d.sub || Number(d.exp) * 1000 < Date.now()) return null;
  return { sub: String(d.sub), name: String(d.given_name || d.name || '') };
}

let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!db.users) db.users = {}; } catch (_) { /* 처음 */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(`${FILE}.tmp`, JSON.stringify(db));
      fs.renameSync(`${FILE}.tmp`, FILE);
    } catch (e) { console.error('[계정 저장 실패]', e.message); }
  }, 200);
}
const byName = (u) => Object.values(db.users).find((x) => x.u === u.toLowerCase());

/* ───── 비밀번호 */
function hashPw(pw) {
  const salt = crypto.randomBytes(12).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
}
function checkPw(pw, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const a = crypto.scryptSync(pw, salt, 32);
  const b = Buffer.from(h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ───── 쿠키 (서명된 계정 사본) */
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function packCookie(rec) {
  const body = Buffer.from(JSON.stringify(rec)).toString('base64url');
  return `${body}.${sign(body)}`;
}
function unpackCookie(v) {
  const [body, sig] = String(v || '').split('.');
  if (!body || !sig) return null;
  const want = sign(body);
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (_) { return null; }
}
function readCookie(header) {
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}
function setCookie(req, res, rec) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(COOKIE, packCookie(rec), { httpOnly: true, sameSite: 'lax', secure, maxAge: YEAR, path: '/' });
}

/** 요청(또는 소켓 헤더)의 쿠키로 계정 찾기. 서버에 없으면 사본으로 되살린다. */
function userFromCookieHeader(header) {
  const rec = unpackCookie(readCookie(header));
  if (!rec || !rec.id || !rec.u) return null;
  const cur = db.users[rec.id];
  if (cur) {
    // 비밀번호가 바뀌었으면 옛 쿠키는 무효
    if (cur.h !== rec.h) return null;
    return cur;
  }
  if (byName(rec.u)) return null; // 그사이 누가 같은 아이디로 가입함
  db.users[rec.id] = { id: rec.id, u: rec.u, h: rec.h, g: rec.g || undefined, p: cleanProfile(rec.p), v: rec.v || Date.now(), c: rec.c || Date.now() };
  save();
  console.log(`  [계정] 쿠키 사본으로 되살림: ${rec.u}`);
  return db.users[rec.id];
}

/* ───── 프로필 */
function cleanNick(s) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 10); }
function cleanProfile(p) {
  p = p || {};
  return {
    nickname: cleanNick(p.nickname) || '손님',
    avatar: PARTS.clean(p.avatar),
    title: PARTS.TITLES.includes(p.title) ? p.title : PARTS.TITLES[0],
    bio: String(p.bio || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60),
  };
}
const pub = (rec) => ({ id: rec.id, username: rec.g ? '' : rec.u, google: !!rec.g, profile: rec.p, since: rec.c });

/* ───── 너무 많은 로그인 시도 막기 */
const tries = new Map();
function tooMany(ip) {
  const now = Date.now();
  const t = (tries.get(ip) || []).filter((x) => now - x < 5 * 60_000);
  tries.set(ip, t);
  return t.length >= 12;
}
const noteTry = (ip) => tries.get(ip).push(Date.now());

function mount(app) {
  const json = express.json({ limit: '4kb' });

  app.get('/api/me', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const rec = userFromCookieHeader(req.headers.cookie);
    if (!rec) return res.json({ user: null });
    setCookie(req, res, rec); // 다른 기기에서 바꾼 프로필을 사본에도 반영
    return res.json({ user: pub(rec) });
  });

  app.post('/api/account/signup', json, (req, res) => {
    const ip = req.ip;
    if (tooMany(ip)) return res.status(429).json({ ok: false, error: '잠시 후에 다시 해 주세요' });
    noteTry(ip);
    const b = req.body || {};
    const u = String(b.username || '').trim().toLowerCase();
    const pw = String(b.password || '');
    const nick = cleanNick(b.nickname);
    if (!/^[a-z0-9_]{3,16}$/.test(u)) return res.status(400).json({ ok: false, error: '아이디는 영어 소문자 · 숫자 · _ 로 3~16자예요' });
    if (pw.length < 4 || pw.length > 64) return res.status(400).json({ ok: false, error: '비밀번호는 4자 이상이에요' });
    if (!nick) return res.status(400).json({ ok: false, error: '닉네임을 적어 주세요 (10자까지)' });
    if (byName(u)) return res.status(409).json({ ok: false, error: '이미 있는 아이디예요' });
    const id = crypto.randomBytes(8).toString('hex');
    const avatar = b.avatar ? PARTS.clean(b.avatar) : PARTS.fromSeed(u);
    const rec = { id, u, h: hashPw(pw), p: cleanProfile({ nickname: nick, avatar }), v: Date.now(), c: Date.now() };
    db.users[id] = rec;
    save();
    setCookie(req, res, rec);
    return res.json({ ok: true, user: pub(rec) });
  });

  app.post('/api/account/login', json, (req, res) => {
    const ip = req.ip;
    if (tooMany(ip)) return res.status(429).json({ ok: false, error: '너무 많이 틀렸어요. 5분 뒤에 다시 해 주세요' });
    const b = req.body || {};
    const rec = byName(String(b.username || '').trim());
    if (!rec || !checkPw(String(b.password || ''), rec.h)) {
      noteTry(ip);
      return res.status(401).json({ ok: false, error: '아이디나 비밀번호가 달라요' });
    }
    setCookie(req, res, rec);
    return res.json({ ok: true, user: pub(rec) });
  });

  app.get('/api/auth/config', (_req, res) => res.json({ google: GOOGLE_ID || null }));

  // 구글로 로그인 (처음이면 계정을 만든다)
  app.post('/api/account/google', json, async (req, res) => {
    const ip = req.ip;
    if (tooMany(ip)) return res.status(429).json({ ok: false, error: '잠시 후에 다시 해 주세요' });
    if (!GOOGLE_ID) return res.status(400).json({ ok: false, error: '구글 로그인이 아직 설정되지 않았어요' });
    const b = req.body || {};
    let g = null;
    try { g = await verifyGoogle(b.credential); } catch (e) { console.error('[구글 확인 실패]', e.message); }
    if (!g) { noteTry(ip); return res.status(401).json({ ok: false, error: '구글 로그인을 확인하지 못했어요. 다시 해 주세요' }); }
    let rec = Object.values(db.users).find((x) => x.g === g.sub);
    let created = false;
    if (!rec) {
      const draft = b.draft && typeof b.draft === 'object' ? b.draft : {};
      const id = crypto.randomBytes(8).toString('hex');
      rec = {
        id, u: `g:${g.sub}`, h: '', g: g.sub,
        p: cleanProfile({ ...draft, nickname: cleanNick(draft.nickname) || cleanNick(g.name) || '손님', avatar: draft.avatar || PARTS.fromSeed(g.sub) }),
        v: Date.now(), c: Date.now(),
      };
      db.users[id] = rec;
      save();
      created = true;
    }
    setCookie(req, res, rec);
    return res.json({ ok: true, created, user: pub(rec) });
  });

  app.post('/api/account/logout', (req, res) => {
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  app.post('/api/account/profile', json, (req, res) => {
    const rec = userFromCookieHeader(req.headers.cookie);
    if (!rec) return res.status(401).json({ ok: false, error: '로그인이 필요해요' });
    const b = req.body || {};
    const next = cleanProfile({ ...rec.p, ...b, avatar: { ...rec.p.avatar, ...(b.avatar && typeof b.avatar === 'object' ? b.avatar : {}) } });
    if (!cleanNick(b.nickname) && b.nickname !== undefined) return res.status(400).json({ ok: false, error: '닉네임을 적어 주세요' });
    rec.p = next;
    rec.v = Date.now();
    save();
    setCookie(req, res, rec);
    return res.json({ ok: true, user: pub(rec) });
  });

  app.post('/api/account/password', json, (req, res) => {
    const rec = userFromCookieHeader(req.headers.cookie);
    if (!rec) return res.status(401).json({ ok: false, error: '로그인이 필요해요' });
    const b = req.body || {};
    if (rec.g) return res.status(400).json({ ok: false, error: '구글 계정은 비밀번호가 없어요' });
    if (!checkPw(String(b.old || ''), rec.h)) return res.status(401).json({ ok: false, error: '지금 비밀번호가 달라요' });
    const pw = String(b.password || '');
    if (pw.length < 4 || pw.length > 64) return res.status(400).json({ ok: false, error: '새 비밀번호는 4자 이상이에요' });
    rec.h = hashPw(pw);
    rec.v = Date.now();
    save();
    setCookie(req, res, rec);
    return res.json({ ok: true });
  });
}

/* ───── 게임 서버에서 쓰는 이모트 검사 */
function cleanEmote(data) {
  const id = data && String(data.id || '');
  if (!PARTS.EMOTE_IDS.includes(id)) return null;
  return { id, avatar: PARTS.clean(data.avatar) };
}

module.exports = { mount, userFromCookieHeader, cleanEmote };
