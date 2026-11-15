import { describe, it, expect } from 'vitest';
import { BUNSIK } from '../src/data/bunsik';
import { RECIPES, RECIPE_BY_ID, CATEGORIES } from '../src/data/recipes';
import { ING } from '../src/data/ingredients';
import { generatePlans } from '../src/lib/planner';
import { computeTargets, DEFAULT_PROFILE, sumItems } from '../src/lib/nutrition';
import { DEFAULT_STATE } from '../src/store';

const MENUS = ['야채김밥', '참치김밥', '치즈김밥', '김치김밥', '소고기김밥', '돈가스김밥', '라면', '치즈라면', '떡볶이', '라볶이', '쫄면', '만두',
  '김치찌개', '된장찌개', '순두부찌개', '제육덮밥', '오징어덮밥', '비빔밥', '등심돈가스', '치즈돈가스', '김치볶음밥', '새우볶음밥', '오므라이스',
  '돌솥비빔밥', '우동', '잔치국수', '냉면', '떡만둣국'];

describe('분식 메뉴 28종', () => {
  it('엑셀의 메뉴 28개가 모두 레시피로 있다', () => {
    expect(BUNSIK).toHaveLength(28);
    for (const m of MENUS) expect(BUNSIK.some((r) => r.title.includes(m)), m).toBe(true);
  });
  it('레시피 모음에 들어가고 분류는 분식', () => {
    expect(CATEGORIES).toContain('분식');
    for (const r of BUNSIK) { expect(RECIPE_BY_ID[r.id]).toBe(r); expect(r.category).toBe('분식'); }
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });
  it('재료는 모두 식재료 DB에 있고 순서가 있다', () => {
    for (const r of BUNSIK) {
      for (const [id, g] of r.items) { expect(ING[id], `${r.title}: ${id}`).toBeTruthy(); expect(g).toBeGreaterThan(0); }
      expect(r.steps.length).toBeGreaterThanOrEqual(3);
      const n = sumItems(r.items);
      expect(n.kcal, r.title).toBeGreaterThan(250);
      expect(n.kcal, r.title).toBeLessThan(1000);
    }
  });
  it('식단 자동 생성에는 들어가지 않는다', () => {
    const profile = { ...DEFAULT_PROFILE, completed: true };
    const dates = Array.from({ length: 14 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
    const { plans } = generatePlans({ ...DEFAULT_STATE, profile }, computeTargets(profile), dates);
    const used = Object.values(plans).flatMap((d) => Object.values(d).map((e) => e.recipeId));
    expect(used.length).toBeGreaterThan(0);
    expect(used.some((id) => id.startsWith('kc_'))).toBe(false);
  });
});
