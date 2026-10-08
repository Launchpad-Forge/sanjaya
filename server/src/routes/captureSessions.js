import express, { Router } from 'express';
import { createPairing, getPairing, uploadPairedScan } from '../services/pairing.service.js';
import { handle } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { idParams, createMissionQuery } from '../validators/inspection.validator.js';
import { env } from '../config/env.js';
const router = Router();
router.post('/', rateLimit({ limit: 20, windowMs: 3600_000 }), handle(async (req, res) => res.status(201).json(await createPairing())));
router.get('/:id', validate(idParams, 'params'), handle(async (req, res) => res.json(await getPairing(req.params.id, req.get('X-Pairing-Token')))));
router.post('/:id/scan', rateLimit({ limit: env.SCANS_PER_HOUR, windowMs: 3600_000 }), validate(idParams, 'params'), validate(createMissionQuery, 'query'), express.raw({ type: 'video/*', limit: '100mb' }), handle(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 1024) return res.status(400).json({ error: 'Record a video before sending the scan.' });
  res.status(202).json(await uploadPairedScan(req.params.id, req.get('X-Pairing-Token'), req.body, req.get('Content-Type'), req.query));
}));
export default router;
