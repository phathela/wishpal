const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const JWT_EXPIRY = '7d';

/**
 * Helper: Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Helper: Build user response object (strip sensitive fields)
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    is_premium_username: user.is_premium_username,
    wees_balance: user.wees_balance,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at
  };
}

/**
 * POST /api/auth/register
 * Register a new user with email, password, and role.
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['wishmate', 'wishpad']).withMessage('Role must be wishmate or wishpad'),
  body('username').optional().isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, role, username } = req.body;

    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check username uniqueness if provided
    if (username) {
      const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existingUsername.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate username from email if not provided
    const finalUsername = username || email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, hashed_password, role, username, display_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url, created_at`,
        [email, hashedPassword, role, finalUsername, finalUsername]
      );

      const user = userResult.rows[0];

      // If registering as WishPad, auto-create a wishpad_pages entry
      if (role === 'wishpad') {
        const slug = finalUsername.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await client.query(
          `INSERT INTO wishpad_pages (wishpad_user_id, slug, description)
           VALUES ($1, $2, $3)`,
          [user.id, slug, `${user.display_name}'s WishPad page`]
        );
      }

      await client.query('COMMIT');

      const token = generateToken(user);

      res.status(201).json({
        data: {
          token,
          user: sanitizeUser(user)
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
 * POST /api/auth/login
 * Authenticate a user with email and password.
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user has a password (might be Google-only account)
    if (!user.hashed_password) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Please login with Google.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user's information.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, username, is_premium_username, wees_balance,
              display_name, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      data: sanitizeUser(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/google
 * Authenticate or register with Google ID token.
 */
router.post('/google', [
  body('google_id').notEmpty().withMessage('Google ID is required'),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['wishmate', 'wishpad'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { google_id, email, role, display_name } = req.body;

    // Check if user exists by google_id
    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);

    if (result.rows.length > 0) {
      // Existing Google user - login
      const user = result.rows[0];
      const token = generateToken(user);

      return res.json({
        data: {
          token,
          user: sanitizeUser(user)
        }
      });
    }

    // Check if user exists by email (link Google account)
    if (email) {
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        // Link Google ID to existing account
        const updateResult = await pool.query(
          `UPDATE users SET google_id = $1, updated_at = NOW()
           WHERE email = $2
           RETURNING id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url, created_at`,
          [google_id, email]
        );

        const user = updateResult.rows[0];
        const token = generateToken(user);

        return res.json({
          data: {
            token,
            user: sanitizeUser(user)
          }
        });
      }
    }

    // Create new user with Google
    const finalRole = role || 'wishmate';
    const generatedUsername = email
      ? email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6)
      : 'user_' + Math.random().toString(36).substring(2, 8);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (email, google_id, role, username, display_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url, created_at`,
        [email || null, google_id, finalRole, generatedUsername, display_name || generatedUsername]
      );

      const user = userResult.rows[0];

      // Auto-create wishpad page for WishPad role
      if (finalRole === 'wishpad') {
        const slug = generatedUsername.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await client.query(
          `INSERT INTO wishpad_pages (wishpad_user_id, slug, description)
           VALUES ($1, $2, $3)`,
          [user.id, slug, `${user.display_name}'s WishPad page`]
        );
      }

      await client.query('COMMIT');

      const token = generateToken(user);

      res.status(201).json({
        data: {
          token,
          user: sanitizeUser(user)
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
 * PUT /api/auth/profile
 * Update user profile (display_name, avatar_url, username).
 */
router.put('/profile', authenticate, [
  body('display_name').optional().isLength({ min: 1, max: 255 }).withMessage('Display name must be 1-255 characters'),
  body('avatar_url').optional().isURL().withMessage('Avatar URL must be a valid URL'),
  body('username').optional().isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { display_name, avatar_url, username } = req.body;
    const userId = req.user.userId;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(display_name);
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }

    if (username !== undefined) {
      // Check username uniqueness
      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      data: sanitizeUser(result.rows[0])
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/upgrade-username
 * Upgrade to a premium username (costs Wees).
 */
router.post('/upgrade-username', authenticate, [
  body('username').isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username } = req.body;
    const userId = req.user.userId;

    // Cost for premium username
    const PREMIUM_USERNAME_COST = 10; // Wees

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current user
      const userResult = await client.query(
        'SELECT wees_balance, is_premium_username FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      if (user.is_premium_username) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You already have a premium username' });
      }

      if (user.wees_balance < PREMIUM_USERNAME_COST) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient Wees. Premium username costs ${PREMIUM_USERNAME_COST} Wees.`
        });
      }

      // Check username availability
      const existingUsername = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (existingUsername.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Deduct Wees
      await client.query(
        'UPDATE users SET wees_balance = wees_balance - $1, is_premium_username = true, username = $2, updated_at = NOW() WHERE id = $3',
        [PREMIUM_USERNAME_COST, username, userId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, wees_amount, reference, status)
         VALUES ($1, 'spend', $2, $3, 'completed')`,
        [userId, PREMIUM_USERNAME_COST, `Premium username: ${username}`]
      );

      await client.query('COMMIT');

      // Fetch updated user
      const updatedUser = await pool.query(
        'SELECT id, email, role, username, is_premium_username, wees_balance, display_name, avatar_url, created_at FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        data: sanitizeUser(updatedUser.rows[0])
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

module.exports = router;
