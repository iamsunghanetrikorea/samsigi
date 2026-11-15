import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getItem, setItem, clearAll } from './lib/storage';
import { computeTargets, DEFAULT_PROFILE } from './lib/nutrition';
import { generatePlans } from './lib/planner';
import { syncPack, syncCustom, nextUpdate } from './data/recipePack';
import { fetchDoc, pushDoc, mergeDocs, sameDoc, sanitizeRecipe } from './lib/sync';

export const DEFAULT_STATE = {
  profile: null,
  plans: {},            // { 'YYYY-MM-DD': { breakfast: {recipeId, servings, locked, eaten, subs, eatOut}, ... } }
  pantry: {},           // { ingredientId: 보유 g }
  shopping: { checked: {}, extras: [], prices: {}, split: true },
  restaurants: [],      // 저장한 식당
  snacks: {},           // { date: [{name, kcal}] }
  settings: { fontSize: 20, contrast: false },
  consent: { location: false },
  addedRecipes: [],     // 업데이트로 추가한 추천 메뉴 id
  customRecipes: [],    // 사용자가 메뉴 이름을 입력해 만든 레시피
  myTable: [],          // 나의 밥상에 올린 레시피 id
  sync: { code: null, deleted: [], dirty: false, lastSync: null, error: null }, // 레시피 동기화(코드·삭제 기록)
};
const KEYS = Object.keys(DEFAULT_STATE);

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const [toast, setToast] = useState(null);
  const saved = useRef(null);

  useEffect(() => {
    (async () => {
      const s = { ...DEFAULT_STATE };
      for (const k of KEYS) {
        const v = await getItem(k);
        if (v !== undefined) s[k] = v;
      }
      if (s.profile) s.profile = { ...DEFAULT_PROFILE, ...s.profile };
      s.sync = { ...DEFAULT_STATE.sync, ...s.sync };
      // 예전에 만든 내 메뉴 이름에서 '…와 잡곡밥'·'…과 쌀밥' 떼기
      s.customRecipes = s.customRecipes.map((r) => (/(과|와) (잡곡밥|쌀밥)$/.test(r.title) ? { ...r, title: r.title.replace(/(과|와) (잡곡밥|쌀밥)$/, '') } : r));
      syncPack(s.addedRecipes);
      syncCustom(s.customRecipes);
      saved.current = s;
      setState(s);
    })();
  }, []);

  // 변경된 항목만 기기에 저장
  useEffect(() => {
    if (!state) return;
    for (const k of KEYS) if (saved.current?.[k] !== state[k]) setItem(k, state[k]);
    saved.current = state;
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const root = document.documentElement;
    root.style.fontSize = `${state.settings.fontSize || 20}px`;
    root.dataset.contrast = state.settings.contrast ? 'high' : 'normal';
  }, [state?.settings]);

  const update = useCallback((key, fn) => {
    setState((s) => ({ ...s, [key]: typeof fn === 'function' ? fn(s[key]) : fn }));
  }, []);

  const targets = useMemo(() => (state?.profile ? computeTargets(state.profile) : null), [state?.profile]);

  const notify = useCallback((msg) => {
    setToast({ msg, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const setEntry = useCallback((date, meal, fn) => {
    setState((s) => {
      const day = { ...(s.plans[date] || {}) };
      const next = typeof fn === 'function' ? fn(day[meal]) : fn;
      if (next) day[meal] = next; else delete day[meal];
      return { ...s, plans: { ...s.plans, [date]: day } };
    });
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;
  const generate = useCallback((dates, opts) => {
    const s = stateRef.current;
    const result = generatePlans(s, computeTargets(s.profile), dates, opts);
    const next = { ...s, plans: result.plans };
    stateRef.current = next;
    setState(next);
    return result;
  }, []);

  const saveProfileAndGenerate = useCallback((profile, dates) => {
    const s = { ...stateRef.current, profile };
    const result = generatePlans(s, computeTargets(profile), dates, { overwrite: false });
    const next = { ...s, plans: result.plans };
    stateRef.current = next;
    setState(next);
    return result;
  }, []);

  // 레시피 업데이트: 분류마다 새 메뉴 하나씩 추가
  const addRecipeUpdate = useCallback(() => {
    const s = stateRef.current;
    const ids = nextUpdate(s.addedRecipes);
    if (!ids.length) return [];
    const added = [...s.addedRecipes, ...ids];
    syncPack(added);
    const next = { ...s, addedRecipes: added };
    stateRef.current = next;
    setState(next);
    return ids;
  }, []);

  // 직접 입력한 메뉴 추가·수정·삭제 (삭제하면 그 메뉴가 들어간 식단 칸도 비움)
  const saveCustomRecipe = useCallback((input) => {
    const s = stateRef.current;
    const recipe = { ...input, updatedAt: Date.now() };
    const list = s.customRecipes.some((r) => r.id === recipe.id) ? s.customRecipes.map((r) => (r.id === recipe.id ? recipe : r)) : [...s.customRecipes, recipe];
    syncCustom(list);
    const next = { ...s, customRecipes: list, sync: { ...s.sync, dirty: !!s.sync.code } };
    stateRef.current = next;
    setState(next);
  }, []);
  const removeCustomRecipe = useCallback((id) => {
    const s = stateRef.current;
    const list = s.customRecipes.filter((r) => r.id !== id);
    syncCustom(list);
    const deleted = [...s.sync.deleted.filter((t) => t.id !== id), { id, updatedAt: Date.now() }];
    const next = { ...s, customRecipes: list, plans: dropPlans(s.plans, new Set([id])), sync: { ...s.sync, deleted, dirty: !!s.sync.code } };
    stateRef.current = next;
    setState(next);
  }, []);

  // 레시피 동기화: 바뀐 게 있으면 보내고(PUT), 아니면 받아서(GET) 이 기기 것과 합친다
  const syncing = useRef(false);
  const runSync = useCallback(async () => {
    const s = stateRef.current;
    if (!s?.sync.code || syncing.current) return;
    syncing.current = true;
    const { code } = s.sync;
    try {
      const local = { recipes: s.customRecipes, deleted: s.sync.deleted };
      const remote = s.sync.dirty ? await pushDoc(code, local) : await fetchDoc(code);
      const cur = stateRef.current;
      if (cur.sync.code !== code) return; // 그사이 연결을 끊었거나 바꿈
      const merged = mergeDocs({ recipes: cur.customRecipes, deleted: cur.sync.deleted }, remote);
      const recipes = merged.recipes.map(sanitizeRecipe).filter(Boolean);
      const gone = new Set(cur.customRecipes.map((r) => r.id).filter((id) => !recipes.some((r) => r.id === id)));
      const unchanged = sameDoc({ recipes: cur.customRecipes, deleted: cur.sync.deleted }, { recipes, deleted: merged.deleted });
      if (!unchanged) syncCustom(recipes);
      const next = {
        ...cur,
        customRecipes: unchanged ? cur.customRecipes : recipes,
        plans: gone.size ? dropPlans(cur.plans, gone) : cur.plans,
        sync: { ...cur.sync, deleted: merged.deleted, dirty: !sameDoc(merged, remote), lastSync: Date.now(), error: null },
      };
      stateRef.current = next;
      setState(next);
      if (next.sync.dirty) setTimeout(() => runSyncRef.current(), 1500); // 그사이 바뀐 것 마저 보내기
    } catch (e) {
      const cur = stateRef.current;
      const next = { ...cur, sync: { ...cur.sync, error: e.status === 404 ? '서버에 없는 동기화 코드예요. 연결을 끊고 다시 연결해 주세요.' : e.message } };
      stateRef.current = next;
      setState(next);
    } finally {
      syncing.current = false;
    }
  }, []);
  const runSyncRef = useRef(runSync);
  runSyncRef.current = runSync;

  // 동기화 연결·해제. 연결하면 이 기기 레시피와 서버 레시피를 합침
  const connectSync = useCallback(async (code) => {
    const s = stateRef.current;
    const next = { ...s, sync: { ...s.sync, code, dirty: true, error: null } };
    stateRef.current = next;
    setState(next);
    await runSync();
    return stateRef.current.sync.error;
  }, [runSync]);
  const disconnectSync = useCallback(() => {
    const s = stateRef.current;
    const next = { ...s, sync: { ...DEFAULT_STATE.sync, deleted: s.sync.deleted } };
    stateRef.current = next;
    setState(next);
  }, []);

  // 자동 동기화: 바뀐 뒤 잠시 후, 앱을 열 때·다시 볼 때, 보고 있는 동안 1분마다
  useEffect(() => {
    if (!state?.sync.code || !state.sync.dirty) return;
    const t = setTimeout(runSync, 1200);
    return () => clearTimeout(t);
  }, [state?.sync.code, state?.sync.dirty, state?.customRecipes, runSync]);
  useEffect(() => {
    if (!state?.sync.code) return;
    runSync();
    const onVisible = () => { if (document.visibilityState === 'visible') runSync(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', runSync);
    const iv = setInterval(() => { if (document.visibilityState === 'visible') runSync(); }, 60000);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', runSync); clearInterval(iv); };
  }, [state?.sync.code, runSync]);

  const resetAll = useCallback(async () => {
    syncPack([]);
    syncCustom([]);
    await clearAll();
    saved.current = DEFAULT_STATE;
    setState({ ...DEFAULT_STATE });
  }, []);

  const replaceAll = useCallback((data) => {
    const s = { ...DEFAULT_STATE };
    for (const k of KEYS) if (data[k] !== undefined) s[k] = data[k];
    if (s.profile) s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    s.sync = { ...DEFAULT_STATE.sync, ...s.sync };
    syncPack(s.addedRecipes);
    syncCustom(s.customRecipes);
    setState(s);
  }, []);

  const value = useMemo(() => state && ({ state, update, targets, setEntry, generate, saveProfileAndGenerate, addRecipeUpdate, saveCustomRecipe, removeCustomRecipe, runSync, connectSync, disconnectSync, notify, toast, resetAll, replaceAll }),
    [state, update, targets, setEntry, generate, saveProfileAndGenerate, addRecipeUpdate, saveCustomRecipe, removeCustomRecipe, runSync, connectSync, disconnectSync, notify, toast, resetAll, replaceAll]);

  if (!state) return <div className="loading" role="status">불러오는 중…</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// 지운 레시피가 들어 있던 식단 칸 비우기
function dropPlans(plans, ids) {
  const out = {};
  for (const [d, day] of Object.entries(plans)) out[d] = Object.fromEntries(Object.entries(day).filter(([, e]) => !ids.has(e?.recipeId)));
  return out;
}

export const useStore = () => useContext(Ctx);
