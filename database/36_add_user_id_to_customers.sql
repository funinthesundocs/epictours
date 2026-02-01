-- ============================================
-- MIGRATION 36: ADD USER_ID TO CUSTOMERS
-- Phase 1 of User Consolidation
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add user_id column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id 
ON customers(user_id) WHERE user_id IS NOT NULL;

-- 3. Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'user_id';

-- ============================================
-- VERIFICATION: Run this to confirm success
-- ============================================
-- Expected: Returns 1 row showing user_id column exists
