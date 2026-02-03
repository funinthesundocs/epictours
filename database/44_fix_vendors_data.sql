-- ============================================================
-- 44_fix_vendors_data.sql
-- Fix vendors data isolation and RLS
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

    RAISE NOTICE 'Assigning vendors to Org: %', aloha_org_id;

    -- 2. Force Update ALL vendors to this organization (Demo/Single Tenant Fix)
    -- This ensures they show up in the list filtered by this Org ID
    UPDATE vendors 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL OR organization_id != aloha_org_id;
    
    RAISE NOTICE '✓ Vendors organization_id updated';

END $$;

-- 3. Ensure RLS is enabled and accessible
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Org members can view vendors" ON vendors;

-- Create policy allowing org members to view their vendors
CREATE POLICY "Org members can view vendors" ON vendors
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ))
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

-- Fallback for development (optional, can be removed for strict Prod)
-- CREATE POLICY "Enable all access for authenticated users" ON vendors FOR ALL USING (true);
