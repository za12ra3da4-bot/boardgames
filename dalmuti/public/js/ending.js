// 왕궁의 달무티 결말 영상: 새 대달무티의 대관식
// 붉은 융단을 걸어 왕좌로 → 신하들이 고개 숙임 → (농노 출신이면 회상) → 왕관이 내려와 씌워짐 → 왕좌에 앉아 홀을 든다 · 광대가 춤추고 꼴찌는 바닥을 닦는다
import { POSE, gait, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, say, cast, score, CINE_CSS } from '/anim/cine.js';
import { svg, playFilm } from '/anim/director.js';
import { o, l, c, face, SKIN } from './paint.js';

// 확장판: 'joseon' 이면 근정전 · 곤룡포 · 익선관으로 바뀐다
let ED = 'classic';
const JO = () => ED === 'joseon';
const JL = {
  official: { skin: '#e8b894', skinD: '#a8765a', hair: '#1a1210', coat: '#8a1a3a', coatD: '#4a0a1e', coat2: '#1a2a5a', shirt: '#f4f0e6', tie: null, pants: '#8a1a3a', pantsD: '#4a0a1e', shoe: '#141418', hat: 'samo', hairStyle: 'short', brow: '#1a1210' },
  official2: { skin: '#e0b090', skinD: '#a47050', hair: '#1a1210', coat: '#1a3a7a', coatD: '#0a1a40', coat2: '#8a1a3a', shirt: '#f4f0e6', tie: null, pants: '#1a3a7a', pantsD: '#0a1a40', shoe: '#141418', hat: 'samo', hairStyle: 'short', brow: '#1a1210' },
  lady: { skin: '#f4c8a8', skinD: '#c08868', hair: '#140c0c', coat: '#3a8a5a', coatD: '#15402a', coat2: '#e8c040', shirt: '#f8f4ea', tie: null, pants: '#c8303a', pantsD: '#7a1018', shoe: '#f4f0e6', hat: 'none', hairStyle: 'bob', brow: '#140c0c', lips: '#b83a4a' },
  king: { skin: '#e8b894', skinD: '#a8765a', hair: '#1a1210', coat: '#c8202e', coatD: '#6a0610', coat2: '#e0b030', shirt: '#f4f0e6', tie: '#e0b030', pants: '#6a0610', pantsD: '#3a0408', shoe: '#141418', hat: 'ikseon', hairStyle: 'short', brow: '#1a1210' },
  dancer: { skin: '#f0c8a8', skinD: '#b8826a', hair: '#1a1210', coat: '#f4f0e6', coatD: '#b8b0a0', coat2: '#c8303a', shirt: '#2a4a9a', tie: null, pants: '#2a4a9a', pantsD: '#10204a', shoe: '#f4f0e6', hat: 'band', hairStyle: 'short', brow: '#1a1210' },
  nobi: { skin: '#c89068', skinD: '#8a5a3a', hair: '#1a1210', coat: '#d8d0bc', coatD: '#8a8270', coat2: '#b8b0a0', shirt: '#e8e0c8', tie: null, pants: '#c8c0ac', pantsD: '#8a8270', shoe: '#6a5a40', hat: 'band', hairStyle: 'short', brow: '#1a1210' },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

/* ═════════ 배경: 왕좌의 방 ═════════ */
function hall({ throne = true } = {}) {
  const r = rnd(5);
  let pillars = '';
  for (let i = 0; i < 5; i++) {
    const k = i / 4;
    const xL = 120 + k * 480;
    const xR = 1480 - k * 480;
    const w = 90 - k * 60;
    const top = 60 + k * 170;
    for (const x of [xL, xR]) {
      pillars += `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${760 - top - k * 60}" fill="url(#pil)"/><rect x="${x - w / 2 - 6}" y="${top - 16}" width="${w + 12}" height="18" fill="#6a4a2a"/>`;
      pillars += `<path d="M${x - w * 0.3} ${top + 20} v${400 - k * 200}" stroke="#fff" stroke-opacity=".1" stroke-width="${3 - k * 2}"/>`;
    }
    // 깃발
    pillars += `<path d="M${xL + w / 2} ${top + 30} h${60 - k * 40} v${130 - k * 70} l-${(60 - k * 40) / 2} -${20 - k * 10} l-${(60 - k * 40) / 2} ${20 - k * 10}Z" fill="#8a1018" stroke="#e0b030" stroke-width="${3 - k * 2}"/>`;
    pillars += `<path d="M${xR - w / 2} ${top + 30} h-${60 - k * 40} v${130 - k * 70} l${(60 - k * 40) / 2} -${20 - k * 10} l${(60 - k * 40) / 2} ${20 - k * 10}Z" fill="#1a3a8a" stroke="#e0b030" stroke-width="${3 - k * 2}"/>`;
    // 촛대 불빛
    for (const x of [xL + w, xR - w]) pillars += `<ellipse cx="${x}" cy="${top + 260 - k * 80}" rx="${40 - k * 25}" ry="${50 - k * 30}" fill="url(#candle)"/><rect x="${x - 3}" y="${top + 262 - k * 80}" width="6" height="${30 - k * 15}" fill="#f4ecd8"/>`;
  }
  const win = `<path d="M720 60 h160 v240 h-160Z" fill="#1a2a5a"/><path d="M720 60 Q800 0 880 60" fill="#1a2a5a"/><path d="M800 20 V300 M720 160 H880" stroke="#3a2410" stroke-width="8"/><ellipse cx="800" cy="200" rx="140" ry="190" fill="#8ab0f0" opacity=".12"/>`;
  const thr = throne ? `<g transform="translate(800 560)"><path d="M-80 60 V-140 Q-80 -200 0 -220 Q80 -200 80 -140 V60Z" fill="url(#gld)" stroke="#3a2406" stroke-width="5"/><path d="M-56 50 V-120 Q-56 -170 0 -186 Q56 -170 56 -120 V50Z" fill="#8a1018"/>
    <path d="M-100 60 H100 V90 H-100Z" fill="url(#gld)" stroke="#3a2406" stroke-width="4"/><circle cy="-200" r="14" fill="#c8202a" stroke="#3a2406" stroke-width="3"/></g>
    <path d="M620 700 H980 L1000 740 H600Z" fill="#6a4a2a"/><path d="M580 740 H1020 L1040 780 H560Z" fill="#5a3a1a"/>` : '';
  let carpet = '<path d="M740 560 L860 560 L1260 900 L340 900Z" fill="url(#rug)"/><path d="M740 560 L700 560 L260 900 L340 900Z M860 560 L900 560 L1340 900 L1260 900Z" fill="#e0b030" opacity=".8"/>';
  for (let i = 0; i < 6; i++) carpet += `<path d="M${780 - i * 60} ${600 + i * 60} h${40 + i * 120}" stroke="#e0b030" stroke-width="${2 + i}" opacity=".4"/>`;
  void r;
  return `<defs>
    <linearGradient id="wall" x2="0" y2="1"><stop offset="0" stop-color="#2a0e10"/><stop offset="1" stop-color="#5a1a1a"/></linearGradient>
    <linearGradient id="flr" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1a"/><stop offset="1" stop-color="#1a0e08"/></linearGradient>
    <linearGradient id="pil" x2="1"><stop offset="0" stop-color="#5a4a3a"/><stop offset=".45" stop-color="#b8a080"/><stop offset="1" stop-color="#3a2a1a"/></linearGradient>
    <linearGradient id="gld" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>
    <linearGradient id="rug" x2="0" y2="1"><stop offset="0" stop-color="#6a0a14"/><stop offset="1" stop-color="#b81a24"/></linearGradient>
    <radialGradient id="candle"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>
  </defs><rect width="1600" height="900" fill="url(#wall)"/>${win}<rect y="560" width="1600" height="340" fill="url(#flr)"/>${carpet}${thr}${pillars}`;
}
/** 일월오봉도 (x, y 에 w×h 로) */
function ilwol(x, y, w, h) {
  const sx = w / 240;
  const sy = h / 300;
  return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><rect width="240" height="300" fill="#2a5a9a"/><circle cx="46" cy="60" r="20" fill="#d8303a"/><circle cx="194" cy="60" r="20" fill="#f4f0e6"/>
    <path d="M-10 230 L30 130 L60 190 L90 90 L120 170 L150 90 L180 190 L210 130 L250 230Z" fill="#1a6a5a" stroke="#0e3a30" stroke-width="3"/>
    <path d="M90 90 L100 120 L80 120Z M150 90 L160 120 L140 120Z M30 130 L38 150 L22 150Z M210 130 L218 150 L202 150Z" fill="#e8f0e0" opacity=".8"/>
    ${[20, 220].map((px) => `<g transform="translate(${px} 250) scale(.9)"><path d="M0 0 C-4 -30 6 -50 0 -80" stroke="#8a2a1a" stroke-width="7" fill="none"/>${[-70, -50, -30].map((yy, i) => `<ellipse cx="${i % 2 ? 10 : -10}" cy="${yy}" rx="${22 - i * 3}" ry="8" fill="#1a5a3a"/>`).join('')}</g>`).join('')}
    <rect y="230" width="240" height="70" fill="#1a3a7a"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 22 - 10} ${250 + (i % 2) * 14} q11 -12 22 0" stroke="#f4f0e6" stroke-width="3" fill="none"/>`).join('')}
    <rect width="240" height="300" fill="none" stroke="#6a1a10" stroke-width="10"/></g>`;
}
/** 근정전 안: 붉은 기둥 · 단청 · 일월오봉도 병풍 앞 어좌 · 박석 길 */
function palaceHall({ throne = true } = {}) {
  let cols = '';
  for (let i = 0; i < 4; i++) {
    const k = i / 3;
    const w = 80 - k * 46;
    const top = 70 + k * 150;
    for (const x of [130 + k * 420, 1470 - k * 420]) {
      cols += `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${780 - top - k * 50}" fill="url(#pcol)"/><path d="M${x - w * 0.25} ${top + 30} v${380 - k * 200}" stroke="#fff" stroke-opacity=".15" stroke-width="${3 - k * 2}"/>`;
      cols += `<rect x="${x - w / 2 - 8}" y="${top - 30}" width="${w + 16}" height="30" fill="#2a7a5a"/>${[0, 1, 2].map((j) => `<circle cx="${x - w / 2 + (j + 0.5) * (w / 3)}" cy="${top - 15}" r="${7 - k * 3}" fill="#e8c040"/><circle cx="${x - w / 2 + (j + 0.5) * (w / 3)}" cy="${top - 15}" r="${3 - k}" fill="#c8303a"/>`).join('')}`;
      // 청사초롱
      cols += `<path d="M${x + (x < 800 ? w : -w)} ${top + 40} v${40 - k * 20}" stroke="#3a2410" stroke-width="2"/><rect x="${x + (x < 800 ? w : -w) - (16 - k * 8)}" y="${top + 80 - k * 20}" width="${32 - k * 16}" height="${44 - k * 22}" rx="6" fill="#2a4a9a"/><rect x="${x + (x < 800 ? w : -w) - (16 - k * 8)}" y="${top + 92 - k * 24}" width="${32 - k * 16}" height="${18 - k * 9}" fill="#c8303a"/><ellipse cx="${x + (x < 800 ? w : -w)}" cy="${top + 100 - k * 20}" rx="${50 - k * 24}" ry="${50 - k * 24}" fill="url(#candle)"/>`;
    }
  }
  const thr = throne ? `${ilwol(560, 150, 480, 400)}<g transform="translate(800 560)"><path d="M-70 60 V-120 Q-70 -160 0 -170 Q70 -160 70 -120 V60Z" fill="#a81a1a" stroke="#3a0806" stroke-width="5"/><path d="M-54 50 V-110 Q-54 -140 0 -148 Q54 -140 54 -110 V50Z" fill="#c8303a"/>
    <path d="M-90 60 H90 V88 H-90Z" fill="#a81a1a" stroke="#3a0806" stroke-width="4"/><path d="M-70 -120 Q0 -140 70 -120" stroke="#e0b030" stroke-width="4" fill="none"/></g>
    <path d="M620 700 H980 L1000 740 H600Z" fill="#8a8a82"/><path d="M580 740 H1020 L1040 780 H560Z" fill="#7a7a72"/>` : '';
  let path = '<path d="M740 560 L860 560 L1260 900 L340 900Z" fill="#a8a498"/>';
  for (let i = 0; i < 9; i++) path += `<path d="M${760 - i * 48} ${580 + i * 36} H${840 + i * 48}" stroke="#7a766a" stroke-width="${1.5 + i * 0.4}"/>`;
  return `<defs>
    <linearGradient id="pwall" x2="0" y2="1"><stop offset="0" stop-color="#3a1a10"/><stop offset="1" stop-color="#5a2a18"/></linearGradient>
    <linearGradient id="pfl" x2="0" y2="1"><stop offset="0" stop-color="#6a6a62"/><stop offset="1" stop-color="#3a3a34"/></linearGradient>
    <linearGradient id="pcol" x2="1"><stop offset="0" stop-color="#6a0a0a"/><stop offset=".45" stop-color="#c8302a"/><stop offset="1" stop-color="#5a0808"/></linearGradient>
    <radialGradient id="candle"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".6"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>
  </defs><rect width="1600" height="900" fill="url(#pwall)"/>
  <rect y="0" width="1600" height="40" fill="#2a7a5a"/>${Array.from({ length: 27 }, (_, i) => `<circle cx="${30 + i * 60}" cy="20" r="11" fill="#e8c040"/><circle cx="${30 + i * 60}" cy="20" r="5" fill="#c8303a"/>`).join('')}<path d="M0 40 H1600" stroke="#3a6ac8" stroke-width="6"/>
  <rect y="560" width="1600" height="340" fill="url(#pfl)"/>${path}${thr}${cols}`;
}
function field() {
  return `<defs><linearGradient id="sk" x2="0" y2="1"><stop offset="0" stop-color="#e8c890"/><stop offset="1" stop-color="#f4dcb0"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#sk)"/><circle cx="1200" cy="220" r="90" fill="#fff0c0"/><path d="M0 560 Q400 520 800 550 T1600 540 V900 H0Z" fill="#c8a040"/>
    ${Array.from({ length: 60 }, (_, i) => `<path d="M${i * 28} 900 L${i * 28 + 10} ${580 + (i % 5) * 10}" stroke="#a08020" stroke-width="3"/>`).join('')}<path d="M100 560 l60 -80 l60 80Z M300 560 l40 -50 l40 50Z" fill="#8a6a3a"/>`;
}
const STYLE = `<style>
.dm-sepia { filter: sepia(.85) contrast(.95) brightness(.95); }
.dm-conf { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.dm-conf i { position:absolute; top:-20px; width:10px; height:16px; animation: dmc linear forwards; }
@keyframes dmc { to { transform: translateY(110vh) rotate(720deg); } }
.dm-rays { position:absolute; left:50%; top:30%; width:1400px; height:1400px; margin:-700px 0 0 -700px; background: repeating-conic-gradient(rgba(255,230,140,.16) 0 8deg, transparent 8deg 20deg); animation: dmr 14s linear infinite; mix-blend-mode: screen; }
@keyframes dmr { to { transform: rotate(360deg); } }
.dm-name { position:absolute; left:50%; bottom:22%; transform:translateX(-50%); font: 800 clamp(24px,4vw,56px) 'Nanum Myeongjo',serif; color:#fff4c0; text-shadow: 0 4px 0 #6a1010, 0 0 30px #e0b030; white-space:nowrap; opacity:0; }
</style>`;
const BG = (h) => `<div style="position:absolute;left:0;top:0">${h.replace('<svg ', '<svg style="width:1600px;height:900px;display:block" ')}</div>`;

