// 규칙 기반 식단 추천 엔진 (브라우저 내 실행, 서버 불필요)
// 1) 제한 조건 필터 → 2) 영양 편차·반복·비용·제철·재료 재활용 점수 → 3) 하루 3끼 조합 최적화
import { ING } from '../data/ingredients';
import { RECIPES, RECIPE_BY_ID, recipeAllergens, MEAL_LABEL } from '../data/recipes';
import { MEAL_KEYS, mealItems, sumItems, dayTotals } from './nutrition';
import { addDays, parse, weekday, WD } from './date';

const SEASONING = new Set(['양념']);

// 제외 사유를 돌려줌 (null이면 허용)
export function excludeReason(r, p) {
  const allergens = recipeAllergens(r);
  const hit = allergens.find((a) => (p.allergies || []).includes(a));
  if (hit) return `알레르기(${hit})`;
  const ex = (p.exclusions || []).map((s) => s.trim()).filter(Boolean);
  const exHit = ex.find((e) => r.title.includes(e) || r.items.some(([id]) => ING[id]?.name.includes(e)));
  if (exHit) return `제외 재료(${exHit})`;
  if (r.difficulty > (p.difficulty || 3)) return '조리 난이도';
  if (r.prep + r.cook > (p.cookTime || 999)) return '조리 시간';
  if (p.chewing === 'hard' && !r.soft) return '씹기 어려움';
  if ((p.dislikes || []).includes(r.id)) return '추천 제외한 메뉴';
  return null;
}

export const allowedRecipes = (p, mealKey) =>
  RECIPES.filter((r) => (!mealKey || r.meals.includes(mealKey)) && !excludeReason(r, p));

// 주변 날짜(±7일)의 식단 — 반복 방지용
function neighbors(plans, date, mealKey) {
  const out = [];
  for (let off = -7; off <= 7; off++) {
    const day = plans[addDays(date, off)];
    if (!day) continue;
    for (const k of MEAL_KEYS) {
      if (off === 0 && k === mealKey) continue;
      const e = day[k];
      if (e?.recipeId && RECIPE_BY_ID[e.recipeId]) out.push({ dist: Math.abs(off), recipe: RECIPE_BY_ID[e.recipeId], off });
    }
  }
  return out;
}

export function scoreRecipe(r, ctx) {
  const { mealKey, date, plans, targets, profile, pantry = {} } = ctx;
  const mt = targets.perMeal[mealKey];
  const { items } = mealItems(r, { kcal: mt.kcal });
  const n = sumItems(items.map((i) => [i.id, i.g]));
  const cond = profile.conditions || {};
  const reasons = [];
  let s = 0;

  // 영양 편차
  s += (Math.abs(n.kcal - mt.kcal) / mt.kcal) * 2;
  s += (Math.max(0, mt.protein - n.protein) / mt.protein) * 1.5;
  s += (Math.max(0, n.sodium - mt.sodium) / mt.sodium) * (cond.hypertension || cond.kidney ? 3 : 1.5);
  s += (Math.max(0, n.fat - mt.fat * 1.2) / mt.fat) * 0.8;
  s += (Math.max(0, mt.fat * 0.8 - n.fat) / mt.fat) * 0.8;
  s += (Math.max(0, n.carb - mt.carb * 1.1) / mt.carb) * (cond.diabetes ? 2.5 : 1);

  // 반복 최소화 (FR-07)
  const win = profile.repetitionWindow || 3;
  for (const nb of neighbors(plans, date, mealKey)) {
    if (nb.recipe.id === r.id) s += nb.dist === 0 ? 6 : nb.dist <= win ? 5 : 1.2;
    else if (nb.recipe.main === r.main) s += nb.dist === 0 ? 3 : nb.dist <= win ? 2.5 : 0;
  }

  // 식비
  if (profile.budget > 0 && n.cost > profile.budget) s += ((n.cost - profile.budget) / profile.budget) * 1.5;

  // 제철 재료
  const month = parse(date).getMonth() + 1;
  const main = r.items.filter(([id]) => !SEASONING.has(ING[id]?.cat));
  const seasonal = main.filter(([id]) => ING[id]?.seasons.includes(month)).length;
  if (seasonal) { s -= Math.min(0.3, seasonal * 0.1); reasons.push('제철 재료'); }

  // 남은 재료 재활용: 보유 재료 + 최근 3일 사용 재료
  const recent = new Set();
  for (let off = -3; off < 0; off++) {
    const day = plans[addDays(date, off)];
    for (const k of MEAL_KEYS) {
      const rr = RECIPE_BY_ID[day?.[k]?.recipeId];
      if (rr) rr.items.forEach(([id]) => recent.add(id));
    }
  }
  const reuse = main.filter(([id]) => (pantry[id] || 0) > 0 || (recent.has(id) && !ING[id]?.staple)).length;
  if (reuse) { s -= Math.min(0.4, reuse * 0.08); if (main.some(([id]) => (pantry[id] || 0) > 0)) reasons.push('보유 재료 활용'); }

  // 선호
  if ((profile.favorites || []).includes(r.id)) { s -= 0.5; reasons.push('즐겨찾기'); }
  const liked = r.tags.filter((t) => (profile.likes || []).includes(t)).length;
  s -= Math.min(0.4, liked * 0.2);
  if (profile.chewing === 'some' && r.soft) s -= 0.3;

  return { score: s, nutrition: n, reasons };
}

