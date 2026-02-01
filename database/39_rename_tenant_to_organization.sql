-- =====================================================
-- Migration 39: Rename Tenant to Organization
-- =====================================================
-- Purpose: Standardize naming from 'tenant' to 'organization'
-- This migration renames:
-- 1. tenants table → organizations
-- 2. tenant_subscriptions → organization_subscriptions  
-- 3. All tenant_id columns → organization_id
-- =====================================================

-- ===========================================
-- PHASE 1: RENAME TABLES
-- ===========================================

-- 1.1 Rename tenants → organizations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
        ALTER TABLE tenants RENAME TO organizations;
        RAISE NOTICE '✓ Renamed tenants → organizations';
    ELSE
        RAISE NOTICE 'Table tenants does not exist (may already be renamed)';
    END IF;
END $$;

-- 1.2 Rename tenant_subscriptions → organization_subscriptions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenant_subscriptions' AND table_schema = 'public') THEN
        ALTER TABLE tenant_subscriptions RENAME TO organization_subscriptions;
        RAISE NOTICE '✓ Renamed tenant_subscriptions → organization_subscriptions';
    ELSE
        RAISE NOTICE 'Table tenant_subscriptions does not exist (may already be renamed)';
    END IF;
END $$;

-- ===========================================
-- PHASE 2: RENAME COLUMNS
-- ===========================================

-- 2.1 Rename tenant_id → organization_id in organization_subscriptions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'organization_subscriptions' AND column_name = 'tenant_id') THEN
        ALTER TABLE organization_subscriptions RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed organization_subscriptions.tenant_id → organization_id';
    END IF;
END $$;

-- 2.2 Rename tenant_id → organization_id in users
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
        ALTER TABLE users RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed users.tenant_id → organization_id';
    END IF;
END $$;

-- 2.3 Rename tenant_id → organization_id in roles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'tenant_id') THEN
        ALTER TABLE roles RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed roles.tenant_id → organization_id';
    END IF;
END $$;

-- 2.4 Rename tenant_id → organization_id in staff
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'tenant_id') THEN
        ALTER TABLE staff RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed staff.tenant_id → organization_id';
    END IF;
END $$;

-- 2.5 Rename tenant_id → organization_id in staff_positions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'staff_positions' AND column_name = 'tenant_id') THEN
        ALTER TABLE staff_positions RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed staff_positions.tenant_id → organization_id';
    END IF;
END $$;

-- 2.6 Check for any other tables with tenant_id (for completeness)
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- Checking for remaining tenant_id columns ---';
    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name = 'tenant_id' AND table_schema = 'public'
    LOOP
        RAISE NOTICE 'Found tenant_id in: %', r.table_name;
    END LOOP;
END $$;

-- ===========================================
-- PHASE 3: RENAME UNIQUE CONSTRAINTS (if needed)
-- ===========================================

-- Update roles unique constraint
DO $$
BEGIN
    -- Drop old constraint if exists and create new one
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'roles_tenant_id_name_key' AND table_name = 'roles'
    ) THEN
        ALTER TABLE roles DROP CONSTRAINT roles_tenant_id_name_key;
        ALTER TABLE roles ADD CONSTRAINT roles_organization_id_name_key UNIQUE (organization_id, name);
        RAISE NOTICE '✓ Updated roles unique constraint';
    END IF;
END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Show final state
SELECT 'Tables renamed:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('organizations', 'organization_subscriptions');

SELECT 'Columns with organization_id:' as status;
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'organization_id' AND table_schema = 'public';

-- Check for any remaining tenant references
SELECT 'Remaining tenant_id columns (should be empty):' as status;
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'tenant_id' AND table_schema = 'public';
