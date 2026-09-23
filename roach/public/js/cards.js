// 바퀴벌레 포커 - 카드 그림. 벌레 8종을 직접 그린다 (200×200 안에)
//   ART[종류]  : 벌레 그림 한 마리
//   cardSvg()  : 인쇄된 카드 한 장 (테두리 · 이름 띠 · 구석 문양)
//   backSvg()  : 카드 뒷면
(function (root) {
  'use strict';
  const R = root.ROACH;

  /* 공통 붓 */
  const INK = '#1a1008';
  const eye = (x, y, r, look = 0.3, angry = 0) => `
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.06}" fill="#fffdf4" stroke="${INK}" stroke-width="${r * 0.28}"/>
    <circle cx="${x + r * look}" cy="${y + r * 0.1}" r="${r * 0.46}" fill="${INK}"/>
    <circle cx="${x + r * look - r * 0.16}" cy="${y - r * 0.16}" r="${r * 0.16}" fill="#fff"/>
    ${angry ? `<path d="M${x - r * 1.2} ${y - r * 1.25} L${x + r * 0.9} ${y - r * 0.55}" stroke="${INK}" stroke-width="${r * 0.4}" stroke-linecap="round"/>` : ''}`;
  const leg = (d, w = 7) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const ART = {};

  /* ── 바퀴벌레: 능글맞게 웃는 갈색 바퀴 (카드 게임의 주인공) */
  ART.roach = (k) => `
    <g>
      <path d="M52 40 Q10 4 -14 -30" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M148 40 Q190 4 214 -30" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      ${leg('M64 112 Q26 118 4 96 L-6 76', 9)}
      ${leg('M62 134 Q20 148 2 140 L-12 146', 9)}
      ${leg('M72 156 Q44 184 22 190 L10 204', 9)}
      ${leg('M136 112 Q174 118 196 96 L206 76', 9)}
      ${leg('M138 134 Q180 148 198 140 L212 146', 9)}
      ${leg('M128 156 Q156 184 178 190 L190 204', 9)}
      <ellipse cx="100" cy="132" rx="56" ry="66" fill="${k.dark}" stroke="${INK}" stroke-width="8"/>
      <path d="M100 68 q50 8 52 62 q2 56 -52 64Z" fill="${k.fill}"/>
      <path d="M100 66 V196" stroke="${INK}" stroke-width="7"/>
      <path d="M56 92 q44 -18 88 0" fill="none" stroke="${INK}" stroke-width="6"/>
      <path d="M62 124 q38 -10 76 0 M66 158 q34 -8 68 0" fill="none" stroke="${INK}" stroke-width="4" opacity=".45"/>
      <ellipse cx="72" cy="112" rx="15" ry="26" fill="${k.light}" opacity=".45" transform="rotate(-12 72 112)"/>
      <ellipse cx="100" cy="66" rx="44" ry="36" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M100 30 q40 4 42 32 q2 30 -42 34Z" fill="${k.dark}" opacity=".35"/>
      ${eye(82, 58, 15, 0.34, 1)}${eye(120, 58, 15, -0.08, 1)}
      <path d="M72 82 Q100 106 130 80 Q124 100 100 100 Q78 100 72 82Z" fill="#fffdf4" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M84 86 v9 M100 89 v11 M116 86 v9" stroke="${INK}" stroke-width="3.4"/>
      <path d="M130 80 q10 -2 14 -10" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    </g>`;

  /* ── 쥐: 이빨 드러낸 회색 시궁쥐 */
  ART.rat = (k) => `
    <g>
      <path d="M156 146 Q210 150 202 190 Q198 214 172 206" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M156 146 Q204 150 196 188" fill="none" stroke="#e8b0b8" stroke-width="6" stroke-linecap="round"/>
      <circle cx="62" cy="58" r="30" fill="${k.dark}" stroke="${INK}" stroke-width="8"/>
      <circle cx="62" cy="58" r="16" fill="#eaa8b4"/>
      <circle cx="128" cy="48" r="25" fill="${k.dark}" stroke="${INK}" stroke-width="8"/>
      <circle cx="128" cy="48" r="13" fill="#eaa8b4"/>
      <ellipse cx="116" cy="138" rx="60" ry="48" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M68 146 q46 -40 106 -14 q-34 36 -106 14Z" fill="${k.light}" opacity=".75"/>
      <path d="M96 80 Q36 74 22 116 Q10 152 52 162 Q96 170 118 132Z" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M40 92 Q70 84 96 98" fill="none" stroke="${k.light}" stroke-width="7" opacity=".7"/>
      ${eye(52, 102, 13, 0.32, 1)}${eye(94, 94, 13, 0.08, 1)}
      <ellipse cx="20" cy="126" rx="14" ry="11" fill="#e8909c" stroke="${INK}" stroke-width="6"/>
      <path d="M24 140 q16 18 40 12" fill="none" stroke="${INK}" stroke-width="5"/>
      <path d="M30 144 l9 20 l9 -18Z" fill="#fffdf4" stroke="${INK}" stroke-width="4"/>
      <path d="M50 146 l9 22 l9 -20Z" fill="#fffdf4" stroke="${INK}" stroke-width="4"/>
      <path d="M6 128 L-16 130 M8 140 L-12 154 M10 114 L-10 104" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      ${leg('M88 178 L82 200 L62 206', 8)}${leg('M140 176 L146 200 L166 206', 8)}
    </g>`;

  /* ── 박쥐: 날개 펼친 보라 박쥐 */
  ART.bat = (k) => `
    <g>
      <path d="M96 96 Q40 44 6 62 q18 12 10 32 q22 -6 30 10 q16 -8 28 14Z" fill="${k.fill}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M104 96 Q160 44 194 62 q-18 12 -10 32 q-22 -6 -30 10 q-16 -8 -28 14Z" fill="${k.fill}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M96 96 Q54 60 18 66 M96 96 Q62 78 38 96" fill="none" stroke="${k.dark}" stroke-width="4"/>
      <path d="M104 96 Q146 60 182 66 M104 96 Q138 78 162 96" fill="none" stroke="${k.dark}" stroke-width="4"/>
      <ellipse cx="100" cy="116" rx="30" ry="42" fill="${k.dark}" stroke="${INK}" stroke-width="7"/>
      <path d="M100 82 q22 8 22 36 q0 30 -22 36Z" fill="${k.fill}" opacity=".5"/>
      <path d="M72 62 L60 18 L94 44Z" fill="${k.dark}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M128 62 L140 18 L106 44Z" fill="${k.dark}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <ellipse cx="100" cy="66" rx="34" ry="28" fill="${k.fill}" stroke="${INK}" stroke-width="7"/>
      ${eye(88, 60, 11, 0.3, 1)}${eye(114, 60, 11, -0.1, 1)}
      <ellipse cx="101" cy="78" rx="7" ry="5" fill="${INK}"/>
      <path d="M86 86 q15 12 30 0" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M90 86 l4 12 l5 -12Z M106 86 l4 12 l5 -12Z" fill="#fffdf4" stroke="${INK}" stroke-width="2"/>
      ${leg('M88 156 L84 176 L70 180', 6)}${leg('M112 156 L116 176 L130 180', 6)}
    </g>`;

  /* ── 두꺼비: 물컹한 초록 두꺼비 */
  ART.toad = (k) => `
    <g>
      ${leg('M50 140 q-28 6 -34 30 q22 6 30 -6', 7)}
      ${leg('M150 140 q28 6 34 30 q-22 6 -30 -6', 7)}
      <ellipse cx="100" cy="130" rx="72" ry="52" fill="${k.fill}" stroke="${INK}" stroke-width="7"/>
      <ellipse cx="100" cy="146" rx="52" ry="30" fill="${k.light}" opacity=".65"/>
      <ellipse cx="100" cy="96" rx="58" ry="42" fill="${k.fill}" stroke="${INK}" stroke-width="7"/>
      <path d="M44 104 q56 44 112 0 q-6 30 -56 30 q-50 0 -56 -30Z" fill="#f0f4e0" stroke="${INK}" stroke-width="5"/>
      <path d="M44 104 q56 34 112 0" fill="none" stroke="${INK}" stroke-width="6"/>
      <circle cx="68" cy="62" r="26" fill="${k.light}" stroke="${INK}" stroke-width="7"/>
      <circle cx="132" cy="62" r="26" fill="${k.light}" stroke="${INK}" stroke-width="7"/>
      ${eye(68, 62, 15, 0.2, 0)}${eye(132, 62, 15, -0.2, 0)}
      ${[[54, 122, 7], [146, 120, 6], [40, 148, 5], [160, 146, 6], [100, 168, 6], [72, 160, 4], [128, 162, 4]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.dark}" opacity=".55"/>`).join('')}
      <path d="M78 112 q4 8 -4 12 M122 112 q-4 8 4 12" stroke="${INK}" stroke-width="3" fill="none"/>
    </g>`;

  /* ── 전갈: 꼬리를 세운 황금 전갈 */
  ART.scorpion = (k) => `
    <g>
      <path d="M124 128 Q186 118 194 66 Q198 22 164 12 Q132 4 130 36" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
      <path d="M124 128 Q186 118 194 66 Q198 22 164 12 Q132 4 130 36" fill="none" stroke="${k.fill}" stroke-width="15" stroke-linecap="round"/>
      ${[[154, 124], [180, 100], [194, 66], [188, 34], [160, 14]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${14 - i * 0.6}" fill="${k.light}" stroke="${INK}" stroke-width="5"/>`).join('')}
      <path d="M132 30 Q112 12 104 28 Q118 46 132 30Z" fill="${k.light}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      ${leg('M76 126 L28 134 L8 122', 8)}${leg('M78 146 L30 164 L14 164', 8)}${leg('M90 162 L66 194 L48 198', 8)}
      ${leg('M122 150 L152 174 L168 178', 8)}${leg('M112 164 L128 196 L144 200', 8)}
      <ellipse cx="94" cy="142" rx="46" ry="38" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M94 104 q42 6 44 38 q2 32 -44 38Z" fill="${k.dark}" opacity=".3"/>
      <path d="M56 130 h76 M54 146 h80 M60 162 h64" stroke="${INK}" stroke-width="5" opacity=".65"/>
      <ellipse cx="66" cy="104" rx="32" ry="26" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M44 100 Q6 82 -14 104 Q-18 128 6 128 Q-14 112 14 108 Q34 106 46 98Z" fill="${k.light}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M52 78 Q34 40 0 40 Q-14 58 6 70 Q0 48 20 56 Q38 64 56 76Z" fill="${k.light}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      ${eye(58, 98, 11, 0.3, 1)}${eye(82, 100, 11, 0.06, 1)}
    </g>`;

  /* ── 거미: 줄에 매달린 검은 거미 */
  ART.spider = (k) => `
    <g>
      <path d="M100 -10 V34" stroke="${INK}" stroke-width="5"/>
      ${leg('M68 104 Q22 88 4 42 L-8 24', 11)}
      ${leg('M66 122 Q14 118 -10 88 L-24 82', 11)}
      ${leg('M68 142 Q18 154 0 190 L-10 208', 11)}
      ${leg('M80 158 Q58 192 62 214', 11)}
      ${leg('M132 104 Q178 88 196 42 L208 24', 11)}
      ${leg('M134 122 Q186 118 210 88 L224 82', 11)}
      ${leg('M132 142 Q182 154 200 190 L210 208', 11)}
      ${leg('M120 158 Q142 192 138 214', 11)}
      ${[[22, 62], [8, 104], [18, 170], [178, 62], [192, 104], [182, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${INK}"/>`).join('')}
      <ellipse cx="100" cy="142" rx="50" ry="46" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M100 100 q34 14 34 42 q0 30 -34 42Z" fill="${k.light}" opacity=".2"/>
      <path d="M100 100 L124 130 L100 148 L76 130Z" fill="${k.light}" opacity=".85"/>
      <path d="M100 152 L118 170 L100 186 L82 170Z" fill="${k.light}" opacity=".6"/>
      <ellipse cx="100" cy="86" rx="38" ry="30" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      ${eye(84, 78, 12, 0.32, 1)}${eye(118, 78, 12, -0.06, 1)}
      <circle cx="72" cy="96" r="6" fill="#fffdf4" stroke="${INK}" stroke-width="3"/>
      <circle cx="130" cy="96" r="6" fill="#fffdf4" stroke="${INK}" stroke-width="3"/>
      <path d="M86 104 q14 12 28 0" fill="none" stroke="${INK}" stroke-width="5"/>
      <path d="M84 106 Q74 118 78 128 M116 106 Q126 118 122 128" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    </g>`;

  /* ── 파리: 눈 큰 청록 파리 */
  ART.fly = (k) => `
    <g>
      <path d="M104 92 q56 -40 82 -10 q-22 36 -74 26Z" fill="#dff4fa" opacity=".85" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M96 92 q-56 -40 -82 -10 q22 36 74 26Z" fill="#dff4fa" opacity=".85" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M112 86 q34 -18 58 -8 M108 96 q38 -6 62 6" fill="none" stroke="#8ac0d0" stroke-width="3"/>
      <path d="M88 86 q-34 -18 -58 -8 M92 96 q-38 -6 -62 6" fill="none" stroke="#8ac0d0" stroke-width="3"/>
      ${leg('M76 128 L44 152 L34 146')}${leg('M82 140 L60 172 L48 172')}${leg('M100 146 L100 180 L88 186')}
      ${leg('M124 128 L156 152 L166 146')}${leg('M118 140 L140 172 L152 172')}
      <ellipse cx="100" cy="124" rx="40" ry="46" fill="${k.fill}" stroke="${INK}" stroke-width="7"/>
      <path d="M100 80 q28 16 28 44 q0 30 -28 44Z" fill="${k.dark}" opacity=".5"/>
      <path d="M64 112 q36 -12 72 0 M62 132 q38 -10 76 0 M68 152 q32 -8 64 0" fill="none" stroke="${INK}" stroke-width="4" opacity=".6"/>
      <ellipse cx="100" cy="70" rx="38" ry="32" fill="${k.dark}" stroke="${INK}" stroke-width="7"/>
      <ellipse cx="76" cy="62" rx="22" ry="24" fill="#d84a3a" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="124" cy="62" rx="22" ry="24" fill="#d84a3a" stroke="${INK}" stroke-width="6"/>
      ${[[70, 54], [82, 58], [72, 68], [84, 72], [118, 54], [130, 58], [120, 68], [132, 72]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff" opacity=".8"/>`).join('')}
      <path d="M92 92 q8 10 16 0" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M100 94 v10" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M84 34 q-6 -18 -22 -22 M116 34 q6 -18 22 -22" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    </g>`;

  /* ── 노린재: 방패 모양 몸통에서 냄새가 피어오르는 벌레 */
  ART.stinkbug = (k) => `
    <g>
      <g opacity=".75" fill="none" stroke="#9ab08a" stroke-width="8" stroke-linecap="round">
        <path d="M152 36 Q174 20 166 -2"/><path d="M170 52 Q198 42 196 16"/><path d="M134 24 Q142 2 128 -12"/>
      </g>
      ${[[160, 10, 7], [184, 26, 6], [138, -4, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9ab08a" opacity=".5"/>`).join('')}
      ${leg('M56 106 L14 92 L0 74', 8)}${leg('M56 132 L10 132 L-4 146', 8)}${leg('M64 158 L32 186 L30 204', 8)}
      ${leg('M144 106 L186 92 L200 74', 8)}${leg('M144 132 L190 132 L204 146', 8)}${leg('M136 158 L168 186 L170 204', 8)}
      <path d="M100 44 L158 78 L146 166 Q100 196 54 166 L42 78Z" fill="${k.fill}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M100 44 L158 78 L146 166 Q124 182 100 184Z" fill="${k.dark}" opacity=".4"/>
      <path d="M56 84 L144 84" stroke="${INK}" stroke-width="6"/>
      <path d="M100 84 V184" stroke="${INK}" stroke-width="6"/>
      <path d="M62 102 L94 126 L62 148Z M138 102 L106 126 L138 148Z" fill="${k.light}" opacity=".75"/>
      <path d="M48 92 L152 92" stroke="${INK}" stroke-width="3" opacity=".4"/>
      <ellipse cx="100" cy="48" rx="38" ry="28" fill="${k.fill}" stroke="${INK}" stroke-width="8"/>
      <path d="M70 28 Q52 4 26 2" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M130 28 Q148 4 174 2" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="26" cy="2" r="6" fill="${INK}"/><circle cx="174" cy="2" r="6" fill="${INK}"/>
      ${eye(84, 44, 12, 0.3, 1)}${eye(118, 44, 12, -0.08, 1)}
      <path d="M86 64 q14 10 28 0" fill="none" stroke="${INK}" stroke-width="5"/>
    </g>`;

  /** 벌레 한 마리 (0 0 200 200) */
  function creature(kindId) {
    const k = R.KIND[kindId];
    return (ART[kindId] || ART.roach)(k);
  }

  /** 작은 흑백 실루엣 아이콘 (구석 문양 · 앞에 깔린 카드 세기용) */
  function icon(kindId, color) {
    const k = R.KIND[kindId];
    return `<svg viewBox="0 0 200 200" class="ic-bug" aria-hidden="true"><g fill="${color || k.dark}" opacity=".95">${creature(kindId)}</g></svg>`;
  }

  /**
   * 인쇄된 카드 한 장.
   * @param {string} cardId 'roach3' 같은 카드 id (또는 종류 id)
   * @param {{small?:boolean, label?:string}} o
   */
  function cardSvg(cardId, o = {}) {
    const kid = R.kindOf(cardId) || cardId;
    const k = R.KIND[kid] || R.KINDS[0];
    const uid = `c${Math.random().toString(36).slice(2, 8)}`;
    return `<svg viewBox="0 0 300 420" class="card-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${k.light}"/><stop offset=".5" stop-color="${k.fill}"/><stop offset="1" stop-color="${k.dark}"/>
        </linearGradient>
        <radialGradient id="${uid}v" cx=".5" cy=".42" r=".62">
          <stop offset="0" stop-color="#fffdf2"/><stop offset=".72" stop-color="#f4e8cc"/><stop offset="1" stop-color="#dcc9a2"/>
        </radialGradient>
        <clipPath id="${uid}c"><rect x="26" y="66" width="248" height="250" rx="16"/></clipPath>
      </defs>
      <rect x="3" y="3" width="294" height="414" rx="22" fill="url(#${uid}f)" stroke="${INK}" stroke-width="6"/>
      <rect x="15" y="15" width="270" height="390" rx="15" fill="none" stroke="#fff8e0" stroke-width="3" opacity=".65"/>
      <rect x="26" y="66" width="248" height="250" rx="16" fill="url(#${uid}v)" stroke="${INK}" stroke-width="5"/>
      <g clip-path="url(#${uid}c)">
        ${Array.from({ length: 26 }, (_, i) => `<circle cx="${30 + ((i * 71) % 240)}" cy="${72 + ((i * 113) % 240)}" r="${1 + (i % 3) * 0.7}" fill="#8a7a58" opacity=".18"/>`).join('')}
        <g transform="translate(150 191) scale(.93) translate(-100 -100)">${creature(kid)}</g>
      </g>
      <rect x="26" y="24" width="248" height="38" rx="12" fill="${k.dark}" stroke="${INK}" stroke-width="4"/>
      <text x="150" y="53" text-anchor="middle" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="30" fill="#fff6dc" letter-spacing="2">${k.name}</text>
      <rect x="26" y="326" width="248" height="70" rx="14" fill="#fdf6e4" stroke="${INK}" stroke-width="4"/>
      <text x="150" y="352" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="18" fill="${k.dark}" letter-spacing="3">${k.en}</text>
      <g transform="translate(150 378)">
        ${Array.from({ length: 4 }, (_, i) => `<g transform="translate(${-104 + i * 29} 0)">
          <svg x="-13" y="-13" width="26" height="26" viewBox="0 0 200 200"><g fill="${i === 3 ? '#b02020' : k.dark}" opacity="${i === 3 ? 1 : 0.5}">${creature(kid)}</g></svg>
          ${i === 3 ? `<path d="M-15 -15 L15 15 M15 -15 L-15 15" stroke="#b02020" stroke-width="5" stroke-linecap="round"/>` : ''}</g>`).join('')}
        <text x="52" y="6" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="900" font-size="17" fill="#b02020">4장이면 패배</text>
      </g>
      <g opacity=".9">
        <svg x="30" y="28" width="30" height="30" viewBox="0 0 200 200"><g fill="#fff6dc">${creature(kid)}</g></svg>
        <svg x="240" y="28" width="30" height="30" viewBox="0 0 200 200"><g fill="#fff6dc">${creature(kid)}</g></svg>
      </g>
      ${o.label ? `<rect x="60" y="180" width="180" height="56" rx="10" fill="#1a1008" opacity=".84"/><text x="150" y="218" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="32" fill="#ffd23a">${o.label}</text>` : ''}
    </svg>`;
  }

  /** 카드 뒷면: 검붉은 바탕에 바퀴벌레 문양 */
  function backSvg() {
    const rows = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 24 + c * 68 + (r % 2 ? 34 : 0);
        const y = 30 + r * 66;
        if (x > 262) continue;
        rows.push(`<g transform="translate(${x} ${y}) rotate(${(r * 37 + c * 23) % 360})"><svg x="-18" y="-18" width="36" height="36" viewBox="0 0 200 200"><g fill="#3a1208" opacity=".5">${ART.roach(R.KIND.roach)}</g></svg></g>`);
      }
    }
    return `<svg viewBox="0 0 300 420" class="card-svg" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="bk" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#8a2a16"/><stop offset="1" stop-color="#4a1208"/></radialGradient></defs>
      <rect x="3" y="3" width="294" height="414" rx="22" fill="url(#bk)" stroke="${INK}" stroke-width="6"/>
      <g clip-path="none">${rows.join('')}</g>
      <rect x="15" y="15" width="270" height="390" rx="15" fill="none" stroke="#e8b060" stroke-width="3" opacity=".5"/>
      <g transform="translate(150 210)">
        <ellipse rx="112" ry="62" fill="#1a0c06" stroke="#e8b060" stroke-width="5"/>
        <text y="-8" text-anchor="middle" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="38" fill="#f0c060">바퀴벌레</text>
        <text y="34" text-anchor="middle" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="34" fill="#f0c060" letter-spacing="8">포커</text>
      </g>
    </svg>`;
  }

  root.RCARD = { ART, creature, icon, cardSvg, backSvg, INK };
}(typeof self !== 'undefined' ? self : this));
