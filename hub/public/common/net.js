// 모든 게임 공통: 연결이 끊기면 화면에 크게 알리고, 게임하는 동안 서버가 잠들지 않게 가끔 깨운다.
// (무료 서버는 한동안 요청이 없으면 잠들어 30초 넘게 멈출 수 있다)

const CSS = `
.net-down { position: fixed; left: 50%; top: 14px; transform: translateX(-50%); z-index: 99999; display: flex; align-items: center; gap: 10px;
  padding: 10px 18px; border-radius: 999px; background: rgba(20, 12, 10, .92); color: #ffe8b0; font: 700 14px 'Noto Sans KR', sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .5), 0 0 0 2px #e0b030; pointer-events: none; }
.net-down i { width: 14px; height: 14px; border-radius: 50%; border: 3px solid #e0b030; border-top-color: transparent; animation: netspin .8s linear infinite; }
.net-down small { color: #c8b89a; font-weight: 500; }
@keyframes netspin { to { transform: rotate(360deg); } }`;

/**
 * @param {import('socket.io-client').Socket} socket 이 게임의 소켓
 */
export function watchConnection(socket) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  let bar = null;
  let since = 0;
  let tick = null;
  const show = () => {
    if (bar) return;
    since = Date.now();
    bar = document.createElement('div');
    bar.className = 'net-down';
    bar.innerHTML = '<i></i><span>서버에 다시 연결하는 중…</span><small></small>';
    document.body.appendChild(bar);
    tick = setInterval(() => {
      const s = Math.round((Date.now() - since) / 1000);
      const sm = bar && bar.querySelector('small');
      if (sm) sm.textContent = s >= 8 ? `${s}초 · 서버가 다시 켜지는 중일 수 있어요 (최대 1분)` : '';
    }, 1000);
  };
  const hide = () => {
    clearInterval(tick);
    if (bar) bar.remove();
    bar = null;
  };
  socket.on('disconnect', () => setTimeout(() => { if (!socket.connected) show(); }, 1200));
  socket.on('connect', hide);
  socket.io.on('reconnect_attempt', () => { if (!socket.connected) show(); });

  // 게임 창이 열려 있는 동안 4분마다 가벼운 요청을 보내 서버가 잠들지 않게 한다
  setInterval(() => { fetch('/api/ping', { cache: 'no-store' }).catch(() => {}); }, 4 * 60_000);
}
