'use strict';
// 보름밤 늑대인간 그림(SVG)을 만든다: npm run assets:wolf
const fs = require('fs');
const path = require('path');
const { ROLE_ART, cardBack } = require('./art/roles');
const { box, logo } = require('./art/box');

const OUT = path.join(__dirname, '..', 'public', 'assets');
let count = 0;
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim() + '\n');
  count++;
}

for (const [id, fn] of Object.entries(ROLE_ART)) write(`role/${id}.svg`, fn());
write('card-back.svg', cardBack());
write('box.svg', box());
write('logo.svg', logo());
console.log(`에셋 생성 완료: ${count}개 파일`);
