# SafeSeat Mobile → Firestore Admin Sync Contract

The Admin web app is now ready to consume Firebase data, but the Main Hub should remain the local source of truth. The next integration step in `safeseat-app` is a small cloud-sync layer that takes the **already-derived** SafeSeat status received from the Main Hub local API and mirrors only approved fields to Firestore.

## Never upload to Admin collections

Do not copy payloads from `/api/v1/sensors` wholesale. Do not upload exact HR/RR/temperature/FSR/MPU values or any camera frame.

## Active session write

Target:

```text
monitoring_sessions/<sessionId>
```

Approved shape:

```ts
{
  ownerUid: string;
  vehicleId: string;
  seat: string;
  occupantType: 'registered' | 'guest';
  occupantUserId?: string;
  guestSessionId?: string;
  guestDisplayName?: string;
  fusionState: 'NORMAL' | 'SUSPECTED' | 'VERIFYING' | 'EMERGENCY' | 'CLEARED';
  cameraState: 'Standby' | 'Verifying' | 'Unavailable';
  active: boolean;
  lastUpdate: serverTimestamp();
}
```

## Incident write

Create/update an incident only when the SafeSeat runtime emits a safety event worth retaining administratively. Use descriptive, non-diagnostic summaries.

Example trigger summary:

```text
Multi-sensor anomaly evidence persisted and camera verification was requested.
```

Do not include exact physiological values in incident summaries; use derived-state wording instead.

## Hardware health write

Target:

```text
hardware_status/<vehicleId>
```

Only fixed module-level states are needed. Write the privacy-minimized `hardware_status/<vehicleId>` fields `mainHub`, `c1001`, `mlx90614`, `backrestFsr`, `cushionFsr`, `mpu6050`, and `camera`, each using:

```text
operational | degraded | offline | standby
```

Do not upload a free-form sensor payload or raw diagnostic detail. The Admin UI generates generic human-readable status descriptions locally.

## Guest sessions

Guests remain session-scoped. Do not create a Firebase Auth user or `account_directory` record for a guest simply to display the active occupant in Admin.

## Offline behavior

Core SafeSeat monitoring and emergency logic must continue locally even when internet/Firebase is unavailable. Cloud sync is supplementary administrative visibility and history, not part of the safety decision loop.
