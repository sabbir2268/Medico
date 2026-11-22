import { env } from '../config/env.js';
import { signJwt, verifyJwt } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

function durationToSeconds(value) {
  if (/^\d+$/.test(value)) return Number(value);

  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return null;

  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return Number(match[1]) * factor;
}

/**
 * Tokens intentionally carry identity only. Roles are always read from the
 * database on each request, so a stale or tampered role can never escalate.
 */
function basePayload(user) {
  return {
    sub: String(user._id ?? user.id),
    uid: user.firebaseUid ?? null,
    ver: user.tokenVersion ?? 0,
  };
}

export function issueAccessToken(user) {
  return signJwt({ ...basePayload(user), type: 'access' }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function issueRefreshToken(user) {
  return signJwt({ ...basePayload(user), type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

export function issueTokenPair(user) {
  return {
    accessToken: issueAccessToken(user),
    refreshToken: issueRefreshToken(user),
    tokenType: 'Bearer',
    expiresIn: durationToSeconds(env.jwt.accessExpiresIn),
  };
}

/** Invalidates all previously issued tokens after a logout or password change. */
export function assertTokenVersion(payload, user) {
  if ((payload.ver ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new ApiError(401, 'This session has been ended. Please sign in again.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }
}

export function verifyAccessToken(token) {
  const payload = verifyJwt(token, env.jwt.accessSecret);
  if (payload.type !== 'access') {
    throw new ApiError(401, 'Invalid authentication token.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = verifyJwt(token, env.jwt.refreshSecret);
  if (payload.type !== 'refresh') {
    throw new ApiError(401, 'Invalid refresh token.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }
  return payload;
}
