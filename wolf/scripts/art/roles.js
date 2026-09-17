'use strict';
// 역할 카드 그림 (400×400): 달빛 아래 반신 초상화, 유화 붓질 느낌
const W = require('../../public/shared/wolf');
const { f, rng, lin, rad, svg, mix, roughFilter, grain, soft, pine, BODY, P } = require('./draw');
const { face, shoulders, neck } = require('./portrait');

const S = 400;
const CX = 200;

/** 유화 필터: 붓결 방향으로 살짝 번지고 가장자리가 흔들린다 */
const paint = (id, seed) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="3" seed="${seed}" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="${seed + 1}" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 -.6 .32" result="gg"/>
  <feComposite in="gg" in2="d" operator="in" result="gm"/>
  <feBlend in="d" in2="gm" mode="soft-light"/>
</filter>`;

/** 배경: 역할 색 밤하늘, 머리 뒤 보름달, 아래 마을 */
function backdrop(role, seed, { moon = [CX, 150, 120], village = true, warm = false } = {}) {
  const r = rng(seed);
  const c = W.ROLES[role].color;
  const [mx, my, mr] = moon;
  let s = `<rect width="${S}" height="${S}" fill="url(#bg)"/>`;
  // 붓 자국 하늘
  for (let i = 0; i < 26; i++) {
    const y = r() * 260;
    s += `<path d="M${f(r() * S - 60)} ${f(y)}q${f(40 + r() * 60)} ${f(-6 + r() * 12)} ${f(120 + r() * 80)} 0" stroke="${mix(c, i % 2 ? '#8aa0d0' : '#050810', 0.55)}" stroke-width="${f(6 + r() * 10)}" opacity=".22" fill="none" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 40; i++) s += `<circle cx="${f(r() * S)}" cy="${f(r() * 220)}" r="${f(0.5 + r())}" fill="#fff" opacity="${f(0.3 + r() * 0.6)}"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mr * 1.7}" fill="url(#halo)"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="url(#moon)"/>`;
  s += `<g fill="#b8a478" opacity=".35"><ellipse cx="${mx - mr * 0.35}" cy="${my - mr * 0.25}" rx="${mr * 0.22}" ry="${mr * 0.16}"/><ellipse cx="${mx + mr * 0.3}" cy="${my + mr * 0.2}" rx="${mr * 0.16}" ry="${mr * 0.12}"/><ellipse cx="${mx + mr * 0.05}" cy="${my + mr * 0.55}" rx="${mr * 0.12}" ry="${mr * 0.08}"/></g>`;
  if (village) {
    s += `<g fill="${mix(c, '#05070e', 0.78)}">`;
    for (let i = 0; i < 12; i++) s += pine(f(r() * S), 330 + r() * 20, 60 + r() * 50, mix(c, '#05070e', 0.78));
    const houses = [[20, 60, 50], [300, 70, 44], [350, 50, 60]];
    for (const [x, w, h] of houses) s += `<path d="M${x} 340V${340 - h}L${x + w / 2} ${340 - h - w * 0.4}L${x + w} ${340 - h}V340Z"/><rect x="${x + w * 0.35}" y="${340 - h * 0.7}" width="${w * 0.2}" height="${h * 0.25}" fill="${warm ? '#ffb850' : '#e8a040'}" opacity=".85"/>`;
    s += '</g>';
  }
  return s;
}

const defsFor = (role, seed, extra = '') => {
  const c = W.ROLES[role].color;
  return `${lin('bg', [[0, mix(c, '#03050c', 0.78)], [0.6, mix(c, '#101c3c', 0.55)], [1, mix(c, '#05070e', 0.7)]])}
    ${rad('moon', [[0, '#fffdf0'], [0.7, '#f6e8b4'], [1, '#dcc07a']])}
    ${rad('halo', [[0.5, '#fff4c8', 0.5], [1, '#fff4c8', 0]])}
    ${rad('vig', [[0.6, '#000', 0], [1, '#000', 0.65]])}
    ${rad('fire', [[0, '#ffe8a0', 0.95], [0.3, '#ffb040', 0.5], [1, '#ff6020', 0]])}
    ${rad('green', [[0, '#d0ffb0', 0.9], [0.35, '#60c060', 0.4], [1, '#206040', 0]])}
    ${rad('ball', [[0, '#ffffff'], [0.35, '#b8e0ff'], [0.8, '#4a70d0'], [1, '#2a3a8a']], 0.4, 0.35, 0.65)}
    ${lin('rimL', [[0, '#dfe8ff', 0.7], [0.3, '#dfe8ff', 0]], 1, 0, 0, 0)}
    ${paint('paint', seed)}${grain('grain')}${soft('blur2', 2)}${soft('blur6', 6)}${extra}`;
};

function card(role, seed, body, opts = {}) {
  return svg(S, S, `
    <g filter="url(#paint)">
      ${backdrop(role, seed, opts)}
      ${body}
    </g>
    ${opts.overlay || ''}
    <rect width="${S}" height="${S}" fill="url(#vig)"/>
    <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".07"/>`, defsFor(role, seed, opts.defs || ''));
}

