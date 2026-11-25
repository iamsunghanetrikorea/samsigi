// 장보기 '재료 고르기' — 고른 재료로 쉽게 만들 수 있는 레시피 추천 (브라우저 안에서 동작)
import { ING, INGREDIENTS, CATEGORY_ORDER } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { excludeReason } from './planner';
import { ingredientIdsFromName } from './recipeMaker';
import { t } from '../i18n';

// 집에 늘 있다고 보는 기본 재료(양념·육수·밥): 고르지 않아도 '더 필요'로 치지 않고, 고르면 쓰는 재료로 조금 더 쳐 줌
export const isBasic = (id) => ING[id]?.cat === '양념' || ['broth', 'rice', 'multigrain'].includes(id);

const MINOR = new Set(['onion', 'green_onion', 'garlic']);

export const PICK_CATS = [...CATEGORY_ORDER.filter((c) => c !== '양념'), '기타', '양념'];
// 화면에 보일 분류 이름: 긴 이름은 앞 낱말만 (재료 자료의 분류 이름 자체는 그대로 둠)
export const CAT_LABEL = { '두부·콩': '두부', '계란·유제품': '계란', '김치·가공': '김치' };
export const catLabel = (c) => t(CAT_LABEL[c] || c);
export const CAT_EMOJI = { 곡류: '🌾', 채소: '🥬', 버섯: '🍄', 과일: '🍎', '두부·콩': '🫘', 육류: '🥩', 수산물: '🐟', '계란·유제품': '🥚', '김치·가공': '🥫', 기타: '🍽️', 양념: '🧂' };

// 화면에 보일 짧은 이름: '국수(삶은 것)' → '국수', '버섯(느타리·표고)' → '버섯'
export const shortName = (name) => name.replace(/\s*[(（].*?[)）]\s*/g, '').trim();
// 화면에 보일 재료 이름 (지금 언어)
export const ingLabel = (id) => shortName(t(ING[id].name));

// 쌀밥·잡곡밥(곡류 맨 앞)과 양념도 고를 수 있음. 멸치육수·빵가루·밀가루는 뺌
export const PICK_ITEMS = INGREDIENTS.filter((i) => PICK_CATS.includes(i.cat) && !['broth', 'panko', 'flour'].includes(i.id));

// '기타' 분류: 식재료 DB에는 없지만 고를 수 있는 음식. ids는 해당 식재료, keys는 메뉴 이름에서 찾을 낱말
export const PICK_EXTRA = [
  { id: 'x_tteok', name: '떡', cat: '기타', ids: ['rice_cake'], keys: ['떡'] },
  { id: 'x_burger', name: '햄버거', cat: '기타', ids: [], keys: ['햄버거', '버거'] },
  { id: 'x_chueotang', name: '추어탕', cat: '기타', ids: [], keys: ['추어탕', '추어'] },
  { id: 'x_sushi', name: '쓰시', cat: '기타', ids: [], keys: ['초밥', '스시', '쓰시'] },
];
export const EXTRA_BY = Object.fromEntries(PICK_EXTRA.map((x) => [x.id, x]));

// 고른 '기타' 음식·사용자 재료를 [{name, ids, keys}]로 풀어 줌
function pickedWords(picked, custom) {
  const out = [];
  for (const id of picked) {
    if (EXTRA_BY[id]) { out.push(EXTRA_BY[id]); continue; }
    const c = custom.find((x) => x.id === id);
    if (c) out.push({ name: c.name, ids: ingredientIdsFromName(c.name), keys: [c.name] });
  }
  return out;
}

// 레시피 모음에 아직 없는 음식(예: 햄버거) — 결과 화면에서 '레시피 만들기'를 권함
export function dishesWithoutRecipe(picked, custom) {
  return pickedWords(picked, custom).filter((w) => !w.ids.length && !RECIPES.some((r) => w.keys.some((k) => r.title.includes(k)))).map((w) => w.name);
}

// 사용자가 추가한 재료 이름을 식재료 DB와 맞춰 봄 (같은 이름이면 그 재료로 처리)
export function matchIngredient(name) {
  const n = name.replace(/\s+/g, '').replace(/달걀/g, '계란');
  const same = PICK_ITEMS.find((i) => shortName(i.name).replace(/\s+/g, '') === n || i.name.replace(/\s+/g, '') === n);
  return same?.id || null;
}

// picked: 고른 id 목록(식재료 id, 'x_…' 기타 음식, 'c_…' 사용자 재료), custom: [{id, name, cat}]
export function recommend(picked, custom, profile, limit = 12) {
  const have = new Set(picked.filter((id) => ING[id]));
  const words = pickedWords(picked, custom);
  words.forEach((w) => w.ids.forEach((x) => have.add(x)));
  const hasMain = [...have].some((id) => !isBasic(id)) || words.some((w) => !w.ids.length);
  if (!have.size && !words.length) return [];

  const out = [];
  for (const r of RECIPES) {
    if (profile && excludeReason(r, profile)) continue;
    const used = [];
    const need = [];
    const inRecipe = new Set(r.items.map(([id]) => id));
    let subCount = 0;
    let basicCount = 0;
    for (const [id, g] of r.items) {
      if (!ING[id]) continue;
      if (isBasic(id)) { if (have.has(id)) { used.push({ id, name: ingLabel(id) }); basicCount++; } continue; }
      if (have.has(id)) { used.push({ id, name: ingLabel(id) }); continue; }
      // 대체 재료: 레시피에 이미 들어간 재료나 이미 대신 쓴 재료는 다시 쓰지 않음
      const alt = (r.subs?.[id] || []).find((x) => have.has(x) && !inRecipe.has(x) && !used.some((u) => u.id === x));
      if (alt) { used.push({ id: alt, name: t('{a}({b} 대신)', { a: ingLabel(alt), b: ingLabel(id) }) }); subCount++; }
      else need.push({ id, g, name: ingLabel(id) });
    }
    // DB에 없는 사용자 재료는 메뉴 이름에 들어 있으면 쓰는 것으로 봄
    for (const w of words) if (!w.ids.length && w.keys.some((k) => r.title.includes(k))) used.push({ id: null, name: t(w.name) });
    if (!used.length) continue;
    // 양념·밥 말고 다른 재료도 골랐다면, 양념·밥만 겹치는 메뉴는 빼서 추천이 흐려지지 않게
    if (basicCount === used.length && hasMain) continue;
    const time = (r.prep || 0) + (r.cook || 0);
    // 고른 재료를 많이 쓰고, 더 살 재료가 적고, 빨리·쉽게 만드는 메뉴가 위로 (파·양파·마늘은 덜 따짐)
    const needCost = need.reduce((s, n) => s + (MINOR.has(n.id) ? 0.5 : 1.5), 0);
    const score = (used.length - subCount - basicCount) * 3 + subCount * 1.5 + basicCount * 0.5 - needCost - time / 15 - ((r.difficulty || 1) - 1) * 2;
    out.push({ recipe: r, used, need, time, score });
  }
  out.sort((a, b) => b.score - a.score || a.time - b.time);
  return out.slice(0, limit);
}
