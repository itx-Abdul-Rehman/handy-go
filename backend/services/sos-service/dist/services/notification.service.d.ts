/**
 * Send notification to a user
 */
export declare const sendNotification: (recipientId: string, notification: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}, channels?: string[]) => Promise<boolean>;
/**
 * Send SOS alert to all admins
 */
export declare const sendSOSAlertToAdmins: (adminIds: string[], sosDetails: {
    sosId: string;
    bookingNumber?: string;
    priority: string;
    description: string;
    location?: {
        lat: number;
        lng: number;
    };
}) => Promise<void>;
/**
 * Send SOS confirmation to the user who triggered it
 */
export declare const sendSOSConfirmation: (userId: string, sosId: string, priority: string) => Promise<void>;
/**
 * Send SOS resolved notification
 */
export declare const sendSOSResolved: (userId: string, sosId: string, resolution: string) => Promise<void>;
/**
 * Send escalation notification
 */
export declare const sendEscalationNotification: (seniorAdminIds: string[], sosDetails: {
    sosId: string;
    originalPriority: string;
    newPriority: string;
    escalationReason: string;
}) => Promise<void>;
declare const _default: {
    sendNotification: (recipientId: string, notification: {
        type: string;
        title: string;
        body: string;
        data?: Record<string, string>;
    }, channels?: string[]) => Promise<boolean>;
    sendSOSAlertToAdmins: (adminIds: string[], sosDetails: {
        sosId: string;
        bookingNumber?: string;
        priority: string;
        description: string;
        location?: {
            lat: number;
            lng: number;
        };
    }) => Promise<void>;
    sendSOSConfirmation: (userId: string, sosId: string, priority: string) => Promise<void>;
    sendSOSResolved: (userId: string, sosId: string, resolution: string) => Promise<void>;
    sendEscalationNotification: (seniorAdminIds: string[], sosDetails: {
        sosId: string;
        originalPriority: string;
        newPriority: string;
        escalationReason: string;
    }) => Promise<void>;
};
export default _default;
//# sourceMappingURL=notification.service.d.ts.map