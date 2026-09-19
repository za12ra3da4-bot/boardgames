'use strict';
// 봇끼리 수백 판 돌려서 규칙 · AI 가 멈추지 않는지, 카드가 새지 않는지 확인
const Game = require('../server/game');

Game.setPace(0.0005);
const N = Number(process.argv[2]) || 200;
const st = { done: 0, stuck: 0, revolts: 0, restored: 0, badCards: 0 };

function play(n, i) {
  return new Promise((resolve) => {
    const seats = Array.from({ length: n }, (_, k) => ({ pid: `b${k}`, name: `봇${k}`, isBot: true }));
    let g;
    const done = setTimeout(() => { st.stuck++; console.log('멈춤', n, g.phase, g.round, g.turn); g.destroy(); resolve(); }, 30000);
    const hooks = {
      changed() {
        if (!g) return;
        // 카드 수 검사: 80장이 손패 + 낸 카드 어딘가에
        if (g.phase === 'play' && g.round && !g._chk) {
          const inHands = g.players.reduce((s, p) => s + p.hand.length, 0);
          if (inHands > 80) st.badCards++;
        }
        for (const e of g.events) if (e.type === 'revolution' && !e._c) { e._c = 1; st.revolts++; }
        if (g.phase === 'over' && !g._counted) {
          g._counted = true;
          st.done++;
          clearTimeout(done);
          setTimeout(() => { g.destroy(); resolve(); }, 1);
        }
      },
      isOnline: () => true,
    };
    g = new Game(seats, hooks, { rounds: 3 });
    if (i % 8 === 3) {
      setTimeout(() => {
        if (g.phase === 'over') return;
        const snap = JSON.parse(JSON.stringify(g.snapshot()));
        g.destroy();
        g = Game.restore(snap, hooks);
        st.restored++;
      }, 40);
    }
  });
}

(async () => {
  for (let i = 0; i < N; i++) await play(4 + (i % 5), i);
  console.log(JSON.stringify(st));
  process.exit(st.stuck ? 1 : 0);
})();
