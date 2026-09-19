// 왕궁의 달무티 결말 영상: 새 대달무티의 대관식
// 붉은 융단을 걸어 왕좌로 → 신하들이 고개 숙임 → (농노 출신이면 회상) → 왕관이 내려와 씌워짐 → 왕좌에 앉아 홀을 든다 · 광대가 춤추고 꼴찌는 바닥을 닦는다
import { POSE, gait, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, say, cast, score, CINE_CSS } from '/anim/cine.js';
import { svg, playFilm } from '/anim/director.js';

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
    S.layer(0.35, BG(svg(hall())));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const courtiers = [[380, 'courtier', false], [560, 'lady', false], [1060, 'courtier', true], [1240, 'lady', true]].map(([x, look, flip]) => C.add({ look, x, y: 840, scale: 1.05, flip, rim: '#ffcf7a', rimSide: flip ? -1 : 1 }));
    const hero = C.add({ look: noble, x: -120, y: 860, scale: 1.25, rim: '#fff0b0' });
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
    setTimeout(() => say(shot, '전령', `모두 고개를 숙여라! 새로운 대달무티, ${esc(champion)} 님이시다!`, 2.6, '#f8e08a'), 900);
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
    S.layer(0.3, BG(svg(hall({ throne: true }))));
    const L = S.layer(1, '');
    const C = cast(L.el);
    const hero = C.add({ look: noble, x: 800, y: 900, scale: 1.6, rim: '#fff0b0' });
    hero.set({ ...POSE.stand, head: -6, neck: -2 });
    // 내려오는 왕관 (인형과 같은 좌표계)
    const crown = document.createElement('div');
    crown.innerHTML = `<svg viewBox="-60 -60 120 90" style="position:absolute;left:0;top:0;width:240px;overflow:visible"><path d="M-44 20 L-52 -40 L-20 -10 L0 -56 L20 -10 L52 -40 L44 20 Q0 8 -44 20Z" fill="#e0b030" stroke="#3a2406" stroke-width="4"/><circle cy="0" r="8" fill="#c8202a" stroke="#3a2406" stroke-width="2"/><circle cx="-52" cy="-40" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/><circle cy="-56" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/><circle cx="52" cy="-40" r="6" fill="#fff4c0" stroke="#3a2406" stroke-width="2"/></svg>`;
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
/* ═════════ 정면을 보고 왕좌에 앉은 왕 (퍼펫은 옆모습 전용이라 따로 그린다) ═════════ */
function frontKing(host, { x = 800, y = 650, scale = 1.05 } = {}) {
  const INK = '#1a0e08';
  const erm = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f8f4ea" stroke="${INK}" stroke-width="3"/>` +
    Array.from({ length: Math.round(rx / 14) }, (_, i) => `<path d="M${cx - rx + 14 + i * 28} ${cy - 3} l3 7 l3 -7" fill="${INK}"/>`).join('');
  const html = `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;overflow:visible">
  <defs>
    <linearGradient id="fkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>
    <linearGradient id="fkR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8303a"/><stop offset="1" stop-color="#7a0a14"/></linearGradient>
    <linearGradient id="fkC" x1="0" x2="1"><stop offset="0" stop-color="#5a0610"/><stop offset=".5" stop-color="#9a1420"/><stop offset="1" stop-color="#5a0610"/></linearGradient>
    <radialGradient id="fkS" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fbd8bc"/><stop offset=".7" stop-color="#eab694"/><stop offset="1" stop-color="#c88a68"/></radialGradient>
    <radialGradient id="fkHalo"><stop offset="0" stop-color="#fff0b0" stop-opacity=".55"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
  </defs>
  <g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round">
    <path d="M-260 140 H260 L290 180 H-290Z" fill="#6a4a2a" stroke="${INK}" stroke-width="4"/><path d="M-300 180 H300 L330 225 H-330Z" fill="#5a3a1a" stroke="${INK}" stroke-width="4"/>
    <path d="M-240 140 H240" stroke="#c8942a" stroke-width="4"/>
    <ellipse cx="0" cy="-200" rx="260" ry="240" fill="url(#fkHalo)"/>
    <path d="M-130 60 V-250 Q-130 -340 0 -362 Q130 -340 130 -250 V60Z" fill="url(#fkG)" stroke="${INK}" stroke-width="6"/>
    <path d="M-100 50 V-238 Q-100 -312 0 -330 Q100 -312 100 -238 V50Z" fill="url(#fkC)"/>
    <path d="M-60 -290 Q0 -310 60 -290 M-80 -240 H80" stroke="#e0b030" stroke-width="2" opacity=".35" fill="none"/>
    <circle cx="0" cy="-352" r="17" fill="#c8202a" stroke="${INK}" stroke-width="4"/><circle cx="-5" cy="-357" r="5" fill="#fff" opacity=".7"/>
    <circle cx="-130" cy="-250" r="12" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><circle cx="130" cy="-250" r="12" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
    <path d="M-80 -178 C-138 -120 -150 -10 -140 58 H140 C150 -10 138 -120 80 -178Z" fill="url(#fkC)" stroke="${INK}" stroke-width="5"/>
    <path d="M-140 58 C-148 -10 -136 -110 -84 -170" stroke="#f8f4ea" stroke-width="14" fill="none"/><path d="M140 58 C148 -10 136 -110 84 -170" stroke="#f8f4ea" stroke-width="14" fill="none"/>
    <path d="M-168 -78 H-104 V-44 H-168Z M104 -78 H168 V-44 H104Z" fill="url(#fkG)" stroke="${INK}" stroke-width="5"/>
    <path d="M-164 -44 V120 H-140 V-44Z M140 -44 V120 H164 V-44Z" fill="#b8862a" stroke="${INK}" stroke-width="5"/>
    <path d="M-104 20 H104 V64 H-104Z" fill="url(#fkG)" stroke="${INK}" stroke-width="5"/>
    <path d="M-66 -6 Q-70 36 -58 50 H-10 Q-2 36 -6 -6Z M6 -6 Q2 36 10 50 H58 Q70 36 66 -6Z" fill="#4a0a14" stroke="${INK}" stroke-width="5"/>
    <path d="M-56 48 L-54 118 H-16 L-12 48Z M12 48 L16 118 H54 L56 48Z" fill="#3a0810" stroke="${INK}" stroke-width="5"/>
    <path d="M-60 112 H-12 L-10 134 Q-40 142 -74 134Z M12 112 H60 L74 134 Q40 142 10 134Z" fill="#3a2410" stroke="${INK}" stroke-width="5"/>
    <g class="fk-body">
      <path d="M-70 -170 Q-80 -80 -74 6 H74 Q80 -80 70 -170 Q0 -150 -70 -170Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      <path d="M-24 -166 L0 -110 L24 -166" fill="#f8f0dc" stroke="${INK}" stroke-width="3"/>
      <path d="M0 -110 V4" stroke="#e0b030" stroke-width="5"/><path d="M-10 -86 h20 M-10 -62 h20" stroke="#e0b030" stroke-width="4"/>
      <path d="M-74 -40 H74 V-24 H-74Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/><rect x="-12" y="-44" width="24" height="24" rx="3" fill="#c8202a" stroke="${INK}" stroke-width="3"/>
      <path d="M-46 -164 Q0 -104 46 -164" stroke="url(#fkG)" stroke-width="6" fill="none"/><circle cx="0" cy="-128" r="12" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
      ${erm(0, -170, 92, 20)}
      <path d="M58 -168 C84 -150 100 -110 108 -70 L84 -60 C76 -100 62 -130 46 -150Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
      ${erm(98, -64, 18, 9)}<circle cx="116" cy="-62" r="14" fill="url(#fkS)" stroke="${INK}" stroke-width="4"/>
      <path d="M-15 -196 H15 V-168 H-15Z" fill="#c88a68" stroke="${INK}" stroke-width="4"/>
      <g class="fk-head">
        <circle cx="-41" cy="-228" r="10" fill="url(#fkS)" stroke="${INK}" stroke-width="4"/><circle cx="41" cy="-228" r="10" fill="url(#fkS)" stroke="${INK}" stroke-width="4"/>
        <ellipse cx="0" cy="-228" rx="40" ry="48" fill="url(#fkS)" stroke="${INK}" stroke-width="5"/>
        <path d="M-43 -232 C-48 -276 -22 -288 0 -288 C24 -288 48 -276 43 -232 C38 -254 26 -262 12 -262 C0 -254 -18 -262 -28 -258 C-36 -254 -40 -246 -43 -232Z" fill="#6a3a1a" stroke="${INK}" stroke-width="4"/>
        <ellipse cx="-24" cy="-212" rx="8" ry="5" fill="#f08a8a" opacity=".45"/><ellipse cx="24" cy="-212" rx="8" ry="5" fill="#f08a8a" opacity=".45"/>
        <g class="fk-eyes"><ellipse cx="-15" cy="-230" rx="8.5" ry="6.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><ellipse cx="15" cy="-230" rx="8.5" ry="6.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/>
          <circle class="fk-pupil" cx="-14" cy="-230" r="4" fill="${INK}"/><circle class="fk-pupil" cx="16" cy="-230" r="4" fill="${INK}"/></g>
        <g class="fk-lids" opacity="0"><path d="M-24 -230 Q-15 -226 -6 -230" stroke="${INK}" stroke-width="3" fill="none"/><path d="M6 -230 Q15 -226 24 -230" stroke="${INK}" stroke-width="3" fill="none"/></g>
        <path d="M-25 -243 Q-15 -250 -5 -245 M5 -245 Q15 -250 25 -243" stroke="#4a2410" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-2 -226 Q-7 -208 0 -206 Q5 -206 6 -209" stroke="#a86a4a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path class="fk-mouth" d="M-14 -196 Q0 -186 14 -196" stroke="${INK}" stroke-width="3.4" fill="#8a2a2a" stroke-linecap="round"/>
        <path d="M-42 -268 L-48 -318 L-24 -290 L0 -330 L24 -290 L48 -318 L42 -268 Q0 -278 -42 -268Z" fill="url(#fkG)" stroke="${INK}" stroke-width="4"/>
        <circle cx="0" cy="-288" r="7" fill="#c8202a" stroke="${INK}" stroke-width="2.4"/><circle cx="-48" cy="-318" r="5" fill="#fff4c0" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-330" r="5" fill="#fff4c0" stroke="${INK}" stroke-width="2"/><circle cx="48" cy="-318" r="5" fill="#fff4c0" stroke="${INK}" stroke-width="2"/>
        <path d="M-40 -272 H40" stroke="#2a60c8" stroke-width="3" stroke-dasharray="4 10"/>
      </g>
      <g class="fk-arm">
        <path d="M-58 -168 C-80 -140 -92 -100 -96 -60 L-70 -56 C-68 -96 -60 -128 -46 -150Z" fill="url(#fkR)" stroke="${INK}" stroke-width="5"/>
        ${erm(-84, -58, 18, 9)}
        <g class="fk-scep">
          <path d="M-88 -150 H-80 V40 H-88Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          <path d="M-96 -150 Q-84 -166 -72 -150 L-76 -140 H-92Z" fill="url(#fkG)" stroke="${INK}" stroke-width="3"/>
          <circle cx="-84" cy="-176" r="17" fill="#c8202a" stroke="${INK}" stroke-width="4"/><circle cx="-90" cy="-182" r="5" fill="#fff" opacity=".7"/>
          <path d="M-84 -193 V-214 M-94 -204 H-74" stroke="url(#fkG)" stroke-width="6" stroke-linecap="round"/>
        </g>
        <circle cx="-84" cy="-42" r="14" fill="url(#fkS)" stroke="${INK}" stroke-width="4"/>
      </g>
    </g>
  </g></svg>`;
  host.insertAdjacentHTML('beforeend', html);
  const root = host.lastElementChild;
  const body = root.querySelector('.fk-body');
  const head = root.querySelector('.fk-head');
  const arm = root.querySelector('.fk-arm');
  const scep = root.querySelector('.fk-scep');
  const lids = root.querySelector('.fk-lids');
  const eyes = root.querySelector('.fk-eyes');
  const mouth = root.querySelector('.fk-mouth');
  const pupils = root.querySelectorAll('.fk-pupil');
  let blinkAt = 1.5;
  return {
    update(s, { up = 0, talking = false } = {}) {
      const br = Math.sin(s * 2.2) * 1.6;
      body.setAttribute('transform', `translate(0 ${br.toFixed(2)})`);
      head.setAttribute('transform', `rotate(${(Math.sin(s * 0.9) * 3).toFixed(2)} 0 -190)`);
      // 팔: 무릎 위(-18°)에서 머리 위(150°)로, 홀은 늘 곧게 선다
      const a = -18 + up * 168;
      arm.setAttribute('transform', `rotate(${a.toFixed(2)} -58 -164)`);
      scep.setAttribute('transform', `rotate(${(-a * 0.85).toFixed(2)} -84 -42)`);
      const blink = s > blinkAt && s < blinkAt + 0.12;
      if (s > blinkAt + 0.12) blinkAt = s + 2 + Math.random() * 2.5;
      lids.setAttribute('opacity', blink ? 1 : 0);
      eyes.setAttribute('opacity', blink ? 0 : 1);
      const gx = Math.sin(s * 0.7) * 2;
      pupils[0].setAttribute('cx', (-14 + gx).toFixed(2));
      pupils[1].setAttribute('cx', (16 + gx).toFixed(2));
      const open = talking && Math.sin(s * 22) > 0.1;
      mouth.setAttribute('d', open ? 'M-14 -198 Q0 -200 14 -198 Q12 -182 0 -180 Q-12 -182 -14 -198Z' : 'M-14 -196 Q0 -186 14 -196');
    },
  };
}
/** ③ 왕좌에 앉아 홀을 든다 · 광대가 춤추고 꼴찌는 바닥을 닦는다 */
function throneShot(D, t0, champion, peon) {
  D.at(t0, () => {
    D.cut('');
    const { shot, S } = scene(D);
    S.layer(0.35, BG(svg(hall({ throne: false }))));
    const L = S.layer(1, '');
    const king = frontKing(L.el);
    const C = cast(L.el);
    const jester = C.add({ look: 'jester', x: 470, y: 860, scale: 1.1, rim: '#ffcf7a' });
    const low = C.add({ look: 'peasant', x: 1140, y: 870, scale: 1.1, rim: '#ffcf7a', flip: true, rimSide: -1 });
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
    setTimeout(() => say(shot, esc(champion), '짐이 이 왕궁의 대달무티다!', 1.8, '#f8e08a'), 3400);
    setTimeout(() => say(shot, esc(peon), '다음 판엔… 두고 보자…', 1.6, '#c8b8a8'), 5500);
  });
}

export function playEnding(host, { champion, peon, rose, sound, me }) {
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
  return playFilm(host, { scene: scene0, length: L, title: me ? '당신이 대달무티!' : '대관식', titleAt: L - 3.6, sub: `새 대달무티 ${champion}`, sound: sound || {} }).finally(() => music.stop());
}

// 영상 확인용: 컷 하나만 틀어 본다
export const _shots = { throneShot };
export { playFilm };
