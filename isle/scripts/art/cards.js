'use strict';
// 자원 카드 5종 · 발전 카드 5종 그림 (240×240 정사각), 카드 뒷면, 작은 자원 아이콘, 로고
const {
  f, svg, lin, rad, rng, paintFilter, paperGrain, blob, ridge, strokes, mix, pick, smoothOpen,
} = require('./paint');

const S = 240;
const INK = '#2a1a0c';
const shadow = (x, y, rx, ry, op = 0.3) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#1a1206" opacity="${op}"/>`;

function art(seed, body, defs = '') {
  return svg(S, S, `
    <g filter="url(#paint)">${body}</g>
    <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".45"/>
    <rect width="${S}" height="${S}" fill="url(#vg)"/>`, {
    defs: `${paintFilter('paint', { seed, bend: 6 })}${paperGrain('grain', seed)}
      ${rad('vg', [[0.6, '#000', 0], [1, '#2a1606', 0.35]], 0.5, 0.5, 0.72)}${defs}`,
  });
}

/** 하늘 + 먼 들판 배경 */
function landscape(r, sky = ['#f6dca8', '#e8b878'], land = ['#9ab85a', '#7ea24a']) {
  let s = `<rect width="${S}" height="${S}" fill="url(#sky)"/>`;
  s += `<path d="${blob(60 + r() * 40, 40, 40, 14, r)}" fill="#fff6e4" opacity=".7"/>`;
  s += `<path d="${blob(170 + r() * 30, 30, 34, 11, r)}" fill="#fff6e4" opacity=".6"/>`;
  s += `<path d="${ridge(0, S, 110, 10, r, { bottom: S })}" fill="${land[0]}"/>`;
  s += `<path d="${ridge(0, S, 150, 12, r, { bottom: S })}" fill="${land[1]}"/>`;
  return { s, defs: lin('sky', [[0, sky[0]], [1, sky[1]]]) };
}

/* ───────── 자원 ───────── */

function log(x, y, len, rad_, r) {
  const wood = pick(r, ['#8a5a32', '#7a4e2a', '#946238']);
  let s = `<path d="M${f(x)} ${f(y - rad_)}H${f(x + len)}A${f(rad_ * 0.5)} ${f(rad_)} 0 0 1 ${f(x + len)} ${f(y + rad_)}H${f(x)}Z" fill="${wood}" stroke="${INK}" stroke-width="1.1"/>`;
  s += strokes(r, 5, [x + 4, y - rad_ + 2, x + len - 4, y + rad_ - 2], { len: 16, ang: 0, jitter: 6, color: '#3e2410', op: 0.5 });
  s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad_ * 0.5)}" ry="${f(rad_)}" fill="#e2b87a" stroke="${INK}" stroke-width="1.1"/>`;
  s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad_ * 0.32)}" ry="${f(rad_ * 0.64)}" fill="none" stroke="#a87438" stroke-width=".9"/>`;
  s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad_ * 0.14)}" ry="${f(rad_ * 0.3)}" fill="none" stroke="#a87438" stroke-width=".9"/>`;
  return s;
}

function wood() {
  const r = rng(11);
  const bg = landscape(r, ['#e8e0b0', '#b8c888'], ['#4e7a30', '#3e6a28']);
  let s = bg.s;
  for (let i = 0; i < 7; i++) {
    const x = r() * S;
    s += `<path d="M${f(x)} 150l-14 -50l14 -12l14 12Z" fill="#2e5a22" opacity=".8"/>`;
  }
  s += shadow(130, 206, 90, 12, 0.35);
  const rows = [[4, 196], [3, 168], [2, 140]];
  rows.forEach(([n, y], j) => {
    for (let i = 0; i < n; i++) s += log(46 + j * 14 + i * 29, y, 120, 14, r);
  });
  // 도끼
  s += `<path d="M186 92L204 206" stroke="#7a5230" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M176 84C184 72 204 70 210 82L204 98C196 92 186 92 180 98Z" fill="#b8c0c8" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M180 86C188 80 200 80 206 86" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/>`;
  return art(11, s, bg.defs);
}

