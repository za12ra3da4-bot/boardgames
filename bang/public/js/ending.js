// 황야의 뱅 결말 영상: 한낮의 결투 (무법자 승리 · 보안관 승리 · 배신자 승리)
import { makeCowboy, motion, COWBOY_POSE } from '/anim/rig2d.js';
import { rnd, f, svg, layer, focusLines, speedLines, playFilm } from '/anim/director.js';

/* ═════════ 배경 ═════════ */

const SKY = {
  noon: ['#8ab8e0', '#e8e0c0', '#f4e4b0'],
  sunset: ['#3a1030', '#c8401a', '#ffb050'],
  dusk: ['#1a1030', '#6a2a3a', '#d87040'],
};

function town(kind = 'noon', { sunY = 170, sunX = 800 } = {}) {
  const [a, b, c] = SKY[kind];
  const r = rnd(kind.length * 7);
  const ground = kind === 'noon' ? '#c89a60' : '#5a2a1a';
  const build = kind === 'noon' ? '#6a4428' : '#1a0a0a';
  let mesas = `<path d="M0 560L90 560L120 500L260 500L290 560L520 560L560 520L700 520L720 560L1000 560L1040 480L1180 480L1220 560L1600 560V620H0Z" fill="${kind === 'noon' ? '#c89a78' : '#4a1a20'}" opacity=".7"/>`;
  // 서부 마을 가짜 정면 건물들 (양쪽)
  let houses = '';
  const side = (x0, dir) => {
    let x = x0;
    for (let i = 0; i < 4; i++) {
      const w = 150 + r() * 70;
      const h = 190 + r() * 110;
      const bx = dir > 0 ? x : x - w;
      houses += `<path d="M${f(bx)} 720V${f(720 - h)}h${f(w * 0.2)}v-24h${f(w * 0.6)}v24h${f(w * 0.2)}V720Z" fill="${build}"/>`;
      houses += `<rect x="${f(bx + w * 0.15)}" y="${f(720 - h * 0.55)}" width="${f(w * 0.25)}" height="${f(h * 0.3)}" fill="${kind === 'noon' ? '#2a1a0a' : '#ffb050'}" opacity="${kind === 'noon' ? 0.8 : 0.5}"/>`;
      houses += `<rect x="${f(bx + w * 0.58)}" y="${f(720 - h * 0.55)}" width="${f(w * 0.25)}" height="${f(h * 0.3)}" fill="${kind === 'noon' ? '#2a1a0a' : '#ffb050'}" opacity="${kind === 'noon' ? 0.8 : 0.5}"/>`;
      houses += `<path d="M${f(bx - 6)} ${f(720 - h * 0.18)}h${f(w + 12)}v10h${f(-w - 12)}Z" fill="${build}"/>`;
      for (let k = 0; k < 4; k++) houses += `<rect x="${f(bx + (w * k) / 3 - 2)}" y="${f(720 - h * 0.18)}" width="5" height="${f(h * 0.18)}" fill="${build}"/>`;
      x += dir * (w + 6);
    }
  };
  side(-40, 1);
  side(1640, -1);
  // 급수탑
  houses += `<g fill="${build}"><path d="M690 520h90v-70h-90Z"/><path d="M684 450L735 420L786 450Z"/><path d="M696 520L688 640M774 520L782 640M700 580h70" stroke="${build}" stroke-width="6"/></g>`;
  const sun = `<circle cx="${sunX}" cy="${sunY}" r="${kind === 'noon' ? 70 : 140}" fill="${kind === 'noon' ? '#fffbe8' : '#ffd070'}"/><circle cx="${sunX}" cy="${sunY}" r="${kind === 'noon' ? 220 : 320}" fill="url(#sunH)"/>`;
  return `<defs><linearGradient id="wsky" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <radialGradient id="sunH"><stop offset=".2" stop-color="#fff4c8" stop-opacity=".6"/><stop offset="1" stop-color="#fff4c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="wground" x2="0" y2="1"><stop offset="0" stop-color="${ground}"/><stop offset="1" stop-color="${kind === 'noon' ? '#8a6030' : '#2a0e08'}"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#wsky)"/>${sun}${mesas}
    <path d="M0 620H1600V900H0Z" fill="url(#wground)"/>${houses}
    <path d="M0 720H1600V900H0Z" fill="url(#wground)"/>
    <path d="M200 760q300 -10 600 6t600 -4M100 830q400 -14 800 4t700 -6" stroke="${kind === 'noon' ? '#a87840' : '#3a1208'}" stroke-width="4" fill="none" opacity=".6"/>`;
}

