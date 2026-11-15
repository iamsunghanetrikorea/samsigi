// 업데이트 추천 메뉴 묶음 — 레시피 모음의 '메뉴 자동 추가' 버튼으로 분류마다 하나씩 추가됩니다.
// 널리 쓰이는 가정식 조리법을 바탕으로 60세 이상에 맞게 간을 줄이고 조리 단계를 단순화해 작성했습니다.
// 재료량은 1인분 기준(g·mL), 영양은 식재료 DB로 계산합니다. 참고 영상·자료 링크는 recipeRefs()로 만듭니다.
import { RECIPES, RECIPE_BY_ID, CATEGORIES } from './recipes';

const P = (r) => ({ difficulty: 1, soft: false, tags: [], subs: {}, isNew: true, source: '건강한 세 끼 추천 레시피 (가정식 조리법 참고, 저염 조정)', ...r });
const LD = ['lunch', 'dinner'];

export const PACK = [
  // ───── 한식 ─────
  P({ id: 'p_japchae_rice', category: '한식', title: '잡채밥', emoji: '🍜', meals: LD, main: 'japchae', prep: 15, cook: 15, difficulty: 2, tags: ['채소', '고기'],
    items: [['glass_noodle', 100], ['pork', 40], ['spinach', 40], ['carrot', 20], ['onion', 30], ['mushroom', 30], ['soy', 8], ['sugar', 3], ['sesame_oil', 4], ['oil', 3], ['multigrain', 120]],
    steps: [['당면을 끓는 물에 6분 삶아 찬물에 헹궈 먹기 좋게 잘라 주세요.', 6], ['시금치는 데치고, 당근·양파·버섯은 채 썰어 주세요.'], ['기름에 돼지고기와 채소를 볶아 주세요.', 4], ['당면과 간장·설탕·참기름을 넣고 2분 더 볶아 밥 위에 올려 주세요.', 2]],
    subs: { pork: ['beef', 'tofu'], multigrain: ['rice'] } }),
  P({ id: 'p_kongnamul_bap', category: '한식', title: '소고기 콩나물밥과 양념장', emoji: '🌱', meals: LD, main: 'kongnamulbap', prep: 10, cook: 25, tags: ['채소', '고기'],
    items: [['multigrain', 160], ['bean_sprouts', 80], ['beef', 50], ['soy', 6], ['sesame_oil', 3], ['green_onion', 10], ['garlic', 3], ['red_pepper', 1]],
    steps: [['쌀을 씻어 평소보다 물을 조금 적게 잡아 주세요.'], ['간장 조금에 버무린 소고기와 콩나물을 쌀 위에 올려 밥을 지어 주세요.', 25], ['간장·대파·마늘·고춧가루·참기름으로 양념장을 만들어 주세요.'], ['밥을 고루 섞고 양념장을 조금씩 곁들여 드세요.']],
    subs: { beef: ['pork'] }, tip: '양념장은 한 숟가락 정도만 넣어도 충분해요.' }),
  P({ id: 'p_chicken_ssambap', category: '한식', title: '닭가슴살 채소 쌈밥', emoji: '🥬', meals: LD, main: 'ssambap', prep: 10, cook: 10, tags: ['채소', '고기'],
    items: [['chicken_breast', 90], ['cabbage', 70], ['perilla', 8], ['cucumber', 40], ['doenjang', 8], ['sesame_oil', 2], ['garlic', 2], ['multigrain', 160]],
    steps: [['닭가슴살을 끓는 물에 12분 삶아 결대로 찢어 주세요.', 12], ['양배추는 5분 쪄서 한 장씩 떼어 주세요.', 5], ['된장·마늘·참기름을 섞어 쌈장을 만들어 주세요.'], ['양배추·깻잎에 밥, 닭고기, 오이를 올려 쌈장을 조금 얹어 싸 드세요.']],
    subs: { chicken_breast: ['pork', 'tofu'], cabbage: ['napa'] } }),
  P({ id: 'p_gaji_bap', category: '한식', title: '가지밥과 양념간장', emoji: '🍆', meals: LD, main: 'gajibap', prep: 10, cook: 25, soft: true, tags: ['채소'],
    items: [['multigrain', 170], ['eggplant', 100], ['pork', 40], ['soy', 7], ['green_onion', 10], ['garlic', 3], ['sesame_oil', 3], ['oil', 2]],
    steps: [['가지를 깍둑 썰어 주세요.'], ['기름에 돼지고기와 가지를 간장 조금 넣고 볶아 주세요.', 4], ['씻은 쌀 위에 올려 밥을 지어 주세요.', 25], ['간장·대파·마늘·참기름 양념장을 조금 곁들여 비벼 드세요.']],
    subs: { pork: ['beef', 'tofu'] } }),
  P({ id: 'p_tofu_duruchigi', category: '한식', title: '돼지고기 두부두루치기', emoji: '🍲', meals: LD, main: 'duruchigi', prep: 10, cook: 15, tags: ['고기'],
    items: [['pork', 60], ['tofu', 100], ['kimchi', 40], ['onion', 30], ['green_onion', 10], ['red_pepper', 2], ['garlic', 3], ['oil', 3], ['multigrain', 150]],
    steps: [['돼지고기·김치·양파는 한입 크기, 두부는 도톰하게 썰어 주세요.'], ['기름에 돼지고기와 김치를 볶아 주세요.', 4], ['물 반 컵, 고춧가루·마늘·양파를 넣고 끓으면 두부를 넣어 졸여 주세요.', 8], ['대파를 넣고 밥과 함께 드세요.']],
    subs: { pork: ['chicken_thigh'] } }),
  P({ id: 'p_veg_gimbap', category: '한식', title: '시금치 달걀 김밥', emoji: '🍙', meals: ['breakfast', 'lunch'], main: 'gimbap', prep: 15, cook: 10, difficulty: 2, tags: ['간편', '채소'],
    items: [['rice', 180], ['laver', 3], ['egg', 50], ['spinach', 50], ['carrot', 30], ['cucumber', 30], ['sesame_oil', 3], ['salt', 0.5]],
    steps: [['밥에 참기름·소금 조금을 넣어 섞어 주세요.'], ['시금치는 데치고, 당근은 채 썰어 볶고, 달걀은 도톰하게 부쳐 길게 썰어 주세요.', 6], ['김 위에 밥을 얇게 펴고 재료를 올려 단단히 말아 주세요.'], ['한입 크기로 썰어 주세요.']],
    subs: { rice: ['multigrain'], cucumber: ['perilla'] } }),

  // ───── 중식 ─────
  P({ id: 'p_mapo_tofu', category: '중식', title: '순한 마파두부 덮밥', emoji: '🥘', meals: LD, main: 'mapo', prep: 10, cook: 10, soft: true, tags: ['고기'],
    items: [['tofu', 150], ['pork', 40], ['green_onion', 10], ['garlic', 3], ['doenjang', 6], ['red_pepper', 1], ['starch', 5], ['oil', 4], ['multigrain', 160]],
    steps: [['두부는 깍둑 썰고 돼지고기는 잘게 다져 주세요.'], ['기름에 마늘·대파·돼지고기를 볶다가 된장·고춧가루를 넣어 주세요.', 3], ['물 반 컵과 두부를 넣고 끓여 주세요.', 4], ['전분물을 조금 넣어 걸쭉하게 만든 뒤 밥 위에 올려 주세요.']],
    subs: { pork: ['beef', 'chicken_breast'] }, tip: '두반장 대신 된장을 조금 써서 맵지 않고 짜지 않게 만들었어요.' }),
  P({ id: 'p_bokchoy_shrimp', category: '중식', title: '청경채 새우볶음과 밥', emoji: '🦐', meals: LD, main: 'bokchoyshrimp', prep: 8, cook: 7, tags: ['채소'],
    items: [['shrimp', 70], ['bok_choy', 100], ['garlic', 4], ['oyster_sauce', 6], ['starch', 3], ['oil', 4], ['rice', 170]],
    steps: [['청경채는 길게 반으로 갈라 씻어 주세요.'], ['기름에 마늘과 새우를 새우가 빨갛게 익을 때까지 볶아 주세요.', 3], ['청경채와 굴소스를 넣고 1~2분 볶아 주세요.', 2], ['전분물을 조금 넣어 윤기를 내고 밥과 함께 드세요.']],
    subs: { shrimp: ['chicken_breast', 'tofu'], bok_choy: ['cabbage'], rice: ['multigrain'] } }),
  P({ id: 'p_chive_egg', category: '중식', title: '부추 달걀볶음', emoji: '🍳', meals: ['breakfast', 'lunch', 'dinner'], main: 'chiveegg', prep: 5, cook: 5, soft: true, tags: ['간편', '채소'],
    items: [['chives', 80], ['egg', 100], ['oil', 4], ['salt', 0.5], ['multigrain', 160]],
    steps: [['부추를 4cm 길이로 썰어 주세요.'], ['달걀을 풀어 기름에 반쯤 익혀 덜어 두세요.', 1], ['부추를 30초 볶고 달걀을 다시 넣어 소금 조금으로 간해 주세요.', 1], ['밥과 함께 드세요.']],
    subs: { chives: ['spinach', 'tomato'] } }),
  P({ id: 'p_chicken_tangsu', category: '중식', title: '구운 닭고기 채소탕수와 밥', emoji: '🍗', meals: LD, main: 'tangsu', prep: 10, cook: 15, difficulty: 2, tags: ['고기'],
    items: [['chicken_breast', 100], ['starch', 15], ['oil', 6], ['onion', 30], ['carrot', 20], ['cucumber', 30], ['sugar', 6], ['soy', 4], ['rice', 150]],
    steps: [['닭가슴살을 한입 크기로 썰어 전분을 묻혀 주세요.'], ['기름을 조금 두른 팬에 앞뒤로 노릇하게 구워 주세요.', 8], ['물 반 컵, 설탕·간장과 채소를 끓이다 전분물로 걸쭉하게 소스를 만들어 주세요.', 4], ['구운 닭고기에 소스를 부어 밥과 함께 드세요.']],
    subs: { chicken_breast: ['pork'], rice: ['multigrain'] }, tip: '튀기지 않고 구워서 기름을 줄였어요.' }),
  P({ id: 'p_palbochae_bowl', category: '중식', title: '해물 채소 덮밥(팔보채식)', emoji: '🍛', meals: LD, main: 'palbochae', prep: 12, cook: 8, tags: ['채소'],
    items: [['shrimp', 50], ['clam', 30], ['bok_choy', 50], ['mushroom', 40], ['carrot', 20], ['oyster_sauce', 6], ['starch', 5], ['oil', 4], ['rice', 160]],
    steps: [['채소를 한입 크기로 썰고 해물은 씻어 주세요.'], ['기름에 해물을 볶다가 채소를 넣어 볶아 주세요.', 4], ['물 반 컵과 굴소스를 넣고 끓으면 전분물로 걸쭉하게 해 주세요.', 2], ['밥 위에 듬뿍 올려 주세요.']],
    subs: { shrimp: ['chicken_breast'], rice: ['multigrain'] } }),
  P({ id: 'p_tomato_egg_noodle', category: '중식', title: '토마토 달걀 탕면', emoji: '🍜', meals: ['lunch'], main: 'tomatonoodle', prep: 5, cook: 12, soft: true, tags: ['면', '국물'],
    items: [['noodle', 200], ['tomato', 120], ['egg', 50], ['green_onion', 10], ['broth', 350], ['salt', 0.8], ['oil', 3]],
    steps: [['토마토를 한입 크기로 썰어 기름에 볶아 주세요.', 3], ['육수를 붓고 끓으면 달걀을 풀어 넣어 주세요.', 4], ['국수를 따로 삶아 그릇에 담아 주세요.', 4], ['국물을 붓고 대파를 올려 주세요.']],
    subs: { noodle: ['buckwheat'] } }),

  // ───── 양식 ─────
  P({ id: 'p_tomato_pasta', category: '양식', title: '토마토 닭가슴살 파스타', emoji: '🍝', meals: LD, main: 'pasta', prep: 10, cook: 15, tags: ['면', '고기'],
    items: [['pasta', 200], ['chicken_breast', 70], ['tomato', 150], ['onion', 40], ['garlic', 4], ['olive_oil', 6], ['salt', 0.6], ['broccoli', 40]],
    steps: [['파스타를 끓는 물에 봉지 시간대로 삶아 주세요.', 10], ['올리브유에 마늘·양파·닭고기를 볶아 주세요.', 4], ['썬 토마토와 브로콜리를 넣고 으깨며 졸여 주세요.', 5], ['파스타를 넣고 섞어 소금 조금으로 간해 주세요.']],
    subs: { chicken_breast: ['shrimp', 'tofu'] } }),
  P({ id: 'p_mushroom_risotto', category: '양식', title: '버섯 우유 리조또', emoji: '🍚', meals: LD, main: 'risotto', prep: 5, cook: 12, soft: true, tags: ['죽'],
    items: [['rice', 150], ['mushroom', 80], ['onion', 30], ['milk', 150], ['cheese', 10], ['olive_oil', 5], ['salt', 0.5]],
    steps: [['버섯과 양파를 잘게 썰어 올리브유에 볶아 주세요.', 4], ['밥과 우유를 넣고 저어 가며 끓여 주세요.', 6], ['치즈를 넣어 녹이고 소금 조금으로 간해 주세요.']],
    subs: { milk: ['broth'], rice: ['multigrain'] } }),
  P({ id: 'p_salmon_steak', category: '양식', title: '연어구이와 감자·채소구이', emoji: '🐟', meals: ['dinner'], main: 'salmonsteak', prep: 10, cook: 20, tags: ['생선', '채소'],
    items: [['salmon', 100], ['potato', 120], ['broccoli', 60], ['paprika', 40], ['olive_oil', 6], ['salt', 0.6]],
    steps: [['감자는 한입 크기로 썰어 전자레인지에 5분 익혀 주세요.', 5], ['팬에 올리브유를 두르고 감자·브로콜리·파프리카를 구워 주세요.', 6], ['연어를 앞뒤로 속까지 완전히 익혀 주세요.', 8], ['소금 조금을 뿌려 함께 담아 주세요.']],
    subs: { salmon: ['mackerel', 'chicken_breast'] } }),
  P({ id: 'p_pumpkin_soup', category: '양식', title: '단호박 수프와 통밀빵', emoji: '🎃', meals: ['breakfast', 'lunch'], main: 'pumpkinsoup', prep: 10, cook: 15, soft: true, tags: ['빵', '국물'],
    items: [['pumpkin', 200], ['milk', 150], ['onion', 30], ['olive_oil', 4], ['salt', 0.6], ['bread', 50], ['egg', 50]],
    steps: [['단호박을 전자레인지에 5분 익혀 껍질을 벗겨 주세요.', 5], ['올리브유에 양파를 볶고 단호박·우유를 넣어 으깨며 끓여 주세요.', 8], ['소금 조금으로 간해 주세요.'], ['빵과 삶은 달걀을 곁들여 주세요.']],
    subs: { milk: ['yogurt'] } }),
  P({ id: 'p_chicken_salad', category: '양식', title: '닭가슴살 샐러드와 고구마', emoji: '🥗', meals: ['lunch', 'dinner'], main: 'chickensalad', prep: 10, cook: 12, tags: ['채소', '고기'],
    items: [['chicken_breast', 100], ['cabbage', 50], ['cucumber', 50], ['tomato', 80], ['paprika', 30], ['olive_oil', 8], ['yogurt', 30], ['sweet_potato', 120]],
    steps: [['닭가슴살을 12분 삶아 썰어 주세요.', 12], ['고구마는 전자레인지에 6분 익혀 주세요.', 6], ['채소를 한입 크기로 썰어 담아 주세요.'], ['요거트와 올리브유를 섞은 드레싱을 뿌려 주세요.']],
    subs: { chicken_breast: ['tofu', 'egg'] } }),
  P({ id: 'p_omelette', category: '양식', title: '채소 오믈렛과 토스트', emoji: '🍳', meals: ['breakfast'], main: 'omelette', prep: 5, cook: 8, soft: true, tags: ['빵', '간편'],
    items: [['egg', 100], ['paprika', 30], ['onion', 30], ['spinach', 30], ['milk', 30], ['olive_oil', 4], ['salt', 0.5], ['bread', 50]],
    steps: [['채소를 잘게 썰어 주세요.'], ['달걀에 우유·소금을 넣고 풀어 주세요.'], ['팬에 채소를 볶다 달걀물을 부어 약한 불에서 반으로 접어 익혀 주세요.', 5], ['구운 빵과 함께 드세요.']],
    subs: { spinach: ['broccoli'] } }),

  // ───── 간식 ─────
  P({ id: 'p_sweetpotato_milk', category: '간식', title: '고구마 우유', emoji: '🥛', meals: ['snack'], main: 'snack1', prep: 3, cook: 6, soft: true, tags: ['간편'],
    items: [['sweet_potato', 80], ['milk', 150]],
    steps: [['고구마를 전자레인지에 5분 익혀 껍질을 벗겨 주세요.', 5], ['우유와 함께 믹서에 곱게 갈아 주세요.'], ['따뜻하게 데워 드셔도 좋아요.']] }),
  P({ id: 'p_steamed_pumpkin', category: '간식', title: '단호박 찜', emoji: '🎃', meals: ['snack'], main: 'snack2', prep: 3, cook: 8, soft: true, tags: ['간편'],
    items: [['pumpkin', 150]],
    steps: [['단호박을 깨끗이 씻어 씨를 빼 주세요.'], ['찜기에 8분 쪄 주세요. (전자레인지는 5분)', 8], ['한 김 식혀 드세요.']] }),
  P({ id: 'p_banana_yogurt', category: '간식', title: '바나나 요거트 볼', emoji: '🍌', meals: ['snack'], main: 'snack3', prep: 3, cook: 0, soft: true, tags: ['간편'],
    items: [['banana', 60], ['yogurt', 100], ['walnut', 5]],
    steps: [['바나나를 얇게 썰어 주세요.'], ['요거트 위에 바나나와 부순 호두를 올려 주세요.']] }),
  P({ id: 'p_red_bean_porridge', category: '간식', title: '단팥죽 (작은 그릇)', emoji: '🫘', meals: ['snack'], main: 'snack4', prep: 5, cook: 15, soft: true, tags: ['죽'],
    items: [['red_bean', 80], ['rice', 30], ['sugar', 8], ['salt', 0.2]],
    steps: [['삶은 팥을 물 1컵과 함께 곱게 갈아 주세요.'], ['밥을 넣고 저어 가며 끓여 주세요.', 12], ['설탕·소금 조금으로 맛을 맞춰 주세요.']], tip: '설탕은 취향에 따라 줄여 주세요.' }),
  P({ id: 'p_tofu_snack', category: '간식', title: '구운 두부 한 접시', emoji: '🧈', meals: ['snack'], main: 'snack5', prep: 3, cook: 8, soft: true, tags: ['간편'],
    items: [['tofu', 100], ['oil', 3], ['sesame', 2], ['soy', 2]],
    steps: [['두부를 길게 썰어 물기를 닦아 주세요.'], ['기름을 조금 두른 팬에 앞뒤로 노릇하게 구워 주세요.', 7], ['간장을 아주 조금 바르고 깨를 뿌려 주세요.']] }),
  P({ id: 'p_egg_tomato_snack', category: '간식', title: '삶은 달걀과 토마토', emoji: '🥚', meals: ['snack'], main: 'snack6', prep: 2, cook: 12, soft: true, tags: ['간편'],
    items: [['egg', 50], ['tomato', 100]],
    steps: [['달걀을 끓는 물에 12분 삶아 찬물에 식혀 주세요.', 12], ['토마토를 한입 크기로 썰어 함께 담아 주세요.']] }),

  // ───── 찌개 ─────
  P({ id: 'p_sundubu_jjigae', category: '찌개', title: '순한 순두부찌개', emoji: '🥘', meals: LD, main: 'sundubu', prep: 5, cook: 12, soft: true, tags: ['국물'],
    items: [['soft_tofu', 200], ['clam', 30], ['egg', 50], ['zucchini', 30], ['onion', 20], ['red_pepper', 2], ['garlic', 3], ['broth', 200], ['multigrain', 150]],
    steps: [['애호박·양파를 작게 썰어 주세요.'], ['육수에 바지락·채소·고춧가루·마늘을 넣고 끓여 주세요.', 5], ['순두부를 큼직하게 떠 넣고 끓여 주세요.', 4], ['달걀을 깨 넣고 1분 더 끓여 주세요.', 1]],
    subs: { clam: ['pork', 'shrimp'] } }),
  P({ id: 'p_zucchini_gochujang', category: '찌개', title: '애호박 고추장찌개', emoji: '🍲', meals: LD, main: 'gochujangjjigae', prep: 8, cook: 15, tags: ['국물', '고기'],
    items: [['zucchini', 100], ['potato', 50], ['pork', 40], ['gochujang', 10], ['onion', 30], ['green_onion', 10], ['broth', 250], ['multigrain', 160]],
    steps: [['애호박·감자·양파·돼지고기를 한입 크기로 썰어 주세요.'], ['냄비에 돼지고기를 볶다 육수와 고추장을 풀어 주세요.', 3], ['감자를 넣고 끓이다 애호박·양파를 넣어 주세요.', 10], ['대파를 넣고 마무리해 주세요.']],
    subs: { pork: ['tofu'] } }),
  P({ id: 'p_dongtae_jjigae', category: '찌개', title: '동태찌개', emoji: '🐟', meals: ['dinner'], main: 'dongtaejjigae', prep: 10, cook: 20, soft: true, tags: ['생선', '국물'],
    items: [['pollock', 100], ['radish', 60], ['tofu', 50], ['zucchini', 30], ['red_pepper', 2], ['garlic', 3], ['green_onion', 10], ['broth', 300], ['multigrain', 150]],
    steps: [['무는 나박하게, 동태는 토막 내어 씻어 주세요.'], ['육수에 무·고춧가루·마늘을 넣고 끓여 주세요.', 7], ['동태·두부·애호박을 넣고 충분히 익혀 주세요.', 10], ['대파를 넣어 주세요.']],
    subs: { pollock: ['flatfish'] } }),
  P({ id: 'p_clear_tofu_jjigae', category: '찌개', title: '맑은 두부새우찌개', emoji: '🍲', meals: LD, main: 'cleartofu', prep: 5, cook: 12, soft: true, tags: ['국물'],
    items: [['tofu', 150], ['zucchini', 50], ['shrimp', 30], ['green_onion', 10], ['garlic', 3], ['salt', 0.6], ['broth', 300], ['multigrain', 150]],
    steps: [['두부·애호박을 깍둑 썰어 주세요.'], ['육수에 애호박·새우·마늘을 넣고 끓여 주세요.', 5], ['두부를 넣고 끓으면 소금 조금으로 간해 주세요.', 5], ['대파를 넣어 주세요.']],
    subs: { shrimp: ['clam'] } }),
  P({ id: 'p_mackerel_kimchi', category: '찌개', title: '고등어 김치찌개', emoji: '🐟', meals: ['dinner'], main: 'mackerelkimchi', prep: 8, cook: 20, tags: ['생선', '국물'],
    items: [['mackerel', 80], ['kimchi', 60], ['onion', 30], ['green_onion', 10], ['garlic', 3], ['broth', 250], ['multigrain', 150]],
    steps: [['김치를 냄비 바닥에 깔고 고등어 토막을 올려 주세요.'], ['육수와 마늘을 붓고 뚜껑을 덮어 끓여 주세요.', 15], ['양파·대파를 넣고 5분 더 끓여 주세요.', 5]],
    subs: { mackerel: ['pork'] }, tip: '김치가 짜면 육수를 조금 더 넣어 주세요.' }),
  P({ id: 'p_napa_doenjang', category: '찌개', title: '배추 된장찌개', emoji: '🥬', meals: LD, main: 'napadoenjang', prep: 8, cook: 15, soft: true, tags: ['국물', '채소'],
    items: [['napa', 100], ['doenjang', 14], ['tofu', 60], ['beef', 30], ['garlic', 3], ['green_onion', 10], ['broth', 300], ['multigrain', 150]],
    steps: [['배추·두부를 한입 크기로 썰어 주세요.'], ['육수에 된장을 풀고 소고기·배추를 넣어 끓여 주세요.', 8], ['두부·마늘을 넣고 5분 더 끓여 주세요.', 5], ['대파를 넣어 주세요.']],
    subs: { beef: ['clam'] } }),

  // ───── 국 ─────
  P({ id: 'p_tofu_miyeok', category: '국', title: '두부 미역국', emoji: '🥣', meals: ['breakfast', 'lunch', 'dinner'], main: 'tofumiyeok', prep: 10, cook: 15, soft: true, tags: ['국물'],
    items: [['miyeok', 6], ['tofu', 80], ['sesame_oil', 3], ['garlic', 3], ['soy', 5], ['multigrain', 150]],
    steps: [['미역을 10분 불려 먹기 좋게 잘라 주세요.', 10], ['참기름에 미역을 볶다 물 2컵을 부어 주세요.', 2], ['두부·마늘을 넣고 끓여 간장으로 간해 주세요.', 10]] }),
  P({ id: 'p_spinach_doenjangguk', category: '국', title: '시금치 된장국', emoji: '🥬', meals: ['breakfast', 'lunch', 'dinner'], main: 'spinachguk', prep: 5, cook: 10, soft: true, tags: ['국물', '채소'],
    items: [['spinach', 80], ['doenjang', 12], ['tofu', 50], ['broth', 300], ['multigrain', 150]],
    steps: [['시금치를 씻어 먹기 좋게 잘라 주세요.'], ['육수에 된장을 풀어 끓여 주세요.', 4], ['시금치·두부를 넣고 3분 더 끓여 주세요.', 3]] }),
  P({ id: 'p_mushroom_deulkkae', category: '국', title: '버섯 들깨탕', emoji: '🍄', meals: LD, main: 'deulkkae', prep: 8, cook: 15, soft: true, tags: ['국물', '채소'],
    items: [['mushroom', 100], ['perilla_powder', 15], ['potato', 40], ['onion', 30], ['broth', 300], ['salt', 0.6], ['multigrain', 150]],
    steps: [['버섯은 찢고 감자·양파는 얇게 썰어 주세요.'], ['육수에 감자를 넣고 끓여 주세요.', 5], ['버섯·양파를 넣고 끓으면 들깨가루를 풀어 주세요.', 6], ['소금 조금으로 간해 주세요.']] }),
  P({ id: 'p_napa_beefguk', category: '국', title: '소고기 배춧국', emoji: '🍵', meals: LD, main: 'napaguk', prep: 8, cook: 15, soft: true, tags: ['국물', '고기'],
    items: [['napa', 100], ['beef', 40], ['garlic', 3], ['soy', 5], ['green_onion', 10], ['sesame_oil', 2], ['multigrain', 150]],
    steps: [['배추를 한입 크기로 썰어 주세요.'], ['참기름에 소고기를 볶다 물 2컵을 부어 주세요.', 3], ['배추·마늘을 넣고 부드러워질 때까지 끓여 주세요.', 10], ['간장·대파로 마무리해 주세요.']] }),
  P({ id: 'p_dakgomtang', category: '국', title: '닭곰탕', emoji: '🍗', meals: LD, main: 'dakgomtang', prep: 5, cook: 35, difficulty: 2, soft: true, tags: ['국물', '고기'],
    items: [['chicken_thigh', 100], ['green_onion', 15], ['garlic', 5], ['salt', 0.8], ['rice', 150]],
    steps: [['닭고기를 물 4컵과 마늘을 넣고 끓여 주세요.', 30], ['고기를 건져 결대로 찢어 주세요.'], ['국물에 고기를 다시 넣고 소금 조금으로 간해 주세요.', 3], ['대파를 올리고 밥과 함께 드세요.']] }),
  P({ id: 'p_mung_beefguk', category: '국', title: '숙주 소고기국', emoji: '🥣', meals: LD, main: 'mungguk', prep: 5, cook: 12, soft: true, tags: ['국물'],
    items: [['mung_sprouts', 80], ['beef', 40], ['garlic', 3], ['soy', 5], ['green_onion', 10], ['broth', 300], ['multigrain', 150]],
    steps: [['숙주를 씻어 주세요.'], ['육수에 소고기와 마늘을 넣고 끓여 주세요.', 6], ['숙주를 넣고 2분만 끓여 간장으로 간해 주세요.', 2], ['대파를 넣어 주세요.']] }),
];

