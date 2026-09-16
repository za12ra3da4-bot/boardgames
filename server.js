'use strict';
// 보드게임 - 한 서버가 허브 페이지와 모든 게임을 함께 서비스한다.
//   /        보드게임 목록
//   /bang/   황야의 뱅
//   /clue/   밤의 저택
const path = require('path');
const http = require('http');
const os = require('os');
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

app.get('/api/games', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(GAMES.map((g) => ({
    id: g.id, title: g.title, sub: g.sub, desc: g.desc,
    players: g.players, time: g.time, url: `${g.base}/`,
  })));
});

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
