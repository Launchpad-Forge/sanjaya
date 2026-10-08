import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync } from 'fflate';
import { decodeImageArchive } from '../src/validators/imageArchive.js';
const png = new Uint8Array([137,80,78,71,13,10,26,10]);
test('photo archive preserves capture order and MIME type', () => {
  const result = decodeImageArchive(zipSync({ '002.png': png, '000.png': png, '001.png': png }));
  assert.deepEqual(result.map(f => f.name), ['000.png','001.png','002.png']);
  assert.ok(result.every(f => f.mime === 'image/png'));
});
test('photo archive requires enough overlapping views', () => {
  assert.throws(() => decodeImageArchive(zipSync({ '000.png': png })), /at least 3/);
});
test('photo archive rejects unsupported content', () => {
  assert.throws(() => decodeImageArchive(zipSync({ '000.png': new Uint8Array([1]), '001.png': png, '002.png': png })), /not a supported image/);
});
