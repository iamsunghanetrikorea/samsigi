// 영양 목표 계산 및 끼니 영양 산출
import { ING, buyForm } from '../data/ingredients';
import { RECIPE_BY_ID, recipeItems } from '../data/recipes';

export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'];
export const NUTRIENTS = [
  { key: 'kcal', label: '열량', unit: 'kcal' },
  { key: 'carb', label: '탄수화물', unit: 'g' },
  { key: 'protein', label: '단백질', unit: 'g' },
  { key: 'fat', label: '지방', unit: 'g' },
  { key: 'sodium', label: '나트륨', unit: 'mg', max: true },
];

export const ACTIVITY = [
  { key: 'sedentary', label: '거의 앉아서 생활해요', factor: 1.2 },
  { key: 'light', label: '가볍게 움직여요 (산책 주 1~3회)', factor: 1.375 },
  { key: 'moderate', label: '보통이에요 (운동 주 3~5회)', factor: 1.55 },
  { key: 'active', label: '활발해요 (매일 운동·밭일)', factor: 1.725 },
];

export const DEFAULT_PROFILE = {
  name: '', age: 68, sex: 'female', height: 158, weight: 58, activity: 'light',
  people: 1, likes: [], difficulty: 2, cookTime: 40, budget: 5000,
  allergies: [], exclusions: [], chewing: 'none',
  conditionsConsent: false, conditions: { diabetes: false, hypertension: false, kidney: false },
  targetKcal: null, carbPct: 50, proteinPct: 20, fatPct: 30, sodium: 2000, snackKcal: 150,
  split: { breakfast: 30, lunch: 35, dinner: 35 },
  favorites: [], dislikes: [], rules: [], repetitionWindow: 3, completed: false,
};

// Mifflin–St Jeor 기초대사량
export function bmr({ sex, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function maintenanceKcal(p) {
  const f = ACTIVITY.find((a) => a.key === p.activity)?.factor || 1.375;
  return Math.round((bmr(p) * f) / 10) * 10;
}

export function computeTargets(p) {
  const auto = maintenanceKcal(p);
  const kcal = Number(p.targetKcal) > 0 ? Number(p.targetKcal) : auto;
  const snack = Math.max(0, Math.min(Number(p.snackKcal) || 0, kcal * 0.3));
  const t = {
    auto, kcal, snackKcal: snack,
    carb: (kcal * p.carbPct) / 100 / 4,
    protein: (kcal * p.proteinPct) / 100 / 4,
    fat: (kcal * p.fatPct) / 100 / 9,
    sodium: Number(p.sodium) || 2000,
  };
  // 세 끼 합계 목표 (간식·음료 열량 제외)
  const r = (kcal - snack) / kcal;
  t.meals = { kcal: kcal - snack, carb: t.carb * r, protein: t.protein * r, fat: t.fat * r, sodium: t.sodium };
  const total = MEAL_KEYS.reduce((s, k) => s + (Number(p.split?.[k]) || 0), 0) || 100;
  t.perMeal = {};
  for (const k of MEAL_KEYS) {
    const share = (Number(p.split?.[k]) || 100 / 3) / total;
    t.perMeal[k] = Object.fromEntries(Object.entries(t.meals).map(([n, v]) => [n, v * share]));
  }
  return t;
}

const ZERO = () => ({ kcal: 0, carb: 0, protein: 0, fat: 0, sodium: 0, cost: 0 });

export function sumItems(items) {
  const n = ZERO();
  for (const [id, g] of items) {
    const ing = ING[id];
    if (!ing) continue;
    const f = g / 100;
    n.kcal += ing.kcal * f; n.carb += ing.carb * f; n.protein += ing.protein * f;
    n.fat += ing.fat * f; n.sodium += ing.sodium * f;
    n.cost += (buyForm(id, g).grams / 100) * ing.price;
  }
  return n;
}

// 끼니 열량 목표에 맞춰 주식(밥·면) 양을 0.6~1.5배 사이에서 조절
export function mealItems(recipe, { kcal, subs } = {}) {
  const items = recipeItems(recipe, subs).map(([id, g, orig]) => ({ id, g, orig }));
  let factor = 1;
  if (kcal) {
    const staple = sumItems(items.filter((i) => ING[i.id]?.staple).map((i) => [i.id, i.g])).kcal;
    const other = sumItems(items.filter((i) => !ING[i.id]?.staple).map((i) => [i.id, i.g])).kcal;
    if (staple > 0) factor = Math.min(1.5, Math.max(0.6, Math.round(((kcal - other) / staple) * 10) / 10));
  }
  for (const i of items) if (ING[i.id]?.staple) i.g = Math.round(i.g * factor);
  return { items, factor };
}

export function entryNutrition(entry, mealKey, targets) {
  if (!entry) return null;
  if (entry.eatOut) {
    const k = Number(entry.eatOut.kcal) || 0;
    return { ...ZERO(), kcal: k, estimated: true, unknown: !k, eatOut: true };
  }
  const recipe = RECIPE_BY_ID[entry.recipeId];
  if (!recipe) return null;
  const { items, factor } = mealItems(recipe, { kcal: targets?.perMeal[mealKey]?.kcal, subs: entry.subs });
  return { ...sumItems(items.map((i) => [i.id, i.g])), items, factor, recipe };
}

export function dayTotals(day, targets) {
  const t = ZERO();
  let count = 0; let eatOut = 0; let unknown = 0; let eaten = 0;
  for (const k of MEAL_KEYS) {
    const e = day?.[k];
    const n = entryNutrition(e, k, targets);
    if (!n) continue;
    count++; if (e.eaten) eaten++;
    if (n.eatOut) { eatOut++; if (n.unknown) unknown++; }
    for (const key of Object.keys(t)) t[key] += n[key] || 0;
  }
  return { ...t, count, eatOut, unknown, eaten };
}

export function round(n, d = 0) { const p = 10 ** d; return Math.round(n * p) / p; }
export const won = (n) => `${Math.round(n / 10) * 10 >= 0 ? (Math.round(n / 10) * 10).toLocaleString('ko-KR') : 0}원`;
