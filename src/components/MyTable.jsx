import { useStore } from '../store';
import { RECIPE_BY_ID, shortTitle } from '../data/recipes';
import { sumItems, round } from '../lib/nutrition';
import { go } from '../router';
import Plate from './Plate';
import { todayRecipe } from './dashboard';
import { t } from '../i18n';
import { BIBLE_VERSES } from '../data/bibleVerses';
import { today } from '../lib/date';

// 오늘(월·일)의 성경 구절 — 연도 무시, 2/29는 2/28 구절
const todayVerse = () => { const md = today().slice(5); return BIBLE_VERSES[md] || BIBLE_VERSES[md === '02-29' ? '02-28' : ''] || null; };

// 번역된 제목으로 짧은 이름 만들기 (한국어일 땐 그대로)
const st = (r) => (r ? shortTitle({ ...r, title: t(r.title) }) : '');

// 레시피 모음·레시피 화면의 '후보요리 추가' 버튼
export function MyTableButton({ id, small }) {
  const { state, update, notify } = useStore();
  const on = state.myTable.includes(id);
  const title = t(RECIPE_BY_ID[id]?.title || '');
  const toggle = () => {
    update('myTable', (l) => (on ? l.filter((x) => x !== id) : [...l, id]));
    notify(on ? t('‘{title}’을(를) 후보요리에서 뺐어요', { title }) : t('‘{title}’을(를) 후보요리에 올렸어요 (홈 아래쪽)', { title }));
  };
  return (
    <button type="button" className={`btn ${small ? 'small' : ''} ${on ? 'on' : 'ghost'} table-btn`} aria-pressed={on} onClick={toggle}>
      {on ? `✓ ${t('후보요리')}` : `＋ ${t('후보요리 추가')}`}
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
        <h2 id="my-table-h"><span aria-hidden>🍚</span> {t('후보요리')}</h2>
        {list.length > 0 && <button className="btn small ghost" onClick={() => update('myTable', [])}><span className="hide-m">{t('모두 치우기')}</span><span className="only-m">{t('메뉴비우기')}</span></button>}
      </div>
      {list.length === 0 ? (
        <div className="my-table empty">
          <p>{t('레시피 모음에서 {btn}를 눌러 올려 보세요.').split('{btn}').map((part, i) => (i ? [<b key={i}>＋ {t('후보요리 추가')}</b>, part] : part))}</p>
          <button className="btn primary small" onClick={() => go('/recipes')}>{t('레시피 모음 열기')}</button>
        </div>
      ) : (
        <>
          <ul className="my-table" aria-label={t('후보요리 메뉴')}>
            {list.map((r) => (
              <li key={r.id} className="my-dish">
                <button className="my-dish-open" onClick={() => go(`/recipe/${r.id}`)} aria-label={t('{title} 레시피 보기', { title: t(r.title) })}>
                  <Plate recipe={r} size="lg" />
                  <span className="my-dish-name">{st(r)}</span>
                </button>
                <button className="my-dish-x" aria-label={t('{title} 후보요리에서 빼기', { title: t(r.title) })} onClick={() => update('myTable', (l) => l.filter((x) => x !== r.id))}>✕</button>
              </li>
            ))}
          </ul>
          <p className="muted small hide-m">{t('{n}가지 · 모두 1인분씩 드시면 약 {kcal}kcal · 단백질 {protein}g · 나트륨 {sodium}mg (추정치). 메뉴를 누르면 레시피가 열려요.', { n: list.length, kcal: round(n.kcal), protein: round(n.protein), sodium: round(n.sodium) })}</p>
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
  const verse = todayVerse();
  return (
    <section className="panel bab-sang-panel" aria-labelledby="bab-sang-h">
      <h2 id="bab-sang-h"><span aria-hidden>🥢</span> {t('오늘의 밥상')}</h2>
      <div className="bab-sang"><div className="bab-sang-in">
        <img src="./bab-sang.webp?v=3" alt={t('밥, 반찬과 {dish}가 차려진 밥상', { dish: r ? t(r.title) : t('오늘의 요리') })} loading="lazy" decoding="async" />
        {r && (
          <button className="bs-today" onClick={open} aria-label={t('오늘의 레시피 {title} 보기', { title: t(r.title) })}>
            <span className="bs-bowl"><Plate recipe={r} size="lg" /></span>
            <span className="bs-label">{st(r)}</span>
          </button>
        )}
      </div></div>
      {verse && <p className="bs-verse">“{verse[0]}” <cite>({verse[1]})</cite></p>}
    </section>
  );
}
