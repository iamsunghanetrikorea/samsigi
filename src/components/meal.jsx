import { useState } from 'react';
import { useStore } from '../store';
import { RECIPE_BY_ID, MEAL_LABEL } from '../data/recipes';
import { MEAL_KEYS, entryNutrition, dayTotals, round, won } from '../lib/nutrition';
import { suggestions } from '../lib/planner';
import { fmtDate, weekday, WD } from '../lib/date';
import { Modal, NutrientBars, Estimate } from './ui';
import { go } from '../router';
import Plate from './Plate';

export const EATOUT_PRESETS = [
  { cat: '백반·한식', kcal: 700 }, { cat: '생선구이', kcal: 750 }, { cat: '두부요리', kcal: 600 },
  { cat: '채소 중심 한식', kcal: 600 }, { cat: '죽', kcal: 450 }, { cat: '국밥·탕', kcal: 750 },
  { cat: '면 요리', kcal: 650 }, { cat: '기타', kcal: 700 },
];

export function MealCard({ date, meal, entry, compact, showEaten, readOnly }) {
  const { targets, setEntry, notify } = useStore();
  const [modal, setModal] = useState(null);
  const n = entryNutrition(entry, meal, targets);
  const recipe = entry && RECIPE_BY_ID[entry.recipeId];

  return (
    <div className={`meal ${entry?.locked ? 'locked' : ''} ${entry?.eaten ? 'eaten' : ''}`}>
      <div className="meal-top">
        <span className="meal-label">{MEAL_LABEL[meal]}</span>
        {entry?.locked && <span className="badge">🔒 고정</span>}
        {entry?.fixed && !entry.locked && <span className="badge">매주 고정</span>}
        {entry?.eatOut && <span className="badge out">외식</span>}
        {entry && entry.servings > 1 && <span className="badge">{entry.servings}인분</span>}
      </div>
      {!entry && (
        <div className="meal-empty">
          <p>아직 정해진 메뉴가 없어요.</p>
          {!readOnly && <button className="btn" onClick={() => setModal('swap')}>메뉴 고르기</button>}
        </div>
      )}
      {entry?.eatOut && (
        <div className="meal-main">
          <span className="meal-emoji" aria-hidden>🍽️</span>
          <div>
            <div className="meal-title">{entry.eatOut.name || '외식'}</div>
            <div className="meal-sub">{entry.eatOut.kcal ? <>약 {entry.eatOut.kcal}kcal <Estimate /></> : '영양정보 없음 (합계에서 제외)'}</div>
          </div>
        </div>
      )}
      {recipe && (
        <button className="meal-main link" onClick={() => go(`/recipe/${recipe.id}?date=${date}&meal=${meal}`)}>
          <Plate recipe={recipe} />
          <div>
            <div className="meal-title">{recipe.title}</div>
            <div className="meal-sub">
              {round(n.kcal)}kcal · 단백질 {round(n.protein)}g{!compact && <> · 나트륨 {round(n.sodium)}mg · {recipe.prep + recipe.cook}분</>}
              {entry.subs && Object.keys(entry.subs).length > 0 && ' · 재료 바꿈'}
            </div>
          </div>
        </button>
      )}
      {entry && !readOnly && (
        <div className="meal-actions no-print">
          {showEaten && (
            <label className="check">
              <input type="checkbox" checked={!!entry.eaten} onChange={(e) => setEntry(date, meal, { ...entry, eaten: e.target.checked })} />
              먹었어요
            </label>
          )}
          <button className="btn small" onClick={() => setModal('swap')} disabled={entry.locked} title={entry.locked ? '고정을 풀어야 바꿀 수 있어요' : ''}>바꾸기</button>
          <button className={`btn small ${entry.locked ? 'on' : 'ghost'}`} aria-pressed={!!entry.locked}
            onClick={() => { setEntry(date, meal, { ...entry, locked: !entry.locked }); notify(entry.locked ? '고정을 풀었어요' : '이 끼니를 고정했어요. 다시 만들어도 바뀌지 않아요.'); }}>
            {entry.locked ? '고정 풀기' : '고정'}
          </button>
          <button className="btn small ghost" onClick={() => setModal('more')}>더보기</button>
        </div>
      )}
      {modal === 'swap' && <SwapModal date={date} meal={meal} onClose={() => setModal(null)} />}
      {modal === 'more' && <EntryModal date={date} meal={meal} entry={entry} onClose={() => setModal(null)} onEatOut={() => setModal('eatout')} />}
      {modal === 'eatout' && <EatOutModal initial={{ date, meal, name: entry?.eatOut?.name, kcal: entry?.eatOut?.kcal }} fixedDate onClose={() => setModal(null)} />}
    </div>
  );
}

