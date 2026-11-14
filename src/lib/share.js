// 오늘의 세 끼 레시피를 텍스트로 만들어 ChatGPT로 보내기 (서버·API 키 불필요)
import { ING } from '../data/ingredients';
import { MEAL_LABEL } from '../data/recipes';
import { MEAL_KEYS, entryNutrition, round } from './nutrition';
import { fmtDate } from './date';

export const GPT_PROMPT = '아래는 60세 이상 어르신을 위한 오늘의 세 끼 레시피입니다. 어르신이 따라 하기 쉽게 짧은 문장으로 정리해 주시고, 세 끼를 효율적으로 준비하는 순서(미리 손질해 둘 것 포함)와 장보기 체크리스트도 만들어 주세요. 영양 수치는 추정치입니다.';

const amount = (id, g) => {
  const ing = ING[id];
  if (ing.cat === '양념') return g >= 1 ? `${round(g)}${ing.unit}` : '약간';
  return `${g >= 10 ? Math.round(g) : round(g, 1)}${ing.unit}`;
};

export const GPT_RECIPE_PROMPT = '아래 레시피를 60세 이상 어르신이 따라 하기 쉽게 단계별로 자세히 설명해 주세요. 손질 요령, 불 세기, 익었는지 확인하는 방법, 싱겁게 먹는 요령, 남은 재료 보관법도 알려 주세요. 영양 수치는 추정치입니다.';

// 레시피 상세 화면의 현재 상태(인분·대체 재료·주식 양 조절)를 그대로 텍스트로
export function recipeText({ recipe, items, servings, nutrition, mealLabel, dateLabel }) {
  const out = [`[${dateLabel ? `${dateLabel} ` : ''}${mealLabel ? `${mealLabel} ` : ''}레시피] ${recipe.title}`];
  out.push(`- ${servings}인분, 준비 ${recipe.prep}분 · 조리 ${recipe.cook}분`);
  out.push(`- 1인분 영양(추정): ${round(nutrition.kcal)}kcal, 탄수화물 ${round(nutrition.carb)}g, 단백질 ${round(nutrition.protein)}g, 지방 ${round(nutrition.fat)}g, 나트륨 ${round(nutrition.sodium)}mg`);
  out.push(`- 재료(${servings}인분): ${items.map((i) => `${ING[i.id].name} ${amount(i.id, i.g * servings)}`).join(', ')}`);
  const subs = items.filter((i) => i.orig && i.orig !== i.id);
  if (subs.length) out.push(`- 바꾼 재료: ${subs.map((i) => `${ING[i.orig].name} → ${ING[i.id].name}`).join(', ')}`);
  out.push('- 만드는 법:');
  recipe.steps.forEach(([t, min], i) => out.push(`  ${i + 1}) ${t}${min ? ` (약 ${min}분)` : ''}`));
  if (recipe.tip) out.push(`- 팁: ${recipe.tip}`);
  return out.join('\n');
}

export function todayRecipesText(plans, targets, date) {
  const day = plans[date] || {};
  const out = [`[${fmtDate(date)} 오늘의 세 끼 레시피]`];
  for (const k of MEAL_KEYS) {
    const e = day[k];
    if (!e) continue;
    if (e.eatOut) { out.push('', `■ ${MEAL_LABEL[k]}: 외식 (${e.eatOut.name})`); continue; }
    const n = entryNutrition(e, k, targets);
    if (!n) continue;
    const r = n.recipe; const s = e.servings || 1;
    out.push('', `■ ${MEAL_LABEL[k]}: ${r.title} (${s}인분, 약 ${r.prep + r.cook}분)`);
    out.push(`- 1인분 영양(추정): ${round(n.kcal)}kcal, 탄수화물 ${round(n.carb)}g, 단백질 ${round(n.protein)}g, 지방 ${round(n.fat)}g, 나트륨 ${round(n.sodium)}mg`);
    out.push(`- 재료: ${n.items.map((i) => `${ING[i.id].name} ${amount(i.id, i.g * s)}`).join(', ')}`);
    out.push('- 만드는 법:');
    r.steps.forEach(([t, min], i) => out.push(`  ${i + 1}) ${t}${min ? ` (약 ${min}분)` : ''}`));
    if (r.tip) out.push(`- 팁: ${r.tip}`);
  }
  return out.length > 1 ? out.join('\n') : '';
}

// ChatGPT 새 대화에 내용을 채워서 열기. 주소가 너무 길면 빈 대화를 열고 붙여넣기 안내
const MAX_URL = 7500;
export function chatGptUrl(text) {
  const url = `https://chatgpt.com/?q=${encodeURIComponent(text)}`;
  return url.length <= MAX_URL ? { url, prefilled: true } : { url: 'https://chatgpt.com/', prefilled: false };
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}