function brick() {
  const r = rng(21);
  const bg = landscape(r, ['#f4d4a0', '#e0a070'], ['#c48050', '#b06a3c']);
  let s = bg.s;
  // 가마
  s += `<path d="M36 128C36 86 96 86 96 128Z" fill="#8a4a2a" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M56 128C56 112 76 112 76 128Z" fill="#2a1206"/><path d="M60 128C60 118 72 118 72 128Z" fill="#f09a3a" opacity=".85"/>`;
  s += `<path d="${blob(82, 70, 12, 8, r)}" fill="#ece4d8" opacity=".7"/><path d="${blob(94, 52, 16, 10, r)}" fill="#ece4d8" opacity=".5"/>`;
  // 나무 받침과 벽돌 더미
  s += shadow(140, 214, 86, 10, 0.35);
  s += `<path d="M62 204H218V214H62Z" fill="#8a6a42" stroke="${INK}" stroke-width="1"/>`;
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 7 - (j % 2); i++) {
      const bx = 66 + i * 21 + (j % 2 ? 10 : 0);
      const by = 194 - j * 11;
      const c = pick(r, ['#b44a2a', '#a8402a', '#c05834', '#9e3a22', '#bc5230']);
      s += `<rect x="${bx}" y="${by}" width="20" height="10" rx="1" fill="${c}" stroke="#4a1a0a" stroke-width=".9"/>`;
      s += `<path d="M${bx + 2} ${by + 2}h15" stroke="#f0a07a" stroke-width="1" opacity=".6"/>`;
    }
  }
  return art(21, s, bg.defs);
}

function sheepArt() {
  const r = rng(31);
  const bg = landscape(r, ['#dff0f6', '#b8dcec'], ['#a8cc6a', '#8cb654']);
  let s = bg.s;
  s += strokes(r, 120, [0, 120, S, S], { len: 8, color: '#4e7a28', op: 0.35 });
  for (let i = 0; i < 20; i++) s += `<circle cx="${f(r() * S)}" cy="${f(130 + r() * 110)}" r="${f(1.5 + r() * 1.5)}" fill="${pick(r, ['#fff8e0', '#f6d84a'])}"/>`;
  s += shadow(128, 206, 72, 10, 0.3);
  s += `<path d="M86 176v32M108 180v30M150 180v30M172 176v32" stroke="#2e2622" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="${blob(128, 150, 64, 42, r, { n: 16, jag: 0.1 })}" fill="#f4efe2" stroke="${INK}" stroke-width="1.3"/>`;
  for (let i = 0; i < 16; i++) s += `<circle cx="${f(80 + r() * 96)}" cy="${f(120 + r() * 56)}" r="${f(8 + r() * 6)}" fill="#fffbf0" stroke="#d8d0bc" stroke-width=".8" opacity=".9"/>`;
  s += `<path d="${blob(136, 176, 44, 12, r)}" fill="#c9c2b0" opacity=".5"/>`;
  // 머리
  s += `<ellipse cx="66" cy="128" rx="20" ry="25" fill="#3a302a" stroke="${INK}" stroke-width="1.2" transform="rotate(18 66 128)"/>`;
  s += `<ellipse cx="50" cy="112" rx="14" ry="6" fill="#3a302a" stroke="${INK}" transform="rotate(-30 50 112)"/>`;
  s += `<ellipse cx="86" cy="110" rx="14" ry="6" fill="#3a302a" stroke="${INK}" transform="rotate(20 86 110)"/>`;
  s += `<circle cx="58" cy="124" r="3.4" fill="#fff"/><circle cx="58" cy="124" r="1.8" fill="#1a1410"/>`;
  s += `<circle cx="74" cy="124" r="3.4" fill="#fff"/><circle cx="74" cy="124" r="1.8" fill="#1a1410"/>`;
  s += `<path d="M62 142q4 3 8 0" stroke="#bda89a" stroke-width="1.4" fill="none"/>`;
  s += `<path d="${blob(68, 102, 16, 10, r, { n: 9 })}" fill="#fffbf0" stroke="#d8d0bc" stroke-width=".8"/>`;
  return art(31, s, bg.defs);
}

