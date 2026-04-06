/**
 * Assess SOS priority based on description and context
 */
export declare const assessPriority: (description: string, context?: {
    timeOfDay?: Date;
    hasActiveBooking?: boolean;
    userHistory?: {
        previousSOS: number;
        validSOS: number;
    };
}) => {
    priority: string;
    confidence: number;
    reasons: string[];
    recommendedActions: string[];
};
/**
 * Analyze if SOS seems like a false alarm
 */
export declare const detectPotentialFalseAlarm: (description: string, context?: {
    bookingStatus?: string;
    timeSinceBookingStart?: number;
}) => {
    isSuspicious: boolean;
    reasons: string[];
};
declare const _default: {
    assessPriority: (description: string, context?: {
        timeOfDay?: Date;
        hasActiveBooking?: boolean;
        userHistory?: {
            previousSOS: number;
            validSOS: number;
        };
    }) => {
        priority: string;
        confidence: number;
        reasons: string[];
        recommendedActions: string[];
    };
    detectPotentialFalseAlarm: (description: string, context?: {
        bookingStatus?: string;
        timeSinceBookingStart?: number;
    }) => {
        isSuspicious: boolean;
        reasons: string[];
    };
};
export default _default;
//# sourceMappingURL=priority-assessor.d.ts.map