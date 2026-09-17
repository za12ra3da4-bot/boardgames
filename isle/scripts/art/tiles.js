'use strict';
// 육각 지형 타일 (뾰족한 꼭짓점이 위, 240×277). 같은 지형도 장마다 조금씩 다르게 그린다.
const {
  f, svg, rad, lin, rng, paintFilter, paperGrain, blob, ridge, strokes, mix, pick, smoothOpen,
} = require('./paint');

const W = 240;
const H = 277;
const HEX = 'M120 0L240 69.3L240 207.8L120 277L0 207.8L0 69.3Z';
const INK = '#2a1a0c';

function tile(seed, body, defs = '') {
  return svg(W, H, `
    <g clip-path="url(#hx)">
      <g filter="url(#paint)">${body}</g>
      <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".45"/>
      <rect width="${W}" height="${H}" fill="url(#vg)"/>
    </g>
    <path d="${HEX}" fill="none" stroke="#3a2610" stroke-width="3" stroke-opacity=".5"/>`, {
    defs: `<clipPath id="hx"><path d="${HEX}"/></clipPath>
      ${paintFilter('paint', { seed })}${paperGrain('grain', seed + 2)}
      ${rad('vg', [[0.62, '#000', 0], [1, '#2a1606', 0.32]], 0.5, 0.5, 0.62)}${defs}`,
  });
}

const shadow = (x, y, rx, ry, op = 0.3) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#1a1206" opacity="${op}"/>`;

/* ───────── 숲 ───────── */

function conifer(x, y, h, r, tone) {
  const w = h * 0.62;
  const dark = mix(tone, '#0e1a08', 0.45);
  const light = mix(tone, '#d8e88a', 0.25);
  let s = shadow(x + h * 0.12, y + 2, w * 0.5, h * 0.09, 0.35);
  s += `<path d="M${f(x - 2)} ${f(y)}L${f(x - 1.5)} ${f(y - h * 0.2)}L${f(x + 1.5)} ${f(y - h * 0.2)}L${f(x + 2)} ${f(y)}Z" fill="#5a3a1c"/>`;
  for (let i = 0; i < 3; i++) {
    const top = y - h + i * h * 0.26;
    const bot = top + h * 0.46;
    const hw = w * (0.3 + i * 0.12) * (0.9 + r() * 0.2);
    const lh = bot - top;
    const layer = `M${f(x)} ${f(top)}C${f(x - hw * 0.35)} ${f(top + lh * 0.45)} ${f(x - hw * 0.8)} ${f(bot - lh * 0.25)} ${f(x - hw)} ${f(bot)}Q${f(x - hw * 0.45)} ${f(bot - lh * 0.14)} ${f(x)} ${f(bot + lh * 0.06)}Q${f(x + hw * 0.45)} ${f(bot - lh * 0.14)} ${f(x + hw)} ${f(bot)}C${f(x + hw * 0.8)} ${f(bot - lh * 0.25)} ${f(x + hw * 0.35)} ${f(top + lh * 0.45)} ${f(x)} ${f(top)}Z`;
    const right = `M${f(x)} ${f(top)}C${f(x + hw * 0.35)} ${f(top + lh * 0.45)} ${f(x + hw * 0.8)} ${f(bot - lh * 0.25)} ${f(x + hw)} ${f(bot)}Q${f(x + hw * 0.45)} ${f(bot - lh * 0.14)} ${f(x + 1)} ${f(bot + lh * 0.06)}Z`;
    s += `<path d="${layer}" fill="${tone}" stroke="${INK}" stroke-width=".9" stroke-opacity=".6"/>`;
    s += `<path d="${right}" fill="${dark}" opacity=".7"/>`;
    s += `<path d="M${f(x - 1)} ${f(top + 3)}Q${f(x - hw * 0.4)} ${f(top + lh * 0.55)} ${f(x - hw * 0.75)} ${f(bot - 2)}" stroke="${light}" stroke-width="1.6" fill="none" opacity=".7"/>`;
  }
  return s;
}

