import { useState } from 'react';
import { useStore } from '../store';
import { CATEGORIES, MEAL_LABEL } from '../data/recipes';
import { ING, CATEGORY_ORDER } from '../data/ingredients';
import { makeRecipe, INGREDIENT_OPTIONS } from '../lib/recipeMaker';
import { sumItems, round } from '../lib/nutrition';
import { go } from '../router';
import Plate from './Plate';


// '나의 메뉴 추가': 메뉴 이름을 넣으면 레시피 초안을 만들고, 고쳐서 레시피 모음에 추가
export default function RecipeMaker({ onAdded }) {
  const { state, saveCustomRecipe, removeCustomRecipe, notify } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState(null);
  const [stepsText, setStepsText] = useState('');
  const [addId, setAddId] = useState('');

  const create = (menu = name) => {
    const n = menu.trim();
    if (!n) { notify('추가할 메뉴 이름을 입력해 주세요'); return; }
    setName(n);
    const r = makeRecipe(n);
    setDraft(r);
    setStepsText(r.steps.map(([t]) => t).join('\n'));
  };
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setGram = (i, g) => set({ items: draft.items.map((it, j) => (j === i ? [it[0], Math.max(0, Number(g) || 0)] : it)) });
  const removeItem = (i) => set({ items: draft.items.filter((_, j) => j !== i) });
  const addItem = () => {
    if (!addId || draft.items.some(([id]) => id === addId)) return;
    set({ items: [...draft.items, [addId, ING[addId].unit === 'g' && ING[addId].cat === '양념' ? 5 : 50]] });
    setAddId('');
  };
  const toggleMeal = (m) => set({ meals: draft.meals.includes(m) ? draft.meals.filter((x) => x !== m) : [...draft.meals, m] });

  const save = () => {
    const lines = stepsText.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!draft.title.trim()) { notify('메뉴 이름을 입력해 주세요'); return; }
    if (!draft.items.length) { notify('재료를 하나 이상 넣어 주세요'); return; }
    if (!lines.length) { notify('만드는 순서를 한 줄 이상 적어 주세요'); return; }
    if (!draft.meals.length) { notify('어느 끼니에 먹을지 하나 이상 골라 주세요'); return; }
    // 고친 줄은 타이머를 지우고, 그대로인 줄은 원래 타이머(분)를 유지
    const timers = Object.fromEntries(draft.steps.map(([t, m]) => [t, m]));
    const recipe = { ...draft, title: draft.title.trim(), steps: lines.map((t) => (timers[t] ? [t, timers[t]] : [t])) };
    saveCustomRecipe(recipe);
    notify(`‘${recipe.title}’ 레시피를 레시피 모음에 추가했어요`);
    onAdded?.(recipe.id);
    setDraft(null); setName('');
  };

  const n = draft && sumItems(draft.items);
  const grouped = CATEGORY_ORDER.map((c) => [c, INGREDIENT_OPTIONS.filter((o) => o.cat === c)]);

  return (
    <div className="maker">
      <button className="btn full-narrow" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ✏️ 나의 메뉴 추가 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="maker-body">
          <p className="muted small">드시고 싶은 메뉴 이름을 넣으면 앱이 1인분 레시피를 만들어 드려요. 재료와 순서를 고친 뒤 추가하세요.</p>
          <form className="row wrap maker-form" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <input aria-label="추가할 메뉴 이름" placeholder="메뉴 이름 (예: 김치찌개, 감자전)" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit" className="btn primary">레시피 만들기</button>
          </form>

          {draft && (
            <div className="maker-draft">
              <div className="row">
                <Plate recipe={draft} />
                <label className="field" style={{ flex: 1 }}><span>메뉴 이름</span>
                  <input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
                </label>
              </div>
              <div className="row wrap">
                <label className="field" style={{ flex: '1 1 8rem' }}><span>분류</span>
                  <select value={draft.category} onChange={(e) => set({ category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field" style={{ flex: '1 1 6rem' }}><span>준비(분)</span>
                  <input type="number" min="0" inputMode="numeric" value={draft.prep} onChange={(e) => set({ prep: Number(e.target.value) || 0 })} />
                </label>
                <label className="field" style={{ flex: '1 1 6rem' }}><span>조리(분)</span>
                  <input type="number" min="0" inputMode="numeric" value={draft.cook} onChange={(e) => set({ cook: Number(e.target.value) || 0 })} />
                </label>
              </div>
              <fieldset className="maker-meals"><legend className="field-label">먹는 끼니</legend>
                {Object.entries(MEAL_LABEL).map(([m, label]) => (
                  <label key={m} className="check"><input type="checkbox" checked={draft.meals.includes(m)} onChange={() => toggleMeal(m)} /> {label}</label>
                ))}
              </fieldset>

              <h3>재료 (1인분)</h3>
              <ul className="plain maker-items">
                {draft.items.map(([id, g], i) => (
                  <li key={id} className="row between">
                    <span>{ING[id].name}</span>
                    <span className="row">
                      <input type="number" min="0" step={g < 5 ? 0.5 : 5} inputMode="decimal" aria-label={`${ING[id].name} 양(g)`} value={g} onChange={(e) => setGram(i, e.target.value)} style={{ width: '5.5rem' }} />
                      <span className="muted small">g</span>
                      <button type="button" className="btn small ghost" aria-label={`${ING[id].name} 빼기`} onClick={() => removeItem(i)}>✕</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="row">
                <select aria-label="재료 더하기" value={addId} onChange={(e) => setAddId(e.target.value)}>
                  <option value="">재료 더하기…</option>
                  {grouped.map(([c, opts]) => (
                    <optgroup key={c} label={c}>{opts.filter((o) => !draft.items.some(([id]) => id === o.id)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</optgroup>
                  ))}
                </select>
                <button type="button" className="btn" onClick={addItem} disabled={!addId}>더하기</button>
              </div>
              <p className="muted small">1인분 약 {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · 나트륨 {round(n.sodium)}mg (추정치)</p>

              <label className="field"><span>만드는 순서 (한 줄에 한 단계)</span>
                <textarea rows={Math.max(4, stepsText.split('\n').length + 1)} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
              </label>
              <p className="notice small">💡 메뉴 이름으로 자동으로 만든 초안이에요. 이름에 없는 재료(예: 오징어)는 목록에 없을 수 있으니 비슷한 재료로 바꾸거나 더해 주세요.</p>
              <div className="row wrap">
                <button type="button" className="btn primary" onClick={save}>레시피 모음에 추가</button>
                <button type="button" className="btn ghost" onClick={() => create(name)}>처음부터 다시 만들기</button>
                <button type="button" className="btn ghost" onClick={() => setDraft(null)}>취소</button>
              </div>
            </div>
          )}

          {state.customRecipes.length > 0 && (
            <>
              <h3>내가 추가한 메뉴 ({state.customRecipes.length})</h3>
              <ul className="plain maker-items">
                {state.customRecipes.map((r) => (
                  <li key={r.id} className="row between">
                    <button type="button" className="linklike" onClick={() => go(`/recipe/${r.id}`)}>{r.emoji} {r.title}</button>
                    <button type="button" className="btn small danger" onClick={() => { removeCustomRecipe(r.id); notify(`‘${r.title}’을(를) 지웠어요`); }}>삭제</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
