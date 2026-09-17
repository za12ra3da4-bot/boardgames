// 2D 뼈대 인형 (관절마다 따로 돌아가는 SVG 캐릭터) + 동작 보간
const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

/** 관절에서 +y 방향으로 뻗는 가늘어지는 팔다리 조각 */
export function limb(len, w1, w2, bulge = 4) {
  const a = w1 / 2;
  const b = w2 / 2;
  return `M${-a} 0Q${-a - bulge} ${len * 0.45} ${-b} ${len}A${b} ${b} 0 0 0 ${b} ${len}Q${a + bulge} ${len * 0.45} ${a} 0A${a} ${a} 0 0 0 ${-a} 0Z`;
}

/** 털 삐죽 (조각 옆면) */
function tufts(len, side, n, size) {
  let d = '';
  for (let i = 1; i <= n; i++) {
    const y = (len * i) / (n + 1);
    d += `M${side * 6} ${y - size * 0.6}L${side * (6 + size)} ${y + size * 0.3}L${side * 4} ${y + size * 0.4}Z`;
  }
  return d;
}

/** 갈퀴 손/발 (+y 방향) */
function claws(w, len, n = 4) {
  let d = `M${-w / 2} 0C${-w / 2 - 4} ${len * 0.3} ${-w / 2} ${len * 0.5} ${-w / 3} ${len * 0.5}H${w / 3}C${w / 2} ${len * 0.5} ${w / 2 + 4} ${len * 0.3} ${w / 2} 0Z`;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / n;
    d += `M${x - 3} ${len * 0.45}Q${x - 2} ${len * 0.9} ${x + 5} ${len * 1.25}Q${x + 1} ${len * 0.85} ${x + 3} ${len * 0.45}Z`;
  }
  return d;
}

/* ═════════ 뼈대 정의 ═════════
   노드: { name, x, y (부모 기준 관절 위치), shapes:[{d, fill?, stroke?, cls?}], children, z(앞뒤) } */

