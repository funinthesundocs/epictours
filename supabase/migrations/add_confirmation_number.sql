-- Add confirmation_number column to bookings table
-- This column stores the system-generated confirmation number in format: EXP-MMDDYY-SEQ
-- Example: ACI-012926-1 (Aloha Circle Island, Jan 29 2026, 1st booking of day)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmation_number TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_number ON bookings(confirmation_number);

-- Make it unique to prevent duplicates
ALTER TABLE bookings 
ADD CONSTRAINT unique_confirmation_number UNIQUE (confirmation_number);
