// 밤의 저택 결말 영상 (퍼펫 엔진)
// 사건 해결: 폭풍우 치는 저택 → 응접실에 모인 용의자들 · 탐정의 지목 → 봉투가 열리고 세 장이 나온다
//           → 그날 밤의 회상(그 방, 그 흉기) → 경관이 수갑을 채우고 범인의 자백 → 사건 종결
// 미제 사건: 저택 → 말없이 선 용의자들 · 어깨를 으쓱하는 탐정 → 봉인된 봉투를 장갑 낀 손이 가져간다 → 빗속으로 사라지는 범인
import { POSE, gait, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, rain, say, cast, score, CINE_CSS } from '/anim/cine.js';
import { svg, playFilm } from '/anim/director.js';
import { cardSvg } from '/clue/js/cards.js';

const C = () => window.CLUE;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ═════════ 용의자 여섯 (퍼펫 옷차림) ═════════ */
const LOOK = {
  han: { skin: '#f4c8a8', skinD: '#c08868', hair: '#140c0c', coat: '#b81a2a', coatD: '#6a0a14', coat2: '#f4ecd8', shirt: '#f4ecd8', tie: null, pants: '#b81a2a', pantsD: '#6a0a14', shoe: '#1a0a0a', hat: 'none', hairStyle: 'bob', brow: '#140c0c', lips: '#a8202c' },
  kang: { skin: '#d8a078', skinD: '#9a6444', hair: '#d8d4cc', coat: '#6a6a3a', coatD: '#3a3a1a', coat2: '#e0b030', shirt: '#c8c0a0', tie: '#3a3a1a', pants: '#5a5a30', pantsD: '#34341a', shoe: '#1a120a', hat: 'police', hatC: '#5a5a2a', hairStyle: 'short', brow: '#d8d4cc' },
  baek: { skin: '#e8c0a0', skinD: '#a8806a', hair: '#e8e4dc', coat: '#1a1a20', coatD: '#0a0a0e', coat2: '#2a2a30', shirt: '#f4f4f0', tie: '#0a0a0e', pants: '#1a1a20', pantsD: '#0a0a0e', shoe: '#0a0a0a', hat: 'none', hairStyle: 'slick', brow: '#c8c4bc' },
  oh: { skin: '#e8b894', skinD: '#a8765a', hair: '#6a3a1a', coat: '#3a6a3a', coatD: '#1a3a1a', coat2: '#8a6a3a', shirt: '#e8e0c8', tie: '#8a1a1e', pants: '#4a4030', pantsD: '#2a2418', shoe: '#2a1a10', hat: 'none', hairStyle: 'short', brow: '#4a2a10' },
  yoon: { skin: '#e8b894', skinD: '#a8765a', hair: '#141418', coat: '#1a2a5a', coatD: '#0a1430', coat2: '#e8c050', shirt: '#e8ecf4', tie: '#1a2a5a', pants: '#1a2440', pantsD: '#0a1020', shoe: '#0a0a0e', hat: 'none', hairStyle: 'slick', brow: '#141418' },
  seo: { skin: '#e0b494', skinD: '#a07458', hair: '#1a1210', coat: '#5a2a8a', coatD: '#2a0e4a', coat2: '#e8c030', shirt: '#e8dcc0', tie: '#e8c030', pants: '#2a1a3a', pantsD: '#140a1e', shoe: '#1a0a0a', hat: 'none', hairStyle: 'bob', brow: '#1a1210' },
};
// 피해자 도회장: 흰 머리 · 갈색 트위드 재킷
const VICTIM = { skin: '#e8c0a0', skinD: '#a8806a', hair: '#f0ece4', coat: '#6a5a40', coatD: '#3a3020', coat2: '#c8a060', shirt: '#f4ecd8', tie: '#c8a060', pants: '#2a2020', pantsD: '#140e0e', shoe: '#1a0a0a', hat: 'none', hairStyle: 'short', brow: '#e0dcd4' };
// 자백 한 줄 (각자의 사연에서)
const CONFESS = {
  han: '빚만 아니었어도… 그 사람만 없었어도…',
  kang: '전우라고 믿었는데… 날 배신한 건 그쪽이었소.',
  baek: '30년을 모셨습니다. 유언장 한 장에 버려질 순 없었죠.',
  oh: '연구를 끊겠다고 했어요. 내 온실을, 내 평생을!',
  yoon: '상속 순위 두 번째… 첫 번째만 사라지면 됐지.',
  seo: '위작이라 모욕한 그 입… 다시는 열지 못하게 했을 뿐.',
};
const ROOM_KO = (id) => C().ROOM[id].name;
// 받침이 있으면 '을', 없으면 '를'
const josa = (w) => { const code = w.charCodeAt(w.length - 1) - 0xac00; return code >= 0 && code % 28 ? '을' : '를'; };

