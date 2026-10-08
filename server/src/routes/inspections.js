import { Router } from 'express';
import { handle } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { createInspection, explainInspection, getInspection } from '../services/inspection.service.js';
import { createInspectionSchema, idParams } from '../validators/inspection.validator.js';

const router = Router();

// POST /api/inspections { baselineId, currentId, markerSizeCm? } -> 202 { id, status: "processing" }
router.post('/', validate(createInspectionSchema), handle(async (req, res) => {
  res.status(202).json(await createInspection(req.body));
}));

// GET /api/inspections/:id -> status, result (changes with signed evidence URLs), scene URLs
router.get('/:id', validate(idParams, 'params'), handle(async (req, res) => {
  res.json(await getInspection(req.params.id));
}));

// POST /api/inspections/:id/explain -> { [changeId]: { text, source: "gemini" | "template" } }
router.post('/:id/explain', validate(idParams, 'params'), handle(async (req, res) => {
  res.json(await explainInspection(req.params.id));
}));

export default router;
