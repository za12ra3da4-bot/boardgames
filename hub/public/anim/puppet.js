// 컷아웃 애니메이션 인형 (얼굴 · 옷 · 명암이 다 그려진 캐릭터)
// 부위마다 따로 그린 그림을 관절로 이어 붙이고(순운동학), 매 프레임 각도를 바꿔 움직인다.
// 눈 깜빡임 · 입 모양 · 코트 자락/머리카락 스프링 · 숨쉬기는 자동.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent = null) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
let uid = 0;
const D2R = Math.PI / 180;

/* ═════════ 그림 도구 ═════════ */
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const lighten = (h, k) => toHex(hx(h).map((v) => v + (255 - v) * k));
const darken = (h, k) => toHex(hx(h).map((v) => v * (1 - k)));
const INK = '#120a08';
const fill = (d, c, extra = '') => `<path d="${d}" fill="${c}"${extra}/>`;
const ink = (d, c, w = 3) => `<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, w = 2.4, c = INK, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;

/** 팔다리 조각: 관절에서 +y 로 len 만큼, 굵기 w1→w2 */
function limbPath(len, w1, w2, bulge = 3) {
  const a = w1 / 2;
  const b = w2 / 2;
  return `M${-a} 0C${-a - bulge} ${len * 0.35} ${-b - bulge * 0.4} ${len * 0.75} ${-b} ${len}A${b} ${b * 0.8} 0 0 0 ${b} ${len}C${b + bulge * 0.6} ${len * 0.7} ${a + bulge} ${len * 0.35} ${a} 0A${a} ${a * 0.6} 0 0 0 ${-a} 0Z`;
}
/** 명암 조각 (뒤쪽 절반을 어둡게) */
function limbShade(len, w1, w2) {
  const a = w1 / 2;
  const b = w2 / 2;
  return `M${-a} 0C${-a - 3} ${len * 0.35} ${-b - 1} ${len * 0.75} ${-b} ${len}L${-b * 0.1} ${len}C${-a * 0.2} ${len * 0.6} ${-a * 0.3} ${len * 0.3} ${-a * 0.25} 0Z`;
}

/* ═════════ 캐릭터 모양 정의 ═════════
   look: { skin, hair, coat, coat2(안감), shirt, tie, pants, shoe, hat:'fedora'|'none', hairStyle:'short'|'bob'|'slick', rim, gender }
   좌표: 발바닥 y=0, 머리 꼭대기 약 -370, 오른쪽을 본다. */
export const LOOKS = {
  detective: { skin: '#e2a883', skinD: '#a86a4c', hair: '#1c120e', coat: '#8a6a44', coatD: '#5a4028', coat2: '#6a2a1a', shirt: '#e8e2d4', tie: '#7a1a1e', pants: '#3a3632', pantsD: '#26221e', shoe: '#1e1410', hat: 'fedora', hatC: '#3e342c', hairStyle: 'short', brow: '#1c120e' },
  woman: { skin: '#f0bfa0', skinD: '#b87c5c', hair: '#140c0c', coat: '#3a1a22', coatD: '#22080e', coat2: '#8a1a28', shirt: '#2a0e14', tie: null, pants: '#1a0a0e', pantsD: '#0e0406', shoe: '#0e0606', hat: 'none', hairStyle: 'bob', brow: '#140c0c', lips: '#a8202c' },
  murderer: { skin: '#caa088', skinD: '#8a5a44', hair: '#0e0a0a', coat: '#26262c', coatD: '#141418', coat2: '#4a0a10', shirt: '#101014', tie: '#6a0a10', pants: '#1a1a1e', pantsD: '#0e0e10', shoe: '#0a0808', hat: 'none', hairStyle: 'slick', brow: '#0e0a0a' },
  cop: { skin: '#d8a078', skinD: '#9a6444', hair: '#1a120e', coat: '#2a3452', coatD: '#1a2036', coat2: '#1a2036', shirt: '#c8d0e0', tie: '#1a1a24', pants: '#1e2438', pantsD: '#121626', shoe: '#0a0a0e', hat: 'police', hatC: '#1a2036', hairStyle: 'short', brow: '#1a120e' },
};

/** 부위 목록: [이름, 부모, 관절 x, 관절 y, z순서, 그림 함수(look) ] */
function parts(L, id) {
  const C = `url(#${id}coat)`;
  const CD = `url(#${id}coatD)`;
  const PT = `url(#${id}pants)`;
  const upper = (back) => ink(limbPath(78, 26, 20, 3), back ? CD : C) + (back ? '' : fill(limbShade(78, 26, 20), '#000', ' opacity=".18"'));
  const fore = (back) => ink(limbPath(70, 20, 15, 2), back ? CD : C) + (back ? '' : fill(limbShade(70, 20, 15), '#000', ' opacity=".18"')) + ink('M-9 62 h18 v9 h-18Z', back ? CD : L.coat2, 2.2);
  const handShape = (back) => ink('M-7 0C-9 8 -8 16 -3 22L5 21C9 15 9 7 7 0Z M5 3C11 5 13 10 10 14L6 11Z', back ? L.skinD : `url(#${id}skin)`, 2.4) + (back ? '' : line('M-4 8 L4 8 M-4 13 L3 13', 1, L.skinD, 0.7));
  const thigh = (back) => ink(limbPath(92, 34, 24, 4), back ? L.pantsD : PT) + (back ? '' : fill(limbShade(92, 34, 24), '#000', ' opacity=".2"'));
  const shin = (back) => ink(limbPath(88, 23, 17, 3), back ? L.pantsD : PT) + (back ? '' : fill(limbShade(88, 23, 17), '#000', ' opacity=".2"'));
  const foot = (back) => ink('M-9 -4C-11 4 -10 10 -8 12L30 12C32 6 26 2 16 0L8 -6Z', back ? '#060404' : L.shoe) + line('M-8 12H31', 3, back ? '#000' : '#2a1a14');
  // 몸통 (엉덩이 관절 원점, 위로 -y): 코트
  const torso = ink('M-28 6C-34 -40 -36 -90 -30 -130C-26 -150 -12 -158 6 -158C24 -158 36 -148 38 -128C42 -96 36 -50 30 6Z', C)
    + fill('M14 -156C28 -150 36 -138 38 -120C41 -88 36 -48 31 6L20 6C24 -40 26 -90 14 -156Z', '#000', ' opacity=".2"')
    + (L.tie !== undefined ? ink('M-2 -156L14 -158L20 -120L8 -104Z', L.shirt, 2) : '')
    + (L.tie ? ink('M6 -150L12 -150L14 -112L9 -104L5 -112Z', L.tie, 1.8) : '')
    + ink('M-4 -156L10 -104L-14 -126L-16 -150Z', CD, 2.4)
    + ink('M16 -156L26 -130L12 -104L12 -150Z', CD, 2.4)
    + ink('M-32 -40H36V-30H-32Z', CD, 2.4) + ink('M2 -42h10v14h-10Z', '#b89040', 1.8)
    + line('M-16 -96V-50M18 -94V-48', 1.6, '#000', 0.3)
    + `<circle cx="22" cy="-84" r="2.6" fill="${INK}"/><circle cx="22" cy="-64" r="2.6" fill="${INK}"/>`;
  // 코트 자락 (엉덩이 아래로 흔들리는 두 장)
  const tail = (back) => ink('M-24 0C-28 40 -30 80 -30 104L6 108C8 80 6 40 4 0Z', back ? CD : C) + (back ? '' : line('M-10 10C-12 50 -14 80 -14 100', 1.6, '#000', 0.3));
  const tail2 = (back) => ink('M0 0C2 40 6 80 8 104L34 100C32 72 30 40 30 0Z', back ? CD : C);
  const neck = ink('M-8 0L-7 -22L9 -22L10 0Z', L.skinD, 2.4);
  return [
    ['hips', null, 0, -178, 50, ''],
    ['thighB', 'hips', -4, 0, 10, thigh(true)],
    ['shinB', 'thighB', 0, 88, 11, shin(true)],
    ['footB', 'shinB', 0, 86, 12, foot(true)],
    ['upperB', 'chest', 2, -140, 13, upper(true)],
    ['foreB', 'upperB', 0, 74, 14, fore(true)],
    ['handB', 'foreB', 0, 70, 15, handShape(true)],
    ['tailB', 'hips', -6, 4, 16, tail(true)],
    ['chest', 'hips', 0, 0, 20, torso],
    ['tailF', 'hips', 0, 4, 21, tail2(false)],
    ['thighF', 'hips', 6, 0, 22, thigh(false)],
    ['shinF', 'thighF', 0, 88, 23, shin(false)],
    ['footF', 'shinF', 0, 86, 24, foot(false)],
    ['neck', 'chest', 6, -152, 30, neck],
    ['head', 'neck', 1, -20, 31, ''],
    ['upperF', 'chest', 8, -138, 40, upper(false)],
    ['foreF', 'upperF', 0, 74, 41, fore(false)],
    ['handF', 'foreF', 0, 70, 42, handShape(false)],
  ];
}

