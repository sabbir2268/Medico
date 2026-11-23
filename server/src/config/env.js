import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ quiet: true, path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const REQUIRED_VARIABLES = ['MONGODB_URI'];
const ALLOWED_NODE_ENVS = ['development', 'production', 'test'];

const missingVariables = REQUIRED_VARIABLES.filter((name) => {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim() === '';
});

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingVariables.join(', ')}. See .env.example for reference.`,
  );
}

function toInteger(name, fallback, { min = 0 } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`Invalid environment variable ${name}: expected an integer >= ${min}, received "${raw}".`);
  }

  return value;
}

function readString(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (!ALLOWED_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV "${nodeEnv}". Allowed values: ${ALLOWED_NODE_ENVS.join(', ')}.`);
}

const isProduction = nodeEnv === 'production';

const corsOrigin = readString('CORS_ORIGIN', isProduction ? '' : '*');
if (isProduction && (!corsOrigin || corsOrigin === '*')) {
  throw new Error('CORS_ORIGIN must list explicit origins in production (a comma-separated list is supported).');
}

/**
 * JWT secrets are mandatory in production. Development falls back to
 * clearly-labelled local-only values so the app can start before secrets are
 * generated; those fallbacks never apply in production or test.
 */
function readSecret(name, devFallback) {
  const value = readString(name);
  if (value) return value;
  if (isProduction) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example for reference.`);
  }
  return devFallback;
}

export const env = Object.freeze({
  nodeEnv,
  port: toInteger('PORT', 5000, { min: 1 }),
  mongodbUri: process.env.MONGODB_URI.trim(),
  mongoServerSelectionTimeoutMs: toInteger('MONGO_SERVER_SELECTION_TIMEOUT_MS', 5000, { min: 1 }),
  corsOrigin,
  morganFormat: readString('MORGAN_FORMAT', 'dev'),
  rateLimit: Object.freeze({
    windowMs: toInteger('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, { min: 1 }),
    // Development reloads fire many requests from one IP; keep the default high
    // locally and strict in production, overridable via RATE_LIMIT_MAX.
    max: toInteger('RATE_LIMIT_MAX', isProduction ? 100 : 1000, { min: 1 }),
  }),
  jwt: Object.freeze({
    accessSecret: readSecret('JWT_SECRET', 'dev-only-access-secret-change-me'),
    refreshSecret: readSecret('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me'),
    accessExpiresIn: readString('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: readString('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: readString('JWT_ISSUER', 'medico-api'),
    audience: readString('JWT_AUDIENCE', 'medico-client'),
  }),
  firebase: Object.freeze({
    projectId: readString('FIREBASE_PROJECT_ID'),
    clientEmail: readString('FIREBASE_CLIENT_EMAIL'),
    privateKey: readString('FIREBASE_PRIVATE_KEY'),
  }),
  stripe: Object.freeze({
    secretKey: readString('STRIPE_SECRET_KEY'),
    webhookSecret: readString('STRIPE_WEBHOOK_SECRET'),
    successUrl: readString('STRIPE_SUCCESS_URL', 'http://localhost:5173/payments/success'),
    cancelUrl: readString('STRIPE_CANCEL_URL', 'http://localhost:5173/payments/cancel'),
  }),
  imgbb: Object.freeze({
    apiKey: readString('IMGBB_API_KEY'),
  }),
  cloudinary: Object.freeze({
    cloudName: readString('CLOUDINARY_CLOUD_NAME'),
    apiKey: readString('CLOUDINARY_API_KEY'),
    apiSecret: readString('CLOUDINARY_API_SECRET'),
  }),
});

export { isProduction };
export const isTest = nodeEnv === 'test';
