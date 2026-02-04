-- Check if organization_id exists in pickup_points and hotels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pickup_points' AND column_name = 'organization_id'
    ) THEN
        RAISE NOTICE 'MISSING: pickup_points.organization_id';
    ELSE
        RAISE NOTICE 'FOUND: pickup_points.organization_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hotels' AND column_name = 'organization_id'
    ) THEN
        RAISE NOTICE 'MISSING: hotels.organization_id';
    ELSE
        RAISE NOTICE 'FOUND: hotels.organization_id';
    END IF;
END $$;

-- Check data distribution
SELECT 
    'pickup_points' as table_name,
    COUNT(*) as total_count,
    COUNT(organization_id) as linked_count,
    COUNT(*) - COUNT(organization_id) as orphaned_count
FROM pickup_points
UNION ALL
SELECT 
    'hotels' as table_name,
    COUNT(*) as total_count,
    COUNT(organization_id) as linked_count,
    COUNT(*) - COUNT(organization_id) as orphaned_count
FROM hotels;

-- List orphaned records (first 5)
SELECT 'ORPHAN_PICKUP' as type, id, name FROM pickup_points WHERE organization_id IS NULL LIMIT 5;
SELECT 'ORPHAN_HOTEL' as type, id, name FROM hotels WHERE organization_id IS NULL LIMIT 5;
