// 홈 배너의 '권장 섭취량' 숫자 카드 — ShadcnSpace statistics-01(KPI 카드) 블록을 앱 데이터에 맞춘 것
// 원본: ./blocks/statistics-01/statistics.jsx
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '../../store';
import { round } from '../../lib/nutrition';
import { t } from '../../i18n';

export default function TargetStats() {
  const { targets } = useStore();
  const range = (v) => `${round(v * 0.9)}~${round(v * 1.1)} g`;
  const stats = [
    { label: t('권장 섭취량 (1일)'), val: t('약 {n} kcal', { n: targets.kcal.toLocaleString() }) },
    { label: t('단백질'), val: range(targets.protein) },
    { label: t('탄수화물'), val: range(targets.carb) },
    { label: t('지방'), val: range(targets.fat) },
  ];
  return (
    <ul className="m-0 grid flex-[2_1_640px] list-none grid-cols-2 xl:grid-cols-4 gap-3 p-0">
      {stats.map(({ label, val }) => (
        <li key={label} className="min-w-0">
          <Card className="h-full gap-0 py-4 ring-0 border border-border shadow-none">
            <CardContent className="flex min-w-0 flex-col gap-1 px-4">
              <span className="text-sm leading-tight text-muted-foreground">{label}</span>
              <b className="text-xl font-semibold leading-snug whitespace-nowrap tabular-nums text-card-foreground">{val}</b>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
