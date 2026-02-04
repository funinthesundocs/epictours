-- Debug Bookings Deep Dive
-- Description: Check counts and Policy Definitions

SELECT 
    'Bookings by Org' as section,
    organization_id,
    count(*) 
FROM public.bookings 
GROUP BY organization_id;

SELECT 
    'Bookings with NULL Org' as section,
    count(*) 
FROM public.bookings 
WHERE organization_id IS NULL;

-- Policy Definitions
SELECT 
    policyname, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'bookings';
