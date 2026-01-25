-- Add booking_option_variation to availabilities table
-- Determines which option configuration (Retail, Online, Special, Custom) is used by default.

ALTER TABLE IF EXISTS public.availabilities
ADD COLUMN IF NOT EXISTS booking_option_variation TEXT DEFAULT 'retail';
