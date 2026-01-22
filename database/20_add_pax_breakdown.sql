-- Migration: Add pax_breakdown column to bookings table
-- Description: Stores the detailed breakdown of passenger types (e.g., {"adult": 2, "child": 1})
-- Created: 2026-01-21

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pax_breakdown JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.bookings.pax_breakdown IS 'JSONB object storing count of each customer type, e.g. {"<uuid>": 2}';

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
