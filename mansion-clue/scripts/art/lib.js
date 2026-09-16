'use strict';
// SVG 그림 생성용 공통 도구

const svg = (w, h, body, { defs = '', vb } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb || `0 0 ${w} ${h}`}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const stops = (arr) => arr.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, arr, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(arr)}</linearGradient>`;
const rad = (id, arr, cx = 0.5, cy = 0.5, r = 0.5, extra = '') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${extra}>${stops(arr)}</radialGradient>`;

/** 필름 그레인: R 채널 밝기에 따라 검은 점을 뿌린다 */
const grainFilter = (id, freq = 0.9) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.62"/></filter>`;
const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const drop = (id, dy = 4, s = 4, op = 0.5) =>
  `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${s}" flood-color="#000" flood-opacity="${op}"/></filter>`;

/** 결과가 매번 같은 난수 */
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const f = (n) => Number(n.toFixed(1));

module.exports = { svg, lin, rad, grainFilter, blur, drop, rng, f, stops };
