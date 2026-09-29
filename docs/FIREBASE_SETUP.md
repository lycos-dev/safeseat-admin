# Firebase Setup — SafeSeat Admin V1.4

## Shared Firebase project

The Admin uses the existing `safeseat-app` Firebase project. Do not create a second Firebase project for the Admin Module.

The supplied `.env` and `.env.example` already contain the Firebase Web configuration and the privacy-minimized Admin collection names. Firebase Web configuration is client configuration; the Firebase **service-account private key is not included** and must remain private.

## 1. Install dependencies

```powershell
npm install
```

## 2. Obtain a service-account key for one-time administration

Firebase Console → Project Settings → Service Accounts → Generate new private key.

Save it as:

```text
service-account.json
```

The file is ignored by Git. Do not commit, upload, or share it.

You may use another path with:

```powershell
npm run setup-admin -- --service-account "C:\path\service-account.json" --email "..." --password "..."
```

## 3. Provision the SafeSeat administrator

```powershell
npm run setup-admin -- --email "YOUR_EMAIL" --password "YOUR_STRONG_PASSWORD" --name "SafeSeat Administrator"
```

The command creates or updates:

```text
Firebase Authentication
└── <admin email/password user>

Firestore
└── admin_accounts/<AUTH_UID>
    ├── name
    ├── email
    ├── role: "Fleet Admin"
    ├── status: "ACTIVE"
    └── enabled: true
```

A normal Firebase Auth user cannot enter the Admin Module without the active `admin_accounts/<UID>` authorization record.

The provisioning script contains no built-in admin email or password.

## 4. Deploy/merge Firestore rules

The repository's `firestore.rules` includes both the SafeSeat mobile-user namespace and the privacy-minimized Admin collections.

If your live Firebase project already has newer mobile-app rules, merge the Admin collection blocks rather than blindly replacing a newer ruleset.

Then deploy:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Seed Firebase while the Mobile App is unfinished

The Admin can be tested independently with synthetic records:

```powershell
npm run seed-firebase-demo -- --admin-email "YOUR_EMAIL"
```

This creates clearly named test records such as:

```text
account_directory/TEST-DRIVER-001
account_directory/TEST-OCCUPANT-001
vehicles/SS-TEST-01
monitoring_sessions/TEST-SESSION-001
hardware_status/SS-TEST-01
incidents/TEST-INCIDENT-001
incidents/TEST-INCIDENT-002
```

They contain only derived/privacy-minimized Admin fields. They are not substitutes for final Mobile App synchronization.

Remove them with:

```powershell
npm run clear-firebase-demo
```

The cleanup intentionally does not delete the real admin account.

## 6. Run Firebase mode

`.env` is already set to:

```env
VITE_DATA_MODE=firebase
```

Start:

```powershell
npm run dev
```

Sign in with the credentials supplied to `setup-admin`.

## 7. Expected behavior before Mobile sync is finalized

With no seed data, successful Firebase login can legitimately show an empty fleet/account/incident dataset.

With the synthetic seed installed, the Firebase-backed UI can be tested for:

- login/logout and admin authorization;
- realtime account directory;
- vehicle list/detail;
- hardware-health UI;
- active monitoring state display;
- incident history and resolution;
- dashboard preferences;
- diagnostic-request creation.

Actual Main Hub/Mobile-generated records remain a later integration step.

## Security notes

- Never put a Firebase service-account JSON key in `.env`, browser code, Git, or deployment assets.
- The browser uses only Firebase Web configuration.
- `admin_accounts` authorizes Admin access; it is not the mobile user directory.
- `account_directory` contains only fields necessary for administration.
- Exact HR, RR, temperature, FSR, MPU, camera frames, and raw telemetry are excluded from the Admin contract.
