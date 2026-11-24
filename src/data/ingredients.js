// 식재료 및 100g당 영양 데이터
import { t, getLang } from '../i18n';
// 수치는 농촌진흥청 「국가표준식품성분표」(제10개정)·식품의약품안전처 식품영양성분 DB의
// 대표값을 참고해 반올림한 '추정치'입니다. 실제 서비스 전 원자료와 대조 검증이 필요합니다. (docs/DATA_SOURCES.md)
//
// 필드: kcal, carb(g), protein(g), fat(g), sodium(mg) — 모두 가식부 100g(mL) 기준
// price: 구매 형태 기준 100g당 예상 단가(원), storage: 냉장 보관 가능 일수(대략)
// seasons: 제철 월, staple: 주식(밥·면 등, 열량 목표에 맞춰 양을 조절)
// buyAs: 조리 후 중량을 구매 형태로 환산 (예: 밥 100g ≈ 쌀 45g)
// piece: 개수 단위 표시, spoon: 작은술(5mL) 1개의 무게(g)

export const NUTRITION_SOURCE = {
  name: '국가표준식품성분표 제10개정(농촌진흥청), 식품의약품안전처 식품영양성분 DB 참고 추정치',
  updatedAt: '2026-11-14',
  note: '대표값을 반올림한 추정치로, 품종·조리법·제품에 따라 차이가 있습니다.',
};

// 한국 식품 알레르기 표시 대상(22종 중 관련 항목) + 생선
export const ALLERGENS = [
  '난류', '우유', '메밀', '땅콩', '대두', '밀', '고등어', '게', '새우', '돼지고기',
  '복숭아', '토마토', '호두', '닭고기', '쇠고기', '오징어', '조개류', '잣', '생선',
];

export const CATEGORY_ORDER = ['곡류', '채소', '버섯', '과일', '두부·콩', '육류', '수산물', '계란·유제품', '김치·가공', '양념'];

const I = (id, name, cat, [kcal, carb, protein, fat, sodium], opt = {}) => ({
  id, name, cat, kcal, carb, protein, fat, sodium,
  allergens: [], price: 1000, storage: 7, seasons: [], unit: 'g',
  ...opt,
});

