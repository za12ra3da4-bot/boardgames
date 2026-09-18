'use strict';
// AI끼리 게임을 여러 판 돌려 규칙 엔진이 멈추거나 자원·말이 어긋나지 않는지 확인한다: npm run sim:isle
const Game = require('../server/game');
const I = require('../public/shared/isle');

Game.setPace(0);
const GAMES = Number(process.argv[2]) || 200;

function play(n, idx, map) {
  return new Promise((resolve) => {
    const seats = Array.from({ length: n }, (_, i) => ({ pid: `bot${i}`, name: `봇${i}`, isBot: true }));
    let g;
    const started = Date.now();
    const done = (why) => {
      clearInterval(watch);
      g.destroy();
      resolve({ why, g, ms: Date.now() - started });
    };
    const watch = setInterval(() => {
      if (g.phase === 'over') return done('over');
      if (g.turnNo > 600) return done('stuck');
      const a = g.audit();
      if (a.bad.length || a.neg || !a.pieces) return done(`audit ${JSON.stringify(a)}`);
      if (Date.now() - started > 20000) return done('timeout');
    }, 5);
    g = new Game(seats, { changed() {}, isOnline: () => true }, { map });
  });
}

(async () => {
  const stats = { over: 0, turns: [], vp: {}, road: 0, army: 0 };
  for (let i = 0; i < GAMES; i++) {
    const map = I.MAP_IDS[i % I.MAP_IDS.length];
    const M = I.map(map);
    const n = M.minPlayers + (i % (M.maxPlayers - M.minPlayers + 1));
    const { why, g, ms } = await play(n, i, map);
    if (why !== 'over') {
      console.log(`#${i} ${map} ${n}인 실패: ${why} (턴 ${g.turnNo}, 단계 ${g.phase}/${g.turn && g.turn.stage})`);
      console.log(g.log.slice(-8).map((l) => l.text).join('\n'));
      process.exit(1);
    }
    stats.over++;
    stats.turns.push(g.turnNo);
    const w = g.over.scores.find((s) => s.pid === g.over.winner);
    stats.vp[w.vp] = (stats.vp[w.vp] || 0) + 1;
    if (g.awards.road) stats.road++;
    if (g.awards.army) stats.army++;
    if (i % 7 === 0 || i < 7) console.log(`#${i} ${map} ${n}인 · ${g.turnNo}턴 · 승자 ${w.vp}점 (${ms}ms)`);
  }
  stats.turns.sort((a, b) => a - b);
  console.log(`\n${stats.over}판 모두 끝까지 진행`);
  console.log(`턴 수: 최소 ${stats.turns[0]} / 중앙 ${stats.turns[stats.turns.length >> 1]} / 최대 ${stats.turns[stats.turns.length - 1]}`);
  console.log('승자 점수 분포:', stats.vp);
  console.log(`최장 교역로 나온 판 ${stats.road}, 최강 기사단 나온 판 ${stats.army}`);
})();
