import { useState } from 'react';
import { useStore } from '../store';
import { RECIPE_BY_ID, MEAL_LABEL } from '../data/recipes';
import { MEAL_KEYS, dayTotals, entryNutrition, round, won } from '../lib/nutrition';
import { today, weekDates, addDays, fmtDate, monthKey, monthDates, addMonths, fmtMonth, weekStart, parse } from '../lib/date';
import { DayPanel } from '../components/meal';
import { WeekTable } from '../components/dashboard';
import { NutrientBars, Seg, Modal } from '../components/ui';
import { download, toCSV } from '../lib/exporter';
import { go } from '../router';

export default function Plan({ route }) {
  const view = route.query.view || 'week';
  const d = route.query.d || today();
  return (
    <div className="stack">
      <div className="row between wrap">
        <h1>식단</h1>
        <Seg label="보기" value={view} onChange={(v) => go(`/plan?view=${v}&d=${d}`)} options={[{ value: 'week', label: '주간' }, { value: 'month', label: '월간' }]} />
      </div>
      {view === 'month' ? <Month d={d} /> : <Week d={d} />}
    </div>
  );
}

function planCSV(state, targets, dates) {
  const rows = [['날짜', '끼니', '메뉴', '인분', '열량(kcal)', '탄수화물(g)', '단백질(g)', '지방(g)', '나트륨(mg)', '고정', '먹음', '비고']];
  for (const d of dates) for (const k of MEAL_KEYS) {
    const e = state.plans[d]?.[k];
    if (!e) continue;
    const n = entryNutrition(e, k, targets) || {};
    const title = e.eatOut ? `외식: ${e.eatOut.name}` : RECIPE_BY_ID[e.recipeId]?.title;
    rows.push([d, MEAL_LABEL[k], title, e.servings, round(n.kcal || 0), round(n.carb || 0), round(n.protein || 0), round(n.fat || 0), round(n.sodium || 0), e.locked ? 'Y' : '', e.eaten ? 'Y' : '', e.eatOut ? '열량 추정치' : '1인분 기준 추정치']);
  }
  return toCSV(rows);
}

function Week({ d }) {
  const { state, targets, generate, notify, update } = useStore();
  const dates = weekDates(d);
  const [confirm, setConfirm] = useState(null);
  const filled = dates.filter((x) => Object.keys(state.plans[x] || {}).length).length;
  const totals = dates.map((x) => dayTotals(state.plans[x], targets)).filter((t) => t.count);
  const avg = totals.length ? Object.fromEntries(['kcal', 'carb', 'protein', 'fat', 'sodium', 'cost'].map((k) => [k, totals.reduce((s, t) => s + t[k], 0) / totals.length])) : null;
  const weekCost = totals.reduce((s, t) => s + t.cost, 0);

  const regen = () => {
    const r = generate(dates, { overwrite: true });
    notify(r.warnings[0] || '이번 주 식단을 새로 만들었어요 (고정·외식 끼니는 그대로)');
    setConfirm(null);
  };
  const copyPrev = () => {
    update('plans', (plans) => {
      const next = { ...plans };
      dates.forEach((x) => {
        const src = plans[addDays(x, -7)];
        if (src) next[x] = Object.fromEntries(Object.entries(src).map(([k, e]) => [k, { ...e, eaten: false }]));
      });
      return next;
    });
    notify('지난주 식단을 복사했어요');
    setConfirm(null);
  };
  const hasPrev = dates.some((x) => Object.keys(state.plans[addDays(x, -7)] || {}).length);

  return (
    <>
      <div className="pager">
        <button className="btn ghost" onClick={() => go(`/plan?view=week&d=${addDays(dates[0], -7)}`)} aria-label="지난 주">◀ 지난 주</button>
        <div className="center"><b>{fmtDate(dates[0])} ~ {fmtDate(dates[6]).replace(/^\d+월 /, '')}</b>{weekStart(today()) === dates[0] && <div className="muted small">이번 주</div>}</div>
        <button className="btn ghost" onClick={() => go(`/plan?view=week&d=${addDays(dates[0], 7)}`)} aria-label="다음 주">다음 주 ▶</button>
      </div>

      <div className="row wrap no-print">
        <button className="btn primary" onClick={() => (filled ? setConfirm('regen') : regen())}>{filled ? '주 전체 다시 만들기' : '이 주 식단 만들기 (21끼)'}</button>
        {filled > 0 && filled < 7 && <button className="btn" onClick={() => { const r = generate(dates, { overwrite: false }); notify(r.warnings[0] || '빈 끼니를 채웠어요'); }}>빈 끼니만 채우기</button>}
        {hasPrev && <button className="btn ghost" onClick={() => setConfirm('copy')}>지난주 식단 복사</button>}
        <button className="btn ghost" onClick={() => window.print()}>인쇄·PDF</button>
        <button className="btn ghost" onClick={() => download(`식단_${dates[0]}.csv`, planCSV(state, targets, dates), 'text/csv')}>CSV</button>
      </div>

      {avg && (
        <section className="card">
          <h2>이번 주 하루 평균 <span className="est">추정치</span></h2>
          <NutrientBars totals={avg} targets={targets} />
          <p className="muted small">가정식 예상 재료비(1인분 기준): 주 {won(weekCost)}</p>
        </section>
      )}

      {filled > 0 && <section className="panel only-wide"><WeekTable dates={dates} /><p className="muted small">칸을 누르면 메뉴 정보를 볼 수 있고, 메뉴 이름을 누르면 레시피로 이동해요.</p></section>}
      <div className={`week ${filled > 0 ? 'only-narrow' : ''}`}>
        {dates.map((x) => <DayPanel key={x} date={x} compact />)}
      </div>

      {confirm === 'regen' && (
        <Modal title="주 전체 다시 만들기" onClose={() => setConfirm(null)}>
          <p>고정(🔒)하거나 외식으로 표시한 끼니를 빼고 이번 주 메뉴를 모두 새로 고릅니다.</p>
          <div className="row"><button className="btn primary" onClick={regen}>다시 만들기</button><button className="btn ghost" onClick={() => setConfirm(null)}>취소</button></div>
        </Modal>
      )}
      {confirm === 'copy' && (
        <Modal title="지난주 식단 복사" onClose={() => setConfirm(null)}>
          <p>지난주 같은 요일의 메뉴를 이번 주에 그대로 복사합니다. 이번 주에 있던 메뉴는 덮어씁니다.</p>
          <div className="row"><button className="btn primary" onClick={copyPrev}>복사하기</button><button className="btn ghost" onClick={() => setConfirm(null)}>취소</button></div>
        </Modal>
      )}
    </>
  );
}

