import { Response } from 'express';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Standard API Response Interface
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a success response
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HTTP_STATUS.OK
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a created response (201)
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response<ApiResponse<T>> => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED as number);
};

/**
 * Send an error response
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: Array<{ field?: string; message: string }>
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Send a validation error response
 */
export const validationErrorResponse = (
  res: Response,
  errors: Array<{ field?: string; message: string }>
): Response<ApiResponse> => {
  return errorResponse(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY as number, errors);
};

/**
 * Send an unauthorized response
 */
export const unauthorizedResponse = (
  res: Response,
  message = 'Unauthorized access'
): Response<ApiResponse> => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED as number);
};

/**
 * Send a forbidden response
 */
export const forbiddenResponse = (
  res: Response,
  message = 'Access forbidden'
): Response<ApiResponse> => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN as number);
};

/**
 * Send a not found response
 */
export const notFoundResponse = (
  res: Response,
  message = 'Resource not found'
): Response<ApiResponse> => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND as number);
};

/**
 * Send a conflict response
 */
export const conflictResponse = (
  res: Response,
  message = 'Resource already exists'
): Response<ApiResponse> => {
  return errorResponse(res, message, HTTP_STATUS.CONFLICT as number);
};

/**
 * Send a paginated response
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'Success'
): Response<ApiResponse<T[]>> => {
  const totalPages = Math.ceil(total / limit);

  return res.status(HTTP_STATUS.OK as number).json({
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
export const noContentResponse = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT as number).send();
};

/**
 * Send a rate limit exceeded response
 */
export const rateLimitResponse = (
  res: Response,
  message = 'Too many requests, please try again later'
): Response<ApiResponse> => {
  return errorResponse(res, message, HTTP_STATUS.TOO_MANY_REQUESTS as number);
};
