-- 61_check_vendor_org_isolation.sql
-- Verify if vendors are properly scoped to organizations

-- 1. Check if organization_id column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'vendors' 
    AND column_name = 'organization_id';

-- 2. Check existing RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'vendors';
