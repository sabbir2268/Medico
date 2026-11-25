# Medico shared API contract

Both apps use this contract. Client constants live in `client/src/constants/api.js`;
server routes live in `server/src/routes/` and error codes in
`server/src/constants/errorCodes.js`.

## Base URL

- Development: `/api` (Vite proxies to `http://localhost:5000`).
- Production: `VITE_API_URL` must point at the deployed API including `/api`.

All request and response bodies are JSON. Authentication uses
`Authorization: Bearer <token>`.

## Response envelopes

Success:

```json
{
  "success": true,
  "message": "Medicine retrieved.",
  "data": { "medicine": { } },
  "meta": { }
}
```

`meta` is optional. Paginated lists place `items` and `pagination` inside `data`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR",
  "errors": { "email": "Enter a valid email address." }
}
```

`code`, `errors`, `data` and `stack` (development only, 5xx only) are optional.
The client normalizer copies `code` and `errors` onto `ApiError`.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | Read or mutation succeeded |
| 201 | Resource created (register, create medicine) |
| 400 | Validation / bad input (`VALIDATION_ERROR`, `CAST_ERROR`, `INVALID_JSON`) |
| 401 | Missing, expired or invalid token; bad credentials |
| 403 | Authenticated but not permitted (`FORBIDDEN`) |
| 404 | Resource not found or unavailable |
| 409 | Duplicate email / username |
| 429 | Rate limited (`RATE_LIMIT_EXCEEDED`) |
| 503 | Required integration not configured (`AUTH_NOT_CONFIGURED`) |

## Authentication contract

### Token flow

1. Firebase signs the user in on the client (or native email/password is used when
   `VITE_AUTH_MODE=backend`).
2. `POST /api/auth/firebase` exchanges the Firebase ID token for a backend JWT pair.
   Native accounts get the same pair from `POST /api/auth/register` or `/login`.
3. Every authenticated request carries the short-lived backend access token.
4. On 401, the client calls `POST /api/auth/refresh` once with the refresh token.
5. `POST /api/auth/logout` increments the user's `tokenVersion`, invalidating all
   previously issued access and refresh tokens.

JWT claims: `sub` (user id), `uid` (Firebase uid), `ver` (tokenVersion), `type`,
`iss`, `aud`, `exp`. Roles are **not** stored in tokens; middleware loads the account
from MongoDB on every request and derives the effective admin role from the
`ADMIN_EMAIL` allowlist.

### Roles

| Role | Frontend routes | Backend access |
| --- | --- | --- |
| `user` | `/dashboard` | Cart, own profile |
| `seller` | `/dashboard/seller` | Seller routes + user access |
| `admin` | `/dashboard/admin` | All routes |

Role requests are limited to `user` and `seller` by the registration Zod schema.
Admin is never assigned by registration, by the admin API, or by a Firebase claim:
it is granted only to the single `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` address at login.
The account is stored in MongoDB with the `user` role and promoted in memory per
request. Social accounts always default to `user` (the allowlisted email is promoted
when it signs in).

### Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `{ username, email, password, photoURL?, role? }` → 201 + session |
| POST | `/api/auth/login` | public | `{ email, password }` → session |
| POST | `/api/auth/firebase` | public | `{ idToken }` → session; requires Firebase Admin config |
| POST | `/api/auth/refresh` | public | `{ refreshToken }` → session |
| GET | `/api/auth/me` | Bearer | → `{ user }` |
| POST | `/api/auth/logout` | Bearer | invalidates all tokens |
| PATCH | `/api/users/profile` | Bearer | `{ username?, email?, photoURL? }`; role is ignored |

Session payload: `{ user, accessToken, refreshToken, tokenType, expiresIn }`.
`expiresIn` is the access-token lifetime in seconds.

### Auth examples

```http
POST /api/auth/register
Content-Type: application/json

