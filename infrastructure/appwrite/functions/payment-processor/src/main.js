/**
 * Handy Go — Payment Processor (Appwrite Function)
 *
 * Handles all payment and wallet operations:
 *  - Wallet creation, balance queries
 *  - Wallet top-up (via external gateway)
 *  - Booking payment processing (cash / wallet / card)
 *  - Worker earnings crediting
 *  - Withdrawal requests
 *  - Refund processing
 *
 * Can be triggered by:
 *  1. Direct execution from client apps (action-based)
 *  2. Internal calls from booking-processor on completion
 *
 * Runtime: Node.js 22
 * Timeout: 30 seconds
 *
 * ──────────────────────────────────────────────────────────
 * EXTERNAL GATEWAY INTEGRATION NOTES
 * ──────────────────────────────────────────────────────────
 * This function is structured so that every place an external
 * payment gateway call is needed is marked with a clearly
 * labeled TODO block.  When you integrate a real provider
 * (JazzCash, Easypaisa, Stripe, etc.) you only need to:
 *   1. Add the gateway SDK to package.json
 *   2. Set the API keys in Appwrite Function environment vars
 *   3. Replace the TODO blocks with real SDK calls
 * ──────────────────────────────────────────────────────────
 */

import { Client, Databases, Query, ID } from 'node-appwrite';

const DB_ID = 'handy_go_db';
const WALLETS = 'wallets';
const TRANSACTIONS = 'transactions';
const BOOKINGS = 'bookings';
const WORKERS = 'workers';

// Platform fee percentage (must match booking-processor)
const PLATFORM_FEE_PERCENT = 0.10;

