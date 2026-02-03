-- ============================================================
-- 46_fix_staff_rls.sql
-- Fix Legacy Staff table data isolation and RLS
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

    RAISE NOTICE 'Assigning staff to Org: %', aloha_org_id;

    -- 2. Force Update staff data
    UPDATE staff 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL OR organization_id != aloha_org_id;
    
    RAISE NOTICE '✓ Staff organization_id updated';

END $$;

-- 3. RLS for Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view staff" ON staff;
CREATE POLICY "Org members can view staff" ON staff
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));
    
-- Allow admins to insert/update/delete
DROP POLICY IF EXISTS "Org admins can manage staff" ON staff;
CREATE POLICY "Org admins can manage staff" ON staff
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_users 
        WHERE user_id = auth.uid() AND (is_organization_owner OR primary_position_id IS NOT NULL)
    ));
