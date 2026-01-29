-- ============================================
-- POSITION PERMISSIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create position_permissions table for position-specific overrides
CREATE TABLE IF NOT EXISTS position_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES staff_positions(id) ON DELETE CASCADE,
    module_code TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(position_id, module_code, resource_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_position_permissions_position 
ON position_permissions(position_id);

CREATE INDEX IF NOT EXISTS idx_position_permissions_module 
ON position_permissions(module_code, resource_type);

-- Add RLS policies
ALTER TABLE position_permissions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to position_permissions" 
ON position_permissions FOR SELECT 
TO authenticated 
USING (true);

-- Allow full access to service role
CREATE POLICY "Allow full access to position_permissions for service role" 
ON position_permissions FOR ALL 
TO service_role 
USING (true);

-- Allow insert/update/delete for authenticated users (admin check should be in app)
CREATE POLICY "Allow write access to position_permissions" 
ON position_permissions FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update access to position_permissions" 
ON position_permissions FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete access to position_permissions" 
ON position_permissions FOR DELETE 
TO authenticated 
USING (true);

-- ============================================
-- VERIFY TABLE CREATION
-- ============================================
-- Run this query to verify:
-- SELECT * FROM position_permissions LIMIT 5;