export default async ({ req, res, log, error }) => {
  try {
    const apiKey =
      process.env.APPWRITE_API_KEY ||
      req.headers['x-appwrite-key'] ||
      '';

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);

    const databases = new Databases(client);
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    log(`Payment processor action: ${action}`);

    switch (action) {
      // ── Wallet management ──────────────────────────────
      case 'create_wallet':
        return res.json(await createWallet(databases, body, log));

      case 'get_wallet':
        return res.json(await getWallet(databases, body, log));

      case 'get_transactions':
        return res.json(await getTransactions(databases, body, log));

      // ── Top-up / deposit ───────────────────────────────
      case 'top_up_wallet':
        return res.json(await topUpWallet(databases, body, log));

      // ── Booking payment flow ───────────────────────────
      case 'process_booking_payment':
        return res.json(await processBookingPayment(databases, body, log));

      // ── Worker earnings ────────────────────────────────
      case 'credit_worker_earnings':
        return res.json(await creditWorkerEarnings(databases, body, log));

      // ── Withdrawal ─────────────────────────────────────
      case 'request_withdrawal':
        return res.json(await requestWithdrawal(databases, body, log));

      // ── Refund ─────────────────────────────────────────
      case 'process_refund':
        return res.json(await processRefund(databases, body, log));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Payment processor error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ================================================================
//  WALLET MANAGEMENT
// ================================================================

/**
 * Create a wallet for a user (idempotent — returns existing if found)
 * @param {object} body — { userId: string }
 */
async function createWallet(databases, { userId }, log) {
  if (!userId) return { error: 'userId required' };

  // Check if wallet already exists
  const existing = await databases.listDocuments(DB_ID, WALLETS, [
    Query.equal('userId', userId),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    log(`Wallet already exists for user ${userId}`);
    return { success: true, wallet: existing.documents[0] };
  }

  const wallet = await databases.createDocument(DB_ID, WALLETS, ID.unique(), {
    userId,
    balance: 0,
    currency: 'PKR',
    status: 'ACTIVE',
  });

  log(`Created wallet for user ${userId}: ${wallet.$id}`);
  return { success: true, wallet };
}

/**
 * Get wallet & balance for a user
 * @param {object} body — { userId: string }
 */
async function getWallet(databases, { userId }, log) {
  if (!userId) return { error: 'userId required' };

  const result = await databases.listDocuments(DB_ID, WALLETS, [
    Query.equal('userId', userId),
    Query.limit(1),
  ]);

  if (result.documents.length === 0) {
    // Auto-create wallet if it doesn't exist
    return createWallet(databases, { userId }, log);
  }

  return { success: true, wallet: result.documents[0] };
}

/**
 * Get paginated transaction history for a user
 * @param {object} body — { userId, type?, limit?, offset? }
 */
async function getTransactions(databases, { userId, type, limit = 25, offset = 0 }, log) {
  if (!userId) return { error: 'userId required' };

  const queries = [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ];

  if (type) {
    queries.push(Query.equal('type', type));
  }

  const result = await databases.listDocuments(DB_ID, TRANSACTIONS, queries);

  return {
    success: true,
    transactions: result.documents,
    total: result.total,
  };
}

// ================================================================
//  TOP-UP / DEPOSIT
// ================================================================

/**
 * Top up wallet balance.
 *
 * Flow:
 *  1. Client initiates top-up (selects amount + method)
 *  2. This function creates a PENDING transaction
 *  3. **External gateway processes the payment**
 *  4. On gateway callback / confirmation, balance is credited
 *
 * For now the gateway step is simulated (auto-completes).
 * Replace the TODO block with your real gateway integration.
 *
 * @param {object} body — { userId, amount, paymentMethod, gatewayToken? }
 */
async function topUpWallet(databases, { userId, amount, paymentMethod, gatewayToken }, log) {
  if (!userId) return { error: 'userId required' };
  if (!amount || amount <= 0) return { error: 'Valid amount required' };
  if (!paymentMethod) return { error: 'paymentMethod required' };

  // Get or create wallet
  const { wallet } = await getWallet(databases, { userId }, log);
  if (wallet.status !== 'ACTIVE') {
    return { error: 'Wallet is not active' };
  }

  // Create PENDING transaction
  const txn = await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
    userId,
    type: 'TOP_UP',
    amount,
    status: 'PENDING',
    paymentMethod,
    description: `Wallet top-up via ${paymentMethod}`,
    gatewayReference: '',
    metadata: JSON.stringify({ requestedAt: new Date().toISOString() }),
  });

  log(`Created top-up transaction ${txn.$id} for Rs. ${amount}`);

  // ──────────────────────────────────────────────────────────
  // TODO: EXTERNAL PAYMENT GATEWAY INTEGRATION
  //
  // Replace the block below with your chosen gateway SDK call.
  //
  // Example for JazzCash:
  //   const jazzcash = require('jazzcash-checkout');
  //   const result = await jazzcash.createPayment({
  //     amount,
  //     mobileNumber: userPhone,
  //     transactionId: txn.$id,
  //     callbackUrl: `${process.env.APP_URL}/api/payments/callback`,
  //   });
  //   if (!result.success) { /* mark txn FAILED, return error */ }
  //
  // Example for Easypaisa:
  //   const easypaisa = require('easypaisa-sdk');
  //   const result = await easypaisa.initiatePayment({
  //     amount,
  //     orderId: txn.$id,
  //     ...process.env.EASYPAISA_CREDENTIALS,
  //   });
  //
  // Example for Stripe:
  //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  //   const paymentIntent = await stripe.paymentIntents.create({
  //     amount: amount * 100, // Stripe uses smallest currency unit
  //     currency: 'pkr',
  //     payment_method: gatewayToken,
  //     confirm: true,
  //     metadata: { userId, transactionId: txn.$id },
  //   });
  //   if (paymentIntent.status !== 'succeeded') {
  //     /* mark txn FAILED, return error */
  //   }
  //
  // Set these environment variables in Appwrite Function settings:
  //   - JAZZCASH_MERCHANT_ID
  //   - JAZZCASH_PASSWORD
  //   - JAZZCASH_INTEGRITY_SALT
  //   - EASYPAISA_STORE_ID
  //   - EASYPAISA_TOKEN
  //   - STRIPE_SECRET_KEY
  //   - PAYMENT_CALLBACK_URL
  // ──────────────────────────────────────────────────────────

  // SIMULATED: auto-complete the top-up (remove when real gateway is wired)
  const gatewayRef = `SIM-${Date.now()}`;

  // Mark transaction completed
  await databases.updateDocument(DB_ID, TRANSACTIONS, txn.$id, {
    status: 'COMPLETED',
    gatewayReference: gatewayRef,
  });

  // Credit wallet
  const newBalance = (wallet.balance || 0) + amount;
  await databases.updateDocument(DB_ID, WALLETS, wallet.$id, {
    balance: newBalance,
    lastTopUpAt: new Date().toISOString(),
  });

  log(`Top-up completed. Wallet ${wallet.$id} new balance: Rs. ${newBalance}`);

  return {
    success: true,
    transaction: { ...txn, status: 'COMPLETED', gatewayReference: gatewayRef },
    newBalance,
  };
}

// ================================================================
//  BOOKING PAYMENT
// ================================================================

/**
 * Process payment for a completed booking.
 *
 * Called after booking-processor marks a booking as COMPLETED.
 * Handles three payment methods:
 *   CASH   → Record transaction only (worker collects cash)
 *   WALLET → Debit customer wallet
 *   CARD   → Charge via gateway (TODO)
 *
 * @param {object} body — { bookingId, customerId, workerId, amount, paymentMethod }
 */
async function processBookingPayment(databases, { bookingId, customerId, workerId, amount, paymentMethod }, log) {
  if (!bookingId) return { error: 'bookingId required' };
  if (!customerId) return { error: 'customerId required' };
  if (!amount || amount <= 0) return { error: 'Valid amount required' };

  const method = paymentMethod || 'CASH';

  // Create customer debit transaction
  const customerTxn = await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
    userId: customerId,
    type: method === 'CASH' ? 'BOOKING_CASH' : 'BOOKING_DEBIT',
    amount,
    status: 'PENDING',
    bookingId,
    paymentMethod: method,
    description: `Payment for booking ${bookingId}`,
    gatewayReference: '',
    metadata: JSON.stringify({ workerId, processedAt: new Date().toISOString() }),
  });

  let paymentSuccess = false;

  if (method === 'CASH') {
    // Cash payment — worker collects, just record the transaction
    paymentSuccess = true;
    log(`Cash payment recorded for booking ${bookingId}: Rs. ${amount}`);
  } else if (method === 'WALLET') {
    // Wallet payment — debit customer wallet
    const { wallet } = await getWallet(databases, { userId: customerId }, log);
    if (wallet.balance < amount) {
      await databases.updateDocument(DB_ID, TRANSACTIONS, customerTxn.$id, {
        status: 'FAILED',
        metadata: JSON.stringify({ error: 'Insufficient balance' }),
      });
      return { error: 'Insufficient wallet balance', requiredAmount: amount, currentBalance: wallet.balance };
    }

    const newBalance = wallet.balance - amount;
    await databases.updateDocument(DB_ID, WALLETS, wallet.$id, {
      balance: newBalance,
    });
    paymentSuccess = true;
    log(`Wallet debited Rs. ${amount}. New balance: Rs. ${newBalance}`);
  } else if (method === 'CARD' || method === 'JAZZCASH' || method === 'EASYPAISA') {
    // ──────────────────────────────────────────────────────────
    // TODO: CARD / MOBILE WALLET GATEWAY INTEGRATION
    //
    // For card payments (Stripe example):
    //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    //   const charge = await stripe.charges.create({
    //     amount: amount * 100,
    //     currency: 'pkr',
    //     customer: stripeCustomerId,
    //     description: `Booking ${bookingId}`,
    //     metadata: { bookingId, customerId },
    //   });
    //   paymentSuccess = charge.status === 'succeeded';
    //
    // For JazzCash / Easypaisa:
    //   (Same pattern as top-up TODO above)
    //
    // After successful charge, set paymentSuccess = true
    // and store the gateway reference.
    // ──────────────────────────────────────────────────────────

    // SIMULATED: auto-complete (remove when real gateway is wired)
    paymentSuccess = true;
    log(`Simulated ${method} payment for booking ${bookingId}: Rs. ${amount}`);
  }

  if (paymentSuccess) {
    // Mark transaction completed
    await databases.updateDocument(DB_ID, TRANSACTIONS, customerTxn.$id, {
      status: 'COMPLETED',
      gatewayReference: method === 'CASH' ? 'CASH_COLLECTED' : `SIM-${Date.now()}`,
    });

    // Update booking payment status
    await databases.updateDocument(DB_ID, BOOKINGS, bookingId, {
      paymentStatus: 'COMPLETED',
      transactionId: customerTxn.$id,
    });

    // Credit worker earnings (non-blocking)
    if (workerId) {
      try {
        await creditWorkerEarnings(databases, { workerId, bookingId, amount }, log);
      } catch (e) {
        log(`Warning: Failed to credit worker earnings: ${e.message}`);
      }
    }

    // Record platform fee transaction
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
    try {
      await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
        userId: 'PLATFORM',
        type: 'PLATFORM_FEE',
        amount: platformFee,
        status: 'COMPLETED',
        bookingId,
        paymentMethod: method,
        description: `Platform fee for booking ${bookingId}`,
        gatewayReference: '',
        metadata: JSON.stringify({ customerTxnId: customerTxn.$id }),
      });
    } catch (e) {
      log(`Warning: Failed to record platform fee: ${e.message}`);
    }

    log(`Payment processed for booking ${bookingId}. Method: ${method}, Amount: Rs. ${amount}`);
    return { success: true, transactionId: customerTxn.$id };
  }

  return { error: 'Payment processing failed' };
}

