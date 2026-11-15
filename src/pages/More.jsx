import { go } from '../router';

export default function More({ route }) {
  return (
    <div className="stack">
      <h1>더보기</h1>
      <div className="quick">
        <button className="tile" onClick={() => go('/stats')}><span aria-hidden>📊</span>영양 통계</button>
        <button className="tile" onClick={() => go('/shopping')}><span aria-hidden>🛒</span>장보기</button>
        <button className="tile" onClick={() => go('/settings')}><span aria-hidden>⚙️</span>설정·백업</button>
        <button className="tile" onClick={() => go('/help')}><span aria-hidden>❓</span>사용 안내</button>
      </div>
      {route.path === '/help' && <Help />}
      <Help short />
    </div>
  );
}

function Help({ short }) {
  if (short) {
    return (
      <section className="card">
        <h2>꼭 알아 두세요</h2>
        <p>이 앱은 일상 식단 계획을 돕는 도구이며 <b>진단·치료·의료적 영양처방을 대체하지 않습니다.</b> 신장질환, 당뇨병, 삼킴 곤란 등 별도 식이 관리가 필요하면 의료진·임상영양사와 상담해 주세요.</p>
        <p className="muted small">영양 수치는 식품성분표 기반 추정치이며, 식당 메뉴 열량은 분류별 추정값입니다.</p>
      </section>
    );
  }
  return (
    <section className="card help">
      <h2>사용 안내</h2>
      <h3>1. 식단 만들기</h3>
      <p>‘식단’ 화면에서 <b>이 주 식단 만들기</b>를 누르면 7일 21끼가, 월간 보기에서는 그 달 날짜 수만큼 식단이 만들어집니다.</p>
      <h3>2. 메뉴 바꾸기·고정</h3>
      <p>각 끼니의 <b>바꾸기</b>로 다른 추천 메뉴를 고를 수 있어요. 마음에 드는 끼니는 <b>고정</b>하면 다시 만들어도 바뀌지 않아요. ‘더보기’에서 매주 같은 요일에 고정할 수도 있어요.</p>
      <h3>3. 레시피</h3>
      <p>메뉴 이름을 누르면 1~4인분 재료량, 대체 재료, 단계별 조리법이 나와요. 🔊 버튼은 조리법을 읽어 주고, ⏱ 버튼은 타이머를 켭니다.</p>
      <h3>4. 장보기</h3>
      <p>식단의 재료가 품목별로 합쳐집니다. 집에 있는 양을 적으면 살 양에서 빠지고, 인쇄하거나 CSV로 내보낼 수 있어요.</p>
      <h3>5. 외식</h3>
      <p>‘식당’에서 주변 식당을 찾고 <b>외식 기록</b>을 누르면 그 끼니가 외식으로 바뀌고 장보기에서 빠집니다.</p>
      <h3>6. 홈 화면에 설치</h3>
      <p>휴대폰 브라우저 메뉴에서 ‘홈 화면에 추가’를 누르면 앱처럼 쓸 수 있고, 인터넷이 없어도 식단과 레시피를 볼 수 있어요.</p>
    </section>
  );
}
