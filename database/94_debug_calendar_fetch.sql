-- Debug Calendar Fetch
-- Description: Check if Availabilities exist for the target Org, and simulating the Calendar Query.

SELECT 
    'Availabilities Distribution' as section,
    organization_id,
    count(*) 
FROM public.availabilities 
GROUP BY organization_id;

-- Simulate Calendar Fetch (Simplest version)
SELECT 
    'Calendar Fetch Simulation' as section,
    id,
    start_date,
    organization_id
FROM public.availabilities
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
ORDER BY start_date DESC
LIMIT 5;

-- Check Experiences Distribution (Just in case)
SELECT 
    'Experiences Distribution' as section,
    organization_id,
    count(*)
FROM public.experiences
GROUP BY organization_id;