{ "username": "Asha", "email": "asha@example.com", "password": "StrongPass1", "role": "seller" }
```

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": { "id": "…", "username": "Asha", "email": "asha@example.com", "role": "seller" },
    "accessToken": "eyJ…",
    "refreshToken": "eyJ…",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

## Homepage / catalog endpoints

| Method | Path | Query | Notes |
| --- | --- | --- | --- |
| GET | `/api/home` | — | Aggregated: advertisements, categories, discounted/featured/advertised medicines, health tips |
| GET | `/api/advertisements/active` | `limit` | Active ads only, date window enforced |
| GET | `/api/categories` | `active=true`, `limit` | `data.items` |
| GET | `/api/categories/:id` | — | `data.category` |
| GET | `/api/categories/:id/medicines` | catalog query | Paginated |
| GET | `/api/medicines` | `search`, `category`, `sort`, `page`, `limit`, `minPrice`, `maxPrice` | Paginated |
| GET | `/api/medicines/featured` | `limit` | `data.items` |
| GET | `/api/medicines/discounted` | `limit` | `data.items` |
| GET | `/api/medicines/advertised` | `limit` | `data.items` |
| GET | `/api/medicines/:id` | — | `data.medicine` |
| GET | `/api/health-tips` | `limit` | `data.items` |

Sort values: `price`, `-price`, `-discountPercent`, `name`.
`category` accepts a category id or slug. `search` matches name, generic name and
manufacturer. Public listings always require `status=active`, `stock > 0` and an
active category.

`price` in a medicine payload is the **server-computed discounted price**;
`originalPrice` is the database base price and `discountPercent` is the trusted
database value.

Seller/admin management (protected):

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/medicines` | Seller-only; `seller` is set from the token, never from the body |
| PATCH | `/api/medicines/:id` | Seller owns the listing or admin |
| DELETE | `/api/medicines/:id` | Soft delete (`status=inactive`) |

## Cart endpoints

All cart routes require a Bearer token and are scoped to `req.user._id`.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/api/cart` | — | → `{ cart }` |
| POST | `/api/cart/items` | `{ medicineId, quantity }` | Duplicate medicines merge quantities |
| PATCH | `/api/cart/items/:medicineId` | `{ quantity }` | Stock-validated |
| DELETE | `/api/cart/items/:medicineId` | — | Removes one line |
| DELETE | `/api/cart` | — | Clears the cart |
| POST | `/api/cart/merge` | `{ items: [{ medicineId, quantity }] }` | Guest-cart merge after login |

Cart response:

```json
{
  "success": true,
  "message": "Cart retrieved.",
  "data": {
    "cart": {
      "id": "…",
      "items": [
        {
          "medicineId": "…",
          "medicine": { "id": "…", "name": "…", "price": 75, "originalPrice": 100 },
          "quantity": 2,
          "unitPrice": 75,
          "lineTotal": 150,
          "lineSavings": 50,
          "availableStock": 8
        }
      ],
      "itemCount": 2,
      "subtotal": 200,
      "discount": 50,
      "deliveryCharge": 60,
      "total": 210,
      "freeDeliveryThreshold": 1000
    }
  }
}
```

No price, discount or total is accepted from the client. Lines whose medicine became
unavailable are dropped from the response rather than charged.

## Checkout, payments and dashboard endpoints

All of these require `Authorization: Bearer <accessToken>` except the Stripe
webhook.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/orders` | Creates an order from the server-side cart; snapshots items, decrements stock, clears cart |
| GET | `/api/orders/:id` | Order owned by the authenticated user |
| GET | `/api/orders/:id/invoice` | PDF invoice built from immutable order snapshots |
| POST | `/api/payments/create-checkout-session` | Creates a real Stripe Checkout session; returns `checkoutUrl` |
| POST | `/api/payments/webhook` | Public, Stripe-signature-verified; the only source of payment truth |
| GET | `/api/payments/:id` | By payment id, Stripe session id, or order id; owned by the user |
| GET | `/api/users/me` | Account summary |
| PATCH | `/api/users/profile` | `username`, `email`, `phone`, `photoURL`, `address`, `addressLine1`… |
| GET | `/api/users/orders` | Paginated: `page`, `limit`, optional `status` |
| GET | `/api/users/orders/:id` | Owned order detail |
| POST | `/api/users/orders/:id/cancel` | Unpaid orders only; restores stock once |
| GET | `/api/users/payments` | Paginated payment history |

### Order creation

```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "idempotencyKey": "a-uuid-stable-across-retries",
  "delivery": {
    "fullName": "Asha Rahman",
    "phone": "+8801712345678",
    "addressLine1": "12 Green Road",
    "addressLine2": "Flat 3B",
    "city": "Dhaka",
    "postalCode": "1205",
    "country": "Bangladesh",
    "instructions": "Leave at the door"
  },
  "prescription": {
    "prescriberName": "Dr. Smith",
    "prescriptionNumber": "RX-12345"
  }
}
```

