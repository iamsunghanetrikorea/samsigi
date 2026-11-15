import { describe, it, expect } from 'vitest';
import { mergeDocs, sameDoc, sanitizeRecipe, normCode, fmtCode } from '../src/lib/sync';
import { makeRecipe } from '../src/lib/recipeMaker';

const r = (id, at, title = id) => ({ id, title, updatedAt: at });

describe('레시피 동기화 합치기', () => {
  it('양쪽 레시피를 모두 남긴다', () => {
    const m = mergeDocs({ recipes: [r('my_a', 1)], deleted: [] }, { recipes: [r('my_b', 2)], deleted: [] });
    expect(m.recipes.map((x) => x.id)).toEqual(['my_a', 'my_b']);
  });
  it('같은 레시피는 더 최근에 고친 쪽을 남긴다', () => {
    const m = mergeDocs({ recipes: [r('my_a', 5, '새')], deleted: [] }, { recipes: [r('my_a', 3, '옛')], deleted: [] });
    expect(m.recipes[0].title).toBe('새');
  });
  it('삭제가 더 최근이면 지우고, 삭제 뒤에 다시 고친 것은 남긴다', () => {
    expect(mergeDocs({ recipes: [r('my_a', 1)], deleted: [] }, { recipes: [], deleted: [{ id: 'my_a', updatedAt: 2 }] }).recipes).toEqual([]);
    expect(mergeDocs({ recipes: [r('my_a', 3)], deleted: [] }, { recipes: [], deleted: [{ id: 'my_a', updatedAt: 2 }] }).recipes).toHaveLength(1);
  });
  it('내용 비교는 id·시각 기준', () => {
    expect(sameDoc({ recipes: [r('my_a', 1)], deleted: [] }, { recipes: [r('my_a', 1, '다른 제목')], deleted: [] })).toBe(true);
    expect(sameDoc({ recipes: [r('my_a', 1)], deleted: [] }, { recipes: [r('my_a', 2)], deleted: [] })).toBe(false);
  });
  it('서버에서 받은 레시피 형식을 확인한다', () => {
    const ok = { ...makeRecipe('김치찌개'), updatedAt: 1 };
    expect(sanitizeRecipe(ok)).toMatchObject({ id: ok.id, title: ok.title, isCustom: true });
    expect(sanitizeRecipe({ ...ok, id: '../x' })).toBeNull();
    expect(sanitizeRecipe({ ...ok, items: [['없는재료', 10]] })).toBeNull();
    expect(sanitizeRecipe({ ...ok, items: [...ok.items, ['없는재료', 10]] }).items).toHaveLength(ok.items.length);
  });
  it('코드는 대소문자·하이픈과 상관없이 읽는다', () => {
    expect(normCode('abcde-23456')).toBe('ABCDE23456');
    expect(fmtCode('ABCDE23456')).toBe('ABCDE-23456');
  });
});
