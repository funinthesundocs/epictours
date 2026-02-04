-- Debug Bookings Visibility
-- Description: Check where bookings are located (Org ID) and if RLS allows seeing them.

SELECT 
    'Bookings Distribution' as section,
    organization_id,
    count(*)
FROM public.bookings
GROUP BY organization_id;

-- Check for specific known Org
SELECT 
    'Bookings in Target Org' as section,
    count(*)
FROM public.bookings
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35';

-- Check RLS Policies for Bookings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'bookings';
