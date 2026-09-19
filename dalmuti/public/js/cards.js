/* 왕궁의 달무티 카드 그림: 계급마다 다른 인물 초상 (얼굴 · 옷 · 소품 · 배경 전부 따로 그린다)
   카드 240×360, 초상 창 212×262 */
import { INK, o, f, l, c, dot, face, body, hand, SKIN } from './paint.js';
import { portraitJoseon, BG_J, backJoseon } from './cards-joseon.js';

/* ═════════ 배경 ═════════ */
const BG = {
  throne: `<rect width="240" height="300" fill="#5a0e14"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 32} 0 Q${i * 32 + 16} 150 ${i * 32} 300" stroke="#3a060a" stroke-width="10" fill="none"/>`).join('')}<path d="M40 300 L50 40 Q120 0 190 40 L200 300Z" fill="#c89a30" opacity=".35"/><path d="M60 300 L66 60 Q120 26 174 60 L180 300Z" fill="#7a1018"/>`,
  cathedral: `<rect width="240" height="300" fill="#1a1630"/><path d="M50 300 V110 Q120 10 190 110 V300Z" fill="#2a2450"/>${[['#c83a3a', 90, 90], ['#3a6ac8', 150, 90], ['#e8c040', 120, 60], ['#3aa86a', 100, 140], ['#a83ac8', 140, 140]].map(([cl, x, y]) => `<path d="M${x} ${y} l14 -14 l14 14 l-14 14Z" fill="${cl}" opacity=".75"/>`).join('')}<path d="M120 20 V180 M70 110 H170" stroke="#0e0a1a" stroke-width="5"/>`,
  banners: `<rect width="240" height="300" fill="#6a7a8a"/><path d="M0 220 H240 V300 H0Z" fill="#4a3a2a"/>${[20, 80, 170].map((x, i) => `<path d="M${x} 0 V120 L${x + 22} 100 L${x + 44} 120 V0Z" fill="${['#8a1a1a', '#1a3a8a', '#c89a20'][i]}" stroke="#1a0e08" stroke-width="2"/>`).join('')}`,
  manor: `<rect width="240" height="300" fill="#3a5a3a"/><rect x="30" y="30" width="180" height="220" fill="#8ab0c8"/><path d="M30 140 H210 M120 30 V250" stroke="#2a1a10" stroke-width="8"/><path d="M0 0 H60 Q40 150 0 300Z M240 0 H180 Q200 150 240 300Z" fill="#6a1a2a"/>`,
  cloister: `<rect width="240" height="300" fill="#c8b890"/>${[0, 80, 160].map((x) => `<path d="M${x} 300 V120 Q${x + 40} 60 ${x + 80} 120 V300" fill="#8a7a5a" stroke="#5a4a30" stroke-width="4"/>`).join('')}<rect y="250" width="240" height="50" fill="#6a5a40"/>`,
  castle: `<rect width="240" height="300" fill="#8ab8d8"/><path d="M0 120 h30 v-20 h20 v20 h30 v-20 h20 v20 h30 v-20 h20 v20 h30 v-20 h20 v20 h40 V300 H0Z" fill="#8a8a92" stroke="#4a4a52" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${(i % 4) * 60 + (Math.floor(i / 4) % 2) * 30} ${140 + Math.floor(i / 4) * 40} h60" stroke="#5a5a62" stroke-width="2"/>`).join('')}`,
  workshop: `<rect width="240" height="300" fill="#8a5a3a"/><path d="M0 60 H240 M0 64 H240" stroke="#4a2a14" stroke-width="4"/>${[30, 70, 110, 150, 190].map((x, i) => `<rect x="${x}" y="20" width="26" height="36" rx="4" fill="${['#c83a3a', '#3a6ac8', '#e8c040', '#3aa86a', '#e8e0d0'][i]}" stroke="#2a1a10" stroke-width="2"/>`).join('')}`,
  bricks: `<rect width="240" height="300" fill="#a85a3a"/>${Array.from({ length: 16 }, (_, r) => Array.from({ length: 6 }, (_, k) => `<rect x="${k * 44 + (r % 2) * 22 - 22}" y="${r * 20}" width="42" height="18" fill="${r % 3 ? '#b8643e' : '#9a4e30'}" stroke="#6a3020" stroke-width="1.4"/>`).join('')).join('')}`,
  kitchen: `<rect width="240" height="300" fill="#6a4a30"/><path d="M0 80 H240" stroke="#3a2414" stroke-width="6"/>${[40, 100, 170].map((x, i) => `<path d="M${x} 80 v14" stroke="#2a1a10" stroke-width="2"/><ellipse cx="${x}" cy="${104 + i * 2}" rx="${16 + i * 3}" ry="10" fill="#b87a3a" stroke="#2a1a10" stroke-width="2"/>`).join('')}<rect y="250" width="240" height="50" fill="#3a2414"/>`,
  meadow: `<rect width="240" height="300" fill="#a8d0e8"/><path d="M0 180 Q60 150 120 170 Q180 150 240 175 V300 H0Z" fill="#7ab05a"/><path d="M0 230 Q80 200 240 225 V300 H0Z" fill="#5a9a3a"/>${[40, 190].map((x) => `<ellipse cx="${x}" cy="60" rx="30" ry="12" fill="#fff" opacity=".85"/>`).join('')}`,
  quarry: `<rect width="240" height="300" fill="#c8a878"/><path d="M0 120 L60 80 L110 110 L170 70 L240 100 V300 H0Z" fill="#9a8a7a" stroke="#6a5a4a" stroke-width="3"/><path d="M20 200 l40 -20 l30 20 M140 160 l50 -10 l30 30" stroke="#6a5a4a" stroke-width="3" fill="none"/>`,
  field: `<rect width="240" height="300" fill="#e8c890"/><path d="M0 170 H240 V300 H0Z" fill="#c8a040"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 18} 300 L${i * 18 + 6} 170" stroke="#a88020" stroke-width="2"/>`).join('')}<circle cx="190" cy="60" r="22" fill="#f8e070"/>`,
  stage: `<rect width="240" height="300" fill="#1a0a2a"/><path d="M0 0 H70 Q50 150 60 300 H0Z M240 0 H170 Q190 150 180 300 H240Z" fill="#8a1a3a"/><ellipse cx="120" cy="120" rx="100" ry="140" fill="#f8e8a0" opacity=".18"/>`,
};

/* ═════════ 계급별 인물 ═════════ */
function portrait(r) {
  const P = (k, x) => ({ skin: SKIN[k][0], shade: SKIN[k][1], ...x });
  const cloth = (a, b) => `<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  switch (r) {
    case 1: { // 대달무티: 흰 수염의 늙은 왕, 담비 털 망토, 홀과 보주
      const p = P('a', { age: 1, mood: 'sly', brow: '#e8e4dc' });
      return { bg: 'throne', defs: cloth('#c8202a', '#6a0a10'), art:
        body('#c8202a', '#6a0a10')
        + o('M40 250 C70 208 170 208 200 250 L200 272 C170 236 70 236 40 272Z', '#f4f0e6') + [60, 90, 120, 150, 180].map((x) => `<path d="M${x} 250 l3 8 l-6 0Z" fill="#1a1a1a"/>`).join('')
        + face(p)
        + o('M92 136 C96 180 110 214 120 222 C130 214 144 180 148 136 C140 150 130 156 120 156 C110 156 100 150 92 136Z', '#f4f0ea') + l('M104 170 q6 20 16 40 M136 170 q-6 20 -16 40 M120 160 v56', 1.2, '#b8b0a4')
        + o('M104 146 Q120 142 136 146 Q128 152 120 150 Q112 152 104 146Z', '#e8e4dc', 1.6)
        + o('M82 72 L78 36 L96 54 L108 28 L120 50 L132 28 L144 54 L162 36 L158 72 Q120 62 82 72Z', 'url(#gold)') + [96, 120, 144].map((x, i) => c(x, 62, 4.5, ['#c8202a', '#2a6ac8', '#1a9a4a'][i], 1.4)).join('') + [78, 108, 132, 162].map((x) => c(x, [36, 28, 28, 36][[78, 108, 132, 162].indexOf(x)], 4, '#fff4c0', 1.4)).join('')
        + l('M196 290 L182 180', 7, INK) + l('M196 290 L182 180', 4, '#d8a830') + c(181, 172, 11, 'url(#gold)') + l('M181 160 v-10 M176 155 h10', 2.4, '#d8a830')
        + hand(188, 232, p.skin, p.shade, -20) };
    }
    case 2: { // 대주교: 높은 주교관, 흰 · 보라 제의, 황금 목장
      const p = P('b', { age: 0.8, mood: 'calm' });
      return { bg: 'cathedral', defs: cloth('#f4f0e6', '#b8b0a0'), art:
        body('#f4f0e6', '#b8b0a0') + o('M100 190 L120 290 L140 190 Q120 200 100 190Z', '#6a2a8a') + o('M112 214 h16 M120 204 v26', 'none', 4) + l('M112 214 h16 M120 204 v26', 4, '#d8a830')
        + face(p)
        + o('M86 80 C84 40 104 10 120 4 C136 10 156 40 154 80 Q120 70 86 80Z', '#f8f4ea') + l('M120 12 v58 M104 34 h32', 5, '#d8a830') + l('M86 80 Q120 70 154 80', 4, '#d8a830')
        + l('M38 300 V120', 6, INK) + l('M38 300 V120', 3.4, '#d8a830') + o('M38 124 C38 96 62 90 66 108 C68 118 58 124 52 118', 'none', 5) + l('M38 124 C38 96 62 90 66 108 C68 118 58 124 52 118', 3.4, '#d8a830')
        + hand(40, 220, p.skin, p.shade, 10) };
    }
    case 3: { // 원수: 콧수염 · 깃털 모자 · 흉갑 · 붉은 띠 · 지휘봉
      const p = P('b', { mood: 'stern', brow: '#4a2a18' });
      return { bg: 'banners', defs: cloth('#c8ccd6', '#6a6e7a'), art:
        body('#c8ccd6', '#6a6e7a') + l('M60 210 L180 280', 16, '#a81a1a') + l('M72 230 Q120 250 168 230', 2, '#fff', 0.5)
        + face(p)
        + o('M100 140 Q110 132 120 138 Q130 132 140 140 Q146 146 150 138 Q146 152 134 148 Q126 146 120 144 Q114 146 106 148 Q94 152 90 138 Q94 146 100 140Z', '#4a2a18', 1.6)
        + o('M70 84 Q120 58 170 84 Q160 94 120 88 Q80 94 70 84Z', '#1a2a4a') + o('M88 84 C84 60 100 50 120 50 C140 50 156 60 152 84Z', '#1a2a4a')
        + o('M150 60 C176 30 196 40 206 20 C196 50 180 64 156 72Z', '#f4f0e6', 1.8) + o('M152 66 C170 50 188 54 200 44', 'none', 1.4)
        + l('M170 290 L204 196', 8, INK) + l('M170 290 L204 196', 5, '#2a1a10') + c(205, 192, 6, '#d8a830')
        + hand(178, 256, p.skin, p.shade, -30) };
    }
    case 4: { // 남작 부인: 틀어 올린 머리 · 티아라 · 진주 목걸이 · 부채
      const p = P('a', { fem: true, mood: 'sly', eye: '#2a5a3a', brow: '#5a3018', lips: '#b83a4a', w: 0.94 });
      return { bg: 'manor', defs: cloth('#2a7a5a', '#0e3a28'), art:
        body('#2a7a5a', '#0e3a28') + o('M76 206 Q120 236 164 206 L164 218 Q120 250 76 218Z', '#f4e8d0') + [86, 98, 110, 122, 134, 146].map((x, i) => c(x + 4, 222 + Math.sin(i * 0.9) * 6, 4, '#fbf6ec', 1.2)).join('')
        + o('M74 120 C60 60 90 30 120 30 C150 30 180 60 166 120 C162 96 150 84 120 82 C90 84 78 96 74 120Z', '#6a3a18')
        + face(p)
        + o('M92 60 C96 20 144 20 148 60 Q120 44 92 60Z', '#6a3a18') + o('M106 28 C104 8 136 8 134 28 Q120 20 106 28Z', '#5a2a10')
        + o('M92 60 L100 48 L110 58 L120 42 L130 58 L140 48 L148 60 Q120 52 92 60Z', '#e8e8f0') + c(120, 50, 4, '#c83a6a', 1.2)
        + o('M150 250 L200 200 Q214 226 204 250 Q180 262 150 250Z', '#e8c0d0') + l('M150 250 L200 204 M150 250 L206 214 M150 250 L208 230 M150 250 L204 244', 1.2, '#8a4a6a')
        + hand(152, 254, p.skin, p.shade, 20) };
    }
    case 5: { // 수녀원장: 흰 두건 · 검은 베일 · 묵주 · 촛불
      const p = P('a', { fem: true, mood: 'calm', w: 0.92, lips: '#a86a5a' });
      return { bg: 'cloister', defs: cloth('#2a2a30', '#0e0e12'), art:
        body('#2a2a30', '#0e0e12')
        + o('M70 290 C60 180 70 80 120 60 C170 80 180 180 170 290Z', '#1a1a20')
        + o('M84 150 C80 100 96 72 120 72 C144 72 160 100 156 150 C150 176 90 176 84 150Z', '#f8f6f0')
        + face(p)
        + o('M84 96 C90 70 150 70 156 96 Q120 84 84 96Z', '#f8f6f0') + o('M88 176 Q120 196 152 176 L150 200 Q120 214 90 200Z', '#f8f6f0')
        + l('M100 200 Q120 250 140 200', 2, '#8a6a4a') + l('M120 236 v22 M112 244 h16', 3.4, '#d8a830')
        + o('M170 300 V218 h16 V300Z', '#f4ecd8') + o('M178 214 Q186 200 178 186 Q170 200 178 214Z', '#f8b040', 1.4) + `<ellipse cx="178" cy="200" rx="18" ry="22" fill="#ffd070" opacity=".3"/>`
        + hand(170, 250, p.skin, p.shade, 0) };
    }
    case 6: { // 기사: 투구(얼굴은 보이게) · 사슬 갑옷 · 방패 · 검
      const p = P('b', { mood: 'stern' });
      return { bg: 'castle', defs: cloth('#9aa0aa', '#4a4e58'), art:
        body('#9aa0aa', '#4a4e58') + Array.from({ length: 30 }, (_, i) => `<path d="M${40 + (i % 10) * 16} ${220 + Math.floor(i / 10) * 20} q8 8 16 0" stroke="#5a5e68" stroke-width="1.4" fill="none"/>`).join('')
        + face(p)
        + o('M80 110 C78 60 98 40 120 40 C142 40 162 60 160 110 L150 112 C150 80 138 70 120 70 C102 70 90 80 90 112Z', 'url(#steel)') + o('M118 40 V112 M122 40 V112', 'none', 1.6) + o('M112 40 C112 20 128 20 128 40', '#c83a3a')
        + o('M24 214 H90 V260 Q90 296 57 306 Q24 296 24 260Z', '#e8e0d0') + l('M57 214 V300 M24 250 H90', 8, '#c83a3a')
        + l('M194 300 V150', 6, INK) + l('M194 300 V150', 3.4, '#d8dce6') + o('M178 250 H210 V256 H178Z', '#d8a830') };
    }
    case 7: { // 재봉사: 머릿수건 · 줄자 · 바늘과 실 · 천
      const p = P('a', { fem: true, mood: 'happy', eye: '#3a2a6a', lips: '#b85a5a', w: 0.95 });
      return { bg: 'workshop', defs: cloth('#8a5aa8', '#4a2a6a'), art:
        body('#8a5aa8', '#4a2a6a') + o('M60 290 Q90 240 150 250 Q190 256 200 290Z', '#f0d8a0') + l('M70 280 q30 -20 60 -16 q30 4 60 16', 1.4, '#c8a060')
        + face(p)
        + o('M80 100 C76 56 104 40 120 40 C136 40 164 56 160 100 Q150 76 120 74 Q90 76 80 100Z', '#c83a3a') + o('M150 90 C170 96 176 116 168 130 Q160 110 150 104Z', '#c83a3a')
        + l('M80 202 Q120 230 160 202', 7, '#f4e070') + l('M84 206 l4 6 M96 212 l4 6 M108 216 l4 6 M132 216 l4 6 M144 212 l4 6', 1.2, '#1a0e08')
        + l('M186 170 L150 240', 2.4, '#d8dce6') + l('M186 170 Q210 190 190 220 Q170 240 196 262', 1.6, '#c83a3a')
        + hand(150, 244, p.skin, p.shade, 30) };
    }
    case 8: { // 석공: 모자 · 가죽 앞치마 · 흙손과 벽돌
      const p = P('c', { mood: 'calm' });
      return { bg: 'bricks', defs: cloth('#5a7a9a', '#2a3a4a'), art:
        body('#5a7a9a', '#2a3a4a') + o('M70 220 H170 V300 H70Z', '#8a5a30') + l('M70 220 L60 196 M170 220 L180 196', 3, '#5a3a18')
        + face(p)
        + o('M80 84 C80 54 100 42 120 42 C140 42 160 54 160 84 Q120 74 80 84Z', '#6a6a70') + o('M76 84 Q120 72 170 86 L168 94 Q120 82 78 92Z', '#5a5a60')
        + f('M100 160 q20 8 40 0', '#3a2a1a', 0.3)
        + o('M170 220 L206 208 L214 226 L178 238Z', '#b86a40') + o('M166 262 L200 240 L206 248 L172 270Z', '#9aa0aa') + l('M166 262 L150 280', 5, '#5a3a18')
        + hand(162, 262, p.skin, p.shade, 0) };
    }
    case 9: { // 요리사: 통통 · 요리사 모자 · 국자 · 김 나는 냄비
      const p = P('b', { mood: 'happy', w: 1.12 });
      return { bg: 'kitchen', defs: cloth('#f4f0e6', '#c8c0b0'), art:
        body('#f4f0e6', '#c8c0b0') + [100, 140].map((x) => dot(x, 240, 4, '#2a1a10')).join('') + [100, 140].map((x) => dot(x, 268, 4, '#2a1a10')).join('') + o('M100 190 L120 214 L140 190Z', '#c83a3a')
        + face(p)
        + o('M84 80 C70 64 76 40 96 42 C98 22 128 18 136 36 C156 28 172 50 158 70 L156 84 Q120 76 84 84Z', '#fbf8f0') + l('M88 76 Q120 70 154 76', 2, '#c8c0b0')
        + o('M24 300 V250 H96 V300Z', '#8a8a92') + o('M20 250 H100 V258 H20Z', '#6a6a72') + l('M40 238 q-6 -12 0 -24 q6 -12 0 -24 M60 236 q-6 -12 0 -24 M80 238 q-6 -12 0 -24', 2.4, '#fff', 0.7)
        + l('M190 170 L170 250', 5, '#8a6a4a') + o('M180 160 A14 10 0 1 0 204 164Z', '#8a6a4a')
        + hand(172, 252, p.skin, p.shade, 0) };
    }
    case 10: { // 양치기: 밀짚모자 · 지팡이 · 새끼 양
      const p = P('a', { fem: true, mood: 'happy', eye: '#3a6a8a', lips: '#c86a6a', w: 0.94 });
      return { bg: 'meadow', defs: cloth('#5a8ac8', '#2a4a7a'), art:
        body('#5a8ac8', '#2a4a7a') + o('M80 200 Q120 220 160 200 L160 214 Q120 234 80 214Z', '#f4f0e6')
        + o('M76 150 C70 110 80 80 96 80 L92 170Z', '#c89040') + o('M164 150 C170 110 160 80 144 80 L148 170Z', '#c89040')
        + face(p)
        + o('M50 86 Q120 60 190 86 Q170 96 120 92 Q70 96 50 86Z', '#e8c860') + o('M88 86 C86 60 104 52 120 52 C136 52 154 60 152 86Z', '#e8c860') + l('M88 80 Q120 72 152 80', 5, '#c83a3a')
        + o('M54 300 C54 260 80 240 110 246 C130 250 140 270 136 300Z', '#fbf6ec') + c(62, 250, 16, '#fbf6ec') + dot(58, 248, 2, '#1a0e08') + o('M70 240 q8 -6 12 2Z', '#e8d8c8', 1.4)
        + l('M200 300 V120 q0 -24 -20 -20', 5, '#8a5a30')
        + hand(198, 200, p.skin, p.shade, 0) };
    }
    case 11: { // 채석공: 떡대 · 두건 · 망치와 정 · 돌가루
      const p = P('c', { mood: 'stern', w: 1.1 });
      return { bg: 'quarry', defs: cloth('#8a6a4a', '#4a3420'), art:
        body('#8a6a4a', '#4a3420') + l('M60 230 L180 230', 2, '#3a2414', 0.5)
        + face(p)
        + o('M80 94 C78 58 100 44 120 44 C140 44 162 58 160 94 Q120 82 80 94Z', '#a83a2a') + o('M156 84 L180 90 L170 104 Z', '#a83a2a')
        + f('M96 150 q24 12 48 0 l0 10 q-24 12 -48 0Z', '#3a2a1a', 0.35)
        + Array.from({ length: 18 }, (_, i) => dot(40 + (i * 37) % 170, 180 + (i * 53) % 110, 1.6, '#e8e0d0', 0.6)).join('')
        + o('M170 180 L210 170 L214 186 L174 196Z', '#6a6a72') + l('M192 184 L180 260', 6, '#6a4a2a')
        + l('M40 260 L80 220', 5, '#9aa0aa')
        + hand(182, 262, p.skin, p.shade, 0) + hand(56, 250, p.skin, p.shade, 40) };
    }
    case 12: { // 농노: 밀짚모자 · 기운 옷 · 쇠스랑 · 수염 자국
      const p = P('c', { mood: 'worry', age: 0.6, w: 0.94 });
      return { bg: 'field', defs: cloth('#9a8a6a', '#5a4a30'), art:
        body('#9a8a6a', '#5a4a30') + o('M70 240 h26 v22 h-26Z', '#7a6a4a', 1.6) + l('M72 244 l22 0 M72 252 l22 0', 1, '#4a3a20') + o('M150 262 h22 v18 h-22Z', '#6a7a5a', 1.6)
        + face(p)
        + Array.from({ length: 30 }, (_, i) => dot(100 + (i * 7) % 42, 146 + (i * 5) % 18, 0.9, '#3a2418', 0.6)).join('')
        + o('M58 88 Q120 62 182 88 Q164 98 120 94 Q76 98 58 88Z', '#d8b860') + o('M90 88 C88 64 104 54 120 54 C136 54 152 64 150 88Z', '#d8b860') + l('M70 88 l-6 8 M170 88 l6 8 M100 92 l-2 8', 1.4, '#a88830')
        + l('M196 300 V110', 5, '#8a5a30') + l('M180 110 V80 M196 110 V74 M212 110 V80 M180 110 H212', 3.4, '#6a6a72')
        + hand(194, 214, p.skin, p.shade, 0) };
    }
    default: { // 광대: 방울 달린 모자 · 뾰족 깃 · 인형 지팡이 · 씩 웃음
      const p = P('a', { mood: 'happy', eye: '#2a6a2a' });
      return { bg: 'stage', defs: cloth('#d8303a', '#7a0a14'), art:
        body('#d8303a', '#7a0a14') + o('M120 190 L120 290 L216 290 C212 222 180 196 120 188Z', '#e8c030') + f('M160 196 C196 214 212 240 216 290 L190 290 C190 250 180 220 160 196Z', '#a08010', 0.5)
        + o('M60 200 L84 230 L100 204 L120 236 L140 204 L156 230 L180 200 Q120 186 60 200Z', '#2a8a4a') + [84, 120, 156].map((x, i) => c(x, [232, 238, 232][i], 5, '#e8c030', 1.4)).join('')
        + face(p)
        + o('M84 88 C60 70 40 40 18 50 C40 56 58 76 72 98Z', '#d8303a') + o('M156 88 C180 70 200 40 222 50 C200 56 182 76 168 98Z', '#e8c030') + o('M100 80 C104 40 116 16 120 6 C124 16 136 40 140 80Z', '#2a8a4a')
        + o('M82 96 Q120 78 158 96 L156 86 Q120 70 84 86Z', '#f4f0e6', 1.8)
        + c(18, 50, 7, '#e8c030') + c(222, 50, 7, '#d8303a') + c(120, 6, 7, '#e8c030')
        + l('M196 300 V190', 5, '#8a5a30') + c(196, 180, 14, '#f0c8a8') + o('M182 170 L196 150 L210 170Z', '#d8303a') + dot(191, 180, 1.6, '#1a0e08') + dot(201, 180, 1.6, '#1a0e08') + l('M190 186 q6 6 12 0', 1.4)
        + hand(196, 232, p.skin, p.shade, 0) };
    }
  }
}

