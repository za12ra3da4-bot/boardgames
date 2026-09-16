// 뱅 규칙 설명: 왼쪽 룰 패널 + 크게 보기 (그림은 assets/rules, assets/card, assets/face)
const B = window.BANG;

export const RULES = [
  { key: 'roles', img: 'roles', title: '역할과 승리 조건', text: '게임 시작 때 비밀 역할을 받아요. <b>보안관</b>만 모두에게 공개됩니다.<br><b>보안관·부관</b>: 무법자와 배신자를 모두 제거하면 승리<br><b>무법자</b>: 보안관을 쓰러뜨리면 승리<br><b>배신자</b>: 다른 모두를 없애고 마지막에 보안관까지 쓰러뜨려 혼자 남으면 승리' },
  { key: 'turn', img: 'turn', title: '내 차례 진행', text: '<b>① 카드 2장 뽑기</b> → <b>② 카드 내기</b>(원하는 만큼, 단 뱅!은 1번) → <b>③ 턴 마치기</b>. 턴을 마칠 때 손패가 <b>현재 체력보다 많으면</b> 그만큼 버려야 해요. 보안관이 첫 차례이고, 왼쪽(시계 방향)으로 돌아갑니다.' },
  { key: 'distance', img: 'distance', title: '거리와 사거리', text: '두 사람 사이에 앉은 사람 수 +1이 <b>거리</b>예요 (가까운 방향 기준). 뱅!은 거리가 내 <b>총 사거리</b> 이하일 때만 쏠 수 있어요. 기본 총(콜트)은 사거리 1. 총을 장착하면 사거리가 늘어나요. <b>야생마</b>는 남이 볼 때 +1, <b>조준경</b>은 내가 볼 때 -1.' },
  { key: 'shoot', img: 'shoot', title: '뱅!과 빗나감!', text: '<b>뱅!</b>을 맞은 사람은 <b>빗나감!</b>을 내서 피하거나 체력 1을 잃어요. 빗나감!은 공격받았을 때만 낼 수 있어요. <b>개틀링</b>은 모두에게 뱅!, <b>인디언 습격!</b>은 모두 뱅!을 버리거나 체력을 잃고, <b>결투</b>는 뱅!을 번갈아 버리다 먼저 못 버린 쪽이 체력을 잃어요.' },
  { key: 'check', img: 'check', title: '판정! (술통·감옥·다이너마이트)', text: '<b>판정!</b>은 덱 맨 위 카드를 뒤집어 무늬로 결과를 정해요.<br><b>술통</b>: 뱅!을 맞으면 판정, 하트면 빗나감!<br><b>감옥</b>: 차례 시작에 판정, 하트면 탈출 / 아니면 그 차례를 건너뜀<br><b>다이너마이트</b>: 차례 시작에 판정, 스페이드 2~9면 폭발해 체력 3을 잃고, 아니면 다음 사람에게 넘어가요.' },
  { key: 'death', img: 'death', title: '탈락과 보상', text: '체력이 0이 되면 탈락하고 역할이 공개돼요. 쓰러지기 직전에 <b>맥주</b>가 있으면 마시고 버틸 수 있어요 (2명 남으면 불가). <b>무법자를 쓰러뜨린 사람</b>은 카드 3장을 받고, <b>보안관이 부관을 쏘면</b> 보안관은 가진 카드를 모두 잃어요.' },
];

export const TIPS = [
  '역할을 들키지 않게 연기하는 것도 전략이에요. 누가 보안관을 공격하는지 잘 보세요.',
  '빗나감!과 맥주는 아껴두면 목숨을 구해줘요.',
  '손패는 체력만큼만 가지고 턴을 마칠 수 있어요. 필요 없는 카드는 장착하거나 써버리세요.',
  '카드에 마우스를 올리면 크게 보고 설명을 읽을 수 있어요.',
  '차례 제한 시간은 90초, 대응(빗나감! 등)은 25초예요. 시간이 지나면 자동으로 처리돼요.',
];

export function currentStep(g, pid) {
  if (!g || g.phase !== 'play') return 'roles';
  const pr = g.prompt;
  if (pr) {
    if (['missed', 'indians', 'duel'].includes(pr.type)) return 'shoot';
    if (pr.type === 'dying') return 'death';
    if (pr.type === 'play' || pr.type === 'discard') return 'turn';
  }
  const t = g.turn;
  if (t && t.stage === 'start') return 'check';
  return 'turn';
}