function wolfDef() {
  const fur = 'url(#FUR)';
  const furDark = 'url(#FURD)';
  const arm = (side) => ({
    name: `${side}Upper`, x: side === 'f' ? 34 : -10, y: -140, shapes: [{ d: limb(78, 34, 24, 6), fill: side === 'f' ? fur : furDark }, { d: tufts(78, -1, 3, 10), fill: side === 'f' ? fur : furDark }],
    children: [{
      name: `${side}Fore`, x: 0, y: 74, shapes: [{ d: limb(72, 24, 16, 3), fill: side === 'f' ? fur : furDark }, { d: tufts(72, 1, 2, 9), fill: side === 'f' ? fur : furDark }],
      children: [{ name: `${side}Hand`, x: 0, y: 70, shapes: [{ d: claws(26, 40), fill: side === 'f' ? fur : furDark }, { d: 'M-10 22q-2 14 4 24M-2 22q0 16 6 26M6 22q2 14 8 22', stroke: '#e8e0cc', sw: 2, cls: 'claw-tips' }] }],
    }],
  });
  const leg = (side) => ({
    name: `${side}Thigh`, x: side === 'f' ? 16 : -18, y: 6, shapes: [{ d: limb(92, 58, 30, 12), fill: side === 'f' ? fur : furDark }, { d: tufts(92, -1, 3, 12), fill: side === 'f' ? fur : furDark }],
    children: [{
      name: `${side}Shin`, x: 0, y: 88, shapes: [{ d: limb(82, 28, 18, 4), fill: side === 'f' ? fur : furDark }],
      children: [{
        name: `${side}Foot`, x: 0, y: 80, shapes: [{ d: limb(64, 18, 14, 2), fill: side === 'f' ? fur : furDark }],
        children: [{ name: `${side}Paw`, x: 0, y: 62, shapes: [{ d: claws(30, 30), fill: side === 'f' ? fur : furDark }] }],
      }],
    }],
  });
  const tail = (i) => ({
    name: `tail${i}`, x: 0, y: i === 1 ? 0 : 44, shapes: [{ d: limb(48, 30 - i * 6, 26 - i * 7, 8), fill: furDark }, { d: tufts(48, 1, 2, 12) + tufts(48, -1, 2, 10), fill: furDark }],
    children: i < 3 ? [tail(i + 1)] : [],
  });
  return {
    name: 'root', x: 0, y: 0,
    children: [
      { ...leg('b'), x: -18, y: -200 },
      {
        name: 'pelvis', x: 0, y: -200,
        children: [
          { name: 'tailBase', x: -30, y: -6, children: [tail(1)] },
          {
            name: 'chest', x: 0, y: 0,
            children: [
              arm('b'),
              { name: 'chestSkin', x: 0, y: 0, shapes: [
              { d: 'M-26 14C-40 -20 -54 -70 -52 -112C-50 -152 -32 -182 0 -192C38 -198 80 -184 92 -150C100 -120 84 -92 58 -66C42 -46 30 -20 20 8C8 22 -12 24 -26 14Z', fill: fur },
              { d: 'M30 -110q12 8 18 -2M24 -86q12 8 18 -2M20 -62q10 8 16 -2M-30 -140q20 -20 50 -24', stroke: '#5a6888', sw: 2.4, op: 0.55 },
              // 등 갈기
              { d: 'M-40 -150L-62 -150L-46 -136L-66 -126L-50 -116L-70 -100L-52 -92L-70 -74L-54 -70L-64 -52L-48 -50C-58 -80 -58 -120 -40 -150Z', fill: fur },
              // 가슴 털 · 근육 결
              { d: 'M40 -150q14 20 8 44M56 -120q8 26 -4 50M20 -60q10 16 4 34M-10 -130q-8 30 0 60', stroke: '#6a7898', sw: 2.5, op: 0.55 },
              { d: 'M60 -176L70 -160L78 -178L82 -156L94 -168L88 -144Z', fill: fur },
              ] },
              {
                name: 'neck', x: 34, y: -166,
                shapes: [{ d: 'M-26 14C-34 -10 -26 -34 -8 -46L24 -40C34 -22 34 0 22 18Z', fill: fur }],
                children: [{
                  name: 'head', x: 6, y: -40,
                  shapes: [
                    { d: 'M-24 6C-32 -18 -24 -40 -4 -48L-16 -94L8 -60L14 -100L28 -56C44 -58 60 -54 74 -46L116 -38L118 -26L84 -22C66 -18 54 -12 44 -4C30 10 8 14 -24 6Z', fill: fur },
                    { d: 'M-8 -86L2 -64L6 -78Z M16 -90L22 -62L26 -74Z', fill: '#5a2a30' },
                    { d: 'M20 -44Q40 -56 58 -44', stroke: '#050608', sw: 5 },
                    { d: 'M104 -40a6 5 0 1 0 12 2a6 5 0 1 0 -12 -2Z', fill: '#050608' },
                    { d: 'M60 -30l4 7l3 -6l4 7l3 -7l4 6l3 -6', stroke: '#f4ecd8', sw: 2.2 },
                    { d: 'M-20 -10l-16 -4l12 -4l-14 -10l16 2', fill: fur },
                  ],
                  eyes: [[44, -42]],
                  children: [{
                    name: 'jaw', x: 44, y: -18,
                    shapes: [
                      { d: 'M-6 -2L64 -8L66 2C48 14 18 18 -4 12Z', fill: fur },
                      { d: 'M4 0l66 -6', stroke: '#2a0606', sw: 5 },
                      { d: 'M12 -4l3 -8l3 8M28 -5l3 -8l3 8M48 -7l3 -7l3 7', fill: '#f4ecd8' },
                      { d: 'M6 2Q30 10 58 -2', stroke: '#8a2a2a', sw: 4, op: 0.8 },
                    ],
                  }],
                }],
              },
              arm('f'),
            ],
          },
        ],
      },
      { ...leg('f'), x: 16, y: -196 },
    ],
  };
}