function leafy(x, y, h, r, tone) {
  const dark = mix(tone, '#0e1a08', 0.4);
  const light = mix(tone, '#e8f09a', 0.3);
  let s = shadow(x + h * 0.15, y + 2, h * 0.36, h * 0.1, 0.35);
  s += `<path d="M${f(x - 2.5)} ${f(y)}Q${f(x - 1)} ${f(y - h * 0.3)} ${f(x - 1)} ${f(y - h * 0.5)}L${f(x + 2)} ${f(y - h * 0.5)}Q${f(x + 1.5)} ${f(y - h * 0.3)} ${f(x + 3)} ${f(y)}Z" fill="#5e3e22"/>`;
  const cy = y - h * 0.62;
  s += `<path d="${blob(x, cy, h * 0.36, h * 0.32, r, { n: 10, jag: 0.22 })}" fill="${tone}" stroke="${INK}" stroke-width=".9" stroke-opacity=".6"/>`;
  s += `<path d="${blob(x + h * 0.1, cy + h * 0.08, h * 0.24, h * 0.2, r, { n: 8, jag: 0.25 })}" fill="${dark}" opacity=".6"/>`;
  s += `<path d="${blob(x - h * 0.12, cy - h * 0.1, h * 0.16, h * 0.12, r, { n: 7, jag: 0.25 })}" fill="${light}" opacity=".75"/>`;
  return s;
}

