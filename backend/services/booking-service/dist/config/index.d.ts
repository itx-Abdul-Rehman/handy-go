export declare const config: {
    nodeEnv: string;
    port: number;
    mongodbUri: string;
    jwtSecret: string;
    corsOrigin: string;
    services: {
        matching: string;
        notification: string;
        user: string;
    };
    booking: {
        workerAcceptanceTimeout: number;
        cancellationWindowHours: number;
        cancellationPenaltyPercent: number;
        maxActiveBookingsPerCustomer: number;
        reminderBeforeMinutes: number;
    };
    platformFee: {
        percentage: number;
        minFee: number;
        maxFee: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
};
//# sourceMappingURL=index.d.ts.map