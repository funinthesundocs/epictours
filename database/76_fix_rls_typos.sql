-- Fix RLS Typos (organization_members -> organization_users)
-- Description: Corrects the table name in RLS policies from organization_members (typo) to organization_users.

-- 1. Bookings
DROP POLICY IF EXISTS "View org bookings" ON public.bookings;
DROP POLICY IF EXISTS "Manage org bookings" ON public.bookings;

CREATE POLICY "View org bookings" ON public.bookings FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

CREATE POLICY "Manage org bookings" ON public.bookings FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 2. Pricing Schedules
DROP POLICY IF EXISTS "View org schedules" ON public.pricing_schedules;
DROP POLICY IF EXISTS "Manage org schedules" ON public.pricing_schedules;

CREATE POLICY "View org schedules" ON public.pricing_schedules FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org schedules" ON public.pricing_schedules FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 3. Pricing Variations
DROP POLICY IF EXISTS "View org variations" ON public.pricing_variations;
DROP POLICY IF EXISTS "Manage org variations" ON public.pricing_variations;

CREATE POLICY "View org variations" ON public.pricing_variations FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org variations" ON public.pricing_variations FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 4. Pricing Rates
DROP POLICY IF EXISTS "View org rates" ON public.pricing_rates;
DROP POLICY IF EXISTS "Manage org rates" ON public.pricing_rates;

CREATE POLICY "View org rates" ON public.pricing_rates FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org rates" ON public.pricing_rates FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- Refresh
NOTIFY pgrst, 'reload schema';
