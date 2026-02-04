-- Check Active RLS Policies
-- Description: Lists all policies currently active on the schedules table.

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('schedules', 'schedule_stops');
