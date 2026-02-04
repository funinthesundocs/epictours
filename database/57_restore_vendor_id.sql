-- ============================================================
-- 57_restore_vendor_id.sql
-- Force-ensure the ID column exists as a Primary Key
-- ============================================================

-- Reference: https://github.com/supabase/postgrest-js/issues/298
-- Sometimes select(*) might behave oddly if permissions are weird, but usually it works.
-- We will ensure the column physically exists.

DO $$
BEGIN
    -- Check if 'id' column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'id'
    ) THEN
        RAISE NOTICE 'Restoring missing ID column...';
        ALTER TABLE vendors ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    ELSE
        RAISE NOTICE 'ID column already exists.';
    END IF;
END $$;

-- Verify RLS isn't hiding it (although RLS usually hides rows, not columns)
-- Ensure the policy allows selecting the ID
-- (Existing policies usually allow "ALL" or "SELECT" on the whole table)

