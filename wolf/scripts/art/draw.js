'use strict';
// 보름밤 늑대인간 그림 도구: 달빛 역광 실루엣 + 붓 느낌 필터
const f = (n) => Number(n.toFixed(1));

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const stops = (arr) => arr.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, arr, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(arr)}</linearGradient>`;
const rad = (id, arr, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(arr)}</radialGradient>`;
const svg = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

function mix(a, b, t) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** 손으로 그린 듯 가장자리를 흔드는 필터 + 종이결 */
const roughFilter = (id, scale = 3, freq = 0.05, seed = 3) =>
  `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${scale}"/></filter>`;
const grain = (id) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.6"/></filter>`;
const soft = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;

/** 뾰족한 전나무 실루엣 */
function pine(x, y, h, fill) {
  const w = h * 0.36;
  let d = `M${f(x)} ${f(y - h)}`;
  const tiers = 5;
  for (let i = 1; i <= tiers; i++) {
    const ty = y - h + (h * 0.86 * i) / tiers;
    const tw = (w * i) / tiers;
    d += `L${f(x + tw)} ${f(ty)}L${f(x + tw * 0.45)} ${f(ty - h * 0.04)}`;
  }
  d += `L${f(x + w * 0.1)} ${f(y - h * 0.14)}L${f(x + w * 0.1)} ${f(y)}L${f(x - w * 0.1)} ${f(y)}L${f(x - w * 0.1)} ${f(y - h * 0.14)}`;
  for (let i = tiers; i >= 1; i--) {
    const ty = y - h + (h * 0.86 * i) / tiers;
    const tw = (w * i) / tiers;
    d += `L${f(x - tw * 0.45)} ${f(ty - h * 0.04)}L${f(x - tw)} ${f(ty)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

/** 울퉁불퉁한 언덕 */
function ridge(x0, x1, y, amp, r, bottom, steps = 10) {
  let d = `M${x0} ${bottom}L${x0} ${f(y + (r() - 0.5) * amp)}`;
  for (let i = 1; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const cx = x - (x1 - x0) / steps / 2;
    d += `Q${f(cx)} ${f(y + (r() - 0.5) * amp * 2)} ${f(x)} ${f(y + (r() - 0.5) * amp)}`;
  }
  return `${d}L${x1} ${bottom}Z`;
}

/* ── 사람 모양: 발 = (0,0), 키 100 */
const BODY = {
  coat: 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79Z',
  dress: 'M-6 -79C-12 -78 -15 -73 -15 -66L-17 -40C-17 -37 -14 -37 -13 -39L-11 -56L-10 -46C-15 -30 -20 -12 -23 0H23C20 -12 15 -30 10 -46L11 -56L13 -39C14 -37 17 -37 17 -40L15 -66C15 -73 12 -78 6 -79Z',
  robe: 'M-16 0C-18 -20 -20 -40 -15 -56C-16 -68 -9 -80 1 -80C11 -80 17 -68 15 -56C21 -42 20 -20 18 0Z',
  head: 'M-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z',
  wolf: 'M-13 0L-9 -20C-14 -30 -18 -40 -16 -52C-21 -55 -27 -58 -31 -54L-36 -49L-35 -55L-39 -53L-35 -59C-30 -65 -22 -66 -15 -62C-13 -70 -9 -76 -3 -78L-7 -92L1 -83C4 -85 7 -85 10 -83L13 -96L15 -80C19 -78 25 -76 31 -73L33 -69C27 -69 22 -67 18 -67C18 -63 16 -61 14 -59C22 -57 29 -53 33 -47L39 -45L35 -43L39 -39L33 -41C29 -47 23 -49 16 -49C18 -39 16 -29 12 -19L16 0H8L4 -17H-2L-6 0Z',
};

/**
 * 한 사람(또는 늑대)을 달빛 역광으로 그린다.
 * parts: 몸과 소품 path 조각들 (같은 좌표계)
 */
function silhouette({ x, y, s, parts, color = '#10141f', rim = '#cfe0ff', lightDir = 1, over = '', flip = false, id }) {
  const solid = parts.join('');
  const sx = flip ? -s : s;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx)} ${f(s)})">
    <defs><clipPath id="${id}">${solid}</clipPath></defs>
    <g fill="${rim}">${solid}</g>
    <g clip-path="url(#${id})"><g fill="${color}" transform="translate(${-lightDir * 1.6 * (flip ? -1 : 1)} 1)">${solid}</g></g>
    ${over}
  </g>`;
}
const P = (d) => `<path d="${d}"/>`;

module.exports = { f, rng, lin, rad, svg, mix, roughFilter, grain, soft, pine, ridge, BODY, silhouette, P };
