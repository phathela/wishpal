const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/search
 * Public search endpoint for active wishes.
 * Supports filtering by keyword, category, location, amount range.
 * Returns paginated results with basic info only.
 * Contact details are hidden unless the requester is an authenticated WishPad with an unlocked match.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q,
      category,
      location_country,
      location_region,
      min_amount,
      max_amount,
      closing_soon,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let sql = `
      SELECT
        w.id, w.title, w.category, w.description,
        w.location_country, w.location_region,
        w.payment_type, w.amount,
        w.exchange_item_details, w.exchange_item_value,
        w.target_date, w.expiry_date,
        w.created_at,
        u.display_name as user_display_name,
        u.username as user_username
    `;
    let countSql = 'SELECT COUNT(*)';
    const fromClause = `
      FROM wishes w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'active'
    `;

    sql += fromClause;
    countSql += fromClause;

    const params = [];
    let paramIndex = 1;

    // Keyword search (searches title and description)
    if (q && q.trim()) {
      const searchPattern = `%${q.trim()}%`;
      sql += ` AND (w.title ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`;
      countSql += ` AND (w.title ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`;
      params.push(searchPattern);
      paramIndex++;
    }

    // Category filter
    if (category) {
      sql += ` AND w.category = $${paramIndex}`;
      countSql += ` AND w.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Location filters
    if (location_country) {
      sql += ` AND w.location_country = $${paramIndex}`;
      countSql += ` AND w.location_country = $${paramIndex}`;
      params.push(location_country);
      paramIndex++;
    }

    if (location_region) {
      sql += ` AND w.location_region = $${paramIndex}`;
      countSql += ` AND w.location_region = $${paramIndex}`;
      params.push(location_region);
      paramIndex++;
    }

    // Amount range filters
    if (min_amount) {
      const minVal = parseFloat(min_amount);
      if (!isNaN(minVal)) {
        sql += ` AND (w.amount >= $${paramIndex} OR w.exchange_item_value >= $${paramIndex})`;
        countSql += ` AND (w.amount >= $${paramIndex} OR w.exchange_item_value >= $${paramIndex})`;
        params.push(minVal);
        paramIndex++;
      }
    }

    if (max_amount) {
      const maxVal = parseFloat(max_amount);
      if (!isNaN(maxVal)) {
        sql += ` AND (w.amount <= $${paramIndex} OR w.exchange_item_value <= $${paramIndex})`;
        countSql += ` AND (w.amount <= $${paramIndex} OR w.exchange_item_value <= $${paramIndex})`;
        params.push(maxVal);
        paramIndex++;
      }
    }

    // Closing soon filter (expiring within 7 days)
    if (closing_soon === 'true') {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      sql += ` AND w.expiry_date IS NOT NULL AND w.expiry_date >= $${paramIndex} AND w.expiry_date <= $${paramIndex + 1}`;
      countSql += ` AND w.expiry_date IS NOT NULL AND w.expiry_date >= $${paramIndex} AND w.expiry_date <= $${paramIndex + 1}`;
      params.push(today, sevenDaysFromNow);
      paramIndex += 2;
    }

    // Check if user is authenticated as a WishPad
    let isWishpadViewer = false;
    let viewerUserId = null;

    if (req.user && req.user.userId && req.user.role === 'wishpad') {
      isWishpadViewer = true;
      viewerUserId = req.user.userId;
    }

    // Count total results
    const countResult = await pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    sql += ` ORDER BY w.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(sql, params);

    // For WishPad viewers, check if they have unlocked matches to see contact info
    let unlockedMatchUserIds = [];
    if (isWishpadViewer && result.rows.length > 0) {
      const wishIds = result.rows.map(r => r.id);
      const matchCheck = await pool.query(
        `SELECT DISTINCT w.user_id FROM matches m
         JOIN wishes w ON m.wish_id = w.id
         WHERE m.matched_to_user_id = $1
           AND m.is_unlocked = true
           AND w.id = ANY($2)`,
        [viewerUserId, wishIds]
      );
      unlockedMatchUserIds = matchCheck.rows.map(r => r.user_id);
    }

    // Sanitize results - hide contact info for locked matches
    const sanitizedResults = result.rows.map(row => {
      const sanitized = {
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        location_country: row.location_country,
        location_region: row.location_region,
        payment_type: row.payment_type,
        amount: row.amount ? parseFloat(row.amount) : null,
        exchange_item_details: row.exchange_item_details,
        exchange_item_value: row.exchange_item_value ? parseFloat(row.exchange_item_value) : null,
        target_date: row.target_date,
        expiry_date: row.expiry_date,
        created_at: row.created_at,
        user: {
          display_name: row.user_display_name,
          username: row.user_username
        }
      };

      // Only show user ID if the WishPad has an unlocked match with this user
      if (isWishpadViewer) {
        // The user_id is already exposed via match unlocks; for search we keep it hidden
        // unless there's an existing unlocked relationship
      }

      return sanitized;
    });

    res.json({
      data: {
        wishes: sanitizedResults,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