function Month({ d }) {
  const { state, targets, generate, notify } = useStore();
  const ym = monthKey(d);
  const dates = monthDates(ym);
  const [sel, setSel] = useState(dates.includes(today()) ? today() : dates[0]);
  const [confirm, setConfirm] = useState(false);
  const selected = dates.includes(sel) ? sel : dates[0];
  const lead = (parse(dates[0]).getDay() + 6) % 7; // 월요일 시작
  const filled = dates.filter((x) => Object.keys(state.plans[x] || {}).length).length;

  const make = (overwrite) => {
    const r = generate(dates, { overwrite });
    notify(r.warnings[0] || `${fmtMonth(ym)} ${dates.length}일 식단을 만들었어요`);
    setConfirm(false);
  };

  return (
    <>
      <div className="pager">
        <button className="btn ghost" onClick={() => go(`/plan?view=month&d=${addMonths(ym, -1)}-01`)}>◀ 이전 달</button>
        <b>{fmtMonth(ym)} ({dates.length}일)</b>
        <button className="btn ghost" onClick={() => go(`/plan?view=month&d=${addMonths(ym, 1)}-01`)}>다음 달 ▶</button>
      </div>
      <div className="row wrap no-print">
        {filled < dates.length && <button className="btn primary" onClick={() => make(false)}>{filled ? '빈 날짜 채우기' : `이 달 식단 만들기 (${dates.length * 3}끼)`}</button>}
        {filled > 0 && <button className="btn" onClick={() => setConfirm(true)}>한 달 전체 다시 만들기</button>}
        <button className="btn ghost" onClick={() => window.print()}>인쇄·PDF</button>
        <button className="btn ghost" onClick={() => download(`식단_${ym}.csv`, planCSV(state, targets, dates), 'text/csv')}>CSV</button>
      </div>

      <div className="cal" role="grid" aria-label={`${fmtMonth(ym)} 달력`}>
        {['월', '화', '수', '목', '금', '토', '일'].map((w) => <div key={w} className="cal-h" role="columnheader">{w}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} className="cal-e" />)}
        {dates.map((x) => {
          const day = state.plans[x] || {};
          const t = dayTotals(day, targets);
          const wd = parse(x).getDay();
          return (
            <button key={x} role="gridcell" className={`cal-d ${x === selected ? 'sel' : ''} ${x === today() ? 'today' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`} onClick={() => setSel(x)} aria-label={`${fmtDate(x)} ${t.count ? `${round(t.kcal)}kcal` : '식단 없음'}`} aria-pressed={x === selected}>
              <span className="cal-n">{Number(x.slice(8))}</span>
              <span className="cal-m">
                {MEAL_KEYS.map((k) => {
                  const e = day[k];
                  const r = e && RECIPE_BY_ID[e.recipeId];
                  return <span key={k} className="cal-item">{e ? (e.eatOut ? '🍽️' : r?.emoji) : '·'}<span className="cal-name">{e ? (e.eatOut ? e.eatOut.name : r?.title.split(/[,과와]/)[0]) : ''}</span></span>;
                })}
              </span>
              {t.count > 0 && <span className="cal-k">{round(t.kcal)}</span>}
            </button>
          );
        })}
      </div>

      <DayPanel date={selected} />
      <button className="btn ghost no-print" onClick={() => go(`/plan?view=week&d=${selected}`)}>이 주를 주간 화면에서 편집하기 →</button>

      {confirm && (
        <Modal title="한 달 전체 다시 만들기" onClose={() => setConfirm(false)}>
          <p>고정·외식 끼니를 제외한 {fmtMonth(ym)}의 모든 메뉴를 새로 고릅니다.</p>
          <div className="row"><button className="btn primary" onClick={() => make(true)}>다시 만들기</button><button className="btn ghost" onClick={() => setConfirm(false)}>취소</button></div>
        </Modal>
      )}
    </>
  );
}

