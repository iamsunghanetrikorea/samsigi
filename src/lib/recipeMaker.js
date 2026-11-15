// 메뉴 이름으로 1인분 레시피 초안을 만든다 (인터넷·AI 없이 앱 안에서 동작).
// 이름에서 요리 종류(찌개·국·볶음밥·덮밥…)와 주재료(김치·돼지고기·두부…)를 찾아
// 식재료 DB에 있는 재료로 재료량·조리 순서를 채운다. 60세 이상에 맞게 간을 싱겁게 잡는다.
import { ING } from '../data/ingredients';

// 이름 속 낱말 → 식재료 id, 1인분 양(g)
const WORDS = [
  [['순두부'], 'soft_tofu', 150], [['두부'], 'tofu', 120],
  [['김치'], 'kimchi', 60], [['된장'], 'doenjang', 12], [['고추장'], 'gochujang', 10],
  [['제육', '짜장', '돼지', '삼겹', '목살', '돈육', '수육', '보쌈'], 'pork', 80],
  [['불고기', '소고기', '쇠고기', '소갈비', '갈비탕', '갈비찜', '장조림', '육개장', '우거지'], 'beef', 70],
  [['닭가슴살'], 'chicken_breast', 90], [['닭', '치킨', '삼계'], 'chicken_thigh', 100],
  [['고등어'], 'mackerel', 90], [['연어'], 'salmon', 90], [['가자미', '생선'], 'flatfish', 90],
  [['동태', '명태', '황태', '북어'], 'pollock', 80], [['새우'], 'shrimp', 70],
  [['바지락', '조개', '해물', '짬뽕'], 'clam', 50],
  [['계란', '달걀', '오므', '에그'], 'egg', 100],
  [['콩나물'], 'bean_sprouts', 80], [['숙주'], 'mung_sprouts', 80], [['시금치'], 'spinach', 70],
  [['단호박', '호박죽'], 'pumpkin', 150], [['애호박', '호박'], 'zucchini', 80], [['감자', '볶음탕', '도리탕', '찜닭'], 'potato', 100],
  [['고구마'], 'sweet_potato', 120], [['버섯'], 'mushroom', 60], [['가지'], 'eggplant', 100],
  [['양배추'], 'cabbage', 80], [['배추'], 'napa', 80], [['무'], 'radish', 80],
  [['미역'], 'miyeok', 5], [['토마토'], 'tomato', 120], [['부추'], 'chives', 60],
  [['브로콜리'], 'broccoli', 70], [['깻잎'], 'perilla', 10], [['청경채'], 'bok_choy', 80],
  [['파프리카'], 'paprika', 60], [['양파'], 'onion', 50], [['당근'], 'carrot', 40], [['오이'], 'cucumber', 60],
  [['떡'], 'rice_cake', 150], [['치즈'], 'cheese', 20], [['들깨'], 'perilla_powder', 8],
  [['검은콩'], 'black_bean', 40], [['팥'], 'red_bean', 60], [['김밥', '김자반'], 'laver', 3],
  [['칼국수'], 'kalguksu', 220], [['냉면', '메밀', '소바'], 'buckwheat', 200], [['당면', '잡채'], 'glass_noodle', 100],
  [['파스타', '스파게티'], 'pasta', 200], [['국수', '우동', '라면', '면'], 'noodle', 200],
  [['토스트', '샌드위치', '빵'], 'bread', 70], [['오트밀'], 'oats', 40], [['요거트'], 'yogurt', 150],
];

