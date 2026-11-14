import { useState } from 'react';
import { useStore } from '../store';
import { dayTotals, round, won } from '../lib/nutrition';
import { today, weekDates, monthDates, monthKey, addDays, addMonths, fmtDate, fmtMonth, parse, WD } from '../lib/date';
import { NutrientBars, Seg } from '../components/ui';

export default function Stats() {
  const { state, targets } = useStore();
  const [period, setPeriod] = useState('week');
  const [anchor, setAnchor] = useState(today());
  const dates = period === 'week' ? weekDates(anchor) : monthDates(monthKey(anchor));
  const rows = dates.map((d) => ({ d, t: dayTotals(state.plans[d], targets), snack: (state.snacks[d] || []).reduce((s, x) => s + (Number(x.kcal) || 0), 0) }));
  const planned = rows.filter((r) => r.t.count);
  const avg = planned.length ? Object.fromEntries(['kcal', 'carb', 'protein', 'fat', 'sodium'].map((k) => [k, planned.reduce((s, r) => s + r.t[k], 0) / planned.length])) : null;
  const meals = planned.reduce((s, r) => s + r.t.count, 0);
  const eaten = planned.reduce((s, r) => s + r.t.eaten, 0);
  const out = planned.reduce((s, r) => s + r.t.eatOut, 0);
  const cost = planned.reduce((s, r) => s + r.t.cost, 0);
  const max = Math.max(targets.meals.kcal * 1.3, ...rows.map((r) => r.t.kcal + r.snack));
  const move = (n) => setAnchor(period === 'week' ? addDays(anchor, 7 * n) : `${addMonths(monthKey(anchor), n)}-01`);

  return (
    <div className="stack">
      <h1>영양 통계</h1>
      <Seg label="기간" value={period} onChange={setPeriod} options={[{ value: 'week', label: '주별' }, { value: 'month', label: '월별' }]} />
      <div className="pager">
        <button className="btn ghost" onClick={() => move(-1)}>◀ 이전</button>
        <b>{period === 'week' ? `${fmtDate(dates[0])} ~ ${fmtDate(dates[6])}` : fmtMonth(monthKey(anchor))}</b>
        <button className="btn ghost" onClick={() => move(1)}>다음 ▶</button>
      </div>
      {!avg ? <p className="card center">이 기간에 식단이 없어요.</p> : (
        <>
          <section className="card">
            <h2>하루 평균 (계획 기준) <span className="est">추정치</span></h2>
            <NutrientBars totals={avg} targets={targets} />
          </section>
          <section className="card">
            <div className="kpis">
              <div><span className="muted small">식단 있는 날</span><b>{planned.length}일</b></div>
              <div><span className="muted small">먹었다고 표시</span><b>{meals ? Math.round((eaten / meals) * 100) : 0}%</b></div>
              <div><span className="muted small">외식</span><b>{out}끼</b></div>
              <div><span className="muted small">집밥 재료비</span><b>{won(cost)}</b></div>
            </div>
          </section>
          <section className="card">
            <h2>일별 열량</h2>
            <p className="muted small">진한 막대: 세 끼 · 연한 막대: 간식·음료 · 세로선: 세 끼 목표 {round(targets.meals.kcal).toLocaleString()}kcal</p>
            <ul className="daybars">
              {rows.map(({ d, t, snack }) => (
                <li key={d}>
                  <span className="db-label">{period === 'week' ? WD[parse(d).getDay()] : Number(d.slice(8))}</span>
                  <span className="db-track">
                    <span className="db-meal" style={{ width: `${(t.kcal / max) * 100}%` }} />
                    <span className="db-snack" style={{ width: `${(snack / max) * 100}%` }} />
                    <span className="db-target" style={{ left: `${(targets.meals.kcal / max) * 100}%` }} />
                  </span>
                  <span className="db-val">{t.count ? round(t.kcal + snack).toLocaleString() : '-'}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="muted small">계획한 식단 기준 추정치입니다. 외식은 입력한 열량 추정값만 포함되며, 실제 섭취량과 다를 수 있습니다.</p>
        </>
      )}
    </div>
  );
}
