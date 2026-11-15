import { useStore } from '../store';
import { RECIPE_BY_ID, shortTitle } from '../data/recipes';
import { sumItems, round } from '../lib/nutrition';
import { go } from '../router';
import Plate from './Plate';

// 레시피 모음·레시피 화면의 '나의 밥상 추가' 버튼
export function MyTableButton({ id, small }) {
  const { state, update, notify } = useStore();
  const on = state.myTable.includes(id);
  const title = RECIPE_BY_ID[id]?.title || '';
  const toggle = () => {
    update('myTable', (t) => (on ? t.filter((x) => x !== id) : [...t, id]));
    notify(on ? `‘${title}’을(를) 나의 밥상에서 뺐어요` : `‘${title}’을(를) 나의 밥상에 올렸어요 (홈 맨 아래)`);
  };
  return (
    <button type="button" className={`btn ${small ? 'small' : ''} ${on ? 'on' : 'ghost'} table-btn`} aria-pressed={on} onClick={toggle}>
      {on ? '✓ 나의 밥상' : '＋ 나의 밥상 추가'}
    </button>
  );
}

// 홈 맨 아래 '나의 밥상': 담아 둔 메뉴를 밥상 위에 차려 보여줌
export function MyTablePanel() {
  const { state, update } = useStore();
  const list = state.myTable.map((id) => RECIPE_BY_ID[id]).filter(Boolean);
  const n = sumItems(list.flatMap((r) => r.items));

  return (
    <section className="panel my-table-panel" aria-labelledby="my-table-h">
      <div className="row between wrap">
        <h2 id="my-table-h"><span aria-hidden>🍚</span> 나의 밥상</h2>
        {list.length > 0 && <button className="btn small ghost" onClick={() => update('myTable', [])}>모두 치우기</button>}
      </div>
      {list.length === 0 ? (
        <div className="my-table empty">
          <p>아직 차린 메뉴가 없어요.<br />레시피 모음에서 <b>＋ 나의 밥상 추가</b>를 눌러 올려 보세요.</p>
          <button className="btn primary" onClick={() => go('/recipes')}>레시피 모음 열기</button>
        </div>
      ) : (
        <>
          <ul className="my-table" aria-label="나의 밥상 메뉴">
            {list.map((r) => (
              <li key={r.id} className="my-dish">
                <button className="my-dish-open" onClick={() => go(`/recipe/${r.id}`)} aria-label={`${r.title} 레시피 보기`}>
                  <Plate recipe={r} size="lg" />
                  <span className="my-dish-name">{shortTitle(r)}</span>
                </button>
                <button className="my-dish-x" aria-label={`${r.title} 밥상에서 빼기`} onClick={() => update('myTable', (t) => t.filter((x) => x !== r.id))}>✕</button>
              </li>
            ))}
          </ul>
          <p className="muted small">{list.length}가지 · 모두 1인분씩 드시면 약 {round(n.kcal)}kcal · 단백질 {round(n.protein)}g · 나트륨 {round(n.sodium)}mg (추정치). 메뉴를 누르면 레시피가 열려요.</p>
        </>
      )}
    </section>
  );
}
