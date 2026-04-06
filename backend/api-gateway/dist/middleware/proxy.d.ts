import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'http-proxy-middleware';
/**
 * Create proxy middleware for a service
 */
export declare const createServiceProxy: (target: string, path: string) => RequestHandler;
/**
 * Dynamic proxy router that selects the appropriate service
 */
export declare const proxyRouter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Set up all service proxies
 */
export declare const setupProxies: (app: any) => void;
//# sourceMappingURL=proxy.d.ts.map