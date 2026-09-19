// 구룡 살인사건 결말 영상: 비 내리는 네온 골목 누아르 (체포 · 도주 · 목격자 제거)
import { makeHuman, motion, HUMAN_POSE, runPose } from '/anim/rig2d.js';
import { rnd, f, svg, playFilm } from '/anim/director.js';
import { cardSvg } from './art.js';

const K = window.KOWLOON;

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
function cuffShot(D, t0) {
  D.at(t0, () => {
    const cuff = (x, rot) => `<g transform="translate(${x} 470) rotate(${rot})"><circle r="92" fill="none" stroke="#1a1c22" stroke-width="30"/><circle r="92" fill="none" stroke="#c8ccd6" stroke-width="18"/><path d="M-60 -70 A92 92 0 0 1 60 -70" stroke="#eef0f6" stroke-width="5" fill="none"/></g>`;
    D.cut(STYLE + svg(`<rect width="1600" height="900" fill="#08070c"/>
      <path d="M-100 560 Q400 520 760 500 L760 640 Q400 660 -100 700Z" fill="#6a4a3a"/><path d="M-100 560 Q400 520 760 500" stroke="#8a6a5a" stroke-width="6" fill="none"/>
      <g class="cuffA">${cuff(700, 0)}</g><path d="M792 470 h120" stroke="#c8ccd6" stroke-width="14" stroke-dasharray="20 8"/><g class="cuffB">${cuff(1010, 0)}</g>`) + '<div class="kw-sirens"></div>' + RAIN);
    D.anim('.cuffA', [{ transform: 'rotate(-60deg)', transformOrigin: '700px 470px' }, { transform: 'rotate(0deg)', transformOrigin: '700px 470px' }], { duration: 380, delay: 500, easing: 'cubic-bezier(.3,1.8,.5,1)' });
    setTimeout(() => { D.sound.cuffs && D.sound.cuffs(); D.shake(8, 240); D.flash('#ffffff', 120); }, 870);
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

const FILMS = {
  solved: { length: 19.5, titleAt: 15.6, title: '사건 해결' },
  escaped: { length: 18.5, titleAt: 14.8, title: '미제 사건' },
  witness: { length: 14.5, titleAt: 10.6, title: '목격자는 말이 없다' },
};

/**
 * @param {HTMLElement} host
 * @param {{kind:'solved'|'escaped'|'witness', murder:{means,clue}, murderer:string, solver:string, sound:object}} o
 */
export function playEnding(host, { kind, murder, murderer, solver, sound }) {
  const F = FILMS[kind];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scene = (D) => {
    openShot(D, 0);
    if (kind === 'solved') {
      eyesShot(D, 3.4, 'detective');
      evidenceShot(D, 5.2, murder, false);
      chaseShot(D, 8.4);
      cuffShot(D, 12.2);
      paperShot(D, 14.4, `구룡 살인사건<br>범인 체포`, `범인은 ${esc(murderer)} — ${esc(K.CARD[murder.means].name)}, 그리고 ${esc(K.CARD[murder.clue].name)}`, `${solver ? `${esc(solver)} 수사관의 한 수가 사건을 끝냈다. ` : ''}비 내리는 밤, 네온 아래 골목에서 벌어진 사건은 법의학자의 말없는 증언과 수사관들의 추리로 막을 내렸다. 범인은 끝까지 태연했지만 증거는 거짓말을 하지 않았다.`);
    } else if (kind === 'escaped') {
      evidenceShot(D, 3.4, murder, true);
      walkAwayShot(D, 6.8);
      eyesShot(D, 11.6, 'murderer');
      emptyAlleyShot(D, 13.2, murder);
    } else {
      boothShot(D, 3.4);
      eyesShot(D, 7.6, 'murderer');
      receiverShot(D, 9.2);
    }
  };
  const sub = kind === 'solved' ? `범인: ${murderer}` : `범인은 ${murderer} 였다`;
  return playFilm(host, { scene, length: F.length, title: F.title, titleAt: F.titleAt, sub, sound: sound || {} });
}
