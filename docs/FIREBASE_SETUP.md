# Firebase Setup — SafeSeat Admin V1.3

## 1. Use the existing SafeSeat Firebase project

Do not create a second Firebase project. Copy the matching Firebase Web configuration values from the existing `safeseat-app` environment into `safeseat-admin/.env` using `.env.example`.

Set:

```env
VITE_DATA_MODE=firebase
```

## 2. Install dependencies

```powershell
npm install
```

## 3. Create an administrator identity

In Firebase Authentication, create or choose the admin's email/password account. Copy its UID.

Then create:

```text
admin_accounts/<AUTH_UID>
```

with at least:

```json
{
  "name": "SafeSeat Administrator",
  "email": "your-admin-email@example.com",
  "role": "Fleet Admin",
  "status": "ACTIVE",
  "enabled": true
}
```

The web app refuses Firebase login when the authenticated UID does not have an active admin document.

## 4. Firestore rules

`firestore.rules` in this repository covers the new Admin collections only and intentionally does not grant the Admin Module access to private mobile profile documents.

If the Firebase project already has a larger rule file, merge these collection blocks into it instead of blindly replacing the existing rules.

Deploy after reviewing:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Account directory

Do not point the Admin Module directly at private user/profile documents if they include height, weight, phone number, or other data unnecessary to fleet administration.

Populate `account_directory` with only the minimal fields required by the Admin Module. The mobile app or a trusted backend can mirror/update this safe directory when a user registers or changes consent.

## 6. Run

```powershell
npm run dev
```

The top bar should show `Firebase live` once authenticated and Firestore subscriptions are active.

## Demo screenshots

For deterministic manuscript screenshots, switch back to:

```env
VITE_DATA_MODE=demo
```

The demo provider remains isolated from Firebase and does not represent real fleet records.
