-- Migration: Add option_values to bookings
-- Description: Stores the selected custom field values (Dynamic Options) as JSONB
-- Created: 2026-01-23

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS option_values JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bookings.option_values IS 'Key-value map of custom field IDs/names to user input';

NOTIFY pgrst, 'reload schema';