export const INGREDIENTS = [
  // 곡류 (조리 후 기준)
  I('rice', '쌀밥', '곡류', [143, 31.5, 2.5, 0.3, 2], { staple: true, price: 400, storage: 180, buyAs: { name: '쌀', ratio: 0.45 } }),
  I('multigrain', '잡곡밥', '곡류', [148, 32, 3.5, 0.8, 2], { staple: true, price: 600, storage: 180, buyAs: { name: '잡곡쌀', ratio: 0.45 } }),
  I('oats', '오트밀', '곡류', [380, 66, 13, 7, 4], { staple: true, price: 1200, storage: 180 }),
  I('bread', '통밀식빵', '곡류', [250, 45, 10, 3.5, 450], { staple: true, price: 1100, storage: 5, allergens: ['밀', '우유'], piece: { label: '장', g: 35 } }),
  I('sweet_potato', '고구마', '곡류', [130, 30, 1.4, 0.2, 10], { staple: true, price: 700, storage: 14, seasons: [9, 10, 11], piece: { label: '개', g: 200 } }),
  I('potato', '감자', '채소', [66, 15, 2, 0.1, 3], { price: 500, storage: 21, seasons: [6, 7, 8], piece: { label: '개', g: 150 } }),
  I('noodle', '국수(삶은 것)', '곡류', [125, 26, 4, 0.5, 120], { staple: true, price: 500, storage: 365, allergens: ['밀'], buyAs: { name: '국수 건면', ratio: 0.4 } }),
  I('buckwheat', '메밀국수(삶은 것)', '곡류', [115, 24, 4.5, 0.6, 60], { staple: true, price: 900, storage: 365, allergens: ['메밀', '밀'], buyAs: { name: '메밀국수 건면', ratio: 0.4 } }),
  I('kalguksu', '칼국수면(삶은 것)', '곡류', [130, 27, 4, 0.6, 150], { staple: true, price: 600, storage: 30, allergens: ['밀'], buyAs: { name: '칼국수면', ratio: 0.55 } }),
  I('rice_cake', '떡국떡', '곡류', [225, 50, 4, 0.5, 200], { staple: true, price: 800, storage: 5 }),
  I('flour', '밀가루(부침용)', '곡류', [360, 75, 10, 1, 2], { price: 300, storage: 180, allergens: ['밀'] }),

  I('glass_noodle', '당면(삶은 것)', '곡류', [118, 29, 0.1, 0.1, 4], { staple: true, price: 1000, storage: 365, buyAs: { name: '당면', ratio: 0.33 } }),
  I('pasta', '파스타(삶은 것)', '곡류', [158, 31, 5.8, 0.9, 1], { staple: true, price: 800, storage: 365, allergens: ['밀'], buyAs: { name: '파스타 건면', ratio: 0.45 } }),
  I('ramen', '라면사리(마른 면)', '곡류', [450, 63, 9, 17, 550], { staple: true, price: 700, storage: 180, allergens: ['밀', '대두'], piece: { label: '개', g: 110 } }),
  I('jjolmyeon', '쫄면(삶은 것)', '곡류', [150, 32, 4.5, 0.6, 150], { staple: true, price: 700, storage: 30, allergens: ['밀'], buyAs: { name: '쫄면 생면', ratio: 0.6 } }),
  I('udon', '우동면(삶은 것)', '곡류', [105, 22, 3, 0.4, 150], { staple: true, price: 500, storage: 30, allergens: ['밀'], piece: { label: '봉', g: 200 } }),
  I('naengmyeon', '냉면사리(삶은 것)', '곡류', [140, 30, 4, 0.4, 200], { staple: true, price: 900, storage: 7, allergens: ['메밀', '밀'], piece: { label: '인분', g: 200 } }),
  I('rice_noodle', '쌀국수(삶은 것)', '곡류', [110, 25, 2, 0.2, 5], { staple: true, price: 1000, storage: 7 }),
  I('tortilla', '또띠아', '곡류', [300, 50, 8, 7, 500], { staple: true, price: 1200, storage: 30, allergens: ['밀'], piece: { label: '장', g: 50 } }),
  I('acorn_jelly', '도토리묵', '곡류', [45, 10, 0.5, 0.1, 5], { price: 900, storage: 5, piece: { label: '모', g: 350 } }),
  I('panko', '빵가루', '곡류', [380, 72, 12, 5, 500], { price: 800, storage: 180, allergens: ['밀'] }),
  I('starch', '전분', '양념', [350, 87, 0.2, 0.1, 5], { price: 400, storage: 365, spoon: 3 }),

  // 채소
  I('onion', '양파', '채소', [35, 8, 1, 0.1, 2], { price: 400, storage: 30, piece: { label: '개', g: 200 } }),
  I('zucchini', '애호박', '채소', [20, 4, 1.3, 0.2, 1], { price: 700, storage: 5, seasons: [6, 7, 8, 9], piece: { label: '개', g: 300 } }),
  I('green_onion', '대파', '채소', [30, 7, 1.5, 0.3, 3], { price: 600, storage: 7, piece: { label: '대', g: 100 } }),
  I('garlic', '다진 마늘', '채소', [120, 27, 6, 0.2, 5], { price: 1500, storage: 14, piece: { label: '쪽', g: 5 } }),
  I('spinach', '시금치', '채소', [25, 4, 3, 0.5, 60], { price: 1200, storage: 3, seasons: [11, 12, 1, 2, 3] }),
  I('bean_sprouts', '콩나물', '채소', [32, 3.5, 4, 1.5, 10], { price: 500, storage: 2, allergens: ['대두'] }),
  I('cabbage', '양배추', '채소', [28, 6, 1.4, 0.1, 15], { price: 300, storage: 14, seasons: [3, 4, 5, 10, 11] }),
  I('napa', '배추', '채소', [15, 3, 1.2, 0.1, 10], { price: 300, storage: 10, seasons: [10, 11, 12] }),
  I('radish', '무', '채소', [18, 4, 0.8, 0.1, 15], { price: 250, storage: 14, seasons: [10, 11, 12, 1] }),
  I('carrot', '당근', '채소', [35, 8, 1, 0.2, 40], { price: 600, storage: 14, seasons: [10, 11, 12], piece: { label: '개', g: 150 } }),
  I('broccoli', '브로콜리', '채소', [30, 6, 3.5, 0.3, 30], { price: 1500, storage: 5, seasons: [11, 12, 1, 2, 3], piece: { label: '송이', g: 300 } }),
  I('eggplant', '가지', '채소', [20, 5, 1, 0.1, 2], { price: 900, storage: 5, seasons: [6, 7, 8], piece: { label: '개', g: 150 } }),
  I('cucumber', '오이', '채소', [13, 3, 1, 0.1, 2], { price: 900, storage: 5, seasons: [5, 6, 7, 8], piece: { label: '개', g: 200 } }),
  I('tomato', '토마토', '채소', [18, 4, 0.9, 0.2, 5], { price: 900, storage: 5, seasons: [5, 6, 7, 8], allergens: ['토마토'], piece: { label: '개', g: 200 } }),
  I('pumpkin', '단호박', '채소', [65, 15, 1.5, 0.2, 1], { price: 600, storage: 30, seasons: [8, 9, 10, 11], piece: { label: '통', g: 1000 } }),
  I('perilla', '깻잎', '채소', [40, 7, 4, 0.5, 2], { price: 2500, storage: 4, seasons: [6, 7, 8, 9], piece: { label: '장', g: 2 } }),
  I('chives', '부추', '채소', [25, 4, 2.5, 0.4, 3], { price: 1000, storage: 3, seasons: [3, 4, 5] }),

  I('bok_choy', '청경채', '채소', [15, 2.2, 1.5, 0.2, 65], { price: 1200, storage: 5, piece: { label: '포기', g: 50 } }),
  I('paprika', '파프리카', '채소', [28, 6, 1, 0.3, 3], { price: 1300, storage: 10, seasons: [6, 7, 8], piece: { label: '개', g: 200 } }),
  I('mung_sprouts', '숙주', '채소', [18, 3, 2, 0.1, 5], { price: 500, storage: 2 }),
  I('burdock', '우엉', '채소', [65, 15, 2.6, 0.1, 18], { price: 1200, storage: 14, seasons: [10, 11, 12] }),
  I('young_radish', '열무', '채소', [20, 4, 2, 0.2, 20], { price: 800, storage: 5, seasons: [5, 6, 7] }),
  I('siraegi', '시래기(삶은 것)', '채소', [30, 6, 2, 0.3, 20], { price: 900, storage: 5, seasons: [11, 12, 1] }),
  I('gondre', '곤드레(삶은 것)', '채소', [30, 5, 2.5, 0.4, 15], { price: 1500, storage: 5, seasons: [4, 5, 6] }),
  I('asparagus', '아스파라거스', '채소', [20, 4, 2.2, 0.1, 2], { price: 2500, storage: 5, seasons: [4, 5, 6] }),
  I('basil', '바질', '채소', [25, 3, 3, 0.6, 4], { price: 5000, storage: 3 }),

  // 버섯
  I('mushroom', '버섯(느타리·표고)', '버섯', [25, 5, 2.5, 0.3, 5], { price: 1200, storage: 4, seasons: [9, 10, 11] }),

  // 과일·견과
  I('apple', '사과', '과일', [55, 14, 0.2, 0.1, 1], { price: 900, storage: 21, seasons: [9, 10, 11], piece: { label: '개', g: 250 } }),
  I('banana', '바나나', '과일', [90, 23, 1.1, 0.2, 1], { price: 400, storage: 5, piece: { label: '개', g: 120 } }),
  I('walnut', '호두', '과일', [650, 14, 15, 65, 2], { price: 4000, storage: 90, allergens: ['호두'] }),
  I('peanut', '땅콩', '과일', [570, 21, 25, 47, 6], { price: 2000, storage: 180, allergens: ['땅콩'] }),

  // 두부·콩
  I('tofu', '두부', '두부·콩', [88, 2, 9, 5, 6], { price: 600, storage: 5, allergens: ['대두'], piece: { label: '모', g: 300 } }),
  I('soft_tofu', '순두부', '두부·콩', [47, 2, 4.5, 2.5, 5], { price: 500, storage: 4, allergens: ['대두'], piece: { label: '봉', g: 350 } }),
  I('red_bean', '팥(삶은 것)', '두부·콩', [140, 25, 8, 0.5, 2], { price: 1500, storage: 180, buyAs: { name: '팥(마른 것)', ratio: 0.45 } }),
  I('black_bean', '검은콩(삶은 것)', '두부·콩', [150, 18, 13, 6, 2], { price: 1500, storage: 180, allergens: ['대두'], buyAs: { name: '검은콩(마른 것)', ratio: 0.45 } }),
  I('dried_tofu', '건두부', '두부·콩', [160, 6, 18, 8, 10], { price: 2500, storage: 14, allergens: ['대두'] }),
  I('fried_tofu', '유부', '두부·콩', [330, 12, 18, 25, 450], { price: 2000, storage: 14, allergens: ['대두'], piece: { label: '장', g: 12 } }),
  I('soy_milk', '콩국물', '두부·콩', [55, 3, 4.5, 2.8, 15], { price: 900, storage: 3, unit: 'mL', allergens: ['대두'] }),

  // 육류
  I('chicken_breast', '닭가슴살', '육류', [109, 0, 23, 1.5, 50], { price: 1200, storage: 2, allergens: ['닭고기'] }),
  I('chicken_thigh', '닭다리살', '육류', [160, 0, 18, 9.5, 80], { price: 1300, storage: 2, allergens: ['닭고기'] }),
  I('pork', '돼지고기(안심·앞다리)', '육류', [140, 0, 21, 6, 50], { price: 1800, storage: 3, allergens: ['돼지고기'] }),
  I('beef', '소고기(우둔·국거리)', '육류', [150, 0, 21, 7, 55], { price: 4500, storage: 3, allergens: ['쇠고기'] }),
  I('bacon', '베이컨', '육류', [390, 1, 13, 37, 1200], { price: 2500, storage: 7, allergens: ['돼지고기'], piece: { label: '줄', g: 15 } }),

  // 수산물
  I('mackerel', '고등어', '수산물', [190, 0, 20, 12, 90], { price: 1500, storage: 2, seasons: [9, 10, 11], allergens: ['고등어', '생선'] }),
  I('pollock', '동태(명태)', '수산물', [75, 0, 17, 0.6, 110], { price: 1300, storage: 2, seasons: [12, 1, 2], allergens: ['생선'] }),
  I('flatfish', '가자미', '수산물', [90, 0, 19, 1.5, 120], { price: 2000, storage: 2, allergens: ['생선'] }),
  I('salmon', '연어', '수산물', [180, 0, 20, 11, 50], { price: 4500, storage: 2, allergens: ['생선'] }),
  I('tuna', '참치(통조림, 기름 뺀 것)', '수산물', [190, 0, 25, 9, 350], { price: 1800, storage: 3, allergens: ['생선'], piece: { label: '캔', g: 100 } }),
  I('squid', '오징어', '수산물', [90, 2, 18, 1, 250], { price: 2000, storage: 2, seasons: [7, 8, 9, 10], allergens: ['오징어'], piece: { label: '마리', g: 250 } }),
  I('shrimp', '새우(손질)', '수산물', [85, 0, 19, 0.8, 200], { price: 3000, storage: 3, seasons: [9, 10, 11], allergens: ['새우'] }),
  I('clam', '바지락(살)', '수산물', [60, 3, 10, 0.8, 500], { price: 1500, storage: 2, seasons: [2, 3, 4], allergens: ['조개류'] }),
  I('octopus', '낙지', '수산물', [75, 2, 15, 0.8, 450], { price: 4000, storage: 2, seasons: [9, 10, 11] }),
  I('oyster', '굴', '수산물', [70, 4, 9, 2, 290], { price: 2500, storage: 2, seasons: [11, 12, 1, 2], allergens: ['조개류'] }),
  I('sea_snail', '골뱅이(통조림)', '수산물', [90, 5, 17, 0.5, 400], { price: 3500, storage: 365, allergens: ['조개류'], piece: { label: '캔', g: 140 } }),
  I('crab_stick', '게맛살', '수산물', [95, 12, 9, 1, 850], { price: 1500, storage: 14, allergens: ['게', '밀', '생선'], piece: { label: '개', g: 20 } }),
  I('dried_anchovy', '잔멸치', '수산물', [300, 2, 48, 10, 1700], { price: 4000, storage: 180, allergens: ['생선'] }),
  I('dried_pollock', '황태채', '수산물', [290, 1, 68, 2, 400], { price: 6000, storage: 180, allergens: ['생선'] }),
  I('fish_roe', '날치알', '수산물', [90, 2, 14, 3, 600], { price: 4000, storage: 7, allergens: ['생선'] }),
  I('broth', '멸치육수', '수산물', [5, 0.2, 0.8, 0.1, 60], { price: 3000, storage: 3, unit: 'mL', allergens: ['생선'], buyAs: { name: '육수용 멸치(육수 1L당 약 20g)', ratio: 0.02 } }),
  I('beef_broth', '사골육수', '수산물', [20, 0.5, 3, 0.6, 150], { price: 500, storage: 3, unit: 'mL', allergens: ['쇠고기'] }),
  I('miyeok', '미역', '수산물', [125, 40, 20, 3, 3000], { price: 4000, storage: 365 }),
  I('laver', '김(구운 것)', '수산물', [165, 40, 35, 1, 120], { price: 8000, storage: 60, piece: { label: '장', g: 2 } }),

  // 달걀·유제품
  I('egg', '계란', '계란·유제품', [140, 0.7, 12.4, 9.5, 140], { price: 600, storage: 21, allergens: ['난류'], piece: { label: '개', g: 50 } }),
  I('milk', '우유', '계란·유제품', [65, 4.8, 3.2, 3.5, 40], { price: 300, storage: 7, unit: 'mL', allergens: ['우유'] }),
  I('yogurt', '요거트', '계란·유제품', [60, 5, 4, 3, 45], { price: 600, storage: 10, allergens: ['우유'] }),

  I('cheese', '치즈', '계란·유제품', [320, 3, 20, 25, 1200], { price: 1800, storage: 30, allergens: ['우유'], piece: { label: '장', g: 20 } }),

  // 김치·가공
  I('kimchi', '배추김치', '김치·가공', [25, 4, 2, 0.5, 650], { price: 1000, storage: 30 }),
  I('danmuji', '단무지', '김치·가공', [25, 5, 0.5, 0.1, 1000], { price: 600, storage: 30 }),
  I('kkakdugi', '깍두기', '김치·가공', [35, 6, 1.5, 0.3, 700], { price: 800, storage: 30 }),
  I('dongchimi', '동치미', '김치·가공', [15, 3, 0.6, 0.1, 450], { price: 700, storage: 30, unit: 'mL' }),
  I('jangajji', '무장아찌', '김치·가공', [40, 8, 1, 0.2, 1200], { price: 1200, storage: 60 }),
  I('fishcake', '어묵', '김치·가공', [140, 18, 9, 3.5, 800], { price: 1000, storage: 7, allergens: ['생선', '밀', '대두'], piece: { label: '장', g: 40 } }),
  I('mandu', '만두(냉동)', '김치·가공', [210, 28, 8, 7, 450], { price: 1000, storage: 90, allergens: ['밀', '돼지고기', '대두'], piece: { label: '개', g: 30 } }),

  // 양념
  I('soy', '간장', '양념', [55, 7, 6, 0, 5700], { price: 600, storage: 365, allergens: ['대두', '밀'], spoon: 6 }),
  I('doenjang', '된장', '양념', [160, 13, 12, 6, 4300], { price: 1000, storage: 365, allergens: ['대두'], spoon: 6 }),
  I('gochujang', '고추장', '양념', [200, 42, 4, 1.5, 2500], { price: 1200, storage: 365, allergens: ['밀', '대두'], spoon: 6.5 }),
  I('salt', '소금', '양념', [0, 0, 0, 0, 38000], { price: 200, storage: 999, spoon: 6 }),
  I('sugar', '설탕', '양념', [387, 100, 0, 0, 0], { price: 300, storage: 999, spoon: 4 }),
  I('sesame_oil', '참기름', '양념', [900, 0, 0, 100, 0], { price: 3500, storage: 365, spoon: 4.5 }),
  I('oil', '식용유', '양념', [900, 0, 0, 100, 0], { price: 500, storage: 365, spoon: 4.5 }),
  I('red_pepper', '고춧가루', '양념', [300, 50, 13, 10, 20], { price: 5000, storage: 180, spoon: 2.5 }),
  I('olive_oil', '올리브유', '양념', [900, 0, 0, 100, 0], { price: 1500, storage: 365, spoon: 4.5 }),
  I('oyster_sauce', '굴소스', '양념', [100, 20, 2, 0.3, 4500], { price: 1200, storage: 180, allergens: ['조개류', '대두', '밀'], spoon: 6 }),
  I('perilla_powder', '들깨가루', '양념', [540, 15, 18, 45, 5], { price: 3500, storage: 90, spoon: 2.5 }),
  I('sesame', '깨', '양념', [580, 20, 20, 50, 5], { price: 3000, storage: 180, spoon: 3 }),
  I('mayo', '마요네즈', '양념', [680, 2, 1.5, 75, 600], { price: 800, storage: 90, allergens: ['난류', '대두'], spoon: 4.5 }),
  I('ketchup', '토마토케첩', '양념', [110, 26, 1.5, 0.1, 1000], { price: 500, storage: 90, allergens: ['토마토'], spoon: 6 }),
  I('tomato_sauce', '토마토소스', '양념', [55, 9, 1.6, 1.5, 400], { price: 800, storage: 7, allergens: ['토마토'], spoon: 6 }),
  I('curry', '카레가루', '양념', [377, 58, 10, 11, 52], { price: 3000, storage: 365, allergens: ['밀'], spoon: 3 }),
  I('vinegar', '식초', '양념', [25, 1, 0, 0, 5], { price: 300, storage: 999, spoon: 5 }),
];

