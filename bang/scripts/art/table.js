'use strict';
// 2000년대 실물 보드게임 느낌: 나무 테이블 판자 + 인쇄 종이 질감 (둘 다 이어 붙여도 티 안 나게)
const { svg, lin, rng, f } = require('./lib');

const SIZE = 512;
const PLANK = SIZE / 4;

function grainFilter(id, seed, freq) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 .30  0 0 0 0 .15  0 0 0 0 .05  0 0 0 -2.6 1.42"/>
  </filter>`;
}

/** 꿀색 소나무 판자 4장 */
function wood() {
  const r = rng(41);
  const tones = [['#dca866', '#b77a3c'], ['#d19a58', '#aa6d32'], ['#e0ae6c', '#bb7e40'], ['#cf9654', '#a66a2e']];
  let defs = '';
  let body = '';
  tones.forEach(([a, b], i) => {
    const y = i * PLANK;
    defs += lin(`p${i}`, [[0, a], [0.5, b], [1, a]], 0, 0, 0, 1);
    defs += grainFilter(`g${i}`, 11 + i * 7, `0.0039 ${f(0.07 + i * 0.012)}`);
    body += `<rect y="${y}" width="${SIZE}" height="${PLANK}" fill="url(#p${i})"/>`;
    body += `<rect y="${y}" width="${SIZE}" height="${PLANK}" filter="url(#g${i})" opacity=".8"/>`;
    // 옹이
    const kx = f(60 + r() * 380);
    const ky = f(y + 30 + r() * 60);
    body += `<ellipse cx="${kx}" cy="${ky}" rx="${f(10 + r() * 8)}" ry="${f(5 + r() * 3)}" fill="none" stroke="#6a3812" stroke-width="2" opacity=".45"/>
      <ellipse cx="${kx}" cy="${ky}" rx="${f(4 + r() * 3)}" ry="${f(2 + r())}" fill="#5a2e0c" opacity=".55"/>`;
    // 판자 이음새와 못
    body += `<rect y="${y}" width="${SIZE}" height="2.5" fill="#3a1c08" opacity=".7"/>
      <rect y="${y + 2.5}" width="${SIZE}" height="1.5" fill="#f4cf94" opacity=".35"/>`;
    const seam = f(80 + ((i * 173) % 340));
    body += `<rect x="${seam}" y="${y}" width="2.5" height="${PLANK}" fill="#3a1c08" opacity=".55"/>`;
    for (const nx of [seam - 12, seam + 14]) {
      body += `<circle cx="${nx}" cy="${y + 14}" r="2.6" fill="#3a2a1e"/><circle cx="${nx}" cy="${y + PLANK - 14}" r="2.6" fill="#3a2a1e"/>`;
    }
  });
  return svg(SIZE, SIZE, body, { defs });
}

/** 인쇄 종이 · 골판지 결 (반투명, 색 위에 덮어 쓴다) */
function paper() {
  return svg(300, 300, '<rect width="300" height="300" filter="url(#n)"/>', {
    defs: `<filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="5" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .24  0 0 0 0 .12  0 0 0 .9 -.3"/>
    </filter>`,
  });
}

module.exports = { wood, paper };

/* ───── 플레이어 보드판 (가로형): 역할 · 캐릭터 · 총 칸 + 총알 5칸 ───── */

const BW = 300;
const BH = 130;
const SLOTS = [14, 92, 170];   // 카드 칸 x (70×98, y=16)
const BULLET_X = 252;
const bulletY = (i) => 14 + i * 22;

const bulletPath = (x, y) =>
  `M${x} ${y + 1}H${x + 22}C${x + 30} ${y + 1} ${x + 36} ${y + 4} ${x + 36} ${y + 6}C${x + 36} ${y + 8} ${x + 30} ${y + 11} ${x + 22} ${y + 11}H${x}Z`;

function saguaro(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="#4f7a3a" stroke="#1c120a" stroke-width="1.6" stroke-linejoin="round">
    <path d="M-6 0V-58C-6 -66 6 -66 6 -58V0Z"/>
    <path d="M-6 -24H-16C-22 -24 -24 -28 -24 -32V-44C-24 -50 -16 -50 -16 -44V-34H-6Z"/>
    <path d="M6 -32H14V-50C14 -56 22 -56 22 -50V-36C22 -30 20 -26 14 -26H6Z"/>
    <path d="M-2 -56V-4M2 -52V-8" stroke="#8ab86a" stroke-width="1" fill="none"/>
  </g>`;
}

