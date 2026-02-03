-- ============================================================
-- 50_cleanup_architecture_staff.sql
-- Forcefully clean up and remove "Architecture Staff" position
-- ============================================================

BEGIN;

DO $$
DECLARE
    target_pos_id UUID;
BEGIN
    -- 1. Find the position ID
    -- We target the one for "Aloha Pearl Harbor" (or any org really, if we want to be aggressive)
    -- But let's look for name = 'Architecture Staff'
    SELECT id INTO target_pos_id FROM staff_positions WHERE name = 'Architecture Staff' LIMIT 1;

    IF target_pos_id IS NOT NULL THEN
        RAISE NOTICE 'Found Architecture Staff position: %', target_pos_id;

        -- 2. Unlink from organization_users
        UPDATE organization_users 
        SET primary_position_id = NULL 
        WHERE primary_position_id = target_pos_id;

        -- 3. Unlink from staff (if table exists and has position_id)
        -- We use dynamic sql to check if table exists to prevent errors if schema drifted
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'position_id') THEN
             UPDATE staff 
             SET position_id = NULL 
             WHERE position_id = target_pos_id;
        END IF;

        -- 4. Delete the position
        DELETE FROM staff_positions WHERE id = target_pos_id;
        
        RAISE NOTICE 'Deleted Architecture Staff position';
    ELSE
        RAISE NOTICE 'Architecture Staff position not found';
    END IF;
END $$;

COMMIT;
