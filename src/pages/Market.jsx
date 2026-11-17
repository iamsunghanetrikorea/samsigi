import { useState } from 'react';
import { useStore } from '../store';
import { ING } from '../data/ingredients';
import { ING_PHOTOS } from '../data/ingPhotos';
import { DIFFICULTY_LABEL } from '../data/recipes';
import { PICK_CATS, PICK_ITEMS, CAT_LABEL, CAT_EMOJI, shortName, matchIngredient, recommend } from '../lib/market';
import { Seg } from '../components/ui';
import { go } from '../router';
import Plate from '../components/Plate';
import { MyTableButton } from '../components/MyTable';
import Shopping from './Shopping';

// 장보기 탭: 재료 고르기(사진) → 추천 레시피, 그리고 기존 장보기 목록
export default function Market({ route }) {
  const view = route.query.view === 'list' ? 'list' : 'pick';
  const result = view === 'pick' && route.query.step === 'result';
  return (
    <div className="stack">
      <h1>{view === 'list' ? '장보기 목록' : '장보기'}</h1>
      {/* 휴대폰에서는 장보기 목록을 '더보기'에서 열기 때문에 전환 단추를 숨김 */}
      <div className="no-print hide-m">
        <Seg label="장보기 화면" value={view} onChange={(v) => go(v === 'list' ? '/shopping?view=list' : '/shopping')}
          options={[{ value: 'pick', label: '🧺 재료 고르기' }, { value: 'list', label: '📝 장보기 목록' }]} />
      </div>
      {view === 'list' ? <Shopping /> : result ? <Result /> : <Picker />}
    </div>
  );
}

const useMarket = () => {
  const { state, update } = useStore();
  const m = state.market || { picked: [], custom: [] };
  const set = (fn) => update('market', (x) => fn(x || { picked: [], custom: [] }));
  return [m, set];
};

const label = (id, custom) => (ING[id] ? shortName(ING[id].name) : custom.find((c) => c.id === id)?.name || '');

