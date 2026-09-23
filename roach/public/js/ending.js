// 바퀴벌레 포커 결말 영상: 지하 도박장에서 마지막 한 장이 뒤집히고, 벌레 떼가 패자를 덮친다
import { svg, playFilm } from '/anim/director.js';
import { POSE, mixPose, ease } from '/anim/puppet.js';
import { stage, camPath, say, cast, CINE_CSS } from '/anim/cine.js';

/** SVG 안에 끼워 넣을 카드 (크기 고정) */
const cardFixed = (html) => html.replace('<svg viewBox="0 0 300 420"', '<svg width="300" height="420" viewBox="0 0 300 420"');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** shared/roach.js · js/cards.js 가 아직 안 실려 있으면 실어 온다 (허브에서 바로 틀 때) */
function need(src, glob) {
  if (window[glob]) return Promise.resolve();
  return new Promise((res) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); });
}

const STYLE = `<style>
.rk-bulb{transform-origin:800px 0}
.rk-card{position:absolute;width:150px;filter:drop-shadow(0 10px 18px rgba(0,0,0,.6))}
.rk-stamp{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%) rotate(-11deg);font-family:'Black Han Sans',sans-serif;
  font-size:88px;color:#ff6a4a;border:9px solid #ff6a4a;border-radius:18px;padding:6px 34px;text-shadow:0 0 26px rgba(255,90,60,.6);opacity:0}
.rk-word{position:absolute;left:50%;top:18%;transform:translateX(-50%);font-family:'Black Han Sans',sans-serif;font-size:52px;color:#ffe08a;
  text-shadow:0 4px 0 #2a1006, 0 0 30px rgba(255,180,60,.5);white-space:nowrap;opacity:0}
</style>`;

