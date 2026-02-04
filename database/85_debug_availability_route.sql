-- Debug Availability Assignments -> Schedule Route
-- Description: Check if Availabilities are linked to valid Schedules in the correct Org.

SELECT 
    'Availability Assignments Check' as section,
    aa.id as assignment_id,
    aa.availability_id,
    av.organization_id as availability_org_id,
    aa.transportation_route_id,
    s.name as schedule_name,
    s.organization_id as schedule_org_id,
    -- Check if Schedule Org matches Availability Org
    CASE 
        WHEN s.organization_id IS NULL THEN 'Schedule Missing or No Org'
        WHEN s.organization_id = av.organization_id THEN 'MATCH'
        ELSE 'MISMATCH'
    END as org_status
FROM public.availability_assignments aa
JOIN public.availabilities av ON aa.availability_id = av.id
LEFT JOIN public.schedules s ON aa.transportation_route_id = s.id
LIMIT 20;

-- Check specifically for the Target Org (Your Org) via Availability
SELECT 
    'Target Org Assignments' as section,
    av.organization_id,
    count(*)
FROM public.availability_assignments aa
JOIN public.availabilities av ON aa.availability_id = av.id
WHERE av.organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
GROUP BY av.organization_id;
