import { useState } from 'react';
import { useStore } from '../store';
import { today, weekDates, addDays, weekStart, fmtDate, fmtMD } from '../lib/date';
import { t } from '../i18n';
import { DayPanel } from '../components/meal';
import { Modal } from '../components/ui';
import { WelcomeBanner, WeekTable, NutritionDonut, TodayRecipe, ShoppingPreview, RestaurantPreview, MonthMini } from '../components/dashboard';
import { go } from '../router';
import { MyTablePanel, BabSangPanel } from '../components/MyTable';
import { NewsPanel } from '../components/News';

export default function Home() {
  const { state, targets, generate, notify, update } = useStore();
  const d = today();
  const [anchor, setAnchor] = useState(d);
  const [confirm, setConfirm] = useState(false);
  const [sn, setSn] = useState({ name: '', kcal: '' });
  const addSnack = (e) => {
    e.preventDefault();
    if (!sn.name.trim()) return;
    update('snacks', (s) => ({ ...s, [d]: [...(s[d] || []), { name: sn.name.trim(), kcal: Number(sn.kcal) || 0 }] }));
    setSn({ name: '', kcal: '' });
  };
  const dates = weekDates(anchor);
  const filled = dates.some((x) => Object.keys(state.plans[x] || {}).length);
  const snacks = state.snacks[d] || [];
  const snackTotal = snacks.reduce((s, x) => s + (Number(x.kcal) || 0), 0);
  const cond = state.profile.conditions || {};

  const make = (overwrite) => {
    const r = generate(dates, { overwrite });
    notify(r.warnings[0] || (overwrite ? t('이번 주 식단을 새로 만들었어요 (고정·외식 끼니는 그대로)') : t('이번 주 21끼 식단을 만들었어요')));
    setConfirm(false);
  };

  return (
    <div className="dash">
      <WelcomeBanner />

      <div className="dash-main">
        <section className="panel week-panel">
          <div className="week-bar hide-narrow">
            <div className="tabs" role="tablist" aria-label={t('식단 보기')}>
              <button role="tab" aria-selected="true" className="on">{t('이번 주 식단')}</button>
              <button role="tab" aria-selected="false" onClick={() => go(`/plan?view=month&d=${anchor}`)}>{t('이번 달 식단')}</button>
            </div>
            <div className="week-nav">
              <button className="btn icon ghost" onClick={() => setAnchor(addDays(dates[0], -7))} aria-label={t('지난 주')}>‹</button>
              <b>{fmtDate(dates[0])} ~ {fmtDate(dates[6])}</b>
              <button className="btn icon ghost" onClick={() => setAnchor(addDays(dates[0], 7))} aria-label={t('다음 주')}>›</button>
              {weekStart(anchor) !== weekStart(d) && <button className="btn small ghost" onClick={() => setAnchor(d)}>{t('오늘')}</button>}
            </div>
            <div className="row wrap">
              <button className="btn soft" onClick={() => (filled ? setConfirm(true) : make(false))}>↻ {filled ? t('식단 다시 생성') : t('이 주 식단 만들기')}</button>
              <button className="btn ghost" onClick={() => go('/settings')}>⚙ {t('식단 조건 설정')}</button>
            </div>
          </div>
          {filled ? (
            <>
              <div className="only-wide"><WeekTable dates={dates} /></div>
              <div className="only-narrow">
                {dates.includes(d) ? <DayPanel date={d} title={<>{t('오늘의 메뉴')} <span className="day-date">{fmtDate(d)}</span></>} showEaten hideRegen /> : <p className="muted">{t('아래 ‘주간 식단’에서 이 주를 볼 수 있어요.')}</p>}
                <TodayRecipe className="mobile-recipe" />
              </div>
            </>
          ) : (
            <div className="empty">
              <p>{t('이 주의 식단이 아직 없어요.')}</p>
              <button className="btn primary big" onClick={() => make(false)}>{t('이 주 21끼 식단 만들기')}</button>
            </div>
          )}
        </section>
        <NutritionDonut date={d} />
      </div>

      <div className="dash-cards">
        <TodayRecipe className="hide-narrow" />
        <ShoppingPreview className="hide-narrow" />
        <RestaurantPreview className="hide-narrow" />
        <MonthMini />
      </div>

      <section className="panel hide-narrow">
        <h2><span aria-hidden>🥛</span> {t('간식·음료')}</h2>
        <p className="muted small">{t('오늘 {a}kcal / 목표 {b}kcal (세 끼와 따로 관리)', { a: snackTotal, b: targets.snackKcal })}</p>
        {snacks.length > 0 && (
          <ul className="plain">
            {snacks.map((s, i) => (
              <li key={i} className="row between">
                <span>{t(s.name)} · {s.kcal}kcal</span>
                <button className="btn ghost small" onClick={() => update('snacks', (x) => ({ ...x, [d]: x[d].filter((_, j) => j !== i) }))} aria-label={t('{name} 삭제', { name: t(s.name) })}>{t('삭제')}</button>
              </li>
            ))}
          </ul>
        )}
        <form className="row wrap" onSubmit={addSnack}>
          <input aria-label={t('간식 이름')} placeholder={t('예: 우유 1잔')} value={sn.name} onChange={(e) => setSn({ ...sn, name: e.target.value })} />
          <input aria-label={t('열량(kcal)')} type="number" inputMode="numeric" placeholder="kcal" style={{ maxWidth: '7em' }} value={sn.kcal} onChange={(e) => setSn({ ...sn, kcal: e.target.value })} />
          <button className="btn" type="submit">{t('기록')}</button>
        </form>
        <div className="chips">
          {[['우유 1잔', 130], ['사과 반 개', 70], ['바나나 1개', 105], ['요거트', 90], ['삶은 계란', 70], ['믹스커피', 50]].map(([n, k]) => (
            <button key={n} className="chip" onClick={() => update('snacks', (x) => ({ ...x, [d]: [...(x[d] || []), { name: n, kcal: k }] }))}>+ {t(n)}</button>
          ))}
        </div>
      </section>

      {(cond.kidney || cond.diabetes || cond.hypertension) && (
        <p className="notice">{t('입력하신 건강 상태에 맞는 식사는 주치의·임상영양사와 상담해 정해 주세요. 앱의 수치는 추정치입니다.')}</p>
      )}

      <MyTablePanel />
      <BabSangPanel />
      <NewsPanel />

      {confirm && (
        <Modal title={t('식단 다시 생성')} onClose={() => setConfirm(false)}>
          <p>{t('고정(🔒)하거나 외식으로 표시한 끼니를 빼고 이 주의 메뉴를 모두 새로 고릅니다.')}</p>
          <div className="row"><button className="btn primary" onClick={() => make(true)}>{t('다시 만들기')}</button><button className="btn ghost" onClick={() => setConfirm(false)}>{t('취소')}</button></div>
        </Modal>
      )}
    </div>
  );
}
