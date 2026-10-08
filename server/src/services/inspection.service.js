import { randomUUID } from 'node:crypto';
import { getMission, bundlePath, filePath } from './mission.service.js';
import { get, getJson, putJson, signedUrls } from './storage.service.js';
import { compareBundles } from './engine.service.js';
import { explainChange } from './gemini.service.js';
import { inspectionResultSchema } from '../validators/inspection.validator.js';
const path = id => `inspections/${id}.json`;

export async function createInspection({ baselineId, currentId, markerSizeCm }) {
  if (baselineId === currentId) throw Object.assign(new Error('Baseline and current scan must differ.'), { status: 400 });
  const [baseline, current] = await Promise.all([getMission(baselineId), getMission(currentId)]);
  if (baseline.status !== 'ready' || current.status !== 'ready') throw Object.assign(new Error('Both scans must finish processing first.'), { status: 409 });
  const meta = { id: randomUUID(), status: 'processing', baseline_id: baselineId, current_id: currentId, marker_size_cm: markerSizeCm ?? 0, created_at: new Date().toISOString() };
  await putJson(path(meta.id), meta);
  (async () => {
    const bundles = await Promise.all([get(bundlePath(baselineId)), get(bundlePath(currentId))]);
    const result = inspectionResultSchema.parse(await compareBundles(...bundles, meta.marker_size_cm));
    await putJson(path(meta.id), { ...meta, status: 'ready', result });
  })().catch(error => putJson(path(meta.id), { ...meta, status: 'failed', error: error.message })).catch(error => console.error('Could not save inspection failure:', error.message));
  return meta;
}
export async function getInspection(id) {
  const meta = await getJson(path(id));
  if (meta.status !== 'ready') return meta;
  const [baseline, current] = await Promise.all([getMission(meta.baseline_id), getMission(meta.current_id)]);
  const evidencePath = evidence => evidence.image && filePath(evidence.scan === 'baseline' ? baseline.id : current.id, evidence.image);
  const urls = await signedUrls(meta.result.changes.flatMap(c => c.evidence.map(evidencePath)));
  return { ...meta, baseline: { id: baseline.id, stats: baseline.stats }, current: { id: current.id, stats: current.stats },
    urls: { baseline_scene: baseline.urls.scene, current_scene: current.urls.scene },
    result: { ...meta.result, changes: meta.result.changes.map(c => ({ ...c, evidence: c.evidence.map(e => ({ ...e, url: urls[evidencePath(e)] })) })) } };
}
export async function explainInspection(id) {
  const meta = await getJson(path(id));
  if (meta.status !== 'ready') throw Object.assign(new Error('Inspection is not ready yet.'), { status: 409 });
  const explanations = {};
  for (const change of meta.result.changes) {
    change.explanation ??= await explainChange(change, meta.result.unit);
    explanations[change.id] = change.explanation;
  }
  await putJson(path(id), meta);
  return explanations;
}
