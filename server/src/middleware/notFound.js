import { sendError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    code: ERROR_CODES.NOT_FOUND,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
