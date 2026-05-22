const bcrypt = require('bcryptjs');
const pool = require('./pool');

const DEFAULT_ADMIN = {
  email: 'admin@wishpal.com',
  password: 'admin123',
  role: 'wishpad',
  username: 'admin',
  display_name: 'WishPal Admin'
};

async function seedAdmin() {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [DEFAULT_ADMIN.email]);
    if (existing.rows.length > 0) {
      console.log('[Seed] Admin user already exists (id: %s)', existing.rows[0].id);
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, hashed_password, role, username, display_name, wees_balance)
       VALUES ($1, $2, $3, $4, $5, 1000)
       RETURNING id`,
      [DEFAULT_ADMIN.email, hashedPassword, DEFAULT_ADMIN.role, DEFAULT_ADMIN.username, DEFAULT_ADMIN.display_name]
    );

    console.log('[Seed] Admin user created (id: %s)', result.rows[0].id);
    console.log('[Seed]   Email: %s', DEFAULT_ADMIN.email);
    console.log('[Seed]   Password: %s', DEFAULT_ADMIN.password);

    // Also create a wishpad page for the admin
    await pool.query(
      `INSERT INTO wishpad_pages (wishpad_user_id, slug, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (wishpad_user_id) DO NOTHING`,
      [result.rows[0].id, 'wishpal-admin', 'Official WishPal admin page']
    );
  } catch (err) {
    console.error('[Seed] Error creating admin user:', err.message);
  }
}

module.exports = { seedAdmin };