/** 머리 (옆얼굴 · 오른쪽 봄): 깜빡이는 눈, 입 모양, 머리카락, 모자. 원점 = 목 위 */
function headSvg(L, id) {
  const S = `url(#${id}skin)`;
  const SD = L.skinD;
  const fem = L.hairStyle === 'bob';
  const face = ink('M-26 -8C-34 -30 -32 -62 -14 -76C2 -88 26 -86 36 -70C42 -60 42 -52 40 -44L50 -34L42 -30C44 -24 42 -20 38 -18C40 -14 38 -8 32 -6C28 2 18 6 6 6C-10 6 -20 2 -26 -8Z', S)
    + fill('M-26 -8C-34 -30 -32 -62 -14 -76C-6 -80 2 -80 8 -78C-10 -70 -18 -50 -14 -28C-12 -14 -6 -2 6 6C-10 6 -20 2 -26 -8Z', SD, ' opacity=".5"')
    + fill('M40 -44L50 -34L42 -30C40 -32 38 -36 40 -44Z', SD, ' opacity=".6"')
    + line('M6 -4C16 -2 26 -6 32 -8', 1.6, SD, 0.8)
    + `<ellipse cx="22" cy="-30" rx="9" ry="5" fill="${fem ? '#e87a7a' : SD}" opacity="${fem ? 0.35 : 0.25}"/>`
    + ink('M-10 -46C-20 -48 -22 -34 -12 -30', SD, 2.2) + line('M-14 -42C-16 -38 -14 -36 -12 -35', 1.2, '#7a4030', 0.8);
  const lashes = fem ? line('M20 -53l-4 -3M24 -55l-2 -4M36 -53l4 -3', 1.6) : '';
  const eye = `<g id="${id}eye"><path d="M20 -52C24 -57 32 -57 37 -52C32 -47 24 -47 20 -52Z" fill="#f4eee4" stroke="${INK}" stroke-width="1.8"/><circle cx="31" cy="-52" r="3.4" fill="${fem ? '#3a1a10' : '#1a0e0a'}"/><circle cx="32.2" cy="-53.6" r="1.1" fill="#fff"/>${lashes}${line('M19 -53C24 -58 32 -58 38 -53', 2.4)}</g>
    <g id="${id}lid" opacity="0"><path d="M19 -52C24 -49 32 -49 38 -52" stroke="${INK}" stroke-width="2.6" fill="none"/>${fem ? line('M22 -50l-3 3M34 -50l3 3', 1.4) : ''}</g>`;
  const brow = `<path id="${id}brow" d="M16 -60C24 -64 32 -64 38 -60" stroke="${L.brow}" stroke-width="${fem ? 3 : 4.4}" fill="none" stroke-linecap="round"/>`;
  const mouth = `<path id="${id}mouth" d="M28 -20C32 -19 36 -20 38 -22" stroke="${L.lips || '#5a2018'}" stroke-width="2.6" fill="${L.lips ? L.lips : 'none'}" fill-opacity=".6" stroke-linecap="round"/>`;
  let hair = '';
  let hairBack = '';
  if (L.hairStyle === 'short') hair = ink('M-30 -40C-38 -66 -24 -88 0 -90C20 -92 36 -84 40 -70C30 -76 16 -76 8 -72C-4 -66 -10 -54 -12 -40C-18 -34 -24 -34 -30 -40Z', L.hair, 2.4) + line('M-22 -64C-10 -80 10 -84 30 -78', 1.4, '#5a4a40', 0.6);
  if (L.hairStyle === 'slick') hair = ink('M-30 -36C-40 -66 -22 -90 4 -90C24 -90 40 -80 42 -66C30 -74 14 -74 0 -70C-12 -64 -16 -52 -18 -38C-22 -32 -26 -32 -30 -36Z', L.hair, 2.4) + line('M-20 -70C-4 -82 16 -84 34 -76M-24 -58C-10 -72 10 -76 30 -72', 1.4, '#6a6a7a', 0.6);
  if (fem) {
    hairBack = `<path d="M-38 -44C-46 -78 -22 -100 8 -98C32 -96 44 -84 44 -66L38 -62C30 -76 16 -80 2 -78C-12 -74 -18 -60 -18 -40L-14 -2C-28 0 -38 -14 -38 -44Z" fill="${L.hair}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-30 -60C-34 -40 -30 -20 -22 -6" stroke="#4a3a4a" stroke-width="1.4" fill="none" opacity=".7"/>`;
    hair = ink('M-10 -84C8 -96 34 -90 44 -68C40 -60 38 -56 36 -58C34 -66 26 -70 18 -70C14 -62 8 -58 0 -56C2 -66 -2 -76 -10 -84Z', L.hair, 2.2)
      + line('M0 -86C16 -90 30 -84 40 -72M-4 -76C8 -80 20 -78 28 -72', 1.4, '#5a4a5a', 0.6);
  }
  let hat = '';
  if (L.hat === 'fedora') {
    hat = ink('M-46 -70C-20 -64 30 -64 60 -72C54 -62 40 -58 20 -58C-6 -58 -30 -60 -46 -70Z', L.hatC)
      + ink('M-26 -68C-30 -90 -18 -110 6 -112C18 -104 28 -110 34 -104C42 -94 40 -80 38 -68C16 -64 -8 -64 -26 -68Z', L.hatC)
      + ink('M-26 -76C-6 -72 16 -72 38 -76L38 -68C16 -64 -8 -64 -26 -68Z', '#1a1210', 2)
      + line('M4 -110C8 -100 10 -92 8 -84', 2, '#000', 0.4) + fill('M-46 -70C-20 -64 30 -64 60 -72C40 -60 0 -58 -46 -70Z', '#000', ' opacity=".25"');
  }
  if (L.hat === 'police') {
    hat = ink('M-30 -74C-30 -96 -8 -104 14 -102C34 -100 44 -92 44 -80L42 -72C20 -68 -10 -68 -30 -74Z', L.hatC) + ink('M20 -74C36 -74 50 -70 56 -64C44 -62 30 -64 20 -66Z', '#0a0a10') + `<circle cx="12" cy="-86" r="5" fill="#d8b040" stroke="${INK}" stroke-width="1.4"/>`;
  }
  return `<g class="pp-hairBack">${hairBack}</g><g transform="scale(1.12) translate(0 2)">${face}${eye}${brow}${mouth}${hair}${hat}</g>`;
}

