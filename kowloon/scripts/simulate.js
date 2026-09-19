'use strict';
// 봇끼리 수백 판 돌려서 규칙 · AI 가 멈추지 않는지 확인한다
const Game = require('../server/game');
const { dehydrate } = require('../../hub/persist');

Game.setPace(0.0005);
const N = Number(process.argv[2]) || 300;
const stats = { good: 0, bad: 0, reasons: {}, rounds: {}, stuck: 0, restored: 0 };

function play(n, i) {
  return new Promise((resolve) => {
    const seats = Array.from({ length: n }, (_, k) => ({ pid: `b${k}`, name: `봇${k}`, isBot: true }));
    let g;
    const done = setTimeout(() => { stats.stuck++; console.log('멈춤', n, g.phase, g.round); g.destroy(); resolve(); }, 20000);
    const hooks = {
      changed: () => {
        if (g && g.phase === 'over' && !g._counted) {
          g._counted = true;
          stats[g.over.winner]++;
          stats.reasons[g.over.reason] = (stats.reasons[g.over.reason] || 0) + 1;
          stats.rounds[g.round] = (stats.rounds[g.round] || 0) + 1;
          clearTimeout(done);
          setTimeout(() => { g.destroy(); resolve(); }, 1);
        }
      },
      isOnline: () => true,
      chat: () => {},
    };
    g = new Game(seats, { pid: 'fs_ai', name: 'AI', isBot: true }, hooks);
    // 몇 판은 중간에 저장했다가 되살려서 이어 한다
    if (i % 10 === 3) {
      setTimeout(() => {
        if (g.phase === 'over') return;
        const snap = JSON.parse(JSON.stringify(g.snapshot()));
        g.destroy();
        g = Game.restore(snap, hooks);
        stats.restored++;
      }, 30);
    }
    void dehydrate;
  });
}

(async () => {
  for (let i = 0; i < N; i++) await play(3 + (i % 10), i);
  console.log(JSON.stringify(stats));
  process.exit(stats.stuck ? 1 : 0);
})();
