import { useState } from 'react';
import { Pencil, X, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import { RECIPES, MEAL_LABEL, RECIPE_BY_ID, CATEGORIES } from '../data/recipes';
import { PACK, nextUpdate } from '../data/recipePack';
import { ING } from '../data/ingredients';
import { mealItems, sumItems, round } from '../lib/nutrition';
import { excludeReason } from '../lib/planner';
import { leftoverRecipes } from '../lib/shopping';
import { go } from '../router';
import Plate from '../components/Plate';
import RecipeMaker, { RecipeEditor } from '../components/RecipeMaker';
import { MyTableButton } from '../components/MyTable';
import { t } from '../i18n';
import RecipeCard, { RecipeGrid, RecipeGridItem } from '../components/shadcn-space/RecipeCard';
import { MicButton, useSpeech } from '../components/Mic';

export default function RecipeList() {
  const { state, targets, update, addRecipeUpdate, saveCustomRecipe, saveRecipeEdit, notify } = useStore();
  const [editId, setEditId] = useState(null);
  const [justAdded, setJustAdded] = useState([]);
  const remaining = nextUpdate(state.addedRecipes).length;
  const doUpdate = () => {
    const ids = addRecipeUpdate();
    setJustAdded(ids);
    setKind('');
    notify(ids.length ? t('새 메뉴 {n}가지를 레시피 모음에 추가했어요', { n: ids.length }) : t('추가할 새 메뉴가 없어요'));
  };
  const [onlyOk, setOnlyOk] = useState(true);
  // 제목 줄 검색칸: 직접 쓰거나 마이크로 말해서 메뉴 이름으로 바로 찾기
  const [q, setQ] = useState('');
  const [kind, setKind] = useState(''); // 왼쪽 메뉴 종류 (한식·중식…)
  const { listening, toggle } = useSpeech((said) => setQ(said.slice(0, 20)));
  const leftovers = leftoverRecipes(state.pantry);
  const byName = (name) => (r) => r.title.includes(name) || t(r.title).includes(name) || r.items.some(([id]) => ING[id]?.name.includes(name.replace(/달걀/g, '계란')));
  const query = q.trim();
  const list = RECIPES.filter((r) => (!query || byName(query)(r))
    && (!kind || query || r.category === kind) // 이름으로 찾을 때는 종류를 가리지 않음(왼쪽 분류가 숨어 있어서)
    && (!onlyOk || !excludeReason(r, state.profile)));
  const noHit = !!query && list.length === 0; // 적거나 말한 메뉴를 못 찾았을 때
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
      {/* 검색 중에는 찾은 말과 결과 수를 알려 주고, 메뉴 목록만 보여 줌 */}
      {query && (
        <section className="card">
          <div className="row between wrap">
            <h2>{t('‘{name}’(으)로 찾은 메뉴 {n}개', { name: query, n: list.length })}</h2>
            {/* 휴대폰에서는 위에 붙어 있는 검색칸의 ✕로 돌아가므로 단추를 숨김 */}
            <button className="btn ghost repick-btn hide-m" onClick={() => setQ('')}><ArrowLeft aria-hidden size={18} strokeWidth={1.75} />{t('메뉴 사진 다시 보기')}</button>
          </div>
        </section>
      )}
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
      {/* 왼쪽에 메뉴 종류, 오른쪽에 그 종류의 메뉴들 */}
      <div className={`kind-layout ${query ? 'no-tabs' : ''}`}>
        {!query && (
          <nav className="kind-tabs" aria-label={t('메뉴 종류')}>
            <button type="button" className={`kind-tab ${kind === '' ? 'on' : ''}`} aria-pressed={kind === ''} onClick={() => setKind('')}>{t('전체')}</button>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={`kind-tab ${kind === c ? 'on' : ''}`} aria-pressed={kind === c} onClick={() => setKind(kind === c ? '' : c)}>{t(c)}</button>
            ))}
          </nav>
        )}
        <div className="kind-body">
      {!query && <p className="muted">{t('{n}개', { n: list.length })}</p>}
      {query && list.length === 0 && (
        <p className="notice">{t('‘{name}’(으)로 찾은 메뉴가 없어요. 다른 이름으로 찾아보시거나, 아래 ‘나의 레시피 추가’로 만들어 보세요.', { name: query })}</p>
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
        </div>
      </div>
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
        <RecipeMaker onAdded={(id) => { setJustAdded([id]); setKind(''); }} />
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
