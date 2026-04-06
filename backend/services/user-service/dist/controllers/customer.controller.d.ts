import { Request, Response } from 'express';
/**
 * Get customer profile
 * GET /api/users/customer/profile
 */
export declare const getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update customer profile
 * PUT /api/users/customer/profile
 */
export declare const updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all addresses
 * GET /api/users/customer/addresses
 */
export declare const getAddresses: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add address
 * POST /api/users/customer/addresses
 */
export declare const addAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update address
 * PUT /api/users/customer/addresses/:addressId
 */
export declare const updateAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete address
 * DELETE /api/users/customer/addresses/:addressId
 */
export declare const deleteAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete/deactivate customer account
 * DELETE /api/users/customer/account
 */
export declare const deleteAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=customer.controller.d.ts.map