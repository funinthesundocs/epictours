-- Migration: Allow Platform Admins to Access Transportation
-- Description: Updates RLS policies for pickup_points and hotels to allow platform super/system admins full access.

-- 1. Drop existing restricted policies
DROP POLICY IF EXISTS "Enable read access for authenticated users in same org" ON pickup_points;
DROP POLICY IF EXISTS "Enable insert access for authenticated users in same org" ON pickup_points;
DROP POLICY IF EXISTS "Enable update access for authenticated users in same org" ON pickup_points;
DROP POLICY IF EXISTS "Enable delete access for authenticated users in same org" ON pickup_points;

DROP POLICY IF EXISTS "Enable read access for hotels in same org" ON hotels;
DROP POLICY IF EXISTS "Enable insert access for hotels in same org" ON hotels;
DROP POLICY IF EXISTS "Enable update access for hotels in same org" ON hotels;
DROP POLICY IF EXISTS "Enable delete access for hotels in same org" ON hotels;

-- 2. Create New Policies (Org Members + Platform Admins)

-- PICKUP POINTS
CREATE POLICY "Enable read access for org members and platform admins"
ON pickup_points FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid()) -- Org Member
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin)) -- Platform Admin
    OR
    organization_id IS NULL -- Global/Legacy
);

CREATE POLICY "Enable insert access for org members and platform admins"
ON pickup_points FOR INSERT
WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

CREATE POLICY "Enable update access for org members and platform admins"
ON pickup_points FOR UPDATE
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

CREATE POLICY "Enable delete access for org members and platform admins"
ON pickup_points FOR DELETE
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

-- HOTELS
CREATE POLICY "Enable read access for org members and platform admins"
ON hotels FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

CREATE POLICY "Enable insert access for org members and platform admins"
ON hotels FOR INSERT
WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

CREATE POLICY "Enable update access for org members and platform admins"
ON hotels FOR UPDATE
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);

CREATE POLICY "Enable delete access for org members and platform admins"
ON hotels FOR DELETE
USING (
    organization_id IN (SELECT organization_id FROM organization_users WHERE user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_platform_super_admin OR is_platform_system_admin))
);
