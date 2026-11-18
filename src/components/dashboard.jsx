import { useState } from 'react';
import { useStore } from '../store';
import { RECIPE_BY_ID, MEAL_LABEL, FOOD_GROUPS, foodGroup, shortTitle } from '../data/recipes';
import { ING } from '../data/ingredients';
import { MEAL_KEYS, entryNutrition, dayTotals, round } from '../lib/nutrition';
import { buildShopping } from '../lib/shopping';
import { today, weekDates, weekStart, monthDates, monthKey, parse, WD, fmtMonth, fmtDate } from '../lib/date';
import { Modal } from './ui';
import Plate from './Plate';
import { MealCard } from './meal';
import { mapLinks, linkTarget } from '../pages/Restaurants';
import { go } from '../router';
import { t } from '../i18n';

// 번역된 제목으로 짧은 이름 만들기 (한국어일 땐 그대로)
const st = (r) => (r ? shortTitle({ ...r, title: t(r.title) }) : '');

export const MEAL_ICON = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
const fmtMD = (d) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

export { Plate };

// 7일 × 3끼 표 — 칸을 누르면 바꾸기·고정·레시피 메뉴
export function WeekTable({ dates }) {
  const { state, targets } = useStore();
  const [open, setOpen] = useState(null);
  const td = today();
  return (
    <div className="wt-wrap">
      <table className="wt">
        <caption className="sr-only">{t('주간 식단표')}</caption>
        <thead>
          <tr>
            <th scope="col" className="wt-corner">{t('구분')}</th>
            {dates.map((d) => {
              const wd = parse(d).getDay();
              return <th key={d} scope="col" className={`${d === td ? 'today' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`}>{fmtMD(d)} ({t(WD[wd])})</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {MEAL_KEYS.map((k) => (
            <tr key={k}>
              <th scope="row" className="wt-meal"><span aria-hidden>{MEAL_ICON[k]}</span>{t(MEAL_LABEL[k])}</th>
              {dates.map((d) => {
                const e = state.plans[d]?.[k];
                const r = e && RECIPE_BY_ID[e.recipeId];
                const n = entryNutrition(e, k, targets);
                return (
                  <td key={d} className={d === td ? 'today' : ''}>
                    <button className={`wt-cell ${e?.locked ? 'locked' : ''} ${e?.eaten ? 'eaten' : ''}`} onClick={() => setOpen({ d, k })}
                      aria-label={`${fmtMD(d)} ${t(MEAL_LABEL[k])}: ${e ? (e.eatOut ? `${t('외식')} ${t(e.eatOut.name)}` : t(r?.title)) : t('비어 있음')}`}>
                      <Plate recipe={r} eatOut={e?.eatOut} />
                      <span className="wt-name">{e ? (e.eatOut ? t(e.eatOut.name) : st(r)) : t('메뉴 고르기')}</span>
                      {n && !n.unknown && <span className="wt-kcal">{round(n.kcal)} kcal</span>}
                      {e?.locked && <span className="wt-lock" aria-hidden>🔒</span>}
                      {e?.eaten && <span className="wt-done" aria-hidden>✓</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {open && (
        <Modal title={`${fmtMD(open.d)} (${t(WD[parse(open.d).getDay()])}) ${t(MEAL_LABEL[open.k])}`} onClose={() => setOpen(null)}>
          <MealCard date={open.d} meal={open.k} entry={state.plans[open.d]?.[open.k]} readOnly />
        </Modal>
      )}
    </div>
  );
}

// 오늘의 영양 요약 — 탄단지 열량 비율 도넛
export function NutritionDonut({ date }) {
  const { state, targets, setEntry } = useStore();
  const day = state.plans[date] || {};
  const tot = dayTotals(day, targets);
  const parts = [
    { key: 'protein', label: t('단백질'), g: tot.protein, kcal: tot.protein * 4, color: '#2b66d9' },
    { key: 'carb', label: t('탄수화물'), g: tot.carb, kcal: tot.carb * 4, color: '#f2a93b' },
    { key: 'fat', label: t('지방'), g: tot.fat, kcal: tot.fat * 9, color: '#3aa757' },
  ];
  const sum = parts.reduce((s, p) => s + p.kcal, 0) || 1;
  const R = 52; const C = 2 * Math.PI * R;
  let acc = 0;
  const kcalOk = Math.abs(tot.kcal - targets.meals.kcal) <= targets.meals.kcal * 0.1;
  const protOk = tot.protein >= targets.meals.protein * 0.85;
  const naOk = tot.sodium <= targets.sodium;
  const msg = t(!tot.count ? '오늘 식단이 아직 없어요.' : kcalOk && protOk && naOk ? '권장 범위 내에서 균형이 잘 맞아요!' : !protOk ? '단백질이 조금 부족해요. 달걀·두부·우유를 곁들여 보세요.' : !naOk ? '나트륨이 많아요. 국물은 절반만 드세요.' : tot.kcal > targets.meals.kcal ? '열량이 목표보다 조금 많아요.' : '열량이 목표보다 조금 적어요.');
  return (
    <section className="panel donut-card hide-narrow">
      <h2>{t('오늘의 영양 요약')}</h2>
      <div className="donut-row">
        <svg viewBox="0 0 140 140" className="donut" role="img" aria-label={t('섭취 예상 {kcal}kcal, 단백질 {protein}g, 탄수화물 {carb}g, 지방 {fat}g', { kcal: round(tot.kcal), protein: round(tot.protein), carb: round(tot.carb), fat: round(tot.fat) })}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--track)" strokeWidth="14" />
          {tot.count > 0 && parts.map((p) => {
            const len = (p.kcal / sum) * C;
            const el = <circle key={p.key} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="14" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />;
            acc += len;
            return el;
          })}
          <text x="70" y="58" textAnchor="middle" className="donut-s">{t('섭취 예상')}</text>
          <text x="70" y="80" textAnchor="middle" className="donut-b">{round(tot.kcal).toLocaleString()}</text>
          <text x="70" y="98" textAnchor="middle" className="donut-s">{t('목표 {n} kcal', { n: round(targets.meals.kcal).toLocaleString() })}</text>
        </svg>
        <ul className="legend">
          {parts.map((p) => (
            <li key={p.key}><span className="dot" style={{ background: p.color }} />{p.label}<b>{round(p.g)} g <em>({round((p.kcal / sum) * 100)}%)</em></b></li>
          ))}
          <li><span className="dot" style={{ background: '#8a94a6' }} />{t('나트륨')}<b>{round(tot.sodium).toLocaleString()} mg</b></li>
        </ul>
      </div>
      <p className={`donut-msg ${tot.count && kcalOk && protOk && naOk ? 'ok' : ''}`}>{tot.count && kcalOk && protOk && naOk ? '✔ ' : ''}{msg}</p>
      {tot.count > 0 && (
        <div className="eat-checks">
          <span className="muted small">{t('먹은 끼니 체크')}</span>
          {MEAL_KEYS.filter((k) => day[k]).map((k) => (
            <label key={k} className="check"><input type="checkbox" checked={!!day[k].eaten} onChange={(e) => setEntry(date, k, { ...day[k], eaten: e.target.checked })} />{t(MEAL_LABEL[k])}</label>
          ))}
        </div>
      )}
      <p className="muted small">{t('식품성분표 기반 추정치')}</p>
    </section>
  );
}

// 오늘의 레시피: 지금 시각 기준 다음 끼니의 집밥 메뉴
export function todayRecipe(state) {
  const d = today();
  const h = new Date().getHours();
  const order = h < 10 ? ['breakfast', 'lunch', 'dinner'] : h < 15 ? ['lunch', 'dinner', 'breakfast'] : ['dinner', 'lunch', 'breakfast'];
  const k = order.find((m) => state.plans[d]?.[m]?.recipeId);
  const e = k && state.plans[d][k];
  return { d, k, e, r: e && RECIPE_BY_ID[e.recipeId] };
}

// 다음 끼니 레시피
export function TodayRecipe({ className = '' }) {
  const { state, targets } = useStore();
  const { d, k, e, r } = todayRecipe(state);
  const n = entryNutrition(e, k, targets);
  return (
    <section className={`panel ${className}`}>
      <h2><span aria-hidden>🍲</span> {t('오늘의 레시피')}</h2>
      {!r ? <p className="muted">{t('오늘 집밥 메뉴가 없어요.')}</p> : (
        <>
          <div className="tr-head">
            <Plate recipe={r} size="lg" />
            <div>
              <p className="muted small">{t(MEAL_LABEL[k])}</p>
              <h3>{t(r.title)}</h3>
              <div className="pills"><span className="pill green">⏱ {t('약 {n}분', { n: r.prep + r.cook })}</span><span className="pill orange">🔥 {round(n.kcal)} kcal</span></div>
            </div>
          </div>
          <p className="small"><b>{t('재료({n}인분)', { n: e.servings || 1 })}</b> {n.items.filter((i) => ING[i.id].cat !== '양념').map((i) => t(ING[i.id].name).replace(/[(（].*[)）]/, '')).join(', ')}</p>
          <ol className="mini-steps">
            {r.steps.slice(0, 3).map(([s], i) => <li key={i}>{t(s)}</li>)}
          </ol>
          <div className="row wrap">
            <button className="btn primary full-narrow" onClick={() => go(`/recipe/${r.id}?date=${d}&meal=${k}`)}>{t('자세한 레시피 보기')}</button>
          </div>
        </>
      )}
    </section>
  );
}

export function ShoppingPreview({ className = '' }) {
  const { state, targets, update } = useStore();
  const dates = weekDates(today());
  const { trips } = buildShopping(state, targets, dates, { split: state.shopping.split !== false });
  const rows = trips.flatMap((tr) => tr.rows.filter((r) => r.toBuy > 0 && r.cat !== '양념').map((r) => ({ ...r, key: `${dates[0]}|${tr.trip}|${r.id}` })));
  const checked = state.shopping.checked || {};
  const fmt = (g, u) => (g >= 1000 ? `${round(g / 1000, 1)}${u === 'mL' ? 'L' : 'kg'}` : `${Math.round(g)}${u}`);
  return (
    <section className={`panel ${className}`}>
      <h2><span aria-hidden>🛒</span> {t('이번 주 장보기 목록')}</h2>
      {!rows.length ? <p className="muted">{t('살 재료가 없어요.')}</p> : (
        <ul className="mini-shop">
          {rows.slice(0, 7).map((r) => (
            <li key={r.key}>
              <label className={`check ${checked[r.key] ? 'done' : ''}`}>
                <input type="checkbox" checked={!!checked[r.key]} onChange={() => update('shopping', (s) => ({ ...s, checked: { ...s.checked, [r.key]: !s.checked[r.key] } }))} />
                {t(r.buyName).replace(/[(（].*[)）]/, '')} <span className="muted">({fmt(r.buyGrams, r.unit)})</span>
              </label>
            </li>
          ))}
          {rows.length > 7 && <li className="muted">{t('… 외 {n}가지', { n: rows.length - 7 })}</li>}
        </ul>
      )}
      <button className="btn ghost wide" onClick={() => go('/shopping')}>{t('전체 목록 보기')}</button>
    </section>
  );
}

export function RestaurantPreview({ className = '' }) {
  const { state } = useStore();
  const saved = state.restaurants.slice(0, 3);
  return (
    <section className={`panel ${className}`}>
      <h2><span aria-hidden>📍</span> {t('주변 식당 추천')}</h2>
      {saved.length ? (
        <ul className="rest-list">
          {saved.map((r) => (
            <li key={r.id}>
              <a href={mapLinks(r.address ? `${r.name} ${r.address}` : r.name).naver} {...linkTarget()}>
                <span className="rest-ico" aria-hidden>🍚</span>
                <span className="rest-body"><b>{r.name}</b><span className="tags"><em>{t(r.cat)}</em>{r.solo && <em>{t('혼밥 가능')}</em>}{r.price && <em>{t('{n}원', { n: Number(r.price).toLocaleString() })}</em>}</span></span>
                <span aria-hidden>›</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="muted small">{t('근처 백반·생선구이·두부요리 식당을 찾아 저장해 두면 여기에 보여요.')}</p>
          <ul className="rest-list">
            {[['🍚', '백반·한식'], ['🐟', '생선구이'], ['🥘', '두부요리']].map(([ic, c]) => (
              <li key={c}><a href={mapLinks(`근처 ${c.split('·')[0]}`).naver} {...linkTarget()}><span className="rest-ico" aria-hidden>{ic}</span><span className="rest-body"><b>{t('근처 {c}', { c: t(c) })}</b><span className="muted small">{t('네이버지도에서 찾기')}</span></span><span aria-hidden>›</span></a></li>
            ))}
          </ul>
        </>
      )}
      <button className="btn ghost wide" onClick={() => go('/eat-out')}>{t('내 위치로 식당 찾기')}</button>
    </section>
  );
}

export function MonthMini() {
  const { state } = useStore();
  const td = today();
  const ym = monthKey(td);
  const dates = monthDates(ym);
  const lead = (parse(dates[0]).getDay() + 6) % 7;
  const ws = weekStart(td);
  const cells = [...Array(lead).fill(null), ...dates];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return (
    <section className="panel">
      <h2 className="mm-h"><span aria-hidden>📅</span> {t('이번 달 식단 한눈에 보기')} <span className="muted mm-ym">({fmtMonth(ym)})</span></h2>
      <table className="mm">
        <thead><tr>{['월', '화', '수', '목', '금', '토', '일'].map((w, i) => <th key={w} className={i === 5 ? 'sat' : i === 6 ? 'sun' : ''}>{t(w)}</th>)}</tr></thead>
        <tbody>
          {weeks.map((w, i) => (
            <tr key={i} className={w.some((d) => d && weekStart(d) === ws) ? 'cur' : ''}>
              {Array.from({ length: 7 }, (_, j) => {
                const d = w[j];
                if (!d) return <td key={j} />;
                const day = state.plans[d] || {};
                const r = RECIPE_BY_ID[day.dinner?.recipeId] || RECIPE_BY_ID[day.lunch?.recipeId];
                const g = foodGroup(r);
                return (
                  <td key={j}>
                    <button className={`mm-d ${d === td ? 'today' : ''} ${j === 5 ? 'sat' : j === 6 ? 'sun' : ''}`} onClick={() => go(`/plan?view=week&d=${d}`)} aria-label={`${t('{d}일', { d: Number(d.slice(8)) })}${r ? ` ${t(r.title)}` : ''}`}>
                      {Number(d.slice(8))}
                      <span className="mm-dot" style={{ background: g ? FOOD_GROUPS[g].color : 'transparent' }} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mm-legend">
        {Object.values(FOOD_GROUPS).map((g) => <li key={g.label}><span className="dot" style={{ background: g.color }} />{t(g.label)}</li>)}
      </ul>
      <button className="btn ghost wide" onClick={() => go(`/plan?view=month&d=${td}`)}>{t('월간 식단 상세 보기')}</button>
    </section>
  );
}

// 상단 환영 배너 + 권장 섭취량
export function WelcomeBanner() {
  const { state, targets } = useStore();
  const name = state.profile.name?.trim();
  const range = (v) => `${round(v * 0.9)}~${round(v * 1.1)} g`;
  const kpis = [
    { ico: '🔥', label: t('권장 섭취량 (1일)'), val: t('약 {n} kcal', { n: targets.kcal.toLocaleString() }) },
    { ico: '💪', label: t('단백질'), val: range(targets.protein) },
    { ico: '🌾', label: t('탄수화물'), val: range(targets.carb) },
    { ico: '💧', label: t('지방'), val: range(targets.fat) },
  ];
  return (
    <section className="banner hide-narrow">
      <div className="banner-text">
        <span className="banner-ico" aria-hidden>🌱</span>
        <div>
          <h1>{name ? t('{name}님, 건강한 한 끼로 활기찬 하루를 시작하세요!', { name }) : t('건강한 한 끼로 활기찬 하루를 시작하세요!')}</h1>
          <p>{t('연령과 활동량에 맞춘 균형 식단을 매주·매월 자동으로 제안해 드립니다.')}</p>
        </div>
      </div>
      <ul className="kpis-row">
        {kpis.map((k) => <li key={k.label}><span className="kpi-ico" aria-hidden>{k.ico}</span><span><span className="kpi-l">{k.label}</span><b>{k.val}</b></span></li>)}
      </ul>
    </section>
  );
}
