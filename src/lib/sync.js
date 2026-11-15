// 직접 만든 레시피를 동기화 코드로 여러 기기에서 맞춤 (Cloudflare Worker: sync-worker/)
// 보내는 것은 '내가 추가한 메뉴'뿐이며 프로필·건강 정보·식단은 보내지 않는다.
import { ING } from '../data/ingredients';
import { CATEGORIES, MEAL_LABEL } from '../data/recipes';

export const SYNC_URL = import.meta.env.VITE_SYNC_URL || 'https://samsigi-sync.iamsunghan.workers.dev';

async function call(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${SYNC_URL}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  } catch {
    throw new Error('인터넷에 연결되지 않았어요');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || '동기화 서버 오류'), { status: res.status });
  return body;
}

export const normCode = (raw) => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const fmtCode = (code) => (code ? `${code.slice(0, 5)}-${code.slice(5)}` : '');

export const createCode = () => call('/v1/codes', { method: 'POST' }).then((b) => b.code);
export const fetchDoc = (code) => call(`/v1/sync/${normCode(code)}`);
export const pushDoc = (code, doc) => call(`/v1/sync/${normCode(code)}`, { method: 'PUT', body: JSON.stringify(doc) });

// 레시피·삭제 기록을 id별로 모아 더 최근 것만 남김 (같은 시각이면 삭제 우선) — 서버와 같은 규칙
export function mergeDocs(a, b) {
  const best = new Map();
  const put = (id, at, del, r) => {
    const cur = best.get(id);
    if (!cur || at > cur.at || (at === cur.at && del && !cur.del)) best.set(id, { del, at, r });
  };
  for (const d of [a, b]) {
    for (const r of d.recipes || []) put(r.id, r.updatedAt || 0, false, r);
    for (const t of d.deleted || []) put(t.id, t.updatedAt || 0, true);
  }
  const recipes = [];
  const deleted = [];
  for (const [id, v] of best) (v.del ? deleted.push({ id, updatedAt: v.at }) : recipes.push(v.r));
  recipes.sort((x, y) => (x.updatedAt || 0) - (y.updatedAt || 0));
  return { recipes, deleted };
}

// 두 묶음이 같은 내용인지 (id·시각 기준)
export function sameDoc(a, b) {
  const sig = (d) => [...(d.recipes || []).map((r) => `r${r.id}@${r.updatedAt}`), ...(d.deleted || []).map((t) => `d${t.id}@${t.updatedAt}`)].sort().join('|');
  return sig(a) === sig(b);
}

// 서버에서 받은 레시피가 앱을 망가뜨리지 않도록 형식을 확인하고 정리
export function sanitizeRecipe(r) {
  if (!r || typeof r !== 'object' || !/^my_[a-z0-9_]{1,40}$/.test(r.id) || typeof r.title !== 'string') return null;
  const items = (Array.isArray(r.items) ? r.items : [])
    .filter((it) => Array.isArray(it) && ING[it[0]] && Number.isFinite(Number(it[1])) && Number(it[1]) >= 0)
    .map(([id, g]) => [id, Number(g)]);
  const steps = (Array.isArray(r.steps) ? r.steps : [])
    .filter((s) => Array.isArray(s) && typeof s[0] === 'string' && s[0].trim())
    .map(([t, m]) => (Number.isFinite(Number(m)) && Number(m) > 0 ? [t.slice(0, 500), Number(m)] : [t.slice(0, 500)]));
  const meals = (Array.isArray(r.meals) ? r.meals : []).filter((m) => MEAL_LABEL[m]);
  if (!items.length || !steps.length || !meals.length) return null;
  const num = (v, d) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : d);
  return {
    id: r.id,
    title: r.title.replace(/(과|와) (잡곡밥|쌀밥)$/, '').slice(0, 100),
    category: CATEGORIES.includes(r.category) ? r.category : '한식',
    emoji: typeof r.emoji === 'string' ? r.emoji.slice(0, 8) : '🍽️',
    meals,
    main: typeof r.main === 'string' ? r.main.slice(0, 60) : r.id,
    prep: num(r.prep, 10), cook: num(r.cook, 10),
    difficulty: [1, 2, 3].includes(r.difficulty) ? r.difficulty : 1,
    soft: !!r.soft,
    tags: (Array.isArray(r.tags) ? r.tags : []).filter((t) => typeof t === 'string').slice(0, 10),
    subs: {},
    items, steps,
    tip: typeof r.tip === 'string' ? r.tip.slice(0, 500) : undefined,
    source: typeof r.source === 'string' ? r.source.slice(0, 200) : '내가 추가한 메뉴',
    isCustom: true,
    updatedAt: num(r.updatedAt, 0),
  };
}