function emptyEntry(recipeId, profile, prev) {
  return { recipeId, servings: prev?.servings || profile.people || 1, locked: false, eaten: false };
}

const isKept = (e) => e && (e.locked || e.eatOut);

// 하루 식단 생성 — 고정·외식 끼니는 유지
function planDay(date, plans, state, targets, warnings, jitter) {
  const { profile, pantry } = state;
  const day = { ...(plans[date] || {}) };
  // 매주 고정 규칙 (FR-09)
  for (const rule of profile.rules || []) {
    if (rule.weekday === weekday(date) && !day[rule.meal] && RECIPE_BY_ID[rule.recipeId]) {
      day[rule.meal] = { ...emptyEntry(rule.recipeId, profile, day[rule.meal]), fixed: true };
    }
  }
  const open = MEAL_KEYS.filter((k) => !day[k]);
  if (!open.length) return day;

  const tmpPlans = { ...plans, [date]: day };
  const cands = {};
  for (const k of open) {
    const pool = allowedRecipes(profile, k);
    if (!pool.length) {
      warnings.add(`${MEAL_LABEL[k]}: 조건(알레르기·제외 재료·조리시간·난이도 등)에 맞는 메뉴가 없습니다. 설정을 완화해 주세요.`);
      delete day[k];
      continue;
    }
    if (pool.length < 3) warnings.add(`${MEAL_LABEL[k]}: 조건에 맞는 메뉴가 ${pool.length}개뿐이라 같은 메뉴가 자주 나올 수 있습니다.`);
    const ctx = { mealKey: k, date, plans: { ...tmpPlans, [date]: { ...day, [k]: undefined } }, targets, profile, pantry };
    cands[k] = pool
      .map((r) => ({ r, s: scoreRecipe(r, ctx).score + Math.random() * jitter }))
      .sort((a, b) => a.s - b.s)
      .slice(0, 6);
  }
  const keys = Object.keys(cands);
  if (!keys.length) return day;

  // 조합 최적화: 하루 합계 편차 + 같은 날 중복 방지
  const fixedEntries = MEAL_KEYS.filter((k) => !keys.includes(k) && day[k]).map((k) => [k, day[k]]);
  let best = null;
  const walk = (i, chosen) => {
    if (i === keys.length) {
      let s = chosen.reduce((acc, c) => acc + c.s, 0);
      const trial = Object.fromEntries(fixedEntries);
      keys.forEach((k, idx) => { trial[k] = { recipeId: chosen[idx].r.id }; });
      const tot = dayTotals(trial, targets);
      s += (Math.abs(tot.kcal - targets.meals.kcal) / targets.meals.kcal) * 3;
      s += (Math.max(0, targets.meals.protein - tot.protein) / targets.meals.protein) * 2;
      s += (Math.max(0, tot.sodium - targets.sodium) / targets.sodium) * 2;
      s += (Math.max(0, tot.carb - targets.meals.carb * 1.1) / targets.meals.carb) * 1.5;
      s += (Math.max(0, targets.meals.fat * 0.8 - tot.fat) / targets.meals.fat) * 1.2;
      const mains = MEAL_KEYS.map((k) => RECIPE_BY_ID[trial[k]?.recipeId]?.main).filter(Boolean);
      s += (mains.length - new Set(mains).size) * 3;
      if (!best || s < best.s) best = { s, chosen: [...chosen] };
      return;
    }
    for (const c of cands[keys[i]]) { chosen.push(c); walk(i + 1, chosen); chosen.pop(); }
  };
  walk(0, []);
  keys.forEach((k, idx) => { day[k] = emptyEntry(best.chosen[idx].r.id, profile, day[k]); });
  return day;
}

