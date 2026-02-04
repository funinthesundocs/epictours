-- ============================================================
-- 56_ensure_all_vendor_columns.sql
-- COMPREHENSIVE FIX: Ensure ALL required columns exist on the vendors table.
-- Run this if you are still getting "Error saving vendor".
-- ============================================================

-- 1. Contact Name (from Migration 54)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- 2. Address & EIN Fields (from Migration 55)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS ein_number TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- 3. Messaging Fields (from Migration 23 - just in case)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS preferred_messaging_app TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS messaging_handle TEXT;


-- Documentation
COMMENT ON COLUMN vendors.contact_name IS 'Name of the primary contact person';
COMMENT ON COLUMN vendors.ein_number IS 'Employer Identification Number (Tax ID)';

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Verified and added all required columns to vendors table.';
END $$;