export const PACK_BY_ID = Object.fromEntries(PACK.map((r) => [r.id, r]));

// 사용자가 추가한 메뉴만 레시피 목록(RECIPES)에 올림 — 식단 추천·레시피 화면이 그대로 사용
export function syncPack(ids = []) {
  const want = new Set(ids.filter((id) => PACK_BY_ID[id]));
  for (let i = RECIPES.length - 1; i >= 0; i--) {
    if (RECIPES[i].isNew && !want.has(RECIPES[i].id)) { delete RECIPE_BY_ID[RECIPES[i].id]; RECIPES.splice(i, 1); }
  }
  for (const id of want) if (!RECIPE_BY_ID[id]) { RECIPES.push(PACK_BY_ID[id]); RECIPE_BY_ID[id] = PACK_BY_ID[id]; }
}

// 사용자가 직접 입력해 만든 메뉴(isCustom)를 레시피 목록에 올림
export function syncCustom(list = []) {
  const want = new Map(list.map((r) => [r.id, r]));
  for (let i = RECIPES.length - 1; i >= 0; i--) {
    if (RECIPES[i].isCustom && want.get(RECIPES[i].id) !== RECIPES[i]) { delete RECIPE_BY_ID[RECIPES[i].id]; RECIPES.splice(i, 1); }
  }
  for (const r of list) if (!RECIPE_BY_ID[r.id]) { RECIPES.push(r); RECIPE_BY_ID[r.id] = r; }
}

// 다음 업데이트로 추가할 메뉴: 분류마다 아직 없는 메뉴 하나씩
export function nextUpdate(addedIds = []) {
  const added = new Set(addedIds);
  return CATEGORIES.map((c) => PACK.find((r) => r.category === c && !added.has(r.id))).filter(Boolean).map((r) => r.id);
}

// 참고 자료 링크 (유튜브·만개의레시피 검색)
export function recipeRefs(recipe) {
  const q = recipe.title.split(/, |과 |와 /)[0].replace(/\(.*\)/, '').trim();
  return [
    { label: '유튜브 조리 영상', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} 만들기`)}` },
    { label: '만개의레시피', url: `https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(q)}` },
  ];
}
