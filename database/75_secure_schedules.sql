-- Fix Schedules Organization and RLS
-- Description: Adds organization_id to schedules, backfills it, and fixes RLS policies for schedules and stops.

-- 1. Add organization_id to schedules
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Backfill schedules
-- Strategy: Try to find a child stop with an org_id. If none, assign to default Aloha org (since this is legacy data).
DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35'; -- Aloha Circle Island
BEGIN
    -- Update from stops
    UPDATE public.schedules s
    SET organization_id = sub.org_id
    FROM (
        SELECT schedule_id, mode() WITHIN GROUP (ORDER BY organization_id) as org_id
        FROM public.schedule_stops
        WHERE organization_id IS NOT NULL
        GROUP BY schedule_id
    ) sub
    WHERE s.id = sub.schedule_id AND s.organization_id IS NULL;

    -- Update remaining to default
    UPDATE public.schedules SET organization_id = target_org_id WHERE organization_id IS NULL;
END $$;

-- 3. Enable RLS on Schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 4. Strict Policies for Schedules (using organization_users)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.schedules;
DROP POLICY IF EXISTS "View org schedules" ON public.schedules;
DROP POLICY IF EXISTS "Manage org schedules" ON public.schedules;

CREATE POLICY "View org schedules" ON public.schedules FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

CREATE POLICY "Manage org schedules" ON public.schedules FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 5. Fix RLS on Schedule Stops (Add Admin Bypass and use organization_users just in case)
DROP POLICY IF EXISTS "Enable read access for schedule_stops in same org" ON public.schedule_stops;
DROP POLICY IF EXISTS "Enable insert access for schedule_stops in same org" ON public.schedule_stops;
DROP POLICY IF EXISTS "Enable update access for schedule_stops in same org" ON public.schedule_stops;
DROP POLICY IF EXISTS "Enable delete access for schedule_stops in same org" ON public.schedule_stops;

DROP POLICY IF EXISTS "View org stops" ON public.schedule_stops;
DROP POLICY IF EXISTS "Manage org stops" ON public.schedule_stops;

CREATE POLICY "View org stops" ON public.schedule_stops FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

CREATE POLICY "Manage org stops" ON public.schedule_stops FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- Refresh
NOTIFY pgrst, 'reload schema';
