-- Delete Anthony Young booking with 2 pax
-- Run this in Supabase SQL Editor or via psql

DELETE FROM bookings 
WHERE pax_count = 2 
AND customer_id IN (
    SELECT id FROM customers WHERE name ILIKE '%Anthony%Young%'
);

-- Verify deletion (optional check):
-- SELECT * FROM bookings WHERE customer_id IN (SELECT id FROM customers WHERE name ILIKE '%Anthony%Young%');
