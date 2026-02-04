-- Check Bookings Data Counts
-- Description: Verifying if the Backfill actually moved the bookings.

SELECT 
    'Bookings Distribution' as section,
    organization_id,
    count(*) 
FROM public.bookings 
GROUP BY organization_id;

SELECT 
    'Bookings with NULL Org' as section,
    count(*) 
FROM public.bookings 
WHERE organization_id IS NULL;
