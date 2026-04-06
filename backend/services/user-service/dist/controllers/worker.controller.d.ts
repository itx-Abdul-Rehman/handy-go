import { Request, Response } from 'express';
/**
 * Get worker profile
 * GET /api/users/worker/profile
 */
export declare const getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update worker profile
 * PUT /api/users/worker/profile
 */
export declare const updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update worker location
 * PUT /api/users/worker/location
 */
export declare const updateLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update worker availability
 * PUT /api/users/worker/availability
 */
export declare const updateAvailability: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add document
 * POST /api/users/worker/documents
 */
export declare const addDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get earnings
 * GET /api/users/worker/earnings
 */
export declare const getEarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=worker.controller.d.ts.map