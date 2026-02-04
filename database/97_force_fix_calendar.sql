-- Force Fix Calendar (Data & Security)
-- Description: Ensures all Calendar data (Availabilities & Assignments) belongs to your Org and is visible.

DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
    avail_count INTEGER;
    assign_count INTEGER;
BEGIN
    -- 1. FIX DATA: Force Availabilities to Target Org
    UPDATE public.availabilities
    SET organization_id = target_org_id
    WHERE organization_id IS NULL 
       OR organization_id != target_org_id; -- Claim ALL loose data (Dev environment only!)

    GET DIAGNOSTICS avail_count = ROW_COUNT;

    -- 2. FIX DATA: Assignments inherit from Availabilities, so no update needed.
    -- UPDATE public.availability_assignments ... (SKIPPED: No org_id column)

    -- GET DIAGNOSTICS assign_count = ROW_COUNT;
    assign_count := 0;

    RAISE NOTICE 'Updated % Availabilities and % Assignments to Org %', avail_count, assign_count, target_org_id;
END $$;

-- 3. FIX SECURITY: Force Open Availability Assignments (Just in case)
DROP POLICY IF EXISTS "View all assignments (Force Open)" ON public.availability_assignments;
CREATE POLICY "View all assignments (Force Open)" ON public.availability_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Manage all assignments (Force Open)" ON public.availability_assignments;
CREATE POLICY "Manage all assignments (Force Open)" ON public.availability_assignments FOR ALL USING (true);

NOTIFY pgrst, 'reload schema';

-- 4. VERIFY
SELECT 'Final Availabilities Count' as section, count(*) FROM public.availabilities WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35';
SELECT 'Final Assignments Count' as section, count(*) FROM public.availability_assignments;
