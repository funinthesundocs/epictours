-- Migration: Add payment columns to bookings
-- Description: Stores final financial snapshot of the booking
-- Created: 2026-01-23

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'no_payment',
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card',
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb; -- For card token reference etc

COMMENT ON COLUMN public.bookings.amount_paid IS 'Amount actually collected at time of booking (e.g. deposit)';
COMMENT ON COLUMN public.bookings.total_amount IS 'Grand total inc. tax. Useful for calculating Amount Due (Total - Paid)';

NOTIFY pgrst, 'reload schema';
