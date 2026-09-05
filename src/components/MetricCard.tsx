import type { LucideIcon } from 'lucide-react';

export function MetricCard({ icon: Icon, label, value, detail, tone = 'green' }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone?: 'green' | 'gold' | 'red' | 'slate';
}) {
  return (
    <article className="metric-card">
      <div className={`metric-card__icon metric-card__icon--${tone}`}><Icon size={20} /></div>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__detail">{detail}</div>
    </article>
  );
}
