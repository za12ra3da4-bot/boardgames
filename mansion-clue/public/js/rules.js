// 게임 규칙 설명: 왼쪽 룰 패널 + 크게 보기 창 (그림은 assets/rules/*.svg)

export const RULES = [
  {
    key: 'goal', img: 'goal', title: '목표',
    text: () => '봉투 안에 <b>범인 1명 · 흉기 1개 · 장소 1곳</b> 카드가 숨겨져 있어요. 이 3장이 무엇인지 <b>가장 먼저 정확히 맞히는 사람</b>이 이겨요.',
  },
  {
    key: 'deal', img: 'deal', title: '준비 (카드 나누기)',
    text: () => '봉투에 들어간 3장을 뺀 나머지 카드는 모두에게 똑같이 나눠줘요. <b>내 손에 있는 카드는 절대 정답이 아니에요.</b> 오른쪽 <b>내 카드</b> 탭에서 확인하세요.',
  },
  {
    key: 'move', img: 'move', title: '이동',
    text: () => '내 차례에 <b>주사위 굴리기</b>를 누르면 두 주사위 합만큼 <b>이내</b>로 움직일 수 있어요. 보드에서 <b>빛나는 칸이나 방</b>을 누르면 이동해요. 방은 <b>문(금색 화살표)</b>으로만 들어갈 수 있고, 방에 들어가면 남은 칸은 버려요. 다른 사람 말이 서 있는 칸은 지나갈 수 없어요.',
  },
  {
    key: 'passage', img: 'passage', title: '비밀 통로',
    text: () => '<b>부엌 ↔ 서재</b>, <b>온실 ↔ 라운지</b>처럼 대각선 모서리 방끼리는 비밀 통로로 이어져 있어요. 그 방에서 차례를 시작하면 주사위 없이 <b>비밀 통로</b> 버튼으로 바로 건너가요.',
  },
  {
    key: 'suggest', img: 'suggest', title: '추리',
    text: () => '방에 들어가면 <b>추리하기</b>를 눌러 "<b>이 방에서, 이 사람이, 이 흉기로</b> 죽였다!"를 지목해요. 장소는 지금 있는 방으로 정해지고, 용의자와 흉기만 고르면 돼요. 지목된 사람의 말과 흉기는 그 방으로 끌려와요. 한 차례에 한 번만 추리할 수 있어요.',
  },
  {
    key: 'disprove', img: 'disprove', title: '반박',
    text: () => '추리하면 <b>다음 사람부터 순서대로</b> 확인해요. 지목된 3장 중 <b>하나라도 가진 첫 사람</b>이 그중 한 장을 <b>추리한 사람에게만 몰래</b> 보여줘요. 한 명이 보여주면 거기서 끝! 끝까지 아무도 못 보여주면 <b>반박 불가</b>, 그 조합이 정답일 가능성이 아주 높아요.',
  },
  {
    key: 'notes', img: 'notebook', title: '수첩 (추리 노트)',
    text: (ic) => `받은 카드와 "카드가 없다"고 확인된 사람 정보는 오른쪽 <b>수첩</b> 탭에 자동으로 기록돼요. 칸을 눌러 ${ic('check')} 가짐, ${ic('x')} 없음, <b>?</b> 의심을 직접 적을 수도 있어요. <b>모든 사람이 ${ic('x')}인 카드</b>가 바로 봉투 속 정답이에요.`,
  },
  {
    key: 'accuse', img: 'accuse', title: '최종 고발',
    text: () => '범인·흉기·장소가 확실해지면 내 차례에 언제든 <b>최종 고발</b>을 눌러요. 3장이 모두 맞으면 <b>승리!</b> 하나라도 틀리면 <b>탈락</b>해서 더는 이동·추리를 못 하지만, 다른 사람의 추리는 계속 반박해야 해요. 모두 탈락하고 한 명만 남으면 그 사람이 이겨요.',
  },
];