function Picker() {
  const { notify } = useStore();
  const [m, set] = useMarket();
  const picked = new Set(m.picked);
  const toggle = (id) => set((x) => ({ ...x, picked: x.picked.includes(id) ? x.picked.filter((y) => y !== id) : [...x.picked, id] }));
  const names = m.picked.map((id) => label(id, m.custom)).filter(Boolean);

  return (
    <>
      <div className="ing-board">
        {PICK_CATS.map((cat) => {
          const items = [...PICK_ITEMS.filter((i) => i.cat === cat), ...m.custom.filter((c) => c.cat === cat)];
          if (!items.length) return null;
          return (
            <section key={cat} className="ing-cat" aria-label={CAT_LABEL[cat] || cat}>
              <h2 className="ing-cat-h"><span aria-hidden>{CAT_EMOJI[cat]}</span> {CAT_LABEL[cat] || cat}</h2>
              <ul className="ing-grid">
                {items.map((i) => {
                  const on = picked.has(i.id);
                  const custom = !ING[i.id];
                  const name = custom ? i.name : shortName(i.name);
                  return (
                    <li key={i.id} className={`ing-tile ${on ? 'on' : ''}`}>
                      <label>
                        <input type="checkbox" className="ing-check" checked={on} onChange={() => toggle(i.id)} />
                        <span className="ing-ph">
                          {ING_PHOTOS[i.id] ? <img src={`./photos/ing/${i.id}.webp`} alt="" loading="lazy" decoding="async" /> : <span className="ing-emoji" aria-hidden>{CAT_EMOJI[cat]}</span>}
                        </span>
                        <span className="ing-name">{name}</span>
                      </label>
                      {custom && (
                        <button type="button" className="ing-del" aria-label={`${name} 재료 지우기`}
                          onClick={() => set((x) => ({ ...x, custom: x.custom.filter((c) => c.id !== i.id), picked: x.picked.filter((y) => y !== i.id) }))}>✕</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <AddIngredient onAdd={(name, cat) => {
        const same = matchIngredient(name);
        if (same) {
          set((x) => ({ ...x, picked: x.picked.includes(same) ? x.picked : [...x.picked, same] }));
          notify(`‘${shortName(ING[same].name)}’은(는) 이미 있어서 골라 두었어요`);
          return;
        }
        if (m.custom.some((c) => c.name === name)) { notify(`‘${name}’은(는) 이미 추가했어요`); return; }
        const id = `c_${Date.now().toString(36)}`;
        set((x) => ({ ...x, custom: [...x.custom, { id, name, cat }], picked: [...x.picked, id] }));
        notify(`‘${name}’ 재료를 추가하고 골라 두었어요`);
      }} />

      <div className="pick-bar no-print" role="region" aria-label="고른 재료">
        <div className="pick-sum">
          <b>{names.length}개 선택</b>
          <span className="pick-names">{names.length ? names.join(', ') : '사진을 눌러 재료를 골라 주세요'}</span>
        </div>
        {names.length > 0 && <button className="btn small ghost" onClick={() => set((x) => ({ ...x, picked: [] }))}>모두 해제</button>}
        <button className="btn primary" disabled={!names.length} onClick={() => go('/shopping?step=result')}>레시피 추천 보기</button>
      </div>
    </>
  );
}

function AddIngredient({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cat, setCat] = useState('채소');
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAdd(n, cat);
    setName('');
  };
  return (
    <div className="card ing-add no-print">
      <button type="button" className="btn soft" aria-expanded={open} onClick={() => setOpen((o) => !o)}>＋ 재료추가</button>
      {open && (
        <form className="row wrap" onSubmit={submit}>
          <input aria-label="새 재료 이름" placeholder="예: 삼겹살, 연근" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus />
          <select aria-label="분류" value={cat} onChange={(e) => setCat(e.target.value)}>
            {PICK_CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c] || c}</option>)}
          </select>
          <button className="btn primary" type="submit">추가</button>
        </form>
      )}
    </div>
  );
}

function Result() {
  const { state, update, notify } = useStore();
  const [m] = useMarket();
  const list = recommend(m.picked, m.custom, state.profile);
  const ready = list.filter((x) => !x.need.length);
  const more = list.filter((x) => x.need.length);
  const names = m.picked.map((id) => label(id, m.custom)).filter(Boolean);

  const addNeed = (x) => {
    update('shopping', (sh) => {
      const extras = [...(sh.extras || [])];
      for (const n of x.need) {
        const ex = extras.find((e) => e.id === n.id);
        if (ex) ex.grams += n.g; else extras.push({ id: n.id, grams: n.g, from: x.recipe.title, checked: false });
      }
      return { ...sh, extras };
    });
    notify(`‘${x.recipe.title}’에 더 필요한 재료 ${x.need.length}가지를 장보기 목록에 담았어요`);
  };

  if (!names.length) {
    return <div className="card center stack"><p>아직 고른 재료가 없어요.</p><button className="btn primary" onClick={() => go('/shopping')}>재료 고르러 가기</button></div>;
  }

  return (
    <>
      <section className="card">
        <div className="row between wrap">
          <h2>고른 재료 {names.length}가지</h2>
          <button className="btn small ghost" onClick={() => go('/shopping')}>← 재료 다시 고르기</button>
        </div>
        <div className="chips">{names.map((n) => <span key={n} className="tag-have">{n}</span>)}</div>
      </section>

      {!list.length && (
        <div className="card center stack">
          <p>고른 재료로 만들 수 있는 레시피를 찾지 못했어요. 재료를 더 골라 보거나, 레시피 모음의 ‘나의 메뉴 추가’로 메뉴를 만들어 보세요.</p>
          <button className="btn" onClick={() => go('/recipes')}>레시피 모음 열기</button>
        </div>
      )}
      {ready.length > 0 && <RecGroup title="✅ 바로 만들 수 있어요" note="더 살 재료 없이 고른 재료와 기본 양념으로 만들어요." list={ready} />}
      {more.length > 0 && <RecGroup title="🛒 조금만 더 사면 돼요" note="빠진 재료는 버튼 한 번으로 장보기 목록에 담을 수 있어요." list={more} onAdd={addNeed} />}
      <p className="muted small">조리 시간이 짧고 쉬운 메뉴를 먼저 보여 줘요. 내 조건(알레르기·제외 재료 등)에 맞지 않는 메뉴는 뺐어요.</p>
    </>
  );
}

function RecGroup({ title, note, list, onAdd }) {
  return (
    <section className="stack rec-group">
      <div><h2>{title}</h2><p className="muted small">{note}</p></div>
      <ul className="rec-list">
        {list.map((x) => (
          <li key={x.recipe.id} className="card rec-card">
            <button className="rec-open" onClick={() => go(`/recipe/${x.recipe.id}`)} aria-label={`${x.recipe.title} 레시피 보기`}>
              <Plate recipe={x.recipe} size="lg" />
            </button>
            <div className="rec-body">
              <a className="rec-title" href={`#/recipe/${x.recipe.id}`}>{x.recipe.title}</a>
              <p className="muted small">⏱ {x.time}분 · {DIFFICULTY_LABEL[x.recipe.difficulty] || '쉬움'}</p>
              <p className="rec-ings"><span className="muted small">쓰는 재료</span> {x.used.map((u) => <span key={u.name} className="tag-have">{u.name}</span>)}</p>
              {x.need.length > 0 && <p className="rec-ings"><span className="muted small">더 필요</span> {x.need.map((n) => <span key={n.id} className="tag-need">{n.name}</span>)}</p>}
              <div className="row wrap">
                {onAdd && <button className="btn small soft" onClick={() => onAdd(x)}>＋ 장보기 목록에 담기</button>}
                <MyTableButton id={x.recipe.id} small />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