/* ═════════ 인형 ═════════ */
export class Puppet {
  /**
   * @param {SVGElement|HTMLElement} parent  1600×900 좌표 무대
   * @param {object} o { look, x, y, scale, flip, rim(가장자리 빛 색), rim2 }
   */
  constructor(parent, { look = 'detective', x = 800, y = 800, scale = 1, flip = false, rim = '#46f2e4', rimSide = 1, shadow = true } = {}) {
    this.id = `pp${++uid}`;
    this.L = typeof look === 'string' ? LOOKS[look] : look;
    this.world = { x, y, scale, flip, rot: 0 };
    const svg = el('svg', { viewBox: '-400 -520 800 620', width: 800, height: 620, class: 'pp', overflow: 'visible' }, parent);
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;transform-origin:0 0;';
    this.svg = svg;
    const defs = el('defs', {}, svg);
    // 가장자리 빛(림 라이트): 네온이 몸 윤곽을 따라 번진다
    defs.innerHTML = `<filter id="${this.id}R" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/>
      <feFlood flood-color="${rim}"/><feComposite in2="d" operator="in" result="edge"/>
      <feOffset in="edge" dx="${3 * rimSide}" dy="-1" result="eo"/><feComposite in="eo" in2="SourceAlpha" operator="out" result="rimOnly"/>
      <feGaussianBlur in="rimOnly" stdDeviation="5" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/><feMergeNode in="rimOnly"/></feMerge></filter>
      <linearGradient id="${this.id}coat" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(this.L.coat, 0.22)}"/><stop offset=".55" stop-color="${this.L.coat}"/><stop offset="1" stop-color="${this.L.coatD}"/></linearGradient>
      <linearGradient id="${this.id}coatD" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${this.L.coatD}"/><stop offset="1" stop-color="${darken(this.L.coatD, 0.35)}"/></linearGradient>
      <linearGradient id="${this.id}pants" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(this.L.pants, 0.18)}"/><stop offset="1" stop-color="${this.L.pantsD}"/></linearGradient>
      <linearGradient id="${this.id}skin" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(this.L.skin, 0.12)}"/><stop offset=".6" stop-color="${this.L.skin}"/><stop offset="1" stop-color="${this.L.skinD}"/></linearGradient>`;
    if (shadow) this.shadow = el('ellipse', { cx: 0, cy: 0, rx: 70, ry: 12, fill: '#000', opacity: 0.35 }, svg);
    this.root = el('g', { filter: `url(#${this.id}R)` }, svg);
    this.defs = {};
    this.g = {};
    this.ang = {};
    this.off = {};
    const list = parts(this.L, this.id).sort((a, b) => a[4] - b[4]);
    for (const [name, parent2, px, py, , art] of list) {
      this.defs[name] = { parent: parent2, px, py };
      const g = el('g', {}, this.root);
      g.innerHTML = name === 'head' ? headSvg(this.L, this.id) : art;
      this.g[name] = g;
      this.ang[name] = 0;
    }
    this.order = list.map((p) => p[0]);
    // 자동 움직임 상태
    this.spring = { tailF: { a: 0, v: 0 }, tailB: { a: 0, v: 0 }, hair: { a: 0, v: 0 } };
    this.lastHip = null;
    this.blinkAt = 1 + Math.random() * 2;
    this.talking = false;
    this.mouthShape = 'closed';
    this.t = 0;
    this.apply();
  }

