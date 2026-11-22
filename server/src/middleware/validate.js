import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/** Zod-backed request validation. Validated data is placed on `req.validated`. */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.join('.') : 'form';
        errors[key] = issue.message;
      }

      return next(
        new ApiError(400, 'Validation failed.', {
          code: ERROR_CODES.VALIDATION_ERROR,
          errors,
        }),
      );
    }

    req.validated = { ...(req.validated ?? {}), [source]: result.data };
    return next();
  };
}
