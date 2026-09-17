'use strict';
// 역할 카드 그림 (300×300): 역할 색 밤하늘 + 보름달 + 역광 실루엣
const W = require('../../public/shared/wolf');
const { f, rng, lin, rad, svg, mix, roughFilter, grain, soft, pine, ridge, BODY, silhouette, P } = require('./draw');

const S = 300;

function scene(role, seed, figure, { moon = [196, 104, 62], extraBack = '', extraFront = '' } = {}) {
  const r = rng(seed);
  const c = W.ROLES[role].color;
  const sky1 = mix(c, '#05070f', 0.72);
  const sky2 = mix(c, '#1a2440', 0.45);
  const [mx, my, mr] = moon;
  let back = `<rect width="${S}" height="${S}" fill="url(#sky)"/>`;
  for (let i = 0; i < 40; i++) back += `<circle cx="${f(r() * S)}" cy="${f(r() * 170)}" r="${f(0.4 + r() * 0.9)}" fill="#fff" opacity="${f(0.3 + r() * 0.6)}"/>`;
  back += `<circle cx="${mx}" cy="${my}" r="${mr * 2}" fill="url(#halo)"/>`;
  back += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="url(#moon)"/>`;
  back += `<path d="M${mx - mr * 0.4} ${my - mr * 0.2}a${mr * 0.18} ${mr * 0.14} 0 1 0 1 0Z M${mx + mr * 0.25} ${my + mr * 0.3}a${mr * 0.12} ${mr * 0.1} 0 1 0 1 0Z M${mx + mr * 0.1} ${my - mr * 0.5}a${mr * 0.09} ${mr * 0.07} 0 1 0 1 0Z" fill="#c8b890" opacity=".45"/>`;
  // 구름 띠
  back += `<path d="M${mx - mr * 1.8} ${my + mr * 0.5}q${mr * 0.6} -${mr * 0.25} ${mr * 1.2} -4t${mr * 1.3} 2t${mr * 1.2} -3" stroke="${mix(c, '#8090b0', 0.5)}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".5"/>`;
  back += `<path d="${ridge(0, S, 222, 14, r, S, 8)}" fill="${mix(c, '#0a0e1a', 0.62)}"/>`;
  for (let i = 0; i < 9; i++) back += pine(f(r() * S), 236 + r() * 10, 40 + r() * 34, mix(c, '#070a14', 0.7));
  back += extraBack;
  const ground = `<path d="${ridge(0, S, 268, 8, r, S, 6)}" fill="#06080e"/>`;
  return svg(S, S, `
    <g filter="url(#rough)">${back}</g>
    <rect width="${S}" height="${S}" fill="url(#mist)"/>
    <g filter="url(#roughS)">${figure}${ground}${extraFront}</g>
    <rect width="${S}" height="${S}" fill="url(#vig)"/>
    <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".2"/>`,
  `${lin('sky', [[0, sky1], [0.7, sky2], [1, mix(c, '#2a3450', 0.5)]])}
    ${rad('moon', [[0, '#fffbe6'], [0.75, '#f6e8b0'], [1, '#e0c878']])}
    ${rad('halo', [[0.4, '#fff6c8', 0.5], [1, '#fff6c8', 0]])}
    ${lin('mist', [[0.55, '#9ab0d8', 0], [0.78, '#9ab0d8', 0.22], [1, '#9ab0d8', 0]])}
    ${rad('vig', [[0.55, '#000', 0], [1, '#000', 0.6]], 0.5, 0.45, 0.72)}
    ${rad('glow', [[0, '#ffe08a', 0.95], [0.4, '#ffb050', 0.45], [1, '#ff8030', 0]])}
    ${rad('crystal', [[0, '#f0f8ff', 1], [0.5, '#9ad0ff', 0.8], [1, '#4a70c8', 0.2]])}
    ${roughFilter('rough', 4, 0.03, seed % 9)}
    ${roughFilter('roughS', 2.2, 0.07, (seed + 3) % 9)}
    ${grain('grain')}${soft('blur', 3)}`);
}

const glowAt = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#glow)"/>`;
const eyes = (x1, x2, y, c = '#ffd23a') => `<circle cx="${x1}" cy="${y}" r="1.3" fill="${c}"/><circle cx="${x2}" cy="${y}" r="1.3" fill="${c}"/>`;

