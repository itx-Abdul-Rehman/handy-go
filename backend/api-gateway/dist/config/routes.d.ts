/**
 * Service route configuration
 * Maps API paths to their respective microservices
 */
export interface ServiceRoute {
    path: string;
    target: string;
    pathRewrite?: Record<string, string>;
    requiresAuth?: boolean;
    rateLimit?: 'general' | 'auth' | 'authenticated' | 'sos';
}
export declare const serviceRoutes: ServiceRoute[];
/**
 * Public routes that don't require authentication
 */
export declare const publicRoutes: string[];
/**
 * Check if a route is public (doesn't require authentication)
 */
export declare const isPublicRoute: (path: string) => boolean;
/**
 * Get the service configuration for a given path
 */
export declare const getServiceForPath: (path: string) => ServiceRoute | undefined;
//# sourceMappingURL=routes.d.ts.map