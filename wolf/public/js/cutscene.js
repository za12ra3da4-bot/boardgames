// 게임이 끝날 때 나오는 2D 애니메이션 결말 영상 (컷 전환 · 클로즈업 · 집중선 · 임팩트)
import { makeWolf, makeHuman, motion, WOLF_POSE, HUMAN_POSE, runPose } from '/anim/rig2d.js';
import { rnd, f, trees, svg, layer, houses, stars, MOON_DEFS, moonSvg, person, STAND, CHEER, POINT, focusLines, speedLines, sfxText, portrait, runner, playFilm } from '/anim/director.js';

const LENGTH = { wolf: 16, village: 16, tanner: 14, none: 10 };

/* ═════════════ 늑대 전용 그림 ═════════════ */

/** 늑대인간 전신 (조각을 겹쳐 하나의 실루엣으로, 달빛 테두리는 필터로) */
const WOLF = {
  backLeg: 'M150 410C120 430 110 460 118 480L96 540L100 562L86 598L150 600L148 590L118 584L116 560L140 486C160 470 176 450 182 430Z',
  frontLeg: 'M190 400C180 440 200 460 232 468L208 530L214 560L230 600L310 600L306 588L262 580L246 556L262 470C272 440 250 405 230 395Z',
  tail: 'M170 410C130 400 90 420 58 474L72 462L64 482L84 468L80 488L100 472C120 452 150 442 182 440Z',
  torso: 'M150 420C130 380 120 330 130 290L114 282L130 274L120 260L138 260L132 244L150 248C158 230 174 214 196 206C230 196 262 210 276 236C292 270 290 320 270 360C258 390 236 420 200 432Z',
  backArm: 'M170 250C150 270 132 300 124 340C118 370 116 392 118 410L102 442L116 428L110 454L124 432L124 458L134 430L140 452L140 424C142 400 146 370 156 340C164 314 176 290 190 272Z',
  howlHead: 'M196 214C200 190 206 170 214 156L202 100L228 138L234 92L250 136C262 128 276 122 290 114L352 62L362 72L320 110L344 102L340 116L312 130C300 148 286 162 272 174C276 198 270 222 256 238Z',
  howlArm: 'M250 240C280 250 300 280 312 312C330 300 346 284 356 266L348 236L362 258L362 222L372 256L386 230L380 268L396 258L374 292C358 316 336 340 314 354C296 340 272 300 244 280Z',
  standHead: 'M196 214C198 196 204 184 212 176L198 124L226 162L238 114L252 160C268 158 284 160 298 166L346 176L348 190L320 194L342 200L338 212L302 208C292 222 278 234 262 242Z',
  standArm: 'M250 240C276 262 290 300 294 340C296 370 292 396 290 414L302 446L288 432L292 458L280 436L278 462L270 434L264 456L264 426C262 400 262 370 256 340C250 314 240 290 230 272Z',
  fur: 'M140 300l-14 -4M136 330l-16 2M142 360l-14 8M232 212l6 -12M258 222l10 -8M204 440l-6 14M240 430l8 12M120 480l-12 4M262 480l12 4',
};
const WOLF_EYES = { howl: [[268, 146], [280, 140]], stand: [[262, 180], [276, 180]] };

