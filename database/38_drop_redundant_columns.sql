-- ============================================
-- MIGRATION 38: DROP REDUNDANT IDENTITY COLUMNS
-- Phase 5 of User Consolidation
-- 
-- ⚠️ WARNING: This is DESTRUCTIVE - run only after verifying:
--   1. All pages display names/emails correctly
--   2. All forms work correctly
--   3. Data has been migrated to users table
-- 
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PRE-DROP VERIFICATION
-- Run these FIRST to confirm data integrity
-- ============================================

-- Verify all staff have user_id linked
SELECT 'Staff without user_id:' as check_type, COUNT(*) as count 
FROM staff WHERE user_id IS NULL;

-- Verify all vendors have user_id linked
SELECT 'Vendors without user_id:' as check_type, COUNT(*) as count 
FROM vendors WHERE user_id IS NULL;

-- Verify all customers have user_id linked
SELECT 'Customers without user_id:' as check_type, COUNT(*) as count 
FROM customers WHERE user_id IS NULL;

-- ============================================
-- If counts above are 0, proceed below
-- ============================================

-- ============================================
-- STEP 1: DROP COLUMNS FROM STAFF
-- ============================================
ALTER TABLE staff 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Verify
SELECT 'Staff columns dropped' as status;

-- ============================================
-- STEP 2: DROP COLUMNS FROM VENDORS
-- ============================================
ALTER TABLE vendors 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Verify
SELECT 'Vendor columns dropped' as status;

-- ============================================
-- STEP 3: DROP COLUMNS FROM CUSTOMERS
-- ============================================
ALTER TABLE customers 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Verify
SELECT 'Customer columns dropped' as status;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 
    'COMPLETE' as migration_status,
    (SELECT COUNT(*) FROM staff) as total_staff,
    (SELECT COUNT(*) FROM vendors) as total_vendors,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM users) as total_users;