export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// 사람이 읽기 쉬운 수량 표시
const FRACTIONS = [[0.25, '1/4'], [0.33, '1/3'], [0.5, '1/2'], [0.67, '2/3'], [0.75, '3/4']];
function friendlyCount(n) {
  if (n < 0.2) return null;
  if (n < 0.9) {
    let best = FRACTIONS[0];
    for (const f of FRACTIONS) if (Math.abs(f[0] - n) < Math.abs(best[0] - n)) best = f;
    return best[1];
  }
  const r = Math.round(n * 2) / 2;
  return Number.isInteger(r) ? String(r) : getLang() === 'ko' ? `${Math.floor(r)}과 1/2` : `${Math.floor(r)} 1/2`;
}

export function formatAmount(id, grams) {
  const ing = ING[id];
  if (!ing) return `${Math.round(grams)}g`;
  const g = grams >= 10 ? Math.round(grams) : Math.round(grams * 10) / 10;
  const base = `${g}${ing.unit}`;
  if (ing.spoon) {
    const tsp = grams / ing.spoon;
    if (tsp < 0.3) return `${base} (${t('조금')})`;
    if (tsp < 3) return `${base} (${t('약 {n}작은술', { n: friendlyCount(tsp) || '1/4' })})`;
    return `${base} (${t('약 {n}큰술', { n: friendlyCount(tsp / 3) })})`;
  }
  if (ing.piece) {
    const c = friendlyCount(grams / ing.piece.g);
    if (c) return `${base} (${t('약 {n}{unit}', { n: c, unit: t(ing.piece.label) })})`;
  }
  return base;
}

// 장보기용: 구매 형태로 환산
export function buyForm(id, grams) {
  const ing = ING[id];
  if (ing?.buyAs) return { name: ing.buyAs.name, grams: grams * ing.buyAs.ratio, unit: 'g' };
  return { name: ing?.name || id, grams, unit: ing?.unit || 'g' };
}
