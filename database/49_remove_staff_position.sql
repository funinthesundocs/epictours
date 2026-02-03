-- ============================================================
-- 49_remove_staff_position.sql
-- Remove the global "Staff" position as requested
-- ============================================================

BEGIN;

-- Delete the global "Staff" position
-- This is the one we renamed from "Office Staff" or created as "Staff" in previous steps
DELETE FROM staff_positions
WHERE name = 'Staff'
  AND organization_id IS NULL
  AND default_role_id IN (SELECT id FROM roles WHERE name = 'Staff' AND organization_id IS NULL);

COMMIT;