function forest(seed) {
  const r = rng(seed * 101 + 7);
  let s = `<rect width="${W}" height="${H}" fill="#56752f"/>`;
  s += `<path d="${ridge(0, W, 70, 14, r, { bottom: H })}" fill="#4d6a2a"/>`;
  s += `<path d="${ridge(0, W, 170, 12, r, { bottom: H })}" fill="#5a7a32"/>`;
  s += strokes(r, 90, [0, 0, W, H], { len: 6, color: '#2e4416', op: 0.35 });
  s += strokes(r, 40, [0, 0, W, H], { len: 5, color: '#9ab85a', op: 0.35 });
  // 오솔길
  s += `<path d="${smoothOpen([[20 + r() * 40, H], [80 + r() * 30, 200], [130, 150 + r() * 30], [200 + r() * 30, 80], [240, 40]])}" stroke="#8a6a3a" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>`;
  const trees = [];
  for (let y = 18; y < H + 20; y += 24 + r() * 6) {
    for (let x = -10 + r() * 20; x < W + 10; x += 30 + r() * 16) trees.push([x + (r() - 0.5) * 10, y + (r() - 0.5) * 8]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  const tones = ['#2f5a24', '#3a6a2a', '#28502a', '#447432', '#35602c'];
  for (const [x, y] of trees) {
    const h = 34 + (y / H) * 20 + r() * 10;
    s += r() < 0.68 ? conifer(x, y + h * 0.4, h, r, pick(r, tones)) : leafy(x, y + h * 0.4, h * 0.9, r, pick(r, ['#4e7a2e', '#5c8a34', '#3f6a28']));
  }
  return tile(seed, s);
}

/* ───────── 목초지 ───────── */

function sheep(x, y, s, r, flip) {
  const d = flip ? -1 : 1;
  let o = shadow(x + 3, y + s * 0.62, s * 0.9, s * 0.18, 0.28);
  o += `<path d="M${f(x - s * 0.5)} ${f(y + s * 0.3)}v${f(s * 0.32)}M${f(x - s * 0.2)} ${f(y + s * 0.35)}v${f(s * 0.3)}M${f(x + s * 0.25)} ${f(y + s * 0.35)}v${f(s * 0.3)}M${f(x + s * 0.55)} ${f(y + s * 0.3)}v${f(s * 0.32)}" stroke="#2e2622" stroke-width="${f(s * 0.12)}" stroke-linecap="round"/>`;
  o += `<path d="${blob(x, y, s * 0.85, s * 0.55, r, { n: 12, jag: 0.12 })}" fill="#f4efe2" stroke="${INK}" stroke-width=".9" stroke-opacity=".7"/>`;
  for (let i = 0; i < 6; i++) o += `<circle cx="${f(x - s * 0.6 + r() * s * 1.2)}" cy="${f(y - s * 0.3 + r() * s * 0.6)}" r="${f(s * (0.14 + r() * 0.1))}" fill="#fffbf0" opacity=".8"/>`;
  o += `<path d="${blob(x + s * 0.1, y + s * 0.25, s * 0.6, s * 0.22, r, { n: 8, jag: 0.1 })}" fill="#c9c2b0" opacity=".55"/>`;
  const hx = x + d * s * 0.85;
  o += `<ellipse cx="${f(hx)}" cy="${f(y - s * 0.05)}" rx="${f(s * 0.26)}" ry="${f(s * 0.32)}" fill="#3a302a" stroke="${INK}" stroke-width=".8" transform="rotate(${d * 20} ${f(hx)} ${f(y)})"/>`;
  o += `<ellipse cx="${f(hx - d * s * 0.22)}" cy="${f(y - s * 0.22)}" rx="${f(s * 0.16)}" ry="${f(s * 0.07)}" fill="#3a302a" transform="rotate(${d * -25} ${f(hx)} ${f(y)})"/>`;
  o += `<circle cx="${f(hx + d * s * 0.08)}" cy="${f(y - s * 0.1)}" r="${f(s * 0.045)}" fill="#fff"/>`;
  o += `<path d="${blob(x + d * s * 0.62, y - s * 0.32, s * 0.2, s * 0.14, r, { n: 7 })}" fill="#fffbf0"/>`;
  return o;
}

function pasture(seed) {
  const r = rng(seed * 131 + 3);
  let s = `<rect width="${W}" height="${H}" fill="#8cb654"/>`;
  s += `<path d="${ridge(0, W, 50, 14, r, { bottom: H })}" fill="#a2c864"/>`;
  s += `<path d="${ridge(0, W, 120, 16, r, { bottom: H })}" fill="#90bb57"/>`;
  s += `<path d="${ridge(0, W, 195, 14, r, { bottom: H })}" fill="#7eab49"/>`;
  s += strokes(r, 140, [0, 0, W, H], { len: 7, color: '#4e7a28', op: 0.35 });
  s += strokes(r, 50, [0, 0, W, H], { len: 5, color: '#d8ec9a', op: 0.4 });
  for (let i = 0; i < 26; i++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(1.2 + r() * 1.4)}" fill="${pick(r, ['#fff8e0', '#f6d84a', '#f0a8c0'])}" opacity=".85"/>`;
  // 나무 울타리
  const fy = 100 + r() * 40;
  const fence = [[-10, fy + 20], [60, fy], [130, fy + 14], [200, fy - 6], [250, fy + 8]];
  s += `<path d="${smoothOpen(fence)}" stroke="#7a5a32" stroke-width="3" fill="none"/>`;
  s += `<path d="${smoothOpen(fence.map(([x, y]) => [x, y + 9]))}" stroke="#7a5a32" stroke-width="2.4" fill="none"/>`;
  for (let x = 6; x < W; x += 28) {
    const t = x / W;
    const y = fy + 20 - t * 26 + Math.sin(t * 6) * 6;
    s += `<path d="M${f(x)} ${f(y - 6)}v18" stroke="#5e4224" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  // 양
  const spots = [[60, 70], [170, 60], [95, 185], [185, 175], [55, 240], [150, 245]];
  spots.sort(() => r() - 0.5);
  const count = 4 + Math.floor(r() * 2);
  spots.slice(0, count).sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => {
    s += sheep(x + (r() - 0.5) * 20, y + (r() - 0.5) * 14, 15 + (y / H) * 8, r, i % 2 === 0);
  });
  return tile(seed, s);
}

/* ───────── 밭 ───────── */

function fields(seed) {
  const r = rng(seed * 151 + 11);
  let s = `<rect width="${W}" height="${H}" fill="#dcae44"/>`;
  const tilt = (r() - 0.5) * 30;
  for (let i = -2; i < 18; i++) {
    const y = i * 18 + r() * 4;
    const pts = [[-10, y + tilt * 0.4], [60, y + tilt * 0.1 + (r() - 0.5) * 6], [130, y - tilt * 0.1 + (r() - 0.5) * 6], [250, y - tilt * 0.4]];
    const c = i % 2 ? '#e9c25e' : '#c9922e';
    s += `<path d="${smoothOpen(pts)}" stroke="${c}" stroke-width="${i % 2 ? 11 : 6}" fill="none"/>`;
  }
  // 밀 이삭
  for (let i = 0; i < 150; i++) {
    const x = r() * W;
    const y = r() * H;
    const l = 7 + r() * 6;
    s += `<path d="M${f(x)} ${f(y)}q${f(1 + r())} ${f(-l / 2)} ${f(r() * 2)} ${f(-l)}" stroke="#8a5a14" stroke-width=".9" fill="none" opacity=".55"/>`;
    s += `<ellipse cx="${f(x + 1)}" cy="${f(y - l)}" rx="1.6" ry="3.2" fill="${pick(r, ['#f6d878', '#e8b848', '#d09a2a'])}" transform="rotate(${f((r() - 0.5) * 30)} ${f(x + 1)} ${f(y - l)})"/>`;
  }
  // 짚단
  const hx = 60 + r() * 120;
  const hy = 150 + r() * 70;
  s += shadow(hx + 6, hy + 14, 22, 6, 0.3);
  s += `<path d="${blob(hx, hy, 20, 16, r, { n: 9, jag: 0.12 })}" fill="#e8c46a" stroke="${INK}" stroke-width=".9" stroke-opacity=".6"/>`;
  s += strokes(r, 18, [hx - 16, hy - 12, hx + 16, hy + 12], { len: 8, ang: -60, color: '#9a6a1c', op: 0.6 });
  s += `<path d="M${f(hx - 18)} ${f(hy + 2)}Q${f(hx)} ${f(hy + 8)} ${f(hx + 19)} ${f(hy + 1)}" stroke="#8a5a14" stroke-width="2" fill="none"/>`;
  // 멀리 작은 농가
  const fx = 30 + r() * 150;
  const fy = 20 + r() * 20;
  s += shadow(fx + 18, fy + 26, 24, 5, 0.3);
  s += `<path d="M${f(fx)} ${f(fy + 10)}h34v16h-34Z" fill="#efe0c0" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M${f(fx - 4)} ${f(fy + 12)}L${f(fx + 17)} ${f(fy - 4)}L${f(fx + 38)} ${f(fy + 12)}Z" fill="#b8402a" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M${f(fx + 14)} ${f(fy + 16)}h7v10h-7Z" fill="#5a3a20"/>`;
  return tile(seed, s);
}

/* ───────── 언덕 (벽돌) ───────── */

function brickStack(x, y, cols, rows, r) {
  let s = shadow(x + cols * 7, y + 3, cols * 8, 5, 0.35);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols - (j % 2 ? 1 : 0); i++) {
      const bx = x + i * 14 + (j % 2 ? 7 : 0);
      const by = y - (j + 1) * 7;
      const c = pick(r, ['#b44a2a', '#a8402a', '#c05834', '#9e3a22']);
      s += `<rect x="${f(bx)}" y="${f(by)}" width="13" height="6.4" rx=".8" fill="${c}" stroke="#4a1a0a" stroke-width=".7"/>`;
      s += `<path d="M${f(bx + 1)} ${f(by + 1.2)}h10" stroke="#e8906a" stroke-width=".8" opacity=".7"/>`;
    }
  }
  return s;
}

function hills(seed) {
  const r = rng(seed * 171 + 5);
  let s = `<rect width="${W}" height="${H}" fill="#b8683c"/>`;
  s += `<path d="${ridge(0, W, 40, 16, r, { bottom: H })}" fill="#c47a48"/>`;
  s += `<path d="${ridge(0, W, 110, 18, r, { bottom: H })}" fill="#ac5a32"/>`;
  s += `<path d="${ridge(0, W, 190, 16, r, { bottom: H })}" fill="#bf6c3c"/>`;
  s += strokes(r, 80, [0, 0, W, H], { len: 9, ang: -10, jitter: 20, color: '#6a2a12', op: 0.3 });
  s += strokes(r, 30, [0, 0, W, H], { len: 5, color: '#7a8a3a', op: 0.5 });
  // 진흙 구덩이
  const px = 60 + r() * 60;
  const py = 90 + r() * 50;
  s += `<path d="${blob(px, py, 42, 20, r, { n: 10, jag: 0.12 })}" fill="#7a3618" stroke="${INK}" stroke-width="1" stroke-opacity=".6"/>`;
  s += `<path d="${blob(px + 4, py + 3, 28, 11, r, { n: 9, jag: 0.14 })}" fill="#5a2610"/>`;
  s += `<path d="M${f(px - 20)} ${f(py - 6)}q10 -4 22 0" stroke="#d8906a" stroke-width="1.4" fill="none" opacity=".6"/>`;
  // 벽돌 더미
  s += brickStack(130 + r() * 30, 170 + r() * 20, 5, 4, r);
  s += brickStack(30 + r() * 20, 215 + r() * 20, 4, 3, r);
  // 가마
  const kx = 170 + r() * 30;
  const ky = 80 + r() * 20;
  s += shadow(kx + 6, ky + 2, 26, 6, 0.35);
  s += `<path d="M${f(kx - 24)} ${f(ky)}C${f(kx - 24)} ${f(ky - 34)} ${f(kx + 24)} ${f(ky - 34)} ${f(kx + 24)} ${f(ky)}Z" fill="#8a4a2a" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M${f(kx - 8)} ${f(ky)}C${f(kx - 8)} ${f(ky - 12)} ${f(kx + 8)} ${f(ky - 12)} ${f(kx + 8)} ${f(ky)}Z" fill="#2a1206"/>`;
  s += `<path d="M${f(kx - 5)} ${f(ky)}C${f(kx - 5)} ${f(ky - 6)} ${f(kx + 5)} ${f(ky - 6)} ${f(kx + 5)} ${f(ky)}Z" fill="#f09a3a" opacity=".85"/>`;
  s += `<path d="M${f(kx + 6)} ${f(ky - 30)}h8v-10h-8Z" fill="#6a3a22" stroke="${INK}" stroke-width="1"/>`;
  for (let i = 0; i < 3; i++) s += `<path d="${blob(kx + 12 + i * 8, ky - 48 - i * 12, 8 + i * 3, 6 + i * 2, r)}" fill="#e8e0d4" opacity="${0.7 - i * 0.15}"/>`;
  return tile(seed, s);
}

/* ───────── 산 (광석) ───────── */

function peak(cx, base, w, h, r, tone) {
  const pts = [[cx - w / 2, base]];
  const n = 5;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const up = Math.sin(t * Math.PI);
    pts.push([cx - w / 2 + w * t + (r() - 0.5) * 8, base - h * up * (0.75 + r() * 0.35)]);
  }
  pts.push([cx + w / 2, base]);
  const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
  const outline = `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  const dark = mix(tone, '#1a1e24', 0.45);
  const light = mix(tone, '#ffffff', 0.25);
  let s = `<path d="${outline}" fill="${tone}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  s += `<path d="M${f(top[0])} ${f(top[1])}L${f(pts[pts.length - 2][0])} ${f(pts[pts.length - 2][1])}L${f(cx + w / 2)} ${f(base)}L${f(top[0] + 4)} ${f(base)}Z" fill="${dark}" opacity=".6"/>`;
  s += `<path d="M${f(top[0])} ${f(top[1])}L${f(cx - w / 2 + 6)} ${f(base)}" stroke="${light}" stroke-width="2" opacity=".5"/>`;
  // 눈
  const sh = h * 0.28;
  s += `<path d="M${f(top[0])} ${f(top[1])}L${f(top[0] - sh * 0.8)} ${f(top[1] + sh)}Q${f(top[0] - sh * 0.3)} ${f(top[1] + sh * 0.7)} ${f(top[0])} ${f(top[1] + sh * 1.1)}Q${f(top[0] + sh * 0.35)} ${f(top[1] + sh * 0.6)} ${f(top[0] + sh * 0.7)} ${f(top[1] + sh * 0.95)}Z" fill="#f4f6f8" stroke="${INK}" stroke-width=".8" stroke-opacity=".5"/>`;
  s += strokes(r, 10, [cx - w * 0.3, base - h * 0.6, cx + w * 0.3, base - 4], { len: 10, ang: 70, color: '#1a1e24', op: 0.3 });
  return s;
}

