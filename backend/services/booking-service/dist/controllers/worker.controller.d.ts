import { Request, Response } from 'express';
/**
 * Get available bookings for worker
 * GET /api/bookings/worker/available
 */
export declare const getAvailableBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get worker bookings
 * GET /api/bookings/worker
 */
export declare const getWorkerBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Accept booking
 * POST /api/bookings/:bookingId/accept
 */
export declare const acceptBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Reject booking
 * POST /api/bookings/:bookingId/reject
 */
export declare const rejectBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Start job
 * POST /api/bookings/:bookingId/start
 */
export declare const startJob: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Complete job
 * POST /api/bookings/:bookingId/complete
 */
export declare const completeJob: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update worker location during booking
 * PUT /api/bookings/:bookingId/location
 */
export declare const updateLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=worker.controller.d.ts.map