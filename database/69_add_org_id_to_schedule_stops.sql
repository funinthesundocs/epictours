-- Migration: Add organization_id to schedule_stops
-- Description: Adds organization_id column to schedule_stops, creates index, and updates RLS.

-- 1. Add organization_id column
ALTER TABLE schedule_stops
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2. Create Index
CREATE INDEX IF NOT EXISTS idx_schedule_stops_org_id ON schedule_stops(organization_id);

-- 3. Update RLS Policies
-- First, drop existing policy if it's too broad ("Enable all access for authenticated users")
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON schedule_stops;

-- Create granular policies
CREATE POLICY "Enable read access for schedule_stops in same org"
ON schedule_stops FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
    OR
    (organization_id IS NULL) -- For legacy data before backfill, or if intended to be global
);

CREATE POLICY "Enable insert access for schedule_stops in same org"
ON schedule_stops FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable update access for schedule_stops in same org"
ON schedule_stops FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete access for schedule_stops in same org"
ON schedule_stops FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);