/* ═════════ 배경 ═════════ */
function mansion() {
  // 창문: 창살 · 커튼 그림자 · 불빛 번짐
  const win = (x, y, lit, w = 34, h = 54) => `<g>${lit ? `<rect x="${x - 26}" y="${y - 22}" width="${w + 52}" height="${h + 44}" fill="url(#wglow)"/>` : ''}
    <path d="M${x} ${y + h} V${y + 10} Q${x + w / 2} ${y - 8} ${x + w} ${y + 10} V${y + h}Z" fill="${lit ? 'url(#wlit)' : '#141828'}" stroke="#05060a" stroke-width="4"/>
    <path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * 0.5} H${x + w}" stroke="#2a1a10" stroke-width="3"/>
    ${lit ? `<path d="M${x + 3} ${y + 8} Q${x + 10} ${y + h * 0.6} ${x + 5} ${y + h - 2} H${x + 3}Z M${x + w - 3} ${y + 8} Q${x + w - 10} ${y + h * 0.6} ${x + w - 5} ${y + h - 2} H${x + w - 3}Z" fill="#8a2a1a" opacity=".7"/>` : ''}
    <rect x="${x - 5}" y="${y + h}" width="${w + 10}" height="6" fill="#2a2e3e" stroke="#05060a" stroke-width="2"/></g>`;
  let wins = '';
  const lit = (i, j) => (i * 5 + j * 3) % 4 !== 1;
  [[500, 430], [500, 525]].forEach(([x0, y], j) => { for (let i = 0; i < 8; i++) if (j === 0 || (i !== 3 && i !== 4)) wins += win(x0 + i * 78, y, lit(i, j)); });
  wins += win(730, 322, true, 40, 62) + win(810, 322, false, 40, 62) + win(560, 360, lit(9, 1)) + win(1010, 360, true);
  wins += `<circle cx="800" cy="262" r="24" fill="url(#wlit)" stroke="#05060a" stroke-width="5"/><path d="M800 238 V286 M776 262 H824" stroke="#2a1a10" stroke-width="3"/>`;
  // 슬레이트 지붕 결
  let slate = '';
  for (let i = 0; i < 9; i++) slate += `<path d="M${640 + i * 10} ${320 - i * 13} H${960 - i * 10}" stroke="#1e2232" stroke-width="2"/>`;
  // 철창 담장
  let fence = '';
  for (let x = -10; x < 1620; x += 26) fence += `<path d="M${x} 880 V${770 + (x % 52 ? 8 : 0)} l-5 10 M${x} ${770 + (x % 52 ? 8 : 0)} l5 10" stroke="#05060a" stroke-width="5" fill="none"/>`;
  // 나뭇가지
  const tree = (x, y, s, f) => `<g transform="translate(${x} ${y}) scale(${f ? -s : s} ${s})" fill="none" stroke="#05060a" stroke-linecap="round">
    <path d="M0 0 C6 -80 -10 -160 10 -240 C20 -280 50 -300 80 -330" stroke-width="22"/><path d="M4 -150 C-30 -190 -70 -200 -110 -250 M-40 -185 C-50 -220 -40 -250 -60 -280 M10 -240 C-10 -280 -20 -310 -10 -350 M60 -310 C90 -320 120 -350 130 -380 M80 -330 C100 -370 90 -400 110 -430" stroke-width="9"/>
    <path d="M-110 -250 l-30 -10 M-110 -250 l-10 -30 M-60 -280 l-20 -20 M-10 -350 l-20 -20 M-10 -350 l14 -24 M130 -380 l24 -10 M110 -430 l-6 -24" stroke-width="4"/></g>`;
  return `<defs>
    <linearGradient id="nsky" x2="0" y2="1"><stop offset="0" stop-color="#04050c"/><stop offset=".55" stop-color="#121830"/><stop offset="1" stop-color="#262c48"/></linearGradient>
    <radialGradient id="wglow"><stop offset="0" stop-color="#ffc05a" stop-opacity=".55"/><stop offset="1" stop-color="#ffc05a" stop-opacity="0"/></radialGradient>
    <linearGradient id="wlit" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset="1" stop-color="#f0a040"/></linearGradient>
    <radialGradient id="moon"><stop offset="0" stop-color="#f4f0e0"/><stop offset=".5" stop-color="#c8c8d8" stop-opacity=".4"/><stop offset="1" stop-color="#c8c8d8" stop-opacity="0"/></radialGradient>
    <linearGradient id="stone" x2="0" y2="1"><stop offset="0" stop-color="#262a3a"/><stop offset="1" stop-color="#12141e"/></linearGradient>
    <linearGradient id="roof" x2="0" y2="1"><stop offset="0" stop-color="#2a2e44"/><stop offset="1" stop-color="#101220"/></linearGradient>
    <pattern id="brick" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 20 H40 M0 10 H40 M20 0 V10 M0 10 V20 M40 10 V20" stroke="#0a0c14" stroke-width="1.4" opacity=".6"/></pattern>
    <radialGradient id="lamp"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
    <filter id="cl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .012" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .14  0 0 0 0 .15  0 0 0 0 .22  0 0 0 1.4 -.5"/></filter>
    <filter id="smk" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#nsky)"/>
  <circle cx="1240" cy="170" r="200" fill="url(#moon)"/><circle cx="1240" cy="170" r="56" fill="#e8e4d4"/><circle cx="1222" cy="158" r="10" fill="#c8c4b4" opacity=".6"/><circle cx="1256" cy="186" r="7" fill="#c8c4b4" opacity=".5"/>
  <rect width="1600" height="560" filter="url(#cl)"/>
  <path class="cl-bolt" d="M300 0 L340 120 L300 130 L360 280 L330 290 L400 430 M340 120 L390 170 M360 280 L420 300" stroke="#f4f8ff" stroke-width="6" fill="none" opacity="0"/>
  <path d="M0 700 Q400 600 800 632 T1600 690 V900 H0Z" fill="#0a0c16"/>
  <!-- 저택 -->
  <g stroke="#05060a" stroke-width="5" stroke-linejoin="round">
    <path d="M620 150 h26 v80 h-26Z M954 190 h24 v70 h-24Z" fill="url(#stone)"/>
    <g opacity=".5" filter="url(#smk)"><ellipse cx="640" cy="120" rx="30" ry="18" fill="#3a3e50"/><ellipse cx="620" cy="80" rx="40" ry="22" fill="#2e3244"/></g>
    <path d="M480 640 V400 H1120 V640Z" fill="url(#stone)"/><path d="M480 640 V400 H1120 V640Z" fill="url(#brick)"/>
    <path d="M460 404 L560 322 L660 404Z M940 404 L1040 322 L1140 404Z" fill="url(#roof)"/>
    <path d="M620 404 V300 L800 190 L980 300 V404Z" fill="url(#stone)"/><path d="M620 404 V300 L800 190 L980 300 V404Z" fill="url(#brick)"/>
    <path d="M600 306 L800 178 L1000 306" fill="none" stroke="#1a1e2e" stroke-width="16"/>
    <path d="M420 640 V430 L470 370 L520 430 V640Z M1080 640 V430 L1130 370 L1180 430 V640Z" fill="url(#stone)"/>
    <path d="M410 434 L470 360 L530 434Z M1070 434 L1130 360 L1190 434Z" fill="url(#roof)"/>
    <path d="M470 360 V330 M1130 360 V330 M800 178 V140" stroke-width="4"/><path d="M800 140 l-12 14 M800 140 l12 14" stroke-width="3"/>
  </g>
  ${slate}${wins}
  <path d="M752 640 V574 Q800 530 848 574 V640Z" fill="url(#wlit)" stroke="#05060a" stroke-width="6"/><path d="M800 548 V640" stroke="#6a3a1a" stroke-width="4"/>
  <path d="M700 640 H900 L930 668 H670Z" fill="#1a1c28" stroke="#05060a" stroke-width="4"/><ellipse cx="800" cy="680" rx="200" ry="40" fill="url(#wglow)"/>
  <!-- 앞마당 · 나무 · 가로등 · 담장 -->
  <path d="M0 780 Q300 720 520 760 T1000 742 T1600 780 V900 H0Z" fill="#05060a"/>
  ${tree(160, 800, 1.2, false)}${tree(1470, 810, 1.1, true)}
  <g transform="translate(1250 780)"><path d="M0 0 V-190" stroke="#05060a" stroke-width="10"/><path d="M-18 -190 H18 L12 -222 H-12Z" fill="#ffd890" stroke="#05060a" stroke-width="5"/><circle cx="0" cy="-206" r="110" fill="url(#lamp)" opacity=".5"/></g>
  ${fence}<path d="M-10 790 H1620 M-10 846 H1620" stroke="#05060a" stroke-width="6"/>
  <path d="M500 900 Q800 850 1100 900Z" fill="#1a2030" opacity=".6"/>`;
}
function parlor() {
  let dam = '';
  for (let y = 0; y < 5; y++) for (let x = 0; x < 14; x++) dam += `<path transform="translate(${60 + x * 110 + (y % 2) * 55} ${80 + y * 90})" d="M0 -26 C14 -10 14 10 0 26 C-14 10 -14 -10 0 -26Z" fill="#c8a860" opacity=".08"/>`;
  let floor = '';
  for (let i = 0; i < 22; i++) floor += `<path d="M${-400 + i * 110} 900 L${420 + i * 34} 620" stroke="#1a0e08" stroke-width="3" opacity=".6"/>`;
  const win = (x) => `<g><rect x="${x}" y="120" width="170" height="330" fill="#10182c" class="cl-pane"/><path d="M${x + 85} 120 V450 M${x} 285 H${x + 170}" stroke="#2a1a10" stroke-width="10"/>
    <rect x="${x}" y="120" width="170" height="330" fill="none" stroke="#3a2414" stroke-width="16"/><path d="M${x - 30} 100 H${x + 200} V470 H${x + 150} C${x + 120} 380 ${x + 110} 200 ${x + 120} 100 M${x - 30} 100 V470 H${x + 20} C${x + 50} 380 ${x + 60} 200 ${x + 50} 100" fill="#5a0e1a"/></g>`;
  return `<defs>
    <linearGradient id="pw" x2="0" y2="1"><stop offset="0" stop-color="#0e1e16"/><stop offset="1" stop-color="#1e3a2a"/></linearGradient>
    <linearGradient id="pf" x2="0" y2="1"><stop offset="0" stop-color="#3a2212"/><stop offset="1" stop-color="#1a0e06"/></linearGradient>
    <radialGradient id="fire" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".4" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="fglow" cx=".5" cy=".7" r=".5"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
    <radialGradient id="chan"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1600" height="620" fill="url(#pw)"/>${dam}
  <rect y="470" width="1600" height="150" fill="#2a1a0e"/><path d="M0 470 H1600" stroke="#c8a060" stroke-width="4" opacity=".6"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${40 + i * 200}" y="495" width="160" height="100" fill="none" stroke="#1a0e06" stroke-width="4"/>`).join('')}
  ${win(160)}${win(1270)}
  <!-- 벽난로와 초상화 -->
  <rect x="600" y="120" width="400" height="240" fill="#1a0e06" stroke="#c8a060" stroke-width="10"/>
  <rect x="624" y="144" width="352" height="192" fill="#3a2a1a"/>
  <g transform="translate(800 250)"><ellipse rx="70" ry="80" fill="#6a4a30"/><circle cy="-30" r="44" fill="#c8a080"/><path d="M-44 -40 Q0 -90 44 -40 Q30 -70 0 -72 Q-30 -70 -44 -40Z" fill="#d8d4cc"/><path d="M-80 90 Q0 30 80 90" fill="#1a1a20"/><path d="M-10 -10 Q0 0 10 -10" stroke="#5a3a2a" stroke-width="3" fill="none"/></g>
  <text x="800" y="352" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="18" fill="#c8a060">故 도회장</text>
  <path d="M560 380 H1040 V420 H560Z" fill="#6a5a4a" stroke="#1a0e06" stroke-width="4"/>
  <path d="M600 420 H1000 V620 H600Z" fill="#4a3a2a" stroke="#1a0e06" stroke-width="4"/><path d="M660 460 H940 V620 H660Z" fill="#0a0604"/>
  <ellipse class="cl-fire" cx="800" cy="600" rx="110" ry="100" fill="url(#fire)"/><ellipse cx="800" cy="560" rx="360" ry="260" fill="url(#fglow)"/>
  <!-- 샹들리에 -->
  <path d="M800 0 V60" stroke="#c8a060" stroke-width="4"/><ellipse cx="800" cy="80" rx="120" ry="24" fill="none" stroke="#c8a060" stroke-width="6"/>
  ${[-100, -50, 0, 50, 100].map((x) => `<rect x="${795 + x}" y="54" width="10" height="24" fill="#f4ecd8"/><circle cx="${800 + x}" cy="50" r="6" fill="#ffcf5a"/>`).join('')}<ellipse cx="800" cy="70" rx="260" ry="120" fill="url(#chan)"/>
  <rect y="620" width="1600" height="280" fill="url(#pf)"/>${floor}
  <ellipse cx="800" cy="790" rx="620" ry="100" fill="#5a0e1a" stroke="#c8a060" stroke-width="5"/><ellipse cx="800" cy="790" rx="560" ry="80" fill="none" stroke="#c8a060" stroke-width="2" opacity=".6"/>`;
}
/** 회상용 그 방: 카드 그림을 벽처럼 크게 깔고 안락의자를 둔다 */
function memoryRoom(room) {
  return `<image href="/clue/assets/room/${room}.svg" x="0" y="-350" width="1600" height="1600" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1600" height="900" fill="#000" opacity=".35"/>`;
}
const armchair = `<g transform="translate(1020 860)"><path d="M-110 0 V-150 Q-110 -230 -20 -236 Q70 -230 70 -150 V0Z" fill="#6a1a22" stroke="#1a0606" stroke-width="6"/>
  <path d="M-140 0 V-90 Q-140 -110 -110 -110 H100 Q126 -110 126 -90 V0Z" fill="#8a2230" stroke="#1a0606" stroke-width="6"/><path d="M-130 0 v26 M116 0 v26" stroke="#1a0606" stroke-width="10"/></g>`;

