-- Debug: Check Transportation Data and RLS Access
-- Description: verifies backfill success and checks if users have access permissions.

DO $$
DECLARE
    aloha_org_id UUID;
    total_pickups INT;
    linked_pickups INT;
    total_hotels INT;
    linked_hotels INT;
BEGIN
    -- 1. Get Org ID
    SELECT id INTO aloha_org_id FROM organizations WHERE slug = 'aloha-circle-island';
    
    RAISE NOTICE 'Aloha Org ID: %', aloha_org_id;

    -- 2. Check Data
    SELECT COUNT(*) INTO total_pickups FROM pickup_points;
    SELECT COUNT(*) INTO linked_pickups FROM pickup_points WHERE organization_id = aloha_org_id;
    
    SELECT COUNT(*) INTO total_hotels FROM hotels;
    SELECT COUNT(*) INTO linked_hotels FROM hotels WHERE organization_id = aloha_org_id;

    RAISE NOTICE 'Pickup Points: % Total, % Linked to Aloha', total_pickups, linked_pickups;
    RAISE NOTICE 'Hotels: % Total, % Linked to Aloha', total_hotels, linked_hotels;

    -- 3. Check Access
    -- List all users who have access to this org via organization_users
    -- (We cannot know the current user's ID in SQL block without auth.uid() context which might be missing in raw SQL run)
    RAISE NOTICE '--- Users with Access to Aloha ---';
END $$;

SELECT 
    u.email,
    ou.is_organization_owner,
    ou.organization_id
FROM organization_users ou
JOIN users u ON u.id = ou.user_id
WHERE ou.organization_id = (SELECT id FROM organizations WHERE slug = 'aloha-circle-island');

-- 4. Check if we need Platform Admin RLS Bypass
-- Are you a platform admin but NOT in the list above?
SELECT id, email, is_platform_super_admin, is_platform_system_admin 
FROM users 
WHERE is_platform_super_admin = true OR is_platform_system_admin = true;
