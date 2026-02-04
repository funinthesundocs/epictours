-- Force Open Availabilities (Debug)
-- Description: Sets the RLS policy to TRUE for Availabilities to rule out security blockers.
-- This ensures the Calendar can load the "slots", so it can then load the Bookings inside them.

-- 1. Drop specific policies that might be restrictive
DROP POLICY IF EXISTS "View organization availabilities" ON public.availabilities;
DROP POLICY IF EXISTS "View org availabilities" ON public.availabilities;

-- 2. Create "Force Open" policies
CREATE POLICY "View all availabilities (Force Open)" ON public.availabilities 
FOR SELECT 
USING (true); -- Visible to everyone

CREATE POLICY "Manage all availabilities (Force Open)" ON public.availabilities 
FOR ALL 
USING (true);

-- 3. Reload Schema
NOTIFY pgrst, 'reload schema';
