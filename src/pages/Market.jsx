import { useLayoutEffect, useRef, useState } from 'react';
import { ShoppingBasket, ClipboardList, Camera, Search, ExternalLink, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useStore } from '../store';
import { ING } from '../data/ingredients';
import { ING_PHOTOS } from '../data/ingPhotos';
import { DIFFICULTY_LABEL } from '../data/recipes';
import { PICK_CATS, PICK_ITEMS, PICK_EXTRA, EXTRA_BY, CAT_EMOJI, catLabel, shortName, ingLabel, matchIngredient, recommend, dishesWithoutRecipe } from '../lib/market';
import { Seg, longPress, useHeadHeight } from '../components/ui';
import { go } from '../router';
import { MyTableButton } from '../components/MyTable';
import { tShort } from '../i18n/short';
import Shopping from './Shopping';
import { googleAiUrl, breakfastAiPrompt } from '../lib/share';
import { t } from '../i18n';
import RecipeCard, { RecipeGrid, RecipeGridItem, IngredientTags } from '../components/shadcn-space/RecipeCard';
import { MicButton, useSpeech } from '../components/Mic';

// 장보기 탭: 재료 고르기(사진) → 추천 레시피, 그리고 기존 장보기 목록
export default function Market({ route }) {
  const view = route.query.view === 'list' ? 'list' : 'pick';
  const result = view === 'pick' && route.query.step === 'result';
  const headRef = useHeadHeight(); // 제목·검색줄 높이를 알려 둬서 왼쪽 분류 칸이 그 바로 아래에 붙게 함
  return (
    <div className="stack">
      {/* 제목 오른쪽 마이크: 재료를 말하면 바로 골라서 추천 결과까지 보여 줌 */}
      <div className="recipe-head" ref={headRef}>
        <h1>{view === 'list' ? t('장보기 목록') : t('재료 검색')}</h1>
        {view === 'pick' && <PickSearch />}
      </div>
      {view === 'pick' && !result && <>
        <p className="recipe-hint hide-m">{t('아래 재료사진들을 선택하고 레시피 추천 버튼을 누르세요')}</p>
        <p className="recipe-hint only-m">{t('마이크를 누르고 재료를 말하면 바로 찾아 드려요')}</p>
      </>}
      {/* 휴대폰에서는 장보기 목록을 '더보기'에서 열기 때문에 전환 단추를 숨김 */}
      <div className="no-print hide-m">
        <Seg label={t('장보기 화면')} value={view} onChange={(v) => go(v === 'list' ? '/shopping?view=list' : '/shopping')}
          options={[{ value: 'pick', label: <><ShoppingBasket aria-hidden size={18} strokeWidth={1.75} />{t('재료 고르기')}</> }, { value: 'list', label: <><ClipboardList aria-hidden size={18} strokeWidth={1.75} />{t('장보기 목록')}</> }]} />
      </div>
      {view === 'list' ? <Shopping /> : result ? <Result /> : <Picker />}
    </div>
  );
}

