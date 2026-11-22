import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeUser } from './sanitizeUser.js';

test('sanitizeUser returns only public fields', () => {
  const result = sanitizeUser({
    _id: 'user-1',
    id: 'user-1',
    firebaseUid: 'uid-1',
    email: 'asha@example.com',
    displayName: 'Asha',
    photoURL: '',
    role: 'seller',
    isActive: true,
    passwordHash: 'must-not-leak',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  });

  assert.equal(result.passwordHash, undefined);
  assert.equal(result.role, 'seller');
  assert.equal(result.id, 'user-1');
  assert.ok(result.createdAt);
});

test('sanitizeUser handles missing users', () => {
  assert.equal(sanitizeUser(null), null);
  assert.equal(sanitizeUser(undefined), null);
});
