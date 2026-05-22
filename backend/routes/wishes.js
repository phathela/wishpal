const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { processWish, getAgentOpinion } = require('../services/aiAgent');

/**
 * Helper: Sanitize wish object for response
 */
function sanitizeWish(wish) {
  return {
    id: wish.id,
    user_id: wish.user_id,
    title: wish.title,
    category: wish.category,
    description: wish.description,
    target_date: wish.target_date,
    return_action: wish.return_action,
    payment_type: wish.payment_type,
    amount: wish.amount ? parseFloat(wish.amount) : null,
    exchange_item_details: wish.exchange_item_details,
    exchange_item_photo_url: wish.exchange_item_photo_url,
    exchange_item_value: wish.exchange_item_value ? parseFloat(wish.exchange_item_value) : null,
    expiry_date: wish.expiry_date,
    update_frequency: wish.update_frequency,
    location_country: wish.location_country,
    location_region: wish.location_region,
    visible_to_wishpad_ids: wish.visible_to_wishpad_ids,
    status: wish.status,
    agent_processed: wish.agent_processed,
    created_at: wish.created_at,
    updated_at: wish.updated_at
  };
}

/**
 * GET /api/wishes
 * List wishes for the current user, with optional filters.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, category, limit = 20, offset = 0 } = req.query;

    let sql = 'SELECT * FROM wishes WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(sql, params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) FROM wishes WHERE user_id = $1';
    const countParams = [userId];
    let countIdx = 2;

    if (status) {
      countSql += ` AND status = $${countIdx++}`;
      countParams.push(status);
    }

    if (category) {
      countSql += ` AND category = $${countIdx++}`;
      countParams.push(category);
    }

    const countResult = await pool.query(countSql, countParams);

    res.json({
      data: {
        wishes: result.rows.map(sanitizeWish),
        total: parseInt(countResult.rows[0].count, 10),
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wishes
 * Create a new wish and trigger agent processing asynchronously.
 */
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('payment_type').optional().isIn(['pay', 'exchange']).withMessage('Payment type must be pay or exchange'),
  body('update_frequency').optional().isIn(['hourly', 'daily', 'weekly']).withMessage('Frequency must be hourly, daily, or weekly'),
  body('status').optional().isIn(['active', 'matched', 'expired'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const {
      title, category, description, target_date, return_action,
      payment_type, amount, exchange_item_details, exchange_item_photo_url,
      exchange_item_value, expiry_date, update_frequency,
      location_country, location_region, visible_to_wishpad_ids
    } = req.body;

    const result = await pool.query(
      `INSERT INTO wishes (
        user_id, title, category, description, target_date, return_action,
        payment_type, amount, exchange_item_details, exchange_item_photo_url,
        exchange_item_value, expiry_date, update_frequency,
        location_country, location_region, visible_to_wishpad_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        userId, title, category, description || null, target_date || null,
        return_action || null, payment_type || null, amount || null,
        exchange_item_details || null, exchange_item_photo_url || null,
        exchange_item_value || null, expiry_date || null,
        update_frequency || 'daily', location_country || null,
        location_region || null, visible_to_wishpad_ids || null
      ]
    );

    const wish = result.rows[0];

    // Trigger agent processing asynchronously (don't await)
    processWishAsync(wish, req.app.get('io'));

    res.status(201).json({
      data: sanitizeWish(wish)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wishes/direct
 * Submit a wish directly to a specific WishPad (by slug).
 */
router.post('/direct', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('wishpadSlug').notEmpty().withMessage('WishPad slug is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const { title, description, category, wishpadSlug } = req.body;

    // Find the wishpad by slug
    const wishpadResult = await pool.query(
      'SELECT id, wishpad_user_id FROM wishpad_pages WHERE slug = $1',
      [wishpadSlug]
    );

    if (wishpadResult.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad not found' });
    }

    const wishpadUserId = wishpadResult.rows[0].wishpad_user_id;

    const result = await pool.query(
      `INSERT INTO wishes (user_id, title, category, description, visible_to_wishpad_ids, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, title, category || 'Other', description, [wishpadUserId]]
    );

    const wish = result.rows[0];

    // Trigger agent processing
    processWishAsync(wish, req.app.get('io'));

    res.status(201).json({
      data: sanitizeWish(wish)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/wishes/:id
 * Get a single wish by ID with its comments.
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const wishId = parseInt(req.params.id, 10);

    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'Invalid wish ID' });
    }

    const wishResult = await pool.query(
      'SELECT * FROM wishes WHERE id = $1',
      [wishId]
    );

    if (wishResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wish not found' });
    }

    const wish = wishResult.rows[0];

    // Only owner can view the wish (or it could be visible to wishpads)
    // For now, only owner can view their own wishes
    if (wish.user_id !== userId) {
      // Check if user is a wishpad who has this wish visible
      const wishpadCheck = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (wishpadCheck.rows[0]?.role !== 'wishpad' ||
          !wish.visible_to_wishpad_ids ||
          !wish.visible_to_wishpad_ids.includes(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get comments for this wish
    const commentsResult = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.wish_id = $1
       ORDER BY c.created_at ASC`,
      [wishId]
    );

    res.json({
      data: {
        ...sanitizeWish(wish),
        comments: commentsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/wishes/:id
 * Update a wish (only owner, only certain fields).
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const wishId = parseInt(req.params.id, 10);

    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'Invalid wish ID' });
    }

    // Check ownership
    const existing = await pool.query(
      'SELECT * FROM wishes WHERE id = $1 AND user_id = $2',
      [wishId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Wish not found or access denied' });
    }

    const allowedFields = [
      'title', 'category', 'description', 'target_date', 'return_action',
      'payment_type', 'amount', 'exchange_item_details', 'exchange_item_photo_url',
      'exchange_item_value', 'expiry_date', 'update_frequency',
      'location_country', 'location_region', 'visible_to_wishpad_ids', 'status'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(wishId);

    const result = await pool.query(
      `UPDATE wishes SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    res.json({
      data: sanitizeWish(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wishes/:id/comments
 * Add a comment to a wish.
 */
router.post('/:id/comments', authenticate, [
  body('comment_text').notEmpty().withMessage('Comment text is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const wishId = parseInt(req.params.id, 10);

    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'Invalid wish ID' });
    }

    // Verify wish exists
    const wishResult = await pool.query('SELECT * FROM wishes WHERE id = $1', [wishId]);
    if (wishResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wish not found' });
    }

    const { comment_text } = req.body;

    // Get agent opinion on the comment (async, don't block response)
    const wish = wishResult.rows[0];
    let agentOpinion = null;

    try {
      const opinionResult = await getAgentOpinion(comment_text, wish.description || wish.title);
      agentOpinion = opinionResult.opinion;
    } catch (agentErr) {
      console.error('[Wishes] Agent opinion error:', agentErr.message);
      // Don't fail the comment if agent processing fails
    }

    const commentResult = await pool.query(
      `INSERT INTO comments (wish_id, user_id, comment_text, agent_verified_opinion)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [wishId, userId, comment_text, agentOpinion]
    );

    // Fetch user info for the response
    const userResult = await pool.query(
      'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      ...commentResult.rows[0],
      ...userResult.rows[0]
    };

    res.status(201).json({
      data: comment
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/wishes/:id/comments
 * Get comments for a wish.
 */
router.get('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const wishId = parseInt(req.params.id, 10);

    if (isNaN(wishId)) {
      return res.status(400).json({ error: 'Invalid wish ID' });
    }

    // Verify wish exists (and user has access if needed)
    const wishResult = await pool.query('SELECT id, user_id FROM wishes WHERE id = $1', [wishId]);
    if (wishResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wish not found' });
    }

    const commentsResult = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.wish_id = $1
       ORDER BY c.created_at ASC`,
      [wishId]
    );

    res.json({
      data: commentsResult.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Async function to process a wish through the AI agent pipeline.
 * Creates match records and agent logs, updates wish status.
 * Emits socket events for real-time updates.
 */
async function processWishAsync(wish, io) {
  try {
    console.log(`[AgentWorker] Processing wish #${wish.id}...`);

    // Run the AI agent processing
    const results = await processWish(wish);

    // Mark wish as agent_processed
    await pool.query(
      'UPDATE wishes SET agent_processed = true, updated_at = NOW() WHERE id = $1',
      [wish.id]
    );

    // Create agent log entries
    for (const log of results.logs) {
      await pool.query(
        `INSERT INTO agent_logs (wish_id, agent_type, action, details)
         VALUES ($1, $2, $3, $4)`,
        [wish.id, log.agentType, log.action, JSON.stringify(log.details)]
      );
    }

    // Create match records for internal matches above threshold
    for (const match of results.internalMatches) {
      if (match.matchScore > 70) {
        const matchResult = await pool.query(
          `INSERT INTO matches (wish_id, matched_to_user_id, match_score, match_type)
           VALUES ($1, $2, $3, 'internal')
           RETURNING id`,
          [wish.id, match.matchedUserId, match.matchScore]
        );

        // Emit socket event for the matched user
        if (io) {
          io.to(`user_${match.matchedUserId}`).emit('match_found', {
            matchId: matchResult.rows[0].id,
            wishId: wish.id,
            wishTitle: wish.title,
            matchScore: match.matchScore,
            message: `New match found for your wish!`
          });

          io.to(`user_${wish.user_id}`).emit('match_found', {
            matchId: matchResult.rows[0].id,
            wishId: match.wishId,
            wishTitle: match.title,
            matchScore: match.matchScore,
            message: `New match found!`
          });
        }
      }
    }

    // Create external match records
    for (const ext of results.externalResults) {
      await pool.query(
        `INSERT INTO matches (wish_id, match_type, external_source, external_url, external_title, match_score)
         VALUES ($1, 'external', $2, $3, $4, $5)`,
        [wish.id, ext.source, ext.url, ext.title, ext.matchConfidence]
      );
    }

    // Emit agent update event
    if (io) {
      io.to(`user_${wish.user_id}`).emit('agent_update', {
        wishId: wish.id,
        status: 'processed',
        matchCount: results.internalMatches.length + results.externalResults.length,
        message: `AI agent finished processing "${wish.title}"`
      });
    }

    console.log(`[AgentWorker] Finished processing wish #${wish.id}: ${results.internalMatches.length} internal matches, ${results.externalResults.length} external results`);
  } catch (err) {
    console.error(`[AgentWorker] Error processing wish #${wish.id}:`, err.message);
  }
}

module.exports = router;
