import { randomUUID } from 'node:crypto';
import { unzipSync } from 'fflate';
import { mapVideo, mapImages } from './engine.service.js';
import { put, putJson, getJson, signedUrls } from './storage.service.js';

export const bundlePath = id => `missions/${id}/sanjaya_mission.zip`;
export const filePath = (id, name) => `missions/${id}/files/${name}`;
const metaPath = id => `missions/${id}/mission.json`;
const viewable = name => /^(scene\.glb|floorplan\.png|mentalmap\.png|manifest\.json|mental_map\.json|trajectory\.json|(?:crops|keyframes)\/[\w-]+\.jpg)$/.test(name);
const contentType = name => name.endsWith('.json') ? 'application/json' : name.endsWith('.glb') ? 'model/gltf-binary' : name.endsWith('.png') ? 'image/png' : 'image/jpeg';

export async function createMission(input, mime, { scene = 'Indoor', label, source = 'video' }) {
  const meta = { id: randomUUID(), status: 'processing', label: label ?? null, scene, source, created_at: new Date().toISOString() };
  await putJson(metaPath(meta.id), meta);
  run(meta, input, mime).catch(async error => {
    await putJson(metaPath(meta.id), { ...meta, status: 'failed', error: error.message });
  }).catch(error => console.error('Could not save mission failure:', error.message));
  return meta;
}
async function run(meta, input, mime) {
  const { bundle, status } = await (meta.source === 'images' ? mapImages(input, meta) : mapVideo(input, mime, meta));
  const files = unzipSync(bundle, { filter: file => viewable(file.name) });
  if (!files['manifest.json'] || !files['scene.glb']) throw new Error('Engine returned an incomplete mission bundle.');
  const manifest = JSON.parse(Buffer.from(files['manifest.json']).toString());
  const graph = files['mental_map.json'] ? JSON.parse(Buffer.from(files['mental_map.json']).toString()) : null;
  await put(bundlePath(meta.id), bundle, 'application/zip');
  // Keep storage concurrency bounded for large reconstructions.
  const entries = Object.entries(files);
  for (let i = 0; i < entries.length; i += 4) {
    await Promise.all(entries.slice(i, i + 4).map(([name, bytes]) => put(filePath(meta.id, name), Buffer.from(bytes), contentType(name))));
  }
  await putJson(metaPath(meta.id), { ...meta, status: 'ready', engine_status: status, engine_created_utc: manifest.created_utc,
    unit: manifest.unit, stats: { ...manifest.stats, places: graph?.summary?.places ?? null }, objects: manifest.objects ?? [], files: Object.keys(files) });
}
export async function getMission(id) {
  const meta = await getJson(metaPath(id));
  if (meta.status !== 'ready') return meta;
  const names = { scene: 'scene.glb', floorplan: 'floorplan.png', mentalmap: 'mentalmap.png', graph: 'mental_map.json', trajectory: 'trajectory.json', manifest: 'manifest.json' };
  const paths = Object.fromEntries(Object.entries(names).filter(([, name]) => meta.files?.includes(name)).map(([key, name]) => [key, filePath(id, name)]));
  paths.bundle = bundlePath(id);
  const crops = (meta.objects ?? []).map(o => o.evidence?.crop).filter(name => meta.files?.includes(name));
  const urls = await signedUrls([...Object.values(paths), ...crops.map(name => filePath(id, name))]);
  return { ...meta, urls: Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, urls[path]])),
    objects: (meta.objects ?? []).map(o => ({ ...o, crop_url: urls[filePath(id, o.evidence?.crop)] })) };
}
