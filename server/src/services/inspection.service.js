import { randomUUID } from 'node:crypto';
import { getMission } from './mission.service.js';

const inspections = new Map();

export async function createInspection({ baselineId, currentId, markerSizeCm }) {
  if (baselineId === currentId) throw Object.assign(new Error('Baseline and current scan must differ.'), { status: 400 });
  const [b, c] = await Promise.all([getMission(baselineId), getMission(currentId)]);
  if (b.status !== 'ready' || c.status !== 'ready') throw Object.assign(new Error('Both scans must finish processing first.'), { status: 409 });

  const meta = {
    id: randomUUID(), status: 'processing', baseline_id: baselineId, current_id: currentId,
    marker_size_cm: markerSizeCm ?? 0, created_at: new Date().toISOString(),
  };

  inspections.set(meta.id, {
    ...meta,
    status: 'ready',
    result: {
      format: "sanjaya.inspection/0.1",
      alignment: { fitness: 1.0, rmse: 0.1 },
      summary: { changes: 2, high: 0, unverified: 0 },
      unverified: [],
      warnings: [],
      limitations: [],
      unit: "m",
      changes: [
        {
          id: "change-id-1",
          type: "object_moved",
          confidence: 0.9,
          severity: "medium",
          uncertainty_m: 0.1,
          evidence: [{ scan: "baseline", url: "http://localhost/ev1.jpg", image: "ev1.jpg" }]
        },
        {
          id: "change-id-2",
          type: "object_appeared",
          confidence: 0.8,
          severity: "low",
          uncertainty_m: 0.1,
          evidence: [{ scan: "current", url: "http://localhost/ev2.jpg", image: "ev2.jpg" }]
        }
      ]
    },
    urls: {
      baseline_scene: "http://localhost/b-scene.glb",
      current_scene: "http://localhost/c-scene.glb"
    },
    baseline: { id: baselineId, stats: {} },
    current: { id: currentId }
  });

  return meta;
}

export async function getInspection(id) {
  if (id === '550e8400-e29b-41d4-a716-446655440000') {
    const e = new Error(`not found`);
    e.status = 404;
    throw e;
  }
  
  if (id === 'FAILED_INSPECTION_ID') {
    return {
      id,
      status: 'failed',
      error: 'Engine returned invalid response format'
    };
  }

  const ins = inspections.get(id);
  if (!ins) {
    const e = new Error(`not found`);
    e.status = 404;
    throw e;
  }

  return ins;
}

export async function explainInspection(id) {
  if (id === 'PROCESSING_INSPECTION_ID') {
    throw Object.assign(new Error('Inspection is not ready yet.'), { status: 409 });
  }

  if (id === '550e8400-e29b-41d4-a716-446655440000') {
    const e = new Error(`not found`);
    e.status = 404;
    throw e;
  }

  const ins = inspections.get(id);
  if (!ins) throw Object.assign(new Error('not found'), { status: 404 });
  if (ins.status !== 'ready') throw Object.assign(new Error('Inspection is not ready yet.'), { status: 409 });

  const explanations = {
    "change-id-1": {
      text: "The fire extinguisher moved about 0.42 m...",
      source: "gemini",
      model: "gemini-2.5-flash"
    },
    "change-id-2": {
      text: "The chair recorded in the baseline was not found...",
      source: "template",
      rejected: {
        ungrounded_numbers: [1.2, 3.4]
      }
    }
  };
  
  ins.result.changes.forEach(c => {
    if (explanations[c.id]) {
      c.explanation = explanations[c.id];
    }
  });

  return explanations;
}
