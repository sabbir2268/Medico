# Medico

Medico is a full-stack online pharmacy / medicine marketplace. Customers browse a catalog of
medicines and health devices, manage a cart, place orders, and pay through Stripe. Sellers can list
medicines, and a single allow-listed administrator account moderates the catalog, users, orders,
payments, advertisements, health tips, and sales reports.

The repository contains two independent applications:

| Directory | What it is | Runs on |
| --- | --- | --- |
| [`client/`](./client/README.md) | React storefront + dashboards (Vite SPA) | Vercel in production, `localhost:5173` in development |
| [`server/`](./server/README.md) | Express REST API + MongoDB | Render in production, `localhost:5000` in development |

Supporting documentation:

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — manual production deployment guide for Vercel, Render, MongoDB Atlas, Firebase, Stripe, and imgbb.

The request/response contract is mirrored in `client/src/constants/api.js` and
`server/src/constants/errorCodes.js`, and enforced by the Zod validators in `server/src/validators/`.

---

## How it works

```
Browser (React SPA)
        │
        │  /api requests (Bearer <access token>)
        ▼
Vite dev proxy (localhost:5173 → localhost:5000)   ── development
Vercel SPA                                        ── production
        │
        ▼
Express API (/api)  ──► MongoDB Atlas  (users, medicines, categories, carts, orders, payments, …)
        │
        ├── Firebase Admin  → verifies Firebase ID tokens
        ├── Stripe         → Checkout Sessions + signed webhooks (payment truth)
        └── imgbb/Cloudinary → server-side image hosting
```

1. **Sign-in.** The client either signs in with Firebase (Google/GitHub/email) and exchanges the
   Firebase ID token at `POST /api/auth/firebase`, or uses native email/password via
   `POST /api/auth/register` / `/login` when `VITE_AUTH_MODE=backend`.
2. **Session.** The server returns a short-lived JWT access token plus a refresh token. The client
   attaches the access token to every request and refreshes it once on a 401. Logout bumps the
   user's `tokenVersion`, invalidating all previously issued tokens.
3. **Authorization.** Tokens carry no roles. On every request the API loads the account from MongoDB
   and derives the effective role. Admin access is granted only to the single configured
   `ADMIN_EMAIL`; registration can never create an admin.
4. **Pricing.** All prices, discounts, delivery charges, and totals are computed on the server from
   trusted database values. The client never sends a price, role, seller, or total.
5. **Checkout.** An order is created from the server-side cart with an idempotency key; stock is
   decremented atomically, prescription details are required for restricted medicines, and the cart
   is cleared. Payment is completed through a hosted Stripe Checkout page. Only a signature-verified
   Stripe webhook marks the order as paid; the browser redirect is never trusted.
6. **Storefront data.** The home page aggregates advertisements, categories, featured/discounted/
   advertised medicines, and health tips. Public listings only show approved, in-stock medicines in
   active categories. Optional fallback data exists for local UI development
   (`VITE_USE_FALLBACK_DATA=true`).

---

## Tech stack

### Client (`client/`)

- React 19 + Vite 8 (JavaScript/JSX, no TypeScript), React Router 7
- TanStack Query 5 for server state, Zod 4 + React Hook Form for forms/validation
- Tailwind CSS 4, lucide-react icons, Swiper, Recharts, Sonner toasts
- Firebase Web SDK, axios, date utilities via `Intl`
- Vitest + Testing Library + jsdom, ESLint, Prettier

### Server (`server/`)

- Node.js + Express 5 (ES modules), Mongoose 9 + MongoDB Atlas
- Zod 4 request validation, JWT access/refresh tokens, bcryptjs
- Firebase Admin SDK, Stripe (Checkout + webhooks), imgbb with Cloudinary fallback
- Helmet, CORS allow-list, express-rate-limit, Morgan
- pdfkit for invoices and sales reports, multer for image uploads
- `node:test` + Supertest for tests, nodemon for development

---

## Features implemented

**Storefront**

- Home page with hero slider, active advertisements, categories, featured and discounted medicines,
  health tips, and a trust strip
- Shop/catalog with search, category filtering, sorting, price filters, and pagination
- Category and "deals" pages, medicine detail modal, about and 404/error pages

**Accounts & access**

- Firebase and native email/password authentication, social sign-in buttons
- Refresh-token rotation and token-version invalidation on logout
- Role-scoped routes for customers, sellers, and the allow-listed admin

**Cart, checkout & payments**

- Server-side cart with stock/availability validation and guest-cart merge after login
- Checkout with delivery details, prescription requirements, and idempotent order creation
- Hosted Stripe Checkout and signature-verified webhook handling; payment/order status history
- Downloadable PDF invoices built from immutable order snapshots
- Order cancellation for unpaid orders with one-time stock restoration

**Dashboards & administration**

- Customer dashboard: profile, security, orders, order details, and payment history
- Seller home (placeholder for future seller tools) and seller-scoped medicine creation
- Admin: overview + analytics, user/seller management, category and medicine moderation,
  orders/payments review, JSON/CSV/PDF sales reports, advertisement review, health-tip CRUD,
  and audit logs of sensitive actions
- Aggregated `/api/home` endpoint and a `/api/health` endpoint reporting integration readiness

---

## Installation and local development

Requires Node.js **20.19+** (22.x recommended) and npm.

```bash
git clone <repository-url>
cd Medico
```

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# Fill in MONGODB_URI, JWT secrets, ADMIN_EMAIL; Firebase/Stripe/imgbb are optional locally.
npm run dev               # http://localhost:5000/api/health
npm run seed              # optional: demo categories, medicines, health tips, seller account
npm test
```

**2. Frontend**

```bash
cd client
npm install
cp .env.example .env
# Keep VITE_API_URL=/api for the local Vite proxy; set VITE_ADMIN_EMAIL to match the server.
npm run dev               # http://localhost:5173
npm test
npm run build
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no CORS setup is needed locally.

**Demo seller account (after seeding):** `seller@medico.test` / `Seller@123`.
No admin is seeded — register with the `ADMIN_EMAIL` address to gain admin access.

See the [client README](./client/README.md) and [server README](./server/README.md) for
app-specific details, and `.env.example` files for every supported variable. Never commit real
`.env` files or secret keys.

---

## Testing

| Command | Location | Result |
| --- | --- | --- |
| `npm test` | `client/` | 67 tests across 13 files |
| `npm run lint` | `client/` | ESLint |
| `npm run build` | `client/` | Production bundle in `client/dist` |
| `npm test` | `server/` | 33 tests across 11 suites (uses in-memory test databases) |

---

## Deployment

Both apps deploy independently from the same repository. See [`DEPLOYMENT.md`](./DEPLOYMENT.md)
for the complete manual guide. In short: the API goes to Render (root directory `server`), the SPA
to Vercel (root directory `client`, SPA rewrite from `client/vercel.json`), with MongoDB Atlas,
Firebase, Stripe, and imgbb configured through each platform's environment-variable UI.

---

## Future work

- Refund flow for paid orders (currently paid orders cannot be cancelled).
- Fulfillment lifecycle: transitions to `shipped` / `delivered` and delivery tracking.
- Build out the seller dashboard (product inventory, order processing, store analytics).
- Customer reviews and ratings, richer full-text search and filtering.
- Saved payment methods / embedded Stripe UI instead of hosted redirect only.
- CI/CD pipeline, structured logging/monitoring, and automated secret scanning.

---

## License

No license has been specified yet. Contact the project owner before reuse or redistribution.
