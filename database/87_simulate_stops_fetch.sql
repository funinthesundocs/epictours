-- Simulate Frontend Fetch
-- Description: Runs the exact query the frontend is trying to run.

SELECT 
    'Query Info' as info,
    '6065c460-ce9c-418a-8071-6367f8a20f35' as org_id_used,
    '8152cd38-c31d-47b3-98e4-f90377a01281' as schedule_id_used;

SELECT 
    id, 
    pickup_time, 
    pickup_point_id,
    organization_id,
    schedule_id
FROM public.schedule_stops
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
AND schedule_id = '8152cd38-c31d-47b3-98e4-f90377a01281';

-- Check RLS Policies specifically for schedule_stops
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'schedule_stops';