export function SwapModal({ date, meal, onClose }) {
  const store = useStore();
  const { state, targets, setEntry, notify } = store;
  const [count, setCount] = useState(6);
  const list = suggestions(state, targets, date, meal, count);
  const current = state.plans[date]?.[meal];
  const choose = (r) => {
    setEntry(date, meal, { recipeId: r.id, servings: current?.servings || state.profile.people || 1, locked: false, eaten: false });
    notify(`${MEAL_LABEL[meal]}을(를) '${r.title}'(으)로 바꿨어요`);
    onClose();
  };
  return (
    <Modal title={`${fmtDate(date)} ${MEAL_LABEL[meal]} 바꾸기`} onClose={onClose}>
      <p className="muted">목표 영양, 최근 식단 중복, 식비, 제철 재료를 고려해 추천 순으로 보여 드려요.</p>
      {!list.length && <p className="warn">조건에 맞는 다른 메뉴가 없어요. 설정에서 알레르기·제외 재료·조리시간을 확인해 주세요.</p>}
      <ul className="choice-list">
        {list.map(({ recipe: r, nutrition: n, reasons }) => (
          <li key={r.id}>
            <button className="choice" onClick={() => choose(r)}>
              <Plate recipe={r} />
              <span className="choice-body">
                <b>{r.title}</b>
                <span className="meal-sub">{round(n.kcal)}kcal · 단백질 {round(n.protein)}g · 나트륨 {round(n.sodium)}mg · {r.prep + r.cook}분 · 약 {won(n.cost)}</span>
                {reasons.length > 0 && <span className="reasons">{reasons.map((x) => <em key={x}>{x}</em>)}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        {list.length >= count && <button className="btn ghost" onClick={() => setCount(count + 6)}>다른 메뉴 더 보기</button>}
        {current && <button className="btn ghost" onClick={() => { setEntry(date, meal, null); onClose(); }}>이 끼니 비우기</button>}
      </div>
    </Modal>
  );
}

function EntryModal({ date, meal, entry, onClose, onEatOut }) {
  const { state, update, setEntry, notify } = useStore();
  const wd = weekday(date);
  const rules = state.profile.rules || [];
  const rule = rules.find((r) => r.weekday === wd && r.meal === meal);
  const set = (patch) => setEntry(date, meal, { ...entry, ...patch });
  const toggleRule = () => {
    update('profile', (p) => {
      const others = (p.rules || []).filter((r) => !(r.weekday === wd && r.meal === meal));
      return { ...p, rules: rule ? others : [...others, { weekday: wd, meal, recipeId: entry.recipeId }] };
    });
    notify(rule ? '매주 고정을 해제했어요' : `매주 ${WD[wd]}요일 ${MEAL_LABEL[meal]}에 이 메뉴가 들어가요`);
  };
  return (
    <Modal title={`${fmtDate(date)} ${MEAL_LABEL[meal]}`} onClose={onClose}>
      <div className="stack">
        <div>
          <div className="field-label">인분 (함께 드시는 분 수)</div>
          <div className="seg">
            {[1, 2, 3, 4].map((n) => <button key={n} className={entry.servings === n ? 'on' : ''} aria-pressed={entry.servings === n} onClick={() => set({ servings: n })}>{n}인분</button>)}
          </div>
        </div>
        <label className="check big"><input type="checkbox" checked={!!entry.eaten} onChange={(e) => set({ eaten: e.target.checked })} /> 실제로 먹었어요</label>
        {entry.recipeId && !entry.eatOut && (
          <button className="btn ghost" onClick={toggleRule}>{rule ? `매주 ${WD[wd]}요일 고정 해제` : `매주 ${WD[wd]}요일 ${MEAL_LABEL[meal]}에 이 메뉴 고정`}</button>
        )}
        <button className="btn ghost" onClick={onEatOut}>🍽️ {entry.eatOut ? '외식 정보 고치기' : '외식으로 표시하기'}</button>
        {entry.eatOut && (
          <button className="btn ghost" onClick={() => { setEntry(date, meal, null); notify('외식 표시를 지웠어요. 메뉴를 다시 골라 주세요.'); onClose(); }}>외식 표시 지우기</button>
        )}
        <p className="muted small">외식으로 표시한 끼니는 장보기 목록에서 빠져요.</p>
      </div>
    </Modal>
  );
}

export function EatOutModal({ initial = {}, onClose, fixedDate }) {
  const { state, setEntry, notify } = useStore();
  const [date, setDate] = useState(initial.date);
  const [meal, setMeal] = useState(initial.meal || 'lunch');
  const [name, setName] = useState(initial.name || '');
  const [kcal, setKcal] = useState(initial.kcal ?? '');
  const save = () => {
    const prev = state.plans[date]?.[meal];
    setEntry(date, meal, { eatOut: { name: name.trim() || '외식', kcal: Number(kcal) || null, estimated: true }, servings: prev?.servings || 1, locked: true, eaten: prev?.eaten || false });
    notify(`${fmtDate(date)} ${MEAL_LABEL[meal]}을(를) 외식으로 기록했어요`);
    onClose();
  };
  return (
    <Modal title="외식 기록" onClose={onClose}>
      <div className="stack">
        {!fixedDate && (
          <div className="grid2">
            <label className="field"><span>날짜</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="field"><span>끼니</span>
              <select value={meal} onChange={(e) => setMeal(e.target.value)}>{MEAL_KEYS.map((k) => <option key={k} value={k}>{MEAL_LABEL[k]}</option>)}</select>
            </label>
          </div>
        )}
        <label className="field"><span>식당·메뉴 이름</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 동네 백반집 된장찌개" /></label>
        <div>
          <div className="field-label">열량 추정 (공식 영양정보가 없으면 대략값)</div>
          <div className="chips">
            {EATOUT_PRESETS.map((p) => <button key={p.cat} className="chip" onClick={() => setKcal(p.kcal)}>{p.cat} 약 {p.kcal}</button>)}
          </div>
          <label className="field"><span>열량 (kcal, 모르면 비워 두세요)</span><input type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} /></label>
        </div>
        <p className="muted small">식당 메뉴 열량은 추정값이며, 비워 두면 영양 합계에서 제외됩니다.</p>
        <button className="btn primary" onClick={save} disabled={!date}>저장하기</button>
      </div>
    </Modal>
  );
}

export function DayPanel({ date, compact, showEaten, title, hideRegen }) {
  const { state, targets, generate, notify } = useStore();
  const day = state.plans[date] || {};
  const totals = dayTotals(day, targets);
  const snacks = state.snacks[date] || [];
  const snackKcal = snacks.reduce((s, x) => s + (Number(x.kcal) || 0), 0);
  const regen = () => {
    const r = generate([date], { overwrite: true });
    notify(r.warnings[0] || '이 날 식단을 새로 만들었어요 (고정·외식 끼니는 그대로)');
  };
  return (
    <section className="day card">
      <div className="day-head">
        <h3>{title || fmtDate(date)}</h3>
        <div className="day-kcal">
          <b>{round(totals.kcal).toLocaleString()}</b> / {round(targets.meals.kcal).toLocaleString()} kcal
          {totals.unknown > 0 && <span className="muted small"> (외식 {totals.unknown}끼 제외)</span>}
        </div>
      </div>
      <div className={`meals ${compact ? 'compact' : ''}`}>
        {MEAL_KEYS.map((k) => <MealCard key={k} date={date} meal={k} entry={day[k]} compact={compact} showEaten={showEaten} />)}
      </div>
      {!compact && totals.count > 0 && (
        <details className="day-detail" open={!!showEaten}>
          <summary>하루 영양 현황 <Estimate /></summary>
          <NutrientBars totals={totals} targets={targets} />
          <p className="muted small">세 끼 목표 = 하루 {targets.kcal.toLocaleString()}kcal − 간식·음료 {targets.snackKcal}kcal{snackKcal ? ` · 오늘 간식 ${snackKcal}kcal 기록` : ''}</p>
        </details>
      )}
      {!(hideRegen && !compact) && <div className="row no-print">
        {!hideRegen && <button className="btn ghost small" onClick={regen}>이 날 다시 만들기</button>}
        {compact && <span className="muted small">단백질 {round(totals.protein)}g · 나트륨 {round(totals.sodium).toLocaleString()}mg · 약 {won(totals.cost)}</span>}
      </div>}
    </section>
  );
}
