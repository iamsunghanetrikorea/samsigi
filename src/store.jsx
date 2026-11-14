import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getItem, setItem, clearAll } from './lib/storage';
import { computeTargets, DEFAULT_PROFILE } from './lib/nutrition';
import { generatePlans } from './lib/planner';

export const DEFAULT_STATE = {
  profile: null,
  plans: {},            // { 'YYYY-MM-DD': { breakfast: {recipeId, servings, locked, eaten, subs, eatOut}, ... } }
  pantry: {},           // { ingredientId: 보유 g }
  shopping: { checked: {}, extras: [], prices: {}, split: true },
  restaurants: [],      // 저장한 식당
  snacks: {},           // { date: [{name, kcal}] }
  settings: { fontSize: 20, contrast: false },
  consent: { location: false },
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

  const resetAll = useCallback(async () => {
    await clearAll();
    saved.current = DEFAULT_STATE;
    setState({ ...DEFAULT_STATE });
  }, []);

  const replaceAll = useCallback((data) => {
    const s = { ...DEFAULT_STATE };
    for (const k of KEYS) if (data[k] !== undefined) s[k] = data[k];
    if (s.profile) s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    setState(s);
  }, []);

  const value = useMemo(() => state && ({ state, update, targets, setEntry, generate, saveProfileAndGenerate, notify, toast, resetAll, replaceAll }),
    [state, update, targets, setEntry, generate, saveProfileAndGenerate, notify, toast, resetAll, replaceAll]);

  if (!state) return <div className="loading" role="status">불러오는 중…</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
