-- ============================================================
-- 45_fix_roles_and_positions_rls.sql
-- Fix Roles & Permissions data isolation and RLS
-- ============================================================

DO $$
DECLARE
    aloha_org_id UUID;
BEGIN
    -- 1. Get Aloha Organization ID
    SELECT id INTO aloha_org_id FROM organizations WHERE slug = 'aloha-circle-island' LIMIT 1;
    
    IF aloha_org_id IS NULL THEN
        RAISE EXCEPTION 'Aloha Circle Island organization not found!';
    END IF;

    RAISE NOTICE 'Assigning roles and positions to Org: %', aloha_org_id;

    -- 2. Force Update roles and positions
    UPDATE roles 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL OR organization_id != aloha_org_id;
    
    UPDATE staff_positions 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL OR organization_id != aloha_org_id;
    
    RAISE NOTICE '✓ Roles and Positions organization_id updated';

END $$;

-- 3. RLS for Roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view roles" ON roles;
CREATE POLICY "Org members can view roles" ON roles
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));
    
-- Allow admins to insert/update/delete (Simplified for Demo - usually restricted to Owners)
DROP POLICY IF EXISTS "Org admins can manage roles" ON roles;
CREATE POLICY "Org admins can manage roles" ON roles
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_users 
        WHERE user_id = auth.uid() AND (is_organization_owner OR primary_position_id IS NOT NULL)
    ));


-- 4. RLS for Staff Positions
ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view positions" ON staff_positions;
CREATE POLICY "Org members can view positions" ON staff_positions
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Org admins can manage positions" ON staff_positions;
CREATE POLICY "Org admins can manage positions" ON staff_positions
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_users 
        WHERE user_id = auth.uid() AND (is_organization_owner OR primary_position_id IS NOT NULL)
    ));
