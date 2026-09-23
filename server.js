'use strict';
// 보드게임 - 한 서버가 허브 페이지와 모든 게임을 함께 서비스한다.
//   /        보드게임 목록
//   /bang/   황야의 뱅
//   /clue/   밤의 저택
//   /isle/   바람섬 개척기
//   /roach/  바퀴벌레 포커
//   /gem/    찬란한 보석상
const path = require('path');
const http = require('http');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 3000;

const GAMES = [
  {
    id: 'clue',
    base: '/clue',
    dir: 'mansion-clue',
    title: '밤의 저택',
    sub: '추리 보드게임',
    desc: '저택에서 벌어진 살인 사건. 방을 돌며 단서를 모아 범인과 흉기, 장소를 맞혀라.',
    players: '3~6명',
    time: '30~50분',
  },
  {
    id: 'bang',
    base: '/bang',
    dir: 'bang',
    title: '황야의 뱅',
    sub: '서부 카드게임',
    desc: '보안관, 부관, 무법자, 배신자. 정체를 숨긴 채 벌이는 서부 총격전.',
    players: '4~7명',
    time: '20~40분',
  },
  {
    id: 'isle',
    base: '/isle',
    dir: 'isle',
    title: '바람섬 개척기',
    sub: '개척 · 교역 보드게임',
    desc: '자원을 모아 길과 마을을 짓고, 서로 거래하며 먼저 10점을 만드는 개척 게임.',
    players: '3~4명',
    time: '45~75분',
  },
  {
    id: 'roach',
    base: '/roach',
    dir: 'roach',
    title: '바퀴벌레 포커',
    sub: '속이기 카드게임',
    desc: '“이건 전갈이야.” 엎어 놓고 밀면 상대는 맞다 · 아니다를 고르거나, 몰래 보고 딴 사람에게 떠넘긴다. 같은 벌레 4장을 모으면 진다!',
    players: '2~6명',
    time: '20분',
  },
  {
    id: 'gem',
    base: '/gem',
    dir: 'gem',
    title: '찬란한 보석상',
    sub: '보석 수집 · 경제 게임',
    desc: '르네상스의 보석 상인이 되어 원석을 모으고, 광산과 공방을 사들여 귀족의 후원을 받아라. 먼저 15점!',
    players: '2~4명',
    time: '30분',
  },
  {
    id: 'kowloon',
    base: '/kowloon',
    dir: 'kowloon',
    title: '구룡 살인사건',
    sub: '속임수 추리 게임 (디셉션)',
    desc: '범인은 이 안에 있다. 말 못 하는 법의학자의 총알만 보고 살인 수단과 결정적 단서를 맞혀라.',
    players: '3~12명',
    time: '20~30분',
  },
  {
    id: 'dalmuti',
    base: '/dalmuti',
    dir: 'dalmuti',
    title: '왕궁의 달무티',
    sub: '계급 카드게임 (달무티)',
    desc: '대달무티부터 농노까지. 먼저 카드를 다 털어 신분을 올려라. 농노는 세금을 바치고, 광대 두 장이면 혁명!',
    players: '4~8명',
    time: '20~40분',
  },
];

// 같은 게임의 확장판: 선반에 상자를 따로 놓는다 (같은 서버 · 주소에 ?ed= 로 판을 고른다)
const EXPANSIONS = [
  {
    id: 'dalmuti-joseon',
    of: 'dalmuti',
    url: '/dalmuti/?ed=joseon',
    title: '달무티 조선 궁궐판',
    sub: '확장판 · 계급 카드게임',
    desc: '임금부터 노비까지 조선 궁궐의 신분 싸움. 마패 두 장이 들어간다 — 내 차례에 내면 “암행어사 출두요!” 깔린 판을 엎고 내가 새로 낸다.',
    players: '4~8명',
    time: '20~40분',
  },
];

const app = express();
const server = http.createServer(app);
// 느린 네트워크(하마치 등)나 백그라운드 탭에서도 끊기지 않도록 여유 있게
const io = new Server(server, { pingInterval: 15_000, pingTimeout: 60_000, maxHttpBufferSize: 1e6 });

// 예상 못 한 오류가 나도 서버는 계속 살아 있게 한다
process.on('uncaughtException', (e) => console.error('[오류 - 서버는 계속 실행됩니다]', e));
process.on('unhandledRejection', (e) => console.error('[오류 - 서버는 계속 실행됩니다]', e));

