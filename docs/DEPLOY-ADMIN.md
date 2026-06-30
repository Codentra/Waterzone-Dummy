# Deploy Waterzone Admin to Vercel (external link)

The admin dashboard runs on **Vercel**. Data lives on **Convex** (already in the cloud).

**For now:** no login — preview link only.  
**Later:** team/owner sign-in (per admin use-case plan).

---

## 1. Push code to GitHub

**Repo:** [github.com/Codentra/Waterzone-Dummy](https://github.com/Codentra/Waterzone-Dummy) (connected to Vercel)

### Push from your PC (Command Prompt)

```cmd
cd C:\Users\HP\Videos\Waterzone-Dummy-main\Waterzone-Dummy-main

git remote add origin https://github.com/Codentra/Waterzone-Dummy.git
git branch -M main
git push -u origin main
```

If the remote already has older commits and push is rejected, use (only when your local copy is the source of truth):

```cmd
git push -u origin main --force-with-lease
```

---

## 2. Vercel (already connected)

**Live URL:** [waterzone-dummy.vercel.app](https://waterzone-dummy.vercel.app)

Project settings (already configured):

| Setting | Value |
|---------|--------|
| **Root Directory** | `admin-dashboard` |
| **Include files outside root** | On (imports `../backend/convex`) |
| **Framework** | Next.js |

### Environment variable (required)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://zany-wildcat-447.convex.cloud` |

Pushes to `main` on GitHub auto-deploy to Vercel.

### If the site shows 404

1. Vercel → **Project Settings → Build & Deployment**
2. Confirm **Root Directory** is `admin-dashboard` (not `.`)
3. Confirm **Include source files outside of the Root Directory** is **On**
4. Redeploy from the **Deployments** tab

---

## 3. After deploy

- Open the Vercel URL — admin should show **Connected to Convex** (green bar)
- **Drivers:** [waterzone-dummy.vercel.app/drivers](https://waterzone-dummy.vercel.app/drivers) — review pending applications
- Go to **Bundle pricing** → **Activate bundles**
- Share the Vercel link with your team for preview (no signup yet)

---

## 4. Later: lock to team + owner only

Per the [admin use-case plan](admin_use_case_review_af15dd1c.plan.md):

- Add `/login` for `admin` role users
- Vercel **Password Protection** (Pro) or app auth (Clerk, Convex Auth, etc.)
- Do **not** leave pricing/payments public in production long term

---

## 5. Local vs external

| | Local (`START-ADMIN.bat`) | Vercel |
|--|---------------------------|--------|
| Who can open | Only your PC | Anyone with the link |
| PC must be on | Yes | No |
| Convex | Same cloud URL | Same cloud URL |

You can stop using local admin once Vercel works — your PC is not needed.

---

## 6. When you need START-BACKEND.bat (local Windows launchers)

The admin dashboard talks to **Convex in the cloud** — not a server running on your PC. You do **not** need `START-BACKEND.bat` for everyday admin, driver approval, or payments work.

| What you're doing | Use |
|-------------------|-----|
| Admin / drivers / payments (team use) | **[waterzone-dummy.vercel.app](https://waterzone-dummy.vercel.app)** — nothing local |
| Local admin UI on your PC | **`START-ADMIN.bat`** or **`START-WATERZONE.bat`** (admin only) |
| Editing `backend/convex/` code | **`START-BACKEND.bat`** (`convex dev` — syncs changes to cloud) |
| Mobile app testing | Mobile app only — points at same Convex URL |

**Launchers (folder above `Waterzone-Dummy-main`):**

| File | Purpose |
|------|---------|
| `START-WATERZONE.bat` | Starts **local admin only** (recommended local shortcut) |
| `START-ADMIN.bat` | Same — local admin at http://localhost:3001 |
| `START-BACKEND.bat` | **Developers only** — run while changing Convex functions |

`START-WATERZONE.bat` no longer starts the backend automatically. That was only needed when we thought admin required a local API; Vercel + cloud Convex made that unnecessary.

