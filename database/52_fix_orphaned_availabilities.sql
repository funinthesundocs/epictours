-- Find the organization ID for "Aloha Circle Island"
DO $$
DECLARE
    target_org_id UUID;
BEGIN
    SELECT id INTO target_org_id FROM organizations WHERE name = 'Aloha Circle Island' LIMIT 1;

    IF target_org_id IS NOT NULL THEN
        -- Update availabilities with NULL organization_id to belong to Aloha Circle Island
        -- We can optionally filter by created_at to be safe, e.g., created today
        UPDATE availabilities
        SET organization_id = target_org_id
        WHERE organization_id IS NULL AND created_at > NOW() - INTERVAL '1 day';
        
        RAISE NOTICE 'Updated missing organizations for Aloha Circle Island';
    ELSE
        RAISE NOTICE 'Organization Aloha Circle Island not found';
    END IF;
END $$;
