-- Diagnose Missing Pickup Times in Master Report
-- Description: Investigates why some bookings have pickup location but no pickup time

-- 1. Check bookings with pickup info in option_values but no route assignment
SELECT 'BOOKINGS WITH OPTION_VALUES BUT MISSING ROUTE' as section;
SELECT 
    b.id as booking_id,
    b.confirmation_number,
    b.option_values,
    a.id as availability_id,
    a.transportation_route_id as avail_route_id,
    aa.transportation_route_id as assign_route_id
FROM public.bookings b
JOIN public.availabilities a ON a.id = b.availability_id
LEFT JOIN public.availability_assignments aa ON aa.availability_id = a.id
WHERE b.option_values IS NOT NULL 
  AND b.option_values::text != '{}'
  AND b.organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03'
LIMIT 20;

-- 2. Check all schedule_stops and their pickup point mappings
SELECT 'ALL SCHEDULE STOPS' as section;
SELECT 
    ss.schedule_id,
    s.name as schedule_name,
    ss.pickup_point_id,
    pp.name as pickup_point_name,
    ss.pickup_time
FROM public.schedule_stops ss
JOIN public.schedules s ON s.id = ss.schedule_id
JOIN public.pickup_points pp ON pp.id = ss.pickup_point_id
WHERE s.organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03'
ORDER BY s.name, ss.pickup_time;

-- 3. Check hotels and their pickup point assignments
SELECT 'HOTELS WITH PICKUP POINTS' as section;
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    h.pickup_point_id,
    pp.name as pickup_point_name
FROM public.hotels h
LEFT JOIN public.pickup_points pp ON pp.id = h.pickup_point_id
WHERE h.organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03'
ORDER BY h.name;

-- 4. Find mismatches: Hotels with pickup_points that are NOT in any schedule_stop
SELECT 'HOTELS WITH PICKUP POINTS NOT IN ANY SCHEDULE' as section;
SELECT 
    h.name as hotel_name,
    pp.name as pickup_point_name,
    h.pickup_point_id
FROM public.hotels h
JOIN public.pickup_points pp ON pp.id = h.pickup_point_id
WHERE h.organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03'
  AND h.pickup_point_id NOT IN (
      SELECT DISTINCT pickup_point_id FROM public.schedule_stops WHERE pickup_point_id IS NOT NULL
  );

-- 5. Check if there's a default/fallback schedule that should be used
SELECT 'ALL SCHEDULES' as section;
SELECT id, name, organization_id FROM public.schedules 
WHERE organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03';

-- 6. Sample booking check - shows full chain from booking to pickup time
SELECT 'SAMPLE BOOKING CHAIN' as section;
SELECT 
    b.id as booking_id,
    b.confirmation_number,
    b.option_values,
    a.transportation_route_id,
    aa.transportation_route_id as assign_route,
    s.name as schedule_name,
    h.name as hotel_from_option,
    pp.name as pickup_point,
    ss.pickup_time
FROM public.bookings b
JOIN public.availabilities a ON a.id = b.availability_id
LEFT JOIN public.availability_assignments aa ON aa.availability_id = a.id
LEFT JOIN public.schedules s ON s.id = COALESCE(aa.transportation_route_id, a.transportation_route_id)
-- Extract first UUID-like value from option_values as hotel_id
LEFT JOIN public.hotels h ON h.id::text = (
    SELECT value::text 
    FROM jsonb_each_text(b.option_values) 
    WHERE value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 1
)
LEFT JOIN public.pickup_points pp ON pp.id = h.pickup_point_id
LEFT JOIN public.schedule_stops ss ON ss.schedule_id = COALESCE(aa.transportation_route_id, a.transportation_route_id) 
    AND ss.pickup_point_id = h.pickup_point_id
WHERE b.organization_id = 'a8f7baf8-b3bc-47a4-b645-fea09b4c4e03'
LIMIT 10;