/* ── 무대: 눅눅한 지하 도박장 */
function basement({ lit = 1 } = {}) {
  let bricks = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 17; c++) {
      const x = c * 100 + (r % 2 ? -50 : 0);
      bricks += `<rect x="${x}" y="${r * 62}" width="94" height="56" rx="4" fill="${(r * 7 + c * 3) % 5 ? '#3a2a22' : '#44322a'}" opacity=".9"/>`;
    }
  }
  let boxes = '';
  for (let i = 0; i < 5; i++) boxes += `<rect x="${60 + i * 46}" y="${470 + (i % 2) * 34}" width="86" height="64" rx="6" fill="#4a3420" stroke="#241608" stroke-width="5"/>`;
  return `<rect width="1600" height="900" fill="#241812"/>${bricks}
    <rect y="560" width="1600" height="340" fill="#2a1c14"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 130} 560 V900" stroke="#1c120c" stroke-width="4"/>`).join('')}
    <path d="M0 556 H1600" stroke="#150e08" stroke-width="10"/>
    ${boxes}
    <g opacity=".5"><path d="M0 70 H1600" stroke="#4a3a2a" stroke-width="16"/><path d="M0 92 H1600" stroke="#2a1e14" stroke-width="7"/></g>
    <ellipse cx="800" cy="600" rx="700" ry="240" fill="#f0c060" opacity="${0.1 * lit}"/>`;
}
const bulb = (on = 1) => `<g class="rk-bulb"><path d="M800 0 V210" stroke="#1a1008" stroke-width="5"/>
  <path d="M760 214 h80 l-12 26 h-56Z" fill="#6a5a44" stroke="#1a1008" stroke-width="4"/>
  <circle cx="800" cy="266" r="30" fill="${on ? '#fff0b0' : '#4a4436'}" stroke="#1a1008" stroke-width="4"/>
  ${on ? '<circle cx="800" cy="266" r="120" fill="#ffe08a" opacity=".22"/><path d="M700 266 L560 900 H1040 L900 266Z" fill="#ffe08a" opacity=".1"/>' : ''}</g>`;
/** 앞쪽 탁자 (앉은 사람의 아랫몸을 가린다) */
const tableFg = `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
  <ellipse cx="800" cy="742" rx="620" ry="150" fill="#123a28" stroke="#0a2318" stroke-width="10"/>
  <ellipse cx="800" cy="726" rx="596" ry="136" fill="#1a5238"/>
  <ellipse cx="800" cy="726" rx="520" ry="112" fill="none" stroke="#2a7a52" stroke-width="5" opacity=".7"/>
  <path d="M180 742 Q800 950 1420 742 L1420 800 Q800 1010 180 800Z" fill="#3a2414" stroke="#1a0e06" stroke-width="8"/>
  <rect x="740" y="860" width="120" height="60" fill="#3a2414"/></svg>`;

/* ── 작은 바퀴 한 마리: 카드에 나오는 그 만화 바퀴 (징그럽지 않게) */
function roachDot(size) {
  return `<svg width="${size}" height="${size}" viewBox="-30 -30 260 260" style="position:absolute;left:0;top:0">
    ${window.RCARD.ART.roach(window.ROACH.KIND.roach)}</svg>`;
}

function scene(D, extra = '') {
  D.add(STYLE + CINE_CSS + extra);
  const shot = D.root();
  return { S: stage(shot), shot };
}

/* ── ① 지하 도박장 와이드: 전구가 흔들리고 셋이 카드를 쥐고 있다 */
function tableShot(D, t0, names) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.35, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px">${basement()}</svg>`);
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible">${bulb()}</svg>`);
    const C = cast(L.el);
    const looks = ['murderer', 'woman', 'detective'];
    const xs = [420, 800, 1190];
    const ps = xs.map((x, i) => C.add({ look: looks[i], x, y: 806, scale: 1.16, rim: '#ffd88a', flip: i === 2, rimSide: i === 2 ? -1 : 1 }));
    L.el.insertAdjacentHTML('beforeend', tableFg);
    // 손에 든 카드 (탁자 위)
    L.el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 1600 900" style="position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;overflow:visible">
      ${xs.map((x, i) => `<g transform="translate(${x + (i === 2 ? -70 : 70)} 700) rotate(${i === 2 ? 12 : -12}) scale(.34)">
        ${[0, 1, 2].map((k) => `<g transform="translate(${k * 62} ${-k * 8}) rotate(${(k - 1) * 9})">${cardFixed(window.RCARD.backSvg())}</g>`).join('')}</g>`).join('')}</svg>`);
    const swing = shot.querySelector('.rk-bulb');
    const cam = camPath(S.cam, [[0, { x: 800, y: 470, z: 0.92 }], [4.6, { x: 800, y: 520, z: 1.06 }]]);
    let last = 0;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      if (swing) swing.style.transform = `rotate(${Math.sin(s * 1.5) * 3.2}deg)`;
      ps.forEach((p, i) => {
        p.set({ ...POSE.stand, ...POSE.sit, chest: -2 + Math.sin(s * 1.2 + i) * 1.5, neck: 2, head: [6, 0, -6][i],
          upperF: -52, foreF: -86, upperB: -46, foreB: -80, y: 806, flip: i === 2 });
      });
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, '', '그 판의 마지막 한 장이, 엎어진 채 밀려왔다.', 2.6, '#ffd88a'), 500);
  });
}

/* ── ② 클로즈업: "이건 OO야" → 뒤집으니 바퀴벌레 */
function flipShot(D, t0, { liar, victim, claim }) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.35, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px">${basement({ lit: 1.3 })}</svg>`);
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible">${bulb()}</svg>`);
    const C = cast(L.el);
    const a = C.add({ look: 'murderer', x: 430, y: 820, scale: 1.3, rim: '#ffd88a' });
    const b = C.add({ look: 'woman', x: 1170, y: 820, scale: 1.3, rim: '#ffd88a', flip: true, rimSide: -1 });
    a.brow('angry');
    L.el.insertAdjacentHTML('beforeend', tableFg);
    const card = document.createElement('div');
    card.className = 'rk-card';
    card.style.cssText += 'left:0;top:0;transform-origin:50% 50%';
    card.innerHTML = window.RCARD.backSvg();
    shot.appendChild(card);
    const stamp = document.createElement('div');
    stamp.className = 'rk-stamp';
    stamp.textContent = '거짓말!';
    shot.appendChild(stamp);
    const cam = camPath(S.cam, [[0, { x: 800, y: 560, z: 1.15 }], [2.6, { x: 860, y: 610, z: 1.35 }], [4.4, { x: 800, y: 600, z: 1.2 }]]);
    let last = 0;
    let flipped = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      // 거짓말쟁이가 카드를 밀어 놓는다 → 상대가 잡아 뒤집는다
      const push = Math.max(0, Math.min(1, (s - 0.6) / 1.1));
      const x = 560 + push * 360;
      const y = 660 - Math.sin(push * Math.PI) * 26;
      card.style.transform = `translate(${x}px, ${y}px) rotate(${-8 + push * 10}deg) scale(${s > 2.9 ? 1.3 : 1})`;
      if (s > 2.9 && !flipped) {
        flipped = true;
        D.sound('flip');
        card.animate([{ transform: `translate(${x}px, ${y}px) rotateY(0deg) scale(1)` },
          { transform: `translate(${x - 40}px, ${y - 90}px) rotateY(90deg) scale(1.35)`, offset: 0.5 },
          { transform: `translate(${x - 40}px, ${y - 90}px) rotateY(180deg) scale(1.35)` }], { duration: 520, fill: 'forwards', easing: 'ease-in-out' });
        setTimeout(() => { card.innerHTML = window.RCARD.cardSvg('roach0'); card.style.transform = `translate(${x - 40}px, ${y - 90}px) scale(1.35)`; }, 270);
        setTimeout(() => {
          stamp.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-11deg) scale(2.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-11deg) scale(1)' }], { duration: 300, fill: 'forwards', easing: 'cubic-bezier(.3,1.7,.5,1)' });
          D.shake(12, 300);
          D.sound('impact');
        }, 620);
      }
      a.set({ ...POSE.stand, ...POSE.sit, chest: 4, neck: -4, head: -4,
        upperF: -70 + push * 26, foreF: -70 - push * 20, upperB: -40, foreB: -74, flip: false });
      b.set({ ...POSE.stand, ...POSE.sit, chest: s > 3.1 ? -14 : -2, neck: s > 3.1 ? -10 : 2, head: s > 3.1 ? -16 : 0,
        upperF: s > 2.9 ? -96 : -52, foreF: s > 2.9 ? -40 : -84, upperB: -46, foreB: -80, flip: true });
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, esc(liar), `“이건 ${esc(claim)}야.”`, 2.2, '#ffd88a'), 300);
    setTimeout(() => say(shot, esc(victim), '“…아니야, 그거 바퀴벌레잖아!”', 2.2, '#ff9a7a'), 3400);
  });
}

