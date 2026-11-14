import { useState } from 'react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL } from '../data/recipes';
import { ING } from '../data/ingredients';
import { mealItems, sumItems, round } from '../lib/nutrition';
import { excludeReason } from '../lib/planner';
import { leftoverRecipes } from '../lib/shopping';
import { Seg } from '../components/ui';
import { go } from '../router';

export default function RecipeList() {
  const { state, targets, update } = useStore();
  const [meal, setMeal] = useState('all');
  const [q, setQ] = useState('');
  const [onlyOk, setOnlyOk] = useState(true);
  const leftovers = leftoverRecipes(state.pantry);
  const list = RECIPES.filter((r) => (meal === 'all' || r.meals.includes(meal))
    && (!q || r.title.includes(q) || r.items.some(([id]) => ING[id].name.includes(q)))
    && (!onlyOk || !excludeReason(r, state.profile)));
  const disliked = RECIPES.filter((r) => state.profile.dislikes.includes(r.id));

  return (
    <div className="stack">
      <h1>레시피 모음</h1>
      {leftovers.length > 0 && (
        <section className="card">
          <h2>냉장고 재료로 만들 수 있어요</h2>
          <ul className="choice-list">
            {leftovers.map(({ recipe: r, used }) => (
              <li key={r.id}><button className="choice" onClick={() => go(`/recipe/${r.id}`)}><span className="meal-emoji" aria-hidden>{r.emoji}</span><span className="choice-body"><b>{r.title}</b><span className="meal-sub">보유 재료: {used.join(', ')}</span></span></button></li>
            ))}
          </ul>
        </section>
      )}
      <div className="stack">
        <input type="search" placeholder="메뉴·재료 이름으로 찾기" aria-label="레시피 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <Seg label="끼니" value={meal} onChange={setMeal} options={[{ value: 'all', label: '전체' }, ...Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))]} />
        <label className="check"><input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} /> 내 조건(알레르기·시간·난이도)에 맞는 것만</label>
      </div>
      <p className="muted">{list.length}개</p>
      <ul className="choice-list">
        {list.map((r) => {
          const n = sumItems(mealItems(r, { kcal: targets.perMeal[r.meals[0]].kcal }).items.map((i) => [i.id, i.g]));
          const why = excludeReason(r, state.profile);
          return (
            <li key={r.id}>
              <button className="choice" onClick={() => go(`/recipe/${r.id}`)}>
                <span className="meal-emoji" aria-hidden>{r.emoji}</span>
                <span className="choice-body">
                  <b>{r.title}{state.profile.favorites.includes(r.id) ? ' ♥' : ''}</b>
                  <span className="meal-sub">{r.meals.map((m) => MEAL_LABEL[m]).join('·')} · {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · {r.prep + r.cook}분{why ? ` · 제외됨(${why})` : ''}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {disliked.length > 0 && (
        <section className="card">
          <h2>추천하지 않기로 한 메뉴</h2>
          <ul className="plain">
            {disliked.map((r) => (
              <li key={r.id} className="row between"><span>{r.emoji} {r.title}</span>
                <button className="btn small ghost" onClick={() => update('profile', (p) => ({ ...p, dislikes: p.dislikes.filter((x) => x !== r.id) }))}>다시 추천</button></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