const STYLE = `<style>
.cl-memory { filter: saturate(.62) contrast(1.06) brightness(.95); }
.cl-memory::after { content:''; position:absolute; inset:0; background: radial-gradient(120% 90% at 50% 50%, rgba(60,90,160,.18), rgba(10,20,50,.55)); mix-blend-mode: multiply; pointer-events:none; z-index:10; }
.cl-lightning { position:absolute; inset:0; background:#eef4ff; opacity:0; pointer-events:none; z-index:20; mix-blend-mode:screen; }
.cl-silh .pp { filter: brightness(0) !important; }
.cl-fire { animation: clf .18s infinite alternate; transform-origin: 800px 620px; }
@keyframes clf { to { transform: scale(1.06, .94); opacity:.85; } }
.cl-desk { position:absolute; inset:0; background: radial-gradient(60% 55% at 50% 45%, #5a3a22, #1a0e06 80%); }
.cl-desk::before { content:''; position:absolute; inset:0; background: repeating-linear-gradient(8deg, rgba(0,0,0,.18) 0 3px, transparent 3px 22px); }
.cl-lamp { position:absolute; left:50%; top:40%; width:1200px; height:900px; margin:-450px 0 0 -600px; background: radial-gradient(closest-side, rgba(255,220,150,.28), transparent); pointer-events:none; }
.cl-env { position:absolute; left:50%; top:58%; width:min(62vw,720px); aspect-ratio: 1.55; transform: translate(-50%,-50%); perspective: 1400px; }
.cl-env .body { position:absolute; inset:0; background: linear-gradient(160deg, #e8d4a8, #c8ac78); border-radius:6px; box-shadow: 0 30px 60px rgba(0,0,0,.7); }
.cl-env .body::after { content:'사건 파일 · 극비'; position:absolute; left:6%; bottom:9%; font: 800 clamp(14px,2.2vw,26px) 'Nanum Myeongjo',serif; color:#6a1a1a; letter-spacing:.2em; opacity:.8; }
.cl-env .front { position:absolute; inset:0; clip-path: polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%); background: linear-gradient(170deg, #efdcb4, #d0b482); border-radius:6px; z-index:3; }
.cl-env .front::after { content:'사건 파일 · 극비'; position:absolute; left:6%; bottom:9%; font: 800 clamp(14px,2.2vw,26px) 'Nanum Myeongjo',serif; color:#7a1a1a; letter-spacing:.2em; }
.cl-env .flap { position:absolute; left:0; right:0; top:0; height:58%; clip-path: polygon(0 0, 100% 0, 50% 100%); background: linear-gradient(180deg, #dcc494, #bca070); transform-origin: 50% 0; z-index:4; backface-visibility:hidden; }
.cl-env .seal { position:absolute; left:50%; top:52%; width:17%; aspect-ratio:1; transform: translate(-50%,-50%); z-index:5; }
.cl-env .seal i { position:absolute; inset:0; background: radial-gradient(circle at 40% 35%, #d8303a, #7a0a10 70%); border-radius: 46% 54% 50% 50%; box-shadow: 0 4px 10px rgba(0,0,0,.5); }
.cl-env .seal i:nth-child(1) { clip-path: polygon(0 0, 55% 0, 45% 100%, 0 100%); }
.cl-env .seal i:nth-child(2) { clip-path: polygon(55% 0, 100% 0, 100% 100%, 45% 100%); }
.cl-env .seal b { position:absolute; inset:0; display:grid; place-items:center; font: 900 clamp(14px,2.4vw,30px) 'Nanum Myeongjo',serif; color:#f4c8a0; opacity:.9; pointer-events:none; }
.cl-env .cd { position:absolute; left:50%; top:30%; width:34%; aspect-ratio: 250/350; transform: translate(-50%,-10%); z-index:2; filter: drop-shadow(0 16px 20px rgba(0,0,0,.6)); }
.cl-env .cd svg { width:100%; height:100%; display:block; }
.cl-glove { position:absolute; right:-52%; top:18%; width:78%; z-index:6; filter: drop-shadow(0 20px 24px rgba(0,0,0,.7)); }
</style>`;
const BG = (h) => `<div style="position:absolute;left:0;top:0">${h.replace('<svg ', '<svg style="width:1600px;height:900px;display:block" ')}</div>`;

