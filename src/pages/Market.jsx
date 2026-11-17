import { useState } from 'react';
import { useStore } from '../store';
import { ING } from '../data/ingredients';
import { ING_PHOTOS } from '../data/ingPhotos';
import { DIFFICULTY_LABEL } from '../data/recipes';
import { PICK_CATS, PICK_ITEMS, PICK_EXTRA, EXTRA_BY, CAT_LABEL, CAT_EMOJI, shortName, matchIngredient, recommend, dishesWithoutRecipe } from '../lib/market';
import { Seg, longPress } from '../components/ui';
import { go } from '../router';
import Plate from '../components/Plate';
import { MyTableButton } from '../components/MyTable';
import Shopping from './Shopping';
import { googleAiUrl, breakfastAiPrompt } from '../lib/share';

// 장보기 탭: 재료 고르기(사진) → 추천 레시피, 그리고 기존 장보기 목록
export default function Market({ route }) {
  const view = route.query.view === 'list' ? 'list' : 'pick';
  const result = view === 'pick' && route.query.step === 'result';
  return (
    <div className="stack">
      <h1>{view === 'list' ? '장보기 목록' : '장보기'}</h1>
      {view === 'pick' && !result && <p className="recipe-hint">아래 재료사진들을 선택하고 레시피 추천 버튼을 누르세요</p>}
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

const label = (id, custom) => (ING[id] ? shortName(ING[id].name) : EXTRA_BY[id]?.name || custom.find((c) => c.id === id)?.name || '');

function Picker() {
  const { notify } = useStore();
  const [m, set] = useMarket();
  const picked = new Set(m.picked);
  const toggle = (id) => set((x) => ({ ...x, picked: x.picked.includes(id) ? x.picked.filter((y) => y !== id) : [...x.picked, id] }));
  const names = m.picked.map((id) => label(id, m.custom)).filter(Boolean);
  const hidden = new Set(m.hidden || []);
  // 사진을 길게 누르면 삭제: 내가 추가한 재료는 지우고, 기본 재료는 목록에서 숨김(아래 '다시 보이기'로 되살림)
  const remove = (i, name) => {
    if (!window.confirm(`‘${name}’ 사진을 지울까요?`)) return;
    const mine = m.custom.some((c) => c.id === i.id);
    set((x) => ({
      ...x,
      picked: x.picked.filter((y) => y !== i.id),
      ...(mine ? { custom: x.custom.filter((c) => c.id !== i.id) } : { hidden: [...(x.hidden || []), i.id] }),
    }));
    notify(`‘${name}’ 사진을 지웠어요`);
  };

  return (
    <>
      <div className="ing-board">
        {PICK_CATS.map((cat) => {
          const items = [...PICK_ITEMS.filter((i) => i.cat === cat), ...PICK_EXTRA.filter((i) => i.cat === cat), ...m.custom.filter((c) => c.cat === cat)].filter((i) => !hidden.has(i.id));
          if (!items.length) return null;
          return (
            <section key={cat} className="ing-cat" aria-label={CAT_LABEL[cat] || cat}>
              <h2 className="ing-cat-h"><span aria-hidden>{CAT_EMOJI[cat]}</span> {CAT_LABEL[cat] || cat}</h2>
              <ul className="ing-grid">
                {items.map((i) => {
                  const on = picked.has(i.id);
                  const name = ING[i.id] ? shortName(i.name) : i.name;
                  return (
                    <li key={i.id} className={`ing-tile ${on ? 'on' : ''}`} {...longPress(() => remove(i, name))}>
                      <label>
                        <input type="checkbox" className="ing-check" checked={on} onChange={() => toggle(i.id)} />
                        <span className="ing-ph">
                          {ING_PHOTOS[i.id] ? <img src={`./photos/ing/${i.id}.webp${ING_PHOTOS[i.id].v ? `?v=${ING_PHOTOS[i.id].v}` : ''}`} alt="" loading="lazy" decoding="async" /> : i.photo ? <img src={i.photo} alt="" /> : <span className="ing-emoji" aria-hidden>{CAT_EMOJI[cat]}</span>}
                        </span>
                        <span className="ing-name">{name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {hidden.size > 0 && <p className="muted small long-help no-print"><button type="button" className="linklike" onClick={() => set((x) => ({ ...x, hidden: [] }))}>지운 기본 재료 {hidden.size}가지 다시 보이기</button></p>}

      <div className="pick-bar no-print" role="region" aria-label="고른 재료">
        <div className="pick-box">
          <div className="pick-sum">
            <b>{names.length}개 선택</b>
            <span className="pick-names">{names.length ? names.join(', ') : '사진을 눌러 재료를 골라 주세요'}</span>
          </div>
          {names.length > 0 && <button className="btn small ghost" onClick={() => set((x) => ({ ...x, picked: [] }))}>모두 해제</button>}
        </div>
        <button className="btn primary pick-go" disabled={!names.length} onClick={() => go('/shopping?step=result')}>레시피 추천</button>
      </div>

      <AiBreakfast names={names} />

      <AddIngredient custom={m.custom}
        onRemove={(id) => set((x) => ({ ...x, custom: x.custom.filter((c) => c.id !== id), picked: x.picked.filter((y) => y !== id) }))}
        onAdd={(name, cat, photo, credit) => {
        const same = matchIngredient(name);
        if (same) {
          set((x) => ({ ...x, picked: x.picked.includes(same) ? x.picked : [...x.picked, same] }));
          notify(`‘${shortName(ING[same].name)}’은(는) 이미 있어서 골라 두었어요`);
          return;
        }
        if (m.custom.some((c) => c.name === name)) { notify(`‘${name}’은(는) 이미 추가했어요`); return; }
        const id = `c_${Date.now().toString(36)}`;
        set((x) => ({ ...x, custom: [...x.custom, { id, name, cat, ...(photo ? { photo } : {}), ...(credit ? { credit } : {}) }], picked: [...x.picked, id] }));
        notify(`‘${name}’ 재료를 추가하고 골라 두었어요`);
      }} />
    </>
  );
}

// 올린 사진을 가운데 정사각으로 잘라 240px JPEG로 줄임 (기기 안에만 저장)
function shrinkPhoto(src) {
  return new Promise((resolve, reject) => {
    const isFile = typeof src !== 'string';
    const url = isFile ? URL.createObjectURL(src) : src;
    const img = new Image();
    if (!isFile) img.crossOrigin = 'anonymous'; // 인터넷 사진도 잘라 저장할 수 있게
    const done = () => { if (isFile) URL.revokeObjectURL(url); };
    img.onload = () => {
      try {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const c = document.createElement('canvas');
        c.width = c.height = 240;
        c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 240, 240);
        resolve(c.toDataURL('image/jpeg', 0.82));
      } catch (e) { reject(new Error('이 사진은 가져올 수 없어요')); }
      done();
    };
    img.onerror = () => { done(); reject(new Error('사진을 읽지 못했어요')); };
    img.src = url;
  });
}

// 인터넷 찾기: 위키미디어 공용(Wikimedia Commons)에서 자유 이용 사진만 찾음
const FREE = /^(CC0|Public domain|CC BY(-SA)? [\d.]+)/i;
const strip = (h) => (h || '').replace(/<[^>]+>/g, '').trim();
async function searchPhotos(q) {
  const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    origin: '*', action: 'query', format: 'json', generator: 'search', gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '320',
  });
  const res = await fetch(u);
  if (!res.ok) throw new Error('인터넷 찾기에 실패했어요');
  const d = await res.json();
  return Object.values(d.query?.pages || {})
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((p) => {
      const ii = p.imageinfo?.[0];
      const m = ii?.extmetadata || {};
      const license = strip(m.LicenseShortName?.value);
      return ii && FREE.test(license) ? { thumb: ii.thumburl, page: ii.descriptionurl, license, artist: strip(m.Artist?.value) || '작성자 미상', title: p.title } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
}

// 인공지능 레시피추천: 구글 AI 모드가 인터넷을 찾아 아침 재료·메뉴를 추천 (같은 창, 뒤로 가기로 돌아옴)
function AiBreakfast({ names }) {
  // 질문은 주소에 담겨 가므로 복사(클립보드 권한 창이 뜰 수 있음) 없이 바로 이동
  const ask = () => window.location.assign(googleAiUrl(breakfastAiPrompt(names)));
  return (
    <section className="card ai-box no-print" aria-labelledby="ai-h">
      <h2 id="ai-h">🤖 인공지능 레시피추천</h2>
      <p className="muted small">{names.length ? `고른 재료(${names.join(', ')})로` : '재료를 고르지 않아도'} 아침에 가볍게 먹을 재료와 메뉴를 3~4가지씩, 구글 AI가 인터넷 정보를 찾아 추천해 드려요.</p>
      <button type="button" className="btn ai-btn" onClick={ask}>🤖 인공지능 레시피추천</button>
    </section>
  );
}

export function AddIngredient({ onAdd, custom = [], onRemove, label = '장보기 재료 추가 입력', unit = '재료', placeholder = '예: 삼겹살, 연근', noCat = false }) {
  const { notify } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cat, setCat] = useState('채소');
  const [photo, setPhoto] = useState('');
  const [credit, setCredit] = useState(null);
  const [found, setFound] = useState(null); // null: 안 찾음, []: 결과 없음
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setPhoto(await shrinkPhoto(f)); setCredit(null); setFound(null); } catch (err) { notify(err.message); }
  };
  const find = async () => {
    const n = name.trim();
    if (!n) { notify(`먼저 새 ${unit} 이름을 적어 주세요`); return; }
    setBusy(true);
    try { setFound(await searchPhotos(n)); } catch (err) { notify(err.message); setFound([]); }
    setBusy(false);
  };
  const choose = async (r) => {
    setBusy(true);
    try { setPhoto(await shrinkPhoto(r.thumb)); setCredit({ page: r.page, license: r.license, artist: r.artist }); setFound(null); } catch (err) { notify(err.message); }
    setBusy(false);
  };
  const clear = () => { setPhoto(''); setCredit(null); };
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) { notify(`새 ${unit} 이름을 적어 주세요`); return; }
    onAdd(n, cat, photo, credit);
    setName(''); clear(); setFound(null);
  };
  const google = `https://www.google.com/search?udm=2&q=${encodeURIComponent(name.trim())}`;
  return (
    <div className="card ing-add no-print">
      <button type="button" className="btn soft ing-add-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{label} <span aria-hidden>{open ? '▲' : '▼'}</span></button>
      {open && (
        <form className="ing-add-form" onSubmit={submit}>
          <div className="row wrap">
            <input aria-label={`새 ${unit} 이름`} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus />
            {!noCat && (
              <select aria-label="분류" value={cat} onChange={(e) => setCat(e.target.value)}>
                {PICK_CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c] || c}</option>)}
              </select>
            )}
          </div>
          {/* 왼쪽 사진 미리보기, 오른쪽에 위아래로 '사진 올리기'·'인터넷 찾기' */}
          <div className="ing-add-photo">
            <span className="ing-ph ing-add-prev">{photo ? <img src={photo} alt={`${unit} 사진 미리보기`} /> : <span className="ing-emoji" aria-hidden>{noCat ? '🍽️' : CAT_EMOJI[cat]}</span>}</span>
            <div className="ing-add-btns">
              <label className="btn ghost small">
                📷 {photo ? '사진 바꾸기' : '사진 올리기'}
                <input type="file" accept="image/*" className="sr-file" onChange={pick} />
              </label>
              <button type="button" className="btn ghost small" onClick={find} disabled={busy}>🔎 {busy ? '찾는 중…' : '인터넷 찾기'}</button>
              {photo && <button type="button" className="btn ghost small" onClick={clear}>사진 빼기</button>}
            </div>
          </div>
          {credit && <p className="muted small">사진: <a href={credit.page} target="_blank" rel="noopener noreferrer">{credit.artist}</a>, {credit.license} (Wikimedia Commons)</p>}
          {found && (
            <div className="web-photos">
              {found.length ? (
                <>
                  <p className="muted small">‘{name.trim()}’ 자유 이용 사진이에요. 마음에 드는 사진을 누르세요.</p>
                  <ul className="web-grid">
                    {found.map((r) => (
                      <li key={r.page}><button type="button" className="web-pick" onClick={() => choose(r)} disabled={busy} aria-label={`${r.title} 고르기`}><img src={r.thumb} alt="" loading="lazy" /></button></li>
                    ))}
                  </ul>
                </>
              ) : <p className="muted small">자유 이용 사진을 찾지 못했어요. 다른 이름(예: 영어 이름)으로 찾아보시거나, 아래 구글 이미지에서 사진을 저장한 뒤 ‘사진 올리기’로 넣어 주세요.</p>}
              <div className="row wrap">
                <a className="btn ghost small" href={google} target="_blank" rel="noopener noreferrer">구글 이미지에서 보기 ↗</a>
                <button type="button" className="btn ghost small" onClick={() => setFound(null)}>닫기</button>
              </div>
            </div>
          )}
          <button className="btn primary" type="submit">추가</button>
          {custom.length > 0 && (
            <details className="ing-mine">
              <summary>내가 추가한 {unit} {custom.length}가지 관리</summary>
              <ul className="plain">
                {custom.map((c) => (
                  <li key={c.id} className="row between"><span>{c.name} {!noCat && <span className="muted small">({CAT_LABEL[c.cat] || c.cat})</span>}</span>
                    <button type="button" className="btn small ghost" onClick={() => onRemove(c.id)}>지우기</button></li>
                ))}
              </ul>
            </details>
          )}
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
  const hidden = new Set(m.hidden || []);
  // 사진을 길게 누르면 삭제: 내가 추가한 재료는 지우고, 기본 재료는 목록에서 숨김(아래 '다시 보이기'로 되살림)
  const remove = (i, name) => {
    if (!window.confirm(`‘${name}’ 사진을 지울까요?`)) return;
    const mine = m.custom.some((c) => c.id === i.id);
    set((x) => ({
      ...x,
      picked: x.picked.filter((y) => y !== i.id),
      ...(mine ? { custom: x.custom.filter((c) => c.id !== i.id) } : { hidden: [...(x.hidden || []), i.id] }),
    }));
    notify(`‘${name}’ 사진을 지웠어요`);
  };
  const noRecipe = dishesWithoutRecipe(m.picked, m.custom);

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
          <button className="btn ghost repick-btn" onClick={() => go('/shopping')}>← 재료 다시 고르기</button>
        </div>
        <div className="chips">{names.map((n) => <span key={n} className="tag-have">{n}</span>)}</div>
      </section>

      {!list.length && !noRecipe.length && (
        <div className="card center stack">
          <p>고른 재료로 만들 수 있는 레시피를 찾지 못했어요. 재료를 더 골라 보거나, 레시피 모음의 ‘나의 레시피 추가’로 메뉴를 만들어 보세요.</p>
          <button className="btn" onClick={() => go('/recipes')}>레시피 모음 열기</button>
        </div>
      )}
      {noRecipe.length > 0 && (
        <section className="card stack">
          <h2>📝 아직 레시피가 없는 메뉴</h2>
          <p className="muted small">레시피 모음에 없는 메뉴예요. 누르면 이름으로 1인분 레시피 초안을 만들어 드려요. 고쳐서 저장하면 다음부터 추천에 나와요.</p>
          <div className="row wrap">
            {noRecipe.map((n) => <button key={n} className="btn soft" onClick={() => go(`/recipes?make=${encodeURIComponent(n)}`)}>‘{n}’ 레시피 만들기</button>)}
          </div>
        </section>
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