function mountains(seed) {
  const r = rng(seed * 191 + 9);
  let s = `<rect width="${W}" height="${H}" fill="#7d8488"/>`;
  s += `<path d="${ridge(0, W, 200, 10, r, { bottom: H })}" fill="#6e7478"/>`;
  s += strokes(r, 60, [0, 0, W, H], { len: 8, ang: 20, color: '#2e3236', op: 0.3 });
  const tones = ['#8e959c', '#9aa2aa', '#848c94', '#a0a6aa'];
  s += peak(60 + r() * 20, 110, 150, 100, r, pick(r, tones));
  s += peak(180 + r() * 20, 105, 150, 95, r, pick(r, tones));
  s += peak(120 + r() * 20, 170, 180, 110, r, pick(r, tones));
  s += peak(40 + r() * 20, 235, 130, 80, r, pick(r, tones));
  s += peak(200 + r() * 20, 240, 130, 85, r, pick(r, tones));
  // 바위
  for (let i = 0; i < 9; i++) {
    const x = r() * W;
    const y = 180 + r() * 90;
    s += `<path d="${blob(x, y, 6 + r() * 6, 4 + r() * 4, r, { n: 6, jag: 0.25 })}" fill="${pick(r, ['#5e6468', '#6e7478', '#4e5458'])}" stroke="${INK}" stroke-width=".7" stroke-opacity=".5"/>`;
  }
  // 광산 입구와 수레
  const mx = 90 + r() * 60;
  const my = 225 + r() * 15;
  s += `<path d="M${f(mx - 18)} ${f(my)}C${f(mx - 18)} ${f(my - 26)} ${f(mx + 18)} ${f(my - 26)} ${f(mx + 18)} ${f(my)}Z" fill="#1a1612" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M${f(mx - 20)} ${f(my)}V${f(my - 20)}M${f(mx + 20)} ${f(my)}V${f(my - 20)}M${f(mx - 23)} ${f(my - 21)}H${f(mx + 23)}" stroke="#7a5a32" stroke-width="4" stroke-linecap="round"/>`;
  s += `<path d="M${f(mx - 10)} ${f(my)}L${f(mx - 20)} ${f(my + 40)}M${f(mx + 10)} ${f(my)}L${f(mx + 20)} ${f(my + 40)}" stroke="#4a3a2a" stroke-width="1.6"/>`;
  const cx = mx + 26;
  const cy = my + 16;
  s += `<path d="M${f(cx - 11)} ${f(cy - 8)}L${f(cx + 11)} ${f(cy - 8)}L${f(cx + 8)} ${f(cy + 4)}L${f(cx - 8)} ${f(cy + 4)}Z" fill="#5a4a3a" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="${blob(cx, cy - 10, 10, 5, r, { n: 7, jag: 0.3 })}" fill="#4a5058"/>`;
  s += `<circle cx="${f(cx - 3)}" cy="${f(cy - 11)}" r="1.4" fill="#cfe6ff"/><circle cx="${f(cx + 4)}" cy="${f(cy - 9)}" r="1.1" fill="#cfe6ff"/>`;
  s += `<circle cx="${f(cx - 6)}" cy="${f(cy + 5)}" r="2.4" fill="#2a2420"/><circle cx="${f(cx + 6)}" cy="${f(cy + 5)}" r="2.4" fill="#2a2420"/>`;
  return tile(seed, s);
}

