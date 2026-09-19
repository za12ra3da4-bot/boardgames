// 왕궁의 달무티 결말 영상: 새 대달무티의 대관식
// 붉은 융단을 걸어 왕좌로 → 신하들이 고개 숙임 → (농노 출신이면 회상) → 왕관이 내려와 씌워짐 → 왕좌에 앉아 홀을 든다 · 광대가 춤추고 꼴찌는 바닥을 닦는다
import { POSE, gait, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, say, cast, score, CINE_CSS } from '/anim/cine.js';
import { svg, playFilm } from '/anim/director.js';

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
   어른 왕의 비율: 작은 머리 · 넓은 어깨 · 수염 · 아몬드 눈 · 무거운 담비 망토 · 직무 목걸이 */
function frontKing(host, { x = 800, y = 650, scale = 1.05, look = 'west' } = {}) {
  const INK = '#1a0e08';
  const jo = look === 'joseon';
  // 옷 색: 서양 왕 = 진홍 벨벳, 조선 임금 = 붉은 곤룡포
  const robeA = '#c8202e';
  const robeB = '#5a0610';
  const dots = (cx, cy, rx, n) => Array.from({ length: n }, (_, i) => `<path d="M${cx - rx + (i + 0.5) * (2 * rx / n)} ${cy - 3} l2.4 6 l2.4 -6" fill="${INK}"/>`).join('');
  const hair = jo ? '#1a1210' : '#5a3418';
  const head = `
        <path d="M-16 -200 H16 L18 -168 H-18Z" fill="#b8784e" stroke="${INK}" stroke-width="4"/>
        ${jo ? '' : `<path d="M-35 -250 C-46 -272 -32 -300 0 -300 C32 -300 46 -272 35 -250 C37 -230 42 -212 36 -200 C30 -216 28 -238 26 -258 C14 -268 -14 -268 -26 -258 C-28 -238 -30 -216 -36 -200 C-42 -212 -37 -230 -35 -250Z" fill="${hair}" stroke="${INK}" stroke-width="4"/>`}
        <path d="M-37 -248 C-44 -250 -46 -232 -36 -228Z M37 -248 C44 -250 46 -232 36 -228Z" fill="#d8946a" stroke="${INK}" stroke-width="3"/>
        <path d="M-32 -252 C-34 -278 -18 -292 0 -292 C18 -292 34 -278 32 -252 C32 -224 26 -202 14 -192 C8 -188 -8 -188 -14 -192 C-26 -202 -32 -224 -32 -252Z" fill="url(#fkS)" stroke="${INK}" stroke-width="4.4"/>
        <path d="M-30 -250 C-30 -226 -24 -206 -12 -194 C-20 -214 -22 -234 -20 -256Z" fill="#b8784e" opacity=".45"/>
        <path d="M22 -236 C26 -228 26 -220 22 -214" stroke="#b8784e" stroke-width="3" fill="none" opacity=".6"/>
        <g class="fk-eyes">
          <path d="M-22 -247 C-18 -252 -8 -252 -4 -247 C-8 -243 -18 -243 -22 -247Z M4 -247 C8 -252 18 -252 22 -247 C18 -243 8 -243 4 -247Z" fill="#f2eadc"/>
          <circle class="fk-pupil" cx="-13" cy="-247" r="3.4" fill="#3a2414"/><circle class="fk-pupil" cx="13" cy="-247" r="3.4" fill="#3a2414"/>
          <path d="M-23 -247 C-18 -253 -8 -253 -3 -248 M3 -248 C8 -253 18 -253 23 -247" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        </g>
        <g class="fk-lids" opacity="0"><path d="M-22 -248 C-18 -252 -8 -252 -4 -248 L-4 -246 C-8 -244 -18 -244 -22 -246Z M4 -248 C8 -252 18 -252 22 -248 L22 -246 C18 -244 8 -244 4 -246Z" fill="#d8946a"/><path d="M-22 -246 C-16 -243 -10 -243 -4 -246 M4 -246 C10 -243 16 -243 22 -246" stroke="${INK}" stroke-width="2.4" fill="none"/></g>
        <path d="M-25 -255 Q-15 -262 -3 -256 M3 -256 Q15 -262 25 -255" stroke="${jo ? '#1a1210' : '#3a200e'}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
        <path d="M-4 -250 C-5 -238 -8 -230 -7 -224 C-3 -221 3 -221 7 -224" stroke="#8a4a30" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M-2 -250 C-3 -238 -6 -230 -5 -226 L1 -228Z" fill="#b8784e" opacity=".5"/>
        ${jo
          ? `<path d="M-14 -214 Q-6 -219 0 -216 Q6 -219 14 -214 Q8 -212 0 -213 Q-8 -212 -14 -214Z" fill="#1a1210"/><path d="M-6 -200 C-6 -186 -2 -176 0 -172 C2 -176 6 -186 6 -200 Q0 -202 -6 -200Z" fill="#1a1210"/>`
          : `<path d="M-30 -236 C-31 -212 -18 -186 0 -180 C18 -186 31 -212 30 -236 C26 -218 16 -210 0 -210 C-16 -210 -26 -218 -30 -236Z" fill="${hair}" stroke="${INK}" stroke-width="3"/>
             <path d="M-16 -214 Q-8 -222 0 -217 Q8 -222 16 -214 Q10 -209 0 -212 Q-10 -209 -16 -214Z" fill="${hair}" stroke="${INK}" stroke-width="2.4"/>
             <path d="M-16 -196 q6 8 4 16 M16 -196 q-6 8 -4 16 M0 -200 v14" stroke="#3a200e" stroke-width="1.6" fill="none" opacity=".7"/>`}
        <path class="fk-mouth" d="M-7 -207 Q0 -205 7 -207" stroke="${INK}" stroke-width="2.6" fill="#5a1a14" stroke-linecap="round"/>
        ${jo
          ? `<!-- 익선관 -->
             <path d="M-34 -262 C-36 -292 -20 -304 0 -304 C20 -304 36 -292 34 -262 Q0 -270 -34 -262Z" fill="#141418" stroke="${INK}" stroke-width="4"/>
             <path d="M-26 -290 C-40 -330 -10 -336 -8 -300Z M26 -290 C40 -330 10 -336 8 -300Z" fill="#141418" stroke="${INK}" stroke-width="3.4"/>
             <path d="M-34 -266 Q0 -276 34 -266" stroke="#d8a830" stroke-width="3" fill="none"/>`
          : `<!-- 왕관: 담비 띠 · 아치 · 보석 -->
             <path d="M-36 -266 L-42 -318 L-22 -294 L-10 -334 L0 -302 L10 -334 L22 -294 L42 -318 L36 -266 Q0 -276 -36 -266Z" fill="url(#fkG)" stroke="${INK}" stroke-width="4"/>
             <path d="M-22 -294 Q0 -318 22 -294" stroke="#8a5a10" stroke-width="2.4" fill="none"/>
             <circle cx="0" cy="-290" r="6.4" fill="#c8202a" stroke="${INK}" stroke-width="2.2"/><circle cx="-22" cy="-282" r="4" fill="#2a60c8" stroke="${INK}" stroke-width="1.8"/><circle cx="22" cy="-282" r="4" fill="#2a8a4a" stroke="${INK}" stroke-width="1.8"/>
             ${[-42, -10, 10, 42].map((cx, i) => `<circle cx="${cx}" cy="${[-318, -334, -334, -318][i]}" r="4.4" fill="#fff4c0" stroke="${INK}" stroke-width="1.8"/>`).join('')}
             <path d="M0 -334 V-346 M-6 -340 H6" stroke="url(#fkG)" stroke-width="4" stroke-linecap="round"/>
             <ellipse cx="0" cy="-264" rx="40" ry="8" fill="#f8f4ea" stroke="${INK}" stroke-width="3"/>${dots(0, -264, 36, 6)}`}`;
  const robe = jo
    ? `<path d="M-84 -172 Q-92 -80 -82 6 H82 Q92 -80 84 -172 Q0 -150 -84 -172Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
       <path d="M-24 -170 L0 -120 L24 -170" fill="none" stroke="#f8f4ea" stroke-width="8"/>
       <circle cx="0" cy="-88" r="30" fill="url(#fkG)" stroke="${INK}" stroke-width="3.4"/><path d="M-16 -86 C-12 -104 6 -104 8 -92 C10 -80 22 -80 20 -96 M-10 -72 q10 -6 20 0" stroke="#8a1a10" stroke-width="3" fill="none"/>
       <circle cx="-62" cy="-150" r="16" fill="url(#fkG)" stroke="${INK}" stroke-width="2.4"/><circle cx="62" cy="-150" r="16" fill="url(#fkG)" stroke="${INK}" stroke-width="2.4"/>
       <path d="M-82 -32 H82 V-18 H-82Z" fill="#2a2a3a" stroke="${INK}" stroke-width="3"/>${[-60, -30, 0, 30, 60].map((bx) => `<rect x="${bx - 8}" y="-33" width="16" height="16" rx="2" fill="#e8e0c8" stroke="${INK}" stroke-width="1.6"/>`).join('')}`
    : `<path d="M-84 -172 Q-92 -80 -82 6 H82 Q92 -80 84 -172 Q0 -150 -84 -172Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
       <path d="M-50 -140 C-56 -90 -54 -40 -58 0 M50 -140 C56 -90 54 -40 58 0 M-20 -120 C-24 -70 -22 -30 -26 0 M20 -120 C24 -70 22 -30 26 0" stroke="#3a0408" stroke-width="3" fill="none" opacity=".35"/>
       <path d="M0 -130 V4" stroke="url(#fkG)" stroke-width="6"/>
       <path d="M-82 -40 H82 V-24 H-82Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><rect x="-13" y="-45" width="26" height="26" rx="4" fill="#c8202a" stroke="${INK}" stroke-width="3"/>
       <!-- 담비 망토 깃 -->
       <path d="M-100 -150 C-86 -190 86 -190 100 -150 C92 -126 56 -122 0 -128 C-56 -122 -92 -126 -100 -150Z" fill="#f8f4ea" stroke="${INK}" stroke-width="4"/>
       ${[-78, -52, -26, 0, 26, 52, 78].map((dx, i) => `<path d="M${dx - 2} ${-148 + (i % 2) * 8 - Math.abs(dx) * 0.1} l2.4 7 l2.4 -7" fill="${INK}"/>`).join('')}
       <!-- 직무 목걸이 -->
       <path d="M-60 -136 Q0 -70 60 -136" stroke="url(#fkG)" stroke-width="7" fill="none" stroke-dasharray="10 4"/><circle cx="0" cy="-100" r="15" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-100" r="6" fill="#c8202a"/>`;
  const html = `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible">
  <defs>
    <linearGradient id="fkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>
    <linearGradient id="fkR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${robeA}"/><stop offset="1" stop-color="${robeB}"/></linearGradient>
    <linearGradient id="fkC" x1="0" x2="1"><stop offset="0" stop-color="#4a0610"/><stop offset=".5" stop-color="#8a1420"/><stop offset="1" stop-color="#4a0610"/></linearGradient>
    <linearGradient id="fkS" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c8a4"/><stop offset=".6" stop-color="#e0a880"/><stop offset="1" stop-color="#b87850"/></linearGradient>
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
    <circle cx="-130" cy="-250" r="12" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><circle cx="130" cy="-250" r="12" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
    <!-- 망토 뒷자락 -->
    <path d="M-96 -170 C-150 -110 -160 -10 -150 60 H150 C160 -10 150 -110 96 -170Z" fill="url(#fkC)" stroke="${INK}" stroke-width="5"/>
    ${jo ? '' : '<path d="M-150 58 C-158 -10 -146 -110 -100 -164" stroke="#f8f4ea" stroke-width="14" fill="none"/><path d="M150 58 C158 -10 146 -110 100 -164" stroke="#f8f4ea" stroke-width="14" fill="none"/>'}
    <path d="M-176 -78 H-110 V-44 H-176Z M110 -78 H176 V-44 H110Z" fill="url(#fkG)" stroke="${INK}" stroke-width="5"/>
    <path d="M-172 -44 V120 H-148 V-44Z M148 -44 V120 H172 V-44Z" fill="#b8862a" stroke="${INK}" stroke-width="5"/>
    <!-- 앉은 다리 -->
    <path d="M-110 20 H110 V64 H-110Z" fill="url(#fkG)" stroke="${INK}" stroke-width="5"/>
    <path d="M-72 -8 Q-78 36 -62 52 H-10 Q-2 36 -6 -8Z M6 -8 Q2 36 10 52 H62 Q78 36 72 -8Z" fill="${robeB}" stroke="${INK}" stroke-width="5"/>
    <path d="M-58 50 L-56 118 H-16 L-12 50Z M12 50 L16 118 H56 L58 50Z" fill="#2a0408" stroke="${INK}" stroke-width="5"/>
    <path d="M-62 112 H-12 L-10 134 Q-42 142 -78 134Z M12 112 H62 L78 134 Q42 142 10 134Z" fill="${jo ? '#1a1a1a' : '#3a2410'}" stroke="${INK}" stroke-width="5"/>
    <g class="fk-body">
      ${robe}
      <!-- 쉬는 팔 (팔걸이 위) -->
      <path d="M66 -168 C92 -150 110 -110 118 -70 L90 -58 C82 -98 68 -128 52 -148Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      <path d="M88 -72 L120 -80 L124 -60 L92 -52Z" fill="${jo ? '#f8f4ea' : '#f8f4ea'}" stroke="${INK}" stroke-width="3"/>
      <path d="M112 -70 C126 -74 136 -68 136 -58 C136 -48 126 -44 114 -48 C108 -52 108 -64 112 -70Z" fill="url(#fkS)" stroke="${INK}" stroke-width="3.4"/>
      <path d="M118 -58 h14 M118 -52 h12" stroke="#8a4a30" stroke-width="1.6"/>
      <circle cx="116" cy="-62" r="3.4" fill="url(#fkG)" stroke="${INK}" stroke-width="1.4"/>
      <g class="fk-head">${head}</g>
      <!-- 홀을 드는 팔 (어깨 기준 회전) -->
      <g class="fk-arm">
        <path d="M-66 -170 C-92 -144 -104 -100 -108 -58 L-78 -52 C-76 -94 -68 -128 -52 -150Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
        <path d="M-110 -62 L-76 -58 L-78 -42 L-112 -46Z" fill="#f8f4ea" stroke="${INK}" stroke-width="3"/>
        <g class="fk-scep">
          <path d="M-98 -160 H-90 V50 H-98Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          <path d="M-90 -40 h8 M-106 -40 h8 M-90 -100 h6 M-104 -100 h6" stroke="url(#fkG)" stroke-width="4"/>
          <path d="M-106 -160 Q-94 -176 -82 -160 L-86 -150 H-102Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          <circle cx="-94" cy="-186" r="18" fill="#b81a24" stroke="${INK}" stroke-width="4"/><path d="M-112 -186 H-76 M-94 -204 V-168" stroke="url(#fkG)" stroke-width="3"/><circle cx="-100" cy="-192" r="5" fill="#fff" opacity=".6"/>
          <path d="M-94 -204 V-224 M-104 -214 H-84" stroke="url(#fkG)" stroke-width="6" stroke-linecap="round"/>
        </g>
        <path d="M-108 -46 C-110 -32 -104 -22 -92 -22 C-80 -22 -76 -30 -78 -42 C-84 -48 -100 -50 -108 -46Z" fill="url(#fkS)" stroke="${INK}" stroke-width="3.4"/>
        <path d="M-104 -36 h20 M-104 -30 h18" stroke="#8a4a30" stroke-width="1.6"/>
      </g>
    </g>
  </g></svg>`;
  host.insertAdjacentHTML('beforeend', html);
  const root = host.lastElementChild;
  const body = root.querySelector('.fk-body');
  const headEl = root.querySelector('.fk-head');
  const arm = root.querySelector('.fk-arm');
  const scep = root.querySelector('.fk-scep');
  const lids = root.querySelector('.fk-lids');
  const eyes = root.querySelector('.fk-eyes');
  const mouth = root.querySelector('.fk-mouth');
  const pupils = root.querySelectorAll('.fk-pupil');
  let blinkAt = 1.5;
  return {
    update(s, { up = 0, talking = false } = {}) {
      const br = Math.sin(s * 2.2) * 1.4;
      body.setAttribute('transform', `translate(0 ${br.toFixed(2)})`);
      headEl.setAttribute('transform', `rotate(${(Math.sin(s * 0.8) * 2.4).toFixed(2)} 0 -186)`);
      // 팔: 무릎 위(-16°)에서 머리 위로, 홀은 늘 곧게 선다
      const a = -16 + up * 160;
      arm.setAttribute('transform', `rotate(${a.toFixed(2)} -66 -166)`);
      scep.setAttribute('transform', `rotate(${(-a * 0.85).toFixed(2)} -94 -36)`);
      const blink = s > blinkAt && s < blinkAt + 0.13;
      if (s > blinkAt + 0.13) blinkAt = s + 2.4 + Math.random() * 2.5;
      lids.setAttribute('opacity', blink ? 1 : 0);
      eyes.setAttribute('opacity', blink ? 0 : 1);
      const gx = Math.sin(s * 0.6) * 1.6;
      pupils[0].setAttribute('cx', (-13 + gx).toFixed(2));
      pupils[1].setAttribute('cx', (13 + gx).toFixed(2));
      const open = talking && Math.sin(s * 20) > 0.1;
      mouth.setAttribute('d', open ? 'M-8 -208 Q0 -206 8 -208 Q6 -198 0 -197 Q-6 -198 -8 -208Z' : 'M-7 -207 Q0 -205 7 -207');
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
export const _shots = { throneShot };
export { playFilm };
