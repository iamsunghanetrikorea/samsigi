// 장보기 목록: 식단 재료 합산 → 보유량 차감 → 보관기간 고려 분할 → 예상 식비
import { ING, CATEGORY_ORDER, buyForm } from '../data/ingredients';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEAL_KEYS, entryNutrition } from './nutrition';
import { addDays, diffDays, fmtDate } from './date';
import { t } from '../i18n';

// 보관기간에 따른 장보기 회차: 오래 두는 재료는 첫 장보기, 빨리 상하는 재료는 주/반주 단위로 나눔
function tripOf(ing, dayIndex) {
  if (ing.storage >= 14) return 0;
  const week = Math.floor(dayIndex / 7);
  if (ing.storage >= 4) return week * 2;
  return week * 2 + ((dayIndex % 7) >= 4 ? 1 : 0);
}

export function buildShopping(state, targets, dates, { split = true } = {}) {
  if (!dates.length) return { trips: [], total: 0, homeMeals: 0 };
  const start = dates[0];
  const prices = state.shopping?.prices || {};
  const map = new Map(); // key trip|id
  let homeMeals = 0;
  for (const d of dates) {
    for (const k of MEAL_KEYS) {
      const e = state.plans[d]?.[k];
      if (!e || e.eatOut) continue;
      const n = entryNutrition(e, k, targets);
      if (!n?.items) continue;
      homeMeals++;
      const servings = e.servings || 1;
      for (const it of n.items) {
        const ing = ING[it.id];
        const trip = split ? tripOf(ing, diffDays(start, d)) : 0;
        const key = `${trip}|${it.id}`;
        const row = map.get(key) || { trip, id: it.id, need: 0, uses: new Set() };
        row.need += it.g * servings;
        row.uses.add(RECIPE_BY_ID[e.recipeId].title);
        map.set(key, row);
      }
    }
  }
  // 보유량은 이른 회차부터 차감
  const remaining = { ...(state.pantry || {}) };
  const rows = [...map.values()].sort((a, b) => a.trip - b.trip);
  let total = 0;
  for (const r of rows) {
    const ing = ING[r.id];
    const own = Math.min(remaining[r.id] || 0, r.need);
    remaining[r.id] = (remaining[r.id] || 0) - own;
    r.owned = own;
    r.toBuy = Math.max(0, r.need - own);
    const bf = buyForm(r.id, r.toBuy);
    r.buyName = bf.name; r.buyGrams = bf.grams; r.unit = bf.unit;
    r.needBuy = buyForm(r.id, r.need).grams;
    r.price = prices[r.id] ?? ing.price;
    r.cost = (bf.grams / 100) * r.price;
    r.cat = ing.cat;
    r.uses = [...r.uses];
    total += r.cost;
  }
  const tripMap = new Map();
  for (const r of rows) {
    if (!tripMap.has(r.trip)) {
      const offset = Math.floor(r.trip / 2) * 7 + (r.trip % 2 ? 4 : 0);
      const date = addDays(start, offset);
      tripMap.set(r.trip, { trip: r.trip, date, label: r.trip === 0 ? t('첫 장보기 · {date}', { date: fmtDate(date) }) : t('{date} 장보기', { date: fmtDate(date) }), rows: [] });
    }
    tripMap.get(r.trip).rows.push(r);
  }
  const trips = [...tripMap.values()].map((t) => ({
    ...t,
    rows: t.rows.sort((a, b) => CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat) || a.buyName.localeCompare(b.buyName, 'ko')),
    cost: t.rows.reduce((s, r) => s + r.cost, 0),
  }));
  return { trips, total, homeMeals };
}

// 보유(남은) 재료로 만들 수 있는 메뉴 추천
export function leftoverRecipes(pantry, limit = 6) {
  const owned = Object.entries(pantry || {}).filter(([id, g]) => g > 0 && ING[id] && ING[id].cat !== '양념').map(([id]) => id);
  if (!owned.length) return [];
  return RECIPES.map((r) => {
    const used = r.items.filter(([id]) => owned.includes(id)).map(([id]) => ING[id].name);
    return { recipe: r, used };
  }).filter((x) => x.used.length).sort((a, b) => b.used.length - a.used.length).slice(0, limit);
}
