const rawEnv = import.meta.env;

function readString(key, fallback) {
  const value = rawEnv[key];

  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  return fallback;
}

function readPositiveNumber(key, fallback) {
  const value = Number(readString(key, String(fallback)));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number.`);
  }

  return value;
}

function readBoolean(key, fallback) {
  const value = readString(key, String(fallback)).toLowerCase();

  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;

  return fallback;
}

const apiUrl = readString("VITE_API_URL", "/api");

if (!apiUrl) {
  throw new Error("VITE_API_URL must be a non-empty string.");
}

// The Vite dev proxy only exists in `vite dev`. In a production build a
// relative or localhost URL would send API calls to the frontend host.
if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  throw new Error(
    "VITE_API_URL must point to the deployed backend in production (no localhost).",
  );
}
if (import.meta.env.PROD && apiUrl.startsWith("/")) {
  console.warn(
    "VITE_API_URL is relative. In production set it to the full backend URL including /api.",
  );
}

export const env = {
  VITE_APP_NAME: readString("VITE_APP_NAME", "Medico"),
  VITE_API_URL: apiUrl,
  VITE_API_TIMEOUT: readPositiveNumber("VITE_API_TIMEOUT", 15000),
  VITE_USE_FALLBACK_DATA: readBoolean("VITE_USE_FALLBACK_DATA", false),
  // The single account allowed into the admin dashboard (compared case-insensitively).
  VITE_ADMIN_EMAIL: readString("VITE_ADMIN_EMAIL", "").toLowerCase(),
  // "firebase" keeps Firebase in charge of email/password; "backend" uses
  // POST /api/auth/register and /api/auth/login with bcrypt hashes.
  VITE_AUTH_MODE: readString("VITE_AUTH_MODE", "firebase"),
  VITE_FIREBASE_API_KEY: readString("VITE_FIREBASE_API_KEY"),
  VITE_FIREBASE_AUTH_DOMAIN: readString("VITE_FIREBASE_AUTH_DOMAIN"),
  VITE_FIREBASE_PROJECT_ID: readString("VITE_FIREBASE_PROJECT_ID"),
  VITE_FIREBASE_STORAGE_BUCKET: readString("VITE_FIREBASE_STORAGE_BUCKET"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: readString("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  VITE_FIREBASE_APP_ID: readString("VITE_FIREBASE_APP_ID"),
  VITE_FIREBASE_MEASUREMENT_ID: readString("VITE_FIREBASE_MEASUREMENT_ID"),

  // When true, roles come only from the local profile (display purposes).
  // In production keep this false so the backend is the source of truth.
  VITE_ALLOW_FIREBASE_ONLY_AUTH: readBoolean("VITE_ALLOW_FIREBASE_ONLY_AUTH", false),

  // Canonical Stripe publishable key; VITE_PAYMENT_KEY is a legacy alias.
  VITE_STRIPE_PUBLISHABLE_KEY: readString(
    "VITE_STRIPE_PUBLISHABLE_KEY",
    readString("VITE_PAYMENT_KEY"),
  ),
  VITE_CLOUDINARY_CLOUD_NAME: readString("VITE_CLOUDINARY_CLOUD_NAME"),

  // Legacy variables kept readable so existing .env files keep working.
  VITE_PAYMENT_KEY: readString("VITE_PAYMENT_KEY"),
  VITE_IMAGE_UPLOAD_KEY: readString("VITE_IMAGE_UPLOAD_KEY"),
};

const firebaseKeys = [
  env.VITE_FIREBASE_API_KEY,
  env.VITE_FIREBASE_AUTH_DOMAIN,
  env.VITE_FIREBASE_PROJECT_ID,
  env.VITE_FIREBASE_APP_ID,
];

const configuredFirebaseKeys = firebaseKeys.filter(Boolean).length;

if (configuredFirebaseKeys > 0 && configuredFirebaseKeys < firebaseKeys.length) {
  console.warn("Firebase configuration is incomplete. Firebase will remain disabled.");
}

export const isFirebaseConfigured = configuredFirebaseKeys === firebaseKeys.length;
export const isStripeConfigured = Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY);
