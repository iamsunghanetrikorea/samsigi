import { FOOD_GROUPS, foodGroup } from '../data/recipes';
import { photoUrl } from '../lib/photoMatch';

// 음식 사진(없으면 이모지) — 테두리 색은 음식 분류
export default function Plate({ recipe, eatOut, size = 'md' }) {
  const g = foodGroup(recipe);
  const photo = recipe && !eatOut && photoUrl(recipe); // 자기 사진이 없으면 비슷한 메뉴 사진
  return (
    <span className={`plate ${size} ${photo ? 'has-photo' : ''}`} style={{ '--ring': g ? FOOD_GROUPS[g].color : '#c9d3e3' }} aria-hidden>
      {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : eatOut ? '🍽️' : recipe?.emoji || '＋'}
    </span>
  );
}