function wolfSvg(pose = 'howl', { rim = '#dfe8ff', eyes = true } = {}) {
  const parts = pose === 'howl'
    ? [WOLF.tail, WOLF.backLeg, WOLF.backArm, WOLF.frontLeg, WOLF.torso, WOLF.howlHead, WOLF.howlArm]
    : [WOLF.tail, WOLF.backLeg, WOLF.backArm, WOLF.frontLeg, WOLF.torso, WOLF.standHead, WOLF.standArm];
  const id = `wr${Math.random().toString(36).slice(2, 7)}`;
  return `<svg viewBox="40 50 380 560" class="an-wolf">
    <defs>
      <filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d"/>
        <feFlood flood-color="${rim}"/><feComposite in2="d" operator="in" result="edge"/>
        <feGaussianBlur in="edge" stdDeviation="5" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="${id}f" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#2a3450"/><stop offset=".35" stop-color="#080a12"/><stop offset="1" stop-color="#030408"/></linearGradient>
      <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <g filter="url(#${id})" fill="url(#${id}f)">${parts.map((d) => `<path d="${d}"/>`).join('')}</g>
    <path d="${WOLF.fur}" stroke="#4a5470" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>
    ${pose === 'howl' ? '<path d="M318 112L338 106" stroke="#f4ecd8" stroke-width="2"/><path d="M322 116l3 5l3 -4l3 5" stroke="#f4ecd8" stroke-width="1.6" fill="none"/>' : '<path d="M312 196l3 5l3 -5l3 5l3 -5" stroke="#f4ecd8" stroke-width="1.8" fill="none"/>'}
    ${eyes ? `<g class="an-eyes">${WOLF_EYES[pose].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#ffcf30" opacity=".55" filter="url(#${id}g)"/><path d="M${x - 6} ${y + 1}L${x + 6} ${y - 2}L${x + 2} ${y + 3}Z" fill="#ffe680"/>`).join('')}</g>` : ''}
  </svg>`;
}

/** 늑대 눈 초근접 */
function wolfEyes() {
  const r = rnd(4);
  let fur = '';
  for (let i = 0; i < 160; i++) {
    const x = r() * 1600;
    const y = r() * 900;
    fur += `<path d="M${f(x)} ${f(y)}q${f(10 + r() * 20)} ${f(-4 + r() * 8)} ${f(30 + r() * 40)} ${f(10 + r() * 16)}" stroke="${r() > 0.7 ? '#4a3a30' : '#1a1210'}" stroke-width="${f(3 + r() * 5)}" fill="none" stroke-linecap="round"/>`;
  }
  const eye = (cx, flip) => `<g transform="translate(${cx} 450) scale(${flip} 1)">
    <path d="M-230 20C-150 -110 150 -120 230 -30C150 90 -150 110 -230 20Z" fill="#1a0a00"/>
    <path d="M-210 16C-140 -96 140 -104 210 -26C140 76 -140 94 -210 16Z" fill="url(#iris)"/>
    <ellipse cx="0" cy="-4" rx="26" ry="92" fill="#0a0400" class="an-pupil"/>
    <ellipse cx="-70" cy="-50" rx="36" ry="18" fill="#fff" opacity=".85"/>
    <path d="M-240 10C-150 -130 150 -140 240 -40" stroke="#000" stroke-width="30" fill="none" stroke-linecap="round"/>
    <path d="M-260 -80L260 -150" stroke="#0a0806" stroke-width="44" stroke-linecap="round"/>
  </g>`;
  return svg(`<defs><radialGradient id="iris"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ffc020"/><stop offset=".85" stop-color="#c86a00"/><stop offset="1" stop-color="#5a2a00"/></radialGradient></defs>
    <rect width="1600" height="900" fill="#2a201c"/>${fur}${eye(450, 1)}${eye(1150, -1)}
    <path d="M760 300L840 300L860 900H740Z" fill="#1a1210"/>`);
}

/* 인형 자리 잡기 도우미 */
function wolfAt(parent, x, y, scale, opts = {}) {
  const r = makeWolf(parent, { x, y, scale, ...opts });
  return r;
}

/* ═════════════ 장면들 ═════════════ */

const SCENES = {
  /* 늑대인간 승리 */
  wolf(D) {
    // 1. 잠든 마을, 불이 하나씩 꺼진다
    D.at(0, () => {
      D.sound('start:wolf');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s1" x2="0" y2="1"><stop offset="0" stop-color="#030712"/><stop offset=".7" stop-color="#0e2458"/><stop offset="1" stop-color="#27508e"/></linearGradient>${MOON_DEFS}</defs><rect width="1600" height="900" fill="url(#s1)"/>${stars(160, 3)}${moonSvg(1150, 260, 150)}`), 'pan-slow')}
        ${layer(svg(trees(40, 700, 120, 120, '#0c1830', 5)), 'pan-mid')}
        ${layer(svg(`<path d="M0 900V720C400 690 1200 700 1600 720V900Z" fill="#070a14"/>${houses(760, true)}`), 'pan-mid2')}
        ${layer(svg(trees(8, 940, 360, 200, '#020308', 8)), 'pan-fast')}
        <div class="an-fog"></div>`);
      D.anim('.pan-slow', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-2%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-mid', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-5%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-mid2', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-8%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-fast', [{ transform: 'translateX(0) scale(1.15)' }, { transform: 'translateX(-18%) scale(1.15)' }], { duration: 3600 });
      D.anim('.win', [{ fill: '#ffc868' }, { fill: '#161c2c' }], { duration: 120, delay: 800, stagger: 120 });
    });
    // 2. 겁에 질린 마을 사람 클로즈업
    D.at(3.4, () => {
      D.sound('whoosh');
      D.cut(`<div class="an-bg" style="background:#0a1020"></div>${focusLines('#3a4a70')}${portrait('villager')}${sfxText('...!?', 'small', 'left:64%;top:16%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.05)' }, { transform: 'translate(-50%,-50%) scale(1.35)' }], { duration: 1700, easing: 'ease-out' });
      D.anim('.an-focus', [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300 });
      D.anim('.an-sfx', [{ transform: 'scale(0) rotate(-20deg)' }, { transform: 'scale(1.2) rotate(8deg)' }, { transform: 'scale(1) rotate(6deg)' }], { duration: 350, delay: 300 });
      D.shake(6, 1600);
    });
    // 3~4. 절벽 위 늑대인간: 웅크렸다가 일어서 포효하고, 고개를 젖혀 운다 (관절 하나하나)
    D.at(5.2, () => {
      D.sound('whoosh');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s3" x2="0" y2="1"><stop offset="0" stop-color="#050a1e"/><stop offset="1" stop-color="#1c3c7c"/></linearGradient>${MOON_DEFS}</defs><rect width="1600" height="900" fill="url(#s3)"/>${stars(120, 7)}${moonSvg(800, 360, 330)}`), 'moon-bg')}
        <div class="an-rays"></div>
        ${focusLines('#dfe8ff', 70, 380)}`);
      const w = D.world();
      w.insertAdjacentHTML('beforeend', '<svg class="an-cliff" viewBox="0 0 1600 900" width="1600" height="900" style="position:absolute;left:0;top:0"><path d="M380 900L500 740C560 690 660 676 720 684C790 676 890 672 950 696C1040 716 1120 760 1220 900Z" fill="#04050a"/><path d="M720 684C790 676 890 672 950 696" stroke="#dfe8ff" stroke-width="4" fill="none" opacity=".7"/><path d="M540 760l40 -10M1000 740l50 20" stroke="#1a2440" stroke-width="3"/></svg>');
      const wolf = wolfAt(w, 800, 1100, 1.25);
      wolf.set(WOLF_POSE.crouch);
      const mv = motion(wolf, [
        [0, { ...WOLF_POSE.crouch, y: 1150, scale: 1.25 }],
        [1.0, { ...WOLF_POSE.crouch, y: 700 }, 'out'],
        [1.5, { ...WOLF_POSE.stand, y: 690 }, 'back'],
        [2.1, { ...WOLF_POSE.roar, y: 690 }, 'snap'],
        [2.8, { ...WOLF_POSE.roar, y: 690, jaw: 20 }],
        [3.3, { ...WOLF_POSE.howl, y: 684, scale: 1.3 }, 'out'],
        [6.0, { ...WOLF_POSE.howl, y: 684, scale: 1.34 }],
      ]);
      let eyes = false;
      D.tick((s) => {
        mv(s);
        // 숨 · 꼬리 · 귀 떨림 (늘 조금씩 움직인다)
        wolf.extra = {
          chest: Math.sin(s * 3) * 1.5,
          tail1: Math.sin(s * 2.2) * 8, tail2: Math.sin(s * 2.2 - 0.6) * 12, tail3: Math.sin(s * 2.2 - 1.2) * 16,
          head: s > 3.3 ? Math.sin(s * 30) * 1.2 : 0,
          jaw: s > 3.3 ? Math.sin(s * 9) * 3 : 0,
          fHand: Math.sin(s * 4) * 4, bHand: Math.cos(s * 4) * 4,
        };
        wolf.apply();
        if (!eyes && s > 1.4) { eyes = true; wolf.eyesOn(1); D.flash('#ffd23a', 120); }
      });
      D.anim('.moon-bg', [{ transform: 'scale(1.25)' }, { transform: 'scale(1.05)' }], { duration: 3800, easing: 'ease-out' });
      D.anim('.an-focus', [{ opacity: 0 }, { opacity: 0 }, { opacity: 0.3 }], { duration: 2200 });
    });
    D.at(7.3, () => { D.sound('roar'); D.shake(14, 600); D.add(sfxText('크르르르…', 'small', 'left:10%;top:62%')); D.anim('.an-sfx', [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1) rotate(-4deg)' }], { duration: 300 }); });
    D.at(8.5, () => {
      D.sound('howl');
      D.flash('#dfe8ff', 220);
      D.shake(18, 1600);
      D.add(sfxText('아우우우우—!!', 'howl', 'left:4%;top:10%'));
      D.anim('.an-sfx.howl', [{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(-6deg)', opacity: 1 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], { duration: 400 });
      D.anim('.an-focus', [{ opacity: 0.3, transform: 'scale(1)' }, { opacity: 0.9, transform: 'scale(1.06)' }, { opacity: 0.45, transform: 'scale(1)' }], { duration: 380, iterations: 5 });
    });
    // 5. 눈 초근접 → 임팩트
    D.at(10.4, () => {
      D.cut(`<div class="an-zoomer">${wolfEyes()}</div>`);
      D.anim('.an-zoomer', [{ transform: 'scale(1.7)' }, { transform: 'scale(1.1)' }], { duration: 900, easing: 'cubic-bezier(.1,.9,.2,1)' });
      D.anim('.an-pupil', [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.3)' }], { duration: 300, delay: 500, easing: 'ease-in' });
    });
    D.at(11.15, () => { D.impact(260); D.sound('impact'); D.shake(26, 400); });
    // 6. 할퀴기
    D.at(11.6, () => {
      D.sound('slash');
      D.cut(`<div class="an-bg" style="background:radial-gradient(circle at 50% 50%, #5a0808, #0a0000)"></div>${CLAW}${sfxText('스악!!', 'slash', 'right:8%;bottom:16%')}`);
      D.flash('#fff', 180);
      D.anim('.cl', [{ clipPath: 'inset(0 100% 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 260, stagger: 70, easing: 'cubic-bezier(.2,.9,.3,1)' });
      D.anim('.an-sfx', [{ transform: 'scale(2) rotate(10deg)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 250, delay: 300 });
      D.shake(30, 600);
    });
    // 7. 핏빛 달 아래 제목
    D.at(12.9, () => {
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s7" x2="0" y2="1"><stop offset="0" stop-color="#1a0000"/><stop offset=".6" stop-color="#5a0a0a"/><stop offset="1" stop-color="#8a1a10"/></linearGradient>
          <radialGradient id="rm"><stop offset="0" stop-color="#ffd0a0"/><stop offset=".7" stop-color="#e85a30"/><stop offset="1" stop-color="#a02010"/></radialGradient>
          <radialGradient id="rh"><stop offset=".4" stop-color="#ff6040" stop-opacity=".5"/><stop offset="1" stop-color="#ff2000" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="url(#s7)"/><circle cx="800" cy="330" r="500" fill="url(#rh)"/><circle cx="800" cy="330" r="240" fill="url(#rm)"/>
          ${trees(36, 760, 140, 110, '#1a0404', 11)}${houses(820, false).replace(/#070a14/g, '#0a0000')}<path d="M0 900V810C500 790 1100 790 1600 810V900Z" fill="#0a0000"/>`), 'title-bg')}
        `, 'with-title');
      const w7 = D.world();
      const wolf7 = wolfAt(w7, 800, 780, 0.62, { rim: '#ffb090', eyeColor: '#ff5020' });
      wolf7.set(WOLF_POSE.howl);
      wolf7.eyesOn(1);
      D.tick((s) => { wolf7.extra = { jaw: Math.sin(s * 8) * 4, tail2: Math.sin(s * 2) * 10, chest: Math.sin(s * 3) * 1.5 }; wolf7.apply(); });
      D.anim('.title-bg', [{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 3200, easing: 'ease-out' });
      D.flash('#ff2000', 500);
    });
  },

  /* 마을 승리 */
  village(D) {
    // 1. 횃불 행렬이 숲을 가른다 (뛰는 사람들: 팔다리 따로)
    D.at(0, () => {
      D.sound('start:village');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="v1" x2="0" y2="1"><stop offset="0" stop-color="#050a1e"/><stop offset="1" stop-color="#2a3a6a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#v1)"/>${stars(100, 2)}`))}
        ${layer(svg(trees(34, 720, 160, 120, '#0c1428', 21)), 'pan-mid')}
        ${layer(svg('<path d="M0 900V760H1600V900Z" fill="#05060a"/>'))}`);
      const w = D.world();
      const people = [];
      for (let i = 0; i < 8; i++) {
        const h = makeHuman(w, { tool: i % 2 ? 'torch' : 'fork', scale: 1.9 + (i % 3) * 0.2, x: 0, y: 790 + (i % 3) * 22 });
        people.push({ h, x0: -260 - i * 170 - (i % 2) * 40, ph: i * 0.23, sp: 1.9 + (i % 3) * 0.1 });
      }
      w.insertAdjacentHTML('beforeend', `<div class="an-layer an-blur pan-fast">${svg(trees(7, 960, 380, 160, '#020308', 22))}</div>${speedLines('#ffd8a0', 30)}`);
      D.tick((s) => {
        for (const p of people) {
          p.h.set({ ...runPose((s * p.sp + p.ph) % 1), x: p.x0 + s * 420, y: p.h.world.y });
          p.h.world.y = p.h.world.y;
        }
      });
      D.anim('.pan-mid', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-8%) scale(1.1)' }], { duration: 3200, easing: 'linear' });
      D.anim('.pan-fast', [{ transform: 'translateX(10%) scale(1.2)' }, { transform: 'translateX(-40%) scale(1.2)' }], { duration: 3200, easing: 'linear' });
      D.anim('.an-speed', [{ transform: 'translateX(40%)' }, { transform: 'translateX(-60%)' }], { duration: 600, iterations: 6, easing: 'linear' });
    });
    // 2. 예언자: "저 녀석이다!"
    D.at(3.2, () => {
      D.sound('whoosh');
      D.cut(`<div class="an-bg" style="background:radial-gradient(circle,#3a4aa0,#0a0a2a)"></div>${focusLines('#b8e0ff')}${portrait('seer', 'glow')}${sfxText('저 녀석이다!', 'shout', 'left:5%;top:10%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.3)' }, { transform: 'translate(-50%,-50%) scale(1.1)' }], { duration: 1600, easing: 'ease-out' });
      D.anim('.an-sfx', [{ transform: 'scale(0) rotate(-10deg)' }, { transform: 'scale(1.15) rotate(-6deg)' }, { transform: 'scale(1) rotate(-6deg)' }], { duration: 350, delay: 200 });
      D.anim('.an-focus', [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2deg)' }], { duration: 120, iterations: 14, direction: 'alternate' });
    });
    // 3. 늑대인간 당황
    D.at(5, () => {
      D.cut(`<div class="an-bg" style="background:#1a0a0a"></div>${focusLines('#ff9080', 100, 300)}${portrait('werewolf')}${sfxText('!!', 'small', 'right:16%;top:14%')}`);
      D.shake(12, 900);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.15)' }, { transform: 'translate(-53%,-50%) scale(1.15)' }], { duration: 60, iterations: 14, direction: 'alternate' });
    });
    // 4. 쇠스랑 일격 → 늑대인간이 날아간다 (몸이 꺾이며 회전)
    D.at(6.4, () => {
      D.sound('impact');
      D.impact(200);
      D.cut(`
        <div class="an-bg" style="background:radial-gradient(circle at 55% 45%, #fff8e0, #ffb050 40%, #6a2010)"></div>
        ${focusLines('#fff', 110, 200)}
        ${sfxText('쾅!!', 'boom', 'left:22%;top:18%')}`);
      const w = D.world();
      const wolf = wolfAt(w, 760, 760, 1.2, { rim: '#fff4d0' });
      const mv = motion(wolf, [
        [0, { ...WOLF_POSE.roar, x: 760, y: 760, rot: 0, scale: 1.2 }],
        [0.15, { ...WOLF_POSE.hurt, x: 820, y: 700, rot: -20 }, 'snap'],
        [1.3, { ...WOLF_POSE.hurt, x: 1700, y: 60, rot: 340, scale: 0.12 }, 'in'],
      ]);
      D.tick((s) => { mv(s); wolf.extra = { fHand: Math.sin(s * 30) * 20, bHand: Math.cos(s * 30) * 20, tail2: Math.sin(s * 20) * 30 }; wolf.apply(); });
      D.shake(34, 700);
      D.anim('.an-sfx', [{ transform: 'scale(3)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 220 });
    });
    D.at(7.7, () => D.add('<div class="an-twinkle"></div>'));
    // 5. 새벽이 밝아 오고 환호
    D.at(8.6, () => {
      D.sound('cheer');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="d1" x2="0" y2="1"><stop offset="0" stop-color="#3a5aa0"/><stop offset=".5" stop-color="#f09860"/><stop offset=".8" stop-color="#ffd890"/></linearGradient>
          <radialGradient id="sun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe080"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="url(#d1)"/><g class="an-sun"><circle cx="800" cy="640" r="420" fill="url(#sun)"/>
          ${Array.from({ length: 16 }, (_, i) => `<path d="M800 640L${f(800 + Math.cos((i / 16) * Math.PI * 2) * 1400)} ${f(640 + Math.sin((i / 16) * Math.PI * 2) * 1400)}L${f(800 + Math.cos((i / 16 + 0.02) * Math.PI * 2) * 1400)} ${f(640 + Math.sin((i / 16 + 0.02) * Math.PI * 2) * 1400)}Z" fill="#fff4c0" opacity=".18"/>`).join('')}</g>`), 'dawn')}
        ${layer(svg(`${trees(30, 700, 130, 90, '#3a2230', 31)}<path d="M0 900V690C300 660 600 680 800 700C1000 680 1300 660 1600 690V900Z" fill="#2a1420"/>${houses(760, false, 7).replace(/#070a14/g, '#1a0c14')}`))}
        <div class="an-rays" style="opacity:.35"></div>`, 'with-title');
      const w = D.world();
      const crowd = [];
      for (let i = 0; i < 11; i++) {
        const h = makeHuman(w, { color: '#12080a', rim: '#ffd890', tool: i % 3 === 0 ? 'fork' : i % 3 === 1 ? 'torch' : null, scale: 1.45 + (i % 3) * 0.2, x: 70 + i * 146, y: 930 });
        h.set(HUMAN_POSE.stand);
        crowd.push({ h, ph: i * 0.37 });
      }
      D.tick((s) => {
        for (const { h, ph } of crowd) {
          const k = Math.max(0, Math.sin((s + ph) * 7));
          const up = Math.min(1, s * 2);
          h.set({
            fUpper: -20 - 140 * up + k * 12, fFore: -30 + k * 20, bUpper: 20 + 135 * up - k * 12, bFore: 30 - k * 20,
            fThigh: -k * 14, fShin: k * 24, bThigh: k * 10, bShin: k * 20, body: -k * 4, head: -10 * up + k * 4,
            tool: 150 * up, y: 930 - k * 24,
          });
        }
      });
      D.anim('.an-sun', [{ transform: 'translateY(300px)' }, { transform: 'translateY(0)' }], { duration: 3000, easing: 'ease-out' });
      D.anim('.dawn', [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 5000 });
    });
  },

  /* 무두장이 승리 */
  tanner(D) {
    const rain = '<div class="an-rain"></div>';
    // 1. 빗속, 무두장이의 섬뜩한 미소
    D.at(0, () => {
      D.sound('start:tanner');
      D.cut(`<div class="an-bg" style="background:#2a303a"></div>${portrait('tanner', 'grey')}${rain}${sfxText('후후…', 'small', 'left:62%;top:18%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.25)' }], { duration: 2800, easing: 'ease-in' });
    });
    // 2. 손가락질하는 마을 사람들
    D.at(2.8, () => {
      D.sound('whoosh');
      D.cut(`<div class="an-bg" style="background:linear-gradient(#4a5260,#2a303a)"></div>${focusLines('#8a94a8', 60, 360)}${sfxText('저놈을 처형하라!', 'shout', 'left:24%;top:10%')}${rain}`);
      const w = D.world();
      const mob = [];
      for (let i = 0; i < 7; i++) {
        const h = makeHuman(w, { color: '#10141a', rim: '#aab4c8', tool: i % 2 ? 'torch' : null, scale: 3 + (i % 2) * 0.4, x: 120 + i * 230, y: 1000, flip: i > 3 });
        mob.push({ h, ph: i * 0.5 });
      }
      D.tick((s) => {
        for (const { h, ph } of mob) {
          const k = Math.sin((s + ph) * 10);
          h.set({ ...HUMAN_POSE.point, fUpper: -85 + k * 10, fFore: -8 + k * 6, body: -4 + k * 2, head: -4 - k * 3, bUpper: 14 - k * 20 });
        }
      });
      D.anim('.an-sfx', [{ transform: 'scale(0)' }, { transform: 'scale(1) rotate(-4deg)' }], { duration: 300 });
      D.shake(8, 900);
    });
    // 3. 번개
    D.at(4.6, () => {
      D.sound('thunder');
      D.cut(`${layer(svg(`<rect width="1600" height="900" fill="#1a1e24"/>${trees(30, 760, 160, 100, '#08090c', 41)}<path d="M0 900V760H1600V900Z" fill="#050608"/>
        <path d="M700 0L660 260L740 280L620 560L700 580L560 900" stroke="#fff" stroke-width="10" fill="none"/>
        <g fill="#3a404a"><path d="M300 900V720Q360 660 420 720V900Z"/><path d="M1100 900V700Q1170 630 1240 700V900Z"/></g><path d="M780 900V740H800V700H840V740H860V760H840V900Z" fill="#4a3420"/>`))}${rain}`);
      D.flash('#fff', 180);
      D.shake(20, 600);
    });
    D.at(4.95, () => D.flash('#fff', 300));
    // 4. 무덤에서 유령이 되어 웃으며 떠오른다
    D.at(6.2, () => {
      D.sound('ghost');
      D.cut(`
        ${layer(svg(`<defs><radialGradient id="gg"><stop offset="0" stop-color="#eef4ff" stop-opacity=".6"/><stop offset="1" stop-color="#8aa0c8" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="#262c36"/>${trees(30, 760, 160, 100, '#141820', 43)}<path d="M0 900V770H1600V900Z" fill="#0c0e12"/>
          <path d="M700 900V780Q800 740 900 780V900Z" fill="#3a2a1a"/><circle cx="800" cy="480" r="380" fill="url(#gg)"/>`))}
        <div class="an-ghost"><div class="an-ghost-body"><svg viewBox="0 0 100 125" class="an-ghost-face"><ellipse cx="34" cy="46" rx="8" ry="11" fill="#1a1e2a"/><ellipse cx="66" cy="46" rx="8" ry="11" fill="#1a1e2a"/><circle cx="36" cy="42" r="2.5" fill="#fff"/><circle cx="68" cy="42" r="2.5" fill="#fff"/><path d="M30 64Q50 86 70 64Q50 76 30 64Z" fill="#1a1e2a"/><ellipse cx="24" cy="60" rx="7" ry="4" fill="#ffb0c0" opacity=".6"/><ellipse cx="76" cy="60" rx="7" ry="4" fill="#ffb0c0" opacity=".6"/><path d="M40 30q10 -8 20 0" stroke="#8a94a8" stroke-width="3" fill="none"/></svg></div></div>
        ${sfxText('드디어 자유다~!', 'shout ghosty', 'right:5%;top:10%')}
        ${rain}`, 'with-title');
      D.anim('.an-ghost', [{ transform: 'translate(-50%, 60%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 0.92 }], { duration: 2200, easing: 'ease-out' });
      D.anim('.an-ghost-body', [{ transform: 'translateY(0) rotate(-3deg)' }, { transform: 'translateY(-18px) rotate(3deg)' }], { duration: 900, iterations: 10, direction: 'alternate' });
      D.anim('.an-sfx', [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1) rotate(4deg)' }], { duration: 500, delay: 1400 });
    });
  },

  /* 모두 패배 */
  none(D) {
    D.at(0, () => {
      D.sound('start:none');
      let crows = '';
      const r = rnd(5);
      for (let i = 0; i < 12; i++) crows += `<path transform="translate(${f(r() * 300)} ${f(150 + r() * 250)}) scale(${f(3 + r() * 3)})" d="M0 0C-3 -3 -8 -3 -12 0C-9 0 -8 2 -8 3C-6 1 -3 2 -2 3L0 1L2 3C3 2 6 1 8 3C8 2 9 0 12 0C8 -3 3 -3 0 0Z" fill="#000"/>`;
      D.cut(`
        ${layer(svg(`<rect width="1600" height="900" fill="#1a2030"/>${stars(40, 9, 300)}${trees(36, 720, 150, 110, '#10141e', 51)}<path d="M0 900V740H1600V900Z" fill="#080a10"/>${houses(790, false)}`), 'pan-slow')}
        ${layer(svg(`<g class="an-crows">${crows}</g>`))}
        <div class="an-fog thick"></div>`, 'with-title');
      D.anim('.pan-slow', [{ transform: 'scale(1.15) translateX(2%)' }, { transform: 'scale(1.05) translateX(-2%)' }], { duration: 9000 });
      D.anim('.an-crows', [{ transform: 'translateX(-300px)' }, { transform: 'translate(1900px, -200px)' }], { duration: 7000, easing: 'linear' });
    });
  },
};

const TITLES = {
  wolf: ['늑대인간의 승리', 12.9],
  village: ['마을의 승리', 9.2],
  tanner: ['무두장이의 승리', 7.4],
  none: ['아무도 이기지 못했다', 3],
};

/** 초승달처럼 가운데가 두껍고 끝이 뾰족한 할퀸 자국 */
function clawPath(x0, y0, x1, y1, w) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const bend = len * 0.08;
  return `M${x0} ${y0}Q${f(mx + nx * bend)} ${f(my + ny * bend)} ${x1} ${y1}Q${f(mx + nx * (bend + w))} ${f(my + ny * (bend + w))} ${x0} ${y0}Z`;
}
const CLAW = `<svg class="an-claw" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a70"/><stop offset=".5" stop-color="#e01a10"/><stop offset="1" stop-color="#5a0000"/></linearGradient>
  <filter id="cblur"><feGaussianBlur stdDeviation="12"/></filter></defs>
  ${[0, 1, 2, 3].map((i) => `<g class="cl"><path d="${clawPath(360 + i * 200, 20 + i * 30, 960 + i * 180, 880 - i * 20, 80 - Math.abs(i - 1.5) * 14)}" fill="#ff2a10" opacity=".6" filter="url(#cblur)"/><path d="${clawPath(360 + i * 200, 20 + i * 30, 960 + i * 180, 880 - i * 20, 62 - Math.abs(i - 1.5) * 12)}" fill="url(#cg)"/><path d="${clawPath(372 + i * 200, 44 + i * 30, 948 + i * 180, 856 - i * 20, 20)}" fill="#1a0000" opacity=".7"/></g>`).join('')}
</svg>`;

/**
 * 결말 영상을 재생한다. 끝나거나 [건너뛰기]를 누르면 resolve.
 * @param {HTMLElement} host
 * @param {'wolf'|'village'|'tanner'|'none'} kind
 * @param {{sub?:string, sound?:(name:string)=>void}} opts
 */
export function playCutscene(host, kind, { sub = '', sound = () => {} } = {}) {
  const k = SCENES[kind] ? kind : 'none';
  const [title, titleAt] = TITLES[k];
  return playFilm(host, { scene: SCENES[k], length: LENGTH[k], title, titleAt, sub, sound });
}
