import { Router } from 'express';
import * as matchingController from '../controllers/matching.controller.js';
import { validate } from '@handy-go/shared';
import { analyzeProblemSchema, findWorkersSchema, estimatePriceSchema, estimateDurationSchema, calculateTrustScoreSchema, autoReplaceWorkerSchema, } from '../validators/matching.validators.js';
const router = Router();
/**
 * @route   POST /api/matching/analyze-problem
 * @desc    Analyze problem description using NLP
 * @access  Public (called from booking service)
 */
router.post('/analyze-problem', validate(analyzeProblemSchema), matchingController.analyzeProblem);
/**
 * @route   POST /api/matching/find-workers
 * @desc    Find matching workers based on criteria
 * @access  Public (called from booking service)
 */
router.post('/find-workers', validate(findWorkersSchema), matchingController.findWorkers);
/**
 * @route   POST /api/matching/estimate-price
 * @desc    Estimate price for a service
 * @access  Public (called from booking service)
 */
router.post('/estimate-price', validate(estimatePriceSchema), matchingController.estimatePrice);
/**
 * @route   POST /api/matching/estimate-duration
 * @desc    Estimate duration for a service
 * @access  Public (called from booking service)
 */
router.post('/estimate-duration', validate(estimateDurationSchema), matchingController.estimateDuration);
/**
 * @route   POST /api/matching/calculate-trust-score
 * @desc    Calculate trust score for a worker (internal)
 * @access  Internal
 */
router.post('/calculate-trust-score', validate(calculateTrustScoreSchema), matchingController.calculateTrustScore);
/**
 * @route   POST /api/matching/auto-replace-worker
 * @desc    Auto-replace worker for a booking (internal)
 * @access  Internal
 */
router.post('/auto-replace-worker', validate(autoReplaceWorkerSchema), matchingController.autoReplaceWorker);
/**
 * @route   POST /api/matching/admin/update-trust-scores
 * @desc    Batch update trust scores for all workers
 * @access  Admin/Internal
 */
router.post('/admin/update-trust-scores', matchingController.batchUpdateTrustScores);
export default router;
//# sourceMappingURL=matching.routes.js.map