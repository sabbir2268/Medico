# Medico — Manual Production Deployment Guide

This project is a two-part MERN application and is deployed as **two separate services**:

| Part | Platform | Repo root directory | Framework / runtime |
| --- | --- | --- | --- |
| Frontend (`client/`) | Vercel | `client` | Vite + React (JavaScript only) |
| Backend (`server/`) | Render | `server` | Node.js + Express |
| Database | MongoDB Atlas | — | `medico` database |
| Auth | Firebase | — | Client web config + server Admin SDK |
| Payments | Stripe | — | Checkout + webhook |
| Images | imgbb | — | Server-side upload proxy |

**Nothing in this guide deploys automatically.** All steps are performed by you in the platform dashboards.

---

## 0. Pre-deployment checklist (before touching any dashboard)

Run these locally from the repository root. All commands use `npm.cmd` on Windows PowerShell (plain `npm` is blocked by the execution policy here); on macOS/Linux use `npm`.

```powershell
# Frontend production build (must exit successfully)
cd client
npm.cmd ci
npm.cmd run build
npm.cmd test
cd ..

# Backend tests (must show 0 failures)
cd server
npm.cmd ci
npm.cmd test
cd ..
```

Verified baseline at the time of writing: client build succeeds, **66/66** client tests pass, **33/33** server tests pass.

> Do not continue if either test command reports failures.

**Commit and push your changes before deploying.** Vercel and Render build from
Git, not from your local folder. In particular `client/vercel.json` (the SPA
rewrite) must be part of the deployed branch or deep links will 404. Never add
real `.env` files or keys to the commit.

### Secret hygiene

- Only `.env.example` files are committed. Real `.env` files are ignored by `.gitignore` (root, `client/`, and `server/`).
- **Never** paste real keys into Vercel/Render *build command* fields, into this file, or into source code. Enter them only in the platform **Environment Variables** UI.
- If any real key was ever committed or shared, rotate it in its provider before deploying.

---

## 1. MongoDB Atlas

1. Create (or reuse) a cluster and a database user with read/write access to the `medico` database.
2. **Network Access:** Render does not have a fixed outbound IP on all plans. Add `0.0.0.0/0` (allow from anywhere) or, on a paid plan with a static outbound IP, allow only that IP. Restrict to the database user + strong password.
3. Copy the SRV connection string. It must include the database name, e.g.
   `mongodb+srv://<user>:<password>@<cluster-host>/medico?retryWrites=true&w=majority`
   URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, etc.).

This value becomes `MONGODB_URI` on Render. Do **not** put it on Vercel.

---

## 2. Firebase

You need two different sets of values:

**A. Web app config (public — goes to Vercel):**
Firebase console → Project settings → Your apps → Web app → SDK setup and configuration.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

**B. Service account (secret — goes to Render only):**
Firebase console → Project settings → Service accounts → Generate new private key (JSON).

- `FIREBASE_PROJECT_ID` → `project_id`
- `FIREBASE_CLIENT_EMAIL` → `client_email` (must be a `firebase-adminsdk-…@<project>.iam.gserviceaccount.com` address)
- `FIREBASE_PRIVATE_KEY` → `private_key` (paste the whole value including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines; keep the literal `\n` escapes as exported in the JSON)

**Authorized domains:** Firebase console → Authentication → Settings → Authorized domains → add your Vercel domain (and any custom domain). Otherwise browser sign-in will be blocked in production.

Enable the sign-in methods you use (Email/Password, Google, etc.) in Authentication → Sign-in method.

---

## 3. Stripe

1. Use **test mode keys first** for verification, then switch to live keys when ready. Both the client publishable key and the server secret key must be from the **same** Stripe account/mode.
2. Client (Vercel): `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_…` / `pk_live_…`.
3. Server (Render): `STRIPE_SECRET_KEY` = `sk_test_…` / `sk_live_…`.
4. After the backend URL is known (step 5), create a webhook endpoint in Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - Endpoint URL: `https://<your-render-service>.onrender.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
   - Copy the **signing secret** (`whsec_…`) into Render's `STRIPE_WEBHOOK_SECRET`. Orders are only marked paid by a verified webhook; without this, payments will not complete.

---

## 4. imgbb

1. Get an API key at <https://api.imgbb.com/> (free account → API key).
2. Set it **only on Render** as `IMGBB_API_KEY`. There is deliberately **no client-side imgbb key**: the browser posts images to `POST /api/uploads/image` and the server performs the upload. The legacy `VITE_IMAGE_UPLOAD_KEY` variable is unused and must stay **empty on Vercel**. (Any old value in a local `client/.env` should be deleted and the key rotated — it is a secret even though the app never reads it.)
3. Verify after deploy: `GET https://<render-service>.onrender.com/api/health` should report `features.storage.imgbb: true`.