function scene(D, html = '') { D.add(STYLE + CINE_CSS + html); const shot = D.root(); return { shot, S: stage(shot) }; }
/** 번개: 화면이 두 번 번쩍, 천둥 소리 */
function lightning(D, shot, { silhouette = null } = {}) {
  const l = document.createElement('div');
  l.className = 'cl-lightning';
  shot.appendChild(l);
  l.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.08 }, { opacity: 0.1, offset: 0.2 }, { opacity: 0.8, offset: 0.3 }, { opacity: 0 }], { duration: 700 });
  shot.querySelectorAll('.cl-pane').forEach((p) => p.animate([{ fill: '#10182c' }, { fill: '#e8f0ff', offset: 0.1 }, { fill: '#10182c' }], { duration: 700 }));
  shot.querySelectorAll('.cl-bolt').forEach((p) => p.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.2, offset: 0.25 }, { opacity: 1, offset: 0.32 }, { opacity: 0 }], { duration: 700 }));
  if (silhouette) { silhouette.classList.add('cl-silh'); setTimeout(() => silhouette.classList.remove('cl-silh'), 380); }
  D.sound.thunder && D.sound.thunder();
  D.shake(5, 300);
}

/** ① 폭풍우 치는 저택 */
function exteriorShot(D, t0, caption) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(1, BG(svg(mansion())));
    const rn = rain(shot, { groundY: 0.9, count: 320 });
    const cam = camPath(S.cam, [[0, { x: 800, y: 470, z: 1 }], [3.4, { x: 800, y: 420, z: 1.3 }]]);
    let last = 0;
    D.tick((s) => { const dt = s - last; last = s; cam(s); rn(dt); S.render(s); });
    setTimeout(() => lightning(D, shot), 700);
    setTimeout(() => say(shot, '', caption, 2.2, '#c8d8ff'), 1100);
  });
}

/** 응접실에 용의자들을 세운다 (뒤쪽 한 줄) */
function lineup(C, culprit, { y = 780, scale = 1.02 } = {}) {
  const ids = C_IDS();
  const xs = [260, 470, 680, 920, 1130, 1340];
  const map = {};
  ids.forEach((id, i) => { map[id] = C.add({ look: LOOK[id], x: xs[i], y, scale, rim: '#ffb870', flip: xs[i] > 800, rimSide: xs[i] > 800 ? -1 : 1 }); });
  return map;
}
const C_IDS = () => C().SUSPECTS.map((s) => s.id);

/** ② 응접실: 탐정이 걸어 들어와 범인을 지목한다 */
function accuseShot(D, t0, { culprit, solver }) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.4, BG(svg(parlor())));
    const L = S.layer(1, '');
    const Cc = cast(L.el);
    const sus = lineup(Cc, culprit);
    const cx = sus[culprit].world.x;
    const home = Object.fromEntries(Object.entries(sus).map(([id, p]) => [id, p.world.x]));
    const det = Cc.add({ look: 'detective', x: 1700, y: 900, scale: 1.4, rim: '#ffd8a0', flip: true, rimSide: -1 });
    const stopX = Math.max(300, Math.min(1300, cx > 800 ? cx - 440 : cx + 440));
    const cam = camPath(S.cam, [[0, { x: 800, y: 450, z: 1 }], [2.4, { x: 800, y: 450, z: 1.05 }], [3.2, { x: (stopX + cx) / 2, y: 470, z: 1.35 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const x = Math.max(stopX, 1700 - s * 420);
      const walking = x > stopX;
      const faceLeft = cx < x;
      const pt = ease.back(Math.max(0, Math.min(1, (s - 2.8) / 0.45)));
      det.set(walking ? { ...POSE.stand, ...gait((s * 1.1) % 1), x, flip: true } : { ...mixPose(POSE.stand, { ...POSE.stand, ...POSE.point }, pt), x, flip: faceLeft });
      det.talking = s > 3 && s < 4.6;
      // 지목되자 모두 범인 쪽을 본다
      // 지목된 범인은 한 걸음 앞으로, 곁에 있던 사람들은 물러선다
      const k = ease.inOut(Math.max(0, Math.min(1, (s - 3.2) / 0.5)));
      for (const [id, p] of Object.entries(sus)) {
        const look = s > 3.2 && id !== culprit;
        const x0 = home[id];
        const away = id === culprit ? 0 : Math.sign(x0 - cx) * Math.max(0, 300 - Math.abs(x0 - cx)) * 0.45 * k;
        p.set({ ...POSE.stand, ...(look && Math.abs(x0 - cx) < 260 ? POSE.chinHand : {}), head: look ? 6 : 0, x: x0 + away, y: id === culprit ? 780 + 40 * k : 780, scale: id === culprit ? 1.02 + 0.12 * k : 1.02, flip: look ? x0 > cx : x0 > 800 });
      }
      if (s > 3.2) { sus[culprit].brow('angry'); sus[culprit].mouth('grit'); }
      Cc.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, esc(solver), `범인은… 바로 당신이오, ${esc(C().SUSPECT[culprit].name)}!`, 2, '#ffd8a0'), 2900);
    setTimeout(() => lightning(D, shot), 3300);
  });
}

