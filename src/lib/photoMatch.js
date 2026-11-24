// 사진이 없는 메뉴(내가 추가한 레시피·검색 메뉴)에 가장 비슷한 메뉴의 사진을 찾아 줍니다.
// 이름이 얼마나 겹치는지 + 재료가 얼마나 같은지 + 분류가 같은지를 점수로 매겨 고릅니다.
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { PACK } from '../data/recipePack';
import { PHOTOS } from '../data/photos';
import { ING } from '../data/ingredients';

const norm = (s) => (s || '').replace(/[\s(){}[\]·,.]/g, '').replace(/달걀/g, '계란').toLowerCase();
// 어느 요리에나 들어가는 재료는 비슷함의 근거로 치지 않음
const isBasic = (id) => ING[id]?.cat === '양념' || ['broth', 'rice', 'multigrain', 'water'].includes(id);

// 두 이름에서 겹치는 가장 긴 토막의 길이 (예: '김치찌개'와 '돼지고기 김치찌개(싱겁게)' → 4)
function commonRun(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best + 1; j <= a.length; j++) {
      if (b.includes(a.slice(i, j))) best = j - i; else break;
    }
  }
  return best;
}

function score(target, cand) {
  const ct = norm(cand.title);
  const run = commonRun(norm(target.title), ct);
  // 겹친 토막이 길수록, 그리고 그 토막이 상대 이름의 큰 부분일수록 더 닮은 것으로 봄
  let s = run >= 2 ? run * 4 + (run / Math.max(ct.length, 1)) * 8 : 0;
  const mine = new Set((target.items || []).map(([id]) => id).filter((id) => !isBasic(id)));
  const theirs = new Set((cand.items || []).map(([id]) => id).filter((id) => !isBasic(id)));
  if (mine.size && theirs.size) {
    let same = 0;
    for (const id of mine) if (theirs.has(id)) same += 1;
    s += (same / Math.max(mine.size, theirs.size)) * 10;
  }
  if (target.category && target.category === cand.category) s += 3;
  if (target.meals?.length && cand.meals?.some((m) => target.meals.includes(m))) s += 1;
  return s;
}

// 사진이 있는 메뉴들 (사진 파일 이름 = 메뉴 id) — 아직 추가하지 않은 추천 메뉴 사진도 빌려 씀
function withPhoto() {
  const seen = new Set();
  const out = [];
  for (const r of [...RECIPES, ...PACK]) {
    if (!PHOTOS[r.id] || seen.has(r.id)) continue;
    seen.add(r.id); out.push(r);
  }
  return out;
}

// 이 메뉴에 쓸 사진 id — 자기 사진이 있으면 그것, 없으면 가장 비슷한 메뉴의 사진 (없으면 null)
export function photoIdFor(recipe) {
  if (!recipe) return null;
  if (PHOTOS[recipe.id]) return recipe.id;
  let best = null, bestScore = 4; // 이만큼도 안 닮았으면 이모지를 그대로 둠
  for (const cand of withPhoto()) {
    const s = score(recipe, cand);
    if (s > bestScore) { bestScore = s; best = cand.id; }
  }
  return best;
}

// 이름만 있는 메뉴에 쓸 사진 id
export const photoIdForName = (name) => photoIdFor({ title: name, items: [] });

// 사진 주소 (없으면 null)
export const photoUrl = (recipe) => { const id = photoIdFor(recipe); return id ? `./photos/${id}.webp` : null; };

// 그 사진이 다른 메뉴에서 빌려온 것인지 (화면에 '비슷한 메뉴 사진'이라고 알려 주려고)
export function borrowedFrom(recipe) {
  const id = photoIdFor(recipe);
  if (!id || id === recipe?.id) return null;
  return (RECIPE_BY_ID[id] || PACK.find((r) => r.id === id))?.title || null;
}
