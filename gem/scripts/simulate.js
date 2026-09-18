'use strict';
// AI끼리 여러 판 돌려 규칙 엔진을 검사한다: npm run sim:gem
const Game = require('../server/game');
const G = require('../public/shared/gem');

Game.setPace(0.001);
const N = Number(process.argv[2]) || 60;

function audit(g) {
  for (const k of [...G.COLORS, 'gold']) {
    const sum = g.bank[k] + g.players.reduce((s, p) => s + p.gems[k], 0);
    const want = k === 'gold' ? G.GOLD_COUNT : G.tokenCount(g.players.length);
    if (sum !== want) throw new Error(`${k} 보석 수가 어긋남 ${sum}/${want}`);
    if (g.bank[k] < 0) throw new Error('은행 음수');
  }
  const cards = [1, 2, 3].reduce((s, t) => s + g.decks[t].length + g.market[t].filter(Boolean).length, 0) + g.players.reduce((s, p) => s + p.cards.length + p.reserved.length, 0);
  if (cards !== 90) throw new Error(`카드 수 어긋남 ${cards}`);
}

function one(i) {
  return new Promise((resolve, reject) => {
    const n = 2 + (i % 3);
    let g;
    const t0 = Date.now();
    g = new Game(Array.from({ length: n }, (_, k) => ({ pid: `b${k}`, name: `봇${k}`, isBot: true })), {
      isOnline: () => true,
      changed: () => {
        if (!g) return;
        try { audit(g); } catch (e) { g.destroy(); reject(e); return; }
        if (g.phase === 'over') { g.destroy(); resolve(g.round); }
        else if (g.round > 80) { g.destroy(); reject(new Error('너무 오래 걸림')); }
      },
    });
    setTimeout(() => reject(new Error(`시간 초과 round ${g.round} ${Date.now() - t0}`)), 30000);
  });
}

(async () => {
  const rounds = [];
  for (let i = 0; i < N; i += 10) rounds.push(...await Promise.all(Array.from({ length: Math.min(10, N - i) }, (_, k) => one(i + k))));
  console.log(`${rounds.length}판 완료, 바퀴 수 ${Math.min(...rounds)}~${Math.max(...rounds)} (평균 ${(rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(1)})`);
})().catch((e) => { console.error('실패', e.message); process.exit(1); });
