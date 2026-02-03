-- ============================================================
-- 58_backfill_missing_ids.sql
-- Force generate IDs for any rows where it is NULL
-- ============================================================

-- 1. Update any rows with NULL id
UPDATE vendors 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- 2. Verify we have no nulls left
DO $$
DECLARE
    null_count INT;
BEGIN
    SELECT COUNT(*) INTO null_count FROM vendors WHERE id IS NULL;
    
    IF null_count > 0 THEN
        RAISE NOTICE 'WARNING: Still found % rows with NULL ID.', null_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All vendor rows have valid IDs now.';
    END IF;
END $$;
