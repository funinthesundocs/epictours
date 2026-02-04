-- Debug RLS Visibility
-- Description: Diagnoses why the current user cannot see schedules, even if Organization IDs match.
-- Run this in Supabase SQL Editor.

SELECT 
    'User Status' as check_type,
    auth.uid() as current_user_id,
    (SELECT is_platform_super_admin FROM public.users WHERE id = auth.uid()) as is_super_admin,
    (SELECT is_platform_system_admin FROM public.users WHERE id = auth.uid()) as is_system_admin,
    (SELECT count(*) FROM public.organization_users WHERE user_id = auth.uid()) as total_org_memberships;

SELECT 
    'Org Membership Check' as check_type,
    organization_id,
    is_organization_owner,
    status
FROM public.organization_users 
WHERE user_id = auth.uid();

SELECT
    'Schedule Visibility Check' as check_type,
    id,
    name,
    organization_id
FROM public.schedules;