function wheat() {
  const r = rng(41);
  const bg = landscape(r, ['#f8e2a8', '#f0b868'], ['#e6be5c', '#d8a846']);
  let s = bg.s;
  s += strokes(r, 140, [0, 120, S, S], { len: 8, color: '#9a6a1c', op: 0.4 });
  s += shadow(122, 214, 44, 8, 0.35);
  // 줄기
  for (let i = 0; i < 26; i++) {
    const topX = 70 + r() * 110;
    const topY = 44 + r() * 30;
    const botX = 108 + r() * 28;
    s += `<path d="M${f(botX)} 212Q${f((botX + topX) / 2 + (r() - 0.5) * 10)} 150 ${f(topX)} ${f(topY + 30)}" stroke="${pick(r, ['#c89a3a', '#b8862a', '#d8aa4a'])}" stroke-width="2.4" fill="none"/>`;
    // 이삭
    for (let k = 0; k < 7; k++) {
      const yy = topY + 28 - k * 5;
      const xx = topX + (r() - 0.5) * 2;
      s += `<ellipse cx="${f(xx - 3)}" cy="${f(yy)}" rx="2.6" ry="5" fill="#f2c860" stroke="#8a5a14" stroke-width=".6" transform="rotate(-25 ${f(xx - 3)} ${f(yy)})"/>`;
      s += `<ellipse cx="${f(xx + 3)}" cy="${f(yy)}" rx="2.6" ry="5" fill="#e8b448" stroke="#8a5a14" stroke-width=".6" transform="rotate(25 ${f(xx + 3)} ${f(yy)})"/>`;
    }
    s += `<path d="M${f(topX)} ${f(topY)}l-4 -12M${f(topX)} ${f(topY)}l4 -12" stroke="#d8aa4a" stroke-width=".8"/>`;
  }
  // 묶음 끈
  s += `<path d="M104 160Q122 170 142 160L144 170Q122 180 102 170Z" fill="#b87a3a" stroke="${INK}" stroke-width="1.2"/>`;
  return art(41, s, bg.defs);
}

