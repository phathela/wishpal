const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/matches
 * Get matches for the current user.
 * - WishMates: see all their matches (always visible)
 * - WishPads: see blurred matches until unlocked
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { status, limit = 50, offset = 0 } = req.query;

    let sql;
    let params;
    let paramIndex = 1;

    if (role === 'wishpad') {
      // WishPads see matches where they are the matched_to_user_id
      // For locked matches, hide contact info / personal details
      sql = `
        SELECT
          m.id, m.wish_id, m.match_score, m.is_unlocked, m.unlocked_at,
          m.match_type, m.external_source, m.external_url, m.external_title,
          m.wees_charged, m.created_at,
          w.title as wish_title, w.category as wish_category,
          w.description as wish_description,
          w.location_country, w.location_region,
          w.amount, w.payment_type,
          CASE WHEN m.is_unlocked = true THEN w.user_id ELSE NULL END as wish_user_id,
          CASE WHEN m.is_unlocked = true THEN u.display_name ELSE NULL END as wish_user_name,
          CASE WHEN m.is_unlocked = true THEN u.username ELSE NULL END as wish_username
        FROM matches m
        JOIN wishes w ON m.wish_id = w.id
        LEFT JOIN users u ON w.user_id = u.id
        WHERE m.matched_to_user_id = $${paramIndex++}
      `;
      params = [userId];
    } else {
      // WishMates see matches on their wishes
      sql = `
        SELECT
          m.id, m.wish_id, m.match_score, m.is_unlocked, m.unlocked_at,
          m.match_type, m.external_source, m.external_url, m.external_title,
          m.wees_charged, m.created_at,
          w.title as wish_title, w.category as wish_category,
          w.description as wish_description,
          w.location_country, w.location_region, w.amount, w.payment_type,
          u.display_name as matched_user_name,
          u.username as matched_username,
          CASE WHEN m.is_unlocked = true THEN u2.display_name ELSE NULL END as wishpad_name
        FROM matches m
        JOIN wishes w ON m.wish_id = w.id
        LEFT JOIN users u ON m.matched_to_user_id = u.id
        LEFT JOIN users u2 ON m.matched_to_user_id = u2.id
        WHERE w.user_id = $${paramIndex++}
      `;
      params = [userId];
    }

    if (status === 'unlocked') {
      sql += ` AND m.is_unlocked = true`;
    } else if (status === 'locked') {
      sql += ` AND m.is_unlocked = false`;
    }

    sql += ' ORDER BY m.created_at DESC';
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(sql, params);

    res.json({
      data: {
        matches: result.rows,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/matches/:id/unlock
 * Unlock a match (WishPad only). Deducts 1 Wee from WishPad's balance.
 */
router.post('/:id/unlock', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const matchId = parseInt(req.params.id, 10);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    // Verify user is a WishPad
    if (req.user.role !== 'wishpad') {
      return res.status(403).json({ error: 'Only WishPads can unlock matches' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the match and verify it belongs to this user
      const matchResult = await client.query(
        'SELECT * FROM matches WHERE id = $1 AND matched_to_user_id = $2 FOR UPDATE',
        [matchId, userId]
      );

      if (matchResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Match not found' });
      }

      const match = matchResult.rows[0];

      if (match.is_unlocked) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Match is already unlocked' });
      }

      // Check WishPad's Wees balance
      const userResult = await client.query(
        'SELECT wees_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      const weesBalance = userResult.rows[0].wees_balance;
      const UNLOCK_COST = 1; // 1 Wee per unlock

      if (weesBalance < UNLOCK_COST) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient Wees. You need at least ${UNLOCK_COST} Wee to unlock a match.`
        });
      }

      // Deduct Wee
      await client.query(
        'UPDATE users SET wees_balance = wees_balance - $1, updated_at = NOW() WHERE id = $2',
        [UNLOCK_COST, userId]
      );

      // Mark match as unlocked
      const updateResult = await client.query(
        `UPDATE matches SET is_unlocked = true, unlocked_at = NOW(), wees_charged = $1
         WHERE id = $2
         RETURNING *`,
        [UNLOCK_COST, matchId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, wees_amount, reference, status)
         VALUES ($1, 'spend', $2, $3, 'completed')`,
        [userId, UNLOCK_COST, `Unlock match #${matchId}`]
      );

      await client.query('COMMIT');

      // Get the full match details with wish info
      const matchDetails = await pool.query(
        `SELECT m.*, w.title as wish_title, w.description, w.user_id as wish_owner_id,
                u.display_name as wish_owner_name, u.username as wish_owner_username,
                u.avatar_url as wish_owner_avatar
         FROM matches m
         JOIN wishes w ON m.wish_id = w.id
         JOIN users u ON w.user_id = u.id
         WHERE m.id = $1`,
        [matchId]
      );

      // Emit socket event for balance update
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('wees_balance', {
          wees_balance: weesBalance - UNLOCK_COST,
          change: -UNLOCK_COST,
          reason: `Unlock match #${matchId}`
        });
      }

      res.json({
        data: {
          match: matchDetails.rows[0],
          wees_balance: weesBalance - UNLOCK_COST,
          message: 'Match unlocked successfully! You can now see the contact details.'
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/stats
 * Get match statistics for a WishPad.
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Only WishPads can view match stats
    if (req.user.role !== 'wishpad') {
      return res.status(403).json({ error: 'Only WishPads can view match statistics' });
    }

    // Total matches for this WishPad
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1',
      [userId]
    );

    // Unlocked matches
    const unlockedResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = true',
      [userId]
    );

    // Unlocked vs locked breakdown
    const lockedResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = false',
      [userId]
    );

    // By category (join with wishes)
    const categoryResult = await pool.query(
      `SELECT w.category, COUNT(*) as count,
              SUM(CASE WHEN m.is_unlocked THEN 1 ELSE 0 END) as unlocked_count
       FROM matches m
       JOIN wishes w ON m.wish_id = w.id
       WHERE m.matched_to_user_id = $1
       GROUP BY w.category
       ORDER BY count DESC`,
      [userId]
    );

    // Total Wees spent on unlocks
    const weesSpentResult = await pool.query(
      'SELECT COALESCE(SUM(wees_charged), 0) as total_wees_spent FROM matches WHERE matched_to_user_id = $1',
      [userId]
    );

    // Recent unlocks (last 7 days)
    const recentUnlocksResult = await pool.query(
      `SELECT m.unlocked_at, w.title as wish_title, w.category
       FROM matches m
       JOIN wishes w ON m.wish_id = w.id
       WHERE m.matched_to_user_id = $1 AND m.is_unlocked = true
       ORDER BY m.unlocked_at DESC
       LIMIT 10`,
      [userId]
    );

    // External vs internal breakdown
    const typeResult = await pool.query(
      `SELECT match_type, COUNT(*) as count
       FROM matches
       WHERE matched_to_user_id = $1
       GROUP BY match_type`,
      [userId]
    );

    res.json({
      data: {
        total_matches: parseInt(totalResult.rows[0].count, 10),
        unlocked_matches: parseInt(unlockedResult.rows[0].count, 10),
        locked_matches: parseInt(lockedResult.rows[0].count, 10),
        total_wees_spent: parseInt(weesSpentResult.rows[0].total_wees_spent, 10),
        by_category: categoryResult.rows,
        by_type: typeResult.rows,
        recent_unlocks: recentUnlocksResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
