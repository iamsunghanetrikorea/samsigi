import { useState } from 'react';
import { useStore } from '../store';
import { today, fmtDate, weekDates } from '../lib/date';
import { DayPanel } from '../components/meal';
import { go } from '../router';

export default function Home() {
  const { state, targets, generate, notify, update } = useStore();
  const d = today();
  const has = Object.keys(state.plans[d] || {}).length > 0;
  const snacks = state.snacks[d] || [];
  const [sn, setSn] = useState({ name: '', kcal: '' });
  const snackTotal = snacks.reduce((s, x) => s + (Number(x.kcal) || 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 10 ? '좋은 아침이에요' : hour < 17 ? '점심 맛있게 드세요' : '편안한 저녁 되세요';
  const cond = state.profile.conditions || {};

  const addSnack = (e) => {
    e.preventDefault();
    if (!sn.name.trim()) return;
    update('snacks', (s) => ({ ...s, [d]: [...(s[d] || []), { name: sn.name.trim(), kcal: Number(sn.kcal) || 0 }] }));
    setSn({ name: '', kcal: '' });
  };

  return (
    <div className="stack">
      <div>
        <p className="muted">{fmtDate(d)}</p>
        <h1>{state.profile.name ? `${state.profile.name}님, ` : ''}{greet}</h1>
      </div>
      {!has ? (
        <div className="card center stack">
          <p>오늘 식단이 아직 없어요.</p>
          <button className="btn primary big" onClick={() => { const r = generate(weekDates(d), { overwrite: false }); notify(r.warnings[0] || '이번 주 식단을 만들었어요'); }}>이번 주 식단 만들기</button>
        </div>
      ) : (
        <DayPanel date={d} title="오늘의 세 끼" showEaten />
      )}

      <section className="card">
        <h2>간식·음료</h2>
        <p className="muted small">오늘 {snackTotal}kcal / 목표 {targets.snackKcal}kcal (세 끼와 따로 관리)</p>
        {snacks.length > 0 && (
          <ul className="plain">
            {snacks.map((s, i) => (
              <li key={i} className="row between">
                <span>{s.name} · {s.kcal}kcal</span>
                <button className="btn ghost small" onClick={() => update('snacks', (x) => ({ ...x, [d]: x[d].filter((_, j) => j !== i) }))} aria-label={`${s.name} 삭제`}>삭제</button>
              </li>
            ))}
          </ul>
        )}
        <form className="row wrap" onSubmit={addSnack}>
          <input aria-label="간식 이름" placeholder="예: 우유 1잔" value={sn.name} onChange={(e) => setSn({ ...sn, name: e.target.value })} />
          <input aria-label="열량(kcal)" type="number" inputMode="numeric" placeholder="kcal" style={{ maxWidth: '7em' }} value={sn.kcal} onChange={(e) => setSn({ ...sn, kcal: e.target.value })} />
          <button className="btn" type="submit">기록</button>
        </form>
        <div className="chips">
          {[['우유 1잔', 130], ['사과 반 개', 70], ['바나나 1개', 105], ['플레인 요거트', 90], ['삶은 달걀', 70], ['믹스커피', 50]].map(([n, k]) => (
            <button key={n} className="chip" onClick={() => update('snacks', (x) => ({ ...x, [d]: [...(x[d] || []), { name: n, kcal: k }] }))}>+ {n}</button>
          ))}
        </div>
      </section>

      <div className="quick">
        <button className="tile" onClick={() => go('/plan')}><span aria-hidden>📅</span>이번 주 식단</button>
        <button className="tile" onClick={() => go('/shopping')}><span aria-hidden>🛒</span>장보기 목록</button>
        <button className="tile" onClick={() => go('/eat-out')}><span aria-hidden>📍</span>근처 식당</button>
        <button className="tile" onClick={() => go('/stats')}><span aria-hidden>📊</span>영양 통계</button>
      </div>

      {(cond.kidney || cond.diabetes || cond.hypertension) && (
        <p className="notice">입력하신 건강 상태에 맞는 식사는 주치의·임상영양사와 상담해 정해 주세요. 앱의 수치는 추정치입니다.</p>
      )}
    </div>
  );
}
