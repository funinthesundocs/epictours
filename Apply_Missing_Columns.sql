-- RUN THIS IN SUPABASE SQL EDITOR
-- This adds the missing columns that caused the "PGRST204" error.

-- 1. Dynamic Options Storage
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS option_values JSONB DEFAULT '{}'::jsonb;

-- 2. Financial Columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'no_payment';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0.00;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0.00;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS promo_code TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- 3. Notify Supabase to Refresh Cache
NOTIFY pgrst, 'reload schema';
