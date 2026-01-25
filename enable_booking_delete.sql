-- FIND AND REMOVE BLOCKING TRIGGER
-- Run in Supabase SQL Editor

-- =============================================
-- STEP 1: Find ALL triggers on bookings table
-- =============================================
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'bookings';

-- =============================================
-- STEP 2: View the trigger function code
-- =============================================
SELECT 
    proname,
    prosrc AS function_source
FROM pg_proc
WHERE proname ILIKE '%booking%delete%' 
   OR proname ILIKE '%prevent%'
   OR proname ILIKE '%protect%';

-- =============================================
-- STEP 3: DROP the blocking trigger (common names)
-- =============================================
DROP TRIGGER IF EXISTS prevent_booking_delete ON bookings;
DROP TRIGGER IF EXISTS protect_booking_delete ON bookings;
DROP TRIGGER IF EXISTS booking_no_delete ON bookings;
DROP TRIGGER IF EXISTS before_delete_booking ON bookings;
DROP TRIGGER IF EXISTS block_booking_delete ON bookings;

-- =============================================
-- STEP 4: Check for foreign key constraints
-- =============================================
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'bookings';

-- =============================================
-- STEP 5: List ALL triggers and drop them all
-- =============================================
-- DO $$
-- DECLARE
--     trig RECORD;
-- BEGIN
--     FOR trig IN 
--         SELECT tgname FROM pg_trigger t
--         JOIN pg_class c ON t.tgrelid = c.oid
--         WHERE c.relname = 'bookings' AND tgisinternal = false
--     LOOP
--         EXECUTE format('DROP TRIGGER IF EXISTS %I ON bookings', trig.tgname);
--     END LOOP;
-- END $$;

-- =============================================
-- STEP 6: Try a direct delete to see exact error
-- =============================================
-- DELETE FROM bookings WHERE id = 'paste-booking-id-here';
