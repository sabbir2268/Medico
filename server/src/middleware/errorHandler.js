import mongoose from 'mongoose';
import { isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

function normalizeError(error) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      errors: error.errors,
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      errors: Object.fromEntries(Object.entries(error.errors).map(([field, detail]) => [field, detail.message])),
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: `Invalid value for field "${error.path}"`,
      code: ERROR_CODES.CAST_ERROR,
    };
  }

  if (error?.code === 11000) {
    return {
      statusCode: 409,
      message: `Duplicate value for unique field "${Object.keys(error.keyValue ?? {})[0] ?? 'unknown'}"`,
      code: ERROR_CODES.DUPLICATE_KEY,
      errors: error.keyValue,
    };
  }

  if (error?.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      message: 'Invalid JSON payload',
      code: ERROR_CODES.INVALID_JSON,
    };
  }

  if (error?.name === 'MulterError') {
    return {
      statusCode: 400,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'Images must be smaller than 5 MB.' : error.message,
      code: ERROR_CODES.VALIDATION_ERROR,
      errors: { image: error.message },
    };
  }

  const hasValidStatus = Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 600;
  const statusCode = hasValidStatus ? error.statusCode : 500;

  return {
    statusCode,
    message: statusCode === 500 ? 'Internal Server Error' : error.message,
    code: statusCode === 500 ? ERROR_CODES.INTERNAL_ERROR : error?.code ? String(error.code) : undefined,
  };
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const { statusCode, message, code, errors } = normalizeError(error);

  if (statusCode >= 500) {
    logger.error(error.stack || error.message || String(error));
  }

  return sendError(res, {
    statusCode,
    message,
    code,
    errors,
    stack: !isProduction && statusCode >= 500 ? error.stack : undefined,
  });
}