function ore() {
  const r = rng(51);
  const bg = landscape(r, ['#dfe4ea', '#a8b4c0'], ['#8a9098', '#747a82']);
  let s = bg.s;
  s += `<path d="M0 120L50 60L90 110L140 40L200 100L240 70V240H0Z" fill="#8e969e" opacity=".6"/>`;
  s += shadow(122, 212, 90, 12, 0.35);
  const rocks = [[70, 190, 34], [120, 196, 40], [172, 190, 34], [96, 158, 30], [148, 156, 32], [122, 126, 28]];
  for (const [x, y, rr] of rocks) {
    const c = pick(r, ['#5e666e', '#6e767e', '#525a62']);
    s += `<path d="${blob(x, y, rr, rr * 0.72, r, { n: 7, jag: 0.22 })}" fill="${c}" stroke="${INK}" stroke-width="1.3"/>`;
    s += `<path d="${blob(x - rr * 0.25, y - rr * 0.25, rr * 0.45, rr * 0.3, r, { n: 6, jag: 0.25 })}" fill="${mix(c, '#ffffff', 0.25)}" opacity=".7"/>`;
    for (let k = 0; k < 3; k++) {
      const vx = x + (r() - 0.5) * rr;
      const vy = y + (r() - 0.5) * rr * 0.6;
      s += `<path d="M${f(vx)} ${f(vy)}l${f(6 + r() * 6)} ${f(-3 + r() * 6)}l${f(4 + r() * 4)} ${f(r() * 4)}" stroke="#a8d4f4" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      s += `<circle cx="${f(vx + 5)}" cy="${f(vy)}" r="1.6" fill="#ffffff"/>`;
    }
  }
  // 곡괭이
  s += `<path d="M190 70L150 200" stroke="#7a5230" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M160 60Q192 50 222 82L216 88Q192 66 164 70Z" fill="#b8c0c8" stroke="${INK}" stroke-width="1.4"/>`;
  return art(51, s, bg.defs);
}

/* ───────── 발전 카드 ───────── */

function knight() {
  const r = rng(61);
  const bg = landscape(r, ['#e8d8c0', '#b8a888'], ['#7e8a58', '#6a7648']);
  let s = bg.s;
  // 깃발
  s += `<path d="M40 30V150" stroke="#5a3a20" stroke-width="3"/>`;
  s += `<path d="M42 32Q70 26 96 36Q72 46 42 58Z" fill="#b8342a" stroke="${INK}" stroke-width="1.2"/>`;
  // 어깨·몸
  s += `<path d="M44 240C48 196 82 172 120 170C158 172 192 196 196 240Z" fill="#8e969e" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M58 206C74 190 96 184 118 184" stroke="#dfe6ee" stroke-width="2.4" fill="none" opacity=".7"/>`;
  s += `<path d="M104 186L120 240L136 186Z" fill="#2f62b0" stroke="${INK}" stroke-width="1"/>`;
  // 투구
  s += `<path d="M84 150C80 100 94 72 120 72C146 72 160 100 156 150Q120 166 84 150Z" fill="#a8b0b8" stroke="${INK}" stroke-width="1.6"/>`;
  s += `<path d="M92 112H148" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M96 112H144" stroke="#1a1612" stroke-width="3"/>`;
  s += `<path d="M120 76V150" stroke="${INK}" stroke-width="1.4"/>`;
  for (let i = 0; i < 4; i++) s += `<circle cx="${104 + i * 11}" cy="132" r="1.8" fill="#2a2420"/>`;
  s += `<path d="M96 88C104 78 112 76 120 76" stroke="#f4f8fc" stroke-width="3" fill="none" opacity=".7"/>`;
  // 깃털 장식
  s += `<path d="M120 74C112 50 124 30 146 26C140 44 134 60 124 76Z" fill="#c8342a" stroke="${INK}" stroke-width="1.2"/>`;
  s += strokes(r, 8, [118, 30, 144, 72], { len: 8, ang: -40, color: '#6e140e', op: 0.6 });
  // 방패 (바람 무늬)
  s += `<path d="M150 170C150 170 188 164 204 172C206 206 190 228 176 236C162 228 146 206 150 170Z" fill="#efe6d0" stroke="${INK}" stroke-width="1.6"/>`;
  s += `<path d="M160 190q8 -6 16 0t16 0M160 202q8 -6 16 0t16 0M164 214q8 -6 14 0t12 0" stroke="#2f62b0" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return art(61, s, bg.defs);
}

function vpArt() {
  const r = rng(71);
  const bg = landscape(r, ['#f6e0b0', '#e8a868'], ['#8ab458', '#6e9a44']);
  let s = bg.s;
  s += shadow(122, 212, 88, 10, 0.35);
  // 도서관(명예의 전당)
  s += `<path d="M44 208H200V120H44Z" fill="#e8dcc0" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M34 124L122 64L210 124Z" fill="#b8402a" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M58 124L122 80L186 124" stroke="#e8906a" stroke-width="2" fill="none" opacity=".6"/>`;
  for (let i = 0; i < 5; i++) {
    const x = 56 + i * 30;
    s += `<path d="M${x} 128h12v76h-12Z" fill="#f6eedc" stroke="${INK}" stroke-width="1"/>`;
    s += `<path d="M${x + 3} 132v68" stroke="#bda88a" stroke-width="1.2"/>`;
  }
  s += `<path d="M108 208V164C108 154 136 154 136 164V208Z" fill="#5a3a20" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M44 208H200V216H44Z" fill="#b8a888" stroke="${INK}" stroke-width="1"/>`;
  // 깃발과 별
  s += `<path d="M122 64V30" stroke="#5a3a20" stroke-width="2.4"/>`;
  s += `<path d="M123 30Q140 26 152 34Q138 42 123 42Z" fill="#f2c230" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M122 90l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1Z" fill="#f2c230" stroke="${INK}" stroke-width="1"/>`;
  return art(71, s, bg.defs);
}

function roadsArt() {
  const r = rng(81);
  const bg = landscape(r, ['#f0e2b8', '#d8b878'], ['#9ab85a', '#86a84c']);
  let s = bg.s;
  s += `<path d="M86 240C100 200 110 170 118 140C124 120 128 112 132 110L140 110C140 116 146 130 156 150C170 180 196 214 214 240Z" fill="#b89a6a" stroke="${INK}" stroke-width="1.2"/>`;
  for (let i = 0; i < 60; i++) {
    const t = r();
    const y = 112 + t * 128;
    const half = 6 + t * 58;
    const cx = 136 + t * 14;
    const x = cx + (r() - 0.5) * 2 * half * 0.9;
    s += `<path d="${blob(x, y, 2.5 + t * 6, 1.6 + t * 3.4, r, { n: 6 })}" fill="${pick(r, ['#8a7a60', '#a08e70', '#7a6a50'])}" stroke="#4a3a28" stroke-width=".5"/>`;
  }
  // 수레
  s += shadow(84, 194, 36, 7, 0.3);
  s += `<path d="M50 168H116V184H50Z" fill="#8a5a32" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M52 170H114" stroke="#c89a62" stroke-width="1.4"/>`;
  s += `<path d="M116 176L142 170" stroke="#5a3a20" stroke-width="3"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M${54 + i * 15} 168h13v-10h-13Z" fill="${pick(r, ['#b44a2a', '#a8402a'])}" stroke="#4a1a0a" stroke-width=".8"/>`;
  for (const x of [62, 104]) {
    s += `<circle cx="${x}" cy="188" r="12" fill="none" stroke="#3a2410" stroke-width="3"/>`;
    s += `<path d="M${x - 12} 188H${x + 12}M${x} 176V200M${x - 8} 180L${x + 8} 196M${x + 8} 180L${x - 8} 196" stroke="#3a2410" stroke-width="1.4"/>`;
  }
  return art(81, s, bg.defs);
}

function plenty() {
  const r = rng(91);
  const bg = landscape(r, ['#f8e4b0', '#f0b870'], ['#b8c86a', '#9ab456']);
  let s = bg.s;
  s += shadow(122, 212, 80, 10, 0.35);
  // 바구니
  s += `<path d="M48 146H196L180 208C170 216 74 216 64 208Z" fill="#b88a4a" stroke="${INK}" stroke-width="1.6"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${54 + i * 2} ${156 + i * 11}H${190 - i * 2}" stroke="#7a5228" stroke-width="2"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${62 + i * 15} 148L${68 + i * 13} 212" stroke="#7a5228" stroke-width="1.4"/>`;
  // 넘치는 수확물
  for (let i = 0; i < 8; i++) {
    const x = 70 + i * 14;
    s += `<path d="M${x} 150Q${x - 6} 110 ${x - 10 + r() * 20} 80" stroke="#c89a3a" stroke-width="2" fill="none"/>`;
    s += `<ellipse cx="${f(x - 8 + r() * 16)}" cy="${f(80 + r() * 10)}" rx="3.5" ry="8" fill="#f0c458" stroke="#8a5a14" stroke-width=".7"/>`;
  }
  const fruit = [[82, 142, '#c8342a'], [106, 136, '#d84a2a'], [150, 140, '#7aa83a'], [170, 146, '#c8342a'], [128, 132, '#e8a02a']];
  for (const [x, y, c] of fruit) {
    s += `<circle cx="${x}" cy="${y}" r="13" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#fff" opacity=".5"/>`;
  }
  s += `<path d="${blob(150, 124, 20, 14, r, { n: 10, jag: 0.1 })}" fill="#f4efe2" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M54 150H74V136H54Z" fill="#b44a2a" stroke="${INK}" stroke-width="1" transform="rotate(-12 64 143)"/>`;
  return art(91, s, bg.defs);
}

function monopoly() {
  const r = rng(101);
  const bg = landscape(r, ['#e8d0a8', '#b88a58'], ['#8a6a48', '#7a5a3a']);
  let s = bg.s;
  // 상인
  s += `<path d="M52 240C56 196 88 176 120 174C152 176 184 196 188 240Z" fill="#5a2a4a" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M112 176L120 240L128 176Z" fill="#f2c230" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M90 124C88 96 100 82 120 82C140 82 152 96 150 124C150 150 138 170 120 170C102 170 90 150 90 124Z" fill="#e8b890" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M100 150C110 164 130 164 140 150C138 170 102 170 100 150Z" fill="#6a4a30" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M106 122q5 -3 10 0M124 122q5 -3 10 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
  s += `<path d="M110 140q10 6 20 0" stroke="${INK}" stroke-width="1.6" fill="none"/>`;
  s += `<path d="M78 96C84 70 156 70 162 96Z" fill="#3a1a2a" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M96 76C100 50 140 50 144 76Z" fill="#3a1a2a" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M98 72H142" stroke="#f2c230" stroke-width="4"/>`;
  // 돈주머니와 동전
  s += `<path d="M160 192C150 196 146 222 160 230C176 238 202 234 206 220C210 204 196 190 184 190Z" fill="#b88a4a" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M168 188L178 180L188 188" stroke="#7a5228" stroke-width="3" fill="none"/>`;
  s += `<text x="182" y="220" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#5a3a18">$</text>`;
  for (let i = 0; i < 6; i++) {
    const x = 40 + r() * 60;
    const y = 204 + r() * 26;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="8" ry="4" fill="#f2c230" stroke="#8a5a10" stroke-width="1"/>`;
  }
  return art(101, s, bg.defs);
}

const RES_ART = { wood, brick, sheep: sheepArt, wheat, ore };
const DEV_ART = { knight, vp: vpArt, roads: roadsArt, plenty, monopoly };

/* ───────── 카드 뒷면 ───────── */

function cardBack() {
  const r = rng(111);
  let s = `<rect width="250" height="350" rx="14" fill="#1f4a6e"/>`;
  for (let i = 0; i < 60; i++) {
    const x = r() * 250;
    const y = r() * 350;
    s += `<path d="M${f(x)} ${f(y)}q6 -4 12 0" stroke="#8ec0e0" stroke-width="1.4" fill="none" opacity=".4"/>`;
  }
  // 나침반 장미
  const cx = 125;
  const cy = 160;
  s += `<circle cx="${cx}" cy="${cy}" r="70" fill="#f1e4c4" stroke="#1a1206" stroke-width="3"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="58" fill="none" stroke="#b88a4a" stroke-width="1.4"/>`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const L = long ? 62 : 38;
    const wd = long ? 10 : 7;
    const tip = [cx + Math.cos(a) * L, cy + Math.sin(a) * L];
    const l = [cx + Math.cos(a - Math.PI / 2) * wd, cy + Math.sin(a - Math.PI / 2) * wd];
    const rr = [cx + Math.cos(a + Math.PI / 2) * wd, cy + Math.sin(a + Math.PI / 2) * wd];
    s += `<path d="M${f(cx)} ${f(cy)}L${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}Z" fill="${long ? '#c8342a' : '#2f62b0'}" stroke="#1a1206" stroke-width="1"/>`;
    s += `<path d="M${f(cx)} ${f(cy)}L${f(rr[0])} ${f(rr[1])}L${f(tip[0])} ${f(tip[1])}Z" fill="${long ? '#7a1a12' : '#1a3a6a'}" stroke="#1a1206" stroke-width="1"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="7" fill="#f2c230" stroke="#1a1206" stroke-width="1.4"/>`;
  s += `<rect x="10" y="10" width="230" height="330" rx="10" fill="none" stroke="#f2c230" stroke-width="3"/>`;
  s += `<rect x="18" y="18" width="214" height="314" rx="7" fill="none" stroke="#f2c230" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="6 4"/>`;
  s += `<text x="125" y="286" text-anchor="middle" font-family="'Malgun Gothic', sans-serif" font-size="26" font-weight="800" fill="#f1e4c4" letter-spacing="3">바람섬</text>`;
  return svg(250, 350, `<g filter="url(#paint)">${s}</g>`, { defs: paintFilter('paint', { seed: 13, bend: 3, ink: 1.4, soft: 0.5 }) });
}

/* ───────── 작은 자원 아이콘 (화면 곳곳에 쓰임) ───────── */

const ICON = {
  wood: `<path d="M5 14h20a4 7 0 0 1 0 12H5Z" fill="#8a5a32" stroke="${INK}" stroke-width="1.2"/><ellipse cx="5" cy="20" rx="4" ry="6" fill="#e2b87a" stroke="${INK}" stroke-width="1.2"/><ellipse cx="5" cy="20" rx="1.8" ry="3" fill="none" stroke="#a87438"/>
    <path d="M11 4h18a4 6.5 0 0 1 0 11H11Z" fill="#7a4e2a" stroke="${INK}" stroke-width="1.2"/><ellipse cx="11" cy="9.5" rx="3.6" ry="5.5" fill="#e2b87a" stroke="${INK}" stroke-width="1.2"/>`,
  brick: `<rect x="3" y="18" width="14" height="8" rx="1" fill="#b44a2a" stroke="${INK}" stroke-width="1.2"/><rect x="17" y="18" width="14" height="8" rx="1" fill="#a8402a" stroke="${INK}" stroke-width="1.2"/>
    <rect x="10" y="10" width="14" height="8" rx="1" fill="#c05834" stroke="${INK}" stroke-width="1.2"/><path d="M5 20h9M19 20h9M12 12h9" stroke="#f0a07a" stroke-width="1"/>`,
  sheep: `<path d="M9 26v5M14 27v4M21 27v4M26 26v5" stroke="#2e2622" stroke-width="2.4" stroke-linecap="round"/><path d="M6 20c-2-6 4-11 9-9 2-4 9-4 11 0 5-1 8 5 5 9 2 5-3 9-7 7-3 3-9 3-12 0-4 2-8-2-6-7Z" fill="#f4efe2" stroke="${INK}" stroke-width="1.2"/>
    <ellipse cx="6" cy="16" rx="4.2" ry="5.2" fill="#3a302a" stroke="${INK}"/><circle cx="4.8" cy="15.4" r="1" fill="#fff"/>`,
  wheat: `<path d="M17 33V9" stroke="#b8862a" stroke-width="2"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="14" cy="${10 + i * 4.4}" rx="2.4" ry="4" fill="#f0c458" stroke="#8a5a14" stroke-width=".8" transform="rotate(-28 14 ${10 + i * 4.4})"/><ellipse cx="20" cy="${10 + i * 4.4}" rx="2.4" ry="4" fill="#e8b448" stroke="#8a5a14" stroke-width=".8" transform="rotate(28 20 ${10 + i * 4.4})"/>`).join('')}<path d="M17 6V2" stroke="#d8aa4a" stroke-width="1"/>`,
  ore: `<path d="M4 28L8 16L16 10L26 13L31 24L25 31H10Z" fill="#6e767e" stroke="${INK}" stroke-width="1.2"/><path d="M9 17L16 12L20 16L13 21Z" fill="#9aa2aa"/>
    <path d="M13 24l5-2 4 2M20 17l5 1" stroke="#a8d4f4" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="22" r="1.2" fill="#fff"/>`,
};
const icon = (r) => svg(34, 34, ICON[r]);


/* ───────── 게임 상자 앞면 그림 (노을 · 큰 해 · 언덕 위 마을 · 굽은 길) ───────── */

function boxArt() {
  const r = rng(131);
  const BW = 400;
  const BH = 400;
  let s = `<rect width="${BW}" height="${BH}" fill="url(#bsky)"/>`;
  s += `<circle cx="200" cy="228" r="96" fill="url(#bsun)"/>`;
  s += `<path d="${blob(120, 196, 90, 7, r)}" fill="#e8783a" opacity=".6"/>`;
  s += `<path d="${blob(290, 180, 80, 6, r)}" fill="#e8783a" opacity=".5"/>`;
  // 먼 산
  s += `<path d="M0 262L40 232L80 250L130 206L170 238L200 250L250 214L300 244L340 222L400 254V400H0Z" fill="#c8805a" opacity=".85"/>`;
  s += `<path d="M130 206L148 222L140 226Z M250 214L266 228L258 232Z" fill="#f4e0c8" opacity=".7"/>`;
  // 들판
  s += `<path d="${ridge(0, BW, 266, 8, r, { bottom: BH, steps: 6 })}" fill="#9aa84e"/>`;
  s += `<path d="${ridge(0, BW, 290, 10, r, { bottom: BH, steps: 6 })}" fill="#86a044"/>`;
  // 오른쪽 숲
  for (let i = 0; i < 14; i++) {
    const x = 290 + i * 8 + r() * 6;
    const y = 270 + r() * 8;
    s += `<path d="${blob(x, y, 9, 11, r, { n: 8, jag: 0.2 })}" fill="${pick(r, ['#3e6a2a', '#4e7a30', '#355e24'])}" stroke="${INK}" stroke-width=".6" stroke-opacity=".5"/>`;
  }
  // 언덕 위 마을
  s += `<path d="M150 282C170 262 230 262 250 282Z" fill="#a8b060"/>`;
  const houses = [[176, 268, 12], [192, 262, 14], [210, 266, 12], [226, 270, 10], [200, 272, 10], [168, 274, 9]];
  for (const [x, y, w] of houses) {
    s += `<path d="M${x - w / 2} ${y + 6}V${y}H${x + w / 2}V${y + 6}Z" fill="#efe0c0" stroke="${INK}" stroke-width=".7"/>`;
    s += `<path d="M${x - w / 2 - 2} ${y + 1}L${x} ${y - w * 0.55}L${x + w / 2 + 2} ${y + 1}Z" fill="#b8402a" stroke="${INK}" stroke-width=".7"/>`;
  }
  s += `<path d="M198 250V238M198 238h8v4h-8" stroke="${INK}" stroke-width="1" fill="#c8342a"/>`;
  // 오른쪽 아래 밀밭
  s += `<path d="M230 300C280 292 340 292 400 300V400H200C210 360 216 330 230 300Z" fill="#e0b048"/>`;
  s += strokes(r, 160, [220, 300, 400, 400], { len: 9, color: '#9a6a1c', op: 0.5 });
  s += strokes(r, 60, [220, 300, 400, 400], { len: 5, color: '#fff0b0', op: 0.6 });
  // 굽은 길
  s += `<path d="M200 284C204 300 186 314 170 330C150 350 150 376 168 400H230C214 376 210 356 226 336C240 318 214 300 206 284Z" fill="#d8b888" stroke="${INK}" stroke-width="1" stroke-opacity=".6"/>`;
  s += strokes(r, 40, [160, 300, 230, 400], { len: 5, ang: 0, color: '#8a6a4a', op: 0.4 });
  // 왼쪽 아래 풀밭과 양
  s += strokes(r, 120, [0, 300, 170, 400], { len: 8, color: '#4e7a28', op: 0.45 });
  for (const [x, y] of [[60, 318], [96, 330], [40, 342]]) {
    s += `<path d="${blob(x, y, 9, 6, r, { n: 9, jag: 0.12 })}" fill="#f4efe2" stroke="${INK}" stroke-width=".6"/><circle cx="${x + 9}" cy="${y - 1}" r="2.8" fill="#3a302a"/>`;
  }
  // 길 위의 개척자 세 사람 (실루엣)
  const walker = (x, y, h, c, pack) => {
    let o = shadow(x + 4, y + 2, h * 0.28, h * 0.06, 0.35);
    o += `<path d="M${x - h * 0.08} ${y}L${x - h * 0.04} ${y - h * 0.42}M${x + h * 0.08} ${y}L${x + h * 0.04} ${y - h * 0.42}" stroke="#3a2a1a" stroke-width="${h * 0.07}" stroke-linecap="round"/>`;
    o += `<path d="M${x - h * 0.16} ${y - h * 0.4}C${x - h * 0.18} ${y - h * 0.7} ${x + h * 0.18} ${y - h * 0.7} ${x + h * 0.16} ${y - h * 0.4}Z" fill="${c}" stroke="${INK}" stroke-width=".8"/>`;
    o += `<circle cx="${x}" cy="${y - h * 0.8}" r="${h * 0.11}" fill="#e8b890" stroke="${INK}" stroke-width=".8"/>`;
    if (pack) o += `<path d="${blob(x - h * 0.2, y - h * 0.6, h * 0.14, h * 0.18, r)}" fill="#c8b890" stroke="${INK}" stroke-width=".8"/>`;
    return o;
  };
  s += walker(176, 378, 58, '#8a3a2a', true);
  s += walker(200, 372, 52, '#3a6a8a', false);
  s += walker(222, 380, 56, '#5a6a2a', false);
  s += `<path d="M232 378L240 318" stroke="#6a4a2a" stroke-width="2.4"/>`;
  return svg(BW, BH, `<g filter="url(#paint)">${s}</g><rect width="${BW}" height="${BH}" filter="url(#grain)" opacity=".35"/>`, {
    defs: `${paintFilter('paint', { seed: 29, bend: 7, ink: 2 })}${paperGrain('grain', 17)}
      ${lin('bsky', [[0, '#8a1a12'], [0.35, '#c83a1c'], [0.62, '#f08a3a'], [1, '#f8c068']])}
      ${rad('bsun', [[0, '#fff6c8'], [0.6, '#ffe488'], [1, '#f8b048', 0]], 0.5, 0.5, 0.5)}`,
  });
}

module.exports = { RES_ART, DEV_ART, cardBack, icon, boxArt };