/* ── ③ 벌레 떼가 패자를 덮친다 */
function swarmShot(D, t0, loser) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.35, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px">${basement({ lit: 0.8 })}</svg>`);
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible">${bulb()}</svg>`);
    const C = cast(L.el);
    const p = C.add({ look: 'woman', x: 800, y: 830, scale: 1.34, rim: '#ffd88a' });
    L.el.insertAdjacentHTML('beforeend', tableFg);
    // 앞에 깔리는 바퀴벌레 카드 4장
    const pile = document.createElement('div');
    pile.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    shot.appendChild(pile);
    const swarm = document.createElement('div');
    swarm.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    shot.appendChild(swarm);
    const word = document.createElement('div');
    word.className = 'rk-word';
    word.textContent = '바퀴벌레 4장!';
    shot.appendChild(word);
    const cam = camPath(S.cam, [[0, { x: 800, y: 600, z: 1.25 }], [2.2, { x: 800, y: 560, z: 1.1 }], [5.2, { x: 800, y: 520, z: 1.0 }]]);
    const cards = [];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div');
      el.className = 'rk-card';
      el.style.cssText += `left:${480 + i * 130}px;top:740px;opacity:0;width:130px`;
      el.innerHTML = window.RCARD.cardSvg('roach0');
      pile.appendChild(el);
      cards.push(el);
    }
    let last = 0;
    const once = {};
    const at = (k, fn) => { if (!once[k]) { once[k] = 1; fn(); } };
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      for (let i = 0; i < 4; i++) {
        if (s > 0.4 + i * 0.42) {
          at(`c${i}`, () => {
            cards[i].style.opacity = '1';
            cards[i].animate([{ transform: 'translateY(-260px) rotate(-30deg) scale(1.5)' }, { transform: `rotate(${(i - 1.5) * 5}deg)` }], { duration: 260, fill: 'forwards', easing: 'cubic-bezier(.3,1.4,.5,1)' });
            D.shake(i === 3 ? 14 : 6, 240);
            D.sound(i === 3 ? 'impact' : 'card');
          });
        }
      }
      if (s > 2.1) at('word', () => word.animate([{ opacity: 0, transform: 'translateX(-50%) scale(2)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)' }], { duration: 340, fill: 'forwards' }));
      // 사방에서 바퀴가 기어와 패자를 덮는다
      if (s > 2.4) {
        at('swarm', () => {
          for (let i = 0; i < 20; i++) {
            const d = document.createElement('div');
            const size = 40 + Math.random() * 46;
            d.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px`;
            d.innerHTML = roachDot(size);
            swarm.appendChild(d);
            const fromLeft = Math.random() < 0.5;
            const sx = fromLeft ? -80 - Math.random() * 300 : 1680 + Math.random() * 300;
            const sy = 560 + Math.random() * 420;
            const tx = 380 + Math.random() * 880;
            const ty = 600 + Math.random() * 250;
            d.animate([
              { transform: `translate(${sx}px, ${sy}px) rotate(${fromLeft ? 90 : -90}deg)`, opacity: 1 },
              { transform: `translate(${(sx + tx) / 2}px, ${sy - 40 + Math.random() * 80}px) rotate(${fromLeft ? 70 : -70}deg)`, offset: 0.55, opacity: 1 },
              { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 1 },
            ], { duration: 1500 + Math.random() * 1400, delay: Math.random() * 900, fill: 'forwards', easing: 'ease-in' });
          }
          D.sound('tension');
        });
      }
      // 발버둥 → 파묻힘
      const panic = Math.max(0, Math.min(1, (s - 2.6) / 1.6));
      p.set({ ...POSE.stand, ...POSE.sit,
        chest: -6 - panic * 10, neck: -6, head: -8 + Math.sin(s * 16) * 6 * panic,
        upperF: -60 - Math.sin(s * 13) * 60 * panic, foreF: -70 + Math.cos(s * 15) * 50 * panic,
        upperB: -56 + Math.sin(s * 14) * 60 * panic, foreB: -70 - Math.cos(s * 12) * 50 * panic, y: 830 });
      if (s > 5.0) at('dark', () => { D.flash('#000000', 900); D.sound('impact'); });
      C.update(dt);
      S.render(s);
    });
    setTimeout(() => say(shot, esc(loser), '“…내가 졌다.”', 2.2, '#ff9a7a'), 3600);
  });
}

/* ── ④ 결과 도장 */
function endShot(D, t0, { loser, winners }) {
  D.at(t0, () => {
    D.cut('');
    const { S, shot } = scene(D);
    S.layer(0.35, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px">${basement({ lit: 1.4 })}</svg>`);
    const L = S.layer(1, `<svg viewBox="0 0 1600 900" style="position:absolute;inset:0;width:1600px;height:900px;overflow:visible">${bulb()}</svg>`);
    const C = cast(L.el);
    const a = C.add({ look: 'murderer', x: 480, y: 810, scale: 1.2, rim: '#ffd88a' });
    const b = C.add({ look: 'detective', x: 1120, y: 810, scale: 1.2, rim: '#ffd88a', flip: true, rimSide: -1 });
    L.el.insertAdjacentHTML('beforeend', tableFg);
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);text-align:center;font-family:"Black Han Sans",sans-serif;opacity:0';
    box.innerHTML = `<div style="font-size:74px;color:#ff7a5a;text-shadow:0 5px 0 #2a0c06,0 0 30px rgba(255,90,60,.45)">${esc(loser)} 패배</div>
      <div style="font-size:30px;color:#ffe08a;margin-top:10px;font-family:'Noto Sans KR',sans-serif;font-weight:900">${esc(winners)} 승리!</div>`;
    shot.appendChild(box);
    const cam = camPath(S.cam, [[0, { x: 800, y: 560, z: 1.12 }], [3.4, { x: 800, y: 540, z: 1.02 }]]);
    let last = 0;
    let shown = false;
    D.tick((s) => {
      const dt = s - last;
      last = s;
      cam(s);
      const cheer = Math.max(0, Math.min(1, (s - 0.5) / 0.5));
      [a, b].forEach((p, i) => {
        p.set({ ...POSE.stand, ...POSE.sit,
          chest: -4, neck: -2, head: -4 + Math.sin(s * 6 + i * 2) * 4,
          upperF: mixPose({ v: -50 }, { v: -160 }, cheer).v + Math.sin(s * 7 + i) * 8,
          foreF: -30, upperB: -50 - cheer * 90, foreB: -30, flip: i === 1 });
      });
      if (s > 0.8 && !shown) {
        shown = true;
        box.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(2.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 420, fill: 'forwards', easing: 'cubic-bezier(.3,1.6,.5,1)' });
        D.shake(10, 300);
        D.sound('cheer');
      }
      C.update(dt);
      S.render(s);
    });
  });
}

