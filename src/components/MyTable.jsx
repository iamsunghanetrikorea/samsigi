import { useStore } from '../store';
import { RECIPE_BY_ID, shortTitle } from '../data/recipes';
import { sumItems, round } from '../lib/nutrition';
import { go } from '../router';
import Plate from './Plate';
import { todayRecipe } from './dashboard';

// 레시피 모음·레시피 화면의 '후보요리 추가' 버튼
export function MyTableButton({ id, small }) {
  const { state, update, notify } = useStore();
  const on = state.myTable.includes(id);
  const title = RECIPE_BY_ID[id]?.title || '';
  const toggle = () => {
    update('myTable', (t) => (on ? t.filter((x) => x !== id) : [...t, id]));
    notify(on ? `‘${title}’을(를) 후보요리에서 뺐어요` : `‘${title}’을(를) 후보요리에 올렸어요 (홈 아래쪽)`);
  };
  return (
    <button type="button" className={`btn ${small ? 'small' : ''} ${on ? 'on' : 'ghost'} table-btn`} aria-pressed={on} onClick={toggle}>
      {on ? '✓ 후보요리' : '＋ 후보요리 추가'}
    </button>
  );
}

// 홈 아래 '후보요리': 담아 둔 메뉴를 밥상 위에 차려 보여줌
export function MyTablePanel() {
  const { state, update } = useStore();
  const list = state.myTable.map((id) => RECIPE_BY_ID[id]).filter(Boolean);
  const n = sumItems(list.flatMap((r) => r.items));

  return (
    <section className="panel my-table-panel" aria-labelledby="my-table-h">
      <div className="row between wrap">
        <h2 id="my-table-h"><span aria-hidden>🍚</span> 후보요리</h2>
        {list.length > 0 && <button className="btn small ghost" onClick={() => update('myTable', [])}>모두 치우기</button>}
      </div>
      {list.length === 0 ? (
        <div className="my-table empty">
          <p>레시피 모음에서 <b>＋ 후보요리 추가</b>를 눌러 올려 보세요.</p>
          <button className="btn primary small" onClick={() => go('/recipes')}>레시피 모음 열기</button>
        </div>
      ) : (
        <>
          <ul className="my-table" aria-label="후보요리 메뉴">
            {list.map((r) => (
              <li key={r.id} className="my-dish">
                <button className="my-dish-open" onClick={() => go(`/recipe/${r.id}`)} aria-label={`${r.title} 레시피 보기`}>
                  <Plate recipe={r} size="lg" />
                  <span className="my-dish-name">{shortTitle(r)}</span>
                </button>
                <button className="my-dish-x" aria-label={`${r.title} 후보요리에서 빼기`} onClick={() => update('myTable', (t) => t.filter((x) => x !== r.id))}>✕</button>
              </li>
            ))}
          </ul>
          <p className="muted small">{list.length}가지 · 모두 1인분씩 드시면 약 {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · 나트륨 {round(n.sodium)}mg (추정치). 메뉴를 누르면 레시피가 열려요.</p>
        </>
      )}
    </section>
  );
}

// 홈 '오늘의 밥상': 차려진 밥상 그림 위 '오늘의 요리' 자리에 오늘의 레시피 사진·이름을 올림
export function BabSangPanel() {
  const { state } = useStore();
  const { d, k, r } = todayRecipe(state);
  const open = () => r && go(`/recipe/${r.id}?date=${d}&meal=${k}`);
  return (
    <section className="panel bab-sang-panel" aria-labelledby="bab-sang-h">
      <h2 id="bab-sang-h"><span aria-hidden>🥢</span> 오늘의 밥상</h2>
      <div className="bab-sang"><div className="bab-sang-in">
        <img src="./bab-sang.webp" alt={`밥, 반찬과 ${r ? r.title : '오늘의 요리'}가 차려진 밥상`} loading="lazy" decoding="async" />
        {r && (
          <button className="bs-today" onClick={open} aria-label={`오늘의 레시피 ${r.title} 보기`}>
            <span className="bs-bowl"><Plate recipe={r} size="lg" /></span>
            <span className="bs-label">{shortTitle(r)}</span>
          </button>
        )}
      </div></div>
    </section>
  );
}