/** ③ 봉투가 열리고 사건의 세 장이 올라온다 */
function envelopeShot(D, t0, sol, { sealed = false } = {}) {
  D.at(t0, () => {
    const cards = sealed ? '' : [sol.suspect, sol.weapon, sol.room].map((id, i) => `<div class="cd c${i}">${cardSvg(id)}</div>`).join('');
    D.cut(`${STYLE}<div class="cl-desk"></div><div class="cl-lamp"></div>
      <div class="cl-env"><div class="body"></div>${cards}<div class="front"></div><div class="flap"></div><div class="seal"><i></i><i></i><b>密</b></div></div>`);
    const root = D.root();
    root.querySelector('.cl-env').animate([{ transform: 'translate(-50%,-50%) scale(.92) rotate(-2deg)' }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], { duration: 2600, easing: 'ease-out', fill: 'forwards' });
    if (sealed) return;
    const seal = root.querySelectorAll('.seal i');
    setTimeout(() => {
      seal[0].animate([{ transform: 'none' }, { transform: 'translate(-30%, 60%) rotate(-40deg)', opacity: 0 }], { duration: 500, fill: 'forwards', easing: 'ease-in' });
      seal[1].animate([{ transform: 'none' }, { transform: 'translate(30%, 70%) rotate(35deg)', opacity: 0 }], { duration: 500, fill: 'forwards', easing: 'ease-in' });
      root.querySelector('.seal b').animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      D.sound.card && D.sound.card();
    }, 350);
    setTimeout(() => {
      root.querySelector('.flap').animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(180deg)', zIndex: 1 }], { duration: 520, fill: 'forwards', easing: 'cubic-bezier(.4,0,.2,1)' });
    }, 700);
    // 세 장이 하나씩 솟아 부채꼴로 선다
    const dest = [['-165%', '-128%', -10], ['-50%', '-140%', 0], ['65%', '-128%', 10]];
    root.querySelectorAll('.cd').forEach((c, i) => setTimeout(() => {
      c.animate([{ transform: 'translate(-50%,-10%)' }, { transform: 'translate(-50%,-150%)', offset: 0.55 }, { transform: `translate(${dest[i][0]},${dest[i][1]}) rotate(${dest[i][2]}deg) scale(1.12)`, zIndex: 8 }], { duration: 780, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.3,1)' });
      setTimeout(() => { c.style.zIndex = 8; D.sound.card && D.sound.card(); }, 420);
    }, 1250 + i * 480));
  });
}

/** ④ 그날 밤의 회상: 그 방에서, 그 흉기로 — 흉기마다 다른 범행 (푸른 기억 필터, 피는 보이지 않게) */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const seg = (s, a, b) => clamp01((s - a) / (b - a));
const SIT = { ...POSE.stand, ...POSE.sit };
const SLUMP = { chest: 34, neck: 22, head: 30, upperF: 26, foreF: -4, handF: 0, upperB: 20, foreB: -2 };
function memoryShot(D, t0, sol) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    shot.classList.add('cl-memory');
    const w = sol.weapon;
    const poison = w === 'poison';
    S.layer(0.35, BG(svg(memoryRoom(sol.room))));
    // 안락의자 (+ 독약이면 옆 탁자와 술잔)
    const table = poison ? `<g transform="translate(1250 860)"><ellipse cx="0" cy="-118" rx="70" ry="16" fill="#5a3a1a" stroke="#1a0e08" stroke-width="5"/><path d="M-8 -110 V0 M-40 0 H40" stroke="#3a2410" stroke-width="10"/></g>
      <g class="cl-cup" transform="translate(1238 -12)"><path d="M0 850 H24 Q24 876 12 878 Q0 876 0 850Z" fill="#e0b030" stroke="#1a0e08" stroke-width="3"/><path d="M12 878 V890 M4 892 H20" stroke="#e0b030" stroke-width="4"/></g>` : '';
    const L = S.layer(1, BG(svg(armchair + table)));
    const Cc = cast(L.el);
    // 범인을 먼저 세워 피해자 뒤(안쪽)에 서게 한다
    const fromRight = poison;
    const mur = Cc.add({ look: LOOK[sol.suspect], x: fromRight ? 1700 : 120, y: 840, scale: 1.22, rim: '#c8d8ff', flip: fromRight, rimSide: fromRight ? -1 : 1 });
    const vic = Cc.add({ look: VICTIM, x: 1010, y: 860, scale: 1.2, rim: '#c8d8ff' });
    vic.hold(poison ? 'book' : 'goblet');
    mur.hold(w);
    mur.brow('angry');
    // 효과 층: 밧줄 · 총구 불꽃 · 연기 · 독 방울 · 휘두름 자국
    L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible;pointer-events:none">
      <path class="fx-rope" d="" fill="none" stroke="#c8a060" stroke-width="9" stroke-linecap="round" opacity="0"/>
      <path class="fx-swoosh" d="" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0"/>
      <g class="fx-muzzle" opacity="0"><path d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10Z" fill="#fff4a0"/><circle r="14" fill="#fff"/></g>
      <g class="fx-smoke"></g><g class="fx-drops"></g>
      <g class="fx-stars" opacity="0">${[0, 1, 2].map((i) => `<path transform="rotate(${i * 120})" d="M0 -34 L6 -24 L0 -14 L-6 -24Z" fill="#fff4a0"/>`).join('')}</g></svg>`);
    const fx = (c) => L.el.querySelector(c);
    const rope = fx('.fx-rope');
    const swoosh = fx('.fx-swoosh');
    const muzzle = fx('.fx-muzzle');
    const smoke = fx('.fx-smoke');
    const drops = fx('.fx-drops');
    const stars = fx('.fx-stars');
    const cup = L.el.querySelector('.cl-cup');
    // 흉기마다: 서는 자리 · 결정적 순간(초)
    const standX = { rope: 880, dagger: 860, candle: 850, wrench: 850, revolver: 540, poison: 1400 }[w] || 860;
    const HIT = { rope: 2.9, dagger: 3.1, candle: 3.1, wrench: 3.1, revolver: 3.0, poison: 4.6 }[w] || 3;
    const cam = camPath(S.cam, poison
      ? [[0, { x: 1000, y: 460, z: 1.2 }], [2.8, { x: 1150, y: 460, z: 1.45 }], [4, { x: 1010, y: 450, z: 1.55 }], [6.2, { x: 1080, y: 600, z: 1.2 }]]
      : [[0, { x: 700, y: 460, z: 1.15 }], [2.4, { x: (standX + 1010) / 2, y: 440, z: 1.45 }], [HIT, { x: (standX + 1010) / 2 + 20, y: 430, z: 1.7 }], [HIT + 1.6, { x: 900, y: 460, z: 1.3 }]]);
    const once = {};
    const at = (k, fn) => { if (!once[k]) { once[k] = 1; fn(); } };
    const impact = (power = 10) => { lightning(D, shot, { silhouette: L.el }); D.shake(power, 320); D.flash('#ffffff', 160); };
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      // 범인 걸음 (살금살금)
      const walkEnd = poison ? 1.6 : 2.2;
      const x0 = fromRight ? 1700 : 120;
      const mx = s < walkEnd ? x0 + (standX - x0) * (s / walkEnd) : standX;
      const sneak = { hipY: 16, chest: 16, upperF: -40, foreF: -30 };
      let mp = s < walkEnd ? { ...POSE.stand, ...gait((s * 0.9) % 1), ...sneak } : { ...POSE.stand, ...sneak };
      let vp = { ...SIT, upperF: -40, foreF: -70, head: 6 + Math.sin(s * 1.5) * 2 };
      let vrot = 0;
      let vy = 860;
      if (w === 'rope') {
        const lift = seg(s, 2.2, 2.6);
        const loop = seg(s, 2.6, 2.9);
        const pull = s > 2.9 && s < 4.6;
        mp = { ...mp, ...mixPose({ upperF: -40, foreF: -30, upperB: -40, foreB: -30 }, { upperF: -160, foreF: -10, upperB: -150, foreB: -10 }, lift) };
        if (loop > 0) at('coil', () => mur.hold(null));
        if (loop > 0) mp = { ...mp, ...mixPose({ upperF: -160, foreF: -10, upperB: -150, foreB: -10 }, { upperF: -70, foreF: -40, upperB: -60, foreB: -50 }, loop) };
        if (pull) mp = { ...mp, chest: -12 + Math.sin(s * 30) * 3, hipY: 10, upperF: -50 + Math.sin(s * 26) * 6, upperB: -40 };
        if (s > 2.9) {
          const fl = s < 4.4 ? 1 : 1 - seg(s, 4.4, 5);
          vp = mixPose({ ...SIT, ...SLUMP, head: -10 }, { ...SIT, upperF: -130 + Math.sin(s * 22) * 40, foreF: -60, upperB: -120 + Math.cos(s * 20) * 40, foreB: -50, head: -24 + Math.sin(s * 18) * 6, chest: -10, thighF: -90 + Math.sin(s * 16) * 20 }, fl);
          const a = mur.point('handF', 0, 20);
          const b = mur.point('handB', 0, 20);
          const n = vic.point('neck', 4, -8);
          rope.setAttribute('d', `M${a.x} ${a.y} Q${n.x - 20} ${n.y - 10} ${n.x + 10} ${n.y} Q${n.x - 16} ${n.y + 14} ${b.x} ${b.y}`);
          rope.setAttribute('opacity', s < 5.4 ? 1 : 0);
        } else if (loop > 0) {
          const a = mur.point('handF', 0, 20);
          const b = mur.point('handB', 0, 20);
          rope.setAttribute('d', `M${a.x} ${a.y} Q${(a.x + b.x) / 2 + 60} ${Math.max(a.y, b.y) + 60} ${b.x} ${b.y}`);
          rope.setAttribute('opacity', 1);
        }
        if (s > 2.9) at('hit', () => { impact(6); D.sound.alarm && D.sound.alarm(); });
        if (s > 4.8) at('drop', () => vic.hold(null));
        if (s > 5.4) mp = { ...POSE.stand, chest: 8 + Math.sin(s * 8) * 3, upperF: 10, foreF: -10, upperB: 0, foreB: -10 };
      } else if (w === 'revolver') {
        const aim = seg(s, 2.2, 2.7);
        const kick = s > HIT && s < HIT + 0.18 ? 1 : 0;
        mp = { ...POSE.stand, ...mixPose({ upperF: -40, foreF: -30 }, { upperF: -88 - kick * 30, foreF: -2, handF: 0, head: -2 }, aim), chest: -kick * 6 };
        if (s > HIT) {
          at('hit', () => {
            const m = mur.point('handF', 0, 100);
            muzzle.setAttribute('transform', `translate(${m.x} ${m.y})`);
            muzzle.animate([{ opacity: 1, transform: `translate(${m.x}px, ${m.y}px) scale(1.4)` }, { opacity: 0, transform: `translate(${m.x}px, ${m.y}px) scale(.6)` }], { duration: 160, fill: 'forwards' });
            for (let i = 0; i < 6; i++) {
              const pf = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              pf.setAttribute('r', 12 + i * 4);
              pf.setAttribute('fill', '#c8ccd8');
              smoke.appendChild(pf);
              pf.animate([{ transform: `translate(${m.x}px, ${m.y}px)`, opacity: 0.7 }, { transform: `translate(${m.x + 40 + i * 14}px, ${m.y - 80 - i * 22}px)`, opacity: 0 }], { duration: 1600 + i * 200, fill: 'forwards', easing: 'ease-out' });
            }
            impact(12);
            D.sound.thunder && D.sound.thunder();
          });
          const jolt = 1 - seg(s, HIT, HIT + 0.35);
          vp = mixPose({ ...SIT, ...SLUMP }, { ...SIT, chest: -18, head: -24, upperF: -110, upperB: -90 }, jolt * (s < HIT + 0.35 ? 1 : 0));
          if (s > HIT + 0.35) vp = mixPose({ ...SIT, chest: -18, head: -24, upperF: -110, upperB: -90 }, { ...SIT, ...SLUMP }, seg(s, HIT + 0.35, HIT + 1.1));
          if (s > HIT + 0.5) at('drop', () => vic.hold(null));
        }
      } else if (w === 'poison') {
        // 독: 옆 탁자의 잔에 독을 붓고 사라진다 → 책을 내려놓고 잔을 들어 마신다 → 목을 움켜쥐고 쓰러진다
        const pour = seg(s, 1.6, 2.0) * (1 - seg(s, 2.8, 3.0));
        mp = { ...mp, ...mixPose({ upperF: -40, foreF: -30 }, { upperF: -70, foreF: -60, handF: -110 }, pour) };
        if (s > 1.9 && s < 2.8) at('drip', () => {
          for (let i = 0; i < 7; i++) {
            const d0 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            d0.setAttribute('rx', 4); d0.setAttribute('ry', 6); d0.setAttribute('fill', '#5aff7a');
            drops.appendChild(d0);
            d0.animate([{ transform: 'translate(1250px, 790px)', opacity: 1 }, { transform: 'translate(1250px, 842px)', opacity: 0.2 }], { duration: 420, delay: i * 110, fill: 'forwards', easing: 'ease-in' });
          }
        });
        if (s > 3.0) mp = { ...POSE.stand, ...gait(((s - 3) * 1.1) % 1), x: 0 };
        const mx2 = s > 3.0 ? standX + (s - 3.0) * 420 : mx;
        mur.set({ ...mp, x: mx2, flip: s <= 3.0 });
        const reach = seg(s, 3.3, 3.7);
        const drink = seg(s, 3.8, 4.2);
        if (s > 3.3) vp = { ...SIT, head: 6, upperF: -40 - reach * 30, foreF: -70 + reach * 40 };
        if (s > 3.7) at('take', () => { vic.hold('goblet'); if (cup) cup.style.opacity = 0; });
        if (s > 3.8) vp = { ...SIT, upperF: -60 - drink * 22, foreF: -70 - drink * 52, handF: -20 * drink, head: -14 * drink, neck: -8 * drink };
        if (s > HIT) {
          at('hit', () => { impact(8); D.sound.alarm && D.sound.alarm(); vic.hold(null); });
          const fall = seg(s, HIT + 0.7, HIT + 1.3);
          vp = { ...SIT, upperF: -84, foreF: -118 + Math.sin(s * 30) * 8, upperB: -76, foreB: -112, head: 14 + Math.sin(s * 24) * 5, chest: 10 + fall * 30 };
          vrot = fall * 66;
          vy = 860 + fall * 8;
        }
      } else {
        // 단검 · 촛대 · 렌치: 머리 위로 들었다가 내리친다
        const blunt = w !== 'dagger';
        const raise = seg(s, 2.2, 2.8);
        const strike = seg(s, HIT - 0.15, HIT);
        const up = blunt ? { upperF: -175, foreF: -60, upperB: w === 'wrench' ? -165 : -20, foreB: w === 'wrench' ? -60 : -30, chest: -8 } : { upperF: -172, foreF: -24, chest: -6 };
        const down = blunt ? { upperF: -70, foreF: -10, upperB: w === 'wrench' ? -60 : -10, foreB: -10, chest: 18 } : { upperF: -50, foreF: -8, chest: 16 };
        mp = { ...POSE.stand, ...mixPose({ upperF: -40, foreF: -30 }, up, raise) };
        if (s > HIT - 0.15) mp = { ...POSE.stand, ...mixPose(up, down, strike) };
        if (s > HIT - 0.15 && s < HIT + 0.1) {
          const a = mur.point('handF', 0, blunt ? 100 : 90);
          swoosh.setAttribute('d', `M${a.x - 40} ${a.y - 140} Q${a.x + 60} ${a.y - 90} ${a.x} ${a.y}`);
          swoosh.setAttribute('opacity', 0.8);
        } else swoosh.setAttribute('opacity', 0);
        if (s > HIT) {
          at('hit', () => {
            impact(w === 'wrench' ? 18 : blunt ? 14 : 10);
            D.sound.door && D.sound.door();
            if (blunt) {
              const h = vic.point('head', 10, -60);
              stars.animate([{ opacity: 1, transform: `translate(${h.x}px, ${h.y}px) rotate(0deg)` }, { opacity: 0, transform: `translate(${h.x}px, ${h.y - 30}px) rotate(200deg)` }], { duration: 900, fill: 'forwards' });
            }
            if (w === 'candle') setTimeout(() => mur.hold('candleOut'), 120);
          });
          const hit = 1 - seg(s, HIT, HIT + 0.3);
          vp = mixPose({ ...SIT, ...SLUMP, head: blunt ? 40 : 30 }, { ...SIT, chest: -20, head: blunt ? 34 : -26, upperF: -100, upperB: -80 }, hit);
          if (s > HIT + 0.4) at('drop', () => vic.hold(null));
          if (s > HIT + 0.9) mp = { ...POSE.stand, ...mixPose(down, { upperF: -20, foreF: -20, chest: 4 }, seg(s, HIT + 0.9, HIT + 1.5)), head: 8 };
        }
      }
      if (!poison) mur.set({ ...mp, x: mx });
      vic.set({ ...vp, x: 1010, y: vy, rot: vrot });
      Cc.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, '', `그날 밤, ${esc(ROOM_KO(sol.room))}에서… ${poison ? '술잔에 독이 떨어졌다' : `${esc(C().WEAPON[sol.weapon].name)}${josa(C().WEAPON[sol.weapon].name)} 쥔 손이 다가왔다`}.`, 2.4, '#c8d8ff'), 200);
  });
}
/** 회상 뒤 짧은 컷: 떨어지는 술잔 · 쏟아지는 술 · 늘어진 손 */
function dropShot(D, t0, sol) {
  D.at(t0, () => {
    const poison = sol.weapon === 'poison';
    const liquid = poison ? '#3aa85a' : '#6a1a2a';
    D.cut(STYLE + `<div class="cl-memory" style="position:absolute;inset:0">${svg(`<defs><linearGradient id="dfl" x2="0" y2="1"><stop offset="0" stop-color="#3a2414"/><stop offset="1" stop-color="#1a0e06"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#dfl)"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${120 + i * 100} H1600" stroke="#140a04" stroke-width="5"/>`).join('')}
      <ellipse class="dr-pool" cx="820" cy="700" rx="10" ry="4" fill="${liquid}" opacity=".9"/>
      ${poison ? '<g class="dr-fume" opacity="0"><path d="M780 660 C760 600 820 580 800 520 M840 660 C860 600 810 570 840 500" stroke="#7aff9a" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/></g>' : ''}
      <g class="dr-cup"><path d="M-40 -60 H40 Q40 10 0 16 Q-40 10 -40 -60Z" fill="#e0b030" stroke="#1a0e08" stroke-width="6"/><path d="M0 16 V60 M-30 64 H30" stroke="#e0b030" stroke-width="12" stroke-linecap="round"/><path d="M-26 -50 Q-20 -10 -6 4" stroke="#fff4c0" stroke-width="6" fill="none" opacity=".6"/></g>
      <g class="dr-hand"><path d="M1320 -40 C1316 60 1300 160 1290 240 C1284 290 1320 300 1330 256 C1340 200 1360 100 1380 -40Z" fill="#6a5a40" stroke="#1a0e08" stroke-width="6"/><path d="M1272 250 C1266 300 1286 340 1310 330 C1340 322 1344 280 1330 250Z" fill="#e8c0a0" stroke="#1a0e08" stroke-width="6"/></g>`)}</div>`);
    const root = D.root();
    root.querySelector('.dr-cup').animate([
      { transform: 'translate(1180px, -120px) rotate(-30deg)' },
      { transform: 'translate(900px, 640px) rotate(80deg)', offset: 0.35, easing: 'ease-out' },
      { transform: 'translate(860px, 600px) rotate(110deg)', offset: 0.5, easing: 'ease-in' },
      { transform: 'translate(760px, 660px) rotate(170deg)', offset: 0.75 },
      { transform: 'translate(700px, 668px) rotate(185deg)' },
    ], { duration: 1500, fill: 'forwards' });
    setTimeout(() => { D.sound.card && D.sound.card(); D.shake(4, 160); }, 520);
    root.querySelector('.dr-pool').animate([{ rx: 10, ry: 4 }, { rx: 220, ry: 44 }], { duration: 1400, delay: 520, fill: 'forwards', easing: 'ease-out' });
    root.querySelector('.dr-hand').animate([{ transform: 'translate(0, -120px) rotate(-4deg)' }, { transform: 'translate(0, 40px) rotate(4deg)', offset: 0.6 }, { transform: 'translate(0, 24px) rotate(2deg)' }], { duration: 1300, fill: 'forwards', easing: 'ease-in' });
    const fume = root.querySelector('.dr-fume');
    if (fume) fume.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(-60px)' }], { duration: 1400, delay: 700, fill: 'forwards' });
    D.anim('.cl-memory > svg', [{ transform: 'scale(1.18)' }, { transform: 'scale(1.04)' }], { duration: 1800, easing: 'ease-out' });
  });
}

