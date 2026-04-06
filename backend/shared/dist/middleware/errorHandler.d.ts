import { Request, Response, NextFunction } from 'express';
/**
 * Custom Error Classes
 */
export declare class AppError extends Error {
    statusCode: number;
    errorCode: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number, errorCode: string);
}
export declare class ValidationError extends AppError {
    errors: Array<{
        field?: string;
        message: string;
    }>;
    constructor(errors: Array<{
        field?: string;
        message: string;
    }>);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, errorCode?: "AUTH001");
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, errorCode?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Global Error Handler Middleware
 */
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => Response;
/**
 * 404 Not Found Handler
 */
export declare const notFoundHandler: (req: Request, res: Response) => Response;
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Joi Validation Middleware
 * Validates request body/query/params against a Joi schema
 */
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map