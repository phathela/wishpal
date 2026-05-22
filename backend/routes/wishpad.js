const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * Middleware to check user is a WishPad
 */
function requireWishpad(req, res, next) {
  if (req.user.role !== 'wishpad') {
    return res.status(403).json({ error: 'Access denied. WishPad role required.' });
  }
  next();
}

/**
 * GET /api/wishpad/page
 * Get the current WishPad's page information.
 */
router.get('/page', authenticate, requireWishpad, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM wishpad_pages WHERE wishpad_user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    // Increment page_views (only when viewing public page, not own)
    // Own view doesn't count as a page view

    res.json({
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/wishpad/page
 * Update the WishPad's page (description, logo, contact, branding).
 */
router.put('/page', authenticate, requireWishpad, [
  body('description').optional(),
  body('logo_url').optional(),
  body('contact_info').optional(),
  body('website').optional(),
  body('social_links_json').optional(),
  body('latitude').optional().isFloat().withMessage('Latitude must be a number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a number'),
  body('country').optional(),
  body('region').optional(),
  body('custom_branding_json').optional().isObject().withMessage('Branding must be a JSON object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const { description, logo_url, contact_info, website, social_links_json, latitude, longitude, country, region, custom_branding_json } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = { description, logo_url, contact_info, website, social_links_json, latitude, longitude, country, region, custom_branding_json };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        const dbKey = key === 'social_links_json' ? 'social_links_json' : key;
        updates.push(`${dbKey} = $${paramIndex++}`);
        values.push(key === 'custom_branding_json' ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE wishpad_pages SET ${updates.join(', ')} WHERE wishpad_user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    res.json({
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/wishpad/stats
 * Detailed stats for WishPad dashboard.
 */
router.get('/stats', authenticate, requireWishpad, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get the wishpad page
    const pageResult = await pool.query(
      'SELECT id, slug, page_views FROM wishpad_pages WHERE wishpad_user_id = $1',
      [userId]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    const pageId = pageResult.rows[0].id;

    // Total matches
    const totalMatchesResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1',
      [userId]
    );

    // Unlocked matches
    const unlockedMatchesResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = true',
      [userId]
    );

    // Current Wees balance
    const balanceResult = await pool.query(
      'SELECT wees_balance FROM users WHERE id = $1',
      [userId]
    );

    // Total Wees spent
    const weesSpentResult = await pool.query(
      `SELECT COALESCE(SUM(wees_charged), 0) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = true`,
      [userId]
    );

    // Total Wees purchased
    const weesPurchasedResult = await pool.query(
      `SELECT COALESCE(SUM(wees_amount), 0) FROM transactions WHERE user_id = $1 AND type = 'purchase' AND status = 'completed'`,
      [userId]
    );

    // Match breakdown by category
    const categoryResult = await pool.query(
      `SELECT w.category, COUNT(*) as count
       FROM matches m
       JOIN wishes w ON m.wish_id = w.id
       WHERE m.matched_to_user_id = $1
       GROUP BY w.category
       ORDER BY count DESC`,
      [userId]
    );

    // Active competitions
    const competitionsResult = await pool.query(
      'SELECT COUNT(*) FROM competitions WHERE wishpad_page_id = $1 AND is_active = true',
      [pageId]
    );

    // Recent activity (last 10 matches)
    const recentMatchesResult = await pool.query(
      `SELECT m.id, m.created_at, m.is_unlocked, m.unlocked_at, m.match_score,
              w.title as wish_title, w.category
       FROM matches m
       JOIN wishes w ON m.wish_id = w.id
       WHERE m.matched_to_user_id = $1
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Page view count
    const pageViews = pageResult.rows[0].page_views || 0;

    res.json({
      data: {
        page: {
          id: pageId,
          slug: pageResult.rows[0].slug,
          page_views: pageViews
        },
        balance: {
          current_wees: parseInt(balanceResult.rows[0].wees_balance, 10),
          total_wees_purchased: parseInt(weesPurchasedResult.rows[0].coalesce, 10),
          total_wees_spent: parseInt(weesSpentResult.rows[0].coalesce, 10)
        },
        matches: {
          total: parseInt(totalMatchesResult.rows[0].count, 10),
          unlocked: parseInt(unlockedMatchesResult.rows[0].count, 10),
          by_category: categoryResult.rows
        },
        competitions: {
          active: parseInt(competitionsResult.rows[0].count, 10)
        },
        recent_matches: recentMatchesResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wishpad/competitions
 * Create a competition for a WishPad's page.
 */
router.post('/competitions', authenticate, requireWishpad, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('prize').optional(),
  body('expiry_date').optional().isDate().withMessage('Expiry date must be a valid date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const { title, description, prize, expiry_date } = req.body;

    // Get the wishpad page ID
    const pageResult = await pool.query(
      'SELECT id FROM wishpad_pages WHERE wishpad_user_id = $1',
      [userId]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    const pageId = pageResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO competitions (wishpad_page_id, title, description, prize, expiry_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [pageId, title, description || null, prize || null, expiry_date || null]
    );

    res.status(201).json({
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/wishpad/competitions
 * List competitions for the current WishPad's page.
 */
router.get('/competitions', authenticate, requireWishpad, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const pageResult = await pool.query(
      'SELECT id FROM wishpad_pages WHERE wishpad_user_id = $1',
      [userId]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    const pageId = pageResult.rows[0].id;

    const result = await pool.query(
      `SELECT * FROM competitions WHERE wishpad_page_id = $1
       ORDER BY created_at DESC`,
      [pageId]
    );

    res.json({
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/wishpad/username
 * Choose or upgrade the WishPad's username.
 */
router.put('/username', authenticate, requireWishpad, [
  body('username').isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.userId;
    const { username } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check username availability
      const existing = await client.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Update user's username
      const userResult = await client.query(
        `UPDATE users SET username = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url`,
        [username, userId]
      );

      // Update the wishpad page slug
      const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await client.query(
        'UPDATE wishpad_pages SET slug = $1 WHERE wishpad_user_id = $2',
        [slug, userId]
      );

      await client.query('COMMIT');

      res.json({
        data: userResult.rows[0],
        slug
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
 * GET /api/wishpad/list
 * Public endpoint listing all WishPads with basic info and map data.
 */
router.get('/list', async (req, res, next) => {
  try {
    const { country, region, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let sql = `
      SELECT wp.id, wp.slug, wp.description, wp.logo_url, wp.country, wp.region,
             wp.latitude, wp.longitude, wp.website, wp.social_links_json, wp.page_views,
             u.display_name, u.username, u.avatar_url, u.id as user_id
      FROM wishpad_pages wp
      JOIN users u ON wp.wishpad_user_id = u.id
      WHERE wp.slug IS NOT NULL
    `;
    let countSql = `SELECT COUNT(*) FROM wishpad_pages wp JOIN users u ON wp.wishpad_user_id = u.id WHERE wp.slug IS NOT NULL`;
    const params = [];
    let idx = 1;

    if (country) {
      sql += ` AND wp.country = $${idx}`;
      countSql += ` AND wp.country = $${idx}`;
      params.push(country);
      idx++;
    }
    if (region) {
      sql += ` AND wp.region = $${idx}`;
      countSql += ` AND wp.region = $${idx}`;
      params.push(region);
      idx++;
    }

    const countResult = await pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    sql += ` ORDER BY wp.page_views DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(sql, params);

    const wishpadsWithStats = await Promise.all(result.rows.map(async (row) => {
      const matchCount = await pool.query(
        'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = true',
        [row.user_id]
      );
      return {
        id: row.id,
        slug: row.slug,
        name: row.display_name || row.username,
        username: row.username,
        description: row.description,
        logo_url: row.logo_url,
        avatar_url: row.avatar_url,
        country: row.country,
        region: row.region,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        website: row.website,
        social_links: row.social_links_json ? JSON.parse(row.social_links_json) : {},
        page_views: row.page_views,
        unlocked_matches: parseInt(matchCount.rows[0].count, 10)
      };
    }));

    res.json({
      data: {
        wishpads: wishpadsWithStats,
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

/**
 * GET /api/wishpad/b/:slug
 * Public route - get a WishPad's public page with basic info and active competitions.
 */
router.get('/b/:slug', optionalAuth, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const pageResult = await pool.query(
      `SELECT wp.*, u.display_name, u.username, u.avatar_url, u.id as user_id
       FROM wishpad_pages wp
       JOIN users u ON wp.wishpad_user_id = u.id
       WHERE wp.slug = $1`,
      [slug]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'WishPad page not found' });
    }

    const page = pageResult.rows[0];

    // Increment page views
    await pool.query(
      'UPDATE wishpad_pages SET page_views = page_views + 1 WHERE id = $1',
      [page.id]
    );

    // Get active competitions
    const competitionsResult = await pool.query(
      `SELECT * FROM competitions
       WHERE wishpad_page_id = $1 AND is_active = true
         AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
       ORDER BY created_at DESC`,
      [page.id]
    );

    // Get public match stats (unlocked count only - shows engagement)
    const unlockedMatchesResult = await pool.query(
      'SELECT COUNT(*) FROM matches WHERE matched_to_user_id = $1 AND is_unlocked = true',
      [page.user_id]
    );

    // Decide what to show based on authentication
    let contactInfo = null;

    // If the viewing user is authenticated and is a WishPad who has a match with this wishpad's wishes
    // or if this is a general public view, show limited info
    if (req.user && req.user.userId) {
      // Check if the viewer has been matched with this wishpad
      const matchCheck = await pool.query(
        `SELECT COUNT(*) FROM matches m
         JOIN wishes w ON m.wish_id = w.id
         WHERE m.matched_to_user_id = $1 AND w.user_id = $2 AND m.is_unlocked = true`,
        [page.user_id, req.user.userId]
      );

      if (parseInt(matchCheck.rows[0].count, 10) > 0) {
        contactInfo = page.contact_info;
      }
    }

    res.json({
      data: {
        page: {
          id: page.id,
          slug: page.slug,
          description: page.description,
          logo_url: page.logo_url,
          website: page.website,
          social_links_json: page.social_links_json,
          latitude: page.latitude ? parseFloat(page.latitude) : null,
          longitude: page.longitude ? parseFloat(page.longitude) : null,
          country: page.country,
          region: page.region,
          page_views: page.page_views + 1,
          custom_branding_json: page.custom_branding_json
        },
        user: {
          display_name: page.display_name,
          username: page.username,
          avatar_url: page.avatar_url
        },
        stats: {
          unlocked_matches: parseInt(unlockedMatchesResult.rows[0].count, 10)
        },
        competitions: competitionsResult.rows,
        contact_info: contactInfo
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
