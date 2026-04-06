export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
/**
 * Send email
 */
export declare const sendEmail: (options: EmailOptions) => Promise<boolean>;
/**
 * Send templated email
 */
export declare const sendTemplatedEmail: (to: string, template: keyof typeof EMAIL_TEMPLATES, variables: Record<string, string>) => Promise<boolean>;
export declare const EMAIL_TEMPLATES: {
    WELCOME: {
        subject: string;
        html: string;
    };
    BOOKING_CONFIRMATION: {
        subject: string;
        html: string;
    };
    JOB_COMPLETED: {
        subject: string;
        html: string;
    };
    PASSWORD_RESET: {
        subject: string;
        html: string;
    };
};
declare const _default: {
    sendEmail: (options: EmailOptions) => Promise<boolean>;
    sendTemplatedEmail: (to: string, template: keyof typeof EMAIL_TEMPLATES, variables: Record<string, string>) => Promise<boolean>;
    EMAIL_TEMPLATES: {
        WELCOME: {
            subject: string;
            html: string;
        };
        BOOKING_CONFIRMATION: {
            subject: string;
            html: string;
        };
        JOB_COMPLETED: {
            subject: string;
            html: string;
        };
        PASSWORD_RESET: {
            subject: string;
            html: string;
        };
    };
};
export default _default;
//# sourceMappingURL=email.service.d.ts.map