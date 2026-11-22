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
`iss`, `aud`, `exp`. Roles are **not** stored in tokens; middleware loads the role
from MongoDB on every request.

### Roles

| Role | Frontend routes | Backend access |
| --- | --- | --- |
| `user` | `/dashboard` | Cart, own profile |
| `seller` | `/dashboard/seller` | Seller routes + user access |
| `admin` | `/dashboard/admin` | All routes |

Role requests are limited to `user` and `seller` by the registration Zod schema.
Admin is assigned only in the database. Social accounts always default to `user`.

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

## Security rules

- Never trust `role`, `price`, `discount`, `seller` or totals from a request body.
- Never return `passwordHash`, JWT secrets or Firebase private keys.
- Every error body uses the envelope above; 5xx stacks appear only in development.
- Auth endpoints and the whole `/api` mount have separate rate limiters.
- CORS is explicit-origin only in production; `trust proxy` is enabled for correct
  client IP resolution behind one proxy.

## Seeding

`npm run seed` in `server/` creates 10 categories, 6 health tips, a seller account
(`seller@medico.test` / `Seller@123`), an admin account
(`admin@medico.test` / `Admin@123`) and 16 medicines. It is idempotent and intended
for development only.
