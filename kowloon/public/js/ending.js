// 구룡 살인사건 결말 영상: 비 내리는 네온 골목 누아르 (체포 · 도주 · 목격자 제거)
import { makeHuman, motion, HUMAN_POSE, runPose } from '/anim/rig2d.js';
import { rnd, f, svg, playFilm } from '/anim/director.js';
import { cardSvg, OBJ } from './art.js';
import { POSE, gait, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, rain, say, cast, score, CINE_CSS } from '/anim/cine.js';

const K = window.KOWLOON;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ═════════ 배경: 구룡 골목 ═════════ */
const NEON = [['酒', '#ff3a5a'], ['藥', '#3af0e0'], ['當', '#ffd23a'], ['麻雀', '#ff5ae0'], ['茶', '#5aff8a'], ['旅館', '#ff8a3a']];
function alley({ seed = 3, fog = 0.25, lit = 1 } = {}) {
  const r = rnd(seed);
  let bld = '';
  // 양쪽 건물 벽 (원근)
  bld += '<path d="M0 0H520L640 520L640 720H0Z" fill="#0c0a12"/><path d="M1600 0H1080L960 520L960 720H1600Z" fill="#0e0b14"/>';
  // 먼 건물 · 빨래 · 전선
  for (let i = 0; i < 9; i++) {
    const x = 560 + i * 56 + r() * 20;
    const h = 260 + r() * 260;
    bld += `<rect x="${f(x)}" y="${f(520 - h)}" width="${f(50 + r() * 20)}" height="${f(h)}" fill="#141020"/>`;
    for (let k = 0; k < 6; k++) if (r() < 0.45 * lit) bld += `<rect x="${f(x + 8 + (k % 2) * 22)}" y="${f(520 - h + 20 + Math.floor(k / 2) * 40)}" width="12" height="16" fill="${r() < 0.5 ? '#ffcf7a' : '#7ad8ff'}" opacity="${f(0.3 + r() * 0.5)}"/>`;
  }
  bld += '<path d="M520 120Q800 180 1080 110M540 190Q800 240 1060 180M560 60Q800 110 1090 70" stroke="#05040a" stroke-width="3" fill="none"/>';
  for (let i = 0; i < 7; i++) bld += `<path d="M${f(600 + i * 60)} ${f(160 + (i % 3) * 8)} l10 26 h22 l6 -24Z" fill="${['#3a2a4a', '#4a1a2a', '#2a3a4a'][i % 3]}"/>`;
  // 창문들 (가까운 벽)
  for (let y = 60; y < 460; y += 90) {
    for (const [x0, dir] of [[40, 1], [1560, -1]]) {
      for (let k = 0; k < 4; k++) {
        const x = x0 + dir * k * 110;
        bld += `<rect x="${f(dir > 0 ? x : x - 70)}" y="${y}" width="70" height="52" fill="${r() < 0.35 * lit ? '#ffb85a' : '#1a1624'}" opacity="${f(0.55 + r() * 0.3)}"/>`;
        bld += `<path d="M${f(dir > 0 ? x - 6 : x - 76)} ${y + 56}h82v6h-82Z" fill="#05040a"/>`;
      }
    }
  }
  // 에어컨 실외기 · 간판
  let neon = '';
  NEON.forEach(([ch, col], i) => {
    const left = i % 2 === 0;
    const x = left ? 330 + (i % 3) * 30 : 1150 + (i % 3) * 30;
    const y = 90 + i * 70;
    const vertical = ch.length === 1;
    const w = vertical ? 70 : 150;
    const h = vertical ? 110 : 70;
    neon += `<g class="neon n${i}" style="--c:${col}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0a0810" stroke="${col}" stroke-width="4" filter="url(#glow)"/>
      <text x="${x + w / 2}" y="${y + h / 2 + (vertical ? 22 : 18)}" text-anchor="middle" font-family="'Song Myung', serif" font-size="${vertical ? 64 : 50}" fill="${col}" filter="url(#glow)">${ch}</text></g>`;
  });
  // 젖은 바닥 · 반사
  const ground = `<rect y="520" width="1600" height="380" fill="url(#gnd)"/>
    <g opacity=".35" filter="url(#blur)">${NEON.map(([, col], i) => `<rect x="${i % 2 === 0 ? 400 : 1150}" y="${560 + i * 30}" width="${60 + i * 8}" height="${120 + i * 20}" fill="${col}"/>`).join('')}</g>
    <path d="M640 520L0 900M960 520L1600 900" stroke="#1a1824" stroke-width="3"/>
    <ellipse cx="800" cy="760" rx="220" ry="26" fill="#0a0c14" opacity=".7"/><ellipse cx="800" cy="760" rx="200" ry="20" fill="url(#pud)"/>
    ${Array.from({ length: 16 }, (_, i) => `<ellipse class="rip" style="animation-delay:-${f(r() * 1.4)}s" cx="${f(300 + r() * 1000)}" cy="${f(640 + r() * 240)}" rx="${f(16 + r() * 14)}" ry="${f(4 + r() * 3)}" fill="none" stroke="#b8c8ff" stroke-width="1.6"/>`).join('')}`;
  return `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="sky" x2="0" y2="1"><stop offset="0" stop-color="#05040a"/><stop offset="1" stop-color="#2a1030"/></linearGradient>
    <linearGradient id="gnd" x2="0" y2="1"><stop offset="0" stop-color="#1a1420"/><stop offset="1" stop-color="#06050a"/></linearGradient>
    <radialGradient id="pud"><stop offset="0" stop-color="#ff3a5a" stop-opacity=".35"/><stop offset="1" stop-color="#3af0e0" stop-opacity=".05"/></radialGradient>
    <radialGradient id="fog" cy=".7"><stop offset="0" stop-color="#b8a8c8" stop-opacity="${fog}"/><stop offset="1" stop-color="#b8a8c8" stop-opacity="0"/></radialGradient>
  </defs><rect width="1600" height="900" fill="url(#sky)"/>${bld}${neon}${ground}<ellipse cx="800" cy="520" rx="700" ry="260" fill="url(#fog)"/>`;
}
const RAIN = `<div class="kw-rain"></div><div class="kw-rain far"></div>`;
const STYLE = `<style>
.kw-rain { position:absolute; inset:-20% -10%; pointer-events:none; background-image: repeating-linear-gradient(100deg, transparent 0 18px, rgba(200,220,255,.55) 18px 19.5px, transparent 19.5px 46px); background-size: 260px 320px; animation: kwr .38s linear infinite; opacity:.55; }
.kw-rain.far { opacity:.25; background-size: 160px 200px; animation-duration:.6s; filter: blur(1px); }
@keyframes kwr { to { background-position: -60px 320px; } }
.neon { animation: flick 3.2s steps(1) infinite; } .neon.n1 { animation-delay: -1s; } .neon.n3 { animation-delay: -2.1s; } .neon.n4 { animation-duration: 1.7s; }
.rip { transform-box: fill-box; transform-origin: center; animation: rip 1.4s ease-out infinite; opacity: 0; }
@keyframes rip { 0% { transform: scale(.2); opacity: .8; } 100% { transform: scale(1.6); opacity: 0; } }
.kw-light { position:absolute; inset:0; background:#dfe8ff; opacity:0; mix-blend-mode: screen; pointer-events:none; }
.kw-tape { position:absolute; left:-10%; right:-10%; height: 6.4vh; background: repeating-linear-gradient(90deg,#f2cf2a 0 22vh,#1a1a1a 22vh 23vh); color:#1a1a1a; font: 3.4vh 'Black Han Sans',sans-serif; letter-spacing:.6vh; display:flex; align-items:center; white-space:nowrap; overflow:hidden; box-shadow: 0 1vh 2vh rgba(0,0,0,.6); }
.kw-tape span { padding: 0 3vh; }
.kw-eyes { position:absolute; inset:0; }
@keyframes flick { 0%, 43%, 47%, 100% { opacity: 1; } 44%, 46% { opacity: .25; } }
.kw-cards { position:absolute; inset:0; display:flex; gap:4vw; align-items:center; justify-content:center; }
.kw-cards .kcard { width: 18vw; height:auto; filter: drop-shadow(0 30px 30px #000); }
.kw-stamp { position:absolute; left:50%; top:50%; font: 12vw 'Black Han Sans', sans-serif; color:#d8202a; border: 1.2vw solid #d8202a; padding: 0 3vw; transform: translate(-50%,-50%) rotate(-12deg); opacity:0; mix-blend-mode: multiply; letter-spacing: 1vw; }
.kw-paper { position:absolute; left:50%; top:50%; width: 62vw; transform: translate(-50%,-50%); background:#e8dcc0; color:#1a1210; padding: 3vw 4vw; box-shadow: 0 40px 80px #000; font-family: 'Noto Serif KR', serif; }
.kw-paper h1 { font: 6.4vw/1.05 'Black Han Sans', sans-serif; margin: .6vw 0; }
.kw-paper .mast { font: 2vw 'Special Elite', monospace; border-bottom: .4vw double #1a1210; padding-bottom: .6vw; display:flex; justify-content:space-between; }
.kw-paper p { font-size: 1.5vw; columns: 2; color:#3a2a20; margin: 1vw 0 0; }
.kw-sirens { position:absolute; inset:0; mix-blend-mode: screen; animation: sir .5s steps(1) infinite; }
@keyframes sir { 0% { background: radial-gradient(circle at 10% 30%, rgba(255,40,60,.5), transparent 50%); } 50% { background: radial-gradient(circle at 90% 30%, rgba(40,80,255,.5), transparent 50%); } }
</style>`;