function humanDef(color = '#0a0c14', tool = null) {
  const c = color;
  const armDef = (s) => ({
    name: `${s}Upper`, x: s === 'f' ? 8 : -4, y: -60, shapes: [{ d: limb(48, 16, 12, 2), fill: c }],
    children: [{
      name: `${s}Fore`, x: 0, y: 46, shapes: [{ d: limb(44, 12, 10, 1), fill: c }, { d: 'M-6 44a7 7 0 1 0 12 0a7 7 0 1 0 -12 0Z', fill: c }],
      children: s === 'f' && tool ? [{ name: 'tool', x: 0, y: 48, shapes: tool }] : [],
    }],
  });
  const legDef = (s) => ({
    name: `${s}Thigh`, x: s === 'f' ? 6 : -6, y: -92, shapes: [{ d: limb(50, 20, 15, 2), fill: c }],
    children: [{ name: `${s}Shin`, x: 0, y: 48, shapes: [{ d: limb(46, 15, 11, 1), fill: c }, { d: 'M-6 42h24v8h-26Z', fill: c }] }],
  });
  return {
    name: 'root', x: 0, y: 0,
    children: [
      legDef('b'),
      {
        name: 'body', x: 0, y: -92,
        children: [
          armDef('b'),
          { name: 'bodySkin', x: 0, y: 0, shapes: [{ d: 'M-16 4C-20 -20 -22 -50 -16 -66C-10 -72 10 -72 16 -66C22 -50 20 -20 16 4Z', fill: c }, { d: 'M-18 -8h36v10h-36Z', fill: c }] },
          {
            name: 'head', x: 0, y: -70,
            shapes: [{ d: 'M-4 0v-6a14 15 0 1 1 8 0v6Z', fill: c }, { d: 'M-16 -22Q0 -36 18 -22L22 -18H-20Z', fill: c, cls: 'hat' }],
          },
          armDef('f'),
        ],
      },
      legDef('f'),
    ],
  };
}

export const TOOLS = {
  torch: [
    { d: 'M-3 -60H3V16H-3Z', fill: '#2a1a0a' },
    { d: 'M0 -58C-14 -74 -6 -96 2 -112C6 -94 18 -80 6 -58Z', fill: '#ffb040', cls: 'an-flame' },
    { d: 'M0 -62C-6 -70 -2 -82 2 -90C4 -80 8 -72 3 -62Z', fill: '#fff4c0', cls: 'an-flame' },
  ],
  fork: [
    { d: 'M-2 -90H2V30H-2Z', fill: '#3a2412' },
    { d: 'M-12 -90H12V-86H-12ZM-12 -86V-112H-9V-86ZM-1.5 -86V-116H1.5V-86ZM9 -86V-112H12V-86Z', fill: '#8a8a90' },
  ],
};

/* ═════════ 인형 만들기 ═════════ */

