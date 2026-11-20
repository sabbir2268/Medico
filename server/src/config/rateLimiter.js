import rateLimit from 'express-rate-limit';
import { env } from './env.js';
import { sendError } from '../utils/apiResponse.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    return sendError(res, {
      statusCode: options.statusCode || 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    });
  },
});