/* ═════════ 컷들 ═════════ */
/** 간판에서 골목 바닥으로 내려오는 크레인 샷: 분필 윤곽 · 증거 번호표 · 폴리스 라인 · 번개 */
function openShot(D, t0) {
  D.at(t0, () => {
    const outline = `<g transform="translate(800 720) scale(1 .42)" fill="none" stroke="#f4f4f0" stroke-width="7" stroke-dasharray="18 10" opacity=".85">
      <path d="M-40 -170 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0 M-30 -130 L-60 -20 L-150 60 M30 -130 L90 -40 L170 -60 M-40 -20 L-10 120 L-60 240 M-10 -10 L60 110 L40 240"/></g>`;
    const markers = [[640, 700, 1], [980, 760, 2], [760, 820, 3]].map(([x, y, n]) => `<g transform="translate(${x} ${y})"><path d="M-22 0 L0 -40 L22 0Z" fill="#f2cf2a" stroke="#1a1a1a" stroke-width="3"/><text y="-8" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="22" fill="#1a1a1a">${n}</text></g>`).join('');
    D.cut(STYLE + `<div class="crane" style="position:absolute;inset:-30% 0 0 0">${svg(alley({ seed: 7 }) + outline + markers, '0 -300 1600 1200')}</div>` + RAIN
      + '<div class="kw-tape" style="bottom:14%;transform:rotate(-7deg)"><span>POLICE LINE · 출입금지 · DO NOT CROSS · 출입금지 · POLICE LINE · 출입금지 · DO NOT CROSS</span></div>'
      + '<div class="kw-tape" style="bottom:4%;transform:rotate(5deg)"><span>출입금지 · POLICE LINE · 출입금지 · DO NOT CROSS · 출입금지 · POLICE LINE</span></div><div class="kw-light"></div>');
    D.anim('.crane', [{ transform: 'translateY(22%) scale(1.25)' }, { transform: 'translateY(-4%) scale(1.05)' }], { duration: 3400, easing: 'cubic-bezier(.4,0,.2,1)' });
    D.anim('.kw-tape', [{ transform: 'translateY(40vh) rotate(-7deg)' }, { transform: 'translateY(0) rotate(-7deg)' }], { duration: 1800, delay: 1400, easing: 'ease-out', stagger: 150 });
    D.sound.thunder && D.sound.thunder();
    D.anim('.kw-light', [{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0.1 }, { opacity: 0.7 }, { opacity: 0 }], { duration: 700, easing: 'steps(5)' });
  });
}
/** 네온에 비친 두 눈 초근접 (형사: 눈을 가늘게 / 범인: 비웃듯 번뜩) */
function eyesShot(D, t0, who) {
  D.at(t0, () => {
    const bad = who === 'murderer';
    const skin = bad ? '#8a4a3a' : '#b8805e';
    const eye = (cx, flip) => `<g transform="translate(${cx} 450) scale(${flip} 1)">
      <path d="M-170 14Q-40 -80 170 -8Q40 70 -170 14Z" fill="#efe4d8"/>
      <circle cx="12" cy="-2" r="50" fill="${bad ? '#3a0a0a' : '#2a1a10'}"/><circle cx="12" cy="-2" r="22" fill="#050202"/>
      <circle cx="30" cy="-20" r="10" fill="#fff"/><path d="M-10 18 q20 10 40 0" stroke="${bad ? '#ff3a5a' : '#46f2e4'}" stroke-width="6" fill="none" opacity=".8"/>
      <path class="lid" d="M-180 14Q-40 -96 180 -10L180 -140L-180 -140Z" fill="${skin}"/>
      <path d="M-180 16Q-40 -98 180 -12" stroke="#1a0806" stroke-width="14" fill="none"/>
      <path d="M-190 -80Q-30 -140 190 -100" stroke="#140806" stroke-width="34" stroke-linecap="round" fill="none" class="brow"/></g>`;
    const r2 = rnd(who.length * 3);
    let pores = '';
    for (let i = 0; i < 160; i++) pores += `<circle cx="${f(r2() * 1600)}" cy="${f(r2() * 900)}" r="${f(1 + r2() * 1.6)}" fill="#2a1008" opacity=".25"/>`;
    D.cut(STYLE + svg(`<rect width="1600" height="900" fill="${skin}"/>${pores}
      <rect width="800" height="900" fill="${bad ? '#ff2a4a' : '#2af0e0'}" opacity=".22"/><rect x="800" width="800" height="900" fill="${bad ? '#2a3aff' : '#ff3a5a'}" opacity=".16"/>
      ${eye(470, 1)}${eye(1130, -1)}
      <path d="M760 280Q800 620 740 720Q800 760 860 720Q800 620 840 280Z" fill="#000" opacity=".14"/>
      <path d="M0 0H1600V200Q800 290 0 200Z" fill="#0a0404"/>
      <radialGradient id="eg" cx=".5" cy=".5" r=".7"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient><rect width="1600" height="900" fill="url(#eg)"/>`) + RAIN);
    D.anim('.an-shot > svg', [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 1800, easing: 'cubic-bezier(.2,.8,.2,1)' });
    // 눈꺼풀: 형사는 가늘게 좁히고, 범인은 한쪽 눈썹을 올리며 번뜩
    D.anim('.lid', bad
      ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }]
      : [{ transform: 'translateY(0)' }, { transform: 'translateY(30px)' }], { duration: 900, delay: 500, easing: 'ease-in-out' });
    D.anim('.brow', bad ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-30px) rotate(-3deg)' }] : [{ transform: 'translateY(0)' }, { transform: 'translateY(22px)' }], { duration: 900, delay: 500 });
    D.sound.heart && D.sound.heart();
  });
}
function evidenceShot(D, t0, murder, blowAway) {
  D.at(t0, () => {
    const lamp = svg('<defs><radialGradient id="lamp" cy=".35"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="#0e0a08"/><rect width="1600" height="900" fill="#3a2414" opacity=".6"/><path d="M0 900L0 560Q800 500 1600 560V900Z" fill="#2a1a10"/><ellipse cx="800" cy="360" rx="700" ry="520" fill="url(#lamp)"/>');
    D.cut(STYLE + lamp + `<div class="kw-cards"><div class="c1">${cardSvg(K.CARD[murder.means], { w: 300 })}</div><div class="c2">${cardSvg(K.CARD[murder.clue], { w: 300 })}</div></div><div class="kw-stamp">${blowAway ? '미제' : '증거'}</div>`);
    D.anim('.c1', [{ transform: 'translate(-60vw, 10vh) rotate(-40deg)' }, { transform: 'rotate(-6deg)' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
    D.anim('.c2', [{ transform: 'translate(60vw, 10vh) rotate(40deg)' }, { transform: 'rotate(5deg)' }], { duration: 700, delay: 250, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
    D.sound.card && D.sound.card();
  });
  D.at(t0 + 1.5, () => {
    D.anim('.kw-stamp', [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-12deg) scale(3)' }, { opacity: 0.92, transform: 'translate(-50%,-50%) rotate(-12deg) scale(1)' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    D.sound.stamp && D.sound.stamp();
    D.shake(10, 300);
  });
  if (blowAway) {
    D.at(t0 + 2.4, () => {
      D.anim('.c1', [{ transform: 'rotate(-6deg)' }, { transform: 'translate(-70vw,-40vh) rotate(-220deg)' }], { duration: 1300, easing: 'ease-in' });
      D.anim('.c2', [{ transform: 'rotate(5deg)' }, { transform: 'translate(80vw,-30vh) rotate(260deg)' }], { duration: 1400, easing: 'ease-in', delay: 150 });
      D.sound.rain && D.sound.rain();
    });
  }
}

/* ═════════ 그날 밤의 회상: 살인 수단 48가지마다 다른 범행 + 현장에 떨어진 단서 ═════════
   범인은 카드에 그려진 바로 그 물건을 쥐고, 수단마다 동작이 다르다. 푸른 기억 필터 · 번개 실루엣 */
const MEM_CSS = `<style>
.kw-memory .cn-root { filter: saturate(.6) contrast(1.06) brightness(.96); }
.kw-memory::after { content:''; position:absolute; inset:0; background: radial-gradient(120% 90% at 50% 50%, rgba(40,90,160,.14), rgba(8,16,40,.55)); mix-blend-mode: multiply; pointer-events:none; z-index:12; }
.kw-lightning { position:absolute; inset:0; background:#eef4ff; opacity:0; pointer-events:none; z-index:20; mix-blend-mode:screen; }
.kw-silh .pp { filter: brightness(0) !important; }
.kw-clue-tag { position:absolute; left:50%; top:16%; transform:translateX(-50%); z-index:25; padding:8px 22px; border:2px solid #ffd23a; border-radius:6px; background:rgba(10,8,4,.8);
  font: 700 clamp(15px,2vw,24px) 'Noto Sans KR',sans-serif; color:#fff4c8; letter-spacing:.06em; opacity:0; white-space:nowrap; box-shadow:0 0 30px rgba(255,210,58,.4); }
.kw-clue-tag b { color:#ffd23a; }
.kw-solve-stamp { position:absolute; left:50%; top:84%; z-index:26; padding:.06em .45em; border:.1em solid #ff3a4a; border-radius:8px; color:#ff3a4a;
  font: 900 clamp(28px,5vw,68px) 'Black Han Sans',sans-serif; letter-spacing:.12em; opacity:0; mix-blend-mode: screen; text-shadow: 0 0 18px rgba(255,58,74,.6); }
</style>`;
// 손에 쥐는 법: [회전, 손잡이 x, 손잡이 y, 크기] — 카드 그림(100×100)을 손목 기준으로
const GRIP = {
  knife: [134, 20, 80, 0.8], axe: [146, 30, 84, 0.95], hammer: [180, 50, 86, 0.85], pistol: [90, 22, 70, 0.75], shotgun: [-90, 70, 44, 1.1],
  syringe: [-47, 72, 30, 0.7], golf: [-33, 70, 18, 1.1], bat: [136, 24, 82, 1.05], scissors: [132, 36, 72, 0.7], bottle: [0, 50, 18, 0.85],
  shard: [180, 58, 80, 0.7], brick: [0, 50, 50, 0.75], pot: [0, 50, 60, 0.8], candle: [180, 50, 74, 0.8], trophy: [180, 50, 86, 0.8],
  ice: [0, 50, 50, 0.75], crowbar: [136, 26, 82, 1.05], pan: [-90, 86, 34, 0.9], harpoon: [135, 30, 70, 1.2], chainsaw: [90, 24, 40, 1],
  bow: [90, 24, 52, 1], sword: [180, 50, 84, 1.05], dumbbell: [0, 50, 50, 0.85], match: [150, 32, 84, 0.6], gas: [0, 48, 22, 0.85],
  firecracker: [0, 50, 40, 0.6], poison: [0, 50, 18, 0.7], pills: [0, 50, 40, 0.6], wine: [0, 70, 50, 0.7], acid: [0, 50, 20, 0.7],
  dryer: [180, 32, 80, 0.8], choco: [0, 50, 50, 0.7], mushroom: [0, 50, 60, 0.6], rope: [0, 50, 50, 0.7], cable: [0, 50, 50, 0.7],
  wire: [0, 50, 50, 0.7], fishline: [135, 20, 80, 1], chain: [0, 50, 50, 0.8], necktie: [0, 50, 10, 0.8], scarf: [0, 50, 20, 0.8],
  pillow: [0, 50, 50, 0.9], bag: [0, 50, 20, 0.8], snake: [0, 50, 50, 0.6], bee: [0, 50, 50, 0.6],
};
const objAt = (key, x, y, sc = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(-50 -50)">${OBJ[key] || ''}</g>`;
// 수단마다 동작 (kind) 과 세부
const MOVE = {
  knife: { kind: 'thrust', set: 'kitchen' }, scissors: { kind: 'thrust', n: 2, set: 'barber', sit: 1, stand: 852 }, syringe: { kind: 'jab' }, shard: { kind: 'grab' }, sword: { kind: 'slash', wide: 1, set: 'roofTop' },
  axe: { kind: 'woodchop', set: 'kitchen' }, chainsaw: { kind: 'saw', set: 'site' }, harpoon: { kind: 'throwSpear', set: 'pier' }, bow: { kind: 'arrow' },
  hammer: { kind: 'smash', n: 2, set: 'site' }, crowbar: { kind: 'smash', set: 'site' }, candle: { kind: 'smash', out: 1 },
  brick: { kind: 'drop', set: 'drop', debris: '#a8502a' }, pot: { kind: 'drop', set: 'drop', debris: '#5a3a1a', leaf: 1 },
  ice: { kind: 'drop', set: 'drop', debris: '#dff4ff' }, dumbbell: { kind: 'drop', set: 'drop', debris: '#8a8e98' }, trophy: { kind: 'drop', set: 'drop', debris: '#e8c040' }, bottle: { kind: 'smash', debris: '#6ab07a' },
  bat: { kind: 'swing' }, golf: { kind: 'swing', up: 1, set: 'roofTop' }, pan: { kind: 'swing', clang: 1, set: 'kitchen' },
  pistol: { kind: 'shoot' }, shotgun: { kind: 'shoot', big: 1 },
  poison: { kind: 'table', how: 'pour' }, pills: { kind: 'table', how: 'drop' }, mushroom: { kind: 'table', how: 'soup' },
  wine: { kind: 'offer' }, choco: { kind: 'offer', eat: 1 }, acid: { kind: 'splash' },
  snake: { kind: 'snake' }, bee: { kind: 'bees' },
  car: { kind: 'vehicle' }, bike: { kind: 'vehicle', small: 1 }, stairs: { kind: 'stairs' }, bathtub: { kind: 'tub', set: 'bath' },
  pillow: { kind: 'smother', set: 'bed', bed: 1 }, bag: { kind: 'smother' },
  rope: { kind: 'cord', color: '#c8a060', w: 8 }, cable: { kind: 'cord', color: '#1a1a1a', w: 6 }, wire: { kind: 'cord', color: '#c8ccd4', w: 3 },
  fishline: { kind: 'cord', color: '#e8f0f8', w: 2, set: 'pier' }, chain: { kind: 'cord', color: '#8a929e', w: 9, dash: '7 3', set: 'pier' }, necktie: { kind: 'cord', color: '#b8303a', w: 12 },
  scarf: { kind: 'cord', color: '#6a2a8a', w: 14 },
  match: { kind: 'fire' }, gas: { kind: 'fire', pour: 1 }, firecracker: { kind: 'boom' }, dryer: { kind: 'shock', set: 'bath', tub: 1 },
};
// 건네는 작은 소품 (손 좌표: 팔이 앞으로 뻗으면 +x 가 위쪽)
const WINE_GLASS = '<g transform="translate(0 18)"><path d="M-3 -10 V10" stroke="#e8eef4" stroke-width="3.4" stroke-linecap="round"/><path d="M-3 0 H24" stroke="#e8eef4" stroke-width="3"/>'
  + '<path d="M24 -15 Q58 -18 60 0 Q58 18 24 15 Z" fill="rgba(230,240,250,.3)" stroke="#eef4fa" stroke-width="2.4"/><path d="M27 -12 Q44 -13 45 0 Q44 13 27 12Z" fill="#8a1020"/><path d="M50 -10 Q56 -6 56 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>';
const CHOCO_BAR = '<g transform="translate(0 16)"><rect x="-4" y="-11" width="42" height="22" rx="2" fill="#5a2a14" stroke="#1a0e08" stroke-width="2"/><rect x="-4" y="-11" width="15" height="22" fill="#c8a040" stroke="#1a0e08" stroke-width="2"/><path d="M20 -11V11M29 -11V11" stroke="#3a1a0a" stroke-width="1.6"/></g>';
/** 식탁 위 물건: 잔 · 찻잔 · 국그릇 · 초콜릿 조각 (가운데 아래가 0,0) */
function dishSvg(what) {
  if (what === 'wine') return '<path d="M-2 0 H18 M8 0 V-26" stroke="#eef4fa" stroke-width="3" stroke-linecap="round"/><path d="M-6 -26 Q-8 -56 8 -58 Q24 -56 22 -26 Z" fill="rgba(230,240,250,.3)" stroke="#eef4fa" stroke-width="2.4"/><path d="M-5 -34 Q8 -30 21 -34 Q20 -27 8 -26 Q-4 -27 -5 -34Z" fill="#8a1020"/>';
  if (what === 'soup') return '<path d="M-26 -30 Q0 6 26 -30Z" fill="#f4f0e6" stroke="#1a0e08" stroke-width="3"/><path d="M-22 -28 H22" stroke="#c89040" stroke-width="5"/><path d="M-8 -34 q-5 -12 2 -22 M8 -34 q-5 -12 2 -22" stroke="#dfe8f0" stroke-width="2" fill="none" opacity=".7"/>';
  if (what === 'choco') return '<rect x="-12" y="-14" width="24" height="14" rx="2" fill="#5a2a14" stroke="#1a0e08" stroke-width="2"/><path d="M0 -14 V0" stroke="#3a1a0a" stroke-width="1.6"/>';
  // 찻잔
  return '<path d="M-16 -30 H16 L12 0 H-12Z" fill="#f4f0e6" stroke="#1a0e08" stroke-width="3"/><path d="M16 -24 q10 0 10 8 q0 8 -12 8" fill="none" stroke="#1a0e08" stroke-width="3"/><path d="M-14 -26 H14" stroke="#b8702a" stroke-width="4"/><path d="M-4 -34 q-4 -10 2 -18" stroke="#dfe8f0" stroke-width="2" fill="none" opacity=".7"/>';
}
/** 구룡의 술집 안: 비 내리는 창(맞은편 아파트가 보인다) · 술병 선반 · 전등 · 둥근 탁자와 의자 */
function barInterior() {
  const bottles = Array.from({ length: 14 }, (_, i) => `<rect x="${1210 + (i % 7) * 50}" y="${i < 7 ? 214 : 354}" width="20" height="${46 + (i % 3) * 8}" rx="6" fill="${['#2a6a3a', '#8a2a1a', '#c8a040', '#2a4a8a', '#6a1a4a'][i % 5]}" opacity=".9" stroke="#0a0806" stroke-width="2"/>`).join('');
  return `<defs><linearGradient id="barWall" x2="0" y2="1"><stop offset="0" stop-color="#3a1a14"/><stop offset="1" stop-color="#1a0c08"/></linearGradient>
      <radialGradient id="barLamp" cy=".2"><stop offset="0" stop-color="#ffd890" stop-opacity=".55"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs>
    <path fill-rule="evenodd" fill="url(#barWall)" d="M-100 -100 H1700 V840 H-100Z M40 30 H370 V450 H40Z"/>
    <rect x="30" y="20" width="350" height="440" fill="none" stroke="#1a0c06" stroke-width="18"/><path d="M205 30 V450 M40 240 H370" stroke="#1a0c06" stroke-width="10"/>
    <text x="205" y="505" text-anchor="middle" font-family="'Song Myung',serif" font-size="46" fill="#ff5a8a" opacity=".85">酒 吧</text>
    <rect x="1180" y="180" width="380" height="16" fill="#5a3a1a"/><rect x="1180" y="320" width="380" height="16" fill="#5a3a1a"/><rect x="1180" y="460" width="380" height="16" fill="#5a3a1a"/>${bottles}
    ${[620, 1000].map((x) => `<path d="M${x} 0 V120" stroke="#0a0806" stroke-width="3"/><path d="M${x - 40} 150 Q${x} 110 ${x + 40} 150Z" fill="#8a3a1a" stroke="#0a0806" stroke-width="3"/><ellipse cx="${x}" cy="300" rx="260" ry="240" fill="url(#barLamp)"/>`).join('')}
    <rect y="840" width="1600" height="200" fill="#2a1a10"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 100}" y="840" width="50" height="60" fill="#3a2414"/>`).join('')}`;
}
const tableSvg = '<g><ellipse cx="900" cy="706" rx="190" ry="26" fill="#5a3a1a" stroke="#1a0e08" stroke-width="5"/><path d="M892 720 V840 M840 840 H960" stroke="#3a2410" stroke-width="12"/>'
  + '<path d="M1040 780 H1130 V850 M1040 780 V850 M1120 700 V780" stroke="#3a2410" stroke-width="9" fill="none"/>'
  + '<path d="M680 780 H770 V850 M680 780 V850 M690 700 V780" stroke="#3a2410" stroke-width="9" fill="none"/></g>';
/* ═════════ 사건이 벌어지는 자리 (수단에 어울리는 곳) ═════════ */
// 포장마차 · 주방: 불 위의 웍 · 걸린 오리 · 도마
const kitchenSet = () => `<rect width="1600" height="900" fill="#2a1a12"/><rect y="560" width="1600" height="340" fill="#3a2418"/>
  <rect x="40" y="120" width="1520" height="440" fill="#4a3018"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${120 + i * 170} 120 v70" stroke="#2a1a10" stroke-width="5"/><path d="M${100 + i * 170} 190 q20 -34 40 0 q-4 60 -20 66 q-16 -6 -20 -66Z" fill="#a8502a" stroke="#1a0e08" stroke-width="3"/>`).join('')}
  <rect x="0" y="600" width="1600" height="40" fill="#8a8e98"/><rect x="0" y="640" width="1600" height="30" fill="#5a5e68"/>
  <g><ellipse cx="420" cy="600" rx="120" ry="34" fill="#2a2a30" stroke="#0a0806" stroke-width="6"/><ellipse cx="420" cy="590" rx="98" ry="26" fill="#1a1a20"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${360 + i * 20} 596 q6 -40 -4 -64 q16 22 10 64" fill="#ff8a2a" opacity=".8"/>`).join('')}<ellipse cx="420" cy="620" rx="150" ry="60" fill="#ff7a2a" opacity=".22"/></g>
  <rect x="1180" y="560" width="300" height="24" fill="#8a6a3a" stroke="#3a2410" stroke-width="4"/>
  <text x="1300" y="330" text-anchor="middle" font-family="'Song Myung',serif" font-size="90" fill="#ffd23a" opacity=".55">食堂</text>`;
// 욕실: 타일 · 욕조 · 거울 · 김
const bathSet = () => `<rect width="1600" height="900" fill="#1a2430"/>${Array.from({ length: 160 }, (_, i) => `<rect x="${(i % 16) * 100}" y="${Math.floor(i / 16) * 62}" width="96" height="58" fill="${(i + Math.floor(i / 16)) % 2 ? '#26323e' : '#222c38'}"/>`).join('')}
  <rect x="120" y="140" width="300" height="220" rx="10" fill="#38485a" stroke="#0e1620" stroke-width="8"/><rect x="140" y="160" width="260" height="180" rx="6" fill="#4a5e70" opacity=".8"/>
  <path d="M1420 620 h60 v-90 q0 -30 -40 -30" stroke="#b8c4cc" stroke-width="12" fill="none"/>
  <rect x="180" y="470" width="220" height="16" rx="8" fill="#6a7a88"/><path d="M230 486 q-10 90 6 120 M300 486 q8 90 -4 120" stroke="#cfd8e0" stroke-width="22" fill="none" opacity=".85"/>
  <rect y="840" width="1600" height="60" fill="#2a3642"/>`;
// 이발소: 회전 간판 · 거울 · 이발 의자
const barberSet = () => `<rect width="1600" height="900" fill="#2a2018"/><rect y="600" width="1600" height="300" fill="#3a2a1a"/>${Array.from({ length: 20 }, (_, i) => `<rect x="${i * 80}" y="600" width="40" height="300" fill="#44301e"/>`).join('')}
  <rect x="120" y="120" width="420" height="380" rx="8" fill="#0e1418" stroke="#8a6a3a" stroke-width="10"/><rect x="140" y="140" width="380" height="340" fill="#1a2630" opacity=".8"/>
  <rect x="1180" y="180" width="70" height="260" rx="35" fill="#f4f0e6" stroke="#1a0e08" stroke-width="5"/>
  ${Array.from({ length: 6 }, (_, i) => `<path d="M1180 ${200 + i * 44} q35 26 70 0 v22 q-35 26 -70 0Z" fill="${i % 2 ? '#c8202a' : '#2a4a9a'}"/>`).join('')}
  <rect x="620" y="300" width="360" height="30" fill="#5a4030"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${650 + i * 66}" y="250" width="26" height="50" rx="6" fill="${['#8ab0d8', '#c8a040', '#c85a5a', '#8ac89a', '#c8c8d8'][i]}" stroke="#1a0e08" stroke-width="3"/>`).join('')}`;
// 부두: 물결 · 배 · 그물 · 크레인
const pierSet = () => `<rect width="1600" height="900" fill="#0a1424"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 79) % 1600}" cy="${(i * 53) % 260}" r="1.6" fill="#fff" opacity=".5"/>`).join('')}
  <rect y="430" width="1600" height="200" fill="#12283c"/>${Array.from({ length: 22 }, (_, i) => `<path d="M${(i * 83) % 1600} ${450 + (i % 5) * 34} h60" stroke="#2a5a7a" stroke-width="3" opacity=".7"/>`).join('')}
  <path d="M0 620 H1600 V900 H0Z" fill="#3a2a1a"/>${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 90} 620 V900" stroke="#241a10" stroke-width="4"/>`).join('')}
  <g><path d="M1180 560 H1560 L1520 620 H1220Z" fill="#2a3a4a" stroke="#0a1018" stroke-width="5"/><path d="M1300 560 V430 H1320 V560" fill="#4a5a6a"/><path d="M1310 440 H1460 L1440 470 H1310" fill="#6a7a8a"/></g>
  <g>${[200, 320].map((x) => `<path d="M${x} 620 V560 q0 -20 20 -20 q20 0 20 20 V620" fill="none" stroke="#5a4a3a" stroke-width="14"/>`).join('')}</g>
  <text x="820" y="300" text-anchor="middle" font-family="'Song Myung',serif" font-size="80" fill="#3af0e0" opacity=".4">碼頭</text>`;
// 위에서 떨어뜨리기: 좁은 골목을 올려다본 구도 (옥상 난간이 위에 보인다)
const dropSet = () => `<rect width="1600" height="900" fill="#070a14"/>
  ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 111) % 1600}" cy="${(i * 37) % 230}" r="1.5" fill="#cfe0ff" opacity=".45"/>`).join('')}
  <ellipse cx="300" cy="300" rx="420" ry="120" fill="#ff5a8a" opacity=".10"/><ellipse cx="1300" cy="300" rx="420" ry="120" fill="#3af0e0" opacity=".08"/>
  <path d="M0 268 H560 V900 H0Z" fill="#1a2030"/><path d="M1040 300 H1600 V900 H1040Z" fill="#141a28"/>
  ${Array.from({ length: 15 }, (_, i) => `<rect x="${60 + (i % 3) * 170}" y="${340 + Math.floor(i / 3) * 120}" width="104" height="82" fill="${(i * 7) % 5 < 2 ? '#ffd890' : '#0b0f18'}" stroke="#090c12" stroke-width="4"/>`).join('')}
  ${Array.from({ length: 12 }, (_, i) => `<rect x="${1110 + (i % 3) * 160}" y="${380 + Math.floor(i / 3) * 124}" width="100" height="80" fill="${(i * 5) % 5 < 2 ? '#ffd890' : '#0b0f18'}" stroke="#090c12" stroke-width="4"/>`).join('')}
  <rect x="-20" y="236" width="600" height="34" rx="6" fill="#2e3748" stroke="#0a0c12" stroke-width="5"/><rect x="-20" y="262" width="600" height="12" fill="#161c28"/>
  <rect x="1020" y="270" width="600" height="32" rx="6" fill="#232b3a" stroke="#0a0c12" stroke-width="5"/>
  <path d="M560 268 H600 V900 H560Z M1000 300 H1040 V900 H1000Z" fill="#0d1120"/>
  ${Array.from({ length: 4 }, (_, i) => `<path d="M600 ${420 + i * 130} H1000" stroke="#2a3040" stroke-width="3" opacity=".5"/>`).join('')}
  <text x="300" y="640" text-anchor="middle" font-family="'Song Myung',serif" font-size="70" fill="#ff3a5a" opacity=".5">當</text>
  <text x="1320" y="560" text-anchor="middle" font-family="'Song Myung',serif" font-size="70" fill="#3af0e0" opacity=".45">藥</text>
  <rect y="818" width="1600" height="82" fill="#232c3a"/><rect y="818" width="1600" height="6" fill="#3a465a"/>
  ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${120 + i * 240}" cy="${846 + (i % 3) * 16}" rx="${70 + (i % 4) * 26}" ry="${9 + (i % 3) * 4}" fill="#4a6a8a" opacity=".3"/>`).join('')}
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${60 + i * 170}" y="826" width="90" height="${5 + (i % 3) * 4}" fill="#6a8aa8" opacity=".18"/>`).join('')}`;
// 옥상: 물탱크 · 빨랫줄 · 난간 너머 네온 도시
const roofSet = () => `<rect width="1600" height="900" fill="#070b16"/>
  ${Array.from({ length: 34 }, (_, i) => `<circle cx="${(i * 97) % 1600}" cy="${(i * 61) % 300}" r="1.6" fill="#cfe0ff" opacity=".4"/>`).join('')}
  ${Array.from({ length: 20 }, (_, i) => { const x = i * 84; const h = 90 + ((i * 47) % 190); return `<rect x="${x}" y="${560 - h}" width="74" height="${h}" fill="#101624"/>${Array.from({ length: 5 }, (_, k) => `<rect x="${x + 12 + (k % 2) * 34}" y="${572 - h + Math.floor(k / 2) * 40}" width="16" height="18" fill="${(i + k) % 3 ? '#0a0e18' : '#ffd890'}"/>`).join('')}`; }).join('')}
  <text x="240" y="470" font-family="'Song Myung',serif" font-size="66" fill="#ff3a5a" opacity=".45">旅館</text>
  <text x="1180" y="430" font-family="'Song Myung',serif" font-size="60" fill="#3af0e0" opacity=".4">麻雀</text>
  <rect y="560" width="1600" height="40" rx="8" fill="#2e3748" stroke="#0a0c12" stroke-width="5"/>
  <rect y="596" width="1600" height="304" fill="#2a2e38"/>
  ${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 120} 596 V900" stroke="#20242e" stroke-width="3"/>`).join('')}
  ${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${660 + i * 60} H1600" stroke="#20242e" stroke-width="3"/>`).join('')}
  <g transform="translate(120 330)"><rect width="230" height="230" rx="8" fill="#3a4050" stroke="#0a0c12" stroke-width="6"/><path d="M0 70 H230 M0 150 H230" stroke="#0a0c12" stroke-width="4"/><path d="M40 230 V300 M190 230 V300" stroke="#0a0c12" stroke-width="12"/><path d="M115 0 V-40 h60" stroke="#6a7484" stroke-width="10" fill="none"/></g>
  <path d="M420 300 H1180" stroke="#3a3020" stroke-width="4"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${470 + i * 170}" y="302" width="86" height="${110 + (i % 2) * 40}" rx="6" fill="${['#c8c0b0', '#8aa8c8', '#c88a8a', '#b0c8a8'][i]}" opacity=".85" stroke="#0a0c12" stroke-width="3"/>`).join('')}
  <ellipse cx="800" cy="880" rx="700" ry="40" fill="#0a0c12" opacity=".3"/>`;
// 여관방: 낡은 벽지 · 창밖 네온 · 선풍기 · 침대
const bedSet = () => `<rect width="1600" height="900" fill="#241c1a"/>
  ${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 92} 0 V640" stroke="#2c2220" stroke-width="30"/>`).join('')}
  <rect y="640" width="1600" height="260" fill="#342620"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 104} 640 V900" stroke="#2a1e1a" stroke-width="4"/>`).join('')}
  <g><rect x="120" y="130" width="330" height="290" fill="#0e1420" stroke="#5a4636" stroke-width="10"/><path d="M285 130 V420 M120 275 H450" stroke="#5a4636" stroke-width="7"/>
    <text x="285" y="250" text-anchor="middle" font-family="'Song Myung',serif" font-size="74" fill="#ff3a5a" opacity=".65">旅</text>
    <text x="285" y="370" text-anchor="middle" font-family="'Song Myung',serif" font-size="74" fill="#3af0e0" opacity=".5">館</text></g>
  <g transform="translate(1330 300)"><circle r="76" fill="none" stroke="#8a8e98" stroke-width="7"/>${[0, 1, 2].map((i) => `<path transform="rotate(${i * 120})" d="M0 0 Q40 -18 62 -46 Q30 -64 0 -10Z" fill="#9aa2ae"/>`).join('')}<circle r="14" fill="#5a6270"/><path d="M0 76 V180" stroke="#8a8e98" stroke-width="10"/><path d="M-40 180 H40" stroke="#5a6270" stroke-width="12"/></g>
  <g transform="translate(300 640)"><rect x="-70" y="-120" width="140" height="120" rx="8" fill="#4a3a2a" stroke="#1a100a" stroke-width="5"/><path d="M-34 -120 V-6" stroke="#1a100a" stroke-width="4"/>
    <path d="M-10 -190 h60 l14 70 h-88Z" fill="#e8c878" opacity=".9" stroke="#1a100a" stroke-width="4"/><ellipse cx="20" cy="-120" rx="120" ry="60" fill="#ffd890" opacity=".14"/></g>`;
// 공사장: 비계 · 철근 · 시멘트 포대 · 알전구
const siteSet = () => `<rect width="1600" height="900" fill="#0d1018"/>
  ${Array.from({ length: 5 }, (_, i) => `<path d="M${120 + i * 330} 0 V760" stroke="#6a5a3a" stroke-width="16"/>`).join('')}
  ${Array.from({ length: 4 }, (_, i) => `<path d="M60 ${120 + i * 180} H1560" stroke="#6a5a3a" stroke-width="12"/>`).join('')}
  ${Array.from({ length: 10 }, (_, i) => `<path d="M${120 + i * 160} ${120 + (i % 3) * 180} l160 180" stroke="#5a4a30" stroke-width="7"/>`).join('')}
  <rect y="760" width="1600" height="140" fill="#3a3a3e"/><rect y="760" width="1600" height="8" fill="#55555c"/>
  ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 1600}" cy="${790 + (i * 53) % 100}" r="${2 + (i % 3)}" fill="#55555c" opacity=".7"/>`).join('')}
  <g transform="translate(1180 700)">${[0, 1, 2].map((i) => `<rect x="${-90 + (i % 2) * 20}" y="${-60 * i}" width="180" height="56" rx="10" fill="#c8c0a8" stroke="#141008" stroke-width="5"/>`).join('')}</g>
  <g>${[0, 1, 2, 3, 4].map((i) => `<path d="M${200 + i * 26} 760 V560 q0 -26 26 -26" fill="none" stroke="#8a6a3a" stroke-width="7"/>`).join('')}</g>
  <path d="M780 0 V180" stroke="#0a0806" stroke-width="4"/><circle cx="780" cy="196" r="20" fill="#fff4c0"/><ellipse cx="780" cy="330" rx="520" ry="400" fill="#fff4c0" opacity=".12"/>
  <path d="M1360 300 h180 v120 h-180Z" fill="#d8b028" stroke="#141008" stroke-width="6"/><text x="1450" y="382" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="58" fill="#141008">危</text>`;
const VICTIM_K = { skin: '#e2b08a', skinD: '#a8765a', hair: '#3a2a20', coat: '#4a5a6a', coatD: '#2a3440', coat2: '#8a8a8a', shirt: '#e8e4dc', tie: '#2a3a5a', pants: '#2a2e36', pantsD: '#16181e', shoe: '#1a1410', hat: 'none', hairStyle: 'short', brow: '#3a2a20' };
function flashbackShot(D, t0, murder, { watcher = '', outcome = 'solved' } = {}) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    shot.classList.add('kw-memory');
    const mk = (K.CARD[murder.means] || {}).key || 'knife';
    const ck = (K.CARD[murder.clue] || {}).key || 'lipstick';
    const M = MOVE[mk] || { kind: 'smash' };
    const kind = M.kind;
    const indoor = kind === 'table' || kind === 'offer';
    const place = M.set || (indoor ? 'bar' : 'alley');
    const SETS = { kitchen: kitchenSet, bath: bathSet, barber: barberSet, pier: pierSet, drop: dropSet, roofTop: roofSet, bed: bedSet, site: siteSet };
    const outdoor = place === 'alley' || place === 'drop' || place === 'pier' || place === 'roofTop';
    const onBed = place === 'bed'; // 비 · 번개는 바깥에서만
    S.layer(0.3, BG(svg(SETS[place] ? SETS[place]() : alley({ seed: 17, fog: 0.35 }))));
    // 무대 소품: 탁자와 잔 · 계단 · 욕조
    let set = '<ellipse cx="1000" cy="846" rx="230" ry="18" fill="#9ab8e8" opacity=".14"/>';
    if (indoor) set += barInterior() + tableSvg;
    if (place === 'bath') set += '';
    if (onBed) set += '<g><rect x="430" y="690" width="1060" height="90" rx="12" fill="#cfc4b4" stroke="#1a100a" stroke-width="7"/><rect x="430" y="470" width="40" height="300" rx="10" fill="#4a3428" stroke="#140c08" stroke-width="6"/><rect x="1450" y="560" width="40" height="220" rx="10" fill="#4a3428" stroke="#140c08" stroke-width="6"/><path d="M470 470 H430 M470 520 H430" stroke="#140c08" stroke-width="5"/><rect x="500" y="640" width="230" height="86" rx="26" fill="#eae2d4" stroke="#1a100a" stroke-width="6"/></g>';
    if (M.sit) set += '<g transform="translate(1010 852)"><path d="M0 0 V26 M-56 26 H56 M-56 26 l-10 22 M56 26 l10 22" stroke="#9aa2ae" stroke-width="14" stroke-linecap="round"/><path d="M-86 0 V-40 Q-86 -58 -64 -58 H64 Q86 -58 86 -40 V0Z" fill="#7a1e28" stroke="#140a06" stroke-width="6"/><path d="M-74 -58 V-210 Q-74 -244 -30 -244 H30 Q74 -244 74 -210 V-58Z" fill="#8a2230" stroke="#140a06" stroke-width="6"/><path d="M-74 -150 H74" stroke="#5a1018" stroke-width="5"/><rect x="-104" y="-150" width="26" height="70" rx="8" fill="#5a1018" stroke="#140a06" stroke-width="5"/><rect x="78" y="-150" width="26" height="70" rx="8" fill="#5a1018" stroke="#140a06" stroke-width="5"/></g>'
    if (kind === 'stairs') set += '<path d="M1060 846 H1600 V900 H1060Z" fill="#0e1018"/>' + Array.from({ length: 6 }, (_, i) => `<path d="M${1060 + i * 70} ${846 + i * 40} h70 v40" fill="none" stroke="#6a7488" stroke-width="5"/>`).join('') + '<path d="M1060 846 L1480 1086" stroke="#3a4050" stroke-width="3"/>';
    if (kind === 'tub') set += objAt('bathtub', 1060, 800, 2.3);
    // 맞은편 아파트: 불 켜진 창 하나에서 누군가 내려다본다
    const WX = 202; // 아파트 창 가운데 (격자 창 4번 자리)
    const WY = 191;
    const apt = watcher ? `<g><rect x="40" y="30" width="330" height="420" fill="#141a2a"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${70 + (i % 3) * 100}" y="${60 + Math.floor(i / 3) * 96}" width="64" height="70" fill="${i === 4 ? '#ffd890' : i % 5 === 3 ? '#3a3020' : '#0a0e18'}"/>`).join('')}
      <path d="M${WX - 32} ${WY - 35} h20 C${WX - 18} ${WY - 5} ${WX - 22} ${WY + 20} ${WX - 32} ${WY + 35}Z M${WX + 32} ${WY - 35} h-20 C${WX + 18} ${WY - 5} ${WX + 22} ${WY + 20} ${WX + 32} ${WY + 35}Z" fill="#b8503a" opacity=".8"/>
      <rect x="${WX - 50}" y="${WY - 60}" width="100" height="120" fill="url(#aptGlow)" opacity=".5"/></g>` : '';
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible"><defs><radialGradient id="aptGlow"><stop offset="0" stop-color="#ffd890" stop-opacity=".8"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs>${apt}${set}</svg>`);
    const C = cast(L.el);
    // 창 안의 사람 (창틀 · 벽이 아랫몸을 가린다)
    let watcherP = null;
    if (watcher) {
      watcherP = C.add({ look: 'detective', x: WX - 6, y: WY + 150, scale: 0.36, rim: '#ffd890', shadow: false });
      L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible;pointer-events:none">
        <path fill-rule="evenodd" fill="#141a2a" d="M40 30 H370 V450 H40Z M${WX - 32} ${WY - 35} H${WX + 32} V${WY + 35} H${WX - 32}Z"/>
        ${Array.from({ length: 12 }, (_, i) => i === 4 ? '' : `<rect x="${70 + (i % 3) * 100}" y="${60 + Math.floor(i / 3) * 96}" width="64" height="70" fill="${i % 5 === 3 ? '#3a3020' : '#0a0e18'}"/>`).join('')}
        <rect x="${WX - 34}" y="${WY - 37}" width="68" height="74" fill="none" stroke="#3a2a1a" stroke-width="5"/><path d="M${WX} ${WY - 35} V${WY + 35}" stroke="#3a2a1a" stroke-width="3"/>
        <rect x="${WX - 40}" y="${WY + 35}" width="80" height="7" fill="#5a4a3a"/>
        <text class="kw-watch-name" x="${WX}" y="${WY - 46}" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="15" fill="#ffd890" stroke="#0a0806" stroke-width="3" paint-order="stroke" opacity="0">${esc(watcher)}</text></svg>`);
    }
    const fromRight = false;
    const faceOff = indoor; // 탁자에 앉아 왼쪽(탁자 · 맞은편)을 본다
    const vehicle = kind === 'vehicle';
    const mur = vehicle ? null : C.add({ look: 'murderer', x: fromRight ? 1750 : 80, y: 818, scale: 1.18, rim: '#c8d8ff', flip: fromRight, rimSide: fromRight ? -1 : 1 });
    const vic = C.add({ look: VICTIM_K, x: indoor ? 1080 : 1000, y: indoor ? 840 : 832, scale: 1.24, rim: indoor ? '#ffd890' : '#c8d8ff', flip: faceOff, rimSide: faceOff ? -1 : 1 });
    if (onBed) L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
      <path d="M470 742 H1430 Q1470 742 1470 782 V852 H470Z" fill="#6a4a58" stroke="#1a0e10" stroke-width="7"/>
      <path d="M470 742 H1430" stroke="#8a6a78" stroke-width="10"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${520 + i * 120} 752 q16 40 0 92" stroke="#57404c" stroke-width="6" fill="none"/>`).join('')}
      <rect x="470" y="852" width="980" height="22" rx="8" fill="#3a2a22" stroke="#140c08" stroke-width="5"/>
      <rect x="500" y="874" width="26" height="26" fill="#2a1e18"/><rect x="1380" y="874" width="26" height="26" fill="#2a1e18"/></svg>`);
    // 욕조 앞판은 배우보다 앞에 (물 속에 있는 것처럼)
    if (place === 'bath') L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
      <path d="M520 636 H1400 V800 Q1400 850 1340 850 H580 Q520 850 520 800Z" fill="#e8eef4" stroke="#0e1620" stroke-width="8"/>
      <path d="M520 636 H1400 V672 H520Z" fill="#9fd0ee"/>
      ${Array.from({ length: 11 }, (_, i) => `<path d="M${548 + i * 76} 654 q19 -13 38 0 q19 13 38 0" stroke="#dff0ff" stroke-width="4" fill="none" opacity=".75"/>`).join('')}
      <rect x="560" y="700" width="800" height="10" fill="#cfd8e0" opacity=".6"/></svg>`);
    const grip = (key) => { const g = GRIP[key] || [0, 50, 50, 0.8]; return `<g transform="scale(${g[3]}) rotate(${g[0]}) translate(${-g[1]} ${-g[2]})">${OBJ[key] || ''}</g>`; };
    if (mur && !['stairs', 'tub', 'smother'].includes(kind) && !(kind === 'cord')) mur.hold(grip(mk));
    if (mur && kind === 'cord') mur.hold(grip(mk));
    if (mur && kind === 'smother') mur.hold(null);
    if (mur && kind === 'fire' && M.pour) mur.hold(grip('gas'));
    if (mur && kind === 'offer') mur.hold(null);
    if (mur) mur.brow('angry');
    // 효과 층
    L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible;pointer-events:none">
      <path class="fx-cord" d="" fill="none" stroke="${M.color || '#c8a060'}" stroke-width="${M.w || 8}" ${M.dash ? `stroke-dasharray="${M.dash}"` : ''} stroke-linecap="round" opacity="0"/>
      <g class="fx-cover" opacity="0">${objAt(mk === 'bag' ? 'bag' : 'pillow', 0, 0, 0.9)}</g>
      <path class="fx-swoosh" d="" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0"/>
      <g class="fx-muzzle" opacity="0"><path d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10Z" fill="#fff4a0"/><circle r="14" fill="#fff"/></g>
      <g class="fx-parts"></g>
      <g class="fx-stars" opacity="0">${[0, 1, 2].map((i) => `<path transform="rotate(${i * 120})" d="M0 -34 L6 -24 L0 -14 L-6 -24Z" fill="#fff4a0"/>`).join('')}</g>
      <ellipse class="fx-fire" rx="90" ry="120" fill="#ff8a2a" opacity="0"/>
      <g class="fx-zap" opacity="0"><path d="M0 -120 L-20 -60 L10 -50 L-14 20 L30 -60 L0 -70 L20 -120Z" fill="#dff4ff" stroke="#8ad8ff" stroke-width="3"/></g>
      <g class="fx-proj" opacity="0"></g>
      <g class="fx-veh" opacity="0">${vehicle ? (M.small
        ? `<path d="M-190 -130 L-1000 -260 L-1000 20Z" fill="#fff8d0" opacity=".3"/><g transform="scale(-1 1)">${objAt(mk, 0, -150, 5)}</g>`
        : `<path d="M-300 -230 L-1100 -380 L-1100 -40Z" fill="#fff8d0" opacity=".3"/><g transform="scale(-1 1)">${objAt(mk, 0, -256, 8)}</g>`) : ''}</g>
      <text class="fx-text" x="0" y="0" font-family="'Black Han Sans',sans-serif" font-size="64" fill="#fff4a0" stroke="#1a0e08" stroke-width="4" paint-order="stroke" opacity="0" text-anchor="middle"></text>
      <g class="fx-clue" opacity="0">${objAt(ck, 0, 0, 0.9)}</g>
      ${indoor ? `<g class="kw-vdish">${dishSvg(M.how === 'soup' ? 'soup' : M.eat ? 'choco' : mk === 'wine' ? 'wine' : 'tea')}</g>${kind === 'offer' && !M.eat ? `<g class="kw-mdish">${dishSvg('wine')}</g>` : ''}` : ''}
      <ellipse class="fx-spot" rx="120" ry="34" fill="#ffe8a0" opacity="0"/></svg>`);
    const q = (c) => L.el.querySelector(c);
    const cord = q('.fx-cord'), cover = q('.fx-cover'), swoosh = q('.fx-swoosh'), muzzle = q('.fx-muzzle'), parts = q('.fx-parts'), stars = q('.fx-stars');
    const fire = q('.fx-fire'), zap = q('.fx-zap'), proj = q('.fx-proj'), veh = q('.fx-veh'), txt = q('.fx-text'), clueEl = q('.fx-clue'), spot = q('.fx-spot');
    const cup = L.el.querySelector('.kw-cup');
    const rn = outdoor ? rain(shot, { groundY: place === 'pier' ? 0.86 : 0.8 }) : () => {};
    const standX0 = { table: 880, offer: 780, woodchop: 770, hurl: 520, grab: 880, shoot: M.big ? 560 : 520, arrow: 380, throwSpear: 420, fire: 620, boom: 600, shock: 700, splash: 860, snake: 640, bees: 700, stairs: 840, tub: 880, saw: 800, swing: 790, chop: 800, thrust: 806, jab: 820, slash: 800, smash: 800, cord: 850, smother: 850 }[kind] || 810;
    const standX = M.stand || standX0;
    const HIT = { table: 4.4, offer: 4.4, cord: 2.9, snake: 3.4, bees: 3.2, vehicle: 2.6, arrow: 3.1, throwSpear: 3.0 }[kind] || 3.1;
    const END = kind === 'drop' ? 4.6 : 4.4; // 이 뒤로는 범인이 달아나고 단서가 떨어진다
    const clueX = place === 'bath' ? 340 : kind === 'drop' ? 560 : kind === 'vehicle' ? 900 : indoor ? 760 : 860;
    const cam = camPath(S.cam, [
      [0, { x: kind === 'drop' ? 760 : indoor ? 900 : 660, y: kind === 'drop' ? 430 : 520, z: kind === 'drop' ? 0.86 : 1.08 }],
      ...(kind === 'drop'
        ? [[1.7, { x: 700, y: 440, z: 0.86 }], [2.4, { x: 680, y: 490, z: 0.92 }], [3.05, { x: 640, y: 620, z: 1.25 }], [3.8, { x: 660, y: 700, z: 1.3 }]]
        : [[2.3, { x: (standX + 1000) / 2, y: 520, z: 1.3 }], [HIT, { x: (standX + 1000) / 2 + 20, y: 540, z: 1.42 }]]),
      [END + 0.4, { x: 940, y: 600, z: 1.12 }],
      [END + 1.2, { x: clueX, y: 780, z: 2.0 }],
      [END + 2.2, { x: clueX, y: 790, z: 2.2 }],
      ...(watcher ? [[END + 2.8, { x: 600, y: 420, z: 1.05 }], [END + 3.8, { x: WX + 4, y: WY + 6, z: 3.4 }], [END + 5.2, { x: WX + 4, y: WY + 8, z: 3.6 }]] : []),
    ]);
    const once = {};
    const at = (k, fn) => { if (!once[k]) { once[k] = 1; fn(); } };
    const flashL = () => {
      if (!outdoor) { L.el.animate([{ filter: 'brightness(1.8)' }, { filter: 'none' }], { duration: 200 }); return; }
      const l = document.createElement('div');
      l.className = 'kw-lightning';
      shot.appendChild(l);
      l.animate([{ opacity: 0 }, { opacity: 0.42, offset: 0.1 }, { opacity: 0.06, offset: 0.25 }, { opacity: 0.3, offset: 0.35 }, { opacity: 0 }], { duration: 420 });
      l.addEventListener('finish', () => l.remove());
      // 번개가 치는 0.35초만 실루엣 (끝나면 저절로 풀린다)
      L.el.animate([{ filter: 'brightness(.12)' }, { filter: 'brightness(.12)', offset: 0.6 }, { filter: 'none' }], { duration: 300 });
    };
    const softFlash = (peak) => {
      const f = document.createElement('div');
      f.style.cssText = 'position:absolute;inset:0;background:#fff;pointer-events:none;opacity:0';
      shot.appendChild(f);
      f.animate([{ opacity: 0 }, { opacity: peak, offset: 0.25 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = () => f.remove();
    };
    const impact = (power = 10, light = true) => { if (light) flashL(); D.shake(power, 320); softFlash(outdoor ? 0.5 : 0.3); D.sound.thunder && D.sound.thunder(); };
    const burst = (x, y, color, n = 12, spread = 140, size = 5, up = 80) => {
      for (let i = 0; i < n; i++) {
        const d = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        d.setAttribute('width', size); d.setAttribute('height', size * 0.7); d.setAttribute('fill', color);
        parts.appendChild(d);
        const a = (Math.random() - 0.5) * Math.PI;
        d.animate([{ transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${x + Math.sin(a) * spread}px, ${y - up * Math.random() + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 500, fill: 'forwards', easing: 'cubic-bezier(.2,.6,.4,1)' });
      }
    };
    const say2 = (x, y, word) => { txt.textContent = word; txt.setAttribute('x', x); txt.setAttribute('y', y); txt.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.3 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }); txt.style.transformOrigin = `${x}px ${y}px`; };
    const seg = (s, a, b) => Math.max(0, Math.min(1, (s - a) / (b - a)));
    const STAND = { ...POSE.stand };
    const FALL = { chest: 30, neck: 20, head: 26, upperF: 40, foreF: -10, upperB: 30, foreB: -10, thighF: -20, thighB: 10 };
    const mid = () => vic.point('chest', 0, -40);
    const head = () => vic.point('head', 10, -50);
    let last = 0;
    let stuck = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      rn(dt);
      const walkEnd = kind === 'table' ? 1.6 : 2.2;
      const x0 = fromRight ? 1750 : 80;
      let mx = s < walkEnd ? x0 + (standX - x0) * (s / walkEnd) : standX;
      const sneak = { hipY: 14, chest: 14, upperF: -40, foreF: -30 };
      let mp = s < walkEnd ? { ...STAND, ...gait((s * 0.9) % 1), ...sneak } : { ...STAND, ...sneak };
      let mflip = fromRight;
      // 피해자: 네온을 올려다보며 담배를 문다
      let vp = { ...STAND, upperF: -70, foreF: -120, head: -8 + Math.sin(s * 1.3) * 2 };
      let vrot = 0;
      let vx = 1000;
      let vy = 832;
      const fall = (a, b, dir = 1) => { const k = ease.inOut(seg(s, a, b)); vrot = dir * k * 82; vy = 832 + k * 6; vp = mixPose(vp, { ...STAND, ...FALL }, k); };
      const raise = (from, to, a, b) => mixPose(from, to, seg(s, a, b));
      const UP1 = { upperF: -172, foreF: -24, chest: -6 };
      const UP2 = { upperF: -175, foreF: -50, upperB: -170, foreB: -50, chest: -10 };
      const DOWN1 = { upperF: -50, foreF: -8, chest: 16 };
      const DOWN2 = { upperF: -60, foreF: -10, upperB: -55, foreB: -10, chest: 22 };
      const swooshAt = (on) => {
        if (!on || !mur) { swoosh.setAttribute('opacity', 0); return; }
        const a = mur.point('handF', 0, 90);
        swoosh.setAttribute('d', `M${a.x - 40} ${a.y - 140} Q${a.x + 60} ${a.y - 90} ${a.x} ${a.y}`);
        swoosh.setAttribute('opacity', 0.8);
      };
      switch (kind) {
        case 'thrust': case 'jab': {
          const n = M.n || 1;
          const pull = { upperF: -50, foreF: -110, chest: -8, hipX: -8 };
          const hit = { upperF: kind === 'jab' ? -112 : -88, foreF: kind === 'jab' ? -6 : 0, handF: 6, chest: 16, hipX: 12 };
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, pull, 2.2, 2.7) };
          for (let i = 0; i < n; i++) {
            const h = HIT + i * 0.45;
            if (s > h - 0.12 && s < h + 0.3) mp = { ...STAND, ...mixPose(pull, hit, seg(s, h - 0.12, h)) };
            if (s > h) at(`hit${i}`, () => impact(i ? 7 : 10, i === 0));
          }
          if (M.sit) {
            // 이발 의자에 기대 눈을 감고 있던 손님 (뒤에서 목으로)
            vx = 1000; vy = 846;
            vp = { ...STAND, ...POSE.sit, chest: -6, neck: 4, head: 2, upperF: -6, foreF: -76, upperB: -4, foreB: -72 };
            if (s > HIT) {
              const k2 = seg(s, HIT, HIT + 0.9);
              vp = mixPose({ ...STAND, ...POSE.sit, chest: -18, neck: -10, head: -14, upperF: -80, foreF: -110, upperB: -70, foreB: -100 },
                { ...STAND, ...POSE.sit, chest: 26, neck: 18, head: 30, upperF: 16, foreF: -14, upperB: 12, foreB: -12 }, k2);
              vrot = -k2 * 4;
            }
          } else if (s > HIT) { vp = { ...STAND, chest: -20, head: -26, upperF: -110, upperB: -90 }; fall(HIT + 0.3 + (n - 1) * 0.45, HIT + 1 + (n - 1) * 0.45); }
          break;
        }
        case 'slash': {
          const from = { upperF: 30, foreF: -40, chest: -10 };
          const to = { upperF: M.wide ? -150 : -120, foreF: -10, chest: 18 };
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, from, 2.2, 2.8) };
          if (s > HIT - 0.15) mp = { ...STAND, ...mixPose(from, to, seg(s, HIT - 0.15, HIT)) };
          swooshAt(s > HIT - 0.15 && s < HIT + 0.1);
          if (s > HIT) { at('hit', () => impact(11)); vp = { ...STAND, chest: -14, head: -20, upperF: -120, upperB: -100 }; fall(HIT + 0.3, HIT + 1); }
          break;
        }
        case 'chop': case 'smash': {
          const two = kind === 'chop' || M.two;
          const n = M.n || 1;
          const up = two ? UP2 : UP1;
          const down = two ? DOWN2 : DOWN1;
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, up, 2.2, 2.8) };
          for (let i = 0; i < n; i++) {
            const h = HIT + i * 0.55;
            if (s > h - 0.15) mp = { ...STAND, ...mixPose(up, down, seg(s, h - 0.15, h)) };
            if (i < n - 1 && s > h + 0.1 && s < h + 0.4) mp = { ...STAND, ...mixPose(down, up, seg(s, h + 0.1, h + 0.4)) };
            if (s > h) at(`hit${i}`, () => {
              impact(two ? 16 : 12, i === 0);
              const hp = head();
              stars.animate([{ opacity: 1, transform: `translate(${hp.x}px, ${hp.y}px) rotate(0deg)` }, { opacity: 0, transform: `translate(${hp.x}px, ${hp.y - 30}px) rotate(200deg)` }], { duration: 900, fill: 'forwards' });
              if (M.debris) { burst(hp.x, hp.y + 20, M.debris, 18, 180, 7); if (i === n - 1 && mur) mur.hold(null); }
              if (M.leaf) burst(hp.x, hp.y, '#3a8a3a', 6, 120, 9);
              if (M.out) setTimeout(() => mur && mur.hold(grip('candle').replace(/#ffcf5a|#ffd070|#ffe08a|#f8b040/g, 'none')), 120);
            });
          }
          swooshAt(s > HIT - 0.15 && s < HIT + 0.08);
          const last2 = HIT + (n - 1) * 0.55;
          if (s > HIT) { vp = { ...STAND, chest: -18, head: 32, upperF: -100, upperB: -80 }; fall(last2 + 0.3, last2 + 1); }
          break;
        }
        case 'swing': {
          const back = M.up ? { upperF: 40, foreF: -10, upperB: 50, foreB: -10, chest: 16 } : { upperF: 60, foreF: -20, upperB: 70, foreB: -20, chest: -10 };
          const thru = M.up ? { upperF: -170, foreF: -10, upperB: -160, foreB: -10, chest: -14 } : { upperF: -100, foreF: -10, upperB: -95, foreB: -10, chest: 16 };
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, back, 2.2, 2.9) };
          if (s > HIT - 0.15) mp = { ...STAND, ...mixPose(back, thru, seg(s, HIT - 0.15, HIT + 0.05)) };
          swooshAt(s > HIT - 0.15 && s < HIT + 0.1);
          if (s > HIT) {
            at('hit', () => { impact(14); if (M.clang) { const hp = head(); say2(hp.x + 40, hp.y - 40, '쾅!'); } });
            vp = { ...STAND, chest: -16, head: M.up ? -34 : 34, upperF: -110, upperB: -90 };
            fall(HIT + 0.3, HIT + 1);
          }
          break;
        }
        case 'woodchop': {
          // 도끼: 어깨 뒤로 크게 젖혔다가 옆으로 크게 휘두른다 (장작 패듯)
          const back = { upperF: 80, foreF: -30, upperB: 70, foreB: -30, chest: -20, hipX: -10 };
          const thru = { upperF: -96, foreF: -8, upperB: -90, foreB: -10, chest: 24, hipX: 10 };
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, back, 2.2, 2.95) };
          if (s > HIT - 0.12) mp = { ...STAND, ...mixPose(back, thru, seg(s, HIT - 0.12, HIT + 0.05)) };
          if (s > HIT - 0.12 && s < HIT + 0.14) {
            const a = mur.point('handF', 0, 110);
            swoosh.setAttribute('d', `M${a.x - 220} ${a.y - 10} Q${a.x - 60} ${a.y + 40} ${a.x + 40} ${a.y}`);
            swoosh.setAttribute('stroke-width', 14);
            swoosh.setAttribute('opacity', 0.85);
          } else swoosh.setAttribute('opacity', 0);
          if (s > HIT) {
            at('hit', () => { impact(22); const hp = head(); say2(hp.x + 60, hp.y - 20, '퍽!'); });
            // 휙 돌아 무릎이 꺾이고 앞으로 쓰러진다
            const k = seg(s, HIT, HIT + 0.5);
            vp = k < 1 ? { ...STAND, chest: 20, head: 30, upperF: -60, upperB: 40 } : { ...STAND, ...POSE.kneel, chest: 40, head: 30, upperF: 30, upperB: 20 };
            if (s > HIT + 0.15 && s < HIT + 0.35) vp = { ...vp, flip: true };
            if (s > HIT + 1.2) { const f2 = ease.inOut(seg(s, HIT + 1.2, HIT + 1.6)); vrot = f2 * 80; vp = mixPose({ ...STAND, ...POSE.kneel, chest: 40 }, { ...STAND, ...FALL }, f2); }
          }
          break;
        }
        case 'hurl': {
          // 화분: 떨어진 곳에서 두 손으로 번쩍 들어 던진다 → 머리에 맞아 박살
          const lift = { upperF: -175, foreF: -60, upperB: -170, foreB: -60, chest: -18 };
          const toss = { upperF: -80, foreF: -10, upperB: -78, foreB: -10, chest: 22 };
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, lift, 2.2, 2.8) };
          if (s > 2.95) mp = { ...STAND, ...mixPose(lift, toss, seg(s, 2.95, 3.1)) };
          if (s > 3.0) at('throw', () => {
            mur.hold(null);
            const a = mur.point('handF', 0, 30);
            const b = head();
            proj.innerHTML = objAt('pot', 0, 0, 0.9);
            proj.animate([
              { opacity: 1, transform: `translate(${a.x}px, ${a.y}px) rotate(0deg)` },
              { opacity: 1, transform: `translate(${(a.x + b.x) / 2}px, ${Math.min(a.y, b.y) - 170}px) rotate(200deg)` },
              { opacity: 1, transform: `translate(${b.x}px, ${b.y}px) rotate(400deg)` },
            ], { duration: 520, fill: 'forwards', easing: 'ease-in' });
          });
          if (s > 3.52) at('hit', () => {
            proj.style.opacity = 0;
            const hp = head();
            impact(14);
            burst(hp.x, hp.y, '#5a3a1a', 22, 200, 8, 160);
            burst(hp.x, hp.y, '#c06a3a', 10, 220, 14, 180);
            burst(hp.x, hp.y, '#3a8a3a', 7, 160, 10, 120);
            say2(hp.x + 50, hp.y - 30, '쨍그랑!');
          });
          if (s > 3.52) {
            // 무릎부터 꺾이며 제자리에 주저앉는다
            const k = ease.inOut(seg(s, 3.6, 4.2));
            vp = mixPose({ ...STAND, head: 26, chest: 10, upperF: -140, upperB: -130 }, { ...STAND, ...POSE.kneel, chest: 50, head: 40, upperF: 30, upperB: 30 }, k);
            if (s > 4.4) { const f2 = ease.inOut(seg(s, 4.4, 4.8)); vrot = f2 * 84; vp = mixPose(vp, { ...STAND, ...FALL }, f2); }
          }
          break;
        }
        case 'grab': {
          // 깨진 유리: 바짝 붙어 어깨를 잡고, 짧게 두 번 긋는다 → 목을 움켜쥐고 비틀거린다
          if (s > 2.2) mp = { ...STAND, upperB: -84, foreB: -6, upperF: -30, foreF: -120, chest: 10, hipX: 6 };
          const cuts = [HIT - 0.2, HIT + 0.25];
          cuts.forEach((c0, i) => {
            if (s > c0 - 0.08 && s < c0 + 0.12) mp = { ...mp, upperF: -70 - seg(s, c0 - 0.08, c0 + 0.08) * 60, foreF: -40 };
            if (s > c0) at(`cut${i}`, () => {
              const n = vic.point('neck', 8, -6);
              impact(i ? 6 : 9, i === 0);
              for (let k = 0; k < 5; k++) { const g2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); g2.setAttribute('d', 'M0 -8 L2 0 L0 8 L-2 0Z M-8 0 L0 2 L8 0 L0 -2Z'); g2.setAttribute('fill', '#ffffff'); parts.appendChild(g2); g2.animate([{ transform: `translate(${n.x + (k - 2) * 10}px, ${n.y}px) scale(.4)`, opacity: 1 }, { transform: `translate(${n.x + (k - 2) * 26}px, ${n.y - 30 - k * 6}px) scale(1.2)`, opacity: 0 }], { duration: 500, fill: 'forwards' }); }
            });
          });
          if (s > HIT + 0.5) mp = { ...STAND, upperF: -86, foreF: -4, upperB: -80, foreB: -6, chest: 18 };
          if (s > HIT - 0.2) {
            vp = { ...STAND, upperF: -160, foreF: -150, handF: -20, upperB: -40, head: -10, chest: -6 };
            if (s > HIT + 0.55) vx = 1000 + ease.out(seg(s, HIT + 0.55, HIT + 1.2)) * 110;
            if (s > HIT + 0.55) vp = { ...vp, chest: 14 + Math.sin(s * 9) * 6, head: 12 };
            fall(HIT + 1.3, HIT + 1.8);
          }
          break;
        }
        case 'drop': {
          // 옥상에서 떨어뜨린다: 난간 너머로 몸을 내밀어 손을 놓는다 → 그림자가 커지고 → 정수리
          const DX = 620;          // 떨어지는 선 (왼쪽 옥상 난간 바로 아래)
          const REL = 1.7;         // 손을 놓는 순간
          const LAND = 3.05;       // 정수리에 닿는 순간
          const Y0 = 270;
          if (mur) mur.set({ y: 246, scale: 0.5 });
          mx = 430; mflip = false;
          // 난간에 매달리듯 몸을 내밀고 두 팔로 들었다가 놓는다
          mp = s < REL
            ? { ...STAND, chest: 46, neck: -22, head: -18, upperF: -150, foreF: -34, upperB: -146, foreB: -34, hipY: 16 }
            : { ...STAND, chest: 40, neck: -20, head: -16, upperF: -110, foreF: -10, upperB: -104, foreB: -10, hipY: 10 };
          // 피해자: 우산도 없이 목을 움츠리고 걸어와 하필 그 자리에서 멈춰 담배에 불을 붙인다
          if (s < 1.9) { vp = { ...STAND, ...gait((s * 0.85) % 1), chest: 8, head: -4 }; vx = 1180 - (s / 1.9) * 560; }
          else { vp = { ...STAND, upperF: -64, foreF: -118, head: -6 + Math.sin(s * 2) * 2, chest: 6 }; vx = DX; }
          if (s >= REL && s < LAND) {
            at('rel', () => { if (mur) mur.hold(null); });
            const k = seg(s, REL, LAND);
            const y = Y0 + (head().y - 16 - Y0) * k * k;
            proj.setAttribute('opacity', 1);
            if (!proj.firstChild) proj.innerHTML = objAt(mk, 0, 0, 1.7);
            proj.setAttribute('transform', `translate(${DX + 6} ${y}) rotate(${k * 200})`);
            // 발밑에 커지는 그림자 (올려다보지 않는 피해자)
            spot.setAttribute('cx', DX + 6); spot.setAttribute('cy', 842);
            spot.setAttribute('rx', 26 + k * 46); spot.setAttribute('ry', 9 + k * 15);
            spot.setAttribute('fill', '#000');
            spot.setAttribute('opacity', 0.12 + k * 0.4);
          }
          if (s >= LAND) {
            at('hit', () => {
              spot.setAttribute('opacity', 0);
              // 정수리를 때린 물건이 튕겨 바닥에 떨어져 뒹군다
              const hp0 = head();
              proj.setAttribute('transform', '');
              proj.animate([
                { opacity: 1, transform: `translate(${hp0.x + 6}px, ${hp0.y - 16}px) rotate(0deg)` },
                { opacity: 1, transform: `translate(${hp0.x + 90}px, ${hp0.y + 40}px) rotate(120deg)`, offset: 0.35 },
                { opacity: 1, transform: `translate(${hp0.x + 150}px, 838px) rotate(250deg)`, offset: 0.7 },
                { opacity: 1, transform: `translate(${hp0.x + 176}px, 846px) rotate(268deg)` },
              ], { duration: 700, fill: 'forwards', easing: 'cubic-bezier(.4,0,.7,1)' });
              const hp = head();
              impact(13, false);
              burst(hp.x, hp.y - 10, M.debris || '#a8502a', 22, 190, 9, 170);
              if (M.leaf) burst(hp.x, hp.y - 10, '#3a8a3a', 8, 150, 11, 130);
              stars.animate([{ opacity: 1, transform: `translate(${hp.x}px, ${hp.y - 20}px) rotate(0deg)` }, { opacity: 0, transform: `translate(${hp.x}px, ${hp.y - 54}px) rotate(300deg)` }], { duration: 1100, fill: 'forwards' });
              say2(hp.x + 120, hp.y - 40, '퍽!');
            });
            // 무릎이 꺾이며 그 자리에 무너진다
            vx = DX;
            const kk = seg(s, LAND, LAND + 0.55);
            vp = mixPose({ ...STAND, chest: 18, neck: 14, head: 26, upperF: -120, foreF: -60, upperB: -110, foreB: -60 }, { ...STAND, ...POSE.kneel, chest: 54, neck: 22, head: 34, upperF: -20, foreF: -20 }, kk);
            fall(LAND + 0.5, LAND + 1.1);
          }
          break;
        }
        case 'saw': {
          if (s > 2.2) mp = { ...STAND, upperF: -82, foreF: -6, upperB: -78, foreB: -8, chest: 10 + Math.sin(s * 60) * 1.5 };
          if (s > 2.4 && s < HIT + 0.9 && Math.random() < 0.6) { const a = mur.point('handF', 0, 120); burst(a.x, a.y, '#ffd070', 2, 80, 3, 60); }
          if (s > HIT) { at('hit', () => impact(12)); vp = { ...STAND, chest: -20, head: -24, upperF: -130, upperB: -120 }; fall(HIT + 0.8, HIT + 1.5); }
          break;
        }
        case 'throwSpear': case 'arrow': {
          if (kind === 'arrow') { if (s > 2.2) mp = { ...STAND, upperF: -90, foreF: 0, upperB: -86, foreB: s < HIT ? -140 * seg(s, 2.4, 2.9) : 0, chest: -4 }; }
          else if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, { upperF: -160, foreF: -40, chest: -12 }, 2.2, 2.8) };
          if (kind === 'throwSpear' && s > HIT - 0.15) mp = { ...STAND, upperF: -90, foreF: 0, chest: 18 };
          if (s > HIT - 0.12) at('fly', () => {
            const a = mur.point('handF', 0, 60);
            const b = mid();
            if (kind === 'throwSpear') mur.hold(null);
            proj.innerHTML = objAt(kind === 'arrow' ? 'harpoon' : 'harpoon', 0, 0, kind === 'arrow' ? 0.8 : 1.2, 45);
            proj.animate([{ opacity: 1, transform: `translate(${a.x}px, ${a.y}px)` }, { opacity: 1, transform: `translate(${b.x}px, ${b.y}px)` }], { duration: 160, fill: 'forwards' });
          });
          if (s > HIT) {
            at('hit', () => { impact(11); proj.getAnimations().forEach((an) => an.cancel()); proj.style.opacity = 1; });
            vp = { ...STAND, chest: -18, head: -22, upperF: -120, upperB: -110 };
            fall(HIT + 0.35, HIT + 1.05);
            stuck = true;
          }
          break;
        }
        case 'shoot': {
          const aim = seg(s, 2.2, 2.7);
          const kick = s > HIT && s < HIT + (M.big ? 0.3 : 0.18) ? 1 : 0;
          mp = { ...STAND, ...mixPose({ upperF: -40, foreF: -30 }, { upperF: -88 - kick * (M.big ? 40 : 30), foreF: -2, upperB: M.big ? -84 : -10, foreB: M.big ? -30 : -20, head: -2 }, aim), chest: -kick * (M.big ? 14 : 6), hipX: -kick * (M.big ? 20 : 0) };
          if (s > HIT) {
            at('hit', () => {
              const m = mur.point('handF', 0, M.big ? 130 : 100);
              muzzle.animate([{ opacity: 1, transform: `translate(${m.x}px, ${m.y}px) scale(${M.big ? 2.2 : 1.4})` }, { opacity: 0, transform: `translate(${m.x}px, ${m.y}px) scale(.6)` }], { duration: M.big ? 260 : 160, fill: 'forwards' });
              burst(m.x, m.y, '#c8ccd8', M.big ? 14 : 8, 120, 10, 160);
              impact(M.big ? 20 : 12);
            });
            vp = { ...STAND, chest: -18, head: -24, upperF: -110, upperB: -90 };
            if (M.big) vx = 1000 + ease.out(seg(s, HIT, HIT + 0.4)) * 120;
            fall(HIT + 0.3, HIT + 1.1);
          }
          break;
        }
        case 'table': case 'offer': {
          const vd = L.el.querySelector('.kw-vdish');
          const md = L.el.querySelector('.kw-mdish');
          const TABLE_V = { x: 960, y: 700 };
          const TABLE_M = { x: 830, y: 700 };
          const SIT_V = { ...STAND, ...POSE.sit };
          // 범인: 건네기 → 맞은편에 앉아 있다 / 탁자 → 지나가며 몰래 넣고 떠난다
          if (kind === 'offer') {
            mx = 740;
            mp = { ...STAND, ...POSE.sit, upperF: -30, foreF: -60, head: 2 };
            if (M.eat && s > 2.2 && s < 3.2) mp = { ...STAND, ...POSE.sit, upperF: -70, foreF: -10, chest: 14 };
          } else {
            const walk = s < 1.6;
            mx = walk ? 80 + (standX - 80) * (s / 1.6) : s < 3.0 ? standX : standX - (s - 3.0) * 420;
            mp = walk ? { ...STAND, ...gait((s * 0.9) % 1), ...sneak } : { ...STAND, ...sneak };
            const pour = seg(s, 1.7, 2.0) * (1 - seg(s, 2.7, 2.9));
            if (s >= 1.6 && s < 3.0) mp = { ...mp, ...mixPose({ upperF: -40, foreF: -30 }, { upperF: -70, foreF: -60, handF: -110, chest: 20 }, pour) };
            if (s > 3.0) { mp = { ...STAND, ...gait(((s - 3) * 1.1) % 1) }; mflip = true; }
            if (s > 1.9 && s < 2.7) at('drip', () => {
              const color = M.how === 'drop' ? '#f4f0e6' : M.how === 'soup' ? '#c8302a' : '#5aff7a';
              for (let i = 0; i < (M.how === 'drop' ? 3 : 7); i++) {
                const d0 = document.createElementNS('http://www.w3.org/2000/svg', M.how === 'drop' || M.how === 'soup' ? 'circle' : 'ellipse');
                if (M.how === 'drop' || M.how === 'soup') d0.setAttribute('r', M.how === 'soup' ? 7 : 5); else { d0.setAttribute('rx', 4); d0.setAttribute('ry', 6); }
                d0.setAttribute('fill', color); d0.setAttribute('stroke', '#1a0e08');
                parts.appendChild(d0);
                d0.animate([{ transform: `translate(${TABLE_V.x}px, 620px)`, opacity: 1 }, { transform: `translate(${TABLE_V.x}px, 676px)`, opacity: 0.1 }], { duration: 380, delay: i * 110, fill: 'forwards', easing: 'ease-in' });
              }
            });
          }
          // 피해자: 앉아서 → 손을 뻗어 집고 → 입에 대고 기울여 마신다(먹는다)
          const reach = seg(s, 3.1, 3.4);
          const lift = seg(s, 3.4, 3.8);
          const tilt = M.eat ? 0 : ease.inOut(seg(s, 3.85, 4.15));
          vp = { ...SIT_V, upperF: -20 - reach * 30, foreF: -60 + reach * 30, head: 6 };
          if (s > 3.4) vp = { ...SIT_V, upperF: -50 - lift * 12, foreF: -30 - lift * 98, head: 4 - lift * 4 - tilt * 20, neck: -tilt * 8, chest: -tilt * 6 };
          // 건배: 범인도 잔을 든다
          if (kind === 'offer' && !M.eat && s > 3.0 && s < 3.6) { mp = { ...mp, upperF: -80, foreF: -40 }; at('clink', () => say2(900, 560, '짠!')); }
          // 잔 · 그릇 위치: 집기 전에는 탁자 위, 집은 뒤로는 손을 따라 곧게 (마실 때만 기울인다)
          const place = (el, pt, rot = 0, sc = 1) => el && el.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${rot}) scale(${sc})`);
          if (s < 3.4) place(vd, TABLE_V);
          else if (s < HIT) {
            const h = vic.point('handF', 0, 18);
            const bite = M.eat ? Math.max(0.35, 1 - seg(s, 3.9, 4.3) * 0.65) : 1;
            place(vd, { x: h.x, y: h.y + 10 }, -tilt * 55, bite);
          }
          if (md) {
            if (s > 3.0 && s < 3.9) { const h = mur.point('handF', 0, 18); place(md, { x: h.x, y: h.y + 10 }); } else place(md, TABLE_M);
          }
          if (s > HIT) {
            at('hit', () => {
              impact(8);
              if (vd) {
                const h = vic.point('handF', 0, 18);
                vd.animate([{ transform: `translate(${h.x}px, ${h.y}px) rotate(0deg)` }, { transform: `translate(${h.x + 30}px, 836px) rotate(120deg)` }], { duration: 420, fill: 'forwards', easing: 'ease-in' });
                setTimeout(() => { vd.style.opacity = 0; if (!M.eat) { burst(h.x + 30, 836, '#eef4fa', 12, 120, 5, 60); burst(h.x + 30, 838, mk === 'wine' ? '#8a1020' : '#b8702a', 8, 90, 6, 30); } }, 420);
              }
            });
            // 목을 움켜쥐고 떨다가 → 탁자 위로 엎어진다
            const slump = ease.inOut(seg(s, HIT + 0.9, HIT + 1.3));
            vp = mixPose({ ...SIT_V, upperF: -64, foreF: -134 + Math.sin(s * 30) * 8, upperB: -56, foreB: -128, head: 16 + Math.sin(s * 24) * 5, chest: 10 }, { ...SIT_V, chest: 58, neck: 20, head: 34, upperF: -40, foreF: -20, upperB: -30, foreB: -20 }, slump);
          }
          if (kind === 'offer' && s > END + 0.2) { mp = { ...STAND, ...gait(((s - END) * 1.2) % 1) }; mx = 740 - (s - END - 0.2) * 480; mflip = true; }
          vx = 1080;
          vy = 840;
          break;
        }
        case 'splash': {
          // 염산: 뒤로 다가가 병을 머리 위에서 기울여 붓는다 → 연기가 치솟고 머리를 감싸 쥐다 쓰러진다
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, { upperF: -150, foreF: -30, handF: 0, chest: -4 }, 2.2, 2.7) };
          const pouring = s > 2.8 && s < 4.0;
          if (s > 2.7) mp = { ...STAND, upperF: -150, foreF: -30, handF: -120 * seg(s, 2.7, 2.9), chest: 6 };
          if (pouring) {
            const a = mur.point('handF', 0, 70);
            const hp = head();
            cord.setAttribute('d', `M${a.x} ${a.y} Q${a.x + 10} ${(a.y + hp.y) / 2} ${hp.x} ${hp.y - 10}`);
            cord.setAttribute('stroke', '#b8f070');
            cord.setAttribute('stroke-width', 7 + Math.sin(s * 40) * 2);
            cord.setAttribute('opacity', 0.9);
            if (Math.random() < 0.5) {
              const pf = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              pf.setAttribute('r', 10 + Math.random() * 10);
              pf.setAttribute('fill', '#d8f0c8');
              parts.appendChild(pf);
              pf.animate([{ transform: `translate(${hp.x + (Math.random() - 0.5) * 50}px, ${hp.y}px)`, opacity: 0.6 }, { transform: `translate(${hp.x + (Math.random() - 0.5) * 120}px, ${hp.y - 140}px)`, opacity: 0 }], { duration: 900, fill: 'forwards', easing: 'ease-out' });
            }
          } else cord.setAttribute('opacity', 0);
          if (s > 2.9) at('hit', () => { impact(8); const hp = head(); say2(hp.x + 30, hp.y - 60, '치이익!'); });
          if (s > 2.9) {
            vp = { ...STAND, upperF: -160 + Math.sin(s * 26) * 10, foreF: -150, upperB: -150, foreB: -140, head: 18 + Math.sin(s * 30) * 8, chest: 14 };
            vx = 1000 + Math.sin(s * 5) * 14;
            fall(4.1, 4.6);
          }
          if (s > 4.0) mp = { ...STAND, upperF: -20, foreF: -30, head: 6 };
          break;
        }
        case 'snake': case 'bees': {
          if (s > 2.2) mp = { ...STAND, hipY: 60, chest: 40, upperF: -30, foreF: -20 };
          if (s > 2.4) at('release', () => {
            mur.hold(null);
            const a = mur.point('handF', 0, 20);
            const b = kind === 'snake' ? { x: 960, y: 830 } : head();
            if (kind === 'snake') { proj.innerHTML = objAt('snake', 0, 0, 1); proj.animate([{ opacity: 1, transform: `translate(${a.x}px, 820px)` }, { opacity: 1, transform: `translate(${b.x}px, ${b.y}px)` }], { duration: 900, fill: 'forwards', easing: 'ease-in' }); }
            else for (let i = 0; i < 14; i++) { const d0 = document.createElementNS('http://www.w3.org/2000/svg', 'g'); d0.innerHTML = '<ellipse rx="7" ry="5" fill="#f0c020" stroke="#1a0e08" stroke-width="2"/><path d="M-2 -5 v10 M2 -5 v10" stroke="#1a0e08" stroke-width="1.6"/><ellipse cx="-2" cy="-6" rx="5" ry="3" fill="#fff" opacity=".7"/>'; parts.appendChild(d0); d0.animate(Array.from({ length: 6 }, (_, k) => ({ transform: `translate(${(k === 0 ? a.x : b.x + Math.cos(k * 1.7 + i) * 60)}px, ${(k === 0 ? a.y : b.y + Math.sin(k * 1.3 + i) * 50)}px)` })), { duration: 1800, delay: i * 40, fill: 'forwards' }); }
          });
          if (s > 3.0) mp = { ...STAND, ...gait(((s - 3) * 1.1) % 1) };
          if (s > 3.0) mx = standX - (s - 3.0) * 300;
          mflip = s > 3.0;
          if (s > HIT) { at('hit', () => impact(7, false)); vp = { ...STAND, upperF: -150 + Math.sin(s * 25) * 30, upperB: -140 - Math.sin(s * 23) * 30, head: -10, chest: -6, thighF: kind === 'snake' ? -30 : 0 }; fall(HIT + 0.8, HIT + 1.3); }
          break;
        }
        case 'vehicle': {
          // 헤드라이트가 비치더니 달려와 들이받는다
          const k = seg(s, 1.6, HIT);
          // 차 앞머리가 HIT 순간 피해자에게 닿도록 (차가 크니 가운데는 그만큼 뒤)
          const front = M.small ? 190 : 304;
          const vxp = 2100 - k * (1100 - front);
          veh.setAttribute('opacity', s > 1.4 ? 1 : 0);
          veh.setAttribute('transform', `translate(${s < HIT ? vxp : 1000 + front - (s - HIT) * 1600} 846)`);
          if (s > 1.5 && s < HIT) vp = { ...STAND, upperF: -140, foreF: -30, upperB: -130, head: 10, chest: -6 };
          if (s > HIT) {
            at('hit', () => impact(22));
            const f2 = ease.out(seg(s, HIT, HIT + 0.8));
            vx = 1000 - f2 * 380; vy = 832 - Math.sin(f2 * Math.PI) * 180; vrot = -f2 * 260;
            vp = { ...STAND, ...FALL };
          }
          break;
        }
        case 'stairs': {
          const shove = seg(s, 2.6, 2.9);
          mp = { ...STAND, ...mixPose({ upperF: -40, foreF: -30, upperB: -40, foreB: -30 }, { upperF: -86, foreF: -4, upperB: -80, foreB: -6, chest: 20, hipY: 6 }, shove) };
          if (s > HIT) {
            at('hit', () => impact(12));
            const k = seg(s, HIT, HIT + 1.3);
            vx = 1000 + k * 380; vy = 832 + k * 230 - Math.abs(Math.sin(k * Math.PI * 3)) * 40; vrot = k * 400;
            vp = { ...STAND, upperF: -150, upperB: -140, head: -20, chest: -10 };
          }
          break;
        }
        case 'tub': {
          // 욕조: 뒤에서 머리를 눌러 물 속에 처박는다 (물장구 → 잠잠)
          mx = 700;
          mp = s < 2.4
            ? { ...STAND, ...(s < 1.4 ? gait((s * 0.9) % 1) : {}), chest: 20, upperF: -40, foreF: -40 }
            : { ...STAND, ...raise({ chest: 20, upperF: -40, foreF: -40 }, { chest: 52, neck: -10, hipY: 18, upperF: -66, foreF: -58, upperB: -60, foreB: -54 }, 2.4, 2.9) };
          vx = 1010; vy = 772;
          vp = { ...STAND, ...POSE.sit, chest: -6, head: -4, upperF: -30, foreF: -70, upperB: -26, foreB: -66 };
          if (s > HIT) {
            at('hit', () => { impact(8); const hp = head(); burst(hp.x, hp.y + 10, '#bfe0ff', 22, 200, 7, 150); say2(hp.x + 150, hp.y - 60, '첨벙!'); });
            // 물 밖으로 나온 두 팔만 허우적거린다
            const w = Math.max(0, 1 - (s - HIT) / 2.2);
            vp = { ...STAND, ...POSE.sit, chest: 44, neck: 26, head: 30, upperF: -150 + Math.sin(s * 19) * 34 * w, foreF: -60 - Math.sin(s * 23) * 40 * w, upperB: -140 - Math.sin(s * 17) * 30 * w, foreB: -60 + Math.sin(s * 21) * 40 * w };
            vy = 772 + Math.min(46, (s - HIT) * 40);
            if (s > HIT + 2.3) vp = { ...STAND, ...POSE.sit, chest: 50, neck: 30, head: 36, upperF: -40, foreF: -20, upperB: -36, foreB: -20 };
            if (s % 0.5 < 0.04 && s < HIT + 2.2) { const hp2 = head(); burst(hp2.x + 20, hp2.y + 30, '#bfe0ff', 5, 120, 5, 90); }
          }
          break;
        }
        case 'smother': {
          if (M.bed) {
            // 잠든 사람 머리맡에 서서 베개를 두 손으로 눌러 버틴다
            vx = 880; vy = 806;
            const lie = { ...STAND, chest: -92, neck: 4, head: 6, thighF: 86, shinF: -6, footF: -14, thighB: 90, shinB: -8, footB: -14, upperF: 70, foreF: -30, upperB: 74, foreB: -30, hipY: 0 };
            vp = { ...lie, rot: -90 };
            mx = 640; mflip = false;
            mp = s < 2.3
              ? { ...STAND, ...(s < 1.5 ? gait((s * 0.9) % 1) : {}), chest: 14, upperF: -30, foreF: -40 }
              : { ...STAND, ...raise({ chest: 14, upperF: -30, foreF: -40 }, { chest: 44, neck: -12, hipY: 22, upperF: -76, foreF: -46, upperB: -70, foreB: -44 }, 2.3, 2.9) };
            if (s > HIT) {
              at('hit', () => { impact(7, false); const hp = head(); say2(hp.x + 170, hp.y - 110, '으읍!'); });
              const w = Math.max(0, 1 - (s - HIT) / 2.4);
              // 발버둥: 다리가 이불을 차고 팔이 허공을 긁는다
              vp = { ...lie, rot: -90, thighF: 86 + Math.sin(s * 15) * 26 * w, shinF: -6 - Math.sin(s * 19) * 30 * w, thighB: 90 - Math.sin(s * 13) * 24 * w,
                upperF: 70 - Math.sin(s * 17) * 46 * w, foreF: -30 - Math.cos(s * 21) * 40 * w, upperB: 74 + Math.sin(s * 16) * 40 * w };
              mp = { ...STAND, chest: 50, neck: -14, hipY: 26, upperF: -80 + Math.sin(s * 18) * 3, foreF: -44, upperB: -74, foreB: -42 };
              const hp2 = head();
              cover.setAttribute('transform', `translate(${hp2.x + 4} ${hp2.y + 6}) rotate(90)`);
              cover.setAttribute('opacity', s < END + 0.4 ? 1 : 0);
              if (s > HIT + 2.6) vp = { ...lie, rot: -90, upperF: 92, foreF: -10, upperB: 96, foreB: -10 };
            }
            break;
          }
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, { upperF: -120, foreF: -20, upperB: -110, foreB: -20 }, 2.2, 2.8) };
          if (s > HIT) {
            at('hit', () => impact(6));
            mp = { ...STAND, upperF: -84 + Math.sin(s * 20) * 4, foreF: -20, upperB: -80, foreB: -24, chest: -8, hipY: 8 };
            const hp = head();
            cover.setAttribute('transform', `translate(${hp.x} ${hp.y + 20})`);
            cover.setAttribute('opacity', s < END ? 1 : 0);
            vp = { ...STAND, upperF: -130 + Math.sin(s * 22) * 40, foreF: -60, upperB: -120 + Math.cos(s * 20) * 40, head: -20, chest: -12 };
            fall(HIT + 1.2, HIT + 1.7);
          }
          break;
        }
        case 'cord': {
          const lift = seg(s, 2.2, 2.6);
          const loop = seg(s, 2.6, 2.9);
          mp = { ...mp, ...mixPose({ upperF: -40, foreF: -30, upperB: -40, foreB: -30 }, { upperF: -160, foreF: -10, upperB: -150, foreB: -10 }, lift) };
          if (loop > 0) { at('coil', () => mur.hold(null)); mp = { ...mp, ...mixPose({ upperF: -160, foreF: -10, upperB: -150, foreB: -10 }, { upperF: -70, foreF: -40, upperB: -60, foreB: -50 }, loop) }; }
          if (s > 2.9 && s < END) mp = { ...mp, chest: -12 + Math.sin(s * 30) * 3, hipY: 10, upperF: -50 + Math.sin(s * 26) * 6, upperB: -40 };
          if (loop > 0) {
            const a = mur.point('handF', 0, 20);
            const b = mur.point('handB', 0, 20);
            const n = vic.point('neck', 4, -8);
            cord.setAttribute('d', s > 2.9 ? `M${a.x} ${a.y} Q${n.x - 20} ${n.y - 10} ${n.x + 10} ${n.y} Q${n.x - 16} ${n.y + 14} ${b.x} ${b.y}` : `M${a.x} ${a.y} Q${(a.x + b.x) / 2 + 60} ${Math.max(a.y, b.y) + 60} ${b.x} ${b.y}`);
            cord.setAttribute('opacity', s < END ? 1 : 0);
          }
          if (s > 2.9) {
            at('hit', () => impact(6));
            vp = { ...STAND, upperF: -130 + Math.sin(s * 22) * 40, foreF: -60, upperB: -120 + Math.cos(s * 20) * 40, foreB: -50, head: -24 + Math.sin(s * 18) * 6, chest: -12 };
            fall(END - 0.2, END + 0.4);
          }
          break;
        }
        case 'fire': case 'boom': {
          if (kind === 'fire' && M.pour && s > 2.2 && s < 2.9) {
            mp = { ...STAND, upperF: -70, foreF: -30, handF: -100, chest: 10 };
            at('gas', () => { const a = mur.point('handF', 0, 60); for (let i = 0; i < 10; i++) { const d0 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'); d0.setAttribute('rx', 5); d0.setAttribute('ry', 3); d0.setAttribute('fill', '#e8d060'); parts.appendChild(d0); d0.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1 }, { transform: `translate(${900 + i * 20}px, 840px)`, opacity: 0.6 }], { duration: 400, delay: i * 50, fill: 'forwards' }); } });
          }
          if (s > 2.9) at('light', () => mur.hold(grip(kind === 'boom' ? 'firecracker' : 'match')));
          if (s > 2.9) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, { upperF: 10, foreF: -40 }, 2.9, HIT - 0.2) };
          if (s > HIT - 0.2) mp = { ...STAND, upperF: -100, foreF: -10, chest: 12 };
          if (s > HIT - 0.15) at('toss', () => { mur.hold(null); const a = mur.point('handF', 0, 40); const b = { x: 980, y: 820 }; proj.innerHTML = objAt(kind === 'boom' ? 'firecracker' : 'match', 0, 0, 0.5); proj.animate([{ opacity: 1, transform: `translate(${a.x}px, ${a.y}px) rotate(0deg)` }, { opacity: 1, transform: `translate(${b.x}px, ${b.y}px) rotate(540deg)` }], { duration: 260, fill: 'forwards' }); });
          if (s > HIT) {
            if (kind === 'boom') {
              for (let i = 0; i < 4; i++) if (s > HIT + i * 0.22) at(`pop${i}`, () => { impact(9, i === 0); burst(960 + (i % 2) * 60, 800 - i * 20, i % 2 ? '#ff5a3a' : '#ffd23a', 14, 160, 6, 140); say2(980, 700 - i * 30, i % 2 ? '팡!' : '펑!'); });
              vp = { ...STAND, upperF: -150, foreF: -40, upperB: -140, head: -20, chest: -16 };
              fall(HIT + 0.9, HIT + 1.5, -1);
            } else {
              at('hit', () => impact(9));
              const v = mid();
              const k = seg(s, HIT, HIT + 0.6);
              fire.setAttribute('cx', v.x); fire.setAttribute('cy', v.y);
              fire.setAttribute('opacity', (0.25 + k * 0.4) * (0.8 + Math.sin(s * 30) * 0.2) * (s > END + 0.2 ? Math.max(0, 1 - (s - END - 0.2) * 1.5) : 1));
              vp = { ...STAND, upperF: -150 + Math.sin(s * 20) * 30, upperB: -140 - Math.sin(s * 22) * 30, head: -10, chest: -8 };
              fall(HIT + 1.0, HIT + 1.5);
            }
          }
          break;
        }
        case 'shock': {
          // 욕조 안으로 헤어드라이어를 던져 넣는다 → 물이 번쩍이고 몸이 뻣뻣하게 굳는다
          const inTub = !!M.tub;
          if (inTub) { vx = 1010; vy = 772; vp = { ...STAND, ...POSE.sit, chest: -6, head: -4, upperF: -30, foreF: -70, upperB: -26, foreB: -66 }; }
          if (s > 2.2) mp = { ...STAND, ...raise({ upperF: -40, foreF: -30 }, { upperF: -160, foreF: -30, chest: -8 }, 2.2, 2.7) };
          if (s > 2.7) at('toss', () => {
            mur.hold(null);
            const a = mur.point('handF', 0, 40);
            proj.innerHTML = objAt('dryer', 0, 0, 0.7);
            proj.animate([
              { opacity: 1, transform: `translate(${a.x}px, ${a.y}px) rotate(0deg)` },
              { opacity: 1, transform: `translate(${inTub ? 1020 : 990}px, ${inTub ? 700 : 836}px) rotate(200deg)` },
            ], { duration: 300, fill: 'forwards' });
          });
          if (s > 2.9) mp = { ...STAND, upperF: -30, foreF: -20, chest: 6, hipY: 6 };
          if (s > HIT) {
            at('hit', () => {
              impact(9);
              const v0 = inTub ? { x: 1010, y: 690 } : mid();
              burst(v0.x, v0.y, '#dff4ff', 18, 200, 6, 140);
              say2(v0.x + 150, v0.y - 90, '지지직!');
            });
            const on = s < HIT + 1.2 && Math.sin(s * 60) > 0;
            const v = inTub ? { x: 1010, y: 700 } : mid();
            zap.setAttribute('transform', `translate(${v.x} ${v.y})`);
            zap.setAttribute('opacity', on ? 1 : 0);
            if (inTub) {
              // 물 위로 나온 팔이 경련하다가 툭 떨어진다
              const w = Math.max(0, 1 - (s - HIT) / 1.6);
              vp = { ...STAND, ...POSE.sit, chest: -14 + (on ? -8 : 6), neck: -10, head: -12 + (on ? -8 : 6), upperF: -140 + (on ? 26 : -26) * w, foreF: -40, upperB: -132 + (on ? -26 : 26) * w, foreB: -40 };
              if (s > HIT + 1.7) { vp = { ...STAND, ...POSE.sit, chest: 44, neck: 26, head: 32, upperF: -30, foreF: -16, upperB: -26, foreB: -16 }; vy = 800; }
              if (on && s < HIT + 1.2 && Math.random() < 0.4) burst(1010 + (Math.random() - 0.5) * 120, 676, '#dff4ff', 3, 90, 5, 70);
            } else {
              vp = { ...STAND, upperF: -120 + (on ? 20 : -20), upperB: -110, chest: on ? -12 : -4, head: on ? -18 : -6 };
              fall(HIT + 1.1, HIT + 1.7);
            }
          }
          break;
        }
        default: break;
      }
      // 범행 뒤: 범인이 달아나다 주머니에서 단서가 떨어진다
      if (mur && !indoor && kind !== 'snake' && kind !== 'bees' && s > END + 0.3) {
        mp = { ...STAND, ...gait(((s - END) * 1.3) % 1, true) };
        mx = (kind === 'drop' ? 430 : standX) - (s - END - 0.3) * (kind === 'drop' ? 380 : 520);
        mflip = true;
        if (kind !== 'offer' && kind !== 'splash') mur.hold(null);
      }
      if (s > END + 0.3) at('clue', () => {
        const from = mur ? mur.point('hips', 0, -40) : { x: clueX + 40, y: 700 };
        clueEl.animate([
          { opacity: 1, transform: `translate(${from.x}px, ${from.y}px) rotate(0deg)` },
          { opacity: 1, transform: `translate(${(from.x + clueX) / 2}px, ${from.y - 60}px) rotate(160deg)`, offset: 0.35 },
          { opacity: 1, transform: `translate(${clueX}px, 830px) rotate(330deg)`, offset: 0.8 },
          { opacity: 1, transform: `translate(${clueX}px, 824px) rotate(345deg)` },
        ], { duration: 800, fill: 'forwards', easing: 'ease-in' });
        D.sound.card && D.sound.card();
      });
      if (s > END + 1.1) at('spot', () => {
        spot.setAttribute('cx', clueX); spot.setAttribute('cy', 846);
        spot.animate([{ opacity: 0 }, { opacity: 0.35 }], { duration: 400, fill: 'forwards' });
        clueEl.animate([{ filter: 'drop-shadow(0 0 0 #ffd23a)' }, { filter: 'drop-shadow(0 0 12px #ffd23a)' }, { filter: 'drop-shadow(0 0 4px #ffd23a)' }], { duration: 900, fill: 'forwards' });
        const tag = document.createElement('div');
        tag.className = 'kw-clue-tag';
        tag.innerHTML = `현장에 떨어진 단서 · <b>${esc((K.CARD[murder.clue] || {}).name || '')}</b>`;
        shot.appendChild(tag);
        tag.animate([{ opacity: 0, transform: 'translate(-50%, 12px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 400, fill: 'forwards' });
        D.sound.stamp && D.sound.stamp();
      });
      if (watcherP) {
        // 범행을 보고 놀라 입을 막았다가, 마지막에 굳은 얼굴로 고개를 든다
        const shock = s > HIT && s < END + 2.6;
        watcherP.set({ ...STAND, ...(shock ? { upperF: -150, foreF: -140, head: 6 } : { upperF: -20, foreF: -40, head: 10 }), x: WX - 6, y: WY + 150 });
        if (s > END + 2.9) at('wlook', () => { watcherP.brow('angry'); watcherP.mouth('grit'); const tg = shot.querySelector('.kw-clue-tag'); if (tg) tg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }); });
        if (s > END + 3.8) at('wname', () => {
          const nm = L.el.querySelector('.kw-watch-name');
          if (nm) nm.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
        });
        if (s > END + 4.5) at('wstamp', () => {
          const st = document.createElement('div');
          st.className = 'kw-solve-stamp';
          // 수사팀이 이겼을 때만 '사건 해결'. 목격자가 들켰으면 실패 쪽 도장과 함께 창의 불이 꺼진다
          st.textContent = outcome === 'solved' ? '사건 해결' : '목격자 발각';
          if (outcome !== 'solved') {
            st.style.color = '#ffb020';
            st.style.borderColor = '#ffb020';
          }
          shot.appendChild(st);
          st.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-12deg) scale(2.6)' }, { opacity: 0.94, transform: 'translate(-50%,-50%) rotate(-12deg) scale(1)' }], { duration: 280, fill: 'forwards', easing: 'cubic-bezier(.3,1.6,.5,1)' });
          D.shake(12, 300);
          D.sound.stamp && D.sound.stamp();
        });
      }
      if (mur) mur.set({ ...mp, x: mx, flip: mflip });
      vic.set({ ...vp, flip: vp.flip ?? faceOff, x: vx, y: vy, rot: vrot });
      // 꽂힌 작살 · 화살은 가슴에 붙어 몸과 함께 넘어간다 (몸이 기울면 같이 기운다)
      if (stuck) {
        const rad = vrot * Math.PI / 180;
        const dy = -150;
        proj.setAttribute('transform', `translate(${vx - dy * Math.sin(rad)} ${vy + dy * Math.cos(rad)}) rotate(${vrot})`);
        proj.style.transform = '';
      }
      C.update(dt);
      S.render(s);
    });
    const WHERE = { bed: '여관방 침대에서', site: '공사장 한복판에서', kitchen: '문 닫은 식당에서', bath: '그 집 욕실에서', barber: '불 꺼진 이발소에서', pier: '부두 끝에서', roofTop: '옥상 위에서', drop: '이 골목에서', bar: '이 술집에서' }[place] || '이 골목에서';
    setTimeout(() => say(shot, '', `그날 밤, ${WHERE}… ${esc((K.CARD[murder.means] || {}).name || '')}.`, 2.2, '#c8d8ff'), 200);
  });
}

