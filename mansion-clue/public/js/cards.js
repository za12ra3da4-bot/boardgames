// 밤의 저택 · 인쇄 카드 (250×350). 아이보리 카드지 + 종류별 색띠 + 아르데코 금박 액자 + 이름판.
// 용의자: 말 색 보석 · 흉기: EVIDENCE 도장 · 장소: 저택 평면도에 방 위치 표시
const C = window.CLUE;

const EN = {
  han: 'MADAME HAN', kang: 'COLONEL KANG', baek: 'BUTLER BAEK', oh: 'DR. OH', yoon: 'PROFESSOR YOON', seo: 'PAINTER SEO',
  candle: 'CANDLESTICK', dagger: 'DAGGER', rope: 'ROPE', poison: 'POISON', revolver: 'REVOLVER', wrench: 'WRENCH',
  kitchen: 'KITCHEN', ballroom: 'BALLROOM', conservatory: 'CONSERVATORY', dining: 'DINING ROOM', billiard: 'BILLIARD ROOM',
  library: 'LIBRARY', lounge: 'LOUNGE', hall: 'HALL', study: 'STUDY',
};
const TYPE = {
  suspect: { ko: '용의자', en: 'SUSPECT', band: '#6a1a22', bandD: '#3a0a10' },
  weapon: { ko: '흉기', en: 'WEAPON', band: '#3a4658', bandD: '#1a2230' },
  room: { ko: '장소', en: 'ROOM', band: '#2a5a36', bandD: '#12301a' },
};
const INK = '#2a1810';

// 종류 문장 (지름 ~22)
const ICON = {
  suspect: '<path d="M-11 3 C-11 -2 -7 -4 -6 -9 C-4 -12 4 -12 6 -9 C7 -4 11 -2 11 3Z" fill="currentColor"/><path d="M-15 3 H15 C15 6 10 7 0 7 C-10 7 -15 6 -15 3Z" fill="currentColor"/>',
  weapon: '<path d="M-2 -13 L2 -13 L3 4 L-3 4Z" fill="currentColor"/><path d="M-8 4 H8 V7 H-8Z M-2 7 H2 V13 H-2Z" fill="currentColor"/>',
  room: '<circle cx="-5" cy="0" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M1 0 H14 M10 0 V5 M14 0 V4" stroke="currentColor" stroke-width="3" fill="none"/>',
};

let seq = 0;
const artOf = (id) => {
  const t = C.CARDS[id].type;
  return `/clue/assets/${t === 'suspect' ? 'char' : t}/${id}.svg`;
};

/** 저택 평면도 (방 하나 강조) */
function plan(roomId, x, y, s) {
  let h = `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1" y="-1" width="26" height="27" rx="1.5" fill="#f4ead0" stroke="${INK}" stroke-width="1"/>`;
  for (const r of C.ROOMS) {
    const [rx, ry, rw, rh] = r.rect;
    const me = r.id === roomId;
    h += `<rect x="${rx + 0.2}" y="${ry + 0.2}" width="${rw - 0.4}" height="${rh - 0.4}" fill="${me ? '#b8202a' : '#c8b890'}" stroke="${INK}" stroke-width="${me ? 0.6 : 0.3}"/>`;
  }
  h += `<rect x="9.2" y="9.2" width="5.6" height="6.6" fill="#8a7a5a" stroke="${INK}" stroke-width=".3"/></g>`;
  return h;
}

