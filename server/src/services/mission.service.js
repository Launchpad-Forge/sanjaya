// A mission = one recorded scan, turned into a mission bundle by the engine.
// Jobs run in this process and their state lives in storage, so a status poll survives a
// restart (a job interrupted by a restart stays "processing"; the client shows a timeout).
// ponytail: in-process jobs; move to a queue if several server instances are needed.
import { randomUUID } from 'node:crypto';
import { strFromU8, unzipSync } from 'fflate';
import { mapVideo } from './engine.service.js';
import { getJson, put, putJson, signedUrls } from './storage.service.js';

const TYPES = { '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
const VIEWER_FILES = (name) => name === 'manifest.json' || /\.(glb|jpg|png)$/i.test(name);
const metaPath = (id) => `missions/${id}/mission.json`;
export const bundlePath = (id) => `missions/${id}/sanjaya_mission.zip`;
export const filePath = (id, name) => `missions/${id}/files/${name}`;

export async function createMission(video, mime, { scene, label }) {
  const meta = { id: randomUUID(), status: 'processing', label: label ?? null, scene, created_at: new Date().toISOString() };
  await putJson(metaPath(meta.id), meta);
  run(meta, video, mime).catch((e) =>
    putJson(metaPath(meta.id), { ...meta, status: 'failed', error: e.message, finished_at: new Date().toISOString() }));
  return meta;
}

async function run(meta, video, mime) {
  const { bundle, status } = await mapVideo(video, mime, { scene: meta.scene });
  await put(bundlePath(meta.id), bundle, 'application/zip');
  const files = unzipSync(new Uint8Array(bundle), { filter: (f) => VIEWER_FILES(f.name) });
  await Promise.all(Object.entries(files).map(([name, bytes]) =>
    put(filePath(meta.id, name), Buffer.from(bytes), TYPES[name.slice(name.lastIndexOf('.'))])));
  const manifest = JSON.parse(strFromU8(files['manifest.json']));
  await putJson(metaPath(meta.id), {
    ...meta, status: 'ready', engine_status: status, finished_at: new Date().toISOString(),
    engine_created_utc: manifest.created_utc, unit: manifest.unit, stats: manifest.stats,
    objects: manifest.objects, frontiers: manifest.frontiers_topdown_xz, files: manifest.files,
  });
}

export async function getMission(id) {
  const m = await getJson(metaPath(id));
  if (m.status !== 'ready') return m;
  const names = ['scene.glb', 'floorplan.png', 'mentalmap.png', ...m.objects.map((o) => o.evidence?.crop)];
  const urls = await signedUrls(names.filter(Boolean).map((n) => filePath(id, n)));
  const url = (n) => urls[filePath(id, n)] ?? null;
  return {
    ...m,
    urls: { scene: url('scene.glb'), floorplan: url('floorplan.png'), mentalmap: url('mentalmap.png') },
    objects: m.objects.map((o) => ({ ...o, crop_url: o.evidence?.crop ? url(o.evidence.crop) : null })),
  };
}
