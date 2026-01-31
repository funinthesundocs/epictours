-- ============================================
-- ADD ADDRESS COLUMNS TO USERS
-- Migration ID: 33
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;
