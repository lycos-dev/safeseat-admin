import type { Account, OccupantReference } from '../types';

type AccountLookup = (id: string | null) => Account | undefined;

export function occupantDisplayName(occupant: OccupantReference, accountById: AccountLookup) {
  if (!occupant) return 'No occupant';
  if (occupant.kind === 'guest') return occupant.displayName?.trim() || 'Guest occupant';
  if (occupant.kind === 'profile') return occupant.displayName?.trim() || 'Saved profile';
  return accountById(occupant.accountId)?.name ?? 'Registered occupant';
}

export function occupantSecondaryText(occupant: OccupantReference, accountById: AccountLookup) {
  if (!occupant) return 'Seat currently unoccupied';
  if (occupant.kind === 'guest') return `Guest • ${occupant.sessionId}`;
  if (occupant.kind === 'profile') return `Saved profile • ${occupant.profileId}`;
  const account = accountById(occupant.accountId);
  return account ? `Registered • ${account.operatorId}` : 'Registered account';
}

export function occupantSearchText(occupant: OccupantReference, accountById: AccountLookup) {
  if (!occupant) return '';
  if (occupant.kind === 'guest') return `${occupant.displayName ?? 'Guest occupant'} ${occupant.sessionId}`;
  if (occupant.kind === 'profile') return `${occupant.displayName} ${occupant.profileId} saved profile`;
  const account = accountById(occupant.accountId);
  return `${account?.name ?? ''} ${account?.operatorId ?? ''} registered occupant`;
}

export function isOccupied(occupant: OccupantReference) {
  return occupant !== null;
}
