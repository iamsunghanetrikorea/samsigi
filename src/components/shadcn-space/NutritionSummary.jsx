// 홈 '오늘의 영양 요약' — ShadcnSpace chart-02(도넛 + 항목 목록) 블록을 앱 데이터에 맞춘 것
// 원본: ./blocks/chart-02/chart.jsx
import { Label, Pie, PieChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useStore } from '../../store';
import { MEAL_LABEL } from '../../data/recipes';
import { MEAL_KEYS, dayTotals, round } from '../../lib/nutrition';
import { t } from '../../i18n';

const chartConfig = {
  protein: { color: 'var(--sc-chart-1)' },
  carb: { color: 'var(--sc-chart-2)' },
  fat: { color: 'var(--sc-chart-3)' },
};

export default function NutritionSummary({ date, className }) {
  const { state, targets, setEntry } = useStore();
  const day = state.plans[date] || {};
  const tot = dayTotals(day, targets);
  const parts = [
    { key: 'protein', label: t('단백질'), g: tot.protein, kcal: tot.protein * 4 },
    { key: 'carb', label: t('탄수화물'), g: tot.carb, kcal: tot.carb * 4 },
    { key: 'fat', label: t('지방'), g: tot.fat, kcal: tot.fat * 9 },
  ];
  const sum = parts.reduce((s, p) => s + p.kcal, 0) || 1;
  const has = tot.count > 0;
  const data = has ? parts.map((p) => ({ name: p.key, value: p.kcal, fill: chartConfig[p.key].color })) : [{ name: 'empty', value: 1, fill: 'var(--track)' }];

  const kcalOk = Math.abs(tot.kcal - targets.meals.kcal) <= targets.meals.kcal * 0.1;
  const protOk = tot.protein >= targets.meals.protein * 0.85;
  const naOk = tot.sodium <= targets.sodium;
  const good = has && kcalOk && protOk && naOk;
  const msg = t(!has ? '오늘 식단이 아직 없어요.' : good ? '권장 범위 내에서 균형이 잘 맞아요!' : !protOk ? '단백질이 조금 부족해요. 달걀·두부·우유를 곁들여 보세요.' : !naOk ? '나트륨이 많아요. 국물은 절반만 드세요.' : tot.kcal > targets.meals.kcal ? '열량이 목표보다 조금 많아요.' : '열량이 목표보다 조금 적어요.');

  return (
    <Card className={cn('gap-4 py-5 ring-0 border border-border shadow-xs', className)}>
      <CardHeader className="px-5">
        <CardTitle><h2 className="m-0 text-lg font-bold">{t('오늘의 영양 요약')}</h2></CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-52"
          role="img"
          aria-label={t('섭취 예상 {kcal}kcal, 단백질 {protein}g, 탄수화물 {carb}g, 지방 {fat}g', { kcal: round(tot.kcal), protein: round(tot.protein), carb: round(tot.carb), fat: round(tot.fat) })}
        >
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="96%" startAngle={90} endAngle={-270} paddingAngle={has ? 2 : 0} stroke="none" isAnimationActive={false}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null;
                  const { cx, cy } = viewBox;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={cx} y={cy - 22} className="fill-muted-foreground text-sm">{t('섭취 예상')}</tspan>
                      <tspan x={cx} y={cy + 4} className="fill-foreground text-2xl font-extrabold">{round(tot.kcal).toLocaleString()}</tspan>
                      <tspan x={cx} y={cy + 28} className="fill-muted-foreground text-xs">{t('목표 {n} kcal', { n: round(targets.meals.kcal).toLocaleString() })}</tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-5 w-1.5 rounded-full" style={{ background: chartConfig[p.key].color }} />
                <span className="text-base">{p.label}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <b className="text-base">{round(p.g)} g</b>
                {has && <Badge variant="secondary" className="h-auto px-2 text-sm font-semibold">{round((p.kcal / sum) * 100)}%</Badge>}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span className="text-base">{t('나트륨')}</span>
            </span>
            <b className={cn('text-base', has && !naOk && 'text-destructive')}>{round(tot.sodium).toLocaleString()} mg</b>
          </li>
        </ul>

        <p className={cn('m-0 rounded-lg px-3 py-2 text-base font-bold', good ? 'bg-[var(--green-soft)] text-[var(--green)]' : 'bg-muted')}>
          {good ? '✔ ' : ''}{msg}
        </p>

        {has && (
          <div className="eat-checks">
            <span className="muted small">{t('먹은 끼니 체크')}</span>
            {MEAL_KEYS.filter((k) => day[k]).map((k) => (
              <label key={k} className="check"><input type="checkbox" checked={!!day[k].eaten} onChange={(e) => setEntry(date, k, { ...day[k], eaten: e.target.checked })} />{t(MEAL_LABEL[k])}</label>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border bg-transparent px-5 pt-3 pb-4">
        <p className="m-0 text-sm text-muted-foreground">{t('식품성분표 기반 추정치')}</p>
      </CardFooter>
    </Card>
  );
}
