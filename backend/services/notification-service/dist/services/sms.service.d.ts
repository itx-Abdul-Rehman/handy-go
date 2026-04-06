/**
 * Send SMS to a phone number
 */
export declare const sendSMS: (to: string, message: string) => Promise<boolean>;
/**
 * Send SMS notification based on template
 */
export declare const sendSMSNotification: (phone: string, template: string, variables: Record<string, string>) => Promise<boolean>;
export declare const SMS_TEMPLATES: {
    OTP: string;
    BOOKING_CONFIRMED: string;
    WORKER_ARRIVING: string;
    JOB_COMPLETED: string;
    SOS_ALERT: string;
};
declare const _default: {
    sendSMS: (to: string, message: string) => Promise<boolean>;
    sendSMSNotification: (phone: string, template: string, variables: Record<string, string>) => Promise<boolean>;
    SMS_TEMPLATES: {
        OTP: string;
        BOOKING_CONFIRMED: string;
        WORKER_ARRIVING: string;
        JOB_COMPLETED: string;
        SOS_ALERT: string;
    };
};
export default _default;
//# sourceMappingURL=sms.service.d.ts.map