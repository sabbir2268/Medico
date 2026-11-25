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

/** Standard envelope for every paginated list endpoint. */
export function sendPaginated(res, { items = [], pagination, message = 'Success', statusCode = 200, meta } = {}) {
  return sendSuccess(res, {
    statusCode,
    message,
    meta,
    data: { items, pagination },
  });
}