export const TIPS = [
  '다른 사람의 추리에서 <b>누가 카드를 못 냈는지</b>도 큰 힌트예요.',
  '내가 가진 카드를 섞어서 추리하면 상대를 헷갈리게 할 수 있어요.',
  '누군가의 추리로 방에 끌려오면, 다음 차례에 <b>이동 없이 바로 추리</b>할 수 있어요.',
  '차례마다 제한 시간은 90초예요. 시간이 지나면 자동으로 다음 사람에게 넘어가요.',
  '보드는 <b>드래그로 회전</b>, <b>휠로 확대</b>할 수 있어요. 오른쪽 아래 버튼으로 시점을 바꿀 수 있어요.',
];

export function currentStep(g, pid) {
  if (g.phase !== 'play') return 'accuse';
  const t = g.turn;
  const sg = g.suggestion;
  if (t.stage === 'disprove') return 'disprove';
  if (t.stage === 'room' || (t.stage === 'start' && t.canSuggest)) return 'suggest';
  if (t.stage === 'start' && t.canPassage) return 'passage';
  if (t.stage === 'reveal') return sg && sg.card && sg.by === pid ? 'notes' : 'accuse';
  if (t.stage === 'after') return 'accuse';
  return 'move';
}

function nowTip(g, pid, { esc, pname }) {
  if (g.phase === 'over') return '사건이 끝났어요. <b>사건 파일</b>에서 정답을 확인하세요.';
  const t = g.turn;
  const sg = g.suggestion;
  if (sg && sg.waiting === pid) return '<b>반박할 차례!</b> 가운데 창에서 보여줄 카드 1장을 고르세요. 추리한 사람만 볼 수 있어요.';
  if (t.pid !== pid) {
    if (t.stage === 'disprove') return `<b>${esc(pname(sg.waiting))}</b>님이 반박 중이에요. 누가 카드를 <b>못 냈는지</b> 잘 보세요.`;
    return `<b>${esc(pname(t.pid))}</b>님의 차례예요. 다른 사람의 추리와 반박도 힌트가 돼요.`;
  }
  if (g.me && g.me.out) return '탈락했어요. 다른 사람이 추리하면 반박만 해주세요.';
  switch (t.stage) {
    case 'start':
      if (t.canSuggest) return '누군가의 추리로 끌려온 방이에요. <b>바로 추리</b>하거나, 주사위를 굴려 이동하세요.';
      if (t.canPassage) return '<b>비밀 통로</b>로 반대편 모서리 방에 바로 가거나, <b>주사위 굴리기</b>로 이동하세요.';
      return '오른쪽의 <b>주사위 굴리기</b>를 눌러 시작하세요.';
    case 'move':
      return '보드에서 <b>빛나는 칸이나 방</b>을 눌러 이동하세요. 방에 들어가야 추리할 수 있어요.';
    case 'room':
      return '<b>추리하기</b>를 눌러 범인과 흉기를 지목하세요.';
    case 'reveal':
      return sg && sg.none
        ? '아무도 반박하지 못했어요! 지목한 카드가 <b>정답일 가능성</b>이 높아요.'
        : '받은 카드는 수첩에 기록됐어요. 확신이 서면 <b>최종 고발</b>, 아니면 <b>턴 마치기</b>.';
    case 'after':
      return '이번엔 방에 못 들어갔어요. <b>턴 마치기</b>를 누르세요.';
    default:
      return '';
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
      <p>${r.text(ic)}</p></li>`).join('')}</ol>
    <div class="rules-tips"><b>${ic('search')}추리 팁</b><ul>${TIPS.map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <button class="btn btn-dark btn-sm wide" data-rules-more>${ic('scroll')}크게 보기</button>`;
}

export function rulesModalHtml(ic) {
  return `<h3 class="m-title">${ic('help')} 밤의 저택 게임 방법</h3>
    <p class="m-sub">클루(Clue) 방식의 추리 게임이에요. 질문(추리)과 반박으로 정보를 모아, 봉투 속 세 장을 먼저 맞히세요.</p>
    <div class="rules-grid">${RULES.map((r, i) => `<div class="rules-card"><img src="assets/rules/${r.img}.svg" alt=""><div><b><span class="rs-num">${i + 1}</span>${r.title}</b><p>${r.text(ic)}</p></div></div>`).join('')}</div>
    <div class="rules-tips big"><b>${ic('search')}추리 팁</b><ul>${TIPS.map((t) => `<li>${t}</li>`).join('')}</ul></div>`;
}
