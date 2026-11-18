import { useRef, useState } from 'react';
import { useStore } from '../store';
import { today } from '../lib/date';
import { Modal, Seg, longPress } from '../components/ui';
import { EatOutModal, EATOUT_PRESETS } from '../components/meal';
import { AddIngredient } from './Market';
import { t, getLang } from '../i18n';

// 비밀 API 키 없이 동작: OpenStreetMap(Overpass·Nominatim) 공개 API + 네이버/카카오 지도 검색 링크
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// 요리추천 사진 버튼: 짧은 이름과 사진(레시피 사진)
const CAT_PIC = {
  '백반·한식': ['백반·한식', 'doenjang_stew'], 생선구이: ['생선구이', 'mackerel_set'], 두부요리: ['두부요리', 'braised_tofu'],
  '채소 중심 한식': ['채소한식', 'veg_bibimbap'], 죽: ['죽', 'pumpkin_porridge'], '국밥·탕': ['국밥·탕', 'beef_radish_soup'], '면 요리': ['면 요리', 'clam_kalguksu'],
};

const CATS = [
  { key: '백반·한식', words: ['백반', '정식', '한식', '밥상', '기사식당', '집밥', '가정식'] },
  { key: '생선구이', words: ['생선', '고등어', '갈치', '조기', '굴비', '삼치', '꽁치', '가자미', '임연수'] },
  { key: '두부요리', words: ['두부', '순두부', '콩'] },
  { key: '채소 중심 한식', words: ['비빔', '나물', '보리밥', '쌈', '채식', '사찰', '산채', '청국장'] },
  { key: '죽', words: ['죽', '본죽'] },
  { key: '국밥·탕', words: ['국밥', '설렁탕', '곰탕', '해장', '추어탕', '갈비탕', '삼계탕'] },
  { key: '면 요리', words: ['국수', '칼국수', '냉면', '메밀', '우동'] },
];
function classify(tags) {
  const text = `${tags.name || ''} ${tags['name:ko'] || ''} ${tags.cuisine || ''}`;
  for (const c of CATS) if (c.words.some((w) => text.includes(w))) return c.key;
  if (/korean/.test(tags.cuisine || '')) return '백반·한식';
  return '기타';
}
function dist(a, b) {
  const R = 6371000; const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = (m) => (m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`);

const isNarrow = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 899px)').matches;

export const mapLinks = (query) => {
  const q = encodeURIComponent(query);
  return { naver: `https://map.naver.com/p/search/${q}`, kakao: `https://map.kakao.com/?q=${q}`, google: `https://www.google.com/maps/search/${q}` };
};

// 모바일에서는 지도 앱·사이트를 현재 창에서 열고, 넓은 화면에서는 새 창
export function linkTarget() {
  return isNarrow() ? { rel: 'noreferrer' } : { target: '_blank', rel: 'noopener noreferrer' };
}

// 지도에서 뒤로 돌아왔을 때 마지막 검색 결과 복원 (이 탭에서만 유지)
const LAST = 'samsigi:lastSearch';
const loadLast = () => { try { return JSON.parse(sessionStorage.getItem(LAST)) || {}; } catch { return {}; } };
const saveLast = (v) => { try { sessionStorage.setItem(LAST, JSON.stringify(v)); } catch { /* 저장 불가 */ } };

function MapLinks({ query, pos }) {
  const l = mapLinks(query, pos);
  return (
    <span className="row wrap map-links">
      <a className="btn small ghost full-narrow" href={l.naver} {...linkTarget()}>{t('네이버로 식당 찾기')}</a>
      <a className="btn small ghost full-narrow" href={l.kakao} {...linkTarget()}>{t('카카오로 식당 찾기')}</a>
      <a className="btn small ghost full-narrow" href={l.google} {...linkTarget()}>{t('구글로 식당 찾기')}</a>
    </span>
  );
}

// 말로 입력 (Web Speech API — 크롬·사파리 등 지원 브라우저에서만)
const Speech = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const SPEECH_LANG = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };

