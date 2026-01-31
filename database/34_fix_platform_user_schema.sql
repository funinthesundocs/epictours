-- ============================================
-- FIX: PLATFORM USER SCHEMA
-- Migration ID: 34
-- Run this in Supabase SQL Editor if you encounter "Column not found" errors
-- ============================================

-- 1. EXTEND USERS TABLE (Address & Contact)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. ADD MESSAGING APPS (JSONB)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS messaging_apps JSONB DEFAULT '[]'::jsonb;

-- 3. ENSURE PLATFORM FLAGS
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_platform_super_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_platform_system_admin BOOLEAN DEFAULT false;

-- 4. ENSURE RLS (Just in case)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow update for all (Development Mode)
-- In production, replace with specific admin policies
DROP POLICY IF EXISTS "Allow all for users" ON users;
CREATE POLICY "Allow all for users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);
