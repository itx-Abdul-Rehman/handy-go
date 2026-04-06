export declare const NOTIFICATION_TEMPLATES: {
    BOOKING_CREATED: {
        title: string;
        body: string;
        type: string;
    };
    WORKER_ASSIGNED: {
        title: string;
        body: string;
        type: string;
    };
    WORKER_ACCEPTED: {
        title: string;
        body: string;
        type: string;
    };
    WORKER_REJECTED: {
        title: string;
        body: string;
        type: string;
    };
    WORKER_ARRIVING: {
        title: string;
        body: string;
        type: string;
    };
    JOB_STARTED: {
        title: string;
        body: string;
        type: string;
    };
    JOB_COMPLETED: {
        title: string;
        body: string;
        type: string;
    };
    BOOKING_CANCELLED: {
        title: string;
        body: string;
        type: string;
    };
    BOOKING_REMINDER: {
        title: string;
        body: string;
        type: string;
    };
    NEW_JOB_AVAILABLE: {
        title: string;
        body: string;
        type: string;
    };
    JOB_TIMEOUT_WARNING: {
        title: string;
        body: string;
        type: string;
    };
    JOB_REASSIGNED: {
        title: string;
        body: string;
        type: string;
    };
    PAYMENT_RECEIVED: {
        title: string;
        body: string;
        type: string;
    };
    PAYMENT_PENDING: {
        title: string;
        body: string;
        type: string;
    };
    EARNINGS_TRANSFERRED: {
        title: string;
        body: string;
        type: string;
    };
    SOS_ALERT: {
        title: string;
        body: string;
        type: string;
    };
    SOS_RESOLVED: {
        title: string;
        body: string;
        type: string;
    };
    PROFILE_VERIFIED: {
        title: string;
        body: string;
        type: string;
    };
    ACCOUNT_SUSPENDED: {
        title: string;
        body: string;
        type: string;
    };
    DOCUMENT_APPROVED: {
        title: string;
        body: string;
        type: string;
    };
    DOCUMENT_REJECTED: {
        title: string;
        body: string;
        type: string;
    };
    PROMO_CODE: {
        title: string;
        body: string;
        type: string;
    };
    RATING_REQUEST: {
        title: string;
        body: string;
        type: string;
    };
};
export type NotificationTemplateKey = keyof typeof NOTIFICATION_TEMPLATES;
/**
 * Render a notification template with variables
 */
export declare const renderTemplate: (templateKey: NotificationTemplateKey, variables: Record<string, string>) => {
    title: string;
    body: string;
    type: string;
};
declare const _default: {
    NOTIFICATION_TEMPLATES: {
        BOOKING_CREATED: {
            title: string;
            body: string;
            type: string;
        };
        WORKER_ASSIGNED: {
            title: string;
            body: string;
            type: string;
        };
        WORKER_ACCEPTED: {
            title: string;
            body: string;
            type: string;
        };
        WORKER_REJECTED: {
            title: string;
            body: string;
            type: string;
        };
        WORKER_ARRIVING: {
            title: string;
            body: string;
            type: string;
        };
        JOB_STARTED: {
            title: string;
            body: string;
            type: string;
        };
        JOB_COMPLETED: {
            title: string;
            body: string;
            type: string;
        };
        BOOKING_CANCELLED: {
            title: string;
            body: string;
            type: string;
        };
        BOOKING_REMINDER: {
            title: string;
            body: string;
            type: string;
        };
        NEW_JOB_AVAILABLE: {
            title: string;
            body: string;
            type: string;
        };
        JOB_TIMEOUT_WARNING: {
            title: string;
            body: string;
            type: string;
        };
        JOB_REASSIGNED: {
            title: string;
            body: string;
            type: string;
        };
        PAYMENT_RECEIVED: {
            title: string;
            body: string;
            type: string;
        };
        PAYMENT_PENDING: {
            title: string;
            body: string;
            type: string;
        };
        EARNINGS_TRANSFERRED: {
            title: string;
            body: string;
            type: string;
        };
        SOS_ALERT: {
            title: string;
            body: string;
            type: string;
        };
        SOS_RESOLVED: {
            title: string;
            body: string;
            type: string;
        };
        PROFILE_VERIFIED: {
            title: string;
            body: string;
            type: string;
        };
        ACCOUNT_SUSPENDED: {
            title: string;
            body: string;
            type: string;
        };
        DOCUMENT_APPROVED: {
            title: string;
            body: string;
            type: string;
        };
        DOCUMENT_REJECTED: {
            title: string;
            body: string;
            type: string;
        };
        PROMO_CODE: {
            title: string;
            body: string;
            type: string;
        };
        RATING_REQUEST: {
            title: string;
            body: string;
            type: string;
        };
    };
    renderTemplate: (templateKey: NotificationTemplateKey, variables: Record<string, string>) => {
        title: string;
        body: string;
        type: string;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map