import type { SafeSeatState, SensorModule, Vehicle } from '../types';

const t = (iso: string) => iso;

const modulesFor = (vehicleId: string, degraded = false, offline = false): SensorModule[] => {
  const baseTime = t('2026-09-05T16:51:00+08:00');
  if (offline) {
    return [
      { id: `${vehicleId}-hub`, name: 'SafeSeat Main Hub', shortName: 'Main Hub', placement: 'Central controller', purpose: 'Sensor fusion, state management, and system coordination.', status: 'offline', lastChecked: baseTime, detail: 'No heartbeat from Main Hub.' },
      { id: `${vehicleId}-c1001`, name: 'C1001 mmWave Radar', shortName: 'C1001', placement: 'Front-facing, approximately 0.8–1.0 m from occupant', purpose: 'Presence, respiration rate, heart rate, and motion-related radar context.', status: 'offline', lastChecked: baseTime, detail: 'Unavailable while Main Hub is offline.' },
      { id: `${vehicleId}-mlx`, name: 'MLX90614 IR Temperature', shortName: 'MLX90614', placement: 'Headrest', purpose: 'Non-contact surface temperature input with ambient/delta runtime context.', status: 'offline', lastChecked: baseTime, detail: 'Unavailable while Main Hub is offline.' },
      { id: `${vehicleId}-back-fsr`, name: 'Backrest FSR Array ×6', shortName: 'Backrest FSR', placement: 'Backrest overlay', purpose: 'Pressure-distribution and posture-context sensing.', status: 'offline', lastChecked: baseTime, detail: 'Unavailable while Main Hub is offline.' },
      { id: `${vehicleId}-cush-fsr`, name: 'Cushion FSR Array ×3', shortName: 'Cushion FSR', placement: 'Seat cushion overlay', purpose: 'Seat occupancy and lower-body pressure-distribution context.', status: 'offline', lastChecked: baseTime, detail: 'Unavailable while Main Hub is offline.' },
      { id: `${vehicleId}-mpu`, name: 'MPU6050 IMU', shortName: 'MPU6050', placement: 'Seat frame', purpose: 'Road vibration and deceleration context; not a medical anomaly detector.', status: 'offline', lastChecked: baseTime, detail: 'Unavailable while Main Hub is offline.' },
      { id: `${vehicleId}-cam`, name: 'ESP32-S3 Camera', shortName: 'Camera', placement: 'Front-facing cabin view', purpose: 'Event-based posture verification only after sensor-fusion request.', status: 'offline', lastChecked: baseTime, detail: 'Camera cannot be requested while Main Hub is offline.' }
    ];
  }

  return [
    { id: `${vehicleId}-hub`, name: 'SafeSeat Main Hub', shortName: 'Main Hub', placement: 'Central controller', purpose: 'Sensor fusion, state management, and system coordination.', status: 'operational', lastChecked: baseTime, detail: 'Connected and publishing session telemetry.' },
    { id: `${vehicleId}-c1001`, name: 'C1001 mmWave Radar', shortName: 'C1001', placement: 'Front-facing, approximately 0.8–1.0 m from occupant', purpose: 'Presence, respiration rate, heart rate, and motion-related radar context.', status: degraded ? 'degraded' : 'operational', lastChecked: baseTime, detail: degraded ? 'Vitals available, but recent signal stability is below the preferred confidence band.' : 'Vitals and presence telemetry are available.' },
    { id: `${vehicleId}-mlx`, name: 'MLX90614 IR Temperature', shortName: 'MLX90614', placement: 'Headrest', purpose: 'Non-contact surface temperature input with ambient/delta runtime context.', status: 'operational', lastChecked: baseTime, detail: 'Object temperature input is stable.' },
    { id: `${vehicleId}-back-fsr`, name: 'Backrest FSR Array ×6', shortName: 'Backrest FSR', placement: 'Backrest overlay', purpose: 'Pressure-distribution and posture-context sensing.', status: 'operational', lastChecked: baseTime, detail: 'All six backrest channels are responding.' },
    { id: `${vehicleId}-cush-fsr`, name: 'Cushion FSR Array ×3', shortName: 'Cushion FSR', placement: 'Seat cushion overlay', purpose: 'Seat occupancy and lower-body pressure-distribution context.', status: 'operational', lastChecked: baseTime, detail: 'All three cushion channels are responding.' },
    { id: `${vehicleId}-mpu`, name: 'MPU6050 IMU', shortName: 'MPU6050', placement: 'Seat frame', purpose: 'Road vibration and deceleration context; not a medical anomaly detector.', status: 'operational', lastChecked: baseTime, detail: 'Orientation compensation applied; road-context stream is available.' },
    { id: `${vehicleId}-cam`, name: 'ESP32-S3 Camera', shortName: 'Camera', placement: 'Front-facing cabin view', purpose: 'Event-based posture verification only after sensor-fusion request.', status: 'standby', lastChecked: baseTime, detail: 'Standby is expected during normal monitoring. Camera is not continuously active.' }
  ];
};

