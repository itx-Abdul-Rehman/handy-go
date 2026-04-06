import { Request, Response, NextFunction } from 'express';
interface RequestWithId extends Request {
    requestId?: string;
    startTime?: number;
}
/**
 * Middleware to add a unique request ID to each request
 * Useful for tracing requests across microservices
 */
export declare const requestId: (req: RequestWithId, res: Response, next: NextFunction) => void;
/**
 * Middleware to log requests with timing information
 */
export declare const requestLogger: (req: RequestWithId, res: Response, next: NextFunction) => void;
/**
 * Middleware to parse and validate content type
 */
export declare const contentTypeValidator: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Security headers middleware
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS preflight handler
 */
export declare const handlePreflight: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=common.d.ts.map