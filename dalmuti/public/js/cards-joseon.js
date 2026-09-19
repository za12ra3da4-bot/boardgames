/* 달무티 확장판 · 조선 궁궐판 카드 그림
   임금부터 노비까지 12 계급 + 탈광대 + 암행어사 마패. 얼굴 · 손은 paint.js 를 같이 쓰고 옷 · 갓 · 소품 · 배경은 따로 그린다 */
import { INK, o, f, l, c, dot, face, body, hand, SKIN } from './paint.js';

/* ═════════ 배경 (240×300) ═════════ */
const pine = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-4 -30 6 -50 0 -80" stroke="#8a2a1a" stroke-width="7" fill="none"/>${[-70, -50, -30].map((yy, i) => `<ellipse cx="${i % 2 ? 10 : -10}" cy="${yy}" rx="${22 - i * 3}" ry="8" fill="#1a5a3a"/>`).join('')}</g>`;
const lattice = (x, y, w, h, light = '#f4e8c8') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${light}"/>${Array.from({ length: Math.floor(w / 16) }, (_, i) => `<path d="M${x + (i + 1) * 16} ${y} V${y + h}" stroke="#6a3a1a" stroke-width="2"/>`).join('')}${Array.from({ length: Math.floor(h / 20) }, (_, i) => `<path d="M${x} ${y + (i + 1) * 20} H${x + w}" stroke="#6a3a1a" stroke-width="2"/>`).join('')}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#4a2410" stroke-width="5"/>`;
const dancheong = (y) => `<rect x="0" y="${y}" width="240" height="22" fill="#2a7a5a"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${15 + i * 30}" cy="${y + 11}" r="7" fill="#e8c040"/><circle cx="${15 + i * 30}" cy="${y + 11}" r="3.4" fill="#c8303a"/><path d="M${i * 30} ${y + 2} h30" stroke="#3a6ac8" stroke-width="3"/>`).join('')}`;
export const BG_J = {
  // 일월오봉도: 붉은 해 · 흰 달 · 다섯 봉우리 · 소나무 · 물결
  ilwol: `<rect width="240" height="300" fill="#2a5a9a"/><circle cx="46" cy="60" r="20" fill="#d8303a"/><circle cx="194" cy="60" r="20" fill="#f4f0e6"/>
    <path d="M-10 230 L30 130 L60 190 L90 90 L120 170 L150 90 L180 190 L210 130 L250 230Z" fill="#1a6a5a" stroke="#0e3a30" stroke-width="3"/>
    <path d="M90 90 L100 120 L80 120Z M150 90 L160 120 L140 120Z M30 130 L38 150 L22 150Z M210 130 L218 150 L202 150Z" fill="#e8f0e0" opacity=".8"/>
    ${pine(20, 250, 0.9)}${pine(220, 250, 0.9)}
    <rect y="230" width="240" height="70" fill="#1a3a7a"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 22 - 10} ${250 + (i % 2) * 14} q11 -12 22 0" stroke="#f4f0e6" stroke-width="3" fill="none"/>`).join('')}`,
  palace: `<rect width="240" height="300" fill="#c8b890"/>${lattice(36, 60, 168, 170)}<path d="M0 0 H240 V40 H0Z" fill="#3a2a1a"/>${dancheong(38)}<rect x="0" y="40" width="30" height="260" fill="#a82a2a" stroke="#5a0e0e" stroke-width="3"/><rect x="210" y="40" width="30" height="260" fill="#a82a2a" stroke="#5a0e0e" stroke-width="3"/><rect y="250" width="240" height="50" fill="#6a4a2a"/>`,
  fortress: `<rect width="240" height="300" fill="#d8b890"/><circle cx="190" cy="60" r="26" fill="#e8703a" opacity=".8"/><path d="M0 150 h240 V300 H0Z" fill="#8a8a8a"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${(i % 4) * 60 + (Math.floor(i / 4) % 2) * 30 - 20}" y="${150 + Math.floor(i / 4) * 36}" width="58" height="34" rx="6" fill="#9a9a96" stroke="#5a5a56" stroke-width="2"/>`).join('')}
    <path d="M0 150 h40 v-18 h20 v18 h40 v-18 h20 v18 h40 v-18 h20 v18 h40 v-18 h20 v18" fill="#6a6a66" stroke="#3a3a36" stroke-width="3"/>${[30, 110, 190].map((x, i) => `<path d="M${x} 132 V40" stroke="#3a2410" stroke-width="3"/><path d="M${x} 40 h36 l-8 14 l8 14 h-36Z" fill="${['#c8303a', '#e8c040', '#2a4a9a'][i]}"/>`).join('')}`,
  temple: `<rect width="240" height="300" fill="#e8d8b0"/><path d="M0 170 L60 100 L110 150 L170 80 L240 140 V300 H0Z" fill="#6a8a6a"/><path d="M0 210 L80 160 L150 200 L240 170 V300 H0Z" fill="#4a6a4a"/>
    <path d="M40 150 Q120 110 200 150 L190 162 Q120 130 50 162Z" fill="#3a3a3a"/>${dancheong(162).replace(/width="240"/, 'width="140"').replace('x="0"', 'x="50"')}<rect x="60" y="184" width="120" height="70" fill="#a8402a"/>${lattice(80, 190, 80, 60)}
    <g transform="translate(206 200)"><path d="M0 -40 V0" stroke="#3a2410" stroke-width="2"/><ellipse cx="0" cy="10" rx="12" ry="16" fill="#e8503a"/><ellipse cx="0" cy="10" rx="20" ry="24" fill="#ffb060" opacity=".3"/></g>`,
  study: `<rect width="240" height="300" fill="#8a6a4a"/>${lattice(20, 30, 120, 150, '#f8ecc8')}<rect x="150" y="20" width="80" height="230" fill="#5a3a1a" stroke="#2a1a0a" stroke-width="3"/>${[50, 110, 170].map((y) => `<path d="M150 ${y} H230" stroke="#2a1a0a" stroke-width="5"/>${[0, 1, 2, 3].map((k) => `<rect x="${156 + k * 17}" y="${y - 28}" width="14" height="26" fill="${['#e8d8a8', '#c8a870', '#2a4a7a', '#e8d8a8'][k]}" stroke="#2a1a0a" stroke-width="1.4"/>`).join('')}`).join('')}<rect y="250" width="240" height="50" fill="#5a3a1a"/>`,
  herbs: `<rect width="240" height="300" fill="#7a5a3a"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${10 + (i % 6) * 38}" y="${14 + Math.floor(i / 6) * 44}" width="34" height="40" fill="#a87a4a" stroke="#4a2a14" stroke-width="2"/><circle cx="${27 + (i % 6) * 38}" cy="${40 + Math.floor(i / 6) * 44}" r="3.4" fill="#d8b050" stroke="#4a2a14" stroke-width="1"/><rect x="${17 + (i % 6) * 38}" y="${20 + Math.floor(i / 6) * 44}" width="20" height="10" fill="#f4ecd8"/>`).join('')}`,
  forge: `<rect width="240" height="300" fill="#2a1a14"/><ellipse cx="60" cy="230" rx="100" ry="80" fill="#e8601a" opacity=".45"/><ellipse cx="60" cy="240" rx="50" ry="36" fill="#ffb040" opacity=".7"/><path d="M0 250 H240 V300 H0Z" fill="#1a0e08"/>${Array.from({ length: 14 }, (_, i) => dot(40 + (i * 37) % 150, 120 + (i * 29) % 120, 2, '#ffd070', 0.9)).join('')}`,
  tavern: `<rect width="240" height="300" fill="#e8d8b0"/><path d="M-10 70 Q120 20 250 70 L250 90 Q120 44 -10 90Z" fill="#c8a860" stroke="#8a6a30" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 22} 60 q4 20 0 30" stroke="#a88040" stroke-width="2" fill="none"/>`).join('')}<rect x="0" y="90" width="240" height="160" fill="#b89a6a"/>${lattice(140, 110, 80, 90)}
    ${[30, 80].map((x, i) => `<ellipse cx="${x}" cy="${250 - i * 4}" rx="${26 - i * 4}" ry="${36 - i * 6}" fill="#6a3a1a" stroke="#2a1408" stroke-width="3"/><ellipse cx="${x}" cy="${214 - i * 2}" rx="${16 - i * 2}" ry="5" fill="#3a1a0a"/>`).join('')}<rect y="260" width="240" height="40" fill="#8a6a3a"/>`,
  road: `<rect width="240" height="300" fill="#b8d8e8"/><path d="M0 150 Q60 110 130 140 Q190 110 240 130 V300 H0Z" fill="#8ab06a"/><path d="M90 300 Q110 220 150 160 L160 160 Q140 230 150 300Z" fill="#d8c090"/>
    ${[36, 200].map((x, i) => `<g transform="translate(${x} 190)"><rect x="-10" y="-60" width="20" height="100" fill="#a87a4a" stroke="#3a2410" stroke-width="2.4"/><ellipse cx="0" cy="-60" rx="14" ry="10" fill="${i ? '#3a2a1a' : '#1a1a1a'}"/><circle cx="-4" cy="-40" r="4" fill="#fff"/><circle cx="4" cy="-40" r="4" fill="#fff"/><circle cx="-4" cy="-40" r="2" fill="#000"/><circle cx="4" cy="-40" r="2" fill="#000"/><path d="M-6 -24 q6 6 12 0" stroke="#3a2410" stroke-width="2" fill="none"/><path d="M0 -14 V30" stroke="#3a2410" stroke-width="1.4"/></g>`).join('')}`,
  river: `<rect width="240" height="300" fill="#d8e0d8"/><path d="M0 120 L50 70 L100 110 L160 50 L240 100 V160 H0Z" fill="#8a9a8a" opacity=".8"/><rect y="150" width="240" height="150" fill="#5a8aa8"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${(i * 47) % 220} ${170 + i * 12} h30" stroke="#d8ecf4" stroke-width="2"/>`).join('')}<path d="M150 180 Q190 196 236 180 L226 196 Q190 206 160 196Z" fill="#6a4a2a" stroke="#2a1a0a" stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${6 + i * 6} 300 Q${10 + i * 6} 240 ${2 + i * 7} ${200 + (i % 3) * 10}" stroke="#6a7a3a" stroke-width="2" fill="none"/>`).join('')}`,
  yard: `<rect width="240" height="300" fill="#c8d8e0"/><path d="M0 80 H240 V190 H0Z" fill="#b8905a"/>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${12 + i * 24}" cy="${110 + (i % 3) * 22}" rx="9" ry="6" fill="#9a7a4a"/>`).join('')}<path d="M-6 80 Q120 60 246 80 L246 68 Q120 48 -6 68Z" fill="#3a3a3a"/><rect y="190" width="240" height="110" fill="#c8a870"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${150 + (i % 3) * 22}" y="${220 + Math.floor(i / 3) * 16}" width="20" height="14" rx="6" fill="#8a5a2a" stroke="#3a2410" stroke-width="1.4"/>`).join('')}`,
  madang: `<rect width="240" height="300" fill="#140a1a"/>${[30, 210].map((x) => `<ellipse cx="${x}" cy="80" rx="50" ry="60" fill="#ff9a3a" opacity=".3"/><path d="M${x} 300 V90" stroke="#3a2410" stroke-width="5"/><path d="M${x - 10} 90 Q${x} 50 ${x + 10} 90Z" fill="#ffb040"/>`).join('')}${Array.from({ length: 9 }, (_, i) => `<circle cx="${14 + i * 27}" cy="262" r="16" fill="#0a0408"/>`).join('')}<rect y="270" width="240" height="30" fill="#0a0408"/>`,
  burst: `<rect width="240" height="300" fill="#6a0a10"/>${Array.from({ length: 18 }, (_, i) => `<path d="M120 140 L${120 + Math.cos(i * 0.349) * 300} ${140 + Math.sin(i * 0.349) * 300} L${120 + Math.cos(i * 0.349 + 0.17) * 300} ${140 + Math.sin(i * 0.349 + 0.17) * 300}Z" fill="#a81a24" opacity="${i % 2 ? 0.5 : 0.9}"/>`).join('')}<circle cx="120" cy="140" r="90" fill="#ffd070" opacity=".25"/>`,
};

