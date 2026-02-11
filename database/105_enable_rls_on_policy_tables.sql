-- =====================================================
-- Migration 105: Enable RLS on Tables with Policies
-- =====================================================
-- Purpose: Fix 6 Supabase security errors by enabling RLS
-- on tables that have policies defined but RLS disabled.
--
-- Impact: ZERO - App uses supabaseAdmin (service role)
-- which bypasses all RLS policies.
-- =====================================================

-- Enable RLS on availability_assignments
-- Existing policies: "View all assignments (Force Open)" and 
-- "Manage all assignments (Force Open)" both use USING (true)
ALTER TABLE public.availability_assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_subscriptions  
-- Existing policy: "Allow all for tenant_subscriptions" uses USING (true)
-- Migration 40 disabled this for dev, but service role bypasses RLS anyway
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_users
-- Existing policies from migration 30:
--   - "Users view own org memberships" - users see their own
--   - "Platform admins view all org memberships" - admins see all
-- Service role bypasses these policies
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Verification: Check that RLS is now enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('availability_assignments', 'organization_subscriptions', 'organization_users')
    AND schemaname = 'public'
ORDER BY tablename;
