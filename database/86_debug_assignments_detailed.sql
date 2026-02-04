-- Debug Assignments Detailed
-- Description: Runs ONLY the detailed check to ensure it is seen.

SELECT 
    aa.id as assignment_id,
    aa.transportation_route_id as route_id,
    s.name as schedule_name,
    s.id as schedule_id_found,
    CASE 
        WHEN s.id IS NULL THEN 'BROKEN LINK'
        ELSE 'VALID'
    END as link_status
FROM public.availability_assignments aa
JOIN public.availabilities av ON aa.availability_id = av.id
LEFT JOIN public.schedules s ON aa.transportation_route_id = s.id
WHERE av.organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
LIMIT 20;