const ROLE_ART = {
  werewolf: () => scene('werewolf', 11, silhouette({
    id: 'w', x: 150, y: 272, s: 2.25, parts: [P(BODY.wolf)], color: '#0b0d14', rim: '#e8d8b0',
    over: `${eyes(8, 12.5, -79, '#ffcf30')}<path d="M26 -70l2 3l2 -3l2 3" stroke="#f4f0e0" stroke-width=".8" fill="none"/>`,
  }), { moon: [150, 110, 76] }),

  minion: () => scene('minion', 23, `${glowAt(186, 214, 40)}${silhouette({
    id: 'm', x: 140, y: 272, s: 2.05, parts: [P(BODY.robe), P('M14 -48L26 -40L28 -30L22 -30L20 -38L12 -42Z'), P('M26 -30V-20'), P('M20 -22h12v12h-12Z')],
    color: '#0e0a14', rim: '#d8b8e8',
    over: `<path d="M21 -21h10v10h-10Z" fill="#ffd26a"/>${eyes(-3, 4, -64, '#ff5a3a')}<path d="M-8 -70C-4 -60 6 -60 10 -70C8 -58 -6 -58 -8 -70Z" fill="#000"/>`,
  })}`, { moon: [84, 96, 50] }),

  mason: () => scene('mason', 37, `${silhouette({
    id: 'ma', x: 108, y: 272, s: 1.9, parts: [P(BODY.coat), P(BODY.head), P('M14 -60L28 -70L30 -66L18 -56Z'), P('M26 -76h8v10h-8Z')], color: '#12100c', rim: '#f0d8a0',
  })}${silhouette({
    id: 'mb', x: 192, y: 272, s: 1.95, flip: true, parts: [P(BODY.coat), P(BODY.head), P('M14 -60L28 -70L30 -66L18 -56Z'), P('M24 -72l10 -4l2 6l-10 4Z')], color: '#12100c', rim: '#f0d8a0',
  })}<path d="M150 96l-18 30h36Z M150 112l-9 14h18Z" fill="none" stroke="#f0d890" stroke-width="2.4" opacity=".85"/><circle cx="150" cy="118" r="2.4" fill="#f0d890"/>`, { moon: [150, 112, 54] }),

  seer: () => scene('seer', 41, `${silhouette({
    id: 's', x: 132, y: 272, s: 2.1, parts: [P(BODY.dress), P('M-10 -80C-14 -96 0 -104 10 -96C16 -88 18 -70 20 -56L14 -58C12 -70 10 -82 0 -86C-6 -86 -8 -82 -8 -78Z'), P(BODY.head), P('M12 -50L26 -44L28 -40L14 -44Z')],
    color: '#0c0a18', rim: '#c8c0ff',
  })}<path d="M176 244h40l-6 28h-28Z" fill="#08060e"/><circle cx="196" cy="226" r="20" fill="url(#crystal)"/><circle cx="196" cy="226" r="34" fill="#9ad0ff" opacity=".16" filter="url(#blur)"/><path d="M186 218a12 12 0 0 1 10 -6" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/><circle cx="198" cy="230" r="4" fill="#fff" opacity=".35"/>`, { moon: [92, 90, 46] }),

  robber: () => scene('robber', 53, silhouette({
    id: 'r', x: 146, y: 272, s: 2.15, parts: [P(BODY.coat), P(BODY.head), P('M-16 -91C-10 -93 -9 -100 0 -100C9 -100 10 -93 16 -91C9 -89 -9 -89 -16 -91Z'), P('M-18 -60C-30 -70 -34 -90 -24 -96C-14 -98 -8 -86 -12 -72Z'), P('M-26 -96C-24 -100 -20 -100 -19 -96Z')],
    color: '#0a0e14', rim: '#b8d0f0',
    over: `<path d="M-7 -88H7V-85H-7Z" fill="#000"/>${eyes(-3, 3, -86.5, '#f4f4e0')}<path d="M-26 -92q4 3 8 0" stroke="#b8d0f0" stroke-width=".6" fill="none"/><text x="-24" y="-78" font-size="9" font-family="Georgia" font-weight="700" fill="#b8d0f0" opacity=".6">$</text>`,
  }), { moon: [210, 92, 52] }),

  troublemaker: () => scene('troublemaker', 67, silhouette({
    id: 't', x: 150, y: 272, s: 1.55, parts: [P(BODY.dress), P(BODY.head), P('M-8 -92C-16 -94 -20 -86 -16 -80L-10 -86Z M8 -92C16 -94 20 -86 16 -80L10 -86Z'), P('M14 -60L24 -84L27 -83L18 -58Z'), P('M20 -84L22 -96L25 -96L25 -84Z M24 -84L30 -95L32 -93L27 -83Z'), P('M-14 -60L-26 -72L-24 -74L-12 -63Z')],
    color: '#140c08', rim: '#ffd0a0',
    over: `<path d="M23 -95q3 8 8 1" stroke="#ffd0a0" stroke-width=".7" fill="none"/><circle cx="-26" cy="-73" r="2.2" fill="#ffd0a0"/>${eyes(-2.5, 2.5, -88, '#fff4e0')}<path d="M-3 -83q3 2 6 0" stroke="#fff4e0" stroke-width=".7" fill="none"/>`,
  }), { moon: [96, 104, 58], extraFront: '<path d="M60 150l6 -4M232 140l5 5M70 120l-4 -5" stroke="#ffd0a0" stroke-width="2" opacity=".6"/>' }),

  drunk: () => scene('drunk', 79, `<g transform="rotate(-9 150 272)">${silhouette({
    id: 'd', x: 150, y: 272, s: 2.1, parts: [P(BODY.coat), P(BODY.head), P('M-7 -95C-4 -101 8 -101 9 -94L10 -91H-8Z'), P('M16 -56L26 -70L29 -68L20 -54Z'), P('M24 -70l3 -12h4l1 12Z')],
    color: '#0a100a', rim: '#d8f0a0',
    over: '<path d="M26 -82l1 -4h2l0 4Z" fill="#d8f0a0"/><circle cx="4" cy="-84" r="1.8" fill="#e05a4a" opacity=".8"/>',
  })}</g><g fill="none" stroke="#d8f0a0" stroke-width="1.6" opacity=".7"><circle cx="196" cy="70" r="6"/><circle cx="212" cy="54" r="4.5"/><circle cx="224" cy="40" r="3"/></g>`, { moon: [84, 88, 48] }),

  insomniac: () => scene('insomniac', 83, `<path d="M54 272V222H70V240H232V222H246V272Z" fill="#0a0e14"/><path d="M70 240C80 226 110 224 150 226H232V244H70Z" fill="#1a2030"/>${silhouette({
    id: 'i', x: 110, y: 246, s: 1.5, parts: [P('M-10 0C-12 -12 -12 -24 -8 -34C-4 -40 6 -40 10 -34C14 -24 14 -12 12 0Z'), P('M-7 -48C-7 -57 7 -57 7 -48C7 -43 4 -39 0 -39C-4 -39 -7 -43 -7 -48Z'), P('M-8 -52C-14 -58 -8 -64 0 -60C6 -64 14 -58 8 -52Z')],
    color: '#0a0e14', rim: '#c0e0f0',
    over: '<circle cx="-2.8" cy="-48" r="2" fill="#fff"/><circle cx="2.8" cy="-48" r="2" fill="#fff"/><circle cx="-2.6" cy="-47.6" r=".8" fill="#000"/><circle cx="3" cy="-47.6" r=".8" fill="#000"/>',
  })}<path d="M214 214h12v10h-12Z" fill="#0a0e14"/><path d="M219 214v-10h2v10Z" fill="#e8e0c8"/><path d="M220 204c-3 -4 0 -9 0 -11c2 3 3 7 0 11Z" fill="#ffd26a"/>${glowAt(220, 204, 30)}<text x="186" y="120" font-size="16" font-family="Georgia" font-style="italic" fill="#c0e0f0" opacity=".7">z?</text>`, { moon: [226, 86, 42] }),

  hunter: () => scene('hunter', 97, silhouette({
    id: 'h', x: 146, y: 272, s: 2.15, parts: [P(BODY.coat), P(BODY.head), P('M-13 -91C-9 -92 -8 -99 0 -99C8 -99 9 -92 13 -91C8 -89 -8 -89 -13 -91Z M5 -99l8 -7l1 2l-7 6Z'), P('M-18 -64L40 -118L42 -115L-15 -61Z'), P('M-12 -66L-4 -60L-6 -56L-14 -62Z')],
    color: '#0c100a', rim: '#e0e8b0',
    over: '<path d="M38 -116l3 3" stroke="#e0e8b0" stroke-width="1.2"/>',
  }), { moon: [96, 90, 50] }),

  tanner: () => scene('tanner', 101, `<path d="M190 272V150M254 272V150M184 156H260" stroke="#0a0806" stroke-width="5"/><path d="M196 162C214 158 232 158 248 162C252 186 250 212 246 236C228 240 212 240 198 236C194 212 192 186 196 162Z" fill="#3a2a1a" stroke="#0a0806" stroke-width="2"/><path d="M196 162L190 156M248 162L254 156M198 236L190 244M246 236L254 244" stroke="#0a0806" stroke-width="1.6"/>${silhouette({
    id: 'ta', x: 118, y: 272, s: 2.05, parts: [P(BODY.coat), P('M-5 -85C-5 -93 7 -93 7 -85C7 -80 4 -76 1 -76C-2 -76 -5 -80 -5 -85Z'), P('M-12 -66H12L14 -8H-14Z')],
    color: '#100c08', rim: '#e8c8a0',
    over: '<path d="M-2 -80q3 -2 6 0" stroke="#e8c8a0" stroke-width=".7" fill="none"/><path d="M-1 -86h1.6M3 -86h1.6" stroke="#e8c8a0" stroke-width=".7"/>',
  })}`, { moon: [80, 92, 46] }),

  villager: () => scene('villager', 113, silhouette({
    id: 'v', x: 146, y: 272, s: 2.12, parts: [P(BODY.coat), P(BODY.head), P('M-17 -90C-12 -92 -9 -100 0 -100C9 -100 12 -92 17 -90C9 -87 -9 -87 -17 -90Z'), P('M-24 0L-26 -104H-23L-21 0Z'), P('M-32 -104V-116H-30V-106H-26V-118H-23V-106H-19V-116H-17V-104Z'), P('M-20 -58H-14V-54H-20Z')],
    color: '#0a100a', rim: '#d8e8b8',
  }), { moon: [206, 96, 54] }),
};

