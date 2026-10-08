import test from 'node:test';
import assert from 'node:assert/strict';
import { safeAuthDestination } from './authRedirect.js';

test('keeps local workspace destinations and filters', () => {
  assert.equal(safeAuthDestination('/app/inspections?status=ready#recent'), '/app/inspections?status=ready#recent');
});

test('defaults missing or external destinations to the workspace', () => {
  for (const value of [null, '', 'https://example.com', '//example.com', '/\\example.com', '/app\n']) {
    assert.equal(safeAuthDestination(value), '/app');
  }
});

test('prevents authentication redirect loops, including normalized paths', () => {
  for (const value of ['/login', '/register?next=/app', '/auth/callback', '/app/../login']) {
    assert.equal(safeAuthDestination(value), '/app');
  }
});