> Local development from some networks/IPs receives imgbb error `103` ("forbidden to use this website"). This is network-dependent; Render's egress IP is different, so set the key and verify with the health endpoint. If it is still blocked, set the Cloudinary variables as a fallback (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

---

## 5. Deploy the backend on Render (do this first)

1. Render Dashboard → **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configuration:
   - **Name:** `medico-api` (this determines `https://medico-api.onrender.com`)
   - **Region:** nearest to your users
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance type:** Free (or paid — note free instances sleep after inactivity)
4. Expand **Advanced** → **Health Check Path:** `/api/health`.
5. Add **Environment Variables** (Environment tab → Add Environment Variable). Exact names:

   | Variable | Example / notes |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | Leave unset — Render injects it automatically; the app reads `process.env.PORT` |
   | `MONGODB_URI` | Atlas SRV string from step 1 (secret) |
   | `MONGO_SERVER_SELECTION_TIMEOUT_MS` | `5000` |
   | `CORS_ORIGIN` | `https://<your-vercel-app>.vercel.app` (comma-separated list allowed; add custom domains too; never `*`) |
   | `MORGAN_FORMAT` | `combined` |
   | `RATE_LIMIT_WINDOW_MS` | `900000` |
   | `RATE_LIMIT_MAX` | `100` |
   | `ADMIN_EMAIL` | the one admin email, lowercase — must equal `VITE_ADMIN_EMAIL` on Vercel |
   | `FIREBASE_PROJECT_ID` | from service account JSON |
   | `FIREBASE_CLIENT_EMAIL` | from service account JSON |
   | `FIREBASE_PRIVATE_KEY` | from service account JSON (keep `\n` escapes) |
   | `JWT_SECRET` | long random value, e.g. `openssl rand -base64 48` |
   | `JWT_REFRESH_SECRET` | a **different** long random value |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `JWT_ISSUER` | `medico-api` |
   | `JWT_AUDIENCE` | `medico-client` |
   | `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` from step 3 |
   | `STRIPE_SUCCESS_URL` | `https://<your-vercel-app>.vercel.app/payments/success` |
   | `STRIPE_CANCEL_URL` | `https://<your-vercel-app>.vercel.app/payments/cancel` |
   | `IMGBB_API_KEY` | from step 4 |
   | `CLOUDINARY_CLOUD_NAME` | optional fallback |
   | `CLOUDINARY_API_KEY` | optional fallback |
   | `CLOUDINARY_API_SECRET` | optional fallback |

6. Click **Create Web Service**. Verify:
   - Logs show `MongoDB connected successfully` and `Server listening on port <port> in production mode`.
   - `GET https://<service>.onrender.com/api/health` returns HTTP **200** with `status: "ok"` and `features.auth.firebaseAdmin: true`, `features.payments.stripe: true`, `features.storage.imgbb: true`.

---

## 6. Deploy the frontend on Vercel

1. Vercel Dashboard → **Add New…** → **Project** → import the same GitHub repository.
2. Configure:
   - **Root Directory:** `client` (click **Edit** and select `client`)
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
   - **Node.js Version:** 22.x (project requires ≥ 20.19.0)
3. Add **Environment Variables** (Project Settings → Environment Variables, apply to **Production**, and optionally Preview/Development):

   | Variable | Production value |
   | --- | --- |
   | `VITE_APP_NAME` | `Medico` |
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` (**must include `/api`**) |
   | `VITE_API_TIMEOUT` | `15000` |
   | `VITE_USE_FALLBACK_DATA` | `false` |
   | `VITE_AUTH_MODE` | `firebase` (see note below) |
   | `VITE_ALLOW_FIREBASE_ONLY_AUTH` | optional — legacy flag, read but unused; roles always come from the backend |
   | `VITE_ADMIN_EMAIL` | same email as server `ADMIN_EMAIL` |
   | `VITE_FIREBASE_API_KEY` | public web config |
   | `VITE_FIREBASE_AUTH_DOMAIN` | public web config |
   | `VITE_FIREBASE_PROJECT_ID` | public web config |
   | `VITE_FIREBASE_STORAGE_BUCKET` | public web config |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | public web config |
   | `VITE_FIREBASE_APP_ID` | public web config |
   | `VITE_FIREBASE_MEASUREMENT_ID` | optional; read for compatibility but analytics is not initialized |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` / `pk_live_…` |
   | `VITE_PAYMENT_KEY` | optional legacy alias — leave unset if using the canonical name above |
   | `VITE_IMAGE_UPLOAD_KEY` | **leave unset** (unused) |
   | `VITE_CLOUDINARY_CLOUD_NAME` | leave unset unless using direct unsigned Cloudinary uploads |

   > Vite bakes `VITE_*` values into the JavaScript bundle at **build time**. After changing any of them you must **Redeploy** (Deployments → ⋯ → Redeploy, with "Use existing Build Cache" unchecked) so the new values take effect.

   > Use `VITE_AUTH_MODE=firebase` for the configuration in this guide. The
   > Google/GitHub buttons are always visible; they only work when the Firebase
   > web values above are set and the Vercel domain is an authorized domain.
   > If you deliberately choose `VITE_AUTH_MODE=backend`, ignore those buttons
   > and use the email/password form. Do not leave a localhost value in
   > `VITE_API_URL` — the production build now fails fast on one.

