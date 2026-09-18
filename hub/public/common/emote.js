/* 이모트: 누르면 내 자리 옆에 내 캐릭터가 튀어나와 말풍선을 띄우고 춤춘다 */
import { avatarSvg, PARTS, EMOTES } from './avatar.js';
import { getMe, loadCss } from './me.js';

const LIFE = 3400;
const COOLDOWN = 1800;
let actx = null;

/** 이모트마다 다른 짧은 소리 (합성음) */
function blip(id) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    const notes = {
      hurry: [880, 880, 880], mock: [520, 660, 440], lol: [700, 800, 700, 800], tease: [600, 900],
      nice: [660, 990], close: [520, 380], angry: [180, 160], gg: [520, 660, 780],
    }[id] || [600];
    notes.forEach((f, i) => {
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = id === 'angry' ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(f, t + i * 0.09);
      g.gain.setValueAtTime(0.0001, t + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.09, t + i * 0.09 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.12);
      o.connect(g).connect(actx.destination);
      o.start(t + i * 0.09);
      o.stop(t + i * 0.09 + 0.14);
    });
  } catch (_) { /* 소리 막힘 */ }
}

const live = new Map();

/** 캐릭터를 어느 자리 옆에 띄울지 */
function place(pop, anchor, mine) {
  const W = 118;
  const H = pop.offsetHeight || 190;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x;
  let y;
  const r = anchor && anchor.getBoundingClientRect();
  if (r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) {
    // 자리 오른쪽 → 모자라면 왼쪽 → 그래도 안 되면 위
    if (r.right + W + 6 < vw) x = r.right + 4;
    else if (r.left - W - 6 > 0) x = r.left - W - 4;
    else x = r.left + r.width / 2 - W / 2;
    y = r.top + r.height / 2 - H * 0.62;
    if (x === r.left + r.width / 2 - W / 2) y = r.top - H + 10;
  } else if (mine) {
    x = 18;
    y = vh - H - 90;
  } else {
    x = vw - W - 24;
    y = 90;
  }
  pop.style.left = `${Math.round(Math.max(6, Math.min(vw - W - 6, x)))}px`;
  pop.style.top = `${Math.round(Math.max(6, Math.min(vh - H - 6, y)))}px`;
}

/** 화면에 이모트 하나 띄우기 */
export function showEmote({ pid, id, avatar, name, anchor, mine }) {
  const e = EMOTES.find((x) => x.id === id);
  if (!e) return;
  const old = live.get(pid);
  if (old) { clearTimeout(old.t); old.el.remove(); }
  const pop = document.createElement('div');
  pop.className = 'emo-pop';
  pop.innerHTML = `<div class="emo-bubble"></div>${avatarSvg(avatar, { emote: id })}${name ? '<div class="emo-name"></div>' : ''}`;
  pop.querySelector('.emo-bubble').textContent = e.text;
  if (name) pop.querySelector('.emo-name').textContent = name;
  document.body.appendChild(pop);
  place(pop, anchor, mine);
  blip(id);
  const rec = { el: pop, t: 0 };
  rec.t = setTimeout(() => {
    pop.classList.add('out');
    setTimeout(() => { pop.remove(); if (live.get(pid) === rec) live.delete(pid); }, 400);
  }, LIFE);
  live.set(pid, rec);
}

/**
 * 게임에 이모트 붙이기
 * @param {object} o
 *   socket   게임 소켓
 *   myPid()  내 pid
 *   active() 지금 방 안에 있는지 (버튼 보이기)
 *   anchor(pid) 그 사람 자리 요소 (없으면 [data-pid] 로 찾는다)
 *   nameOf(pid) 이름 (선택)
 */
export async function mountEmotes(o) {
  loadCss();
  const me = await getMe();
  const myAvatar = () => (me ? me.profile.avatar : PARTS.fromSeed(o.myPid() || 'guest'));

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'emo-fab';
  fab.title = '이모트';
  fab.hidden = true;
  const panel = document.createElement('div');
  panel.className = 'emo-panel';
  panel.hidden = true;
  document.body.append(panel, fab);

  let drawnFor = '';
  const paint = () => {
    const key = JSON.stringify(myAvatar());
    if (key === drawnFor) return;
    drawnFor = key;
    fab.innerHTML = avatarSvg(myAvatar(), { crop: 'head', bg: true });
    panel.innerHTML = `<div class="emo-head">이모트 <small>${me ? '<a href="/profile.html" target="_blank">캐릭터 꾸미기</a>' : '<a href="/profile.html" target="_blank">로그인하면 내 캐릭터로</a>'}</small></div>`
      + EMOTES.map((e) => `<button type="button" class="emo-btn" data-emo="${e.id}">${avatarSvg(myAvatar(), { expr: e.expr, crop: 'head' })}<span>${e.text}</span></button>`).join('');
  };

  // 화면에 보이는 자리 요소를 고른다 (3D/평면처럼 같은 사람 요소가 여러 개일 수 있다)
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const findAnchor = (pid) => {
    const own = o.anchor && o.anchor(pid);
    if (own && visible(own)) return own;
    const q = CSS.escape(pid);
    return [...document.querySelectorAll(`[data-pid="${q}"], [data-seat="${q}"]`)].find(visible) || null;
  };

  let last = 0;
  panel.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-emo]');
    if (!b) return;
    const now = Date.now();
    if (now - last < COOLDOWN) return;
    last = now;
    o.socket.emit('emote', { id: b.dataset.emo, avatar: myAvatar() });
    panel.hidden = true;
    panel.classList.add('cool');
    setTimeout(() => panel.classList.remove('cool'), COOLDOWN);
  });
  fab.addEventListener('click', () => { paint(); panel.hidden = !panel.hidden; });
  document.addEventListener('pointerdown', (ev) => {
    if (!panel.hidden && !panel.contains(ev.target) && !fab.contains(ev.target)) panel.hidden = true;
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') panel.hidden = true; });

  o.socket.on('emote', (d) => {
    if (!d || !d.pid) return;
    const mine = d.pid === o.myPid();
    showEmote({ pid: d.pid, id: d.id, avatar: d.avatar, name: mine ? '' : (d.name || (o.nameOf && o.nameOf(d.pid)) || ''), anchor: findAnchor(d.pid), mine });
  });

  // 방 안에 있을 때만 버튼을 보인다
  const tick = () => {
    const on = !!o.active();
    if (fab.hidden === on) {
      fab.hidden = !on;
      if (!on) panel.hidden = true;
      if (on) paint();
    }
  };
  tick();
  setInterval(tick, 700);
}
