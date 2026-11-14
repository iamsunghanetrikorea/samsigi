import { useRef, useState } from 'react';
import { useStore } from '../store';
import { today } from '../lib/date';
import { Modal, Seg } from '../components/ui';
import { EatOutModal, EATOUT_PRESETS } from '../components/meal';

// 비밀 API 키 없이 동작: OpenStreetMap(Overpass·Nominatim) 공개 API + 네이버/카카오 지도 검색 링크
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

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
  // 모바일은 브라우저 안에서 열리는 모바일 웹 주소 사용
  if (isNarrow()) return { naver: `https://m.map.naver.com/search2/search.naver?query=${q}`, kakao: `https://m.map.kakao.com/actions/searchView?q=${q}` };
  return { naver: `https://map.naver.com/p/search/${q}`, kakao: `https://map.kakao.com/?q=${q}` };
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
    <span className="row wrap">
      <a className="btn small ghost" href={l.naver} {...linkTarget()}>네이버지도</a>
      <a className="btn small ghost" href={l.kakao} {...linkTarget()}>카카오맵</a>
    </span>
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
  const [cat, setCat] = useState('전체');
  const [menuText, setMenuText] = useState('');
  const [customMenu, setCustomMenu] = useState('');
  const [askConsent, setAskConsent] = useState(null);
  const [eatOut, setEatOut] = useState(null);
  const [editing, setEditing] = useState(null);

  const placeRef = useRef(place);
  placeRef.current = place;
  const withConsent = (fn) => (state.consent.location ? fn() : setAskConsent(() => fn));

  const search = async (p, r = radius, label = placeRef.current) => {
    setStatus('주변 식당을 찾는 중…'); setResults(null);
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
      setStatus(list.length ? '' : '주변에 등록된 식당 정보가 없어요. 아래 지도 앱 검색을 이용해 주세요.');
    } catch {
      setStatus('식당 검색에 실패했어요(네트워크·서버 문제). 아래 지도 앱 검색 버튼을 이용해 주세요.');
    }
  };

  const locate = () => withConsent(() => {
    if (!navigator.geolocation) { setStatus('이 기기는 위치 기능을 지원하지 않아요. 동네 이름을 입력해 주세요.'); return; }
    setStatus('현재 위치를 확인하는 중…');
    navigator.geolocation.getCurrentPosition(
      (g) => { const p = { lat: g.coords.latitude, lng: g.coords.longitude }; setPos(p); setPlace('현재 위치'); search(p, radius, '현재 위치'); },
      () => setStatus('위치 권한이 거부되었거나 확인할 수 없어요. 아래에 주소나 동네 이름을 입력해 주세요.'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });

  const geocode = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    withConsent(async () => {
      setStatus('주소를 찾는 중…');
      try {
        const res = await fetch(`${NOMINATIM}?format=json&limit=1&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(address)}`);
        const [hit] = await res.json();
        if (!hit) { setStatus('주소를 찾지 못했어요. 지도 앱 검색 버튼을 이용해 보세요.'); return; }
        const p = { lat: Number(hit.lat), lng: Number(hit.lon) };
        setPos(p); setPlace(address); search(p, radius, address);
      } catch { setStatus('주소 검색에 실패했어요. 지도 앱 검색 버튼을 이용해 주세요.'); }
    });
  };

  const saveRest = (r) => {
    update('restaurants', (list) => (list.some((x) => x.id === r.id) ? list : [...list, { id: r.id, name: r.name, address: r.address, cat: r.cat, hours: r.hours || '', phone: r.phone || '', menu: '', price: '', solo: false, memo: '', coords: r.coords, sourceUrl: r.id.startsWith('osm-') ? `https://www.openstreetmap.org/${r.id.split('-')[1]}/${r.id.split('-')[2]}` : '', checkedAt: today() }]));
    notify(`'${r.name}'을(를) 저장했어요`);
  };

  const shown = (results || []).filter((r) => (cat === '전체' || r.cat === cat));
  const nearQuery = (c) => `${place && place !== '현재 위치' ? `${place} ` : '근처 '}${customMenu || (c === '전체' ? '백반' : c.split('·')[0])}`;
  const shownQuery = nearQuery(cat);

  return (
    <div className="stack">
      <h1>주변 식당</h1>
      <Seg label="보기" value={tab} onChange={setTab} options={[{ value: 'search', label: '찾기' }, { value: 'saved', label: `저장한 식당 ${state.restaurants.length}` }]} />

      {tab === 'search' && (
        <>
          <section className="card stack hide-narrow">
            <button className="btn primary big" onClick={locate}>📍 내 위치 주변 찾기</button>
            <form className="row wrap" onSubmit={geocode}>
              <input aria-label="주소 또는 동네" placeholder="또는 동네·주소 입력 (예: 마포구 공덕동)" value={address} onChange={(e) => setAddress(e.target.value)} />
              <button className="btn" type="submit">찾기</button>
            </form>
            <div className="row wrap">
              <span className="field-label">반경</span>
              <Seg label="반경" value={radius} onChange={(v) => { setRadius(v); if (pos) search(pos, v); }} options={[{ value: 500, label: '500m' }, { value: 1000, label: '1km' }, { value: 2000, label: '2km' }]} />
            </div>
            {status && <p className="muted" role="status">{status}</p>}
          </section>

          <section className="card">
            <h2>분류</h2>
            <div className="chips">
              {['전체', ...CATS.map((c) => c.key)].map((c) => <button key={c} className={`chip ${!customMenu && cat === c ? 'on' : ''}`} aria-pressed={!customMenu && cat === c} onClick={() => { setCat(c); setCustomMenu(''); setMenuText(''); }}>{c}</button>)}
              {customMenu && <button className="chip on" aria-pressed="true" onClick={() => { setCustomMenu(''); setMenuText(''); }}>{customMenu} ✕</button>}
            </div>
            <form className="row wrap" onSubmit={(e) => { e.preventDefault(); setCustomMenu(menuText.trim()); }}>
              <input aria-label="찾을 메뉴 직접 입력" placeholder="다른 메뉴 직접 입력 (예: 냉면, 삼계탕)" value={menuText} onChange={(e) => setMenuText(e.target.value)} />
              <button className="btn" type="submit" disabled={!menuText.trim()}>찾기</button>
            </form>
            <div className="stack">
              <p className="map-hint"><b>지도 앱에서 바로 찾기</b> <span className="muted">({shownQuery})</span></p>
              <MapLinks query={shownQuery} pos={pos} />
            </div>
          </section>

          {results && (
            <section className="stack">
              <p className="muted">{place} 반경 {fmtDist(radius)} · {shown.length}곳 (OpenStreetMap 자료, 실제와 다를 수 있음)</p>
              {shown.map((r) => (
                <article key={r.id} className="card rest">
                  <div className="row between"><h3>{r.name}</h3><span className="badge">{fmtDist(r.d)}</span></div>
                  <p className="meal-sub">{r.cat}{r.cuisine ? ` · ${r.cuisine}` : ''}{r.address ? ` · ${r.address}` : ''}</p>
                  {r.hours && <p className="small">영업: {r.hours}</p>}
                  {r.phone && <p className="small">전화: <a href={`tel:${r.phone}`}>{r.phone}</a></p>}
                  <MapLinks query={r.name} pos={r.coords} />
                  <div className="row wrap">
                    <button className="btn small" onClick={() => setEatOut({ date: today(), meal: new Date().getHours() < 15 ? 'lunch' : 'dinner', name: r.name, kcal: EATOUT_PRESETS.find((p) => p.cat === r.cat)?.kcal })}>외식 기록</button>
                    <button className="btn small ghost" onClick={() => saveRest(r)}>저장</button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {tab === 'saved' && <Saved onEatOut={setEatOut} onEdit={setEditing} />}

      <p className="muted small">식당 메뉴의 공식 영양정보는 대부분 제공되지 않아, 외식 열량은 분류별 추정값으로만 기록합니다. 영업정보는 방문 전 지도 앱에서 다시 확인해 주세요.</p>

      {askConsent && (
        <Modal title="위치 정보 사용 동의" onClose={() => setAskConsent(null)}>
          <p>주변 식당을 찾기 위해 현재 위치(좌표) 또는 입력한 주소가 <b>OpenStreetMap 공개 서버</b>로 전송됩니다.</p>
          <p className="muted">건강정보·프로필은 전송되지 않습니다. 동의하지 않아도 지도 앱 검색 버튼은 사용할 수 있어요.</p>
          <div className="row">
            <button className="btn primary" onClick={() => { update('consent', (c) => ({ ...c, location: true })); const fn = askConsent; setAskConsent(null); fn(); }}>동의하고 찾기</button>
            <button className="btn ghost" onClick={() => setAskConsent(null)}>취소</button>
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
          <label className="check"><input type="checkbox" checked={solo} onChange={(e) => setSolo(e.target.checked)} /> 혼밥 가능만</label>
          <label className="field inline"><span>예산 (원 이하)</span><input type="number" inputMode="numeric" step={1000} value={budget} onChange={(e) => setBudget(e.target.value)} style={{ maxWidth: '8em' }} /></label>
        </div>
        <div className="chips">
          {['전체', ...CATS.map((c) => c.key), '기타'].map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <button className="btn" onClick={() => onEdit({ id: `my-${Date.now()}`, name: '', address: '', cat: '백반·한식', menu: '', price: '', solo: true, hours: '', phone: '', memo: '', isNew: true })}>+ 단골 식당 직접 추가</button>
      </div>
      {!list.length && <p className="muted center">저장한 식당이 없어요.</p>}
      {list.map((r) => (
        <article key={r.id} className="card rest">
          <div className="row between"><h3>{r.name}</h3>{r.solo && <span className="badge">혼밥 가능</span>}</div>
          <p className="meal-sub">{r.cat}{r.address ? ` · ${r.address}` : ''}</p>
          {(r.menu || r.price) && <p className="small">대표 메뉴: {r.menu || '-'}{r.price ? ` · ${Number(r.price).toLocaleString()}원` : ''}</p>}
          {r.hours && <p className="small">영업: {r.hours}</p>}
          {r.memo && <p className="small muted">{r.memo}</p>}
          <MapLinks query={r.address ? `${r.name} ${r.address}` : r.name} pos={r.coords} />
          <div className="row wrap">
            <button className="btn small" onClick={() => onEatOut({ date: today(), meal: new Date().getHours() < 15 ? 'lunch' : 'dinner', name: r.menu ? `${r.name} ${r.menu}` : r.name, kcal: EATOUT_PRESETS.find((p) => p.cat === r.cat)?.kcal })}>외식 기록</button>
            <button className="btn small ghost" onClick={() => onEdit(r)}>고치기</button>
          </div>
          {r.checkedAt && <p className="muted small">확인일 {r.checkedAt}</p>}
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
    <Modal title={rest.isNew ? '식당 추가' : '식당 정보 고치기'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <label className="field"><span>식당 이름</span><input value={r.name} onChange={set('name')} required /></label>
        <label className="field"><span>주소</span><input value={r.address} onChange={set('address')} /></label>
        <label className="field"><span>분류</span><select value={r.cat} onChange={set('cat')}>{[...CATS.map((c) => c.key), '기타'].map((c) => <option key={c}>{c}</option>)}</select></label>
        <div className="grid2">
          <label className="field"><span>대표 메뉴</span><input value={r.menu} onChange={set('menu')} /></label>
          <label className="field"><span>가격 (원)</span><input type="number" inputMode="numeric" value={r.price} onChange={set('price')} /></label>
        </div>
        <label className="field"><span>영업시간</span><input value={r.hours} onChange={set('hours')} placeholder="예: 매일 11:00~20:00" /></label>
        <label className="field"><span>메모</span><input value={r.memo} onChange={set('memo')} /></label>
        <label className="check big"><input type="checkbox" checked={!!r.solo} onChange={set('solo')} /> 혼밥 가능</label>
        <div className="row">
          <button className="btn primary" type="submit">저장</button>
          {!rest.isNew && <button className="btn ghost" type="button" onClick={() => { update('restaurants', (list) => list.filter((x) => x.id !== r.id)); onClose(); }}>삭제</button>}
        </div>
      </form>
    </Modal>
  );
}
