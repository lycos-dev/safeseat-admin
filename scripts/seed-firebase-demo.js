import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeAdminSdk, readArg } from './firebase-admin-common.js';

const ids = {
  driver: 'TEST-DRIVER-001',
  occupant: 'TEST-OCCUPANT-001',
  vehicle: 'SS-TEST-01',
  session: 'TEST-SESSION-001',
  incidentEscalated: 'TEST-INCIDENT-001',
  incidentResolved: 'TEST-INCIDENT-002'
};

const at = iso => Timestamp.fromDate(new Date(iso));

async function resolveAdminUid(db) {
  const requestedEmail = (readArg('admin-email') || process.env.SAFESEAT_ADMIN_EMAIL || '').trim().toLowerCase();
  if (requestedEmail) {
    const user = await getAuth().getUserByEmail(requestedEmail);
    const admin = await db.collection('admin_accounts').doc(user.uid).get();
    if (!admin.exists || admin.data()?.enabled === false || admin.data()?.status === 'DISABLED') {
      throw new Error(`The account ${requestedEmail} is not an active SafeSeat admin.`);
    }
    return user.uid;
  }

  const snapshot = await db.collection('admin_accounts').where('enabled', '==', true).limit(5).get();
  const active = snapshot.docs.find(doc => doc.data().status !== 'DISABLED');
  if (!active) {
    throw new Error('No active admin account found. Run npm run setup-admin first, or pass --admin-email.');
  }
  return active.id;
}

async function main() {
  const { db } = initializeAdminSdk();
  const adminUid = await resolveAdminUid(db);
  const batch = db.batch();

  batch.set(db.collection('account_directory').doc(ids.driver), {
    name: 'SafeSeat Test Driver',
    email: 'test.driver@safeseat.local',
    operatorId: 'DRV-TEST-01',
    role: 'Driver',
    status: 'ACTIVE',
    consent: { dataSharing: false, healthMonitoring: false, emergencyEscalation: false },
    lastActive: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    provisioningStatus: 'DIRECTORY_ONLY'
  }, { merge: true });

  batch.set(db.collection('account_directory').doc(ids.occupant), {
    name: 'SafeSeat Test Occupant',
    email: 'test.occupant@safeseat.local',
    operatorId: 'OCC-TEST-01',
    role: 'Occupant',
    status: 'ACTIVE',
    consent: { dataSharing: true, healthMonitoring: true, emergencyEscalation: true },
    lastActive: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    provisioningStatus: 'TEST_DIRECTORY_RECORD'
  }, { merge: true });

  batch.set(db.collection('vehicles').doc(ids.vehicle), {
    plate: 'TEST 0001',
    label: 'SafeSeat Firebase Test Vehicle',
    driverId: ids.driver,
    monitoredSeat: 'Front Passenger',
    hubId: 'HUB-TEST-01',
    connection: 'online',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(db.collection('monitoring_sessions').doc(ids.session), {
    ownerUid: adminUid,
    vehicleId: ids.vehicle,
    seat: 'Front Passenger',
    occupantType: 'registered',
    occupantUserId: ids.occupant,
    fusionState: 'NORMAL',
    cameraState: 'Standby',
    active: true,
    lastUpdate: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(db.collection('hardware_status').doc(ids.vehicle), {
    ownerUid: adminUid,
    vehicleId: ids.vehicle,
    overallStatus: 'operational',
    mainHub: 'operational',
    c1001: 'operational',
    mlx90614: 'operational',
    backrestFsr: 'operational',
    cushionFsr: 'operational',
    mpu6050: 'operational',
    camera: 'standby',
    lastSeen: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(db.collection('incidents').doc(ids.incidentEscalated), {
    ownerUid: adminUid,
    vehicleId: ids.vehicle,
    seat: 'Front Passenger',
    occupantType: 'registered',
    occupantUserId: ids.occupant,
    category: 'Firebase integration test',
    triggerSummary: 'Synthetic privacy-minimized event used to verify the Admin Firebase workflow.',
    posture: 'Leaning Forward',
    stateAtPeak: 'EMERGENCY',
    status: 'ESCALATED',
    resolution: 'Awaiting test review.',
    smsEscalated: false,
    timeline: [
      { time: at('2026-09-28T10:00:00+08:00'), title: 'Synthetic anomaly state', description: 'Test-only derived state inserted by the Admin Firebase seeder.' },
      { time: at('2026-09-28T10:00:05+08:00'), title: 'Verification test', description: 'Synthetic posture evidence added without camera media or raw physiological readings.' }
    ],
    occurredAt: at('2026-09-28T10:00:05+08:00'),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(db.collection('incidents').doc(ids.incidentResolved), {
    ownerUid: adminUid,
    vehicleId: ids.vehicle,
    seat: 'Front Passenger',
    occupantType: 'guest',
    guestSessionId: 'GST-TEST-001',
    guestDisplayName: 'Test Guest',
    category: 'Resolved integration test',
    triggerSummary: 'Synthetic resolved event for Firebase UI validation.',
    posture: 'Upright',
    stateAtPeak: 'SUSPECTED',
    status: 'RESOLVED',
    resolution: 'Resolved test record.',
    smsEscalated: false,
    timeline: [
      { time: at('2026-09-28T09:30:00+08:00'), title: 'Synthetic event', description: 'Test-only event.' },
      { time: at('2026-09-28T09:31:00+08:00'), title: 'Resolved', description: 'Marked resolved for Admin UI testing.' }
    ],
    occurredAt: at('2026-09-28T09:30:00+08:00'),
    resolvedAt: at('2026-09-28T09:31:00+08:00'),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.set(db.collection('admin_settings').doc(adminUid), {
    criticalNotifications: true,
    resolvedNotifications: false,
    healthWarnings: true,
    compactDensity: false,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();
  console.log('Firebase Admin test dataset created/updated successfully.');
  console.log(`  Admin UID: ${adminUid}`);
  console.log(`  Vehicle:   ${ids.vehicle}`);
  console.log(`  Session:   ${ids.session}`);
  console.log(`  Incidents: ${ids.incidentEscalated}, ${ids.incidentResolved}`);
  console.log('Run npm run clear-firebase-demo when you no longer need the synthetic records.');
}

main().catch(error => {
  console.error('Firebase demo seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
