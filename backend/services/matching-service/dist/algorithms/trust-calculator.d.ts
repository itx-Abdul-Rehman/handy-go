export interface TrustScoreBreakdown {
    rating: number;
    completionRate: number;
    onTimeRate: number;
    complaints: number;
    accountAge: number;
    totalScore: number;
}
/**
 * Calculate trust score for a worker
 */
export declare const calculateTrustScore: (workerId: string) => Promise<{
    trustScore: number;
    breakdown: TrustScoreBreakdown;
}>;
/**
 * Update trust score for a worker (call after booking completion or review)
 */
export declare const updateWorkerTrustScore: (workerId: string) => Promise<number>;
/**
 * Batch update trust scores for all workers
 */
export declare const batchUpdateTrustScores: () => Promise<number>;
declare const _default: {
    calculateTrustScore: (workerId: string) => Promise<{
        trustScore: number;
        breakdown: TrustScoreBreakdown;
    }>;
    updateWorkerTrustScore: (workerId: string) => Promise<number>;
    batchUpdateTrustScores: () => Promise<number>;
};
export default _default;
//# sourceMappingURL=trust-calculator.d.ts.map