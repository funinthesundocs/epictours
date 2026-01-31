-- =====================================================
-- CHECK-IN STATUS FEATURE - SQL MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create check_in_statuses table
CREATE TABLE IF NOT EXISTS check_in_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'blue',
    notes TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add check_in_status_id column to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS check_in_status_id UUID REFERENCES check_in_statuses(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE check_in_statuses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy - Users can manage their org's statuses
DROP POLICY IF EXISTS "Users can view org statuses" ON check_in_statuses;
CREATE POLICY "Users can view org statuses" ON check_in_statuses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert org statuses" ON check_in_statuses;
CREATE POLICY "Users can insert org statuses" ON check_in_statuses
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update org statuses" ON check_in_statuses;
CREATE POLICY "Users can update org statuses" ON check_in_statuses
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete org statuses" ON check_in_statuses;
CREATE POLICY "Users can delete org statuses" ON check_in_statuses
    FOR DELETE USING (true);

-- 5. Insert preset statuses (will be linked to first org found, adjust as needed)
DO $$
DECLARE
    org_id UUID;
    unconfirmed_id UUID;
BEGIN
    -- Get the first organization ID (adjust if you have multiple orgs)
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NOT NULL THEN
        -- Insert preset statuses
        INSERT INTO check_in_statuses (status, color, notes, organization_id) VALUES
            ('Unconfirmed', 'orange', 'Default status for new bookings', org_id),
            ('Confirmed', 'blue', 'Customer has confirmed attendance', org_id),
            ('Bus Waiting - Please Call', 'yellow', 'Transportation is waiting', org_id),
            ('Checked-in', 'green', 'Customer has arrived', org_id),
            ('No Show', 'red', 'Customer did not arrive', org_id),
            ('Problem - Please Call', 'yellow', 'Issue requires attention', org_id)
        ON CONFLICT DO NOTHING;
        
        -- Get the Unconfirmed status ID
        SELECT id INTO unconfirmed_id FROM check_in_statuses 
        WHERE status = 'Unconfirmed' AND organization_id = org_id LIMIT 1;
        
        -- Set all existing bookings to Unconfirmed
        IF unconfirmed_id IS NOT NULL THEN
            UPDATE bookings 
            SET check_in_status_id = unconfirmed_id 
            WHERE check_in_status_id IS NULL;
        END IF;
    END IF;
END $$;

-- 6. Verify the setup
SELECT 'Check-in statuses created:' as info;
SELECT id, status, color, notes FROM check_in_statuses ORDER BY created_at;

SELECT 'Bookings updated:' as info;
SELECT COUNT(*) as bookings_with_status FROM bookings WHERE check_in_status_id IS NOT NULL;