function confetti(host, n = 90) {
  const box = document.createElement('div');
  box.className = 'dm-conf';
  const cols = ['#e0b030', '#c8202a', '#fff4c0', '#2a6ac8', '#2a8a4a'];
  box.innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % 5]};animation-duration:${2.5 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.5}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  host.appendChild(box);
}

/* ═════════ 컷 ═════════ */
function scene(D, html = '') { D.add(STYLE + CINE_CSS + html); const shot = D.root(); return { shot, S: stage(shot) }; }

/** ① 붉은 융단 입장: 신하들이 양옆에서 고개를 숙인다 */
function procession(D, t0, champion, noble) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.35, BG(svg(JO() ? palaceHall() : hall())));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const cl = JO() ? [JL.official2, JL.lady, JL.official2, JL.lady] : ['courtier', 'lady', 'courtier', 'lady'];
    const courtiers = [[380, cl[0], false], [560, cl[1], false], [1060, cl[2], true], [1240, cl[3], true]].map(([x, look, flip]) => C.add({ look, x, y: 840, scale: 1.05, flip, rim: '#ffcf7a', rimSide: flip ? -1 : 1 }));
    const hero = C.add({ look: JO() ? JL.official : noble, x: -120, y: 860, scale: 1.25, rim: '#fff0b0' });
    const cam = camPath(S.cam, [[0, { x: 520, y: 470, z: 1.1 }], [3.6, { x: 900, y: 460, z: 1.15 }], [5.4, { x: 900, y: 440, z: 1.3 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const x = Math.min(1000, -120 + s * 300);
      if (x < 1000) hero.set({ ...POSE.stand, ...gait((s * 1.05) % 1), x });
      else hero.set({ ...POSE.stand, x, head: -4 });
      courtiers.forEach((c, i) => {
        const bowAt = 0.8 + i * 0.5;
        const k = ease.inOut(Math.max(0, Math.min(1, (s - bowAt) / 0.6)));
        c.set({ ...mixPose(POSE.stand, { ...POSE.stand, ...POSE.bow }, k), x: c.world.x });
      });
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, JO() ? '내관' : '전령', JO() ? `모두 예를 갖추시오! 새 임금, ${esc(champion)} 전하 납시오!` : `모두 고개를 숙여라! 새로운 대달무티, ${esc(champion)} 님이시다!`, 2.6, '#f8e08a'), 900);
  });
}
/** 회상: 한때 밀밭의 농노였다 (세피아) */
function flashback(D, t0, champion) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    shot.classList.add('dm-sepia');
    S.layer(0.4, BG(svg(field())));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const p = C.add({ look: 'peasant', x: 700, y: 860, scale: 1.4, rim: '#ffe0a0' });
    p.hold('hoe');
    const cam = camPath(S.cam, [[0, { x: 760, y: 470, z: 1.35 }], [2.6, { x: 720, y: 480, z: 1.15 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      p.set({ ...POSE.stand, ...POSE.kneel, upperF: -70 + Math.sin(s * 5) * 20, x: 700 });
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, '', `첫 판, ${esc(champion)} 님은 밀밭의 농노였다…`, 2.2, '#f8e08a'), 300);
  });
}
/** ② 왕관 초근접: 위에서 내려와 머리에 씌워진다 */
function crownShot(D, t0, noble, music) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D, '<div class="dm-rays"></div>');
    S.layer(0.3, BG(svg(JO() ? palaceHall({ throne: true }) : hall({ throne: true }))));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const hero = C.add({ look: JO() ? { ...JL.king, hat: 'none' } : noble, x: 800, y: 900, scale: 1.6, rim: '#fff0b0' });
    hero.set({ ...POSE.stand, head: -6, neck: -2 });
    // 내려오는 왕관 (인형과 같은 좌표계)
    const crown = document.createElement('div');
    crown.innerHTML = JO()
      ? `<svg viewBox="-60 -60 120 90" style="position:absolute;left:0;top:0;width:240px;overflow:visible"><path d="M-36 22 C-40 -12 -16 -26 4 -26 C26 -24 40 -10 36 22 C10 26 -12 26 -36 22Z" fill="#141418" stroke="#000" stroke-width="3"/><path d="M-26 -6 C-50 -38 -36 -60 -14 -52 C-10 -36 -12 -20 -16 -8Z" fill="#141418" stroke="#000" stroke-width="3"/><path d="M-36 16 C-8 22 14 22 36 16" stroke="#e0b030" stroke-width="3" fill="none"/></svg>`
      : `<svg viewBox="-60 -60 120 90" style="position:absolute;left:0;top:0;width:240px;overflow:visible"><path d="M-44 20 L-52 -40 L-20 -10 L0 -56 L20 -10 L52 -40 L44 20 Q0 8 -44 20Z" fill="#e0b030" stroke="#3a2406" stroke-width="4"/><circle cy="0" r="8" fill="#c8202a" stroke="#3a2406" stroke-width="2"/><circle cx="-52" cy="-40" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/><circle cy="-56" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/><circle cx="52" cy="-40" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/></svg>`;
    L.el.appendChild(crown);
    S.cam.x = 810;
    S.cam.y = 230;
    S.cam.z = 1.8;
    let last = 0;
    let landed = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      const k = ease.out(Math.min(1, s / 1.8));
      crown.style.transform = `translate(${692}px, ${-220 + k * 250}px) rotate(${(1 - k) * -12}deg)`;
      if (k >= 1 && !landed) { landed = true; music.hit([60, 64, 67, 72]); D.flash('#fff4c0', 300); D.sound.bells && D.sound.bells(); }
      S.cam.y = 230 + Math.min(1, s / 2.4) * 30;
      C.update(dt);
      S.render(s);
    });
  });
}
/* ═════════ 정면을 보고 왕좌에 앉은 왕 (퍼펫은 옆모습 전용이라 따로 그린다) ═════════
   얼굴은 카드 그림(paint.js)과 같은 화풍 · 긴 옷자락이 무릎을 덮고 두 팔은 팔걸이에 얹는다 */
