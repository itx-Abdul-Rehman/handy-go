import { asyncHandler, successResponse, } from '@handy-go/shared';
import problemAnalyzer from '../algorithms/problem-analyzer.js';
import workerMatcher from '../algorithms/worker-matcher.js';
import pricePredictor from '../algorithms/price-predictor.js';
import trustCalculator from '../algorithms/trust-calculator.js';
/**
 * Analyze problem description
 * POST /api/matching/analyze-problem
 */
export const analyzeProblem = asyncHandler(async (req, res) => {
    const { problemDescription, serviceCategory } = req.body;
    const analysis = problemAnalyzer.analyzeProblem(problemDescription, serviceCategory);
    return successResponse(res, analysis, 'Problem analyzed successfully');
});
/**
 * Find matching workers
 * POST /api/matching/find-workers
 */
export const findWorkers = asyncHandler(async (req, res) => {
    const { serviceCategory, location, scheduledDateTime, isUrgent, problemComplexity } = req.body;
    const result = await workerMatcher.findMatchingWorkers({
        serviceCategory,
        location,
        scheduledDateTime: new Date(scheduledDateTime),
        isUrgent: isUrgent || false,
        problemComplexity,
    });
    return successResponse(res, result, 'Workers found');
});
/**
 * Estimate price
 * POST /api/matching/estimate-price
 */
export const estimatePrice = asyncHandler(async (req, res) => {
    const { serviceCategory, problemDescription, location } = req.body;
    const estimate = await pricePredictor.estimatePrice({
        serviceCategory,
        problemDescription,
        city: location.city,
    });
    return successResponse(res, estimate, 'Price estimated');
});
/**
 * Estimate duration
 * POST /api/matching/estimate-duration
 */
export const estimateDuration = asyncHandler(async (req, res) => {
    const { serviceCategory, problemDescription } = req.body;
    const estimate = await pricePredictor.estimateDuration({
        serviceCategory,
        problemDescription,
    });
    return successResponse(res, estimate, 'Duration estimated');
});
/**
 * Calculate trust score for a worker
 * POST /api/matching/calculate-trust-score (internal)
 */
export const calculateTrustScore = asyncHandler(async (req, res) => {
    const { workerId } = req.body;
    const result = await trustCalculator.calculateTrustScore(workerId);
    return successResponse(res, result, 'Trust score calculated');
});
/**
 * Auto-replace worker for a booking
 * POST /api/matching/auto-replace-worker (internal)
 */
export const autoReplaceWorker = asyncHandler(async (req, res) => {
    const { bookingId, excludeWorkerIds } = req.body;
    const result = await workerMatcher.findReplacementWorker(bookingId, excludeWorkerIds || []);
    return successResponse(res, result, result.success ? 'Worker replaced' : 'No replacement found');
});
/**
 * Update trust scores for all workers (admin/cron)
 * POST /api/matching/admin/update-trust-scores
 */
export const batchUpdateTrustScores = asyncHandler(async (req, res) => {
    const updatedCount = await trustCalculator.batchUpdateTrustScores();
    return successResponse(res, { updatedCount }, `Updated trust scores for ${updatedCount} workers`);
});
//# sourceMappingURL=matching.controller.js.map