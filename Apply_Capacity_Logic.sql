-- RUN THIS IN SUPABASE SQL EDITOR
-- This adds the logic to automatically track how many seats are taken.

-- 1. Add booked_count column to availabilities
ALTER TABLE public.availabilities 
ADD COLUMN IF NOT EXISTS booked_count INTEGER DEFAULT 0;

-- 2. Create Function to Recalculate Logic
CREATE OR REPLACE FUNCTION public.recalculate_availability_pax()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the availability linked to the NEW booking (or OLD if deleted)
    -- We sum all 'pax_count' for bookings that are NOT cancelled
    
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.availabilities
        SET booked_count = (
            SELECT COALESCE(SUM(pax_count), 0)
            FROM public.bookings
            WHERE availability_id = NEW.availability_id
            AND status != 'cancelled'
        )
        WHERE id = NEW.availability_id;
    END IF;

    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        UPDATE public.availabilities
        SET booked_count = (
            SELECT COALESCE(SUM(pax_count), 0)
            FROM public.bookings
            WHERE availability_id = OLD.availability_id
            AND status != 'cancelled'
        )
        WHERE id = OLD.availability_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS update_capacity_trigger ON public.bookings;

CREATE TRIGGER update_capacity_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_availability_pax();

-- 4. Initial Recalculation (Fix existing data)
UPDATE public.availabilities a
SET booked_count = (
    SELECT COALESCE(SUM(pax_count), 0)
    FROM public.bookings b
    WHERE b.availability_id = a.id
    AND b.status != 'cancelled'
);

NOTIFY pgrst, 'reload schema';
