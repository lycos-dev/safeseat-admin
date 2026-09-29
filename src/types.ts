export type MonitoringState = 'NORMAL' | 'SUSPECTED' | 'VERIFYING' | 'EMERGENCY' | 'CLEARED';
export type ConnectionStatus = 'online' | 'offline';
export type ModuleStatus = 'operational' | 'degraded' | 'offline' | 'standby';
export type IncidentStatus = 'ESCALATED' | 'RESOLVED' | 'CLEARED';
export type AccountStatus = 'ACTIVE' | 'DISABLED';
export type AccountRole = 'Fleet Admin' | 'Driver' | 'Occupant';
export type Posture = 'Not requested' | 'Upright' | 'Leaning Forward' | 'Leaning Backward' | 'Leaning Left' | 'Leaning Right' | 'Unknown';

export type OccupantReference =
  | { kind: 'registered'; accountId: string }
  | { kind: 'profile'; ownerUid: string; profileId: string; displayName: string }
  | { kind: 'guest'; sessionId: string; displayName?: string }
  | null;

export interface ConsentProfile {
  dataSharing: boolean;
  healthMonitoring: boolean;
  emergencyEscalation: boolean;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  operatorId: string;
  role: AccountRole;
  status: AccountStatus;
  consent: ConsentProfile;
  lastActive: string;
}

export interface SensorModule {
  id: string;
  name: string;
  shortName: string;
  placement: string;
  purpose: string;
  status: ModuleStatus;
  lastChecked: string;
  detail: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  label: string;
  driverId: string | null;
  monitoredSeat: string;
  occupant: OccupantReference;
  hubId: string;
  connection: ConnectionStatus;
  state: MonitoringState;
  camera: 'Standby' | 'Verifying' | 'Unavailable';
  lastUpdate: string;
  modules: SensorModule[];
}

export interface IncidentEvent {
  time: string;
  title: string;
  description: string;
}

export interface Incident {
  id: string;
  occurredAt: string;
  vehicleId: string;
  seat: string;
  occupant: OccupantReference;
  category: string;
  triggerSummary: string;
  posture: Posture;
  stateAtPeak: MonitoringState;
  status: IncidentStatus;
  resolution: string;
  smsEscalated: boolean;
  timeline: IncidentEvent[];
}

export interface AdminSettings {
  criticalNotifications: boolean;
  resolvedNotifications: boolean;
  healthWarnings: boolean;
  compactDensity: boolean;
}

export interface SafeSeatState {
  accounts: Account[];
  vehicles: Vehicle[];
  incidents: Incident[];
  settings: AdminSettings;
  lastDiagnosticAt: string | null;
}
