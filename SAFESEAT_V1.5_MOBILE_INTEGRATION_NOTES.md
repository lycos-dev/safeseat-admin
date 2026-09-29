# SafeSeat Admin V1.5 — Mobile Integration

This package is paired with the updated SafeSeat mobile app.

## Integrated Firestore path

`Main Hub → Mobile App → shared Firebase project → Admin Module`

The mobile app writes only privacy-minimized, derived records. Exact physiological values, raw sensor arrays, and camera frames are excluded by both application code and Firestore rules.

## New in V1.5

- Mobile-owned `vehicles/{vehicleId}` records are supported securely.
- `monitoring_sessions` supports registered account owners, saved person profiles, and session-only guests.
- Real Main Hub emergency events appear in `incidents` and can be resolved by Admin.
- Hardware module states are read from `hardware_status`.
- Empty Admin dashboards no longer claim `100%` fleet health when no hardware record exists.
- The Live Monitor table shows active occupied sessions instead of every registered vehicle.
- Existing Firebase Admin authentication and the corrected switch/button UI are retained.

## Required deployment step

Before testing the paired mobile app, deploy/merge this package's rules:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

Then ensure the mobile app uses the same Firebase project and matching vehicle identity in its `.env`.
- Admin diagnostic requests now have a privacy-minimized mobile response path: the mobile bridge refreshes module health and marks the request complete without raw readings.
- A configured vehicle continues sending privacy-safe hardware heartbeats even between occupant sessions, so registered-vehicle health and Admin diagnostics remain meaningful without a live session.
- Setting a mobile directory account to `DISABLED` now blocks that account's shared Admin-cloud writes through Firestore rules while leaving local SafeSeat monitoring independent.
