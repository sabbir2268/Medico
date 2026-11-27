# Medico

Medico is an online pharmacy where customers browse medicines and health devices, add them to a cart, and pay through Stripe, while sellers list products and an administrator moderates the catalog and orders. It is a React storefront backed by an Express REST API and MongoDB, with Firebase sign-in.

**Live demo:** https://medico-sr.vercel.app/

> **Heads up:** the backend runs on Render's free tier, so after a period of inactivity it sleeps — the first load can take ~50 seconds while it wakes up. Please wait before assuming the site is empty.

---

## Screenshots

<!-- TODO: create docs/screenshots/ and capture the six images linked below. -->

![Home page](docs/screenshots/home.png)
![Shop / catalog](docs/screenshots/shop.png)
![Cart and checkout](docs/screenshots/cart-checkout.png)
![Customer dashboard](docs/screenshots/customer-dashboard.png)
![Seller medicine form](docs/screenshots/seller-form.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)

File names to create in `docs/screenshots/`: `home.png`, `shop.png`, `cart-checkout.png`, `customer-dashboard.png`, `seller-form.png`, `admin-dashboard.png`.

---

## Demo accounts

<!-- TODO: no customer demo account is seeded in server/src/scripts/seed.js, so the customer credentials below are placeholders. -->

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Customer | TODO (no seeded customer) | TODO | Register a new customer account through the sign-up form. |
| Seller | `seller@medico.test` | `Seller@123` | Seeded by `npm run seed` (`server/src/scripts/seed.js`). |
| Admin | Your `ADMIN_EMAIL` (example: `admin@medico.test`) | TODO (choose when registering) | Not seeded — see below. |

**Creating the admin:** set `ADMIN_EMAIL` in `server/.env` and `VITE_ADMIN_EMAIL` in `client/.env` to the same address, then register that address with the normal sign-up form. The admin role is not assignable through the API (`server/src/validators/auth.validators.js`); `server/src/middleware/authenticate.js` derives the effective role from the `ADMIN_EMAIL` allow-list on every request, so registration alone can never create an admin.

---

## Key technical highlights

- **Server-side pricing** — prices, discounts and delivery charges are recomputed from MongoDB records in `server/src/services/order.service.js`; the browser never submits a price.
- **Stripe webhook as payment truth** — only a signature-verified webhook marks a payment and order as paid (`server/src/controllers/payment.controller.js`, `server/src/services/payment.service.js`); the browser redirect is never trusted.
- **JWT refresh rotation** — short-lived access tokens, a refresh endpoint that issues a fresh pair, and `tokenVersion` invalidation on logout and admin block/delete (`server/src/services/tokenService.js`, `server/src/controllers/auth.controller.js`, `client/src/lib/api/client.js`).
- **Idempotent orders** — a client idempotency key deduplicates order creation and stock is decremented atomically (`server/src/services/order.service.js`).
- **RBAC** — roles are read from the database on every request and enforced by middleware, with a single `ADMIN_EMAIL` allow-list (`server/src/middleware/authenticate.js`, `server/src/middleware/authorize.js`, `server/src/constants/roles.js`).

---

## How it works

```
Browser (React SPA)
        │  /api requests (Bearer <access token>)
        ▼
Vite dev proxy (localhost:5173 → localhost:5000)   ── development
Vercel SPA                                        ── production
        │
        ▼
Express API (/api)  ──► MongoDB Atlas  (users, medicines, categories, carts, orders, payments, …)
        ├── Firebase Admin  → verifies Firebase ID tokens
        ├── Stripe         → Checkout Sessions + signed webhooks (payment truth)
        └── imgbb/Cloudinary → server-side image hosting
```

<details>
<summary>Request flow details</summary>

1. **Sign-in.** The client signs in with Firebase (Google/GitHub/email) and exchanges the Firebase ID token at `POST /api/auth/firebase`, or uses native email/password via `POST /api/auth/register` / `/login` when `VITE_AUTH_MODE=backend`.
2. **Session.** The server returns a short-lived JWT access token plus a refresh token. The client attaches the access token to every request and refreshes once on a 401. Logout bumps the user's `tokenVersion`, invalidating previously issued tokens.
3. **Authorization.** Tokens carry identity only. The API loads the account from MongoDB on every request and derives the effective role; admin access is granted only to the configured `ADMIN_EMAIL`.
4. **Pricing.** All prices, discounts, delivery charges and totals are computed on the server from trusted database values.
5. **Checkout.** An order is created from the server-side cart with an idempotency key; stock is decremented atomically, prescription details are enforced for restricted medicines, and the cart is cleared. Only a signature-verified Stripe webhook marks the order as paid.
6. **Storefront data.** The home page aggregates advertisements, categories, featured/discounted/advertised medicines and health tips; public listings show only approved, in-stock medicines in active categories.

