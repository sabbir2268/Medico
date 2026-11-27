import rateLimit from 'express-rate-limit';
import { env, isTest } from './env.js';
import { sendError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/** Stricter limiter for credential-bearing auth endpoints. */
export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: Math.max(5, Math.floor(env.rateLimit.max / 5)),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Stripe signs and retries webhooks server-to-server; never 429 them.
  skip: (req) => isTest || String(req.originalUrl ?? '').split('?')[0] === '/api/payments/webhook',
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    return sendError(res, {
      statusCode: options.statusCode || 429,
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts. Please try again later.',
    });
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Stripe signs and retries webhooks server-to-server; never 429 them.
  skip: (req) => isTest || String(req.originalUrl ?? '').split('?')[0] === '/api/payments/webhook',
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    return sendError(res, {
      statusCode: options.statusCode || 429,
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later.',
    });
  },
});