export class Rig {
  constructor(parent, def, { scale = 1, x = 0, y = 0, rim = '#dfe8ff', flip = false, filter = true, eyeColor = '#ffd23a' } = {}) {
    this.id = `rig${++uid}`;
    this.svg = el('svg', { viewBox: '-300 -520 600 560', width: 600, height: 560, class: 'rig', overflow: 'visible' }, parent);
    const defs = el('defs', {}, this.svg);
    defs.innerHTML = `
      <linearGradient id="${this.id}F" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4462"/><stop offset=".3" stop-color="#141824"/><stop offset="1" stop-color="#05060a"/></linearGradient>
      <linearGradient id="${this.id}D" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2436"/><stop offset=".4" stop-color="#0a0c14"/><stop offset="1" stop-color="#030406"/></linearGradient>
      <filter id="${this.id}R" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/>
        <feFlood flood-color="${rim}"/><feComposite in2="d" operator="in" result="edge"/>
        <feOffset in="edge" dx="2" dy="-1" result="eo"/>
        <feGaussianBlur in="edge" stdDeviation="6" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="eo"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="${this.id}G" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>`;
    this.root = el('g', { filter: filter ? `url(#${this.id}R)` : '' }, this.svg);
    this.nodes = {};
    this.base = {};
    this.pose = {};
    this.world = { x, y, scale, rot: 0, flip };
    this.eyeColor = eyeColor;
    this.eyes = [];
    const build = (node, parentEl) => {
      const g = el('g', {}, parentEl);
      this.nodes[node.name] = g;
      this.base[node.name] = [node.x || 0, node.y || 0];
      this.pose[node.name] = 0;
      for (const s of node.shapes || []) {
        const fill = s.fill ? s.fill.replace('url(#FUR)', `url(#${this.id}F)`).replace('url(#FURD)', `url(#${this.id}D)`) : 'none';
        el('path', {
          d: s.d, fill, stroke: s.stroke || 'none', 'stroke-width': s.sw || 0, 'stroke-linecap': 'round', opacity: s.op ?? 1, class: s.cls || '',
        }, g);
      }
      for (const [ex, ey] of node.eyes || []) {
        const eg = el('g', { class: 'rig-eye', opacity: 0 }, g);
        el('circle', { cx: ex, cy: ey, r: 12, fill: eyeColor, opacity: 0.6, filter: `url(#${this.id}G)` }, eg);
        el('path', { d: `M${ex - 8} ${ey + 1}L${ex + 8} ${ey - 3}L${ex + 3} ${ey + 3}Z`, fill: '#fff2a0' }, eg);
        this.eyes.push(eg);
      }
      for (const c of node.children || []) build(c, g);
    };
    build(def, this.root);
    this.extra = {};   // 매 프레임 더하는 흔들림
    this.apply();
  }

  set(p) {
    for (const [k, v] of Object.entries(p)) {
      if (k in this.pose) this.pose[k] = v;
      else if (k in this.world) this.world[k] = v;
    }
    this.apply();
  }

  apply() {
    for (const [name, g] of Object.entries(this.nodes)) {
      const [bx, by] = this.base[name];
      const a = (this.pose[name] || 0) + (this.extra[name] || 0);
      g.setAttribute('transform', `translate(${bx} ${by}) rotate(${a.toFixed(2)})`);
    }
    const w = this.world;
    this.svg.style.transform = `translate(${w.x - 300}px, ${w.y - 520}px) rotate(${w.rot}deg) scale(${w.flip ? -w.scale : w.scale}, ${w.scale})`;
  }

  eyesOn(v = 1) { this.eyes.forEach((e) => e.setAttribute('opacity', v)); }
}

/* ═════════ 동작 재생 ═════════ */

export const EASE = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
  snap: (x) => 1 - Math.pow(1 - x, 5),
};

/**
 * 키프레임 동작: [[초, {관절: 각도, x, y, rot, scale}, 이징], ...]
 * 앞 키의 값에서 다음 키의 값으로 보간한다. 없는 값은 이전 값을 유지.
 */
export function motion(rig, keys) {
  const names = new Set();
  keys.forEach(([, p]) => Object.keys(p).forEach((k) => names.add(k)));
  const tracks = {};
  for (const n of names) {
    let last = n in rig.pose ? rig.pose[n] : rig.world[n];
    tracks[n] = keys.map(([t, p, e]) => {
      if (p[n] != null) last = p[n];
      return [t, last, EASE[e || 'inOut']];
    });
  }
  return (time) => {
    const out = {};
    for (const [n, tr] of Object.entries(tracks)) {
      let i = 0;
      while (i < tr.length - 1 && time >= tr[i + 1][0]) i++;
      if (i >= tr.length - 1) { out[n] = tr[tr.length - 1][1]; continue; }
      const [t0, v0] = tr[i];
      const [t1, v1, e] = tr[i + 1];
      const k = time <= t0 ? 0 : e(Math.min(1, (time - t0) / (t1 - t0)));
      out[n] = v0 + (v1 - v0) * k;
    }
    rig.set(out);
  };
}

