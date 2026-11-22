/**
 * A normalized error shared by every feature. `code` and `errors` mirror the
 * server error envelope so UI code can branch on machine-readable values.
 */
export class ApiError extends Error {
  constructor(message, { status = null, code = null, errors = null, details = null, cause = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.details = details;
    this.cause = cause;
  }
}

function getMessageFromResponse(data) {
  if (typeof data === "string" && data.trim() !== "") {
    return data;
  }

  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }

  return null;
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error?.isAxiosError) {
    const status = error.response?.status ?? null;
    const details = error.response?.data ?? null;
    const responseMessage = getMessageFromResponse(details);
    const code = details && typeof details === "object" ? details.code ?? null : null;
    const errors = details && typeof details === "object" ? details.errors ?? null : null;

    if (responseMessage) {
      return new ApiError(responseMessage, { status, code, errors, details, cause: error });
    }

    if (error.code === "ECONNABORTED") {
      return new ApiError("The request timed out. Please try again.", {
        status,
        details,
        cause: error,
      });
    }

    if (!error.response) {
      return new ApiError(
        "Unable to reach the server. Check your connection and try again.",
        { status, details, cause: error },
      );
    }

    return new ApiError(`Request failed with status ${status}.`, {
      status,
      details,
      cause: error,
    });
  }

  return new ApiError(error?.message || "An unexpected error occurred.", {
    cause: error,
  });
}