// ================================================================
//  WORKER EARNINGS
// ================================================================

/**
 * Credit earnings to a worker after booking completion.
 * Earnings = total - platformFee
 *
 * @param {object} body — { workerId, bookingId, amount }
 */
async function creditWorkerEarnings(databases, { workerId, bookingId, amount }, log) {
  if (!workerId || !amount) return { error: 'workerId and amount required' };

  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
  const workerEarning = amount - platformFee;

  // Create earning transaction
  await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
    userId: workerId,
    type: 'EARNING',
    amount: workerEarning,
    status: 'COMPLETED',
    bookingId: bookingId || '',
    paymentMethod: 'WALLET',
    description: `Earnings from booking ${bookingId || 'N/A'} (after ${PLATFORM_FEE_PERCENT * 100}% platform fee)`,
    gatewayReference: '',
    metadata: JSON.stringify({ totalAmount: amount, platformFee }),
  });

  // Credit worker wallet (create if needed)
  const { wallet } = await getWallet(databases, { userId: workerId }, log);
  const newBalance = (wallet.balance || 0) + workerEarning;
  await databases.updateDocument(DB_ID, WALLETS, wallet.$id, {
    balance: newBalance,
  });

  log(`Credited Rs. ${workerEarning} to worker ${workerId}. New balance: Rs. ${newBalance}`);
  return { success: true, earning: workerEarning, newBalance };
}