// 말한 이름을 사진 재료와 맞춰 봄: 같은 이름 먼저, 없으면 이름에 들어간 말로
const norm = (x) => (x || '').replace(/\s+/g, '').replace(/달걀/g, '계란').toLowerCase();
// 흔히 쓰는 말이 재료 이름과 다를 때 (재료는 '닭가슴살·돼지고기(안심·앞다리)'처럼 적혀 있음)
const SPOKEN_ALIAS = { 닭: 'chicken_breast', 닭고기: 'chicken_breast', 치킨: 'chicken_breast', 돼지: 'pork', 삼겹살: 'pork', 목살: 'pork', 쇠고기: 'beef', 소고기: 'beef', 한우: 'beef' };
function matchSpoken(said, custom = []) {
  const pool = [...PICK_ITEMS, ...PICK_EXTRA, ...custom];
  const names = pool.map((i) => ({ id: i.id, ns: [i.name, shortName(i.name), label(i.id, custom)].filter(Boolean).map(norm) }));
  const out = [];
  for (const w of said.split(/[,·/]|\s+/).map((x) => x.trim()).filter(Boolean)) {
    const n = norm(w);
    const hit = matchIngredient(w)
      || SPOKEN_ALIAS[n]
      || names.find((i) => i.ns.includes(n))?.id
      || (n.length >= 2 ? names.find((i) => i.ns.some((x) => x.includes(n) || n.includes(x)))?.id : null);
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

// 제목 옆 마이크와 입력칸: 말하거나 적은 재료를 골라 두고 바로 추천 결과 화면으로
// (재료 사진은 잠시 숨고 결과가 바로 나옴)
function PickSearch() {
  const { notify } = useStore();
  const [m, set] = useMarket();
  const [q, setQ] = useState('');
  const run = (text) => {
    const said = (text || '').trim();
    if (!said) return;
    const ids = matchSpoken(said, m.custom);
    if (!ids.length) { notify(t('‘{name}’에 맞는 재료를 찾지 못했어요. 사진에서 골라 주세요.', { name: said })); return; }
    set((x) => ({ ...x, picked: ids })); // 전에 고른 재료는 지우고 이번에 말한 것만
    notify(t('‘{names}’을(를) 골랐어요', { names: ids.map((id) => label(id, m.custom)).join(', ') }));
    go('/shopping?step=result');
  };
  const { listening, toggle } = useSpeech((said) => { setQ(said); run(said); });
  return (
    <>
      <MicButton listening={listening} onClick={toggle} className="mic-btn mic-inline" />
      <span className="recipe-search">
        <input type="search" aria-label={t('재료 이름으로 찾기')} placeholder={listening ? t('듣는 중…') : t('예: 두부, 계란')}
          value={q} onChange={(e) => setQ(e.target.value)} maxLength={20}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(q); e.currentTarget.blur(); } }} />
        {q && <button type="button" className="search-x" onClick={() => setQ('')} aria-label={t('검색어 지우기')}><X aria-hidden size={18} strokeWidth={2} /></button>}
      </span>
    </>
  );
}

const useMarket = () => {
  const { state, update } = useStore();
  const m = state.market || { picked: [], custom: [] };
  const set = (fn) => update('market', (x) => fn(x || { picked: [], custom: [] }));
  return [m, set];
};

// 화면에 보일 이름 (지금 언어)
const label = (id, custom) => (ING[id] ? ingLabel(id) : EXTRA_BY[id] ? t(EXTRA_BY[id].name) : custom.find((c) => c.id === id)?.name || '');
const catName = catLabel;
// 사진 이름: 짧은 이름이 있으면 휴대폰에서는 짧은 이름만 한 줄로 (일본어·영어)
const Nm = ({ full, short }) => (short && short !== full ? <><span className="nm-full">{full}</span><span className="nm-short">{short}</span></> : full);