function nowTip(g, pid, { esc, pname }) {
  if (g.phase === 'over') return '게임이 끝났어요. 결과 창에서 모두의 역할을 확인하세요.';
  const pr = g.prompt;
  if (!pr) return '카드가 처리되는 중...';
  if (pr.pid !== pid) return `<b>${esc(pname(pr.pid))}</b>님이 선택하는 중이에요.`;
  switch (pr.type) {
    case 'play': return '손패에서 카드를 눌러 내세요. 대상이 필요한 카드는 누른 뒤 <b>상대 자리</b>를 클릭! 다 했으면 <b>턴 마치기</b>.';
    case 'missed': return '총에 맞았어요! <b>빗나감!</b> 카드를 눌러 피하거나 <b>맞기</b>를 누르세요.';
    case 'indians': return '인디언 습격! <b>뱅!</b> 카드를 버리거나 체력을 잃으세요.';
    case 'duel': return '결투 중! <b>뱅!</b> 카드를 내서 버티거나 포기하세요.';
    case 'dying': return '쓰러지기 직전! <b>맥주</b>를 마시면 버틸 수 있어요.';
    case 'discard': return `손패가 너무 많아요. 버릴 카드 <b>${pr.data.count}장</b>을 골라 확인을 누르세요.`;
    case 'store': return '잡화점! 가운데 펼쳐진 카드 중 <b>1장</b>을 고르세요.';
    case 'kit': return '카드 3장 중 <b>덱에 돌려놓을 1장</b>을 고르세요.';
    case 'jesse': return '첫 카드를 <b>누구의 손패</b>에서 가져올지, 아니면 덱에서 뽑을지 고르세요.';
    case 'pedro': return '첫 카드를 <b>버린 더미</b>에서 가져올지, 덱에서 뽑을지 고르세요.';
    default: return '';
  }
}

export function rulesPanelHtml(g, pid, h) {
  const { ic } = h;
  const cur = currentStep(g, pid);
  return `<div class="rules-head"><b>${ic('help')}게임 방법</b><button class="icon-btn sm" data-rules-close title="접기">${ic('x')}</button></div>
    <div class="rules-now">${ic('clock')}<div><small>지금 할 일</small><div>${nowTip(g, pid, h)}</div></div></div>
    <ol class="rules-steps">${RULES.map((r, i) => `<li class="${r.key === cur ? 'on' : ''}">
      <div class="rs-top"><span class="rs-num">${i + 1}</span><b>${r.title}</b></div>
      <img class="rs-img" src="assets/rules/${r.img}.svg" alt="">
      <p>${r.text}</p></li>`).join('')}</ol>
    <div class="rules-tips"><b>${ic('star')}팁</b><ul>${TIPS.map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <button class="btn btn-dark btn-sm wide" data-rules-more>${ic('cards')}모든 카드 · 캐릭터 설명 보기</button>`;
}

export function rulesModalHtml(ic) {
  const group = (kind) => Object.entries(B.TYPES).filter(([, t]) => t.kind === kind).map(([id, t]) => `
    <div class="ref-card"><img src="assets/card/${id}.svg" alt=""><div><b>${t.name}${t.weapon ? ` <em>사거리 ${t.weapon}</em>` : ''}</b><p>${t.desc}</p></div></div>`).join('');
  return `<h3 class="m-title">${ic('help')} 황야의 뱅 게임 방법</h3>
    <div class="rules-grid">${RULES.map((r, i) => `<div class="rules-card"><img src="assets/rules/${r.img}.svg" alt=""><div><b><span class="rs-num">${i + 1}</span>${r.title}</b><p>${r.text}</p></div></div>`).join('')}</div>
    <h4 class="ref-title">갈색 카드 <small>쓰면 바로 효과가 나고 버려져요</small></h4>
    <div class="ref-grid">${group('brown')}</div>
    <h4 class="ref-title">파란 카드 <small>내 앞에 장착해서 계속 효과가 있어요 (같은 장비는 1개, 총은 1자루)</small></h4>
    <div class="ref-grid">${group('blue')}</div>
    <h4 class="ref-title">캐릭터 능력</h4>
    <div class="ref-grid chars">${B.CHARACTERS.map((c) => `<div class="ref-card"><img class="round" src="assets/face/${c.id}.svg" alt=""><div><b>${c.name} <em>체력 ${c.hp}</em></b><p>${c.ability}</p></div></div>`).join('')}</div>`;
}
