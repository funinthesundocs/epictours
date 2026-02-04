-- Check Availabilities Date Range
-- Description: Find out WHAT DATES the data actually covers.

SELECT 
    'Date Range' as section,
    MIN(start_date) as earliest_date,
    MAX(start_date) as latest_date,
    count(*) as total_count
FROM public.availabilities
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35';
