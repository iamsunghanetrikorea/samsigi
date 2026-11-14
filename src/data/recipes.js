// 레시피(한 끼 구성) 데이터 — 재료량은 모두 1인분 기준(g 또는 mL)
// main: 반복 방지(FR-07)에 쓰는 주메뉴 계열, soft: 부드러워 씹기 쉬운 메뉴
// steps: [설명, 타이머(분, 선택)], subs: 대체 가능한 재료
import { ING, NUTRITION_SOURCE } from './ingredients';

const R = (r) => ({ difficulty: 1, soft: false, tags: [], subs: {}, source: '건강한 세 끼 자체 구성 레시피', ...r });

export const RECIPES = [
  // ───────── 아침 ─────────
  R({
    id: 'oat_banana', title: '우유 오트밀죽과 바나나', emoji: '🥣', meals: ['breakfast'], main: 'oat',
    prep: 2, cook: 6, soft: true, tags: ['죽', '간편'],
    items: [['oats', 40], ['milk', 200], ['banana', 60], ['walnut', 8]],
    steps: [['냄비에 우유와 오트밀을 넣어 주세요.'], ['약한 불에서 저어 가며 걸쭉해질 때까지 끓여 주세요.', 5], ['바나나를 얇게 썰어 올리고 호두를 잘게 부숴 뿌려 주세요.']],
    subs: { milk: ['yogurt'], walnut: ['sesame'] },
  }),
  R({
    id: 'egg_toast', title: '달걀채소 토스트와 우유', emoji: '🍞', meals: ['breakfast'], main: 'egg',
    prep: 5, cook: 7, tags: ['빵', '간편'],
    items: [['bread', 70], ['egg', 50], ['cabbage', 40], ['carrot', 15], ['oil', 3], ['milk', 200]],
    steps: [['양배추와 당근을 가늘게 채 썰어 주세요.'], ['달걀을 풀고 채소를 섞어 주세요.'], ['기름 두른 팬에 약한 불로 앞뒤를 익혀 주세요.', 4], ['빵을 굽고 달걀부침을 올려 우유와 함께 드세요.']],
    subs: { milk: ['yogurt'], cabbage: ['spinach'] },
  }),
  R({
    id: 'soft_tofu_soup', title: '달걀 순두부국과 잡곡밥', emoji: '🥘', meals: ['breakfast', 'lunch'], main: 'softtofu',
    prep: 3, cook: 10, soft: true, tags: ['국물'],
    items: [['soft_tofu', 150], ['egg', 50], ['green_onion', 10], ['broth', 250], ['soy', 4], ['multigrain', 150], ['kimchi', 30]],
    steps: [['육수를 끓여 주세요.', 3], ['순두부를 큰 숟가락으로 떠 넣고 한소끔 끓여 주세요.', 3], ['달걀을 풀어 둘러 넣고 간장으로 살짝 간해 주세요.'], ['대파를 올리고 밥과 함께 드세요.']],
    subs: { multigrain: ['rice'], kimchi: ['cucumber'] },
  }),
  R({
    id: 'pumpkin_porridge', title: '단호박죽과 삶은 달걀', emoji: '🎃', meals: ['breakfast'], main: 'pumpkin',
    prep: 5, cook: 15, soft: true, tags: ['죽'],
    items: [['pumpkin', 200], ['rice', 60], ['milk', 100], ['sugar', 3], ['salt', 0.5], ['egg', 50]],
    steps: [['단호박을 전자레인지에 4분 돌린 뒤 껍질과 씨를 빼 주세요.', 4], ['냄비에 단호박, 밥, 우유를 넣고 으깨며 끓여 주세요.', 8], ['설탕·소금 조금으로 맛을 맞춰 주세요.'], ['달걀은 끓는 물에 12분 삶아 곁들여 주세요.', 12]],
    subs: { milk: ['yogurt'], pumpkin: ['sweet_potato'] },
  }),
  R({
    id: 'sweetpotato_yogurt', title: '고구마·요거트 한 접시', emoji: '🍠', meals: ['breakfast'], main: 'sweetpotato',
    prep: 3, cook: 8, tags: ['간편'],
    items: [['sweet_potato', 150], ['yogurt', 150], ['apple', 80], ['walnut', 8], ['egg', 50]],
    steps: [['고구마를 씻어 전자레인지에 6~8분 익혀 주세요.', 7], ['사과를 한입 크기로 썰어 요거트에 담아 주세요.'], ['호두를 올리고 삶은 달걀과 함께 드세요.']],
    subs: { apple: ['banana'], yogurt: ['milk'] },
  }),
  R({
    id: 'egg_soup_spinach', title: '달걀국, 시금치나물과 잡곡밥', emoji: '🍳', meals: ['breakfast'], main: 'egg',
    prep: 5, cook: 10, soft: true, tags: ['국물', '채소'],
    items: [['egg', 50], ['broth', 250], ['green_onion', 10], ['soy', 4], ['multigrain', 150], ['spinach', 70], ['sesame_oil', 2], ['garlic', 2], ['salt', 0.3]],
    steps: [['시금치를 끓는 물에 30초 데쳐 찬물에 헹궈 물기를 짜 주세요.'], ['시금치에 마늘·참기름·소금 조금 넣어 무쳐 주세요.'], ['육수가 끓으면 달걀을 풀어 넣고 간장으로 간해 주세요.', 3], ['대파를 넣고 밥과 함께 드세요.']],
    subs: { spinach: ['bean_sprouts'], multigrain: ['rice'] },
  }),
  R({
    id: 'beef_veg_porridge', title: '소고기 채소죽', emoji: '🍚', meals: ['breakfast', 'dinner'], main: 'beefporridge',
    prep: 7, cook: 15, soft: true, tags: ['죽', '고기'],
    items: [['rice', 130], ['beef', 40], ['carrot', 20], ['zucchini', 30], ['mushroom', 20], ['sesame_oil', 3], ['soy', 3]],
    steps: [['소고기와 채소를 잘게 다져 주세요.'], ['냄비에 참기름을 두르고 소고기를 볶아 주세요.', 2], ['채소와 밥, 물 2컵을 넣고 저어 가며 끓여 주세요.', 12], ['간장으로 살짝 간해 주세요.']],
    subs: { beef: ['chicken_breast'], zucchini: ['spinach'] },
  }),
  R({
    id: 'miyeok_soup', title: '소고기미역국, 두부부침과 잡곡밥', emoji: '🥣', meals: ['breakfast', 'dinner'], main: 'miyeok',
    prep: 10, cook: 20, soft: true, tags: ['국물'],
    items: [['miyeok', 7], ['beef', 30], ['sesame_oil', 3], ['garlic', 3], ['soy', 5], ['multigrain', 150], ['tofu', 80], ['oil', 3]],
    steps: [['마른 미역을 물에 10분 불린 뒤 먹기 좋게 잘라 주세요.', 10], ['참기름에 소고기와 미역을 볶아 주세요.', 2], ['물 2컵을 붓고 마늘을 넣어 푹 끓인 뒤 간장으로 간해 주세요.', 15], ['두부는 도톰하게 썰어 기름 두른 팬에 노릇하게 부쳐 주세요.', 5]],
    subs: { beef: ['clam'], multigrain: ['rice'] },
  }),
  R({
    id: 'beansprout_soup', title: '콩나물국, 달걀말이와 잡곡밥', emoji: '🌱', meals: ['breakfast', 'lunch'], main: 'beansprout',
    prep: 5, cook: 15, tags: ['국물'],
    items: [['bean_sprouts', 80], ['broth', 250], ['garlic', 3], ['green_onion', 10], ['salt', 0.5], ['multigrain', 150], ['egg', 60], ['carrot', 10], ['oil', 3]],
    steps: [['콩나물을 씻어 육수에 넣고 뚜껑을 덮어 끓여 주세요.', 6], ['마늘·대파를 넣고 소금 조금으로 간해 주세요.'], ['달걀에 잘게 썬 당근을 섞어 약한 불에서 돌돌 말아 익혀 주세요.', 5]],
    subs: { multigrain: ['rice'], carrot: ['green_onion'] },
  }),
  R({
    id: 'potato_soup', title: '감자국, 달걀프라이와 잡곡밥', emoji: '🥔', meals: ['breakfast'], main: 'potato',
    prep: 5, cook: 15, soft: true, tags: ['국물'],
    items: [['potato', 100], ['onion', 30], ['broth', 250], ['green_onion', 10], ['soy', 4], ['multigrain', 150], ['laver', 2], ['egg', 50], ['oil', 2]],
    steps: [['감자와 양파를 얇게 썰어 주세요.'], ['육수에 감자를 넣고 부드러워질 때까지 끓여 주세요.', 10], ['양파·대파를 넣고 간장으로 간해 주세요.'], ['달걀프라이를 하고 김과 함께 드세요.', 3]],
    subs: { multigrain: ['rice'] },
  }),
  R({
    id: 'tomato_egg', title: '토마토 달걀볶음과 통밀빵', emoji: '🍅', meals: ['breakfast'], main: 'tomatoegg',
    prep: 3, cook: 6, soft: true, tags: ['빵', '간편'],
    items: [['tomato', 150], ['egg', 100], ['oil', 4], ['salt', 0.5], ['bread', 50]],
    steps: [['토마토를 한입 크기로 썰어 주세요.'], ['달걀을 풀어 기름 두른 팬에서 반쯤 익혀 덜어 두세요.', 1], ['토마토를 볶다가 달걀을 다시 넣고 소금으로 간해 주세요.', 3], ['빵과 함께 드세요.']],
    subs: { bread: ['multigrain'] },
  }),
  R({
    id: 'pollock_soup', title: '맑은 동태무국과 잡곡밥', emoji: '🐟', meals: ['breakfast', 'dinner'], main: 'pollock',
    prep: 8, cook: 20, soft: true, tags: ['국물', '생선'],
    items: [['pollock', 90], ['radish', 70], ['green_onion', 10], ['garlic', 3], ['soy', 4], ['broth', 300], ['multigrain', 150], ['kimchi', 30]],
    steps: [['무는 나박하게, 동태는 토막 내어 씻어 주세요.'], ['육수에 무를 넣고 끓여 주세요.', 7], ['동태를 넣고 충분히 익혀 주세요.', 8], ['마늘·대파·간장으로 간해 밥과 함께 드세요.']],
    subs: { pollock: ['flatfish'], multigrain: ['rice'] },
  }),

  // ───────── 점심·저녁 ─────────
  R({
    id: 'tofu_mushroom_hotpot', title: '두부버섯전골과 잡곡밥', emoji: '🍲', meals: ['lunch', 'dinner'], main: 'tofu',
    prep: 5, cook: 15, soft: true, tags: ['국물', '채소'],
    items: [['tofu', 150], ['mushroom', 100], ['zucchini', 50], ['onion', 50], ['broth', 250], ['garlic', 3], ['soy', 5], ['multigrain', 150]],
    steps: [['두부를 썰고 버섯을 찢어 주세요.'], ['냄비에 육수·양파·애호박을 넣고 끓여 주세요.', 5], ['두부와 버섯을 넣고 충분히 익을 때까지 더 끓여 주세요.', 7], ['마늘·국간장 소량으로 간하고 밥과 함께 드세요.']],
    subs: { tofu: ['soft_tofu'], mushroom: ['napa'], multigrain: ['rice'] },
  }),
  R({
    id: 'mackerel_set', title: '고등어구이, 시금치된장국과 잡곡밥', emoji: '🐟', meals: ['lunch', 'dinner'], main: 'mackerel',
    prep: 5, cook: 15, tags: ['생선', '국물'],
    items: [['mackerel', 100], ['oil', 3], ['multigrain', 160], ['spinach', 60], ['doenjang', 10], ['broth', 250], ['kimchi', 30]],
    steps: [['고등어를 씻어 물기를 닦아 주세요.'], ['기름 두른 팬에 껍질부터 중간 불로 앞뒤 노릇하게 구워 주세요.', 8], ['육수에 된장을 풀고 끓으면 시금치를 넣어 주세요.', 4], ['밥과 함께 차려 드세요.']],
    subs: { mackerel: ['flatfish', 'salmon'], spinach: ['napa'], multigrain: ['rice'] },
  }),
  R({
    id: 'chicken_veg_stirfry', title: '닭가슴살 채소볶음과 잡곡밥', emoji: '🥦', meals: ['lunch', 'dinner'], main: 'chicken',
    prep: 8, cook: 10, tags: ['고기', '채소'],
    items: [['chicken_breast', 100], ['broccoli', 60], ['carrot', 30], ['onion', 40], ['oil', 5], ['soy', 6], ['garlic', 3], ['multigrain', 160]],
    steps: [['닭가슴살과 채소를 한입 크기로 썰어 주세요.'], ['브로콜리는 끓는 물에 1분 데쳐 주세요.', 1], ['기름에 마늘·닭고기를 익을 때까지 볶아 주세요.', 5], ['채소를 넣고 간장으로 간해 2분 더 볶아 주세요.', 2]],
    subs: { chicken_breast: ['tofu', 'pork'], broccoli: ['cabbage'], multigrain: ['rice'] },
  }),
  R({
    id: 'veg_bibimbap', title: '채소 비빔밥과 달걀프라이', emoji: '🥗', meals: ['lunch', 'dinner'], main: 'bibimbap',
    prep: 10, cook: 15, tags: ['채소'],
    items: [['multigrain', 180], ['bean_sprouts', 50], ['spinach', 50], ['carrot', 30], ['zucchini', 40], ['mushroom', 30], ['egg', 50], ['gochujang', 12], ['sesame_oil', 4], ['oil', 3]],
    steps: [['콩나물·시금치는 각각 데쳐 물기를 짜 주세요.', 3], ['당근·애호박·버섯은 채 썰어 기름에 살짝 볶아 주세요.', 4], ['달걀프라이를 해 주세요.', 2], ['밥에 나물과 달걀을 올리고 고추장·참기름을 곁들여 비벼 드세요.']],
    subs: { gochujang: ['soy'], spinach: ['perilla'], multigrain: ['rice'] },
  }),
  R({
    id: 'beef_bulgogi', title: '소불고기, 양배추쌈과 잡곡밥', emoji: '🥩', meals: ['lunch', 'dinner'], main: 'beef',
    prep: 15, cook: 10, tags: ['고기'],
    items: [['beef', 90], ['onion', 40], ['mushroom', 30], ['green_onion', 10], ['soy', 9], ['sugar', 4], ['garlic', 4], ['sesame_oil', 3], ['multigrain', 160], ['cabbage', 60]],
    steps: [['소고기에 간장·설탕·마늘·참기름을 넣고 10분 재워 주세요.', 10], ['양배추는 쪄서 쌈으로 준비해 주세요.', 5], ['팬에 고기와 양파·버섯을 넣고 충분히 익혀 주세요.', 6], ['대파를 넣고 밥과 쌈을 곁들여 드세요.']],
    subs: { beef: ['pork', 'chicken_thigh'], cabbage: ['perilla'], multigrain: ['rice'] },
  }),
  R({
    id: 'kimchi_stew', title: '돼지고기 김치찌개(싱겁게)와 잡곡밥', emoji: '🍲', meals: ['lunch', 'dinner'], main: 'kimchistew',
    prep: 5, cook: 20, tags: ['국물', '고기'],
    items: [['pork', 60], ['kimchi', 70], ['tofu', 80], ['onion', 30], ['green_onion', 10], ['broth', 250], ['red_pepper', 1], ['multigrain', 160]],
    steps: [['돼지고기와 김치를 한입 크기로 썰어 주세요.'], ['냄비에 고기와 김치를 볶아 주세요.', 3], ['육수를 붓고 끓인 뒤 양파·두부를 넣어 주세요.', 12], ['대파를 넣고 간은 따로 더하지 말고 드세요.']],
    subs: { pork: ['tofu'], multigrain: ['rice'] },
    tip: '김치에 소금이 많아 간장·소금을 더하지 않아도 충분합니다.',
  }),
  R({
    id: 'doenjang_stew', title: '된장찌개, 달걀찜과 잡곡밥', emoji: '🥘', meals: ['lunch', 'dinner'], main: 'doenjang',
    prep: 7, cook: 15, soft: true, tags: ['국물', '채소'],
    items: [['doenjang', 14], ['tofu', 80], ['zucchini', 50], ['potato', 40], ['onion', 30], ['mushroom', 20], ['broth', 250], ['multigrain', 160], ['egg', 50]],
    steps: [['채소와 두부를 한입 크기로 썰어 주세요.'], ['육수에 된장을 풀고 감자를 넣어 끓여 주세요.', 5], ['나머지 채소와 두부를 넣고 더 끓여 주세요.', 7], ['달걀에 물 3큰술을 섞어 전자레인지에 2분 돌려 달걀찜을 만들어 주세요.', 2]],
    subs: { potato: ['radish'], multigrain: ['rice'] },
  }),
  R({
    id: 'salmon_bowl', title: '연어 채소덮밥', emoji: '🍣', meals: ['lunch', 'dinner'], main: 'salmon',
    prep: 10, cook: 8, tags: ['생선'],
    items: [['salmon', 90], ['multigrain', 170], ['onion', 30], ['cucumber', 40], ['perilla', 5], ['soy', 6], ['sesame', 2], ['oil', 2]],
    steps: [['연어를 기름 두른 팬에 앞뒤로 완전히 익혀 주세요.', 6], ['양파·오이·깻잎을 가늘게 채 썰어 주세요.'], ['밥 위에 채소와 연어를 올리고 간장·깨를 뿌려 주세요.']],
    subs: { salmon: ['mackerel', 'tofu'], multigrain: ['rice'] },
    tip: '어르신은 날 생선 대신 반드시 익혀 드시는 것이 안전합니다.',
  }),
  R({
    id: 'shrimp_fried_rice', title: '새우 채소볶음밥', emoji: '🍤', meals: ['lunch'], main: 'shrimp',
    prep: 8, cook: 10, tags: ['간편'],
    items: [['rice', 190], ['shrimp', 60], ['egg', 50], ['carrot', 20], ['onion', 30], ['zucchini', 30], ['green_onion', 10], ['oil', 6], ['salt', 0.6]],
    steps: [['채소를 잘게 썰어 주세요.'], ['기름에 대파를 볶아 향을 낸 뒤 새우와 채소를 볶아 주세요.', 4], ['한쪽에 달걀을 스크램블한 뒤 밥을 넣어 함께 볶아 주세요.', 4], ['소금 조금으로 간해 주세요.']],
    subs: { shrimp: ['chicken_breast', 'pork'], rice: ['multigrain'] },
  }),
  R({
    id: 'clam_kalguksu', title: '바지락 칼국수', emoji: '🍜', meals: ['lunch'], main: 'kalguksu',
    prep: 10, cook: 15, soft: true, tags: ['면', '국물'],
    items: [['kalguksu', 230], ['clam', 60], ['zucchini', 50], ['potato', 40], ['onion', 30], ['garlic', 3], ['green_onion', 10], ['broth', 400], ['soy', 3]],
    steps: [['바지락을 소금물에 해감한 뒤 씻어 주세요.'], ['육수에 감자·양파를 넣고 끓여 주세요.', 5], ['면과 애호박을 넣고 저어 가며 끓여 주세요.', 6], ['바지락·마늘·대파를 넣고 입이 벌어질 때까지 끓인 뒤 간장으로 간해 주세요.', 3]],
    subs: { clam: ['shrimp'], kalguksu: ['noodle'] },
    tip: '국물은 절반 정도만 드시면 나트륨을 줄일 수 있어요.',
  }),
  R({
    id: 'buckwheat_noodle', title: '메밀 비빔국수와 삶은 달걀', emoji: '🍝', meals: ['lunch'], main: 'buckwheat',
    prep: 8, cook: 8, tags: ['면'],
    items: [['buckwheat', 220], ['cucumber', 50], ['egg', 50], ['gochujang', 14], ['sugar', 4], ['sesame_oil', 3], ['sesame', 1], ['perilla', 4]],
    steps: [['달걀을 끓는 물에 12분 삶아 주세요.', 12], ['메밀국수를 삶아 찬물에 여러 번 헹궈 주세요.', 4], ['오이·깻잎을 채 썰어 주세요.'], ['고추장·설탕·참기름 양념에 면과 채소를 비비고 달걀을 올려 주세요.']],
    subs: { buckwheat: ['noodle'], gochujang: ['soy'] },
  }),
  R({
    id: 'chicken_porridge', title: '닭고기 채소죽', emoji: '🍲', meals: ['lunch', 'dinner'], main: 'chickenporridge',
    prep: 8, cook: 20, soft: true, tags: ['죽', '고기'],
    items: [['rice', 150], ['chicken_thigh', 70], ['carrot', 20], ['onion', 20], ['green_onion', 10], ['garlic', 4], ['salt', 0.6], ['sesame_oil', 2]],
    steps: [['닭고기를 물 3컵에 마늘과 함께 삶아 주세요.', 12], ['고기를 건져 잘게 찢고 채소를 다져 주세요.'], ['닭 육수에 밥·채소·고기를 넣고 저어 가며 끓여 주세요.', 8], ['소금·참기름·대파로 마무리해 주세요.']],
    subs: { chicken_thigh: ['chicken_breast'], rice: ['multigrain'] },
  }),
  R({
    id: 'flatfish_set', title: '가자미구이, 애호박볶음과 잡곡밥', emoji: '🐠', meals: ['lunch', 'dinner'], main: 'flatfish',
    prep: 5, cook: 15, tags: ['생선', '채소'],
    items: [['flatfish', 120], ['oil', 5], ['multigrain', 160], ['zucchini', 80], ['garlic', 2], ['salt', 0.3], ['sesame', 1], ['kimchi', 30]],
    steps: [['가자미를 씻어 물기를 닦아 주세요.'], ['기름 두른 팬에 중간 불로 앞뒤를 노릇하게 구워 주세요.', 10], ['애호박을 반달 모양으로 썰어 마늘과 볶고 소금으로 간해 주세요.', 4], ['밥과 함께 드세요.']],
    subs: { flatfish: ['mackerel', 'pollock'], zucchini: ['eggplant'], multigrain: ['rice'] },
  }),
  R({
    id: 'braised_tofu', title: '두부조림, 콩나물무침과 잡곡밥', emoji: '🍱', meals: ['lunch', 'dinner'], main: 'braisedtofu',
    prep: 5, cook: 15, soft: true, tags: ['채소'],
    items: [['tofu', 150], ['soy', 7], ['red_pepper', 1], ['garlic', 3], ['green_onion', 10], ['sugar', 2], ['oil', 3], ['multigrain', 160], ['bean_sprouts', 70], ['sesame_oil', 2], ['salt', 0.3]],
    steps: [['두부를 도톰하게 썰어 기름에 앞뒤로 구워 주세요.', 5], ['간장·고춧가루·마늘·설탕·물 3큰술을 섞어 붓고 졸여 주세요.', 5], ['콩나물을 데쳐 참기름·소금으로 무쳐 주세요.', 4], ['밥과 함께 드세요.']],
    subs: { bean_sprouts: ['spinach'], multigrain: ['rice'] },
  }),
  R({
    id: 'beef_radish_soup', title: '소고기무국, 김과 잡곡밥', emoji: '🍵', meals: ['lunch', 'dinner'], main: 'beefsoup',
    prep: 7, cook: 20, soft: true, tags: ['국물', '고기'],
    items: [['beef', 60], ['radish', 100], ['garlic', 4], ['green_onion', 10], ['soy', 6], ['sesame_oil', 2], ['multigrain', 170], ['laver', 2], ['kimchi', 25]],
    steps: [['무를 나박하게 썰어 주세요.'], ['참기름에 소고기와 무를 볶아 주세요.', 3], ['물 2컵을 붓고 무가 투명해질 때까지 끓여 주세요.', 15], ['마늘·대파·간장으로 간해 주세요.']],
    subs: { beef: ['pork'], multigrain: ['rice'] },
  }),
  R({
    id: 'pork_bossam', title: '돼지고기 수육, 배추와 잡곡밥', emoji: '🥬', meals: ['dinner'], main: 'pork',
    prep: 5, cook: 35, difficulty: 2, soft: true, tags: ['고기'],
    items: [['pork', 100], ['napa', 80], ['kimchi', 40], ['doenjang', 5], ['garlic', 4], ['onion', 30], ['multigrain', 160]],
    steps: [['물에 된장·양파·마늘을 풀고 끓여 주세요.', 5], ['돼지고기를 넣고 속까지 완전히 익도록 삶아 주세요.', 30], ['고기를 얇게 썰고 배추는 데치거나 생으로 곁들여 주세요.'], ['김치·밥과 함께 드세요.']],
    subs: { napa: ['cabbage', 'perilla'], multigrain: ['rice'] },
  }),
  R({
    id: 'eggplant_beef_bowl', title: '가지 소고기볶음덮밥', emoji: '🍆', meals: ['lunch', 'dinner'], main: 'eggplant',
    prep: 8, cook: 10, soft: true, tags: ['채소', '고기'],
    items: [['eggplant', 120], ['beef', 60], ['onion', 30], ['garlic', 3], ['soy', 7], ['oil', 5], ['sugar', 2], ['multigrain', 170]],
    steps: [['가지와 양파를 한입 크기로 썰어 주세요.'], ['기름에 마늘과 소고기를 볶아 주세요.', 3], ['가지·양파를 넣고 부드러워질 때까지 볶아 주세요.', 5], ['간장·설탕으로 간해 밥 위에 올려 주세요.']],
    subs: { beef: ['pork', 'tofu'], eggplant: ['zucchini'], multigrain: ['rice'] },
  }),
  R({
    id: 'tteokguk', title: '소고기 떡국', emoji: '🥢', meals: ['lunch', 'dinner'], main: 'tteokguk',
    prep: 10, cook: 15, soft: true, tags: ['국물'],
    items: [['rice_cake', 150], ['beef', 40], ['egg', 50], ['broth', 400], ['green_onion', 10], ['soy', 5], ['garlic', 3], ['laver', 1]],
    steps: [['떡을 찬물에 10분 담가 주세요.', 10], ['육수에 소고기를 넣고 끓여 주세요.', 5], ['떡을 넣고 떠오를 때까지 끓인 뒤 달걀을 풀어 넣어 주세요.', 5], ['간장·마늘·대파로 간하고 김을 올려 주세요.']],
    subs: { beef: ['chicken_breast'] },
    tip: '떡은 목에 걸리지 않도록 얇게 썬 것을 쓰고 천천히 꼭꼭 씹어 드세요.',
  }),
  R({
    id: 'blackbean_rice', title: '검은콩밥, 미역오이냉국과 달걀찜', emoji: '🫘', meals: ['lunch', 'dinner'], main: 'bean',
    prep: 10, cook: 10, soft: true, tags: ['채소'],
    items: [['multigrain', 150], ['black_bean', 40], ['miyeok', 3], ['cucumber', 50], ['soy', 3], ['sugar', 2], ['egg', 60], ['salt', 0.3]],
    steps: [['검은콩은 밤새 불려 밥 지을 때 함께 넣어 주세요.'], ['불린 미역과 채 썬 오이에 찬물·간장·설탕을 섞어 냉국을 만들어 주세요.'], ['달걀에 물 3큰술·소금 조금을 섞어 전자레인지에 2분 돌려 주세요.', 2]],
    subs: { multigrain: ['rice'] },
  }),
  R({
    id: 'zucchini_jeon', title: '애호박전, 콩나물국과 잡곡밥', emoji: '🥞', meals: ['lunch', 'dinner'], main: 'jeon',
    prep: 8, cook: 15, tags: ['채소', '국물'],
    items: [['zucchini', 100], ['egg', 50], ['flour', 20], ['oil', 7], ['bean_sprouts', 60], ['broth', 250], ['salt', 0.8], ['multigrain', 150]],
    steps: [['애호박을 동그랗게 썰어 밀가루를 묻히고 달걀물을 입혀 주세요.'], ['기름 두른 팬에 약한 불로 앞뒤 노릇하게 부쳐 주세요.', 6], ['육수에 콩나물을 넣고 끓여 소금으로 간해 주세요.', 6]],
    subs: { zucchini: ['eggplant'], multigrain: ['rice'] },
  }),
  R({
    id: 'braised_chicken', title: '순한 닭볶음탕과 잡곡밥', emoji: '🍗', meals: ['dinner'], main: 'chicken',
    prep: 10, cook: 30, difficulty: 2, soft: true, tags: ['고기'],
    items: [['chicken_thigh', 110], ['potato', 80], ['carrot', 30], ['onion', 40], ['soy', 9], ['red_pepper', 2], ['garlic', 5], ['sugar', 3], ['multigrain', 150]],
    steps: [['닭고기는 끓는 물에 한 번 데쳐 헹궈 주세요.', 3], ['냄비에 닭고기·물 2컵·간장·고춧가루·마늘·설탕을 넣고 끓여 주세요.', 10], ['감자·당근을 넣고 부드러워질 때까지 졸여 주세요.', 15], ['양파를 넣고 5분 더 끓여 주세요.', 5]],
    subs: { chicken_thigh: ['chicken_breast', 'pork'], multigrain: ['rice'] },
  }),
  R({
    id: 'janchi_noodle', title: '잔치국수', emoji: '🍜', meals: ['lunch'], main: 'janchi',
    prep: 8, cook: 12, soft: true, tags: ['면', '국물'],
    items: [['noodle', 220], ['egg', 40], ['zucchini', 40], ['carrot', 15], ['broth', 400], ['soy', 5], ['laver', 1], ['kimchi', 30]],
    steps: [['애호박·당근을 채 썰어 살짝 볶고 달걀은 지단으로 부쳐 채 썰어 주세요.', 5], ['국수를 삶아 찬물에 헹궈 주세요.', 4], ['육수를 끓여 간장으로 간해 주세요.', 3], ['그릇에 면·고명을 올리고 육수를 부어 주세요.']],
    subs: { noodle: ['buckwheat'], kimchi: ['cucumber'] },
    tip: '국물은 절반 정도만 드시면 나트륨을 줄일 수 있어요.',
  }),
  R({
    id: 'mackerel_radish_braise', title: '고등어무조림과 잡곡밥', emoji: '🐟', meals: ['dinner'], main: 'mackerel',
    prep: 8, cook: 20, difficulty: 2, soft: true, tags: ['생선'],
    items: [['mackerel', 90], ['radish', 100], ['onion', 30], ['soy', 7], ['red_pepper', 2], ['garlic', 4], ['green_onion', 10], ['multigrain', 160]],
    steps: [['무를 도톰하게 썰어 냄비 바닥에 깔아 주세요.'], ['고등어를 올리고 간장·고춧가루·마늘·물 1컵을 섞어 부어 주세요.'], ['뚜껑을 덮고 중약불에서 무가 부드러워질 때까지 졸여 주세요.', 18], ['양파·대파를 넣고 2분 더 끓여 주세요.', 2]],
    subs: { mackerel: ['pollock'], multigrain: ['rice'] },
  }),
  R({
    id: 'pork_cabbage_stirfry', title: '돼지고기 양배추볶음과 잡곡밥', emoji: '🥬', meals: ['lunch', 'dinner'], main: 'porkstir',
    prep: 7, cook: 10, tags: ['고기', '채소'],
    items: [['pork', 80], ['cabbage', 100], ['carrot', 20], ['onion', 30], ['garlic', 3], ['soy', 7], ['oil', 4], ['multigrain', 160]],
    steps: [['돼지고기와 채소를 한입 크기로 썰어 주세요.'], ['기름에 마늘과 고기를 속까지 익도록 볶아 주세요.', 5], ['양배추·당근·양파를 넣고 숨이 죽을 때까지 볶아 주세요.', 4], ['간장으로 간해 밥과 함께 드세요.']],
    subs: { pork: ['chicken_breast', 'tofu'], multigrain: ['rice'] },
  }),
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export const DIFFICULTY_LABEL = { 1: '쉬움', 2: '보통', 3: '어려움' };
export const MEAL_LABEL = { breakfast: '아침', lunch: '점심', dinner: '저녁' };
export const PREFERENCE_TAGS = ['국물', '생선', '고기', '채소', '면', '죽', '빵', '간편'];

export function recipeItems(recipe, subs = {}) {
  return recipe.items.map(([id, g]) => [subs[id] || id, g, id]);
}

export function recipeAllergens(recipe, subs = {}) {
  const set = new Set();
  for (const [id] of recipeItems(recipe, subs)) for (const a of ING[id]?.allergens || []) set.add(a);
  return [...set];
}

export const RECIPE_SOURCE_NOTE = `영양정보: ${NUTRITION_SOURCE.name} (갱신 ${NUTRITION_SOURCE.updatedAt})`;

// 달력 색 점·범례용 음식 분류
export const FOOD_GROUPS = {
  fish: { label: '생선·해산물', color: '#2b66d9' },
  meat: { label: '닭·육류', color: '#f08a24' },
  tofu: { label: '두부·콩', color: '#d9a400' },
  veg: { label: '채소 중심', color: '#2f9e44' },
};
const NOT_SEAFOOD = new Set(['broth', 'miyeok', 'laver']);
export function foodGroup(r) {
  if (!r) return null;
  const ids = r.items.map(([id]) => id);
  if (ids.some((id) => ING[id]?.cat === '수산물' && !NOT_SEAFOOD.has(id))) return 'fish';
  if (ids.some((id) => ING[id]?.cat === '육류')) return 'meat';
  if (ids.some((id) => ['tofu', 'soft_tofu', 'black_bean'].includes(id))) return 'tofu';
  return 'veg';
}

// 표 칸에 들어갈 짧은 이름: "고등어구이, 시금치된장국과 잡곡밥" → "고등어구이·시금치된장국"
export function shortTitle(r) {
  if (!r) return '';
  const parts = r.title.split(/, |과 |와 /).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, 2).join('·');
}
