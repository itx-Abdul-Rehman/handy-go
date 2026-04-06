import { Request, Response } from 'express';
/**
 * Create a new booking
 * POST /api/bookings
 */
export declare const createBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Select worker for booking
 * POST /api/bookings/:bookingId/select-worker
 */
export declare const selectWorker: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get customer bookings
 * GET /api/bookings/customer
 */
export declare const getCustomerBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get booking details
 * GET /api/bookings/:bookingId
 */
export declare const getBookingDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Cancel booking
 * POST /api/bookings/:bookingId/cancel
 */
export declare const cancelBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Rate booking
 * POST /api/bookings/:bookingId/rate
 */
export declare const rateBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=customer.controller.d.ts.map