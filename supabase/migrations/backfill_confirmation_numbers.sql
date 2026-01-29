-- Backfill confirmation numbers for existing January and February 2026 bookings
-- Format: EXP_CODE-MMDDYY-SEQ (based on created_at date)

-- This script generates confirmation numbers for all bookings without one,
-- grouping by experience and creation date to calculate daily sequence

WITH booking_data AS (
    SELECT 
        b.id,
        b.created_at,
        e.short_code,
        a.experience_id,
        ROW_NUMBER() OVER (
            PARTITION BY a.experience_id, DATE(b.created_at)
            ORDER BY b.created_at
        ) as daily_seq
    FROM bookings b
    JOIN availabilities a ON b.availability_id = a.id
    JOIN experiences e ON a.experience_id = e.id
    WHERE b.confirmation_number IS NULL
    AND b.created_at >= '2026-01-01'
    AND b.created_at < '2026-03-01'
)
UPDATE bookings
SET confirmation_number = 
    bd.short_code || '-' || 
    TO_CHAR(bd.created_at, 'MMDDYY') || '-' || 
    bd.daily_seq::TEXT
FROM booking_data bd
WHERE bookings.id = bd.id;

-- Verify the update
SELECT id, confirmation_number, created_at 
FROM bookings 
WHERE created_at >= '2026-01-01' AND created_at < '2026-03-01'
ORDER BY created_at;
