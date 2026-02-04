-- Fix: Correct Transportation Organization ID
-- Description: Updates ALL pickup_points and hotels to the correct organization ID provided by the user.

DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
BEGIN
    -- 1. Verify Org Exists (Safety Check)
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = target_org_id) THEN
        RAISE EXCEPTION 'Target Organization ID % not found in organizations table!', target_org_id;
    END IF;

    RAISE NOTICE 'Updating transportation records to Org ID: %', target_org_id;

    -- 2. Update All Pickup Points
    UPDATE pickup_points 
    SET organization_id = target_org_id;
    
    RAISE NOTICE 'Updated all pickup_points rows.';

    -- 3. Update All Hotels
    UPDATE hotels 
    SET organization_id = target_org_id;
    
    RAISE NOTICE 'Updated all hotels rows.';

END $$;
