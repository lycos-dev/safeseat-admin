# SafeSeat Safety Control Center — Admin Web App V1.5

Privacy-minimized SafeSeat Admin Module with two runtime providers:

- **Firebase mode** — Firebase Authentication + Firestore using the same `safeseat-app` Firebase project.
- **Demo mode** — deterministic local records for screenshots/UI review.

The included `.env.example` is configured for the shared SafeSeat Firebase Web project and defaults to `firebase` mode; copy/merge it into your local `.env`. No administrator password or Firebase service-account private key is included in this ZIP.

## V1.5 changes

- Firebase mode prepared as the default runtime for the Admin Web App.
- Removed hard-coded Firebase admin credentials from the provisioning script.
- Added secure CLI-based admin provisioning with Firebase Admin SDK.
- Retained the optional Firebase synthetic-data seeder for isolated Admin UI testing.
- Added a matching cleanup command for synthetic Firebase records.
- Preserved `admin_accounts/{uid}` as the protected authorization gate in addition to Firebase Authentication.
- Added the paired Mobile App → Firestore → Admin flow for account directory, vehicle identity, live sessions, hardware health, incidents, and diagnostic responses.
- Added saved-profile occupant support without treating saved profiles as Firebase login accounts.
- Added stale-heartbeat handling so disconnected mobile/hardware bridges become offline in Admin instead of remaining falsely live.
- Preserved realtime Firestore subscriptions and privacy-minimized writes for vehicles, incidents, settings, account-directory records, and diagnostic requests.
- Fixed Settings switch geometry so the white knob stays centered inside the track in both states.
- Normalized primary green button states.

## Important architecture boundary

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

The paired mobile build now performs this privacy-minimized cloud sync. Synthetic Firebase records are optional and should be cleared before real integration testing.

## First-time Firebase setup

### 1. Install

```powershell
npm install
```

### 2. Download a Firebase service account

Firebase Console → Project Settings → Service Accounts → **Generate new private key**.

Save it in the project root as:

```text
service-account.json
```

It is excluded by `.gitignore`. Never commit or send that private key.

### 3. Create/update your real SafeSeat Admin login

```powershell
npm run setup-admin -- --email "YOUR_EMAIL" --password "YOUR_STRONG_PASSWORD" --name "SafeSeat Administrator"
```

This creates/updates both:

```text
Firebase Authentication user
admin_accounts/<same UID>
```

The password is never written into source code or printed by the setup script.

### 4. Optional: populate Firebase with safe test records

This remains available for isolated Admin UI testing:

```powershell
npm run seed-firebase-demo -- --admin-email "YOUR_EMAIL"
```

Remove those synthetic records later with:

```powershell
npm run clear-firebase-demo
```

### 5. Run

```powershell
npm run dev
```

Sign in using the email/password you supplied to `setup-admin`.

See `docs/FIREBASE_SETUP.md` for deployment/rules details.

## Firestore collections

```text
admin_accounts
account_directory
vehicles
monitoring_sessions
incidents
hardware_status
admin_settings
diagnostic_requests
```

## Privacy contract

The Admin Module must not display or persist exact physiological readings, raw sensor arrays, or camera media. Admin-facing records contain only operational/derived states needed for administration and incident handling.

Excluded examples include exact HR, RR, MLX temperature, FSR values, MPU samples, camera frames, images, and video.

## Demo mode

To temporarily use the local deterministic UI dataset, change:

```env
VITE_DATA_MODE=demo
```

Demo credentials in `.env` are ignored in Firebase mode.

## Build checks

```powershell
npm run typecheck
npm run build
```