function Picker() {
  const { notify } = useStore();
  const [m, set] = useMarket();
  const [pickCat, setPickCat] = useState(''); // 왼쪽 재료 분류 (채소·육류…) — 빈 값이면 전체
  // 분류를 바꾸면 사진 칸을 맨 위부터 보여 줌
  const scrollRef = useRef(null);
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [pickCat]);
  const picked = new Set(m.picked);
  const toggle = (id) => set((x) => ({ ...x, picked: x.picked.includes(id) ? x.picked.filter((y) => y !== id) : [...x.picked, id] }));
  const names = m.picked.map((id) => label(id, m.custom)).filter(Boolean);
  const hidden = new Set(m.hidden || []);
  // 사진을 길게 누르면 삭제: 내가 추가한 재료는 지우고, 기본 재료는 목록에서 숨김(아래 '다시 보이기'로 되살림)
  const remove = (i, name) => {
    if (!window.confirm(t('‘{name}’ 사진을 지울까요?', { name }))) return;
    const mine = m.custom.some((c) => c.id === i.id);
    set((x) => ({
      ...x,
      picked: x.picked.filter((y) => y !== i.id),
      ...(mine ? { custom: x.custom.filter((c) => c.id !== i.id) } : { hidden: [...(x.hidden || []), i.id] }),
    }));
    notify(t('‘{name}’ 사진을 지웠어요', { name }));
  };

  return (
    <>
      {/* 왼쪽에 재료 분류(제자리 고정), 오른쪽에 그 분류의 재료 사진만 오르내림 */}
      <div className="kind-layout ing-layout">
        <nav className="kind-tabs" aria-label={t('재료 분류')}>
          <button type="button" className={`kind-tab ${pickCat === '' ? 'on' : ''}`} aria-pressed={pickCat === ''} onClick={() => setPickCat('')}>{t('전체')}</button>
          {PICK_CATS.map((c) => (
            <button key={c} type="button" className={`kind-tab ${pickCat === c ? 'on' : ''}`} aria-pressed={pickCat === c} onClick={() => setPickCat(pickCat === c ? '' : c)}>
              <span className="kind-emoji" aria-hidden>{CAT_EMOJI[c]}</span>{catName(c)}
            </button>
          ))}
        </nav>
        <div className="kind-body">
          <div className="kind-scroll" ref={scrollRef}>
      <div className="ing-board">
        {PICK_CATS.filter((c) => !pickCat || c === pickCat).map((cat) => {
          const items = [...PICK_ITEMS.filter((i) => i.cat === cat), ...PICK_EXTRA.filter((i) => i.cat === cat), ...m.custom.filter((c) => c.cat === cat)].filter((i) => !hidden.has(i.id));
          if (!items.length) return null;
          // 분류 이름은 왼쪽 단추에 있으므로 사진 칸에는 따로 적지 않음 (화면읽기 프로그램에는 aria-label로 알림)
          return (
            <section key={cat} className="ing-cat" aria-label={catName(cat)}>
              <ul className="ing-grid">
                {items.map((i) => {
                  const on = picked.has(i.id);
                  const name = ING[i.id] ? ingLabel(i.id) : EXTRA_BY[i.id] ? t(i.name) : i.name;
                  return (
                    <li key={i.id} className={`ing-tile ${on ? 'on' : ''}`} {...longPress(() => remove(i, name))}>
                      <label>
                        <input type="checkbox" className="ing-check" checked={on} onChange={() => toggle(i.id)} />
                        <span className="ing-ph">
                          {ING_PHOTOS[i.id] ? <img src={`./photos/ing/${i.id}.webp${ING_PHOTOS[i.id].v ? `?v=${ING_PHOTOS[i.id].v}` : ''}`} alt="" loading="lazy" decoding="async" /> : i.photo ? <img src={i.photo} alt="" /> : <span className="ing-emoji" aria-hidden>{CAT_EMOJI[cat]}</span>}
                        </span>
                        <span className="ing-name"><Nm full={name} short={ING[i.id] ? tShort(ING[i.id].name) : EXTRA_BY[i.id] ? tShort(i.name) : null} /></span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
          </div>
        </div>
      </div>

      {hidden.size > 0 && <p className="muted small long-help no-print"><button type="button" className="linklike" onClick={() => set((x) => ({ ...x, hidden: [] }))}>{t('지운 기본 재료 {n}가지 다시 보이기', { n: hidden.size })}</button></p>}

      {/* 넓은 화면에서만 보임 — 휴대폰에서는 위쪽 마이크·입력칸으로 찾음 */}
      <div className="pick-bar no-print hide-m" role="region" aria-label={t('고른 재료')}>
        <div className="pick-box">
          <div className="pick-sum">
            <b>{t('{n}개 선택', { n: names.length })}</b>
            <span className="pick-names">{names.length ? names.join(', ') : t('사진을 눌러 재료를 골라 주세요')}</span>
          </div>
          {names.length > 0 && <button className="btn small ghost" onClick={() => set((x) => ({ ...x, picked: [] }))}>{t('모두 해제')}</button>}
        </div>
        <button className="btn primary pick-go" disabled={!names.length} onClick={() => go('/shopping?step=result')}>{t('레시피 추천')}</button>
      </div>

      <AiBreakfast names={names} />

      <AddIngredient custom={m.custom}
        onRemove={(id) => set((x) => ({ ...x, custom: x.custom.filter((c) => c.id !== id), picked: x.picked.filter((y) => y !== id) }))}
        onAdd={(name, cat, photo, credit) => {
        const same = matchIngredient(name);
        if (same) {
          set((x) => ({ ...x, picked: x.picked.includes(same) ? x.picked : [...x.picked, same] }));
          notify(t('‘{name}’은(는) 이미 있어서 골라 두었어요', { name: ingLabel(same) }));
          return;
        }
        if (m.custom.some((c) => c.name === name)) { notify(t('‘{name}’은(는) 이미 추가했어요', { name })); return; }
        const id = `c_${Date.now().toString(36)}`;
        set((x) => ({ ...x, custom: [...x.custom, { id, name, cat, ...(photo ? { photo } : {}), ...(credit ? { credit } : {}) }], picked: [...x.picked, id] }));
        notify(t('‘{name}’ 재료를 추가하고 골라 두었어요', { name }));
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
      } catch (e) { reject(new Error(t('이 사진은 가져올 수 없어요'))); }
      done();
    };
    img.onerror = () => { done(); reject(new Error(t('사진을 읽지 못했어요'))); };
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
  if (!res.ok) throw new Error(t('인터넷 찾기에 실패했어요'));
  const d = await res.json();
  return Object.values(d.query?.pages || {})
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((p) => {
      const ii = p.imageinfo?.[0];
      const m = ii?.extmetadata || {};
      const license = strip(m.LicenseShortName?.value);
      return ii && FREE.test(license) ? { thumb: ii.thumburl, page: ii.descriptionurl, license, artist: strip(m.Artist?.value) || t('작성자 미상'), title: p.title } : null;
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
      <h2 id="ai-h">{t('인공지능 레시피추천')}</h2>
      <p className="muted small">{names.length ? t('고른 재료({names})로 아침에 가볍게 먹을 재료와 메뉴를 3~4가지씩, 구글 AI가 인터넷 정보를 찾아 추천해 드려요.', { names: names.join(', ') }) : t('재료를 고르지 않아도 아침에 가볍게 먹을 재료와 메뉴를 3~4가지씩, 구글 AI가 인터넷 정보를 찾아 추천해 드려요.')}</p>
      <button type="button" className="btn ai-btn" onClick={ask}>{t('인공지능 레시피추천')}</button>
    </section>
  );
}

export function AddIngredient({ onAdd, custom = [], onRemove, label = '장보기 재료 추가 입력', unit = '재료', placeholder = '예: 삼겹살, 연근', noCat = false, defaultName = '', defaultOpen = false }) {
  const { notify } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState(defaultName);
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
    if (!n) { notify(t('먼저 새 {unit} 이름을 적어 주세요', { unit: t(unit) })); return; }
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
    if (!n) { notify(t('새 {unit} 이름을 적어 주세요', { unit: t(unit) })); return; }
    onAdd(n, cat, photo, credit);
    setName(''); clear(); setFound(null);
  };
  const google = `https://www.google.com/search?udm=2&q=${encodeURIComponent(name.trim())}`;
  return (
    <div className="card ing-add no-print">
      <button type="button" className="btn soft ing-add-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{t(label)}{open ? <ChevronUp aria-hidden size={18} strokeWidth={1.75} /> : <ChevronDown aria-hidden size={18} strokeWidth={1.75} />}</button>
      {open && (
        <form className="ing-add-form" onSubmit={submit}>
          <div className="row wrap">
            <input aria-label={t('새 {unit} 이름', { unit: t(unit) })} placeholder={t(placeholder)} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus />
            {!noCat && (
              <select aria-label={t('분류')} value={cat} onChange={(e) => setCat(e.target.value)}>
                {PICK_CATS.map((c) => <option key={c} value={c}>{catName(c)}</option>)}
              </select>
            )}
          </div>
          {/* 왼쪽 사진 미리보기, 오른쪽에 위아래로 '사진 올리기'·'인터넷 찾기' */}
          <div className="ing-add-photo">
            <span className="ing-ph ing-add-prev">{photo ? <img src={photo} alt={t('{unit} 사진 미리보기', { unit: t(unit) })} /> : <span className="ing-emoji" aria-hidden>{noCat ? '🍽️' : CAT_EMOJI[cat]}</span>}</span>
            <div className="ing-add-btns">
              <label className="btn ghost small">
                <Camera aria-hidden size={18} strokeWidth={1.75} />{photo ? t('사진 바꾸기') : t('사진 올리기')}
                <input type="file" accept="image/*" className="sr-file" onChange={pick} />
              </label>
              <button type="button" className="btn ghost small" onClick={find} disabled={busy}><Search aria-hidden size={18} strokeWidth={1.75} />{busy ? t('찾는 중…') : t('인터넷 찾기')}</button>
              {photo && <button type="button" className="btn ghost small" onClick={clear}>{t('사진 빼기')}</button>}
            </div>
          </div>
          {credit && <p className="muted small">{t('사진:')} <a href={credit.page} target="_blank" rel="noopener noreferrer">{credit.artist}</a>, {credit.license} (Wikimedia Commons)</p>}
          {found && (
            <div className="web-photos">
              {found.length ? (
                <>
                  <p className="muted small">{t('‘{name}’ 자유 이용 사진이에요. 마음에 드는 사진을 누르세요.', { name: name.trim() })}</p>
                  <ul className="web-grid">
                    {found.map((r) => (
                      <li key={r.page}><button type="button" className="web-pick" onClick={() => choose(r)} disabled={busy} aria-label={t('{name} 고르기', { name: r.title })}><img src={r.thumb} alt="" loading="lazy" /></button></li>
                    ))}
                  </ul>
                </>
              ) : <p className="muted small">{t('자유 이용 사진을 찾지 못했어요. 다른 이름(예: 영어 이름)으로 찾아보시거나, 아래 구글 이미지에서 사진을 저장한 뒤 ‘사진 올리기’로 넣어 주세요.')}</p>}
              <div className="row wrap">
                <a className="btn ghost small" href={google} target="_blank" rel="noopener noreferrer">{t('구글 이미지에서 보기')}<ExternalLink aria-hidden size={16} strokeWidth={1.75} /></a>
                <button type="button" className="btn ghost small" onClick={() => setFound(null)}>{t('닫기')}</button>
              </div>
            </div>
          )}
          <button className="btn primary" type="submit">{t('추가')}</button>
          {custom.length > 0 && (
            <details className="ing-mine">
              <summary>{t('내가 추가한 {unit} {n}가지 관리', { unit: t(unit), n: custom.length })}</summary>
              <ul className="plain">
                {custom.map((c) => (
                  <li key={c.id} className="row between"><span>{c.name} {!noCat && <span className="muted small">({catName(c.cat)})</span>}</span>
                    <button type="button" className="btn small ghost" onClick={() => onRemove(c.id)}>{t('지우기')}</button></li>
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
    if (!window.confirm(t('‘{name}’ 사진을 지울까요?', { name }))) return;
    const mine = m.custom.some((c) => c.id === i.id);
    set((x) => ({
      ...x,
      picked: x.picked.filter((y) => y !== i.id),
      ...(mine ? { custom: x.custom.filter((c) => c.id !== i.id) } : { hidden: [...(x.hidden || []), i.id] }),
    }));
    notify(t('‘{name}’ 사진을 지웠어요', { name }));
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
    notify(t('‘{title}’에 더 필요한 재료 {n}가지를 장보기 목록에 담았어요', { title: t(x.recipe.title), n: x.need.length }));
  };

  if (!names.length) {
    return <div className="card center stack"><p>{t('아직 고른 재료가 없어요.')}</p><button className="btn primary" onClick={() => go('/shopping')}>{t('재료 고르러 가기')}</button></div>;
  }

  return (
    <>
      <section className="card hide-m">
        <h2>{t('찾은 메뉴 {n}개', { n: list.length })}</h2>
        {/* 이번에 고른 재료만 보임 (마이크로 다시 말하면 이 재료로 새로 찾음) */}
        <div className="chips">{names.map((n) => <span key={n} className="tag-have">{n}</span>)}</div>
      </section>

      {!list.length && !noRecipe.length && (
        <div className="card center stack">
          <p>{t('고른 재료로 만들 수 있는 레시피를 찾지 못했어요. 재료를 더 골라 보거나, 레시피 모음의 ‘나의 레시피 추가’로 메뉴를 만들어 보세요.')}</p>
          <button className="btn" onClick={() => go('/recipes')}>{t('레시피 모음 열기')}</button>
        </div>
      )}
      {noRecipe.length > 0 && (
        <section className="card stack">
          <h2>{t('아직 레시피가 없는 메뉴')}</h2>
          <p className="muted small">{t('레시피 모음에 없는 메뉴예요. 누르면 이름으로 1인분 레시피 초안을 만들어 드려요. 고쳐서 저장하면 다음부터 추천에 나와요.')}</p>
          <div className="row wrap">
            {noRecipe.map((n) => <button key={n} className="btn soft" onClick={() => go(`/recipes?make=${encodeURIComponent(n)}`)}>{t('‘{name}’ 레시피 만들기', { name: t(n) })}</button>)}
          </div>
        </section>
      )}
      {ready.length > 0 && <RecGroup title={t('바로 만들 수 있어요')} note={t('더 살 재료 없이 고른 재료와 기본 양념으로 만들어요.')} list={ready} />}
      {more.length > 0 && <RecGroup title={t('조금만 더 사면 돼요')} note={t('빠진 재료는 버튼 한 번으로 장보기 목록에 담을 수 있어요.')} list={more} onAdd={addNeed} />}
      <p className="muted small">{t('조리 시간이 짧고 쉬운 메뉴를 먼저 보여 줘요. 내 조건(알레르기·제외 재료 등)에 맞지 않는 메뉴는 뺐어요.')}</p>
    </>
  );
}

function RecGroup({ title, note, list, onAdd }) {
  return (
    <section className="stack rec-group">
      <div><h2>{title}</h2><p className="muted small">{note}</p></div>
      <RecipeGrid>
        {list.map((x) => (
          <RecipeGridItem key={x.recipe.id}>
            <RecipeCard recipe={x.recipe} time={x.time} note={t(DIFFICULTY_LABEL[x.recipe.difficulty] || '쉬움')}
              actions={<>
                {onAdd && <button className="btn small soft" onClick={() => onAdd(x)}><Plus aria-hidden size={16} strokeWidth={1.75} />{t('장보기 목록에 담기')}</button>}
                <MyTableButton id={x.recipe.id} small />
              </>}>
              <IngredientTags label={t('쓰는 재료')} items={x.used.map((u) => u.name)} />
              {x.need.length > 0 && <IngredientTags label={t('더 필요')} items={x.need.map((n) => n.name)} need />}
            </RecipeCard>
          </RecipeGridItem>
        ))}
      </RecipeGrid>
    </section>
  );
}
