-- Migrate Schedules to Your Organization (RETRY)
-- STEP 1: Run this query to see your Organizations: 
--     SELECT id, name FROM organizations;
--
-- STEP 2: Copy the ID of the Organization you are currently passing as "effectiveOrganizationId".
--         (The one you are logged into).
--
-- STEP 3: Paste that ID below where it says 'PASTE_YOUR_REAL_ID_HERE'.

DO $$
DECLARE
    -- REPLACE THIS WITH YOUR ACTUAL ORGANIZATION ID
    target_org_id_text TEXT := 'PASTE_YOUR_REAL_ID_HERE'; 
    target_org_id UUID;
    
    -- The source is 'Aloha Circle Island' (Where they are stuck now)
    source_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
BEGIN
    -- Safety Check
    IF target_org_id_text = 'PASTE_YOUR_REAL_ID_HERE' OR target_org_id_text = source_org_id::text THEN
        RAISE EXCEPTION 'Please update target_org_id_text with your DIFFERENT Organization ID. You cannot migrate to the same place.';
    END IF;

    -- Cast
    target_org_id := target_org_id_text::UUID;

    -- 1. Migrate Schedules
    UPDATE public.schedules
    SET organization_id = target_org_id
    WHERE organization_id = source_org_id;

    -- 2. Migrate Schedule Stops
    UPDATE public.schedule_stops
    SET organization_id = target_org_id
    WHERE organization_id = source_org_id;

    RAISE NOTICE 'SUCCESS: Moved schedules from Aloha (%) to Your Org (%)', source_org_id, target_org_id;
END $$;
