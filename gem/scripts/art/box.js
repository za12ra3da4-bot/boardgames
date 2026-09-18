'use strict';
// 상자 앞면 (600×720): 역광 실루엣의 보석상이 두 손으로 푸른 보석을 들어 올린다.
// 얼굴은 어둠 속, 보석빛이 닿는 가장자리(턱 · 코 · 눈썹뼈 · 손가락)만 붓선으로 밝힌다. 금빛 장식 테두리.
const { rad, lin, grain } = require('../../../wolf/scripts/art/draw');
const { stroke, furStrokes, rng, f } = require('./ink');
const { facetGem, sparkle } = require('./gems');

const W = 600;
const H = 720;
const GX = 300;
const GY = 478;

function box() {
  const r = rng(90210);
  const glowLine = (pts, w = 3, op = 0.9, color = '#9fd0ff') => stroke(r, pts, { w, color, op, jit: 0.5, taper: 0.3 });

  /* 배경: 저녁 안개 속 르네상스 도시 */
  let city = '';
  const skyline = [[0, 470], [40, 440], [70, 452], [96, 400], [120, 404], [132, 360], [150, 360], [160, 420], [190, 430], [210, 380], [226, 376], [236, 420], [260, 430], [360, 430], [380, 396], [392, 300], [404, 300], [416, 396], [440, 410], [470, 350], [500, 348], [520, 300], [540, 340], [560, 420], [600, 430], [600, 720], [0, 720]];
  city += `<path d="M${skyline.map(([x, y]) => `${x} ${y}`).join('L')}Z" fill="#0a1a22"/>`;
  city += `<path d="M470 350Q485 300 500 350Z" fill="#0a1a22"/><path d="M485 306V286M479 292h12" stroke="#0a1a22" stroke-width="3"/>`;
  for (let i = 0; i < 24; i++) city += `<rect x="${f(20 + r() * 560)}" y="${f(400 + r() * 60)}" width="4" height="6" fill="#e8b860" opacity="${f(0.3 + r() * 0.5)}"/>`;

  /* 실루엣: 모피 모자 · 머리 · 어깨 (하나의 어두운 몸) */
  const hat = 'M150 262C132 200 142 110 206 80C258 56 342 56 394 80C458 110 468 200 450 262C392 284 208 284 150 262Z';
  const headBody = 'M218 262C212 312 220 362 238 400C252 430 272 448 286 456L284 470C220 476 150 500 96 540C50 576 20 640 10 720H590C580 640 550 576 504 540C450 500 380 476 316 470L314 456C328 448 348 430 362 400C380 362 388 312 382 262Z';
  let fig = `<path d="${headBody}" fill="#05080a"/><path d="${hat}" fill="#07090b"/>`;
  // 모자 가장자리 털: 역광에 빛나는 잔털
  fig += furStrokes(r, 520, (rr) => {
    const t = rr();
    const a = Math.PI + t * Math.PI;
    return [300 + Math.cos(a) * (152 + rr() * 6), 170 + Math.sin(a) * (116 + rr() * 6)];
  }, { len: [8, 18], w: [1, 2.2], colors: ['#07090b', '#1a2a38', '#3a5a78'], dir: [0, -1] });
  fig += furStrokes(r, 260, (rr) => [150 + rr() * 300, 90 + rr() * 170], { len: [8, 16], w: [1, 2], colors: ['#0a0e12', '#141c24'], dir: [0.1, 1] });
  // 모피 깃
  fig += furStrokes(r, 360, (rr) => { const x = 110 + rr() * 380; return [x, 470 + rr() * 50 + Math.abs(x - 300) * 0.25]; }, { len: [10, 22], w: [1.4, 3], colors: ['#07090b', '#141c24', '#24323e'], dir: [0, 1] });

  /* 보석빛이 닿는 가장자리 (아래에서 위로) */
  let lit = '';
  lit += glowLine([[240, 404], [256, 430], [276, 450], [300, 460], [324, 450], [344, 430], [360, 404]], 4, 0.85); // 턱선 아래
  lit += glowLine([[284, 440], [300, 448], [316, 440]], 3, 0.9); // 턱 끝
  lit += glowLine([[286, 390], [296, 396], [304, 396], [314, 390]], 3, 0.95); // 코 밑면
  lit += glowLine([[282, 412], [300, 418], [318, 412]], 2.4, 0.8); // 아랫입술
  lit += glowLine([[244, 330], [262, 336], [282, 332]], 2, 0.75) + glowLine([[318, 332], [338, 336], [356, 330]], 2, 0.75); // 아래 눈꺼풀
  lit += glowLine([[236, 360], [250, 388], [268, 398]], 2.2, 0.5) + glowLine([[364, 360], [350, 388], [332, 398]], 2.2, 0.5); // 광대 아래
  lit += `<circle cx="266" cy="326" r="2.2" fill="#dff0ff"/><circle cx="334" cy="326" r="2.2" fill="#dff0ff"/>`; // 눈빛
  // 얼굴 이목구비: 아래에서 올라오는 빛이 닿는 면만 밝게, 나머지는 굵은 붓선 그림자
  lit += stroke(r, [[232, 304], [250, 294], [272, 296], [290, 306]], { w: 9, color: '#020304', jit: 0.6 });
  lit += stroke(r, [[368, 304], [350, 294], [328, 296], [310, 306]], { w: 9, color: '#020304', jit: 0.6 });
  lit += glowLine([[240, 300], [262, 292], [286, 300]], 1.6, 0.35) + glowLine([[360, 300], [338, 292], [314, 300]], 1.6, 0.35);
  lit += glowLine([[296, 318], [294, 346], [288, 372], [284, 386]], 1.8, 0.55); // 콧등
  lit += glowLine([[304, 318], [308, 346], [314, 372], [318, 386]], 1.4, 0.35);
  lit += glowLine([[276, 392], [282, 386], [290, 390]], 2.2, 0.8) + glowLine([[310, 390], [318, 386], [324, 392]], 2.2, 0.8); // 콧방울
  // 콧수염 · 턱수염: 빛을 받은 털끝
  for (let i = 0; i < 46; i++) {
    const tt = r();
    const side = tt < 0.5 ? -1 : 1;
    const x = 300 + side * (6 + Math.abs(tt - 0.5) * 2 * 44);
    const y = 400 + Math.abs(tt - 0.5) * 14;
    lit += stroke(r, [[x, y], [x + side * (3 + r() * 5), y + 7 + r() * 9]], { w: 1.4, color: r() > 0.5 ? '#6a8ab8' : '#2a3448', op: 0.9, jit: 0.3 });
  }
  for (let i = 0; i < 70; i++) {
    const x = 262 + r() * 76;
    const y = 426 + r() * 30 - Math.abs(x - 300) * 0.25;
    lit += stroke(r, [[x, y], [x + (r() - 0.5) * 4, y + 6 + r() * 8]], { w: 1.3, color: r() > 0.55 ? '#7a9ac8' : '#1a2230', op: 0.85, jit: 0.3 });
  }
  lit += glowLine([[222, 280], [214, 320], [220, 360]], 1.6, 0.3) + glowLine([[378, 280], [386, 320], [380, 360]], 1.6, 0.3); // 얼굴 가장자리
  lit += `<path d="M150 262C208 284 392 284 450 262" stroke="#6aa0d8" stroke-width="3" fill="none" opacity=".55" filter="url(#b2)"/>`;
  lit += glowLine([[250, 474], [200, 484], [150, 506]], 2.4, 0.35) + glowLine([[350, 474], [400, 484], [450, 506]], 2.4, 0.35);

  /* 두 손: 아래에서 팔을 들어 올려, 엄지와 검지 끝으로 보석을 집는다 (나머지 손가락은 말아 쥔다) */
  const skinD = '#241a1c';
  const skinL = '#9fb4d8';
  const hand = (s) => {
    const X = (dx) => f(GX + s * dx);
    // 소매 · 팔뚝 (프레임 아래 모서리에서 비스듬히)
    let h = `<path d="M${X(-300)} 720L${X(-300)} 640C${X(-250)} 600 ${X(-190)} 560 ${X(-140)} 530L${X(-96)} 590C${X(-150)} 620 ${X(-200)} 670 ${X(-220)} 720Z" fill="#05070a"/>`;
    h += glowLine([[X(-140), 530], [X(-190), 560], [X(-250), 600]], 2.4, 0.35);
    // 손등 · 손바닥 덩어리
    h += `<path d="M${X(-146)} 534C${X(-130)} 506 ${X(-104)} 488 ${X(-78)} 484C${X(-60)} 482 ${X(-44)} 488 ${X(-36)} 498C${X(-44)} 520 ${X(-62)} 546 ${X(-86)} 566C${X(-104)} 580 ${X(-124)} 580 ${X(-138)} 566C${X(-148)} 556 ${X(-150)} 544 ${X(-146)} 534Z" fill="${skinD}"/>`;
    // 말아 쥔 가운뎃 · 약지 · 새끼손가락 (마디 셋)
    for (let k = 0; k < 3; k++) {
      const oy = k * 16;
      h += `<path d="M${X(-78 + k * 4)} ${522 + oy}C${X(-62 + k * 4)} ${512 + oy} ${X(-46 + k * 4)} ${516 + oy} ${X(-44 + k * 4)} ${528 + oy}C${X(-44 + k * 4)} ${538 + oy} ${X(-58 + k * 4)} ${542 + oy} ${X(-74 + k * 4)} ${538 + oy}Z" fill="${skinD}" stroke="#0a0608" stroke-width="1.4"/>`;
      h += glowLine([[X(-72 + k * 4), 520 + oy], [X(-56 + k * 4), 514 + oy], [X(-46 + k * 4), 522 + oy]], 2, 0.7, skinL);
    }
    // 검지: 위로 뻗어 보석 옆면에 닿는다 (두 마디가 살짝 굽음)
    h += `<path d="M${X(-80)} 492C${X(-70)} 474 ${X(-54)} 462 ${X(-38)} 460C${X(-30)} 460 ${X(-26)} 466 ${X(-28)} 472C${X(-36)} 476 ${X(-48)} 482 ${X(-58)} 494Z" fill="${skinD}" stroke="#0a0608" stroke-width="1.4"/>`;
    h += glowLine([[X(-78), 488], [X(-62), 470], [X(-44), 462], [X(-30), 462]], 2.8, 0.95, skinL);
    h += glowLine([[X(-58), 470], [X(-56), 476]], 1.4, 0.6, skinL);
    // 엄지: 아래쪽에서 보석 밑면을 받친다
    h += `<path d="M${X(-60)} 520C${X(-48)} 508 ${X(-36)} 498 ${X(-24)} 492C${X(-16)} 490 ${X(-14)} 498 ${X(-20)} 504C${X(-30)} 512 ${X(-42)} 524 ${X(-52)} 530Z" fill="${skinD}" stroke="#0a0608" stroke-width="1.4"/>`;
    h += glowLine([[X(-58), 516], [X(-40), 502], [X(-22), 492]], 3, 0.95, '#cfe4ff');
    h += `<ellipse cx="${X(-22)}" cy="494" rx="4" ry="3" fill="#dfeeff" opacity=".7"/>`; // 엄지 손톱
    h += `<ellipse cx="${X(-32)}" cy="463" rx="4" ry="2.6" fill="#dfeeff" opacity=".6"/>`; // 검지 손톱
    // 손등 빛 (보석을 향한 면)
    h += glowLine([[X(-138), 540], [X(-120), 512], [X(-96), 494], [X(-80), 488]], 3, 0.6, skinL);
    return h;
  };

  /* 금빛 장식 테두리 */
  const frame = `
    <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="6" fill="none" stroke="url(#goldG)" stroke-width="5"/>
    <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="4" fill="none" stroke="#c8a040" stroke-width="1.2" opacity=".7"/>
    ${[[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]].map(([x, y, sx, sy]) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="url(#goldG)" stroke-width="2.4" stroke-linecap="round">
      <path d="M0 60C0 24 24 0 60 0"/><path d="M8 40C14 22 22 14 40 8"/><path d="M40 8C54 10 58 22 48 28C40 32 34 24 40 20"/><path d="M8 40C10 54 22 58 28 48C32 40 24 34 20 40"/><circle cx="20" cy="20" r="5" fill="#c8a040"/></g>`).join('')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    ${rad('bg', [[0, '#2a5060'], [0.45, '#0e2430'], [1, '#03080c']], 0.5, 0.42, 0.75)}
    <radialGradient id="gemGlow" cx="${GX}" cy="${GY}" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#eaf7ff" stop-opacity="1"/><stop offset=".12" stop-color="#7ac4ff" stop-opacity=".8"/><stop offset=".45" stop-color="#2a60b8" stop-opacity=".28"/><stop offset="1" stop-color="#0a1a40" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo" cx="300" cy="230" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8ac8e0" stop-opacity=".35"/><stop offset="1" stop-color="#8ac8e0" stop-opacity="0"/></radialGradient>
    ${lin('goldG', [[0, '#f8e08a'], [0.5, '#b8862a'], [1, '#f4d070']], 0, 0, 1, 1)}
    ${rad('vig', [[0.5, '#000', 0], [1, '#000', 0.7]], 0.5, 0.5, 0.75)}
    <filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fog"><feGaussianBlur stdDeviation="4"/></filter>
    ${grain('grain')}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="300" cy="230" r="300" fill="url(#halo)"/>
  <g filter="url(#fog)" opacity=".85">${city}</g>
  <g opacity=".34" filter="url(#fog)">
    <path d="M40 720C46 590 80 520 118 500L160 500C198 520 230 590 236 720Z" fill="#5a7898"/>
    <path d="M80 400C66 322 94 250 138 246C182 250 210 322 196 400C184 360 172 332 138 328C104 332 92 360 80 400Z" fill="#7a98b8"/>
    <ellipse cx="138" cy="372" rx="40" ry="54" fill="#a8bcd8"/>
    <path d="M120 366q8 -4 14 0M146 366q8 -4 14 0M130 400q8 4 16 0" stroke="#3a5070" stroke-width="2.4" fill="none"/>
    ${Array.from({ length: 13 }, (_, i) => `<circle cx="${f(102 + i * 6)}" cy="${f(446 + Math.sin((i / 12) * Math.PI) * 14)}" r="2.8" fill="#eef4ff"/>`).join('')}
  </g>
  ${fig}
  <circle cx="${GX}" cy="${GY}" r="260" fill="url(#gemGlow)" style="mix-blend-mode:screen"/>
  <g filter="url(#bloom)">${lit}</g>
  ${Array.from({ length: 14 }, (_, i) => { const a = -Math.PI / 2 + (i - 6.5) * 0.22; return stroke(r, [[GX, GY], [GX + Math.cos(a) * 180, GY + Math.sin(a) * 180], [GX + Math.cos(a) * 360, GY + Math.sin(a) * 360]], { w: 8 + r() * 14, color: '#bfe0ff', op: 0.06, jit: 1, taper: 0.5 }); }).join('')}
  <g filter="url(#bloom)">${hand(1)}${hand(-1)}</g>
  <g transform="translate(${GX} ${GY})">${facetGem(0, 0, 24, 'blue')}</g>
  ${sparkle(GX + 16, GY - 18, 24)}${sparkle(GX - 20, GY + 6, 8)}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".1"/>
  ${frame}
</svg>`;
}

function logo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <circle cx="32" cy="32" r="30" fill="#0c181e" stroke="#c8a040" stroke-width="3"/>
    ${facetGem(32, 31, 17, 'blue')}
  </svg>`;
}

module.exports = { box, logo };
