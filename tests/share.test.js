import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILE, computeTargets } from '../src/lib/nutrition';
import { generatePlans } from '../src/lib/planner';
import { todayRecipesText, chatGptUrl, GPT_PROMPT } from '../src/lib/share';
import { monthDates } from '../src/lib/date';

describe('오늘의 레시피 보내기', () => {
  const p = { ...DEFAULT_PROFILE, conditionsConsent: true, conditions: { diabetes: true, hypertension: false, kidney: false } };
  const t = computeTargets(p);
  const dates = monthDates('2026-11');
  const { plans } = generatePlans({ profile: p, plans: {}, pantry: {} }, t, dates);

  it('세 끼 메뉴·재료·조리법이 들어가고 건강정보는 들어가지 않는다', () => {
    const txt = todayRecipesText(plans, t, '2026-11-14');
    expect(txt).toContain('■ 아침'); expect(txt).toContain('■ 점심'); expect(txt).toContain('■ 저녁');
    expect(txt).toContain('재료:'); expect(txt).toContain('만드는 법:');
    expect(txt).not.toMatch(/당뇨|고혈압|신장|체중|나이/);
  });
  it('외식 끼니는 이름만 표시', () => {
    const day = { ...plans['2026-11-14'], lunch: { eatOut: { name: '동네 백반', kcal: 700 } } };
    expect(todayRecipesText({ '2026-11-14': day }, t, '2026-11-14')).toContain('■ 점심: 외식 (동네 백반)');
  });
  it('식단이 없으면 빈 문자열', () => {
    expect(todayRecipesText({}, t, '2026-11-14')).toBe('');
  });
  it('한 달 내내 대부분 ChatGPT 입력창에 자동으로 채워진다', () => {
    const ok = dates.filter((d) => chatGptUrl(`${GPT_PROMPT}\n\n${todayRecipesText(plans, t, d)}`).prefilled).length;
    expect(ok / dates.length).toBeGreaterThan(0.8);
  });
});

describe('레시피 상세 GPT로 보내기', () => {
  it('인분·대체 재료가 반영된다', async () => {
    const { recipeText } = await import('../src/lib/share');
    const { mealItems, sumItems } = await import('../src/lib/nutrition');
    const { RECIPE_BY_ID } = await import('../src/data/recipes');
    const recipe = RECIPE_BY_ID.mackerel_set;
    const { items } = mealItems(recipe, { subs: { mackerel: 'salmon' } });
    const nutrition = sumItems(items.map((i) => [i.id, i.g]));
    const txt = recipeText({ recipe, items, servings: 2, nutrition, mealLabel: '저녁', dateLabel: '11월 14일 (토)' });
    expect(txt).toContain('[11월 14일 (토) 저녁 레시피] 고등어구이');
    expect(txt).toContain('2인분');
    expect(txt).toContain('연어 200g');
    expect(txt).toContain('바꾼 재료: 고등어 → 연어');
    expect(txt).toContain('1) 고등어를 씻어');
  });
});
