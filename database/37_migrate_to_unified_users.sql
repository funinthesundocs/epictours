-- ============================================
-- MIGRATION 37: MIGRATE DATA TO UNIFIED USERS
-- Phase 2 of User Consolidation
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: MIGRATE STAFF TO USERS
-- For each staff member, create/match user by email
-- ============================================

-- First, show how many staff records we have
SELECT 'STAFF COUNT:' as info, COUNT(*) as count FROM staff;

-- Insert staff into users (skip if email already exists)
INSERT INTO users (email, name, phone_number, is_active)
SELECT 
    COALESCE(s.email, s.name || '@temp.local') as email,
    s.name,
    s.phone,
    true
FROM staff s
WHERE s.user_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = COALESCE(s.email, s.name || '@temp.local')
)
ON CONFLICT (email) DO NOTHING;

-- Update staff.user_id to point to matching users
UPDATE staff s
SET user_id = u.id
FROM users u
WHERE s.user_id IS NULL
AND u.email = COALESCE(s.email, s.name || '@temp.local');

-- Verify staff linkage
SELECT 'STAFF LINKED:' as info, 
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE user_id IS NULL) as unlinked
FROM staff;

-- ============================================
-- STEP 2: MIGRATE VENDORS TO USERS
-- ============================================

SELECT 'VENDOR COUNT:' as info, COUNT(*) as count FROM vendors;

-- Insert vendors into users
INSERT INTO users (email, name, phone_number, is_active)
SELECT 
    COALESCE(v.email, v.name || '@vendor.temp') as email,
    v.name,
    v.phone,
    true
FROM vendors v
WHERE v.user_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = COALESCE(v.email, v.name || '@vendor.temp')
)
ON CONFLICT (email) DO NOTHING;

-- Update vendors.user_id
UPDATE vendors v
SET user_id = u.id
FROM users u
WHERE v.user_id IS NULL
AND u.email = COALESCE(v.email, v.name || '@vendor.temp');

-- Verify vendor linkage
SELECT 'VENDORS LINKED:' as info,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE user_id IS NULL) as unlinked
FROM vendors;

-- ============================================
-- STEP 3: MIGRATE CUSTOMERS TO USERS
-- ============================================

SELECT 'CUSTOMER COUNT:' as info, COUNT(*) as count FROM customers;

-- Insert customers into users
INSERT INTO users (email, name, phone_number, is_active)
SELECT 
    COALESCE(c.email, c.name || '@customer.temp') as email,
    c.name,
    c.phone,
    true
FROM customers c
WHERE c.user_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = COALESCE(c.email, c.name || '@customer.temp')
)
ON CONFLICT (email) DO NOTHING;

-- Update customers.user_id
UPDATE customers c
SET user_id = u.id
FROM users u
WHERE c.user_id IS NULL
AND u.email = COALESCE(c.email, c.name || '@customer.temp');

-- Verify customer linkage
SELECT 'CUSTOMERS LINKED:' as info,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE user_id IS NULL) as unlinked
FROM customers;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 
    'SUMMARY' as table_name,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FILTER (WHERE user_id IS NOT NULL) FROM staff) as staff_linked,
    (SELECT COUNT(*) FILTER (WHERE user_id IS NOT NULL) FROM vendors) as vendors_linked,
    (SELECT COUNT(*) FILTER (WHERE user_id IS NOT NULL) FROM customers) as customers_linked;