const TUMBLE = `<svg viewBox="-60 -60 120 120" class="tumble"><g fill="none" stroke="#6a4a24" stroke-width="3">
  <circle r="46"/><path d="M-40 -20Q0 30 40 -24M-30 30Q0 -40 34 30M-46 4Q0 -10 46 8M-10 -46Q20 0 -6 46M20 -42Q-20 0 14 44"/></g></svg>`;

/** 모자 챙 아래 두 눈 (세르조 레오네 식 초근접) */
function eyesShot(who) {
  const skin = who === 'outlaw' ? '#b88058' : who === 'renegade' ? '#a87050' : '#d8a078';
  const r = rnd(who.length);
  let stubble = '';
  for (let i = 0; i < 220; i++) stubble += `<circle cx="${f(r() * 1600)}" cy="${f(560 + r() * 340)}" r="${f(1.2 + r() * 1.5)}" fill="#3a2010" opacity=".5"/>`;
  const eye = (cx, flip) => `<g transform="translate(${cx} 440) scale(${flip} 1)">
    <path d="M-150 10Q-40 -70 150 -10Q40 60 -150 10Z" fill="#f4ece0"/>
    <circle cx="10" cy="-4" r="44" fill="${who === 'sheriff' ? '#4a7ab8' : '#5a3a1a'}"/><circle cx="10" cy="-4" r="20" fill="#0a0604"/><circle cx="24" cy="-18" r="9" fill="#fff"/>
    <path d="M-160 12Q-40 -86 160 -12" stroke="#1a0a04" stroke-width="16" fill="none"/>
    <path d="M-150 16Q-20 60 150 -4" stroke="#6a3a20" stroke-width="5" fill="none" opacity=".6"/>
    <path d="M-170 -60Q-20 -110 170 -80" stroke="#3a2010" stroke-width="30" stroke-linecap="round" fill="none" class="brow"/>
  </g>`;
  return svg(`<rect width="1600" height="900" fill="${skin}"/>
    <radialGradient id="shade" cx=".5" cy=".6" r=".7"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
    ${eye(470, 1)}${eye(1130, -1)}
    <path d="M760 300Q800 620 740 700Q800 730 860 700Q800 620 840 300Z" fill="#000" opacity=".12"/>
    ${stubble}
    ${who === 'sheriff' ? '<path d="M560 800Q800 730 1040 800Q800 770 560 800Z" fill="#5a3a20"/>' : ''}
    ${who === 'outlaw' ? '<path d="M0 760Q800 690 1600 760V900H0Z" fill="#8a1a1a"/><path d="M0 790Q800 720 1600 790" stroke="#e8c8a0" stroke-width="4" stroke-dasharray="4 18" fill="none"/><path d="M340 380l120 90M380 360l90 80" stroke="#8a4a3a" stroke-width="6" opacity=".6"/>' : ''}
    ${who === 'renegade' ? '<path d="M0 820L1600 820V900H0Z" fill="#4a3a2a"/><path d="M0 830h1600" stroke="#c84a1a" stroke-width="10"/>' : ''}
    <path d="M0 0H1600V250Q800 330 0 250Z" fill="#140c06"/>
    <path d="M0 250Q800 330 1600 250" stroke="#4a3018" stroke-width="10" fill="none"/>
    <rect width="1600" height="900" fill="url(#shade)"/>
    <path class="sweat" d="M${who === 'sheriff' ? 1300 : 300} 300q14 30 0 44q-14 -14 0 -44Z" fill="#dfe8ff" opacity="${who === 'sheriff' ? 0.9 : 0}"/>`);
}

