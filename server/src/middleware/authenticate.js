import { User } from '../models/User.js';
import { isFirebaseAdminConfigured, getFirebaseAuth } from '../config/firebaseAdmin.js';
import { assertTokenVersion, verifyAccessToken } from '../services/tokenService.js';
import { findOrCreateUserFromFirebase } from '../services/userService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function readBearerToken(req) {
  const [scheme, token, ...rest] = String(req.headers.authorization ?? '').split(' ');

  if (!token || rest.length > 0 || !/^Bearer$/i.test(scheme)) {
    throw new ApiError(401, 'A Bearer authorization token is required.', {
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  return token;
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
      const payload = verifyAccessToken(token);
      user = await User.findById(payload.sub);
      tokenType = 'jwt';

      if (!user || !user.isActive) {
        throw new ApiError(401, 'This account is no longer active.', {
          code: ERROR_CODES.ACCOUNT_INACTIVE,
        });
      }
      assertTokenVersion(payload, user);
    } else {
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

      user = await findOrCreateUserFromFirebase(decoded);
      tokenType = 'firebase';
    }

    req.user = user;
    req.auth = {
      userId: String(user._id),
      firebaseUid: user.firebaseUid,
      role: user.role,
      tokenType,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
