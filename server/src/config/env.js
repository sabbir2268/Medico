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

const nodeEnv = process.env.NODE_ENV || 'development';

if (!ALLOWED_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV "${nodeEnv}". Allowed values: ${ALLOWED_NODE_ENVS.join(', ')}.`);
}

export const env = Object.freeze({
  nodeEnv,
  port: toInteger('PORT', 5000, { min: 1 }),
  mongodbUri: process.env.MONGODB_URI.trim(),
  mongoServerSelectionTimeoutMs: toInteger('MONGO_SERVER_SELECTION_TIMEOUT_MS', 5000, { min: 1 }),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  morganFormat: process.env.MORGAN_FORMAT || 'dev',
  rateLimit: Object.freeze({
    windowMs: toInteger('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, { min: 1 }),
    max: toInteger('RATE_LIMIT_MAX', 100, { min: 1 }),
  }),
});

export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
