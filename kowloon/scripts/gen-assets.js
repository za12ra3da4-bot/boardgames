'use strict';
// 구룡 살인사건 상자 그림 · 로고 만들기 (node kowloon/scripts/gen-assets.js)
// 구도: 붉은 연기 속 네온 창 · 몸을 숙여 내려다보는 코트 차림 형사 · 턱을 괸 여자 탐정 · 앞쪽에서 뻗어 오르는 손
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets');
fs.mkdirSync(OUT, { recursive: true });

let seed = 7;
const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const f = (n) => Math.round(n * 10) / 10;

/* 빗금 (펜 선) */
function hatch(x0, y0, x1, y1, gap, ang, color, op, w = 1) {
  let s = '';
  const a = (ang * Math.PI) / 180;
  const len = Math.hypot(x1 - x0, y1 - y0);
  for (let o = -len; o < len; o += gap * (0.8 + r() * 0.4)) {
    const cx = (x0 + x1) / 2 + Math.cos(a + Math.PI / 2) * o;
    const cy = (y0 + y1) / 2 + Math.sin(a + Math.PI / 2) * o;
    s += `<path d="M${f(cx - Math.cos(a) * len)} ${f(cy - Math.sin(a) * len)}L${f(cx + Math.cos(a) * len)} ${f(cy + Math.sin(a) * len)}" stroke="${color}" stroke-width="${w}" opacity="${op}"/>`;
  }
  return s;
}