/* ═════════ 틀 · 숫자 ═════════ */
const TIER = {
  gold: { a: '#f8d870', b: '#a87818', c: '#5a3a08', band: '#6a1018', num: '#fff4d0' },
  silver: { a: '#eef0f6', b: '#8a90a0', c: '#3a3e4a', band: '#1a2a4a', num: '#ffffff' },
  bronze: { a: '#f0b878', b: '#9a5a28', c: '#4a2408', band: '#3a1e10', num: '#fff0dc' },
  wood: { a: '#c8a070', b: '#7a5430', c: '#3a2410', band: '#2a3a1a', num: '#f8ecd0' },
  jester: { a: '#f8e070', b: '#c8303a', c: '#2a8a4a', band: '#2a0a3a', num: '#fff8d0' },
  mapae: { a: '#f8e0a0', b: '#b8303a', c: '#4a0a0e', band: '#1a1a3a', num: '#ffe8a0' },
};
/* 지금 판의 확장판: 게임 화면이 정해 주면 카드 그림 · 이름이 그 판으로 바뀐다 */
let EDITION = 'classic';
export function setEdition(ed) { EDITION = ed || 'classic'; }
export function getEdition() { return EDITION; }
let seq = 0;
/* 카드지 결: 필터를 카드마다 돌리면 손패 20장에서 버벅이므로 한 번만 그린 무늬를 같이 쓴다 */
let paperReady = false;
function ensurePaper() {
  if (paperReady || typeof document === 'undefined') return;
  paperReady = true;
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const x = c.getContext('2d');
  const img = x.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random();
    img.data[i] = 255; img.data[i + 1] = 242; img.data[i + 2] = 216;
    img.data[i + 3] = v > 0.5 ? Math.round((v - 0.5) * 60) : 0;
  }
  x.putImageData(img, 0, 0);
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = `<svg width="0" height="0"><defs><pattern id="dcPaper" width="96" height="96" patternUnits="userSpaceOnUse"><image href="${c.toDataURL()}" width="96" height="96"/></pattern></defs></svg>`;
  document.body.appendChild(holder);
}

