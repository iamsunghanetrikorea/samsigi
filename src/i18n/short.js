// 휴대폰 '식재료로 요리 추천' 사진 이름: 일본어·영어 이름이 두 줄이 되면 핵심 낱말만 남긴 짧은 이름 (한국어 원문을 열쇠로)
import { getLang } from './index';

const SHORT = {
  ja: {
    // 재료
    오트밀: 'オーツ', 통밀식빵: '食パン', '칼국수면(삶은 것)': 'カルグクス', '라면사리(마른 면)': 'ラーメン', '쫄면(삶은 것)': 'チョル麺',
    '다진 마늘': 'にんにく', 브로콜리: 'ブロッコリ', 깻잎: 'エゴマ葉', '동태(명태)': 'タラ', '김(구운 것)': 'のり',
    배추김치: 'キムチ', '만두(냉동)': '餃子', 고추장: 'コチュジャン', 올리브유: 'オリーブ油', 굴소스: 'オイスター',
    토마토케첩: 'ケチャップ', 햄버거: 'バーガー',
  },
  en: {
    // 분류 (짧은 이름을 쓰는 분류만)
    채소: 'Veggies', 양념: 'Sauces',
    // 재료
    쌀밥: 'Rice', 잡곡밥: 'Multigrain', 통밀식빵: 'Bread', 고구마: 'Sweet pot.', 감자: 'Potato',
    '메밀국수(삶은 것)': 'Soba', '칼국수면(삶은 것)': 'Kalguksu', 떡국떡: 'Tteokguk', '당면(삶은 것)': 'Glass ndl.',
    '라면사리(마른 면)': 'Ramen', '쫄면(삶은 것)': 'Jjolmyeon', '우동면(삶은 것)': 'Udon',
    애호박: 'Zucchini', 대파: 'Scallion', '다진 마늘': 'Garlic', 콩나물: 'Soy sprout', 배추: 'Napa', 무: 'Radish',
    단호박: 'Kabocha', 깻잎: 'Perilla', 부추: 'Chives', 파프리카: 'Paprika', 숙주: 'Mung bean',
    '검은콩(삶은 것)': 'Black bean', 닭가슴살: 'Chk breast', 닭다리살: 'Chk thigh',
    '동태(명태)': 'Pollock', '참치(통조림, 기름 뺀 것)': 'Tuna', '김(구운 것)': 'Laver',
    배추김치: 'Kimchi', 단무지: 'Danmuji', 식용유: 'Oil', 고춧가루: 'Chili', 올리브유: 'Olive oil',
    굴소스: 'Oyster', 들깨가루: 'Perilla pd', 깨: 'Sesame', 마요네즈: 'Mayo', 토마토케첩: 'Ketchup',
    떡: 'Rice cake', 추어탕: 'Chueotang', 참기름: 'Sesame oil',
  },
};

// 짧은 이름이 따로 있으면 돌려줌 (없으면 null → 원래 이름 그대로)
export function tShort(ko) { return SHORT[getLang()]?.[ko] || null; }
