-- ============================================================
-- 54_add_vendor_contact_name.sql
-- Add contact_name column to vendors table
-- ============================================================

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS contact_name TEXT;

COMMENT ON COLUMN vendors.contact_name IS 'Name of the primary contact person (if different from linked user)';

DO $$
BEGIN
    RAISE NOTICE 'Added contact_name column to vendors table';
END $$;
