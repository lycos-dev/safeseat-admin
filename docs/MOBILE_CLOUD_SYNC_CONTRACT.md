# SafeSeat Mobile → Firestore Admin Sync Contract

SafeSeat Admin V1.5 and the paired mobile build now implement this contract. The Main Hub remains the local source of truth; the mobile cloud-sync layer mirrors only **already-derived** SafeSeat status to Firestore.

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
  occupantType: 'registered' | 'profile' | 'guest';
  occupantUserId?: string;
  profileOwnerUid?: string;
  profileId?: string;
  profileDisplayName?: string;
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


## Implemented lifecycle

- Signing into the mobile app refreshes `account_directory/{uid}` with privacy-minimized driver information and consent flags.
- Starting monitoring creates/refreshes the configured vehicle, hardware-health record, and one active session.
- Main Hub state and module health are heartbeat-synchronized while monitoring is active.
- A real Main Hub `EMERGENCY` creates one retained incident for that cloud session. Local researcher/UAT simulation does not create cloud incidents.
- Successful real SMS escalation updates the matching incident's `smsEscalated` flag.
- Ending monitoring sets the cloud session inactive / cleared while keeping the incident history.

Saved dependent profiles use `occupantType: profile`; they are not presented as independent Firebase accounts.
