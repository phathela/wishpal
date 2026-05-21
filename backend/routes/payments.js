const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { createPaymentIntent } = require('../services/stripe');

/**
 * POST /api/payments/create-payment-intent
 * Create a Stripe PaymentIntent to purchase Wees.
 * Rate: 1 Wee = $0.10 USD
 */
router.post('/create-payment-intent', authenticate, [
  body('wees_amount').isInt({ min: 5 }).withMessage('Minimum purchase is 5 Wees')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { wees_amount } = req.body;
    const userId = req.user.userId;

    const result = await createPaymentIntent(wees_amount, userId);

    res.json({
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        wees_amount,
        usd_amount: wees_amount * 0.10
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/balance
 * Get the current user's Wees balance.
 */
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT wees_balance FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also get recent transaction history
    const transactionsResult = await pool.query(
      `SELECT id, type, wees_amount, usd_amount, reference, status, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      data: {
        wees_balance: parseInt(result.rows[0].wees_balance, 10),
        recent_transactions: transactionsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint - receives payment events.
 * Uses raw body parser (configured in server.js via express.raw).
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { handleWebhook } = require('../services/stripe');
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // req.body is a Buffer (raw body) because we configured express.raw for this route
    const event = await handleWebhook(req.body, signature);

    res.json({
      data: event
    });
  } catch (err) {
    console.error('[Payments] Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