// 요리 종류: 이름 끝·속 낱말로 판단. base는 늘 들어가는 재료, staple은 곁들이는 밥(없으면 null)
const TYPES = [
  { key: '죽', words: ['죽'], category: '한식', meals: ['breakfast', 'lunch'], soft: true, tags: ['죽'], staple: null, base: [['rice', 80], ['sesame_oil', 3], ['salt', 0.5]], prep: 5, cook: 20 },
  { key: '찌개', words: ['찌개', '짜글이', '전골'], category: '찌개', tags: ['국물'], staple: ['multigrain', 150], base: [['broth', 300], ['onion', 30], ['green_onion', 10], ['garlic', 3]], prep: 10, cook: 15 },
  { key: '국', words: ['국', '탕', '개장', '곰'], category: '국', soft: true, tags: ['국물'], staple: ['multigrain', 150], base: [['broth', 350], ['green_onion', 10], ['garlic', 3], ['soy', 4]], prep: 5, cook: 15 },
  { key: '볶음밥', words: ['볶음밥', '오므라이스'], category: '한식', meals: ['breakfast', 'lunch', 'dinner'], tags: ['간편'], staple: ['rice', 180], base: [['onion', 30], ['carrot', 20], ['green_onion', 10], ['oil', 5], ['salt', 0.5]], prep: 8, cook: 8 },
  { key: '비빔밥', words: ['비빔밥', '비빔'], category: '한식', tags: ['채소'], staple: ['multigrain', 170], base: [['spinach', 40], ['bean_sprouts', 40], ['carrot', 20], ['gochujang', 8], ['sesame_oil', 4]], prep: 15, cook: 10 },
  { key: '덮밥', words: ['덮밥', '카레', '짜장', '동'], category: '한식', tags: [], staple: ['multigrain', 170], base: [['onion', 50], ['soy', 6], ['starch', 4], ['oil', 4]], prep: 10, cook: 12 },
  { key: '김밥', words: ['김밥', '주먹밥'], category: '한식', meals: ['breakfast', 'lunch'], tags: ['간편'], staple: ['rice', 180], base: [['laver', 3], ['carrot', 30], ['cucumber', 30], ['sesame_oil', 3], ['salt', 0.5]], prep: 15, cook: 10, difficulty: 2 },
  { key: '면', words: ['국수', '칼국수', '우동', '라면', '냉면', '소바', '면'], category: '한식', meals: ['lunch'], tags: ['면'], staple: null, base: [['broth', 350], ['zucchini', 40], ['green_onion', 10], ['soy', 5]], prep: 5, cook: 12 },
  { key: '파스타', words: ['파스타', '스파게티'], category: '양식', meals: ['lunch', 'dinner'], tags: ['면'], staple: null, base: [['tomato', 100], ['onion', 30], ['garlic', 4], ['olive_oil', 6], ['salt', 0.5]], prep: 8, cook: 15 },
  { key: '빵', words: ['토스트', '샌드위치', '빵', '버거'], category: '양식', meals: ['breakfast', 'lunch'], tags: ['빵', '간편'], staple: null, base: [['cabbage', 30], ['tomato', 40], ['milk', 200]], prep: 8, cook: 5 },
  { key: '샐러드', words: ['샐러드'], category: '양식', meals: ['breakfast', 'lunch'], tags: ['채소', '간편'], staple: ['bread', 50], base: [['cabbage', 60], ['tomato', 60], ['cucumber', 40], ['olive_oil', 6], ['salt', 0.3]], prep: 10, cook: 0 },
  { key: '전', words: ['전', '부침', '부침개', '지짐', '파전'], category: '한식', tags: [], staple: ['multigrain', 140], base: [['flour', 40], ['egg', 25], ['green_onion', 15], ['oil', 6], ['salt', 0.5]], prep: 10, cook: 10 },
  { key: '조림', words: ['조림', '찜', '수육', '보쌈', '볶음탕', '도리탕', '찜닭'], category: '한식', soft: true, tags: [], staple: ['multigrain', 150], base: [['radish', 60], ['onion', 30], ['soy', 8], ['sugar', 3], ['garlic', 3], ['green_onion', 10]], prep: 10, cook: 20 },
  { key: '구이', words: ['구이', '스테이크', '바베큐'], category: '한식', tags: [], staple: ['multigrain', 150], base: [['oil', 4], ['salt', 0.5], ['spinach', 60], ['sesame_oil', 2]], prep: 5, cook: 12 },
  { key: '무침', words: ['무침', '나물', '겉절이', '쌈'], category: '한식', tags: ['채소'], staple: ['multigrain', 150], base: [['garlic', 2], ['sesame_oil', 3], ['soy', 4], ['sesame', 2]], prep: 10, cook: 5 },
  { key: '떡볶이', words: ['떡볶이', '라볶이'], category: '간식', meals: ['lunch', 'snack'], tags: ['간편'], staple: null, base: [['broth', 200], ['cabbage', 50], ['onion', 30], ['green_onion', 10], ['gochujang', 10], ['sugar', 3]], prep: 5, cook: 12 },
  { key: '말이', words: ['말이', '오믈렛', '스크램블', '계란찜', '달걀찜'], category: '한식', meals: ['breakfast', 'lunch', 'dinner'], soft: true, tags: ['간편'], staple: ['multigrain', 150], base: [['onion', 20], ['carrot', 15], ['green_onion', 10], ['oil', 4], ['salt', 0.4]], prep: 5, cook: 8 },
  { key: '간식', words: ['떡볶이', '라볶이', '호떡', '경단', '찐', '군', '스무디', '라떼', '과일'], category: '간식', meals: ['snack'], tags: ['간편'], staple: null, base: [], prep: 5, cook: 10 },
  { key: '볶음', words: ['볶음', '불고기', '제육', '두루치기', '잡채', '탕수육', '깐풍'], category: '한식', tags: [], staple: ['multigrain', 150], base: [['onion', 40], ['carrot', 20], ['green_onion', 10], ['garlic', 3], ['soy', 6], ['oil', 4]], prep: 10, cook: 10 },
];
const DEFAULT_TYPE = TYPES.find((t) => t.key === '볶음');
const CHINESE = ['짜장', '짬뽕', '마파', '탕수', '깐풍', '팔보', '유산슬', '양장', '고추잡채', '마라'];
const WESTERN = ['파스타', '스파게티', '스테이크', '샐러드', '리조또', '그라탕', '수프', '스프', '오믈렛', '피자'];
const EMOJI = { 죽: '🥣', 찌개: '🍲', 국: '🥣', 볶음밥: '🍳', 비빔밥: '🥗', 덮밥: '🍛', 김밥: '🍙', 면: '🍜', 파스타: '🍝', 빵: '🥪', 샐러드: '🥗', 전: '🥞', 조림: '🍖', 구이: '🍖', 무침: '🥬', 간식: '🍡', 볶음: '🍳' };

