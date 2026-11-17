import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getItem, setItem, clearAll } from './lib/storage';
import { computeTargets, DEFAULT_PROFILE } from './lib/nutrition';
import { generatePlans } from './lib/planner';
import { syncPack, syncCustom, applyEdits, nextUpdate } from './data/recipePack';

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
  recipeEdits: {},      // 기본 메뉴를 '메뉴수정'으로 고친 내용 { recipeId: {title, items, steps, …} }
  market: { picked: [], custom: [] }, // 장보기 '재료 고르기': 고른 재료 id, 사용자가 추가한 재료
  recipeMenus: [],      // 레시피 모음 '메뉴 추가 입력'으로 더한 사진 버튼 [{id, name, photo?, credit?}]
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
      // 예전에 만든 내 메뉴 이름에서 '…와 잡곡밥'·'…과 쌀밥' 떼기
      s.customRecipes = s.customRecipes.map((r) => (/(과|와) (잡곡밥|쌀밥)$/.test(r.title) ? { ...r, title: r.title.replace(/(과|와) (잡곡밥|쌀밥)$/, '') } : r));
      syncPack(s.addedRecipes);
      syncCustom(s.customRecipes);
      applyEdits(s.recipeEdits);
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
    const next = { ...s, customRecipes: list };
    stateRef.current = next;
    setState(next);
  }, []);
  // 기본 메뉴 고치기(메뉴수정) — edit가 null이면 원래대로
  const saveRecipeEdit = useCallback((id, edit) => {
    const s = stateRef.current;
    const edits = { ...s.recipeEdits };
    if (edit) edits[id] = { ...edit, editedAt: Date.now() }; else delete edits[id];
    applyEdits(edits);
    const next = { ...s, recipeEdits: edits };
    stateRef.current = next;
    setState(next);
  }, []);
  const removeCustomRecipe = useCallback((id) => {
    const s = stateRef.current;
    const list = s.customRecipes.filter((r) => r.id !== id);
    syncCustom(list);
    const next = { ...s, customRecipes: list, plans: dropPlans(s.plans, new Set([id])) };
    stateRef.current = next;
    setState(next);
  }, []);

  const resetAll = useCallback(async () => {
    syncPack([]);
    syncCustom([]);
    applyEdits({});
    await clearAll();
    saved.current = DEFAULT_STATE;
    setState({ ...DEFAULT_STATE });
  }, []);

  const replaceAll = useCallback((data) => {
    const s = { ...DEFAULT_STATE };
    for (const k of KEYS) if (data[k] !== undefined) s[k] = data[k];
    if (s.profile) s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    syncPack(s.addedRecipes);
    syncCustom(s.customRecipes);
    applyEdits(s.recipeEdits);
    setState(s);
  }, []);

  const value = useMemo(() => state && ({ state, update, targets, setEntry, generate, saveProfileAndGenerate, addRecipeUpdate, saveCustomRecipe, saveRecipeEdit, removeCustomRecipe, notify, toast, resetAll, replaceAll }),
    [state, update, targets, setEntry, generate, saveProfileAndGenerate, addRecipeUpdate, saveCustomRecipe, saveRecipeEdit, removeCustomRecipe, notify, toast, resetAll, replaceAll]);

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
