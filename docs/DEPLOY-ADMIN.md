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

## 2. Connect Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. **Import** your GitHub repo
3. **Root Directory:** leave as `.` (repo root — `vercel.json` handles the admin app)
4. **Framework:** Next.js (auto-detected)

### Environment variable (required)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://zany-wildcat-447.convex.cloud` |

(Add under **Settings → Environment Variables** for Production, Preview, and Development.)

5. Click **Deploy**

You get a public URL like: `https://waterzone-dummy.vercel.app`

### If the site shows 404

In Vercel → **Project Settings → Build & Deployment**:

1. **Root Directory:** `.` (repo root) — `vercel.json` builds `admin-dashboard/`
2. **Output Directory:** leave empty (overridden by `vercel.json` → `admin-dashboard/.next`)
3. **Include source files outside of the Root Directory:** **On** (admin imports `../backend/convex`)
4. Redeploy from the **Deployments** tab

---

## 3. After deploy

- Open the Vercel URL — admin should show **Connected to Convex** (green bar)
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
