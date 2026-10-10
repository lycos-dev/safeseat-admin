import { ShieldCheck } from 'lucide-react';

export function Brand({ compact = false, wordmark = false }: { compact?: boolean; wordmark?: boolean }) {
  if (wordmark) {
    return (
      <div className="brand brand--wordmark" aria-label="SafeSeat">
        <span className="brand__wordmark">Safe<span>Seat</span></span>
      </div>
    );
  }

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
