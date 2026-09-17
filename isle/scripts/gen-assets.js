'use strict';
// 바람섬 개척기 그림(SVG)을 모두 만든다: npm run assets:isle
const fs = require('fs');
const path = require('path');
const tiles = require('./art/tiles');
const cards = require('./art/cards');

const OUT = path.join(__dirname, '..', 'public', 'assets');
let count = 0;
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${content.trim()}\n`);
  count++;
}

for (const [kind, fn] of Object.entries(tiles.TILES)) {
  for (let v = 1; v <= tiles.VARIANTS; v++) write(`tile/${kind}-${v}.svg`, fn(v * 17 + kind.length));
}
write('sea.svg', tiles.sea());
for (const [id, fn] of Object.entries(cards.RES_ART)) write(`res/${id}.svg`, fn());
for (const [id, fn] of Object.entries(cards.DEV_ART)) write(`dev/${id}.svg`, fn());
write('card-back.svg', cards.cardBack());
for (const r of ['wood', 'brick', 'sheep', 'wheat', 'ore']) write(`icon/${r}.svg`, cards.icon(r));
// 로고: 작은 섬 (육각 7칸)
{
  const hex = (cx, cy, r, fill) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    });
    return `<path d="M${pts.join('L')}Z" fill="${fill}" stroke="#2a1a0c" stroke-width="1.4"/>`;
  };
  const r = 10.5;
  const w = r * Math.sqrt(3);
  const cells = [[0, 0, '#dcae44'], [w, 0, '#56752f'], [-w, 0, '#8e969e'], [w / 2, -r * 1.5, '#b8683c'], [-w / 2, -r * 1.5, '#8cb654'], [w / 2, r * 1.5, '#56752f'], [-w / 2, r * 1.5, '#e3c283']];
  const body = `<circle cx="32" cy="32" r="31" fill="#2c6f9c" stroke="#1a1206" stroke-width="2"/>${cells.map(([x, y, c]) => hex(32 + x, 32 + y, r, c)).join('')}`;
  write('logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${body}</svg>`);
}

console.log(`에셋 생성 완료: ${count}개 파일`);
