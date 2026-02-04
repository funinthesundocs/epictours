-- Force Open Pricing RLS (Debug)
-- Description: Temporarily bypasses strict RLS on pricing tables so client-side Supabase can fetch data.
-- Mirrors pattern from 101_force_open_bookings.sql

-- 1. Pricing Schedules
DROP POLICY IF EXISTS "View org schedules" ON public.pricing_schedules;
DROP POLICY IF EXISTS "Manage org schedules" ON public.pricing_schedules;

CREATE POLICY "View all pricing_schedules (Force Open)" ON public.pricing_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Manage all pricing_schedules (Force Open)" ON public.pricing_schedules 
FOR ALL 
USING (true);

-- 2. Pricing Variations
DROP POLICY IF EXISTS "View org variations" ON public.pricing_variations;
DROP POLICY IF EXISTS "Manage org variations" ON public.pricing_variations;

CREATE POLICY "View all pricing_variations (Force Open)" ON public.pricing_variations 
FOR SELECT 
USING (true);

CREATE POLICY "Manage all pricing_variations (Force Open)" ON public.pricing_variations 
FOR ALL 
USING (true);

-- 3. Pricing Rates
DROP POLICY IF EXISTS "View org rates" ON public.pricing_rates;
DROP POLICY IF EXISTS "Manage org rates" ON public.pricing_rates;

CREATE POLICY "View all pricing_rates (Force Open)" ON public.pricing_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Manage all pricing_rates (Force Open)" ON public.pricing_rates 
FOR ALL 
USING (true);

NOTIFY pgrst, 'reload schema';
