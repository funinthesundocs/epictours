-- ============================================================
-- 53_add_missing_vendor_columns.sql
-- Add name, email, phone columns to vendors table
-- ============================================================

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Optional: Add comment
COMMENT ON COLUMN vendors.name IS 'Company/Business Name';
COMMENT ON COLUMN vendors.email IS 'Company generic email';
COMMENT ON COLUMN vendors.phone IS 'Company generic phone';

-- Raise notice
DO $$
BEGIN
    RAISE NOTICE 'Added name, email, phone columns to vendors table';
END $$;
