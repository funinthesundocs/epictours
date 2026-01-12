-- Migration: Update Customer Status ENUM (Fixed for Default Value)
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Drop default value first to avoid casting errors during type change
ALTER TABLE customers ALTER COLUMN status DROP DEFAULT;

-- 2. Rename old type to avoid conflict
ALTER TYPE customer_status RENAME TO customer_status_old;

-- 3. Create new type with capitalized, new values
CREATE TYPE customer_status AS ENUM ('Lead', 'Customer', 'Refund', 'Problem');

-- 4. Update the table to use the new type, mapping old values to new ones
ALTER TABLE customers 
ALTER COLUMN status TYPE customer_status 
USING CASE
    WHEN status::text = 'active' THEN 'Customer'::customer_status
    WHEN status::text = 'inactive' THEN 'Refund'::customer_status
    WHEN status::text = 'archived' THEN 'Problem'::customer_status
    WHEN status::text = 'lead' THEN 'Lead'::customer_status
    ELSE 'Lead'::customer_status
END;

-- 5. Set new default value
ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'Lead'::customer_status;

-- 6. Drop the old type
DROP TYPE customer_status_old;

COMMIT;
