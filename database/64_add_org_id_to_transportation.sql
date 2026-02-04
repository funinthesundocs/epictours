-- Migration: Add organization_id to transportation tables and enable RLS
-- Description: Adds organization_id column to pickup_points and hotels, links them to organizations, and enables Row Level Security.

-- 1. Add organization_id columns
ALTER TABLE pickup_points
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pickup_points_org_id ON pickup_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_hotels_org_id ON hotels(organization_id);

-- 3. Enable RLS
ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Pickup Points
CREATE POLICY "Enable read access for authenticated users in same org"
ON pickup_points FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
    OR
    (organization_id IS NULL) -- Allow viewing legacy/global items if desired, usually NOT for multi-tenant
);

CREATE POLICY "Enable insert access for authenticated users in same org"
ON pickup_points FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable update access for authenticated users in same org"
ON pickup_points FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete access for authenticated users in same org"
ON pickup_points FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

-- Hotels
CREATE POLICY "Enable read access for hotels in same org"
ON hotels FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable insert access for hotels in same org"
ON hotels FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable update access for hotels in same org"
ON hotels FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete access for hotels in same org"
ON hotels FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
);

-- 5. Backfill Orphaned Data (Optional - Requires valid Org ID)
-- UNCOMMENT AND REPLACE 'YOUR_ORG_ID' TO BACKFILL
-- UPDATE pickup_points SET organization_id = 'YOUR_ORG_ID' WHERE organization_id IS NULL;
-- UPDATE hotels SET organization_id = 'YOUR_ORG_ID' WHERE organization_id IS NULL;
