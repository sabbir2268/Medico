export class ApiError extends Error {
  constructor(statusCode, message, { code, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace?.(this, ApiError);
  }
}