// '찾을 메뉴' 입력칸(네이버 버튼 오른쪽): 고른 사진 메뉴가 들어오고, 직접 쓰거나 마이크로 말해서 바꿈 → 네이버·카카오·구글 버튼이 이 메뉴로 검색
function MenuInput({ value, onChange }) {
  const { notify } = useStore();
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const mic = () => {
    if (!Speech) { notify(t('이 기기·브라우저는 음성 입력을 지원하지 않아요')); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Speech();
    rec.lang = SPEECH_LANG[getLang()] || 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => { const said = e.results[0]?.[0]?.transcript?.trim().replace(/[.。!?]$/, ''); if (said) onChange(said); };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') notify(t('마이크 사용을 허용해 주세요')); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  return (
    <form className="menu-input" onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('input')?.blur(); }}>
      <span className="menu-input-box">
        <input aria-label={t('찾을 메뉴')} placeholder={listening ? t('듣는 중…') : t('찾을 메뉴')} value={value} onChange={(e) => onChange(e.target.value)} maxLength={30} />
        <button type="button" className={`mic-btn ${listening ? 'on' : ''}`} onClick={mic} aria-pressed={listening} aria-label={listening ? t('음성 입력 멈추기') : t('말로 입력하기')}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" /></svg>
        </button>
      </span>
    </form>
  );
}

