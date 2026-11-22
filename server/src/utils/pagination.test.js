import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPagination, parsePagination } from './pagination.js';

test('parsePagination applies defaults and caps the page size', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '20' }), {
    page: 3,
    limit: 20,
    skip: 40,
  });
  assert.equal(parsePagination({ limit: '9999' }, { maxLimit: 100 }).limit, 100);
  assert.equal(parsePagination({ page: '-2', limit: '0' }).page, 1);
});

test('buildPagination matches the client pagination contract', () => {
  assert.deepEqual(buildPagination({ page: 2, limit: 10, total: 42 }), {
    page: 2,
    limit: 10,
    total: 42,
    totalPages: 5,
    hasNext: true,
    hasPrev: true,
  });

  assert.deepEqual(buildPagination({ page: 1, limit: 10, total: 0 }), {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
});
