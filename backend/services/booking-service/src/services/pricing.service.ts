import { config } from '../config/index.js';

/**
 * Calculate platform fee for a booking
 */
export const calculatePlatformFee = (amount: number): number => {
  const percentageFee = amount * (config.platformFee.percentage / 100);

  // Apply min/max caps
  if (percentageFee < config.platformFee.minFee) {
    return config.platformFee.minFee;
  }
  if (percentageFee > config.platformFee.maxFee) {
    return config.platformFee.maxFee;
  }

  return Math.round(percentageFee);
};

/**
 * Calculate total pricing breakdown
 */
export const calculatePricing = (params: {
  laborCost: number;
  materialsCost?: number;
  discount?: number;
}): {
  laborCost: number;
  materialsCost: number;
  platformFee: number;
  discount: number;
  subtotal: number;
  total: number;
} => {
  const { laborCost, materialsCost = 0, discount = 0 } = params;

  const subtotal = laborCost + materialsCost;
  const platformFee = calculatePlatformFee(laborCost);
  const total = Math.max(0, subtotal + platformFee - discount);

  return {
    laborCost,
    materialsCost,
    platformFee,
    discount,
    subtotal,
    total,
  };
};

/**
 * Calculate cancellation fee
 */
export const calculateCancellationFee = (
  estimatedPrice: number,
  hoursBeforeScheduled: number
): number => {
  // No fee if cancelled more than cancellation window hours before
  if (hoursBeforeScheduled > config.booking.cancellationWindowHours) {
    return 0;
  }

  // Full penalty if cancelled close to scheduled time
  const penaltyAmount = estimatedPrice * (config.booking.cancellationPenaltyPercent / 100);
  return Math.round(penaltyAmount);
};

/**
 * Calculate worker earnings from a booking
 */
export const calculateWorkerEarnings = (
  finalPrice: number,
  platformFee: number
): number => {
  return finalPrice - platformFee;
};

export default {
  calculatePlatformFee,
  calculatePricing,
  calculateCancellationFee,
  calculateWorkerEarnings,
};