/** 권총집 위에서 떨리는 손 */
function handShot(side) {
  const skin = side === 'outlaw' ? '#b88058' : '#d8a078';
  return svg(`<rect width="1600" height="900" fill="${side === 'outlaw' ? '#3a2418' : '#4a3020'}"/>
    <path d="M0 520Q800 470 1600 520V620Q800 570 0 620Z" fill="#2a1a0a"/>
    <path d="M0 540Q800 490 1600 540" stroke="#8a6a3a" stroke-width="6" fill="none" stroke-dasharray="10 14"/>
    <path d="M620 560L980 560L940 900H680Z" fill="#6a4020"/><path d="M640 580L960 580" stroke="#3a2010" stroke-width="6"/>
    <path d="M720 450L880 450L900 600H700Z" fill="#2a2a30"/><path d="M740 470L860 470L870 580H730Z" fill="#6a4a2a"/>
    <g class="hand">
      <path d="M560 220C620 180 760 180 840 230C880 260 880 300 860 320L620 330C570 300 540 250 560 220Z" fill="${skin}"/>
      ${[0, 1, 2, 3].map((i) => `<path class="finger f${i}" d="M${640 + i * 55} 320q-6 70 4 120q14 10 26 0q8 -50 2 -120Z" fill="${skin}" stroke="#6a3a20" stroke-width="2"/>`).join('')}
      <path d="M560 240q-40 40 -30 90q14 10 24 0q6 -30 30 -50Z" fill="${skin}"/>
      <path d="M0 160C200 150 450 170 580 210L600 300C450 290 200 300 0 320Z" fill="${side === 'outlaw' ? '#2a2a20' : '#4a3020'}"/>
    </g>`);
}

const FLASH = '<svg viewBox="-100 -100 200 200" class="muzzle-flash"><path d="M0 -90L18 -24L90 -30L30 8L70 80L0 30L-70 80L-30 8L-90 -30L-18 -24Z" fill="#fff4c0"/><circle r="30" fill="#fff"/></svg>';

/* ═════════ 인형 도우미 ═════════ */

const LOOKS = {
  sheriff: { hat: 'sheriff', coat: true, star: true },
  deputy: { hat: 'wide', coat: false, star: true },
  outlaw: { hat: 'wide', coat: true, bandana: '#8a1a1a' },
  renegade: { hat: 'sombrero', coat: false, poncho: true, dual: true },
};

function cowboy(w, role, x, y, scale, { flip = false, rim, color } = {}) {
  const c = makeCowboy(w, { look: LOOKS[role], x, y, scale, flip, rim: rim || (role === 'outlaw' ? '#ffb080' : '#ffe8b0'), filter: true });
  if (color) c.svg.querySelectorAll('path').forEach((p) => { if (p.getAttribute('fill') === '#0a0c14') p.setAttribute('fill', color); });
  c.set(COWBOY_POSE.ready);
  return c;
}

function walkPose(ph) {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  return { body: 3, head: 0, fThigh: -s * 24, fShin: Math.max(0, c) * 30 + 4, bThigh: s * 24, bShin: Math.max(0, -c) * 30 + 4, fUpper: s * 18, fFore: -12, bUpper: -s * 18, bFore: -12 };
}

/* ═════════ 결투 장면 (winner: 'outlaw' | 'sheriff') ═════════ */

