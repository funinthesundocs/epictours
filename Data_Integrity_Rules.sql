-- ============================================
-- DATA INTEGRITY RULES - RUN IN SUPABASE SQL EDITOR
-- ============================================
-- This script enforces:
-- 1. Bookings can NEVER be deleted (only cancelled)
-- 2. Availabilities with bookings cannot be deleted

-- ============================================
-- 1. PREVENT BOOKING DELETION (HARD LOCK)
-- ============================================
-- Create a function that blocks DELETE operations on bookings
CREATE OR REPLACE FUNCTION public.prevent_booking_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Bookings cannot be deleted. Use cancel or refund status instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to fire BEFORE DELETE
DROP TRIGGER IF EXISTS no_delete_bookings_trigger ON public.bookings;

CREATE TRIGGER no_delete_bookings_trigger
BEFORE DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_booking_deletion();

-- ============================================
-- 2. PREVENT DELETION OF AVAILABILITIES WITH BOOKINGS
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_availability_deletion_with_bookings()
RETURNS TRIGGER AS $$
DECLARE
    booking_count INTEGER;
BEGIN
    -- Count active bookings (non-cancelled) for this availability
    SELECT COUNT(*) INTO booking_count 
    FROM public.bookings 
    WHERE availability_id = OLD.id 
    AND status != 'cancelled';
    
    IF booking_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete availability with % active booking(s). Cancel the availability instead.', booking_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS no_delete_availability_with_bookings_trigger ON public.availabilities;

CREATE TRIGGER no_delete_availability_with_bookings_trigger
BEFORE DELETE ON public.availabilities
FOR EACH ROW
EXECUTE FUNCTION public.prevent_availability_deletion_with_bookings();

-- ============================================
-- 3. ADD STATUS COLUMN TO AVAILABILITIES (for cancellation)
-- ============================================
ALTER TABLE public.availabilities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'cancelled'));

COMMENT ON COLUMN public.availabilities.status IS 'active = normal, cancelled = vendor cancelled the slot';

-- ============================================
-- 4. ENSURE BOOKED_COUNT COLUMN EXISTS
-- ============================================
ALTER TABLE public.availabilities 
ADD COLUMN IF NOT EXISTS booked_count INTEGER DEFAULT 0;

-- ============================================
-- 5. RECALCULATE ALL EXISTING BOOKED COUNTS
-- ============================================
UPDATE public.availabilities a
SET booked_count = (
    SELECT COALESCE(SUM(pax_count), 0)
    FROM public.bookings b
    WHERE b.availability_id = a.id
    AND b.status != 'cancelled'
);

NOTIFY pgrst, 'reload schema';

-- ============================================
-- DONE! Data integrity rules are now active.
-- ============================================
