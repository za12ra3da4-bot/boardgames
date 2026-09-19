/* 서버가 맡긴 방 사본 (암호화돼 있어서 브라우저는 못 읽는다)
   서버가 다시 켜져 방이 사라졌을 때, 다시 접속하면서 이걸 내밀면 하던 게임이 이어진다. */
export function roomKeeper(id) {
  const K = `bg.save.${id}`;
  return {
    get() { try { return localStorage.getItem(K) || ''; } catch (_) { return ''; } },
    attach(socket) {
      socket.on('room:save', (blob) => { try { localStorage.setItem(K, blob); } catch (_) { /* 저장소 꽉 참 */ } });
      // 방에서 나왔으면 사본도 버린다
      socket.on('room', (r) => { if (!r) try { localStorage.removeItem(K); } catch (_) { /* 무시 */ } });
    },
  };
}
