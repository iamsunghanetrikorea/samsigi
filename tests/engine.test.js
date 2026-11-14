// PRD 13장 검수 기준에 대응하는 식단 엔진 테스트
import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILE, computeTargets, dayTotals, entryNutrition, MEAL_KEYS, bmr } from '../src/lib/nutrition';
import { generatePlans, suggestions, allowedRecipes } from '../src/lib/planner';
import { buildShopping } from '../src/lib/shopping';
import { weekDates, monthDates, addDays } from '../src/lib/date';
import { RECIPES, RECIPE_BY_ID, recipeAllergens } from '../src/data/recipes';
import { ING, INGREDIENTS } from '../src/data/ingredients';

const profile = { ...DEFAULT_PROFILE, completed: true };
const base = (p = profile, plans = {}) => ({ profile: p, plans, pantry: {}, shopping: { prices: {} } });

describe('데이터 무결성', () => {
  it('모든 레시피 재료·대체재료가 식재료 DB에 있다', () => {
    for (const r of RECIPES) {
      for (const [id] of r.items) expect(ING[id], `${r.id}:${id}`).toBeTruthy();
      for (const [k, alts] of Object.entries(r.subs)) {
        expect(r.items.some(([id]) => id === k), `${r.id} sub key ${k}`).toBe(true);
        for (const a of alts) expect(ING[a], `${r.id} alt ${a}`).toBeTruthy();
      }
    }
  });
  it('레시피 id가 중복되지 않는다', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });
  it('영양 열량이 탄단지 환산값과 크게 어긋나지 않는다', () => {
    // 해조류(미역·김)는 탄수화물 대부분이 식이섬유라 4kcal/g 환산에서 제외
    for (const i of INGREDIENTS.filter((x) => !['miyeok', 'laver'].includes(x.id))) {
      const est = i.carb * 4 + i.protein * 4 + i.fat * 9;
      expect(Math.abs(est - i.kcal), i.id).toBeLessThan(Math.max(30, i.kcal * 0.25));
    }
  });
});

describe('영양 목표', () => {
  it('Mifflin–St Jeor 식을 따른다', () => {
    expect(bmr({ sex: 'male', weight: 70, height: 170, age: 65 })).toBeCloseTo(10 * 70 + 6.25 * 170 - 5 * 65 + 5);
    expect(bmr({ sex: 'female', weight: 58, height: 158, age: 68 })).toBeCloseTo(10 * 58 + 6.25 * 158 - 5 * 68 - 161);
  });
  it('PRD 예시: 1,800kcal → 탄 225g, 단 90g, 지 60g', () => {
    const t = computeTargets({ ...profile, targetKcal: 1800 });
    expect(t.carb).toBeCloseTo(225); expect(t.protein).toBeCloseTo(90); expect(t.fat).toBeCloseTo(60);
  });
});