/** ⑤ 경관이 수갑을 채우고, 범인이 자백한다 */
function arrestShot(D, t0, { culprit, solver }) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.4, BG(svg(parlor())));
    const L = S.layer(1, '');
    const Cc = cast(L.el);
    const others = C_IDS().filter((id) => id !== culprit);
    const bg = others.map((id, i) => Cc.add({ look: LOOK[id], x: [180, 360, 1240, 1420, 1060][i], y: 760, scale: 0.95, rim: '#ffb870', flip: i >= 2, rimSide: i >= 2 ? -1 : 1 }));
    const mur = Cc.add({ look: LOOK[culprit], x: 800, y: 860, scale: 1.4, rim: '#ff9a6a' });
    const cop = Cc.add({ look: 'cop', x: 520, y: 870, scale: 1.4, rim: '#8ab0ff' });
    const det = Cc.add({ look: 'detective', x: 1150, y: 880, scale: 1.4, rim: '#ffd8a0', flip: true, rimSide: -1 });
    mur.brow('up');
    const cam = camPath(S.cam, [[0, { x: 800, y: 440, z: 1.5 }], [3.8, { x: 820, y: 460, z: 1.2 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const k = ease.inOut(Math.max(0, Math.min(1, (s - 0.3) / 0.6)));
      mur.set({ ...mixPose(POSE.stand, { ...POSE.stand, ...POSE.cuffed }, k), neck: 6 * k, head: 4 + k * 6 + Math.sin(s * 2) * 2, x: 800 });
      mur.talking = s > 1.4 && s < 3.6;
      cop.set({ ...POSE.stand, upperF: -60, foreF: -20, upperB: -40, foreB: -30, x: 560 + k * 60 });
      det.set({ ...POSE.stand, ...POSE.pockets, head: 4, x: 1150 });
      bg.forEach((p, i) => p.set({ ...POSE.stand, ...(i % 2 ? POSE.chinHand : {}), x: p.world.x }));
      Cc.update(dt);
      S.render(s);
    });
    setTimeout(() => { D.sound.door && D.sound.door(); D.shake(4, 160); }, 700);
    setTimeout(() => say(shot, esc(C().SUSPECT[culprit].name), CONFESS[culprit] || '…', 2.4, '#ffb89a'), 1300);
    setTimeout(() => say(shot, esc(solver), '사건은 이것으로 종결입니다.', 1.4, '#ffd8a0'), 3900);
  });
}

