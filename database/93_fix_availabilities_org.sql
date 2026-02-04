-- Fix Availabilities & Verify Bookings
-- Description: Backfills organization_id for Availabilities if they are NULL, and verifies data distribution.

DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
    updated_count INTEGER;
BEGIN
    -- Update Availabilities where organization_id is NULL
    UPDATE public.availabilities
    SET organization_id = target_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Backfilled % Availabilities to Organization %', updated_count, target_org_id;
END $$;

-- Verify Distributions
SELECT 'Availabilities Distribution' as section, organization_id, count(*) FROM public.availabilities GROUP BY organization_id;
SELECT 'Bookings Distribution' as section, organization_id, count(*) FROM public.bookings GROUP BY organization_id;
