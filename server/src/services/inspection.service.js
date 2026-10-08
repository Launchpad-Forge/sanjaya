// An inspection = baseline mission + current mission -> aligned comparison -> change events.
// Geometry and confidence come from the engine (inspection.py); this service stores the
// result, signs evidence image URLs, and attaches evidence-grounded explanations.
import { randomUUID } from 'node:crypto';
import { compareBundles } from './engine.service.js';
import { explainChange } from './gemini.service.js';
import { bundlePath, filePath, getMission } from './mission.service.js';
import { get, getJson, putJson, signedUrls } from './storage.service.js';
import { inspectionResultSchema } from '../validators/inspection.validator.js';

const path = (id) => `inspections/${id}.json`;
const conflict = (msg) => Object.assign(new Error(msg), { status: 409 });

export async function createInspection({ baselineId, currentId, markerSizeCm }) {
  if (baselineId === currentId) throw Object.assign(new Error('Baseline and current scan must differ.'), { status: 400 });
  const [b, c] = await Promise.all([getMission(baselineId), getMission(currentId)]);
  if (b.status !== 'ready' || c.status !== 'ready') throw conflict('Both scans must finish processing first.');
  const meta = {
    id: randomUUID(), status: 'processing', baseline_id: baselineId, current_id: currentId,
    marker_size_cm: markerSizeCm, created_at: new Date().toISOString(),
  };
  await putJson(path(meta.id), meta);
  run(meta).catch((e) => putJson(path(meta.id), { ...meta, status: 'failed', error: e.message }));
  return meta;
}

async function run(meta) {
  const [bz, cz] = await Promise.all([get(bundlePath(meta.baseline_id)), get(bundlePath(meta.current_id))]);
  const result = inspectionResultSchema.parse(await compareBundles(bz, cz, meta.marker_size_cm));
  result.baseline.id = meta.baseline_id;
  result.current.id = meta.current_id;
  for (const c of result.changes) Object.assign(c, { baseline_session: meta.baseline_id, current_session: meta.current_id });
  await putJson(path(meta.id), { ...meta, status: 'ready', finished_at: new Date().toISOString(), result });
}

export async function getInspection(id) {
  const ins = await getJson(path(id));
  if (ins.status !== 'ready') return ins;
  const scanOf = { baseline: ins.baseline_id, current: ins.current_id };
  const evidence = ins.result.changes.flatMap((c) => c.evidence);
  const anchor = ins.result.alignment?.anchor;
  const paths = [
    ...evidence.map((e) => e.image && filePath(scanOf[e.scan], e.image)),
    filePath(ins.baseline_id, 'scene.glb'), filePath(ins.current_id, 'scene.glb'),
    anchor && filePath(ins.baseline_id, anchor.baseline.image), anchor && filePath(ins.current_id, anchor.current.image),
  ];
  const urls = await signedUrls(paths);
  const url = (scan, name) => (name ? urls[filePath(scanOf[scan], name)] ?? null : null);
  const [baseline, current] = await Promise.all([getMission(ins.baseline_id), getMission(ins.current_id)]);
  const summary = (m) => ({ id: m.id, label: m.label, created_at: m.created_at, stats: m.stats, objects: m.objects?.length ?? 0 });
  return {
    ...ins,
    baseline: summary(baseline), current: summary(current),
    urls: { baseline_scene: url('baseline', 'scene.glb'), current_scene: url('current', 'scene.glb') },
    result: {
      ...ins.result,
      changes: ins.result.changes.map((c) => ({
        ...c, explanation: ins.explanations?.[c.id] ?? null,
        evidence: c.evidence.map((e) => ({ ...e, url: url(e.scan, e.image) })),
      })),
    },
  };
}

export async function explainInspection(id) {
  const ins = await getJson(path(id));
  if (ins.status !== 'ready') throw conflict('Inspection is not ready yet.');
  const out = await Promise.all(ins.result.changes.map((c) => explainChange(c, ins.result.unit)));
  ins.explanations = Object.fromEntries(ins.result.changes.map((c, i) => [c.id, out[i]]));
  await putJson(path(id), ins);
  return ins.explanations;
}
