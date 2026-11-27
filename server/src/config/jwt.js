import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const verifyOptions = {
  issuer: env.jwt.issuer,
  audience: env.jwt.audience,
};

export function signJwt(payload, secret, options = {}) {
  return jwt.sign(payload, secret, { ...verifyOptions, ...options });
}

export function verifyJwt(token, secret) {
  try {
    return jwt.verify(token, secret, verifyOptions);
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token has expired.', {
        code: ERROR_CODES.TOKEN_EXPIRED,
      });
    }

    throw new ApiError(401, 'Invalid authentication token.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }
}