function findType(name) {
  if (name.includes('짜장')) return TYPES.find((t) => t.key === '덮밥');
  // 이름 끝에 가까운 낱말일수록 요리 종류를 잘 나타냄 (예: '김치볶음밥' → 볶음밥)
  let best = null;
  for (const t of TYPES) for (const w of t.words) {
    const at = name.lastIndexOf(w);
    if (at < 0) continue;
    const score = (at + w.length) * 3 + w.length;
    if (!best || score > best.score) best = { t, score };
  }
  return best?.t || DEFAULT_TYPE;
}

function findIngredients(name) {
  const found = [];
  let rest = name;
  for (const [words, id, g] of WORDS) {
    const w = words.find((x) => rest.includes(x));
    if (!w) continue;
    rest = rest.replace(w, ' '); // '순두부'를 찾은 뒤 '두부'를 또 찾지 않도록
    if (!found.some(([x]) => x === id)) found.push([id, g]);
  }
  return found;
}

const has = (items, id) => items.some(([x]) => x === id);
const nm = (id) => ING[id]?.name.replace(/\(.*\)/, '').trim();
const isProtein = (id) => ['육류', '수산물', '두부·콩'].includes(ING[id]?.cat) && !['broth', 'miyeok', 'laver'].includes(id) || id === 'egg';
const josa = (word, a, b) => { const c = word.charCodeAt(word.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
const list = (ids) => ids.map(nm).join('·');

// 단백질 보충 재료를 주재료처럼 조리 순서에 넣는 요리 종류 (나머지는 '곁들여 주세요' 단계 추가)
const MERGE_EXTRA = new Set(['찌개', '국', '덮밥', '볶음', '조림', '구이']);
// 밥이 요리 안에 들어 있어 이름 뒤에 '…와 잡곡밥'을 붙이지 않는 종류
const RICE_IN = new Set(['죽', '볶음밥', '비빔밥', '덮밥', '김밥']);

function steps(type, items, found, extra) {
  const mains = found.filter(([id]) => isProtein(id)).map(([id]) => id);
  const vegs = items.filter(([id]) => (['채소', '버섯'].includes(ING[id]?.cat) || ['kimchi', 'miyeok'].includes(id)) && !['garlic', 'green_onion'].includes(id)).map(([id]) => id);
  if (extra && MERGE_EXTRA.has(type.key)) { mains.push(extra); extra = null; }
  const out = baseSteps(type, items, mains, vegs);
  if (extra) out.splice(out.length - 1, 0, [extra === 'tofu' ? '두부를 한입 크기로 썰어 함께 넣어 주세요. 단백질을 채워 줘요.' : '달걀 하나를 부치거나 삶아 곁들여 단백질을 채워 주세요.', extra === 'egg' ? 5 : undefined]);
  return out.map((x) => (x[1] ? x : [x[0]]));
}

function baseSteps(type, items, mains, vegs) {
  const m = list(mains) || '주재료', v = list(vegs) || '채소';
  const sauce = has(items, 'gochujang') ? '고추장' : has(items, 'doenjang') ? '된장' : has(items, 'red_pepper') ? '고춧가루' : '간장';
  const onStaple = items.some(([id]) => ['noodle', 'buckwheat', 'kalguksu', 'pasta', 'glass_noodle'].includes(id)) ? '삶은 면' : '밥';
  switch (type.key) {
    case '찌개': return [[`${m}${josa(m, '은', '는')} 한입 크기로, ${v}${josa(v, '은', '는')} 먹기 좋게 썰어 주세요.`], [`냄비에 육수를 붓고 ${sauce}${josa(sauce, '을', '를')} 풀어 끓여 주세요.`, 3], [`${m}${josa(m, '과', '와')} ${v}${josa(v, '을', '를')} 넣고 중간 불로 끓여 주세요.`, 10], ['마늘·대파를 넣고 한소끔 더 끓여 밥과 함께 드세요. 간은 싱겁게 해 주세요.', 2]];
    case '국': return [[`${m}${josa(m, '과', '와')} ${v}${josa(v, '을', '를')} 먹기 좋게 썰어 주세요.`], [`냄비에 육수를 붓고 ${m}${josa(m, '을', '를')} 넣어 끓여 주세요.`, 8], [`${v}${josa(v, '을', '를')} 넣고 부드러워질 때까지 끓여 주세요.`, 5], ['간장 조금으로 간하고 대파를 넣어 밥과 함께 드세요.']];
    case '죽': return [[`${m === '주재료' ? '' : `${m}, `}${v}${josa(v, '을', '를')} 잘게 다져 주세요.`], ['냄비에 참기름을 두르고 다진 재료를 볶아 주세요.', 3], ['밥과 물 2컵을 넣고 저어 가며 걸쭉해질 때까지 끓여 주세요.', 15], ['소금 조금으로 간해 따뜻하게 드세요.']];
    case '볶음밥': {
      const meat = list(mains.filter((id) => id !== 'egg'));
      return [[`${v}${meat ? `·${meat}` : ''}${josa(meat || v, '을', '를')} 잘게 썰어 주세요.`], [`기름 두른 팬에 ${meat || '채소'}${josa(meat || '채소', '을', '를')} 먼저 볶아 주세요.`, 3], ['채소와 밥을 넣고 고루 볶아 주세요.', 4], ...(mains.includes('egg') ? [['달걀을 풀어 얇게 부쳐 밥 위에 덮거나, 팬 한쪽에서 익혀 섞어 주세요.', 3]] : []), ['소금 조금으로 간하고 대파를 뿌려 주세요.']];
    }
    case '비빔밥': return [['시금치·콩나물은 데쳐 참기름 조금에 무치고, 당근은 채 썰어 볶아 주세요.', 5], [m === '주재료' ? '달걀을 부쳐 주세요.' : `${m}${josa(m, '을', '를')} 익혀 주세요.`, 4], ['밥 위에 나물과 고명을 둘러 담아 주세요.'], ['고추장은 반 숟가락만 넣어 비벼 드세요.']];
    case '덮밥': return [[`${m}${josa(m, '과', '와')} ${v}${josa(v, '을', '를')} 한입 크기로 썰어 주세요.`], [`기름 두른 팬에 ${m}${josa(m, '을', '를')} 볶다가 ${v}${josa(v, '을', '를')} 넣어 볶아 주세요.`, 5], ['물 반 컵과 간장을 넣고 끓으면 전분물로 걸쭉하게 해 주세요.', 3], [`${onStaple} 위에 듬뿍 올려 주세요.`]];
    case '김밥': return [['밥에 참기름·소금 조금을 넣어 섞어 주세요.'], [`${m === '주재료' ? '' : `${m}${josa(m, '은', '는')} 익혀 길게 썰고, `}당근은 채 썰어 볶고 오이는 길게 썰어 주세요.`, 6], ['김 위에 밥을 얇게 펴고 재료를 올려 단단히 말아 주세요.'], ['한입 크기로 썰어 주세요.']];
    case '면': return [[`${m === '주재료' ? '' : `${m}, `}${v}${josa(v, '을', '를')} 먹기 좋게 썰어 주세요.`], ['육수를 끓이고 재료를 넣어 익혀 주세요.', 6], ['면을 따로 삶아 찬물에 헹궈 그릇에 담아 주세요.', 5], ['국물을 붓고 간장 조금으로 간해 주세요. 국물은 다 마시지 않는 게 좋아요.']];
    case '파스타': return [['파스타를 끓는 물에 삶아 주세요.', 9], [`올리브유에 마늘과 ${m === '주재료' ? '' : `${m}, `}${v}${josa(v, '을', '를')} 볶아 주세요.`, 4], ['토마토를 넣고 으깨 가며 끓여 소스를 만들어 주세요.', 4], ['삶은 파스타를 넣어 버무리고 소금 조금으로 간해 주세요.']];
    case '빵': return [['채소를 씻어 얇게 썰어 주세요.'], [m === '주재료' ? '빵을 노릇하게 구워 주세요.' : `${m}${josa(m, '을', '를')} 익혀 주세요.`, 4], ['빵에 재료를 올려 주세요.'], ['우유 한 잔과 함께 드세요.']];
    case '샐러드': return [['채소를 씻어 물기를 빼고 한입 크기로 썰어 주세요.'], [m === '주재료' ? '견과류나 달걀을 곁들이면 단백질이 늘어요.' : `${m}${josa(m, '을', '를')} 익혀 식혀 주세요.`, 5], ['올리브유·소금 조금으로 버무려 주세요.'], ['빵을 곁들여 드세요.']];
    case '전': return [[`${m === '주재료' ? '' : `${m}, `}${v}${josa(v, '을', '를')} 잘게 썰어 주세요.`], ['밀가루·달걀·물 조금에 재료를 넣어 반죽해 주세요.'], ['기름 두른 팬에 얇게 펴서 앞뒤로 노릇하게 부쳐 주세요.', 8], ['간장 대신 초간장을 조금만 찍어 드세요.']];
    case '조림': return [[`${m}${josa(m, '과', '와')} ${v}${josa(v, '을', '를')} 큼직하게 썰어 주세요.`], [`냄비에 ${has(items, 'radish') ? '무를 깔고 ' : ''}재료를 담아 주세요.`], ['간장·설탕·마늘·물 1컵을 부어 중약불에서 졸여 주세요.', 20], ['대파를 올려 밥과 함께 드세요.']];
    case '구이': return [[`${m}${josa(m, '을', '를')} 손질해 소금 조금만 뿌려 주세요.`], ['기름 두른 팬에 중약불로 앞뒤를 노릇하게 구워 주세요.', 10], ['시금치는 데쳐 참기름 조금에 무쳐 주세요.', 2], ['밥과 함께 드세요.']];
    case '무침': return [[`${v === '채소' ? m : v}${josa(v === '채소' ? m : v, '을', '를')} 씻어 손질해 주세요.`], ['끓는 물에 살짝 데쳐 물기를 꼭 짜 주세요.', 2], ['간장·마늘·참기름·깨로 조물조물 무쳐 주세요.'], ['밥과 함께 드세요.']];
    case '떡볶이': return [['떡은 물에 헹구고, 양배추·양파·대파는 먹기 좋게 썰어 주세요.'], ['육수에 고추장 반 숟가락과 설탕 조금을 풀어 끓여 주세요.', 3], ['떡과 채소를 넣고 떡이 말랑해질 때까지 저어 가며 끓여 주세요.', 8], ['대파를 넣고 불을 꺼 주세요. 맵지 않게 고추장은 조금만 넣어요.']];
    case '말이': return [['양파·당근·대파를 아주 잘게 다져 주세요.'], ['달걀을 풀고 다진 채소와 소금 조금을 섞어 주세요.'], ['기름 두른 팬에 약한 불로 얇게 부어 가장자리가 익으면 돌돌 말아 주세요.', 6], ['한 김 식혀 먹기 좋게 썰어 밥과 함께 드세요.']];
    case '간식': return [['재료를 먹기 좋게 손질해 주세요.'], ['찌거나 데워 익혀 주세요.', 10], ['한 번에 조금씩 천천히 드세요.']];
    default: return [[`${m}${josa(m, '과', '와')} ${v}${josa(v, '을', '를')} 한입 크기로 썰어 주세요.`], [`기름 두른 팬에 ${m}${josa(m, '을', '를')} 먼저 볶아 주세요.`, 4], [`${v}${josa(v, '과', '와')} ${sauce} 양념을 넣어 고루 볶아 주세요.`, 4], ['대파·마늘을 넣고 한 번 더 볶아 밥과 함께 드세요.']];
  }
}

export function makeRecipe(rawName) {
  const name = rawName.trim().replace(/\s+/g, ' ');
  const type = findType(name);
  const found = findIngredients(name.replace(/\s/g, '').replace(/무침|무생채/g, (w) => (w === '무생채' ? '무' : '')));
  const items = [...found];
  for (const [id, g] of type.base) if (!has(items, id)) items.push([id, g]);
  const soup = type.key === '찌개' || type.key === '국';
  if (soup && has(items, 'kimchi')) { if (!has(items, 'red_pepper')) items.push(['red_pepper', 2]); if (!items.some(([id]) => isProtein(id))) items.unshift(['pork', 50]); }
  // 국·찌개에 채소가 하나도 없으면 무(국)·애호박(찌개)을 넣음
  if (soup && !items.some(([id]) => ['채소', '버섯'].includes(ING[id]?.cat) && !['garlic', 'green_onion', 'onion'].includes(id) || ['kimchi', 'miyeok'].includes(id))) items.push(type.key === '국' ? ['radish', 50] : ['zucchini', 50]);
  // 단백질 재료가 없으면 두부(국물) 또는 달걀을 넣어 한 끼 단백질을 채움
  let extra = null;
  if (!['간식', '떡볶이'].includes(type.key) && !items.some(([id]) => isProtein(id))) { extra = MERGE_EXTRA.has(type.key) ? 'tofu' : 'egg'; items.push(extra === 'tofu' ? ['tofu', 100] : ['egg', 50]); }
  const hasStaple = items.some(([id]) => ING[id]?.staple);
  if (type.staple && !hasStaple) items.push(type.staple);
  if (type.key === '간식' && !items.length) items.push(['sweet_potato', 120]);

  const category = CHINESE.some((w) => name.includes(w)) ? '중식' : WESTERN.some((w) => name.includes(w)) ? '양식' : type.category;
  const tags = new Set(type.tags);
  if (items.some(([id]) => ING[id]?.cat === '육류')) tags.add('고기');
  if (items.some(([id]) => ['mackerel', 'salmon', 'flatfish', 'pollock'].includes(id))) tags.add('생선');
  if (items.filter(([id]) => ING[id]?.cat === '채소').length >= 3) tags.add('채소');
  const staple = items.find(([id]) => ING[id]?.staple);
  const title = staple && ['multigrain', 'rice'].includes(staple[0]) && !RICE_IN.has(type.key) && !/밥|죽/.test(name) ? `${name}${josa(name, '과', '와')} ${nm(staple[0])}` : name;

  return {
    id: `my_${Date.now().toString(36)}`,
    title, category, emoji: EMOJI[type.key] || '🍽️',
    meals: type.meals || ['lunch', 'dinner'], main: `my_${name}`,
    prep: type.prep, cook: type.cook, difficulty: type.difficulty || 1,
    soft: !!type.soft, tags: [...tags], subs: {},
    items, steps: steps(type, items, found.concat(items.filter(([id]) => ['pork'].includes(id) && !has(found, id))), extra),
    tip: '메뉴 이름으로 자동으로 만든 레시피예요. 재료와 순서를 집에서 드시는 방식에 맞게 고쳐 쓰세요.',
    source: '내가 추가한 메뉴 (앱이 메뉴 이름으로 만든 초안, 저염 조정)',
    isCustom: true,
  };
}

// 미리 보기 화면에서 고르는 재료 목록
export const INGREDIENT_OPTIONS = Object.values(ING).map((i) => ({ id: i.id, name: i.name, cat: i.cat }));
