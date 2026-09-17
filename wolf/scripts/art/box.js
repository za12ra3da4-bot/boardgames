'use strict';
// 상자 앞면: 짙푸른 밤하늘, 커다란 보름달, 절벽 끝에 선 늑대인간, 양옆 전나무
const { f, rng, lin, rad, svg, roughFilter, grain, soft, pine, BODY, P } = require('./draw');

const W = 720;
const H = 540;

function box() {
  const r = rng(2024);
  let sky = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 120; i++) sky += `<circle cx="${f(r() * W)}" cy="${f(r() * 300)}" r="${f(0.4 + r() * 1.1)}" fill="#fff" opacity="${f(0.2 + r() * 0.7)}"/>`;
  // 구름: 달 앞을 스치는 얇은 띠
  const cloud = (x, y, w, o) => `<path d="M${x} ${y}c${w * 0.15} -14 ${w * 0.3} -14 ${w * 0.42} -4c${w * 0.12} -12 ${w * 0.32} -10 ${w * 0.4} 0c${w * 0.1} -4 ${w * 0.16} 0 ${w * 0.18} 6Z" fill="#5a78a8" opacity="${o}"/>`;
  const moon = `
    <circle cx="430" cy="210" r="260" fill="url(#halo)"/>
    <circle cx="430" cy="210" r="168" fill="url(#moon)"/>
    <g fill="#c8b284" opacity=".35">
      <ellipse cx="380" cy="170" rx="42" ry="30"/><ellipse cx="470" cy="250" rx="34" ry="24"/>
      <ellipse cx="490" cy="140" rx="22" ry="16"/><ellipse cx="360" cy="260" rx="18" ry="12"/><ellipse cx="420" cy="310" rx="26" ry="14"/>
    </g>
    <circle cx="430" cy="210" r="168" fill="url(#moonShade)"/>
    ${cloud(170, 300, 260, 0.45)}${cloud(470, 120, 230, 0.35)}${cloud(520, 330, 200, 0.4)}`;

  // 먼 숲 (안개 속)
  let far = '';
  for (let i = 0; i < 30; i++) far += pine(f(i * 26 + r() * 14), 452 + r() * 12, 70 + r() * 50, '#1c2c50');
  let mid = '';
  for (let i = 0; i < 20; i++) mid += pine(f(i * 38 + r() * 20), 486 + r() * 10, 90 + r() * 60, '#101a34');

  // 절벽: 오른쪽에서 가운데로 튀어나온 바위
  const cliff = `<path d="M${W} 318C650 318 600 322 560 330C520 336 480 334 452 344C440 348 438 356 446 362C470 372 500 370 520 384C540 400 546 430 560 460C580 500 600 520 620 ${H}H${W}Z" fill="#070b16"/>
    <path d="M452 344C440 348 438 356 446 362" stroke="#8aa0c8" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M560 330C520 336 480 334 452 344" stroke="#b8c8e8" stroke-width="2.4" fill="none" opacity=".7"/>
    <path d="M600 324L640 320" stroke="#b8c8e8" stroke-width="1.6" opacity=".5"/>`;

  // 늑대인간 (절벽 끝, 달을 등지고)
  const wolf = `<g transform="translate(496 338) scale(2.7)">
      <g fill="#b8c8e8">${P(BODY.wolf)}</g>
      <g clip-path="url(#wolfClip)"><g fill="#05070e" transform="translate(1.4 .8)">${P(BODY.wolf)}</g></g>
      <circle cx="8" cy="-79" r="1.5" fill="#ffd23a"/><circle cx="12.5" cy="-79" r="1.5" fill="#ffd23a"/>
      <circle cx="10" cy="-79" r="6" fill="#ffd23a" opacity=".25" filter="url(#blur)"/>
      <path d="M26 -70l2 3l2 -3l2 3" stroke="#f4f0e0" stroke-width=".8" fill="none"/>
      <path d="M36 -49l4 -1M36 -43l4 1M-36 -52l-3 -2M-37 -56l-3 1" stroke="#f4f0e0" stroke-width=".7"/>
    </g>`;

  // 앞쪽 큰 전나무들
  let front = '';
  front += pine(40, 560, 380, '#03050b') + pine(110, 572, 290, '#03050b') + pine(-10, 560, 300, '#03050b');
  front += pine(700, 572, 300, '#03050b') + pine(650, 590, 220, '#03050b');
  front += `<path d="M0 ${H}V500C120 480 260 490 420 510C520 500 600 490 ${W} 500V${H}Z" fill="#03050b"/>`;

  // 박쥐 몇 마리
  const bat = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0C-3 -3 -8 -3 -12 0C-9 0 -8 2 -8 3C-6 1 -3 2 -2 3L0 1L2 3C3 2 6 1 8 3C8 2 9 0 12 0C8 -3 3 -3 0 0Z" fill="#05070e"/>`;
  const bats = bat(250, 150, 1.6) + bat(290, 120, 1.1) + bat(600, 90, 1.3);

  return svg(W, H, `
    <g filter="url(#rough)">${sky}</g>
    ${moon}
    <rect width="${W}" height="${H}" fill="url(#mistHigh)"/>
    <g filter="url(#rough)">${far}</g>
    <rect y="360" width="${W}" height="180" fill="url(#mist)"/>
    <g filter="url(#rough)">${mid}</g>
    <g filter="url(#roughS)">${cliff}${wolf}${front}${bats}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".18"/>`,
  `<clipPath id="wolfClip">${P(BODY.wolf)}</clipPath>
    ${lin('sky', [[0, '#040a1e'], [0.45, '#0e2458'], [0.8, '#1c3c7c'], [1, '#27508e']])}
    ${rad('moon', [[0, '#fffdf0'], [0.6, '#fbf0c8'], [0.92, '#eed89a'], [1, '#d8bc70']])}
    ${rad('moonShade', [[0.6, '#000', 0], [1, '#5a4a20', 0.3]], 0.6, 0.6, 0.6)}
    ${rad('halo', [[0.55, '#fff4c0', 0.55], [0.75, '#c8d8ff', 0.18], [1, '#8aa8e8', 0]])}
    ${lin('mist', [[0, '#8aa8d8', 0], [0.4, '#8aa8d8', 0.35], [1, '#8aa8d8', 0.05]])}
    ${lin('mistHigh', [[0.6, '#8aa8d8', 0], [0.85, '#8aa8d8', 0.25], [1, '#8aa8d8', 0]])}
    ${rad('vig', [[0.55, '#000', 0], [1, '#000', 0.65]], 0.55, 0.4, 0.75)}
    ${roughFilter('rough', 4, 0.025, 6)}${roughFilter('roughS', 3, 0.05, 8)}${grain('grain')}${soft('blur', 2)}`);
}

/** 작은 로고 (달 + 늑대 머리) */
function logo() {
  return svg(64, 64, `
    <circle cx="32" cy="32" r="30" fill="#0e2458" stroke="#c8a44a" stroke-width="3"/>
    <circle cx="36" cy="28" r="17" fill="url(#m)"/>
    <g transform="translate(26 58) scale(.52)" fill="#05070e">${P(BODY.wolf)}</g>
    <circle cx="30.2" cy="16.9" r=".9" fill="#ffd23a"/>`,
  `${rad('m', [[0, '#fffdf0'], [1, '#e8cf88']])}`);
}

module.exports = { box, logo };
