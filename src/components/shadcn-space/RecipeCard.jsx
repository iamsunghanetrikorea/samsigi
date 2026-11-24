// 레시피 모음의 메뉴 카드 — ShadcnSpace product-listing-01(상품 카드) 블록을 레시피에 맞춘 것
// 원본: https://shadcnspace.com/r/product-listing-01.json (사진 위 배지·찜 버튼, 아래 분류·이름·수치·버튼)
import { Heart, Flame, Beef, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore } from '../../store';
import { MEAL_LABEL, FOOD_GROUPS, foodGroup, menuNo } from '../../data/recipes';
import { photoUrl } from '../../lib/photoMatch';
import { round } from '../../lib/nutrition';
import { go } from '../../router';
import { t } from '../../i18n';

// nutrition 이 없으면 열량·단백질은 빼고, time·note(예: 난이도)·children(재료 태그 등)은 선택
export default function RecipeCard({ recipe: r, nutrition: n, time, note, excluded, actions, narrow, className, children }) {
  const { state, update } = useStore();
  const fav = state.profile.favorites.includes(r.id);
  const title = t(r.title);
  const g = foodGroup(r);
  const toggleFav = () => update('profile', (p) => ({ ...p, favorites: fav ? p.favorites.filter((x) => x !== r.id) : [...p.favorites, r.id] }));
  const open = () => go(`/recipe/${r.id}`);

  return (
    <Card className={cn('group h-full gap-0 rounded-2xl p-0 ring-0 border-2 border-border shadow-xs transition-colors hover:border-primary', excluded && 'opacity-75', narrow && 'mx-auto w-full max-w-sm', className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <button type="button" onClick={open} className="block size-full cursor-pointer border-0 bg-transparent p-0" aria-label={t('{title} 레시피 보기', { title })}>
          {photoUrl(r)
            ? <img src={photoUrl(r)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            : <span aria-hidden className="grid size-full place-items-center text-6xl">{r.emoji || '🍽️'}</span>}
        </button>
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge className="h-auto rounded-full bg-background/95 px-2.5 py-0.5 text-sm font-extrabold text-primary" aria-label={t('메뉴 {n}번', { n: menuNo(r) })}>{menuNo(r)}</Badge>
          {r.isNew && <Badge className="h-auto rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-sm font-extrabold text-white">NEW</Badge>}
          {r.isCustom && <Badge className="h-auto rounded-full px-2.5 py-0.5 text-sm font-extrabold">{t('내 메뉴')}</Badge>}
          {r.isEdited && <Badge className="h-auto rounded-full bg-[var(--warn-bg)] px-2.5 py-0.5 text-sm font-extrabold text-[var(--warn)]">{t('수정됨')}</Badge>}
        </div>
        <button
          type="button"
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={fav ? t('{title} 즐겨찾기 빼기', { title }) : t('{title} 즐겨찾기', { title })}
          className="absolute top-2 right-2 grid size-12 cursor-pointer place-items-center rounded-full border-0 bg-background/95 shadow-sm transition-transform hover:scale-110 motion-reduce:transition-none"
        >
          <Heart className={cn('size-6', fav ? 'fill-red-500 text-red-500' : 'text-foreground')} />
        </button>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {g && <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: FOOD_GROUPS[g].color }} />}
          {t(r.category)} · {r.meals.map((m) => t(MEAL_LABEL[m])).join('·')}
        </span>
        <button type="button" onClick={open} className="cursor-pointer border-0 bg-transparent p-0 text-left text-lg leading-snug font-bold text-foreground hover:text-primary hover:underline">
          {title}
        </button>
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-base text-foreground">
          {n && <li className="flex items-center gap-1"><Flame aria-hidden className="size-4 text-[var(--accent)]" />{round(n.kcal)}kcal</li>}
          {n && <li className="flex items-center gap-1"><Beef aria-hidden className="size-4 text-primary" />{t('단백질 {n}g', { n: round(n.protein) })}</li>}
          <li className="flex items-center gap-1"><Clock aria-hidden className="size-4 text-muted-foreground" />{t('{n}분', { n: time ?? r.prep + r.cook })}{note ? ` · ${note}` : ''}</li>
        </ul>
        {children}
        {excluded && <p className="m-0 text-sm font-semibold text-destructive">{t('제외됨({why})', { why: t(excluded) })}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-1 [&>.btn]:min-w-0 [&>.btn]:flex-1">{actions}</div>
      </CardContent>
    </Card>
  );
}

// 카드 격자 (Tailwind 클래스는 이 폴더에서만 만들어지므로 여기서 감싼다)
export function RecipeGrid({ children }) {
  return <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-0">{children}</ul>;
}
export function RecipeGridItem({ wide, children }) {
  return <li className={wide ? 'col-span-full flex flex-col gap-3' : 'min-w-0'}>{children}</li>;
}

// 재료 태그 줄 (쓰는 재료 = 초록, 더 필요 = 주황)
export function IngredientTags({ label, items, need }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-sm text-muted-foreground">{label}</span>
      {items.map((x) => (
        <Badge key={x} className={cn('h-auto rounded-full px-2.5 py-0.5 text-sm font-bold', need ? 'bg-[var(--warn-bg)] text-[var(--warn)]' : 'bg-[var(--green-soft)] text-[var(--green)]')}>{x}</Badge>
      ))}
    </p>
  );
}
