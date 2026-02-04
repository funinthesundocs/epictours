-- Debug Availabilities: Ownership & Security
-- Description: Check where Availabilities are assigned and what Security Rules apply.

SELECT 
    'Availabilities Distribution' as section,
    organization_id,
    count(*) 
FROM public.availabilities 
GROUP BY organization_id;

-- Check RLS Policies for Availabilities
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'availabilities';