/** 아르데코 모서리 부채 */
const fan = (x, y, rot, id) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 L22 0 A22 22 0 0 1 0 22Z" fill="url(#${id}g)" opacity=".95"/>
  <path d="M0 0 L21 5 M0 0 L17 13 M0 0 L10 19 M0 0 L4 21" stroke="#5a3a08" stroke-width="1" opacity=".7"/><path d="M0 0 L12 0 A12 12 0 0 1 0 12Z" fill="#1a0e08" opacity=".5"/></g>`;

/**
 * @param {string} id 카드 id
 * @param {{mini?: boolean, cls?: string}} o  mini: 작은 칸용 (이름을 크게, 부가 정보 생략)
 */
export function cardSvg(id, { mini = false, cls = '' } = {}) {
  const c = C.CARDS[id];
  const T = TYPE[c.type];
  const u = `cc${++seq}`;
  const sus = c.type === 'suspect' ? C.SUSPECT[id] : null;
  const accent = sus ? sus.color : T.band;
  const name = c.name;
  const sub = sus ? sus.title : c.type === 'weapon' ? `증거물 No.${String(C.WEAPONS.findIndex((w) => w.id === id) + 1).padStart(2, '0')}` : '밤의 저택 1층';
  const artH = mini ? 236 : 198;
  const art = `<image href="${artOf(id)}" x="18" y="44" width="214" height="${artH}" preserveAspectRatio="${c.type === 'suspect' ? 'xMidYMin' : 'xMidYMid'} slice"/>`;
  return `<svg class="ccard ${cls}" viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" data-card="${id}">
<defs>
  <linearGradient id="${u}p" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#f8f0da"/><stop offset=".6" stop-color="#eadcb8"/><stop offset="1" stop-color="#d8c498"/></linearGradient>
  <linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c0"/><stop offset=".35" stop-color="#e0b450"/><stop offset=".6" stop-color="#8a6018"/><stop offset=".85" stop-color="#e8c060"/><stop offset="1" stop-color="#fff0b0"/></linearGradient>
  <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.band}"/><stop offset="1" stop-color="${T.bandD}"/></linearGradient>
  <linearGradient id="${u}sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
  <radialGradient id="${u}v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
  <filter id="${u}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="${seq % 9}"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="${u}f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${(seq % 7) + 2}"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .1  0 0 0 -.9 .32"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <clipPath id="${u}w"><rect x="18" y="44" width="214" height="${artH}" rx="3"/></clipPath>
</defs>
<rect x="0.5" y="0.5" width="249" height="349" rx="14" fill="#140c08"/>
<rect x="5" y="5" width="240" height="340" rx="10" fill="url(#${u}p)"/>
<rect x="5" y="5" width="240" height="340" rx="10" fill="#fff" filter="url(#${u}n)"/>
<rect x="5" y="5" width="240" height="340" rx="10" fill="#fff" filter="url(#${u}f)"/>
<rect x="10" y="10" width="230" height="330" rx="7" fill="none" stroke="${T.band}" stroke-width="1.4" opacity=".7"/>
<!-- 머리 띠 -->
<path d="M12 12 H238 V36 H12Z" fill="url(#${u}b)"/>
<path d="M12 36 H238" stroke="url(#${u}g)" stroke-width="2"/>
<g transform="translate(125 29)" font-family="'Nanum Myeongjo',serif" font-weight="800" text-anchor="middle">
  <text x="0" y="0" font-size="15" fill="#f8e8b8" letter-spacing="6">${T.ko}</text>
</g>
<text x="22" y="28.5" font-family="'Cinzel',serif" font-weight="700" font-size="8" fill="#e8c878" letter-spacing="1.5">${T.en}</text>
<text x="228" y="28.5" text-anchor="end" font-family="'Cinzel',serif" font-weight="700" font-size="8" fill="#e8c878" letter-spacing="1.5">${T.en}</text>
<!-- 그림 -->
<rect x="18" y="44" width="214" height="${artH}" rx="3" fill="#0e0808"/>
<g clip-path="url(#${u}w)">${art}<rect x="18" y="44" width="214" height="${artH}" fill="url(#${u}v)"/>
  ${c.type === 'weapon' && !mini ? `<g transform="translate(150 206) rotate(-12) scale(.86)" opacity=".62"><rect x="-44" y="-13" width="88" height="26" rx="3" fill="none" stroke="#c8202a" stroke-width="3"/><text y="6" text-anchor="middle" font-family="'Special Elite','Courier New',monospace" font-weight="700" font-size="16" fill="#c8202a" letter-spacing="2">EVIDENCE</text></g>` : ''}
  ${c.type === 'room' && !mini ? plan(id, 166, 56, 1.55) : ''}
