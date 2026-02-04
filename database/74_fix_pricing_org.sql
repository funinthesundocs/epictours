-- Fix Pricing Organization ID
-- Description: Adds organization_id to pricing tables and updates RLS.

-- 1. Add organization_id columns
ALTER TABLE public.pricing_schedules 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.pricing_variations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.pricing_rates 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Backfill existing data
DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
BEGIN
    UPDATE public.pricing_schedules SET organization_id = target_org_id WHERE organization_id IS NULL;
    UPDATE public.pricing_variations SET organization_id = target_org_id WHERE organization_id IS NULL;
    UPDATE public.pricing_rates SET organization_id = target_org_id WHERE organization_id IS NULL;
END $$;

-- 3. Drop old policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.pricing_schedules;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.pricing_rates;
DROP POLICY IF EXISTS "Allow public access" ON public.pricing_variations;

-- 4. Create strict policies for Pricing Schedules
ALTER TABLE public.pricing_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org schedules" ON public.pricing_schedules FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org schedules" ON public.pricing_schedules FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 5. Create strict policies for Pricing Variations
ALTER TABLE public.pricing_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org variations" ON public.pricing_variations FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org variations" ON public.pricing_variations FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- 6. Create strict policies for Pricing Rates
ALTER TABLE public.pricing_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org rates" ON public.pricing_rates FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);
CREATE POLICY "Manage org rates" ON public.pricing_rates FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
);

-- Refresh
NOTIFY pgrst, 'reload schema';
