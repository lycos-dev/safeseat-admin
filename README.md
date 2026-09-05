# SafeSeat Safety Control Center — Admin Web App V1.2

Privacy-first administrative prototype for the current SafeSeat architecture.

## V1.2 changes

- Reworked Settings layout so rows, cards, and actions have clear spacing and do not visually merge.
- Rebuilt toggle switches with fixed geometry and equal knob insets in both ON and OFF states.
- Removed all exact physiological readings from the Admin Module data model and UI.
- Removed the old “Show vitals” preference entirely; this privacy boundary is not administrator-configurable.
- V1.2 deletes the retired V1.1 localStorage key on first load because the older prototype contained example HR/RR/temperature values.
- Vehicle details now show only fusion state, camera state, hub connectivity, module health, and a privacy boundary.
- Registered occupants and session-only **Guest** occupants remain distinct throughout Overview, Fleet, and Incident Logs.
- Demo records remain centralized in `src/data/demoSeed.ts` for deterministic manuscript screenshots and UI/UAT review.

## Admin privacy contract

The Admin Module intentionally does **not** display or persist:

- exact heart-rate values;
- exact respiration-rate values;
- exact MLX temperature values;
- individual FSR pressure values;
- raw MPU samples;
- camera frames or a continuous camera stream.

The administrative interface receives only the minimum information needed for fleet operations: SafeSeat fusion state, hardware health/connectivity, occupant/session identity type, event-based posture-verification outcome when requested, incident metadata, and escalation/resolution state.

This does not change the internal SafeSeat runtime. Sensors can still perform the measurements required by the local fusion logic; the Admin Module simply does not expose those raw measurements.

## Demo data vs production data

V1.2 intentionally keeps deterministic demonstration records for the manuscript figures and UI review. This is preferable to taking screenshots from an empty backend or waiting for a live incident just to populate the interface.

The records are **not embedded in page components**. They live in:

```text
src/data/demoSeed.ts
```

Pages consume the shared store instead. During backend integration, replace the demo data provider/repository layer with the final SafeSeat backend/Firebase implementation while keeping the page components and privacy contract intact.

A discreet `Demo mode` badge is shown in the top bar so demonstration records are not mistaken for live fleet data.

## Current SafeSeat hardware represented

- SafeSeat Main Hub
- C1001 mmWave radar — front-facing, approximately 0.8–1.0 m from the monitored occupant
- MLX90614 — headrest
- Backrest FSR array ×6
- Cushion FSR array ×3
- MPU6050 — seat-frame road/vibration context
- ESP32-S3 camera — event-based posture verification only

## Run

```bash
npm install
npm run dev
```

Build validation:

```bash
npm run typecheck
npm run build
```

## Demo login

The defaults are development-only and may be overridden with `.env` values based on `.env.example`.

```text
Email:    admin@safeseat.demo
Password: SafeSeat2026!
```

Do not use demo authentication for production deployment.