/* ═════════ 목격자 제거: 계단 → 402호 문 → 창 너머에서 기절시킴 → 옥상으로 끌고 가 밀어 떨어뜨림 → 아래에서 올려다본 추락 ═════════ */
const WIT_LEN = 15.2;
function hitWitnessShot(D, t0, murder, witness) {
  const mk = (K.CARD[murder.means] || {}).key || 'knife';
  const grip = (key) => { const g = GRIP[key] || [0, 50, 50, 0.8]; return `<g transform="scale(${g[3]}) rotate(${g[0]}) translate(${-g[1]} ${-g[2]})">${OBJ[key] || ''}</g>`; };
  const shadowOf = (C, look, scale) => { const sp = C.add({ look, x: 0, y: 0, scale, rim: '#000', shadow: false }); sp.svg.style.filter = 'brightness(0) blur(5px)'; sp.svg.style.opacity = '0.55'; return sp; };
  // ① 계단: 깜빡이는 전구 아래 올라가는 발소리 · 벽에 커다란 그림자
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    let steps = '';
    for (let i = 0; i < 12; i++) steps += `<path d="M${200 + i * 110} ${900 - i * 60} h110 v-60" fill="none" stroke="#4a5a58" stroke-width="6"/><rect x="${200 + i * 110}" y="${900 - i * 60}" width="110" height="${60 + i * 60}" fill="#1a2422"/>`;
    S.layer(1, BG(svg(`<rect width="1600" height="900" fill="#0e1614"/><rect x="0" y="0" width="1600" height="900" fill="#1a2a26"/>${steps}<path d="M200 800 L1520 80" stroke="#6a7a70" stroke-width="5"/><path d="M200 740 L1520 20" stroke="#6a7a70" stroke-width="3"/>
      <path d="M1100 0 V120" stroke="#0a0806" stroke-width="3"/><circle class="kw-bulb" cx="1100" cy="130" r="14" fill="#fff4c0"/><ellipse class="kw-bulbglow" cx="1100" cy="200" rx="420" ry="380" fill="#fff4c0" opacity=".16"/>`)));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const sh = shadowOf(C, 'murderer', 2.6);
    const mur = C.add({ look: 'murderer', x: 200, y: 900, scale: 1.2, rim: '#8ad8ff' });
    mur.hold(grip(mk));
    mur.brow('angry');
    const bulb = shot.querySelector('.kw-bulb');
    const glow = shot.querySelector('.kw-bulbglow');
    const cam = camPath(S.cam, [[0, { x: 520, y: 620, z: 1.25 }], [2.2, { x: 780, y: 470, z: 1.3 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const on = Math.random() > 0.1;
      if (bulb) bulb.setAttribute('opacity', on ? 1 : 0.2);
      if (glow) glow.setAttribute('opacity', on ? 0.16 : 0.03);
      // 계단을 한 칸씩 오른다 (발이 계단에 맞게 위아래로)
      const k = s / 2.2;
      const x = 200 + k * 700;
      const y = 900 - k * 380 - Math.abs(Math.sin(s * 7)) * 10;
      const pose = { ...POSE.stand, ...gait((s * 1.2) % 1), thighF: -40 + Math.sin(s * 7) * 30, shinF: 40, chest: 10 };
      mur.set({ ...pose, x, y });
      sh.set({ ...pose, x: x - 200, y: y - 60 });
      sh.svg.style.opacity = on ? '0.55' : '0.1';
      C.update(dt);
      S.render(s);
    });
  });
  // ② 복도: 402호 문 앞에서 걷어찬다
  D.at(t0 + 2.2, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    let doors = '';
    for (let i = 0; i < 4; i++) {
      const x = 180 + i * 330;
      if (i === 1) continue;
      doors += `<rect x="${x}" y="300" width="150" height="420" fill="#2a2418" stroke="#0a0806" stroke-width="6"/><circle cx="${x + 128}" cy="520" r="7" fill="#c8a040"/><rect x="${x + 50}" y="330" width="50" height="26" fill="#c8b890"/><text x="${x + 75}" y="349" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="16" fill="#1a1208">${401 + i}</text>`;
    }
    S.layer(1, BG(svg(`<rect width="1600" height="900" fill="#1a2420"/><rect y="720" width="1600" height="180" fill="#2a2a24"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 100} 720 L${i * 100 - 60} 900" stroke="#1a1a14" stroke-width="3"/>`).join('')}
      ${doors}<rect x="0" y="0" width="1600" height="90" fill="#0e1410"/><rect class="kw-tube" x="300" y="100" width="1000" height="14" rx="6" fill="#dff8e8"/>
      <rect x="510" y="300" width="150" height="420" fill="#ffd890"/>
      <g class="kw-door"><rect x="510" y="300" width="150" height="420" fill="#3a3020" stroke="#0a0806" stroke-width="6"/><circle cx="638" cy="520" r="7" fill="#c8a040"/><rect x="560" y="330" width="50" height="26" fill="#c8b890"/><text x="585" y="349" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="16" fill="#1a1208">402</text></g>
      <path class="kw-spill" d="M510 720 L300 900 H900 L660 720Z" fill="#ffd890" opacity="0"/>`)));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const mur = C.add({ look: 'murderer', x: 1300, y: 860, scale: 1.3, rim: '#8ad8ff', flip: true, rimSide: -1 });
    mur.hold(grip(mk));
    mur.brow('angry');
    const cam = camPath(S.cam, [[0, { x: 900, y: 480, z: 1.1 }], [1.6, { x: 680, y: 500, z: 1.4 }]]);
    const tube = shot.querySelector('.kw-tube');
    let last = 0;
    let kicked = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      if (tube) tube.setAttribute('opacity', Math.random() < 0.08 ? 0.2 : 1);
      const x = Math.max(760, 1300 - s * 600);
      if (x > 760) mur.set({ ...POSE.stand, ...gait((s * 1.2) % 1), x, flip: true });
      else {
        const k = Math.max(0, Math.min(1, (s - 1.0) / 0.25));
        mur.set({ ...POSE.stand, thighF: -95 * Math.sin(k * Math.PI), shinF: 10, chest: -10, x: 760, flip: true });
        if (k > 0.5 && !kicked) {
          kicked = true;
          D.shake(18, 320);
          D.flash('#ffd890', 160);
          D.sound.stamp && D.sound.stamp();
          const door = shot.querySelector('.kw-door');
          if (door) door.animate([{ transform: 'none' }, { transform: 'translate(28px, 6px) skewY(-10deg) scaleX(.18)' }], { duration: 200, fill: 'forwards' });
          const sp = shot.querySelector('.kw-spill');
          if (sp) sp.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 200, fill: 'forwards' });
        }
      }
      C.update(dt);
      S.render(s);
    });
  });
  // ③ 창 너머 그림자극: 흔들리는 전등 · 커튼에 비친 큰 그림자 → 붙잡고 → 번개 · 유리 금 → 커튼이 닫히고 불이 꺼진다
  D.at(t0 + 3.8, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    const WX0 = 470;
    const WY0 = 150;
    const WW = 660;
    const WH = 560;
    S.layer(0.4, BG(svg('<rect width="1600" height="900" fill="#0a0e18"/>')));
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px"><defs><radialGradient id="roomShade" cx=".5" cy=".3" r=".8"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>
      <rect class="kw-room" x="${WX0}" y="${WY0}" width="${WW}" height="${WH}" fill="#f0c880"/>
      <rect x="${WX0 + 40}" y="${WY0 + 30}" width="${WW - 80}" height="${WH - 30}" fill="#e8b870" opacity=".6"/>
      <rect x="${WX0}" y="${WY0}" width="${WW}" height="${WH}" fill="url(#roomShade)"/></svg>`);
    const C = cast(L.el);
    // 커튼에 비친 큰 그림자 (사람보다 먼저 = 뒤에)
    const shW = shadowOf(C, 'woman', 2.1);
    const shM = shadowOf(C, 'murderer', 2.3);
    const wit = C.add({ look: 'woman', x: 880, y: 900, scale: 1.25, rim: '#ffd890' });
    const mur = C.add({ look: 'murderer', x: 360, y: 900, scale: 1.3, rim: '#ffd890' });
    mur.hold(grip(mk));
    mur.brow('angry');
    // 흔들리는 전구 · 창틀 · 벽 · 커튼(닫힐 것) · 유리 금 · 빗방울
    L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
      <g class="kw-lamp"><path d="M800 ${WY0} V${WY0 + 110}" stroke="#1a1208" stroke-width="3"/><path d="M770 ${WY0 + 130} Q800 ${WY0 + 100} 830 ${WY0 + 130}Z" fill="#3a2a1a"/><circle cx="800" cy="${WY0 + 138}" r="11" fill="#fff4c0"/></g>
      <rect class="kw-curL" x="${WX0}" y="${WY0}" width="0" height="${WH}" fill="#7a2a1a"/><rect class="kw-curR" x="${WX0 + WW}" y="${WY0}" width="0" height="${WH}" fill="#7a2a1a"/>
      <path fill-rule="evenodd" fill="#141a2a" d="M-300 -300 H1900 V1200 H-300Z M${WX0} ${WY0} H${WX0 + WW} V${WY0 + WH} H${WX0}Z"/>
      <rect x="${WX0 - 14}" y="${WY0 - 14}" width="${WW + 28}" height="${WH + 28}" fill="none" stroke="#3a2a1a" stroke-width="22"/>
      <path d="M${WX0 + WW / 2} ${WY0} V${WY0 + WH} M${WX0} ${WY0 + WH / 2} H${WX0 + WW}" stroke="#3a2a1a" stroke-width="12"/>
      <rect x="${WX0 - 40}" y="${WY0 + WH + 10}" width="${WW + 80}" height="26" fill="#5a4a3a"/>
      <g class="kw-crack" fill="none" stroke="#f4f8ff" stroke-width="3" opacity="0"><path d="M${WX0 + 420} ${WY0 + 200} l-60 -90 M${WX0 + 420} ${WY0 + 200} l80 -60 M${WX0 + 420} ${WY0 + 200} l-20 120 M${WX0 + 420} ${WY0 + 200} l110 40 M${WX0 + 420} ${WY0 + 200} l-100 30"/><circle cx="${WX0 + 420}" cy="${WY0 + 200}" r="18"/></g>
      ${Array.from({ length: 44 }, (_, i) => `<ellipse cx="${WX0 + ((i * 97) % WW)}" cy="${WY0 + ((i * 61) % WH)}" rx="2.4" ry="4" fill="#dfe8ff" opacity=".35"/>`).join('')}
      <text x="${WX0 + WW / 2}" y="${WY0 - 40}" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="30" fill="#ffd890" stroke="#0a0806" stroke-width="4" paint-order="stroke">${esc(witness || '목격자')}</text></svg>`);
    const lamp = L.el.querySelector('.kw-lamp');
    const room = L.el.querySelector('.kw-room');
    const rn = rain(shot, { groundY: 1.2 });
    const cam = camPath(S.cam, [[0, { x: 800, y: 440, z: 1.0 }], [1.8, { x: 800, y: 420, z: 1.12 }], [2.2, { x: 820, y: 400, z: 1.3 }], [3.6, { x: 800, y: 420, z: 1.18 }]]);
    const HIT2 = 1.9;
    let last = 0;
    let done = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      rn(dt);
      // 전등이 흔들린다 → 그림자도 흔들린다
      const sw = Math.sin(s * 2.6) * (s > HIT2 ? 26 : 10);
      if (lamp) lamp.setAttribute('transform', `rotate(${sw.toFixed(2)} 800 ${WY0})`);
      const shift = sw * 6;
      // 범인: 들어와 → 어깨를 붙잡고 → 흉기 손잡이로 뒤통수를 내리쳐 기절시킨다
      const mx = Math.min(720, 360 + s * 380);
      const up = Math.max(0, Math.min(1, (s - 1.1) / 0.45));
      let mp = { ...POSE.stand, ...(mx < 720 ? gait((s * 1) % 1) : {}), upperF: -40 - up * 132, foreF: -30 + up * 6, upperB: -40 - up * 44, foreB: -10, chest: -up * 6 };
      if (s > HIT2 - 0.1) mp = { ...POSE.stand, upperF: -50, foreF: -8, upperB: -84, foreB: -6, chest: 18 };
      mur.set({ ...mp, x: mx });
      shM.set({ ...mp, x: mx - 260 + shift, y: 940 });
      // 목격자: 창밖을 보다 인기척에 돌아서 두 손을 든다 → 무너진다
      const turn = s > 1.0;
      let wp = { ...POSE.stand, ...(turn ? { upperF: -150, foreF: -140, upperB: -140, foreB: -130, head: -10 } : { upperF: -20, foreF: -60, head: 0 }) };
      let wx = 880;
      // 기절: 무릎이 풀려 스르르 주저앉는다
      if (s > HIT2) { const k = Math.min(1, (s - HIT2) / 0.6); wp = mixPose({ ...POSE.stand, head: 30, chest: 10, upperF: 10, upperB: 10 }, { ...POSE.stand, ...POSE.kneel, chest: 50, neck: 20, head: 40, upperF: 30, foreF: 0, upperB: 20 }, k); wx = 880; }
      wit.set({ ...wp, x: wx, flip: turn });
      shW.set({ ...wp, x: wx + 120 + shift, y: 930, flip: turn });
      if (s > HIT2 && !done) {
        done = true;
        const l = document.createElement('div');
        l.className = 'kw-lightning';
        shot.appendChild(l);
        l.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.1 }, { opacity: 0.2, offset: 0.25 }, { opacity: 0.8, offset: 0.35 }, { opacity: 0 }], { duration: 700 });
        L.el.classList.add('kw-silh');
        setTimeout(() => L.el.classList.remove('kw-silh'), 500);
        D.shake(16, 340);
        D.flash('#ffffff', 140);
        D.sound.thunder && D.sound.thunder();
        const hp = wit.point('head', 10, -60);
        L.el.querySelector('.kw-crack').style.display = 'none';
        // 별이 도는 기절 표시
        const st = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        st.innerHTML = [0, 1, 2].map((i) => `<path transform="rotate(${i * 120})" d="M0 -30 L5 -20 L0 -12 L-5 -20Z" fill="#fff4a0"/>`).join('');
        L.el.querySelector('svg:last-of-type').appendChild(st);
        st.animate([{ transform: `translate(${hp.x}px, ${hp.y}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${hp.x}px, ${hp.y}px) rotate(540deg)`, opacity: 0 }], { duration: 1400, fill: 'forwards' });
        // 커튼이 휙 닫히고 → 불이 꺼진다
        setTimeout(() => {
          L.el.querySelector('.kw-curL').animate([{ width: '0px' }, { width: `${WW / 2}px` }], { duration: 420, fill: 'forwards', easing: 'ease-in' });
          const r2 = L.el.querySelector('.kw-curR');
          r2.animate([{ x: `${WX0 + WW}px`, width: '0px' }, { x: `${WX0 + WW / 2}px`, width: `${WW / 2}px` }], { duration: 420, fill: 'forwards', easing: 'ease-in' });
        }, 450);
        setTimeout(() => {
          if (room) room.animate([{ fill: '#f0c880' }, { fill: '#10141e' }], { duration: 160, fill: 'forwards' });
          L.el.querySelectorAll('.kw-curL, .kw-curR').forEach((c) => c.animate([{ fill: '#7a2a1a' }, { fill: '#140a0a' }], { duration: 160, fill: 'forwards' }));
          if (lamp) lamp.style.opacity = 0;
        }, 950);
      }
      C.update(dt);
      S.render(s);
    });
  });
}

/** ④ 계단: 기절한 목격자의 두 손목을 잡고 뒷걸음질로 끌고 올라간다 */
function stairDragShot(D, t0) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    let steps = '';
    for (let i = 0; i < 14; i++) steps += `<path d="M${120 + i * 110} ${960 - i * 60} h110 v-60" fill="none" stroke="#4a5a58" stroke-width="6"/><rect x="${120 + i * 110}" y="${960 - i * 60}" width="110" height="${60 + i * 60}" fill="#1a2422"/>`;
    S.layer(1, BG(svg(`<rect width="1600" height="900" fill="#1a2a26"/>${steps}<path d="M120 860 L1660 20" stroke="#6a7a70" stroke-width="5"/>
      <path d="M1200 0 V100" stroke="#0a0806" stroke-width="3"/><circle class="kw-bulb" cx="1200" cy="110" r="14" fill="#fff4c0"/><ellipse class="kw-bulbglow" cx="1200" cy="200" rx="460" ry="380" fill="#fff4c0" opacity=".16"/>
      <text x="1380" y="120" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="26" fill="#6a7a70">옥상 ↑</text>`)));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const wit = C.add({ look: 'woman', x: 0, y: 0, scale: 1.15, rim: '#8ad8ff' });
    const mur = C.add({ look: 'murderer', x: 600, y: 700, scale: 1.2, rim: '#8ad8ff', flip: true, rimSide: -1 });
    mur.brow('angry');
    const bulb = shot.querySelector('.kw-bulb');
    const glow = shot.querySelector('.kw-bulbglow');
    const SL = 0.545; // 계단 기울기 (60/110)
    const cam = camPath(S.cam, [[0, { x: 620, y: 560, z: 1.12 }], [2.6, { x: 980, y: 380, z: 1.12 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const on = Math.random() > 0.1;
      if (bulb) bulb.setAttribute('opacity', on ? 1 : 0.2);
      if (glow) glow.setAttribute('opacity', on ? 0.16 : 0.03);
      // 한 칸 오를 때마다 몸이 들썩인다
      const k = s / 2.6;
      const x = 640 + k * 620;
      const step = Math.abs(Math.sin(s * 6));
      const y = 740 - (x - 640) * SL - step * 8;
      mur.set({ ...POSE.stand, ...gait((s * 0.9) % 1), upperF: -24, foreF: -8, upperB: -20, foreB: -8, chest: 44, neck: 10, hipY: 30, x, y, flip: true });
      const hand = mur.point('handF', 0, 22);
      // 목격자: 계단 비탈을 따라 누워 두 팔이 끌려 올라간다 (발은 아래 계단)
      const ang = 62;
      const len = 450;
      wit.set({ ...POSE.stand, upperF: -178, foreF: -2, upperB: -176, foreB: -2, head: 20 + step * 6, x: hand.x - len * Math.sin(ang * Math.PI / 180), y: hand.y + len * Math.cos(ang * Math.PI / 180) + 12, rot: ang + step * 3 });
      if (step > 0.98) D.sound.card && Math.random() < 0.3 && D.sound.card();
      C.update(dt);
      S.render(s);
    });
  });
}
/** ⑤ 옥상: 문을 나와 난간 끝까지 끌고 가 → 밀어 떨어뜨린다  ⑥ 건물을 따라 떨어진다 */
function roofShots(D, t0, witness) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    // 뒤: 비 내리는 도시 불빛 · 네온 · 물탱크
    let city = '';
    for (let i = 0; i < 22; i++) { const x = i * 80; const h = 120 + ((i * 53) % 200); city += `<rect x="${x}" y="${640 - h}" width="70" height="${h}" fill="#141a2a"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${x + 10 + (k % 2) * 30}" y="${650 - h + Math.floor(k / 2) * 34}" width="14" height="16" fill="${(i + k) % 3 ? '#0a0e18' : '#ffd890'}"/>`).join('')}`; }
    S.layer(0.35, BG(svg(`<rect width="1600" height="900" fill="#0a0e1c"/>${city}<text x="300" y="560" font-family="'Song Myung',serif" font-size="80" fill="#ff3a5a" opacity=".5">旅館</text><text x="1100" y="520" font-family="'Song Myung',serif" font-size="70" fill="#3af0e0" opacity=".45">藥</text>`)));
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible">
      <rect x="-200" y="780" width="1500" height="300" fill="#2a2e38"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 110 - 200} 780 L${i * 110 - 260} 1000" stroke="#1a1e28" stroke-width="3"/>`).join('')}
      <g transform="translate(120 560)"><rect x="0" y="0" width="200" height="220" fill="#3a4050" stroke="#0a0c12" stroke-width="5"/><path d="M0 60 H200 M0 140 H200" stroke="#0a0c12" stroke-width="4"/><path d="M40 220 V260 M160 220 V260" stroke="#0a0c12" stroke-width="10"/></g>
      <ellipse cx="700" cy="800" rx="260" ry="14" fill="#9ab8e8" opacity=".12"/></svg>`);
    const C = cast(L.el);
    const wit = C.add({ look: 'woman', x: 300, y: 790, scale: 1.2, rim: '#8ab0ff' });
    const mur = C.add({ look: 'murderer', x: 700, y: 790, scale: 1.25, rim: '#8ab0ff', flip: true, rimSide: -1 });
    mur.brow('angry');
    // 난간(가장 앞)
    L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
      <rect x="1300" y="700" width="400" height="400" fill="#141820"/><rect x="1300" y="690" width="400" height="22" fill="#4a5060"/>
      <path d="M1300 712 V1100" stroke="#0a0c12" stroke-width="6"/></svg>`);
    const rn = rain(shot, { groundY: 0.87 });
    const cam = camPath(S.cam, [[0, { x: 620, y: 520, z: 1.1 }], [2.2, { x: 1000, y: 540, z: 1.2 }], [3.0, { x: 1180, y: 560, z: 1.45 }], [3.6, { x: 1250, y: 620, z: 1.5 }]]);
    let last = 0;
    let pushed = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      rn(dt);
      // 끌고 간다: 범인은 뒷걸음질, 목격자는 누운 채 팔이 잡혀 끌려온다
      const k = Math.min(1, s / 2.0);
      const mx = 700 + k * 560;
      if (s < 2.0) {
        // 허리를 숙여 두 손목을 잡고 뒷걸음질로 끈다
        mur.set({ ...POSE.stand, ...gait((s * 0.8) % 1), thighF: -20, thighB: 10, upperF: -24, foreF: -8, upperB: -20, foreB: -8, chest: 48, neck: 10, hipY: 34, x: mx, flip: true });
        const hand = mur.point('handF', 0, 22);
        // 목격자는 바닥에 누워 두 팔이 머리 위로 끌려간다 (손목이 범인 손에)
        wit.set({ ...POSE.stand, upperF: -178, foreF: -2, upperB: -176, foreB: -2, head: 26, thighF: -4, thighB: 6, x: hand.x - 470, y: 806, rot: 88 });
      } else {
        // 난간에 기대 세운 뒤 밀친다
        const push = Math.max(0, Math.min(1, (s - 2.3) / 0.25));
        mur.set({ ...POSE.stand, ...mixPose({ upperF: -60, foreF: -10, upperB: -56, foreB: -10 }, { upperF: -86, foreF: -4, upperB: -82, foreB: -4, chest: 20 }, push), x: 1180, flip: false });
        if (s > 2.3 && !pushed) { pushed = true; D.shake(12, 300); D.flash('#eef4ff', 160); D.sound.thunder && D.sound.thunder(); }
        if (s < 2.3) wit.set({ ...POSE.stand, ...POSE.kneel, chest: 40, head: 40, upperF: 20, x: 1270, y: 790, rot: 0 });
        else {
          const f = Math.min(1, (s - 2.3) / 0.9);
          wit.set({ ...POSE.stand, upperF: -170, upperB: -160, head: -20, x: 1270 + f * 180, y: 790 + f * f * 700, rot: f * 160 });
        }
      }
      C.update(dt);
      S.render(s);
    });
  });
  // ⑥ 건물 벽을 따라 떨어진다: 카메라가 창문 · 에어컨 · 빨래 장대 · 네온 간판을 훑으며 거리까지 내려간다
  D.at(t0 + 3.6, () => {
    D.cut('');
    const { S, shot } = scene(D, MEM_CSS);
    const H = 3000;
    let fac = `<rect x="0" y="0" width="1600" height="${H}" fill="#0a0e1c"/><rect x="180" y="0" width="900" height="${H}" fill="#1a2030"/>`;
    for (let r = 0; r < 26; r++) {
      const y = 60 + r * 110;
      for (let c = 0; c < 6; c++) {
        const x = 220 + c * 140;
        const lit = (r * 7 + c * 3) % 5 < 2;
        fac += `<rect x="${x}" y="${y}" width="90" height="70" fill="${lit ? '#ffd890' : '#0c1018'}" stroke="#0a0c12" stroke-width="4"/>`;
        if ((r + c) % 4 === 0) fac += `<rect x="${x + 20}" y="${y + 72}" width="54" height="30" fill="#8a8e98" stroke="#0a0c12" stroke-width="3"/><path d="M${x + 26} ${y + 80} h42 M${x + 26} ${y + 88} h42" stroke="#4a4e58" stroke-width="2"/>`;
      }
      if (r % 3 === 1) fac += `<path d="M1080 ${y + 30} H1240" stroke="#3a3020" stroke-width="5"/>${[0, 1, 2].map((i) => `<rect x="${1100 + i * 44}" y="${y + 32}" width="30" height="${40 + i * 8}" fill="${['#c83a3a', '#e8e0d0', '#3a6ac8'][i]}" opacity=".85"/>`).join('')}`;
    }
    [['旅館', '#ff3a5a', 520], ['藥房', '#3af0e0', 1180], ['麻雀', '#ffd23a', 1840], ['酒吧', '#ff5ae0', 2380]].forEach(([ch, col, y]) => {
      fac += `<rect x="1090" y="${y - 90}" width="120" height="${ch.length * 110}" fill="#0a0806" stroke="${col}" stroke-width="5"/><text x="1150" y="${y}" text-anchor="middle" font-family="'Song Myung',serif" font-size="92" fill="${col}" writing-mode="tb" style="filter:drop-shadow(0 0 14px ${col})">${ch}</text>`;
    });
    fac += `<rect x="0" y="${H - 220}" width="1600" height="220" fill="#1a1414"/><ellipse cx="1300" cy="${H - 160}" rx="420" ry="60" fill="#ff5a8a" opacity=".2"/>`;
    const L = S.layer(1, `<svg viewBox="0 0 1600 ${H}" style="position:absolute;left:0;top:0;width:1600px;height:${H}px;overflow:visible">${fac}</svg>`);
    const C = cast(L.el);
    const wit = C.add({ look: 'woman', x: 1330, y: 0, scale: 1.1, rim: '#8ab0ff', shadow: false });
    const rn = rain(shot, { groundY: 1.3 });
    let last = 0;
    let hitGround = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      rn(dt);
      // 점점 빨라지며 떨어진다 → 카메라가 따라 내려간다
      const f = Math.min(1, s / 1.8);
      const y = 200 + f * f * (H - 480);
      wit.set({ ...POSE.stand, upperF: -170 + Math.sin(s * 9) * 30, upperB: -150 - Math.sin(s * 9) * 30, thighF: -30, head: -20, x: 1330, y, rot: s * 140 });
      S.cam.x = 1000;
      S.cam.y = Math.min(H - 450, Math.max(450, y - 260));
      S.cam.z = 1;
      if (f >= 1 && !hitGround) { hitGround = true; D.flash('#000000', 1200); D.shake(12, 300); D.sound.thunder && D.sound.thunder(); }
      C.update(dt);
      S.render(s);
    });
  });
}
/** 추격 → 가로막힘 (체포) */
function chaseShot(D, t0) {
  D.at(t0, () => {
    D.cut(STYLE + svg(alley({ seed: 11, fog: 0.35 })) + RAIN);
    const w = D.world();
    const perp = makeHuman(w, { color: '#05040a', rim: '#ff3a5a', scale: 2.2, x: -200, y: 830 });
    const cops = [0, 1].map((i) => makeHuman(w, { color: '#05060c', rim: '#3af0e0', tool: 'flashlight', scale: 2.3 - i * 0.2, x: 1320 + i * 150, y: 840 + i * 10, flip: true }));
    cops.forEach((c) => c.set(HUMAN_POSE.stand));
    const beams = document.createElement('div');
    beams.innerHTML = svg('<defs><linearGradient id="beam" x1="1" x2="0"><stop offset="0" stop-color="#fff8d0" stop-opacity=".55"/><stop offset="1" stop-color="#fff8d0" stop-opacity="0"/></linearGradient></defs><path class="bm1" d="M1300 560L700 420L700 760Z" fill="url(#beam)"/><path class="bm2" d="M1460 580L760 480L760 820Z" fill="url(#beam)"/>');
    beams.style.cssText = 'position:absolute;inset:0;opacity:0;mix-blend-mode:screen';
    D.add('');
    w.parentElement.appendChild(beams);
    D.tick((s) => {
      const run = Math.min(s, 2.2);
      if (s < 2.2) perp.set({ ...runPose((s * 1.8) % 1), x: -200 + run * 470, y: 830 });
      else perp.set({ ...HUMAN_POSE.stand, body: -12, head: 10, fUpper: -60, bUpper: 50, x: 834 - Math.min(1, (s - 2.2) * 3) * 40, y: 830 });
      cops.forEach((c, i) => c.set({ ...HUMAN_POSE.point, tool: 60, fUpper: -80 + Math.sin(s * 3 + i) * 6, x: 1320 + i * 150 - Math.max(0, s - 2) * 120 }));
    });
    setTimeout(() => {
      beams.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
      D.sound.siren && D.sound.siren();
      D.flash('#ffffff', 160);
    }, 2000);
  });
}
/** 체포 ① 손목 초근접: 등 뒤로 모은 두 손목에 수갑이 감기며 딸깍 · ② 뒤로 빠지며 형사가 범인을 붙잡는다 */
function cuffShot(D, t0, murderer) {
  D.at(t0, () => {
    // 등 뒤로 겹친 두 팔 (왼쪽 팔은 위, 오른쪽 팔은 아래로 겹친다). 손목에 수갑 고리가 앞뒤로 감긴다.
    //  왼팔: 소매(왼쪽 끝→x 620) · 셔츠 소맷부리 620~668 · 손목 668~720 · 주먹 720~840
    const armL = `<path d="M-60 400 C200 410 460 420 620 438 L620 548 C460 560 200 600 -60 620Z" fill="url(#sleeve)" stroke="#050404" stroke-width="5"/>
      <path d="M60 470 C260 474 440 482 600 490" stroke="#3a3a46" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M620 436 L668 440 L668 548 L620 552Z" fill="#e8e4dc" stroke="#050404" stroke-width="4"/>
      <path d="M666 452 C690 450 712 452 726 456 L726 536 C712 542 690 544 666 542Z" fill="url(#skinA)" stroke="#050404" stroke-width="4"/>
      <path d="M720 448 C770 436 820 444 846 470 C862 488 860 520 842 536 C816 556 770 556 722 540Z" fill="url(#skinA)" stroke="#050404" stroke-width="4"/>
      <path d="M780 452 C800 470 804 500 796 528 M810 456 C826 474 828 502 820 526" stroke="#8a5040" stroke-width="3" fill="none"/>`;
    //  오른팔: 거울 대칭, 조금 아래 (손이 왼손 아래로 겹친다)
    const armR = `<g transform="translate(1600 110) scale(-1 1)">${armL}</g>`;
    const ring = (cx, cy, cls) => ({
      back: `<ellipse cx="${cx}" cy="${cy}" rx="24" ry="62" fill="none" stroke="#4a4e58" stroke-width="14"/>`,
      front: `<g class="${cls}"><path class="arc" d="M${cx} ${cy - 62} A24 62 0 0 1 ${cx} ${cy + 62}" fill="none" stroke="#14161c" stroke-width="20" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
        <path class="arc" d="M${cx} ${cy - 62} A24 62 0 0 1 ${cx} ${cy + 62}" fill="none" stroke="#d8dce6" stroke-width="11" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
        <path class="arc" d="M${cx + 6} ${cy - 50} A20 50 0 0 1 ${cx + 20} ${cy - 8}" fill="none" stroke="#fff" stroke-width="3.4" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></g>
        <rect x="${cx - 13}" y="${cy + 50}" width="26" height="30" rx="5" fill="#9aa0ac" stroke="#14161c" stroke-width="4"/><circle cx="${cx}" cy="${cy + 65}" r="4.6" fill="#2a2c34"/>`,
    });
    const rL = ring(694, 494, 'cfA');
    const rR = ring(906, 604, 'cfB');
    D.cut(STYLE + CINE_CSS + svg(`<defs>
        <linearGradient id="sleeve" x2="0" y2="1"><stop offset="0" stop-color="#34343e"/><stop offset=".5" stop-color="#1c1c24"/><stop offset="1" stop-color="#0a0a0e"/></linearGradient>
        <linearGradient id="skinA" x2="0" y2="1"><stop offset="0" stop-color="#e8b894"/><stop offset="1" stop-color="#8a5a40"/></linearGradient>
        <linearGradient id="backG" x2="0" y2="1"><stop offset="0" stop-color="#22222c"/><stop offset="1" stop-color="#0a0a10"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#backG)"/>
      <path d="M800 0V900" stroke="#050508" stroke-width="8" opacity=".6"/><path d="M0 250 Q800 300 1600 250" stroke="#2a2a36" stroke-width="12" fill="none"/>
      <path d="M200 300 L180 360 M1400 300 L1420 360" stroke="#050508" stroke-width="5" opacity=".5"/>
      ${rL.back}${rR.back}${armR}${armL}
      <path d="M694 574 Q740 640 800 628 Q860 616 906 684" fill="none" stroke="#9aa0ac" stroke-width="11" stroke-dasharray="14 6"/>
      ${rR.front}${rL.front}`) + '<div class="kw-sirens"></div>' + RAIN);
    // 형사의 손이 들어와 한쪽씩 채운다
    const close = (sel, at) => setTimeout(() => {
      D.root().querySelectorAll(`${sel} .arc`).forEach((p) => p.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: 260, fill: 'forwards', easing: 'cubic-bezier(.5,0,.2,1)' }));
      setTimeout(() => { D.sound.cuffs && D.sound.cuffs(); D.shake(6, 200); D.flash('#ffffff', 90); }, 240);
    }, at);
    close('.cfB', 500);
    close('.cfA', 1150);
    D.anim('.an-shot > svg', [{ transform: 'scale(1.12)' }, { transform: 'scale(1.02)' }], { duration: 2400, easing: 'ease-out' });
  });
  // ② 뒤로 빠진 장면: 형사가 수갑 찬 범인의 어깨를 잡고, 경찰차 불빛이 번쩍인다
  D.at(t0 + 2.2, () => {
    D.cut('');
    const { S, shot } = scene(D, '<div class="kw-sirens" style="z-index:5"></div>');
    S.layer(0.3, BG(svg(alley({ seed: 31, fog: 0.3 }))));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const mur = C.add({ look: 'murderer', x: 900, y: 840, scale: 1.45, rim: '#ff3a5a', flip: true, rimSide: -1 });
    const det = C.add({ look: 'detective', x: 1040, y: 845, scale: 1.45, rim: '#46f2e4', flip: true, rimSide: -1 });
    const cop = C.add({ look: 'cop', x: 560, y: 830, scale: 1.3, rim: '#3a8aff' });
    mur.brow('angry');
    mur.mouth('grit');
    const rn = rain(shot, { groundY: 0.8 });
    const cam = camPath(S.cam, [[0, { x: 900, y: 460, z: 1.5 }], [2.2, { x: 860, y: 470, z: 1.15 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      mur.set({ ...POSE.stand, ...POSE.cuffed, head: 10 + Math.sin(s * 2) * 3, x: 900 });
      det.set({ ...POSE.stand, upperF: -52, foreF: -20, handF: 0, head: 6, x: 1040 });
      cop.set({ ...POSE.stand, upperF: -30, foreF: -40, x: 560 });
      det.talking = s > 0.4 && s < 2;
      C.update(dt);
      S.render(s);
      rn(dt);
    });
    setTimeout(() => say(shot, '진 형사', `${esc(murderer)}, 당신을 살인 혐의로 체포한다.`, 1.7), 350);
  });
}
function paperShot(D, t0, head, sub, body) {
  D.at(t0, () => {
    D.cut(`${STYLE}<div style="position:absolute;inset:0;background:radial-gradient(circle,#2a1a14,#050404)"></div><div class="kw-paper"><div class="mast"><span>九龍日報 · 구룡일보</span><span>1997년 호외</span></div><h1>${head}</h1><b style="font-size:2.2vw">${sub}</b><p>${body}</p></div>`);
    D.anim('.kw-paper', [{ transform: 'translate(-50%,-50%) rotate(720deg) scale(.05)' }, { transform: 'translate(-50%,-50%) rotate(-3deg) scale(1)' }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.3,1)' });
    D.sound.type && setTimeout(() => D.sound.type(), 1100);
  });
}

/** 주머니에 손을 넣고 골목을 가로질러 안개 속으로 걸어가는 범인 (한 번 멈춰서 돌아본다) */
function walkAwayShot(D, t0) {
  D.at(t0, () => {
    D.cut(STYLE + svg(alley({ seed: 5, fog: 0.5, lit: 0.6 })) + '<div class="fogwall" style="position:absolute;right:0;top:0;bottom:0;width:40%;background:linear-gradient(90deg,transparent,rgba(190,170,200,.55))"></div>' + RAIN);
    const w = D.world();
    const perp = makeHuman(w, { color: '#05040a', rim: '#ff3a5a', scale: 2.5, x: 300, y: 860 });
    const pockets = { fUpper: 12, fFore: -62, bUpper: -8, bFore: -58 };
    D.tick((s) => {
      // 0~1.8초 걷기 → 1.8~3.0 멈춰서 돌아봄 → 3.0~ 다시 걸어 안개 속으로
      let x;
      let pose;
      if (s < 1.8) {
        const ph = (s * 1.25) % 1;
        const a = Math.sin(ph * Math.PI * 2);
        pose = { ...HUMAN_POSE.stand, ...pockets, fThigh: a * 24, bThigh: -a * 24, fShin: Math.max(0, -a) * 30, bShin: Math.max(0, a) * 30, body: 3, head: 2 };
        x = 300 + s * 230;
      } else if (s < 3.0) {
        const k = Math.sin(Math.min(1, (s - 1.8) / 0.4) * Math.PI / 2);
        pose = { ...HUMAN_POSE.stand, ...pockets, head: -14 * k, body: -4 * k };
        x = 714;
        if (!perp.looked) { perp.looked = true; D.sound.heart && D.sound.heart(); }
      } else {
        const ph = ((s - 3) * 1.25) % 1;
        const a = Math.sin(ph * Math.PI * 2);
        pose = { ...HUMAN_POSE.stand, ...pockets, fThigh: a * 24, bThigh: -a * 24, fShin: Math.max(0, -a) * 30, bShin: Math.max(0, a) * 30, body: 3 };
        x = 714 + (s - 3) * 250;
      }
      perp.set({ ...pose, x, y: 860 - Math.max(0, x - 700) * 0.08, scale: 2.5 - Math.max(0, x - 700) * 0.0012 });
      perp.svg.style.opacity = String(Math.max(0, 1 - Math.max(0, x - 900) / 300));
    });
  });
}
function emptyAlleyShot(D, t0, murder) {
  D.at(t0, () => {
    D.cut(STYLE + svg(alley({ seed: 5, fog: 0.4 }) + `<g transform="translate(760 740) rotate(-18) scale(.9)" opacity=".85">${cardSvg(K.CARD[murder.clue], { w: 110 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`) + RAIN);
    const w = D.world();
    const cops = [0, 1, 2].map((i) => makeHuman(w, { color: '#05060c', rim: '#3af0e0', tool: 'flashlight', scale: 2.1, x: 1700 + i * 130, y: 850, flip: true }));
    D.tick((s) => {
      cops.forEach((c, i) => {
        const run = Math.min(1, s / 1.6);
        if (s < 1.6) c.set({ ...runPose((s * 1.6 + i * 0.3) % 1), x: 1700 + i * 130 - run * 700, y: 850 });
        else c.set({ ...HUMAN_POSE.stand, fUpper: -90 + Math.sin(s * 2 + i * 2) * 50, tool: 90, head: Math.sin(s * 1.4 + i) * 16, x: 1000 + i * 130, y: 850 });
      });
    });
  });
}

/** 전화부스의 목격자와 커지는 그림자 */
function boothShot(D, t0) {
  D.at(t0, () => {
    D.cut(STYLE + svg(`<rect width="1600" height="900" fill="#07060c"/>
      <rect x="560" y="120" width="480" height="720" fill="#0e1a14" stroke="#1a3a2a" stroke-width="14"/>
      <rect class="boothlight" x="580" y="140" width="440" height="680" fill="#c8f0c0" opacity=".35"/>
      <rect x="580" y="140" width="440" height="680" fill="none" stroke="#0a120e" stroke-width="10"/><path d="M800 140V820M580 480H1020" stroke="#0a120e" stroke-width="8"/>
      <g class="shadow" opacity="0"><path d="M1300 900 Q1180 500 1080 380 Q1040 300 1100 260 Q1170 240 1180 330 Q1250 480 1400 900Z" fill="#000"/></g>
      <path d="M0 840H1600V900H0Z" fill="#0a0810"/>`) + RAIN);
    const w = D.world();
    const wit = makeHuman(w, { color: '#081410', rim: '#8aff9a', scale: 2.3, x: 800, y: 810 });
    wit.set({ ...HUMAN_POSE.stand, fUpper: -150, fFore: -120, head: -6 });
    D.tick((s) => { wit.set({ head: -6 + (s > 2.4 ? Math.min(1, (s - 2.4) * 4) * 30 : 0), body: s > 2.4 ? 6 : 0 }); });
    D.anim('.shadow', [{ opacity: 0, transform: 'scale(.6)', transformOrigin: '1300px 900px' }, { opacity: 0.95, transform: 'scale(1.5)', transformOrigin: '1300px 900px' }], { duration: 2600, delay: 600, easing: 'ease-in' });
    setTimeout(() => D.sound.heart && D.sound.heart(), 800);
    setTimeout(() => D.sound.heart && D.sound.heart(), 1700);
    D.anim('.boothlight', [{ opacity: 0.35 }, { opacity: 0.05 }, { opacity: 0.3 }, { opacity: 0 }], { duration: 700, delay: 2900, easing: 'steps(4)' });
    setTimeout(() => { D.sound.scream && D.sound.scream(); D.flash('#000000', 900); }, 3400);
  });
}
function receiverShot(D, t0) {
  D.at(t0, () => {
    D.cut(STYLE + svg(`<rect width="1600" height="900" fill="#050508"/><g class="recv" transform="translate(800 120)"><path d="M0 0 C 30 120 -30 220 0 330" stroke="#111" stroke-width="10" fill="none"/>
      <path d="M-70 330 h140 q20 0 20 20 v30 q0 20 -20 20 h-30 q-10 -20 -40 -20 q-30 0 -40 20 h-30 q-20 0 -20 -20 v-30 q0 -20 20 -20Z" fill="#1a1a1e" stroke="#3a3a44" stroke-width="4"/></g>
      <ellipse cx="800" cy="860" rx="300" ry="30" fill="#8e1a1a" opacity=".4"/>`) + RAIN);
    D.anim('.recv', [{ transform: 'translate(800px,120px) rotate(18deg)' }, { transform: 'translate(800px,120px) rotate(-14deg)' }, { transform: 'translate(800px,120px) rotate(10deg)' }, { transform: 'translate(800px,120px) rotate(-6deg)' }, { transform: 'translate(800px,120px) rotate(0deg)' }], { duration: 4200, easing: 'ease-in-out' });
  });
}

/* ═════════ 인물 장면 (컷아웃 인형 · 카메라 · 대사) ═════════ */
const BG = (svgHtml, wide = false) => `<div class="cn-bg" style="position:absolute;left:0;top:0;display:flex">${svgHtml}${wide ? svgHtml : ''}</div>`;
const BGCSS = '<style>.cn-bg > svg { width:1600px; height:900px; display:block; flex:none; }</style>';
/** 한 컷 공통: 무대 + 비 + 매 프레임 갱신 */
function scene(D, html = '') {
  D.add(STYLE + CINE_CSS + BGCSS + html);
  const shot = D.root();
  const S = stage(shot);
  return { S, shot };
}

/** 형사 둘이 골목으로 걸어 들어와 분필 윤곽 앞에 쭈그려 앉는다 */
function arriveShot(D, t0) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.3, BG(svg(alley({ seed: 9, fog: 0.3 }))));
    const ground = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px"><g transform="translate(980 800) scale(1 .35)" fill="none" stroke="#f4f4f0" stroke-width="7" stroke-dasharray="18 10" opacity=".8"><path d="M-40 -170 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0 M-30 -130 L-60 -20 L-150 60 M30 -130 L90 -40 L170 -60 M-40 -20 L-10 120 L-60 240 M-10 -10 L60 110 L40 240"/></g></svg>`);
    const C = cast(ground.el);
    const det = C.add({ look: 'detective', x: 120, y: 820, scale: 1.25, rim: '#46f2e4' });
    const wom = C.add({ look: 'woman', x: -60, y: 830, scale: 1.2, rim: '#ff3a5a', rimSide: -1 });
    const rn = rain(shot, { groundY: 0.78 });
    const cam = camPath(S.cam, [[0, { x: 600, y: 470, z: 1.05 }], [2.6, { x: 820, y: 480, z: 1.12 }], [5.2, { x: 900, y: 500, z: 1.3 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      // 걸어 들어온다 → 형사는 멈춰서 쭈그려 앉고, 여자는 턱을 괸다
      if (s < 2.4) det.set({ ...POSE.stand, ...gait((s * 1.1) % 1), x: 120 + s * 280 });
      else { const k = ease.inOut(Math.min(1, (s - 2.4) / 0.7)); det.set({ ...mixPose({ ...POSE.stand, hipY: 0 }, { ...POSE.stand, ...POSE.crouch, ...POSE.lookDown }, k), x: 792 }); }
      if (s < 2.9) wom.set({ ...POSE.stand, ...gait((s * 1.1 + 0.4) % 1), x: -60 + s * 250 });
      else { const k = ease.inOut(Math.min(1, (s - 2.9) / 0.6)); wom.set({ ...mixPose(POSE.stand, { ...POSE.stand, ...POSE.chinHand }, k), x: 665 }); }
      det.talking = s > 3.2 && s < 4.6;
      wom.talking = s > 5.2;
      C.update(dt);
      S.render(s);
      rn(dt);
    });
    setTimeout(() => say(shot, '진 형사', '비 때문에 흔적이 다 씻겨 나갔군…', 1.9), 3200);
    setTimeout(() => say(shot, '메이 탐정', '아니요. 법의학자가 다 말해 줬어요.', 2.2, '#ff7a8a'), 5300);
  });
}

