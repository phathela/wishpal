const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('[Stripe] WARNING: STRIPE_SECRET_KEY is not set. Payment features will fail.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Creates a Stripe PaymentIntent for Wees purchase.
 * Conversion rate: 1 Wee = $0.10 USD
 *
 * @param {number} weesAmount - Number of Wees being purchased
 * @param {number} userId - The user's database ID (for metadata)
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 * @throws {Error} If Stripe is not configured or amount is invalid
 */
async function createPaymentIntent(weesAmount, userId) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }

  if (!weesAmount || weesAmount <= 0) {
    throw new Error('Invalid Wees amount. Must be greater than 0.');
  }

  // 1 Wee = $0.10 USD, convert to cents for Stripe
  const usdAmount = weesAmount * 0.10;
  const amountInCents = Math.round(usdAmount * 100);

  if (amountInCents < 50) {
    throw new Error('Minimum purchase is 5 Wees ($0.50 USD).');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        userId: String(userId),
        weesAmount: String(weesAmount)
      },
      // TODO: In production, add automatic_payment_methods for broader card support
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (err) {
    console.error('[Stripe] Error creating payment intent:', err.message);
    throw err;
  }
}

/**
 * Handles an incoming Stripe webhook event.
 * Verifies the webhook signature and processes relevant events.
 *
 * Supported events:
 *   - payment_intent.succeeded: Credit user's Wees balance
 *   - payment_intent.payment_failed: Log the failure
 *
 * @param {Buffer} rawBody - The raw request body as a buffer
 * @param {string} signature - The Stripe-Signature header value
 * @returns {Promise<Object>} The processed event
 * @throws {Error} If signature verification fails
 */
async function handleWebhook(rawBody, signature) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    throw new Error('Webhook signature verification failed');
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const userId = parseInt(paymentIntent.metadata.userId, 10);
      const weesAmount = parseInt(paymentIntent.metadata.weesAmount, 10);

      if (userId && weesAmount) {
        console.log(`[Stripe] Payment succeeded for user #${userId}: ${weesAmount} Wees`);

        const pool = require('../db/pool');
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // Update user's wees balance
          await client.query(
            'UPDATE users SET wees_balance = wees_balance + $1, updated_at = NOW() WHERE id = $2',
            [weesAmount, userId]
          );

          // Record the transaction
          const txnResult = await client.query(
            `INSERT INTO transactions (user_id, type, wees_amount, stripe_payment_intent_id, usd_amount, status)
             VALUES ($1, 'purchase', $2, $3, $4, 'completed')
             RETURNING id`,
            [userId, weesAmount, paymentIntent.id, paymentIntent.amount / 100]
          );

          await client.query('COMMIT');

          // TODO: Emit socket event for real-time balance update
          // This should be wired via the agentWorker or server's io instance

          console.log(`[Stripe] User #${userId} credited with ${weesAmount} Wees (txn #${txnResult.rows[0].id})`);
        } catch (dbErr) {
          await client.query('ROLLBACK');
          console.error('[Stripe] Database error processing payment:', dbErr.message);
        } finally {
          client.release();
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`[Stripe] Payment failed for intent: ${paymentIntent.id}`);
      break;
    }

    case 'payment_intent.created': {
      // Optional: log payment intent creation
      console.log(`[Stripe] Payment intent created: ${event.data.object.id}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return { received: true, type: event.type };
}

/**
 * Calculates USD equivalent for a given Wees amount.
 *
 * @param {number} weesAmount - Number of Wees
 * @returns {number} Equivalent USD amount
 */
function weesToUSD(weesAmount) {
  return weesAmount * 0.10;
}

/**
 * Calculates Wees for a given USD amount.
 *
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Equivalent Wees (rounded down)
 */
function usdToWees(usdAmount) {
  return Math.floor(usdAmount / 0.10);
}

module.exports = {
  createPaymentIntent,
  handleWebhook,
  weesToUSD,
  usdToWees
};
