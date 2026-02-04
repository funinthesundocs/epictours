-- Debug Schedules Visibility
-- Description: Counts schedules to see where they are assigned.

DO $$
DECLARE
    total_count INTEGER;
    null_org_count INTEGER;
    aloha_org_count INTEGER;
    other_org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.schedules;
    SELECT COUNT(*) INTO null_org_count FROM public.schedules WHERE organization_id IS NULL;
    SELECT COUNT(*) INTO aloha_org_count FROM public.schedules WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35';
    
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'DEBUG REPORT:';
    RAISE NOTICE 'Total Schedules: %', total_count;
    RAISE NOTICE 'Schedules with NULL Org ID: %', null_org_count;
    RAISE NOTICE 'Schedules in Aloha Org (Default): %', aloha_org_count;
    RAISE NOTICE '---------------------------------------------------';
    
    -- List distinct Org IDs found
    RAISE NOTICE 'Distinct Organization IDs found in Schedules:';
    FOR other_org_count IN SELECT COUNT(*) FROM public.schedules GROUP BY organization_id
    LOOP
       -- We can't iterate efficiently here without a cursor, but the counts above tell the main story.
    END LOOP;
END $$;

-- Select to show actual values if running as query
SELECT 
    organization_id, 
    COUNT(*) as schedule_count 
FROM public.schedules 
GROUP BY organization_id;
