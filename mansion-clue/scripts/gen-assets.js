'use strict';
// 게임에 쓰이는 모든 그림(SVG)을 생성한다: npm run assets
const fs = require('fs');
const path = require('path');
const chars = require('./art/characters');
const weapons = require('./art/weapons');
const rooms = require('./art/rooms');
const ui = require('./art/ui');

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
for (const [id, fn] of Object.entries(weapons)) write(`weapon/${id}.svg`, fn());
for (const [id, fn] of Object.entries(rooms)) write(`room/${id}.svg`, fn());
for (const [id, content] of Object.entries(ui.icons)) write(`ui/${id}.svg`, content);
for (const [id, content] of Object.entries(ui.rules)) write(`rules/${id}.svg`, content);
write('box.svg', require('./art/box').box());
write('logo.svg', ui.logo);
write('envelope.svg', ui.envelope);
write('card-frame.svg', ui.cardFrame);
write('card-back.svg', ui.cardBack);
write('favicon.svg', ui.favicon);

console.log(`에셋 생성 완료: ${count}개 파일`);
