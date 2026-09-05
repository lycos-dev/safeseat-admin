import type { AccountStatus, IncidentStatus, ModuleStatus, MonitoringState } from '../types';

type Status = MonitoringState | IncidentStatus | ModuleStatus | AccountStatus | 'online' | 'offline';

const labels: Record<string, string> = {
  NORMAL: 'Normal',
  SUSPECTED: 'Suspected',
  VERIFYING: 'Verifying',
  EMERGENCY: 'Emergency',
  CLEARED: 'Cleared',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  operational: 'Operational',
  degraded: 'Degraded',
  offline: 'Offline',
  standby: 'Standby',
  online: 'Online',
  ACTIVE: 'Active',
  DISABLED: 'Disabled'
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-badge--${String(status).toLowerCase()}`}>{labels[status] ?? status}</span>;
}
