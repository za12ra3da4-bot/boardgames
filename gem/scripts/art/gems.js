'use strict';
// 보석 그리기: 색마다 다른 연마 방식 (브릴리언트 · 오벌 · 에메랄드 · 쿠션 · 카보숑) + 칩 토큰
const { f, mix, rad, lin } = require('../../../wolf/scripts/art/draw');
const G = require('../../public/shared/gem');

let uid = 0;

/** 다각형 꼭짓점 */
const poly = (cx, cy, rx, ry, n, rot = 0) => Array.from({ length: n }, (_, i) => {
  const a = rot + (i / n) * Math.PI * 2;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const P = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;

/**
 * 반짝이는 보석 한 알 (cx, cy 중심, 반지름 r)
 * 빛은 왼쪽 위에서 온다: 면마다 밝기를 달리해 입체감을 낸다.
 */
function facetGem(cx, cy, r, color) {
  const g = G.GEMS[color];
  const id = `gm${++uid}`;
  const L = g.light;
  const M = g.fill;
  const D = g.dark;
  const shade = (k) => (k > 0 ? mix(M, L, k) : mix(M, D, -k));
  let s = `<defs>${rad(`${id}g`, [[0, L], [0.55, M], [1, D]], 0.35, 0.3, 0.8)}${lin(`${id}l`, [[0, '#ffffff', 0.9], [1, '#ffffff', 0]], 0, 0, 1, 1)}</defs>`;
  s += `<ellipse cx="${f(cx + r * 0.08)}" cy="${f(cy + r * 1.02)}" rx="${f(r * 0.9)}" ry="${f(r * 0.2)}" fill="#000" opacity=".35"/>`;

  if (color === 'white' || color === 'gold') {
    // 라운드 브릴리언트: 팔각 테이블 + 별 면 + 거들
    const outer = poly(cx, cy, r, r, 16, Math.PI / 16);
    const table = poly(cx, cy, r * 0.5, r * 0.5, 8, Math.PI / 8);
    s += `<path d="${P(outer)}" fill="url(#${id}g)" stroke="${D}" stroke-width="${f(r * 0.04)}"/>`;
    for (let i = 0; i < 16; i++) {
      const a = outer[i];
      const b = outer[(i + 1) % 16];
      const t = table[Math.floor(i / 2) % 8];
      const lit = Math.cos((i / 16) * Math.PI * 2 + 2.3);
      s += `<path d="${P([a, b, t])}" fill="${shade(lit * 0.7)}" opacity=".85"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const t1 = table[i];
      const t2 = table[(i + 1) % 8];
      const o = outer[i * 2 + 1];
      s += `<path d="${P([t1, t2, o])}" fill="${shade(Math.cos((i / 8) * Math.PI * 2 + 2.3) * 0.9)}"/>`;
    }
    s += `<path d="${P(table)}" fill="${shade(0.45)}" stroke="${mix(L, '#ffffff', 0.5)}" stroke-width="${f(r * 0.025)}"/>`;
  } else if (color === 'blue') {
    // 오벌: 가로로 긴 타원, 방사형 면
    const outer = poly(cx, cy, r * 1.15, r * 0.85, 20);
    const table = poly(cx, cy, r * 0.6, r * 0.42, 10);
    s += `<path d="${P(outer)}" fill="url(#${id}g)" stroke="${D}" stroke-width="${f(r * 0.04)}"/>`;
    for (let i = 0; i < 20; i++) {
      const t = table[Math.floor(i / 2)];
      s += `<path d="${P([outer[i], outer[(i + 1) % 20], t])}" fill="${shade(Math.cos((i / 20) * Math.PI * 2 + 2.3) * 0.8)}" opacity=".9"/>`;
    }
    s += `<path d="${P(table)}" fill="${shade(0.35)}"/>`;
  } else if (color === 'green') {
    // 에메랄드 컷: 모서리가 잘린 직사각형, 계단식 면
    const w = r * 0.95;
    const h = r * 1.2;
    const c = r * 0.3;
    const ring = (k) => {
      const W = w * k;
      const H = h * k;
      const C = c * k;
      return [[cx - W + C, cy - H], [cx + W - C, cy - H], [cx + W, cy - H + C], [cx + W, cy + H - C], [cx + W - C, cy + H], [cx - W + C, cy + H], [cx - W, cy + H - C], [cx - W, cy - H + C]];
    };
    const rings = [ring(1), ring(0.8), ring(0.6), ring(0.42)];
    s += `<path d="${P(rings[0])}" fill="url(#${id}g)" stroke="${D}" stroke-width="${f(r * 0.04)}"/>`;
    const lights = [0.8, 0.3, -0.2, -0.6, -0.8, -0.4, 0.1, 0.6];
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 8; i++) {
        const a = rings[k][i];
        const b = rings[k][(i + 1) % 8];
        const cc = rings[k + 1][(i + 1) % 8];
        const d = rings[k + 1][i];
        s += `<path d="${P([a, b, cc, d])}" fill="${shade(lights[i] * (1 - k * 0.2))}"/>`;
      }
    }
    s += `<path d="${P(rings[3])}" fill="${shade(0.25)}"/>`;
  } else if (color === 'red') {
    // 쿠션: 둥근 사각형, 대각선 면
    const outer = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const k = 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 3) + Math.pow(Math.abs(Math.sin(a)), 3), 1 / 3);
      outer.push([cx + Math.cos(a) * r * k * 0.95, cy + Math.sin(a) * r * k * 0.95]);
    }
    const table = poly(cx, cy, r * 0.5, r * 0.5, 4, Math.PI / 4);
    s += `<path d="${P(outer)}" fill="url(#${id}g)" stroke="${D}" stroke-width="${f(r * 0.04)}"/>`;
    for (let i = 0; i < 24; i++) {
      const t = table[Math.floor(((i + 3) % 24) / 6)];
      s += `<path d="${P([outer[i], outer[(i + 1) % 24], t])}" fill="${shade(Math.cos((i / 24) * Math.PI * 2 + 2.3) * 0.85)}" opacity=".9"/>`;
    }
    s += `<path d="${P(table)}" fill="${shade(0.4)}"/>`;
  } else {
    // 오닉스: 매끈한 카보숑 (둥근 돔 + 강한 반사)
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * 0.92)}" fill="url(#${id}g)" stroke="${D}" stroke-width="${f(r * 0.04)}"/>`;
    s += `<ellipse cx="${cx}" cy="${f(cy + r * 0.1)}" rx="${f(r * 0.85)}" ry="${f(r * 0.72)}" fill="${D}" opacity=".35"/>`;
    s += `<path d="M${f(cx - r * 0.7)} ${f(cy + r * 0.2)}Q${f(cx)} ${f(cy + r * 0.85)} ${f(cx + r * 0.7)} ${f(cy + r * 0.2)}" stroke="${L}" stroke-width="${f(r * 0.06)}" fill="none" opacity=".45"/>`;
  }
  // 반사광 · 반짝임
  s += `<path d="M${f(cx - r * 0.55)} ${f(cy - r * 0.2)}Q${f(cx - r * 0.45)} ${f(cy - r * 0.6)} ${f(cx - r * 0.05)} ${f(cy - r * 0.62)}" stroke="#fff" stroke-width="${f(r * 0.1)}" stroke-linecap="round" fill="none" opacity=".75"/>`;
  s += sparkle(cx + r * 0.45, cy - r * 0.45, r * 0.35);
  return s;
}

function sparkle(x, y, s) {
  return `<path d="M${f(x)} ${f(y - s)}L${f(x + s * 0.14)} ${f(y - s * 0.14)}L${f(x + s)} ${f(y)}L${f(x + s * 0.14)} ${f(y + s * 0.14)}L${f(x)} ${f(y + s)}L${f(x - s * 0.14)} ${f(y + s * 0.14)}L${f(x - s)} ${f(y)}L${f(x - s * 0.14)} ${f(y - s * 0.14)}Z" fill="#fff" opacity=".95"/>`;
}

/** 칩 토큰 (200×200): 테두리 무늬가 있는 두꺼운 칩 + 가운데 보석 */
function chip(color) {
  const g = G.GEMS[color];
  const base = color === 'white' ? '#e8ecf4' : color === 'gold' ? '#e8b830' : mix(g.fill, '#000000', 0.15);
  const edge = color === 'white' ? '#9aa4b8' : mix(g.fill, '#000000', 0.55);
  let notches = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    notches += `<path d="M${f(100 + Math.cos(a - 0.14) * 92)} ${f(100 + Math.sin(a - 0.14) * 92)}A92 92 0 0 1 ${f(100 + Math.cos(a + 0.14) * 92)} ${f(100 + Math.sin(a + 0.14) * 92)}L${f(100 + Math.cos(a + 0.12) * 76)} ${f(100 + Math.sin(a + 0.12) * 76)}A76 76 0 0 0 ${f(100 + Math.cos(a - 0.12) * 76)} ${f(100 + Math.sin(a - 0.12) * 76)}Z" fill="${color === 'white' ? '#6a7890' : '#f4ecd8'}" opacity=".9"/>`;
  }
  const center = color === 'gold'
    ? `<circle cx="100" cy="100" r="46" fill="#f8d860" stroke="#8a6010" stroke-width="4"/><circle cx="100" cy="100" r="38" fill="none" stroke="#b8901e" stroke-width="2" stroke-dasharray="3 4"/>
       <path d="M76 110L70 84L86 96L100 76L114 96L130 84L124 110Z" fill="#b8801a" stroke="#6a4a08" stroke-width="2.5" stroke-linejoin="round"/><path d="M76 116H124" stroke="#6a4a08" stroke-width="5"/>
       ${sparkle(122, 78, 12)}`
    : facetGem(100, 98, 40, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>${rad('cb', [[0, mix(base, '#ffffff', 0.25)], [0.7, base], [1, mix(base, '#000000', 0.25)]], 0.4, 0.35, 0.75)}</defs>
    <circle cx="100" cy="106" r="94" fill="#000" opacity=".35"/>
    <circle cx="100" cy="100" r="94" fill="${edge}"/>
    <circle cx="100" cy="100" r="90" fill="url(#cb)"/>
    ${notches}
    <circle cx="100" cy="100" r="66" fill="${mix(base, '#000000', 0.12)}" stroke="${edge}" stroke-width="3"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="${mix(base, '#ffffff', 0.4)}" stroke-width="1.5" opacity=".7"/>
    ${center}
    <path d="M30 70A78 78 0 0 1 90 22" stroke="#fff" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>
  </svg>`;
}

/** 작은 보석 아이콘 (64×64) */
function icon(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${facetGem(32, 31, 24, color)}</svg>`;
}

module.exports = { facetGem, sparkle, chip, icon };
