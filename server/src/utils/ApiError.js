export class ApiError extends Error {
  constructor(statusCode, message, { code, errors, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, ApiError);
  }
}
