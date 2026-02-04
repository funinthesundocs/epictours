-- Force Open RLS (Debug)
-- Description: Sets the RLS policy to TRUE (publicly visible) to rule out role/auth issues.

-- Drop existing relaxed policies
DROP POLICY IF EXISTS "View all schedules (Relaxed)" ON public.schedules;
DROP POLICY IF EXISTS "Manage all schedules (Relaxed)" ON public.schedules;

-- Create "Force Open" policies
CREATE POLICY "View all schedules (Force Open)" ON public.schedules 
FOR SELECT 
USING (true); -- Visible to everyone, even anon (if anon has header, which it usually does in strict mode, but here we just check condition)

CREATE POLICY "Manage all schedules (Force Open)" ON public.schedules 
FOR ALL 
USING (true);

-- Do the same for stops
DROP POLICY IF EXISTS "View all stops (Relaxed)" ON public.schedule_stops;
DROP POLICY IF EXISTS "Manage all stops (Relaxed)" ON public.schedule_stops;

CREATE POLICY "View all stops (Force Open)" ON public.schedule_stops 
FOR SELECT 
USING (true);

CREATE POLICY "Manage all stops (Force Open)" ON public.schedule_stops 
FOR ALL 
USING (true);

NOTIFY pgrst, 'reload schema';