/* ───────── 사막 ───────── */

function desert(seed) {
  const r = rng(seed * 211 + 13);
  let s = `<rect width="${W}" height="${H}" fill="#e3c283"/>`;
  const tones = ['#ecd39c', '#d8b572', '#e8c888', '#d2ab66', '#efd8a4'];
  for (let i = 0; i < 6; i++) {
    const y = 20 + i * 45 + r() * 10;
    s += `<path d="${ridge(0, W, y, 16, r, { steps: 5, bottom: H })}" fill="${tones[i % tones.length]}"/>`;
    s += `<path d="${smoothOpen([[0, y + 6], [80, y + (r() - 0.5) * 20], [160, y + (r() - 0.5) * 20], [240, y + 4]])}" stroke="#b8904e" stroke-width="1.2" fill="none" opacity=".45"/>`;
  }
  s += strokes(r, 70, [0, 0, W, H], { len: 12, ang: 0, jitter: 12, color: '#a88048', op: 0.3 });
  // 바위와 마른 풀
  for (let i = 0; i < 5; i++) {
    const x = 20 + r() * 200;
    const y = 40 + r() * 210;
    s += shadow(x + 4, y + 4, 10, 3, 0.25);
    s += `<path d="${blob(x, y, 8 + r() * 5, 5 + r() * 3, r, { n: 6, jag: 0.25 })}" fill="${pick(r, ['#a88660', '#9a7a52', '#b8966a'])}" stroke="${INK}" stroke-width=".8" stroke-opacity=".5"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = r() * W;
    const y = r() * H;
    s += strokes(r, 6, [x - 4, y - 2, x + 4, y + 2], { len: 7, ang: -90, jitter: 70, color: '#7a6a3a', op: 0.7 });
  }
  // 선인장
  const cx = 150 + r() * 50;
  const cy = 120 + r() * 60;
  s += shadow(cx + 10, cy + 2, 14, 4, 0.3);
  s += `<path d="M${f(cx - 5)} ${f(cy)}V${f(cy - 34)}C${f(cx - 5)} ${f(cy - 42)} ${f(cx + 5)} ${f(cy - 42)} ${f(cx + 5)} ${f(cy - 34)}V${f(cy)}Z" fill="#6a8a3a" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M${f(cx - 5)} ${f(cy - 14)}H${f(cx - 12)}C${f(cx - 16)} ${f(cy - 14)} ${f(cx - 16)} ${f(cy - 18)} ${f(cx - 16)} ${f(cy - 20)}V${f(cy - 26)}C${f(cx - 16)} ${f(cy - 30)} ${f(cx - 10)} ${f(cy - 30)} ${f(cx - 10)} ${f(cy - 26)}V${f(cy - 19)}H${f(cx - 5)}" fill="#6a8a3a" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="M${f(cx - 1)} ${f(cy - 36)}V${f(cy - 2)}" stroke="#9ab860" stroke-width="1.2" opacity=".7"/>`;
  return tile(seed, s);
}

const VARIANTS = 3;
const TILES = { forest, pasture, fields, hills, mountains, desert };

/* ───────── 바다 판 ───────── */

function sea() {
  const r = rng(77);
  const SW = 880;
  const SH = 820;
  let s = `<rect width="${SW}" height="${SH}" fill="#2c6f9c"/>`;
  for (let i = 0; i < 26; i++) s += `<path d="${blob(r() * SW, r() * SH, 60 + r() * 90, 30 + r() * 50, r, { n: 10, jag: 0.3 })}" fill="${pick(r, ['#347ca8', '#26628c', '#3a86b0', '#2a6894'])}" opacity=".6"/>`;
  for (let i = 0; i < 260; i++) {
    const x = r() * SW;
    const y = r() * SH;
    const w = 6 + r() * 12;
    s += `<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-w / 3)} ${f(w)} 0" stroke="#d8f0ff" stroke-width="${f(1 + r())}" fill="none" opacity="${f(0.25 + r() * 0.35)}" stroke-linecap="round"/>`;
  }
  return svg(SW, SH, `<g filter="url(#paint)">${s}</g><rect width="${SW}" height="${SH}" filter="url(#grain)" opacity=".35"/>`, {
    defs: `${paintFilter('paint', { seed: 41, bend: 8, ink: 1.4 })}${paperGrain('grain', 12)}`,
  });
}

module.exports = { TILES, VARIANTS, sea, W, H };