function box() {
  const W = 600;
  const H = 600;
  // 네온 창 (왼쪽): 창살 + 번진 간판 글자
  let win = '<g clip-path="url(#winClip)"><rect x="0" y="80" width="220" height="330" fill="url(#winG)"/>';
  const signs = [['酒', 60, 190, '#ff3a5a'], ['家', 60, 270, '#ff3a5a'], ['藥', 150, 150, '#3af0e0'], ['行', 150, 230, '#3af0e0'], ['茶', 110, 350, '#ffcf5a']];
  for (const [ch, x, y, c] of signs) win += `<text x="${x}" y="${y}" font-family="'Song Myung', serif" font-size="62" fill="${c}" filter="url(#bloom)" opacity=".85" transform="skewY(-8)">${ch}</text>`;
  win += '<path d="M0 80H220M0 190H220M0 300H220M75 80V410M150 80V410" stroke="#1a0808" stroke-width="10"/>';
  win += '</g><path d="M-10 70L230 60L236 420L-10 426" fill="none" stroke="#2a0a0a" stroke-width="14"/>';
  // 천장 선풍기 (오른쪽 위)
  const fan = `<g transform="translate(470 60)" opacity=".9"><path d="M0 -60V-8" stroke="#1a0606" stroke-width="6"/><ellipse cx="0" cy="0" rx="18" ry="9" fill="#2a0a0a"/>
    <path d="M10 0 L130 -18 Q138 -6 128 4 Z M-10 0 L-126 20 Q-132 8 -122 -2 Z M4 6 L40 70 Q30 76 22 70 Z" fill="#1e0606"/></g>`;
  // 오른쪽 벽 · 문틀 · 조명
  const wall = `<path d="M430 120H600V600H430Z" fill="#3a0e0c" opacity=".7"/><path d="M450 170H560V520H450Z" fill="none" stroke="#1e0606" stroke-width="10"/>
    <rect x="470" y="190" width="70" height="80" fill="#e89a70" opacity=".35"/>`;
  // 코트 차림 형사 (왼쪽, 몸을 숙여 내려다본다)
  const man = `<g transform="translate(40 250)">
    <path d="M60 350 Q70 170 150 120 Q200 100 250 130 Q300 170 300 260 L290 350Z" fill="#3a2220"/>
    <path d="M150 120 Q190 150 196 230 L182 350 L120 350 Q128 230 150 120Z" fill="#241412"/>
    <path d="M196 132 L214 200 L200 230 L226 262 L210 350" stroke="#1a0c0a" stroke-width="5" fill="none"/>
    <path d="M168 128 Q196 150 214 136 L206 118 Q188 122 168 128Z" fill="#e8d8c0"/>
    <path d="M186 138 L196 150 L204 138 L200 196 L192 204 L184 196Z" fill="#5a1414"/>
    <path d="M150 124 Q126 70 150 40 Q176 16 214 30 Q244 44 240 82 Q236 110 214 124 Q190 134 150 124Z" fill="#c89070"/>
    <path d="M214 30 Q244 44 240 82 Q236 110 214 124 Q228 100 226 72 Q224 48 214 30Z" fill="#8a5a40"/>
    <path d="M140 60 Q134 20 170 8 Q206 -4 234 18 Q250 34 244 56 Q226 36 196 34 Q168 34 150 70Z" fill="#1e1210"/>
    <path d="M170 76 Q182 70 196 76M210 72 Q220 68 230 74" stroke="#2a1410" stroke-width="5" fill="none"/>
    <path d="M176 84 Q186 88 194 84M214 82 Q222 86 228 82" stroke="#1a0a08" stroke-width="3.4" fill="none"/>
    <path d="M200 88 L206 104 L198 106" stroke="#6a3a28" stroke-width="3" fill="none"/>
    <path d="M186 116 Q200 110 214 114" stroke="#5a2a1a" stroke-width="3" fill="none"/>
    ${hatch(150, 30, 240, 125, 6, 60, '#4a1a10', 0.35)}
    <path d="M250 180 Q300 220 330 300 Q340 330 318 336 Q296 300 256 262Z" fill="#2e1a18"/>
    <path d="M316 318 Q336 316 344 332 Q338 348 320 346Z" fill="#c89070"/>
  </g>`;
  // 여자 탐정 (오른쪽, 턱을 괴고 서 있다)
  const woman = `<g transform="translate(330 120)">
    <path d="M40 470 Q30 300 60 200 Q80 150 120 142 Q170 150 186 210 Q206 320 196 470Z" fill="#2a1418"/>
    <path d="M60 470 L70 330 Q110 350 150 330 L160 470Z" fill="#1a0a0e"/>
    <path d="M70 460 L64 600 L84 600 L96 460ZM130 460 L140 600 L160 600 L150 460Z" fill="#140608"/>
    <path d="M86 150 Q120 176 156 150 L160 196 Q120 214 82 196Z" fill="#3a1a20"/>
    <path d="M92 86 Q84 44 116 32 Q148 24 164 52 Q176 80 162 112 Q146 142 118 140 Q96 132 92 86Z" fill="#dcaa88"/>
    <path d="M162 52 Q176 80 162 112 Q150 136 130 140 Q152 116 156 88 Q158 66 162 52Z" fill="#a8765a"/>
    <path d="M84 110 Q70 50 104 22 Q140 0 172 26 Q190 44 184 90 Q176 60 150 50 Q120 44 104 64 Q96 86 100 130 Q90 124 84 110Z" fill="#1a0c0c"/>
    <path d="M112 84 Q120 80 128 84M142 80 Q150 76 158 80" stroke="#1a0808" stroke-width="3.4" fill="none"/>
    <path d="M134 94 L140 106 L134 108" stroke="#8a5040" stroke-width="2.6" fill="none"/>
    <path d="M124 120 Q134 124 144 118" stroke="#8a2030" stroke-width="3.6" fill="none"/>
    ${hatch(92, 30, 176, 140, 6, 55, '#5a1a10', 0.3)}
    <path d="M78 210 Q40 260 90 290 Q120 300 130 250 Q134 196 150 150 Q140 144 128 150 Q120 196 110 240 Q96 250 92 230Z" fill="#2a1418"/>
    <path d="M126 138 Q140 122 156 134 Q156 150 142 158 Q128 156 126 138Z" fill="#dcaa88"/>
  </g>`;
  // 앞쪽에서 뻗어 오르는 손 (피해자)
  const hand = `<g transform="translate(250 430)">
    <path d="M-60 180 Q-40 110 0 70 Q20 50 40 60 L60 170Z" fill="#1a0808"/>
    <path d="M-10 90 Q0 50 30 40 Q60 30 90 34 Q110 36 108 48 Q84 50 72 56 Q100 46 124 52 Q134 58 124 66 Q100 66 80 74 Q110 72 126 80 Q128 92 114 92 Q94 90 76 96 Q98 98 108 108 Q106 118 92 116 Q60 110 40 120 Q10 130 -10 90Z" fill="#6a3a30"/>
    <path d="M40 60 Q24 40 34 22 Q44 14 52 30 Q54 44 50 56Z" fill="#6a3a30"/>
    <path d="M60 56 Q84 54 100 50M70 76 Q92 74 110 78M72 96 Q88 98 98 106" stroke="#2a0c08" stroke-width="3" fill="none"/>
    ${hatch(-10, 40, 120, 130, 5, 30, '#1a0404', 0.4)}
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx=".55" cy=".45" r=".8"><stop offset="0" stop-color="#b83a2a"/><stop offset=".45" stop-color="#6a1a1a"/><stop offset="1" stop-color="#1a0606"/></radialGradient>
    <linearGradient id="winG" x2="0" y2="1"><stop offset="0" stop-color="#5a0a1a"/><stop offset="1" stop-color="#2a0610"/></linearGradient>
    <clipPath id="winClip"><path d="M-10 70L230 60L236 420L-10 426Z"/></clipPath>
    <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="smoke"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .9  0 0 0 0 .3  0 0 0 0 .25  0 0 0 .55 -.1"/></filter>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .12 0"/></filter>
    <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <linearGradient id="titleG" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#7ad8e8"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${win}${fan}${wall}
  <rect width="${W}" height="${H}" filter="url(#smoke)"/>
  ${woman}${man}${hand}
  <rect width="${W}" height="${H}" filter="url(#smoke)" opacity=".5"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <text x="300" y="88" text-anchor="middle" font-family="'Black Han Sans', sans-serif" font-size="80" fill="url(#titleG)" stroke="#0a2a30" stroke-width="2" filter="url(#bloom)" letter-spacing="10">구룡</text>
  <text x="300" y="128" text-anchor="middle" font-family="'Noto Serif KR', serif" font-weight="900" font-size="26" fill="#e8fbff" letter-spacing="18">살인사건</text>
  <rect width="${W}" height="${H}" filter="url(#paper)"/>
</svg>`;
}

function logo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><filter id="g"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <circle cx="32" cy="32" r="30" fill="#140810" stroke="#ff3a5a" stroke-width="3" filter="url(#g)"/>
  <circle cx="27" cy="27" r="13" fill="none" stroke="#3af0e0" stroke-width="4.4" filter="url(#g)"/>
  <path d="M36 36 L50 50" stroke="#3af0e0" stroke-width="6" stroke-linecap="round" filter="url(#g)"/>
  <path d="M22 24 q5 -5 10 0" stroke="#e8fbff" stroke-width="2" fill="none" opacity=".7"/>
  <circle cx="27" cy="27" r="3.4" fill="#ff3a5a"/>
</svg>`;
}

// 상자 그림은 scripts/box.js (box.png 로 굽는다: 3D 상자 안에서 SVG 필터가 까맣게 나오는 브라우저가 있어서)
fs.writeFileSync(path.join(OUT, 'box.svg'), require('./box').boxSvg());
fs.writeFileSync(path.join(OUT, 'logo.svg'), logo());
console.log('box.svg · logo.svg 만듦');