/** 프린트된 기본 총 (콜트 .45, 사거리 1) */
function coltCard(x, y) {
  return `<g transform="translate(${x} ${y})">
    <rect width="70" height="98" rx="6" fill="#f6eedb" stroke="#2f6d9a" stroke-width="4"/>
    <text x="35" y="20" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="12" fill="#1c120a">COLT .45</text>
    <g transform="translate(12 36)" fill="#3a3a3a" stroke="#1c120a" stroke-width="1.2" stroke-linejoin="round">
      <path d="M0 6H34V13H0Z"/>
      <path d="M-4 3H12V17H-4Z"/>
      <circle cx="4" cy="10" r="6" fill="#6a6a6a"/>
      <path d="M-4 15C-8 26 -6 32 0 34L8 31C4 26 4 21 6 16Z" fill="#7a4a24"/>
      <path d="M10 17C10 22 13 24 17 24" fill="none"/>
    </g>
    <circle cx="35" cy="80" r="10" fill="#fff" stroke="#1c120a" stroke-width="1.6"/>
    <path d="M35 68V92M23 80H47" stroke="#1c120a" stroke-width="1"/>
    <rect x="30" y="75" width="10" height="10" fill="#fff"/>
    <text x="35" y="84" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="10" fill="#1c120a">1</text>
  </g>`;
}

function board() {
  const r = rng(77);
  const bushes = Array.from({ length: 7 }, () => `<ellipse cx="${f(r() * BW)}" cy="${f(112 + r() * 14)}" rx="${f(6 + r() * 8)}" ry="${f(2 + r() * 2)}" fill="#8a6a3a" opacity=".6"/>`).join('');
  const slots = SLOTS.map((x, i) => `
    <rect x="${x}" y="16" width="70" height="98" rx="6" fill="#fff" fill-opacity=".2" stroke="#fffbef" stroke-width="2.4"/>
    <text x="${x + 35}" y="70" text-anchor="middle" font-family="'Malgun Gothic', sans-serif" font-weight="700" font-size="11" fill="#fffbef" opacity=".85">${['역할', '캐릭터', ''][i]}</text>`).join('');
  const bullets = Array.from({ length: 5 }, (_, i) => `<path d="${bulletPath(BULLET_X, bulletY(i))}" fill="#fff" fill-opacity=".18" stroke="#fffbef" stroke-width="1.8"/>
    <path d="M${BULLET_X + 22} ${bulletY(i) + 1}V${bulletY(i) + 11}" stroke="#fffbef" stroke-width="1.2"/>`).join('');
  const body = `
    <rect width="${BW}" height="${BH}" fill="url(#sky)"/>
    <circle cx="232" cy="30" r="17" fill="#f7c35a" opacity=".85"/>
    <path d="M0 78L22 62H48L60 74L96 70L110 52H150L164 72L200 76L214 60H246L262 76L300 70V130H0Z" fill="#c7864a" stroke="#1c120a" stroke-width="1.4"/>
    <path d="M0 96Q70 86 150 94T300 90V130H0Z" fill="#dca468"/>
    <path d="M0 110Q80 102 160 108T300 106V130H0Z" fill="#c98e52"/>
    <path d="M110 52H150L152 60H108Z" fill="#a8683a" opacity=".6"/>
    ${bushes}
    ${saguaro(52, 112, 0.9)}${saguaro(236, 120, 0.72)}
    <path d="M120 40q6 -4 12 0M126 36q5 -3 10 0" stroke="#1c120a" stroke-width="1.2" fill="none"/>
    <rect width="${BW}" height="${BH}" filter="url(#bn)" opacity=".5"/>
    <rect width="${BW}" height="${BH}" fill="#2a1406" opacity=".12"/>
    ${slots}
    ${coltCard(SLOTS[2], 16)}
    ${bullets}
    <rect x="1.5" y="1.5" width="${BW - 3}" height="${BH - 3}" rx="10" fill="none" stroke="#1c120a" stroke-width="3"/>`;
  return svg(BW, BH, `<g clip-path="url(#bc)">${body}</g>`, {
    defs: lin('sky', [[0, '#f6e6c0'], [1, '#eab878']])
      + `<clipPath id="bc"><rect width="${BW}" height="${BH}" rx="10"/></clipPath>`
      + `<filter id="bn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .18  0 0 0 0 .06  0 0 0 .7 -.25"/></filter>`,
  });
}

/** 판 위에 올라가는 채운 총알 (가로) */
function bulletFilled() {
  return svg(36, 12, `<path d="${bulletPath(0, 0)}" fill="url(#bb)" stroke="#1c120a" stroke-width="1.2"/>
    <path d="M22 1V11" stroke="#6e4a12" stroke-width="1.2"/><path d="M3 3.5H20" stroke="#fff6d0" stroke-width="1.4" opacity=".8"/>`, {
    defs: lin('bb', [[0, '#fff1b8'], [0.5, '#d8a93c'], [1, '#8a5a18']], 0, 0, 0, 1),
  });
}

module.exports.board = board;
module.exports.bulletFilled = bulletFilled;
