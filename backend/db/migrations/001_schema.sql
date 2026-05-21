-- WishPal Schema Migration 001
-- Creates all core tables for the WishPal platform

BEGIN;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'wishmate' CHECK (role IN ('wishmate', 'wishpad')),
  username VARCHAR(100) UNIQUE,
  is_premium_username BOOLEAN DEFAULT false,
  wees_balance INTEGER DEFAULT 0,
  display_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  target_date DATE,
  return_action TEXT,
  payment_type VARCHAR(20) CHECK (payment_type IN ('pay', 'exchange')),
  amount DECIMAL(12,2),
  exchange_item_details TEXT,
  exchange_item_photo_url TEXT,
  exchange_item_value DECIMAL(12,2),
  expiry_date DATE,
  update_frequency VARCHAR(20) DEFAULT 'daily' CHECK (update_frequency IN ('hourly', 'daily', 'weekly')),
  location_country VARCHAR(100),
  location_region VARCHAR(100),
  visible_to_wishpad_ids INTEGER[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
  matched_to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2),
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP,
  wees_charged INTEGER DEFAULT 0,
  match_type VARCHAR(20) DEFAULT 'internal' CHECK (match_type IN ('internal', 'external')),
  external_source TEXT,
  external_url TEXT,
  external_title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'spend', 'referral_bonus')),
  wees_amount INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  usd_amount DECIMAL(10,2),
  reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  agent_verified_opinion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WishPad pages table
CREATE TABLE IF NOT EXISTS wishpad_pages (
  id SERIAL PRIMARY KEY,
  wishpad_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  page_views INTEGER DEFAULT 0,
  custom_branding_json JSONB DEFAULT '{}',
  description TEXT,
  logo_url TEXT,
  contact_info TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100),
  location_country VARCHAR(100),
  location_region VARCHAR(100),
  min_amount DECIMAL(12,2),
  max_amount DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id SERIAL PRIMARY KEY,
  wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
  agent_type VARCHAR(100),
  action VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Competitions table
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

COMMIT;
