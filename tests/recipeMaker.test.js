import { describe, it, expect } from 'vitest';
import { makeRecipe } from '../src/lib/recipeMaker';
import { syncCustom } from '../src/data/recipePack';
import { RECIPES, RECIPE_BY_ID } from '../src/data/recipes';
import { ING } from '../src/data/ingredients';

describe('메뉴 이름으로 레시피 만들기', () => {
  const names = ['김치찌개', '제육덮밥', '김치볶음밥', '소고기미역국', '감자전', '고등어조림', '짜장면', '토마토 파스타', '떡볶이', '계란말이', '아무거나'];
  it.each(names)('%s: 재료는 모두 식재료 DB에 있고 순서가 있다', (n) => {
    const r = makeRecipe(n);
    expect(r.items.length).toBeGreaterThan(2);
    for (const [id, g] of r.items) { expect(ING[id], id).toBeTruthy(); expect(g).toBeGreaterThan(0); }
    expect(r.steps.length).toBeGreaterThanOrEqual(3);
    expect(r.meals.length).toBeGreaterThan(0);
    expect(new Set(r.items.map(([id]) => id)).size).toBe(r.items.length);
  });
  it('요리 종류와 주재료를 알아본다', () => {
    expect(makeRecipe('김치찌개').category).toBe('찌개');
    expect(makeRecipe('김치찌개').items.map(([id]) => id)).toContain('kimchi');
    expect(makeRecipe('제육덮밥').items.map(([id]) => id)).toContain('pork');
    expect(makeRecipe('짜장면').category).toBe('중식');
    expect(makeRecipe('호박죽').items.map(([id]) => id)).toContain('pumpkin');
  });
  it('추가·삭제가 레시피 목록에 반영된다', () => {
    const r = makeRecipe('된장찌개');
    syncCustom([r]);
    expect(RECIPE_BY_ID[r.id]).toBe(r);
    expect(RECIPES).toContain(r);
    syncCustom([]);
    expect(RECIPE_BY_ID[r.id]).toBeUndefined();
    expect(RECIPES).not.toContain(r);
  });
});
