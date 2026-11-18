// 오늘의 세 끼 레시피를 텍스트로 만들어 ChatGPT로 보내기 (서버·API 키 불필요)
import { ING } from '../data/ingredients';
import { MEAL_LABEL } from '../data/recipes';
import { MEAL_KEYS, entryNutrition, round } from './nutrition';
import { fmtDate } from './date';
import { t } from '../i18n';

export const GPT_PROMPT = '아래는 60세 이상 어르신을 위한 오늘의 세 끼 레시피입니다. 어르신이 따라 하기 쉽게 짧은 문장으로 정리해 주시고, 세 끼를 효율적으로 준비하는 순서(미리 손질해 둘 것 포함)와 장보기 체크리스트도 만들어 주세요. 영양 수치는 추정치입니다.';

const amount = (id, g) => {
  const ing = ING[id];
  if (ing.cat === '양념') return g >= 1 ? `${round(g)}${ing.unit}` : t('약간');
  return `${g >= 10 ? Math.round(g) : round(g, 1)}${ing.unit}`;
};

export const GPT_RECIPE_PROMPT = '아래 레시피를 60세 이상 어르신이 따라 하기 쉽게 단계별로 자세히 설명해 주세요. 손질 요령, 불 세기, 익었는지 확인하는 방법, 싱겁게 먹는 요령, 남은 재료 보관법도 알려 주세요. 영양 수치는 추정치입니다.';

// 화면에서 쓰는 프롬프트: 지금 언어로 (상수는 한국어 그대로 둠 — 테스트에서 씀)
export const gptPrompt = () => t(GPT_PROMPT);
export const gptRecipePrompt = () => t(GPT_RECIPE_PROMPT);

const ingName = (id) => t(ING[id].name);
const stepLine = (s, min, i) => `  ${i + 1}) ${t(s)}${min ? t(' (약 {min}분)', { min }) : ''}`;
const nutLine = (n) => t('- 1인분 영양(추정): {kcal}kcal, 탄수화물 {carb}g, 단백질 {protein}g, 지방 {fat}g, 나트륨 {sodium}mg', { kcal: round(n.kcal), carb: round(n.carb), protein: round(n.protein), fat: round(n.fat), sodium: round(n.sodium) });

// 레시피 상세 화면의 현재 상태(인분·대체 재료·주식 양 조절)를 그대로 텍스트로
export function recipeText({ recipe, items, servings, nutrition, mealLabel, dateLabel }) {
  const out = [t('[{when}레시피] {title}', { when: `${dateLabel ? `${dateLabel} ` : ''}${mealLabel ? `${mealLabel} ` : ''}`, title: t(recipe.title) })];
  out.push(t('- {n}인분, 준비 {prep}분 · 조리 {cook}분', { n: servings, prep: recipe.prep, cook: recipe.cook }));
  out.push(nutLine(nutrition));
  out.push(t('- 재료({n}인분): {list}', { n: servings, list: items.map((i) => `${ingName(i.id)} ${amount(i.id, i.g * servings)}`).join(', ') }));
  const subs = items.filter((i) => i.orig && i.orig !== i.id);
  if (subs.length) out.push(t('- 바꾼 재료: {list}', { list: subs.map((i) => `${ingName(i.orig)} → ${ingName(i.id)}`).join(', ') }));
  out.push(t('- 만드는 법:'));
  recipe.steps.forEach(([s, min], i) => out.push(stepLine(s, min, i)));
  if (recipe.tip) out.push(t('- 팁: {tip}', { tip: t(recipe.tip) }));
  return out.join('\n');
}

export function todayRecipesText(plans, targets, date) {
  const day = plans[date] || {};
  const out = [t('[{date} 오늘의 세 끼 레시피]', { date: fmtDate(date) })];
  for (const k of MEAL_KEYS) {
    const e = day[k];
    if (!e) continue;
    if (e.eatOut) { out.push('', t('■ {meal}: 외식 ({name})', { meal: t(MEAL_LABEL[k]), name: e.eatOut.name })); continue; }
    const n = entryNutrition(e, k, targets);
    if (!n) continue;
    const r = n.recipe; const s = e.servings || 1;
    out.push('', t('■ {meal}: {title} ({n}인분, 약 {min}분)', { meal: t(MEAL_LABEL[k]), title: t(r.title), n: s, min: r.prep + r.cook }));
    out.push(nutLine(n));
    out.push(t('- 재료: {list}', { list: n.items.map((i) => `${ingName(i.id)} ${amount(i.id, i.g * s)}`).join(', ') }));
    out.push(t('- 만드는 법:'));
    r.steps.forEach(([st, min], i) => out.push(stepLine(st, min, i)));
    if (r.tip) out.push(t('- 팁: {tip}', { tip: t(r.tip) }));
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

// 확인 창 없이 바로 ChatGPT로 보내기 — 팝업 차단을 피하려고 클릭 처리 중에 먼저 창을 연다
export function sendToChatGptNow(text, notify) {
  const { url, prefilled } = chatGptUrl(text);
  window.open(url, '_blank', 'noopener,noreferrer');
  copyText(text).then((ok) => notify?.(prefilled
    ? t('ChatGPT 새 대화에 레시피를 담아 열었어요.')
    : (ok ? t('내용이 길어 복사해 두었어요. ChatGPT 입력창에 붙여넣기 해 주세요.') : t('ChatGPT를 열었어요. 레시피 화면에서 내용을 복사해 붙여넣어 주세요.'))));
}

// 구글 검색으로 열기 — 맨 위 'AI 개요'가 답하고 아래에 동영상·이미지가 함께 나옴
// (AI 모드 주소 udm=50으로 다른 사이트에서 들어가면 구글이 '이 검색을 계속하시겠습니까?' 확인 창을 띄워서 일반 검색을 씀)
export function googleAiUrl(q) {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// 장보기 '인공지능 레시피추천': 고른 재료로 아침에 가볍게 먹을 메뉴를 찾는 짧은 검색어 (재료 이름만 보냄)
export function breakfastAiPrompt(names = []) {
  return [t('어르신 아침에 가볍게 먹기 좋은 메뉴 추천'), ...names.slice(0, 6), t('쉬운 레시피')].join(' ');
}
