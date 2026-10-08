// Contract for engine/hf_space/sanjaya/inspection.py (format sanjaya.inspection/0.1).
// The engine's response is validated here before anything is stored or shown.
import { z } from 'zod';

const vec3 = z.array(z.number()).length(3);

export const evidenceSchema = z.object({
  scan: z.enum(['baseline', 'current']),
  kind: z.string(),
  image: z.string().nullable(),
  box: z.array(z.number()).length(4).nullable(),
  pixel: z.array(z.number()).length(2).nullable(),
  note: z.string(),
});

export const changeEventSchema = z.object({
  id: z.string(),
  type: z.enum(['object_moved', 'object_appeared', 'object_disappeared', 'geometry_added', 'geometry_removed']),
  label: z.string().nullable(),
  baseline_position: vec3.nullable(),
  current_position: vec3.nullable(),
  displacement_m: z.number().nullable(),
  displacement_range_m: z.array(z.number()).length(2).nullable(),
  uncertainty_m: z.number(),
  region: z.object({ bbox_min: vec3, bbox_max: vec3, volume_m3: z.number(), voxels: z.number() }).nullable(),
  evidence: z.array(evidenceSchema),
  support: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high']),
  baseline_session: z.string(),
  current_session: z.string(),
  baseline_time: z.string().nullable(),
  current_time: z.string().nullable(),
});

export const inspectionResultSchema = z.object({
  format: z.literal('sanjaya.inspection/0.1'),
  status: z.enum(['ok', 'alignment_failed']),
  unit: z.enum(['m', 'units']),
  alignment: z.object({ fitness: z.number(), rmse: z.number() }).passthrough().nullable(),
  changes: z.array(changeEventSchema),
  unverified: z.array(z.object({
    type: z.string(), label: z.string().nullable(), position: vec3, reason: z.string(), support: z.record(z.any()),
  })),
  summary: z.object({ changes: z.number(), high: z.number(), unverified: z.number() }).passthrough(),
  warnings: z.array(z.string()),
  limitations: z.array(z.string()),
}).passthrough();

export const createInspectionSchema = z.object({
  baselineId: z.string().uuid(),
  currentId: z.string().uuid(),
  markerSizeCm: z.coerce.number().min(0).max(100).default(0),
});

export const createMissionQuery = z.object({
  scene: z.enum(['Indoor', 'Outdoor']).default('Indoor'),
  label: z.string().trim().max(120).optional(),
});

export const idParams = z.object({ id: z.string().uuid() });