/** 범인 지목: 형사가 손가락으로 가리키고, 범인은 웃다가 달아난다 */
function accuseShot(D, t0, murderer, music) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.3, BG(svg(alley({ seed: 13, fog: 0.35 }))));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const det = C.add({ look: 'detective', x: 420, y: 830, scale: 1.4, rim: '#46f2e4' });
    const mur = C.add({ look: 'murderer', x: 1180, y: 830, scale: 1.4, rim: '#ff3a5a', flip: true, rimSide: -1 });
    mur.brow('sly');
    mur.mouth('smirk');
    const rn = rain(shot, { groundY: 0.8 });
    const cam = camPath(S.cam, [[0, { x: 800, y: 470, z: 1 }], [1.6, { x: 560, y: 440, z: 1.35 }], [2.8, { x: 1080, y: 430, z: 1.5 }], [4.2, { x: 1000, y: 460, z: 1.1 }]]);
    let last = 0;
    let fled = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const pk = ease.back(Math.min(1, s / 0.5));
      det.set({ ...mixPose(POSE.stand, { ...POSE.stand, ...POSE.point }, pk), x: 420 });
      det.talking = s > 0.5 && s < 2.4;
      if (s < 3.2) {
        mur.set({ ...POSE.stand, ...POSE.pockets, head: Math.sin(s * 3) * 2, x: 1180 });
        if (s > 2.4 && s < 3.2) { mur.brow('angry'); mur.mouth('grit'); }
      } else {
        if (!fled) { fled = true; mur.set({ flip: false }); S.cam.shake = 8; setTimeout(() => { S.cam.shake = 0; }, 350); music.hit([50, 56, 62, 65]); D.sound.alarm && D.sound.alarm(); }
        mur.set({ ...POSE.stand, ...gait(((s - 3.2) * 1.8) % 1, true), x: 1180 + (s - 3.2) * 520, flip: false });
      }
      C.update(dt);
      S.render(s);
      rn(dt);
    });
    setTimeout(() => say(shot, '진 형사', `범인은 당신이야, ${esc(murderer)}.`, 1.9), 500);
    setTimeout(() => say(shot, murderer, '…증거라도 있나?', 1.1, '#ff7a8a'), 2400);
  });
}

