// 홈 배너의 '권장 섭취량' 숫자 카드 — ShadcnSpace statistics-01(KPI 카드) 블록을 앱 데이터에 맞춘 것
// 원본: ./blocks/statistics-01/statistics.jsx
import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '../../store';
import { round } from '../../lib/nutrition';
import { t } from '../../i18n';

export default function TargetStats() {
  const { targets } = useStore();
  const range = (v) => `${round(v * 0.9)}~${round(v * 1.1)} g`;
  const stats = [
    { icon: Flame, color: 'var(--accent)', label: t('권장 섭취량 (1일)'), val: t('약 {n} kcal', { n: targets.kcal.toLocaleString() }) },
    { icon: Beef, color: 'var(--sc-chart-1)', label: t('단백질'), val: range(targets.protein) },
    { icon: Wheat, color: 'var(--sc-chart-2)', label: t('탄수화물'), val: range(targets.carb) },
    { icon: Droplet, color: 'var(--sc-chart-3)', label: t('지방'), val: range(targets.fat) },
  ];
  return (
    <ul className="m-0 grid flex-[1_1_560px] list-none grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2.5 p-0">
      {stats.map(({ icon: Icon, color, label, val }) => (
        <li key={label} className="min-w-0">
          <Card className="h-full py-3 ring-0 border border-border shadow-xs">
            <CardContent className="flex items-center gap-3 px-3">
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted" style={{ color }}>
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm leading-tight text-muted-foreground">{label}</span>
                <b className="text-lg leading-snug whitespace-nowrap text-card-foreground">{val}</b>
              </span>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
