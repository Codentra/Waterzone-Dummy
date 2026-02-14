# Waterzone docs

Documentation for the Waterzone water delivery system (Zimbabwe).

## Repo structure

- **`mobile-app/`** – Expo app (customer + driver, same codebase; role-based tabs)
- **`backend/`** – Convex backend (schema, mutations, queries)
- **`docs/`** – This folder (overview, API notes, runbooks)

## System overview

See [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) for apps, data model, backend services, and screen layout.

## Implementation status

See **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** for what’s built, what’s stubbed (OTP, Paynow, pricing, admin dashboard), and how to test the driver flow (including approving a driver in Convex).

## Getting started

### Backend (Convex)

1. From repo root: `cd backend`
2. `npm install`
3. `npx convex dev` (first time: log in and create project; note the deployment URL)
4. Copy `backend/.env.example` to `backend/.env.local` and set `CONVEX_DEPLOYMENT` if needed

### Mobile app (Expo)

1. From repo root: `cd mobile-app`
2. `npm install`
3. Copy `mobile-app/.env.example` to `mobile-app/.env`
4. Set `EXPO_PUBLIC_CONVEX_URL` to your Convex deployment URL (from Convex dashboard or `npx convex dev` output)
5. `npx expo start` then run on Android/iOS

### Connecting Expo to Convex

- **Where the URL goes:** In `mobile-app/.env` set `EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud` (get the URL from [dashboard.convex.dev](https://dashboard.convex.dev) → your project → Settings → Deployment URL).
- The app reads it in `mobile-app/lib/env.ts`. See **[CONVEX_URL_SETUP.md](./CONVEX_URL_SETUP.md)** for step-by-step.
- Only you can add your URL; the assistant cannot access your Convex account.