/** 미제: 말없이 선 용의자들, 어깨를 으쓱하는 탐정 */
function shrugShot(D, t0, { culprit }) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.4, BG(svg(parlor())));
    const L = S.layer(1, '');
    const Cc = cast(L.el);
    const sus = lineup(Cc, culprit);
    const det = Cc.add({ look: 'detective', x: 800, y: 900, scale: 1.4, rim: '#ffd8a0' });
    const cam = camPath(S.cam, [[0, { x: 800, y: 440, z: 1.25 }], [3.6, { x: 800, y: 460, z: 1.02 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const sh = Math.max(0, Math.sin(Math.max(0, s - 1.2) * 2.4));
      // 빈손을 들어 보이며 고개를 젓는다
      det.set({ ...POSE.stand, upperF: 10 - sh * 38, foreF: -20 - sh * 60, handF: -30 * sh, upperB: 4 - sh * 30, foreB: -20 - sh * 56, handB: -30 * sh, chest: -sh * 5, neck: -sh * 4, head: Math.sin(s * 7) * 7 * Math.min(1, Math.max(0, s - 1.2)), x: 800 });
      det.brow(s > 1.2 ? 'up' : 'calm');
      for (const [id, p] of Object.entries(sus)) {
        p.set({ ...POSE.stand, x: p.world.x });
        if (id === culprit && s > 2.4) { p.brow('sly'); p.mouth('smirk'); }
      }
      Cc.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, '탐정', '증거가… 부족하다.', 1.8, '#ffd8a0'), 1300);
  });
}
/** 미제: 봉인된 봉투를 장갑 낀 손이 끌고 사라진다 */
function stolenShot(D, t0, sol) {
  envelopeShot(D, t0, sol, { sealed: true });
  D.at(t0 + 0.9, () => {
    const env = D.root().querySelector('.cl-env');
    const glove = document.createElement('div');
    glove.className = 'cl-glove';
    // 검은 가죽 장갑: 오른쪽 소매에서 들어와 네 손가락으로 봉투 모서리를 움켜쥔다
    glove.innerHTML = `<svg viewBox="0 0 600 320" style="width:100%;height:auto;display:block;overflow:visible">
      <defs><linearGradient id="glv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a44"/><stop offset=".5" stop-color="#16161c"/><stop offset="1" stop-color="#060608"/></linearGradient>
      <linearGradient id="slv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a34"/><stop offset="1" stop-color="#0e0e14"/></linearGradient></defs>
      <path d="M380 70 H640 V300 H380 Q350 190 380 70Z" fill="url(#slv)" stroke="#000" stroke-width="6"/>
      <path d="M372 80 Q352 190 372 290" stroke="#46464e" stroke-width="14" fill="none"/>
      <path d="M370 110 C320 96 270 100 236 116 L120 118 Q92 120 94 142 Q96 160 124 160 L214 158 L112 172 Q86 176 90 198 Q94 216 120 212 L220 198 L124 226 Q100 234 106 254 Q114 270 138 262 L232 232 L170 272 Q152 286 164 302 Q178 314 198 302 L290 250 C330 250 360 240 372 226Z" fill="url(#glv)" stroke="#000" stroke-width="6" stroke-linejoin="round"/>
      <path d="M250 110 C290 70 330 64 350 78" fill="none" stroke="#000" stroke-width="6"/><path d="M252 112 C286 80 318 74 344 84 L360 110Z" fill="url(#glv)"/>
      <path d="M140 132 H214 M136 186 H220 M150 240 L230 214 M300 150 C320 170 330 190 326 210" stroke="#5a5a66" stroke-width="3" fill="none" opacity=".7"/>
    </svg>`;
    env.appendChild(glove);
    glove.animate([{ transform: 'translateX(60%)' }, { transform: 'translateX(-46%)' }], { duration: 700, fill: 'forwards', easing: 'ease-out' });
    setTimeout(() => {
      env.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(130%,-50%) rotate(8deg)' }], { duration: 900, fill: 'forwards', easing: 'cubic-bezier(.6,0,.8,.4)' });
    }, 900);
  });
}
/** 미제: 문간에서 뒤돌아 웃고, 빗속으로 사라진다 */
function exitShot(D, t0, { culprit }) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.5, BG(svg(`${mansion()}<rect width="1600" height="900" fill="#000" opacity=".35"/>`)));
    const L = S.layer(1, BG(svg(`<path d="M0 0 H560 V900 H0Z M1040 0 H1600 V900 H1040Z" fill="#140c08"/><path d="M560 0 V900 M1040 0 V900" stroke="#3a2414" stroke-width="30"/><path d="M0 820 H1600 V900 H0Z" fill="#1a0e08"/>`)));
    const Cc = cast(L.el);
    const mur = Cc.add({ look: LOOK[culprit], x: 820, y: 850, scale: 1.4, rim: '#8ab0ff', flip: true, rimSide: -1 });
    mur.brow('sly');
    mur.mouth('smirk');
    const rn = rain(shot, { groundY: 0.9 });
    L.el.classList.add('cl-silh');
    const cam = camPath(S.cam, [[0, { x: 800, y: 450, z: 1.1 }], [3.4, { x: 800, y: 450, z: 1.25 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      rn(dt);
      if (s < 1.6) mur.set({ ...POSE.stand, head: -6, x: 820, flip: true });
      else mur.set({ ...POSE.stand, ...gait(((s - 1.6) * 1.1) % 1), ...POSE.pockets, x: 820 - (s - 1.6) * 60, scale: 1.4 - (s - 1.6) * 0.3, y: 850 - (s - 1.6) * 50, flip: false });
      Cc.update(dt);
      S.render(s);
    });
    setTimeout(() => { L.el.classList.remove('cl-silh'); lightning(D, shot); }, 500);
    setTimeout(() => L.el.classList.add('cl-silh'), 900);
    setTimeout(() => say(shot, '???', '완벽한 밤이었어.', 1.8, '#8ab0ff'), 1000);
  });
}

