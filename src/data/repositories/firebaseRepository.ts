import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../firebase';
import { runtimeConfig } from '../../config/runtime';
import type { Account, AdminSettings, Incident, ModuleStatus, MonitoringState, OccupantReference, Posture, SafeSeatState, SensorModule, Vehicle } from '../../types';

const defaultSettings: AdminSettings = {
  criticalNotifications: true,
  resolvedNotifications: false,
  healthWarnings: true,
  compactDensity: false
};

const safeString = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const safeBool = (v: unknown, fallback = false) => typeof v === 'boolean' ? v : fallback;
const firstBool = (primary: unknown, fallbackValue: unknown) => typeof primary === 'boolean' ? primary : safeBool(fallbackValue);
const iso = (v: unknown) => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate?: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

function mapAccount(id: string, raw: DocumentData, forcedRole?: Account['role']): Account {
  const consent = (raw.consent || raw.privacy || {}) as Record<string, unknown>;
  const roleRaw = safeString(raw.role, forcedRole || 'Occupant');
  const role: Account['role'] = forcedRole || (roleRaw === 'Fleet Admin' || roleRaw === 'Driver' ? roleRaw : 'Occupant');
  return {
    id,
    name: safeString(raw.name || raw.displayName, 'Registered user'),
    email: safeString(raw.email),
    operatorId: safeString(raw.operatorId, id.slice(0, 10).toUpperCase()),
    role,
    status: raw.status === 'DISABLED' || raw.enabled === false ? 'DISABLED' : 'ACTIVE',
    consent: {
      dataSharing: firstBool(consent.dataSharing, raw.dataSharingConsent),
      healthMonitoring: firstBool(consent.healthMonitoring, raw.healthMonitoringConsent),
      emergencyEscalation: firstBool(consent.emergencyEscalation, raw.emergencyEscalationConsent)
    },
    lastActive: iso(raw.lastActive || raw.updatedAt || raw.createdAt)
  };
}

