-- ============================================
-- STAFF POSITIONS DEFAULT ROLE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Add default_role_id column to staff_positions table
-- This links each staff position to a permission group (role)
DO $$
BEGIN
    -- Add default_role_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'staff_positions' 
        AND column_name = 'default_role_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE staff_positions 
        ADD COLUMN default_role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added default_role_id column to staff_positions';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_positions_default_role 
ON staff_positions(default_role_id);

-- ============================================
-- ASSIGN EXISTING POSITIONS TO "STAFF MEMBER" PERMISSION GROUP
-- ============================================
-- Find the "Staff Member" role and assign all existing positions to it
DO $$
DECLARE
    staff_member_role_id UUID;
    position_count INT;
BEGIN
    -- Get the Staff Member role ID
    SELECT id INTO staff_member_role_id 
    FROM roles 
    WHERE name = 'Staff Member' 
    LIMIT 1;
    
    IF staff_member_role_id IS NOT NULL THEN
        -- Update all positions that don't have a default_role_id yet
        UPDATE staff_positions 
        SET default_role_id = staff_member_role_id
        WHERE default_role_id IS NULL;
        
        GET DIAGNOSTICS position_count = ROW_COUNT;
        RAISE NOTICE 'Assigned % positions to Staff Member permission group', position_count;
    ELSE
        RAISE NOTICE 'Staff Member role not found - positions will need manual assignment';
    END IF;
END $$;

-- ============================================
-- DISPLAY CURRENT POSITIONS AND THEIR GROUPS
-- ============================================
-- Run this query to verify the assignment:
-- SELECT sp.name AS position_name, r.name AS permission_group
-- FROM staff_positions sp
-- LEFT JOIN roles r ON sp.default_role_id = r.id
-- ORDER BY r.name, sp.name;