// 영상 확인용: 컷 하나만 틀어 본다
export const _shots = { exteriorShot, accuseShot, envelopeShot, memoryShot, dropShot, arrestShot, shrugShot, stolenShot, exitShot };
export { playFilm };

/**
 * @param {HTMLElement} host
 * @param {{kind:'solved'|'unsolved', solution:{suspect,weapon,room}, solver:string, sub?:string, sound?:object}} o
 */
export function playEnding(host, { kind = 'solved', solution, solver = '탐정', sub, sound }) {
  const muted = !!(sound && sound.muted);
  const culprit = solution.suspect;
  if (kind === 'solved') {
    const L = 29;
    const music = score({ length: L, muted, bpm: 84, cues: [{ at: 6.3 }, { at: 9.2, notes: [48, 55, 60, 63] }, { at: 14.5, notes: [43, 50, 55, 58], vol: 0.14 }, { at: 19.3 }] });
    const scene0 = (D) => {
      exteriorShot(D, 0, '폭풍우 치는 밤, 저택의 응접실.');
      accuseShot(D, 3.2, { culprit, solver });
      envelopeShot(D, 8.2, solution);
      memoryShot(D, 11.4, solution);
      dropShot(D, 17.8, solution);
      arrestShot(D, 19.4, { culprit, solver });
    };
    return playFilm(host, { scene: scene0, length: L, title: '사건 해결', titleAt: L - 3.2, sub: sub || `${solver}의 추리 적중`, sound: sound || {} }).finally(() => music.stop());
  }
  const L = 17;
  const music = score({ length: L, muted, bpm: 72 });
  const scene1 = (D) => {
    exteriorShot(D, 0, '동이 트도록, 아무도 진실에 닿지 못했다.');
    shrugShot(D, 3.2, { culprit });
    stolenShot(D, 7.2, solution);
    exitShot(D, 10.2, { culprit });
  };
  return playFilm(host, { scene: scene1, length: L, title: '미제 사건', titleAt: L - 3.4, sub: sub || '범인은 어둠 속으로', sound: sound || {} }).finally(() => music.stop());
}