4. Click **Deploy**. Verify:
   - Build log ends with `✓ built` and no env errors.
   - Open the site: home page loads real data (not fallback), and a hard refresh/refresh of a deep link such as `/shop` or `/dashboard` shows the correct page (SPA rewrite).
   - Browser DevTools → Network: API requests go to `https://<render-service>.onrender.com/api/...`, not to `localhost`.
   - Sign in with Firebase; a `POST /api/auth/firebase` request succeeds and subsequent authenticated requests carry `Authorization: Bearer …`.

---

## 7. Post-deploy verification

1. **CORS:** browser console has no "Origin not allowed by CORS" errors. If it does, add the exact Vercel origin to `CORS_ORIGIN` on Render and restart the service.
2. **Auth:** register/login or Firebase sign-in works; the profile page shows the signed-in user; the admin dashboard is visible only for `ADMIN_EMAIL`.
3. **Payments:** run a Stripe test-mode checkout end-to-end. Confirm:
   - `POST /api/payments/create-checkout-session` returns a Stripe URL and redirects correctly to `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`.
   - Stripe Dashboard → Webhooks shows `200` responses for `checkout.session.completed` (and other configured events).
   - The order and payment show as paid only after the verified webhook.
4. **Images:** upload an image from the seller/admin UI; imgbb response is stored and the image renders.
5. **Secrets:** view the built JS bundle in DevTools and confirm no `sk_`, `whsec_`, MongoDB SRV string, or Firebase service-account private key appears. Only public `pk_…` and Firebase web config values are expected.
6. **Deep links:** copy a protected URL (e.g. `/payments/success?session_id=…`) into a new incognito tab — it must load the SPA rather than a 404.

---

## 8. Common failure signatures

| Symptom | Cause / fix |
| --- | --- |
| Render start fails: `CORS_ORIGIN must list explicit origins in production` | Set `CORS_ORIGIN` to the real Vercel URL; `*` is forbidden in production. |
| Render start fails: `Missing required environment variable: JWT_SECRET` | Generate a random secret and set both JWT secrets on Render. |
| Render start fails: `ADMIN_EMAIL must be set in production` | Add `ADMIN_EMAIL` on Render (same value as Vercel's `VITE_ADMIN_EMAIL`). |
| Render start fails: `STRIPE_WEBHOOK_SECRET must be set in production...` | Payments are enabled but the webhook secret is missing; copy `whsec_…` from Stripe. |
| Render start fails: `STRIPE_SUCCESS_URL must be a deployed, non-localhost URL` | Replace the localhost redirect URLs with your Vercel URLs. |
| Render start fails: `Refusing to start in production without MongoDB` | Atlas `MONGODB_URI`, user/password (URL-encoded) or Network Access is wrong. |
| `/api/health` returns 503 `DATABASE_UNAVAILABLE` | Atlas network access / credentials / wrong database name in `MONGODB_URI`. |
| API requests hit `localhost:5000` in the deployed site | `VITE_API_URL` was not set to the full Render URL **before** the Vercel build; set it and redeploy without build cache. |
| Firebase sign-in fails in production | Vercel domain missing from Firebase Authorized Domains, or wrong web config values. |
| `AUTH_NOT_CONFIGURED` (503) on auth endpoints | Service-account variables missing/incorrect on Render. |
| Checkout succeeds but order stays unpaid | `STRIPE_WEBHOOK_SECRET` empty or wrong, webhook URL/event not registered, or `express.raw()` body parsing broken. |
| Image upload fails with imgbb `103` | Key missing on Render, or provider blocking the network; use Cloudinary fallback variables. |
| Deep link shows Vercel 404 | SPA rewrite missing — ensure `client/vercel.json` is committed at the repo root of the Vercel project. |
