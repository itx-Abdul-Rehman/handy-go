export declare const config: {
    nodeEnv: string;
    port: number;
    mongoUri: string;
    jwt: {
        secret: string;
    };
    corsOrigins: string[];
    serviceKey: string;
    firebase: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
    };
    twilio: {
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    };
    email: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        fromName: string;
        fromEmail: string;
    };
    notifications: {
        defaultChannels: string[];
        maxRetries: number;
        retryDelayMs: number;
    };
};
//# sourceMappingURL=index.d.ts.map