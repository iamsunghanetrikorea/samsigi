import { useState } from 'react';
import { useStore } from '../store';
import { ING, INGREDIENTS, CATEGORY_ORDER, formatAmount, buyForm } from '../data/ingredients';
import { buildShopping, leftoverRecipes } from '../lib/shopping';
import { catLabel } from '../lib/market';
import { won, round } from '../lib/nutrition';
import { today, weekDates, addDays, monthDates, monthKey, rangeDates, fmtDate } from '../lib/date';
import { download, toCSV } from '../lib/exporter';
import { Seg } from '../components/ui';
import { go } from '../router';
import { t } from '../i18n';

const fmtG = (g, unit = 'g') => (g >= 1000 ? `${round(g / 1000, 1)}${unit === 'mL' ? 'L' : 'kg'}` : `${g >= 10 ? Math.round(g) : round(g, 1)}${unit}`);

export default function Shopping() {
  const { state, targets, update, notify } = useStore();
  const td = today();
  const [range, setRange] = useState('week');
  const [custom, setCustom] = useState({ from: td, to: addDays(td, 6) });
  const split = state.shopping.split !== false;
  const dates = range === 'week' ? weekDates(td) : range === 'next' ? weekDates(addDays(td, 7)) : range === 'month' ? monthDates(monthKey(td)) : (custom.from <= custom.to ? rangeDates(custom.from, custom.to).slice(0, 62) : []);
  const { trips, total, homeMeals } = buildShopping(state, targets, dates, { split });
  const checked = state.shopping.checked || {};
  const extras = state.shopping.extras || [];

  const toggle = (key) => update('shopping', (s) => ({ ...s, checked: { ...s.checked, [key]: !s.checked[key] } }));
  const setPantry = (id, g) => update('pantry', (p) => { const n = { ...p }; if (g > 0) n[id] = g; else delete n[id]; return n; });
  const setPrice = (id, v) => update('shopping', (s) => { const prices = { ...s.prices }; if (v === '' || Number(v) === ING[id].price) delete prices[id]; else prices[id] = Number(v); return { ...s, prices }; });

  const exportCSV = () => {
    const rows = [['장보기', '분류', '품목', '필요량', '보유량', '살 양', '단가(원/100g)', '예상 금액(원)', '사용 메뉴'].map((h) => t(h))];
    for (const tr of trips) for (const r of tr.rows) rows.push([tr.label, catLabel(r.cat), t(r.buyName), fmtG(r.needBuy, r.unit), fmtG(r.owned, ING[r.id].unit), fmtG(r.buyGrams, r.unit), r.price, Math.round(r.cost), r.uses.map((u) => t(u)).join(' / ')]);
    for (const x of extras) rows.push([t('추가'), catLabel(ING[x.id].cat), t(ING[x.id].name), fmtG(x.grams, ING[x.id].unit), '', '', '', '', t(x.from)]);
    download(`${t('장보기')}_${dates[0] || td}.csv`, toCSV(rows), 'text/csv');
  };

  return (
    <div className="stack">
      <div className="no-print stack">
        <Seg label={t('기간')} value={range} onChange={setRange} options={[{ value: 'week', label: t('이번 주') }, { value: 'next', label: t('다음 주') }, { value: 'month', label: t('이번 달') }, { value: 'custom', label: t('직접') }]} />
        {range === 'custom' && (
          <div className="grid2">
            <label className="field"><span>{t('시작일')}</span><input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
            <label className="field"><span>{t('종료일')}</span><input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
          </div>
        )}
        <label className="check"><input type="checkbox" checked={split} onChange={(e) => update('shopping', (s) => ({ ...s, split: e.target.checked }))} /> {t('보관기간에 맞춰 나눠 장보기 (생선·나물은 쓰기 직전에)')}</label>
      </div>
      {dates.length > 0 && <p className="muted">{fmtDate(dates[0])} ~ {fmtDate(dates[dates.length - 1])} · {t('집밥 {n}끼 · 외식 끼니 제외', { n: homeMeals })}</p>}

      <section className="card total">
        <div className="row between"><span>{t('예상 식비 (보유 재료 제외)')}</span><b className="big-num">{won(total)}</b></div>
        <p className="muted small">{t('단가는 대략적인 시세 추정치이며, 품목을 눌러 직접 고칠 수 있어요.')}</p>
        <div className="row wrap no-print">
          <button className="btn ghost small" onClick={() => window.print()}>{t('인쇄·PDF')}</button>
          <button className="btn ghost small" onClick={exportCSV}>{t('CSV 내보내기')}</button>
          <button className="btn ghost small" onClick={() => { update('shopping', (s) => ({ ...s, checked: {}, extras: s.extras.map((x) => ({ ...x, checked: false })) })); notify(t('체크를 모두 지웠어요')); }}>{t('체크 모두 해제')}</button>
        </div>
      </section>

      {!trips.length && !extras.length && (
        <div className="card center stack"><p>{t('이 기간에 식단이 없어요.')}</p><button className="btn primary" onClick={() => go('/plan')}>{t('식단 만들러 가기')}</button></div>
      )}

      {trips.map((tr) => (
        <section key={tr.trip} className="card">
          <div className="row between"><h2>{tr.label}</h2><span className="muted">{won(tr.cost)}</span></div>
          <ul className="shop">
            {tr.rows.map((r, i) => {
              const key = `${dates[0]}|${tr.trip}|${r.id}`;
              const done = !!checked[key];
              const showCat = i === 0 || tr.rows[i - 1].cat !== r.cat;
              return (
                <li key={r.id} className={`${done ? 'done' : ''} ${r.toBuy <= 0 ? 'owned' : ''}`}>
                  {showCat && <div className="cat">{catLabel(r.cat)}</div>}
                  <div className="shop-row">
                    <label className="check big">
                      <input type="checkbox" checked={done} onChange={() => toggle(key)} />
                      <span className="shop-name">{t(r.buyName)}</span>
                    </label>
                    <span className="shop-amt">{r.toBuy <= 0 ? t('보유 중') : fmtG(r.buyGrams, r.unit)}</span>
                  </div>
                  <details className="no-print">
                    <summary>{t('필요 {amt}', { amt: fmtG(r.needBuy, r.unit) })}{r.owned > 0 ? ` · ${t('보유 {amt}', { amt: fmtG(r.owned, ING[r.id].unit) })}` : ''} · {t('약 {cost}', { cost: won(r.cost) })}</summary>
                    <div className="grid2">
                      <label className="field"><span>{t('집에 있는 양')} ({ING[r.id].unit}{ING[r.id].buyAs ? `, ${t('{name} 기준', { name: t(ING[r.id].name) })}` : ''})</span>
                        <input type="number" inputMode="numeric" min={0} value={state.pantry[r.id] || ''} placeholder="0" onChange={(e) => setPantry(r.id, Number(e.target.value))} /></label>
                      <label className="field"><span>{t('단가 (원/100{unit})', { unit: r.unit })}</span>
                        <input type="number" inputMode="numeric" min={0} value={r.price} onChange={(e) => setPrice(r.id, e.target.value)} /></label>
                    </div>
                    <p className="muted small">{t('사용 메뉴: {list}', { list: r.uses.map((u) => t(u)).join(', ') })}</p>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {extras.length > 0 && (
        <section className="card">
          <h2>{t('레시피에서 담은 재료')}</h2>
          <ul className="shop">
            {extras.map((x, i) => (
              <li key={x.id} className={x.checked ? 'done' : ''}>
                <div className="shop-row">
                  <label className="check big"><input type="checkbox" checked={!!x.checked} onChange={() => update('shopping', (s) => ({ ...s, extras: s.extras.map((y, j) => (j === i ? { ...y, checked: !y.checked } : y)) }))} /><span className="shop-name">{t(buyForm(x.id, x.grams).name)}</span></label>
                  <span className="shop-amt">{fmtG(buyForm(x.id, x.grams).grams, ING[x.id].unit)}</span>
                  <button className="btn small ghost no-print" aria-label={t('{name} 빼기', { name: t(ING[x.id].name) })} onClick={() => update('shopping', (s) => ({ ...s, extras: s.extras.filter((_, j) => j !== i) }))}>{t('빼기')}</button>
                </div>
                <p className="muted small">{t(x.from)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Pantry />
    </div>
  );
}

function Pantry() {
  const { state, update } = useStore();
  const [id, setId] = useState('');
  const [g, setG] = useState('');
  const owned = Object.entries(state.pantry).filter(([, v]) => v > 0);
  const recs = leftoverRecipes(state.pantry, 4);
  const add = (e) => {
    e.preventDefault();
    if (!id || !(Number(g) > 0)) return;
    update('pantry', (p) => ({ ...p, [id]: (p[id] || 0) + Number(g) }));
    setG('');
  };
  return (
    <section className="card no-print">
      <h2>{t('냉장고·찬장 재료')}</h2>
      <p className="muted small">{t('가진 재료를 적어 두면 장보기 양에서 빼고, 남은 재료를 쓰는 메뉴를 먼저 추천해요.')}</p>
      {owned.length > 0 && (
        <ul className="plain">
          {owned.map(([k, v]) => (
            <li key={k} className="row between"><span>{t(ING[k]?.name)} · {formatAmount(k, v)}</span>
              <button className="btn small ghost" onClick={() => update('pantry', (p) => { const n = { ...p }; delete n[k]; return n; })}>{t('다 썼어요')}</button></li>
          ))}
        </ul>
      )}
      <form className="row wrap" onSubmit={add}>
        <select aria-label={t('재료')} value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">{t('재료 고르기')}</option>
          {CATEGORY_ORDER.map((c) => (
            <optgroup key={c} label={catLabel(c)}>{INGREDIENTS.filter((i) => i.cat === c).map((i) => <option key={i.id} value={i.id}>{t(i.name)}</option>)}</optgroup>
          ))}
        </select>
        <input aria-label={t('양')} type="number" inputMode="numeric" placeholder={id ? ING[id].unit : 'g'} value={g} onChange={(e) => setG(e.target.value)} style={{ maxWidth: '7em' }} />
        <button className="btn" type="submit">{t('추가')}</button>
      </form>
      {recs.length > 0 && (
        <>
          <h3>{t('남은 재료 활용 메뉴')}</h3>
          <ul className="plain">
            {recs.map(({ recipe: r, used }) => <li key={r.id}><a href={`#/recipe/${r.id}`}>{r.emoji} {t(r.title)}</a> <span className="muted small">({used.map((u) => t(u)).join(', ')})</span></li>)}
          </ul>
        </>
      )}
    </section>
  );
}
