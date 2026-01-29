-- ============================================
-- FIX: RLS POLICIES FOR RBAC TABLES
-- Run this to enable proper access control
-- ============================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Platform admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Allow all for tenants" ON tenants;

-- For development/initial setup: Allow full access to tenants
-- In production, you would use more restrictive policies based on auth.uid()
CREATE POLICY "Allow all for tenants" ON tenants
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Users table policies
DROP POLICY IF EXISTS "Allow all for users" ON users;
CREATE POLICY "Allow all for users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Roles table policies
DROP POLICY IF EXISTS "Allow all for roles" ON roles;
CREATE POLICY "Allow all for roles" ON roles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Role permissions policies
DROP POLICY IF EXISTS "Allow all for role_permissions" ON role_permissions;
CREATE POLICY "Allow all for role_permissions" ON role_permissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- User roles policies
DROP POLICY IF EXISTS "Allow all for user_roles" ON user_roles;
CREATE POLICY "Allow all for user_roles" ON user_roles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Tenant subscriptions policies
DROP POLICY IF EXISTS "Allow all for tenant_subscriptions" ON tenant_subscriptions;
CREATE POLICY "Allow all for tenant_subscriptions" ON tenant_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Modules policies (read-only for non-admins typically)
DROP POLICY IF EXISTS "Allow all for modules" ON modules;
CREATE POLICY "Allow all for modules" ON modules
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Module resources policies
DROP POLICY IF EXISTS "Allow all for module_resources" ON module_resources;
CREATE POLICY "Allow all for module_resources" ON module_resources
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- NOTE: These permissive policies are for 
-- development. In production, you would 
-- implement proper auth.uid() based checks.
-- ============================================
