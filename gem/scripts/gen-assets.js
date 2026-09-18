'use strict';
// 찬란한 보석상 그림(SVG)을 만든다: npm run assets:gem
const fs = require('fs');
const path = require('path');
const G = require('../public/shared/gem');
const { chip, icon } = require('./art/gems');

const OUT = path.join(__dirname, '..', 'public', 'assets');
let count = 0;
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim() + '\n');
  count++;
}

for (const c of [...G.COLORS, 'gold']) {
  write(`chip/${c}.svg`, chip(c));
  write(`icon/${c}.svg`, icon(c));
}
let cards = null;
try { cards = require('./art/cards'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
if (cards) {
  for (const card of G.CARDS) write(`card/${card.id}.svg`, cards.cardSvg(card));
  for (const t of [1, 2, 3]) write(`back/${t}.svg`, cards.backSvg(t));
}
let nobles = null;
try { nobles = require('./art/nobles'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
if (nobles) for (const n of G.NOBLES) write(`noble/${n.id}.svg`, nobles.nobleSvg(n));
let box = null;
try { box = require('./art/box'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
if (box) { write('box.svg', box.box()); write('logo.svg', box.logo()); }
console.log(`에셋 생성 완료: ${count}개 파일`);
