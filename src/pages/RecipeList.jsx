import { useState } from 'react';
import { Heart, Pencil, UtensilsCrossed, X, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL, RECIPE_BY_ID } from '../data/recipes';
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
import { t } from '../i18n';
import RecipeCard, { RecipeGrid, RecipeGridItem } from '../components/shadcn-space/RecipeCard';
import { MicButton, useSpeech } from '../components/Mic';
import { photoIdForName } from '../lib/photoMatch';

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
    notify(ids.length ? t('새 메뉴 {n}가지를 레시피 모음에 추가했어요', { n: ids.length }) : t('추가할 새 메뉴가 없어요'));
  };
  const [onlyOk, setOnlyOk] = useState(true);
  // 제목 줄 검색칸: 직접 쓰거나 마이크로 말해서 메뉴 이름으로 바로 찾기
  const [q, setQ] = useState('');
  const [more, setMore] = useState(false);
  const { listening, toggle } = useSpeech((said) => setQ(said.slice(0, 20)));
  const leftovers = leftoverRecipes(state.pantry);
  const myMenus = state.recipeMenus || [];
  const hiddenPics = state.recipeHidden || [];
  // 사진을 길게 누르면 삭제: 내가 추가한 메뉴는 지우고, 기본 사진은 숨김(아래 '다시 보이기'로 되살림)
  const removePic = (id, name, mine) => {
    if (!window.confirm(t('‘{name}’ 사진을 지울까요?', { name }))) return;
    if (mine) update('recipeMenus', (l) => (l || []).filter((x) => x.id !== id));
    else update('recipeHidden', (l) => [...(l || []), id]);
    if (cat === id) setCat('');
    notify(t('‘{name}’ 사진을 지웠어요', { name }));
  };
  const byName = (name) => (r) => r.title.includes(name) || t(r.title).includes(name) || r.items.some(([id]) => ING[id]?.name.includes(name.replace(/달걀/g, '계란')));
  const filterOf = (c) => FILTER_BY[c] || byName(myMenus.find((x) => x.id === c)?.name || c);
  const query = q.trim();
  const list = RECIPES.filter((r) => (meal === 'all' || r.meals.includes(meal))
    && (!cat || (cat === FAV ? state.profile.favorites.includes(r.id) : filterOf(cat)(r)))
    && (!query || byName(query)(r))
    && (!onlyOk || !excludeReason(r, state.profile)));
  const noHit = !!query && list.length === 0; // 적거나 말한 메뉴를 못 찾았을 때
  const showMore = more || meal !== 'all' || cat === FAV; // 즐겨찾기·끼니를 쓰고 있으면 계속 보임
  const disliked = RECIPES.filter((r) => state.profile.dislikes.includes(r.id));

  return (
    <div className="stack">
      {/* 제목 오른쪽에 마이크, 그 오른쪽에 검색칸 — 말하거나 적으면 메뉴 이름으로 바로 찾음 */}
      <div className="recipe-head">
        <h1>{t('요리 검색')}</h1>
        <MicButton listening={listening} onClick={toggle} className="mic-btn mic-inline" />
        <span className="recipe-search">
          <input type="search" aria-label={t('메뉴 이름으로 찾기')} placeholder={listening ? t('듣는 중…') : t('예: 잡채, 김치볶음밥')}
            value={q} onChange={(e) => setQ(e.target.value)} maxLength={20}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
          {q && <button type="button" className="search-x" onClick={() => setQ('')} aria-label={t('검색어 지우기')}><X aria-hidden size={18} strokeWidth={2} /></button>}
        </span>
      </div>
      {!query && <p className="recipe-hint">{t('아래 메뉴사진을 선택하면 관련 레시피 추천')}</p>}
      {/* 검색 중에는 찾은 말과 결과 수를 알려 주고, 메뉴 사진은 잠시 가림 */}
      {query && (
        <section className="card">
          <div className="row between wrap">
            <h2>{t('‘{name}’(으)로 찾은 메뉴 {n}개', { name: query, n: list.length })}</h2>
            <button className="btn ghost repick-btn" onClick={() => setQ('')}><ArrowLeft aria-hidden size={18} strokeWidth={1.75} />{t('메뉴 사진 다시 보기')}</button>
          </div>
        </section>
      )}
      {!query && <section className="card update-card find-card">
        <div className="chips find-chips" role="group" aria-label={t('분류')}>
          {FILTERS.filter(([c]) => !hiddenPics.includes(c)).map(([c]) => (
            <button key={c} className={`find-pic ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)} {...longPress(() => removePic(c, t(c), false))}>
              <img src={`./photos/${FILTER_PHOTO[c]}.webp`} alt="" loading="lazy" decoding="async" />
              <span>{t(c)}</span>
            </button>
          ))}
          {myMenus.map((x) => (
            <button key={x.id} className={`find-pic ${cat === x.id ? 'on' : ''}`} aria-pressed={cat === x.id} onClick={() => setCat(cat === x.id ? '' : x.id)} {...longPress(() => removePic(x.id, x.name, true))}>
              {/* 올린 사진이 없으면 이름이 비슷한 메뉴 사진을 빌려 씀 */}
              {x.photo ? <img src={x.photo} alt="" /> : photoIdForName(x.name) ? <img src={`./photos/${photoIdForName(x.name)}.webp`} alt="" loading="lazy" decoding="async" /> : <span className="find-emoji" aria-hidden><UtensilsCrossed size={36} strokeWidth={1.5} /></span>}
              <span>{x.name}</span>
            </button>
          ))}
        </div>
        {hiddenPics.length > 0 && <p className="muted small long-help"><button type="button" className="linklike" onClick={() => update('recipeHidden', [])}>{t('지운 기본 사진 {n}개 다시 보이기', { n: hiddenPics.length })}</button></p>}
        {/* 즐겨찾기·끼니는 보통 숨기고, '더 찾기'를 누르거나 쓰고 있을 때만 보임 */}
        <button type="button" className="btn soft more-find" aria-expanded={showMore} onClick={() => setMore((o) => !o)}>
          {showMore ? t('접기') : t('즐겨찾기·끼니로 더 찾기')}{showMore ? <ChevronUp aria-hidden size={18} strokeWidth={1.75} /> : <ChevronDown aria-hidden size={18} strokeWidth={1.75} />}
        </button>
        {showMore && (
          <>
            <div className="chips hide-m">
              <button className={`chip fav-chip ${cat === FAV ? 'on' : ''}`} aria-pressed={cat === FAV} onClick={() => setCat(cat === FAV ? '' : FAV)}><Heart aria-hidden size={18} strokeWidth={1.75} fill={cat === FAV ? 'currentColor' : 'none'} />{t('즐겨찾기 메뉴리스트')} <span className="fav-n">{state.profile.favorites.length}</span></button>
            </div>
            <Seg label={t('끼니')} value={meal} onChange={setMeal} options={[{ value: 'all', label: t('전체') }, ...Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label: t(label) }))]} />
          </>
        )}
      </section>}
      {/* 찾는 메뉴가 없을 때만 보임: 검색한 이름이 미리 들어간 채로 펼쳐져 사진 메뉴로 넣을 수 있게 */}
      {noHit && <AddIngredient key={query} label="검색 메뉴 추가" unit="메뉴" placeholder="예: 잡채, 김치볶음밥" noCat custom={myMenus} defaultName={query} defaultOpen
        onRemove={(id) => { update('recipeMenus', (l) => (l || []).filter((x) => x.id !== id)); if (cat === id) setCat(''); }}
        onAdd={(name, _c, photo, credit) => {
          if (FILTER_BY[name] || myMenus.some((x) => x.name === name)) { notify(t('‘{name}’은(는) 이미 있어요', { name })); return; }
          const id = `m_${Date.now().toString(36)}`;
          update('recipeMenus', (l) => [...(l || []), { id, name, ...(photo ? { photo } : {}), ...(credit ? { credit } : {}) }]);
          setCat(id); setMeal('all'); setQ('');
          notify(t('‘{name}’ 메뉴를 추가했어요', { name }));
        }} />}
      {leftovers.length > 0 && !query && (
        <section className="card">
          <h2>{t('냉장고 재료로 만들 수 있어요')}</h2>
          <ul className="choice-list">
            {leftovers.map(({ recipe: r, used }) => (
              <li key={r.id}><button className="choice" onClick={() => go(`/recipe/${r.id}`)}><Plate recipe={r} /><span className="choice-body"><b>{t(r.title)}</b><span className="meal-sub">{t('보유 재료:')} {used.map((u) => t(u)).join(', ')}</span></span></button></li>
            ))}
          </ul>
        </section>
      )}
      {!query && <p className="muted">{t('{n}개', { n: list.length })}</p>}
      {query && list.length === 0 && (
        <p className="notice">{t('‘{name}’(으)로 찾은 메뉴가 없어요. 다른 이름으로 찾아보시거나, ‘검색 메뉴 추가’로 넣어 보세요.', { name: query })}</p>
      )}
      {cat === FAV && list.length === 0 && (
        <p className="notice">{state.profile.favorites.length ? t('즐겨찾기한 메뉴가 위 조건(끼니·검색)에 맞지 않아 안 보여요. 조건을 풀어 보세요.') : t('아직 즐겨찾기한 메뉴가 없어요. 레시피를 열고 ‘즐겨찾기’를 누르면 여기에 모여요.')}</p>
      )}
      <RecipeGrid>
        {list.map((r) => {
          const n = sumItems(mealItems(r, { kcal: targets.perMeal[r.meals[0]]?.kcal }).items.map((i) => [i.id, i.g]));
          const editing = editId === r.id;
          return (
            <RecipeGridItem key={r.id} wide={editing}>
              <RecipeCard recipe={r} nutrition={n} excluded={excludeReason(r, state.profile)} narrow={editing}
                actions={<>
                  <MyTableButton id={r.id} small />
                  <button className={`btn small ${editing ? 'on' : 'ghost'} edit-btn`} aria-expanded={editing} onClick={() => setEditId(editing ? null : r.id)}><Pencil aria-hidden size={16} strokeWidth={1.75} />{t('메뉴수정')}</button>
                </>} />
              {editing && (
                <div className="edit-box">
                  <RecipeEditor key={r.id} initial={r} saveLabel={t('수정 저장')}
                    note={r.isCustom ? null : t('기본 메뉴를 고치면 이 기기에만 저장돼요. 언제든 ‘원래대로’로 되돌릴 수 있어요.')}
                    extra={r.isEdited && <button type="button" className="btn ghost" onClick={() => { saveRecipeEdit(r.id, null); setEditId(null); notify(t('‘{title}’을(를) 원래대로 되돌렸어요', { title: t(r.title) })); }}>{t('원래대로')}</button>}
                    onCancel={() => setEditId(null)}
                    onSave={(d) => {
                      const edit = { title: d.title, category: d.category, prep: d.prep, cook: d.cook, meals: d.meals, items: d.items, steps: d.steps };
                      if (r.isCustom) saveCustomRecipe({ ...r, ...edit }); else saveRecipeEdit(r.id, edit);
                      setEditId(null);
                      notify(t('‘{title}’ 메뉴를 고쳤어요', { title: d.title }));
                    }} />
                </div>
              )}
            </RecipeGridItem>
          );
        })}
      </RecipeGrid>
      <section className="card update-card">
        {/* 추가할 추천 메뉴가 남아 있을 때만 보임 — 누르면 남은 메뉴를 한 번에 모두 추가 */}
        {remaining > 0 && (
          <div className="row between wrap">
            <div>
              <h2>🆕 {t('새 메뉴 업데이트')}</h2>
              <p className="muted small hide-m">{t('한식·중식·양식·간식·찌개·국에서 어르신께 맞게 싱겁게 다듬은 새 메뉴를 한 번에 모두 추가해요.')} {t('({n}/{total}개 추가됨)', { n: state.addedRecipes.length, total: PACK.length })}</p>
            </div>
            <button className="btn primary full-narrow" onClick={doUpdate}>{t('메뉴 자동 추가 (+{n}가지)', { n: remaining })}</button>
          </div>
        )}
        {justAdded.length > 0 && (
          <ul className="choice-list">
            {justAdded.slice(0, 6).map((id) => RECIPE_BY_ID[id]).filter(Boolean).map((r) => (
              <li key={r.id}><button className="choice" onClick={() => go(`/recipe/${r.id}`)}><Plate recipe={r} /><span className="choice-body"><b>{r.isCustom ? <span className="my-badge">{t('내 메뉴')}</span> : <span className="new-badge">NEW</span>} {t(r.title)}</b><span className="meal-sub">{t(r.category)} · {r.meals.map((m) => t(MEAL_LABEL[m])).join('·')}</span></span></button></li>
            ))}
          </ul>
        )}
        {justAdded.length > 6 && <p className="muted small">{t('외 {n}가지도 레시피 목록에 들어왔어요', { n: justAdded.length - 6 })}</p>}
        <RecipeMaker onAdded={(id) => { setJustAdded([id]); setCat(''); setMeal('all'); }} />
      </section>
      {disliked.length > 0 && (
        <section className="card">
          <h2>{t('추천하지 않기로 한 메뉴')}</h2>
          <ul className="plain">
            {disliked.map((r) => (
              <li key={r.id} className="row between"><span>{r.emoji} {t(r.title)}</span>
                <button className="btn small ghost" onClick={() => update('profile', (p) => ({ ...p, dislikes: p.dislikes.filter((x) => x !== r.id) }))}>{t('다시 추천')}</button></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