</g>
<rect x="18" y="44" width="214" height="${artH}" rx="3" fill="none" stroke="url(#${u}g)" stroke-width="4"/>
<rect x="23" y="49" width="204" height="${artH - 10}" rx="1" fill="none" stroke="url(#${u}g)" stroke-width="1" opacity=".8"/>
${fan(18, 44, 0, u)}${fan(232, 44, 90, u)}${fan(232, 44 + artH, 180, u)}${fan(18, 44 + artH, 270, u)}
${sus && !mini ? `<g transform="translate(52 78)"><circle r="11" fill="${sus.color}" stroke="url(#${u}g)" stroke-width="3"/><circle cx="-3.5" cy="-3.5" r="3.4" fill="#fff" opacity=".55"/></g>` : ''}
${mini ? `<rect x="12" y="276" width="226" height="62" rx="4" fill="url(#${u}b)"/>
<text x="125" y="322" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="${name.length > 3 ? 44 : 52}" fill="#fbf0d0">${name}</text>` : `
<!-- 메달 -->
<g transform="translate(125 ${44 + artH})"><circle r="17" fill="url(#${u}b)" stroke="url(#${u}g)" stroke-width="3.4"/><g color="#f4dc98" transform="scale(.82)">${ICON[c.type]}</g></g>
<!-- 이름판 -->
<text x="125" y="282" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="${name.length > 3 ? 27 : 31}" fill="${INK}" letter-spacing="2">${name}</text>
<text x="125" y="299" text-anchor="middle" font-family="'Cinzel',serif" font-weight="700" font-size="10" fill="${T.band}" letter-spacing="2.4">${EN[id] || ''}</text>
<path d="M60 309 H112 M138 309 H190" stroke="${accent}" stroke-width="1.4" opacity=".8"/><path d="M125 305 l4 4 -4 4 -4 -4Z" fill="${accent}"/>
<text x="125" y="328" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="700" font-size="11.5" fill="#5a4030" font-style="italic">${sub}</text>`}
<rect x="5" y="5" width="240" height="340" rx="10" fill="url(#${u}sh)" pointer-events="none"/>
</svg>`;
}

/** 카드 뒷면: 짙은 자주 벨벳 + 금박 아르데코 무늬 + 돋보기 문장 */
export function backSvg({ cls = '' } = {}) {
  const u = `cb${++seq}`;
  return `<svg class="ccard back ${cls}" viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c0"/><stop offset=".35" stop-color="#e0b450"/><stop offset=".6" stop-color="#8a6018"/><stop offset="1" stop-color="#f0cc68"/></linearGradient>
  <radialGradient id="${u}r" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#5a1422"/><stop offset="1" stop-color="#1e0610"/></radialGradient>
  <pattern id="${u}p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M15 0 L30 15 L15 30 L0 15Z" fill="none" stroke="#c89a40" stroke-width=".9" opacity=".35"/><path d="M15 6 A9 9 0 0 1 15 24 A9 9 0 0 1 15 6" fill="none" stroke="#c89a40" stroke-width=".6" opacity=".25"/></pattern>
</defs>
<rect x=".5" y=".5" width="249" height="349" rx="14" fill="#140608"/>
<rect x="5" y="5" width="240" height="340" rx="10" fill="url(#${u}r)"/>
<rect x="5" y="5" width="240" height="340" rx="10" fill="url(#${u}p)"/>
<rect x="14" y="14" width="222" height="322" rx="6" fill="none" stroke="url(#${u}g)" stroke-width="3"/>
<rect x="20" y="20" width="210" height="310" rx="3" fill="none" stroke="url(#${u}g)" stroke-width="1"/>
${[[20, 20, 0], [230, 20, 90], [230, 330, 180], [20, 330, 270]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 L30 0 A30 30 0 0 1 0 30Z" fill="url(#${u}g)" opacity=".85"/><path d="M0 0 L28 8 M0 0 L22 19 M0 0 L8 28" stroke="#5a3a08" stroke-width="1"/></g>`).join('')}
<g transform="translate(125 168)">
  <circle r="62" fill="#1e0610" stroke="url(#${u}g)" stroke-width="4"/><circle r="54" fill="none" stroke="url(#${u}g)" stroke-width="1"/>
  <circle cx="-8" cy="-10" r="24" fill="none" stroke="url(#${u}g)" stroke-width="7"/><circle cx="-8" cy="-10" r="18" fill="#3a0e18" opacity=".7"/>
  <path d="M9 7 L34 32" stroke="url(#${u}g)" stroke-width="10" stroke-linecap="round"/>
  <path d="M-18 -20 A14 14 0 0 1 -2 -24" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
</g>
<text x="125" y="268" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="24" fill="#f4dc98" letter-spacing="8">밤의 저택</text>
<text x="125" y="288" text-anchor="middle" font-family="'Cinzel',serif" font-weight="700" font-size="9" fill="#c89a40" letter-spacing="4">MANSION OF THE NIGHT</text>
</svg>`;
}