/** 영상 전체용 시계: 매 프레임 fn(초) 호출 */
export function clock(fn) {
  let raf = 0;
  const t0 = performance.now();
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    fn((now - t0) / 1000);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

export const makeWolf = (parent, opts) => new Rig(parent, wolfDef(), opts);
export const makeHuman = (parent, { color, tool, ...opts } = {}) => new Rig(parent, humanDef(color, tool ? TOOLS[tool] : null), { rim: '#ffb070', ...opts });

/* ═════════ 자주 쓰는 자세 ═════════ */

export const WOLF_POSE = {
  crouch: { pelvis: 30, chest: 10, neck: 20, head: 10, jaw: 0, fUpper: 20, fFore: -30, fHand: -10, bUpper: 30, bFore: -20, fThigh: -70, fShin: 110, fFoot: -80, fPaw: 40, bThigh: -60, bShin: 100, bFoot: -70, bPaw: 30, tail1: 70, tail2: 20, tail3: 10 },
  stand: { pelvis: 12, chest: 6, neck: 6, head: 4, jaw: 4, fUpper: -10, fFore: -20, fHand: -10, bUpper: 20, bFore: -25, fThigh: -40, fShin: 80, fFoot: -70, fPaw: 30, bThigh: -30, bShin: 70, bFoot: -60, bPaw: 20, tail1: 60, tail2: 15, tail3: 10 },
  roar: { pelvis: 8, chest: -2, neck: -6, head: -10, jaw: 28, fUpper: -80, fFore: -60, fHand: -30, bUpper: 50, bFore: -70, fThigh: -44, fShin: 84, fFoot: -70, fPaw: 30, bThigh: -24, bShin: 64, bFoot: -58, bPaw: 20, tail1: 40, tail2: -10, tail3: -10 },
  howl: { pelvis: 6, chest: -10, neck: -22, head: -34, jaw: 34, fUpper: -110, fFore: -40, fHand: -30, bUpper: 60, bFore: -50, fThigh: -40, fShin: 76, fFoot: -64, fPaw: 28, bThigh: -18, bShin: 58, bFoot: -52, bPaw: 18, tail1: 30, tail2: -20, tail3: -20 },
  hurt: { pelvis: -30, chest: -30, neck: -30, head: -20, jaw: 20, fUpper: -140, fFore: -40, fHand: 20, bUpper: -120, bFore: -40, fThigh: -80, fShin: 40, fFoot: -20, fPaw: 10, bThigh: -100, bShin: 60, bFoot: -30, bPaw: 10, tail1: 10, tail2: 30, tail3: 30 },
};

export const HUMAN_POSE = {
  stand: { fUpper: 10, fFore: -10, bUpper: -10, bFore: -10, fThigh: -4, fShin: 4, bThigh: 4, bShin: 2, body: 0, head: 0 },
  cheer: { fUpper: -160, fFore: -20, bUpper: 155, bFore: 20, tool: 180, fThigh: -4, fShin: 4, bThigh: 4, bShin: 2, body: 0, head: -8 },
  point: { fUpper: -85, fFore: -8, bUpper: 14, bFore: -16, body: -4, head: -4, tool: 90 },
  carry: { fUpper: -40, fFore: -80, bUpper: 20, bFore: -40, body: 8, head: 0 },
};

/** 달리기 한 주기 (phase 0~1) */
export function runPose(ph, carry = true) {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  return {
    body: 14,
    head: -8,
    fThigh: -s * 45 - 10,
    fShin: Math.max(0, c) * 70 + 10,
    bThigh: s * 45 - 10,
    bShin: Math.max(0, -c) * 70 + 10,
    fUpper: carry ? -50 + s * 10 : s * 50,
    fFore: carry ? -70 : -60,
    tool: carry ? 106 - s * 10 : 0,
    bUpper: -s * 50,
    bFore: -60,
  };
}