/** 추격: 카메라가 범인을 따라 달리고, 앞에서 경찰이 막아선다 */
function runShot(D, t0) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.45, BG(svg(alley({ seed: 21, fog: 0.3 })), true));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const mur = C.add({ look: 'murderer', x: 300, y: 830, scale: 1.3, rim: '#ff3a5a' });
    const det = C.add({ look: 'detective', x: 20, y: 840, scale: 1.3, rim: '#46f2e4' });
    const cop = C.add({ look: 'cop', x: 1900, y: 830, scale: 1.35, rim: '#3a8aff', flip: true, rimSide: -1 });
    const rn = rain(shot, { groundY: 0.8, wind: -5 });
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      const mx = s < 2.6 ? 300 + s * 480 : 1548 + Math.max(0, 0.3 - (s - 2.6)) * 60;
      S.cam.x = Math.min(1500, 700 + s * 380);
      S.cam.z = 1.05;
      S.cam.rot = Math.sin(s * 9) * 0.6;
      if (s < 2.6) mur.set({ ...POSE.stand, ...gait((s * 1.9) % 1, true), x: mx });
      else mur.set({ ...mixPose({ ...POSE.stand, ...gait(0.25, true) }, { ...POSE.stand, ...POSE.armsUp, chest: -10 }, ease.out(Math.min(1, (s - 2.6) / 0.4))), x: 1548 });
      det.set({ ...POSE.stand, ...gait((s * 1.9 + 0.5) % 1, true), x: Math.min(1330, 20 + s * 470) });
      cop.set({ ...POSE.stand, ...(s > 2.2 ? POSE.point : {}), x: Math.max(1760, 1900 - s * 80) });
      C.update(dt);
      S.render(s);
      rn(dt);
    });
    setTimeout(() => { D.sound.siren && D.sound.siren(); say(shot, '경찰', '꼼짝 마! 경찰이다!', 1.4, '#8ab8ff'); }, 2300);
  });
}

