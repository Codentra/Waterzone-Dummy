# Waterzone

Water delivery app for Zimbabwe: customer app, driver app (same mobile codebase), and Convex backend. Admin dashboard (web) planned later.

## Project layout

| Folder | Purpose |
|--------|--------|
| **mobile-app/** | Expo app (Android + iOS). Customer tabs + driver tabs, Convex client. |
| **backend/** | Convex backend (schema, functions). Run `npx convex dev` from here. |
| **docs/** | Documentation and system overview. |

## Quick start

1. **Backend**
   - `cd backend && npm install && npx convex dev`
   - Use the Convex deployment URL from the dashboard or CLI.

2. **Mobile app**
   - `cd mobile-app && npm install`
   - Copy `.env.example` to `.env` and set `EXPO_PUBLIC_CONVEX_URL` to your Convex URL.
   - `npx expo start` and open on Android or iOS.

3. **Docs**
   - See `docs/README.md` for detailed setup and `docs/SYSTEM_OVERVIEW.md` for architecture.

## Stack

- **Mobile:** Expo (React Native), Expo Router
- **Backend:** Convex (database, real-time, serverless)
- **Connection:** Mobile app uses Convex React client with `EXPO_PUBLIC_CONVEX_URL` pointing at the backend deployment.
