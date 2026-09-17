// 테이블 위로 뻗어 오는 사람 손 그림 (손등이 보이는 오른손, 손가락이 위쪽).
// 브라우저(다른 사람 손)와 에셋 생성기(내 마우스 커서)가 함께 쓴다.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HAND_ART = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 손가락 끝(가운데)이 가리키는 곳. 이 점이 마우스 위치가 된다.
  const TIP = { x: 57, y: 10 };
  const W = 120;
  const H = 520;

  const LINE = '#8a5238';

  function finger(x, top, w, bottom, tilt, uid, nail) {
    const r = w / 2;
    const cx = x + r;
    return `<g transform="rotate(${tilt} ${cx} ${bottom})">
      <path d="M${x} ${bottom}V${top + r}C${x} ${top - 1} ${x + w} ${top - 1} ${x + w} ${top + r}V${bottom}Z" fill="url(#sk${uid})" stroke="${LINE}" stroke-width="1.1"/>
      <path d="M${x + w - 2.4} ${top + r + 4}V${bottom - 4}" stroke="#a86a4c" stroke-width="2.6" opacity=".35" stroke-linecap="round"/>
      <path d="M${x + 2} ${top + r + 2}V${bottom - 8}" stroke="#fff3e6" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>
      ${nail ? `<rect x="${x + 2.6}" y="${top + 2.4}" width="${w - 5.2}" height="${Math.min(13, w)}" rx="${(w - 5.2) / 2}" fill="#f6d9cf" stroke="#cf9a86" stroke-width=".8"/>
      <path d="M${x + 4} ${top + 5}q${(w - 8) / 2} -2 ${w - 8} 0" stroke="#fff" stroke-width="1" opacity=".7" fill="none"/>` : ''}
      <path d="M${x + 3} ${(top + bottom) / 2 + 2}q${r - 3} 2.4 ${w - 6} 0M${x + 3.5} ${(top + bottom) / 2 + 5}q${r - 3.5} 1.8 ${w - 7} 0" stroke="#b27a5c" stroke-width=".9" opacity=".55" fill="none"/>
    </g>`;
  }

  /**
   * uid: 한 화면에 여러 손이 있을 때 그라데이션 id 가 겹치지 않게
   * hue: 소매 색 (사람마다 다르게)
   * pose: 'open' | 'grab'
   * arm: false 면 손만 (커서용)
   */
  function hand(uid, hue, pose, arm = true) {
    const grab = pose === 'grab';
    const sleeve = `hsl(${hue} 42% 34%)`;
    const sleeveDark = `hsl(${hue} 45% 20%)`;
    const cuff = `hsl(${hue} 30% 82%)`;
    const defs = `<defs>
      <linearGradient id="sk${uid}" x1="0" y1="0" x2="1" y2=".35">
        <stop offset="0" stop-color="#f7d6b6"/><stop offset=".55" stop-color="#e6b08a"/><stop offset="1" stop-color="#c38463"/>
      </linearGradient>
      <linearGradient id="sl${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${sleeve}"/><stop offset=".65" stop-color="${sleeve}"/><stop offset="1" stop-color="${sleeveDark}"/>
      </linearGradient>
      <radialGradient id="kn${uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0e0" stop-opacity=".55"/><stop offset="1" stop-color="#fff0e0" stop-opacity="0"/></radialGradient>
    </defs>`;

    const sleeveArt = arm ? `
      <path d="M33 150C33 146 89 146 89 150L104 ${H}H18Z" fill="url(#sl${uid})" stroke="${sleeveDark}" stroke-width="1.4"/>
      <path d="M40 200L36 ${H}M84 210L94 ${H}M60 180V${H}" stroke="${sleeveDark}" stroke-width="1.4" opacity=".35"/>
      <path d="M31 146C31 140 91 140 91 146L90 170C74 176 48 176 32 170Z" fill="${cuff}" stroke="#8a8478" stroke-width="1.2"/>
      <path d="M36 152C52 157 72 157 86 152" stroke="#8a8478" stroke-width="1" opacity=".6" fill="none"/>
      <circle cx="80" cy="160" r="2.6" fill="#ece6d6" stroke="#8a8478" stroke-width=".8"/>` : '';

    const wrist = `<path d="M39 116C39 128 37 138 36 150H86C85 138 83 128 83 116Z" fill="url(#sk${uid})" stroke="${LINE}" stroke-width="1.1"/>
      <path d="M48 124C52 136 52 142 51 150M72 124C69 136 69 142 70 150" stroke="#b27a5c" stroke-width="1" opacity=".35" fill="none"/>`;

    const fingers = grab
      ? [
        finger(35, 50, 14, 80, -4, uid, false),
        finger(50, 46, 14, 80, 0, uid, false),
        finger(65, 48, 13, 80, 3, uid, false),
        finger(79, 55, 11.5, 82, 7, uid, false),
      ].join('')
      : [
        finger(35, 17, 14, 80, -5, uid, true),
        finger(50, 8, 14, 80, -1, uid, true),
        finger(65, 14, 13, 80, 3, uid, true),
        finger(79, 32, 11.5, 82, 8, uid, true),
      ].join('');

    const thumb = grab
      ? `<path d="M40 104C30 100 25 92 27 84C29 77 36 77 40 82C44 88 46 92 49 98Z" fill="url(#sk${uid})" stroke="${LINE}" stroke-width="1.1"/>
         <ellipse cx="31" cy="83" rx="3.6" ry="4.4" transform="rotate(-30 31 83)" fill="#f6d9cf" stroke="#cf9a86" stroke-width=".8"/>`
      : `<path d="M38 106C28 99 20 90 16 78C13 70 16 62 23 62C29 62 32 68 34 74C37 82 41 88 46 94Z" fill="url(#sk${uid})" stroke="${LINE}" stroke-width="1.1"/>
         <ellipse cx="20" cy="68" rx="4.2" ry="5.4" transform="rotate(-24 20 68)" fill="#f6d9cf" stroke="#cf9a86" stroke-width=".8"/>
         <path d="M24 84C28 86 31 88 33 91" stroke="#b27a5c" stroke-width="1" opacity=".5" fill="none"/>`;

    const back = `<path d="M32 72C30 92 30 112 38 124C48 136 76 136 86 124C93 112 94 92 92 74C84 64 40 62 32 72Z" fill="url(#sk${uid})" stroke="${LINE}" stroke-width="1.1"/>
      <path d="M44 80C46 96 48 112 52 126M58 78C58 96 60 112 61 128M71 80C70 96 69 112 68 126M83 84C80 98 77 110 74 124" stroke="#b27a5c" stroke-width="1.1" opacity=".3" fill="none"/>
      <path d="M36 80C36 96 38 110 44 120" stroke="#fff3e6" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/>
      <path d="M86 80C88 96 88 110 82 122" stroke="#a86a4c" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/>
      ${[[42, 74], [57, 72], [71, 74], [84, 79]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.6" fill="url(#kn${uid})"/>`).join('')}`;

    const vb = arm ? `0 0 ${W} ${H}` : '4 0 118 140';
    const size = arm ? `width="${W}" height="${H}"` : 'width="32" height="38"';
    return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${vb}">${defs}${sleeveArt}${wrist}${thumb}${fingers}${back}</svg>`;
  }

  return { hand, TIP, W, H };
});