function defaultModules(vehicleId: string): SensorModule[] {
  const at = new Date().toISOString();
  return [
    { id: `${vehicleId}-hub`, name: 'SafeSeat Main Hub', shortName: 'Main Hub', placement: 'Central controller', purpose: 'Sensor fusion, state management, and system coordination.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-c1001`, name: 'C1001 mmWave Radar', shortName: 'C1001', placement: 'Front-facing, approximately 0.8–1.0 m from occupant', purpose: 'Local presence and physiological-signal context. Exact readings are not exposed to administrators.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-mlx`, name: 'MLX90614 IR Temperature', shortName: 'MLX90614', placement: 'Headrest', purpose: 'Local non-contact thermal context. Exact values are not exposed to administrators.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-back-fsr`, name: 'Backrest FSR Array ×6', shortName: 'Backrest FSR', placement: 'Backrest overlay', purpose: 'Pressure-distribution and posture-context sensing.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-cush-fsr`, name: 'Cushion FSR Array ×3', shortName: 'Cushion FSR', placement: 'Seat cushion overlay', purpose: 'Seat occupancy and lower-body pressure context.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-mpu`, name: 'MPU6050 IMU', shortName: 'MPU6050', placement: 'Seat frame', purpose: 'Road vibration and deceleration context only.', status: 'offline', lastChecked: at, detail: 'Awaiting backend health status.' },
    { id: `${vehicleId}-cam`, name: 'ESP32-S3 Camera', shortName: 'Camera', placement: 'Front-facing cabin view', purpose: 'Event-based posture verification only.', status: 'standby', lastChecked: at, detail: 'Standby is expected until verification is requested.' }
  ];
}

function mapOccupant(raw: DocumentData): OccupantReference {
  const type = safeString(raw.occupantType).toLowerCase();
  if (type === 'registered' && safeString(raw.occupantUserId)) {
    return { kind: 'registered', accountId: safeString(raw.occupantUserId) };
  }
  if (type === 'guest') {
    return {
      kind: 'guest',
      sessionId: safeString(raw.guestSessionId || raw.sessionId || raw.id, 'GUEST'),
      displayName: safeString(raw.guestDisplayName || raw.occupantDisplayName, 'Guest')
    };
  }
  return null;
}

function asModuleStatus(value: unknown, fallback: ModuleStatus = 'offline'): ModuleStatus {
  return value === 'operational' || value === 'degraded' || value === 'offline' || value === 'standby' ? value : fallback;
}

function hardwareModules(vehicleId: string, raw: DocumentData): SensorModule[] {
  const checked = iso(raw.lastSeen || raw.updatedAt);
  const detail = (status: ModuleStatus) => status === 'operational'
    ? 'Operational status received through privacy-minimized SafeSeat health sync.'
    : status === 'standby'
      ? 'Standby is an expected state when this module is not currently required.'
      : status === 'degraded'
        ? 'The SafeSeat health layer reported a degraded module state.'
        : 'No current operational heartbeat is available for this module.';
  const build = (suffix: string, name: string, shortName: string, placement: string, purpose: string, value: unknown, fallback: ModuleStatus = 'offline'): SensorModule => {
    const status = asModuleStatus(value, fallback);
    return { id: `${vehicleId}-${suffix}`, name, shortName, placement, purpose, status, lastChecked: checked, detail: detail(status) };
  };
  return [
    build('hub', 'SafeSeat Main Hub', 'Main Hub', 'Central controller', 'Sensor fusion, state management, and system coordination.', raw.mainHub),
    build('c1001', 'C1001 mmWave Radar', 'C1001', 'Front-facing, approximately 0.8–1.0 m from occupant', 'Local presence and physiological-signal context. Exact readings are not exposed to administrators.', raw.c1001),
    build('mlx', 'MLX90614 IR Temperature', 'MLX90614', 'Headrest', 'Local non-contact thermal context. Exact values are not exposed to administrators.', raw.mlx90614),
    build('back-fsr', 'Backrest FSR Array ×6', 'Backrest FSR', 'Backrest overlay', 'Pressure-distribution and posture-context sensing.', raw.backrestFsr),
    build('cush-fsr', 'Cushion FSR Array ×3', 'Cushion FSR', 'Seat cushion overlay', 'Seat occupancy and lower-body pressure context.', raw.cushionFsr),
    build('mpu', 'MPU6050 IMU', 'MPU6050', 'Seat frame', 'Road vibration and deceleration context only.', raw.mpu6050),
    build('cam', 'ESP32-S3 Camera', 'Camera', 'Front-facing cabin view', 'Event-based posture verification only.', raw.camera, 'standby')
  ];
}

function mapIncident(id: string, raw: DocumentData): Incident {
  const timelineRaw = Array.isArray(raw.timeline) ? raw.timeline : [];
  const state = ['NORMAL','SUSPECTED','VERIFYING','EMERGENCY','CLEARED'].includes(raw.stateAtPeak) ? raw.stateAtPeak as MonitoringState : 'SUSPECTED';
  const postureValues: Posture[] = ['Not requested','Upright','Leaning Forward','Leaning Backward','Leaning Left','Leaning Right','Unknown'];
  return {
    id,
    occurredAt: iso(raw.occurredAt || raw.createdAt),
    vehicleId: safeString(raw.vehicleId),
    seat: safeString(raw.seat, 'Monitored seat'),
    occupant: mapOccupant(raw),
    category: safeString(raw.category, 'Safety event'),
    triggerSummary: safeString(raw.triggerSummary, 'Derived SafeSeat anomaly state received.'),
    posture: postureValues.includes(raw.posture as Posture) ? raw.posture as Posture : 'Not requested',
    stateAtPeak: state,
    status: raw.status === 'RESOLVED' || raw.status === 'CLEARED' ? raw.status : 'ESCALATED',
    resolution: safeString(raw.resolution),
    smsEscalated: safeBool(raw.smsEscalated),
    timeline: timelineRaw.map((item: Record<string, unknown>) => ({
      time: iso(item.time),
      title: safeString(item.title, 'Event'),
      description: safeString(item.description)
    }))
  };
}

type SessionShape = {
  id: string;
  vehicleId: string;
  seat: string;
  occupant: OccupantReference;
  state: MonitoringState;
  camera: Vehicle['camera'];
  lastUpdate: string;
};

type HardwareShape = { vehicleId: string; modules: SensorModule[]; connection: Vehicle['connection']; lastSeen: string };

type SnapshotState = {
  users: Account[];
  admins: Account[];
  vehicles: Array<{ id: string; data: DocumentData }>;
  sessions: SessionShape[];
  incidents: Incident[];
  hardware: HardwareShape[];
  settings: AdminSettings;
  lastDiagnosticAt: string | null;
};

export function subscribeSafeSeatState(adminUid: string, onState: (state: SafeSeatState) => void, onError: (error: Error) => void): Unsubscribe {
  const current: SnapshotState = { users: [], admins: [], vehicles: [], sessions: [], incidents: [], hardware: [], settings: defaultSettings, lastDiagnosticAt: null };

  const emit = () => {
    const accountsMap = new Map<string, Account>();
    [...current.users, ...current.admins].forEach(account => accountsMap.set(account.id, account));
    const vehicles: Vehicle[] = current.vehicles.map(({ id, data }) => {
      const session = current.sessions.find(s => s.vehicleId === id);
      const hardware = current.hardware.find(h => h.vehicleId === id);
      const state: MonitoringState = session?.state || (['NORMAL','SUSPECTED','VERIFYING','EMERGENCY','CLEARED'].includes(data.state) ? data.state : 'NORMAL');
      const camera: Vehicle['camera'] = session?.camera || (data.camera === 'Verifying' || data.camera === 'Unavailable' ? data.camera : 'Standby');
      return {
        id,
        plate: safeString(data.plate || data.plateNumber),
        label: safeString(data.label || data.displayName, id),
        driverId: safeString(data.driverId) || null,
        monitoredSeat: session?.seat || safeString(data.monitoredSeat, 'Front Passenger'),
        occupant: session?.occupant || null,
        hubId: safeString(data.hubId || data.mainHubId),
        connection: hardware?.connection || (data.connection === 'online' || data.online === true ? 'online' : 'offline'),
        state,
        camera,
        lastUpdate: session?.lastUpdate || iso(data.lastUpdate || data.updatedAt),
        modules: hardware?.modules || defaultModules(id)
      };
    });
    onState({ accounts: [...accountsMap.values()], vehicles, incidents: current.incidents, settings: current.settings, lastDiagnosticAt: current.lastDiagnosticAt });
  };

  const err = (e: unknown) => onError(e instanceof Error ? e : new Error(String(e)));
  const unsubs: Unsubscribe[] = [];

  unsubs.push(onSnapshot(collection(db, runtimeConfig.collections.accounts), snap => { current.users = snap.docs.map(d => mapAccount(d.id, d.data())); emit(); }, err));
  unsubs.push(onSnapshot(collection(db, runtimeConfig.collections.admins), snap => { current.admins = snap.docs.map(d => mapAccount(d.id, d.data(), 'Fleet Admin')); emit(); }, err));
  unsubs.push(onSnapshot(collection(db, runtimeConfig.collections.vehicles), snap => { current.vehicles = snap.docs.map(d => ({ id: d.id, data: d.data() })); emit(); }, err));
  unsubs.push(onSnapshot(query(collection(db, runtimeConfig.collections.sessions), where('active', '==', true)), snap => {
    current.sessions = snap.docs.map(d => {
      const raw = d.data();
      const state: MonitoringState = ['NORMAL','SUSPECTED','VERIFYING','EMERGENCY','CLEARED'].includes(raw.fusionState) ? raw.fusionState : 'NORMAL';
      const camera: Vehicle['camera'] = raw.cameraState === 'Verifying' || raw.cameraState === 'Unavailable' ? raw.cameraState : 'Standby';
      return { id: d.id, vehicleId: safeString(raw.vehicleId), seat: safeString(raw.seat, 'Front Passenger'), occupant: mapOccupant({ ...raw, sessionId: d.id }), state, camera, lastUpdate: iso(raw.lastUpdate || raw.updatedAt) };
    });
    emit();
  }, err));
  unsubs.push(onSnapshot(collection(db, runtimeConfig.collections.incidents), snap => { current.incidents = snap.docs.map(d => mapIncident(d.id, d.data())).sort((a,b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)); emit(); }, err));
  unsubs.push(onSnapshot(collection(db, runtimeConfig.collections.hardware), snap => {
    current.hardware = snap.docs.map(d => {
      const raw = d.data();
      const vehicleId = safeString(raw.vehicleId, d.id);
      const mainHub = asModuleStatus(raw.mainHub);
      return {
        vehicleId,
        modules: hardwareModules(vehicleId, raw),
        connection: mainHub === 'offline' ? 'offline' : 'online',
        lastSeen: iso(raw.lastSeen || raw.updatedAt)
      };
    });
    emit();
  }, err));
  unsubs.push(onSnapshot(doc(db, runtimeConfig.collections.settings, adminUid), snap => {
    const raw = snap.exists() ? snap.data() : {};
    current.settings = {
      criticalNotifications: typeof raw.criticalNotifications === 'boolean' ? raw.criticalNotifications : defaultSettings.criticalNotifications,
      resolvedNotifications: typeof raw.resolvedNotifications === 'boolean' ? raw.resolvedNotifications : defaultSettings.resolvedNotifications,
      healthWarnings: typeof raw.healthWarnings === 'boolean' ? raw.healthWarnings : defaultSettings.healthWarnings,
      compactDensity: typeof raw.compactDensity === 'boolean' ? raw.compactDensity : defaultSettings.compactDensity
    };
    emit();
  }, err));
  unsubs.push(onSnapshot(query(collection(db, runtimeConfig.collections.diagnostics), where('requestedBy', '==', adminUid)), snap => {
    const times = snap.docs.map(d => iso(d.data().requestedAt)).sort((a, b) => +new Date(b) - +new Date(a));
    current.lastDiagnosticAt = times[0] || null;
    emit();
  }, err));

  return () => unsubs.forEach(unsub => unsub());
}

export async function addAccount(account: Account) {
  await setDoc(doc(db, runtimeConfig.collections.accounts, account.id), {
    name: account.name,
    email: account.email,
    operatorId: account.operatorId,
    role: account.role,
    status: account.status,
    consent: account.consent,
    lastActive: serverTimestamp(),
    createdAt: serverTimestamp(),
    provisioningStatus: 'DIRECTORY_ONLY'
  }, { merge: true });
}

export async function toggleAccount(accountId: string, nextStatus: Account['status']) {
  await updateDoc(doc(db, runtimeConfig.collections.accounts, accountId), { status: nextStatus, updatedAt: serverTimestamp() });
}

export async function addVehicle(vehicle: Vehicle) {
  await setDoc(doc(db, runtimeConfig.collections.vehicles, vehicle.id), {
    plate: vehicle.plate,
    label: vehicle.label,
    driverId: vehicle.driverId,
    monitoredSeat: vehicle.monitoredSeat,
    hubId: vehicle.hubId,
    connection: 'offline',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function setIncidentStatus(id: string, status: Incident['status'], resolution?: string) {
  await updateDoc(doc(db, runtimeConfig.collections.incidents, id), {
    status,
    resolution: resolution || '',
    resolvedAt: status === 'RESOLVED' ? serverTimestamp() : null,
    updatedAt: serverTimestamp()
  });
}

export async function requestDiagnostic(vehicleId: string, requestedBy: string) {
  await addDoc(collection(db, runtimeConfig.collections.diagnostics), {
    vehicleId,
    requestedBy,
    status: 'PENDING',
    requestedAt: serverTimestamp(),
    privacyContract: 'DERIVED_HEALTH_ONLY'
  });
}

export async function updateSettings(adminUid: string, settings: Partial<AdminSettings>) {
  await setDoc(doc(db, runtimeConfig.collections.settings, adminUid), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}
