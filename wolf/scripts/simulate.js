'use strict';
// 봇끼리 게임을 여러 번 돌려 규칙 엔진을 검사한다: npm run sim:wolf
const Game = require('../server/game');
const W = require('../public/shared/wolf');

Game.setPace(0.001);
const N = Number(process.argv[2]) || 200;
const tally = {};
let done = 0;

function one(i) {
  return new Promise((resolve, reject) => {
    const n = W.MIN_PLAYERS + (i % (W.MAX_PLAYERS - W.MIN_PLAYERS + 1));
    const seats = Array.from({ length: n }, (_, k) => ({ pid: `b${k}`, name: `봇${k}`, isBot: true }));
    let g;
    const chats = [];
    g = new Game(seats, {
      changed: () => {
        if (!g || g.phase !== 'over') return;
        const o = g.over;
        const all = [...Object.values(o.final), ...o.center].sort().join();
        const orig = [...Object.values(o.original), ...o.centerOriginal].sort().join();
        if (all !== orig) return reject(new Error('카드 수가 어긋남'));
        for (const pid of o.dead) if (!g.pl(pid)) return reject(new Error('없는 사람이 죽음'));
        tally[o.outcome] = (tally[o.outcome] || 0) + 1;
        g.destroy();
        resolve(chats.length);
      },
      isOnline: () => true,
      chat: (pid, text) => chats.push(text),
    });
    setTimeout(() => reject(new Error(`시간 초과 (phase ${g.phase})`)), 20000);
  });
}

(async () => {
  for (let i = 0; i < N; i += 20) {
    await Promise.all(Array.from({ length: Math.min(20, N - i) }, (_, k) => one(i + k).then(() => done++)));
  }
  console.log(`${done}판 완료`, tally);
})().catch((e) => { console.error('실패', e); process.exit(1); });
