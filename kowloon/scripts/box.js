'use strict';
// 구룡 살인사건 상자 앞면 (정사각형 1000×1000)
// 구도: 바닥에서 올려다본 시점 — 쭈그려 앉아 내려다보는 트렌치코트 형사, 턱을 괸 단발 여자 탐정,
//       앞쪽에서 올라오는 피해자의 손, 왼쪽 네온 창, 오른쪽 위 천장 선풍기, 붉은 연기.
// 실제 상자 그림을 베끼지 않고 이 구도만 따른다.

let seed = 11;
const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const f = (n) => Math.round(n * 10) / 10;

/** 펜 빗금: 안쪽을 비스듬한 선으로 채운다 (clip 필요) */
function hatch(clip, x0, y0, x1, y1, gap, ang, color, op, w = 1.1) {
  let s = `<g clip-path="url(#${clip})" stroke="${color}" stroke-width="${w}" opacity="${op}">`;
  const a = (ang * Math.PI) / 180;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  for (let o = -R; o < R; o += gap * (0.75 + r() * 0.5)) {
    const px = cx - Math.sin(a) * o;
    const py = cy + Math.cos(a) * o;
    s += `<path d="M${f(px - Math.cos(a) * R)} ${f(py - Math.sin(a) * R)}L${f(px + Math.cos(a) * R)} ${f(py + Math.sin(a) * R)}"/>`;
  }
  return `${s}</g>`;
}

