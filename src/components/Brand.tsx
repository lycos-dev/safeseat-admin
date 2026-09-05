import { ShieldCheck } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__mark" aria-hidden="true"><ShieldCheck size={22} strokeWidth={2.2} /></div>
      {!compact && (
        <div>
          <div className="brand__name">SafeSeat</div>
          <div className="brand__sub">Safety Control Center</div>
        </div>
      )}
    </div>
  );
}
