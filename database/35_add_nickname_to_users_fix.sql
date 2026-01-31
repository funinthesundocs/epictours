-- ============================================
-- FIX: ADD MISSING NICKNAME COLUMN
-- Migration ID: 35
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Notify Supabase to reload schema cache
NOTIFY pgrst, 'reload config';