const vehicles: Vehicle[] = [
  {
    id: 'SS-V01', plate: 'CAV 8151', label: 'Toyota Vios — Demo Unit', driverId: 'acc-driver-1', monitoredSeat: 'Front Passenger', occupant: { kind: 'registered', accountId: 'acc-occ-1' }, hubId: 'HUB-A7C2', connection: 'online', state: 'NORMAL', heartRate: 76, respirationRate: 17, objectTemperature: 35.8, camera: 'Standby', lastUpdate: t('2026-09-05T16:55:40+08:00'), modules: modulesFor('SS-V01')
  },
  {
    id: 'SS-V02', plate: 'NCR 4026', label: 'Fleet Unit 02', driverId: 'acc-driver-2', monitoredSeat: 'Rear Right', occupant: { kind: 'guest', sessionId: 'GST-260905-042', displayName: 'Guest passenger' }, hubId: 'HUB-C91F', connection: 'online', state: 'SUSPECTED', heartRate: 102, respirationRate: 23, objectTemperature: 36.1, camera: 'Standby', lastUpdate: t('2026-09-05T16:55:34+08:00'), modules: modulesFor('SS-V02', true)
  },
  {
    id: 'SS-V03', plate: 'BGC 1188', label: 'Fleet Unit 03', driverId: 'acc-driver-3', monitoredSeat: 'Front Passenger', occupant: { kind: 'registered', accountId: 'acc-occ-3' }, hubId: 'HUB-F2D4', connection: 'online', state: 'VERIFYING', heartRate: 91, respirationRate: 21, objectTemperature: 35.6, camera: 'Verifying', lastUpdate: t('2026-09-05T16:55:37+08:00'), modules: modulesFor('SS-V03').map(m => m.shortName === 'Camera' ? { ...m, status: 'operational', detail: 'Verification request active. Current camera output is posture evidence only.' } : m)
  },
  {
    id: 'SS-V04', plate: 'LPA 7782', label: 'Fleet Unit 04', driverId: null, monitoredSeat: 'Front Passenger', occupant: null, hubId: 'HUB-8B01', connection: 'offline', state: 'CLEARED', heartRate: null, respirationRate: null, objectTemperature: null, camera: 'Unavailable', lastUpdate: t('2026-09-05T15:42:11+08:00'), modules: modulesFor('SS-V04', false, true)
  }
];

