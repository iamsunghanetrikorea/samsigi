import { useState } from 'react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL, CATEGORIES, RECIPE_BY_ID } from '../data/recipes';
import { PACK, nextUpdate } from '../data/recipePack';
import { ING } from '../data/ingredients';
import { mealItems, sumItems, round } from '../lib/nutrition';
import { excludeReason } from '../lib/planner';
import { leftoverRecipes } from '../lib/shopping';
import { Seg } from '../components/ui';
import { go } from '../router';
import Plate from '../components/Plate';
import RecipeMaker from '../components/RecipeMaker';
import { MyTableButton } from '../components/MyTable';

const FAV = '즐겨찾기';

export default function RecipeList() {
  const { state, targets, update, addRecipeUpdate, notify } = useStore();
  const [meal, setMeal] = useState('all');
  const [cat, setCat] = useState('전체');
  const [justAdded, setJustAdded] = useState([]);
  const remaining = nextUpdate(state.addedRecipes).length;
  const doUpdate = () => {
    const ids = addRecipeUpdate();
    setJustAdded(ids);
    setCat('전체'); setMeal('all'); setQ('');
    notify(ids.length ? `새 메뉴 ${ids.length}가지를 레시피 모음에 추가했어요` : '추가할 새 메뉴가 없어요');
  };
  const [q, setQ] = useState('');
  const [onlyOk, setOnlyOk] = useState(true);
  const leftovers = leftoverRecipes(state.pantry);
  const list = RECIPES.filter((r) => (meal === 'all' || r.meals.includes(meal))
    && (cat === '전체' || (cat === FAV ? state.profile.favorites.includes(r.id) : r.category === cat))
    && (!q || r.title.includes(q) || r.items.some(([id]) => ING[id].name.includes(q)))
    && (!onlyOk || !excludeReason(r, state.profile)));
  const disliked = RECIPES.filter((r) => state.profile.dislikes.includes(r.id));

  return (
    <div className="stack">
      <h1>레시피 모음</h1>
      <section className="card update-card">
        <div className="row between wrap">
          <div>
            <h2>🆕 새 메뉴 업데이트</h2>
            <p className="muted small">한식·중식·양식·간식·찌개·국에서 어르신께 맞게 싱겁게 다듬은 새 메뉴를 분류마다 하나씩 추가해요. ({state.addedRecipes.length}/{PACK.length}개 추가됨)</p>
          </div>
          <button className="btn primary full-narrow" onClick={doUpdate} disabled={!remaining}>{remaining ? `메뉴 자동 추가 (+${remaining}가지)` : '모든 추천 메뉴 추가 완료'}</button>
        </div>
        {justAdded.length > 0 && (
          <ul className="choice-list">
            {justAdded.map((id) => RECIPE_BY_ID[id]).filter(Boolean).map((r) => (
              <li key={r.id}><button className="choice" onClick={() => go(`/recipe/${r.id}`)}><Plate recipe={r} /><span className="choice-body"><b>{r.isCustom ? <span className="my-badge">내 메뉴</span> : <span className="new-badge">NEW</span>} {r.title}</b><span className="meal-sub">{r.category} · {r.meals.map((m) => MEAL_LABEL[m]).join('·')}</span></span></button></li>
            ))}
          </ul>
        )}
        <RecipeMaker onAdded={(id) => { setJustAdded([id]); setCat('전체'); setMeal('all'); setQ(''); }} />
        <p className="muted small">새 메뉴는 널리 쓰이는 가정식 조리법을 참고해 작성했어요. 각 레시피의 유튜브·만개의레시피 링크로 확인해 보세요. 식사 메뉴는 식단 자동 추천에도 쓰이고, 간식은 ‘오늘 간식으로 기록’할 수 있어요.</p>
      </section>
      {leftovers.length > 0 && (
        <section className="card">
          <h2>냉장고 재료로 만들 수 있어요</h2>
          <ul className="choice-list">
            {leftovers.map(({ recipe: r, used }) => (
              <li key={r.id}><button className="choice" onClick={() => go(`/recipe/${r.id}`)}><Plate recipe={r} /><span className="choice-body"><b>{r.title}</b><span className="meal-sub">보유 재료: {used.join(', ')}</span></span></button></li>
            ))}
          </ul>
        </section>
      )}
      <div className="stack">
        <form className="search-row" role="search" onSubmit={(e) => { e.preventDefault(); setCat('전체'); setMeal('all'); setOnlyOk(false); }}>
          <label htmlFor="recipe-q" className="search-label">메뉴 검색</label>
          <input id="recipe-q" type="search" placeholder="메뉴·재료" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn">전체 검색</button>
        </form>
        <div className="chips" role="group" aria-label="분류">
          {['전체', ...CATEGORIES, FAV].map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''} ${c === FAV ? 'fav-chip' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c === FAV ? `♥ 즐겨찾기 ${state.profile.favorites.length}` : c}</button>)}
        </div>
        <Seg label="끼니" value={meal} onChange={setMeal} options={[{ value: 'all', label: '전체' }, ...Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))]} />
        <label className="check"><input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} /> 내 조건(알레르기·시간·난이도)에 맞는 것만</label>
      </div>
      <p className="muted">{list.length}개</p>
      {cat === FAV && list.length === 0 && (
        <p className="notice">{state.profile.favorites.length ? '즐겨찾기한 메뉴가 위 조건(끼니·검색·내 조건)에 맞지 않아 안 보여요. 조건을 풀어 보세요.' : '아직 즐겨찾기한 메뉴가 없어요. 레시피를 열고 ‘♡ 즐겨찾기’를 누르면 여기에 모여요.'}</p>
      )}
      <ul className="choice-list">
        {list.map((r) => {
          const n = sumItems(mealItems(r, { kcal: targets.perMeal[r.meals[0]]?.kcal }).items.map((i) => [i.id, i.g]));
          const why = excludeReason(r, state.profile);
          return (
            <li key={r.id} className="choice-row">
              <button className="choice" onClick={() => go(`/recipe/${r.id}`)}>
                <Plate recipe={r} />
                <span className="choice-body">
                  <b>{r.isNew && <span className="new-badge">NEW</span>}{r.isCustom && <span className="my-badge">내 메뉴</span>} {r.title}{state.profile.favorites.includes(r.id) ? ' ♥' : ''}</b>
                  <span className="meal-sub">{r.category} · {r.meals.map((m) => MEAL_LABEL[m]).join('·')} · {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · {r.prep + r.cook}분{why ? ` · 제외됨(${why})` : ''}</span>
                </span>
              </button>
              <MyTableButton id={r.id} small />
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
