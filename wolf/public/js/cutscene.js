// 게임이 끝날 때 나오는 짧은 결말 영상 (SVG + CSS 애니메이션)
const WOLF = 'M-13 0L-9 -20C-14 -30 -18 -40 -16 -52C-21 -55 -27 -58 -31 -54L-36 -49L-35 -55L-39 -53L-35 -59C-30 -65 -22 -66 -15 -62C-13 -70 -9 -76 -3 -78L-7 -92L1 -83C4 -85 7 -85 10 -83L13 -96L15 -80C19 -78 25 -76 31 -73L33 -69C27 -69 22 -67 18 -67C18 -63 16 -61 14 -59C22 -57 29 -53 33 -47L39 -45L35 -43L39 -39L33 -41C29 -47 23 -49 16 -49C18 -39 16 -29 12 -19L16 0H8L4 -17H-2L-6 0Z';
const COAT = 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79Z';
const HEAD = 'M-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';

const W = 1600;
const H = 900;

function pine(x, y, h) {
  const w = h * 0.34;
  return `<path d="M${x} ${y - h}L${x + w * 0.4} ${y - h * 0.62}L${x + w * 0.2} ${y - h * 0.62}L${x + w * 0.7} ${y - h * 0.3}L${x + w * 0.35} ${y - h * 0.3}L${x + w} ${y - h * 0.08}L${x + w * 0.1} ${y - h * 0.08}V${y}H${x - w * 0.1}V${y - h * 0.08}L${x - w} ${y - h * 0.08}L${x - w * 0.35} ${y - h * 0.3}L${x - w * 0.7} ${y - h * 0.3}L${x - w * 0.2} ${y - h * 0.62}L${x - w * 0.4} ${y - h * 0.62}Z"/>`;
}
function forest(y, n, hmin, hvar, seed) {
  let s = '';
  let r = seed;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) s += pine((i + rnd() * 0.6) * (W / n), y + rnd() * 20, hmin + rnd() * hvar);
  return s;
}
function village(y, lit = true) {
  const houses = [[160, 90, 70], [300, 120, 90], [470, 80, 60], [610, 130, 100], [980, 110, 80], [1130, 90, 70], [1280, 140, 110], [1440, 100, 70]];
  let s = '';
  houses.forEach(([x, w, h], i) => {
    s += `<path d="M${x} ${y}V${y - h}L${x + w / 2} ${y - h - w * 0.45}L${x + w} ${y - h}V${y}Z" fill="#05070e"/>`;
    s += `<rect class="win w${i}" x="${x + w * 0.3}" y="${y - h * 0.7}" width="${w * 0.16}" height="${h * 0.22}" fill="#ffc860"/>`;
    s += `<rect class="win w${(i + 3) % 8}" x="${x + w * 0.58}" y="${y - h * 0.7}" width="${w * 0.16}" height="${h * 0.22}" fill="#ffc860"/>`;
  });
  s += `<path d="M780 ${y}V${y - 190}L800 ${y - 250}L820 ${y - 190}V${y}Z" fill="#05070e"/><rect class="win w2" x="794" y="${y - 170}" width="12" height="20" fill="#ffc860"/>`;
  return lit ? s : s.replace(/#ffc860/g, '#1a2030');
}
const person = (x, y, s, extra = '', fill = '#05070e', cls = '') => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><path d="${COAT}"/><path d="${HEAD}"/>${extra}</g>`;
const PITCHFORK = '<path d="M-24 0L-26 -104H-23L-21 0Z"/><path d="M-32 -104V-116H-30V-106H-26V-118H-23V-106H-19V-116H-17V-104Z"/>';
const TORCH = '<path d="M18 -50L28 -100L31 -99L22 -49Z"/><path class="flame" d="M29 -100C22 -108 26 -118 30 -126C32 -118 38 -112 33 -100Z" fill="#ffb040"/>';

const SCENES = {
  wolf: {
    title: '늑대인간의 승리',
    css: `
      .moonR { animation: moonRise 3.4s cubic-bezier(.2,.7,.3,1) forwards; transform: translateY(260px); }
      @keyframes moonRise { to { transform: none; } }
      .win { animation: winOff .3s forwards; }
      ${Array.from({ length: 8 }, (_, i) => `.w${i} { animation-delay: ${1 + i * 0.28}s; }`).join('')}
      @keyframes winOff { to { fill: #121828; } }
      .leaper { animation: leap 1.5s cubic-bezier(.4,0,.3,1) 2.2s forwards; transform: translate(-300px, 900px); }
      @keyframes leap { 0% { transform: translate(-300px, 900px) rotate(-20deg); } 55% { transform: translate(560px, 380px) rotate(10deg); } 100% { transform: translate(800px, 560px); } }
      .howl { animation: howl .8s ease-in-out 3.7s 3 alternate; transform-origin: 800px 560px; }
      @keyframes howl { to { transform: scale(1.06); } }
      .eye { opacity: 0; animation: fadeIn .2s 3.7s forwards; }
      .flash { opacity: 0; animation: flash 1.2s 3.8s; }
      @keyframes flash { 10% { opacity: .55; } 100% { opacity: 0; } }
      .claw { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: claw .35s ease-out forwards; }
      .c1 { animation-delay: 4.3s; } .c2 { animation-delay: 4.38s; } .c3 { animation-delay: 4.46s; }
      @keyframes claw { to { stroke-dashoffset: 0; } }
      @keyframes fadeIn { to { opacity: 1; } }
    `,
    svg: () => `
      <defs>
        <linearGradient id="csky" x2="0" y2="1"><stop offset="0" stop-color="#030712"/><stop offset=".7" stop-color="#0e2458"/><stop offset="1" stop-color="#1c3c7c"/></linearGradient>
        <radialGradient id="cmoon"><stop offset="0" stop-color="#fffdf0"/><stop offset=".85" stop-color="#f4e2a4"/><stop offset="1" stop-color="#d8bc70"/></radialGradient>
        <radialGradient id="chalo"><stop offset=".45" stop-color="#fff4c0" stop-opacity=".5"/><stop offset="1" stop-color="#8aa8e8" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#csky)"/>
      <g class="moonR"><circle cx="800" cy="330" r="420" fill="url(#chalo)"/><circle cx="800" cy="330" r="250" fill="url(#cmoon)"/></g>
      <g fill="#0b1630">${forest(700, 26, 140, 120, 7)}</g>
      <path d="M0 ${H}V720C300 690 600 700 800 720C1000 700 1300 690 ${W} 720V${H}Z" fill="#05070e"/>
      ${village(760)}
      <path d="M700 560H900V600H700Z" fill="#05070e"/>
      <g class="leaper"><g class="howl"><g transform="scale(3.4)" fill="#05070e"><path d="${WOLF}"/></g>
        <g class="eye" transform="scale(3.4)"><circle cx="8" cy="-79" r="1.6" fill="#ffd23a"/><circle cx="12.5" cy="-79" r="1.6" fill="#ffd23a"/></g></g></g>
      <rect class="flash" width="${W}" height="${H}" fill="#c01818"/>
      <g stroke="#e02a20" stroke-width="22" stroke-linecap="round" fill="none" opacity=".9">
        <path class="claw c1" d="M260 80L1180 860"/><path class="claw c2" d="M420 40L1340 820"/><path class="claw c3" d="M580 10L1500 780"/>
      </g>`,
  },

  village: {
    title: '마을의 승리',
    css: `
      .dawn { opacity: 0; animation: fadeIn 3s .4s forwards; }
      .sunR { transform: translateY(300px); animation: sunRise 3.6s cubic-bezier(.2,.7,.3,1) .6s forwards; }
      @keyframes sunRise { to { transform: none; } }
      .march { transform: translateX(-900px); animation: march 3s cubic-bezier(.3,.6,.4,1) 1s forwards; }
      @keyframes march { to { transform: none; } }
      .bob { animation: bob .45s ease-in-out infinite alternate; }
      .bob2 { animation-delay: .2s; } .bob3 { animation-delay: .1s; }
      @keyframes bob { to { transform: translateY(-8px); } }
      .flame { animation: flick .18s infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
      @keyframes flick { to { transform: scale(1.12, .88); } }
      .wolfFall { transform-origin: 1260px 760px; animation: fall 1s cubic-bezier(.5,0,.8,.4) 3.4s forwards; }
      @keyframes fall { 40% { transform: translate(40px, -40px) rotate(20deg); } 100% { transform: translate(120px, 40px) rotate(95deg); opacity: .8; } }
      .cheer { animation: cheer .35s ease-in-out 4.3s 6 alternate; }
      @keyframes cheer { to { transform: translateY(-26px); } }
      .spark { opacity: 0; animation: fadeIn .2s 3.5s forwards; }
      @keyframes fadeIn { to { opacity: 1; } }
    `,
    svg: () => {
      const crowd = [[180, 1.9, 'bob'], [330, 2.1, 'bob bob2'], [480, 1.8, 'bob bob3'], [630, 2.2, 'bob'], [780, 1.95, 'bob bob2']]
        .map(([x, s, c], i) => `<g class="cheer"><g class="${c}">${person(x, 800, s, i % 2 ? TORCH : PITCHFORK)}</g></g>`).join('');
      return `
      <defs>
        <linearGradient id="nsky" x2="0" y2="1"><stop offset="0" stop-color="#050a1e"/><stop offset="1" stop-color="#1c3060"/></linearGradient>
        <linearGradient id="dsky" x2="0" y2="1"><stop offset="0" stop-color="#3a5aa0"/><stop offset=".55" stop-color="#f0a060"/><stop offset=".8" stop-color="#ffd890"/></linearGradient>
        <radialGradient id="csun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".7" stop-color="#ffd860"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#nsky)"/>
      <rect class="dawn" width="${W}" height="${H}" fill="url(#dsky)"/>
      <circle class="sunR" cx="1100" cy="620" r="220" fill="url(#csun)"/>
      <g fill="#1a2238" opacity=".85">${forest(720, 24, 120, 100, 11)}</g>
      <path d="M0 ${H}V760C400 730 1200 730 ${W} 760V${H}Z" fill="#0a0c14"/>
      <g class="wolfFall"><g transform="translate(1260 780) scale(-2.6 2.6)" fill="#0a0c14"><path d="${WOLF}"/></g></g>
      <g class="spark" fill="#ffd860"><path d="M1200 600l10 -30l8 30l30 8l-30 8l-8 30l-10 -30l-30 -8Z"/></g>
      <g class="march">${crowd}</g>`;
    },
  },

  tanner: {
    title: '무두장이의 승리',
    css: `
      .ghost { opacity: 0; transform: translateY(120px); animation: rise 3s ease-out 1.6s forwards; }
      @keyframes rise { to { opacity: .92; transform: none; } }
      .float { animation: float 1.4s ease-in-out infinite alternate; }
      @keyframes float { to { transform: translateY(-16px); } }
      .rain line { animation: rain .7s linear infinite; }
      @keyframes rain { from { transform: translateY(-120px); } to { transform: translateY(120px); } }
      .crowd { opacity: 0; animation: fadeIn 1s .4s forwards; }
      .shock { opacity: 0; animation: fadeIn .2s 3.6s forwards; }
      @keyframes fadeIn { to { opacity: 1; } }
    `,
    svg: () => {
      let rain = '';
      for (let i = 0; i < 80; i++) rain += `<line x1="${(i * 97) % W}" y1="${(i * 53) % H}" x2="${(i * 97) % W - 8}" y2="${(i * 53) % H + 30}" style="animation-delay:-${(i % 7) / 10}s"/>`;
      return `
      <rect width="${W}" height="${H}" fill="#3a4250"/>
      <g fill="#2a303a">${forest(700, 22, 140, 90, 5)}</g>
      <path d="M0 ${H}V740C500 720 1100 720 ${W} 740V${H}Z" fill="#1a1e24"/>
      <path d="M720 760h160v-140c0 -60 -160 -60 -160 0Z" fill="#4a505a" stroke="#1a1e24" stroke-width="6"/>
      <text x="800" y="690" text-anchor="middle" font-size="32" font-family="Georgia, serif" fill="#1a1e24">R.I.P.</text>
      <path d="M760 720h80M800 700v40" stroke="#1a1e24" stroke-width="6"/>
      <g class="crowd">${person(300, 800, 2, '', '#12151a')}${person(430, 800, 1.9, '', '#12151a')}${person(1170, 800, 2, '', '#12151a')}${person(1300, 800, 2.1, '', '#12151a')}
        <g class="shock" fill="#fff" font-size="60" font-family="Georgia"><text x="280" y="560">!</text><text x="420" y="570">?</text><text x="1150" y="560">!</text><text x="1290" y="550">!?</text></g></g>
      <g class="ghost"><g class="float">
        <path d="M740 520C740 380 860 380 860 520V600L840 580L820 600L800 580L780 600L760 580L740 600Z" fill="#eef4ff"/>
        <circle cx="780" cy="470" r="9" fill="#1a1e24"/><circle cx="820" cy="470" r="9" fill="#1a1e24"/>
        <path d="M770 500Q800 530 830 500" stroke="#1a1e24" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M740 520C700 500 690 470 700 450M860 520C900 500 910 470 900 450" stroke="#eef4ff" stroke-width="14" stroke-linecap="round" fill="none"/>
      </g></g>
      <g class="rain" stroke="#9aa4b8" stroke-width="2" opacity=".5">${rain}</g>`;
    },
  },

  none: {
    title: '아무도 이기지 못했다',
    css: `
      .fog { animation: fog 7s linear infinite; }
      @keyframes fog { to { transform: translateX(-400px); } }
      .crow { animation: crow 5s linear forwards; }
      @keyframes crow { from { transform: translate(-200px, 0); } to { transform: translate(1900px, -200px); } }
    `,
    svg: () => `
      <rect width="${W}" height="${H}" fill="#1a2030"/>
      <g fill="#10141e">${forest(720, 24, 150, 100, 3)}</g>
      <path d="M0 ${H}V760C500 740 1100 740 ${W} 760V${H}Z" fill="#080a10"/>
      ${village(770, false)}
      <g class="fog" fill="#8a94a8" opacity=".25"><ellipse cx="400" cy="720" rx="600" ry="60"/><ellipse cx="1500" cy="700" rx="700" ry="70"/><ellipse cx="2300" cy="730" rx="600" ry="60"/></g>
      <g class="crow" fill="#000"><path d="M200 300c-20 -20 -50 -20 -70 0c20 -6 40 0 70 14c30 -14 50 -20 70 -14c-20 -20 -50 -20 -70 0Z"/><path d="M260 360c-12 -12 -30 -12 -42 0c12 -4 24 0 42 8c18 -8 30 -12 42 -8c-12 -12 -30 -12 -42 0Z"/></g>`,
  },
};

/**
 * 결말 영상을 보여준다. 끝나거나 [건너뛰기]를 누르면 resolve.
 * @param {HTMLElement} host
 * @param {'wolf'|'village'|'tanner'|'none'} kind
 * @param {{sub?:string, sound?:Function}} opts
 */
export function playCutscene(host, kind, { sub = '', sound } = {}) {
  const sc = SCENES[kind] || SCENES.none;
  return new Promise((resolve) => {
    host.innerHTML = `<style>${sc.css}</style>
      <div class="cs-bars"></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${sc.svg()}</svg>
      <div class="cs-title">${sc.title}${sub ? `<small>${sub}</small>` : ''}</div>
      <button class="btn btn-sm cs-skip">건너뛰기 ▸</button>`;
    host.hidden = false;
    if (sound) sound(kind);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      host.hidden = true;
      host.innerHTML = '';
      resolve();
    };
    host.querySelector('.cs-skip').addEventListener('click', end);
    setTimeout(end, 7800);
  });
}
