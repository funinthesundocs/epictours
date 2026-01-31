-- ============================================
-- ADD NICKNAME TO USERS
-- Migration ID: 32
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add nickname column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE;

-- 2. Add index for fast login lookup
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 3. Update RLS policies to allow users to read/update their own nickname
-- (Assuming existing policies cover "users" table generally, but explicitly ensuring here if needed)
-- Existing policies likely cover "all specific columns" or "all columns", checking 30_user_management_schema.sql suggested RLS is enabled.