/** rich: 크게 볼 때만 손그림 흔들림 필터를 켠다 (기본: 너비 200 이상) */
export function cardSvg(r, { w = 120, cls = '', uid = '', rich = w >= 200, edition = EDITION, raster = false, attrs = '' } = {}) {
  if (!raster) ensurePaper();
  const D = window.DALMUTI;
  const jo = edition === 'joseon';
  const R = D.ranksOf(edition)[r];
  const T = TIER[R.tier];
  const id = `dc${++seq}${uid}`;
  const P = jo ? portraitJoseon(r) : portrait(r);
  const num = r === 13 ? '★' : r === 14 ? '牌' : String(r);
  const pips = r === 13 ? '아무 숫자' : r === 14 ? '판 엎기' : `${r}장`;
  const art = P.art.replace(/url\(#(cloth|skin|gold|steel)\)/g, (_, k) => `url(#${id}${k})`);
  const defs = P.defs.replace('id="cloth"', `id="${id}cloth"`);
  return `<svg class="dcard ${cls}" viewBox="0 0 240 360" width="${w}" ${raster ? 'height="360"' : ''} xmlns="http://www.w3.org/2000/svg" data-r="${r}" ${attrs}>
<defs>${defs}
  <linearGradient id="${id}skin" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe0c8"/><stop offset=".5" stop-color="#e8b894"/><stop offset="1" stop-color="#b87a58"/></linearGradient>
  <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#8a5a10"/></linearGradient>
  <linearGradient id="${id}steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f4fa"/><stop offset=".5" stop-color="#9aa0aa"/><stop offset="1" stop-color="#4a4e58"/></linearGradient>
  <linearGradient id="${id}fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.a}"/><stop offset=".5" stop-color="${T.b}"/><stop offset="1" stop-color="${T.c}"/></linearGradient>
  <radialGradient id="${id}vig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  ${rich ? `<filter id="${id}wob"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="${r * 3}"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>` : ''}
  <clipPath id="${id}win"><rect x="14" y="14" width="212" height="270" rx="10"/></clipPath>
  ${raster ? `<filter id="${id}tx" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${r}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .1 0"/></filter>` : ''}
</defs>
<rect x="1" y="1" width="238" height="358" rx="16" fill="#1a0e08"/>
<rect x="4" y="4" width="232" height="352" rx="14" fill="url(#${id}fr)"/>
${raster ? `<rect x="4" y="4" width="232" height="352" rx="14" filter="url(#${id}tx)"/>` : '<rect x="4" y="4" width="232" height="352" rx="14" fill="url(#dcPaper)"/>'}
<rect x="9" y="9" width="222" height="342" rx="11" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
<g clip-path="url(#${id}win)"><g transform="translate(0 -6)">${(jo ? BG_J : BG)[P.bg]}</g><g${rich ? ` filter="url(#${id}wob)"` : ''}>${art}</g><rect x="14" y="14" width="212" height="270" fill="url(#${id}vig)"/></g>
<rect x="14" y="14" width="212" height="270" rx="10" fill="none" stroke="${T.c}" stroke-width="3"/>
<g transform="translate(40 44)"><circle r="27" fill="${T.band}" stroke="url(#${id}fr)" stroke-width="5"/>${raster ? '' : `<text y="${r === 13 ? 10 : 11}" text-anchor="middle" font-family="'Cinzel','Nanum Myeongjo',serif" font-weight="900" font-size="${num.length > 1 ? 28 : 32}" fill="${T.num}">${num}</text>`}</g>
<path d="M14 290 H226 V334 Q226 346 214 346 H26 Q14 346 14 334Z" fill="${T.band}"/>
<path d="M14 290 H226" stroke="url(#${id}fr)" stroke-width="3"/>
${raster ? '' : `<text x="120" y="318" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="${R.name.length > 4 ? 22 : 26}" fill="#fbf2dc" letter-spacing="1">${R.name}</text>
<text x="120" y="337" text-anchor="middle" font-family="'Cinzel',serif" font-weight="700" font-size="9.5" fill="${T.a}" letter-spacing="2">${R.en} · ${pips}</text>`}
</svg>`;
}

/** 카드 뒷면 */
export function backSvg({ w = 120, cls = '', edition = EDITION } = {}) {
  const id = `db${++seq}`;
  if (edition === 'joseon') return `<svg class="dcard back ${cls}" viewBox="0 0 240 360" width="${w}" xmlns="http://www.w3.org/2000/svg">${backJoseon(id)}</svg>`;
  return `<svg class="dcard back ${cls}" viewBox="0 0 240 360" width="${w}" xmlns="http://www.w3.org/2000/svg">
<defs><pattern id="${id}p" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M12 0 L24 12 L12 24 L0 12Z" fill="none" stroke="#c89a30" stroke-width="1.2" opacity=".6"/><circle cx="12" cy="12" r="2" fill="#c89a30" opacity=".6"/></pattern>
<radialGradient id="${id}g" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#8a1a24"/><stop offset="1" stop-color="#3a0610"/></radialGradient></defs>
<rect x="1" y="1" width="238" height="358" rx="16" fill="#1a0e08"/><rect x="4" y="4" width="232" height="352" rx="14" fill="url(#${id}g)"/>
<rect x="14" y="14" width="212" height="332" rx="10" fill="url(#${id}p)" stroke="#c89a30" stroke-width="3"/>
<g transform="translate(120 180)"><circle r="54" fill="#3a0610" stroke="#e0b030" stroke-width="5"/>
<path d="M-32 12 L-36 -22 L-18 -6 L-8 -30 L0 -10 L8 -30 L18 -6 L36 -22 L32 12Z" fill="#e0b030" stroke="#1a0e08" stroke-width="2.4"/>
<text y="38" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-weight="800" font-size="16" fill="#f8e8b0">달무티</text></g></svg>`;
}

/* ═════════ 카드 그림 미리 굽기 (렉 없애기) ═════════
   SVG 카드를 매번 DOM 에 만들면 손패 · 판 · 날아가는 카드마다 무거운 그림을 다시 그린다.
   판마다 한 번씩 캔버스에 구워 PNG 로 두고, 화면에는 <img> 만 놓는다. 글자는 문서 글꼴로 캔버스에 직접 쓴다. */
const RS = 2.4; // 굽는 배율 (240×360 → 576×864: 확대 카드도 선명)
const baked = new Map(); // `${edition}:${r}` → blob URL
const baking = new Map();
function bakeOne(edition, r) {
  const key = `${edition}:${r}`;
  if (baked.has(key) || baking.has(key)) return baking.get(key) || Promise.resolve();
  const D = window.DALMUTI;
  const R = D.ranksOf(edition)[r];
  if (!R) return Promise.resolve();
  const T = TIER[R.tier];
  const svgText = cardSvg(r, { w: 240, edition, rich: true, raster: true });
  const job = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = 240 * RS;
        cv.height = 360 * RS;
        const x = cv.getContext('2d');
        x.drawImage(img, 0, 0, cv.width, cv.height);
        x.scale(RS, RS);
        x.textAlign = 'center';
        x.textBaseline = 'alphabetic';
        const num = r === 13 ? '★' : r === 14 ? '牌' : String(r);
        const pips = r === 13 ? '아무 숫자' : r === 14 ? '판 엎기' : `${r}장`;
        x.fillStyle = T.num;
        x.font = `900 ${num.length > 1 ? 28 : 32}px Cinzel, 'Nanum Myeongjo', serif`;
        x.fillText(num, 40, 44 + (r === 13 ? 10 : 11));
        x.fillStyle = '#fbf2dc';
        x.font = `800 ${R.name.length > 4 ? 22 : 26}px 'Nanum Myeongjo', serif`;
        if ('letterSpacing' in x) x.letterSpacing = '1px';
        x.fillText(R.name, 120, 318);
        x.fillStyle = T.a;
        x.font = "700 9.5px Cinzel, 'Nanum Myeongjo', serif";
        if ('letterSpacing' in x) x.letterSpacing = '2px';
        x.fillText(`${R.en} · ${pips}`, 120, 337);
        cv.toBlob((b) => { if (b) baked.set(key, URL.createObjectURL(b)); baking.delete(key); resolve(); }, 'image/png');
      } catch (e) { baking.delete(key); resolve(); }
    };
    img.onerror = () => { baking.delete(key); resolve(); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  });
  baking.set(key, job);
  return job;
}
/** 판 하나의 카드 14장을 미리 굽는다. 다 구우면 'dcards-ready' 를 알린다 */
export async function prewarm(edition = EDITION) {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* 무시 */ }
  const D = window.DALMUTI;
  const n = D.ranksOf(edition).length - 1;
  const jobs = [];
  for (let r = 1; r <= n; r++) jobs.push(bakeOne(edition, r));
  await Promise.all(jobs);
  window.dispatchEvent(new CustomEvent('dcards-ready', { detail: edition }));
}
/** 화면용 카드: 구운 그림이 있으면 가벼운 <img>, 아직이면 SVG */
export function cardHtml(r, { w = 120, cls = '', attrs = '', edition = EDITION } = {}) {
  const url = baked.get(`${edition}:${r}`);
  if (url) return `<img class="dcard ${cls}" src="${url}" width="${w}" alt="" draggable="false" data-r="${r}" ${attrs}>`;
  return cardSvg(r, { w, cls, edition, attrs });
}
