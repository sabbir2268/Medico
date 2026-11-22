import { getFirebaseAuth, isFirebaseAdminConfigured } from '../config/firebaseAdmin.js';
import { findOrCreateUserFromFirebase } from '../services/userService.js';
import {
  assertTokenVersion,
  issueTokenPair,
  verifyRefreshToken,
} from '../services/tokenService.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';

function sessionPayload(user) {
  return { user: sanitizeUser(user), ...issueTokenPair(user) };
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

/** POST /api/auth/register — native email/password account (never admin). */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, photoURL = '', role = ROLES.USER } = req.validated.body;

  let user;
  try {
    user = await User.create({
      username,
      email,
      passwordHash: password,
      photoURL,
      role,
      provider: 'password',
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(409, 'An account with this email already exists.', {
        code: ERROR_CODES.EMAIL_IN_USE,
        errors: { email: 'This email is already registered.' },
      });
    }
    throw error;
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully.',
    data: sessionPayload(user),
  });
});

/** POST /api/auth/login — verifies a bcrypt hash, never reveals account existence. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.', {
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    message: 'Signed in successfully.',
    data: sessionPayload(user),
  });
});

/** POST /api/auth/firebase — exchanges a verified Firebase ID token for a backend JWT. */
export const firebaseExchange = asyncHandler(async (req, res) => {
  const { idToken } = req.validated.body;

  if (!isFirebaseAdminConfigured) {
    throw new ApiError(503, 'Firebase Admin is not configured on the server.', {
      code: ERROR_CODES.AUTH_NOT_CONFIGURED,
    });
  }

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(idToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired Firebase ID token.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }

  const user = await findOrCreateUserFromFirebase(decoded);

  return sendSuccess(res, {
    message: 'Session established.',
    data: sessionPayload(user),
  });
});

/** GET /api/auth/me — the authenticated user, read from the database. */
export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Current user retrieved.',
    data: { user: sanitizeUser(req.user) },
  }),
);

/** POST /api/auth/logout — bumps tokenVersion so all issued tokens become invalid. */
export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion = (req.user.tokenVersion ?? 0) + 1;
  await req.user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Signed out successfully.', data: null });
});

/** POST /api/auth/refresh — rotates an access token for a still-valid refresh token. */
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body;
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'This account is no longer active.', {
      code: ERROR_CODES.ACCOUNT_INACTIVE,
    });
  }
  assertTokenVersion(payload, user);

  return sendSuccess(res, {
    message: 'Session refreshed.',
    data: sessionPayload(user),
  });
});
