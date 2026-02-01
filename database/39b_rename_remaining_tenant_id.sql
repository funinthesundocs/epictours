-- =====================================================
-- Migration 39b: Rename remaining tenant_id columns
-- =====================================================
-- Additional tables found with tenant_id
-- =====================================================

-- customers
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tenant_id') THEN
        ALTER TABLE customers RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed customers.tenant_id → organization_id';
    END IF;
END $$;

-- pickup_points
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pickup_points' AND column_name = 'tenant_id') THEN
        ALTER TABLE pickup_points RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed pickup_points.tenant_id → organization_id';
    END IF;
END $$;

-- hotels
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'hotels' AND column_name = 'tenant_id') THEN
        ALTER TABLE hotels RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed hotels.tenant_id → organization_id';
    END IF;
END $$;

-- experiences
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'experiences' AND column_name = 'tenant_id') THEN
        ALTER TABLE experiences RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed experiences.tenant_id → organization_id';
    END IF;
END $$;

-- vendors
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'tenant_id') THEN
        ALTER TABLE vendors RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed vendors.tenant_id → organization_id';
    END IF;
END $$;

-- schedules
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'tenant_id') THEN
        ALTER TABLE schedules RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed schedules.tenant_id → organization_id';
    END IF;
END $$;

-- vehicles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'tenant_id') THEN
        ALTER TABLE vehicles RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed vehicles.tenant_id → organization_id';
    END IF;
END $$;

-- activity_logs
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'tenant_id') THEN
        ALTER TABLE activity_logs RENAME COLUMN tenant_id TO organization_id;
        RAISE NOTICE '✓ Renamed activity_logs.tenant_id → organization_id';
    END IF;
END $$;

-- VERIFICATION - check no tenant_id columns remain
SELECT 'Remaining tenant_id columns (should be empty):' as status;
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'tenant_id' AND table_schema = 'public';
