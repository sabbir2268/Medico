import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const isFirebaseAdminConfigured = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey,
);

let adminApp = null;
let authClient = null;
let initializationError = null;

function normalizePrivateKey(privateKey) {
  // Dotenv keeps "\n" as a literal backslash-n when the value is quoted.
  return privateKey.replace(/\\n/g, '\n');
}

/** Lazily initializes the Admin SDK so the server can boot without Firebase. */
export function getFirebaseAdmin() {
  if (!isFirebaseAdminConfigured) {
    throw new ApiError(
      503,
      'Firebase Admin is not configured. Add the Firebase service-account variables to enable authentication.',
      { code: ERROR_CODES.AUTH_NOT_CONFIGURED },
    );
  }

  if (initializationError) throw initializationError;

  try {
    adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: env.firebase.projectId,
            clientEmail: env.firebase.clientEmail,
            privateKey: normalizePrivateKey(env.firebase.privateKey),
          }),
        });
    authClient = getAuth(adminApp);
  } catch (error) {
    initializationError = error;
    throw error;
  }

  return { app: adminApp, auth: authClient };
}

export function getFirebaseAuth() {
  return getFirebaseAdmin().auth;
}
