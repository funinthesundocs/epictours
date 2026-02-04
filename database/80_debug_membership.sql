-- Debug Membership Tables
-- Description: Check if we are using the wrong table for membership.

SELECT 
    'organization_users count' as table_name, 
    count(*) 
FROM public.organization_users;

-- Check if organization_members exists (this will error if it doesn't, which is good info)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
        RAISE NOTICE 'VALIDATION: organization_members table EXISTS.';
        -- Print count
        DECLARE c INTEGER;
        BEGIN
            EXECUTE 'SELECT count(*) FROM public.organization_members' INTO c;
            RAISE NOTICE 'organization_members row count: %', c;
        END;
    ELSE
        RAISE NOTICE 'VALIDATION: organization_members table DOES NOT EXIST.';
    END IF;
END $$;

-- Check current user's membership in the target org
SELECT 
    'My Role in Target Org' as check_type,
    * 
FROM public.organization_users 
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
AND user_id = auth.uid();

-- Check Admin flags again
SELECT id, email, is_platform_super_admin, is_platform_system_admin FROM public.users WHERE id = auth.uid();