/**
 * 결말 영상을 튼다.
 * @param {HTMLElement} host
 * @param {{loser?:string, winners?:string, claim?:string, liar?:string, sound?:Function}} o
 */
export async function playEnding(host, o = {}) {
  await Promise.all([need('/roach/shared/roach.js', 'ROACH'), need('/roach/js/cards.js', 'RCARD')]);
  const loser = o.loser || '패자';
  const winners = o.winners || '나머지 모두';
  const claim = o.claim || '파리';
  const liar = o.liar || '맞은편 타짜';
  const S0 = o.sound;
  const MAP = { flip: 'flip', impact: 'boom', card: 'card', tension: 'tick', cheer: 'win' };
  const sound = typeof S0 === 'function' ? S0
    : S0 ? (k) => { const fn = S0[MAP[k] || k]; if (fn) fn.call(S0); } : () => {};
  return playFilm(host, {
    scene: (D) => {
      tableShot(D, 0, []);
      flipShot(D, 5.0, { liar, victim: loser, claim });
      swarmShot(D, 10.4, loser);
      endShot(D, 16.2, { loser, winners });
    },
    length: 20.4,
    title: '바퀴벌레 포커',
    titleAt: 16.4,
    sub: `${loser} 패배`,
    sound,
  });
}

export const _shots = { tableShot, flipShot, swarmShot, endShot };
