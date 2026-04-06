import { Request, Response } from 'express';
/**
 * Get all bookings (admin)
 * GET /api/bookings/admin
 */
export declare const getAllBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get booking statistics
 * GET /api/bookings/admin/stats
 */
export declare const getBookingStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update booking (admin)
 * PUT /api/bookings/admin/:bookingId
 */
export declare const updateBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get booking by ID (admin)
 * GET /api/bookings/admin/:bookingId
 */
export declare const getBookingById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Reassign worker to booking (admin)
 * PUT /api/bookings/admin/:bookingId/reassign
 */
export declare const reassignWorker: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=admin.controller.d.ts.map