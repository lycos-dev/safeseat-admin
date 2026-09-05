import { UserRound, UsersRound } from 'lucide-react';
import { useStore } from '../data/store';
import type { OccupantReference } from '../types';
import { occupantDisplayName, occupantSecondaryText } from '../utils/occupant';

export function OccupantLabel({ occupant, compact = false }: { occupant: OccupantReference; compact?: boolean }) {
  const { accountById } = useStore();
  if (!occupant) return <span className="muted">No occupant</span>;

  const isGuest = occupant.kind === 'guest';
  return (
    <div className={`occupant-label ${compact ? 'occupant-label--compact' : ''}`}>
      <span className={`occupant-label__icon ${isGuest ? 'occupant-label__icon--guest' : ''}`}>
        {isGuest ? <UsersRound size={14} /> : <UserRound size={14} />}
      </span>
      <span className="occupant-label__copy">
        <strong>{occupantDisplayName(occupant, accountById)}</strong>
        {!compact && <small>{occupantSecondaryText(occupant, accountById)}</small>}
      </span>
      {isGuest && <span className="guest-badge">Guest</span>}
    </div>
  );
}
