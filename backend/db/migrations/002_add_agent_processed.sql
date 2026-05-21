-- WishPal Schema Migration 002
-- Adds agent_processed column to wishes table

BEGIN;

ALTER TABLE wishes
ADD COLUMN IF NOT EXISTS agent_processed BOOLEAN DEFAULT false;

COMMIT;