// 게임들을 각자의 주소에 붙인다 (socket.io 는 네임스페이스로 분리된다)
// 슬래시 없는 /bang 은 express.static 이 알아서 /bang/ 으로 넘겨준다.
// ── 손그림 파일로 바꿔 끼우기: <게임>/art/<경로>.png 가 있으면 /<게임>/assets/<경로>.svg 대신 그 파일을 보낸다.
//    (예: bang/art/card/bang.png → /bang/assets/card/bang.svg 자리에 나온다. 코드는 고칠 필요 없음)
const ART_EXT = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
function findArt(dir, rel) {
  if (!/^[a-z0-9_\-/]+$/i.test(rel) || rel.includes('..')) return null;
  for (const ext of ART_EXT) {
    const file = path.join(__dirname, dir, 'art', rel + ext);
    if (fs.existsSync(file)) return file;
  }
  return null;
}
for (const g of GAMES) {
  app.get(new RegExp(`^${g.base}/assets/(.+)\\.svg$`), (req, res, next) => {
    const file = findArt(g.dir, req.params[0]);
    if (!file) return next();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(file);
  });
}

for (const g of GAMES) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(`./${g.dir}/mount`)(app, io, g.base);
  console.log(`  [붙임] ${g.title} → ${g.base}/`);
}

// 각 게임 폴더의 진짜 로고 파일을 허브 카드에 그대로 쓴다
for (const g of GAMES) {
  app.get(`/logo/${g.id}.svg`, (_req, res) => {
    res.sendFile(path.join(__dirname, g.dir, 'public', 'assets', 'logo.svg'));
  });
}

// ── 게임 방법 영상 링크 (hub/links.json). 관리자만 고칠 수 있다.
const LINKS_FILE = path.join(__dirname, 'hub', 'links.json');
function readLinks() {
  try {
    return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}
function writeLinks(links) {
  fs.writeFileSync(LINKS_FILE, `${JSON.stringify(links, null, 2)}\n`);
}
// ── 관리자 로그인. 비밀번호는 hub/admin.local.json 에 암호화(scrypt)해서만 보관한다 (GitHub 에 안 올라감).
//    다른 곳에 배포할 때는 환경 변수 ADMIN_PASSWORD 로 정할 수 있다.
const ADMIN_FILE = path.join(__dirname, 'hub', 'admin.local.json');
function checkPassword(pw) {
  pw = String(pw || '');
  if (process.env.ADMIN_PASSWORD) {
    const a = Buffer.from(pw);
    const b = Buffer.from(process.env.ADMIN_PASSWORD);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  try {
    const { salt, hash } = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    const got = crypto.scryptSync(pw, salt, 32);
    return crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}
const adminTokens = new Map();           // 토큰 → 만료 시각
const loginTries = new Map();            // IP → { n, until }
const ADMIN_TTL = 7 * 24 * 3600_000;

function canEdit(req) {
  const t = String(req.get('x-admin-token') || '');
  const exp = adminTokens.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { adminTokens.delete(t); return false; }
  return true;
}

app.post('/api/admin/login', express.json({ limit: '1kb' }), (req, res) => {
  const ip = req.socket.remoteAddress || '?';
  const now = Date.now();
  const tr = loginTries.get(ip) || { n: 0, until: 0 };
  if (tr.until > now) return res.status(429).json({ ok: false, error: `너무 많이 틀렸어요. ${Math.ceil((tr.until - now) / 60000)}분 뒤에 다시 시도하세요` });
  if (!checkPassword(req.body && req.body.password)) {
    tr.n++;
    if (tr.n >= 5) { tr.n = 0; tr.until = now + 10 * 60_000; }
    loginTries.set(ip, tr);
    return res.status(401).json({ ok: false, error: '비밀번호가 틀렸어요' });
  }
  loginTries.delete(ip);
  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.set(token, now + ADMIN_TTL);
  res.json({ ok: true, token });
});

app.post('/api/admin/logout', (req, res) => {
  adminTokens.delete(String(req.get('x-admin-token') || ''));
  res.json({ ok: true });
});

// ── 손그림 파일 목록: <게임>/art/slots.json 의 칸마다 파일이 들어갔는지 알려 준다 (관리자만)
app.get('/api/art/:id', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!canEdit(req)) return res.status(403).json({ error: '관리자만 볼 수 있어요' });
  const g = GAMES.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: '없는 게임' });
  let slots;
  try {
    slots = JSON.parse(fs.readFileSync(path.join(__dirname, g.dir, 'art', 'slots.json'), 'utf8'));
  } catch (e) {
    return res.json({ id: g.id, title: g.title, base: g.base, groups: [] });
  }
  for (const grp of slots.groups) {
    for (const it of grp.items) {
      const rel = grp.dir ? `${grp.dir}/${it.id}` : it.id;
      const file = findArt(g.dir, rel);
      it.path = `${g.dir}/art/${rel}.png`;
      it.url = `${g.base}/assets/${rel}.svg`;
      it.done = !!file;
    }
  }
  return res.json({ id: g.id, title: g.title, base: g.base, ...slots });
});

