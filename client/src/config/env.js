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

export const env = {
  VITE_APP_NAME: readString("VITE_APP_NAME", "Medico"),
  VITE_API_URL: apiUrl,
  VITE_API_TIMEOUT: readPositiveNumber("VITE_API_TIMEOUT", 15000),
  VITE_USE_FALLBACK_DATA: readBoolean("VITE_USE_FALLBACK_DATA", true),
  VITE_FIREBASE_API_KEY: readString("VITE_FIREBASE_API_KEY"),
  VITE_FIREBASE_AUTH_DOMAIN: readString("VITE_FIREBASE_AUTH_DOMAIN"),
  VITE_FIREBASE_PROJECT_ID: readString("VITE_FIREBASE_PROJECT_ID"),
  VITE_FIREBASE_STORAGE_BUCKET: readString("VITE_FIREBASE_STORAGE_BUCKET"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: readString("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  VITE_FIREBASE_APP_ID: readString("VITE_FIREBASE_APP_ID"),
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