function frontKing(host, { x = 800, y = 650, scale = 1.05, look = 'west' } = {}) {
  const INK = '#1a0e08';
  const jo = look === 'joseon';
  const skin = SKIN.a;
  const hs = 0.86; // 카드 얼굴(머리 중심 120,112) → 왕 머리 크기
  const HX = -120 * hs;
  const HY = -266 - 112 * hs;
  const P = { skin: skin[0], shade: skin[1], mood: 'calm', age: jo ? 0.2 : 0.5, brow: jo ? '#1a1210' : '#3a200e', eye: '#2a1a10' };
  const hair = jo ? '#1a1210' : '#4a2a12';
  // ── 머리 (카드 좌표 240×300 기준)
  const headArt = jo
    ? face(P)
      + o('M104 144 Q120 140 136 144 Q130 150 120 149 Q110 150 104 144Z', '#1a1210', 1.4) + o('M113 158 Q120 178 127 158 Q120 162 113 158Z', '#1a1210', 1.4)
      + o('M84 94 C80 58 98 44 120 44 C142 44 160 58 156 94 Q120 86 84 94Z', '#141418')
      + o('M98 58 C88 30 108 24 114 50Z', '#141418', 2) + o('M142 58 C152 30 132 24 126 50Z', '#141418', 2)
      + l('M84 90 Q120 82 156 90', 3, '#d8a830') + l('M96 62 Q120 56 144 62', 1.4, '#d8a830', 0.7)
    : o('M80 150 C70 120 72 80 90 62 L92 120Z M160 150 C170 120 168 80 150 62 L148 120Z', hair)
      + face(P)
      + o('M86 108 C84 76 100 60 120 60 C140 60 156 76 154 108 C148 88 136 80 120 80 C104 80 92 88 86 108Z', hair)
      + o('M92 136 C94 172 108 196 120 200 C132 196 146 172 148 136 C140 150 130 156 120 156 C110 156 100 150 92 136Z', hair)
      + o('M104 146 Q120 141 136 146 Q128 152 120 150 Q112 152 104 146Z', hair, 1.4) + l('M106 170 q6 14 14 24 M134 170 q-6 14 -14 24', 1.2, '#2a1808', 0.6)
      + o('M82 76 L76 38 L96 56 L108 26 L120 50 L132 26 L144 56 L164 38 L158 76 Q120 64 82 76Z', 'url(#gold)')
      + [96, 120, 144].map((cx, i) => c(cx, 66, 5, ['#c8202a', '#2a6ac8', '#1a9a4a'][i], 1.4)).join('')
      + [[76, 38], [108, 26], [132, 26], [164, 38]].map(([cx, cy]) => c(cx, cy, 4.4, '#fff4c0', 1.4)).join('')
      + `<ellipse cx="120" cy="78" rx="40" ry="7" fill="#f8f4ea" stroke="${INK}" stroke-width="2"/>` + [96, 110, 124, 138].map((dx) => `<path d="M${dx} 75 l2.4 6 l2.4 -6" fill="${INK}"/>`).join('');
  const headSvg = headArt.replace(/url\(#skin\)/g, 'url(#fkSkin)').replace(/url\(#gold\)/g, 'url(#fkG)');
  // 눈 깜빡임 · 입 (카드 얼굴 위에 덮는다)
  const lids = `<g class="fk-lids" opacity="0">${[105, 136].map((ex) => `<path d="M${ex - 12} 110 C${ex - 6} 102 ${ex + 6} 102 ${ex + 12} 110 C${ex + 6} 114 ${ex - 6} 114 ${ex - 12} 110Z" fill="${skin[0]}"/><path d="M${ex - 12} 110 C${ex - 6} 114 ${ex + 6} 114 ${ex + 12} 110" stroke="${INK}" stroke-width="2.4" fill="none"/>`).join('')}</g>`;
  const mouth = `<ellipse class="fk-mouth" cx="120" cy="150" rx="9" ry="0" fill="#3a0a0a"/>`;

  // ── 몸
  const robe = jo ? ['#d0283a', '#6a0610'] : ['#b81c2a', '#4a0610'];
  const cuff = jo ? '#1a2a6a' : '#f8f4ea';
  const handAt = (hx, hy, rot) => `<g transform="translate(${hx} ${hy}) scale(1.25) rotate(${rot})">${o('M-12 -8 C-16 4 -12 16 -2 18 L10 16 C16 8 14 -4 10 -10 Z', skin[0], 2)}${l('M-8 2 h14 M-8 8 h13', 1.2, skin[1])}${o('M8 -8 C16 -12 20 -6 16 0 L10 -2Z', skin[0], 1.6)}</g>`;
  const dragon = (cx, cy, rr) => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="url(#fkG)" stroke="${INK}" stroke-width="2.4"/><path d="M${cx - rr * 0.55} ${cy + rr * 0.1} C${cx - rr * 0.4} ${cy - rr * 0.6} ${cx + rr * 0.2} ${cy - rr * 0.6} ${cx + rr * 0.25} ${cy - rr * 0.1} C${cx + rr * 0.3} ${cy + rr * 0.3} ${cx + rr * 0.6} ${cy + rr * 0.3} ${cx + rr * 0.55} ${cy - rr * 0.2} M${cx - rr * 0.4} ${cy + rr * 0.45} q${rr * 0.4} ${-rr * 0.2} ${rr * 0.8} 0" stroke="#8a1a10" stroke-width="${rr * 0.12}" fill="none" stroke-linecap="round"/><circle cx="${cx - rr * 0.3}" cy="${cy - rr * 0.25}" r="${rr * 0.08}" fill="#8a1a10"/>`;
  const torso = `
      <!-- 무릎을 덮은 긴 옷자락 -->
      <path d="M-78 -46 C-90 0 -92 60 -84 124 Q-42 134 0 130 Q42 134 84 124 C92 60 90 0 78 -46Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      <path d="M-40 -30 C-46 20 -44 80 -48 128 M40 -30 C46 20 44 80 48 128 M0 -20 V130 M-74 0 C-82 40 -84 80 -80 122 M74 0 C82 40 84 80 80 122" stroke="#000" stroke-width="3" fill="none" opacity=".22"/>
      <ellipse cx="-42" cy="4" rx="30" ry="14" fill="#fff" opacity=".1"/><ellipse cx="42" cy="4" rx="30" ry="14" fill="#fff" opacity=".1"/>
      <path d="M-58 122 Q-38 144 -14 128 Z M14 128 Q38 144 58 122 Z" fill="${jo ? '#141418' : '#3a2410'}" stroke="${INK}" stroke-width="4"/>
      ${jo ? '' : '<path d="M-84 124 Q-42 134 0 130 Q42 134 84 124" stroke="#e0b030" stroke-width="6" fill="none"/>'}
      <!-- 윗몸: 둥근 어깨 → 허리 -->
      <path d="M-76 -178 C-90 -150 -84 -90 -78 -44 H78 C84 -90 90 -150 76 -178 C48 -194 -48 -194 -76 -178Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      <path d="M-60 -160 C-66 -120 -62 -80 -60 -50 M60 -160 C66 -120 62 -80 60 -50" stroke="#000" stroke-width="3" fill="none" opacity=".2"/>
      ${jo
        ? `<path d="M-40 -186 Q0 -150 40 -186" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-22 -184 L0 -150 L22 -184" fill="none" stroke="#f8f4ea" stroke-width="7"/>
           ${dragon(0, -112, 30)}${dragon(-58, -158, 17)}${dragon(58, -158, 17)}
           <path d="M-90 -58 C-40 -40 40 -40 90 -58 L90 -44 C40 -26 -40 -26 -90 -44Z" fill="#1a1a2a" stroke="${INK}" stroke-width="3"/>${[-64, -32, 0, 32, 64].map((bx) => `<rect x="${bx - 8}" y="${-48 + Math.abs(bx) * 0.12}" width="16" height="14" rx="2" fill="#e8f0d8" stroke="${INK}" stroke-width="1.6"/>`).join('')}`
        : `<path d="M0 -150 V-46" stroke="url(#fkG)" stroke-width="6"/>${[-126, -104, -82].map((by) => `<circle cx="0" cy="${by}" r="3.4" fill="url(#fkG)" stroke="${INK}" stroke-width="1.2"/>`).join('')}
           <path d="M-86 -60 H86 V-44 H-86Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><rect x="-13" y="-65" width="26" height="26" rx="4" fill="#c8202a" stroke="${INK}" stroke-width="3"/>
           <path d="M-96 -164 C-84 -202 84 -202 96 -164 C88 -140 54 -134 0 -140 C-54 -134 -88 -140 -96 -164Z" fill="#f8f4ea" stroke="${INK}" stroke-width="4"/>
           ${[-80, -54, -28, 0, 28, 54, 80].map((dx, i) => `<path d="M${dx - 2} ${-160 + (i % 2) * 8 - Math.abs(dx) * 0.08} l2.4 7 l2.4 -7" fill="${INK}"/>`).join('')}
           <path d="M-58 -144 Q0 -84 58 -144" stroke="url(#fkG)" stroke-width="7" fill="none" stroke-dasharray="10 4"/><circle cx="0" cy="-108" r="14" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-108" r="5.4" fill="#c8202a"/>`}
      <!-- 쉬는 팔: 팔걸이에 얹은 아래팔 -->
      <path d="M70 -172 C98 -160 114 -120 118 -84 L120 -70 L94 -66 C92 -96 84 -128 62 -150Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      <path d="M92 -76 L122 -80 L124 -62 L94 -58Z" fill="${cuff}" stroke="${INK}" stroke-width="3"/>
      ${handAt(114, -54, -80)}
      <path d="M-16 -206 H16 L18 -180 H-18Z" fill="${skin[1]}" stroke="${INK}" stroke-width="4"/>
      <g class="fk-head"><g transform="translate(${HX} ${HY}) scale(${hs})">${headSvg}${lids}${mouth}</g></g>
      <!-- 홀을 드는 팔 (어깨 기준 회전) -->
      <g class="fk-arm">
        <path d="M-70 -172 C-98 -160 -114 -120 -118 -84 L-120 -70 L-94 -66 C-92 -96 -84 -128 -62 -150Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
        <path d="M-92 -76 L-122 -80 L-124 -62 L-94 -58Z" fill="${cuff}" stroke="${INK}" stroke-width="3"/>
        <g class="fk-scep">
          <path d="M-112 -170 H-104 V40 H-112Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          <path d="M-104 -40 h8 M-120 -40 h8 M-104 -110 h6 M-118 -110 h6" stroke="url(#fkG)" stroke-width="4"/>
          <path d="M-120 -170 Q-108 -186 -96 -170 L-100 -160 H-116Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          ${jo
            ? `<path d="M-108 -214 C-124 -204 -124 -186 -108 -176 C-92 -186 -92 -204 -108 -214Z" fill="#e8f0d8" stroke="${INK}" stroke-width="3"/><path d="M-108 -206 V-184" stroke="#6a8a6a" stroke-width="2"/>`
            : `<circle cx="-108" cy="-196" r="18" fill="#b81a24" stroke="${INK}" stroke-width="4"/><path d="M-126 -196 H-90 M-108 -214 V-178" stroke="url(#fkG)" stroke-width="3"/><circle cx="-114" cy="-202" r="5" fill="#fff" opacity=".6"/><path d="M-108 -214 V-234 M-118 -224 H-98" stroke="url(#fkG)" stroke-width="6" stroke-linecap="round"/>`}
        </g>
        ${handAt(-108, -54, 80)}
      </g>`;

  const html = `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible">
  <defs>
    <linearGradient id="fkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>
    <linearGradient id="fkR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${robe[0]}"/><stop offset="1" stop-color="${robe[1]}"/></linearGradient>
    <linearGradient id="fkC" x1="0" x2="1"><stop offset="0" stop-color="#3a0410"/><stop offset=".5" stop-color="#7a1220"/><stop offset="1" stop-color="#3a0410"/></linearGradient>
    <linearGradient id="fkSkin" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe0c8"/><stop offset=".5" stop-color="#e8b894"/><stop offset="1" stop-color="#b87a58"/></linearGradient>
    <radialGradient id="fkHalo"><stop offset="0" stop-color="#fff0b0" stop-opacity=".45"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
  </defs>
  <g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round">
    <path d="M-260 140 H260 L290 180 H-290Z" fill="#6a4a2a" stroke="${INK}" stroke-width="4"/><path d="M-300 180 H300 L330 225 H-330Z" fill="#5a3a1a" stroke="${INK}" stroke-width="4"/>
    <path d="M-240 140 H240" stroke="#c8942a" stroke-width="4"/>
    ${jo ? ilwol(-270, -540, 540, 470) : ''}
    <ellipse cx="0" cy="-200" rx="260" ry="240" fill="url(#fkHalo)"/>
    <path d="M-130 60 V-250 Q-130 -340 0 -362 Q130 -340 130 -250 V60Z" fill="${jo ? '#8a1010' : 'url(#fkG)'}" stroke="${INK}" stroke-width="6"/>
    <path d="M-100 50 V-238 Q-100 -312 0 -330 Q100 -312 100 -238 V50Z" fill="${jo ? '#c8302a' : 'url(#fkC)'}"/>
    ${jo ? '<path d="M-118 -250 Q0 -300 118 -250" stroke="#e0b030" stroke-width="5" fill="none"/>' : ''}
    <circle cx="0" cy="-352" r="17" fill="#c8202a" stroke="${INK}" stroke-width="4"/><circle cx="-5" cy="-357" r="5" fill="#fff" opacity=".7"/>
    ${jo ? '' : `<!-- 담비 망토: 어깨에서 왕좌 위로 펼쳐진다 -->
    <path d="M-86 -178 C-150 -130 -168 -20 -156 70 Q0 96 156 70 C168 -20 150 -130 86 -178Z" fill="url(#fkC)" stroke="${INK}" stroke-width="5"/>
    <path d="M-156 70 C-168 -20 -150 -130 -90 -174 M156 70 C168 -20 150 -130 90 -174" stroke="#f8f4ea" stroke-width="16" fill="none"/>
    ${[-150, -140, 140, 150].map((dx, i) => `<path d="M${dx} ${-40 + i * 30} l2.4 7 l2.4 -7" fill="${INK}"/>`).join('')}`}
    <path d="M-176 -80 H-110 V-46 H-176Z M110 -80 H176 V-46 H110Z" fill="${jo ? '#8a1010' : 'url(#fkG)'}" stroke="${INK}" stroke-width="5"/>
    <path d="M-172 -46 V120 H-148 V-46Z M148 -46 V120 H172 V-46Z" fill="${jo ? '#6a0a0a' : '#b8862a'}" stroke="${INK}" stroke-width="5"/>
    <path d="M-112 30 H112 V66 H-112Z" fill="${jo ? '#8a1010' : 'url(#fkG)'}" stroke="${INK}" stroke-width="5"/>
    <g class="fk-body">${torso}</g>
  </g></svg>`;
  host.insertAdjacentHTML('beforeend', html);
  const root = host.lastElementChild;
  const bodyEl = root.querySelector('.fk-body');
  const headEl = root.querySelector('.fk-head');
  const arm = root.querySelector('.fk-arm');
  const scep = root.querySelector('.fk-scep');
  const lidEl = root.querySelector('.fk-lids');
  const mouthEl = root.querySelector('.fk-mouth');
  let blinkAt = 1.5;
  return {
    update(s, { up = 0, talking = false } = {}) {
      bodyEl.setAttribute('transform', `translate(0 ${(Math.sin(s * 2.2) * 1.2).toFixed(2)})`);
      headEl.setAttribute('transform', `rotate(${(Math.sin(s * 0.8) * 2).toFixed(2)} 0 -196)`);
      // 팔: 팔걸이(0°)에서 머리 위로 (홀은 늘 곧게)
      const a = up * 150;
      arm.setAttribute('transform', `rotate(${a.toFixed(2)} -72 -168)`);
      scep.setAttribute('transform', `rotate(${(-a * 0.9).toFixed(2)} -108 -54)`);
      const blink = s > blinkAt && s < blinkAt + 0.13;
      if (s > blinkAt + 0.13) blinkAt = s + 2.4 + Math.random() * 2.5;
      lidEl.setAttribute('opacity', blink ? 1 : 0);
      mouthEl.setAttribute('ry', talking && Math.sin(s * 20) > 0.1 ? 6 : 0);
    },
  };
}
/** ③ 왕좌에 앉아 홀을 든다 · 광대가 춤추고 꼴찌는 바닥을 닦는다 */
function throneShot(D, t0, champion, peon) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.35, BG(svg(JO() ? palaceHall({ throne: false }) : hall({ throne: false }))));
    const L = S.layer(1, '');
    const king = frontKing(L.el, { look: JO() ? 'joseon' : 'west' });
    const C = cast(L.el);
    const jester = C.add({ look: JO() ? JL.dancer : 'jester', x: 470, y: 860, scale: 1.1, rim: '#ffcf7a' });
    const low = C.add({ look: JO() ? JL.nobi : 'peasant', x: 1140, y: 870, scale: 1.1, rim: '#ffcf7a', flip: true, rimSide: -1 });
    low.hold('broom');
    const cam = camPath(S.cam, [[0, { x: 800, y: 440, z: 1.35 }], [3, { x: 800, y: 470, z: 1.05 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const up = ease.back(Math.max(0, Math.min(1, (s - 0.6) / 0.6)));
      king.update(s, { up, talking: s > 3.4 && s < 5 });
      // 광대: 폴짝폴짝 · 팔 휘두르기
      const hop = Math.abs(Math.sin(s * 6));
      jester.set({ ...POSE.stand, ...POSE.cheer, upperF: -160 + Math.sin(s * 12) * 30, upperB: -140 - Math.sin(s * 12) * 30, hipY: -hop * 40, thighF: -hop * 30, thighB: hop * 20, x: 470 + Math.sin(s * 2) * 30, flip: Math.sin(s * 2) < 0 });
      // 꼴찌: 무릎 꿇고 바닥 닦기
      low.set({ ...POSE.stand, ...POSE.kneel, upperF: -70 + Math.sin(s * 8) * 26, foreF: -20, x: 1140 });
      low.mouth(s > 5.5 ? 'grit' : 'closed');
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => { confetti(shot); D.sound.fanfare && D.sound.fanfare(); }, 800);
    setTimeout(() => say(shot, esc(champion), JO() ? '과인이 이 나라의 임금이니라!' : '짐이 이 왕궁의 대달무티다!', 1.8, '#f8e08a'), 3400);
    setTimeout(() => say(shot, esc(peon), JO() ? '다음 판엔… 두고 보시오…' : '다음 판엔… 두고 보자…', 1.6, '#c8b8a8'), 5500);
  });
}

export function playEnding(host, { champion, peon, rose, sound, me, edition }) {
  ED = edition || 'classic';
  const L = rose ? 23 : 20;
  const muted = !!(sound && sound.muted);
  const music = score({ length: L, muted, style: 'royal', bpm: 100 });
  const scene0 = (D) => {
    procession(D, 0, champion, 'noble');
    let t = 5.8;
    if (rose) { flashback(D, t, champion); t += 3.2; }
    crownShot(D, t, 'noble', music);
    throneShot(D, t + 2.8, champion, peon);
    D.at(t + 2.8 + 7.2, () => {
      D.add(`<div class="dm-name">${esc(champion)}</div>`);
      D.anim('.dm-name', [{ opacity: 0, transform: 'translateX(-50%) scale(1.6)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)' }], { duration: 700 });
    });
  };
  return playFilm(host, { scene: scene0, length: L, title: JO() ? (me ? '당신이 임금!' : '즉위식') : (me ? '당신이 대달무티!' : '대관식'), titleAt: L - 3.6, sub: JO() ? `새 임금 ${champion}` : `새 대달무티 ${champion}`, sound: sound || {} }).finally(() => music.stop());
}

// 영상 확인용: 컷 하나만 틀어 본다
export const _shots = { throneShot, frontKing };
export { playFilm };
