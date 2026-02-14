# Waterzone system overview

High-level reference for apps, data, and backend behaviour.

## Apps

| App | Stack | Purpose |
|-----|--------|---------|
| Customer mobile | Expo (same codebase) | Register, create order, track, wallet, receipts, notifications |
| Driver mobile | Expo (same codebase, role tabs) | Register as driver, approval status, online toggle, accept orders, status updates, location, wallet, payouts |
| Admin dashboard | Web (later) | Approve drivers, orders, pricing, Paynow, support (refunds, disputes, cancellations) |

## Backend (Convex)

- **Data:** users, drivers, driverStatus, orders, paymentIntents, walletAccounts, walletTransactions, notifications, addresses
- **Auth:** role-based (customer | driver | admin); role-guarded mutations
- **Orders:** lifecycle requested → offered/assigned → accepted → enroute → delivered (+ cancelled)
- **Payments:** Paynow intents, webhook/polling, receipts, wallet transactions
- **Location:** driver heartbeat; query driver location for active order
- **Notifications:** push (Expo); triggers for order and driver events

## Mobile app structure (Expo Router)

- **app/** – routes: `(auth)`, `(tabs)` customer, `(driver-tabs)` driver, `driver/register-pending`
- **ui/, components/, lib/, providers/, constants/, assets/** – shared UI and logic
- **lib/env.ts** – `EXPO_PUBLIC_CONVEX_URL` for Convex client

## Docs in this folder

- **README.md** – repo layout, getting started, connecting Expo to Convex
- **SYSTEM_OVERVIEW.md** – this file