// 회상 컷(5.8초)이 들어간 길이
const FB = 7.4;
const FBW = 10.6; // 아파트 줌인까지
const FILMS = {
  solved: { length: 32.5 + FBW, titleAt: 28.4 + FBW, title: '사건 해결' },
  escaped: { length: 18.5 + FB, titleAt: 14.8 + FB, title: '미제 사건' },
  witness: { length: 14.5 + FBW + WIT_LEN, titleAt: 10.6 + FBW + WIT_LEN, title: '목격자는 말이 없다' },
};

/**
 * @param {HTMLElement} host
 * @param {{kind:'solved'|'escaped'|'witness', murder:{means,clue}, murderer:string, solver:string, sound:object}} o
 */
export function playEnding(host, { kind, murder, murderer, solver, witness, sound }) {
  const F = FILMS[kind];
  const muted = !!(sound && sound.muted);
  const music = score({ length: F.length, muted, bpm: kind === 'solved' ? 96 : 84, cues: kind === 'solved' ? [{ at: 12.9 }, { at: 15.8 + 3.1, notes: [43, 50, 55, 58], vol: 0.14 }, { at: 15.8 + 8.2, notes: [50, 57, 62, 66] }, { at: 24.1 + FBW, notes: [50, 57, 62, 66] }, { at: 27.7 + FBW, notes: [50, 54, 57, 62] }] : [{ at: 3.5 }, { at: (kind === 'escaped' ? 6.8 : 7.6) + 3.1, notes: [43, 50, 55, 58], vol: 0.14 }] });
  const scene = (D) => {
    openShot(D, 0);
    if (kind === 'solved') {
      arriveShot(D, 3.6);
      eyesShot(D, 11.2, 'detective');
      evidenceShot(D, 12.8, murder, false);
      flashbackShot(D, 15.8, murder, { watcher: solver ? `정답을 맞힌 ${solver}` : '목격자' });
      accuseShot(D, 15.8 + FBW, murderer, music);
      runShot(D, 20.4 + FBW);
      cuffShot(D, 23.4 + FBW, murderer);
      paperShot(D, 27.6 + FBW, `구룡 살인사건<br>범인 체포`, `범인은 ${esc(murderer)} — ${esc(K.CARD[murder.means].name)}, 그리고 ${esc(K.CARD[murder.clue].name)}`, `${solver ? `${esc(solver)} 수사관의 한 수가 사건을 끝냈다. ` : ''}비 내리는 밤, 네온 아래 골목에서 벌어진 사건은 법의학자의 말없는 증언과 수사관들의 추리로 막을 내렸다. 범인은 끝까지 태연했지만 증거는 거짓말을 하지 않았다.`);
    } else if (kind === 'escaped') {
      evidenceShot(D, 3.4, murder, true);
      flashbackShot(D, 6.8, murder);
      walkAwayShot(D, 6.8 + FB);
      eyesShot(D, 11.6 + FB, 'murderer');
      emptyAlleyShot(D, 13.2 + FB, murder);
    } else {
      boothShot(D, 3.4);
      flashbackShot(D, 7.6, murder, { watcher: witness ? `목격자 ${witness}` : '목격자', outcome: 'witness' });
      hitWitnessShot(D, 7.6 + FBW, murder, witness ? `목격자 ${witness}` : '목격자');
      stairDragShot(D, 7.6 + FBW + 6.8);
      roofShots(D, 7.6 + FBW + 9.4, witness);
      eyesShot(D, 7.6 + FBW + WIT_LEN, 'murderer');
      receiverShot(D, 9.2 + FBW + WIT_LEN);
    }
  };
  const sub = kind === 'solved' ? `범인: ${murderer}` : `범인은 ${murderer} 였다`;
  return playFilm(host, { scene, length: F.length, title: F.title, titleAt: F.titleAt, sub, sound: sound || {} }).finally(() => music.stop());
}

// 영상 확인용: 컷 하나만 틀어 본다
export const _shots = { flashbackShot, hitWitnessShot, stairDragShot, roofShots };
export { playFilm };
