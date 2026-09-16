'use strict';
// AI 탐정끼리 게임을 빠르게 돌려서 규칙 엔진을 검사한다: node scripts/simulate.js [판수] [인원]
const Game = require('../server/game');
const C = require('../public/shared/data');

const GAMES = Number(process.argv[2]) || 50;
const PLAYERS = Math.min(6, Math.max(2, Number(process.argv[3]) || 4));
Game.setBotDelay(() => 0);

function runOne(i) {
  return new Promise((resolve, reject) => {
    const seats = C.SUSPECTS.slice(0, PLAYERS).map((s, k) => ({ pid: `bot_${k}`, name: `봇${k}`, isBot: true, char: s.id }));
    let g;
    const started = Date.now();
    const hooks = {
      isOnline: () => true,
      changed: () => {
        if (!g) return;
        // 보이는 정보가 새지 않는지 검사
        for (const p of g.players) {
          const v = g.viewFor(p.pid);
          if (v.phase === 'play') {
            if (v.over) return reject(new Error('진행 중인데 정답이 노출됨'));
            const sg = v.suggestion;
            if (sg && sg.card && p.pid !== sg.by && p.pid !== sg.shownBy) return reject(new Error('남의 반박 카드가 노출됨'));
            if (v.turn.reach && v.turn.pid !== p.pid) return reject(new Error('남의 이동 범위가 노출됨'));
          }
        }
        if (g.phase === 'over') {
          clearInterval(watchdog);
          resolve({ turns: g.turnNo, winner: g.winner, ms: Date.now() - started, acc: g.accusations.length });
        }
      },
    };
    const watchdog = setInterval(() => {
      if (g && g.turnNo > 600) {
        clearInterval(watchdog);
        g.destroy();
        reject(new Error(`게임 ${i}: 600턴 넘게 끝나지 않음`));
      }
    }, 50);
    g = new Game(seats, hooks);
  });
}

(async () => {
  const results = [];
  for (let i = 0; i < GAMES; i++) results.push(await runOne(i));
  const turns = results.map((r) => r.turns).sort((a, b) => a - b);
  const reasons = {};
  for (const r of results) reasons[r.winner.reason] = (reasons[r.winner.reason] || 0) + 1;
  console.log(`${GAMES}판 (${PLAYERS}인) 완료`);
  console.log(`턴 수: 최소 ${turns[0]} / 중앙 ${turns[Math.floor(turns.length / 2)]} / 최대 ${turns[turns.length - 1]}`);
  console.log('종료 사유:', reasons);
  console.log(`오답 고발 포함 판: ${results.filter((r) => r.acc > 1).length}`);
})().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
