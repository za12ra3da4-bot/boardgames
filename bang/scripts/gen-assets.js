'use strict';
// 게임에 쓰이는 모든 그림(SVG)을 생성한다: npm run assets
const fs = require('fs');
const path = require('path');
const chars = require('./art/chars');
const cards = require('./art/cards');
const ui = require('./art/ui');
const HAND = require('../public/shared/hand-art');
const table = require('./art/table');

const OUT = path.join(__dirname, '..', 'public', 'assets');
let count = 0;
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim() + '\n');
  count++;
}

for (const [id, fn] of Object.entries(chars)) {
  const { full, face } = fn();
  write(`char/${id}.svg`, full);
  write(`face/${id}.svg`, face);
}
for (const [id, fn] of Object.entries(cards.ART)) write(`card/${id}.svg`, fn());
write('frame-brown.svg', cards.frame('brown'));
write('frame-blue.svg', cards.frame('blue'));
write('frame-green.svg', cards.frame('green'));
write('card-back.svg', cards.cardBack());
for (const [id, content] of Object.entries(ui.roles)) write(`role/${id}.svg`, content);
for (const [id, content] of Object.entries(ui.icons)) write(`ui/${id}.svg`, content);
for (const [id, content] of Object.entries(ui.rules)) write(`rules/${id}.svg`, content);
write('bullet.svg', ui.bullet);
write('bullet-empty.svg', ui.bulletEmpty);
write('logo.svg', ui.logo);
write('wood.svg', table.wood());
write('paper.svg', table.paper());
write('board.svg', table.board());
write('bullet-h.svg', table.bulletFilled());
write('ui/hand-open.svg', HAND.hand('c', 30, 'open', false));
write('ui/hand-grab.svg', HAND.hand('c', 30, 'grab', false));

console.log(`에셋 생성 완료: ${count}개 파일`);
