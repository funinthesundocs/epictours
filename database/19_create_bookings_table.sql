-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    availability_id UUID NOT NULL REFERENCES public.availabilities(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    pax_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_bookings_availability_id ON public.bookings(availability_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Simple policy for now (open access like others, refine later)
CREATE POLICY "Enable all for public" ON public.bookings FOR ALL TO public USING (true) WITH CHECK (true);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
