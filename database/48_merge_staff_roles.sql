-- ============================================================
-- 48_merge_staff_roles.sql
-- Merge "Office Staff" into "Staff" for both Roles and Positions
-- ============================================================

BEGIN;

-- 1. Standardize Global "Staff" Position Name
-- Rename "Office Staff" position to "Staff" if it belongs to the global Staff role
UPDATE staff_positions
SET name = 'Staff'
WHERE name = 'Office Staff' 
  AND default_role_id IN (SELECT id FROM roles WHERE name = 'Staff' AND organization_id IS NULL)
  AND organization_id IS NULL;


-- 2. Handle potential "Office Staff" ROLES (if any exist from old migrations)
-- We want to move all positions from "Office Staff" Role to "Staff" Role
DO $$
DECLARE
    global_staff_role_id UUID;
    old_office_staff_role_id UUID;
    r RECORD;
BEGIN
    SELECT id INTO global_staff_role_id FROM roles WHERE name = 'Staff' AND organization_id IS NULL LIMIT 1;
    
    -- Loop through any roles named "Office Staff"
    FOR r IN SELECT id FROM roles WHERE name = 'Office Staff'
    LOOP
        -- Move positions
        UPDATE staff_positions 
        SET default_role_id = global_staff_role_id
        WHERE default_role_id = r.id;
        
        -- Delete the old role
        DELETE FROM roles WHERE id = r.id;
    END LOOP;
END $$;


-- 3. Ensure "Staff" Position Exists in Global Staff Role
-- If step 1 didn't find "Office Staff" to rename, maybe we need to create "Staff" position
DO $$
DECLARE
    global_staff_role_id UUID;
BEGIN
    SELECT id INTO global_staff_role_id FROM roles WHERE name = 'Staff' AND organization_id IS NULL LIMIT 1;
    
    IF global_staff_role_id IS NOT NULL THEN
        INSERT INTO staff_positions (name, default_role_id, color, organization_id)
        SELECT 'Staff', global_staff_role_id, '#64748b', NULL
        WHERE NOT EXISTS (SELECT 1 FROM staff_positions WHERE name = 'Staff' AND default_role_id = global_staff_role_id);
    END IF;
END $$;

COMMIT;
