import { it, expect } from 'vitest';
import { RECIPES, RECIPE_BY_ID } from '../src/data/recipes';
import { youtubeSuggestions } from '../src/lib/youtube';

it('모든 레시피에 유튜브 추천 3개(서로 다른 검색어)', () => {
  for (const r of RECIPES) {
    const ys = youtubeSuggestions(r);
    expect(ys).toHaveLength(3);
    expect(new Set(ys.map((y) => y.q)).size).toBe(3);
    ys.forEach((y) => expect(y.url).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=/));
  }
});
it('곁들이 메뉴가 있으면 세 번째는 곁들이 메뉴', () => {
  const ys = youtubeSuggestions(RECIPE_BY_ID.mackerel_set);
  expect(ys[0].q).toBe('고등어구이 만들기');
  expect(ys[2].q).toBe('시금치된장국 만들기');
});