`prescription` is mandatory when any cart item has `prescriptionRequired: true`.
Missing it returns `400 PRESCRIPTION_REQUIRED`. No price, discount, seller,
total or user id is accepted from the client.

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "order": {
      "id": "…",
      "orderNumber": "MD-ABC12345",
      "items": [{ "name": "Paracetamol 500mg", "unitPrice": 15.3, "quantity": 2, "lineTotal": 30.6 }],
      "pricing": { "subtotal": 36, "discount": 5.4, "deliveryCharge": 60, "total": 90.6 },
      "status": "pending",
      "paymentStatus": "pending",
      "prescription": { "required": false, "status": "not_required" }
    }
  }
}
```

Repeating the same `idempotencyKey` returns the same order instead of creating a
duplicate. Stock is decremented atomically and rolled back if the order cannot
be written. Cancelling an unpaid order restores stock exactly once.

### Stripe Checkout and webhook

`POST /api/payments/create-checkout-session` with `{ "orderId": "…" }` returns
`data.payment.checkoutUrl`. Redirect the browser there. Stripe redirects back to
`STRIPE_SUCCESS_URL` or `STRIPE_CANCEL_URL`; the client must call
`GET /api/payments/:id` with the `session_id` rather than trusting the redirect.

Configure a webhook endpoint pointing at `https://your-api/api/payments/webhook`
with events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Set `STRIPE_WEBHOOK_SECRET` to the endpoint's signing secret. Use
`stripe listen --forward-to localhost:5000/api/payments/webhook` locally. Invalid
signatures return `400 WEBHOOK_INVALID_SIGNATURE`. Only verified events update
`Payment.status`, `Order.paymentStatus` and `Order.status`. Duplicate event ids
are ignored.

### Cancellation rules

Only orders with status `pending` or `processing` **and** `paymentStatus !== paid`
may be cancelled. Paid orders require a refund flow (not yet implemented) and
return `409 ORDER_NOT_CANCELLABLE`.

## Admin endpoints

All admin endpoints require a verified `admin` role; non-admins receive `403 FORBIDDEN`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Revenue, orders, users, sellers, medicines, pending approvals |
| GET | `/api/admin/analytics` | `from`, `to`; daily revenue/orders from verified payments |
| GET | `/api/admin/users` | `page`, `limit`, `search`, `role`, `status` |
| PATCH | `/api/admin/users/:id/role` | `{ role }` |
| PATCH | `/api/admin/users/:id/status` | `{ isActive }`; blocks token version |
| DELETE | `/api/admin/users/:id` | Soft delete; order/payment history preserved |
| GET | `/api/admin/sellers` | `page`, `limit`, `search`, `status` |
| PATCH | `/api/admin/sellers/:id/status` | `{ sellerStatus, reason? }` |
| GET | `/api/admin/categories` | `page`, `limit`, `search` |
| POST | `/api/admin/categories` | `{ name, slug?, description?, isActive? }` |
| PATCH | `/api/admin/categories/:id` | Partial update (no default resets) |
| DELETE | `/api/admin/categories/:id` | `409 CATEGORY_IN_USE` when medicines reference it |
| GET | `/api/admin/medicines` | `page`, `limit`, `search`, `status` |
| PATCH | `/api/admin/medicines/:id/status` | `{ status: approved|hidden|inactive|active|rejected, reason? }` |
| GET | `/api/admin/orders` | `page`, `limit`, `search`, `status`, `from`, `to` |
| GET | `/api/admin/payments` | `page`, `limit`, `status`, `from`, `to` |
| GET | `/api/admin/reports/sales` | `from`, `to`, `format=json|csv|pdf` |
| GET | `/api/admin/advertisements` | All ads with review status |
| PATCH | `/api/admin/advertisements/:id/status` | `{ status, reason? }`; reason required for rejection |
| GET | `/api/admin/health-tips` | `page`, `limit`, `search` |
| POST/PATCH/DELETE | `/api/admin/health-tips[/:id]` | Tip CRUD |
| GET | `/api/admin/audit-logs` | `page`, `limit` |

Sensitive actions (role/status changes, approvals, category/medicines/tip changes,
user removal) are written to `AuditLog` with admin id, IP and user agent.

Protections:
- role changes and self-block/self-delete return `400 CANNOT_MODIFY_SELF`;
- demoting/blocking/deleting the last active admin returns `409 LAST_ADMIN`;
- user deletion is soft, so historical orders and payments are never removed;
- public ads require `status: approved`, and public medicines require
  `isApproved: true` and `isHidden !== true`.

## Security rules

- Never trust `role`, `price`, `discount`, `seller` or totals from a request body.
- Never return `passwordHash`, JWT secrets or Firebase private keys.
- Every error body uses the envelope above; 5xx stacks appear only in development.
- Auth endpoints and the whole `/api` mount have separate rate limiters.
- CORS is explicit-origin only in production; `trust proxy` is enabled for correct
  client IP resolution behind one proxy.

## Seeding

`npm run seed` in `server/` creates 10 categories, 6 health tips, a seller account
(`seller@medico.test` / `Seller@123`) and 16 medicines. It is idempotent and intended
for development only. No admin account is seeded: the admin registers through the
normal `/api/auth/register` endpoint using the `ADMIN_EMAIL` address, and that email
allowlist is the only source of admin access (client and API).
