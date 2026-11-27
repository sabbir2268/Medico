# Medico — Client

The React single-page application for Medico: the public storefront, authentication pages, customer
dashboard, seller home, and administrator dashboard. It talks to the [server](../server/README.md)
through the shared `/api` contract mirrored in `src/constants/api.js`.

---

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19, JSX, Vite 8 |
| Routing | React Router 7 with nested layouts and role guards |
| Server state | TanStack Query 5 (caching, retries, query keys per feature) |
| Forms & validation | React Hook Form + Zod 4 |
| HTTP | axios with a shared client, interceptors for auth and one-shot token refresh |
| Styling | Tailwind CSS 4, class-variance-authority, `clsx` + `tailwind-merge` |
| UI extras | lucide-react, Swiper (hero), Recharts (admin analytics), Sonner (toasts) |
| Auth | Firebase Web SDK or native email/password (`VITE_AUTH_MODE`) |
| Payments | Hosted Stripe Checkout via backend redirect (no card data handled here) |
| Tests / tooling | Vitest, Testing Library, jsdom, ESLint, Prettier |

Requires Node.js **20.19+** (22.x recommended).

---

## Features

- **Public storefront** — home (`/`), shop (`/shop`), deals (`/deals`), categories
  (`/categories`, `/categories/:categoryId`), about (`/about`), cart (`/cart`), and checkout
  (`/checkout`) with Stripe return pages (`/payments/success|failure|cancel`).
- **Catalog UX** — search, category/sort/price filters, pagination, medicine detail modal,
  skeleton loaders, and a fallback demo catalog for local development.
- **Authentication** — login, registration (customer or seller), password reset, Firebase social
  buttons, profile editing, and a security page. Guest carts merge into the server cart after login.
- **Role-based routing** — `PrivateRoute`, `PublicRoute`, and `RoleRoute` guard `/dashboard`,
  `/dashboard/seller`, and `/dashboard/admin`.
- **Customer dashboard** — account summary, orders + order details, payment history, profile,
  and security.
- **Admin dashboard** — overview/analytics, users, sellers, categories, medicines, orders,
  payments, sales reports (JSON/CSV/PDF), advertisements, health tips, and audit logs.

---

## Project structure

```
client/src/
├── main.jsx                 # entry point; mounts AppProviders and RouterProvider
├── app/                     # route map, layouts (Public/Auth/Dashboard), providers, ScrollToTop
├── routes/                  # PrivateRoute, PublicRoute, RoleRoute
├── components/              # common (Navbar/Footer), shared (cards/states), ui primitives
├── config/                  # env parsing, Firebase init, site metadata
├── constants/               # API routes/codes and roles (shared contract mirrors)
├── context/                 # auth context + AuthProvider
├── features/                # one folder per domain: home, shop, cart, checkout, auth,
│                            #   dashboard, admin, about — each with pages/hooks/services/
├── lib/                     # api client, error normalization, formatting helpers
├── pages/                   # NotFound and error boundary page
├── styles/                  # global CSS / Tailwind entry
└── test/                    # Vitest setup
```

Each feature owns its pages, hooks, services, constants, and tests. Feature services import the
shared `apiClient` from `@/lib/api`; no feature talks to axios directly.

---

## Getting started (from this directory)

```bash
npm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
```

In development, Vite proxies `/api` to `http://localhost:5000`, so the local API can be reached
without CORS configuration. Set `VITE_API_URL=/api` and keep `VITE_USE_FALLBACK_DATA=false`
unless you specifically want demo data when the API is unavailable.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Vitest (single run); `npm run test:watch` for watch mode |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |

---

## Environment variables

All client variables are prefixed `VITE_` and baked into the bundle at **build time**. After
changing one, rebuild/redeploy. See [`.env.example`](./.env.example) for the full list.

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | `/api` locally; in production the full backend URL **including** `/api` |
| `VITE_API_TIMEOUT` | Request timeout in ms (default 15000) |
| `VITE_USE_FALLBACK_DATA` | Use bundled demo data on API errors; keep `false` in production |
| `VITE_AUTH_MODE` | `firebase` (default) or `backend` (native register/login) |
| `VITE_ADMIN_EMAIL` | Must match the server's `ADMIN_EMAIL`; only this account sees admin routes |
| `VITE_APP_NAME` | Display name |
| `VITE_FIREBASE_*` | Public web config; required for Firebase/social sign-in |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public key; payments themselves happen on the server |
| `VITE_ALLOW_FIREBASE_ONLY_AUTH`, `VITE_PAYMENT_KEY`, `VITE_IMAGE_UPLOAD_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_FIREBASE_MEASUREMENT_ID` | Legacy/optional values kept for compatibility; not used by the current flows |

Never put secret keys (`sk_`, `whsec_`, Firebase private keys, MongoDB URIs) in `VITE_*` variables —
they would be visible in the browser bundle.

---

## Architecture notes

- **Auth state** lives in `AuthProvider`; tokens are stored locally and a getter is injected into
  the axios client. A response interceptor retries once after `POST /api/auth/refresh`.
- **Server state** is cached with TanStack Query. Query keys are defined per feature
  (e.g. `homeKeys`, `shopQueryKeys`) so invalidation stays predictable.
- **Roles** are display guards only: the client reads the role from the profile; the server is the
  authority and re-derives it on every request.
- **Error handling** normalizes API responses into `ApiError` and surfaces messages through toasts
  and shared `AsyncContent` / `StatePanel` components, plus an `ErrorBoundary` at the route root.
- `spa` routing uses a single catch-all; `client/vercel.json` rewrites deep links to `index.html`.

---

## Tests

```bash
npm test        # 67 passing tests across 13 files
npm run lint
```

Tests cover route guards and admin pages, auth schemas/services, cart/shop services, the API client
interceptors, and shared UI primitives.