/* 한복 깃 · 동정 */
const collar = (col = '#f8f4ea') => o('M84 192 L120 246 L132 230 L100 190Z', col, 2) + o('M156 192 L120 246 L112 234 L140 190Z', col, 2);
const cloth = (a, b) => `<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

export function portraitJoseon(r) {
  const P = (k, x) => ({ skin: SKIN[k][0], shade: SKIN[k][1], ...x });
  switch (r) {
    case 1: { // 임금: 익선관 · 붉은 곤룡포 · 가슴의 금빛 용 보 · 일월오봉도
      const p = P('a', { mood: 'calm', brow: '#2a1a10' });
      return { bg: 'ilwol', defs: cloth('#d8303a', '#7a0a14'), art:
        body('#d8303a', '#7a0a14') + o('M100 190 Q120 206 140 190 Q138 214 120 218 Q102 214 100 190Z', '#f8f4ea', 2)
        + c(120, 250, 26, 'url(#gold)', 2.4) + l('M104 252 C108 236 122 236 124 246 C126 256 138 258 138 244 M110 262 q10 -6 20 0', 2.4, '#8a1a10') + dot(114, 244, 2.4, '#8a1a10')
        + c(66, 232, 14, 'url(#gold)', 2) + c(174, 232, 14, 'url(#gold)', 2)
        + face(p)
        + o('M104 144 Q120 140 136 144 Q130 150 120 149 Q110 150 104 144Z', '#2a1a10', 1.4) + o('M112 158 Q120 176 128 158 Q120 162 112 158Z', '#2a1a10', 1.4)
        + o('M84 92 C80 58 98 46 120 46 C142 46 160 58 156 92 Q120 84 84 92Z', '#1a1a22')
        + o('M92 58 C84 28 110 22 112 50Z', '#1a1a22') + o('M148 58 C156 28 130 22 128 50Z', '#1a1a22')
        + l('M84 88 Q120 80 156 88', 2.4, '#d8a830') + l('M100 60 Q120 54 140 60', 1.4, '#d8a830', 0.7) };
    }
    case 2: { // 영의정: 날개 달린 사모 · 자줏빛 단령 · 학 흉배 · 긴 수염
      const p = P('b', { mood: 'sly', age: 0.9, brow: '#d8d4cc' });
      return { bg: 'palace', defs: cloth('#7a1a4a', '#3a0a22'), art:
        body('#7a1a4a', '#3a0a22') + o('M92 192 Q120 214 148 192', 'none', 3) + l('M92 192 Q120 214 148 192', 4, '#3a0a22')
        + `<rect x="92" y="222" width="56" height="52" fill="#1a2a5a" stroke="${INK}" stroke-width="2.4"/>` + l('M100 262 C110 240 124 236 132 244 C138 250 142 238 140 232 M112 248 l-10 -8 M130 244 l12 -6', 2.4, '#f4f0e6') + dot(140, 232, 2.4, '#d8303a')
        + face(p)
        + o('M104 146 Q120 140 136 146 Q128 152 120 150 Q112 152 104 146Z', '#e8e4dc', 1.4) + o('M110 156 C108 190 116 206 120 214 C124 206 132 190 130 156 Q120 162 110 156Z', '#e8e4dc', 1.6)
        + o('M86 92 C82 58 100 46 120 46 C140 46 158 58 154 92 Q120 84 86 92Z', '#1a1a22') + o('M100 54 C98 36 142 36 140 54Z', '#1a1a22')
        + `<ellipse cx="66" cy="70" rx="24" ry="8" fill="#1a1a22" opacity=".85" stroke="${INK}" stroke-width="2"/><ellipse cx="174" cy="70" rx="24" ry="8" fill="#1a1a22" opacity=".85" stroke="${INK}" stroke-width="2"/>`
        + hand(62, 262, p.skin, p.shade, 10) };
    }
    case 3: { // 대장군: 붉은 상모 전립 · 푸른 두정갑의 금 징 · 환도
      const p = P('b', { mood: 'stern', brow: '#1a0e08' });
      return { bg: 'fortress', defs: cloth('#2a3a7a', '#101a40'), art:
        body('#2a3a7a', '#101a40') + Array.from({ length: 24 }, (_, i) => dot(52 + (i % 8) * 20, 228 + Math.floor(i / 8) * 22, 3, '#e8c040')).join('') + l('M60 212 H180', 6, '#c8303a')
        + face(p)
        + o('M100 140 Q110 132 120 138 Q130 132 140 140 Q146 148 150 140 Q144 154 132 150 Q124 146 120 144 Q116 146 108 150 Q96 154 90 140 Q94 148 100 140Z', '#1a0e08', 1.4)
        + `<ellipse cx="120" cy="84" rx="66" ry="12" fill="#1a1a1a" stroke="${INK}" stroke-width="2.4"/>` + o('M90 84 C88 54 102 44 120 44 C138 44 152 54 150 84Z', '#1a1a1a')
        + o('M120 44 C104 30 110 12 120 4 C130 12 136 30 120 44Z', '#c8303a', 2) + o('M140 50 C170 30 190 36 206 22 C196 44 176 58 146 60Z', '#2a6a4a', 1.6) + c(120, 44, 5, '#e8c040', 1.6)
        + l('M176 300 L216 170', 7, INK) + l('M176 300 L216 170', 4, '#d8dce6') + o('M168 262 L196 272 L192 282 L164 272Z', '#d8a830', 2)
        + hand(180, 270, p.skin, p.shade, -20) };
    }
    case 4: { // 상궁: 얹은머리(가체) · 녹색 당의 금박 · 노리개
      const p = P('a', { fem: true, mood: 'calm', lips: '#b83a4a', w: 0.94 });
      return { bg: 'palace', defs: cloth('#3a8a5a', '#15402a'), art:
        body('#3a8a5a', '#15402a') + Array.from({ length: 10 }, (_, i) => dot(56 + (i % 5) * 30, 240 + Math.floor(i / 5) * 26, 3.4, '#e8c040', 0.9)).join('') + collar()
        + o('M112 246 L108 290 M128 246 L132 290', 'none') + l('M114 244 L110 288 M126 244 L130 288', 4, '#c8303a') + c(120, 242, 6, '#e8c040', 1.6)
        + o('M78 120 C66 80 88 60 120 60 C152 60 174 80 162 120 C158 96 146 84 120 84 C94 84 82 96 78 120Z', '#1a1010')
        + face(p)
        + `<ellipse cx="120" cy="58" rx="58" ry="20" fill="#1a1010" stroke="${INK}" stroke-width="2.4"/>` + l('M70 58 Q120 40 170 58 M74 64 Q120 48 166 64', 2, '#3a2a2a')
        + l('M52 60 H188', 4, '#e8c040') + c(52, 60, 4, '#c8303a', 1.4) + c(188, 60, 4, '#c8303a', 1.4) };
    }
    case 5: { // 스님: 민머리 · 잿빛 장삼 · 붉은 가사 · 목탁
      const p = P('b', { mood: 'calm', w: 1.02 });
      return { bg: 'temple', defs: cloth('#9a9a96', '#5a5a56'), art:
        body('#9a9a96', '#5a5a56') + o('M40 290 L150 190 L186 206 L90 290Z', '#8a3a2a', 2) + l('M60 280 L160 196 M76 288 L172 200 M110 250 L140 270 M86 270 L118 290', 1.4, '#5a1a10')
        + face(p)
        + f('M88 100 C86 70 102 60 120 60 C138 60 154 70 152 100 C146 80 134 72 120 72 C104 72 92 82 88 100Z', '#7a8a8a', 0.35)
        + l('M100 72 q20 -8 40 0', 1.2, '#8a5a40', 0.5)
        + `<ellipse cx="62" cy="252" rx="26" ry="20" fill="#a86a2a" stroke="${INK}" stroke-width="2.4"/>` + l('M44 252 q18 6 36 0', 2.4, '#4a2410') + l('M82 234 L104 214', 4, '#8a5a2a')
        + Array.from({ length: 9 }, (_, i) => dot(140 + Math.cos(i * 0.7) * 20, 250 + Math.sin(i * 0.7) * 20, 3.4, '#5a2a14')).join('')
        + hand(100, 222, p.skin, p.shade, 30) };
    }
    case 6: { // 선비: 흑립(갓) · 흰 도포 · 갓끈 · 합죽선
      const p = P('a', { mood: 'calm' });
      return { bg: 'study', defs: cloth('#f4f0e6', '#b8b0a0'), art:
        body('#f4f0e6', '#b8b0a0') + collar('#1a1a22') + l('M60 262 H180', 4, '#3a3a6a')
        + face(p)
        + o('M108 148 Q120 152 132 148 Q124 164 120 170 Q116 164 108 148Z', '#1a1010', 1.2)
        + l('M92 90 C88 130 92 170 100 200 M148 90 C152 130 148 170 140 200', 1.4, '#1a1010') + Array.from({ length: 6 }, (_, i) => dot(96 + i * 1.2, 110 + i * 16, 2.2, '#c8a870')).join('') + Array.from({ length: 6 }, (_, i) => dot(144 - i * 1.2, 110 + i * 16, 2.2, '#c8a870')).join('')
        + `<ellipse cx="120" cy="88" rx="74" ry="14" fill="#1a1a22" opacity=".82" stroke="${INK}" stroke-width="2"/>` + o('M100 88 V44 Q120 36 140 44 V88Z', '#1a1a22') + l('M100 78 Q120 72 140 78', 1.4, '#4a4a5a')
        + o('M150 262 L206 206 Q222 236 210 262 Q182 272 150 262Z', '#f4ecd0', 2) + l('M150 262 L206 208 M150 262 L212 222 M150 262 L214 240 M150 262 L210 256', 1.2, '#8a6a3a')
        + hand(152, 262, p.skin, p.shade, 20) };
    }
    case 7: { // 의원: 탕건 · 쪽빛 두루마기 · 침통과 약첩
      const p = P('b', { mood: 'calm', age: 0.5 });
      return { bg: 'herbs', defs: cloth('#4a6a8a', '#1e3048'), art:
        body('#4a6a8a', '#1e3048') + collar()
        + face(p)
        + o('M108 150 Q120 154 132 150 Q126 160 120 162 Q114 160 108 150Z', '#3a2a1a', 1.2)
        + o('M88 92 C86 66 100 56 120 56 C140 56 154 66 152 92 Q120 84 88 92Z', '#1a1a22') + o('M96 64 Q120 50 144 64 L140 76 Q120 66 100 76Z', '#2a2a32', 1.4)
        + o('M40 244 H92 V278 H40Z', '#f4ecd8', 2) + l('M40 244 L66 262 L92 244', 1.6, '#8a6a3a') + l('M58 244 v-10 h16 v10', 2, '#c8303a')
        + l('M176 280 L200 196', 2, '#d8dce6') + l('M184 280 L206 200', 2, '#d8dce6') + o('M170 270 H200 V300 H170Z', '#8a5a2a', 2)
        + hand(186, 244, p.skin, p.shade, -10) };
    }
    case 8: { // 대장장이: 머리띠 · 걷어붙인 팔 · 쇠망치 · 모루와 불똥
      const p = P('c', { mood: 'stern', w: 1.08 });
      return { bg: 'forge', defs: cloth('#6a4a2a', '#2e1e10'), art:
        body('#6a4a2a', '#2e1e10') + o('M92 194 L120 250 L148 194', '#c89068', 2)
        + o('M40 290 C44 250 56 226 72 216 L80 290Z', p.skin, 2)
        + face(p)
        + o('M84 88 C84 58 100 46 120 46 C140 46 156 58 156 88 C150 72 136 64 120 64 C104 64 90 72 84 88Z', '#1a1010')
        + o('M82 90 Q120 80 158 90 L158 100 Q120 90 82 100Z', '#f4f0e6', 2) + o('M156 92 L178 104 L170 112 L154 100Z', '#f4f0e6', 1.6)
        + o('M150 280 H214 V260 Q182 250 150 260Z', '#3a3a42', 2)
        + l('M70 230 L40 150', 7, '#6a4a2a') + o('M22 138 H58 V162 H22Z', '#5a5a62', 2.4)
        + Array.from({ length: 8 }, (_, i) => l(`M180 256 l${-20 + i * 6} ${-14 - (i % 3) * 8}`, 2, '#ffd070')).join('')
        + hand(72, 226, p.skin, p.shade, -30) };
    }
    case 9: { // 주모: 가르마 탄 쪽머리 · 비녀 · 노란 저고리와 붉은 고름 · 막걸리 사발
      const p = P('a', { fem: true, mood: 'calm', eye: '#2a1a10', brow: '#2a1810', lips: '#c8505a', w: 0.9 });
      return { bg: 'tavern', defs: cloth('#f4d890', '#c8a050'), art:
        body('#f4d890', '#c8a050')
        + o('M40 290 C44 262 52 244 66 236 L74 290Z M200 290 C196 262 188 244 174 236 L166 290Z', '#8a2a3a', 2)
        + o('M86 192 L120 250 L132 234 L102 190Z', '#f8f4ea', 2) + o('M154 192 L120 250 L110 236 L138 190Z', '#f8f4ea', 2)
        + o('M112 250 C98 262 94 280 100 292 L110 292 C108 280 112 266 120 256Z', '#c8303a', 1.8) + o('M126 250 C140 264 146 280 142 292 L132 292 C134 280 130 266 120 256Z', '#c8303a', 1.8)
        + c(120, 252, 7, '#c8303a', 1.8)
        + `<ellipse cx="150" cy="156" rx="18" ry="13" fill="#1a1010" stroke="${INK}" stroke-width="2"/>` + l('M126 158 H182', 3.4, '#e0b030') + c(182, 158, 3.4, '#c8303a', 1.2)
        + face(p)
        + o('M84 114 C80 76 98 58 120 58 C142 58 160 76 156 114 C154 96 146 84 134 80 C128 78 122 76 120 70 C118 76 112 78 106 80 C94 84 86 96 84 114Z', '#1a1010')
        + l('M120 60 V72', 1.6, '#4a3a3a') + l('M100 66 Q110 62 118 64 M122 64 Q132 62 142 68', 1.2, '#4a3a3a', 0.8)
        + o('M150 214 Q150 236 170 238 Q190 236 190 214Z', '#f8f4ea', 2) + f('M154 216 Q170 222 186 216 Q170 213 154 216Z', '#e8e0c8')
        + hand(170, 244, p.skin, p.shade, -6) };
    }
    case 10: { // 보부상: 목화송이 단 패랭이 · 지게 · 봇짐
      const p = P('c', { mood: 'happy' });
      return { bg: 'road', defs: cloth('#c8b890', '#7a6a4a'), art:
        l('M60 300 L70 140 M180 300 L170 140 M66 190 H174 M64 240 H176', 7, '#6a4a2a')
        + o('M54 136 Q120 110 186 136 L186 186 Q120 200 54 186Z', '#a87a4a', 2.4) + l('M60 150 Q120 132 180 150 M60 170 Q120 152 180 170', 1.6, '#6a4a2a')
        + body('#c8b890', '#7a6a4a') + collar('#e8e0c8')
        + face(p)
        + `<ellipse cx="120" cy="86" rx="62" ry="12" fill="#d8c080" stroke="${INK}" stroke-width="2.4"/>` + o('M92 86 C90 60 104 50 120 50 C136 50 150 60 148 86Z', '#d8c080')
        + l('M92 80 Q120 72 148 80', 2, '#8a6a3a') + c(88, 82, 8, '#fbf8f0', 1.6) + c(152, 82, 8, '#fbf8f0', 1.6) };
    }
    case 11: { // 사공: 삿갓 · 도롱이 · 노
      const p = P('c', { mood: 'calm', age: 0.6 });
      return { bg: 'river', defs: cloth('#8a8a6a', '#4a4a30'), art:
        body('#8a8a6a', '#4a4a30') + Array.from({ length: 14 }, (_, i) => l(`M${40 + i * 12} 214 l-4 76`, 1.6, '#4a4a30', 0.8)).join('')
        + face(p)
        + o('M40 96 L120 30 L200 96 Q120 86 40 96Z', '#c8a860', 2.4) + l('M60 88 L120 40 L180 88 M80 92 L120 44 L160 92 M100 94 L120 46 L140 94', 1.2, '#8a6a30')
        + l('M104 96 L110 160 M136 96 L130 160', 1.2, '#3a2410')
        + l('M196 300 L150 140', 7, '#8a5a2a') + o('M198 300 L218 250 L230 256 L212 300Z', '#8a5a2a', 2)
        + hand(170, 214, p.skin, p.shade, -20) };
    }
    case 12: { // 노비: 상투에 질끈 맨 수건 · 기운 무명옷 · 싸리비
      const p = P('c', { mood: 'worry', age: 0.4, w: 0.95 });
      return { bg: 'yard', defs: cloth('#d8d0bc', '#8a8270'), art:
        body('#d8d0bc', '#8a8270') + collar('#b8b0a0') + o('M60 242 h28 v22 h-28Z', '#a89a80', 1.6) + o('M150 256 h24 v20 h-24Z', '#9a9080', 1.6) + l('M62 246 h24 M62 254 h24', 1, '#6a6050')
        + o('M84 92 C84 62 100 52 120 52 C140 52 156 62 156 92 C150 76 136 70 120 70 C104 70 90 76 84 92Z', '#1a1010')
        + face(p)
        + o('M112 52 C110 34 130 34 128 52Z', '#1a1010', 1.6) + o('M84 84 Q120 72 156 84 L156 94 Q120 82 84 94Z', '#e8e0c8', 2) + o('M154 86 L172 98 L162 104 L152 94Z', '#e8e0c8', 1.4)
        + l('M200 300 V150', 5, '#8a6a3a') + Array.from({ length: 9 }, (_, i) => l(`M200 150 l${-20 + i * 5} -40`, 1.6, '#a88a4a')).join('')
        + hand(198, 222, p.skin, p.shade, 0) };
    }
    case 14: { // 마패: 말 세 마리 새긴 구리 마패, 붉은 술 · 쥔 손
      const horse = (x, y) => `<g transform="translate(${x} ${y})">${o('M-16 0 C-14 -10 -4 -12 6 -10 L12 -18 L16 -14 L12 -6 C14 0 12 4 8 4 L8 14 M-12 2 L-14 14 M-4 4 L-4 14 M4 4 L6 14', '#5a3010', 1.4)}</g>`;
      return { bg: 'burst', defs: cloth('#d8a060', '#8a5a20'), art:
        l('M120 210 C112 240 128 250 120 290', 8, '#c8303a') + l('M110 250 L120 290 L130 250', 3, '#e8503a')
        + `<circle cx="120" cy="130" r="80" fill="url(#gold)" stroke="${INK}" stroke-width="3.4"/><circle cx="120" cy="130" r="70" fill="none" stroke="#8a5a10" stroke-width="2"/>`
        + o('M112 46 H128 V56 H112Z', '#8a5a10', 2) + horse(90, 112) + horse(120, 112) + horse(150, 112)
        + `<text x="120" y="176" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="24" fill="#5a3010">馬 牌</text>`
        + hand(120, 222, SKIN.b[0], SKIN.b[1], 0) + l('M100 212 Q120 206 140 212', 5, '#1a1a22') };
    }
    default: { // 탈광대: 하회탈 · 색동 소매 · 부채 춤
      const p = P('a', { mood: 'happy' });
      const sd = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">${['#c8303a', '#e8c040', '#2a8a4a', '#2a4a9a', '#f4f0e6'].map((cl, i) => `<rect x="-14" y="${i * 10}" width="28" height="10" fill="${cl}"/>`).join('')}<rect x="-14" y="0" width="28" height="50" fill="none" stroke="${INK}" stroke-width="2"/></g>`;
      return { bg: 'madang', defs: cloth('#f4f0e6', '#b8b0a0'), art:
        body('#f4f0e6', '#b8b0a0') + sd(52, 208, 30) + sd(188, 208, -30) + collar('#c8303a')
        + face(p)
        + o('M78 110 C72 70 96 50 120 50 C144 50 168 70 162 110 L160 150 L80 150Z', '#1a1010')
        + `<path d="M82 104 C80 68 100 54 120 54 C140 54 160 68 158 104 C158 130 152 148 138 152 L102 152 C88 148 82 130 82 104Z" fill="#d8b078" stroke="${INK}" stroke-width="3"/>`
        + f('M86 104 C86 128 92 144 104 150 L102 152 C88 148 82 130 82 104Z', '#a8804a', 0.6) + l('M92 70 Q120 58 148 70', 1.4, '#a8804a', 0.7)
        + l('M82 110 L66 118 M158 110 L174 118', 2, '#6a4a2a')
        + l('M94 96 Q104 88 114 96 M126 96 Q136 88 146 96', 3, '#3a2410') + l('M96 106 Q104 100 112 106 M128 106 Q136 100 144 106', 3.4, INK)
        + l('M112 108 Q118 124 114 128 Q120 132 126 128', 2, '#8a5a30') + dot(98, 122, 6, '#e07a6a', 0.6) + dot(142, 122, 6, '#e07a6a', 0.6)
        + o('M96 154 Q120 178 144 154 Q134 172 120 174 Q106 172 96 154Z', '#d8b078') + l('M102 152 Q120 162 138 152', 2.4, INK) + dot(98, 156, 2, INK) + dot(142, 156, 2, INK)
        + o('M84 76 C80 50 100 40 120 40 C140 40 160 50 156 76 Q120 64 84 76Z', '#1a1010')
        + o('M172 170 L214 120 Q232 150 222 176 Q196 186 172 170Z', '#c8303a', 2) + l('M172 170 L214 122 M172 170 L222 138 M172 170 L226 158 M172 170 L222 176', 1.4, '#e8c040')
        + hand(176, 176, p.skin, p.shade, -30) };
    }
  }
}

