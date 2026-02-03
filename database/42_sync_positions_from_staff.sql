-- ============================================================
-- 42_sync_positions_from_staff.sql
-- Sync positions from legacy staff table to organization_users
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE 'Syncing positions from legacy staff table...';

    -- Update organization_users with position_id from staff table
    -- Matching on user_id and organization_id
    UPDATE organization_users ou
    SET primary_position_id = s.position_id
    FROM staff s
    WHERE s.user_id = ou.user_id
    AND s.organization_id = ou.organization_id
    AND ou.primary_position_id IS NULL; -- Only update if currently null
    
    RAISE NOTICE '✓ Updated positions in organization_users';
    
    -- Verify the update
    -- SELECT count(*) as users_with_positions FROM organization_users WHERE primary_position_id IS NOT NULL;
    
END $$;
