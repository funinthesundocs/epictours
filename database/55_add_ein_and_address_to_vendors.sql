-- ============================================================
-- 55_add_ein_and_address_to_vendors.sql
-- Add EIN and address columns to vendors table if missing
-- ============================================================

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS ein_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

COMMENT ON COLUMN vendors.ein_number IS 'Employer Identification Number (Tax ID)';

DO $$
BEGIN
    RAISE NOTICE 'Added EIN and address columns to vendors table';
END $$;