describe('식단 생성', () => {
  const t = computeTargets(profile);
  it('7일 21끼를 생성한다', () => {
    const dates = weekDates('2026-11-14');
    const { plans } = generatePlans(base(), t, dates);
    expect(dates.flatMap((d) => MEAL_KEYS.filter((k) => plans[d][k])).length).toBe(21);
  });
  it.each(['2026-02', '2028-02', '2026-04', '2026-11', '2026-12'])('%s 실제 일수만큼 생성한다', (ym) => {
    const dates = monthDates(ym);
    const expected = { '2026-02': 28, '2028-02': 29, '2026-04': 30, '2026-11': 30, '2026-12': 31 }[ym];
    expect(dates.length).toBe(expected);
    const { plans } = generatePlans(base(), t, dates);
    expect(dates.every((d) => MEAL_KEYS.every((k) => plans[d][k]?.recipeId))).toBe(true);
  });
  it('알레르기·제외 재료가 추천에 포함되지 않는다', () => {
    const p = { ...profile, allergies: ['대두', '생선'], exclusions: ['돼지고기'] };
    const dates = monthDates('2026-11');
    const { plans } = generatePlans(base(p), computeTargets(p), dates);
    for (const d of dates) for (const k of MEAL_KEYS) {
      const r = RECIPE_BY_ID[plans[d][k].recipeId];
      expect(recipeAllergens(r).some((a) => ['대두', '생선'].includes(a)), r.id).toBe(false);
      expect(r.items.some(([id]) => ING[id].name.includes('돼지고기')), r.id).toBe(false);
    }
  });
  it('3일 이내 같은 주메뉴 반복이 드물다', () => {
    const dates = monthDates('2026-11');
    const { plans } = generatePlans(base(), t, dates);
    let repeats = 0;
    dates.forEach((d) => MEAL_KEYS.forEach((k) => {
      const main = RECIPE_BY_ID[plans[d][k].recipeId].main;
      for (let off = 1; off <= 3; off++) {
        const nd = plans[addDays(d, off)];
        if (nd && MEAL_KEYS.some((kk) => RECIPE_BY_ID[nd[kk]?.recipeId]?.main === main)) repeats++;
      }
    }));
    expect(repeats / (dates.length * 3)).toBeLessThan(0.15);
  });
  it('고정 메뉴는 재생성해도 유지되고 중복 방지와 함께 동작한다', () => {
    const dates = weekDates('2026-11-14');
    const first = generatePlans(base(), t, dates).plans;
    const lockedId = first[dates[2]].lunch.recipeId;
    first[dates[2]].lunch = { ...first[dates[2]].lunch, locked: true };
    const { plans } = generatePlans(base(profile, first), t, dates, { overwrite: true });
    expect(plans[dates[2]].lunch.recipeId).toBe(lockedId);
    expect(plans[dates[2]].lunch.locked).toBe(true);
    const sameDayMains = MEAL_KEYS.map((k) => RECIPE_BY_ID[plans[dates[2]][k].recipeId].main);
    expect(new Set(sameDayMains).size).toBe(3);
  });
  it('빈 끼니만 채우기는 기존 메뉴를 바꾸지 않는다', () => {
    const dates = weekDates('2026-11-14');
    const first = generatePlans(base(), t, dates).plans;
    delete first[dates[0]].dinner;
    const keep = first[dates[0]].breakfast.recipeId;
    const { plans } = generatePlans(base(profile, first), t, dates, { overwrite: false });
    expect(plans[dates[0]].breakfast.recipeId).toBe(keep);
    expect(plans[dates[0]].dinner.recipeId).toBeTruthy();
  });
  it('조건을 충족할 수 없으면 경고를 준다', () => {
    const p = { ...profile, cookTime: 10, difficulty: 1 };
    const { warnings } = generatePlans(base(p), computeTargets(p), weekDates('2026-11-14'));
    expect(warnings.length).toBeGreaterThan(0);
  });
  it('씹기 어려움(많이) → 부드러운 메뉴만', () => {
    const p = { ...profile, chewing: 'hard' };
    expect(allowedRecipes(p).every((r) => r.soft)).toBe(true);
  });
});

describe('교체·재계산', () => {
  const t = computeTargets(profile);
  it('한 끼 교체 시 하루 합계가 정확히 갱신된다', () => {
    const d = '2026-11-14';
    const { plans } = generatePlans(base(), t, [d]);
    const before = dayTotals(plans[d], t);
    const alt = suggestions(base(profile, plans), t, d, 'lunch')[0].recipe;
    const oldN = entryNutrition(plans[d].lunch, 'lunch', t);
    const next = { ...plans[d], lunch: { ...plans[d].lunch, recipeId: alt.id } };
    const newN = entryNutrition(next.lunch, 'lunch', t);
    const after = dayTotals(next, t);
    expect(after.kcal).toBeCloseTo(before.kcal - oldN.kcal + newN.kcal);
    expect(after.protein).toBeCloseTo(before.protein - oldN.protein + newN.protein);
  });
  it('대체 재료·인분 변경이 영양과 장보기에 반영된다', () => {
    const d = '2026-11-14';
    const plans = { [d]: { dinner: { recipeId: 'mackerel_set', servings: 1 } } };
    const n1 = entryNutrition(plans[d].dinner, 'dinner', t);
    const subbed = { ...plans[d].dinner, subs: { mackerel: 'salmon' }, servings: 3 };
    const n2 = entryNutrition(subbed, 'dinner', t);
    expect(n2.kcal).not.toBeCloseTo(n1.kcal);
    const shop = buildShopping(base(profile, { [d]: { dinner: subbed } }), t, [d], { split: false });
    const rows = shop.trips.flatMap((x) => x.rows);
    expect(rows.find((r) => r.id === 'mackerel')).toBeUndefined();
    expect(rows.find((r) => r.id === 'salmon').need).toBeCloseTo(100 * 3); // 고등어 100g 자리를 연어로 대체
  });
  it('외식 끼니는 장보기에서 제외되고 보유량은 차감된다', () => {
    const d = '2026-11-14';
    const plans = { [d]: { lunch: { eatOut: { name: '백반', kcal: 700 } }, dinner: { recipeId: 'tofu_mushroom_hotpot', servings: 2 } } };
    const st = { ...base(profile, plans), pantry: { tofu: 100 } };
    const rows = buildShopping(st, t, [d], { split: false }).trips.flatMap((x) => x.rows);
    const tofu = rows.find((r) => r.id === 'tofu');
    expect(tofu.need).toBe(300); expect(tofu.owned).toBe(100); expect(tofu.toBuy).toBe(200);
    expect(dayTotals(plans[d], t).eatOut).toBe(1);
  });
});