// ================================================================
//  WITHDRAWAL
// ================================================================

/**
 * Request withdrawal from wallet to bank account.
 *
 * Flow:
 *  1. Validate balance
 *  2. Create PENDING withdrawal transaction
 *  3. **Process via bank transfer API**
 *  4. On success, debit wallet
 *
 * @param {object} body — { userId, amount, bankDetails? }
 */
async function requestWithdrawal(databases, { userId, amount, bankDetails }, log) {
  if (!userId) return { error: 'userId required' };
  if (!amount || amount <= 0) return { error: 'Valid amount required' };

  const MIN_WITHDRAWAL = 500;  // Minimum Rs. 500
  if (amount < MIN_WITHDRAWAL) {
    return { error: `Minimum withdrawal amount is Rs. ${MIN_WITHDRAWAL}` };
  }

  const { wallet } = await getWallet(databases, { userId }, log);
  if (wallet.status !== 'ACTIVE') {
    return { error: 'Wallet is not active' };
  }
  if (wallet.balance < amount) {
    return { error: 'Insufficient balance', currentBalance: wallet.balance };
  }

  // Create PENDING withdrawal transaction
  const txn = await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
    userId,
    type: 'WITHDRAWAL',
    amount,
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    description: `Withdrawal to bank account`,
    gatewayReference: '',
    metadata: JSON.stringify({
      bankDetails: bankDetails || {},
      requestedAt: new Date().toISOString(),
    }),
  });

  log(`Created withdrawal request ${txn.$id} for Rs. ${amount}`);

  // ──────────────────────────────────────────────────────────
  // TODO: BANK TRANSFER / PAYOUT INTEGRATION
  //
  // Replace the block below with your bank transfer API.
  //
  // Example for Stripe Connect payouts:
  //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  //   const payout = await stripe.payouts.create({
  //     amount: amount * 100,
  //     currency: 'pkr',
  //     method: 'standard',
  //     metadata: { userId, transactionId: txn.$id },
  //   }, { stripeAccount: workerStripeAccountId });
  //
  // Example for a local bank API:
  //   const bankApi = require('./bank-api');
  //   const result = await bankApi.initiateTransfer({
  //     amount,
  //     accountTitle: bankDetails.accountTitle,
  //     accountNumber: bankDetails.accountNumber,
  //     bankName: bankDetails.bankName,
  //     reference: txn.$id,
  //   });
  //
  // Example for JazzCash disbursement:
  //   const jazzcash = require('jazzcash-checkout');
  //   const result = await jazzcash.sendMoney({
  //     amount,
  //     receiverMobile: userPhone,
  //     transactionId: txn.$id,
  //   });
  //
  // Set these environment variables in Appwrite Function settings:
  //   - BANK_API_KEY
  //   - BANK_API_SECRET
  //   - BANK_API_URL
  //   - PAYOUT_WEBHOOK_SECRET
  // ──────────────────────────────────────────────────────────

  // SIMULATED: auto-complete withdrawal (remove when real payout API is wired)
  const gatewayRef = `WD-SIM-${Date.now()}`;

  // Debit wallet
  const newBalance = wallet.balance - amount;
  await databases.updateDocument(DB_ID, WALLETS, wallet.$id, {
    balance: newBalance,
    lastWithdrawalAt: new Date().toISOString(),
  });

  // Mark transaction completed
  await databases.updateDocument(DB_ID, TRANSACTIONS, txn.$id, {
    status: 'COMPLETED',
    gatewayReference: gatewayRef,
  });

  log(`Withdrawal completed. Wallet ${wallet.$id} new balance: Rs. ${newBalance}`);

  return {
    success: true,
    transactionId: txn.$id,
    newBalance,
  };
}

