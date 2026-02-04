-- Debug Calendar Final
-- Description: Check counts of Availabilities in the Target Org.

SELECT 
    'Target Org' as info,
    '6065c460-ce9c-418a-8071-6367f8a20f35' as org_id;

SELECT 
    'Availabilities in Target Org' as section,
    count(*) 
FROM public.availabilities 
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35';

SELECT 
    'All Availabilities by Org' as section,
    organization_id,
    count(*) 
FROM public.availabilities 
GROUP BY organization_id;