export default function Restaurants() {
  const { state, update, notify } = useStore();
  const [tab, setTab] = useState('search');
  const [last] = useState(loadLast);
  const [pos, setPos] = useState(last.pos || null);
  const [place, setPlace] = useState(last.place || '');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(last.results || null);
  const [radius, setRadius] = useState(last.radius || 1000);
  const [cat, setCat] = useState('');
  const [customMenu, setCustomMenu] = useState('');
  const [menuText, setMenuText] = useState('');
  // 나의 메뉴(사진 버튼). 예전에 '검색추가'로 넣은 글자 메뉴도 그대로 가져옴
  const myMenus = state.restMenus || (state.settings.customMenus || []).map((m) => ({ id: `m_${m}`, name: m }));
  const hiddenPics = state.restHidden || [];
  const setMyMenus = (fn) => update('restMenus', (l) => fn(l || myMenus));
  const removePic = (id, name, mine) => {
    if (!window.confirm(t('‘{name}’ 사진을 지울까요?', { name }))) return;
    if (mine) { setMyMenus((l) => l.filter((x) => x.id !== id)); if (customMenu === name) setCustomMenu(''); }
    else { update('restHidden', (l) => [...(l || []), id]); if (cat === id) setCat(''); }
    notify(t('‘{name}’ 사진을 지웠어요', { name }));
  };
  const [askConsent, setAskConsent] = useState(null);
  const [eatOut, setEatOut] = useState(null);
  const [editing, setEditing] = useState(null);

  const placeRef = useRef(place);
  placeRef.current = place;
  const withConsent = (fn) => (state.consent.location ? fn() : setAskConsent(() => fn));

  const search = async (p, r = radius, label = placeRef.current) => {
    setStatus(t('주변 식당을 찾는 중…')); setResults(null);
    const q = `[out:json][timeout:20];(nwr["amenity"~"^(restaurant|fast_food|food_court)$"](around:${r},${p.lat},${p.lng}););out center tags 150;`;
    try {
      const res = await fetch(OVERPASS, { method: 'POST', body: `data=${encodeURIComponent(q)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      const list = json.elements.map((e) => {
        const c = e.center || { lat: e.lat, lon: e.lon };
        const tags = e.tags || {};
        const addr = [tags['addr:city'], tags['addr:district'], tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || tags['addr:full'] || '';
        return { id: `osm-${e.type}-${e.id}`, name: tags['name:ko'] || tags.name, cuisine: tags.cuisine, hours: tags.opening_hours, phone: tags.phone || tags['contact:phone'], address: addr, cat: classify(tags), coords: { lat: c.lat, lng: c.lon }, d: dist(p, { lat: c.lat, lng: c.lon }) };
      }).filter((x) => x.name).sort((a, b) => a.d - b.d);
      setResults(list);
      saveLast({ pos: p, place: label, results: list, radius: r });
      setStatus(list.length ? '' : t('주변에 등록된 식당 정보가 없어요. 아래 지도 앱 검색을 이용해 주세요.'));
    } catch {
      setStatus(t('식당 검색에 실패했어요(네트워크·서버 문제). 아래 지도 앱 검색 버튼을 이용해 주세요.'));
    }
  };

  const locate = () => withConsent(() => {
    if (!navigator.geolocation) { setStatus(t('이 기기는 위치 기능을 지원하지 않아요. 동네 이름을 입력해 주세요.')); return; }
    setStatus(t('현재 위치를 확인하는 중…'));
    navigator.geolocation.getCurrentPosition(
      (g) => { const p = { lat: g.coords.latitude, lng: g.coords.longitude }; setPos(p); setPlace('현재 위치'); search(p, radius, '현재 위치'); },
      () => setStatus(t('위치 권한이 거부되었거나 확인할 수 없어요. 아래에 주소나 동네 이름을 입력해 주세요.')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });

  const geocode = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    withConsent(async () => {
      setStatus(t('주소를 찾는 중…'));
      try {
        const res = await fetch(`${NOMINATIM}?format=json&limit=1&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(address)}`);
        const [hit] = await res.json();
        if (!hit) { setStatus(t('주소를 찾지 못했어요. 지도 앱 검색 버튼을 이용해 보세요.')); return; }
        const p = { lat: Number(hit.lat), lng: Number(hit.lon) };
        setPos(p); setPlace(address); search(p, radius, address);
      } catch { setStatus(t('주소 검색에 실패했어요. 지도 앱 검색 버튼을 이용해 주세요.')); }
    });
  };

  const saveRest = (r) => {
    update('restaurants', (list) => (list.some((x) => x.id === r.id) ? list : [...list, { id: r.id, name: r.name, address: r.address, cat: r.cat, hours: r.hours || '', phone: r.phone || '', menu: '', price: '', solo: false, memo: '', coords: r.coords, sourceUrl: r.id.startsWith('osm-') ? `https://www.openstreetmap.org/${r.id.split('-')[1]}/${r.id.split('-')[2]}` : '', checkedAt: today() }]));
    notify(t("'{name}'을(를) 저장했어요", { name: r.name }));
  };

  const shown = (results || []).filter((r) => (!cat || r.cat === cat));
  const nearQuery = (c) => `${place && place !== '현재 위치' ? `${place} ` : '근처 '}${menuText.trim() || customMenu || (!c ? '백반' : c.split('·')[0])}`;
  const shownQuery = nearQuery(cat);

  return (
    <div className="stack">
      <h1>{t('주변식당 검색')}</h1>
      <div className="hide-narrow"><Seg label={t('보기')} value={tab} onChange={setTab} options={[{ value: 'search', label: t('찾기') }, { value: 'saved', label: t('저장한 식당 {n}', { n: state.restaurants.length }) }]} /></div>

      {tab === 'search' && (
        <>
          <section className="card stack hide-narrow">
            <button className="btn primary big" onClick={locate}>📍 {t('내 위치 주변 찾기')}</button>
            <form className="row wrap" onSubmit={geocode}>
              <input aria-label={t('주소 또는 동네')} placeholder={t('또는 동네·주소 입력 (예: 마포구 공덕동)')} value={address} onChange={(e) => setAddress(e.target.value)} />
              <button className="btn" type="submit">{t('찾기')}</button>
            </form>
            <div className="row wrap">
              <span className="field-label">{t('반경')}</span>
              <Seg label={t('반경')} value={radius} onChange={(v) => { setRadius(v); if (pos) search(pos, v); }} options={[{ value: 500, label: '500m' }, { value: 1000, label: '1km' }, { value: 2000, label: '2km' }]} />
            </div>
            {status && <p className="muted" role="status">{status}</p>}
          </section>

          <section className="card find-card">
            <div className="chips find-chips" role="group" aria-label={t('요리 종류')}>
              {CATS.map((c) => c.key).filter((c) => !hiddenPics.includes(c)).map((c) => {
                const on = !customMenu && cat === c;
                return (
                  <button key={c} className={`find-pic ${on ? 'on' : ''}`} aria-pressed={on} aria-label={t(c)} onClick={() => { setCat(on ? '' : c); setCustomMenu(''); setMenuText(on ? '' : t(CAT_PIC[c][0])); }} {...longPress(() => removePic(c, t(CAT_PIC[c][0]), false))}>
                    <img src={`./photos/${CAT_PIC[c][1]}.webp`} alt="" loading="lazy" decoding="async" />
                    <span>{t(CAT_PIC[c][0])}</span>
                  </button>
                );
              })}
              {myMenus.map((x) => {
                const on = customMenu === x.name;
                return (
                  <button key={x.id} className={`find-pic ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => { setCustomMenu(on ? '' : x.name); setCat(''); setMenuText(on ? '' : x.name); }} {...longPress(() => removePic(x.id, x.name, true))}>
                    {x.photo ? <img src={x.photo} alt="" /> : <span className="find-emoji" aria-hidden>🍽️</span>}
                    <span>{x.name}</span>
                  </button>
                );
              })}
            </div>
            <AddIngredient label="검색요리 입력" unit="요리" placeholder="예: 냉면, 삼계탕" noCat custom={myMenus}
              onRemove={(id) => { const x = myMenus.find((m) => m.id === id); setMyMenus((l) => l.filter((m) => m.id !== id)); if (x && customMenu === x.name) setCustomMenu(''); }}
              onAdd={(name, _c, photo, credit) => {
                if (myMenus.some((x) => x.name === name)) { setCustomMenu(name); setCat(''); setMenuText(name); notify(t('‘{name}’은(는) 이미 있어요', { name })); return; }
                setMyMenus((l) => [...l, { id: `m_${Date.now().toString(36)}`, name, ...(photo ? { photo } : {}), ...(credit ? { credit } : {}) }]);
                setCustomMenu(name); setCat(''); setMenuText(name);
                notify(t('‘{name}’ 요리를 추가했어요', { name }));
              }} />
            <div className="find-tools">
              <MapLinks query={shownQuery} pos={pos} />
              <MenuInput value={menuText} onChange={setMenuText} />
            </div>
          </section>

          {results && (
            <section className="stack">
              <p className="muted">{t('{place} 반경 {dist} · {n}곳 (OpenStreetMap 자료, 실제와 다를 수 있음)', { place: t(place), dist: fmtDist(radius), n: shown.length })}</p>
              {shown.map((r) => (
                <article key={r.id} className="card rest">
                  <div className="row between"><h3>{r.name}</h3><span className="badge">{fmtDist(r.d)}</span></div>
                  <p className="meal-sub">{t(r.cat)}{r.cuisine ? ` · ${r.cuisine}` : ''}{r.address ? ` · ${r.address}` : ''}</p>
                  {r.hours && <p className="small">{t('영업:')} {r.hours}</p>}
                  {r.phone && <p className="small">{t('전화:')} <a href={`tel:${r.phone}`}>{r.phone}</a></p>}
                  <MapLinks query={r.name} pos={r.coords} />
                  <div className="row wrap">
                    <button className="btn small" onClick={() => setEatOut({ date: today(), meal: new Date().getHours() < 15 ? 'lunch' : 'dinner', name: r.name, kcal: EATOUT_PRESETS.find((p) => p.cat === r.cat)?.kcal })}>{t('외식 기록')}</button>
                    <button className="btn small ghost" onClick={() => saveRest(r)}>{t('저장')}</button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {tab === 'saved' && <Saved onEatOut={setEatOut} onEdit={setEditing} />}

      {askConsent && (
        <Modal title={t('위치 정보 사용 동의')} onClose={() => setAskConsent(null)}>
          <p>{t('주변 식당을 찾기 위해 현재 위치(좌표) 또는 입력한 주소가 OpenStreetMap 공개 서버로 전송됩니다.')}</p>
          <p className="muted">{t('건강정보·프로필은 전송되지 않습니다. 동의하지 않아도 지도 앱 검색 버튼은 사용할 수 있어요.')}</p>
          <div className="row">
            <button className="btn primary" onClick={() => { update('consent', (c) => ({ ...c, location: true })); const fn = askConsent; setAskConsent(null); fn(); }}>{t('동의하고 찾기')}</button>
            <button className="btn ghost" onClick={() => setAskConsent(null)}>{t('취소')}</button>
          </div>
        </Modal>
      )}
      {eatOut && <EatOutModal initial={eatOut} onClose={() => setEatOut(null)} />}
      {editing && <EditRest rest={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Saved({ onEatOut, onEdit }) {
  const { state } = useStore();
  const [solo, setSolo] = useState(false);
  const [budget, setBudget] = useState('');
  const [cat, setCat] = useState('전체');
  const list = state.restaurants.filter((r) => (!solo || r.solo) && (!budget || !r.price || Number(r.price) <= Number(budget)) && (cat === '전체' || r.cat === cat));
  return (
    <section className="stack">
      <div className="card stack">
        <div className="row wrap">
          <label className="check"><input type="checkbox" checked={solo} onChange={(e) => setSolo(e.target.checked)} /> {t('혼밥 가능만')}</label>
          <label className="field inline"><span>{t('예산 (원 이하)')}</span><input type="number" inputMode="numeric" step={1000} value={budget} onChange={(e) => setBudget(e.target.value)} style={{ maxWidth: '8em' }} /></label>
        </div>
        <div className="chips">
          {['전체', ...CATS.map((c) => c.key), '기타'].map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{t(c)}</button>)}
        </div>
        <button className="btn" onClick={() => onEdit({ id: `my-${Date.now()}`, name: '', address: '', cat: '백반·한식', menu: '', price: '', solo: true, hours: '', phone: '', memo: '', isNew: true })}>+ {t('단골 식당 직접 추가')}</button>
      </div>
      {!list.length && <p className="muted center">{t('저장한 식당이 없어요.')}</p>}
      {list.map((r) => (
        <article key={r.id} className="card rest">
          <div className="row between"><h3>{r.name}</h3>{r.solo && <span className="badge">{t('혼밥 가능')}</span>}</div>
          <p className="meal-sub">{t(r.cat)}{r.address ? ` · ${r.address}` : ''}</p>
          {(r.menu || r.price) && <p className="small">{t('대표 메뉴:')} {r.menu || '-'}{r.price ? ` · ${t('{n}원', { n: Number(r.price).toLocaleString() })}` : ''}</p>}
          {r.hours && <p className="small">{t('영업:')} {r.hours}</p>}
          {r.memo && <p className="small muted">{r.memo}</p>}
          <MapLinks query={r.address ? `${r.name} ${r.address}` : r.name} pos={r.coords} />
          <div className="row wrap">
            <button className="btn small" onClick={() => onEatOut({ date: today(), meal: new Date().getHours() < 15 ? 'lunch' : 'dinner', name: r.menu ? `${r.name} ${r.menu}` : r.name, kcal: EATOUT_PRESETS.find((p) => p.cat === r.cat)?.kcal })}>{t('외식 기록')}</button>
            <button className="btn small ghost" onClick={() => onEdit(r)}>{t('고치기')}</button>
          </div>
          {r.checkedAt && <p className="muted small">{t('확인일')} {r.checkedAt}</p>}
        </article>
      ))}
    </section>
  );
}

function EditRest({ rest, onClose }) {
  const { update } = useStore();
  const [r, setR] = useState(rest);
  const set = (k) => (e) => setR({ ...r, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = (e) => {
    e.preventDefault();
    if (!r.name.trim()) return;
    const { isNew, ...clean } = { ...r, checkedAt: today() };
    update('restaurants', (list) => (list.some((x) => x.id === r.id) ? list.map((x) => (x.id === r.id ? clean : x)) : [...list, clean]));
    onClose();
  };
  return (
    <Modal title={rest.isNew ? t('식당 추가') : t('식당 정보 고치기')} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <label className="field"><span>{t('식당 이름')}</span><input value={r.name} onChange={set('name')} required /></label>
        <label className="field"><span>{t('주소')}</span><input value={r.address} onChange={set('address')} /></label>
        <label className="field"><span>{t('분류')}</span><select value={r.cat} onChange={set('cat')}>{[...CATS.map((c) => c.key), '기타'].map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <div className="grid2">
          <label className="field"><span>{t('대표 메뉴')}</span><input value={r.menu} onChange={set('menu')} /></label>
          <label className="field"><span>{t('가격 (원)')}</span><input type="number" inputMode="numeric" value={r.price} onChange={set('price')} /></label>
        </div>
        <label className="field"><span>{t('영업시간')}</span><input value={r.hours} onChange={set('hours')} placeholder={t('예: 매일 11:00~20:00')} /></label>
        <label className="field"><span>{t('메모')}</span><input value={r.memo} onChange={set('memo')} /></label>
        <label className="check big"><input type="checkbox" checked={!!r.solo} onChange={set('solo')} /> {t('혼밥 가능')}</label>
        <div className="row">
          <button className="btn primary" type="submit">{t('저장')}</button>
          {!rest.isNew && <button className="btn ghost" type="button" onClick={() => { update('restaurants', (list) => list.filter((x) => x.id !== r.id)); onClose(); }}>{t('삭제')}</button>}
        </div>
      </form>
    </Modal>
  );
}
