-- ============================================================
-- 51_cleanup_architecture.sql
-- Forcefully clean up and remove "Architecture" position
-- ============================================================

BEGIN;

DO $$
DECLARE
    target_pos_id UUID;
BEGIN
    -- 1. Find the position ID
    SELECT id INTO target_pos_id FROM staff_positions WHERE name = 'Architecture' LIMIT 1;

    IF target_pos_id IS NOT NULL THEN
        RAISE NOTICE 'Found Architecture position: %', target_pos_id;

        -- 2. Unlink from organization_users
        UPDATE organization_users 
        SET primary_position_id = NULL 
        WHERE primary_position_id = target_pos_id;

        -- 3. Unlink from staff (if table exists and has position_id)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'position_id') THEN
             UPDATE staff 
             SET position_id = NULL 
             WHERE position_id = target_pos_id;
        END IF;

        -- 4. Delete the position
        DELETE FROM staff_positions WHERE id = target_pos_id;
        
        RAISE NOTICE 'Deleted Architecture position';
    ELSE
        RAISE NOTICE 'Architecture position not found';
    END IF;
END $$;

COMMIT;
