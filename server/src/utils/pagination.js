/** Parse list-query pagination with caps so clients cannot request huge pages. */
export function parsePagination(query = {}, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Math.min(
    maxLimit,
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit,
  );

  return { page, limit, skip: (page - 1) * limit };
}

/** Build the pagination block returned in every paginated list response. */
export function buildPagination({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
