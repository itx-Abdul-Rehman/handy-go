export interface MatchedWorker {
    workerId: string;
    name: string;
    profileImage?: string;
    rating: {
        average: number;
        count: number;
    };
    trustScore: number;
    distance: number;
    estimatedArrival: number;
    matchScore: number;
    hourlyRate: number;
}
export interface ProblemAnalysis {
    detectedServices: string[];
    confidence: number;
    suggestedQuestions: string[];
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface PriceEstimate {
    estimatedPrice: {
        min: number;
        max: number;
        average: number;
    };
    breakdown: {
        laborCost: {
            min: number;
            max: number;
        };
        estimatedMaterials: {
            min: number;
            max: number;
        };
        platformFee: number;
    };
    priceFactors: string[];
}
export interface DurationEstimate {
    estimatedMinutes: number;
    range: {
        min: number;
        max: number;
    };
    confidence: number;
}
/**
 * Analyze problem description using AI
 */
export declare const analyzeProblem: (problemDescription: string, serviceCategory?: string) => Promise<ProblemAnalysis>;
/**
 * Find matching workers for a job
 */
export declare const findWorkers: (criteria: {
    serviceCategory: string;
    location: {
        lat: number;
        lng: number;
    };
    scheduledDateTime: Date;
    isUrgent: boolean;
    problemComplexity?: "LOW" | "MEDIUM" | "HIGH";
}) => Promise<{
    workers: MatchedWorker[];
    totalAvailable: number;
}>;
/**
 * Estimate price for a job
 */
export declare const estimatePrice: (data: {
    serviceCategory: string;
    problemDescription: string;
    city: string;
}) => Promise<PriceEstimate>;
/**
 * Estimate duration for a job
 */
export declare const estimateDuration: (data: {
    serviceCategory: string;
    problemDescription: string;
}) => Promise<DurationEstimate>;
/**
 * Request auto-replacement of worker
 */
export declare const autoReplaceWorker: (bookingId: string, excludeWorkerIds: string[]) => Promise<{
    newWorkerId: string | null;
    success: boolean;
}>;
declare const _default: {
    analyzeProblem: (problemDescription: string, serviceCategory?: string) => Promise<ProblemAnalysis>;
    findWorkers: (criteria: {
        serviceCategory: string;
        location: {
            lat: number;
            lng: number;
        };
        scheduledDateTime: Date;
        isUrgent: boolean;
        problemComplexity?: "LOW" | "MEDIUM" | "HIGH";
    }) => Promise<{
        workers: MatchedWorker[];
        totalAvailable: number;
    }>;
    estimatePrice: (data: {
        serviceCategory: string;
        problemDescription: string;
        city: string;
    }) => Promise<PriceEstimate>;
    estimateDuration: (data: {
        serviceCategory: string;
        problemDescription: string;
    }) => Promise<DurationEstimate>;
    autoReplaceWorker: (bookingId: string, excludeWorkerIds: string[]) => Promise<{
        newWorkerId: string | null;
        success: boolean;
    }>;
};
export default _default;
//# sourceMappingURL=matching.service.d.ts.map