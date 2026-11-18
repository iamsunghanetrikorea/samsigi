import { useState } from 'react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL, RECIPE_BY_ID, menuNo } from '../data/recipes';
import { PACK, nextUpdate } from '../data/recipePack';
import { ING } from '../data/ingredients';
import { mealItems, sumItems, round } from '../lib/nutrition';
import { excludeReason } from '../lib/planner';
import { leftoverRecipes } from '../lib/shopping';
import { Seg, longPress } from '../components/ui';
import { go } from '../router';
import Plate from '../components/Plate';
import RecipeMaker, { RecipeEditor } from '../components/RecipeMaker';
import { MyTableButton } from '../components/MyTable';
import { AddIngredient } from './Market';

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
// 분류 사진 버튼에 쓰는 사진 (재료 사진, 국은 레시피 사진)
const FILTER_PHOTO = {
  계란: 'ing/egg', 두부: 'ing/tofu', 감자: 'ing/potato', 고구마: 'ing/sweet_potato', 떡: 'ing/rice_cake', 토마토: 'ing/tomato',
  밥: 'ing/rice', 면: 'ing/noodle', 빵: 'ing/bread', 국: 'miyeok_soup', 고기: 'ing/beef', 생선: 'ing/mackerel',
};

export default function RecipeList() {
  const { state, targets, update, addRecipeUpdate, saveCustomRecipe, saveRecipeEdit, notify } = useStore();
  const [editId, setEditId] = useState(null);
  const [meal, setMeal] = useState('all');
  const [cat, setCat] = useState('');
  const [justAdded, setJustAdded] = useState([]);
  const remaining = nextUpdate(state.addedRecipes).length;
  const doUpdate = () => {
    const ids = addRecipeUpdate();
    setJustAdded(ids);
    setCat(''); setMeal('all');
    notify(ids.length ? `새 메뉴 ${ids.length}가지를 레시피 모음에 추가했어요` : '추가할 새 메뉴가 없어요');
  };
  const [onlyOk, setOnlyOk] = useState(true);
  const leftovers = leftoverRecipes(state.pantry);
  const myMenus = state.recipeMenus || [];
  const hiddenPics = state.recipeHidden || [];
  // 사진을 길게 누르면 삭제: 내가 추가한 메뉴는 지우고, 기본 사진은 숨김(아래 '다시 보이기'로 되살림)
  const removePic = (id, name, mine) => {
    if (!window.confirm(`‘${name}’ 사진을 지울까요?`)) return;
    if (mine) update('recipeMenus', (l) => (l || []).filter((x) => x.id !== id));
    else update('recipeHidden', (l) => [...(l || []), id]);
    if (cat === id) setCat('');
    notify(`‘${name}’ 사진을 지웠어요`);
  };
  const byName = (name) => (r) => r.title.includes(name) || r.items.some(([id]) => ING[id]?.name.includes(name.replace(/달걀/g, '계란')));
  const filterOf = (c) => FILTER_BY[c] || byName(myMenus.find((x) => x.id === c)?.name || c);
  const list = RECIPES.filter((r) => (meal === 'all' || r.meals.includes(meal))
    && (!cat || (cat === FAV ? state.profile.favorites.includes(r.id) : filterOf(cat)(r)))
    && (!onlyOk || !excludeReason(r, state.profile)));
  const disliked = RECIPES.filter((r) => state.profile.dislikes.includes(r.id));

  return (
    <div className="stack">
      <h1>레시피 추천</h1>
      <p className="recipe-hint">아래 메뉴사진을 선택하면 관련 레시피 추천</p>
      <section className="card update-card find-card">
        <div className="chips find-chips" role="group" aria-label="분류">
          {FILTERS.filter(([c]) => !hiddenPics.includes(c)).map(([c]) => (
            <button key={c} className={`find-pic ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)} {...longPress(() => removePic(c, c, false))}>
              <img src={`./photos/${FILTER_PHOTO[c]}.webp`} alt="" loading="lazy" decoding="async" />
              <span>{c}</span>
            </button>
          ))}
          {myMenus.map((x) => (
            <button key={x.id} className={`find-pic ${cat === x.id ? 'on' : ''}`} aria-pressed={cat === x.id} onClick={() => setCat(cat === x.id ? '' : x.id)} {...longPress(() => removePic(x.id, x.name, true))}>
              {x.photo ? <img src={x.photo} alt="" /> : <span className="find-emoji" aria-hidden>🍽️</span>}
              <span>{x.name}</span>
            </button>
          ))}
        </div>
        {hiddenPics.length > 0 && <p className="muted small long-help"><button type="button" className="linklike" onClick={() => update('recipeHidden', [])}>지운 기본 사진 {hiddenPics.length}개 다시 보이기</button></p>}
        <AddIngredient label="나의 메뉴 입력" unit="메뉴" placeholder="예: 잡채, 김치볶음밥" noCat custom={myMenus}
          onRemove={(id) => { update('recipeMenus', (l) => (l || []).filter((x) => x.id !== id)); if (cat === id) setCat(''); }}
          onAdd={(name, _c, photo, credit) => {
            if (FILTER_BY[name] || myMenus.some((x) => x.name === name)) { notify(`‘${name}’은(는) 이미 있어요`); return; }
            const id = `m_${Date.now().toString(36)}`;
            update('recipeMenus', (l) => [...(l || []), { id, name, ...(photo ? { photo } : {}), ...(credit ? { credit } : {}) }]);
            setCat(id); setMeal('all');
            notify(`‘${name}’ 메뉴를 추가했어요`);
          }} />
        <div className="chips hide-m">
          <button className={`chip fav-chip ${cat === FAV ? 'on' : ''}`} aria-pressed={cat === FAV} onClick={() => setCat(cat === FAV ? '' : FAV)}>♥ 즐겨찾기 메뉴리스트 <span className="fav-n">{state.profile.favorites.length}</span></button>
        </div>
        <Seg label="끼니" value={meal} onChange={setMeal} options={[{ value: 'all', label: '전체' }, ...Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))]} />
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
            <li key={r.id} className={`choice-row ${editId === r.id ? 'editing' : ''}`}>
              <button className="choice" onClick={() => go(`/recipe/${r.id}`)}>
                <Plate recipe={r} />
                <span className="choice-body">
                  <b><span className="menu-no" aria-label={`메뉴 ${menuNo(r)}번`}>{menuNo(r)}</span>{r.isNew && <span className="new-badge">NEW</span>}{r.isCustom && <span className="my-badge">내 메뉴</span>}{r.isEdited && <span className="edit-badge">수정됨</span>} {r.title}{state.profile.favorites.includes(r.id) ? ' ♥' : ''}</b>
                  <span className="meal-sub">{r.category} · {r.meals.map((m) => MEAL_LABEL[m]).join('·')} · {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · {r.prep + r.cook}분{why ? ` · 제외됨(${why})` : ''}</span>
                </span>
              </button>
              <div className="row-btns">
                <MyTableButton id={r.id} small />
                <button className={`btn small ${editId === r.id ? 'on' : 'ghost'} edit-btn`} aria-expanded={editId === r.id} onClick={() => setEditId(editId === r.id ? null : r.id)}>✏️ 메뉴수정</button>
              </div>
              {editId === r.id && (
                <div className="edit-box">
                  <RecipeEditor key={r.id} initial={r} saveLabel="수정 저장"
                    note={r.isCustom ? null : '기본 메뉴를 고치면 이 기기에만 저장돼요. 언제든 ‘원래대로’로 되돌릴 수 있어요.'}
                    extra={r.isEdited && <button type="button" className="btn ghost" onClick={() => { saveRecipeEdit(r.id, null); setEditId(null); notify(`‘${r.title}’을(를) 원래대로 되돌렸어요`); }}>원래대로</button>}
                    onCancel={() => setEditId(null)}
                    onSave={(d) => {
                      const edit = { title: d.title, category: d.category, prep: d.prep, cook: d.cook, meals: d.meals, items: d.items, steps: d.steps };
                      if (r.isCustom) saveCustomRecipe({ ...r, ...edit }); else saveRecipeEdit(r.id, edit);
                      setEditId(null);
                      notify(`‘${d.title}’ 메뉴를 고쳤어요`);
                    }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <section className="card update-card">
        <div className="row between wrap">
          <div>
            <h2>🆕 새 메뉴 업데이트</h2>
            <p className="muted small hide-m">한식·중식·양식·간식·찌개·국에서 어르신께 맞게 싱겁게 다듬은 새 메뉴를 분류마다 하나씩 추가해요. ({state.addedRecipes.length}/{PACK.length}개 추가됨)</p>
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
        <RecipeMaker onAdded={(id) => { setJustAdded([id]); setCat(''); setMeal('all'); }} />
      </section>
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