</details>

---

## Tech stack

<details>
<summary>Client (client/)</summary>

- React 19 + Vite 8 (JavaScript/JSX, no TypeScript), React Router 7
- TanStack Query 5, Zod 4 + React Hook Form
- Tailwind CSS 4, lucide-react icons, Swiper, Recharts, Sonner toasts
- Firebase Web SDK, axios
- Vitest + Testing Library + jsdom, ESLint, Prettier

</details>

<details>
<summary>Server (server/)</summary>

- Node.js + Express 5 (ES modules), Mongoose 9 + MongoDB Atlas
- Zod 4 validation, JWT access/refresh tokens, bcryptjs
- Firebase Admin SDK, Stripe (Checkout + webhooks), imgbb with Cloudinary fallback
- Helmet, CORS allow-list, express-rate-limit, Morgan
- pdfkit for invoices/reports, multer for image uploads
- `node:test` + Supertest for tests, nodemon for development

</details>

---

## Features implemented

- **Storefront** — hero slider, advertisements, categories, featured/discounted medicines, health tips, searchable/filterable catalog, category and deals pages, medicine detail modal.
- **Accounts** — Firebase and native email/password sign-in, social buttons, refresh-token flow, customer/seller/admin route scoping.
- **Cart & payments** — server-side cart with stock validation and guest-cart merge, prescription requirements, idempotent order creation, hosted Stripe Checkout, signature-verified webhooks, PDF invoices, one-time stock restoration on cancellation.
- **Dashboards** — customer profile/security/orders/payments, seller home and medicine creation, and admin analytics, moderation, reports, advertisements, health tips and audit logs.
- **Operations** — aggregated `/api/home` endpoint and a `/api/health` endpoint reporting integration readiness.

---

## Installation and local development

Requires Node.js **20.19+** (22.x recommended) and npm.

<details>
<summary>Setup commands and environment notes</summary>

```bash
git clone <repository-url>
cd Medico
```

**Backend**

```bash
cd server
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# Fill in MONGODB_URI, JWT secrets, ADMIN_EMAIL; Firebase/Stripe/imgbb are optional locally.
npm run dev               # http://localhost:5000/api/health
npm run seed              # optional: demo categories, medicines, health tips, seller account
```

**Frontend**

```bash
cd client
npm install
cp .env.example .env
# Keep VITE_API_URL=/api for the local Vite proxy; set VITE_ADMIN_EMAIL to match the server.
npm run dev               # http://localhost:5173
npm run build
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no CORS setup is needed locally. Set `ADMIN_EMAIL` and `VITE_ADMIN_EMAIL` to the same address. Never commit real `.env` files or secret keys.

</details>

---

## Testing

| Command | Location | What it runs |
| --- | --- | --- |
| `npm test` | `client/` | Vitest + Testing Library |
| `npm run lint` | `client/` | ESLint |
| `npm run build` | `client/` | Production bundle in `client/dist` |
| `npm test` | `server/` | `node:test` + Supertest |

Verified locally: `client/` passes 75 tests across 14 files, `server/` passes 33 tests across 11 suites (integration tests use `mongodb-memory-server`, so no local MongoDB installation is required).

---

## Deployment

The two apps deploy independently from the same repository. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full manual guide: the API goes to Render (root directory `server`), the SPA to Vercel (root directory `client`, SPA rewrite from `client/vercel.json`), with MongoDB Atlas, Firebase, Stripe and imgbb configured in each platform's environment-variable UI.

---

## My role

I designed the architecture and folder structure, set up the MERN stack and its integrations (MongoDB Atlas, Firebase, Stripe, imgbb), and used AI tools for automated tests and advanced security hardening.

---

## Roadmap

- Refund flow for paid orders (currently paid orders cannot be cancelled).
- Fulfillment lifecycle: transitions to `shipped` / `delivered` and delivery tracking.
- Build out the seller dashboard (product inventory, order processing, store analytics).
- Customer reviews and ratings, richer full-text search and filtering.
- Saved payment methods / embedded Stripe UI instead of hosted redirect only.
- CI/CD pipeline, structured logging/monitoring, and automated secret scanning.

---

## License

MIT License.

<!-- TODO: no LICENSE file exists yet and server/package.json currently declares "license": "ISC" — add the MIT LICENSE file and align the package metadata before publishing. -->
