# SafeSeat Admin Cloud Contract

## Architecture

SafeSeat uses a hybrid local/cloud architecture:

1. Sensor nodes communicate with the SafeSeat Main Hub over ESP-NOW.
2. The Main Hub is the authoritative local controller for sensor fusion and camera-verification state.
3. The mobile app can receive authoritative local status from the Main Hub over the SafeSeat local HTTP API / Wi-Fi link.
4. Firebase Authentication + Firestore remain the shared cloud services for account, vehicle, trip/session, incident, and administrative records.
5. `safeseat-admin` reads only privacy-minimized cloud records from the same Firebase project.

The Admin web app does **not** connect directly to every vehicle's Main Hub and does not create a second backend.

## Privacy boundary

Admin-facing Firestore documents must contain derived operational state only. They must not contain exact or raw:

- heart-rate values;
- respiration-rate values;
- MLX90614 temperature values;
- FSR pressure values;
- MPU6050 samples;
- raw sensor arrays;
- camera frames, images, or video.

Allowed examples include:

- `fusionState: "NORMAL" | "SUSPECTED" | "VERIFYING" | "EMERGENCY" | "CLEARED"`
- `cameraState: "Standby" | "Verifying" | "Unavailable"`
- `posture: "Upright" | "Leaning Forward" | ... | "Unknown"`
- hardware module status: `operational | degraded | offline | standby`
- incident category, timestamps, resolution, and SMS escalation state
- registered-vs-guest occupant identity type

## Collections

### `admin_accounts/{uid}`
Minimal authorization record for a Firebase Auth user allowed to access the Admin Module.

Suggested fields:

```json
{
  "name": "Fleet Administrator",
  "email": "admin@example.com",
  "role": "Fleet Admin",
  "status": "ACTIVE",
  "enabled": true
}
```

### `account_directory/{uid}`
A privacy-minimized administrative directory. This is deliberately separate from private mobile profile documents because Firestore queries download whole documents; the Admin app should not fetch private profile fields just to show a name and role.

Suggested fields:

```json
{
  "name": "Registered User",
  "email": "user@example.com",
  "operatorId": "DRV-001",
  "role": "Driver",
  "status": "ACTIVE",
  "consent": {
    "dataSharing": true,
    "healthMonitoring": true,
    "emergencyEscalation": true
  },
  "lastActive": "server timestamp"
}
```

### `vehicles/{vehicleId}`

```json
{
  "ownerUid": "signed-in-driver-uid",
  "plate": "ABC 1234",
  "label": "Fleet Unit 01",
  "driverId": "firebase-uid-or-null",
  "monitoredSeat": "Front Passenger",
  "hubId": "HUB-001",
  "connection": "online",
  "updatedAt": "server timestamp"
}
```

### `monitoring_sessions/{sessionId}`
Active session record synchronized by the trusted SafeSeat app/backend path.

Registered occupant:

```json
{
  "ownerUid": "signed-in-user-uid",
  "vehicleId": "SS-V01",
  "seat": "Front Passenger",
  "occupantType": "registered",
  "occupantUserId": "uid",
  "fusionState": "NORMAL",
  "cameraState": "Standby",
  "active": true,
  "lastUpdate": "server timestamp"
}
```

Saved dependent/person profile:

```json
{
  "ownerUid": "signed-in-user-uid",
  "vehicleId": "SS-V01",
  "seat": "Front Passenger",
  "occupantType": "profile",
  "profileOwnerUid": "signed-in-user-uid",
  "profileId": "profile-doc-id",
  "profileDisplayName": "Passenger Name",
  "fusionState": "NORMAL",
  "cameraState": "Standby",
  "active": true,
  "lastUpdate": "server timestamp"
}
```

Guest occupant:

```json
{
  "ownerUid": "signed-in-user-uid",
  "vehicleId": "SS-V01",
  "seat": "Front Passenger",
  "occupantType": "guest",
  "guestSessionId": "GST-20260905-001",
  "guestDisplayName": "Guest",
  "fusionState": "NORMAL",
  "cameraState": "Standby",
  "active": true,
  "lastUpdate": "server timestamp"
}
```

A saved profile is not falsely treated as a separate Firebase login account, and a guest does not require an `account_directory` or Firebase Auth record.

### `incidents/{incidentId}`
Privacy-minimized incident metadata and derived verification outcome.

### `hardware_status/{vehicleId}`
Derived health state only. The cloud record stores fixed module-state fields rather than raw readings or arbitrary telemetry payloads.

```json
{
  "ownerUid": "signed-in-user-uid",
  "vehicleId": "SS-V01",
  "overallStatus": "operational",
  "mainHub": "operational",
  "c1001": "operational",
  "mlx90614": "operational",
  "backrestFsr": "operational",
  "cushionFsr": "operational",
  "mpu6050": "operational",
  "camera": "standby",
  "lastSeen": "server timestamp"
}
```

Allowed module states are `operational`, `degraded`, `offline`, and `standby`. The Admin UI generates human-readable module descriptions locally so backend status records do not need to carry arbitrary sensor text.

### `diagnostic_requests/{requestId}`
Admin request for a trusted backend/mobile bridge to perform a health check. The Admin browser does not fabricate a successful diagnostic in Firebase mode.

### `admin_settings/{uid}`
Dashboard presentation preferences for the authenticated administrator.

## Main Hub local API boundary

The current Main Hub exposes local read-only routes such as `/api/v1/status`, `/api/v1/sensors`, `/api/v1/camera`, `/api/v1/network`, and `/health`. Those routes are for the local SafeSeat app/hardware integration. The Admin cloud interface should not proxy or persist raw `/api/v1/sensors` values. Only the derived, privacy-approved fields described above should be synchronized to Firestore.
