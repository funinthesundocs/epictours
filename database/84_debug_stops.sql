-- Debug Schedule Stops
-- Description: Inspects if schedule_stops exist and represent the correct data for the Org.

SELECT 
    'Counts' as section,
    (SELECT count(*) FROM public.schedules) as total_schedules,
    (SELECT count(*) FROM public.schedule_stops) as total_stops;

SELECT 
    'Stops in Target Org' as section,
    organization_id,
    count(*) 
FROM public.schedule_stops 
GROUP BY organization_id;

-- Sample Stops for the Target Org
SELECT 
    'Sample Stops' as section,
    ss.id as stop_id,
    ss.pickup_time,
    ss.schedule_id,
    s.name as schedule_name,
    pp.name as pickup_point_name,
    ss.pickup_point_id
FROM public.schedule_stops ss
LEFT JOIN public.schedules s ON ss.schedule_id = s.id
LEFT JOIN public.pickup_points pp ON ss.pickup_point_id = pp.id
WHERE ss.organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
LIMIT 10;
