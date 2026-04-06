/**
 * Auto-escalate unassigned SOS based on time and priority
 * Runs every 2 minutes
 */
export declare const startAutoEscalationJob: () => void;
/**
 * Send reminders for active SOS that haven't been resolved
 * Runs every 5 minutes
 */
export declare const startReminderJob: () => void;
/**
 * Generate daily SOS summary report
 * Runs at midnight every day
 */
export declare const startDailySummaryJob: () => void;
export declare const startAllJobs: () => void;
declare const _default: {
    startAllJobs: () => void;
    startAutoEscalationJob: () => void;
    startReminderJob: () => void;
    startDailySummaryJob: () => void;
};
export default _default;
//# sourceMappingURL=sos.jobs.d.ts.map