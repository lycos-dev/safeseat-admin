# SafeSeat Safety Control Center — Admin Web App V1.3

Privacy-minimized SafeSeat Admin Module with two runtime data providers:

- **Demo mode** — deterministic local records for manuscript screenshots and UI review.
- **Firebase mode** — Firebase Authentication + Firestore using the same SafeSeat project as the mobile app.

## V1.3 backend integration

- Added Firebase Authentication for production-mode admin sign-in.
- Added authorization through `admin_accounts/{uid}`; being a normal SafeSeat user is not enough to enter the Admin Module.
- Added realtime Firestore subscriptions for account directory, vehicles, active monitoring sessions, incidents, hardware status, and per-admin settings.
- Added Firebase writes for vehicle registration, account-directory status management, incident resolution, dashboard preferences, and privacy-limited diagnostic requests.
- Kept demo mode fully isolated for deterministic paper screenshots.
- Added Firestore rules/indexes and Firebase Hosting configuration.
- Added a documented Main Hub/mobile/cloud boundary so the Admin site does not become a second safety controller.
- Preserved Guest occupants as session-only identities.
- Preserved the fixed privacy contract: exact HR, RR, temperature, FSR, MPU, and camera-frame data are not part of the Admin schema.

## Important account privacy design

The Admin Module uses a separate `account_directory` collection instead of querying private mobile profile documents directly. Firestore queries return whole documents, so using a minimized directory avoids downloading unrelated profile fields just to display an account name/role/consent state.

## Runtime architecture

```text
Sensor nodes / Camera
        │ ESP-NOW
        ▼
SafeSeat Main Hub
(authoritative local fusion)
        │ local SafeSeat API
        ▼
SafeSeat mobile app
        │ privacy-minimized cloud sync
        ▼
Firebase Auth + Firestore
        │
        ▼
SafeSeat Admin Web App
```

The Admin Web App is not connected directly to each vehicle's ESP32 and does not make emergency decisions.

## Run in demo mode

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Keep:

```env
VITE_DATA_MODE=demo
```

Default demo credentials are defined in `.env.example` and are not used in Firebase mode.

## Run with Firebase

1. Copy the matching Firebase Web configuration from the existing `safeseat-app` environment into `.env`.
2. Set:

```env
VITE_DATA_MODE=firebase
```

3. Create an authorized Firebase Auth user and matching `admin_accounts/<UID>` document.
4. Start the app:

```powershell
npm install
npm run dev
```

See `docs/FIREBASE_SETUP.md` for the exact setup sequence.

## Firebase files

```text
firebase.json
firestore.rules
firestore.indexes.json
docs/FIREBASE_SETUP.md
docs/SAFESEAT_CLOUD_CONTRACT.md
docs/MOBILE_CLOUD_SYNC_CONTRACT.md
```

If your existing SafeSeat Firebase project already has Firestore rules, **merge** the Admin collection rules into the project's rule file instead of replacing existing mobile-app rules.

## Build checks

```powershell
npm run typecheck
npm run build
```

## Current hardware represented

- SafeSeat Main Hub
- C1001 mmWave radar — front-facing, approximately 0.8–1.0 m from the monitored occupant
- MLX90614 — headrest
- Backrest FSR array ×6
- Cushion FSR array ×3
- MPU6050 — seat-frame road/vibration context
- ESP32-S3 camera — event-based posture verification only

## Privacy contract

The Admin Module does not display or persist exact physiological readings, raw sensor arrays, or camera media. Admin-facing records contain only operational/derived states necessary for fleet management and incident handling.
