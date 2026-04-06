import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: Array<{ field?: string; message: string }>;

  constructor(errors: Array<{ field?: string; message: string }>) {
    super('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', errorCode = ERROR_CODES.INVALID_CREDENTIALS) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', errorCode = 'CONFLICT') {
    super(message, HTTP_STATUS.CONFLICT, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  errors?: Array<{ field?: string; message: string }>;
  stack?: string;
}

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log the error
  logger.error('Error occurred', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Default error values
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
  let errors: Array<{ field?: string; message: string }> | undefined;

  // Handle known operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;

    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    // Parse Mongoose validation errors
    const mongooseErrors = err as any;
    if (mongooseErrors.errors) {
      errors = Object.keys(mongooseErrors.errors).map(key => ({
        field: key,
        message: mongooseErrors.errors[key].message,
      }));
    }
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
    errorCode = 'INVALID_ID';
  }
  // Handle Mongoose duplicate key error
  else if ((err as any).code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate entry';
    errorCode = 'DUPLICATE_ENTRY';
    const keyValue = (err as any).keyValue;
    if (keyValue) {
      const field = Object.keys(keyValue)[0];
      errors = [{ field, message: `${field} already exists` }];
    }
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
    errorCode = ERROR_CODES.TOKEN_INVALID;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token has expired';
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    message,
    errorCode,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response): Response => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Joi Validation Middleware
 * Validates request body/query/params against a Joi schema
 */
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};
