/**
 * Shared client-side API contract. These paths and codes mirror the server
 * implementation in server/src/routes and server/src/constants/errorCodes.js.
 * The full contract is documented in docs/API_CONTRACT.md at the repo root.
 */
export const API_ROUTES = Object.freeze({
  health: "/health",
  home: "/home",
  auth: Object.freeze({
    register: "/auth/register",
    login: "/auth/login",
    firebase: "/auth/firebase",
    session: "/auth/firebase",
    me: "/auth/me",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  }),
  users: Object.freeze({
    me: "/users/me",
    profile: "/users/profile",
    orders: "/users/orders",
    order: (id) => `/users/orders/${encodeURIComponent(id)}`,
    cancelOrder: (id) => `/users/orders/${encodeURIComponent(id)}/cancel`,
    payments: "/users/payments",
  }),
  orders: Object.freeze({
    create: "/orders",
    detail: (id) => `/orders/${encodeURIComponent(id)}`,
    invoice: (id) => `/orders/${encodeURIComponent(id)}/invoice`,
  }),
  payments: Object.freeze({
    checkoutSession: "/payments/create-checkout-session",
    webhook: "/payments/webhook",
    detail: (id) => `/payments/${encodeURIComponent(id)}`,
  }),
  categories: Object.freeze({
    list: "/categories",
    detail: (id) => `/categories/${encodeURIComponent(id)}`,
    medicines: (id) => `/categories/${encodeURIComponent(id)}/medicines`,
  }),
  medicines: Object.freeze({
    list: "/medicines",
    detail: (id) => `/medicines/${encodeURIComponent(id)}`,
    featured: "/medicines/featured",
    discounted: "/medicines/discounted",
    advertised: "/medicines/advertised",
  }),
  advertisements: Object.freeze({
    active: "/advertisements/active",
  }),
  healthTips: "/health-tips",
  cart: Object.freeze({
    get: "/cart",
    items: "/cart/items",
    item: (medicineId) => `/cart/items/${encodeURIComponent(medicineId)}`,
    clear: "/cart",
    merge: "/cart/merge",
  }),
});

export const API_ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CAST_ERROR: "CAST_ERROR",
  DUPLICATE_KEY: "DUPLICATE_KEY",
  EMAIL_IN_USE: "EMAIL_IN_USE",
  INVALID_JSON: "INVALID_JSON",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  AUTH_NOT_CONFIGURED: "AUTH_NOT_CONFIGURED",
  PAYMENT_NOT_CONFIGURED: "PAYMENT_NOT_CONFIGURED",
  UPLOAD_NOT_CONFIGURED: "UPLOAD_NOT_CONFIGURED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CORS_NOT_ALLOWED: "CORS_NOT_ALLOWED",
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  ORDER_EMPTY: "ORDER_EMPTY",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  PRESCRIPTION_REQUIRED: "PRESCRIPTION_REQUIRED",
  ORDER_NOT_CANCELLABLE: "ORDER_NOT_CANCELLABLE",
  PAYMENT_NOT_COMPLETED: "PAYMENT_NOT_COMPLETED",
  WEBHOOK_INVALID_SIGNATURE: "WEBHOOK_INVALID_SIGNATURE",
  DUPLICATE_REQUEST: "DUPLICATE_REQUEST",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
});
