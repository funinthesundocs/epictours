-- Relax Schedule RLS
-- Description: The strict RLS policy is blocking access in the app. This script temporarily relaxes it to restore visibility.

-- 1. Drop strict policies on Schedules
DROP POLICY IF EXISTS "View org schedules" ON public.schedules;
DROP POLICY IF EXISTS "Manage org schedules" ON public.schedules;

-- 2. Create permissive policy (Allow all authenticated users to seeing schedules)
DROP POLICY IF EXISTS "View all schedules (Relaxed)" ON public.schedules;
DROP POLICY IF EXISTS "Manage all schedules (Relaxed)" ON public.schedules;

CREATE POLICY "View all schedules (Relaxed)" ON public.schedules 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Manage all schedules (Relaxed)" ON public.schedules 
FOR ALL 
USING (auth.role() = 'authenticated');

-- 3. Relax Schedule Stops as well
DROP POLICY IF EXISTS "View org stops" ON public.schedule_stops;
DROP POLICY IF EXISTS "Manage org stops" ON public.schedule_stops;

DROP POLICY IF EXISTS "View all stops (Relaxed)" ON public.schedule_stops;
CREATE POLICY "View all stops (Relaxed)" ON public.schedule_stops 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage all stops (Relaxed)" ON public.schedule_stops;
CREATE POLICY "Manage all stops (Relaxed)" ON public.schedule_stops 
FOR ALL 
USING (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