function boxSvg() {
  const S = 1000;
  // ── 배경: 붉은 방, 창, 간판, 선풍기
  const neonWin = `
    <g clip-path="url(#win)">
      <rect x="0" y="120" width="360" height="560" fill="url(#winSky)"/>
      ${[['酒', 70, 300, '#ff3a5a', 110], ['家', 70, 430, '#ff3a5a', 110], ['藥', 220, 250, '#46f2e4', 96], ['房', 220, 370, '#46f2e4', 96], ['麻雀', 110, 600, '#ffcf5a', 72]]
      .map(([ch, x, y, c, s]) => `<text x="${x}" y="${y}" font-family="'Song Myung',serif" font-size="${s}" fill="${c}" filter="url(#bloom)" transform="skewY(-7) rotate(-3 ${x} ${y})" opacity=".92">${ch}</text>`).join('')}
      <rect x="0" y="120" width="360" height="560" fill="url(#winFog)"/>
      <path d="M0 290H360M0 470H360M120 120V680M240 120V680" stroke="#1a0406" stroke-width="16"/>
      <path d="M0 290H360M0 470H360M120 120V680M240 120V680" stroke="#4a1016" stroke-width="3" transform="translate(-4 -4)"/>
    </g>
    <path d="M-10 110L372 96L382 692L-10 700" fill="none" stroke="#1a0406" stroke-width="22"/>`;
  const fan = `<g transform="translate(790 90)" opacity=".92">
      <path d="M0 -100V-12" stroke="#140404" stroke-width="10"/><ellipse cx="0" cy="0" rx="30" ry="15" fill="#240808"/>
      <path d="M16 -2 L230 -34 Q246 -12 228 6 Z" fill="#1a0404"/><path d="M-16 2 L-222 38 Q-236 16 -218 -2 Z" fill="#1a0404"/><path d="M6 10 L70 118 Q52 128 38 118 Z" fill="#1a0404"/>
      <path d="M16 -2 L230 -34" stroke="#6a2020" stroke-width="2" opacity=".6"/></g>`;
  const backWall = `<path d="M720 170H1000V1000H720Z" fill="#4a0e0c" opacity=".55"/>
    <path d="M760 240H930V820H760Z" fill="none" stroke="#1e0404" stroke-width="16"/>
    <rect x="786" y="270" width="118" height="140" fill="#f0a878" opacity=".32"/>
    <path d="M786 270h118v140h-118Z M845 270v140 M786 340h118" fill="none" stroke="#1e0404" stroke-width="6"/>
    <path d="M540 0 L560 250 M600 0 L610 180" stroke="#140404" stroke-width="4"/>
    <ellipse cx="560" cy="262" rx="26" ry="12" fill="#ffd8a0" filter="url(#bloom)" opacity=".7"/>`;

  // ── 쭈그려 앉은 트렌치코트 형사 (왼쪽, 내려다본다)
  const man = `<g transform="translate(40 330)">
    <defs><clipPath id="coatC"><path d="M40 670 Q30 420 120 300 Q190 220 290 210 Q380 214 440 290 Q500 380 500 520 L490 670Z"/></clipPath>
      <clipPath id="faceM"><path d="M246 214 Q214 160 226 110 Q246 60 300 54 Q352 54 372 100 Q386 146 370 190 Q350 232 312 238 Q272 240 246 214Z"/></clipPath></defs>
    <!-- 코트 -->
    <path d="M40 670 Q30 420 120 300 Q190 220 290 210 Q380 214 440 290 Q500 380 500 520 L490 670Z" fill="url(#coatG)"/>
    ${hatch('coatC', 40, 210, 500, 670, 9, 58, '#1a0806', 0.35, 1.4)}
    <path d="M290 212 Q260 300 250 420 Q244 520 262 670" stroke="#140604" stroke-width="5" fill="none"/>
    <path d="M296 214 Q330 250 340 330 L322 350 L352 400 L334 670" stroke="#140604" stroke-width="5" fill="none"/>
    <path d="M120 300 Q170 340 180 420 Q182 500 160 560" stroke="#140604" stroke-width="4" fill="none" opacity=".7"/>
    <path d="M440 290 Q470 360 470 460" stroke="#46f2e4" stroke-width="3" fill="none" opacity=".75" filter="url(#bloom)"/>
    <!-- 셔츠 · 넥타이 -->
    <path d="M270 222 Q300 262 330 226 L336 250 Q300 290 264 252Z" fill="#e8dcc6"/>
    <path d="M292 250 L306 262 L318 250 L312 330 L302 342 L292 330Z" fill="#6a1216"/>
    <!-- 뻗은 팔 (피해자 쪽으로) -->
    <path d="M430 300 Q520 360 580 470 Q600 510 572 526 Q540 500 480 420 Q440 380 420 350Z" fill="url(#coatG)"/>
    <path d="M560 500 Q600 488 624 512 Q630 540 606 548 Q576 548 562 530Z" fill="#c88a68"/>
    <path d="M580 508 q14 -2 26 8 M578 522 q14 0 28 8" stroke="#6a3a28" stroke-width="3" fill="none"/>
    <!-- 목 · 얼굴 -->
    <path d="M270 238 Q300 262 338 236 L334 206 L276 206Z" fill="#9a6040"/>
    <path d="M246 214 Q214 160 226 110 Q246 60 300 54 Q352 54 372 100 Q386 146 370 190 Q350 232 312 238 Q272 240 246 214Z" fill="url(#skinM)"/>
    ${hatch('faceM', 220, 50, 380, 240, 6, 64, '#4a1a0e', 0.32, 1.1)}
    <path d="M356 96 Q384 146 368 196 Q352 226 322 236 Q350 196 356 150 Q358 118 356 96Z" fill="#6a3622" opacity=".8"/>
    <path d="M232 118 Q228 150 244 196" stroke="#46f2e4" stroke-width="3.4" fill="none" opacity=".85" filter="url(#bloom)"/>
    <!-- 머리칼 · 모자 챙 그림자 -->
    <path d="M218 128 Q204 60 256 34 Q316 8 364 44 Q392 70 382 118 Q364 86 330 82 Q290 80 262 108 Q246 128 244 160 Q226 150 218 128Z" fill="#160a08"/>
    <path d="M252 60 Q290 40 334 52" stroke="#4a2a20" stroke-width="3" fill="none" opacity=".7"/>
    <!-- 이목구비 (내려다보는 눈) -->
    <path d="M262 140 Q280 130 300 140 M318 138 Q336 128 354 138" stroke="#1a0806" stroke-width="6" fill="none"/>
    <path d="M268 152 Q282 158 296 152 M322 150 Q336 156 350 150" stroke="#140604" stroke-width="4" fill="none"/>
    <circle cx="283" cy="154" r="3.4" fill="#0a0404"/><circle cx="336" cy="152" r="3.4" fill="#0a0404"/>
    <path d="M308 150 L316 186 L304 190" stroke="#5a2a18" stroke-width="3.4" fill="none"/>
    <path d="M286 206 Q308 198 330 204" stroke="#4a1a10" stroke-width="4" fill="none"/>
    <path d="M280 196 Q300 208 336 196" stroke="#2a0e08" stroke-width="2" fill="none" opacity=".6"/>
  </g>`;

  // ── 턱을 괸 단발 여자 탐정 (오른쪽, 서 있다)
  const woman = `<g transform="translate(560 150)">
    <defs><clipPath id="coatW"><path d="M60 850 Q46 520 90 360 Q120 280 196 262 Q280 270 312 360 Q348 520 336 850Z"/></clipPath>
      <clipPath id="faceW"><path d="M150 150 Q140 84 186 62 Q236 46 262 88 Q280 128 266 184 Q250 230 210 240 Q170 236 150 150Z"/></clipPath></defs>
    <path d="M60 850 Q46 520 90 360 Q120 280 196 262 Q280 270 312 360 Q348 520 336 850Z" fill="url(#coatW2)"/>
    ${hatch('coatW', 46, 262, 348, 850, 9, 62, '#1a0608', 0.32, 1.3)}
    <path d="M196 262 Q180 420 190 600 Q196 740 186 850" stroke="#12040a" stroke-width="5" fill="none"/>
    <path d="M110 300 Q170 330 196 262 Q230 330 300 312" stroke="#12040a" stroke-width="4" fill="none"/>
    <path d="M88 380 Q70 560 76 850" stroke="#ff3a5a" stroke-width="3" fill="none" opacity=".6" filter="url(#bloom)"/>
    <path d="M318 360 Q340 520 334 850" stroke="#46f2e4" stroke-width="3" fill="none" opacity=".7" filter="url(#bloom)"/>
    <!-- 안쪽 옷 · 목 -->
    <path d="M160 262 Q200 300 244 262 L244 330 Q200 356 160 330Z" fill="#2a0a10"/>
    <path d="M176 238 Q202 256 232 236 L230 270 Q204 284 178 270Z" fill="#b87a5a"/>
    <!-- 팔짱 + 턱 괸 손 -->
    <path d="M100 420 Q86 480 150 500 Q230 510 282 470 Q300 440 270 430 Q220 460 170 452 Q130 440 128 410Z" fill="url(#coatW2)"/>
    <path d="M250 440 Q300 380 262 300 Q250 272 234 262 Q226 290 244 322 Q262 380 232 432Z" fill="url(#coatW2)"/>
    <path d="M226 232 Q244 212 264 226 Q270 250 252 262 Q232 266 226 250Z" fill="#c88a68"/>
    <path d="M236 234 q10 -6 20 0" stroke="#6a3a28" stroke-width="2.4" fill="none"/>
    <!-- 얼굴 -->
    <path d="M150 150 Q140 84 186 62 Q236 46 262 88 Q280 128 266 184 Q250 230 210 240 Q170 236 150 150Z" fill="url(#skinW)"/>
    ${hatch('faceW', 140, 50, 280, 244, 6, 58, '#4a1a10', 0.26, 1)}
    <path d="M258 90 Q282 132 266 188 Q252 226 222 238 Q250 196 256 150 Q260 116 258 90Z" fill="#6a3622" opacity=".75"/>
    <!-- 단발머리 -->
    <path d="M130 200 Q110 90 170 44 Q226 14 276 52 Q306 84 296 160 Q294 210 280 236 Q276 180 262 130 Q246 92 214 88 Q196 120 164 132 Q150 170 158 226 Q140 222 130 200Z" fill="#12080a"/>
    <path d="M160 70 Q210 40 258 60" stroke="#46f2e4" stroke-width="2.4" fill="none" opacity=".7" filter="url(#bloom)"/>
    <!-- 이목구비 -->
    <path d="M172 146 Q188 138 204 146 M222 144 Q238 136 252 144" stroke="#1a0806" stroke-width="4.4" fill="none"/>
    <path d="M176 156 Q190 162 202 156 M224 154 Q238 160 250 154" stroke="#140604" stroke-width="3.4" fill="none"/>
    <circle cx="189" cy="158" r="3" fill="#0a0404"/><circle cx="237" cy="156" r="3" fill="#0a0404"/>
    <path d="M214 160 L220 188 L210 192" stroke="#6a3020" stroke-width="3" fill="none"/>
    <path d="M196 212 Q212 206 230 210" stroke="#9a1a28" stroke-width="5" fill="none"/>
  </g>`;

  // ── 앞쪽에서 올라오는 피해자의 손
  const hand = `<g transform="translate(250 850) scale(1.2)">
    <defs><clipPath id="handC"><path d="M-10 170 Q10 110 60 84 Q96 66 140 62 Q170 60 172 76 Q140 80 124 88 Q164 76 196 82 Q210 92 196 104 Q164 104 140 112 Q182 110 204 124 Q206 140 186 140 Q156 136 132 144 Q164 150 176 164 Q172 178 152 176 Q110 168 80 184 Q30 210 -10 170Z"/></clipPath></defs>
    <path d="M-120 320 Q-80 200 -10 150 Q30 120 70 140 L110 320Z" fill="#120404"/>
    <path d="M-10 170 Q10 110 60 84 Q96 66 140 62 Q170 60 172 76 Q140 80 124 88 Q164 76 196 82 Q210 92 196 104 Q164 104 140 112 Q182 110 204 124 Q206 140 186 140 Q156 136 132 144 Q164 150 176 164 Q172 178 152 176 Q110 168 80 184 Q30 210 -10 170Z" fill="url(#skinH)"/>
    ${hatch('handC', -10, 60, 210, 210, 5, 30, '#1a0404', 0.4, 1)}
    <path d="M70 90 Q48 54 64 26 Q80 12 92 36 Q96 60 90 84Z" fill="url(#skinH)"/>
    <path d="M96 84 Q130 80 160 74 M110 106 Q150 104 184 110 M112 132 Q140 136 164 150" stroke="#2a0a08" stroke-width="3.4" fill="none"/>
    <path d="M140 62 Q166 58 172 74" stroke="#ff8a8a" stroke-width="2" fill="none" opacity=".7"/>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <radialGradient id="room" cx=".56" cy=".42" r=".85"><stop offset="0" stop-color="#d0483a"/><stop offset=".35" stop-color="#8a1e1e"/><stop offset=".75" stop-color="#3a0a0a"/><stop offset="1" stop-color="#140404"/></radialGradient>
    <linearGradient id="winSky" x2="0" y2="1"><stop offset="0" stop-color="#6a0a1c"/><stop offset="1" stop-color="#2a0412"/></linearGradient>
    <linearGradient id="winFog" x2="0" y2="1"><stop offset="0" stop-color="#ff6a7a" stop-opacity=".12"/><stop offset="1" stop-color="#ff6a7a" stop-opacity="0"/></linearGradient>
    <clipPath id="win"><path d="M-10 110L372 96L382 692L-10 700Z"/></clipPath>
    <linearGradient id="coatG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3228"/><stop offset=".5" stop-color="#3a1e18"/><stop offset="1" stop-color="#1e0c0a"/></linearGradient>
    <linearGradient id="coatW2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a1a22"/><stop offset=".55" stop-color="#2a0c14"/><stop offset="1" stop-color="#14040a"/></linearGradient>
    <linearGradient id="skinM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8b08a"/><stop offset=".6" stop-color="#b87050"/><stop offset="1" stop-color="#7a3e28"/></linearGradient>
    <linearGradient id="skinW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4c4a0"/><stop offset=".6" stop-color="#c8845e"/><stop offset="1" stop-color="#8a4a30"/></linearGradient>
    <linearGradient id="skinH" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4a1a14"/><stop offset=".6" stop-color="#8a4a3a"/><stop offset="1" stop-color="#b87060"/></linearGradient>
    <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="smoke" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .014" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .7 -.22"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .16 0"/></filter>
    <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
    <radialGradient id="spot" cx=".5" cy=".92" r=".45"><stop offset="0" stop-color="#ffd0a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd0a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="title" x2="0" y2="1"><stop offset="0" stop-color="#f4feff"/><stop offset=".55" stop-color="#9ae8f4"/><stop offset="1" stop-color="#3ab0c8"/></linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#room)"/>
  ${neonWin}${backWall}${fan}
  <rect width="${S}" height="${S}" filter="url(#smoke)"/>
  ${woman}${man}
  <rect width="${S}" height="${S}" fill="url(#spot)"/>
  ${hand}
  <rect width="${S}" height="${S}" filter="url(#smoke)" opacity=".45"/>
  <rect width="${S}" height="${S}" fill="url(#vig)"/>
  <!-- 제목 -->
  <g filter="url(#bloom)"><text x="500" y="150" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="150" fill="url(#title)" stroke="#06343c" stroke-width="3" letter-spacing="26">구룡</text></g>
  <text x="500" y="216" text-anchor="middle" font-family="'Noto Serif KR',serif" font-weight="900" font-size="40" fill="#f4feff" letter-spacing="30">살 인 사 건</text>
  <text x="500" y="252" text-anchor="middle" font-family="'Special Elite',monospace" font-size="20" fill="#9ae8f4" letter-spacing="8" opacity=".85">DECEPTION IN KOWLOON</text>
  <!-- 상 받은 딱지 · 회사 표시 -->
  <g transform="translate(96 910)"><circle r="62" fill="#0e2a30" stroke="#46f2e4" stroke-width="4"/><text y="-4" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="30" fill="#e8fbff">3~12</text><text y="26" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="18" fill="#9ae8f4">명 · 20분</text></g>
  <g transform="translate(900 920)"><rect x="-70" y="-30" width="140" height="60" rx="8" fill="#f4ecd8"/><text y="8" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="24" fill="#8a1a22">보드게임 밤</text></g>
  <rect width="${S}" height="${S}" filter="url(#grain)"/>
</svg>`;
}

module.exports = { boxSvg };
