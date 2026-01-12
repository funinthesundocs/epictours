-- Migration: Convert Status to TEXT (Remove ENUM)
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Drop Default
ALTER TABLE customers ALTER COLUMN status DROP DEFAULT;

-- 2. Convert to TEXT
ALTER TABLE customers ALTER COLUMN status TYPE text;

-- 3. Drop the ENUM type (It is now an orphan)
DROP TYPE IF EXISTS customer_status;
DROP TYPE IF EXISTS customer_status_old;

-- 4. Set Default to 'Lead' (as a simple string)
ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'Lead';

COMMIT;