  /** 관절 각도 · 위치 한꺼번에 */
  set(p) {
    for (const [k, v] of Object.entries(p)) {
      if (k in this.ang) this.ang[k] = v;
      else if (k in this.world) this.world[k] = v;
      else if (k === 'hipY') this.off.hipY = v;
      else if (k === 'hipX') this.off.hipX = v;
    }
  }

  mouth(shape) {
    this.mouthShape = shape;
    const m = { closed: 'M28 -20C32 -19 36 -20 38 -22', open: 'M28 -21C31 -24 36 -24 38 -22C37 -16 30 -15 28 -21Z', smirk: 'M26 -19C31 -18 35 -21 39 -26', grit: 'M27 -22H38M28 -18H37', shout: 'M27 -24C31 -28 38 -27 40 -22C39 -12 29 -12 27 -24Z' }[shape];
    const e = this.svg.querySelector(`#${this.id}mouth`);
    if (e && m) e.setAttribute('d', m);
  }
  brow(kind) {
    const d = { calm: 'M16 -60C24 -64 32 -64 38 -60', angry: 'M16 -64C24 -62 32 -58 38 -56', up: 'M16 -64C24 -68 32 -68 38 -63', sly: 'M16 -58C24 -60 32 -66 38 -66' }[kind];
    const e = this.svg.querySelector(`#${this.id}brow`);
    if (e && d) e.setAttribute('d', d);
  }

