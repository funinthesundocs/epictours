-- Debug Availabilities Organization ID
-- Description: The Calendar loads Availabilities. If THEY are missing Org IDs, nothing shows up.

SELECT 
    'Availabilities Distribution' as section,
    organization_id,
    count(*)
FROM public.availabilities
GROUP BY organization_id;

SELECT 
    'Total Availabilities' as section,
    count(*) as total_count
FROM public.availabilities;