/** 조선판 카드 뒷면: 쪽빛 비단 · 태극 문양 · 오방색 테 */
export function backJoseon(id) {
  return `<defs><pattern id="${id}p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 Q7.5 5 15 15 T30 15" fill="none" stroke="#c8a040" stroke-width="1.2" opacity=".45"/></pattern>
<radialGradient id="${id}g" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2a3a7a"/><stop offset="1" stop-color="#0e1438"/></radialGradient></defs>
<rect x="1" y="1" width="238" height="358" rx="16" fill="#0a0a1a"/><rect x="4" y="4" width="232" height="352" rx="14" fill="url(#${id}g)"/>
${['#c8303a', '#e8c040', '#2a8a4a', '#f4f0e6', '#1a1a1a'].map((cl, i) => `<rect x="${10 + i * 2}" y="${10 + i * 2}" width="${220 - i * 4}" height="${340 - i * 4}" rx="${10 - i}" fill="none" stroke="${cl}" stroke-width="2"/>`).join('')}
<rect x="22" y="22" width="196" height="316" rx="6" fill="url(#${id}p)"/>
<g transform="translate(120 170)"><circle r="54" fill="#f4f0e6" stroke="#e0b030" stroke-width="4"/><path d="M-50 0 A50 50 0 0 1 50 0 A25 25 0 0 1 0 0 A25 25 0 0 0 -50 0Z" fill="#c8303a"/><path d="M-50 0 A50 50 0 0 0 50 0 A25 25 0 0 0 0 0 A25 25 0 0 1 -50 0Z" fill="#2a4a9a"/></g>
<text x="120" y="268" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="20" fill="#f4dc98" letter-spacing="4">조선 궁궐판</text>`;
}
