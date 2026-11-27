# Medico — Server

The Express REST API for Medico. It owns all persistent data, authentication, pricing, order and
payment truth, moderation, and reporting. The [client](../client/README.md) consumes it through the
contract defined in `src/routes/`, `src/validators/`, and `src/constants/errorCodes.js`.

---

## Stack

| Concern | Choice |
| --- | --- |
| Runtime / framework | Node.js ES modules, Express 5, `node:http` with graceful shutdown |
| Database | MongoDB Atlas via Mongoose 9 |
| Validation | Zod 4 schemas bound to routes through a `validate` middleware |
| Authentication | Firebase Admin SDK + short-lived JWT access/refresh tokens, bcryptjs |
| Payments | Stripe Checkout Sessions + signature-verified webhooks |
| Images | multer → imgbb (primary) with Cloudinary fallback, server-side only |
| Security | Helmet, explicit CORS allow-list, express-rate-limit, Morgan, `trust proxy` |
| Documents | pdfkit for invoices and CSV/PDF sales reports |
| Tests | `node:test` + Supertest (33 tests), nodemon for development |

---

## API surface

All endpoints are mounted under `/api`. Every error uses the shared
`{ success, message, code?, errors?, data? }` envelope.

| Group | Highlights |
| --- | --- |
| `/api/health` | Readiness plus integration flags (Firebase Admin, Stripe, imgbb/Cloudinary) |
| `/api/auth` | Register, login, Firebase token exchange, refresh, `me`, logout (token-version invalidation) |
| `/api/users` | Profile updates, order/payment history, order detail, unpaid-order cancellation |
| `/api/home`, `/api/categories`, `/api/medicines`, `/api/health-tips`, `/api/advertisements` | Public storefront reads, filtering/sorting/pagination; seller-only medicine create/update/delete |
| `/api/cart` | Authenticated server-side cart, stock validation, guest-cart merge |
| `/api/orders`, `/api/payments` | Idempotent checkout, PDF invoices, Stripe session creation, verified webhook, payment lookup |
| `/api/uploads` | Signed server-side image upload |
| `/api/admin` | Dashboard + analytics, user/seller/category/medicine moderation, order/payment review, sales reports, advertisement and health-tip management, audit logs |

Sensitive routes require `requireAdmin`, `requireSeller`, or a plain Bearer token. Public listings
hide anything not approved, in stock, and in an active category.

---

## Project structure

```
server/
├── index.js                 # DB connect, HTTP server, graceful shutdown
├── src/
│   ├── app.js               # middleware + /api mount + error handlers
│   ├── config/              # env, database, cors, rate limiter, jwt, firebase, stripe, imgbb, cloudinary
│   ├── constants/           # roles and machine-readable error codes
│   ├── controllers/         # thin HTTP handlers
│   ├── middleware/          # authenticate, authorize, validate, ownership, 404, error handler
│   ├── models/              # Mongoose schemas: User, Medicine, Category, Cart, Order, Payment,
│   │                        #   Advertisement, HealthTip, AuditLog
│   ├── routes/              # one router per resource, mounted in routes/index.js
│   ├── services/            # business logic: catalog, cart, order, payment, admin, seller-facing
│   │                        #   helpers, invoice, report, upload, audit, token, user
│   ├── utils/               # API envelopes, ApiError, asyncHandler, pagination, sanitizers, logger
│   ├── validators/          # Zod schemas per resource
│   └── scripts/             # seed.js and cleanupUsers.js
└── test/                    # integration and unit tests
```

Controllers stay thin; business rules live in services. Validation happens before the handler via
`req.validated`. Errors are thrown as `ApiError` and normalized by one central error handler.

---

## Getting started (from this directory)

```bash
npm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
npm run dev                 # http://localhost:5000/api/health
npm test
```

At minimum set `MONGODB_URI`, two distinct JWT secrets, and `ADMIN_EMAIL`. Firebase Admin, Stripe,
and imgbb/Cloudinary are **lazily initialized**: routes that need them return `503` with a
configuration error code until their variables are set. In development the server still starts if
MongoDB is unavailable, but `/api/health` will report the database as down.

| Script | Purpose |
| --- | --- |
| `npm start` | Start the server (`node index.js`) |
| `npm run dev` | Start with nodemon |
| `npm run seed` | Idempotent demo data: 10 categories, 6 health tips, 16 medicines, one seller |
| `npm run cleanup:users` | Maintenance script for stale users |
| `npm test` | `node --test` (uses in-memory MongoDB test servers) |

Demo seller: `seller@medico.test` / `Seller@123`. No admin is seeded: register with the
`ADMIN_EMAIL` address and that account is promoted to admin on every request.

---

## Environment variables

See [`.env.example`](./.env.example) for the complete, commented list.

| Variable | Notes |
| --- | --- |
| `NODE_ENV`, `PORT` | `production` and an injected port on Render; `PORT=5000` locally |
| `MONGODB_URI`, `MONGO_SERVER_SELECTION_TIMEOUT_MS` | Atlas connection string and timeout |
| `CORS_ORIGIN` | Comma-separated exact origins; `*` is forbidden in production |
| `MORGAN_FORMAT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Logging and global `/api` rate limit |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_*_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE` | Signing and claim configuration; secrets must differ |
| `ADMIN_EMAIL` | The only address with admin access; must equal the client's `VITE_ADMIN_EMAIL` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Service account for verifying ID tokens (keep `\n` escapes) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` | Checkout + the only source of payment truth; redirect URLs must not be localhost in production |
| `IMGBB_API_KEY` | Primary image host; never expose to the client |
| `CLOUDINARY_*` | Optional fallback when imgbb is unconfigured or fails |

Never commit real `.env` files or secret keys.

---

## Security model

- Roles are **not** stored in JWTs. Each request loads the user and derives the effective role;
  admin comes only from the `ADMIN_EMAIL` allowlist.
- Tokens carry `sub`, `uid`, `ver` (tokenVersion), `type`, issuer/audience and expiry. Logout bumps
  `tokenVersion`, invalidating all earlier tokens; blocked/deleted users are rejected too.
- Clients may never submit `role`, `price`, `discount`, `seller`, or totals — the server recomputes
  them from the database.
- Passwords are hashed with bcryptjs; `passwordHash`, JWT secrets, and Firebase private keys are
  never returned.
- Order creation is idempotent by key, decrements stock atomically, and restores it exactly once on
  cancellation. Only a verified Stripe webhook can mark a payment/order as paid.
- Sensitive admin actions are written to `AuditLog` with admin id, IP, and user agent. Admin cannot
  modify itself or remove the last active admin; user deletion is soft so history is preserved.

---

## Tests

```bash
npm test    # 33 passing tests across 11 suites
```

Coverage includes admin authorization and moderation, auth token flows, catalog ownership rules,
cart stock validation, checkout idempotency/prescription/cancellation, PDF invoices, Stripe webhook
signature verification and duplicate-event handling, and helper utilities.