export const seedState: SafeSeatState = {
  accounts: [
    { id: 'acc-admin-1', name: 'Mara Santos', email: 'mara.santos@safeseat.demo', operatorId: 'ADM-001', role: 'Fleet Admin', status: 'ACTIVE', consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:54:00+08:00') },
    { id: 'acc-driver-1', name: 'Daniel Cruz', email: 'daniel.cruz@example.com', operatorId: 'DRV-014', role: 'Driver', status: 'ACTIVE', consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:55:30+08:00') },
    { id: 'acc-driver-2', name: 'Alyssa Reyes', email: 'alyssa.reyes@example.com', operatorId: 'DRV-021', role: 'Driver', status: 'ACTIVE', consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:53:42+08:00') },
    { id: 'acc-driver-3', name: 'Marco Lim', email: 'marco.lim@example.com', operatorId: 'DRV-029', role: 'Driver', status: 'ACTIVE', consent: { dataSharing: false, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:55:11+08:00') },
    { id: 'acc-occ-1', name: 'Jamie Flores', email: 'jamie.flores@example.com', operatorId: 'OCC-108', role: 'Occupant', status: 'ACTIVE', consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:55:28+08:00') },
    { id: 'acc-occ-2', name: 'Rina Mendoza', email: 'rina.mendoza@example.com', operatorId: 'OCC-109', role: 'Occupant', status: 'ACTIVE', consent: { dataSharing: false, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:53:39+08:00') },
    { id: 'acc-occ-3', name: 'Paolo Garcia', email: 'paolo.garcia@example.com', operatorId: 'OCC-110', role: 'Occupant', status: 'ACTIVE', consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true }, lastActive: t('2026-09-05T16:55:08+08:00') },
    { id: 'acc-occ-4', name: 'Lea Ramos', email: 'lea.ramos@example.com', operatorId: 'OCC-111', role: 'Occupant', status: 'DISABLED', consent: { dataSharing: false, healthMonitoring: false, emergencyEscalation: false }, lastActive: t('2026-08-29T09:14:00+08:00') }
  ],
  vehicles,
  incidents: [
    {
      id: 'INC-260905-017', occurredAt: t('2026-09-05T16:44:18+08:00'), vehicleId: 'SS-V03', seat: 'Front Passenger', occupant: { kind: 'registered', accountId: 'acc-occ-3' }, category: 'Multi-sensor anomaly', triggerSummary: 'Sustained pressure deviation with abnormal vital-sign evidence prompted camera posture verification.', posture: 'Leaning Forward', stateAtPeak: 'EMERGENCY', status: 'ESCALATED', resolution: 'Awaiting administrator review.', smsEscalated: true,
      timeline: [
        { time: t('2026-09-05T16:43:44+08:00'), title: 'Anomaly evidence accumulated', description: 'Pressure and physiological evidence crossed the runtime suspicion threshold.' },
        { time: t('2026-09-05T16:43:51+08:00'), title: 'Suspected Emergency', description: 'Fusion logic requested additional verification; no emergency decision was made by the camera.' },
        { time: t('2026-09-05T16:43:56+08:00'), title: 'Camera verification requested', description: 'ESP32-S3 camera activated for event-based posture verification.' },
        { time: t('2026-09-05T16:44:03+08:00'), title: 'Posture deviation observed', description: 'Camera returned Leaning Forward. This was treated as supporting posture evidence only.' },
        { time: t('2026-09-05T16:44:18+08:00'), title: 'Emergency confirmed by fusion logic', description: 'Abnormal sensor evidence persisted through verification; system entered Emergency state.' },
        { time: t('2026-09-05T16:44:43+08:00'), title: 'Emergency SMS escalated', description: 'Configured emergency SMS workflow was dispatched after the escalation window.' }
      ]
    },
    {
      id: 'INC-260905-016', occurredAt: t('2026-09-05T15:18:02+08:00'), vehicleId: 'SS-V01', seat: 'Front Passenger', occupant: { kind: 'registered', accountId: 'acc-occ-1' }, category: 'Transient physiological anomaly', triggerSummary: 'Short-lived vital-sign anomaly entered suspicion but normalized before escalation.', posture: 'Upright', stateAtPeak: 'VERIFYING', status: 'CLEARED', resolution: 'Cleared automatically after readings normalized and verification accepted upright posture.', smsEscalated: false,
      timeline: [
        { time: t('2026-09-05T15:17:41+08:00'), title: 'Suspected Emergency', description: 'Physiological anomaly persisted long enough to request verification.' },
        { time: t('2026-09-05T15:17:48+08:00'), title: 'Camera verification requested', description: 'Camera activated only for the verification window.' },
        { time: t('2026-09-05T15:17:55+08:00'), title: 'Upright posture accepted', description: 'Current raw pose was normal and temporal acceptance passed.' },
        { time: t('2026-09-05T15:18:02+08:00'), title: 'Event cleared', description: 'Primary sensor evidence returned to normal; monitoring resumed.' }
      ]
    },
    {
      id: 'INC-260904-012', occurredAt: t('2026-09-04T18:07:39+08:00'), vehicleId: 'SS-V02', seat: 'Rear Right', occupant: { kind: 'guest', sessionId: 'GST-260904-018', displayName: 'Guest passenger' }, category: 'Pressure-posture anomaly', triggerSummary: 'Sustained asymmetric pressure pattern prompted re-evaluation.', posture: 'Leaning Right', stateAtPeak: 'VERIFYING', status: 'RESOLVED', resolution: 'Reviewed and marked resolved; occupant reported deliberate repositioning.', smsEscalated: false,
      timeline: [
        { time: t('2026-09-04T18:07:13+08:00'), title: 'Pressure anomaly detected', description: 'Backrest and cushion pressure distribution moved outside the current baseline.' },
        { time: t('2026-09-04T18:07:21+08:00'), title: 'Verification requested', description: 'Camera activated because the multi-sensor state required posture context.' },
        { time: t('2026-09-04T18:07:28+08:00'), title: 'Leaning Right observed', description: 'Posture deviation was recorded as supporting context.' },
        { time: t('2026-09-04T18:07:39+08:00'), title: 'Readings normalized', description: 'Sensor evidence returned to baseline; no emergency escalation occurred.' }
      ]
    },
    {
      id: 'INC-260903-009', occurredAt: t('2026-09-03T11:36:10+08:00'), vehicleId: 'SS-V01', seat: 'Front Passenger', occupant: { kind: 'registered', accountId: 'acc-occ-1' }, category: 'Thermal context anomaly', triggerSummary: 'Object-temperature delta became unstable while pressure context remained normal.', posture: 'Not requested', stateAtPeak: 'SUSPECTED', status: 'RESOLVED', resolution: 'Thermal reading rejected as unstable targeting context; no camera activation was required.', smsEscalated: false,
      timeline: [
        { time: t('2026-09-03T11:35:54+08:00'), title: 'Thermal context flagged', description: 'MLX object-minus-ambient delta changed abruptly.' },
        { time: t('2026-09-03T11:36:02+08:00'), title: 'Fusion confidence reduced', description: 'Pressure/posture context did not support a physiological event, so MLX evidence was down-weighted.' },
        { time: t('2026-09-03T11:36:10+08:00'), title: 'Event resolved', description: 'Stable object-temperature readings returned without escalation.' }
      ]
    }
  ],
  settings: {
    criticalNotifications: true,
    resolvedNotifications: false,
    healthWarnings: true,
    compactDensity: false,
    showVitalsInTables: true
  },
  lastDiagnosticAt: t('2026-09-05T16:51:00+08:00')
};
