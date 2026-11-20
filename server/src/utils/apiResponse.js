export function sendSuccess(res, { data = null, message = 'Success', meta, statusCode = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta !== undefined) {
    body.meta = meta;
  }
  return res.status(statusCode).json(body);
}

export function sendError(res, { message = 'Something went wrong', statusCode = 500, code, errors, data, stack } = {}) {
  const body = { success: false, message };
  if (code) {
    body.code = code;
  }
  if (errors !== undefined) {
    body.errors = errors;
  }
  if (data !== undefined) {
    body.data = data;
  }
  if (stack) {
    body.stack = stack;
  }
  return res.status(statusCode).json(body);
}

export const ApiResponse = Object.freeze({
  success: sendSuccess,
  error: sendError,
});