// ================================================================
//  REFUND
// ================================================================

/**
 * Process a refund for a cancelled / disputed booking.
 *
 * @param {object} body — { bookingId, customerId, amount, reason? }
 */
async function processRefund(databases, { bookingId, customerId, amount, reason }, log) {
  if (!bookingId || !customerId || !amount) {
    return { error: 'bookingId, customerId, and amount required' };
  }

  // Find the original payment transaction
  const originalTxns = await databases.listDocuments(DB_ID, TRANSACTIONS, [
    Query.equal('bookingId', bookingId),
    Query.equal('userId', customerId),
    Query.equal('status', 'COMPLETED'),
    Query.limit(1),
  ]);

  const originalTxn = originalTxns.documents[0];
  const originalMethod = originalTxn?.paymentMethod || 'WALLET';

  // ──────────────────────────────────────────────────────────
  // TODO: GATEWAY REFUND INTEGRATION
  //
  // If the original payment was via card / mobile wallet,
  // you need to process the refund through the same gateway.
  //
  // Example for Stripe:
  //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  //   const refund = await stripe.refunds.create({
  //     charge: originalTxn.gatewayReference,
  //     amount: amount * 100,
  //     reason: 'requested_by_customer',
  //   });
  //
  // For cash payments, the refund goes to wallet credit
  // (customer gets wallet balance instead of cash back).
  // ──────────────────────────────────────────────────────────

  // Create refund transaction
  const refundTxn = await databases.createDocument(DB_ID, TRANSACTIONS, ID.unique(), {
    userId: customerId,
    type: 'REFUND',
    amount,
    status: 'COMPLETED',
    bookingId,
    paymentMethod: originalMethod,
    description: reason || `Refund for booking ${bookingId}`,
    gatewayReference: `REFUND-${Date.now()}`,
    metadata: JSON.stringify({
      originalTransactionId: originalTxn?.$id || '',
      reason,
    }),
  });

  // Credit customer wallet (all refunds go to wallet)
  const { wallet } = await getWallet(databases, { userId: customerId }, log);
  const newBalance = (wallet.balance || 0) + amount;
  await databases.updateDocument(DB_ID, WALLETS, wallet.$id, {
    balance: newBalance,
  });

  // Update booking payment status
  await databases.updateDocument(DB_ID, BOOKINGS, bookingId, {
    paymentStatus: 'REFUNDED',
  });

  log(`Refund of Rs. ${amount} processed for booking ${bookingId}`);

  return { success: true, transactionId: refundTxn.$id, newBalance };
}
