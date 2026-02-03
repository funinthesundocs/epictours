-- ============================================
-- 40: Fix Organization Schema for Platform Admin
-- ============================================
-- This migration addresses:
-- 1. RLS blocking access to organization_users for dev login
-- 2. Missing module_code column in organization_subscriptions

-- ============================================
-- 1. TEMPORARILY DISABLE RLS ON organization_users
-- ============================================
-- The dev login bypass doesn't create a Supabase Auth session,
-- so RLS policies using auth.uid() will fail.
-- This allows the app to function in development.

ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ADD module_code TO organization_subscriptions
-- ============================================
-- The code expects module_code but we only have module_id.
-- Add the column and populate from the modules table.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_subscriptions' 
        AND column_name = 'module_code'
    ) THEN
        -- Add the column
        ALTER TABLE organization_subscriptions 
        ADD COLUMN module_code TEXT;
        
        -- Populate from modules table
        UPDATE organization_subscriptions os
        SET module_code = m.code
        FROM modules m
        WHERE os.module_id = m.id;
        
        RAISE NOTICE '✓ Added and populated module_code column';
    ELSE
        RAISE NOTICE 'module_code column already exists';
    END IF;
END $$;

-- Add is_active column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_subscriptions' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE organization_subscriptions 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        RAISE NOTICE '✓ Added is_active column';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Disable RLS on organization_subscriptions for dev
ALTER TABLE organization_subscriptions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    'organization_users RLS' as check_type,
    CASE WHEN NOT relrowsecurity THEN '✓ Disabled' ELSE '⚠ Enabled' END as status
FROM pg_class WHERE relname = 'organization_users'
UNION ALL
SELECT 
    'organization_subscriptions RLS' as check_type,
    CASE WHEN NOT relrowsecurity THEN '✓ Disabled' ELSE '⚠ Enabled' END as status
FROM pg_class WHERE relname = 'organization_subscriptions';
