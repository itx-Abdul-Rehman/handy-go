/**
 * Calculate platform fee for a booking
 */
export declare const calculatePlatformFee: (amount: number) => number;
/**
 * Calculate total pricing breakdown
 */
export declare const calculatePricing: (params: {
    laborCost: number;
    materialsCost?: number;
    discount?: number;
}) => {
    laborCost: number;
    materialsCost: number;
    platformFee: number;
    discount: number;
    subtotal: number;
    total: number;
};
/**
 * Calculate cancellation fee
 */
export declare const calculateCancellationFee: (estimatedPrice: number, hoursBeforeScheduled: number) => number;
/**
 * Calculate worker earnings from a booking
 */
export declare const calculateWorkerEarnings: (finalPrice: number, platformFee: number) => number;
declare const _default: {
    calculatePlatformFee: (amount: number) => number;
    calculatePricing: (params: {
        laborCost: number;
        materialsCost?: number;
        discount?: number;
    }) => {
        laborCost: number;
        materialsCost: number;
        platformFee: number;
        discount: number;
        subtotal: number;
        total: number;
    };
    calculateCancellationFee: (estimatedPrice: number, hoursBeforeScheduled: number) => number;
    calculateWorkerEarnings: (finalPrice: number, platformFee: number) => number;
};
export default _default;
//# sourceMappingURL=pricing.service.d.ts.map