-- ============================================
-- USER MANAGEMENT SYSTEM OVERHAUL
-- Migration ID: 30
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. RENAME TENANTS -> ORGANIZATIONS
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
        ALTER TABLE tenants RENAME TO organizations;
        RAISE NOTICE 'Renamed tenants table to organizations';
    END IF;
    
    -- Rename columns in other tables if desired, but keeping tenant_id is often safer for strict backward compat.
    -- Ideally we would rename all tenant_id to organization_id, but that's a massive change.
    -- We will keep 'tenant_id' in resource tables for now, but use 'organization_id' in new tables.
    
    -- Add status column if missing (mapping from is_active)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN
        ALTER TABLE organizations ADD COLUMN status TEXT DEFAULT 'active';
        UPDATE organizations SET status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END;
    END IF;
END $$;

-- ============================================
-- 2. UPDATE USERS TABLE (Platform Flags)
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_platform_super_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_platform_system_admin BOOLEAN DEFAULT false;

-- Migrate existing platform_roles
UPDATE users 
SET is_platform_super_admin = true 
WHERE platform_role = 'developer';

UPDATE users 
SET is_platform_system_admin = true 
WHERE platform_role = 'system_admin';

-- Add messaging_apps JSONB
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS messaging_apps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 3. ORGANIZATION USERS (Link Users <-> Orgs)
-- ============================================
CREATE TABLE IF NOT EXISTS organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Link to "Job Title"
    primary_position_id UUID REFERENCES staff_positions(id) ON DELETE SET NULL,
    
    is_organization_owner BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active', -- active, invited, suspended
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(organization_id, user_id)
);

-- MIGRATE EXISTING DATA
-- 1. Insert from USERS (for legacy tenant_id)
INSERT INTO organization_users (organization_id, user_id, is_organization_owner)
SELECT tenant_id, id, COALESCE(is_tenant_admin, false)
FROM users
WHERE tenant_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 2. Link Positions from STAFF table
-- If a user is linked to a staff record, get that staff record's position
UPDATE organization_users ou
SET primary_position_id = s.position_id
FROM staff s
WHERE s.user_id = ou.user_id
AND s.tenant_id = ou.organization_id;

-- ============================================
-- 4. CROSS-ORGANIZATION ACCESS (Partners/Affiliates)
-- ============================================
CREATE TABLE IF NOT EXISTS cross_organization_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    host_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('partner', 'affiliate')),
    
    -- Optional: Scope to a specific module
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    
    -- The "Role" they act as in the host org
    permission_group_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'revoked')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. INDEXES & RLS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_org_users_user ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_org_users_org ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_cross_org_user ON cross_organization_access(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_org_host ON cross_organization_access(host_organization_id);

ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_organization_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own memberships
CREATE POLICY "Users view own org memberships" ON organization_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy: Platform admins view all
CREATE POLICY "Platform admins view all org memberships" ON organization_users
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

-- ============================================
-- 6. CLEANUP (Optional - often safer to keep for a bit)
-- ============================================
-- ALTER TABLE users DROP COLUMN tenant_id;
-- ALTER TABLE users DROP COLUMN platform_role;