function duel(D, winner) {
  const loser = winner === 'outlaw' ? 'sheriff' : 'outlaw';
  // 1. 한낮의 거리, 마주 선 두 사람
  D.at(0, () => {
    D.sound('start:duel');
    D.cut(`${layer(svg(town('noon')), 'street')}<div class="tumble-wrap">${TUMBLE}</div>${speedLines('#e8d0a0', 14)}<div class="dust"></div>`);
    const w = D.world();
    const L = cowboy(w, 'sheriff', 420, 800, 1.5);
    const R = cowboy(w, 'outlaw', 1180, 800, 1.5, { flip: true });
    D.tick((s) => {
      for (const c of [L, R]) {
        c.extra = { body: Math.sin(s * 1.5) * 0.8, bUpper: Math.sin(s * 2) * 2, coat: 0 };
        c.apply();
      }
      // 코트 자락이 바람에
      w.querySelectorAll('.coat').forEach((el, i) => { el.style.transform = `skewX(${Math.sin(s * 5 + i) * 6}deg)`; el.style.transformOrigin = '0 0'; });
    });
    D.anim('.street', [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }], { duration: 2800, easing: 'linear' });
    D.anim('.tumble-wrap', [{ transform: 'translateX(-20vw) rotate(0)' }, { transform: 'translateX(120vw) rotate(900deg)' }], { duration: 3000, easing: 'linear' });
    D.anim('.an-speed', [{ transform: 'translateX(30%)', opacity: 0.4 }, { transform: 'translateX(-60%)', opacity: 0.4 }], { duration: 900, iterations: 4, easing: 'linear' });
  });
  // 2. 눈 초근접 ×2
  D.at(2.8, () => {
    D.sound('tension');
    D.cut(`<div class="an-zoomer eyes-l">${eyesShot('sheriff')}</div>`);
    D.anim('.an-zoomer', [{ transform: 'scale(1.3) translateX(4%)' }, { transform: 'scale(1.1) translateX(-2%)' }], { duration: 1100, easing: 'ease-out' });
    D.anim('.sweat', [{ transform: 'translateY(0)' }, { transform: 'translateY(60px)' }], { duration: 1000, easing: 'ease-in' });
  });
  D.at(3.9, () => {
    D.cut(`<div class="an-zoomer">${eyesShot('outlaw')}</div>`);
    D.anim('.an-zoomer', [{ transform: 'scale(1.3) translateX(-4%)' }, { transform: 'scale(1.1) translateX(2%)' }], { duration: 1100, easing: 'ease-out' });
    D.anim('.brow', [{ transform: 'translateY(0)' }, { transform: 'translateY(12px)' }], { duration: 400, delay: 500 });
  });
  // 3. 권총집 위 손가락
  D.at(5.0, () => {
    D.sound('tick');
    D.cut(`<div class="an-zoomer">${handShot(winner)}</div>`);
    D.anim('.an-zoomer', [{ transform: 'scale(1.15)' }, { transform: 'scale(1.05)' }], { duration: 1100 });
    for (let i = 0; i < 4; i++) D.anim(`.f${i}`, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${i % 2 ? 6 : -6}deg)` }], { duration: 110 + i * 20, iterations: 10, direction: 'alternate' });
  });
  // 4. 뽑아서 쏜다! (이긴 쪽이 조금 빠르다)
  D.at(6.1, () => {
    D.cut(`${layer(svg(town('noon')), 'street2')}<div class="flash-a"></div>`);
    const w = D.world();
    const L = cowboy(w, 'sheriff', 520, 820, 2.1);
    const R = cowboy(w, 'outlaw', 1080, 820, 2.1, { flip: true });
    const win = winner === 'sheriff' ? L : R;
    const lose = winner === 'sheriff' ? R : L;
    const mw = motion(win, [[0, COWBOY_POSE.ready], [0.14, COWBOY_POSE.aim, 'snap'], [0.26, COWBOY_POSE.recoil, 'out'], [0.6, COWBOY_POSE.aim, 'inOut'], [2.6, COWBOY_POSE.aim]]);
    const ml = motion(lose, [
      [0, COWBOY_POSE.ready], [0.22, { ...COWBOY_POSE.aim, fUpper: -60 }, 'snap'],
      [0.3, COWBOY_POSE.hit, 'snap'], [1.3, { ...COWBOY_POSE.hit, body: -40 }, 'inOut'],
      [2.4, { ...COWBOY_POSE.down, rot: winner === 'sheriff' ? 80 : -80, y: 860, 'hat.x': -120, 'hat.y': -160, hat: -300 }, 'in'],
    ]);
    // 모자가 날아간다
    D.tick((s) => {
      mw(s);
      ml(s);
    });
    const muzzle = (rig) => {
      const flash = document.createElement('div');
      flash.className = 'muzzle';
      flash.innerHTML = FLASH;
      const x = rig === L ? 520 + 190 : 1080 - 190;
      flash.style.left = `${x - 90}px`;
      flash.style.top = `${820 - 290}px`;
      w.appendChild(flash);
      flash.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.3 }, { transform: 'scale(.6)', opacity: 0 }], { duration: 260, fill: 'forwards' });
      const smoke = document.createElement('div');
      smoke.className = 'smoke';
      smoke.style.left = `${x - 40}px`;
      smoke.style.top = `${820 - 250}px`;
      w.appendChild(smoke);
      smoke.animate([{ transform: 'scale(.3)', opacity: 0.9 }, { transform: `translate(${rig === L ? 60 : -60}px, -120px) scale(2.4)`, opacity: 0 }], { duration: 2200, fill: 'forwards', easing: 'ease-out' });
    };
    D.at(0.18, () => { D.sound('gun'); D.flash('#fff', 140); D.impact(120); muzzle(win); D.shake(26, 500); });
    D.at(0.26, () => { D.sound('gun2'); muzzle(lose); });
    D.at(0.34, () => { D.sound('hit'); });
    D.at(0.4, () => D.anim('.street2', [{ transform: 'scale(1)' }, { transform: `scale(1.18) translateX(${winner === 'sheriff' ? -6 : 6}%)` }], { duration: 2800, easing: 'ease-out' }));
  });
  D.at(8.4, () => D.sound('thud'));
}

function finale(D, kind, at) {
  D.at(at, () => {
    if (kind === 'outlaw') {
      D.sound('laugh');
      D.cut(`${layer(svg(town('sunset', { sunY: 560, sunX: 800 })), 'fin')}`, 'with-title');
      const w = D.world();
      const gang = [cowboy(w, 'outlaw', 520, 760, 1.4, { rim: '#ff9060', color: '#0a0404' }), cowboy(w, 'outlaw', 800, 780, 1.7, { rim: '#ff9060', color: '#0a0404' }), cowboy(w, 'outlaw', 1080, 760, 1.4, { flip: true, rim: '#ff9060', color: '#0a0404' })];
      const blow = motion(gang[1], [[0, COWBOY_POSE.aim], [1.2, COWBOY_POSE.blow, 'inOut'], [4, COWBOY_POSE.blow]]);
      D.tick((s) => {
        blow(s);
        gang[0].set({ ...COWBOY_POSE.aim, fUpper: -150 + Math.sin(s * 8) * 10 });
        gang[2].set({ ...COWBOY_POSE.aim, fUpper: -140 + Math.cos(s * 8) * 10 });
        for (const g of gang) { g.extra = { body: Math.sin(s * 8) * 2, head: Math.sin(s * 8) * 4 }; g.apply(); }
      });
      w.insertAdjacentHTML('beforeend', '<div class="smoke puff" style="left:820px;top:430px"></div>');
      D.anim('.puff', [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 0.8, transform: 'translateY(-30px) scale(1)', offset: 0.4 }, { opacity: 0, transform: 'translateY(-160px) scale(2.5)' }], { duration: 2400, delay: 1200, iterations: 2 });
      D.anim('.fin', [{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 4000, easing: 'ease-out' });
    } else if (kind === 'sheriff') {
      D.sound('bell');
      D.cut(`${layer(svg(town('dusk', { sunY: 520, sunX: 800 })), 'fin')}<div class="an-rays" style="opacity:.3"></div>`, 'with-title');
      const w = D.world();
      const sh = cowboy(w, 'sheriff', 700, 780, 1.9, { color: '#0a0606' });
      const dp = cowboy(w, 'deputy', 940, 790, 1.6, { flip: true, color: '#0a0606' });
      sh.set(COWBOY_POSE.aim);
      const spin = motion(sh, [[0, COWBOY_POSE.aim], [0.6, { ...COWBOY_POSE.ready, fGun: 720 }, 'out'], [1.2, { ...COWBOY_POSE.holster, fGun: 720 }], [4, COWBOY_POSE.holster]]);
      D.tick((s) => {
        spin(s);
        dp.set({ ...COWBOY_POSE.holster, fUpper: -20 + Math.sin(s * 2) * 4, bUpper: 20 });
        for (const g of [sh, dp]) { g.extra = { body: Math.sin(s * 1.6) * 1 }; g.apply(); }
      });
      w.insertAdjacentHTML('beforeend', '<div class="glint" style="left:690px;top:600px"></div>');
      D.anim('.glint', [{ opacity: 0, transform: 'scale(0) rotate(0)' }, { opacity: 1, transform: 'scale(1.4) rotate(90deg)' }, { opacity: 0, transform: 'scale(0) rotate(180deg)' }], { duration: 900, delay: 1400, iterations: 3 });
      D.anim('.fin', [{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 4000, easing: 'ease-out' });
    }
  });
}

const SCENES = {
  outlaw(D) { duel(D, 'outlaw'); finale(D, 'outlaw', 9.4); },
  sheriff(D) { duel(D, 'sheriff'); finale(D, 'sheriff', 9.4); },
  /* 배신자: 1대1 결투 직전, 드리운 그림자 → 지붕 위 배신자 → 슬로모션 쌍권총 → 착지 → 권총 돌려 넣고 모자 인사 */
  renegade(D) {
    const standoff = (cls) => {
      D.cut(`${layer(svg(town('noon')), cls)}<div class="dust"></div>`);
      const w = D.world();
      const L = cowboy(w, 'sheriff', 420, 800, 1.5);
      const R = cowboy(w, 'outlaw', 1180, 800, 1.5, { flip: true });
      return { w, L, R };
    };
    // 1. 마주 선 두 사람
    D.at(0, () => {
      D.sound('start:duel');
      const { L, R } = standoff('street');
      D.add(`<div class="tumble-wrap">${TUMBLE}</div>`);
      D.tick((s) => { for (const c of [L, R]) { c.extra = { body: Math.sin(s * 1.5) * 0.8 }; c.apply(); } });
      D.anim('.street', [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }], { duration: 2400, easing: 'linear' });
      D.anim('.tumble-wrap', [{ transform: 'translateX(-20vw) rotate(0)' }, { transform: 'translateX(120vw) rotate(900deg)' }], { duration: 2600, easing: 'linear' });
    });
    // 2~3. 눈, 눈, 손
    D.at(2.2, () => { D.sound('tension'); D.cut(`<div class="an-zoomer">${eyesShot('sheriff')}</div>`); D.anim('.an-zoomer', [{ transform: 'scale(1.3)' }, { transform: 'scale(1.1)' }], { duration: 900, easing: 'ease-out' }); });
    D.at(3.1, () => { D.cut(`<div class="an-zoomer">${eyesShot('outlaw')}</div>`); D.anim('.an-zoomer', [{ transform: 'scale(1.3)' }, { transform: 'scale(1.1)' }], { duration: 900, easing: 'ease-out' }); });
    D.at(4.0, () => {
      D.sound('tick');
      D.cut(`<div class="an-zoomer">${handShot('sheriff')}</div>`);
      for (let i = 0; i < 4; i++) D.anim(`.f${i}`, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${i % 2 ? 6 : -6}deg)` }], { duration: 110 + i * 20, iterations: 8, direction: 'alternate' });
    });
    // 4. 거리에 그림자가 스치고, 두 사람이 고개를 든다
    D.at(4.9, () => {
      D.sound('whistle');
      const { w, L, R } = standoff('street2');
      w.insertAdjacentHTML('afterbegin', '<div class="ground-shadow"></div>');
      const up = (c) => motion(c, [[0, COWBOY_POSE.ready], [0.5, COWBOY_POSE.ready], [0.9, COWBOY_POSE.lookUp, 'out'], [1.4, COWBOY_POSE.lookUp]]);
      const a1 = up(L);
      const a2 = up(R);
      D.tick((s) => { a1(s); a2(s); });
      D.anim('.ground-shadow', [{ transform: 'translateX(-40%) scaleX(1.4)', opacity: 0 }, { opacity: 0.6, offset: 0.3 }, { transform: 'translateX(40%) scaleX(1.4)', opacity: 0.6 }], { duration: 1300, easing: 'ease-in-out' });
      D.anim('.street2', [{ transform: 'scale(1.08)' }, { transform: 'scale(1.1) translateY(2%)' }], { duration: 1300 });
    });
    // 5. 지붕 위 — 해를 등진 배신자, 판초가 바람에 날리고 모자챙을 올린다
    D.at(6.2, () => {
      D.cut(`${layer(svg(`${town('noon', { sunY: 250, sunX: 820 })}<path d="M0 900V560H1600V900Z" fill="#3a2414"/><path d="M0 560H1600" stroke="#1a0e06" stroke-width="10"/>`), 'roof')}<div class="an-rays" style="opacity:.7"></div>`);
      const w = D.world();
      const ren = cowboy(w, 'renegade', 820, 610, 2.1, { color: '#070303', rim: '#fff4c0' });
      const m = motion(ren, [[0, COWBOY_POSE.holster], [0.7, COWBOY_POSE.holster], [1.2, COWBOY_POSE.tipHat, 'inOut'], [1.8, COWBOY_POSE.tipHat]]);
      D.tick((s) => {
        m(s);
        ren.extra = { poncho: Math.sin(s * 7) * 8 + 6, body: Math.sin(s * 1.5) * 0.6, bFore: Math.sin(s * 7 + 1) * 3 };
        ren.apply();
      });
      D.anim('.roof', [{ transform: 'scale(1.15) translateY(4%)' }, { transform: 'scale(1.02)' }], { duration: 1800, easing: 'ease-out' });
      D.at(1.25, () => { D.add('<div class="glint" style="left:49%;top:30%"></div>'); D.anim('.glint', [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.6) rotate(90deg)' }, { opacity: 0, transform: 'scale(0) rotate(180deg)' }], { duration: 500 }); });
    });
    // 6. 슬로모션: 뛰어내리며 쌍권총, 양쪽으로 동시에 쏜다
    D.at(8.0, () => {
      D.cut(`${layer(svg(town('noon')), 'street3 slowmo')}${speedLines('#fff4d0', 26)}`, 'slowmo-shot');
      const w = D.world();
      const L = cowboy(w, 'sheriff', 330, 820, 1.7);
      const R = cowboy(w, 'outlaw', 1270, 820, 1.7, { flip: true });
      L.set(COWBOY_POSE.lookUp);
      R.set(COWBOY_POSE.lookUp);
      const ren = cowboy(w, 'renegade', 800, 180, 1.9, { color: '#070303', rim: '#fff4c0' });
      const mr = motion(ren, [
        [0, { ...COWBOY_POSE.leap, y: 180, rot: -14 }],
        [0.8, { ...COWBOY_POSE.dualAim, y: 460, rot: 0, fThigh: -70, fShin: 100, bThigh: 20, bShin: 80, poncho: -30 }, 'out'],
        [1.2, { ...COWBOY_POSE.dualAim, y: 560, fThigh: -70, fShin: 100, bThigh: 20, bShin: 80, poncho: -34 }],
        [1.6, { ...COWBOY_POSE.kneel, y: 830 }, 'in'],
      ]);
      const hitL = motion(L, [[0, COWBOY_POSE.lookUp], [0.95, { ...COWBOY_POSE.aim, fUpper: -120, head: -20 }], [1.05, COWBOY_POSE.hit, 'snap'], [2.8, { ...COWBOY_POSE.down, rot: -82, y: 870, 'hat.x': -120, 'hat.y': -160, hat: -300 }, 'in']]);
      const hitR = motion(R, [[0, COWBOY_POSE.lookUp], [0.95, { ...COWBOY_POSE.aim, fUpper: -120, head: -20 }], [1.05, COWBOY_POSE.hit, 'snap'], [2.8, { ...COWBOY_POSE.down, rot: -82, y: 870, 'hat.x': -120, 'hat.y': -160, hat: -300 }, 'in']]);
      D.tick((s) => { mr(s); hitL(s); hitR(s); });
      const trail = (x1, x2) => {
        const tr = document.createElement('div');
        tr.className = 'bullet-trail';
        tr.style.left = `${Math.min(x1, x2)}px`;
        tr.style.width = `${Math.abs(x2 - x1)}px`;
        tr.style.top = '440px';
        w.appendChild(tr);
        tr.animate([{ transform: `scaleX(0)`, transformOrigin: x2 < x1 ? 'right' : 'left', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
      };
      const flash = (x) => {
        const fl = document.createElement('div');
        fl.className = 'muzzle';
        fl.innerHTML = FLASH;
        fl.style.left = `${x - 90}px`;
        fl.style.top = '350px';
        w.appendChild(fl);
        fl.animate([{ transform: 'scale(.2)' }, { transform: 'scale(1.4)', offset: 0.3 }, { transform: 'scale(.5)', opacity: 0 }], { duration: 300, fill: 'forwards' });
      };
      D.at(0.85, () => { D.sound('gun'); D.sound('gun2'); D.flash('#fff', 160); D.impact(140); flash(620); flash(980); trail(620, 380); trail(980, 1220); D.shake(22, 500); });
      D.at(1.0, () => D.sound('hit'));
      D.at(1.6, () => { D.sound('thud'); D.shake(30, 500); D.add('<div class="dust-ring"></div>'); D.anim('.dust-ring', [{ transform: 'translate(-50%, -50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 }], { duration: 1100, easing: 'ease-out' }); });
      D.anim('.street3', [{ transform: 'scale(1.2) translateY(-4%)' }, { transform: 'scale(1.05)' }], { duration: 3200, easing: 'ease-out' });
    });
    // 7. 석양: 일어나 권총을 돌려 넣고, 모자를 살짝 기울인다
    D.at(11.3, () => {
      D.sound('wind');
      D.cut(`${layer(svg(town('sunset', { sunY: 520 })), 'fin')}<div class="dust thick"></div><div class="an-rays" style="opacity:.35"></div>`, 'with-title');
      const w = D.world();
      const ren = cowboy(w, 'renegade', 800, 860, 2.7, { color: '#070303', rim: '#ffb060' });
      const m = motion(ren, [
        [0, { ...COWBOY_POSE.kneel, fGun: 0, bGun: 0 }],
        [0.8, { ...COWBOY_POSE.dualAim, fUpper: -40, bUpper: 40, fGun: 0, bGun: 0 }, 'inOut'],
        [1.6, { ...COWBOY_POSE.holster, fGun: 1080, bGun: -1080, bUpper: -8 }, 'out'],
        [2.4, { ...COWBOY_POSE.tipHat, fGun: 1080, bGun: -1080 }, 'inOut'],
        [3.2, { ...COWBOY_POSE.holster, fGun: 1080, bGun: -1080 }, 'inOut'],
      ]);
      D.tick((s) => { m(s); ren.extra = { poncho: Math.sin(s * 5) * 7 + 4 }; ren.apply(); });
      D.anim('.fin', [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }], { duration: 4600, easing: 'ease-out' });
    });
  },
};

const META = {
  outlaw: { title: '무법자의 승리', titleAt: 10.4, length: 15 },
  sheriff: { title: '보안관의 승리', titleAt: 10.4, length: 15 },
  renegade: { title: '배신자의 승리', titleAt: 13.4, length: 16.5 },
};

/**
 * @param {HTMLElement} host
 * @param {string[]} winners  서버의 over.winners (['outlaw'] / ['sheriff','deputy'] / ['renegade'])
 */
export function playEnding(host, winners, { sub = '', sound = () => {} } = {}) {
  const kind = winners.includes('sheriff') ? 'sheriff' : winners.includes('renegade') ? 'renegade' : 'outlaw';
  const m = META[kind];
  return playFilm(host, { scene: SCENES[kind], length: m.length, title: m.title, titleAt: m.titleAt, sub, sound });
}
