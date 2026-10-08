// ============================================================================
// Sanjaya — Remote E2E Tests (Safe for Production)
// Run: node --test test/remote_e2e.test.js
// ============================================================================
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// The live Vercel URL
const BASE = 'https://sanjaya-server.vercel.app';

describe('Production Safe Checks', () => {
  test('TC-LIVE-1: GET /api/health should return 200 OK', async () => {
    const res = await fetch(`${BASE}/api/health`);
    assert.equal(res.status, 200, `Expected 200 but got ${res.status}`);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  test('TC-LIVE-2: GET non-existent route returns 404', async () => {
    const res = await fetch(`${BASE}/api/invalid-route`);
    assert.equal(res.status, 404);
  });

  test('TC-LIVE-3: POST /api/missions with invalid body returns 400 (Zod catches it before queue)', async () => {
    // Send a payload that will immediately fail Zod validation so it doesn't 
    // actually get uploaded to Supabase or queued to Hugging Face.
    const res = await fetch(`${BASE}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'video/mp4' },
      body: Buffer.alloc(10) // Fails minimum size check (1024 bytes)
    });
    assert.equal(res.status, 400);
  });

  test('TC-LIVE-4: GET missing inspection returns 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${BASE}/api/inspections/${fakeId}`);
    assert.equal(res.status, 404);
  });
});
