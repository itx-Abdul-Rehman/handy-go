import winston from 'winston';
const { combine, timestamp, printf, colorize, json } = winston.format;
// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
    defaultMeta: { service: process.env.SERVICE_NAME || 'handy-go' },
    transports: [
        // Write all logs with importance level of 'error' or less to error.log
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// If we're not in production, log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
    }));
}
// Stream for Morgan HTTP logging
export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Helper methods for structured logging
export const logInfo = (message, meta) => {
    logger.info(message, meta);
};
export const logError = (message, error, meta) => {
    logger.error(message, {
        ...meta,
        error: error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            }
            : undefined,
    });
};
export const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
export const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
export const logHttp = (message, meta) => {
    logger.http(message, meta);
};
export default logger;
//# sourceMappingURL=logger.js.map