/** 머리카락 덩어리 + 결 */
const strands = (d, color, n = 10, seed = 1) => {
  const r = rng(seed);
  let o = `<path d="${d}" fill="${color}"/>`;
  const hl = mix(color, '#fff', 0.3);
  for (let i = 0; i < n; i++) o += `<path d="M${f(140 + r() * 120)} ${f(90 + r() * 40)}q${f(-20 + r() * 40)} ${f(20 + r() * 30)} ${f(-10 + r() * 20)} ${f(50 + r() * 40)}" stroke="${i % 3 ? mix(color, '#000', 0.4) : hl}" stroke-width="${f(1.5 + r() * 2)}" fill="none" opacity=".6" clip-path="url(#hair${seed})"/>`;
  return o + `<defs><clipPath id="hair${seed}"><path d="${d}"/></clipPath></defs>`;
};

const ROLE_ART = {
  /* 늑대인간: 털 많은 늑대 머리, 노란 눈, 송곳니, 찢어진 셔츠 */
  werewolf: () => {
    const fur = '#3a2e2a';
    const furD = '#1a1210';
    const furL = '#8a7a6a';
    const r = rng(5);
    // 머리 둘레의 삐죽한 갈기 (두 겹)
    const mane = (rin, rout, n, color, jitter) => {
      let d = '';
      for (let i = 0; i <= n * 2; i++) {
        const a = Math.PI * 0.05 + (i / (n * 2)) * Math.PI * 0.9 + Math.PI;
        const rr = (i % 2 ? rout : rin) + (r() - 0.5) * jitter;
        const x = 200 + Math.cos(a) * rr * 1.05;
        const y = 210 - Math.sin(a) * rr * -1;
        d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
      }
      return `<path d="${d}L200 300Z" fill="${color}"/>`;
    };
    let tufts = mane(92, 124, 16, furD, 14) + mane(86, 108, 18, fur, 10);
    // 몸 쪽 털
    tufts += `<path d="M96 400C96 340 120 300 150 292L130 318L160 306L146 336L176 310L170 340L200 312L230 340L224 310L254 336L240 306L270 318L250 292C280 300 304 340 304 400Z" fill="${fur}"/>`;
    for (let i = 0; i < 26; i++) tufts += `<path d="M${f(110 + r() * 180)} ${f(320 + r() * 70)}q${f(-4 + r() * 8)} 8 ${f(-2 + r() * 4)} ${f(14 + r() * 8)}" stroke="${r() > 0.5 ? furL : furD}" stroke-width="2" fill="none" opacity=".7"/>`;
    const body = `
      ${shoulders(CX, 300, 330, '#4a3a2e', { collar: 'shirt' })}
      <path d="M92 400L110 316C130 296 170 290 200 300C230 290 270 296 290 316L308 400Z" fill="${fur}"/>
      <path d="M150 330l-10 40l14 -20l6 30l8 -36M240 330l12 44l-2 -30l12 20l-4 -36" stroke="#1a1210" stroke-width="3" fill="none"/>
      ${tufts}
      <!-- 귀 -->
      <path d="M120 150L108 50L166 110Z" fill="${fur}"/><path d="M124 136L116 72L152 112Z" fill="#6a3a3a"/>
      <path d="M272 150L292 48L232 108Z" fill="${fur}"/><path d="M268 136L284 70L246 110Z" fill="#6a3a3a"/>
      <!-- 머리 -->
      <path d="M200 100C250 100 284 140 282 190C280 230 262 250 250 262L240 300H160L150 262C138 250 120 230 118 190C116 140 150 100 200 100Z" fill="${fur}"/>
      <path d="M200 100C250 100 284 140 282 190C280 230 262 250 250 262L240 300H200Z" fill="${furL}" opacity=".25"/>
      <!-- 주둥이 -->
      <path d="M160 200C166 180 234 180 240 200L246 262C236 290 164 290 154 262Z" fill="${mix(fur, '#8a7a6a', 0.35)}"/>
      <path d="M176 196C186 188 214 188 224 196C222 210 212 216 200 216C188 216 178 210 176 196Z" fill="#0a0604"/>
      <path d="M186 196q6 -3 10 0" stroke="#6a6a6a" stroke-width="2" fill="none"/>
      <path d="M200 216V238" stroke="${furD}" stroke-width="3"/>
      <!-- 벌린 입, 송곳니 -->
      <path d="M160 244Q200 232 240 244Q236 286 200 290Q164 286 160 244Z" fill="#2a0606"/>
      <path d="M170 254Q200 270 230 254Q222 280 200 282Q178 280 170 254Z" fill="#8a2a2a"/>
      <path d="M166 244L172 270L178 246Z M234 244L228 270L222 246Z M184 242l3 10l3 -10Z M210 242l3 10l3 -10Z" fill="#f4ecd8"/>
      <path d="M172 280L176 262L181 280Z M228 280L224 262L219 280Z" fill="#e8dcc0"/>
      <!-- 눈 -->
      <path d="M144 166Q160 150 182 164Q162 178 144 166Z" fill="#ffcf30"/>
      <path d="M256 166Q240 150 218 164Q238 178 256 166Z" fill="#ffcf30"/>
      <ellipse cx="164" cy="165" rx="2.6" ry="7" fill="#1a0a00"/><ellipse cx="236" cy="165" rx="2.6" ry="7" fill="#1a0a00"/>
      <path d="M136 150L186 162M264 150L214 162" stroke="${furD}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="164" cy="165" r="22" fill="#ffcf30" opacity=".22" filter="url(#blur6)"/><circle cx="236" cy="165" r="22" fill="#ffcf30" opacity=".22" filter="url(#blur6)"/>
      <!-- 볼 털 -->
      <path d="M118 200l-24 12l22 6l-20 16l26 0M282 200l24 12l-22 6l20 16l-26 0" fill="${fur}"/>
      <path d="M200 100C250 100 284 140 282 190" stroke="#dfe8ff" stroke-width="3" fill="none" opacity=".6"/>`;
    return card('werewolf', 11, body, { moon: [200, 150, 150] });
  },

  /* 하수인: 두건 쓴 창백한 하인, 음흉한 웃음, 아래서 비추는 초록 등불 */
  minion: () => {
    const skin = '#c8c0a8';
    const body = `
      <path d="M60 400C70 300 110 250 140 220C130 150 150 80 200 76C250 80 270 150 260 220C290 250 330 300 340 400Z" fill="#2a1a2e"/>
      ${neck(CX, 240, 280, 44, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'mi', cx: 196, cy: 188, w: 108, h: 138, jaw: 0.8, skin, lightDir: -1,
    eyes: { mood: 'sly', iris: '#6a2a2a', look: 0.6 }, brows: { angle: 22, thick: 5, color: '#1a1010' },
    mouth: { curve: 0.55, open: 0.18, teeth: true, skew: 0.3 }, blush: '#7a5a7a', noEars: true })}
      <path d="M126 200C118 130 150 96 200 96C250 96 280 130 272 200C284 150 270 90 200 86C130 90 114 150 126 200Z" fill="#1a0e1e"/>
      <path d="M200 76C260 80 290 140 276 230C300 180 290 70 200 64C110 70 100 180 124 230C110 140 140 80 200 76Z" fill="#3a2440"/>
      <path d="M150 360h60v-50h-60Z" fill="#1a1010"/><path d="M180 310v-40" stroke="#1a1010" stroke-width="4"/>
      <rect x="156" y="316" width="48" height="38" fill="#c8ffb0"/>
      <path d="M156 316h48v38h-48ZM180 316v38M156 335h48" stroke="#1a1010" stroke-width="4" fill="none"/>
      <circle cx="180" cy="335" r="110" fill="url(#green)" opacity=".75"/>
      <path d="M140 250Q196 230 250 250" stroke="#c8ffb0" stroke-width="3" fill="none" opacity=".35"/>`;
    return card('minion', 23, body, { moon: [300, 110, 70] });
  },

  /* 비밀결사: 수염 난 석공, 가죽 모자, 컴퍼스 목걸이, 어깨에 흙손 */
  mason: () => {
    const skin = '#d8a878';
    const beard = `<path d="M142 212C146 262 170 298 200 300C230 298 254 262 258 212C246 236 226 244 200 242C174 244 154 236 142 212Z" fill="#6a4a2a"/>
      <path d="M170 234Q200 224 230 234Q224 252 200 250Q176 252 170 234Z" fill="#5a3a20"/>
      <path d="M160 250q10 20 8 40M186 256q4 24 0 40M214 256q-4 24 0 40M240 250q-10 20 -8 40" stroke="#3a2410" stroke-width="2" fill="none" opacity=".7"/>`;
    const body = `
      ${shoulders(CX, 290, 320, '#6a5238', { collar: 'round' })}
      <path d="M120 300L110 400H150L160 310Z M280 300L290 400H250L240 310Z" fill="#3a2a1a"/>
      <path d="M180 318L200 360L220 318" stroke="#c8a44a" stroke-width="3" fill="none"/><path d="M200 318v44M186 346h28" stroke="#c8a44a" stroke-width="3"/>
      ${neck(CX, 240, 290, 50, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'ma', cx: 200, cy: 180, w: 124, h: 148, jaw: 0.3, skin, lightDir: 1,
    eyes: { mood: 'calm', iris: '#3a5a7a' }, brows: { angle: 4, thick: 7, color: '#4a3018' },
    mouth: { curve: 0.1, open: 0 }, beard })}
      <path d="M130 140C130 90 160 70 200 70C240 70 270 90 270 140C256 124 230 116 200 116C170 116 144 124 130 140Z" fill="#5a3a22"/>
      <path d="M120 142Q200 110 280 142Q282 152 270 150Q200 126 130 150Q118 152 120 142Z" fill="#3a2414"/>
      <path d="M160 86q40 -10 80 0" stroke="#8a6a42" stroke-width="3" fill="none"/>
      <g transform="translate(300 270) rotate(-35)"><path d="M-4 -80h8v60h-8Z" fill="#5a3a1a"/><path d="M-26 -20L26 -20L0 40Z" fill="#9aa0a8" stroke="#3a3a3a" stroke-width="2"/></g>`;
    return card('mason', 37, body, { moon: [80, 90, 60] });
  },

  /* 예언자: 두건 쓴 여인, 금귀걸이, 아래에서 빛나는 수정구 */
  seer: () => {
    const skin = '#d8a888';
    const body = `
      <path d="M90 400C96 330 120 280 150 262L250 262C280 280 304 330 310 400Z" fill="#3a2a6a"/>
      <path d="M130 120C120 180 110 280 80 400H130C140 320 150 260 160 220Z M270 120C280 180 290 280 320 400H270C260 320 250 260 240 220Z" fill="#2a1a4a"/>
      ${neck(CX, 238, 275, 40, skin, mix(skin, '#000', 0.4))}
      <path d="M140 150C130 200 136 250 150 270L250 270C264 250 270 200 260 150Z" fill="#1a0e10"/>
      ${face({ id: 'se', cx: 200, cy: 182, w: 106, h: 140, jaw: 0.65, skin, lightDir: 1,
    eyes: { open: 0.55, mood: 'calm', glow: '#a8e0ff' }, brows: { angle: 6, thick: 3.2, color: '#2a1410', lift: 2 },
    mouth: { curve: 0.08, open: 0, lip: '#a03a40' }, blush: '#d85a5a' })}
      <path d="M130 170C120 90 160 66 200 66C240 66 280 90 270 170C258 120 240 106 200 106C160 106 142 120 130 170Z" fill="#5a3a9a"/>
      <path d="M140 110Q200 90 260 110" stroke="#e8c870" stroke-width="4" fill="none"/>
      ${[150, 170, 190, 210, 230, 250].map((x, i) => `<circle cx="${x}" cy="${104 - Math.sin((i / 5) * Math.PI) * 10}" r="3.2" fill="#f0d890"/>`).join('')}
      <circle cx="200" cy="80" r="7" fill="#6ac0ff" stroke="#f0d890" stroke-width="2"/>
      <circle cx="146" cy="214" r="6" fill="none" stroke="#f0d890" stroke-width="3"/><circle cx="254" cy="214" r="6" fill="none" stroke="#f0d890" stroke-width="3"/>
      <path d="M130 360q20 -30 50 -26M270 360q-20 -30 -50 -26" stroke="${skin}" stroke-width="18" stroke-linecap="round" fill="none"/>
      <ellipse cx="200" cy="394" rx="60" ry="12" fill="#1a1010"/>
      <circle cx="200" cy="340" r="52" fill="url(#ball)"/>
      <path d="M172 318a34 34 0 0 1 26 -14" stroke="#fff" stroke-width="5" fill="none" opacity=".8" stroke-linecap="round"/>
      <path d="M186 346q14 -16 28 0q-14 14 -28 0Z" fill="#fff" opacity=".35"/>`;
    return card('seer', 41, body, {
      moon: [320, 90, 56],
      overlay: '<circle cx="200" cy="340" r="160" fill="url(#ball)" opacity=".18" style="mix-blend-mode:screen"/><path d="M130 240Q200 200 270 240" stroke="#b8e0ff" stroke-width="30" opacity=".12" fill="none" filter="url(#blur6)"/>',
    });
  },

  /* 강도: 검은 복면 두건, 짧은 수염, 씩 웃는 입, 손가락에 금화 */
  robber: () => {
    const skin = '#c89a70';
    const body = `
      ${shoulders(CX, 292, 330, '#2a3040', { collar: 'v' })}
      <path d="M130 300C150 330 250 330 270 300L260 340C240 360 160 360 140 340Z" fill="#6a2a20"/>
      ${neck(CX, 240, 292, 46, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'ro', cx: 200, cy: 184, w: 118, h: 146, jaw: 0.45, skin, lightDir: 1, stubble: '#2a1a10',
    eyes: { mood: 'sly', iris: '#8a6a2a', look: -0.5 }, brows: { angle: 14, thick: 6, color: '#1a1008', asym: -1, lift: 2 },
    mouth: { curve: 0.4, open: 0.08, teeth: true, skew: -0.4 } })}
      <path d="M134 150Q200 136 266 150L268 196Q200 182 132 196Z" fill="#0e1016"/>
      <path d="M146 170Q164 158 184 170Q164 180 146 170ZM216 170Q236 158 254 170Q236 180 216 170Z" fill="#000" opacity=".0"/>
      <path d="M268 160C290 156 300 170 312 190C296 184 284 178 268 180Z M270 170C296 176 304 196 306 214C290 200 280 192 266 188Z" fill="#0e1016"/>
      <path d="M130 150C124 100 160 70 200 70C240 70 276 100 270 150C250 136 150 136 130 150Z" fill="#1a1c24"/>
      <path d="M150 90q50 -24 100 0" stroke="#3a3e4a" stroke-width="4" fill="none"/>
      ${[[142, 170, 184], [216, 170, 258]].map(([a, y, b]) => `<path d="M${a} ${y}Q${(a + b) / 2} ${y - 16} ${b} ${y}Q${(a + b) / 2} ${y + 12} ${a} ${y}Z" fill="#c89a70"/>`).join('')}
      ${[163, 237].map((x, i) => `<circle cx="${x + (i ? -3 : -3)}" cy="170" r="6" fill="#6a4a1a"/><circle cx="${x - 3}" cy="170" r="3" fill="#000"/><circle cx="${x - 1}" cy="168" r="1.6" fill="#fff"/>`).join('')}
      <path d="M140 160Q200 146 260 160" stroke="#dfe8ff" stroke-width="2" fill="none" opacity=".4"/>
      <path d="M270 400C276 360 290 330 310 320C330 316 340 330 336 344C330 366 316 380 310 400Z" fill="${skin}"/>
      <circle cx="318" cy="306" r="22" fill="#e8c048" stroke="#8a6a1a" stroke-width="3"/><circle cx="318" cy="306" r="14" fill="none" stroke="#b8902a" stroke-width="2"/>
      <path d="M310 296l4 -4l8 0" stroke="#fff8d0" stroke-width="2.5" fill="none"/>
      <circle cx="318" cy="306" r="40" fill="#ffd860" opacity=".25" filter="url(#blur6)"/>`;
    return card('robber', 53, body, { moon: [90, 100, 64] });
  },

  /* 말썽꾼: 양갈래 머리 소녀, 주근깨, 장난스러운 웃음, 쉿 손가락 */
  troublemaker: () => {
    const skin = '#f0c8a0';
    const hair = '#c8642a';
    let freckles = '';
    const r = rng(8);
    for (let i = 0; i < 16; i++) freckles += `<circle cx="${f((i % 2 ? 234 : 150) + r() * 22)}" cy="${f(206 + r() * 16)}" r="1.5" fill="#a0503a" opacity=".6"/>`;
    const body = `
      ${shoulders(CX, 296, 290, '#3a6a9a', { collar: 'round' })}
      <path d="M150 300v100M250 300v100" stroke="#b8402a" stroke-width="14"/>
      ${strands('M108 170C80 220 70 280 96 320C110 290 116 250 124 220Z M292 170C320 220 330 280 304 320C290 290 284 250 276 220Z', hair, 8, 3)}
      <circle cx="104" cy="186" r="12" fill="#3aa04a"/><circle cx="296" cy="186" r="12" fill="#3aa04a"/>
      ${neck(CX, 244, 296, 38, skin, mix(skin, '#000', 0.35))}
      ${face({ id: 'tr', cx: 200, cy: 190, w: 116, h: 132, jaw: 0.35, skin, lightDir: -1,
    eyes: { mood: 'sly', iris: '#3a7a3a', look: 0.7 }, brows: { angle: -14, thick: 4, color: '#8a3a1a', lift: 4, asym: -0.2 },
    mouth: { curve: 0.7, open: 0.14, teeth: true, skew: 0.35 }, blush: '#f06a5a' })}
      ${freckles}
      ${strands('M136 196C126 120 160 100 200 100C240 100 274 120 264 196C258 150 240 138 228 132C214 150 180 150 160 140C150 150 140 170 136 196Z', hair, 12, 4)}
      <path d="M160 140q20 -20 40 -10q20 -16 40 4" stroke="#e8904a" stroke-width="3" fill="none"/>
      <path d="M244 290C250 250 262 220 272 210C280 206 286 212 284 222L276 270Z" fill="${skin}"/>
      <path d="M272 212v-40" stroke="${skin}" stroke-width="12" stroke-linecap="round"/>
      <path d="M272 176v-6" stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"/>
      <path d="M100 120l10 -18l4 20M310 110l14 -10l-4 20M320 300l18 4l-14 12" stroke="#ffd860" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return card('troublemaker', 67, body, { moon: [320, 80, 56], warm: true });
  },

  /* 술꾼: 빨간 코, 반쯤 감긴 눈, 헝클어진 머리, 술병 */
  drunk: () => {
    const skin = '#e0a888';
    const body = `
      ${shoulders(CX, 294, 320, '#5a6a3a', { collar: 'shirt' })}
      <path d="M170 300l30 30l30 -30" stroke="#8a2a20" stroke-width="10" fill="none"/>
      ${neck(CX, 240, 294, 48, skin, mix(skin, '#000', 0.4))}
      <g transform="rotate(-8 200 190)">
      ${face({ id: 'dr', cx: 200, cy: 186, w: 124, h: 142, jaw: 0.3, skin, lightDir: 1, stubble: '#3a2a1a',
    eyes: { open: 0.35, mood: 'sleepy', iris: '#5a3a2a', look: -0.3 }, brows: { angle: -16, thick: 5, color: '#4a3020', lift: -2 },
    mouth: { curve: 0.3, open: 0.12, skew: 0.5 }, blush: '#e04030' })}
      <ellipse cx="204" cy="210" rx="16" ry="13" fill="#d83a2a"/><ellipse cx="208" cy="205" rx="5" ry="3" fill="#fff" opacity=".55"/>
      <path d="M128 150C114 100 150 80 180 90C176 70 220 66 230 86C256 70 290 100 276 150C270 124 250 110 240 118C230 100 200 104 190 116C170 104 146 120 128 150Z" fill="#6a5040"/>
      <path d="M150 100l-14 -20M196 86l0 -26M240 90l16 -20M270 120l20 -10" stroke="#6a5040" stroke-width="7" stroke-linecap="round"/>
      </g>
      <path d="M248 400C252 350 270 320 296 312L316 330C300 346 290 370 290 400Z" fill="${skin}"/>
      <path d="M296 330L312 190H336L352 330Z" fill="#2a5a2a" opacity=".92"/>
      <path d="M314 190V150H334V190Z" fill="#2a5a2a"/><path d="M312 146h24v10h-24Z" fill="#c8a060"/>
      <path d="M308 230h40v50h-40Z" fill="#e8dcb0"/><path d="M314 244h28M314 256h20" stroke="#6a3a1a" stroke-width="2"/>
      <path d="M318 200v110" stroke="#fff" stroke-width="4" opacity=".35" stroke-linecap="round"/>
      <g fill="none" stroke="#e8f0c0" stroke-width="3" opacity=".7"><circle cx="110" cy="120" r="12"/><circle cx="84" cy="90" r="8"/><circle cx="70" cy="64" r="5"/></g>`;
    return card('drunk', 79, body, { moon: [90, 110, 60], warm: true });
  },

  /* 불면증 환자: 잠옷 모자, 커다랗게 뜬 눈, 짙은 다크서클, 촛불 */
  insomniac: () => {
    const skin = '#e8c8b0';
    const body = `
      ${shoulders(CX, 296, 300, '#d8d0e8', { collar: 'round', dark: '#8a80a8' })}
      <path d="M130 330h140M120 360h160" stroke="#a8a0c8" stroke-width="4" opacity=".6"/>
      ${neck(CX, 240, 296, 40, skin, mix(skin, '#000', 0.35))}
      ${face({ id: 'in', cx: 200, cy: 190, w: 112, h: 140, jaw: 0.55, skin, lightDir: 1,
    eyes: { open: 1.25, mood: 'sad', iris: '#4a6a8a', look: 0 }, brows: { angle: -18, thick: 3.6, color: '#5a4030', lift: 6 },
    mouth: { curve: -0.25, open: 0 }, blush: false })}
      <ellipse cx="177" cy="196" rx="22" ry="7" fill="#6a3a6a" opacity=".45"/><ellipse cx="223" cy="196" rx="22" ry="7" fill="#6a3a6a" opacity=".45"/>
      <path d="M136 170C120 120 150 96 180 100C176 92 196 88 206 96" stroke="#8a6040" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M128 150C130 90 170 60 220 70C270 80 300 130 330 200C320 214 304 210 300 200C280 150 260 130 240 128C200 120 150 130 128 150Z" fill="#6a78c8"/>
      <path d="M128 150Q200 118 272 146" stroke="#e8e0f8" stroke-width="14" fill="none" stroke-linecap="round"/>
      <circle cx="318" cy="208" r="16" fill="#e8e0f8"/>
      ${[[170, 80], [210, 76], [250, 96], [290, 150]].map(([x, y]) => `<path d="M${x} ${y}l4 -8l4 8l-4 8Z" fill="#f0d890"/>`).join('')}
      <path d="M86 400V330h-18v-8h56v8h-18V400Z" fill="#c8a44a"/><path d="M84 330V250h24v80Z" fill="#f4ecd8"/>
      <path d="M96 250c-10 -14 0 -30 0 -40c8 10 12 26 0 40Z" fill="#ffc850"/><path d="M96 246c-4 -6 0 -14 0 -18c4 6 5 12 0 18Z" fill="#fff8d8"/>
      <circle cx="96" cy="236" r="70" fill="url(#fire)" opacity=".8"/>
      <text x="290" y="70" font-family="Georgia" font-style="italic" font-size="30" fill="#dfe8ff" opacity=".7">z</text><text x="316" y="50" font-family="Georgia" font-style="italic" font-size="22" fill="#dfe8ff" opacity=".5">?</text>`;
    return card('insomniac', 83, body, { moon: [300, 100, 50] });
  },

  /* 사냥꾼: 깃털 모자, 덥수룩한 수염, 털 목도리, 어깨에 장총 */
  hunter: () => {
    const skin = '#c8906a';
    const beard = `<path d="M140 206C140 270 170 304 200 306C230 304 260 270 260 206C250 228 230 238 200 236C170 238 150 228 140 206Z" fill="#8a5a2a"/>
      <path d="M170 230Q200 218 230 230Q226 246 200 244Q174 246 170 230Z" fill="#6a4020"/>
      <path d="M156 240q8 30 6 50M178 250q4 30 2 50M222 250q-4 30 -2 50M244 240q-8 30 -6 50" stroke="#4a2a10" stroke-width="2.5" fill="none" opacity=".7"/>`;
    let furc = '';
    const r = rng(9);
    for (let i = 0; i < 40; i++) furc += `<path d="M${f(110 + r() * 180)} ${f(290 + r() * 40)}l${f(-6 + r() * 12)} ${f(10 + r() * 14)}" stroke="${r() > 0.5 ? '#c8b090' : '#6a5030'}" stroke-width="3" stroke-linecap="round"/>`;
    const body = `
      <path d="M40 400L330 60L346 72L70 400Z" fill="#3a2410"/><path d="M300 90L346 38L356 46L312 100Z" fill="#6a6a70"/>
      ${shoulders(CX, 294, 340, '#4a5a2a', { collar: 'round' })}
      <path d="M100 300C140 280 260 280 300 300C310 320 300 340 280 336C240 320 160 320 120 336C100 340 90 320 100 300Z" fill="#9a7a50"/>
      ${furc}
      <path d="M60 400L90 360H110L80 400Z" fill="#2a1a08"/>
      ${neck(CX, 240, 290, 50, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'hu', cx: 200, cy: 180, w: 122, h: 146, jaw: 0.35, skin, lightDir: -1,
    eyes: { mood: 'calm', iris: '#3a5a2a', look: -0.4 }, brows: { angle: 10, thick: 7, color: '#5a3010', lift: -2 },
    mouth: { curve: 0, open: 0 }, beard })}
      <path d="M100 136Q200 104 300 136Q306 150 290 150Q200 126 110 150Q94 150 100 136Z" fill="#3a3020"/>
      <path d="M140 136C140 80 170 60 200 60C230 60 260 80 262 136Q200 118 140 136Z" fill="#4a4030"/>
      <path d="M140 120Q200 104 262 120" stroke="#8a2a1a" stroke-width="7" fill="none"/>
      <path d="M250 118C270 80 300 50 320 40C312 70 290 100 262 124Z" fill="#c84a2a"/><path d="M262 118C280 90 300 64 318 44" stroke="#f0c070" stroke-width="2" fill="none"/>`;
    return card('hunter', 97, body, { moon: [300, 90, 56] });
  },

  /* 무두장이: 우울한 표정, 깊은 눈그늘, 가죽 앞치마, 벗겨진 머리 */
  tanner: () => {
    const skin = '#c8a888';
    const body = `
      ${shoulders(CX, 294, 320, '#6a6660', { collar: 'shirt' })}
      <path d="M130 300L140 400H260L270 300C250 316 150 316 130 300Z" fill="#7a4a24"/>
      <path d="M130 300L110 250M270 300L290 250" stroke="#5a3418" stroke-width="6"/>
      <path d="M150 330h100v40h-100Z" fill="#5a3418" opacity=".5"/><path d="M160 340h80M160 356h60" stroke="#3a2008" stroke-width="2"/>
      ${neck(CX, 240, 294, 46, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'ta', cx: 200, cy: 186, w: 116, h: 150, jaw: 0.6, skin, lightDir: 1, stubble: '#4a4038',
    eyes: { open: 0.6, mood: 'sad', iris: '#5a5a5a', look: 0.2 }, brows: { angle: -20, thick: 5, color: '#4a4038', lift: 0 },
    mouth: { curve: -0.55, open: 0 }, blush: false })}
      <ellipse cx="177" cy="194" rx="20" ry="9" fill="#4a3a4a" opacity=".5"/><ellipse cx="223" cy="194" rx="20" ry="9" fill="#4a3a4a" opacity=".5"/>
      <path d="M142 170C136 130 150 116 160 116M258 170C264 130 250 116 240 116" stroke="#5a5048" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M186 110q4 -10 12 -4q6 -12 12 0" stroke="#5a5048" stroke-width="3" fill="none"/>
      <path d="M150 128C170 108 230 108 250 128" stroke="#fff" stroke-width="4" fill="none" opacity=".25"/>
      <path d="M60 400C60 330 70 300 90 290L110 300C100 330 100 370 104 400Z" fill="#a07048" stroke="#5a3418" stroke-width="3"/>
      <path d="M78 310l6 60M92 306l0 70" stroke="#5a3418" stroke-width="2" stroke-dasharray="4 5"/>
      <path d="M300 360l40 -60l12 8l-40 60Z" fill="#8a8a90"/><path d="M296 366l10 8l-14 26l-10 -8Z" fill="#4a3018"/>
      <path d="M220 236q4 8 0 14" stroke="#9ab8d8" stroke-width="3" fill="none" opacity=".7"/>`;
    return card('tanner', 101, body, { moon: [310, 90, 52], village: true });
  },

  /* 마을 주민: 밀짚모자, 순박한 웃음, 어깨에 쇠스랑 */
  villager: () => {
    const skin = '#e0b088';
    const body = `
      <path d="M60 400L96 40H104L80 400Z" fill="#6a4a24"/>
      <path d="M78 40V0M100 40V-4M120 44V2M78 44H122" stroke="#8a8a90" stroke-width="5" fill="none"/>
      ${shoulders(CX, 296, 320, '#8a6a3a', { collar: 'shirt' })}
      <path d="M140 296L150 400M260 296L250 400" stroke="#4a3a20" stroke-width="10"/>
      <path d="M86 320C100 300 120 296 132 300L126 330C110 330 100 336 96 344Z" fill="${skin}"/>
      ${neck(CX, 240, 296, 46, skin, mix(skin, '#000', 0.4))}
      ${face({ id: 'vi', cx: 200, cy: 190, w: 120, h: 140, jaw: 0.4, skin, lightDir: 1,
    eyes: { open: 0.75, mood: 'calm', iris: '#5a3a1a', look: 0 }, brows: { angle: 0, thick: 5, color: '#6a4a20', lift: 3 },
    mouth: { curve: 0.55, open: 0.1, teeth: true } })}
      <path d="M140 170C136 150 150 136 170 134M260 170C264 150 250 136 230 134" stroke="#8a5a2a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="200" cy="138" rx="120" ry="30" fill="#e8c860"/>
      <path d="M130 138C130 84 160 70 200 70C240 70 270 84 270 138Q200 124 130 138Z" fill="#f0d070"/>
      <path d="M132 124Q200 108 268 124" stroke="#a83a2a" stroke-width="8" fill="none"/>
      <path d="M90 140q110 20 220 0M150 90q50 -10 100 0" stroke="#b8902a" stroke-width="2" fill="none" opacity=".7"/>
      ${Array.from({ length: 18 }, (_, i) => `<path d="M${84 + i * 13} ${146 + Math.sin(i) * 3}l${-2 + (i % 3)} 8" stroke="#c8a040" stroke-width="2"/>`).join('')}`;
    return card('villager', 113, body, { moon: [310, 250, 60], village: true, warm: true });
  },
};

/** 카드 뒷면 */
function cardBack() {
  const r = rng(5);
  let stars = '';
  for (let i = 0; i < 70; i++) stars += `<circle cx="${f(r() * 300)}" cy="${f(r() * 420)}" r="${f(0.4 + r())}" fill="#f4e8c0" opacity="${f(0.2 + r() * 0.6)}"/>`;
  const orn = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#c8a44a" stroke-width="2"><path d="M0 0c10 -10 24 -10 30 0c-6 8 -20 8 -22 0"/><path d="M0 0c-10 -10 -24 -10 -30 0c6 8 20 8 22 0"/><circle r="3" fill="#c8a44a"/></g>`;
  return svg(300, 420, `
    <rect width="300" height="420" rx="18" fill="url(#bg)"/>
    ${stars}
    <rect x="12" y="12" width="276" height="396" rx="12" fill="none" stroke="#c8a44a" stroke-width="3"/>
    <rect x="20" y="20" width="260" height="380" rx="8" fill="none" stroke="#c8a44a" stroke-width="1" opacity=".6"/>
    ${orn(150, 40, 1)}${orn(150, 380, 1)}
    <circle cx="150" cy="200" r="106" fill="url(#halo)"/>
    <circle cx="150" cy="200" r="70" fill="url(#moon)"/>
    <circle cx="150" cy="200" r="84" fill="none" stroke="#c8a44a" stroke-width="2"/>
    <circle cx="150" cy="200" r="90" fill="none" stroke="#c8a44a" stroke-width="1" stroke-dasharray="2 5"/>
    <g filter="url(#rough)">${pine(56, 390, 150, '#060912')}${pine(96, 396, 104, '#060912')}${pine(244, 392, 160, '#060912')}${pine(208, 398, 100, '#060912')}
    <path d="M20 400V350C70 336 110 344 150 356C190 344 240 336 280 350V400Z" fill="#060912"/>
    <g transform="translate(150 270) scale(1.05)" fill="#060912">${P(BODY.wolf)}</g></g>
    <g transform="translate(150 274) scale(1.05)"><circle cx="8" cy="-79" r="1.4" fill="#ffcf30"/><circle cx="12.5" cy="-79" r="1.4" fill="#ffcf30"/></g>
    <text x="150" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="4" fill="#c8a44a">FULL MOON</text>
    <rect width="300" height="420" rx="18" filter="url(#grain)" opacity=".18"/>`,
  `${lin('bg', [[0, '#0e1c44'], [1, '#050814']])}
    ${rad('moon', [[0, '#fffbe6'], [0.75, '#f6e8b0'], [1, '#e0c878']])}
    ${rad('halo', [[0.4, '#fff6c8', 0.45], [1, '#fff6c8', 0]])}
    ${roughFilter('rough', 3, 0.05, 2)}${grain('grain')}`);
}

module.exports = { ROLE_ART, cardBack };
