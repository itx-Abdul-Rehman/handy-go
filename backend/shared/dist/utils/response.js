import { HTTP_STATUS } from '../constants/index.js';
/**
 * Send a success response
 */
export const successResponse = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
/**
 * Send a created response (201)
 */
export const createdResponse = (res, data, message = 'Resource created successfully') => {
    return successResponse(res, data, message, HTTP_STATUS.CREATED);
};
/**
 * Send an error response
 */
export const errorResponse = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
/**
 * Send a validation error response
 */
export const validationErrorResponse = (res, errors) => {
    return errorResponse(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};
/**
 * Send an unauthorized response
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED);
};
/**
 * Send a forbidden response
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
    return errorResponse(res, message, HTTP_STATUS.FORBIDDEN);
};
/**
 * Send a not found response
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
    return errorResponse(res, message, HTTP_STATUS.NOT_FOUND);
};
/**
 * Send a conflict response
 */
export const conflictResponse = (res, message = 'Resource already exists') => {
    return errorResponse(res, message, HTTP_STATUS.CONFLICT);
};
/**
 * Send a paginated response
 */
export const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    });
};
/**
 * Send a no content response (204)
 */
export const noContentResponse = (res) => {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
};
/**
 * Send a rate limit exceeded response
 */
export const rateLimitResponse = (res, message = 'Too many requests, please try again later') => {
    return errorResponse(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
};
//# sourceMappingURL=response.js.map