/** 카드 뒷면 */
function cardBack() {
  const r = rng(5);
  let stars = '';
  for (let i = 0; i < 70; i++) stars += `<circle cx="${f(r() * 300)}" cy="${f(r() * 420)}" r="${f(0.4 + r())}" fill="#f4e8c0" opacity="${f(0.2 + r() * 0.6)}"/>`;
  return svg(300, 420, `
    <rect width="300" height="420" rx="18" fill="url(#bg)"/>
    ${stars}
    <rect x="14" y="14" width="272" height="392" rx="12" fill="none" stroke="#c8a44a" stroke-width="3"/>
    <rect x="22" y="22" width="256" height="376" rx="8" fill="none" stroke="#c8a44a" stroke-width="1" opacity=".6"/>
    <circle cx="150" cy="200" r="96" fill="url(#halo)"/>
    <circle cx="150" cy="200" r="62" fill="url(#moon)"/>
    <g filter="url(#rough)">${pine(62, 390, 140, '#060912')}${pine(98, 396, 100, '#060912')}${pine(236, 392, 150, '#060912')}${pine(206, 398, 96, '#060912')}
    <path d="M22 398V350C70 336 110 344 150 356C190 344 240 336 278 350V398Z" fill="#060912"/>
    <g transform="translate(150 268) scale(1.05)" fill="#060912">${P(BODY.wolf)}</g></g>
    <g transform="translate(150 272) scale(1.05)">${eyes(8, 12.5, -79, '#ffcf30')}</g>
    <path d="M150 34l6 14l14 2l-10 10l3 14l-13 -7l-13 7l3 -14l-10 -10l14 -2Z" fill="#c8a44a"/>
    <text x="150" y="394" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#c8a44a">FULL MOON</text>
    <rect width="300" height="420" rx="18" filter="url(#grain)" opacity=".18"/>`,
  `${lin('bg', [[0, '#0a1430'], [1, '#050814']])}
    ${rad('moon', [[0, '#fffbe6'], [0.75, '#f6e8b0'], [1, '#e0c878']])}
    ${rad('halo', [[0.4, '#fff6c8', 0.45], [1, '#fff6c8', 0]])}
    ${roughFilter('rough', 3, 0.05, 2)}${grain('grain')}`);
}

module.exports = { ROLE_ART, cardBack };
