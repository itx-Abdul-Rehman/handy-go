import axios from 'axios';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';
const matchingClient = axios.create({
    baseURL: config.services.matching,
    timeout: 10000,
});
/**
 * Analyze problem description using AI
 */
export const analyzeProblem = async (problemDescription, serviceCategory) => {
    try {
        const response = await matchingClient.post('/api/matching/analyze-problem', {
            problemDescription,
            serviceCategory,
        });
        return response.data.data;
    }
    catch (error) {
        logger.error('Error analyzing problem:', error);
        // Return fallback response
        return {
            detectedServices: serviceCategory ? [serviceCategory] : [],
            confidence: 0.5,
            suggestedQuestions: [],
            urgencyLevel: 'MEDIUM',
        };
    }
};
/**
 * Find matching workers for a job
 */
export const findWorkers = async (criteria) => {
    try {
        const response = await matchingClient.post('/api/matching/find-workers', criteria);
        return response.data.data;
    }
    catch (error) {
        logger.error('Error finding workers:', error);
        return { workers: [], totalAvailable: 0 };
    }
};
/**
 * Estimate price for a job
 */
export const estimatePrice = async (data) => {
    try {
        const response = await matchingClient.post('/api/matching/estimate-price', {
            serviceCategory: data.serviceCategory,
            problemDescription: data.problemDescription,
            location: { city: data.city },
        });
        return response.data.data;
    }
    catch (error) {
        logger.error('Error estimating price:', error);
        // Return fallback estimate
        return {
            estimatedPrice: { min: 500, max: 2000, average: 1000 },
            breakdown: {
                laborCost: { min: 400, max: 1500 },
                estimatedMaterials: { min: 100, max: 500 },
                platformFee: 150,
            },
            priceFactors: ['Standard rate applied'],
        };
    }
};
/**
 * Estimate duration for a job
 */
export const estimateDuration = async (data) => {
    try {
        const response = await matchingClient.post('/api/matching/estimate-duration', data);
        return response.data.data;
    }
    catch (error) {
        logger.error('Error estimating duration:', error);
        // Return fallback estimate
        return {
            estimatedMinutes: 60,
            range: { min: 30, max: 120 },
            confidence: 0.5,
        };
    }
};
/**
 * Request auto-replacement of worker
 */
export const autoReplaceWorker = async (bookingId, excludeWorkerIds) => {
    try {
        const response = await matchingClient.post('/api/matching/auto-replace-worker', {
            bookingId,
            excludeWorkerIds,
        });
        return response.data.data;
    }
    catch (error) {
        logger.error('Error auto-replacing worker:', error);
        return { newWorkerId: null, success: false };
    }
};
export default {
    analyzeProblem,
    findWorkers,
    estimatePrice,
    estimateDuration,
    autoReplaceWorker,
};
//# sourceMappingURL=matching.service.js.map