// 여러 날 생성. overwrite=true면 고정·외식 외 끼니를 새로 만들고, false면 빈 끼니만 채움
export function generatePlans(state, targets, dates, { overwrite = true, jitter = 0.8 } = {}) {
  const plans = { ...state.plans };
  const warnings = new Set();
  for (const d of dates) {
    const day = { ...(plans[d] || {}) };
    if (overwrite) for (const k of MEAL_KEYS) if (day[k] && !isKept(day[k])) delete day[k];
    plans[d] = day;
  }
  for (const d of dates) plans[d] = planDay(d, plans, state, targets, warnings, jitter);
  return { plans, warnings: [...warnings, ...analyzeRange(plans, dates, targets)] };
}

// 생성 결과 점검 — 충족할 수 없는 조건을 사용자에게 알림 (알고리즘 8단계)
export function analyzeRange(plans, dates, targets) {
  const out = [];
  const days = dates.map((d) => dayTotals(plans[d], targets)).filter((t) => t.count === 3 && !t.eatOut);
  if (!days.length) return out;
  const avg = (k) => days.reduce((s, t) => s + t[k], 0) / days.length;
  const m = targets.meals;
  if (avg('protein') < m.protein * 0.85) out.push(`단백질이 목표보다 평균 ${Math.round(m.protein - avg('protein'))}g 부족합니다. 달걀·두부·우유 간식을 더하거나 단백질 목표를 조정해 보세요.`);
  if (avg('sodium') > targets.sodium) out.push(`나트륨이 하루 기준(${targets.sodium}mg)을 평균 ${Math.round(avg('sodium') - targets.sodium)}mg 넘습니다. 국물은 절반만 드시는 것을 권합니다.`);
  const kd = avg('kcal') - m.kcal;
  if (Math.abs(kd) > m.kcal * 0.15) out.push(`세 끼 열량이 목표보다 평균 ${Math.abs(Math.round(kd))}kcal ${kd > 0 ? '많습니다' : '적습니다'}. 밥 양을 조절하거나 목표를 확인해 주세요.`);
  return out;
}

// 한 끼 교체 후보 (FR-03)
export function suggestions(state, targets, date, mealKey, limit = 8) {
  const current = state.plans[date]?.[mealKey]?.recipeId;
  const ctx = { mealKey, date, plans: state.plans, targets, profile: state.profile, pantry: state.pantry };
  return allowedRecipes(state.profile, mealKey)
    .filter((r) => r.id !== current)
    .map((r) => ({ recipe: r, ...scoreRecipe(r, ctx) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export const weekdayLabel = (n) => `${WD[n]}요일`;
