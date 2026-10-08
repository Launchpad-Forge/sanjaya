// node --test   (no network: fake Supabase settings, fetch is mocked for Gemini)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'.repeat(40);
process.env.GEMINI_API_KEY = 'test-key';

const { inspectionResultSchema } = await import('../src/validators/inspection.validator.js');
const { evidenceFacts, groundedNumbers, templateExplanation, explainChange } = await import('../src/services/gemini.service.js');
const { app } = await import('../src/index.js');

// produced by engine/hf_space/sanjaya/inspection.py on a synthetic scene (all change types)
const fixture = JSON.parse(readFileSync(new URL('./fixtures/inspection_result.json', import.meta.url)));
const moved = fixture.changes.find((c) => c.type === 'object_moved');

test('engine result matches the server contract', () => {
  const r = inspectionResultSchema.parse(fixture);
  assert.deepEqual(new Set(r.changes.map((c) => c.type)),
    new Set(['object_moved', 'object_appeared', 'object_disappeared', 'geometry_added']));
});

test('contract rejects a change without evidence fields', () => {
  const bad = structuredClone(fixture);
  delete bad.changes[0].confidence;
  assert.equal(inspectionResultSchema.safeParse(bad).success, false);
});

test('templates only use numbers from the evidence', () => {
  for (const c of fixture.changes) {
    const text = templateExplanation(c, fixture.unit);
    const g = groundedNumbers(text, evidenceFacts(c, fixture.unit));
    assert.ok(g.ok, `${c.type}: ${text} -> ${g.bad}`);
  }
});

test('grounding accepts unit conversions and rejects invented measurements', () => {
  const facts = evidenceFacts(moved, 'm');
  const cm = Math.round(moved.displacement_m * 100);
  assert.ok(groundedNumbers(`The chair moved about ${cm} cm in 3D, confidence ${Math.round(moved.confidence * 100)}%.`, facts).ok);
  assert.deepEqual(groundedNumbers('The chair moved 1.5 m toward the door.', facts).bad, [1.5]);
});

function mockGemini(reply) {
  const real = globalThis.fetch;
  globalThis.fetch = async () => (reply instanceof Error ? Promise.reject(reply) : new Response(JSON.stringify(
    { candidates: [{ content: { parts: [{ text: reply }] } }] }), { status: 200 }));
  return () => { globalThis.fetch = real; };
}

test('grounded Gemini reply is used', async () => {
  const restore = mockGemini(`The chair moved about ${moved.displacement_m} m. Please verify on site.`);
  try {
    const r = await explainChange(moved, 'm');
    assert.equal(r.source, 'gemini');
  } finally { restore(); }
});

test('Gemini reply with an invented number falls back to the template', async () => {
  const restore = mockGemini('The chair moved 2.7 m, probably pushed by a cleaner.');
  try {
    const r = await explainChange(moved, 'm');
    assert.equal(r.source, 'template');
    assert.deepEqual(r.rejected.ungrounded_numbers, [2.7]);
  } finally { restore(); }
});

test('Gemini failure falls back to the template', async () => {
  const restore = mockGemini(new Error('network down'));
  try {
    const r = await explainChange(moved, 'm');
    assert.equal(r.source, 'template');
    assert.match(r.error, /network down/);
  } finally { restore(); }
});

test('API validates input before touching storage or the engine', async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.equal((await fetch(`${base}/missions/not-a-uuid`)).status, 400);
    const noVideo = await fetch(`${base}/missions`, { method: 'POST', headers: { 'Content-Type': 'video/webm' }, body: 'x' });
    assert.equal(noVideo.status, 400);
    const badScene = await fetch(`${base}/missions?scene=Space`, { method: 'POST', headers: { 'Content-Type': 'video/webm' }, body: Buffer.alloc(2048) });
    assert.equal(badScene.status, 400);
    const badIds = await fetch(`${base}/inspections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baselineId: '1', currentId: '2' }),
    });
    assert.equal(badIds.status, 400);
  } finally { server.close(); }
});
