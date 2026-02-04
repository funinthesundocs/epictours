-- Migration: Backfill Transportation Organization
-- Description: Assigns all existing pickup_points and hotels to 'Aloha Circle Island' organization.

DO $$
DECLARE
    aloha_org_id UUID;
BEGIN
    -- 1. Get Aloha Organization ID by slug
    SELECT id INTO aloha_org_id FROM organizations WHERE slug = 'aloha-circle-island' LIMIT 1;
    
    IF aloha_org_id IS NULL THEN
        RAISE EXCEPTION 'Aloha Circle Island organization not found!';
    END IF;

    RAISE NOTICE 'Found Organization ID: %', aloha_org_id;

    -- 2. Update Pickup Points
    UPDATE pickup_points 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Updated pickup_points rows.';

    -- 3. Update Hotels
    UPDATE hotels 
    SET organization_id = aloha_org_id 
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Updated hotels rows.';

END $$;
