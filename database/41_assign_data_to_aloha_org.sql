-- ============================================================
-- 41_assign_data_to_aloha_org.sql
-- Assign all existing test data to Aloha Circle Island organization
-- ============================================================

-- Step 1: Get the Aloha Circle Island organization ID
DO $$
DECLARE
    aloha_org_id UUID;
BEGIN
    SELECT id INTO aloha_org_id FROM organizations WHERE slug = 'aloha-circle-island' LIMIT 1;
    
    IF aloha_org_id IS NULL THEN
        RAISE EXCEPTION 'Aloha Circle Island organization not found!';
    END IF;
    
    RAISE NOTICE 'Found Aloha Circle Island org: %', aloha_org_id;
    
    -- ============================================================
    -- PHASE 1: Add organization_id columns where missing
    -- ============================================================
    
    -- 1.1 availabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'availabilities' AND column_name = 'organization_id') THEN
        ALTER TABLE availabilities ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to availabilities';
    END IF;
    
    -- 1.2 bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'organization_id') THEN
        ALTER TABLE bookings ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to bookings';
    END IF;
    
    -- 1.3 booking_option_schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_option_schedules' AND column_name = 'organization_id') THEN
        ALTER TABLE booking_option_schedules ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to booking_option_schedules';
    END IF;
    
    -- 1.4 custom_field_definitions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_field_definitions' AND column_name = 'organization_id') THEN
        ALTER TABLE custom_field_definitions ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to custom_field_definitions';
    END IF;
    
    -- 1.5 pricing_schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_schedules' AND column_name = 'organization_id') THEN
        ALTER TABLE pricing_schedules ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to pricing_schedules';
    END IF;
    
    -- 1.6 pricing_variations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_variations' AND column_name = 'organization_id') THEN
        ALTER TABLE pricing_variations ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to pricing_variations';
    END IF;
    
    -- 1.7 customer_types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_types' AND column_name = 'organization_id') THEN
        ALTER TABLE customer_types ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '✓ Added organization_id to customer_types';
    END IF;
    
    -- ============================================================
    -- PHASE 2: Update all NULL organization_ids to Aloha org
    -- ============================================================
    
    -- 2.1 Tables with existing organization_id column
    UPDATE customers SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated customers';
    
    UPDATE experiences SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated experiences';
    
    UPDATE pickup_points SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated pickup_points';
    
    UPDATE hotels SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated hotels';
    
    UPDATE vendors SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated vendors';
    
    UPDATE vehicles SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated vehicles';
    
    UPDATE schedules SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated schedules';
    
    -- 2.2 Tables where we just added organization_id
    UPDATE availabilities SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated availabilities';
    
    UPDATE bookings SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated bookings';
    
    UPDATE booking_option_schedules SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated booking_option_schedules';
    
    UPDATE custom_field_definitions SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated custom_field_definitions';
    
    UPDATE pricing_schedules SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated pricing_schedules';
    
    UPDATE pricing_variations SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated pricing_variations';
    
    UPDATE customer_types SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated customer_types';
    
    -- 2.3 User/Staff/Roles tables (already have organization_id from schema)
    UPDATE users SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated users';
    
    UPDATE staff SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated staff';
    
    UPDATE roles SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated roles';
    
    UPDATE staff_positions SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated staff_positions';
    
    UPDATE activity_logs SET organization_id = aloha_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '✓ Updated activity_logs';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'All data assigned to Aloha Circle Island!';
    RAISE NOTICE '============================================';
END $$;

-- Verify the updates
SELECT 'customers' as table_name, count(*) as total, count(organization_id) as with_org FROM customers
UNION ALL
SELECT 'experiences', count(*), count(organization_id) FROM experiences
UNION ALL
SELECT 'pickup_points', count(*), count(organization_id) FROM pickup_points
UNION ALL
SELECT 'hotels', count(*), count(organization_id) FROM hotels
UNION ALL
SELECT 'vendors', count(*), count(organization_id) FROM vendors
UNION ALL
SELECT 'vehicles', count(*), count(organization_id) FROM vehicles
UNION ALL
SELECT 'schedules', count(*), count(organization_id) FROM schedules
UNION ALL
SELECT 'availabilities', count(*), count(organization_id) FROM availabilities
UNION ALL
SELECT 'bookings', count(*), count(organization_id) FROM bookings
UNION ALL
SELECT 'booking_option_schedules', count(*), count(organization_id) FROM booking_option_schedules
UNION ALL
SELECT 'custom_field_definitions', count(*), count(organization_id) FROM custom_field_definitions
UNION ALL
SELECT 'pricing_schedules', count(*), count(organization_id) FROM pricing_schedules
UNION ALL
SELECT 'pricing_variations', count(*), count(organization_id) FROM pricing_variations
UNION ALL
SELECT 'customer_types', count(*), count(organization_id) FROM customer_types
UNION ALL
SELECT 'users', count(*), count(organization_id) FROM users
UNION ALL
SELECT 'staff', count(*), count(organization_id) FROM staff
UNION ALL
SELECT 'roles', count(*), count(organization_id) FROM roles
UNION ALL
SELECT 'staff_positions', count(*), count(organization_id) FROM staff_positions
UNION ALL
SELECT 'activity_logs', count(*), count(organization_id) FROM activity_logs;