  /** 매 프레임: 시간 dt 만큼 자동 움직임 (깜빡임 · 숨 · 스프링 · 말하기) 후 그리기 */
  update(dt) {
    this.t += dt;
    // 깜빡임
    this.blinkAt -= dt;
    const lid = this.svg.querySelector(`#${this.id}lid`);
    const eye = this.svg.querySelector(`#${this.id}eye`);
    const closed = this.blinkAt < 0 && this.blinkAt > -0.12;
    if (this.blinkAt < -0.12) this.blinkAt = 2 + Math.random() * 3;
    if (lid) lid.setAttribute('opacity', closed || this.eyesShut ? 1 : 0);
    if (eye) eye.setAttribute('opacity', closed || this.eyesShut ? 0 : 1);
    // 말하기: 입을 여닫는다
    if (this.talking) this.mouth(Math.sin(this.t * 22) > 0.2 ? 'open' : 'closed');
    // 스프링: 몸이 움직이면 코트 자락 · 머리카락이 늦게 따라온다
    const hx = this.world.x;
    const vx = this.lastHip == null ? 0 : (hx - this.lastHip) / Math.max(dt, 0.001);
    this.lastHip = hx;
    const drive = -vx * 0.045 * (this.world.flip ? -1 : 1) + (this.ang.chest || 0) * 0.5;
    for (const [k, s] of Object.entries(this.spring)) {
      const target = k === 'hair' ? drive * 0.6 : drive + Math.sin(this.t * 1.7 + (k === 'tailB' ? 1 : 0)) * 1.4;
      s.v += ((target - s.a) * 60 - s.v * 9) * dt;
      s.a += s.v * dt;
    }
    this.apply();
  }

