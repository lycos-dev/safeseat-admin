# SafeSeat Safety Control Center — Admin Web App V1.1

A responsive admin web application for the current SafeSeat thesis system. It keeps the original manuscript's core admin areas — Overview Dashboard, Account Management, Incident Logs, and System Health Monitor — while updating the interface and data model to match the current SafeSeat hardware, runtime flow, guest-passenger use case, and green visual identity.

## V1.1 improvements

- UI spacing, responsive breakpoints, table readability, card alignment, and mobile behavior were polished to prevent controls and content from visually colliding.
- Toggle/switch controls were rebuilt with fixed geometry and consistent alignment.
- Fleet cards were restructured so state badges do not collide with long vehicle names.
- Added an explicit **registered occupant vs guest occupant** session model.
- Guest occupants are session-only and do not need to appear in Account Management.
- Dashboard, Fleet, Vehicle Details, Incident Logs, search, and CSV export all understand guest sessions.
- Demo credentials are centralized through environment configuration rather than embedded throughout the UI.
- Demo data remains separated from page components in `src/data/demoSeed.ts`.

## Included screens

- **Overview Dashboard** — registered vehicles, live monitored-seat sessions, current SafeSeat states, recent incidents, fleet hardware health, and the event-based verification flow.
- **Fleet & Seats** — vehicle → Main Hub → monitored seat → registered/guest occupant relationship, vehicle registration, unit detail, sensor status, and camera state.
- **Account Management** — registered account roles/status, consent visibility, add account, and enable/disable actions. Guests intentionally remain outside the account directory.
- **Incident Logs** — search/filter, CSV export, detailed event traces, guest/registered occupant identity, posture-verification evidence, SMS escalation state, and administrator resolution.
- **System Health Monitor** — diagnostics for Main Hub, C1001, MLX90614, backrest FSR ×6, cushion FSR ×3, MPU6050, and ESP32-S3 camera.
- **Settings** — presentation preferences, demo data reset, and the integration boundary for the final backend.

## SafeSeat design rules reflected in the UI

- Green/white visual language with dark-green surfaces and restrained gold accents.
- Camera is **event-based**, not continuous surveillance.
- Camera posture is supporting verification evidence and does **not** independently declare an emergency.
- Primary runtime states are represented as **Normal → Suspected → Verifying → Emergency / Cleared**.
- MPU6050 is road-vibration/deceleration context, not a medical anomaly detector.
- Current hardware excludes removed ECG, moisture, and seatbelt modules.
- C1001 placement is front-facing, approximately 0.8–1.0 m from the monitored occupant.
- MLX90614 remains associated with the headrest and thermal context.
- Admin wording remains non-diagnostic.
- An active passenger may be a registered SafeSeat occupant **or a Guest**.

## Demo data vs production data

For thesis screenshots and UAT, V1.1 intentionally uses **deterministic seeded demo data** so the interface always has representative Normal, Suspected, Verifying, guest-session, and incident states to display.

The important distinction is that the page components themselves do **not** hard-code individual vehicles, occupants, or incidents. They read from the central state/repository layer. The current demo dataset lives in:

```text
src/data/demoSeed.ts
```

Browser changes persist through `localStorage` in demo mode. When the final SafeSeat backend/Firebase schema is ready, replace the repository/state data source rather than rewriting the screens.

## Demo functionality

- Sign in / sign out with demo access.
- Register a vehicle.
- Add a registered account.
- Enable or disable a registered account.
- Search/filter accounts, vehicles, and incidents.
- Display registered and guest occupant sessions correctly.
- View detailed vehicle/module status.
- Run per-vehicle hardware diagnostics.
- Resolve escalated incidents.
- Export filtered incident logs as CSV.
- Change dashboard preferences, including compact density and live-vitals visibility.
- Reset the demo dataset.

## Demo login

Default values:

- **Email:** `admin@safeseat.demo`
- **Password:** `SafeSeat2026!`

They can be changed through environment variables before starting the app.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite address shown in the terminal, normally `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

The production output is created under `dist/`.

## Folder structure

```text
safeseat-admin/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ vercel.json
├─ .env.example
├─ README.md
└─ src/
   ├─ App.tsx
   ├─ main.tsx
   ├─ types.ts
   ├─ vite-env.d.ts
   ├─ config/
   │  └─ runtime.ts
   ├─ components/
   │  ├─ AppShell.tsx
   │  ├─ Brand.tsx
   │  ├─ DonutChart.tsx
   │  ├─ MetricCard.tsx
   │  ├─ Modal.tsx
   │  ├─ OccupantLabel.tsx
   │  ├─ PageParts.tsx
   │  ├─ StatusBadge.tsx
   │  ├─ Toast.tsx
   │  ├─ Toggle.tsx
   │  └─ VehicleDetail.tsx
   ├─ data/
   │  ├─ demoSeed.ts
   │  └─ store.tsx
   ├─ pages/
   │  ├─ Accounts.tsx
   │  ├─ Dashboard.tsx
   │  ├─ Fleet.tsx
   │  ├─ Health.tsx
   │  ├─ Incidents.tsx
   │  ├─ Login.tsx
   │  └─ Settings.tsx
   ├─ utils/
   │  └─ occupant.ts
   └─ styles/
      └─ globals.css
```

## Suggested Git commit

```text
feat(admin): polish control center UI and support guest occupant sessions
```
