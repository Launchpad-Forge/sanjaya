import express, { Router } from 'express';
import { env } from '../config/env.js';
import { handle } from '../middleware/errorHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { createMission, getMission } from '../services/mission.service.js';
import { createMissionQuery, idParams } from '../validators/inspection.validator.js';

import { decodeImageArchive } from '../validators/imageArchive.js';

const router = Router();
const scanLimit = rateLimit({ limit: env.SCANS_PER_HOUR, windowMs: 3600_000, message: 'Scan limit reached for this hour.' });

// POST /api/missions?scene=Indoor&label=...   body: the recorded video (video/webm, video/mp4, ...)
// 202 { id, status: "processing" }; poll GET /api/missions/:id until status is "ready" or "failed".
router.post(
  '/',
  scanLimit,
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: '100mb' }),
  validate(createMissionQuery, 'query'),
  handle(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length < 1024) {
      return res.status(400).json({ error: 'Send the recorded video as the request body (Content-Type video/webm or video/mp4).' });
    }
    res.status(202).json(await createMission(req.body, req.get('content-type'), req.query));
  }),
);

router.post('/images', scanLimit, express.raw({ type: 'application/zip', limit: '80mb' }), validate(createMissionQuery, 'query'), handle(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Choose at least 3 photos.' });
  const images = decodeImageArchive(req.body);
  res.status(202).json(await createMission(images, 'application/zip', { ...req.query, source: 'images' }));
}));

router.get('/:id', validate(idParams, 'params'), handle(async (req, res) => res.json(await getMission(req.params.id))));

export default router;
