import { Client, handle_file } from '@gradio/client';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/reconstruct-demo.mjs VIDEO OUTPUT_DIRECTORY');
const space = process.env.SANJAYA_ENGINE_SPACE || 'netha01/sanjaya-engine';
const bytes = await readFile(input);
await mkdir(output, { recursive: true });
const app = await Client.connect(space, process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {});
console.log(`Connected to ${space}. Uploading ${path.basename(input)} (${bytes.length} bytes).`);
const job = app.submit('/map', [[], { video: handle_file(new Blob([bytes], { type: 'video/mp4' })), subtitles: null }, 'Indoor', 'door, staircase, chair, table, window, fire extinguisher', 6, 96, 12, 50, 0.3]);
let result;
for await (const event of job) {
  if (event.type === 'status') console.log(JSON.stringify({ stage: event.stage, message: event.message, queue: event.position }));
  if (event.type === 'data') result = event.data;
}
if (!result) throw new Error('Engine did not return a result.');
const artifacts = [];
for (const item of result) {
  if (!item || typeof item !== 'object' || !item.url) continue;
  const name = path.basename(item.path || new URL(item.url).pathname);
  if (!/\.(zip|glb|png)$/i.test(name)) continue;
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`Artifact download failed (${response.status}).`);
  await writeFile(path.join(output, name), Buffer.from(await response.arrayBuffer()));
  artifacts.push(name);
  console.log(`Saved ${name}`);
}
if (!artifacts.some(name => name.endsWith('.zip'))) throw new Error('Engine did not return a mission bundle.');
await writeFile(path.join(output, 'provenance.json'), JSON.stringify({ source: path.basename(input), source_sha256: createHash('sha256').update(bytes).digest('hex'), space, processed_at: new Date().toISOString(), artifacts, settings: { scene: 'Indoor', fps: 6, max_frames: 96, keyframes: 12, confidence_percentile: 50, min_object_score: 0.3 } }, null, 2));
console.log('Real reconstruction and provenance saved.');
