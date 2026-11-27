import { User } from '../models/User.js';
import { isFirebaseAdminConfigured, getFirebaseAuth } from '../config/firebaseAdmin.js';
import { assertTokenVersion, verifyAccessToken } from '../services/tokenService.js';
import { findOrCreateUserFromFirebase } from '../services/userService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ROLES } from '../constants/roles.js';
import { env } from '../config/env.js';

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
// Firebase ID tokens look identical to backend JWTs, so only fall back to
// Firebase verification for these signature/expiry failures — never for an
// inactive account or an invalidated token version.
const JWT_FALLBACK_CODES = new Set([ERROR_CODES.INVALID_TOKEN, ERROR_CODES.TOKEN_EXPIRED]);

function readBearerToken(req) {
  const [scheme, token, ...rest] = String(req.headers.authorization ?? '').split(' ');

  if (!token || rest.length > 0 || !/^Bearer$/i.test(scheme)) {
    throw new ApiError(401, 'A Bearer authorization token is required.', {
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  return token;
}

async function authenticateWithBackendJwt(token) {
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'This account is no longer active.', {
      code: ERROR_CODES.ACCOUNT_INACTIVE,
    });
  }
  assertTokenVersion(payload, user);
  return user;
}

async function authenticateWithFirebase(token) {
  if (!isFirebaseAdminConfigured) {
    throw new ApiError(
      503,
      'Firebase Admin is not configured. Exchange the Firebase ID token for a backend JWT first.',
      { code: ERROR_CODES.AUTH_NOT_CONFIGURED },
    );
  }

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired Firebase ID token.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }

  return findOrCreateUserFromFirebase(decoded);
}

/**
 * Accepts either a backend-issued JWT access token or a Firebase ID token.
 * In both cases the role is taken from the database, never from the request.
 */
export async function authenticate(req, res, next) {
  try {
    const token = readBearerToken(req);
    let user;
    let tokenType;

    if (JWT_PATTERN.test(token)) {
      try {
        user = await authenticateWithBackendJwt(token);
        tokenType = 'jwt';
      } catch (error) {
        if (!JWT_FALLBACK_CODES.has(error?.code) || !isFirebaseAdminConfigured) {
          throw error;
        }
        user = await authenticateWithFirebase(token);
        tokenType = 'firebase';
      }
    } else {
      user = await authenticateWithFirebase(token);
      tokenType = 'firebase';
    }

    // The configured ADMIN_EMAIL is the ONLY account that may act as admin.
    // Keep the effective role on `req.auth` instead of mutating the Mongoose
    // document: controllers call `req.user.save()` (logout, profile update)
    // and would otherwise persist the promoted role into MongoDB.
    const email = String(user.email ?? '').trim().toLowerCase();
    let effectiveRole = user.role;

    if (env.adminEmail) {
      effectiveRole =
        email === env.adminEmail
          ? ROLES.ADMIN
          : effectiveRole === ROLES.ADMIN
            ? ROLES.USER
            : effectiveRole;
    }

    req.user = user;
    req.auth = {
      userId: String(user._id),
      firebaseUid: user.firebaseUid,
      role: effectiveRole,
      tokenType,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