// 게임 중 브라우저가 가끔 불러 서버가 잠들지 않게 한다
app.get('/api/ping', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json({ ok: true, t: Date.now() }); });

app.get('/api/games', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const links = readLinks();
  res.json({
    canEdit: canEdit(req),
    games: GAMES.flatMap((g) => [g, ...EXPANSIONS.filter((x) => x.of === g.id)]).map((g) => ({
      id: g.id, title: g.title, sub: g.sub, desc: g.desc,
      players: g.players, time: g.time, url: g.url || `${g.base}/`,
      links: Array.isArray(links[g.id]) ? links[g.id] : [],
    })),
  });
});

app.post('/api/links', express.json({ limit: '8kb' }), (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ ok: false, error: '관리자로 로그인해야 고칠 수 있어요' });
  const { game, action } = req.body || {};
  if (![...GAMES, ...EXPANSIONS].some((g) => g.id === game)) return res.status(400).json({ ok: false, error: '없는 게임입니다' });
  const links = readLinks();
  const list = Array.isArray(links[game]) ? links[game] : [];
  if (action === 'add') {
    const url = String(req.body.url || '').trim();
    let parsed;
    try { parsed = new URL(url); } catch (e) { parsed = null; }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return res.status(400).json({ ok: false, error: '올바른 주소(http로 시작)를 넣어 주세요' });
    const title = String(req.body.title || '').trim().slice(0, 80) || parsed.hostname;
    const note = String(req.body.note || '').trim().slice(0, 20);
    if (list.length >= 12) return res.status(400).json({ ok: false, error: '링크는 게임마다 12개까지예요' });
    list.push({ title, url: parsed.href, note });
  } else if (action === 'remove') {
    const i = Number(req.body.index);
    if (!Number.isInteger(i) || !list[i]) return res.status(400).json({ ok: false, error: '없는 링크입니다' });
    list.splice(i, 1);
  } else if (action === 'move') {
    const i = Number(req.body.index);
    const j = i + (req.body.dir === 'up' ? -1 : 1);
    if (!list[i] || !list[j]) return res.status(400).json({ ok: false, error: '옮길 수 없어요' });
    [list[i], list[j]] = [list[j], list[i]];
  } else {
    return res.status(400).json({ ok: false, error: '알 수 없는 요청입니다' });
  }
  links[game] = list;
  writeLinks(links);
  res.json({ ok: true, links: list });
});

// 계정 · 프로필 (로그인하면 게임에 이름을 안 쳐도 된다)
require('./hub/accounts').mount(app);

app.get('/healthz', (_req, res) => res.send('ok'));
app.use(express.static(path.join(__dirname, 'hub', 'public')));

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  포트 ${PORT} 이(가) 이미 사용 중입니다. 서버가 이미 켜져 있는지 확인하세요.\n`);
    process.exit(2);
  }
  throw e;
});

server.listen(PORT, () => {
  console.log('\n  ============================================');
  console.log('   보드게임 - 서버 실행 중');
  console.log('  ============================================\n');
  console.log('   아래 주소를 친구에게 알려 주세요. 이 창을 닫으면 서버가 꺼집니다.\n');
  console.log(`   내 컴퓨터        http://localhost:${PORT}`);
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const label = /hamachi/i.test(name) || a.address.startsWith('25.') ? '하마치(친구용)' : name;
      console.log(`   ${label.padEnd(16)} http://${a.address}:${PORT}`);
    }
  }
  console.log('');
});
