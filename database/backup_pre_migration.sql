-- ============================================
-- PRE-MIGRATION BACKUP QUERIES
-- Run these in Supabase SQL Editor
-- Copy each result set and save locally
-- Date: 2026-01-31
-- ============================================

-- ============================================
-- 1. USERS TABLE (Central Identity)
-- ============================================
SELECT * FROM users ORDER BY created_at;

-- ============================================
-- 2. STAFF TABLE (Will be modified)
-- ============================================
SELECT * FROM staff ORDER BY name;

-- ============================================
-- 3. VENDORS TABLE (Will be modified)
-- ============================================
SELECT * FROM vendors ORDER BY name;

-- ============================================
-- 4. CUSTOMERS TABLE (Will be modified)
-- ============================================
SELECT * FROM customers ORDER BY name;

-- ============================================
-- 5. SUPPORTING TABLES (Reference data)
-- ============================================
SELECT * FROM staff_positions ORDER BY name;
SELECT * FROM organizations ORDER BY name;
SELECT * FROM organization_users;
SELECT * FROM roles ORDER BY name;
SELECT * FROM user_roles;

-- ============================================
-- 6. BOOKINGS & AVAILABILITIES (Verify FKs)
-- ============================================
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100;
SELECT * FROM availabilities ORDER BY start_date DESC LIMIT 100;
SELECT * FROM experiences ORDER BY name;

-- ============================================
-- 7. RECORD COUNTS (Quick verification)
-- ============================================
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 
    'staff', COUNT(*) FROM staff
UNION ALL SELECT 
    'vendors', COUNT(*) FROM vendors
UNION ALL SELECT 
    'customers', COUNT(*) FROM customers
UNION ALL SELECT 
    'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 
    'availabilities', COUNT(*) FROM availabilities;
