import { useState } from 'react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL, RECIPE_BY_ID } from '../data/recipes';
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

// 분류 버튼: 재료·음식 종류로 메뉴 찾기 (같은 버튼을 다시 누르면 해제)
const has = (r, ids) => r.items.some(([id]) => ids.includes(id));
const FISH = Object.values(ING).filter((i) => i.cat === '수산물' && !['broth', 'miyeok', 'laver'].includes(i.id)).map((i) => i.id);
const MEAT = Object.values(ING).filter((i) => i.cat === '육류').map((i) => i.id);
const NOODLE = ['noodle', 'buckwheat', 'kalguksu', 'pasta', 'ramen', 'jjolmyeon', 'udon'];
const FILTERS = [
  ['계란', (r) => has(r, ['egg']) || /계란|달걀/.test(r.title)],
  ['두부', (r) => has(r, ['tofu', 'soft_tofu']) || r.title.includes('두부')],
  ['감자', (r) => has(r, ['potato']) || r.title.includes('감자')],
  ['고구마', (r) => has(r, ['sweet_potato']) || r.title.includes('고구마')],
  ['떡', (r) => has(r, ['rice_cake']) || /떡/.test(r.title)],
  ['토마토', (r) => has(r, ['tomato']) || r.title.includes('토마토')],
  ['밥', (r) => /밥|리조또/.test(r.title)],
  ['면', (r) => has(r, NOODLE) || /면|국수|우동|파스타|라볶이/.test(r.title)],
  ['빵', (r) => has(r, ['bread']) || /빵|토스트/.test(r.title)],
  ['국', (r) => ['국', '찌개'].includes(r.category) || /국(?!수)|(?<!볶음)탕(?![면수])|찌개|전골/.test(r.title)],
  ['고기', (r) => has(r, MEAT)],
  ['생선', (r) => has(r, FISH)],
];
const FILTER_BY = Object.fromEntries(FILTERS);

export default function RecipeList() {
  const { state, targets, update, addRecipeUpdate, notify } = useStore();
  const [meal, setMeal] = useState('all');
  const [cat, setCat] = useState('');
  const [justAdded, setJustAdded] = useState([]);
  const remaining = nextUpdate(state.addedRecipes).length;
  const doUpdate = () => {
    const ids = addRecipeUpdate();
    setJustAdded(ids);
    setCat(''); setMeal('all'); setQ('');
    notify(ids.length ? `새 메뉴 ${ids.length}가지를 레시피 모음에 추가했어요` : '추가할 새 메뉴가 없어요');
  };
  const [q, setQ] = useState('');
  const [onlyOk, setOnlyOk] = useState(true);
  const leftovers = leftoverRecipes(state.pantry);
  const list = RECIPES.filter((r) => (meal === 'all' || r.meals.includes(meal))
    && (!cat || (cat === FAV ? state.profile.favorites.includes(r.id) : FILTER_BY[cat](r)))
    && (!q || r.title.includes(q) || r.items.some(([id]) => ING[id].name.includes(q.replace(/달걀/g, '계란'))))
    && (!onlyOk || !excludeReason(r, state.profile)));
  const disliked = RECIPES.filter((r) => state.profile.dislikes.includes(r.id));

  return (
    <div className="stack">
      <h1>레시피 모음</h1>
      <section className="card update-card find-card">
        <form className="search-row" role="search" onSubmit={(e) => { e.preventDefault(); setCat(''); setMeal('all'); setOnlyOk(false); }}>
          <label htmlFor="recipe-q" className="search-label">🔍 메뉴찾기</label>
          <input id="recipe-q" type="search" placeholder="메뉴명 입력" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn">검색</button>
        </form>
        <div className="chips find-chips" role="group" aria-label="분류">
          {FILTERS.map(([c]) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>)}
        </div>
        <div className="chips">
          <button className={`chip fav-chip ${cat === FAV ? 'on' : ''}`} aria-pressed={cat === FAV} onClick={() => setCat(cat === FAV ? '' : FAV)}>♥ 즐겨찾기 <span className="fav-n">{state.profile.favorites.length}</span></button>
        </div>
        <Seg label="끼니" value={meal} onChange={setMeal} options={[{ value: 'all', label: '전체' }, ...Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))]} />
      </section>
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
        <RecipeMaker onAdded={(id) => { setJustAdded([id]); setCat(''); setMeal('all'); setQ(''); }} />
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
      <p className="muted">{list.length}개</p>
      {cat === FAV && list.length === 0 && (
        <p className="notice">{state.profile.favorites.length ? '즐겨찾기한 메뉴가 위 조건(끼니·검색)에 맞지 않아 안 보여요. 조건을 풀어 보세요.' : '아직 즐겨찾기한 메뉴가 없어요. 레시피를 열고 ‘♡ 즐겨찾기’를 누르면 여기에 모여요.'}</p>
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
