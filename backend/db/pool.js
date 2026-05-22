const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Production/real PostgreSQL
  // Always use SSL with relaxed certificate validation for Railway and cloud hosts.
  // Railway uses localhost internally but still requires SSL on the connection.
  // For a truly local PostgreSQL without SSL, unset DATABASE_URL (uses pg-mem) or set PG_NO_SSL=true.
  const sslDisabled = process.env.PG_NO_SSL === 'true';
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslDisabled ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 60000,
    allowExitOnIdle: false
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err?.message || err);
    if (err?.stack) console.error('[DB] Stack:', err.stack);
  });
} else {
  // Development: use pg-mem (in-memory PostgreSQL emulation)
  const { newDb } = require('pg-mem');
  const memDb = newDb();
  memDb.public.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      hashed_password VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      role VARCHAR(20) NOT NULL DEFAULT 'wishmate',
      username VARCHAR(100) UNIQUE,
      is_premium_username BOOLEAN DEFAULT false,
      wees_balance INTEGER DEFAULT 0,
      display_name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS wishes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      target_date DATE,
      return_action TEXT,
      payment_type VARCHAR(20),
      amount NUMERIC,
      exchange_item_details TEXT,
      exchange_item_photo_url TEXT,
      exchange_item_value NUMERIC,
      expiry_date DATE,
      update_frequency VARCHAR(20) DEFAULT 'daily',
      location_country VARCHAR(100),
      location_region VARCHAR(100),
      visible_to_wishpad_ids INTEGER[],
      agent_processed BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
      matched_to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      match_score NUMERIC,
      is_unlocked BOOLEAN DEFAULT false,
      unlocked_at TIMESTAMP,
      wees_charged INTEGER DEFAULT 0,
      match_type VARCHAR(20) DEFAULT 'internal',
      external_source TEXT,
      external_url TEXT,
      external_title VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      wees_amount INTEGER NOT NULL,
      stripe_payment_intent_id VARCHAR(255),
      usd_amount NUMERIC,
      reference VARCHAR(255),
      status VARCHAR(20) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      comment_text TEXT NOT NULL,
      agent_verified_opinion TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS wishpad_pages (
      id SERIAL PRIMARY KEY,
      wishpad_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      slug VARCHAR(100) UNIQUE NOT NULL,
      page_views INTEGER DEFAULT 0,
      custom_branding_json TEXT DEFAULT '{}',
      description TEXT,
      logo_url TEXT,
      contact_info TEXT,
      website VARCHAR(255),
      social_links_json TEXT DEFAULT '{}',
      latitude NUMERIC,
      longitude NUMERIC,
      country VARCHAR(100),
      region VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100),
      location_country VARCHAR(100),
      location_region VARCHAR(100),
      min_amount NUMERIC,
      max_amount NUMERIC,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS agent_logs (
      id SERIAL PRIMARY KEY,
      wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
      agent_type VARCHAR(100),
      action VARCHAR(255),
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS competitions (
      id SERIAL PRIMARY KEY,
      wishpad_page_id INTEGER REFERENCES wishpad_pages(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      prize TEXT,
      expiry_date DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Adapt pg-mem to match pg Pool interface
  const createClient = () => ({
    query: async (text, params) => {
      try {
        if (typeof text === 'object' && text.text) {
          params = text.values;
          text = text.text;
        }
        const sql = (text || '').toString().trim().toUpperCase();
        if (!text || sql.startsWith('COPY') || sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return { rows: [], rowCount: 0 };
        }

        // Handle RETURNING clause for INSERT/UPDATE
        const isInsert = sql.startsWith('INSERT');
        const isUpdate = sql.startsWith('UPDATE');

        const sqlText = interpolateParams(text, params);
        const result = memDb.public.many(sqlText);
        const rows = result || [];

        // For INSERT with RETURNING, pg-mem may not return data properly
        // Try to query the last inserted row
        if ((isInsert || isUpdate) && rows.length === 0 && text.includes('RETURNING')) {
          try {
            const selectResult = memDb.public.query('SELECT lastval() as id');
            if (selectResult.rows && selectResult.rows.length > 0) {
              const lastId = selectResult.rows[0].id;
              const tableMatch = text.match(/INTO\s+(\w+)/i);
              if (tableMatch) {
                const table = tableMatch[1];
                const details = memDb.public.query(`SELECT * FROM "${table}" WHERE id = ${lastId}`);
                return details;
              }
            }
          } catch (e) {
            // Fall through
          }
        }

        return { rows, rowCount: rows.length };
      } catch (err) {
        try {
          const fallbackSql = interpolateParams(text, params);
          const result = memDb.public.query(fallbackSql);
          return {
            rows: result?.rows || [],
            rowCount: result?.rows?.length || 0
          };
        } catch (e) {
          // Handle common pg-mem unsupported features gracefully
          const cleanText = (text || '')
            .replace(/ORDER BY RANDOM\(\)/gi, '')
            .replace(/NOW\(\)/gi, "TO_TIMESTAMP('now', 'YYYY-MM-DD')")
            .replace(/ILIKE\s+/gi, 'LIKE ')
            .replace(/::\w+/g, '');
          try {
            const cleanSql = interpolateParams(cleanText, params);
            const result = memDb.public.query(cleanSql);
            return {
              rows: result?.rows || [],
              rowCount: result?.rows?.length || 0
            };
          } catch (e2) {
            return { rows: [], rowCount: 0 };
          }
        }
      }
    },
    release: () => {}
  });

  pool = {
    query: async (text, params) => {
      const client = createClient();
      return client.query(text, params);
    },
    connect: async () => createClient(),
    end: async () => {}
  };

  console.log('[DB] Using pg-mem in-memory database (no DATABASE_URL set)');
}

/**
 * Interpolate $1, $2, ... params into SQL text for pg-mem
 * (pg-mem 3.0.x doesn't support parameterized queries with arrays)
 */
function interpolateParams(text, params) {
  if (!params || params.length === 0) return text;
  let result = text;
  for (let i = 0; i < params.length; i++) {
    const placeholder = new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g');
    let value;
    const p = params[i];
    if (p === null || p === undefined) {
      value = 'NULL';
    } else if (typeof p === 'number') {
      value = p.toString();
    } else if (typeof p === 'boolean') {
      value = p ? 'true' : 'false';
    } else if (p instanceof Date) {
      value = "'" + p.toISOString().replace(/'/g, "''") + "'";
    } else if (Array.isArray(p)) {
      value = 'ARRAY[' + p.map(e => (typeof e === 'number' ? e : "'" + String(e).replace(/'/g, "''") + "'")).join(',') + ']';
    } else {
      value = "'" + String(p).replace(/'/g, "''") + "'";
    }
    result = result.replace(placeholder, value);
  }
  return result;
}

module.exports = pool;