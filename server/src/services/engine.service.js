// The GPU engine is the Hugging Face Space (Gradio). The Space is the only thing that runs
// models; this file is the single place that knows its API, so moving the engine to
// Modal / RunPod later means replacing these two functions.
import { Client, handle_file } from '@gradio/client';
import { env } from '../config/env.js';

let client;
async function connect() {
  try {
    return await (client ??= Client.connect(env.SANJAYA_ENGINE_SPACE, env.HF_TOKEN ? { hf_token: env.HF_TOKEN } : {}));
  } catch (e) {
    client = undefined; // retry the connection next time
    throw e;
  }
}

async function download(file) {
  const res = await fetch(file.url, env.HF_TOKEN ? { headers: { Authorization: `Bearer ${env.HF_TOKEN}` } } : {});
  if (!res.ok) throw new Error(`engine file download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Video -> mission bundle (zip Buffer) + the engine's status text. ~1-2 min of GPU. */
export async function mapVideo(video, mime, { scene = 'Indoor', things = 'door, staircase, chair, table, window, fire extinguisher' } = {}) {
  const app = await connect();
  const blob = new Blob([video], { type: mime });
  // /map inputs, in order: image_files, video_file, scene, things, fps, max_frames, keyframes, conf_pct, min_score
  const r = await app.predict('/map', [[], { video: handle_file(blob), subtitles: null }, scene, things, 6, 96, 12, 50, 0.3]);
  const files = r.data.filter((d) => d && typeof d === 'object' && d.url);
  const bundle = files.find((f) => /\.zip$/i.test(f.path || f.url));
  if (!bundle) throw new Error('engine returned no mission bundle');
  return { bundle: await download(bundle), status: r.data.find((d) => typeof d === 'string') ?? '' };
}

/** Ordered overlapping photographs use the same reconstruction pipeline as video. */
export async function mapImages(images, { scene = 'Indoor' } = {}) {
  const app = await connect();
  const uploads = images.map(({ name, data, mime }) => handle_file(new File([data], name, { type: mime })));
  const r = await app.predict('/map', [uploads, null, scene, 'door, staircase, chair, table, window, fire extinguisher', 6, 96, 12, 50, 0.3]);
  const bundle = r.data.find(d => d && typeof d === 'object' && d.url && /\.zip$/i.test(d.path || d.url));
  if (!bundle) throw new Error('engine returned no mission bundle');
  return { bundle: await download(bundle), status: r.data.find(d => typeof d === 'string') ?? '' };
}

/** Two mission bundles -> inspection result (CPU on the Space, no GPU quota). */
export async function compareBundles(baselineZip, currentZip, markerSizeCm = 0) {
  const app = await connect();
  const zip = (buf) => handle_file(new Blob([buf], { type: 'application/zip' }));
  const r = await app.predict('/compare', [zip(baselineZip), zip(currentZip), markerSizeCm]);
  return r.data[0];
}