  /** 순운동학: 부모 → 자식 순서로 누적 변환 */
  apply() {
    const W = {};
    const breathe = Math.sin(this.t * 2.2) * 1.2;
    const extra = { tailF: this.spring.tailF.a, tailB: this.spring.tailB.a, chest: breathe * 0.3 };
    const order = ['hips', 'chest', 'neck', 'head', 'thighB', 'shinB', 'footB', 'thighF', 'shinF', 'footF', 'upperB', 'foreB', 'handB', 'upperF', 'foreF', 'handF', 'tailB', 'tailF'];
    for (const name of order) {
      const d = this.defs[name];
      if (!d) continue;
      const a = ((this.ang[name] || 0) + (extra[name] || 0)) * D2R;
      let x;
      let y;
      let r;
      if (!d.parent) {
        x = d.px + (this.off.hipX || 0);
        y = d.py + (this.off.hipY || 0) + breathe * 0.5;
        r = a;
      } else {
        const P = W[d.parent];
        x = P.x + d.px * Math.cos(P.r) - d.py * Math.sin(P.r);
        y = P.y + d.px * Math.sin(P.r) + d.py * Math.cos(P.r);
        r = P.r + a;
      }
      W[name] = { x, y, r };
      this.g[name].setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(r / D2R).toFixed(2)})`);
    }
    // 단발머리 뒷부분 흔들림
    const hb = this.svg.querySelector('.pp-hairBack');
    if (hb) hb.setAttribute('transform', `scale(1.12) rotate(${(this.spring.hair.a * 0.6).toFixed(2)} 0 -60)`);
    const w = this.world;
    this.svg.style.transform = `translate(${w.x - 400}px, ${w.y - 520}px) rotate(${w.rot}deg) scale(${w.flip ? -w.scale : w.scale}, ${w.scale})`;
    this.svg.style.transformOrigin = '400px 520px';
    if (this.shadow) this.shadow.setAttribute('rx', 70 - Math.abs(this.off.hipY || 0) * 0.3);
  }

  remove() { this.svg.remove(); }
}

/* ═════════ 동작 ═════════ */
export const POSE = {
  stand: { chest: 2, neck: -2, head: 0, thighF: -4, shinF: 3, footF: 0, thighB: 5, shinB: 2, footB: 0, upperF: 8, foreF: -12, handF: 0, upperB: -6, foreB: -14, handB: 0 },
  pockets: { upperF: 6, foreF: -44, handF: -6, upperB: 4, foreB: -40, handB: -6 },
  point: { upperF: -82, foreF: -6, handF: -4, chest: -2, head: -4 },
  chinHand: { upperF: -28, foreF: -128, handF: -24, upperB: -34, foreB: -92, handB: -10, head: 4 },
  crouch: { hipY: 74, chest: 30, neck: 10, head: 14, thighF: -96, shinF: 120, footF: -24, thighB: -60, shinB: 128, footB: -60, upperF: -40, foreF: -30, upperB: 10, foreB: -40 },
  lookDown: { neck: 12, head: 18 },
  armsUp: { upperF: -170, foreF: -10, upperB: -160, foreB: -10 },
  cuffed: { upperF: 30, foreF: 20, upperB: 36, foreB: 26, chest: 16, neck: 14, head: 16 },
};

/** 걷기 · 뛰기 한 주기 (ph 0~1). 발이 땅을 딛고 몸이 오르내린다 */
export function gait(ph, run = false) {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  const k = run ? 1.6 : 1;
  return {
    hipY: -Math.abs(c) * (run ? 12 : 5),
    chest: run ? 16 : 3,
    neck: run ? -8 : -1,
    head: run ? -6 : 0,
    thighF: s * 26 * k,
    shinF: Math.max(0, -s) * 40 * k + (run ? 20 : 4),
    footF: -Math.max(0, -s) * 16,
    thighB: -s * 26 * k,
    shinB: Math.max(0, s) * 40 * k + (run ? 20 : 4),
    footB: -Math.max(0, s) * 16,
    upperF: -s * 22 * k + (run ? -20 : 4),
    foreF: run ? -80 : -18,
    upperB: s * 22 * k + (run ? -10 : -4),
    foreB: run ? -80 : -18,
  };
}

/** 두 포즈 사이 보간 */
export function mixPose(a, b, t) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b)) o[k] = (a[k] ?? 0) + (v - (a[k] ?? 0)) * t;
  return o;
}
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
};
