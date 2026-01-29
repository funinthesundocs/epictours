-- ============================================
-- MOVE COLOR FROM ROLES TO STAFF_POSITIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add color column to staff_positions
ALTER TABLE staff_positions 
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_positions_color 
ON staff_positions(color);

-- Optional: Remove color column from roles table
-- Uncomment if you want to remove the color from permission groups
-- ALTER TABLE roles DROP COLUMN IF EXISTS color;

-- ============================================
-- VERIFY COLUMN ADDED
-- ============================================
-- Run this query to verify:
-- SELECT id, name, color FROM staff_positions LIMIT 5;
