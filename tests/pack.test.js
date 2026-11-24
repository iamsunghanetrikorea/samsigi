import { describe, it, expect, afterAll } from 'vitest';
import { PACK, syncPack, nextUpdate, recipeRefs } from '../src/data/recipePack';
import { RECIPES, RECIPE_BY_ID, CATEGORIES } from '../src/data/recipes';
import { ING } from '../src/data/ingredients';
import { DEFAULT_PROFILE, computeTargets, mealItems, sumItems, MEAL_KEYS } from '../src/lib/nutrition';
import { generatePlans } from '../src/lib/planner';
import { monthDates } from '../src/lib/date';

const baseCount = RECIPES.length;
afterAll(() => syncPack([]));

describe('업데이트 추천 메뉴 묶음', () => {
  it('분류마다 6개씩, id 중복 없음, 재료·대체재료가 DB에 있음', () => {
    for (const c of CATEGORIES.filter((x) => x !== '분식')) expect(PACK.filter((r) => r.category === c)).toHaveLength(6);
    const ids = [...PACK.map((r) => r.id), ...RECIPES.map((r) => r.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of PACK) {
      for (const [id] of r.items) expect(ING[id], `${r.id}:${id}`).toBeTruthy();
      for (const [k, alts] of Object.entries(r.subs)) { expect(r.items.some(([id]) => id === k), `${r.id}:${k}`).toBe(true); alts.forEach((a) => expect(ING[a]).toBeTruthy()); }
      expect(r.steps.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('열량이 상식적인 범위 (식사 300~800kcal, 간식 50~350kcal)', () => {
    for (const r of PACK) {
      const n = sumItems(mealItems(r).items.map((i) => [i.id, i.g]));
      if (r.meals.includes('snack')) expect(n.kcal, r.id).toBeGreaterThan(50), expect(n.kcal, r.id).toBeLessThan(350);
      else expect(n.kcal, r.id).toBeGreaterThan(300), expect(n.kcal, r.id).toBeLessThan(800);
    }
  });
  it('한 번에 남은 추천 메뉴를 모두 추가, 이미 있는 메뉴는 빼고 분류 차례대로', () => {
    const ids = nextUpdate([]);
    expect(ids).toHaveLength(PACK.length);
    expect(new Set(ids.map((id) => PACK.find((r) => r.id === id).category)).size).toBe(6);
    const cats = ids.map((id) => PACK.find((r) => r.id === id).category);
    expect(cats).toEqual([...cats].sort((a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b)));
    const half = ids.slice(0, 10);
    expect(nextUpdate(half)).toHaveLength(PACK.length - half.length);
    expect(nextUpdate(ids)).toHaveLength(0);
  });
  it('추가한 메뉴만 레시피 목록에 올라가고, 지우면 빠짐', () => {
    const ids = nextUpdate([]);
    syncPack(ids);
    expect(RECIPES.length).toBe(baseCount + PACK.length);
    ids.forEach((id) => expect(RECIPE_BY_ID[id]).toBeTruthy());
    syncPack([]);
    expect(RECIPES.length).toBe(baseCount);
    ids.forEach((id) => expect(RECIPE_BY_ID[id]).toBeUndefined());
  });
  it('추가된 식사 메뉴는 식단 추천에 쓰이고, 간식은 끼니에 들어가지 않음', () => {
    syncPack(PACK.map((r) => r.id));
    const t = computeTargets(DEFAULT_PROFILE);
    const dates = monthDates('2026-11');
    const { plans } = generatePlans({ profile: DEFAULT_PROFILE, plans: {}, pantry: {} }, t, dates);
    const used = dates.flatMap((d) => MEAL_KEYS.map((k) => RECIPE_BY_ID[plans[d][k].recipeId]));
    expect(used.some((r) => r.isNew)).toBe(true);
    expect(used.some((r) => r.meals.includes('snack'))).toBe(false);
    syncPack([]);
  });
  it('참고 자료 링크(유튜브·만개의레시피)', () => {
    const refs = recipeRefs(PACK[0]);
    expect(refs.map((r) => r.label)).toEqual(['유튜브 조리 영상', '만개의레시피']);
    expect(refs[0].url).toContain('youtube.com/results');
  });
});
