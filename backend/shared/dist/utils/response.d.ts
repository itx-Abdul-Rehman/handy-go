import { Response } from 'express';
/**
 * Standard API Response Interface
 */
interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Array<{
        field?: string;
        message: string;
    }>;
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
export declare const successResponse: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<ApiResponse<T>>;
/**
 * Send a created response (201)
 */
export declare const createdResponse: <T>(res: Response, data: T, message?: string) => Response<ApiResponse<T>>;
/**
 * Send an error response
 */
export declare const errorResponse: (res: Response, message: string, statusCode?: number, errors?: Array<{
    field?: string;
    message: string;
}>) => Response<ApiResponse>;
/**
 * Send a validation error response
 */
export declare const validationErrorResponse: (res: Response, errors: Array<{
    field?: string;
    message: string;
}>) => Response<ApiResponse>;
/**
 * Send an unauthorized response
 */
export declare const unauthorizedResponse: (res: Response, message?: string) => Response<ApiResponse>;
/**
 * Send a forbidden response
 */
export declare const forbiddenResponse: (res: Response, message?: string) => Response<ApiResponse>;
/**
 * Send a not found response
 */
export declare const notFoundResponse: (res: Response, message?: string) => Response<ApiResponse>;
/**
 * Send a conflict response
 */
export declare const conflictResponse: (res: Response, message?: string) => Response<ApiResponse>;
/**
 * Send a paginated response
 */
export declare const paginatedResponse: <T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string) => Response<ApiResponse<T[]>>;
/**
 * Send a no content response (204)
 */
export declare const noContentResponse: (res: Response) => Response;
/**
 * Send a rate limit exceeded response
 */
export declare const rateLimitResponse: (res: Response, message?: string) => Response<ApiResponse>;
export {};
//# sourceMappingURL=response.d.ts.map