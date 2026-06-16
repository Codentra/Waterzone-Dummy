# Waterzone – What’s implemented and what’s stubbed

## Implemented

### Backend (Convex)

- **Users:** `createUser`, `getMe`, `getByPhone` (placeholder auth – no OTP).
- **Drivers:** `registerDriver`, `getByUserId`, `getStatus`, `updateStatus`, `updateLocation`, `listOnline`, `setVerification` (admin).
- **Orders:** `createOrder`, `assignDriver`, `acceptOrder`, `setEnroute`, `markDelivered`, `cancelOrder`, `listByCustomer`, `listByDriver`, `get`.
- **Wallets:** `getWallet`, `createWallet`, `listTransactions`.
- **Helpers:** `requireUserRole` for customer/driver/admin guards.

### Mobile app (Expo)

- **Auth:** Placeholder sign-in (name, phone, role). Stored in AsyncStorage. No OTP.
- **Routing:** Index redirects by role → customer `(tabs)`, driver `driver/register` or `driver/register-pending` or `(driver-tabs)`.
- **Customer:** Home (create order + auto assign driver), Orders list, Wallet (balance + transactions), Profile (sign out).
- **Driver:** Register (vehicle, docs), Register-pending screen, Dashboard (online toggle + current job), Orders (Accept → En route → Delivered), Wallet, Profile.
- **Convex:** `ConvexProvider` + `AuthProvider`. App uses `convex/*` path to backend’s generated API.

## Stubbed / not done (per spec)

- **OTP:** No phone OTP. Auth is dev placeholder only.
- **Paynow:** No real payment flow. Payment method and status are stored only.
- **Pricing:** No pricing engine. Order has `total`/`fee`/`driverEarnings` fields but they are not set.
- **Admin dashboard:** Web app not built. Admin can approve drivers only via Convex mutation (e.g. from dashboard Functions).
- **Notifications:** No push/SMS. Tables/fields exist for later.
- **Location/ETA:** Driver location and ETA not implemented (fields exist).

## Testing driver flow

1. Sign in as **Driver** (name, phone, role Driver).
2. You’ll be sent to **Register as driver** (vehicle plate, type, docs). Submit.
3. You’ll see **Register pending** until the driver is approved.
4. **Approve in Convex:** Dashboard → Data → `drivers` → open your driver doc → set `verificationStatus` to `"approved"`.
5. Restart app or go back to index; you should land on Driver tabs. Go **online** on Dashboard.
6. In another session (or device), sign in as **Customer**, place an order. Assign runs automatically; an online approved driver gets assigned.
7. As driver, open **Orders**, **Accept** → **En route** → **Mark delivered**.

## Convex URL

- Set `EXPO_PUBLIC_CONVEX_URL` in `mobile-app/.env` to your Convex deployment URL (e.g. from `backend/.env.local` or Dashboard).
