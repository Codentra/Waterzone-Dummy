# Where to put your Convex URL

The app reads the Convex deployment URL from **environment variables**. You need to add it in **one place** for the mobile app.

---

## 1. Get the URL from your Convex account

1. Go to **[dashboard.convex.dev](https://dashboard.convex.dev)** and sign in.
2. Open your **Waterzone** project (or create one: run `npx convex dev` from the `backend` folder first).
3. In the project, go to **Settings** (gear icon) → find **Deployment URL**.
   - It looks like: `https://happy-animal-123.convex.cloud`
4. Copy that full URL.

**Or:** From your machine, run in the `backend` folder:
```bash
cd backend
npx convex dev
```
After it links to your Convex account, the terminal shows the deployment URL. Copy it.

---

## 2. Put the URL in the mobile app

**File:** `mobile-app/.env`  
**Variable:** `EXPO_PUBLIC_CONVEX_URL`

1. In the project root, go to the **mobile-app** folder.
2. If there is no `.env` file, copy `.env.example` and rename the copy to `.env`.
3. Open `mobile-app/.env` and set (paste your real URL, no quotes):

```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
```

Example (replace with your actual URL):

```
EXPO_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
```

4. Save the file.
5. Restart Expo (`npx expo start`) so it picks up the new env.

---

## Summary

| Purpose              | File               | Variable                    |
|----------------------|--------------------|-----------------------------|
| Mobile app → Convex  | `mobile-app/.env`  | `EXPO_PUBLIC_CONVEX_URL`   |

The value is read in `mobile-app/lib/env.ts` and passed to the Convex client. Only you can add it, because only you have access to your Convex dashboard and the deployment URL.
